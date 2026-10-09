---
title: 8.4. Pyramid 与 Plotly Dash
description: 分别理解路由配置与数据应用回调。
pageClass: aip-article python-course
---

# 8.4. Pyramid 与 Plotly Dash

先修建议：[框架路线、WSGI 与 ASGI](./frameworks)。

原路线的同步分支包含 Pyramid 与 Plotly Dash。前者关注 Web 路由和配置，后者关注数据应用布局与回调；它们不能因为同处一个框就被当作相同用途。

## Pyramid：显式路由与视图 {#concept-1}

安装 Pyramid 后，独立脚本定义应用：

```python
from pyramid.config import Configurator
from pyramid.response import Response

def hello(request):
    return Response(json_body={"message": "Python 课程"})

with Configurator() as config:
    config.add_route("hello", "/hello")
    config.add_view(hello, route_name="hello")
    app = config.make_wsgi_app()

assert hello(None).json_body == {"message": "Python 课程"}
```

app 是 WSGI 应用，不是已启动服务器。视图测试可以直接验证返回，端到端测试使用成熟 WSGI 测试工具；正式部署交给服务器，不手写 HTTP 解析。

## Dash：布局与回调 {#concept-2}

在独立环境安装 Dash，保存 dashboard.py：

```python
from dash import Dash, html, dcc, Input, Output, callback

app = Dash(__name__)
app.layout = html.Div([
    dcc.Slider(id="quantity", min=1, max=10, step=1, value=2),
    html.Div(id="summary"),
])

@callback(Output("summary", "children"), Input("quantity", "value"))
def summary(quantity):
    return f"共 {quantity} 项，合计 {quantity * 20} 元"

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8050, debug=False)
```

输入变化触发回调并更新输出组件。数据读取、缓存、用户权限和计算预算仍由应用定义；长计算不能默认塞在每次 UI 回调里重复执行。Dash 是数据应用框架，不替代 pandas 清洗和业务校验。

```mermaid
flowchart LR
  U["组件输入变化"] --> C["回调函数"] --> O["输出组件更新"]
```

## 动手练习与验收 {#lab}

1. 用 Pyramid 定义两条路由和未知路径测试，说明配置提交与请求处理的区别。
2. 把 Dash 回调核心计算提成普通函数，给空值和范围写测试。
3. 说明数据展示、数据处理和用户授权分别在哪里执行。

依据：[Pyramid](https://docs.pylonsproject.org/projects/pyramid/en/latest/)、[Dash](https://dash.plotly.com/)。
