---
title: gRPC 的 CMake 构建系统的改进
date: 2020-03-16
author:
  name: Zack Galbreath
  link: https://github.com/zackgalbreath
source_url: https://grpc.io/blog/cmake-improvements/
---

在过去的几个月里，[Kitware Inc.](https://www.kitware.com/) 一直在与 gRPC 团队合作改进 gRPC 的 CMake 支持。这项工作的目标是利用 CMake 提供的最新功能和技术来实现 gRPC 的 CMake 构建现代化。这改善了选择使用 gRPC 的 CMake 作为构建系统的 gRPC 开发人员的用户体验。在此过程中，我们将 CMake 构建视为一个整体，并探索并解决了 GitHub 中的 CMake 相关问题。进行了许多改进，这些改进将为开发人员和最终用户在使用 CMake 构建 gRPC 时提供更好的体验。

更令人兴奋的变化之一是能够将 gRPC 无缝添加到任何 CMake 项目，并使用简单的 CMake 文件构建其所有依赖库。在我们最近的更改之前，这是一个多步骤的过程。用户必须分别构建和安装 gRPC 的每个依赖项，然后构建并安装 gRPC，最后构建自己的项目。现在，这一切都可以一步完成。以下 CMake 代码克隆并构建了 gRPC 的最新稳定版本，如[此处](https://github.com/grpc/grpc/blob/master/src/cpp/README.md#cmake)所述：

```cmake
cmake_minimum_required(VERSION 3.15)
project(my_exe)

include(FetchContent)

FetchContent_Declare(
  gRPC
  GIT_REPOSITORY https://github.com/grpc/grpc
  GIT_TAG        v1.28.0
  )
set(FETCHCONTENT_QUIET OFF)
FetchContent_MakeAvailable(gRPC)

add_executable(my_exe my_exe.cc)
target_link_libraries(my_exe grpc++)
```

在配置时，CMake 使用 git 使用指定标签克隆 gRPC 存储库。然后 gRPC 将通过 [add_subdirectory](https://cmake.org/cmake/help/latest/command/add_subdirectory.html) 添加到当前 CMake 项目，并作为项目的一部分进行构建。

## 发生了什么变化？

我们已经在 GitHub 上解决了许多与 CMake 相关的问题，包括错误修复、文档更新和新功能。从 gRPC 1.28.0 版本开始，所有修复和功能均可用。

- 我们改进了[从源代码构建 gRPC](https://github.com/grpc/grpc/blob/master/BUILDING.md) 和[将 gRPC 添加为 CMake 项目的依赖项](https://github.com/grpc/grpc/blob/master/src/cpp/README.md#cmake) 的文档，为开发人员提供了从 CMake 使用 gRPC 的多种选项，从简单链接到预构建的 gRPC 到下载并构建 gRPC 作为项目的一部分。
- CMake 构建现在会在安装目录中生成 pkgconfig (*.pc) 文件，就像 Makefile 构建一样。这允许 pkgconfig 正确查找并报告 gRPC 的 CMake 构建版本。
- 如果您使用的是 CMake v3.13 或更高版本，您现在可以[一步构建并安装 gRPC 及其依赖项](https://github.com/grpc/grpc/blob/master/BUILDING.md#install-after-build)，而不是单独构建和安装每个组件。
- CMake 构建现在具有配置选项来启用或禁用每个协议插件的构建。例如，使用 `-DgRPC_BUILD_GRPC_PYTHON_PLUGIN=OFF` 运行 CMake 将禁用构建 Python 插件。在配置 gRPC 构建时，您可以在 cmake-gui（或 ccmake）中查看和编辑这些选项。
- 当将 gRPC 构建和安装为共享库时，CMake 现在会设置 .so 版本，以便库的版本正确。 （例如，libgrpc.so.9.0.0、libgrpc++.so.1.27.0-dev 等）。
- 我们添加了示例，展示如何[使用 CMake FetchContent 模块构建 gRPC](https://github.com/grpc/grpc/blob/master/test/distrib/cpp/run_distrib_test_cmake_fetchcontent.sh)，以及如何[为 Raspberry Pi 交叉编译 gRPC](https://github.com/grpc/grpc/blob/master/test/distrib/cpp/run_distrib_test_raspberry_pi.sh)。
- 即使 c-ares 是使用 Autotools 而不是 CMake 构建的，CMake 现在也可以找到 libc-ares。如果 gRPC 是使用 Autotools 构建的，则允许针对发行版提供的 c-ares 版本构建 gRPC。
- 如果在没有启用测试的情况下构建 gRPC，则会自动禁用依赖的测试框架，以避免不必要的编译。
- 并行构建的一些问题已得到解决。

作为奖励，有一个额外的更改在技术上不是这项工作的一部分，但也有助于更简单、更轻松的 cmake 构建：

- 为了构建 Boringssl 依赖项，现在使用更[轻量级的 cmake 构建](https://github.com/grpc/grpc/pull/21527)，这消除了一些奇怪的构建时依赖项（例如 `golang`）。
