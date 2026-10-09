---
title: 1.1. 环境与工具链
description: 安装 stable 工具链，认识 Cargo、rustup、edition 与日常开发命令。
pageClass: aip-article rust-article
---

# 1.1. 环境与工具链

本章目标：能创建、运行和检查一个 Rust 项目，知道工具链、包管理器与 edition 分别负责什么。先把本地开发循环跑通，后续章节都在小项目里试验。

## 安装与确认

从 [Rust 官方安装页](https://rust-lang.org/tools/install/) 安装 rustup。macOS、Linux 与 WSL 使用官方安装命令；Windows 原生环境使用 rustup-init，并按提示安装 MSVC C++ 构建工具。系统还需要目标平台的链接器：macOS 可安装 Xcode Command Line Tools，Linux 通常需要发行版提供的 C/C++ 构建工具包。

安装后重启终端，确认以下命令都能执行：

```sh
rustup show
rustc --version
cargo --version
rustup update stable
rustup component add rustfmt clippy
```

如果提示找不到命令，先检查 `~/.cargo/bin` 是否在 PATH 中。使用 IDE 时推荐 [rust-analyzer](https://rust-analyzer.github.io/)；它负责补全、类型提示与诊断，终端中的 Cargo 检查则用于确认项目是否能构建。

## 工具与 edition 各自负责什么

| 名称 | 职责 |
| --- | --- |
| rustup | 管理 stable、beta、nightly 工具链、编译目标和附加组件。 |
| rustc | Rust 编译器，将源代码编译为目标文件或程序。 |
| Cargo | 创建项目、解析依赖、构建、测试、生成文档和发布 package。 |
| edition | 在 Cargo.toml 中选择语言兼容性规则，与编译器版本是不同维度。 |

本指南使用 Rust 2024 edition，它从 Rust 1.85 起获得支持。优先使用当前 stable；遇到依赖要求更高的最低 Rust 版本时再更新。一个 workspace 中不同 crate 可以使用不同 edition。具体迁移规则见 [Edition Guide](https://doc.rust-lang.org/edition-guide/rust-2024/index.html)。

## 创建第一个项目

```sh
cargo new rust-notes
cd rust-notes
cargo run
```

`src/main.rs` 是可执行程序的入口。将其替换为：

```rust
fn main() {
    let subject = "Rust";
    println!("开始学习 {subject}");
}
```

`Cargo.toml` 描述项目与依赖，`Cargo.lock` 记录解析出的依赖版本，`target/` 存放构建产物。新建项目时检查清单中的 `edition = "2024"`。需要库项目时使用 `cargo new my-lib --lib`。

## 日常开发循环

```sh
cargo check
cargo fmt
cargo clippy --all-targets -- -D warnings
cargo test
cargo run
cargo build --release
cargo doc --open
```

`check` 主要做编译检查，通常比生成完整可执行文件更快。`fmt` 统一排版；Clippy 提供常见质量建议；`test` 运行测试；`--release` 使用优化配置。基准对比应使用同一构建配置，避免把调试构建性能当成最终性能。

阅读编译错误时，从第一个错误开始：找到文件与行号，读预期类型和实际类型，再考虑建议是否符合数据的所有权设计。可用 `rustc --explain E0382` 阅读指定错误代码的解释。

## 配合 Rustlings 练习

依照 [Rustlings 官方说明](https://rustlings.rust-lang.org/) 初始化练习：

```sh
cargo install rustlings
rustlings init
cd rustlings
rustlings
```

建议在阅读每章后完成对应主题的小题，先解释错误再修复。项目对 Rust 版本的要求可能随发布变化，安装失败时查看官方 Setup 页面中的要求。

## 练习与验收

1. 从零创建项目，输出姓名与今天的学习目标。
2. 故意漏写一个分号，读懂诊断后恢复。
3. 运行格式化、Clippy 和测试，解释它们各自检查什么。
4. 用 `rustup doc --book` 打开离线教材，用 `cargo doc --open` 打开项目文档。

能从干净目录创建并运行项目，就可以进入下一章。参考：[Cargo 入门](https://doc.rust-lang.org/cargo/getting-started/first-steps.html)、[rustup Book](https://rust-lang.github.io/rustup/)。
