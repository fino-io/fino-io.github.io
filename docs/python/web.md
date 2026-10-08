---
title: 14 · Web 开发与 FastAPI
description: Python 中文学习指南：Web 开发与 FastAPI，包含概念、代码示例、练习与验收。
pageClass: aip-article
---

# 14 · Web 开发与 FastAPI

本章目标：理解请求、校验、业务与存储的职责，用成熟框架建立小型 API。

## 框架选择

FastAPI 适合基于类型标注的 API；Django 提供 ORM、管理后台、认证等完整应用能力；Flask 适合小型 Web 应用。先选一个完成项目，不必同时学习三个。HTML、HTTP、SQL 和测试比框架名称更值得优先掌握。

```sh
python -m pip install "fastapi[standard]"
```

保存为 `app.py`，运行 `fastapi dev app.py`，打开 `http://127.0.0.1:8000/docs`：

```python
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="学习任务 API")

class TaskInput(BaseModel):
    title: str = Field(min_length=1, max_length=200)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.post("/preview", status_code=201)
def preview(task: TaskInput) -> dict[str, str]:
    return {"title": task.title}
```

这里只展示请求模型与响应，不保存任务。长度约束不能拒绝全空白标题，实际项目要 strip 后验证。自动 OpenAPI 文档是接口契约入口，仍需写业务规则、失败场景和示例。

## 请求生命周期

路由解析路径和参数，模型验证输入，业务函数执行规则，存储层负责持久化，响应模型决定返回字段。小服务可以用两三个模块表达，不必引入通用框架抽象。同步数据库操作可放同步路由；异步路由中不能直接调用阻塞 I/O。

使用 201 表示创建，404 表示不存在，422 表示请求验证失败，409 表示明确的冲突。分页要有默认值和上限，响应按稳定顺序返回。认证识别用户，授权检查该用户能否操作特定资源；不要只验证 token 就开放全部对象。

## 测试与部署边界

TestClient 能在进程内请求应用；测试使用临时数据库，不连正式数据。至少覆盖创建、查询、非法输入、缺失记录和数据库故障。开发服务器和 reload 用于本地，部署时选择生产启动方式并配置日志、健康检查和优雅退出。

凭据从环境配置读取，CORS 配置实际允许来源，错误响应不暴露内部 traceback。密码散列、认证和会话管理复用成熟方案，不自行设计加密算法。

## 练习与验收

完成 [项目二：任务管理 API](./project-api)，把输入验证、SQLite 事务和接口测试连成闭环。验收：重启后数据保留，错误状态码一致，测试不会污染真实数据。参考：[FastAPI 教程](https://fastapi.tiangolo.com/tutorial/)、[FastAPI 测试](https://fastapi.tiangolo.com/tutorial/testing/)。
