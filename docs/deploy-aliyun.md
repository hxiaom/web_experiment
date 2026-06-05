# 阿里云部署指南

本文档面向当前 `web_experiment` 项目：Next.js standalone + Docker Compose + SQLite。

## 推荐方案

先用一台 ECS 跑 Docker Compose，宿主机或云产品负责 HTTPS 反向代理：

```text
浏览器 -> HTTPS 443 -> Nginx/负载均衡 -> Docker 容器 :3000 -> SQLite /app/data/app.db
```

这个方案适合小到中等规模实验，例如几十人到一两百人同时在线。应用本身主要是页面浏览、埋点写入和等待外部 LLM 接口返回；真正的瓶颈通常会先出现在 LLM API 限流/延迟和 SQLite 写入队列，而不是 Next.js 页面渲染。

如果预计更高并发、多个实验场次重叠，或需要多台 ECS 横向扩容，不要让多台机器共享 SQLite。应改为：

- RDS PostgreSQL/MySQL 存储 `participants`、`sessions`、`events`、`chat_messages`
- SLB/ALB 放在多台 ECS 前面
- 可选：Redis/消息队列缓冲高频埋点

## ECS 配置建议

保守起步：

| 场景 | 建议 |
| --- | --- |
| 试运行、几十人 | 2 vCPU / 4 GB RAM |
| 正式实验、一两百人在线 | 4 vCPU / 8 GB RAM |
| 更高并发或聊天很频繁 | 8 vCPU / 16 GB RAM，并准备迁移 RDS |

磁盘建议至少 40 GB，数据盘或系统盘都可以，但必须定期备份 `web_experiment/data/`。如果实验数据很重要，建议使用独立云盘并开启快照。

## 安全组

入方向建议：

| 端口 | 来源 | 用途 |
| --- | --- | --- |
| 22 | 只允许你的固定 IP | SSH 管理 |
| 80 | 0.0.0.0/0 | HTTP 跳转 HTTPS、证书申请 |
| 443 | 0.0.0.0/0 | 实验站正式访问 |
| 3000 | 不开放公网 | 仅本机 Nginx 反代到容器 |

不要在正式实验时把 `3000` 暴露给公网。当前代码在生产环境会设置 `Secure` cookie，正式入口应使用 HTTPS；直接访问 `http://公网IP:3000` 可能导致登录态无法保存。

如果只是临时通过 `http://公网IP:3000` 自测后台，可在 `.env` 加 `COOKIE_SECURE=false` 后重启容器。这个开关只适合短期调试；正式实验请删除该项或设为 `true`，并通过 `https://域名` 访问。

## 服务器初始化

下面以 Ubuntu/Alibaba Cloud Linux 均可理解的流程描述。具体 Docker 安装命令可按阿里云官方文档选择系统版本。

```bash
sudo mkdir -p /opt/web_experiment
sudo chown -R "$USER":"$USER" /opt/web_experiment
```

上传代码可二选一：

```bash
# 方案 A：服务器上 git clone
cd /opt
git clone https://github.com/hxiaom/web_experiment.git web_experiment
cd /opt/web_experiment
```



```bash
# 方案 B：本机打包上传
cd /Users/hxiaom/Downloads/LLM_recommendation
tar --exclude='web_experiment/node_modules' --exclude='web_experiment/.next' --exclude='web_experiment/data' -czf web_experiment.tar.gz web_experiment
scp web_experiment.tar.gz root@<ECS公网IP>:/opt/
```

## 生产环境变量

在服务器的 `web_experiment` 目录创建 `.env`：

```bash
cp .env.example .env
```

编辑成类似下面这样：

```env
ADMIN_PASSWORD=换成强密码
SESSION_SECRET=换成至少32字节的随机字符串
DB_PATH=/app/data/app.db

LLM_BASE_URL=https://api.minimaxi.com/v1
LLM_API_KEY=你的-MiniMax-API-Key
LLM_MODEL=MiniMax-M3

PUBLIC_BASE_URL=https://你的域名
LLM_TIMEOUT_MS=30000
```

MiniMax 文档中的 OpenAI 兼容接口为 `https://api.minimaxi.com/v1/chat/completions`；
本项目只需要在 `LLM_BASE_URL` 填到 `/v1`，代码会自动拼接 `/chat/completions`。

可用下面命令生成 `SESSION_SECRET`：

```bash
openssl rand -base64 48
```

## 启动应用

```bash
cd /opt/web_experiment
mkdir -p data
docker compose up -d --build
docker compose ps
docker compose logs -f web
```

本机自检：

```bash
curl -I http://127.0.0.1:3000/start
```

如果只想短暂测试公网连通，可以临时把 compose 的端口改成 `80:3000`，但正式实验仍建议用 HTTPS。

## Nginx 反向代理

如果你在 ECS 上直接安装 Nginx，可用下面配置作为模板：

```nginx
server {
    listen 80;
    server_name example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 90s;
    }
}
```

证书可以用阿里云数字证书管理服务，也可以用 Certbot。证书路径按你的实际部署方式调整。

## 入网规则

登录阿里云控制台 → 安全组 sg-8vba8362n910orl1njus → 入站规则
确认是否有"3000 / 0.0.0.0"的规则

## 数据备份

实验开始前先确认 `data/app.db` 会落在宿主机：

```bash
ls -lh data/
```

建议每天或每场实验后备份：

```bash
mkdir -p backups
sqlite3 data/app.db ".backup 'backups/app-$(date +%Y%m%d-%H%M%S).db'"
```

如果服务器没装 `sqlite3`，可以先安装，或直接停止容器后复制 `data/app.db`、`data/app.db-wal`、`data/app.db-shm`。实验进行中复制 SQLite 文件时，优先用 `.backup`，不要只复制单个 `app.db`。

## 上线前检查清单

- `/start` 能打开
- `/admin/login` 能登录
- `/admin/participants` 能创建或导入被试条件
- 被试从 `/start` 输入编号后能进入站点
- 聊天助手能正常返回，且 LLM API 没有限流报错
- `/api/admin/export` 能下载 zip
- `data/app.db` 在宿主机存在，并已做一次备份演练
- ECS 安全组没有向公网开放 `3000`
- 正式链接是 `https://...`，不是 `http://...`

## 并发压测建议

上线前可以用轻量工具压测页面和埋点接口，但聊天接口会消耗真实 LLM 配额，压测时要谨慎。

页面入口可先测：

```bash
curl -I https://你的域名/start
```

更严肃的压测建议分两层：

- 静态/页面访问：测 `/start`、首页、商品页
- 业务链路：少量真实被试编号测试 `/start`、搜索、加购、聊天、导出

如果压测时出现 `database is locked`、聊天大量 502、或 LLM 延迟明显上升，优先检查 LLM 服务配额，其次考虑把 SQLite 迁移到 RDS。




## ECS 实例创建示例

下面是一个实际创建的 ECS 实例配置供参考：

| 项目 | 值 |
| --- | --- |
| 付费方式 | 按量付费 |
| 地域 | 华北3（张家口） |
| 可用区 | 张家口 可用区B |
| 实例规格 | 计算型 c9i / ecs.c9i.large (2 vCPU / 4 GiB) |
| 镜像 | Ubuntu 24.04 64位（非安全加固） |
| 系统盘 | ESSD 云盘 40GiB，PL0，随实例释放 |
| 文件备份 | 激活备份 |
| 公网带宽 | 按使用流量 50Mbps |
| 登录凭证 | 密钥对（sysu） |
| 专有网络（VPC） | vpc-8vb0icc5dor1v1nyc35qv |
| 交换机 | vsw-8vb57v3ku4zxtde8gpzl8 |
| 安全组 | sg-8vba8362n910orl1njus |
| 弹性网卡 | eth0 |
| CPU选项 | 每核心线程数 2，核心计数 1 |
| 实例名称 | launch-advisor-20260601 |
| 实例释放保护 | 否 |
| 元数据访问模式 | 普通模式和加固模式 |
