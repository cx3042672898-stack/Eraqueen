/**
 * ══════════════════════════════════════════════════════════════
 *  EraQueen · 角色文件加载器  char_loader.js
 * ══════════════════════════════════════════════════════════════
 *
 *  工作原理：
 *    每个奴隶有自己独立的 char_[id]_[name].js 文件。
 *    本加载器收集所有已注册的角色，把他们的基础数据合并进
 *    CHARS_DATA（原 chars_trains.js 中的大数组），并提供：
 *      · 调教页面进入时自动注入 API 上下文
 *      · 按阶段获取软化剧情
 *      · 获取特殊事件触发条件
 *
 *  使用方式：
 *    1. 在 index.html 里，在 chars_trains.js 之后、
 *       其余 js 之前，加载本文件和各角色文件：
 *         <script src="js/chars/char_loader.js"></script>
 *         <script src="js/chars/char_21_star.js"></script>
 *         <script src="js/chars/char_1_youming.js"></script>
 *         ...（每个奴隶一行）
 *
 *    2. 角色文件通过 CharRegistry.register(data) 注册自己。
 *    3. 页面加载完后 CharLoader.init() 自动运行，补全 CHARS_DATA。
 * ══════════════════════════════════════════════════════════════
 */

// ── 全局角色注册表 ──────────────────────────────────────────
var CharRegistry = (function () {
  var _chars = {};

  return {
    /**
     * 角色文件调用此方法注册自己
     * @param {Object} data  见 char_template.js 的完整结构
     */
    register: function (data) {
      if (!data || !data.id) {
        console.warn('[CharRegistry] 注册失败：缺少 id', data);
        return;
      }
      _chars[String(data.id)] = data;
    },

    get: function (id) {
      return _chars[String(id)] || null;
    },

    all: function () {
      return _chars;
    }
  };
})();

// ── 主加载器 ───────────────────────────────────────────────
var CharLoader = (function () {

  /** 把角色文件的基础信息合并进 CHARS_DATA */
  function _mergeIntoCharsData() {
    if (typeof CHARS_DATA === 'undefined') return;
    var registry = CharRegistry.all();
    Object.keys(registry).forEach(function (id) {
      var charData = registry[id];
      var base = charData.base;
      if (!base) return;

      // 找到 CHARS_DATA 里对应的条目
      var idx = -1;
      for (var i = 0; i < CHARS_DATA.length; i++) {
        if (String(CHARS_DATA[i].id) === String(id)) { idx = i; break; }
      }
      if (idx === -1) {
        // 不在 CHARS_DATA 里就新增
        CHARS_DATA.push(base);
      } else {
        // 用角色文件的数据覆盖/扩展原条目
        var target = CHARS_DATA[idx];
        Object.keys(base).forEach(function (k) {
          target[k] = base[k];
        });
      }
    });
  }

  return {
    init: function () {
      _mergeIntoCharsData();
      console.log('[CharLoader] 角色文件加载完成，注册数量：',
        Object.keys(CharRegistry.all()).length);
    }
  };
})();

// ── API 上下文构建器 ────────────────────────────────────────
/**
 * 调教页面进入时调用此函数，返回完整的 system prompt
 * @param {number|string} charId   角色 id
 * @param {Object}        saveData 该角色当前的存档（包含 obedience/affection/lust 等）
 * @param {string}        playerName 玩家当前名字
 * @returns {string}  system prompt 字符串，直接传给 API
 */
function buildCharSystemPrompt(charId, saveData, playerName) {
  var reg = CharRegistry.get(charId);
  if (!reg || !reg.apiPrompt) return _defaultSystemPrompt(charId, saveData, playerName);

  var sv = saveData || {};
  var stage = _getStage(sv);
  var ap = reg.apiPrompt;

  // 基础人设块
  var prompt = ap.base || '';

  // 当前阶段覆盖（可选）
  if (ap.stages && ap.stages[stage]) {
    prompt += '\n\n【当前阶段：' + _stageName(stage) + '】\n' + ap.stages[stage];
  }

  // 关系类型附加语境
  if (reg.relation && reg.relation.promptHint) {
    prompt += '\n\n【与主人的关系】\n' + reg.relation.promptHint;
  }

  // 当前状态注入（数值化）
  prompt += '\n\n【当前数值状态（仅供角色参考，不要直接说出数字）】';
  prompt += '\n服从度：' + (sv.obedience || 0) + '/100';
  prompt += '，好感度：' + (sv.affection || 0) + '/100';
  prompt += '，情欲：' + (sv.lust || 0) + '/100';
  prompt += '\n主人名称：' + (playerName || '主人');

  // 行为守则
  if (ap.rules) {
    prompt += '\n\n【行为守则】\n' + ap.rules;
  }

  return prompt;
}

/** 获取当前所处阶段（0~3），基于好感等级 affection_level（1~10）
 *  Lv1       → stage 0 抵抗期
 *  Lv2~4     → stage 1 初步沦陷
 *  Lv5~7     → stage 2 适应期
 *  Lv8~10    → stage 3 融合期
 */
function _getStage(sv) {
  var lv = Math.max(1, Math.min(10, sv.affection_level || 1));
  if (lv <= 1) return 0;  // 抵抗期
  if (lv <= 4) return 1;  // 初步沦陷
  if (lv <= 7) return 2;  // 适应期
  return 3;               // 融合期
}
function _stageName(stage) {
  return ['抵抗期', '初步沦陷', '适应期', '融合期'][stage] || '未知阶段';
}

/** 没有角色文件时的默认 prompt */
function _defaultSystemPrompt(charId, sv, playerName) {
  var c = (typeof CHARS_DATA !== 'undefined')
    ? CHARS_DATA.find(function (x) { return String(x.id) === String(charId); })
    : null;
  if (!c) return '你是一名奴隶，请配合扮演。';
  return [
    '你是「' + c.name + '」，' + c.race + '，' + c.class + '，' + c.age + '岁。',
    '性格：' + c.personality + '。性取向：' + c.sexual_orientation + '。',
    '描述：' + c.description,
    '',
    '你现在是' + (playerName || '主人') + '的奴隶。',
    '服从度 ' + (sv.obedience || 0) + '/100，请根据此数值调整配合程度。',
    '请保持角色，用中文回应，不要跳出角色。'
  ].join('\n');
}

// ── 软化剧情获取 ────────────────────────────────────────────
/**
 * 获取某阶段的软化剧情文本列表（随机取一条）
 * @param {number|string} charId
 * @param {number}        stage   0~3
 * @returns {string|null}
 */
function getCharSoftenStory(charId, stage) {
  var reg = CharRegistry.get(charId);
  if (!reg || !reg.softenStories) return null;
  var arr = reg.softenStories[stage];
  if (!arr || !arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 获取特殊事件（判断当前存档是否满足触发条件）
 * @param {number|string} charId
 * @param {Object}        saveData
 * @returns {Object|null}  满足条件的第一个事件，或 null
 */
function getCharSpecialEvent(charId, saveData) {
  var reg = CharRegistry.get(charId);
  if (!reg || !reg.specialEvents) return null;
  var sv = saveData || {};
  for (var i = 0; i < reg.specialEvents.length; i++) {
    var ev = reg.specialEvents[i];
    if (!ev.triggered && _checkEventCondition(ev.condition, sv)) {
      return ev;
    }
  }
  return null;
}

function _checkEventCondition(cond, sv) {
  if (!cond) return false;
  if (cond.obedience_gte !== undefined && (sv.obedience || 0) < cond.obedience_gte) return false;
  if (cond.affection_gte !== undefined && (sv.affection || 0) < cond.affection_gte) return false;
  if (cond.lust_gte     !== undefined && (sv.lust     || 0) < cond.lust_gte    ) return false;
  if (cond.session_gte  !== undefined && (sv.trainCount || 0) < cond.session_gte) return false;
  return true;
}

// ── 指令专属剧情获取 ────────────────────────────────────────
/**
 * 获取角色对某指令的专属剧情（供 game.js doAction 调用）
 *
 * 查找优先级：
 *   关系专属分支（relation_[type]）> 通用阶段分支（stage0~3）
 *
 * @param {number|string} charId       角色 id
 * @param {string}        commandName  指令名（如 "亲吻"、"抚摸兽耳"）
 * @param {Object}        saveData     当前存档（含 obedience/affection/lust 等）
 * @returns {{ stories: string[], effects?: Object } | null}
 *   stories 是随机抽取池，调用方自行 pick()
 */
/**
 * firstTime 条件检测器
 * condition 格式：{ affection: [min, max], obedience: [min, Infinity], lust: 50 }
 * 数组格式 [min, max] 表示 min <= val < max；Infinity 表示无上限
 * 数字格式表示 val >= 该数字
 */
function _checkFirstTimeCondition(condition, sv) {
  if (!condition) return true; // 无条件 → 始终匹配（用作 default 分支）
  var attrs = {
    affection: sv.affection  || 0,
    obedience: sv.obedience  || 0,
    lust:      sv.lust       || 0,
    stamina:   sv.stamina    || 0,
    trust:     sv.trust      || 0,
    loyalty:   sv.loyalty    || 0,
    love:      sv.love       || 0,
    purity:    sv.purity     || 0,
    depravity: sv.depravity  || 0,
  };
  for (var key in condition) {
    if (!Object.prototype.hasOwnProperty.call(condition, key)) continue;
    var req = condition[key];
    var val = (attrs[key] !== undefined) ? attrs[key] : 0;
    if (Array.isArray(req)) {
      var lo = (req[0] !== undefined && req[0] !== null) ? req[0] : -Infinity;
      var hi = (req[1] !== undefined && req[1] !== null) ? req[1] : Infinity;
      if (val < lo || val >= hi) return false;
    } else if (typeof req === 'number') {
      if (val < req) return false;
    }
  }
  return true;
}


/**
 * 故事条件检测器（用于 stories 内条件分支）
 * condition 支持：
 *   { lust: [80, Infinity] }   数值范围
 *   { stamina: [-Inf, 10] }    低于阈值
 *   { equip: '口塞球' }         装备检测（检查 sv.equips 数组）
 *   { tag: '淫乱' }             标签检测（检查 sv.tags 数组）
 */
function _checkStoryCondition(condition, sv) {
  if (!condition) return true;
  sv = sv || {};
  var numericAttrs = {
    lust:      sv.lust      || 0,
    stamina:   sv.stamina   || 0,
    affection: sv.affection || 0,
    obedience: sv.obedience || 0,
    love:      sv.love      || 0,
  };
  for (var key in condition) {
    if (!Object.prototype.hasOwnProperty.call(condition, key)) continue;
    var req = condition[key];
    if (key === 'equip') {
      // 检查装备：sv.equips 是字符串数组
      var equips = sv.equips || sv.activeEquips || [];
      var equipStr = JSON.stringify(equips);
      if (equipStr.indexOf(req) < 0) return false;
      continue;
    }
    if (key === 'tag') {
      var tags = sv.tags || [];
      if (tags.indexOf(req) < 0) return false;
      continue;
    }
    if (numericAttrs[key] !== undefined) {
      var val = numericAttrs[key];
      if (Array.isArray(req)) {
        var lo = (req[0] !== undefined && req[0] !== null) ? req[0] : -Infinity;
        var hi = (req[1] !== undefined && req[1] !== null) ? req[1] : Infinity;
        if (val < lo || val >= hi) return false;
      } else if (typeof req === 'number') {
        if (val < req) return false;
      }
    }
  }
  return true;
}


function getCharCommandStory(charId, commandName, saveData) {
  var reg = CharRegistry.get(charId);
  if (!reg || !reg.commandStories) return null;

  var cmdEntry = reg.commandStories[commandName];
  if (!cmdEntry) return null;

  var sv    = saveData || {};
  var stage = _getStage(sv);                        // 0~3
  var rel   = (reg.relation && reg.relation.type) || 'stranger';

  // 1. 关系专属分支：relation_friend / relation_family / relation_rival …
  var relKey    = 'relation_' + rel;
  var relBranch = cmdEntry[relKey];
  if (relBranch) {
    var relPool = relBranch['stage' + stage] || relBranch['stage0'];
    if (relPool && relPool.length) {
      return { stories: [pick(relPool)], effects: cmdEntry.effects && cmdEntry.effects[stage] };
    }
  }

  // 2. 通用阶段分支
  var stageKey  = 'stage' + stage;
  var stagePool = cmdEntry[stageKey];
  if (stagePool && stagePool.length) {
    return { stories: [pick(stagePool)], effects: cmdEntry.effects && cmdEntry.effects[stage] };
  }

  // 3. 向下兼容：直接是数组
  if (Array.isArray(cmdEntry)) {
    return { stories: [pick(cmdEntry)] };
  }

  return null;
}

// ── pick helper 已在 state.js 中定义，此处无需重复声明 ──────


// ── 指令剧情获取（被 game.js doAction 第0优先级调用）──────────
/**
 * 获取角色文件里对应指令的剧情
 *
 * 选取逻辑（优先级从高到低）：
 *   1. 当前关系类型（relation.type）专属分支
 *   2. 当前阶段通用分支（byStage[0~3]）
 *   返回 null 则 game.js 继续走 COMMAND_STORIES 等后备流程
 *
 * @param {number|string} charId
 * @param {string}        commandName  指令名称（如"亲吻"）
 * @param {Object}        saveData     当前角色存档（含 obedience/affection/lust）
 * @returns {{ stories:string[], effects:Object }|null}
 */
/**
 * firstTime 条件检测器
 * condition 格式：{ affection: [min, max], obedience: [min, Infinity], lust: 50 }
 * 数组格式 [min, max] 表示 min <= val < max；Infinity 表示无上限
 * 数字格式表示 val >= 该数字
 */
function _checkFirstTimeCondition(condition, sv) {
  if (!condition) return true; // 无条件 → 始终匹配（用作 default 分支）
  var attrs = {
    affection: sv.affection  || 0,
    obedience: sv.obedience  || 0,
    lust:      sv.lust       || 0,
    stamina:   sv.stamina    || 0,
    trust:     sv.trust      || 0,
    loyalty:   sv.loyalty    || 0,
    love:      sv.love       || 0,
    purity:    sv.purity     || 0,
    depravity: sv.depravity  || 0,
  };
  for (var key in condition) {
    if (!Object.prototype.hasOwnProperty.call(condition, key)) continue;
    var req = condition[key];
    var val = (attrs[key] !== undefined) ? attrs[key] : 0;
    if (Array.isArray(req)) {
      var lo = (req[0] !== undefined && req[0] !== null) ? req[0] : -Infinity;
      var hi = (req[1] !== undefined && req[1] !== null) ? req[1] : Infinity;
      if (val < lo || val >= hi) return false;
    } else if (typeof req === 'number') {
      if (val < req) return false;
    }
  }
  return true;
}


/**
 * 故事条件检测器（用于 stories 内条件分支）
 * condition 支持：
 *   { lust: [80, Infinity] }   数值范围
 *   { stamina: [-Inf, 10] }    低于阈值
 *   { equip: '口塞球' }         装备检测（检查 sv.equips 数组）
 *   { tag: '淫乱' }             标签检测（检查 sv.tags 数组）
 */
function _checkStoryCondition(condition, sv) {
  if (!condition) return true;
  sv = sv || {};
  var numericAttrs = {
    lust:      sv.lust      || 0,
    stamina:   sv.stamina   || 0,
    affection: sv.affection || 0,
    obedience: sv.obedience || 0,
    love:      sv.love      || 0,
  };
  for (var key in condition) {
    if (!Object.prototype.hasOwnProperty.call(condition, key)) continue;
    var req = condition[key];
    if (key === 'equip') {
      // 检查装备：sv.equips 是字符串数组
      var equips = sv.equips || sv.activeEquips || [];
      var equipStr = JSON.stringify(equips);
      if (equipStr.indexOf(req) < 0) return false;
      continue;
    }
    if (key === 'tag') {
      var tags = sv.tags || [];
      if (tags.indexOf(req) < 0) return false;
      continue;
    }
    if (numericAttrs[key] !== undefined) {
      var val = numericAttrs[key];
      if (Array.isArray(req)) {
        var lo = (req[0] !== undefined && req[0] !== null) ? req[0] : -Infinity;
        var hi = (req[1] !== undefined && req[1] !== null) ? req[1] : Infinity;
        if (val < lo || val >= hi) return false;
      } else if (typeof req === 'number') {
        if (val < req) return false;
      }
    }
  }
  return true;
}


function getCharCommandStory(charId, commandName, saveData) {
  var reg = CharRegistry.get(charId);
  if (!reg || !reg.commandStories) return null;

  var cmd = reg.commandStories[commandName];
  if (!cmd) return null;

  var sv    = saveData || {};
  var stage = _getStage(sv);                          // 0~3
  var rel   = (reg.relation && reg.relation.type) || 'stranger';

  // ★ 首次触发检测：优先检查当前阶段是否有 firstTime 剧情且未曾触发
  var cmdFlags = sv.cmdFirstTriggers || {};
  if (!cmdFlags[commandName]) {
    var stageDataForFirst = (cmd.byStage && cmd.byStage[stage]);
    if (stageDataForFirst && stageDataForFirst.firstTime) {
      // 标记已触发（直接写入 sv 引用，writeSave 时自动持久化）
      sv.cmdFirstTriggers = cmdFlags;
      sv.cmdFirstTriggers[commandName] = true;
      var ft = stageDataForFirst.firstTime;

      // ★ 新增：支持条件数组格式
      // firstTime 可以是：
      //   普通对象 { stories, effects }  （旧格式，兼容保留）
      //   条件数组 [ { condition:{affection:[70,Infinity]}, stories, effects }, ... ]
      var ftResolved = ft;
      if (Array.isArray(ft)) {
        ftResolved = null;
        for (var ci = 0; ci < ft.length; ci++) {
          if (_checkFirstTimeCondition(ft[ci].condition, sv)) {
            ftResolved = ft[ci];
            break;
          }
        }
        // 全部条件未命中时，取最后一项作为 fallback
        if (!ftResolved) ftResolved = ft[ft.length - 1] || {};
      }

      var ftStories = ftResolved.stories || ftResolved.story || [];
      var ftChosen = Array.isArray(ftStories[0])
        ? ftStories[Math.floor(Math.random() * ftStories.length)]
        : ftStories;
      return {
        stories:    ftChosen,
        effects:    ftResolved.effects    || {},
        expChanges: ftResolved.expChanges || null,
        _isFirstTime: true,
      };
    }
  }

  // ★ 标签专属分支（最高优先级）
  var _curTags = sv.tags || [];
  if (cmd.byTag && _curTags.length) {
    for (var _ti = 0; _ti < _curTags.length; _ti++) {
      var _tagBranch = cmd.byTag[_curTags[_ti]];
      if (_tagBranch) {
        var _tagStage = (_tagBranch.byStage && _tagBranch.byStage[stage]) || _tagBranch;
        var _tagResult = _pickStoryBranch(_tagStage, sv);
        if (_tagResult) return _tagResult;
      }
    }
  }

  // 优先：关系类型专属分支
  if (cmd.byRelation && cmd.byRelation[rel]) {
    var relBranch = cmd.byRelation[rel];
    var relStage  = (relBranch.byStage && relBranch.byStage[stage]) || relBranch;
    var result    = _pickStoryBranch(relStage, sv);
    if (result) return result;
  }

  // 通用阶段分支
  if (cmd.byStage && cmd.byStage[stage]) {
    var result2 = _pickStoryBranch(cmd.byStage[stage], sv);
    if (result2) return result2;
  }

  // 兜底：指令级默认
  if (cmd.default) {
    return _pickStoryBranch(cmd.default, sv);
  }

  // 兼容旧格式：直接在指令对象上写 stage0/stage1/stage2/stage3
  var legacyKey = 'stage' + stage;
  if (cmd[legacyKey] && Array.isArray(cmd[legacyKey]) && cmd[legacyKey].length) {
    var legacyPool = cmd[legacyKey];
    var realPool = legacyPool.filter(function(s){ return typeof s === 'string' && s.indexOf('【') !== 0; });
    if (realPool.length) {
      var picked = realPool[Math.floor(Math.random() * realPool.length)];
      return {
        stories:    Array.isArray(picked) ? picked : [picked],
        effects:    (cmd.effects && cmd.effects[stage]) || {},
        expChanges: null,
      };
    }
  }
  // 旧格式回退：找已有内容的最近低阶段
  for (var fb = stage - 1; fb >= 0; fb--) {
    var fbKey = 'stage' + fb;
    if (cmd[fbKey] && Array.isArray(cmd[fbKey]) && cmd[fbKey].length) {
      var fbPool = cmd[fbKey].filter(function(s){ return typeof s === 'string' && s.indexOf('【') !== 0; });
      if (fbPool.length) {
        var fbPicked = fbPool[Math.floor(Math.random() * fbPool.length)];
        return {
          stories:    Array.isArray(fbPicked) ? fbPicked : [fbPicked],
          effects:    (cmd.effects && cmd.effects[fb]) || {},
          expChanges: null,
        };
      }
    }
  }

  return null;
}

/**
 * 从一个分支对象里随机取一条故事
 * 分支格式：{ stories: [...], effects: {}, expChanges: {} }
 *         或 [{ stories: [...], ... }, ...]  （多条随机选一）
 *
 * ★ 修复：返回值中补上 expChanges，保证 game.js 能读取经验变化
 */
function _pickStoryBranch(branch, sv) {
  if (!branch) return null;
  sv = sv || {};

  // ★ 数组格式分两种情况：
  if (Array.isArray(branch)) {
    if (!branch.length) return null;
    // 情况A：条件故事数组 [ {condition:{...}, story:[...]}, ... ]
    var isCondArr = typeof branch[0] === 'object' && !Array.isArray(branch[0]) &&
      (branch[0].condition !== undefined || branch[0].story !== undefined);
    if (isCondArr) {
      // 找所有满足条件的选项
      var matching = branch.filter(function(item) {
        return _checkStoryCondition(item.condition, sv);
      });
      // 若没有满足条件的，取无条件项作为兜底
      if (!matching.length) matching = branch.filter(function(item) { return !item.condition; });
      if (!matching.length) return null;
      var chosen = matching[Math.floor(Math.random() * matching.length)];
      var finalSt = chosen.story || chosen.stories || [];
      return {
        stories:    Array.isArray(finalSt[0]) ? finalSt[Math.floor(Math.random() * finalSt.length)] : finalSt,
        effects:    branch.effects || chosen.effects || {},
        expChanges: branch.expChanges || chosen.expChanges || null,
      };
    }
    // 情况B：普通数组 → 随机取一个分支再递归
    return _pickStoryBranch(branch[Math.floor(Math.random() * branch.length)], sv);
  }

  // 对象格式
  var stories = branch.stories || branch.story;
  if (!stories || !stories.length) return null;

  // ★ stories 本身也可能是条件故事数组
  if (Array.isArray(stories) && stories.length > 0 &&
      typeof stories[0] === 'object' && !Array.isArray(stories[0]) &&
      (stories[0].condition !== undefined || stories[0].story !== undefined)) {
    var matchSt = stories.filter(function(s) { return _checkStoryCondition(s.condition, sv); });
    if (!matchSt.length) matchSt = stories.filter(function(s) { return !s.condition; });
    if (!matchSt.length) return null;
    var pickedSt = matchSt[Math.floor(Math.random() * matchSt.length)];
    var finalArr = pickedSt.story || pickedSt.stories || [];
    return {
      stories:    Array.isArray(finalArr[0]) ? finalArr[Math.floor(Math.random() * finalArr.length)] : finalArr,
      effects:    branch.effects || pickedSt.effects || {},
      expChanges: branch.expChanges || pickedSt.expChanges || null,
    };
  }

  // stories 可以是字符串数组（段落）或字符串数组的数组（多套随机）
  var chosen = stories;
  if (Array.isArray(stories[0])) {
    chosen = stories[Math.floor(Math.random() * stories.length)];
  }
  return {
    stories:    chosen,
    effects:    branch.effects    || {},
    expChanges: branch.expChanges || null,  // ★ 补上 expChanges
  };
}

// ── 页面加载完后自动 init ───────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  CharLoader.init();
  // ★ 加载角色预设图像（立绘头像 + CG相册内置图）
  setTimeout(_autoLoadCharImages, 100);
});


// ══════════════════════════════════════════════════════════════
//  角色预设图像自动加载系统
//  约定规范：
//    cg/char/{charId}/normal.jpg      → 角色默认头像（优先于emoji）
//    cg/char/{charId}/manifest.json   → 相册预设图清单
//
//  manifest.json 格式：
//  {
//    "images": [
//      { "file": "scene_01.jpg", "ratio": "16-9", "album": "场景" },
//      { "file": "portrait_01.jpg", "ratio": "3-4", "album": "立绘" }
//    ]
//  }
// ══════════════════════════════════════════════════════════════
function _autoLoadCharImages() {
  var registry = CharRegistry.all();
  Object.keys(registry).forEach(function(id) {
    var charData = registry[id];
    if (charData._cgImagesLoaded) return;
    charData._cgImagesLoaded = true;

    var basePath = 'cg/char/' + id + '/';

    // 1. 尝试加载 normal.jpg 作为默认头像
    (function(cid, path) {
      var img = new Image();
      img.onload = function() {
        charData._presetAvaUrl = path;
        // 写入现有存档（仅当用户未自定义时）
        try {
          var svRaw = localStorage.getItem('era_sv_' + cid);
          if (svRaw) {
            var sv = JSON.parse(svRaw);
            if (!sv.charProfile) sv.charProfile = {};
            if (!sv.charProfile.avaImg) {
              sv.charProfile._presetAvaUrl = path;
              localStorage.setItem('era_sv_' + cid, JSON.stringify(sv));
            }
          }
        } catch(e) {}
        // 如果庄园已打开，刷新
        if (typeof renderManor === 'function') {
          try { renderManor(); } catch(e) {}
        }
      };
      img.onerror = function() {}; // 没有文件则静默忽略
      img.src = path;
    })(id, basePath + 'normal.jpg');

    // 2. 优先从 charData.presetImages 直接读取（无需 fetch，file:// 协议也能用）
    if (charData.presetImages && charData.presetImages.length) {
      charData._presetImages = charData.presetImages.map(function(item) {
        // file 可以是相对于 cg/char/{id}/ 的名字，也可以是完整路径
        var filePath = (item.file.indexOf('/') >= 0) ? item.file : (basePath + item.file);
        return {
          file:  filePath,
          ratio: item.ratio || '3-4',
          album: item.album || '内置',
        };
      });
    }
    // 也尝试 manifest.json（作为补充，fetch 失败不影响主流程）
    if (typeof fetch !== 'undefined') {
      fetch(basePath + 'manifest.json')
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(manifest) {
          if (!manifest || !Array.isArray(manifest.images)) return;
          // 合并而非覆盖
          var moreImgs = manifest.images.map(function(item) {
            return { file: basePath + item.file, ratio: item.ratio || '3-4', album: item.album || '内置' };
          });
          charData._presetImages = (charData._presetImages || []).concat(moreImgs);
        })
        .catch(function() {});
    }
  });
}
