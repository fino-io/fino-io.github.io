---
title: 在 ARM64 上运行 gRPC 和 Protobuf（在 Linux 上）
date: 2021-06-23
spelling: Tattermusch
author:
  name: Jan Tattermusch
  link: https://github.com/jtattermusch
source_url: https://grpc.io/blog/grpc-on-arm64/
---

ARM 处理器最近在许多计算领域变得越来越重要，包括那些传统上被认为仅限 x86_64 的领域。由于 ARM 生态系统的发展势头，我们预计 ARM 平台的采用将显着增长。提供支持基于 ARM 平台的软件也是如此。

由于 gRPC 和 protocol buffers 的主要目的是互连分布式系统，因此它们在支持 ARM 计算方面的作用尤为重要。随着 ARM 云计算的出现，我们预计许多系统实际上将是 x86 和 ARM 服务端的混合组合，根据需要混合和匹配每个生态系统的质量。 gRPC 和协议缓冲区是理想的构建块，使用户能够构建无缝跨越多种架构的系统。

为了满足 gRPC 用户对支持 ARM 的极高需求，gRPC 团队决定正式全面支持选定的基于 ARM 的平台。不久前，我们开始努力测试所有内容并解决我们遇到的任何问题。 **今天，我们很高兴地宣布，C++、C#、Go、Java、Node、PHP、Python 和 Ruby 中的 gRPC 和协议缓冲区实现已准备好用于 ARM64 Linux 的生产工作负载**（请参阅下面的更多详细信息）。

我们完成的一般领域列表可以最好地描述当前的状况：

- **错误修复/改进：** 我们进行了许多修复，以确保 gRPC 和 protobuf 在 ARM64 Linux 上可靠地工作。
- **软件包和分发：** 对于提供二进制体系结构特定软件包的语言，我们添加了 ARM64 Linux 软件包，并开始在每个版本上发布它们，作为我们标准发布流程的一部分。拥有现成的二进制包可以极大地改善开发人员的体验。对于不提供二进制包的语言，我们测试了构建是否按预期工作，并且可以毫无问题地在 ARM64 Linux 上安装 gRPC 和 protobuf。
- **持续测试：** 我们投入了大量资源来设置持续测试，确保 gRPC 和 protobuf 得到充分测试并防止未来出现任何回归。对大型项目进行多次测试并支持多种语言绝对是一个挑战，特别是在 ARM 架构测试的开源生态系统仍处于起步阶段的情况下，但我们通过交叉编译、模拟测试和在真实硬件上运行测试的结合，成功地测试了 gRPC 和 protobuf。

## ARM64 Linux 上的 gRPC 和 Protobuf 支持概述

在下表中，您可以查看按语言细分的详细状态。每个条目都总结了 ARM64 Linux 上 gRPC 和 Protobuf 的支持级别。

<table> <tr> <td style="white-space: nowrap">语言</td> <td style="white-space: nowrap">持续测试</td> <td>分发/包</td> <td>附加信息</td> </tr> <tr> <td>C++</td> <td style="background: #90ee90;">✔️</td> <td style="background: #90ee90;">使用 cmake 或 bazel 从源构建（与 x86_64 上的方法相同）</td> <td></td> </tr> <tr> <td>C#</td> <td style="background: #90ee90;">✔️</td> <td style="background: #90ee90;">Grpc.Core nuget 软件包现在具有 aarch64 Linux 支持（从<code>v2.38.1</code>)</td> <td>Grpc.Tools nuget 包现在支持 aarch64 Linux</td> </tr> 上的 codegen <tr> <td>Go</td> <td style="background: #90ee90;">✔️ <sup>1</sup></td> <td style="background: #90ee90;">使用golang中安装库的标准方式（与 x86_64 上的体验相同）</td> <td></td> </tr> <tr> <td>Java</td> <td style="background: #90ee90;">✔️</td> <td style="background: #90ee90;">每个版本发布的 Maven 工件在 aarch64 Linux 上运行良好</td> <td>aarch64 协议和 grpc-java 协议插件随每个版本发布</td> </tr> <tr> <td  style="white-space: nowrap">Node/Javascript</td> <td style="background: #90ee90;">✔️</td> <td style="background: #90ee90;">使用现有的 npm 包（它们是平台无关）</td> <td></td> </tr> <tr> <td>PHP</td> <td style="background: #90ee90;">✔️</td> <td style="background: #90ee90;">现有的 PECL 和 Composer 包在 aarch64 Linux 上运行良好</td> <td></td> </tr> <tr> <td>Python</td> <td style="background: #90ee90;">✔️</td> <td style="background: #90ee90;">每个版本都会发布适用于 aarch64 Linux 的预构建轮子（从<code>v1.38.1</code>)</td> <td>grpcio-tools 软件包现在支持 aarch64 Linux上的 codegen</td> </tr> <tr> <td>Ruby</td> <td style="background: #90ee90;">✔️</td> <td style="background: #ffcccb;">aarch64 Linux 的预构建本机 gem 尚不可用。为了使用 grpc-ruby 和 protobuf-ruby，用户需要从源代码构建 gem</td> <td> 持续的测试已经到位并且一致通过，但我们尚未提供预构建的包。 ruby 中的 gRPC 和 protobuf 使用安全，但安装体验欠佳</td> </tr> </table>

*<sup>1</sup> grpc-go 已进行连续测试，protobuf-go 正在进行中。 protobuf-go 已在 aarch64 上手动测试，并发现其工作可靠。*

### ARM64 / aarch64 / ARMv8 术语

虽然术语 ARM64、aarch64 和 ARMv8 表示的含义略有不同，但实际上它们经常互换使用。出于本文的目的，它们本质上都表示相同的意思，并且可以将它们视为同义词。

### 官方 ARM64 支持目前仅限 Linux

目前我们仅在 Linux 上的 ARM64 上正式支持 gRPC 和 Protobuf。我们确实意识到其他平台也需要 ARM64 支持（例如带有新 Apple M1 Silicon 的 MacOS X），但其中一些平台面临重大挑战（配置硬件、缺乏仿真等）。与其因为这些复杂性而推迟 ARM64 支持的发布，不如先专注于为 Linux 提供官方 ARM64 支持，这样更有意义 - 所以我们就开始吧。

## 附录：更改/修复/改进列表

`grpc/grpc` 存储库

- https://github.com/grpc/grpc/pull/25258
- https://github.com/grpc/grpc/pull/25418
- https://github.com/grpc/grpc/pull/25453
- https://github.com/grpc/grpc/pull/25517
- https://github.com/grpc/grpc/pull/25602
- https://github.com/grpc/grpc/pull/25717
- https://github.com/grpc/grpc/pull/25928
- https://github.com/grpc/grpc/pull/26136
- https://github.com/grpc/grpc/pull/26409
- https://github.com/grpc/grpc/pull/26416
- https://github.com/grpc/grpc/pull/26430

`grpc/grpc-java` 存储库

- https://github.com/grpc/grpc-java/pull/8113
- https://github.com/grpc/grpc-java/pull/7812
- https://github.com/grpc/grpc-java/pull/7822

`grpc/grpc-go` 存储库

- https://github.com/grpc/grpc-go/pull/4344

`protocolbuffers/protobuf` 存储库

- https://github.com/protocolbuffers/protobuf/pull/8280
- https://github.com/protocolbuffers/protobuf/pull/8391
- https://github.com/protocolbuffers/protobuf/pull/8392
- https://github.com/protocolbuffers/protobuf/pull/8485
- https://github.com/protocolbuffers/protobuf/pull/8501
- https://github.com/protocolbuffers/protobuf/pull/8544
- https://github.com/protocolbuffers/protobuf/pull/8638
