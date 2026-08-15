---
title: gRPC在浏览器中的状态
date: 2019-01-08
spelling: cSpell:ignore Brandhorst envoyproxy Fibyl grpcweb grpcwebproxy grpcwebtext Johan npmjs restjson roadmap
author:
  name: Johan Brandhorst
  link: https://jbrandhorst.com
  position: Software Engineer at [InfoSum](https://www.infosum.com)
  guest: true
source_url: https://grpc.io/blog/state-of-grpc-web/
---

gRPC 1.0 于 2016 年 8 月发布，现已发展成为应用程序通信的首要技术解决方案之一。它已被全球的初创公司、企业公司和开源项目采用。它对多语言环境的支持、对性能、类型安全和开发人员生产力的关注已经改变了开发人员设计架构的方式。

<!--more-->

到目前为止，这些好处基本上只提供给移动应用程序和后端开发人员，而前端开发人员必须继续依赖 JSON REST 接口作为信息交换的主要手段。然而，随着 gRPC-Web 的发布，gRPC 有望成为前端开发人员工具箱中的一个有价值的补充。

在这篇文章中，我将描述浏览器中 gRPC 的一些历史，探讨当今世界的状况，并分享一些对未来的想法。

# 开始

2016 年夏天，Google 的一个团队和 Improbable<sup id="a1">[1](#f1)</sup> 独立开始致力于实现可称为“浏览器的 gRPC”的东西。他们很快发现了彼此的存在，并共同为新协议定义了规范<sup id="a2">[2](#f2)</sup>。

## gRPC-Web 规范

目前不可能在浏览器中实现 HTTP/2 gRPC 规范<sup id="a3">[3](#f3)</sup>，因为根本没有浏览器 API 对请求进行足够细粒度的控制。例如：没有办法强制使用 HTTP/2，即使有，原始 HTTP/2 帧在浏览器中也无法访问。 gRPC-Web 规范从 HTTP/2 规范的角度出发，然后定义了差异。这些特别包括：

- 支持 HTTP/1.1 和 HTTP/2。
- 在请求/响应主体的最后发送 gRPC 预告片
由 gRPC 消息头中的新位指示 <sup id="a4">[4](#f4)</sup>。
- 用于在 gRPC-Web 请求和 gRPC HTTP/2 之间进行转换的强制代理
回应。

## 技术

基本思想是让浏览器发送正常的 HTTP 请求（使用 Fetch 或 XHR），并在 gRPC 服务端前面有一个小型代理，将请求和响应转换为浏览器可以使用的内容。

![gRPC-Web代理的作用](https://grpc.io/img/grpc-web-proxy.png)

# 两个实现

Google 和 Improbable 的团队都继续在两个不同的存储库中实现该规范<sup id="a5">[5](#f5)、</sup><sup id="a6">[6](#f6)</sup>，并且实现略有不同，因此两者都没有完全不同符合规范，并且很长一段时间都不与对方的 proxy<sup id="a7">[7](#f7),</sup><sup id="a8">[8](#f8)</sup> 兼容。

Improbable gRPC-Web 客户端<sup id="a9">[9](#f9)</sup> 在 TypeScript 中实现，并在 npm 上以 `@improbable-eng/grpc-web`<sup id="a10">[10](#f10)</sup> 的形式提供。还有一个可用的 Go 代理，既可以作为可以导入现有 Go gRPC 服务端的包<sup id="a11">[11](#f11)</sup>，也可以作为独立代理，用于将任意 gRPC 服务端公开给 gRPC-Web前端<sup id="a12">[12](#f12)</sup>。

Google gRPC-Web 客户端<sup id="a13">[13](#f13)</sup> 是使用 Google Closure 库<sup id="a14">[14](#f14)</sup> 基础在 JavaScript 中实现的。它在 npm 上可用，名称为 `grpc-web`<sup id="a15">[15](#f15)</sup>。它最初附带了一个作为 NGINX 扩展实现的代理<sup id="a16">[16](#f16)</sup>，但后来加倍了 Envoy 代理 HTTP 过滤器<sup id="a17">[17](#f17)</sup>，这自 v1.4.0 以来的所有版本均可用。

## 功能集

gRPC HTTP/2 实现都支持四种方法类型：一元、服务端、客户端和双向流。然而，gRPC-Web 规范并没有特别强制要求任何客户端或双向流支持，只是在浏览器中实现 WHATWG Streams<sup id="a18">[18](#f18)</sup> 后才会实现。

Google 客户端支持一元和服务端流式传输，但仅在与 `grpcwebtext` 模式一起使用时。 `grpcweb` 模式仅完全支持一元请求。这两种模式指定了在请求和响应中对 protobuf 有效负载进行编码的不同方式。

Improbable 客户端支持一元流和服务端流，并且具有根据浏览器功能自动在 XHR 和 Fetch 之间进行选择的实现。

下表总结了支持的不同功能：

|客户/功能|运输|一元|服务端流|客户端和双向流|
| ---------------------- | ------------ | ----- | -------------------------------- | -------------------------------------- |
|不太可能|获取/XHR️|✔️|✔️|❌<sup id="a19">[19](#f19)</sup>|
|谷歌 (`grpcwebtext`)|XHR️|✔️|✔️|❌|
|谷歌 (`grpcweb`)|XHR️|✔️|❌<sup id="a20">[20](#f20)</sup>|❌|

有关此表的更多信息，请参阅[我在 github 上的兼容性测试存储库](https://github.com/johanbrandhorst/grpc-web-compatibility-test)。

兼容性测试可能会演变成某种自动化测试框架，以在未来强制执行和记录各种兼容性。

## 兼容性问题

当然，使用两个不同的代理也会带来兼容性问题。幸运的是，这些问题最近已得到解决，因此您可以期望将任一客户端与任一代理一起使用。

# 未来

Google 实现于 2018 年 10 月宣布发布 1.0 版并全面发布<sup id="a21">[21](#f21)</sup>，并发布了未来目标的路线图<sup id="a22">[22](#f22)</sup>，包括：

- 高效的类似 JSON 的消息编码
- Node、Python、Java 等的进程内代理
- 与流行框架集成（React、Angular、Vue）
- 获取 API 传输以实现内存高效流式传输
- 双向流支持

Google 正在寻找有关哪些功能对社区很重要的反馈，因此，如果您认为其中任何功能对您特别有价值，请填写他们的调查<sup id="a23">[23](#f23)</sup>。

这两个项目最近的谈判同意将 Google 客户端和 Envoy 代理推广为新用户的首选解决方案。 Improbable 客户端和代理将保留为规范的替代实现，不依赖 Google Closure，但应被视为实验性的。将为现有用户迁移到 Google 客户端制作迁移指南，并且团队正在共同努力融合生成的 API。

# 结论

Google 客户端将继续稳步实施新功能和修复，并有一个致力于其成功的团队，并且它是官方 gRPC 客户端。它不像 Improbable 客户端那样提供 Fetch API 支持，但如果这对社区来说是一个重要功能，那么就会添加它。 Google 团队和更大的社区正在官方客户端上进行合作，以造福整个 gRPC 社区。自 GA 公告以来，社区对 Google gRPC-Web 存储库的贡献急剧增加。

在两个代理之间进行选择时，功能没有差异，因此这取决于您的部署模型。 Envoy 适合某些场景，而进程内 Go 代理有其自身的优势。

如果您今天开始使用 gRPC-Web，请首先尝试 Google 客户端。它具有严格的 API 兼容性保证，并建立在 Gmail 和 Google 地图使用的坚如磐石的 Google Closure 库基础上。如果您需要 Fetch API 内存效率或实验性 Websocket 客户端和双向流，Improbable 客户端是一个不错的选择，并且在可预见的将来，Improbable 将继续使用和维护它。

无论哪种方式，gRPC-Web 都是 Web 开发人员的绝佳选择。它将复杂协议的可移植性、性能和工程引入浏览器，并标志着前端开发人员激动人心的时刻！

## 参考

1. <a id="f1"></a> [improbable.io/games/blog/grpc-web-moving-past-restjson-towards-type-safe-web-apis](https://improbable.io/games/blog/grpc-web-moving-past-restjson-towards-type-safe-web-apis) [↩](#a1)
2. <a id="f2"></a> [github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md) [↩](#a2)
3. <a id="f3"></a> [github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md) [↩](#a3)
4. <a id="f4"></a> [github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md#protocol-differences-vs-grpc-over-http2](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md#protocol-differences-vs-grpc-over-http2) [↩](#a4)
5. <a id="f5"></a> [github.com/improbable-eng/grpc-web](https://github.com/improbable-eng/grpc-web) [↩](#a5)
6. <a id="f6"></a> [github.com/grpc/grpc-web](https://github.com/grpc/grpc-web) [↩](#a6)
7. <a id="f7"></a> [github.com/improbable-eng/grpc-web/issues/162](https://github.com/improbable-eng/grpc-web/issues/162) [↩](#a7)
8. <a id="f8"></a> [github.com/grpc/grpc-web/issues/91](https://github.com/grpc/grpc-web/issues/91) [↩](#a8)
9. <a id="f9"></a> [github.com/improbable-eng/grpc-web/tree/master/client/grpc-web](https://github.com/improbable-eng/grpc-web/tree/master/client/grpc-web) [↩](#a9)
10. <a id="f10"></a> [npmjs.com/package/@improbable-eng/grpc-web](https://www.npmjs.com/package/@improbable-eng/grpc-web) [↩](#a10)
11. <a id="f11"></a> [github.com/improbable-eng/grpc-web/tree/master/go/grpcweb](https://github.com/improbable-eng/grpc-web/tree/master/go/grpcweb) [↩](#a11)
12. <a id="f12"></a> [github.com/improbable-eng/grpc-web/tree/master/go/grpcwebproxy](https://github.com/improbable-eng/grpc-web/tree/master/go/grpcwebproxy) [↩](#a12)
13. <a id="f13"></a> [github.com/grpc/grpc-web/tree/master/javascript/net/grpc/web](https://github.com/grpc/grpc-web/tree/master/javascript/net/grpc/web) [↩](#a13)
14. <a id="f14"></a> [developers.google.com/closure](https://developers.google.com/closure) [↩](#a14)
15. <a id="f15"></a> [npmjs.com/package/grpc-web](https://www.npmjs.com/package/grpc-web) [↩](#a15)
16. <a id="f16"></a> [github.com/grpc/grpc-web/tree/master/net/grpc/gateway](https://github.com/grpc/grpc-web/tree/master/net/grpc/gateway) [↩](#a16)
17. <a id="f17"></a> [envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/grpc_web_filter](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/grpc_web_filter) [↩](#a17)
18. <a id="f18"></a> [streams.spec.whatwg.org](https://streams.spec.whatwg.org) [↩](#a18)
19. <a id="f19"></a> Improbable 客户端支持客户端和
使用实验性 Websocket 传输进行双向流传输。这不是 gRPC-Web 规范的一部分，不建议用于生产使用。 [↩](#a19)
20. <a id="f20"></a> `grpcweb` 允许调用服务端流方法，但是
在流关闭之前它不会返回数据。 [↩](#a20)
21. <a id="f21"></a> [gRPC-Web 全面可用](https://grpc.io/blog/grpc-web-ga/) [↩](#a21)
22. <a id="f22"></a> [github.com/grpc/grpc-web/blob/master/doc/roadmap.md](https://github.com/grpc/grpc-web/blob/master/doc/roadmap.md) [↩](#a22)
23. <a id="f23"></a> [docs.google.com/forms/d/1NjWpyRviohn5jaPntosBHXRXZYkh_Ffi4GxJZFibylM](https://docs.google.com/forms/d/1NjWpyRviohn5jaPntosBHXRXZYkh_Ffi4GxJZFibylM) [↩](#a23)
