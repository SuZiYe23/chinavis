(function(){
/* =========================================
   sankeyChart.js
   京剧角色关系桑基图
========================================= */


let sankeyChartInstance = null

function renderRoleSankeyChart (dynasty = '全部') {
  const chartDom = document.getElementById('roleSankeyChart')
  if (!chartDom) { console.error('未找到 roleSankeyChart DOM'); return }
  if (sankeyChartInstance) sankeyChartInstance.dispose()
  sankeyChartInstance = echarts.init(chartDom)

  const sankeyData = getSankeyData(dynasty)
  if (!sankeyData || !Array.isArray(sankeyData.nodes) || !Array.isArray(sankeyData.links) || sankeyData.nodes.length === 0 || sankeyData.links.length === 0) {
    sankeyChartInstance.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无桑基图数据') })
    return
  }

  const nodes = sankeyData.nodes.map(node => {
    const name = node.name || ''
    const prefix = name.split(':')[0]
    const color = SANKEY_LAYER_COLORS[prefix] || FALLBACK
    return { ...node, itemStyle: { color, borderWidth: 2, borderColor: 'rgba(255,255,255,0.28)', shadowBlur: 18, shadowColor: 'rgba(0,0,0,0.35)', shadowOffsetY: 4 } }
  })

  const links = sankeyData.links.filter(link => link && link.source && link.target && typeof link.value === 'number' && link.value > 0)
  if (nodes.length === 0 || links.length === 0) return

  /* 计算每个节点的关联量（入量+出量） */
  var nodeValueMap = {}
  links.forEach(function(l) {
    nodeValueMap[l.source] = (nodeValueMap[l.source] || 0) + l.value
    nodeValueMap[l.target] = (nodeValueMap[l.target] || 0) + l.value
  })

  sankeyChartInstance.setOption({
    backgroundColor: 'transparent',
    textStyle: { fontFamily: FONT_DISPLAY },
    animationDuration: 1800,
    animationEasing: 'cubicOut',
    tooltip: goldenTooltip(function(params) {
      if (params.dataType === 'edge') return '<div style="font-size:16px;font-weight:bold;margin-bottom:8px;color:#ffd27f;">数据流向</div><div style="line-height:1.8;font-size:14px;">' + params.data.source + ' → ' + params.data.target + '</div><div style="margin-top:10px;font-size:18px;font-weight:bold;color:#fff7d6;">数量：' + params.data.value + '</div>'
      var val = nodeValueMap[params.name] || 0
      var label = (params.name || '').replace(/^(性别|年龄|身份|性格|表演|行当):/, '')
      return '<div style="font-size:16px;font-weight:bold;color:#ffd27f;">' + label + '</div><div style="margin-top:8px;font-size:14px;color:#f2d9ba;">关联角色量：<span style="font-weight:bold;color:#fff7d6;">' + val + '</span></div>'
    }, { trigger: 'item', triggerOn: 'mousemove' }),
    series: [{
      type: 'sankey', orient: 'horizontal', left: '6%', right: '6%', top: '6%', bottom: '6%',
      nodeAlign: 'justify', draggable: true, layoutIterations: 32, nodeWidth: 34, nodeGap: 16,
      emphasis: { focus: 'adjacency', itemStyle: { shadowBlur: 25, shadowColor: 'rgba(255,215,120,0.55)' }, lineStyle: { opacity: 1 } },
      data: nodes, links,
      lineStyle: { color: 'source', curveness: 0.42, opacity: 0.72 },
      label: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', position: 'inside', textShadowBlur: 4, textShadowColor: 'rgba(0,0,0,0.8)', overflow: 'truncate', formatter: p => (p.name || '').replace(/^(性别|年龄|身份|性格|表演|行当):/, '') }
    }]
  })

  bindResize(sankeyChartInstance)
}
window.renderRoleSankeyChart = renderRoleSankeyChart;
})();