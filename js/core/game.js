// ============================================================
// js/core/game.js
// 角色列表、训练系统、互动记录、成就
// ============================================================

const PER_PAGE = 12;

// ── 角色筛选 ──────────────────────────────────────────────
function getFilteredChars() {
  // 只显示已采购/已互动的角色（有存档数据），新周目后列表自然清空
  let chars = CHARS_DATA.filter(function(c){ var sv=loadSave(c.id); return sv&&sv.char; });
  if (State.genderFilter) {
    if (State.genderFilter === '__special__') {
      chars = chars.filter(c => c.gender && c.gender !== '男' && c.gender !== '女');
    } else {
      chars = chars.filter(c => c.gender === State.genderFilter);
    }
  }
  const q = State.searchQuery.toLowerCase();
  if (q) chars = chars.filter(c =>
    c.name.includes(q) || (c.nickname || '').includes(q) ||
    (c.personality || '').includes(q) || (c.class || '').includes(q) ||
    (c.race || '').includes(q));
  return chars;
}

// ── 渲染角色列表 ──────────────────────────────────────────
function renderChars() {
  const chars   = getFilteredChars();
  const maxPg   = Math.max(0, Math.ceil(chars.length / PER_PAGE) - 1);
  if (State.charPage > maxPg) State.charPage = maxPg;
  const slice   = chars.slice(State.charPage * PER_PAGE, (State.charPage + 1) * PER_PAGE);
  const grid    = document.getElementById('char-grid');
  const emptyHint = document.getElementById('chars-empty-hint');
  if (!grid) return;

  // 空状态：无已采购角色时显示提示
  if (!chars.length) {
    grid.innerHTML = '';
    if (emptyHint) emptyHint.style.display = '';
    const prev = document.getElementById('ch-prev');
    const next = document.getElementById('ch-next');
    const info = document.getElementById('ch-info');
    if (prev) prev.disabled = true;
    if (next) next.disabled = true;
    if (info) info.textContent = '0 位';
    return;
  }
  if (emptyHint) emptyHint.style.display = 'none';

  grid.innerHTML = slice.map(c => `
    <div class="cc" onclick="selectChar(${c.id})">
      <div class="cc-hdr">
        <div>
          <div class="cc-name">${esc(c.name)}</div>
          ${c.nickname ? `<div class="cc-nick">「${esc(c.nickname)}」</div>` : ''}
        </div>
        <div style="font-size:1.25rem">${cEmoji(c)}</div>
      </div>
      <div class="cc-tags">
        <span class="tag tg">${c.gender || '未知'}</span>
        <span class="tag tr">${c.race || '人类'}</span>
        ${c.class     ? `<span class="tag">${esc(c.class)}</span>` : ''}
        ${c.personality ? `<span class="tag">${esc(c.personality)}</span>` : ''}
      </div>
      <div class="cc-st">
        <span>❤ ${c.initial_affection}</span>
        <span>👁 ${c.initial_obedience}</span>
        <span>✦ ${c.initial_lust}</span>
      </div>
    </div>`).join('');

  const prev = document.getElementById('ch-prev');
  const next = document.getElementById('ch-next');
  const info = document.getElementById('ch-info');
  if (prev) prev.disabled = State.charPage === 0;
  if (next) next.disabled = State.charPage >= maxPg;
  if (info) info.textContent = (State.searchQuery || State.genderFilter)
    ? `共 ${chars.length} 位`
    : `${State.charPage + 1} / ${Math.max(1, Math.ceil(chars.length / PER_PAGE))} 页`;
}

function changePage(d) { State.charPage += d; renderChars(); }

function filterGender(g, btn) {
  State.genderFilter = g;
  State.charPage = 0;
  document.querySelectorAll('.g-chip').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderChars();
}

// ── 选择角色 → 进入训练界面 ──────────────────────────────
function selectChar(id) {
  const base = CHARS_DATA.find(c => c.id === id);
  if (!base) return;

  // ★ 切换角色时不自动覆盖存档（已禁用自动存档）
  // if (State.currentChar) writeSave(); ← 已移除

  const saved = loadSave(id);
  if (saved) {
    State.currentChar  = saved.char;
    State.gameLog      = saved.log     || [];
    // ★ 修复：取存档天数与独立持久化天数的较大值，防止刷新回退
    State.day          = saved.day || 1;  // ★ 修复：直接使用存档天数，不再受 era_day 干扰
    State.money        = saved.money   != null ? saved.money : 10000;
    // ★ 背包是全局共享资源，切换角色时绝对不覆盖——只在页面首次加载时才从存档还原
    // State.inventory 保持当前内存值不变
    State.equippedItems = saved.equippedItems || {};
  } else {
    // ★ 新角色：不继承旧存档的money/inventory/day
    // 检查是否有任何其他角色的存档来确定是否是全新开始
    var hasAnySave = false;
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);
      if(k&&k.startsWith('era_sv_')&&k!=='era_sv_'+id){
        var sv2=loadSave(k.replace('era_sv_',''));
        if(sv2&&sv2.char){hasAnySave=true;break;}
      }
    }
    State.currentChar = {
      ...base,
      stamina:   typeof getMaxStamina==='function' ? getMaxStamina(base) : 1500,
      energy:    typeof getMaxEnergy==='function' ? getMaxEnergy(base) : 1500,
      lust:      clamp(base.initial_lust),
      obedience: clamp(base.initial_obedience),
      affection: clamp(base.initial_affection),
      total_training_count: 0,
    };
    State.gameLog   = [{ type: 'sys', text: `开始与「${base.name}」的互动……` }];
    // 如果有其他存档，保留当前money/inventory（共享经济系统）
    // 如果完全没有存档，重置为初始值
    if(!hasAnySave){
      State.day       = 1;  // ★ 修复：新角色始终从第1天开始，不继承旧era_day
      State.money     = 10000;
      // ★ 只在完全没有任何存档时才清空背包（全新开局）
      if(Object.keys(State.inventory||{}).length===0) State.inventory = {};
    }

    // 初次调教剧情
    const firstStory = _genFirstTrainStory(base);
    if (typeof openStoryModal === 'function') {
      setTimeout(() => {
        openStoryModal({title:'📖 初次调教·'+base.name, story:firstStory, cat:'basic'}, '初次调教', {});
      }, 300);
    }
    if (typeof pushStoryLog === 'function') {
      pushStoryLog('first_train',{title:'初次调教·'+base.name,date:'第1天',char:base.name,story:firstStory});
    }
  }
  // 记住最后游玩的角色
  localStorage.setItem('era_last_char', String(id));
  State.currentCat = 'basic';
  navTo('play');
  renderPlay();
  // ★ 自动存档已禁用，切换角色不写存档
}

// ── 自动恢复上次游玩 ──────────────────────────────────────
function autoRestoreLastChar() {
  const lastId = localStorage.getItem('era_last_char');
  if (!lastId) return;
  const id = isNaN(lastId) ? lastId : Number(lastId);
  const saved = loadSave(id);
  if (saved) {
    State.currentChar  = saved.char;
    State.gameLog      = saved.log     || [];
    // ★ 修复：取存档天数与独立持久化天数的较大值，防止刷新回退
    State.day          = saved.day || 1;  // ★ 修复：直接用存档天数
    State.money        = saved.money   || 10000;
    State.inventory    = loadGlobalInventory() || saved.inventory   || {};
    State.equippedItems= saved.equippedItems || {};
  }
}

// ── 训练界面渲染（防抖）──────────────────────────────────
var _renderPlayTimer = null;
function renderPlay() {
  if (_renderPlayTimer) return; // 防止短时间内重复渲染导致闪烁
  _renderPlayTimer = setTimeout(function(){ _renderPlayTimer = null; }, 100);
  _renderPlayCore();
}
function _renderPlayCore() {
  const c = State.currentChar;
  if (!c) return;

  // 更新头部
  document.getElementById('hdr-h1').textContent  = `第 ${State.day} 天`;
  document.getElementById('hdr-sub').textContent = c.name;

  // Layer 2: 角色档案
  const avaEl = document.getElementById('p-ava-icon');
  if (avaEl) {
    const sv = loadSave(c.id);
    const profile = sv&&sv.charProfile||{};
    // ★ 修复：三级回落 用户上传 > CharRegistry实时值(avatar.jpg优先) > localStorage缓存 > emoji
    // CharRegistry 优先于 localStorage，因为 localStorage 可能缓存的是旧的 normal.jpg
    var _avaImgSrc = profile.avaImg || '';
    if (!_avaImgSrc && typeof CharRegistry !== 'undefined') {
      var _cr = CharRegistry.get(c.id);
      if (_cr && _cr._presetAvaUrl) _avaImgSrc = _cr._presetAvaUrl;
    }
    if (!_avaImgSrc) _avaImgSrc = profile._presetAvaUrl || '';
    if (_avaImgSrc) {
      avaEl.textContent = '';
      avaEl.style.backgroundImage = `url('${_avaImgSrc}')`;
      avaEl.style.backgroundSize = 'cover';
      avaEl.style.backgroundPosition = 'center';
      avaEl.style.borderRadius = '50%';
    } else {
      avaEl.textContent = profile.ava || cEmoji(c);
      avaEl.style.backgroundImage = '';
    }
  }
  const pn = document.getElementById('p-name');
  if (pn) {
    var _badges = '';
    if (typeof getHeatBadge === 'function') _badges += getHeatBadge(c);
    if (typeof getPregnancyData === 'function') { var _pd = getPregnancyData(); var _pi = _pd[String(c.id)]; if (_pi && _pi.pregnant && !_pi.born) _badges += '<span style="background:#ffb74d;color:#fff;padding:1px 6px;border-radius:8px;font-size:.6rem;font-weight:700;margin-left:4px">🤰</span>'; }
    // ★ 路线标签（可点击查看详情）
    if (c.tags && c.tags.length && typeof SLAVE_ROUTES !== 'undefined') {
      c.tags.forEach(function(tag) {
        var rt = SLAVE_ROUTES.find(function(r){ return r.tag === tag; }) || {};
        _badges += '<span onclick="openTagDetail(this.dataset.tag)" data-tag="' + tag + '" style="cursor:pointer;background:' + (rt.color||'#888') + ';color:#fff;padding:1px 6px;border-radius:8px;font-size:.58rem;font-weight:700;margin-left:4px" title="路线详情">' + (rt.icon||'') + tag + '</span>';
      });
    }
    pn.innerHTML = esc(c.name) + _badges;
  }
  const gIcon = document.getElementById('p-gender-icon');
  if (gIcon) {
    if (c.gender === '女') {
      gIcon.textContent = '♀';
      gIcon.className = 'p-gender-icon female';
    } else if (c.gender === '男') {
      gIcon.textContent = '♂';
      gIcon.className = 'p-gender-icon male';
    } else {
      gIcon.textContent = '⚧';
      gIcon.className = 'p-gender-icon both';
    }
  }
  // 依赖度显示
  const depTag = document.getElementById('p-depend-tag');
  if (depTag && c.persona_depend != null) {
    depTag.textContent = '依赖:' + Math.round(c.persona_depend||0);
  } else if(depTag) {
    depTag.textContent = '';
  }
  const ps = document.getElementById('p-sub');
  if (ps) {
    var personality = c.personality || '';
    ps.textContent = personality;
    // 根据性格设置颜色
    var pColor = '#a0b4c8'; // 默认灰蓝
    var pTxt = personality;
    if (/高傲|傲娇|自大|目中无人/.test(pTxt))      pColor = '#d4af37'; // 金
    else if (/温柔|稳重|体贴|温和/.test(pTxt))      pColor = '#80c4a0'; // 绿
    else if (/活泼|开朗|元气/.test(pTxt))           pColor = '#f0a040'; // 橙
    else if (/胆怯|自卑|害羞/.test(pTxt))           pColor = '#b090d0'; // 紫
    else if (/腹黑|意味深长|狡黠/.test(pTxt))       pColor = '#c07890'; // 玫红
    else if (/冷漠|无口|安静|清冷/.test(pTxt))      pColor = '#80b4d8'; // 冰蓝
    else if (/病娇|执着/.test(pTxt))                pColor = '#e87090'; // 深粉
    else if (/刚强|强势|蛮不讲理/.test(pTxt))       pColor = '#e06040'; // 红橙
    else if (/直率|纯真/.test(pTxt))                pColor = '#70c8a0'; // 清绿
    else if (/撒娇|任性/.test(pTxt))                pColor = '#f0a0c0'; // 浅粉
    ps.style.color = pColor;
  }

  // 属性条
  ['stamina', 'energy', 'lust', 'obedience', 'affection'].forEach(k => setStat(k, c[k]));

  // 指令
  renderActs();
  renderLog();
  updateAiBadge();

  // 助手调教栏
  if (typeof renderAssistantTrainingBar === 'function') renderAssistantTrainingBar();

  // 装备道具状态栏
  if (typeof _renderEquippedBar === 'function') _renderEquippedBar();

  // 同步 cat 按钮
  document.querySelectorAll('.cat-chip').forEach(b =>
    b.classList.toggle('on', b.dataset.cat === State.currentCat));
}

function setStat(name, val) {
  const n = document.getElementById(`sv-${name}`);
  const b = document.getElementById(`sb-${name}`);
  const c = State.currentChar;
  let max = 100;
  if (c && name === 'stamina') max = getMaxStamina(c);
  else if (c && name === 'energy') max = getMaxEnergy(c);
  else if (c && (name === 'lust' || name === 'obedience' || name === 'affection')) {
    max = typeof getStatMax === 'function' ? getStatMax(c, name) : 100;
  }
  const pct = max > 0 ? Math.min(100, Math.round(val / max * 100)) : 0;
  // 数值内嵌进度条：对体力/精力显示 val/max，其他显示 val（带等级）
  if (n) {
    if (name === 'stamina' || name === 'energy') {
      n.textContent = Math.round(val) + '/' + max;
    } else if (c && (name === 'lust' || name === 'obedience' || name === 'affection')) {
      var lvKey = name + '_level';
      var lv = c[lvKey] || 1;
      n.textContent = Math.round(val) + ' Lv.' + lv;
    } else {
      n.textContent = Math.round(val);
    }
  }
  if (b) b.style.width = pct + '%';
}

function setCat(cat, btn) {
  State.currentCat = cat;
  document.querySelectorAll('.cat-chip').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  renderActs();
}

// ── ★ 指令锁定：弹出居中可视化提示框（跟随游戏主题色）──────
function showLockMsg(cmdName, msg, icon) {
  var _oldPop = document.getElementById('_lock-popup');
  var _oldOv  = document.getElementById('_lock-popup-ov');
  if (_oldPop) _oldPop.remove();
  if (_oldOv)  _oldOv.remove();

  icon = icon || '🔒';

  // 注入动画样式（只注入一次）
  if (!document.getElementById('_lock-popup-style')) {
    var _st = document.createElement('style');
    _st.id = '_lock-popup-style';
    _st.textContent =
      '@keyframes _lpIn{from{opacity:0;transform:translate(-50%,-54%) scale(.84)}' +
      'to{opacity:1;transform:translate(-50%,-50%) scale(1)}}' +
      '#_lock-popup-btn{transition:opacity .15s}' +
      '#_lock-popup-btn:active{opacity:.7}';
    document.head.appendChild(_st);
  }

  // 遮罩 — 用游戏遮罩惯用色
  var _ov = document.createElement('div');
  _ov.id = '_lock-popup-ov';
  _ov.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9998;';

  // 弹窗主体 — 跟随 CSS 变量
  var _pop = document.createElement('div');
  _pop.id = '_lock-popup';
  _pop.style.cssText =
    'position:fixed;top:50%;left:50%;' +
    'transform:translate(-50%,-50%);' +
    'background:var(--card,#fff);' +
    'border-radius:20px;' +
    'padding:28px 24px 20px;' +
    'max-width:80vw;width:272px;' +
    'box-shadow:0 12px 48px rgba(0,0,0,.22);' +
    'z-index:9999;text-align:center;' +
    'animation:_lpIn .2s cubic-bezier(.34,1.28,.64,1) both;';

  // 细线分隔装饰
  var _accentLine =
    '<div style="width:36px;height:3px;border-radius:2px;' +
    'background:var(--acc,#6aaa64);margin:0 auto 14px;"></div>';

  _pop.innerHTML =
    '<div style="font-size:2.2rem;line-height:1;margin-bottom:10px">' + icon + '</div>' +
    _accentLine +
    '<div style="font-size:.75rem;color:var(--muted,#aaa);margin-bottom:10px;letter-spacing:.06em">【' + cmdName + '】</div>' +
    '<div style="font-size:.93rem;line-height:1.7;color:var(--txt,#333);word-break:break-all">' + msg + '</div>' +
    '<button id="_lock-popup-btn" style="' +
      'display:block;width:100%;margin-top:20px;' +
      'padding:10px 0;border-radius:24px;border:none;' +
      'background:var(--acc,#6aaa64);color:#fff;' +
      'font-size:.92rem;font-weight:700;cursor:pointer;' +
    '">知道了</button>';

  function _dismiss() {
    _pop.style.animation = 'none';
    _pop.remove();
    _ov.remove();
  }
  _ov.addEventListener('click', _dismiss);
  _pop.querySelector('#_lock-popup-btn').addEventListener('click', _dismiss);

  // 4秒后自动关闭
  setTimeout(function() {
    if (document.getElementById('_lock-popup')) _dismiss();
  }, 4000);

  document.body.appendChild(_ov);
  document.body.appendChild(_pop);
}

// ── ★ 道具未持有：购买引导弹窗（自建DOM，不依赖ov-overlay）──
function showBuyPrompt(itemId) {
  var _id = (typeof itemId === 'string' && !isNaN(itemId) && itemId !== '') ? Number(itemId) : itemId;
  var it  = ITEMS_DATA && ITEMS_DATA.find(function(i){ return i.id === _id || String(i.id) === String(_id); });
  // 找不到道具：fallback 到原版弹窗
  if (!it) { if (typeof openBuyItemPrompt === 'function') openBuyItemPrompt(itemId); return; }

  var _oldPop = document.getElementById('_buy-popup');
  var _oldOv  = document.getElementById('_buy-popup-ov');
  if (_oldPop) _oldPop.remove();
  if (_oldOv)  _oldOv.remove();

  // 动画样式（只注入一次）
  if (!document.getElementById('_buy-popup-style')) {
    var _bs = document.createElement('style');
    _bs.id = '_buy-popup-style';
    _bs.textContent =
      '@keyframes _bpIn{from{opacity:0;transform:translate(-50%,-56%) scale(.82)}' +
      'to{opacity:1;transform:translate(-50%,-50%) scale(1)}}';
    document.head.appendChild(_bs);
  }

  // 遮罩
  var _ov = document.createElement('div');
  _ov.id = '_buy-popup-ov';
  _ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9998;';

  // 弹窗
  var _pop = document.createElement('div');
  _pop.id = '_buy-popup';
  _pop.style.cssText =
    'position:fixed;top:50%;left:50%;' +
    'transform:translate(-50%,-50%);' +
    'background:var(--card,#fff);' +
    'border-radius:20px;' +
    'padding:24px 22px 18px;' +
    'max-width:80vw;width:280px;' +
    'box-shadow:0 12px 48px rgba(0,0,0,.22);' +
    'z-index:9999;text-align:center;' +
    'animation:_bpIn .22s cubic-bezier(.34,1.28,.64,1) both;';

  var _icon = (typeof getItemIcon === 'function') ? getItemIcon(it) : '📦';
  var _price = it.price ? it.price : '?';
  var _desc  = it.desc  ? it.desc  : '前往商店购买后即可在训练中使用。';

  _pop.innerHTML =
    '<div style="font-size:2.4rem;line-height:1;margin-bottom:6px">' + _icon + '</div>' +
    '<div style="font-weight:800;font-size:.95rem;color:var(--txt,#222);margin-bottom:4px">需要「' + esc(it.name) + '」</div>' +
    '<div style="font-size:.7rem;color:var(--muted,#aaa);margin-bottom:14px">背包里还没有这件道具</div>' +
    '<div style="background:var(--card2,#f5f5f5);border-radius:12px;padding:12px 14px;' +
      'text-align:left;font-size:.78rem;line-height:1.7;color:var(--txt2,#555);margin-bottom:14px">' +
      esc(_desc) +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;' +
      'padding:0 4px;margin-bottom:16px">' +
      '<span style="font-size:.72rem;color:var(--muted,#aaa)">商店售价</span>' +
      '<span style="font-weight:800;color:var(--acc,#6aaa64);font-size:.9rem">💰 ' + _price + '</span>' +
    '</div>' +
    '<button id="_buy-popup-go" style="' +
      'display:block;width:100%;padding:11px 0;border-radius:24px;border:none;' +
      'background:var(--acc,#6aaa64);color:#fff;font-size:.92rem;font-weight:700;' +
      'cursor:pointer;margin-bottom:8px' +
    '">🏪 前往商店</button>' +
    '<button id="_buy-popup-cancel" style="' +
      'display:block;width:100%;padding:9px 0;border-radius:24px;border:none;' +
      'background:var(--card2,#f0f0f0);color:var(--muted,#888);' +
      'font-size:.88rem;cursor:pointer' +
    '">暂时不了</button>';

  function _dismiss() { _pop.remove(); _ov.remove(); }

  _ov.addEventListener('click', _dismiss);
  _pop.querySelector('#_buy-popup-cancel').addEventListener('click', _dismiss);
  _pop.querySelector('#_buy-popup-go').addEventListener('click', function() {
    _dismiss();
    if (typeof navTo === 'function') navTo('shop');
  });

  document.body.appendChild(_ov);
  document.body.appendChild(_pop);
}

function renderActs() {
  var allActs = TRAINS_DATA.filter(t => t.category === State.currentCat);
  // ★ 性别过滤：某些指令只适用于女/双性/扶她
  var FEMALE_ONLY_CMDS = ['舔阴','玩弄小穴','阴蒂夹','阴蒂爱抚•助手命令','玩弄小穴•助手命令','命其胸部自慰','舔阴命令','命其舔阴','磨镜','触手玩弄阴蒂','触手阴道扩张','触手两穴扩张','触手玩弄子宫','触手玩弄Ｇ点','两穴拳交','拳交','Ｇ点刺激','淫乱牡丹','插入Ｇ点玩弄','插入子宫口玩弄','搾乳','挤奶器','触手挤奶','正常位','后背位','骑乘位','对面座位','背面座位','对面立位','背面立位','错开内裤插入'];
  var slaveGender = State.currentChar ? State.currentChar.gender : '';
  var acts = allActs;
  if (slaveGender === '男') {
    acts = allActs.filter(function(a) { return FEMALE_ONLY_CMDS.indexOf(a.name) < 0; });
  }
  // charOnly：只对指定奴隶显示的专属指令
acts = acts.filter(function(a) {
  if (!a.charOnly) return true;
  return String(a.charOnly) === String(State.currentChar && State.currentChar.id);
});
  const grid  = document.getElementById('act-grid');
  if (!grid) return;
  var html = '';
  if (acts.length) {
    html = acts.map(function(a) {
      // ═══════════════════════════════════════════════════════════
      // ★ 主人性别对指令的限制
      //
      //  规则一：逆×× 系列（奴隶→主人）
      //    所有以"逆"开头的指令 = 奴隶主动进入主人。
      //    男性主人没有小穴，无法实行 → 上锁。
      //
      //  规则二：主人→奴隶的插入性指令
      //    正常位/后背位/肛交/乳头奸 等 = 主人主动进入奴隶。
      //    女性主人需要持有【捆绑式假阴茎】才能实行，否则上锁。
      // ═══════════════════════════════════════════════════════════
      var _genderPg = (typeof _playerProfile !== 'undefined' && _playerProfile && _playerProfile.gender)
        ? _playerProfile.gender : '男';
      var _genderInv  = State.inventory || {};
      var _genderHasDildo = (_genderInv[12]||0)>0 || (_genderInv['12']||0)>0;

      // ── 规则一：仅锁这3个逆指令（男性主人无小穴）────────────────
      // 注意：其余逆×× 指令（逆强奸肛、逆正常位肛交等）不在此列
      var _MALE_LOCK_CMDS = ['逆正常位','逆后背位','逆强奸'];
      if (_MALE_LOCK_CMDS.indexOf(a.name) >= 0 && _genderPg === '男') {
        var _r1msgs = [
          '……主人您身为男性，没有相应的小穴，这个指令目前无法实行呢。',
          '这个姿势需要特殊的身体构造才行——主人是男性，这里走不通哦～',
          '啊这……男性主人在这个方向上天然受限，这个指令只能遗憾跳过了。',
          '让奴隶进入主人？主人您需要先拥有对应部位才行，现在嘛……有点强人所难呢。',
        ];
        var _r1m = _r1msgs[Math.floor(Math.random()*_r1msgs.length)];
        var _r1nEsc = esc(a.name).replace(/'/g, "\\'");
        var _r1mEsc = _r1m.replace(/'/g, "\\'");
        return '<button class="act-btn act-locked" style="opacity:.45;position:relative"' +
          ' onclick="showLockMsg(\''+_r1nEsc+'\',\''+_r1mEsc+'\',\'🚫\')">' +
          esc(a.name)+'<span style="position:absolute;top:2px;right:4px;font-size:.5rem">🚫</span></button>';
      }

      // ── 规则二：主人→奴隶插入性指令，女性主人需要捆绑式假阴茎 ──
      var _MASTER_PENE_CMDS = [
        // 阴道系
        '正常位','后背位','骑乘位','对面座位','背面座位',
        '对面立位','背面立位','错开内裤插入',
        // 肛交系
        '正常位肛交','后背位肛交','骑乘位肛交',
        '对面座位肛交','背面座位肛交','对面立位肛交','背面立位肛交',
        '对面立位肛','背面立位肛',
        '错开内裤插入肛门',
        // 其他插入类
        '乳头奸',
      ];
      if (_MASTER_PENE_CMDS.indexOf(a.name) >= 0 &&
          (_genderPg === '女' || _genderPg === '双性') &&
          !_genderHasDildo) {
        var _r2msgs = [
          '想要主动出击的话，先去商店买一个捆绑式假阴茎吧！工欲善其事嘛～',
          '道具不齐，这个姿势暂时无法施展。购入捆绑式假阴茎后即可解锁哦。',
          '缺少关键装备呢……把捆绑式假阴茎买回来之后，这个指令就解锁了！',
          '巧妇难为无米之炊。备齐捆绑式假阴茎，再来和奴隶玩这个吧～',
        ];
        var _r2m = _r2msgs[Math.floor(Math.random()*_r2msgs.length)];
        var _r2nEsc = esc(a.name).replace(/'/g, "\\'");
        var _r2mEsc = _r2m.replace(/'/g, "\\'");
        return '<button class="act-btn act-locked" style="opacity:.45;position:relative"' +
          ' onclick="showLockMsg(\''+_r2nEsc+'\',\''+_r2mEsc+'\',\'🔒\')">' +
          esc(a.name)+'<span style="position:absolute;top:2px;right:4px;font-size:.5rem">🔒</span></button>';
      }
      // ── 助手命令锁定检查 ──────────────────────────────────────
      var _isAstCmd = a.name.indexOf('•助手命令') >= 0 || a.name.indexOf('(助手)') >= 0;
      if (_isAstCmd) {
        var _astList = loadAssistants();
        if (!_astList.length) {
          // 无助手：显示锁定按钮，点击跳转庄园
          return '<button class="act-btn act-locked" onclick="(function(){if(typeof toast===\'function\')toast(\'👥 请先在庄园中设置助手\',\'info\');if(typeof navTo===\'function\')navTo(\'manor\');})()" ' +
            'style="opacity:.42;position:relative" title="需要设置助手才能使用">' +
            esc(a.name) + '<span style="position:absolute;top:2px;right:4px;font-size:.52rem">👥</span></button>';
        }
        // 有助手：检查活跃助手体力
        var _actAstId = State.activeAssistantId || _astList[0];
        var _astSv = loadSave(_actAstId);
        var _astC  = _astSv && _astSv.char;
        if (_astC && _astC.stamina <= 0 && _astC.energy <= 0) {
          var _astNm = _astC.name || '助手';
          return '<button class="act-btn act-locked" style="opacity:.35;cursor:default;position:relative" title="助手体力耗尽">' +
            esc(a.name) + '<span style="position:absolute;top:2px;right:4px;font-size:.52rem">💤</span></button>';
        }
      }
      // ── 道具类指令：训练页面直接触发，不弹背包对话框 ──
      if (a.category === 'tool' && typeof ITEMS_DATA !== 'undefined') {
        // ★ 训练指令名 → 道具库存名 别名映射（解决名称不一致问题）
        var TRAIN_ITEM_ALIAS = {
          '鞭打':   '鞭子',   '捆绑':   '绳子',   '针刺':   '针',
          '滴蜡':   '低温蜡烛', '乳头夹': '振动乳头夹', '乳头跳蛋': '振动乳头夹',
          '灌肠':   '灌肠器+塞头', '空气灌肠': '灌肠器+塞头',
          '触手灌肠': '灌肠器+塞头',
          '导尿管': '导尿管', '润滑乳液': '润滑乳液', '媚药': '媚药',
          '利尿剂': '利尿剂', '摄像机': '摄像机', '强精神药': '强精神药',
          '避孕套精饮(奴隶)': '避孕套', '避孕套精饮(助手)': '避孕套',
          // ★ 修复：补全缺失的别名映射
          '肛门电极': '电极接头', '乳房电极': '电极接头',
          '扩张气球': '扩张气球', '尿道气球': '打气筒',
          '眼罩': '眼罩', '口塞球': '口塞球',
          // ★ 禁止射精环
          '禁止射精': '禁止射精环',
        };
        var lookupName = TRAIN_ITEM_ALIAS[a.name] || a.name;
        var _it = ITEMS_DATA.find(function(i){ return i.name === lookupName; });
        // ★ 修复：找不到对应道具时，显示锁定按钮而非静默降级
        if (!_it) {
          return '<button class="act-btn act-locked" style="opacity:.35;cursor:not-allowed;position:relative" title="该指令暂无对应道具">' +
            esc(a.name) + '<span style="position:absolute;top:2px;right:4px;font-size:.55rem">🔒</span></button>';
        }
        if (_it) {
          var _inv = State.inventory || {};
          var _owned = (_inv[_it.id] > 0) || (_inv[String(_it.id)] > 0);
          if (!_owned) {
            // 未持有：点击弹购买引导（不禁用按钮）
            var _lockedId = JSON.stringify(_it.id);
            var _lockedDesc = _it.desc ? _it.desc.replace(/"/g, '&quot;') : '前往商店购买后即可使用';
            var _lockedPrice = _it.price ? ('💰' + _it.price) : '';
            return '<button class="act-btn act-locked"' +
              ' data-item-id="' + _it.id + '"' +
              ' onclick="showBuyPrompt(' + _lockedId + ')"' +
              ' ontouchstart="_lockBtnTouchStart(this,' + _lockedId + ')"' +
              ' ontouchend="_lockBtnTouchEnd(this,' + _lockedId + ');event.preventDefault()"' +
              ' ontouchmove="_lockBtnTouchMove()"' +
              ' ontouchcancel="_lockBtnTouchMove()"' +
              ' style="opacity:.45;cursor:pointer;position:relative"' +
              ' title="' + _lockedDesc + (_lockedPrice ? ' (' + _lockedPrice + ')' : '') + '">' +
              esc(a.name) + '<span style="position:absolute;top:2px;right:4px;font-size:.55rem">🔒</span></button>';
          }
          if (_it.equippable) {
            // 装备型道具：直接切换装备状态 + 触发训练剧情
            var _charId = State.currentChar ? State.currentChar.id : null;
            var _equipped = _charId && State.equippedItems && (State.equippedItems[_charId]||[]).indexOf(_it.id) >= 0;
            var _badge = _equipped ? '<span style="position:absolute;top:2px;right:4px;font-size:.55rem">⚙️</span>' : '';
            var _extraStyle = _equipped ? 'border-color:rgba(229,115,115,.5);background:rgba(229,115,115,.08);' : '';
            // ★ 装备型道具：加入长按/悬浮描述（用道具自身 desc）
            var _itDesc = _it.desc || (_equipped ? '点击卸下已装备的道具' : '点击装备该道具');
            var _itDescJs = JSON.stringify('📦 ' + _it.name + '\n' + _itDesc);
            return '<button class="act-btn"' +
              ' onclick="doTrainingToolAction(' + JSON.stringify(_it.id) + ')"' +
              ' style="position:relative;' + _extraStyle + '"' +
              ' title="' + (_it.desc || (_equipped ? '已装备，点击卸下' : '点击装备该道具')).replace(/"/g, '&quot;') + '"' +
              ' onmouseenter="_cmdTipShowText(this,' + _itDescJs + ')"' +
              ' onmouseleave="_cmdTipHide()"' +
              ' ontouchstart="_cmdTouchShowText(' + _itDescJs + ')"' +
              ' ontouchend="_cmdTouchEnd()"' +
              ' ontouchcancel="_cmdTouchEnd()"' +
              (State.isProcessing ? ' disabled' : '') + '>' + esc(a.name) + _badge + '</button>';
          }
          // 消耗型道具：直接触发训练动作
          // ★ 修复：不直接在 onclick 里嵌入 JSON 字符串（双引号会截断 HTML 属性）
          // 改为和普通指令一样用 data-* 属性传参
          return '<button class="act-btn" data-name="' + esc(a.name) + '" data-cat="' + esc(a.category) + '" onclick="doAction(this.dataset.name,this.dataset.cat)"' +
            ' onmouseenter="_cmdTipShow(this,this.dataset.name)"' +
            ' onmouseleave="_cmdTipHide()"' +
            ' ontouchstart="_cmdTouchStart(this,this.dataset.name)"' +
            ' ontouchend="_cmdTouchEnd()"' +
            ' ontouchcancel="_cmdTouchEnd()"' +
            (State.isProcessing ? ' disabled' : '') + '>' + esc(a.name) + '</button>';
        }
      }
      return '<button class="act-btn" data-name="' + esc(a.name) + '" data-cat="' + a.category + '" onclick="doAction(this.dataset.name,this.dataset.cat)"' +
        ' onmouseenter="_cmdTipShow(this,this.dataset.name)"' +
        ' onmouseleave="_cmdTipHide()"' +
        ' ontouchstart="_cmdTouchStart(this,this.dataset.name)"' +
        ' ontouchend="_cmdTouchEnd()"' +
        ' ontouchcancel="_cmdTouchEnd()"' +
        (State.isProcessing ? ' disabled' : '') + '>' +
        esc(a.name) + '</button>';
    }).join('');
  } else {
    html = `<div class="empty"><div class="empty-ico">📜</div><p>暂无指令</p></div>`;
  }
  // ★ 事件分类下追加「奴隶逆推」按钮
  if (State.currentCat === 'event') {
    html += '<button class="act-btn" style="background:rgba(240,100,120,.12);color:#e57373;border:1px solid rgba(240,100,120,.25);font-weight:700" onclick="manualReverseTraining()" '+(State.isProcessing?'disabled':'')+'>🔄 奴隶逆推</button>';
  }
  grid.innerHTML = html;
}


// ── 指令解说提示（悬停/长按）──
var _cmdTipTimer = null;
var _cmdTipEl = null;
// ★ 修复：使用 pointer: fine 判断是否有精确鼠标，比 ontouchstart 更可靠
// DevTools 模拟触摸时 ontouchstart in window 为 true，但真正有鼠标时 pointer: fine 仍匹配
var _isTouchDevice = (typeof window.matchMedia === 'function')
  ? !window.matchMedia('(pointer: fine)').matches
  : ('ontouchstart' in window);
function _cmdTipShow(btn, name) {
  if (_isTouchDevice) return; // 手机端不显示悬浮提示
  _cmdTipHide();
  _cmdTipTimer = setTimeout(function(){
    var desc = (typeof CMD_DESCRIPTIONS !== 'undefined') ? CMD_DESCRIPTIONS[name] : null;
    if (!desc) return;
    _cmdTipEl = document.createElement('div');
    _cmdTipEl.className = 'cmd-tooltip';
    _cmdTipEl.innerHTML = '<strong>' + esc(name) + '</strong><br>' + esc(desc).replace(/\n/g,'<br>');
    var rect = btn.getBoundingClientRect();
    _cmdTipEl.style.left = Math.min(rect.left, window.innerWidth - 260) + 'px';
    _cmdTipEl.style.top = (rect.top - 8) + 'px';
    _cmdTipEl.style.transform = 'translateY(-100%)';
    document.body.appendChild(_cmdTipEl);
  }, 600);
}
function _cmdTipHide() {
  clearTimeout(_cmdTipTimer);
  if (_cmdTipEl) { _cmdTipEl.remove(); _cmdTipEl = null; }
}
// ★ 直接传入文本的悬浮提示（用于道具按钮）
function _cmdTipShowText(btn, text) {
  if (_isTouchDevice) return;
  _cmdTipHide();
  _cmdTipTimer = setTimeout(function(){
    _cmdTipEl = document.createElement('div');
    _cmdTipEl.className = 'cmd-tooltip';
    _cmdTipEl.innerHTML = esc(text).replace(/\\n/g,'<br>');
    var rect = btn.getBoundingClientRect();
    _cmdTipEl.style.left = Math.min(rect.left, window.innerWidth - 260) + 'px';
    _cmdTipEl.style.top = (rect.top - 8) + 'px';
    _cmdTipEl.style.transform = 'translateY(-100%)';
    document.body.appendChild(_cmdTipEl);
  }, 600);
}
var _cmdTouchTimer = null;
function _cmdTouchStart(btn, name) {
  _cmdTouchTimer = setTimeout(function(){
    var desc = (typeof CMD_DESCRIPTIONS !== 'undefined') ? CMD_DESCRIPTIONS[name] : null;
    if (!desc) desc = '暂无解说';
    openCustomConfirm('📖 '+name, '<div style="font-size:.84rem;color:var(--txt2);line-height:1.9">'+esc(desc).replace(/\n/g,'<br>')+'</div>', '关闭', function(){});
  }, 800);
}
// ★ 道具按钮长按描述（直接传文本）
function _cmdTouchShowText(text) {
  _cmdTouchTimer = setTimeout(function(){
    var parts = text.split('\n');
    var title = parts[0] || '道具说明';
    var body = parts.slice(1).join('\n') || text;
    openCustomConfirm(title, '<div style="font-size:.84rem;color:var(--txt2);line-height:1.9">'+esc(body).replace(/\n/g,'<br>')+'</div>', '关闭', function(){});
  }, 800);
}
function _cmdTouchEnd() { clearTimeout(_cmdTouchTimer); }

// ★ 锁定道具按钮的触摸处理（短按=购买提示，不触发长按描述）
var _lockBtnTouchTimer = null;
var _lockBtnMoved = false;
function _lockBtnTouchStart(btn, itemId) {
  clearTimeout(_lockBtnTouchTimer);
  _lockBtnMoved = false;
}
function _lockBtnTouchEnd(btn, itemId) {
  clearTimeout(_lockBtnTouchTimer);
  // 手指未移动：直接弹购买引导；event.preventDefault() 阻止后续 click 重复触发
  if (!_lockBtnMoved && typeof showBuyPrompt === 'function') {
    showBuyPrompt(itemId);
  }
}
function _lockBtnTouchMove() {
  _lockBtnMoved = true;
  clearTimeout(_lockBtnTouchTimer);
}

// ── 互动记录 ──────────────────────────────────────────────
function renderLog() {
  const container = document.getElementById('log');
  if (!container) return;

  container.innerHTML = State.gameLog.map((e, idx) => {
    const isLast = idx === State.gameLog.length - 1;
    if (e.type === 'act') {
      let metaHtml = '';
      if (e.actionName) {
        metaHtml = `<div class="log-meta"><span class="log-action-tag">📌 ${esc(e.actionName)}</span></div>`;
      }
      // 台词在前
      let dialogHtml = `<span class="log-txt" id="${isLast ? 'log-last' : ''}">${isLast ? '' : esc(e.text)}</span>
        ${isLast ? '<span class="tw-cur" id="tw-cur"></span>' : ''}`;
      // 数值变化在后（如果有persona/emotion变化）
      let statsHtml = '';
      if (e.personaChanges) {
        statsHtml = `<div class="log-stats">${esc(e.personaChanges)}</div>`;
      }
      return `<div class="log-e act">${metaHtml}${dialogHtml}${statsHtml}</div>`;
    }
    return `<div class="log-e sys">${esc(e.text)}</div>`;
  }).join('');

  const last = State.gameLog[State.gameLog.length - 1];
  if (last?.type === 'act') {
    const el  = document.getElementById('log-last');
    const cur = document.getElementById('tw-cur');
    if (el) typewrite(last.text, el, cur);
  }
  container.scrollTop = container.scrollHeight;
}

function addLog(text, type = 'sys', extra = {}) {
  State.gameLog = [...State.gameLog.slice(-24), { type, text, ...extra }];
  renderLog();
}

function typewrite(text, el, cursor) {
  let i = 0;
  const iv = setInterval(() => {
    if (i <= text.length) {
      el.textContent = text.substring(0, i++);
    } else {
      clearInterval(iv);
      if (cursor) cursor.style.display = 'none';
    }
    const c = document.getElementById('log');
    if (c) c.scrollTop = c.scrollHeight;
  }, 28);
}

// ── 训练页道具指令直接触发（装备型）────────────────────────
// 不弹背包弹窗，直接切换装备状态 + 播放训练剧情
async function doTrainingToolAction(itemId) {
  if (State.isProcessing || !State.currentChar) return;
  var item = ITEMS_DATA ? ITEMS_DATA.find(function(i){ return i.id === itemId || String(i.id) === String(itemId); }) : null;
  if (!item) { await doAction(String(itemId), 'tool'); return; }

  var inv = State.inventory || {};
  var owned = (inv[itemId] > 0) || (inv[String(itemId)] > 0);
  if (!owned) {
    if (typeof openBuyItemPrompt === 'function') openBuyItemPrompt(itemId);
    return;
  }

  var charId = State.currentChar.id;
  if (!State.equippedItems) State.equippedItems = {};
  if (!State.equippedItems[charId]) State.equippedItems[charId] = [];

  var isEquipped = State.equippedItems[charId].indexOf(itemId) >= 0;
  var invSnapshot = JSON.stringify(State.inventory || {});

  // 切换装备状态
  var _wasEquipped = isEquipped;
  if (isEquipped) {
    State.equippedItems[charId] = State.equippedItems[charId].filter(function(id){ return id !== itemId; });
    toast('已卸下：' + item.name, '');
  } else {
    State.equippedItems[charId].push(itemId);
    toast('已装备：' + item.name + ' ⚙️', 'ok');
  }

  // 装备状态栏立即刷新
  if (typeof _renderEquippedBar === 'function') _renderEquippedBar();

  // ★ 卸下时传入"卸下XXX"作为指令名，AI会生成卸下专属剧情，而非装上时的剧情
  var _actionCmd = _wasEquipped ? ('卸下' + item.name) : item.name;
  await doAction(_actionCmd, 'tool');

  // ★ 修复：只在背包被意外清空时才还原，避免误覆盖正常状态
  var afterInv = State.inventory || {};
  var beforeInv = JSON.parse(invSnapshot);
  var afterCount = Object.keys(afterInv).length;
  var beforeCount = Object.keys(beforeInv).length;
  if (afterCount === 0 && beforeCount > 0) {
    try {
      State.inventory = beforeInv;
      if (typeof renderBag === 'function') renderBag();
    } catch (e) {}
  }
  // ★ 同步背包到全局存储
  if (typeof saveGlobalInventory === 'function') saveGlobalInventory();
}

// ── 执行指令 ──────────────────────────────────────────────
async function doAction(name, cat) {
  if (State.isProcessing || !State.currentChar) return;
  const c   = State.currentChar;
  const cfg = ACTION_CONFIG[cat] || ACTION_CONFIG.basic;

  if (c.stamina <= 0) {
    toast('⚠️ 体力已耗尽，注意休息', '');
  }

  State.isProcessing = true;
  __eraLastProc = Date.now(); // ★ 修复：重置看门狗计时器
  renderActs();

  // ★ 修复：try-finally 确保任何异常都能解除 isProcessing 锁定
  try {

  // 0. 【最高优先级】角色专属文件剧情（有角色文件时优先于通用剧情库）
  let story = null;

  // ★ 修复：在调用 getCharCommandStory 前，将当前装备的道具名称填入 equips 字段
  // 这样 _checkStoryCondition 中的 { equip: '口塞球' } 等条件才能正确匹配
  if (State.currentChar && State.equippedItems) {
    var _curCharId = State.currentChar.id;
    var _equippedIds = State.equippedItems[_curCharId] || [];
    // 将道具ID转换为道具名称
    var _equippedNames = _equippedIds.map(function(eid) {
      var item = (typeof ITEMS_DATA !== 'undefined')
        ? ITEMS_DATA.find(function(i) { return String(i.id) === String(eid); })
        : null;
      return item ? item.name : String(eid);
    });
    State.currentChar.equips = _equippedNames;
    State.currentChar.activeEquips = _equippedNames;
  }

  if (typeof getCharCommandStory === 'function' && State.currentChar) {
    var charStoryResult = getCharCommandStory(
      State.currentChar.id,
      name,
      State.currentChar
    );
    if (charStoryResult) {
      story = {
        title:   name,
        story:   (charStoryResult.stories || [charStoryResult]).map(function(p){
                   return typeof applyStoryPlaceholders === 'function' ? applyStoryPlaceholders(p) : p;
                 }),
        cat:     cat,
        effects: charStoryResult.effects || {},
        _charFile: true,
      };
      // ★ 读取角色文件里的 expChanges，应用并存入story供显示
      if (charStoryResult.expChanges) {
        var _ec = charStoryResult.expChanges;
        var _slaveExp = _ec.slave || (_ec.player ? {} : _ec);
        var _playerExp = _ec.player || {};
        // 应用奴隶经验
        for (var _ek in _slaveExp) {
          var _rk = (typeof _expCnToKey === 'function') ? _expCnToKey(_ek) : _ek;
          if (_slaveExp[_ek] && State.currentChar && _rk) {
            State.currentChar[_rk] = (State.currentChar[_rk] || 0) + _slaveExp[_ek];
          }
        }
        // 应用玩家经验
        for (var _pk in _playerExp) {
          var _rpk = (typeof _expCnToKey === 'function') ? _expCnToKey(_pk) : _pk;
          if (_playerExp[_pk] && _rpk && typeof addPlayerExp === 'function') {
            addPlayerExp(_rpk, _playerExp[_pk]);
          }
        }
        story._slaveExpChanges = _slaveExp;
        story._playerExpChanges = _playerExp;
      }
    }
  }

  // 0.5. 助手模式 → 优先查 ASSISTANT_COMMAND_STORIES（助手↔奴隶专属剧情）
  // ★ 修复1：去掉 !story 条件，确保助手模式下 ASSISTANT_COMMAND_STORIES 优先于角色文件普通剧情
  // ★ 修复2：•助手命令 后缀指令在主人模式下也应走 ASSISTANT_COMMAND_STORIES（动作执行者是助手）
  // ★ 修复3：State.activeAssistantId 刷新后为 null，补充从 loadAssistants() 兜底取值
  var _isAstSuffixCmd = typeof name === 'string' && (name.indexOf('•助手命令') >= 0 || name.indexOf('(助手)') >= 0);
  if ((State.assistantMode || _isAstSuffixCmd)
      && typeof ASSISTANT_COMMAND_STORIES !== 'undefined'
      && ASSISTANT_COMMAND_STORIES[name]) {
    var _astIdAcs = State.activeAssistantId;
    if (!_astIdAcs && typeof loadAssistants === 'function') {
      var _astFallback = loadAssistants();
      if (_astFallback.length) _astIdAcs = _astFallback[0];
    }
    if (_astIdAcs) {
      var _astSvAcs = loadSave(_astIdAcs);
      var _astCharAcs = _astSvAcs && _astSvAcs.char ? _astSvAcs.char : null;
      if (_astCharAcs) {
        // ── 助手↔奴隶好感度（relationship.js getSlaveRelation）──
        var _helperSlaveRel = (typeof getSlaveRelation === 'function')
          ? getSlaveRelation(String(_astIdAcs), String(State.currentChar.id))
          : 0;
        var _acsStages = ASSISTANT_COMMAND_STORIES[name].stages;
        var _acsMatched = _acsStages.filter(function(s) {
          var lo = s.affRange[0], hi = s.affRange[1];
          return _helperSlaveRel >= lo && _helperSlaveRel < hi;
        });
        var _acsStage = _acsMatched.length
          ? _acsMatched[_acsMatched.length - 1]
          : _acsStages[_acsStages.length - 1];
        if (_acsStage && _acsStage.branches) {
          var _acsPers = State.currentChar.personality || '';
          var _acsPool = null;
          for (var _acsBk in _acsStage.branches) {
            if (_acsBk === '_default') continue;
            try { if (new RegExp(_acsBk).test(_acsPers)) { _acsPool = _acsStage.branches[_acsBk]; break; } } catch(e) {}
          }
          if (!_acsPool) _acsPool = _acsStage.branches['_default'] || [];
          if (_acsPool.length) {
            var _acsChosen = pick(_acsPool);
            var _acsReplaced = (_acsChosen.story || []).map(function(p) { return applyStoryPlaceholders(p); });
            story = { title: name, story: _acsReplaced, cat: cat, effects: _acsChosen.effects || {} };
            // 经验变化
            if (_acsChosen.expChanges) {
              var _acsEc = _acsChosen.expChanges;
              var _acsSlaveExp  = _acsEc.slave  || (_acsEc.player ? {} : _acsEc);
              var _acsPlayerExp = _acsEc.player || {};
              for (var _acsEk in _acsSlaveExp) {
                var _acsRk = (typeof _expCnToKey === 'function') ? _expCnToKey(_acsEk) : _acsEk;
                if (_acsSlaveExp[_acsEk] && State.currentChar && _acsRk)
                  State.currentChar[_acsRk] = (State.currentChar[_acsRk] || 0) + _acsSlaveExp[_acsEk];
              }
              for (var _acsPk in _acsPlayerExp) {
                var _acsRpk = (typeof _expCnToKey === 'function') ? _expCnToKey(_acsPk) : _acsPk;
                if (_acsPlayerExp[_acsPk] && _acsRpk && typeof addPlayerExp === 'function')
                  addPlayerExp(_acsRpk, _acsPlayerExp[_acsPk]);
              }
              story._slaveExpChanges  = _acsSlaveExp;
              story._playerExpChanges = _acsPlayerExp;
            }
            // 助手↔奴隶关系 +2
            if (typeof addSlaveRelation === 'function' && String(_astIdAcs) !== String(State.currentChar.id))
              addSlaveRelation(String(_astIdAcs), String(State.currentChar.id), 2);
          }
        }
      }
    }
  }

  // 1. 查 COMMAND_STORIES（多层级分支系统）
  if (!story && typeof COMMAND_STORIES !== 'undefined' && COMMAND_STORIES[name]) {
    const stages = COMMAND_STORIES[name].stages;
    const aff = State.currentChar.affection;
    const affLv = State.currentChar.affection_level || 1;
    const personality = State.currentChar.personality || '';
    // ★ 好感度匹配用等级：Lv1-2=低, Lv3-5=中, Lv6-10=高
    // affRange 仍然用数字范围，但匹配时转换为等级范围
    // 兼容旧格式（affRange用raw值如[0,30]）和新格式（用等级如[1,2]或[0,30]）
    var matchedStages = stages.filter(function(s) {
      var lo = s.affRange[0], hi = s.affRange[1];
      // 如果范围值较小（<=10），按等级匹配
      if (hi <= 10 || (lo <= 10 && hi <= 10)) {
        return affLv >= lo && affLv < hi;
      }
      // 否则按raw值匹配（兼容旧格式）
      // 但自动转换：0-30→Lv1-2, 30-70→Lv3-5, 70+→Lv6+
      var lvLo, lvHi;
      if (lo < 30) lvLo = 1; else if (lo < 70) lvLo = 3; else lvLo = 6;
      if (hi <= 30) lvHi = 3; else if (hi <= 70) lvHi = 6; else lvHi = 11;
      return affLv >= lvLo && affLv < lvHi;
    });
    var stage = matchedStages.length ? matchedStages[matchedStages.length - 1] : stages[stages.length - 1];
    
    if (stage.branches) {
      // 新版多层级分支
      var storyPool = null;
      // 按性格关键词匹配分支
      for (var branchKey in stage.branches) {
        if (branchKey === '_default') continue;
        try {
          if (new RegExp(branchKey).test(personality)) {
            storyPool = stage.branches[branchKey];
            break;
          }
        } catch(e) {}
      }
      // 无匹配则用默认分支
      if (!storyPool) storyPool = stage.branches['_default'] || [];
      if (storyPool.length) {
        var chosen = pick(storyPool);
        // 应用占位符替换
        var replacedStory = (chosen.story || []).map(function(p) { return applyStoryPlaceholders(p); });
        story = { title: name, story: replacedStory, cat: cat, effects: chosen.effects || {} };
        // 应用经验变化（支持中文键名 + 双方经验）
        if (chosen.expChanges) {
          var ec = chosen.expChanges;
          // 新格式: { slave: {...}, player: {...} }
          // 旧格式: { expV: 1 } → 默认给奴隶
          var slaveExp = ec.slave || (ec.player ? {} : ec);
          var playerExp = ec.player || {};
          // 应用奴隶经验
          for (var ek in slaveExp) {
            var realKey = _expCnToKey(ek);
            var ev = slaveExp[ek];
            if (ev && State.currentChar && realKey) {
              State.currentChar[realKey] = (State.currentChar[realKey] || 0) + ev;
            }
          }
          // 应用玩家经验
          for (var pk in playerExp) {
            var realPK = _expCnToKey(pk);
            var pv = playerExp[pk];
            if (pv && realPK) {
              if (typeof addPlayerExp === 'function') addPlayerExp(realPK, pv);
            }
          }
          // 存入story.effects用于展示
          story._slaveExpChanges = slaveExp;
          story._playerExpChanges = playerExp;
        }
      }
    } else if (stage.story) {
      // 旧版兼容（直接有story数组）
      story = { title: name, story: stage.story.map(function(p){ return applyStoryPlaceholders(p); }), cat: cat, effects: stage.effects || {} };
    }
  }  // end if(!story && COMMAND_STORIES)
  // 2. 回退：从 ACTION_STORIES 中按 cat 随机选取
  if (!story) {
    const pool = ACTION_STORIES.filter(s => s.cat === cat);
    story = pool.length ? pick(pool) : null;
  }

  // 计算属性变化
  const changes = {
    stamina:   -(cfg.stamina - rand(2, 6)),
    energy:    -(cfg.energy  - rand(1, 4)),
    lust:       rand(...cfg.lust),
    obedience:  rand(...cfg.obedience),
    affection:  rand(...cfg.affection),
  };
  if (story?.effects) {
    Object.entries(story.effects).forEach(([k, v]) => {
      if (changes[k] !== undefined) changes[k] += v;
    });
  }

  // 应用属性变化（体力/精力使用动态上限）
  const maxSta = getMaxStamina(c);
  const maxEne = getMaxEnergy(c);
  const newLust      = typeof clampStat==='function' ? clampStat(c,'lust',     c.lust      + changes.lust)      : clamp(c.lust      + changes.lust);
  const newObedience = typeof clampStat==='function' ? clampStat(c,'obedience',c.obedience + changes.obedience) : clamp(c.obedience + changes.obedience);
  const newAffection = typeof clampStat==='function' ? clampStat(c,'affection',c.affection + changes.affection) : clamp(c.affection + changes.affection);
  State.currentChar = {
    ...c,
    stamina:   Math.max(0, Math.min(maxSta, c.stamina + changes.stamina)),
    energy:    Math.max(0, Math.min(maxEne, c.energy + changes.energy)),
    lust:      newLust,
    obedience: newObedience,
    affection: newAffection,
    lust_level:      c.lust_level      || 1,
    obedience_level: c.obedience_level || 1,
    affection_level: c.affection_level || 1,
    total_training_count: c.total_training_count + 1,
  };
  // 检查属性升级
  ['lust','obedience','affection'].forEach(function(sn){
    if(typeof checkStatLevelUp==='function' && checkStatLevelUp(State.currentChar, sn)){
      var labels={'lust':'欲望','obedience':'服从','affection':'好感'};
      var newLv=(State.currentChar[sn+'_level']||1);
      toast('🌟 '+c.name+' 的'+labels[sn]+'升至 Lv.'+newLv+'！','success');
    }
  });
  // ── 体力/精力消耗：助手模式 vs 主人模式 ──────────────────────
  if (State.assistantMode) {
    // 助手模式：消耗活跃助手的体力/精力
    var _astIds = loadAssistants();
    var _astId  = State.activeAssistantId || (_astIds.length ? _astIds[0] : null);
    if (_astId) {
      var _astSv2 = loadSave(_astId);
      if (_astSv2 && _astSv2.char) {
        var _astChar2 = _astSv2.char;
        var _astName2 = _astChar2.name || '助手';
        var _astStaCost = Math.max(5, Math.abs(changes.stamina));
        var _astEneCost = Math.max(3, Math.abs(changes.energy));
        _astChar2.stamina = Math.max(0, (_astChar2.stamina || 0) - _astStaCost);
        _astChar2.energy  = Math.max(0, (_astChar2.energy  || 0) - _astEneCost);
        // 给助手加经验（调教相关属性小幅提升）
        _astChar2.obedience = Math.min(
          typeof getStatMax==='function' ? getStatMax(_astChar2,'obedience') : 1000,
          (_astChar2.obedience || 0) + 1
        );
        // 助手与被调教奴隶的感情（复用 relationship.js）
        if (typeof addRelation === 'function' && String(_astId) !== String(c.id)) {
          addRelation(String(_astId), String(c.id), 2);
        }
        _astSv2.char = _astChar2;
        localStorage.setItem('era_sv_' + _astId, JSON.stringify(_astSv2));
        // 如果体力耗尽，自动退出助手模式并提示
        if (_astChar2.stamina <= 0 && _astChar2.energy <= 0) {
          State.assistantMode = false;
          if (typeof toast === 'function') toast('💤 ' + _astName2 + ' 力竭，已切回主角调教', 'info');
        }
        renderAssistantPanel();
        if (typeof renderAssistantTrainingBar === 'function') renderAssistantTrainingBar();
      }
    }
  } else {
    // 主人模式：正常消耗主角体力/精力
    if (typeof _playerProfile !== 'undefined') {
      var trainStaCost = Math.max(5, Math.abs(changes.stamina));
      var trainEneCost = Math.max(3, Math.abs(changes.energy));
      if (typeof logStaminaCost === 'function') logStaminaCost('调教·' + (c.name || '奴隶'), trainStaCost);
      _playerProfile.energy = Math.max(0, (_playerProfile.energy || 0) - trainEneCost);
      localStorage.setItem('era_profile', JSON.stringify(_playerProfile));
      if (typeof renderPlayerCard === 'function') renderPlayerCard();
    }
  }
  ['stamina', 'energy', 'lust', 'obedience', 'affection']
    .forEach(k => setStat(k, State.currentChar[k]));
  const timeEl2 = document.getElementById('hdr-h1');
  if (timeEl2) timeEl2.textContent = `第 ${State.day} 天`;

  checkAch();

  // 有剧情 → 打开剧情弹窗
  if (story) {
    openStoryModal(story, name, changes);
  } else {
    // 无预设剧情：有API则调用AI，否则用本地台词
    let dialogue = '';
    if (window.API_STATE?.key) {
      const thinkEl = document.getElementById('ai-think');
      if (thinkEl) thinkEl.style.display = 'flex';
      try { dialogue = await callAI(State.currentChar, name); } catch (e) {}
      if (thinkEl) thinkEl.style.display = 'none';

      // 有角色文件 + API成功 → 用弹窗显示完整剧情
      var hasCharFile = (typeof CharRegistry !== 'undefined') && CharRegistry.get(State.currentChar && State.currentChar.id);
      if (dialogue && hasCharFile) {
        openStoryModal({ title: name, story: [dialogue], cat: cat, effects: {} }, name, changes);
        return;
      }
    }
    // ★ 优先使用人格/情绪条件台词
    if (!dialogue && typeof getEnhancedDialogue === 'function') {
      dialogue = getEnhancedDialogue(name, cat);
    }
    if (!dialogue) dialogue = getLocalDialogue(cat, State.currentChar.affection, State.currentChar.obedience);
    addLog(dialogue, 'act', { actionName: name, changes });
    State.isProcessing = false;
    renderActs();
    // ★ 自动存档已禁用，不在此写入存档
    // ── 实时标签检测 ──
    if (State.currentChar && typeof _updateSlaveTags === 'function') {
      _updateSlaveTags(State.currentChar, State.currentChar.id); // 不自动存档
    }

    // ── 初次性交经验追踪 ──
    _trackFirstSexExp(name, 'training');

    // ── 逆推触发检测 ──────────────────────────────────────
    setTimeout(function() {
      if (typeof checkReverseTrainingTrigger === 'function' && checkReverseTrainingTrigger()) {
        if (typeof openReverseTrainingModal === 'function') {
          openReverseTrainingModal();
        }
      }
    }, 600);
  }
  } catch(_doActionErr) {
    // ★ 修复：捕获任何未处理异常，确保 isProcessing 解锁
    console.error('[ERA] doAction 异常:', _doActionErr);
    State.isProcessing = false;
    try { renderActs(); } catch(e) {}
    // 只在剧情弹窗没有成功打开时才提示错误，避免误报
    var _ovStory = document.getElementById('ov-story');
    if (!_ovStory || !_ovStory.classList.contains('on')) {
      toast('⚠️ 指令执行出错，已自动恢复', 'err');
    }
  }
}

function _trackFirstSexExp(actionName, sourceContext) {
  var vActions = ['逆正常位','逆后背位'];
  var aActions = ['逆正常位肛交','逆后背位肛交'];
  var det = (typeof getPlayerDetail === 'function') ? getPlayerDetail() : {};
  var c = State.currentChar;
  // sourceContext：'training'（调教，默认）| 'work'（打工）| 'outing'（外出）| string（自定义）
  var ctx = sourceContext || 'training';
  var changed = false;

  if (vActions.indexOf(actionName) >= 0 && !det.firstVirginity) {
    if (ctx === 'training' && c) {
      det.firstVirginity = c.name + '（调教）';
    } else if (ctx === 'work') {
      det.firstVirginity = '打工获得';
    } else if (ctx === 'outing') {
      det.firstVirginity = '外出获得';
    } else {
      det.firstVirginity = ctx || (c ? c.name : '——');
    }
    changed = true;
    toast('📝 主人丧失处子：' + det.firstVirginity, '');
  }
  if (aActions.indexOf(actionName) >= 0 && !det.firstAnal) {
    if (ctx === 'training' && c) {
      det.firstAnal = c.name + '（调教）';
    } else if (ctx === 'work') {
      det.firstAnal = '打工获得';
    } else if (ctx === 'outing') {
      det.firstAnal = '外出获得';
    } else {
      det.firstAnal = ctx || (c ? c.name : '——');
    }
    changed = true;
    toast('📝 主人丧失后庭处子：' + det.firstAnal, '');
  }
    var sexActions = [
    '正常位','后背位','骑乘位','对面座位','背面座位','对面立位','背面立位',
    '错开内裤插入','逆骑乘位',
    '正常位肛交','后背位肛交','骑乘位肛交','对面座位肛交','背面座位肛交',
    '对面立位肛交','背面立位肛交','错开内裤插入肛门','逆骑乘位肛交',
    '尾巴插入','尾巴肛插入','车站便当','打屁股做爱','打屁股肛交','窒息做爱',
    '双龙插入','双龙肛插入'
  ];
  if (sexActions.indexOf(actionName) >= 0 && !det.firstSex) {
    if (ctx === 'training' && c) {
      det.firstSex = c.name + '（调教）';
    } else if (ctx === 'work') {
      det.firstSex = '打工获得';
    } else if (ctx === 'outing') {
      det.firstSex = '外出获得';
    } else {
      det.firstSex = ctx || (c ? c.name : '——');
    }
    changed = true;
    toast('📝 主人首次性交：' + det.firstSex, '');
  }
  if (changed && typeof savePlayerDetail === 'function') {
    savePlayerDetail(det);
  }
}

// ── 本地台词 ──────────────────────────────────────────────
function _genFirstTrainStory(c) {
  const name = c.name, p = c.personality || '', g = c.gender || '';
  const lines = ['你来到调教室，' + name + '已经在等候了。'];
  if (p.indexOf('高傲') >= 0 || p.indexOf('傲娇') >= 0)
    lines.push('「你以为这种地方能让我屈服？做梦。」' + name + '双臂环抱，冷冷地看着你。', '不过，那微微发颤的指尖暴露了' + (g==='女'?'她':'他') + '内心的紧张。');
  else if (p.indexOf('温柔') >= 0 || p.indexOf('温和') >= 0)
    lines.push('「主人……请温柔一点好吗？」' + name + '低垂着眼帘，声音轻得像呢喃。');
  else if (p.indexOf('开朗') >= 0 || p.indexOf('元气') >= 0)
    lines.push('「这里就是训练室吗？好有意思啊！」' + name + '东张西望，完全没有恐惧的样子。', '这份天真大概很快就会被磨去。');
  else if (p.indexOf('阴暗') >= 0 || p.indexOf('冷漠') >= 0)
    lines.push(name + '面无表情地站在那里，仿佛这里的一切与' + (g==='女'?'她':'他') + '无关。', '……但你知道，沉默之下总有什么在等待被打破。');
  else if (p.indexOf('腹黑') >= 0)
    lines.push('「请多多指教了，主人。」' + name + '微笑着行了一礼。', '那笑容太过完美，反而让人心生警惕。');
  else
    lines.push(name + '打量着四周的环境，' + (g==='女'?'她':'他') + '的命运从今天开始改变。');
  lines.push('这将是漫长调教之路的第一步。');
  return lines;
}

function getLocalDialogue(cat, aff, obed) {
  if (aff  > 70) return pick(DIALOGUES.hi_aff);
  if (obed > 75) return pick(DIALOGUES.hi_ob);
  if (aff  < 20) return pick(DIALOGUES.cold);
  return pick(DIALOGUES[cat] || DIALOGUES.basic);
}

function updateAiBadge() {
  const on = !!(window.API_STATE?.key);
  ['ai-badge', 'ai-badge-hdr'].forEach(id => {
    const b = document.getElementById(id);
    if (!b) return;
    b.innerHTML = `<span class="ai-dot ${on ? 'pulse' : ''}"></span> AI${on ? '在线' : '离线'}`;
    b.className = 'ai-badge ' + (on ? 'on' : 'off');
  });
}

// ── 休息 ──────────────────────────────────────────────────
function doRest() {
  if (!State.currentChar) return;
  const rs = (typeof REST_STORIES !== 'undefined' && REST_STORIES.length)
    ? pick(REST_STORIES) : { title:'休息', story:['好好休息了一番，体力慢慢恢复了。'], effects:{} };

  // ── 恢复所有奴隶体力（回复量 = 各自上限的一半）──
  const allChars = (typeof CHARS_DATA !== 'undefined') ? CHARS_DATA.filter(c => {
    const sv = loadSave(c.id); return sv && sv.char;
  }) : [];
  allChars.forEach(c => {
    const sv = loadSave(c.id);
    if (!sv || !sv.char) return;
    const maxSta = getMaxStamina(sv.char), maxEne = getMaxEnergy(sv.char);
    sv.char.stamina = Math.min(maxSta, (sv.char.stamina || 0) + Math.floor(maxSta / 2));
    sv.char.energy  = Math.min(maxEne, (sv.char.energy  || 0) + Math.floor(maxEne / 2));
    localStorage.setItem('era_sv_' + c.id, JSON.stringify(sv));
    if (State.currentChar && String(State.currentChar.id) === String(c.id)) {
      State.currentChar.stamina = sv.char.stamina;
      State.currentChar.energy  = sv.char.energy;
    }
  });

  // 主角体力恢复
  if (typeof _playerProfile !== 'undefined') {
    var maxSta = _playerProfile.staminaMax || 2000;
    _playerProfile.stamina = Math.min(maxSta, (_playerProfile.stamina || 0) + Math.floor(maxSta * 0.5));
    _playerProfile.energy = Math.min(_playerProfile.energyMax || 3000, (_playerProfile.energy || 0) + Math.floor((_playerProfile.energyMax || 3000) * 0.5));
    localStorage.setItem('era_profile', JSON.stringify(_playerProfile));
  }
  if (typeof consumeTime === 'function') { consumeTime('night'); } else { State.day++; }
  if (typeof _saveDay === 'function') _saveDay(); // ★ 修复：休息后立即持久化天数

  if (State.currentChar) { setStat('stamina', State.currentChar.stamina); setStat('energy', State.currentChar.energy); }
  const timeEl3 = document.getElementById('hdr-h1');
  if (timeEl3) timeEl3.textContent = `第 ${State.day} 天`;
  document.getElementById('hdr-sub').textContent = State.currentChar?.name || '';

  // ★ 效果直接拼接在剧情后面（不分页）
  var storyLines = (rs.story || ['好好休息了一番。']).slice();
  storyLines.push('');
  storyLines.push('所有奴隶和主人的体力与精力恢复了上限的50%。');

  addLog(`进入第 ${State.day} 天，充分休息后所有奴隶都恢复了体力。`, 'sys');
  if (typeof pushStoryLog === 'function') pushStoryLog('rest', { title: rs.title, date: typeof getDateStr==='function'?getDateStr():`第${State.day}天`, story: storyLines });
  if (typeof openStoryModal === 'function') {
    setTimeout(() => { openStoryModal({ title: '🌙 ' + rs.title, story: storyLines, noSplit: true, cat: 'basic' }, '休息', {}); }, 80);
    // 新天卡片由 consumeTime 内的 showNewDayCard 统一触发（500ms），无需在此重复
  }
  else { toast('休息完毕，所有奴隶体力已恢复 ✓', 'ok'); }
  if (typeof renderPlayerCard === 'function') renderPlayerCard();
  if (typeof renderManor === 'function') renderManor();

  // ★ 休息后检测偷情事件
  setTimeout(function(){
    if(typeof checkAffairEvent==='function'){
      var affair=checkAffairEvent();
      if(affair && typeof openStoryModal==='function'){
        if(typeof pushStoryLog==='function') pushStoryLog('daily',{title:affair.title,date:typeof getDateStr==='function'?getDateStr():'',char:affair.charA+'&'+affair.charB,story:affair.story});
        setTimeout(function(){ openStoryModal({title:'💕 '+affair.title,story:affair.story,cat:'event'},'偷情事件',{}); },500);
      }
    }
  },300);
}

// ── 存档 ──────────────────────────────────────────────────
function saveGame() {
  if (!State.currentChar) return;
  if (manualWriteSave('手动存档 - ' + (State.currentChar.name || ''))) toast('存档成功 ✓', 'ok');
  else toast('存档失败', 'err');
}

function goBack() { navTo('chars'); }

// ── 成就 ──────────────────────────────────────────────────
const ACH_DEFS = [
  { id:'first',   title:'初次相遇',   desc:'完成第一次训练',        icon:'🌸', check: c => c.total_training_count >= 1   },
  { id:'t10',     title:'坚持不懈',   desc:'累计训练 10 次',        icon:'💪', check: c => c.total_training_count >= 10  },
  { id:'t50',     title:'训练达人',   desc:'累计训练 50 次',        icon:'🏆', check: c => c.total_training_count >= 50  },
  { id:'t100',    title:'调教宗师',   desc:'累计训练 100 次',       icon:'👑', check: c => c.total_training_count >= 100 },
  { id:'aff50',   title:'渐生情愫',   desc:'好感度达到 50',         icon:'💕', check: c => c.affection  >= 50 },
  { id:'aff80',   title:'深深爱上',   desc:'好感度达到 80',         icon:'💖', check: c => c.affection  >= 80 },
  { id:'ob50',    title:'初步驯服',   desc:'服从度达到 50',         icon:'🔮', check: c => c.obedience  >= 50 },
  { id:'ob80',    title:'完全服从',   desc:'服从度达到 80',         icon:'⛓️', check: c => c.obedience  >= 80 },
  { id:'lust50',  title:'欲火难耐',   desc:'欲望值达到 50',         icon:'🔥', check: c => c.lust       >= 50 },
  { id:'day7',    title:'一周相处',   desc:'共同度过 7 天',         icon:'📅', check: _ => State.day    >= 7  },
  { id:'day30',   title:'一月相依',   desc:'共同度过 30 天',        icon:'🌙', check: _ => State.day    >= 30 },
  { id:'shop1',   title:'第一次购物', desc:'在商店购买了第一件道具', icon:'🛍️', check: _ => Object.keys(State.inventory).length >= 1 },
];

function checkAch() {
  const c = State.currentChar;
  if (!c) return;
  ACH_DEFS.forEach(def => {
    if (!State.achievements.includes(def.id) && def.check(c)) {
      State.achievements.push(def.id);
      localStorage.setItem('era_ach', JSON.stringify(State.achievements));
      toast(`🏅 成就解锁：${def.title}`, 'ai');
    }
  });
}

function renderAch() {
  const el = document.getElementById('ach-list');
  if (!el) return;
  el.innerHTML = ACH_DEFS.map(d => {
    const on = State.achievements.includes(d.id);
    return `<div class="ach ${on ? 'on' : ''}">
      <div class="ach-ico">${d.icon}</div>
      <div><div class="ach-ttl">${d.title}</div><div class="ach-desc">${d.desc}</div></div>
      <div class="ach-lk">${on ? '✓' : '🔒'}</div>
    </div>`;
  }).join('');
}

// ── 手动触发奴隶逆推 ──
function manualReverseTraining() {
  if (!State.currentChar) { toast('请先选择奴隶','err'); return; }
  var c = State.currentChar;
  if ((c.lust || 0) < 30 || (c.affection || 0) < 20) {
    toast('奴隶的欲望或好感不足，无法逆推','err'); return;
  }
  if (typeof openReverseTrainingModal === 'function') {
    openReverseTrainingModal();
  } else {
    toast('逆推系统未加载','err');
  }
}

// ── 奴隶角色经验紧凑条（与主角经验体系一致）──
function openSlaveExpBars() {
  if (!State.currentChar) return;
  var c = State.currentChar;
  var body = document.getElementById('slave-detail-body');
  if (!body) return;
  
  // 使用与主角一致的经验体系
  var groups = { '基础': [], '沉沦': [], '日常': [] };
  if(typeof EXP_FIELDS!=='undefined'){
    EXP_FIELDS.forEach(function(f){ if(groups[f.group]) groups[f.group].push(f); });
  }
  var groupColors = { '基础':'#4caf50', '沉沦':'#9c27b0', '日常':'#f57c00' };
  
  // 训练页角色经验头像（优先自定义）
  var _gExpSv=typeof loadSave==='function'?loadSave(c.id):null;
  var _gExpPro=(_gExpSv&&_gExpSv.charProfile)||{};
  var _gExpAvaImg=_gExpPro.avaImg||_gExpPro._presetAvaUrl||'';
  if(!_gExpAvaImg&&typeof CharRegistry!=='undefined'){var _gExpCr=CharRegistry.get(c.id);if(_gExpCr&&_gExpCr._presetAvaUrl)_gExpAvaImg=_gExpCr._presetAvaUrl;}
  var _gExpAvaHtml;
  if(_gExpAvaImg){_gExpAvaHtml='<div style="width:52px;height:52px;border-radius:50%;overflow:hidden;margin:0 auto 6px;cursor:pointer" onclick="openSlaveAvaModal('+c.id+')"><img src="'+_gExpAvaImg+'" style="width:100%;height:100%;object-fit:cover"></div>';}
  else{var _gExpEmoji=_gExpPro.ava||cEmoji(c);_gExpAvaHtml='<div style="font-size:2rem;margin-bottom:4px;cursor:pointer" onclick="openSlaveAvaModal('+c.id+')">'+_gExpEmoji+'</div>';}
  var html = '<div style="text-align:center;margin-bottom:14px">'+_gExpAvaHtml+'<div style="font-weight:800;font-size:1rem;color:var(--txt)">'+esc(c.name)+' · 角色经验</div><div style="font-size:.7rem;color:var(--muted);margin-top:3px">'+esc(c.gender||'')+' · '+esc(c.race||'')+' · '+esc(c.class||'')+'</div></div>';
  
  for(var gn in groups){
    if(!groups[gn].length) continue;
    var gColor = groupColors[gn]||'var(--acc)';
    // 检查该组是否有任何经验
    var hasAny = groups[gn].some(function(f){ return (c[f.key]||0) > 0; });
    
    html += '<div style="font-weight:700;font-size:.82rem;color:var(--txt);margin:12px 0 8px;border-left:3px solid '+gColor+';padding-left:8px">'+gn+'</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">';
    groups[gn].forEach(function(f){
      var val = Math.round(c[f.key] || 0);
      var icon = (typeof EXP_ICONS!=='undefined' && EXP_ICONS[f.key]) || '✨';
      var lv = val > 0 ? Math.floor(val / 20) + 1 : 0;
      if(lv>5) lv=5;
      var pct = val > 0 ? Math.min(100, (val % 20) * 5 || 100) : 0;
      var isZero = val === 0;
      html += '<div style="background:var(--card);border:1px solid var(--bdr2);border-radius:8px;padding:6px 8px;'+(isZero?'opacity:.5;':'')+'cursor:pointer" onclick="openCustomConfirm(\''+icon+' '+f.label+'\',\'<div style=padding:8px>'+esc(f.desc).replace(/'/g,"\\'")+' <br><br>当前值：'+val+' · LV.'+lv+'</div>\',\'知道了\',function(){})">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">';
      html += '<span style="font-size:.72rem">'+icon+' '+f.label+'</span>';
      html += '<span style="font-size:.72rem;font-weight:700;color:'+gColor+'">'+val+'</span></div>';
      if(val>0) html += '<div style="height:3px;background:var(--bdr2);border-radius:2px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+gColor+';border-radius:2px"></div></div>';
      html += '</div>';
    });
    html += '</div>';
  }
  
  html += '<button class="btn btn-ghost btn-full" onclick="closeOv(\'ov-slave-detail\')" style="margin-top:12px">关闭</button>';
  body.innerHTML = html;
  openOv('ov-slave-detail');
}

// ── 中文经验键名映射（支持中文或英文写法）────────────────
var _EXP_CN_MAP = {
  'V经验':'expV','A经验':'expA','绝顶经验':'expPeak','射精经验':'expEjac',
  '性交经验':'expSex','内射经验':'expCreampie','口交经验':'expOral',
  '爱情经验':'expLove','紧缚经验':'expBind','调教经验':'expTrain',
  '肛射经验':'expAnal','U经验':'expU','M经验':'expM','自慰经验':'expSolo',
  '爱抚经验':'expCaress','接吻经验':'expKiss','道具经验':'expToy',
  '露出经验':'expExhibit','束缚经验':'expBondage',
  '舔肛经验':'expAnalLick',  // ★ 新增：舔肛专属经验
};
// 反向映射（英文→中文显示名）
var _EXP_KEY_CN = {};
for(var _ck in _EXP_CN_MAP) _EXP_KEY_CN[_EXP_CN_MAP[_ck]] = _ck;

function _expCnToKey(cnOrEn) {
  if (_EXP_CN_MAP[cnOrEn]) return _EXP_CN_MAP[cnOrEn];  // 中文→英文
  if (cnOrEn && cnOrEn.startsWith('exp')) return cnOrEn;  // 已经是英文
  return cnOrEn;
}
function _expKeyToCn(key) {
  return _EXP_KEY_CN[key] || key;
}

// ── 人称系统 & 占位符替换 ──────────────────────────────────
// 人称设置：'first'(我), 'second'(你), 'third'(主人名字)
function getPerspective() {
  return localStorage.getItem('era_perspective') || 'first';
}
function setPerspective(mode) {
  localStorage.setItem('era_perspective', mode);
  toast('人称已切换为：' + ({first:'第一人称（我）',second:'第二人称（你）',third:'第三人称（名字）'}[mode] || mode), 'ok');
}

function applyStoryPlaceholders(text) {
  if (!text || typeof text !== 'string') return text;
  var c = State.currentChar;
  var slaveName = c ? c.name : '对方';
  var slaveD = slaveName + '的'; // ★ 新增：定义 {slaveD} 为 奴隶名字+的
  var slaveGender = c ? c.gender : '';
  var ta = slaveGender === '女' ? '她' : '他';
  var tade = ta + '的';

  // 主人称呼（根据人称设置）
  var perspective = getPerspective();
  var profile = (typeof _playerProfile !== 'undefined') ? _playerProfile : {};
  var masterName = profile.name || '主人';
  var master, masterD;
  if (perspective === 'first') {
    master = '我'; masterD = '我的';
  } else if (perspective === 'second') {
    master = '你'; masterD = '你的';
  } else {
    master = masterName; masterD = masterName + '的';
  }

  // ── 助手占位符（仅助手模式有效，否则为空字符串）──
  var helperName = '', helperTa = '', helperTade = '';
  if (State.assistantMode) {
    var _astIdPh = State.activeAssistantId;
    if (_astIdPh) {
      var _astSvPh = loadSave(_astIdPh);
      if (_astSvPh && _astSvPh.char) {
        var _astCharPh = _astSvPh.char;
        helperName  = _astCharPh.name || '助手';
        helperTa    = _astCharPh.gender === '女' ? '她' : '他';
        helperTade  = helperTa + '的';
      }
    }
  }

  // ★ 多角色占位符：{A}/{B}/{ta_A}/{ta_B} 等
  var charAName = '', charATa = '他', charATade = '他的';
  var charBName = '', charBTa = '他', charBTade = '他的';
  if (State.storyCharA) {
    charAName = State.storyCharA.name || '';
    charATa   = State.storyCharA.gender === '女' ? '她' : '他';
    charATade = charATa + '的';
  }
  if (State.storyCharB) {
    charBName = State.storyCharB.name || '';
    charBTa   = State.storyCharB.gender === '女' ? '她' : '他';
    charBTade = charBTa + '的';
  }

  return text
    .replace(/\{slave\}/g, slaveName)
    .replace(/\{slaveD\}/g, slaveD)
    .replace(/\{master\}/g, master)
    .replace(/\{masterD\}/g, masterD)
    .replace(/\{ta\}/g, ta)
    .replace(/\{tade\}/g, tade)
    .replace(/\{helper\}/g, helperName)
    .replace(/\{helper_ta\}/g, helperTa)
    .replace(/\{helper_tade\}/g, helperTade)
    .replace(/\{A\}/g, charAName)
    .replace(/\{B\}/g, charBName)
    .replace(/\{ta_A\}/g, charATa)
    .replace(/\{tade_A\}/g, charATade)
    .replace(/\{ta_B\}/g, charBTa)
    .replace(/\{tade_B\}/g, charBTade);
}



// ── 防锁死看门狗（强化版）──────────────────────────────────
// 检测 isProcessing 卡死超过5秒自动恢复，并输出日志
var __eraLastProc = Date.now();
var __eraLockWatchdog = setInterval(function(){
  if (!window.State) return;
  var now = Date.now();
  // 更新最后活跃时间戳（仅在未锁定时更新）
  if (!State.isProcessing) {
    __eraLastProc = now;
    return;
  }
  // ★ 修复：锁定超过3秒 → 强制解锁（原5秒太久）
  if (now - __eraLastProc > 3000) {
    console.warn('[ERA BugFix] isProcessing 卡死超过3秒，自动恢复。时间戳:', new Date().toISOString());
    State.isProcessing = false;
    __eraLastProc = now;
    try { renderActs(); } catch(e) { console.error('[ERA BugFix] renderActs error:', e); }
    try {
      var thinkEl = document.getElementById('ai-think');
      if (thinkEl) thinkEl.style.display = 'none';
    } catch(e) {}
    toast('⚠️ 检测到指令卡死，已自动恢复', '');
  }
}, 1000);

// ============================================================
// 助手调教栏（renderAssistantTrainingBar）
// ============================================================
function renderAssistantTrainingBar() {
  var bar = document.getElementById('assistant-training-bar');
  if (!bar) return;

  var astIds = loadAssistants();
  if (!astIds.length) {
    bar.innerHTML = '';
    bar.style.display = 'none';
    return;
  }

  var c = State.currentChar;
  var actId = State.activeAssistantId || astIds[0];
  // ★ 修复：确保 State.activeAssistantId 始终有值（刷新后为 null 会导致 doAction 步骤 0.5 跳过）
  if (!State.activeAssistantId && actId) State.activeAssistantId = String(actId);
  var base  = CHARS_DATA.find(function(x){ return String(x.id) === String(actId); });
  var astSv = base ? loadSave(base.id) : null;
  var astChar = astSv && astSv.char;
  if (!astChar) { bar.innerHTML = ''; bar.style.display = 'none'; return; }

  var astName = astChar.name || '助手';
  var isSelf  = c && String(actId) === String(c.id);
  var isMode  = State.assistantMode;
  var maxSta  = typeof getMaxStamina === 'function' ? getMaxStamina(astChar) : 1500;
  var staPct  = Math.round(Math.max(0, Math.min(100, (astChar.stamina / maxSta) * 100)));
  var isExhausted = astChar.stamina <= 0 && astChar.energy <= 0;

  var profile = astSv.charProfile || {};
  var avaImg = profile.avaImg || profile._presetAvaUrl || '';
  if (!avaImg && typeof CharRegistry !== 'undefined') {
    var _cr2 = CharRegistry.get(actId);
    if (_cr2 && _cr2._presetAvaUrl) avaImg = _cr2._presetAvaUrl;
  }
  var miniAva = avaImg
    ? '<div style="width:26px;height:26px;border-radius:50%;background-image:url(\'' + avaImg + '\');background-size:cover;background-position:center;border:1.5px solid var(--acc-g);flex-shrink:0"></div>'
    : '<div style="width:26px;height:26px;border-radius:50%;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:.85rem;border:1.5px solid var(--bdr);flex-shrink:0">' + (typeof cEmoji==='function'?cEmoji(astChar):'👤') + '</div>';

  // 助手下拉（多助手时显示选择）
  var dropHtml = '';
  if (astIds.length > 1) {
    dropHtml = '<select onchange="_switchActiveAssistant(this.value);" ' +
      'style="background:var(--card2);color:var(--txt2);border:1px solid var(--bdr);' +
      'border-radius:6px;padding:1px 4px;font-size:.62rem;cursor:pointer;max-width:90px">';
    astIds.forEach(function(aid) {
      var ab = CHARS_DATA.find(function(x){ return String(x.id)===String(aid); });
      var asv = ab ? loadSave(ab.id) : null;
      var ac  = asv && asv.char;
      var nm  = (ac && ac.name) || (ab && ab.name) || aid;
      dropHtml += '<option value="' + aid + '"' + (String(aid)===String(actId)?' selected':'') + '>' + (typeof esc==='function'?esc(nm):nm) + '</option>';
    });
    dropHtml += '</select>';
  }

  // 自我调教提示
  var selfTag = isSelf
    ? '<span style="background:var(--acc-s);color:var(--so);font-size:.56rem;padding:0 5px;' +
      'border-radius:6px;border:1px solid var(--bdr);margin-left:3px">自我调教</span>'
    : '';

  // 助手体力小条
  var staColor = staPct > 50 ? 'var(--sg)' : staPct > 25 ? 'var(--so)' : 'var(--sr)';
  var staBarHtml = '<div style="display:flex;align-items:center;gap:3px;min-width:55px">' +
    '<div style="flex:1;height:3px;background:var(--bdr);border-radius:2px;overflow:hidden">' +
    '<div style="height:100%;width:' + staPct + '%;background:' + staColor + ';border-radius:2px"></div>' +
    '</div>' +
    '<span style="font-size:.52rem;color:var(--muted)">' + staPct + '%</span></div>';

  // 切换按钮
  var toggleHtml;
  if (isExhausted) {
    toggleHtml = '<span style="font-size:.62rem;color:var(--sr);padding:3px 8px;' +
      'background:var(--acc-s);border:1px solid var(--bdr);border-radius:7px">💤 力竭</span>';
  } else {
    toggleHtml = '<div style="display:flex;gap:0;border-radius:8px;overflow:hidden;border:1px solid var(--bdr)">' +
      '<button onclick="State.assistantMode=false;renderAssistantTrainingBar();renderActs();" style="' +
      'padding:3px 9px;font-size:.62rem;cursor:pointer;border:none;transition:all .15s;' +
      'background:' + (!isMode ? 'var(--acc)' : 'var(--card2)') + ';' +
      'color:' + (!isMode ? 'var(--btn-c)' : 'var(--txt2)') + ';' +
      'font-weight:' + (!isMode ? '700' : '400') + '">主角</button>' +
      '<button onclick="_toggleAssistantMode();" style="' +
      'padding:3px 9px;font-size:.62rem;cursor:pointer;border:none;transition:all .15s;' +
      'background:' + (isMode ? 'var(--acc3)' : 'var(--card2)') + ';' +
      'color:' + (isMode ? 'var(--btn-c)' : 'var(--txt2)') + ';' +
      'font-weight:' + (isMode ? '700' : '400') + '">助手</button>' +
      '</div>';
  }

  // 整体容器背景（助手模式用 acc-s 加以区分）
  var barBorder = isMode ? 'var(--acc-g)' : 'var(--bdr)';
  var barBg     = isMode ? 'var(--acc-s)' : 'var(--card)';

  bar.style.display = '';
  bar.innerHTML = '<div style="' +
    'background:' + barBg + ';border:1px solid ' + barBorder + ';' +
    'border-radius:10px;padding:6px 12px;' +
    'display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
    miniAva +
    '<div style="display:flex;align-items:center;gap:5px;flex:1;min-width:0">' +
    '<span style="font-size:.68rem;color:var(--muted)">助手</span>' +
    (dropHtml || '<span style="font-size:.74rem;font-weight:700;color:var(--txt)">' + (typeof esc==='function'?esc(astName):astName) + '</span>') +
    selfTag +
    staBarHtml +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:7px;flex-shrink:0">' +
    '<span style="font-size:.6rem;color:var(--muted)">调教模式</span>' +
    toggleHtml +
    '</div>' +
    '</div>';
}
function _toggleAssistantMode() {
  var c = State.currentChar;
  var astIds = loadAssistants();
  if (!astIds.length) return;
  var actId = State.activeAssistantId || astIds[0];
  // ★ 修复：刷新后 activeAssistantId 为 null，此处补写，保证 doAction 步骤 0.5 能读到
  if (!State.activeAssistantId && actId) State.activeAssistantId = String(actId);

  // 自我调教特殊处理
  if (c && String(actId) === String(c.id)) {
    State.assistantMode = !State.assistantMode;
    if (State.assistantMode && typeof ASSISTANT_SELF_TRAIN_STORY !== 'undefined') {
      var sv = loadSave(actId);
      var nm = (sv && sv.char && sv.char.name) || '助手';
      var st = ASSISTANT_SELF_TRAIN_STORY;
      if (st && typeof openStoryModal === 'function') {
        var stObj = {
          title: st.title,
          story: st.story.map(function(l){ return l.replace(/\{NAME\}/g, nm); }),
          cat: 'event', effects: {}
        };
        openStoryModal(stObj, st.title, {});
      }
    }
  } else {
    State.assistantMode = !State.assistantMode;
    // 启用助手模式时，触发助手反应剧情
    if (State.assistantMode) {
      var _sv2 = loadSave(actId);
      var _nm2 = (_sv2 && _sv2.char && _sv2.char.name) || '助手';
      var _charSt2 = (typeof ASSISTANT_CHAR_STORIES !== 'undefined') && ASSISTANT_CHAR_STORIES[actId];
      var _story2 = null;
      if (_charSt2 && _charSt2.length) {
        _story2 = _charSt2[0];
      } else {
        var _pool2 = (typeof ASSISTANT_APPOINT_GENERIC !== 'undefined') ? ASSISTANT_APPOINT_GENERIC : [];
        if (_pool2.length) _story2 = _pool2[Math.floor(Math.random() * _pool2.length)];
      }
      if (_story2 && typeof openStoryModal === 'function') {
        var _stObj2 = {
          title: _story2.title,
          story: _story2.story.map(function(l){ return l.replace(/\{NAME\}/g, _nm2); }),
          cat: 'event', effects: {}
        };
        openStoryModal(_stObj2, _story2.title, {});
      }
    }
  }
  renderAssistantTrainingBar();
  renderActs();
}

// 切换活跃助手并触发该助手的反应剧情
function _switchActiveAssistant(newId) {
  var oldId = State.activeAssistantId;
  State.activeAssistantId = String(newId);
  renderAssistantTrainingBar();
  renderActs();

  // 仅在切换到不同助手时触发剧情
  if (String(newId) === String(oldId)) return;

  var _swBase = CHARS_DATA.find(function(c){ return String(c.id) === String(newId); });
  var _swSv   = _swBase ? loadSave(_swBase.id) : null;
  var _swChar = _swSv && _swSv.char;
  var _swName = (_swChar && _swChar.name) || (_swBase && _swBase.name) || '助手';

  // 优先角色专属剧情，否则随机通用重新确认剧情
  var _swStory = null;
  var _swCharSt = (typeof ASSISTANT_CHAR_STORIES !== 'undefined') && ASSISTANT_CHAR_STORIES[newId];
  if (_swCharSt && _swCharSt.length) {
    _swStory = _swCharSt[0];
  } else {
    var _swPool = (typeof ASSISTANT_RECONFIRM_GENERIC !== 'undefined') ? ASSISTANT_RECONFIRM_GENERIC : [];
    if (_swPool.length) _swStory = _swPool[Math.floor(Math.random() * _swPool.length)];
  }

  if (_swStory && typeof openStoryModal === 'function') {
    var _swObj = {
      title: _swStory.title,
      story: _swStory.story.map(function(l){ return l.replace(/{NAME}/g, _swName); }),
      cat: 'event', effects: {}
    };
    setTimeout(function(){ openStoryModal(_swObj, _swStory.title, {}); }, 60);
  }
}
