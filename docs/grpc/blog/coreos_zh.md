---
title: 具有 REST 和开放 API 的 gRPC
date: 2016-05-09
author:
  name: Brandon Phillips
  position: "[CoreOS](https://coreos.com)"
  blurb: >
    From this [original post](https://coreos.com/blog/grpc-protobufs-swagger.html), revised by Brandon Phillips, with additional content by Lisa Carey and others at Google.
thumbnail: https://avatars2.githubusercontent.com/u/3730757?v=3&s=200
spelling: cSpell:ignore etcd swaggerscreen
source_url: https://grpc.io/blog/coreos/
---

我们今天的客座文章来自 [CoreOS](https://coreos.com/) 的 Brandon Phillips。 CoreOS 为 Linux 容器构建开源项目和产品。他们的共识和发现旗舰产品 [etcd](https://coreos.com/etcd/) 及其容器引擎 [rkt](https://coreos.com/rkt/) 是 gRPC 的早期采用者。

CoreOS 选择 gRPC 的关键原因之一是它使用 HTTP/2，使应用程序能够在单个 TCP 端口（可用于 Go）上呈现 HTTP 1.1 REST/JSON API 和高效的 gRPC 接口。这为开发人员提供了与 REST Web 生态系统的兼容性，同时推进了新的高效 RPC 协议。随着最近发布的 Go 1.6，Go 默认附带了稳定的 `net/http2` 包。

<!--more-->

由于许多 CoreOS 客户端使用 JSON 来使用 HTTP 1.1，因此 gRPC 与 JSON 和 [开放 API 规范](https://github.com/OAI/OpenAPI-Specification)（以前称为 Swagger）的轻松互操作性非常有价值。对于更熟悉基于 HTTP/1.1+JSON 和开放 API 规范 API 的用户，他们使用了开源库的组合来使其 gRPC 服务在 gRPC 和 HTTP REST 风格中可用，并使用 API 多路复用器为用户提供两全其美的服务。让我们深入了解细节，看看他们是如何做到的！

## 一个名为 EchoService 的 gRPC 应用程序

在这篇文章中，我们将根据 gRPC API 定义构建一个小型概念验证 gRPC 应用程序，添加 REST 服务网关，最后在单个 TLS 端口上提供所有服务。该应用程序称为 EchoService，在 Web 上相当于 shell 命令 echo：无论发送给它的文本是什么，服务都会返回或“回显”。

首先，让我们在名为 EchoMessage 的 protobuf 消息中定义 EchoService 的参数，其中包含一个名为 value 的字段。我们将在名为 `service.proto` 的 protobuf“.proto”文件中定义此消息。这是我们的 EchoMessage：

```proto
message EchoMessage {
 string value = 1;
}
```

在同一个 .proto 文件中，我们定义了一个 gRPC 服务，该服务采用此数据结构并返回它：

```proto
service EchoService {
  rpc Echo(EchoMessage) returns (EchoMessage) {
  }
}
```

通过 Protocol Buffer 编译器 `protoc` “按原样”运行此 `service.proto` 文件会在 Go 中生成一个存根 gRPC 服务以及各种语言的客户端。但单独的 gRPC 并不像同时公开 REST 接口的服务那么有用，因此我们不会停止使用 gRPC 服务存根。

接下来，我们添加 gRPC REST 网关。该库将在 gRPC EchoService 之上构建一个 RESTful 代理。为了构建此网关，我们将元数据添加到 EchoService .proto 中，以指示 Echo RPC 映射到 RESTful POST 方法，并将所有 RPC 参数映射到 JSON 主体。网关可以将 RPC 参数映射到 URL 路径和查询参数，但为了简洁起见，我们在这里省略了这些复杂的内容。

```proto
service EchoService {
  rpc Echo(EchoMessage) returns (EchoMessage) {
    option (google.api.http) = {
      post: "/v1/echo"
      body: "*"
    };
  }
}
```

这意味着网关一旦由 `protoc` 生成，现在就可以接受来自 `curl` 的 HTTP 请求，如下所示：

```sh
curl -X POST -k https://localhost:10000/v1/echo -d '{"value": "CoreOS is hiring!"}'
```

到目前为止，整个系统看起来像这样，用一个 `service.proto` 文件生成 gRPC 服务端和 REST 代理：

<img src="https://grpc.io/img/grpc-rest-gateway.png" class="img-responsive" alt="gRPC API with REST gateway">

为了将所有这些结合在一起，echo 服务创建了一个 Go `http.Handler` 来检测协议是否为 HTTP/2 并且 Content-Type 是否为“application/grpc”，并将此类请求发送到 gRPC 服务端。其他所有内容都路由到 REST 网关。代码看起来像这样：

```go
if r.ProtoMajor == 2 && strings.Contains(r.Header.Get("Content-Type"), "application/grpc") {
	grpcServer.ServeHTTP(w, r)
} else {
	otherHandler.ServeHTTP(w, r)
}
```

要尝试它，您只需要一个可用的 Go 1.6 开发环境和以下简单命令：

```sh
go get -u github.com/philips/grpc-gateway-example
grpc-gateway-example serve
```

服务端运行后，您可以尝试在 HTTP 1.1 和 gRPC 接口上发出请求：

```sh
grpc-gateway-example echo Take a REST from REST with gRPC
curl -X POST -k https://localhost:10000/v1/echo -d '{"value": "CoreOS is hiring!"}'
```

最后一个好处：因为我们有开放 API 规范，所以如果您的笔记本电脑上运行上述服务端，您可以浏览在 `https://localhost:10000/swagger-ui/#!/EchoService/Echo` 上运行的开放 API UI。

<img src="https://grpc.io/img/grpc-swaggerscreen.png" class="img-responsive" alt="gRPC/REST Open API document">

我们了解了如何使用 gRPC 来连接 REST 世界。如果您想查看完整的项目，请查看 [GitHub 上的存储库](https://github.com/philips/grpc-gateway-example)。我们认为这种使用单个 protobuf 来描述 API 的模式会带来一个易于使用、灵活的 API 框架，我们很高兴能在更多项目中利用它。
