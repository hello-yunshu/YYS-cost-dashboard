<h1 align="center">Cost Dashboard</h1>

<p align="center">
  <strong>多维度成本数据可视化分析平台</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/ECharts-6-aa344d?logo=apache-echarts" alt="ECharts" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/SQLite-sql.js-003b57?logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ed?logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/Android-Capacitor-3DDC84?logo=android" alt="Android" />
</p>

***

## ✨ 功能特性

- **📊 多维度看板** — 利润率、利润额、收款率、费用构成等核心指标一目了然
- **🏢 分公司视图** — 各分公司独立详情页，含雷达图、散点图、趋势对比
- **📅 年度分析** — 跨月趋势追踪、成本结构演变、分公司横向对比
- **📥 Excel 导入** — 拖拽上传 `.xlsx` 文件，自动解析入库，支持导入历史回溯
- **📄 PDF 报告** — 一键导出月度/年度分析报告，含图表渲染
- **🌙 亮暗主题** — 支持浅色/深色/跟随系统三种模式
- **📱 响应式** — 移动端适配，管理页面支持手机操作
- **🐳 零配置部署** — Docker 一键启动，数据持久化，开箱即用
- **💻 多平台分发** — Windows EXE / macOS DMG / Android APK

## 🏗 技术架构

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   React 19  │────▶│  Express 5   │────▶│  sql.js    │
│  + ECharts  │     │  API Server  │     │  (SQLite)  │
│  + Zustand  │◀────│  :3113       │◀────│  In-WASM   │
└─────────────┘     └──────────────┘     └────────────┘
     :5173                 :3113
   (dev only)          (standalone)
```

| 层级  | 技术选型                                |
| --- | ----------------------------------- |
| 前端  | React 19 + React Router 7 + Zustand 5 |
| 图表  | ECharts 6 (echarts-for-react)       |
| 样式  | Tailwind CSS 4 + CSS Variables      |
| 后端  | Express 5 + Multer 2 (文件上传)         |
| 数据库 | sql.js (SQLite 编译为 WebAssembly)     |
| 报告  | pdfmake + NotoSansSC 字体             |
| 构建  | Vite 8 + esbuild                    |
| 移动端 | Capacitor 8 (Android WebView)       |
| 部署  | Docker (Nginx + Node.js)            |

## 🚀 快速开始

### 开发模式

```bash
npm install
npm run dev
```

访问 **http://localhost:5173**，Vite 提供热更新，API 请求自动代理到后端 `:3113`。

### 生产模式

```bash
npm install
npm run build
npm start
```

访问 **http://localhost:3113**，Express 直接托管前端静态文件。

### Docker 部署

```bash
docker compose up -d
```

访问 **http://localhost:8369**，Nginx 反向代理 + Node.js 后端。

## 📦 多平台构建

首次构建前必须先安装依赖：`npm install`

### Windows（便携版 + EXE 启动器）

```bash
npm run build:win
```

产物：`dist-portable/Cost-Dashboard.exe` + 便携版目录

| 启动 | 停止 |
| --- | --- |
| 双击 `Cost-Dashboard.exe` 或 `start.bat` | 右键托盘图标选择「退出服务」，或双击 `stop.bat` |

> ⚠️ EXE 启动器编译需要在 Windows 上执行（依赖 .NET csc.exe）。在 macOS/Linux 上会跳过 EXE 编译，仅生成便携版文件。

### macOS（便携版 + .app 启动器 + DMG）

```bash
npm run build:macos          # 完整构建（便携版 + .app + DMG）
npm run build:dmg            # 仅打包 DMG（需先运行 build:macos）
```

产物：`dist-dmg/Cost-Dashboard-macOS-x.x.x.dmg`

| 启动 | 停止 |
| --- | --- |
| 双击 `Cost Dashboard.app` 或 `./start.sh` | 菜单栏图标选择「退出服务」，或 `./stop.sh` |

> ⚠️ .app 和 DMG 编译需要在 macOS 上执行（依赖 swiftc）。

### Android（APK）

```bash
npm run build:android
```

产物：`dist-android/Cost-Dashboard-Android-x.x.x-release-unsigned.apk`

> ⚠️ APK 构建需要 Android SDK 和 Java 17+。在 GitHub Actions 中自动处理。

### 全平台便携版

```bash
npm run build:portable
```

下载所有平台的 Node.js 运行时，生成完整便携版目录。

### 构建命令一览

| 命令 | 产物 | 平台要求 |
| --- | --- | --- |
| `npm run build:win` | 便携版 + EXE | Windows |
| `npm run build:macos` | 便携版 + .app + DMG | macOS |
| `npm run build:android` | APK | 任意（需 Android SDK） |
| `npm run build:portable` | 全平台便携版 | 任意 |
| `npm run build:launcher:win` | 仅 EXE | Windows |
| `npm run build:launcher:macos` | 仅 .app | macOS |
| `npm run build:dmg` | 仅 DMG | macOS |

### GitHub Actions 自动发布

推送 tag 即可自动构建并发布 Release：

```bash
git tag v1.2.3
git push origin v1.2.3
```

工作流会并行构建 Windows ZIP、macOS DMG、Android APK，并自动创建 GitHub Release。

## 📁 项目结构

```
cost-dashboard/
├── server/                  # 后端
│   ├── db/                  #   数据库初始化、种子数据、DAO
│   ├── routes/              #   API 路由 (data / import / settings)
│   ├── services/            #   业务逻辑 (聚合、成本计算)
│   ├── middleware/          #   错误处理
│   └── utils/               #   Excel 解析、校验、驼峰转换
├── src/                     # 前端
│   ├── components/
│   │   ├── cards/           #   KPI 卡片、排名卡、风险项目卡
│   │   ├── charts/          #   16 种图表组件
│   │   ├── common/          #   主题切换、月份选择、PDF 导出等
│   │   ├── layout/          #   头部、侧边栏、布局
│   │   └── tables/          #   成本明细表
│   ├── pages/
│   │   ├── Dashboard/       #   月度看板 + 分公司详情
│   │   ├── Annual/          #   年度分析
│   │   └── Admin/           #   数据导入、月份管理、设置
│   ├── stores/              #   Zustand 状态管理
│   └── utils/               #   图表渲染、报告生成、格式化
├── launcher/                #   平台启动器源码
│   ├── windows/             #     Windows C# 启动器 + PowerShell 构建脚本
│   ├── macos/               #     macOS Swift 启动器 + DMG 打包脚本
│   └── android/             #     Android APK 构建脚本
├── android/                 #   Capacitor Android 项目
├── scripts/                 #   便携版启动/停止脚本
├── nginx/                   #   Docker Nginx 配置
├── .github/workflows/       #   CI/CD (Build & Release)
├── Dockerfile               #   多阶段构建
└── docker-compose.yml
```

## 🔧 配置

| 环境变量        | 默认值                      | 说明           |
| ----------- | ------------------------ | ------------ |
| `PORT`      | `3113`                   | 后端服务端口       |
| `DB_MODE`   | `sqljs`                  | 数据库模式        |
| `DB_PATH`   | `data/cost_dashboard.db` | 数据库文件路径      |
| `HOST_PORT` | `8369`                   | Docker 宿主机端口 |

## 📊 数据模型

核心数据围绕 **分公司 → 项目** 两级结构：

- **分公司**：马来、印尼、装饰、安装、老挝、中东、大洋洲等
- **项目**：归属分公司，含自营产值、实际成本、利润率、收款率等指标
- **月份**：支持多月份数据，按月切换查看

## 🔨 常用操作

### 修改端口

默认端口为 3113，如需修改：

- **macOS / Linux**：`PORT=8080 npm start`
- **Windows**：`set PORT=8080 && npm start`

### 导入 Excel 数据

1. 浏览器打开看板
2. 点击右上角齿轮图标进入管理页面
3. 点击「数据导入」
4. 选择 `.xlsx` 文件并选择对应月份
5. 点击「上传」

### 初始化示例数据

```bash
npm run seed
```

### 数据备份与恢复

- **备份**：停止服务后，复制 `data/cost_dashboard.db` 到安全位置
- **恢复**：停止服务后，用备份文件替换 `data/cost_dashboard.db`，再重新启动
- **重置**：停止服务后，删除 `data/cost_dashboard.db`，重新启动会自动初始化

## 💻 系统要求

| 项目      | 要求                                  |
| ------- | ----------------------------------- |
| Node.js | 24 或更高版本（开发/生产模式需要）                 |
| Docker  | 任意版本（Docker 部署需要）                   |
| 浏览器     | Chrome / Firefox / Edge / Safari    |
| 磁盘空间    | 约 200MB（便携版约 300MB，含 Node.js 运行时）   |
| 操作系统    | Windows 10+ / macOS 12+ / Linux x64 |

## ❓ 常见问题

**端口被占用怎么办？**

换一个端口启动，或先关闭占用该端口的程序。

**npm install 报错怎么办？**

确认 Node.js 版本 ≥ 24，尝试删除 `node_modules` 后重新执行 `npm install`。

**打包时报 `vite` 不是内部或外部命令怎么办？**

说明还没有安装前端构建依赖。请在项目根目录先执行 `npm install`，完成后再运行构建命令。

**打包时报 `unzip` 不是内部或外部命令怎么办？**

请使用最新的 `build-portable.js` 后重新打包。Windows 构建会自动使用系统自带的 PowerShell 解压 Node.js，不需要额外安装 `unzip`。

**构建后只剩 `2025-12` 和 `2026-01` 怎么办？**

这说明便携包启动时没有找到原来的数据库，自动初始化了示例数据。先停止程序，再把项目根目录的 `data/cost_dashboard.db` 复制并覆盖到 `dist-portable/data/cost_dashboard.db`，然后重新启动。

**页面打不开？**

确认终端没有红色报错信息，检查浏览器访问的端口号是否正确（开发模式 5173，生产模式 3113，Docker 8369）。

**macOS 上打开 .app 提示"无法验证开发者"怎么办？**

右键点击 `Cost Dashboard.app`，选择「打开」，在弹窗中再次点击「打开」即可。或在终端执行 `xattr -cr "Cost Dashboard.app"` 移除隔离属性。

## 📄 License

Private — Internal Use Only
