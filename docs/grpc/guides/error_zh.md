---
title: 错误处理
description: 'gRPC 如何处理错误以及 gRPC 错误代码。'
source_url: https://grpc.io/docs/guides/error/
---

### 标准错误模型

正如您在我们的概念文档和示例中所看到的，当 gRPC 调用成功完成时，服务端会向客户端返回 `OK` 状态（具体取决于您的代码中可能会也可能不会直接使用 `OK` 状态的语言）。但如果调用不成功怎么办？

如果发生错误，gRPC 会返回其错误状态码之一，并带有可选的字符串错误消息，提供有关所发生情况的更多详细信息。所有受支持语言的 gRPC 客户端都可以使用错误信息。

### 更丰富的错误模型

上述错误模型是官方的 gRPC 错误模型，受所有 gRPC 客户端/服务端库支持，并且独立于 gRPC 数据格式（无论是协议缓冲区还是其他格式）。您可能已经注意到它非常有限，并且不包括传达错误详细信息的能力。

但是，如果您使用协议缓冲区作为数据格式，您可能希望考虑使用 Google 开发和使用的更丰富的错误模型，如[此处](https://cloud.google.com/apis/design/errors#error_model)所述。该模型使服务端能够返回，并且客户端能够使用以一条或多条 protobuf 消息表示的附加错误详细信息。它进一步指定了[标准的错误消息类型集](https://github.com/googleapis/googleapis/blob/master/google/rpc/error_details.proto) 来满足最常见的需求（例如无效参数、配额违规和堆栈跟踪）。此额外错误信息的 protobuf 二进制编码作为响应中的尾随元数据提供。

这种更丰富的错误模型已经在 C++、Go、Java、Python 和 Ruby 库中得到支持，并且至少 grpc-web 和 Node.js 库有请求它的未解决问题。如果有需求，其他语言库将来可能会添加支持，因此如果有兴趣，请检查他们的 github 存储库。但请注意，用 C 编写的 grpc-core 库可能永远不会支持它，因为它故意与数据格式无关。

如果您不使用协议缓冲区，则可以使用类似的方法（将错误详细信息放入尾随响应元数据中），但您可能需要找到或开发用于访问此数据的库支持，以便在 API 中实际使用它。

然而，在决定是否使用这种扩展误差模型时，需要注意一些重要的考虑因素，包括：

- 扩展错误模型的库实现可能不一致
跨语言对错误详细信息负载的要求和期望
- 现有代理、记录器和其他标准 HTTP 请求
处理器无法查看错误详细信息，因此无法利用它们进行监控或其他目的
- 拖车中的额外错误细节干扰了队伍的前线
阻塞，并且会由于更频繁的缓存未命中而降低 HTTP/2 标头压缩效率
- 较大的错误详细信息负载可能会遇到协议限制（例如
最大标头大小），有效地丢失了原始错误

### 错误状态码

gRPC 在各种情况下都会引发错误，从网络故障到未经认证的连接，每种情况都与特定的状态码相关联。所有 gRPC 语言都支持以下错误状态码。

#### 一般错误

案件|状态码
-----|-----------
客户端应用程序取消了请求|`GRPC_STATUS_CANCELLED`
服务端返回状态之前截止时间已过|`GRPC_STATUS_DEADLINE_EXCEEDED`
在服务端上找不到方法|`GRPC_STATUS_UNIMPLEMENTED`
服务端关闭|`GRPC_STATUS_UNAVAILABLE`
服务端抛出异常（或执行除返回状态码以外的其他操作来终止 RPC）|`GRPC_STATUS_UNKNOWN`

#### 网络故障

案件|状态码
-----|-----------
在截止时间之前没有传输任何数据。也适用于在截止时间到期之前传输了部分数据且未检测到其他故障的情况|`GRPC_STATUS_DEADLINE_EXCEEDED`
连接中断之前传输的一些数据（例如，请求元数据已写入 TCP 连接）|`GRPC_STATUS_UNAVAILABLE`

#### 协议错误

案件|状态码
-----|-----------
无法解压但支持压缩算法|`GRPC_STATUS_INTERNAL`
服务端不支持客户端使用的压缩机制|`GRPC_STATUS_UNIMPLEMENTED`
达到流量控制资源限制|`GRPC_STATUS_RESOURCE_EXHAUSTED`
违反流量控制协议|`GRPC_STATUS_INTERNAL`
解析返回状态时出错|`GRPC_STATUS_UNKNOWN`
未经认证：凭据无法获取元数据|`GRPC_STATUS_UNAUTHENTICATED`
权限元数据中的主机设置无效|`GRPC_STATUS_UNAUTHENTICATED`
解析响应协议缓冲区时出错|`GRPC_STATUS_INTERNAL`
解析请求协议缓冲区时出错|`GRPC_STATUS_INTERNAL`

### 语言支持

示例代码可用于多种语言，说明如何处理标准错误以及更丰富的错误详细信息。

|语言|例子|
|----------|--------------------------------|
|C++|[C++错误处理示例]|
|          |[C++ 错误详细信息示例]|
|Go|【Go错误处理示例】|
|          |[Go错误详情示例]|
|Java|【Java错误处理示例】|
|          |[Java错误详细信息示例]|
|节点|【节点错误处理示例】|
|Python|[Python错误详细信息示例]|

[grpc-errors] 存储库还包含其他错误处理示例。

[C++ error handling example]: https://github.com/grpc/grpc/tree/master/examples/cpp/error_handling
[C++ error details example]: https://github.com/grpc/grpc/tree/master/examples/cpp/error_details
[Go error handling example]: https://github.com/grpc/grpc-go/tree/master/examples/features/error_handling
[Go error details example]: https://github.com/grpc/grpc-go/tree/master/examples/features/error_details
[Java error handling example]: https://github.com/grpc/grpc-java/tree/master/examples/src/main/java/io/grpc/examples/errorhandling
[Java error details example]: https://github.com/grpc/grpc-java/tree/master/examples/src/main/java/io/grpc/examples/errordetails
[Node error handling example]: https://github.com/grpc/grpc-node/tree/master/examples/error_handling
[Python error details example]: https://github.com/grpc/grpc/tree/master/examples/python/errors
[grpc-errors]: https://github.com/avinassh/grpc-errors
