---
title: 迁移到 Google Cloud Platform — gRPC 和 grpc-gateway
date: 2017-04-12
author:
  name: Miguel Mendez
  link: https://www.linkedin.com/in/miguel-mendez-008231
  position: "[Yik Yak](https://yikyakapp.com)"
  blurb: |
    This post was originally a part of the [Yik Yak Engineering Blog](https://medium.com/yik-yak-eng) which focused on sharing the lessons learned as we evolved Yik Yak from early-stage startup code running in Amazon Web Services to an eventual incremental rewrite, re-architecture, and live-migration to Google Cloud Platform.
thumbnail: https://cdn-images-1.medium.com/max/1600/0*qYehJ2DvPgFcG_nX.
source_url: https://grpc.io/blog/yikyak/
---

在我们之前的博客 [帖子](https://medium.com/yik-yak-eng/migration-to-google-cloud-platform-overview-9b5e5c17c368) 中，我们概述了从 Amazon Web Services 迁移到 Google Cloud Platform 的情况。在这篇文章中，我们将深入探讨 [gRPC](https://grpc.io/) 和 [grpc-gateway](https://github.com/grpc-ecosystem/grpc-gateway) 在此迁移中扮演的角色，并分享我们在此过程中学到的一些经验教训。

<!--more-->

## 大多数人都有 REST API，不是吗？有什么问题吗？

是的，我们实际上仍然有客户端使用的 REST API，因为迁移客户端 API 超出了范围。公平地说，您可以让 REST API 正常工作，而且有很多有用的 REST API。话虽如此，我们在 REST 方面遇到的问题在于细节。

### 没有规范的 REST 规范
不存在单一的规范 REST 规范。有最佳实践，但没有真正的规范。因此，对于何时使用特定 HTTP 方法和响应代码并没有达成一致意见。除此之外，并非所有可能的 HTTP 方法和响应代码都在所有平台上受支持……这迫使 REST API 实现者使用适合他们的技术来弥补这些缺陷，但会在全面的 REST API 中产生更多差异。 REST API 充其量只是真正的 REST 风格。

### 对开发人员更严厉

从开发人员的角度来看，REST API 也不是很好。首先，由于 REST 与 HTTP 相关联，因此无法简单映射到我选择的语言中的 API。如果我使用 Go 或 Java，则没有可以在代码中使用的“接口”来将其存根。我可以创建一个，但它超出了 REST API 定义的语言范围。

其次，REST API 跨请求的各个组件传播解释请求意图所需的信息。您拥有 HTTP 方法、请求 URI、请求负载，如果语义中涉及请求标头，情况可能会变得更加复杂。

第三，我可以从命令行使用curl来访问API，这很棒，但它的代价是必须将API硬塞到该生态系统中。通常情况下，这个用例只对让人们快速尝试 API 很重要——如果这在您的需求列表中很重要，那么无论如何都可以随意使用 REST……只要保持简单即可。

### 无声明性 REST API 描述
REST API 的第四个问题是，至少在 [Swagger](https://swagger.io/) 出现之前，没有声明性方法来定义 REST API 并包含类型信息。这可能听起来很迂腐，但有合理的理由需要一个包含一般类型信息的正确定义。为了强调这一点，请查看下面的 PHP 服务端代码行，这些代码是从各种文件中提取的，这些代码在“yak”上设置“hidePin”字段，然后将其返回给客户端。在服务端上执行的实际代码行是多个参数的函数，因此想象一下运行的代码基本上是随机选择的：

```php
// Code omitted…
$yak->hidePin=false;

// Code omitted…
$yak->hidePin=true;

// Code omitted…
$yak->hidePin=0;

// Code omitted…
$yak->hidePin=1;
```

hidePin 字段的类型是什么？你不能肯定地说。它可以是布尔值或整数或服务端写入的任何内容，但无论如何，现在您的客户端必须能够处理这些可能性，这使它们变得更加复杂。

当客户端的类型定义与服务端期望的不同时，也会出现问题。看一下下面的服务端代码，它处理客户端发送的 JSON 有效负载：

```php
// Code omitted...
switch ($fieldName) {
  // Code omitted...
  case “recipientID”:
  // This is being added because iOS is passing the recipientID
  // incorrectly and we still want to capture these events
  // … expected fall through …

  case “Recipientid”:
    $this->yakkerEvent->recipientID = $value;
    break;
  // Code omitted...
}
// Code omitted...
```

在这种情况下，服务端必须处理发送 JSON 对象的 iOS 客户端，该对象的字段名称使用了意外的大小写。再说一次，这并不是不可克服的，但所有这些小的脱节都会复合在一起，共同作用，以窃取时间，远离那些真正推动进展的问题。

## gRPC 可以解决 REST 的问题

如果您不熟悉 gRPC，它是一个“高性能、开源通用远程过程调用 (RPC) 框架”，它使用 Google Protocol Buffers 作为接口描述语言 (IDL)，用于描述服务接口以及交换消息的结构。然后可以编译该 IDL 以生成特定于语言的客户端和服务端存根。如果这看起来有点迟钝，我将重点讨论重要的方面。

### gRPC 是声明式的、强类型的且与语言无关的

gRPC 描述是使用独立于任何特定编程语言的接口描述语言编写的，但其概念映射到支持的语言。这意味着您可以描述理想的服务 API、它支持的消息，然后使用协议编译器“protoc”为您的 API 生成客户端和服务端存根。您可以使用 C/C++、C#、Node.js、PHP、Ruby、Python、Go 和 Java 生成开箱即用的客户端和服务端存根。您还可以获得额外的协议插件，可以为 Objective-C 和 Swift 创建存根。

我们在上面的“hidePin”和“recipientID”与“Recipientid”字段中遇到的问题消失了，因为我们有一个单一的规范声明来建立所使用的类型，并且特定于语言的代码生成确保我们在客户端或服务端代码中不会出现拼写错误，无论其实现语言如何。

### gRPC 意味着不需要手动编写 RPC 代码

这是 gRPC 生态系统非常强大的一个方面。通常，开发人员会手动滚动他们的 RPC 代码，因为它看起来更简单。然而，随着您需要支持的客户端类型数量的增加，这种方法的承载成本也会非线性增加。想象一下，您从 Web 浏览器调用的服务开始。在未来的某个时刻，要求会更新，现在您必须支持 Android 和 iOS 客户端。您的服务端可能没问题，但客户端现在需要能够使用相同的 RPC 方言，并且常常会出现差异。如果服务端必须补偿客户端之间的差异，情况可能会变得更糟。另一方面，使用 gRPC，您只需添加协议编译器插件，它们就会生成 Android 和 iOS 客户端存根。这消除了一整类问题。作为奖励，如果您不修改生成的代码 — 并且您不必修改 — ，那么生成代码中的任何性能改进都会得到体现。

### gRPC 具有紧凑序列化

gRPC 使用 Google 协议缓冲区来序列化消息。这种序列化格式非常紧凑，因为除其他外，字段名称不包含在序列化形式中。将此与 JSON 对象进行比较，其中对象的每个实例都携带其字段名称的完整副本，包括额外的大括号等。对于小容量应用程序，这可能不是问题，但它可以快速增加。

### gRPC 工具是可扩展的

gRPC 框架的另一个非常有用的特性是它是可扩展的。如果您需要支持当前不支持的语言，可以通过一种方法为协议编译器创建插件，以便您添加所需的内容。

### gRPC 支持合约更新

服务 API 的一个经常被忽视的方面是它们如何随着时间的推移而演变。充其量，这通常是次要考虑因素。如果您使用 gRPC，并且遵守一些基本规则，您的消息可以向前和向后兼容。

## Grpc-gateway — 因为 REST 将陪伴我们一段时间......

您可能会想：gRPC 很棒，但我有大量 REST 客户端需要处理。那么，这个生态系统中还有另一个工具，它叫做 grpc-gateway。 Grpc-gateway “生成一个反向代理服务端，将 RESTful JSON API 转换为 gRPC”。因此，如果您想支持 REST 客户端，您可以做到，而且不需要您付出任何额外的努力。如果您现有的 REST 客户端与普通 REST API 相差甚远，您可以使用带有 grpc-gateway 的自定义编组器来进行补偿。

## 迁移和 gRPC + grpc-gateway

如前所述，我们有很多 PHP 代码和 REST 端点，我们希望在迁移过程中对其进行重新设计。通过结合使用 gRPC 和 grpc-gateway，我们能够定义旧版 REST API 的 gRPC 版本，然后使用 grpc-gateway 公开客户端所使用的确切 REST 端点。通过这些替代实施，我们能够使用 DNS 更新组合以及我们的[实验和配置系统](https://medium.com/yik-yak-eng/yik-yak-configuration-and-experiment-system-16a5c15ee77c#.7s11d3kqh) 在新旧系统之间移动流量，而不会对现有客户端造成任何干扰。我们甚至能够利用现有的测试套件来验证功能并在新旧系统之间建立对等关系。让我们来看看这些部分以及它们如何组合在一起。

### “/api/getMessages”的 gRPC IDL
下面是我们定义的 gRPC IDL，用于模仿 GCP 中的旧版 Yik Yak API。我们简化了示例，仅包含“/api/getMessages”端点，客户端使用该端点来获取以其当前位置为中心的消息集。

```proto
// APIRequest Message — sent by clients
message APIRequest {
  // userID is the ID of the user making the request
  string userID = 1;
  // Other fields omitted for clarity…
}

// APIFeedResponse contains the set of messages that clients should
// display.
message APIFeedResponse {
  repeated APIPost messages = 1;
  // Other fields omitted for clarity…
}

// APIPost defines the set of post fields returned to the clients.
message APIPost {
  string messageID = 1;
  string message = 2;
  // Other fields omitted for clarity…
}

// YYAPI service accessed by Android, iOS and Web clients.
service YYAPI {
  // Other endpoints omitted…

  // APIGetMessages returns the list of messages within a radius of
  // the user’s current location.
  rpc APIGetMessages (APIRequest) returns (APIFeedResponse) {
    option (google.api.http) = {
      get: “/api/getMessages” // Option tells grpc-gateway that an HTTP
                              // GET to /api/getMessages should be
                              // routed to the APIGetMessages gRPC
                              // endpoint.
    };
  }

  // Other endpoints omitted…
}
```

### Protoc 为 YYAPI 服务生成 Go 接口

然后，协议编译器将上面的 IDL 编译为 Go 文件，以生成客户端代理和服务端存根，如下所示。

```go
// Client API for YYAPI service
type YYAPIClient interface {
  APIGetMessages(ctx context.Context, in *APIRequest, opts ...grpc.CallOption) (*APIFeedResponse, error)
}

// NewYYAPIClient returns an implementation of the YYAPIClient interface  which
// clients can use to call the gRPC service.
func NewYYAPIClient(cc *grpc.ClientConn) YYAPIClient {
  // Code omitted for clarity..
}

// Server API for YYAPI service
type YYAPIServer interface {
  APIGetMessages(context.Context, *APIRequest) (*APIFeedResponse, error)
}

// RegisterYYAPIServer registers an implementation of the YYAPIServer with an
// existing gRPC server instance.
func RegisterYYAPIServer(s *grpc.Server, srv YYAPIServer) {
  // Code omitted for clarity..
}
```

### Grpc-gateway 为 YYAPI 服务的 REST 反向代理生成 Go 代码

通过在上面的 IDL 中使用 google.api.http 选项，我们告诉 grpc-gateway 系统它应该将“/api/getMessages”的 HTTP GET 路由到 APIGetMessages gRPC 端点。反过来，它创建 HTTP 到 gRPC 反向代理，并允许您通过调用下面生成的函数来设置它。

```go
// RegisterYYAPIHandler registers the http handlers for service YYAPI to “mux”.
// The handlers forward requests to the grpc endpoint over “conn”.
func RegisterYYAPIHandler(ctx context.Context, mux *runtime.ServeMux, conn *grpc.ClientConn) error {
  // Code omitted for clarity
}
```

同样，从单个 gRPC IDL 描述中，您可以免费获取客户端和服务端接口以及您选择的语言的实现存根以及 REST 反向代理。

## gRPC — 听说有一些粗糙的边缘？

我们在 2016 年第一季度末开始使用 gRPC for Go，当时确实存在一些粗糙的问题。

### 早期采用者问题

我们遇到了 [问题 674](https://github.com/grpc/grpc-go/issues/674)，这是 Go gRPC 客户端代码内部的资源泄漏，可能导致 gRPC 传输在重负载下挂起。 gRPC 团队的反应非常迅速，几天之内修复程序就被合并到了主分支中。

我们在 grpc-gateway 的生成代码中遇到了资源泄漏。然而，当我们发现这个问题时，该团队已经修复了它并合并到了 master 中。

我们遇到的最后一个早期采用者类型问题是 Go 的 gRPC 客户端不支持 GOAWAY 数据包，而 GOAWAY 数据包是 gRPC 协议规范的一部分。幸运的是，这并没有影响我们的生产。它仅在我们为第 674 期整理的回购案例中体现出来。

总而言之，考虑到我们来得早，这是相当合理的。

### 负载均衡

现在，如果您打算使用 gRPC，这绝对是您需要仔细考虑的一个领域。默认情况下，gRPC 使用 HTTP2 而不是 HTTP1。 HTTP2 能够打开与服务端的连接并将其重用于多个请求等。如果您在该模式下使用它，您将不会在负载均衡池中的所有服务端之间分发请求。在我们执行迁移时，现有的负载均衡器根本无法很好地处理 HTTP2 流量。

当时 gRPC 团队没有[负载均衡提案](https://github.com/grpc/grpc/blob/master/doc/load-balancing.md)，因此我们浪费了很多周期试图强制我们的系统进行某种类型的客户端负载均衡。最后，由于我们的大部分原始 gRPC 通信都发生在数据中心内，并且所有内容都是使用 Kubernetes 部署的，因此每次拨打远程服务端都会更简单，从而迫使系统将负载分散到 Kubernetes 服务中的服务端之间。根据我们的设置，整体响应时间仅增加了约 1 毫秒，因此这是一个简单的解决方法。

那么负载均衡问题就结束了吗？不完全是。一旦我们启动并运行了基于 gRPC 的基本系统，我们就开始对其进行负载测试，并注意到一些有趣的行为。下面是每个 gRPC 服务端随时间变化的 CPU 负载图，您注意到它有什么奇怪的地方吗？

![](https://grpc.io/img/yy-cpu-imbalance.png)

负载最重的服务端的 CPU 利用率约为 50%，而负载最轻的服务端即使在预热几分钟后，CPU 利用率也约为 20%。事实证明，即使我们每次都进行拨号，我们的网络拓扑中仍然有一个 [nghttp2](https://nghttp2.org/) 入口，该入口往往会将入站请求发送到已连接的服务端，从而导致分布不均匀。删除 nghttp2 入口后，我们的 CPU 图表显示负载分布的变化要小得多。

![](https://grpc.io/img/yy-cpu-balanced.png)

## 结论
REST API 也有其问题，但它们不会很快消失。如果您准备尝试一些更干净的东西，那么一定要考虑使用 gRPC（如果您仍然需要公开 REST API，请考虑使用 grpc-gateway）。尽管我们很早就遇到了一些问题，但 gRPC 对我们来说还是净收益。它为我们提供了一条通向更严格定义的 API 的道路。它还使我们能够在 GCP 中建立旧版 REST API 的新实现，从而使我们能够以受控方式将流量从 AWS 实现无缝迁移到新的 GCP 实现。

在讨论了 Go、gRPC 和 Google Cloud Platform 的使用之后，我们准备讨论如何在 Google Bigtable 和 Google S2 Library 之上构建新的地理存储 - 这是我们下一篇文章的主题。
