// ============================================================
// js/core/game.js
// 角色列表、训练系统、互动记录、成就
// ============================================================

const PER_PAGE = 12;

// ── 角色筛选 ──────────────────────────────────────────────
function getFilteredChars() {
  let chars = CHARS_DATA;
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
  if (!grid) return;

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
    : `${State.charPage + 1} / ${Math.max(1, Math.ceil(CHARS_DATA.length / PER_PAGE))} 页`;
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

  // 自动保存当前角色（防止切换时丢失进度）
  if (State.currentChar) writeSave();

  const saved = loadSave(id);
  if (saved) {
    State.currentChar = saved.char;
    State.gameLog     = saved.log     || [];
    State.day         = saved.day     || 1;
    State.money       = saved.money   != null ? saved.money : 10000;
    State.inventory   = saved.inventory || {};
    toast('已读取存档 ✓', 'ok');
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
      State.day       = 1;
      State.money     = 10000;
      State.inventory = {};
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
  // 立即保存一次
  writeSave();
}

// ── 自动恢复上次游玩 ──────────────────────────────────────
function autoRestoreLastChar() {
  const lastId = localStorage.getItem('era_last_char');
  if (!lastId) return;
  const id = isNaN(lastId) ? lastId : Number(lastId);
  const saved = loadSave(id);
  if (saved) {
    State.currentChar = saved.char;
    State.gameLog     = saved.log     || [];
    State.day         = saved.day     || 1;
    State.money       = saved.money   || 10000;
    State.inventory   = saved.inventory || {};
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
    if (profile.avaImg) {
      avaEl.textContent = '';
      avaEl.style.backgroundImage = `url('${profile.avaImg}')`;
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

function renderActs() {
  var allActs = TRAINS_DATA.filter(t => t.category === State.currentCat);
  // ★ 性别过滤：某些指令只适用于女/双性/扶她
  var FEMALE_ONLY_CMDS = ['舔阴','玩弄小穴','阴蒂夹','阴蒂爱抚•助手命令','玩弄小穴•助手命令','命其胸部自慰','舔阴命令','命其舔阴','磨镜','触手玩弄阴蒂','触手阴道扩张','触手两穴扩张','触手玩弄子宫','触手玩弄Ｇ点','两穴拳交','拳交','Ｇ点刺激','淫乱牡丹','插入Ｇ点玩弄','插入子宫口玩弄','搾乳','挤奶器','触手挤奶','正常位','后背位','骑乘位','对面座位','背面座位','对面立位','背面立位','错开内裤插入'];
  var slaveGender = State.currentChar ? State.currentChar.gender : '';
  var acts = allActs;
  if (slaveGender === '男') {
    acts = allActs.filter(function(a) { return FEMALE_ONLY_CMDS.indexOf(a.name) < 0; });
  }
  const grid  = document.getElementById('act-grid');
  if (!grid) return;
  var html = '';
  if (acts.length) {
    html = acts.map(a => `
        <button class="act-btn" onclick="doAction('${esc(a.name)}','${a.category}')"
          onmouseenter="_cmdTipShow(this,'${esc(a.name)}')"
          onmouseleave="_cmdTipHide()"
          ontouchstart="_cmdTouchStart(this,'${esc(a.name)}')"
          ontouchend="_cmdTouchEnd()"
          ontouchcancel="_cmdTouchEnd()"
          ${State.isProcessing ? 'disabled' : ''}>
          ${esc(a.name)}
        </button>`).join('');
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
var _isTouchDevice = ('ontouchstart' in window);
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
var _cmdTouchTimer = null;
function _cmdTouchStart(btn, name) {
  _cmdTouchTimer = setTimeout(function(){
    var desc = (typeof CMD_DESCRIPTIONS !== 'undefined') ? CMD_DESCRIPTIONS[name] : null;
    if (!desc) desc = '暂无解说';
    openCustomConfirm('📖 '+name, '<div style="font-size:.84rem;color:var(--txt2);line-height:1.9">'+esc(desc).replace(/\n/g,'<br>')+'</div>', '关闭', function(){});
  }, 800);
}
function _cmdTouchEnd() { clearTimeout(_cmdTouchTimer); }

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

// ── 执行指令 ──────────────────────────────────────────────
async function doAction(name, cat) {
  if (State.isProcessing || !State.currentChar) return;
  const c   = State.currentChar;
  const cfg = ACTION_CONFIG[cat] || ACTION_CONFIG.basic;

  if (c.stamina <= 0) {
    toast('⚠️ 体力已耗尽，注意休息', '');
  }

  State.isProcessing = true;
  renderActs();

  // 1. 优先查 COMMAND_STORIES（多层级分支系统）
  let story = null;
  if (typeof COMMAND_STORIES !== 'undefined' && COMMAND_STORIES[name]) {
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
  }
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
  ['stamina', 'energy', 'lust', 'obedience', 'affection']
    .forEach(k => setStat(k, State.currentChar[k]));
  const timeEl2 = document.getElementById('hdr-h1');
  if (timeEl2) timeEl2.textContent = `第 ${State.day} 天`;

  checkAch();

  // 有剧情 → 打开剧情弹窗
  if (story) {
    openStoryModal(story, name, changes);
  } else {
    // 无剧情 → 直接获取台词
    let dialogue = '';
    if (window.API_STATE?.key) {
      const thinkEl = document.getElementById('ai-think');
      if (thinkEl) thinkEl.style.display = 'flex';
      try { dialogue = await callAI(State.currentChar, name); } catch (e) {}
      if (thinkEl) thinkEl.style.display = 'none';
    }
    // ★ 优先使用人格/情绪条件台词
    if (!dialogue && typeof getEnhancedDialogue === 'function') {
      dialogue = getEnhancedDialogue(name, cat);
    }
    if (!dialogue) dialogue = getLocalDialogue(cat, State.currentChar.affection, State.currentChar.obedience);
    addLog(dialogue, 'act', { actionName: name, changes });
    State.isProcessing = false;
    renderActs();
    // 自动保存进度
    writeSave();

    // ── 初次性交经验追踪 ──
    _trackFirstSexExp(name);

    // ── 逆推触发检测 ──────────────────────────────────────
    setTimeout(function() {
      if (typeof checkReverseTrainingTrigger === 'function' && checkReverseTrainingTrigger()) {
        if (typeof openReverseTrainingModal === 'function') {
          openReverseTrainingModal();
        }
      }
    }, 600);
  }
}

function _trackFirstSexExp(actionName) {
  var vActions = ['正常位','后背位','骑乘位','对面座位','背面座位','对面立位','背面立位','逆正常位','逆后背位','错开内裤插入'];
  var aActions = ['正常位肛交','后背位肛交','骑乘位肛交','对面座位肛交','背面座位肛交','对面立位肛','背面立位肛','逆肛正常位','逆肛后背位','逆肛骑乘位','逆肛对面座位','逆肛背面座位','逆肛对面立位','逆肛背面立位','错开内裤插入肛门'];
  var det = (typeof getPlayerDetail === 'function') ? getPlayerDetail() : {};
  var c = State.currentChar;
  if (!c) return;
  var changed = false;
  if (vActions.indexOf(actionName) >= 0 && !det.firstVirginity) {
    det.firstVirginity = c.name;
    changed = true;
    toast('📝 将V经验交予了：' + c.name, '');
  }
  if (aActions.indexOf(actionName) >= 0 && !det.firstAnal) {
    det.firstAnal = c.name;
    changed = true;
    toast('📝 将A经验交予了：' + c.name, '');
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
    _playerProfile.energy = Math.min(_playerProfile.energyMax || 2000, (_playerProfile.energy || 0) + Math.floor((_playerProfile.energyMax || 2000) * 0.5));
    localStorage.setItem('era_profile', JSON.stringify(_playerProfile));
  }
  if (typeof consumeTime === 'function') { consumeTime('night'); } else { State.day++; }

  if (State.currentChar) { setStat('stamina', State.currentChar.stamina); setStat('energy', State.currentChar.energy); }
  const timeEl3 = document.getElementById('hdr-h1');
  if (timeEl3) timeEl3.textContent = `第 ${State.day} 天`;
  document.getElementById('hdr-sub').textContent = State.currentChar?.name || '';

  // ★ 效果直接拼接在剧情后面（不分页）
  var storyLines = (rs.story || ['好好休息了一番。']).slice();
  storyLines.push('');
  storyLines.push('所有奴隶和主人的体力与精力恢复了上限的50%。');
  storyLines.push('进入了第 ' + State.day + ' 天。');

  addLog(`进入第 ${State.day} 天，充分休息后所有奴隶都恢复了体力。`, 'sys');
  if (typeof pushStoryLog === 'function') pushStoryLog('rest', { title: rs.title, date: typeof getDateStr==='function'?getDateStr():`第${State.day}天`, story: storyLines });
  if (typeof openStoryModal === 'function') { setTimeout(() => { openStoryModal({ title: '🌙 ' + rs.title, story: storyLines, noSplit: true, cat: 'basic' }, '休息', {}); }, 80); }
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
  if (writeSave()) toast('存档成功 ✓', 'ok');
  else             toast('存档失败', 'err');
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
  var groups = { '基础': [], '性癖': [], '极堕': [], '日常': [] };
  if(typeof EXP_FIELDS!=='undefined'){
    EXP_FIELDS.forEach(function(f){ if(groups[f.group]) groups[f.group].push(f); });
  }
  var groupColors = { '基础':'#4caf50', '性癖':'#9c27b0', '极堕':'#e53935', '日常':'#f57c00' };
  
  var html = '<div style="text-align:center;margin-bottom:14px"><div style="font-size:2rem">'+cEmoji(c)+'</div><div style="font-weight:800;font-size:1rem;color:var(--txt)">'+esc(c.name)+' · 角色经验</div><div style="font-size:.7rem;color:var(--muted);margin-top:3px">'+esc(c.gender||'')+' · '+esc(c.race||'')+' · '+esc(c.class||'')+'</div></div>';
  
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

  return text
    .replace(/\{slave\}/g, slaveName)
    .replace(/\{master\}/g, master)
    .replace(/\{masterD\}/g, masterD)
    .replace(/\{ta\}/g, ta)
    .replace(/\{tade\}/g, tade);
}
