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

/** 获取当前所处阶段（0~3） */
function _getStage(sv) {
  var ob = sv.obedience || 0;
  if (ob < 30) return 0;  // 抵抗期
  if (ob < 55) return 1;  // 动摇期
  if (ob < 80) return 2;  // 适应期
  return 3;               // 融合期
}
function _stageName(stage) {
  return ['抵抗期', '动摇期', '适应期', '融合期'][stage] || '未知阶段';
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
function getCharCommandStory(charId, commandName, saveData) {
  var reg = CharRegistry.get(charId);
  if (!reg || !reg.commandStories) return null;

  var cmd = reg.commandStories[commandName];
  if (!cmd) return null;

  var sv   = saveData || {};
  var stage = _getStage(sv);                          // 0~3
  var rel   = (reg.relation && reg.relation.type) || 'stranger';

  // 优先：关系类型专属分支
  if (cmd.byRelation && cmd.byRelation[rel]) {
    var relBranch = cmd.byRelation[rel];
    var relStage  = (relBranch.byStage && relBranch.byStage[stage]) || relBranch;
    var result    = _pickStoryBranch(relStage);
    if (result) return result;
  }

  // 通用阶段分支
  if (cmd.byStage && cmd.byStage[stage]) {
    var result2 = _pickStoryBranch(cmd.byStage[stage]);
    if (result2) return result2;
  }

  // 兜底：指令级默认
  if (cmd.default) {
    return _pickStoryBranch(cmd.default);
  }

  // 兼容旧格式：直接在指令对象上写 stage0/stage1/stage2/stage3
  var legacyKey = 'stage' + stage;
  if (cmd[legacyKey] && Array.isArray(cmd[legacyKey]) && cmd[legacyKey].length) {
    var legacyPool = cmd[legacyKey];
    // 过滤掉占位符（以【开头的内容）
    var realPool = legacyPool.filter(function(s){ return typeof s === 'string' && s.indexOf('【') !== 0; });
    if (realPool.length) {
      var picked = realPool[Math.floor(Math.random() * realPool.length)];
      return {
        stories: Array.isArray(picked) ? picked : [picked],
        effects: (cmd.effects && cmd.effects[stage]) || {}
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
          stories: Array.isArray(fbPicked) ? fbPicked : [fbPicked],
          effects: (cmd.effects && cmd.effects[fb]) || {}
        };
      }
    }
  }

  return null;
}

/**
 * 从一个分支对象里随机取一条故事
 * 分支格式：{ stories: [...], effects: {} }
 *         或 [{ stories: [...], effects: {} }, ...]  （多条随机选一）
 */
function _pickStoryBranch(branch) {
  if (!branch) return null;
  // 数组格式 → 随机取一个分支再递归
  if (Array.isArray(branch)) {
    if (!branch.length) return null;
    return _pickStoryBranch(branch[Math.floor(Math.random() * branch.length)]);
  }
  // 对象格式
  var stories = branch.stories || branch.story;
  if (!stories || !stories.length) return null;
  // stories 本身可以是字符串数组（段落）或字符串数组的数组（多套随机）
  var chosen = stories;
  if (Array.isArray(stories[0])) {
    chosen = stories[Math.floor(Math.random() * stories.length)];
  }
  return {
    stories: chosen,
    effects: branch.effects || {},
  };
}

// ── 页面加载完后自动 init ───────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  CharLoader.init();
});
