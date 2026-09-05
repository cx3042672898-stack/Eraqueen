// ============================================================
// js/story_log_patch.js
// 剧情记录系统补丁
//
// 功能：
//   1. 剧情去重 —— 同一条剧情再次触发时，不新增记录，
//      而是在旁边显示「× N 次」触发次数徽章。
//   2. 全选 & 批量删除 —— 在剧情记录面板顶部添加
//      「全选」按钮，搭配现有的删除确认流程。
//
// 集成方式：
//   此文件挂载到 window.StoryLogPatch，由主程序在初始化
//   剧情记录面板时调用 StoryLogPatch.patchPanel()。
//
//   若主程序使用全局函数 addStoryLog(entry) 写入记录，
//   可用 StoryLogPatch.wrapAddStoryLog() 进行 monkey-patch。
//
// 数据结构约定（与主程序对齐）：
//   每条剧情记录形如：
//   {
//     uid:      string,   // 唯一标识（如 "char10_逆推.成功挣脱"）
//     title:    string,   // 显示标题
//     charName: string,   // 归属奴隶名
//     date:     string,   // 触发日期 "M月D日"
//     count:    number,   // 触发次数（1 表示仅触发过一次）
//   }
// ============================================================

var StoryLogPatch = (function () {

  // ────────────────────────────────────────────────────────
  //  内部工具
  // ────────────────────────────────────────────────────────

  /**
   * 获取剧情记录数组（从主程序的存档或全局变量中读取）
   * 优先级：State.storyLog → window.storyLog → localStorage
   */
  function _getLog() {
    if (typeof State !== 'undefined' && Array.isArray(State.storyLog)) {
      return State.storyLog;
    }
    if (Array.isArray(window.storyLog)) {
      return window.storyLog;
    }
    // 兜底：从 localStorage 读
    try {
      var raw = localStorage.getItem('era_story_log');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  /**
   * 将记录数组写回主程序存档
   */
  function _setLog(arr) {
    if (typeof State !== 'undefined') State.storyLog = arr;
    if ('storyLog' in window) window.storyLog = arr;
    try {
      localStorage.setItem('era_story_log', JSON.stringify(arr));
    } catch (e) {}
    // 如果主程序有存档函数，调用一下
    if (typeof saveGame === 'function') saveGame();
  }

  /**
   * 刷新 UI（调用主程序的 renderStoryLog 或自己重绘）
   */
  function _refreshUI() {
    if (typeof renderStoryLog === 'function') {
      renderStoryLog();
    } else if (typeof refreshManorPanel === 'function') {
      refreshManorPanel();
    } else {
      patchPanel(); // 重新打补丁
    }
  }

  // ────────────────────────────────────────────────────────
  //  1. 剧情去重写入
  // ────────────────────────────────────────────────────────

  /**
   * 向剧情记录中添加一条，若 uid 已存在则只递增 count 和更新日期。
   * 替换主程序的 addStoryLog 函数后，所有记录写入均自动去重。
   *
   * @param {Object} entry  同上方 "数据结构约定"
   */
  function addStoryLogDedup(entry) {
    if (!entry || !entry.uid) return;

    var log = _getLog();

    // 查找同 uid 的记录
    var existing = null;
    for (var i = 0; i < log.length; i++) {
      if (log[i].uid === entry.uid) { existing = log[i]; break; }
    }

    if (existing) {
      // 已存在：只更新 count 和 date（最新触发时间）
      existing.count = (existing.count || 1) + 1;
      existing.date  = entry.date || existing.date;
    } else {
      // 新记录：count 初始化为 1
      var newEntry = Object.assign({}, entry, { count: 1 });
      log.unshift(newEntry); // 最新的放最前
    }

    _setLog(log);
  }

  /**
   * Monkey-patch 主程序的 addStoryLog 全局函数（如果存在）
   * 调用时机：DOMContentLoaded 或庄园页初始化后
   */
  function wrapAddStoryLog() {
    if (typeof window.addStoryLog === 'function') {
      var _original = window.addStoryLog;
      window.addStoryLog = function (entry) {
        // 走去重逻辑
        addStoryLogDedup(entry);
        // 若还需原始逻辑处理其他副作用，可选择性调用：
        // _original.call(this, entry);
      };
    }
  }

  // ────────────────────────────────────────────────────────
  //  2. 面板补丁（全选 + 批量删除 + 次数徽章）
  // ────────────────────────────────────────────────────────

  /**
   * 对当前页面上的剧情记录面板进行 DOM 补丁。
   * 每次面板刷新后都应重新调用。
   */
  function patchPanel() {
    _injectStyles();
    _patchSelectAll();
    _patchCountBadges();
  }

  /**
   * 在剧情记录面板顶部添加「全选」按钮。
   * 检测面板容器：优先 #story-log-panel，回退 .story-log-panel。
   */
  function _patchSelectAll() {
    // 找到面板容器
    var panel = document.getElementById('story-log-panel') ||
                document.querySelector('.story-log-panel');
    if (!panel) return;

    // 避免重复添加
    if (panel.querySelector('.slp-select-all-bar')) return;

    // 找到所有的 checkbox（勾选项）
    var checkboxes = panel.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length === 0) return;

    // 创建工具栏
    var bar = document.createElement('div');
    bar.className = 'slp-select-all-bar';

    var selectAllBtn = document.createElement('button');
    selectAllBtn.className = 'slp-btn slp-btn-select-all';
    selectAllBtn.textContent = '☑ 全选';

    var deselectBtn = document.createElement('button');
    deselectBtn.className = 'slp-btn slp-btn-deselect';
    deselectBtn.textContent = '☐ 取消全选';

    var deleteSelectedBtn = document.createElement('button');
    deleteSelectedBtn.className = 'slp-btn slp-btn-delete-selected';
    deleteSelectedBtn.textContent = '🗑 删除选中';

    bar.appendChild(selectAllBtn);
    bar.appendChild(deselectBtn);
    bar.appendChild(deleteSelectedBtn);

    // 插入到面板最顶部
    panel.insertBefore(bar, panel.firstChild);

    // 绑定事件：全选
    selectAllBtn.addEventListener('click', function () {
      panel.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
        cb.checked = true;
      });
    });

    // 绑定事件：取消全选
    deselectBtn.addEventListener('click', function () {
      panel.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
        cb.checked = false;
      });
    });

    // 绑定事件：删除选中
    deleteSelectedBtn.addEventListener('click', function () {
      var checked = panel.querySelectorAll('input[type="checkbox"]:checked');
      if (checked.length === 0) {
        alert('请先勾选要删除的剧情记录。');
        return;
      }
      var confirmMsg = '确定要删除选中的 ' + checked.length + ' 条记录吗？此操作不可撤销。';
      if (!confirm(confirmMsg)) return;

      // 收集要删除的 uid 或 index
      var toDelete = [];
      checked.forEach(function (cb) {
        var uid = cb.getAttribute('data-uid') || cb.value;
        if (uid) toDelete.push(uid);
      });

      if (toDelete.length > 0) {
        // 方案一：通过 uid 删除
        _deleteByUids(toDelete);
      } else {
        // 方案二：通过 DOM 父元素删除（uid 不可用时）
        checked.forEach(function (cb) {
          var item = cb.closest('.story-log-item, li, .log-entry');
          if (item) item.parentNode.removeChild(item);
        });
      }
    });
  }

  /**
   * 删除指定 uid 的剧情记录，并刷新 UI
   */
  function _deleteByUids(uids) {
    var log = _getLog();
    log = log.filter(function (entry) {
      return uids.indexOf(entry.uid) === -1;
    });
    _setLog(log);
    _refreshUI();
  }

  /**
   * 为每条剧情记录添加触发次数徽章（count > 1 时显示）
   */
  function _patchCountBadges() {
    var panel = document.getElementById('story-log-panel') ||
                document.querySelector('.story-log-panel');
    if (!panel) return;

    var log = _getLog();
    if (log.length === 0) return;

    // 为每个 .story-log-item 或 [data-uid] 添加次数徽章
    var items = panel.querySelectorAll('[data-uid]');
    items.forEach(function (item) {
      var uid = item.getAttribute('data-uid');
      if (!uid) return;

      // 找到对应记录
      var entry = null;
      for (var i = 0; i < log.length; i++) {
        if (log[i].uid === uid) { entry = log[i]; break; }
      }
      if (!entry || !entry.count || entry.count <= 1) return;

      // 避免重复添加
      if (item.querySelector('.slp-count-badge')) return;

      var badge = document.createElement('span');
      badge.className = 'slp-count-badge';
      badge.textContent = '×' + entry.count;
      badge.title = '该剧情已触发 ' + entry.count + ' 次';

      item.appendChild(badge);
    });
  }

  // ────────────────────────────────────────────────────────
  //  样式注入
  // ────────────────────────────────────────────────────────
  var _stylesInjected = false;

  function _injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;

    var style = document.createElement('style');
    style.id  = 'slp-styles';
    style.textContent = [

      /* 工具栏 */
      '.slp-select-all-bar {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  padding: 8px 12px;',
      '  background: #fdf5e8;',
      '  border-bottom: 1px solid #eed9a8;',
      '  margin-bottom: 6px;',
      '}',

      /* 工具栏按钮 */
      '.slp-btn {',
      '  padding: 4px 14px;',
      '  border: 1px solid #d4a870;',
      '  border-radius: 14px;',
      '  background: #fff8f0;',
      '  color: #7a5030;',
      '  font-size: 13px;',
      '  cursor: pointer;',
      '  transition: background 0.15s;',
      '}',
      '.slp-btn:hover { background: #ffe8c8; }',

      '.slp-btn-delete-selected {',
      '  border-color: #d07050;',
      '  color: #c04030;',
      '  background: #fff5f3;',
      '}',
      '.slp-btn-delete-selected:hover { background: #ffe0d8; }',

      /* 次数徽章 */
      '.slp-count-badge {',
      '  display: inline-block;',
      '  margin-left: 6px;',
      '  padding: 1px 7px;',
      '  background: #e8a050;',
      '  color: #fff;',
      '  border-radius: 10px;',
      '  font-size: 11px;',
      '  font-weight: 600;',
      '  vertical-align: middle;',
      '}',

    ].join('\n');

    document.head.appendChild(style);
  }

  // ────────────────────────────────────────────────────────
  //  对外暴露
  // ────────────────────────────────────────────────────────
  return {
    addStoryLogDedup: addStoryLogDedup,
    wrapAddStoryLog:  wrapAddStoryLog,
    patchPanel:       patchPanel,
  };

})();
