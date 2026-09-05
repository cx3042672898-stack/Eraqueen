// ============================================================
// js/core/outing.js
// 外出系统核心逻辑
// 包含：打工 / 闲逛 / 约会 / 劳役
// ============================================================

let _outingCat = 'work'; // 当前子模块

// ── 外出页渲染 ────────────────────────────────────────────
function renderOutingPage() {
  _setOutingCat(_outingCat, null);
}

function setOutingCat(cat, btn) {
  _outingCat = cat;
  document.querySelectorAll('.outing-cat-chip').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  _setOutingCat(cat, btn);
}

function _setOutingCat(cat) {
  const panels = ['work-panel', 'wander-panel', 'date-panel', 'corvee-panel'];
  panels.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const panelMap = {
    work:   'work-panel',
    wander: 'wander-panel',
    date:   'date-panel',
    corvee: 'corvee-panel',
  };
  const target = document.getElementById(panelMap[cat]);
  if (target) target.style.display = '';

  if (cat === 'work')   renderWorkPanel();
  if (cat === 'corvee') renderCorveePanel();
  if (cat === 'date')   renderDatePanel();
}

// ── 打工：地点选择面板 ────────────────────────────────────
function renderWorkPanel() {
  const grid = document.getElementById('work-location-grid');
  if (!grid) return;
  grid.innerHTML = WORK_LOCATIONS.map(loc => `
    <div class="work-loc-card" onclick="startWork('${loc.id}')">
      <div class="wlc-icon">${loc.icon}</div>
      <div class="wlc-name">${loc.name}</div>
      <div class="wlc-desc">${loc.desc}</div>
      <div class="wlc-reward">
        💰 ~${loc.moneyBase}
      </div>
    </div>`).join('');
}

// ── 打工：开始 ───────────────────────────────────────────
let _currentWorkLoc = null;
let _currentWorkEvent = null;

function startWork(locId) {
  const loc = WORK_LOCATIONS.find(l => l.id === locId);
  if (!loc || !loc.events.length) {
    toast('该地点暂无可用任务', '');
    return;
  }
  // 重置闲逛标志，防止上次未正常结束的闲逛污染本次打工日志
  _isWanderMode = false;
  _currentWanderEvent = null;
  _currentWorkLoc = loc;
  // 随机选一条剧情
  _currentWorkEvent = pick(loc.events);
  openWorkStory(_currentWorkEvent, loc);
}

// ── 打工：剧情弹窗 ────────────────────────────────────────
let _workStoryPages = [];
let _workStoryIdx   = 0;
let _workPhase      = 'reading'; // 'reading' | 'choice'

function openWorkStory(event, loc) {
  _workStoryPages = [];
  const story = event.story || [];
  for (let i = 0; i < story.length; i += 5) {
    _workStoryPages.push(story.slice(i, i + 5));
  }
  _workStoryIdx = 0;
  _workPhase    = 'reading';

  // Set header
  const bannerTitle = document.getElementById('work-story-title');
  const bannerTag   = document.getElementById('work-story-tag');
  if (bannerTitle) bannerTitle.textContent = event.title;
  if (bannerTag)   bannerTag.textContent   = `${loc.icon} ${loc.name} · 打工剧情`;

  _renderWorkStoryPage();
  openOv('ov-work-story');
}

function _renderWorkStoryPage() {
  const body    = document.getElementById('work-story-body');
  const dots    = document.getElementById('work-story-dots');
  const choices = document.getElementById('work-story-choices');
  const prevBtn = document.getElementById('ws-prev');
  const nextBtn = document.getElementById('ws-next');

  const isLast = _workStoryIdx === _workStoryPages.length - 1;

  // Body
  if (body) {
    const page = _workStoryPages[_workStoryIdx] || [];
    body.innerHTML = page.map(p => {
      // ★ 应用人称占位符替换（{master},{slave},{ta} 等）
      const _p = typeof applyStoryPlaceholders === 'function' ? applyStoryPlaceholders(p) : p;
      return (_p.startsWith('「') || _p.startsWith('"'))
        ? `<p class="story-quote">${esc(_p)}</p>`
        : `<p>${esc(_p)}</p>`;
    }).join('');
  }

  // Dots
  if (dots) {
    dots.innerHTML = _workStoryPages.map((_, i) =>
      `<span class="story-dot ${i === _workStoryIdx ? 'on' : ''}"
             onclick="workStoryGoto(${i})"></span>`).join('');
  }

  // Choices or navigation
  if (choices) {
    if (isLast && _workPhase === 'reading') {
      // Show choices
      choices.style.display = '';
      choices.innerHTML = (_currentWorkEvent?.choices || []).filter(c => c && c.text).map((c, i) => {
        // ★ 应用人称占位符替换，确保选项按钮文字中的 {master} 等正确显示
        const _t = typeof applyStoryPlaceholders === 'function' ? applyStoryPlaceholders(c.text) : c.text;
        return `<button class="btn btn-full work-choice-btn"
                onclick="pickWorkChoice(${i})" style="margin-bottom:8px;text-align:left;padding:12px 14px;white-space:normal;word-break:normal;word-wrap:break-word;line-height:1.6;height:auto;min-height:44px">
          ${esc(_t)}
        </button>`;
      }).join('') +
        `<button class="ai-gen-btn" style="margin-top:6px" onclick="aiGenOutingStory()">🤖 AI生成替代剧情</button>`;
    } else {
      choices.style.display = 'none';
    }
  }

  if (prevBtn) prevBtn.style.display = _workStoryIdx > 0 ? '' : 'none';
  if (nextBtn) nextBtn.style.display = (!isLast) ? '' : 'none';
}

function workStoryGoto(idx) {
  _workStoryIdx = idx;
  _renderWorkStoryPage();
}

function workStoryNext() {
  if (_workStoryIdx < _workStoryPages.length - 1) {
    _workStoryIdx++;
    _renderWorkStoryPage();
  }
}

function workStoryPrev() {
  if (_workStoryIdx > 0) {
    _workStoryIdx--;
    _renderWorkStoryPage();
  }
}

// ── 打工：选择选项（排版优化、专属图标、嵌套结算版） ──────────────────────────
function pickWorkChoice(idx) {
  const choice = _currentWorkEvent?.choices?.[idx];
  if (!choice) return;

  window._lastChoiceText = choice.text || '';
  window._lastChoiceResultFull = '';

  // 【核心机制1：动态解析】支持随机事件的数据覆盖
  let resolvedChoice = { ...choice };
  if (typeof choice.dynamicOutcome === 'function') {
    const dynamicData = choice.dynamicOutcome();
    resolvedChoice = { ...resolvedChoice, ...dynamicData };
  }

  // 【核心机制2：剧情嵌套】如果带有 nextEvent，进入下一层
  if (resolvedChoice.nextEvent) {
    _currentWorkEvent = resolvedChoice.nextEvent;
    _workPhase = 'reading';
    openWorkStory(_currentWorkEvent, _currentWorkLoc);
    return;
  }

  // 开始最终结算
  _workPhase = 'result';
  const body    = document.getElementById('work-story-body');
  const choices = document.getElementById('work-story-choices');
  const nextBtn = document.getElementById('ws-next');
  const prevBtn = document.getElementById('ws-prev');
  const dots    = document.getElementById('work-story-dots');

  if (!body) return;

  const charName = State.currentChar?.name || '你';

  // --- 1. 剧情文本渲染 ---
  // ★ 先做 {name} 替换（兼容劳役剧情），再做通用占位符替换（处理 {master} 等）
  const _choiceDisplayText = typeof applyStoryPlaceholders === 'function'
    ? applyStoryPlaceholders(resolvedChoice.text.replace(/\{name\}/g, charName))
    : resolvedChoice.text.replace(/\{name\}/g, charName);

  let fullHTML = `
    <p class="story-quote" style="margin-bottom:18px; color:var(--acc); font-weight:600; font-size:1.02rem;">
      ▶ 你选择了：<strong>${esc(_choiceDisplayText)}</strong>
    </p>`;

  let resultText = (resolvedChoice.result || '').replace(/\{name\}/g, charName);
  // ★ 应用人称占位符替换，将 {master}/{slave}/{ta} 等转换为实际称呼
  if (typeof applyStoryPlaceholders === 'function') resultText = applyStoryPlaceholders(resultText);
  window._lastChoiceResultFull = resultText;
  const paragraphs = resultText.split(/\n\n+/).filter(p => p.trim() !== '');

  paragraphs.forEach(para => {
    if (para.includes('【') && para.includes('】')) {
      fullHTML += `<p style="font-weight:700; color:var(--acc2); margin:22px 0 10px 0; font-size:1.08rem;">${esc(para)}</p>`;
    } else {
      const lines = para.split(/\n+/).filter(l => l.trim() !== '');
      fullHTML += `<p style="line-height:1.88; margin-bottom:16px; text-align:justify;">${lines.map(l => esc(l)).join('<br>')}</p>`;
    }
  });

  body.innerHTML = fullHTML;

  // --- 2. 基础资源结算（打工只给金钱，不给基础经验）---
  const money = (resolvedChoice.money != null) ? Math.floor(resolvedChoice.money * (0.85 + Math.random() * 0.3)) : 0;
  // 打工额外奖励金币（随机波动）
  const bonusMoney = money > 0 ? Math.floor(50 + Math.random() * 100) : 0;
  const totalMoney = money + bonusMoney;
  const exp   = 0; // 打工不再给基础经验

  State.money += totalMoney;
  if(typeof _logMoney==='function' && totalMoney!==0) _logMoney('打工·'+ (_currentWorkLoc?.name||'外出'), totalMoney);

// --- 3. 经验字典：为不同的经验配置专属图标 (与最新 features.js 严格同步) ---
  const EXP_ICONS = {
    // 英文 Key
    'expV': '🌺', 'expA': '🍑', 'expPeak': '🎆', 'expEjac': '💦', 'expSex': '🛏️', 
    'expCreampie': '🤍', 'expAnal': '🤎', 'expU': '💧', 'expM': '🍈', 'expSolo': '🪞', 
    'expTeachSolo': '📸', 'expFluid': '🥛', 'expSemenDrinkPeak': '🤤', 'expPee': '⛲', 
    'expScat': '💩', 'expService': '🙇', 'expOral': '👅', 'expCunnilingus': '🐚', 
    'expLove': '💖', 'expSuffer': '⛓️', 'expBite': '😈', 'expYuri': '🌸', 
    'expRose': '⚔️', 'expBind': '🎀', 'expVExpand': '🏵️', 'expAExpand': '⭕', 
    'expUExpand': '💉', 'expMilk': '🍼', 'expTentacle': '🦑', 'expVampire': '🦇', 
    'expEgg': '🥚', 'expBirth': '👶', 'expWeird': '⚠️', 'expHouse': '🍳', 
    'expPhoto': '📷', 'expModel': '🎞️', 'expSing': '🎤', 'expTrain': '👑',
    
    // 中文 Label (兼容截图中的带空格版本以及无空格版本，以防编写时漏打空格)
    'V 经验': '🌺', 'V经验': '🌺',
    'A 经验': '🍑', 'A经验': '🍑',
    '绝顶经验': '🎆', '射精经验': '💦', '性交经验': '🛏️', '内射经验': '🤍', '肛射经验': '🤎', 
    'U 经验': '💧', 'U经验': '💧',
    'M 经验': '🍈', 'M经验': '🍈',
    '自慰经验': '🪞', '调教自慰经验': '📸', '精液经验': '🥛', '精饮绝顶经验': '🤤', 
    '放尿经验': '⛲', '排便经验': '💩', '侍奉快乐经验': '🙇', '口交经验': '👅', 
    '舔阴经验': '🐚', '爱情经验': '💖', '痛苦快乐经验': '⛓️', '嗜虐快乐经验': '😈', 
    '百合经验': '🌸', '蔷薇经验': '⚔️', '紧缚经验': '🎀', 
    'V 扩张经验': '🏵️', 'V扩张经验': '🏵️', 
    'A 扩张经验': '⭕', 'A扩张经验': '⭕', 
    'U 扩张经验': '💉', 'U扩张经验': '💉', 
    '喷乳经验': '🍼', '触手经验': '🦑', '吸血经验': '🦇', '产卵经验': '🥚', '生育经验': '👶', 
    '异常经验': '⚠️', '家务经验': '🍳', '摄影经验': '📷', '被拍经验': '🎞️', 
    '歌唱经验': '🎤', '调教经验': '👑'
  };

  // --- 4. 具体经验结算与 UI 组装 ---
  let specificExpHtml = '';
  if (resolvedChoice.expChanges) {
    for (const [expLabel, amt] of Object.entries(resolvedChoice.expChanges)) {
      if (amt <= 0) continue;
      
      // 数据存储逻辑
      let expKey = expLabel;
      if (typeof EXP_FIELDS !== 'undefined') {
        const field = EXP_FIELDS.find(f => f.label === expLabel || f.key === expLabel);
        if (field) expKey = field.key;
      }
      if (typeof addPlayerExp === 'function') addPlayerExp(expKey, amt);

      // 图标匹配 (优先找底层的Key，再找表面的Label，实在没有就给星星)
      const icon = EXP_ICONS[expKey] || EXP_ICONS[expLabel] || '✨';
      
      

      

      // 标签UI HTML (白底/灰底+圆角，防止断行)
      specificExpHtml += `
        <div style="display:inline-flex; align-items:center; background:var(--card2); border:1px solid var(--border); border-radius:6px; padding:4px 8px; font-size:0.85rem; color:var(--txt); white-space:nowrap;">
          <span style="margin-right:4px;">${icon}</span> ${expLabel} 
          <span style="color:var(--pos); font-weight:bold; margin-left:6px;">+${amt}</span>
        </div>`;
    }
  }

  // --- 5. NPC属性结算与 UI 组装 ---
  let charEffHtml = '';
  if (State.currentChar && resolvedChoice.charChanges) {
    const keys = { affection:'好感❤', lust:'欲望🔥', obedience:'服从👁', stamina:'体力💪', depression:'抑郁☠️', dominance:'支配⚔️' };
    for (const [k, label] of Object.entries(keys)) {
      if (resolvedChoice.charChanges[k] !== undefined) {
        const v = Number(resolvedChoice.charChanges[k]);
        State.currentChar[k] = clamp((State.currentChar[k] || 0) + v, -999, 999);
        
        const isPos = v > 0;
        const colorVar = isPos ? 'var(--pos)' : 'var(--neg)'; // 绿或红
        const sign = isPos ? '+' : '';
        
        charEffHtml += `
          <div style="display:inline-flex; align-items:center; background:var(--card2); border:1px solid var(--border); border-radius:6px; padding:4px 8px; font-size:0.85rem; color:var(--txt); white-space:nowrap;">
            ${label} <span style="color:${colorVar}; font-weight:bold; margin-left:6px;">${sign}${v}</span>
          </div>`;
      }
    }
  }

  // --- 6. 最终奖励排版 (使用 Flex 弹性盒，彻底解决乱七八糟的对齐问题) ---
  let rewardHtml = `
    <div style="display:flex; flex-direction:column; gap:10px; align-items:center; width: 100%; margin-top: 10px; padding: 12px; background: rgba(0,0,0,0.03); border-radius: 8px;">
      
      <!-- 第一排：金钱（仅金钱奖励）-->
      <div style="display:flex; gap:16px; font-size: 1.05rem; font-weight: bold;">
        ${totalMoney !== 0 ? `<span style="color:${totalMoney > 0 ? 'var(--pos)' : 'var(--neg)'}">💰 ${totalMoney > 0 ? '+' : ''}${totalMoney}</span>` : ''}
      </div>
      
      <!-- 第二排：具体黄油经验标签墙 -->
      ${specificExpHtml ? `<div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; width:100%;">${specificExpHtml}</div>` : ''}
      
      <!-- 第三排：NPC属性变化标签墙 -->
      ${charEffHtml ? `<div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; width:100%; border-top: 1px dashed var(--border); padding-top: 8px;">${charEffHtml}</div>` : ''}
      
    </div>
  `;

  if (dots) dots.innerHTML = rewardHtml || '剧情结束';

  // --- 7. 结束按钮更新 ---
  const isDate   = !!_currentWorkEvent?._isDate;
  const isCorvee = _currentWorkLoc?.id === '_corvee';
  const label = isDate ? '结束约会' : isCorvee ? '完成劳役' : '结束打工';

  if (choices) {
    choices.innerHTML = `
      <button class="btn btn-p btn-full" onclick="finishWork()" 
              style="margin-top:18px; padding:13px 0;">
        ✓ ${label}
      </button>`;
    choices.style.display = '';
  }

  if (nextBtn) nextBtn.style.display = 'none';
  if (prevBtn) prevBtn.style.display = 'none';

  const monEl = document.getElementById('p-money');
  if (monEl) monEl.textContent = fmtMoney(State.money);

  saveMiniState();
  checkTitles && checkTitles();
}




// ── 打工/闲逛：结束，保存剧情 ──────────────────────────
function finishWork(resultSnippet) {
  closeOv('ov-work-story');

  const dateStr = (typeof getDateStr === 'function') ? getDateStr() : `第 ${State.day} 天`;
  if (_isWanderMode) {
    const log = { id:Date.now(), date:dateStr, title:_currentWanderEvent?.title||'', snippet:resultSnippet||'' };
    State.wanderLog = [log, ...(State.wanderLog||[])].slice(0,10);
    // 统一日志
    if (typeof pushStoryLog === 'function') pushStoryLog('wander', { title:_currentWanderEvent?.title||'闲逛', date:dateStr, story:_currentWanderEvent?.story||[resultSnippet||''] });
    _isWanderMode = false;
    _currentWanderEvent = null;
    if (typeof consumeTime === 'function') consumeTime('day');
    saveMiniState();
    checkTitles();
    toast('闲逛结束 🚶', 'ok');
  } else {
    const isDate   = !!_currentWorkEvent?._isDate;
    const isCorvee = _currentWorkLoc?.id === '_corvee';
    const logType  = isDate ? 'date' : isCorvee ? 'corvee' : 'work';
    const log = { id:Date.now(), date:dateStr, loc:_currentWorkLoc?.name||'', title:_currentWorkEvent?.title||'', snippet:resultSnippet||'' };
    State.workLog = [log, ...(State.workLog||[])].slice(0,10);
    // 统一日志
    if (typeof pushStoryLog === 'function') pushStoryLog(logType, { title:_currentWorkEvent?.title||'外出', date:dateStr, char:State.currentChar?.name||'', story:_currentWorkEvent?.story||[resultSnippet||''], choiceText: _lastChoiceText||'', choiceResult: window._lastChoiceResultFull||resultSnippet||'' });
    if (typeof consumeTime === 'function') consumeTime('day');
    saveMiniState();
    checkTitles();
    const lbl = isDate?'约会结束 💌':isCorvee?'劳役完成 ⛓️':'打工完成 ✓';
    toast(lbl, 'ok');
  }
}

// ── 闲逛：使用打工剧情弹窗复用 ─────────────────────────
let _currentWanderEvent = null;
let _isWanderMode = false;

function doWander() {
  // 过滤掉没有 story 字段的非法条目（如模板地点对象）
  const validEvents = WANDER_EVENTS.filter(ev => ev && ev.story && ev.story.length > 0);
  if (!validEvents.length) {
    toast('（闲逛剧情开发中……）', '');
    return;
  }
  _currentWanderEvent = pick(validEvents);
  _isWanderMode = true;
  // Reuse work story overlay
  const bannerTitle = document.getElementById('work-story-title');
  const bannerTag   = document.getElementById('work-story-tag');
  if (bannerTitle) bannerTitle.textContent = _currentWanderEvent.title;
  if (bannerTag)   bannerTag.textContent   = '🚶 闲逛剧情';

  // Use same _workStoryPages machinery
  _currentWorkEvent = _currentWanderEvent;
  _currentWorkLoc   = { name: '闲逛', icon: '🚶' };
  openWorkStory(_currentWanderEvent, { name: '闲逛', icon: '🚶', id: '_wander' });
}

// ── 约会面板 ─────────────────────────────────────────────
let _dateSelectedLoc = null;

function renderDatePanel() {
  const panel = document.getElementById('date-panel');
  if (!panel) return;

  if (!State.currentChar) {
    panel.innerHTML = `
      <div class="empty" style="padding:30px 20px">
        <div class="empty-ico">💌</div>
        <p>需要先选择一位调教对象，<br>才能进行约会。</p>
        <button class="btn btn-ghost btn-full" onclick="navTo('chars')" style="margin-top:12px">
          去选择角色
        </button>
      </div>`;
    return;
  }

  const aff = State.currentChar?.affection || 0;
  const minAff = 20;

  if (aff < minAff) {
    panel.innerHTML = `
      <div class="empty" style="padding:30px 20px">
        <div class="empty-ico">💌</div>
        <p>与 <strong>${esc(State.currentChar.name)}</strong> 的好感度还不够……<br>
           当前好感：${aff} / 需要：${minAff}</p>
        <div style="height:8px;background:var(--card-bg);border-radius:4px;margin:12px 0">
          <div style="height:100%;width:${Math.min(100,aff/minAff*100)}%;background:var(--ac);border-radius:4px"></div>
        </div>
        <p style="font-size:.75rem;color:var(--muted)">继续训练以提升好感度</p>
      </div>`;
    return;
  }

  // Show location selection
  if (!DATE_LOCATIONS || !DATE_LOCATIONS.length) {
    panel.innerHTML = `<div class="empty"><p>约会地点数据加载中……</p></div>`;
    return;
  }

  panel.innerHTML = `
    <div style="padding:0 2px 8px">
      <div class="s-ttl">与 ${esc(State.currentChar.name)} 约会</div>
      <div style="font-size:.78rem;color:var(--muted);margin-bottom:12px">选择一个约会地点</div>
      <div class="date-loc-grid">
        ${DATE_LOCATIONS.map(loc => {
          var eff = loc.effects || {};
          // 从DATE_STORIES获取平均效果
          if(!loc.effects && typeof DATE_STORIES!=='undefined' && DATE_STORIES[loc.id]){
            var stories = DATE_STORIES[loc.id];
            if(stories.length){eff = stories[0].effects || {};}
          }
          return `
          <div class="date-loc-card" onclick="startDate('${loc.id}')">
            <div class="dlc-icon">${loc.icon}</div>
            <div class="dlc-name">${loc.name}</div>
            <div class="dlc-desc">${loc.desc}</div>
            <div class="dlc-eff">
              ${eff.affection ? `❤ +${eff.affection}` : ''}
              ${eff.lust      ? ` 🔥+${eff.lust}` : ''}
              ${eff.obedience ? ` 👁+${eff.obedience}` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function startDate(locId) {
  const loc = DATE_LOCATIONS?.find(l => l.id === locId);
  if (!loc || !State.currentChar) return;
  _dateSelectedLoc = loc;

  const char = State.currentChar;
  // 从 DATE_STORIES 获取剧情（修复：不再依赖 loc.events）
  var storyPool = (loc.events && loc.events.length) ? loc.events : (typeof DATE_STORIES!=='undefined' && DATE_STORIES[locId]) ? DATE_STORIES[locId] : null;
  if (!storyPool || !storyPool.length) {
    toast('该约会地点暂无剧情','');
    return;
  }
  const ev = storyPool[Math.floor(Math.random() * storyPool.length)];
  if (!ev) return;

  // Substitute {name} and {name_a} {name_b} with character name
  const story = ev.story.map(p => p.replace(/\{name\}/g, char.name).replace(/\{name_a\}/g, '你').replace(/\{name_b\}/g, char.name));
  const title = ev.title;
  var dateEffects = ev.effects || {};

  // Reuse work story overlay
  _currentWorkEvent = {
    title,
    story,
    choices: [
      {
        text: `结束与${char.name}的约会`,
        result: `今天和${char.name}一起度过了一段时光。${char.name}的好感似乎提升了一些。`,
        money: 0, exp: 10,
        _dateEffects: dateEffects,
      },
    ],
    _isDate: true,
    _dateLoc: loc,
  };
  _currentWorkLoc = { name: '约会', icon: '💌', id: '_date' };
  _isWanderMode = false;
  openWorkStory(_currentWorkEvent, _currentWorkLoc);
}

// ── 劳役面板 ─────────────────────────────────────────────
function renderCorveePanel() {
  const grid = document.getElementById('corvee-grid');
  if (!grid) return;
  grid.innerHTML = CORVEE_TYPES.map(t => `
    <div class="corvee-card ${t.stub ? 'stub' : ''}" onclick="openCorvee('${t.id}')">
      <div class="cc-icon">${t.icon}</div>
      <div class="cc-name">${t.name}</div>
      <div class="cc-desc">${t.desc}</div>
      ${t.stub ? '<div class="cc-stub">开发中</div>' : ''}
    </div>`).join('');
}

let _currentCorveeCat = null;

function openCorvee(id) {
  const t = CORVEE_TYPES.find(c => c.id === id);
  if (!t) return;

  // Check for character
  if (!State.currentChar) {
    toast('请先在角色列表选择一位调教对象', '');
    return;
  }

  const events = CORVEE_EVENTS?.[id];
  if (!events || !events.length) {
    toast(`「${t.name}」暂无可用剧情`, '');
    return;
  }

  _currentCorveeCat = id;
  const ev = pick(events);
  const char = State.currentChar;

  // Substitute {name}
  const story = ev.story.map(p => p.replace(/\{name\}/g, char.name));
  const choices = ev.choices.map(c => ({
    ...c,
    text:   c.text.replace(/\{name\}/g, char.name),
    result: c.result.replace(/\{name\}/g, char.name),
  }));

  _currentWorkEvent = { ...ev, title: ev.title.replace(/\{name\}/g, char.name), story, choices };
  _currentWorkLoc   = { name: t.name, icon: t.icon, id: '_corvee' };
  _isWanderMode = false;
  openWorkStory(_currentWorkEvent, _currentWorkLoc);
}

// ── 存储辅助 ─────────────────────────────────────────────
function saveMiniState() {
  try {
    localStorage.setItem('era_mini_state', JSON.stringify({
      workLog:   State.workLog   || [],
      wanderLog: State.wanderLog || [],
      corveeLog: State.corveeLog || [],
      dateLog:   State.dateLog   || [],
      storyLog:  State.storyLog  || [],
      playerExp: State.playerExp || 0,
      playerGenderChanged: State.playerGenderChanged || false,
    }));
  } catch(e) {}
}

function loadMiniState() {
  try {
    const raw = localStorage.getItem('era_mini_state');
    if (!raw) return;
    const d = JSON.parse(raw);
    State.workLog   = d.workLog   || [];
    State.wanderLog = d.wanderLog || [];
    State.corveeLog = d.corveeLog || [];
    State.dateLog   = d.dateLog   || [];
    State.storyLog  = d.storyLog  || [];
    State.playerExp = d.playerExp || 0;
    State.playerGenderChanged = d.playerGenderChanged || false;
  } catch(e) {}
}

// ── 打工/闲逛 剧情日志 弹窗 ──────────────────────────────
function openWorkLog() {
  const list = document.getElementById('work-log-list');
  if (!list) return;
  const logs = State.workLog || [];
  if (!logs.length) {
    list.innerHTML = `<div class="empty"><div class="empty-ico">📝</div><p>还没有打工记录……</p></div>`;
  } else {
    list.innerHTML = logs.map(l => `
      <div class="log-record">
        <div class="lr-header">
          <span class="lr-title">${esc(l.title)}</span>
          <span class="lr-date">${esc(l.date)} · ${esc(l.loc)}</span>
        </div>
        <div class="lr-snippet">${esc(l.snippet)}……</div>
      </div>`).join('');
  }
  openOv('ov-work-log');
}

function openWanderLog() {
  const list = document.getElementById('wander-log-list');
  if (!list) return;
  const logs = State.wanderLog || [];
  if (!logs.length) {
    list.innerHTML = `<div class="empty"><div class="empty-ico">🚶</div><p>还没有闲逛记录……</p></div>`;
  } else {
    list.innerHTML = logs.map(l => `
      <div class="log-record">
        <div class="lr-header">
          <span class="lr-title">${esc(l.title)}</span>
          <span class="lr-date">${esc(l.date)}</span>
        </div>
        <div class="lr-snippet">${esc(l.snippet)}……</div>
      </div>`).join('');
  }
  openOv('ov-wander-log');
}


// ── 性别/代词辅助 ─────────────────────────────────────
function getPlayerGender() {
  try {
    const p = JSON.parse(localStorage.getItem('era_profile') || '{}');
    return p.gender || '未设定';
  } catch(e) { return '未设定'; }
}

function getPlayerPronoun(form = 'he') {
  const g = getPlayerGender();
  if (form === 'he')   return g === '男' ? '他' : g === '女' ? '她' : '他/她';
  if (form === 'his')  return g === '男' ? '他的' : g === '女' ? '她的' : '他/她的';
  if (form === 'self') return g === '男' ? '自己' : '自己';
  return '他/她';
}

// 应用代词替换到剧情文本
function applyPronouns(text) {
  const g = getPlayerGender();
  if (g === '女') {
    return text.replace(/（他）/g, '（她）').replace(/主人/g, '主人');
  }
  return text;
}

// ── 移除劳役中 stub 标记 ─────────────────────────────────
// 覆盖 CORVEE_TYPES，去掉 stub（若已有 events 数据）
if (typeof CORVEE_EVENTS !== 'undefined') {
  CORVEE_TYPES.forEach(t => {
    if (CORVEE_EVENTS[t.id] && CORVEE_EVENTS[t.id].length > 0) {
      t.stub = false;
    }
  });
}

// ── AI生成外出替代剧情 ─────────────────────────────────────
async function aiGenOutingStory() {
  if (!window.API_STATE || !window.API_STATE.key) { toast('请先配置AI接口', ''); return; }
  const char = State.currentChar;
  const ev   = _currentWorkEvent;
  if (!ev) return;
  const lastPara = (ev.story || []).slice(-1)[0] || '';
  const locName  = _currentWorkLoc?.name || '外出';
  const prompt   = `你是成人文字游戏剧情作者。
场景：${locName}，角色：${char?.name || '奴隶'}
已有剧情末尾：${lastPara}
请续写2句（共约60字），风格一致，纯文本，不含括号星号。`;
  const btn = event.target; btn.disabled=true; btn.textContent='生成中…';
  try {
    const result = await callAI(char || {name:'主人',affection:50,obedience:50,lust:50,personality:'调教师',class:''}, prompt);
    if (result) {
      const body = document.getElementById('work-story-body');
      if (body) {
        const aiP = document.createElement('p');
        aiP.style.cssText = 'margin-top:10px;padding:8px 10px;background:var(--card2);border-radius:8px;font-size:.84rem;line-height:1.9;color:var(--txt2);border-left:3px solid var(--acc)';
        aiP.textContent = '🤖 ' + result;
        body.appendChild(aiP);
      }
      toast('AI续写已添加', 'ok');
    } else { toast('AI返回为空，请检查模型设置', ''); }
  } catch(e) { toast('AI生成失败：'+e.message, 'err'); }
  btn.disabled=false; btn.textContent='🤖 AI生成替代剧情';
}
