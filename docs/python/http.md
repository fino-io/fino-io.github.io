---
title: 11 · HTTP、接口调用与采集
description: Python 中文学习指南：HTTP、接口调用与采集，包含概念、代码示例、练习与验收。
pageClass: aip-article
---

# 11 · HTTP、接口调用与采集

本章目标：使用成熟客户端调用接口，设置超时，验证响应，并合理处理重试与采集边界。

## 从请求到业务数据

```sh
python -m pip install httpx
```

```python
import httpx

def fetch_repository(owner: str, repo: str) -> dict:
    with httpx.Client(timeout=10.0, follow_redirects=True) as client:
        response = client.get(
            f"https://api.github.com/repos/{owner}/{repo}",
            headers={"Accept": "application/vnd.github+json"},
        )
        response.raise_for_status()
        data = response.json()
    if not isinstance(data, dict) or "full_name" not in data:
        raise ValueError("响应缺少仓库信息")
    return data
```

这个示例需要网络，服务限流或响应变更时可能失败。Client 复用连接，使用结束时关闭；一组请求宜共用一个 Client。`params` 编码查询参数，`json` 发送 JSON，`files` 上传文件，避免手工拼编码。TLS 验证保持开启。

## 失败、分页与重试

区分连接失败、超时、HTTP 非成功状态和业务数据无效。对每次 I/O 设置超时；较大任务还需要总时限。日志保留 URL 的安全部分、状态码和请求标识，不记录 token。

GET 等幂等请求可对暂时故障有限重试，使用指数退避和抖动，尊重 `Retry-After`。POST 可能已经在服务端成功，不能一遇超时就重发；需幂等键或业务去重。重试工具可以复用 Tenacity，但由业务明确哪些异常值得重试。

分页处理应设置最大页数、去重和断点；不要假定第一批数据就是全集。HTTP 200 不等于 JSON 格式正确，仍要解析和校验字段。

## 采集与内容解析

优先使用官方 API、导出接口和公开数据集。确需解析 HTML 时用 Beautiful Soup；动态网页按需要选 Playwright。遵守网站许可、robots 提示和速率限制，不绕过登录或反爬措施。把下载、解析和保存分成可测试的操作，保存少量脱敏样本用于回归测试。

## 练习与验收

1. 对本地测试服务器分别模拟 200、404、超时和坏 JSON。
2. 处理两页响应，确认分页终止和去重。
3. 使用 mock transport 让测试无需互联网。

验收：失败可解释，请求数量和时间有界，凭据通过环境变量或安全配置提供。参考：[HTTPX 快速开始](https://www.python-httpx.org/quickstart/)、[超时配置](https://www.python-httpx.org/advanced/timeouts/)。
