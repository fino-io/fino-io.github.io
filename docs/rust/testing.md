---
title: 12 · 测试、文档与质量检查
description: 用单元测试、集成测试和文档测试验证行为，建立轻量且有效的检查流程。
pageClass: aip-article rust-article
---

# 12 · 测试、文档与质量检查

本章目标：让核心行为可重复验证，公开 API 有可运行示例，质量检查保持简单。

## 单元测试围绕行为

将下面代码放入 **src/lib.rs**，运行 `cargo test`：

```rust
pub fn count_words(text: &str) -> usize {
    text.split_whitespace().count()
}

#[cfg(test)]
mod tests {
    use super::count_words;

    #[test]
    fn counts_words_separated_by_whitespace() {
        assert_eq!(count_words("rust  cargo\nclippy"), 3);
    }

    #[test]
    fn empty_input_has_no_words() {
        assert_eq!(count_words("  \n"), 0);
    }
}
```

测试名称说明条件与结果。优先覆盖成功路径、边界输入和失败路径；避免断言实现细节或写出与实现相同的算法。返回 Result 的函数可通过 `is_err`、模式匹配和错误分类验证失败。

## 集成测试与文档测试

`tests/` 中的测试通常作为独立 crate 编译，从使用者角度访问库的公开接口。它适合验证模块协作与 API 可用性。需要文件时使用临时目录与固定内容，避免依赖个人机器路径或不稳定的公网服务。

文档注释使用 `///`，模块级文档使用 `//!`。公开函数的文档应说明用途、输入边界、错误和必要的示例。以下是**文档注释片段**；示例中的 crate 名应改成实际项目的名称：

````rust
/// 统计以空白分隔的词语。
///
/// # Examples
/// ```
/// assert_eq!(my_library::count_words("rust cargo"), 2);
/// ```
pub fn count_words(text: &str) -> usize {
    text.split_whitespace().count()
}
````

Cargo 默认会运行库中的文档测试，有助于防止公开示例随接口演进失效。`ignore` 只应用于确实无法运行的示例；需要隐藏准备代码时可使用 rustdoc 的隐藏行机制。

## 常用检查命令

```sh
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test --locked
cargo doc --no-deps
```

对具有多种 feature 组合的库，根据实际支持范围增加组合检查；只有项目明确支持所有 features 同时开启时，才使用 `--all-features` 作为通用检查。测试发布行为时也可使用 `cargo test --release`。

测试默认可能并行运行，避免共享可变全局状态和固定端口。需要诊断输出时用 `cargo test -- --nocapture`。异步代码可使用 `#[tokio::test]`，并用可控时钟或本地服务测试超时，而不是依赖长时间真实等待。

## 从纯函数到外部依赖

业务计算尽量保持输入明确、输出明确。文件、时间、网络和数据库等边界在少数位置处理，让大部分逻辑可以快速测试。有多个实际实现或测试替身需求时，再引入适当的 Trait；不要仅为测试把每个函数抽象成接口。

更深的质量验证可按风险选择：[proptest](https://docs.rs/proptest/latest/proptest/) 生成大量输入检查性质，模糊测试用于解析器与边界代码，基准测试用于性能假设。它们应回答明确问题，不能代替基本行为测试。

## 练习与验收

为文本搜索补上空查询、无匹配、中文输入、重复匹配和缺失文件用例。给公开函数增加可运行文档示例。确保业务单元测试不访问网络，测试重复执行时结果一致。

参考：[Rust Book：测试](https://doc.rust-lang.org/book/ch11-00-testing.html)、[rustdoc 文档测试](https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html)、[Clippy](https://doc.rust-lang.org/clippy/)。
