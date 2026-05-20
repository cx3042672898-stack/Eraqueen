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
      recentEl.innerHTML = `
        <div class="card card-tap card-b" onclick="selectChar(${c.id})"
             style="display:flex;align-items:center;gap:11px">
          <div style="font-size:1.8rem">${cEmoji(c)}</div>
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
          <div class="stat-box-v">${DAILY_EVENTS.length}</div>
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
    '信任':'对主人的信任程度。通过温柔的互动和兑现承诺来提升。高信任的奴隶更容易接受进阶指令~',
    '恐惧':'对主人的恐惧感。惩罚和强制手段会增加。过高的恐惧会导致崩坏，要小心哦！',
    '羞耻':'在调教中感受到的羞耻心。适度的羞耻是调教的调味料，过度则可能适得其反~',
    '爱情':'对主人萌生的恋慕之心。这是最珍贵的素质，需要长时间的温柔相处才能培养♡',
    '自尊':'保留的自尊心。自尊高的奴隶更有个性但也更难调教。打破还是守护，选择在你~',
    '依赖':'对主人的依赖程度。依赖越高越离不开你，但也要注意不要变成病态的执着。',
    '理智':'残存的理性思维。理智归零可能触发崩坏路线……要不要保留，取决于你的目标。',
    '崩坏':'精神崩坏的程度。当理智被消磨殆尽，崩坏值会急剧上升。这是一条不归路。',
    '抵抗':'对调教的抵抗意志。高抵抗的奴隶需要更多耐心，但征服的成就感也更大！',
    '占有':'对主人的独占欲。占有欲强的奴隶看到你和别人互动会吃醋哦~',
  };
  const ROUTE_EXPLAIN = {
    '恋慕线':'💕 走恋爱路线！通过高好感+高爱情+低恐惧来推进。终点是真正的恋人关系。需要大量温柔互动和约会~',
    '隶属线':'⛓️ 走服从路线！通过高服从+高依赖+适度恐惧来推进。终点是完美的主仆关系。需要恩威并施~',
    '崩坏线':'💔 走崩坏路线！通过低理智+高崩坏+高恐惧来推进。这是一条黑暗的道路……一旦走上很难回头。',
  };

  let html = '';
  // 关系阶段
  const stages = ['陌生','警戒','接受','信赖','依恋','臣服'];
  const stageIdx = Math.min(Math.floor((c.affection||0)/20), stages.length-1);
  html += '<div style="margin-bottom:14px"><div style="font-size:.82rem;font-weight:700;color:var(--txt);margin-bottom:8px">🔗 关系阶段</div>';
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
  stages.forEach((s,i) => {
    const on = i <= stageIdx;
    html += `<span style="padding:3px 10px;border-radius:20px;font-size:.72rem;font-weight:600;${on?'background:var(--acc);color:#fff':'background:var(--card2);color:var(--muted)'}">${s}</span>`;
  });
  html += '</div></div>';

  // 人格状态（双击弹出解释）
  const personas = [];
  if(c.persona_rational!=null) personas.push({name:'理智',val:c.persona_rational||0,icon:'🧠'});
  if(c.persona_pride!=null) personas.push({name:'自尊',val:c.persona_pride||0,icon:'👑'});
  if(c.persona_resist!=null) personas.push({name:'抵抗',val:c.persona_resist||0,icon:'🔥'});
  if(c.persona_depend!=null) personas.push({name:'依赖',val:c.persona_depend||0,icon:'🫂'});
  if(c.persona_broken!=null) personas.push({name:'崩坏',val:c.persona_broken||0,icon:'💔'});
  if(c.trust!=null) personas.push({name:'信任',val:c.trust||0,icon:'🤝'});
  if(c.fear!=null) personas.push({name:'恐惧',val:c.fear||0,icon:'😰'});
  if(c.shame!=null) personas.push({name:'羞耻',val:c.shame||0,icon:'😳'});
  if(c.love!=null) personas.push({name:'爱情',val:c.love||0,icon:'💗'});
  if(c.possessiveness!=null) personas.push({name:'占有',val:c.possessiveness||0,icon:'💢'});

  if(personas.length) {
    html += '<div style="margin-bottom:14px"><div style="font-size:.82rem;font-weight:700;color:var(--txt);margin-bottom:4px">🧠 人格状态</div><div style="font-size:.6rem;color:var(--muted);margin-bottom:8px">💡 双击素质查看详细解释</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
    personas.forEach(p => {
      const pct = Math.min(100, Math.max(0, Math.round(p.val)));
      const explainText = (STAT_EXPLAIN[p.name]||'暂无解释').replace(/'/g,"\\'").replace(/"/g,'&quot;');
      html += `<div style="background:var(--card2);border-radius:8px;padding:6px 10px;cursor:pointer" ondblclick="openCustomConfirm('${p.icon} ${p.name}','<div style=\\'padding:8px;font-size:.84rem;color:var(--txt2);line-height:1.8\\'>${explainText}<br><br>当前值：<b>${Math.round(p.val)}</b></div>','知道了~',function(){})">
        <div style="display:flex;justify-content:space-between;font-size:.72rem;margin-bottom:3px"><span>${p.icon} ${p.name}</span><span style="font-weight:700">${Math.round(p.val)}</span></div>
        <div style="height:4px;background:var(--bdr);border-radius:2px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--acc);border-radius:2px"></div></div>
      </div>`;
    });
    html += '</div></div>';
  }

  // 路线进度（点击弹出攻略提示）
  const routes = [];
  if(c.route_love != null) routes.push({name:'恋慕线',val:c.route_love||0});
  if(c.route_slave != null) routes.push({name:'隶属线',val:c.route_slave||0});
  if(c.route_broken != null) routes.push({name:'崩坏线',val:c.route_broken||0});
  if(routes.length) {
    html += '<div style="margin-bottom:14px"><div style="font-size:.82rem;font-weight:700;color:var(--txt);margin-bottom:4px">📍 路线进度</div><div style="font-size:.6rem;color:var(--muted);margin-bottom:8px">💡 点击路线查看攻略提示</div>';
    routes.forEach(r => {
      const pct = Math.min(100, Math.max(0, r.val));
      const rExplain = (ROUTE_EXPLAIN[r.name]||'暂无攻略提示').replace(/'/g,"\\'").replace(/"/g,'&quot;');
      html += `<div style="margin-bottom:6px;cursor:pointer" onclick="openCustomConfirm('📍 ${r.name}','<div style=\\'padding:8px;font-size:.84rem;color:var(--txt2);line-height:1.8\\'>${rExplain}<br><br>当前进度：<b>${r.val}%</b></div>','明白了！',function(){})">
        <div style="display:flex;justify-content:space-between;font-size:.72rem;margin-bottom:2px"><span>${r.name}</span><span>${pct >= 100 ? '✅ 已达成' : r.val + '%'}</span></div>
        <div style="height:5px;background:var(--bdr);border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--acc3);border-radius:3px"></div></div></div>`;
    });
    html += '</div>';
  }

  // 情绪状态
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
  if (State.currentChar && typeof writeSave === 'function') writeSave();
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
