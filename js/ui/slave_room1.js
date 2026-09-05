// slave_room.js v5 — 如隶房间（全面修整版）

;(function(){

var RW=360, RH=420, CEIL=32, FLOOR=372;

var FD = {
  window:{name:'窗户',icon:'🪟',costs:[200,400,800],levels:['木板封死','气窗','旧木窗','玻璃窗'],area:{x:12,y:74,w:68,h:108}},
  lamp:  {name:'灯',  icon:'🕯️',costs:[100,300,600],levels:['无灯（黑暗）','烛台','油灯','吊灯'],area:{x:132,y:0,w:92,h:78}},
  shelf: {name:'书架',icon:'📚',costs:[300,600,1200],levels:['无书架','地上书堆','木书架','满架书卷'],area:{x:8,y:192,w:82,h:178}},
  bed:   {name:'床铺',icon:'🛏️',costs:[500,1000,2000],levels:['稻草席','薄褥子','木床架','软大床'],area:{x:175,y:250,w:165,h:122}},
  ward:  {name:'衣柜',icon:'👗',costs:[300,700,1500],levels:['无衣柜','挂衣杆','木柜','雕花衣橱'],area:{x:278,y:150,w:80,h:222}},
  fun:   {name:'娱乐',icon:'🎵',costs:[400,900,1800],levels:['无','残棋','书册与棋','古筝'],area:{x:78,y:300,w:92,h:70}},
};

var SLAVE_ACTIONS = [
  {label:'聊天',    icon:'💬', type:'chat'},
  {label:'共餐',    icon:'🍽️',  type:'meal'},
  {label:'送礼',    icon:'🎁', type:'gift'},
  {label:'夜间探望', icon:'🌙', type:'night'},
];


// ══════════════════════════════════════════════════════════
// 【家具剧情总表 — 所有文本都在这里，改这里就够了】
//
// FLAVOR[家具]  氛围描述（按等级0/1/2/3），在长按面板里显示
// IS[家具]      互动剧情，单击家具时随机抽一条播放
//
// 🪟 窗户: IS.window[0]=推开窗 IS.window[1]=关上窗 IS.window[2]=靠近
// 🕯 灯:   IS.lamp[0]=点灯   IS.lamp[1]=熄灯
// 其余家具只有一个动作，在 IS.xxx[0] 里加文本即可
// ══════════════════════════════════════════════════════════
var FLAVOR = {

  // 🪟 窗户 — 氛围描述（按等级）
  window:['木板将窗户钉死，连一丝光都透不进来。','窗缝中挤进一线天光，是与外界唯一的联系。','推开木窗，新鲜空气流了进来，她下意识深吸一口气。','紫色纱帘随风轻摆，阳光将整间屋子染成暖橙色。'],

  // 🕯 灯 — 氛围描述
  lamp:  ['漆黑的房间里什么都看不清。','烛火摇曳，将她的影子拉得很长。','油灯的暖黄光晕弥散，填满每一个角落。','吊灯将五道火光洒向室内，一切纤毫毕现。'],

  // 📚 书架
  shelf: ['光秃秃的墙角，什么都没有。','几本旧书散落在地，翻得起了毛边。','木书架上放着些书，她整理得很整齐。','满架书卷按序排列，书脊上贴着她自制的标签。'],

  // 🛏 床铺
  bed:   ['草席铺在地上，散发着淡淡的霉味。','薄薄的褥子叠在墙角，睡前才会展开。','木床架撑起了一张像样的床，枕头折叠整齐。','华盖的流苏垂落下来，软床宽阔，配着厚实被褥。'],

  // 👗 衣柜
  ward:  ['衣物随意堆在角落，虽乱，但算整洁。','一根木杆横在墙边，几件朴素衣服挂着。','木质衣柜关着，她说里面按季节分区摆放。','雕花衣橱占了半面墙，她对每件衣服的位置了如指掌。'],

  // 🎵 娱乐
  fun:   ['什么消遣都没有，只能坐着发呆。','残缺棋盘上散落几枚棋子，凑不成完整对弈。','小桌上放着书册和一副棋，偶尔还有棋谱痕迹。','古筝摆在窗边，琴弦崭新，看得出经常弹奏。'],
};

var IS = {

  // ── 🪟 窗户互动剧情 ───────────────────────────────────
  // IS.window[0] = 推开窗（等级2+，窗关着时触发）
  // IS.window[1] = 关上窗（等级2+，窗开着时触发）
  // IS.window[2] = 靠近  （等级0-1 时触发）
  window:[
    ['推开窗',[
      '你拉开纱帘，风将她的发丝轻轻撩起，她望着窗外，有片刻的出神。',
      '你推开窗，带着泥土气息的风吹进来。她眯起眼睛，像是享受。',
      // 在这里继续添加推开窗的剧情 ↓
    ],'推开窗'],
    ['关上窗',[
      '你关上窗，室内安静下来，只剩她均匀的呼吸声和地板的轻响。',
      '你拉上纱帘，阳光被柔化成朦胧的光晕，洒在地板上。',
      // 在这里继续添加关上窗的剧情 ↓
    ],'关上窗'],
    ['靠近',[
      '你伸手推了推木板，纹丝不动。她在这样的黑暗里住了多久？',
      '你从缝隙向外看，只见一片灰白的天空，她走过来，默默站在你身后。',
      // 在这里继续添加靠近窗的剧情 ↓
    ],'靠近'],
  ],

  // ── 🕯 灯互动剧情 ─────────────────────────────────────
  // IS.lamp[0] = 点灯（灯熄着时触发）
  // IS.lamp[1] = 熄灯（灯亮着时触发）
  lamp:[
    ['点灯',[
      '你点亮烛台，两人在火光里对视了一秒。',
      '灯亮了，她的脸从阴影中浮现，神情平静。',
      '你划亮火柴，整个房间随之明亮，她微微眨了眨眼。',
      // 在这里继续添加点灯的剧情 ↓
    ],'点灯'],
    ['熄灯',[
      '你吹灭烛火，黑暗瞬间涌来，你听见她屏住了呼吸。',
      '最后一点光消失的瞬间，室内彻底沉寂。',
      // 在这里继续添加熄灯的剧情 ↓
    ],'熄灯'],
  ],

  // ── 📚 书架互动剧情 ───────────────────────────────────
  shelf:[ ['翻书',[
    '你随手抽出一本，她走过来低声说这本她已经看了三遍了。',
    '你取了一本游记递给她，她接过来，认真地翻开第一页。',
    '你念了一句诗，她接下去续了下一句，声音很轻。',
    // 在这里继续添加书架剧情 ↓
  ],'翻书'] ],

  // ── 🛏 床铺互动剧情 ───────────────────────────────────
  bed:  [ ['坐下',[
    '你在床边坐下，拍了拍枕头。她迟疑片刻，走过来在旁边坐下，两人就这么沉默地待着。',
    '你仰躺上去，华盖的流苏轻轻摆动。你抬眼，发现她在偷偷看你。',
    '你坐在草席旁，她有些窘迫地低下头，小声问要不要换个稍微厚一点的褥子。',
    // 在这里继续添加床铺剧情 ↓
  ],'坐下'] ],

  // ── 👗 衣柜互动剧情 ───────────────────────────────────
  ward: [ ['查看衣物',[
    '你打开柜门，她在旁边小声介绍哪件是日常穿的，哪件是见客用的，说得一板一眼。',
    '你取出一件衣服递给她，让她换上。她接过去，脸微微红了。',
    '你翻了翻角落里的旧衣物，折叠得整整齐齐，是她自己叠的。',
    // 在这里继续添加衣柜剧情 ↓
  ],'查看衣物'] ],

  // ── 🎵 娱乐互动剧情 ───────────────────────────────────
  fun:  [ ['互动',[
    '你在她对面坐下，两人就残局对弈，她下得比你预期的更沉稳。',
    '你执黑，她执白，片刻后她走出一步出人意料的棋，抬头等你回应。',
    '你示意她弹一曲，她轻轻拨动琴弦，音色清澈，在房间里漫开。',
    // 在这里继续添加娱乐剧情 ↓
  ],'互动'] ],
};

// ── 状态（viewMode: 'room' | 'interact' | 'simple'）────────
var _s = {charId:null, viewMode:'room', showMaster:true, showSlave:true, modal:null, action:null, story:null};
var _lpt=null, _didTouch=false;

function _pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// ── 房间主题色板 ──────────────────────────────────────────
// header = 状态栏背景（比墙深）
// ceil   = 天花板
// wall   = 墙壁
// wallD  = 墙壁纹路线
// beam   = 横梁
// fa/fb  = 地板交替色
function _roomPalette(){
  var theme=document.documentElement.getAttribute('data-theme')||'dark-rose';
  var p={
    'dark-rose':   {header:'#0e0610',ceil:'#1a0c16',wall:'#261220',wallD:'#1e0e18',beam:'#4a1830',fa:'#301525',fb:'#200f18'},
    'warm-wood':   {header:'#8a6030',ceil:'#b89060',wall:'#f0e8d0',wallD:'#e0d8b8',beam:'#7a5028',fa:'#9a7040',fb:'#8a6030'},
    'night-blue':  {header:'#050812',ceil:'#0a1025',wall:'#0e1832',wallD:'#0a1228',beam:'#1a2c50',fa:'#102038',fb:'#0a1428'},
    'summer-snow': {header:'#6090b0',ceil:'#90bcd8',wall:'#d0eaf8',wallD:'#c0e0f0',beam:'#406880',fa:'#507898',fb:'#406888'},
    'autumn-gold': {header:'#906020',ceil:'#b88040',wall:'#f0e8d4',wallD:'#e0d8b8',beam:'#7a5020',fa:'#9a7040',fb:'#8a6028'},
    'sakura':      {header:'#b84878',ceil:'#d880a8',wall:'#f8e0ef',wallD:'#eecce0',beam:'#602040',fa:'#a85878',fb:'#904868'},
  };
  return p[theme]||p['dark-rose'];
}

// ── 亮度：通过暗度遮罩控制，无光晕效果 ─────────────────
function _darkness(r){
  if(!r||r.lamp===0||r.lampOn===false)return 0.42;
  return [0.22,0.06,0][r.lamp-1]||0;
}

// ── 数据接口 ─────────────────────────────────────────────
function _getChar(){
  var arr=(typeof CHARS_DATA!=='undefined')?CHARS_DATA:[];
  var c=arr.find(function(c){return c.id===_s.charId;});
  if(!c) return null;
  if(!c.room) c.room={window:0,lamp:0,shelf:0,bed:0,ward:0,fun:0};
  var r=c.room;
  if(r.masterX==null) r.masterX=124;
  if(r.slaveX==null)  r.slaveX=162;
  if(r.winOpen==null) r.winOpen=false;
  if(r.lampOn==null)  r.lampOn=true;
  return c;
}
function _getMoney(){
  try{var d=getPlayerDetail();if(d&&d.money!=null)return d.money;}catch(e){}
  if(typeof State!=='undefined'&&State.money!=null)return State.money;
  return 0;
}
function _spendMoney(n){
  if(typeof State!=='undefined'&&State.money!=null){State.money-=n;return;}
  try{var d=getPlayerDetail();if(d)d.money-=n;}catch(e){}
}
function _save(){ if(typeof savePlayerDetail==='function')savePlayerDetail(); }
function _masterName(){
  try{var d=getPlayerDetail();if(d&&d.name)return d.name;}catch(e){}
  if(typeof _playerProfile!=='undefined'&&_playerProfile&&_playerProfile.name)return _playerProfile.name;
  return '主人';
}
function _isMale(c){
  if(!c) return false;
  var g=c.gender||c.sex||'';
  return g==='male'||g==='男'||g===1||g==='1'||c.isMale===true;
}

// ── 入口 ─────────────────────────────────────────────────
window.openSlaveRoom=function(charId){
  _s.charId=charId; _s.viewMode='room'; _s.modal=null; _s.action=null; _s.story=null;
  _render(); openOv('ov-slave-room');
};

// ── 触摸/点击 ────────────────────────────────────────────
window._srTS=function(key,e){ if(e){e.preventDefault();e.stopPropagation();} _didTouch=false; _lpt=setTimeout(function(){_lpt=null;_didTouch=true;_s.action=key;_s.story=null;_s.modal=null;_render();},500); };
window._srTE=function(key,e){ if(e){e.preventDefault();e.stopPropagation();} if(_lpt!==null){clearTimeout(_lpt);_lpt=null;_didTouch=true;_srQuick(key);} };
window._srCK=function(key){ if(_didTouch){_didTouch=false;return;} _srQuick(key); };
window._srQuick=function(key){
  var c=_getChar(); if(!c)return;
  var r=c.room, l=r[key];
  if(key==='window')         _srInteract('window', l>=2?(r.winOpen?1:0):2);
  else if(key==='lamp'&&l>0) _srInteract('lamp', r.lampOn?1:0);
  else if(l>0&&IS[key])      _srInteract(key,0);
};
window._srInteract=function(key,idx){
  var c=_getChar(); if(!c)return;
  var entry=IS[key]&&IS[key][idx]; if(!entry)return;
  if(entry[0]==='推开窗') c.room.winOpen=true;
  if(entry[0]==='关上窗') c.room.winOpen=false;
  if(entry[0]==='点灯')   c.room.lampOn=true;
  if(entry[0]==='熄灯')   c.room.lampOn=false;
  _s.story={title:entry[2],text:_pick(entry[1])};
  _s.action=null; _save(); _render();
};
window._srUpgrade=function(key){
  var c=_getChar(); if(!c)return;
  var l=c.room[key]; if(l>=3)return;
  _s.modal={key:key,from:l,to:l+1}; _s.action=null; _render();
};
window._srConfirm=function(){
  var m=_s.modal; if(!m)return;
  var c=_getChar(); if(!c)return;
  var cost=FD[m.key].costs[m.from];
  if(_getMoney()<cost)return;
  _spendMoney(cost); c.room[m.key]=m.to; _save(); _s.modal=null; _render();
};
window._srDirectUpgrade=function(key){
  var c=_getChar(); if(!c)return;
  var l=c.room[key]; if(l>=3)return;
  var fd=FD[key], cost=fd.costs[l];
  if(_getMoney()<cost){
    _s.story={title:'⚠ 金币不足',text:'升级「'+fd.name+'」需要 ¥'+cost+'，当前持有金币不足。'};
    _render(); return;
  }
  _spendMoney(cost); c.room[key]=l+1; _save();
  _s.story={title:'✨ 升级成功',text:'「'+fd.name+'」已从「'+fd.levels[l]+'」升级为「'+fd.levels[l+1]+'」！'};
  _render();
};
window._srCloseModal=function(){ _s.modal=null; _render(); };
window._srCloseAction=function(){ _s.action=null; _render(); };
window._srCloseStory=function(){ _s.story=null; _render(); };
window._srSetMode=function(m){ _s.viewMode=m; _render(); };
window._srToggleMaster=function(){ _s.showMaster=!_s.showMaster; _render(); };
window._srToggleSlave=function(){  _s.showSlave=!_s.showSlave;   _render(); };
window._srMove=function(who,dir){
  var c=_getChar(); if(!c)return;
  c.room[who==='master'?'masterX':'slaveX']=Math.max(30,Math.min(310,c.room[who==='master'?'masterX':'slaveX']+dir*22));
  _save(); _render();
};
// 切换简单/房间模式
window._srToggleSimple=function(){
  _s.viewMode=_s.viewMode==='simple'?'room':'simple';
  _s.action=null; _s.story=null; _render();
};
// 互动按钮：在新房间内直接播放剧情，不触发旧系统
window._srSlaveAction=function(type){
  var c=_getChar(); if(!c)return;
  var name=c.name||'她';
  var stories={
    chat:['你在'+name+'的房间里坐了下来，随意找了个话题。',
          '「……今天外面下雨了。」你说。',
          '「是吗。」'+name+'淡淡地回应，随即沉默。',
          '两人就这样坐着，没有再说更多——但气氛比以前少了一分剑拔弩张。'],
    meal:['你带来了两份饭食，放在'+name+'桌上。',
          '「吃吧。」你说。',
          '对方沉默片刻，还是动了筷子。',
          '「……这个不难吃。」声音很小，几乎像是说给自己听的。'],
    gift:['你把那件东西递给'+name+'，没有多余的解释。',
          '「……给我的？」对方看起来有些意外。',
          '「嗯。」',
          '那件礼物就这样留了下来，连同一点点说不清道不明的情绪。'],
    night:['深夜，你推开'+name+'的房门。',
           '烛火已经熄灭，只有月光透过窗格洒进来。',
           '你站在门口片刻，没有进去，也没有开口。',
           '只是确认了一下——她还在，还好。'],
  };
  var gain={chat:2,meal:3,gift:5,night:2};
  var titleMap={chat:'💬 聊天',meal:'🍽️ 共餐',gift:'🎁 送礼',night:'🌙 夜间探望'};
  var story=stories[type]||['你与'+name+'进行了一次互动。'];
  var aff=gain[type]||2;
  if(c.favor!=null) c.favor=Math.min(100,(c.favor||0)+aff);
  _save();
  _s.story={title:titleMap[type]||'互动',text:story.join('<br><br>')};
  _render();
};

// ── 主渲染 ────────────────────────────────────────────────
function _render(){
  var el=document.getElementById('slave-room-body'); if(!el)return;
  var c=_getChar();
  if(!c){el.innerHTML='<p style="padding:20px;color:var(--acc)">找不到角色数据</p>';return;}
  el.innerHTML=_html(c,_getMoney());
}

function _html(c,money){
  var r=c.room, dark=_darkness(r), rp=_roomPalette(), mn=_masterName();
  var isSimple=_s.viewMode==='simple';
  var toggleLbl=isSimple?'🏠 房间':'≡ 简单';
  return (
    // 整体容器
    '<div style="font-family:\'Noto Serif SC\',serif;min-height:100%;display:flex;flex-direction:column;color:var(--txt,#ede6f8)">'

    // ── 顶栏（用房间色板的 header 色，比墙壁深）──
    +'<div style="display:flex;align-items:center;padding:10px 14px;background:'+rp.header+';flex-shrink:0">'
    +'<div style="flex:1">'
    +'<div style="font-size:1.05rem;font-weight:bold;color:#fff">🛏️ 奴隶房间</div>'
    +'<div style="font-size:.76rem;color:rgba(255,255,255,0.65);margin-top:2px">'+(c.name||'未知')+' · 好感 '+(c.favor||0)+' · 服从 '+(c.obey||0)+'</div>'
    +'</div>'
    +'<button onclick="_srToggleSimple()" style="padding:4px 11px;border-radius:16px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.12);color:#fff;cursor:pointer;font-size:.76rem;font-family:inherit;margin-right:10px">'+toggleLbl+'</button>'
    +'<div style="font-size:.85rem;color:rgba(255,255,255,0.75)">💰 '+money.toLocaleString()+'</div>'
    +'</div>'

    // ── 控制栏（简单模式下隐藏）──
    +(isSimple?''
      :'<div style="display:flex;gap:6px;padding:7px 12px;background:'+rp.header+';align-items:center;border-top:1px solid rgba(255,255,255,0.1);flex-shrink:0">'
      +_tab('room','🏠 房间',_s.viewMode,rp)+_tab('interact','💬 互动',_s.viewMode,rp)
      +'<div style="flex:1"></div>'
      +_tog(_s.showMaster,'_srToggleMaster()',mn,rp)+_tog(_s.showSlave,'_srToggleSlave()',c.name||'奴隶',rp)
      +'</div>'
    )

    // ── 内容区 ──
    +'<div style="flex:1;overflow-y:auto">'
    +(isSimple?_simpleView(r,money,rp)
      :_s.viewMode==='room'?_roomSVG(r,dark,c,rp)
      :_interactView(c,rp))
    +'</div>'

    // ── 弹层 ──
    +(_s.action?_actionSheet(_s.action,r,money,rp):'')
    +(_s.story?_storyModal(_s.story,rp):'')
    +(_s.modal?_upgradeModal(_s.modal,money,rp):'')
    +'</div>'
  );
}

function _tab(m,l,cur,rp){
  var a=cur===m;
  var bg=a?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.08)';
  var fc=a?'#fff':'rgba(255,255,255,0.55)';
  return '<button onclick="_srSetMode(\''+m+'\')" style="padding:5px 12px;border-radius:16px;border:'+(a?'1px solid rgba(255,255,255,0.4)':'1px solid transparent')+';background:'+bg+';color:'+fc+';cursor:pointer;font-size:.78rem;font-family:inherit">'+l+'</button>';
}
function _tog(on,fn,l,rp){
  return '<button onclick="'+fn+'" style="padding:4px 9px;border-radius:14px;border:1px solid rgba(255,255,255,0.2);background:'+(on?'rgba(255,255,255,0.2)':'transparent')+';color:'+(on?'#fff':'rgba(255,255,255,0.4)')+';cursor:pointer;font-size:.72rem;font-family:inherit">'+l+'</button>';
}

// ── 简单模式（升级列表 + 互动按钮）────────────────────────
function _simpleView(r,money,rp){
  var rows=Object.keys(FD).map(function(key){
    var fd=FD[key], l=r[key];
    var canAff=l<3&&money>=fd.costs[l];
    var btn=l<3
      ?'<button onclick="_srDirectUpgrade(\''+key+'\')" style="padding:6px 16px;font-size:.82rem;border-radius:20px;border:none;background:'+(canAff?'var(--acc,#c7395a)':'var(--card2,#231d30)')+';color:'+(canAff?'#fff':'var(--muted,#5c5072)')+';cursor:'+(canAff?'pointer':'not-allowed')+';font-family:inherit">'+(canAff?'':'⚠ ')+'升级 ¥'+fd.costs[l]+'</button>'
      :'<span style="color:var(--muted,#5c5072);font-size:.78rem;padding:6px 10px">✓ 满级</span>';
    return '<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;margin-bottom:8px;background:var(--card,#1e1828);border-radius:12px;border:1px solid var(--bdr,#2a2040)">'
      +'<div style="font-size:1.5rem">'+fd.icon+'</div>'
      +'<div style="flex:1">'
      +'<div style="font-size:.92rem;font-weight:bold;color:var(--txt,#ede6f8)">'+fd.name+'</div>'
      +'<div style="font-size:.74rem;color:var(--muted,#5c5072);margin-top:2px">'+fd.levels[l]+'</div>'
      +'</div>'+btn+'</div>';
  }).join('');
  var interactBtns=SLAVE_ACTIONS.map(function(a){
    return '<button onclick="_srSlaveAction(\''+a.type+'\')" style="padding:16px 8px;border-radius:12px;border:1px solid var(--bdr,#2a2040);background:var(--card,#1e1828);color:var(--txt,#ede6f8);cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:.85rem;font-weight:bold;width:100%">'
      +'<span style="font-size:1.8rem">'+a.icon+'</span>'
      +'<span>'+a.label+'</span>'
      +'</button>';
  }).join('');
  return '<div style="padding:12px 14px;background:var(--bg,#0e0b14);min-height:100%">'
    +rows
    +'<div style="font-size:.78rem;font-weight:700;color:var(--txt2,#9080a8);margin:16px 0 10px;padding-left:4px">💬 互动</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">'+interactBtns+'</div>'
    +'</div>';
}

// ── 动作面板（长按触发）────────────────────────────────
function _actionSheet(key,room,money,rp){
  var fd=FD[key], l=room[key], flavor=FLAVOR[key][l], btns='';
  if(key==='window'){
    if(l>=2){var oi=room.winOpen?1:0;btns+='<button onclick="_srInteract(\'window\','+oi+')" style="'+_bs('var(--acc,#c7395a)')+'">'+IS.window[oi][0]+'</button>';}
    else btns+='<button onclick="_srInteract(\'window\',2)" style="'+_bs('var(--card2,#231d30)')+'">靠近窗边</button>';
  } else if(key==='lamp'){
    if(l>0){var li=room.lampOn?1:0;btns+='<button onclick="_srInteract(\'lamp\','+li+')" style="'+_bs('var(--acc,#c7395a)')+'">'+IS.lamp[li][0]+'</button>';}
  } else if(l>0&&IS[key]){
    btns+='<button onclick="_srInteract(\''+key+'\',0)" style="'+_bs('var(--acc,#c7395a)')+'">'+IS[key][0][0]+'</button>';
  }
  if(l<3){var cost=fd.costs[l],ok=money>=cost;
    btns+='<button onclick="_srUpgrade(\''+key+'\')" style="'+_bs(ok?'#3a6028':'var(--card2,#231d30)')+'">'+(!ok?'⚠ ':'')+'升级 ¥'+cost+'</button>';
  }
  return '<div onclick="_srCloseAction()" style="position:fixed;inset:0;background:rgba(0,0,0,0.78);display:flex;align-items:flex-end;z-index:200">'
    +'<div onclick="event.stopPropagation()" style="background:var(--bg2,#16121f);border-radius:18px 18px 0 0;padding:16px 20px 28px;width:100%;box-sizing:border-box;border-top:1px solid var(--bdr,#2a2040)">'
    +'<div style="width:38px;height:4px;background:var(--bdr,#2a2040);border-radius:2px;margin:0 auto 14px"></div>'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">'
    +'<span style="font-size:1.4rem">'+fd.icon+'</span>'
    +'<div><div style="font-weight:bold;font-size:.95rem;color:var(--txt,#ede6f8)">'+fd.name+'</div>'
    +'<div style="font-size:.74rem;color:var(--acc,#c7395a)">'+fd.levels[l]+(l>=3?' · ✓ 满级':'')+'</div></div></div>'
    +'<div style="font-size:.8rem;color:var(--muted,#5c5072);margin-bottom:16px;padding:10px;background:var(--card,#1e1828);border-radius:8px;line-height:1.65;border-left:3px solid var(--acc,#c7395a)">'+flavor+'</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'+btns
    +'<button onclick="_srCloseAction()" style="'+_bs('transparent',true)+'">关闭</button>'
    +'</div></div></div>';
}
function _bs(bg,g){ return 'padding:10px 16px;border-radius:12px;border:'+(g?'1px solid var(--bdr,#2a2040)':'none')+';background:'+bg+';color:var(--btn-c,#fff);cursor:pointer;font-size:.85rem;font-family:inherit;flex:1;min-width:80px;text-align:center'; }

// ── 故事弹窗 ──────────────────────────────────────────────
function _storyModal(s,rp){
  return '<div onclick="_srCloseStory()" style="position:fixed;inset:0;background:rgba(0,0,0,0.78);display:flex;align-items:center;padding:24px;z-index:200">'
    +'<div onclick="event.stopPropagation()" style="background:var(--bg2,#16121f);border-radius:16px;padding:22px;width:100%;box-sizing:border-box;max-width:340px;margin:0 auto;border:1px solid var(--bdr,#2a2040)">'
    +'<div style="font-size:.88rem;font-weight:bold;color:var(--acc,#c7395a);margin-bottom:14px">『'+s.title+'』</div>'
    +'<div style="font-size:.9rem;line-height:1.85;color:var(--txt,#ede6f8);padding:14px;background:var(--card,#1e1828);border-radius:10px;border-left:3px solid var(--acc,#c7395a)">'+s.text+'</div>'
    +'<button onclick="_srCloseStory()" style="margin-top:16px;width:100%;padding:12px;border-radius:10px;border:none;background:var(--acc,#c7395a);color:var(--btn-c,#fff);cursor:pointer;font-size:.88rem;font-family:inherit;font-weight:bold">好</button>'
    +'</div></div>';
}

// ── 升级确认弹窗 ──────────────────────────────────────────
function _upgradeModal(m,money,rp){
  var fd=FD[m.key], cost=fd.costs[m.from], ok=money>=cost;
  return '<div onclick="_srCloseModal()" style="position:fixed;inset:0;background:rgba(0,0,0,0.78);display:flex;align-items:flex-end;z-index:200">'
    +'<div onclick="event.stopPropagation()" style="background:var(--bg2,#16121f);border-radius:18px 18px 0 0;padding:18px 20px 28px;width:100%;box-sizing:border-box;border-top:1px solid var(--bdr,#2a2040)">'
    +'<div style="width:38px;height:4px;background:var(--bdr,#2a2040);border-radius:2px;margin:0 auto 18px"></div>'
    +'<div style="font-size:1rem;font-weight:bold;margin-bottom:6px;color:var(--txt,#ede6f8)">升级「'+fd.name+'」</div>'
    +'<div style="display:flex;align-items:center;gap:8px;font-size:.88rem;margin-bottom:10px">'
    +'<span style="color:var(--muted,#5c5072)">'+fd.levels[m.from]+'</span>'
    +'<span style="color:var(--acc,#c7395a)">→</span>'
    +'<span style="color:var(--acc2,#e85c7a);font-weight:bold">'+fd.levels[m.to]+'</span></div>'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">'
    +'<span style="font-size:.88rem;color:var(--txt,#ede6f8)">花费 <b style="color:var(--acc,#c7395a);font-size:1.08rem">'+cost.toLocaleString()+'</b> 金币</span>'
    +'<span style="font-size:.76rem;color:'+(ok?'var(--sg,#3ecf84)':'var(--sr,#e85c7a)')+'">持有 '+money.toLocaleString()+' 金币</span></div>'
    +'<div style="display:flex;gap:10px">'
    +'<button onclick="_srCloseModal()" style="flex:1;padding:12px;border-radius:10px;border:1px solid var(--bdr,#2a2040);background:transparent;color:var(--txt2,#9080a8);cursor:pointer;font-size:.88rem;font-family:inherit">取消</button>'
    +'<button onclick="'+(ok?'_srConfirm()':'void 0')+'" style="flex:2;padding:12px;border-radius:10px;border:none;background:'+(ok?'var(--acc,#c7395a)':'var(--card,#1e1828)')+';color:'+(ok?'var(--btn-c,#fff)':'var(--muted,#5c5072)')+';cursor:'+(ok?'pointer':'not-allowed')+';font-size:.88rem;font-weight:bold;font-family:inherit">确认升级</button>'
    +'</div></div></div>';
}

// ── 互动 Tab ──────────────────────────────────────────────
function _interactView(c,rp){
  var btns=SLAVE_ACTIONS.map(function(a){
    return '<button onclick="_srSlaveAction(\''+a.type+'\')" style="width:calc(50% - 6px);padding:22px 8px;border-radius:14px;border:none;background:'+rp.header+';color:#fff;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:10px">'
      +'<span style="font-size:2.2rem">'+a.icon+'</span>'
      +'<span style="font-size:.9rem;font-weight:bold">'+a.label+'</span>'
      +'</button>';
  }).join('');
  return '<div style="padding:16px 12px;background:var(--bg,#0e0b14);min-height:100%">'
    +'<div style="display:flex;flex-wrap:wrap;gap:12px">'+btns+'</div>'
    +'</div>';
}

// ── 房间 SVG ──────────────────────────────────────────────
function _roomSVG(r,dark,c,rp){
  var mx=r.masterX, sx=r.slaveX;
  var areas=Object.keys(FD).map(function(key){
    var a=FD[key].area;
    return '<g ontouchstart="_srTS(\''+key+'\',event)" ontouchend="_srTE(\''+key+'\',event)" onclick="_srCK(\''+key+'\')" style="cursor:pointer">'
      +'<rect x="'+a.x+'" y="'+a.y+'" width="'+a.w+'" height="'+a.h+'" fill="rgba(0,0,0,0.001)"/></g>';
  }).join('');
  var marr=_s.showMaster
    ?'<text x="'+(mx-20)+'" y="'+(FLOOR+28)+'" ontouchend="_srMove(\'master\',-1)" onclick="_srMove(\'master\',-1)" style="cursor:pointer" fill="rgba(255,255,255,0.6)" font-size="16">◀</text>'
     +'<text x="'+(mx+12)+'" y="'+(FLOOR+28)+'" ontouchend="_srMove(\'master\',1)"  onclick="_srMove(\'master\',1)"  style="cursor:pointer" fill="rgba(255,255,255,0.6)" font-size="16">▶</text>':'';
  var sarr=_s.showSlave
    ?'<text x="'+(sx-20)+'" y="'+(FLOOR+28)+'" ontouchend="_srMove(\'slave\',-1)"  onclick="_srMove(\'slave\',-1)"  style="cursor:pointer" fill="rgba(255,255,255,0.6)" font-size="16">◀</text>'
     +'<text x="'+(sx+12)+'" y="'+(FLOOR+28)+'" ontouchend="_srMove(\'slave\',1)"   onclick="_srMove(\'slave\',1)"   style="cursor:pointer" fill="rgba(255,255,255,0.6)" font-size="16">▶</text>':'';
  var wind=r.winOpen&&r.window>=2
    ?'<path d="M90,125 Q102,120 114,125 Q126,130 138,125" fill="none" stroke="#a0c8e0" stroke-width="1.5" opacity="0.5"/>'
     +'<path d="M95,140 Q109,135 123,140" fill="none" stroke="#a0c8e0" stroke-width="1" opacity="0.35"/>':'';

  return '<div style="padding:0">'
    +'<svg viewBox="0 0 '+RW+' '+RH+'" width="100%" style="display:block;user-select:none;touch-action:manipulation" preserveAspectRatio="xMidYMid meet">'
    // 背景填充
    +'<rect width="'+RW+'" height="'+RH+'" fill="'+rp.wall+'"/>'
    // 天花板（明显比墙深）
    +'<rect width="'+RW+'" height="'+CEIL+'" fill="'+rp.ceil+'"/>'
    +'<rect x="0"   y="0" width="7"  height="'+CEIL+'" fill="'+rp.beam+'" opacity="0.8"/>'
    +'<rect x="95"  y="0" width="7"  height="'+CEIL+'" fill="'+rp.beam+'" opacity="0.8"/>'
    +'<rect x="190" y="0" width="7"  height="'+CEIL+'" fill="'+rp.beam+'" opacity="0.8"/>'
    +'<rect x="285" y="0" width="7"  height="'+CEIL+'" fill="'+rp.beam+'" opacity="0.8"/>'
    // 墙壁纹路
    +'<line x1="0" y1="'+(CEIL+58)+'"  x2="'+RW+'" y2="'+(CEIL+58)+'"  stroke="'+rp.wallD+'" stroke-width="0.8" opacity="0.6"/>'
    +'<line x1="0" y1="'+(CEIL+114)+'" x2="'+RW+'" y2="'+(CEIL+114)+'" stroke="'+rp.wallD+'" stroke-width="0.8" opacity="0.6"/>'
    +'<line x1="0" y1="'+(CEIL+170)+'" x2="'+RW+'" y2="'+(CEIL+170)+'" stroke="'+rp.wallD+'" stroke-width="0.8" opacity="0.6"/>'
    +'<line x1="0" y1="'+(CEIL+226)+'" x2="'+RW+'" y2="'+(CEIL+226)+'" stroke="'+rp.wallD+'" stroke-width="0.8" opacity="0.6"/>'
    +'<line x1="0" y1="'+(CEIL+282)+'" x2="'+RW+'" y2="'+(CEIL+282)+'" stroke="'+rp.wallD+'" stroke-width="0.8" opacity="0.6"/>'
    // 地板（明显比墙深）
    +'<rect x="0"   y="'+FLOOR+'" width="46" height="'+(RH-FLOOR)+'" fill="'+rp.fa+'"/>'
    +'<rect x="46"  y="'+FLOOR+'" width="46" height="'+(RH-FLOOR)+'" fill="'+rp.fb+'"/>'
    +'<rect x="92"  y="'+FLOOR+'" width="46" height="'+(RH-FLOOR)+'" fill="'+rp.fa+'"/>'
    +'<rect x="138" y="'+FLOOR+'" width="46" height="'+(RH-FLOOR)+'" fill="'+rp.fb+'"/>'
    +'<rect x="184" y="'+FLOOR+'" width="46" height="'+(RH-FLOOR)+'" fill="'+rp.fa+'"/>'
    +'<rect x="230" y="'+FLOOR+'" width="46" height="'+(RH-FLOOR)+'" fill="'+rp.fb+'"/>'
    +'<rect x="276" y="'+FLOOR+'" width="46" height="'+(RH-FLOOR)+'" fill="'+rp.fa+'"/>'
    +'<rect x="322" y="'+FLOOR+'" width="46" height="'+(RH-FLOOR)+'" fill="'+rp.fb+'"/>'
    +'<line x1="0" y1="'+FLOOR+'" x2="'+RW+'" y2="'+FLOOR+'" stroke="'+rp.beam+'" stroke-width="3"/>'
    // 家具
    +_svgWindow(r.window,r.winOpen)
    +_svgLamp(r.lamp,r.lampOn)
    +_svgShelf(r.shelf)
    +_svgWard(r.ward)
    +_svgFun(r.fun)
    +_svgBed(r.bed)
    +wind
    // 人物
    +(_s.showSlave?_svgSlave(sx,FLOOR,c):'')
    +(_s.showMaster?_svgMaster(mx,FLOOR):'')
    // 亮度遮罩（无光晕，只整体暗度）
    +(dark>0?'<rect width="'+RW+'" height="'+RH+'" fill="black" opacity="'+dark+'" pointer-events="none"/>':'')
    // 点击区 + 移动箭头
    +areas+marr+sarr
    +'<text x="'+RW/2+'" y="'+(RH-5)+'" text-anchor="middle" font-size="8.5" fill="rgba(255,255,255,0.35)">单击互动 · 长按升级</text>'
    +'</svg></div>';
}

// ── SVG 家具 ─────────────────────────────────────────────

function _svgWindow(l,open){
  var x=14,y=78,w=64,h=100;
  if(l===0) return '<g>'
    +'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="#5c3816"/>'
    +'<rect x="'+(x+3)+'" y="'+(y+5)+'"  width="'+(w-6)+'" height="13" fill="#7a5028" rx="1"/>'
    +'<rect x="'+(x+3)+'" y="'+(y+23)+'" width="'+(w-6)+'" height="13" fill="#7a5028" rx="1"/>'
    +'<rect x="'+(x+3)+'" y="'+(y+41)+'" width="'+(w-6)+'" height="13" fill="#7a5028" rx="1"/>'
    +'<rect x="'+(x+3)+'" y="'+(y+59)+'" width="'+(w-6)+'" height="13" fill="#7a5028" rx="1"/>'
    +'<rect x="'+(x+3)+'" y="'+(y+77)+'" width="'+(w-6)+'" height="13" fill="#7a5028" rx="1"/>'
    +'<line x1="'+(x+5)+'" y1="'+(y+5)+'" x2="'+(x+w-5)+'" y2="'+(y+h-5)+'" stroke="#3a1808" stroke-width="3" stroke-linecap="round"/>'
    +'<line x1="'+(x+w-5)+'" y1="'+(y+5)+'" x2="'+(x+5)+'" y2="'+(y+h-5)+'" stroke="#3a1808" stroke-width="3" stroke-linecap="round"/></g>';
  if(l===1) return '<g>'
    +'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="#5c3816"/>'
    +'<rect x="'+(x+8)+'" y="'+(y+5)+'" width="'+(w-16)+'" height="13" fill="#b8dff0" rx="2"/>'
    +'<rect x="'+(x+8)+'" y="'+(y+5)+'" width="'+(w-16)+'" height="13" fill="none" stroke="#5a3818" stroke-width="1.5" rx="2"/>'
    +'<rect x="'+(x+3)+'" y="'+(y+23)+'" width="'+(w-6)+'" height="14" fill="#7a5028" rx="1"/>'
    +'<rect x="'+(x+3)+'" y="'+(y+45)+'" width="'+(w-6)+'" height="14" fill="#7a5028" rx="1"/>'
    +'<rect x="'+(x+3)+'" y="'+(y+67)+'" width="'+(w-6)+'" height="14" fill="#7a5028" rx="1"/></g>';
  var pw=(w-8)/2, gc=open?'#90c8f0':'#78aed0';
  if(l===2) return '<g>'
    +'<rect x="'+(x-2)+'" y="'+(y-3)+'" width="'+(w+4)+'" height="'+(h+3)+'" fill="#5a3818" rx="3"/>'
    +'<rect x="'+(x+2)+'" y="'+(y+2)+'" width="'+pw+'" height="'+(h-4)+'" fill="'+gc+'"/>'
    +'<rect x="'+(x+2)+'" y="'+(y+2+(h-4)*0.52)+'" width="'+pw+'" height="'+((h-4)*0.48)+'" fill="#60a840"/>'
    +'<rect x="'+(x+6+pw)+'" y="'+(y+2)+'" width="'+pw+'" height="'+(h-4)+'" fill="'+gc+'"/>'
    +'<rect x="'+(x+6+pw)+'" y="'+(y+2+(h-4)*0.52)+'" width="'+pw+'" height="'+((h-4)*0.48)+'" fill="#60a840"/>'
    +'<line x1="'+(x+w/2)+'" y1="'+(y-3)+'" x2="'+(x+w/2)+'" y2="'+(y+h)+'" stroke="#5a3818" stroke-width="3"/>'
    +'<line x1="'+(x-2)+'" y1="'+(y+h/2)+'" x2="'+(x+w+2)+'" y2="'+(y+h/2)+'" stroke="#5a3818" stroke-width="2"/>'
    +'<rect x="'+(x+4)+'" y="'+(y+4)+'" width="4" height="18" fill="rgba(255,255,255,0.45)" rx="1"/></g>';
  var co=open?0.82:0.96;
  return '<g>'
    +'<rect x="'+(x-4)+'" y="'+(y-5)+'" width="'+(w+8)+'" height="'+(h+5)+'" fill="#5a3818" rx="4"/>'
    +'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+gc+'"/>'
    +'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+(h*0.5)+'" fill="#a0ccf0"/>'
    +(open?'<ellipse cx="'+(x+20)+'" cy="'+(y+15)+'" rx="14" ry="6" fill="white" opacity="0.8"/><ellipse cx="'+(x+46)+'" cy="'+(y+25)+'" rx="11" ry="5" fill="white" opacity="0.65"/>':'')
    +'<rect x="'+x+'" y="'+(y+h*0.5)+'" width="'+w+'" height="'+(h*0.5)+'" fill="#58a038"/>'
    +'<line x1="'+(x+w/2)+'" y1="'+y+'" x2="'+(x+w/2)+'" y2="'+(y+h)+'" stroke="#5a3818" stroke-width="3"/>'
    +'<line x1="'+x+'" y1="'+(y+h/2)+'" x2="'+(x+w)+'" y2="'+(y+h/2)+'" stroke="#5a3818" stroke-width="2"/>'
    +'<rect x="'+(x+2)+'" y="'+(y+2)+'" width="4" height="22" fill="rgba(255,255,255,0.5)" rx="1"/>'
    +'<path d="M'+(x-4)+','+(y-5)+' Q'+(x+13)+','+(y+h*0.36)+' '+(x-4)+','+(y+h)+'" fill="#7858a8" opacity="'+co+'"/>'
    +'<path d="M'+(x+w+4)+','+(y-5)+' Q'+(x+w-13)+','+(y+h*0.36)+' '+(x+w+4)+','+(y+h)+'" fill="#7858a8" opacity="'+co+'"/>'
    +'<circle cx="'+(x+7)+'" cy="'+(y+h*0.38)+'" r="5" fill="#c8a030"/>'
    +'<circle cx="'+(x+w-7)+'" cy="'+(y+h*0.38)+'" r="5" fill="#c8a030"/></g>';
}

function _svgLamp(l,on){
  var cx=175, gc=on?'#c8a030':'#6a5a40';
  if(l===0) return '';
  // 无光晕效果，只有灯体本身
  var flame=on?'<ellipse cx="'+cx+'" cy="'+(CEIL+7)+'" rx="4" ry="5" fill="#ff8020" opacity="0.9"/><ellipse cx="'+cx+'" cy="'+(CEIL+10)+'" rx="2" ry="3" fill="#fff060" opacity="0.8"/>':'';
  if(l===1) return '<g>'
    +'<line x1="'+cx+'" y1="'+CEIL+'" x2="'+cx+'" y2="'+(CEIL+16)+'" stroke="#7a4c1e" stroke-width="2"/>'
    +'<rect x="'+(cx-13)+'" y="'+(CEIL+16)+'" width="26" height="5" fill="'+gc+'" rx="1"/>'
    +'<rect x="'+(cx-4)+'" y="'+(CEIL+9)+'" width="8" height="8" fill="#f0e0c0" rx="1"/>'+flame+'</g>';
  if(l===2){
    var f2=on?'<ellipse cx="'+cx+'" cy="'+(CEIL+23)+'" rx="4.5" ry="7" fill="#ff8020" opacity="0.85"/><ellipse cx="'+cx+'" cy="'+(CEIL+27)+'" rx="2.5" ry="3.5" fill="#fff060" opacity="0.8"/>':'';
    return '<g>'
      +'<line x1="'+cx+'" y1="'+CEIL+'" x2="'+cx+'" y2="'+(CEIL+30)+'" stroke="#9a8060" stroke-width="2" stroke-dasharray="3,2"/>'
      +'<rect x="'+(cx-9)+'" y="'+(CEIL+27)+'" width="18" height="10" fill="'+gc+'" rx="2"/>'
      +'<ellipse cx="'+cx+'" cy="'+(CEIL+40)+'" rx="14" ry="7" fill="'+gc+'"/>'
      +'<path d="M'+(cx-11)+','+(CEIL+34)+' Q'+cx+','+(CEIL+52)+' '+(cx+11)+','+(CEIL+34)+'" fill="'+gc+'"/>'+f2+'</g>';
  }
  var arms='';
  [-28,-14,0,14,28].forEach(function(dx){
    var af=on?'<rect x="'+(cx+dx-3)+'" y="'+(CEIL+25)+'" width="6" height="8" fill="#f0e0c0" rx="1"/><ellipse cx="'+(cx+dx)+'" cy="'+(CEIL+23)+'" rx="3.5" ry="5" fill="#ff8020" opacity="0.9"/><ellipse cx="'+(cx+dx)+'" cy="'+(CEIL+27)+'" rx="2" ry="3" fill="#fff060" opacity="0.8"/>':'';
    arms+='<path d="M'+cx+','+(CEIL+17)+' Q'+(cx+dx*0.7)+','+(CEIL+26)+' '+(cx+dx)+','+(CEIL+32)+'" fill="none" stroke="'+gc+'" stroke-width="2"/>'
      +'<ellipse cx="'+(cx+dx)+'" cy="'+(CEIL+35)+'" rx="5" ry="4" fill="'+gc+'"/>'+af;
  });
  return '<g><line x1="'+cx+'" y1="'+CEIL+'" x2="'+cx+'" y2="'+(CEIL+14)+'" stroke="#4a2c10" stroke-width="3"/>'
    +'<ellipse cx="'+cx+'" cy="'+(CEIL+17)+'" rx="22" ry="7" fill="'+gc+'"/>'+arms
    +'<rect x="'+(cx-4)+'" y="'+(CEIL+9)+'" width="8" height="10" fill="#f0e0c0" rx="1"/>'+flame+'</g>';
}

function _svgShelf(l){
  var x=10,y=202,w=75;
  if(l===0) return '';
  if(l===1) return '<g>'
    +'<rect x="'+(x+4)+'" y="'+(FLOOR-14)+'" width="24" height="12" fill="#882020" rx="1"/>'
    +'<rect x="'+(x+4)+'" y="'+(FLOOR-26)+'" width="22" height="12" fill="#203860" rx="1"/>'
    +'<rect x="'+(x+30)+'" y="'+(FLOOR-12)+'" width="20" height="10" fill="#285830" rx="1"/>'
    +'<rect x="'+(x+30)+'" y="'+(FLOOR-22)+'" width="18" height="10" fill="#604018" rx="1"/>'
    +'<rect x="'+(x+8)+'" y="'+(FLOOR-36)+'" width="17" height="10" fill="#882020" rx="1"/></g>';
  if(l===2){var b='',bk=['#882020','#203860','#285830','#604018'];
    for(var s=0;s<3;s++) for(var bi=0;bi<4;bi++) b+='<rect x="'+(x+6+bi*16)+'" y="'+(y+8+s*38)+'" width="13" height="27" fill="'+bk[bi]+'" rx="1"/>';
    return '<g><rect x="'+x+'" y="'+y+'" width="'+w+'" height="162" fill="#7a4c1e" rx="2"/>'
      +'<rect x="'+(x+4)+'" y="'+(y+4)+'" width="'+(w-8)+'" height="154" fill="#dfd0a8" rx="1"/>'
      +'<rect x="'+x+'" y="'+(y+36)+'" width="'+w+'" height="5" fill="#7a4c1e"/>'
      +'<rect x="'+x+'" y="'+(y+74)+'" width="'+w+'" height="5" fill="#7a4c1e"/>'
      +'<rect x="'+x+'" y="'+(y+112)+'" width="'+w+'" height="5" fill="#7a4c1e"/>'+b+'</g>';}
  var b3='',bk3=['#882020','#203860','#285830','#604018','#882020'];
  for(var s2=0;s2<4;s2++) for(var bi2=0;bi2<5;bi2++) b3+='<rect x="'+(x+5+bi2*13)+'" y="'+(y-7+s2*33)+'" width="11" height="24" fill="'+bk3[bi2]+'" rx="1"/>';
  return '<g><rect x="'+x+'" y="'+(y-14)+'" width="'+w+'" height="176" fill="#4a2c10" rx="3"/>'
    +'<rect x="'+(x+4)+'" y="'+(y-10)+'" width="'+(w-8)+'" height="168" fill="#dfd0a8" rx="1"/>'
    +'<rect x="'+(x-2)+'" y="'+(y-18)+'" width="'+(w+4)+'" height="6" fill="#4a2c10" rx="1"/>'
    +'<rect x="'+x+'" y="'+(y-14)+'" width="'+w+'" height="11" fill="#7a4c1e" rx="2"/>'
    +'<rect x="'+x+'" y="'+(y+8)+'" width="'+w+'" height="5" fill="#4a2c10"/>'
    +'<rect x="'+x+'" y="'+(y+41)+'" width="'+w+'" height="5" fill="#4a2c10"/>'
    +'<rect x="'+x+'" y="'+(y+74)+'" width="'+w+'" height="5" fill="#4a2c10"/>'
    +'<rect x="'+x+'" y="'+(y+107)+'" width="'+w+'" height="5" fill="#4a2c10"/>'+b3
    +'<ellipse cx="'+(x+18)+'" cy="'+(y-7)+'" rx="8" ry="4" fill="#c8a030"/></g>';
}

function _svgBed(l){
  var x=178,w=155;
  if(l===0) return '<g><rect x="'+x+'" y="'+(FLOOR-9)+'" width="'+w+'" height="9" fill="#c4b038" rx="1"/>'
    +'<line x1="'+(x+10)+'" y1="'+FLOOR+'" x2="'+(x+20)+'" y2="'+(FLOOR-9)+'" stroke="#a09008" stroke-width="1" opacity="0.5"/>'
    +'<line x1="'+(x+34)+'" y1="'+FLOOR+'" x2="'+(x+44)+'" y2="'+(FLOOR-9)+'" stroke="#a09008" stroke-width="1" opacity="0.5"/>'
    +'<line x1="'+(x+58)+'" y1="'+FLOOR+'" x2="'+(x+68)+'" y2="'+(FLOOR-9)+'" stroke="#a09008" stroke-width="1" opacity="0.5"/>'
    +'<line x1="'+(x+82)+'" y1="'+FLOOR+'" x2="'+(x+92)+'" y2="'+(FLOOR-9)+'" stroke="#a09008" stroke-width="1" opacity="0.5"/>'
    +'<line x1="'+(x+106)+'" y1="'+FLOOR+'" x2="'+(x+116)+'" y2="'+(FLOOR-9)+'" stroke="#a09008" stroke-width="1" opacity="0.5"/>'
    +'<line x1="'+(x+130)+'" y1="'+FLOOR+'" x2="'+(x+140)+'" y2="'+(FLOOR-9)+'" stroke="#a09008" stroke-width="1" opacity="0.5"/></g>';
  if(l===1) return '<g>'
    +'<rect x="'+x+'" y="'+(FLOOR-18)+'" width="'+w+'" height="18" fill="#d0c090" rx="2"/>'
    +'<rect x="'+(x+4)+'" y="'+(FLOOR-16)+'" width="'+(w-8)+'" height="14" fill="#e0d0a0" rx="1"/>'
    +'<rect x="'+x+'" y="'+(FLOOR-25)+'" width="'+(w*0.55)+'" height="9" fill="#9070b0" rx="2"/>'
    +'<rect x="'+(x+w*0.68)+'" y="'+(FLOOR-22)+'" width="44" height="12" fill="#d0cce0" rx="4"/></g>';
  if(l===2) return '<g>'
    +'<rect x="'+(x+6)+'" y="'+(FLOOR-14)+'" width="8" height="14" fill="#4a2c10"/>'
    +'<rect x="'+(x+w-14)+'" y="'+(FLOOR-14)+'" width="8" height="14" fill="#4a2c10"/>'
    +'<rect x="'+x+'" y="'+(FLOOR-38)+'" width="'+w+'" height="26" fill="#7a4c1e" rx="2"/>'
    +'<rect x="'+(x+3)+'" y="'+(FLOOR-47)+'" width="'+(w-6)+'" height="14" fill="#c0b8d0" rx="2"/>'
    +'<rect x="'+x+'" y="'+(FLOOR-66)+'" width="22" height="38" fill="#7a4c1e" rx="2"/>'
    +'<rect x="'+(x+3)+'" y="'+(FLOOR-63)+'" width="16" height="28" fill="#c88848" rx="1"/>'
    +'<rect x="'+(x+26)+'" y="'+(FLOOR-51)+'" width="'+(w-45)+'" height="16" fill="#7060a0" rx="2"/>'
    +'<rect x="'+(x+w*0.65)+'" y="'+(FLOOR-58)+'" width="50" height="14" fill="#d8d4e8" rx="4"/></g>';
  return '<g>'
    +'<rect x="'+(x+2)+'" y="'+(FLOOR-132)+'" width="6" height="126" fill="#4a2c10" rx="2"/>'
    +'<rect x="'+(x+w-8)+'" y="'+(FLOOR-132)+'" width="6" height="126" fill="#4a2c10" rx="2"/>'
    +'<rect x="'+x+'" y="'+(FLOOR-134)+'" width="'+w+'" height="8" fill="#4a2c10" rx="2"/>'
    +'<rect x="'+(x+4)+'" y="'+(FLOOR-136)+'" width="'+(w-8)+'" height="7" fill="#7858a8" rx="1"/>'
    +'<path d="M'+(x+2)+','+(FLOOR-126)+' Q'+(x+18)+','+(FLOOR-96)+' '+(x+2)+','+(FLOOR-42)+'" fill="#7858a8" opacity="0.5"/>'
    +'<path d="M'+(x+w-2)+','+(FLOOR-126)+' Q'+(x+w-18)+','+(FLOOR-96)+' '+(x+w-2)+','+(FLOOR-42)+'" fill="#7858a8" opacity="0.5"/>'
    +'<rect x="'+x+'" y="'+(FLOOR-46)+'" width="'+w+'" height="34" fill="#4a2c10" rx="3"/>'
    +'<rect x="'+(x+4)+'" y="'+(FLOOR-60)+'" width="'+(w-8)+'" height="20" fill="#b8b0d0" rx="3"/>'
    +'<rect x="'+(x+6)+'" y="'+(FLOOR-58)+'" width="'+(w-12)+'" height="16" fill="#d4d0e8" rx="2"/>'
    +'<rect x="'+x+'" y="'+(FLOOR-92)+'" width="26" height="58" fill="#4a2c10" rx="3"/>'
    +'<rect x="'+(x+3)+'" y="'+(FLOOR-89)+'" width="20" height="48" fill="#7a4c1e" rx="2"/>'
    +'<ellipse cx="'+(x+13)+'" cy="'+(FLOOR-73)+'" rx="8" ry="11" fill="#c88848"/>'
    +'<rect x="'+(x+w-22)+'" y="'+(FLOOR-74)+'" width="22" height="40" fill="#4a2c10" rx="2"/>'
    +'<rect x="'+(x+w-19)+'" y="'+(FLOOR-71)+'" width="16" height="30" fill="#7a4c1e" rx="1"/>'
    +'<rect x="'+(x+30)+'" y="'+(FLOOR-65)+'" width="'+(w-62)+'" height="18" fill="#7060a0" rx="3"/>'
    +'<rect x="'+(x+34)+'" y="'+(FLOOR-63)+'" width="'+(w-72)+'" height="14" fill="#8878b8" rx="2"/>'
    +'<rect x="'+(x+w*0.54)+'" y="'+(FLOOR-72)+'" width="46" height="18" fill="#eae6f8" rx="5"/>'
    +'<rect x="'+(x+w*0.54+48)+'" y="'+(FLOOR-70)+'" width="36" height="14" fill="#dcd8f0" rx="5"/></g>';
}

function _svgWard(l){
  var x=285,y=162,w=70,h=205;
  if(l===0) return '';
  if(l===1){var p='<line x1="'+x+'" y1="'+(y+22)+'" x2="'+(x+w)+'" y2="'+(y+22)+'" stroke="#7a4c1e" stroke-width="4"/>'
    +'<line x1="'+(x+12)+'" y1="'+y+'" x2="'+(x+12)+'" y2="'+(y+22)+'" stroke="#7a4c1e" stroke-width="2"/>'
    +'<line x1="'+(x+w-12)+'" y1="'+y+'" x2="'+(x+w-12)+'" y2="'+(y+22)+'" stroke="#7a4c1e" stroke-width="2"/>';
    ['#7858a8','#a06040','#3870a0'].forEach(function(cl,i){var ox=x+14+i*20;
      p+='<path d="M'+ox+','+(y+22)+' Q'+(ox-4)+','+(y+44)+' '+(ox-8)+','+(y+62)+' L'+(ox+8)+','+(y+62)+' Q'+(ox+12)+','+(y+44)+' '+(ox+8)+','+(y+22)+'" fill="'+cl+'" opacity="0.85"/>'
        +'<path d="M'+(ox+4)+','+(y+24)+' Q'+(ox+8)+','+(y+16)+' '+(ox+4)+','+(y+22)+'" fill="none" stroke="#888" stroke-width="1.5"/>';
    });
    return '<g>'+p+'</g>';}
  if(l===2){var hw=(w-20)/2;return '<g>'
    +'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="#7a4c1e" rx="3"/>'
    +'<rect x="'+(x+4)+'" y="'+(y+4)+'" width="'+(w-8)+'" height="'+(h-8)+'" fill="#c88848" rx="2"/>'
    +'<line x1="'+(x+w/2)+'" y1="'+y+'" x2="'+(x+w/2)+'" y2="'+(y+h)+'" stroke="#7a4c1e" stroke-width="3"/>'
    +'<rect x="'+(x+6)+'" y="'+(y+12)+'" width="'+hw+'" height="40" fill="#7a4c1e" opacity="0.3" rx="1"/>'
    +'<rect x="'+(x+9+hw)+'" y="'+(y+12)+'" width="'+hw+'" height="40" fill="#7a4c1e" opacity="0.3" rx="1"/>'
    +'<circle cx="'+(x+w/2-5)+'" cy="'+(y+70)+'" r="4" fill="#c8a030"/>'
    +'<circle cx="'+(x+w/2+5)+'" cy="'+(y+70)+'" r="4" fill="#c8a030"/>'
    +'<line x1="'+x+'" y1="'+(y+h*0.55)+'" x2="'+(x+w)+'" y2="'+(y+h*0.55)+'" stroke="#7a4c1e" stroke-width="2"/>'
    +'<rect x="'+(x+8)+'" y="'+(y+h*0.58)+'" width="'+(w-16)+'" height="20" fill="#7a4c1e" opacity="0.25" rx="1"/>'
    +'<circle cx="'+(x+w/2)+'" cy="'+(y+h*0.58+10)+'" r="3" fill="#c8a030"/></g>';}
  return '<g>'
    +'<rect x="'+(x-3)+'" y="'+y+'" width="'+(w+6)+'" height="'+h+'" fill="#4a2c10" rx="4"/>'
    +'<rect x="'+(x+3)+'" y="'+(y+5)+'" width="'+(w-6)+'" height="'+(h-10)+'" fill="#7a4c1e" rx="3"/>'
    +'<path d="M'+(x-3)+','+y+' Q'+(x+w/2)+','+(y-24)+' '+(x+w+3)+','+y+'" fill="#4a2c10"/>'
    +'<path d="M'+(x+4)+','+y+' Q'+(x+w/2)+','+(y-17)+' '+(x+w-4)+','+y+'" fill="#c88848"/>'
    +'<ellipse cx="'+(x+w/4+2)+'" cy="'+(y+36)+'" rx="14" ry="20" fill="#4a2c10" opacity="0.35"/>'
    +'<ellipse cx="'+(x+3*w/4-2)+'" cy="'+(y+36)+'" rx="14" ry="20" fill="#4a2c10" opacity="0.35"/>'
    +'<line x1="'+(x+w/2)+'" y1="'+(y+5)+'" x2="'+(x+w/2)+'" y2="'+(y+h-5)+'" stroke="#4a2c10" stroke-width="3"/>'
    +'<rect x="'+(x+w/2-12)+'" y="'+(y+76)+'" width="10" height="16" fill="#c8a030" rx="2"/>'
    +'<rect x="'+(x+w/2+2)+'" y="'+(y+76)+'" width="10" height="16" fill="#c8a030" rx="2"/>'
    +'<line x1="'+(x+3)+'" y1="'+(y+h*0.55)+'" x2="'+(x+w-3)+'" y2="'+(y+h*0.55)+'" stroke="#4a2c10" stroke-width="2"/>'
    +'<line x1="'+(x+3)+'" y1="'+(y+h*0.72)+'" x2="'+(x+w-3)+'" y2="'+(y+h*0.72)+'" stroke="#4a2c10" stroke-width="2"/>'
    +'<circle cx="'+(x+w/2)+'" cy="'+(y+h*0.580)+'" r="3" fill="#c8a030"/>'
    +'<circle cx="'+(x+w/2)+'" cy="'+(y+h*0.735)+'" r="3" fill="#c8a030"/>'
    +'<circle cx="'+(x+w/2)+'" cy="'+(y+h*0.890)+'" r="3" fill="#c8a030"/></g>';
}

function _svgFun(l){
  var x=82,fy=FLOOR-52,w=84;
  if(l===0) return '';
  if(l===1) return '<g>'
    +'<rect x="'+x+'" y="'+(fy+26)+'" width="'+w+'" height="8" fill="#7a4c1e" rx="1"/>'
    +'<rect x="'+(x+3)+'" y="'+(fy+34)+'" width="8" height="16" fill="#4a2c10"/>'
    +'<rect x="'+(x+w-11)+'" y="'+(fy+34)+'" width="8" height="16" fill="#4a2c10"/>'
    +'<rect x="'+(x+10)+'" y="'+(fy+12)+'" width="'+(w-20)+'" height="14" fill="#b09040" opacity="0.7" rx="1"/>'
    +'<circle cx="'+(x+14)+'" cy="'+(fy+18)+'" r="3.5" fill="#f0e0c0"/>'
    +'<circle cx="'+(x+28)+'" cy="'+(fy+14)+'" r="3.5" fill="#2a1808"/>'
    +'<circle cx="'+(x+50)+'" cy="'+(fy+18)+'" r="3.5" fill="#f0e0c0"/>'
    +'<circle cx="'+(x+70)+'" cy="'+(fy+15)+'" r="3.5" fill="#2a1808"/></g>';
  if(l===2) return '<g>'
    +'<rect x="'+(x-18)+'" y="'+(fy+16)+'" width="32" height="10" fill="#203860" rx="1"/>'
    +'<rect x="'+(x-16)+'" y="'+(fy+6)+'" width="28" height="10" fill="#882020" rx="1"/>'
    +'<rect x="'+(x-14)+'" y="'+(fy-4)+'" width="24" height="10" fill="#285830" rx="1"/>'
    +'<rect x="'+(x+18)+'" y="'+(fy+20)+'" width="62" height="8" fill="#7a4c1e" rx="2"/>'
    +'<rect x="'+(x+21)+'" y="'+(fy+28)+'" width="8" height="20" fill="#4a2c10" rx="1"/>'
    +'<rect x="'+(x+67)+'" y="'+(fy+28)+'" width="8" height="20" fill="#4a2c10" rx="1"/>'
    +'<rect x="'+(x+22)+'" y="'+(fy+4)+'" width="50" height="16" fill="#d4bc60" rx="1"/>'
    +'<rect x="'+(x+22)+'" y="'+(fy+4)+'" width="12.5" height="4" fill="#a07830"/>'
    +'<rect x="'+(x+22)+'" y="'+(fy+12)+'" width="12.5" height="4" fill="#a07830"/>'
    +'<rect x="'+(x+47)+'" y="'+(fy+4)+'" width="12.5" height="4" fill="#a07830"/>'
    +'<rect x="'+(x+47)+'" y="'+(fy+12)+'" width="12.5" height="4" fill="#a07830"/>'
    +'<circle cx="'+(x+28)+'" cy="'+(fy+10)+'" r="4" fill="#f0e8d0"/>'
    +'<circle cx="'+(x+41)+'" cy="'+(fy+7)+'" r="4" fill="#201008"/>'
    +'<circle cx="'+(x+55)+'" cy="'+(fy+10)+'" r="4" fill="#f0e8d0"/>'
    +'<circle cx="'+(x+68)+'" cy="'+(fy+7)+'" r="4" fill="#201008"/></g>';
  var st='';
  for(var i=0;i<14;i++){var sx=x+i*7.5-6,sy=fy+13+i*1.5;
    st+='<rect x="'+sx+'" y="'+sy+'" width="6" height="4" fill="#d0a050" rx="0.5"/>'
      +'<line x1="'+(sx+3)+'" y1="'+(fy+6+i)+'" x2="'+(sx+3)+'" y2="'+(fy+40+i)+'" stroke="#e0d0a0" stroke-width="0.8" opacity="0.85"/>';
  }
  return '<g><path d="M'+(x-14)+','+(fy+43)+' L'+(x+w+16)+','+(fy+47)+' L'+(x+w+16)+','+(fy+53)+' L'+(x-14)+','+(fy+49)+' Z" fill="#4a2c10"/>'
    +'<path d="M'+(x-12)+','+(fy+6)+' Q'+(x+w/2)+','+(fy+1)+' '+(x+w+12)+','+(fy+8)+' L'+(x+w+16)+','+(fy+47)+' L'+(x-14)+','+(fy+43)+' Z" fill="#c88848"/>'
    +'<path d="M'+(x-12)+','+(fy+6)+' Q'+(x+w/2)+','+(fy+1)+' '+(x+w+12)+','+(fy+8)+'" fill="none" stroke="#7a4c1e" stroke-width="2.5"/>'+st
    +'<rect x="'+(x+2)+'" y="'+(fy+43)+'" width="10" height="14" fill="#4a2c10" rx="2"/>'
    +'<rect x="'+(x+w-2)+'" y="'+(fy+44)+'" width="10" height="12" fill="#4a2c10" rx="2"/></g>';
}

// ── Chibi ─────────────────────────────────────────────────
function _svgMaster(cx,by){
  return '<g><path d="M'+(cx-12)+','+by+' Q'+cx+','+(by+12)+' '+(cx+12)+','+by+' L'+(cx+10)+','+(by-38)+' L'+(cx-10)+','+(by-38)+' Z" fill="#28304c"/>'
    +'<path d="M'+(cx-10)+','+(by-38)+' Q'+(cx-20)+','+(by-18)+' '+(cx-22)+','+(by+6)+'" fill="#28304c"/>'
    +'<path d="M'+(cx+10)+','+(by-38)+' Q'+(cx+20)+','+(by-18)+' '+(cx+22)+','+(by+6)+'" fill="#28304c"/>'
    +'<path d="M'+(cx-8)+','+(by-38)+' Q'+cx+','+(by-34)+' '+(cx+8)+','+(by-38)+'" fill="none" stroke="#c8a030" stroke-width="2"/>'
    +'<ellipse cx="'+cx+'" cy="'+(by-59)+'" rx="21" ry="22" fill="#f0d0a0"/>'
    +'<ellipse cx="'+cx+'" cy="'+(by-69)+'" rx="21" ry="13" fill="#181020"/>'
    +'<path d="M'+(cx-21)+','+(by-64)+' Q'+(cx-27)+','+(by-54)+' '+(cx-21)+','+(by-42)+'" fill="#181020"/>'
    +'<path d="M'+(cx+21)+','+(by-64)+' Q'+(cx+27)+','+(by-54)+' '+(cx+21)+','+(by-42)+'" fill="#181020"/>'
    +'<circle cx="'+(cx-7)+'" cy="'+(by-58)+'" r="2.5" fill="#181020"/>'
    +'<circle cx="'+(cx+7)+'" cy="'+(by-58)+'" r="2.5" fill="#181020"/>'
    +'<path d="M'+(cx-5)+','+(by-50)+' Q'+cx+','+(by-48)+' '+(cx+5)+','+(by-50)+'" fill="none" stroke="#904040" stroke-width="1.5"/>'
    +'<line x1="'+(cx-11)+'" y1="'+(by-63)+'" x2="'+(cx-4)+'" y2="'+(by-62)+'" stroke="#181020" stroke-width="1.5"/>'
    +'<line x1="'+(cx+4)+'" y1="'+(by-62)+'" x2="'+(cx+11)+'" y2="'+(by-63)+'" stroke="#181020" stroke-width="1.5"/>'
    +'<rect x="'+(cx-9)+'" y="'+by+'" width="8" height="18" fill="#181830" rx="2"/>'
    +'<rect x="'+(cx+1)+'" y="'+by+'" width="8" height="18" fill="#181830" rx="2"/></g>';
}
function _svgSlave(cx,by,c){ return _isMale(c)?_svgSlaveMale(cx,by):_svgSlaveFemale(cx,by); }
function _svgSlaveFemale(cx,by){
  return '<g><path d="M'+(cx-10)+','+by+' Q'+(cx+11)+','+(by+10)+' '+(cx+10)+','+by+' L'+(cx+8)+','+(by-34)+' L'+(cx-8)+','+(by-34)+' Z" fill="#d8c0e8"/>'
    +'<path d="M'+(cx-8)+','+(by-34)+' Q'+(cx-21)+','+(by+2)+' '+(cx-15)+','+(by+12)+' Q'+cx+','+(by+17)+' '+(cx+15)+','+(by+12)+' Q'+(cx+21)+','+(by+2)+' '+(cx+8)+','+(by-34)+'" fill="#c4a8d8"/>'
    +'<ellipse cx="'+(cx-12)+'" cy="'+(by-27)+'" rx="6" ry="5" fill="#d8c0e8"/>'
    +'<ellipse cx="'+(cx+12)+'" cy="'+(by-27)+'" rx="6" ry="5" fill="#d8c0e8"/>'
    +'<ellipse cx="'+cx+'" cy="'+(by-56)+'" rx="19" ry="20" fill="#f2d0a0"/>'
    +'<ellipse cx="'+cx+'" cy="'+(by-65)+'" rx="19" ry="11" fill="#d4a020"/>'
    +'<line x1="'+(cx-19)+'" y1="'+(by-60)+'" x2="'+(cx-23)+'" y2="'+(by-22)+'" stroke="#d4a020" stroke-width="10" stroke-linecap="round"/>'
    +'<line x1="'+(cx+19)+'" y1="'+(by-60)+'" x2="'+(cx+23)+'" y2="'+(by-22)+'" stroke="#d4a020" stroke-width="10" stroke-linecap="round"/>'
    +'<path d="M'+(cx-5)+','+(by-71)+' Q'+cx+','+(by-73)+' '+(cx+5)+','+(by-71)+'" fill="none" stroke="#e8c040" stroke-width="2" opacity="0.7"/>'
    +'<circle cx="'+(cx-6)+'" cy="'+(by-55)+'" r="2.5" fill="#4a3020"/>'
    +'<circle cx="'+(cx+6)+'" cy="'+(by-55)+'" r="2.5" fill="#4a3020"/>'
    +'<ellipse cx="'+(cx-9)+'" cy="'+(by-51)+'" rx="5" ry="3" fill="#e07880" opacity="0.35"/>'
    +'<ellipse cx="'+(cx+9)+'" cy="'+(by-51)+'" rx="5" ry="3" fill="#e07880" opacity="0.35"/>'
    +'<path d="M'+(cx-4)+','+(by-47)+' Q'+cx+','+(by-43)+' '+(cx+4)+','+(by-47)+'" fill="none" stroke="#c06050" stroke-width="1.5"/>'
    +'<line x1="'+(cx-9)+'" y1="'+(by-60)+'" x2="'+(cx-3)+'" y2="'+(by-59)+'" stroke="#4a3020" stroke-width="1.5"/>'
    +'<line x1="'+(cx+3)+'" y1="'+(by-59)+'" x2="'+(cx+9)+'" y2="'+(by-60)+'" stroke="#4a3020" stroke-width="1.5"/>'
    +'<rect x="'+(cx-6)+'" y="'+by+'" width="5" height="16" fill="#d8c0e8" rx="2"/>'
    +'<rect x="'+(cx+1)+'" y="'+by+'" width="5" height="16" fill="#d8c0e8" rx="2"/></g>';
}
function _svgSlaveMale(cx,by){
  return '<g><rect x="'+(cx-9)+'" y="'+by+'" width="8" height="16" fill="#506070" rx="2"/>'
    +'<rect x="'+(cx+1)+'" y="'+by+'" width="8" height="16" fill="#506070" rx="2"/>'
    +'<path d="M'+(cx-11)+','+by+' L'+(cx-11)+','+(by-36)+' L'+(cx+11)+','+(by-36)+' L'+(cx+11)+','+by+' Z" fill="#8090a8"/>'
    +'<rect x="'+(cx-5)+'" y="'+(by-38)+'" width="10" height="4" fill="#f0d4a8" rx="1"/>'
    +'<ellipse cx="'+(cx-14)+'" cy="'+(by-25)+'" rx="6" ry="5" fill="#8090a8"/>'
    +'<ellipse cx="'+(cx+14)+'" cy="'+(by-25)+'" rx="6" ry="5" fill="#8090a8"/>'
    +'<ellipse cx="'+cx+'" cy="'+(by-57)+'" rx="20" ry="21" fill="#f0d4a8"/>'
    +'<ellipse cx="'+cx+'" cy="'+(by-67)+'" rx="20" ry="11" fill="#2a1e14"/>'
    +'<rect x="'+(cx-14)+'" y="'+(by-75)+'" width="28" height="7" fill="#2a1e14" rx="3"/>'
    +'<rect x="'+(cx-20)+'" y="'+(by-68)+'" width="7" height="16" fill="#2a1e14" rx="3"/>'
    +'<rect x="'+(cx+13)+'" y="'+(by-68)+'" width="7" height="16" fill="#2a1e14" rx="3"/>'
    +'<circle cx="'+(cx-7)+'" cy="'+(by-56)+'" r="2.5" fill="#281828"/>'
    +'<circle cx="'+(cx+7)+'" cy="'+(by-56)+'" r="2.5" fill="#281828"/>'
    +'<line x1="'+(cx-4)+'" y1="'+(by-48)+'" x2="'+(cx+4)+'" y2="'+(by-48)+'" stroke="#906050" stroke-width="1.5" stroke-linecap="round"/>'
    +'<line x1="'+(cx-10)+'" y1="'+(by-62)+'" x2="'+(cx-3)+'" y2="'+(by-61)+'" stroke="#2a1e14" stroke-width="1.5"/>'
    +'<line x1="'+(cx+3)+'" y1="'+(by-61)+'" x2="'+(cx+10)+'" y2="'+(by-62)+'" stroke="#2a1e14" stroke-width="1.5"/></g>';
}

})();
