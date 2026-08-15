---
title: 元数据
description: '解释什么是元数据、它如何传输以及它的用途。'
source_url: https://grpc.io/docs/guides/metadata/
---
### 概述

元数据是一种侧通道，允许客户端和服务端相互提供与 RPC 相关的信息。

gRPC 元数据是与初始或最终 gRPC 请求或响应一起发送的键值对数据。它用于提供有关调用的附加信息，例如认证凭据、跟踪信息或自定义标头。

gRPC 元数据是使用 HTTP/2 标头实现的。键是 ASCII 字符串，而值可以是 ASCII 字符串或二进制数据。密钥不区分大小写，并且不得以前缀 `grpc-` 开头，该前缀是为 gRPC 本身保留的。

gRPC 元数据可以由客户端和服务端发送和接收。标头在初始请求之前从客户端发送到服务端，在 RPC 调用的初始响应之前从服务端发送到客户端。服务端关闭 RPC 时会发送尾部。

gRPC 元数据可用于多种目的，例如：

* **认证**：gRPC 元数据可用于发送认证
服务端的凭据。   这可用于实现不同的认证方案，例如使用标准 HTTP 授权标头的 `OAuth2` 或 `JWT`。
* **跟踪**：gRPC 元数据可用于将跟踪信息发送到
服务端。   这可用于通过分布式系统跟踪请求的进度。
* **自定义标头**：gRPC 元数据可用于将自定义标头发送到
服务端或从服务端到客户端。   这可用于实现特定于应用程序的功能，例如负载均衡、速率限制或从服务端向客户端提供详细的错误消息。
* **内部用法**：gRPC 使用 HTTP/2 标头和尾部，这将是
与您的应用程序指定的元数据集成。

参见[核心概念](https://grpc.io/docs/what-is-grpc/core-concepts/#metadata)

#### 注意

```
WARNING: Servers may limit the size of Request-Headers, with a default of 8 KiB suggested.
```

自定义元数据必须遵循 [PROTOCOL-HTTP2](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md) 中列出的“自定义元数据”格式，但二进制标头不需要进行 Base64 编码。

#### 标题

标头在从客户端到服务端的初始请求数据消息之前发送，并且类似地在从服务端到客户端的初始响应数据之前发送。标头包含认证凭据以及如何处理 RPC 等内容。某些标头（例如授权）是由 gRPC 为您生成的。

自定义标头处理与语言相关，通常通过[拦截器](https://grpc.io/docs/guides/interceptors/)。

#### 预告片

尾部是一种特殊的标头，在消息数据之后发送。它们在内部用于传达 RPC 的结果。在应用程序级别，自定义预告片可用于传达不直接属于数据的内容，例如服务端利用率和查询成本。  预告片仅由服务端发送。

### 有关更多详细信息，请参阅以下 gRFC

* [提案：G1真正的二进制元数据][提案G1]
* [提案：L7 go 元数据 api][提案 L7]
* [提案：L48节点元数据选项][提案L48]
* [提案：L42 python 元数据标志][提案 L42]
* [提案：L11红宝石拦截器][提案L11]

### 语言支持

|语言|示例|笔记|
|----------|--------------------------------------------|--------------------|
|Java|[Java 标头]<br>[Java 错误处理]|                    |
|Go|[Go元数据]<br>[Go元数据拦截器]|[Go 文档]|
|C++|[C++ 元数据]|                    |
|节点|[节点元数据]|                    |
|Python|[Python元数据]|                    |
|红宝石|                                            |即将推出的示例|

[proposal L7]: https://github.com/grpc/proposal/blob/7c05212d14f4abef5f74f71695f95ba8dd3f7dd3/L7-go-metadata-api.md

[proposal G1]: https://github.com/grpc/proposal/blob/7c05212d14f4abef5f74f71695f95ba8dd3f7dd3/G1-true-binary-metadata.md

[proposal L48]: https://github.com/grpc/proposal/blob/7c05212d14f4abef5f74f71695f95ba8dd3f7dd3/L48-node-metadata-options.md

[proposal L42]: https://github.com/grpc/proposal/blob/7c05212d14f4abef5f74f71695f95ba8dd3f7dd3/L42-python-metadata-flags.md

[proposal L11]: https://github.com/grpc/proposal/blob/7c05212d14f4abef5f74f71695f95ba8dd3f7dd3/L11-ruby-interceptors.md

[Java Header]: https://github.com/grpc/grpc-java/tree/master/examples/src/main/java/io/grpc/examples/header

[Java Error Handling]: https://github.com/grpc/grpc-java/tree/master/examples/src/main/java/io/grpc/examples/errorhandling

[Node Metadata]: https://github.com/grpc/grpc-node/tree/master/examples/metadata

[Go Metadata]: https://github.com/grpc/grpc-go/tree/master/examples/features/metadata

[Go Metadata interceptor]: https://github.com/grpc/grpc-go/tree/master/examples/features/metadata_interceptor

[C++ Metadata]: https://github.com/grpc/grpc/tree/master/examples/cpp/metadata

[Python Metadata]: https://github.com/grpc/grpc/tree/master/examples/python/metadata

[Go Documentation]: https://github.com/grpc/grpc-go/blob/master/Documentation/grpc-metadata.md
