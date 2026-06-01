# 网站埋点数据字段表

本文档根据当前代码实现整理，覆盖 `participants`、`sessions`、`events`、`chat_messages` 四类可导出数据，重点说明网站埋点可获得的字段、事件类型与 `payload` 结构。

## 1. 数据输出位置

管理员通过 `/api/admin/export` 导出 zip 后，当前可获得以下文件：

| 文件 | 来源表 | 说明 |
| --- | --- | --- |
| `participants.csv` | `participants` | 被试编号及实验条件 |
| `sessions.csv` | `sessions` | 会话级信息，如 UA、脱敏 IP |
| `events.ndjson` | `events` | 网站行为埋点主表 |
| `chat_messages.ndjson` | `chat_messages` | 聊天消息正文与模型响应信息 |

另外，`/api/admin/events/export` 会把 `events` 扁平化导出为 CSV，便于直接筛选点击类字段。

## 2. 核心埋点主表：`events`

### 2.1 通用字段

所有埋点事件最终都会写入 `events` 表，字段如下：

| 字段名 | 类型 | 含义 | 说明 |
| --- | --- | --- | --- |
| `event_id` | `TEXT` | 事件唯一 ID | 服务端写入 UUID |
| `ts` | `INTEGER` | 事件时间戳 | 优先使用 `payload.client_ts`，否则退回服务端写入时间 |
| `participant_id` | `TEXT` | 被试编号 | 来自登录后的实验会话 |
| `session_id` | `TEXT` | 会话编号 | 每次 `/start` 成功进入站点后生成 |
| `turn_index` | `INTEGER` | 对话轮次 | 前端本地维护，普通浏览事件通常为当前轮次，聊天发送后递增 |
| `event_type` | `TEXT` | 事件类型 | 如 `page_view`、`add_to_cart` |
| `page` | `TEXT` | 页面路径 | 由前端显式传入，如 `/search`、`/product/123` |
| `payload` | `TEXT(JSON)` | 事件附加字段 | 服务端以 JSON 字符串存储，最大约 20000 字符 |

### 2.2 自动补充字段

前端所有通过 `track()` 上报的事件，`payload` 中都会自动追加：

| 字段名 | 类型 | 含义 |
| --- | --- | --- |
| `client_ts` | `number` | 前端触发埋点时的毫秒时间戳 |

## 3. 事件类型与字段

### 3.1 页面与点击行为

| `event_type` | 触发时机 | 主要页面 | `payload` 字段 |
| --- | --- | --- | --- |
| `page_view` | 路由切换/首次进入页面 | 全站 | `referrer`, `client_ts` |
| `ui_click` | 任意点击事件捕获 | 全站 | `x`, `y`, `target_selector`, `action_selector`, `target`, `action`, `client_ts` |
| `chat_open` | 打开右下角聊天组件 | `chat` | `at`, `client_ts` |

`ui_click.target` / `ui_click.action` 为对象，子字段如下：

| 子字段 | 类型 | 含义 |
| --- | --- | --- |
| `tag` | `string \| null` | DOM 标签名 |
| `id` | `string \| null` | 元素 ID |
| `role` | `string \| null` | ARIA role |
| `text` | `string \| null` | 元素可读文本，已做截断 |
| `classes` | `string[] \| null` | 最多前 4 个 class |
| `href` | `string \| null` | 链接地址，仅链接元素有值 |
| `type` | `string \| null` | 输入控件类型 |
| `name` | `string \| null` | 表单字段名 |
| `dataset` | `Record<string, string>` | 仅保留以 `track*` 或 `test*` 开头的 data attributes |

### 3.2 搜索与筛选行为

| `event_type` | 触发时机 | 主要页面 | `payload` 字段 |
| --- | --- | --- | --- |
| `search_submit` | 提交搜索框 | `/search` | `query`, `query_len`, `gender`, `source`, `client_ts` |
| `search_results_view` | 搜索结果页首次展示 | `/search` | `query`, `query_len`, `results_count`, `client_ts` |
| `search_result_click` | 点击搜索结果商品卡片 | `/search` | `query`, `product_id`, `rank`, `client_ts` |
| `filter_change` | 应用/重置分类筛选 | 分类页 | `color`, `size`, `minPrice`, `maxPrice`, `reset`, `client_ts` |

说明：

| 字段名 | 说明 |
| --- | --- |
| `gender` | 搜索时性别筛选，取值来自当前页面筛选条件 |
| `source` | 当前固定为 `search_box` |
| `rank` | 搜索结果点击时的结果位次 |
| `reset` | 仅重置筛选时出现，值为 `true` |

### 3.3 商品浏览与评论行为

| `event_type` | 触发时机 | 主要页面 | `payload` 字段 |
| --- | --- | --- | --- |
| `product_view` | 进入商品详情页 | `/product/[id]` | `product_id`, `category`, `price`, `brand`, `client_ts` |
| `review_expand` | 展开评论区 | `/product/[id]` | `product_id`, `client_ts` |
| `review_scroll` | 评论区滚动 | `/product/[id]` | `product_id`, `scroll_top`, `client_ts` |

说明：

| 字段名 | 说明 |
| --- | --- |
| `brand` | 当前固定写为 `UNIQLO-style` |
| `scroll_top` | 评论滚动容器的垂直滚动距离 |

### 3.4 购物车与结算行为

| `event_type` | 触发时机 | 主要页面 | `payload` 字段 |
| --- | --- | --- | --- |
| `add_to_cart` | 商品详情页点击加入购物车 | `/product/[id]` | `product_id`, `qty`, `variant`, `cart_items`, `client_ts` |
| `cart_view` | 打开购物车页 | `/cart` | `cart_items`, `client_ts` |
| `cart_qty_change` | 修改购物车数量 | `/cart` | `product_id`, `qty`, `cart_items`, `client_ts` |
| `remove_from_cart` | 从购物车移除商品 | `/cart` | `product_id`, `cart_items`, `client_ts` |
| `begin_checkout` | 点击去结算 | `/cart` | `total`, `cart_items`, `client_ts` |
| `checkout_complete` | 点击确认提交（模拟） | `/checkout` | `total`, `cart_items`, `client_ts` |

购物车相关常见对象结构：

| 对象 | 字段 | 说明 |
| --- | --- | --- |
| `variant` | `color`, `size` | 加购时选择的颜色和尺码 |
| `cart_items[]` | `id`, `name`, `price`, `qty` | 购物车条目基础字段 |
| `cart_items[].variant` | `color`, `size` | 仅在部分事件保留 |

补充说明：

| 事件 | 细节 |
| --- | --- |
| `add_to_cart` | `cart_items` 只保留 `id/name/price/qty`，不保留 `variant` |
| `cart_view` | `cart_items` 只保留 `id/name/price/qty`，不保留 `variant` |
| `cart_qty_change` | `cart_items` 为完整购物车对象，可能包含 `variant` |
| `remove_from_cart` | `cart_items` 只保留 `id/name/price/qty`，不保留 `variant` |
| `begin_checkout` | `cart_items` 为完整购物车对象，可能包含 `variant` |
| `checkout_complete` | `cart_items` 为完整购物车对象，可能包含 `variant` |

### 3.5 聊天相关事件

以下两类事件不是前端 `track()` 直接发送，而是在聊天接口成功处理后由服务端补写到 `events`：

| `event_type` | 触发时机 | `page` | `payload` 字段 |
| --- | --- | --- | --- |
| `chat_message_user` | 用户消息写入 `chat_messages` 后 | `chat` | `message_id`, `content_len` |
| `chat_message_assistant` | 助手回复写入 `chat_messages` 后 | `chat` | `message_id`, `content_len`, `request_id` |

说明：

| 字段名 | 说明 |
| --- | --- |
| `message_id` | 对应 `chat_messages.message_id` |
| `content_len` | 文本长度 |
| `request_id` | LLM 接口请求 ID，仅助手消息有值 |

## 4. 其他可导出的关联表

### 4.1 `participants`

| 字段名 | 类型 | 含义 |
| --- | --- | --- |
| `participant_id` | `TEXT` | 被试编号 |
| `cond` | `TEXT` | 实验条件，当前为 `high / low / neutral` |
| `created_at` | `INTEGER` | 创建时间戳 |
| `updated_at` | `INTEGER` | 更新时间戳 |

### 4.2 `sessions`

| 字段名 | 类型 | 含义 | 说明 |
| --- | --- | --- | --- |
| `session_id` | `TEXT` | 会话编号 | 每次进入站点新建 |
| `participant_id` | `TEXT` | 被试编号 | 可与 `participants` 关联 |
| `started_at` | `INTEGER` | 会话开始时间 | 进入 `/start` 成功后写入 |
| `last_seen_at` | `INTEGER` | 最近活跃时间 | 埋点/聊天写入时更新 |
| `user_agent` | `TEXT` | 浏览器 UA | 从请求头读取，最长约 500 字符 |
| `ip_hash` | `TEXT` | IP 哈希 | 保存脱敏后的 SHA-256 值，不保留原始 IP |

### 4.3 `chat_messages`

| 字段名 | 类型 | 含义 |
| --- | --- | --- |
| `message_id` | `TEXT` | 消息唯一 ID |
| `ts` | `INTEGER` | 消息时间戳 |
| `participant_id` | `TEXT` | 被试编号 |
| `session_id` | `TEXT` | 会话编号 |
| `turn_index` | `INTEGER` | 对话轮次 |
| `role` | `TEXT` | `user` 或 `assistant` |
| `content` | `TEXT` | 消息正文 |
| `model` | `TEXT` | 所用模型名 |
| `latency_ms` | `INTEGER` | 响应耗时，通常仅助手消息有值 |

## 5. 当前埋点能支持的分析方向

基于现有字段，当前网站埋点可以直接支持以下分析：

| 分析方向 | 可用字段 |
| --- | --- |
| 页面访问路径 | `page_view.page`, `page_view.referrer`, `session_id`, `ts` |
| 点击热区/按钮交互 | `ui_click.x`, `ui_click.y`, `target_selector`, `action_selector`, `target`, `action` |
| 搜索漏斗 | `search_submit`, `search_results_view`, `search_result_click`, `product_view` |
| 商品兴趣 | `product_id`, `category`, `price`, `review_expand`, `review_scroll` |
| 购物车转化 | `add_to_cart`, `cart_view`, `cart_qty_change`, `remove_from_cart`, `begin_checkout`, `checkout_complete` |
| 聊天使用情况 | `chat_open`, `chat_message_user`, `chat_message_assistant`, `turn_index`, `content_len` |
| 条件组对比 | `participant_id` 关联 `participants.cond` |

## 6. 当前未直接保留的数据

以下信息当前没有以结构化、可直接导出的方式完整保存：

| 信息 | 当前状态 |
| --- | --- |
| 原始 IP | 未保存，只保留 `ip_hash` |
| 聊天请求中的 `client_context.cart_items` | 用于生成回复上下文，但未单独落表 |
| 页面停留时长 | 无显式事件，需要基于相邻事件时间差估算 |
| 曝光位次/模块曝光 | 目前只有结果点击位次 `rank`，没有通用曝光埋点 |
| 表单输入过程 | 只有提交/点击，没有输入过程埋点 |

