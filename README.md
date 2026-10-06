# Fino 文档站

Fino 是基于 VitePress 的静态知识库，收录 Google AIP、gRPC 中文译文与对应英文原文，以及 Rust 学习文档。

线上地址：[fino-io.github.io](https://fino-io.github.io/)。

## 本地启动

使用 Node.js 22 和 npm，与 GitHub Actions 的构建环境保持一致。在项目根目录执行：

```bash
npm ci
npm run docs:dev
```

打开终端输出的本地地址，默认是 `http://localhost:5173`。修改文档或主题后，开发服务会自动更新页面。

首次启动需要安装依赖；英文原文来自仓库内的 `upstream/`，准备脚本不会从网络拉取上游内容。

## 构建与预览

```bash
npm run docs:build
npm run docs:preview
```

构建产物位于 `docs/.vitepress/dist/`，预览地址以终端输出为准。修改源文件后，需要重新构建才能在预览中看到更新。

| 命令 | 用途 |
| --- | --- |
| `npm run docs:prepare` | 同步仓库内的英文原文并生成侧边栏 |
| `npm run docs:dev` | 准备文档并启动开发服务 |
| `npm run docs:build` | 准备文档并构建静态站点 |
| `npm run docs:preview` | 准备文档并预览已有构建产物 |

## 系统架构

站点采用“Markdown 内容 + 构建时生成 + Vue 主题”的结构，通过 GitHub Pages 托管，无需后端服务或数据库。

```text
docs/ 中文译文、Rust 文档       upstream/ 英文原文
             │                        │
             └──────────┬─────────────┘
                        ▼
             scripts/prepare-docs.mjs
             同步英文页面、生成侧边栏
                        │
                        ▼
          VitePress 配置 + Markdown + Vue 主题
                        │
                        ▼
              docs/.vitepress/dist/
                        │
                        ▼
                  GitHub Pages
```

### 目录结构

```text
docs/
├── index.md                  # 中文首页内容与合集配置
├── en/                       # 英文首页
├── aip/                      # AIP 中文译文、目录与翻译元数据
├── grpc/                     # gRPC Guides、Blog 中文译文
├── rust/                     # Rust 学习文档
├── public/                   # Logo、图片等静态资源
├── generated/                # 自动生成的英文页面和 gRPC 侧边栏
└── .vitepress/
    ├── config.mts            # 站点配置、路由、导航、搜索与 Markdown 扩展
    ├── content.ts            # 中英文页面对应关系
    ├── aip.ts / grpc.ts      # 文档页面类型识别
    └── theme/                # Vue 页面组件与样式
scripts/                      # 内容同步与侧边栏生成脚本
upstream/
├── google-aip/               # Google AIP 上游内容
└── grpc.io/                  # gRPC 上游内容
.github/workflows/docs.yml    # GitHub Pages 构建和部署流程
```

### 内容生成与路由

`scripts/prepare-docs.mjs` 按顺序执行四个任务：

1. 从 `upstream/google-aip/aip/general/` 生成 AIP 英文页面。
2. 根据已有 gRPC 中文译文，从 `upstream/grpc.io/` 生成对应英文页面，并清理上游模板语法、调整链接。
3. 根据 AIP 上游元数据和 `docs/aip/general/zh.yaml` 生成 AIP 侧边栏。
4. 根据 gRPC 译文的标题、日期生成 Guides 与按年份分组的 Blog 侧边栏。

VitePress 将生成目录中的英文页面映射到 `/aip/general/`、`/grpc/guides/` 和 `/grpc/blog/`，与中文译文共享路径结构。中文文章以 `_zh.md` 结尾；`content.ts` 提供页面级中英文切换链接。

`docs/generated/`、`docs/.vitepress/general-sidebar.generated.json`、缓存与构建产物均已加入 `.gitignore`。这些文件会在准备或构建时重新生成，应修改对应源文件。

### 页面与主题

主题复用 VitePress 默认布局，通过少量自定义组件补充知识库功能：

- `Layout.vue`：文档目录页介绍、gRPC 文章标题和图表渲染入口。
- `LibraryHome.vue`：首页合集、阅读入口与知识库概览，数据来自 `docs/index.md` 的 frontmatter。
- `ContentLanguageLink.vue`：当前页面的中英文切换入口。
- `MermaidRenderer.vue`：客户端渲染 Mermaid 图表；Graphviz 由站点配置通过 `@viz-js/viz` 在构建时渲染。
- `site-nav.css`：首页和子页面共享的页眉样式。
- `custom.css`、`library-home.css`：文档布局与首页样式。

全文搜索使用 VitePress 自带的本地搜索，无需独立搜索服务。

## 日常维护与部署

修改中文内容时编辑 `docs/` 下对应 Markdown；新增 AIP 译文时同步维护 `docs/aip/general/zh.yaml`；更新英文来源时维护 `upstream/` 下对应文件。修改导航、路由或 Markdown 渲染规则时编辑 `docs/.vitepress/config.mts`。

修改完成后执行简单验证：

```bash
npm run docs:build
git diff --check
```

GitHub Actions 在 `main` 分支的文档、脚本、上游内容、依赖或部署配置发生推送变更时构建并发布站点，也支持手动运行。流程使用 Node.js 22，依次执行 `npm ci`、`npm run docs:build`，将 `docs/.vitepress/dist/` 发布到 GitHub Pages。仅修改本 README 不会触发自动部署。
