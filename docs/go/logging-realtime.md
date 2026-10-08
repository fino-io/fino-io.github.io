---
title: 30 · 日志与实时通信生态
description: slog、Zap、Zerolog、Melody 和 Centrifugo。
pageClass: aip-article
---

# 30 · 日志与实时通信生态

学习前应能完成：[HTTP 服务与 Web 框架](./web)、[Channel、缓冲与 select](./channels)。

roadmap 的日志与实时通信是两类独立工程能力。本章把每个库放进明确数据流，并说明用它之后仍要设计哪些边界。

## slog：稳定事件与字段

```go
package main

import (
	"log/slog"
	"os"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	requestLog := logger.With("request_id", "demo-001", "component", "task-api")
	requestLog.Info("任务创建", "task_id", 7, "duration_ms", 12)
}
```

输出是一行 JSON，含 time、level、msg 与指定字段；时间变化，不对整行做固定字符串断言。日志消息是稳定事件名，字段承载检索值。JSON 日志交给现有采集平台，不在应用里手写复杂采集器。

错误在合适边界记录一次，expected not found 可以按业务需要用较低等级；凭据、Cookie、原始请求体不无条件记录。高频循环日志可采样，debug 不作为生产诊断唯一来源。

## Zap 与 Zerolog 的具体使用

| 方案 | API 示例 | 注意 |
| --- | --- | --- |
| [Zap](https://github.com/uber-go/zap) | logger.Info("任务创建", zap.Int("task_id", id)) | 类型字段；生产配置、采样与输出策略按项目决定。 |
| [Zerolog](https://github.com/rs/zerolog) | logger.Info().Int("task_id", id).Msg("任务创建") | 链式事件需以 Msg 等完成，不共享修改事件对象。 |
| [slog](https://pkg.go.dev/log/slog) | logger.Info("任务创建", "task_id", id) | 标准库 Handler 模型，检查键值配对。 |

Zap 片段：

```go
logger, err := zap.NewProduction()
if err != nil { return err }
defer func() { _ = logger.Sync() }()
logger.Info("任务创建", zap.Int("task_id", id))
```

输出目标的 Sync 语义依环境而异，处理策略与部署系统一致。不是为了“零分配”宣传就换日志库，用真实负载比较成本。与团队已有体系一致时选一个主方案，通过边界替换，避免同一请求被多套 logger 重复记录。

## WebSocket：连接是一段生命周期

一个连接包含认证、升级、订阅、收发、心跳、断开和清理。HTTP handler 返回不意味着 WebSocket 已关闭。慢消费者需要发送队列上限、丢弃或断开策略；广播给每个客户端不应阻塞整个服务。请求 Origin 校验、消息大小与频率、重连游标都必须定义。

### Melody：进程内会话管理

[Melody](https://github.com/olahol/melody)封装 WebSocket 会话与广播。典型片段 `m := melody.New()`，HTTP 路由里 `m.HandleRequest(w,r)`，消息回调 `m.HandleMessage(...)`。认证与授权必须在升级前或连接握手协议中完成；回调收到的任意消息不能直接广播给所有用户，先确认房间与归属。

单进程会话列表不等于跨实例广播；多个实例需要共享消息层与连接分布策略。不要因 API 很短就省略断开、慢连接和资源检查。

### Centrifugo：独立实时服务

[Centrifugo](https://github.com/centrifugal/centrifugo)把客户端连接、通道订阅与多实例实时分发移到独立服务。业务 API 生成受限连接/订阅授权，后端发布事件，客户端订阅允许的通道。签名 secret 只在服务端，权限和 token 到期策略明确，HTTP API key 不放进浏览器。

它与 npm 中的 [Centrifuge 客户端](https://www.npmjs.com/package/centrifuge)配合时，npm 包负责浏览器连接，不替代 Go 服务端。Go 教材不会因提到 npm 就用 JavaScript 库重写 Go 能力。消息顺序、恢复窗口与重放按实际配置验证，不能假设实时通信天然保证所有事件送达。

## 学习实验与判定 {#lab}

1. 给 API 增加 request_id、状态与耗时日志，用 JSON 解析检查字段，屏蔽 secret。
2. 设计两个用户两个房间，验证用户 A 不能订阅 B 的任务事件。
3. 模拟慢连接，发送队列达到上限后按契约断开或丢弃，记录指标。
4. 选择 Melody 或 Centrifugo，说明是否多实例、是否需要重连恢复，给出失败场景测试。

通过标准：每个库解决具体职责，日志和实时事件都有边界与权限策略。
