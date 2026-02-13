# Monorepo 结构说明

## 当前结构

```
know-yourself/
├── package.json            # workspaces + 根脚本（dev/build 等委托给各端）
├── eslint.config.js
└── packages/
    ├── core/               # 共享业务逻辑（API、常量、hooks、utils）
    ├── h5/                 # H5 端（移动 Web，原根目录 Web 应用）
    │   ├── src/
    │   ├── index.html
    │   ├── vite.config.js
    │   ├── tailwind.config.js
    │   ├── postcss.config.js
    │   ├── public/
    │   └── package.json    # @know-yourself/h5
    ├── miniprogram/        # 微信小程序（Taro）
    │   └── package.json    # @know-yourself/miniprogram
    └── README.md           # 本文件
```

### 各端说明

| 包名 | 说明 | 根目录脚本 |
|------|------|------------|
| `@know-yourself/core` | 跨端共享逻辑，通过适配器对接各端 | - |
| `@know-yourself/h5` | H5（移动 Web），Vite + React | `npm run dev` / `npm run build` / `npm run deploy` |
| `@know-yourself/miniprogram` | 微信小程序，Taro + React | `npm run dev:mp` / `npm run build:mp` |

### 规划中的端

- **RN**：React Native 端，后续新增 `packages/rn`。
- **PC Web**：PC 端 Web，后续新增 `packages/pc`（可与 H5 共享 core，UI 与构建独立）。

---

## 根目录常用命令

```bash
# H5 开发 / 构建 / 部署
npm run dev          # 启动 H5 开发服务器
npm run build        # 构建 H5
npm run preview      # 预览 H5 构建产物
npm run deploy       # 构建 H5 并推送到 gh-pages

# 小程序
npm run dev:mp       # 小程序开发模式（watch）
npm run build:mp     # 小程序生产构建

# 全仓库
npm run lint         # ESLint
```

---

## CI / 部署

- **GitHub Pages**：在 `main` 分支 push 时，构建 `@know-yourself/h5`，产物目录为 `packages/h5/dist`，由 `.github/workflows/deploy.yml` 上传并部署。
