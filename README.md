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
- **📥 Excel 导入** — 拖拽上传 `.xlsx` / `.xls` 文件，自动解析入库，支持多月份批量导入与预览确认
- **📄 PDF 报告** — 一键导出月度/年度分析报告，含图表渲染
- **⚙️ 灵活配置** — 风险利润率阈值、金额单位（元/万元/亿元）、主题模式可调
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

## 📡 API 端点

### 数据查询

| 方法   | 路径                          | 说明              |
| ---- | --------------------------- | --------------- |
| GET  | `/api/health`               | 健康检查            |
| GET  | `/api/dashboard/months`     | 获取可用月份列表        |
| GET  | `/api/dashboard/overview`   | 月度看板概览（?month=） |
| GET  | `/api/dashboard/branch/:id` | 分公司详情（?month=）  |
| GET  | `/api/dashboard/project/:id`| 项目详情（?month=）   |
| GET  | `/api/dashboard/annual`     | 年度分析数据（?year=）  |
| GET  | `/api/branches`             | 分公司列表           |
| GET  | `/api/branches/:id/projects`| 分公司下项目列表       |

### 数据导入

| 方法    | 路径                     | 说明          |
| ----- | ---------------------- | ----------- |
| POST  | `/api/import/upload`   | 上传 Excel 文件 |
| GET   | `/api/import/preview/:id` | 预览解析结果   |
| POST  | `/api/import/confirm`  | 确认导入单月数据    |
| POST  | `/api/import/confirm-all` | 确认导入所有月份 |
| POST  | `/api/import/cancel`   | 取消导入预览       |
| GET   | `/api/import/history`  | 导入历史记录       |
| DELETE| `/api/import/:id`      | 删除导入记录       |

### 设置与月份管理

| 方法    | 路径                        | 说明          |
| ----- | ------------------------- | ----------- |
| GET   | `/api/settings`           | 获取系统设置      |
| PUT   | `/api/settings`           | 更新系统设置      |
| GET   | `/api/months`             | 月份列表（含项目统计） |
| DELETE| `/api/months/:yearMonth`  | 删除指定月份数据    |
| DELETE| `/api/months/year/:year`  | 删除指定年份全部数据  |

## 📦 多平台构建

首次构建前必须先安装依赖：`npm install`

### 构建模式总览

项目支持 4 种构建模式，共享同一套前端 + 后端代码，通过环境变量适配不同运行环境：

| 模式 | 目标平台 | 是否含服务端 | 分发形式 | 适用场景 |
| --- | --- | --- | --- | --- |
| **Portable 便携包** | Win / Mac / Linux | ✅ | EXE / DMG / 脚本 | 本地离线使用，无需安装 Node.js |
| **Docker 容器** | 服务器 | ✅ | Docker 镜像 | 云部署 / 自建服务器 |
| **Android APK** | Android | ❌ | APK | 移动端查看（纯前端 WebView） |
| **纯服务端** | 任意 | ✅ | Node.js 进程 | 开发 / 自定义部署 |

### 构建命令速查

按使用频率从高到低排列：

```bash
# ── 平台构建（最常用，各自包含完整构建流水线）──
npm run build:win          # Windows 便携版 + 独立 EXE
npm run build:macos        # macOS 便携版 + .app + DMG
npm run build:linux        # Linux 便携版
npm run build:android      # Android APK
npm run build:docker       # Docker 镜像

# ── 全平台构建 ──
npm run build:all          # 全平台便携版（下载 4 个平台的 Node.js 运行时）

# ── 基础构建（仅前端 + 服务端，不打包）──
npm run build              # = build:frontend + build:server

# ── 清理构建产物 ──
npm run clean              # 删除 dist/ dist-portable/ dist-dmg/ dist-android/
```

### 命令层级关系

```
build:win / build:macos / build:linux / build:android / build:docker
  │
  │  每个命令都是完整流水线，内部自动执行：
  │    1. build:frontend  (Vite 构建前端)
  │    2. build:server    (esbuild 打包服务端)
  │    3. 平台打包         (下载 Node.js 运行时 + 打包)
  │    4. 启动器编译       (Windows EXE / macOS .app，仅对应平台)
  │
  ├─ build:all          → 全平台便携版（步骤 1-3，4 个平台）
  ├─ build              → 仅步骤 1-2（开发/自定义部署用）
  │
  ├─ build:launcher:win   → 仅步骤 4（Windows EXE，需先 build:win）
  ├─ build:launcher:macos → 仅步骤 4（macOS .app，需先 build:macos）
  └─ build:dmg            → 仅 DMG 打包（需先 build:launcher:macos）
```

### Portable 便携包

便携包的核心理念是**下载即用，零依赖**——内嵌 Node.js 运行时，用户无需安装任何环境。

#### 运行原理

1. **服务端打包**：esbuild 将整个 `server/` 目录打包为单个 `server.bundle.js`（ESM 格式）
2. **前端构建**：Vite 构建前端静态资源到 `dist-frontend/`
3. **运行时嵌入**：从 nodejs.org 下载官方 Node.js 二进制，放入 `node/` 目录
4. **启动器启动**：平台原生启动器（C# / Swift / Shell）调用内嵌的 Node.js 运行 `server.bundle.js`

#### 产物目录结构

```
dist-portable/
├── app/
│   ├── server.bundle.js      ← esbuild 打包的整个 Express 服务端
│   ├── dist-frontend/        ← Vite 构建的前端静态资源
│   ├── sql-wasm.wasm         ← SQLite WASM 引擎
│   └── db-init.js            ← 数据库初始化脚本
├── node/                     ← 官方 Node.js 运行时
│   ├── win-x64/node.exe
│   ├── macos-arm64/bin/node
│   ├── macos-x64/bin/node
│   └── linux-x64/bin/node
├── data/                     ← SQLite 数据库（运行时生成）
├── uploads/                  ← 上传文件目录
├── logs/                     ← 运行日志
├── start.bat / start.sh      ← 启动脚本
├── stop.bat / stop.sh        ← 停止脚本
└── Cost-Dashboard.exe        ← Windows 启动器（Windows 构建时生成）
```

#### 高级：指定平台构建

如需构建特定架构的便携版（不通过 `npm run build:*` 快捷命令），可直接调用构建脚本：

```bash
node build-portable.js --platform win-x64                # 仅 Windows
node build-portable.js --platform macos-arm64             # 仅 macOS ARM
node build-portable.js --platform macos-x64               # 仅 macOS Intel
node build-portable.js --platform linux-x64               # 仅 Linux
node build-portable.js --platform macos-arm64,macos-x64   # 多平台逗号分隔
node build-portable.js --platform all                     # 全平台（同 build:all）
```

支持的 `--platform` 值：`win-x64`、`macos-arm64`、`macos-x64`、`linux-x64`

#### Windows（独立 EXE）

```bash
npm run build:win
```

产物：`dist-portable/Cost-Dashboard.exe`（独立可执行文件，内嵌便携包）

Windows 启动器有两种运行模式：

| 模式 | 判断条件 | 文件布局 | 数据位置 |
| --- | --- | --- | --- |
| **Portable 模式** | exe 尾部无 `CDSE` 魔数 | exe 与 `app/` `node/` 同目录 | exe 同级的 `data/` |
| **Standalone 模式** | exe 尾部有 `CDSE` 魔数 | 单个 exe 文件 | `%LOCALAPPDATA%/Cost Dashboard/data/` |

Standalone 模式的工作流程：
1. 首次运行：从 exe 尾部提取 ZIP 载荷 → 解压到 `%LOCALAPPDATA%/Cost Dashboard/v{version}/`
2. 后续启动：检测到 `.extracted` 标记文件，跳过解压，秒开
3. 版本升级：自动清理旧版目录

| 启动 | 停止 |
| --- | --- |
| 双击 `Cost-Dashboard.exe` 或 `start.bat` | 右键托盘图标选择「退出服务」，或双击 `stop.bat` |

> ⚠️ EXE 启动器编译需要在 Windows 上执行（依赖 .NET csc.exe）。在 macOS/Linux 上会跳过 EXE 编译，仅生成便携版目录。

#### macOS（.app 启动器 + DMG）

```bash
npm run build:macos          # 完整构建（便携版 + .app + DMG）
npm run build:dmg            # 仅打包 DMG（需先运行 build:macos）
```

产物：`dist-dmg/Cost-Dashboard-macOS-x.x.x.dmg`

macOS .app bundle 将应用文件打包在 `Cost Dashboard.app/Contents/Resources/` 内。首次启动时，启动器自动将 `data/` 和 `uploads/` 迁移到 `~/Library/Application Support/Cost Dashboard/`（因为 .app bundle 是只读的）。启动器会根据 CPU 架构自动选择 `macos-arm64` 或 `macos-x64` 的 Node.js 运行时。

| 启动 | 停止 |
| --- | --- |
| 双击 `Cost Dashboard.app` 或 `./start.sh` | 菜单栏图标选择「退出服务」，或 `./stop.sh` |

> ⚠️ .app 和 DMG 编译需要在 macOS 上执行（依赖 swiftc）。

#### Linux

```bash
npm run build:linux
```

产物：`dist-portable/`（便携版目录，含 Linux Node.js 运行时）

Linux 使用 Shell 脚本启动，无原生启动器：

```bash
./start.sh    # 启动
./stop.sh     # 停止
```

启动脚本自动检测架构，选择 `node/linux-x64/bin/node` 运行服务。

### Docker 容器

```bash
npm run build:docker         # 构建镜像
npm run start:docker         # 启动容器
npm run stop:docker          # 停止容器
```

Docker 模式使用多阶段构建（frontend-builder → backend-builder → production），最终镜像内含 Nginx 反代 + Node.js 服务端。Nginx 监听 8080 端口反代到 Node 3113 端口，数据通过 Docker Volume 持久化。

### Android（APK）

```bash
npm run build:android
```

产物：`dist-android/Cost-Dashboard-Android-x.x.x-release-unsigned.apk`

使用 Capacitor 将 Vite 构建的前端 dist 嵌入 Android WebView，纯前端模式（不运行 Node.js 服务端）。通过 `npx cap sync android` 同步前端资源到 Android 项目，Gradle 构建 APK。

> ⚠️ APK 构建需要 Android SDK 和 Java 21+。在 GitHub Actions 中自动处理。

### 各模式数据存储位置

| 模式 | 数据库 | 上传文件 | 日志 |
| --- | --- | --- | --- |
| 纯服务端 / 开发模式 | `data/cost_dashboard.db` | `uploads/` | 控制台 |
| Portable（脚本启动） | `dist-portable/data/` | `dist-portable/uploads/` | `dist-portable/logs/` |
| Windows Standalone EXE | `%LOCALAPPDATA%/Cost Dashboard/data/` | `%LOCALAPPDATA%/Cost Dashboard/uploads/` | `%LOCALAPPDATA%/Cost Dashboard/logs/` |
| macOS .app | `~/Library/Application Support/Cost Dashboard/data/` | `~/Library/Application Support/Cost Dashboard/uploads/` | `~/Library/Application Support/Cost Dashboard/logs/` |
| Docker | Docker Volume `cost-dashboard-data` | Docker Volume `cost-dashboard-uploads` | 容器内 `/app/logs/` |
| Android APK | WebView LocalStorage | N/A | N/A |

### 各模式环境变量

所有模式通过相同的环境变量控制行为，但默认值和生效方式不同：

| 变量 | 默认值 | Portable | Docker | 说明 |
| --- | --- | --- | --- | --- |
| `PORT` | `3113` | 启动器/脚本自动设置 | 容器内 `3113`，映射到宿主机 `8369` | 服务端口 |
| `DB_MODE` | `sqljs` | 固定 `sqljs` | 固定 `sqljs` | 数据库模式 |
| `DB_PATH` | `data/cost_dashboard.db` | 各模式数据目录下 | `/app/data/cost_dashboard.db` | 数据库文件路径 |
| `UPLOADS_DIR` | `uploads` | 各模式上传目录下 | `/app/uploads` | 上传文件目录 |
| `NODE_ENV` | — | 固定 `production` | 固定 `production` | 运行环境 |
| `HOST_PORT` | `8369` | 不适用 | docker-compose 中配置 | Docker 宿主机端口 |

### 构建命令一览

| 命令 | 产物 | 平台要求 | 说明 |
| --- | --- | --- | --- |
| `npm run build:win` | Windows 独立 EXE | Windows（EXE 编译） | 完整流水线（便携版 + 启动器） |
| `npm run build:macos` | macOS 独立 DMG | macOS | 完整流水线（便携版 + 启动器 + DMG） |
| `npm run build:linux` | Linux 便携版 | 任意 | 完整流水线 |
| `npm run build:android` | Android APK | 任意（需 Android SDK + Java 21） | 完整流水线 |
| `npm run build:docker` | Docker 镜像 | 任意（需 Docker） | 完整流水线 |
| `npm run build:portable:win` | Windows 便携版目录 | 任意 | 仅构建便携版 |
| `npm run build:portable:macos` | macOS 便携版目录 | 任意 | 仅构建便携版 |
| `npm run build:portable:linux` | Linux 便携版目录 | 任意 | 仅构建便携版 |
| `npm run build:portable:all` | 全平台便携版目录 | 任意 | 下载 4 个平台 Node.js |
| `npm run build:exe` | Windows 独立 EXE | Windows | 需要先 build:portable:win |
| `npm run build:dmg` | macOS 独立 DMG | macOS | 需要先 build:portable:macos |
| `npm run build:launcher:win` | 仅 Windows EXE 启动器 | Windows | 需要先 build:portable:win |
| `npm run build:launcher:macos` | 仅 macOS .app 启动器 | macOS | 需要先 build:portable:macos |
| `npm run build:all` | 全平台完整构建（exe/dmg/linux） | 任意 | 所有平台完整构建 |
| `npm run build` | 前端 dist + 服务端 bundle | 任意 | 基础构建，不打包 |
| `npm run clean` | — | 任意 | 清理所有构建产物 |

### GitHub Actions 自动发布

推送代码到任意分支或手动触发 workflow 即可自动构建：

- **自动触发**：推送代码到任意分支
- **手动触发**：GitHub Actions 页面点击 Run workflow

工作流会并行构建 Windows EXE、macOS DMG、Android APK，每个构建包含验证和冒烟测试（启动服务 → 检查 `/api/health` → 验证产物大小和结构）。构建完成后自动创建 GitHub Release 并上传产物。

## 📁 项目结构

```
cost-dashboard/
├── server/                  # 后端
│   ├── db/                  #   数据库初始化、种子数据、sql.js DAO
│   ├── routes/              #   API 路由 (data / import / settings)
│   ├── services/            #   业务逻辑 (聚合计算、成本服务、导入服务)
│   ├── middleware/          #   错误处理
│   └── utils/               #   Excel 解析、校验、驼峰转换
├── src/                     # 前端
│   ├── components/
│   │   ├── cards/           #   KPI 卡片、排名卡、风险项目卡
│   │   ├── charts/          #   15 种图表组件 + 轴布局工具
│   │   ├── common/          #   面包屑、导出报告、加载、Logo、月份/年份选择、主题切换
│   │   ├── layout/          #   头部、侧边栏、布局
│   │   └── tables/          #   成本明细表
│   ├── pages/
│   │   ├── Dashboard/       #   月度看板 + 分公司详情
│   │   ├── Annual/          #   年度分析
│   │   └── Admin/           #   数据导入、导入历史、月份管理、系统设置
│   ├── stores/              #   Zustand (dashboard / settings / theme)
│   ├── styles/              #   全局样式 (Tailwind CSS 主题)
│   └── utils/               #   图表渲染、报告生成、字体加载、格式化、常量
├── public/                  #   静态资源 (favicon、NotoSansSC 字体)
├── launcher/                #   平台启动器源码
│   ├── windows/             #     Windows C# 启动器 + PowerShell 构建脚本
│   ├── macos/               #     macOS Swift 启动器 + DMG 打包脚本
│   └── android/             #     Android APK 构建脚本
├── android/                 #   Capacitor Android 项目
├── scripts/                 #   便携版启动/停止脚本
├── nginx/                   #   Docker Nginx 配置
├── data/                    #   SQLite 数据库文件 (运行时生成)
├── .github/workflows/       #   CI/CD (Build & Release)
├── build-portable.js        #   便携版构建脚本
├── build-server.js          #   后端打包脚本
├── capacitor.config.json    #   Capacitor 配置
├── docker-entrypoint.sh     #   Docker 入口脚本
├── Dockerfile               #   多阶段构建
└── docker-compose.yml
```

## 🔧 配置

各构建模式的环境变量差异详见上方「各模式环境变量」章节。以下为通用配置参考：

| 环境变量          | 默认值                      | 说明           |
| ------------- | ------------------------ | ------------ |
| `PORT`        | `3113`                   | 后端服务端口       |
| `DB_MODE`     | `sqljs`                  | 数据库模式        |
| `DB_PATH`     | `data/cost_dashboard.db` | 数据库文件路径      |
| `UPLOADS_DIR` | `uploads`                | 上传文件临时目录     |
| `NODE_ENV`    | —                        | 运行环境（便携包/Docker 自动设为 `production`） |
| `HOST_PORT`   | `8369`                   | Docker 宿主机端口（仅 Docker 模式） |

## 📊 数据模型

核心数据围绕 **分公司 → 项目** 两级结构：

- **分公司**：马来公司、印尼公司、装饰公司、安装公司、老挝公司、中东公司、大洋洲公司、其他公司
- **项目**：归属分公司，含以下指标维度：
  - **合同与成本**：合同总额、自营合同、投标成本、标准成本
  - **利润指标**：投标利润率、价差率、基准收益率、责任利润率、实际利润率、预期利润率
  - **产值与确认**：业主确认产值、自营产值、实际成本、计量确认率、产值确认率
  - **后期预测**：后期预计产值、后期预测成本、后期预测利润率
  - **收款信息**：应收、已收、未收、收款率
- **月份**：支持多月份数据，按月切换查看

### 数据库表结构

| 表名                 | 说明                  |
| ------------------ | ------------------- |
| `branches`         | 分公司（8 个）            |
| `projects`         | 项目（归属分公司，含在线/审批状态）  |
| `monthly_cost_data`| 月度成本数据（项目 + 月份唯一约束） |
| `import_logs`      | 导入日志（自动清理 90 天前记录）  |
| `settings`         | 系统设置（键值对）           |

## 🔨 常用操作

### 修改端口

默认端口为 3113，如需修改：

- **macOS / Linux**：`PORT=8080 npm start`
- **Windows**：`set PORT=8080 && npm start`

### 导入 Excel 数据

1. 浏览器打开看板
2. 点击右上角齿轮图标进入管理页面
3. 点击「数据导入」
4. 选择 `.xlsx` 或 `.xls` 文件上传
5. 系统自动解析并展示预览，可选择导入单月或全部月份
6. 确认后数据入库

### 系统设置

在管理页面「系统设置」中可配置：

- **主题模式**：浅色 / 深色 / 跟随系统
- **风险利润率阈值**：低于此阈值的项目标记为风险项目（默认 5%）
- **金额单位**：元 / 万元 / 亿元

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
