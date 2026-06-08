/* =========================================
   utils.js
   戏韵万象 · 公共工具函数
========================================= */

function $$(selector) { return document.querySelectorAll(selector) }

function createElement(tag, className, html) {
  var el = document.createElement(tag)
  if (className) el.className = className
  if (html) el.innerHTML = html
  return el
}

function debounce(fn, delay) {
  delay = delay || 300
  var timer = null
  return function() {
    var ctx = this, args = arguments
    clearTimeout(timer)
    timer = setTimeout(function() { fn.apply(ctx, args) }, delay)
  }
}
