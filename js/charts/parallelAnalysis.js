(function(){
/* =========================================
   parallelAnalysis.js — 平行坐标
========================================= */

let instance = null
let cachedData = null

function computeParallelData () {
  if (cachedData) return cachedData
  const operas = DataStore.operaCompact || []
  const data = []
  operas.forEach(opera => {
    try {
      const name = opera.opera_name, oType = normalizeType(opera.opera_type)
      const story = getStorylineByOpera(name)
      const roles = getRolesFromRolesFile(name)
      const relations = getRelationsByOpera(name)
      const themes = getThemesByOpera(name)
      if (!story || !Array.isArray(story.events) || story.events.length < 1) return
      const events = story.events, n = events.length
      const roleCount = Math.min(30, roles.length || 1)
      let themeKeywordCount = 0
      themes.forEach(t => {
        if (t.theme_keywords) themeKeywordCount += t.theme_keywords.length
        else if (t.theme_distribution) themeKeywordCount += t.theme_distribution.length
      })
      const avgConflict = n > 0 ? events.reduce((s, e) => s + (e.conflict_level || 0), 0) / n : 0
      const avgEmotion = n > 0 ? events.reduce((s, e) => s + (e.emotion_value || 0), 0) / n : 0
      const emotionVar = n > 1 ? Math.sqrt(events.reduce((s, e) => s + Math.pow((e.emotion_value || 0) - avgEmotion, 2), 0) / n) : 0
      let totalLinks = 0
      relations.forEach(r => { if (r.links) totalLinks += r.links.length })
      const relationCentrality = totalLinks > 0 ? Math.min(10, totalLinks / roleCount) : 0
      const firstVal = events[0]?.emotion_value || 0, lastVal = events[n - 1]?.emotion_value || 0
      const narrativeRhythm = n > 1 ? Math.abs(lastVal - firstVal) / Math.max(1, n) : 0
      data.push({ value: [roleCount, themeKeywordCount, avgConflict, avgEmotion + emotionVar * 0.3, relationCentrality, narrativeRhythm], name, operaType: oType })
    } catch (e) { /* skip bad entry */ }
  })
  cachedData = data
  return data
}

function renderParallelAnalysis () {
  const dom = document.getElementById('parallelAnalysis')
  if (!dom) return
  if (instance) { instance.dispose(); instance = null }
  try {
    instance = echarts.init(dom)
  } catch(e) { return }
  const data = computeParallelData()
  if (!data.length) { instance.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无数据') }); return }

  const allTypes = [...new Set(data.map(d => d.operaType))]
  const typeColorMap = {}
  allTypes.forEach((t, i) => { typeColorMap[t] = SERIES_COLORS[i % SERIES_COLORS.length] })

  const parallelAxis = [
    { dim: 0, name: '角色复杂度', nameTextStyle: { color: COLORS.text, fontSize: 11 }, axisLabel: { color: COLORS.textDim, fontSize: 10 } },
    { dim: 1, name: '主题密度', nameTextStyle: { color: COLORS.text, fontSize: 11 }, axisLabel: { color: COLORS.textDim, fontSize: 10 } },
    { dim: 2, name: '冲突强度', nameTextStyle: { color: COLORS.text, fontSize: 11 }, axisLabel: { color: COLORS.textDim, fontSize: 10 } },
    { dim: 3, name: '情绪波动', nameTextStyle: { color: COLORS.text, fontSize: 11 }, axisLabel: { color: COLORS.textDim, fontSize: 10 } },
    { dim: 4, name: '关系中心性', nameTextStyle: { color: COLORS.text, fontSize: 11 }, axisLabel: { color: COLORS.textDim, fontSize: 10 } },
    { dim: 5, name: '叙事节奏', nameTextStyle: { color: COLORS.text, fontSize: 11 }, axisLabel: { color: COLORS.textDim, fontSize: 10 } }
  ]

  instance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: COLORS.tooltipBg,
      borderColor: COLORS.tooltipBorder,
      borderWidth: 2,
      padding: [14, 16, 12, 16],
      textStyle: { color: COLORS.textLight, fontSize: 13 },
      extraCssText: 'border-radius:6px;box-shadow:0 6px 24px rgba(0,0,0,.4);',
      formatter: function (params) {
        const p = Array.isArray(params) ? params[0] : params
        if (!p) return ''
        const dims = ['角色复杂度','主题密度','冲突强度','情绪波动','关系中心性','叙事节奏']
        return `<div style="border-top:3px solid #c9852a;margin:-14px -16px 10px -16px;padding:8px 16px 4px;background:rgba(201,133,42,.08);font-size:11px;color:#c9852a;letter-spacing:1px;">戏韵万象</div>
          <div style="font-weight:bold;color:#ffd27f;font-family:${FONT_DISPLAY};font-size:15px;margin-bottom:4px;">${p.name || ''}</div>
          <div style="color:#f5e6c8;line-height:1.8;font-size:12px;">
          ${p.value ? dims.map((d, i) => `${d}：${Number(p.value[i]).toFixed(i > 3 ? 2 : 1)}`).join('<br/>') : ''}</div>`
      }
    },
    parallelAxis: parallelAxis,
    parallel: {
      left: '8%', right: '12%', top: 40, bottom: 50
    },
    series: [{
      type: 'parallel',
      lineStyle: { width: 1.5, opacity: 0.4 },
      emphasis: { lineStyle: { width: 4, opacity: 0.85 } },
      data: data.map(d => ({ value: d.value, lineStyle: { color: typeColorMap[d.operaType] || FALLBACK } }))
    }]
  })
  bindResize(instance)
}
window.renderParallelAnalysis = renderParallelAnalysis;
})();