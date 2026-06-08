/* =========================================
   main.js — 戏韵万象 · 京剧数据可视分析系统
========================================= */

/* ===== 事件总线 ===== */
var EventBus = {
  _events: {},
  on: function(event, fn) { (this._events[event] = this._events[event] || []).push(fn) },
  off: function(event, fn) { var list = this._events[event]; if (list) { var i = list.indexOf(fn); if (i >= 0) list.splice(i, 1) } },
  emit: function(event, data) { var list = this._events[event]; if (list) { for (var i = 0; i < list.length; i++) list[i](data) } }
}

/* ===== 全局应用状态 ===== */
var AppState = {
  filters: {
    dynasty: '全部',
    operaType: null,
    sankeyNode: null,
    keyword: null,
    themeCategory: null
  },
  compareList: [],
  breadcrumb: [],
  navigateTo: null
}

var DYNASTY_LIST = ['全部','春秋战国','秦汉','三国两晋','隋唐五代','宋','元','明','清','近现代','未识别']
var DYNASTY_PERIOD = { '春秋战国':'前770—前221','秦汉':'前221—220','三国两晋':'220—420','隋唐五代':'581—960','宋':'960—1279','元':'1271—1368','明':'1368—1644','清':'1644—1912','近现代':'1912—至今','未识别':'未分类','全部':'全剧目' }
var TIMING = { PAGE_SWITCH: 30, RESIZE: 80, DEBOUNCE: 200, ANIMATION: 300 }

/* ===== 动态生成所有时间轴节点 ===== */
function generateTimelines() {
  var containers = $all('.timeline-items')
  for (var c = 0; c < containers.length; c++) {
    var html = ''
    for (var d = 0; d < DYNASTY_LIST.length; d++) {
      var dynasty = DYNASTY_LIST[d]
      html += '<div class="timeline-node' + (d === 0 ? ' active' : '') + '" data-dynasty="' + dynasty + '"><div class="dot"></div><h4>' + dynasty + '</h4><p>' + (DYNASTY_PERIOD[dynasty] || '') + '</p></div>'
    }
    containers[c].innerHTML = html
  }
}

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

/* ===== 页面切换辅助 ===== */
function switchToPage(pageId) {
  /* 释放上一页的图表实例（保留总览页面的图表） */
  var prevPage = document.querySelector('.page.active-page')
  if (prevPage && prevPage.id !== pageId && prevPage.id !== 'overviewPage') {
    for (var ck in _charts) {
      if (_charts.hasOwnProperty(ck) && _charts[ck] && !_charts[ck].isDisposed()) {
        /* 不释放 overview 页面的图表 */
        var dom = document.getElementById(ck)
        if (dom && dom.closest && !dom.closest('#overviewPage')) {
          try { _charts[ck].dispose(); unbindResize(_charts[ck]) } catch(e) {}
          _charts[ck] = null
        }
      }
    }
  }
  var pages = $all('.page')
  for (var i = 0; i < pages.length; i++) { pages[i].classList.remove('active-page') }
  var pg = $id(pageId)
  if (pg) pg.classList.add('active-page')
  switchBg(pageId)
  showHeaderBack(pageId !== 'overviewPage' && pageId !== '')
  var btns = $all('.nav-btn, .nav-sub-btn')
  for (var j = 0; j < btns.length; j++) { btns[j].classList.remove('active-nav') }
  for (var k = 0; k < btns.length; k++) { if (btns[k].dataset.page === pageId) btns[k].classList.add('active-nav') }
}

/* ===== 筛选标签栏渲染 ===== */
function renderFilterTags() {
  var bar = $id('filterTagBar')
  if (!bar) return
  var tags = []
  if (AppState.filters.dynasty && AppState.filters.dynasty !== '全部') {
    tags.push({ key: 'dynasty', label: AppState.filters.dynasty })
  }
  if (AppState.filters.operaType) {
    tags.push({ key: 'operaType', label: AppState.filters.operaType })
  }
  if (AppState.filters.keyword) {
    tags.push({ key: 'keyword', label: AppState.filters.keyword })
  }
  if (AppState.filters.themeCategory) {
    tags.push({ key: 'themeCategory', label: AppState.filters.themeCategory })
  }
  if (tags.length === 0) { bar.innerHTML = ''; return }
  var html = ''
  for (var i = 0; i < tags.length; i++) {
    html += '<span class="filter-tag"><span>' + tags[i].label + '</span><span class="tag-close" data-key="' + tags[i].key + '">×</span></span>'
  }
  html += '<span class="filter-tag-clear-all">清除全部</span>'
  bar.innerHTML = html
  var closes = bar.querySelectorAll('.tag-close')
  for (var ci = 0; ci < closes.length; ci++) {
    closes[ci].onclick = function() {
      var key = this.dataset.key
      EventBus.emit('filter:clear', { key: key })
    }
  }
  var clearAll = bar.querySelector('.filter-tag-clear-all')
  if (clearAll) {
    clearAll.onclick = function() { clearAllFilters() }
  }
}

/* ===== 面包屑导航 ===== */
function renderBreadcrumb() {
  var bc = $id('breadcrumbNav')
  if (!bc) return
  bc.style.display = 'none'; return
  var crumbs = []
  /* 朝代不显示在面包屑中 */
  if (AppState.filters.operaType) {
    crumbs.push({ label: AppState.filters.operaType })
  }
  if (AppState.filters.keyword) {
    crumbs.push({ label: '"' + AppState.filters.keyword + '"' })
  }
  if (AppState.filters.sankeyNode) {
    crumbs.push({ label: AppState.filters.sankeyNode.value })
  }
  if (crumbs.length === 0) { bc.innerHTML = ''; bc.style.display = 'none'; return }
  bc.style.display = 'flex'
  var html = ''
  for (var i = 0; i < crumbs.length; i++) {
    if (i > 0) html += '<span class="bc-sep"> ▸ </span>'
    if (i === crumbs.length - 1) {
      html += '<span class="bc-current">' + crumbs[i].label + '</span>'
    } else {
      html += '<span class="bc-link" data-idx="' + i + '">' + crumbs[i].label + '</span>'
    }
  }
  bc.innerHTML = html
  bc.querySelectorAll('.bc-link').forEach(function(el) {
    el.onclick = function() {
      var idx = parseInt(this.dataset.idx)
      if (idx === 0) {
        clearAllFilters()
        switchToPage('overviewPage')
        setTimeout(onResize, TIMING.RESIZE)
      }
    }
  })
}

/* ===== 核心筛选引擎 ===== */
function applyAllFilters() {
  var operas = DataStore.operaCompact || []

  if (AppState.filters.dynasty !== '全部') {
    operas = operas.filter(function(o) { return isOperaInDynasty(o.dynasty, AppState.filters.dynasty) })
  }
  if (AppState.filters.operaType) {
    operas = operas.filter(function(o) { return normalizeType(o.opera_type) === AppState.filters.operaType })
  }
  if (AppState.filters.sankeyNode) {
    var snNames = typeof getOperaNamesBySankeyNode === 'function' ? getOperaNamesBySankeyNode(AppState.filters.sankeyNode) : []
    operas = operas.filter(function(o) { return snNames.indexOf(o.opera_name) >= 0 })
  }
  if (AppState.filters.keyword) {
    var kwNames = typeof getOperaNamesByKeyword === 'function' ? getOperaNamesByKeyword(AppState.filters.keyword) : []
    operas = operas.filter(function(o) { return kwNames.indexOf(o.opera_name) >= 0 })
  }

  renderFilterTags()
  renderBreadcrumb()
  renderFilteredGrid(operas)

  var activePage = document.querySelector('.page.active-page')
  if (activePage && activePage.id !== 'overviewPage') {
    if (activePage.id === 'sankeyPage') {
      _sankeyFilter = AppState.filters.dynasty
      renderSankeyCompare(AppState.filters.dynasty)
    } else if (activePage.id === 'networkPage') {
      renderRelationNetwork(_networkFilter, AppState.filters.dynasty)
    } else if (activePage.id === 'sunburstPage') {
      renderThemeSunburst(AppState.filters.dynasty)
    } else if (activePage.id === 'overviewAnalysisPage') {
      renderComprehensiveAnalysis(AppState.filters.dynasty)
    }
  }

  /* 刷新总览桑基图 */
  try { renderRoleSankeyChart(AppState.filters.dynasty) } catch(e) {}
}

/* ===== 清除筛选 ===== */
function clearFilterByKey(key) {
  if (key === 'dynasty') { AppState.filters.dynasty = '全部'; currentDynasty = '全部' }
  if (key === 'operaType') { AppState.filters.operaType = null }
  if (key === 'sankeyNode') { AppState.filters.sankeyNode = null }
  if (key === 'keyword') { AppState.filters.keyword = null }
  if (key === 'themeCategory') { AppState.filters.themeCategory = null }
  applyAllFilters()
}

function clearAllFilters() {
  AppState.filters.dynasty = '全部'
  AppState.filters.operaType = null
  AppState.filters.sankeyNode = null
  AppState.filters.keyword = null
  AppState.filters.themeCategory = null
  currentDynasty = '全部'
  selectedOperaIndex = null
  DataStore.currentOpera = null
  AppState.navigateTo = null
  _sankeyFilter = '全部'
  _networkFilter = '全部'
  indexSearchKeyword = ''
  var inp = $id('indexSearchInput')
  if (inp) inp.value = ''
  applyAllFilters()
  try { renderRoleSankeyChart('全部') } catch(e) {}
  try { initTypeAreaChart() } catch(e) {}
  try { initThemeCloud() } catch(e) {}
  /* 高亮全部 timeline node */
  $all('.timeline-node').forEach(function(n) {
    n.classList.remove('active')
    if (n.dataset.dynasty === '全部') n.classList.add('active')
  })
}

/* ===== 筛选后的网格渲染（复用的 initGrid 核心逻辑） ===== */
function renderFilteredGrid(operas) {
  var grid = $id('operaIndexGrid')
  if (!grid) return
  if (indexSearchKeyword) operas = operas.filter(function(o) { return o.opera_name && o.opera_name.includes(indexSearchKeyword) })
  if (selectedOperaIndex !== null && selectedOperaIndex >= operas.length) selectedOperaIndex = null
  if (!operas || !operas.length) { grid.innerHTML = '<div class="opera-index-empty">暂无匹配剧目</div>'; return }
  var html = ''
  for (var i = 0; i < operas.length; i++) {
    var op = operas[i]
    var isCompared = AppState.compareList.indexOf(op.opera_name) >= 0
    html += '<div class="opera-index-tile' + (i === selectedOperaIndex ? ' selected' : '') + (isCompared ? ' compared' : '') + '" data-idx="' + i + '" data-opera="' + op.opera_name + '"><div class="tile-name">' + op.opera_name + '</div><div class="tile-meta">' + (op.dynasty || '') + '</div><div class="tile-badge">' + normalizeType(op.opera_type) + '</div></div>'
  }
  grid.innerHTML = html
  bindGridTileEvents(grid, operas)
}

var _compareModeActive = false

function toggleCompareMode() {
  _compareModeActive = !_compareModeActive
  var btn = document.getElementById('compareToggleBtn')
  if (btn) {
    btn.textContent = _compareModeActive ? '◆ 对比中…' : '◆ 对比模式'
    btn.classList.toggle('active', _compareModeActive)
  }
  if (!_compareModeActive) {
    AppState.compareList = []
    closeCompareModal()
    updateCompareCount()
    applyAllFilters()
  }
}

function updateCompareCount() {
  var el = document.getElementById('compareCount')
  if (!el) return
  if (_compareModeActive && AppState.compareList.length >= 2) {
    el.innerHTML = '已选 ' + AppState.compareList.length + '/3 <button class="compare-go-btn" onclick="openCompareModal()">◇ 确定</button>'
  } else if (_compareModeActive && AppState.compareList.length > 0) {
    el.textContent = '已选 ' + AppState.compareList.length + '/3（需选2部以上）'
  } else if (_compareModeActive) {
    el.textContent = '点击剧目选择（最多3部）'
  } else {
    el.textContent = ''
  }
}

function bindGridTileEvents(grid, operas) {
  grid.querySelectorAll('.opera-index-tile').forEach(function(tile) {
    tile.onclick = function(e) {
      var idx = parseInt(tile.dataset.idx)
      var opName = tile.dataset.opera

      /* 对比模式：点击切换选中 */
      if (_compareModeActive) {
        var pos = AppState.compareList.indexOf(opName)
        if (pos >= 0) {
          AppState.compareList.splice(pos, 1)
        } else {
          if (AppState.compareList.length >= 3) {
            AppState.compareList.shift()
          }
          AppState.compareList.push(opName)
        }
        updateCompareCount()
        renderFilteredGrid(operas)
        return
      }

      /* 普通模式：跳转剧目详情 */
      selectedOperaIndex = idx
      DataStore.currentOpera = operas[idx].opera_name
      grid.querySelectorAll('.opera-index-tile').forEach(function(el) { el.classList.remove('selected') })
      tile.classList.add('selected')
      switchToPage('operaPage')
      showHeaderBack(true)
      renderBreadcrumb()
      initOperaPage()
    }
  })
}

window.onload = function() {
  $_db = $('.dashboard');
  window.addEventListener('resize', onResize);
  onResize();
  switchBg('overviewPage');
  loadAllData();
  console.log('全部数据加载成功');
  if (DataStore.operaBasic && DataStore.operaBasic.length) DataStore.currentOpera = DataStore.operaBasic[0].opera_name;
  try { generateTimelines() } catch(e) { console.warn(e) }
  try { initTypeAreaChart() } catch(e) { console.warn(e) }
  try { initThemeCloud() } catch(e) { console.warn(e) }
  try { initPageSwitch() } catch(e) { console.warn(e) }
  try { initTimeline() } catch(e) { console.warn(e) }
  try { initSearch() } catch(e) { console.warn(e) }
  try { renderRoleSankeyChart('全部') } catch(e) { console.warn(e) }
  try { initGrid() } catch(e) { console.warn(e) }
  try { initSubPages() } catch(e) { console.warn(e) }

  /* ===== EventBus 监听器（带防抖） ===== */
  var debouncedApply = debounce(function() { applyAllFilters() }, TIMING.DEBOUNCE)
  EventBus.on('filter:change', function(data) {
    if (data.key === 'dynasty') {
      AppState.filters.dynasty = data.value
      currentDynasty = data.value
      _sankeyFilter = data.value
    }
    if (data.key === 'operaType') AppState.filters.operaType = data.value
    if (data.key === 'sankeyNode') AppState.filters.sankeyNode = data.value
    if (data.key === 'keyword') AppState.filters.keyword = data.value
    if (data.key === 'themeCategory') AppState.filters.themeCategory = data.value
    debouncedApply()
  })

  EventBus.on('filter:clear', function(data) {
    clearFilterByKey(data.key)
  })

  EventBus.on('navigate:opera', function(data) {
    clearAllFilters()
    DataStore.currentOpera = data.operaName
    switchToPage('operaPage')
    showHeaderBack(true)
    renderBreadcrumb()
    initOperaPage()
    setTimeout(onResize, 80)
  })

  EventBus.on('navigate:page', function(data) {
    var ctx = data.context || null
    AppState.navigateTo = ctx
    switchToPage(data.pageId)
    if (data.pageId === 'sankeyPage') {
      renderSankeyCompare(AppState.filters.dynasty)
    } else if (data.pageId === 'networkPage') {
      var roleType = (ctx && ctx.roleType) ? ctx.roleType : null
      renderRelationNetwork(_networkFilter, AppState.filters.dynasty, roleType)
    } else if (data.pageId === 'sunburstPage') {
      renderThemeSunburst(AppState.filters.dynasty)
    } else if (data.pageId === 'overviewAnalysisPage') {
      renderComprehensiveAnalysis(AppState.filters.dynasty)
    }
    setTimeout(onResize, 80)
    AppState.navigateTo = null
  })

  EventBus.on('compare:clear', function() {
    AppState.compareList = []
    closeCompareModal()
    applyAllFilters()
  })

  /* 初始渲染 */
  renderFilterTags()
  renderBreadcrumb()
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
      if (id === 'operaPage') { setTimeout(initOperaPage, TIMING.PAGE_SWITCH); onResize(); return }
      var fn = {
        sankeyPage: function() { renderSankeyCompare(_sankeyFilter) },
        networkPage: function() { renderRelationNetwork(_networkFilter, currentDynasty) },
        sunburstPage: function() { renderThemeSunburst(currentDynasty) },
        overviewAnalysisPage: function() { renderComprehensiveAnalysis(currentDynasty) }
      }[id];
      if (fn) { setTimeout(fn, TIMING.PAGE_SWITCH); setTimeout(onResize, TIMING.RESIZE) }
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
      AppState.filters.dynasty = currentDynasty;
      selectedOperaIndex = null;
      _sankeyFilter = currentDynasty;
      EventBus.emit('filter:change', { key: 'dynasty', value: currentDynasty });
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
  c.off('click').on('click', function(params) {
    if (params.name && params.name !== '其他') {
      AppState.filters.operaType = params.name
      applyAllFilters()
    }
  })
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
  c.off('click').on('click', function(params) {
    if (params.name) {
      AppState.filters.keyword = params.name
      applyAllFilters()
    }
  })
}

function initGrid() {
  var operas = getOperasByTimelineDynasty(currentDynasty);
  renderFilteredGrid(operas);
}

function initSearch() {
  var inp = $id('indexSearchInput');
  if (!inp) return;
  inp.addEventListener('input', function() { indexSearchKeyword = inp.value.trim(); selectedOperaIndex = null; applyAllFilters() })
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
  card.innerHTML = '<div class="overview-card-header"><div class="opera-name">' + op.opera_name + '</div><div class="opera-tags"><span>' + (op.dynasty || '未知') + '</span><span>' + (op.opera_type || '未知') + '</span></div></div><div class="overview-card-body"><div class="info-row"><div class="label">主要人物</div><div class="value">' + (roles.join('、') || '—') + '</div></div><div class="info-row"><div class="label">核心场景</div><div class="value">' + (ce.core_scene || '—') + '</div></div><div class="info-row"><div class="label">核心冲突</div><div class="value">' + (ce.core_conflict || '—') + '</div></div><div class="info-row"><div class="label">情绪关键词</div><div class="value"><div class="keyword-tags">' + (kw.map(function(k) { return '<span class="keyword-tag">' + k + '</span>' }).join('') || '—') + '</div></div></div><div class="overview-card-links"><span class="link-btn" onclick="EventBus.emit(\'navigate:page\',{pageId:\'sankeyPage\',context:{highlightRole:true,operaName:\'' + op.opera_name + '\'}})">◆ 查看行当分布</span><span class="link-btn" onclick="EventBus.emit(\'navigate:page\',{pageId:\'overviewAnalysisPage\',context:{highlightOpera:\'' + op.opera_name + '\'}})">◇ 在综合分析中定位</span></div></div>'
}

function renderRoleTable() {
  var wrap = $id('operaRoleTable');
  if (!wrap) return;
  var roles = getRolesFromRolesFile(DataStore.currentOpera);
  if (!roles || !roles.length) { wrap.innerHTML = '<div class="empty-tip" style="padding:20px;text-align:center;">暂无角色数据</div>'; return }
  var h = '<table><thead><tr><th>角色</th><th>性别</th><th>年龄</th><th>身份</th><th>性格</th><th>行当</th><th>重要度</th></tr></thead><tbody>';
  for (var i = 0; i < roles.length; i++) {
    var r = roles[i], c = ROLE_COLORS[r.role_type] || FALLBACK;
    h += '<tr data-role="' + r.role_name + '" style="cursor:pointer"><td>' + r.role_name + '</td><td>' + (r.gender || '-') + '</td><td>' + (r.age_stage || '-') + '</td><td>' + (r.identity || '-') + '</td><td class="col-personality">' + ((r.personality || []).join('、') || '-') + '</td><td><span class="role-type-tag" style="background:' + c + '">' + (r.role_type || '-') + '</span></td><td class="col-importance"><span class="imp-bar-bg"><span class="imp-bar-fill" style="width:' + (r.importance || 50) + '%"></span></span><span class="imp-num">' + (r.importance || 0) + '</span></td></tr>'
  }
  wrap.innerHTML = h + '</tbody></table>'
  /* 角色表行点击 → 高亮关系图中对应节点 */
  wrap.querySelectorAll('tr[data-role]').forEach(function(tr) {
    tr.onclick = function() {
      var roleName = tr.dataset.role
      /* 切换高亮/取消表格行 */
      var wasHighlighted = tr.classList.contains('highlighted')
      var prev = wrap.querySelector('tr.highlighted')
      if (prev) prev.classList.remove('highlighted')
      /* 如果之前就是高亮状态，取消后直接返回 */
      if (wasHighlighted) { return }
      tr.classList.add('highlighted')
      /* 在关系图中高亮该角色节点 */
      var graphChart = _charts['operaRelationGraph']
      if (graphChart && !graphChart.isDisposed()) {
        graphChart.dispatchAction({ type: 'downplay', seriesIndex: 0 })
        graphChart.dispatchAction({ type: 'highlight', seriesIndex: 0, name: roleName })
      }
    }
  })
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
  c.off('click').on('click', function(params) {
    if (params.name) {
      EventBus.emit('navigate:page', { pageId: 'sunburstPage', context: { keyword: params.name } })
    }
  })
}

function renderStoryEvents() {
  var c = $id('storyEventList');
  if (!c) return;
  var story = getStorylineByOpera(DataStore.currentOpera);
  if (!story || !story.events || !story.events.length) { c.innerHTML = '<div class="empty-tip" style="padding:20px;text-align:center;">暂无事件数据</div>'; return }
  var events = story.events, html = '';
  for (var i = 0; i < events.length; i++) {
    var evt = events[i], s = STAGE_COLORS[evt.stage] || { color: FALLBACK, bg: 'rgba(138,122,106,.15)' };
    html += '<div class="story-event-item" data-event-idx="' + i + '" style="border-left-color:' + s.color + ';cursor:pointer;"><div class="event-timeline-dot"><div class="dot-circle" style="border-color:' + s.color + ';"></div>' + (i < events.length - 1 ? '<div class="dot-line" style="background:' + s.color + ';"></div>' : '') + '</div><div class="event-body"><div class="event-stage-row"><span class="event-stage-badge" style="background:' + s.color + ';">' + evt.stage + '</span><span class="event-emotion-type">' + (evt.emotion_type || '') + '</span></div><div class="event-desc">' + evt.event + '</div><div class="event-metrics"><span>情绪：' + evt.emotion_value + '</span><span>冲突：<span class="conflict-bar-bg"><span class="conflict-bar-fill" style="width:' + evt.conflict_level + '%;"></span></span> ' + evt.conflict_level + '</span></div></div></div>'
  }
  c.innerHTML = html
  /* 事件点击 → 在情节折线图中显示对应数据点 tooltip */
  c.querySelectorAll('.story-event-item').forEach(function(item) {
    item.onclick = function() {
      var idx = parseInt(item.dataset.eventIdx)
      var prev = c.querySelector('.story-event-item.highlighted')
      if (prev) prev.classList.remove('highlighted')
      if (item.classList.contains('highlighted')) { item.classList.remove('highlighted'); return }
      item.classList.add('highlighted')
      var lineChart = _charts['storylineChart']
      if (lineChart && !lineChart.isDisposed()) {
        lineChart.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: idx })
        lineChart.dispatchAction({ type: 'showTip', seriesIndex: 1, dataIndex: idx })
      }
    }
  })
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
    buildCustomSelect(networkSel, ts, function(val) { _networkFilter = val; renderRelationNetwork(val, currentDynasty) });
  }
  document.addEventListener('click', function() {
    var openDds = document.querySelectorAll('.custom-dropdown.open');
          for (var oi = 0; oi < openDds.length; oi++) openDds[oi].classList.remove('open');
    });
    var prev = $id('prevOperaBtn'), next = $id('nextOperaBtn');
    if (prev) prev.onclick = function() { prevOpera() };
    if (next) next.onclick = function() { nextOpera() };
  }

/* =========================================
   剧本对比模式
========================================= */
function openCompareModal() {
  var modal = $id('compareModal')
  if (!modal) return
  modal.classList.add('show')
  renderCompareCharts()
}

function closeCompareModal() {
  var modal = $id('compareModal')
  if (!modal) return
  modal.classList.remove('show')
  /* dispose 对比图表实例 */
  if (window.__compareInstances) {
    for (var i = 0; i < window.__compareInstances.length; i++) {
      try { window.__compareInstances[i].dispose() } catch(e) {}
    }
    window.__compareInstances = []
  }
  /* 退出对比模式 */
  _compareModeActive = false
  AppState.compareList = []
  var btn = document.getElementById('compareToggleBtn')
  if (btn) { btn.textContent = '◆ 对比模式'; btn.classList.remove('active') }
  updateCompareCount()
  applyAllFilters()
}

function renderCompareCharts() {
  if (AppState.compareList.length < 2) return
  window.__compareInstances = window.__compareInstances || []
  var cols = document.querySelectorAll('.compare-col')
  if (!cols.length) return

  for (var i = 0; i < Math.min(AppState.compareList.length, 3); i++) {
    var opName = AppState.compareList[i]
    var col = cols[i]
    if (!col) continue

    /* 标题 */
    var titleEl = col.querySelector('.compare-col-title')
    if (titleEl) titleEl.textContent = opName

    /* 基本信息 */
    var infoEl = col.querySelector('.compare-col-info')
    if (infoEl) {
      var op = getOperaBasicByName(opName)
      infoEl.textContent = (op ? (op.dynasty || '') + ' · ' + normalizeType(op.opera_type || '') : '')
    }

    /* 渲染小型关系图 */
    var graphDom = col.querySelector('.compare-graph')
    if (graphDom) {
      var inst = echarts.init(graphDom)
      window.__compareInstances.push(inst)
      var raw = getRelationsByOpera(opName)
      renderMiniGraph(inst, raw, opName)
    }

    /* 统计数字 */
    var statsDom = col.querySelector('.compare-stats')
    if (statsDom) {
      var roles = getRolesFromRolesFile(opName)
      var story = getStorylineByOpera(opName)
      var themes = getThemesByOpera(opName)
      var events = story && story.events || []
      var avgConflict = events.length ? (events.reduce(function(s, e) { return s + (e.conflict_level || 0) }, 0) / events.length).toFixed(0) : '-'
      var avgEmotion = events.length ? (events.reduce(function(s, e) { return s + (e.emotion_value || 0) }, 0) / events.length).toFixed(0) : '-'
      statsDom.innerHTML = '<div class="compare-stat-row"><span>角色</span><span>' + roles.length + '</span></div>' +
        '<div class="compare-stat-row"><span>事件</span><span>' + events.length + '</span></div>' +
        '<div class="compare-stat-row"><span>均冲突</span><span>' + avgConflict + '</span></div>' +
        '<div class="compare-stat-row"><span>均情绪</span><span>' + avgEmotion + '</span></div>'
    }

    /* 主题关键词（单行显示） */
    var themesDom = col.querySelector('.compare-themes')
    if (themesDom && themes.length > 0) {
      var kws = themes[0].theme_keywords || []
      var topKws = kws.sort(function(a, b) { return (b.value || 0) - (a.value || 0) })
      var themeHtml = ''
      for (var ti = 0; ti < topKws.length; ti++) {
        var tw = topKws[ti]
        var catIdx = classifyThemeType(tw.theme_type)
        var color = (catIdx >= 0 && THEME_CATEGORIES[catIdx]) ? THEME_CATEGORIES[catIdx].color : '#8a7a6a'
        themeHtml += '<span style="color:' + color + ';font-size:11px;font-family:var(--font-serif);font-weight:700;">' + tw.word + '</span>' + (ti < topKws.length - 1 ? '<span style="color:rgba(242,217,186,.3);margin:0 6px;">|</span>' : '')
      }
      themesDom.innerHTML = '<div style="text-align:center;padding:4px 0;">' + themeHtml + '</div>'
    }

    /* 渲染小型折线图 */
    var lineDom = col.querySelector('.compare-line')
    if (lineDom) {
      var lineInst = echarts.init(lineDom)
      window.__compareInstances.push(lineInst)
      renderMiniStoryline(lineInst, story)
    }
  }
}

function renderMiniGraph(inst, raw, opName) {
  var roles = getRolesFromRolesFile(opName)
  var rtMap = {}
  for (var ri = 0; ri < roles.length; ri++) { rtMap[roles[ri].role_name] = roles[ri].role_type }
  var nm = {}, nodes = [], links = []
  raw.forEach(function(item) {
    if (!item || !Array.isArray(item.nodes)) return
    item.nodes.forEach(function(n) {
      var id = n.id || n.name || ''; if (!id || nm[id]) return; nm[id] = true
      var rt = n.role_type || rtMap[id] || '其他'
      nodes.push({ name: id, symbolSize: Math.max(10, Math.min(24, (n.dialogue_count || 1) * 3 + 5)), itemStyle: { color: ROLE_COLORS[rt] || FALLBACK }, label: { show: true, fontSize: 11, color: '#fff', fontFamily: FONT_DISPLAY, fontWeight: 'bold' } })
    })
    ;(item.links || []).forEach(function(l) {
      if (l && l.source && l.target) links.push({ source: l.source, target: l.target, lineStyle: { width: 1, opacity: 0.6 } })
    })
  })
  inst.setOption({
    backgroundColor: 'transparent',
    series: [{ type: 'graph', layout: 'circular', roam: false, draggable: false, data: nodes, links: links, label: { show: true, fontSize: 11, color: '#fff', fontFamily: FONT_DISPLAY, fontWeight: 'bold' } }]
  })
}

function renderMiniStoryline(inst, story) {
  if (!story || !story.events || !story.events.length) { inst.setOption({ backgroundColor: 'transparent', ...emptyTitle('暂无数据') }); return }
  var events = story.events
  inst.setOption({
    backgroundColor: 'transparent',
    grid: { left: 30, right: 10, top: 10, bottom: 20 },
    xAxis: { type: 'category', data: events.map(function(_, i) { return i + 1 }), axisLabel: { color: '#F5EFE3', fontSize: 8 }, axisLine: { lineStyle: { color: '#F5EFE3' } } },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { color: '#F5EFE3', fontSize: 8 }, splitLine: { lineStyle: { color: COLORS.splitLine } } },
    series: [
      { name: '情绪', type: 'line', smooth: true, symbol: 'none', lineStyle: { width: 1.5, color: '#d9a441' }, data: events.map(function(e) { return e.emotion_value }) },
      { name: '冲突', type: 'line', smooth: true, symbol: 'none', lineStyle: { width: 1.5, color: '#b03a2e' }, data: events.map(function(e) { return e.conflict_level }) }
    ]
  })
}

window.openCompareModal = openCompareModal
window.closeCompareModal = closeCompareModal
window.toggleCompareMode = toggleCompareMode
window.confirmCompare = confirmCompare

function confirmCompare() {
  /* 关闭弹窗，退出对比模式，保留对比列表供查看 */
  var modal = $id('compareModal')
  if (!modal) return
  modal.classList.remove('show')
  _compareModeActive = false
  var btn = document.getElementById('compareToggleBtn')
  if (btn) { btn.textContent = '◆ 对比模式'; btn.classList.remove('active') }
  updateCompareCount()
  applyAllFilters()
}
