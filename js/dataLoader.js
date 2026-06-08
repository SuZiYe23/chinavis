/* ========================================= */
/* dataLoader.js */
/* ========================================= */

const DataStore = {
  operaBasic: [],
  operaRelations: [],
  operaRoles: [],
  operaStoryline: [],
  operaThemes: [],
  operaCompact: [],
  summary: {},
  currentOpera: null
}

/* ========================================= */
/* 加载全部数据 — 从 window.__DATA_* 全局变量读取 */
/* ========================================= */

function loadAllData () {
  try {
    DataStore.operaBasic = (window.__DATA_opera_basic || [])
    DataStore.operaRelations = (window.__DATA_opera_relations || [])
    DataStore.operaRoles = (window.__DATA_opera_roles || [])
    DataStore.operaStoryline = (window.__DATA_opera_storyline || [])
    DataStore.operaThemes = (window.__DATA_opera_themes || [])
    DataStore.operaCompact = (window.__DATA_opera_compact || [])
    DataStore.summary = (window.__DATA_summary || {})
    if (DataStore.operaBasic.length > 0) DataStore.currentOpera = DataStore.operaBasic[0].opera_name
  } catch (error) {
    console.error('数据加载失败', error)
  }
}

/* ========================================= */
/* 获取剧目关系 */
/* ========================================= */

function getRelationsByOpera (operaName) {
  return DataStore.operaRelations.filter(item => item.opera_name === operaName || item.opera === operaName)
}

/* ========================================= */
/* 朝代映射：时间轴标签 → 数据朝代名称列表 */
/* ========================================= */

const DYNASTY_MAP = {
  '全部': [],
  '春秋战国': ['春秋时期','春秋','战国时期','战国'],
  '秦汉': ['秦代','汉代','西汉','东汉末年'],
  '三国两晋': ['三国时期','三国时期背景','汉末三国','晋代','东晋'],
  '隋唐五代': ['隋代','唐代','五代','五代北汉'],
  '宋': ['宋代','南宋'],
  '元': ['元代','元代（据关汉卿原著整理的京剧本）','元末明初'],
  '明': ['明代','明代嘉靖','明代嘉靖时期','明末'],
  '清': ['清代','前清雍正'],
  '近现代': ['民国','现代戏','近代','近现代','近现代京剧（明末清初历史题材）','近现代整理本（故事背景为三国时期）'],
  '未识别': ['未知','未识别','其他']
}

function isOperaInDynasty (operaDynasty, timelineLabel) {
  if (timelineLabel === '全部') return true
  var matches = DYNASTY_MAP[timelineLabel]
  if (!matches || matches.length === 0) return operaDynasty && operaDynasty.includes(timelineLabel)
  return matches.some(m => operaDynasty && operaDynasty.includes(m))
}

/* ========================================= */
/* 根据时间轴筛选剧目列表 */
/* ========================================= */

function getOperasByTimelineDynasty (timelineLabel) {
  if (timelineLabel === '全部') return DataStore.operaCompact || []
  return (DataStore.operaCompact || []).filter(item => isOperaInDynasty(item.dynasty, timelineLabel))
}

/* ========================================= */
/* 获取剧目剧情线数据 */
/* ========================================= */

function getStorylineByOpera (operaName) {
  if (!DataStore.operaStoryline || !operaName) return null
  return DataStore.operaStoryline.find(item => item.opera_name === operaName || item.opera === operaName) || null
}

/* ========================================= */
/* 获取剧目主题 */
/* ========================================= */

function getThemesByOpera (operaName) {
  if (!DataStore.operaThemes || !operaName) return []
  return DataStore.operaThemes.filter(item => item.opera_name === operaName || item.opera === operaName)
}

/* ========================================= */
/* 从 opera_roles.json 中获取角色数据 */
/* ========================================= */

function getRolesFromRolesFile (operaName) {
  var entry = DataStore.operaRoles.find(item => item.opera_name === operaName || item.opera === operaName)
  return entry?.roles || []
}

/* ========================================= */
/* 获取剧目基本信息（含 cover_elements） */
/* ========================================= */

function getOperaBasicByName (operaName) {
  return DataStore.operaCompact.find(item => item.opera_name === operaName) || DataStore.operaBasic.find(item => item.opera_name === operaName)
}

/* ========================================= */
/* 桑基图数据 */
/* 性别 → 身份 → 性格 → 表演 → 行当 */
/* ========================================= */

/* =========================================
   身份分类（全覆盖版本）
   对所有角色身份做归类，近义词合并
========================================= */

function classifyIdentityV2 (identity) {
  var id = identity || ''
  if (id === '未识别' || !id) return '身份:平民'

  if (/帝|皇|太后|太子|公主|驸马|亲王|天子|国君|君主|王后|王子|贵妃|王爷|郡主|皇叔|皇室|宗室|皇亲|王族|君王|主公|霸主|霸王|太上皇|皇姑|嗣君|储君|嫡嗣|王位|女王|太保|少主|少君|嗣王|国舅|妃子|妃嫔|国太|诸侯|国丈|后主/.test(id)) return '身份:皇室'
  if (/(^|.)妃$/.test(id)) return '身份:皇室'
  if (/(^|.)王$/.test(id) && id.length <= 3) return '身份:皇室'

  if (/元帅|都督|统帅|统领|总兵|参将|都统|提督|先锋|副将|偏将|家将|部将|将官|上将来|大将|武将|勇将|猛将|战将|守将|将帅|将领|将军|老将|女将|小将|虎将|良将|名将|骁将|将校/.test(id)) return '身份:武将'
  if (/军士|兵士|军将|将士|统兵|率兵|带兵|行军|统军|率军|领军|从军|兵马|武士|水手|猎户|御林军/.test(id)) return '身份:武将'
  if (/^(蜀|魏|宋|楚|唐|秦|汉|金|辽|曹|番|东吴|岳家|曹营|曹操|吴|赵|周|岳).*[将|军]/.test(id)) return '身份:武将'
  if (/大将$|老将$|小将$|猛将$|战将$|勇将$|虎将$|良将$|名将$|骁将$/.test(id)) return '身份:武将'
  if (/将$/.test(id) && id.length <= 4) return '身份:武将'
  if (/帅$/.test(id)) return '身份:武将'

  if (/军师|谋士|策士|参谋|参议|幕僚|幕宾|谋臣|军谋|智囊|说客/.test(id)) return '身份:谋士'

  if (/丞相|宰相|相国|大夫|尚书|学士|御史|巡抚|总督|节度使|刺史|太守|知县|知府|知州|通判|提刑|按察使|谏官|侍郎|郎中|员外|主簿|参军|从事|典史|推官|吏目|令尹|府尹|太尉/.test(id)) return '身份:文臣'
  if (/朝[臣廷相]|廷臣|重臣|名臣|忠臣|奸臣|权臣|名相|首相|宰辅|阁老|殿前|太师|太傅|少师|大臣|臣子/.test(id)) return '身份:文臣'
  if (/县[令尹衙]|州[牧官]|郡守|廷尉/.test(id)) return '身份:文臣'
  if (/官员|书吏|文臣|文官|学政|学官|乡绅|国公/.test(id)) return '身份:文臣'
  if (/校尉|都头|押司|班头|提辖|巡按|大司马|八府巡按/.test(id)) return '身份:文臣'
  if (/中书令|仆射|司徒|司马|司空|太常/.test(id)) return '身份:文臣'
  if (/(^|.)官$/.test(id) && id.length <= 4) return '身份:文臣'
  if (/臣$/.test(id) && id.length <= 2) return '身份:文臣'

  if (/报子|衙役|差役|探子|旗牌|更夫|狱卒|捕快|解差|驿丞|巡捕|公差|禁卒|皂隶|门军|哨兵|差人|兵丁|兵卒|步卒|士卒|巡卒|伍卒|火头军|传令|探报|报信/.test(id)) return '身份:吏卒'
  if (/探兵|车兵|骑兵|步兵|军卒|役卒|刽子手|地保|哨官/.test(id)) return '身份:吏卒'
  if (/(^|.)役$|(^|.)卒$|(^|.)丁$/.test(id)) return '身份:吏卒'
  if (/兵$/.test(id) && id.length <= 4) return '身份:吏卒'

  if (/丫鬟|丫环|家院|内侍|书童|随从|家丁|院子|侍女|宫女|太监|仆人|仆妇|奴婢|保姆|乳娘|管家|门子|杂役|侍从|侍儿|侍婢|侍童|小厮|仆从|仆役|跑堂|使女|服侍|从役|听差|执役|侍者|佣人|婢女|花匠|老妈子|家童|童仆|童子|门客|马童|中军/.test(id)) return '身份:仆从'
  if (/老军|家仆|老仆|侍妾|姬妾|内监|侍卫|傧相/.test(id)) return '身份:仆从'

  if (/梁山|好汉|寨主|侠客|绿林|强盗|喽啰|义士|侠士|英雄|江湖|山贼|草寇|土匪|水寇|劫匪|响马|剑客|头目|山大王|门徒|徒弟/.test(id)) return '身份:江湖'
  if (/山寨/.test(id)) return '身份:江湖'

  if (/书生|秀才|才子|文人|儒生|学子|举人|进士|学童|生员|士子|文士|名士|学究|隐士|士人|举子/.test(id)) return '身份:文人'

  if (/百姓|民妇|市民|船夫|商人|店家|掌柜|村民|渔夫|渔民|农夫|行人|客商|夫人|娘子|民女|村姑|老妇|老汉|老翁|小姐|媒婆|姑娘|孩子|儿童|公子|路人|酒保|店主|老板|小贩|屠夫|轿夫|脚夫|车夫|鼓手|吹手|乐师|琴师|医生|郎中|塾师|先生|少爷/.test(id)) return '身份:平民'
  if (/之子|之女|之妻|之夫|之母|之父|之媳|之侄|之孙|家眷|家属|老母|亲眷/.test(id)) return '身份:平民'
  if (/女儿|妻子|妾室|寡母|寡妇|妓女|歌女|舞姬|乞丐|龙套|文堂/.test(id)) return '身份:平民'
  if (/伙计|酒家|酒保|店伴|船家|民家|人家|邻里|乡民/.test(id)) return '身份:平民'
  if (/使者|母亲|闺秀/.test(id)) return '身份:平民'
  if (/(^|.)人$|(^|.)妇$|(^|.)女$|(^|.)夫$|(^|.)民$|(^|.)翁$|(^|.)婆$|(^|.)娘$|(^|.)哥$|(^|.)郎$|(^|.)汉$|(^|.)母$|(^|.)婢$|(^|.)姬$/.test(id)) return '身份:平民'

  if (/僧人|道士|佛祖|菩萨|罗汉|金刚|天神|精怪|妖精|妖怪|鬼卒|鬼差|阎王|阎罗|灵兽|神祇|仙姑|仙长|法师|神仙|神明|狐仙|牛头马面|仙道|神道|出家|佛门|道童|沙弥|方丈|住持|道姑|道爷/.test(id)) return '身份:神异'
  if (/和尚|尼姑|八仙|仙翁|仙家|神将|仙子|星君|天庭|老旦/.test(id)) return '身份:神异'
  if (/(^|.)仙$|(^|.)神$|(^|.)妖$|(^|.)怪$|(^|.)僧$|(^|.)道$/.test(id)) return '身份:神异'

  if (id.length >= 5) {
    if (/将|帅|军|战|征|兵/.test(id)) return '身份:武将'
    if (/王|帝|后|妃|主/.test(id)) return '身份:皇室'
    if (/官|臣|尉/.test(id)) return '身份:文臣'
    if (/仆|侍|婢|童|娘/.test(id)) return '身份:仆从'
    if (/衙|差/.test(id)) return '身份:吏卒'
    if (/侠|盗|贼|寨|头/.test(id)) return '身份:江湖'
    if (/仙|神|妖|怪|僧|道/.test(id)) return '身份:神异'
  }

  return '身份:平民'
}

/* =========================================
   性格分类（全覆盖版本）
========================================= */

function classifyPersonalityV2 (list) {
  var text = (list || []).join('')

  if (text.includes('忠勇')) return '性格:忠勇正直'
  if (text.includes('忠义')) return '性格:忠勇正直'
  if (text.includes('忠厚')) return '性格:忠勇正直'
  if (text.includes('忠直')) return '性格:忠勇正直'
  if (text.includes('忠贞')) return '性格:忠勇正直'
  if (text.includes('忠烈')) return '性格:忠勇正直'
  if (text.includes('忠谨')) return '性格:忠勇正直'
  if (text.includes('忠诚')) return '性格:忠勇正直'
  if (text.includes('忠心')) return '性格:忠勇正直'
  if (/忠/.test(text) && !/从/.test(text)) return '性格:忠勇正直'
  if (text.includes('义气') || text.includes('仗义') || text.includes('重义')) return '性格:忠勇正直'
  if (text.includes('侠义') || text.includes('正义')) return '性格:忠勇正直'
  if (text.includes('刚正') || text.includes('正直')) return '性格:忠勇正直'

  if (text.includes('机智') || text.includes('机敏') || text.includes('聪慧')) return '性格:机智聪慧'
  if (text.includes('聪明') || text.includes('睿智') || text.includes('精明')) return '性格:机智聪慧'
  if (text.includes('机灵') || text.includes('机警') || text.includes('机巧')) return '性格:机智聪慧'
  if (text.includes('伶俐') || text.includes('多谋')) return '性格:机智聪慧'
  if (text.includes('足智多谋') || text.includes('智谋') || text.includes('善谋')) return '性格:机智聪慧'
  if (text.includes('有谋略') || text.includes('多谋')) return '性格:机智聪慧'

  if (text.includes('谨慎') || text.includes('沉稳') || text.includes('稳重')) return '性格:沉稳谨慎'
  if (text.includes('沉着') || text.includes('持重')) return '性格:沉稳谨慎'
  if (text.includes('冷静') || text.includes('从容')) return '性格:沉稳谨慎'
  if (text.includes('老成') || text.includes('审慎') || text.includes('稳妥')) return '性格:沉稳谨慎'
  if (text.includes('干练') || text.includes('老练')) return '性格:沉稳谨慎'

  if (text.includes('勇猛') || text.includes('刚烈') || text.includes('勇武')) return '性格:勇猛刚烈'
  if (text.includes('骁勇') || text.includes('勇敢') || text.includes('英勇')) return '性格:勇猛刚烈'
  if (text.includes('刚强') || text.includes('刚毅') || text.includes('英武')) return '性格:勇猛刚烈'
  if (text.includes('威武') || text.includes('凶悍') || text.includes('强悍')) return '性格:勇猛刚烈'
  if (text.includes('果决') || text.includes('果敢') || text.includes('果断')) return '性格:勇猛刚烈'

  if (text.includes('听命') || text.includes('顺从') || text.includes('服从')) return '性格:顺从听命'
  if (text.includes('恭顺') || text.includes('恭谨')) return '性格:顺从听命'
  if (text.includes('奉命') || text.includes('听令') || text.includes('从命')) return '性格:顺从听命'
  if (text.includes('附和') || text.includes('随从') || text.includes('随众')) return '性格:顺从听命'
  if (text.includes('勤谨') || text.includes('奉令') || text.includes('从令')) return '性格:顺从听命'
  if (text.includes('奉命行事')) return '性格:顺从听命'

  if (text.includes('狡诈') || text.includes('阴险') || text.includes('奸诈')) return '性格:奸诈阴险'
  if (text.includes('阴狠') || text.includes('凶狠') || text.includes('狠毒')) return '性格:奸诈阴险'
  if (text.includes('奸邪') || text.includes('奸猾') || text.includes('势利')) return '性格:奸诈阴险'
  if (text.includes('虚伪') || text.includes('谄媚')) return '性格:奸诈阴险'

  if (text.includes('急躁') || text.includes('急切') || text.includes('冲动')) return '性格:急躁冲动'
  if (text.includes('好胜') || text.includes('争强') || text.includes('冒进')) return '性格:急躁冲动'
  if (text.includes('莽撞') || text.includes('鲁莽')) return '性格:急躁冲动'
  if (text.includes('骄横') || text.includes('自负') || text.includes('自矜')) return '性格:急躁冲动'
  if (text.includes('好面子')) return '性格:急躁冲动'

  if (text.includes('滑稽') || text.includes('诙谐') || text.includes('油滑')) return '性格:诙谐滑稽'
  if (text.includes('圆滑') || text.includes('幽默') || text.includes('戏谑')) return '性格:诙谐滑稽'
  if (text.includes('插科打诨')) return '性格:诙谐滑稽'

  if (text.includes('豪爽') || text.includes('直率') || text.includes('豪迈')) return '性格:豪爽仗义'
  if (text.includes('爽直') || text.includes('慷慨') || text.includes('豪放')) return '性格:豪爽仗义'
  if (text.includes('泼辣') || text.includes('刚直') || text.includes('爽快')) return '性格:豪爽仗义'

  if (text.includes('多情') || text.includes('慈爱') || text.includes('仁厚')) return '性格:多情仁厚'
  if (text.includes('善良') || text.includes('孝顺') || text.includes('仁慈')) return '性格:多情仁厚'
  if (text.includes('重情') || text.includes('热心') || text.includes('体贴')) return '性格:多情仁厚'
  if (text.includes('朴实') || text.includes('厚道')) return '性格:多情仁厚'

  if (/恭|敬|谦/.test(text)) return '性格:顺从听命'
  if (/豪/.test(text)) return '性格:豪爽仗义'
  if (/奸|伪|谀/.test(text)) return '性格:奸诈阴险'
  if (/傲|骄|狂/.test(text)) return '性格:急躁冲动'
  if (/忧|悲|哀|怨|苦|伤|愁/.test(text)) return '性格:多情仁厚'
  if (/悍|霸/.test(text)) return '性格:勇猛刚烈'
  if (/厉|苛|酷/.test(text)) return '性格:奸诈阴险'

  return '性格:沉稳谨慎'
}

/* =========================================
   桑基图数据（重构版）
   性别 → 身份 → 性格 → 表演 → 行当
   排除性别"未知"的角色
========================================= */

function getSankeyData(selectedDynasty) {
  if (selectedDynasty === undefined) selectedDynasty = '全部'

  var nodeSet = {}
  var linksMap = {}

  function addLink(source, target) {
    if (!source || !target) return
    nodeSet[source] = true
    nodeSet[target] = true
    var key = source + '→' + target
    if (!linksMap[key]) linksMap[key] = { source: source, target: target, value: 0 }
    linksMap[key].value++
  }

  DataStore.operaRoles.forEach(function(opera) {
    if (selectedDynasty !== '全部' && selectedDynasty) {
      var matches = DYNASTY_MAP[selectedDynasty] || []
      var dynastyMatch = false
      if (matches.length === 0) {
        dynastyMatch = opera.dynasty && opera.dynasty.indexOf(selectedDynasty) >= 0
      } else {
        for (var mi = 0; mi < matches.length; mi++) {
          if (opera.dynasty && opera.dynasty.indexOf(matches[mi]) >= 0) { dynastyMatch = true; break }
        }
      }
      if (!dynastyMatch) return
    }

    if (!Array.isArray(opera.roles)) return

    opera.roles.forEach(function(role) {
      var gender = role.gender === '男' ? '性别:男性' : role.gender === '女' ? '性别:女性' : '性别:未知'

      var rawAge = role.age_stage || '未知'
      var age
      if (rawAge.indexOf('幼') >= 0 || rawAge.indexOf('童') >= 0 || rawAge.indexOf('少年') >= 0) age = '年龄:少年'
      else if (rawAge.indexOf('青年') >= 0) age = '年龄:青年'
      else if (rawAge.indexOf('中老年') >= 0 || rawAge.indexOf('老年') >= 0 || rawAge.indexOf('老') >= 0) age = '年龄:老年'
      else if (rawAge.indexOf('中年') >= 0 || rawAge.indexOf('中') >= 0) age = '年龄:中年'
      else age = '年龄:未知'

      var identity = classifyIdentityV2(role.identity)
      var personality = classifyPersonalityV2(role.personality)

      var perf = role.performance_type || []
      var performance
      if (perf.length === 0) performance = '表演:无'
      else performance = '表演:' + ['唱','念','做','打'].filter(function(p) { return perf.indexOf(p) >= 0 }).join('')

      var roleType = '行当:' + (role.role_type || '未知')

      addLink(gender, age)
      addLink(age, identity)
      addLink(identity, personality)
      addLink(personality, performance)
      addLink(performance, roleType)
    })
  })

  return { nodes: Object.keys(nodeSet).map(function(name) { return { name: name } }), links: Object.values(linksMap) }
}

/* ========================================= */
/* 行当映射变化 */
/* ========================================= */

function getRoleTypeEvolution() {
  const result = {}
  DataStore.operaBasic.forEach(opera => {
    const dynasty = opera.dynasty || '其他'
    if (!result[dynasty]) result[dynasty] = {}
    if (!Array.isArray(opera.roles)) return
    opera.roles.forEach(role => {
      const type = role.role_type || inferRoleType(role)
      if (!result[dynasty][type]) result[dynasty][type] = 0
      result[dynasty][type]++
    })
  })
  return result
}

/* ========================================= */
/* 剧种归一化合并 */
/* ========================================= */

const TYPE_MERGE = {
  /* 历史戏（63%） */
  '历史戏': '历史戏', '历史武戏': '历史戏', '历史伦理戏': '历史戏', '历史忠义戏': '历史戏', '历史神怪戏': '历史戏', '历史忠烈戏': '历史戏', '京剧历史戏': '历史戏',
  /* 武戏（12%） */
  '武戏': '武戏', '文武兼备': '武戏', '文武兼重': '武戏', '武侠戏': '武戏', '文戏': '武戏', '文丑戏': '武戏',
  /* 神怪戏（10%） */
  '神怪戏': '神怪戏', '神怪历史戏': '神怪戏', '神话戏': '神怪戏', '神怪公案戏': '神怪戏', '神怪武戏': '神怪戏', '神怪爱情戏': '神怪戏', '传奇': '神怪戏', '传奇戏': '神怪戏', '传奇改编京剧': '神怪戏', '传奇/闺门旦折子戏': '神怪戏',
  /* 爱情伦理戏（9%） */
  '爱情戏': '爱情伦理戏', '家庭伦理戏': '爱情伦理戏', '家庭戏': '爱情伦理戏', '情感戏': '爱情伦理戏', '爱情喜剧': '爱情伦理戏', '侠义爱情戏': '爱情伦理戏',
  /* 公案戏（3%） */
  '公案戏': '公案戏', '公案侠义戏': '公案戏',
  /* 其他（3%） */
  '京剧': '其他', '传统戏': '其他', '传统京剧': '其他', '京剧折子戏': '其他', '京剧悲剧': '其他',
  '喜剧': '其他', '讽刺喜剧': '其他',
  '悲剧': '其他', '悲剧戏': '其他',
  '文人戏': '其他', '文人知音戏': '其他',
  '宫廷戏': '其他', '忠义戏': '其他', '昆曲': '其他',
}

function normalizeType(raw) { return TYPE_MERGE[raw] || raw || '未知' }

function inferRoleType(role) {
  const gender = role.gender || ''
  const identity = role.identity || ''
  const personality = Array.isArray(role.personality) ? role.personality.join(',') : ''
  if (gender === '女') return '旦'
  if (identity.includes('将') || identity.includes('帅') || identity.includes('元帅')) return '净'
  if (identity.includes('丞相') || identity.includes('官') || identity.includes('大臣')) return '老生'
  if (personality.includes('滑稽') || personality.includes('戏谑')) return '丑'
  return '生'
}

function getRoleTypeByDynasty(timelineLabel) {
  const matches = timelineLabel === '全部' ? [] : (DYNASTY_MAP[timelineLabel] || [])
  const result = {}
  DataStore.operaRoles.forEach(opera => {
    if (matches.length > 0) {
      const ok = matches.some(m => opera.dynasty && opera.dynasty.includes(m))
      if (!ok) return
    }
    if (!Array.isArray(opera.roles)) return
    opera.roles.forEach(role => {
      const type = role.role_type || inferRoleType(role)
      if (!result[type]) result[type] = 0
      result[type]++
    })
  })
  return result
}

function getRoleTypeByAllDynasties() {
  var TIMELINE_MAP = {
    "春秋战国": ["春秋时期","春秋","战国时期","战国"],
    "秦汉": ["秦代","汉代","西汉","东汉末年"],
    "三国两晋": ["三国时期","三国时期背景","汉末三国","晋代","东晋"],
    "隋唐五代": ["隋代","唐代","五代","五代北汉"],
    "宋": ["宋代","南宋"],
    "元": ["元代","元代（据关汉卿原著整理的京剧本）","元末明初"],
    "明": ["明代","明代嘉靖","明代嘉靖时期","明末"],
    "清": ["清代","前清雍正"],
 
    "近现代": ["民国","现代戏","近代","近现代","近现代京剧（明末清初历史题材）","近现代整理本（故事背景为三国时期）"],
    "未识别": ["未知","未识别","其他"]
  }
  var allTypes = new Set()
  var data = {}
  var timeline = Object.keys(TIMELINE_MAP)
  timeline.forEach(function(label) { data[label] = {} })
  DataStore.operaRoles.forEach(function(opera) {
    if (!Array.isArray(opera.roles)) return
    var opDynasty = opera.dynasty || ""
    var matchedLabel = "未识别"
    timeline.forEach(function(label) {
      var matches = TIMELINE_MAP[label]
      if (matches.some(function(m) { return opDynasty.includes(m) })) matchedLabel = label
    })
    opera.roles.forEach(function(role) {
      var type = role.role_type || inferRoleType(role)
      allTypes.add(type)
      if (!data[matchedLabel][type]) data[matchedLabel][type] = 0
      data[matchedLabel][type]++
    })
  })
  return { timeline: timeline, types: Array.from(allTypes), data: data }
}
