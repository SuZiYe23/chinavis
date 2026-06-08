/* =========================================
   main.js — 戏韵万象 · 京剧数据可视分析系统
========================================= */

var _d = document, $id = function(i) { return _d.getElementById(i) }, $all = function(s) { return _d.querySelectorAll(s) }, $ = function(s) { return _d.querySelector(s) }
var $_db, $_headerBtn, _charts = {}, _rAF = null
var currentDynasty = '全部', selectedOperaIndex = null, indexSearchKeyword = ''
var _sankeyFilter = '全部', _networkFilter = '全部'

function getChart(id, fn) {
  var dom = $id(id);
  if (!dom) return null;
  if (fn && _charts[id]) { _charts[id].dispose(); _charts[id] = null }
  if (!_charts[id]) _charts[id] = echarts.init(dom);
  return _charts[id]
}

function onResize() {
  if (_rAF) cancelAnimationFrame(_rAF);
  _rAF = requestAnimationFrame(function() {
    _rAF = null;
    var d = $_db || $('.dashboard');
    if (d) d.style.transform = 'scale(' + Math.min(innerWidth / 1920, innerHeight / 1080) + ')';
    for (var k in _charts) { try { _charts[k].resize() } catch(e) {} }
    var ac = window.__allCharts || []
    for (var i = 0; i < ac.length; i++) { try { ac[i].resize() } catch(e) {} }
  })
}

function switchBg(id) {
  var w = $('.screen-wrapper');
  if (!w) return;
  if (id === 'overviewPage' || id === 'operaPage') {
    w.style.backgroundImage = "url('images/bg-overview-full.png')";
  } else {
    w.style.backgroundImage = "url('images/bg-analysis-full.png')";
  }
  var d = $_db || $('.dashboard');
  if (!d) return;
  d.classList.toggle('overview-bg', id === 'overviewPage');
  d.classList.toggle('analysis-bg', id !== 'overviewPage');
}

function showHeaderBack(show) {
  if (!$_headerBtn) $_headerBtn = $('.header-back-btn');
  if ($_headerBtn) $_headerBtn.style.display = show ? 'block' : 'none';
}

window.onload = function() {
  $_db = $('.dashboard');
  window.addEventListener('resize', onResize);
  onResize();
  switchBg('overviewPage');
  loadAllData();
  console.log('全部数据加载成功');
  if (DataStore.operaBasic && DataStore.operaBasic.length) DataStore.currentOpera = DataStore.operaBasic[0].opera_name;
  try { initTypeAreaChart() } catch(e) { console.warn(e) }
  try { initThemeCloud() } catch(e) { console.warn(e) }
  try { initPageSwitch() } catch(e) { console.warn(e) }
  try { initTimeline() } catch(e) { console.warn(e) }
  try { initSearch() } catch(e) { console.warn(e) }
  try { renderRoleSankeyChart('全部') } catch(e) { console.warn(e) }
  try { initGrid() } catch(e) { console.warn(e) }
  try { initSubPages() } catch(e) { console.warn(e) }
}

function initPageSwitch() {
  var btns = $all('.nav-btn, .nav-sub-btn'), pages = $all('.page');
  showHeaderBack(false);
  btns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      btns.forEach(function(b) { b.classList.remove('active-nav') });
      btn.classList.add('active-nav');
      var id = btn.dataset.page;
      switchBg(id);
      pages.forEach(function(p) { p.classList.remove('active-page') });
      var pg = $id(id); if (pg) pg.classList.add('active-page');
      showHeaderBack(id !== 'overviewPage');
      if (id === 'operaPage') { setTimeout(initOperaPage, 30); onResize(); return }
      var fn = {
        sankeyPage: function() { renderSankeyCompare(_sankeyFilter) },
        networkPage: function() { renderRelationNetwork(_networkFilter, currentDynasty) },
        sunburstPage: function() { renderThemeSunburst(currentDynasty) },
        overviewAnalysisPage: function() { renderComprehensiveAnalysis(currentDynasty) }
      }[id];
      if (fn) { setTimeout(fn, 30); setTimeout(onResize, 80) }
    })
  });
  $all('.header-back-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id = btn.dataset.back;
      switchBg(id);
      pages.forEach(function(p) { p.classList.remove('active-page') });
      var pg = $id(id); if (pg) pg.classList.add('active-page');
      btns.forEach(function(b) { b.classList.remove('active-nav') });
      btns.forEach(function(b) { if (b.dataset.page === id) b.classList.add('active-nav') });
      showHeaderBack(false);
      setTimeout(onResize, 80);
    })
  })
}

function refreshActiveSubPage() {
  var activePage = document.querySelector('.page.active-page');
  if (!activePage) return;
  var id = activePage.id;
  if (id === 'sankeyPage') {
    _sankeyFilter = currentDynasty;
    renderSankeyCompare(currentDynasty);
  } else if (id === 'networkPage') {
    renderRelationNetwork(_networkFilter, currentDynasty);
  } else if (id === 'sunburstPage') {
    renderThemeSunburst(currentDynasty);
  } else if (id === 'overviewAnalysisPage') {
    renderComprehensiveAnalysis(currentDynasty);
  }
}

function initTimeline() {
  $all('.timeline-node').forEach(function(n) {
    n.onclick = function() {
      $all('.timeline-node').forEach(function(x) { x.classList.remove('active') });
      this.classList.add('active');
      currentDynasty = this.dataset.dynasty;
      selectedOperaIndex = null;
      initGrid();
      /* 时间轴控制总览和各子页面 */
      _sankeyFilter = currentDynasty;
      renderSankeyCompare(currentDynasty);
      refreshActiveSubPage();
    }
  })
}

function initTypeAreaChart() {
  var c = getChart('typeAreaChart');
  if (!c) return;
  /* 从 operaCompact 实时统计，按 normalizeType 合并 */
  var typeCount = {};
  (DataStore.operaCompact || []).forEach(function(o) {
    var t = normalizeType(o.opera_type);
    if (!t) return;
    typeCount[t] = (typeCount[t] || 0) + 1;
  });
  var entries = Object.entries(typeCount).sort(function(a, b) { return b[1] - a[1] });
  var main = entries.slice(0, 5), os = entries.slice(5).reduce(function(s, e) { return s + e[1] }, 0);
  if (os > 0) main.push(['其他', os]);
  c.setOption({ backgroundColor: 'transparent', animationDuration: 800, textStyle: { fontFamily: FONT_BODY }, tooltip: goldenTooltip(function(p) { return '<div style="font-weight:bold;margin-bottom:6px;color:#ffd27f;">' + p.name + '</div><div style="color:#f5e6c8;">数量：<span style="font-weight:bold;color:#ffd27f;">' + p.value + '</span> 部</div>' }, { trigger: 'item' }), grid: { left: 6, right: 40, top: 10, bottom: 24 }, xAxis: { type: 'category', data: main.map(function(d) { return d[0] }), axisLine: AXIS_LINE, axisTick: { show: false }, axisLabel: { color: COLORS.axisLabel, fontSize: 10, rotate: 0, interval: 0 } }, yAxis: { type: 'value', splitLine: SPLIT_LINE, axisLabel: { color: '#F5EFE3', fontSize: 10 } }, series: [{ type: 'bar', barWidth: '60%', barGap: '30%', data: main.map(function(item, idx) { return { value: item[1], itemStyle: { color: SERIES_COLORS[idx % SERIES_COLORS.length], borderRadius: [3, 3, 0, 0] } } }), emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(255,200,100,0.3)' } }, label: { show: true, position: 'top', color: '#F5EFE3', fontSize: 10, formatter: function(p) { return p.value } } }] })
}

function initThemeCloud() {
  var c = getChart('themeCloud');
  if (!c) return;
  /* 从 operaThemes 中统计所有 theme_keywords 词频，仅保留频次 > 150 的关键词 */
  var wordMap = {};
  (DataStore.operaThemes || []).forEach(function(item) {
    (item.theme_keywords || []).forEach(function(kw) {
      var w = kw.word;
      if (!w) return;
      wordMap[w] = (wordMap[w] || 0) + (kw.value || 1);
    });
  });
  var words = Object.keys(wordMap)
    .filter(function(w) { return wordMap[w] > 1000; })
    .map(function(w) { return { name: w, freq: wordMap[w], value: Math.round(Math.sqrt(wordMap[w]) * 4) }; });
  words.sort(function(a, b) { return b.value - a.value; });
  if (!words.length) return;
  /* 亮色高对比度词云配色 */
  var CLOUD_PALETTE = ['#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#F7DC6F','#BB8FCE','#85C1E9','#F8C471','#82E0AA','#F1948A','#85929E','#73C6B6','#EDBB99'];
  var _cpIdx = 0;
  c.setOption({ backgroundColor: 'transparent', tooltip: goldenTooltip(function(p) { var f = (p.data && p.data.freq) || p.freq || p.value; return '<div style="font-weight:bold;color:#ffd27f;margin-bottom:4px;">' + p.name + '</div><div style="color:#f5e6c8;">出现频次：<span style="font-weight:bold;color:#ffd27f;">' + f + '</span></div>' }), series: [{ type: 'wordCloud', shape: 'rectangle', width: '100%', height: '100%', sizeRange: [22, 80], rotationRange: [-90, 0], rotationStep: 90, gridSize: 3, drawOutOfBound: false, layoutAnimation: false, textStyle: { color: function() { return CLOUD_PALETTE[_cpIdx++ % CLOUD_PALETTE.length]; }, fontFamily: FONT_DISPLAY }, emphasis: { textStyle: { color: '#ffd27f', fontSize: 36, textShadowBlur: 10, textShadowColor: 'rgba(255,180,80,0.6)' } }, data: words }] })
}

function initGrid() {
  var grid = $id('operaIndexGrid');
  if (!grid) return;
  var operas = getOperasByTimelineDynasty(currentDynasty);
  if (indexSearchKeyword) operas = operas.filter(function(o) { return o.opera_name && o.opera_name.includes(indexSearchKeyword) });
  if (selectedOperaIndex !== null && selectedOperaIndex >= operas.length) selectedOperaIndex = null;
  if (!operas || !operas.length) { grid.innerHTML = '<div class="opera-index-empty">当前时间线暂无剧目数据</div>'; return }
  var html = '';
  for (var i = 0; i < operas.length; i++) {
    var op = operas[i];
    html += '<div class="opera-index-tile' + (i === selectedOperaIndex ? ' selected' : '') + '" data-idx="' + i + '"><div class="tile-name">' + op.opera_name + '</div><div class="tile-meta">' + (op.dynasty || '') + '</div><div class="tile-badge">' + normalizeType(op.opera_type) + '</div></div>'
  }
  grid.innerHTML = html;
  grid.querySelectorAll('.opera-index-tile').forEach(function(tile) {
    tile.onclick = function() {
      var idx = parseInt(tile.dataset.idx);
      selectedOperaIndex = idx;
      DataStore.currentOpera = operas[idx].opera_name;
      grid.querySelectorAll('.opera-index-tile').forEach(function(el) { el.classList.remove('selected') });
      tile.classList.add('selected');
      $all('.page').forEach(function(p) { p.classList.remove('active-page') });
      var pg = $id('operaPage'); if (pg) pg.classList.add('active-page');
      showHeaderBack(true);
      initOperaPage();
    }
  })
}

function initSearch() {
  var inp = $id('indexSearchInput');
  if (!inp) return;
  inp.addEventListener('input', function() { indexSearchKeyword = inp.value.trim(); selectedOperaIndex = null; initGrid() })
}

function initOperaPage() {
  renderOperaOverview();
  renderRoleTable();
  renderOperaRelationGraph();
  renderStorylineChart();
  renderOperaThemeCloud();
  renderStoryEvents();
  onResize();
}

function renderOperaOverview() {
  var card = $id('operaOverviewCard');
  if (!card) return;
  var op = getOperaBasicByName(DataStore.currentOpera);
  if (!op) { card.innerHTML = '<div class="empty-tip" style="padding:20px;text-align:center;">暂无数据</div>'; return }
  var ce = op.cover_elements || {}, kw = ce.emotion_keywords || [], roles = op.main_roles || [];
  card.innerHTML = '<div class="overview-card-header"><div class="opera-name">' + op.opera_name + '</div><div class="opera-tags"><span>' + (op.dynasty || '未知') + '</span><span>' + (op.opera_type || '未知') + '</span></div></div><div class="overview-card-body"><div class="info-row"><div class="label">主要人物</div><div class="value">' + (roles.join('、') || '—') + '</div></div><div class="info-row"><div class="label">核心场景</div><div class="value">' + (ce.core_scene || '—') + '</div></div><div class="info-row"><div class="label">核心冲突</div><div class="value">' + (ce.core_conflict || '—') + '</div></div><div class="info-row"><div class="label">情绪关键词</div><div class="value"><div class="keyword-tags">' + (kw.map(function(k) { return '<span class="keyword-tag">' + k + '</span>' }).join('') || '—') + '</div></div></div></div>'
}

function renderRoleTable() {
  var wrap = $id('operaRoleTable');
  if (!wrap) return;
  var roles = getRolesFromRolesFile(DataStore.currentOpera);
  if (!roles || !roles.length) { wrap.innerHTML = '<div class="empty-tip" style="padding:20px;text-align:center;">暂无角色数据</div>'; return }
  var h = '<table><thead><tr><th>角色</th><th>性别</th><th>年龄</th><th>身份</th><th>性格</th><th>行当</th><th>重要度</th></tr></thead><tbody>';
  for (var i = 0; i < roles.length; i++) {
    var r = roles[i], c = ROLE_COLORS[r.role_type] || FALLBACK;
    h += '<tr><td>' + r.role_name + '</td><td>' + (r.gender || '-') + '</td><td>' + (r.age_stage || '-') + '</td><td>' + (r.identity || '-') + '</td><td class="col-personality">' + ((r.personality || []).join('、') || '-') + '</td><td><span class="role-type-tag" style="background:' + c + '">' + (r.role_type || '-') + '</span></td><td class="col-importance"><span class="imp-bar-bg"><span class="imp-bar-fill" style="width:' + (r.importance || 50) + '%"></span></span><span class="imp-num">' + (r.importance || 0) + '</span></td></tr>'
  }
  wrap.innerHTML = h + '</tbody></table>'
}

function renderOperaRelationGraph() {
  var c = getChart('operaRelationGraph', true);
  if (!c) return;
  var raw = getRelationsByOpera(DataStore.currentOpera);
  if (!raw || !raw.length) { c.clear(); return }
  var roles = getRolesFromRolesFile(DataStore.currentOpera);
  var rtMap = {};
  for (var i = 0; i < roles.length; i++) { rtMap[roles[i].role_name] = roles[i].role_type; rtMap[roles[i].id] = roles[i].role_type }
  var nm = {}, nodes = [], links = [], catSet = new Set();
  for (var ri = 0; ri < raw.length; ri++) {
    var item = raw[ri];
    if (!item) continue;
    if (Array.isArray(item.nodes)) {
      for (var ni = 0; ni < item.nodes.length; ni++) {
        var n = item.nodes[ni];
        if (!n || !n.id || nm[n.id]) continue;
        nm[n.id] = true;
        var rt = n.role_type || rtMap[n.id] || '其他';
        catSet.add(rt);
        var dc = n.dialogue_count || 0, sc = n.scene_count || 0;
        nodes.push({ name: n.id, role_type: rt, importance: n.importance || 80, dialogue_count: dc, scene_count: sc, symbolSize: Math.max(16, Math.min(72, Math.sqrt(dc + sc * 5) * 5 + 8)), category: rt, itemStyle: { color: ROLE_COLORS[rt] || FALLBACK, shadowBlur: 12, shadowColor: 'rgba(255,200,100,0.3)' } })
      }
      for (var li = 0; li < item.links.length; li++) {
        var l = item.links[li];
        if (l && l.source && l.target) links.push({ source: l.source, target: l.target, relation: l.relation || '', emotion: l.emotion || '', interaction_count: l.interaction_count || 1, lineStyle: { width: Math.min(8, (l.interaction_count || 1) * 1.5) } })
      }
      continue
    }
    if (item.source && item.target) {
      if (!nm[item.source]) { nm[item.source] = true; nodes.push({ name: item.source, symbolSize: 30, category: '其他' }); catSet.add('其他') }
      if (!nm[item.target]) { nm[item.target] = true; nodes.push({ name: item.target, symbolSize: 25, category: '其他' }); catSet.add('其他') }
      links.push({ source: item.source, target: item.target, value: item.relation || '' })
    }
  }
  if (!nodes.length || !links.length) { c.clear(); return }
  var categories = [];
  catSet.forEach(function(rt) { categories.push({ name: rt, itemStyle: { color: ROLE_COLORS[rt] || FALLBACK } }) });
  c.setOption({ backgroundColor: 'transparent', tooltip: goldenTooltip(function(p) { return p.dataType === 'node' ? '<div style="font-weight:bold;color:#ffd27f;font-size:16px;">' + p.data.name + '</div><div style="color:#f5e6c8;line-height:1.8;">' + (p.data.role_type ? '行当：' + p.data.role_type + '<br/>' : '') + '台词：' + (p.data.dialogue_count || 0) + ' 句<br/>场次：' + (p.data.scene_count || 0) + ' 场</div>' : '<div style="font-weight:bold;color:#ffd27f;margin-bottom:4px;">' + p.data.source + ' → ' + p.data.target + '</div><div style="color:#f5e6c8;line-height:1.8;">关系：' + (p.data.relation || '-') + '<br/>' + (p.data.emotion ? '情绪：' + p.data.emotion + '<br/>' : '') + '交互：' + (p.data.interaction_count || 1) + ' 次</div>' }), legend: [{ data: categories.map(function(c) { return c.name }), top: 0, left: 'center', icon: 'circle', itemWidth: 14, itemHeight: 14, textStyle: { color: '#ffd27f', fontSize: 14 } }], series: [{ type: 'graph', layout: 'force', roam: true, draggable: true, focusNodeAdjacency: true, categories: categories, label: { show: true, color: '#fff', fontSize: 12, fontFamily: FONT_DISPLAY }, force: { repulsion: 300, edgeLength: [80, 200], gravity: 0.1, friction: 0.1 }, lineStyle: { color: 'source', opacity: 0.6, curveness: 0.2 }, emphasis: { focus: 'adjacency', lineStyle: { width: 3 } }, data: nodes, links: links }] })
}

function renderStorylineChart() {
  var c = getChart('storylineChart', true);
  if (!c) return;
  var story = getStorylineByOpera(DataStore.currentOpera);
  if (!story || !story.events || !story.events.length) { c.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无情节数据') }); return }
  var events = story.events, stages = events.map(function(e) { return e.stage }), emoV = events.map(function(e) { return e.emotion_value }), conV = events.map(function(e) { return e.conflict_level }), xIdx = stages.map(function(_, i) { return i });
  c.setOption({ backgroundColor: 'transparent', textStyle: { fontFamily: FONT_BODY }, tooltip: goldenTooltip(function(p) { var d = Array.isArray(p) ? p[0] : p; var e = d && events[d.dataIndex]; return e ? '<div style="font-weight:bold;color:#ffd27f;margin-bottom:6px;">第' + e.time_index + '幕 · ' + e.stage + '</div><div style="color:#f5e6c8;line-height:1.8;"><div>' + e.event + '</div><div style="margin-top:4px;"><span style="color:#e5b87b;">情绪：' + e.emotion_value + '（' + e.emotion_type + '）</span></div><div><span style="color:#c0392b;">冲突：' + e.conflict_level + '</span></div></div>' : '' }, { trigger: 'axis' }), legend: { data: ['情绪值', '冲突值'], textStyle: { color: COLORS.legendText, fontSize: 14 }, itemWidth: 14, itemHeight: 12, top: 0, right: 0 }, grid: { left: 45, right: 30, top: 32, bottom: 28 }, xAxis: { type: 'category', data: xIdx, axisLine: { lineStyle: { color: '#F5EFE3' } }, axisLabel: { color: '#F5EFE3', fontSize: 11, fontWeight: 'bold', interval: 0, rotate: 10, formatter: function(v) { return stages[parseInt(v)] || '' } }, splitLine: { show: false } }, yAxis: { type: 'value', min: 0, max: 100, axisLine: { lineStyle: { color: '#F5EFE3' } }, axisLabel: { color: '#F5EFE3', fontSize: 10 }, splitLine: { lineStyle: { color: COLORS.splitLine } } }, series: [{ name: '情绪值', type: 'line', smooth: true, symbol: 'pin', symbolSize: 24, lineStyle: { width: 2.5, color: '#d9a441' }, itemStyle: { color: '#d9a441', borderColor: 'transparent', borderWidth: 0 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(217,164,65,.35)' }, { offset: 1, color: 'rgba(217,164,65,.02)' }] } }, label: { show: true, position: 'inside', color: '#fff7e6', fontSize: 10, fontWeight: 'bold', formatter: function(p) { return p.value } }, data: emoV }, { name: '冲突值', type: 'line', smooth: true, symbol: 'pin', symbolSize: 24, lineStyle: { width: 2.5, color: '#b03a2e' }, itemStyle: { color: '#b03a2e', borderColor: 'transparent', borderWidth: 0 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(176,58,46,.35)' }, { offset: 1, color: 'rgba(176,58,46,.02)' }] } }, label: { show: true, position: 'inside', color: '#fff7e6', fontSize: 10, fontWeight: 'bold', formatter: function(p) { return p.value } }, data: conV }] })
}

function renderOperaThemeCloud() {
  var c = getChart('operaThemeCloud', true);
  if (!c) return;
  var themes = getThemesByOpera(DataStore.currentOpera);
  if (!themes || !themes.length) { c.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无主题数据') }); return }
  var kw = themes[0].theme_keywords || [];
  if (!kw.length) { c.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无主题关键词') }); return }
  c.setOption({ backgroundColor: 'transparent', tooltip: goldenTooltip(function(p) { var r = kw.find(function(k) { return k.word === p.name }); return r ? '<div style="font-weight:bold;color:#ffd27f;margin-bottom:4px;">' + r.word + '</div><div style="color:#f5e6c8;line-height:1.8;"><div>类型：' + (r.theme_type || '-') + '</div><div>情绪：' + (r.emotion || '-') + '</div><div>权重：' + r.value + '</div></div>' : '<div style="color:#ffd27f;">' + p.name + '</div><div>权重：' + p.value + '</div>' }), series: [{ type: 'wordCloud', shape: 'circle', width: '100%', height: '100%', sizeRange: [18, 64], rotationRange: [-30, 30], rotationStep: 15, gridSize: 5, drawOutOfBound: false, layoutAnimation: false, textStyle: { color: function(w) { var r = kw.find(function(k) { return k.word === w.name }); var clr = r && r.theme_type ? THEME_TYPE_COLORS[r.theme_type] : null; if (clr) return clr; var PALETTE = ['#D8A35D','#E8C88A','#C4A882','#D4A84B','#B57947','#F5D68A','#4B8A5F','#C9A45C','#3E6D8C','#A68B5E','#7B5B95','#E0BC6B','#8F7A5A','#6B8F6B']; return PALETTE[Math.floor(Math.random() * PALETTE.length)]; }, fontFamily: FONT_DISPLAY }, emphasis: { textStyle: { color: '#ffd27f', fontSize: 32, textShadowBlur: 10, textShadowColor: 'rgba(255,180,80,0.6)' } }, data: kw.map(function(k) { return { name: k.word, value: k.value } }) }] })
}

function renderStoryEvents() {
  var c = $id('storyEventList');
  if (!c) return;
  var story = getStorylineByOpera(DataStore.currentOpera);
  if (!story || !story.events || !story.events.length) { c.innerHTML = '<div class="empty-tip" style="padding:20px;text-align:center;">暂无事件数据</div>'; return }
  var events = story.events, html = '';
  for (var i = 0; i < events.length; i++) {
    var evt = events[i], s = STAGE_COLORS[evt.stage] || { color: FALLBACK, bg: 'rgba(138,122,106,.15)' };
    html += '<div class="story-event-item" style="border-left-color:' + s.color + ';"><div class="event-timeline-dot"><div class="dot-circle" style="border-color:' + s.color + ';"></div>' + (i < events.length - 1 ? '<div class="dot-line" style="background:' + s.color + ';"></div>' : '') + '</div><div class="event-body"><div class="event-stage-row"><span class="event-stage-badge" style="background:' + s.color + ';">' + evt.stage + '</span><span class="event-emotion-type">' + (evt.emotion_type || '') + '</span></div><div class="event-desc">' + evt.event + '</div><div class="event-metrics"><span>情绪：' + evt.emotion_value + '</span><span>冲突：<span class="conflict-bar-bg"><span class="conflict-bar-fill" style="width:' + evt.conflict_level + '%;"></span></span> ' + evt.conflict_level + '</span></div></div></div>'
  }
  c.innerHTML = html
}

function initSubPages() {
  var sankeySel = $id('sankeyDynastyFilter'), networkSel = $id('networkTypeFilter');
  function buildCustomSelect(selectEl, items, onChange) {
    if (!selectEl) return;
    items = items || [];
    var parent = selectEl.parentNode;
    var wrapper = document.createElement('div');
    wrapper.className = 'custom-dropdown';
    var trigger = document.createElement('div');
    trigger.className = 'custom-dropdown-trigger';
    trigger.textContent = items[0] || '全部';
    var menu = document.createElement('div');
    menu.className = 'custom-dropdown-menu';
    for (var i = 0; i < items.length; i++) {
      (function(val) {
        var item = document.createElement('div');
        item.className = 'custom-dropdown-item' + (i === 0 ? ' active' : '');
        item.textContent = val;
        item.dataset.value = val;
        menu.appendChild(item);
        item.onclick = function(e) {
          e.stopPropagation();
          trigger.textContent = val;
          var act = menu.querySelectorAll('.custom-dropdown-item');
          for (var ai = 0; ai < act.length; ai++) act[ai].classList.remove('active');
          item.classList.add('active');
          wrapper.classList.remove('open');
          if (onChange) onChange(val);
        };
      })(items[i]);
    }
    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);
    trigger.onclick = function(e) {
      e.stopPropagation();
      var openDds = document.querySelectorAll('.custom-dropdown.open');
      for (var oi = 0; oi < openDds.length; oi++) { if (openDds[oi] !== wrapper) openDds[oi].classList.remove('open'); }
      wrapper.classList.toggle('open');
    };
    parent.insertBefore(wrapper, selectEl);
    parent.removeChild(selectEl);
  }
  /* sankey filter now controlled by timeline */
  if (networkSel) {
    var ts = [...new Set((DataStore.operaCompact || []).map(function(o) { return normalizeType(o.opera_type) }).filter(Boolean))];
    ts.unshift('全部');
    buildCustomSelect(networkSel, ts, function(val) { _networkFilter = val; renderRelationNetwork(val) });
  }
  document.addEventListener('click', function() {
    var openDds = document.querySelectorAll('.custom-dropdown.open');
          for (var oi = 0; oi < openDds.length; oi++) openDds[oi].classList.remove('open');
    });
    var prev = $id('prevOperaBtn'), next = $id('nextOperaBtn');
    if (prev) prev.onclick = function() { prevOpera() };
    if (next) next.onclick = function() { nextOpera() };
  }
