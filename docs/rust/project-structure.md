---
title: 09 · 模块、Cargo 与依赖
description: 理解 package、crate 和 module，以清晰边界组织项目、管理依赖和工作区。
pageClass: aip-article rust-article
---

# 09 · 模块、Cargo 与依赖

本章目标：保持入口薄、业务边界清楚，在真实需求出现时拆分模块和 crate，复用成熟生态。

## Package、crate 与 module

Package 由 Cargo.toml 定义，可以包含一个库 crate 和多个可执行 crate。crate 是编译单元，通常以 `src/lib.rs` 或 `src/main.rs` 为根。module 是 crate 内的代码组织与可见性边界。

一个小 CLI 可以这样组织：

```text
note-search/
├── Cargo.toml
├── Cargo.lock
├── src/
│   ├── lib.rs       # 对外算法与业务能力
│   ├── main.rs      # 参数、I/O 与退出状态
│   └── search.rs    # 搜索实现
└── tests/
    └── search.rs    # 通过公开接口验证行为
```

先从 lib.rs 和 main.rs 开始；搜索逻辑明显独立后再拆文件。无需在十几行程序中提前铺设 controller、service、repository 等多层结构。

## 模块声明与可见性

`mod search;` 声明模块，编译器会寻找相应的文件。`use` 将路径引入当前作用域。`crate::` 从 crate 根定位；`super::` 从父模块定位。模块与条目默认具有受限的可见性，`pub` 用于对外 API，`pub(crate)` 用于 crate 内部复用。

下面是 **src/lib.rs 的结构片段**：

```rust
mod search;
pub use search::find_lines;
```

search.rs 中的 `find_lines` 需要具有可导出的可见性。通过重导出，调用者可以使用稳定的公开路径，而无需知道内部文件怎么拆分。可执行入口使用库的公开 API，集成测试也走相同路径。

## 依赖、features 与锁文件

```sh
cargo add clap --features derive
cargo add serde --features derive
cargo add serde_json
cargo tree
cargo tree -e features
```

Cargo 默认按 SemVer 兼容范围解析依赖；Cargo.lock 记录本次选中的版本，用于重复构建。应用项目通常应把锁文件纳入版本管理；库项目应结合团队和发布流程管理，发布给使用者的依赖约束仍由 Cargo.toml 决定。

Features 是可组合的能力开关，通常应保持可加性；不同依赖路径的 feature 可能合并。不要把 features 当作任意互斥的产品配置。加入 crate 前检查官方文档、维护状况、许可、MSRV 和所需平台支持。

## 什么时候使用 workspace

多个确实独立的 package 需要一起开发时，再使用 workspace 共享依赖和配置。例如业务库与两个独立可执行程序。下面是 **workspace 根 Cargo.toml 片段**：

```toml
[workspace]
members = ["core", "cli"]
resolver = "3"

[workspace.package]
edition = "2024"

[workspace.dependencies]
serde = { version = "1", features = ["derive"] }
```

成员 package 仍需要自己的 Cargo.toml，通过 `edition.workspace = true` 和 `serde.workspace = true` 选择继承。虚拟 workspace 根没有 package edition 可推断 resolver，应显式配置；具体规则见 [Cargo Workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html)。

## 依赖更新与构建习惯

检查锁文件更新时运行 `cargo test`；在 CI 中使用 `--locked`，避免构建时静默调整锁文件。`cargo tree -d` 可检查重复依赖，`cargo build --release` 构建发布产物。发布库前可用 `cargo package --list` 检查包含哪些文件，确保示例、文档和必要资源完整。

## 练习与验收

把文本统计程序拆成库与 CLI 入口，业务函数不直接读取命令行或打印错误。写一个集成测试只使用公开 API。再添加一个成熟 crate，解释启用了哪些 features，以及为什么项目需要它。

参考：[模块系统](https://doc.rust-lang.org/book/ch07-00-managing-growing-projects-with-packages-crates-and-modules.html)、[Cargo Features](https://doc.rust-lang.org/cargo/reference/features.html)、[Cargo 依赖](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html)。
