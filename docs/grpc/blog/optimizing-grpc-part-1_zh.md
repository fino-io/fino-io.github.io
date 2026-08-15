---
title: 您想要优化 gRPC - 第 1 部分
date: 2018-03-06
spelling: cSpell:ignore kvstore Mastrangelo MILLIS OOMs
author:
  name: Carl Mastrangelo
  link: https://github.com/carl-mastrangelo
  position: Google
source_url: https://grpc.io/blog/optimizing-grpc-part-1/
---

gRPC 的一个常见问题是如何使其更快。  gRPC 库为用户提供了对高性能 RPC 的访问，但并不总是清楚如何实现这一点。  因为这个问题很常见，所以我想我应该尝试展示我在调整程序时的思维过程。

<!--more-->

## 设置

考虑由多个其他程序使用的基本键值服务。  该服务需要确保并发访问的安全性，以防同时发生多个更新。  它需要能够扩展以使用可用的硬件。   最后，它需要快。  gRPC 非常适合此类服务；让我们看看实现它的最佳方法。

在这篇博文中，我使用 gRPC Java 编写了一个示例 [客户端和服务端](https://github.com/carl-mastrangelo/kvstore)。该程序分为三个主要类，以及一个描述 API 的 protobuf 文件：

* [KvClient](https://github.com/carl-mastrangelo/kvstore/blob/01-start/src/main/java/io/grpc/examples/KvClient.java)
是键值系统的模拟用户。   它随机创建、检索、更新和删除键和值。  它使用的键和值的大小也是使用[指数分布](https://en.wikipedia.org/wiki/Exponential_distribution) 随机决定的。
* [KvService](https://github.com/carl-mastrangelo/kvstore/blob/01-start/src/main/java/io/grpc/examples/KvService.java)
是键值服务的实现。  它由 gRPC Server 安装，用于处理客户端发出的请求。  为了模拟在磁盘上存储键和值，它在处理请求时添加了短暂的睡眠。  读取和写入将经历 10 和 50 毫秒的延迟，以使示例更像持久数据库。
* [KvRunner](https://github.com/carl-mastrangelo/kvstore/blob/01-start/src/main/java/io/grpc/examples/KvRunner.java)
协调客户端和服务端之间的交互。  它是主要入口点，启动客户端和服务端，并等待客户端执行其工作。  运行程序运行 60 秒，然后记录完成了多少次 RPC。
* [kvstore.proto](https://github.com/carl-mastrangelo/kvstore/blob/01-start/src/main/proto/kvstore.proto)
是我们服务的协议缓冲区定义。  它准确地描述了客户对服务的期望。为了简单起见，我们将使用Create、Retrieve、Update和Delete作为操作（俗称CRUD）。  这些操作使用由任意字节组成的键和值。  虽然它们有点像 REST，但我们保留将来进行分歧和添加更复杂操作的权利。

[协议缓冲区](https://protobuf.dev)（原型）不需要使用 gRPC，它们是定义服务接口和生成客户端和服务端代码的非常方便的方法。生成的代码充当应用程序逻辑和核心 gRPC 库之间的粘合代码。我们将 gRPC 客户端调用的代码称为 _stub_。

## 起点

### 客户

现在我们知道程序应该做什么，我们可以开始看看程序如何执行。如上所述，客户端进行随机 RPC。  例如，以下是发出 [creation](https://github.com/carl-mastrangelo/kvstore/blob/f422b1b6e7c69f8c07f96ed4ddba64757242352c/src/main/java/io/grpc/examples/KvClient.java#L80) 请求的代码：

```java
private void doCreate(KeyValueServiceBlockingStub stub) {
  ByteString key = createRandomKey();
  try {
    CreateResponse res = stub.create(
        CreateRequest.newBuilder()
            .setKey(key)
            .setValue(randomBytes(MEAN_VALUE_SIZE))
            .build());
    if (!res.equals(CreateResponse.getDefaultInstance())) {
      throw new RuntimeException("Invalid response");
    }
  } catch (StatusRuntimeException e) {
    if (e.getStatus().getCode() == Code.ALREADY_EXISTS) {
      knownKeys.remove(key);
      logger.log(Level.INFO, "Key already existed", e);
    } else {
      throw e;
    }
  }
}
```

创建一个随机密钥以及一个随机值。  请求被发送到服务端，客户端等待响应。  当返回响应时，代码检查它是否符合预期，如果不符合预期，则抛出异常。  虽然密钥是随机选择的，但它们必须是唯一的，因此我们需要确保每个密钥尚未被使用。  为了解决这个问题，代码会跟踪它所创建的密钥，以免两次创建相同的密钥。  但是，另一个客户端可能已经创建了特定密钥，因此我们记录它并继续。否则，将引发异常。

我们在这里使用**阻塞** gRPC API，它发出请求并等待响应。这是最简单的 gRPC 存根，但它在运行时会阻塞线程。  这意味着从客户端的角度来看，一次最多可以进行**一个** RPC。

### 服务端

在服务端，请求由[服务处理程序](https://github.com/carl-mastrangelo/kvstore/blob/f422b1b6e7c69f8c07f96ed4ddba64757242352c/src/main/java/io/grpc/examples/KvService.java#L34)接收：

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

该服务从请求中提取 `ByteBuffer` 形式的键和值。  它获取服务本身的锁，以确保并发请求不会损坏存储。  在模拟写入的磁盘访问后，它将其存储在键到值的 `Map` 中。

与客户端代码不同，服务处理程序是**非阻塞**，这意味着它不会像函数调用那样返回值。  相反，它会调用 `responseObserver` 上的 `onNext()` 将响应发送回客户端。  请注意，此调用也是非阻塞的，这意味着消息可能尚未发送。  为了表明我们已经完成了消息处理，调用了 `onCompleted()`。

### 性能

由于代码是安全且正确的，让我们看看它的执行情况。  为了进行测量，我使用的是具有 12 核处理器和 32 GB 内存的 Ubuntu 系统。  让我们构建并运行代码：

```sh
./gradlew installDist
time ./build/install/kvstore/bin/kvstore
Feb 26, 2018 1:10:07 PM io.grpc.examples.KvRunner runClient
INFO: Starting
Feb 26, 2018 1:11:07 PM io.grpc.examples.KvRunner runClient
INFO: Did 16.55 RPCs/s

real	1m0.927s
user	0m10.688s
sys	0m1.456s
```

哎呀！  对于如此强大的机器，它每秒只能执行大约 16 个 RPC。  它几乎没有使用我们的任何 CPU，而且我们也不知道它使用了多少内存。  我们需要弄清楚为什么它这么慢。


## 优化

### 分析

在进行任何更改之前，让我们先了解一下程序正在做什么。  优化时，我们需要知道代码把时间花在哪里，以便知道可以优化什么。  在这个早期阶段，我们还不需要分析工具，我们只需对程序进行推理即可。

客户端启动并连续发出 RPC 大约一分钟。  每次迭代，它都会[随机决定](https://github.com/carl-mastrangelo/kvstore/blob/f422b1b6e7c69f8c07f96ed4ddba64757242352c/src/main/java/io/grpc/examples/KvClient.java#L49) 执行什么操作：

```java
void doClientWork(AtomicBoolean done) {
  Random random = new Random();
  KeyValueServiceBlockingStub stub = KeyValueServiceGrpc.newBlockingStub(channel);

  while (!done.get()) {
    // Pick a random CRUD action to take.
    int command = random.nextInt(4);
    if (command == 0) {
      doCreate(stub);
      continue;
    }
    /* ... */
    rpcCount++;
  }
}
```

这意味着**任何时间最多有一个 RPC 可以处于活动状态**。  每个 RPC 都必须等待前一个 RPC 完成。  每个 RPC 需要多长时间才能完成？  从读取服务端代码来看，大部分操作都是在进行写入，大约需要 50 毫秒。  在最高效率下，该代码每秒可以执行的最多操作约为 20 次：

20 次查询 = 1000 毫秒 /（50 毫秒/查询）

我们的代码每秒可以执行大约 16 个查询，所以这似乎是正确的。  我们可以通过查看用于运行代码的 `time` 命令的输出来抽查这一假设。  在 [simulateWork](https://github.com/carl-mastrangelo/kvstore/blob/f422b1b6e7c69f8c07f96ed4ddba64757242352c/src/main/java/io/grpc/examples/KvService.java#L88) 方法中运行查询时，服务端会进入睡眠状态。这意味着程序在等待 RPC 完成时大部分时间应该处于空闲状态。

我们可以通过查看上述命令的 `real` 和 `user` 时间来确认这种情况。他们说_wall Clock_时间是1分钟，而_cpu_时间是10秒。  我强大的多核 CPU 只有 16% 的时间处于繁忙状态。  因此，如果我们能让程序在这段时间内完成更多的工作，那么我们似乎就能完成更多的 RPC。

### 假设

现在我们可以清楚地陈述我们认为的问题所在，并提出解决方案。  加速程序的一种方法是确保 CPU 不空闲。  为此，我们同时发布工作。

在 gRPC Java 中，存在三种类型的存根：阻塞、非阻塞和可监听的 future。  我们已经看到了客户端中的阻塞存根和服务端中的非阻塞存根。  可监听的未来 API 是两者之间的折衷方案，提供类似阻塞和非阻塞的行为。  只要我们不阻塞等待工作完成的线程，我们就可以启动新的 RPC，而无需等待旧的 RPC 完成。

### 实验

为了测试我们的假设，让我们修改客户端代码以使用可监听的 future API。  这意味着我们需要更多地考虑代码中的并发性。  例如，当在客户端跟踪已知密钥时，我们需要安全地读取、修改和写入密钥。  我们还需要确保在发生错误时，我们停止创建新的 RPC（正确的错误处理将在以后的帖子中介绍）。  最后，我们需要更新同时进行的 RPC 数量，因为更新可能发生在另一个线程中。

进行所有这些更改会增加代码的复杂性。  这是优化代码时需要考虑的权衡。  一般来说，代码简单性与优化是不一致的。 Java 并不以简洁而闻名。  也就是说，下面的代码仍然可读，并且程序流程仍然大致在函数中从上到下。  这是修改后的 [doCreate()](https://github.com/carl-mastrangelo/kvstore/blob/f0113912c01ac4ea48a80bb7a4736ddcb3f21e24/src/main/java/io/grpc/examples/KvClient.java#L92) 方法：

```java
private void doCreate(KeyValueServiceFutureStub stub, AtomicReference<Throwable> error) {
  ByteString key = createRandomKey();
  ListenableFuture<CreateResponse> res = stub.create(
      CreateRequest.newBuilder()
          .setKey(key)
          .setValue(randomBytes(MEAN_VALUE_SIZE))
          .build());
  res.addListener(() -> rpcCount.incrementAndGet(), MoreExecutors.directExecutor());
  Futures.addCallback(res, new FutureCallback<CreateResponse>() {
    @Override
    public void onSuccess(CreateResponse result) {
      if (!result.equals(CreateResponse.getDefaultInstance())) {
        error.compareAndSet(null, new RuntimeException("Invalid response"));
      }
      synchronized (knownKeys) {
        knownKeys.add(key);
      }
    }

    @Override
    public void onFailure(Throwable t) {
      Status status = Status.fromThrowable(t);
      if (status.getCode() == Code.ALREADY_EXISTS) {
        synchronized (knownKeys) {
          knownKeys.remove(key);
        }
        logger.log(Level.INFO, "Key already existed", t);
      } else {
        error.compareAndSet(null, t);
      }
    }
  });
}
```

该存根已修改为 `KeyValueServiceFutureStub`，它在调用时生成 `Future` 而不是响应本身。  gRPC Java 使用名为 `ListenableFuture` 的扩展，它允许在 future 完成时添加回调。  为了这个计划，我们并不关心得到回应。  相反，我们更关心 RPC 是否成功。考虑到这一点，代码主要检查错误而不是处理响应。

第一个更改是 RPC 数量的记录方式。  我们不是在主循环之外递增计数器，而是在 RPC 完成时递增它。

接下来，我们为每个 RPC 创建一个新对象，用于处理成功和失败的情况。  因为 `doCreate()` 在调用 RPC 回调时已经完成，所以我们需要一种除了抛出之外的方法来传播错误。  相反，我们尝试以原子方式更新引用。  主循环偶尔会检查是否发生了错误，如果有问题则停止。

最后，代码非常小心，仅在 RPC 实际完成时才向 `knownKeys` 添加密钥，并且仅在已知失败时将其删除。  我们对变量进行同步以确保两个线程不会发生冲突。  注意：虽然对`knownKeys`的访问是线程安全的，但仍然存在[竞争条件](https://en.wikipedia.org/wiki/Race_condition)。  有可能一个线程可以从 `knownKeys` 中读取，第二个线程可以从 `knownKeys` 中删除，然后第一个线程使用第一个密钥发出 RPC。  键上的同步仅确保其一致，并不能确保其正确。  正确修复此问题超出了本文的范围，因此我们只需记录事件并继续。  如果运行该程序，您将看到一些此类日志语句。

### 运行代码

如果您启动该程序并运行它，您会发现它不起作用：

```sh
WARNING: An exception was thrown by io.grpc.netty.NettyClientStream$Sink$1.operationComplete()
java.lang.OutOfMemoryError: unable to create new native thread
	at java.lang.Thread.start0(Native Method)
	at java.lang.Thread.start(Thread.java:714)
	...
```

什么？！  为什么我要向您展示失败的代码？  原因是在现实生活中，做出改变往往不会在第一次尝试时奏效。  在这种情况下，程序内存不足。  当程序内存不足时，奇怪的事情就会开始发生。  通常，根本原因很难找到，而且转移注意力的因素比比皆是。  尽管我们没有在代码中创建任何新线程，但令人困惑的错误消息显示“无法创建新的本机线程”。  经验对于解决这些问题而不是调试非常有帮助。  由于我调试过很多OOM，我碰巧知道Java告诉我们压垮骆驼的最后一根稻草。  我们的程序开始使用更多的内存，但最终失败的分配偶然发生在线程创建过程中。

那么发生了什么？  _启动新的 RPC 没有任何阻力。_在阻塞版本中，直到最后一个 RPC 完成后才能启动新的 RPC。  虽然速度很慢，但它也阻止我们创建大量我们没有内存的 RPC。  我们需要在可听的未来版本中考虑到这一点。

为了解决这个问题，我们可以对活动 RPC 的数量施加自我限制。  在开始新的 RPC 之前，我们将尝试获得许可。  如果我们得到一个，RPC 就可以启动。  如果没有，我们将等到有可用的为止。  当 RPC 完成时（无论成功还是失败），我们都会返回许可证。  为了[完成](https://github.com/carl-mastrangelo/kvstore/blob/02-future-client/src/main/java/io/grpc/examples/KvClient.java#L94)这一点，我们将使用 `Semaphore`：

```java
private final Semaphore limiter = new Semaphore(100);

private void doCreate(KeyValueServiceFutureStub stub, AtomicReference<Throwable> error)
    throws InterruptedException {
  limiter.acquire();
  ByteString key = createRandomKey();
  ListenableFuture<CreateResponse> res = stub.create(
      CreateRequest.newBuilder()
          .setKey(key)
          .setValue(randomBytes(MEAN_VALUE_SIZE))
          .build());
  res.addListener(() ->  {
    rpcCount.incrementAndGet();
    limiter.release();
  }, MoreExecutors.directExecutor());
  /* ... */
}
```

现在代码可以成功运行，并且不会耗尽内存。

### 结果

再次构建并运行代码看起来好多了：

```sh
./gradlew installDist
time ./build/install/kvstore/bin/kvstore
Feb 26, 2018 2:40:47 PM io.grpc.examples.KvRunner runClient
INFO: Starting
Feb 26, 2018 2:41:47 PM io.grpc.examples.KvRunner runClient
INFO: Did 24.283 RPCs/s

real	1m0.923s
user	0m12.772s
sys	0m1.572s
```

我们的代码每秒执行的 RPC 次数比以前多 **46%**。  我们还可以看到，我们使用的 CPU 比以前多了大约 20%。  正如我们所看到的，我们的假设被证明是正确的，并且修复成功了。  所有这一切都在没有对服务端进行任何更改的情况下发生。  此外，我们无需使用任何特殊的分析仪或示踪剂即可进行测量。

这些数字有意义吗？  我们期望以大约 1/4 的概率发出变异（创建、更新和删除）RPC。  读取也占问题时间的 1/4，但不需要那么长时间。  平均 RPC 时间应约为加权平均 RPC 时间：

```nocode
  .25 * 50ms (create)
  .25 * 10ms (retrieve)
  .25 * 50ms (update)
 +.25 * 50ms (delete)
------------
        40ms
```

如果每个 RPC 平均耗时 40 毫秒，我们预计每秒的 RPC 数量为：

25 次查询 = 1000 毫秒 /（40 毫秒/查询）

这大约就是我们在新代码中看到的情况。  服务端仍在串行处理请求，因此看来我们将来还有更多工作要做。  但就目前而言，我们的优化似乎奏效了。


## 结论

有很多机会可以优化您的 gRPC 代码。  要利用这些优势，您需要了解代码正在做什么以及代码应该做什么。  这篇文章展示了如何处理和思考优化的基础知识。  始终确保在更改之前和之后进行测量，并使用这些测量来指导您的优化。

在[第2部分](https://grpc.io/blog/optimizing-grpc-part-2/)中，我们将继续优化服务端部分代码。
