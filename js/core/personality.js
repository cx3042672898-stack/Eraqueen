// ============================================================
// js/core/personality.js
// 角色人格演化系统 (Character Personality Evolution System)
// 
// 功能：
//   1. 人格属性管理 (trust/fear/dependency/shame/pride/love/sanity/broken)
//   2. 玩家行为 → 人格影响映射
//   3. 人格路线判定 (恋爱/支配/黑化/病娇)
//   4. 条件化文本选择
//   5. 人格状态标签 & 事件触发
//   6. 与现有 State/存档系统兼容
//
// 依赖：state.js (State, clamp, rand, pick, toast)
// 被调用方：game.js (doAction), story.js (条件文本)
// ============================================================

// ── 人格属性定义 ──────────────────────────────────────────────
const PERSONALITY_KEYS = [
  'trust',       // 信任 (0~100)  对玩家信任程度
  'fear',        // 恐惧 (0~100)  对玩家的恐惧
  'dependency',  // 依赖 (0~100)  对玩家的精神依赖
  'shame',       // 羞耻 (0~100)  羞耻感累积
  'pride',       // 自尊 (0~100)  自我意识/尊严 (初始高, 会被压低)
  'love',        // 爱情 (0~100)  恋爱感情
  'sanity',      // 理智 (0~100)  精神稳定度 (初始高, 会下降)
  'broken',      // 崩坏 (0~100)  人格崩坏度
];

// 初始人格值：根据角色性格模板生成
const PERSONALITY_TEMPLATES = {
  // key = 角色的 personality 字段值
  '温柔':       { trust: 25, fear: 5,  dependency: 10, shame: 15, pride: 40, love: 5,  sanity: 90, broken: 0 },
  '温柔内敛':   { trust: 20, fear: 8,  dependency: 12, shame: 20, pride: 35, love: 5,  sanity: 92, broken: 0 },
  '温和谨慎':   { trust: 22, fear: 10, dependency: 8,  shame: 12, pride: 45, love: 3,  sanity: 95, broken: 0 },
  '温柔善良':   { trust: 28, fear: 5,  dependency: 15, shame: 18, pride: 35, love: 8,  sanity: 90, broken: 0 },
  '粗暴张扬':   { trust: 5,  fear: 2,  dependency: 0,  shame: 5,  pride: 85, love: 0,  sanity: 70, broken: 0 },
  '活泼开朗':   { trust: 30, fear: 5,  dependency: 8,  shame: 10, pride: 50, love: 5,  sanity: 88, broken: 0 },
  '活泼':       { trust: 28, fear: 5,  dependency: 8,  shame: 10, pride: 48, love: 5,  sanity: 88, broken: 0 },
  '冷淡神秘':   { trust: 3,  fear: 0,  dependency: 0,  shame: 8,  pride: 70, love: 0,  sanity: 95, broken: 0 },
  '古灵精怪':   { trust: 25, fear: 3,  dependency: 5,  shame: 8,  pride: 55, love: 3,  sanity: 85, broken: 0 },
  '深沉忧郁':   { trust: 8,  fear: 12, dependency: 15, shame: 20, pride: 30, love: 5,  sanity: 60, broken: 5 },
  '娇弱腼腆':   { trust: 15, fear: 20, dependency: 18, shame: 30, pride: 20, love: 5,  sanity: 75, broken: 0 },
  '和蔼可亲':   { trust: 35, fear: 2,  dependency: 5,  shame: 5,  pride: 45, love: 10, sanity: 95, broken: 0 },
  '神秘玄奥':   { trust: 5,  fear: 0,  dependency: 0,  shame: 5,  pride: 60, love: 0,  sanity: 98, broken: 0 },
  '真实角色':   { trust: 10, fear: 8,  dependency: 5,  shame: 12, pride: 55, love: 0,  sanity: 80, broken: 0 },
  '独立自强':   { trust: 8,  fear: 3,  dependency: 0,  shame: 8,  pride: 75, love: 0,  sanity: 92, broken: 0 },
  '梦幻唯美':   { trust: 20, fear: 5,  dependency: 12, shame: 15, pride: 35, love: 10, sanity: 70, broken: 0 },
  '高傲':       { trust: 3,  fear: 0,  dependency: 0,  shame: 5,  pride: 90, love: 0,  sanity: 88, broken: 0 },
  '调皮':       { trust: 22, fear: 3,  dependency: 5,  shame: 8,  pride: 55, love: 3,  sanity: 85, broken: 0 },
  '疯狂':       { trust: 8,  fear: 5,  dependency: 10, shame: 3,  pride: 40, love: 5,  sanity: 45, broken: 15 },
  '沉默':       { trust: 5,  fear: 10, dependency: 8,  shame: 15, pride: 45, love: 0,  sanity: 85, broken: 0 },
  '害羞':       { trust: 12, fear: 15, dependency: 12, shame: 35, pride: 30, love: 5,  sanity: 88, broken: 0 },
  '神秘':       { trust: 5,  fear: 2,  dependency: 0,  shame: 5,  pride: 60, love: 0,  sanity: 92, broken: 0 },
  '理性':       { trust: 10, fear: 2,  dependency: 0,  shame: 5,  pride: 65, love: 0,  sanity: 98, broken: 0 },
  '感性':       { trust: 18, fear: 8,  dependency: 15, shame: 18, pride: 35, love: 8,  sanity: 75, broken: 0 },
  // 默认模板
  '_default':   { trust: 15, fear: 8,  dependency: 5,  shame: 12, pride: 50, love: 3,  sanity: 85, broken: 0 },
};

// ── 指令 → 人格影响配置 ─────────────────────────────────────
// category级别的默认影响 + 可按指令名override
const PERSONALITY_EFFECTS = {
  // 按指令分类的默认效果
  _byCategory: {
    basic: {
      trust:      [0, 2],
      fear:       [0, 0],
      dependency: [0, 1],
      shame:      [0, 1],
      pride:      [0, 0],
      love:       [0, 1],
      sanity:     [0, 0],
      broken:     [0, 0],
    },
    intimate: {
      trust:      [0, 2],
      fear:       [0, 1],
      dependency: [1, 3],
      shame:      [1, 4],
      pride:      [-2, 0],
      love:       [0, 3],
      sanity:     [-1, 0],
      broken:     [0, 1],
    },
    work: {
      trust:      [0, 1],
      fear:       [1, 3],
      dependency: [0, 2],
      shame:      [2, 5],
      pride:      [-3, -1],
      love:       [-1, 0],
      sanity:     [-1, 0],
      broken:     [0, 1],
    },
    special: {
      trust:      [-1, 1],
      fear:       [1, 4],
      dependency: [1, 4],
      shame:      [2, 6],
      pride:      [-4, -1],
      love:       [-1, 1],
      sanity:     [-2, -1],
      broken:     [0, 2],
    },
    event: {
      trust:      [1, 3],
      fear:       [0, 0],
      dependency: [0, 2],
      shame:      [0, 1],
      pride:      [0, 1],
      love:       [1, 4],
      sanity:     [0, 1],
      broken:     [0, 0],
    },
  },

  // 按指令名的特殊override (优先级高于category)
  _byAction: {
    // ── 温柔类 → trust↑ love↑ fear↓
    '聊天':         { trust: [2, 5],  love: [1, 3],  fear: [-2, 0],  dependency: [0, 2] },
    '送礼物':       { trust: [3, 6],  love: [2, 5],  fear: [-1, 0],  pride: [0, 1] },
    '亲肤接触':     { trust: [1, 4],  love: [1, 4],  dependency: [1, 3], shame: [0, 2] },
    '悠闲度过':     { trust: [1, 3],  love: [0, 2],  sanity: [1, 2],  fear: [-1, 0] },
    '抚弄发丝':     { trust: [2, 4],  love: [1, 3],  dependency: [1, 2] },
    '抚摸翅膀':     { trust: [1, 3],  love: [1, 2],  dependency: [0, 2] },
    '抚摸尾巴':     { trust: [1, 3],  love: [1, 2],  dependency: [0, 2] },
    '抚摸兽耳':     { trust: [2, 4],  love: [1, 3],  dependency: [1, 2] },
    '亲吻':         { trust: [1, 3],  love: [3, 6],  dependency: [1, 3], shame: [1, 3] },
    '爱抚':         { trust: [0, 2],  love: [1, 4],  dependency: [1, 3], shame: [1, 3] },
    '去约会':       { trust: [3, 6],  love: [4, 8],  dependency: [2, 4], fear: [-2, 0], sanity: [0, 2] },
    '观看视频':     { trust: [1, 2],  dependency: [0, 1] },

    // ── 羞辱类 → shame↑ pride↓ fear↑
    '辱骂':         { shame: [3, 7],  pride: [-5, -2], fear: [2, 5],  trust: [-3, -1], love: [-2, 0], sanity: [-1, 0] },
    '令其辱骂':     { shame: [1, 3],  pride: [-2, 0],  broken: [0, 1] },
    '当面手淫':     { shame: [4, 8],  pride: [-4, -1], trust: [-2, 0] },
    '羞耻PLAY':     { shame: [5, 10], pride: [-5, -2], fear: [1, 3],  broken: [0, 2] },
    '野外PLAY':     { shame: [4, 8],  pride: [-3, -1], fear: [1, 3] },
    '写真摄影':     { shame: [3, 6],  pride: [-2, 0] },
    '剃毛':         { shame: [5, 8],  pride: [-4, -2], trust: [-2, 0] },

    // ── 暴力/惩罚类 → fear↑ trust↓ sanity↓ broken↑
    '施暴':         { fear: [5, 10], trust: [-5, -2], pride: [-3, -1], sanity: [-3, -1], broken: [1, 3], love: [-3, -1] },
    '打屁股':       { fear: [2, 5],  shame: [3, 6],   pride: [-3, -1], trust: [-1, 0] },
    '打胸部':       { fear: [3, 6],  shame: [3, 6],   pride: [-3, -1], trust: [-2, 0] },
    '鞭打':         { fear: [5, 8],  trust: [-3, -1],  pride: [-4, -2], sanity: [-2, -1], broken: [1, 2] },
    '滴蜡':         { fear: [4, 7],  shame: [2, 4],   pride: [-3, -1], sanity: [-1, 0], broken: [0, 2] },
    '针刺':         { fear: [6, 10], trust: [-4, -2],  pride: [-4, -2], sanity: [-3, -1], broken: [2, 4] },
    '拷问':         { fear: [8, 12], trust: [-6, -3],  pride: [-6, -3], sanity: [-5, -2], broken: [3, 5] },
    '掐脖子':       { fear: [7, 10], trust: [-5, -2],  sanity: [-3, -1], broken: [2, 4], dependency: [1, 3] },
    '捆绑':         { fear: [3, 6],  shame: [3, 5],   dependency: [1, 3], pride: [-2, 0] },
    '眼罩':         { fear: [3, 5],  dependency: [2, 4], shame: [1, 3] },
    '口塞球':       { fear: [2, 4],  shame: [3, 6],   pride: [-3, -1] },
    '烙印':         { fear: [8, 12], trust: [-5, -2],  pride: [-8, -4], sanity: [-4, -2], broken: [3, 6], dependency: [2, 5] },
    '踢胯部':       { fear: [5, 8],  trust: [-4, -2],  pride: [-4, -2], sanity: [-2, -1], broken: [1, 3] },

    // ── 极端类 → broken大幅↑ sanity大幅↓
    '人体家具':     { pride: [-8, -4],  shame: [5, 10], broken: [3, 6], sanity: [-4, -2], dependency: [2, 4] },
    '肉便器':       { pride: [-10, -5], shame: [6, 12], broken: [4, 8], sanity: [-5, -3], trust: [-3, -1] },
    '兽奸':         { pride: [-8, -4],  shame: [8, 12], broken: [4, 7], sanity: [-4, -2], fear: [3, 6] },
    '强制饮尿':     { pride: [-6, -3],  shame: [6, 10], broken: [2, 5], sanity: [-3, -1], fear: [2, 4] },
    '轮奸':         { pride: [-8, -4],  shame: [6, 10], broken: [5, 8], sanity: [-5, -3], fear: [5, 8], trust: [-5, -2] },
    '成为奴隶便器': { pride: [-10, -5], shame: [8, 12], broken: [6, 10], sanity: [-6, -3], dependency: [3, 6] },

    // ── 陪伴/日常类 → dependency↑
    '什么也不做':   { dependency: [0, 1], sanity: [0, 1] },
    '喂奶':         { dependency: [2, 4], trust: [1, 2],  love: [0, 2] },
    '泡泡浴':       { trust: [1, 3],     love: [1, 3],   dependency: [1, 3], shame: [1, 3] },
    '浴室PLAY':     { trust: [0, 2],     love: [1, 2],   dependency: [1, 3], shame: [2, 4] },
    '淋浴':         { trust: [1, 2],     dependency: [0, 1] },
    '新妻PLAY':     { love: [3, 6],      dependency: [2, 5], trust: [1, 3] },
    '做家务':       { dependency: [1, 2], pride: [-1, 0] },

    // ── 药物类 → sanity↓ dependency↑
    '媚药':         { sanity: [-3, -1], dependency: [1, 3], shame: [2, 4], broken: [0, 2] },
    '强精神药':     { sanity: [-5, -2], dependency: [2, 4], broken: [1, 3] },
    '利尿剂':       { shame: [2, 5],    pride: [-2, 0],    sanity: [-1, 0] },

    // ── 命令服从类 → dependency↑ pride↓
    '命其自慰':     { shame: [3, 6],  dependency: [1, 3], pride: [-2, 0] },
    '命其胸部自慰': { shame: [3, 5],  dependency: [1, 2], pride: [-2, 0] },
    '命其肛门自慰': { shame: [4, 7],  dependency: [1, 3], pride: [-3, -1] },
    '自己扒开':     { shame: [5, 8],  dependency: [1, 3], pride: [-4, -2] },
    '改变称呼方式': { dependency: [1, 3], pride: [-2, 0],  trust: [0, 1] },
  },
};

// ── 人格路线定义 ──────────────────────────────────────────────
const PERSONALITY_ROUTES = {
  love: {
    name: '恋爱路线',
    icon: '💕',
    desc: '真挚的爱情，心意相通',
    // 判定条件（全部满足才激活）
    check: (p) => p.love >= 60 && p.trust >= 50 && p.broken < 30 && p.sanity >= 40,
    // 进阶判定
    stages: [
      { name: '初萌心动', check: (p) => p.love >= 30 && p.trust >= 25 },
      { name: '暗生情愫', check: (p) => p.love >= 50 && p.trust >= 40 },
      { name: '坠入爱河', check: (p) => p.love >= 70 && p.trust >= 55 },
      { name: '生死相依', check: (p) => p.love >= 90 && p.trust >= 70 },
    ],
  },
  domination: {
    name: '支配路线',
    icon: '⛓️',
    desc: '绝对服从，灵魂属于你',
    check: (p) => p.fear >= 50 && p.dependency >= 50 && p.pride < 30,
    stages: [
      { name: '心生畏惧', check: (p) => p.fear >= 30 },
      { name: '初步驯化', check: (p) => p.fear >= 45 && p.dependency >= 30 && p.pride < 50 },
      { name: '完全臣服', check: (p) => p.fear >= 60 && p.dependency >= 55 && p.pride < 25 },
      { name: '灵魂枷锁', check: (p) => p.fear >= 80 && p.dependency >= 70 && p.pride < 15 },
    ],
  },
  corruption: {
    name: '黑化路线',
    icon: '🖤',
    desc: '精神崩坏，坠入深渊',
    check: (p) => p.broken >= 60 && p.sanity < 40,
    stages: [
      { name: '裂隙初现', check: (p) => p.broken >= 20 && p.sanity < 75 },
      { name: '心灵扭曲', check: (p) => p.broken >= 40 && p.sanity < 55 },
      { name: '崩坏边缘', check: (p) => p.broken >= 60 && p.sanity < 35 },
      { name: '彻底堕落', check: (p) => p.broken >= 85 && p.sanity < 20 },
    ],
  },
  yandere: {
    name: '病娇路线',
    icon: '🔪',
    desc: '扭曲的爱，永远不放手',
    check: (p) => p.love >= 50 && p.dependency >= 60 && p.sanity < 50 && p.broken >= 30,
    stages: [
      { name: '过度执着', check: (p) => p.love >= 30 && p.dependency >= 35 && p.sanity < 70 },
      { name: '独占欲望', check: (p) => p.love >= 45 && p.dependency >= 50 && p.sanity < 55 },
      { name: '疯狂之爱', check: (p) => p.love >= 60 && p.dependency >= 65 && p.sanity < 40 && p.broken >= 30 },
      { name: '永不分离', check: (p) => p.love >= 80 && p.dependency >= 80 && p.sanity < 25 && p.broken >= 50 },
    ],
  },
};

// ── 人格状态标签 (自动获得的被动标签) ────────────────────────
const PERSONALITY_TAGS = [
  { id: 'trusting',    name: '信赖',     icon: '🤝', check: (p) => p.trust >= 60 },
  { id: 'terrified',   name: '恐惧',     icon: '😰', check: (p) => p.fear >= 60 },
  { id: 'clingy',      name: '黏人',     icon: '🫂', check: (p) => p.dependency >= 60 },
  { id: 'shameful',    name: '羞耻体质', icon: '😳', check: (p) => p.shame >= 60 },
  { id: 'proud',       name: '高自尊',   icon: '👑', check: (p) => p.pride >= 70 },
  { id: 'prideless',   name: '无自尊',   icon: '💀', check: (p) => p.pride < 15 },
  { id: 'inlove',      name: '恋慕',     icon: '💗', check: (p) => p.love >= 50 },
  { id: 'devoted',     name: '挚爱',     icon: '💝', check: (p) => p.love >= 85 },
  { id: 'sane',        name: '理智',     icon: '🧠', check: (p) => p.sanity >= 80 },
  { id: 'unstable',    name: '不稳定',   icon: '⚠️', check: (p) => p.sanity < 40 && p.sanity >= 20 },
  { id: 'insane',      name: '精神崩坏', icon: '🌀', check: (p) => p.sanity < 20 },
  { id: 'breaking',    name: '崩坏中',   icon: '💔', check: (p) => p.broken >= 40 && p.broken < 70 },
  { id: 'broken',      name: '已崩坏',   icon: '🖤', check: (p) => p.broken >= 70 },
  { id: 'yandere',     name: '病娇',     icon: '🔪', check: (p) => p.love >= 50 && p.dependency >= 60 && p.sanity < 45 },
  { id: 'obedient',    name: '顺从',     icon: '🐕', check: (p) => p.fear >= 40 && p.pride < 30 && p.dependency >= 30 },
  { id: 'resistant',   name: '抵抗',     icon: '✊', check: (p) => p.pride >= 60 && p.trust < 20 && p.fear < 30 },
];

// ============================================================
// 核心 API
// ============================================================

/**
 * 初始化角色人格属性
 * 在 selectChar 时调用，为角色生成初始人格值
 * @param {Object} charObj - 角色对象 (含 personality 字段)
 * @returns {Object} 含 persona 字段的新角色对象
 */
function initPersonality(charObj) {
  if (charObj.persona) return charObj; // 已有人格数据（从存档恢复）

  const templateKey = charObj.personality || '_default';
  const template = PERSONALITY_TEMPLATES[templateKey] || PERSONALITY_TEMPLATES['_default'];

  // 加入随机扰动 (±5) 让每个角色独一无二
  const persona = {};
  PERSONALITY_KEYS.forEach(key => {
    const base = template[key] ?? 50;
    persona[key] = clamp(base + rand(-5, 5), 0, 100);
  });

  // 记录人格历史（用于长期趋势分析）
  persona._history = [];
  // 记录当前路线进度
  persona._routeProgress = {};
  // 记录已触发的人格事件
  persona._triggeredEvents = [];

  return { ...charObj, persona };
}

/**
 * 执行人格变化
 * 在 doAction 中调用，根据指令名和分类计算人格变化
 * @param {string} actionName - 指令名
 * @param {string} category   - 指令分类
 * @returns {Object} { changes: {key: delta}, newPersona: {...}, tags: [], route: null|{...} }
 */
function applyPersonalityEffect(actionName, category) {
  const c = State.currentChar;
  if (!c || !c.persona) return { changes: {}, newPersona: null, tags: [], route: null };

  const persona = { ...c.persona };
  const changes = {};

  // 1. 获取效果配置：指令名override > 分类默认
  const actionEffect = PERSONALITY_EFFECTS._byAction[actionName];
  const catEffect = PERSONALITY_EFFECTS._byCategory[category] || PERSONALITY_EFFECTS._byCategory.basic;

  PERSONALITY_KEYS.forEach(key => {
    let range;
    if (actionEffect && actionEffect[key]) {
      range = actionEffect[key];
    } else if (catEffect[key]) {
      range = catEffect[key];
    } else {
      range = [0, 0];
    }
    const delta = rand(range[0], range[1]);
    if (delta !== 0) {
      changes[key] = delta;
      persona[key] = clamp(persona[key] + delta, 0, 100);
    }
  });

  // 2. 人格联动效应 (Coupling Effects)
  _applyCouplingEffects(persona, changes);

  // 3. 记录历史快照（每10次训练记一次）
  if (c.total_training_count % 10 === 0) {
    const snapshot = {};
    PERSONALITY_KEYS.forEach(k => snapshot[k] = persona[k]);
    snapshot._day = State.day;
    persona._history = [...(persona._history || []).slice(-50), snapshot];
  }

  // 4. 获取当前标签
  const tags = getPersonalityTags(persona);

  // 5. 检测路线
  const route = detectRoute(persona);

  // 6. 更新 routeProgress
  persona._routeProgress = {};
  Object.entries(PERSONALITY_ROUTES).forEach(([routeId, routeDef]) => {
    const stages = routeDef.stages;
    let currentStage = -1;
    stages.forEach((stage, idx) => {
      if (stage.check(persona)) currentStage = idx;
    });
    if (currentStage >= 0) {
      persona._routeProgress[routeId] = currentStage;
    }
  });

  return { changes, newPersona: persona, tags, route };
}

/**
 * 人格联动效应
 * 某些属性之间会互相影响
 */
function _applyCouplingEffects(persona, changes) {
  // fear↑ + trust↓ → dependency 微增 (恐惧中的依赖)
  if ((changes.fear > 0) && persona.fear > 40 && persona.trust < 30) {
    persona.dependency = clamp(persona.dependency + 1, 0, 100);
  }

  // broken↑ → sanity↓ (崩坏侵蚀理智)
  if ((changes.broken > 0) && persona.broken > 30) {
    persona.sanity = clamp(persona.sanity - 1, 0, 100);
  }

  // love↑ + dependency↑ + sanity↓ → 病娇加速
  if (persona.love > 50 && persona.dependency > 50 && persona.sanity < 50) {
    if (changes.love > 0 || changes.dependency > 0) {
      persona.sanity = clamp(persona.sanity - 1, 0, 100);
    }
  }

  // shame积累到极端 → pride加速下降
  if (persona.shame > 70 && persona.pride > 10) {
    persona.pride = clamp(persona.pride - 1, 0, 100);
  }

  // trust 很高时，fear 自然消退
  if (persona.trust > 70 && persona.fear > 10) {
    persona.fear = clamp(persona.fear - 1, 0, 100);
  }

  // 完全崩坏后，pride 归零
  if (persona.broken >= 90) {
    persona.pride = clamp(persona.pride - 2, 0, 100);
  }
}

/**
 * 获取角色当前人格标签列表
 * @param {Object} persona - 人格对象
 * @returns {Array<{id, name, icon}>}
 */
function getPersonalityTags(persona) {
  if (!persona) return [];
  return PERSONALITY_TAGS.filter(tag => tag.check(persona))
    .map(tag => ({ id: tag.id, name: tag.name, icon: tag.icon }));
}

/**
 * 检测当前主路线
 * @param {Object} persona - 人格对象
 * @returns {Object|null} { id, name, icon, desc, stage }
 */
function detectRoute(persona) {
  if (!persona) return null;

  // 按优先级检测 (病娇 > 黑化 > 支配 > 恋爱)
  const priority = ['yandere', 'corruption', 'domination', 'love'];
  for (const routeId of priority) {
    const route = PERSONALITY_ROUTES[routeId];
    if (route.check(persona)) {
      // 找到当前最高阶段
      let stageName = route.stages[0]?.name || '';
      let stageIdx = 0;
      route.stages.forEach((stage, idx) => {
        if (stage.check(persona)) { stageName = stage.name; stageIdx = idx; }
      });
      return { id: routeId, name: route.name, icon: route.icon, desc: route.desc, stage: stageName, stageIdx };
    }
  }
  return null;
}

/**
 * 获取当前路线进度（所有路线的阶段进度）
 * @param {Object} persona
 * @returns {Array<{id, name, icon, stageIdx, stageName, maxStages, active}>}
 */
function getAllRouteProgress(persona) {
  if (!persona) return [];
  return Object.entries(PERSONALITY_ROUTES).map(([id, route]) => {
    let stageIdx = -1;
    let stageName = '未达成';
    route.stages.forEach((stage, idx) => {
      if (stage.check(persona)) { stageIdx = idx; stageName = stage.name; }
    });
    return {
      id,
      name: route.name,
      icon: route.icon,
      stageIdx,
      stageName,
      maxStages: route.stages.length,
      active: route.check(persona),
    };
  });
}

/**
 * 根据人格状态选择条件文本
 * @param {Object} persona - 人格对象
 * @param {string} actionName - 指令名
 * @param {string} category - 分类
 * @returns {string|null} 匹配到的条件文本，null则回退到默认
 */
function getPersonalityDialogue(persona, actionName, category) {
  if (!persona || typeof PERSONALITY_TEXTS === 'undefined') return null;

  // 1. 先查指令专属文本
  const actionTexts = PERSONALITY_TEXTS._byAction?.[actionName];
  if (actionTexts) {
    const matched = _matchConditionTexts(actionTexts, persona);
    if (matched) return matched;
  }

  // 2. 查分类文本
  const catTexts = PERSONALITY_TEXTS._byCategory?.[category];
  if (catTexts) {
    const matched = _matchConditionTexts(catTexts, persona);
    if (matched) return matched;
  }

  // 3. 查通用人格状态文本
  const generalTexts = PERSONALITY_TEXTS._general;
  if (generalTexts) {
    const matched = _matchConditionTexts(generalTexts, persona);
    if (matched) return matched;
  }

  return null;
}

/**
 * 从条件文本数组中匹配
 * @param {Array<{cond, texts}>} textEntries
 * @param {Object} persona
 * @returns {string|null}
 */
function _matchConditionTexts(textEntries, persona) {
  // 条件文本格式: [{ cond: { fear: [70, 100], trust: [0, 30] }, texts: ['...', '...'] }]
  // 越具体的条件越优先 → 按条件数量降序排
  const sorted = [...textEntries].sort((a, b) => 
    Object.keys(b.cond).length - Object.keys(a.cond).length
  );

  for (const entry of sorted) {
    let match = true;
    for (const [key, range] of Object.entries(entry.cond)) {
      const val = persona[key] ?? 50;
      if (val < range[0] || val > range[1]) { match = false; break; }
    }
    if (match && entry.texts?.length) {
      return pick(entry.texts);
    }
  }
  return null;
}

/**
 * 获取人格变化的格式化摘要（用于UI显示）
 * @param {Object} changes - { trust: +3, fear: -1, ... }
 * @returns {string} 格式化文本
 */
function formatPersonalityChanges(changes) {
  const labels = {
    trust: '信任', fear: '恐惧', dependency: '依赖',
    shame: '羞耻', pride: '自尊', love: '爱情',
    sanity: '理智', broken: '崩坏',
  };
  const icons = {
    trust: '🤝', fear: '😰', dependency: '🫂',
    shame: '😳', pride: '👑', love: '💗',
    sanity: '🧠', broken: '💔',
  };
  return Object.entries(changes)
    .filter(([_, v]) => v !== 0)
    .map(([k, v]) => `${icons[k] || ''}${labels[k] || k} ${v > 0 ? '+' : ''}${v}`)
    .join('  ');
}

/**
 * 生成人格面板HTML（用于角色详情弹窗）
 * @param {Object} persona
 * @returns {string} HTML字符串
 */
function renderPersonalityPanel(persona) {
  if (!persona) return '<div class="empty"><p>暂无人格数据</p></div>';

  const labels = {
    trust: ['信任', '🤝', 'var(--sg)'],
    fear:  ['恐惧', '😰', 'var(--sr)'],
    dependency: ['依赖', '🫂', 'var(--sp)'],
    shame: ['羞耻', '😳', 'var(--so)'],
    pride: ['自尊', '👑', 'var(--sb)'],
    love:  ['爱情', '💗', '#e75480'],
    sanity:['理智', '🧠', 'var(--acc)'],
    broken:['崩坏', '💔', '#666'],
  };

  let html = '<div class="persona-panel">';

  // 属性条
  PERSONALITY_KEYS.forEach(key => {
    const [label, icon, color] = labels[key] || [key, '?', '#888'];
    const val = Math.round(persona[key]);
    html += `
      <div class="persona-row">
        <span class="persona-icon">${icon}</span>
        <span class="persona-label">${label}</span>
        <div class="persona-bar-bg">
          <div class="persona-bar-fill" style="width:${val}%;background:${color}"></div>
        </div>
        <span class="persona-val">${val}</span>
      </div>`;
  });

  // 标签
  const tags = getPersonalityTags(persona);
  if (tags.length) {
    html += '<div class="persona-tags">';
    tags.forEach(t => {
      html += `<span class="persona-tag">${t.icon} ${t.name}</span>`;
    });
    html += '</div>';
  }

  // 路线
  const route = detectRoute(persona);
  if (route) {
    html += `<div class="persona-route">
      <span class="persona-route-icon">${route.icon}</span>
      <span class="persona-route-name">${route.name}</span>
      <span class="persona-route-stage">— ${route.stage}</span>
    </div>`;
  }

  html += '</div>';
  return html;
}

// ============================================================
// 兼容层：确保旧存档无 persona 时自动初始化
// ============================================================
function ensurePersonality(charObj) {
  if (!charObj) return charObj;
  if (!charObj.persona) {
    return initPersonality(charObj);
  }
  // 补全可能缺失的字段
  PERSONALITY_KEYS.forEach(key => {
    if (charObj.persona[key] === undefined) {
      charObj.persona[key] = 50;
    }
  });
  if (!charObj.persona._history) charObj.persona._history = [];
  if (!charObj.persona._routeProgress) charObj.persona._routeProgress = {};
  if (!charObj.persona._triggeredEvents) charObj.persona._triggeredEvents = [];
  return charObj;
}
