---
title: gRPC 项目现已发布 1.0，并准备好进行生产部署
date: 2016-08-23
author:
  name: Varun Talwar
  position: Google
  link: https://cloud.google.com
  blurb: Originally written by Varun Talwar with additional content by Kailash Sethuraman and others at Google.
thumbnail: ../img/gcp-icon.png?raw=true
source_url: https://grpc.io/blog/ga-announcement/
---

今天，gRPC 项目通过其 [1.0 版本](https://github.com/grpc/grpc/releases) 达到了一个重要的里程碑。迁移到 1.0 的语言包括跨 Linux、Windows 和 Mac 的 C++、Java、Go、Node、Ruby、Python 和 C#。 iOS 和 Android 上的 Objective-C 和 Android Java 支持也已迁移至 1.0。 1.0 版本意味着核心协议和 API 表面现在已经稳定，具有测量的性能、压力测试，开发人员可以依赖这些 API 并在生产中部署，他们将从这里遵循语义版本控制。

我们对迄今为止所取得的进展感到非常兴奋，并感谢所有用户和贡献者。 gRPC 于 2015 年 3 月首次随 [Square](https://corner.squareup.com/2015/02/grpc.html) 发布，现已在许多开源项目中使用，例如 CoreOS 的 [etcd](https://github.com/coreos/etcd)、Docker 的 [containerd](https://github.com/docker/containerd)、Cockroach Labs 的 [cockroachdb](https://github.com/cockroachdb/cockroach) 以及许多其他项目[Vendasta](https://vendasta.com)、[Netflix](https://github.com/Netflix/ribbon)、[YikYak](http://yikyakapp.com) 和 [Carbon 3d](http://carbon3d.com) 等公司。  除了微服务之外，[Cisco](https://github.com/CiscoDevNet/grpc-getting-started)、[Juniper](https://github.com/Juniper/open-nti)、[Arista](https://github.com/aristanetworks/goarista) 和 Ciena 等电信巨头正在使用 gRPC 从其网络设备构建对流式遥测和网络配置的支持，作为 [OpenConfig](http://www.openconfig.net/) 工作的一部分。

从测试版开始，我们在[通向 1.0 之路](https://www.youtube.com/watch?v=_vfbVJ_u5mE) 的可用性、互操作性和性能测量方面取得了重大进展。在大多数语言中，[gRPC 运行时的安装](https://grpc.io/blog/installation/) 以及开发环境的设置都是一个命令。除了安装之外，我们还为跨语言和 RPC 类型的 gRPC 设置了自动化测试，以便对我们的 API 进行压力测试并确保互操作性。现在有一个公开的[性能仪表板](https://goo.gl/tHPEfD)，可以查看各种语言的一元和流式 ping pong 的延迟和吞吐量。其他测量结果表明，使用 gRPC/Protobuf 而不是 HTTP/JSON 可以获得显着收益，例如 [CoreOS 博客文章](https://blog.gopheracademy.com/advent-2015/etcd-distributed-key-value-store-with-grpc-http2/) 和 [Google Cloud PubSub 测试](https://cloud.google.com/blog/big-data/2016/03/announcing-grpc-alpha-for-google-cloud-pubsub)。在接下来的几个月中，我们将在性能调优方面投入更多资金。

即使在 Google 内部，我们也看到了 Google 云 API，例如 [BigTable](https://cloudplatform.googleblog.com/2015/07/A-Go-client-for-Google-Cloud-Bigtable.html)、PubSub、[Speech](https://github.com/GoogleCloudPlatform/java-docs-samples/tree/master/speech/grpc)，推出了基于 gRPC 的 API 界面，从而带来了易用性和性能优势。 [Tensorflow](https://research.googleblog.com/2016/02/running-your-models-in-production-with.html) 等产品也有效地使用 gRPC 进行进程间通信。除了使用之外，我们还希望看到贡献者社区随着 gRPC 的发展而成长。我们已经开始在 [grpc-ecosystem](https://github.com/grpc-ecosystem) 组织中看到有关 gRPC 的有意义的贡献。我们很高兴看到像 [grpc-gateway](https://github.com/grpc-ecosystem/grpc-gateway) 这样的项目，使用户能够使用基于 gRPC 的服务为 REST 客户端提供服务，[Polyglot](https://github.com/grpc-ecosystem/polyglot) 拥有用于 gRPC 的 CLI，[Prometheus 监控](https://github.com/grpc-ecosystem/go-grpc-prometheus) gRPC 服务并与[开放跟踪](https://github.com/grpc-ecosystem/grpc-opentracing)。您可以[此处](https://docs.google.com/a/google.com/forms/d/119zb79XRovQYafE9XKjz9sstwynCWcMpoJwHgZJvK74/edit)向该组织建议和贡献项目。我们期待与社区合作，将 gRPC 项目推向新的高度。
