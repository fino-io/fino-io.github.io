---
title: 8.3. Django 与 Flask
description: 用完整框架或轻量框架实现相同契约，理解 async 支持。
pageClass: aip-article python-course
---

# 8.3. Django 与 Flask

先修建议：[框架路线、WSGI 与 ASGI](./frameworks)。

Django 提供较完整应用约定，Flask 提供较小核心与扩展生态。先用同一个 JSON 契约比较，再理解项目规模、部署与 async 支持，不以几行 hello world 决定全部架构。

## Flask 的最小应用与测试 {#concept-1}

在独立项目环境安装 Flask，保存 hello_flask.py：

```python
from flask import Flask, jsonify

app = Flask(__name__)

@app.get("/hello/<name>")
def hello(name):
    return jsonify(message=f"你好，{name}")

with app.test_client() as client:
    response = client.get("/hello/Python")
    assert response.status_code == 200
    assert response.json == {"message": "你好，Python"}
```

test_client 在进程内处理请求，不开公网监听。真实项目把应用工厂、配置和扩展装配组织清楚，用正式服务器部署而非开发服务。

## Django 的最小请求实验 {#concept-2}

在另一项目环境安装 Django，保存 hello_django.py：

```python
from django.conf import settings
settings.configure(
    SECRET_KEY="learning-only", ROOT_URLCONF=__name__,
    ALLOWED_HOSTS=["testserver"], MIDDLEWARE=[],
)
import django
django.setup()
from django.http import JsonResponse
from django.urls import path
from django.test import Client

def hello(request, name):
    return JsonResponse({"message": f"你好，{name}"})

urlpatterns = [path("hello/<str:name>", hello)]
response = Client().get("/hello/Python")
assert response.status_code == 200
assert response.json() == {"message": "你好，Python"}
```

这是单文件理解路由的实验，正式项目用 startproject/startapp 的布局、真实 secret、设置与迁移，不把教学设置当生产配置。

## 完整框架与轻量核心的分工 {#concept-3}

| 需求 | Django | Flask |
| --- | --- | --- |
| ORM、认证、管理后台 | 主要能力已有统一约定 | 通常选择扩展并装配。 |
| 路由与 JSON | URLconf 与视图 | 装饰器与视图。 |
| 项目组织 | 明确应用与配置结构 | 应用工厂与团队约定更重要。 |
| 测试 | Django 测试客户端与数据库隔离 | Flask 测试客户端与所选扩展。 |

## async 支持有条件 {#concept-4}

Django 在 ASGI 下可使用异步路径，ORM 与中间件按对应版本能力和限制处理。Flask 的 async 视图需要相应安装支持，仍在 WSGI 请求/worker 模型内；不要在返回后随意遗留后台任务。看实际依赖与部署协议，而非只看 async 关键字。

## 动手练习与验收 {#lab}

1. 为相同 hello 契约测试未知路径、输入编码和响应 Content-Type。
2. 设计任务存储与认证需求，比较框架自带能力与扩展责任。
3. 对同步数据库调用画出执行路径，确认如何适配而不阻塞事件循环。

依据：[Django 教程](https://docs.djangoproject.com/en/stable/intro/)、[Flask](https://flask.palletsprojects.com/en/stable/)、[Flask async](https://flask.palletsprojects.com/en/stable/async-await/)。
