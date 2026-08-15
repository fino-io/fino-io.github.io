---
title: gRPC - 现在易于安装
date: 2016-04-04
author:
  name: Lisa Carey
  position: Google
spelling: cSpell:ignore autofetch grpcio monodevelop pecl
source_url: https://grpc.io/blog/installation/
---

今天，我们很高兴提供一个更新，可显着简化 gRPC 的入门体验。

<!--more-->

* 对于大多数语言，**gRPC 运行时现在可以通过本机包管理器一步安装**，例如用于 Node.js 的 `npm`、用于 Ruby 的 `gem` 和用于 Python 的 `pip`。尽管我们的 Node、Ruby 和 Python 运行时都封装在 gRPC 的 C 核心上，但用户现在不需要在大多数 Linux 发行版中以包的形式显式预安装 C 核心库。我们会自动为您获取它:-)。

* **对于 Java，我们通过提供 Maven 和 Gradle 插件简化了向构建工具添加 gRPC 支持所需的步骤**。这些使您可以轻松依赖核心运行时将生成的库部署或发送到生产环境中。

* 您还可以使用我们的 Dockerfile 来使用这些更新的软件包 - 部署基于 gRPC 构建的微服务现在应该是一种非常简单的体验。

安装故事尚未完成：我们现在专注于通过以与 gRPC 运行时相同的方式打包协议缓冲区插件来改善您的开发体验。这将简化代码生成和开发环境的设置。

###想尝试一下吗？

以下是今天以我们支持的所有语言安装 gRPC 运行时的方法：

语言|平台|命令
---------|----------|--------
Node.js|Linux、Mac、Windows|`npm install grpc`
Python|Linux、Mac、Windows|`pip install grpcio`
红宝石|Linux、Mac、Windows|`gem install grpc`
PHP|Linux、Mac、Windows|`pecl install grpc-beta`
去|Linux、Mac、Windows|`go get google.golang.org/grpc`
Objective-C|苹果|CocoaPods 从 GitHub 自动获取运行时源
C#|视窗|从 IDE（Visual Studio、Monodevelop、Xamarin Studio）安装 [gRPC NuGet 包](https://www.nuget.org/packages/Grpc/)
Java|Linux、Mac、Windows|使用我们的 [Maven 和 Gradle 插件](https://github.com/grpc/grpc-java/blob/master/README.md)，它们为 gRPC 提供[静态链接的 `boringssl`](https://github.com/grpc/grpc-java/blob/master/SECURITY.md#openssl-statically-linked-netty-tcnative-boringssl-static)
C++|Linux、Mac、Windows|目前需要[手动构建和安装](https://github.com/grpc/grpc/blob//src/cpp/README.md)

您可以在我们的[快速入门页面](https://grpc.io/docs/languages/) 和 GitHub 存储库中找到有关安装的更多信息。如果您遇到任何问题，请通过我们的[邮件列表](https://groups.google.com/g/grpc-io)向我们发送您的反馈，或者在我们的问题跟踪器上提交问题。
