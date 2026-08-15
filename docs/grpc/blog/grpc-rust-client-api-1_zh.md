---
title: gRPC-Rust 客户端 API 演变（第 1/2 部分）
date: 2026-05-29
spelling: cSpell:ignore Tokio
author:
  name: Doug Fawley
  position: Google
source_url: https://grpc.io/blog/grpc-rust-client-api-1/
---

### 第 1 部分

*以下是新 gRPC-Rust 客户端 API 背后背景的详细说明。  它涵盖了我在设计时经历的过程、考虑的替代方案、权衡以及最终设计的优点。  如果您只对结果本身感兴趣，请直接跳到[我们的文档](https://grpc.io/docs/languages/rust)。*

# 背景：gRPC、Tonic 和 Tower

[gRPC](http://grpc.io) 是一个高性能远程过程调用 (RPC) 框架。如果您还不熟悉 gRPC，请参阅我们的[简介](https://grpc.io/docs/what-is-grpc/introduction/)。

[Tonic](https://docs.rs/tonic/latest/tonic/) 是 Rust 编程语言的 gRPC 协议的实现。  它被广泛使用并且非常流行，在 github 上有超过 12k star。  Tonic 被设计为 [Tower](https://docs.rs/tower/latest/tower/) 生态系统的一部分，该生态系统是一个尝试统一所有网络客户端和服务 API 的框架，允许轻松为您的应用程序引入通用中间件。

gRPC-Rust 项目的启动是为了将 Tonic 缺少的所有高级 gRPC 功能引入 Rust 社区，例如集成的运行状况检查和重试，以及零拷贝和竞技场优化等性能提升策略。

# 明显的起点：保留 Tonic API？

Tonic 已经被大量 Rust 用户使用，所以我最初的想法是，如果我们能够重用它的 API，那就太好了。  以下是当前 Tonic 客户端 API 的快速示例：

```rust
// Simple unary call (one request, one response):
let response = client
    .get_feature(Request::new(Point { latitude: 409146138, longitude: -746188906,}))
    .await?;

// Bidirectional streaming (many requests and responses in parallel:
let outbound = async_stream::stream! { /* request stream generator */ };
let response = client.route_chat(Request::new(outbound)).await?;
let mut inbound = response.into_inner();

while let Some(note) = inbound.message().await? { /* process responses */ }
```

当更仔细地分析这个问题时，我发现了几个问题和局限性：

* **抽象泄漏：** Tonic 暴露了较低级别的 HTTP/2 原语（例如
`GrpcService::ResponseBody` 是 `http_body::Body`)。  gRPC 应用程序不应假设 gRPC 使用 HTTP/2 作为传输来支持将来使用其他传输（例如 [QUIC](https://github.com/grpc/proposal/blob/master/G2-http3-protocol.md)）。
* **不稳定的依赖关系：** Tonic 构建于 `futures_stream` 的 `Stream` 之上（通过
`tokio_stream)`。这些板条箱不稳定，我们希望能够在它们稳定之前发布 gRPC-Rust 的稳定版本。
* **性能限制：** Tonic 接受并返回拥有的 protobuf 消息。
这意味着 Tonic 库会处理分配，从而阻止应用程序使用 [arena](https://en.wikipedia.org/wiki/Region-based_memory_management) 等高级分配策略。   Arena 对于重负载、高并发 RPC 系统的性能非常重要。
* **安全问题：** Tonic 可以轻松（使用 `?` 运算符）
将传出客户端调用状态传播到服务端响应，*包括元数据*，其中可能包含令牌或其他私人信息等秘密。

# 塔怎么样？

所以我们需要更改 Tonic API，但我们应该继续使用 Tower 吗？

在我们支持的其他语言中，gRPC 直接包含您可以从 Tower 中间件获得的许多功能，例如[超时](https://grpc.io/docs/guides/deadlines/) 和[重试](https://grpc.io/docs/guides/retry/)。  而且，gRPC 提供了专门设计用于与 gRPC 良好配合的此功能的版本。  此外，Tower 在创建时并未考虑到流媒体，尽管它在技术上是可行的。为了实现双向流，`Request` 和 `Response` 成为异步对象，并且 `call` 方法在 RPC 生命周期的早期返回，以允许应用程序和库与它们交互。

为了说明这些问题，让我们以超时为例。  Tower 板条箱提供了一个 [`timeout` 模块](https://docs.rs/tower/latest/tower/timeout/) 来提供此功能。  该方法是用计时器未来来竞争它所包装的 `Service`，当另一个完成时丢弃一个。  这对于许多 `Service` 实现来说效果很好，但它确实有一些许多人没有意识到的令人惊讶的行为：

1. 在 `poll_ready` 中等待流量控制时不应用超时，
这意味着您的调用可能会无限期地阻塞。
2. 超时仅适用于等待调用的部分
从 `call` 方法返回的 `Response` 对象 - 对于流式 RPC，这几乎是立即返回的。  在 gRPC 中，超时适用于从客户端开始尝试调用到从服务端收到最终状态的 RPC 总时间。

除了影响任何 `Service` 的行为之外，gRPC 还存在另一个不兼容性：我们在线上写入超时，以便服务端了解客户端的截止时间。  如果应用程序使用 `timeout` 模块，则 gRPC 库将永远不会意识到超时以便传播它。

Tower 的另一个限制是，它使应用程序很难控制内存分配：`Response` 需要是一个复杂的类型，允许您调用它以将消息接收到缓冲区中。  对于流式 RPC，无论如何都需要这样的东西，但对于一元 RPC（这是竞技场最重要的地方），这会很尴尬。

# 使用Tower的“风格”？

如果 Tower 不太合适，我们是否还应该保持 Tower 和 Tonic 用户熟悉的通话风格？  IE。

```rust
async fn call(Request) -> Response
```

我们最终决定反对这种方法。  使用这种风格，希望执行交错操作（“发送消息、接收消息、发送消息……”）的应用程序需要处理同时执行的两个 `Request` 和 `Response` 流，并在两个流之间实现自己的同步。

# 两个 API：通道与生成的存根

gRPC 实际上提供了_两种不同的 API_：一种是应用程序通常通过 protobuf 生成的代码进行交互的，另一种是 [channel](https://grpc.io/docs/what-is-grpc/core-concepts/#channels)（主客户端入口点）本身实现的，并且拦截器（又名中间件）将使用该 API。  生成的 API 更注重可用性，而通道 API 是一种较低级别、更强大的纯流式设计。

在 Tonic 中，这种分割也存在，但原始生成的代码只是使用类型泛型的 Tonic API 的特化。  但这种方法并不是必需的，事实上，有理由避免它。

通过 gRPC-Rust，我们借此机会整合了从用许​​多其他语言实现 gRPC 的经验中吸取的一些经验教训。  我们想要纳入的一个这样的想法是从生成的 API 中隐藏 gRPC 本身的详细信息，并且仅公开 protobuf 消息和必要的原语。  举个例子：

```rust
// *Not* something like this:
async fn call(ctx: grpc::Context, req: MyRequestMessage, options: grpc::CallOptions)
    -> grpc::Response<MyResponseMessage>;

// More like this instead:
async fn call(req: MyRequestMessage) -> Result<MyResponseMessage, Status>;

// Example usage:
let response = client.call(request).await.expect("RPC should succeed!");
```

这与gRPC-Java的设计类似，它允许应用程序专注于应用程序的业务逻辑：请求和响应。对于 gRPC 提供的其他功能（例如访问元数据、禁用重试、读取对等详细信息等），这些通常应该使用拦截器。

# 生成的API

考虑到这一点，让我们首先单独深入研究生成的 (protobuf) API，并理解为什么上例中漂亮、简单的 API 还不够好。  _（然后我将解释我们最终如何实现这一目标\！）_

## 阿里纳斯

如前所述，[arena](https://en.wikipedia.org/wiki/Region-based_memory_management) 对于通过在时间和空间上对相关内存操作进行分组来构建能够处理极高 QPS（每秒查询数）的高效 RPC 系统非常重要。  为了允许应用程序而不是库来控制分配，我们正在寻找一个一元 API，例如：

```rust
// Definition:
async fn call(req: &MyRequestMessageView, resp: &mut MyResponseMessageView) -> Status;

// Usage (with a hypothetical arena API):
let req = MyRequestMessage::new_on_arena(arena).set_id(3);
let res = MyResponseMessage::new_on_arena(arena);
client.call(&req, &mut res).expect("RPC should succeed!");
// res now contains the RPC's response
```

## 我们可以让它更有用吗？

该 API 很简单，但我们知道许多用户不希望在进行每个 RPC 之前手动预先声明响应消息类型。  我们可以通过使用[异步构建器模式](https://doc.rust-lang.org/std/future/trait.IntoFuture.html#async-builders)来适应这两种用例。异步构建器能够通过 `IntoFuture` 实现返回拥有的消息，同时还提供另一种方法来使用预分配的响应来执行调用。

我们还可以改进请求消息参数的人体工程学。  我们可以接受 [`AsView`](https://docs.rs/protobuf/4.33.5-release/protobuf/trait.AsView.html) protobuf 类型，而不需要引用，该类型允许将拥有的消息或视图传递到调用中。  这是我们实现的最终 API：

```rust
// Definition:
async fn call<Req>(req: Req) -> UnaryFutureBuilder<..>
where
    Req: AsView<Proxied=MyRequestMsg>;

// Implements the simple usage:
impl IntoFuture for UnaryFutureBuilder {
	type Output = Result<MyResponseMessage, StatusError>;
}

// Implements the advanced usage method:
impl UnaryFutureBuilder {
	async fn with_response_message<Res>(self, res: &mut Res) -> Status
	where
	  Res: AsMut<MutProxied = MyResponseMessage>;
}

// Usage:
fn main() {
	let request = proto!(MyRequestMessage{ id: 3 });

	// Simple Usage -- exactly what we wanted originally!:
	let response = client.call(request).await.expect("RPC should succeed!");

	// Arena usage (again with a hypothetical arena API):
	let req = MyRequestMessage::new_on_arena(arena).set_id(3);
	let res = MyResponseMessage::new_on_arena(arena);
	client.call(&req).with_response_message(&mut res).await.expect("RPC should succeed!");
}
```

我们也将这些相同的概念应用到我们的流 API 中。  以下是双向流 API 的示例：

```rust
// Definition:
async fn begin_stream() -> BidiCallBuilder<..>

// Implements the same async builder pattern:
impl IntoFuture for BidiCallBuilder<..> {
	type Output = (GrpcStreamingRequest, GrpcStreamingResponse);
}

// Usage:
fn main() {
	// Simple Usage:
	let (request_stream, response_stream) = client.begin_stream().await;

	request_stream.send(proto!(MyRequestMessage{..}));
	let response = response_stream.recv().await.expect("RPC should succeed!");

	// Arena usage:
	let res = MyResponseMessage::new_on_arena(arena);
	let response = response_stream.recv_into(&mut res).await.expect("RPC should succeed!");
}
```

请参阅[完整文档](https://grpc.io/docs/languages/rust)以获取更详细的使用示例。

# 下次

这涵盖了生成代码 API 设计过程。  在第 2 部分中，我将进一步详细介绍通道 API。
