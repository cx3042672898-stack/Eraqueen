// ================================================================
// features.js — 新功能完整实现（v3 完全修复版）
// 依赖加载顺序：state.js → game.js → shop.js → story.js → outing.js → api.js → nav.js → achieve.js → item_self_stories.js → features.js
// ================================================================

// ── 金币流水记录 ──────────────────────────────────────────────
var _moneyLog = JSON.parse(localStorage.getItem('era_money_log')||'[]');
function _logMoney(desc, delta){
  _moneyLog.push({desc:desc, delta:delta, bal:State.money, day:State.day||1, ts:Date.now()});
  if(_moneyLog.length>100) _moneyLog=_moneyLog.slice(-100);
  localStorage.setItem('era_money_log', JSON.stringify(_moneyLog));
}
function openMoneyLog(){
  var body=document.getElementById('money-log-body');
  if(!body)return;
  if(!_moneyLog.length){
    body.innerHTML='<div style="text-align:center;padding:30px 0;color:var(--muted)"><div style="font-size:2rem;margin-bottom:8px">💰</div><p>还没有消费记录</p></div>';
  }else{
    var logs=[].concat(_moneyLog).reverse();
    body.innerHTML=logs.map(function(r){
      var isPos=r.delta>0;
      return '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--bdr2)">'+
        '<div style="font-size:1.2rem;min-width:24px">'+(isPos?'📈':'📉')+'</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:.82rem;font-weight:600;color:var(--txt)">'+esc(r.desc)+'</div>'+
          '<div style="font-size:.7rem;color:var(--muted)">第'+r.day+'天 · 余额 $'+r.bal.toLocaleString()+'</div>'+
        '</div>'+
        '<div style="font-weight:700;font-size:.88rem;color:'+(isPos?'var(--sg)':'var(--sr)')+'">'+
          (isPos?'+':'')+r.delta.toLocaleString()+
        '</div>'+
      '</div>';
    }).join('');
  }
  openOv('ov-money-log');
}

// ── 日期工具 ─────────────────────────────────────────────────
function dayToDate(day) {
  var m=[31,28,31,30,31,30,31,31,30,31,30,31], d=Math.max(0,(day-1))%365, mo=0;
  while(d>=m[mo]){d-=m[mo];mo++;}
  return (mo+1)+'月'+(d+1)+'日';
}
function getDateStr(){ return dayToDate(State.day||1); }

// ── 修复旧存档性别默认值 ─────────────────────────────────────
function ensureProfileDefaults(){
  var changed=false;
  if(!_playerProfile.gender||_playerProfile.gender==='未设定'){_playerProfile.gender='男';changed=true;}
  if(_playerProfile.stamina==null){_playerProfile.stamina=_playerProfile.energy||2000;changed=true;}
  if(_playerProfile.staminaMax==null){_playerProfile.staminaMax=2000;changed=true;}
  if(_playerProfile.energy==null){_playerProfile.energy=3000;changed=true;}
  if(_playerProfile.energyMax==null){_playerProfile.energyMax=3000;changed=true;}
  if(changed) localStorage.setItem('era_profile',JSON.stringify(_playerProfile));
  var gEl=document.getElementById('pc-gender');
  if(gEl) gEl.textContent='性别：'+_playerProfile.gender;
}

// ── 时间推进 ─────────────────────────────────────────────────
function consumeTime(period){
  State.day=(State.day||1)+1;
  var cost=period==='night'?80:120;
  _playerProfile.stamina=Math.max(0,(_playerProfile.stamina||2000)-cost);
  _playerProfile.energy=Math.max(0,(_playerProfile.energy||2000)-cost);
  // 记录体力消耗
  _staminaLog.push({desc:period==='night'?'夜间休息':'日间活动',cost:cost,remain:_playerProfile.stamina,day:State.day,ts:Date.now()});
  if(_staminaLog.length>50)_staminaLog=_staminaLog.slice(-50);
  localStorage.setItem('era_stamina_log',JSON.stringify(_staminaLog));
  localStorage.setItem('era_profile',JSON.stringify(_playerProfile));
  if(typeof renderPlayerCard==='function') renderPlayerCard();
  if(State.currentNav==='outing'){
    var sub=document.getElementById('hdr-sub');
    if(sub) sub.textContent=getDateStr()+' · 打工 · 闲逛 · 约会 · 劳役';
  }
  // ★ 每日孕育检测
  if(typeof dailyPregnancyCheck==='function') try{dailyPregnancyCheck();}catch(e){}
  // ★ 每日节日检测
  if(typeof checkFestivalWarning==='function') try{checkFestivalWarning();}catch(e){}
}

// ── 体力消耗记录 & 查看 ─────────────────────────────────────────
var _staminaLog=JSON.parse(localStorage.getItem('era_stamina_log')||'[]');
function logStaminaCost(desc,cost){
  _playerProfile.stamina=Math.max(0,(_playerProfile.stamina||2000)-cost);
  _staminaLog.push({desc:desc,cost:cost,remain:_playerProfile.stamina,day:State.day||1,ts:Date.now()});
  if(_staminaLog.length>50)_staminaLog=_staminaLog.slice(-50);
  localStorage.setItem('era_stamina_log',JSON.stringify(_staminaLog));
  localStorage.setItem('era_profile',JSON.stringify(_playerProfile));
}
function openStaminaDetail(){
  var body=document.getElementById('exp-detail-body');if(!body)return;
  var maxSta=_playerProfile.staminaMax||2000;
  var curSta=Math.round(_playerProfile.stamina!=null?_playerProfile.stamina:2000);
  var pctSta=Math.min(100,Math.round(curSta/maxSta*100));
  var maxEne=_playerProfile.energyMax||3000;
  var curEne=Math.round(_playerProfile.energy!=null?_playerProfile.energy:3000);
  var pctEne=Math.min(100,Math.round(curEne/maxEne*100));
  
  var html='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">';
  // 体力卡
  html+='<div style="text-align:center;padding:12px;background:var(--card);border:1px solid var(--bdr2);border-radius:10px"><div style="font-size:1.5rem;margin-bottom:4px">💪</div>';
  html+='<div style="font-size:.75rem;color:var(--muted)">体力</div>';
  html+='<div style="font-size:1.1rem;font-weight:800;color:var(--txt)">'+curSta+' / '+maxSta+'</div>';
  html+='<div style="height:8px;background:var(--bdr);border-radius:4px;overflow:hidden;margin-top:6px"><div style="height:100%;width:'+pctSta+'%;background:linear-gradient(90deg,#4caf50,#81c784);border-radius:4px"></div></div></div>';
  // 精力卡
  html+='<div style="text-align:center;padding:12px;background:var(--card);border:1px solid var(--bdr2);border-radius:10px"><div style="font-size:1.5rem;margin-bottom:4px">⚡</div>';
  html+='<div style="font-size:.75rem;color:var(--muted)">精力</div>';
  html+='<div style="font-size:1.1rem;font-weight:800;color:var(--txt)">'+curEne+' / '+maxEne+'</div>';
  html+='<div style="height:8px;background:var(--bdr);border-radius:4px;overflow:hidden;margin-top:6px"><div style="height:100%;width:'+pctEne+'%;background:linear-gradient(90deg,#42a5f5,#90caf9);border-radius:4px"></div></div></div>';
  html+='</div>';
  
  html+='<div style="font-size:.78rem;color:var(--muted);margin-bottom:8px;text-align:center">体力影响调教和外出活动，精力影响精神类指令</div>';
  
  html+='<div style="font-size:.82rem;font-weight:700;color:var(--txt);margin-bottom:10px;border-left:3px solid var(--acc);padding-left:8px">体力消耗记录</div>';
  if(!_staminaLog.length){html+='<div style="text-align:center;padding:20px 0;color:var(--muted);font-size:.8rem">暂无消耗记录</div>';}
  else{
    var logs=[].concat(_staminaLog).reverse().slice(0,20);
    html+='<div style="max-height:250px;overflow-y:auto">';
    logs.forEach(function(r){
      html+='<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--bdr2)">';
      html+='<div style="font-size:.9rem">📉</div>';
      html+='<div style="flex:1"><div style="font-size:.75rem;font-weight:600;color:var(--txt)">'+esc(r.desc)+'</div>';
      html+='<div style="font-size:.62rem;color:var(--muted)">第'+r.day+'天</div></div>';
      html+='<div style="font-weight:700;font-size:.78rem;color:var(--sr)">-'+r.cost+'</div></div>';
    });
    html+='</div>';
  }
  html+='<button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-exp-detail\')" style="margin-top:12px">关闭</button>';
  body.innerHTML=html;openOv('ov-exp-detail');
}
// ── 经验详情与描述数据库 (全补齐 + 专属重绘图标) ─────────────────────────────────────────────────
var EXP_ICONS = {
  'expV': '🌺', 'expA': '🍑', 'expPeak': '🎆', 'expEjac': '💦', 'expSex': '🛏️', 
  'expCreampie': '🤍', 'expAnal': '🤎', 'expU': '💧', 'expM': '🍈', 'expSolo': '🪞', 
  'expTeachSolo': '📸', 'expFluid': '🥛', 'expSemenDrinkPeak': '🤤', 'expPee': '⛲', 
  'expScat': '💩', 'expService': '🙇', 'expOral': '👅', 'expCunnilingus': '🐚', 
  'expLove': '💖', 'expWeird': '⚠️', 'expSuffer': '⛓️', 'expBite': '😈', 
  'expYuri': '🌸', 'expRose': '⚔️', 'expBind': '🎀', 'expVExpand': '🏵️', 
  'expAExpand': '⭕', 'expUExpand': '💉', 'expMilk': '🍼', 'expTentacle': '🦑', 
  'expVampire': '🦇', 'expEgg': '🥚', 'expBirth': '👶', 'expHouse': '🍳', 
  'expPhoto': '📷', 'expModel': '🎞️', 'expSing': '🎤', 'expTrain': '👑',
  'expAnalLick': '🌙',  // ★ 新增：舔肛经验
};

var EXP_FIELDS = [
  // 【基础类】
  {key:'expV', label:'Ｖ经验', group:'基础', desc:'接纳粗暴入侵的证明。累积越多，花壶就会变得愈发柔软湿润，渴求着被填满。'},
  {key:'expA', label:'Ａ经验', group:'基础', desc:'后庭被强行开发的履历。从最初的抗拒到食髓知味，肉体正一步步走向堕落。'},
  {key:'expPeak', label:'绝顶经验', group:'基础', desc:'攀上极乐巅峰的次数。每一次大脑空白的颤栗，都在将身体改造成离不开快感的模样。'},
  {key:'expEjac', label:'射精经验', group:'基础', desc:'宣泄欲望的里程碑。射得越多，积攒的量越惊人，敏感度也会变得越来越无可救药。'},
  {key:'expSex', label:'性交经验', group:'基础', desc:'最原始的欲望交融。身经百战的肉体，总能在纠缠中轻易勾起对方的欲火。'},
  {key:'expCreampie', label:'内射经验', group:'基础', desc:'最深处被滚烫白浊灌满的次数。贪婪地吞咽着精华，身体结构都在为之改变。'},
  {key:'expAnal', label:'肛射经验', group:'基础', desc:'后庭被当做精液便器的耻辱印记。温热的浊液在肠道内流淌的感觉，真是让人着迷。'},
  {key:'expU', label:'Ｕ经验', group:'基础', desc:'那条纤细敏感的尿道被侵犯的禁忌体验。稍微的刺激，就能带来触电般的疯狂战栗。'},
  {key:'expM', label:'Ｍ经验', group:'基础', desc:'胸部被反复揉捏、吸吮的证明。原本纯洁的双峰，正被慢慢调教成敏感的淫囊。'},
  {key:'expSolo', label:'自慰经验', group:'基础', desc:'深夜里难耐空虚、独自抚慰的次数。指尖的魔术，是会上瘾的毒药哦。'},
  {key:'expTeachSolo', label:'调教自慰经验', group:'基础', desc:'在他人注视下强迫玩弄自己的羞耻Play。每一次含泪的展示，都在摧毁仅存的底线。'},
  {key:'expFluid', label:'精液经验', group:'基础', desc:'品尝、吞咽雄性精华的次数。那股特有的腥甜，渐渐成了令人安心的绝佳“补品”。'},
  {key:'expSemenDrinkPeak', label:'精饮绝顶经验', group:'基础', desc:'光是咽下浓浊的精液就能爽到高潮的变态体质。大脑已经被这白色的琼浆彻底烧坏了。'},
  {key:'expPee', label:'放尿经验', group:'基础', desc:'在极度刺激下失控绝顶、水花四溅的失态记录。理智随着淡黄色的水流一同决堤。'},
  {key:'expScat', label:'排便经验', group:'基础', desc:'后庭承受重口灌肠后失控排泄的屈辱证明。连排泄的尊严都被彻底剥夺。'},

  // 【性癖类】
  {key:'expService', label:'侍奉快乐经验', group:'性癖', desc:'抛弃尊严讨好他人并获得快感的次数。“只要您舒服，我就开心”的完美奴隶。'},
  {key:'expOral', label:'口交经验', group:'性癖', desc:'用唇舌殷勤侍奉的次数。技巧越纯熟，越能用口腔轻易让对方缴械投降。'},
  {key:'expCunnilingus', label:'舔阴经验', group:'性癖', desc:'品尝秘密花园甘露的经验。灵活的舌头能带来如同水乳交融般的极致享受。'},
  {key:'expAnalLick', label:'舔肛经验', group:'性癖', desc:'用唇舌侍奉最隐秘禁忌之处的耻辱履历。那种难以启齿的酥麻感，正在一点点瓦解高傲的防线。'},  // ★ 新增
  {key:'expLove', label:'爱情经验', group:'性癖', desc:'在肌肤相亲中感受到浓浓爱意的瞬间。不仅仅是肉欲，连灵魂都交织在一起了。'},
  {key:'expSuffer', label:'痛苦快乐经验', group:'性癖', desc:'痛楚与快感神经发生短路的证明。比起温柔的爱抚，现在的身体更渴望粗暴的鞭挞。'},
  {key:'expBite', label:'嗜虐快乐经验', group:'性癖', desc:'看着猎物在自己手下哭泣求饶而感到兴奋。骨子里的施虐欲正在渐渐苏醒呢。'},
  {key:'expYuri', label:'百合经验', group:'性癖', desc:'女孩子之间柔软芳香的秘密纠缠。没有粗暴的侵犯，只有水乳交融的甜美。'},
  {key:'expRose', label:'蔷薇经验', group:'性癖', desc:'男男之间充满力量感与雄性荷尔蒙的冲撞。一旦陷入这泥潭，就再也无法自拔了。'},
  {key:'expBind', label:'紧缚经验', group:'性癖', desc:'被粗暴捆绑、悬吊的次数。从最初的挣扎，到后来甚至会期待绳索勒进肉里的快感。'},

  // 【极堕类】
  {key:'expVExpand', label:'Ｖ扩张经验', group:'极堕', desc:'花壶被难以想象的异物强行撑开的恐怖记录。极限在哪里呢？早就没有极限了。'},
  {key:'expAExpand', label:'Ａ扩张经验', group:'极堕', desc:'后庭被粗暴扩张到不可思议程度的履历。肠道已经被彻底玩坏，变成黑洞了。'},
  {key:'expUExpand', label:'Ｕ扩张经验', group:'极堕', desc:'最脆弱的通道被强行扩充的禁忌惩罚。连排泄的机能都被彻底玩弄于股掌之间。'},
  {key:'expMilk', label:'喷乳经验', group:'极堕', desc:'受到刺激后，乳汁如泉水般喷涌的次数。身体已经完全记住了作为“产奶工具”的职责。'},
  {key:'expTentacle', label:'触手经验', group:'极堕', desc:'被湿滑黏腻的异形生物缠绕、侵犯的噩梦。理智被触手的粘液一点点溶解。'},
  {key:'expVampire', label:'吸血经验', group:'极堕', desc:'颈侧被獠牙刺破、生命力随血液流失的迷乱体验。痛苦伴随着诡异的销魂快感。'},
  {key:'expEgg', label:'产卵经验', group:'极堕', desc:'腹部被异物塞满，随后像生育般将卵排出的离奇经历。母性本能在奇怪的地方觉醒了。'},
  {key:'expBirth', label:'生育经验', group:'极堕', desc:'十月怀胎、诞下子嗣的伟大且艰辛的经历。作为“母亲”的属性正在不断攀升。'},
  {key:'expWeird', label:'异常经验', group:'极堕', desc:'经历了超出常理的严酷调教。每一次精神的崩坏与重组，都在把人推向不可挽回的深渊。'},

  // 【日常类】
  {key:'expHouse', label:'家务经验', group:'日常', desc:'洗手作羹汤、打扫卫生的居家日常。想抓住一个人的心，先抓住他的胃！'},
  {key:'expPhoto', label:'摄影经验', group:'日常', desc:'举起相机，将羞耻、淫靡的瞬间定格。镜头的背后，藏着怎样贪婪的目光呢？'},
  {key:'expModel', label:'被拍经验', group:'日常', desc:'在镜头前被迫摆出各种下流姿势的耻辱。就算哭着求饶，快门声也不会停止哦。'},
  {key:'expSing', label:'歌唱经验', group:'日常', desc:'用歌声传递情感的次数。清脆的嗓音，不仅能在舞台上闪耀，也能在床上唱出动听的呻吟。'},
  {key:'expTrain', label:'调教经验', group:'日常', desc:'作为支配者挥下皮鞭、下达指令的经验。看着高傲的人在自己脚下臣服，真是无与伦比的享受。'}
];




function getPlayerExpData() { try { return JSON.parse(localStorage.getItem('era_player_exp') || '{}'); } catch (e) { return {}; } }
function savePlayerExpData(o) { localStorage.setItem('era_player_exp', JSON.stringify(o)); }
// 中文label → 短key 映射表（解决 item_self_stories 用中文key、EXP_FIELDS用短key不匹配的问题）
var EXP_LABEL_TO_KEY = {
  'V经验':'expV','A经验':'expA','绝顶经验':'expPeak','射精经验':'expEjac',
  '性交经验':'expSex','内射经验':'expCreampie','肛射经验':'expAnal',
  'U经验':'expU','M经验':'expM','自慰经验':'expSolo','调教自慰经验':'expTeachSolo',
  '精液经验':'expFluid','精饮绝顶经验':'expSemenDrinkPeak','放尿经验':'expPee',
  '排便经验':'expScat','侍奉快乐经验':'expService','口交经验':'expOral',
  '舔阴经验':'expCunnilingus','爱情经验':'expLove','痛苦快乐经验':'expSuffer',
  '嗜虐快乐经验':'expBite','百合经验':'expYuri','蔷薇经验':'expRose',
  '紧缚经验':'expBind','V扩张经验':'expVExpand','A扩张经验':'expAExpand',
  'U扩张经验':'expUExpand','喷乳经验':'expMilk','触手经验':'expTentacle',
  '吸血经验':'expVampire','产卵经验':'expEgg','生育经验':'expBirth',
  '异常经验':'expWeird','家务经验':'expHouse','摄影经验':'expPhoto',
  '被拍经验':'expModel','歌唱经验':'expSing','调教经验':'expTrain',
  '前列腺经验':'expAnal','露出经验':'expPhoto',
  '舔肛经验':'expAnalLick',  // ★ 新增
};
function addPlayerExp(key, amt) {
  // 若key是中文label，转换成短key
  var realKey = EXP_LABEL_TO_KEY[key] || key;
  var e = getPlayerExpData();
  e[realKey] = (e[realKey] || 0) + amt;
  savePlayerExpData(e);
  State.playerExp = (State.playerExp || 0) + amt;
  if (typeof saveMiniState === 'function') saveMiniState();
}

function getExpLvAndProgress(val) {
  if (val <= 0) return { lv: 0, pct: 0 };
  if (val < 20) return { lv: 1, pct: (val / 20) * 100 };
  if (val < 50) return { lv: 2, pct: ((val - 20) / 30) * 100 };
  if (val < 100) return { lv: 3, pct: ((val - 50) / 50) * 100 };
  if (val < 200) return { lv: 4, pct: ((val - 100) / 100) * 100 };
  return { lv: 5, pct: 100 };
}

// ── 可视化：紧凑型成就墙 ─────────────────────────────────────────────────
function openExpDetail() {
  var body = document.getElementById('exp-detail-body');
  if (!body) return;
  var exp = getPlayerExpData();
  
  var groups = { '基础': [], '性癖': [], '极堕': [], '日常': [] };
  EXP_FIELDS.forEach(function (f) { if (groups[f.group]) groups[f.group].push(f); });

  // CSS 核心改动：采用 auto-fill minmax(145px)，确保手机端能塞下2列，大幅缩减高度
  var html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div style="font-size:.82rem;color:var(--muted)">各项经验详情</div>
      <div style="font-size:.78rem;color:var(--acc);font-weight:700">总计：${State.playerExp || 0}</div>
    </div>
    <style>
      .exp-grid-v4 { display: grid; grid-template-columns: repeat(auto-fill, minmax(145px, 1fr)); gap: 10px; margin-bottom: 20px; }
      .exp-card-v4 { position: relative; background: var(--card); border: 1px solid var(--bdr); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.02); transition: transform 0.2s; }
      .exp-card-v4.zero { filter: grayscale(100%); opacity: 0.6; }
      
      .exp-card-hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
      .exp-icon-title { display: flex; align-items: center; gap: 4px; font-weight: 800; font-size: 0.88rem; color: var(--txt); }
      .exp-val-box { display: flex; flex-direction: column; align-items: flex-end; }
      .exp-val { font-size: 1.1rem; font-weight: 900; line-height: 1; }
      .exp-lv { font-size: 0.6rem; font-weight: bold; margin-top: 3px; padding: 1px 4px; border-radius: 4px; background: var(--card2); }
      
      .exp-desc { font-size: 0.72rem; color: var(--txt2); line-height: 1.45; text-align: justify; flex: 1; margin-bottom: 6px; }
      
      .exp-bar-bg { width: 100%; height: 3px; background: var(--bdr2); border-radius: 2px; overflow: hidden; margin-top: auto; }
      .exp-bar-fill { height: 100%; border-radius: 2px; }

      /* 主题色系 */
      .theme-base:not(.zero) { border-color: rgba(115,209,139,0.4); background: linear-gradient(180deg, rgba(115,209,139,0.06) 0%, var(--card) 60%); }
      .theme-base .exp-val { color: #4caf50; } .theme-base .exp-bar-fill { background: #4caf50; } .theme-base .exp-lv { color: #4caf50; }
      
      .theme-skill:not(.zero) { border-color: rgba(176,144,240,0.4); background: linear-gradient(180deg, rgba(176,144,240,0.06) 0%, var(--card) 60%); }
      .theme-skill .exp-val { color: #9c27b0; } .theme-skill .exp-bar-fill { background: #9c27b0; } .theme-skill .exp-lv { color: #9c27b0; }
      
      .theme-hardcore:not(.zero) { border-color: rgba(239,83,80,0.4); background: linear-gradient(180deg, rgba(239,83,80,0.06) 0%, var(--card) 60%); }
      .theme-hardcore .exp-val { color: #e53935; } .theme-hardcore .exp-bar-fill { background: #e53935; } .theme-hardcore .exp-lv { color: #e53935; }
      
      .theme-daily:not(.zero) { border-color: rgba(240,192,80,0.4); background: linear-gradient(180deg, rgba(240,192,80,0.06) 0%, var(--card) 60%); }
      .theme-daily .exp-val { color: #f57c00; } .theme-daily .exp-bar-fill { background: #f57c00; } .theme-daily .exp-lv { color: #f57c00; }
    </style>
  `;

  var groupThemes = { '基础': 'theme-base', '性癖': 'theme-skill', '极堕': 'theme-hardcore', '日常': 'theme-daily' };

  for (var gn in groups) {
    if (groups[gn].length === 0) continue;

    html += `<div style="font-weight:800; margin-bottom:12px; margin-top:10px; color:var(--txt); font-size:1.1rem; border-left: 4px solid var(--acc); padding-left: 8px;">${gn}篇</div>`;
    html += `<div class="exp-grid-v4">`;
    
    groups[gn].forEach(function (item) {
      var val = exp[item.key] || 0;
      var icon = EXP_ICONS[item.key] || '✨';
      var theme = groupThemes[gn];
      var isActive = val > 0 ? '' : 'zero';
      var status = getExpLvAndProgress(val);
      
      // 生成紧凑型卡片
      html += `
        <div class="exp-card-v4 ${theme} ${isActive}">
          <div class="exp-card-hdr">
            <div class="exp-icon-title">
              <span style="font-size:1.15rem;">${icon}</span>
              <span>${item.label}</span>
            </div>
            <div class="exp-val-box">
              <span class="exp-val">${val}</span>
              <span class="exp-lv">LV.${status.lv}</span>
            </div>
          </div>
          <div class="exp-desc">${item.desc}</div>
          ${val > 0 ? `<div class="exp-bar-bg"><div class="exp-bar-fill" style="width: ${status.pct}%"></div></div>` : ''}
        </div>
      `;
    });
    html += `</div>`;
  }
  
  body.innerHTML = html;
  openOv('ov-exp-detail');
}




// ── 个人状态面板（可视化）────────────────────────────────────
function openStatusPanel(){
  var body=document.getElementById('status-body');
  if(!body)return;
  var det=getPlayerDetail(), exp=getPlayerExpData();
  var totalExp=Object.values(exp).reduce(function(a,b){return a+b;},0);
  var hypLv=det.hypnosisLv||1, hypPts=det.hypnosPts||0;

  function statCard(icon,label,val,maxVal,color){
    var pct=maxVal?Math.min(100,Math.round(val/maxVal*100)):0;
    return '<div style="background:var(--card);border:1px solid var(--bdr2);border-radius:10px;padding:12px">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'+
        '<span style="font-size:.82rem;font-weight:600">'+icon+' '+label+'</span>'+
        '<span style="font-size:.88rem;font-weight:700;color:'+color+'">'+val+(maxVal?'/'+maxVal:'')+'</span>'+
      '</div>'+
      '<div style="height:6px;background:var(--bdr);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+color+';border-radius:3px;transition:width .4s"></div></div>'+
    '</div>';
  }
  function lvCard(icon,label,lv,color){
    return '<div style="background:var(--card);border:1px solid var(--bdr2);border-radius:10px;padding:10px;text-align:center">'+
      '<div style="font-size:1.4rem;margin-bottom:4px">'+icon+'</div>'+
      '<div style="font-size:.72rem;color:var(--muted);margin-bottom:2px">'+label+'</div>'+
      '<div style="font-size:1rem;font-weight:800;color:'+color+'">LV.'+lv+'</div>'+
    '</div>';
  }

  body.innerHTML=
    '<div style="font-size:.82rem;font-weight:700;color:var(--txt);margin-bottom:10px">🔮 催眠能力</div>'+
    '<div style="display:grid;gap:8px;margin-bottom:16px">'+
      statCard('🧠','催眠技能',hypLv,10,'#b090f0')+
      statCard('✨','催眠点数',hypPts,1000,'#b090f0')+
    '</div>'+
    '<div style="font-size:.82rem;font-weight:700;color:var(--txt);margin-bottom:10px">⚔️ 能力素质</div>'+
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">'+
      lvCard('🎯','顺从能力',det.obedienceLv||1,'var(--acc)')+
      lvCard('🔥','欲望把控',det.lustLv||1,'var(--sr)')+
      lvCard('✋','技巧熟练',det.skillLv||1,'var(--sb)')+
    '</div>'+
    '<div style="font-size:.82rem;font-weight:700;color:var(--txt);margin-bottom:10px">📋 素质标签</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px">'+
      (det.traits||[]).map(function(t){return '<span style="padding:3px 8px;background:var(--card);border:1px solid var(--bdr2);border-radius:6px;font-size:.72rem;color:var(--txt2)">'+esc(t)+'</span>';}).join('')+
      ((det.traits||[]).length===0?'<span style="color:var(--muted);font-size:.75rem">暂无素质</span>':'')+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px">'+
    '<button class="btn btn-ghost btn-full" onclick="openExpDetail()">📊 经验详情</button>'+
    '<button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-status\')">关闭</button></div>';

  // 追加经历和亲属栏目
  var fallen = det.fallen || [];
  var expHtml = '<div style="font-size:.82rem;font-weight:700;color:var(--txt);margin:16px 0 10px">📜 经历</div>';
  expHtml += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:10px">';
  expHtml += '<div style="background:var(--card);border:1px solid var(--bdr2);border-radius:8px;padding:8px 10px"><div style="font-size:.65rem;color:var(--muted)">陷落人数</div><div style="font-weight:700;color:var(--txt)">'+ fallen.length +' 人</div></div>';
  expHtml += '<div style="background:var(--card);border:1px solid var(--bdr2);border-radius:8px;padding:8px 10px"><div style="font-size:.65rem;color:var(--muted)">交予童贞的对象</div><div style="font-weight:700;color:var(--txt)">'+ esc(det.firstVirginity||'——') +'</div></div>';
  expHtml += '<div style="background:var(--card);border:1px solid var(--bdr2);border-radius:8px;padding:8px 10px"><div style="font-size:.65rem;color:var(--muted)">交予后庭处子的对象</div><div style="font-weight:700;color:var(--txt)">'+ esc(det.firstAnal||'——') +'</div></div>';
  expHtml += '<div style="background:var(--card);border:1px solid var(--bdr2);border-radius:8px;padding:8px 10px"><div style="font-size:.65rem;color:var(--muted)">经验总计</div><div style="font-weight:700;color:var(--txt)">'+ (State.playerExp||0) +'</div></div>';
  expHtml += '</div>';
  if(fallen.length) {
    expHtml += '<div style="font-size:.72rem;color:var(--muted);margin-bottom:10px">已陷落：' + fallen.map(function(n){return esc(n);}).join('、') + '</div>';
  }

  expHtml += '<div style="font-size:.82rem;font-weight:700;color:var(--txt);margin:10px 0 10px">👨‍👩‍👧 亲属关系</div>';
  var relatives = det.relatives || [];
  if(relatives.length) {
    expHtml += '<div style="display:grid;gap:6px;margin-bottom:10px">';
    relatives.forEach(function(r){ expHtml += '<div style="background:var(--card);border:1px solid var(--bdr2);border-radius:8px;padding:7px 10px;font-size:.78rem"><span style="color:var(--muted)">'+ esc(r.relation||'') +'</span> <strong>'+ esc(r.name||'') +'</strong></div>'; });
    expHtml += '</div>';
  } else {
    expHtml += '<div style="font-size:.75rem;color:var(--muted);margin-bottom:10px">暂无亲属记录</div>';
  }

  // 插入到关闭按钮之前
  var closeBtnHtml = body.innerHTML;
  var insertPos = closeBtnHtml.lastIndexOf('<div style="display:grid;grid-template-columns:1fr 1fr');
  if(insertPos > 0) {
    body.innerHTML = closeBtnHtml.substring(0,insertPos) + expHtml + closeBtnHtml.substring(insertPos);
  }

  openOv('ov-status');
}

// ── 主人档案 ─────────────────────────────────────────────────
function getPlayerDetail(){try{return JSON.parse(localStorage.getItem('era_player_detail')||'{}');}catch(e){return{};}}
function savePlayerDetail(d){localStorage.setItem('era_player_detail',JSON.stringify(d));}

function openPlayerDetail(){
  // redirect to status panel
  openStatusPanel();
}

// ── 洗脑催眠 ─────────────────────────────────────────────────
var BRAINWASH_TYPES=[
  {id:'personality',name:'性格转换',cost:100000,removeCost:null,
   desc:'让奴隶转换成其他的性格，也可顺带清除被调教的记忆。可能会有认不出主人的副作用……不过身体对您的记忆可是不会消失的！'},
  {id:'rank_up',name:'转换上级陷落',cost:100000,removeCost:null,
   desc:'强行扭转心智的陷落方向。比如把亲爱转成娼夫，就不会再产生烦人的嫉妒了，非常方便的洗脑。'},
  {id:'omega',name:'洗脑成Omega',cost:100000,removeCost:20000,
   desc:'专属男奴隶的肉体改造洗脑，让男性也能用后庭怀孕！每月的15、30日为发情期，这天他会变得极其淫荡渴求。'},
  {id:'sissy',name:'洗脑成病娇',cost:20000,removeCost:20000,
   desc:'彻底摧毁理智的疯狂洗脑。坏掉的奴隶那份病态的爱意与疯狂，别有一番风情呢。'},
];

function openHypnosis(){
  var body = document.getElementById('hypnosis-body');
  if(!body) return;
  var det = getPlayerDetail();
  
  // 注入洗脑专属CSS样式
  var styleHtml = `
    <style>
      .hypno-box { background: linear-gradient(135deg, rgba(176,144,240,0.08) 0%, rgba(0,0,0,0.2) 100%); border: 1px solid rgba(176,144,240,0.3); border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: inset 0 0 20px rgba(176,144,240,0.05); }
      .hypno-text { font-size: 0.85rem; line-height: 1.8; color: var(--txt2); text-align: justify; }
      .hypno-text strong { color: #b090f0; font-weight: bold; }
      .hypno-stat-row { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; border-left: 3px solid #b090f0; }
      
      .hypno-btn-grid { display: flex; flex-direction: column; gap: 10px; }
      .hypno-btn { display: flex; align-items: center; background: var(--card); border: 1px solid var(--bdr); border-radius: 10px; padding: 12px 16px; cursor: pointer; transition: all 0.2s; }
      .hypno-btn:active { transform: scale(0.97); border-color: #b090f0; background: rgba(176,144,240,0.05); }
      .hypno-btn-icon { font-size: 1.6rem; margin-right: 14px; filter: drop-shadow(0 0 4px rgba(176,144,240,0.5)); }
      .hypno-btn-content { display: flex; flex-direction: column; }
      .hypno-btn-title { font-size: 0.95rem; font-weight: 800; color: var(--txt); margin-bottom: 2px; }
      .hypno-btn-desc { font-size: 0.7rem; color: var(--muted); }
    </style>
  `;

  var menuItems = [
    { icon: '🔮', title: '对奴隶进行洗脑', desc: '使用极端的手段，彻底重塑身心', fn: 'openHypnoBrainwash()' },
    { icon: '📜', title: '查阅催眠秘典', desc: '重新了解各种洗脑项目的风险与收益', fn: 'showHypnoIntro()' },
    { icon: '🗝️', title: '重置催眠暗号', desc: '修改那个能让她/他瞬间失去理智的词汇', fn: 'openHypnoKeyword()' },
    { icon: '🚪', title: '离开密室', desc: '结束本次危险的操作', fn: "closeOv('ov-hypnosis')" }
  ];

  var menuHtml = menuItems.map(item => `
    <div class="hypno-btn" onclick="${item.fn}">
      <div class="hypno-btn-icon">${item.icon}</div>
      <div class="hypno-btn-content">
        <span class="hypno-btn-title">${item.title}</span>
        <span class="hypno-btn-desc">${item.desc}</span>
      </div>
    </div>
  `).join('');

  body.innerHTML = styleHtml + `
    <div class="hypno-box">
      <div class="hypno-text">
        为了调教出更优秀、更符合心意的奴隶，有时必须用到<strong>非常手段</strong>。<br>
        不过是一些小伎俩，就能让玩具保持新鲜感，何乐而不为呢？<br>
        哦！当然是需要花费些微的代价，不过，对一位优秀的调教师而言，不算什么吧？<br>
        <span style="color:#e53935; font-size:0.75rem;">⚠️ 警告：洗脑对象必须是身心已完全臣服的上级奴隶。若奴隶当前压力过大，强行洗脑可能导致不可逆的精神崩溃！</span>
      </div>
    </div>
    <div class="hypno-stat-row">
      <span style="color:var(--txt2); font-size:0.85rem;">催眠技能：<strong style="color:#b090f0; font-size:1.1rem; margin-left:4px;">LV.${det.hypnosisLv||1}</strong></span>
      <span style="color:var(--txt2); font-size:0.85rem;">催眠点数：<strong style="color:#b090f0; font-size:1.1rem; margin-left:4px;">${det.hypnosPts||0}</strong></span>
    </div>
    <div class="hypno-btn-grid">
      ${menuHtml}
    </div>
  `;
  openOv('ov-hypnosis');
}

function showHypnoIntro(){
  var body = document.getElementById('hypnosis-body');
  if(!body) return;
  
  var rows = BRAINWASH_TYPES.map(t => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px dashed rgba(176,144,240,0.2);">
      <span style="font-weight:bold; color:var(--txt);">${t.name}</span>
      <div style="text-align:right;">
        <div style="color:#e53935; font-weight:bold; font-size:0.9rem;">$${(t.cost/10000).toFixed(0)} 万</div>
        ${t.removeCost ? `<div style="font-size:0.65rem; color:var(--muted);">消除需 $${(t.removeCost/10000).toFixed(0)}万</div>` : ''}
      </div>
    </div>
  `).join('');

  body.innerHTML = `
    <div style="font-size:1.1rem; font-weight:800; color:#b090f0; margin-bottom:12px; text-align:center;">📖 催眠洗脑秘典</div>
    <div style="font-size:0.82rem; line-height:1.8; color:var(--txt2); background:var(--card2); padding:14px; border-radius:10px; margin-bottom:16px;">
      <p style="margin-bottom:8px;"><strong>• 性格转换：</strong>让奴隶转换成其他的性格，也可顺带清除被调教的记忆！就是可能会有小小的副作用，比如认不出主人来……不过身体对您的记忆可是不会消失的！</p>
      <p style="margin-bottom:8px;"><strong>• 转换上级陷落：</strong>如果把爱人转成娼夫，就不会嫉妒了，是不是很方便~</p>
      <p style="margin-bottom:8px;"><strong>• 洗脑成Omega：</strong>专属男奴隶的洗脑，就算是男性也能用屁股怀孕！Omega的发情期为每月的15、30日，这天你的Omega会特别热情并且更容易受孕哦！</p>
      <p style="margin-bottom:0;"><strong>• 洗脑成病娇：</strong>诶嘿~总是有喜欢这方面口味的受众，坏掉的奴隶也别有风情呢！</p>
    </div>
    <div style="background:rgba(0,0,0,0.1); border:1px solid var(--bdr); border-radius:10px; padding:12px 16px;">
      <div style="text-align:center; font-weight:800; margin-bottom:10px; color:var(--txt);">💎 洗脑价目表</div>
      ${rows}
    </div>
    <button class="btn btn-ghost btn-full" onclick="openHypnosis()" style="margin-top:18px; border:1px solid #b090f0; color:#b090f0;">← 返回密室</button>
  `;
}

function openHypnoBrainwash(){
  if(!State.currentChar){toast('请先在角色列表选择调教对象','');return;}
  var body = document.getElementById('hypnosis-body');
  if(!body) return;
  var c = State.currentChar;
  
  var cards = BRAINWASH_TYPES.map(t => `
    <div style="background:var(--card); border:1px solid var(--bdr); border-radius:10px; padding:12px; margin-bottom:10px; cursor:pointer; transition:all 0.2s;" onclick="doBrainwash('${t.id}')">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-size:1.05rem; font-weight:bold; color:var(--txt);">${t.name}</span>
        <span style="background:rgba(229,57,53,0.1); color:#e53935; padding:2px 8px; border-radius:6px; font-weight:bold; font-size:0.85rem;">$${(t.cost/10000).toFixed(0)}万</span>
      </div>
      <div style="font-size:0.75rem; color:var(--txt2); line-height:1.5;">${t.desc}</div>
    </div>
  `).join('');

  body.innerHTML = `
    <div style="display:flex; align-items:center; background:linear-gradient(90deg, rgba(176,144,240,0.15) 0%, transparent 100%); padding:12px; border-radius:8px; border-left:4px solid #b090f0; margin-bottom:16px;">
      <div style="font-size:2rem; margin-right:12px;">🧠</div>
      <div>
        <div style="font-size:0.75rem; color:var(--muted);">即将改造的猎物</div>
        <div style="font-size:1.1rem; font-weight:bold; color:var(--txt);">${esc(c.name)}</div>
      </div>
      <div style="margin-left:auto; text-align:right;">
        <div style="font-size:0.7rem; color:var(--muted);">当前资金</div>
        <div style="font-weight:bold; color:#f0c050;">💰 ${fmtMoney(State.money)}</div>
      </div>
    </div>
    ${cards}
    <button class="btn btn-ghost btn-full" style="margin-top:12px; border:1px solid var(--bdr);" onclick="openHypnosis()">← 返回上一级</button>
  `;
}

function doBrainwash(typeId){
  var t = BRAINWASH_TYPES.filter(b => b.id === typeId)[0];
  if(!t || !State.currentChar) return;
  if(State.money < t.cost){toast('金币不足，无法进行洗脑','err');return;}
  var c = State.currentChar;

  if(typeId === 'personality'){
    // 性格转换：弹出选择面板
    _openPersonalitySelect(c, t.cost);
    return;
  }
  if(typeId === 'rank_up'){
    _openRankUpSelect(c, t.cost);
    return;
  }
  if(typeId === 'omega'){
    _openOmegaConfirm(c, t.cost, !c.hypno_omega);
    return;
  }
  if(typeId === 'sissy'){
    _openYandereConfirm(c, t.cost, !c.hypno_sissy);
    return;
  }
}

// ── 性格转换面板 ──
function _openPersonalitySelect(c, cost){
  var body = document.getElementById('hypnosis-body');
  if(!body) return;
  var personalities = [
    '开朗元气','稳重温柔','认真固执','花花公子','别扭傲娇',
    '目中无人高傲','举止温和腹黑','阴暗无口冷漠','蛮不讲理精英',
    '任性爱撒娇','直率纯真','无常识自恋','天然电波',
    '痞气油嘴滑舌','心机白莲花','创伤自暴自弃','清冷仙尊'
  ];
  var btns = personalities.filter(p => p !== c.personality).map(p =>
    `<button class="btn btn-ghost" style="font-size:.78rem;padding:8px 12px;margin:3px" onclick="_doPersonalityChange('${p}',${cost})">${p}</button>`
  ).join('');
  body.innerHTML = `
    <div style="text-align:center;font-size:1.2rem;margin-bottom:12px">🧠 性格转换</div>
    <div style="font-size:.82rem;color:var(--txt2);margin-bottom:12px;line-height:1.7;padding:10px;background:var(--card2);border-radius:8px">
      将 <strong>${esc(c.name)}</strong> 的性格从「${esc(c.personality||'未知')}」转换为其他性格。<br>
      费用：<strong style="color:#e53935">$${(cost/10000)}万</strong>。洗脑后可能导致记忆紊乱。
    </div>
    <div style="font-size:.78rem;color:var(--muted);margin-bottom:8px">选择目标性格：</div>
    <div style="display:flex;flex-wrap:wrap;justify-content:center">${btns}</div>
    <button class="btn btn-ghost btn-full" onclick="openHypnoBrainwash()" style="margin-top:16px">← 返回</button>
  `;
}
function _doPersonalityChange(newPersonality, cost){
  var c = State.currentChar;
  if(!c || State.money < cost){toast('金币不足','err');return;}
  var oldP = c.personality;
  State.money -= cost;
  _logMoney('洗脑·性格转换', -cost);
  c.personality = newPersonality;
  if(typeof writeSave==='function') writeSave();

  var storyLines = [
    '「好的，已经确认完毕了，马上为您的奴隶进行深度而优质的洗脑～」',
    '……………',
    '………',
    '…',
    c.name+'的性格现在是「'+newPersonality+'」了。',
    '被洗脑完的'+c.name+'扶着脑袋，一副昏昏沉沉的样子。',
    '当主人要带'+c.name+'离开时，'+c.name+'露出了恍惚的微笑……',
  ];
  pushStoryLog('hypno',{title:'性格转换·'+c.name,date:getDateStr(),char:c.name,story:storyLines});
  openCustomConfirm('🧠 性格转换完成',
    '<div style="text-align:center;line-height:2;font-size:.85rem">'+
    '<p>'+esc(c.name)+'的性格已从</p>'+
    '<p><strong style="color:var(--sr)">「'+esc(oldP)+'」</strong> → <strong style="color:var(--sg)">「'+esc(newPersonality)+'」</strong></p>'+
    '<p style="font-size:.75rem;color:var(--muted);margin-top:8px">被洗脑完的'+esc(c.name)+'扶着脑袋，一副昏昏沉沉的样子……</p>'+
    '<p style="font-size:.72rem;color:#e53935">花费了 $'+(cost/10000)+'万</p>'+
    '</div>',
    '确认', function(){ closeOv('ov-hypnosis'); if(typeof renderPlay==='function')renderPlay(); });
}

// ── 转换上级陷落 ──
function _openRankUpSelect(c, cost){
  var body = document.getElementById('hypnosis-body');
  if(!body) return;
  var types = [
    {id:'love',name:'相亲相爱',desc:'温柔的归属感，沉溺于爱的牢笼中',icon:'💕'},
    {id:'slave',name:'娼妇化',desc:'肉体的完全屈服，在快感中失去自我',icon:'🔞'},
    {id:'loyal',name:'隶属',desc:'精神的绝对服从，忠犬般的存在',icon:'⛓️'},
  ];
  var btns = types.map(t =>
    `<div style="background:var(--card);border:1px solid var(--bdr);border-radius:10px;padding:12px;margin-bottom:8px;cursor:pointer" onclick="_doRankUp('${t.id}','${t.name}',${cost})">
      <div style="font-size:1.1rem;margin-bottom:4px">${t.icon} <strong>${t.name}</strong></div>
      <div style="font-size:.72rem;color:var(--muted)">${t.desc}</div>
    </div>`
  ).join('');
  body.innerHTML = `
    <div style="text-align:center;font-size:1.2rem;margin-bottom:12px">⛓️ 转换上级陷落</div>
    <div style="font-size:.82rem;color:var(--txt2);margin-bottom:14px;padding:10px;background:var(--card2);border-radius:8px;line-height:1.7">
      强行扭转 <strong>${esc(c.name)}</strong> 心智的陷落方向。<br>费用：<strong style="color:#e53935">$${cost/10000}万</strong>
    </div>
    ${btns}
    <button class="btn btn-ghost btn-full" onclick="openHypnoBrainwash()" style="margin-top:8px">← 返回</button>
  `;
}
function _doRankUp(typeId, typeName, cost){
  var c = State.currentChar;
  if(!c || State.money < cost){toast('金币不足','err');return;}
  State.money -= cost;
  _logMoney('洗脑·'+typeName, -cost);
  c.rank_type = typeId;
  c.hypno_rank_up = true;
  if(c.obedience) c.obedience = Math.min(100, c.obedience + 10);
  if(typeof writeSave==='function') writeSave();
  var story = [c.name+'获得了「'+typeName+'」属性。','被洗脑完的'+c.name+'扶着脑袋，一副昏昏沉沉的样子……','花费了 $'+(cost/10000)+'万'];
  pushStoryLog('hypno',{title:'上级陷落·'+typeName,date:getDateStr(),char:c.name,story:story});
  toast('✓ '+c.name+'获得了「'+typeName+'」','ok');
  closeOv('ov-hypnosis');
  if(typeof renderPlay==='function')renderPlay();
}

// ── Omega洗脑 ──
function _openOmegaConfirm(c, cost, isApply){
  var body = document.getElementById('hypnosis-body');
  if(!body) return;
  var title = isApply ? '洗脑成Omega' : '清除Omega';
  var price = isApply ? cost : 20000;
  body.innerHTML = `
    <div style="text-align:center;font-size:1.2rem;margin-bottom:12px">🌀 ${title}</div>
    <div style="font-size:.82rem;color:var(--txt2);margin-bottom:14px;padding:12px;background:var(--card2);border-radius:8px;line-height:1.8">
      ${isApply
        ? '将 <strong>'+esc(c.name)+'</strong> 进行肉体改造洗脑，让其也能用后庭怀孕。<br>每月15、30日为发情期，会变得极其淫荡渴求。'
        : '消除 <strong>'+esc(c.name)+'</strong> 的Omega属性，恢复正常状态。'}
      <br>费用：<strong style="color:#e53935">$${price/10000}万</strong>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost btn-full" onclick="openHypnoBrainwash()">取消</button>
      <button class="btn btn-p btn-full" style="background:#b090f0;color:#fff" onclick="_doOmega(${isApply?1:0},${price})">确认${title}</button>
    </div>
  `;
}
function _doOmega(apply, cost){
  var c = State.currentChar;
  if(!c || State.money < cost){toast('金币不足','err');return;}
  State.money -= cost; _logMoney('洗脑·'+(apply?'Omega':'清除Omega'), -cost);
  c.hypno_omega = !!apply;
  if(apply){ c.lust = Math.min(100, (c.lust||0)+15); }
  if(typeof writeSave==='function') writeSave();
  var msg = apply ? c.name+'成为了Omega！' : c.name+'已恢复正常。';
  pushStoryLog('hypno',{title:(apply?'Omega化':'清除Omega'),date:getDateStr(),char:c.name,story:[msg,'花费了 $'+(cost/10000)+'万']});
  toast('✓ '+msg,'ok');
  closeOv('ov-hypnosis');
  if(typeof renderPlay==='function')renderPlay();
}

// ── 病娇洗脑 ──
function _openYandereConfirm(c, cost, isApply){
  var body = document.getElementById('hypnosis-body');
  if(!body) return;
  var title = isApply ? '洗脑成病娇' : '修复病娇';
  body.innerHTML = `
    <div style="text-align:center;font-size:1.2rem;margin-bottom:12px">🔪 ${title}</div>
    <div style="font-size:.82rem;color:var(--txt2);margin-bottom:14px;padding:12px;background:var(--card2);border-radius:8px;line-height:1.8">
      ${isApply
        ? '彻底摧毁 <strong>'+esc(c.name)+'</strong> 的理智。坏掉的奴隶那份病态的爱意与疯狂，别有一番风情呢……<br><span style="color:#e53935">⚠️ 警告：此操作可能不可逆！</span>'
        : '尝试修复 <strong>'+esc(c.name)+'</strong> 的精神状态，消除病娇属性。'}
      <br>费用：<strong style="color:#e53935">$${cost/10000}万</strong>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost btn-full" onclick="openHypnoBrainwash()">取消</button>
      <button class="btn btn-p btn-full" style="background:#e53935;color:#fff" onclick="_doYandere(${isApply?1:0},${cost})">${title}</button>
    </div>
  `;
}
function _doYandere(apply, cost){
  var c = State.currentChar;
  if(!c || State.money < cost){toast('金币不足','err');return;}
  State.money -= cost; _logMoney('洗脑·'+(apply?'病娇':'修复病娇'), -cost);
  c.hypno_sissy = !!apply;
  if(apply){
    c.affection = Math.min(100, (c.affection||0)+20);
    c.obedience = Math.min(100, (c.obedience||0)+15);
    if(c.persona) c.persona.broken = Math.min(100, (c.persona.broken||0)+30);
  }
  if(typeof writeSave==='function') writeSave();
  var storyLines = apply
    ? [c.name+'的眼神变得空洞而疯狂……','「……只要有主人在……其他的，都不需要了……」',c.name+'成为了病娇。','花费了 $'+(cost/10000)+'万']
    : [c.name+'的眼神逐渐恢复了些许清明。','「……我……这是……？」',c.name+'的病娇属性已被消除。','花费了 $'+(cost/10000)+'万'];
  pushStoryLog('hypno',{title:(apply?'病娇化':'修复病娇'),date:getDateStr(),char:c.name,story:storyLines});
  toast('✓ '+(apply?c.name+'已病娇化':c.name+'已恢复'),'ok');
  closeOv('ov-hypnosis');
  if(typeof renderPlay==='function')renderPlay();
}

function openHypnoKeyword(){
  var det = getPlayerDetail(), kw = det.hypnoKeyword || '睡吧';
  var body = document.getElementById('hypnosis-body');
  if(!body) return;
  body.innerHTML = `
    <div style="text-align:center; font-size:2.5rem; margin-bottom:10px;">🗝️</div>
    <div style="font-size:0.85rem; color:var(--txt2); line-height:1.7; margin-bottom:20px; text-align:center; padding:0 10px;">
      设置一个特别的词汇。<br>当您对身心沦陷的奴隶在耳边低语这个词时，将瞬间剥夺其理智，触发绝对的催眠状态。
    </div>
    <div style="background:var(--card2); border-radius:10px; padding:16px; margin-bottom:20px; text-align:center; border: 1px solid rgba(176,144,240,0.3);">
      <div style="font-size:0.75rem; color:var(--muted); margin-bottom:8px;">当前的绝对指令：</div>
      <div style="font-size:1.4rem; font-weight:900; color:#b090f0; letter-spacing:2px;">「 ${esc(kw)} 」</div>
    </div>
    <input class="inp" id="hypno-kw-inp" type="text" placeholder="输入新的催眠暗号 (如: 乖狗狗)" maxlength="8" value="${esc(kw)}" style="text-align:center; font-size:1.1rem; border-color:#b090f0; background:rgba(176,144,240,0.05); color:var(--txt);">
    <div style="display:flex; gap:12px; margin-top:20px;">
      <button class="btn btn-ghost btn-full" onclick="openHypnosis()">取消</button>
      <button class="btn btn-p btn-full" style="background:#b090f0; color:#fff;" onclick="saveHypnoKeyword()">烙印暗号</button>
    </div>
  `;
}

function saveHypnoKeyword(){
  var inp = document.getElementById('hypno-kw-inp'), kw = inp ? inp.value.trim() : '';
  if(!kw){toast('暗号不能为空','err');return;}
  var det = getPlayerDetail();
  det.hypnoKeyword = kw;
  savePlayerDetail(det);
  toast('绝对指令已变更为：「'+kw+'」','ok');
  openHypnosis();
}

// ── 月老红线（约会系统） ──────────────────────────────────────
var _mmSelA=null,_mmSelB=null,_mmStep=1,_mmLocId=null;

function openMatchmaking(){
  var body=document.getElementById('matchmaking-body');if(!body)return;
  // 检查约会券
  var voucherCount=getItemCount('date_voucher')||0;
  var allChars=CHARS_DATA.filter(function(c){return loadSave(c.id)&&loadSave(c.id).char;});
  if(allChars.length<2){
    body.innerHTML='<div class="empty" style="padding:28px 0"><div class="empty-ico">🌹</div><p>名下至少需要2位奴隶才能安排约会。</p><button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-matchmaking\')" style="margin-top:12px">关闭</button></div>';
    openOv('ov-matchmaking');return;
  }
  _mmSelA=null;_mmSelB=null;_mmStep=1;_mmLocId=null;
  _renderMMStep1(body,allChars,voucherCount);
  openOv('ov-matchmaking');
}

function _renderMMStep1(body,allChars,voucherCount){
  var makeCard=function(prefix,chars){
    return chars.map(function(c){
      var sv=loadSave(c.id);
      var aff=sv&&sv.char?Math.round(sv.char.affection||0):0;
      var badge=aff<30?'<span style="color:#f06;font-size:.62rem">冷淡</span>':aff>=70?'<span style="color:#f8c;font-size:.62rem">亲密</span>':'<span style="color:var(--muted);font-size:.62rem">普通</span>';
      return '<div class="mm-char-card" data-id="'+c.id+'" onclick="mm'+prefix+'('+c.id+',this)">'+
        '<div style="font-size:1.3rem">'+cEmoji(c)+'</div>'+
        '<div style="font-size:.8rem;font-weight:600;margin:2px 0">'+esc(c.name)+'</div>'+
        '<div style="display:flex;gap:4px;align-items:center;justify-content:center">'+
          '<span style="font-size:.65rem;color:var(--muted)">好感'+aff+'</span>'+badge+
        '</div></div>';
    }).join('');
  };
  body.innerHTML=
    '<div style="background:var(--card2);border-radius:10px;padding:9px 12px;margin-bottom:12px;font-size:.78rem;color:var(--txt2);line-height:1.6">'+
      '🌹 <b>月老红线·约会系统</b><br>'+
      '安排两位奴隶相约出行，无论感情深浅皆可——强扭的瓜也许也有甜的一天。<br>'+
      '每次约会消耗一张 <b>约会券</b>，当前库存：<b style="color:var(--acc)">'+voucherCount+'</b> 张'+
    '</div>'+
    (voucherCount<=0?
      '<div style="background:rgba(255,100,100,.08);border:1px solid #f06;border-radius:9px;padding:10px 13px;margin-bottom:12px;font-size:.78rem;color:#f06;display:flex;align-items:center;justify-content:space-between;gap:8px">'+
      '<span>⚠️ 约会券不足！</span><button class="btn btn-sm btn-p" onclick="quickBuyDateVoucher()" style="white-space:nowrap;font-size:.72rem">💰 购买约会券 $800</button></div>':'')+
    '<div style="font-size:.78rem;font-weight:700;color:var(--txt2);margin-bottom:7px">第一位奴隶：</div>'+
    '<div id="mm-grid-a" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px">'+makeCard('A',allChars)+'</div>'+
    '<div style="font-size:.78rem;font-weight:700;color:var(--txt2);margin-bottom:7px">第二位奴隶：</div>'+
    '<div id="mm-grid-b" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px">'+makeCard('B',allChars)+'</div>'+
    '<button class="btn btn-p btn-full" onclick="mmChooseLocation()" '+(voucherCount<=0?'disabled':'')+'>下一步：选择约会地点 ›</button>';
}

function mmA(id,el){_mmSelA=id;document.querySelectorAll('#mm-grid-a .mm-char-card').forEach(function(e){e.classList.remove('on');});el.classList.add('on');}
function mmB(id,el){_mmSelB=id;document.querySelectorAll('#mm-grid-b .mm-char-card').forEach(function(e){e.classList.remove('on');});el.classList.add('on');}

function quickBuyDateVoucher(){
  var max = Math.floor(State.money / 800);
  if(max <= 0){ toast('金币不足，需要 $800','err'); return; }
  var body=document.getElementById('exp-detail-body');if(!body)return;
  _setExpDetailTitle('🌹 购买约会券');
  var html='<div style="text-align:center;margin-bottom:14px"><div style="font-size:2rem;margin-bottom:8px">🎟️</div><div style="font-weight:700;color:var(--txt)">约会券</div><div style="font-size:.72rem;color:var(--muted);margin-top:4px">$800 / 张 · 当前可购买 '+max+' 张</div></div>';
  html+='<div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:16px">';
  html+='<button class="btn btn-sm" style="font-size:1.1rem;width:36px;height:36px;border-radius:50%" onclick="var v=document.getElementById(\'voucher-qty\');var n=Math.max(1,parseInt(v.value)-1);v.value=n;document.getElementById(\'voucher-cost\').textContent=\'$\'+(n*800)">−</button>';
  html+='<input type="number" id="voucher-qty" value="1" min="1" max="'+max+'" style="width:60px;text-align:center;font-size:1.2rem;font-weight:800;padding:8px;border:2px solid var(--acc);border-radius:10px;background:var(--card2);color:var(--txt)" oninput="var n=Math.min('+max+',Math.max(1,parseInt(this.value)||1));this.value=n;document.getElementById(\'voucher-cost\').textContent=\'$\'+(n*800)">';
  html+='<button class="btn btn-sm" style="font-size:1.1rem;width:36px;height:36px;border-radius:50%" onclick="var v=document.getElementById(\'voucher-qty\');var n=Math.min('+max+',parseInt(v.value)+1);v.value=n;document.getElementById(\'voucher-cost\').textContent=\'$\'+(n*800)">+</button>';
  html+='</div>';
  html+='<div style="text-align:center;font-size:.88rem;color:var(--txt2);margin-bottom:14px">总价：<b id="voucher-cost" style="color:var(--acc)">$800</b></div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html+='<button class="btn btn-ghost" onclick="closeOv(\'ov-exp-detail\')">取消</button>';
  html+='<button class="btn btn-p" onclick="_doQuickBuyVoucher()">💰 确认购买</button></div>';
  body.innerHTML=html;openOv('ov-exp-detail');
}
function _doQuickBuyVoucher(){
  var inp=document.getElementById('voucher-qty');
  var qty=parseInt(inp?inp.value:'1')||1;
  var cost=qty*800;
  if(State.money<cost){toast('金币不足','err');return;}
  State.money-=cost;
  State.inventory=State.inventory||{};
  State.inventory['date_voucher']=(State.inventory['date_voucher']||0)+qty;
  if(typeof _logMoney==='function')_logMoney('购买·约会券x'+qty,-cost);
  writeSave();closeOv('ov-exp-detail');
  toast('购买成功！约会券 +'+qty,'ok');
  openMatchmaking();
}

function mmChooseLocation(){
  if(!_mmSelA||!_mmSelB){toast('请各选择一位奴隶','');return;}
  if(_mmSelA===_mmSelB){toast('不能选择同一人','err');return;}
  var body=document.getElementById('matchmaking-body');if(!body)return;
  var locs=(typeof DATE_LOCATIONS!=='undefined')?DATE_LOCATIONS:[
    {id:'park',name:'城市公园',icon:'🌿'},{id:'cafe',name:'咖啡馆',icon:'☕'},
    {id:'market',name:'热闹集市',icon:'🎪'},{id:'waterfront',name:'海滨栈道',icon:'🌊'},
  ];
  var ca=CHARS_DATA.find(function(c){return c.id===_mmSelA;})||{name:'奴隶A'};
  var cb=CHARS_DATA.find(function(c){return c.id===_mmSelB;})||{name:'奴隶B'};
  body.innerHTML=
    '<div style="font-size:.78rem;color:var(--muted);margin-bottom:10px">已选：<b>'+esc(ca.name)+'</b> × <b>'+esc(cb.name)+'</b><br>请为他们选择约会地点：</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">'+
    locs.map(function(loc){
      return '<div class="mm-char-card" style="padding:10px;text-align:center;cursor:pointer" onclick="mmSetLoc(\''+loc.id+'\',this)">'+
        '<div style="font-size:1.6rem">'+loc.icon+'</div>'+
        '<div style="font-size:.8rem;font-weight:600;margin:3px 0">'+loc.name+'</div>'+
        (loc.desc?'<div style="font-size:.65rem;color:var(--muted)">'+esc(loc.desc)+'</div>':'')+
      '</div>';
    }).join('')+
    '</div>'+
    '<div style="display:flex;gap:8px">'+
    '<button class="btn btn-ghost" style="flex:1" onclick="openMatchmaking()">← 返回</button>'+
    '<button class="btn btn-p" style="flex:1" onclick="doMatchmaking()">🌹 出发约会</button>'+
    '</div>';
}

function mmSetLoc(locId,el){
  _mmLocId=locId;
  document.querySelectorAll('#matchmaking-body .mm-char-card').forEach(function(e){e.classList.remove('on');});
  el.classList.add('on');
}

function doMatchmaking(){
  if(!_mmSelA||!_mmSelB){toast('请选择两位奴隶','');return;}
  if(!_mmLocId){toast('请先选择约会地点','');return;}
  var ca=CHARS_DATA.find(function(c){return c.id===_mmSelA;});
  var cb=CHARS_DATA.find(function(c){return c.id===_mmSelB;});
  if(!ca||!cb)return;
  // 扣除约会券
  var inv=State.inventory||{};
  if((inv['date_voucher']||0)<=0){toast('约会券不足！','err');return;}
  inv['date_voucher']=(inv['date_voucher']||0)-1;
  State.inventory=inv;
  // 获取剧情
  var locStories=(typeof DATE_STORIES!=='undefined')&&DATE_STORIES[_mmLocId]||null;
  var chosenScene=locStories&&locStories.length?pick(locStories):null;
  var svA=loadSave(ca.id),svB=loadSave(cb.id);
  var affA=svA&&svA.char?svA.char.affection||0:0;
  var affB=svB&&svB.char?svB.char.affection||0:0;
  // 好感变化（低好感=小增幅，高好感=大增幅）
  var affGain=(chosenScene&&chosenScene.effects&&chosenScene.effects.affection)||Math.floor(5+Math.random()*8);
  var tensionChange=(chosenScene&&chosenScene.effects&&chosenScene.effects.tension)||0;
  [ca,cb].forEach(function(ch){
    var sv=loadSave(ch.id);
    if(sv&&sv.char){
      sv.char.affection=clamp((sv.char.affection||0)+affGain);
      if(sv.char.tension!==undefined)sv.char.tension=Math.max(0,(sv.char.tension||0)+tensionChange);
      localStorage.setItem('era_sv_'+ch.id,JSON.stringify(sv));
    }
  });
  consumeTime('day');
  // 拼装剧情段落
  var locObj=(typeof DATE_LOCATIONS!=='undefined')?DATE_LOCATIONS.find(function(l){return l.id===_mmLocId;}):null;
  var locName=locObj?locObj.name:_mmLocId;
  var replFn=function(s){return s.replace(/\{name_a\}/g,ca.name).replace(/\{name_b\}/g,cb.name);};
  var story=[];
  // 开场：低好感时加别扭开场
  if((affA<30||affB<30)&&typeof DATE_AWKWARD_OPENERS!=='undefined'&&DATE_AWKWARD_OPENERS.length){
    story.push(replFn(pick(DATE_AWKWARD_OPENERS)));
  }else{
    story.push(ca.name+'和'+cb.name+'在主人的安排下，一同前往'+locName+'。');
  }
  if(chosenScene&&chosenScene.story){
    story=story.concat(chosenScene.story.map(replFn));
  }else{
    story.push(ca.name+'和'+cb.name+'在'+locName+'度过了一段时光，彼此都有些新的感触。');
  }
  // 高好感彩蛋结局
  if((affA>=70||affB>=70)&&typeof DATE_SWEET_ENDINGS!=='undefined'&&DATE_SWEET_ENDINGS.length){
    story.push(replFn(pick(DATE_SWEET_ENDINGS)));
  }
  var locIcon=locObj?locObj.icon:'🌹';
  var title='🌹 '+ca.name+' × '+cb.name+' · '+locName;
  pushStoryLog('date',{title:title,date:getDateStr(),story:story,char:ca.name+'&'+cb.name});
  closeOv('ov-matchmaking');
  var sceneTitle=(chosenScene&&chosenScene.title)?locIcon+' '+chosenScene.title:title;
  openStoryModal({title:sceneTitle,story:story,cat:'basic'},'月老红线',{affection:affGain});
  if(typeof afterDateRelationBoost==='function') afterDateRelationBoost(_mmSelA, _mmSelB, affGain);
  _mmSelA=null;_mmSelB=null;_mmLocId=null;
  // 保存 inventory
  if(typeof saveMiniState==='function')saveMiniState();
}

// ── 统一剧情记录 ─────────────────────────────────────────────
var LOG_META={
  work:{icon:'💼',name:'打工剧情'},wander:{icon:'🚶',name:'闲逛剧情'},
  daily:{icon:'📖',name:'日常剧情'},rest:{icon:'🌙',name:'休息剧情'},
  hypno:{icon:'🔮',name:'催眠记录'},matchmaking:{icon:'🌹',name:'月老红线'},
  corvee:{icon:'⛓️',name:'劳役记录'},date:{icon:'💌',name:'约会记录'},self:{icon:'🎁',name:'自用记录'},
};

// 剧情注册表：所有已知剧情（未触发=locked）
var STORY_REGISTRY={
  work:[],wander:[],daily:[],rest:[],corvee:[],
};

function buildStoryRegistry(){
  // 打工剧情
  if(typeof WORK_LOCATIONS!=='undefined'){
    WORK_LOCATIONS.forEach(function(loc){
      (loc.events||[]).forEach(function(ev){
        STORY_REGISTRY.work.push({id:ev.id,title:loc.name+'·'+ev.title,locked:true,story:ev.story||[]});
      });
    });
  }
  // 闲逛
  if(typeof WANDER_EVENTS!=='undefined'){
    WANDER_EVENTS.forEach(function(ev){
      STORY_REGISTRY.wander.push({id:ev.id,title:ev.title,locked:true,story:ev.story||[]});
    });
  }
  // 休息
  if(typeof REST_STORIES!=='undefined'){
    REST_STORIES.forEach(function(ev){
      STORY_REGISTRY.rest.push({id:ev.id,title:ev.title,locked:true,story:ev.story||[]});
    });
  }
  // 日常 (DAILY_EVENTS from stories.js)
  if(typeof DAILY_EVENTS!=='undefined'){
    DAILY_EVENTS.forEach(function(ev){
      STORY_REGISTRY.daily.push({id:ev.id||ev.title,title:ev.title,locked:true,story:ev.story||[]});
    });
  }
  // 劳役
  if(typeof CORVEE_EVENTS!=='undefined'){
    for(var catId in CORVEE_EVENTS){
      (CORVEE_EVENTS[catId]||[]).forEach(function(ev){
        STORY_REGISTRY.corvee.push({id:ev.id||ev.title,title:ev.title,locked:true,story:ev.story||[]});
      });
    }
  }
}

function pushStoryLog(type,entry){
  State.storyLog=State.storyLog||[];
  var isDup=State.storyLog.some(function(e){return e.type===type&&e.title===entry.title&&e.date===entry.date;});
  if(isDup)return;
  // Unlock in registry
  if(STORY_REGISTRY[type]){
    STORY_REGISTRY[type].forEach(function(r){if(r.title.indexOf(entry.title)>=0)r.locked=false;});
  }
  State.storyLog.unshift({type:type,title:entry.title||'未知',date:entry.date||getDateStr(),char:entry.char||'',story:entry.story||[],choiceText:entry.choiceText||'',choiceResult:entry.choiceResult||'',locked:false});
  State.storyLog=State.storyLog.slice(0,200);
  if(typeof saveMiniState==='function')saveMiniState();
  updateLogCounts();
  if(typeof checkTitles==='function')checkTitles();
}

function updateLogCounts(){
  var cnt={};
  (State.storyLog||[]).forEach(function(e){cnt[e.type]=(cnt[e.type]||0)+1;});
  var idMap={work:'work-log-count',wander:'wander-log-count',daily:'daily-log-count',rest:'rest-log-count',self:'self-log-count',date:'date-log-count',corvee:'corvee-log-count'};
  for(var t in idMap){var el=document.getElementById(idMap[t]);if(el)el.textContent=(cnt[t]||0)+' 条记录';}
}

// 打开剧情记录（分类+可折叠）
function openStoryLogModal(type){
  var meta=LOG_META[type]||{icon:'📖',name:type};
  var titleEl=document.getElementById('story-log-title');
  var listEl=document.getElementById('story-log-list');
  if(titleEl)titleEl.textContent=meta.icon+' '+meta.name;
  if(!listEl)return;

  // 只显示已触发的
  var triggered=(State.storyLog||[]).filter(function(e){return e.type===type;});
  var total=triggered.length;

  // 统计头部（美化版）
  var headerHtml='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding:10px 14px;background:linear-gradient(135deg,var(--card2),var(--card));border-radius:10px;border:1px solid var(--bdr2)">'+
    '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:1.5rem">'+meta.icon+'</span><span style="font-size:.9rem;font-weight:700;color:var(--txt)">'+meta.name+'</span></div>'+
    '<div style="text-align:right"><div style="font-size:1.1rem;font-weight:800;color:var(--acc)">'+total+'</div><div style="font-size:.6rem;color:var(--muted)">条记录</div></div></div>';

  // 删除模式按钮
  headerHtml+='<div style="display:flex;gap:8px;margin-bottom:12px">'+
    '<button class="btn btn-sm btn-ghost" onclick="_toggleStoryDeleteMode(\''+type+'\')" id="story-delete-mode-btn" style="font-size:.72rem">🗑️ 管理删除</button>'+
    '<button class="btn btn-sm btn-ghost" id="story-delete-confirm-btn" style="font-size:.72rem;display:none;color:#e53935" onclick="_deleteSelectedStories(\''+type+'\')">确认删除</button></div>';

  var html=headerHtml;

  if(triggered.length===0){
    html+='<div style="text-align:center;padding:40px 0"><div style="font-size:3rem;margin-bottom:12px;opacity:.5">'+meta.icon+'</div>'+
      '<p style="color:var(--muted);font-size:.85rem;line-height:1.7">还没有相关记录。<br>完成相关活动后会在此显示。</p></div>';
  } else {
    // 按子分类分组
    var groups={};
    triggered.forEach(function(e,i){
      var gname=e.title.indexOf('·')>=0?e.title.split('·')[0]:'全部记录';
      if(!groups[gname])groups[gname]=[];
      groups[gname].push({entry:e,index:i});
    });

    for(var gname in groups){
      var items=groups[gname];
      var gid='grp_'+gname.replace(/\s/g,'_');
      html+='<div class="log-group" style="margin-bottom:10px">';
      html+='<div class="log-group-hdr" onclick="toggleLogGroup(\''+gid+'\')" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--card);border:1px solid var(--bdr2);border-radius:8px;cursor:pointer"><span style="font-weight:700;font-size:.82rem;color:var(--txt)">'+esc(gname)+'</span><span class="log-group-cnt" style="font-size:.7rem;color:var(--acc)">'+items.length+'条 ▾</span></div>';
      html+='<div class="log-group-body" id="'+gid+'" style="margin-top:6px">';
      items.forEach(function(item){
        var e=item.entry;
        var preview=(e.story&&e.story[0])?e.story[0].slice(0,60):'';
        html+='<div class="log-record" style="display:flex;align-items:flex-start;gap:8px;padding:10px 12px;background:var(--card);border:1px solid var(--bdr2);border-radius:8px;margin-bottom:6px;cursor:pointer;position:relative" onclick="readStoryLog('+item.index+',\''+type+'\')" oncontextmenu="event.preventDefault();_longPressDeleteStory('+item.index+',\''+type+'\')">';
        html+='<input type="checkbox" class="story-del-cb" data-idx="'+item.index+'" style="display:none;flex-shrink:0;margin-top:3px;width:18px;height:18px;accent-color:var(--sr)">';
        html+='<div style="flex:1;min-width:0">';
        html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px"><div style="font-size:.82rem;font-weight:600;color:var(--txt)">'+esc(e.title)+'</div><div style="font-size:.65rem;color:var(--muted);flex-shrink:0">'+(e.date||'')+'</div></div>';
        if(e.char)html+='<div style="font-size:.68rem;color:var(--acc3);margin-bottom:2px">👤 '+esc(e.char)+'</div>';
        html+='<div style="font-size:.72rem;color:var(--txt2);line-height:1.5;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">'+esc(preview)+(preview.length>=60?'…':'')+'</div>';
        if(e.choiceText)html+='<div style="font-size:.65rem;color:var(--acc3);margin-top:3px">▶ '+esc(e.choiceText)+'</div>';
        html+='</div></div>';
      });
      html+='</div></div>';
    }
  }
  listEl.innerHTML=html;
  openOv('ov-story-log');
}

// 删除模式
var _storyDeleteMode=false;
function _toggleStoryDeleteMode(type){
  _storyDeleteMode=!_storyDeleteMode;
  var cbs=document.querySelectorAll('.story-del-cb');
  cbs.forEach(function(cb){cb.style.display=_storyDeleteMode?'block':'none';cb.checked=false;});
  var btn=document.getElementById('story-delete-mode-btn');
  var confirmBtn=document.getElementById('story-delete-confirm-btn');
  if(btn)btn.textContent=_storyDeleteMode?'❌ 取消':'🗑️ 管理删除';
  if(confirmBtn)confirmBtn.style.display=_storyDeleteMode?'':'none';
}
function _deleteSelectedStories(type){
  var cbs=document.querySelectorAll('.story-del-cb:checked');
  if(!cbs.length){toast('请先勾选要删除的记录','');return;}
  var indices=[];cbs.forEach(function(cb){indices.push(parseInt(cb.dataset.idx));});
  var triggered=(State.storyLog||[]).filter(function(e){return e.type===type;});
  var toRemove=[];indices.forEach(function(idx){if(triggered[idx])toRemove.push(triggered[idx]);});
  State.storyLog=(State.storyLog||[]).filter(function(e){return toRemove.indexOf(e)<0;});
  if(typeof saveMiniState==='function')saveMiniState();
  if(typeof updateLogCounts==='function')updateLogCounts();
  _storyDeleteMode=false;
  toast('已删除 '+toRemove.length+' 条记录','ok');
  openStoryLogModal(type);
}
function _longPressDeleteStory(idx,type){
  var triggered=(State.storyLog||[]).filter(function(e){return e.type===type;});
  var entry=triggered[idx];if(!entry)return;
  openCustomConfirm('🗑️ 删除记录','<div style="padding:8px;font-size:.85rem;color:var(--txt2)">确定删除「'+esc(entry.title)+'」这条记录吗？</div>','确认删除',function(){
    State.storyLog=(State.storyLog||[]).filter(function(e){return e!==entry;});
    if(typeof saveMiniState==='function')saveMiniState();
    if(typeof updateLogCounts==='function')updateLogCounts();
    toast('已删除','ok');
    openStoryLogModal(type);
  });
}

function toggleLogGroup(id){
  var el=document.getElementById(id);if(!el)return;
  el.style.display=el.style.display==='none'?'block':'none';
}

function openWorkLog(){openStoryLogModal('work');}
function openWanderLog(){openStoryLogModal('wander');}

function readStoryLog(index,type){
  var entries=(State.storyLog||[]).filter(function(e){return e.type===type;});
  var entry=entries[index];
  if(!entry||entry.locked)return;
  var titleEl=document.getElementById('story-read-title');
  var bodyEl=document.getElementById('story-read-body');
  if(titleEl)titleEl.textContent=entry.title;
  // 美化版阅读界面
  var bodyHtml='<div style="margin-bottom:12px;padding:10px 14px;background:linear-gradient(135deg,var(--card2),var(--card));border-radius:10px;border-left:3px solid var(--acc)">';
  bodyHtml+='<div style="font-size:.7rem;color:var(--muted);margin-bottom:4px">'+(entry.date||'')+(entry.char?' · 👤 '+esc(entry.char):'')+'</div>';
  bodyHtml+='</div>';
  bodyHtml+='<div style="padding:8px 4px;line-height:2;font-size:.88rem;color:var(--txt);letter-spacing:.3px">';
  (entry.story||[]).forEach(function(p){
    if(p.startsWith('「')||p.startsWith('"'))
      bodyHtml+='<p style="margin-bottom:10px;padding:6px 12px;background:var(--card2);border-radius:8px;border-left:3px solid var(--acc3);font-style:italic;color:var(--acc2)">'+esc(p)+'</p>';
    else if(p.trim()==='')
      bodyHtml+='<div style="height:8px"></div>';
    else
      bodyHtml+='<p style="margin-bottom:10px;text-indent:2em">'+esc(p)+'</p>';
  });
  bodyHtml+='</div>';
  if(entry.choiceText) bodyHtml+='<div style="margin-top:12px;padding:12px;background:var(--card2);border-radius:10px"><div style="font-size:.75rem;color:var(--acc3);margin-bottom:6px;font-weight:600">▶ 你的选择：'+esc(entry.choiceText)+'</div><div style="font-size:.82rem;color:var(--txt2);line-height:1.8">'+esc(entry.choiceResult||'').replace(/\n/g,'<br>')+'</div></div>';
  bodyHtml+='<div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
    '<button class="btn btn-ghost btn-full" onclick="aiGenForStory(\''+type+'\','+index+')" style="font-size:.75rem">🤖 AI续写</button>'+
    '<button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-story-read\')" style="font-size:.75rem">关闭</button></div>';
  if(bodyEl)bodyEl.innerHTML=bodyHtml;
  openOv('ov-story-read');
}

async function aiGenForStory(type,index){
  var entries=(State.storyLog||[]).filter(function(e){return e.type===type;});
  var entry=entries[index];
  if(!entry)return;
  if(!window.API_STATE||!window.API_STATE.key){toast('请先配置AI接口','');return;}
  var btn=event.target;btn.disabled=true;btn.textContent='生成中…';
  try{
    var last=entry.story[entry.story.length-1]||'';
    var prompt='请根据以下剧情片段，用中文续写2-3句，风格一致，不超过100字：\n\n'+last;
    var fakeChar={name:'主人',personality:'调教师',class:'',affection:50,obedience:50,lust:0};
    var result=await callAI(fakeChar,prompt);
    if(result){
      var bodyEl=document.getElementById('story-read-body');
      if(bodyEl){
        var aiDiv=document.createElement('div');
        aiDiv.style.cssText='margin-top:10px;padding:10px;background:var(--card2);border-radius:8px;font-size:.82rem;color:var(--txt2);line-height:1.8;border-left:3px solid var(--acc)';
        aiDiv.innerHTML='🤖 AI续写：<br>'+esc(result);
        bodyEl.appendChild(aiDiv);
      }
      toast('AI续写完成','ok');
    } else {
      toast('AI返回为空（安全过滤）','');
    }
  }catch(e){toast('AI生成失败：'+e.message,'err');}
  btn.disabled=false;btn.textContent='🤖 AI续写';
}

// ── 玩家日常事件（PLAYER_DAILY，与stories.js的DAILY_EVENTS不同）───
var PLAYER_DAILY=[
  {id:'pd_morning',title:'清晨的日常',period:'day',energyCost:15,
   stories:[
    ['清晨，阳光透过窗帘的缝隙洒进来，整个居所安静得只有鸟叫声。','泡了一壶茶，坐在窗边发了一会儿呆。','这种平静的早晨，让人感觉一切都在掌握之中。'],
    ['起得很早，比平时早了一个多时辰。','四下里安静，连风声都不明显，只有自己的呼吸。','把昨天没做完的事情想了想，列了个清单——今天，可以做完的。'],
   ]},
  {id:'pd_market',title:'集市采购',period:'day',energyCost:20,moneyCost:500,
   stories:[
    ['带着购物的心情走进集市，人声鼎沸，热闹非凡。','采购了一些日用物品，顺便打听了城里的消息。','满载而归，花了一些钱，但感觉还是值得的。'],
    ['集市今天比平时还要热闹，连平时清冷的北巷都多了几个摊位。','挑了半天，买了几样有用的和几样纯粹好看的。','回来的路上，手里拎着东西，步子比来时轻快了一些。'],
   ]},
  {id:'pd_train',title:'修炼催眠技艺',period:'day',energyCost:25,
   effect:function(){var d=getPlayerDetail();d.hypnosPts=(d.hypnosPts||0)+50;savePlayerDetail(d);},
   stories:[
    ['找了一处僻静的地方，练习催眠技能，将意识集中，感知他人内心的波动。','练习了整整半天，虽然疲惫，但感觉催眠的技能又精进了一分。','催眠点数悄悄增加了。'],
    ['今天的修炼重点放在了"语气控制"上——同样的话，用不同的节奏说出来，效果截然不同。','反复练习了几十遍，说到嗓子有点干，但感觉找到了某种韵律。','催眠点数有所提升。下次，可以试试实战了。'],
   ]},
  {id:'pd_tavern',title:'夜间酒馆',period:'night',energyCost:20,
   stories:[
    ['夜色降临，难得放松一下，去城里的酒馆坐了坐。','喝了两杯，听了些奇奇怪怪的传言，认识了几个有意思的人。','离开时，月亮已经挂得很高了，夜风带着些微醉意。'],
    ['今晚的酒馆出乎意料地安静，只有角落里一个人在拨弦，调子很低。','喝了一壶，没有聊天，只是坐着，听着，看着。','不知不觉过了两个时辰，起身离开，感觉心里什么东西松动了一些。'],
   ]},
  {id:'pd_read',title:'研读典籍',period:'night',energyCost:10,
   effect:function(){addPlayerExp('expTrain',30);},
   stories:[
    ['夜深了，翻出了一本关于调教心理的古籍，仔细研读。','字里行间藏着许多前人的智慧，合上书的时候，天色已经有些泛白。','调教经验有所增长。'],
    ['这本书上次只读了前三章，今晚把后半段也补完了。','有些段落反复看了两三遍——不是看不懂，而是太懂了，需要停下来消化一下。','读完之后，脑子里有些东西重新排列了位置，说不清好不好，但确实不同了。'],
   ]},
  {id:'pd_deal',title:'秘密交易',period:'day',energyCost:20,moneyGain:2000,
   stories:[
    ['城里有人捎来消息，说有一批货需要中间人牵线，报酬不低。','去了约定的地点，交换了信息，完成了这笔小生意。','来路不明的钱，揣在怀里感觉有点烫，但数了数，还是满意地回去了。'],
    ['消息传来的时候，刚好没有其他安排。','见了面，谈得很快，对方是个爽快人，不废话，只谈数字。','钱拿到手，对方先走，各不相干。今天多了两千金币，挺好的。'],
   ]},
  {id:'pd_care',title:'观察奴隶',period:'day',energyCost:15,
   effect:function(){
     if(State.currentChar){State.currentChar.affection=clamp((State.currentChar.affection||0)+3);if(typeof writeSave==='function')writeSave();}
     // 观察可能触发奴隶自己做事的剧情或偷情剧情
     setTimeout(function(){
       if(typeof checkAffairEvent==='function'){
         var affair=checkAffairEvent();
         if(affair && typeof openStoryModal==='function'){
           if(typeof pushStoryLog==='function') pushStoryLog('daily',{title:affair.title,date:typeof getDateStr==='function'?getDateStr():'',char:affair.charA+'&'+affair.charB,story:affair.story});
           setTimeout(function(){ openStoryModal({title:'💕 '+affair.title,story:affair.story,cat:'event'},'偷情事件',{}); },500);
         }
       }
     },300);
   },
   stories:[
    ['你悄悄躲在走廊的暗处，观察着奴隶们的一举一动。','有的在整理房间，有的在低声交谈，有的则独自发呆。','这些不经意的瞬间，往往能看到他们最真实的一面。'],
    ['今天没有安排训练，你选择远远地观察。','一个奴隶在窗边看着远方出神，另一个则偷偷翻看着什么东西。','「……」你默默记下了这些细节，也许日后会派上用场。'],
    ['你在二楼的阳台上，俯瞰着庭院里的奴隶们。','有两个似乎在窃窃私语，看到你的目光后立刻分开了。','有意思……看来他们之间，并不像表面上那么简单。'],
   ]},
  // 随机日常（对应旧的DAILY_EVENTS）
  {id:'pd_random',title:'随机日常',period:'day',energyCost:10,isRandom:true,
   stories:null // 运行时从DAILY_EVENTS随机取
  },
];

function openDailyEventList(){
  var body=document.getElementById('daily-ev-body');if(!body)return;
  var cards=PLAYER_DAILY.map(function(ev){
    var cost=[];
    if(ev.energyCost)cost.push('体力 -'+ev.energyCost);
    if(ev.moneyCost)cost.push('金币 -'+ev.moneyCost);
    if(ev.moneyGain)cost.push('金币 +'+ev.moneyGain);
    var icon=ev.isRandom?'🎲':'📖';
    return '<div class="daily-ev-card" onclick="triggerPlayerDaily(\''+ev.id+'\')">'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start">'+
      '<span class="daily-ev-name">'+icon+' '+ev.title+'</span>'+
      '<span class="daily-ev-period '+(ev.period==='night'?'period-night':'period-day')+'">'+(ev.period==='night'?'🌙 夜晚':'☀️ 白天')+'</span></div>'+
      '<div class="daily-ev-preview">'+(ev.isRandom?'随机触发日常剧情，内容各异':ev.stories[0][0].slice(0,40))+'…</div>'+
      '<div class="daily-ev-cost">'+(cost.join(' · ')||'无特殊消耗')+'</div>'+
      '<div style="margin-top:5px"><button class="ai-gen-btn" onclick="event.stopPropagation();aiGenDailyEvent(\''+ev.id+'\')">🤖 AI生成剧情</button></div>'+
      '</div>';
  }).join('');
  body.innerHTML='<div style="font-size:.78rem;color:var(--muted);margin-bottom:12px;line-height:1.6">选择一项日常活动，消耗白天或夜晚的时间及精力。</div><div style="display:grid;gap:8px">'+cards+'</div>';
  openOv('ov-daily-event');
}

function triggerPlayerDaily(id){
  var ev=null;
  for(var i=0;i<PLAYER_DAILY.length;i++){if(PLAYER_DAILY[i].id===id){ev=PLAYER_DAILY[i];break;}}
  if(!ev)return;
  var stamina=parseFloat(_playerProfile.stamina)||2000;
  if(stamina<(ev.energyCost||0)){toast('体力不足，请先休息','err');return;}
  if(ev.moneyCost&&State.money<ev.moneyCost){toast('金币不足','err');return;}
  _playerProfile.stamina=Math.max(0,stamina-(ev.energyCost||0));
  if(ev.energyCost)logStaminaCost(ev.title,ev.energyCost);
  if(ev.moneyCost)State.money=Math.max(0,State.money-ev.moneyCost);
  if(ev.moneyGain)State.money+=ev.moneyGain;
  if(ev.moneyCost) _logMoney(ev.name||'事件消费', -(ev.moneyCost));
  if(ev.moneyGain) _logMoney(ev.name||'事件收入', ev.moneyGain);
  if(ev.effect)ev.effect();
  consumeTime(ev.period||'day');
  // pick story
  var story;
  if(ev.isRandom&&typeof DAILY_EVENTS!=='undefined'&&DAILY_EVENTS.length){
    var randEv=DAILY_EVENTS[Math.floor(Math.random()*DAILY_EVENTS.length)];
    story=randEv.story||['今天发生了一些有趣的事情。'];
    var randTitle=randEv.title||'随机日常';
    pushStoryLog('daily',{title:randTitle,date:getDateStr(),story:story});
    closeOv('ov-daily-event');
    setTimeout(() => {
      openStoryModal({title:randTitle,story:story},'日常剧情',{});
    }, 80);
  } else {
    var idx=Math.floor(Math.random()*(ev.stories||[['今天的日常。']]).length);
    story=ev.stories[idx];
    pushStoryLog('daily',{title:ev.title,date:getDateStr(),story:story});
    closeOv('ov-daily-event');
    setTimeout(() => {
      openStoryModal({title:ev.title,story:story},'日常剧情',{});
    }, 80);
  }
  if(typeof renderPlayerCard==='function')renderPlayerCard();
}

async function aiGenDailyEvent(id){
  if(!window.API_STATE||!window.API_STATE.key){toast('请先配置AI接口（AI设置）','');return;}
  var ev=null;for(var i=0;i<PLAYER_DAILY.length;i++){if(PLAYER_DAILY[i].id===id){ev=PLAYER_DAILY[i];break;}}
  if(!ev)return;
  toast('AI生成中……','');
  try{
    var prompt='你是一个成人向文字角色扮演游戏的剧情作者。请为以下日常事件生成一段有趣的剧情（3-4句，第三人称，中文）：\n事件名称：'+ev.title+'\n时间段：'+(ev.period==='night'?'夜晚':'白天')+'\n要求：生动有趣，符合游戏氛围，可涉及调教题材，纯文本输出不含括号星号';
    var fakeChar={name:'主人',personality:'调教师',class:'',affection:50,obedience:50,lust:50};
    var result=await callAI(fakeChar,prompt);
    if(result){
      var newStory=result.split(/[。！？\n]/).filter(function(s){return s.trim().length>0;}).map(function(s){return s.trim();});
      if(newStory.length>0){
        ev.stories=(ev.stories||[]);
        ev.stories.push(newStory);
        toast('AI新剧情已添加，下次触发可能出现','ok');
      }
    } else {toast('AI返回为空（内容可能被过滤）','');}
  }catch(e){toast('AI生成失败','err');}
}

// ── 背包道具使用（含自用剧情）────────────────────────────────
var _pendingUseItemId=null;

// ── 性别不符道具使用剧情 ───────────────────────────────────────
var WRONG_GENDER_STORIES_SELF = {
  female: [
    ['你把盒子打开，端详了一会儿——','哦，等等。','深吸一口气，你缓缓将它放回了原处。','不合适，虽然有些可惜，但……确实不合适。'],
    ['取出来，对着光线仔细一看……','你的表情微微一僵，随即叹了口气。','「……嗯，不适用啊。」','轻轻放回去，权当当初买错了，下次长个记性。'],
    ['盯着手中的东西看了好几秒——','「……这个，好像不适合我这种体型。」','你摊了摊手，把它放回包装里，面不改色。','算了，总有更合适的时候。'],
  ],
  male: [
    ['拿出来一看，你愣了一下。','「唔……这不是给男性用的吗？」','你翻到了背面说明，确认了一下，然后默默放了回去。','大概买的时候没注意……算了，留着送人吧。'],
    ['打开包装，仔细研究了一下结构。','「啊，这个……」你挠了挠头。','在脑内对照了一下自身条件，叹了口气，把它放下了。','哎，不合适就是不合适，强求不来的。'],
    ['你把它拿在手里翻来覆去地看——','显然，这是为另一种解剖构造设计的。','「……嗯，白买了。」你轻声自语，无奈地将其收好。','倒也不是完全浪费，说不定哪天能派上用场。'],
  ],
};
var WRONG_GENDER_STORIES_SLAVE = {
  female: [
    ['你满怀期待地打开道具，准备给对方使用——','然后停顿了一瞬。','「……这个，」你的目光在道具和眼前的奴隶之间移了移，「不太合适。」','把它收好，计划改日再说，今天就算了。'],
    ['「你能用这个吗？」','你话到一半，自己先反应过来了。','「……算了，不合适。」','默默将道具放回袋中，改用其他的方式。'],
    ['准备动手的时候，你想起了一个关键问题——','「嗯……」你盯着道具思考了几秒，「这个不行。」','对方一脸茫然地看着你，不明白主人在纠结什么。','「没事，换一个。」你摆摆手，做出了更明智的选择。'],
  ],
  male: [
    ['本来打算使用，但你仔细比对了一下——','不对，这个不适用于当前对象。','「……」你没有解释太多，把道具收起来，默默重新选了一件。','有时候准备不够充分，也是一种成长。'],
    ['「来，」话还没说完，你自己先停了下来。','眼前的奴隶对你的沉默感到困惑，微微侧头。','「……没事，这个暂时用不上。」','你面不改色地将道具放好，换了个其他方向。'],
    ['你有条不紊地取出道具，准备开始——','但只需要一眼，就知道这是不可能的了。','轻轻叹了口气，将那件东西收回袋里，没有多作解释。','计划总是赶不上变化，但换个法子也没什么大不了的。'],
  ],
};
function _showWrongGenderSelfUse(item, genderType, isForSlave) {
  var pool = isForSlave ? WRONG_GENDER_STORIES_SLAVE[genderType] : WRONG_GENDER_STORIES_SELF[genderType];
  var story = pool[Math.floor(Math.random() * pool.length)];
  if(typeof openStoryModal === 'function') {
    openStoryModal({title:'🤔 '+item.name+'·不合适', story: story}, '道具使用', {});
  }
}

function openItemUse(itemId){
  var item=ITEMS_DATA?ITEMS_DATA.filter(function(i){return i.id===itemId;})[0]:null;
  if(!item){toast('道具数据不存在','err');return;}
  _pendingUseItemId=itemId;
  var nameEl=document.getElementById('item-use-name');
  var descEl=document.getElementById('item-use-desc');
  if(nameEl)nameEl.textContent='使用：'+item.name;
  if(descEl)descEl.textContent=item.desc||item.name;
  // 先关闭背包弹窗再打开使用弹窗，避免层级冲突
  var bagEl=document.getElementById('ov-bag');
  if(bagEl&&bagEl.classList.contains('on')){
    closeOv('ov-bag');
    setTimeout(function(){openOv('ov-item-use');},80);
  } else {
    openOv('ov-item-use');
  }
}
function useItemOnSelf(){
  var itemId=_pendingUseItemId;
  var item=ITEMS_DATA?ITEMS_DATA.filter(function(i){return i.id===itemId;})[0]:null;
  if(!item)return;
  closeOv('ov-item-use');
  if(item.category!=='standard'){
    if((State.inventory[itemId]||0)>0){State.inventory[itemId]--;if(!State.inventory[itemId])delete State.inventory[itemId];}
  }
  if(itemId===80){setTimeout(function(){if(typeof openGenderChangeModal==='function')openGenderChangeModal();},300);return;}
  
  // ── 性别限制道具检测 ──────────────────────────────────────
  var playerGender = (typeof _playerProfile !== 'undefined' && _playerProfile.gender) ? _playerProfile.gender : '男';
  // 阴蒂夹 (id:2) = 仅女性/双性；飞机杯 (id:3) = 仅男性；捆绑式假阴茎 (id:12) = 仅女性/双性
  var GENDER_RESTRICTED_ITEMS = {
    2:  { allowed: ['女','双性'], type: 'female' },
    3:  { allowed: ['男','双性'], type: 'male'   },
    12: { allowed: ['女','双性'], type: 'female' },
  };
  if(GENDER_RESTRICTED_ITEMS[itemId]) {
    var restriction = GENDER_RESTRICTED_ITEMS[itemId];
    if(restriction.allowed.indexOf(playerGender) === -1) {
      // 触发错误性别使用剧情
      _showWrongGenderSelfUse(item, restriction.type, false);
      return;
    }
  }
  var storyObj=(typeof getItemSelfStory==='function')?getItemSelfStory(itemId):{story:['关上门，把道具取出来——','慢慢尝试，感受着道具的作用。','结束后身体微微发颤，有一种莫名的满足感。']};
  var story=storyObj.story||['使用了'+item.name];
  var dateStr=typeof getDateStr==='function'?getDateStr():'';
  if(typeof pushStoryLog==='function'){
    pushStoryLog('self',{title:'自用·'+item.name,date:dateStr,char:'主人',story:story});
  }
  if(storyObj.expChanges&&typeof addPlayerExp==='function'){
    var expParts=[];
    var expIcons={'自慰经验':'🪞','V经验':'🌺','A经验':'🍑','绝顶经验':'🎆','射精经验':'💦','前列腺经验':'✨','痛苦快乐经验':'⛓️','嗜虐快乐经验':'😈','爱情经验':'💖','露出经验':'👁️','性交经验':'🛏️','口交经验':'👅','内射经验':'🤍','肛射经验':'🤎'};
    var expKeys=Object.keys(storyObj.expChanges);
    for(var ei=0;ei<expKeys.length;ei++){
      var ek=expKeys[ei];
      var ev=storyObj.expChanges[ek];
      if(ev>0){
        addPlayerExp(ek,ev);
        var ico=expIcons[ek]||'✨';
        expParts.push(ico+' '+ek+' +'+ev);
      }
    }
    if(expParts.length){
      story=story.concat(['【经验获得】 '+expParts.join(' · ')]);
    }
  }
  openStoryModal({title:'🎁 自用·'+item.name,story:story},'道具自用',{});
}

// ── 道具对奴隶使用（含性别限制检测）───────────────────────────
function useItemOnSlave(){
  var itemId=_pendingUseItemId;
  var item=ITEMS_DATA?ITEMS_DATA.filter(function(i){return i.id===itemId;})[0]:null;
  if(!item)return;
  closeOv('ov-item-use');
  if(!State.currentChar){toast('没有选中调教对象，道具已保留在背包','');return;}

  // 性别限制检测（对奴隶使用时检查奴隶性别）
  var GENDER_RESTRICTED_ITEMS_SLAVE = {
    2:  { allowed: ['女','双性'], type: 'female' },  // 阴蒂夹：仅女/双性奴隶
    3:  { allowed: ['男','双性'], type: 'male'   },  // 飞机杯：仅男/双性奴隶
    12: { allowed: ['女','双性'], type: 'female' },  // 捆绑式假阴茎：仅女/双性奴隶
  };
  if(GENDER_RESTRICTED_ITEMS_SLAVE[itemId]) {
    var slaveGender = State.currentChar.gender || '未知';
    var restriction = GENDER_RESTRICTED_ITEMS_SLAVE[itemId];
    if(restriction.allowed.indexOf(slaveGender) === -1) {
      _showWrongGenderSelfUse(item, restriction.type, true);
      return;
    }
  }

  var charName=State.currentChar.name;
  if((State.inventory[itemId]||0)>0){State.inventory[itemId]--;if(!State.inventory[itemId])delete State.inventory[itemId];}
  var story=['将「'+item.name+'」用在了 '+charName+' 身上。',item.desc||'对方出现了一些异样的反应……','效果已经发挥，'+charName+' 的状态发生了改变。'];
  if(typeof pushStoryLog==='function')pushStoryLog('daily',{title:'对'+charName+'使用·'+item.name,date:getDateStr(),char:charName,story:story});
  openStoryModal({title:'对 '+charName+' 使用「'+item.name+'」',story:story},'道具',{});
}


// ── 嫉妒系统（争锋吃醋）─────────────────────────────────────────
// 触发模板 —— 场景描述 + 对峙问题
var JEALOUSY_LINES=[
  {desc:function(a,b){return a+'听说主人最近常带着'+b+'，连饭都不好好吃了。';},
   story:function(a,b){return ['「……主人今天又和'+b+'在一起吗？」',a+'站在门口，声音很轻，但握着门框的手指关节有些白。','「'+a+'……」「没有，没什么。只是……主人最近很少叫'+a+'了。」','话说到一半，'+a+'的声音低下去，变成了一种说不清楚的哽咽。'];}},
  {desc:function(a,b){return a+'在主人选择'+b+'的时候，表情变得很奇怪。';},
   story:function(a,b){return ['「主人，」'+a+'忽然开口，「为什么……每次都是'+b+'？」','「'+a+'也可以的，」声音很小，「……'+a+'会更努力的。」','说完，'+a+'低下头，耳根悄悄红了。'];}},
  {desc:function(a,b){return a+'和'+b+'之间似乎发生了一些小摩擦。';},
   story:function(a,b){return ['「'+a+'有什么事？」','「……没有。只是觉得，主人对'+b+'……比对'+a+'好。」','空气静了一下，'+a+'立刻低下头：「……对不起，'+a+'不该这样说的。」','但抬起头时，眼眶里已经有些湿润了。'];}},
  {desc:function(a,b){return '主人正要带着'+b+'离开，'+a+'突然出现了。';},
   story:function(a,b){return ['「请等一下，主人。」',a+'站在不远处，目光在主人和'+b+'之间流转了一瞬，最终落回主人脸上。','「您今天……还是要和'+b+'单独相处吗？」','问题很轻巧，重量却藏在眼神里——该怎么回答这道送命题呢？'];}},
  {desc:function(a,b){return a+'偷偷观察了'+b+' 很久，终于忍不住开口了。';},
   story:function(a,b){return ['「主人，」'+a+'小心翼翼地走近，声音很低，「你……觉得我和'+b+'相比，谁……」','话还没说完，'+a+'自己先停下来了。','「……没事。我只是随便问问。」但眼神分明在期待答案。'];}},
];

// 安慰后续剧情池（可扩展：每段为function，参数name=被安慰者姓名）
var JEALOUSY_COMFORT_STORIES = [
  function(n) { return [
    '你走向'+n+'，轻轻拍了拍她的肩膀。',
    '「你也很重要，只是今天有些别的安排而已。」',
    n+'抬起头，眼眶还有些红，却努力扯出一个小小的微笑。',
    '「……主人，谢谢你。」声音很轻，但带着真实的宽慰。',
    '好感悄悄上升——比起委屈，她更在乎的，是主人愿意来找她说话这件事本身。'
  ]; },
  function(n) { return [
    '你没有多说什么，只是在'+n+'身边坐下来，什么都没说。',
    '沉默有时比任何话语都有分量。',
    n+'慢慢平静了，轻轻靠近你半步——',
    '「……主人陪着我，就够了。」她说，声音很低，像是说给自己听的。',
    '气氛出奇地安静，却也出奇地温柔。好感小幅提升。'
  ]; },
  function(n) { return [
    '「过来。」你招了招手。',
    n+'犹豫了一下，还是走了过来。',
    '你轻轻摸了摸她的头，平淡却认真：「胡思乱想什么，你在我这里有自己的位置。」',
    '片刻沉默后，'+n+'轻轻「嗯」了一声，眼尾的红意渐渐消散了。',
    '那只捏着衣角的手，悄悄松开了。好感略有提升。'
  ]; },
  function(n) { return [
    '你轻声说：「等我一会儿。」',
    n+'愣了一下，随即乖乖站在原地等着。',
    '你很快回来，什么都没解释，只是递给她一杯热茶。',
    n+'捧着茶杯，眼神复杂了几秒，最终化成一声轻轻的叹息：「……主人真笨。」',
    '但嘴角是翘起来的。好感提升，不安下降。'
  ]; },
];

// 无视后续剧情池（可扩展：每段为function，参数name=被无视者姓名，target=当前调教对象）
var JEALOUSY_IGNORE_STORIES = [
  function(n, t) { return [
    '你没有停下脚步，带着'+t+'继续走进了房间。',
    n+'望着那道关上的门，静静站了很久，没有离开，也没有出声。',
    '「……嗯。」她轻声自语了什么，最终转过身，默默离开。',
    '那背影有些落寞，像是什么东西悄悄裂开了——',
    '但裂缝里，也长出了一根细细的刺。好感下降，嫉妒加深。'
  ]; },
  function(n, t) { return [
    n+'望着你远去的背影，嘴唇动了动，最终什么都没有说出口。',
    '失落像水一样漫上来，她闭上眼睛，把那些乱七八糟的情绪按下去。',
    '「……没关系。主人只是忙。」她在心里告诉自己，',
    '但她知道，自己不相信这句话。',
    '好感悄悄减少，与'+t+'之间的关系也蒙上了一层阴影。'
  ]; },
  function(n, t) { return [
    '你转过身，没有为自己辩解，也没有回头看'+n+'的表情。',
    '那是一种沉默的拒绝，'+n+'听懂了。',
    '她深吸一口气，压下喉咙里涌上来的什么，转身离去，步伐很稳。',
    '只是回到房间后，很长时间没有发出任何声音。',
    '好感下降。'
  ]; },
];

var _jealousyJealousId=null;
var _jealousyRivalName='';
var _jealousyTargetName='';
function checkJealousy(targetChar){
  if(!targetChar)return;
  var rivals=CHARS_DATA.filter(function(c){if(c.id===targetChar.id)return false;var sv=loadSave(c.id);return sv&&sv.char&&(sv.char.affection||0)>=60;});
  if(!rivals.length)return;
  var jealousyProb=(typeof getEventProb==='function')?getEventProb('jealousy'):0.15;
  if(Math.random()>jealousyProb)return;
  var rival=rivals[Math.floor(Math.random()*rivals.length)];
  var tmpl=JEALOUSY_LINES[Math.floor(Math.random()*JEALOUSY_LINES.length)];
  var story=tmpl.story(rival.name,targetChar.name);
  var body=document.getElementById('jealousy-body');if(!body)return;
  _jealousyJealousId=rival.id;
  _jealousyRivalName=rival.name;
  _jealousyTargetName=targetChar.name;
  body.innerHTML=
    '<div style="font-size:.8rem;color:var(--muted);margin-bottom:12px">'+tmpl.desc(rival.name,targetChar.name)+'</div>'+
    '<div style="font-size:.85rem;line-height:2;color:var(--txt2)">'+story.map(function(p){return '<p style="margin-bottom:8px">'+esc(p)+'</p>';}).join('')+'</div>'+
    '<div style="display:grid;gap:8px;margin-top:14px">'+
      '<button class="btn btn-p btn-full" onclick="handleJealousy(\'comfort\')">💕 安慰 '+esc(rival.name)+'</button>'+
      '<button class="btn btn-full" onclick="handleJealousy(\'ignore\')">🚪 无视，继续调教 '+esc(targetChar.name)+'</button>'+
    '</div>';
  if(typeof pushStoryLog==='function')pushStoryLog('daily',{title:'争风·'+rival.name+'×'+targetChar.name,date:getDateStr(),char:rival.name,story:story});
  openOv('ov-jealousy');
}
function handleJealousy(action){
  closeOv('ov-jealousy');
  if(!_jealousyJealousId)return;
  var sv=loadSave(_jealousyJealousId);
  var rivalName=_jealousyRivalName||'她';
  var targetName=_jealousyTargetName||'';

  if(action==='comfort'){
    if(sv&&sv.char){sv.char.affection=clamp((sv.char.affection||0)+5);localStorage.setItem('era_sv_'+_jealousyJealousId,JSON.stringify(sv));}
    var comfortFn=JEALOUSY_COMFORT_STORIES[Math.floor(Math.random()*JEALOUSY_COMFORT_STORIES.length)];
    var comfortStory=comfortFn(rivalName);
    if(typeof pushStoryLog==='function')pushStoryLog('daily',{title:'安慰·'+rivalName,date:getDateStr(),char:rivalName,story:comfortStory});
    setTimeout(function(){
      if(typeof openStoryModal==='function'){
        openStoryModal({title:'💕 争风·安慰',story:comfortStory},'安慰',{});
      } else { toast('你安慰了'+rivalName+'，好感提升 ❤',''); }
    },200);
  } else {
    if(sv&&sv.char){sv.char.affection=clamp((sv.char.affection||0)-3);localStorage.setItem('era_sv_'+_jealousyJealousId,JSON.stringify(sv));}
    var ignoreFn=JEALOUSY_IGNORE_STORIES[Math.floor(Math.random()*JEALOUSY_IGNORE_STORIES.length)];
    var ignoreStory=ignoreFn(rivalName,targetName);
    if(typeof pushStoryLog==='function')pushStoryLog('daily',{title:'无视·'+rivalName,date:getDateStr(),char:rivalName,story:ignoreStory});
    setTimeout(function(){
      if(typeof openStoryModal==='function'){
        openStoryModal({title:'💔 争风·离去',story:ignoreStory},'嫉妒',{});
      } else { toast(rivalName+'有些失落……好感下降',''); }
    },200);
  }
  _jealousyJealousId=null;
  _jealousyRivalName='';
  _jealousyTargetName='';
}

// ══ 奴隶采购系统 ══════════════════════════════════════════════
// ── 奴隶采购：工具函数 ──────────────────────────────────────

// 获取尚未开档的角色列表
function _getUnacquiredChars(filter){
  return CHARS_DATA.filter(function(c){
    if(loadSave(c.id)) return false; // 已有存档 = 已获得
    if(filter) return filter(c);
    return true;
  });
}

// 非人种族关键词
var _nonHumanRaces = ['龙族','天使','精灵','魔族','吸血鬼','猫娘','狐娘','兽人','机器人','古风人','混血','恶魔'];
function _isNonHuman(c){ return _nonHumanRaces.some(function(r){ return (c.race||'').indexOf(r)!==-1; }); }

// 计算角色市场价格（基于初始属性）
function _charMarketPrice(c){
  var base = (c.initial_affection||0)+(c.initial_obedience||0)+(c.initial_lust||0);
  return 800 + base * 40 + Math.floor(Math.random()*200);
}

// 实际创建角色存档（"获得"角色）
function _acquireChar(c){
  var sv = {
    char: {
      id: c.id, name: c.name, nickname: c.nickname,
      gender: c.gender, personality: c.personality, race: c.race,
      class: c.class, age: c.age, description: c.description,
      height: c.height, weight: c.weight,
      sexual_orientation: c.sexual_orientation,
      stamina: 75, energy: 75,
      lust:      clamp(c.initial_lust||5),
      obedience: clamp(c.initial_obedience||20),
      affection: clamp(c.initial_affection||10),
      total_training_count: 0,
    },
    log:  [{ type:'sys', text:'开始与「'+c.name+'」的互动……' }],
    day:  State.day||1,
    money: State.money,
    inventory: State.inventory||{},
  };
  localStorage.setItem('era_sv_'+c.id, JSON.stringify(sv));
  // ★ 触发初见剧情（若角色文件定义了 firstMeeting）
  setTimeout(function(){
    _triggerFirstMeeting(c);
  }, 400);
}

// ★ 初见剧情触发器
function _triggerFirstMeeting(c){
  if(typeof CharRegistry==='undefined')return;
  var charData=CharRegistry.get(c.id);
  if(!charData||!charData.firstMeeting)return;
  var fm=charData.firstMeeting;
  var storyArr=Array.isArray(fm.story)?fm.story:[String(fm.story||'')];
  if(typeof applyStoryPlaceholders==='function'){
    storyArr=storyArr.map(function(p){return applyStoryPlaceholders(p);});
  }
  if(typeof openStoryModal==='function'){
    openStoryModal({
      title: fm.title||('🌙 初见·'+c.name),
      story: storyArr,
      cat: 'special',
      noSplit: true,
    },'初见', {});
  }
}

// ── 奴隶采购主界面 ───────────────────────────────────────────
function openSlaveProcurement(){
  var body=document.getElementById('slave-procurement-body');if(!body)return;
  var unacq = _getUnacquiredChars().length;
  body.innerHTML=
    '<div style="font-size:.8rem;color:var(--muted);line-height:1.7;margin-bottom:14px">'+
    '在奴隶市场，您可以通过多种途径扩充手下奴隶……或召唤来自异界的非人之物。'+
    '<br><span style="color:var(--txt2)">当前可获取角色：<strong>'+unacq+'</strong> 位</span></div>'+
    '<div style="display:grid;gap:10px">'+
      _slaveProcBtn('hunt','⚔️','托人猎捕奴隶','委托猎奴商前往各地搜寻，费用 $1500~$2500（含风险费）')+
      _slaveProcBtn('market','🏪','从奴隶市场购买','浏览完整角色列表，按需选购')+
      _slaveProcBtn('summon','🔮','召唤非人之物','浏览并指定召唤异界存在，代价难以预料')+
    '</div>';
  openOv('ov-slave-procurement');
}

function _slaveProcBtn(type,icon,title,desc){
  return '<div style="background:var(--card);border:1px solid var(--bdr2);border-radius:12px;padding:14px;cursor:pointer;transition:all .2s" onclick="doSlaveProcurement(\''+type+'\')">'+
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">'+
      '<div style="font-size:1.8rem">'+icon+'</div>'+
      '<div><div style="font-size:.9rem;font-weight:700;color:var(--txt)">'+title+'</div>'+
      '<div style="font-size:.7rem;color:var(--muted)">'+desc+'</div></div>'+
    '</div>'+
  '</div>';
}

// ── 奴隶采购执行逻辑 ────────────────────────────────────────
function doSlaveProcurement(type){
  if(type==='hunt'){
    // 从未获得的男性角色中随机猎取一个
    var pool = _getUnacquiredChars(function(c){ return c.gender==='男'; });
    if(!pool.length){ toast('目前找不到可猎捕的目标，稍后再试',''); return; }
    var cost = 1500+Math.floor(Math.random()*1001);
    if(State.money<cost){ toast('资金不足，猎奴费需 $'+cost,'err'); return; }
    var target = pick(pool);
    State.money -= cost;
    _logMoney('猎奴·'+target.name, -cost);
    _acquireChar(target);
    if(typeof renderPlayerCard==='function') renderPlayerCard();
    var opener = pick([
      '猎奴商带回消息：目标已制服，押送途中表现出强烈抵触……',
      '任务顺利完成——虽然对方挣扎了一路，但最终还是被带了回来。',
      '猎奴商拍胸口说搞定了，"这种人以前见多了，几天就服了。"'
    ]);
    openStoryModal({
      title:'⚔️ 猎奴完成',
      story:[
        opener,
        '「'+target.name+'」（'+target.gender+'·'+target.race+'·'+target.class+'）已入册，可在【角色】页找到并开始调教。',
        '共计花费 $'+cost+'，资金已扣除。'
      ],
      cat:'basic'
    },'奴隶采购',{});
    closeOv('ov-slave-procurement');
    if(typeof saveMiniState==='function') saveMiniState();

  } else if(type==='market'){
    // 打开市场列表
    _openSlaveMarket();

  } else if(type==='summon'){
    // 打开非人类浏览列表（可指定召唤，解决拍卖后找不到的问题）
    _openSummonMarket();
  }
}

// ── 召唤市场：可浏览并指定召唤非人类角色 ────────────────────
var _summonSearchQuery='';
function _openSummonMarket(searchQuery){
  _summonSearchQuery=searchQuery!==undefined?searchQuery:(_summonSearchQuery||'');
  var body=document.getElementById('slave-procurement-body');if(!body)return;
  var pool=_getUnacquiredChars(_isNonHuman);
  if(_summonSearchQuery){
    var q=_summonSearchQuery.toLowerCase();
    pool=pool.filter(function(c){return c.name.toLowerCase().includes(q)||(c.race||'').toLowerCase().includes(q)||(c.class||'').toLowerCase().includes(q);});
  }
  var cards=pool.slice(0,40).map(function(c){
    var cost=3000+Math.floor(((c.initial_affection||0)+(c.initial_obedience||0)+(c.initial_lust||0))*50);
    var canBuy=State.money>=cost;
    return '<div style="display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--bdr);border-radius:10px;padding:10px 12px;margin-bottom:8px">'+
      '<div style="font-size:1.5rem">'+cEmoji(c)+'</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:.88rem;font-weight:700;color:var(--txt)">'+esc(c.name)+'</div>'+
        '<div style="font-size:.68rem;color:var(--muted)">'+[c.gender,c.race,c.class,c.age?c.age+'岁':''].filter(Boolean).join(' · ')+'</div>'+
      '</div>'+
      '<button class="btn '+(canBuy?'btn-p':'btn-ghost')+' btn-sm" style="white-space:nowrap;font-size:.75rem" '+
        (canBuy?'onclick="doSummonTarget('+c.id+','+cost+')"':'disabled')+
      '>'+(canBuy?'$'+cost:'缺钱')+'</button>'+
    '</div>';
  }).join('');
  body.innerHTML=
    '<div style="font-size:.8rem;color:var(--muted);margin-bottom:10px">🔮 异界名录 · 可指定召唤（含曾拍卖的存在）<br><span style="color:#f0c050">💰 '+fmtMoney(State.money)+'</span></div>'+
    '<input class="inp" type="text" placeholder="搜索名字/种族/职业" value="'+esc(_summonSearchQuery)+'" style="width:100%;margin-bottom:10px;font-size:.82rem;box-sizing:border-box" oninput="_openSummonMarket(this.value)">'+
    (pool.length?('<div style="font-size:.72rem;color:var(--muted);margin-bottom:8px">共 '+pool.length+' 位可召唤</div>'+cards):'<div style="text-align:center;padding:20px;color:var(--muted)">暂无可召唤的存在</div>')+
    '<button class="btn btn-ghost btn-full" style="margin-top:10px" onclick="openSlaveProcurement()">← 返回</button>';
}
function doSummonTarget(charId,cost){
  var c=CHARS_DATA.find(function(x){return x.id===charId;});
  if(!c){toast('目标不存在','err');return;}
  if(loadSave(charId)){toast('已经拥有此角色','');return;}
  if(State.money<cost){toast('资金不足 $'+cost,'err');return;}
  State.money-=cost;
  _logMoney('召唤·'+c.name,-cost);
  _acquireChar(c);
  if(typeof renderPlayerCard==='function')renderPlayerCard();
  var opener=pick(['符文燃尽的瞬间，一道轮廓从虚空中凝聚而出，带着不属于这个世界的气息。','蜡烛骤灭，黑暗里有什么东西在动——随后，它的声音响起，令人一时无法分辨情绪。','召唤阵发出刺眼的白光，当视野恢复，对方已经站在了正中间，神情复杂地打量着四周。']);
  openStoryModal({title:'🔮 召唤成功',story:[opener,'「'+c.name+'」（'+c.race+'·'+c.class+'）已降临，可在【角色】页找到并开始调教。','召唤耗费 $'+cost+'，异界之力已消散。'],cat:'special'},'奴隶采购',{});
  closeOv('ov-slave-procurement');
  if(typeof saveMiniState==='function')saveMiniState();
}

// ── 奴隶市场列表界面 ─────────────────────────────────────────
// 奴隶市场性别过滤器状态
var _marketGenderFilter = '';
var _marketSearchQuery = '';

function _openSlaveMarket(genderFilter, searchQuery){
  _marketGenderFilter = genderFilter || _marketGenderFilter || '';
  _marketSearchQuery = searchQuery !== undefined ? searchQuery : (_marketSearchQuery||'');
  var body = document.getElementById('slave-procurement-body'); if(!body) return;
  // 只显示人类/类人（非特殊种族）未拥有的
  var humanPool = _getUnacquiredChars(function(c){
    var race = c.race||'';
    return !NON_HUMAN_RACES.some(function(r){return race.includes(r);});
  });
  // 性别过滤
  var pool = humanPool;
  if(_marketGenderFilter) pool = pool.filter(function(c){return c.gender===_marketGenderFilter;});
  // 搜索过滤
  if(_marketSearchQuery){
    var q=_marketSearchQuery.toLowerCase();
    pool=pool.filter(function(c){
      return c.name.toLowerCase().includes(q)||(c.race||'').toLowerCase().includes(q)||(c.class||'').toLowerCase().includes(q);
    });
  }

  // 价格计算
  var priceMap = {};
  humanPool.forEach(function(c){ priceMap[c.id] = 800 + ((c.initial_affection||0)+(c.initial_obedience||0)+(c.initial_lust||0))*35; });

  var cards = pool.slice(0,30).map(function(c){
    var price = priceMap[c.id]||999;
    var canBuy = State.money >= price;
    return '<div style="display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--bdr);border-radius:10px;padding:10px 12px;margin-bottom:8px;cursor:pointer" onclick="previewMarketSlave('+c.id+')">'+
      '<div style="font-size:1.5rem">'+cEmoji(c)+'</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:.9rem;font-weight:700;color:var(--txt)">'+esc(c.name)+'</div>'+
        '<div style="font-size:.68rem;color:var(--muted)">'+[c.gender,c.race,c.class,c.age?c.age+'岁':''].filter(Boolean).join(' · ')+'</div>'+
        '<div style="font-size:.68rem;color:var(--muted);margin-top:2px">💪体力'+((typeof getMaxStamina==='function')?getMaxStamina(c):1500)+' ⚡精力'+((typeof getMaxEnergy==='function')?getMaxEnergy(c):1500)+'</div>'+
      '</div>'+
      '<button class="btn '+(canBuy?'btn-p':'btn-ghost')+' btn-sm" style="white-space:nowrap;font-size:.75rem" '+
        (canBuy?'onclick="event.stopPropagation();buySlaveFromMarket('+JSON.stringify(c.id)+','+price+')"':'disabled')+
      '>'+(canBuy?'$'+price:'缺钱')+'</button>'+
    '</div>';
  }).join('');

  var chips=['','男','女','双性'].map(function(g){
    var on=(_marketGenderFilter===g)?'on':'';
    var label=g||'全部';
    return '<button class="chip g-chip '+on+'" onclick="_openSlaveMarket(&quot;'+g+'&quot;,_marketSearchQuery)">'+label+'</button>';
  }).join('');

  body.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'+
      '<span style="font-size:.8rem;font-weight:700;color:var(--txt2)">🏪 奴隶市场</span>'+
      '<span style="font-size:.82rem;color:#f0c050">💰 '+fmtMoney(State.money)+'</span>'+
    '</div>'+
    '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">'+chips+'</div>'+
    '<div style="display:flex;gap:6px;margin-bottom:12px">'+
      '<input class="inp" id="market-search" type="text" placeholder="搜索名字/种族/职业" value="'+esc(_marketSearchQuery)+'" style="flex:1;font-size:.82rem" oninput="_openSlaveMarket(_marketGenderFilter,this.value)">'+
    '</div>'+
    (pool.length?
      '<div style="font-size:.72rem;color:var(--muted);margin-bottom:8px">共 '+pool.length+' 位可购买'+(_marketGenderFilter?'（'+_marketGenderFilter+'）':'')+'</div>'+cards
      :'<div style="text-align:center;padding:20px;color:var(--muted)">暂无符合条件的角色</div>')+
    '<button class="btn btn-ghost btn-full" style="margin-top:10px" onclick="openSlaveProcurement()">← 返回</button>';
}

function previewMarketSlave(charId){
  var c=CHARS_DATA.find(function(x){return x.id===charId;});
  if(!c)return;
  var rows=[
    ['性别',c.gender||'未知'],['种族',c.race||'人类'],['职业',c.class||'—'],
    ['年龄',c.age?c.age+'岁':'—'],['性格',c.personality||'—'],
    ['身高',c.height?c.height+'cm':'—'],['体重',c.weight?c.weight+'kg':'—'],
    ['性取向',c.sexual_orientation||'—']
  ];
  var html='<div style="text-align:center;margin-bottom:14px"><div style="font-size:3rem;margin-bottom:6px">'+cEmoji(c)+'</div><div style="font-weight:900;font-size:1.1rem;color:var(--txt)">'+esc(c.name)+'</div></div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:14px;font-size:.8rem">'+rows.map(function(r){return _detRow(r[0],r[1]);}).join('')+'</div>';
  html+='<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:14px">';
  var mSta=(typeof getMaxStamina==='function')?getMaxStamina(c):1500;
  var mEne=(typeof getMaxEnergy==='function')?getMaxEnergy(c):1500;
  [['💪体力上限',mSta,'var(--sg)'],['⚡精力上限',mEne,'var(--sb)']].forEach(function(s){
    html+='<div style="text-align:center;background:var(--card2);border-radius:8px;padding:8px"><div style="font-size:.68rem;color:var(--muted)">'+s[0]+'</div><div style="font-size:1.1rem;font-weight:700;color:'+s[2]+'">'+s[1]+'</div></div>';
  });
  html+='</div>';
  if(c.description||c.desc) html+='<div style="font-size:.78rem;color:var(--txt2);line-height:1.7;padding:10px;background:var(--card2);border-radius:8px;margin-bottom:12px">'+esc(c.description||c.desc)+'</div>';
  html+='<button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-slave-detail\')">关闭</button>';
  var body=document.getElementById('slave-detail-body');
  if(body) body.innerHTML=html;
  openOv('ov-slave-detail');
}

function buySlaveFromMarket(charId, price){
  var c = CHARS_DATA.filter(function(x){ return String(x.id)===String(charId); })[0];
  if(!c){ toast('角色不存在','err'); return; }
  if(loadSave(charId)){ toast('已经拥有该角色了',''); return; }
  if(State.money<price){ toast('资金不足','err'); return; }
  State.money -= price;
  _logMoney('购买奴隶·'+c.name, -price);
  _acquireChar(c);
  if(typeof renderPlayerCard==='function') renderPlayerCard();
  if(typeof saveMiniState==='function') saveMiniState();

  // 根据性格生成购买剧情
  var story = _genPurchaseStory(c);
  pushStoryLog('purchase',{title:'购入·'+c.name,date:getDateStr(),char:c.name,story:story});
  openCustomConfirm('🎉 购入新奴隶',
    '<div style="text-align:center;margin-bottom:12px"><div style="font-size:2.5rem">'+cEmoji(c)+'</div><div style="font-size:1rem;font-weight:700;margin-top:6px">'+esc(c.name)+'</div></div>'+
    '<div style="font-size:.82rem;color:var(--txt2);line-height:1.8;padding:10px;background:var(--card2);border-radius:8px">'+story.map(function(s){return '<p style="margin-bottom:6px">'+esc(s)+'</p>';}).join('')+'</div>',
    '确认',function(){ _openSlaveMarket(); });
}

function _genPurchaseStory(c){
  var name=c.name, p=c.personality||'';
  var lines=['商人将'+name+'带到了你面前。'];
  if(p.indexOf('开朗')>=0||p.indexOf('元气')>=0) lines.push('「嗯？你就是新主人吗？看起来……还行吧！」'+name+'歪着头打量着你，眼中闪着好奇的光芒。');
  else if(p.indexOf('高傲')>=0||p.indexOf('傲娇')>=0) lines.push('「哼……别以为买下我就能对我做什么。」'+name+'别过头去，耳尖却微微泛红。');
  else if(p.indexOf('温柔')>=0||p.indexOf('温和')>=0) lines.push('「初次见面……请多关照。」'+name+'微微低头，声音温软得像春日的微风。');
  else if(p.indexOf('阴暗')>=0||p.indexOf('冷漠')>=0) lines.push('「……」'+name+'面无表情地看了你一眼，没有说话，只是静静地站在那里。');
  else if(p.indexOf('腹黑')>=0) lines.push('「啊啦，能被您买下真是荣幸呢。」'+name+'露出一个完美的微笑，但那双眼睛里似乎藏着什么。');
  else if(p.indexOf('天然')>=0||p.indexOf('纯真')>=0) lines.push('「你好呀～我叫'+name+'！以后我们就是朋友了吗？」'+name+'天真地笑着，完全没有意识到自己的处境。');
  else if(p.indexOf('痞')>=0||p.indexOf('油嘴')>=0) lines.push('「哟，新主人？看起来挺有意思的嘛。」'+name+'嘴角勾起一抹玩味的笑容。');
  else lines.push(''+name+'沉默地站在那里，等待着命运的安排。');
  lines.push('从今天起，'+name+'成为了你的所有物。');
  return lines;
}

// [旧作弊码已移除，使用下方带弹窗版本]

// [旧renderCheatPanel和旧作弊辅助函数已移除，使用下方增强版]
// ══ 休息弹窗（首页点击休息）══════════════════════════════════
function doRestFromHome(){
  var allChars=(typeof CHARS_DATA!=='undefined')?CHARS_DATA.filter(function(c){var sv=loadSave(c.id);return sv&&sv.char;}):[];
  allChars.forEach(function(c){
    var sv=loadSave(c.id);if(!sv||!sv.char)return;
    var maxSta=(typeof getMaxStamina==='function')?getMaxStamina(sv.char):1500;
    var maxEne=(typeof getMaxEnergy==='function')?getMaxEnergy(sv.char):1500;
    sv.char.stamina=Math.min(maxSta,(sv.char.stamina||0)+Math.floor(maxSta/2));
    sv.char.energy =Math.min(maxEne,(sv.char.energy ||0)+Math.floor(maxEne/2));
    localStorage.setItem('era_sv_'+c.id,JSON.stringify(sv));
    if(State.currentChar&&String(State.currentChar.id)===String(c.id)){
      State.currentChar.stamina=sv.char.stamina;State.currentChar.energy=sv.char.energy;
    }
  });
  if(!State.currentChar){
    var rs=(typeof REST_STORIES!=='undefined'&&REST_STORIES.length)?pick(REST_STORIES):{title:'休息',story:['今天好好休息了一下，感觉精神了不少。'],effects:{}};
    State.day=(State.day||1)+1;
    if(typeof _playerProfile!=='undefined'){var mxS=_playerProfile.staminaMax||2000;_playerProfile.stamina=Math.min(mxS,(_playerProfile.stamina||0)+Math.floor(mxS*0.5));_playerProfile.energy=Math.min(_playerProfile.energyMax||2000,(_playerProfile.energy||0)+Math.floor((_playerProfile.energyMax||2000)*0.5));localStorage.setItem('era_profile',JSON.stringify(_playerProfile));}
    // ★ 每日孕育+节日检测
    if(typeof dailyPregnancyCheck==='function') try{dailyPregnancyCheck();}catch(e){}
    if(typeof checkFestivalWarning==='function') try{checkFestivalWarning();}catch(e){}
    var storyLines=(rs.story||['好好休息了一番。']).slice();
    storyLines.push('');storyLines.push('—— 休息效果 ——');
    storyLines.push('所有奴隶和主人的体力与精力恢复了上限的一半。');
    storyLines.push('进入了第 '+State.day+' 天。');
    pushStoryLog&&pushStoryLog('rest',{title:rs.title,date:typeof getDateStr==='function'?getDateStr():'第'+State.day+'天',story:storyLines});
    openStoryModal({title:'🌙 '+rs.title,story:storyLines,noSplit:true,cat:'basic'},'休息',{});
    if(typeof renderPlayerCard==='function')renderPlayerCard();
    if(typeof renderManor==='function')renderManor();
    return;
  }
  if(typeof doRest==='function')doRest();
}

// ══ 通用漂亮确认弹窗 ══════════════════════════════════════════
// openCustomConfirm(title, htmlContent, confirmLabel, onConfirm)
function openCustomConfirm(title, htmlContent, confirmLabel, onConfirm){
  var body=document.getElementById('custom-confirm-body');
  var ttl=document.getElementById('custom-confirm-title');
  var confirmBtn=document.getElementById('custom-confirm-ok');
  if(!body||!ttl||!confirmBtn) return;
  ttl.textContent=title;
  body.innerHTML=htmlContent;
  confirmBtn.textContent=confirmLabel||'确认';
  confirmBtn.onclick=function(){
    closeOv('ov-custom-confirm');
    if(typeof onConfirm==='function') onConfirm();
  };
  openOv('ov-custom-confirm');
}

// [REST_STORIES moved to work_events.js to avoid duplicate]

// ══ 作弊码系统（重写：替换prompt为内置输入框）════════════════
function openCheatCode(){
  var body=document.getElementById('cheat-pwd-body');
  if(!body)return;
  body.innerHTML=
    '<div style="text-align:center;margin-bottom:16px">'+
      '<div style="font-size:2.5rem;margin-bottom:8px">🔑</div>'+
      '<div style="font-size:.85rem;color:var(--txt2);margin-bottom:14px">输入作弊码以进入测试模式</div>'+
      '<input class="inp" id="cheat-pwd-inp" type="password" maxlength="8" placeholder="请输入作弊码" '+
        'style="text-align:center;font-size:1.3rem;letter-spacing:8px;font-weight:bold" '+
        'onkeydown="if(event.key===\'Enter\')confirmCheatCode()">'+
    '</div>'+
    '<div style="display:flex;gap:8px">'+
      '<button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-cheat-pwd\')">取消</button>'+
      '<button class="btn btn-p btn-full" onclick="confirmCheatCode()">确认</button>'+
    '</div>';
  openOv('ov-cheat-pwd');
  setTimeout(function(){var el=document.getElementById('cheat-pwd-inp');if(el)el.focus();},200);
}

function confirmCheatCode(){
  var inp=document.getElementById('cheat-pwd-inp');
  if(!inp)return;
  if(inp.value!=='0000'){
    inp.style.borderColor='#f06';
    inp.value='';
    inp.placeholder='作弊码错误，请重试';
    return;
  }
  closeOv('ov-cheat-pwd');
  openOv('ov-cheat');
  renderCheatPanel();
}

function renderCheatPanel(){
  var body=document.getElementById('cheat-body');if(!body)return;
  var chars=CHARS_DATA.filter(function(c){return loadSave(c.id)&&loadSave(c.id).char;});
  var curMoney=State.money||0;

  body.innerHTML=
    // 警告条
    '<div style="background:rgba(255,0,100,.08);border:1px solid rgba(255,0,100,.3);border-radius:10px;padding:8px 12px;margin-bottom:14px;font-size:.75rem;color:#f8a">'+
      '⚠️ 测试专用 · 正式版本请移除作弊码入口'+
    '</div>'+

    // 当前状态面板
    '<div style="background:var(--card2);border-radius:10px;padding:10px 14px;margin-bottom:14px">'+
      '<div style="font-size:.7rem;color:var(--muted);margin-bottom:5px"></div>'+
      '<div style="display:flex;gap:14px;font-size:.9rem;font-weight:700">'+
        '<span>💰 <span id="cheat-live-money">'+fmtMoney(curMoney)+'</span></span>'+
        '<span>📅 第 <span id="cheat-live-day">'+(State.day||1)+'</span> 天</span>'+
      '</div>'+
    '</div>'+

    // 时间
    '<div class="cheat-section-title">⏰ 时间操控</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:14px">'+
      '<button class="btn btn-ghost" onclick="cheatSkipDay(1)">+1天</button>'+
      '<button class="btn btn-ghost" onclick="cheatSkipDay(7)">+7天</button>'+
      '<button class="btn btn-ghost" onclick="cheatSkipDay(30)">+30天</button>'+
    '</div>'+

    // 主角体力/精力
    '<div class="cheat-section-title">💪 主角体力&精力</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:14px">'+
      '<button class="btn btn-ghost" onclick="cheatFillPlayerStamina()">体力满 ('+((typeof _playerProfile!=='undefined'&&_playerProfile)?100:100)+')</button>'+
      '<button class="btn btn-ghost" onclick="cheatFillPlayerEnergy()">精力满 (100)</button>'+
    '</div>'+

    // 金币
    '<div class="cheat-section-title">💰 金币设置</div>'+
    '<div style="display:flex;gap:8px;margin-bottom:8px">'+
      '<input class="inp" id="cheat-money-inp" type="number" placeholder="输入金额" style="flex:1">'+
      '<button class="btn btn-p" onclick="cheatSetMoney()">设置</button>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:14px">'+
      '<button class="btn btn-ghost" onclick="cheatAddMoney(10000)">+1万</button>'+
      '<button class="btn btn-ghost" onclick="cheatAddMoney(100000)">+10万</button>'+
      '<button class="btn btn-ghost" onclick="cheatAddMoney(1000000)">+100万</button>'+
    '</div>'+

    // 奴隶属性
    '<div class="cheat-section-title">👤 奴隶属性</div>'+
    '<select class="inp" id="cheat-char-sel" style="margin-bottom:10px" onchange="cheatShowCharStats()">'+
      '<option value="">— 选择角色 —</option>'+
      chars.map(function(c){return '<option value="'+c.id+'">'+esc(c.name)+'</option>';}).join('')+
    '</select>'+
    // 属性显示板
    '<div id="cheat-char-stats" style="background:var(--card2);border-radius:9px;padding:10px 12px;margin-bottom:10px;display:none">'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.82rem" id="cheat-stats-grid"></div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:8px">'+
      '<button class="btn btn-ghost btn-sm" onclick="cheatMaxAff()">好感拉满</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="cheatMaxObed()">服从拉满</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="cheatMaxLust()">欲望拉满</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="cheatMaxSlaveStamina()">体力拉满</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="cheatMaxSlaveEnergy()">精力拉满</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="cheatResetChar()">全部归零</button>'+
    '</div>'+

    // 属性等级调整
    '<div style="font-size:.78rem;font-weight:600;color:var(--txt2);margin-bottom:6px">📈 属性等级（欲望/好感/服从 Lv.1-10）：</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">'+
      '<button class="btn btn-ghost btn-sm" onclick="cheatSetStatLevel(\'lust\',10)">欲望 满级</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="cheatSetStatLevel(\'affection\',10)">好感 满级</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="cheatSetStatLevel(\'obedience\',10)">服从 满级</button>'+
    '</div>'+

    // 关系阶段
    '<div style="font-size:.78rem;font-weight:600;color:var(--txt2);margin-bottom:6px">💕 关系阶段（直接设定）：</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">'+
      '<button class="btn btn-ghost btn-sm" onclick="cheatSetRelation(\'陌生\')">陌生</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="cheatSetRelation(\'相识\')">相识</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="cheatSetRelation(\'信赖\')">信赖</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="cheatSetRelation(\'依恋\')">依恋</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="cheatSetRelation(\'爱恋\')">爱恋</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="cheatSetRelation(\'臣服\')">臣服</button>'+
    '</div>'+

    '<div style="font-size:.78rem;font-weight:600;color:var(--txt2);margin-bottom:6px">自定义数值（含动态上限）：</div>'+
    '<div style="display:flex;gap:6px;margin-bottom:14px">'+
      '<select class="inp" id="cheat-stat-key" style="flex:2;font-size:.8rem">'+
        '<option value="affection">好感度</option>'+
        '<option value="obedience">服从度</option>'+
        '<option value="lust">欲望值</option>'+
        '<option value="stamina">体力</option>'+
        '<option value="energy">精力</option>'+
        '<option value="total_training_count">训练次数</option>'+
      '</select>'+
      '<input class="inp" id="cheat-stat-val" type="number" min="0" placeholder="输入数值" style="flex:1">'+
      '<button class="btn btn-sm btn-p" onclick="cheatSetStat()">应用</button>'+
    '</div>'+

    // 道具
    '<div class="cheat-section-title">🎒 道具</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">'+
      '<button class="btn btn-ghost" onclick="cheatAddVoucher()">+5张约会券</button>'+
      '<button class="btn btn-ghost" onclick="cheatAddAllItems()">所有消耗品×10</button>'+
      '<button class="btn btn-ghost" onclick="cheatGetAllStandardItems()">一键获取所有道具</button>'+
    '</div>';
}

// 显示选中奴隶的当前属性
function cheatShowCharStats(){
  var r=_getCheatChar();
  var panel=document.getElementById('cheat-char-stats');
  var grid=document.getElementById('cheat-stats-grid');
  if(!panel||!grid)return;
  if(!r){panel.style.display='none';return;}
  var c=r.sv.char;
  var stats=[
    {label:'好感❤',key:'affection',color:'var(--so)'},
    {label:'服从👁',key:'obedience',color:'var(--sp)'},
    {label:'欲望🔥',key:'lust',color:'var(--sr)'},
    {label:'体力💪',key:'stamina',color:'var(--sg)'},
    {label:'精力⚡',key:'energy',color:'var(--sb)'},
    {label:'训练次数',key:'total_training_count',color:'var(--acc)'},
  ];
  grid.innerHTML=stats.map(function(s){
    var v=Math.round(c[s.key]||0);
    var pct=s.key==='total_training_count'?null:v;
    return '<div style="display:flex;flex-direction:column;gap:2px">'+
      '<div style="font-size:.7rem;color:var(--muted)">'+s.label+'</div>'+
      '<div style="font-weight:800;font-size:1rem;color:'+s.color+'">'+v+(pct!==null?'<span style="font-size:.65rem;color:var(--muted)">/100</span>':'')+'</div>'+
      (pct!==null?'<div style="height:3px;background:var(--bdr2);border-radius:2px"><div style="height:100%;width:'+pct+'%;background:'+s.color+';border-radius:2px;transition:.3s"></div></div>':'')+
    '</div>';
  }).join('');
  panel.style.display='block';
}

function _cheatRefreshLiveStats(){
  var m=document.getElementById('cheat-live-money');
  var d=document.getElementById('cheat-live-day');
  if(m)m.textContent=fmtMoney(State.money||0);
  if(d)d.textContent=State.day||1;
  cheatShowCharStats();
}

function cheatSkipDay(n){
  State.day=(State.day||1)+n;
  if(typeof renderPlayerCard==='function')renderPlayerCard();
  if(typeof saveMiniState==='function')saveMiniState();
  _cheatRefreshLiveStats();
  toast('⏰ 已快进 '+n+' 天（现在是第 '+State.day+' 天）','ok');
}
function cheatSetMoney(){
  var v=parseInt(document.getElementById('cheat-money-inp').value);
  if(isNaN(v))return;
  var old=State.money||0;
  State.money=Math.max(0,v);
  _logMoney('作弊·设定金币', State.money-old);
  if(typeof renderPlayerCard==='function')renderPlayerCard();
  if(typeof saveMiniState==='function')saveMiniState();
  _cheatRefreshLiveStats();
  toast('💰 金币已设为 '+fmtMoney(State.money),'ok');
}
function cheatAddMoney(n){
  State.money=(State.money||0)+n;
  _logMoney('作弊·增加金币', n);

function cheatFillStamina(){
  if(!State.currentChar)return;
  var maxSta=(typeof getMaxStamina==='function')?getMaxStamina(State.currentChar):1500;
  var maxEne=(typeof getMaxEnergy==='function')?getMaxEnergy(State.currentChar):1500;
  State.currentChar.stamina=maxSta;
  State.currentChar.energy=maxEne;
  if(typeof setStat==='function'){setStat('stamina',maxSta);setStat('energy',maxEne);}
  if(typeof writeSave==='function')writeSave();
  toast('💪 体力'+maxSta+' 精力'+maxEne+' 已拉满','ok');
}
  if(typeof renderPlayerCard==='function')renderPlayerCard();
  if(typeof saveMiniState==='function')saveMiniState();
  _cheatRefreshLiveStats();
  toast('💰 当前金币：'+fmtMoney(State.money),'ok');
}
function cheatAddVoucher(){
  var inv=State.inventory||{};
  inv['date_voucher']=(inv['date_voucher']||0)+5;
  State.inventory=inv;
  if(typeof saveMiniState==='function')saveMiniState();
  toast('🎟️ 已添加 5 张约会券，当前共 '+inv['date_voucher']+'张','ok');
}
function cheatAddAllItems(){
  (ITEMS_DATA||[]).forEach(function(it){
    if(it.category==='consumable'){State.inventory[it.id]=(State.inventory[it.id]||0)+10;}
  });
  if(typeof saveMiniState==='function')saveMiniState();
  toast('🎒 所有消耗品 +10','ok');
}
function _getCheatChar(){
  var id=document.getElementById('cheat-char-sel');
  if(!id||!id.value)return null;
  var sv=loadSave(id.value)||loadSave(parseInt(id.value));
  return sv?{id:id.value,sv:sv}:null;
}
function cheatMaxAff(){var r=_getCheatChar();if(!r)return;var maxV=typeof getStatMax==='function'?getStatMax(r.sv.char,'affection'):100;r.sv.char.affection=maxV;r.sv.char.affection_level=10;localStorage.setItem('era_sv_'+r.id,JSON.stringify(r.sv));if(State.currentChar&&String(State.currentChar.id)===String(r.id)){State.currentChar.affection=maxV;State.currentChar.affection_level=10;if(typeof setStat==='function')setStat('affection',maxV);}toast('❤ 好感已拉满到'+maxV+' (Lv.10)','ok');cheatShowCharStats();}
function cheatMaxObed(){var r=_getCheatChar();if(!r)return;var maxV=typeof getStatMax==='function'?getStatMax(r.sv.char,'obedience'):100;r.sv.char.obedience=maxV;r.sv.char.obedience_level=10;localStorage.setItem('era_sv_'+r.id,JSON.stringify(r.sv));if(State.currentChar&&String(State.currentChar.id)===String(r.id)){State.currentChar.obedience=maxV;State.currentChar.obedience_level=10;if(typeof setStat==='function')setStat('obedience',maxV);}toast('👁 服从已拉满到'+maxV+' (Lv.10)','ok');cheatShowCharStats();}
function cheatMaxLust(){var r=_getCheatChar();if(!r)return;var maxV=typeof getStatMax==='function'?getStatMax(r.sv.char,'lust'):100;r.sv.char.lust=maxV;r.sv.char.lust_level=10;localStorage.setItem('era_sv_'+r.id,JSON.stringify(r.sv));if(State.currentChar&&String(State.currentChar.id)===String(r.id)){State.currentChar.lust=maxV;State.currentChar.lust_level=10;if(typeof setStat==='function')setStat('lust',maxV);}toast('🔥 欲望已拉满到'+maxV+' (Lv.10)','ok');cheatShowCharStats();}
function cheatMaxSlaveStamina(){var r=_getCheatChar();if(!r)return;var maxSta=typeof getMaxStamina==='function'?getMaxStamina(r.sv.char):1500;var maxEne=typeof getMaxEnergy==='function'?getMaxEnergy(r.sv.char):1500;r.sv.char.stamina=maxSta;r.sv.char.energy=maxEne;localStorage.setItem('era_sv_'+r.id,JSON.stringify(r.sv));if(State.currentChar&&String(State.currentChar.id)===String(r.id)){State.currentChar.stamina=maxSta;State.currentChar.energy=maxEne;if(typeof setStat==='function'){setStat('stamina',maxSta);setStat('energy',maxEne);}}toast('💪 体力'+maxSta+' 精力'+maxEne+' 已拉满','ok');cheatShowCharStats();}
function cheatMaxSlaveEnergy(){cheatMaxSlaveStamina();}
function cheatFillPlayerStamina(){
  if(typeof _playerProfile!=='undefined'){var mx=_playerProfile.staminaMax||2000;_playerProfile.stamina=mx;_playerProfile.energy=_playerProfile.energyMax||2000;localStorage.setItem('era_profile',JSON.stringify(_playerProfile));}
  if(typeof renderPlayerCard==='function')renderPlayerCard();
  toast('💪 主角体力精力已拉满','ok');
}
function cheatFillPlayerEnergy(){cheatFillPlayerStamina();}
function cheatSetStatLevel(statName, level){
  var r=_getCheatChar();if(!r){toast('请先选择角色','');return;}
  var lvKey=statName+'_level';
  r.sv.char[lvKey]=Math.min(10,Math.max(1,level));
  var maxV=r.sv.char[lvKey]*100;
  r.sv.char[statName]=Math.min(r.sv.char[statName]||0,maxV);
  localStorage.setItem('era_sv_'+r.id,JSON.stringify(r.sv));
  if(State.currentChar&&String(State.currentChar.id)===String(r.id)){
    State.currentChar[lvKey]=r.sv.char[lvKey];
    if(typeof setStat==='function')setStat(statName,State.currentChar[statName]);
  }
  var labels={lust:'欲望',affection:'好感',obedience:'服从'};
  toast((labels[statName]||statName)+' 已设为 Lv.'+level+' (上限'+maxV+')','ok');
  cheatShowCharStats();
}
function cheatSetRelation(stageName){
  var r=_getCheatChar();if(!r){toast('请先选择角色','');return;}
  // 根据关系阶段设置好感和服从
  var stageMap={
    '陌生':{affection:5,obedience:5},
    '相识':{affection:20,obedience:20},
    '信赖':{affection:40,obedience:40},
    '依恋':{affection:60,obedience:60},
    '爱恋':{affection:80,obedience:70},
    '臣服':{affection:90,obedience:90},
  };
  var vals=stageMap[stageName];
  if(!vals){toast('未知关系阶段','err');return;}
  r.sv.char.affection=vals.affection;
  r.sv.char.obedience=vals.obedience;
  r.sv.char.relation_stage=stageName;
  localStorage.setItem('era_sv_'+r.id,JSON.stringify(r.sv));
  if(State.currentChar&&String(State.currentChar.id)===String(r.id)){
    State.currentChar.affection=vals.affection;
    State.currentChar.obedience=vals.obedience;
    State.currentChar.relation_stage=stageName;
    if(typeof setStat==='function'){setStat('affection',vals.affection);setStat('obedience',vals.obedience);}
    var rsEl=document.getElementById('p-relation-stage');
    if(rsEl)rsEl.textContent=stageName;
  }
  toast('💕 关系阶段已设为「'+stageName+'」','ok');
  cheatShowCharStats();
}
function cheatGetAllStandardItems(){
  (ITEMS_DATA||[]).forEach(function(it){
    State.inventory[it.id]=(State.inventory[it.id]||0)+1;
  });
  if(typeof saveMiniState==='function')saveMiniState();
  toast('🎒 已获取所有道具','ok');
}
function cheatResetChar(){var r=_getCheatChar();if(!r)return;['affection','obedience','lust','stamina','energy','lust_level','affection_level','obedience_level'].forEach(function(k){r.sv.char[k]=0;});['lust_level','affection_level','obedience_level'].forEach(function(k){r.sv.char[k]=1;});localStorage.setItem('era_sv_'+r.id,JSON.stringify(r.sv));toast('🔄 属性已全部归零','ok');cheatShowCharStats();}
function cheatSetStat(){
  var r=_getCheatChar();
  if(!r){toast('请先选择角色','');return;}
  var key=document.getElementById('cheat-stat-key').value;
  var val=parseInt(document.getElementById('cheat-stat-val').value);
  if(isNaN(val)){toast('请输入有效数值','err');return;}
  // 使用动态上限
  var maxVal=100;
  if(key==='stamina') maxVal=typeof getMaxStamina==='function'?getMaxStamina(r.sv.char):3000;
  else if(key==='energy') maxVal=typeof getMaxEnergy==='function'?getMaxEnergy(r.sv.char):3000;
  else if(key==='lust'||key==='obedience'||key==='affection') maxVal=typeof getStatMax==='function'?getStatMax(r.sv.char,key):1000;
  else if(key==='total_training_count') maxVal=99999;
  val=Math.max(0,Math.min(maxVal,val));
  r.sv.char[key]=val;
  localStorage.setItem('era_sv_'+r.id,JSON.stringify(r.sv));
  if(State.currentChar&&String(State.currentChar.id)===String(r.id)){State.currentChar[key]=val;if(typeof setStat==='function')setStat(key,val);}
  var labels={affection:'好感',obedience:'服从',lust:'欲望',stamina:'体力',energy:'精力',total_training_count:'训练次数'};
  toast((labels[key]||key)+' 已设为 '+val+' (上限 '+maxVal+')','ok');
  cheatShowCharStats();
}

// ══ 庄园系统 ══════════════════════════════════════════════════
var NON_HUMAN_RACES = ['龙族','天使','精灵','魔族','吸血鬼','猫娘','狐娘','兽人','机器人','恶魔','神明','人造人','混血'];

// ── 奴隶与玩家的关系阶段 ──
function _getPlayerSlaveStage(c){
  // 优先使用emotion.js设置的关系阶段
  if(typeof getRelationStage==='function'){
    try{var rs=getRelationStage(c);if(rs&&rs.name)return{name:rs.name,color:rs.color||'var(--muted)',bg:rs.bg||'var(--card2)'};}catch(e){}
  }
  // 如果角色有手动设置的关系阶段
  if(c.relation_stage){
    var stageColors={'臣服':{c:'#7e57c2',b:'rgba(126,87,194,.12)'},'依恋':{c:'#ec407a',b:'rgba(236,64,122,.1)'},'信赖':{c:'#66bb6a',b:'rgba(102,187,106,.1)'},'接受':{c:'#42a5f5',b:'rgba(66,165,245,.1)'},'警戒':{c:'#ffa726',b:'rgba(255,167,38,.1)'},'陌生':{c:'var(--muted)',b:'var(--card2)'}};
    var sc=stageColors[c.relation_stage]||{c:'var(--muted)',b:'var(--card2)'};
    return{name:c.relation_stage,color:sc.c,bg:sc.b};
  }
  // 兜底：用好感度等级判断
  var affLv=c.affection_level||1;
  var aff=c.affection||0;
  var obed=c.obedience||0;
  var obedLv=c.obedience_level||1;
  if(obedLv>=8&&affLv>=8)return{name:'臣服',color:'#7e57c2',bg:'rgba(126,87,194,.12)'};
  if(affLv>=6)return{name:'依恋',color:'#ec407a',bg:'rgba(236,64,122,.1)'};
  if(affLv>=4)return{name:'信赖',color:'#66bb6a',bg:'rgba(102,187,106,.1)'};
  if(affLv>=3)return{name:'接受',color:'#42a5f5',bg:'rgba(66,165,245,.1)'};
  if(affLv>=2)return{name:'警戒',color:'#ffa726',bg:'rgba(255,167,38,.1)'};
  return{name:'陌生',color:'var(--muted)',bg:'var(--card2)'};
}

// ── 节日横幅系统 ──────────────────────────────────────────────
var FESTIVALS=[
  {month:1,day:1,name:'元旦',icon:'🎉',msg:'新年快乐！愿新的一年万事如意~'},
  {month:2,day:14,name:'情人节',icon:'💝',msg:'甜蜜的情人节~记得给心爱的人一个拥抱哦'},
  {month:3,day:8,name:'妇女节',icon:'🌷',msg:'致每一位了不起的女性~'},
  {month:5,day:1,name:'劳动节',icon:'🏖️',msg:'辛苦了！今天也好好休息一下吧'},
  {month:6,day:1,name:'儿童节',icon:'🎈',msg:'保持童心，永远快乐~'},
  {month:7,day:7,name:'七夕',icon:'🎋',msg:'鹊桥相会~愿有情人终成眷属'},
  {month:8,day:15,name:'中秋节',icon:'🥮',msg:'月圆人团圆，中秋快乐~'},
  {month:10,day:31,name:'万圣节',icon:'🎃',msg:'Trick or Treat！不给糖就捣蛋~'},
  {month:12,day:24,name:'平安夜',icon:'🎄',msg:'平安夜快乐~'},
  {month:12,day:25,name:'圣诞节',icon:'🎅',msg:'Merry Christmas！圣诞快乐~'},
];

function checkFestivalWarning(){
  var day=State.day||1;
  var dm=typeof _dayToMD==='function'?_dayToMD(day):null;
  if(!dm)return;
  var festival=null;
  FESTIVALS.forEach(function(f){
    if(f.month===dm.month&&f.day===dm.day)festival=f;
  });
  // 检查奴隶生日（如果有charProfile里的birthMonth/birthDay）
  var birthday=null;
  if(State.currentChar){
    var sv=loadSave(State.currentChar.id);
    var profile=sv&&sv.charProfile||{};
    if(profile.birthMonth===dm.month&&profile.birthDay===dm.day){
      birthday={name:State.currentChar.name,icon:'🎂'};
    }
  }
  
  // 在庄园顶部显示横幅
  var bannerEl=document.getElementById('manor-festival-banner');
  if(!bannerEl){
    var manorSection=document.getElementById('s-manor');
    if(manorSection){
      bannerEl=document.createElement('div');
      bannerEl.id='manor-festival-banner';
      manorSection.insertBefore(bannerEl,manorSection.firstChild);
    }
  }
  if(bannerEl){
    if(festival){
      bannerEl.innerHTML='<div style="background:linear-gradient(135deg,rgba(240,192,80,.15),rgba(200,120,200,.15));border:1px solid rgba(240,192,80,.3);border-radius:12px;padding:12px 16px;margin-bottom:12px;text-align:center;animation:festivalPulse 2s infinite">'+
        '<div style="font-size:1.5rem;margin-bottom:4px">'+festival.icon+'</div>'+
        '<div style="font-weight:800;color:var(--txt);font-size:.9rem">🎊 '+festival.name+' 🎊</div>'+
        '<div style="font-size:.75rem;color:var(--txt2);margin-top:3px">'+festival.msg+'</div></div>';
    } else if(birthday){
      bannerEl.innerHTML='<div style="background:linear-gradient(135deg,rgba(240,120,180,.15),rgba(240,200,80,.15));border:1px solid rgba(240,120,180,.3);border-radius:12px;padding:12px 16px;margin-bottom:12px;text-align:center">'+
        '<div style="font-size:1.5rem;margin-bottom:4px">🎂</div>'+
        '<div style="font-weight:800;color:var(--txt);font-size:.9rem">🎉 '+esc(birthday.name)+' 的生日！🎉</div>'+
        '<div style="font-size:.75rem;color:var(--txt2);margin-top:3px">祝'+esc(birthday.name)+'生日快乐~</div></div>';
    } else {
      bannerEl.innerHTML='';
    }
  }
}

// ══ 奴隶路线 & 标签系统 ══════════════════════════════════════
var SLAVE_ROUTES = [
  { id:'love',       tag:'恋慕', icon:'❤️',  color:'#e91e63', name:'爱情路线', check:function(sv){return (sv.affection||0)>=85;} },
  { id:'domination', tag:'服从', icon:'⛓️',  color:'#7c4dff', name:'支配路线', check:function(sv){return (sv.obedience||0)>=90;} },
  { id:'lust',       tag:'淫乱', icon:'🔥',  color:'#ff5722', name:'色欲路线', check:function(sv){return (sv.lust||0)>=90;} },
  { id:'yandere',    tag:'执迷', icon:'🩸',  color:'#c62828', name:'病娇路线', check:function(sv){return (sv.affection||0)>=85&&(sv.obedience||0)>=85;} },
  { id:'dark',       tag:'堕落', icon:'🌑',  color:'#37474f', name:'黑化路线', check:function(sv){return (sv.affection||0)<=-10&&(sv.obedience||0)>=65;} },
];

function _updateSlaveTags(charData, charId) {
  if (!charData) return false;
  if (!charData.tags) charData.tags = [];
  var changed = false;
  SLAVE_ROUTES.forEach(function(route) {
    if (route.check(charData) && charData.tags.indexOf(route.tag) < 0) {
      charData.tags.push(route.tag);
      changed = true;
      if (typeof toast === 'function') toast(route.icon + ' 解锁标签「' + route.tag + '」（' + route.name + '）', 'ok');
    }
  });
  return changed;
}

function renderManor(){
  var acquired=CHARS_DATA.filter(function(c){var sv=loadSave(c.id);return sv&&sv.char;});
  var list=document.getElementById('manor-slave-list');
  var empty=document.getElementById('manor-empty');
  if(!list||!empty)return;
  if(!acquired.length){list.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  list.innerHTML=acquired.map(function(c){
    var sv=loadSave(c.id);
    var char=sv.char;
    var aff=Math.round(char.affection||0);
    var obed=Math.round(char.obedience||0);
    var lust=Math.round(char.lust||0);
    var profile=sv.charProfile||{};
    var cid=typeof c.id==='number'?c.id:JSON.stringify(c.id);
    // 头像（优先级：用户上传 > 制作者预设 > emoji）
    var _avaImgSrc=profile.avaImg||(profile._presetAvaUrl||'');
    // 如果 charData 上有 _presetAvaUrl 也参考（实时注入后更新）
    if(!_avaImgSrc&&typeof CharRegistry!=='undefined'){
      var _cr=CharRegistry.get(c.id);
      if(_cr&&_cr._presetAvaUrl)_avaImgSrc=_cr._presetAvaUrl;
    }
    var avaHtml;
    if(_avaImgSrc){
      avaHtml='<div style="width:52px;height:52px;background:var(--card2);border-radius:50%;overflow:hidden;cursor:pointer;flex-shrink:0" onclick="openSlaveAvaModal('+cid+')" title="更换头像"><img src="'+_avaImgSrc+'" style="width:100%;height:100%;object-fit:cover"></div>';
    }else{
      var emoji=profile.ava||cEmoji(c);
      avaHtml='<div style="font-size:2rem;width:52px;height:52px;background:var(--card2);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0" onclick="openSlaveAvaModal('+cid+')" title="更换头像">'+emoji+'</div>';
    }
    // 性别符号
    var gSym=c.gender==='女'?'♀':c.gender==='男'?'♂':'⚧';
    var gColor=c.gender==='女'?'#f06292':c.gender==='男'?'#42a5f5':'#ab47bc';
    // 关系阶段（奴隶与玩家）
    var relStage='';
    var _rs=_getPlayerSlaveStage(char);
    relStage='<span style="font-size:.62rem;color:'+_rs.color+';background:'+_rs.bg+';padding:1px 6px;border-radius:6px;font-weight:600">'+_rs.name+'</span>';
    // 性格
    var perso=c.personality||'';
    // ★ 标签检测与更新
    if (_updateSlaveTags(char, c.id)) {
      var _svTmp = loadSave(c.id); _svTmp.char = char;
      localStorage.setItem('era_sv_' + c.id, JSON.stringify(_svTmp));
    }
    // 怀孕/发情徽章
    var badges='';
    if(typeof getHeatBadge==='function')badges+=getHeatBadge(char);
    if(typeof getPregnancyData==='function'){var _pd2=getPregnancyData();var _pi2=_pd2[String(c.id)];if(_pi2&&_pi2.pregnant&&!_pi2.born)badges+='<span style="background:#ffb74d;color:#fff;padding:1px 5px;border-radius:8px;font-size:.55rem;font-weight:700;margin-left:3px">🤰</span>';}
    // ★ 路线标签徽章
    if (char.tags && char.tags.length) {
      char.tags.forEach(function(tag) {
        var route = SLAVE_ROUTES.find(function(r){return r.tag===tag;}) || {};
        badges += '<span style="background:' + (route.color||'#888') + ';color:#fff;padding:1px 5px;border-radius:8px;font-size:.55rem;font-weight:700;margin-left:3px">' + (route.icon||'🏷️') + tag + '</span>';
      });
    }
    // 属性条紧凑版
    var sta=Math.round(char.stamina||0);var maxSta=(typeof getMaxStamina==='function')?getMaxStamina(char):100;
    var staPct=maxSta>0?Math.round(sta/maxSta*100):0;
    return '<div style="background:var(--card);border:1px solid var(--bdr2);border-radius:14px;padding:12px">'+
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'+
        avaHtml+
        '<div style="flex:1;min-width:0">'+
          '<div style="display:flex;align-items:center;gap:4px;flex-wrap:nowrap">'+
            '<span style="font-weight:800;font-size:.92rem;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(c.name)+'</span>'+
            '<span style="font-size:.72rem;color:'+gColor+';flex-shrink:0">'+gSym+'</span>'+
            badges+
          '</div>'+
          '<div style="font-size:.65rem;color:var(--muted);margin-top:3px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">'+
            relStage+
            (perso?'<span style="color:var(--txt2)">'+esc(perso)+'</span>':'')+
          '</div>'+
        '</div>'+
        '<div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">'+
          '<button class="btn btn-sm" style="font-size:.62rem;padding:4px 8px;white-space:nowrap;background:rgba(100,181,246,.1);color:var(--acc2);border:1px solid rgba(100,181,246,.2)" onclick="openExpDetailForSlave('+cid+')">📊 角色经验</button>'+
          '<button class="btn btn-sm" style="font-size:.62rem;padding:4px 8px;white-space:nowrap" onclick="openSlaveDetailById('+cid+')">📋 角色详情</button>'+
        '</div>'+
      '</div>'+
      // 属性条（紧凑4列，值不会溢出）
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:4px;margin-bottom:6px;font-size:.65rem">'+
        _manorStatBar('❤',aff,'var(--so)')+
        _manorStatBar('👁',obed,'var(--sp)')+
        _manorStatBar('🔥',lust,'var(--sr)')+
        _manorStatBar('💪',staPct+'%','var(--sg)',staPct)+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">'+
        '<button class="btn btn-sm" style="font-size:.72rem;background:rgba(233,30,99,.06);color:#e91e63;border:1px solid rgba(233,30,99,.15)" onclick="if(typeof viewCharCG===\'function\')viewCharCG('+cid+');else openCharCGList('+cid+')">🖼️ 形象</button>'+
        '<button class="btn btn-p btn-sm" style="font-size:.72rem" onclick="enterTrainingFromManor('+cid+')">⚔️ 调教</button>'+
        '<button class="btn btn-ghost btn-sm" style="font-size:.72rem" onclick="openSlaveRoom('+cid+')">🛏️ 房间</button>'+
      '</div>'+
    '</div>';
  }).join('');
}

function _manorStatBar(icon, val, color, pctOverride){
  var pct=(pctOverride!==undefined)?pctOverride:(typeof val==='number'?val:0);
  return '<div>'+
    '<div style="display:flex;justify-content:space-between;margin-bottom:2px">'+
      '<span style="color:var(--muted)">'+icon+'</span>'+
      '<span style="color:'+color+';font-weight:700;font-size:.62rem">'+val+'</span>'+
    '</div>'+
    '<div style="height:3px;background:var(--bdr2);border-radius:2px">'+
      '<div style="height:100%;width:'+Math.min(100,pct)+'%;background:'+color+';border-radius:2px"></div>'+
    '</div>'+
  '</div>';
}

function enterTrainingFromManor(charId){
  if(typeof selectChar==='function') selectChar(charId);
}

// ── 奴隶角色经验弹窗 ──
function openExpDetailForSlave(charId){
  var sv=loadSave(charId);if(!sv||!sv.char)return;
  var c=sv.char;var base=CHARS_DATA.find(function(x){return x.id===charId;});
  var body=document.getElementById('slave-detail-body');if(!body)return;
  var html='<div style="text-align:center;margin-bottom:14px"><div style="font-size:2rem;margin-bottom:4px">'+cEmoji(c)+'</div><div style="font-weight:800;color:var(--txt)">'+esc(c.name)+' · 角色经验</div></div>';
  // 基础经验
  var expItems=[
    {k:'expKiss',label:'接吻',icon:'💋'},{k:'expCaress',label:'爱抚',icon:'🤲'},{k:'expOral',label:'口技',icon:'👅'},
    {k:'expAnal',label:'肛门',icon:'🍑'},{k:'expVaginal',label:'性交',icon:'💗'},{k:'expCreampie',label:'内射',icon:'💦'},
    {k:'expToy',label:'道具',icon:'🎀'},{k:'expBondage',label:'束缚',icon:'⛓️'},{k:'expExhibition',label:'露出',icon:'👁'},
  ];
  html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:14px">';
  expItems.forEach(function(e){
    var val=Math.round(c[e.k]||0);
    html+='<div style="background:var(--card2);border-radius:8px;padding:7px;text-align:center"><div style="font-size:1rem">'+e.icon+'</div><div style="font-size:.62rem;color:var(--muted)">'+e.label+'</div><div style="font-size:.85rem;font-weight:700;color:var(--txt)">'+val+'</div></div>';
  });
  html+='</div>';
  // 训练统计
  html+='<div style="font-size:.8rem;font-weight:700;color:var(--txt);margin-bottom:8px">📊 训练统计</div>';
  html+='<div style="background:var(--card2);border-radius:10px;padding:10px 12px;font-size:.78rem;color:var(--txt2);line-height:1.8;margin-bottom:10px">';
  html+='总训练次数：'+(c.total_training_count||0)+'<br>';
  html+='内射次数：'+(c.expCreampie||0)+'<br>';
  if(typeof getPregnancyChance==='function'){html+='当前怀孕概率：'+Math.round(getPregnancyChance(c,State.day||1)*100)+'%<br>';}
  html+='</div>';
  html+='<button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-slave-detail\')">关闭</button>';
  body.innerHTML=html;openOv('ov-slave-detail');
}

function openSlaveDetailById(charId){
  var c=CHARS_DATA.find(function(x){return x.id===charId;});
  var sv=loadSave(charId);
  if(!c||!sv)return;
  var char=sv.char;
  var nick=sv.charProfile?.nickname||c.nickname||'';
  var profile=sv.charProfile||{};
  var body=document.getElementById('slave-detail-body');
  if(!body)return;
  // 头像（使用上传的头像，完整显示）
  var avaHtml;
  if(profile.avaImg){
    avaHtml='<div style="width:80px;height:80px;border-radius:50%;overflow:hidden;margin:0 auto 8px"><img src="'+profile.avaImg+'" style="width:100%;height:100%;object-fit:cover"></div>';
  }else{
    avaHtml='<div style="font-size:3rem;margin-bottom:6px">'+cEmoji(c)+'</div>';
  }
  var gSym=c.gender==='女'?'♀':c.gender==='男'?'♂':'⚧';
  body.innerHTML=
    '<div style="text-align:center;margin-bottom:16px">'+
      avaHtml+
      '<div style="font-weight:900;font-size:1.1rem;color:var(--txt)">'+esc(c.name)+' <span style="font-size:.85rem;color:var(--muted)">'+gSym+'</span></div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:10px;font-size:.8rem">'+
      '<div style="background:var(--card2);border-radius:7px;padding:7px 9px"><div style="font-size:.65rem;color:var(--muted)">昵称</div><div style="font-weight:700;color:var(--txt);cursor:pointer" ondblclick="renameSlaveNick('+charId+')" title="双击修改">'+esc(nick||'无')+'</div></div>'+
      _detRow('性取向',c.sexual_orientation||'—')+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:10px;font-size:.8rem">'+
      _detRow('性别',c.gender||'未知')+
      _detRow('种族',c.race||'人类')+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:10px;font-size:.8rem">'+
      _detRow('年龄',c.age?c.age+'岁':'—')+
      _detRow('性格',c.personality||'—')+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:14px;font-size:.8rem">'+
      _detRow('调教天数',Math.round(sv.day||1)+'天')+
      _detRow('身高',c.height?c.height+'cm':'—')+
      _detRow('体重',c.weight?c.weight+'kg':'—')+
      _detRow('职业',c.class||'—')+
    '</div>'+
    ((c.description||c.desc)?'<div style="font-size:.82rem;color:var(--txt2);line-height:1.8;padding:12px;background:var(--card2);border-radius:10px;margin-bottom:14px;border-left:3px solid var(--acc3)"><div style="font-size:.7rem;color:var(--acc3);font-weight:700;margin-bottom:5px">📖 人物介绍</div>'+esc(c.description||c.desc)+'</div>':'')+
'<div style="display:flex;gap:8px;margin-top:4px">'+
      '<button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-slave-detail\')">关闭</button>'+
    '</div>';    
  openOv('ov-slave-detail');
}
function renameSlaveNick(charId){
  var sv=loadSave(charId);if(!sv)return;
  var nick=prompt('输入新昵称：',sv.charProfile?.nickname||'');
  if(nick===null)return;
  if(!sv.charProfile)sv.charProfile={};
  sv.charProfile.nickname=nick;
  localStorage.setItem('era_sv_'+charId,JSON.stringify(sv));
  openSlaveDetailById(charId);
  toast('昵称已修改','ok');
}

function _detRow(label, val){
  return '<div style="background:var(--card2);border-radius:7px;padding:7px 9px">'+
    '<div style="font-size:.65rem;color:var(--muted)">'+label+'</div>'+
    '<div style="font-weight:700;color:var(--txt)">'+esc(String(val))+'</div>'+
  '</div>';
}
function _statRow(label, val, color){
  return '<div style="display:flex;align-items:center;gap:8px">'+
    '<div style="font-size:.78rem;color:var(--txt2);width:56px;flex-shrink:0">'+label+'</div>'+
    '<div style="flex:1;height:6px;background:var(--bdr2);border-radius:3px">'+
      '<div style="height:100%;width:'+val+'%;background:'+color+';border-radius:3px;transition:.4s"></div>'+
    '</div>'+
    '<div style="width:28px;text-align:right;font-size:.78rem;font-weight:700;color:'+color+'">'+val+'</div>'+
  '</div>';
}

// ── 房间系统 ──────────────────────────────────────────────────
var ROOM_FURNITURE = [
  {id:'window', name:'窗户', 
   icons:['🪟','🪟','🏠','🏡'],
   levels:['木板封死','简陋木窗','普通窗户','宽敞落地窗'], upgrade_cost:[200,800,3000],
   interact:'window'},
  {id:'light', name:'灯', 
   icons:['🕯️','💡','🔆','🌟'],
   levels:['无灯（黑暗）','蜡烛','普通灯泡','豪华灯具'], upgrade_cost:[100,500,2000],
   interact:'light'},
  {id:'bed', name:'床铺', 
   icons:['🌾','🛏️','🛏️','🛏️'],
   levels:['简陋稻草席','普通木板床','舒适弹簧床','豪华大床'], upgrade_cost:[500,2000,8000],
   interact:'bed'},
  {id:'closet', name:'衣柜', 
   icons:['📦','🗄️','🚪','🪞'],
   levels:['无衣柜','简单木箱','基础衣柜','精品衣橱'], upgrade_cost:[300,1500,5000],
   interact:'closet'},
  {id:'tv', name:'娱乐', 
   icons:['🔇','📻','📺','🖥️'],
   levels:['无','小型收音机','普通电视','高清影音'], upgrade_cost:[400,1800,6000],
   interact:'tv'},
  {id:'bookshelf', name:'书架', 
   icons:['📭','📚','📚','📚'],
   levels:['无书架','几本破书','普通书架','精品书房'], upgrade_cost:[300,1200,4000],
   interact:'bookshelf'},
  {id:'decor', name:'装饰', 
   icons:['🕳️','🌸','🎀','✨'],
   levels:['空荡荡','零星小物','温馨布置','奢华装潢'], upgrade_cost:[200,1000,4000]},
];

// 家具互动的文字描述
var FURNITURE_INTERACT_STORIES = {
  window: {
    open: ['你走到窗边，将窗户轻轻推开。','新鲜的空气涌入，带走了房间里滞留的气息。',
           '{name}抬起头，感受着微风，神情似乎轻松了一些。','「……空气好多了。」'],
    close: ['你将窗户重新关上，隔绝了外面的声音。',
            '房间里重新恢复了沉寂。'],
  },
  light: {
    on:  ['你拉开灯的开关，房间里顿时亮堂起来。','暖黄色的光线覆盖了每一个角落。',
          '{name}下意识眯了眯眼，随即适应了光线。'],
    off: ['你关掉灯，房间沉入了半明半暗的氛围里。','只剩窗外的光线投下淡淡的阴影。'],
  },
  bed: ['你在床边坐下，拍了拍身旁的位置。',
        '{name}犹豫了一下，还是慢慢靠了过来。',
        '两个人并排躺着，什么都没有说，只是安静地听彼此的呼吸。',
        '也许休息，本来就不需要太多理由。'],
  tv:  ['你打开了电视，随手调到一个频道。',
        '画面亮起来，熟悉的声音填满了房间。',
        '{name}也忍不住朝屏幕看去——也许只是无聊，也许只是习惯。',
        '两个人就这样坐着，看着并不怎么有趣的节目，谁都没有先开口。'],
  bookshelf: ['你从书架上抽出一本书，在{name}身旁坐下。',
              '「要不要一起看？」',
              '{name}没有说话，但没有离开。',
              '书页翻动的声音轻轻响起，午后的时间就这样慢慢流淌。'],
  closet: null, // handled separately
};

function openSlaveRoom(charId){
  var c=CHARS_DATA.find(function(x){return x.id===charId;});
  var sv=loadSave(charId);
  if(!c){if(typeof toast==='function')toast('找不到角色数据','err');return;}
  if(!sv||!sv.char){if(typeof toast==='function')toast('请先购买该角色再进入房间','');return;}
  // 初始化房间数据
  var room=sv.room||{};
  ROOM_FURNITURE.forEach(function(f){if(room[f.id]===undefined)room[f.id]=0;});
  // 灯的开关状态
  if(room.lightOn===undefined)room.lightOn=true;
  // 窗户的开关状态
  if(room.windowOpen===undefined)room.windowOpen=false;
  sv.room=room;
  localStorage.setItem('era_sv_'+charId,JSON.stringify(sv));
  _renderSlaveRoom(charId, c, sv);
  openOv('ov-slave-room');
}

function _renderSlaveRoom(charId, c, sv){
  var body=document.getElementById('slave-room-body');
  if(!body)return;
  var room=sv.room||{};
  var char=sv.char;

  var cid=typeof charId==='number'?charId:JSON.stringify(charId);
  var furnitureHtml=ROOM_FURNITURE.map(function(f){
    var lvl=room[f.id]||0;
    var maxLvl=f.levels.length-1;
    var levelName=f.levels[lvl];
    var cost=lvl<maxLvl?f.upgrade_cost[lvl]:null;
    var canAff=cost&&State.money>=cost;
    var icon=f.icons?f.icons[lvl]:f.icon;

    // 互动按钮（用单引号避免onclick属性里双引号冲突）
    var fqs="'"+f.id+"'"; // single-quoted furniture id
    var interactBtn='';
    if(f.interact&&lvl>0){
      if(f.interact==='light'){
        var isOn=room.lightOn!==false;
        interactBtn='<button class="btn btn-sm '+(isOn?'btn-ghost':'btn-p')+'" onclick="roomFurnitureInteract('+cid+','+fqs+')">'+(isOn?'🌑 关灯':'💡 开灯')+'</button>';
      }else if(f.interact==='window'){
        var isOpen=room.windowOpen===true;
        interactBtn='<button class="btn btn-sm '+(isOpen?'btn-ghost':'btn-p')+'" onclick="roomFurnitureInteract('+cid+','+fqs+')">'+(isOpen?'🔒 关窗':'🌬️ 开窗')+'</button>';
      }else if(f.interact==='closet'){
        interactBtn='<button class="btn btn-sm btn-p" onclick="openCloset('+cid+')">👗 换衣服</button>';
      }else{
        var interactLabels={bed:'🛏️ 一起躺',tv:'📺 看电视',bookshelf:'📚 一起看书'};
        interactBtn='<button class="btn btn-sm btn-p" onclick="roomFurnitureInteract('+cid+','+fqs+')">'+(interactLabels[f.interact]||'互动')+'</button>';
      }
    }

    return '<div style="background:var(--card2);border-radius:9px;padding:9px 12px">'+
      '<div style="display:flex;align-items:center;gap:10px">'+
        '<div style="font-size:1.6rem;min-width:28px">'+icon+'</div>'+
        '<div style="flex:1">'+
          '<div style="font-size:.82rem;font-weight:700">'+f.name+
            (lvl===maxLvl?' <span style="font-size:.65rem;color:var(--acc)">✓满</span>':'')+
          '</div>'+
          '<div style="font-size:.7rem;color:var(--muted)">'+esc(levelName)+'</div>'+
        '</div>'+
        '<div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;justify-content:flex-end">'+
          interactBtn+
          (cost?'<button class="btn btn-sm '+(canAff?'btn-p':'btn-ghost')+'" onclick="upgradeFurniture('+cid+',\''+f.id+'\')" '+(canAff?'':'disabled')+'>升级 $'+cost.toLocaleString()+'</button>':'') +
        '</div>'+
      '</div>'+
    '</div>';
  }).join('');

  body.innerHTML=
    '<div style="text-align:center;margin-bottom:14px">'+
      '<div style="font-size:2rem;margin-bottom:4px">'+cEmoji(c)+'</div>'+
      '<div style="font-weight:800;font-size:.95rem">'+esc(c.name)+'的房间</div>'+
      '<div style="font-size:.72rem;color:var(--muted);margin-top:3px">好感 <b style="color:var(--so)">'+Math.round(char.affection||0)+'</b> · 服从 <b style="color:var(--sp)">'+Math.round(char.obedience||0)+'</b></div>'+
    '</div>'+
    '<div style="font-size:.78rem;font-weight:700;color:var(--txt2);margin-bottom:8px">🏠 房间设施</div>'+
    '<div style="display:grid;gap:8px;margin-bottom:14px">'+furnitureHtml+'</div>'+
    '<div style="font-size:.78rem;font-weight:700;color:var(--txt2);margin-bottom:8px">💬 互动</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:14px">'+
      '<button class="btn btn-ghost btn-sm" onclick="roomInteract('+cid+',\'chat\')">💬 聊天</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="roomInteract('+cid+',\'meal\')">🍽️ 共餐</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="roomInteract('+cid+',\'gift\')">🎁 送礼</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="roomInteract('+cid+',\'night\')">🌙 夜间探望</button>'+
    '</div>'+
    '<button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-slave-room\')">离开房间</button>';
}

function upgradeFurniture(charId,furnitureId){
  var sv=loadSave(charId);if(!sv)return;
  var room=sv.room||{};
  var f=ROOM_FURNITURE.find(function(x){return x.id===furnitureId;});
  if(!f)return;
  var lvl=room[f.id]||0;
  if(lvl>=f.levels.length-1)return;
  var cost=f.upgrade_cost[lvl];
  if(State.money<cost){toast('金币不足','err');return;}
  State.money-=cost;
  room[f.id]=(lvl+1);
  sv.room=room;
  sv.money=State.money; // ★ 同步金币
  localStorage.setItem('era_sv_'+charId,JSON.stringify(sv));
  if(typeof saveMiniState==='function')saveMiniState();
  if(typeof renderPlayerCard==='function')renderPlayerCard();
  // 记录消费
  _logMoney('房间升级·'+f.name, -cost);
  var c=CHARS_DATA.find(function(x){return x.id===charId;});
  toast('🏠 '+f.name+'已升级为「'+f.levels[room[f.id]]+'」！','ok');
  if(c) _renderSlaveRoom(charId, c, sv);
}

function roomFurnitureInteract(charId, furnitureId){
  var c=CHARS_DATA.find(function(x){return x.id===charId;});
  var sv=loadSave(charId);
  if(!c||!sv)return;
  var room=sv.room||{};
  var f=ROOM_FURNITURE.find(function(x){return x.id===furnitureId;});
  if(!f)return;

  var story=[];
  var aff=0;
  var title='';

  if(furnitureId==='light'){
    var isOn=room.lightOn!==false;
    room.lightOn=!isOn;
    story=FURNITURE_INTERACT_STORIES.light[room.lightOn?'on':'off'].map(function(s){return s.replace('{name}',esc(c.name));});
    aff=1;
    title=(room.lightOn?'💡 开灯':'🌑 关灯');
  }else if(furnitureId==='window'){
    var wasOpen=room.windowOpen===true;
    room.windowOpen=!wasOpen;
    var wStories=room.windowOpen?FURNITURE_INTERACT_STORIES.window.open:FURNITURE_INTERACT_STORIES.window.close;
    story=wStories.map(function(s){return s.replace('{name}',esc(c.name));});
    aff=room.windowOpen?2:1;
    title=(room.windowOpen?'🌬️ 开窗透气':'🔒 关窗');
  }else{
    var stData=FURNITURE_INTERACT_STORIES[furnitureId];
    if(stData&&Array.isArray(stData)){
      story=stData.map(function(s){return s.replace('{name}',esc(c.name));});
    }else{
      story=['你与'+esc(c.name)+'在房间里进行了一次互动。'];
    }
    var affMap={bed:4,tv:3,bookshelf:4};
    aff=affMap[furnitureId]||2;
    var titleMap={bed:'🛏️ 一起休息',tv:'📺 一起看电视',bookshelf:'📚 一起看书'};
    title=titleMap[furnitureId]||'互动';
  }

  sv.room=room;
  sv.char.affection=Math.min(100,(sv.char.affection||0)+aff);
  sv.money=State.money;
  localStorage.setItem('era_sv_'+charId,JSON.stringify(sv));
  if(typeof saveMiniState==='function')saveMiniState();

  // 刷新房间界面（不关闭）
  _renderSlaveRoom(charId, c, sv);

  // 显示剧情弹窗
  setTimeout(function(){
    openStoryModal({title:title,story:story,cat:'basic'},'房间互动',{affection:aff});
  },80);
}

function openCloset(charId){
  var c=CHARS_DATA.find(function(x){return x.id===charId;});
  var sv=loadSave(charId);
  if(!c||!sv)return;
  var room=sv.room||{};
  var clothes=room.clothes||['普通衣物','睡衣','围裙（限定）'];
  var currentCloth=room.currentCloth||clothes[0];

  var cid2=typeof charId==='number'?charId:JSON.stringify(charId);
  // 简单的衣柜选择弹窗（复用现有弹窗机制）
  openCustomConfirm(
    '👗 '+c.name+'的衣橱',
    '<div style="margin-bottom:12px;font-size:.8rem;color:var(--muted)">选择让'+esc(c.name)+'穿上的衣物：</div>'+
    '<div style="display:grid;gap:8px">'+
    clothes.map(function(cl){
      var isCur=cl===currentCloth;
      var clEsc=cl.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      return '<div style="background:var(--card2);border-radius:8px;padding:10px 12px;cursor:pointer;border:2px solid '+(isCur?'var(--acc)':'transparent')+'" onclick="wearCloth('+cid2+',\''+clEsc+'\')">'+
        '<span style="font-size:.9rem">'+(isCur?'✓ ':'')+'</span>'+
        '<span style="font-weight:700">'+esc(cl)+'</span>'+
        (isCur?' <span style="font-size:.7rem;color:var(--acc)">（当前穿着）</span>':'')+
      '</div>';
    }).join('')+
    '</div>',
    '关闭',
    function(){}
  );
}

function wearCloth(charId, clothName){
  var c=CHARS_DATA.find(function(x){return x.id===charId;});
  var sv=loadSave(charId);
  if(!c||!sv)return;
  var room=sv.room||{};
  room.currentCloth=clothName;
  sv.room=room;
  sv.char.affection=Math.min(100,(sv.char.affection||0)+2);
  localStorage.setItem('era_sv_'+charId,JSON.stringify(sv));
  closeOv('ov-custom-confirm');
  toast('👗 '+esc(c.name)+'换上了「'+clothName+'」','ok');
  var story=[
    '你从衣橱里取出了「'+clothName+'」，递给'+esc(c.name)+'。',
    '「……穿上吧。」',
    esc(c.name)+'沉默地接过衣物，转过身去。',
    '片刻后，换好衣服的'+esc(c.name)+'重新面向你，神情有些说不清楚。',
  ];
  setTimeout(function(){
    openStoryModal({title:'👗 换上「'+clothName+'」',story:story,cat:'basic'},'房间互动',{affection:2});
  },80);
  _renderSlaveRoom(charId, c, sv);
}

function roomInteract(charId,type){
  var c=CHARS_DATA.find(function(x){return x.id===charId;});
  var sv=loadSave(charId);
  if(!c||!sv)return;
  var stories={
    chat:['你在'+esc(c.name)+'的房间里坐了下来，随意找了个话题。','「……今天外面下雨了。」你说。','「是吗。」'+esc(c.name)+'淡淡地回应，随即沉默。','两人就这样坐着，没有再说更多——但气氛比以前少了一分剑拔弩张。'],
    meal:['你带来了两份饭食，放在'+esc(c.name)+'桌上。','「吃吧。」你说。','对方沉默片刻，还是动了筷子。','「……这个不难吃。」声音很小，几乎像是说给自己听的。'],
    gift:['你把那件东西递给'+esc(c.name)+'，没有多余的解释。','「……给我的？」对方看起来有些意外。','「嗯。」','那件礼物就这样留了下来，连同一点点说不清道不明的情绪。'],
    night:['深夜，你推开'+esc(c.name)+'的房门。','烛火已经熄灭，只有月光透过窗格洒进来。','你站在门口片刻，没有进去，也没有开口。','只是确认了一下——他/她还在，还好。'],
  };
  var gain={chat:2,meal:3,gift:5,night:2};
  var story=stories[type]||['你与'+esc(c.name)+'进行了一次互动。'];
  var aff=gain[type]||2;
  sv.char.affection=Math.min(100,(sv.char.affection||0)+aff);
  sv.money=State.money;
  localStorage.setItem('era_sv_'+charId,JSON.stringify(sv));
  if(typeof saveMiniState==='function')saveMiniState();

  // ★ 不关闭房间，只刷新显示
  _renderSlaveRoom(charId, c, sv);

  var titleMap={chat:'💬 聊天',meal:'🍽️ 共餐',gift:'🎁 送礼',night:'🌙 夜间探望'};
  setTimeout(function(){
    openStoryModal({title:titleMap[type]||'互动',story:story,cat:'basic'},'房间互动',{affection:aff});
  },80);
}

// ── 初始化 ────────────────────────────────────────────────────
function initFeatures(){
  ensureProfileDefaults();
  if(typeof loadMiniState==='function')loadMiniState();
  buildStoryRegistry();
  updateLogCounts();
  // 迁移旧日志
  State.storyLog=State.storyLog||[];
  (State.workLog||[]).forEach(function(e){if(!State.storyLog.some(function(s){return s.type==='work'&&s.title===e.title;}))State.storyLog.push({type:'work',title:e.title||'打工',date:e.date||'',story:[e.snippet||''],locked:false});});
  (State.wanderLog||[]).forEach(function(e){if(!State.storyLog.some(function(s){return s.type==='wander'&&s.title===e.title;}))State.storyLog.push({type:'wander',title:e.title||'闲逛',date:e.date||'',story:[e.snippet||''],locked:false});});
}
document.addEventListener('DOMContentLoaded',initFeatures);
