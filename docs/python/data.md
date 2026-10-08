---
title: 15 · 数据分析、自动化与性能
description: Python 中文学习指南：数据分析、自动化与性能，包含概念、代码示例、练习与验收。
pageClass: aip-article
---

# 15 · 数据分析、自动化与性能

本章目标：形成可复现的数据处理流程，根据规模选择标准库或成熟的数据分析生态。

## 一条清晰的数据流水线

先定义输入字段、单位和业务规则，再读取 → 校验 → 清洗 → 聚合 → 导出。小型 CSV 可用标准库；列式统计和分析优先 pandas，数值数组用 NumPy，绘图用 Matplotlib。不要手写 DataFrame 或矩阵计算框架。

```sh
python -m pip install pandas matplotlib
```

```python
import pandas as pd

orders = pd.DataFrame({
    "category": ["图书", "课程", "图书"],
    "amount_cents": [3990, 10000, 2010],
})
summary = orders.groupby("category", as_index=False)["amount_cents"].sum()
assert int(summary["amount_cents"].sum()) == 16000
print(summary.sort_values("category"))
```

金额用整数分，输入缺失值应区分“未知”和“零”。读取 CSV 时明确 dtype、编码和日期格式，不能只依赖自动推断。筛选后修改数据用明确的 `.loc` 或独立副本，避免依赖版本差异造成隐式修改。

## 分析的可信度

聚合前检查主键重复、缺失率、非法值、日期范围和单位。JOIN 后确认行数，防止多对多连接放大金额。平均值同时报告样本数，日期统计说明时区和月份口径。训练模型时分开训练集和评估集，不让未来信息泄漏进特征。

Notebook 适合探索，交付时把稳定规则移到函数或脚本；重启内核后从头运行，避免隐藏执行顺序。输出记录输入来源和生成时间，不手工修改中间结果冒充可复现流程。

## 自动化与性能

自动化脚本应支持预览、重复执行和失败报告。批量改文件前生成操作清单；调用外部命令用 subprocess 参数列表。定时任务额外考虑重叠运行、超时和重复输出，先做好命令行入口再接调度。

测量性能用 `time.perf_counter`、`timeit`、`cProfile`；先优化算法、I/O 次数和批量操作，再考虑并发。数据太大时分块读取或使用 DuckDB 查询文件，不必一次加载内存。数据科学路径在此后补概率统计、线性代数和实验方法。

## 练习与验收

完成 [项目三：月度消费分析](./project-data)，验证重复记录、金额精度、按月统计和输出复现。验收：同一输入重复执行产生相同业务结果，统计总数可以与原始记录核对。参考：[pandas 入门](https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html)、[性能分析](https://docs.python.org/3/library/profile.html)。
