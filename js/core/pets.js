// ============================================================
// js/core/pets.js — 宠物系统 + CG图库 v3
// 新增: 多房间/背包/动画/气泡/图鉴弹窗/CG五比例相册/上传压缩
// ============================================================

// ══ CSS注入 ══════════════════════════════════════════════════
(function(){
  if(document.getElementById('pets-v3-css'))return;
  var s=document.createElement('style');s.id='pets-v3-css';
  s.textContent=[
    '@keyframes petBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}',
    '@keyframes petFloat{0%,100%{transform:translateY(0)rotate(-1deg)}50%{transform:translateY(-7px)rotate(1deg)}}',
    '@keyframes petWag{0%,100%{transform:rotate(0deg)}30%{transform:rotate(-8deg)}70%{transform:rotate(8deg)}}',
    '@keyframes petGlowPulse{0%,100%{filter:drop-shadow(0 0 5px rgba(255,210,60,.6))drop-shadow(0 0 10px rgba(255,180,0,.3))}50%{filter:drop-shadow(0 0 12px rgba(255,220,80,1))drop-shadow(0 0 20px rgba(255,200,0,.5))}}',
    '@keyframes evolveGlow{0%,100%{box-shadow:0 0 6px rgba(255,215,0,.4)}50%{box-shadow:0 0 14px rgba(255,215,0,.9),0 0 28px rgba(255,180,0,.5)}}',
    '#pet-room.anim-paused .pa-bounce,#pet-room.anim-paused .pa-float,#pet-room.anim-paused .pa-wag{animation-play-state:paused}',
    '@keyframes bubbleIn{0%{opacity:0;transform:scale(.5)translateY(6px)}100%{opacity:1;transform:scale(1)translateY(0)}}',
    '@keyframes bubbleOut{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-10px)}}',
    '@keyframes albumPop{0%{opacity:0;transform:scale(.9)}100%{opacity:1;transform:scale(1)}}',
    '@keyframes petStepR{0%,100%{transform:translateX(0)scaleX(1)}50%{transform:translateX(3px)scaleX(1)}}',
    '@keyframes petStepL{0%,100%{transform:translateX(0)scaleX(-1)}50%{transform:translateX(-3px)scaleX(-1)}}',
    '.pet-sel{animation:petGlowPulse 1.8s ease-in-out infinite}',
    '.pa-bounce{animation:petBounce 1.1s ease-in-out infinite}',
    '.pa-float{animation:petFloat 2.2s ease-in-out infinite}',
    '.pa-wag{animation:petWag .9s ease-in-out infinite}',
    '.pa-walk-r>div{animation:petStepR .4s ease-in-out infinite!important}',
    '.pa-walk-l>div{animation:petStepL .4s ease-in-out infinite!important}',
    '.pet-bubble{position:absolute;background:rgba(255,255,255,.96);border:1.5px solid rgba(200,170,130,.35);border-radius:14px;padding:5px 12px;font-size:.62rem;color:#5d4037;line-height:1.5;text-align:center;pointer-events:none;animation:bubbleIn .22s ease forwards;z-index:20;box-shadow:none;max-width:200px;min-width:60px;white-space:nowrap}',
    '.pet-bubble::after{content:"";position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);border:7px solid transparent;border-top-color:rgba(255,255,255,.96);border-bottom:0}',
    '.album-card{cursor:pointer;transition:transform .18s,box-shadow .18s;border-radius:12px;overflow:hidden;position:relative}',
    '.album-card:hover,.album-card:active{transform:scale(1.05)translateY(-3px);box-shadow:0 10px 28px rgba(0,0,0,.22)}',
    '.room-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.88);border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:6;box-shadow:0 2px 8px rgba(0,0,0,.2);font-size:1rem;padding:0}',
    '.room-nav:hover{background:#fff}',
    '.furniture{position:absolute;cursor:pointer;transition:filter .2s,opacity .2s}',
    '.furniture:hover{filter:brightness(1.25)}',
    '.pet-card-collapsed .pet-card-body{display:none}',
  ].join('');
  document.head.appendChild(s);
})();

// ══ IDB背景存储系统（支持最大20MB背景图）══════════════════
var _roomBgDb = null;
var _roomBgCache = {}; // roomId -> dataUrl | null
var _bgPrevPosX = 50, _bgPrevPosY = 50, _bgPrevSizeVal = 'cover';
var _bgPrevDragging = false, _bgPrevDragSt = {x:0,y:0,px:0,py:0};
var _bgPrevCurrentDataUrl = null;
var _pinchStartDist2 = 0, _pinchStartZoom2 = 100;

function _openRoomBgDb(cb){
  if(_roomBgDb){cb(_roomBgDb);return;}
  var req=indexedDB.open('eraqueen_room_bg',1);
  req.onupgradeneeded=function(e){e.target.result.createObjectStore('bgs');};
  req.onsuccess=function(e){_roomBgDb=e.target.result;cb(_roomBgDb);};
  req.onerror=function(){cb(null);};
}
function _saveRoomBgIdb(roomId,dataUrl,cb){
  _openRoomBgDb(function(db){
    if(!db){cb&&cb(false);return;}
    var tx=db.transaction('bgs','readwrite');
    tx.objectStore('bgs').put(dataUrl,roomId);
    tx.oncomplete=function(){_roomBgCache[roomId]=dataUrl;cb&&cb(true);};
    tx.onerror=function(){cb&&cb(false);};
  });
}
function _loadRoomBgIdb(roomId,cb){
  if(_roomBgCache[roomId]!==undefined){cb(_roomBgCache[roomId]);return;}
  _openRoomBgDb(function(db){
    if(!db){cb(null);return;}
    var req=db.transaction('bgs','readonly').objectStore('bgs').get(roomId);
    req.onsuccess=function(){_roomBgCache[roomId]=req.result||null;cb(_roomBgCache[roomId]);};
    req.onerror=function(){cb(null);};
  });
}
function _deleteRoomBgIdb(roomId,cb){
  _roomBgCache[roomId]=null;
  _openRoomBgDb(function(db){
    if(!db){cb&&cb();return;}
    var tx=db.transaction('bgs','readwrite');
    tx.objectStore('bgs').delete(roomId);
    tx.oncomplete=cb||function(){};
    tx.onerror=cb||function(){};
  });
}
function _preloadRoomBg(roomId){
  if(_roomBgCache[roomId]!==undefined)return;
  _roomBgCache[roomId]=null; // 标记加载中，防止重复请求
  _loadRoomBgIdb(roomId,function(url){
    _roomBgCache[roomId]=url;
    _renderPetMain();
  });
}


// ══ 宠物物种定义 ═══════════════════════════════════════════
var PET_SPECIES = {
  fox:{id:'fox',name:'狐狐克',icon:'🦊',price:0,desc:'一只毛茸茸的小狐狸，耳朵尖尖，尾巴蓬松。据说血统中混有灵狐基因，成长到极致可化人形。',
    anim:'pa-bounce',
    speechPool:['主人主人！','（尾巴卷成一团~）','今天有好吃的吗？','让我闻闻！','呜呜喵~','主人要去哪里？'],
    stages:[
      {name:'幼狐',icon:'🦊',desc:'圆滚滚的小毛球，走路还不太稳，但已经学会用大眼睛卖萌了。',minLevel:1},
      {name:'灵狐',icon:'🐺',desc:'矫健的青年狐狸，九条尾巴若隐若现，眼中透着灵性。',minLevel:10},
      {name:'狐仙',icon:'🧝',desc:'化为人形的狐仙，保留着狐耳和尾巴。妩媚又忠诚。',minLevel:25}
    ],
    feedStories:[['{petName}闻到食物的香味，小爪子扒拉你的手。','你把食物递过去，{petName}叼住后跑到角落，一边吃一边用尾巴护住碗。','吃完后，{petName}舔了舔嘴巴，用脑袋蹭你的手表示感谢。']],
    playStories:[['{petName}看到玩具球，耳朵立刻竖了起来。','你扔出球，{petName}箭一般冲出去，叼着球骄傲地跑回来。','反复几次后，{petName}累得趴在地上直喘气，尾巴还在开心地摇。']],
    petStories:[['{petName}主动凑到你身边，用脑袋拱你的手心。','你把它抱起来，{petName}乖乖窝在你怀里，温暖的小身体微微颤动。','过了一会儿，{petName}在你怀里睡着了，嘴角似乎带着笑意。']],
    washStories:[['{petName}一看到水盆就想跑，被你一把抓了回来。','温水冲洗着毛发，{petName}从抗拒变成了享受，发出舒服的「呜呜」声。','洗完后蓬松的毛球闪闪发亮，{petName}甩了甩身体，水珠四溅。']],
    restStories:[['{petName}打了个大大的哈欠，懒洋洋地蜷缩成一团。','你轻轻抚摸着它的背，它的呼吸渐渐均匀起来。','阳光透过窗户照在{petName}身上，一幅岁月静好的画面。']],
    evolveStories:[['一道柔和的光芒笼罩了{petName}的全身！','「嗷呜——」{petName}发出悠长的叫声，身体开始缓缓变化……','光芒散去，{petName}变得更加灵动美丽了。它用全新的姿态看着你，眼中满是信任。']]
  },
  gemini_cat:{id:'gemini_cat',name:'Gemini猫',icon:'🐱',price:3000,desc:'一只通体雪白的小猫咪，毛色如雪，圆圆的眼睛闪着柔和的光，软绵绵的脚步几乎没有声音。',
    anim:'pa-wag',
    speechPool:['喵~','……你在看什么。','咕噜咕噜♪','要摸我吗？','这样不对。','（打了个哈欠）'],
    stages:[
      {name:'小白猫',icon:'🐱',desc:'雪白柔软的小猫咪，好奇心旺盛，总爱用圆眼睛盯着你。',minLevel:1},
      {name:'智慧猫',icon:'😺',desc:'毛色渐变为星空色，瞳孔中倒映着代码。',minLevel:10},
      {name:'猫灵',icon:'🧙',desc:'化为人形的猫灵，保留猫耳和猫尾，优雅高冷。',minLevel:25}
    ],
    feedStories:[['{petName}优雅地走到碗边，先闻了闻，确认品质合格后才慢条斯理地吃起来。','「喵~」吃完后，{petName}用爪子洗了洗脸。']],
    playStories:[['{petName}追着激光笔的红点满屋子跑。','它精准地扑向每一个光点，仿佛在计算最优路径。']],
    petStories:[['{petName}跳到你的腿上，蜷缩成一个完美的圆。','它发出满足的呼噜声，尾巴慵懒地垂在一旁。']],
    washStories:[['{petName}极度抗拒洗澡，但你还是完成了任务。','洗完后的{petName}像一团蓬松的云，又白又软。']],
    restStories:[['{petName}找到了一束阳光，就地躺下开始打盹。','猫咪的睡姿千变万化，但每一种都很可爱。']],
    evolveStories:[['✨ {petName}的身上泛起星光！猫咪优雅地转了一圈，全身散发出柔和的白光……','光芒散去，一只更加美丽聪慧的猫咪出现在你面前。']]
  },
  gpt_dog:{id:'gpt_dog',name:'GPT狗',icon:'🐶',price:3000,desc:'一只圆滚滚的黑色小奶狗，毛色漆黑发亮，眼睛乌溜溜的，忠诚得令人心疼。',
    anim:'pa-bounce',
    speechPool:['汪！主人！！','要出去玩吗！','球球球球！！','我爱你！','汪汪~','找我了吗？！'],
    stages:[
      {name:'小黑狗',icon:'🐶',desc:'圆滚滚的黑色小奶狗，毛茸茸的，走路一摇一晃。',minLevel:1},
      {name:'黑犬',icon:'🦴',desc:'目光深邃的黑色大犬，毛色如墨，神态沉稳。',minLevel:10},
      {name:'犬神',icon:'🧑‍🦰',desc:'化为人形，忠厚老实，永远守护主人。',minLevel:25}
    ],
    feedStories:[['{petName}看到食物就疯狂摇尾巴，整个身体都在晃动。','「汪汪！」它一口就把食物吃完了，然后用期待的眼神看着你。']],
    playStories:[['{petName}叼着飞盘跑过来，放在你脚边，然后退后几步等你扔。','你使劲扔出飞盘，{petName}跳起来稳稳接住！']],
    petStories:[['{petName}翻过身来露出肚皮，尾巴疯狂摇摆。','你揉了揉它的肚子，它开心得直蹬腿。']],
    washStories:[['{petName}居然自己跳进了水里！它似乎很享受洗澡。','洗完后{petName}使劲甩水，溅了你一身。']],
    restStories:[['{petName}在你脚边趴下，把头搁在你的鞋上。','它的呼吸平稳而温暖，这份信赖让人心软。']],
    evolveStories:[['🌟 {petName}仰天长啸，金色的光芒从毛发中迸发！','忠诚之心化为力量，{petName}迎来了蜕变！']]
  },
  claude_fox:{id:'claude_fox',name:'Claude狐',icon:'🦊',price:5000,desc:'一只橙色的小狐狸，性格温和而睿智，说话总是很有条理。',
    anim:'pa-bounce',
    speechPool:['让我想想……','这个问题很有趣。','我在这里~','需要帮助吗？','（思考中）','嗯…有道理。'],
    stages:[
      {name:'小橙狐',icon:'🦊',desc:'橙色的小狐狸，目光温柔。',minLevel:1},
      {name:'智狐',icon:'🐺',desc:'身上泛着淡橙色光芒，思维敏捷。',minLevel:10},
      {name:'狐贤',icon:'🧑‍🏫',desc:'化为人形，温文尔雅的学者气质。',minLevel:25}
    ],
    feedStories:[['{petName}礼貌地等你放好食物，然后才优雅地进食。','「它连吃东西都这么有条理……」你感叹道。']],
    playStories:[['{petName}更喜欢智力游戏。你给它摆了个迷宫，它三两下就解开了。']],
    petStories:[['{petName}安静地靠在你身边，用温暖的眼神注视着你。','不需要言语，这份陪伴本身就是最好的安慰。']],
    washStories:[['{petName}配合地站在水盆里，安静地接受清洗。','洗完后橙色的毛发更加明亮了。']],
    restStories:[['{petName}在书架旁蜷成一团，似乎在思考什么深奥的问题。']],
    evolveStories:[['🟠 {petName}身上泛起温暖的橙色光芒……','智慧与温柔并存，{petName}完成了华丽的蜕变！']]
  },
  crab:{id:'crab',name:'小螃蟹',icon:'🦀',price:1500,desc:'一只红通通的小螃蟹，虽然小但脾气可不小，总爱挥舞钳子。',
    anim:'pa-wag',
    speechPool:['咔咔（挥钳子）','横着走！','我最强！','别惹我！','夹你咯~','咔嚓！'],
    stages:[
      {name:'小蟹',icon:'🦀',desc:'巴掌大的小红蟹，横着走路很可爱。',minLevel:1},
      {name:'铠蟹',icon:'🦞',desc:'体型变大，甲壳坚硬如铠甲。',minLevel:10},
      {name:'蟹将',icon:'🥷',desc:'化为人形，身披红色铠甲，武艺高强。',minLevel:25}
    ],
    feedStories:[['{petName}用钳子夹起食物，小心翼翼地送到嘴边。','吃完后满意地吐了几个泡泡。']],
    playStories:[['{petName}和你玩剪刀石头布，每次都出剪刀。','它似乎不明白为什么总是平局（你也出剪刀配合它）。']],
    petStories:[['{petName}举起钳子轻轻夹住你的手指，力道很轻很轻。','这是它表达亲近的方式。']],
    washStories:[['{petName}在水里自由自在地游来游去，开心极了。']],
    restStories:[['{petName}把自己埋进沙子里，只露出两只小眼睛。']],
    evolveStories:[['🦀 {petName}的甲壳迸发出红色光芒！','坚硬的外壳之下，蕴藏着惊人的力量！']]
  },
  ds_whale:{id:'ds_whale',name:'DeepSeek鲸',icon:'🐋',price:8000,desc:'一只深海小鲸鱼，能在空气中漂浮。性格安静深沉，喜欢思考。',
    anim:'pa-float',
    speechPool:['……（沉思中）','咕噜~','深海很冷。','（喷出水柱）','嗯……','让我深思一下。'],
    stages:[
      {name:'小鲸',icon:'🐋',desc:'漂浮在空中的迷你鲸鱼，时不时喷出小水柱。',minLevel:1},
      {name:'深渊鲸',icon:'🐳',desc:'身上闪烁着深海的荧光，散发神秘气息。',minLevel:10},
      {name:'鲸仙',icon:'🧜',desc:'化为人形，蓝发蓝眸，气质空灵飘渺。',minLevel:25}
    ],
    feedStories:[['{petName}张开大嘴，食物被吸了进去。','它满意地喷出一小柱水花，溅了你一脸。']],
    playStories:[['{petName}在房间里缓缓飘浮，你追着它跑了好几圈。','最后它停在你头顶，用尾巴轻轻拍了拍你的头。']],
    petStories:[['{petName}的皮肤光滑而温润，触感像丝绸一样。','你抚摸着它，它发出低沉而满足的歌声。']],
    washStories:[['{petName}本来就住在水里，洗澡对它来说就是回家。','它在水中欢快地翻了个身。']],
    restStories:[['{petName}漂浮在半空中，发出深海的回声，催人入眠。']],
    evolveStories:[['🌊 深海的力量在{petName}体内觉醒！','一道蓝色光柱冲天而起，{petName}完成了壮丽的进化！']]
  },
};

// ══ 全局状态 ═══════════════════════════════════════════════
var _selectedPetId=null;
var _petDragging=false;
var _petDragData=null;
var _petCardCollapsed=false;
var _petWalkPaused=false;   // 是否暂停行走
var _petBouncePaused=false; // 是否暂停跳跃动画
var _petWalkTimers={};      // 每只宠物的行走定时器 {petId: timerId}

// ══ 数据管理 ═══════════════════════════════════════════════
function getPetData(){try{return JSON.parse(localStorage.getItem('era_pets')||'{}');}catch(e){return {};}}
function savePetData(d){localStorage.setItem('era_pets',JSON.stringify(d));}

function _ensureRooms(data){
  if(!data.rooms||!data.rooms.length){
    data.rooms=[{id:'room_1',name:'温馨小窝',bg:'',furnitureState:{window:'closed',lamp:'off'}}];
  }
  if(data.currentRoomIdx===undefined)data.currentRoomIdx=0;
  if(!data.bag)data.bag=[];
  // 迁移旧宠物：如果宠物没有roomId，且不在背包里，放入第一个房间
  if(data.pets)data.pets.forEach(function(p){
    var inBag=data.bag.indexOf(p.id)>=0;
    if(!p.roomId&&!inBag)p.roomId=data.rooms[0].id;
  });
  return data;
}

function _getOrCreatePet(sid){
  var data=getPetData();if(!data.pets)data.pets=[];
  _ensureRooms(data);
  var pet=data.pets.find(function(p){return p.speciesId===sid;});
  if(!pet){
    var sp=PET_SPECIES[sid];if(!sp)return null;
    // 每买一只付费宠物送一个新房间
    var roomId=data.rooms[0].id;
    if(sp.price>0){
      var rn=data.rooms.length+1;
      var newRoom={id:'room_'+Date.now(),name:'小窝'+rn,bg:'',furnitureState:{window:'closed',lamp:'off'}};
      data.rooms.push(newRoom);
      roomId=newRoom.id;
    }
    pet={id:sid+'_'+Date.now(),speciesId:sid,name:sp.name,level:1,exp:0,
      hunger:80,mood:70,clean:90,stamina:100,affection:10,stage:0,
      avatarImg:null,stageAvatars:{},x:null,y:null,createdAt:Date.now(),roomId:roomId};
    data.pets.push(pet);savePetData(data);
  }
  return pet;
}
function _updatePet(pet){
  var data=getPetData();if(!data.pets)return;
  var idx=data.pets.findIndex(function(p){return p.id===pet.id;});
  if(idx>=0)data.pets[idx]=pet;
  savePetData(data);
}


// ══ 宠物物种专属房间主题 ══════════════════════════════════════
var PET_ROOM_THEMES = {
  fox:{
    bg:'linear-gradient(180deg,#2d1b3d 0%,#4a2c5a 45%,#3d2244 100%)',
    floor:'background:#3d2244;border-top:2px solid #7b5ba1',
    label:'🌙 灵狐居所',
    accent:'rgba(180,120,255,0.28)'
  },
  gemini_cat:{
    bg:'linear-gradient(180deg,#f0f8ff 0%,#ddeeff 55%,#c8dff0 100%)',
    floor:'background:#c8dff0;border-top:2px solid #b0c8e4',
    label:'☁️ 白猫阁楼',
    accent:'rgba(100,180,255,0.18)'
  },
  gpt_dog:{
    bg:'linear-gradient(180deg,#1a1a2e 0%,#16213e 55%,#0f3460 100%)',
    floor:'background:#1a2a40;border-top:2px solid #0f3460',
    label:'🔵 数字犬舍',
    accent:'rgba(0,120,255,0.18)'
  },
  claude_fox:{
    bg:'linear-gradient(180deg,#2d1f0e 0%,#3d2a10 55%,#4a3315 100%)',
    floor:'background:#3d2a10;border-top:2px solid #8b6914',
    label:'📚 智慧书房',
    accent:'rgba(200,140,20,0.18)'
  },
  crab:{
    bg:'linear-gradient(180deg,#001f3f 0%,#003366 55%,#004080 100%)',
    floor:'background:#003366;border-top:2px solid #005599',
    label:'🌊 深海礁岩',
    accent:'rgba(0,100,200,0.25)'
  },
  ds_whale:{
    bg:'linear-gradient(180deg,#000814 0%,#001d3d 55%,#003566 100%)',
    floor:'background:#001d3d;border-top:2px solid #003566',
    label:'🌌 深渊海域',
    accent:'rgba(0,80,160,0.28)'
  }
};
function _getRoomTheme(petsInRoom, room){
  // 优先用房间手动设置的主题
  if(room&&room._themeId&&PET_ROOM_THEMES[room._themeId])return PET_ROOM_THEMES[room._themeId];
  // 自定义背景图时不应用颜色主题
  if(room&&room.bg)return null;
  // 否则根据第一只宠物物种
  if(petsInRoom&&petsInRoom.length){
    var sid=petsInRoom[0].speciesId;
    return PET_ROOM_THEMES[sid]||null;
  }
  return null;
}

// ══ 房间家具定义 ═══════════════════════════════════════════
var ROOM_FURNITURE={
  default:[
    {id:'window',label:'窗户',
     states:{
       closed:{html:'<div style="width:50px;height:44px;background:linear-gradient(#cce,#bbdefb);border:3px solid #bcaaa4;border-radius:3px;position:relative"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:1px;height:100%;background:#bcaaa4"></div><div style="position:absolute;top:50%;left:0;right:0;height:1px;background:#bcaaa4"></div></div>',title:'窗户（关）'},
       open:{html:'<div style="width:50px;height:44px;background:linear-gradient(#e0f7fa,#b2ebf2);border:3px solid #bcaaa4;border-radius:3px;position:relative"><div style="font-size:.55rem;text-align:center;margin-top:8px">🌤️</div><div style="position:absolute;top:0;left:0;bottom:0;width:50%;transform:perspective(60px)rotateY(-30deg);transform-origin:left;background:rgba(255,255,255,.25);border-right:1px solid #bcaaa4"></div></div>',title:'窗户（开）'},
     },
     pos:{top:'6px',right:'18px'}
    },
    {id:'lamp',label:'灯',
     states:{
       off:{html:'<div style="font-size:1.2rem;filter:grayscale(1)">🪔</div>',title:'灯（关）'},
       on:{html:'<div style="font-size:1.2rem;filter:drop-shadow(0 0 6px gold)">🪔</div>',title:'灯（开）'},
     },
     pos:{top:'5px',left:'8px'}
    },
    {id:'scratcher',label:'猫爬架',
     states:{
       idle:{html:'<div style="width:28px;height:52px;background:linear-gradient(#a1887f,#8d6e63);border-radius:4px 4px 0 0"><div style="width:20px;height:8px;background:#bcaaa4;border-radius:2px;margin:4px auto"></div></div>',title:'猫爬架'},
     },
     pos:{bottom:'36px',left:'8px'}
    },
    {id:'bowl',label:'水碗',
     states:{
       full:{html:'<div style="width:30px;height:14px;background:linear-gradient(#bbdefb,#90caf9);border-radius:50%;position:relative"><div style="position:absolute;inset:3px 4px auto;height:4px;background:rgba(255,255,255,.6);border-radius:50%"></div></div>',title:'水碗（满）'},
       empty:{html:'<div style="width:30px;height:14px;background:#d7ccc8;border-radius:50%"></div>',title:'水碗（空）'},
     },
     pos:{bottom:'38px',right:'12px'}
    },
  ]
};

function _toggleFurniture(roomId,fid){
  var data=getPetData();_ensureRooms(data);
  var room=data.rooms.find(function(r){return r.id===roomId;});
  if(!room)return;
  if(!room.furnitureState)room.furnitureState={};
  var defs=ROOM_FURNITURE.default;
  var def=defs.find(function(f){return f.id===fid;});
  if(!def)return;
  var stateKeys=Object.keys(def.states);
  var cur=room.furnitureState[fid]||stateKeys[0];
  var idx=stateKeys.indexOf(cur);
  var next=stateKeys[(idx+1)%stateKeys.length];
  room.furnitureState[fid]=next;
  savePetData(data);
  _renderPetMain();
}

// ══ 主入口 ════════════════════════════════════════════════
function openPetSystem(){
  var data=getPetData();
  if(!data.pets||!data.pets.length){_getOrCreatePet('fox');data=getPetData();}
  _ensureRooms(data);
  _renderPetMain();
}

// ══ 主渲染 ════════════════════════════════════════════════
function _renderPetMain(){
  var data=getPetData();_ensureRooms(data);
  var body=document.getElementById('exp-detail-body');if(!body)return;
  _setExpDetailTitle('🦊 宠物系统');
  var rooms=data.rooms;
  var ri=Math.min(data.currentRoomIdx||0,rooms.length-1);
  var room=rooms[ri];
  var petsInRoom=(data.pets||[]).filter(function(p){return p.roomId===room.id;});
  var bag=data.bag||[];
  var petsInBag=(data.pets||[]).filter(function(p){return bag.indexOf(p.id)>=0;});

  var html='';

  // ── 房间面板 ──────────────────────────────────────────
  var roomBg=room.bg||'';
  var hasIdbBg=room.hasBg;
  var idbBgUrl=hasIdbBg?(_roomBgCache[room.id]):''; // undefined=未加载, null=加载中/失败, str=已加载
  if(hasIdbBg&&idbBgUrl===undefined){_preloadRoomBg(room.id);}
  var effectiveBg=hasIdbBg&&idbBgUrl?idbBgUrl:(roomBg||'');
  var theme=_getRoomTheme(petsInRoom, room);
  var roomStyle='position:relative;width:100%;height:210px;border-radius:14px;margin-bottom:4px;overflow:hidden;border:1px solid var(--bdr2);cursor:crosshair;user-select:none;';
  if(effectiveBg){
    var posX=room.bgPosX!==undefined?room.bgPosX:50;
    var posY=room.bgPosY!==undefined?room.bgPosY:50;
    var szv=room.bgSizeVal||'cover';
    roomStyle+='background-image:url('+effectiveBg+');background-position:'+posX+'% '+posY+'%;background-size:'+szv+';background-repeat:no-repeat;';
  }else if(theme)roomStyle+='background:'+theme.bg+';';
  else roomStyle+='background:linear-gradient(180deg,#e8f5e9 0%,#fff9c4 55%,#efebe9 100%);';

  html+='<div id="pet-room" style="'+roomStyle+'" onclick="_petRoomClick(event)" ontouchstart="_petTouchStart(event)" ontouchmove="_petTouchMove(event)" ontouchend="_petTouchEnd(event)">';
  if(!effectiveBg&&theme&&theme.accent){
    html+='<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 70% 30%,'+theme.accent+',transparent 70%);pointer-events:none;z-index:1"></div>';
  }

  // 家具
  if(!effectiveBg){
    var furState=room.furnitureState||{};
    ROOM_FURNITURE.default.forEach(function(def){
      var stateKeys=Object.keys(def.states);
      var cur=furState[def.id]||stateKeys[0];
      var st=def.states[cur]||def.states[stateKeys[0]];
      var pos='';
      for(var k in def.pos)pos+=k+':'+def.pos[k]+';';
      html+='<div class="furniture" style="position:absolute;z-index:2;'+pos+'" onclick="event.stopPropagation();_toggleFurniture(\''+room.id+'\',\''+def.id+'\')" title="'+st.title+'">'+st.html+'</div>';
    });
    // 地板（物种专属颜色）
    var floorStyle=theme?theme.floor:'background:#d7ccc8;border-top:2px solid #bcaaa4';
    html+='<div style="position:absolute;bottom:0;width:100%;height:38px;z-index:2;'+floorStyle+'"></div>';
  }

  // 房间切换按钮
  if(rooms.length>1){
    if(ri>0) html+='<button class="room-nav" style="left:4px" onclick="event.stopPropagation();_switchRoom(-1)">‹</button>';
    if(ri<rooms.length-1) html+='<button class="room-nav" style="right:4px" onclick="event.stopPropagation();_switchRoom(1)">›</button>';
  }

  // 房间名标签（显示物种主题标签）
  var themeLabel=theme?(' '+theme.label):'';
  html+='<div style="position:absolute;top:5px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.45);color:#fff;font-size:.6rem;padding:2px 10px;border-radius:12px;pointer-events:none;z-index:5;white-space:nowrap">'+esc(room.name)+themeLabel+' ('+(ri+1)+'/'+rooms.length+')</div>';

  // 宠物
  petsInRoom.forEach(function(pet){
    var sp=PET_SPECIES[pet.speciesId]||{stages:[{icon:'🐾'}],anim:'',speechPool:[]};
    var stg=sp.stages[pet.stage]||sp.stages[0];
    var px=pet.x!=null?pet.x:(20+(petsInRoom.indexOf(pet))*72);
    var py=pet.y!=null?pet.y:140;
    var isSel=pet.id===_selectedPetId;
    var anim=sp.anim||'';
    var selClass=isSel?' pet-sel':'';
    html+='<div class="pet-sprite'+selClass+'" data-petid="'+pet.id+'" onpointerdown="_petPointerDown(event,\''+pet.id+'\')" onclick="event.stopPropagation();_onPetClick(\''+pet.id+'\')" style="position:absolute;left:'+px+'px;top:'+py+'px;cursor:pointer;text-align:center;touch-action:none;user-select:none;z-index:'+(isSel?5:2)+';">';
    html+='<div class="'+anim+'" style="display:inline-block">';
    if(pet.stageAvatars&&pet.stageAvatars[pet.stage]){
      html+='<div style="width:44px;height:44px;border-radius:50%;overflow:hidden;border:2px solid '+(isSel?'rgba(0,0,0,0)':'transparent')+';margin:0 auto"><img src="'+pet.stageAvatars[pet.stage]+'" style="width:100%;height:100%;object-fit:cover" draggable="false"></div>';
    }else if(pet.avatarImg){
      html+='<div style="width:44px;height:44px;border-radius:50%;overflow:hidden;margin:0 auto"><img src="'+pet.avatarImg+'" style="width:100%;height:100%;object-fit:cover" draggable="false"></div>';
    }else{
      html+='<div style="font-size:2rem;line-height:1">'+stg.icon+'</div>';
    }
    html+='</div>';
    html+='<div style="font-size:.55rem;color:'+(theme?'rgba(255,255,255,0.92)':'#5d4037')+';font-weight:600;background:'+(theme?'rgba(0,0,0,0.38)':'rgba(255,255,255,0.6)')+';border-radius:6px;padding:1px 5px;margin-top:1px;backdrop-filter:blur(2px)" ondblclick="event.stopPropagation();renamePet(\''+pet.id+'\')">'+esc(pet.name)+'</div></div>';
  });

  html+='</div>';

  // 房间 + 动画行
  html+='<div style="display:flex;align-items:center;gap:4px;margin:-2px 0 6px;flex-wrap:wrap">';
  html+='<button class="btn btn-sm btn-ghost" style="font-size:.6rem;padding:3px 8px" onclick="_openRoomEditModal(\''+room.id+'\')">🏠 房间编辑</button>';
  html+='<button class="btn btn-sm btn-ghost" style="font-size:.6rem;padding:3px 8px" onclick="togglePetWalk()">'+(_petWalkPaused?'▶️行走':'⏸行走')+'</button>';
  html+='<button class="btn btn-sm btn-ghost" style="font-size:.6rem;padding:3px 8px" onclick="togglePetBounce()">'+(_petBouncePaused?'▶️动画':'⏸动画')+'</button>';
  html+='</div>';

  // ── 宠物卡片 ──────────────────────────────────────────
  var selPet=_selectedPetId?(data.pets||[]).find(function(p){return p.id===_selectedPetId;}):null;
  html+='<div id="pet-card" style="background:var(--card);border:1px solid var(--bdr2);border-radius:14px;margin-bottom:4px;overflow:hidden">';
  if(selPet){
    var sp2=PET_SPECIES[selPet.speciesId]||{stages:[{icon:'🐾',name:'?',desc:''}]};
    var stg2=sp2.stages[selPet.stage]||sp2.stages[0];
    // 卡片头部（去掉三角收起按钮）
    html+='<div style="display:flex;align-items:center;padding:8px 10px 6px;gap:8px;border-bottom:1px solid var(--bdr2)">';
    var avatarDblclick='event.stopPropagation();_openPetEditModal(\''+selPet.id+'\')';
    if(selPet.stageAvatars&&selPet.stageAvatars[selPet.stage]){
      html+='<div ondblclick="'+avatarDblclick+'" title="双击自定义" style="width:30px;height:30px;border-radius:50%;overflow:hidden;flex-shrink:0;cursor:pointer"><img src="'+selPet.stageAvatars[selPet.stage]+'" style="width:100%;height:100%;object-fit:cover"></div>';
    }else if(selPet.avatarImg){
      html+='<div ondblclick="'+avatarDblclick+'" title="双击自定义" style="width:30px;height:30px;border-radius:50%;overflow:hidden;flex-shrink:0;cursor:pointer"><img src="'+selPet.avatarImg+'" style="width:100%;height:100%;object-fit:cover"></div>';
    }else{
      html+='<div ondblclick="'+avatarDblclick+'" title="双击自定义" style="font-size:1.6rem;flex-shrink:0;cursor:pointer">'+stg2.icon+'</div>';
    }
    html+='<div style="flex:1;min-width:0">';
    html+='<div ondblclick="event.stopPropagation();_openPetEditModal(\''+selPet.id+'\')" title="双击自定义" style="font-weight:800;font-size:.82rem;color:var(--txt);cursor:pointer">'+esc(selPet.name)+'</div>';
    html+='<div style="font-size:.58rem;color:var(--muted)">Lv.'+selPet.level+' · <span ondblclick="event.stopPropagation();_editLvName(\''+selPet.id+'\','+selPet.stage+')" title="双击编辑等级名" style="cursor:text">'+esc(_getLvName(selPet)||stg2.name)+'</span></div></div>';
    // 换房间（内联，紧贴在右侧）
    if(rooms.length>1){
      html+='<div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap">';
      rooms.forEach(function(r){
        if(r.id===room.id)return;
        html+='<button class="btn btn-sm btn-ghost" style="font-size:.55rem;padding:2px 5px" onclick="_movePetToRoom(\''+selPet.id+'\',\''+r.id+'\')">→'+esc(r.name)+'</button>';
      });
      html+='</div>';
    }
    html+='</div>';
    // 卡片主体
    html+='<div class="pet-card-body" style="padding:10px 12px">';
    html+='<div style="display:flex;gap:10px;align-items:flex-start">';
    // 状态条
    html+='<div style="flex:1;min-width:0">';
    [{k:'hunger',l:'饱腹',i:'🍖',c:'#ff9800'},{k:'mood',l:'心情',i:'😊',c:'#4caf50'},{k:'clean',l:'清洁',i:'🫧',c:'#42a5f5'},{k:'stamina',l:'体力',i:'💪',c:'#ff5722'},{k:'affection',l:'好感',i:'❤️',c:'#e91e63'}].forEach(function(b){
      var v=Math.round(selPet[b.k]||0);
      html+='<div style="display:flex;align-items:center;gap:4px;margin-bottom:3px"><span style="font-size:.65rem;width:14px">'+b.i+'</span><span style="font-size:.57rem;color:var(--txt2);width:24px">'+b.l+'</span><div style="flex:1;height:4px;background:var(--bdr);border-radius:2px;overflow:hidden"><div style="height:100%;width:'+v+'%;background:'+b.c+';border-radius:2px;transition:width .3s"></div></div><span style="font-size:.55rem;color:var(--muted);width:18px;text-align:right">'+v+'</span></div>';
    });
    var expN=selPet.level*20,expP=Math.min(100,Math.round((selPet.exp||0)/expN*100));
    html+='<div style="display:flex;align-items:center;gap:4px;margin-top:4px"><span style="font-size:.65rem;width:14px">⭐</span><span style="font-size:.57rem;color:var(--txt2);width:24px">EXP</span><div style="flex:1;height:4px;background:var(--bdr);border-radius:2px;overflow:hidden"><div style="height:100%;width:'+expP+'%;background:#ffc107;border-radius:2px;transition:width .3s"></div></div><span style="font-size:.55rem;color:var(--muted);width:30px;text-align:right">'+selPet.exp+'/'+expN+'</span></div>';
    html+='</div>';
    // 操作按钮
    var canEvolve=selPet.stage<(sp2.stages.length-1)&&selPet.level>=(sp2.stages[selPet.stage+1]||{minLevel:999}).minLevel;
    html+='<div style="display:flex;flex-direction:column;gap:3px;flex-shrink:0">';
    html+='<button class="btn btn-sm" style="font-size:.6rem;padding:3px 7px;background:rgba(255,152,0,.1);color:#ff9800;border:1px solid rgba(255,152,0,.2)" onclick="petAction(\''+selPet.id+'\',\'feed\')">🍖喂食</button>';
    html+='<button class="btn btn-sm" style="font-size:.6rem;padding:3px 7px;background:rgba(76,175,80,.1);color:#4caf50;border:1px solid rgba(76,175,80,.2)" onclick="petAction(\''+selPet.id+'\',\'play\')">🎾玩耍</button>';
    html+='<button class="btn btn-sm" style="font-size:.6rem;padding:3px 7px;background:rgba(66,165,245,.1);color:#42a5f5;border:1px solid rgba(66,165,245,.2)" onclick="petAction(\''+selPet.id+'\',\'wash\')">🛁洗澡</button>';
    html+='<button class="btn btn-sm" style="font-size:.6rem;padding:3px 7px;background:rgba(121,85,72,.08);color:#795548;border:1px solid rgba(121,85,72,.15)" onclick="petAction(\''+selPet.id+'\',\'rest\')">😴休息</button>';
    html+='<button class="btn btn-sm" style="font-size:.6rem;padding:3px 7px;background:rgba(233,30,99,.1);color:#e91e63;border:1px solid rgba(233,30,99,.2)" onclick="petAction(\''+selPet.id+'\',\'pet\')">🤗亲密</button>';

    html+='</div></div>';
    html+='</div></div>';
  }else{
    html+='<div style="text-align:center;padding:14px 10px;font-size:.72rem;color:var(--muted)">点一下房间里的宠物 🐾<br><span style="font-size:.6rem;opacity:.7">双击头像或名字可自定义</span></div>';
  }
  html+='</div>';

  // ── 宠物操作行（自定义 + 进化）──────────────────────
  html+='<div class="pet-action-bar" style="display:flex;gap:4px;margin-bottom:6px;flex-wrap:wrap;align-items:center">';
  if(selPet){
    var canEvolve2=selPet.stage<((PET_SPECIES[selPet.speciesId]||{stages:[]}).stages.length-1)&&selPet.level>=((PET_SPECIES[selPet.speciesId]||{stages:[]}).stages[selPet.stage+1]||{minLevel:999}).minLevel;
    html+='<button class="btn btn-sm btn-ghost" style="font-size:.6rem;padding:3px 8px" onclick="_openPetEditModal(\''+selPet.id+'\')">✏️ 宠物自定义</button>';
    if(canEvolve2) html+='<button class="btn btn-sm" style="font-size:.6rem;padding:3px 8px;background:rgba(255,215,0,.18);color:#f9a825;border:1px solid rgba(255,215,0,.4);font-weight:700;animation:evolveGlow 1.5s ease-in-out infinite" onclick="petEvolve(\''+selPet.id+'\')">✨ 进化</button>';
    else html+='<button class="btn btn-sm" disabled style="font-size:.6rem;padding:3px 8px;opacity:.28;cursor:not-allowed">🔒 进化</button>';
  }
  html+='</div>';

  // ── 背包弹窗（改为弹出式，不再常驻列表）──────────────

  // ── 功能按钮 ──────────────────────────────────────────
  html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:8px">';
  html+='<button class="btn btn-ghost" style="font-size:.68rem" onclick="openPetShop()">🏪 商店</button>';
  html+='<button class="btn btn-ghost" style="font-size:.68rem" onclick="_openBagModal(\''+room.id+'\')">🎒 背包'+(petsInBag.length?'('+petsInBag.length+')':'')+'</button>';
  html+='<button class="btn btn-ghost" style="font-size:.68rem" onclick="openPetGuidebook()">📖 图鉴</button>';
  html+='</div>';
  html+='<button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-exp-detail\')" style="font-size:.72rem">关闭</button>';

  body.innerHTML=html;
  openOv('ov-exp-detail');
  // 渲染完成后启动行走
  setTimeout(_startPetWalkSystem, 100);
}

// ── LV等级名（自定义存储）──────────────────────────────
function _getLvName(pet){
  try{
    var d=JSON.parse(localStorage.getItem('era_pet_lvnames')||'{}');
    return d[pet.id+'_'+pet.stage]||null;
  }catch(e){return null;}
}
function _setLvName(petId,stageIdx,name){
  try{
    var d=JSON.parse(localStorage.getItem('era_pet_lvnames')||'{}');
    d[petId+'_'+stageIdx]=name;
    localStorage.setItem('era_pet_lvnames',JSON.stringify(d));
  }catch(e){}
}
function _editLvName(petId,stageIdx){
  var data=getPetData();var pet=(data.pets||[]).find(function(p){return p.id===petId;});
  if(!pet)return;
  var sp=PET_SPECIES[pet.speciesId]||{stages:[]};
  var stg=sp.stages[stageIdx]||{name:'未知'};
  var cur=_getLvName(pet)||stg.name;
  _showInputModal('✏️ 编辑等级名','名称（留空恢复默认）',cur,function(nv){
    if(nv===null||nv===undefined)return;
    _setLvName(petId,stageIdx,nv.trim()||stg.name);
    _renderPetMain();
  });
  return;
}

// ── 房间管理 ─────────────────────────────────────────────
function _switchRoom(dir){
  var data=getPetData();_ensureRooms(data);
  var ri=(data.currentRoomIdx||0)+dir;
  ri=Math.max(0,Math.min(data.rooms.length-1,ri));
  data.currentRoomIdx=ri;
  savePetData(data);
  _selectedPetId=null;_renderPetMain();
}

// ══ 通用可视化输入弹窗（替代所有 prompt()）══════════════════
function _showInputModal(title, label, defaultVal, cb){
  var ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.68);z-index:9800;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(10px)';
  ov.onclick=function(e){if(e.target===ov){ov.remove();}};
  var sheet=document.createElement('div');
  sheet.style.cssText='background:var(--card);border-radius:20px;padding:22px;max-width:280px;width:100%;animation:albumPop .2s ease;box-shadow:0 20px 60px rgba(0,0,0,.5)';
  sheet.innerHTML=
    '<div style="font-size:.92rem;font-weight:800;color:var(--txt);margin-bottom:4px;text-align:center">'+title+'</div>'+
    '<div style="font-size:.68rem;color:var(--muted);text-align:center;margin-bottom:16px">'+label+'</div>'+
    '<input id="_sim_inp" maxlength="16" value="'+defaultVal.replace(/"/g,'&quot;')+'" style="width:100%;padding:10px 12px;font-size:.88rem;border:2px solid var(--bdr2);border-radius:11px;background:var(--card2);color:var(--txt);box-sizing:border-box;outline:none;text-align:center">'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px">'+
    '<button id="_sim_cancel" style="padding:9px;border-radius:11px;border:1.5px solid var(--bdr2);background:transparent;color:var(--txt2);font-size:.82rem;cursor:pointer">取消</button>'+
    '<button id="_sim_ok" style="padding:9px;border-radius:11px;border:none;background:var(--acc);color:#fff;font-size:.82rem;font-weight:700;cursor:pointer">确定</button>'+
    '</div>';
  ov.appendChild(sheet);
  document.body.appendChild(ov);
  var inp=sheet.querySelector('#_sim_inp');
  if(inp){inp.focus();inp.select();}
  sheet.querySelector('#_sim_cancel').onclick=function(){ov.remove();};
  sheet.querySelector('#_sim_ok').onclick=function(){
    var v=inp?inp.value.trim():'';
    ov.remove();
    if(cb)cb(v||null);
  };
  if(inp)inp.addEventListener('keydown',function(e){if(e.key==='Enter')sheet.querySelector('#_sim_ok').click();});
}
function _addRoom(){
  _showInputModal('🏠 新建房间','房间名称','房间'+(getPetData().rooms.length+1),function(n){
    if(!n)return;
    var data=getPetData();_ensureRooms(data);
    data.rooms.push({id:'room_'+Date.now(),name:n.trim().slice(0,10),bg:'',furnitureState:{window:'closed',lamp:'off'}});
    data.currentRoomIdx=data.rooms.length-1;
    savePetData(data);_renderPetMain();
  });
}
function _renameRoom(roomId){
  var data=getPetData();var room=data.rooms&&data.rooms.find(function(r){return r.id===roomId;});
  if(!room)return;
  _showInputModal('✏️ 房间改名','新名称',room.name,function(n){
    if(!n)return;
    room.name=n.trim().slice(0,10);
    savePetData(data);_renderPetMain();
  });
}
function _deleteRoom(roomId){
  var data=getPetData();_ensureRooms(data);
  if(data.rooms.length<=1){toast('至少保留一个房间','');return;}
  var inRoom=(data.pets||[]).filter(function(p){return p.roomId===roomId;});
  if(inRoom.length){
    openCustomConfirm('🗑️ 删除房间','房间内有'+inRoom.length+'只宠物，删除后它们将收入背包。','确认删除',function(){
      inRoom.forEach(function(p){p.roomId=null;if(!data.bag)data.bag=[];if(data.bag.indexOf(p.id)<0)data.bag.push(p.id);});
      data.rooms=data.rooms.filter(function(r){return r.id!==roomId;});
      data.currentRoomIdx=Math.min(data.currentRoomIdx||0,data.rooms.length-1);
      savePetData(data);_selectedPetId=null;_renderPetMain();
    });
  }else{
    data.rooms=data.rooms.filter(function(r){return r.id!==roomId;});
    data.currentRoomIdx=Math.min(data.currentRoomIdx||0,data.rooms.length-1);
    savePetData(data);_renderPetMain();
  }
}
function _movePetToRoom(petId,targetRoomId){
  var data=getPetData();var pet=(data.pets||[]).find(function(p){return p.id===petId;});
  if(!pet)return;
  pet.roomId=targetRoomId;
  // 从背包移除
  if(data.bag){var bi=data.bag.indexOf(petId);if(bi>=0)data.bag.splice(bi,1);}
  pet.x=null;pet.y=null;
  _updatePet(pet);
  _selectedPetId=null;_renderPetMain();
  toast('已搬到新房间~','ok');
}
function _sendPetToBag(petId,roomId){
  var data=getPetData();var pet=(data.pets||[]).find(function(p){return p.id===petId;});
  if(!pet)return;
  pet.roomId=null;
  if(!data.bag)data.bag=[];
  if(data.bag.indexOf(petId)<0)data.bag.push(petId);
  savePetData(data);_selectedPetId=null;_renderPetMain();
  toast('宠物已收入背包','');
}
function _releasePetFromBag(petId,roomId){
  var data=getPetData();var pet=(data.pets||[]).find(function(p){return p.id===petId;});
  if(!pet)return;
  pet.roomId=roomId;
  if(data.bag){var bi=data.bag.indexOf(petId);if(bi>=0)data.bag.splice(bi,1);}
  pet.x=null;pet.y=null;
  savePetData(data);_renderPetMain();
  toast('宠物已放入当前房间~','ok');
}

// ── 背包弹窗 ─────────────────────────────────────────────
function _openBagModal(roomId){
  var data=getPetData();_ensureRooms(data);
  var bag=data.bag||[];
  var petsInBag=(data.pets||[]).filter(function(p){return bag.indexOf(p.id)>=0;});
  var ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px';
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  var box=document.createElement('div');
  box.style.cssText='background:var(--card);border-radius:18px;padding:16px;width:100%;max-width:340px;max-height:70vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.3)';
  var h='<div style="display:flex;align-items:center;margin-bottom:12px">';
  h+='<span style="font-size:1.1rem">🎒</span>';
  h+='<span style="font-weight:700;font-size:.9rem;color:var(--txt);flex:1;margin-left:6px">背包</span>';
  h+='<button onclick="this.closest(\'div[style*=fixed]\').remove()" style="background:none;border:none;color:var(--muted);font-size:1.2rem;cursor:pointer;padding:0">×</button>';
  h+='</div>';
  if(!petsInBag.length){
    h+='<div style="text-align:center;padding:20px;font-size:.75rem;color:var(--muted)">背包是空的 🐾<br><span style="font-size:.62rem">点击宠物卡片自定义里的"收入背包"可将宠物收入</span></div>';
  }else{
    h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">';
    petsInBag.forEach(function(pet){
      var sp3=PET_SPECIES[pet.speciesId]||{stages:[{icon:'🐾'}]};
      var stg3=sp3.stages[pet.stage]||sp3.stages[0];
      h+='<div style="text-align:center;padding:10px 4px;background:var(--card2);border-radius:12px;cursor:pointer" onclick="_releasePetFromBag(\''+pet.id+'\',\''+roomId+'\');this.closest(\'div[style*=fixed]\').remove()" title="放入当前房间">';
      if(pet.avatarImg){h+='<div style="width:40px;height:40px;border-radius:50%;overflow:hidden;margin:0 auto 4px"><img src="'+pet.avatarImg+'" style="width:100%;height:100%;object-fit:cover"></div>';}
      else{h+='<div style="font-size:1.8rem">'+stg3.icon+'</div>';}
      h+='<div style="font-size:.62rem;font-weight:600;color:var(--txt);margin-top:2px">'+esc(pet.name)+'</div>';
      h+='<div style="font-size:.52rem;color:var(--acc)">放入此房间</div>';
      h+='</div>';
    });
    h+='</div>';
  }
  box.innerHTML=h;
  ov.appendChild(box);
  document.body.appendChild(ov);
}

// ── 宠物自定义编辑弹窗 ───────────────────────────────────
function _openPetEditModal(petId){
  var data=getPetData();
  var pet=(data.pets||[]).find(function(p){return p.id===petId;});
  if(!pet)return;
  var sp=PET_SPECIES[pet.speciesId]||{stages:[{icon:'🐾',name:'?'}]};
  var ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px';
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  var box=document.createElement('div');
  box.style.cssText='background:var(--card);border-radius:18px;padding:18px;width:100%;max-width:320px;box-shadow:0 8px 32px rgba(0,0,0,.3)';
  var stg=sp.stages[pet.stage]||sp.stages[0];
  var avatarSrc=pet.avatarImg||'';
  box.innerHTML=
    '<div style="display:flex;align-items:center;margin-bottom:14px">'+
    '<span style="font-size:1.1rem">✏️</span>'+
    '<span style="font-weight:700;font-size:.9rem;color:var(--txt);flex:1;margin-left:6px">自定义宠物</span>'+
    '<button onclick="this.closest(\'div[style*=fixed]\').remove()" style="background:none;border:none;color:var(--muted);font-size:1.2rem;cursor:pointer;padding:0">×</button>'+
    '</div>'+
    '<div style="text-align:center;margin-bottom:14px">'+
    '<div id="_edit_avatar_preview" style="width:60px;height:60px;border-radius:50%;overflow:hidden;margin:0 auto 6px;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:2rem;cursor:pointer" onclick="document.getElementById(\'_edit_avatar_input\').click()">'+
    (avatarSrc?'<img src="'+avatarSrc+'" style="width:100%;height:100%;object-fit:cover">':stg.icon)+
    '</div>'+
    '<div style="font-size:.58rem;color:var(--muted)">点击头像更换图片</div>'+
    '<input id="_edit_avatar_input" type="file" accept="image/*" style="display:none">'+
    '</div>'+
    '<div style="margin-bottom:10px">'+
    '<div style="font-size:.65rem;color:var(--muted);margin-bottom:4px">宠物名字</div>'+
    '<input id="_edit_pet_name" type="text" value="'+esc(pet.name)+'" style="width:100%;padding:6px 10px;border:1px solid var(--bdr2);border-radius:8px;font-size:.78rem;color:var(--txt);background:var(--card2);box-sizing:border-box">'+
    '</div>'+
    '<div style="display:flex;gap:8px;margin-top:14px">'+
    '<button onclick="_sendPetToBag(\''+petId+'\',\''+pet.roomId+'\');this.closest(\'div[style*=fixed]\').remove()" style="flex:1;padding:8px;background:rgba(255,152,0,.1);color:#ff9800;border:1px solid rgba(255,152,0,.3);border-radius:10px;font-size:.7rem;cursor:pointer">📦 收入背包</button>'+
    '<button id="_edit_save_btn" onclick="_savePetEdit(\''+petId+'\')" style="flex:1;padding:8px;background:var(--acc);color:#fff;border:none;border-radius:10px;font-size:.7rem;cursor:pointer;font-weight:600">保存</button>'+
    '</div>'+
    (pet.avatarImg?'<button onclick="_resetPetAvatar(\''+petId+'\')" style="width:100%;margin-top:6px;padding:7px;border-radius:10px;border:1px solid var(--bdr2);background:transparent;color:var(--muted);font-size:.65rem;cursor:pointer">🔄 恢复默认图标</button>':'');
  ov.appendChild(box);
  document.body.appendChild(ov);
  // 图片上传预览
  var fileInput=document.getElementById('_edit_avatar_input');
  if(fileInput){
    fileInput.onchange=function(){
      var file=this.files[0];if(!file)return;
      var reader=new FileReader();
      reader.onload=function(e){
        var preview=document.getElementById('_edit_avatar_preview');
        if(preview)preview.innerHTML='<img src="'+e.target.result+'" style="width:100%;height:100%;object-fit:cover">';
        window._editPetNewAvatar=e.target.result;
      };
      reader.readAsDataURL(file);
    };
  }
  window._editPetNewAvatar=null;
}
function _savePetEdit(petId){
  var nameEl=document.getElementById('_edit_pet_name');
  var newName=nameEl?nameEl.value.trim():'';
  if(!newName)return;
  var data=getPetData();
  var pet=(data.pets||[]).find(function(p){return p.id===petId;});
  if(!pet)return;
  pet.name=newName;
  if(window._editPetNewAvatar){pet.avatarImg=window._editPetNewAvatar;window._editPetNewAvatar=null;}
  savePetData(data);
  var ov=document.querySelector('div[style*="z-index: 9000"],div[style*="z-index:9000"]');
  if(ov)ov.remove();
  _renderPetMain();
  toast('已保存~','ok');
}
function _resetPetAvatar(petId){
  var data=getPetData();
  var pet=(data.pets||[]).find(function(p){return p.id===petId;});
  if(!pet)return;
  pet.avatarImg=null;
  savePetData(data);
  var ov=document.querySelector('div[style*="z-index: 9000"],div[style*="z-index:9000"]');
  if(ov)ov.remove();
  _renderPetMain();
  openPetGuidebook();
  toast('已恢复默认图标','ok');
}

// ── 宠物点击气泡 ─────────────────────────────────────────
function _onPetClick(petId){
  _selectedPetId=petId;
  _petCardCollapsed=false;
  // 显示气泡
  var data=getPetData();var pet=(data.pets||[]).find(function(p){return p.id===petId;});
  if(pet){
    var sp=PET_SPECIES[pet.speciesId]||{speechPool:[]};
    var pool=sp.speechPool||[];
    if(pool.length){
      var text=pool[Math.floor(Math.random()*pool.length)];
      _showPetBubble(petId,text);
    }
  }
  _renderPetMain();
}
function _showPetBubble(petId,text){
  setTimeout(function(){
    var sprite=document.querySelector('.pet-sprite[data-petid="'+petId+'"]');
    if(!sprite)return;
    var old=sprite.querySelector('.pet-bubble');if(old)old.remove();
    var bub=document.createElement('div');
    bub.className='pet-bubble';
    bub.textContent=text;
    bub.style.bottom='54px';
    bub.style.left='50%';
    bub.style.transform='translateX(-50%)';
    sprite.appendChild(bub);
    setTimeout(function(){
      bub.style.animation='bubbleOut .4s ease forwards';
      setTimeout(function(){if(bub.parentNode)bub.remove();},400);
    },2800);
  },50);
}

// ── 房间交互 ─────────────────────────────────────────────
function _petRoomClick(e){
  if(e.target.closest&&e.target.closest('.pet-sprite'))return;
  if(e.target.closest&&e.target.closest('.furniture'))return;
  if(e.target.closest&&e.target.closest('.room-nav'))return;
  if(e.target.closest&&e.target.closest('.pet-action-bar'))return;
  _selectedPetId=null;_renderPetMain();
}

// ── 宠物行走系统 ──────────────────────────────────────────
function _startPetWalkSystem(){
  // 清除旧定时器
  Object.keys(_petWalkTimers).forEach(function(id){clearInterval(_petWalkTimers[id]);});
  _petWalkTimers={};
  if(_petWalkPaused)return;
  var data=getPetData();_ensureRooms(data);
  var roomIdx=data.currentRoomIdx||0;
  var room=data.rooms[roomIdx];if(!room)return;
  var petsInRoom=(data.pets||[]).filter(function(p){return p.roomId===room.id;});
  petsInRoom.forEach(function(pet){
    _scheduleNextWalk(pet.id);
  });
}
function _scheduleNextWalk(petId){
  if(_petWalkPaused)return;
  // 随机等待2~6秒后开始走一步
  var delay=(2000+Math.random()*4000)|0;
  _petWalkTimers[petId]=setTimeout(function(){
    if(_petWalkPaused){_scheduleNextWalk(petId);return;}
    var data=getPetData();
    var pet=(data.pets||[]).find(function(p){return p.id===petId;});
    if(!pet)return;
    var sprite=document.querySelector('.pet-sprite[data-petid="'+petId+'"]');
    if(!sprite){_scheduleNextWalk(petId);return;}
    // 随机目标x（在房间宽度内）
    var roomEl=document.getElementById('pet-room');
    if(!roomEl){_scheduleNextWalk(petId);return;}
    var roomW=roomEl.offsetWidth;
    var curX=parseInt(sprite.style.left)||0;
    var targetX=Math.max(10,Math.min(roomW-60,(curX+(-60+Math.random()*120))|0));
    var dir=targetX>curX?'r':'l';
    var dist=Math.abs(targetX-curX);
    var duration=dist/40*1000; // 每像素约25ms
    // 加行走class
    sprite.classList.add('pa-walk-'+dir);
    var inner=sprite.querySelector('div');
    if(inner&&!_petBouncePaused){inner.style.animationPlayState='paused';}
    // 平滑移动
    var startX=curX,startT=Date.now();
    var moveTimer=requestAnimationFrame(function step(){
      var t=Math.min(1,(Date.now()-startT)/duration);
      var x=startX+(targetX-startX)*t;
      sprite.style.left=x+'px';
      if(t<1){requestAnimationFrame(step);}
      else{
        // 保存新位置
        var d=getPetData();
        var p=(d.pets||[]).find(function(q){return q.id===petId;});
        if(p){p.x=Math.round(x);p.y=pet.y;savePetData(d);}
        sprite.classList.remove('pa-walk-r','pa-walk-l');
        if(inner){inner.style.animationPlayState=_petBouncePaused?'paused':'';}
        _scheduleNextWalk(petId);
      }
    });
  },delay);
}
function _stopPetWalk(){
  Object.keys(_petWalkTimers).forEach(function(id){clearTimeout(_petWalkTimers[id]);clearInterval(_petWalkTimers[id]);});
  _petWalkTimers={};
  document.querySelectorAll('.pet-sprite').forEach(function(s){s.classList.remove('pa-walk-r','pa-walk-l');});
}
function togglePetWalk(){
  _petWalkPaused=!_petWalkPaused;
  if(_petWalkPaused){_stopPetWalk();}
  else{_startPetWalkSystem();}
  _renderPetMain();
}
function togglePetBounce(){
  _petBouncePaused=!_petBouncePaused;
  // 用 class 控制，re-render 后仍有效
  var room=document.getElementById('pet-room');
  if(room){
    if(_petBouncePaused) room.classList.add('anim-paused');
    else room.classList.remove('anim-paused');
  }
  _renderPetMain();
  // 渲染后重新应用 class（因为 innerHTML 重建了）
  setTimeout(function(){
    var r=document.getElementById('pet-room');
    if(r){ if(_petBouncePaused) r.classList.add('anim-paused'); else r.classList.remove('anim-paused'); }
  },30);
}
function _petPointerDown(e,petId){
  e.preventDefault();e.stopPropagation();
  var room=document.getElementById('pet-room');if(!room)return;
  var sprite=e.target.closest('.pet-sprite');if(!sprite)return;
  _petDragging=false;
  _petDragData={petId:petId,startX:e.clientX,startY:e.clientY,
    origLeft:parseInt(sprite.style.left)||0,origTop:parseInt(sprite.style.top)||0,
    sprite:sprite,rect:room.getBoundingClientRect(),moved:false};
  sprite.setPointerCapture(e.pointerId);
  sprite.onpointermove=_petPointerMove;
  sprite.onpointerup=sprite.onpointercancel=_petPointerUp;
}
function _petPointerMove(e){
  if(!_petDragData)return;
  var dx=e.clientX-_petDragData.startX,dy=e.clientY-_petDragData.startY;
  if(Math.abs(dx)>6||Math.abs(dy)>6)_petDragging=true;
  if(!_petDragging)return;
  var nx=Math.max(0,Math.min(_petDragData.rect.width-52,_petDragData.origLeft+dx));
  var ny=Math.max(0,Math.min(_petDragData.rect.height-64,_petDragData.origTop+dy));
  _petDragData.sprite.style.left=nx+'px';
  _petDragData.sprite.style.top=ny+'px';
  _petDragData.moved=true;
}
function _petPointerUp(e){
  if(!_petDragData)return;
  var wasDrag=_petDragging&&_petDragData.moved;
  _petDragging=false;
  if(wasDrag){
    var nx=parseInt(_petDragData.sprite.style.left),ny=parseInt(_petDragData.sprite.style.top);
    var data=getPetData();var pet=data.pets&&data.pets.find(function(p){return p.id===_petDragData.petId;});
    if(pet){pet.x=nx;pet.y=ny;_updatePet(pet);}
  }
  _petDragData.sprite.onpointermove=null;
  _petDragData.sprite.onpointerup=null;
  _petDragData=null;
  if(!wasDrag)_renderPetMain();
}
function _petTouchStart(e){}
function _petTouchMove(e){}
function _petTouchEnd(e){}

// ── 宠物互动 ────────────────────────────────────────────
function petAction(petId,action){
  var data=getPetData();var pet=data.pets&&data.pets.find(function(p){return p.id===petId;});
  if(!pet)return;var sp=PET_SPECIES[pet.speciesId];if(!sp)return;
  var acts={
    feed:{pool:sp.feedStories,stat:{hunger:20,mood:5,exp:3},check:'hunger',max:95,msg:'已经很饱了~'},
    play:{pool:sp.playStories,stat:{mood:15,stamina:-10,affection:5,exp:5},check:'stamina',min:10,msg:'太累了，让它休息一下'},
    wash:{pool:sp.washStories,stat:{clean:30,mood:5,exp:2}},
    rest:{pool:sp.restStories,stat:{stamina:25,mood:5,exp:2}},
    pet:{pool:sp.petStories,stat:{affection:10,mood:10,exp:4}},
  };
  var cfg=acts[action];if(!cfg)return;
  if(cfg.check&&cfg.max&&(pet[cfg.check]||0)>=cfg.max){toast(pet.name+cfg.msg,'');return;}
  if(cfg.check&&cfg.min&&(pet[cfg.check]||0)<cfg.min){toast(pet.name+cfg.msg,'');return;}
  for(var k in cfg.stat){
    if(k==='exp')pet.exp=(pet.exp||0)+cfg.stat[k];
    else pet[k]=Math.max(0,Math.min(100,(pet[k]||0)+cfg.stat[k]));
  }
  var expN=pet.level*20;
  while(pet.exp>=expN&&pet.level<50){pet.exp-=expN;pet.level++;expN=pet.level*20;toast('🎉 '+pet.name+' 升级到 Lv.'+pet.level+'!','ok');}
  _updatePet(pet);
  var pool=cfg.pool||[['（互动中……）']];
  var story=pool[Math.floor(Math.random()*pool.length)].map(function(p){return p.replace(/\{petName\}/g,pet.name);});
  if(typeof applyStoryPlaceholders==='function')story=story.map(function(p){return applyStoryPlaceholders(p);});
  var labels={feed:'🍖 喂食',play:'🎾 玩耍',wash:'🛁 洗澡',rest:'😴 休息',pet:'🤗 亲密'};
  if(typeof openStoryModal==='function')openStoryModal({title:labels[action]+' · '+pet.name,story:story,noSplit:true},'宠物互动',{});
  setTimeout(function(){_renderPetMain();},200);
}
function petEvolve(petId){
  var data=getPetData();var pet=data.pets&&data.pets.find(function(p){return p.id===petId;});
  if(!pet)return;var sp=PET_SPECIES[pet.speciesId];if(!sp)return;
  if(pet.stage>=sp.stages.length-1)return;
  var next=sp.stages[pet.stage+1];if(pet.level<next.minLevel){toast('需要 Lv.'+next.minLevel+' 才能进化','');return;}
  pet.stage++;_updatePet(pet);
  var story=(sp.evolveStories||[['进化成功！']])[0].map(function(p){return p.replace(/\{petName\}/g,pet.name);});
  if(typeof openStoryModal==='function')openStoryModal({title:'✨ '+pet.name+' 进化为「'+(sp.stages[pet.stage]||{}).name+'」！',story:story,noSplit:true},'宠物进化',{});
  setTimeout(function(){_renderPetMain();},200);
}
function renamePet(petId){
  var data=getPetData();var pet=data.pets&&data.pets.find(function(p){return p.id===petId;});
  if(!pet)return;
  var body=document.getElementById('exp-detail-body');if(!body)return;
  _setExpDetailTitle('✏️ 给宠物改名');
  body.innerHTML='<div style="text-align:center;margin-bottom:14px;font-size:2.2rem">'+(PET_SPECIES[pet.speciesId]?(PET_SPECIES[pet.speciesId].stages[pet.stage]||{}).icon||'🐾':'🐾')+'</div>'+
    '<input type="text" id="pet-rename-input" value="'+esc(pet.name)+'" maxlength="8" style="width:100%;padding:10px;font-size:.88rem;border:1px solid var(--bdr2);border-radius:8px;background:var(--card2);color:var(--txt);box-sizing:border-box;margin-bottom:12px;text-align:center">'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="btn btn-ghost" onclick="openPetSystem()">取消</button><button class="btn btn-p" onclick="_confirmPetRename(\''+petId+'\')">确认</button></div>';
}
function _confirmPetRename(pid){
  var inp=document.getElementById('pet-rename-input');var n=inp?inp.value.trim():'';
  if(!n){toast('名字不能为空','');return;}
  var data=getPetData();var pet=data.pets&&data.pets.find(function(p){return p.id===pid;});
  if(!pet)return;pet.name=n.slice(0,8);_updatePet(pet);toast('改名成功！','ok');openPetSystem();
}
function openPetDetail(pid){
  var data=getPetData();var pet=data.pets&&data.pets.find(function(p){return p.id===pid;});
  if(!pet)return;var sp=PET_SPECIES[pet.speciesId]||{};var stg=(sp.stages||[])[pet.stage]||{name:'?',desc:''};
  openCustomConfirm(stg.icon+' '+pet.name,'<div style="padding:8px;font-size:.84rem;color:var(--txt2);line-height:1.8"><b>种族：</b>'+(sp.name||'')+'<br><b>阶段：</b>'+stg.name+'<br><b>等级：</b>Lv.'+pet.level+'<br><b>描述：</b>'+stg.desc+'<br><br><div style="font-size:.75rem;color:var(--muted)">'+(sp.desc||'')+'</div></div>','知道了',function(){});
}
function openPetUploadAvatar(){
  if(!_selectedPetId){toast('请先选择一只宠物','');return;}
  var inp=document.createElement('input');inp.type='file';inp.accept='image/*';
  inp.onchange=function(){var f=inp.files&&inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){
    var img=new Image();img.onload=function(){var cv=document.createElement('canvas');cv.width=400;cv.height=400;var ctx=cv.getContext('2d');
    var sc=400/Math.min(img.width,img.height);var w=img.width*sc,h=img.height*sc;ctx.beginPath();ctx.arc(200,200,200,0,Math.PI*2);ctx.clip();ctx.drawImage(img,(400-w)/2,(400-h)/2,w,h);
    var url=cv.toDataURL('image/jpeg',0.85);var data=getPetData();var pet=data.pets&&data.pets.find(function(p){return p.id===_selectedPetId;});
    if(pet){pet.avatarImg=url;_updatePet(pet);toast('形象已更新！','ok');_renderPetMain();}};img.src=ev.target.result;};r.readAsDataURL(f);};inp.click();
}
function _uploadRoomBg(){
  var data=getPetData();_ensureRooms(data);
  var ri=data.currentRoomIdx||0;
  var room=data.rooms[ri];
  if(room) _uploadRoomBgWithPreview(room.id,null);
}


// ══ 房间编辑弹窗 ════════════════════════════════════════════
function _openRoomEditModal(roomId){
  var data=getPetData();_ensureRooms(data);
  var room=data.rooms.find(function(r){return r.id===roomId;})||data.rooms[0];
  if(!room)return;
  var r2=room;
  var ov=document.createElement('div');
  ov.id='_room_edit_ov';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.68);z-index:9700;display:flex;align-items:flex-end;padding:0;backdrop-filter:blur(10px)';
  ov.onclick=function(e){if(e.target===ov)ov.remove();};

  var themes=[
    {id:'',label:'默认自然',icon:'🌿'},
    {id:'fox',label:'灵狐居所',icon:'🌙'},
    {id:'gemini_cat',label:'白猫阁楼',icon:'☁️'},
    {id:'gpt_dog',label:'数字犬舍',icon:'🔵'},
    {id:'claude_fox',label:'智慧书房',icon:'📚'},
    {id:'crab',label:'深海礁岩',icon:'🌊'},
    {id:'ds_whale',label:'深渊海域',icon:'🌌'},
  ];
  var curThemeId=r2._themeId||'';

  var sheet=document.createElement('div');
  sheet.style.cssText='background:var(--card);border-radius:20px 20px 0 0;padding:18px 16px 32px;width:100%;max-height:82vh;overflow-y:auto;animation:slideUp .22s ease';
  
  // Build theme grid
  var themeGrid='';
  themes.forEach(function(t){
    var isSel=curThemeId===t.id;
    var prevBg=t.id&&PET_ROOM_THEMES[t.id]?PET_ROOM_THEMES[t.id].bg:'linear-gradient(180deg,#e8f5e9,#fff9c4)';
    themeGrid+='<div id="rt_'+t.id+'" style="cursor:pointer;border-radius:10px;overflow:hidden;border:2px solid '+(isSel?'var(--acc)':'var(--bdr2)')+'">'+
      '<div style="height:36px;background:'+prevBg+'"></div>'+
      '<div style="padding:3px 2px;text-align:center;font-size:.52rem;color:var(--txt2)">'+t.icon+'<br>'+t.label+'</div>'+
    '</div>';
  });

  var _hasCusBg=r2.hasBg||r2.bg;
  var _cusBgUrl=r2.hasBg?(_roomBgCache[roomId]||''):r2.bg;
  var bgPreview=_hasCusBg
    ?('<div id="_rp" style="height:90px;border-radius:12px;background:'+((_cusBgUrl)?'url('+_cusBgUrl+') center/cover':'var(--card2)')+';border:2px solid var(--bdr2);cursor:pointer;overflow:hidden;position:relative"><div style=\"position:absolute;inset:0;background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center\"><span style=\"color:#fff;font-size:.8rem\">点击更换</span></div></div>')
    :'<div id="_rp" style="height:90px;border-radius:12px;background:var(--card2);border:2px dashed var(--bdr2);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.78rem;color:var(--muted)">📷 点击上传自定义背景</div>';

  sheet.innerHTML=
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'+
      '<div style="font-size:.95rem;font-weight:800;color:var(--txt)">🏠 房间编辑</div>'+
      '<button id="_redit_x" style="background:var(--card2);border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;color:var(--muted);font-size:14px">✕</button>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">'+
      '<button id="_redit_rename" style="padding:11px 8px;border-radius:12px;border:1.5px solid var(--bdr2);background:var(--card2);color:var(--txt);font-size:.76rem;cursor:pointer">✏️ 改名</button>'+
      '<button id="_redit_add" style="padding:11px 8px;border-radius:12px;border:1.5px solid var(--bdr2);background:var(--card2);color:var(--txt);font-size:.76rem;cursor:pointer">＋ 新房间</button>'+
    '</div>'+
    '<div style="font-size:.72rem;font-weight:700;color:var(--txt2);margin-bottom:8px">🎨 选择背景主题</div>'+
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:14px">'+themeGrid+'</div>'+
    '<div style="font-size:.72rem;font-weight:700;color:var(--txt2);margin-bottom:8px">📸 自定义背景</div>'+
    bgPreview+
    (_hasCusBg?'<button id="_redit_clearbg" style="width:100%;padding:7px;border-radius:10px;border:1px solid var(--bdr2);background:transparent;color:var(--muted);font-size:.68rem;cursor:pointer;margin-top:8px">🗑️ 清除自定义背景</button>':'')+
    (data.rooms.length>1?'<button id="_redit_del" style="width:100%;padding:9px;border-radius:12px;border:1px solid rgba(229,57,53,.3);background:rgba(229,57,53,.06);color:#e53935;font-size:.72rem;cursor:pointer;margin-top:12px">🗑️ 删除此房间</button>':'');

  ov.appendChild(sheet);
  document.body.appendChild(ov);

  // Bind events
  sheet.querySelector('#_redit_x').onclick=function(){ov.remove();};
  sheet.querySelector('#_redit_rename').onclick=function(){ov.remove();_renameRoom(roomId);};
  sheet.querySelector('#_redit_add').onclick=function(){ov.remove();_addRoom();};
  var delBtn=sheet.querySelector('#_redit_del');
  if(delBtn)delBtn.onclick=function(){ov.remove();_deleteRoom(roomId);};
  var clearBtn=sheet.querySelector('#_redit_clearbg');
  if(clearBtn)clearBtn.onclick=function(){_clearRoomBg(roomId);ov.remove();};
  
  // Theme click handlers
  themes.forEach(function(t){
    var el=sheet.querySelector('#rt_'+t.id);
    if(el)el.onclick=function(){_setRoomTheme(roomId,t.id);ov.remove();};
  });

  // Upload preview
  var rp=sheet.querySelector('#_rp');
  if(rp)rp.onclick=function(){_uploadRoomBgWithPreview(roomId,function(){ov.remove();});};
}

function _setRoomTheme(roomId,themeId){
  var data=getPetData();_ensureRooms(data);
  var room=data.rooms.find(function(r){return r.id===roomId;});
  if(!room)return;
  room._themeId=themeId;
  // ★ 不再自动清除自定义背景；用户需主动点击"清除"才会清除
  savePetData(data);_renderPetMain();
  toast('主题已切换','ok');
}

function _clearRoomBg(roomId){
  var data=getPetData();_ensureRooms(data);
  var room=data.rooms.find(function(r){return r.id===roomId;});
  if(!room)return;
  room.bg='';room.hasBg=false;room.bgPosX=50;room.bgPosY=50;room.bgSizeVal='cover';
  // 删除IDB里的数据
  _deleteRoomBgIdb(roomId);
  savePetData(data);_renderPetMain();toast('背景已清除','ok');
}

function _uploadRoomBgWithPreview(roomId,doneCb){
  var inp=document.createElement('input');inp.type='file';inp.accept='image/*';
  inp.onchange=function(){
    var f=inp.files&&inp.files[0];if(!f)return;
    if(f.size>20*1024*1024){toast('图片超过20MB限制','err');return;}
    var reader=new FileReader();
    reader.onload=function(ev){
      _bgPrevCurrentDataUrl=ev.target.result;
      _bgPrevPosX=50;_bgPrevPosY=50;_bgPrevSizeVal='cover';
      _showBgPreviewModal(roomId,doneCb);
    };
    reader.readAsDataURL(f);
  };
  inp.click();
}

function _showBgPreviewModal(roomId,doneCb){
  var ex=document.getElementById('_bgprev_ov');if(ex)ex.remove();
  var ov=document.createElement('div');
  ov.id='_bgprev_ov';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.93);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;box-sizing:border-box';
  ov.innerHTML=
    '<div style="color:#fff;font-size:.9rem;font-weight:700;flex-shrink:0">🖼️ 调整背景位置与大小</div>'+
    '<div id="_bgprev_box" style="width:100%;max-width:360px;aspect-ratio:3/2;border-radius:12px;overflow:hidden;border:2px solid rgba(255,255,255,.3);cursor:grab;touch-action:none;position:relative;background:#111;flex-shrink:0">'+
      '<div id="_bgprev_img" style="position:absolute;inset:0;background-image:url(\''+_bgPrevCurrentDataUrl+'\');background-position:50% 50%;background-size:cover;background-repeat:no-repeat;will-change:background-position,background-size"></div>'+
      '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none"><div style="border:1px dashed rgba(255,255,255,.25);width:55%;height:55%;border-radius:8px"></div></div>'+
    '</div>'+
    '<div style="color:rgba(255,255,255,.45);font-size:.58rem;flex-shrink:0">拖拽移动 · 滑条或双指捏合缩放</div>'+
    '<div style="width:100%;max-width:360px;display:flex;align-items:center;gap:8px;flex-shrink:0">'+
      '<span style="color:#fff;font-size:.72rem">🔍</span>'+
      '<input id="_bgprev_zoom" type="range" min="30" max="400" step="5" value="100" style="flex:1;accent-color:#e91e63">'+
      '<span id="_bgprev_zv" style="color:#fff;font-size:.68rem;width:36px;text-align:right">100%</span>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:360px;flex-shrink:0">'+
      '<button id="_bgprev_cancel" style="padding:12px;border-radius:12px;border:1.5px solid rgba(255,255,255,.3);background:transparent;color:#fff;font-size:.82rem;cursor:pointer">取消</button>'+
      '<button id="_bgprev_ok" style="padding:12px;border-radius:12px;border:none;background:#e91e63;color:#fff;font-size:.82rem;font-weight:700;cursor:pointer">确认保存</button>'+
    '</div>';
  document.body.appendChild(ov);

  var imgDiv=document.getElementById('_bgprev_img');
  var box=document.getElementById('_bgprev_box');
  var zSlider=document.getElementById('_bgprev_zoom');
  var zLabel=document.getElementById('_bgprev_zv');

  function applyBg(){
    if(!imgDiv)return;
    imgDiv.style.backgroundPosition=_bgPrevPosX+'% '+_bgPrevPosY+'%';
    imgDiv.style.backgroundSize=_bgPrevSizeVal;
  }

  // 拖拽
  box.onpointerdown=function(e){
    if(e.pointerId!==undefined&&e.touches&&e.touches.length>1)return;
    _bgPrevDragging=true;
    _bgPrevDragSt={x:e.clientX,y:e.clientY,px:_bgPrevPosX,py:_bgPrevPosY};
    box.style.cursor='grabbing';
    try{box.setPointerCapture(e.pointerId);}catch(er){}
    e.preventDefault();
  };
  box.onpointermove=function(e){
    if(!_bgPrevDragging)return;
    var rect=box.getBoundingClientRect();
    var dx=(e.clientX-_bgPrevDragSt.x)/rect.width*100;
    var dy=(e.clientY-_bgPrevDragSt.y)/rect.height*100;
    _bgPrevPosX=Math.max(0,Math.min(100,_bgPrevDragSt.px-dx));
    _bgPrevPosY=Math.max(0,Math.min(100,_bgPrevDragSt.py-dy));
    applyBg();
  };
  box.onpointerup=box.onpointercancel=function(){_bgPrevDragging=false;box.style.cursor='grab';};

  // 双指缩放
  box.addEventListener('touchstart',function(e){
    if(e.touches.length===2){
      var dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
      _pinchStartDist2=Math.sqrt(dx*dx+dy*dy);
      _pinchStartZoom2=parseInt(zSlider.value)||100;
      e.preventDefault();
    }
  },{passive:false});
  box.addEventListener('touchmove',function(e){
    if(e.touches.length===2){
      var dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
      var dist=Math.sqrt(dx*dx+dy*dy);
      var nz=Math.max(30,Math.min(400,Math.round(_pinchStartZoom2*dist/_pinchStartDist2)));
      zSlider.value=nz;zLabel.textContent=nz+'%';
      _bgPrevSizeVal=nz+'%';applyBg();
      e.preventDefault();
    }
  },{passive:false});

  // 滑条缩放
  zSlider.oninput=function(){
    var z=parseInt(zSlider.value);
    zLabel.textContent=z+'%';
    _bgPrevSizeVal=z+'%';
    applyBg();
  };

  document.getElementById('_bgprev_cancel').onclick=function(){ov.remove();};
  document.getElementById('_bgprev_ok').onclick=function(){
    var pX=_bgPrevPosX,pY=_bgPrevPosY,sz=_bgPrevSizeVal,du=_bgPrevCurrentDataUrl;
    ov.remove();
    toast('保存中…','');
    _saveRoomBgIdb(roomId,du,function(ok){
      if(!ok){toast('保存失败，图片可能过大','err');return;}
      var data=getPetData();_ensureRooms(data);
      var room=data.rooms.find(function(r){return r.id===roomId;});
      if(!room)return;
      room.hasBg=true;room.bgPosX=pX;room.bgPosY=pY;room.bgSizeVal=sz;
      room.bg=''; // 清空旧字段
      savePetData(data);
      toast('背景已保存！','ok');
      _renderPetMain();
      if(doneCb)setTimeout(doneCb,100);
    });
  };
}

// ══ 宠物商店 ═════════════════════════════════════════════
function openPetShop(){
  var body=document.getElementById('exp-detail-body');if(!body)return;
  _setExpDetailTitle('🏪 宠物商店');
  var data=getPetData();_ensureRooms(data);var owned=(data.pets||[]).map(function(p){return p.speciesId;});
  var html='<div style="font-size:.75rem;color:var(--muted);text-align:center;margin-bottom:10px">当前金币: $'+(typeof State!=='undefined'?State.money||0:0)+'</div>';
  for(var sid in PET_SPECIES){
    var sp=PET_SPECIES[sid];var has=owned.indexOf(sid)>=0;
    html+='<div style="background:var(--card);border:1px solid var(--bdr2);border-radius:12px;padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;gap:10px;'+(has?'opacity:.6':'').replace('opacity:','opacity:')+'">'+
      '<div style="font-size:2rem;flex-shrink:0">'+sp.stages[0].icon+'</div>'+
      '<div style="flex:1;min-width:0"><div style="font-weight:700;color:var(--txt);font-size:.82rem">'+sp.name+'</div>'+
      '<div style="font-size:.65rem;color:var(--muted);margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">'+sp.desc+'</div>'+
      (sp.price>0?'<div style="font-size:.6rem;color:var(--acc);margin-top:3px">🏠 赠送专属房间</div>':'')+'</div>';
    if(has)html+='<span style="font-size:.72rem;color:var(--acc2);font-weight:600">已拥有</span>';
    else if(sp.price===0)html+='<button class="btn btn-sm btn-p" style="font-size:.68rem;flex-shrink:0" onclick="_buyPet(\''+sid+'\')">免费领取</button>';
    else html+='<button class="btn btn-sm btn-p" style="font-size:.68rem;flex-shrink:0" onclick="_buyPet(\''+sid+'\')">💰$'+sp.price+'</button>';
    html+='</div>';
  }
  html+='<button class="btn btn-ghost btn-full" onclick="openPetSystem()" style="margin-top:8px;font-size:.72rem">← 返回</button>';
  body.innerHTML=html;
}
function _buyPet(sid){
  var sp=PET_SPECIES[sid];if(!sp)return;
  if(sp.price>0&&(typeof State==='undefined'||State.money<sp.price)){toast('金币不足！需要 $'+sp.price,'err');return;}
  if(sp.price>0){State.money-=sp.price;if(typeof _logMoney==='function')_logMoney('购买宠物·'+sp.name,-sp.price);if(typeof writeSave==='function')writeSave();}
  _getOrCreatePet(sid);toast('🎉 获得了 '+sp.name+'！还赠送了一个新房间~','ok');openPetShop();
}

// ══ 宠物图鉴（点击阶段弹窗 + 自定义编辑）══════════════
var _guidebookEditData={};
function openPetGuidebook(){
  var body=document.getElementById('exp-detail-body');if(!body)return;
  _setExpDetailTitle('📖 宠物图鉴');
  var data=getPetData();_ensureRooms(data);var owned=(data.pets||[]).map(function(p){return p.speciesId;});
  var html='';
  for(var sid in PET_SPECIES){
    var sp=PET_SPECIES[sid];var has=owned.indexOf(sid)>=0;
    var pet=has?(data.pets||[]).find(function(p){return p.speciesId===sid;}):null;
    html+='<div style="background:var(--card);border:1px solid var(--bdr2);border-radius:12px;padding:10px 12px;margin-bottom:8px;'+(has?'':'opacity:.5')+'">';
    html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
      (pet&&pet.avatarImg?'<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;flex-shrink:0"><img src="'+pet.avatarImg+'" style="width:100%;height:100%;object-fit:cover"></div>':'<div style="font-size:1.8rem">'+sp.stages[0].icon+'</div>')+
      '<div><div style="font-weight:700;color:var(--txt)">'+sp.name+(has?' ✓':'')+'</div>'+
      '<div style="font-size:.62rem;color:var(--muted)">'+sp.stages.length+'阶进化'+(sp.price?' · $'+sp.price:' · 免费')+'</div></div></div>';
    html+='<div style="font-size:.72rem;color:var(--txt2);line-height:1.4;margin-bottom:8px">'+sp.desc+'</div>';
    html+='<div style="display:flex;gap:6px">';
    sp.stages.forEach(function(stg,i){
      var stageAva=pet&&pet.stageAvatars&&pet.stageAvatars[i]?pet.stageAvatars[i]:null;
      var unlocked=pet&&pet.stage>=i;
      var customInfo=_getStageCustomInfo(sid,i);
      var displayName=customInfo.name||stg.name;
      var displayDesc=customInfo.desc||stg.desc;
      html+='<div style="flex:1;text-align:center;padding:7px 4px;background:var(--card2);border-radius:10px;cursor:pointer;opacity:'+(unlocked?'1':'.55')+';position:relative;border:1.5px solid '+(unlocked?'var(--acc)':'var(--bdr2)')+';" onclick="_openStagePopup(\''+sid+'\','+i+','+(!unlocked)+')" title="'+(unlocked?'点击查看/编辑':'Lv.'+stg.minLevel+' 解锁（可提前上传图片）')+'">';
      if(stageAva){
        html+='<div style="width:38px;height:38px;border-radius:50%;overflow:hidden;margin:0 auto 3px;border:2px solid var(--acc)"><img src="'+stageAva+'" style="width:100%;height:100%;object-fit:cover"></div>';
      }else{
        html+='<div style="font-size:1.5rem;margin-bottom:3px">'+stg.icon+'</div>';
      }
      html+='<div style="font-size:.62rem;font-weight:700;color:var(--txt)">'+esc(displayName)+'</div>';
      html+='<div style="font-size:.5rem;color:var(--muted)">Lv.'+stg.minLevel+'</div>';
      if(unlocked&&pet) html+='<div style="font-size:.5rem;color:var(--acc);margin-top:2px">当前Lv.'+pet.level+'</div>';
      html+='</div>';
    });
    html+='</div></div>';
  }
  html+='<button class="btn btn-ghost btn-full" onclick="openPetSystem()" style="margin-top:8px;font-size:.72rem">← 返回</button>';
  body.innerHTML=html;
}

function _getStageCustomInfo(sid,stageIdx){
  try{var d=JSON.parse(localStorage.getItem('era_stage_info')||'{}');return d[sid+'_'+stageIdx]||{};}catch(e){return {};}
}
function _saveStageCustomInfo(sid,stageIdx,obj){
  try{var d=JSON.parse(localStorage.getItem('era_stage_info')||'{}');d[sid+'_'+stageIdx]=obj;localStorage.setItem('era_stage_info',JSON.stringify(d));}catch(e){}
}

function _openStagePopup(sid,stageIdx,lockedOnly){
  var data=getPetData();var pet=(data.pets||[]).find(function(p){return p.speciesId===sid;});
  if(!pet)return;
  var sp=PET_SPECIES[sid];var stg=(sp.stages||[])[stageIdx]||{};
  var stageAva=pet.stageAvatars&&pet.stageAvatars[stageIdx]?pet.stageAvatars[stageIdx]:null;
  var custom=_getStageCustomInfo(sid,stageIdx);
  var lvName=custom.name||stg.name||'';
  var desc=custom.desc||stg.desc||'';
  var ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:8000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px)';
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  ov.innerHTML=
    '<div style="background:var(--card);border-radius:18px;padding:20px;max-width:340px;width:100%;animation:albumPop .25s ease;max-height:80vh;overflow-y:auto">'+
    '<div style="text-align:center;margin-bottom:14px">'+
      '<div style="cursor:pointer;display:inline-block" onclick="_uploadStageAvatarFromPopup(\''+sid+'\','+stageIdx+')" title="点击上传形象">'+
      (stageAva?'<div style="width:68px;height:68px;border-radius:50%;overflow:hidden;margin:0 auto;border:3px solid var(--acc)"><img src="'+stageAva+'" style="width:100%;height:100%;object-fit:cover"></div>':'<div style="font-size:3rem;line-height:1">'+stg.icon+'</div>')+
      '</div>'+
      '<div style="font-size:.62rem;color:var(--acc);margin-top:4px">点击图像上传自定义形象</div>'+
    '</div>'+
    '<div style="margin-bottom:10px">'+
      '<div style="font-size:.7rem;color:var(--txt2);margin-bottom:4px">等级：Lv.'+stg.minLevel+' 解锁 · 当前 Lv.'+pet.level+(lockedOnly?' <span style="color:#ff9800">[未解锁·可预设图片]</span>':'')+'</div>'+
      '<label style="font-size:.7rem;color:var(--muted);display:block;margin-bottom:3px">阶段名称</label>'+
      '<input id="stage-popup-name" value="'+esc(lvName)+'" maxlength="12" style="width:100%;padding:7px;font-size:.82rem;border:1px solid var(--bdr2);border-radius:8px;background:var(--card2);color:var(--txt);box-sizing:border-box">'+
    '</div>'+
    '<div style="margin-bottom:14px">'+
      '<label style="font-size:.7rem;color:var(--muted);display:block;margin-bottom:3px">阶段描述</label>'+
      '<textarea id="stage-popup-desc" rows="3" maxlength="200" style="width:100%;padding:7px;font-size:.75rem;border:1px solid var(--bdr2);border-radius:8px;background:var(--card2);color:var(--txt);box-sizing:border-box;resize:none">'+esc(desc)+'</textarea>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
      '<button class="btn btn-ghost" onclick="this.closest(\'div[style*=fixed]\').remove();openPetGuidebook()">取消</button>'+
      '<button class="btn btn-p" onclick="_saveStagePopup(\''+sid+'\','+stageIdx+',this)">保存</button>'+
    '</div>'+
  '</div>';
  document.body.appendChild(ov);
}
function _saveStagePopup(sid,stageIdx,btn){
  var nameEl=document.getElementById('stage-popup-name');
  var descEl=document.getElementById('stage-popup-desc');
  var obj={name:(nameEl?nameEl.value.trim():''),desc:(descEl?descEl.value.trim():'')};
  _saveStageCustomInfo(sid,stageIdx,obj);
  toast('已保存','ok');
  btn.closest('div[style*="fixed"]').remove();
  openPetGuidebook();
}
function _uploadStageAvatarFromPopup(sid,stageIdx){
  var data=getPetData();var pet=(data.pets||[]).find(function(p){return p.speciesId===sid;});
  if(!pet){toast('未拥有此宠物','');return;}
  var inp=document.createElement('input');inp.type='file';inp.accept='image/*';
  inp.onchange=function(){var f=inp.files&&inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){
    if(!pet.stageAvatars)pet.stageAvatars={};pet.stageAvatars[stageIdx]=ev.target.result;_updatePet(pet);
    toast('阶段形象已更新！','ok');
    // 重新打开弹窗刷新图片
    var ov=document.querySelector('div[style*="fixed"][style*="8000"]');if(ov)ov.remove();
    _openStagePopup(sid,stageIdx);
  };r.readAsDataURL(f);};inp.click();
}

// ══ CG图库 v3 — 五比例相册 ═══════════════════════════════
var CG_RATIOS=[
  {id:'9-16',label:'9:16 竖版',desc:'手机壁纸/立绘',style:'aspect-ratio:9/16',icon:'📱',
   pcCols:'repeat(4,1fr)',mobCols:'repeat(3,1fr)'},
  {id:'16-9',label:'16:9 横版',desc:'宽屏/场景图',style:'aspect-ratio:16/9',icon:'🖥️',
   pcCols:'repeat(2,1fr)',mobCols:'repeat(1,1fr)'},
  {id:'4-3',label:'4:3 横版',desc:'标准横图/场景',style:'aspect-ratio:4/3',icon:'📷',
   pcCols:'repeat(2,1fr)',mobCols:'repeat(1,1fr)'},
  {id:'3-4',label:'3:4 竖版',desc:'竖版标准/半身',style:'aspect-ratio:3/4',icon:'🖼️',
   pcCols:'repeat(3,1fr)',mobCols:'repeat(2,1fr)'},
  {id:'1-1',label:'1:1 正方形',desc:'头像/方图',style:'aspect-ratio:1/1',icon:'⬛',
   pcCols:'repeat(4,1fr)',mobCols:'repeat(3,1fr)'},
];

// CG元数据管理（localStorage），图片数据（IndexedDB）
function getCGData(){try{return JSON.parse(localStorage.getItem('era_cg_meta')||'{}');}catch(e){return {};}}
function saveCGData(d){try{localStorage.setItem('era_cg_meta',JSON.stringify(d));}catch(e){toast('元数据保存失败','err');}}

// ── IndexedDB ────────────────────────────────────────────
var _cgDB=null;
function _openCGDB(cb){
  if(_cgDB){cb(_cgDB);return;}
  var req=indexedDB.open('eraqueen_cg',2);
  req.onupgradeneeded=function(e){
    var db=e.target.result;
    if(!db.objectStoreNames.contains('images'))db.createObjectStore('images',{keyPath:'id'});
    if(!db.objectStoreNames.contains('meta'))db.createObjectStore('meta',{keyPath:'key'});
  };
  req.onsuccess=function(e){_cgDB=e.target.result;cb(_cgDB);};
  req.onerror=function(){cb(null);};
}
function _saveCGImage(imgId,dataUrl,cb){
  _openCGDB(function(db){
    if(!db){cb&&cb(false);return;}
    var tx=db.transaction('images','readwrite');
    tx.objectStore('images').put({id:imgId,url:dataUrl});
    tx.oncomplete=function(){cb&&cb(true);};
    tx.onerror=function(){cb&&cb(false);};
  });
}
function _loadCGImage(imgId,cb){
  _openCGDB(function(db){
    if(!db){cb&&cb(null);return;}
    var req=db.transaction('images','readonly').objectStore('images').get(imgId);
    req.onsuccess=function(){cb&&cb(req.result?req.result.url:null);};
    req.onerror=function(){cb&&cb(null);};
  });
}
function _deleteCGImage(imgId){
  _openCGDB(function(db){if(!db)return;db.transaction('images','readwrite').objectStore('images').delete(imgId);});
}
function _genCGId(){return 'cg_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);}

// ── 图片压缩（解决8MB上传失败问题）────────────────────
function _compressImage(file,cb){
  var reader=new FileReader();
  reader.onload=function(ev){
    var img=new Image();
    img.onload=function(){
      var MAX=1800;
      var w=img.width,h=img.height;
      if(w>MAX||h>MAX){var sc=MAX/Math.max(w,h);w=Math.round(w*sc);h=Math.round(h*sc);}
      var cv=document.createElement('canvas');cv.width=w;cv.height=h;
      var ctx=cv.getContext('2d');ctx.drawImage(img,0,0,w,h);
      var out=cv.toDataURL('image/jpeg',0.82);
      cb(out,w,h);
    };
    img.onerror=function(){cb(null);};
    img.src=ev.target.result;
  };
  reader.onerror=function(){cb(null);};
  reader.readAsDataURL(file);
}

// ── 迁移旧格式数据 ────────────────────────────────────
function _migrateCGData(){
  var raw=getCGData();
  var changed=false;
  Object.keys(raw).forEach(function(key){
    var v=raw[key];
    if(Array.isArray(v)){
      // 旧格式：数组 → 转为{albums:[{id,name,ratio,images,primaryIndex}],primaryImgId}
      var album={id:'alb_legacy',name:'默认相册',ratio:'3-4',images:v,primaryIndex:0};
      raw[key]={albums:[album],primaryImgId:v[0]?v[0].id:null};
      changed=true;
    }
  });
  if(changed)saveCGData(raw);
  return raw;
}

// ── 主入口 ────────────────────────────────────────────
function openCGGallery(){
  var body=document.getElementById('exp-detail-body');if(!body)return;
  _setExpDetailTitle('🖼️ CG图库');
  _migrateCGData();
  _renderCGGallery();
}
function _renderCGGallery(){
  var body=document.getElementById('exp-detail-body');if(!body)return;
  var cgData=getCGData();
  var html='<div style="font-size:.72rem;color:var(--muted);text-align:center;margin-bottom:12px">为每位角色创建专属CG相册，支持五种比例</div>';

  // 已拥有角色
  var ownedChars=[];
  if(typeof CHARS_DATA!=='undefined'&&typeof loadSave==='function'){
    CHARS_DATA.forEach(function(c){if(loadSave(c.id))ownedChars.push(c);});
  }

  if(ownedChars.length){
    html+='<div style="font-size:.78rem;font-weight:700;color:var(--txt);margin-bottom:8px">👤 角色相册 ('+ownedChars.length+'位)</div>';
    html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">';
    ownedChars.forEach(function(c){
      var cd=cgData[String(c.id)]||{albums:[]};
      var albums=cd.albums||[];
      // ★ 同时计入预设初始相册图片数量
      var _presetAlbs=_getInitialAlbums(c.id);
      var presetImgs=_presetAlbs.reduce(function(a,b){return a+(b.images?b.images.length:0);},0);
      var totalImgs=albums.reduce(function(a,b){return a+(b.images?b.images.length:0);},0)+presetImgs;
      var totalAlbs=albums.length+_presetAlbs.length;
      var sv=loadSave(c.id);var profile=(sv&&sv.charProfile)||{};
      var avaHtml;
      var _cgListAvaImg=profile.avaImg||profile._presetAvaUrl||'';
      if(!_cgListAvaImg&&typeof CharRegistry!=='undefined'){var _cgListCr=CharRegistry.get(c.id)||CharRegistry.get(parseInt(c.id));if(_cgListCr&&_cgListCr._presetAvaUrl)_cgListAvaImg=_cgListCr._presetAvaUrl;}
      if(_cgListAvaImg) avaHtml='<img src="'+_cgListAvaImg+'" style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid var(--acc)">';
      else avaHtml='<div style="font-size:1.5rem">'+esc(profile.ava||cEmoji(c))+'</div>';
      html+='<div onclick="openCharCGAlbums('+c.id+')" style="cursor:pointer;padding:8px 4px;text-align:center;background:var(--card);border:1px solid var(--bdr2);border-radius:12px;position:relative;overflow:hidden;transition:transform .15s" onmouseover="this.style.transform=\'scale(1.04)\'" onmouseout="this.style.transform=\'scale(1)\'">';
      // ★ 背景预览：优先用户相册，回落到预设初始相册
      var _bgUrl='';
      if(albums.length>0){
        var firstAlb=albums.find(function(a){return a.images&&a.images.length;});
        if(firstAlb){var fi=firstAlb.images[0];if(fi&&(fi.url||fi.presetUrl))_bgUrl=fi.url||fi.presetUrl;}
      }
      if(!_bgUrl&&_presetAlbs.length>0){
        var _pAlb=_presetAlbs.find(function(a){return a.images&&a.images.length;});
        if(_pAlb){var _pfi=_pAlb.images[0];if(_pfi&&_pfi.presetUrl)_bgUrl=_pfi.presetUrl;}
      }
      if(_bgUrl)html+='<div style="position:absolute;inset:0;background:url(\''+_bgUrl+'\') center/cover;opacity:.18;border-radius:12px"></div>';
      html+='<div style="position:relative">'+avaHtml+'<div style="font-size:.65rem;font-weight:700;color:var(--txt);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(c.name)+'</div>';
      html+='<div style="font-size:.55rem;color:'+(totalImgs?'var(--acc)':'var(--muted)')+'">'+totalImgs+'张 · '+totalAlbs+'册</div>';
      html+='</div></div>';
    });
    html+='</div>';
  }else{
    html+='<div style="text-align:center;padding:20px;color:var(--muted);font-size:.78rem">尚未获得任何角色</div>';
  }

  // 通用相册
  var genCd=cgData['general']||{albums:[]};var genAlbs=genCd.albums||[];
  var genTotal=genAlbs.reduce(function(a,b){return a+(b.images?b.images.length:0);},0);
  html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">';
  html+='<span style="font-size:.78rem;font-weight:700;color:var(--txt)">🌟 通用相册 ('+genTotal+'张)</span>';
  html+='<button class="btn btn-sm btn-p" style="font-size:.62rem;padding:2px 8px" onclick="openCharCGAlbums(\'general\')">查看</button>';
  html+='</div>';
  html+='<button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-exp-detail\')" style="font-size:.72rem;margin-top:8px">关闭</button>';
  body.innerHTML=html;
  // 异步加载缩略图
  _loadCGThumbnails(ownedChars,cgData,body);
  openOv('ov-exp-detail');
}

function _loadCGThumbnails(chars,cgData,body){
  chars.forEach(function(c){
    var cd=cgData[String(c.id)]||{albums:[]};
    var albums=cd.albums||[];
    var firstAlb=albums.find(function(a){return a.images&&a.images.length;});
    if(!firstAlb)return;
    var fi=firstAlb.images[0];
    if(!fi||fi.url||!fi.id)return;
    _loadCGImage(fi.id,function(url){
      if(!url)return;
      fi.url=url;
      // 找到对应的背景div并更新
      var divs=body.querySelectorAll('div[onclick*="openCharCGAlbums('+c.id+')"]');
      divs.forEach(function(d){
        var bgEl=d.querySelector('div[style*="opacity:.18"]');
        if(bgEl)bgEl.style.backgroundImage='url(\''+url+'\')';
      });
    });
  });
}


// ── 初始相册：动态将制作者预设图归入相册（不写localStorage，避免配额超出）
// 返回虚拟的初始相册列表（只影响显示，用户编辑信息单独存在 era_init_alb_{charKey}）
function _getInitialAlbums(charKey) {
  var _cr = typeof CharRegistry !== 'undefined'
    ? (CharRegistry.get(charKey) || CharRegistry.get(parseInt(charKey)))
    : null;
  if (!_cr || !_cr._presetImages || !_cr._presetImages.length) return [];

  // 读取用户对初始相册的编辑（改名、描述）
  var editKey = 'era_init_alb_' + charKey;
  var edits = {};
  try { edits = JSON.parse(localStorage.getItem(editKey) || '{}'); } catch(e) {}

  var ratioGroups = {};
  _cr._presetImages.forEach(function(pi) {
    var r = pi.ratio || '3-4';
    if (!ratioGroups[r]) ratioGroups[r] = [];
    ratioGroups[r].push(pi);
  });

  var albums = [];
  Object.keys(ratioGroups).forEach(function(ratio) {
    var pis = ratioGroups[ratio];
    var albId = 'alb_init_' + ratio.replace('-','');
    var albEdit = edits[albId] || {};
    var images = pis.map(function(pi, idx) {
      var imgId = 'preset_' + idx + '_' + pi.file.split('/').pop().replace(/[^a-z0-9]/gi,'_');
      var imgEdit = albEdit.images && albEdit.images[imgId] || {};
      return {
        id: imgId,
        presetUrl: pi.file,
        name: imgEdit.name !== undefined ? imgEdit.name : (pi.file.split('/').pop().replace(/\.\w+$/, '') || '图片'),
        desc: imgEdit.desc !== undefined ? imgEdit.desc : (pi.desc || ''),
      };
    });
    albums.push({
      id: albId,
      name: albEdit.albumName || '初始相册',
      ratio: ratio,
      images: images,
      isInitial: true,
      _editKey: editKey,
    });
  });
  return albums;
}

// 保存初始相册的用户编辑（改相册名/图片名/描述）——不入 era_cg_meta
function _saveInitialAlbumEdit(charKey, albId, changes) {
  var editKey = 'era_init_alb_' + charKey;
  var edits = {};
  try { edits = JSON.parse(localStorage.getItem(editKey) || '{}'); } catch(e) {}
  if (!edits[albId]) edits[albId] = {};
  Object.assign(edits[albId], changes);
  try { localStorage.setItem(editKey, JSON.stringify(edits)); } catch(e) { toast('保存失败','err'); }
}

// 兼容旧版 _ensureInitialAlbum 调用（不再操作 cgData）
function _ensureInitialAlbum(charKey, cgData) { return false; }

// ── 角色相册列表页（显示5种比例的相册）────────────────
function openCharCGAlbums(charKey){
  var body=document.getElementById('exp-detail-body');if(!body)return;
  _migrateCGData();
  var cgData=getCGData();
  // ★ 动态获取初始相册（来自 CharRegistry 预设图，不写 localStorage）
  var _initAlbs=_getInitialAlbums(charKey);
  var cd=cgData[String(charKey)]||{albums:[],primaryImgId:null};
  if(!cd.albums)cd.albums=[];
  var c=null;
  if(charKey!=='general'&&typeof CHARS_DATA!=='undefined'){
    c=CHARS_DATA.find(function(x){return x.id===charKey;});
  }
  var title=(c?c.name:'通用')+' · CG相册';
  _setExpDetailTitle('📚 '+title);

  // ★ Fix3: 显示当前自定义头像（与庄园同步）
  var _cgAvaHtml='';
  if(c){
    var _cgSv=typeof loadSave==='function'?loadSave(charKey):null;
    var _cgPro=(_cgSv&&_cgSv.charProfile)||{};
    var _cgAvaImg=_cgPro.avaImg||_cgPro._presetAvaUrl||'';
    if(!_cgAvaImg&&typeof CharRegistry!=='undefined'){var _cgCr=CharRegistry.get(charKey)||CharRegistry.get(parseInt(charKey));if(_cgCr&&_cgCr._presetAvaUrl)_cgAvaImg=_cgCr._presetAvaUrl;}
    if(_cgAvaImg){
      _cgAvaHtml='<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--card2);border-radius:12px;margin-bottom:12px;cursor:pointer" onclick="openSlaveAvaModal('+charKey+')" title="点击更换头像">'+
        '<div style="width:44px;height:44px;border-radius:50%;overflow:hidden;flex-shrink:0"><img src="'+_cgAvaImg+'" style="width:100%;height:100%;object-fit:cover"></div>'+
        '<div><div style="font-size:.82rem;font-weight:700;color:var(--txt)">'+esc(c.name)+'</div>'+
        '<div style="font-size:.6rem;color:var(--muted)">点击更换头像</div></div></div>';
    } else {
      var _cgEmoji=_cgPro.ava||(typeof cEmoji==='function'?cEmoji(c):'✨');
      _cgAvaHtml='<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--card2);border-radius:12px;margin-bottom:12px;cursor:pointer" onclick="openSlaveAvaModal('+charKey+')" title="点击更换头像">'+
        '<div style="width:44px;height:44px;border-radius:50%;background:var(--card);display:flex;align-items:center;justify-content:center;font-size:1.6rem;flex-shrink:0">'+_cgEmoji+'</div>'+
        '<div><div style="font-size:.82rem;font-weight:700;color:var(--txt)">'+esc(c.name)+'</div>'+
        '<div style="font-size:.6rem;color:var(--muted)">点击更换头像</div></div></div>';
    }
  }

  var html=_cgAvaHtml;

  // 按比例分组显示相册
  CG_RATIOS.forEach(function(ratio){
    // 合并：用户相册 + 虚拟初始相册（同比例）
    var ratioAlbs=cd.albums.filter(function(a){return a.ratio===ratio.id;}).concat(
      _initAlbs.filter(function(a){return a.ratio===ratio.id;})
    );
    html+='<div style="margin-bottom:16px">';
    html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
    html+='<span style="font-size:.88rem">'+ratio.icon+'</span>';
    html+='<span style="font-weight:700;font-size:.8rem;color:var(--txt)">'+ratio.label+'</span>';
    html+='<span style="font-size:.62rem;color:var(--muted)">'+ratio.desc+'</span>';
    html+='<button class="btn btn-sm btn-p" style="font-size:.58rem;padding:2px 8px;margin-left:auto" onclick="_createAlbum(\''+charKey+'\',\''+ratio.id+'\')">＋新建</button>';
    html+='</div>';

    if(!ratioAlbs.length){
      html+='<div style="text-align:center;padding:12px;background:var(--card2);border-radius:10px;font-size:.7rem;color:var(--muted)">暂无相册 · 点击新建</div>';
    }else{
      // 相册卡片网格（PC端更多列）
      var isPc=window.innerWidth>=600;
      var cols=isPc?ratio.pcCols:ratio.mobCols;
      html+='<div style="display:grid;grid-template-columns:'+cols+';gap:8px">';
      ratioAlbs.forEach(function(alb){
        var imgCount=alb.images?alb.images.length:0;
        var coverId='cg-alb-cover-'+alb.id;
        html+='<div class="album-card" onclick="openAlbumViewer(\''+charKey+'\',\''+alb.id+'\')" style="background:var(--card);border:1px solid var(--bdr2)">';
        // 相册封面（动态加载第一张图）
        html+='<div id="'+coverId+'" style="'+ratio.style+';background:var(--card2);overflow:hidden;position:relative">';
        html+='<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px">';
        html+='<div style="font-size:2rem;opacity:.3">'+ratio.icon+'</div>';
        html+='</div></div>';
        // 相册信息
        html+='<div style="padding:6px 8px;background:linear-gradient(rgba(0,0,0,.02),rgba(0,0,0,.06))">';
        var _albTag=alb.isInitial?'<span style="font-size:.48rem;background:rgba(var(--acc-rgb),.15);color:var(--acc);padding:1px 5px;border-radius:6px;margin-left:4px;vertical-align:middle">内置</span>':'';
        html+='<div style="font-size:.68rem;font-weight:700;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" ondblclick="event.stopPropagation();_renameAlbum(\''+charKey+'\',\''+alb.id+'\')" title="双击改名">'+esc(alb.name||'相册')+_albTag+'</div>';
        html+='<div style="font-size:.58rem;color:var(--muted)">'+imgCount+'张</div>';
        if(cd.primaryImgId&&alb.images&&alb.images.some(function(i){return i.id===cd.primaryImgId;})){
          html+='<div style="font-size:.52rem;color:var(--acc)">★ 主形象</div>';
        }
        html+='</div></div>';
      });
      html+='</div>';
    }
    html+='</div>';
  });

  html+='<div style="margin-top:12px">';
  html+='<button class="btn btn-ghost btn-full" onclick="openCGGallery()" style="font-size:.72rem">← 返回</button>';
  html+='</div>';
  body.innerHTML = html;

  // 异步加载封面图（包含初始相册）
  _loadAlbumCovers(cd, charKey, _initAlbs);
}

function _viewPresetImage(charKey, idx) {
  var _cr = typeof CharRegistry !== 'undefined' ? (CharRegistry.get(charKey) || CharRegistry.get(parseInt(charKey))) : null;
  if (!_cr || !_cr._presetImages || !_cr._presetImages[idx]) return;
  var pi = _cr._presetImages[idx];
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;backdrop-filter:blur(8px)';
  ov.onclick = function(e) { if (e.target === ov) ov.remove(); };
  ov.innerHTML = '<img src="' + pi.file + '" style="max-width:94vw;max-height:78vh;border-radius:8px;object-fit:contain">' +
    '<div style="color:rgba(255,255,255,.55);font-size:.65rem;margin-top:10px">' + esc(pi.album || '内置') + '</div>' +
    (pi.desc ? '<div style="color:rgba(255,255,255,.75);font-size:.72rem;margin-top:6px;max-width:80vw;text-align:center;line-height:1.5">' + esc(pi.desc) + '</div>' : '') +
    '<button onclick="this.closest(\'div[style*=fixed]\').remove()" style="margin-top:12px;padding:8px 24px;border-radius:10px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;font-size:.8rem;cursor:pointer">关闭</button>';
  document.body.appendChild(ov);
}



function _loadAlbumCovers(cd,charKey,initAlbs){
  // 合并用户相册 + 初始相册（去重）
  var albums=(cd.albums||[]).concat(initAlbs||[]);
  albums.forEach(function(alb){
    if(!alb.images||!alb.images.length)return;
    var fi=alb.images[0];
    var coverId='cg-alb-cover-'+alb.id;
    var ratio=CG_RATIOS.find(function(r){return r.id===alb.ratio;})||CG_RATIOS[3];
    function applyUrl(url){
      var el=document.getElementById(coverId);if(!el)return;
      el.innerHTML='<img src="'+url+'" style="width:100%;height:100%;object-fit:cover"><div style="position:absolute;inset:0;background:linear-gradient(transparent 60%,rgba(0,0,0,.4))"></div>';
    }
    // 初始相册图片用 presetUrl 直接显示，其他用 IndexedDB
    if(fi.presetUrl) applyUrl(fi.presetUrl);
    else if(fi.url)applyUrl(fi.url);
    else if(fi.id)_loadCGImage(fi.id,function(url){if(url){fi.url=url;applyUrl(url);}});
  });
}

function _createAlbum(charKey,ratioId){
  var ratio=CG_RATIOS.find(function(r){return r.id===ratioId;})||{label:ratioId,icon:'🖼️'};
  var ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:9500;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px)';
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  var sheet=document.createElement('div');
  sheet.style.cssText='background:var(--card);border-radius:20px;padding:24px;max-width:300px;width:100%;animation:albumPop .22s ease;box-shadow:0 20px 60px rgba(0,0,0,.5)';
  sheet.innerHTML=
    '<div style="text-align:center;margin-bottom:18px">'+
      '<div style="font-size:2rem;margin-bottom:6px">'+ratio.icon+'</div>'+
      '<div style="font-size:.95rem;font-weight:800;color:var(--txt)">新建相册</div>'+
      '<div style="font-size:.68rem;color:var(--muted);margin-top:2px">'+ratio.label+'</div>'+
    '</div>'+
    '<div style="margin-bottom:16px">'+
      '<label style="font-size:.7rem;color:var(--txt2);display:block;margin-bottom:6px">📝 相册名称</label>'+
      '<input id="_alb_inp" maxlength="16" value="新相册" placeholder="输入相册名称…" '+
        'style="width:100%;padding:10px 12px;font-size:.88rem;border:2px solid var(--bdr2);border-radius:10px;background:var(--card2);color:var(--txt);box-sizing:border-box;outline:none">'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
      '<button id="_alb_cancel" style="padding:10px;border-radius:10px;border:1.5px solid var(--bdr2);background:transparent;color:var(--txt2);font-size:.82rem;cursor:pointer">取消</button>'+
      '<button id="_alb_ok" style="padding:10px;border-radius:10px;border:none;background:var(--acc);color:#fff;font-size:.82rem;font-weight:700;cursor:pointer">创建</button>'+
    '</div>';
  ov.appendChild(sheet);
  document.body.appendChild(ov);
  var inp=sheet.querySelector('#_alb_inp');
  if(inp){inp.focus();inp.select();}
  sheet.querySelector('#_alb_cancel').onclick=function(){ov.remove();};
  sheet.querySelector('#_alb_ok').onclick=function(){
    var name=inp?inp.value.trim():'';
    if(!name){if(inp)inp.style.border='2px solid #e53935';return;}
    ov.remove();
    var cgData=getCGData();
    if(!cgData[String(charKey)])cgData[String(charKey)]={albums:[],primaryImgId:null};
    if(!cgData[String(charKey)].albums)cgData[String(charKey)].albums=[];
    cgData[String(charKey)].albums.push({id:'alb_'+Date.now(),name:name.slice(0,16),ratio:ratioId,images:[],primaryIndex:0});
    saveCGData(cgData);
    toast('相册「'+name+'」已创建','ok');
    openCharCGAlbums(charKey);
  };
  if(inp)inp.addEventListener('keydown',function(e){if(e.key==='Enter')sheet.querySelector('#_alb_ok').click();});
}
function _renameAlbum(charKey,albId){
  // 初始相册改名走独立存储，不改 era_cg_meta
  var initAlbs=_getInitialAlbums(charKey);
  var isInit=initAlbs.some(function(a){return a.id===albId;});
  if(isInit){
    var curAlb=initAlbs.find(function(a){return a.id===albId;});
    _showInputModal('✏️ 相册改名','新名称',curAlb?curAlb.name:'初始相册',function(n){
      if(!n)return;
      _saveInitialAlbumEdit(charKey,albId,{albumName:n.trim().slice(0,16)});
      openCharCGAlbums(charKey);
    });
    return;
  }
  var cgData=getCGData();var cd=cgData[String(charKey)];if(!cd)return;
  var alb=cd.albums&&cd.albums.find(function(a){return a.id===albId;});if(!alb)return;
  _showInputModal('✏️ 相册改名','新名称',alb.name,function(n){if(!n)return;
  alb.name=n.trim().slice(0,16);saveCGData(cgData);openCharCGAlbums(charKey);});
}

// ── 相册查看器（左右切换 + 上传 + 设主形象）──────────
var _albumViewerState={};
function openAlbumViewer(charKey,albId,imgIdx){
  _migrateCGData();
  var cgData=getCGData();var cd=cgData[String(charKey)];
  var alb=(cd&&cd.albums&&cd.albums.find(function(a){return a.id===albId;}));
  // ★ 如果在用户相册找不到，尝试虚拟初始相册
  if(!alb){
    var initAlbs=_getInitialAlbums(charKey);
    alb=initAlbs.find(function(a){return a.id===albId;});
  }
  if(!alb)return;
  if(!cd)cd={albums:[],primaryImgId:null};
  var body=document.getElementById('exp-detail-body');if(!body)return;
  var idx=imgIdx||0;
  _albumViewerState={charKey:charKey,albId:albId,idx:idx};

  var ratio=CG_RATIOS.find(function(r){return r.id===alb.ratio;})||CG_RATIOS[3];
  var isPc=window.innerWidth>=600;
  var cols=isPc?ratio.pcCols:ratio.mobCols;

  _setExpDetailTitle('📸 '+esc(alb.name||'相册'));
  var images=alb.images||[];

  // 构建图片网格
  var html='<div style="margin-bottom:8px;display:flex;align-items:center;gap:6px">';
  html+='<span style="font-size:.72rem;color:var(--muted)">'+ratio.icon+' '+ratio.label+'</span>';
  html+='<span style="font-size:.62rem;color:var(--muted);flex:1">共'+images.length+'张</span>';
  html+='<button class="btn btn-sm btn-ghost" style="font-size:.6rem;padding:2px 8px;color:#e53935" onclick="_deleteAlbum(\''+charKey+'\',\''+albId+'\')">🗑️ 删除相册</button>';
  html+='</div>';

  html+='<div id="cg-img-grid" style="display:grid;grid-template-columns:'+cols+';gap:6px;margin-bottom:10px">';

  images.forEach(function(img,i){
    var isPrimary=cd.primaryImgId===img.id;
    var _imgSrc=img.presetUrl||img.url||'';
    var _imgLabel=img.name||img.title||'';
    html+='<div style="position:relative;border-radius:10px;overflow:hidden;background:var(--card2);border:2px solid '+(isPrimary?'var(--acc)':'var(--bdr2)')+';cursor:pointer" onclick="_viewAlbumImage(\''+charKey+'\',\''+albId+'\','+i+')">';
    html+='<div id="cg-img-'+img.id+'" style="'+ratio.style+';background:var(--card2)">';
    if(_imgSrc)html+='<img src="'+_imgSrc+'" style="width:100%;height:100%;object-fit:contain;display:block" loading="lazy">';
    else html+='<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:.65rem;color:var(--muted)">加载中…</div>';
    html+='</div>';
    if(isPrimary)html+='<div style="position:absolute;top:3px;left:3px;background:var(--acc);color:#fff;font-size:.5rem;padding:1px 5px;border-radius:8px">★主</div>';
    if(_imgLabel)html+='<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.55);color:#fff;font-size:.52rem;padding:2px 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(_imgLabel)+'</div>';
    html+='</div>';
  });

  // 最后一格：添加按钮
  html+='<div style="'+ratio.style+';background:var(--card2);border:2px dashed var(--bdr2);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;gap:4px" onclick="uploadCGToAlbum(\''+charKey+'\',\''+albId+'\')">';
  html+='<div style="font-size:1.6rem;opacity:.4">+</div>';
  html+='<div style="font-size:.58rem;color:var(--muted)">添加图片</div>';
  html+='</div>';
  html+='</div>';

  // 顺序调整说明
  html+='<div style="font-size:.62rem;color:var(--muted);margin-bottom:8px;text-align:center">点击图片查看大图 · 点击图片右下角操作按钮可编辑/设主形象/删除/调序</div>';

  html+='<button class="btn btn-ghost btn-full" onclick="openCharCGAlbums(\''+charKey+'\')" style="font-size:.72rem">← 返回相册</button>';

  body.innerHTML=html;

  // 异步加载图片（跳过有 presetUrl 的初始相册图片，它们直接用URL）
  images.forEach(function(img){
    if(img.presetUrl||img.url||!img.id)return;
    _loadCGImage(img.id,function(url){
      if(!url)return;img.url=url;
      var el=document.getElementById('cg-img-'+img.id);
      if(el)el.innerHTML='<img src="'+url+'" style="width:100%;height:100%;object-fit:contain;display:block">';
    });
  });
}

function _deleteAlbum(charKey,albId){
  openCustomConfirm('🗑️ 删除相册','删除相册及其中所有图片？','确认删除',function(){
    var cgData=getCGData();var cd=cgData[String(charKey)];if(!cd)return;
    var alb=cd.albums&&cd.albums.find(function(a){return a.id===albId;});
    if(alb&&alb.images)alb.images.forEach(function(img){if(img.id)_deleteCGImage(img.id);});
    cd.albums=cd.albums.filter(function(a){return a.id!==albId;});
    saveCGData(cgData);toast('相册已删除','');openCharCGAlbums(charKey);
  });
}

// ── 图片全屏查看器（带左右按钮）────────────────────────
function _viewAlbumImage(charKey,albId,idx){
  _migrateCGData();
  var cgData=getCGData();var cd=cgData[String(charKey)];
  var alb=cd&&cd.albums&&cd.albums.find(function(a){return a.id===albId;});if(!alb)return;
  var images=alb.images||[];var img=images[idx];if(!img)return;

  // ★ 初始相册图片直接用 presetUrl，无需 IndexedDB
  if(img.presetUrl){ renderViewer(img.presetUrl); return; }

  function renderViewer(url){
    var existing=document.getElementById('_cg_viewer');if(existing)existing.remove();
    var ov=document.createElement('div');ov.id='_cg_viewer';
    ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.93);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;backdrop-filter:blur(10px)';
    ov.onclick=function(e){if(e.target===ov)ov.remove();};

    var prevIdx=(idx>0?idx-1:images.length-1);
    var nextIdx=(idx<images.length-1?idx+1:0);
    var isPrimary=cd.primaryImgId===img.id;

    var navHtml='';
    if(images.length>1){
      navHtml='<button onclick="_viewAlbumImage(\''+charKey+'\',\''+albId+'\','+prevIdx+')" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.15);border:none;color:#fff;font-size:1.8rem;padding:6px 14px;border-radius:50%;cursor:pointer;z-index:2">‹</button>'+
              '<button onclick="_viewAlbumImage(\''+charKey+'\',\''+albId+'\','+nextIdx+')" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.15);border:none;color:#fff;font-size:1.8rem;padding:6px 14px;border-radius:50%;cursor:pointer;z-index:2">›</button>';
    }

    ov.innerHTML=
      '<div style="position:relative;width:100%;max-width:600px;display:flex;flex-direction:column;align-items:center;padding:10px">'+navHtml+
      '<img src="'+(url||'')+'" style="max-width:90%;max-height:68vh;object-fit:contain;border-radius:10px;box-shadow:0 8px 40px rgba(0,0,0,.6)">'+
      '<div style="text-align:center;margin-top:10px;max-width:85%">'+
        ((img.name||img.title)?'<div style="color:#fff;font-size:.92rem;font-weight:700;margin-bottom:4px">'+esc(img.name||img.title)+'</div>':'')+
        (img.desc?'<div style="color:rgba(255,255,255,.7);font-size:.75rem;margin-bottom:6px">'+esc(img.desc)+'</div>':'')+
        '<div style="color:rgba(255,255,255,.4);font-size:.6rem">'+(idx+1)+' / '+images.length+' · 点击空白关闭</div>'+
      '</div>'+
      // 操作按钮
      '<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;justify-content:center">'+
        '<button onclick="_editCGImageInfo(\''+charKey+'\',\''+albId+'\','+idx+')" style="background:rgba(255,255,255,.15);border:none;color:#fff;padding:5px 12px;border-radius:20px;font-size:.68rem;cursor:pointer">✏️ 编辑</button>'+
        (isPrimary?
          '<button style="background:rgba(255,200,0,.3);border:none;color:gold;padding:5px 12px;border-radius:20px;font-size:.68rem">★ 已是主形象</button>':
          '<button onclick="_setPrimaryImg(\''+charKey+'\',\''+img.id+'\')" style="background:rgba(255,255,255,.15);border:none;color:#fff;padding:5px 12px;border-radius:20px;font-size:.68rem;cursor:pointer">☆ 设为主形象</button>')+
        '<button onclick="_moveCGImageOrder(\''+charKey+'\',\''+albId+'\','+idx+',-1)" style="background:rgba(255,255,255,.12);border:none;color:#fff;padding:5px 10px;border-radius:20px;font-size:.68rem;cursor:pointer">← 左移</button>'+
        '<button onclick="_moveCGImageOrder(\''+charKey+'\',\''+albId+'\','+idx+',1)" style="background:rgba(255,255,255,.12);border:none;color:#fff;padding:5px 10px;border-radius:20px;font-size:.68rem;cursor:pointer">右移 →</button>'+
        '<button onclick="_deleteAlbumImage(\''+charKey+'\',\''+albId+'\','+idx+')" style="background:rgba(229,57,53,.3);border:none;color:#ff8a80;padding:5px 12px;border-radius:20px;font-size:.68rem;cursor:pointer">🗑️ 删除</button>'+
      '</div></div>';
    document.body.appendChild(ov);
  }

  if(img.url)renderViewer(img.url);
  else if(img.id)_loadCGImage(img.id,renderViewer);
  else renderViewer(null);
}

// ── 图片操作 ─────────────────────────────────────────
function _setPrimaryImg(charKey,imgId){
  var cgData=getCGData();var cd=cgData[String(charKey)];if(!cd)return;
  cd.primaryImgId=imgId;saveCGData(cgData);toast('✅ 已设为主形象（将在庄园显示）','ok');
  var ov=document.getElementById('_cg_viewer');if(ov)ov.remove();
  openCharCGAlbums(charKey);
}
function _moveCGImageOrder(charKey,albId,idx,dir){
  var cgData=getCGData();var cd=cgData[String(charKey)];
  var alb=cd&&cd.albums&&cd.albums.find(function(a){return a.id===albId;});if(!alb)return;
  var imgs=alb.images;var ti=idx+dir;
  if(ti<0||ti>=imgs.length)return;
  var tmp=imgs[idx];imgs[idx]=imgs[ti];imgs[ti]=tmp;
  saveCGData(cgData);
  var ov=document.getElementById('_cg_viewer');if(ov)ov.remove();
  openAlbumViewer(charKey,albId,ti);
}
function _editCGImageInfo(charKey,albId,idx){
  var cgData=getCGData();var cd=cgData[String(charKey)];
  var alb=cd&&cd.albums&&cd.albums.find(function(a){return a.id===albId;});if(!alb)return;
  var img=alb.images[idx];if(!img)return;
  var ov=document.getElementById('_cg_viewer');if(ov)ov.remove();
  var body=document.getElementById('exp-detail-body');if(!body)return;
  _setExpDetailTitle('✏️ 编辑图片信息');
  var currentName=img.name||img.title||'';
  body.innerHTML=
    '<label style="font-size:.72rem;color:var(--txt2);display:block;margin-bottom:4px">图片名称</label>'+
    '<input type="text" id="cg-edit-title" value="'+esc(currentName)+'" maxlength="30" style="width:100%;padding:8px;font-size:.82rem;border:1px solid var(--bdr2);border-radius:8px;background:var(--card2);color:var(--txt);box-sizing:border-box;margin-bottom:10px">'+
    '<label style="font-size:.72rem;color:var(--txt2);display:block;margin-bottom:4px">图片描述</label>'+
    '<textarea id="cg-edit-desc" maxlength="200" rows="3" style="width:100%;padding:8px;font-size:.78rem;border:1px solid var(--bdr2);border-radius:8px;background:var(--card2);color:var(--txt);box-sizing:border-box;margin-bottom:12px;resize:none">'+esc(img.desc||'')+'</textarea>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
    '<button class="btn btn-ghost" onclick="openAlbumViewer(\''+charKey+'\',\''+albId+'\','+idx+')">取消</button>'+
    '<button class="btn btn-p" onclick="_saveCGImageInfo(\''+charKey+'\',\''+albId+'\','+idx+')">保存</button>'+
    '</div>';
}
function _saveCGImageInfo(charKey,albId,idx){
  var t=document.getElementById('cg-edit-title');var d=document.getElementById('cg-edit-desc');
  var newName=t?t.value.trim():'';
  var newDesc=d?d.value.trim():'';
  // 初始相册图片编辑走独立存储
  var initAlbs=_getInitialAlbums(charKey);
  var isInit=initAlbs.some(function(a){return a.id===albId;});
  if(isInit){
    var initAlb=initAlbs.find(function(a){return a.id===albId;});
    var imgId=initAlb&&initAlb.images[idx]&&initAlb.images[idx].id;
    if(imgId){
      var editKey='era_init_alb_'+charKey;
      var edits={};try{edits=JSON.parse(localStorage.getItem(editKey)||'{}');}catch(e){}
      if(!edits[albId])edits[albId]={};
      if(!edits[albId].images)edits[albId].images={};
      edits[albId].images[imgId]={name:newName,desc:newDesc};
      try{localStorage.setItem(editKey,JSON.stringify(edits));toast('已保存','ok');}catch(e){toast('保存失败','err');}
    }
    openAlbumViewer(charKey,albId,idx);return;
  }
  var cgData=getCGData();var cd=cgData[String(charKey)];
  var alb=cd&&cd.albums&&cd.albums.find(function(a){return a.id===albId;});if(!alb)return;
  var img=alb.images[idx];if(!img)return;
  img.name=newName; img.title=newName;
  img.desc=newDesc;
  saveCGData(cgData);toast('已保存','ok');openAlbumViewer(charKey,albId,idx);
}
function _deleteAlbumImage(charKey,albId,idx){
  var ov=document.getElementById('_cg_viewer');if(ov)ov.remove();
  openCustomConfirm('🗑️ 删除图片','确认删除这张CG？','确认',function(){
    var cgData=getCGData();var cd=cgData[String(charKey)];
    var alb=cd&&cd.albums&&cd.albums.find(function(a){return a.id===albId;});if(!alb)return;
    var removed=alb.images.splice(idx,1);
    // ★ presetUrl 类型（初始相册图）只从元数据删除，不删 IndexedDB
    if(removed[0]&&removed[0].id&&!removed[0].presetUrl)_deleteCGImage(removed[0].id);
    if(cd.primaryImgId===removed[0].id)cd.primaryImgId=null;
    saveCGData(cgData);toast('已删除','');openAlbumViewer(charKey,albId,Math.min(idx,alb.images.length-1));
  });
}

// ── 上传图片到相册（含压缩 + 进度条）─────────────────
function uploadCGToAlbum(charKey,albId){
  var inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.multiple=true;
  inp.onchange=function(){
    var files=Array.from(inp.files||[]);if(!files.length)return;
    var MAX_MB=30;
    var valid=files.filter(function(f){
      if(f.size>MAX_MB*1024*1024){toast('「'+f.name+'」超过'+MAX_MB+'MB','err');return false;}
      return true;
    });
    if(!valid.length)return;

    var body=document.getElementById('exp-detail-body');
    if(body){
      body.innerHTML='<div style="text-align:center;padding:30px 0">'+
        '<div style="font-size:2.2rem;margin-bottom:12px">📤</div>'+
        '<div id="cg-up-status" style="font-size:.85rem;color:var(--txt);margin-bottom:14px">正在处理图片...</div>'+
        '<div style="background:var(--card2);border-radius:10px;height:10px;overflow:hidden;max-width:240px;margin:0 auto">'+
        '<div id="cg-up-bar" style="height:100%;background:linear-gradient(90deg,var(--acc),var(--acc2));border-radius:10px;width:0%;transition:width .25s"></div>'+
        '</div>'+
        '<div id="cg-up-pct" style="font-size:.72rem;color:var(--muted);margin-top:8px">0 / '+valid.length+'</div>'+
        '</div>';
    }

    var cgData=getCGData();
    if(!cgData[String(charKey)])cgData[String(charKey)]={albums:[],primaryImgId:null};
    var cd=cgData[String(charKey)];
    if(!cd.albums)cd.albums=[];
    var alb=cd.albums.find(function(a){return a.id===albId;});
    if(!alb){toast('相册不存在','err');return;}
    if(!alb.images)alb.images=[];

    var done=0,failed=0;
    function progress(){
      var n=done+failed,t=valid.length,pct=Math.round(n/t*100);
      var bar=document.getElementById('cg-up-bar');
      var status=document.getElementById('cg-up-status');
      var pctEl=document.getElementById('cg-up-pct');
      if(bar)bar.style.width=pct+'%';
      if(status)status.textContent='上传中 '+pct+'%'+(failed?' ('+failed+'失败)':'');
      if(pctEl)pctEl.textContent=n+' / '+t;
      if(n>=t){
        saveCGData(cgData);
        var msg=failed?('完成，'+done+'张成功，'+failed+'张失败'):('🎉 全部上传成功！'+done+'张');
        toast(msg,failed?'err':'ok');
        setTimeout(function(){openAlbumViewer(charKey,albId);},600);
      }
    }

    valid.forEach(function(file){
      _compressImage(file,function(dataUrl,w,h){
        if(!dataUrl){failed++;progress();return;}
        var imgId=_genCGId();
        _saveCGImage(imgId,dataUrl,function(ok){
          if(ok){
            alb.images.push({id:imgId,title:file.name.replace(/\.[^.]+$/,''),desc:'',uploadedAt:Date.now(),size:file.size,w:w,h:h});
            // 自动设第一张为主形象
            if(!cd.primaryImgId)cd.primaryImgId=imgId;
            done++;
          }else{failed++;}
          progress();
        });
      });
    });
  };
  inp.click();
}

// 兼容旧调用
function uploadCG(key){ openCharCGAlbums(key); }
function openCharCGList(charId){ openCharCGAlbums(charId); }
function deleteCG(key,idx){
  var cgData=getCGData();var cd=cgData[String(key)];
  // 旧格式兼容
  if(cd&&!cd.albums&&Array.isArray(cd)){
    var removed=cd.splice(idx,1);
    if(removed[0]&&removed[0].id)_deleteCGImage(removed[0].id);
    cgData[String(key)]=cd;saveCGData(cgData);
  }
}
function editCGInfo(key,idx){openCharCGAlbums(key);}

// 庄园"形象"按钮调用：显示主形象
function viewCharCG(charId){
  _migrateCGData();
  var cgData=getCGData();var cd=cgData[String(charId)];
  if(!cd||!cd.albums||!cd.albums.length){
    // ★ 优先展示制作者预设立绘（_presetImages）
    var _crCG=typeof CharRegistry!=='undefined'
      ?(CharRegistry.get(charId)||CharRegistry.get(parseInt(charId))):null;
    if(_crCG&&_crCG._presetImages&&_crCG._presetImages.length){
      _viewPresetImage(String(charId),0);return;
    }
    openCharCGAlbums(charId);return;
  }
  if(!cd.primaryImgId){
    // 找第一张图
    var firstAlb=cd.albums.find(function(a){return a.images&&a.images.length;});
    if(firstAlb&&firstAlb.images.length){
      var fi=firstAlb.images[0];
      if(fi.url)_showFullCG(cd,fi,firstAlb.id,0,charId);
      else if(fi.id)_loadCGImage(fi.id,function(url){if(url){fi.url=url;}_showFullCG(cd,fi,firstAlb.id,0,charId);});
      return;
    }
    openCharCGAlbums(charId);return;
  }
  // 找到主形象所在相册
  for(var ai=0;ai<cd.albums.length;ai++){
    var alb=cd.albums[ai];
    var imgs=alb.images||[];
    for(var ii=0;ii<imgs.length;ii++){
      if(imgs[ii].id===cd.primaryImgId){
        var img=imgs[ii];
        if(img.url)_showFullCG(cd,img,alb.id,ii,charId);
        else _loadCGImage(img.id,function(url){if(url){img.url=url;}_showFullCG(cd,img,alb.id,ii,charId);});
        return;
      }
    }
  }
  openCharCGAlbums(charId);
}
function _showFullCG(cd,img,albId,idx,charKey){
  var ov=document.getElementById('_cg_viewer');if(ov)ov.remove();
  var alb=(cd.albums||[]).find(function(a){return a.id===albId;});
  var imgs=alb?alb.images:[];
  var outer=document.createElement('div');outer.id='_cg_viewer';
  outer.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.93);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px)';
  outer.onclick=function(e){if(e.target===outer)outer.remove();};
  var prevI=idx>0?idx-1:imgs.length-1;
  var nextI=idx<imgs.length-1?idx+1:0;
  var nav=imgs.length>1?
    '<button onclick="_viewAlbumImage(\''+charKey+'\',\''+albId+'\','+prevI+')" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.15);border:none;color:#fff;font-size:1.8rem;padding:6px 14px;border-radius:50%;cursor:pointer">‹</button>'+
    '<button onclick="_viewAlbumImage(\''+charKey+'\',\''+albId+'\','+nextI+')" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.15);border:none;color:#fff;font-size:1.8rem;padding:6px 14px;border-radius:50%;cursor:pointer">›</button>':'';
  outer.innerHTML='<div style="position:relative;max-width:640px;width:100%;text-align:center;padding:10px">'+nav+
    '<img src="'+(img.url||'')+'" style="max-width:90%;max-height:72vh;object-fit:contain;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.7)">'+
    '<div style="margin-top:10px">'+
      (img.title?'<div style="color:#fff;font-size:.92rem;font-weight:700">'+esc(img.title)+'</div>':'')+
      (img.desc?'<div style="color:rgba(255,255,255,.7);font-size:.75rem;margin-top:4px">'+esc(img.desc)+'</div>':'')+
      '<div style="color:rgba(255,255,255,.4);font-size:.6rem;margin-top:6px">'+(idx+1)+' / '+imgs.length+' · 点击空白关闭</div>'+
    '</div></div>';
  document.body.appendChild(outer);
}

// ── 向后兼容的旧函数 ────────────────────────────────
function viewCGImage(key,index){openCharCGAlbums(key);}
function _loadCGUrls(metas,cb){
  if(!metas||!metas.length){cb([]);return;}
  var res=new Array(metas.length);var cnt=0;
  metas.forEach(function(m,i){
    if(m.url){res[i]=Object.assign({},m);cnt++;if(cnt===metas.length)cb(res);return;}
    _loadCGImage(m.id,function(url){res[i]=Object.assign({},m,{url:url||''});cnt++;if(cnt===metas.length)cb(res);});
  });
}
// _setExpDetailTitle() 在 index.html 中定义
// esc() 在 state.js 中定义，此处不再重复
