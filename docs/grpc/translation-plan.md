---
title: gRPC 全量翻译计划
outline: [2, 3]
---

# gRPC 全量翻译计划

本计划覆盖当前 `upstream/grpc.io` 快照中的全部 Guides 与 Blog 内容。每篇完成后的中文页面以 `_zh` 结尾，英文原文保留无后缀页面，并通过页首语言按钮双向切换。

## 范围与基线

- 范围仅限 gRPC 官方 [Guides](https://grpc.io/docs/guides/) 与 [Blog](https://grpc.io/blog/)。
- 以仓库中的官方原文快照作为本轮全量翻译基线；新增上游文章进入后续同步批次，不阻塞当前范围验收。
- 不翻译语言教程、API Reference、安装文档及其他不在上述两个目录内的内容。

## 翻译状态

每篇文章在翻译清单中维护以下状态：

| 状态 | 含义 |
| --- | --- |
| 待翻译 | 尚未开始中文译文 |
| 初译 | 中文正文已完成，等待技术校对 |
| 待校对 | 等待术语、链接与格式复核 |
| 已发布 | 中英文页面可切换并通过构建验证 |
| 待复核 | 官方原文更新，需要复查中文译文 |

## Guides

### 第一批：核心可靠性与可观测性

- Deadlines
- Error Handling
- Status Codes
- Metadata
- Retry
- Health Checking
- Keepalive
- Interceptors
- Graceful Shutdown

### 第二批：通用运行行为

- Authentication
- Cancellation
- Compression
- Flow Control
- Service Config
- Wait-for-Ready
- Reflection
- Performance Best Practices

### 第三批：高级能力

- Benchmarking
- Debugging
- OpenTelemetry Metrics
- Custom Backend Metrics
- Custom Load Balancing Policies
- Custom Name Resolution
- Request Hedging

每完成一篇，在 `docs/grpc/guides/<slug>_zh.md` 新增译文；同步脚本据此生成对应的英文页面 `/grpc/guides/<slug>`。

## Blog

Blog 按发布日期从新到旧推进：

1. 优先完成最新年份文章，确保首页内容对中文读者有时效性。
2. 再按年份倒序完成剩余历史文章。
3. 每完成一个年份，更新 Blog 目录的年份分组和完成度。

每篇译文位于 `docs/grpc/blog/<slug>_zh.md`；对应英文页面为 `/grpc/blog/<slug>`。

## 翻译与校对规范

- 保持 RPC、deadline、timeout、stream、stub、interceptor、metadata、retry、hedging、load balancing、service config 等术语全站一致。
- 代码、命令、协议字段、状态码、库名和产品名保持原样；关键术语首次出现可使用“中文（英文）”。
- 保留原文日期、作者、版本背景、数据与外部链接，避免将历史信息改写为当前结论。
- 每篇发布前检查中文可读性、术语一致性、链接有效性、代码块完整性和 Markdown 渲染。

## 同步与验收

1. 同步脚本只为已有 `_zh.md` 的页面生成英文镜像，避免将未翻译内容误收录为中文站文章。
2. 对上游原文变动的已翻译文章标记“待复核”，不自动覆盖译文。
3. 每批完成后执行 `npm run docs:build`。
4. 验证中英文页面双向切换、Guides/Blog 顶部导航、侧栏条目、图片、链接、表格和代码块。
5. 最终验收标准：基线范围内所有文章均为“已发布”，不存在缺少中英文任一页面的已收录条目。
