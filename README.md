## 优衣库风格实验站（web_experiment）

本目录是一个可部署到阿里云的全栈 Web 应用：
- PC 端“优衣库风格”电商浏览/搜索/加购/结算（模拟）
- 右下角 AI 购物助手（真实 LLM API，OpenAI-兼容 Chat Completions）
- 全量埋点写入 SQLite，后台分配条件（high/low/neutral）与导出数据

### 1) 本地运行（开发）

```bash
cd web_experiment
cp .env.example .env
# 填好 .env 后
npm install
npm run dev
```

如果你本机 `npm` 缓存权限异常，可用本地缓存目录：
```bash
NPM_CONFIG_CACHE=$PWD/.npm-cache npm install
```

访问：
- 被试入口：`/start`
- 管理后台：`/admin/login`

如需重新同步优衣库中国站男装与女装“休闲外套”分类页的公开商品数据：
```bash
python3 scripts/sync_uniqlo_casual_outerwear.py
```

### 2) 实验基本流程（建议）
1. 管理员登录 `/admin/login`，在 `/admin/participants` 为 `participant_id` 分配 `cond ∈ {high, low, neutral}`。
2. 被试在 `/start` 输入 `participant_id` 进入站点，随后自由浏览/搜索/加购并使用右下角聊天助手。
3. 管理员点击 `Export`（或直接访问 `/api/admin/export`）下载 zip：
   - `participants.csv`
   - `sessions.csv`
   - `events.ndjson`
   - `chat_messages.ndjson`

埋点与导出字段说明见 [docs/tracking-data-fields.md](./docs/tracking-data-fields.md)。

### 3) Docker 部署（单机 + SQLite）

```bash
cd web_experiment
cp .env.example .env
docker compose up -d --build
```

SQLite 数据默认写入容器内 `/app/data/app.db`，通过 `docker-compose.yml` 挂载到宿主机 `web_experiment/data/`。

阿里云 ECS 部署步骤、HTTPS 反向代理、并发与备份建议见 [docs/deploy-aliyun.md](./docs/deploy-aliyun.md)。

### 重要说明
- 该站点仅用于研究模拟环境，不代表任何真实品牌或官方站点。
- 当前商品名称、价格、类目基于优衣库中国站男装与女装“休闲外套”分类页公开商品信息整理；本次同步基准日期为 2026 年 4 月 15 日。
- 当前商品主图使用优衣库中国站公开商品图片地址；若远程图片加载失败，前端会自动回退到本地 SVG 占位图。
