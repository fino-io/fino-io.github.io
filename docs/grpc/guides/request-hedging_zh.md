---
title: 请求对冲
description: '解释什么是请求对冲以及如何配置它。'
source_url: https://grpc.io/docs/guides/request-hedging/
---

### 概述

请求对冲是 gRPC 支持的两种可配置重试策略之一。通过请求对冲，gRPC 客户端将同一请求的多个副本发送到不同的后端，并使用它收到的第一个响应。随后，客户端取消任何未完成的请求并将响应转发给应用程序。

![基本请求对冲图解](https://grpc.io/img/basic_hedge.svg)

### 用例

请求对冲是一种减少大规模分布式系统中尾部延迟的技术。虽然简单的实现可能会给后端服务端增加显着的负载，但有可能在仅适度增加负载的情况下获得大部分延迟减少效果。

有关尾部延迟的深入讨论，请参阅 Jeff Dean 和 Luiz André Barroso 撰写的开创性文章 [The Tail At Scale]。


#### 在 gRPC 中配置请求对冲

请求对冲可通过 [gRPC Service Config] 以每个方法的粒度进行配置。该配置包含以下旋钮：

```
"hedgingPolicy": {
  "maxAttempts": INTEGER,
  "hedgingDelay": JSON proto3 Duration type,
  "nonFatalStatusCodes": JSON array of grpc status codes (int or string)
}
```

- `maxAttempts`：等待时正在进行的请求的最大数量
成功响应。这是必填字段，必须指定。如果指定的值大于 `5`，则 gRPC 使用 `5` 的值。
- `hedgingDelay`：客户端发送之前需要经过的时间量
等待成功响应时发送下一个请求。该字段是可选的，如果未指定，则会导致同时发出的请求数为 `maxAttempts`。
- `nonFatalStatusCodes`：grpc 状态码的可选列表。如果有任何请求对冲
请求失败，状态码不在此列表中，所有未完成的请求将被取消，响应将返回到应用程序。

#### 请求对冲策略

当应用程序发出在服务配置中包含 `hedgingPolicy` 配置的 RPC 调用时，将立即发送原始 RPC，就像标准的非请求对冲调用一样。在经过 `hedgingDelay` 且未成功响应后，将发出第二个 RPC。如果在 `hedgingDelay` 再次过去后，两个 RPC 都没有收到响应，则发送第三个 RPC，依此类推，直到 `maxAttempts`。 gRPC 调用截止时间适用于整个请求对冲请求链。一旦超过截止时间，无论正在进行的 RPCS 以及请求对冲配置如何，操作都会失败。

当收到成功的响应（响应任何请求对冲请求）时，所有未完成的请求对冲请求都将被取消，并且响应将返回到客户端应用程序层。

如果从请求对冲请求收到带有非致命状态码（由 `nonFatalStatusCodes` 字段控制）的错误响应，则立即发送下一个请求对冲请求，从而缩短其请求对冲延迟。如果收到任何其他状态码，则取消所有未完成的 RPC，并将错误返回到客户端应用程序层。

如果请求对冲 RPC 的所有实例都失败，则不会进行额外的重试尝试。本质上，请求对冲可以看作是在收到失败之前重试原始 RPC。

如果接收到指定不重试的服务端推送以响应请求对冲请求，则不应为该调用发出进一步的请求对冲请求。

#### 限制请求对冲 RPC

gRPC 提供了一种限制请求对冲 RPC 以防止服务端过载的方法。还可以通过服务配置以及使用 `RetryThrottlingPolicy` 消息来配置限制。节流配置包含以下内容：

```
"retryThrottling": {
  "maxTokens": 10,
  "tokenRatio": 0.1
}
```

对于每个服务端名称，gRPC 客户端都会维护一个 `token_count`，该名称最初设置为 `max_tokens`。每个传出 RPC（无论调用什么服务或方法）都会更改 `token_count`，如下所示：
- 每个失败的 RPC 都会将 `token_count` 减少 `1`。
- 每次成功的 RPC 都会将 `token_count` 增加 `token_ratio`。
 
通过请求对冲，第一个请求始终会发出，但仅当 `token_count` 大于阈值（定义为 `max_tokens / 2`）时才会发送后续请求对冲请求。如果 `token_count` 小于或等于阈值，则请求对冲请求不会阻塞。相反，它们会被取消，并且如果没有其他已发送的请求对冲 RPC，则会将失败返回给客户端应用程序。

唯一被计为限制策略失败的请求是那些失败且状态码符合非致命状态码的请求，或者收到指示不重试的推回响应的请求。这可以避免将服务端故障与对格式错误的请求（例如 `INVALID_ARGUMENT` 状态码）的响应混为一谈。


#### 服务端推送

服务端可以通过在对客户端的响应中设置元数据来显式地推送。如果拒绝表明不要重试，则不会发送进一步的请求对冲请求。如果推回要求在给定的延迟后重试，则将在给定的延迟过去后发出下一个请求对冲请求（如果有）。

服务端推回是使用元数据键 `grpc-retry-pushback-ms` 指定的。该值是一个 ASCII 编码的有符号 32 位整数，没有不必要的前导零，表示在发送下一个请求对冲请求之前要等待多少毫秒。如果推回的值为负数或不可解析，则它将被视为服务端要求客户端根本不要重试。

### 资源

- [规模尾巴]
- [gRPC服务配置]
- [gRPC重试设计]

### 语言支持

|语言|例子|
|----------|---------------------|
|Java|[Java 示例]|
|C++|尚不可用|
|Go|尚不支持|

[The Tail At Scale]: https://research.google/pubs/pub40801/
[gRPC Service Config]: https://github.com/grpc/grpc/blob/master/doc/service_config.md 
[gRPC Retry Design]: https://github.com/grpc/proposal/blob/master/A6-client-retries.md
[Java example]: https://github.com/grpc/grpc-java/tree/master/examples/src/main/java/io/grpc/examples/hedging
