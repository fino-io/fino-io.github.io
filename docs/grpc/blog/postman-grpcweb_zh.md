---
title: gRPC 能否取代 REST 和 WebSockets 进行 Web 应用程序通信？
date: 2023-12-04
author:
  name: Ian Douglas
  position: Sr Developer Advocate, Postman
  link: https://linkedin.com/in/iandouglas736
source_url: https://grpc.io/blog/postman-grpcweb/
---
欢迎来到 [Postman](https://www.postman.com/) 的朋友们撰写的这篇客座博客文章！
在快速发展的 Web 开发领域，效率和性能往往处于新技术采用的最前沿。使用 [gRPC-Web](https://github.com/grpc/grpc-web) 库完成的工作标志着开发人员通过替换 REST 和 WebSocket 的某些方面，将 [gRPC](https://grpc.io/) 的速度和功能用于 Web 应用程序中的客户端-服务端通信的方式发生了关键转变。让我们看一下与传统 RESTful 调用和 WebSocket 连接的比较分析，并提供 gRPC-Web 的实用代码示例来对每种方法进行比较。


## 了解 gRPC-Web 及其在现代 Web 开发中的地位

gRPC-Web 的起源在于寻求响应更快、低延迟的 Web 应用程序。它将 gRPC（一种高性能、开源通用 RPC 框架）的功能扩展到浏览器，从而能够与通常指定用于服务端到服务端通信的 gRPC 服务进行直接通信。 gRPC 围绕一种称为 [协议缓冲区 (Protobuf)](https://protobuf.dev/) 的序列化格式构建，该格式有利于更小的有效负载和定义明确的接口描述，从而简化开发过程。

在深入讨论技术细节之前，我们先来看看 gRPC-Web 所代表的潜在转变。与需要 HTTP/2 的原生 gRPC 协议不同，gRPC-Web 放宽了这一要求，使其支持浏览器环境中可用的任何 HTTP/* 协议。在 WebSocket 场景中，为全双工通信维护持久连接，但 WebSocket 可能会导致管理各种连接状态的复杂性。 gRPC-Web 凭借其服务端流功能提供了一种引人注目的替代方案，从而实现更高效的实时数据流。目前，由于浏览器限制，gRPC-Web 不支持客户端流式传输。


## gRPC-Web 的机制：它是如何工作的

要将 gRPC-Web 集成到您的 Web 应用程序中，必须采用特定的架构。该架构的核心是 [Envoy 代理](https://www.envoyproxy.io/)，它充当 Web 应用程序和 gRPC 服务端之间的桥梁（这是允许抽象网络协议所必需的）。 Envoy 将 gRPC-Web 调用转换为 gRPC 调用，处理 HTTP/1.1 到 HTTP/2 的转换，让浏览器享受 gRPC 的好处。

让我们分解一下此通信模型所涉及的步骤：
1. 浏览器发起gRPC-Web客户端调用。
2. Envoy代理接收调用，其中包含Protobuf定义的
要求。
3. Envoy 然后将其转换为 HTTP/2 gRPC 调用并将其转发到
gRPC 服务端。
4. gRPC 服务端处理请求并将响应返回给 Envoy。
5. Envoy 将 gRPC 响应转换回 gRPC-Web 格式并将其发送到
客户。

使用这个代理系统，gRPC-Web 促进了强大的高性能客户端-服务端交互，并通过 Protobuf 强大的数据类型提供了数据清晰度和精确度。


## 从 REST 过渡到 gRPC-Web 的理论

对于习惯了 REST 的开发人员来说，向 gRPC-Web 的跨越似乎具有挑战性。通过正确理解所涉及的组件和分步方法，可以顺利过渡。

考虑一个典型的 RESTful 获取调用：

```js
fetch('https://api.example.com/data', {
    method: 'GET',
    headers: {
        'Accept': 'application/json',
    },
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

上面的代码从 RESTful API 服务检索 JSON 数据。请注意 fetch API、HTTP 方法和内容类型标头的使用。响应作为 JSON 对象进行处理，错误处理被纳入承诺链中。此代码中未指示的是确保您在有效负载中接收到的数据与预期模式匹配所需的数据验证，以及确保模式中接收到的数据已正确设置为您所需的数据类型，以及处理错误数据的用户体验。

让我们用 gRPC-Web 重新想象一下：

```js
const { ExampleRequest, ExampleResponse } = require('./generated/example_pb.js');
const { ExampleServiceClient } = require('./generated/example_grpc_web_pb.js');

const client = new ExampleServiceClient('https://api.example.com');

const request = new ExampleRequest();

client.getExampleData(request, {}, (err, response) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log(response.toObject());
    }
});
```

在此 gRPC-Web 示例中，我们首先导入必要的 Protobuf 定义和客户端存根。创建客户端实例并指定服务 URL。我们构造一个请求对象，并在客户端调用 getExampleData 方法，传递请求和用于处理响应或错误的回调函数。

请注意方法上的明显差异：gRPC-Web 调用是强类型的，序列化/反序列化由库处理，而不是由开发人员手动处理。这种类型的安全性和自动化可以大大减少人为错误的可能性并简化开发过程。如果您收到一个对象，则它已经经过充分验证。


## gRPC-Web 相对于 REST 的优势

虽然 REST 多年来一直是 Web API 的基石，但当涉及复杂的 Web 应用程序时，它的简单性有时可能会成为限制。虽然 gRPC-Web 可以[使用浏览器支持的任何 HTTP/* 协议](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md#protocol-differences-vs-grpc-over-http2)，但 gRPC-Web 利用了许多 HTTP/2 功能，带来了许多改进。以下是 HTTP/2 和 gRPC-Web 的一些优点：

* **它可以与现有服务配合使用：** 除了
Envoy 代理，因此实施 gRPC-Web 将允许您访问任何现有的 gRPC 服务。这对于使用 JavaScript 库的应用程序（包括移动应用程序）来说可能是一个优势。
* **类型安全：** 使用 gRPC-Web，请求和响应都是强类型的
基于 Protobuf 定义。客户端和服务端之间的这种契约是明确的，减少了沟通不畅和错误的可能性。
* **高效序列化：** gRPC 使用的序列化格式 Protobuf 是
比 JSON 或 XML 更高效，从而实现更快的序列化和更小的消息大小。这对于性能特别有利，并且可以节省带宽成本。 HTTP/1.1 允许以文本模式或二进制模式发送数据，但不能同时使用这两种模式。 HTTP/2 仅限二进制，将二进制文件编码/解码为文本比将二进制文件编码/解码为文本以通过 REST 发送混合负载更不容易出错。
* **清晰的 API 契约：** 使用 Protobuf 进行服务定义创建了一个清晰的、
与语言无关的 API 合约。这可用于生成多种语言的客户端和服务端代码，为开发人员提供无缝体验。


## 设置 gRPC-Web 环境

开始使用 gRPC-Web 需要使用 Protobuf 定义服务和消息有效负载，设置 gRPC 后端服务（或[暂时的模拟服务端](https://blog.postman.com/postman-mocking-magic-for-grpcs/)），并配置 Envoy 代理以在 gRPC-Web 和 gRPC 之间进行转换。

首先，在 .proto 文件中定义服务：

```proto
syntax = "proto3";

package example;

service ExampleService {
  rpc GetExampleData(ExampleRequest) returns (ExampleResponse);
}

message ExampleRequest {
  string query = 1;
}

message ExampleResponse {
  repeated string data = 1;
}
```

此 `.proto` 文件定义了一个带有单个 RPC 方法 `GetExampleData` 的简单服务，以及请求和响应消息格式。由于该操作在请求中发送单个 `ExampleRequest` 消息，并期望在响应中接收单个 `ExampleResponse` 消息，因此此一元 RPC 调用模仿 RESTful 请求。

接下来，使用 protoc 命令行工具和适当的 gRPC-Web 插件为您的服务生成客户端存根代码。 （[这里是一个示例](https://blog.postman.com/postman-mocking-magic-for-grpcs/)，来自 gRPC-Web 快速入门文档）。此过程将创建从浏览器进行 gRPC-Web 调用所需的 JavaScript 客户端文件。

使用您选择的语言实现 gRPC 服务端后，您将配置 Envoy 代理。 [这是 gRPC-Web 快速入门文档中的另一个示例](https://blog.postman.com/postman-mocking-magic-for-grpcs/)。

以下是 Envoy 配置的一些 YAML 语法，它使 gRPC-Web 作为上面链接的更大配置的一部分。

```yaml
http_filters:
- name: envoy.filters.http.grpc_web
- name: envoy.filters.http.router
```

准备好这些元素后，您就可以开始从 Web 应用程序进行 gRPC-Web 调用。


## 使用 Protobuf 定义服务方法

在定义服务方法时，Protobuf 通过定义请求和响应的消息结构来充当单一事实来源。这种严格的模式允许自动生成多种语言的客户端和服务端代码。特别是对于 JavaScript，此代码生成简化了浏览器客户端的调用过程。

使用上面的示例 .proto 文件，生成的 JavaScript 客户端代码将使用这些定义来确保仅发送和接收正确的数据类型。此过程处理大部分手动数据验证和解析，这些数据在 RESTful 服务中可能容易出错。


## 使用 gRPC-Web 替换典型的 WebSocket 连接

WebSocket 通过单个长期连接提供全双工通信通道。在 gRPC-Web 由于[缺乏客户端流功能](https://github.com/grpc/grpc-web/blob/master/doc/streaming-roadmap.md#client-streaming-and-half-duplex-streaming)而无法完全取代 WebSocket 的场景中，它仍然可以用于高效的服务端到客户端流。

下面是一个典型的 WebSocket 实现示例：

```js
const socket = new WebSocket('ws://example.com/data');

socket.onmessage = function(event) {
  const receivedData = JSON.parse(event.data);
  console.log(receivedData);
};

socket.onerror = function(error) {
  console.error('WebSocket Error:', error);
};
```

WebSocket API 很简单，但管理连接的状态和生命周期可能会变得复杂。

现在，让我们探讨一下 gRPC-Web 的服务端流式传输是什么样的：

```js
const { Empty } = require('./generated/common_pb.js');
const { DataServiceClient } = require('./generated/data_grpc_web_pb.js');

const client = new DataServiceClient('https://api.example.com');

const request = new Empty();

const stream = client.dataStream(request, {});

stream.on('data', (response) => {
  console.log(response.toObject());
});

stream.on('error', (err) => {
  console.error('Stream Error:', err);
});

stream.on('end', () => {
  console.log('Stream ended.');
});
```

虽然用 gRPC-Web 替换 WebSocket 需要更多代码，但您可以设置服务端流式调用，让服务端可以连续向客户端发送消息。客户端使用事件侦听器来处理传入消息、错误和流的结束。它是一种与 WebSocket 不同的范例，但在支持的用例上下文中可以更高效且更易于管理。

许多基于 WebSocket 的聊天应用程序利用单个客户端发送和服务端流式传输事件，gRPC-Web 可以取代它们。即使在开发多人游戏的情况下，“MoveCharacters”的 RPC 调用也可以从您移动角色的浏览器获取一条消息，并流回其他玩家或计算机控制角色的所有动作。


## 是时候取代 REST 和 WebSocket 了吗？

本文开始浅谈用 gRPC-Web 替换 REST 和 WebSockets，重点介绍这样做的原因以及如何开始使用实际代码示例。需要做更多的工作来完全纳入错误处理并显示性能基准测试，这超出了本文档的范围。

gRPC 和 gRPC-Web 的许多技术方面，使用 Envoy 可以替代现代 Web 应用程序开发中的 REST 和 WebSockets。虽然[面向公众的 gRPC API 很少](https://grpc.io/showcase/)，但我们迟早会看到更多公司采用基于 HTTP/2 和 HTTP/3 的 API 的性能特性，并考虑 Web 应用程序的替代新兴技术。


## Postman 中的 gRPC 支持

如果您使用 API，您可能会使用 Postman。您知道[Postman 支持 gRPC](https://blog.postman.com/postman-now-supports-grpc/) 吗？在您构建应用程序时，我们的 [VS Code 扩展也支持 gRPC 请求](https://blog.postman.com/introducing-the-postman-vs-code-extension/)。今年我们参加 gRPC Conf 并与社区会面，度过了一段愉快的时光。请关注我们的博客，了解 [有关 gRPC 的即将更新和文章](https://blog.postman.com/?s=grpc)。如果您想了解有关 gRPC、Protobuf 的一些历史以及它们在 Postman 中的使用方式，您还可以查看我们的 [Postman Academy 课程](https://academy.postman.com/grpc-and-postman)。

_[Kevin Swiber](https://twitter.com/kevinswiber) (Postman)、[Eryu Xia](https://www.linkedin.com/in/eryux/) (Google) 的技术评论_
