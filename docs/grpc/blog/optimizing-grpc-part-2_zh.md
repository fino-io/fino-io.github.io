---
title: 您想要优化 gRPC - 第 2 部分
date: 2018-04-16
author:
  name: Carl Mastrangelo
  link: https://carlmastrangelo.com/
  position: Google
source_url: https://grpc.io/blog/optimizing-grpc-part-2/
---

gRPC 有多快？  如果您了解现代客户端和服务端是如何构建的，那么速度会相当快。  在[第 1 部分](https://grpc.io/blog/optimizing-grpc-part-1/) 中，我展示了如何轻松获得 **60%** 的改进。  在这篇文章中，我展示了如何获得 **10000%** 的改进。

<!--more-->

## 设置

与 [第 1 部分](https://grpc.io/blog/optimizing-grpc-part-1/) 一样，我们将从现有的基于 Java 的键值服务开始。  该服务将提供创建、读取、更新和删除键和值的并发访问。  如果您想尝试一下，可以在[此处](https://github.com/carl-mastrangelo/kvstore/tree/03-nonblocking-server)查看所有代码。

## 服务端并发

让我们看一下 [KvService](https://github.com/carl-mastrangelo/kvstore/blob/f422b1b6e7c69f8c07f96ed4ddba64757242352c/src/main/java/io/grpc/examples/KvService.java) 类。  该服务处理客户端发送的 RPC，确保它们不会意外损坏存储状态。  为了确保这一点，该服务使用 `synchronized` 关键字来确保一次只有一个 RPC 处于活动状态：

```java
private final Map<ByteBuffer, ByteBuffer> store = new HashMap<>();

@Override
public synchronized void create(
    CreateRequest request, StreamObserver<CreateResponse> responseObserver) {
  ByteBuffer key = request.getKey().asReadOnlyByteBuffer();
  ByteBuffer value = request.getValue().asReadOnlyByteBuffer();
  simulateWork(WRITE_DELAY_MILLIS);
  if (store.putIfAbsent(key, value) == null) {
    responseObserver.onNext(CreateResponse.getDefaultInstance());
    responseObserver.onCompleted();
    return;
  }
  responseObserver.onError(Status.ALREADY_EXISTS.asRuntimeException());
}
```

虽然此代码是线程安全的，但它的代价很高：只有一个 RPC 可以处于活动状态！  我们需要某种方法来允许多个操作同时安全地进行。  否则，程序将无法利用所有可用的处理器。

### 打破锁

为了解决这个问题，我们需要更多地了解 RPC 的_语义_。  我们对 RPC 的工作原理了解得越多，我们就能进行的优化就越多。  对于键值服务，我们注意到_不同键的操作不会相互干扰_。  当我们更新键“foo”时，它与键“bar”存储的值无关。  但是，我们的服务端的编写方式使得对任何键的操作都必须彼此同步。  如果我们可以同时对不同的键进行操作，我们的服务端就可以处理更多的负载。

有了这个想法，我们需要弄清楚如何修改服务端。  `synchronized` 关键字导致 Java 获取 `this`（`KvService` 的实例）上的锁。  当进入 `create` 方法时获取锁，并在返回时释放锁。我们需要同步的原因是为了保护 `store` 映射。  由于它是作为 [HashMap](https://en.wikipedia.org/wiki/Hash_table) 实现的，因此对其进行修改会更改内部数组。  因为如果同步不正确，`HashMap` 的内部状态将会被破坏，所以我们不能仅仅删除方法上的同步。

不过，Java 在这里提供了一个解决方案：`ConcurrentHashMap`。  此类提供了同时安全访问地图内容的能力。  例如，在我们的使用中，我们想要检查密钥是否存在。   如果不存在，我们要添加它，否则我们要返回错误。  `putIfAbsent` 方法自动检查值是否存在，如果不存在则添加它，并告诉我们是否成功。

并发地图对`putIfAbsent`的安全性提供了更有力的保证，因此我们可以将`HashMap`交换为`ConcurrentHashMap`并删除`synchronized`：

```java
private final ConcurrentMap<ByteBuffer, ByteBuffer> store = new ConcurrentHashMap<>();

@Override
public void create(
    CreateRequest request, StreamObserver<CreateResponse> responseObserver) {
  ByteBuffer key = request.getKey().asReadOnlyByteBuffer();
  ByteBuffer value = request.getValue().asReadOnlyByteBuffer();
  simulateWork(WRITE_DELAY_MILLIS);
  if (store.putIfAbsent(key, value) == null) {
    responseObserver.onNext(CreateResponse.getDefaultInstance());
    responseObserver.onCompleted();
    return;
  }
  responseObserver.onError(Status.ALREADY_EXISTS.asRuntimeException());
}
```

### 如果一开始你没有成功

更新 `create` 非常简单。  对 `retrieve` 和 `delete` 执行相同操作也很容易。然而，`update` 方法有点棘手。  让我们看看它在做什么：

```java
@Override
public synchronized void update(
    UpdateRequest request, StreamObserver<UpdateResponse> responseObserver) {
  ByteBuffer key = request.getKey().asReadOnlyByteBuffer();
  ByteBuffer newValue = request.getValue().asReadOnlyByteBuffer();
  simulateWork(WRITE_DELAY_MILLIS);
  ByteBuffer oldValue = store.get(key);
  if (oldValue == null) {
    responseObserver.onError(Status.NOT_FOUND.asRuntimeException());
    return;
  }
  store.replace(key, oldValue, newValue);
  responseObserver.onNext(UpdateResponse.getDefaultInstance());
  responseObserver.onCompleted();
}
```

将密钥更新为新值需要与 `store` 进行两次交互：

1. 检查密钥是否存在。
2. 将之前的值更新为新值。

不幸的是 `ConcurrentMap` 没有一个简单的方法来做到这一点。  由于我们可能不是唯一修改地图的人，因此我们需要处理我们的假设发生变化的可能性。  我们读出旧值，但当我们替换它时，它可能已被删除。

为了解决这个问题，让我们在 `replace` 失败时重试。   如果替换成功则返回true。  （`ConcurrentMap` 断言这些操作不会破坏内部结构，但并没有说它们会成功！）我们将使用 do-while 循环：

```java
@Override
public void update(
    UpdateRequest request, StreamObserver<UpdateResponse> responseObserver) {
  // ...
  ByteBuffer oldValue;
  do {
    oldValue = store.get(key);
    if (oldValue == null) {
      responseObserver.onError(Status.NOT_FOUND.asRuntimeException());
      return;
    }
  } while (!store.replace(key, oldValue, newValue));
  responseObserver.onNext(UpdateResponse.getDefaultInstance());
  responseObserver.onCompleted();
}
```

如果代码看到 null，则它会失败，但如果存在非 null 先前值，则永远不会失败。  需要注意的一点是，如果 _another_ RPC 修改 `store.get()` 调用和 `store.replace()` 调用之间的值，它将失败。  这对我们来说是一个非致命错误，所以我们会再试一次。一旦成功输入新值，服务就可以响应用户。

还有另一种可能发生的情况：两个 RPC 可能会更新相同的值并覆盖彼此的工作。  虽然这对于某些应用程序来说可能没问题，但它不适合提供事务性的 API。  展示如何解决此问题超出了本文的范围，但请注意它可能会发生。

## 衡量性能

在上一篇文章中，我们将客户端修改为异步并使用 gRPC ListenableFuture API。为了避免内存不足，客户端被修改为一次最多有 **100** 活动 RPC。  正如我们现在从服务端代码中看到的，性能瓶颈在于获取锁。由于我们删除了这些内容，我们预计会看到 100 倍的改进。  每个 RPC 完成相同数量的工作，但同时发生更多工作。  让我们看看我们的假设是否成立：

前：

```sh
./gradlew installDist
time ./build/install/kvstore/bin/kvstore
Apr 16, 2018 10:38:42 AM io.grpc.examples.KvRunner runClient
INFO: Did 24.067 RPCs/s

real	1m0.886s
user	0m9.340s
sys	0m1.660s
```

后：

```txt
Apr 16, 2018 10:36:48 AM io.grpc.examples.KvRunner runClient
INFO: Did 2,449.8 RPCs/s

real	1m0.968s
user	0m52.184s
sys	0m20.692s
```

哇！  从每秒 24 个 RPC 到每秒 2,400 个 RPC。  我们不必更改 API 或客户端。  这就是为什么理解代码和 API 语义很重要。  通过利用键值 API 的特性，即不同键上操作的独立性，代码现在速度更快。

此代码中一个值得注意的工件是结果中的 `user` 计时。  以前，用户时间仅为 9 秒，这意味着在代码运行的 60 秒中，CPU 仅有 9 秒处于活动状态。此后，使用时间增加了 5 倍多，达到 52 秒。  原因是更多的 CPU 核心处于活动状态。  `KvServer` 通过休眠几毫秒来模拟工作。  在真实的应用程序中，它将做有用的工作，并且不会发生如此巨大的变化。  它不会根据 RPC 的数量进行扩展，而是根据核心的数量进行扩展。  因此，如果您的机器有 12 个核心，您预计会看到 12 倍的改进。  不过还不错！

### 更多错误

如果您自己运行此代码，您将看到更多以下形式的日志垃圾邮件：

```txt
Apr 16, 2018 10:38:40 AM io.grpc.examples.KvClient$3 onFailure
INFO: Key not found
io.grpc.StatusRuntimeException: NOT_FOUND
```

原因是新版本的代码使 API 级别的竞争条件更加明显。由于发生的 RPC 数量是原来的 100 倍，更新和删除相互冲突的可能性更大。  为了解决这个问题，我们需要修改 API 定义。   请继续关注下一篇文章，展示如何解决这个问题。

## 结论

有很多机会可以优化您的 gRPC 代码。  要利用这些优势，您需要了解代码在做什么。  这篇文章展示了如何将基于锁的服务转换为低争用、无锁的服务。  务必确保在更改之前和之后进行测量。
