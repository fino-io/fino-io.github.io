---
title: gRPC-Go 工程实践
date: 2018-01-22
spelling: cSpell:ignore Fawley godoc rebases SLOs untriaged
author:
  name: Doug Fawley
  link: https://github.com/dfawley
  position: gRPC-Go Team Lead, Google
source_url: https://grpc.io/blog/grpc-go-engineering-practices/
---

这是新年的开始，也是我在 gRPC-Go 项目上的第一个完整年度的结束，所以我想借此机会提供有关 gRPC-Go 开发状态的最新信息，并让我们了解我们如何管理该项目。  对我个人而言，这是我做出有意义贡献的第一个开源项目，所以今年对我来说是一次学习经历。  这一年来，团队不断改进我们的工作习惯和沟通方式。  我仍然看到改进的空间，但我相信我们的情况比一年前要好得多。

<!--more-->

## 回购健康状况

当我第一次加入 gRPC-Go 团队时，他们已经有几个月没有以前的技术领导了。  当时，我们有 45 个开放的 PR，其中最老的当时已有一年多了。  作为新的团队成员和维护者，过时的 PR 的积累使得评估优先级和了解事物的状态变得困难。  对于我们的贡献者来说，当我们因为其他提交而开始要求 rebase 时，忽视 PR 既是不尊重，也是不便。  为了解决这个问题，我们齐心协力合并或关闭所有这些 PR，现在我们每周举行一次会议，审查每个活跃 PR 的状态，以防止这种情况再次发生。

与此同时，我们有 103 个未解决的问题，其中许多已经修复或过时或未经分类。  从那时起，我们修复或关闭了其中 85 个问题，并制定了一个流程，以确保我们每周轮流对新问题进行分类和优先排序。  与我们的 PR 类似，我们也在每周会议中审查分配的和高优先级的问题。

我们针对新问题和 PR 的持续 SLO 是 1 周的分类和首次响应。

我们还修改了问题和 PR 的[标签](https://github.com/grpc/grpc-go/labels)，以帮助组织。  我们通常对每个问题应用优先级 (P0-P3) 和类型（例如 Bug、功能或性能）。  我们还有一系列适用于各种情况的状态标签。  类型标签也应用于 PR，以帮助生成我们的发行说明。

## 版本控制和向后兼容性

我们最近记录了我们的[版本控制策略](https://github.com/grpc/grpc-go/blob/master/Documentation/versioning.md)。我们的目标是保持完全的向后兼容性，除非在有限的情况下，包括实验性 API 和减轻安全风险（最值得注意的是 [#1392](https://github.com/grpc/grpc-go/pull/1392)）。如果您发现行为回归，请随时在我们的存储库中[提出问题](https://github.com/grpc/grpc-go/issues/new)（请[保持理性](https://xkcd.com/1172/)）。

## gRFC

[gRPC 提案存储库](https://github.com/grpc/proposal) 包含需要预先设计的 gRPC 重大功能更改的提案，称为 gRFC。  此流程的目的是提供可见性并征求社区的反馈。  每个更改都会在我们的[邮件列表](https://groups.google.com/g/grpc-io) 上进行讨论，并在更改之前进行辩论。  我们在进行破坏向后兼容性的元数据更改 ([gRFC L7](https://github.com/grpc/proposal/blob/master/L7-go-metadata-api.md)) 之前利用了这一点，并且还用于设计新的解析器/平衡器 API ([gRFC L9](https://github.com/grpc/proposal/pull/30))。

## 回归测试

我们仓库中的每个 PR 都必须通过我们的单元测试和端到端测试。  我们目前的测试覆盖率为 85%。  每当发现回归时，我们都会添加一个涵盖失败场景的测试，既向我们自己证明问题已通过修复解决，又防止它在未来再次发生。  这也有助于我们提高整体覆盖率。  我们还打算以非阻塞的方式重新启用所有 PR 的覆盖率报告（[相关问题](https://github.com/grpc/grpc-go/issues/1676)）。

除了测试正确性之外，我们怀疑会影响性能的任何 PR 都会通过我们的基准测试来运行。  我们在[开源存储库](https://github.com/grpc/grpc-go/tree/master/benchmark) 和 Google 内部都有一组基准测试。  这些包括我们认为对用户最重要的各种工作负载，包括流式处理和一元工作负载，其中一些是专门为测量我们的最佳 QPS、吞吐量或延迟而设计的。

## 发布

gRPC-Go 的 GA 版本是在 2016 年 7 月与其他语言一起发布的。从那时到 2016 年底，该团队发布了多个补丁版本，但没有一个包含发行说明。  我们后续版本的规律性（每六周进行一次次要版本）和发行说明的质量都得到了改进。  我们还根据需要或在一周内针对更严重的问题发布补丁，将错误修复向后移植到旧版本。

在执行发布时，除了存储库中的测试之外，我们还与其他 gRPC 语言实现运行一整套互操作测试。  这个过程对我们来说效果很好，我们将在以后的博客文章中详细介绍这一点。

## 非开源工作

我们采取“开源优先”的方法来开发 gRPC。  这意味着，只要有可能，gRPC 功能都会直接添加到开源项目中。  然而，为了在 Google 的基础设施中工作，我们的团队有时需要在 gRPC 之上提供额外的功能。  这通常是通过 [stats API](https://godoc.org/google.golang.org/grpc/stats#Handler) 或 [拦截器](https://godoc.org/google.golang.org/grpc#UnaryClientInterceptor) 或 [自定义解析器](https://godoc.org/google.golang.org/grpc/resolver) 等挂钩来完成。

为了使 Google 的 gRPC 内部版本与开源版本保持同步，我们每周或按需导入。  在导入之前，我们在 Google 内运行依赖于 gRPC 的每个测试。  这为我们提供了另一种方法，可以在开源中执行发布之前捕获问题。

## 期待

2018 年，我们打算做更多同样的事情，并围绕解决问题和接受对项目的贡献维持我们的 SLO。  我们还希望更积极地使用[需要帮助](https://github.com/grpc/grpc-go/labels/Status%3A%20Help%20Wanted) 标签来标记问题，以便任何希望做出贡献的人有更多的问题可供选择。

对于 gRPC 本身，我们现在的主要关注点之一是性能，我们希望这能够明显地使我们的许多用户受益。  短期内，我们正在完成一些令人兴奋的变化，这些变化应该可以在高并发的情况下减少 30% 以上的延迟，从而使 QPS 提高约 25%。  一旦这项工作完成，我们就有了接下来要解决的其他[性能问题](https://github.com/grpc/grpc-go/issues?q=is%3Aissue+is%3Aopen+label%3A%22Type%3A+Performance%22) 的列表。

在用户体验方面，我们希望提供更好的文档，并开始通过更好的注释和更多示例来改进我们的 godoc。  我们希望改善使用 gRPC 的整体体验，因此我们将在分布式跟踪、监控和测试项目上密切合作，以使 gRPC 服务在生产中更易于管理。  我们想做更多，希望从这些开始并听取反馈将帮助我们稳步改进。
