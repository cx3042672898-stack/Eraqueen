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

  const storyArr = Array.isArray(story.story)
    ? story.story
    : [String(story.story || '（暂无剧情）')];

  _SM.pages   = _splitPages(storyArr, story.noSplit);
  _SM.pageIdx = 0;
  _SM.effects = changes || {};
  _SM.action  = actionName || '剧情';
  _SM.title   = story.title || actionName || '剧情';

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

  _SM.pages   = _splitPages(ev.story || []);
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
      // 引号开头 → 对话格式
      p = String(p ?? '');
      // 如果内容包含 HTML 标签，直接渲染（用于效果结算框等）
      if (p.includes('<div') || p.includes('<span') || p.includes('<button')) {
        return '<div class="story-html-block">' + p + '</div>';
      }
      if (p.startsWith('「') || p.startsWith('“') || p.startsWith('"'))
        return `<p class="story-quote">${esc(p)}</p>`;
      return `<p>${esc(p)}</p>`;
    }).join('');
  }

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
      const html = rows
        .filter(r => _SM.effects[r.k] !== undefined && _SM.effects[r.k] !== 0)
        .map(r => {
          const v   = Math.round(_SM.effects[r.k]);
          const cls = v > 0 ? 'eff-pos' : 'eff-neg';
          return `<span class="eff-item ${cls}">${r.icon}${r.label} ${v > 0 ? '+' : ''}${v}</span>`;
        }).join('');
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
