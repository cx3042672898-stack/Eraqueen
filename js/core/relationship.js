// ================================================================
// js/core/relationship.js — 人际关系 + 偷情 + 拍卖系统
// ================================================================
function getRelationshipData(){try{return JSON.parse(localStorage.getItem('era_relationships')||'{}');}catch(e){return{};}}
function saveRelationshipData(d){localStorage.setItem('era_relationships',JSON.stringify(d));}
function _relKey(a,b){var arr=[String(a),String(b)].sort();return 'rel_'+arr[0]+'_'+arr[1];}
function getSlaveRelation(idA,idB){var d=getRelationshipData(),k=_relKey(idA,idB);return(d[k]&&d[k].affection)||0;}
function setSlaveRelation(idA,idB,val){var d=getRelationshipData(),k=_relKey(idA,idB);if(!d[k])d[k]={affection:0};d[k].affection=Math.max(-100,Math.min(100,val));saveRelationshipData(d);}
function addSlaveRelation(idA,idB,delta){var cur=getSlaveRelation(idA,idB);setSlaveRelation(idA,idB,cur+delta);return cur+delta;}
function getRelationStageLabel(val){
  if(val>=80)return{name:'亲密无间',icon:'💞',color:'#e57373'};
  if(val>=60)return{name:'恋慕',icon:'💗',color:'#f06292'};
  if(val>=40)return{name:'好友',icon:'😊',color:'#81c784'};
  if(val>=20)return{name:'熟识',icon:'🤝',color:'#64b5f6'};
  if(val>=0)return{name:'普通',icon:'',color:'var(--muted)'};
  return{name:'不和',icon:'😒',color:'#ffb74d'};
}
function afterDateRelationBoost(idA,idB,gain){
  addSlaveRelation(idA,idB,gain||5);
  // 记录约会历史
  var data=getRelationshipData();var key=_relKey(idA,idB);
  if(!data[key])data[key]={affection:getSlaveRelation(idA,idB)};
  if(!data[key].dates)data[key].dates=[];
  data[key].dates.push({day:State.day||1,gain:gain||5});
  if(data[key].dates.length>10)data[key].dates=data[key].dates.slice(-10);
  saveRelationshipData(data);
}

// ── 偷情事件 ──
var AFFAIR_STORIES=[
  {min:60,title:'深夜的私会',story:function(a,b){return['深夜，走廊里传来细微的脚步声。','你好奇地推开门缝，看到'+a+'正悄悄走向'+b+'的房间。','「……嘘。」'+a+'轻轻推开了门。','看来，你的奴隶之间正在发展着某些超出预期的关系。'];}},
  {min:70,title:'花园的秘密',story:function(a,b){return['午后的花园里，'+a+'和'+b+'坐在一起，距离比你预想的近得多。','「……主人知道了会怎么样？」'+b+'小声问。','「不知道。不过……这一刻我不想考虑那些。」','两人的手在膝盖上碰了碰，谁也没有缩回去。'];}},
  {min:80,title:'被发现的秘密',story:function(a,b){return['你推开房门的时候，两个人都吓了一跳。',a+'匆忙整理着衣领，'+b+'红着脸低下了头。','「这……主人，我可以解释……」','空气中弥漫着微妙的香气，你什么都明白了。'];}}
];
function checkAffairEvent(){
  var allChars=(typeof CHARS_DATA!=='undefined')?CHARS_DATA.filter(function(c){return loadSave(c.id)&&loadSave(c.id).char;}):[];
  if(allChars.length<2)return null;
  for(var att=0;att<3;att++){
    var i=Math.floor(Math.random()*allChars.length),j=Math.floor(Math.random()*allChars.length);
    if(i===j)continue;
    var a=allChars[i],b=allChars[j],rel=getSlaveRelation(a.id,b.id);
    var cands=AFFAIR_STORIES.filter(function(ev){return rel>=ev.min;});
    if(!cands.length)continue;var affairProb=(typeof getEventProb==='function')?getEventProb('affair'):0.10;if(Math.random()>affairProb)continue;
    var ev=cands[Math.floor(Math.random()*cands.length)];
    var svA=loadSave(a.id),svB=loadSave(b.id);
    var nA=svA&&svA.char?svA.char.name:a.name,nB=svB&&svB.char?svB.char.name:b.name;
    return{title:ev.title,story:ev.story(nA,nB),charA:nA,charB:nB,idA:a.id,idB:b.id};
  }
  return null;
}

// ── 拍卖系统 ──
function openAuctionPanel(){
  var body=document.getElementById('auction-body');if(!body)return;
  var acquired=CHARS_DATA.filter(function(c){return loadSave(c.id)&&loadSave(c.id).char;});
  if(!acquired.length){body.innerHTML='<div style="text-align:center;padding:30px 0;color:var(--muted)"><div style="font-size:2rem;margin-bottom:8px">🔨</div><p>没有可拍卖的奴隶。</p></div><button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-auction\')">关闭</button>';openOv('ov-auction');return;}
  var html='<div style="font-size:.78rem;color:var(--muted);margin-bottom:14px;line-height:1.7">将已调教的奴隶拍卖出售。调教程度越高，拍卖价格越高。<br><span style="color:#e53935">⚠️ 拍卖后奴隶将永久消失，与其关系好的奴隶可能会产生负面情绪。</span></div>';
  acquired.forEach(function(baseC){
    var sv=loadSave(baseC.id);if(!sv||!sv.char)return;var c=sv.char;
    var price=_calcAuctionPrice(c);
    var cid=typeof baseC.id==='number'?baseC.id:JSON.stringify(baseC.id);
    html+='<div style="display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--bdr2);border-radius:10px;padding:10px 12px;margin-bottom:8px">';
    html+=(typeof _buildSlaveAvaHtml==='function'?_buildSlaveAvaHtml(baseC.id,44,false):'<div style="font-size:1.5rem">'+cEmoji(c)+'</div>');
    html+='<div style="flex:1;min-width:0"><div style="font-weight:700;color:var(--txt)">'+esc(c.name)+'</div>';
    html+='<div style="font-size:.68rem;color:var(--muted)">训练'+Math.round(c.total_training_count||0)+'次 · 好感'+Math.round(c.affection||0)+' · 服从'+Math.round(c.obedience||0)+'</div></div>';
    html+='<button class="btn btn-sm" style="background:rgba(240,192,80,.15);color:#f0c050;border:1px solid rgba(240,192,80,.3);white-space:nowrap" onclick="confirmAuction('+cid+','+price+')">💰$'+price.toLocaleString()+'</button>';
    html+='</div>';
  });
  html+='<button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-auction\')" style="margin-top:10px">关闭</button>';
  body.innerHTML=html;openOv('ov-auction');
}
function _calcAuctionPrice(c){
  var base=500;
  base+=(c.total_training_count||0)*20;
  base+=(c.affection||0)*15;
  base+=(c.obedience||0)*15;
  base+=(c.lust||0)*10;
  return Math.round(base);
}
function confirmAuction(charId,price){
  var sv=loadSave(charId);if(!sv||!sv.char)return;var c=sv.char;
  openCustomConfirm('🔨 确认拍卖','<div style="text-align:center;padding:8px 0"><div style="display:flex;justify-content:center;margin-bottom:8px">'+(typeof _buildSlaveAvaHtml==='function'?_buildSlaveAvaHtml(charId,56,false):'<div style="font-size:2rem">'+cEmoji(c)+'</div>')+'</div><div style="font-weight:700;font-size:1rem;margin-bottom:6px">'+esc(c.name)+'</div><div style="color:#f0c050;font-size:1.2rem;font-weight:800;margin-bottom:10px">💰 $'+price.toLocaleString()+'</div><div style="font-size:.78rem;color:#e53935;line-height:1.7">拍卖后此奴隶将永久消失！<br>与其关系好的奴隶可能产生失落情绪。</div></div>','确认拍卖',function(){
    doAuction(charId,price,c);
  });
}
function doAuction(charId,price,c){
  // 删除存档
  localStorage.removeItem('era_sv_'+charId);
  State.money=(State.money||0)+price;
  if(typeof _logMoney==='function')_logMoney('拍卖·'+c.name,price);
  if(typeof saveMiniState==='function')saveMiniState();
  if(typeof renderPlayerCard==='function')renderPlayerCard();
  // 如果是当前角色，清空
  if(State.currentChar&&String(State.currentChar.id)===String(charId)){State.currentChar=null;State.gameLog=[];}
  // 关系好的奴隶产生负面反应
  var allChars=(typeof CHARS_DATA!=='undefined')?CHARS_DATA.filter(function(cc){return cc.id!==charId&&loadSave(cc.id)&&loadSave(cc.id).char;}):[];
  var affectedNames=[];
  allChars.forEach(function(cc){
    var rel=getSlaveRelation(charId,cc.id);
    if(rel>=30){
      affectedNames.push(cc.name);
      var sv2=loadSave(cc.id);
      if(sv2&&sv2.char){
        sv2.char.affection=Math.max(0,(sv2.char.affection||0)-10);
        if(sv2.char.emotionState)sv2.char.emotionState.vulnerable=Math.min(100,(sv2.char.emotionState.vulnerable||0)+20);
        localStorage.setItem('era_sv_'+cc.id,JSON.stringify(sv2));
      }
    }
  });
  // 拍卖剧情（优先使用角色专属 auctionEnding，否则用默认）
  var story=['拍卖师一锤定音，'+esc(c.name)+'被买走了。','在离开的那一刻，'+esc(c.name)+'回头看了你最后一眼——','那个眼神里有太多说不清的东西。然后，人群将你们隔开了。','获得了 $'+price.toLocaleString()+' 金币。'];
  var auctionTitle='🔨 拍卖·'+c.name;
  if(typeof CharRegistry!=='undefined'){
    var charData=CharRegistry.get(charId);
    if(charData&&charData.auctionEnding&&charData.auctionEnding.story){
      var ae=charData.auctionEnding;
      story=(Array.isArray(ae.story)?ae.story:[String(ae.story)]).concat(['','获得了 $'+price.toLocaleString()+' 金币。']);
      if(typeof applyStoryPlaceholders==='function')story=story.map(function(p){return applyStoryPlaceholders(p);});
      auctionTitle=ae.title||auctionTitle;
    }
  }
  if(affectedNames.length){story.push('');story.push('消息传开后，'+affectedNames.join('、')+'的情绪明显低落了。');story.push('「……为什么？」有人低声自语。也许需要一些时间来抚平这道伤痕。');}
  if(typeof pushStoryLog==='function')pushStoryLog('daily',{title:'拍卖·'+c.name,date:typeof getDateStr==='function'?getDateStr():'',char:c.name,story:story});
  closeOv('ov-auction');
  if(typeof openStoryModal==='function')setTimeout(function(){openStoryModal({title:auctionTitle,story:story,cat:'special',noSplit:true},'拍卖',{});},100);
  if(typeof renderManor==='function')renderManor();
}

// ── 人际关系面板 ──
function openRelationshipPanel(){
  var body=document.getElementById('relationship-body');if(!body)return;
  var allChars=(typeof CHARS_DATA!=='undefined')?CHARS_DATA.filter(function(c){return loadSave(c.id)&&loadSave(c.id).char;}):[];
  var html='<div style="font-size:.78rem;color:var(--muted);margin-bottom:14px;line-height:1.7">查看奴隶之间的关系好感度。约会和共同活动会影响好感。</div>';
  if(allChars.length<2){html+='<div style="text-align:center;padding:30px 0;color:var(--muted)"><div style="font-size:2rem;margin-bottom:8px">💕</div><p>需要至少2位奴隶。</p></div>';}
  else{
    var pairs=[];
    for(var i=0;i<allChars.length;i++)for(var j=i+1;j<allChars.length;j++){
      var rel=getSlaveRelation(allChars[i].id,allChars[j].id);
      if(rel!==0){var svA=loadSave(allChars[i].id),svB=loadSave(allChars[j].id);pairs.push({a:svA&&svA.char?svA.char:allChars[i],b:svB&&svB.char?svB.char:allChars[j],val:rel});}
    }
    pairs.sort(function(x,y){return y.val-x.val;});
    if(!pairs.length)html+='<div style="text-align:center;padding:20px 0;color:var(--muted);font-size:.82rem">暂无关系数据。通过约会可建立关系。</div>';
    else pairs.forEach(function(p){
      var stage=getRelationStageLabel(p.val);var pct=Math.max(0,Math.min(100,(p.val+100)/2));
      html+='<div style="background:var(--card);border:1px solid var(--bdr2);border-radius:10px;padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;gap:8px;cursor:pointer" onclick="openRelDiary(\''+p.a.id+'\',\''+p.b.id+'\')">';
      html+=(typeof _buildSlaveAvaHtml==='function'?_buildSlaveAvaHtml(p.a.id,32,false):'<div style="font-size:1.1rem">'+cEmoji(p.a)+'</div>')+'<div style="flex:1;min-width:0">';
      html+='<div style="font-size:.82rem;font-weight:700;color:var(--txt)">'+esc(p.a.name)+' × '+esc(p.b.name)+'</div>';
      html+='<div style="display:flex;align-items:center;gap:6px;margin-top:3px"><span style="font-size:.68rem;color:'+stage.color+';font-weight:600">'+stage.icon+' '+stage.name+'</span>';
      html+='<div style="flex:1;height:4px;background:var(--bdr);border-radius:2px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+stage.color+';border-radius:2px"></div></div>';
      html+='<span style="font-size:.68rem;color:var(--muted)">'+p.val+'</span></div></div>';
      html+=(typeof _buildSlaveAvaHtml==='function'?_buildSlaveAvaHtml(p.b.id,32,false):'<div style="font-size:1.1rem">'+cEmoji(p.b)+'</div>')+'</div>';
    });
  }
  html+='<button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-relationship\')" style="margin-top:10px">关闭</button>';
  body.innerHTML=html;openOv('ov-relationship');
}

// ── 关系日记 ──
// ── 关系日记（可视化+性格差异）──
function openRelDiary(idA,idB){
  var svA=loadSave(idA),svB=loadSave(idB);
  if(!svA||!svA.char||!svB||!svB.char)return;
  var a=svA.char,b=svB.char;
  var rel=getSlaveRelation(idA,idB);
  var stage=getRelationStageLabel(rel);
  var diary=_genRelDiary(a,b,rel,stage);
  var html='<div style="text-align:center;margin-bottom:14px">';
  html+='<div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px">'+(typeof _buildSlaveAvaHtml==='function'?_buildSlaveAvaHtml(idA,48,false):'<div style="font-size:2rem">'+cEmoji(a)+'</div>')+'<div style="font-size:1.5rem;color:'+stage.color+'">'+stage.icon+'</div>'+(typeof _buildSlaveAvaHtml==='function'?_buildSlaveAvaHtml(idB,48,false):'<div style="font-size:2rem">'+cEmoji(b)+'</div>')+'</div>';
  html+='<div style="font-weight:800;font-size:1rem;color:var(--txt)">'+esc(a.name)+' × '+esc(b.name)+'</div>';
  html+='<div style="font-size:.72rem;color:'+stage.color+';margin-top:2px">'+stage.icon+' '+stage.name+' · 好感度 '+rel+'</div>';
  html+='</div>';
  // 好感度可视化进度
  var pct=Math.max(0,Math.min(100,(rel+100)/2));
  html+='<div style="margin-bottom:14px"><div style="height:8px;background:var(--bdr2);border-radius:4px;overflow:hidden;position:relative">';
  html+='<div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,'+stage.color+','+stage.color+'88);border-radius:4px;transition:width .5s"></div>';
  html+='</div><div style="display:flex;justify-content:space-between;margin-top:3px;font-size:.58rem;color:var(--muted)"><span>敌对</span><span>普通</span><span>亲密</span></div></div>';
  // 日记
  html+='<div style="font-size:.78rem;font-weight:700;color:var(--txt);margin-bottom:8px">📖 心路历程</div>';
  html+='<div style="position:relative;padding-left:16px;border-left:2px solid '+stage.color+'44;margin-bottom:12px">';
  diary.forEach(function(entry,idx){
    var dotColor=idx<diary.length-1?stage.color+'88':stage.color;
    html+='<div style="position:relative;margin-bottom:12px"><div style="position:absolute;left:-21px;top:4px;width:10px;height:10px;border-radius:50%;background:'+dotColor+';border:2px solid var(--card)"></div>';
    html+='<div style="font-size:.78rem;color:var(--txt2);line-height:1.7">'+entry+'</div></div>';
  });
  html+='</div>';
  // 约会记录
  var relData=getRelationshipData();var rKey=_relKey(idA,idB);var dateHistory=(relData[rKey]&&relData[rKey].dates)||[];
  if(dateHistory.length){
    html+='<div style="font-size:.78rem;font-weight:700;color:var(--txt);margin:12px 0 8px">💐 约会记录</div>';
    dateHistory.forEach(function(d){
      var dateStr=(typeof _dayToMD==='function')?_dayToMD(d.day).month+'月'+_dayToMD(d.day).day+'日':'第'+d.day+'天';
      var comment=_genDateComment(a,b,d.gain);
      html+='<div style="background:var(--card2);border-radius:8px;padding:8px 10px;margin-bottom:6px;font-size:.72rem"><div style="color:var(--muted);margin-bottom:3px">📅 '+dateStr+' · 好感+'+d.gain+'</div><div style="color:var(--txt2);line-height:1.6">'+comment+'</div></div>';
    });
  }
  html+='<button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-slave-detail\')" style="margin-top:8px">关闭</button>';
  var body=document.getElementById('slave-detail-body');
  if(body){body.innerHTML=html;openOv('ov-slave-detail');}
}
function _genRelDiary(a,b,rel,stage){
  var nA=a.name,nB=b.name;
  var pA=a.personality||'',pB=b.personality||'';
  var lines=[];
  // 根据双方性格生成不同文案
  var aIsTs=(/温柔|温和/.test(pA)),aIsPs=(/高傲|傲娇/.test(pA)),aIsCo=(/冷漠|无口/.test(pA));
  var bIsTs=(/温柔|温和/.test(pB)),bIsPs=(/高傲|傲娇/.test(pB)),bIsCo=(/冷漠|无口/.test(pB));
  lines.push('最初在庄园相遇时，两人只是陌生的同伴。');
  if(rel>=10){
    if(aIsTs)lines.push(nA+'总是温柔地关注着周围的人，'+nB+'也不例外。一个微笑，一杯水——细小的善意开始积累。');
    else if(aIsPs)lines.push('「才不是在关心你。」'+nA+'嘴上这么说，但'+nB+'注意到'+nA+'总会留一份零食在桌上。');
    else if(aIsCo)lines.push(nA+'依旧沉默寡言，但'+nB+'发现'+nA+'会默默帮自己做一些小事。');
    else lines.push('第一次真正说上话，是在某个训练结束后的傍晚。'+nA+'递了一杯水，'+nB+'接过来，眼神有些惊讶。');
  }
  if(rel>=25){
    if(bIsPs)lines.push('「你……不讨厌。」这大概是'+nB+'能给出的最高评价了。'+nA+'听了只是笑笑。');
    else if(bIsCo)lines.push(nB+'仍然话不多，但开始在'+nA+'身边停留得更久了。沉默本身变成了一种交流。');
    else lines.push('吃饭的时候会不自觉地坐到一起。两人开始分享训练中的小趣事。');
  }
  if(rel>=40)lines.push('有一天'+nA+'受了伤——不严重，但'+nB+'罕见地流露出焦急的表情。「小心点啊，笨蛋。」');
  if(rel>=55)lines.push('开始在深夜里聊心事了。关于过去，关于现在，关于那些不敢对主人说的话。'+nA+'发现'+nB+'远比表面看起来更脆弱。');
  if(rel>=65){
    if(aIsTs&&bIsPs)lines.push(''+nA+'总是包容着'+nB+'的小脾气。慢慢地，'+nB+'也不再需要用刺来武装自己了。');
    else lines.push('第一次握手。在庄园的角落里，趁着没人看见。掌心微微出汗，但谁也没有松开。');
  }
  if(rel>=80)lines.push('在这个不自由的地方，两人找到了彼此。也许还不知道该叫它什么名字——但它很温暖，很珍贵。');
  if(rel>=90)lines.push('已经不需要语言了。一个眼神就能读懂彼此。无论未来如何，此刻的连结是真实的。');
  if(rel<0)lines.push('不知从何时起，两人之间多了一层说不清的隔阂。也许是性格的碰撞，也许是其他原因。');
  return lines;
}

function _genDateComment(a,b,gain){
  var pA=a.personality||'',pB=b.personality||'';
  var comments=[];
  if(gain>=8)comments=['两人度过了非常愉快的时光。回来的路上，一直在笑。','这是一次完美的约会。空气中都是甜蜜的气息。'];
  else if(gain>=5)comments=['约会还算顺利，虽然中间有些小插曲。','普通但温暖的一天，两人的距离又近了一些。'];
  else comments=['约会有些尴尬，但至少迈出了第一步。','虽然气氛有些僵硬，但彼此都在努力。'];
  if(/高傲/.test(pA))comments.push(a.name+'嘴上说着无聊，但一直没有提前离开。');
  if(/温柔/.test(pB))comments.push(b.name+'始终微笑着，让整个约会充满了暖意。');
  if(/冷漠/.test(pA))comments.push(a.name+'话不多，但偶尔投来的目光很认真。');
  return comments[Math.floor(Math.random()*comments.length)];
}

