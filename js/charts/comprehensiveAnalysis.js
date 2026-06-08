(function(){
var bubbleChart = null, themeStageChart = null, emotionChart = null
var _allData = null
var _anaDynasty = '全部'

var CATEGORIES = [
  { name: '伦理道德', color: '#C0392B' },
  { name: '政治权谋', color: '#6C3483' },
  { name: '战争军事', color: '#E67E22' },
  { name: '家庭亲情', color: '#E84393' },
  { name: '人物品格', color: '#27AE60' },
  { name: '情节叙事', color: '#8D6E63' },
  { name: '情感心理', color: '#2980B9' },
  { name: '社会民生', color: '#17A589' },
  { name: '宗教神怪', color: '#9B59B6' },
  { name: '艺术审美', color: '#F39C12' }
]

function classifyThemeType (t) {
  if (!t || t === 'undefined') return -1
  if (/^(战争|军事|谋略|武戏|兵法|将帅|战场|战役|军旅|战术|战事|武艺|武打|武勇|武|军纪|军令|军务|军阵|军旅|军中|军|兵|阵|剿|抗敌|边塞|边关|御敌|征战|征伐)/.test(t)) return 2
  if (/^(政治|权谋|朝堂|朝廷|君臣|官场|仕途|宫廷|帝王|权力|权术|权|君|皇|朝政|朝|政|臣|爵|宦|谏|诏|奏|赐)/.test(t)) return 1
  if (/^(人物品格|家庭伦理|忠义|忠孝|忠勇|忠烈|忠贞|忠奸|道德|价值|价值观|品格|品德|教化|气节|节|仁义|道义|孝|伦理|人格|德|礼法|礼教|礼|贞)/.test(t)) return 0
  if (/^(神怪|宗教|神异|因果|报应|天命|神|佛|鬼|冥|迷信|超自然|仙|魔|妖|僧|道|术)/.test(t)) return 8
  if (/^(亲情|爱情|婚姻|家庭|婚恋|夫妻|父母|孝|恋|姻)/.test(t)) return 3
  if (/^(人物|性格|品质|精神|气质|才能|志向|意愿|动机|才)/.test(t)) return 4
  if (/^(情节|冲突|叙事|剧情|戏剧|场景|事件|主线|核心|道具|线索|母题|悬念|转折)/.test(t)) return 5
  if (/^(情感|命运|悲剧|心理|情绪|人生|生死|离合|悲欢)/.test(t)) return 6
  if (/^(社会|司法|公案|民生|正义|冤|官|世俗|民众|人间|罪犯|贪|讼|诉讼)/.test(t)) return 7
  if (/^(艺术|风格|审美|表演|舞台|喜剧|意象|手法|戏曲)/.test(t)) return 9
  if (/(战争|军事|谋略|武戏|兵法|将帅|战场|军旅|武艺|武打|阵地|战局|战役)/.test(t)) return 2
  if (/(权谋|权术|朝堂|朝廷|君臣|官场|仕途|权力|政治|权斗|权位|权|帝王|皇)/.test(t)) return 1
  if (/(伦理|道德|忠义|忠孝|忠勇|忠烈|忠奸|教化|气节|节义|品格|品德|人格|德性|贞节|贞烈|孝道|道义|仁义|礼)/.test(t)) return 0
  if (/(神怪|神异|因果|报应|天命|宗教|神魔|神权|鬼|冥|妖|仙|佛|道|修行|斋|忏)/.test(t)) return 8
  if (/(亲情|爱情|婚姻|婚恋|夫妻|家庭)/.test(t)) return 3
  if (/(人物|性格|品质|精神|气质|才能|志向|动机)/.test(t)) return 4
  if (/(冲突|情节|叙事|剧情|戏剧|场景|事件|主线|线索|悬念|转折)/.test(t)) return 5
  if (/(情感|命运|悲剧|心理|情绪|人生|生死|离合)/.test(t)) return 6
  if (/(社会|司法|公案|民生|正义|冤|世俗|民众|贪)/.test(t)) return 7
  if (/(艺术|审美|表演|舞台|风格|意象|喜剧|戏曲)/.test(t)) return 9
  if (/(复仇|报仇)/.test(t)) return 6
  if (/(侠义|侠|义气)/.test(t)) return 0
  if (/(智谋|计策|计|策|智斗)/.test(t)) return 2
  if (/(功名|功业|建功)/.test(t)) return 1
  if (/(情义|情谊|情意)/.test(t)) return 0
  if (/(恩|怨|仇)/.test(t)) return 6
  if (/(家国|爱国|报国)/.test(t)) return 0
  if (/(英雄|气概|传奇)/.test(t)) return 4
  if (/(民生|民怨|民间)/.test(t)) return 7
  if (/(价值|主题|思想|观念)/.test(t)) return 0
  if (/(功名|事业|抱负|人才)/.test(t)) return 1
  if (/(世|民生|民主)/.test(t)) return 7
  if (/(际遇|遭际|境遇)/.test(t)) return 6
  if (/(身份|伪装|揭秘)/.test(t)) return 5
  if (/(智|慧)/.test(t)) return 2
  if (/(谋)/.test(t)) return 2
  if (/(人际关系|交往|关系)/.test(t)) return 4
  if (/(兴亡|兴衰)/.test(t)) return 1
  if (/(时代背景|时代|时代主题|历史背景)/.test(t)) return 5
  if (/(人性|人心)/.test(t)) return 4
  if (/(行动|动作)/.test(t)) return 5
  if (/(斗争|抗争|反抗)/.test(t)) return 1
  if (/(反思|回忆|追忆|回顾|历史)/.test(t)) return 6
  if (/(物|对象|饰品)/.test(t)) return 5
  if (/(成长|转变|变化|转折)/.test(t)) return 4
  if (/(讽刺|讽喻|批判|抨击)/.test(t)) return 7
  if (/(牺牲|苦难|折磨|痛苦)/.test(t)) return 6
  if (/(团圆|相聚)/.test(t)) return 3
  if (/(误会|分歧|纠纷)/.test(t)) return 5
  if (/(处境|困境|艰困)/.test(t)) return 6
  if (/(矛盾|冲突|对立)/.test(t)) return 5
  if (/(场面|情景|情境)/.test(t)) return 5
  if (/(忠君|君臣|爵|禄|仕)/.test(t)) return 1
  if (/(江湖|侠|豪)/.test(t)) return 0
  if (/(牺牲|奉献)/.test(t)) return 0
  if (/(生存|生活|生计)/.test(t)) return 7
  if (/(人际|交往)/.test(t)) return 4
  if (/(灾难|灾祸|灾害|苦难)/.test(t)) return 6
  if (/(治国|治政|治理|治世)/.test(t)) return 1
  if (/(惩恶|扬善|除恶|惩奸)/.test(t)) return 0
  if (/(民俗|风俗|民间)/.test(t)) return 7
  if (/(暴力|犯罪|罪恶)/.test(t)) return 7
  if (/(女性|妇女|红颜)/.test(t)) return 3
  if (/(正邪|善恶|对错)/.test(t)) return 0
  if (/(人情|世故|世态)/.test(t)) return 7
  if (/(清官|断案|案件|案情)/.test(t)) return 7
  if (/(仪式|典礼|礼仪|庆贺|祝|颂)/.test(t)) return 9
  if (/(主旨|主线|核心)/.test(t)) return 5
  if (/(结局|收束|归宿|走向)/.test(t)) return 5
  return -1
}

var _cachedDynasty = null
function computeData (dynasty) {
  if (dynasty === undefined) dynasty = '全部'
  /* 朝代变化时清缓存 */
  if (_allData && _cachedDynasty !== dynasty) { _allData = null }
  _cachedDynasty = dynasty
  if (_allData) return _allData
  var operas = DataStore.operaCompact || []
  /* 按朝代筛选 */
  if (dynasty !== '全部') {
    operas = operas.filter(function(o) { return isOperaInDynasty(o.dynasty, dynasty) })
  }
  var result = []
  operas.forEach(function(opera) {
    try {
      var name = opera.opera_name
      var type = normalizeType(opera.opera_type)
      var story = getStorylineByOpera(name)
      var themes = getThemesByOpera(name)
      var rel = getRelationsByOpera(name)
      var events = story && story.events || []
      if (!events.length) return
      var nodes = 0, links = 0, roleTypes = {}
      rel.forEach(function(r) {
        nodes += (r.nodes || []).length
        links += (r.links || []).length
        ;(r.nodes || []).forEach(function(n) {
          var rt = n.role_type || ''
          if (rt) roleTypes[rt] = (roleTypes[rt] || 0) + 1
        })
      })
      var relationDensity = nodes > 0 ? +(links / nodes).toFixed(2) : 0
      var roleRichness = Object.keys(roleTypes).length
      var catSet = {}
      themes.forEach(function(t) {
        (t.theme_keywords || []).forEach(function(k) {
          var ci = classifyThemeType(k.theme_type)
          if (ci >= 0 && ci < 10) catSet[ci] = true
        })
      })
      var catIndices = Object.keys(catSet).map(Number)
      var themeDiversity = catIndices.length
      var confVals = events.map(function(e) { return e.conflict_level || 0 })
      var emoVals = events.map(function(e) { return e.emotion_value || 0 })
      var conflictRange = Math.max.apply(null, confVals) - Math.min.apply(null, confVals)
      var avgConflict = confVals.reduce(function(s, v) { return s + v }, 0) / events.length
      var avgEmotion = emoVals.reduce(function(s, v) { return s + v }, 0) / events.length
      var emotionVar = events.length > 1 ? Math.sqrt(events.reduce(function(s, e) { return s + Math.pow((e.emotion_value || 0) - avgEmotion, 2) }, 0) / events.length) : 0
      var secondHalf = 0, firstHalf = 0, halfLen = Math.floor(events.length / 2)
      events.forEach(function(evt, idx) {
        var lv = evt.conflict_level || 0
        if (idx < halfLen) firstHalf += lv; else secondHalf += lv
      })
      firstHalf = firstHalf / (halfLen || 1)
      secondHalf = secondHalf / (events.length - halfLen || 1)
      var trend = secondHalf / (firstHalf || 1)
      var cluster
      if (emotionVar > 22 && avgEmotion > 45) { cluster = '跌宕起伏型' }
      else if (avgConflict > 70 && conflictRange > 50 && trend > 1.1) { cluster = '渐强高潮型' }
      else if (conflictRange < 25 && emotionVar < 13) { cluster = '平稳推进型' }
      else if (trend < 0.85 && conflictRange > 40) { cluster = '先紧后松型' }
      else if (trend > 1.15 && avgConflict > 55) { cluster = '渐强高潮型' }
      else { cluster = '波浪渐进型' }
      result.push({
        name: name, type: type, cluster: cluster,
        totalNodes: nodes,
        relationDensity: Math.min(relationDensity, 15),
        roleRichness: roleRichness,
        themeDiversity: themeDiversity,
        catIndices: catIndices,
        avgConflict: +avgConflict.toFixed(1),
        emotionVar: +emotionVar.toFixed(1),
        narrativeIntensity: conflictRange,
        avgEmotion: +avgEmotion.toFixed(1),
        eventCount: events.length,
        events: events
      })
    } catch(e) {}
  })
  _allData = result
  return result
}

function renderBubble(dynasty) {
  if (dynasty === undefined) dynasty = '全部'
  var dom = document.getElementById('anaBubble')
  if (!dom) return
  if (bubbleChart) bubbleChart.dispose()
  bubbleChart = echarts.init(dom)
  var allData = computeData(dynasty)
  if (!allData.length) { bubbleChart.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无数据') }); return }
  var clusterColors = { '渐强高潮型': '#C0392B', '跌宕起伏型': '#E8A84C', '波浪渐进型': '#27AE60', '先紧后松型': '#2980B9', '平稳推进型': '#8E6BA0' }
  bubbleChart.setOption({
    backgroundColor: 'transparent', animationDuration: 800, animationDurationUpdate: 300, textStyle: { fontFamily: FONT_BODY },
    tooltip: { backgroundColor: JINGJU.tooltipBg, borderColor: JINGJU.tooltipBorder, borderWidth: 2, padding: [0, 0], textStyle: { color: JINGJU.textOnDark, fontSize: 12 }, extraCssText: 'border-radius:6px;box-shadow:0 6px 24px rgba(0,0,0,.4);overflow:hidden;', formatter: function(params) { var d = params.data; var inner = '<div style="font-weight:bold;color:#ffd27f;font-size:15px;font-family:Ma Shan Zheng,cursive;">' + d.name + '</div><div style="color:#f5e6c8;line-height:1.8;font-size:12px;margin-top:4px;">剧种：' + d.type + '<br/>叙事结构：' + d.cluster + '<br/>角色数：' + d.totalNodes + ' 个<br/>冲突均值：' + d.avgConflict + '<br/>主题多样性：' + d.themeDiversity + ' 类<br/>事件数：' + d.eventCount + '</div>'; return '<div style="border-bottom:1px solid rgba(201,133,42,.25);padding:8px 16px;background:rgba(201,133,42,.12);font-size:14px;color:#ffdca2;letter-spacing:3px;font-family:STXingkai, KaiTi, serif;text-align:center;font-weight:bold;">— 戏韵万象 —</div><div style="padding:10px 14px 8px;">' + inner + '</div>' } },
    grid: { left: 55, right: 20, top: 10, bottom: 30 },
    xAxis: { type: 'value', name: '冲突均值', nameTextStyle: { color: '#F5EFE3', fontSize: 11 }, axisLine: { lineStyle: { color: '#F5EFE3' } }, axisLabel: { color: '#F5EFE3', fontSize: 10 }, splitLine: { lineStyle: { color: COLORS.splitLine } } },
    yAxis: { type: 'log', name: '角色数', nameTextStyle: { color: '#F5EFE3', fontSize: 11 }, axisLine: { lineStyle: { color: '#F5EFE3' } }, axisLabel: { color: '#F5EFE3', fontSize: 10, formatter: function(v) { return Math.round(v) } }, splitLine: { lineStyle: { color: COLORS.splitLine } }, logBase: 2, min: 1 },
    legend: { type: 'scroll', top: 2, right: 10, textStyle: { color: COLORS.legendText, fontSize: 13 }, pageTextStyle: { color: COLORS.legendText, fontSize: 11 }, itemWidth: 14, itemHeight: 12, itemGap: 8 },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0, filterMode: 'none', zoomOnMouseWheel: true, minSpan: 5 },
      { type: 'inside', yAxisIndex: 0, filterMode: 'none', zoomOnMouseWheel: true, minSpan: 5 }
    ],
    series: ['渐强高潮型', '波浪渐进型', '跌宕起伏型', '先紧后松型', '平稳推进型'].map(function(t) {
      return { name: t, type: 'scatter', symbolSize: function(val, params) { var v = (params && params.data && params.data.themeDiversity) || (val && val[2]) || 3; return Math.max(3, Math.min(50, (v - 1) * 5 + 4)) }, data: allData.filter(function(d) { return d.cluster === t }).map(function(d) { return { value: [d.avgConflict, d.totalNodes, d.themeDiversity || 3], name: d.name, type: d.type, cluster: d.cluster, totalNodes: d.totalNodes, themeDiversity: d.themeDiversity, roleRichness: d.roleRichness, avgConflict: d.avgConflict, eventCount: d.eventCount } }), itemStyle: { color: clusterColors[t] || '#8a7a6a', shadowBlur: 6, shadowColor: 'rgba(255,200,100,0.15)' }, emphasis: { label: { show: true, color: '#ffd27f', fontSize: 12, fontFamily: FONT_DISPLAY }, itemStyle: { shadowBlur: 12, shadowColor: 'rgba(255,200,100,0.35)' } } }
    })
  })
  bindResize(bubbleChart)
}

function renderThemeStage(dynasty) {
  if (dynasty === undefined) dynasty = '全部'
  var dom = document.getElementById('anaThemeStage')
  if (!dom) return
  if (themeStageChart) themeStageChart.dispose()
  themeStageChart = echarts.init(dom)
  var allData = computeData(dynasty)
  var isRelation = document.querySelector('.ana-switch.active')?.dataset?.anamode === 'relation'

  if (isRelation) {
    var allRel = {}
    var relData = {}
    allData.forEach(function(d) {
      var entries = getRelationsByOpera(d.name)
      var rtypes = new Set()
      entries.forEach(function(item) {
        if (Array.isArray(item.links)) {
          item.links.forEach(function(l) {
            if (l.relation) {
              l.relation.split(/[\/,、，]/).forEach(function(p) { var t2 = p.trim(); if (t2) rtypes.add(t2) })
            }
          })
        }
      })
      var arr = [...rtypes]
      arr.forEach(function(rt) { allRel[rt] = (allRel[rt] || 0) + 1 })
      d.catIndices.forEach(function(ci) {
        if (!relData[ci]) relData[ci] = {}
        arr.forEach(function(rt) { relData[ci][rt] = (relData[ci][rt] || 0) + 1 })
      })
    })
    var topRelNames = Object.entries(allRel).sort(function(a, b) { return b[1] - a[1] }).slice(0, 8).map(function(e) { return e[0] })
    var topCatIdx = Object.entries(relData).sort(function(a, b) { var sa = Object.values(a[1]).reduce(function(s, v) { return s + v }, 0); var sb = Object.values(b[1]).reduce(function(s, v) { return s + v }, 0); return sb - sa }).slice(0, 8).map(function(e) { return +e[0] })
    if (!topCatIdx.length || !topRelNames.length) { themeStageChart.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无数据') }); return }

    var totalOperas = allData.length
    var catTotals = {}, relTotals = {}
    topCatIdx.forEach(function(ci) { catTotals[ci] = topRelNames.reduce(function(s, rt) { return s + (relData[ci][rt] || 0) }, 0) || 1 })
    topRelNames.forEach(function(rt) { relTotals[rt] = topCatIdx.reduce(function(s, ci) { return s + (relData[ci][rt] || 0) }, 0) || 1 })
    var grandTotal = topCatIdx.reduce(function(s, ci) { return s + catTotals[ci] }, 0) || 1

    var heatData = []
    var maxLift = 0
    topCatIdx.forEach(function(ci, ti) {
      topRelNames.forEach(function(rt, si) {
        var observed = relData[ci][rt] || 0
        var expected = (catTotals[ci] * relTotals[rt]) / grandTotal
        var lift = expected > 0 ? observed / expected : 0
        if (lift > maxLift) maxLift = lift
        heatData.push([si, ti, +lift.toFixed(2)])
      })
    })
    if (maxLift < 0.5) maxLift = 2

    themeStageChart.setOption({
      backgroundColor: 'transparent', animationDuration: 800, animationDurationUpdate: 300, textStyle: { fontFamily: FONT_BODY },
      tooltip: { backgroundColor: JINGJU.tooltipBg, borderColor: JINGJU.tooltipBorder, borderWidth: 2, padding: [0, 0], textStyle: { color: JINGJU.textOnDark, fontSize: 12 }, extraCssText: 'border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.4);overflow:hidden;', formatter: function(params) {
        var lift = params.value[2]
        var tName = CATEGORIES[topCatIdx[params.value[1]]].name
        var rName = topRelNames[params.value[0]]
        var observed = relData[topCatIdx[params.value[1]]][rName] || 0
        var desc = lift > 1.5 ? '强关联' : lift > 1.2 ? '中关联' : lift > 1.0 ? '弱关联' : lift < 0.7 ? '低关联' : '一般'
        var inner = '<div style="color:#f5e6c8;line-height:1.8;font-size:13px;"><span style="font-weight:bold;color:#ffd27f;font-size:15px;">' + tName + '</span> x <span style="color:#dca055;">' + rName + '</span><br/>共现：' + observed + ' 部<br/>关联强度：' + lift.toFixed(2) + '<br/>' + desc + '</div>'
        return '<div style="border-bottom:1px solid rgba(201,133,42,.25);padding:8px 16px;background:rgba(201,133,42,.12);font-size:14px;color:#ffdca2;letter-spacing:3px;font-family:STXingkai, KaiTi, serif;text-align:center;font-weight:bold;">— 戏韵万象 —</div><div style="padding:10px 14px 8px;">' + inner + '</div>'
      } },
      title: { text: '主题 x 关系类型', left: 'center', top: 2, textStyle: { color: '#ffdca2', fontSize: 14, fontFamily: FONT_DISPLAY, fontWeight: 'normal' } },
      grid: { left: 90, right: 60, top: 30, bottom: 30 },
      xAxis: { type: 'category', data: topRelNames, axisLabel: { color: COLORS.axisLabel, fontSize: 11, fontWeight: 'bold', interval: 0, rotate: 20 }, axisLine: { lineStyle: { color: COLORS.axisLine } } },
      yAxis: { type: 'category', data: topCatIdx.map(function(ci) { return CATEGORIES[ci].name }), axisLabel: { color: '#F5EFE3', fontSize: 10 }, axisLine: { lineStyle: { color: COLORS.axisLine } } },
      visualMap: { min: 0, max: Math.ceil(maxLift * 10) / 10, calculable: false, orient: 'vertical', right: 0, top: 'center', itemWidth: 10, itemHeight: 100, inRange: { color: ['#f5ead0', '#e8c88a', '#dca055', '#c9703a', '#b23a2a'] }, textStyle: { color: '#F5EFE3', fontSize: 9 } },
      series: [{ type: 'heatmap', data: heatData, label: { show: true, color: '#fff', fontSize: 10, formatter: function(p) { return p.value[2] } }, emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(255,180,80,0.4)' } } }]
    })
  } else {
    var conflictBins = [
      { name: '低 0-39', min: 0, max: 39 },
      { name: '中 40-59', min: 40, max: 59 },
      { name: '高 60-79', min: 60, max: 79 },
      { name: '激烈 80-100', min: 80, max: 100 }
    ]
    var catConfMap = {}
    var confTotal = {}
    conflictBins.forEach(function(b) { confTotal[b.name] = 0 })
    allData.forEach(function(d) {
      var catCount = d.catIndices.length
      if (!catCount) return
      var weight = 1 / catCount
      d.events.forEach(function(evt) {
        var lv = evt.conflict_level || 0
        var binName = '激烈 80-100'
        for (var bi = 0; bi < conflictBins.length; bi++) {
          if (lv >= conflictBins[bi].min && lv <= conflictBins[bi].max) { binName = conflictBins[bi].name; break }
        }
        d.catIndices.forEach(function(ci) {
          if (!catConfMap[ci]) catConfMap[ci] = {}
          catConfMap[ci][binName] = (catConfMap[ci][binName] || 0) + weight
          confTotal[binName] = (confTotal[binName] || 0) + weight
        })
      })
    })
    if (Object.keys(catConfMap).length === 0) { themeStageChart.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无数据') }); return }
    var grandTotal = conflictBins.reduce(function(s, b) { return s + (confTotal[b.name] || 0) }, 0) || 1
    var topCatIdx = Object.entries(catConfMap).sort(function(a, b) {
      var sa = conflictBins.reduce(function(s, bin) { return s + (a[1][bin.name] || 0) }, 0)
      var sb = conflictBins.reduce(function(s, bin) { return s + (b[1][bin.name] || 0) }, 0)
      return sb - sa
    }).map(function(e) { return +e[0] })
    var heatData = []
    var maxLift = 0
    topCatIdx.forEach(function(ci, ti) {
      var catTotal = conflictBins.reduce(function(s, bin) { return s + (catConfMap[ci][bin.name] || 0) }, 0) || 1
      conflictBins.forEach(function(bin, si) {
        var observed = (catConfMap[ci][bin.name] || 0) / catTotal
        var expected = (confTotal[bin.name] || 0) / grandTotal
        var lift = expected > 0 ? +(observed / expected).toFixed(2) : 1
        if (lift > maxLift) maxLift = lift
        heatData.push([si, ti, lift])
      })
    })
    if (maxLift < 0.5) maxLift = 2
    themeStageChart.setOption({
      backgroundColor: 'transparent', animationDuration: 800, animationDurationUpdate: 300, textStyle: { fontFamily: FONT_BODY },
      tooltip: { backgroundColor: JINGJU.tooltipBg, borderColor: JINGJU.tooltipBorder, borderWidth: 2, padding: [0, 0], textStyle: { color: JINGJU.textOnDark, fontSize: 12 }, extraCssText: 'border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.4);overflow:hidden;', formatter: function(params) {
        var tName = CATEGORIES[topCatIdx[params.value[1]]].name
        var lift = params.value[2]
        var binName = conflictBins[params.value[0]].name
        var desc = lift > 1.15 ? '富集' : lift > 1.05 ? '偏高' : lift > 0.95 ? '一般' : '偏低'
        var inner = '<div style="color:#f5e6c8;line-height:1.8;font-size:13px;"><span style="font-weight:bold;color:#ffd27f;font-size:15px;">' + tName + '</span><br/>冲突级别：<span style="color:#dca055;">' + binName + '</span><br/>提升度：' + lift.toFixed(2) + '<br/>' + desc + '</div>'
        return '<div style="border-bottom:1px solid rgba(201,133,42,.25);padding:8px 16px;background:rgba(201,133,42,.12);font-size:14px;color:#ffdca2;letter-spacing:3px;font-family:STXingkai, KaiTi, serif;text-align:center;font-weight:bold;">— 戏韵万象 —</div><div style="padding:10px 14px 8px;">' + inner + '</div>'
      } },
      title: { text: '主题 x 冲突级别', left: 'center', top: 2, textStyle: { color: '#ffdca2', fontSize: 14, fontFamily: FONT_DISPLAY, fontWeight: 'normal' } },
      grid: { left: 90, right: 50, top: 30, bottom: 30 },
      xAxis: { type: 'category', data: conflictBins.map(function(b) { return b.name }), axisLabel: { color: COLORS.axisLabel, fontSize: 11, fontWeight: 'bold', interval: 0, rotate: 20 }, axisLine: { lineStyle: { color: COLORS.axisLine } } },
      yAxis: { type: 'category', data: topCatIdx.map(function(ci) { return CATEGORIES[ci].name }), axisLabel: { color: '#F5EFE3', fontSize: 10 }, axisLine: { lineStyle: { color: COLORS.axisLine } } },
      visualMap: { min: 0.7, max: Math.ceil(maxLift * 10) / 10, calculable: false, orient: 'vertical', right: 0, top: 'center', itemWidth: 10, itemHeight: 100, inRange: { color: ['#f5ead0', '#e8c88a', '#dca055', '#c9703a', '#b23a2a'] }, textStyle: { color: '#F5EFE3', fontSize: 9 } },
      series: [{ type: 'heatmap', data: heatData, label: { show: true, color: '#fff', fontSize: 10, formatter: function(p) { return p.value[2].toFixed(2) } }, emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(255,180,80,0.4)' } } }]
    })
  }
  bindResize(themeStageChart)
}

function renderEmotionEvolution(dynasty) {
  if (dynasty === undefined) dynasty = '全部'
  var dom = document.getElementById('anaEmotion')
  if (!dom) return
  if (emotionChart) emotionChart.dispose()
  emotionChart = echarts.init(dom)
  var allData = computeData(dynasty)
  var stages = ['开端', '发展', '冲突', '高潮', '结局']
  var typeMap = {}
  allData.forEach(function(d) {
    if (!typeMap[d.type]) typeMap[d.type] = {}
    stages.forEach(function(s) { if (!typeMap[d.type][s]) typeMap[d.type][s] = { total: 0, sumConflict: 0 } })
    d.events.forEach(function(evt) { if (typeMap[d.type][evt.stage]) { typeMap[d.type][evt.stage].total++; typeMap[d.type][evt.stage].sumConflict += evt.conflict_level || 0 } })
  })
  var typeCounts = {}
  allData.forEach(function(d) { typeCounts[d.type] = (typeCounts[d.type] || 0) + 1 })
  var topTypes = Object.entries(typeCounts).sort(function(a, b) { return b[1] - a[1] }).slice(0, 8).map(function(e) { return e[0] })
  if (!topTypes.length) { emotionChart.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无数据') }); return }
  var series = topTypes.map(function(type, idx) {
    return { name: type, type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { width: 2.5, color: SERIES_COLORS[idx % SERIES_COLORS.length] }, itemStyle: { color: SERIES_COLORS[idx % SERIES_COLORS.length] }, areaStyle: { color: SERIES_COLORS[idx % SERIES_COLORS.length], opacity: 0.06 }, data: stages.map(function(s) { var st = typeMap[type] && typeMap[type][s]; return st && st.total > 0 ? +(st.sumConflict / st.total).toFixed(1) : 0 }), emphasis: { focus: 'series' } }
  })
  emotionChart.setOption({
    backgroundColor: 'transparent', animationDuration: 800, animationDurationUpdate: 300, textStyle: { fontFamily: FONT_BODY },
    tooltip: { backgroundColor: JINGJU.tooltipBg, borderColor: JINGJU.tooltipBorder, borderWidth: 2, padding: [0, 0], textStyle: { color: JINGJU.textOnDark, fontSize: 12 }, extraCssText: 'border-radius:6px;box-shadow:0 6px 24px rgba(0,0,0,.4);overflow:hidden;', trigger: 'axis', formatter: function(params) { var arr = Array.isArray(params) ? params : [params]; var h = ''; arr.forEach(function(p) { h += '<div style="display:flex;justify-content:space-between;gap:20px;line-height:1.8;"><span>' + p.marker + ' ' + p.seriesName + '</span><span style="font-weight:bold;">' + (typeof p.value === 'number' ? p.value.toFixed(1) : '-') + '</span></div>' }); return '<div style="border-bottom:1px solid rgba(201,133,42,.25);padding:8px 16px;background:rgba(201,133,42,.12);font-size:14px;color:#ffdca2;letter-spacing:3px;font-family:STXingkai, KaiTi, serif;text-align:center;font-weight:bold;">— 戏韵万象 —</div><div style="padding:10px 14px 8px;"><div style="font-weight:bold;color:#ffd27f;font-family:Ma Shan Zheng,cursive;margin-bottom:4px;">' + arr[0].axisValue + '</div>' + h + '</div>' } },
    legend: { type: 'scroll', top: 2, right: 0, textStyle: { color: COLORS.legendText, fontSize: 12 }, pageTextStyle: { color: COLORS.legendText, fontSize: 10 }, itemWidth: 12, itemHeight: 10, itemGap: 6, pageIconSize: 8 },
    grid: { left: 40, right: 8, top: 24, bottom: 22 },
    xAxis: { type: 'category', data: stages, axisLine: { lineStyle: { color: COLORS.axisLine } }, axisLabel: { color: COLORS.axisLabel, fontSize: 11, fontWeight: 'bold' } },
    yAxis: { type: 'value', name: '关系强度', nameTextStyle: { color: '#F5EFE3', fontSize: 10 }, axisLabel: { color: '#F5EFE3', fontSize: 9 }, splitLine: { lineStyle: { color: COLORS.splitLine } } },
    series: series
  })
  bindResize(emotionChart)
}

function renderComprehensiveAnalysis(dynasty) {
  if (dynasty === undefined) dynasty = '全部'
  _anaDynasty = dynasty
  renderBubble(dynasty)
  renderThemeStage(dynasty)
  renderEmotionEvolution(dynasty)
}

setTimeout(function() {
  document.querySelectorAll('.ana-switch').forEach(function(btn) {
    btn.onclick = function() {
      document.querySelectorAll('.ana-switch').forEach(function(b) { b.classList.remove('active') })
      btn.classList.add('active')
      renderThemeStage(_anaDynasty)
    }
  })
}, 100)
window.renderComprehensiveAnalysis = renderComprehensiveAnalysis;
})();
