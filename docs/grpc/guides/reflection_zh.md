---
title: 反射
description: '解释如何使用反射来提高 RPC 的透明度和可解释性。'
source_url: https://grpc.io/docs/guides/reflection/
---

### 概述

反射是一种协议，gRPC 服务端可以使用它来声明它们通过标准化 RPC 服务导出的 protobuf 定义的 API，包括请求和响应消息引用的所有类型。然后，客户端可以使用此信息以人类可读的方式对请求进行编码并解码响应。

[`grpcurl`](https://github.com/fullstorydev/grpcurl) 和 [Postman](https://learning.postman.com/docs/sending-requests/grpc/grpc-client-overview/) 等调试工具大量使用反射。来自 REST 世界的人可能会将 gRPC 反射 API 与在 HTTP 服务端上提供 OpenAPI 文档进行比较，该文档呈现所描述的 REST API。

### 透明度和可解释性

gRPC 出色性能的一个重要因素是使用 Protobuf 进行序列化——一种非人类可读的二进制协议。虽然这极大地加快了 RPC 的速度，但也使手动与服务端交互变得更加困难。假设，为了使用 `curl` 通过 HTTP/2 手动向服务端发送 gRPC 请求，您必须：

1. 了解服务端暴露了哪些RPC服务。
2.了解请求消息的protobuf定义和所有类型_it_
参考。
3.了解响应消息的protobuf定义和所有类型_it_
参考。

然后，您必须使用这些知识将请求消息手工制作为二进制文件，并精心解码响应消息。这将是耗时、令人沮丧且容易出错的。相反，反射协议使工具能够自动化整个过程，使其不可见。

### 在 gRPC 服务端上启用反射

gRPC 服务端上不会自动启用反射。服务端作者必须调用一些附加函数来添加反射服务。这些 API 调用因语言而异，在某些语言中，需要添加对单独包的依赖项，其名称类似于 `grpc-reflection`

请点击以下链接了解有关您的特定语言的详细信息：

|语言|指导|
|------------|----------------------|
|Java|[Java 示例]|
|Go|[Go 示例]|
|C++|[C++ 示例]|
|Python|[Python 示例]|
|JavaScript|[Javascript 示例]|

[Java example]: https://github.com/grpc/grpc-java/tree/master/examples/example-reflection 

[Go example]: https://github.com/grpc/grpc-go/tree/master/examples/features/reflection 

[C++ example]: https://github.com/grpc/grpc/tree/master/examples/cpp/reflection

[Python example]: https://github.com/grpc/grpc/blob/master/examples/python/helloworld/greeter_server_with_reflection.py

[Javascript example]: https://github.com/grpc/grpc-node/blob/master/examples/reflection/server.js

### 尖端
 
反射与 `grpcurl` 等工具的配合非常无缝，以至于人们常常没有意识到它是在幕后发生的。然而，如果不暴露反射，事情就根本无法顺利进行。相反，客户端会因严重错误而失败。人们在为 gRPC 服务编写路由配置时经常遇到这种情况。 _reflection_ 服务必须路由到适当的后端以及应用程序的主 RPC 服务。

如果公共用户可以访问您的 gRPC API，您可能不想公开反射服务，因为您可能认为这是一个安全问题。最终，您需要在此处进行调用，以便为您和您的用户在安全性和易用性之间取得最佳平衡。
