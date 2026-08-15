---
title: gRPC + JSON
date: 2018-08-15
spelling: cSpell:ignore Cap’n Gson kvstore Mastrangelo
author:
  name: Carl Mastrangelo
  link: https://carlmastrangelo.com
  position: Google
source_url: https://grpc.io/blog/grpc-with-json/
---

因此，您已经接受了整个 RPC 事物并想尝试一下，但对 Protocol Buffers 不太确定。  您现有的代码对您自己的对象进行编码，或者您可能有需要特定编码的代码。  该怎么办？

幸运的是，gRPC 与编码无关！  在不使用 Protobuf 的情况下，您仍然可以获得 gRPC 的很多好处。  在这篇文章中，我们将介绍如何使 gRPC 与其他编码和类型一起工作。  让我们尝试使用 JSON。

<!--more-->

gRPC 实际上是具有高内聚性的技术的集合，而不是单一的整体框架。  这意味着可以替换 gRPC 的部分内容，并且仍然可以利用 gRPC 的优势。  [Gson](https://github.com/google/gson) 是一个流行的 Java 库，用于进行 JSON 编码。  让我们删除所有与 protobuf 相关的东西并用 Gson 替换它们：

```diff
- Protobuf wire encoding
- Protobuf generated message types
- gRPC generated stub types
+ JSON wire encoding
+ Gson message types
```

以前，Protobuf 和 gRPC 为我们生成代码，但我们想使用我们自己的类型。  此外，我们也将使用我们自己的编码。  Gson 允许我们在代码中引入自己的类型，但提供了一种将这些类型序列化为字节的方法。

让我们继续使用 [Key-Value](https://github.com/carl-mastrangelo/kvstore/tree/04-gson-marshaller) 存储服务。  我们将修改我之前的[所以你想优化 gRPC](https://grpc.io/blog/optimizing-grpc-part-2/) 帖子中使用的代码。

## 到底什么是服务？

从 gRPC 的角度来看，_Service_ 是_Methods_ 的集合。  在 Java 中，方法表示为 [MethodDescriptor](https://grpc.io/grpc-java/javadoc/io/grpc/MethodDescriptor.html)。  每个 `MethodDescriptor` 包括方法名称、用于编码请求的 `Marshaller` 和用于编码响应的 `Marshaller`。  它们还包括其他详细信息，例如调用是否是流式传输。  为简单起见，我们将坚持使用具有单个请求和单个响应的一元 RPC。

由于我们不会生成任何代码，因此我们需要自己编写消息类。  有四种方法，每种方法都有一个请求和一个响应类型。  这意味着我们需要发出八条消息：

```java
  static final class CreateRequest {
    byte[] key;
    byte[] value;
  }

  static final class CreateResponse {
  }

  static final class RetrieveRequest {
    byte[] key;
  }

  static final class RetrieveResponse {
    byte[] value;
  }

  static final class UpdateRequest {
    byte[] key;
    byte[] value;
  }

  static final class UpdateResponse {
  }

  static final class DeleteRequest {
    byte[] key;
  }

  static final class DeleteResponse {
  }
```

因为 GSON 使用反射来确定类中的字段如何映射到序列化 JSON，所以我们不需要注释消息。

我们的客户端和服务端逻辑将使用请求和响应类型，但 gRPC 需要知道如何生成和使用这些消息。  为此，我们需要实现一个 [Marshaller](https://grpc.io/grpc-java/javadoc/io/grpc/MethodDescriptor.Marshaller.html)。  编组器知道如何从任意类型转换为 `InputStream`，然后将其传递到 gRPC 核心库中。  当解码来自网络的数据时，它还能够进行反向转换。  对于 GSON，编组器如下所示：

```java
  static <T> Marshaller<T> marshallerFor(Class<T> clz) {
    Gson gson = new Gson();
    return new Marshaller<T>() {
      @Override
      public InputStream stream(T value) {
        return new ByteArrayInputStream(gson.toJson(value, clz).getBytes(StandardCharsets.UTF_8));
      }

      @Override
      public T parse(InputStream stream) {
        return gson.fromJson(new InputStreamReader(stream, StandardCharsets.UTF_8), clz);
      }
    };
  }
```

给定某个请求或响应的 `Class` 对象，此函数将生成一个编组器。  使用编组器，我们可以为四种 CRUD 方法中的每一种编写完整的 `MethodDescriptor`。  以下是 _Create_ 方法描述符的示例：

```java
  static final MethodDescriptor<CreateRequest, CreateResponse> CREATE_METHOD =
      MethodDescriptor.newBuilder(
          marshallerFor(CreateRequest.class),
          marshallerFor(CreateResponse.class))
          .setFullMethodName(
              MethodDescriptor.generateFullMethodName(SERVICE_NAME, "Create"))
          .setType(MethodType.UNARY)
          .build();
```

请注意，如果我们使用 Protobuf，我们将使用现有的 Protobuf 编组器，并且 [方法描述符](https://github.com/carl-mastrangelo/kvstore/blob/03-nonblocking-server/build/generated/source/proto/main/grpc/io/grpc/examples/proto/KeyValueServiceGrpc.java#L44) 将自动生成。

## 发送 RPC

现在我们可以编组 JSON 请求和响应，我们需要更新我们的 [KvClient](https://github.com/carl-mastrangelo/kvstore/blob/b225d28c7c2f3c356b0f3753384b3329f2ab5911/src/main/java/io/grpc/examples/KvClient.java#L98)（上一篇文章中使用的 gRPC 客户端）以使用我们的 MethodDescriptors。  此外，由于我们不会使用任何 Protobuf 类型，因此代码需要使用 `ByteBuffer` 而不是 `ByteString`。  也就是说，我们仍然可以使用 Maven 上的 `grpc-stub` 包来发出 RPC。  再次以 _Create_ 方法为例，创建 RPC 的方法如下：

```java
    ByteBuffer key = createRandomKey();
    ClientCall<CreateRequest, CreateResponse> call =
        chan.newCall(KvGson.CREATE_METHOD, CallOptions.DEFAULT);
    KvGson.CreateRequest req = new KvGson.CreateRequest();
    req.key = key.array();
    req.value = randomBytes(MEAN_VALUE_SIZE).array();

    ListenableFuture<CreateResponse> res = ClientCalls.futureUnaryCall(call, req);
    // ...
```

如您所见，我们从 `MethodDescriptor` 创建一个新的 `ClientCall` 对象，创建请求，然后使用存根库中的 `ClientCalls.futureUnaryCall` 发送它。  gRPC 会为我们处理剩下的事情。  您还可以创建阻塞存根或异步存根，而不是将来的存根。

## 接收 RPC

为了更新服务端，我们需要创建一个键值服务和实现。  回想一下，在 gRPC 中，一台_服务端_可以处理一个或多个_服务_。  同样，Protobuf 通常为我们生成的内容需要我们自己编写。  基本服务如下所示：

```java
  static abstract class KeyValueServiceImplBase implements BindableService {
    public abstract void create(
        KvGson.CreateRequest request, StreamObserver<CreateResponse> responseObserver);

    public abstract void retrieve(/*...*/);

    public abstract void update(/*...*/);

    public abstract void delete(/*...*/);

    /* Called by the Server to wire up methods to the handlers */
    @Override
    public final ServerServiceDefinition bindService() {
      ServerServiceDefinition.Builder ssd = ServerServiceDefinition.builder(SERVICE_NAME);
      ssd.addMethod(CREATE_METHOD, ServerCalls.asyncUnaryCall(
          (request, responseObserver) -> create(request, responseObserver)));

      ssd.addMethod(RETRIEVE_METHOD, /*...*/);
      ssd.addMethod(UPDATE_METHOD, /*...*/);
      ssd.addMethod(DELETE_METHOD, /*...*/);
      return ssd.build();
    }
  }
```

`KeyValueServiceImplBase` 将充当服务定义（描述服务端可以处理哪些方法）和实现（描述对每个方法执行哪些操作）。  它充当 gRPC 和我们的应用程序逻辑之间的粘合剂。  实际上，在服务端代码中从 Proto 交换到 GSON 不需要进行任何更改：

```java
final class KvService extends KvGson.KeyValueServiceImplBase {

  @Override
  public void create(
      KvGson.CreateRequest request, StreamObserver<KvGson.CreateResponse> responseObserver) {
    ByteBuffer key = ByteBuffer.wrap(request.key);
    ByteBuffer value = ByteBuffer.wrap(request.value);
    // ...
  }
```

在服务端上实现所有方法后，我们现在有了一个功能齐全的 gRPC Java、JSON 编码 RPC 系统。  并向你展示我没有什么锦囊妙计：

```sh
./gradlew :dependencies | grep -i proto
# no proto deps!
```

## 优化代码

虽然 Gson 的速度不如 Protobuf，但不选择容易实现的目标是没有意义的。  运行代码我们发现性能非常慢：

```sh
./gradlew installDist
time ./build/install/kvstore/bin/kvstore

INFO: Did 215.883 RPCs/s
```

发生了什么？  在之前的[优化](https://grpc.io/blog/optimizing-grpc-part-2/) 帖子中，我们看到 Protobuf 版本执行了近 _2,500 次 RPC/s_。  JSON 很慢，但也不慢。  我们可以通过在 JSON 数据经过编组器时打印出来来了解问题所在：

```json
{"key":[4,-100,-48,22,-128,85,115,5,56,34,-48,-1,-119,60,17,-13,-118]}
```

那是不对的！  查看 `RetrieveRequest`，我们看到关键字节被编码为数组，而不是字节字符串。  线径比需要的大得多，并且可能与其他 JSON 代码不兼容。  为了解决这个问题，让我们告诉 GSON 将此数据编码和解码为 Base64 编码字节：

```java
  private static final Gson gson =
      new GsonBuilder().registerTypeAdapter(byte[].class, new TypeAdapter<byte[]>() {
    @Override
    public void write(JsonWriter out, byte[] value) throws IOException {
      out.value(Base64.getEncoder().encodeToString(value));
    }

    @Override
    public byte[] read(JsonReader in) throws IOException {
      return Base64.getDecoder().decode(in.nextString());
    }
  }).create();
```

在我们的编组器中使用它，我们可以看到显着的性能差异：

```sh
./gradlew installDist
time ./build/install/kvstore/bin/kvstore

INFO: Did 2,202.2 RPCs/s
```

几乎比以前快 **10 倍**！  我们仍然可以利用 gRPC 的效率，同时引入我们自己的编码器和消息。

## 结论

gRPC 允许您使用 Protobuf 以外的编码器。  它不依赖于 Protobuf，并且是专门为在各种环境中工作而设计的。  我们可以看到，通过一些额外的样板，我们可以使用任何我们想要的编码器。  虽然这篇文章只介绍了 JSON，但 gRPC 与 Thrift、Avro、Flatbuffers、Cap’n Proto 甚至原始字节兼容！  gRPC 让您可以控制数据的处理方式。  （尽管如此，我们仍然推荐 Protobuf，因为它具有强大的向后兼容性、类型检查和性能。）

如果您想查看完整的工作实现，所有代码都可以在 [GitHub](https://github.com/carl-mastrangelo/kvstore/tree/04-gson-marshaller) 上找到。
