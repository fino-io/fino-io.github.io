---
title: roadmap.sh Python 大纲与正文对照
description: Python 原路线主题、课程、正文位置与工具维护说明。
pageClass: aip-article python-course
---

# roadmap.sh Python 大纲与正文对照

以 [Python 路线](https://roadmap.sh/python)及[官方 PDF](https://roadmap.sh/pdfs/roadmaps/python.pdf)核对，截至 2026-10-09。保留原图主题名称，并链接到具体讲解小节；分类和复合节点可能横跨多节课，不把表格行数当课程数量。

框架分支按原图完整保留，同时按维护者资料解释 WSGI、ASGI、greenlet 与 asyncio 的实际区别。nose 与 Pyre 等历史/维护状态节点仍有说明，不把存在于路线图等同于推荐新项目无条件安装。

## 1. 语言基础

原图分类：**Learn the Basics**。先写出顺序程序，解释名字、对象、分支、容器与异常。

| 原路线主题 | 课程与正文 |
| --- | --- |
| Learn the Basics | [1.2. 语法、缩进、输入与输出 · 表达式、语句和缩进](./basics#concept-1) |
| Basic Syntax | [1.2. 语法、缩进、输入与输出 · 表达式、语句和缩进](./basics#concept-1) |
| Variables and Data Types | [1.3. 变量、数据类型与类型转换 · 数值、布尔与 None](./variables#concept-2) |
| Type Casting | [1.3. 变量、数据类型与类型转换 · 文本与类型转换](./variables#concept-3) |
| Conditionals | [1.4. 条件、循环与终止条件 · 条件与短路](./control-flow#concept-1) |
| Loops | [1.4. 条件、循环与终止条件 · for、range、while](./control-flow#concept-2) |
| Lists | [1.5. 列表、元组、集合与字典 · 四种内置容器](./collections#concept-1) |
| Tuples | [1.5. 列表、元组、集合与字典 · 四种内置容器](./collections#concept-1) |
| Sets | [1.5. 列表、元组、集合与字典 · 四种内置容器](./collections#concept-1) |
| Dictionaries | [1.5. 列表、元组、集合与字典 · 查找与聚合](./collections#concept-3) |
| Functions, Builtin Functions | [1.6. 函数、内置函数与作用域 · 参数与返回值](./functions#concept-1) |
| Exceptions | [1.7. 异常、异常链与清理 · try、except、else 与 finally](./exceptions#concept-1) |

## 2. 数据结构与算法

原图分类：**Data Structures & Algorithms**。从访问方式、不变量与复杂度理解结构，实际工作复用标准库。

| 原路线主题 | 课程与正文 |
| --- | --- |
| Data Structures & Algorithms | [2.1. 数组与链表的访问模型 · 动态序列与同类型数组](./arrays-linked#concept-1) |
| Arrays and Linked Lists | [2.1. 数组与链表的访问模型 · 动态序列与同类型数组](./arrays-linked#concept-1) |
| Hash Tables | [2.2. 哈希表、键与复杂度 · 值、存在性与键](./hash-tables#concept-1) |
| Heaps, Stacks and Queues | [2.3. 栈、队列与 deque · LIFO 与 FIFO](./stacks-queues#concept-1)；[堆与优先级队列](./heaps) |
| Binary Search Tree | [2.5. 二叉搜索树与查找 · 搜索树不变量与路径](./trees#concept-1) |
| Recursion | [2.6. 递归、调用栈与终止 · 基本情况与缩小输入](./recursion#concept-1) |
| Sorting Algorithms | [2.7. 排序算法、稳定性与二分 · 算法思路与成本](./sorting#concept-2) |

## 3. 模块

原图分类：**Modules**。把内置模块、自定义模块与导入路径连成可运行项目。

| 原路线主题 | 课程与正文 |
| --- | --- |
| Modules | [3.1. 内置模块、自定义模块与导入 · 标准库模块](./modules#concept-1) |
| Builtin | [3.1. 内置模块、自定义模块与导入 · 标准库模块](./modules#concept-1) |
| Custom | [3.1. 内置模块、自定义模块与导入 · 自定义模块的双文件实验](./modules#concept-2) |

## 4. 函数与迭代进阶

学习原图的 Lambda、装饰器、迭代器和正则主题。

| 原路线主题 | 课程与正文 |
| --- | --- |
| Lambdas | [4.1. Lambda、函数值与闭包 · 排序规则作为函数](./lambdas#concept-1) |
| Decorators | [4.2. 装饰器、wraps 与函数包装 · 包装一段行为](./decorators#concept-1) |
| Iterators | [4.3. 迭代协议、惰性与耗尽 · iter、next 与耗尽](./iterators#concept-1) |
| Regular Expressions | [4.4. 正则表达式与文本边界 · 全串与局部匹配](./regex#concept-1) |

## 5. 面向对象

原图分类：**Object Oriented Programming**。定义状态与行为，理解继承契约和 Python 的特殊方法协议。

| 原路线主题 | 课程与正文 |
| --- | --- |
| Object Oriented Programming | [5.1. 类、实例、方法与数据建模 · 实例与方法](./objects#concept-1) |
| Classes | [5.1. 类、实例、方法与数据建模 · 实例与方法](./objects#concept-1) |
| Inheritance | [5.2. 继承、super 与替代关系 · super 与单继承](./inheritance#concept-1) |
| Methods, Dunder | [5.3. 方法类型、属性与 Dunder 协议 · 一个可迭代的小容器](./dunder#concept-1) |

## 6. 包管理与项目配置

原图分类：**Package Managers**。区分包索引、安装工具、依赖管理、配置和常用生态包。

| 原路线主题 | 课程与正文 |
| --- | --- |
| Package Managers | [6.1. PyPI、pip、Conda、uv 与 Poetry · PyPI 与 pip](./package-managers#concept-1) |
| PyPI | [6.1. PyPI、pip、Conda、uv 与 Poetry · PyPI 与 pip](./package-managers#concept-1) |
| Pip | [6.1. PyPI、pip、Conda、uv 与 Poetry · PyPI 与 pip](./package-managers#concept-1) |
| Conda | [6.1. PyPI、pip、Conda、uv 与 Poetry · Conda 与 Poetry 的对应流程](./package-managers#concept-4) |
| uv | [6.1. PyPI、pip、Conda、uv 与 Poetry · uv 项目实验](./package-managers#concept-3) |
| Poetry | [6.1. PyPI、pip、Conda、uv 与 Poetry · Conda 与 Poetry 的对应流程](./package-managers#concept-4) |
| Configuration | [6.2. pyproject.toml 与配置职责 · 最小可安装包](./configuration#concept-1) |
| pyproject.toml | [6.2. pyproject.toml 与配置职责 · 最小可安装包](./configuration#concept-1) |
| Common Packages | [6.3. 常用包与技术选型 · 从问题选工具](./common-packages#concept-1) |

## 7. 表达式、范式与资源

把推导式、生成器、编程范式与上下文管理器放回具体任务。

| 原路线主题 | 课程与正文 |
| --- | --- |
| List Comprehensions | [7.1. 列表推导式与集合转换 · 映射与过滤](./comprehensions#concept-1) |
| Generator Expressions | [7.2. 生成器表达式、yield 与流式计算 · 表达式与 yield](./generators#concept-1) |
| Paradigms | [7.3. 过程式、面向对象与函数式 · 同一任务的不同组织](./paradigms#concept-1) |
| Context Manager | [7.4. 上下文管理器与资源协议 · 正常与异常退出](./context-managers#concept-1) |

## 8. 框架

原图分类：**Learn a Framework**。按原图覆盖全部框架，选择适合应用和执行模型的一种主要方案。

| 原路线主题 | 课程与正文 |
| --- | --- |
| Learn a Framework | [8.1. 框架路线、WSGI 与 ASGI · WSGI、ASGI 与协作模型](./frameworks#concept-1) |
| Synchronous | [8.1. 框架路线、WSGI 与 ASGI · WSGI、ASGI 与协作模型](./frameworks#concept-1) |
| Asynchronous | [8.1. 框架路线、WSGI 与 ASGI · WSGI、ASGI 与协作模型](./frameworks#concept-1) |
| Synchronous + Asynchronous | [8.1. 框架路线、WSGI 与 ASGI · WSGI、ASGI 与协作模型](./frameworks#concept-1) |
| Fast API | [8.2. FastAPI 与接口开发 · 可运行接口与请求模型](./web#concept-1) |
| Django | [8.3. Django 与 Flask · Django 的最小请求实验](./django-flask#concept-2) |
| Flask | [8.3. Django 与 Flask · Flask 的最小应用与测试](./django-flask#concept-1) |
| Pyramid | [8.4. Pyramid 与 Plotly Dash · Pyramid：显式路由与视图](./sync-frameworks#concept-1) |
| Plotly Dash | [8.4. Pyramid 与 Plotly Dash · Dash：布局与回调](./sync-frameworks#concept-2) |
| gevent | [8.5. gevent、aiohttp、Tornado 与 Sanic · gevent：greenlet 协作模型](./async-frameworks#concept-1) |
| aiohttp | [8.5. gevent、aiohttp、Tornado 与 Sanic · aiohttp：HTTP 客户端和服务端](./async-frameworks#concept-2) |
| Tornado | [8.5. gevent、aiohttp、Tornado 与 Sanic · Tornado 与 Sanic 的路由入口](./async-frameworks#concept-3) |
| Sanic | [8.5. gevent、aiohttp、Tornado 与 Sanic · Tornado 与 Sanic 的路由入口](./async-frameworks#concept-3) |

## 9. 并发

原图分类：**Concurrency**。按负载选择线程、进程或异步，管理共享状态、预算和取消。

| 原路线主题 | 课程与正文 |
| --- | --- |
| Concurrency | [9.1. 并发模型、GIL 与选择依据 · 按负载选模型](./concurrency#concept-1) |
| GIL | [9.1. 并发模型、GIL 与选择依据 · GIL 的范围](./concurrency#concept-2) |
| Threading | [9.2. 线程、锁与有界执行器 · 完整临界区](./threading#concept-2) |
| Multiprocessing | [9.3. 进程、序列化与主入口 · 主入口与可传递函数](./multiprocessing#concept-1) |
| Asynchrony | [9.4. 异步、TaskGroup、超时与取消 · 超时和清理](./asyncio#concept-2) |

## 10. 环境管理

原图分类：**Environments**。分清解释器版本与项目环境，能重建依赖而不复制环境目录。

| 原路线主题 | 课程与正文 |
| --- | --- |
| Environments | [10.1. Pipenv、virtualenv 与 pyenv · 三个层次](./environments#concept-1) |
| Pipenv | [10.1. Pipenv、virtualenv 与 pyenv · virtualenv 与 Pipenv](./environments#concept-2) |
| virtualenv | [10.1. Pipenv、virtualenv 与 pyenv · virtualenv 与 Pipenv](./environments#concept-2) |
| pyenv | [10.1. Pipenv、virtualenv 与 pyenv · pyenv 与编辑器](./environments#concept-3) |

## 11. 类型与校验

原图分类：**Static Typing**。区分静态类型检查与外部数据的运行时校验。

| 原路线主题 | 课程与正文 |
| --- | --- |
| Static Typing | [11.1. typing、mypy、Pyright 与 Pyre · 具体类型、Union 与容器](./typing#concept-1) |
| typing | [11.1. typing、mypy、Pyright 与 Pyre · 具体类型、Union 与容器](./typing#concept-1) |
| mypy | [11.1. typing、mypy、Pyright 与 Pyre · 具体类型、Union 与容器](./typing#concept-1) |
| pyright | [11.1. typing、mypy、Pyright 与 Pyre · 具体类型、Union 与容器](./typing#concept-1) |
| pyre | [11.1. typing、mypy、Pyright 与 Pyre · 具体类型、Union 与容器](./typing#concept-1) |
| Pydantic | [11.2. Pydantic 与运行时数据校验 · Pydantic 模型与严格性](./validation#concept-1) |

## 12. 代码格式

原图分类：**Code Formatting**。使用 Ruff、Black 或 YAPF 的明确工作流，避免互相改写。

| 原路线主题 | 课程与正文 |
| --- | --- |
| Code Formatting | [12.1. Ruff、Black、YAPF 与质量流程 · 一条清楚的质量流程](./formatting#concept-1) |
| ruff | [12.1. Ruff、Black、YAPF 与质量流程 · Ruff 与 Black 示例](./formatting#concept-2) |
| black | [12.1. Ruff、Black、YAPF 与质量流程 · Ruff 与 Black 示例](./formatting#concept-2) |
| yapf | [12.1. Ruff、Black、YAPF 与质量流程 · 一条清楚的质量流程](./formatting#concept-1) |

## 13. 文档

原图分类：**Documentation**。用 docstring、Sphinx 与可执行示例表达公开接口。

| 原路线主题 | 课程与正文 |
| --- | --- |
| Documentation | [13.1. Docstring、Sphinx 与 API 文档 · 最小 Sphinx 工程](./documentation#concept-2) |
| Sphinx | [13.1. Docstring、Sphinx 与 API 文档 · 最小 Sphinx 工程](./documentation#concept-2) |

## 14. 测试

原图分类：**Testing**。用行为断言、隔离和环境矩阵验证结果，说明旧工具的现状。

| 原路线主题 | 课程与正文 |
| --- | --- |
| Testing | [14.1. pytest、隔离、参数化与替身 · 双文件 pytest 实验](./testing#concept-1) |
| pytest | [14.1. pytest、隔离、参数化与替身 · 双文件 pytest 实验](./testing#concept-1) |
| unittest / pyUnit | [14.2. unittest、doctest 与 nose 的位置 · unittest 完整单文件](./unittest-doctest#concept-1) |
| doctest | [14.2. unittest、doctest 与 nose 的位置 · doctest 可运行说明](./unittest-doctest#concept-2) |
| nose | [14.2. unittest、doctest 与 nose 的位置 · nose 的维护状态与迁移](./unittest-doctest#concept-3) |
| tox | [14.3. tox 与多环境测试 · 最小配置](./tox#concept-1) |

## 16. 综合项目与延伸

用三个项目交付程序、服务与分析结果，并进入相关路线。

| 原路线主题 | 课程与正文 |
| --- | --- |
| Related Roadmaps | [16.5. 官方资料与后续路线 · 官方资料按问题使用](./resources#concept-1) |
| Backend Roadmap | [16.5. 官方资料与后续路线 · 官方资料按问题使用](./resources#concept-1) |
| DevOps Roadmap | [16.5. 官方资料与后续路线 · 官方资料按问题使用](./resources#concept-1) |
| AI & Data Scientist | [16.5. 官方资料与后续路线 · 官方资料按问题使用](./resources#concept-1) |

## 扩展与来源

安装入口、文件 I/O、HTTP/SQL/数据应用和综合项目用于连贯学习，其中没有原图独立节点的内容标为扩展。算法的最小模型用于解释结构，实际程序优先复用标准容器与成熟方案。

本次 PDF SHA-256：`bf6a1e94791b7295f5a94cdf1df1a581b369b189e9de7fe59860fd471b3cbf78`。这是核对文件的校验，不是官方版本号。链接使用官方小写 /python 路径。

[课程数据](/python/curriculum.json)记录原主题、正文锚点、先修与样本；构建检查重复主题、先修顺序和锚点存在性。
