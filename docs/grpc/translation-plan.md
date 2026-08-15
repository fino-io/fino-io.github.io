---
title: gRPC 全量翻译计划
outline: [2, 3]
---

# gRPC 全量翻译计划

本计划覆盖当前 `upstream/grpc.io` 快照中的全部 Guides 与 Blog 内容。该基线范围已经完成：24 篇 Guides 与 59 篇 Blog 共 83 篇文章。每篇中文页面以 `_zh` 结尾，英文原文保留无后缀页面，并通过页首语言按钮双向切换。

## 范围与基线

- 范围仅限 gRPC 官方 [Guides](https://grpc.io/docs/guides/) 与 [Blog](https://grpc.io/blog/)。
- 以仓库中的官方原文快照作为本轮全量翻译基线；新增上游文章进入后续同步批次，不阻塞当前范围验收。
- 不翻译语言教程、API Reference、安装文档及其他不在上述两个目录内的内容。

## 翻译状态

基线范围内全部条目均为“已发布”。后续上游更新使用以下状态维护：

当前基线已完成：24 篇 Guides、59 篇 Blog 均已生成 `_zh.md` 译文，并已纳入英文镜像同步范围，状态为“已发布”。

| 状态 | 含义 |
| --- | --- |
| 待翻译 | 尚未开始中文译文 |
| 初译 | 中文正文已完成，等待技术校对 |
| 待校对 | 等待术语、链接与格式复核 |
| 已发布 | 中英文页面可切换并通过构建验证 |
| 待复核 | 官方原文更新，需要复查中文译文 |

## 已完成范围

### Guides：24/24

- Deadlines
- Error Handling
- Status Codes
- Metadata
- Retry
- Health Checking
- Keepalive
- Interceptors
- Graceful Shutdown

覆盖认证、截止时间、错误处理、健康检查、拦截器、重试、服务配置、可观测性与性能等全部官方 Guides。

### Blog：59/59

覆盖 2015 至 2026 年当前快照中的全部官方 Blog 文章，并按发布日期归档。

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
