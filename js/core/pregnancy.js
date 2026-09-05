// ================================================================
// js/core/pregnancy.js — 孕育系统（未孕/怀孕/育儿/子嗣）
// ================================================================
function getPregnancyData(){try{return JSON.parse(localStorage.getItem('era_pregnancy')||'{}');}catch(e){return{};}}
function savePregnancyData(d){localStorage.setItem('era_pregnancy',JSON.stringify(d));}
function getChildrenData(){try{return JSON.parse(localStorage.getItem('era_children')||'[]');}catch(e){return[];}}
function saveChildrenData(d){localStorage.setItem('era_children',JSON.stringify(d));}

function canGetPregnant(c){if(!c)return false;var g=c.gender||'';if(g==='女'||g==='双性')return true;if(g==='男'&&c.hypno_omega)return true;return false;}
function _dayToMD(day){var m=[31,28,31,30,31,30,31,31,30,31,30,31],d=Math.max(0,(day-1))%365,mo=0;while(d>=m[mo]){d-=m[mo];mo++;}return{month:mo+1,day:d+1};}
function isHeatDay(c,day){if(!c||!c.hypno_omega)return false;return _dayToMD(day||State.day||1).day===15;}
function getPregnancyChance(c,day){if(!canGetPregnant(c))return 0;var base=0.05;if(isHeatDay(c,day))base=0.15;if(c._ovulationBoost)base+=0.10;return Math.min(0.50,base);}
function tryPregnancy(charId,fatherId,fatherName){
  var pData=getPregnancyData();var key=String(charId);if(pData[key]&&pData[key].pregnant)return false;
  var sv=loadSave(charId);if(!sv||!sv.char)return false;var c=sv.char;if(!canGetPregnant(c)||(c.expCreampie||0)<=0)return false;
  if(Math.random()>=getPregnancyChance(c,State.day||1))return false;
  pData[key]={pregnant:true,fatherId:fatherId||'master',fatherName:fatherName||'主人',startDay:State.day||1,duration:30,progress:0,born:false,postpartumDays:0,nursing:false};
  savePregnancyData(pData);toast('🤰 '+(c.name||'奴隶')+'怀孕了！','ai');return true;
}
function advancePregnancy(){
  var pData=getPregnancyData();var changed=false;
  for(var key in pData){var p=pData[key];if(!p.pregnant)continue;
    if(!p.born){p.progress++;changed=true;
      if(p.progress>=p.duration){p.born=true;p.birthDay=State.day||1;p.nursing=true;p.postpartumDays=0;
        var sv=loadSave(parseInt(key)||key);var name=sv&&sv.char?sv.char.name:'奴隶';
        var child={id:'child_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),name:_genChildName(),gender:Math.random()>0.5?'女':'男',birthDay:State.day||1,motherId:key,motherName:name,fatherId:p.fatherId,fatherName:p.fatherName,age:0,grownUp:false};
        var children=getChildrenData();children.push(child);saveChildrenData(children);
        toast('👶 '+name+'生了一个'+child.gender+'孩！取名「'+child.name+'」','ai');
      }
    }else if(p.nursing){p.postpartumDays=(p.postpartumDays||0)+1;changed=true;
      if(p.postpartumDays>=7){p.nursing=false;p.pregnant=false;}
    }
  }
  if(changed)savePregnancyData(pData);
  var children=getChildrenData();var cCh=false;
  children.forEach(function(ch){if(!ch.grownUp){ch.age=Math.floor(((State.day||1)-ch.birthDay)/30);if(ch.age>=18){ch.grownUp=true;cCh=true;toast('🎉 '+ch.name+'已经长大成人了！','ai');}}});
  if(cCh)saveChildrenData(children);
}
function _genChildName(){return['小星','小月','小雪','小花','小风','小雨','小云','小泉','小晴','小夜','小凛','小枫'][Math.floor(Math.random()*12)];}
function getHeatBadge(c){if(!c||!c.hypno_omega||!isHeatDay(c,State.day||1))return '';return '<span style="background:#e57373;color:#fff;padding:1px 6px;border-radius:8px;font-size:.6rem;font-weight:700;margin-left:4px">🔥发情</span>';}
function dailyPregnancyCheck(){advancePregnancy();
  if(typeof CHARS_DATA==='undefined')return;
  CHARS_DATA.forEach(function(bc){var sv=loadSave(bc.id);if(!sv||!sv.char)return;var c=sv.char;if(!canGetPregnant(c)||(c.expCreampie||0)<=0)return;
    var pData=getPregnancyData();if(pData[String(bc.id)]&&pData[String(bc.id)].pregnant)return;tryPregnancy(bc.id,'master','主人');});
}

// ── 孕育面板（4模块标签页） ──
var _pregTab='notpreg';
function openPregnancyPanel(){_renderPregPanel(document.getElementById('pregnancy-body'));openOv('ov-pregnancy');}
function _setPregTab(t){_pregTab=t;_renderPregPanel(document.getElementById('pregnancy-body'));}
function _renderPregPanel(body){
  if(!body)return;var pData=getPregnancyData();var children=getChildrenData();
  var allChars=(typeof CHARS_DATA!=='undefined')?CHARS_DATA.filter(function(c){return loadSave(c.id)&&loadSave(c.id).char;}):[];
  var tabs=[{k:'notpreg',label:'未孕',icon:'🌸'},{k:'pregnant',label:'怀孕',icon:'🤰'},{k:'nursing',label:'育儿',icon:'🍼'},{k:'children',label:'子嗣',icon:'👶'}];
  var html='<div style="display:flex;gap:4px;margin-bottom:14px">';
  tabs.forEach(function(t){var on=_pregTab===t.k;html+='<button style="flex:1;padding:8px 0;border-radius:8px;border:1px solid '+(on?'var(--acc)':'var(--bdr2)')+';background:'+(on?'var(--acc)':'var(--card)')+';color:'+(on?'#fff':'var(--txt2)')+';font-size:.72rem;font-weight:700;cursor:pointer" onclick="_setPregTab(\''+t.k+'\')">'+t.icon+' '+t.label+'</button>';});
  html+='</div>';
  if(_pregTab==='notpreg'){var any=false;
    allChars.forEach(function(bc){var sv=loadSave(bc.id);if(!sv||!sv.char)return;var c=sv.char;if(!canGetPregnant(c))return;var key=String(bc.id);if(pData[key]&&pData[key].pregnant)return;any=true;
      var isHeat=isHeatDay(c,State.day||1);var chance=Math.round(getPregnancyChance(c,State.day||1)*100);
      html+='<div style="background:var(--card);border:1px solid var(--bdr2);border-radius:10px;padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;gap:10px;cursor:pointer" onclick="_pregInteract(\'notpreg\','+bc.id+')">';
      html+=(typeof _buildSlaveAvaHtml==='function'?_buildSlaveAvaHtml(bc.id,36,false):'<div style="font-size:1.3rem">'+cEmoji(c)+'</div>')+'<div style="flex:1"><div style="font-weight:700;font-size:.82rem;color:var(--txt)">'+esc(c.name)+'</div>';
      html+='<div style="font-size:.65rem;color:var(--muted)">内射：'+(c.expCreampie||0)+' · 概率：'+chance+'%'+(isHeat?' <span style="color:#e57373">🔥发情</span>':'')+'</div></div><span style="color:var(--muted)">›</span></div>';
    });if(!any)html+='<div style="text-align:center;padding:20px 0;color:var(--muted)">🌸 无未孕的可孕奴隶</div>';
  }else if(_pregTab==='pregnant'){var any2=false;
    allChars.forEach(function(bc){var sv=loadSave(bc.id);if(!sv||!sv.char)return;var c=sv.char;var key=String(bc.id);var p=pData[key];if(!p||!p.pregnant||p.born)return;any2=true;
      var pct=Math.min(100,Math.round(p.progress/p.duration*100));
      html+='<div style="background:var(--card);border:1px solid #e57373;border-radius:10px;padding:12px;margin-bottom:8px;cursor:pointer" onclick="_pregInteract(\'pregnant\','+bc.id+')">';
      html+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">'+(typeof _buildSlaveAvaHtml==='function'?_buildSlaveAvaHtml(bc.id,36,false):'<div style="font-size:1.3rem">'+cEmoji(c)+'</div>')+'<div style="flex:1"><div style="font-weight:700;color:var(--txt)">'+esc(c.name)+'</div><div style="font-size:.65rem;color:var(--muted)">父亲：'+esc(p.fatherName)+'</div></div><span style="color:#e57373;font-weight:700">'+pct+'%</span></div>';
      html+='<div style="height:6px;background:var(--bdr);border-radius:3px"><div style="height:100%;width:'+pct+'%;background:#e57373;border-radius:3px"></div></div>';
      html+='<div style="font-size:.62rem;color:var(--muted);margin-top:3px">'+p.progress+'/'+p.duration+'天</div></div>';
    });if(!any2)html+='<div style="text-align:center;padding:20px 0;color:var(--muted)">🤰 无怀孕中奴隶</div>';
  }else if(_pregTab==='nursing'){var any3=false;
    allChars.forEach(function(bc){var sv=loadSave(bc.id);if(!sv||!sv.char)return;var c=sv.char;var key=String(bc.id);var p=pData[key];if(!p||!p.nursing)return;any3=true;
      html+='<div style="background:var(--card);border:1px solid #ffb74d;border-radius:10px;padding:12px;margin-bottom:8px;cursor:pointer" onclick="_pregInteract(\'nursing\','+bc.id+')">';
      html+='<div style="display:flex;align-items:center;gap:10px">'+(typeof _buildSlaveAvaHtml==='function'?_buildSlaveAvaHtml(bc.id,36,false):'<div style="font-size:1.3rem">'+cEmoji(c)+'</div>')+'<div style="flex:1"><div style="font-weight:700;color:var(--txt)">'+esc(c.name)+'</div><div style="font-size:.65rem;color:#ffb74d">🍼 坐月子 第'+(p.postpartumDays||1)+'/7天</div></div><span style="color:var(--muted)">›</span></div></div>';
    });if(!any3)html+='<div style="text-align:center;padding:20px 0;color:var(--muted)">🍼 无在育儿的奴隶</div>';
  }else{
    if(!children.length)html+='<div style="text-align:center;padding:20px 0;color:var(--muted)">👶 还没有子嗣</div>';
    else children.forEach(function(ch){
      var ageL=ch.age<1?'新生儿':ch.age<6?ch.age+'岁·幼儿':ch.age<12?ch.age+'岁·儿童':ch.age<18?ch.age+'岁·少年':ch.age+'岁·成人';
      var icon=ch.age<18?(ch.gender==='女'?'👧':'👦'):(ch.gender==='女'?'👩':'👨');
      html+='<div style="background:var(--card);border:1px solid '+(ch.grownUp?'#81c784':'var(--bdr2)')+';border-radius:10px;padding:12px;margin-bottom:8px">';
      html+='<div style="display:flex;align-items:center;gap:10px"><div style="font-size:1.5rem">'+icon+'</div><div style="flex:1"><div style="font-weight:700;color:var(--txt)">'+esc(ch.name)+(ch.role?(' · <span style="font-size:.65rem;color:var(--acc2)">'+(ch.role==='trainer'?'🎓调教师':'⛓️奴隶')+'</span>'):'' )+'</div><div style="font-size:.65rem;color:var(--muted)">'+ch.gender+' · '+ageL+' · 母：'+esc(ch.motherName)+'</div></div>';
      if(ch.grownUp&&!ch.role)html+='<div style="display:flex;flex-direction:column;gap:3px"><button class="btn btn-sm" style="font-size:.58rem;padding:2px 6px" onclick="_childBecome(\''+ch.id+'\',\'trainer\')">调教师</button><button class="btn btn-sm" style="font-size:.58rem;padding:2px 6px;color:#e57373" onclick="_childBecome(\''+ch.id+'\',\'slave\')">奴隶</button></div>';
      html+='</div></div>';
    });
  }
  html+='<button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-pregnancy\')" style="margin-top:10px">关闭</button>';
  body.innerHTML=html;
}
function _childBecome(childId,role){var children=getChildrenData();var ch=children.find(function(c){return c.id===childId;});if(!ch)return;ch.role=role;saveChildrenData(children);toast(role==='trainer'?'🎓 成为调教师！':'⛓️ 成为奴隶…','ok');_renderPregPanel(document.getElementById('pregnancy-body'));}
function _pregInteract(mode,charId){
  var sv=loadSave(charId);if(!sv||!sv.char)return;var c=sv.char;var pData=getPregnancyData();var p=pData[String(charId)];
  var story=[],title='';var persona=c.personality||'';
  if(mode==='notpreg'){title='🌸 '+c.name;
    if(/温柔/.test(persona))story=['你来到'+c.name+'身边，她温柔地笑了。','「主人，今天也辛苦了。」','虽然还没有怀孕，但这样的日子也很美好。'];
    else if(/高傲/.test(persona))story=['「又来了？」'+c.name+'别过头，耳朵微红。','「才不是在期待什么！」','你注意到她把房间打扫得很干净。'];
    else story=[c.name+'看见你来了，微微一笑。','「主人。」','今天的她状态不错。'];
  }else if(mode==='pregnant'){title='🤰 '+c.name;var pct=p?Math.round(p.progress/p.duration*100):0;
    if(pct<30)story=[c.name+'摸着还不明显的小腹。','「真的有宝宝吗……？」她有些紧张又有些期待。'];
    else if(pct<70)story=[c.name+'的肚子已经微微隆起。','「最近想吃酸的……」你帮她按摩肩膀，她舒服地闭上了眼。'];
    else story=['临产日越来越近。'+c.name+'紧张地看着你。','「主人……你会在旁边的吧？」','你握住她的手，点了点头。'];
  }else{title='🍼 '+c.name;
    story=[c.name+'怀里抱着刚出生的婴儿，表情前所未有地柔软。','「嘘……刚睡着。」','不管平时如何，这一刻是真实的、温暖的。'];
  }
  if(typeof openStoryModal==='function')openStoryModal({title:title,story:story,noSplit:true,cat:'event'},'孕育',{});
}
