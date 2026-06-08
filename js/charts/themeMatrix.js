(function(){
/* =========================================
   themeMatrix.js — 主题-关系关联矩阵
========================================= */

let instance = null
let cachedMatrix = null
let cachedThemes = null
let cachedRelations = null

function buildIndex () {
  if (cachedMatrix) return
  const themeFreq = {}
  DataStore.operaThemes.forEach(item => {
    (item.theme_keywords || []).forEach(k => { if (k.word) themeFreq[k.word] = (themeFreq[k.word] || 0) + k.value })
  })
  const relFreq = {}
  DataStore.operaRelations.forEach(opera => {
    (opera.links || []).forEach(l => {
      if (l.relation) { l.relation.split(/[\/,、，]/).forEach(p => { const t = p.trim(); if (t) relFreq[t] = (relFreq[t] || 0) + (l.interaction_count || 1) }) }
    })
  })

  cachedThemes = Object.entries(themeFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0])
  cachedRelations = Object.entries(relFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0])
  if (cachedThemes.length < 3) cachedThemes = ['忠义','权谋','战争','爱情','家国','伦理','恩怨','侠义','复仇','忠勇']
  if (cachedRelations.length < 3) cachedRelations = ['君臣','父子','对敌','夫妻','主仆','兄弟','师生','朋友','将帅','仇敌']

  const operaThemeSet = {}, operaRelSet = {}
  DataStore.operaThemes.forEach(item => {
    const name = item.opera_name; if (!name) return
    if (!operaThemeSet[name]) operaThemeSet[name] = new Set()
    ;(item.theme_keywords || []).forEach(k => { if (k.word) { cachedThemes.forEach(t => { if (k.word.includes(t)) operaThemeSet[name].add(t) }) } })
  })
  DataStore.operaRelations.forEach(opera => {
    const name = opera.opera_name; if (!name) return
    if (!operaRelSet[name]) operaRelSet[name] = new Set()
    ;(opera.links || []).forEach(l => { if (l.relation) { cachedRelations.forEach(r => { if (l.relation.includes(r)) operaRelSet[name].add(r) }) } })
  })

  const allOperaNames = new Set([...Object.keys(operaThemeSet), ...Object.keys(operaRelSet)])
  const operaList = [...allOperaNames]
  let maxCooc = 0
  const matrix = cachedThemes.map(theme => {
    return cachedRelations.map(rel => {
      let cooc = 0
      for (let i = 0; i < operaList.length; i++) {
        const name = operaList[i]
        if (operaThemeSet[name]?.has(theme) && operaRelSet[name]?.has(rel)) cooc++
      }
      if (cooc > maxCooc) maxCooc = cooc
      return cooc
    })
  })
  if (maxCooc === 0) maxCooc = 1
  cachedMatrix = { raw: matrix, norm: matrix.map(row => row.map(v => Math.round((v / maxCooc) * 100))), themes: cachedThemes, relations: cachedRelations }
}

function renderThemeMatrix (dynasty = '全部') {
  const dom = document.getElementById('themeMatrix')
  if (!dom) return
  if (instance) { instance.dispose(); instance = null }
  instance = echarts.init(dom)
  buildIndex()
  if (!cachedMatrix) { instance.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无数据') }); return }
  const { raw, norm, themes, relations } = cachedMatrix
  instance.setOption({
    backgroundColor: 'transparent',
    tooltip: goldenTooltip(p => `<div style="font-weight:bold;color:#ffd27f;font-family:${FONT_DISPLAY};margin-bottom:4px;">${themes[p.value[0]]} × ${relations[p.value[1]]}</div><div style="color:#f5e6c8;font-size:12px;">共现剧次数：${raw[p.value[0]][p.value[1]]}<br/>耦合指数：${p.value[2]}/100</div>`),
    grid: { left: 100, right: 65, top: 15, bottom: 80 },
    xAxis: { type: 'category', data: relations, axisLabel: { rotate: 45, color: COLORS.text, fontSize: 11, interval: 0, margin: 12 }, axisLine: { lineStyle: { color: COLORS.axisLine } }, splitLine: { show: false } },
    yAxis: { type: 'category', data: themes, axisLabel: { color: COLORS.text, fontSize: 11 }, axisLine: { lineStyle: { color: COLORS.axisLine } }, splitLine: { show: false } },
    visualMap: {
      min: 0, max: 100, calculable: true,
      show: true, orient: 'vertical', right: 0, top: 'center',
      itemWidth: 12, itemHeight: 140,
      inRange: {
        color: ['#f5ead0', '#e8c88a', '#dca055', '#c9703a', '#b23a2a', '#7a1a10']
      },
      textStyle: { color: COLORS.text, fontSize: 10 },
      formatter: v => v + '%'
    },
    series: [{ type: 'heatmap', data: norm.flatMap((row, i) => row.map((v, j) => [j, i, v])), label: { show: false }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(255,200,100,0.5)' } } }]
  })
  bindResize(instance)
}
window.renderThemeMatrix = renderThemeMatrix;
})();