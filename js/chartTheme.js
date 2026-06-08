/* =========================================
   chartTheme.js — 戏韵万象 · 统一图表主题
========================================= */

var FONT_DISPLAY = '"Ma Shan Zheng", "STKaiti", serif';
var FONT_SERIF = '"Noto Serif SC", "Source Han Serif SC", serif';
var FONT_BODY = '"Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif';

var JINGJU = {
  primary: '#9F2B25', primaryDark: '#7A1F1F', primaryLight: '#C54A3D',
  gold: '#D8A35D', goldLight: '#E8C88A', ochre: '#B57947', ivory: '#F5EFE3',
  qingyi: '#3E6D8C', jing: '#4B8A5F', laosheng: '#7B5B95',
  textPrimary: '#2C1810', textSecondary: '#6B5A4E', textMuted: '#9A8A7A', textOnDark: '#F5EFE3',
  bgPanel: 'rgba(255,248,240,0.65)', shadow: '0 2px 6px rgba(0,0,0,0.04)',
  border: 'rgba(150,100,70,0.12)', duration: 800,
  tooltipBg: 'rgba(44,24,16,0.95)', tooltipBorder: '#D8A35D',
  radius: 14, radiusSm: 8,
};

var COLORS = {
  text: '#6B5A4E', textDim: 'rgba(107,90,78,.6)', textLight: '#2C1810',
  textBright: '#D8A35D', gold: '#f2d9ba',
  tooltipBg: JINGJU.tooltipBg, tooltipBorder: JINGJU.tooltipBorder,
  axisLine: 'rgba(150,100,70,0.20)', splitLine: 'rgba(150,100,70,0.08)',
  axisLabel: '#F5EFE3', legendText: '#F5EFE3',
};

var ROLE_COLORS = {
  '老生': '#7B5B95', '小生': '#D8A35D', '武生': '#C94A38',
  '净': '#4B8A5F', '丑': '#8F7A5A', '外': '#3E6D8C',
  '末': '#6B5A4E', '旦': '#C94A38', '青衣': '#487FB7',
  '花旦': '#E87A5D', '老旦': '#9A6B8A', '彩旦': '#B57947',
};
var FALLBACK = '#9A8A7A';

var STAGE_COLORS = {
  '开端': { color: '#4B8A5F', bg: 'rgba(75,138,95,0.10)' },
  '发展': { color: '#D8A35D', bg: 'rgba(216,163,93,0.10)' },
  '冲突': { color: '#B57947', bg: 'rgba(181,121,71,0.10)' },
  '高潮': { color: '#C94A38', bg: 'rgba(201,74,56,0.10)' },
  '结局': { color: '#3E6D8C', bg: 'rgba(62,109,140,0.10)' },
};

var SERIES_COLORS = ['#A7372F','#D8A35D','#4B8A5F','#3E6D8C','#7B5B95','#B57947','#C94A38','#6B8F6B','#8F7A5A','#5B7A9E'];
var SANKEY_LAYER_COLORS = { '性别':'#C94A38','年龄':'#8F7A5A','身份':'#D8A35D','性格':'#7B5B95','表演':'#4B8A5F','行当':'#A7372F' };
var CLUSTER_COLORS = { '平稳型':'#4B8A5F','冲突激烈型':'#A7372F','情绪驱动型':'#D8A35D','权谋推进型':'#3E6D8C','家庭伦理型':'#7B5B95' };
var THEME_TYPE_COLORS = { '计谋':'#D8A35D','斗争':'#A7372F','军事':'#B57947','人物品质':'#C94A38','战争事件':'#7B5B95','结果':'#4B8A5F','伦理':'#3E6D8C','情感':'#D8A35D','冲突':'#A7372F','人物品格':'#7B5B95','人物关系':'#C94A38','情节主题':'#4B8A5F','情感主题':'#B57947','家庭伦理':'#4B8A5F','亲情':'#3E6D8C','忠义':'#A7372F' };

var AXIS_LINE = { lineStyle: { color: 'rgba(150,100,70,0.20)', width: 1.5 } };
var SPLIT_LINE = { lineStyle: { color: 'rgba(150,100,70,0.08)', width: 1 } };

function goldenTooltip(formatterFn, extra) {
  return {
    backgroundColor: JINGJU.tooltipBg, borderColor: JINGJU.tooltipBorder, borderWidth: 2,
    padding: [0, 0], textStyle: { color: JINGJU.textOnDark, fontSize: 13 },
    extraCssText: 'border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,0.25);overflow:hidden;',
    formatter: function(p) {
      var inner = typeof formatterFn === 'function' ? formatterFn(p) : '';
      return '<div style="border-bottom:1px solid rgba(201,133,42,.25);padding:8px 16px;background:rgba(201,133,42,.12);font-size:14px;color:#ffdca2;letter-spacing:3px;font-family:\'STXingkai\', \'KaiTi\', serif;text-align:center;font-weight:bold;">— 戏韵万象 —</div><div style="padding:10px 14px 8px;">' + inner + '</div>';
    },
    ...extra,
  };
}

function emptyTitle(text) {
  return { backgroundColor: 'transparent', title: { text: text, left: 'center', top: 'center', textStyle: { color: JINGJU.textMuted, fontSize: 18, fontFamily: FONT_SERIF, fontWeight: 'normal' } } };
}

var _allCharts = window.__allCharts = window.__allCharts || []
function bindResize(inst) {
  if (inst && _allCharts.indexOf(inst) === -1) { _allCharts.push(inst) }
}
