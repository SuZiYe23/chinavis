(function(){
/* =========================================
   narrativeCluster.js — 叙事模式聚类
========================================= */

let instance = null
let cachedClusterData = null

function computeClusterFeatures () {
  if (cachedClusterData) return cachedClusterData
  const operas = DataStore.operaCompact || []
  const scatterData = []
  operas.forEach(opera => {
    const story = getStorylineByOpera(opera.opera_name)
    if (!story || !Array.isArray(story.events) || story.events.length < 2) return
    const events = story.events, n = events.length
    const avgConflict = events.reduce((s, e) => s + (e.conflict_level || 0), 0) / n
    const avgEmotion = events.reduce((s, e) => s + (e.emotion_value || 0), 0) / n
    const emotionVar = Math.sqrt(events.reduce((s, e) => s + Math.pow((e.emotion_value || 0) - avgEmotion, 2), 0) / n)
    const conflictVar = Math.sqrt(events.reduce((s, e) => s + Math.pow((e.conflict_level || 0) - avgConflict, 2), 0) / n)
    const conflictRange = Math.max(...events.map(e => e.conflict_level || 0)) - Math.min(...events.map(e => e.conflict_level || 0))
    const roleCount = (opera.roles ? opera.roles.length : 0) || (opera.main_roles ? opera.main_roles.length : 0) || 1
    scatterData.push({ value: [avgConflict, avgEmotion, Math.max(8, Math.sqrt(roleCount) * 6)], name: opera.opera_name, operaType: opera.opera_type || '未知', avgConflict, avgEmotion, emotionVar, conflictVar, conflictRange })
  })
  if (!scatterData.length) { cachedClusterData = []; return cachedClusterData }
  const allConflict = scatterData.map(d => d.avgConflict), allEmotion = scatterData.map(d => d.avgEmotion)
  const avgAllConflict = allConflict.reduce((s, v) => s + v, 0) / allConflict.length
  const avgAllEmotion = allEmotion.reduce((s, v) => s + v, 0) / allEmotion.length
  scatterData.forEach(d => {
    const c = d.avgConflict, e = d.avgEmotion, ev = d.emotionVar, cr = d.conflictRange
    if (c > avgAllConflict * 1.15 && e > avgAllEmotion * 1.1 && cr > 30) d.cluster = '冲突激烈型'
    else if (ev > 15 && e > avgAllEmotion) d.cluster = '情绪驱动型'
    else if (c < avgAllConflict * 0.85 && e < avgAllEmotion * 0.9) d.cluster = '平稳型'
    else if (c > avgAllConflict * 1.1 && cr < 25) d.cluster = '权谋推进型'
    else d.cluster = '家庭伦理型'
  })
  cachedClusterData = scatterData
  return cachedClusterData
}

function renderNarrativeCluster (dynasty = '全部') {
  const dom = document.getElementById('narrativeCluster')
  if (!dom) return
  if (instance) { instance.dispose(); instance = null }
  instance = echarts.init(dom)
  const scatterData = computeClusterFeatures()
  if (!scatterData.length) { instance.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无数据') }); return }

  const types = [...new Set(scatterData.map(d => d.cluster))]
  const series = types.map(t => ({
    name: t, type: 'scatter',
    symbolSize: d => d[2] || 20,
    itemStyle: { color: CLUSTER_COLORS[t] || '#8a7a6a', shadowBlur: 6, shadowColor: 'rgba(255,200,100,0.15)' },
    emphasis: { label: { show: true, color: '#ffd27f', fontSize: 13, fontFamily: FONT_DISPLAY } },
    data: scatterData.filter(d => d.cluster === t).map(d => ({ value: d.value, name: d.name, operaType: d.operaType }))
  }))

  types.forEach(t => {
    const pts = scatterData.filter(d => d.cluster === t).map(d => d.value)
    if (pts.length < 2) return
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
    const radius = Math.sqrt(pts.reduce((s, p) => s + Math.pow(p[0] - cx, 2) + Math.pow(p[1] - cy, 2), 0) / pts.length) * 1.5
    if (radius > 3) {
      series.push({ name: t, type: 'scatter', symbolSize: d => d[2], data: [], markArea: { silent: true, data: [[{ xAxis: cx - radius, yAxis: cy - radius, itemStyle: { color: CLUSTER_COLORS[t], opacity: 0.04, borderColor: CLUSTER_COLORS[t], borderWidth: 1, borderType: 'dashed', borderRadius: 4 } }, { xAxis: cx + radius, yAxis: cy + radius }]] } })
    }
  })

  const allX = scatterData.map(d => d.avgConflict), allY = scatterData.map(d => d.avgEmotion)
  const minX = Math.max(0, Math.min(...allX) - 5), maxX = Math.min(100, Math.max(...allX) + 5)
  const minY = Math.max(0, Math.min(...allY) - 5), maxY = Math.min(100, Math.max(...allY) + 5)

  instance.setOption({
    backgroundColor: 'transparent',
    tooltip: goldenTooltip(p => `<div style="font-weight:bold;color:#ffd27f;font-family:${FONT_DISPLAY};font-size:14px;">${p.name}</div><div style="color:#f5e6c8;font-size:12px;line-height:1.6;">冲突强度：${Number(p.value[0]).toFixed(1)}<br/>情绪波动：${Number(p.value[1]).toFixed(1)}<br/>聚类：${p.seriesName}</div>`),
    legend: { type: 'scroll', top: 28, left: 'center', textStyle: { color: COLORS.legendText, fontSize: 11 }, pageTextStyle: { color: COLORS.legendText } },
    grid: { left: 55, right: 30, top: 60, bottom: 35 },
    xAxis: { type: 'value', name: '冲突强度', nameTextStyle: { color: COLORS.text, fontSize: 11 }, min: Math.floor(minX), max: Math.ceil(maxX), axisLine: { lineStyle: { color: COLORS.axisLine } }, splitLine: { lineStyle: { color: COLORS.splitLine } }, axisLabel: { color: COLORS.textDim, fontSize: 11 } },
    yAxis: { type: 'value', name: '情绪波动', nameTextStyle: { color: COLORS.text, fontSize: 11 }, min: Math.floor(minY), max: Math.ceil(maxY), axisLine: { lineStyle: { color: COLORS.axisLine } }, splitLine: { lineStyle: { color: COLORS.splitLine } }, axisLabel: { color: COLORS.textDim, fontSize: 11 } },
    series
  })
  bindResize(instance)
}
window.renderNarrativeCluster = renderNarrativeCluster;
})();