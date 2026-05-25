# 戏韵万象：京剧数据可视分析系统

这是一个面向京剧剧本文本的静态数据可视分析项目。页面基于 `数据可视化大作业/index.html` 原始大屏模板改造，使用仓库内 `data/` 目录的全量 JSON 数据驱动，不依赖后端服务。

在线访问入口：<https://SuZiYe23.github.io/chinavis/>

## 当前数据规模

| 指标 | 数量 |
| --- | ---: |
| 剧本总数 | 1473 部 |
| 角色条目 | 18202 个 |
| 人物关系边 | 14380 条 |
| 叙事事件 | 11070 个 |
| 弱字段问题分片 | 0 |
| 伪角色残留 | 0 |

## 页面功能

- **总览驾驶舱**：展示剧本、角色、关系、事件、质量验收等核心指标，并联动当前选中剧目。
- **剧目库**：支持按朝代、剧目类型筛选，支持按剧名、角色、主题词搜索。
- **角色关系**：展示全局行当/身份分布，并按选中剧目绘制人物关系导向图和关系边明细。
- **主题叙事**：展示全局主题类型、主题词云、选中剧目的情节发展折线和高冲突事件。
- **数据资产**：集中提供 5 个核心 JSON、前端索引、汇总 JSON 和完整 zip 数据包下载。

筛选条件、当前剧目和页面切换共用同一份前端状态：切换到任意屏幕时，都会沿用当前筛选和选中的剧目，实现多屏联动。

## 数据文件

完整数据位于 `data/`：

| 文件 | 记录数 | 用途 |
| --- | ---: | --- |
| `opera_basic.json` | 1473 | 剧名、朝代、类型、主要角色、封面生成要素 |
| `opera_roles.json` | 1473 | 角色性别、年龄、身份、性格、行当、表演方式、重要度 |
| `opera_relations.json` | 1473 | 人物节点、关系边、互动次数、关系情绪 |
| `opera_storyline.json` | 1473 | 分阶段情节事件、情绪值、冲突值、标准化叙事弧线 |
| `opera_themes.json` | 1473 | 主题关键词、主题类型占比、主题情绪 |
| `summary.json` | 1 | 前端首页指标、全局分布、质量验收汇总 |
| `operas_compact.json` | 1473 | 前端检索和联动分析使用的轻量索引 |
| `cleaned_opera_data_opera_zip_llm_primary.zip` | - | 5 个核心 JSON 的完整压缩包 |

前端默认只加载 `summary.json` 和 `operas_compact.json`，完整 JSON 文件保留为下载和二次分析数据源。

## 项目结构

```text
.
├── index.html                         # 根入口，跳转到可视化大屏
├── README.md
├── data/
│   ├── opera_basic.json
│   ├── opera_roles.json
│   ├── opera_relations.json
│   ├── opera_storyline.json
│   ├── opera_themes.json
│   ├── summary.json
│   ├── operas_compact.json
│   └── cleaned_opera_data_opera_zip_llm_primary.zip
└── 数据可视化大作业/
    ├── index.html                     # 产品级数据可视化单页应用
    ├── assets/bg.png
    └── 戏韵万象_京剧数据可视分析系统_需求文档修订版.docx
```

## 本地预览

由于页面通过 `fetch()` 读取 JSON，请使用本地静态服务预览，不要直接双击 HTML 文件。

```bash
cd chinavis
python3 -m http.server 8765
```

打开：

```text
http://127.0.0.1:8765/
```

## 数据质量说明

当前发布版本已完成全量数据合并和校验：

- 5 个核心 JSON 均为 1473 条记录。
- 角色弱字段问题分片数为 0。
- 明显伪角色残留数为 0。
- 完整 zip 数据包已通过压缩包完整性检查。

## 后续更新数据

如需替换数据，保持文件名不变即可：

1. 更新 `data/opera_basic.json`、`data/opera_roles.json`、`data/opera_relations.json`、`data/opera_storyline.json`、`data/opera_themes.json`。
2. 同步更新 `data/summary.json` 和 `data/operas_compact.json`。
3. 重新打包 `data/cleaned_opera_data_opera_zip_llm_primary.zip`。
4. 本地启动静态服务确认页面能正常读取数据。
5. 提交并推送到 `main`。
