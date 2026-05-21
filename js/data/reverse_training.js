// ============================================================
// js/data/reverse_training.js
// 逆推系统 —— 奴隶体力充沛+欲望/好感较高时，反过来调教主人
// 结构说明：
//   - checkReverseTrainingTrigger()   检测是否触发
//   - openReverseTrainingModal()      打开逆推弹窗（前置询问）
//   - RT_SLAVE_REQUESTS               奴隶的随机指令池（可扩展）
//   - RT_PERSONALITY_ASK              各性格的请求台词
//   - RT_ACCEPT_STORIES / RT_REJECT_STORIES  接受/拒绝后续剧情
//   - RT_EXHAUSTED_STORIES            体力耗尽结局
// ============================================================

// ── 触发条件检测 ──────────────────────────────────────────────
var _rtLastTriggerRound = 0;
var _RT_COOLDOWN = 8;
function checkReverseTrainingTrigger() {
  var c = State.currentChar;
  if (!c) return false;
  var trainCount = c.total_training_count || 0;
  if (trainCount - _rtLastTriggerRound < _RT_COOLDOWN) return false;
  var lustOk      = (c.lust      || 0) > 70;
  var affectionOk = (c.affection || 0) > 70;
  var staminaOk   = (c.stamina   || 0) > 1000;
  if (!staminaOk || !lustOk || !affectionOk) return false;
  var basePct = (typeof getEventProb==='function')?getEventProb('reverse'):0.08;
  var bonus   = Math.max(0, (c.lust + c.affection - 140) / 600);
  if (Math.random() < (basePct + bonus)) { _rtLastTriggerRound = trainCount; return true; }
  return false;
}

// ── 各性格的前置询问台词 ──────────────────────────────────────
// 参考旧游戏 @逆推詢問，根据 personality 字段匹配
var RT_PERSONALITY_ASK = [
  // [匹配关键词数组, 台词]
  [['高傲','傲娇','自大'],
   function(n){ return ['「喂……」'+n+'突然停下动作，凑近了些，「你这么主导，我有点……看不下去。」','那双微微红了的眼睛别开视线，声音也低了几分，「换我来。不然我不服气。」'];}],
  [['胆怯','自卑','害羞'],
   function(n){ return [n+'的手轻轻握住你的手腕，制止了你接下来的动作。','「那个……」他低着头，耳尖红透了，「我……我可以……试着……在上面吗？」','声音小得像蚊鸣，生怕你拒绝。'];}],
  [['温柔','稳重','体贴'],
   function(n){ return ['「让我来。」'+n+'轻声说，把你轻轻往后推了推。','「每次都是你主导……偶尔也让我照顾你吧？」他的眼神里有什么很认真的东西。'];}],
  [['活泼','开朗','元气'],
   function(n){ return ['「呐！」'+n+'突然坐直，眼睛亮晶晶地看着你，「换我在上面好不好？好不好嘛？」','「就这一次！我保证会让你舒服的！」'];}],
  [['腹黑','意味深长','狡黠'],
   function(n){ return ['「主人，」'+n+'轻笑了一声，带着点让人摸不透的意味，「你的表情真有趣。」','「不如……让我来主导一次？就当是……回报一下平时的照顾。」'];}],
  [['冷漠','无口','安静'],
   function(n){ return ['「……」'+n+'沉默地停下来，用那双难得认真的眼睛看着你。','过了很久，只说了两个字：「换我。」'];}],
  [['病娇','执着'],
   function(n){ return ['「不行。」'+n+'猛地握住你的手腕，眼中闪过一丝危险的光芒。','「今天，由我来决定。」他的笑容带着一丝强迫的甜蜜，「主人……乖乖的。」'];}],
  // 通用（无匹配时用）
  [null,
   function(n){ return [n+'停下了动作，用一种难以描述的眼神看着你——','「……偶尔，可以让我来吗？」'];}],
];

function _getPersonalityAskFn(c) {
  var personality = (c.personality || '') + (c.talent || '');
  for (var i = 0; i < RT_PERSONALITY_ASK.length - 1; i++) {
    var keywords = RT_PERSONALITY_ASK[i][0];
    for (var j = 0; j < keywords.length; j++) {
      if (personality.indexOf(keywords[j]) !== -1) {
        return RT_PERSONALITY_ASK[i][1];
      }
    }
  }
  return RT_PERSONALITY_ASK[RT_PERSONALITY_ASK.length - 1][1]; // 通用
}

// ── 奴隶可执行的指令池（可扩展）──────────────────────────────
// 每项：{ name, desc, accept_fn, reject_fn }
// accept_fn/reject_fn(charName) => story[]
var RT_SLAVE_REQUESTS = [
  {
    name: '抚摸', desc: '奴隶想要用双手抚摸你的身体，感受你的温度。',
    accept_fn: function(n) { return [
      n+'的手轻轻落在你肩上，顺着脊背缓缓滑落，',
      '那触碰出奇地温柔，仿佛在描摹一件珍贵的东西。',
      '「主人……放松一点。」'+n+'低声说，「今天，交给我。」',
      '你感受到他指尖传来的温热，心跳不知不觉乱了拍子。',
    ]; },
    reject_fn: function(n) { return [
      n+'的手悬在半空中，停顿了一瞬。',
      '「……不想吗？」他收回手，神情稍稍黯了下去。',
      '「好，那就算了。」他说，重新乖乖退回了原位——',
      '但那双眼睛，还是有些不甘心地望着你。',
    ]; },
  },
  {
    name: '亲吻', desc: '奴隶想要主动亲吻你，把今天所有没说出口的话都印在唇上。',
    accept_fn: function(n) { return [
      n+'低下头来，轻轻碰了碰你的嘴唇——',
      '是很浅的一个吻，却在那里停留了很久。',
      '「……」他没有说话，但呼吸明显急促了一些。',
      '随后，那个吻加深了。带着一点笨拙，却满是认真。',
    ]; },
    reject_fn: function(n) { return [
      n+'凑近了半分，又收了回去，睫毛低垂着。',
      '「……是我太冒失了。」',
      '他像是用这句话结束了什么，安静地退开，不再提这件事。',
    ]; },
  },
  {
    name: '压制', desc: '奴隶想要将你压在身下，主导今天剩下的时间。',
    accept_fn: function(n) { return [
      n+'将你轻轻压下去，两臂撑在你的两侧，俯视着你的表情。',
      '「今天，由我来。」他说，语气里有一种你很少听到的、笃定的什么。',
      '你没有反抗——某种程度上，这种时刻你也觉得……还不错。',
      '体力开始消耗，逆推正式进入。',
    ]; },
    reject_fn: function(n) { return [
      n+'动了动，然后被你一个眼神制止了。',
      '「……」他愣了一下，低下头，「好。听主人的。」',
      '他退了回去，乖乖坐在一旁——但眼尾微微红了，看起来多少有些委屈。',
    ]; },
  },
  {
    name: '口奉仕', desc: '奴隶想要用嘴唇和舌头侍奉你，给你不同的体验。',
    accept_fn: function(n) { return [
      n+'低下头，沿着你的颈侧落下一串轻吻，',
      '「让我用嘴……好好侍奉主人。」他的声音比平时低，带着点磁性。',
      '他的动作熟练而专注，每一处都像在寻找你的反应。',
      '「……主人的声音，好好听。」他轻声说，笑了。',
    ]; },
    reject_fn: function(n) { return [
      n+'抬头看了你一眼，看到你的表情，放弃了这个念头。',
      '「……不要吗？」他问，语气很平，',
      '「好。那我换个方式。」他没有坚持，只是默默想下一步。',
    ]; },
  },
  {
    name: '捆绑', desc: '奴隶想要用柔软的布带轻轻束缚你的手腕，让你体验"被控制"的感觉。',
    accept_fn: function(n) { return [
      n+'从某个地方取出了一段柔软的布带，',
      '「主人……」他抬眼看你，「可以吗？」',
      '在你点头后，他动作轻柔地将你的手腕交叠，系上了一个很松的结。',
      '「不会痛的，」他说，「只是……想让你感受一下，平时我的状态。」',
      '那双眼睛里，有什么像是温柔，又像是某种隐秘的报复欲。',
    ]; },
    reject_fn: function(n) { return [
      n+'拿着布带，对上你的表情，缓缓放下了。',
      '「……不行的话就算了。」他把布带搁在一边，「我只是想试试。」',
      '他笑了笑，那笑容里混着一点遗憾和一点释然。',
    ]; },
  },
  {
    name: '插入', desc: '奴隶想要反过来进入你，用这种方式感受与你最深的联结。',
    accept_fn: function(n) { return [
      n+'深吸一口气，手微微颤着，缓缓向前——',
      '「……主人。」他低声喊了你，声音里有什么要溢出来，',
      '进入的瞬间，他抵在你额头，闭上了眼睛。',
      '「好暖……」他说，「主人的里面……一直记得的。」',
      '体力大幅消耗，精力开始流失。',
    ]; },
    reject_fn: function(n) { return [
      n+'的动作停了下来，他没有强迫，只是静静看着你。',
      '「……好。」他说，退了回去，「是我太贪心了。」',
      '他坐在你身边，没有说更多，但沉默里有一种让人有点心疼的东西。',
    ]; },
  },
];

// ── 双方体力耗尽的结局剧情池 ─────────────────────────────────
var RT_EXHAUSTED_STORIES = [
  function(n) { return [
    '终于，两人都再也动不了了。',
    n+'脸红气喘地趴在你身上，「……主人，」他喘着气说，「我……累了。」',
    '「我也是。」你回答，声音也没什么力气。',
    '就这样，两人纠缠着沉沉睡去，谁也没再说什么。',
    '今天的逆推，就这样结束了。',
  ]; },
  function(n) { return [
    n+'最后挣扎着抬起头，看了你一眼，随后无力地倒下来。',
    '「……赢了吗？」他喃喃问，',
    '「平局。」你说。',
    '他闷闷地笑了，把头埋进你颈侧，没多久就沉进了梦里。',
    '这个结局……意外地还不错。',
  ]; },
  function(n) { return [
    '精力和体力同时告磬——',
    '你和'+n+'相互支撑着，谁也没有赢，谁也没有输。',
    '「……下次，」'+n+'气若游丝地说，「我会表现得更好的。」',
    '「下次再说。」你回答，拍了拍他的背。',
    '两人都累得说不出话，就这样休战了。',
  ]; },
];

// ── 主流程：打开逆推弹窗 ─────────────────────────────────────
var _rtState = {
  active: false,
  slaveName: '',
  playerStamina: 2000,
  playerStaminaMax: 2000,
  playerEnergy: 3000,
  playerEnergyMax: 3000,
  slaveStamina: 0,
  round: 0,
};

function openReverseTrainingModal() {
  var c = State.currentChar;
  if (!c) return;

  _rtState = {
    active: true,
    slaveName: c.name,
    playerStamina: parseFloat((typeof _playerProfile !== 'undefined' ? _playerProfile.stamina : 2000)) || 2000,
    playerStaminaMax: (typeof _playerProfile !== 'undefined' ? (_playerProfile.staminaMax || 2000) : 2000),
    playerEnergy: parseFloat((typeof _playerProfile !== 'undefined' ? _playerProfile.energy : 3000)) || 3000,
    playerEnergyMax: (typeof _playerProfile !== 'undefined' ? (_playerProfile.energyMax || 3000) : 3000),
    slaveStamina: c.stamina,
    round: 0,
  };

  var askFn = _getPersonalityAskFn(c);
  var askStory = askFn(c.name);

  var body = document.getElementById('rt-body');
  if (!body) return;

  body.innerHTML = _rtRenderAsk(c.name, askStory);
  openOv('ov-reverse-training');
}

function _rtRenderAsk(name, story) {
  return '<div class="rt-scene">' +
    story.map(function(p){ return '<p class="rt-p">'+esc(p)+'</p>'; }).join('') +
    '</div>' +
    '<div class="rt-btn-row" style="margin-top:18px">' +
      '<button class="btn btn-p rt-btn-accept" onclick="rtPlayerDecide(\'accept\')">💕 同意</button>' +
      '<button class="btn rt-btn-reject" onclick="rtPlayerDecide(\'reject\')">✋ 拒绝</button>' +
    '</div>';
}

function rtPlayerDecide(decision) {
  var c = State.currentChar;
  if (!c) return;

  if (decision === 'reject') {
    // 拒绝：显示拒绝剧情，结束
    var rejectStories = [
      ['「……这样啊。」'+c.name+'轻声说，垂下了眼睑。','片刻后，他重新抬起头，恢复了日常的神情。','「没关系，主人说不行就不行。」他说，坐回了原来的位置。','但那双手，悄悄握紧了一下。'],
      ['你拒绝了，'+c.name+'愣了一下，随即笑了笑。','「嗯，好。」他回答，没有抱怨，也没有追问。','只是之后很安静，那种安静里有点什么，说不清楚。'],
      ['「……不行吗。」他不是问句。',''+c.name+'低下头，把刚才那股蠢蠢欲动的劲儿压了回去。','「那就算了。」他说，语气出奇地平静，眼神却没那么平静。'],
    ];
    var st = rejectStories[Math.floor(Math.random() * rejectStories.length)];
    document.getElementById('rt-body').innerHTML =
      '<div class="rt-scene">' + st.map(function(p){ return '<p class="rt-p">'+esc(p)+'</p>'; }).join('') + '</div>' +
      '<button class="btn btn-full" style="margin-top:14px" onclick="closeOv(\'ov-reverse-training\')">结束</button>';
    if(typeof pushStoryLog==='function') pushStoryLog('daily',{title:'逆推·被拒',date:getDateStr(),char:c.name,story:st});
    return;
  }

  // 同意：进入逆推主界面
  _rtState.round = 0;
  _rtRenderMainPhase();
}

function _rtRenderMainPhase() {
  var c = State.currentChar;
  if (!c) return;

  // 检测体力耗尽
  if (_rtState.playerStamina <= 10 || _rtState.slaveStamina <= 100) {
    _rtEnding();
    return;
  }

  _rtState.round++;
  // 随机选3个不同指令
  var pool = RT_SLAVE_REQUESTS.slice();
  var chosen = [];
  while (chosen.length < 3 && pool.length > 0) {
    var idx = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }

  var body = document.getElementById('rt-body');
  if (!body) return;

  var psHtml = _rtStatusBar('主人', _rtState.playerStamina, _rtState.playerStaminaMax || 2000, '#e57373', '#ef9a9a');
  var ssHtml = _rtStatusBar(c.name, _rtState.slaveStamina, getMaxStamina(c), '#4db6ac', '#80cbc4');

  var cmdsHtml = chosen.map(function(req, i) {
    return '<div class="rt-cmd-card">' +
      '<div class="rt-cmd-name">'+esc(req.name)+'</div>' +
      '<div class="rt-cmd-desc">'+esc(req.desc)+'</div>' +
      '<div class="rt-cmd-btns">' +
        '<button class="btn btn-p rt-accept-btn" onclick="rtExecuteCmd('+i+', \'accept\')">✅ 接受</button>' +
        '<button class="btn rt-reject-btn" onclick="rtExecuteCmd('+i+', \'reject\')">❌ 拒绝</button>' +
      '</div>' +
    '</div>';
  }).join('');

  body.innerHTML =
    '<div class="rt-status-bars">' + psHtml + ssHtml + '</div>' +
    '<div class="rt-round-label">第 '+_rtState.round+' 回合 · '+esc(c.name)+'想要……</div>' +
    '<div class="rt-cmds">' + cmdsHtml + '</div>' +
    '<div style="margin-top:12px;text-align:center"><button class="btn btn-ghost" style="font-size:.75rem;color:#e57373;border-color:rgba(229,115,115,.3)" onclick="rtTryEscape()">🏃 尝试结束逆推</button></div>';

  // 存下当前指令供执行时使用
  body._rtCurrentCmds = chosen;
}

function rtExecuteCmd(cmdIndex, decision) {
  var body = document.getElementById('rt-body');
  var c = State.currentChar;
  if (!body || !c) return;

  var cmds = body._rtCurrentCmds || [];
  var cmd = cmds[cmdIndex];
  if (!cmd) return;

  var story;
  if (decision === 'accept') {
    story = cmd.accept_fn(c.name);
    // 消耗双方体力
    _rtState.playerStamina = Math.max(0, _rtState.playerStamina - (15 + Math.floor(Math.random() * 10)));
    _rtState.slaveStamina  = Math.max(0, _rtState.slaveStamina  - (30 + Math.floor(Math.random() * 20)));
    // 增加奴隶欲望好感
    if (State.currentChar) {
      State.currentChar.lust      = typeof clampStat==='function' ? clampStat(c,'lust',     (c.lust      ||0)+5) : Math.min(100,(c.lust      ||0)+5);
      State.currentChar.affection = typeof clampStat==='function' ? clampStat(c,'affection',(c.affection ||0)+3) : Math.min(100,(c.affection ||0)+3);
    }
  } else {
    story = cmd.reject_fn(c.name);
    // 拒绝：奴隶会尝试下一个（体力小幅消耗）
    _rtState.playerStamina = Math.max(0, _rtState.playerStamina - 5);
    _rtState.slaveStamina  = Math.max(0, _rtState.slaveStamina  - 15);
  }

  if(typeof pushStoryLog==='function') pushStoryLog('daily',{title:'逆推·'+cmd.name,date:getDateStr(),char:c.name,story:story});

  // 显示执行剧情，然后进入下一回合
  body.innerHTML =
    '<div class="rt-scene">' + story.map(function(p){ return '<p class="rt-p">'+esc(p)+'</p>'; }).join('') + '</div>' +
    '<button class="btn btn-p btn-full rt-next-btn" style="margin-top:16px" onclick="_rtRenderMainPhase()">继续 →</button>';
}

function _rtEnding() {
  var c = State.currentChar;
  var fn = RT_EXHAUSTED_STORIES[Math.floor(Math.random() * RT_EXHAUSTED_STORIES.length)];
  var story = fn(c ? c.name : '她');

  if(typeof pushStoryLog==='function') pushStoryLog('daily',{title:'逆推结束',date:getDateStr(),char:c?c.name:'',story:story});
  // 同步体力到存档
  if(State.currentChar) {
    State.currentChar.stamina = _rtState.slaveStamina;
    ['stamina','energy','lust','obedience','affection'].forEach(function(k){
      if(typeof setStat==='function') setStat(k, State.currentChar[k]);
    });
    if(typeof writeSave==='function') writeSave();
  }
  // 同步主人体力到profile
  if(typeof _playerProfile!=='undefined'){
    _playerProfile.stamina=Math.max(0,_rtState.playerStamina);
    _playerProfile.energy=Math.max(0,_rtState.playerEnergy);
    localStorage.setItem('era_profile',JSON.stringify(_playerProfile));
    if(typeof renderPlayerCard==='function')renderPlayerCard();
  }

  var body = document.getElementById('rt-body');
  if (!body) return;
  body.innerHTML =
    '<div class="rt-scene rt-ending">' + story.map(function(p){ return '<p class="rt-p">'+esc(p)+'</p>'; }).join('') + '</div>' +
    '<button class="btn btn-full" style="margin-top:16px" onclick="closeOv(\'ov-reverse-training\')">结束逆推</button>';
}

function _rtStatusBar(label, val, max, fillColor, trackColor) {
  var pct = max > 0 ? Math.min(100, Math.round(val/max*100)) : 0;
  return '<div class="rt-stat-row">'+
    '<span class="rt-stat-label">'+esc(label)+'</span>'+
    '<div class="rt-stat-track">'+
      '<div class="rt-stat-fill" style="width:'+pct+'%;background:'+fillColor+'"></div>'+
      '<span class="rt-stat-val">'+Math.round(val)+'/'+max+'</span>'+
    '</div>'+
  '</div>';
}

// ── 尝试结束逆推 ──
function rtTryEscape() {
  var c = State.currentChar; if(!c)return;
  var body = document.getElementById('rt-body'); if(!body)return;
  var playerPower = _rtState.playerStamina;
  var slavePower = Math.round(_rtState.slaveStamina / 20);
  // 体力比奴隶高则可以挣脱
  if (playerPower > slavePower) {
    var story = [
      '你猛地发力，将'+esc(c.name)+'推开！',
      '「等、等一下主人……！」'+esc(c.name)+'一脸不甘。',
      '但你已经挣脱了束缚。虽然体力消耗不少，但总算保住了尊严。',
      '……大概吧。'
    ];
    _rtState.playerStamina = Math.max(0, _rtState.playerStamina - 20);
    if(typeof pushStoryLog==='function') pushStoryLog('daily',{title:'逆推·成功挣脱',date:typeof getDateStr==='function'?getDateStr():'',char:c.name,story:story});
    if(State.currentChar){State.currentChar.stamina=_rtState.slaveStamina;if(typeof writeSave==='function')writeSave();}
    body.innerHTML='<div class="rt-scene rt-ending">'+story.map(function(p){return '<p class="rt-p">'+esc(p)+'</p>';}).join('')+'</div><button class="btn btn-full" style="margin-top:16px" onclick="closeOv(\'ov-reverse-training\')">结束</button>';
  } else {
    // 挣脱失败！被继续逆推，额外扣体力
    var failDmg = 10 + Math.floor(Math.random() * 10);
    _rtState.playerStamina = Math.max(0, _rtState.playerStamina - failDmg);
    var failStory = [
      '你试图推开'+esc(c.name)+'，但她的力气比你想象的大得多！',
      '「想跑？没门哦~♡」'+esc(c.name)+'反而压得更紧了。',
      '挣扎消耗了你 '+failDmg+' 点体力，而'+esc(c.name)+'看起来更加兴奋了。'
    ];
    body.innerHTML='<div class="rt-scene">'+failStory.map(function(p){return '<p class="rt-p">'+esc(p)+'</p>';}).join('')+'</div><button class="btn btn-p btn-full" style="margin-top:16px" onclick="_rtRenderMainPhase()">被迫继续……</button>';
    // 检查是否被做晕
    if(_rtState.playerStamina <= 5) {
      var koStory=['你的体力已经完全耗尽了……',esc(c.name)+'满意地笑了。','「主人倒下了呢~ 那接下来……就由我自由发挥吧♡」','你的意识开始模糊……之后发生了什么，已经记不清了。'];
      if(typeof pushStoryLog==='function')pushStoryLog('daily',{title:'逆推·被做晕',date:typeof getDateStr==='function'?getDateStr():'',char:c.name,story:koStory});
      if(State.currentChar){State.currentChar.lust=typeof clampStat==='function'?clampStat(c,'lust',(c.lust||0)+15):Math.min(100,(c.lust||0)+15);State.currentChar.stamina=_rtState.slaveStamina;if(typeof writeSave==='function')writeSave();}
      body.innerHTML='<div class="rt-scene rt-ending">'+koStory.map(function(p){return '<p class="rt-p" style="color:#e57373">'+esc(p)+'</p>';}).join('')+'</div><button class="btn btn-full" style="margin-top:16px" onclick="closeOv(\'ov-reverse-training\')">……醒来</button>';
    }
  }
}
