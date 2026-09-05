// ============================================================
// js/core/story.js
// 剧情弹窗系统
// - openStoryModal(story, actionName, changes) → 训练指令触发
// - openDailyEvent(eventId)                   → [107] 观看日常事件
// ============================================================

const _SM = {
  pages:      [],
  pageIdx:    0,
  effects:    {},
  action:     '',
  title:      '',
  choices:    [],    // ★ 选择分支列表 [{text,story,effects}]
  choiceDone: false, // ★ 是否已完成选择
};

// ── ★ 剧情队列：防止情感事件弹窗覆盖调教剧情 ──────────────
var _storyQueue = [];
// 标记当前剧情是否来自调教流程（isProcessing=true），供后续finishStory判断
var _smIsTraining = false;

// ── 工具：把 story 数组按阅读模式分页 ───────────────────
// ★ 修复：按实际渲染高度分页，长段落不会被截断到下一页
function _estimateParaHeight(text) {
  // 估算单段落渲染高度（px）
  // 容器宽约 440px，字体 ~13.6px，每字符约 13.6px（中文全角）
  // 每行约 32 个中文字符（含标点），行高 1.8 ≈ 24px，段落 margin-bottom ~10px
  var charsPerLine = 30; // 保守估计，兼顾长英文单词折行
  var lineH = 26;        // px per line (font-size*1.8 + slight margin)
  var paraMargin = 10;   // paragraph bottom margin
  var len = String(text || '').length;
  var lines = Math.max(1, Math.ceil(len / charsPerLine));
  return lines * lineH + paraMargin;
}

function _splitPages(storyArr, noSplit) {
  if (noSplit) return [storyArr];
  var mode = typeof _getReadMode === 'function' ? _getReadMode() : 'scroll';
  // 滚动模式：全部内容放入一页，通过滚动查看，不分页
  if (mode === 'scroll') {
    if (!storyArr.length) return [['（暂无内容）']];
    return [storyArr];
  }
  // ★ 混合模式：固定每页5段，与原始翻页体验一致
  if (mode === 'both') {
    var BOTH_PER_PAGE = 5;
    var pages = [];
    for (var j = 0; j < storyArr.length; j += BOTH_PER_PAGE) {
      pages.push(storyArr.slice(j, j + BOTH_PER_PAGE));
    }
    if (!pages.length) pages.push(['（暂无内容）']);
    return pages;
  }
  // ★ 翻页模式：按估算高度动态分页，确保每段完整显示在同一页
  var pageH = Math.floor(window.innerHeight * 0.44); // 留余量防末行截断
  var pages = [];
  var curPage = [];
  var curH = 0;
  for (var i = 0; i < storyArr.length; i++) {
    var paraH = _estimateParaHeight(storyArr[i]);
    if (curH + paraH > pageH && curPage.length > 0) {
      pages.push(curPage);
      curPage = [];
      curH = 0;
    }
    curPage.push(storyArr[i]);
    curH += paraH;
  }
  if (curPage.length) pages.push(curPage);
  if (!pages.length) pages.push(['（暂无内容）']);
  return pages;
}

// ── 从训练指令触发剧情弹窗 ───────────────────────────────
// ★ 公共入口：若弹窗已打开则排队，否则立即展示
function openStoryModal(story, actionName, changes) {
  if (!story) return;
  var ovEl = document.getElementById('ov-story');
  // 弹窗正在展示中：排队，等当前剧情结束后自动播放
  if (ovEl && ovEl.classList.contains('on')) {
    _storyQueue.push({ story: story, actionName: actionName, changes: changes });
    return;
  }
  _openStoryNow(story, actionName, changes);
}

// ★ 实际执行打开弹窗的内部函数
function _openStoryNow(story, actionName, changes) {
  if (!story) return;

  var storyArr = Array.isArray(story.story)
    ? story.story
    : [String(story.story || '（暂无剧情）')];

  // ★ 统一应用人称占位符替换（{slave},{master},{ta},{tade},{masterD}）
  if (typeof applyStoryPlaceholders === 'function') {
    storyArr = storyArr.map(function(p){ return applyStoryPlaceholders(p); });
  }

  _SM.pages   = _splitPages(storyArr, story.noSplit);
  _SM.pageIdx = 0;
  _SM.effects = changes || {};
  _SM.action  = actionName || '剧情';
  _SM.title   = story.title || actionName || '剧情';
  _SM.story   = story;  // ★ 保存story对象以便读取经验变化
  // ★ 记录本次剧情是否属于调教流程
  _SM.choices    = story.choices || [];  // ★ 读取选择分支
  _SM.choiceDone = false;
  _smIsTraining = !!State.isProcessing;

  requestAnimationFrame(() => {
    try{
      _renderStoryModal();
      // ★ 修复Bug：点击遮罩关闭时必须走finishStory而非普通closeOv
      // 先移除旧handler再重新绑定，避免重复注册
      var ovEl = document.getElementById('ov-story');
      if (ovEl) {
        if (ovEl._ovHandler) { ovEl.removeEventListener('click', ovEl._ovHandler); ovEl._ovHandler = null; }
        ovEl._ovHandler = function(e) { if (e.target === ovEl) finishStory(); };
        ovEl.addEventListener('click', ovEl._ovHandler);
      }
      openOv('ov-story');
    }catch(e){
      console.error(e);
    }
  });
}

// ── 从 [107] 观看日常事件触发 ────────────────────────────
function openDailyEvent(eventId) {
  const ev = DAILY_EVENTS.find(e => e.id === eventId);
  if (!ev) { toast('事件不存在', 'err'); return; }

  var stArr = ev.story || [];
  if (typeof applyStoryPlaceholders === 'function') {
    stArr = stArr.map(function(p){ return applyStoryPlaceholders(p); });
  }
  _SM.pages   = _splitPages(stArr);
  _SM.pageIdx = 0;
  _SM.effects = {};   // 日常事件不改变属性
  _SM.action  = '日常事件';
  _SM.title   = ev.title;

  _renderStoryModal();
  openOv('ov-story');
}

// ── 渲染弹窗内容 ─────────────────────────────────────────
function _renderStoryModal() {
  const ttl    = document.getElementById('story-title');
  const tag    = document.getElementById('story-tag');
  const body   = document.getElementById('story-body');
  const dots   = document.getElementById('story-dots');
  const effBox = document.getElementById('story-eff');
  const prevB  = document.getElementById('story-prev');
  const nextB  = document.getElementById('story-next');
  const finB   = document.getElementById('story-fin');

  if (ttl) ttl.textContent = _SM.title;
  if (tag) {
    var _dateSub = document.getElementById('story-date-sub');
    if (_SM.story && _SM.story.dateSub) {
      tag.parentElement.style.display = 'none';
      if (_dateSub) { _dateSub.textContent = _SM.story.dateSub; _dateSub.style.display = ''; }
    } else {
      tag.parentElement.style.display = '';
      tag.textContent = _SM.action + ' · 剧情';
      if (_dateSub) _dateSub.style.display = 'none';
    }
  }

  // ── 正文 ──
  const page = _SM.pages[_SM.pageIdx] || [];
  const _mode = typeof _getReadMode === 'function' ? _getReadMode() : 'scroll';
  const _isFlip = (_mode === 'flip' || _mode === 'both');
  // 提前计算 isLast，供 body 渲染时判断是否内嵌属性结算
  const isLast = _SM.pageIdx === _SM.pages.length - 1;
  const _isScrollMode = (_mode === 'scroll');

  if (body) {
    // ★ 布局由 CSS flex 决定，不再用 JS 动态设置 maxHeight
    // 翻页模式非末页隐藏滚动条（防意外滚动）；末页和滚动模式均允许滚动
    body.style.overflowY = (_isFlip && !isLast) ? 'hidden' : 'auto';
    var _paraHtml = page.map(p => {
      p = String(p ?? '');
      // HTML块直接渲染
      if (p.includes('<div') || p.includes('<span') || p.includes('<button')) {
        return '<div class="story-html-block">' + p + '</div>';
      }
// ★ 行内高亮：「」和""只高亮引号内+引号本身，旁白文字不变色
      const _esc = esc(p);
      let _hi = _esc;
      // 「…」→ 高亮（含引号）
      _hi = _hi.replace(/「([^」]*)」/g, '<span class="story-quote-inline">「$1」</span>');
      // "…"→ 高亮（含引号）
      _hi = _hi.replace(/\u201c([^\u201d]*)\u201d/g, '<span class="story-quote-inline">\u201c$1\u201d</span>');
      if (_hi !== _esc) return `<p class="story-narr">${_hi}</p>`;
      // 名字说话者（Star：……）
      const sm = p.match(/^([\u4e00-\u9fa5A-Za-z\u00b7]{1,10})[\uff1a:](.+)$/);
      if (sm) return `<p class="story-narr"><span class="story-speaker">${esc(sm[1])}</span>「${esc(sm[2].trim())}」</p>`;
      // ★ 旁白叙事 → 正常颜色，不变色
      return `<p class="story-narr">${esc(p)}</p>`;
    }).join('');
    // ★ 所有模式末页将属性结算内嵌在正文末尾（滚动模式=单页=永远是末页）
    if (isLast) {
      var _inlineEffHtml = _buildEffHtml();
      if (_inlineEffHtml) {
        _paraHtml += '<div class="story-eff-block">' + _inlineEffHtml + '</div>';
      }
    }
    body.innerHTML = _paraHtml;

    // ★ 选择分支：末页有选项时渲染选项按钮
    if (isLast && _SM.choices.length > 0 && !_SM.choiceDone) {
      var _choiceWrap = document.createElement('div');
      _choiceWrap.style.cssText = 'margin-top:16px;display:grid;gap:8px';
      _SM.choices.forEach(function(ch, ci) {
        var _ct = typeof applyStoryPlaceholders === 'function'
          ? applyStoryPlaceholders(ch.text || '') : (ch.text || '');
        var _btn = document.createElement('button');
        _btn.setAttribute('onclick', 'pickStoryChoice(' + ci + ')');
        _btn.style.cssText = 'background:var(--card2);border:1px solid var(--bdr2);'
          + 'border-radius:10px;padding:12px 14px;text-align:left;font-size:.82rem;'
          + 'color:var(--txt);cursor:pointer;line-height:1.6;width:100%';
        _btn.textContent = _ct;
        _choiceWrap.appendChild(_btn);
      });
      body.appendChild(_choiceWrap);
    }
  }

  // ── 页码信息 & 自动回顶 ──
  const pageInfo = document.getElementById('story-page-info');
  const _isSinglePage = _SM.pages.length <= 1;
  if (pageInfo) {
    pageInfo.textContent = (!_isSinglePage) ? ((_SM.pageIdx + 1) + ' / ' + _SM.pages.length) : '';
  }
  if (body) {
    body.scrollTop = 0; // ★ 修复：每次翻页都滚动到顶部，确保从头阅读
  }

  // ── 分页指示点（单页模式隐藏）──
  if (dots) {
    if (_isSinglePage) {
      dots.innerHTML = '';
    } else {
      dots.innerHTML = _SM.pages.map((_, i) =>
        `<span class="story-dot ${i === _SM.pageIdx ? 'on' : ''}"
               onclick="storyGoto(${i})"></span>`).join('');
    }
  }

  // ── 属性结算已内嵌在 story-body 末尾，外部 effBox 始终隐藏 ──

  function _buildEffHtml() {
    if (!Object.keys(_SM.effects).length) return '';
    const rows = [
      { k: 'lust',      label: '欲望', icon: '🔥' },
      { k: 'obedience', label: '服从', icon: '👁'  },
      { k: 'affection', label: '好感', icon: '❤'  },
      { k: 'stamina',   label: '体力', icon: '💪' },
      { k: 'energy',    label: '精力', icon: '⚡' },
    ];
    var posItems = rows.filter(r => _SM.effects[r.k] > 0).map(r => {
      var v = Math.round(_SM.effects[r.k]);
      return '<span class="eff-item eff-pos">' + r.icon + r.label + ' +' + v + '</span>';
    }).join('  ');
    var negItems = rows.filter(r => _SM.effects[r.k] < 0).map(r => {
      var v = Math.round(_SM.effects[r.k]);
      return '<span class="eff-item eff-neg">' + r.icon + r.label + ' ' + v + '</span>';
    }).join('  ');
    var html = '';
    if (posItems || negItems) {
      html += '<div style="font-size:.62rem;color:var(--muted);margin-bottom:2px">📋 奴隶属性变化</div>';
      if (posItems) html += '<div class="eff-row eff-row-pos">' + posItems + '</div>';
      if (negItems) html += '<div class="eff-row eff-row-neg">' + negItems + '</div>';
    }
    var slaveExpHtml = '';
    if (_SM.story && _SM.story._slaveExpChanges) {
      var se = _SM.story._slaveExpChanges;
      for (var sk in se) {
        if (se[sk]) {
          var cnLabel = (typeof _expKeyToCn === 'function') ? _expKeyToCn(sk) : sk;
          slaveExpHtml += '<span class="eff-item eff-exp">✨' + cnLabel + ' +' + se[sk] + '</span>';
        }
      }
    }
    if (slaveExpHtml) html += '<div class="eff-row eff-row-exp" style="margin-top:3px"><span style="font-size:.62rem;color:var(--muted);margin-right:4px">奴隶经验：</span>' + slaveExpHtml + '</div>';
    var playerExpHtml = '';
    if (_SM.story && _SM.story._playerExpChanges) {
      var pe = _SM.story._playerExpChanges;
      for (var pk in pe) {
        if (pe[pk]) {
          var cnLabel2 = (typeof _expKeyToCn === 'function') ? _expKeyToCn(pk) : pk;
          playerExpHtml += '<span class="eff-item eff-exp">✨' + cnLabel2 + ' +' + pe[pk] + '</span>';
        }
      }
    }
    if (playerExpHtml) html += '<div class="eff-row eff-row-exp" style="border-top:1px dashed var(--bdr2);padding-top:3px;margin-top:3px"><span style="font-size:.62rem;color:var(--muted);margin-right:4px">玩家经验：</span>' + playerExpHtml + '</div>';
    return html;
  }

  if (effBox) {
    effBox.style.display = 'none';
    if (body && body._effScrollHandler) {
      body.removeEventListener('scroll', body._effScrollHandler);
      body._effScrollHandler = null;
    }
  }

  // ── 导航按钮 ──
  if (prevB) prevB.style.display = _SM.pageIdx > 0 ? '' : 'none';
  if (nextB) nextB.style.display = !isLast            ? '' : 'none';
  // ★ 有待选分支时隐藏完成按钮；选完后显示
  var _hasOpenChoice = isLast && _SM.choices.length > 0 && !_SM.choiceDone;
  if (finB)  finB.style.display  = (isLast && !_hasOpenChoice) ? '' : 'none';
}

// ── 翻页 ─────────────────────────────────────────────────
function storyGoto(idx) {
  _SM.pageIdx = idx;
  _renderStoryModal();
}
function storyNext() {
  if (_SM.pageIdx < _SM.pages.length - 1) { _SM.pageIdx++; _renderStoryModal(); }
}
function storyPrev() {
  if (_SM.pageIdx > 0) { _SM.pageIdx--; _renderStoryModal(); }
}

// ★ 选择分支：玩家选择后的处理
function pickStoryChoice(idx) {
  var choice = _SM.choices[idx];
  if (!choice) return;
  _SM.choiceDone = true;

  // 合并效果到 _SM.effects 并立即应用到角色
  if (choice.effects) {
    var _c = State.currentChar;
    var _statKeys = { lust:1, obedience:1, affection:1, stamina:1, energy:1 };
    for (var _ek in choice.effects) {
      _SM.effects[_ek] = (_SM.effects[_ek] || 0) + choice.effects[_ek];
      if (_c && _statKeys[_ek]) {
        _c[_ek] = typeof clampStat === 'function'
          ? clampStat(_c, _ek, (_c[_ek] || 0) + choice.effects[_ek])
          : Math.max(0, Math.min(100, (_c[_ek] || 0) + choice.effects[_ek]));
      }
    }
  }

  // 若选项有独立后续剧情，替换当前页内容
  if (choice.story && choice.story.length > 0) {
    var _ns = choice.story;
    if (typeof applyStoryPlaceholders === 'function') {
      _ns = _ns.map(function(p) { return applyStoryPlaceholders(p); });
    }
    _SM.pages    = _splitPages(_ns);
    _SM.pageIdx  = 0;
    _SM.choices  = []; // 结果页不再显示选项
  }

  _renderStoryModal();
}

// ── 完成剧情 → 检查队列 → 获取 AI 台词 ─────────────────────
async function finishStory() {
  closeOv('ov-story');

  // ★ 若队列中还有等待的剧情，先播放队列里的剧情，
  //    本次调教的后续逻辑（AI台词、isProcessing还原）延迟到最后一个剧情结束后执行。
  //    用 _smIsTraining 记住本次剧情是否属于调教流程。
  if (_storyQueue.length > 0) {
    var _wasTraining = _smIsTraining; // 记住本轮是否是调教剧情
    var next = _storyQueue.shift();
    // 如果排队的是情感事件等非调教剧情（isProcessing 可能已是false），
    // 直接打开；打开完成后，后续 finishStory 会再次被调用。
    // 为了让调教后续逻辑只在最后一个剧情结束后执行，
    // 把 isProcessing 状态 "借存" 到 _smIsTraining 里传递下去。
    setTimeout(function() {
      // 临时恢复 isProcessing 以便 _openStoryNow 正确记录 _smIsTraining
      if (_wasTraining) State.isProcessing = true;
      _openStoryNow(next.story, next.actionName, next.changes);
      // 如果本轮是调教剧情，恢复 isProcessing=true（_openStoryNow 打开后UI仍显示处理中）
      // 下次 finishStory 被调用时会检测 _smIsTraining 再做还原
    }, 250);
    return; // 暂不执行后续逻辑，等队列排空
  }

  // ★ 队列已空。判断本次是否为调教流程剧情
  var wasTrainingFlow = _smIsTraining;
  _smIsTraining = false;

  // 如果是日常事件/情感事件（非调教流程），仅恢复按钮即可
  if (!wasTrainingFlow && !State.isProcessing) {
    if (typeof renderActs === 'function') renderActs();
    // ★ 关系升级弹窗：故事结束后延迟弹出
    if (window._pendingRelUpgrade) {
      var _popData = window._pendingRelUpgrade;
      window._pendingRelUpgrade = null;
      setTimeout(function() { showRelUpgradePopup(_popData); }, 350);
    }
    return;
  }

  // ── 调教流程后续：AI台词、日志、统计 ─────────────────────
  let dialogue = '';
  if (window.API_STATE?.key) {
    const thinkEl = document.getElementById('ai-think');
    if (thinkEl) thinkEl.style.display = 'flex';
    try { dialogue = await callAI(State.currentChar, _SM.action); } catch (e) {}
    if (thinkEl) thinkEl.style.display = 'none';
  }
  if (!dialogue) {
    dialogue = getLocalDialogue(
      State.currentCat,
      State.currentChar.affection,
      State.currentChar.obedience
    );
  }
  addLog(dialogue, 'act', { actionName: _SM.action, changes: _SM.effects });
  State.isProcessing = false;
  renderActs();
  // ★ 自动存档已禁用
  // ── 实时标签检测 ──
  if (State.currentChar && typeof _updateSlaveTags === 'function') {
    _updateSlaveTags(State.currentChar, State.currentChar.id);
  }
  // ── 初次性交经验追踪 ──
  if (typeof _trackFirstSexExp === 'function') _trackFirstSexExp(_SM.action, 'training');
  // ── 逆推触发检测 ──
  setTimeout(function() {
    if (typeof checkReverseTrainingTrigger === 'function' && checkReverseTrainingTrigger()) {
      if (typeof openReverseTrainingModal === 'function') openReverseTrainingModal();
    }
  }, 600);
}

// ── 渲染 [107] 日常事件列表弹窗 ─────────────────────────

function openDailyEventList() {
  const list = document.getElementById('daily-event-list');
  if (!list) return;

  // ── 日常专题（DAILY_EVENTS，欢愉之影等四个分类）──
  const dailyCards = (typeof DAILY_EVENTS !== 'undefined' ? DAILY_EVENTS : []).map(ev => `
    <div class="daily-ev-card" onclick="openDailyEvent(${ev.id}); closeOv('ov-daily')">
      <div class="dev-title">📖 ${esc(ev.title)}</div>
      <div class="dev-desc">${esc(ev.desc)}</div>
    </div>`).join('');

  // ── 日常活动（PLAYER_DAILY，清晨的日常等）──
  const playerCards = (typeof PLAYER_DAILY !== 'undefined' ? PLAYER_DAILY : []).map(ev => {
    const cost = [];
    if (ev.energyCost) cost.push('体力 -' + ev.energyCost);
    if (ev.moneyCost)  cost.push('金币 -' + ev.moneyCost);
    if (ev.moneyGain)  cost.push('金币 +' + ev.moneyGain);
    const preview = ev.dailyEventId
      ? '专题日常剧情'
      : (ev.stories && ev.stories[0] ? ev.stories[0][0].slice(0, 28) : '');
    const period = ev.period === 'night' ? '🌙 夜晚' : '☀️ 白天';
    return `
    <div class="daily-ev-card" onclick="triggerPlayerDaily('${ev.id}'); closeOv('ov-daily')">
      <div class="dev-title" style="display:flex;justify-content:space-between">
        <span>📋 ${esc(ev.title)}</span>
        <span style="font-size:.75rem;opacity:.7">${period}</span>
      </div>
      <div class="dev-desc">${preview}…
        <span style="color:var(--muted);font-size:.78em;margin-left:4px">${cost.join(' · ')}</span>
      </div>
    </div>`;
  }).join('');

  const sep = playerCards
    ? '<div style="margin:12px 4px 8px;font-size:.75rem;color:var(--muted);border-top:1px solid var(--line);padding-top:8px">── 日常活动 ──</div>'
    : '';

  list.innerHTML = dailyCards + sep + playerCards;
  openOv('ov-daily');
}

// ── 左右滑动翻页（仅翻页/混合模式生效）──────────────────
(function(){
  var startX, startY, moved;
  function getPanel(){ return document.getElementById('ov-story'); }
  document.addEventListener('touchstart', function(e){
    var p=getPanel(); if(!p||!p.classList.contains('on')) return;
    var t=e.touches[0]; startX=t.clientX; startY=t.clientY; moved=false;
  }, {passive:true});
  document.addEventListener('touchmove', function(e){
    if(startX==null) return;
    var dx=e.touches[0].clientX-startX;
    if(Math.abs(dx)>12) moved=true;
  }, {passive:true});
  document.addEventListener('touchend', function(e){
    if(startX==null||!moved) { startX=null; return; }
    var mode = typeof _getReadMode==='function' ? _getReadMode() : 'scroll';
    if(mode!=='flip'&&mode!=='both') { startX=null; return; }
    var dx=e.changedTouches[0].clientX-startX;
    var dy=e.changedTouches[0].clientY-startY;
    if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>40){
      var p=getPanel(); if(!p||!p.classList.contains('on')){startX=null;return;}
      if(dx<0) { if(typeof storyNext==='function') storyNext(); }
      else { if(typeof storyPrev==='function') storyPrev(); }
    }
    startX=null;
  }, {passive:true});
})();


// ══════════════════════════════════════════════════════════════════
// ★ 关系升级弹窗
// ══════════════════════════════════════════════════════════════════

function showRelUpgradePopup(data) {
  // 注入动画样式（只注入一次）
  if (!document.getElementById('_rel-upgrade-css')) {
    var _s = document.createElement('style');
    _s.id = '_rel-upgrade-css';
    _s.textContent = [
      '@keyframes _ruFadeIn{from{opacity:0;transform:scale(.82) translateY(18px)}to{opacity:1;transform:scale(1) translateY(0)}}',
      '@keyframes _ruHeartFloat{0%{opacity:.9;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-52px) scale(.4)}}',
    ].join('');
    document.head.appendChild(_s);
  }

  var _icons   = {'熟识':'🤝','好友':'😊','恋慕':'💗','亲密无间':'💞'};
  var _icon    = _icons[data.newStage.name] || '✨';
  var _color   = data.newStage.color || '#ff9f43';
  // 从 hex 颜色生成 rgba 用于辉光
  var _glow    = _color.startsWith('#') ? _color + '28' : 'rgba(255,160,100,.15)';
  var _glow2   = _color.startsWith('#') ? _color + '18' : 'rgba(255,100,130,.1)';

  // 背景随机飘浮小图标
  var _floatIcons = ['✨','💫','🌸','✦','·'];
  var _floatHtml  = '';
  for (var _fi = 0; _fi < 7; _fi++) {
    var _fx = 8 + Math.random() * 84;
    var _fy = 5 + Math.random() * 80;
    var _fd = (1.2 + Math.random() * 2.8).toFixed(1);
    var _fs = (.55 + Math.random() * .55).toFixed(2);
    var _fc = _floatIcons[Math.floor(Math.random() * _floatIcons.length)];
    _floatHtml += '<span style="position:absolute;left:' + _fx + '%;top:' + _fy + '%;'
      + 'font-size:' + _fs + 'rem;opacity:.18;pointer-events:none;'
      + 'animation:_ruHeartFloat ' + _fd + 's ease-in infinite;'
      + 'animation-delay:' + (Math.random() * 2).toFixed(1) + 's">' + _fc + '</span>';
  }

  var _overlay = document.createElement('div');
  _overlay.id  = 'ov-rel-upgrade';
  _overlay.setAttribute('onclick', 'closeRelUpgrade()');
  _overlay.style.cssText = [
    'position:fixed;inset:0;z-index:9200',
    'background:rgba(0,0,0,.58)',
    'display:flex;align-items:center;justify-content:center',
    'padding:24px',
    'backdrop-filter:blur(6px)',
    '-webkit-backdrop-filter:blur(6px)',
  ].join(';');

  _overlay.innerHTML = [
    '<div onclick="event.stopPropagation()" style="',
      'position:relative;overflow:hidden;',
      'background:linear-gradient(158deg,var(--card) 0%,var(--card2) 100%);',
      'border-radius:22px;',
      'padding:30px 22px 24px;',
      'max-width:310px;width:100%;',
      'border:1px solid ' + (_color.startsWith('#') ? _color + '44' : 'var(--bdr2)') + ';',
      'box-shadow:0 16px 48px rgba(0,0,0,.32),0 0 0 1px rgba(255,255,255,.04);',
      'text-align:center;',
      'animation:_ruFadeIn .38s cubic-bezier(.34,1.52,.64,1) both;',
    '">',
      // 背景辉光
      '<div style="position:absolute;inset:0;pointer-events:none;',
        'background:radial-gradient(ellipse at 20% 10%,' + _glow + ' 0%,transparent 55%),',
                   'radial-gradient(ellipse at 80% 90%,' + _glow2 + ' 0%,transparent 55%)">',
      '</div>',
      // 飘浮装饰
      _floatHtml,
      // 主图标
      '<div style="position:relative;font-size:2.4rem;margin-bottom:10px;',
        'filter:drop-shadow(0 2px 8px ' + (_color.startsWith('#') ? _color + '88' : 'rgba(0,0,0,.2)') + ')">',
        _icon,
      '</div>',
      // 名字
      '<div style="position:relative;font-size:.76rem;color:var(--muted);',
        'letter-spacing:.1em;margin-bottom:16px">',
        esc(data.nameA) + '<span style="margin:0 6px;opacity:.45">×</span>' + esc(data.nameB),
      '</div>',
      // 阶段升级 pill
      '<div style="position:relative;display:inline-flex;align-items:center;gap:7px;',
        'background:var(--bg,var(--card2));border-radius:100px;',
        'padding:5px 15px;margin-bottom:20px;',
        'border:1px solid var(--bdr2)">',
        '<span style="font-size:.72rem;color:var(--muted)">' + esc(data.oldStage.name) + '</span>',
        '<span style="font-size:.65rem;color:var(--muted)">→</span>',
        '<span style="font-size:.8rem;color:' + _color + ';font-weight:700">' + esc(data.newStage.name) + '</span>',
        '<span style="font-size:.72rem">✨</span>',
      '</div>',
      // 评语
      '<div style="position:relative;font-size:.79rem;color:var(--txt2);',
        'line-height:1.9;text-align:left;padding:0 4px;font-style:italic">',
        esc(data.commentary),
      '</div>',
      // 关闭按钮
      '<button onclick="closeRelUpgrade()" style="',
        'position:relative;margin-top:22px;',
        'background:' + _color + ';',
        'border:none;border-radius:100px;',
        'color:#fff;font-size:.82rem;font-weight:600;letter-spacing:.06em;',
        'padding:10px 42px;cursor:pointer;',
        'box-shadow:0 4px 16px ' + (_color.startsWith('#') ? _color + '55' : 'rgba(0,0,0,.2)') + ';',
      '">知道了</button>',
    '</div>',
  ].join('');

  document.body.appendChild(_overlay);
}

function closeRelUpgrade() {
  var _el = document.getElementById('ov-rel-upgrade');
  if (_el) _el.remove();
}
