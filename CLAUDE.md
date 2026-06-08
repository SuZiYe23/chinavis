# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

「戏韵万象」— 京剧数据可视分析平台。纯前端应用，无框架、无构建工具、无后端。双击 `index.html` 即可运行。在线部署于 GitHub Pages：<https://SuZiYe23.github.io/chinavis/>

**技术栈：** ECharts 5 + ECharts WordCloud + 原生 JavaScript（ES5，IIFE 模块模式）+ 京剧国风设计系统

## 本地运行

项目无需 HTTP 服务器、无需 `npm install`，直接双击 `index.html` 即可。

注意：`build-data.bat` 在仓库中不存在 — `data-js/` 目录下的 JS 数据文件已直接提交到仓库，无需重新生成。如果 `data-js/` 丢失，可从 `data-test/*.json` 重新生成（脚本需自建）。

## 架构概览

### 数据流

```
data-test/*.json → (build-data.bat) → data-js/*.js（window.__DATA_* 全局变量）
                                         ↓
                                    dataLoader.js（DataStore 全局对象）
                                         ↓
                              chartTheme.js + utils.js（共享主题/工具）
                                         ↓
                     js/charts/*.js（各图表 IIFE 模块，读写 DataStore）
                                         ↓
                                    main.js（页面路由 & 编排）
```

### 全局依赖链（按 index.html `<script>` 加载顺序）

1. **数据文件** (`data-js/*.js`) — 注入 `window.__DATA_opera_basic` 等全局变量
2. **ECharts CDN** — `echarts` + `echarts-wordcloud`
3. **`dataLoader.js`** — 将所有 `__DATA_*` 读入 `DataStore` 全局对象；提供所有数据查询函数（`getSankeyData()`, `getRelationsByOpera()`, `getOperasByTimelineDynasty()` 等）
4. **`utils.js`** — 通用工具（DOM、格式化、防抖节流等），声明 `$`, `$$` 等
5. **`chartTheme.js`** — 共享 ECharts 主题常量：`FONT_DISPLAY/FONT_SERIF/FONT_BODY`、`JINGJU` 配色、`ROLE_COLORS`、`STAGE_COLORS`、`SERIES_COLORS`、`goldenTooltip()`、`emptyTitle()`、`bindResize()`
6. **`js/charts/*.js`** — 各图表模块（均用 IIFE 包裹，挂载到 `window`）
7. **`main.js`** — 页面切换路由、时间轴筛选、窗口缩放、初始化编排

### 页面系统（5 个 section，通过 CSS class `active-page` 切换）

| Section ID | 功能 | 初始化函数 |
|---|---|---|
| `overviewPage` | 整体预览（时间轴 + 剧本索引 + 剧种柱状图 + 词云 + 桑基图） | `main.js` onload |
| `operaPage` | 具体剧目（概览卡 + 角色表 + 关系力导向图 + 情节折线 + 词云 + 事件列表） | `initOperaPage()` |
| `sankeyPage` | 行当分析（桑基图 + 饼图 + 堆叠面积图） | `renderSankeyCompare()` |
| `networkPage` | 角色关系（环形网络 + 四维切换面板） | `renderRelationNetwork()` |
| `sunburstPage` | 主题结构（旭日图三级下钻 + TOP 组合） | `renderThemeSunburst()` |
| `overviewAnalysisPage` | 综合分析（气泡图 + 热力图 + 情绪折线） | `renderComprehensiveAnalysis()` |

### 时间轴筛选机制

多个页面包含时间轴（朝代筛选）。`main.js` 中 `currentDynasty` 变量驱动筛选，通过 `DYNASTY_MAP`（在 `dataLoader.js` 中定义，映射朝代标签到数据中的朝代名列表）过滤 `DataStore.operaCompact` / `DataStore.operaRoles`。

### 关键全局变量（`main.js`）

- `currentDynasty` — 当前选中的朝代标签
- `selectedOperaIndex` — 当前选中的剧目在筛选列表中的索引
- `DataStore.currentOpera` — 当前剧目名称字符串
- `_charts` — ECharts 实例缓存对象，key 为 DOM id
- `_sankeyFilter`, `_networkFilter` — 子页面筛选项

### relationNetwork.js vs relationNetwork_clean.js

- **`relationNetwork.js`**（被 index.html 加载）：IIFE 模式，3 个维度 tab（structure/role/relation），使用全局变量
- **`relationNetwork_clean.js`**（未加载，改进版）：ES Module 重构（`import`/`export`），增加第 4 个"叙事维度" tab，图表参数有微调。如需更新关系网络，以此版本为基础适配

## 设计系统约束

详见 `DESIGN_SYSTEM.md`。核心规则：
- **勿用纯白背景** — 破坏沉浸感。背景为墨黑 `#0a0504`，面板为半透明 warm tone `rgba(20,10,8,0.75)`
- **勿用科技蓝/荧光色** — 与京剧主题冲突。主色为朱砂/胭脂/古金系
- **图标用装饰符号**（◈ ◆ ◇ 等），不要用 emoji
- **统一过渡时间**：250ms ease（CSS）/ 800ms（ECharts animationDuration）
- **字重克制**：Noto Serif SC 400 已够，勿加粗

## 修改图表时的注意事项

1. 所有图表背景设为 `'transparent'`
2. Tooltip 统一使用 `goldenTooltip(formatterFn)` 生成，保持「戏韵万象」头部样式
3. 颜色优先使用 `ROLE_COLORS`、`SERIES_COLORS`、`THEME_TYPE_COLORS` 等预定义色板
4. ECharts 实例通过 `getChart(id)` 获取/创建，自动缓存和 dispose 复用
5. 新图表模块如果只被特定页面使用，在对应页面的初始化函数中调用（如 `initOperaPage()`）；如果跨页面使用，在 `window.onload` 中调用

## 数据模式

`data-test/` 下 6 个 JSON 文件均为 1473 条记录（剧本数）。字段说明：
- `opera_basic.json` — 剧本基本信息（名称、朝代、类型、角色摘要）
- `opera_roles.json` — 每部剧的角色列表（姓名、性别、年龄、身份、性格、行当、重要度、表演类型）
- `opera_relations.json` — 角色关系（nodes 数组 + links 数组，含情绪、交互次数）
- `opera_storyline.json` — 叙事事件序列（事件描述、阶段、情绪值、冲突值）
- `opera_themes.json` — 主题关键词（词、主题类型、情绪、权重）
- `summary.json` — 汇总统计（分布数据：剧种分布、主题类型分布）
- `opera_compact.json` — 剧本精简版（用于索引列表渲染，字段少于 basic）

## 浏览器兼容

项目使用 ES5 语法（`var`、`function`），未使用任何 ES6+ 特性、模块加载、或需要转译的语法。目标浏览器为现代 Chrome/Edge/Firefox。Google Fonts（Ma Shan Zheng, Noto Serif SC, ZCOOL XiaoWei）通过 CDN 加载，离线环境会回退到系统字体。
