---
title: Google Cloud PubSub - 借助 gRPC 的强大功能！
date: 2016-03-24
author:
  name: Lisa Carey
  position: Google
source_url: https://grpc.io/blog/pubsub/
---

[Google Cloud PubSub](https://cloud.google.com/pubsub/) 是 Google 的可扩展实时消息传递服务，允许用户在独立应用程序之间发送和接收消息。它是 Google Cloud Platform 大数据产品的重要组成部分，世界各地的客户都使用它来构建自己强大的全球服务。但是，到目前为止，使用 Cloud PubSub API 的唯一方法是通过 HTTP 上的 JSON。随着 [PubSub gRPC alpha](https://cloud.google.com/blog/big-data/2016/03/announcing-grpc-alpha-for-google-cloud-pubsub) 的发布，这一切都发生了变化。现在，**用户可以通过 gRPC 访问 PubSub** 并受益于它带来的所有优势。

<!--more-->

[Alpha 指令和 gRPC 代码](https://cloud.google.com/pubsub/grpc-overview) 现在可用于 Python 和 Java 中的 gRPC PubSub。

但是，如果您现在想通过另一种语言（例如 C# 或 Ruby）的 gRPC 来使用此服务，该怎么办？一旦您拥有 Google 帐户，只需做一些额外的工作，您也可以做到这一点！您可以使用[我们的网站](https://grpc.io/docs/) 上的工具和说明从 PubSub 服务的 `.proto` 文件生成并使用您自己的 gRPC 客户端代码，该文件可从 [GitHub](https://github.com/googleapis/googleapis/blob/master/google/pubsub/v1/pubsub.proto) 获取。

[阅读完整的 Google Cloud PubSub 公告](https://cloud.google.com/blog/big-data/2016/03/announcing-grpc-alpha-for-google-cloud-pubsub)

[了解有关使用 Google Cloud PubSub 的更多信息](https://cloud.google.com/pubsub/docs)
