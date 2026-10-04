---
layout: LibraryHome
pageClass: fino-library-home
aside: false
outline: false

hero:
  name: Fino
  text: API 设计知识库
  tagline: 面向团队与个人的 API 规范中文参考，帮助设计更清晰、更一致的接口。
  actions:
    - theme: brand
      text: 浏览 AIP 中文版
      link: /aip/
    - theme: alt
      text: 浏览 gRPC 中文版
      link: /grpc/guides/

collections:
  - title: Google AIPs
    count: 72
    unit: 篇规范
    label: API 设计原则与实践
    description: 从资源设计、标准方法到兼容性，按主题与编号查阅通用 API 设计规范。
    link: /aip/general/
  - title: gRPC Guides
    count: 24
    unit: 篇指南
    label: 常见场景与使用指南
    description: 面向认证、截止时间、错误处理、重试与性能等常见场景的操作指南。
    link: /grpc/guides/
  - title: gRPC Blog
    count: 59
    unit: 篇文章
    label: 工程实践与社区动态
    description: 按年份浏览发布说明、工程实践与社区动态，了解 gRPC 的演进。
    link: /grpc/blog/

reading:
  - label: AIP 121
    title: 面向资源的设计
    link: /aip/general/0121_zh
  - label: AIP 131
    title: 标准方法：Get
    link: /aip/general/0131_zh
  - label: AIP 158
    title: 分页
    link: /aip/general/0158_zh
  - label: gRPC
    title: 错误处理
    link: /grpc/guides/error_zh
---

## 关于 Fino

Fino 用来收录值得反复查阅的 API 设计规范。当前以 Google AIP 中文版为核心入口，帮助中文读者快速理解成熟 API 设计实践。
