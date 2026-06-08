;(function () {
  /* =========================================
   themeSunburst.js — 主题结构矩形树图
   二层嵌套：十大类别框（不显示标签）→ 主题词
  ========================================= */

  var instance = null
  var _sunDynasty = '全部'
  var _selectedKeyword = null
  var _comboMode = 'word' // 'word' | 'category'

  /* 使用 chartTheme.js 中的共享 THEME_CATEGORIES 和 classifyThemeType() */
  var CATEGORIES = THEME_CATEGORIES

  var MAX_KEYWORDS_PER_CATEGORY = 18

  /* classifyThemeType 已统一在 chartTheme.js 中定义，此处通过闭包引用 */

  var _localClassify = classifyThemeType; // 保持局部引用以避免全局查找

  /* classifyThemeType 已统一在 chartTheme.js 中定义 */

  function buildAllData (dynasty) {
    /* 按朝代筛选有效剧目名 */
    var validOperas = null
    if (dynasty && dynasty !== '全部') {
      validOperas = {}
      ;(DataStore.operaCompact || []).forEach(function(o) {
        if (isOperaInDynasty(o.dynasty, dynasty)) validOperas[o.opera_name] = true
      })
    }
    var categoryKwMap = {}
    for (var ci = 0; ci < CATEGORIES.length; ci++) {
      categoryKwMap[ci] = {}
    }
    ;(DataStore.operaThemes || []).forEach(function (item) {
      /* 朝代筛选 */
      if (validOperas) {
        var itemOpera = item.opera_name || item.opera || ''
        if (!validOperas[itemOpera]) return
      }
      var kws = item.theme_keywords || []
      if (!kws.length) return
      kws.forEach(function (kw) {
        var w = kw.word,
          t = kw.theme_type
        if (!w || !t || w === 'undefined' || t === 'undefined') return
        var ci = classifyThemeType(t)
        if (ci < 0 || ci >= CATEGORIES.length) return
        if (!categoryKwMap[ci][w]) categoryKwMap[ci][w] = 0
        categoryKwMap[ci][w]++
      })
    })
    var wordBestCat = {}
    for (var ci = 0; ci < CATEGORIES.length; ci++) {
      var kwMap = categoryKwMap[ci]
      if (!kwMap) continue
      for (var w in kwMap) {
        if (!kwMap.hasOwnProperty(w)) continue
        var cnt = kwMap[w]
        if (!wordBestCat[w] || cnt > wordBestCat[w].count) {
          wordBestCat[w] = { catIdx: ci, count: cnt }
        }
      }
    }
    var deduped = {}
    for (var ci = 0; ci < CATEGORIES.length; ci++) {
      deduped[ci] = {}
    }
    for (var w in wordBestCat) {
      if (!wordBestCat.hasOwnProperty(w)) continue
      var info = wordBestCat[w]
      deduped[info.catIdx][w] = info.count
    }
    var result = []
    CATEGORIES.forEach(function (cat, ci) {
      var kwMap = deduped[ci]
      if (!kwMap) return
      var kwList = Object.keys(kwMap)
        .filter(function (k) {
          return k && k !== 'undefined'
        })
        .map(function (k) {
          return { word: k, count: kwMap[k] }
        })
        .sort(function (a, b) {
          return b.count - a.count
        })
        .slice(0, MAX_KEYWORDS_PER_CATEGORY)
      if (!kwList.length) return
      result.push({
        name: cat.name,
        value: kwList.reduce(function (s, k) {
          return s + k.count
        }, 0),
        itemStyle: {
          color: cat.color,
          borderColor: 'transparent',
          borderWidth: 1
        },
        children: kwList.map(function (kw) {
          return {
            name: kw.word,
            value: kw.count,
            itemStyle: { color: cat.color }
          }
        })
      })
    })
    return result
  }

  function renderThemeSunburst (dynasty) {
    if (dynasty === undefined) dynasty = '全部'
    _sunDynasty = dynasty
    var dom = document.getElementById('themeSunburst')
    if (!dom) return
    if (instance) {
      instance.dispose()
      instance = null
    }
    dom.innerHTML = ''
    var allData = buildAllData(dynasty)
    if (!allData.length) {
      instance = echarts.init(dom)
      instance.setOption({
        backgroundColor: 'transparent',
        ...emptyTitle('暂无主题数据')
      })
      return
    }
    var treeData = { name: '主题结构', children: allData }
    var kwTotal = 0
    allData.forEach(function (cat) {
      kwTotal += (cat.children || []).length
    })
    instance = echarts.init(dom)
    instance.setOption({
      backgroundColor: 'transparent',
      textStyle: { fontFamily: FONT_BODY },
      animationDuration: 600,
      animationDurationUpdate: 300,
      animationEasing: 'cubicOut',
      tooltip: goldenTooltip(function (p) {
        var d = p.data,
          path = p.treePathInfo || []
        if (!d.children || !d.children.length) {
          var catName = path.length >= 3 ? path[path.length - 2].name : '—'
          return (
            '<div style="font-weight:bold;color:#ffd27f;font-family:' +
            FONT_DISPLAY +
            ';font-size:16px;margin-bottom:4px;">' +
            d.name +
            '</div><div style="color:#f5e6c8;line-height:1.8;font-size:13px;">类别：' +
            catName +
            '<br/>出现 ' +
            (d.value || 0) +
            ' 次</div>'
          )
        }
        if (d.name === '主题结构') {
          return (
            '<div style="font-weight:bold;color:#ffd27f;font-family:' +
            FONT_DISPLAY +
            ';font-size:17px;margin-bottom:4px;">主题词分布</div><div style="color:#f5e6c8;line-height:1.8;font-size:13px;">' +
            allData.length +
            ' 个语义大类 · ' +
            kwTotal +
            ' 个核心主题词</div>'
          )
        }
        return (
          '<div style="font-weight:bold;color:#ffd27f;font-family:' +
          FONT_DISPLAY +
          ';font-size:15px;margin-bottom:4px;">' +
          d.name +
          '</div><div style="color:#f5e6c8;line-height:1.8;font-size:12px;">' +
          (d.children || []).length +
          ' 个主题词</div>'
        )
      }),
      series: [
        {
          type: 'treemap',
          data: [treeData],
          sort: 'desc',
          roam: true,
          visibleMin: 1,
          nodeClick: 'zoomToNode',
          width: '100%',
          height: '100%',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          breadcrumb: {
            show: true,
            top: 0,
            left: 'center', height: 28,
            itemStyle: {
              color: 'rgba(130,32,26,0.85)',
              borderColor: 'rgba(216,163,93,0.5)',
              borderWidth: 1.5,
              borderRadius: 6,
              shadowBlur: 8,
              shadowColor: 'rgba(159,43,37,0.3)',
              textStyle: { color: '#f2d9ba', fontSize: 11, fontFamily: FONT_SERIF },
              emphasis: { color: 'rgba(159,43,37,0.9)', borderColor: '#D8A35D', shadowBlur: 14, shadowColor: 'rgba(255,200,100,0.4)', textStyle: { color: '#ffdca2' } }
            }
          },
          upperLabel: { show: false },
          label: {
            show: true, position: 'inside', align: 'center', verticalAlign: 'middle',
            fontSize: 15, fontWeight: 'bold', color: '#fffdf5',
            fontFamily: FONT_DISPLAY, textShadowBlur: 3, textShadowColor: 'rgba(0,0,0,0.6)',
            formatter: function (p) {
              if (!p.children || !p.children.length) return p.name
              return ''
            }
          },
          levels: [
            { itemStyle: { borderWidth: 0, gapWidth: 0 } },
            {
              colorMappingBy: 'value',
              itemStyle: { borderWidth: 1, borderColor: 'transparent', gapWidth: 4, borderRadius: 3 },
              upperLabel: { show: false },
              label: { show: false }
            },
            {
              colorMappingBy: 'value',
              itemStyle: { borderWidth: 1, borderColor: 'transparent', gapWidth: 1, borderRadius: 2 },
              label: {
                show: true, fontSize: 15, fontWeight: 'bold', color: '#fffdf5',
                fontFamily: FONT_DISPLAY, textShadowBlur: 3, textShadowColor: 'rgba(0,0,0,0.6)'
              }
            }
          ],
          itemStyle: { borderWidth: 0, gapWidth: 0 },
          emphasis: {
            itemStyle: { shadowBlur: 16, shadowColor: 'rgba(255,200,100,0.45)', borderColor: '#ffe08a', borderWidth: 2 },
            label: { fontSize: 17, color: '#ffd27f', fontWeight: 'bold' }
          }
        }]
      })

      instance.off('click').on('click', function (params) {
        if (!params || !params.data) return
        var d = params.data
        /* 点击关键词（叶子节点） */
        if (d.name !== '主题结构' && (!d.children || !d.children.length)) {
          _selectedKeyword = d.name
          renderTopCombos(_selectedKeyword)
        }
        /* 点击大类（有 children 的中间节点）→ 跳到综合分析 */
        if (d.children && d.children.length && d.name !== '主题结构') {
          var catIndex = -1
          for (var ci = 0; ci < CATEGORIES.length; ci++) {
            if (CATEGORIES[ci].name === d.name) { catIndex = ci; break }
          }
          if (catIndex >= 0) {
            EventBus.emit('navigate:page', { pageId: 'overviewAnalysisPage', context: { themeCategory: catIndex } })
          }
        }
      })

      bindResize(instance)
      /* 检查是否有外部导航来的关键词高亮 */
      if (typeof AppState !== 'undefined' && AppState.navigateTo && AppState.navigateTo.keyword) {
        _selectedKeyword = AppState.navigateTo.keyword
        renderTopCombos(_selectedKeyword)
      } else {
        renderTopCombos(null)
      }
    }

    function renderTopCombos (keyword) {
      var el = document.getElementById('themeTopCombos')
      if (!el) return
      /* 按朝代筛选有效剧目名 */
      var validOperas = null
      if (_sunDynasty && _sunDynasty !== '全部') {
        validOperas = {}
        ;(DataStore.operaCompact || []).forEach(function(o) {
          if (isOperaInDynasty(o.dynasty, _sunDynasty)) validOperas[o.opera_name] = true
        })
      }
      var data = DataStore.operaThemes || []

      /* ===== 构建 tabs 切换条（朱砂红底色） ===== */
      var tabWordActive = _comboMode === 'word'
      var tabCatActive = _comboMode === 'category'
      var tabBaseStyle = 'flex:1;height:32px;border-radius:8px;cursor:pointer;font-family:var(--font-serif);font-size:13px;font-weight:400;transition:all 250ms ease;letter-spacing:1px;white-space:nowrap;display:flex;align-items:center;justify-content:center;'
      var tabActiveStyle = tabBaseStyle + 'border:1px solid #C0392B;background:linear-gradient(135deg,#9F2B25,#B53430);color:#ffd27f;font-weight:700;box-shadow:0 0 14px rgba(159,43,37,.4);'
      var tabInactiveStyle = tabBaseStyle + 'border:1px solid rgba(201,133,42,.15);background:rgba(159,43,37,.18);color:rgba(214,176,143,.5);'
      var tabsHtml = '<div class="combo-dim-row">'
      tabsHtml += '<div style="' + (tabWordActive ? tabActiveStyle : tabInactiveStyle) + '" data-mode="word" onclick="window.__switchComboMode&&window.__switchComboMode(\'word\')">◆ 主题词组合</div>'
      tabsHtml += '<div style="' + (tabCatActive ? tabActiveStyle : tabInactiveStyle) + '" data-mode="category" onclick="window.__switchComboMode&&window.__switchComboMode(\'category\')">◇ 大类组合</div>'
      tabsHtml += '</div>'

      /* ===== 标题行（朱红色） ===== */
      var header = '<div class="combo-header" style="white-space:nowrap;display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:nowrap;color:#C0392B;text-shadow:0 0 10px rgba(192,57,43,.3);">'
      header += '<span>主题组合模式</span>'
      if (keyword) {
        header += '<span style="color:#ffd27f;font-weight:bold;">· "' + keyword + '"</span>'
        header += '<span class="combo-clear" style="color:#4a1510;cursor:pointer;font-size:11px;font-weight:700;flex-shrink:0;" onclick="event.stopPropagation();window.__clearKeywordFilter&&window.__clearKeywordFilter()">X 清除</span>'
      }
      header += '</div>'

      /* ===== 辅助函数：筛选剧目（≥ minKw 个关键词） ===== */
      function filterOperas (minKw) {
        var result = []
        data.forEach(function (item) {
          if (validOperas) {
            var itemOpera = item.opera_name || item.opera || ''
            if (!validOperas[itemOpera]) return
          }
          var kws = item.theme_keywords || []
          if (kws.length < minKw) return
          if (keyword) {
            var hasWord = false
            for (var ki = 0; ki < kws.length; ki++) {
              if (kws[ki].word === keyword) { hasWord = true; break }
            }
            if (!hasWord) return
          }
          result.push(item)
        })
        return result
      }

      /* ===== 渲染一条 combo-row ===== */
      function renderRow (nameHtml, count, maxCount, total) {
        var pct = total > 0 ? (count / total * 100).toFixed(1) : '0.0'
        return '<div class="combo-row"><div class="combo-name">' + nameHtml + '</div><div class="combo-bar-bg"><div class="combo-bar-fill" style="width:' + (count / maxCount * 100).toFixed(0) + '%"></div></div><div class="combo-stats">' + count + ' 部（' + pct + '%）</div></div>'
      }

      function buildWordPairs (items) {
        var map = {}
        items.forEach(function (item) {
          var kws = (item.theme_keywords || []).map(function (k) { return k.word }).filter(Boolean)
          for (var i = 0; i < kws.length; i++) {
            for (var j = i + 1; j < kws.length; j++) {
              var a = kws[i], b = kws[j]
              if (a === b) continue
              var key = [a, b].sort().join(' + ')
              if (!map[key]) map[key] = 0
              map[key]++
            }
          }
        })
        return Object.entries(map).sort(function (a, b) { return b[1] - a[1] })
      }

      function buildWordTriples (items) {
        var map = {}
        items.forEach(function (item) {
          var kws = (item.theme_keywords || []).map(function (k) { return k.word }).filter(Boolean)
          for (var i = 0; i < kws.length; i++) {
            for (var j = i + 1; j < kws.length; j++) {
              for (var wk = j + 1; wk < kws.length; wk++) {
                var t = [kws[i], kws[j], kws[wk]].sort()
                if (t[0] === t[1] || t[1] === t[2]) continue
                var key = t[0] + ' + ' + t[1] + ' + ' + t[2]
                if (!map[key]) map[key] = 0
                map[key]++
              }
            }
          }
        })
        return Object.entries(map).sort(function (a, b) { return b[1] - a[1] })
      }

      function buildCatPairs (items) {
        var map = {}
        items.forEach(function (item) {
          var kws = item.theme_keywords || []
          var catSet = {}
          for (var ki = 0; ki < kws.length; ki++) {
            var ci = classifyThemeType(kws[ki].theme_type)
            if (ci >= 0 && ci < CATEGORIES.length) catSet[ci] = true
          }
          var cats = Object.keys(catSet).map(function (c) { return parseInt(c, 10) })
          for (var i = 0; i < cats.length; i++) {
            for (var j = i + 1; j < cats.length; j++) {
              var pair = [cats[i], cats[j]].sort(function (x, y) { return x - y })
              var key = pair[0] + '|' + pair[1]
              if (!map[key]) map[key] = { cats: pair, count: 0 }
              map[key].count++
            }
          }
        })
        var arr = []
        for (var k in map) { if (map.hasOwnProperty(k)) arr.push(map[k]) }
        return arr.sort(function (a, b) { return b.count - a.count })
      }

      function buildCatTriples (items) {
        var map = {}
        items.forEach(function (item) {
          var kws = item.theme_keywords || []
          var catSet = {}
          for (var ki = 0; ki < kws.length; ki++) {
            var ci = classifyThemeType(kws[ki].theme_type)
            if (ci >= 0 && ci < CATEGORIES.length) catSet[ci] = true
          }
          var cats = Object.keys(catSet).map(function (c) { return parseInt(c, 10) })
          for (var i = 0; i < cats.length; i++) {
            for (var j = i + 1; j < cats.length; j++) {
              for (var wk = j + 1; wk < cats.length; wk++) {
                var t = [cats[i], cats[j], cats[wk]].sort(function (x, y) { return x - y })
                var key = t[0] + '|' + t[1] + '|' + t[2]
                if (!map[key]) map[key] = { cats: t, count: 0 }
                map[key].count++
              }
            }
          }
        })
        var arr = []
        for (var k in map) { if (map.hasOwnProperty(k)) arr.push(map[k]) }
        return arr.sort(function (a, b) { return b.count - a.count })
      }

      function formatWordName (raw, kw) {
        if (!kw) return raw
        return raw.replace(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '<span style="color:#ffd27f;font-weight:bold;">' + kw + '</span>')
      }

      function formatCatPairName (e) {
        var c0 = CATEGORIES[e.cats[0]], c1 = CATEGORIES[e.cats[1]]
        return '<span style="color:' + c0.color + ';font-weight:600;">' + c0.name + '</span> + <span style="color:' + c1.color + ';font-weight:600;">' + c1.name + '</span>'
      }

      function formatCatTripleName (e) {
        var c0 = CATEGORIES[e.cats[0]], c1 = CATEGORIES[e.cats[1]], c2 = CATEGORIES[e.cats[2]]
        return '<span style="color:' + c0.color + ';font-weight:600;">' + c0.name + '</span> + <span style="color:' + c1.color + ';font-weight:600;">' + c1.name + '</span> + <span style="color:' + c2.color + ';font-weight:600;">' + c2.name + '</span>'
      }

      /* ===== 计算并渲染（二元组 + 三元组合并排行） ===== */
      var html = tabsHtml + header
      var allRows = []

      if (_comboMode === 'category') {
        var catItems2 = filterOperas(2)
        var catTotal2 = catItems2.length
        var catPairs = buildCatPairs(catItems2)
        catPairs.forEach(function (e) {
          allRows.push({ nameHtml: formatCatPairName(e), count: e.count, total: catTotal2 })
        })

        var catItems3 = filterOperas(3)
        var catTotal3 = catItems3.length
        var catTriples = buildCatTriples(catItems3)
        catTriples.forEach(function (e) {
          allRows.push({ nameHtml: formatCatTripleName(e), count: e.count, total: catTotal3 })
        })

        allRows.sort(function (a, b) { return b.count - a.count })
        var catTop = allRows.slice(0, 20) // 15 pairs + 5 triples 合并取 20

        if (!catTop.length) {
          html += '<div class="combo-empty">' + (keyword ? '未找到含「' + keyword + '」的大类组合' : '暂无大类组合数据') + '</div>'
        } else {
          var maxAll = catTop[0].count
          html += catTop.map(function (e) { return renderRow(e.nameHtml, e.count, maxAll, e.total) }).join('')
        }
      } else {
        /* 主题词组合模式 */
        var wordItems2 = filterOperas(2)
        var wordTotal2 = wordItems2.length
        var wordPairs = buildWordPairs(wordItems2)
        wordPairs.forEach(function (e) {
          allRows.push({ nameHtml: formatWordName(e[0], keyword), count: e[1], total: wordTotal2 })
        })

        var wordItems3 = filterOperas(3)
        var wordTotal3 = wordItems3.length
        var wordTriples = buildWordTriples(wordItems3)
        wordTriples.forEach(function (e) {
          allRows.push({ nameHtml: formatWordName(e[0], keyword), count: e[1], total: wordTotal3 })
        })

        allRows.sort(function (a, b) { return b.count - a.count })
        var wordTop = allRows.slice(0, 25) // 20 pairs + 5 triples 合并取 25

        if (!wordTop.length) {
          html += '<div class="combo-empty">' + (keyword ? '未找到含「' + keyword + '」的主题组合' : '请点击矩形树图中的主题词<br/>查看高频组合') + '</div>'
        } else {
          var maxAllW = wordTop[0].count
          html += wordTop.map(function (e) { return renderRow(e.nameHtml, e.count, maxAllW, e.total) }).join('')
        }
      }

      el.innerHTML = html

      /* ===== 全局回调 ===== */
      window.__switchComboMode = function (mode) {
        _comboMode = mode
        renderTopCombos(_selectedKeyword)
      }
      if (keyword) {
        window.__clearKeywordFilter = function () { _selectedKeyword = null; renderTopCombos(null) }
      } else { window.__clearKeywordFilter = null }
    }

    window.renderThemeSunburst = renderThemeSunburst
    })();