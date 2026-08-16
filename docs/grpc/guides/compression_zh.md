---
title: 压缩
description: '如何在使用 gRPC 时压缩通过线路发送的数据。'
source_url: https://grpc.io/docs/guides/compression/
---

### 概述

压缩用于减少对等体之间通信时使用的带宽量，并且可以根据所有语言的调用或消息级别启用或禁用。对于某些语言，还可以在通道级别控制压缩设置。不同的语言还支持不同的压缩算法，包括定制的压缩器。

### 同行之间的压缩方法不对称

gRPC 允许非对称压缩通信，因此响应可以与请求以不同的方式压缩，或者根本不压缩。 gRPC 对等方可以选择使用与请求不同的压缩方法进行响应，包括不执行任何压缩，无论通道和 RPC 设置如何（例如，压缩是否会导致较小或负的增益）。

如果客户端消息由服务端不支持的算法压缩，则该消息将在服务端上导致 `UNIMPLEMENTED` 错误状态。服务端将在响应中包含 `grpc-accept-encoding` 标头，该标头指定服务端接受的算法。

如果使用 `grpc-accept-encoding` 标头中的算法之一压缩客户端消息，并且从服务端返回 `UNIMPLEMENTED` 错误状态，则错误原因将与压缩无关。

请注意，对等方可以选择不公开其支持的所有编码。但是，如果它收到以未公开但受支持的编码压缩的消息，它将在响应的 `grpc-accept-encoding` 标头中包含所述编码。

对于请求服务端使用其知道客户端不支持的算法进行压缩的每条消息（如从客户端收到的最后一个 `grpc-accept-encoding` 标头所示），它将发送未压缩的消息。

### 特定的压缩禁用

如果用户请求禁用压缩，则下一条消息将不压缩地发送。这对于防止[BEAST]和[CRIME]攻击很有帮助。这适用于一元和流式情况。

### 语言指南和示例


|语言|例子|文档|
|----------|------------------|------------------------|
|C++|[C++ 示例]|[C++ 文档]|
|Go|[Go 示例]|[Go 文档]|
|Java|[Java 示例]|[Java 文档]|
|Python|[Python 示例]|[Python 文档]|


### 其他资源

* [gRPC 压缩](https://github.com/grpc/grpc/blob/master/doc/compression.md)
* [gRPC（核心）压缩手册](https://github.com/grpc/grpc/blob/master/doc/compression_cookbook.md#per-call-settings)
* [Python 压缩 API 的 gRFC](https://github.com/grpc/proposal/blob/master/L46-python-compression-api.md)

[C++ 示例]: https://github.com/grpc/grpc/tree/master/examples/cpp/compression
[C++ 文档]: https://github.com/grpc/grpc/tree/master/examples/cpp/compression
[Go 示例]: https://github.com/grpc/grpc-go/tree/master/examples/features/compression
[Go 文档]: https://github.com/grpc/grpc-go/blob/master/Documentation/compression.md
[Java 示例]: https://github.com/grpc/grpc-java/tree/master/examples/src/main/java/io/grpc/examples/experimental
[Python 示例]: https://github.com/grpc/grpc/tree/master/examples/python/compression
[Python 文档]: https://github.com/grpc/grpc/tree/master/examples/python/compression
[Java 文档]: https://grpc.github.io/grpc-java/javadoc/io/grpc/CallOptions.html#withCompression-java.lang.String-
[BEAST]: https://en.wikipedia.org/wiki/Transport_Layer_Security#BEAST_attack
[CRIME]: https://en.wikipedia.org/wiki/CRIME
