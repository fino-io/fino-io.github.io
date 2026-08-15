---
title: C# 中 gRPC 的未来属于 grpc-dotnet
date: 2021-05-01
spelling: cSpell:ignore dotnetcore nuget Tattermusch
author:
  name: Jan Tattermusch
  link: https://github.com/jtattermusch
source_url: https://grpc.io/blog/grpc-csharp-future/
---

**2023 年 10 月 2 日更新：`Grpc.Core` 的维护期再次延长，至少到 2024 年 10 月。有关 `Grpc.Core` 的最新信息，请参阅[公告][2023 年更新]。**

**2022年5月3日更新：`Grpc.Core`的维护期已延长至2023年5月。有关`Grpc.Core`未来的更多信息，请参阅[公告][2022年更新]。**

**TL;DR** grpc-dotnet（[Grpc.Net.Client](https://www.nuget.org/packages/Grpc.Net.Client/) 和 [Grpc.AspNetCore.Server](https://www.nuget.org/packages/Grpc.AspNetCore.Server/) nuget 包）现在是 .NET/C# 的推荐 gRPC 实现。原始 gRPC C# 实现（Grpc.Core nuget 包）将进入维护模式，不会获得任何新功能，并且只会收到重要的错误修复和安全修复。最终计划是在未来某个时候完全淘汰 Grpc.Core。本公告描述了我们决定这样做的原因，并更详细地阐述了该计划。

2019 年 9 月，我们[宣布][GA]全面推出新的 [gRPC C# 实现](https://github.com/grpc/grpc-dotnet)，该实现不再基于 gRPC C 核心本机库，而是使用 .NET Core 3 和 ASP.NET Core 3 中添加的 HTTP/2 协议实现。我们将此实现称为“grpc-dotnet”。

当我们介绍 grpc-dotnet 实现时，我们宣布两种 gRPC C# 实现（新的纯 C# grpc-dotnet 实现和基于 C 核心原生库的原始 gRPC C# 实现）将并存，让用户选择最适合他们的实现。这很有意义，因为 grpc-dotnet 在当时是全新的，需要刚刚发布的 .NET Core 框架，而原始的 gRPC C# 实现已经稳定了很长时间，拥有大量用户，甚至可以在非常旧的 .NET Framework 版本上运行。事情需要一些时间来解决。

从那时起，新的 grpc-dotnet 实现已经走过了漫长的道路：它已经被许多用户采用并且变得非常流行，它已经被很多应用程序在生产环境中使用，并且还添加了很多有趣的新功能。此外，其主要先决条件 .NET Core 3 框架已经存在了一段时间，并且其采用人数正在不断增长。

与此同时，虽然[原始 gRPC C# 实现](https://github.com/grpc/grpc/tree/master/src/csharp)（通常称为“Grpc.Core”，其 nuget 包的名称）确实占有一席之地并且非常受欢迎，但我们现在正接近这样一个阶段：一些在 2016 年（当时 gRPC C# 作为 GA 发布）非常有意义的设计决策不再具有过去的分量。例如，我们决定将 gRPC C# 实现基于本机库，因为在 2016 年，没有我们可以依赖的可用 C# HTTP/2 库。通过依赖 C 核心本机库，我们能够比从头开始用 C# 实现所有内容更快地交付稳定、高性能的 gRPC 库。但从今天的角度来看，采用本机依赖项已经没有多大意义了，因为 HTTP/2 支持现已内置到 .NET Core 框架中。拥有原生依赖项的好处正在减少，而拥有原生依赖项的维护负担却保持不变。

在两个稳定的 C# 实现中，grpc-dotnet 实现绝对是最具未来潜力的一个。它是一个更现代的实现，与现代版本的 .NET 很好地集成，并且可能会与几年后 C# 社区的发展更加一致。它也是一个纯 C# 实现（没有本机组件），这使得它更加友好，带来更好的可调试性，这也是 C# 爱好者喜欢看到的。

由于拥有两个用于 C# 的 gRPC 官方实现的维护成本并不小，而且从长远来看，grpc-dotnet 似乎是所有用户的最佳选择，因此我们想**宣布有意逐步淘汰原始 gRPC C# 实现（nuget 包 Grpc.Core），转而采用更现代、更具前瞻性的 grpc-dotnet 实现**。

以下各节描述了该计划的详细信息，并进一步解释了其意义所在。为了帮助了解逐步淘汰 Grpc.Core 决定的后果，我们还列出了常见问题列表并提供了答案。

### 是什么让 grpc-dotnet 成为首选实现

简而言之，grpc-dotnet 似乎是未来更好的选择。一些最重要的要点已经提到了。以下是我们相信 grpc-dotnet 将更好地满足用户需求的更详细原因：

- 这是一个更现代的实现，基于最新版本的功能
.NET 框架。因此，它可能是未来两种实现中更可行的一种。
- 它更符合 C# / .NET 社区现在和未来的状况。
与社区的发展方向保持一致似乎是 C# 中 gRPC 未来的最佳选择。
- 实施更加敏捷且贡献友好 - 因为它
内部基于众所周知的原语/API（ASP.NET 核心服务 API 和 HTTP2 客户端），并且它是用纯 C# 实现的，因此 C# 开发人员更容易访问该代码（无论是对于只想了解事物如何工作的用户，还是对于编写 PR 的潜在贡献者）。 grpc-dotnet 代码库相对较小，构建需要几秒钟，运行测试既简单又快捷。从长远来看，更容易的开发和贡献友好性应该弥补目前所缺少的一些功能，并使其成为用户的最佳选择——也就是说，降低贡献和修复/改进内容的障碍会在一段时间后转化为更多的内容被修复和更好的用户体验。
- 拥有一个用纯 C# 实现的库通常是很常见的事情
与依赖于本机组件的实现相比，受到 .NET 社区的青睐。虽然 C# 对与本机库的互操作提供了良好的支持，但这是大多数 C# 开发人员不熟悉的技术，对他们来说它看起来就像一个黑匣子。原生互操作很难做到正确，并且有许多缺点（例如，更复杂的开发和构建过程、复杂的调试、难以维护、难以获得社区贡献、难以为多个平台提供支持）。借助 Grpc.Core，我们能够克服大部分挑战（所以现在一切正常），但需要付出很大的努力，解决方案有时复杂且脆弱，维护成本高昂且需要大量专业知识。

注意：C# 的 Google.Protobuf 库已经完全用 C# 编写（没有本机组件），因此 gRPC 的纯 C# 实现可以完全摆脱开发人员微服务堆栈中的本机组件

### 为什么不永远保留 Grpc.Core？

在 C# 中开发 gRPC 的两个实现并不是免费的。它花费了宝贵的资源，我们相信工程时间最好花在使 C# 中的 gRPC 更易于使用和添加新功能（当然还有修复错误）上，而不是需要在两个服务于相同目的的不同代码库上工作。  此外，拥有两个单独的实现必然会在某种程度上分割用户群，并将贡献者的工作一分为二。此外，用户需要选择他们想要押注的两个实现中的哪一个的简单行为就会带来不确定性和固有风险（我们不希望我们的用户遇到这些风险）。

通过使 grpc-dotnet 成为推荐的实现，并使 Grpc.Core 实现“仅维护”（并最终逐步淘汰），我们的目标是实现以下目标：

- 释放工程资源来开发更好的功能和更好的可用性。
- 统一 gRPC C# 用户群。这将导致指导所有社区工作
以及对单一实施的贡献。它还消除了用户需要选择使用两个官方实现中的哪一个而造成的固有摩擦。
- 解决 Grpc.Core 的一些众所周知的痛点
很难通过其他方式解决。
- 通过与 .NET 保持一致，实现面向未来的 gRPC C#/.NET 实现
社区。


### 计划

**阶段 1：Grpc.Core 变为“仅维护”**

**时间：立即生效（2021 年 5 月）**

从现在开始，我们将不再为 Grpc.Core 提供新功能或增强功能。重要的错误和安全问题将继续以正常方式得到解决。

我们将正常发布 Grpc.Core 版本，通常每周 6 次。

这些版本将基于最新的 grpc C 核心本机库构建，因此所有不需要 C# 特定工作的新功能也将包含在内。

**第 2 阶段：Grpc.Core 变为“已弃用”**

**时间：一年后（2022 年 5 月）**

一旦达到这个里程碑，Grpc.Core 将不再受到官方支持，并且强烈建议所有用户从此时开始仅使用 grpc-dotnet。

Grpc.Core nuget 包将在 nuget.org 存储库中保持可用，但不会提供更多修复（= 甚至不提供安全修复）。

**Grpc.Tools 和 Grpc.Core.Api nuget 包的未来**

这两个软件包将继续得到完全支持，因为严格来说它们不是 Grpc.Core 的一部分，而且它们也被 grpc-dotnet 使用。

- Grpc.Tools nuget 包提供了 codegen 构建集成
C# 项目将继续受到支持（并且可能会得到改进）——因为 Grpc.Core 和 grpc-dotnet 都使用它。该软件包独立于 C 内核。
- Grpc.Core.Api 包是 grpc-dotnet 的先决条件，因此它可能会
也会随着时间的推移而发展（但它是一个纯 C# API 包，并且由于它只包含公共 API 表面，因此更改非常罕见）


### 问答

**我当前是 Grpc.Core 用户，这对我意味着什么？**

虽然我们将继续支持 Grpc.Core 一段时间（有关详细信息，请参阅弃用时间表），但如果您希望将来继续获得更新和错误修复，则必须将项目迁移到 grpc-dotnet。

**如何将现有项目迁移到 grpc-dotnet？**

由于 Grpc.Core 和 grpc-dotnet 是两个不同的库，因此您的项目中需要进行一些代码更改。由于这两种实现共享相同的 API 来调用和处理 RPC（我们有意将它们设计为这种方式），因此我们认为所需的代码更改应该相当少。对于许多应用程序，您只需要更改配置 gRPC 通道和服务端的方式即可；这通常只是应用程序实现的一小部分，并且往往与业务逻辑分离。

有关如何从 Grpc.Core 迁移到 grpc-dotnet 的更多提示，请参阅[将 gRPC 服务从 C-core 迁移到 ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/grpc/migration)。

我们计划在未来发布更详细的迁移指南，以方便从 Grpc.Core 迁移到 grpc-dotnet。

**我想在新项目中使用 C# 中的 gRPC。我应该选择哪种实现？**

我们强烈建议仅在新项目中使用 grpc-dotnet。我们将来将停止支持 Grpc.Core。

**这是否意味着我需要立即停止使用 Grpc.Core？**

不会，Grpc.Core 将继续受支持一段时间（请参阅弃用时间表）。您应该有足够的时间来评估情况并计划迁移。

**我没有在代码中直接使用 gRPC，但我使用的是 Google Cloud 客户端库（它在幕后使用 Grpc.Core）。这对我有何影响？**

此弃用目前不会影响 Google Cloud 客户端库的现有用户。

由于 Grpc.Core 是这些客户端库不可或缺的一部分，因此将继续为 Google Cloud 客户端库提供 Grpc.Core 的安全性和错误修复。

将为其提供扩展支持的客户端库：

- [适用于 .NET 的 Google 云库](https://github.com/googleapis/google-cloud-dotnet)
- [适用于 .NET 的 Google Ads 客户端库](https://github.com/googleads/google-ads-dotnet/)

请注意，仅当 Grpc.Core 用作这些客户端库的一部分时，才会为 Grpc.Core 提供扩展支持。对于除 Google Cloud 客户端库之外的其他用例，在弃用日期之后，Grpc.Core 将不再受到正式支持，用户必须在弃用发生之前将现有工作负载迁移到 grpc-dotnet。

**在哪里可以找到支持的功能列表？**

我们的 [github 上的文档](https://github.com/grpc/grpc-dotnet/blob/master/doc/implementation_comparison.md) 对支持的功能进行了比较。

**我有一个重要的 Grpc.Core 用例，但本文档未涵盖。**

我们欢迎您的反馈！通过 [grpc-io][] Google Group 或任何其他主要 [gRPC 社区渠道]() 给我们写信。

[ga]：
[grpc-io]: https://groups.google.com/g/grpc-io
[updates2022]: https://groups.google.com/g/grpc-io/c/OTj5mb1qzb0
[updates2023]: https://groups.google.com/g/grpc-io/c/iEalUhV4VrU
