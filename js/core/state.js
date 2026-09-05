// ============================================================
// js/core/state.js
// 游戏全局状态 & 通用工具函数
// ============================================================

const State = {
  currentChar:   null,       // 当前调教对象（含运行时属性）
  gameLog:       [],         // 互动记录
  day:           1,          // 当前天数
  money:         10000,      // 持有金币
  inventory:     {},         // 拥有的道具 { itemId: count }
  equippedItems: {},         // 已装备的道具 { charId: [itemId, ...] }
  currentNav:    'home',     // 当前底部标签
  currentCat:    'basic',    // 当前指令分类
  isProcessing:  false,      // 是否正在处理指令
  searchQuery:   '',
  genderFilter:  '',
  charPage:      0,
  achievements:  JSON.parse(localStorage.getItem('era_ach') || '[]'),
  tipIndex:      0,          // 当前小贴士索引
  // ── 助手系统 ──────────────────────────────────────
  assistantMode:     false,  // 当前调教是否为助手模式
  activeAssistantId: null,   // 当前活跃助手的 charId（训练时消耗其体力）
  // ── 剧情多角色占位符 ──────────────────────────────────────────
  storyCharA: null,          // { id, name, gender } — 剧情中奴隶A，供 {A}/{ta_A} 替换
  storyCharB: null,          // { id, name, gender } — 剧情中奴隶B，供 {B}/{ta_B} 替换
};

// ── 工具函数 ──────────────────────────────────────────────
const rand   = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const clamp  = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

// ── 欲望/好感/服从 升级系统（满级10级，每级上限+100，最大1000）──────
// 获取某角色某属性的最大上限（基于等级）
function getStatMax(c, statName) {
  if (!c) return 100;
  if (statName === 'lust' || statName === 'obedience' || statName === 'affection') {
    var lvKey = statName + '_level';
    var lv = Math.max(1, Math.min(10, c[lvKey] || 1));
    return lv * 100;  // 每级100，满级10=1000
  }
  return 100;
}
// 检查并触发升级
function checkStatLevelUp(c, statName) {
  if (!c) return false;
  if (statName !== 'lust' && statName !== 'obedience' && statName !== 'affection') return false;
  var lvKey = statName + '_level';
  var curLv = Math.max(1, Math.min(10, c[lvKey] || 1));
  if (curLv >= 10) return false;  // 已满级
  var curMax = curLv * 100;
  if (c[statName] >= curMax) {
    c[lvKey] = curLv + 1;
    c[statName] = curMax;  // 保持在旧上限，等待下次积累
    return true;  // 返回true表示升级了
  }
  return false;
}
// 包含升级检测的stat设置
function clampStat(c, statName, val) {
  var max = getStatMax(c, statName);
  return Math.max(0, Math.min(max, val));
}

// 动态体力/精力上限：基于性别、职业、训练次数逐步提升
function getMaxStamina(c) {
  if (!c) return 1500;
  var base = 1500;
  if (c.gender === '男') base += 100;
  else if (c.gender === '女') base += 50;
  var cls = c.class || '';
  if (['战士','骑士','猎人','佣兵','不良'].indexOf(cls) >= 0) base += 200;
  else if (['舞者','冒险家'].indexOf(cls) >= 0) base += 100;
  var trainBonus = Math.min(1500, (c.total_training_count || 0) * 3);
  return Math.min(3000, base + trainBonus);
}
function getMaxEnergy(c) {
  if (!c) return 1500;
  var base = 1500;
  if (c.gender === '女') base += 80;
  else if (c.gender === '男') base += 50;
  var cls = c.class || '';
  if (['法师','圣职者','占卜师','梦行者'].indexOf(cls) >= 0) base += 150;
  else if (['艺术家','医生'].indexOf(cls) >= 0) base += 80;
  var trainBonus = Math.min(1500, (c.total_training_count || 0) * 2);
  return Math.min(3000, base + trainBonus);
}
const pick   = arr => arr[Math.floor(Math.random() * arr.length)];
const esc    = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// 角色头像 emoji
function cEmoji(c) {
  const r = c.race || '';
  if (r.includes('兽'))  return '🐾';
  if (r.includes('龙'))  return '🐉';
  if (r.includes('天使') || r.includes('神')) return '👼';
  if (r.includes('魔'))  return '😈';
  if (r.includes('精灵')) return '🧝';
  if (c.gender === '男') return '🧑';
  return '👩';
}

// Toast 通知
function toast(msg, type = '') {
  const c = document.getElementById('toast');
  if (!c) return;
  const el = document.createElement('div');
  el.className = 't' + (type ? ' ' + type : '');
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// 格式化金额
function fmtMoney(n) {
  return '$' + n.toLocaleString();
}

// 获取道具数量（通常道具返回0/1，消耗品返回实际数量）
function getItemCount(id) {
  return State.inventory[id] || 0;
}

// 检查是否拥有道具
function hasItem(id) {
  return (State.inventory[id] || 0) > 0;
}

// 加载存档
function loadSave(charId) {
  try {
    const raw = localStorage.getItem('era_sv_' + charId);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

// ── 存档开关：true = 禁止自动存档，只允许手动存档 ────────────
var _ERA_AUTOSAVE_DISABLED = false; // ★ 修复：重新启用自动存档

// 内部实际写入函数（私有，不对外暴露）
function _writeSaveInternal(saveName) {
  if (!State.currentChar) return false;
  try {
    var existingSave = loadSave(State.currentChar.id);
    var profile = (existingSave && existingSave.charProfile) || State._charProfile || {};
    var saveObj = {
      char:         State.currentChar,
      log:          State.gameLog.slice(-15),
      day:          State.day,
      money:        State.money,
      inventory:    State.inventory,
      equippedItems:State.equippedItems,
      charProfile:  profile,
      saveName:     saveName || '手动存档',
      saveTime:     Date.now(),
    };
    localStorage.setItem('era_sv_' + State.currentChar.id, JSON.stringify(saveObj));
    return true;
  } catch (e) { return false; }
}

// writeSave() — 已被重定向为"静默跳过"，防止任何模块自动覆盖存档
// 如需强制写入（仅限手动存档按钮），请调用 manualWriteSave()
function writeSave() {
  if (_ERA_AUTOSAVE_DISABLED) {
    // 自动存档已全局禁用，静默跳过
    return true; // 返回true避免调用方报错
  }
  return _writeSaveInternal('存档');
}

// manualWriteSave() — 手动存档专用，绕过禁用开关
function manualWriteSave(saveName) {
  return _writeSaveInternal(saveName || '手动存档');
}

// 写入手动命名存档
function writeNamedSave(name) {
  if (!State.currentChar) return false;
  try {
    // ★ 修复：快照所有已购角色存档，读取时可完整还原奴隶列表
    var _allCharSaves = {};
    for (var _i = 0; _i < localStorage.length; _i++) {
      var _k = localStorage.key(_i);
      if (_k && _k.startsWith('era_sv_')) {
        try { _allCharSaves[_k] = JSON.parse(localStorage.getItem(_k)); } catch(e) {}
      }
    }
    var _relSnap = {};
    try { _relSnap = JSON.parse(localStorage.getItem('era_relationships') || '{}'); } catch(e) {}

    var key = 'era_msv_' + Date.now();
    localStorage.setItem(key, JSON.stringify({
      char:          State.currentChar,
      log:           State.gameLog.slice(-15),
      day:           State.day,
      money:         State.money,
      inventory:     State.inventory,
      equippedItems: State.equippedItems,
      saveName:      name || ('手动存档 - ' + (State.currentChar.name || '')),
      saveTime:      Date.now(),
      isManual:      true,
      // ★ 完整快照：所有奴隶存档 + 奴隶间关系
      allCharSaves:  _allCharSaves,
      relationships: _relSnap,
    }));
    return true;
  } catch (e) { return false; }
}

// ── 全局背包持久化（与角色存档解耦，防止切角色丢道具）──────────
function saveGlobalInventory() {
  try { localStorage.setItem('era_global_inv', JSON.stringify(State.inventory || {})); } catch(e) {}
}
function loadGlobalInventory() {
  try {
    var r = localStorage.getItem('era_global_inv');
    return r ? JSON.parse(r) : null;
  } catch(e) { return null; }
}

// 小贴士轮播
function nextTip() {
  if (!TIPS || !TIPS.length) return;
  State.tipIndex = (State.tipIndex + 1) % TIPS.length;
  const el = document.getElementById('tip-text');
  if (el) el.textContent = TIPS[State.tipIndex];
}

// 每隔8秒换一条贴士
setInterval(nextTip, 8000);

// ★ 修复：天数独立持久化（防止刷新丢失进度）
// 天数保存在独立的 era_day key，不依赖角色存档
function _saveDay() {
  try { localStorage.setItem('era_day', String(State.day || 1)); } catch(e) {}
}
function _loadDay() {
  try {
    var d = parseInt(localStorage.getItem('era_day') || '1', 10);
    return isNaN(d) ? 1 : Math.max(1, d);
  } catch(e) { return 1; }
}
// 代理 State.day 的赋值——每次改变都自动持久化
// （通过包装 consumeTime 和 doRest 调用点实现，不用 Proxy 避免兼容问题）
