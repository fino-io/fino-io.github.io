---
title: 16 · gRPC、生态与技术选型
description: Go 中文学习指南：gRPC、生态与技术选型，包含概念、示例、练习与验收。
pageClass: aip-article
---

# 16 · gRPC、生态与技术选型

本章目标：理解 RPC 契约与生态分工，按项目需求选择成熟工具。

## gRPC 的最小契约

HTTP JSON 便于浏览器与外部集成；gRPC 适合类型明确的服务间调用与流式场景。选型依据是调用方、网络与运维条件，不能只凭“性能更高”决定。

`task.proto` 契约示例：

```proto
syntax = "proto3";
package learning.task.v1;
option go_package = "example.com/tasks/gen/task/v1;taskv1";

service TaskService {
  rpc GetTask(GetTaskRequest) returns (Task);
}
message GetTaskRequest { int64 id = 1; }
message Task {
  int64 id = 1;
  string title = 2;
  bool done = 3;
}
```

字段编号是 wire 契约的一部分，已删除字段的编号与名字要 reserved，不重新分配给其他含义。proto3 普通标量的默认值不能总是表达“未提供”；需要字段存在性时选 optional 或合适消息模型。新增字段通常可以兼容，但语义、客户端假设和枚举未知值仍需评估。

按 [gRPC Go 官方 Quick start](https://grpc.io/docs/languages/go/quickstart/)安装 protoc、protoc-gen-go 与 protoc-gen-go-grpc，并在项目中固定工具版本。使用 `--go_out` 与 `--go-grpc_out` 生成消息与服务绑定，不手写协议序列化，也不手工修改生成文件。

## RPC 运行边界

- 调用方设置 deadline，服务实现接收 Context 并向下传递。
- 把业务错误映射为合适 status，例如 NotFound、InvalidArgument，而不是一律 Unknown。
- 生产连接使用 TLS 与合适身份认证，不沿用本地明文实验配置。
- metadata 承载请求元信息，不把密钥放进日志；跨服务传播遵循统一约定。
- unary 与 streaming 分开考虑流量控制、取消、大小限制与关闭。

重试遵循服务幂等契约，拦截器可统一日志与认证，但不能把业务规则藏进拦截器。进一步阅读站内 [截止时间](/grpc/guides/deadlines_zh)与 [错误处理](/grpc/guides/error_zh)。

## 按需求选择工具

| 需求 | 起步选择 | 需要扩展时 |
| --- | --- | --- |
| HTTP 服务 | net/http | 根据团队已有方案选择 Gin、Echo 或 chi。 |
| CLI | flag | 多子命令、补全与帮助系统使用 Cobra。 |
| PostgreSQL | database/sql + 驱动，或 pgx | 已知 SQL 可评估 sqlc 生成类型代码。 |
| 并发编排 | Mutex、Channel | 相关任务汇总错误使用 errgroup。 |
| 日志 | log/slog | 按现有日志系统选择 Zap 等。 |
| RPC | grpc-go + Protobuf | 固定生成工具与契约版本。 |
| 可观测性 | 日志、指标与 trace | 使用 OpenTelemetry 的官方 SDK。 |

工具入口：[Cobra](https://github.com/spf13/cobra)、[pgx](https://github.com/jackc/pgx)、[sqlc](https://docs.sqlc.dev/)、[OpenTelemetry Go](https://opentelemetry.io/docs/languages/go/)。选一个主要方案，验证版本要求、维护状态、许可证与团队经验；避免把多个同类库同时带入项目。

## 练习与验收

1. 给任务服务生成客户端与服务端绑定，完成 GetTask。
2. 设置很短的 deadline，验证状态码与服务端取消。
3. 写一份选型记录，说明为什么标准库足够或为何需要框架。

验收：理解契约兼容性与运行边界，第三方库解决明确问题，生成过程可复现。
