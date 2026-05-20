// ============================================================
// js/ui/achieve.js
// 成就 & 称号系统
// ── 结构 ──────────────────────────────────────────────────
// ACHIEVEMENTS  (原"称号") → 解锁后不会丢失的永久成就
// TITLES_DATA   (新"称号") → 可获得也可丧失，每天/每次调教后检测
// ENDINGS       → 结局成就
// ============================================================

// ── 永久成就（原称号，改名为"成就"）─────────────────────────
const ACHIEVEMENTS = [
  // ─ 训练类 ─
  { id:'t_begin',    icon:'🌱', name:'初出茅庐',   desc:'踏出第一步总是最难的。第一次训练，万里长征的开端——前方还有很长的路等着你呢。',
    hint:'完成第一次训练',           check: s => (s.currentChar?.total_training_count||0) >= 1 },
  { id:'t_train10',  icon:'📖', name:'勤勉主人',   desc:'已经累计训练了10次。熟能生巧，看来你对这门艺术越来越感兴趣了。',
    hint:'累计训练达到10次',          check: s => (s.currentChar?.total_training_count||0) >= 10 },
  { id:'t_train50',  icon:'⚔️', name:'训练狂人',   desc:'50次——这不是热情，这叫执念。对方的变化，你比任何人都清楚。',
    hint:'累计训练达到50次',          check: s => (s.currentChar?.total_training_count||0) >= 50 },
  { id:'t_train100', icon:'👑', name:'调教宗师',   desc:'百次锤炼，炉火纯青。你已经不再需要什么技巧，因为你本身就是技巧。',
    hint:'累计训练达到100次',         check: s => (s.currentChar?.total_training_count||0) >= 100 },
  // ─ 好感/服从/欲望 ─
  { id:'t_lust50',   icon:'🔥', name:'点燃者',     desc:'欲望是一把火，你悄悄递给对方一根引线，然后退后一步，看着它蔓延。',
    hint:'使某角色欲望达到50',        check: s => (s.currentChar?.lust||0) >= 50 },
  { id:'t_aff50',    icon:'💛', name:'入心者',     desc:'好感达到了50——对方也许还没意识到，但心里已经留了一扇小小的门。',
    hint:'使某角色好感达到50',        check: s => (s.currentChar?.affection||0) >= 50 },
  { id:'t_ob50',     icon:'🔮', name:'驯化者',     desc:'从抗拒到接受，不知不觉间，服从已经成了一种习惯。',
    hint:'使某角色服从达到50',        check: s => (s.currentChar?.obedience||0) >= 50 },
  { id:'t_aff80',    icon:'💖', name:'蛊惑之主',   desc:'好感到了80，这已经不是普通的好感了——那更像一种无法言说的依赖。',
    hint:'使某角色好感达到80',        check: s => (s.currentChar?.affection||0) >= 80 },
  { id:'t_ob80',     icon:'⛓️', name:'绝对支配者', desc:'服从达到80。意志的钢铁已经软化，剩下的只是期待你的下一道命令。',
    hint:'使某角色服从达到80',        check: s => (s.currentChar?.obedience||0) >= 80 },
  { id:'t_lust80',   icon:'🌹', name:'欲望调律师', desc:'欲望如同被精准调校的乐器，你知道每个音符在哪里，也知道如何演奏出最美的旋律。',
    hint:'使某角色欲望达到80',        check: s => (s.currentChar?.lust||0) >= 80 },
  { id:'t_aff100',   icon:'💞', name:'心之归处',   desc:'100的好感——对方大概已经分不清"在意"和"离不开"的区别了。',
    hint:'使某角色好感达到100',       check: s => (s.currentChar?.affection||0) >= 100 },
  { id:'t_ob100',    icon:'🗝️', name:'完全支配',   desc:'彻底的服从。这不是屈辱，这是信任的极致——至少，你希望如此。',
    hint:'使某角色服从达到100',       check: s => (s.currentChar?.obedience||0) >= 100 },
  { id:'t_lust100',  icon:'🔴', name:'欲望之炬',   desc:'欲望满溢，连空气都灼热了。到了这一步，身体已经比头脑更诚实。',
    hint:'使某角色欲望达到100',       check: s => (s.currentChar?.lust||0) >= 100 },
  // ─ 时间/金币 ─
  { id:'t_day30',    icon:'📅', name:'岁月如织',   desc:'30天了。时间是最温柔的征服者，也是最彻底的——你们已经编织进了彼此的习惯里。',
    hint:'在游戏中度过30天',         check: s => (s.day||1) >= 30 },
  { id:'t_day60',    icon:'🌙', name:'光阴似箭',   desc:'60天，两个月。已经很难想象彼此不存在的时候是什么样了。',
    hint:'度过60天',                 check: s => (s.day||1) >= 60 },
  { id:'t_day100',   icon:'🌟', name:'百日如歌',   desc:'百日。足以让一段关系变质，也足以让一段关系结晶。你选择了后者。',
    hint:'度过100天',                check: s => (s.day||1) >= 100 },
  { id:'t_rich',     icon:'💰', name:'财大气粗',   desc:'50000金币——钱不是万能的，但你正在验证这句话的第二段：没有钱是万万不能的。',
    hint:'持有金币超过50000',        check: s => (s.money||0) >= 50000 },
  { id:'t_broke',    icon:'😅', name:'月光族',     desc:'口袋里只剩下几枚铜板……这就是一掷千金的代价。不过，挥霍本身也是一种乐趣吧？',
    hint:'金币曾经少于100',          check: s => (s.money||0) < 100 },
  { id:'t_rich2',    icon:'🏦', name:'金山银海',   desc:'20万金币。你已经超越了绝大多数人的想象力——现在，该想象更大的东西了。',
    hint:'持有金币超过200000',       check: s => (s.money||0) >= 200000 },
  // ─ 道具/打工 ─
  { id:'t_shop5',    icon:'🛒', name:'氪金玩家',   desc:'5件道具。你开始明白，工欲善其事，必先利其器这句话，在这里也适用。',
    hint:'购买超过5件道具',          check: s => Object.keys(s.inventory||{}).length >= 5 },
  { id:'t_shop15',   icon:'🛍️', name:'购物狂魔',   desc:'15件道具——收藏家的天赋终于在这里找到了用武之地。',
    hint:'购买超过15件道具',         check: s => Object.keys(s.inventory||{}).length >= 15 },
  { id:'t_work5',    icon:'💼', name:'勤劳的身影', desc:'5次打工。有时候，普通的劳动也能看见不普通的风景。',
    hint:'完成5次打工',              check: s => (s.workLog||[]).length >= 5 },
  { id:'t_work10',   icon:'🔨', name:'资深打工人', desc:'10次了。你已经能在各种场合游刃有余，挣钱养家不在话下。',
    hint:'完成10次打工',             check: s => (s.workLog||[]).length >= 10 },
  { id:'t_date1',    icon:'🌸', name:'春日出游',   desc:'第一次约会总是有些忐忑的，哪怕你掌握着绝对的主导权。',
    hint:'完成第一次约会',           check: s => (s.dateLog||[]).length >= 1 },
  { id:'t_date5',    icon:'💌', name:'常伴左右',   desc:'5次约会——已经不再是调教，更像是……某种别的东西了。',
    hint:'完成5次约会',              check: s => (s.dateLog||[]).length >= 5 },
  { id:'t_wander5',  icon:'🚶', name:'城中漫游者', desc:'5次闲逛。城市的每个角落都留下了你的脚印，以及某些你不会主动提起的回忆。',
    hint:'完成5次闲逛',              check: s => (s.wanderLog||[]).length >= 5 },
  { id:'t_wander15', icon:'🗺️', name:'无处不往',   desc:'15次——你对这座城市的了解，可能已经超过了绝大多数本地人。',
    hint:'完成15次闲逛',             check: s => (s.wanderLog||[]).length >= 15 },
  { id:'t_corvee1',  icon:'⛓️', name:'初试劳役',   desc:'第一次劳役。权力的另一面，是驱使他人的能力——看来你驾驭得不错。',
    hint:'完成第一次劳役',           check: s => (s.corveeLog||[]).length >= 1 },
  { id:'t_corvee10', icon:'🏰', name:'役使有方',   desc:'10次劳役。你的庄园越来越有气候了，只差一个帝国的名号。',
    hint:'完成10次劳役',             check: s => (s.corveeLog||[]).length >= 10 },
  { id:'t_exp100',   icon:'✨', name:'修行有成',   desc:'100经验。路漫漫其修远兮，但你已经迈出了相当扎实的步伐。',
    hint:'累计获得100点经验',        check: s => (s.playerExp||0) >= 100 },
  { id:'t_exp500',   icon:'🌙', name:'道行深厚',   desc:'500经验——传说中的修炼者，也不过如此吧？你已经不需要证明什么了。',
    hint:'累计获得500点经验',        check: s => (s.playerExp||0) >= 500 },
  { id:'t_gender',   icon:'🦋', name:'蝴蝶梦',     desc:'性别只是一个标签——你已经超越了它，站在了更自由的地方。',
    hint:'完成了性别转换',           check: s => s.playerGenderChanged === true },
  { id:'t_allwork',  icon:'🌟', name:'全能打工人', desc:'走遍了所有打工地点。每一处都有故事，而你把它们都收进了记忆里。',
    hint:'在所有打工地点各完成过一次',
    check: s => { const locs=(s.workLog||[]).map(l=>l.loc); return ['集市摊贩','酒馆帮工','书坊抄书','医馆帮诊','画室助手'].every(n=>locs.includes(n)); }
  },
];

// ── 结局成就 ────────────────────────────────────────────────
const ENDINGS = [
  { id:'end_normal',   icon:'📖', name:'平凡的结局',
    desc:'没有特别的执念，也没有特别的遗憾，就这样结束了。没有最好，但也不坏——平凡有时候才是最难得的奢侈。',
    hint:'游戏时间超过60天，且没有触发其他特殊结局',
    checkUnlock: s => (s.day||1) >= 60 && !s.specialEndingTriggered },
  { id:'end_love',     icon:'💞', name:'相亲相爱',
    desc:'那段感情，最终超越了调教与被调教的框架，变成了别的东西——更脆弱，也更真实。两个人靠在一起，不再需要名字来定义彼此的关系。',
    hint:'当前角色好感达到100，且约会次数超过5次',
    checkUnlock: s => (s.currentChar?.affection||0) >= 100 && (s.dateLog||[]).length >= 5 },
  { id:'end_dominate', icon:'⛓️', name:'绝对支配',
    desc:'从头到尾都是权力的游戏。支配者与被支配者，两个角色从未有过偏差——而在这个秩序里，两人都找到了各自的位置。',
    hint:'当前角色服从达到100，且训练次数超过100次',
    checkUnlock: s => (s.currentChar?.obedience||0) >= 100 && (s.currentChar?.total_training_count||0) >= 100 },
  { id:'end_escape',   icon:'🕊️', name:'逃脱的鸟',
    desc:'鸟笼的门，有一天被忘记关上了。那只鸟飞走了，而守笼的人，站在原地，很久没有动——不知道在等什么，或者，只是在回忆。',
    hint:'当前角色好感达到80以上，但服从低于30，且游戏时间超过30天',
    checkUnlock: s => (s.currentChar?.affection||0) >= 80 && (s.currentChar?.obedience||0) < 30 && (s.day||1) >= 30 },
  { id:'end_ruin',     icon:'💀', name:'两败俱伤',
    desc:'不知道谁先失去了什么，总之，到最后什么都没剩下，只剩下两个互相伤过的人——站在废墟上，都太累了，连恨意都懒得再燃。',
    hint:'当前角色好感和服从均低于20，且训练次数超过50次',
    checkUnlock: s => (s.currentChar?.affection||0) < 20 && (s.currentChar?.obedience||0) < 20 && (s.currentChar?.total_training_count||0) >= 50 },
  { id:'end_wealth',   icon:'💰', name:'纸醉金迷',
    desc:'权力、金钱、享乐——什么都有了，但空空的，和一开始没有什么两样。也许，从头到尾想要的不是这些。',
    hint:'持有金币超过100000，且完成劳役次数超过20次',
    checkUnlock: s => (s.money||0) >= 100000 && (s.corveeLog||[]).length >= 20 },
  { id:'end_wander',   icon:'🚶', name:'行走之人',
    desc:'有些人天生不属于任何地方。带着一些记忆，一些名字，继续走下去——这已经足够了，不是吗？',
    hint:'完成闲逛次数超过20次，且游戏时间超过50天',
    checkUnlock: s => (s.wanderLog||[]).length >= 20 && (s.day||1) >= 50 },
];

// ── 称号数据（来自旧游戏，可获得也可丧失）──────────────────────
// check_gain(State) → 返回 true 时获得
// check_lose(State) → 返回 true 时失去（可选）
// gain_text(name) → 获得时的台词
// lose_text(name) → 失去时的台词
const TITLES_DATA = [
  {
    id:'title_900', name:'总攻', icon:'⚔️',
    desc:'调教师界的神话。征服众人、踩在快感的顶端——至高无上，无人匹敌。',
    gain_text: function(n){ return ['「哦豁！主人已经是一位相当了不起的神级调教师了呢！」','「请继续将所有人征服于您的脚下吧，至高无上的总攻大人！」']; },
    lose_text: function(n){ return ['……看来总攻的宝座还需要更多修炼来坐稳它呢。']; },
    check_gain: function(s){ return (s.playerExp||0) >= 1500 && Object.keys(s.inventory||{}).length >= 10; },
    check_lose: null,
  },
  {
    id:'title_901', name:'捆绑达人', icon:'🎀',
    desc:'绳索与束缚的艺术，在您灵巧的指尖下，猎物终将化为最美的艺术品。',
    gain_text: function(n){ return ['「绳索与束缚的艺术，似乎已被主人完全掌握。」','「在您灵巧的指尖下，再桀骜不驯的猎物，也终将化为最美的艺术品。」']; },
    lose_text: function(n){ return ['「捆绑大师的称号……似乎暂时需要搁置了呢。」']; },
    check_gain: function(s){ return (s.inventory||{})[16] && (s.inventory||{})[22] && (s.playerExp||0) >= 500; },
    check_lose: null,
  },
  {
    id:'title_902', name:'正太控', icon:'🧒',
    desc:'"可爱即是正义！"——您的收藏在无声地诉说着这个真理。',
    gain_text: function(n){ return ['「"可爱即是正义！"——主人的收藏似乎在无声地诉说着这个真理。」','「面对那些小巧可爱的男孩子，您总是会忍不住伸出"援手"，对吗？」']; },
    lose_text: function(n){ return ['「看来主人的口味发生了一些变化，收藏室里不再是清一色的可爱男孩了。」']; },
    check_gain: function(s){
      if(typeof CHARS_DATA==='undefined')return false;
      var boys=CHARS_DATA.filter(function(c){var sv=loadSave(c.id);return sv&&sv.char&&c.gender==='男'&&(c.class||'').includes('少年');});
      return boys.length>=2;
    },
    check_lose: function(s){
      if(typeof CHARS_DATA==='undefined')return false;
      var all=CHARS_DATA.filter(function(c){var sv=loadSave(c.id);return sv&&sv.char;});
      var boys=all.filter(function(c){return c.gender==='男'&&(c.class||'').includes('少年');});
      return all.length>0&&boys.length<all.length/2;
    },
  },
  {
    id:'title_904', name:'腐调教师', icon:'✨',
    desc:'无论是清冷仙尊还是傲娇王子，在您的手中都将展现别样风情。您非常擅长发掘男孩子之间不可言说的美妙关系。',
    gain_text: function(n){ return ['「无论是清冷仙尊还是傲娇王子，在主人的手中，都将展现出别样的风情。」','「您似乎……非常擅长发掘男孩子之间那不可言说的美妙关系呢。」']; },
    lose_text: function(n){ return ['「收藏室的风向变了，腐调教师的头衔需要重新考量呢。」']; },
    check_gain: function(s){
      if(typeof CHARS_DATA==='undefined')return false;
      var maleSaves=CHARS_DATA.filter(function(c){var sv=loadSave(c.id);return sv&&sv.char&&c.gender==='男';});
      return maleSaves.length>=3;
    },
    check_lose: null,
  },
  {
    id:'title_905', name:'女仆控', icon:'🎀',
    desc:'「主人，您回来啦～」——没有什么比这句问候更动听的了。您的宅邸里充满了黑白相间的可爱身影。',
    gain_text: function(n){ return ['「"主人，您回来啦～"——没有什么比这句问候更动听的了。」','「主人的宅邸里，似乎充满了黑白相间的可爱身影呢。」']; },
    lose_text: function(n){ return ['「女仆们似乎减少了，难道是主人找到了新的乐趣？」']; },
    check_gain: function(s){
      if(typeof CHARS_DATA==='undefined')return false;
      var maids=CHARS_DATA.filter(function(c){var sv=loadSave(c.id);return sv&&sv.char&&(c.class||'').includes('女仆');});
      return maids.length>=2;
    },
    check_lose: null,
  },
  {
    id:'title_907', name:'女王様受', icon:'👸',
    desc:'明明享受着被征服的快感，却又忍不住想要反过来支配对方……这女王般的气质，真是让人欲罢不能啊。',
    gain_text: function(n){ return ['「明明享受着被征服的快感，却又忍不住想要反过来支配对方……」','「这女王般的气质，真是让人欲罢不能啊。」']; },
    lose_text: function(n){ return ['「女王的气质……暂时沉寂了一阵，但说不定哪天又会回来呢。」']; },
    check_gain: function(s){
      return (s.currentChar&&(s.currentChar.obedience||0)>60&&(s.currentChar.lust||0)>70)||
             (typeof REVERSE_TRAINING_COUNT!=='undefined'&&REVERSE_TRAINING_COUNT>3);
    },
    check_lose: null,
  },
  {
    id:'title_912', name:'爱的传道士', icon:'💕',
    desc:'您似乎相信，调教不只是控制，更是一种深刻的理解与连结——愿您找到真正的答案。',
    gain_text: function(n){ return ['「在您的手中，调教成为了一门关于理解与连结的艺术。」','「愿您继续，将这份独特的爱，传递给每一个有幸相遇的人。」']; },
    lose_text: function(n){ return ['「爱的传道士……或许只是暂时需要休息一下呢。」']; },
    check_gain: function(s){
      if(typeof CHARS_DATA==='undefined')return false;
      var loved=CHARS_DATA.filter(function(c){var sv=loadSave(c.id);return sv&&sv.char&&(sv.char.affection||0)>=80;});
      return loved.length>=2;
    },
    check_lose: null,
  },
  {
    id:'title_913', name:'酒池肉林的国王', icon:'🍷',
    desc:'群芳环绕，尽情享乐——这庄园里，您就是无可置疑的王。',
    gain_text: function(n){ return ['「群芳环绕，尽情享乐——这庄园里，主人就是无可置疑的王。」','「愿您的王座永固，酒池肉林长在！」']; },
    lose_text: function(n){ return ['「国王的臣民减少了……不过，真正的王者不会在意的，对吗？」']; },
    check_gain: function(s){
      if(typeof CHARS_DATA==='undefined')return false;
      var acquired=CHARS_DATA.filter(function(c){var sv=loadSave(c.id);return sv&&sv.char;});
      return acquired.length>=5;
    },
    check_lose: null,
  },
  {
    id:'title_916', name:'处女守护者', icon:'🛡️',
    desc:'守护着对方最后的防线……是出于温柔，还是别有用意？只有您自己知道了。',
    gain_text: function(n){ return ['「守护着对方最后的防线……是出于温柔，还是别有用意？」','「无论如何，这份特别的克制，本身就值得一个称号。」']; },
    lose_text: function(n){ return ['「防线……已经不再了呢。不过，一起跨过的那个瞬间，想必也是难忘的。」']; },
    check_gain: function(s){ return (s.currentChar&&(s.currentChar.affection||0)>=70&&(s.currentChar.total_training_count||0)>=30&&(s.currentChar.lust||0)<40); },
    check_lose: function(s){ return (s.currentChar&&(s.currentChar.lust||0)>=60); },
  },
  {
    id:'title_919', name:'暴露狂', icon:'👁️',
    desc:'羞耻是最美的化妆品——您深谙此道，并且乐此不疲地欣赏着这幅画面。',
    gain_text: function(n){ return ['「羞耻是最美的化妆品——主人深谙此道，」','「并且乐此不疲地欣赏着这幅画面。」']; },
    lose_text: null, check_lose: null,
    check_gain: function(s){ return (s.playerExp||0)>=300&&(s.currentChar?.total_training_count||0)>=20; },
  },
  {
    id:'title_923', name:'榨精师', icon:'💦',
    desc:'细水长流？那不是您的风格。彻底的、淋漓的——才是您最满意的成果。',
    gain_text: function(n){ return ['「细水长流？那不是主人的风格。」','「彻底的、淋漓的——才是您最满意的成果。」']; },
    lose_text: null, check_lose: null,
    check_gain: function(s){ return (s.currentChar?.lust||0)>=80&&(s.currentChar?.total_training_count||0)>=50; },
  },
  {
    id:'title_925', name:'废物', icon:'💀',
    desc:'……这个称号怎么说呢。也许是在某个特别的低谷时刻解锁的。没关系，跌倒了再站起来——或者继续躺着，都行。',
    gain_text: function(n){ return ['「呃……这个称号确实有点难以启齿……」','「不过，人生嘛，谷底也是风景的一部分。继续加油吧，主人！」']; },
    lose_text: function(n){ return ['「废物的称号失去了——看来主人正在往更好的方向走。这是好事！」']; },
    check_gain: function(s){ return (s.money||0)<100&&(s.day||1)>10&&!(s.currentChar); },
    check_lose: function(s){ return (s.money||0)>=1000||(s.currentChar!=null); },
  },
  {
    id:'title_931', name:'处子狂热者', icon:'🌸',
    desc:'初次……总是令人难忘的。无论是经历过多少，那第一次的颤抖与红晕，都有着无与伦比的美感。',
    gain_text: function(n){ return ['「初次……总是令人难忘的。」','「无论经历过多少，那第一次的颤抖与红晕，都有着无与伦比的美感。主人深深地明白这一点。」']; },
    lose_text: null, check_lose: null,
    check_gain: function(s){ return (s.dateLog||[]).length>=1&&(s.currentChar?.affection||0)>=60; },
  },
  {
    id:'title_932', name:'接吻魔', icon:'💋',
    desc:'唇齿相依的温柔，胜过千言万语——您把这个道理，刻进了对方的记忆里。',
    gain_text: function(n){ return ['「唇齿相依的温柔，胜过千言万语——」','「主人把这个道理，一次次刻进了对方的记忆里。」']; },
    lose_text: null, check_lose: null,
    check_gain: function(s){ return (s.dateLog||[]).length>=3&&(s.currentChar?.affection||0)>=70; },
  },
  {
    id:'title_941', name:'萝莉控', icon:'🎀',
    desc:'娇小的身形，灵动的眼神——某种莫名的保护欲与占有欲，在您心中悄悄地交织着。',
    gain_text: function(n){ return ['「娇小的身形，灵动的眼神——」','「某种莫名的保护欲与占有欲，在主人心中悄悄地交织着呢。」']; },
    lose_text: null, check_lose: null,
    check_gain: function(s){
      if(typeof CHARS_DATA==='undefined')return false;
      var small=CHARS_DATA.filter(function(c){var sv=loadSave(c.id);return sv&&sv.char&&c.gender==='女'&&(c.class||'').match(/少女|幼/);});
      return small.length>=2;
    },
  },
  {
    id:'title_948', name:'人外控', icon:'🐾',
    desc:'兽耳、翅膀、鳞片……在您眼中，"不寻常"才是最美的风景。',
    gain_text: function(n){ return ['「兽耳、翅膀、鳞片……」','「在主人眼中，"不寻常"才是最美的风景。这份独特的审美，值得一个称号！」']; },
    lose_text: function(n){ return ['「人外收藏似乎减少了……不过审美无高低，只要是真心喜欢的，就是最好的。」']; },
    check_gain: function(s){
      if(typeof CHARS_DATA==='undefined')return false;
      var nonHuman=['龙族','天使','精灵','魔族','吸血鬼','猫娘','狐娘','兽人','恶魔'];
      var nhs=CHARS_DATA.filter(function(c){
        var sv=loadSave(c.id);
        return sv&&sv.char&&nonHuman.some(function(r){return(c.race||'').includes(r);});
      });
      return nhs.length>=2;
    },
    check_lose: function(s){
      if(typeof CHARS_DATA==='undefined')return false;
      var nonHuman=['龙族','天使','精灵','魔族','吸血鬼','猫娘','狐娘','兽人','恶魔'];
      var all=CHARS_DATA.filter(function(c){var sv=loadSave(c.id);return sv&&sv.char;});
      var nhs=all.filter(function(c){return nonHuman.some(function(r){return(c.race||'').includes(r);});});
      return all.length>0&&nhs.length<1;
    },
  },
  {
    id:'title_990', name:'吉时已到', icon:'⏰',
    desc:'天时、地利、人和——三者齐备，万事顺遂。这一刻，一切都恰到好处。',
    gain_text: function(n){ return ['「天时、地利、人和——三者齐备，万事顺遂。」','「恭喜主人，吉时已到，一切都将迎来新的开始！」']; },
    lose_text: null, check_lose: null,
    check_gain: function(s){ return (s.day||1)>=90&&(s.money||0)>=30000&&(s.currentChar?.affection||0)>=80; },
  },
  {
    id:'title_992', name:'上级调教师', icon:'🏅',
    desc:'从普通调教师到上级——这条路上，你用每一次训练、每一滴汗水证明了自己的实力。',
    gain_text: function(n){ return ['「从普通调教师到上级——」','「这条路上，主人用每一次训练、每一份坚持证明了自己的实力。恭喜晋级！」']; },
    lose_text: null, check_lose: null,
    check_gain: function(s){ return (s.playerExp||0)>=1000&&(s.currentChar?.total_training_count||0)>=80; },
  },
  {
    id:'title_999', name:'千里之行', icon:'🛤️',
    desc:'千里之行，始于足下。你已经走过了相当漫长的旅途——无论终点在哪里，路本身就是意义所在。',
    gain_text: function(n){ return ['「千里之行，始于足下。」','「主人已经走过了相当漫长的旅途——无论终点在哪里，这条路本身就是意义所在。」']; },
    lose_text: null, check_lose: null,
    check_gain: function(s){ return (s.day||1)>=100||(s.playerExp||0)>=2000; },
  },
];

// ── 称号状态存储 ─────────────────────────────────────────────
function getTitlesState() {
  try { return JSON.parse(localStorage.getItem('era_titles_state') || '{}'); } catch(e) { return {}; }
}
function saveTitlesState(o) { localStorage.setItem('era_titles_state', JSON.stringify(o)); }

// ── 检查称号得失并弹窗通知 ────────────────────────────────────
function checkTitleEvents() {
  var state = getTitlesState();
  var changed = false;
  TITLES_DATA.forEach(function(t) {
    var has = !!state[t.id];
    // 检查获得
    if (!has && typeof t.check_gain === 'function' && t.check_gain(State)) {
      state[t.id] = true;
      changed = true;
      // 弹窗通知
      var lines = t.gain_text ? t.gain_text(t.name) : ['获得了称号【'+t.name+'】'];
      setTimeout(function(tt, ls) { return function() {
        if(typeof openStoryModal==='function') {
          openStoryModal({
            title: t.icon + ' 获得称号【' + tt.name + '】',
            story: ls.concat(['——', '【'+tt.name+'】已添加至您的称号列表。'])
          }, '称号', {});
        } else {
          toast('🏷️ 获得称号【'+tt.name+'】', 'ai');
        }
      }; }(t, lines), 800);
    }
    // 检查失去
    if (has && typeof t.check_lose === 'function' && t.check_lose && t.check_lose(State)) {
      state[t.id] = false;
      changed = true;
      var loseLines = t.lose_text ? t.lose_text(t.name) : ['失去了称号【'+t.name+'】'];
      setTimeout(function(tt, ls) { return function() {
        if(typeof openStoryModal==='function') {
          openStoryModal({
            title: '💔 失去称号【' + tt.name + '】',
            story: ls.concat(['——', '【'+tt.name+'】已从您的称号列表中移除。'])
          }, '称号', {});
        } else {
          toast('称号【'+tt.name+'】已失去', '');
        }
      }; }(t, loseLines), 1200);
    }
  });
  if (changed) saveTitlesState(state);
}

// ── 检查永久成就 ──────────────────────────────────────────────
function checkTitles() {
  let changed = false;
  ACHIEVEMENTS.forEach(t => {
    if (!State.achievements.includes('title_' + t.id) && t.check(State)) {
      State.achievements.push('title_' + t.id);
      changed = true;
      toast(`✨ 成就解锁：${t.name}`, 'ai');
    }
  });
  ENDINGS.forEach(e => {
    if (!State.achievements.includes('end_' + e.id) && e.checkUnlock && e.checkUnlock(State)) {
      State.achievements.push('end_' + e.id);
      changed = true;
      toast(`🏆 结局解锁：${e.name}`, 'ai');
    }
  });
  // 同时检测称号
  checkTitleEvents();
  if (changed) localStorage.setItem('era_ach', JSON.stringify(State.achievements));
}

function checkAch() { checkTitles(); }

// ── 渲染弹窗 ─────────────────────────────────────────────────
function openAchModal() {
  checkTitles();
  _renderAchTabs('achievements');
  openOv('ov-achieve');
}

let _achTab = 'achievements';

function switchAchTab(tab, btn) {
  _achTab = tab;
  document.querySelectorAll('.ach-tab-btn').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  _renderAchTabs(tab);
}

// 点击成就/称号查看详情
function showAchDetail(id, type) {
  var item;
  if (type === 'ach') item = ACHIEVEMENTS.find(a => a.id === id);
  else if (type === 'title') item = TITLES_DATA.find(t => t.id === id);
  else if (type === 'end') item = ENDINGS.find(e => e.id === id);
  if (!item) return;

  var isTitle = type === 'title';
  var titleState = isTitle ? getTitlesState() : null;
  var hasIt = type === 'ach' ? State.achievements.includes('title_' + id) :
              type === 'end' ? State.achievements.includes('end_' + id) :
              !!(titleState && titleState[id]);

  var gainLines = isTitle && item.gain_text ? item.gain_text(item.name) : null;
  var loseNote = isTitle && item.check_lose ? '⚠️ 此称号在特定条件下会失去' : (isTitle ? '✅ 此称号永久持有，不会失去' : '');

  var html = '<div style="text-align:center;font-size:2.5rem;margin-bottom:10px">' + (item.icon||'🏅') + '</div>' +
    '<div style="font-size:1.1rem;font-weight:800;color:var(--acc2);text-align:center;margin-bottom:10px">' + esc(item.name) + '</div>' +
    '<div style="font-size:.85rem;color:var(--txt2);line-height:1.8;text-align:justify;margin-bottom:14px">' + esc(item.desc) + '</div>' +
    (item.hint ? '<div style="font-size:.72rem;color:var(--muted);background:var(--card2);border-radius:8px;padding:8px 10px;margin-bottom:10px">🔓 解锁条件：' + esc(item.hint) + '</div>' : '') +
    (loseNote ? '<div style="font-size:.72rem;color:var(--muted);margin-bottom:10px">' + loseNote + '</div>' : '') +
    '<div style="text-align:center;padding:6px 0;font-size:.82rem;font-weight:700;color:' + (hasIt ? 'var(--sg)' : 'var(--muted)') + '">' +
    (hasIt ? '✅ 已获得' : '🔒 未获得') + '</div>';

  if(typeof openCustomConfirm === 'function') {
    openCustomConfirm(item.name, html, '好的', function(){});
  }
}

function _renderAchTabs(tab) {
  const body = document.getElementById('ach-modal-body');
  if (!body) return;

  if (tab === 'achievements') {
    const unlocked = ACHIEVEMENTS.filter(t => State.achievements.includes('title_' + t.id));
    body.innerHTML =
      '<div style="font-size:.78rem;color:var(--muted);margin-bottom:12px">已解锁 ' + unlocked.length + ' / ' + ACHIEVEMENTS.length + ' 个成就</div>' +
      ACHIEVEMENTS.map(t => {
        const on = State.achievements.includes('title_' + t.id);
        return '<div class="ach ' + (on ? 'on' : '') + '" onclick="showAchDetail(\'' + t.id + '\',\'ach\')" style="cursor:pointer">' +
          '<div class="ach-ico">' + (on ? (t.icon||'✨') : '🔒') + '</div>' +
          '<div><div class="ach-ttl">' + t.name + '</div>' +
          '<div class="ach-desc">' + (on ? t.desc.slice(0,42)+'…' : t.hint) + '</div></div>' +
          '<div class="ach-lk">' + (on ? '✓' : '') + '</div>' +
        '</div>';
      }).join('');
  } else if (tab === 'titles') {
    var titleState = getTitlesState();
    var activeTitles = TITLES_DATA.filter(t => titleState[t.id]);
    body.innerHTML =
      '<div style="font-size:.78rem;color:var(--muted);margin-bottom:12px">当前持有称号 ' + activeTitles.length + ' / ' + TITLES_DATA.length + ' 个 · <span style="color:var(--acc3)">称号可得可失</span></div>' +
      TITLES_DATA.map(t => {
        const on = !!titleState[t.id];
        return '<div class="ach ' + (on ? 'on' : '') + '" onclick="showAchDetail(\'' + t.id + '\',\'title\')" style="cursor:pointer">' +
          '<div class="ach-ico" style="font-size:20px">' + (on ? (t.icon||'🏷️') : '🔒') + '</div>' +
          '<div style="flex:1"><div class="ach-ttl">' + t.name + (t.check_lose ? ' <span style="font-size:.6rem;color:var(--acc3)">可失</span>' : '') + '</div>' +
          '<div class="ach-desc">' + (on ? t.desc.slice(0,40)+'…' : '——') + '</div></div>' +
          '<div class="ach-lk" style="color:' + (on ? 'var(--sg)' : 'var(--muted)') + '">' + (on ? '持有' : '未得') + '</div>' +
        '</div>';
      }).join('');
  } else {
    const unlocked = ENDINGS.filter(e => State.achievements.includes('end_' + e.id));
    body.innerHTML =
      '<div style="font-size:.78rem;color:var(--muted);margin-bottom:12px">已解锁 ' + unlocked.length + ' / ' + ENDINGS.length + ' 个结局</div>' +
      ENDINGS.map(e => {
        const on = State.achievements.includes('end_' + e.id);
        return '<div class="ach ' + (on ? 'on' : '') + '" onclick="showAchDetail(\'' + e.id + '\',\'end\')" style="cursor:pointer;align-items:flex-start">' +
          '<div class="ach-ico" style="font-size:22px;margin-top:2px">' + (on ? e.icon : '🔒') + '</div>' +
          '<div style="flex:1"><div class="ach-ttl">' + (on ? e.name : '???') + '</div>' +
          '<div class="ach-desc">' + (on ? e.desc.slice(0,50)+'…' : e.hint) + '</div></div>' +
        '</div>';
      }).join('');
  }
}
