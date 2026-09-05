// ============================================================
// js/ui/nav.js
// 导航、主题切换、弹窗管理、首页、设置页
// ============================================================

// ── 主题定义 ──────────────────────────────────────────────
const THEMES = [
  { id:'dark-rose',   name:'暗夜胭脂', icon:'🌹', desc:'深邃暗夜，胭脂色调',
    sw:['#0e0b14','#1e1828','#c7395a','#8b4ec8'] },
  { id:'warm-wood',   name:'原木米白', icon:'🌾', desc:'温暖自然，清新田园',
    sw:['#f5f0e8','#ffffff','#5a8a3a','#c47c20'] },
  { id:'night-blue',  name:'星夜深蓝', icon:'🌙', desc:'深邃星空，宁静夜晚',
    sw:['#0a0f1e','#141e38','#4a80f0','#f0c040'] },
  { id:'summer-snow', name:'夏海飘雪', icon:'❄️', desc:'清凉梦幻，碧海飘雪',
    sw:['#eef6fc','#ffffff','#2a7abf','#e07830'] },
  { id:'autumn-gold', name:'秋收金橙', icon:'🍂', desc:'枫叶稻谷，丰收暖橙',
    sw:['#faf4ec','#ffffff','#d06020','#a84010'] },
  { id:'sakura',      name:'樱花粉',   icon:'🌸', desc:'柔美粉嫩，浪漫樱花',
    sw:['#fdf0f5','#ffffff','#c84878','#d89020'] },
];

let _theme    = localStorage.getItem('era_theme') || 'dark-rose';
let _pendTheme = _theme;

function applyTheme(id) {
  document.documentElement.setAttribute('data-theme', id);
  _theme = id;
  localStorage.setItem('era_theme', id);
}

// ── 弹窗管理 ──────────────────────────────────────────────
function openOv(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('on');
  // 点击遮罩关闭（仅在直接点击遮罩层时关闭，非冒泡）
  if (!el._ovHandler) {
    el._ovHandler = e => { if (e.target === el) closeOv(id); };
    el.addEventListener('click', el._ovHandler);
  }
}

function closeOv(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('on');
}

// ── 导航 ──────────────────────────────────────────────────
function navTo(tab) {
  State.currentNav = tab;
  document.querySelectorAll('.ni').forEach(el =>
    el.classList.toggle('on', el.dataset.tab === tab));
  const map = {
    home:    's-home',
    manor:   's-manor',
    chars:   's-chars',
    play:    's-play',
    outing:  's-outing',
    achieve: 's-ach',
    settings:'s-set',
  };
  // 切换 screen
  document.querySelectorAll('.scr').forEach(s => s.classList.remove('on'));
  const scr = document.getElementById(map[tab]);
  if (scr) scr.classList.add('on');

  _setHeader(tab);

  // 各页面初始化
  if (tab === 'home')    renderHome();
  if (tab === 'manor')   { if (typeof renderManor === 'function') renderManor(); if(typeof checkManorEvent==='function')setTimeout(checkManorEvent,400); }
  if (tab === 'achieve') renderAch();
  if (tab === 'settings') { _renderSettings(); }
}

function _setHeader(tab) {
  const titles = {
    home:    ['eraQueenA+',    '调教养成游戏'],
    manor:   ['🏰 我的庄园',   '已购奴隶一览'],
    chars:   ['角色列表',      `共 ${CHARS_DATA.length} 位角色`],
    play:    [`第 ${State.day||1} 天`, ''],
    outing:  ['外出',          '打工·闲逛·约会'],
    achieve: ['成就',          '解锁记录'],
    settings:['设置',          '个人偏好'],
  };
  const [h, s] = titles[tab] || ['eraQueenA+', ''];
  const h1  = document.getElementById('hdr-h1');
  const sub = document.getElementById('hdr-sub');
  const bk  = document.getElementById('hdr-back');
  if (h1)  h1.textContent  = h;
  if (sub) sub.textContent = s;
  if (bk)  bk.classList.toggle('on', tab === 'play');

  // 头部 AI 徽章和存档按钮始终可见
  const saveHdr = document.getElementById('btn-save-hdr');
  if (saveHdr) saveHdr.style.display = '';

  // 训练页面：隐藏头像和副标题
  const hdrAva = document.getElementById('hdr-ava');
  const hdrSub = document.getElementById('hdr-sub');
  if (hdrAva) hdrAva.style.display = tab === 'play' ? 'none' : '';
  if (hdrSub) hdrSub.style.display = tab === 'play' ? 'none' : '';
}

// ── 首页渲染 ──────────────────────────────────────────────
function renderHome() {
  const recentEl = document.getElementById('home-recent');
  let recentSave = null;
  // 优先新格式
  try { var _ar=localStorage.getItem('era_auto_save'); if(_ar){var _as=JSON.parse(_ar); if(_as&&_as.char) recentSave=_as;} } catch(e){}
  if (!recentSave) {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('era_sv_')) { try { const s = JSON.parse(localStorage.getItem(k)); if (s?.char) recentSave = s; } catch (e) {} }
    }
  }

  if (recentEl) {
    if (recentSave) {
      const c = recentSave.char;
      // ★ 读取已保存的自定义头像，而非仅凭种族/性别推断默认 emoji
      const _rProf = recentSave.charProfile || {};
      const _rAvaImg = _rProf.avaImg || _rProf._presetAvaUrl || '';
      const _rAvaHtml = _rAvaImg
        ? `<div style="width:40px;height:40px;border-radius:50%;overflow:hidden;flex-shrink:0"><img src="${_rAvaImg}" style="width:100%;height:100%;object-fit:cover"></div>`
        : `<div style="font-size:1.8rem;width:40px;height:40px;background:var(--card2);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">${_rProf.ava || cEmoji(c)}</div>`;
      recentEl.innerHTML = `
        <div class="card card-tap card-b" onclick="selectChar(${c.id})"
             style="display:flex;align-items:center;gap:11px">
          ${_rAvaHtml}
          <div style="flex:1">
            <div style="font-family:'ZCOOL XiaoWei',serif;font-size:.96rem;
                        color:var(--acc2);letter-spacing:1px">${esc(c.name)}</div>
            <div style="font-size:.7rem;color:var(--muted);margin-top:2px">
              第 ${recentSave.day || 1} 天 · 训练 ${c.total_training_count} 次 ·
              好感 ${Math.round(c.affection)} · 服从 ${Math.round(c.obedience)}
            </div>
          </div>
          <div style="color:var(--muted);font-size:18px">›</div>
        </div>`;
    } else {
      recentEl.innerHTML = `
        <div class="card card-b" style="text-align:center;padding:18px">
          <div style="font-size:1.8rem;margin-bottom:7px">✨</div>
          <div style="font-size:.8rem;color:var(--muted)">还没有存档，去选择角色开始吧</div>
          <button class="btn btn-p" onclick="navTo('chars')" style="margin-top:11px">
            选择角色 →
          </button>
        </div>`;
    }
  }

  // 数据概况
  const statsEl = document.getElementById('home-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-box-v">${CHARS_DATA.length}</div>
          <div class="stat-box-l">角色</div>
        </div>
        <div class="stat-box">
          <div class="stat-box-v">${typeof PLAYER_DAILY!=='undefined'?PLAYER_DAILY.length:0}</div>
          <div class="stat-box-l">日常剧情</div>
        </div>
        <div class="stat-box">
          <div class="stat-box-v">${State.achievements.length}</div>
          <div class="stat-box-l">成就</div>
        </div>
      </div>`;
  }

  // 初始化小贴士
  const tipEl = document.getElementById('tip-text');
  if (tipEl && TIPS?.length) tipEl.textContent = TIPS[0];
}

// ── 设置页 ────────────────────────────────────────────────
function _renderSettings() {
  _updateApiSubText();
  const tSub = document.getElementById('theme-settings-sub');
  const t    = THEMES.find(t => t.id === _theme);
  if (tSub && t) tSub.textContent = `${t.icon} ${t.name}`;
}

// ── 主题弹窗 ──────────────────────────────────────────────
function openThemeModal() {
  _pendTheme = _theme;
  _renderThemeGrid();
  openOv('ov-theme');
}

function _renderThemeGrid() {
  const grid = document.getElementById('theme-grid');
  if (!grid) return;
  grid.innerHTML = THEMES.map(t => `
    <div class="th-opt ${_pendTheme === t.id ? 'on' : ''}" onclick="pickTheme('${t.id}',this)">
      <div class="th-sw">
        ${t.sw.map(c => `<div class="sw" style="background:${c}"></div>`).join('')}
      </div>
      <div class="th-name">${t.icon} ${t.name}</div>
      <div class="th-desc">${t.desc}</div>
    </div>`).join('');
}

function pickTheme(id, el) {
  _pendTheme = id;
  document.querySelectorAll('.th-opt').forEach(o => o.classList.remove('on'));
  el.classList.add('on');
  applyTheme(id); // 实时预览
}

function confirmTheme() {
  applyTheme(_pendTheme);
  toast('主题已应用 ✓', 'ok');
  closeOv('ov-theme');
}

// ── 角色详情弹窗 ──────────────────────────────────────────
function openCharDetail() {
  const c = State.currentChar;
  if (!c) return;
  document.getElementById('det-title').textContent = c.name + ' - 攻略进度';
  document.getElementById('det-rows').innerHTML = '';
  const descEl = document.getElementById('det-desc');
  if (descEl) descEl.textContent = '';

  // 素质解释数据
  const STAT_EXPLAIN = {
    '信任':'🤝 对主人的信任程度哦~\n通过温柔的互动和兑现承诺来提升。\n高信任的奴隶更容易接受进阶指令，也会主动和你亲近呢♡',
    '恐惧':'😰 对主人的恐惧感……\n惩罚和强制手段会增加。\n适度的恐惧有助于调教，但过高会导致精神崩坏，要小心！',
    '羞耻':'😳 在调教中感受到的羞耻心~\n适度的羞耻是调教的调味料♡\n过度则可能适得其反，或者……反而觉醒了？',
    '爱情':'💗 对主人萌生的恋慕之心……\n这是最珍贵的感情，需要长时间的温柔相处才能培养。\n只有真心对待，才能得到真心的回报♡',
    '自尊':'👑 保留的自尊心~\n自尊高的奴隶更有个性但也更难调教。\n打破还是守护，这个选择只有你能做~',
    '依赖':'🫂 对主人的依赖程度~\n依赖越高越离不开你。\n但也要注意不要变成病态的执着哦……',
    '理智':'🧠 残存的理性思维~\n理智归零可能触发崩坏路线……\n是保持清醒还是让ta沉沦，取决于你的目标。',
    '崩坏':'💔 精神崩坏的程度……\n当理智被消磨殆尽，崩坏值会急剧上升。\n这是一条不归路。走上了，就回不来了。',
  };

  // 路线解释（可爱版）
  const ROUTE_EXPLAIN = {
    love: '💕 恋爱路线\n\n让ta从心底爱上你♡\n\n🔑 达成条件：\n• 爱情 ≥ 60  • 信任 ≥ 50\n• 崩坏 < 30  • 理智 ≥ 40\n\n💡 攻略提示：\n多多爱抚、亲吻、约会~\n温柔地对待ta，送礼物，一起聊天。\n避免使用惩罚和强制手段哦！\n让ta感受到你是真心的♡',
    domination: '⛓️ 支配路线\n\n绝对的服从，灵魂都属于你。\n\n🔑 达成条件：\n• 恐惧 ≥ 50  • 依赖 ≥ 50\n• 自尊 < 30\n\n💡 攻略提示：\n恩威并施，用惩罚建立威严。\n同时给予关怀让ta依赖你。\n慢慢削弱自尊心，直到ta\n完全将自己交给你~',
    corruption: '🖤 黑化路线\n\n将ta推向精神的深渊……\n\n🔑 达成条件：\n• 崩坏 ≥ 60  • 理智 < 40\n\n💡 攻略提示：\n大量使用特殊惩罚和极端手段。\n消磨ta的理智，直到精神崩溃。\n⚠️ 这是一条黑暗的道路。\n一旦走上就很难回头……',
    yandere: '🔪 病娇路线\n\n扭曲的爱，永远不放手。\n\n🔑 达成条件：\n• 爱情 ≥ 50  • 依赖 ≥ 60\n• 理智 < 50  • 崩坏 ≥ 30\n\n💡 攻略提示：\n先培养深厚的感情，然后\n慢慢增加ta的依赖和独占欲。\n当爱情与崩坏交织……\n最可怕也最炽热的感情就诞生了♡',
    lust: '🔥 色欲路线\n\n沉溺情欲，自我迷失……\n\n🔑 达成条件：\n• 羞耻 ≥ 65  • 自尊 < 35\n• 崩坏 ≥ 25\n\n💡 攻略提示：\n大量进行亲密接触与调教。\n持续积累羞耻感，削弱自尊，\n当羞耻与快感的界限彻底模糊……\n身体就会先于灵魂彻底堕落♡',
  };

  let html = '';

  // ═══ 合并后的关系阶段 ═══
  html += '<div style="margin-bottom:14px"><div style="font-size:.82rem;font-weight:700;color:var(--txt);margin-bottom:8px">🔗 当前关系</div>';
  // 用统一的 _getPlayerSlaveStage 获取
  var rs = (typeof _getPlayerSlaveStage==='function') ? _getPlayerSlaveStage(c) : {name:'陌生',color:'var(--muted)'};
  html += '<div style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:.82rem;font-weight:700;background:'+rs.bg+';color:'+rs.color+';border:1px solid '+rs.color+'20">'+rs.name+'</div>';
  // 基础→进阶阶段条
  var allStages = [
    {name:'陌生',c:'var(--muted)',type:'基础'},{name:'信任',c:'#42a5f5',type:'基础'},{name:'依赖',c:'#66bb6a',type:'基础'},
    {name:'恋慕',c:'#ec407a',type:'进阶'},{name:'臣服',c:'#7e57c2',type:'进阶'},{name:'放荡',c:'#ff7043',type:'进阶'},{name:'病娇',c:'#e53935',type:'进阶'},
  ];
  html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px">';
  allStages.forEach(function(s){
    var on = s.name===rs.name;
    html += '<span style="padding:2px 8px;border-radius:12px;font-size:.65rem;'+(on?'background:'+s.c+';color:#fff;font-weight:700':'background:var(--card2);color:var(--muted)')+'">'+s.name+'</span>';
  });
  html += '</div></div>';

  // ═══ 人格状态 ═══
  if (c.persona) {
    html += '<div style="margin-bottom:14px"><div style="font-size:.82rem;font-weight:700;color:var(--txt);margin-bottom:4px">🧩 人格状态</div><div style="font-size:.58rem;color:var(--muted);margin-bottom:8px">点击素质查看详细解释~</div>';
    var pKeys = ['trust','fear','dependency','shame','pride','love','sanity','broken'];
    var pLabels = {trust:['信任','🤝','#4caf50'],fear:['恐惧','😰','#e53935'],dependency:['依赖','🫂','#7e57c2'],shame:['羞耻','😳','#ff9800'],pride:['自尊','👑','#42a5f5'],love:['爱情','💗','#e91e63'],sanity:['理智','🧠','#66bb6a'],broken:['崩坏','💔','#666']};
    pKeys.forEach(function(key){
      var info = pLabels[key];
      var val = Math.round(c.persona[key]||0);
      var pct = Math.min(100, Math.max(0, val));
      var explain = (STAT_EXPLAIN[info[0]]||'').replace(/\n/g,'<br>').replace(/'/g,"\\'");
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;cursor:pointer" onclick="openCustomConfirm(\''+info[1]+' '+info[0]+'\',\'<div style=padding:8px;font-size:.84rem;color:var(--txt2);line-height:1.8>'+explain+'<br><br>当前值：<b>'+val+'</b></div>\',\'知道了~\',function(){})">';
      html += '<span style="font-size:.85rem;width:22px;text-align:center">'+info[1]+'</span>';
      html += '<span style="font-size:.72rem;color:var(--txt2);width:32px">'+info[0]+'</span>';
      html += '<div style="flex:1;height:6px;background:var(--bdr2);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+info[2]+';border-radius:3px"></div></div>';
      html += '<span style="font-size:.72rem;color:var(--txt);font-weight:700;width:28px;text-align:right">'+val+'</span>';
      html += '</div>';
    });
    html += '</div>';
  }

  // ═══ 路线进度（点击弹出可爱攻略）═══
  if (typeof PERSONALITY_ROUTES !== 'undefined' && c.persona) {
    html += '<div style="margin-bottom:14px"><div style="font-size:.82rem;font-weight:700;color:var(--txt);margin-bottom:4px">🗺️ 路线进度</div><div style="font-size:.58rem;color:var(--muted);margin-bottom:8px">点击路线查看达成条件和攻略提示~</div>';
    var progress = (typeof getAllRouteProgress==='function') ? getAllRouteProgress(c.persona) : [];
    progress.forEach(function(r){
      var explain = (ROUTE_EXPLAIN[r.id]||r.name+' - 暂无详细攻略').replace(/\n/g,'<br>').replace(/'/g,"\\'");
      var pct = Math.round(((r.stageIdx+1) / r.maxStages) * 100);
      if(r.stageIdx < 0) pct = 0;
      var barColor = r.active ? '#4caf50' : 'var(--acc3)';
      html += '<div style="margin-bottom:8px;cursor:pointer;background:var(--card2);border-radius:8px;padding:8px 10px" onclick="openCustomConfirm(\''+r.icon+' '+r.name+'\',\'<div style=padding:8px;font-size:.84rem;color:var(--txt2);line-height:1.8>'+explain+'<br><br>当前阶段：<b>'+(r.stageIdx>=0?r.stageName:'未开始')+'</b></div>\',\'明白了！\',function(){})">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-size:.78rem;font-weight:600">'+r.icon+' '+r.name+'</span><span style="font-size:.68rem;color:'+(r.active?'#4caf50':'var(--muted)')+';font-weight:600">'+(r.active?'✅ 已达成':r.stageIdx>=0?r.stageName:'未达成')+'</span></div>';
      html += '<div style="height:5px;background:var(--bdr);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+barColor+';border-radius:3px"></div></div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // ═══ 情绪状态 ═══
  if(typeof getEmotionState === 'function') {
    const emo = getEmotionState(c);
    if(emo) {
      html += '<div><div style="font-size:.82rem;font-weight:700;color:var(--txt);margin-bottom:8px">💭 情绪状态</div>';
      html += '<div style="background:var(--card2);border-radius:8px;padding:10px 12px;font-size:.78rem;color:var(--txt2);line-height:1.6">';
      if(emo.primary) html += '主情绪：<strong>' + emo.primary + '</strong><br>';
      if(emo.mood) html += '心情指数：' + emo.mood + '<br>';
      if(emo.tags && emo.tags.length) html += '情绪标签：' + emo.tags.join('、');
      html += '</div></div>';
    }
  }

  document.getElementById('det-stats').innerHTML = html;
  openOv('ov-det');
}

// ── 清除存档 ──────────────────────────────────────────────
function clearAllSaves() {
  if (!confirm('确定清除所有存档？不可撤销。')) return;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('era_sv_')) keys.push(k);
  }
  keys.forEach(k => localStorage.removeItem(k));
  toast('所有存档已清除', '');
  renderHome();
}

// ── 初始化 ────────────────────────────────────────────────
function initApp() {
  applyTheme(_theme);

  // 底部导航点击
  document.querySelectorAll('.ni').forEach(el => {
    el.addEventListener('click', () => {
      const tab = el.dataset.tab;
      if (tab === 'play' && !State.currentChar) {
        toast('请先选择一位角色', '');
        navTo('chars');
        return;
      }
      navTo(tab);
    });
  });

  // 搜索框
  document.getElementById('srch-inp')?.addEventListener('input', e => {
    State.searchQuery = e.target.value.trim();
    State.charPage = 0;
    renderChars();
  });

  // 头部按钮
  document.getElementById('hdr-back')?.addEventListener('click', goBack);
  document.getElementById('btn-rest')?.addEventListener('click', doRest);
  document.getElementById('btn-save')?.addEventListener('click', openSaveMenu);
  document.getElementById('btn-det')?.addEventListener('click', openCharDetail);

  // 初始化 API 设置显示
  _updateApiSubText();

  // 显示首页
  renderHome();
  navTo('home');
}

document.addEventListener('DOMContentLoaded', initApp);

// ── 自动恢复上次进度 + 离开时自动保存 ──────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (typeof autoRestoreLastChar === 'function') autoRestoreLastChar();
});
window.addEventListener('beforeunload', () => {
  
});

// ── 外出页：nav 同步处理 ─────────────────────────────────
// (outing 页面由 index.html 内联的 navTo override 处理，
//  此处补充 nav 点击事件中 outing 的处理)
document.addEventListener('DOMContentLoaded', () => {
  // 绑定外出 nav 按钮 (data-tab="outing")
  document.querySelectorAll('.ni').forEach(el => {
    if (el.dataset.tab === 'outing') {
      el.removeEventListener('click', el._clickHandler);
    }
  });
});
