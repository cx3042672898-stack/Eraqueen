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
  currentNav:    'home',     // 当前底部标签
  currentCat:    'basic',    // 当前指令分类
  isProcessing:  false,      // 是否正在处理指令
  searchQuery:   '',
  genderFilter:  '',
  charPage:      0,
  achievements:  JSON.parse(localStorage.getItem('era_ach') || '[]'),
  tipIndex:      0,          // 当前小贴士索引
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

// 写入存档（保留按角色存档+镜像到单个自动存档槽）
function writeSave() {
  if (!State.currentChar) return false;
  try {
    var existingSave = loadSave(State.currentChar.id);
    var profile = (existingSave && existingSave.charProfile) || State._charProfile || {};
    var saveObj = {
      char:      State.currentChar,
      log:       State.gameLog.slice(-15),
      day:       State.day,
      money:     State.money,
      inventory: State.inventory,
      charProfile: profile,
      saveName:  '自动存档',
      saveTime:  Date.now(),
    };
    // 按角色ID存档（庄园、房间等功能依赖此key）
    localStorage.setItem('era_sv_' + State.currentChar.id, JSON.stringify(saveObj));
    // 同时镜像到单个自动存档槽（存档菜单只显示这一个自动档）
    localStorage.setItem('era_auto_save', JSON.stringify(saveObj));
    return true;
  } catch (e) { return false; }
}

// 写入手动命名存档
function writeNamedSave(name) {
  if (!State.currentChar) return false;
  try {
    var key = 'era_msv_' + Date.now();
    localStorage.setItem(key, JSON.stringify({
      char:      State.currentChar,
      log:       State.gameLog.slice(-15),
      day:       State.day,
      money:     State.money,
      inventory: State.inventory,
      saveName:  name || ('手动存档 - ' + (State.currentChar.name || '')),
      saveTime:  Date.now(),
      isManual:  true,
    }));
    return true;
  } catch (e) { return false; }
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
