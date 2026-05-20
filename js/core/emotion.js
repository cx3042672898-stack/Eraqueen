// ============================================================
// js/core/emotion.js
// 角色情绪与长期关系演化系统
//
// 与personality.js的区别：
//   personality = 长期人格沉淀（trust/fear/love等，缓慢累积）
//   emotion     = 短期情绪波动（jealousy/nervous等，动态衰减）
//
// 架构：
//   §1 情绪状态引擎（8个volatile情绪，基于近期行为动态计算）
//   §2 行为历史追踪（滑动窗口，记录最近行为模式）
//   §3 关系阶段系统（5阶段不可逆进化）
//   §4 事件链引擎（多步叙事+条件分支）
//   §5 情绪文本选择（从emotion_texts.js获取条件台词）
//   §6 公共API & 集成接口
//
// 依赖：state.js (State, clamp, rand, pick)
// 可选依赖：personality.js (persona对象，有则联动，无则独立运行)
// ============================================================

// ── §1 情绪状态定义 ─────────────────────────────────────────
// 这些不是永久属性，而是基于近期行为的动态波动值
// 每次执行指令后重新计算，会自然衰减
// ──────────────────────────────────────────────────────────────

const EMOTION_KEYS = [
  'nervous',     // 紧张不安 — 面对未知/危险时的焦虑
  'jealousy',    // 嫉妒占有 — 感到被忽视或有竞争时的独占欲
  'possessive',  // 占有欲 — 想要完全拥有对方的冲动
  'vulnerable',  // 脆弱敞开 — 信任后卸下防备的状态
  'obedient',    // 顺从 — 放弃抵抗、服从命令的倾向
  'rebellious',  // 反叛 — 不甘屈服、想要反抗的冲动
  'attached',    // 依恋 — 对陪伴的渴望和分离焦虑
  'unstable',    // 不稳定 — 情绪剧烈波动、行为不可预测
];

// 情绪衰减率（每执行一次指令，未被强化的情绪衰减多少）
const EMOTION_DECAY = {
  nervous:    3,
  jealousy:   2,
  possessive: 1,   // 占有欲衰减慢
  vulnerable: 4,   // 脆弱感消退快
  obedient:   1,   // 顺从衰减慢
  rebellious: 3,
  attached:   1,   // 依恋衰减慢
  unstable:   2,
};

// ── §1.1 行为分类标签 ──────────────────────────────────────
// 将231个指令按行为模式分类，用于情绪计算
const ACTION_BEHAVIOR_TAGS = {
  // 温柔/陪伴类
  _gentle: ['聊天','送礼物','亲肤接触','悠闲度过','抚弄发丝','抚摸翅膀','抚摸尾巴',
            '抚摸兽耳','亲吻','爱抚','什么也不做','观看视频','喂奶','泡泡浴',
            '浴室PLAY','淋浴','新妻PLAY'],
  // 羞辱/精神压迫类
  _humiliate: ['辱骂','当面手淫','羞耻PLAY','野外PLAY','写真摄影','剃毛','摄像机',
               '人体家具','肉便器','成为奴隶便器','强制饮尿','令其辱骂','自己扒开'],
  // 暴力/惩罚类
  _violent: ['施暴','打屁股','打胸部','鞭打','滴蜡','针刺','拷问','掐脖子',
             '踢胯部','烙印','捆绑'],
  // 亲密/身体接触类
  _intimate: ['舔阴','口交','玩弄小穴','揉搓胸部','玩弄乳头','爱抚胸部',
              '舔耳朵','正常位','后背位','骑乘位','对面座位','背面座位',
              '对面立位','背面立位'],
  // 命令/服从类
  _command: ['命其自慰','命其胸部自慰','命其肛门自慰','命其舔阴','命其舔肛',
             '口交命令','手交命令','乳交命令','舔足命令','深喉','改变称呼方式',
             '令其爱抚','令其爱抚胸部','做家务'],
  // 药物/控制类
  _drug: ['媚药','强精神药','利尿剂','灌肠','空气灌肠'],
  // 约会/外出类
  _date: ['去约会'],
  // 极端/非人类
  _extreme: ['兽奸','轮奸','触手插入','触手灌肠','触手侵犯口腔','鳗鱼池','虫子池'],
  // 冷落（什么都不做但不是陪伴意义上的）
  _neglect: [],  // 由"长时间不互动"触发，不是具体指令
};

// 反向映射：指令名 → 行为标签
const _actionToTags = {};
Object.entries(ACTION_BEHAVIOR_TAGS).forEach(([tag, actions]) => {
  actions.forEach(name => {
    if (!_actionToTags[name]) _actionToTags[name] = [];
    _actionToTags[name].push(tag);
  });
});

function getActionTags(actionName) {
  return _actionToTags[actionName] || ['_basic'];
}


// ── §1.2 情绪计算引擎 ──────────────────────────────────────
// 扫描行为历史窗口，计算当前各情绪值
// ──────────────────────────────────────────────────────────────

/**
 * 初始化角色情绪数据
 * @param {Object} charObj
 * @returns {Object} 含 emotionState 的角色对象
 */
function initEmotion(charObj) {
  if (charObj.emotionState) return charObj;

  charObj.emotionState = {
    // 当前情绪值 (0~100)
    nervous: 15,
    jealousy: 0,
    possessive: 0,
    vulnerable: 0,
    obedient: 0,
    rebellious: charObj.persona?.pride > 60 ? 20 : 5,
    attached: 0,
    unstable: charObj.persona?.sanity < 50 ? 15 : 0,

    // 行为历史（最近30次）
    actionHistory: [],

    // 关系阶段
    relationStage: 0,  // 0=陌生 1=信任 2=依赖 3=扭曲依赖 4=病态占有
    relationStageChangedDay: 0,

    // 事件链进度 { chainId: { step, started, lastDay, branchData } }
    eventChains: {},

    // 冷落计数器（连续多少次未执行温柔行为）
    neglectCounter: 0,

    // 上次互动日
    lastInteractionDay: 0,
  };

  return charObj;
}

/**
 * 确保情绪数据完整（兼容旧存档）
 */
function ensureEmotion(charObj) {
  if (!charObj) return charObj;
  if (!charObj.emotionState) return initEmotion(charObj);

  // 补全可能缺失的字段
  const es = charObj.emotionState;
  EMOTION_KEYS.forEach(k => { if (es[k] === undefined) es[k] = 0; });
  if (!es.actionHistory) es.actionHistory = [];
  if (es.relationStage === undefined) es.relationStage = 0;
  if (!es.eventChains) es.eventChains = {};
  if (es.neglectCounter === undefined) es.neglectCounter = 0;
  if (es.lastInteractionDay === undefined) es.lastInteractionDay = 0;
  return charObj;
}

/**
 * 核心：执行指令后更新情绪状态
 * @param {string} actionName - 指令名
 * @param {string} category   - 指令分类
 * @returns {Object} { emotionChanges, stageChanged, chainEvents }
 */
function updateEmotion(actionName, category) {
  const c = State.currentChar;
  if (!c || !c.emotionState) return { emotionChanges: {}, stageChanged: false, chainEvents: [] };

  const es = c.emotionState;
  const persona = c.persona || {};
  const tags = getActionTags(actionName);

  // ── 记录行为历史 ──
  es.actionHistory.push({
    action: actionName,
    category: category,
    tags: tags,
    day: State.day,
    timestamp: Date.now(),
  });
  // 保持最近30条
  if (es.actionHistory.length > 30) {
    es.actionHistory = es.actionHistory.slice(-30);
  }

  // ── 计算情绪变化 ──
  const changes = {};
  const oldEmotions = {};
  EMOTION_KEYS.forEach(k => oldEmotions[k] = es[k]);

  // Step 1: 自然衰减所有情绪
  EMOTION_KEYS.forEach(k => {
    const decay = EMOTION_DECAY[k] || 2;
    es[k] = Math.max(0, es[k] - decay);
  });

  // Step 2: 根据行为标签激发情绪
  _applyEmotionFromAction(es, tags, actionName, persona);

  // Step 3: 根据行为历史模式计算累积情绪
  _applyHistoryPatterns(es, persona);

  // Step 4: 人格-情绪联动
  _applyPersonaEmotionCoupling(es, persona);

  // Step 5: 情绪之间的互斥/增强
  _applyEmotionInteractions(es);

  // 计算变化差值
  EMOTION_KEYS.forEach(k => {
    es[k] = clamp(Math.round(es[k]), 0, 100);
    const diff = es[k] - oldEmotions[k];
    if (diff !== 0) changes[k] = diff;
  });

  // ── 冷落计数 ──
  if (tags.some(t => t === '_gentle' || t === '_date' || t === '_intimate')) {
    es.neglectCounter = 0;
  } else {
    es.neglectCounter++;
  }
  es.lastInteractionDay = State.day;

  // ── 更新关系阶段 ──
  const stageChanged = _updateRelationStage(es, persona);

  // ── 推进事件链 ──
  const chainEvents = _advanceEventChains(es, persona, actionName, tags);

  return { emotionChanges: changes, stageChanged, chainEvents };
}


// ── 情绪激发规则 ─────────────────────────────────────────────

function _applyEmotionFromAction(es, tags, actionName, persona) {
  // 温柔 → attached↑, nervous↓, vulnerable↑(如果trust高)
  if (tags.includes('_gentle')) {
    es.attached   += rand(2, 5);
    es.nervous    = Math.max(0, es.nervous - rand(3, 6));
    es.rebellious = Math.max(0, es.rebellious - rand(1, 3));
    if ((persona.trust || 0) > 40) {
      es.vulnerable += rand(2, 4);
    }
  }

  // 约会 → attached↑↑, possessive↑(如果已依赖), jealousy↓
  if (tags.includes('_date')) {
    es.attached    += rand(5, 10);
    es.jealousy    = Math.max(0, es.jealousy - rand(3, 8));
    es.nervous     += rand(1, 4);
    if (es.attached > 40) {
      es.possessive += rand(2, 5);
    }
  }

  // 羞辱 → nervous↑, rebellious↑(pride高时) 或 obedient↑(pride低时)
  if (tags.includes('_humiliate')) {
    es.nervous += rand(3, 7);
    if ((persona.pride || 50) > 50) {
      es.rebellious += rand(3, 6);
    } else {
      es.obedient += rand(2, 5);
    }
    es.unstable += rand(1, 3);
  }

  // 暴力 → nervous↑↑, rebellious 或 obedient (取决于broken程度)
  if (tags.includes('_violent')) {
    es.nervous += rand(5, 10);
    es.unstable += rand(2, 5);
    if ((persona.broken || 0) > 40 || (persona.fear || 0) > 50) {
      es.obedient += rand(3, 7);
      es.rebellious = Math.max(0, es.rebellious - rand(2, 5));
    } else {
      es.rebellious += rand(2, 6);
    }
    // 暴力后如果attached高 → 扭曲依赖（受虐后更黏人）
    if (es.attached > 30) {
      es.attached += rand(1, 3);
      es.possessive += rand(1, 2);
    }
  }

  // 命令 → obedient↑, nervous↑微量
  if (tags.includes('_command')) {
    es.obedient += rand(2, 5);
    es.nervous  += rand(0, 2);
    es.rebellious = Math.max(0, es.rebellious - rand(1, 2));
  }

  // 药物 → unstable↑, nervous↑, vulnerable↑
  if (tags.includes('_drug')) {
    es.unstable   += rand(3, 6);
    es.nervous    += rand(2, 5);
    es.vulnerable += rand(2, 4);
  }

  // 极端 → unstable↑↑, nervous↑↑
  if (tags.includes('_extreme')) {
    es.unstable += rand(5, 10);
    es.nervous  += rand(5, 8);
    es.obedient += rand(2, 4);
  }

  // 亲密 → attached↑, vulnerable↑, nervous↑微量
  if (tags.includes('_intimate')) {
    es.attached   += rand(1, 4);
    es.vulnerable += rand(1, 3);
    es.nervous    += rand(0, 2);
    // 高love时亲密行为增加possessive
    if ((persona.love || 0) > 50) {
      es.possessive += rand(1, 3);
    }
  }
}


// ── 行为历史模式识别 ────────────────────────────────────────

function _applyHistoryPatterns(es, persona) {
  const history = es.actionHistory;
  if (history.length < 5) return;

  const recent10 = history.slice(-10);
  const recent5  = history.slice(-5);

  // 统计最近10次行为中各标签出现次数
  const tagCounts = {};
  recent10.forEach(h => {
    (h.tags || []).forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
  });

  // 模式：连续温柔 → 深度依恋
  if ((tagCounts['_gentle'] || 0) >= 6) {
    es.attached += rand(3, 6);
    es.vulnerable += rand(2, 4);
  }

  // 模式：连续暴力 → 学习性无助（obedient↑↑, rebellious↓↓）
  if ((tagCounts['_violent'] || 0) >= 5) {
    es.obedient += rand(4, 8);
    es.rebellious = Math.max(0, es.rebellious - rand(5, 10));
    es.unstable += rand(2, 4);
  }

  // 模式：温柔和暴力交替（操纵） → unstable↑↑, attached↑, confused
  const gentleCount = (tagCounts['_gentle'] || 0) + (tagCounts['_date'] || 0);
  const violentCount = (tagCounts['_violent'] || 0) + (tagCounts['_humiliate'] || 0);
  if (gentleCount >= 3 && violentCount >= 3) {
    es.unstable += rand(5, 8);
    es.attached += rand(3, 5);
    es.nervous  += rand(2, 4);
  }

  // 模式：长期冷落（neglectCounter高） → jealousy↑, attached↑(如已依赖)
  if (es.neglectCounter >= 5) {
    es.jealousy += rand(3, 7);
    if (es.attached > 30) {
      es.attached += rand(2, 4);
      es.possessive += rand(1, 3);
      es.nervous += rand(2, 4);
    }
  }

  // 模式：连续命令 → 深度服从
  if ((tagCounts['_command'] || 0) >= 5) {
    es.obedient += rand(3, 6);
  }

  // 模式：连续亲密但无温柔对话 → 工具感（rebellious或obedient）
  if ((tagCounts['_intimate'] || 0) >= 5 && (tagCounts['_gentle'] || 0) <= 1) {
    if ((persona.pride || 50) > 40) {
      es.rebellious += rand(2, 5);
    } else {
      es.obedient += rand(2, 4);
    }
    es.vulnerable = Math.max(0, es.vulnerable - rand(3, 6));
  }
}


// ── 人格-情绪联动 ───────────────────────────────────────────

function _applyPersonaEmotionCoupling(es, persona) {
  // 高trust → vulnerable更容易积累
  if ((persona.trust || 0) > 60) {
    es.vulnerable = Math.min(100, es.vulnerable + 2);
  }

  // 高dependency → attached更难衰减
  if ((persona.dependency || 0) > 50) {
    es.attached = Math.min(100, es.attached + 2);
  }

  // 高love + 高dependency → possessive和jealousy更敏感
  if ((persona.love || 0) > 50 && (persona.dependency || 0) > 40) {
    es.possessive = Math.min(100, es.possessive + 1);
    es.jealousy   = Math.min(100, es.jealousy + 1);
  }

  // 低sanity → unstable更高
  if ((persona.sanity || 80) < 40) {
    es.unstable = Math.min(100, es.unstable + 3);
  }

  // 高broken → obedient更高，rebellious更低
  if ((persona.broken || 0) > 50) {
    es.obedient   = Math.min(100, es.obedient + 2);
    es.rebellious = Math.max(0, es.rebellious - 2);
  }

  // 高pride + 低fear → rebellious维持
  if ((persona.pride || 50) > 60 && (persona.fear || 0) < 30) {
    es.rebellious = Math.min(100, es.rebellious + 1);
  }

  // 高fear → nervous基底更高
  if ((persona.fear || 0) > 40) {
    es.nervous = Math.min(100, es.nervous + Math.floor((persona.fear - 40) / 10));
  }
}


// ── 情绪互斥/增强 ───────────────────────────────────────────

function _applyEmotionInteractions(es) {
  // obedient ↔ rebellious 互斥
  if (es.obedient > 60 && es.rebellious > 30) {
    es.rebellious = Math.max(0, es.rebellious - 3);
    es.unstable += 2;  // 内心矛盾产生不稳定
  }
  if (es.rebellious > 60 && es.obedient > 30) {
    es.obedient = Math.max(0, es.obedient - 3);
  }

  // attached + jealousy → possessive加速
  if (es.attached > 50 && es.jealousy > 40) {
    es.possessive += 3;
  }

  // possessive + unstable → 危险状态
  if (es.possessive > 60 && es.unstable > 50) {
    es.nervous += 2;
  }

  // vulnerable + attached → 更容易受伤
  if (es.vulnerable > 50 && es.attached > 50) {
    es.jealousy += 1;  // 害怕失去
  }
}


// ── §3 关系阶段系统 ─────────────────────────────────────────

const RELATION_STAGES = [
  { id: 0, name: '陌生',     icon: '🌑', desc: '尚未建立任何真正的联系' },
  { id: 1, name: '信任',     icon: '🌓', desc: '开始卸下防备，愿意靠近' },
  { id: 2, name: '依赖',     icon: '🌕', desc: '离不开你的存在，渴望陪伴' },
  { id: 3, name: '扭曲依赖', icon: '🌘', desc: '分不清爱与恐惧的边界' },
  { id: 4, name: '病态占有', icon: '🌑', desc: '你是唯一的光，也是唯一的锁链' },
];

function _updateRelationStage(es, persona) {
  const oldStage = es.relationStage;

  // 阶段判定（只升不降，除非特殊重置事件）
  if (es.relationStage === 0) {
    // 陌生 → 信任：需要累积温柔行为 + trust > 30
    if ((persona.trust || 0) > 30 && es.attached > 20 && es.vulnerable > 15) {
      es.relationStage = 1;
    }
  }
  else if (es.relationStage === 1) {
    // 信任 → 依赖：需要高attached + dependency > 40
    if ((persona.dependency || 0) > 40 && es.attached > 45) {
      es.relationStage = 2;
    }
  }
  else if (es.relationStage === 2) {
    // 依赖 → 扭曲依赖：需要fear+love共存 或 暴力+温柔交替
    const twisted = (
      ((persona.fear || 0) > 30 && (persona.love || 0) > 30 && es.attached > 50) ||
      (es.unstable > 40 && es.attached > 50) ||
      ((persona.broken || 0) > 30 && es.obedient > 40 && es.attached > 40)
    );
    if (twisted) {
      es.relationStage = 3;
    }
  }
  else if (es.relationStage === 3) {
    // 扭曲依赖 → 病态占有：需要极端情绪组合
    if (es.possessive > 60 && es.attached > 60 && (es.unstable > 40 || (persona.sanity || 80) < 35)) {
      es.relationStage = 4;
    }
  }

  const changed = es.relationStage !== oldStage;
  if (changed) {
    es.relationStageChangedDay = State.day;
  }
  return changed;
}

/**
 * 获取当前关系阶段信息
 */
function getRelationStage(charObj) {
  const stage = charObj?.emotionState?.relationStage ?? 0;
  return RELATION_STAGES[stage] || RELATION_STAGES[0];
}


// ── §4 事件链引擎 ───────────────────────────────────────────

/**
 * 推进所有事件链
 * @returns {Array} 本次触发的事件列表
 */
function _advanceEventChains(es, persona, actionName, tags) {
  if (typeof EVENT_CHAINS === 'undefined') return [];

  const triggered = [];

  EVENT_CHAINS.forEach(chain => {
    const chainState = es.eventChains[chain.id] || { step: -1, started: false, lastDay: 0, data: {} };

    // 未开始 → 检查启动条件
    if (!chainState.started) {
      if (_checkChainCondition(chain.trigger, es, persona, actionName, tags)) {
        chainState.started = true;
        chainState.step = 0;
        chainState.lastDay = State.day;
        es.eventChains[chain.id] = chainState;
        triggered.push({ chainId: chain.id, step: 0, event: chain.steps[0] });
      }
      return;
    }

    // 已开始 → 检查下一步条件
    const currentStep = chainState.step;
    const nextStep = currentStep + 1;
    if (nextStep >= chain.steps.length) return; // 链已完成

    // 冷却时间：两步之间至少隔1天
    if (State.day - chainState.lastDay < (chain.steps[nextStep].cooldown || 1)) return;

    const stepDef = chain.steps[nextStep];
    if (_checkChainCondition(stepDef.condition, es, persona, actionName, tags)) {
      chainState.step = nextStep;
      chainState.lastDay = State.day;
      es.eventChains[chain.id] = chainState;
      triggered.push({ chainId: chain.id, step: nextStep, event: stepDef });
    }
  });

  return triggered;
}

/**
 * 检查条件是否满足
 */
function _checkChainCondition(cond, es, persona, actionName, tags) {
  if (!cond) return true;

  // emotion条件
  if (cond.emotion) {
    for (const [k, range] of Object.entries(cond.emotion)) {
      const val = es[k] ?? 0;
      if (Array.isArray(range)) {
        if (val < range[0] || val > range[1]) return false;
      } else {
        if (val < range) return false;
      }
    }
  }

  // persona条件
  if (cond.persona) {
    for (const [k, range] of Object.entries(cond.persona)) {
      const val = persona[k] ?? 50;
      if (Array.isArray(range)) {
        if (val < range[0] || val > range[1]) return false;
      } else {
        if (val < range) return false;
      }
    }
  }

  // 关系阶段条件
  if (cond.relationStage !== undefined) {
    if (es.relationStage < cond.relationStage) return false;
  }

  // 行为标签条件
  if (cond.actionTag) {
    if (!tags.includes(cond.actionTag)) return false;
  }

  // 具体指令条件
  if (cond.actionName) {
    if (actionName !== cond.actionName) return false;
  }

  // 天数条件
  if (cond.minDay && State.day < cond.minDay) return false;

  // 训练次数条件
  if (cond.minTrainCount) {
    if ((State.currentChar?.total_training_count || 0) < cond.minTrainCount) return false;
  }

  // 冷落计数
  if (cond.minNeglect && es.neglectCounter < cond.minNeglect) return false;

  return true;
}


// ── §5 情绪文本选择 ─────────────────────────────────────────

/**
 * 获取情绪条件台词
 * 优先级：情绪文本 > 人格文本 > 默认文本
 * @returns {string|null}
 */
function getEmotionDialogue(actionName, category) {
  const c = State.currentChar;
  if (!c || !c.emotionState) return null;
  if (typeof EMOTION_TEXTS === 'undefined') return null;

  const es = c.emotionState;
  const persona = c.persona || {};
  const stage = es.relationStage;

  // 1. 检查关系阶段专属文本
  const stageTexts = EMOTION_TEXTS._byStage?.[stage];
  if (stageTexts) {
    const matched = _matchEmotionTexts(stageTexts, es, persona, actionName);
    if (matched) return matched;
  }

  // 2. 检查指令专属情绪文本
  const actionTexts = EMOTION_TEXTS._byAction?.[actionName];
  if (actionTexts) {
    const matched = _matchEmotionTexts(actionTexts, es, persona, actionName);
    if (matched) return matched;
  }

  // 3. 检查通用情绪文本
  const generalTexts = EMOTION_TEXTS._general;
  if (generalTexts) {
    const matched = _matchEmotionTexts(generalTexts, es, persona, actionName);
    if (matched) return matched;
  }

  return null;
}

function _matchEmotionTexts(textEntries, es, persona, actionName) {
  const sorted = [...textEntries].sort((a, b) =>
    (Object.keys(b.cond?.emotion || {}).length + Object.keys(b.cond?.persona || {}).length) -
    (Object.keys(a.cond?.emotion || {}).length + Object.keys(a.cond?.persona || {}).length)
  );

  for (const entry of sorted) {
    if (_checkTextCondition(entry.cond, es, persona)) {
      return pick(entry.texts);
    }
  }
  return null;
}

function _checkTextCondition(cond, es, persona) {
  if (!cond) return true;

  if (cond.emotion) {
    for (const [k, range] of Object.entries(cond.emotion)) {
      const val = es[k] ?? 0;
      const [lo, hi] = Array.isArray(range) ? range : [range, 100];
      if (val < lo || val > hi) return false;
    }
  }

  if (cond.persona) {
    for (const [k, range] of Object.entries(cond.persona)) {
      const val = persona[k] ?? 50;
      const [lo, hi] = Array.isArray(range) ? range : [range, 100];
      if (val < lo || val > hi) return false;
    }
  }

  if (cond.stage !== undefined) {
    if ((es.relationStage ?? 0) < cond.stage) return false;
  }

  return true;
}


// ── §6 公共API ──────────────────────────────────────────────

/**
 * 获取角色当前情绪标签（用于UI显示）
 */
function getEmotionTags(charObj) {
  const es = charObj?.emotionState;
  if (!es) return [];

  const tags = [];
  if (es.nervous    > 40) tags.push({ id: 'nervous',    name: '不安',   icon: '😟' });
  if (es.jealousy   > 40) tags.push({ id: 'jealousy',   name: '嫉妒',   icon: '💢' });
  if (es.possessive > 50) tags.push({ id: 'possessive', name: '占有欲', icon: '🔒' });
  if (es.vulnerable > 40) tags.push({ id: 'vulnerable', name: '脆弱',   icon: '🥀' });
  if (es.obedient   > 50) tags.push({ id: 'obedient',   name: '顺从',   icon: '🐾' });
  if (es.rebellious > 40) tags.push({ id: 'rebellious', name: '反叛',   icon: '🔥' });
  if (es.attached   > 50) tags.push({ id: 'attached',   name: '依恋',   icon: '💫' });
  if (es.unstable   > 50) tags.push({ id: 'unstable',   name: '不稳定', icon: '⚡' });

  return tags;
}

/**
 * 渲染情绪面板HTML
 */
function renderEmotionPanel(charObj) {
  const es = charObj?.emotionState;
  if (!es) return '';

  const labels = {
    nervous:    ['不安', '😟', '#e8a040'],
    jealousy:   ['嫉妒', '💢', '#e85c7a'],
    possessive: ['占有', '🔒', '#c070f0'],
    vulnerable: ['脆弱', '🥀', '#70b8e0'],
    obedient:   ['顺从', '🐾', '#8a8a8a'],
    rebellious: ['反叛', '🔥', '#e87040'],
    attached:   ['依恋', '💫', '#e070b0'],
    unstable:   ['不稳', '⚡', '#f0c040'],
  };

  const stage = RELATION_STAGES[es.relationStage] || RELATION_STAGES[0];

  let html = `<div class="emotion-panel">`;

  // 关系阶段
  html += `<div class="emotion-stage">
    <span class="emotion-stage-icon">${stage.icon}</span>
    <span class="emotion-stage-name">${stage.name}</span>
    <span class="emotion-stage-desc">— ${stage.desc}</span>
  </div>`;

  // 情绪条
  EMOTION_KEYS.forEach(k => {
    const [label, icon, color] = labels[k] || [k, '?', '#888'];
    const val = es[k];
    if (val < 5 && k !== 'nervous') return; // 隐藏极低的情绪
    html += `<div class="emotion-row">
      <span class="emotion-icon">${icon}</span>
      <span class="emotion-label">${label}</span>
      <div class="emotion-bar-bg">
        <div class="emotion-bar-fill" style="width:${val}%;background:${color};
             opacity:${0.4 + val * 0.006}"></div>
      </div>
      <span class="emotion-val">${val}</span>
    </div>`;
  });

  html += '</div>';
  return html;
}

/**
 * 格式化情绪变化文本
 */
function formatEmotionChanges(changes) {
  const labels = {
    nervous: '不安', jealousy: '嫉妒', possessive: '占有',
    vulnerable: '脆弱', obedient: '顺从', rebellious: '反叛',
    attached: '依恋', unstable: '不稳定',
  };
  const icons = {
    nervous: '😟', jealousy: '💢', possessive: '🔒',
    vulnerable: '🥀', obedient: '🐾', rebellious: '🔥',
    attached: '💫', unstable: '⚡',
  };
  return Object.entries(changes)
    .filter(([_, v]) => v !== 0)
    .map(([k, v]) => `${icons[k]||''}${labels[k]||k} ${v>0?'+':''}${v}`)
    .join('  ');
}
