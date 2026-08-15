---
title: gRPC-Rust 客户端 API 演变（第 2/2 部分）
date: 2026-06-01
spelling: cSpell:ignore Tokio
author:
  name: Doug Fawley
  position: Google
source_url: https://grpc.io/blog/grpc-rust-client-api-2/
---

### 第 2 部分

*以下是由 2 部分组成的系列的第 2 部分。  请参阅[第 1 部分](https://grpc.io/blog/grpc-rust-client-api-1) 了解更多背景信息。*

# 通道API

在上一篇博文中，我们为生成的代码 API 建立了一个目标，所以现在让我们重点关注为其提供支持的通道 API。  从第 1 部分中，您会记得在 gRPC 中，[通道](https://grpc.io/docs/what-is-grpc/core-concepts/#channels) 是主要的客户端入口点。  与生成的 API 不同，这个 API 将所有 RPC 视为流式传输，以统一这一级别的实现。  **大多数用户不会直接与此 API 交互。** 相反，生成的代码将代表应用程序使用它。  仅当您构建拦截器或执行 RPC 而无需生成任何代码时才需要它。

## 应该是一个特质

与 tower 类似，如果通用 API 是使用特征构建的，那么您可以通过用自己的实现包装通用 API 来实现拦截器。理想情况下，这将是一个零成本抽象（层之间没有动态调度），以便我们也可以通过此 API 有效地实现所有内部功能，例如重试和压缩。

## 对消息使用通用类型参数？

Tower 和 Tonic 使用消息的通用类型。  相比动态调度更喜欢泛型的原因包括：

1. 避免每次发送时对消息编码器/解码器进行 vtable 查找
接收操作。
2. 动态类型由于缺乏固定大小，通常涉及堆
分配（例如通过 `Box`）。
3.静态类型安全，保证a上的所有消息（请求和响应）
流是正确的类型。

但是，如果您将泛型一直深入到发生（反）序列化的点，泛型可能会导致更长的编译时间和更多的代码输出 - 如果您不这样做，那么您无论如何都要承担 vtable 查找的成本，因此您完全失去了（1）的边际性能优势。

此外，我们可以使用动态类型，但通过传递对动态消息类型的引用而不是拥有的 `Box`ed 对象来避免 (2) 中提到的堆分配，例如

```rust
fn next_response_message(dest: &mut dyn ResponseMessage)
```

最后，(3) 并不是这种 API 风格的重要需求，因为与应用程序交互最多的 API 已经是完全类型安全的。

最后，我们决定不对消息类型使用泛型，而是使用动态类型引用，因为成本超过了收益。

## 使用流对象？

一种简单的方法是提供一个 `Stream` 类型，表示应用程序可以与之交互的正在进行的 RPC。  这就是 gRPC-Go 所做的，但它会导致一个小问题：虽然 `SendMsg` 和 `RecvMsg` 可以同时调用，但我们不想允许同时发送或接收多个消息。  此外，我们希望从独立的任务中执行这些操作，这意味着它需要支持克隆，这会产生额外的同步成本。

## 构造类似于 [mpsc::channel](https://doc.rust-lang.org/std/sync/mpsc/fn.channel.html)？

为了解决并发操作问题，我决定尝试将流分成两半：一半用于发送，一半用于接收，类似于通道或使用 `into_split` 将 `tokio::net::TcpStream` 拆分为拥有的读写两半。  这看起来像这样：

```rust
// Definition:
pub trait Service {
    async fn call(&mut self) -> (impl SendStream, impl RecvStream)
}

pub trait SendStream { /* send method */ }
pub trait RecvStream { /* recv method */ }

// Usage:
async fn main() {
    let (mut tx, mut rx) = channel.call(...).await;
    tx.send(&request).await;
    rx.recv(&response).await;
}
```

这感觉很自然并且效果很好。  应用程序可以分配请求和响应消息并将它们传递到适当的流，这意味着它可以支持我们所需的竞技场分配。

然而，使用 [RPITIT](https://rustc-dev-guide.rust-lang.org/return-position-impl-trait-in-trait.html) （Return Position Impl Trait In Trait）对于这个实现来说是一个问题：为了支持拦截器层中的重试，我们需要将委托流存储在包装器中，在通道上发送它们等。但是使用 `impl Trait` 时，返回的类型是匿名的，因此即使您有一个稳定的流创建者作为您的委托，您也无法获得两个流从中提取实例并将它们存储在同一内存中。  例如。

```rust
fn call(...) -> (impl SendStream, impl RecvStream) {
    let (mut tx, mut rx) = delegate.call(...).await;
    let wtx = WrappedStream::new(tx); // What type is this?  WrappedStream<???>?
    return (wtx, rx);
}
```

在此示例中，当需要更新 `wtx` 以在其中包含新委托 `SendStream` 时，即使您知道它是由同一委托创建的并且类型确实匹配，也无法分配它。

RPIT 需要注意的另一件事是：返回的类型隐式捕获 `&self` 接收器的生命周期。  对于我们的设计，我们需要它们是 `'static`，以便它们可以发送到其他任务。  这*可以*通过使用 [`use<..> clauses`](https://doc.rust-lang.org/edition-guide/rust-2024/rpit-lifetime-capture.html) 的 RPIT 来控制生命周期捕获来实现，但这会使 API 更加复杂。

## 关联类型而不是 RPITIT

解决这两个 RPITIT 问题的明显方法是为返回的流声明关联类型：

```rust
pub trait Service {
    type RequestStream: SendStream + 'static;
    type ResponseStream: RecvStream + 'static;
    async fn call(...) -> (Self::RequestStream, Self::ResponseStream);
}
```

通过此更改，现在可以命名类型，这意味着我们可以将它们存储在具有命名类型参数的结构中，并且可以更新它们以进行重试。由于它们是 `'static`，因此它们无法捕获 `&self` 的生命周期。事实上，这就是最终的实现：

```rust
pub trait Invoke: Sync {
    type SendStream: SendStream + 'static;
    type RecvStream: RecvStream + 'static;

    async fn invoke(
        &self,
        headers: RequestHeaders,
        options: CallOptions,
    ) -> (Self::SendStream, Self::RecvStream);
}
```

您可能还注意到名称已更改。  众所周知，命名事物是计算机科学中最难的问题，这也不例外。  我想避免 `Service::call` 因为这是 Tower 使用的，并且这里的语义是不同的。  “Invoke”捕获与“call”相同的意图，并且很少用作通用编程术语，因此感觉是一个不错的选择。

## 拦截器的并发症

由于 Rust 严格的所有权模型，我们需要考虑拦截器的特殊场景。  为了允许应用程序以方便的方式从调用中接收元数据，我们希望能够应用一个拦截器来保存一次性通道（[例如来自 Tokio](https://docs.rs/tokio/latest/tokio/sync/oneshot/index.html)），该通道在收到元数据后将元数据发送到应用程序。  一次性 `Sender` 在使用时会被消耗，因此我们希望设计我们的拦截器，以便它们可以具有“一次”变体以及可重复使用的版本。  由于不同的使用模式以及我们可能希望如何堆叠拦截器，不幸的是，这种区别导致了“四种”不同类型的拦截器：

|拦截器类型|委托使用？|可重复使用的？|示例|实施什么|
| :---- | :---- | :---- | :---- | :---- |
|基本的|一度|是的|记录、验证|`Intercept<InvokeOnce>`|
|一次|一度|不|元数据访问器|`InterceptOnce<InvokeOnce>`|
|可重试|多种的|是的|重试|`Intercept<Invoke + Clone + 'static>`|
|可重试一次|多种的|不|??|`InterceptOnce<Invoke + Clone + 'static>`|

（如果您只直接调用 `invoke` 并且不需要这些边界提供的附加功能，则 `+ Clone + 'static` 边界是可选的且不必要。）

正如您可能知道的那样，您不能以任何您想要的方式组合它们 - “可重试”拦截器不能包裹在“一次”拦截器周围，但我们希望能够将“基本”拦截器包裹在“一次”拦截器周围。 [`grpc::client::interceptor`](https://docs.rs/grpc/latest/grpc/client/interceptor/index.html) 模块以易于使用的方式实现所有这些功能。  要在 `Invoke` 或 `InvokeOnce` 实现周围添加拦截器，您只需知道它们是否实现 `Intercept` 或 `InterceptOnce` 即可。  然后，您可以利用 [`InvokeExt`](https://docs.rs/grpc/latest/grpc/client/interceptor/trait.InvokeExt.html) 和 [`InvokeOnceExt`](https://docs.rs/grpc/latest/grpc/client/interceptor/trait.InvokeOnceExt.html) 扩展特征，使用 `with_interceptor` 或 `with_once_interceptor` 链接它们，从而产生一个新的 `Invoke` 或`InvokeOnce` 包含组合的实现。

## 完毕？

就是这样\！  这是我们在此预览中发布的 API。  我们仍然愿意做出进一步的改变，并期待听到您的反馈，无论是积极的还是消极的。
