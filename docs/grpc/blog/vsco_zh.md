---
title: VSCO 的 gRPC
date: 2016-09-06
authors:
- name: Robert Sayre
  position: VSCO
- name: Melinda Lu
  position: VSCO
blurb: |
  Thanks to the VSCO engineers that worked on this migration: Steven Tang, Sam Bobra, Daniel Song, Lucas Kacher, and many others.
thumbnail: ../img/vsco-logo.png?raw=true
source_url: https://grpc.io/blog/vsco/
---

我们今天的客座文章来自 VSCO 的 Robert Sayre 和 Melinda Lu。

[VSCO](https://vsco.co) 成立于 2011 年，是一个表达社区，让人们能够通过图像和文字进行创造、发现和联系。 VSCO 正在将其堆栈迁移到 gRPC。

<!--more-->

2015 年，用户增长迫使 VSCO 走上了一条熟悉的道路。自公司成立之初就存在的单体 PHP 应用程序表现出性能问题并且变得难以维护。我们在 Node.js、Go 和 Java 中尝试了一些较小的服务。与此同时，Go 中还构建了一个更大的消息服务，用于电子邮件、推送消息和应用内通知。远离 JSON 的第一步，我们选择 [Protocol Buffers](https://protobuf.dev) 作为该系统的序列化格式。

如今，VSCO 已基本选择使用 Go 来提供新服务。也有例外，特别是在针对给定问题有成熟的 JVM 解决方案可用的情况下。此外，VSCO 将 Node.js 用于 Web 应用程序，通常与服务端 [React](https://facebook.github.io/react/) 一起使用。鉴于下面详述的语言、服务和一些未来数据管道工作的混合，VSCO 选择 gRPC 和 Protocol Buffers 作为进程间通信的最实用的解决方案。从基于 HTTP/1.1 API 的 JSON 到基于 HTTP/2 的 gRPC 的逐步迁移正在进行中，并且进展顺利。也就是说，相对于其他语言，PHP 实现的成熟度存在问题。

协议缓冲区在构建我们的数据生态系统方面特别有价值，我们依靠它们来标准化并允许以与语言无关的方式安全地演变我们的数据模式。举个例子，我们构建了一项 Go 服务，该服务提供 MySQL 和 MongoDB 数据库复制日志，并将后端数据库更改转换为 Kafka 中的一串不可变事件流，并将每个行或文档更改事件编码为协议缓冲区。该数据库事件流允许我们根据需要添加实时数据消费者，而不会影响生产流量，也无需与其他系统协调。通过将所有数据库事件处理到前往 Kafka 的协议缓冲区中，我们可以确保数据以统一的方式编码，从而可以轻松地从多种语言中消费和使用。我们的 [MySQL-binary-log](https://github.com/vsco/autobahn-binlog) 和 [Mongo-oplog](https://github.com/vsco/autobahn-oplog) tailers 的实现可在 GitHub 上找到。

在数据管道的其他地方，我们已经开始使用 gRPC 和协议缓冲区将行为事件从 iOS 和 Android 客户端传递到 Go 摄取服务，然后该服务将这些事件发布到 Kafka。为了支持这种大容量用例，我们需要 (1) 一个高性能、容错、与语言无关的 RPC 框架，(2) 一种在产品发展过程中确保数据兼容性的方法，以及 (3) 水平可扩展的基础设施。我们发现 Kubernetes 中运行的 gRPC、protocol buffers 和 Go 服务非常适合这三者。由于这是我们第一个面向客户端的 Go gRPC 服务，我们确实遇到了一些新的摩擦点——特别是，由于 HTTP/2 生态系统还很年轻，负载均衡器支持和类似curl 的调试等设施一直滞后。然而，使用 gRPC IDL 定义服务、使用拦截器等内置架构以及使用 Go 进行扩展的便利性使得这些权衡是值得的。

作为将 gRPC 引入移动客户端的第一步，我们在 iOS 和 Android 应用程序中提供了遥测代码。从 gRPC 1.0 开始，这个过程相对简单。到目前为止，他们仅将事件发布到我们的服务端，并且对 gRPC 响应没有做太多事情。之前的实现是基于 JSON 的，我们转向事件的单个协议缓冲区定义，发现了客户端之间的一系列细微错误和差异。

我们遇到的一个小障碍是，我们的客户需要在我们的升级过程中保持与 JSON 实现的兼容性，以及与供应商 SDK 的集成。在 iOS 上这需要一些键值编码，但在 Android 上则变得更加困难。我们最终不得不编写一个 protobuf 编译器插件来获得我们所需的反射功能，同时保持足够的性能。借鉴这一经验，我们在 GitHub 上制作了一个使用 [Bazel](https://github.com/vsco/protoc-demo) 构建的简洁的[示例协议插件](https://bazel.io/)。

随着越来越多的数据以协议缓冲区的形式提供，我们计划基于这个统一的模式来扩展我们的机器学习和分析系统。例如，我们将 Kafka 数据库复制流以 [Apache Parquet](https://parquet.apache.org/) 的形式写入 Amazon S3，这是一种高效的列式磁盘存储格式。 Parquet 对协议缓冲区具有低级支持，因此我们可以使用现有的数据定义来编写优化表并在需要时进行部分反序列化。

从 S3 开始，我们使用 Apache Spark 对数据进行计算，Apache Spark 可以使用我们的协议缓冲区定义来定义类型。我们还使用 [TensorFlow](https://www.tensorflow.org/) 构建新的机器学习应用程序。它原生使用协议缓冲区，并允许我们使用 [TensorFlow Serving](https://tensorflow.github.io/serving/) 将模型作为 gRPC 服务提供服务。

到目前为止，我们在 gRPC 和 Protocol Buffers 方面运气不错。它们并不能消除所有集成难题。然而，很容易看出它们如何帮助我们的工程师避免编写大量样板 RPC 代码，同时避免随宽松序列化格式而来的无休止的数据质量剪纸。
