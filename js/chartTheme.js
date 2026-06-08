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

/* =========================================
   统一主题类型分类（各图表共用）
   返回 CATEGORY_INDEX: 0-9，未匹配返回 -1
   CATEGORIES = [伦理道德,政治权谋,战争军事,家庭亲情,人物品格,情节叙事,情感心理,社会民生,宗教神怪,艺术审美]
========================================= */
var THEME_CATEGORIES = [
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

function classifyThemeType(t) {
  if (!t || t === 'undefined') return -1
  if (/^(战争|军事|谋略|武戏|兵法|将帅|战场|战役|军旅|战术|战事|武艺|武打|武勇|武|军纪|军令|军务|军阵|军中|军|兵|阵|剿|抗敌|边塞|边关|御敌|征战|征伐|策略|战略|战乱|兵乱|离乱|盟|联|归附|归降|招降|智谋|计策|计|策|智斗|智|慧|谋|胜利|战胜|取胜|凯旋)/.test(t)) return 2
  if (/^(政治|权谋|朝堂|朝廷|君臣|官场|仕途|宫廷|帝王|权力|权术|权|君|皇|朝政|朝|政|臣|爵|宦|谏|诏|奏|赐|功名|功业|建功|事业|抱负|人才|兴亡|兴衰|斗争|抗争|反抗|忠君|治国|治政|治理|治世|求贤|用人|举荐|招贤|宗室|皇族|皇亲|复国|复兴|时局|局势|时势|科举|科场|仕进|进士|外交|邦交|出使|复汉)/.test(t)) return 1
  if (/^(人物品格|家庭伦理|忠义|忠孝|忠勇|忠烈|忠贞|忠奸|道德|价值|价值观|品格|品德|教化|气节|节|仁义|道义|孝|伦理|人格|德|礼法|礼教|礼|贞|侠义|侠|义气|家国|爱国|报国|惩恶|扬善|除恶|惩奸|正邪|善恶|对错|英雄|气概|传奇|江湖|豪|牺牲|奉献|教育|教导|训诫|诲|劝诫|规劝|劝谏|哲理|哲学|思辨|情义|情谊|情意)/.test(t)) return 0
  if (/^(神怪|宗教|神异|因果|报应|天命|神|佛|鬼|冥|迷信|超自然|仙|魔|妖|僧|道|术|信仰)/.test(t)) return 8
  if (/^(亲情|爱情|婚姻|家庭|婚恋|夫妻|父母|孝|恋|姻|团圆|相聚|女性|妇女|红颜|情爱|爱恋|恋情)/.test(t)) return 3
  if (/^(人物|性格|品质|精神|气质|才能|志向|意愿|动机|才|人际关系|交往|关系|人性|人心|成长|转变|变化|转折|群像|群体|集体|友情|友谊)/.test(t)) return 4
  if (/^(情节|冲突|叙事|剧情|戏剧|场景|事件|主线|核心|道具|线索|母题|悬念|转折|身份|伪装|揭秘|行动|动作|物|对象|饰品|误会|分歧|纠纷|矛盾|对立|场面|情景|情境|冒险|历险|涉险|危机|危局|信物|宝物|器物|和解|和议|议和|讲和|主旨|结局|收束|归宿|走向|时代背景|时代|时代主题|历史背景)/.test(t)) return 5
  if (/^(情感|命运|悲剧|心理|情绪|人生|生死|离合|悲欢|复仇|报仇|恩|怨|仇|际遇|遭际|境遇|反思|回忆|追忆|回顾|历史|牺牲|苦难|折磨|痛苦|处境|困境|艰困|灾难|灾祸|灾害)/.test(t)) return 6
  if (/^(社会|司法|公案|民生|正义|冤|官|世俗|民众|人间|罪犯|贪|讼|诉讼|讽刺|讽喻|批判|抨击|生存|生活|生计|民俗|风俗|暴力|犯罪|罪恶|人情|世故|世态|清官|断案|案件|案情|压迫|剥削|欺压|公义|公道|公正|法理|法纪|法令|法治|刑罚|刑|狱|疾病|伤病|病患|民怨|民间)/.test(t)) return 7
  if (/^(艺术|风格|审美|表演|舞台|喜剧|意象|手法|戏曲|文人|文士|文臣|雅集|风雅|文雅|仪式|典礼|礼仪|庆贺|颂|祝|吉祥|吉庆|祥瑞|祈福)/.test(t)) return 9
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
  if (/(信物|宝物|道具|物件|器物)/.test(t)) return 5
  if (/(人际|相处)/.test(t)) return 4
  if (/(求贤|用人|人才|举荐|招贤)/.test(t)) return 1
  if (/(和解|和议|议和|讲和)/.test(t)) return 5
  if (/(信仰|宗教|迷信)/.test(t)) return 8
  if (/(群像|群体|集体)/.test(t)) return 4
  if (/(哲理|哲学|思辨)/.test(t)) return 0
  if (/(情爱|爱恋|恋情)/.test(t)) return 3
  if (/(策略|战略)/.test(t)) return 2
  if (/(压迫|剥削|欺压)/.test(t)) return 7
  if (/(公义|公道|公正)/.test(t)) return 7
  if (/(文人|文士|文臣|雅集|风雅|文雅)/.test(t)) return 9
  if (/(胜利|战胜|取胜|凯旋)/.test(t)) return 2
  if (/(劝诫|规劝|劝谏)/.test(t)) return 0
  if (/(宗室|皇族|皇亲)/.test(t)) return 1
  if (/(冒险|历险|涉险)/.test(t)) return 5
  if (/(疾病|伤病|病患)/.test(t)) return 7
  if (/(友情|友谊)/.test(t)) return 4
  if (/(吉祥|吉庆|祥瑞|祈福|颂|祝)/.test(t)) return 9
  if (/(复国|复兴|复汉)/.test(t)) return 1
  if (/(外交|邦交|出使)/.test(t)) return 1
  if (/(科举|科场|仕进|功名|进士)/.test(t)) return 1
  if (/(教育|教导|训诫|诲)/.test(t)) return 0
  if (/(刑罚|刑|狱)/.test(t)) return 7
  if (/(战乱|兵乱|离乱)/.test(t)) return 2
  if (/(时局|局势|时势)/.test(t)) return 1
  if (/(法理|法纪|法令|法治)/.test(t)) return 7
  if (/(危机|危局)/.test(t)) return 5
  if (/(盟|联|归附|归降|招降)/.test(t)) return 2
  return -1
}

var _allCharts = window.__allCharts = window.__allCharts || []
function bindResize(inst) {
  if (inst && _allCharts.indexOf(inst) === -1) { _allCharts.push(inst) }
}
/* 清理已 dispose 的实例（防止内存泄漏） */
function unbindResize(inst) {
  if (!inst) return
  var idx = _allCharts.indexOf(inst)
  if (idx >= 0) { _allCharts.splice(idx, 1) }
}
