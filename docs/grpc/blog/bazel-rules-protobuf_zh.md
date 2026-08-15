---
title: 使用bazel和rules_protobuf构建gRPC服务
date: 2016-10-13
author:
  name: Paul Cody Johnston
  link: https://pubref.org
  position: PubRef.org
thumbnail: https://avatars3.githubusercontent.com/u/10408150?v=3&s=200
source_url: https://grpc.io/blog/bazel-rules-protobuf/
---

[gRPC](https://grpc.io/) 通过提供各种不同语言生成的服务入口点，使构建高性能微服务变得更加容易。  [Bazel](https://bazel.io) 通过功能强大且快速的多语言构建环境补充了这些工作。

[rules_protobuf](https://github.com/pubref/rules_protobuf) 扩展了 bazel 并使开发 gRPC 服务变得更加容易。

<!--more-->
它通过以下方式做到这一点：

1. 构建`protoc`（协议缓冲区编译器）和所有
必要的 `protoc-gen-*` 插件。
1.构建gRPC相关所需的protobuf和gRPC库
要编译的代码。
1. 抽象掉 `protoc` 插件调用（你不必
必须学习或记住如何调用 `protoc`）。
1. protobuf源文件时重新生成并重新编译输出
改变。

在这篇文章中，我将提供有关 bazel 如何工作的背景知识（[第 1 部分](#about-bazel)）以及如何开始使用 Rules_protobuf 构建 gRPC 服务（[第 2 部分](#building)）。  如果您已经是 bazel 爱好者，可以直接跳到第 2 部分。



为了最好地遵循，[安装 bazel](https://www.bazel.io/versions/master/docs/install.html) 并克隆 Rules_protobuf 存储库：

```sh
git clone https://github.com/pubref/rules_protobuf
cd rules_protobuf
~/rules_protobuf$
```

伟大的。让我们开始吧！

#1：关于 Bazel {#about-bazel}

[Bazel](https://www.bazel.io/) 是 Google 内部构建工具“Blaze”的开源版本。  Blaze 源于管理使用多种语言编写的代码的大型单一存储库的挑战。  Blaze 是其他功能强大且快速的构建工具的灵感来源，包括 [Pants](https://www.pantsbuild.org/) 和 [Buck](https://buckbuild.com/)。  Bazel 在概念上很简单，但有一些核心概念和术语需要理解：

1. **Bazel 命令**：一个在以下情况下执行某种类型工作的函数：
从命令行调用。常见的包括 `bazel build`（编译库）、`bazel run`（运行二进制可执行文件）、`bazel    test`（执行测试）和 `bazel query`（告诉我有关构建依赖关系图的信息）。  使用 `bazel help` 查看所有内容。

1. **构建阶段**：三个阶段（加载、分析和
执行），bazel 在调用 bazel 命令时会经历该过程。

2. **WORKSPACE 文件**：定义项目的必需文件
根。  它主要用于声明外部依赖项（外部工作区）。

3. **构建文件**：目录中存在 `BUILD` 文件
将其定义为*包*。  `BUILD` 文件包含定义*目标*的*规则*，可以使用*目标模式语法*来选择目标*。规则是用一种名为 [*skylark*](https://bazel.io/versions/master/docs/skylark/index.html) 的类 Python 语言编写的。 Syklark 比 Python 具有更强的确定性保证，但有意将其最小化，排除了递归、类和 lambda 等语言功能。

## 1.1: 包结构

为了说明这些概念，我们看一下 [rules_protobuf 示例子目录](https://github.com/pubref/rules_protobuf/tree/master/examples) 的包结构。让我们看一下文件树，仅显示那些具有 `BUILD` 文件的文件夹：

```diff
tree -P 'BUILD|WORKSPACE' -I 'third_party|bzl' examples/
.
├── BUILD
├── WORKSPACE
└── examples
    ├── helloworld
    │   ├── cpp
    │   │   └── BUILD
    │   ├── go
    │   │   ├── client
    │   │   │   └── BUILD
    │   │   ├── greeter_test
    │   │   │   └── BUILD
    │   │   └── server
    │   │       └── BUILD
    │   ├── grpc_gateway
    │   │   └── BUILD
    │   ├── java
    │   │   └── org
    │   │       └── pubref
    │   │           └── rules_protobuf
    │   │               └── examples
    │   │                   └── helloworld
    │   │                       ├── client
    │   │                       │   └── BUILD
    │   │                       └── server
    │   │                           └── BUILD
    │   └── proto
    │       └── BUILD
    └── proto
        └── BUILD
```

## 1.2：目标

要获取 `examples/` 文件夹中的目标列表，请使用查询。这表示*“Ok bazel，向我显示示例文件夹中所有包中的所有可调用目标，并说明除了其路径标签之外它是什么样的东西”*：


```bash
~/rules_protobuf$ bazel query //examples/... --output label_kind | sort | column -t

cc_binary                   rule  //examples/helloworld/cpp:client
cc_binary                   rule  //examples/helloworld/cpp:server
cc_library                  rule  //examples/helloworld/cpp:clientlib
cc_library                  rule  //examples/helloworld/proto:cpp
cc_library                  rule  //examples/proto:cpp
cc_proto_compile            rule  //examples/helloworld/proto:cpp.pb
cc_proto_compile            rule  //examples/proto:cpp.pb
cc_test                     rule  //examples/helloworld/cpp:test
filegroup                   rule  //examples/helloworld/proto:protos
filegroup                   rule  //examples/proto:protos
go_binary                   rule  //examples/helloworld/go/client:client
go_binary                   rule  //examples/helloworld/go/server:server
go_library                  rule  //examples/helloworld/go/server:greeter
go_library                  rule  //examples/helloworld/grpc_gateway:gateway
go_library                  rule  //examples/helloworld/proto:go
go_library                  rule  //examples/proto:go_default_library
go_proto_compile            rule  //examples/helloworld/proto:go.pb
go_proto_compile            rule  //examples/proto:go_default_library.pb
go_test                     rule  //examples/helloworld/go/greeter_test:greeter_test
go_test                     rule  //examples/helloworld/grpc_gateway:greeter_test
grpc_gateway_proto_compile  rule  //examples/helloworld/grpc_gateway:gateway.pb
java_binary                 rule  //examples/helloworld/java/org/pubref/rules_protobuf/examples/helloworld/client:netty
java_binary                 rule  //examples/helloworld/java/org/pubref/rules_protobuf/examples/helloworld/server:netty
java_library                rule  //examples/helloworld/java/org/pubref/rules_protobuf/examples/helloworld/client:client
java_library                rule  //examples/helloworld/java/org/pubref/rules_protobuf/examples/helloworld/server:server
java_library                rule  //examples/helloworld/proto:java
java_library                rule  //examples/proto:java
java_proto_compile          rule  //examples/helloworld/proto:java.pb
java_proto_compile          rule  //examples/proto:java.pb
js_proto_compile            rule  //examples/helloworld/proto:js
js_proto_compile            rule  //examples/proto:js
py_proto_compile            rule  //examples/helloworld/proto:py.pb
ruby_proto_compile          rule  //examples/proto:rb.pb
```

我们不限于自己工作空间中的目标。  事实证明，[Google Protobuf 存储库](https://github.com/google/protobuf) 被命名为外部存储库（稍后会详细介绍），我们也可以以相同的方式处理该工作区中的目标。  这是部分列表：

```bash
~/rules_protobuf$ bazel query @com_github_google_protobuf//... --output label_kind | sort | column -t

cc_binary       rule  @com_github_google_protobuf//:protoc
cc_library      rule  @com_github_google_protobuf//:protobuf
cc_library      rule  @com_github_google_protobuf//:protobuf_lite
cc_library      rule  @com_github_google_protobuf//:protoc_lib
cc_library      rule  @com_github_google_protobuf//util/python:python_headers
filegroup       rule  @com_github_google_protobuf//:well_known_protos
java_library    rule  @com_github_google_protobuf//:protobuf_java
objc_library    rule  @com_github_google_protobuf//:protobuf_objc
py_library      rule  @com_github_google_protobuf//:protobuf_python
...
```

这是可能的，因为 protobuf 团队在其存储库的根目录中提供了一个 [BUILD 文件](https://github.com/google/protobuf/blob/master/BUILD)。  感谢 Protobuf 团队！  稍后我们将学习如何将我们自己的构建文件“注入”到还没有构建文件的存储库中。

检查上面的列表，我们看到一条名为 `protoc` 的 `cc_binary` 规则。如果我们 `bazel run` 该目标，bazel 将克隆 protobuf 存储库，构建所有依赖库，从源代码构建原始可执行二进制文件，并调用它（在双破折号后将命令行参数传递给二进制规则）：

```bash
~/rules_protobuf$ bazel run @com_github_google_protobuf//:protoc -- --help
Usage: https://grpc.io/private/var/tmp/_bazel_pcj/63330772b4917b139280caef8bb81867/execroot/rules_protobuf/bazel-out/local-fastbuild/bin/external/com_github_google_protobuf/protoc [OPTION] PROTO_FILES
Parse PROTO_FILES and generate output based on the options given:
  -IPATH, --proto_path=PATH   Specify the directory in which to search for
                              imports.  May be specified multiple times;
                              directories will be searched in order.  If not
                              given, the current working directory is used.
  --version                   Show version info and exit.
  -h, --help                  Show this text and exit.
...
```

正如我们稍后将看到的，*我们使用特定的提交 ID 来命名 protobuf 外部依赖项，因此我们使用的协议版本不会有任何歧义*。  通过这种方式，您可以在项目中提供可靠、可重复、安全精确的工具，而不会通过签入二进制文件、诉诸 git 子模块或类似的 hack 来使存储库膨胀。  很干净！

> 注意：gRPC 存储库还有一个 BUILD 文件：`$ bazel query
> @com_github_grpc_grpc//... --输出 label_kind`

## 1.3: 目标模式语法

有了这些示例，让我们进一步检查一下目标语法。  当我第一次开始使用 bazel 时，我发现目标模式语法有点令人生畏。  其实还不错。仔细看看：

![](https://grpc.io/img/target-pattern-syntax.png)

* `@`（at 符号）选择外部工作区。这些都是
由[工作空间规则](https://bazel.io/docs/be/workspace.html#workspace-rules) 建立，将名称绑定到通过网络（或文件系统）获取的内容。

* `//`（双斜杠）选择工作空间根目录。

* `:`（冒号）选择*包*内的目标（规则或文件）。
回想一下，包是通过工作空间的子文件夹中存在 `BUILD` 文件来建立的。

* `/`（单斜杠）选择工作区中的文件夹或
包裹。

> 一个常见的混乱来源是，仅仅存在
> BUILD 文件将该文件系统子树定义为一个包，并且
> 因此，人们必须始终考虑到这一点。  例如，如果有
> `foo/bar/baz/` 中存在文件 `qux.js` 并且存在 BUILD
> 文件也在 `baz/` 中，该文件是用 `foo/bar/baz:qux.js` 选择的
> 而不是 `foo/bar/baz/quz.js`

*常用快捷方式*：如果存在与包同名的规则，则这是隐含目标，可以省略。  例如，外部工作区 `com_google_guava_guava` 中的 `//jar` 包中有一个 `:jar` 目标，因此以下内容是等效的：

```python
deps = ["@com_google_guava_guava//jar:jar"]
deps = ["@com_google_guava_guava//jar"]
```

## 1.4：外部依赖项：工作区规则

许多大型组织签入所有必需的工具、编译器、链接器等，以保证正确、可重复的构建。  通过外部工作区，人们可以有效地完成同样的事情，而不会导致存储库膨胀。

> 注意：bazel约定是使用完全命名空间的标识符
> 对于外部依赖项名称（将特殊字符替换为
> 下划线）。  例如，远程存储库 URL 是
> https://github.com/google/protobuf.git. 这被简化为
> 工作区标识符 com_github_google_protobuf。  同样，通过
> 约定jar神器`io.grpc:grpc-netty:jar:1.0.0-pre1`
> 变为 `io_grpc_grpc_netty`。

### 1.4.1：需要预先存在的工作空间的工作空间规则

这些规则假定远程资源或 URL 包含位于文件树顶部的 WORKSPACE 文件和定义规则目标的 BUILD 文件。  这些被称为*bazel 存储库*。

* [git_repository](https://bazel.io/docs/be/workspace.html#git_repository):
来自 git 存储库的外部 bazel 依赖项。  该规则需要 `commit`（或 `tag`）。

* [http_archive](https://bazel.io/docs/be/workspace.html#http_archive):
来自 URL 的外部 zip 或 tar.gz 依赖项。为了安全起见，强烈建议命名为 sha265。

> 注意：虽然您不直接与 bazel 交互
>execution_root，可以看看这些外部依赖是什么
> 看起来就像在 `$(bazel info
>execution_root)/external/WORKSPACE_NAME`。

### 1.4.2：为您自动生成 WORKSPACE 文件的工作空间规则

这些存储库规则的实现包含自动生成 WORKSPACE 文件和 BUILD 文件以使资源可用的逻辑。与往常一样，建议提供已知的 sha265 安全性，以防止恶意代理通过受感染的网络溜入受污染的代码。

* [http_jar](https://bazel.io/docs/be/workspace.html#http_jar):
来自 URL 的外部 jar。 jar 文件可作为 `java_library` 依赖项 `@WORKSPACE_NAME//jar` 提供。

* [maven_jar](https://bazel.io/docs/be/workspace.html#maven_jar):
来自 URL 的外部 jar。 jar 文件可作为 `java_library` 依赖项 `@WORKSPACE_NAME//jar` 提供。

* [http_文件](https://bazel.io/docs/be/workspace.html#http_file):
来自 URL 的外部文件。该资源可通过 `@WORKSPACE_NAME//file` 以 `filegroup` 形式提供。

例如，我们可以通过以下方式查看生成的 `maven_jar` guava 依赖项的 BUILD 文件：

```bash
~/rules_protobuf$ cat $(bazel info execution_root)/external/com_google_guava_guava/jar/BUILD
```

```python
# DO NOT EDIT: automatically generated BUILD file for maven_jar rule com_google_guava_guava
java_import(
    name = 'jar',
    jars = ['guava-19.0.jar'],
    visibility = ['//visibility:public']
)

filegroup(
    name = 'file',
    srcs = ['guava-19.0.jar'],
    visibility = ['//visibility:public']
)
```

> 注意：外部工作区目录将不存在，直到您
> 确实需要它，所以你必须建立一个目标
> 需要它，例如 `bazel build
> 示例/helloworld/java/org/pubref/rules_protobuf/examples/helloworld/client`

### 1.4.3：接受 BUILD 文件作为参数的工作区规则

如果存储库没有 BUILD 文件，您可以将一个文件放入其文件系统根目录中，以使外部资源适应 bazel 的世界观，并使这些资源可供您的项目使用。

例如，考虑 [Mark Adler 的 zlib 库](https://github.com/madler/zlib)。首先，让我们了解一下这段代码依赖什么。  该查询表示“*Ok bazel，对于示例中的所有目标，找到所有依赖项（传递闭包集），然后告诉我哪些依赖项依赖于外部工作区 com_github_madler_zlib 的根包中的 zlib 目标。*”Bazel 报告了此反向依赖项集。  我们请求 graphviz 格式的输出，并将其通过管道传递给 dot 以生成图形：

```bash
~/rules_protobuf$ bazel query "rdeps(deps(//examples/...), @com_github_madler_zlib//:zlib)" \
                  --output graph | dot -Tpng -O
```

![](https://grpc.io/img/zlib-deps.png)

所以我们可以看到，所有与grpc相关的C代码最终都依赖于这个库。  但是，Mark 的仓库中没有 BUILD 文件...它来自哪里？

通过使用变体工作区规则 `new_git_repository`，我们可以提供我们的[自己的构建文件](https://github.com/pubref/rules_protobuf/blob/master/protobuf/build_file/com_github_madler_zlib.BUILD)（定义了 `cc_library` 目标），如下所示：

```python
new_git_repository(
  name = "com_github_madler_zlib",
  remote = "https://github.com/madler/zlib",
  tag: "v1.2.8",
  build_file: "//bzl:build_file/com_github_madler_zlib.BUILD",
)
```

这个 `new_*` 工作区规则系列使您的存储库保持精简，并允许您供应几乎任何类型的网络可用资源。  惊人的！

* [new_git_repository](https://bazel.io/docs/be/workspace.html#new_git_repository)
* [新本地存储库](https://bazel.io/docs/be/workspace.html#new_local_repository)
* [new_http_archive](https://bazel.io/docs/be/workspace.html#new_http_archive)

> 您还可以
> [编写自己的存储库规则](https://bazel.io/docs/skylark/repository_rules.html)
> 具有自定义逻辑来从网络中提取资源并绑定它
> 进入巴泽尔的宇宙观。

## 1.5：巴泽尔总结

当收到命令和目标模式时，bazel 会经历以下三个阶段：

1.加载：读取WORKSPACE和所需的BUILD文件。生成一个
依赖图。

2.分析：对于图中的所有节点，哪些节点实际上是
此构建需要吗？我们是否拥有所有必要的资源？

3. 执行：执行依赖图中每个需要的节点并
生成输出。

希望您现在已经拥有足够的 bazel 概念知识来提高工作效率。

## 1.6: 规则_protobuf

[rules_protobuf](https://github.com/pubref/rules_protobuf) 是 bazel 的扩展，负责：

1. 构建protocol buffer编译器`protoc`，

2. 下载和/或构建所有必需的 protoc-gen 插件。

2. 下载和/或构建所有必要的 gRPC 相关支持
图书馆。

3. 为您调用协议（按需），平滑
不同协议插件的特性。

它的工作原理是将一个或多个 `proto_language` 规范传递给 `proto_compile` 规则。  `proto_language` 规则包含有关如何调用插件和预测文件输出的元数据，而 `proto_compile` 规则解释 `proto_language` 规范并为 `protoc` 构建适当的命令行参数。  例如，以下是我们如何同时生成多种语言的输出：

```python
 proto_compile(
   name = "pluriproto",
   protos = [":protos"],
   langs = [
       "//cpp",
       "//csharp",
       "//closure",
       "//ruby",
       "//java",
       "//java:nano",
       "//python",
       "//objc",
       "//node",
   ],
   verbose = 1,
   with_grpc = True,
 )
```

```sh
bazel build :pluriproto
# ************************************************************
cd $(bazel info execution_root) && bazel-out/host/bin/external/com_github_google_protobuf/protoc \
--plugin=protoc-gen-grpc-java=bazel-out/host/genfiles/third_party/protoc_gen_grpc_java/protoc_gen_grpc_java \
--plugin=protoc-gen-grpc=bazel-out/host/bin/external/com_github_grpc_grpc/grpc_cpp_plugin \
--plugin=protoc-gen-grpc-nano=bazel-out/host/genfiles/third_party/protoc_gen_grpc_java/protoc_gen_grpc_java \
--plugin=protoc-gen-grpc-csharp=bazel-out/host/genfiles/external/nuget_grpc_tools/protoc-gen-grpc-csharp \
--plugin=protoc-gen-go=bazel-out/host/bin/external/com_github_golang_protobuf/protoc_gen_go \
--descriptor_set_out=bazel-genfiles/examples/proto/pluriproto.descriptor_set \
--ruby_out=bazel-genfiles \
--python_out=bazel-genfiles \
--cpp_out=bazel-genfiles \
--grpc_out=bazel-genfiles \
--objc_out=bazel-genfiles \
--csharp_out=bazel-genfiles/examples/proto \
--java_out=bazel-genfiles/examples/proto/pluriproto_java.jar \
--javanano_out=ignore_services=true:bazel-genfiles/examples/proto/pluriproto_nano.jar \
--js_out=import_style=closure,error_on_name_conflict,binary,library=examples/proto/pluriproto:bazel-genfiles \
--js_out=import_style=commonjs,error_on_name_conflict,binary:bazel-genfiles \
--go_out=plugins=grpc,Mexamples/proto/common.proto=github.com/pubref/rules_protobuf/examples/proto/pluriproto:bazel-genfiles \
--grpc-java_out=bazel-genfiles/examples/proto/pluriproto_java.jar \
--grpc-nano_out=ignore_services=true:bazel-genfiles/examples/proto/pluriproto_nano.jar \
--grpc-csharp_out=bazel-genfiles/examples/proto \
--proto_path=. \
examples/proto/common.proto
# ************************************************************
examples/proto/common_pb.rb
examples/proto/pluriproto_java.jar
examples/proto/pluriproto_nano.jar
examples/proto/common_pb2.py
examples/proto/common.pb.h
examples/proto/common.pb.cc
examples/proto/common.grpc.pb.h
examples/proto/common.grpc.pb.cc
examples/proto/Common.pbobjc.h
examples/proto/Common.pbobjc.m
examples/proto/pluriproto.js
examples/proto/Common.cs
examples/proto/CommonGrpc.cs
examples/proto/common.pb.go
examples/proto/common_pb.js
examples/proto/pluriproto.descriptor_set
```

各种 `*_proto_library` 规则（我们将在下面使用）在内部调用此 `proto_compile` 规则，然后使用生成的输出并使用必需的库将它们编译为 `.class`、`.so`、`.a` （或其他）对象。

所以让我们“做点什么”吧！我们将使用 bazel 和 Rules_protobuf 构建 gRPC 应用程序。


# 2: 使用rules_protobuf {#building} 构建 gRPC 服务

该应用程序将涉及两个不同 gRPC 服务之间的通信：

## 2.1：服务

1. **Greeter 服务**：这是熟悉的“Hello World”启动器
接受带有 `user` 参数的请求并回复字符串 `Hello {user}` 的示例。

1. **GreeterTimer服务**：这个gRPC服务会重复
批量调用 Greeter 服务并报告聚合批量时间（以毫秒为单位）。  通过这种方式，我们可以比较不同 Greeter 服务实现的一些平均 rpc 时间。

> 这是一个非正式基准，仅用于演示
> 构建 gRPC 应用程序。  对于更正式的性能测试，
> 咨询
> [gRPC 性能仪表板](https://performance-dot-grpc-testing.appspot.com/explore?dashboard=5760820306771968)。

## 2.2：编译程序

对于演示，我们将使用用 4 种语言编写的 6 个不同的编译程序：

* `GreeterTimer` 客户端（执行）。  该命令行界面需要
`//proto:greetertimer.proto` 文件中本地定义的 `greetertimer.proto` 服务定义。

* `GreeterTimer` 服务端 (java)。  这个基于netty的服务端需要
`//proto/greetertimer.proto` 文件和 `@org_pubref_rules_protobuf//examples/helloworld/proto:helloworld.proto` 中外部定义的 proto 定义。

* 四种 `Greeter` 服务端实现（C++、java、go 和 C#）。
Rules_protobuf 已经提供了这些示例实现，因此我们直接使用它们。

## 2.3: Protobuf 定义

GreeterTimer 接受一元 `TimerRequest` 并流回 `BatchResponse` 序列，直到处理完所有消息，此时远程过程调用完成。

```c
service GreeterTimer {
  // Unary request followed by multiple streamed responses.
  // Response granularity will be set by the request batch size.
  rpc timeHello(TimerRequest) returns (stream BatchResponse);
}
```

`TimerRequest` 包含有关在哪里联系 Greeter 服务、总共进行多少次 RPC 调用以及流回 BatchResponse 的频率（通过批量大小配置）的元数据。

```c
message TimerRequest {
  // the host where the grpc server is running
  string host = 1;
  // The port of the grpc server
  int32 port = 2;
  // The total number of hellos
  int32 total = 3;
  // The number of hellos before sending a BatchResponse.
  int32 batchSize = 4;
}
```

`BatchResponse` 报告批次中进行的调用数量、批次运行花费的时间以及剩余调用的数量。

```c
message BatchResponse {
  // The number of checks that are remaining, calculated relative to
  // totalChecks in the request.
  int32 remaining = 1;
  // The number of checks actually performed in this batch.
  int32 batchCount = 2;
  // The number of checks that failed.
  int32 errCount = 3;
  // The total time spent, expressed as a number of milliseconds per
  // request batch size (total time spent performing batchSize number
  // of health checks).
  int64 batchTimeMillis = 4;
}
```

非流 `Greeter` 服务采用一元 `HelloRequest` 并使用单个 `HelloReply` 进行响应：

```c
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply) {}
}

message HelloRequest {
  string name = 1;
  common.Config config = 2;
}

message HelloReply {
  string message = 1;
}
```

> `common.Config` 消息类型在这里不是特别有用
> 但用于演示导入的使用。  Rules_protobuf 可以
> 帮助进行具有多个原型 → 原型的更复杂的设置
> 依赖关系。


## 2.4: 构建 grpc_greetertimer 示例应用程序。

该演示应用程序可以在 [https://github.com/pubref/grpc_greetertimer](https://github.com/pubref/grpc_greetertimer) 克隆。

### 2.4.1：创建项目布局

这是我们将使用的目录布局和相关的 BUILD 文件：

```sh
mkdir grpc_greetertimer && cd grpc_greetertimer
~/grpc_greetertimer$ mkdir -p proto/ go/ java/org/pubref/grpc/greetertimer/
~/grpc_greetertimer$ touch WORKSPACE
~/grpc_greetertimer$ touch proto/BUILD
~/grpc_greetertimer$ touch proto/greetertimer.proto
~/grpc_greetertimer$ touch go/BUILD
~/grpc_greetertimer$ touch go/main.go
~/grpc_greetertimer$ touch java/org/pubref/grpc/greetertimer/BUILD
~/grpc_greetertimer$ touch java/org/pubref/grpc/greetertimer/GreeterTimerServer.java
```

### 2.4.2：工作空间

我们将首先创建 [WORKSPACE](https://github.com/pubref/grpc_greetertimer) 文件并引用rules_protobuf 存储库。  我们加载 `//bzl` 包中的主入口点 skylark 文件 [rules.bzl](https://github.com/pubref/rules_protobuf/blob/master/protobuf/rules.bzl) 并使用我们要使用的语言调用其 `protobuf_repositories` 函数（在本例中为 `java` 和 `go`）。我们还加载 [rules_go](https://github.com/bazelbuild/rules_go) 以获取 go 编译支持（未显示）。

```python
# File //:WORKSPACE
workspace(name = "org_pubref_grpc_greetertimer")

git_repository(
    name = "org_pubref_rules_protobuf",
    remote = "https://github.com/pubref/rules_protobuf.git",
    tag = "v0.6.0",
)

# Load language-specific dependencies
load("@org_pubref_rules_protobuf//java:rules.bzl", "java_proto_repositories")
java_proto_repositories()

load("@org_pubref_rules_protobuf//go:rules.bzl", "go_proto_repositories")
go_proto_repositories()
```

> 请参阅
> [repositories.bzl 文件](https://github.com/pubref/rules_protobuf/protobuf/internal/repositories.bzl),
> 如果您有兴趣检查依赖关系。

Bazel 实际上不会“获取”某些东西，除非我们稍后确实通过其他规则需要它，所以让我们继续编写一些代码。  我们将协议缓冲区源存储在 `//proto` 中，将 Java 源存储在 `//java` 中，并将源代码存储在 `//go` 中。

> 注意：bazel 工作空间内的 go 开发有点不同
> 比香草去。  特别是，人们不必遵守
> 典型的 `GOCODE` 布局具有 `src/`、`pkg/`、`bin/`
> 子目录。

### 2.4.3：GreeterTimer 服务端

[Java 服务端](https://github.com/pubref/grpc_greetertimer/blob/master/java/org/pubref/grpc/greetertimer/GreeterTimerServer.java) 的主要工作是接受请求，然后作为客户端连接到所请求的 Greeter 服务。  该实现对剩余消息的数量进行倒计时，并对每一条消息执行阻塞 `sayHello(request)`。  如果满足batchSize限制，则调用`observer.onNext(response)`消息，将响应流回客户端。


```java
/* File //java/org/pubref/grpc/greetertimer:GreeterTimerServer.java */

  while (remaining-- > 0) {

    if (batchCount++ == batchSize) {
      BatchResponse response = BatchResponse.newBuilder()
        .setRemaining(remaining)
        .setBatchCount(batchCount)
        .setBatchTimeMillis(batchTime)
        .setErrCount(errCount)
        .build();
      observer.onNext(response);
    }

    blockingStub.sayHello(HelloRequest.newBuilder()
                          .setName("#" + remaining)
                          .build());
  }
}
```

### 2.4.4：GreeterTimer 客户端

[Go 客户端](https://github.com/pubref/grpc_greetertimer/blob/master/go/main.go) 准备一个 `TimerRequest` 并从 `client.TimeHello` 方法返回一个流接口。  我们调用它的 `Recv()` 方法直到 EOF，此时调用完成。  每个 BatchResponse 的摘要都会简单地打印到终端上。

```go
// File: //go:main.go

func submit(client greeterTimer.GreeterTimerClient, request *greeterTimer.TimerRequest) error {
	stream, err := client.TimeHello(context.Background(), request)
	if err != nil {
		log.Fatalf("could not submit request: %v", err)
	}
	for {
		batchResponse, err := stream.Recv()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			log.Fatalf("error during batch recv: %v", err)
			return err
		}
		reportBatchResult(batchResponse)
	}
}
```

### 2.4.5: 生成go protobuf+gRPC代码

在我们的 `//proto:BUILD` 文件中，我们有一个从 Rules_protobuf 存储库加载的 `go_proto_library` 规则。  在内部，该规则向 bazel 声明它负责创建 `greetertimer.pb.go` 输出文件。这条规则实际上不会“做”任何事情，除非我们在其他地方依赖它。

```python
# File: //proto:BUILD
load("@org_pubref_rules_protobuf//go:rules.bzl", "go_proto_library")

go_proto_library(
    name = "go_default_library",
    protos = [
        "greetertimer.proto",
    ],
    with_grpc = True,
)
```

go 客户端实现依赖于 `go_proto_library` 作为 `go_binary` 规则的源文件提供者。  我们还传入一些在 `GRPC_COMPILE_DEPS` 列表中命名的编译时依赖项。

```python
load("@io_bazel_rules_go//go:def.bzl", "go_binary")
load("@org_pubref_rules_protobuf//go:rules.bzl", "GRPC_COMPILE_DEPS")

go_binary(
    name = "hello_client",
    srcs = [
        "main.go",
    ],
    deps = [
        "//proto:go_default_library",
    ] + GRPC_COMPILE_DEPS,
)
```

```bash
~/grpc_greetertimer$ bazel build //go:client
```

当我们调用 bazel 来实际构建客户端二进制文件时，会发生以下情况：

1. Bazel 检查二进制文件所依赖的输入（文件）是否
已更改（通过内容哈希和文件戳）。  Bazel 识别出 `//proto:go_default_library` 的输出文件尚未构建。

1. Bazel 检查是否所有必要的输入（包括工具）
对于 `go_proto_library` 可用。  如果没有，请下载并构建所有必要的工具。  然后，调用该规则。

1. 获取 `google/protobuf` 存储库并从中构建 `protoc`
源（通过 cc_binary 规则）。

2. 从源代码构建 `protoc-gen-go` 插件（通过 go_binary
规则）。

3. 使用 `protoc-gen-go` 插件调用 `protoc`
适当的选项和论点。

4.确认`go_proto_library`的所有声明的输出
实际构建的位置（应位于 `bazel-bin/proto/greetertimer.pb.go` 中）。

5、用客户端编译生成的`greetertimer.pb.go`
`main.go` 文件，创建 `bazel-bin/go/client` 可执行文件。

### 2.4.6: 生成 java protobuf 库

`java_proto_library` 规则在功能上与 `go_proto_library` 规则相同。  但是，它不是提供 `*.pb.go` 文件，而是将所有生成的输出捆绑到 `*.srcjar` 文件中（然后将其用作 `java_library` 规则的输入）。  这是 java 规则的实现细节。  以下是我们构建最终 java 二进制文件的方法：

```python
java_binary(
    name = "server",
    main_class = "org.pubref.grpc.greetertimer.GreeterTimerServer",
    srcs = [
        "GreeterTimerServer.java",
    ],
    deps = [
        ":timer_protos",
        "@org_pubref_rules_protobuf//examples/helloworld/proto:java",
        "@org_pubref_rules_protobuf//java:grpc_compiletime_deps",
    ],
    runtime_deps = [
        "@org_pubref_rules_protobuf//java:netty_runtime_deps",
    ],
)
```

1. `:timer_protos` 是本地定义的 `java_proto_library` 规则。

2. `@org_pubref_rules_protobuf//examples/helloworld/proto:java` 是
外部 `java_proto_library` 规则，用于在我们自己的工作区中生成greeter 服务客户端存根。

3. 最后，我们命名编译时和运行时依赖项
可执行的jar。  如果这些 jar 文件尚未从 Maven Central 下载，我们将在需要时立即获取它们：


```bash
~/grpc_greetertimer$ bazel build java/org/pubref/grpc/greetertimer:server
~/grpc_greetertimer$ bazel build java/org/pubref/grpc/greetertimer:server_deploy.jar
```

最后一种形式（具有额外的 `_deploy.jar`）称为 `:server` 规则的“隐式目标”。  当以这种方式调用时，bazel 将打包所有必需的类并生成一个可以在 jvm 中独立运行的独立可执行 jar。

### 2.4.7：运行它！

首先，我们将启动一个欢迎服务端（一次一个）：

```bash
~/grpc_greetertimer$ cd ~/rules_protobuf
~/rules_protobuf$ bazel run examples/helloworld/go/server
~/rules_protobuf$ bazel run examples/helloworld/cpp/server
~/rules_protobuf$ bazel run examples/helloworld/java/org/pubref/rules_protobuf/examples/helloworld/server:netty
~/rules_protobuf$ bazel run examples/helloworld/csharp/GreeterServer
INFO: Server started, listening on 50051
```

在单独的终端中，启动greetertimer服务端：

```bash
~/grpc_greetertimer$ bazel build //java/org/pubref/grpc/greetertimer:server_deploy.jar
~/grpc_greetertimer$ java -jar bazel-bin/java/org/pubref/grpc/greetertimer/server_deploy.jar
```

最后，在第三个终端中，调用greetertimer客户端：

```sh
# Timings for the java server
~/rules_protobuf$ bazel run examples/helloworld/java/org/pubref/rules_protobuf/examples/helloworld/server:netty

~/grpc_greeterclient$ bazel run //go:client -- -total_size 10000 -batch_size 1000
17:31:04 1001 hellos (0 errs, 8999 remaining): 1.7 hellos/ms or ~590µs per hello
# ... plus a few runs to warm up the jvm...
17:31:13 1001 hellos (0 errs, 8999 remaining): 6.7 hellos/ms or ~149µs per hello
17:31:13 1001 hellos (0 errs, 7998 remaining): 9.0 hellos/ms or ~111µs per hello
17:31:13 1001 hellos (0 errs, 6997 remaining): 8.9 hellos/ms or ~112µs per hello
17:31:13 1001 hellos (0 errs, 5996 remaining): 9.2 hellos/ms or ~109µs per hello
17:31:13 1001 hellos (0 errs, 4995 remaining): 9.4 hellos/ms or ~106µs per hello
17:31:13 1001 hellos (0 errs, 3994 remaining): 9.0 hellos/ms or ~111µs per hello
17:31:13 1001 hellos (0 errs, 2993 remaining): 9.4 hellos/ms or ~107µs per hello
17:31:13 1001 hellos (0 errs, 1992 remaining): 9.4 hellos/ms or ~107µs per hello
17:31:13 1001 hellos (0 errs, 991 remaining): 9.1 hellos/ms or ~110µs per hello
17:31:14 991 hellos (0 errs, -1 remaining): 9.0 hellos/ms or ~111µs per hello```

```sh
# go 服务端的计时
~/rules_protobuf$ bazel 运行示例/helloworld/go/server

~/grpc_greeterclient$ bazel run //go:client -- -total_size 10000 -batch_size 1000 17:32:33 1001 hellos (0 errs, 剩余 8999): 7.5 hellos/ms 或 ~134µs 每个 hello 17:32:33 1001 hellos (0 errs, 7998)剩余): 7.9 hellos/ms 或 ~127µs 每个 hello 17:32:34 1001 hellos (0 错误, 剩余 6997): 7.8 hellos/ms 或 ~128µs 每个 hello 17:32:34 1001 hellos (0 错误, 剩余 5996): 7.7 hellos/ms 或每个 hello 17:32:34 约 130 µs 1001 个 hello（0 个错误，剩余 4995 个）：7.9 个 hello/ms 或每个 hello 17:32:34 约 126 µs 1001 个 hello（0 个错误，剩余 3994 个）：8.0 个 hello/ms 或每个 hello 约 125 µs 17:32:34 1001 个问候（0 个错误，剩余 2993 个）：7.6 个问候/毫秒或每个问候约 132 µs 17:32:34 1001 个问候（0 个错误，剩余 1992 个）：7.9 个问候/毫秒或每个问候约 126 µs 17:32:34 1001 个问候（0 个错误，991 个）剩余）：7.9 hellos/ms 或每个 hello 约 127µs 17:32:34 991 hello（0 错误，剩余 -1）：7.8 hellos/ms 或每个 hello 约 128µs
```

```sh
# C++ 服务端的计时
~/rules_protobuf$ bazel 运行示例/helloworld/cpp:server

~/grpc_greeterclient$ bazel run //go:client -- -total_size 10000 -batch_size 1000 17:33:10 1001 hellos (0 errs, 剩余 8999): 9.1 hellos/ms 或 ~110µs 每个 hello 17:33:10 1001 hellos (0 errs, 7998)剩余）：9.0 hellos/ms 或 ~111µs 每个 hello 17:33:10 1001 hellos（0 错误，剩余 6997 个）：9.1 hellos/ms 或 ~110µs 每个 hello 17:33:10 1001 hellos（0 错误，剩余 5996 个）：8.6 hellos/ms 或每个 hello 17:33:10 约 116μs 1001 个 hello（0 个错误，剩余 4995 个）：9.0 个 hello/ms 或每个 hello 17:33:10 约 111μs 1001 个 hello（0 个错误，剩余 3994 个）：9.0 个 hello/ms 或每个 hello 17:33:10 约 111μs 1001 个问候（0 个错误，剩余 2993 个）：9.1 个问候/毫秒或每个问候约 110 µs 17:33:10 1001 个问候（0 个错误，剩余 1992 个）：9.0 个问候/毫秒或每个问候约 111 µs 17:33:10 1001 个问候（0 个错误，991 个）剩余）：9.0 hellos/ms 或每个 hello 约 111μs 17:33:11 991 hellos（0 个错误，剩余 -1）：9.0 hellos/ms 或每个 hello 约 111μs
```

```sh
# C# 服务端的计时
~/rules_protobuf$ bazel 运行示例/helloworld/csharp/GreeterServer

~/grpc_greeterclient$ bazel run //go:client -- -total_size 10000 -batch_size 1000 17:34:37 1001 hellos (0 errs, 剩余 8999): 6.0 hellos/ms 或 ~166µs 每个 hello 17:34:37 1001 hellos (0 errs, 7998)剩余): 6.7 hellos/ms 或 ~150µs 每个 hello 17:34:37 1001 hellos (0 错误, 剩余 6997): 6.8 hellos/ms 或 ~148µs 每个 hello 17:34:37 1001 hellos (0 错误, 剩余 5996): 6.8 hellos/ms 或每个 hello 17:34:37 约 147 µs 1001 个 hello（0 个错误，剩余 4995 个）：6.7 个 hello/ms 或每个 hello 17:34:38 约 150 µs 1001 个 hello（0 个错误，剩余 3994 个）：6.7 个 hello/ms 或每个 hello 约 150 µs 17:34:38 1001 个问候（0 个错误，剩余 2993 个）：6.7 个问候/毫秒或每个问候约 149 µs 17:34:38 1001 个问候（0 个错误，剩余 1992 个）：6.7 个问候/毫秒或每个问候约 149 µs 17:34:38 1001 个问候（0 个错误，991 个）剩余）：6.8 hellos/ms 或每个 hello 约 148µs 17:34:38 991 hello（0 错误，剩余 -1）：6.8 hellos/ms 或每个 hello 约 147µs
```

The informal analysis demonstrated comparable timings for c++, go, and
java greeter service implementations.  The c++ server had the overall
fastest and most consistent performance.  The go implementation was
also very consistent, but slightly slower than C++.  Java demonstrated
some initial relative slowness likely due to the JVM warming up but
soon converged on timings similar to the C++ implementation.  C# has
consistent performance but marginally slower.

## 2.5: Summary

Bazel assists in the construction of gRPC applications by providing a
capable build environment for services built in a multitude of
languages.  [rules_protobuf](https://github.com/pubref/rules_protobuf/) complements bazel by packaging up all the
dependencies needed and abstracting away the need to call protoc
directly.

In this workflow one does not need to check in the generated source code
(it is always generated on-demand within your workspace).  For
projects that *do* require this, one can use the `output_to_workspace` option to place the generated
files alongside the protobuf definitions.

Finally, rules_protobuf has full support for the
[grpc-gateway](https://github.com/grpc-ecosystem/grpc-gateway) project
via the
[grpc_gateway_proto_library](https://github.com/pubref/rules_protobuf/tree/master/grpc_gateway#grpc_gateway_proto_library)
and
[grpc_gateway_binary](https://github.com/pubref/rules_protobuf/tree/master/grpc_gateway#grpc_gateway_binary) rules, so you can easily bridge your gRPC apps with HTTP/1.1 gateways.

Refer to the [complete list of supported languages and gRPC versions](https://github.com/pubref/rules_protobuf/#rules) for more information.

And... that's a wrap.  Happy procedure calling!

> Paul Johnston is the principal at [PubRef](https://pubref.org)
> ([@pub_ref](https://twitter.com/pub_ref)), a solutions provider for
> scientific communications workflows.  If you have an organizational
> need for assistance with Bazel, gRPC, or related technologies,
> please contact pcj@pubref.org.  Thanks!
