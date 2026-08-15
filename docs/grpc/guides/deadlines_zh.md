---
title: Deadlines：截止时间
description: 使用截止时间有效应对不可靠的后端。
source_url: https://grpc.io/docs/guides/deadlines/
---

# Deadlines：截止时间

截止时间（deadline）指定了客户端不愿再等待服务端响应的时刻。这个简单的机制对构建可靠的分布式系统非常重要：客户端不会无谓等待，服务端也知道何时该放弃处理，从而改善资源利用率和延迟。

某些语言的 API 使用 deadline，另一些则使用 timeout（超时）。deadline 是调用不可越过的绝对时间点；timeout 是调用可持续的最长时间。应用发起调用时，可以把 timeout 加到当前时间以换算为 deadline。下文统一使用“截止时间”。

## 客户端的截止时间

gRPC 默认不设置截止时间，因此客户端可能会无限期等待响应。客户端应始终显式设置符合实际情况的截止时间。通常先根据网络延迟、服务端处理时间等已知信息估算，再通过负载测试验证。

服务端处理请求超过截止时间时，客户端会放弃等待，并以 `DEADLINE_EXCEEDED` 状态使 RPC 失败。

## 服务端的截止时间

客户端可能设置短到服务端不可能及时响应的截止时间。继续处理这类请求只会浪费资源，极端情况下还可能导致服务端故障。客户端设置的截止时间过去后，gRPC 服务端会自动取消该调用（`CANCELLED` 状态）。

服务端应用本身仍须停止为该 RPC 启动的工作。对于长时间运行的任务，应定期检查发起它的 RPC 是否已被取消，并在取消后停止处理。

### 截止时间传播

当服务端还需要调用另一项服务才能产生响应时，它也应遵守原始客户端的截止时间。部分 gRPC 实现支持将入站 RPC 的截止时间自动传播到出站调用：有的语言需要显式启用（如 C++），有的默认启用（如 Java 和 Go）。这样可以避免在每个出站调用中手动传递截止时间。

截止时间是绝对时间点，直接在服务器间传播会受时钟不同步影响。gRPC 会将它转换成已扣除经过时间的 timeout 后再传播，因此能避免时钟偏差问题。

## 语言支持

| 语言 | 示例 |
| --- | --- |
| Java | [Java 示例](https://github.com/grpc/grpc-java/tree/master/examples/src/main/java/io/grpc/examples/deadline) |
| Go | [Go 示例](https://github.com/grpc/grpc-go/tree/master/examples/features/deadline) |
| C++ | [C++ 示例](https://github.com/grpc/grpc/tree/master/examples/cpp/deadline) |
| Python | [Python 示例](https://github.com/grpc/grpc/tree/master/examples/python/timeout) |

## 其他资源

- [gRPC and Deadlines](https://grpc.io/blog/deadlines/)
