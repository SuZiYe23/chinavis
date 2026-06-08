(function(){
/* =========================================
   relationNetwork.js — 角色关系网络
   环形布局 + 点大小体现台词/场次 + 国风风格
========================================= */

let instance = null
let currentOperaList = []
let currentIndex = 0
let _netDynasty = '全部'

function renderCurrentOpera () {
  const label = document.getElementById('currentOperaLabel')
  if (!currentOperaList.length) {
    const dom = document.getElementById('relationNetwork')
    if (dom) {
      if (instance) { instance.dispose(); instance = null }
      instance = echarts.init(dom)
      instance.setOption({ backgroundColor: 'transparent', ...emptyTitle('请选择剧种') })
    }
    updateNetworkMetrics([])
    if (label) label.textContent = '—'
    return
  }

  const operaName = currentOperaList[currentIndex]
  if (label) label.textContent = operaName

  const dom = document.getElementById('relationNetwork')
  if (!dom) return
  if (instance) { instance.dispose(); instance = null }
  instance = echarts.init(dom)

  const raw = getRelationsByOpera(operaName)
  const rolesFromFile = getRolesFromRolesFile(operaName)
  const roleTypeMap = {}
  rolesFromFile.forEach(r => { roleTypeMap[r.role_name] = r.role_type })

  if (!Array.isArray(raw) || !raw.length) {
    instance.setOption({ backgroundColor: 'transparent', ...emptyTitle('该剧目暂无关系数据') })
    updateNetworkMetrics([])
    return
  }

  const nodeMap = {}, nodes = [], links = []
  const linkSet = new Set()
  let totalDeg = 0

  /* 找最大台词场次用于归一化点尺寸 */
  let maxActivity = 0
  const activityMap = {}

  raw.forEach(item => {
    if (!item || !Array.isArray(item.nodes) || !Array.isArray(item.links)) return
    item.nodes.forEach(n => {
      const id = n.id || n.name || ''
      if (!id || nodeMap[id]) return
      const activity = (n.dialogue_count || 0) + (n.scene_count || 0)
      activityMap[id] = activity
      if (activity > maxActivity) maxActivity = activity
    })
  })

  if (maxActivity === 0) maxActivity = 1

  raw.forEach(item => {
    if (!item || !Array.isArray(item.nodes) || !Array.isArray(item.links)) return
    item.nodes.forEach(n => {
      const id = n.id || n.name || ''
      if (!id || nodeMap[id]) return
      nodeMap[id] = true
      const rt = n.role_type || roleTypeMap[id] || '其他'
      const activity = activityMap[id] || 1
      const size = Math.max(14, Math.min(36, 10 + (activity / maxActivity) * 26))
      nodes.push({
        name: id, role_type: rt, importance: n.importance || 80,
        dialogue_count: n.dialogue_count || 0, scene_count: n.scene_count || 0,
        symbolSize: size,
        itemStyle: {
          color: ROLE_COLORS[rt] || FALLBACK,
          borderColor: 'rgba(255,220,180,.5)',
          borderWidth: 2.5,
          shadowBlur: 12,
          shadowColor: 'rgba(255,200,100,0.25)'
        }
      })
    })
    item.links.forEach(l => {
      if (!l || !l.source || !l.target) return
      const key = [l.source, l.target].sort().join('::')
      if (linkSet.has(key)) return
      linkSet.add(key)
      totalDeg += 2
      const emo = l.emotion || ''
      let ec = '#8a7a6a'
      if (emo.includes('对峙')||emo.includes('冲突')||emo.includes('紧张')) ec = '#c0392b'
      else if (emo.includes('信任')||emo.includes('忠诚')) ec = '#27ae60'
      else if (emo.includes('亲情')||emo.includes('爱')) ec = '#c9607a'
      else if (emo.includes('疑虑')||emo.includes('猜忌')) ec = '#8e44ad'
      links.push({
        source: l.source, target: l.target, relation: l.relation, emotion: emo,
        interaction_count: l.interaction_count || 1,
        lineStyle: { width: Math.min(6, (l.interaction_count || 1) * 1.2), color: ec, curveness: 0.15, opacity: 1 }
      })
    })
  })

  const nCount = nodes.length
  const avgDeg = nCount > 0 ? (totalDeg / nCount).toFixed(2) : 0
  updateNetworkMetrics([
    { label: '角色数', value: nCount },
    { label: '关系数', value: links.length },
    { label: '平均度', value: avgDeg },
    { label: '剧种', value: normalizeType(DataStore.operaCompact?.find(o => o.opera_name === operaName)?.opera_type) }
  ])

  /* 计算四个指标并渲染右侧图表 */
  renderRightCharts(nodes, links, raw)

  instance.setOption({
    backgroundColor: 'transparent',
    animationDuration: 800,
    animationDurationUpdate: 300,
    tooltip: goldenTooltip(p => {
      if (p.dataType === 'node') {
        const d = p.data
        return `<div style="font-weight:bold;color:#ffd27f;font-size:16px;font-family:${FONT_DISPLAY};">${d.name}</div>
          <div style="color:#f5e6c8;line-height:1.8;">
          行当：${d.role_type}<br/>
          台词：${d.dialogue_count} 句<br/>
          场次：${d.scene_count} 场<br/>
          <span style="color:#b8a088;">综合活跃度：${(d.dialogue_count||0)+(d.scene_count||0)}</span></div>`
      } else {
        const d = p.data
        return `<div style="font-weight:bold;color:#ffd27f;font-family:${FONT_DISPLAY};">${d.source} → ${d.target}</div>
          <div style="color:#f5e6c8;line-height:1.8;">
          关系：${d.relation || '—'}<br/>
          情绪：${d.emotion || '—'}<br/>
          交互：${d.interaction_count} 次</div>`
      }
    }),
    series: [{
      type: 'graph', layout: 'circular', roam: true, draggable: true, focusNodeAdjacency: true,
      circular: { rotateLabel: true },
      label: {
        show: true,
        color: '#7a1f1f',
        fontSize: 11,
        fontFamily: FONT_BODY,
        fontWeight: 'bold'
      },
      lineStyle: { color: 'source', opacity: 0.8, curveness: 0.1 },
      emphasis: {
        focus: 'adjacency',
        lineStyle: { width: 3, opacity: 0.8 },
        itemStyle: { shadowBlur: 20, shadowColor: 'rgba(255,200,100,0.45)' }
      },
      data: nodes, links
    }]
  })
  bindResize(instance)
}

function renderRelationNetwork (operaType, dynasty) {
  if (operaType === undefined) operaType = '全部'
  if (dynasty === undefined) dynasty = '全部'
  _netDynasty = dynasty
  var operas = DataStore.operaCompact || []
  /* 先按朝代筛选 */
  if (dynasty !== '全部') {
    operas = operas.filter(function(o) { return isOperaInDynasty(o.dynasty, dynasty) })
  }
  if (operaType !== '全部') operas = operas.filter(function(o) { return normalizeType(o.opera_type) === operaType })
  currentOperaList = operas.filter(function(o) {
    var rel = getRelationsByOpera(o.opera_name)
    return Array.isArray(rel) && rel.length > 0
  }).map(function(o) { return o.opera_name })
  currentIndex = 0
  renderCurrentOpera()
}

function updateNetworkMetrics (items) {
  const el = document.getElementById('networkMetrics')
  if (!el) return
  if (!items.length) { el.innerHTML = '<div class="metric-empty">暂无数据</div>'; return }
  el.innerHTML = items.map(i => `<div class="metric-card"><div class="metric-value">${i.value}</div><div class="metric-label">${i.label}</div></div>`).join('')
}

/* ===== 右侧四维图表切换系统 ===== */
let _rightChart = null
let _currentDim = 'structure'

function renderRightCharts (nodes, links, rawData) {
  renderDim(_currentDim, nodes, links, rawData)
}

function renderDim (dim, nodes, links, rawData) {
  _currentDim = dim
  if (_rightChart) _rightChart.dispose()
  const dom = document.getElementById('nrChart')
  if (!dom) return
  _rightChart = echarts.init(dom)

  if (dim === 'structure') renderStructureView(_rightChart)
  else if (dim === 'role') renderRoleView(_rightChart)
  else if (dim === 'relation') renderRelationView(_rightChart)

}

/* 绑定 tab 切换 */
setTimeout(function () {
  document.querySelectorAll('.nr-tab').forEach(function (btn) {
    btn.onclick = function () {
      document.querySelectorAll('.nr-tab').forEach(function (b) { b.classList.remove('active') })
      btn.classList.add('active')
      var dim = btn.dataset.dim
      var raw = getRelationsByOpera(currentOperaList[currentIndex] || '')
      var roles = getRolesFromRolesFile(currentOperaList[currentIndex] || '')
      var roleTypeMap = {}
      roles.forEach(function (r) { roleTypeMap[r.role_name] = r.role_type })
      var nMap = {}, ns = [], ls = [], lSet = new Set()
      raw.forEach(function (item) {
        if (!item || !Array.isArray(item.nodes) || !Array.isArray(item.links)) return
        item.nodes.forEach(function (n) {
          var id = n.id || n.name || ''; if (!id || nMap[id]) return
          nMap[id] = true; var rt = n.role_type || roleTypeMap[id] || '其他'
          ns.push({ name: id, role_type: rt, importance: n.importance || 80, dialogue_count: n.dialogue_count || 0, scene_count: n.scene_count || 0 })
        })
        item.links.forEach(function (l) {
          if (!l || !l.source || !l.target) return; var key = [l.source, l.target].sort().join('::')
          if (lSet.has(key)) return; lSet.add(key)
          ls.push({ source: l.source, target: l.target, relation: l.relation, emotion: l.emotion || '', interaction_count: l.interaction_count || 1 })
        })
      })
      renderDim(dim, ns, ls, raw)
    }
  })
}, 100)

/* 1. 网络结构维度 — 雷达图（跨剧种对比，先算剧目再按剧种平均） */
function getOperaSetByDynasty (dynasty) {
  if (dynasty === '全部') return null
  var set = {}
  ;(DataStore.operaCompact || []).forEach(function(o) {
    if (isOperaInDynasty(o.dynasty, dynasty)) set[o.opera_name] = true
  })
  return set
}

function computeAllTypeMetrics () {
  var allOperas = DataStore.operaCompact || []
  var validOperas = getOperaSetByDynasty(_netDynasty)
  var typeMap = {}
  DataStore.operaRelations.forEach(function (item) {
    var name = item.opera_name || item.opera || ''
    if (!name) return
    if (validOperas && !validOperas[name]) return
    var opera = allOperas.find(function (o) { return o.opera_name === name })
    var type = normalizeType(opera && opera.opera_type)
    if (!typeMap[type]) typeMap[type] = { avgDegs: [], densities: [], comps: [], edgeCounts: [] }
    var links = item.links || []; var nodes = item.nodes || []
    if (!links.length || !nodes.length) return
    var n = nodes.length; var m = links.length
    var degMap = {}
    links.forEach(function (l) { degMap[l.source] = (degMap[l.source] || 0) + 1; degMap[l.target] = (degMap[l.target] || 0) + 1 })
    var degs = Object.values(degMap)
    var avgDeg = degs.length > 0 ? degs.reduce(function (s, d) { return s + d }, 0) / degs.length : 0
    typeMap[type].avgDegs.push(avgDeg)
    typeMap[type].densities.push(n > 1 ? m / (n * (n - 1) / 2) : 0)
    typeMap[type].comps.push(n / Math.max(1, m / Math.max(1, n)))
    typeMap[type].edgeCounts.push(m)
  })
  return Object.entries(typeMap).filter(function (e) { return e[1].avgDegs.length > 0 }).sort(function (a, b) { return b[1].avgDegs.length - a[1].avgDegs.length }).map(function (e) {
    var d = e[1]
    return {
      type: e[0],
      avgDegree: +(d.avgDegs.reduce(function (s, v) { return s + v }, 0) / d.avgDegs.length).toFixed(1),
      avgDensity: +(d.densities.reduce(function (s, v) { return s + v }, 0) / d.densities.length * 100).toFixed(1),
      avgComponents: +(d.comps.reduce(function (s, v) { return s + v }, 0) / d.comps.length).toFixed(1),
      avgEdgeCount: +(d.edgeCounts.reduce(function (s, v) { return s + v }, 0) / d.edgeCounts.length).toFixed(1)
    }
  })
}

function renderStructureView (chart) {
  var metrics = computeAllTypeMetrics()
  if (!metrics.length) { chart.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无数据') }); return }
  var maxDeg = Math.max.apply(null, metrics.map(function (m) { return m.avgDegree }).concat([1]))
  var maxDen = Math.max.apply(null, metrics.map(function (m) { return m.avgDensity }).concat([0.1]))
  var maxCom = Math.max.apply(null, metrics.map(function (m) { return m.avgComponents }).concat([1]))
  var maxEdge = Math.max.apply(null, metrics.map(function (m) { return m.avgEdgeCount }).concat([1]))
  var indicator = [
    { name: '平均度', max: Math.ceil(maxDeg * 1.25) },
    { name: '关系密度', max: +(maxDen * 1.25).toFixed(1) },
    { name: '网络规模', max: Math.ceil(maxCom * 1.25) },
    { name: '边数均值', max: Math.ceil(maxEdge * 1.25) },
  ]
  var palette = ['#b23a2a', '#d4954a', '#4a8c6a', '#3d6f94', '#7a5599', '#c9607a', '#d9794a', '#4a8a8a', '#8a7a6a', '#b8967a']
  chart.setOption({
    backgroundColor: 'transparent', animationDuration: 800, animationDurationUpdate: 300, textStyle: { fontFamily: FONT_BODY },
    tooltip: { backgroundColor: JINGJU.tooltipBg, borderColor: JINGJU.tooltipBorder, borderWidth: 2, padding: [10, 14], textStyle: { color: '#ffd27f', fontSize: 12 }, extraCssText: 'border-radius:6px;box-shadow:0 6px 24px rgba(0,0,0,.4);', formatter: function (params) {
      if (!params || !params.value) return ''
      var h = '<div style="border-top:3px solid #c9852a;margin:-10px -14px 10px -14px;padding:8px 14px 4px;background:rgba(201,133,42,.08);font-size:11px;color:#c9852a;letter-spacing:1px;">戏韵万象</div><div style="font-weight:bold;color:#ffd27f;font-size:14px;font-family:' + FONT_DISPLAY + ';margin-bottom:4px;">' + params.name + '</div>'
      params.value.forEach(function (v, i) { h += '<div style="display:flex;justify-content:space-between;gap:20px;line-height:1.8;font-size:12px;"><span>' + indicator[i].name + '</span><span style="font-weight:bold;color:#ffd27f;">' + v + '</span></div>' })
      return h
    }},
    legend: { type: 'scroll', bottom: 0, left: 'center', textStyle: { color: COLORS.legendText, fontSize: 14 }, pageTextStyle: { color: COLORS.legendText }, itemWidth: 10, itemHeight: 8, itemGap: 6 },
    radar: { center: ['50%', '48%'], radius: '80%', indicator: indicator, name: { textStyle: { color: '#ffd27f', fontSize: 14 } }, splitArea: { areaStyle: { color: ['rgba(100,25,20,.45)', 'rgba(100,25,20,.35)'] } }, splitLine: { lineStyle: { color: 'rgba(255,220,180,.30)' } }, axisLine: { lineStyle: { color: 'rgba(255,220,180,.30)' } } },
    series: [{ type: 'radar', data: metrics.map(function (m, i) { return { name: m.type, value: [m.avgDegree, m.avgDensity, m.avgComponents, m.avgEdgeCount], lineStyle: { color: palette[i % palette.length], width: 3 }, areaStyle: { color: palette[i % palette.length], opacity: 0.2 }, itemStyle: { color: palette[i % palette.length] }, symbol: 'circle', symbolSize: 6 } }) }]
  })
  bindResize(chart)
}

/* 2. 角色维度 — 雷达图（跨剧种对比，先算剧目再按剧种平均） */
function computeRoleMetrics () {
  var allOperas = DataStore.operaCompact || []
  var validOperas = getOperaSetByDynasty(_netDynasty)
  var typeMap = {}
  DataStore.operaRelations.forEach(function (item) {
    var name = item.opera_name || item.opera || ''
    if (!name) return
    if (validOperas && !validOperas[name]) return
    var opera = allOperas.find(function (o) { return o.opera_name === name })
    var type = normalizeType(opera && opera.opera_type)
    if (!typeMap[type]) typeMap[type] = { corePcts: [], diversities: [], highPcts: [] }
    var nodes = item.nodes || []; var links = item.links || []
    if (!nodes.length || !links.length) return
    var n = nodes.length
    var roleTypes = new Set()
    nodes.forEach(function (nd) { if (nd.role_type) roleTypes.add(nd.role_type) })
    var degMap = {}
    links.forEach(function (l) { degMap[l.source] = (degMap[l.source] || 0) + 1; degMap[l.target] = (degMap[l.target] || 0) + 1 })
    var core = Object.values(degMap).filter(function (d) { return d >= 5 }).length
    typeMap[type].corePcts.push(n > 0 ? core / n * 100 : 0)
    typeMap[type].diversities.push(roleTypes.size)
    typeMap[type].highPcts.push(n > 0 ? nodes.filter(function (nd) { return (nd.importance || 50) >= 70 }).length / n * 100 : 0)
  })
  return Object.entries(typeMap).filter(function (e) { return e[1].corePcts.length > 0 }).sort(function (a, b) { return b[1].corePcts.length - a[1].corePcts.length }).map(function (e) {
    var d = e[1]
    return {
      type: e[0],
      corePct: +(d.corePcts.reduce(function (s, v) { return s + v }, 0) / d.corePcts.length).toFixed(1),
      diversity: +(d.diversities.reduce(function (s, v) { return s + v }, 0) / d.diversities.length).toFixed(1),
      highImpPct: +(d.highPcts.reduce(function (s, v) { return s + v }, 0) / d.highPcts.length).toFixed(1)
    }
  })
}

function renderRoleView (chart) {
  var metrics = computeRoleMetrics()
  if (!metrics.length) { chart.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无数据') }); return }
  var max1 = Math.max.apply(null, metrics.map(function (m) { return m.corePct }).concat([1]))
  var max2 = Math.max.apply(null, metrics.map(function (m) { return m.diversity }).concat([1]))
  var max3 = Math.max.apply(null, metrics.map(function (m) { return m.highImpPct }).concat([1]))
  var indicator = [
    { name: '核心角色比(%)', max: Math.ceil(max1 * 1.25) },
    { name: '行当丰富度', max: Math.ceil(max2 * 1.25) },
    { name: '高重要度(%)', max: Math.ceil(max3 * 1.25) },
  ]
  var palette = ['#b23a2a', '#d4954a', '#4a8c6a', '#3d6f94', '#7a5599', '#c9607a', '#d9794a', '#4a8a8a', '#8a7a6a', '#b8967a']
  chart.setOption({
    backgroundColor: 'transparent', animationDuration: 800, animationDurationUpdate: 300, textStyle: { fontFamily: FONT_BODY },
    tooltip: { backgroundColor: JINGJU.tooltipBg, borderColor: JINGJU.tooltipBorder, borderWidth: 2, padding: [10, 14], textStyle: { color: '#ffd27f', fontSize: 12 }, extraCssText: 'border-radius:6px;box-shadow:0 6px 24px rgba(0,0,0,.4);', formatter: function (params) {
      if (!params || !params.value) return ''
      var h = '<div style="border-top:3px solid #c9852a;margin:-10px -14px 10px -14px;padding:8px 14px 4px;background:rgba(201,133,42,.08);font-size:11px;color:#c9852a;letter-spacing:1px;">戏韵万象</div><div style="font-weight:bold;color:#ffd27f;font-size:14px;font-family:' + FONT_DISPLAY + ';margin-bottom:4px;">' + params.name + '</div>'
      params.value.forEach(function (v, i) { h += '<div style="display:flex;justify-content:space-between;gap:20px;line-height:1.8;font-size:12px;"><span>' + indicator[i].name + '</span><span style="font-weight:bold;color:#ffd27f;">' + v + '</span></div>' })
      return h
    }},
    legend: { type: 'scroll', bottom: 0, left: 'center', textStyle: { color: COLORS.legendText, fontSize: 14 }, pageTextStyle: { color: COLORS.legendText }, itemWidth: 10, itemHeight: 8, itemGap: 6 },
    radar: { center: ['50%', '48%'], radius: '80%', indicator: indicator, name: { textStyle: { color: '#ffd27f', fontSize: 14 } }, splitArea: { areaStyle: { color: ['rgba(100,25,20,.45)', 'rgba(100,25,20,.35)'] } }, splitLine: { lineStyle: { color: 'rgba(255,220,180,.30)' } }, axisLine: { lineStyle: { color: 'rgba(255,220,180,.30)' } } },
    series: [{ type: 'radar', data: metrics.map(function (m, i) { return { name: m.type, value: [m.corePct, m.diversity, m.highImpPct], lineStyle: { color: palette[i % palette.length], width: 3 }, areaStyle: { color: palette[i % palette.length], opacity: 0.2 }, itemStyle: { color: palette[i % palette.length] }, symbol: 'circle', symbolSize: 6 } }) }]
  })
  bindResize(chart)
}

/* 3. 关系维度 — 雷达图（跨剧种对比，先算剧目再按剧种平均） */
function computeRelationMetrics () {
  var allOperas = DataStore.operaCompact || []
  var validOperas = getOperaSetByDynasty(_netDynasty)
  var typeMap = {}
  DataStore.operaRelations.forEach(function (item) {
    var name = item.opera_name || item.opera || ''
    if (!name) return
    if (validOperas && !validOperas[name]) return
    var opera = allOperas.find(function (o) { return o.opera_name === name })
    var type = normalizeType(opera && opera.opera_type)
    if (!typeMap[type]) typeMap[type] = { ratios: [], richnesses: [], intensities: [] }
    var links = item.links || []
    if (!links.length) return
    var pos = 0, neg = 0, relTypes = new Set(), totalInt = 0
    links.forEach(function (l) {
      var emo = l.emotion || ''
      if (emo.indexOf('对峙') >= 0 || emo.indexOf('冲突') >= 0 || emo.indexOf('紧张') >= 0 || emo.indexOf('疑虑') >= 0 || emo.indexOf('猜忌') >= 0) neg++
      else if (emo.indexOf('信任') >= 0 || emo.indexOf('忠诚') >= 0 || emo.indexOf('亲情') >= 0 || emo.indexOf('爱') >= 0) pos++
      if (l.relation) relTypes.add(l.relation)
      totalInt += l.interaction_count || 1
    })
    typeMap[type].ratios.push(pos / Math.max(neg, 1))
    typeMap[type].richnesses.push(relTypes.size)
    typeMap[type].intensities.push(totalInt / Math.max(1, links.length))
  })
  return Object.entries(typeMap).filter(function (e) { return e[1].ratios.length > 0 }).sort(function (a, b) { return b[1].ratios.length - a[1].ratios.length }).map(function (e) {
    var d = e[1]
    return {
      type: e[0],
      posNegRatio: +(d.ratios.reduce(function (s, v) { return s + v }, 0) / d.ratios.length).toFixed(2),
      relRichness: +(d.richnesses.reduce(function (s, v) { return s + v }, 0) / d.richnesses.length).toFixed(1),
      avgIntensity: +(d.intensities.reduce(function (s, v) { return s + v }, 0) / d.intensities.length).toFixed(2)
    }
  })
}

function renderRelationView (chart) {
  var metrics = computeRelationMetrics()
  if (!metrics.length) { chart.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无数据') }); return }
  var max1 = Math.max.apply(null, metrics.map(function (m) { return m.posNegRatio }).concat([1]))
  var max3 = Math.max.apply(null, metrics.map(function (m) { return m.relRichness }).concat([1]))
  var max4 = Math.max.apply(null, metrics.map(function (m) { return m.avgIntensity }).concat([1]))
  var indicator = [
    { name: '正/负情绪比', max: Math.ceil(max1 * 1.3) },
    { name: '关系丰富度', max: Math.ceil(max3 * 1.3) },
    { name: '平均强度', max: Math.ceil(max4 * 1.3) || 1 },
  ]
  var palette = ['#b23a2a', '#d4954a', '#4a8c6a', '#3d6f94', '#7a5599', '#c9607a', '#d9794a', '#4a8a8a', '#8a7a6a', '#b8967a']
  chart.setOption({
    backgroundColor: 'transparent', animationDuration: 800, animationDurationUpdate: 300, textStyle: { fontFamily: FONT_BODY },
    tooltip: { backgroundColor: JINGJU.tooltipBg, borderColor: JINGJU.tooltipBorder, borderWidth: 2, padding: [10, 14], textStyle: { color: '#ffd27f', fontSize: 12 }, extraCssText: 'border-radius:6px;box-shadow:0 6px 24px rgba(0,0,0,.4);', formatter: function (params) {
      if (!params || !params.value) return ''
      var h = '<div style="border-top:3px solid #c9852a;margin:-10px -14px 10px -14px;padding:8px 14px 4px;background:rgba(201,133,42,.08);font-size:11px;color:#c9852a;letter-spacing:1px;">戏韵万象</div><div style="font-weight:bold;color:#ffd27f;font-size:14px;font-family:' + FONT_DISPLAY + ';margin-bottom:4px;">' + params.name + '</div>'
      params.value.forEach(function (v, i) { h += '<div style="display:flex;justify-content:space-between;gap:20px;line-height:1.8;font-size:12px;"><span>' + indicator[i].name + '</span><span style="font-weight:bold;color:#ffd27f;">' + v + '</span></div>' })
      return h
    }},
    legend: { type: 'scroll', bottom: 0, left: 'center', textStyle: { color: COLORS.legendText, fontSize: 14 }, pageTextStyle: { color: COLORS.legendText }, itemWidth: 10, itemHeight: 8, itemGap: 6 },
    radar: { center: ['50%', '48%'], radius: '80%', indicator: indicator, name: { textStyle: { color: '#ffd27f', fontSize: 14 } }, splitArea: { areaStyle: { color: ['rgba(100,25,20,.45)', 'rgba(100,25,20,.35)'] } }, splitLine: { lineStyle: { color: 'rgba(255,220,180,.30)' } }, axisLine: { lineStyle: { color: 'rgba(255,220,180,.30)' } } },
    series: [{ type: 'radar', data: metrics.map(function (m, i) { return { name: m.type, value: [m.posNegRatio, m.relRichness, m.avgIntensity], lineStyle: { color: palette[i % palette.length], width: 3 }, areaStyle: { color: palette[i % palette.length], opacity: 0.2 }, itemStyle: { color: palette[i % palette.length] }, symbol: 'circle', symbolSize: 6 } }) }]
  })
  bindResize(chart)
}

function prevOpera () {
  if (currentOperaList.length === 0) return
  currentIndex = (currentIndex - 1 + currentOperaList.length) % currentOperaList.length
  renderCurrentOpera()
}

function nextOpera () {
  if (currentOperaList.length === 0) return
  currentIndex = (currentIndex + 1) % currentOperaList.length
  renderCurrentOpera()
}
window.renderRelationNetwork = renderRelationNetwork;
window.prevOpera = prevOpera;
window.nextOpera = nextOpera;
})();