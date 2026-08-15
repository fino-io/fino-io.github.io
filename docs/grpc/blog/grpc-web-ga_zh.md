---
title: gRPC-Web 全面可用
date: 2018-10-23
spelling: cSpell:ignore Cheung Kailash Sethuraman todos
authors:
- name: Luc Perkins
  position: Developer advocate, [Cloud Native Computing Foundation](https://cncf.io)
- name: Stanley Cheung
  position: Google
- name: Kailash Sethuraman
  position: Google
source_url: https://grpc.io/blog/grpc-web-ga/
---

我们很高兴地宣布正式发布 [gRPC-Web](https://www.npmjs.com/package/grpc-web)，这是一个 JavaScript 客户端库，使 Web 应用程序能够直接与 gRPC 后端服务通信，而不需要 HTTP 服务端充当中介。 “GA”表示 gRPC-Web 现已普遍可用、稳定且符合生产使用条件。

<!--more-->

借助 gRPC-Web，您现在可以通过使用 Protocol Buffers 定义客户端*和*服务端数据类型和服务接口，轻松构建真正的端到端 gRPC 应用程序架构。一段时间以来，这一功能一直是人们强烈要求的功能，我们终于很高兴地说它现在已准备好投入生产使用。此外，能够访问 gRPC 服务为围绕 gRPC 的[基于 Web 的工具](https://github.com/grpc/grpc-experiments/tree/master/gdebug) 开辟了新的令人兴奋的可能性。

## 基础知识

gRPC-Web 与 gRPC 一样，允许您使用 Protocol Buffers 定义客户端（Web）和后端 gRPC 服务之间的服务“契约”。然后可以自动生成客户端。为此，您可以选择 [Closure](https://developers.google.com/closure/compiler/) 编译器或更广泛使用的 [CommonJS](https://requirejs.org/docs/commonjs.html)。此开发过程消除了管理问题的需要，例如创建自定义 JSON 序列化和反序列化逻辑、整理 HTTP 状态码（可能因​​ REST API 而异）、管理内容类型协商等。

从更广泛的架构角度来看，gRPC-Web 支持端到端的 gRPC。下图说明了这一点：

![](https://grpc.io/img/grpc-web-arch.png) <p style="text-align: center"> 图 1. 带有 gRPC-Web 的 gRPC（左）和带有 REST 的 gRPC（右）</p>

在左侧的 gRPC-Web 世界中，客户端应用程序与 gRPC 后端服务端使用 Protocol Buffers，而 gRPC 后端服务端又与其他 gRPC 后端服务使用 Protocol Buffers。在右侧的 REST 世界中，Web 应用程序与后端 REST API 服务端使用 HTTP 通信，然后后端 REST API 服务端使用 Protocol Buffers 与后端服务通信。

## 使用 gRPC-Web 的优点

随着时间的推移，gRPC-Web 将提供越来越广泛的功能集，但以下是今天 1.0 中的功能：

* **端到端 gRPC** — 使您能够使用 Protocol Buffers 构建整个 RPC 管道。想象一个场景，客户端请求发送到 HTTP 服务端，然后该服务端与 5 个后端 gRPC 服务进行交互。您很有可能会花费与构建管道的整个其余部分一样多的时间来构建 HTTP 交互层。
* **前端和后端团队之间更紧密的协调** - 通过使用 Protocol Buffers 定义整个 RPC 管道，您不再需要将“微服务团队”与“客户端团队”放在一起。客户端-后端交互只是 gRPC 层中的又一层。
* **轻松生成客户端库** - 使用 gRPC-Web，与“外部”世界交互的服务端（即将后端堆栈连接到互联网的薄膜）现在是 gRPC 服务端而不是 HTTP 服务端，这意味着所有服务的客户端库都可以是 gRPC 库。需要 Ruby、Python、Java 和其他 4 种语言的客户端库？您不再需要为所有这些编写 HTTP 客户端。

## 一个 gRPC-Web 示例

上一节介绍了 gRPC-Web 对于大规模应用程序的一些高级优势。现在让我们通过一个例子来更接近金属：一个简单的 TODO 应用程序。在 gRPC-Web 中，您可以从一个简单的 `todos.proto` 定义开始，如下所示：

```proto
syntax = "proto3";

package todos;

message Todo {
  string content = 1;
  bool finished = 2;
}

message GetTodoRequest {
  int32 id = 1;
}

service TodoService {
  rpc GetTodoById (GetTodoRequest) returns (Todo);
}
```

可以使用以下命令从此 `.proto` 定义生成 CommonJS 客户端代码：

```sh
protoc echo.proto \
  --js_out=import_style=commonjs:./output \
  --grpc-web_out=import_style=commonjs:./output
```

现在，从后端 gRPC 服务获取 TODO 列表非常简单：

```js
const {GetTodoRequest} = require('./todos_pb.js');
const {TodoServiceClient} = require('./todos_grpc_web_pb.js');

const todoService = new proto.todos.TodoServiceClient('http://localhost:8080');
const todoId = 1234;

var getTodoRequest = new proto.todos.GetTodoRequest();
getTodoRequest.setId(todoId);

var metadata = {};
var getTodo = todoService.getTodoById(getTodoRequest, metadata, (err, response) => {
  if (err) {
    console.log(err);
  } else {
    const todo = response.todo();
    if (todo == null) {
      console.log(`A TODO with the ID ${todoId} wasn't found`);
    } else {
      console.log(`Fetched TODO with ID ${todoId}: ${todo.content()}`);
    }
  }
});
```

一旦您声明了数据类型和服务接口，gRPC-Web 就会抽象掉所有样板文件，为您留下一个干净且人性化的 API（与 gRPC API 的当前 [Node.js](https://grpc.io/docs/languages/node/) 本质上相同的 API，只是转移到客户端）。

在后端，gRPC 服务端可以用任何支持 gRPC 的语言编写，例如 Go、Java、C++、Ruby、Node.js 等。最后一个难题是服务代理。从一开始，gRPC-Web 将支持 [Envoy](https://envoyproxy.io) 作为默认服务代理，它具有内置的 [envoy.grpc_web 过滤器](https://www.envoyproxy.io/docs/envoy/latest/configuration/http_filters/grpc_web_filter#config-http-filters-grpc-web)，您只需几行配置即可应用。

## 后续步骤

走向 GA 意味着核心构建块已牢固就位并准备好在生产 Web 应用程序中使用。但 gRPC-Web 仍有更多发展空间。查看[官方路线图](https://github.com/grpc/grpc-web/blob/master/doc/roadmap.md)，了解核心团队对不久的将来的设想。

如果您有兴趣为 gRPC-Web 做出贡献，我们希望社区在以下方面提供帮助：

* **前端框架集成** - 常用的前端框架，如 [React](https://reactjs.org)、[Vue](https://vuejs.org) 和 [Angular](https://angular.io) 尚未提供对 gRPC-Web 的官方支持。但我们希望看到这些框架支持它，因为这些前端框架和 gRPC-Web 之间的集成可以成为为应用程序提供用户可感知的性能优势的工具。如果您有兴趣构建对这些前端框架的支持，请通过 [gRPC.io 邮件列表](https://groups.google.com/g/grpc-io)、[在 github 上提交功能请求](https://github.com/grpc/grpc-web/issues) 或通过下面的功能调查表告知我们。

* **特定于语言的代理支持** — 从 GA 版本开始，[Envoy](https://envoyproxy.io) 是 gRPC-Web 的默认代理，通过特殊模块提供支持。 NGINX 也[受支持](https://github.com/grpc/grpc-web/tree/master/net/grpc/gateway/nginx)。但我们也希望看到针对特定语言的进程内代理的开发，因为它们消除了对特殊代理（例如 Envoy 和 nginx）的需求，并且将使 gRPC-Web 的使用变得更加容易。

我们也很乐意收到社区的功能请求。目前提出功能请求的最佳方式是填写[gRPC-Web路线图功能调查](https://docs.google.com/forms/d/1NjWpyRviohn5jaPntosBHXRXZYkh_Ffi4GxJZFibylM/viewform?edit_requested=true)。填写表格时，请列出您希望看到的功能，并让我们知道您是否愿意在 **我想参与** 部分中为这些功能的开发做出贡献。 gRPC-Web 工程师一定会在项目开发过程中牢记这些信息。

最重要的是，我们要感谢所有在过去一年中向我们提供反馈、错误报告和拉取请求贡献的 Alpha 和 Beta 用户。我们当然希望保持这种势头，并确保该项目为开发者社区带来实实在在的好处。
