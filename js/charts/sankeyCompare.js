(function(){
/* =========================================
   sankeyCompare.js — 角色行当演化
   左侧桑基图 + 右上饼图 + 右下堆叠面积图
   全部使用统一主题
========================================= */

let sankeyInstance = null
let pieInstance = null
let trendInstance = null

function renderSankeyCompare (dynasty = '全部') {
  renderSankey(dynasty)
  renderPie(dynasty)
  renderTrend()
}

/* ===== 左侧桑基图 ===== */
function renderSankey (dynasty) {
  const dom = document.getElementById('sankeyCompare')
  if (!dom) return
  if (sankeyInstance) { sankeyInstance.dispose(); sankeyInstance = null }
  sankeyInstance = echarts.init(dom)
  const data = getSankeyData(dynasty)
  if (!data || !data.nodes.length) { sankeyInstance.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无数据') }); return }
  const nodes = data.nodes.map(n => {
    const prefix = (n.name || '').split(':')[0]
    var warmColors = { '性别':'#A7372F','年龄':'#C9703A','身份':'#C9852A','性格':'#B57947','表演':'#A67B3E','行当':'#8F5A3A' }
    const color = warmColors[prefix] || FALLBACK
    return { ...n, itemStyle: { color, borderColor: 'rgba(255,220,180,0.3)', borderWidth: 2, shadowBlur: 10, shadowColor: 'rgba(200,130,60,0.2)' } }
  })
  var sankeyLinks = data.links
  var nodeValueMap = {}
  sankeyLinks.forEach(function(l) {
    nodeValueMap[l.source] = (nodeValueMap[l.source] || 0) + l.value
    nodeValueMap[l.target] = (nodeValueMap[l.target] || 0) + l.value
  })
  sankeyInstance.setOption({
    backgroundColor: 'transparent',
    animationDuration: 800,
    animationDurationUpdate: 300,
    textStyle: { fontFamily: FONT_BODY },
    tooltip: goldenTooltip(function(p) {
      if (p.dataType === 'edge') return '<div style="font-weight:bold;color:#ffd27f;font-family:' + FONT_DISPLAY + ';">' + p.data.source + ' → ' + p.data.target + '</div><div style="margin-top:6px;color:#f5e6c8;">数量：' + p.data.value + '</div>'
      var val = nodeValueMap[p.name] || 0
      var label = (p.name || '').replace(/^(性别|年龄|身份|性格|表演|行当):/, '')
      return '<div style="font-weight:bold;color:#ffd27f;font-family:' + FONT_DISPLAY + ';">' + label + '</div><div style="margin-top:6px;color:#f5e6c8;font-size:12px;">关联角色量：<span style="font-weight:bold;color:#fff7e6;">' + val + '</span></div>'
    }, { trigger: 'item', triggerOn: 'mousemove' }),
    series: [{
      type: 'sankey', layout: 'none', left: 30, right: 50, top: 20, bottom: 20,
      nodeWidth: 48, nodeGap: 10, draggable: true, layoutIterations: 20, nodeAlign: 'justify',
      label: { position: 'inside', color: '#fff7e6', fontSize: 14, textBorderColor: 'rgba(0,0,0,0.6)', textBorderWidth: 1, fontFamily: FONT_DISPLAY, fontWeight:'bold', formatter: p => p.name.replace(/^(性别|年龄|身份|性格|表演|行当):/, '') },
      lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.35 },
      emphasis: { focus: 'adjacency', lineStyle: { opacity: 0.7 } },
      data: nodes, links: data.links
    }]
  })
  bindResize(sankeyInstance)
}

/* ===== 右上饼图 ===== */
function renderPie (dynasty) {
  const dom = document.getElementById('sankeyStats')
  if (!dom) return
  if (pieInstance) { pieInstance.dispose(); pieInstance = null }
  pieInstance = echarts.init(dom)
  const raw = getRoleTypeByDynasty(dynasty)
  const entries = Object.entries(raw).sort((a, b) => b[1] - a[1]).filter(([name]) => name !== '旦')
  if (!entries.length) { pieInstance.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无数据') }); return }
  const total = entries.reduce((s, [, v]) => s + v, 0)
  pieInstance.setOption({
    backgroundColor: 'transparent',
    animationDuration: 800,
    animationDurationUpdate: 300,
    textStyle: { fontFamily: FONT_DISPLAY },
    legend: { orient: 'horizontal', top: 0, textStyle: { color: '#F5EFE3', fontSize: 10 } },
    tooltip: goldenTooltip(p => `<div style="font-weight:bold;color:#ffd27f;font-family:${FONT_DISPLAY};margin-bottom:4px;">${p.name}</div><div style="color:#f5e6c8;line-height:1.8;">数量：${p.value} 人<br/>占比：${((p.value / total) * 100).toFixed(1)}%</div>`, { trigger: 'item' }),
    series: [{
      type: 'pie', center: ['50%', '50%'], radius: ['15%', '72%'],
      data: entries.map(([name, val]) => ({ name, value: val, itemStyle: { color: ROLE_COLORS[name] || FALLBACK } })),
      label: { color: '#F5EFE3', fontSize: 10, fontFamily: FONT_BODY, formatter: p => `${p.name}\n${((p.value / total) * 100).toFixed(1)}%` },
      labelLine: { lineStyle: { color: 'rgba(196,168,130,.3)' } },
      emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(255,200,100,0.35)' }, label: { fontSize: 12, fontWeight: 'bold', color: '#ffd27f' } }
    }]
  })
  bindResize(pieInstance)
}

/* ===== 右下堆叠面积图 ===== */
function renderTrend () {
  const dom = document.getElementById('sankeyTrend')
  if (!dom) return
  if (trendInstance) { trendInstance.dispose(); trendInstance = null }
  trendInstance = echarts.init(dom)

  const { timeline, types: allTypes, data: rawData } = getRoleTypeByAllDynasties()
  const types = allTypes.filter(t => t !== '旦')
  if (!timeline.length || !types.length) { trendInstance.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无数据') }); return }

  /* 重新计算去掉旦后的占比 */
  const data = {}
  timeline.forEach(t => {
    data[t] = {}
    const totalNoDan = types.reduce((s, type) => s + (rawData[t][type] || 0), 0) || 1
    types.forEach(type => {
      data[t][type] = +((rawData[t][type] || 0) / totalNoDan * 100).toFixed(1)
    })
  })

  trendInstance.setOption({
    backgroundColor: 'transparent',
    animationDuration: 800,
    animationDurationUpdate: 300,
    textStyle: { fontFamily: FONT_BODY },
    tooltip: goldenTooltip(function (params) {
      const first = Array.isArray(params) ? params[0] : params
      let html = `<div style="font-weight:bold;color:#ffd27f;font-family:${FONT_DISPLAY};margin-bottom:4px;">${first.axisValue}</div>`
      const items = Array.isArray(params) ? params : [params]
      items.forEach(p => {
        html += `<div style="display:flex;justify-content:space-between;gap:20px;line-height:1.6;"><span>${p.marker} ${p.seriesName}</span><span style="font-weight:bold;">${p.value}%</span></div>`
      })
      return html
    }, { trigger: 'axis' }),
    legend: {
      type: 'scroll', top: 2, right: 0,
      textStyle: { color: COLORS.legendText, fontSize: 13 },
      pageTextStyle: { color: COLORS.legendText, fontSize: 11 },
      itemWidth: 14, itemHeight: 12, itemGap: 8
    },
    grid: { left: 40, right: 10, top: 35, bottom: 22 },
    xAxis: {
      type: 'category',
      data: timeline,
      axisLine: AXIS_LINE,
      axisLabel: { color: COLORS.axisLabel, fontSize: 10, interval: 0, rotate: 20 },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { color: '#F5EFE3', fontSize: 9, formatter: '{value}%' },
      splitLine: SPLIT_LINE,
      axisLine: { show: false }
    },
    series: types.map((type) => ({
      name: type,
      type: 'line',
      stack: '总量',
      smooth: true,
      symbol: 'none',
      areaStyle: { opacity: 0.72 },
      lineStyle: { width: 1.5 },
      emphasis: { focus: 'series' },
      data: timeline.map(t => data[t][type] || 0),
      itemStyle: { color: ROLE_COLORS[type] || FALLBACK }
    }))
  })
  bindResize(trendInstance)
}
window.renderSankeyCompare = renderSankeyCompare;
})();