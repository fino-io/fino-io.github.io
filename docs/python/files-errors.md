---
title: 1.5. 文件、异常与常用标准库
description: Python 中文学习指南：文件、异常与常用标准库，包含概念、代码示例、练习与验收。
pageClass: aip-article
---

# 1.5. 文件、异常与常用标准库

本章目标：可靠读取文本和结构化数据，区分错误类型，并在异常发生时正确释放资源。

## 路径与上下文管理

```python
from pathlib import Path
import json

path = Path("settings.json")
path.write_text(json.dumps({"language": "中文"}, ensure_ascii=False), encoding="utf-8")
with path.open(encoding="utf-8") as source:
    settings = json.load(source)
print(settings["language"])
```

`Path` 负责路径组合与文件操作，使用 `Path("data") / "orders.csv"`，不手工拼斜杠。相对路径基于当前工作目录，未必是脚本所在目录。`with` 负责关闭文件，异常时也会执行退出逻辑。大文件逐行处理，避免无条件 `read_text()` 全量加载。

JSON 适合交换基本结构，CSV 适合表格。CSV 用 `csv` 模块解析，不能简单按逗号 split，因为字段可能包含逗号、引号或换行。打开 CSV 通常指定 `newline=""` 和编码。不要对不可信输入执行 `pickle.load`、`eval` 或 `exec`。

## 只捕获能够处理的异常

```python
from pathlib import Path

def read_count(path: Path) -> int:
    try:
        text = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return 0
    try:
        count = int(text.strip())
    except ValueError as error:
        raise ValueError(f"计数文件格式错误：{path}") from error
    if count < 0:
        raise ValueError("计数不能为负数")
    return count
```

文件不存在可按业务返回默认值，权限错误和内容损坏应暴露。异常链保留原因，便于定位。`finally` 适合无论成功失败都执行的清理；`else` 表示 try 成功后的逻辑。不要用 `except: pass` 吞掉错误。

## 日常标准库地图

| 需求 | 优先使用 |
| --- | --- |
| 日期与时区 | `datetime`、`zoneinfo`，对跨时区时间使用带时区对象。 |
| 金额 | `decimal.Decimal` 或整数分，定义舍入规则。 |
| 命令行 | `argparse`，自动生成帮助和参数错误。 |
| 复制、压缩、临时文件 | `shutil`、`zipfile`、`tempfile`。 |
| 日志、进程 | `logging`、`subprocess.run`，传参数列表，避免拼 shell 字符串。 |
| 随机 | 模拟用 `random`，令牌用 `secrets`。 |

写入重要文件时可先写同目录临时文件，再替换目标文件；同时考虑崩溃、权限和并发，简单脚本不必提前设计复杂存储层。

## 练习与验收

1. 读 CSV 并导出 JSON，测试中文、带逗号字段和空文件。
2. 对不存在、损坏、无权限的文件分别说明预期行为。
3. 写日志时记录文件名和行号，不记录密码或完整凭据。

验收：文件及时关闭，失败信息能定位输入，异常处理不掩盖真实错误。参考：[输入输出教程](https://docs.python.org/zh-cn/3/tutorial/inputoutput.html)、[异常教程](https://docs.python.org/zh-cn/3/tutorial/errors.html)。
