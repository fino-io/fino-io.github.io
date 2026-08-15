---
title: .NET Core ❤ gRPC
author:
  name: Sourabh Shirhatti
  link: https://twitter.com/sshirhatti
  position: Program Manager on the .NET team at Microsoft
  guest: true
date: 2019-09-23
source_url: https://grpc.io/blog/grpc-on-dotnetcore/
---

自 2018 年 11 月以来，Microsoft 的 .NET 团队一直与 gRPC 团队密切合作，开发适用于 .NET Core 的新的完全托管的 gRPC 实现。

我们很高兴地宣布 **grpc-dotnet** 今天可在 .NET Core 3.0 中使用！

## 如何获得？

**grpc-dotnet** 软件包刚刚发布到 [NuGet.org](https://www.nuget.org/profiles/grpc-packages)，并且已经可以在您的项目中使用。这些包还需要最新的 .NET Core 3.0 共享框架。您可以从 [.NET Core 3.0 下载页面](https://aka.ms/netcore3download) 下载适用于您的开发计算机的 .NET Core 3.0 SDK 并构建服务端以获取共享框架。

## 入门

由于 gRPC 现在是 .NET 生态系统中的一等公民，因此 gRPC 模板作为 .NET SDK 的一部分包含在内。首先，请在安装 SDK 后导航到控制台窗口并运行以下命令。

```sh
dotnet new grpc -o GrpcGreeter
cd GrpcGreeter
dotnet run
```

要创建 gRPC 客户端并使用新创建的 gRPC Greeter 服务进行测试，您可以[在此处遵循本教程的其余部分](https://docs.microsoft.com/aspnet/core/tutorials/grpc/grpc-start)。

## gRPC 不是已经可以与 .NET Core 一起使用了吗？

目前 .NET 的 gRPC 有两种官方实现：

- [**Grpc.Core**](https://github.com/grpc/grpc/tree/master/src/csharp)：基于本机 gRPC Core 库的原始 gRPC C# 实现。
- [**grpc-dotnet**](https://github.com/grpc/grpc-dotnet)：完全用 C# 编写的新实现，没有本机依赖项，​​并且基于新发布的 .NET Core 3.0。

这些实现并存，每个实现在可用功能、集成、支持的平台、成熟度级别和性能方面都有自己的优势。两种实现共享相同的 API 来调用和处理 RPC，从而限制锁定并使用户能够选择最能满足其需求的实现。

## 什么是新的？

与现有的基于 C-Core 的实现 ([Grpc.Core](https://github.com/grpc/grpc/tree/master/src/csharp)) 不同，新库 ([grpc-dotnet](https://github.com/grpc/grpc-dotnet)) 利用 .NET Core 基类库 (BCL) 中的现有网络原语。下图突出显示了现有 **Grpc.Core** 库和新 **grpc-dotnet** 库之间的差异。

![gRPC .NET 堆栈](https://grpc.io/img/grpc-dotnet.svg)

在服务端，`Grpc.AspNetCore.Server` 包集成到 ASP.NET Core 中，使开发人员能够从日志记录、配置、依赖项注入、认证、授权等常见横切问题的生态系统中受益，这些问题已经由 ASP.NET Core 解决。 ASP.NET 生态系统中的热门库（例如 [Entity Framework Core (ORM)](https://github.com/aspnet/EntityFrameworkCore)、[Serilog（日志记录库）](https://github.com/serilog/serilog) 和 [Identity Server](https://github.com/IdentityServer/IdentityServer4) 等）现在可以与 gRPC 无缝协作。

在客户端，`Grpc.Net.Client` 包基于作为 .NET Core 的一部分提供的熟悉的 `HttpClient` API 构建。与服务端一样，gRPC 客户端极大地受益于基于 `HttpClient` 构建的软件包生态系统。现在可以将 [**Polly**（弹性和故障处理库）](https://github.com/App-vNext/Polly) 和 [HttpClientFactory（管理 HTTPClient 生命周期）](https://docs.microsoft.com/aspnet/core/fundamentals/http-requests) 等现有包与 gRPC 客户端结合使用。

下图详细列出了 gRPC 的所有新 .NET 包及其与现有包的关系。

![grpc-dotnet 软件包](https://grpc.io/img/grpc-dotnet-packages.svg)

除了作为 **grpc-dotnet** 的一部分发布的新发布的软件包之外，我们还进行了对两个堆栈都有利的改进。 Visual Studio 2019 附带对 protobuf 文件的语言语法支持，并在保存 protobuf 文件时自动生成 gRPC 服务端/客户端代码，而无需因设计时构建而重新构建完整项目。

![Visual Studio 2019 中的 gRPC](https://grpc.io/img/grpc-visualstudio.png)

## 反馈

我们很高兴能够改善 .NET 开发人员的 gRPC 体验。尝试一下，让我们了解您使用 [grpc-dotnet 问题跟踪器](https://github.com/grpc/grpc-dotnet/issues) 可能遇到的功能想法或错误。
