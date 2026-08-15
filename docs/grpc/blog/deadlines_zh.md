---
title: gRPC 和截止时间
date: 2018-02-26
spelling: cSpell:ignore chrono gflags Gráinne Sheerin
author:
  name: Gráinne Sheerin
  position: Google SRE
source_url: https://grpc.io/blog/deadlines/
---

**TL;DR：始终设定最后期限**。这篇文章解释了为什么我们建议仔细设置截止时间，并用有用的代码片段向您展示如何设置。

<!--more-->

当您使用 gRPC 时，gRPC 库负责通信、编组、解组和截止期限执行。截止时间允许 gRPC 客户端指定在 RPC 终止并出现错误 `DEADLINE_EXCEEDED` 之前他们愿意等待 RPC 完成的时间。默认情况下，这个截止时间是一个非常大的数字，取决于语言的实现。如何指定截止时间也取决于语言。某些语言 API 的工作有一个**截止时间**，即 RPC 应完成的固定时间点。其他人则使用 **超时**，即 RPC 超时之前的持续时间。

一般来说，当您不设置截止时间时，将为所有正在进行的请求保留资源，并且所有请求都可能达到最大超时。这使服务面临耗尽资源（例如内存）的风险，这会增加服务的延迟，或者在最坏的情况下可能导致整个进程崩溃。

为了避免这种情况，服务应该指定他们技术上支持的最长默认期限，并且客户端应该等待，直到响应对他们不再有用。对于服务来说，这可以像在 .proto 文件中提供注释一样简单。对于客户来说，这涉及设定有用的最后期限。

对于“什么是好的截止时间/超时值？”没有单一的答案。您的服务可能就像我们的快速入门指南中的 [Greeter](https://github.com/grpc/grpc/blob/master/examples/protos/helloworld.proto) 一样简单，在这种情况下，100 毫秒就可以了。您的服务可能像全球分布且高度一致的数据库一样复杂。客户端查询的截止时间与他们等待您删除其表的时间不同。

那么，您需要考虑什么才能做出明智的截止时间选择？需要考虑的因素包括整个系统的端到端延迟、哪些 RPC 是串行的、哪些可以并行进行。即使这是一个粗略的计算，您也应该能够对其进行数字化。工程师需要了解服务，然后为客户端和服务端之间的 RPC 设定一个深思熟虑的截止时间。

在 gRPC 中，客户端和服务端都自行独立地在本地确定远程过程调用 (RPC) 是否成功。这意味着他们的结论可能不相符！在服务端成功完成的 RPC 在客户端可能会失败。例如，服务端可以发送响应，但回复可以在截止时间到期后到达客户端。客户端将已终止并出现状态错误 `DEADLINE_EXCEEDED`。应在应用程序级别检查和管理这一点。

## 设定截止时间

作为客户端，您应该始终设定愿意等待服务端回复的截止时间。以下是使用[快速入门](https://grpc.io/docs/quickstart/)页面中的问候服务的示例：

### C++

```cpp
ClientContext context;
time_point deadline = std::chrono::system_clock::now() +
    std::chrono::milliseconds(100);
context.set_deadline(deadline);
```

### 去

```go
clientDeadline := time.Now().Add(time.Duration(*deadlineMs) * time.Millisecond)
ctx, cancel := context.WithDeadline(ctx, clientDeadline)
```

### Java

```java
response = blockingStub.withDeadlineAfter(deadlineMs, TimeUnit.MILLISECONDS).sayHello(request);
```

这会将截止时间设置为从设置客户端 RPC 到客户端获取响应的 100 毫秒。

## 检查截止时间

在服务端，服务端可以查询是否不再需要某个特定的 RPC。在服务端开始处理响应之前，检查是否仍有客户端在等待非常重要。在开始昂贵的处理之前，这一点尤其重要。

### C++

```cpp
if (context->IsCancelled()) {
  return Status(StatusCode::CANCELLED, "Deadline exceeded or Client cancelled, abandoning.");
}
```

### 去

```go
if ctx.Err() == context.Canceled {
	return status.New(codes.Canceled, "Client cancelled, abandoning.")
}
```

### Java

```java
if (Context.current().isCancelled()) {
  responseObserver.onError(Status.CANCELLED.withDescription("Cancelled by client").asRuntimeException());
  return;
}
```

当您知道您的客户端已达到截止时间时，服务端继续处理请求是否有用？这取决于。如果响应可以缓存在服务端中，那么就值得对其进行处理和缓存；特别是如果它占用大量资源，并且每个请求都会花费您的钱。这将使未来的请求更快，因为结果已经可用。

## 调整截止时间

如果您设置了截止时间，但新版本或服务端版本导致了严重的回归怎么办？截止时间可能太小，导致您的所有请求超时并显示 `DEADLINE_EXCEEDED`，或者太大，您的用户尾部延迟现在很大。您可以使用标志来设置和调整截止时间。

### C++

```cpp
#include <gflags/gflags.h>
DEFINE_int32(deadline_ms, 20*1000, "Deadline in milliseconds.");

ClientContext context;
time_point deadline = std::chrono::system_clock::now() +
    std::chrono::milliseconds(FLAGS_deadline_ms);
context.set_deadline(deadline);
```

### 去

```go
var deadlineMs = flag.Int("deadline_ms", 20*1000, "Default deadline in milliseconds.")

ctx, cancel := context.WithTimeout(ctx, time.Duration(*deadlineMs) * time.Millisecond)
```

### Java

```java
@Option(name="--deadline_ms", usage="Deadline in milliseconds.")
private int deadlineMs = 20*1000;

response = blockingStub.withDeadlineAfter(deadlineMs, TimeUnit.MILLISECONDS).sayHello(request);
```

现在，可以调整截止时间以等待更长的时间以避免失败，而无需精心挑选具有不同硬编码截止时间的版本。这可以让您减轻用户的问题，直到可以调试和解决回归问题。
