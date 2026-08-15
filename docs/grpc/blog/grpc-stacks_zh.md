---
title: 可视化 gRPC 语言堆栈
date: 2018-12-11
author:
  name: Carl Mastrangelo
  link: https://carlmastrangelo.com
source_url: https://grpc.io/blog/grpc-stacks/
---

以下是 gRPC 堆栈的高级概述。  gRPC 支持的 **10** 默认语言中的每一种都具有多个层，允许您自定义应用程序中所需的部分。

<!--more-->

gRPC 中有三个主要堆栈：C 核心、Go 和 Java。  大多数语言都是 [基于 C](https://github.com/grpc/grpc/tree/master/src/core) gRPC 核心库之上的薄包装器：

### 包装语言：

![gRPC 核心堆栈](https://grpc.io/img/grpc-core-stack.svg)

例如，Python 应用程序调用生成的 Python 存根。  这些调用通过拦截器并进入包装库，在包装库中调用被转换为 C 调用。  gRPC C 核心会将 RPC 编码为 HTTP/2，可选择使用 TLS 加密数据，然后将其写入网络。

gRPC 的一大优点是您可以交换这些部分。  例如，您可以改用 C++，并使用进程内传输。  这将使您不必一直深入到操作系统网络层。   另一个例子是尝试 QUIC 协议，它允许您快速打开新连接。  能够根据环境运行多种传输，这使得 gRPC 非常灵活。

对于每一种包装语言，默认的 HTTP/2 实现都内置于 C 核心库中，因此无需包含外部实现。  但是，正如您所看到的，您可以自带（例如使用 Chrome 网络库 Cronet）。

### 去

在 [gRPC-Go](https://github.com/grpc/grpc-go) 中，堆栈要简单得多，因为不必支持如此多的配置。  以下是 Go 堆栈的高级概述：

![gRPC Go 堆栈](https://grpc.io/img/grpc-go-stack.svg)

这里的结构有点不同。  由于只有一种语言，因此从堆栈顶部到底部的流程更加线性。  与包装语言不同，gRPC Go 可以使用自己的 HTTP/2 实现，也可以使用 Go `net/http` 包。

### Java

以下是 [gRPC-Java](https://github.com/grpc/grpc-java) 堆栈的高级概述：

![gRPC Java 堆栈](https://grpc.io/img/grpc-java-stack.svg)

同样，结构略有不同。  Java 与 C 核心一样支持 HTTP/2、QUIC 和 In Process。  但与 C-Core 不同的是，应用程序通常可以绕过生成的存根和拦截器，并直接与 Java Core 库对话。  根据 gRPC 的每种语言实现的需求，每种结构都略有不同。  与包装语言不同的是，gRPC Java 将 HTTP/2 实现分离为可插入库（例如 Netty、OkHttp 或 Cronet）。
