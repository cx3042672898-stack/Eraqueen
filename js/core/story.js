// ============================================================
// js/core/story.js
// 剧情弹窗系统
// - openStoryModal(story, actionName, changes) → 训练指令触发
// - openDailyEvent(eventId)                   → [107] 观看日常事件
// ============================================================

const _SM = {
  pages:   [],
  pageIdx: 0,
  effects: {},
  action:  '',
  title:   '',
};

// ── 工具：把 story 数组每5段切成一页 ────────────────────
function _splitPages(storyArr, noSplit) {
  if (noSplit) return [storyArr]; // ★ 不分页，全部放一页
  const pages = [];
  for (let i = 0; i < storyArr.length; i += 5)
    pages.push(storyArr.slice(i, i + 5));
  if (!pages.length) pages.push(['（暂无内容）']);
  return pages;
}

// ── 从训练指令触发剧情弹窗 ───────────────────────────────
function openStoryModal(story, actionName, changes) {
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

  requestAnimationFrame(() => {
    try{
      _renderStoryModal();
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
  if (tag) tag.textContent = _SM.action + ' · 剧情';

  // ── 正文 ──
  const page = _SM.pages[_SM.pageIdx] || [];
  if (body) {
    body.innerHTML = page.map(p => {
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
  }

  // ── 页码信息 & 自动回顶 ──
  const pageInfo = document.getElementById('story-page-info');
  if (pageInfo && _SM.pages.length > 1) {
    pageInfo.textContent = (_SM.pageIdx + 1) + ' / ' + _SM.pages.length;
  } else if (pageInfo) { pageInfo.textContent = ''; }
  if (body) { body.scrollTop = 0; }

  // ── 分页指示点 ──
  if (dots) {
    dots.innerHTML = _SM.pages.map((_, i) =>
      `<span class="story-dot ${i === _SM.pageIdx ? 'on' : ''}"
             onclick="storyGoto(${i})"></span>`).join('');
  }

  // ── 属性变化（仅末页显示） ──
  const isLast = _SM.pageIdx === _SM.pages.length - 1;
  if (effBox) {
    if (isLast && Object.keys(_SM.effects).length) {
      const rows = [
        { k: 'lust',      label: '欲望', icon: '🔥' },
        { k: 'obedience', label: '服从', icon: '👁'  },
        { k: 'affection', label: '好感', icon: '❤'  },
        { k: 'stamina',   label: '体力', icon: '💪' },
        { k: 'energy',    label: '精力', icon: '⚡' },
      ];
      // ★ 分组：增加行 / 减少行（横排，增加在上减少在下）
      var posItems = rows.filter(r => _SM.effects[r.k] > 0).map(r => {
        var v = Math.round(_SM.effects[r.k]);
        return `<span class="eff-item eff-pos">${r.icon}${r.label} +${v}</span>`;
      }).join('  ');
      var negItems = rows.filter(r => _SM.effects[r.k] < 0).map(r => {
        var v = Math.round(_SM.effects[r.k]);
        return `<span class="eff-item eff-neg">${r.icon}${r.label} ${v}</span>`;
      }).join('  ');
      
      var html = '';
      // 奴隶属性变化（横排，增减分行）
      if (posItems || negItems) {
        html += '<div style="font-size:.62rem;color:var(--muted);margin-bottom:2px">📋 奴隶属性变化</div>';
        if (posItems) html += '<div class="eff-row eff-row-pos">' + posItems + '</div>';
        if (negItems) html += '<div class="eff-row eff-row-neg">' + negItems + '</div>';
      }
      
      // ★ 奴隶经验变化
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
      
      // ★ 玩家经验变化
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
      
      effBox.innerHTML = html;
      effBox.style.display = html ? '' : 'none';
    } else {
      effBox.style.display = 'none';
    }
  }

  // ── 导航按钮 ──
  if (prevB) prevB.style.display = _SM.pageIdx > 0   ? '' : 'none';
  if (nextB) nextB.style.display = !isLast            ? '' : 'none';
  if (finB)  finB.style.display  = isLast             ? '' : 'none';
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

// ── 完成剧情 → 获取 AI 台词 ─────────────────────────────
async function finishStory() {
  closeOv('ov-story');

  // 如果是日常事件（无 isProcessing），直接结束
  if (!State.isProcessing) return;

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
}

// ── 渲染 [107] 日常事件列表弹窗 ─────────────────────────
function openDailyEventList() {
  const list = document.getElementById('daily-event-list');
  if (!list) return;

  list.innerHTML = DAILY_EVENTS.map(ev => `
    <div class="daily-ev-card" onclick="openDailyEvent(${ev.id}); closeOv('ov-daily')">
      <div class="dev-title">${esc(ev.title)}</div>
      <div class="dev-desc">${esc(ev.desc)}</div>
    </div>`).join('');

  openOv('ov-daily');
}

// ── 左右滑动翻页 ─────────────────────────────────────────
(function(){
  var el, startX, startY, moved;
  function getPanel(){ return document.getElementById('ov-story'); }
  document.addEventListener('touchstart', function(e){
    var p=getPanel(); if(!p||!p.classList.contains('on')) return;
    var t=e.touches[0]; startX=t.clientX; startY=t.clientY; moved=false;
  }, {passive:true});
  document.addEventListener('touchmove', function(e){
    if(startX==null) return;
    var dx=e.touches[0].clientX-startX, dy=e.touches[0].clientY-startY;
    if(Math.abs(dx)>12) moved=true;
  }, {passive:true});
  document.addEventListener('touchend', function(e){
    if(startX==null||!moved) { startX=null; return; }
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
