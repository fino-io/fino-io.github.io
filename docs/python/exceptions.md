---
title: 1.7. 异常、异常链与清理
description: 区分失败类型，保留原因，让错误在合适边界处理。
pageClass: aip-article python-course
---

# 1.7. 异常、异常链与清理

先修建议：[函数、内置函数与作用域](./functions)。

异常表达操作不能按正常契约完成。处理异常要说明你能够恢复什么，不能用宽泛捕获把程序错误、输入问题和依赖故障全部藏起来。

## try、except、else 与 finally {#concept-1}

```python
def parse_positive(raw):
    try:
        value = int(raw)
    except ValueError as error:
        raise ValueError("请输入整数") from error
    else:
        if value <= 0:
            raise ValueError("必须为正数")
        return value

assert parse_positive("3") == 3
try:
    parse_positive("bad")
except ValueError as error:
    assert str(error) == "请输入整数"
    assert isinstance(error.__cause__, ValueError)
else:
    raise AssertionError("坏输入应失败")
```

else 只在 try 没有异常时执行；finally 在正常和异常离开时都清理资源。把过多逻辑放进 try 会使捕获范围含糊，可能误把内部 bug 当解析失败。

## 保留异常链 {#concept-2}

```mermaid
flowchart LR
  I["外部文本无法解析"] --> E["原始 ValueError"] --> C["带操作上下文的新异常"]
  C --> U["调用方提示用户或记录一次"]
```

`raise ... from error` 保留明确原因。需要字段等结构化信息时定义小型自定义异常，不靠字符串包含某个词控制程序。入口决定日志与退出码，底层不层层重复打印同一次错误。

## 常见失败类别 {#concept-3}

| 异常 | 常见原因 | 合理动作 |
| --- | --- | --- |
| ValueError / TypeError | 值不合法 / 类型使用不合适 | 校验边界、修正调用契约。 |
| KeyError / IndexError | 缺键或越界 | 判断存在性与范围。 |
| OSError | 文件与系统操作失败 | 带路径/操作上下文返回，必要时提示。 |
| ModuleNotFoundError | 环境或导入路径不匹配 | 确认解释器和包安装，不盲目管理员重装。 |

不要用 `except Exception: pass` 忽略所有失败。退出、取消和系统级信号有独立语义；异步取消一般在清理后继续传播，不能当普通成功结果吞掉。

## 动手练习与验收 {#lab}

1. 测试 parse_positive 的空、坏文本、零、负数与正常值。
2. 给文件读取失败增加操作上下文，保留原异常作为 cause。
3. 写一个清理记录实验，确认异常离开时 finally 仍执行。

依据：[异常教程](https://docs.python.org/zh-cn/3/tutorial/errors.html)、[异常类型](https://docs.python.org/3/library/exceptions.html)。
