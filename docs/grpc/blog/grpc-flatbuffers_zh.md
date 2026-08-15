---
title: 宣布在 Flatbuffers 序列化库中提供对 gRPC 的开箱即用支持
date: 2017-08-17
spelling: cSpell:ignore flatc Oortmerssen Wouter
author:
  name: Wouter van Oortmerssen
  position: Google
source_url: https://grpc.io/blog/grpc-flatbuffers/
---

最近发布的 Flatbuffers [版本 1.7](https://github.com/google/flatbuffers/releases) 引入了对 gRPC 开箱即用的真正零复制支持。

[Flatbuffers](https://google.github.io/flatbuffers/) 是一个序列化库，允许您访问序列化数据，而无需先解包或分配任何其他数据结构。它最初是为游戏和其他资源受限的应用程序而设计的，但现在发现了更广泛的用途，包括 Google 内部的团队以及 Netflix 和 Facebook 等其他公司的团队。

<!--more-->

Flatbuffers 通过直接使用 gRPC 的切片缓冲区和零拷贝来实现常见用例的最大吞吐量。传入的 rpc 可以直接从 gRPC 内部缓冲区进行处理，构造新消息将直接写入这些缓冲区，无需中间步骤。

目前，FlatBuffers 的 C++ 实现完全支持这一点，未来还会支持更多语言。 Go 中还有一个实现，它不完全是零拷贝，但分配成本仍然非常低（见下文）。


## 用法示例

让我们看一个例子来了解它是如何工作的。

### 使用 Flatbuffers 作为 IDL

从声明 RPC 服务的 `.fbs` 模式（类似于 .proto，如果您熟悉协议缓冲区）开始：

```proto
table HelloReply {
  message:string;
}

table HelloRequest {
  name:string;
}

table ManyHellosRequest {
  name:string;
  num_greetings:int;
}

rpc_service Greeter {
  SayHello(HelloRequest):HelloReply;
  SayManyHellos(ManyHellosRequest):HelloReply (streaming: "server");
}
```

要从中生成 C++ 代码，请运行：`flatc --cpp --grpc example.fbs`，就像在协议缓冲区中一样。

#### 生成的服务端实现
服务端实现与协议缓冲区非常相似，只不过现在请求和响应消息的类型为 `flatbuffers::grpc::Message<HelloRequest> *`。与协议缓冲区不同，这些类型代表 C++ 对象树，在这里它们只是底层 gRPC 切片中平面对象的句柄。您可以直接访问数据：

```cpp
auto request = request_msg->GetRoot();
auto name = request->name()->str();
```

建立响应同样简单
```cpp
auto msg_offset = mb_.CreateString("Hello, " + name);
auto hello_offset = CreateHelloReply(mb_, msg_offset);
mb_.Finish(hello_offset);
*response_msg = mb_.ReleaseMessage<HelloReply>();
```

除了 FlatBuffer 访问和构造代码之外，客户端代码与协议缓冲区生成的代码相同。


请参阅[此处](https://github.com/google/flatbuffers/tree/master/grpc/samples/greeter) 的完整示例。要编译它，您需要 gRPC。相同的存储库有一个用于 Go 的[类似示例](https://github.com/google/flatbuffers/blob/master/grpc/tests/go_test.go)。

阅读有关为您的平台使用和构建 FlatBuffers 的更多信息 [在 flatbuffers 网站上](https://google.github.io/flatbuffers/)。
