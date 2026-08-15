---
title: 保活
description: '如何在 gRPC 中使用基于 HTTP/2 PING 的 keepalive。'
source_url: https://grpc.io/docs/guides/keepalive/
---

### 概述

基于 HTTP/2 PING 的 keepalive 是一种即使在没有数据传输时也能保持 HTTP/2 连接处于活动状态的方法。这是通过定期向连接的另一端发送 [PING 帧] 来完成的。 HTTP/2 keepalive 可以提高 HTTP/2 连接的性能和可靠性，但仔细配置 keepalive 间隔很重要。
有一个相关但独立的问题称为[健康检查]。健康检查允许服务端指示“服务”是否健康，而保持活动仅与“连接”有关。
### 背景

[TCP keepalive] 是一种众所周知的维持连接和检测断开连接的方法。启用 TCP keepalive 后，连接的任一侧都可以发送冗余数据包。一旦对方确认了连接，则认为连接良好。如果多次尝试后仍未收到 ACK，则认为连接已断开。

与 TCP keepalive 不同，gRPC 使用 HTTP/2，它提供了强制性的 [PING 帧]，可用于估计往返时间、带宽延迟乘积或测试连接。 TCP keepalive 中的间隔和重试不太适用于 PING，因为传输是可靠的，因此在基于 gRPC PING 的 keepalive 实现中，它们被替换为超时（相当于间隔 * 重试）。
服务所有者不需要支持 keepalive。 **客户端作者必须与服务所有者进行协调**以确定特定的客户端设置是否可接受。服务所有者决定他们愿意支持什么，包括是否愿意接收keepalive（如果服务不支持keepalive，则前几个keepalive ping将被忽略，服务端最终将发送一条`GOAWAY`消息，其中的调试数据等于`too_many_pings`的ASCII代码）。
### 配置 keepalive 如何影响调用

对于具有快速回复的一元 RPC，Keepalive 不太可能被触发。 Keepalive主要在存在长寿命RPC时触发，如果keepalive检查失败并且连接关闭，则该RPC将失败。

对于流式 RPC，如果连接关闭，任何正在进行的 RPC 都将失败。如果调用是流数据，则流也将被关闭，并且任何尚未发送的数据都将丢失。
为了避免 DDoSing，在设置 keepalive 配置时一定要小心。因此，建议避免在没有调用的情况下启用保活，并避免客户端将其保活配置为远低于一分钟。
### keepalive 有用的常见情况

gRPC HTTP/2 keepalive 在多种情况下都很有用，包括但不限于：

* 通过长期连接发送数据时，该连接可能被代理或负载均衡器视为空闲。
* 当网络不太可靠时（例如移动应用程序）。
* 在长时间不活动后使用连接时。

### Keepalive配置规范

|选项|可用性| 描述 |客户端默认|服务端默认值|
|---|---|---|---|---|
|`KEEPALIVE_TIME`|客户端和服务端|PING 帧之间的时间间隔（以毫秒为单位）。|INT_MAX（禁用）|7200000（2小时）|
|`KEEPALIVE_TIMEOUT`|客户端和服务端|确认 PING 帧的超时时间（以毫秒为单位）。如果发送方在这段时间内没有收到确认，它将关闭连接。|20000（20秒）|20000（20秒）|
|`KEEPALIVE_WITHOUT_CALLS`|客户|是否允许在没有任何未完成的流的情况下从客户端发送 keepalive ping。|0（假）|不适用|
|`PERMIT_KEEPALIVE_WITHOUT_CALLS`|服务端|是否允许在没有任何未完成的流的情况下从客户端发送 keepalive ping。|不适用|0（假）|
|`PERMIT_KEEPALIVE_TIME`|服务端|服务端接收连续 ping 帧而不发送任何数据/标头帧之间允许的最短时间。|不适用|300000（5分钟）|
|`MAX_CONNECTION_IDLE`|服务端|通道可能没有未完成的 RPC 的最长时间，之后服务端将关闭连接。|不适用|INT_MAX（无限）|
|`MAX_CONNECTION_AGE`|服务端|通道可以存在的最长时间。|不适用|INT_MAX（无限）|
|`MAX_CONNECTION_AGE_GRACE`|服务端|通道达到其最大寿命后的宽限期。|不适用|INT_MAX（无限）|
某些语言可能提供附加选项，请参阅语言示例和附加资源以了解更多详细信息。
### TCP 用户超时

Linux 提供了 TCP_USER_TIMEOUT 套接字选项，当发送的数据包在超时之前未能收到 TCP 确认时，该选项将导致连接失败。当启用 keepalive 时，gRPC 实现可能会自动启用 TCP_USER_TIMEOUT（或其他平台上的等效项），并对 TCP_USER_TIMEOUT 使用相同的 KEEPALIVE_TIMEOUT。这样做的优点是可以更频繁地监视连接，而无需额外的网络成本或配置。

如果使用 TCP 负载均衡器，则 TCP_USER_TIMEOUT 将仅监控 gRPC 和负载均衡器之间的连接。然而，常规的 keepalive PING 是通过 TCP 负载均衡器传播的，因此它们可以根据 TCP_USER_TIMEOUT 检测 TCP 负载均衡器“隐藏”的断开连接。

### 语言指南和示例

|语言|例子|文档|
|----------|------------------|------------------------|
|C++|[C++ 示例]|[C++ 文档]|
|Go|[Go 示例]|[Go 文档]|
|Java|[Java 示例]|[Java 文档]|
|Python|[Python 示例]|[Python 文档]|


### 其他资源

* [客户端 Keepalive 的 gRFC]
* [服务端连接管理的gRFC]
* [TCP 用户超时的 gRFC]
* [使用 gRPC 实现长寿命和流式 RPC]


[Health Checking]: https://github.com/grpc/grpc/blob/master/doc/health-checking.md
[TCP keepalive]: https://en.wikipedia.org/wiki/Keepalive#TCP_keepalive
[PING frame]: https://httpwg.org/specs/rfc7540.html#PING
[C++ Example]: https://github.com/grpc/grpc/tree/master/examples/cpp/keepalive
[C++ Documentation]: https://github.com/grpc/grpc/blob/master/doc/keepalive.md
[Go Example]: https://github.com/grpc/grpc-go/tree/master/examples/features/keepalive
[Go Documentation]: https://github.com/grpc/grpc-go/blob/master/Documentation/keepalive.md
[Java Example]: https://github.com/grpc/grpc-java/tree/master/examples/src/main/java/io/grpc/examples/keepalive
[Python Example]: https://github.com/grpc/grpc/tree/master/examples/python/keep_alive
[Python Documentation]: https://github.com/grpc/grpc/blob/master/doc/keepalive.md
[gRFC for Client-side Keepalive]: https://github.com/grpc/proposal/blob/master/A8-client-side-keepalive.md
[gRFC for Server-side Connection Management]: https://github.com/grpc/proposal/blob/master/A9-server-side-conn-mgt.md
[gRFC for TCP User Timeout]: https://github.com/grpc/proposal/blob/master/A18-tcp-user-timeout.md
[Using gRPC for Long-lived and Streaming RPCs]: https://www.youtube.com/watch?v=Naonb2XD_2Q
[Java Documentation]: https://grpc.github.io/grpc-java/javadoc/io/grpc/ManagedChannelBuilder.html#keepAliveTime-long-java.util.concurrent.TimeUnit-
