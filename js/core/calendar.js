// ================================================================
// js/core/calendar.js — 日历系统 + 节日 + 庄园晨昏事件
// ================================================================

// ── 节日数据 ──────────────────────────────────────────────────
var FESTIVALS = [
  {month:1,day:1,  name:'新年',        icon:'🎆',story:['新年的第一天，空气中充满着崭新的气息。','也许该给庄园里的奴隶们准备一些小礼物？','一年之计在于春，今年的调教计划，也该好好规划了。']},
  {month:1,day:15, name:'灯笼节',      icon:'🏮',story:['夜空中绽放着无数灯笼的光芒。','你带着奴隶们一起观赏花灯，气氛罕见地和谐。','「……好漂亮。」有人低声呢喃。这样的夜晚，让人忘记了日常的一切。']},
  {month:2,day:14, name:'恋人节',      icon:'💝',story:['空气中弥漫着甜腻的气息，到处都是成双成对的身影。','庄园里的奴隶们也有些躁动不安。','也许今天应该安排一场约会？或者……做点别的什么？']},
  {month:3,day:3,  name:'女儿节',      icon:'🎎',story:['今天是女儿节，庄园里的女性奴隶们似乎格外精神。','有人偷偷摆上了雏人形，虽然身份特殊，但这份对美好事物的向往不曾改变。','女性奴隶好感+5。']},
  {month:5,day:5,  name:'端午节',      icon:'🐉',story:['粽叶的清香飘散在空气中。','你让奴隶们一起包粽子——场面一度非常混乱，但也非常快乐。','「主人，您的手法……需要练习。」有人一脸认真地说。']},
  {month:6,day:21, name:'夏至',        icon:'☀️',story:['一年中白昼最长的一天。','炎热让所有人都变得慵懒，空调房里的氛围有些微妙。','也许是温度的关系，今天的调教效果格外显著。']},
  {month:7,day:7,  name:'七夕',        icon:'🌌',story:['传说中牛郎织女相会的夜晚。','你在庄园的天台上设了一桌酒菜，邀请奴隶们一起赏星。','「主人……您相信这种故事吗？」有人在黑暗中问。','你没有回答。但夜风里，手指不知何时交织在了一起。']},
  {month:8,day:15, name:'中秋',        icon:'🌕',story:['满月高悬，月饼的甜香混着桂花的清香。','你和奴隶们围坐在一起赏月，气氛比平时温馨了许多。','「月亮好圆啊……」「……嗯。」','短暂的宁静。这种时刻，谁也不愿意先打破。']},
  {month:10,day:31,name:'万圣夜',      icon:'🎃',story:['庄园被装点得诡异又可爱，南瓜灯随处可见。','有几位奴隶认真地准备了cosplay，效果出乎意料地好。','「Trick or treat！」有人举着糖果篮子堵在你面前。','……好吧，今天可以放松一下。']},
  {month:12,day:24,name:'平安夜',      icon:'🎄',story:['窗外飘着雪，壁炉里燃着暖融融的火。','你悄悄准备了一些小礼物，放在每个人的枕边。','圣诞树上的星星在闪烁，像是在守护着这一屋子复杂的关系。','今夜无人不安，今夜万事皆可原谅。']},
  {month:12,day:31,name:'除夕夜',      icon:'🎇',story:['旧的一年即将过去，新的篇章将要翻开。','倒计时的钟声里，你回顾了这一年的得与失。','身边的人，有些留下了，有些离开了，有些……变得不同了。','但无论如何，故事还在继续。']},
];

// ── 日历弹窗（可翻月份）──────────────────────────────────────
var _calViewMonth = 0; // 当前查看的月份(0-11)
function openCalendar(){
  var body=document.getElementById('calendar-body');if(!body)return;
  var curDay=State.day||1;
  var di=(typeof _dayToMD==='function')?_dayToMD(curDay):{month:1,day:1};
  _calViewMonth=di.month-1;
  _renderCalendar(body,di);
  openOv('ov-calendar');
}
function _renderCalendar(body,curDI){
  var monthNames=['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
  var monthDays=[31,28,31,30,31,30,31,31,30,31,30,31];
  var mo=_calViewMonth;var daysInMonth=monthDays[mo];
  var curDay=State.day||1;var curDI2=(typeof _dayToMD==='function')?_dayToMD(curDay):{month:1,day:1};
  var isCurrentMonth=(mo===curDI2.month-1);
  // 获取奴隶生日
  var birthdays=_getSlaveBirthdays();

  var html='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">';
  html+='<button class="btn btn-ghost btn-sm" onclick="_calPrev()" style="font-size:1rem;padding:4px 10px">‹</button>';
  html+='<div style="text-align:center"><div style="font-size:1.1rem;font-weight:800;color:var(--txt)">'+monthNames[mo]+'</div>';
  if(isCurrentMonth)html+='<div style="font-size:.62rem;color:var(--acc2)">当前：'+curDI2.day+'日</div>';
  html+='</div>';
  html+='<button class="btn btn-ghost btn-sm" onclick="_calNext()" style="font-size:1rem;padding:4px 10px">›</button>';
  html+='</div>';

  // 日历网格
  html+='<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:12px;text-align:center">';
  ['日','一','二','三','四','五','六'].forEach(function(w){html+='<div style="font-size:.6rem;color:var(--muted);font-weight:600;padding:3px 0">'+w+'</div>';});
  var offset=(mo*3+1)%7;
  for(var o=0;o<offset;o++)html+='<div></div>';
  for(var d=1;d<=daysInMonth;d++){
    var isToday=isCurrentMonth&&d===curDI2.day;
    var festival=FESTIVALS.find(function(f){return f.month===mo+1&&f.day===d;});
    var bday=birthdays.filter(function(b){return b.month===mo+1&&b.day===d;});
    var hasMark=festival||bday.length;
    var bg=isToday?'var(--acc)':(hasMark?'rgba(240,192,80,.12)':'transparent');
    var color=isToday?'#fff':(festival?'#f0c050':'var(--txt2)');
    var border=bday.length?'1px solid #f06292':'1px solid transparent';
    html+='<div style="padding:3px 0;border-radius:6px;background:'+bg+';color:'+color+';font-size:.75rem;font-weight:'+(isToday?'800':'400')+';border:'+border+';cursor:pointer;min-height:32px;display:flex;flex-direction:column;align-items:center;justify-content:center" onclick="_calDayClick('+(mo+1)+','+d+')">';
    html+=d;
    if(festival)html+='<div style="font-size:.5rem;line-height:1">'+festival.icon+'</div>';
    else if(bday.length)html+='<div style="font-size:.5rem;line-height:1">🎂</div>';
    html+='</div>';
  }
  html+='</div>';

  // 本月节日
  var mFest=FESTIVALS.filter(function(f){return f.month===mo+1;});
  if(mFest.length){
    html+='<div style="font-size:.78rem;font-weight:700;color:var(--txt);margin-bottom:6px">📌 本月节日</div>';
    mFest.forEach(function(f){
      var left=isCurrentMonth?f.day-curDI2.day:-1;
      var st=left===0?'🔴 今天！':(left>0?'还有'+left+'天':'');
      html+='<div style="background:var(--card);border:1px solid var(--bdr2);border-radius:8px;padding:8px 12px;margin-bottom:5px;display:flex;align-items:center;gap:8px;cursor:pointer" onclick="_calDayClick('+(mo+1)+','+f.day+')">';
      html+='<span style="font-size:1.2rem">'+f.icon+'</span><div style="flex:1"><div style="font-weight:700;font-size:.78rem;color:var(--txt)">'+f.name+'</div></div>';
      if(st)html+='<span style="font-size:.68rem;color:'+(left===0?'#e53935':'var(--muted)')+'">'+st+'</span>';
      html+='</div>';
    });
  }
  // 本月生日
  var mBday=birthdays.filter(function(b){return b.month===mo+1;});
  if(mBday.length){
    html+='<div style="font-size:.78rem;font-weight:700;color:var(--txt);margin:8px 0 6px">🎂 本月生日</div>';
    mBday.forEach(function(b){
      html+='<div style="background:var(--card);border:1px solid #f06292;border-radius:8px;padding:8px 12px;margin-bottom:5px;display:flex;align-items:center;gap:8px">';
      html+='<span style="font-size:1rem">🎂</span><div style="flex:1"><div style="font-size:.78rem;font-weight:700;color:var(--txt)">'+esc(b.name)+'</div><div style="font-size:.62rem;color:var(--muted)">'+(mo+1)+'月'+b.day+'日</div></div></div>';
    });
  }
  html+='<button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-calendar\')" style="margin-top:10px">关闭</button>';
  body.innerHTML=html;
}
function _calPrev(){_calViewMonth=(_calViewMonth+11)%12;_renderCalendar(document.getElementById('calendar-body'));}
function _calNext(){_calViewMonth=(_calViewMonth+1)%12;_renderCalendar(document.getElementById('calendar-body'));}

// ── 日期点击事件 ──
var _calCuteTips=['今天天气不错呢~ ☀️','要对奴隶们温柔一点哦 🌸','主人今天心情怎么样？😊','庄园的花好像开了 🌺','有空的话去约个会吧~ 💕','今天想吃什么呢？🍰','好好休息也很重要哦 💤','主人加油！✨'];
function _calDayClick(month,day){
  var festival=FESTIVALS.find(function(f){return f.month===month&&f.day===day;});
  var birthdays=_getSlaveBirthdays().filter(function(b){return b.month===month&&b.day===day;});
  if(festival){
    var html='<div style="text-align:center;padding:10px 0"><div style="font-size:2.5rem;margin-bottom:8px">'+festival.icon+'</div>';
    html+='<div style="font-weight:800;font-size:1.1rem;color:var(--txt);margin-bottom:10px">'+festival.name+'</div>';
    html+='<div style="font-size:.82rem;color:var(--txt2);line-height:1.8;text-align:left;padding:0 8px">';
    festival.story.forEach(function(l){html+='<p style="margin-bottom:6px">'+esc(l)+'</p>';});
    html+='</div></div>';
    openCustomConfirm(festival.icon+' '+festival.name,html,'知道啦~',function(){});
    return;
  }
  if(birthdays.length){
    var b=birthdays[0];
    var html2='<div style="text-align:center;padding:10px 0"><div style="font-size:2.5rem;margin-bottom:8px">🎂🎉</div>';
    html2+='<div style="font-weight:800;font-size:1rem;color:var(--txt);margin-bottom:10px">'+esc(b.name)+'的生日！</div>';
    html2+='<div style="font-size:.82rem;color:var(--txt2);line-height:1.8">今天是'+esc(b.name)+'的生日呢~<br>要不要准备个小礼物呢？🎁<br>给她一个特别的惊喜吧！</div></div>';
    openCustomConfirm('🎂 '+b.name+'的生日',html2,'好的！',function(){});
    return;
  }
  // 普通日期 → 偶尔弹出可爱提示
  if(Math.random()<0.4){
    var tip=_calCuteTips[Math.floor(Math.random()*_calCuteTips.length)];
    toast(tip,'ai');
  }
}

// ── 获取奴隶生日列表 ──
function _getSlaveBirthdays(){
  var result=[];
  if(typeof CHARS_DATA==='undefined')return result;
  CHARS_DATA.forEach(function(c){
    var sv=loadSave(c.id);if(!sv||!sv.char)return;
    var bday=sv.charProfile&&sv.charProfile.birthday;
    if(!bday){
      // 默认：购入日就是生日
      var purchaseDay=sv.char._purchaseDay||sv.day||1;
      var di=(typeof _dayToMD==='function')?_dayToMD(purchaseDay):{month:1,day:1};
      result.push({name:c.name,month:di.month,day:di.day,id:c.id});
    }else{
      result.push({name:c.name,month:bday.month,day:bday.day,id:c.id});
    }
  });
  return result;
}

function triggerFestival(name){
  var f=FESTIVALS.find(function(ff){return ff.name===name;});
  if(!f||!f.story)return;
  closeOv('ov-calendar');
  // 节日效果：全体好感+3
  var allChars=(typeof CHARS_DATA!=='undefined')?CHARS_DATA.filter(function(c){return loadSave(c.id)&&loadSave(c.id).char;}):[];
  allChars.forEach(function(c){var sv=loadSave(c.id);if(sv&&sv.char){sv.char.affection=Math.min(100,(sv.char.affection||0)+3);localStorage.setItem('era_sv_'+c.id,JSON.stringify(sv));}});
  if(typeof pushStoryLog==='function')pushStoryLog('daily',{title:'节日·'+f.name,date:typeof getDateStr==='function'?getDateStr():'',story:f.story});
  if(typeof openStoryModal==='function')setTimeout(function(){openStoryModal({title:f.icon+' '+f.name,story:f.story,cat:'event'},'节日',{affection:3});},100);
}

// ── 节日预警（consumeTime调用）──
function checkFestivalWarning(){
  var di=(typeof _dayToMD==='function')?_dayToMD(State.day||1):{month:1,day:1};
  var monthDays=[31,28,31,30,31,30,31,31,30,31,30,31];
  FESTIVALS.forEach(function(f){
    var fDay=0;for(var m=0;m<f.month-1;m++)fDay+=monthDays[m];fDay+=f.day;
    var today=0;for(var m2=0;m2<di.month-1;m2++)today+=monthDays[m2];today+=di.day;
    if(fDay-today===3)toast(f.icon+' '+f.name+'还有3天到来！做好准备吧','ai');
    if(fDay===today){toast(f.icon+' 今天是'+f.name+'！点击日历查看详情','ai');}
  });
}

// ── 庄园晨昏事件 ──────────────────────────────────────────────
var MANOR_MORNING_EVENTS=[
  {title:'清晨的问候',story:function(names){return['清晨的阳光透过窗帘洒进走廊。','你推开门，发现'+names[0]+'已经在厨房里忙碌了。','「……早上好，主人。」'+(names.length>1?names[1]+'还在沙发上打盹，口水流了一小滩。':''),'又是庄园里平凡而安宁的一天。'];}},
  {title:'早餐骚动',story:function(names){return['你被厨房传来的碰撞声吵醒了。','赶过去一看——'+names[0]+'手忙脚乱地在做早餐，旁边的锅已经冒烟了。','「我、我在做早餐！不是在搞破坏！」','……结果还是叫了外卖。'];}},
  {title:'安静的早晨',story:function(names){return['庄园里静悄悄的，只有鸟叫声和远处的风铃。','走过走廊的时候，你瞥见'+names[0]+'的房间门半开着，'+(names[0])+'还蜷在被子里。','那张睡颜意外地安详，和平时的样子判若两人。','你轻轻带上了门。'];}},
];
var MANOR_EVENING_EVENTS=[
  {title:'夜间巡视',story:function(names){return['深夜，你习惯性地巡视庄园。','经过'+names[0]+'的房间时，里面传来细微的声响。','你驻足片刻——大概只是翻个身。大概。','继续走。月光把你的影子拉得很长。'];}},
  {title:'失眠的夜',story:function(names){return['睡不着。你在走廊里来回踱步。','转角处，遇见了同样睡不着的'+names[0]+'。','两人对视了一下，都有点尴尬。','「……喝杯茶？」你问。',''+names[0]+'点了点头。','就这样，两人在沉默中分享了一壶茶。'];}},
  {title:'梦中呢喃',story:function(names){return['夜深人静。','你路过'+names[0]+'的门口，听见模糊的梦话。','「……不要走……」声音很轻，带着一丝不安。','你站了一会儿，最终什么都没做就离开了。','有些话，说给梦听就好。'];}},
];

function checkManorEvent(){
  var allChars=(typeof CHARS_DATA!=='undefined')?CHARS_DATA.filter(function(c){return loadSave(c.id)&&loadSave(c.id).char;}):[];
  if(!allChars.length)return;
  var manorProb=(typeof getEventProb==='function')?getEventProb('manor'):0.25;
  if(Math.random()>manorProb)return;
  var names=allChars.map(function(c){var sv=loadSave(c.id);return sv&&sv.char?sv.char.name:c.name;});
  // 随机打乱
  for(var i=names.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=names[i];names[i]=names[j];names[j]=t;}
  var hour=new Date().getHours();
  var pool=(hour>=6&&hour<18)?MANOR_MORNING_EVENTS:MANOR_EVENING_EVENTS;
  var ev=pool[Math.floor(Math.random()*pool.length)];
  var story=ev.story(names);
  if(typeof pushStoryLog==='function')pushStoryLog('daily',{title:ev.title,date:typeof getDateStr==='function'?getDateStr():'',story:story});
  if(typeof openStoryModal==='function')setTimeout(function(){openStoryModal({title:(hour>=6&&hour<18?'🌅 ':'🌙 ')+ev.title,story:story,cat:'event'},'庄园日常',{});},200);
}
