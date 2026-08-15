---
title: 移动基准测试
date: 2016-07-26
author:
  name: David Cao
  position: Google
  blurb: Originally written by David Cao with additional content by Makarand and others at Google
thumbnail: https://grpc.io/img/gcp-icon.png?raw=true
source_url: https://grpc.io/blog/mobile-benchmarks/
---

随着 gRPC 成为更好、更快的 RPC 框架，我们不断收到这样的问题：“gRPC 快了多少？”我们已经有了全面的服务端基准测试，但还没有移动基准测试。对客户端进行基准测试与对服务端进行基准测试有点不同。我们更关心延迟和请求大小等问题，而不关心每秒查询次数 (QPS) 和并发线程数等问题。因此，我们构建了一个 Android 应用程序来量化这些因素并提供它们背后的可靠数字。

<!--more-->

具体来说，我们想要进行基准测试的是客户端 protobuf 与 JSON 序列化/反序列化以及 gRPC 与 RESTful HTTP JSON 服务。对于序列化基准，我们希望测量消息的大小以及序列化和反序列化的速度。对于 RPC 基准测试，我们希望测量端到端请求的延迟和数据包大小。

## Protobuf 与 JSON

为了对 protobuf 和 JSON 进行基准测试，我们在随机生成的原型上一遍又一遍地运行序列化和反序列化，这可以在[此处](https://github.com/david-cao/gRPCBenchmarks/tree/master/protolite_app/app/src/main/proto)看到。这些原型的大小和复杂性差异很大，从几个字节到超过 100kb。创建了 JSON 等效项并进行了基准测试。对于protobuf消息，我们有三种主要的序列化和反序列化方法：简单地使用字节数组、`CodedOutputStream`/`CodedInputStream`（protobuf自己的输入和输出流实现）以及Java的`ByteArrayOutputStream`和`ByteArrayInputStream`。对于 JSON，我们使用 `org.json` 的 [`JSONObject`](https://developer.android.com/reference/org/json/JSONObject.html)。它只有一种序列化和反序列化方法，分别是 `toString()` 和 `new JSONObject()`。

为了保持基准测试尽可能准确，我们将要进行基准测试的代码包装在一个接口中，并简单地循环一定次数的迭代。这样我们就可以减少检查系统时间所花费的时间。

```java
interface Action {
    void execute();
}

// Sample benchmark of multiplication
Action a = new Action() {
    @Override
    public void execute() {
        int x = 1000 * 123456;
    }
}

for (int i = 0; i < 100; ++i) {
    a.execute();
}
```

在运行基准测试之前，我们运行了一次预热，以清除 JVM 的任何不稳定行为，然后计算在设定时间（protobuf 与 JSON 情况下为 10 秒）运行所需的迭代次数。为此，我们从 1 次迭代开始，测量该运行所需的时间，并将其与最小采样时间（在我们的示例中为 2 秒）进行比较。如果迭代次数花费的时间足够长，我们可以通过一些数学计算来估计运行 10 秒所需的迭代次数。否则，我们将迭代次数乘以 2 并重复。

```Java
// This can be found in ProtobufBenchmarker.java benchmark()
int iterations = 1;
// Time action simply reports the time it takes to run a certain action for that number of iterations
long elapsed = timeAction(action, iterations);
while (elapsed < MIN_SAMPLE_TIME_MS) {
    iterations *= 2;
    elapsed = timeAction(action, iterations);
}
// Estimate number of iterations to run for 10 seconds
iterations = (int) ((TARGET_TIME_MS / (double) elapsed) * iterations);
```

## 结果

基准测试在 protobuf、JSON 和 gzipped JSON 上运行。

我们发现，无论 protobuf 使用何种序列化/反序列化方法，它的序列化速度始终比 JSON 快约 3 倍。对于反序列化，JSON 对于小消息（<1kb), around 1.5x, but for larger messages (>15kb）实际上要快一点，protobuf 快 2 倍。对于 gzip 压缩的 JSON，无论大小如何，protobuf 的序列化速度都要快 5 倍以上。对于反序列化，两者对于小消息的处理大致相同，但对于较大的消息，protobuf 的速度大约快 3 倍。可以更深入地探索和复制结果[在自述文件中](https://github.com/david-cao/gRPCBenchmarks)。

## gRPC 与 HTTP JSON

为了对 RPC 调用进行基准测试，我们希望测量端到端延迟和带宽。为此，我们与服务端进行 60 秒的乒乓球运动，每次使用相同的消息，并测量延迟和消息大小。该消息由服务端读取的一些字段和字节负载组成。我们将 gRPC 的一元调用与简单的 RESTful HTTP JSON 服务进行了比较。 gRPC 基准测试创建一个通道，并启动一元调用，该调用在收到响应时重复，直到 60 秒过去。响应包含一个具有相同发送负载的原型。

类似地，对于 HTTP JSON 基准测试，它会使用等效的 JSON 对象向服务端发送 POST 请求，然后服务端会发回具有相同负载的 JSON 对象。

```java
// This can be found in AsyncClient.java doUnaryCalls()
// Make stub to send unary call
final BenchmarkServiceStub stub = BenchmarkServiceGrpc.newStub(channel);
stub.unaryCall(request, new StreamObserver<SimpleResponse>() {
    long lastCall = System.nanoTime();
    // Do nothing on next
    @Override
    public void onNext(SimpleResponse value) {
    }

    @Override
    public void onError(Throwable t) {
        Status status = Status.fromThrowable(t);
        System.err.println("Encountered an error in unaryCall. Status is " + status);
        t.printStackTrace();

        future.cancel(true);
    }
    // Repeat if time isn't reached
    @Override
    public void onCompleted() {
        long now = System.nanoTime();
        // Record the latencies in microseconds
        histogram.recordValue((now - lastCall) / 1000);
        lastCall = now;

        Context prevCtx = Context.ROOT.attach();
        try {
            if (endTime > now) {
                stub.unaryCall(request, this);
            } else {
                future.done();
            }
        } finally {
            Context.current().detach(prevCtx);
        }
    }
});
```

同时使用了 `HttpUrlConnection` 和 [OkHttp 库](https://square.github.io/okhttp/)。

只有 gRPC 的一元调用针对 HTTP 进行了基准测试，因为流式调用比一元调用快 2 倍以上。此外，HTTP 没有相当于流式传输的功能，而流式传输是 HTTP/2 特有的功能。

## 结果

在延迟方面，gRPC 的速度提高了 **5 倍至 10 倍**，最高可达 95%，端到端请求的平均延迟约为 2 毫秒。对于带宽而言，gRPC 对于小型请求（100-1000 字节负载）的速度大约快 3 倍，对于大型请求（10kb-100kb 负载）的速度始终快 2 倍。要复制这些结果或更深入地探索，请查看我们的[存储库](https://github.com/david-cao/gRPCBenchmarks)。
