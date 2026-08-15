---
spelling: cSpell:ignore channelz keepalives mainpage Yuxuan zpages
title: Channelz 简介
date: 2018-09-05
author:
  name: Yuxuan Li
  link: https://github.com/lyuxuan
source_url: https://grpc.io/blog/a-short-introduction-to-channelz/
---

Channelz 是一个提供有关 gRPC 中不同级别连接的全面运行时信息的工具。它旨在帮助调试可能受到网络、性能、配置问题等影响的实时程序。[gRFC](https://github.com/grpc/proposal/blob/master/A14-channelz.md) 提供了channelz 设计的详细说明，并且是跨语言的所有channelz 实现的规范参考。本博客的目的是让读者熟悉 Channelz 服务以及如何使用它来调试问题。这篇文章的上下文是在 [gRPC-Go](https://github.com/grpc/grpc-go) 中设置的，但总体思想应该适用于跨语言。在撰写本文时，channelz 可用于 [gRPC-Go](https://github.com/grpc/grpc-go) 和 [gRPC-Java](https://github.com/grpc/grpc-java)。对 [C++](https://github.com/grpc/grpc) 和包装语言的支持即将推出。

<!--more-->

让我们通过一个简单的示例来学习channelz，该示例使用channelz 来帮助调试问题。我们存储库中的 [helloworld](https://github.com/grpc/grpc-go/tree/master/examples/helloworld) 示例稍作修改以设置有错误的场景。您可以在这里找到完整的源代码：[客户端](https://gist.github.com/lyuxuan/515fa6da7e0924b030e29b8be56fd90a)，[服务端](https://gist.github.com/lyuxuan/81dd08ca649a6c78a61acc7ab05e0fef)。

> **客户端设置：**
> 客户端将向指定目标发出 100 个 SayHello RPC 并进行负载均衡
> 循环策略的工作负载。每个调用都有 150 毫秒的超时时间。远程过程调用
> 记录响应和错误以用于调试目的。

运行程序，我们注意到日志中出现间歇性错误，错误代码为**DeadlineExceeded**，如图1所示。

然而，没有任何线索说明是什么导致了超过截止时间的错误，并且有很多可能性：

* 网络问题，例如：连接丢失
* 代理问题，例如：请求/响应中途丢失
* 服务端问题，例如：请求丢失或响应缓慢

![](https://grpc.io/img/log.png) <p style="text-align: center"> 图1. 程序日志截图</p>

让我们打开 grpc INFO 日志记录以获取更多调试信息，看看是否可以找到有用的信息。

![](https://grpc.io/img/logWithInfo.png) <p style="text-align: center"> 图 2. gRPC INFO log</p>

如图 2 所示，信息日志表明与服务端的所有三个连接均已连接并准备好传输 RPC。日志中没有出现可疑事件。从信息日志中可以推断出的一件事是所有连接始终处于开启状态，因此可以排除丢失连接的假设。

为了进一步缩小问题的根本原因，我们将向channelz寻求帮助。

Channelz 通过 gRPC 服务提供 gRPC 内部网络机器统计信息。要启用channelz，用户只需在程序中将channelz服务注册到gRPC服务端并启动服务端即可。下面的代码片段显示了用于将channelz服务注册到[grpc.Server](https://godoc.org/google.golang.org/grpc#Server)的API。请注意，我们的示例客户端已完成此操作。

```go
import "google.golang.org/grpc/channelz/service"

// s is a *grpc.Server
service.RegisterChannelzServiceToServer(s)

// call s.Serve() to serve channelz service
```

一个名为 [grpc-zpages](https://github.com/grpc/grpc-experiments/tree/master/gdebug) 的 Web 工具已经开发出来，可以通过网页方便地提供 Channelz 数据。首先，配置 Web 应用程序以连接到为 Channelz 服务提供服务的 gRPC 端口（请参阅上一个链接中的说明）。然后，在浏览器中打开channelz网页。您应该看到如图 3 所示的网页。现在我们可以开始查询channelz！

![](https://grpc.io/img/mainpage.png) <p style="text-align: center"> 图 3. Channelz 主页</p>

由于错误发生在客户端，我们首先单击 [TopChannels](https://github.com/grpc/proposal/blob/master/A14-channelz.md#gettopchannels)。 TopChannels 是没有父通道的根通道的集合。在 gRPC-Go 中，顶级通道是用户通过 [NewClient](https://godoc.org/google.golang.org/grpc#ClientConn) 创建的 [ClientConn](https://godoc.org/google.golang.org/grpc#NewClient)，用于进行 RPC 调用。顶级通道是channelz中的[Channel](https://github.com/grpc/grpc-proto/blob/9b13d199cc0d4703c7ea26c9c330ba695866eb23/grpc/channelz/v1/channelz.proto#L37)类型，它是可以向其发出RPC的连接的抽象。

![](https://grpc.io/img/topChan1.png) <p style="text-align: center"> 图 4. TopChannels 结果</p>

因此，我们单击“TopChannels”，就会出现如图 4 所示的页面，其中列出了所有直播的顶级通道以及相关信息。

如图 5 所示，只有一个 id = 2 的顶部通道（请注意，方括号中的文本是内存中通道对象的引用名称，该名称可能因语言而异）。

查看**数据**部分，我们可以看到该通道上的 100 次调用中有 15 次失败。

![](https://grpc.io/img/topChan2.png) <p style="text-align: center"> 图 5. 顶部通道 (id = 2)</p>

在右侧，它显示该通道没有子**通道**、3 个**子通道**（如图 6 中突出显示的）和 0 **套接字**。

![](https://grpc.io/img/topChan3.png) <p style="text-align: center"> 图 6. Channel 拥有的子通道 (id = 2)</p>

[子通道](https://github.com/grpc/grpc-proto/blob/9b13d199cc0d4703c7ea26c9c330ba695866eb23/grpc/channelz/v1/channelz.proto#L61) 是对连接的抽象，用于负载均衡。例如，您想要向“google.com”发送请求。解析器将“google.com”解析为为“google.com”提供服务的多个后端地址。在此示例中，客户端设置了循环负载均衡器，因此所有实时后端都会发送相同的流量。然后到每个后端的（逻辑）连接表示为子通道。在 gRPC-Go 中，[SubConn](https://godoc.org/google.golang.org/grpc/balancer#SubConn) 可以被视为子通道。

父 Channel 拥有的三个子通道意味着存在与三个不同后端的三个连接，用于向其发送 RPC。让我们深入了解它们中的每一个以获取更多信息。

因此，我们单击列出的第一个子通道 ID（即“4\[\]”），然后将呈现如图 7 所示的页面。我们可以看到该子通道上的所有调用都已成功。因此，该子渠道不太可能与我们遇到的问题有关。

![](https://grpc.io/img/subChan4.png)

<p style="text-align: center"> 图 7. 子通道 (id = 4)</p>

所以我们返回并单击子通道 5（即“5\[\]”）。同样，网页表明子通道 5 也从未出现过任何失败的调用。

![](https://grpc.io/img/subChan6_1.png) <p style="text-align: center"> 图 8. 子通道 (id = 6)</p>

最后，我们单击子通道 6。这一次，有一些不同。正如我们在图 8 中看到的，该子通道上的 34 个 RPC 调用中有 15 个失败。请记住，父 Channel 也恰好有 15 个失败的调用。因此，子通道 6 就是问题的根源。子通道的状态是**READY**，这意味着它已连接并准备好传输 RPC。这就排除了网络连接问题。为了挖掘更多信息，让我们看看这个子通道拥有的 Socket。

[Socket](https://github.com/grpc/grpc-proto/blob/9b13d199cc0d4703c7ea26c9c330ba695866eb23/grpc/channelz/v1/channelz.proto#L227) 大致相当于一个文件描述符，一般可以视为两个端点之间的 TCP 连接。在grpc-go中，[http2Client](https://github.com/grpc/grpc-go/blob/ce4f3c8a89229d9db3e0c30d28a9f905435ad365/internal/transport/http2_client.go#L46)和[http2Server](https://github.com/grpc/grpc-go/blob/ce4f3c8a89229d9db3e0c30d28a9f905435ad365/internal/transport/http2_server.go#L61)对应于Socket。请注意，网络侦听器也被视为套接字，并将显示在channelz服务端信息中。

![](https://grpc.io/img/subChan6_2.png) <p style="text-align: center"> 图 9. 子通道 (id = 6) 拥有 Socket (id = 8)</p>

我们单击页面底部的 Socket 8（参见图 9）。现在我们看到如图 10 所示的页面。

该页面提供了有关套接字的全面信息，例如正在使用的安全机制、流计数、消息计数、keepalive、流量控制编号等。套接字选项信息未在屏幕截图中显示，因为其中有很多并且与我们正在调查的问题无关。

**远程地址**字段表明我们遇到问题的后端是**“127.0.0.1:10003”**。这里的流计数与父子通道的调用计数完全对应。由此我们可以知道服务端并没有主动发送DeadlineExceeded错误。这是因为如果服务端返回 DeadlineExceeded 错误，则流将全部成功。客户端流的成功与调用是否成功无关。它由是否已接收到设置了 EOS 位的 HTTP2 帧来确定（有关更多信息，请参阅 [gRFC](https://github.com/grpc/proposal/blob/master/A14-channelz.md#socket-data)）。另外，我们可以看到发送的消息数量为 34，这等于调用的数量，这排除了客户端因某种原因卡住并导致超过截止时间的可能性。总而言之，我们可以将问题范围缩小到在 127.0.0.1:10003 上提供服务的服务端。可能是服务端响应缓慢，或者它前面的某些代理正在丢弃请求。

![](https://grpc.io/img/socket8.png) <p style="text-align: center"> 图 10. 套接字 (id = 8)</p>

如您所见，只需点击几下，channelz 就帮助我们查明了问题的潜在根本原因。您现在可以专注于所指定的服务端所发生的情况。同样，channelz 也可以帮助加快服务端的调试。

我们就到此为止，让读者探索服务端的channelz，它比客户端更简单。在channelz中，[Server](https://github.com/grpc/grpc-proto/blob/9b13d199cc0d4703c7ea26c9c330ba695866eb23/grpc/channelz/v1/channelz.proto#L199)也是一个像Channel一样的RPC入口点，传入的RPC到达并得到处理。在grpc-go中，一个[grpc.Server](https://godoc.org/google.golang.org/grpc#Server)对应一个channelz Server。与 Channel 不同，Server 仅将 Socket（监听套接字和正常连接的套接字）作为其子级。

以下是给读者的一些提示：

* 查找地址为 (127.0.0.1:10003) 的服务端。
* 查看调用计数。
* 转到服务端拥有的套接字。
* 查看Socket 流计数和消息计数。

您应该注意到，服务端套接字接收的消息数量与客户端套接字（套接字 8）发送的消息数量相同，这排除了中间代理行为不当（丢弃请求）的情况。服务端套接字发送的消息数量等于客户端接收的消息数量，这意味着服务端无法在截止时间之前发回响应。您现在可以查看 [服务端](https://gist.github.com/lyuxuan/81dd08ca649a6c78a61acc7ab05e0fef) 代码来验证这是否确实是原因。

> **服务端设置：**
> 服务端程序启动三个 GreeterServer，其中两个使用
> 一个实现
> ([服务端](https://gist.github.com/lyuxuan/81dd08ca649a6c78a61acc7ab05e0fef#file-main-go-L42))
> 在响应客户时不会造成任何延迟，并且使用
> 实施
> ([慢速服务端](https://gist.github.com/lyuxuan/81dd08ca649a6c78a61acc7ab05e0fef#file-main-go-L50))
> 在发送响应之前注入 100ms - 200ms 的可变延迟。

正如您通过这个演示所看到的，channelz 帮助我们快速缩小了问题的可能原因，并且易于使用。有关更多资源，请参阅详细的channelz [gRFC](https://github.com/grpc/proposal/blob/master/A14-channelz.md)。在 GitHub 上找到我们：[github.com/grpc/grpc-go](https://github.com/grpc/grpc-go)。
