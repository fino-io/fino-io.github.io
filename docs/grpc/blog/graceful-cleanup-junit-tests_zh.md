---
title: 在 gRPC JUnit 测试中优雅地清理
date: 2018-06-26
author:
  name: Dapeng Zhang
  link: https://github.com/dapengzhang0
  position: Google
source_url: https://grpc.io/blog/graceful-cleanup-junit-tests/
---

最佳实践是在不再需要 gRPC 资源（例如客户端通道、服务端和之前附加的上下文）时始终清理它们。

对于 JUnit 测试来说更是如此，因为否则泄漏的资源不仅可能永远留在您的计算机中，而且还会干扰后续测试。一个不太糟糕的情况是，由于先前测试的资源泄漏，后续测试无法通过。最坏的情况是，如果先前通过的测试没有泄漏资源，一些后续测试将根本不会通过。

<!--more-->

所以清理、清理、清理...如果任何清理不成功，则测试失败。

一个典型的例子是

```java
public class MyTest {
  private Server server;
  private ManagedChannel channel;
  ...
  @After
  public void tearDown() throws InterruptedException {
    // assume channel and server are not null
    channel.shutdownNow();
    server.shutdownNow();
    // fail the test if cleanup is not successful
    assert channel.awaitTermination(5, TimeUnit.SECONDS) : "channel failed to shutdown";
    assert server.awaitTermination(5, TimeUnit.SECONDS) : "server failed to shutdown";
  }
  ...
}
```

或者变得更加优雅

```java
public class MyTest {
  private Server server;
  private ManagedChannel channel;
  ...
  @After
  public void tearDown() throws InterruptedException {
    // assume channel and server are not null
    channel.shutdown();
    server.shutdown();
    // fail the test if cannot gracefully shutdown
    try {
      assert channel.awaitTermination(5, TimeUnit.SECONDS) : "channel cannot be gracefully shutdown";
      assert server.awaitTermination(5, TimeUnit.SECONDS) : "server cannot be gracefully shutdown";
    } finally {
      channel.shutdownNow();
      server.shutdownNow();
    }
  }
  ...
}
```

然而，必须将所有这些添加到每个测试中以便它正常关闭会给您带来更多工作要做，因为您需要自己编写关闭样板。因此，gRPC 测试库具有辅助规则，可以使这项工作变得不那么乏味。

最初，引入了 JUnit 规则 [`GrpcServerRule`][GrpcServerRule] 来消除关闭样板。此规则在测试开始时创建进程内服务端和通道，并在测试结束时自动关闭它们。但是，用户发现此规则限制性太大，因为它不支持除进程内传输之外的传输、到服务端的多个通道、自定义通道或服务端构建器选项以及单个测试方法内的配置。

gRPC v1.13 版本中引入了更灵活的 JUnit 规则 [`GrpcCleanupRule`][GrpcCleanupRule]，这也消除了关闭样板。然而，与 `GrpcServerRule` 不同，`GrpcCleanupRule` 根本不会自动创建任何服务端或通道。用户自己创建并启动服务端，自己创建通道，就像普通测试一样。使用此规则，用户只需注册测试结束时需要关闭的每个资源（通道或服务端），规则就会自动优雅地关闭它们。

您可以在运行测试方法之前注册资源

```java
public class MyTest {
  @Rule
  public GrpcCleanupRule grpcCleanup = new GrpcCleanupRule();
  ...
  private String serverName = InProcessServerBuilder.generateName();
  private Server server = grpcCleanup.register(InProcessServerBuilder
      .forName(serverName).directExecutor().addService(myServiceImpl).build().start());
  private ManagedChannel channel = grpcCleanup.register(InProcessChannelBuilder
      .forName(serverName).directExecutor().build());
  ...
}
```

或在每个单独的测试方法中

```java
public class MyTest {
  @Rule
  public GrpcCleanupRule grpcCleanup = new GrpcCleanupRule();
  ...
  private String serverName = InProcessServerBuilder.generateName();
  private InProcessServerBuilder serverBuilder = InProcessServerBuilder
      .forName(serverName).directExecutor();
  private InProcessChannelBuilder channelBuilder = InProcessChannelBuilder
      .forName(serverName).directExecutor();
  ...

  @Test
  public void testFooBar() {
    ...
    grpcCleanup.register(
    	serverBuilder.addService(myServiceImpl).build().start());
    ManagedChannel channel = grpcCleanup.register(
    	channelBuilder.maxInboundMessageSize(1024).build());
    ...
  }
}
```

现在有了 [`GrpcCleanupRule`][GrpcCleanupRule]，您无需担心 JUnit 测试中 gRPC 服务端和通道的正常关闭。所以尝试一下并在测试中进行清理！

[GrpcServerRule]: https://github.com/grpc/grpc-java/blob/v1.1.x/testing/src/main/java/io/grpc/testing/GrpcServerRule.java
[GrpcCleanupRule]: https://github.com/grpc/grpc-java/blob/v1.13.x/testing/src/main/java/io/grpc/testing/GrpcCleanupRule.java
