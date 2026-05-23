// ================================================================
// js/core/calendar.js — 日历系统 + 节日 + 庄园晨昏事件
// ================================================================

// ── 节日数据 ──────────────────────────────────────────────────
var FESTIVALS = [
  // ── 法定节假日 ──
  {month:1,day:1,  name:'元旦',        icon:'🎆',story:['新年的第一天，空气中充满着崭新的气息。','庄园上下难得的轻松氛围。你站在窗前，看着外面的世界。','「主人，新年快乐。」有人轻声说道。','你微微点头，心想今年的调教计划，也该好好规划了。']},
  {month:1,day:29, name:'春节',        icon:'🧨',story:['爆竹声中一岁除，春风送暖入屠苏。','庄园的大门贴上了春联，挂上了红灯笼。你给每个奴隶发了红包。','「谢谢主人！」众人齐声说道，脸上带着难得的真心笑容。','年夜饭很丰盛，觥筹交错间，身份的界限似乎模糊了一些。','……只是一些。明天，一切照旧。']},
  {month:4,day:4,  name:'清明节',      icon:'🌿',story:['细雨纷飞的清明时节，万物复苏。','你带着奴隶们去踏青，远离了庄园那压抑的围墙。','青山绿水之间，有人的眼神变得柔和了许多。','「主人……今天可以不叫您主人吗？」','你沉默了一会儿，然后笑了笑：「……只限今天。」']},
  {month:5,day:1,  name:'劳动节',      icon:'💪',story:['今天是劳动节。你宣布庄园放假一天。','奴隶们面面相觑——放假？什么意思？','「就是今天不用训练，想做什么做什么。」你说。','结果到了下午，所有人又不自觉地聚到了训练室。','「习惯了嘛……」有人不好意思地笑了笑。']},
  {month:6,day:2,  name:'端午节',      icon:'🐉',story:['粽叶的清香飘散在空气中。','你让奴隶们一起包粽子——场面一度非常混乱，但也非常快乐。','「主人，您的手法……需要练习。」有人一脸认真地说。','你包出的粽子歪歪扭扭，但大家都争着说好吃。','也许这就是端午的意义——不在粽子本身，而在一起动手的时光。']},
  {month:9,day:17, name:'中秋节',      icon:'🌕',story:['满月高悬，月饼的甜香混着桂花的清香。','你和奴隶们围坐在一起赏月，气氛比平时温馨了许多。','「月亮好圆啊……」「……嗯。」','短暂的宁静。这种时刻，谁也不愿意先打破。','你切开一块月饼，分给了身边的人。','不知道为什么，这个中秋夜显得格外漫长。']},
  {month:10,day:1, name:'国庆节',      icon:'🇨🇳',story:['庄园上空升起了一面小小的国旗。','你宣布放假三天——当然，基本训练还是要做的。','难得的假期里，奴隶们自发组织了一场小型运动会。','拔河、接力跑、套圈……笑声在庄园中回荡。','你坐在台阶上看着这一切，嘴角不自觉地扬起。']},
  // ── 传统节日 ──
  {month:2,day:12, name:'元宵节',      icon:'🏮',story:['夜空中绽放着无数灯笼的光芒。','你带着奴隶们一起猜灯谜，赏花灯。','「主人出的灯谜太难了！」有人抱怨道。','「那是你们太笨了。」你笑着说，又递过去一碗汤圆。','甜糯的汤圆入口，空气中弥漫着温暖的气息。']},
  {month:3,day:3,  name:'龙抬头',      icon:'🐲',story:['二月二，龙抬头。民间说这天理发会带来好运。','你把奴隶们排成一排，给每人修剪了头发。','「主人的手艺……出乎意料地好。」','「你以为我只会调教吗？」你挑了挑眉。','修剪完毕后，庄园里焕然一新。新的开始，从头开始。']},
  {month:8,day:10, name:'七夕节',      icon:'🌌',story:['传说中牛郎织女相会的夜晚。','你在庄园的天台上设了一桌酒菜，邀请奴隶们一起赏星。','「主人……您相信这种故事吗？」有人在黑暗中问。','你没有回答。但夜风里，手指不知何时交织在了一起。','银河横亘在头顶，无声地见证着这一刻。']},
  {month:8,day:22, name:'中元节',      icon:'👻',story:['中元节，传说鬼门大开。庄园里的气氛有些诡异。','你点了一盏长明灯，放在庄园门口。','深夜，有人敲你的房门。「主人……我害怕。」','你叹了口气，打开门让她进来。','「只是迷信而已。」你说。但今晚，你也没有关灯睡觉。']},
  {month:10,day:11,name:'重阳节',      icon:'🏔️',story:['九九重阳，登高望远。','你带着奴隶们爬上了附近最高的山丘。','站在山顶，风很大，视野开阔得令人心旷神怡。','「主人，从这里看，庄园好小啊。」','「是啊……」你望着远方，若有所思。','也许偶尔跳出那个圈子来看看，心境会不同。']},
  {month:12,day:21,name:'冬至',        icon:'🥟',story:['冬至大如年。你亲自下厨，和奴隶们一起包饺子。','北方吃饺子，南方吃汤圆——于是你两样都做了。','「主人居然会做饭？！」震惊的表情此起彼伏。','「别小看我。」你淡淡地说，把一盘热腾腾的饺子端上桌。','这是一年中最长的夜晚，但有人陪伴，就不算太冷。']},
  {month:1,day:18, name:'腊八节',      icon:'🥣',story:['腊八粥的香气弥漫在整个庄园。','你一大早就起来熬粥，各种豆子和干果在锅里翻滚。','「主人起得比我们还早……」奴隶们面面相觑。','每人一碗热粥下肚，身体暖了，心也暖了。','有人偷偷在你碗里多加了一勺红糖，装作什么都没做的样子。']},
  {month:1,day:23, name:'小年',        icon:'🧹',story:['小年到了，该打扫庄园迎新春了。','你分配了清扫任务，自己也挽起袖子干了起来。','「主人也一起打扫吗？」','「庄园是大家的，当然一起。」你说。','忙碌了一整天，窗明几净的庄园让所有人都松了口气。','灶王爷前的糖瓜闪着光泽，甜蜜的新年就在前方。']},
  {month:1,day:28, name:'除夕',        icon:'🎇',story:['旧的一年即将过去，新的篇章将要翻开。','庄园里张灯结彩，年夜饭摆满了一桌。','倒计时的钟声里，你回顾了这一年的得与失。','身边的人，有些留下了，有些离开了，有些……变得不同了。','零点的烟花绽放在夜空，所有人齐声欢呼。','但无论如何，故事还在继续。新年快乐。']},
  // ── 纪念节日 ──
  {month:3,day:8,  name:'妇女节',      icon:'👩',story:['今天是国际妇女节。你给庄园里的女性奴隶们准备了鲜花和礼物。','「主人，这是……？」她们有些意外。','「今天你们是主角。」你微笑着说。','女性奴隶们的脸上浮现出复杂的表情——感动、困惑，还有一丝说不清的情绪。','你给了她们半天假。有人用这半天读了书，有人去了花园，有人只是安静地坐着。','或许自由最珍贵的，不是时间的长短，而是选择的权利。','女性奴隶好感+10。']},
  {month:5,day:4,  name:'青年节',      icon:'✊',story:['五四青年节。你在庄园里组织了一场辩论赛。','题目是：「服从与自由，哪个更重要？」','奴隶们的发言出乎意料地精彩。你坐在评委席上，陷入了沉思。','也许答案并不重要。重要的是，他们还保有独立思考的能力。','「主人，您怎么想？」','你站起来说：「两者都很重要。但对你们来说，先学会服从。」','笑声中，辩论赛结束了。但那些闪光的思想，已经留在了每个人心里。']},
  {month:6,day:1,  name:'儿童节',      icon:'🧸',story:['儿童节——虽然庄园里没有孩子，但你还是买了一堆玩具和零食。','「我们又不是小孩子了……」嘴上这么说，手却已经伸向了糖果罐。','你坐在一旁看着奴隶们争抢零食的样子，嘴角不自觉地上扬。','谁规定大人就不能过儿童节了呢？','今天，所有人的心情都像孩子一样轻松。全体好感+3。']},
  {month:8,day:1,  name:'建军节',      icon:'⭐',story:['八一建军节。你决定在庄园里来一次「军训」。','「全体起立！立正！稍息！」你一脸严肃地下达指令。','奴隶们站得东倒西歪，你忍住了想笑的冲动。','经过一上午的训练，队列勉强整齐了一些。','「报告主人，我的腿站麻了……」','「继续站！这是意志力的训练！」','……虽然最后你也一起坐在了地上。全体服从+2。']},
  {month:9,day:10, name:'教师节',      icon:'📚',story:['教师节到了。虽然你不是老师，但在某种意义上，你一直在「教导」他们。','出乎意料的是，奴隶们悄悄准备了一个小仪式。','「主人……虽然您的教学方式很特别，但我们还是……嗯……」','「还是什么？」你问。','「还是学到了很多。」有人红着脸说完，递过来一张手写的贺卡。','你接过贺卡，上面写着歪歪扭扭的字：「感谢主人的调教。」','……这大概是你收到过的最特别的教师节礼物了。']},
  // ── 少数民族节日 ──
  {month:4,day:13, name:'泼水节',      icon:'💦',story:['傣族泼水节！你在庄园里摆了几盆水，宣布今天可以尽情泼水。','一开始大家还很矜持，后来局面完全失控。','你被三个奴隶联手泼了一身，湿透了。','「你们……」你擦了把脸上的水，露出了一个危险的笑容。','接下来是一场激烈的水战。所有人都笑得合不拢嘴。','衣服湿了，但心情前所未有地畅快。全体心情+10。']},
  {month:7,day:15, name:'那达慕',      icon:'🐎',story:['蒙古族那达慕大会——虽然庄园没有草原，但你搞了个迷你版。','摔跤、射箭、赛跑，样样俱全。','奴隶们展现出了意想不到的竞技精神。','最后的冠军居然是平时最安静的那位。','「人不可貌相啊……」你感叹道。','她举着奖杯，脸上露出了你从未见过的骄傲表情。全体体力-10。']},
  {month:7,day:28, name:'火把节',      icon:'🔥',story:['彝族火把节之夜，庄园的庭院里燃起了篝火。','火光映照着每个人的脸庞，跳跃的火焰让影子在墙上舞蹈。','有人开始唱歌，歌声在夜风中飘荡。','你也被拉进了圈子里，围着篝火跳起了笨拙的舞步。','「主人跳舞的样子……很可爱。」','「闭嘴。」你说，但并没有停下脚步。','今晚的篝火很暖，暖到让人想流泪。']},
  {month:4,day:10, name:'开斋节',      icon:'🌙',story:['开斋节到来，你尊重庄园中每个人的信仰。','特意准备了清真餐食，还放了一天假。','「主人……谢谢您的理解。」有信仰的奴隶低声道谢。','你摇摇头：「信仰是个人的事。我尊重每一种选择。」','晚上，你和大家一起分享了节日的甜点。','不同的信仰，相同的甜蜜。']},
  {month:6,day:17, name:'古尔邦节',    icon:'🐑',story:['古尔邦节——宰牲节。你安排了一顿丰盛的羊肉大餐。','整只烤羊的香气弥漫在庄园里，所有人都食指大动。','「主人，您的手艺……？」','「这个是外卖。」你坦然地说。','哄堂大笑中，大家围坐在一起大快朵颐。','美食面前，没有主人和奴隶的区别。只有饱和更饱。']},
  // ── 其他节日 ──
  {month:2,day:14, name:'恋人节',      icon:'💝',story:['空气中弥漫着甜腻的气息，到处都是成双成对的身影。','庄园里的奴隶们也有些躁动不安。','你准备了巧克力，给每个人都送了一份。','「主人……这是什么意思？」','「别想多了。只是应景而已。」你别过脸去。','但细心的人可能注意到，有一份巧克力的包装比其他的都精致一些。']},
  {month:6,day:21, name:'夏至',        icon:'☀️',story:['一年中白昼最长的一天。','炎热让所有人都变得慵懒，空调房里的氛围有些微妙。','你买了一大桶冰淇淋，算是对酷暑的小小抵抗。','「主人，能不能……今天不训练？」','你看了看窗外毒辣的阳光，点了点头。','今天就这样懒洋洋地过吧。也许是温度的关系，今天的好感上升得格外容易。']},
  {month:10,day:31,name:'万圣夜',      icon:'🎃',story:['庄园被装点得诡异又可爱，南瓜灯随处可见。','有几位奴隶认真地准备了Cosplay，效果出乎意料地好。','「Trick or treat！」有人举着糖果篮子堵在你面前。','你从口袋里掏出一把糖塞进篮子里。','「Treat。」你说。','今晚的庄园充满了欢笑和尖叫。恐怖？不，这里最恐怖的，永远是主人的调教菜单。']},
  {month:12,day:24,name:'平安夜',      icon:'🎄',story:['窗外飘着雪，壁炉里燃着暖融融的火。','你悄悄准备了一些小礼物，放在每个人的枕边。','圣诞树上的星星在闪烁，像是在守护着这一屋子复杂的关系。','深夜，有人悄悄走到你门前，放下了一个小盒子就跑走了。','你打开一看——是一条围巾，针脚歪歪扭扭的，显然是手工编织的。','今夜无人不安，今夜万事皆可原谅。']},
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
