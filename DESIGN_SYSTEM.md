# 「戏韵万象」京剧数据可视分析系统 — 设计规范

## 设计方向

**美学定位**：*匣中珍宝*（Treasure-in-a-Casket）
每一张图表面板如同一件漆器宝匣，深色底色上是精细的金色描边，内部图表则是宝匣中珍藏的明珠。整个系统是展开的"百宝格"，每个板块独立而统一。

**灵感来源**：故宫漆器 × 京剧戏台 × 宋人山水

## 设计规范

### 色彩系统

```
--color-primary:       #7a120d   朱砂红（主色）
--color-primary-light: #c0392b   亮朱砂
--color-primary-dark:  #4a0a08   深朱砂
--color-gold:          #c4a882   古金（描边/装饰）
--color-gold-bright:   #ffd27f   亮金（强调/hover）
--color-gold-pale:     #e6d3b7   淡金（文字）
--color-ink:           #0a0504   墨黑（背景）
--color-ink-light:     #120807   浅墨
--color-jade:          #4a7c59   玉色（开端）
--color-sapphire:      #2c5f7a   靛蓝（结局）
--color-amber:         #c08b3c   琥珀（发展/过渡）
--color-glass:         rgba(255,250,245,0.04)  玻璃底
--color-glass-hover:   rgba(255,250,245,0.08)  玻璃底hover
```

### 字体层级

| 用途 | 字体 | 大小 | 字重 | 字距 |
|------|------|------|------|------|
| 系统标题 | Ma Shan Zheng | 48-52px | 400 | 0.15em |
| 版块标题 | Ma Shan Zheng | 18-20px | 400 | 0.08em |
| 面板标题（带装饰点） | Ma Shan Zheng | 16-17px | 400 | 0.06em |
| 数据正文 | Noto Serif SC | 13-14px | 400/700 | normal |
| 轴标签/图例 | system sans-serif | 10-11px | 400 | normal |
| 小标签徽章 | system sans-serif | 10-11px | 500 | 0.02em |

### 面板系统

面板采用 **四层结构**（从外到内）：

1. **外框**：1px solid rgba(180,130,80,0.12) — 金色描边
2. **玻璃基底**：background: linear-gradient(145deg, rgba(20,10,8,0.75), rgba(35,16,12,0.68))
3. **内部辉光**：::before 伪元素，顶部径向渐变暖光
4. **浮动阴影**：box-shadow: 0 4px 24px rgba(0,0,0,0.28)

### 图表样式规则

所有 ECharts 图表统一：
- **背景**：transparent
- **轴标签颜色**：rgba(196,168,130,0.5)，字号 10-11px
- **轴线条**：rgba(196,168,130,0.15)，极细
- **分割线**：rgba(196,168,130,0.05)，几乎不可见
- **图例文字**：rgba(196,168,130,0.7)
- **柱状/折线**：丰富渐变，避免纯色

### 反模式（避免）

- ❌ 纯白背景 — 破坏沉浸感
- ❌ 科技蓝 — 与京剧主题冲突
- ❌ 过亮饱和度 — 伤眼且不高级
- ❌ 扁平无层次 — 没有深度
- ❌ emoji 作为图标 — 使用 ◈ ◆ 等装饰符号
- ❌ 过大的字重 — Noto Serif SC 400 已够

### 交互原则

- 所有可交互元素：cursor: pointer
- hover 反馈：轻微抬升（translateY(-2px)）+ 金色辉光放大
- 过渡时间：250ms ease（统一）
- 点击反馈：阴影加深
- 减少不必要的动画，保持克制

### 独特记忆点

> "朱砂为骨，古金为衣，墨色为底"
> Crimson as bone, aged gold as garment, ink as foundation
