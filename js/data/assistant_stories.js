// ============================================================
// js/data/assistant_stories.js
// 助手系统对话故事数据
// 新增故事：在对应数组末尾追加 { title, story[] } 对象即可
// {NAME} 占位符会被自动替换为角色名称
// ============================================================

// ── 通用任命对话（设定助手时随机触发一条）───────────────────────────
var ASSISTANT_APPOINT_GENERIC = [
  {
    title: '新的职责',
    story: [
      '你将 {NAME} 叫到书房，关上了门。',
      '「从今日起，你将担任我的助手，协助调教庄园中的其他人。」',
      '{NAME} 微微愣住，目光在你脸上停留片刻。',
      '「……助手。」他低声重复，像是在消化这个词的含义。',
      '「是。」',
      '他垂下视线，最终轻轻点头。',
      '「……是，主人。{NAME} 遵从。」',
    ]
  },
  {
    title: '命令与服从',
    story: [
      '「我需要一个助手，」你平静地开口，「你来担任这个职责。」',
      '{NAME} 看着你，神情略显复杂。',
      '「……让我去配合您，调教其他人？」',
      '「是。你已在这里待了足够久，也该做些更有用的事。」',
      '片刻沉默后，他低下头，垂在身侧的手微微握紧。',
      '「……明白了。主人的命令，{NAME} 遵从。」',
    ]
  },
  {
    title: '新的安排',
    story: [
      '「有件事想告诉你，」你开口，「今后你将成为我的助手。」',
      '{NAME} 抬起头，眼中带着一丝疑惑。',
      '「助手……是指？」',
      '「协助我对其他奴隶进行调教。你比其他人更了解这里的规矩。」',
      '{NAME} 沉默了好一会儿，最终轻声应答。',
      '「……我会尽力的，主人。」',
      '他的声音里有什么说不清的情绪，但没有继续说下去。',
    ]
  },
  {
    title: '特殊地位',
    story: [
      '你将 {NAME} 升为助手的消息，在庄园中悄悄传开。',
      '「主人，」{NAME} 在你身旁低声说，「这个职责……真的是我能担当的吗？」',
      '「我认为你可以。」你平静地说。',
      '他看向你，眼神里有一丝说不清道不明的情绪。',
      '「……那么，{NAME} 会努力不让主人失望的。」',
    ]
  },
];

// ── 通用重新确认对话（已是助手时再次点击触发）──────────────────────
var ASSISTANT_RECONFIRM_GENERIC = [
  {
    title: '确认',
    story: [
      '{NAME} 已经是你的助手了。',
      '「主人又来找我了，」他平静地说，「有什么吩咐？」',
      '「只是确认一下——你还愿意继续担任这个职责吗？」',
      '{NAME} 微微蹙眉，随即平展开来。',
      '「这是主人的命令。{NAME} 自然遵从。」',
    ]
  },
  {
    title: '不变的答案',
    story: [
      '「你的职责没有变化，」你说，「继续担任我的助手。」',
      '{NAME} 平静地点头。',
      '「是，主人。{NAME} 明白。」',
      '他没有多余的问题，只是静静等待你的下一句话。',
      '那双眼睛里，有什么东西已经慢慢沉淀下来。',
    ]
  },
];

// ── 助手自我调教时的特殊对话 ─────────────────────────────────────
var ASSISTANT_SELF_TRAIN_STORY = {
  title: '自我调教',
  story: [
    '你下达了一个不同寻常的命令——让 {NAME} 对自己进行训练。',
    '他愣了一下，随即陷入沉默。',
    '「……主人的意思是，让我自己……?」',
    '「正是。」',
    '{NAME} 没有再多问，只是低下头。',
    '「……是，主人。{NAME} 遵命。」',
    '那一刻，他的表情比平时多了一丝说不清楚的复杂。',
  ]
};

// ── 角色专属任命对话（空框架，按 charId 填写）─────────────────────
// 格式: charId数字: [ { title: '...', story: ['...', ...] }, ... ]
// 有内容时，优先于通用对话触发第一条（index 0）
var ASSISTANT_CHAR_STORIES = {
  // ── 填写示例（取消注释并替换 charId 与内容即可）──
  // 101: [
  //   {
  //     title: '特殊的邀请',
  //     story: [
  //       '{NAME}看向你，眼中有不同寻常的神情。',
  //       '「……主人选择了我，真的不后悔吗？」',
  //       '「不后悔。」',
  //       '他低下头，声音里藏着一丝温度。',
  //       '「……那{NAME}就……姑且接受这个职责了。」',
  //     ]
  //   }
  // ],
};

// ============================================================
// ASSISTANT_COMMAND_STORIES
// 助手调教模式下，点击任意指令按钮时优先触发的助手↔奴隶专属剧情
//
// 【触发条件】
//   State.assistantMode === true 时，game.js 会优先在此查找
//   若此处无对应指令条目，自动回退到 COMMAND_STORIES（主人剧情）
//
// 【好感度来源】
//   relationship.js 的 getSlaveRelation(助手id, 奴隶id)，范围 -100~100
//   affRange: [最低值(含), 最高值(不含)]
//   建议分段：[0,25) 陌生  [25,55) 熟识  [55,100] 亲密
//
// 【性格分支】
//   按奴隶性格匹配，优先 branches 里的正则键，无匹配则用 '_default'
//
// 【占位符】
//   {slave}       → 奴隶名       {ta} / {tade}           → 他/他 · 他的/他的（奴隶）
//   {helper}      → 助手名       {helper_ta}/{helper_tade} → 他/他 · 他的/她的（助手）
//   {master}      → 主人称呼（本场景较少出现）
//
// 【关于助手自我调教】
//   若助手 = 被调教目标，相关神力/平行时空剧情存于
//   helper_selftrain_stories.js（由作者另行填写）
// ============================================================

var ASSISTANT_COMMAND_STORIES = {

  // ══════════════════════════════════════════════════════════
  //  亲吻
  // ══════════════════════════════════════════════════════════
  '亲吻': { stages: [

    { affRange: [0, 25], branches: {
      '高傲|傲娇': [
        {
          story: [
            '{master}让{helper}去亲吻{slave}，{slave}的眉头立刻皱了起来。',
            '「……{helper}？」{ta}扬起下巴，语气里带着明显的不情愿。',
            '{helper}没有废话，俯下身，轻轻地印上去。',
            '{slave}愣了一下——{ta}以为{helper}会粗暴，结果却是这样。',
            '「……」{ta}什么都没说，只是把脸别开了，耳根有些红。',
          ],
          effects: { lust: 3, affection: 2 },
        },
      ],
      '温柔|温和': [
        {
          story: [
            '{helper}轻声问：「可以吗？」',
            '{slave}迟疑了一下，轻轻点了头。',
            '{helper}俯身，吻落得很浅，像是一朵花轻轻触碰水面。',
            '{slave}的手指微微收紧，闭上了眼睛。',
            '「……{helper}，」{ta}分开后轻声说，「你……很温柔。」',
          ],
          effects: { lust: 3, affection: 4 },
        },
      ],
      '冷漠|无口|安静': [
        {
          story: [
            '{helper}接到吩咐，走近，没有多余的话，直接俯身。',
            '{slave}的睫毛颤了一下，但没有躲开。',
            '沉默的两个人，沉默地完成了这次接触。',
            '「……」{slave}没有说话，只是低下了头。',
            '那一刻，空气里有什么东西悄悄变了。',
          ],
          effects: { lust: 2, affection: 3 },
        },
      ],
      '活泼|开朗|元气': [
        {
          story: [
            '「哦哦哦！{helper}来亲{slave}！」旁观的视角让这一幕显得格外微妙。',
            '{slave}的脸刷地红了：「别、别那么说——」',
            '{helper}已经俯下身，{slave}措手不及，被亲了一下。',
            '「哇——！」{slave}捂住嘴，眼睛睁得大大的。',
            '{helper}直起身，神情平静：「主人的命令。」',
            '「……你好过分！！」{slave}喊，但脸都笑开了。',
          ],
          effects: { lust: 3, affection: 5 },
        },
      ],
      '_default': [
        {
          story: [
            '{master}的命令让{helper}走近了{slave}。',
            '{slave}没有来得及反应，{helper}已经俯身，唇轻轻触上{tade}。',
            '只是一瞬，却让{slave}的呼吸乱了一拍。',
            '「……」两个人都没有说话，场面沉默了片刻。',
          ],
          effects: { lust: 3, affection: 2 },
        },
      ],
    }},

    { affRange: [25, 55], branches: {
      '高傲|傲娇': [
        {
          story: [
            '{slave}看见{helper}靠近，没有退，只是把脸偏了一点。',
            '「……走程序就走程序。」{ta}语气冷淡，但脖子已经微微发红。',
            '{helper}轻笑了一下，「哪里是走程序。」',
            '然后俯下身，亲了{ta}——比上一次久一些。',
            '{slave}的手指不自觉地攥紧，「……你不用那么认真的。」',
            '「我就是这样。」{helper}平静地说。',
          ],
          effects: { lust: 5, affection: 5 },
        },
      ],
      '_default': [
        {
          story: [
            '{helper}靠近，{slave}已经习惯性地微微仰起了头。',
            '——{ta}自己都没意识到这个动作。',
            '{helper}的唇轻轻覆上来，{slave}的眼睫颤了颤，缓缓阖上。',
            '「……{helper}，」{ta}分开后低声说，「你今天……比上次更久。」',
            '「因为你更配合了。」{helper}轻描淡写地回。',
          ],
          effects: { lust: 5, affection: 6 },
        },
      ],
    }},

    { affRange: [55, 200], branches: {
      '高傲|傲娇': [
        {
          story: [
            '{slave}的手主动抬起来，攥住了{helper_tade}衣襟，把{helper_ta}往自己这边带了带。',
            '「……」{ta}没有说话，只是这个动作已经说明了一切。',
            '{helper}低头，吻落下来，这次没有浅尝即止。',
            '{slave}闭着眼睛，发出了一声极低的、几乎听不见的喘息。',
            '——傲气在这一刻彻底消融，{ta}只是一个想要被亲吻的人。',
          ],
          effects: { lust: 8, affection: 9 },
        },
      ],
      '_default': [
        {
          story: [
            '{slave}在{helper}走近时，自己先靠了过去。',
            '「……{helper}，」{ta}轻声说，「不用等命令的。」',
            '{helper}停了一下，随即弯下身，吻得深了一些。',
            '{slave}的手环上去，将{helper_ta}拉得更近，像是怕{helper_ta}会离开。',
            '这一刻的亲吻不像是调教，更像是两个人之间某种无声的承诺。',
          ],
          effects: { lust: 8, affection: 10 },
        },
      ],
    }},

  ]},


  // ══════════════════════════════════════════════════════════
  //  爱抚
  // ══════════════════════════════════════════════════════════
  '爱抚': { stages: [

    { affRange: [0, 25], branches: {
      '高傲|傲娇': [
        {
          story: [
            '{helper}走近，{slave}微微往旁边让了让。',
            '「……有什么必要让你来。」{ta}语气不好。',
            '{helper}没有理会，手已经轻落在{tade}肩膀上，力道平稳地移动。',
            '{slave}不自觉地松了一点肩膀——{helper_tade}手法比预想的舒服。',
            '「……」{ta}最终没有说什么，只是别开了脸。',
          ],
          effects: { lust: 4, obedience: 2, affection: 1 },
        },
      ],
      '_default': [
        {
          story: [
            '{master}让{helper}来做今天的爱抚，{helper}走近，没有废话。',
            '{slave}的呼吸微微紧了，但没有拒绝。',
            '{helper}的手稳稳地落上去，循序渐进地移动。',
            '{slave}喉咙里低低溢出了声音，身体渐渐放松。',
            '「……{helper}，」{ta}半垂着眼睛，「你……比我以为的要会。」',
          ],
          effects: { lust: 5, obedience: 2, affection: 2 },
          expChanges: { slave: { '爱抚经验': 1 } },
        },
      ],
    }},

    { affRange: [25, 55], branches: {
      '_default': [
        {
          story: [
            '{helper}的手落上去，{slave}已经能辨认出{helper_tade}触碰方式。',
            '这种熟悉让{ta}有些说不清的情绪，但身体已经先一步放松了。',
            '「……今天快一些，」{slave}低声说，「我想早点结束。」',
            '「哦。」{helper}应了，却并没有真的加快，依然从容。',
            '{slave}发出了一声无奈的低哼，最终还是接受了{helper_tade}节奏。',
          ],
          effects: { lust: 6, obedience: 2, affection: 3 },
          expChanges: { slave: { '爱抚经验': 1 } },
        },
      ],
    }},

    { affRange: [55, 200], branches: {
      '_default': [
        {
          story: [
            '{slave}几乎是主动靠近{helper}的——不是服从命令，只是因为{helper_tade}手让{ta}放松。',
            '「……{helper}，」{ta}轻声唤了一声，没有下文，只是贴得更近了。',
            '{helper}的手在{tade}背上缓缓移动，「嗯？」',
            '「……没什么。」{slave}把脸埋进{helper_tade}肩膀。',
            '这场爱抚从调教变成了别的什么，两个人都心知肚明，却谁也没有说破。',
          ],
          effects: { lust: 8, obedience: 1, affection: 8 },
          expChanges: { slave: { '爱抚经验': 2, '爱情经验': 1 } },
        },
      ],
    }},

  ]},


  // ══════════════════════════════════════════════════════════
  //  抚弄发丝
  // ══════════════════════════════════════════════════════════
  '抚弄发丝': { stages: [

    { affRange: [0, 25], branches: {
      '_default': [
        {
          story: [
            '{helper}的手轻轻落在{slave}的头顶，缓缓梳理过那一缕发丝。',
            '{slave}僵了一下，「……这是在做什么？」',
            '「主人的安排。」{helper}平静地说，「放松。」',
            '{slave}磨蹭了片刻，最终还是由着{helper_ta}去了。',
            '——那双手意外地温柔。',
          ],
          effects: { lust: 1, affection: 3 },
        },
      ],
    }},

    { affRange: [25, 55], branches: {
      '_default': [
        {
          story: [
            '{helper}的手指穿过{slave}的发丝，轻轻梳理着。',
            '{slave}的眼睛慢慢半阖下来，像一只被顺毛的猫。',
            '「……{helper}，」{ta}迷迷糊糊地说，「你每次都这样，我会睡着的。」',
            '「睡就睡吧。」{helper}轻声说，手没有停。',
          ],
          effects: { lust: 1, affection: 5 },
        },
      ],
    }},

    { affRange: [55, 200], branches: {
      '_default': [
        {
          story: [
            '{slave}没等{helper}开口，就把头靠到了{helper_tade}腿上。',
            '「……{helper}，摸摸我。」',
            '{helper}停顿了一瞬，随即伸手，手指缓缓穿过{tade}发丝。',
            '{slave}闭上眼睛，嘴角弯了起来。',
            '「……我喜欢{helper}的手。」{ta}轻声说，几乎像是在做梦。',
          ],
          effects: { lust: 2, affection: 9 },
        },
      ],
    }},

  ]},


  // ══════════════════════════════════════════════════════════
  //  亲肤接触
  // ══════════════════════════════════════════════════════════
  '亲肤接触': { stages: [

    { affRange: [0, 25], branches: {
      '高傲|傲娇': [
        {
          story: [
            '{slave}看着{helper}，脸上的表情写满了不情愿。',
            '「……要抱就快点，别磨磨蹭蹭的。」{ta}撇开脸。',
            '{helper}把手臂轻轻环过去，没有用力，只是稳稳地维持着。',
            '{slave}的肩膀僵了一下，随即慢慢松动。',
            '这种温度……{ta}没想到会觉得还不错。',
          ],
          effects: { lust: 2, affection: 3 },
        },
      ],
      '_default': [
        {
          story: [
            '{helper}走近，手臂缓缓环过{slave}的肩膀。',
            '{slave}没有挣扎，但身体微微僵硬。',
            '「……放松，」{helper}轻声说，「这没什么。」',
            '{slave}深吸一口气，试着让肩膀松下来。',
            '那份体温，意外地平稳而安心。',
          ],
          effects: { lust: 2, affection: 3 },
        },
      ],
    }},

    { affRange: [25, 55], branches: {
      '_default': [
        {
          story: [
            '{helper}的手臂自然地揽过{slave}，{slave}已经不再像最初那样僵硬。',
            '「……{helper}，」{ta}靠着{helper_ta}，「你今天有点冷。」',
            '「是吗。」{helper}没有解释，只是把另一只手也添上去，更紧了一些。',
            '{slave}「嗯」了一声，没有说话，只是悄悄贴近了一点。',
          ],
          effects: { lust: 2, affection: 5 },
        },
      ],
    }},

    { affRange: [55, 200], branches: {
      '_default': [
        {
          story: [
            '{slave}直接走到{helper}面前，把脸埋进{helper_tade}颈窝，「……抱着我。」',
            '{helper}的手臂环上来，不紧不慢。',
            '「今天发生什么了？」{helper}轻声问。',
            '「……没有，」{slave}的声音很低，「就是想被{helper}抱着。」',
            '{helper}没有说话，只是把{ta}抱得更紧了一些。',
            '那一刻无需理由，也无需命令。',
          ],
          effects: { lust: 3, affection: 9 },
        },
      ],
    }},

  ]},


  // ══════════════════════════════════════════════════════════
  //  聊天
  // ══════════════════════════════════════════════════════════
  '聊天': { stages: [

    { affRange: [0, 25], branches: {
      '冷漠|无口|安静': [
        {
          story: [
            '{master}安排{helper}去找{slave}说说话。',
            '两个人坐在一起，沉默了很久。',
            '「……你有什么想说的吗？」{helper}率先开口。',
            '「没有。」{slave}简短地回答。',
            '又沉默了一会儿。',
            '「……」「……」',
            '不知为何，这场沉默并没有那么令人不舒服。',
          ],
          effects: { affection: 2 },
        },
      ],
      '活泼|开朗|元气': [
        {
          story: [
            '{slave}一看见{helper}过来，立刻凑上去：「{helper}！你有没有听说昨天的事——」',
            '接下来是一段滔滔不绝的话，{helper}静静听着，偶尔「嗯」一声。',
            '「……{helper}，你有在听吗？」{slave}凑近，皱起眉。',
            '「听了，」{helper}平静地复述了三个细节，「继续说。」',
            '{slave}愣了一下，随即咧嘴笑了：「……{helper}你还挺认真的嘛！」',
          ],
          effects: { affection: 4 },
        },
      ],
      '_default': [
        {
          story: [
            '{master}的安排让{helper}找{slave}说说话，{slave}有些疑惑地看着{helper_ta}。',
            '「……聊什么？」',
            '「随便，」{helper}在{ta}旁边坐下，「你想说什么都可以。」',
            '{slave}想了想，最终开口说了一件最近的小事。',
            '{helper}静静听着，适时回应，不评价，也不敷衍。',
            '那场谈话并不长，但{slave}发现自己说了比预期多得多的东西。',
          ],
          effects: { affection: 3 },
        },
      ],
    }},

    { affRange: [25, 55], branches: {
      '_default': [
        {
          story: [
            '{slave}和{helper}随意地聊着，话题从庄园里的事扯到了{helper_tade}从前。',
            '「……{helper}，你以前是什么样的人？」{slave}随口问。',
            '{helper}沉默了片刻，「普通人。」',
            '「不信，」{slave}说，「普通人不会像你这样。」',
            '{helper}没有继续解释，只是微微笑了一下。',
            '那个笑容让{slave}觉得，{helper_ta}身上还有很多自己不知道的事。',
          ],
          effects: { affection: 5 },
        },
      ],
    }},

    { affRange: [55, 200], branches: {
      '_default': [
        {
          story: [
            '{slave}坐到{helper}旁边，把头靠上去，「……{helper}，我能说个秘密吗？」',
            '「说。」',
            '{slave}轻声说了某件只有{ta}自己知道的事，说完之后沉默了一会儿。',
            '「……你不觉得奇怪吗？」{ta}问。',
            '「不觉得。」{helper}平静地回答，「谢谢你告诉我。」',
            '{slave}的眼眶微微发热，把头埋得更低了一些。',
          ],
          effects: { affection: 9 },
        },
      ],
    }},

  ]},


  // ══════════════════════════════════════════════════════════
  //  辱骂
  //  （助手被命令辱骂奴隶——通常是调教强化手段）
  // ══════════════════════════════════════════════════════════
  '辱骂': { stages: [

    { affRange: [0, 25], branches: {
      '高傲|傲娇': [
        {
          story: [
            '{master}让{helper}去辱骂{slave}，{slave}扬起下巴，神情不屑。',
            '「……{helper}要骂我？」{ta}冷笑，「就你？」',
            '{helper}直视着{ta}，语气平静却精准地说出了{ta}心里最薄弱的那处。',
            '{slave}的表情瞬间一变——{ta}没想到{helper}知道那么多。',
            '「……」{ta}沉默下来，傲气有了第一道裂缝。',
          ],
          effects: { obedience: 4, affection: -1 },
        },
      ],
      '温柔|温和': [
        {
          story: [
            '{helper}开口，语气压低，说了几句很刻薄的话。',
            '{slave}的眼睛立刻红了，「……{helper}……你为什么……」',
            '{helper}的表情微微变了一下，「……这是主人的命令。」',
            '{ta}说完，别开了视线。',
            '——这是{helper}最难受的一次执行任务。',
          ],
          effects: { obedience: 3, affection: -2 },
        },
      ],
      '_default': [
        {
          story: [
            '{helper}走近，语调平静地说出了一段贬低性的话。',
            '{slave}的肩膀微微沉了下去，「……{helper}……」',
            '「这是规定的训练内容，」{helper}低声补了一句，「不是我的意思。」',
            '{slave}沉默了片刻，最终轻轻点了点头。',
            '——知道这一点，让{ta}心里好受了一些。',
          ],
          effects: { obedience: 3, affection: 0 },
        },
      ],
    }},

    { affRange: [25, 55], branches: {
      '_default': [
        {
          story: [
            '{helper}被要求辱骂{slave}，{slave}已经了解这是调教的一部分，却还是忍不住皱起了眉。',
            '{helper}的话说得很轻，但每一个字都戳在要害。',
            '{slave}低着头，「……你知道我最怕什么，」{ta}低声说，「所以用这个。」',
            '「是，」{helper}的声音软下来一点，「……对不起。」',
            '这一声道歉不在调教计划里，却让{slave}意外地好受了一些。',
          ],
          effects: { obedience: 4, affection: 1 },
        },
      ],
    }},

    { affRange: [55, 200], branches: {
      '_default': [
        {
          story: [
            '{master}让{helper}辱骂{slave}，{helper}看了{slave}一眼，沉默了一下。',
            '「……{slave}，」{helper}开口，声音很低，「你知道我接下来要说什么不是真心话。」',
            '{slave}点了点头。',
            '{helper}说出了那些话——但语气里有什么微妙的东西，让{slave}感受到的是保护，而不是伤害。',
            '结束后，{helper}轻轻拍了拍{slave}的肩膀，什么都没说。',
            '{slave}的眼眶有点热，「……嗯。」',
          ],
          effects: { obedience: 3, affection: 3 },
        },
      ],
    }},

  ]},


  // ══════════════════════════════════════════════════════════
  //  玩弄小穴
  // ══════════════════════════════════════════════════════════
  '玩弄小穴': { stages: [

    { affRange: [0, 25], branches: {
      '高傲|傲娇': [
        {
          story: [
            '「……让{helper}来？」{slave}蹙起眉，语气里带着明显的抵触。',
            '{helper}没有解释，蹲下身，手指轻触上去。',
            '{slave}的身体猛地一颤，「……！」',
            '「——比看起来湿。」{helper}平静地观察，「身体挺诚实的。」',
            '「……给我闭嘴！」{slave}几乎是咬牙切齿，却没有真的要逃。',
          ],
          effects: { lust: 7, obedience: 3 },
          expChanges: { slave: { 'V经验': 1 } },
        },
      ],
      '_default': [
        {
          story: [
            '{master}下令，{helper}走近{slave}，动作轻柔而直接。',
            '{slave}低低地喘了一声，膝盖不自觉地往内并。',
            '「放松，」{helper}低声说，「这样会更舒服。」',
            '{slave}勉强照做，{helper}的手指也随之深入了一些。',
            '{ta}发出了一声压抑的低鸣，把脸埋进了手臂里。',
          ],
          effects: { lust: 7, obedience: 3 },
          expChanges: { slave: { 'V经验': 1 } },
        },
      ],
    }},

    { affRange: [25, 55], branches: {
      '高傲|傲娇': [
        {
          story: [
            '{slave}看见{helper}靠近，腿已经微微发软了——{ta}自己都能感觉到。',
            '「……」{ta}没有出声，主动往后退了半步，背抵上了墙。',
            '{helper}蹲下身，「别逃了。」',
            '{slave}烧红了脸，但到底没有再动。',
            '{helper}的手指触上去，{slave}立刻低低地溢出了声音。',
            '「……比第一次松多了，」{helper}若有所思，「有进步。」',
            '「……你给我闭嘴。」{slave}低声，眼角沁出了一点水汽。',
          ],
          effects: { lust: 9, obedience: 2, affection: 3 },
          expChanges: { slave: { 'V经验': 2 } },
        },
      ],
      '_default': [
        {
          story: [
            '{helper}接到命令，{slave}已经微微张开了腿——习惯性的配合。',
            '「……今天比较乖，」{helper}轻声说。',
            '「……闭嘴，」{slave}低声回，但没有否认。',
            '{helper}的手指深入，{slave}内壁轻轻收紧，把脸侧向一边，喘着气。',
          ],
          effects: { lust: 9, obedience: 2, affection: 3 },
          expChanges: { slave: { 'V经验': 2, '爱抚经验': 1 } },
        },
      ],
    }},

    { affRange: [55, 200], branches: {
      '_default': [
        {
          story: [
            '{slave}甚至在{helper}还没动手之前，已经微微湿润了——那份期待让{ta}有点羞耻。',
            '{helper}的手指触上去，{slave}的呼吸立刻乱了，身体紧紧靠上来。',
            '「……{helper}，」{ta}轻声说，「不要……不要停。」',
            '{helper}低头，贴着{tade}耳边：「不会停的。」',
            '那一刻，调教的名分已经不重要——重要的是这份彻底的信任。',
          ],
          effects: { lust: 13, obedience: 2, affection: 8 },
          expChanges: { slave: { 'V经验': 2, '爱情经验': 2 } },
        },
      ],
    }},

  ]},


  // ══════════════════════════════════════════════════════════
  //  玩弄阴茎
  // ══════════════════════════════════════════════════════════
  '玩弄阴茎': { stages: [

    { affRange: [0, 25], branches: {
      '高傲|傲娇': [
        {
          story: [
            '「……让你来？」{slave}侧开脸，声音很冷。',
            '「主人的命令。」{helper}语气平静，手已经包裹上去。',
            '{slave}猛地吸了一口气——力道拿捏得准，让{ta}措手不及。',
            '「……哈，」{helper}的手没有停，「身体挺诚实的。」',
            '{slave}攥紧了拳头，眼神别到一旁，强忍着没有开口。',
          ],
          effects: { lust: 6, obedience: 2 },
          expChanges: { slave: { '爱抚经验': 1 } },
        },
      ],
      '_default': [
        {
          story: [
            '{helper}按照命令接近，握上去，手法不急不缓。',
            '{slave}喉咙里溢出一声低闷的喘息，随即抿住嘴唇。',
            '「放松，」{helper}平静说，「这样会更快结束。」',
            '{slave}半信半疑地照做，结果发现{helper}说得没错。',
          ],
          effects: { lust: 5, obedience: 3 },
          expChanges: { slave: { '爱抚经验': 1 } },
        },
      ],
    }},

    { affRange: [25, 55], branches: {
      '_default': [
        {
          story: [
            '{helper}接到命令，走近，{slave}已经微微移开了视线。',
            '「……又来了。」{ta}轻声念叨，却没有真的拒绝。',
            '{helper}握上去，手法比最初熟悉了许多。',
            '{slave}喉咙里低低地溢出声音，伏得更低了一些。',
            '「……{helper}，」{ta}喘息间开口，「你……记得我喜欢哪种力道。」',
            '「大概是的。」{helper}也轻声回答。',
          ],
          effects: { lust: 8, obedience: 2, affection: 4 },
          expChanges: { slave: { '爱抚经验': 2 } },
        },
      ],
    }},

    { affRange: [55, 200], branches: {
      '_default': [
        {
          story: [
            '{slave}看见{helper}走来，身体先于意识有了反应。',
            '「……已经知道你要做什么了。」{ta}低声说，语气里有一丝说不清的甜。',
            '{helper}握上去，感受着{tade}反应，「那就好好感受。」',
            '{slave}喘息着，将头埋进手臂里，任由{helper}主导。',
            '两个人之间有一种奇妙的默契——身体已经懂得彼此。',
          ],
          effects: { lust: 12, obedience: 2, affection: 7 },
          expChanges: { slave: { '爱抚经验': 2, '爱情经验': 1 } },
        },
      ],
    }},

  ]},


  // ══════════════════════════════════════════════════════════
  //  阴蒂爱抚•助手命令
  //  阴茎爱抚•助手命令
  //  胸爱抚•助手命令
  //  玩弄小穴•助手命令
  //  肛门爱抚•助手命令
  //  插入•助手命令
  //  肛插入•助手命令
  //  ↑ 这些是助手调教模式下专属的按钮指令，同样走本对象查找
  // ══════════════════════════════════════════════════════════

  '阴蒂爱抚•助手命令': { stages: [
    { affRange: [0, 25], branches: {
      '高傲|傲娇': [
        {
          story: [
            '{master}一声令下，{helper}走近了{slave}。',
            '「……我来。」{helper}平静地开口，语气里没有多余的情绪。',
            '{slave}微微扬起下巴，神色不屑：「是{helper}吗。」',
            '{helper}没有搭话，指尖轻巧地触碰敏感处。',
            '{slave}的呼吸瞬间乱了——{ta}没想到会这么直接，更没想到这么准。',
            '「……你、你别那么用力——！」',
            '{helper}微微抬眼，神情平静：「没什么好藏着的。」',
          ],
          effects: { lust: 6, obedience: 2 },
          expChanges: { slave: { '爱抚经验': 1 } },
        },
      ],
      '_default': [
        {
          story: [
            '{master}的指令落下，{helper}走近，在{slave}面前蹲下身。',
            '{slave}看着{helper}，什么也没说。',
            '{helper}的手指开始移动，手法熟练而精确。',
            '{slave}的身体微微绷紧——{ta}不习惯这样被人看穿。',
            '沉默中，{slave}的呼吸渐渐乱了，却依然没有出声。',
          ],
          effects: { lust: 5, obedience: 3 },
          expChanges: { slave: { '爱抚经验': 1 } },
        },
      ],
    }},
    { affRange: [25, 55], branches: {
      '_default': [
        {
          story: [
            '{slave}已经微微期待了——{ta}自己都感觉到了，为此有点恼怒。',
            '{helper}蹲下身，指尖熟练地触上去。',
            '{slave}的嘴唇颤了颤，努力维持着漫不经心的表情——',
            '但指尖蜷起的弧度，已经说明了一切。',
          ],
          effects: { lust: 8, obedience: 2, affection: 3 },
          expChanges: { slave: { '爱抚经验': 1 } },
        },
      ],
    }},
    { affRange: [55, 200], branches: {
      '_default': [
        {
          story: [
            '{slave}几乎是主动靠近了{helper}，将{helper_tade}手引向自己。',
            '「……我知道，」{ta}轻声说，「但还是想让{helper}来。」',
            '{helper}轻笑了一声，指尖开始移动，「任性。」',
            '{slave}闭上眼睛，发出了一声很放松的喘息。',
            '这一刻没有主人的命令，只有两个人之间安心的温度。',
          ],
          effects: { lust: 12, obedience: 2, affection: 8 },
          expChanges: { slave: { '爱抚经验': 2, '爱情经验': 1 } },
        },
      ],
    }},
  ]},

  '阴茎爱抚•助手命令': { stages: [
    { affRange: [0, 25], branches: {
      '_default': [
        {
          story: [
            '{master}命令{helper}上前，{helper}走近{slave}，没有多余的话。',
            '{slave}没有挣扎，但呼吸明显紧了。',
            '{helper}的手稳稳地包裹上去，手法不急不缓。',
            '{slave}喉咙里溢出一声低闷的喘息，随即紧紧抿住了嘴唇。',
            '「放松，」{helper}平静说，「这样会更快结束。」',
          ],
          effects: { lust: 5, obedience: 3 },
          expChanges: { slave: { '爱抚经验': 1 } },
        },
      ],
    }},
    { affRange: [25, 200], branches: {
      '_default': [
        {
          story: [
            '{slave}已经摸清了{helper}的节奏，这次顺从地闭上了眼睛。',
            '{helper}握上去，手法比最初熟悉了许多。',
            '{slave}喉咙里低低地溢出声音，身体伏得更低了一些。',
            '「……你，」{ta}喘息间说，「比以前……会了很多。」',
            '「因为我记得你喜欢哪种力道。」{helper}轻声回。',
          ],
          effects: { lust: 9, obedience: 2, affection: 5 },
          expChanges: { slave: { '爱抚经验': 2 } },
        },
      ],
    }},
  ]},

  '胸爱抚•助手命令': { stages: [
    { affRange: [0, 25], branches: {
      '温柔|温和': [
        {
          story: [
            '{helper}没有突然伸手，而是先轻声问了一句：「可以吗？」',
            '{slave}的眼睛微微睁大，随即低下头，轻轻点了点。',
            '{helper}的手覆上去，掌心的温度透过薄薄的衣料传进来。',
            '{slave}没有出声，只是微微颤了一下，像是叶子在风里轻轻摇晃。',
            '「……暖的。」{ta}喃喃地说，像是在说给自己听。',
          ],
          effects: { lust: 4, affection: 4 },
          expChanges: { slave: { '爱抚经验': 1 } },
        },
      ],
      '_default': [
        {
          story: [
            '{master}命令{helper}上前，{helper}走近，手落在{slave}胸口。',
            '{slave}的呼吸微微发紧，手指不自觉地攥紧了衣料。',
            '{helper}力道不重，却非常有感觉，{slave}喉咙里低低地溢出了声音。',
            '「……这里比你想象的敏感，」{helper}平静地说，「记住。」',
          ],
          effects: { lust: 5, obedience: 2 },
          expChanges: { slave: { '爱抚经验': 1 } },
        },
      ],
    }},
    { affRange: [25, 200], branches: {
      '_default': [
        {
          story: [
            '{slave}已经习惯了{helper}的触碰方式，身体比脑子先一步放松了下来。',
            '{helper}的手覆上去，动作流畅，像是很久以前就记住了这个弧度。',
            '{slave}低低地喘着气，半垂着眼帘，「……{helper}，你很清楚我。」',
            '「大概是的。」{helper}也轻声回答。',
          ],
          effects: { lust: 8, obedience: 2, affection: 5 },
          expChanges: { slave: { '爱抚经验': 2 } },
        },
      ],
    }},
  ]},

  '玩弄小穴•助手命令': { stages: [
    { affRange: [0, 25], branches: {
      '高傲|傲娇': [
        {
          story: [
            '「……这种地方，让{helper}来？」{slave}的声音带着明显的抵触。',
            '「主人的命令。」{helper}语气平静，「转过去。」',
            '{slave}磨蹭了片刻，照做了——知道不服从没有用。',
            '{helper}的手指轻触最私密的地方，{slave}几乎反射性地想要夹紧。',
            '「放松。」{helper}再度开口，语气不带评判。',
            '{slave}的呼吸急促起来，勉强压下了那股本能的抗拒。',
          ],
          effects: { lust: 7, obedience: 3 },
          expChanges: { slave: { 'V经验': 1 } },
        },
      ],
      '_default': [
        {
          story: [
            '{master}下令，{helper}蹲下身，手指轻触{slave}最私密的地方。',
            '{slave}发出一声低哑的喘息，膝盖忍不住微微弯曲。',
            '「放松，」{helper}低声说，手指缓缓深入，「这样才不会不舒服。」',
            '{slave}的手指攥紧了，却没有要逃开的意思，只是低低地喘着气，承受着。',
          ],
          effects: { lust: 7, obedience: 3 },
          expChanges: { slave: { 'V经验': 1 } },
        },
      ],
    }},
    { affRange: [25, 200], branches: {
      '_default': [
        {
          story: [
            '{slave}这次没有多说什么，默默配合了{helper}，将重心调整好。',
            '「……你习惯了？」{helper}轻声问。',
            '「……不习惯，」{slave}的声音很低，「但……不会抗拒了。」',
            '{helper}的手指深入，{slave}低低地呻吟了一声，内壁微微收紧。',
          ],
          effects: { lust: 9, obedience: 2, affection: 3 },
          expChanges: { slave: { 'V经验': 2 } },
        },
      ],
    }},
  ]},

  '肛门爱抚•助手命令': { stages: [
    { affRange: [0, 25], branches: {
      '_default': [
        {
          story: [
            '{master}下令，{helper}走近，手指轻触{slave}后方。',
            '{slave}的身体微微一僵，低低地发出一声：「……这里？」',
            '「嗯。」{helper}应了一声，「放松身体，不然会难受。」',
            '{slave}咬着牙，勉强放松了绷紧的肌肉。',
            '{helper}的手指缓缓移动，{slave}发出了一声压抑的低鸣。',
          ],
          effects: { lust: 6, obedience: 4 },
          expChanges: { slave: { 'A经验': 1 } },
        },
      ],
    }},
    { affRange: [25, 200], branches: {
      '_default': [
        {
          story: [
            '{slave}这次没有多说什么，默默配合，将姿势调整好了。',
            '「……你今天配合很多。」{helper}轻声说。',
            '「……不习惯，」{slave}的声音很低，「但……不会抗拒了。」',
            '{helper}的手指深入，{slave}低低地呻吟了一声。',
            '「……有进步。」{helper}轻描淡写地说。',
          ],
          effects: { lust: 8, obedience: 3, affection: 3 },
          expChanges: { slave: { 'A经验': 2 } },
        },
      ],
    }},
  ]},

  '插入•助手命令': { stages: [
    { affRange: [0, 25], branches: {
      '温柔|温和': [
        {
          story: [
            '{slave}看了{helper}很久，最后只是轻轻点了头，「……嗯。」',
            '{helper}俯身，动作缓慢，每一步都很轻，很谨慎。',
            '{slave}的呼吸越来越急，手攥住了{helper_tade}手臂。',
            '「……痛吗？」{helper}停下来问。',
            '「……一点，」{slave}的声音很轻，「但是……没关系，继续。」',
            '{helper}继续，慢慢地，将两人之间的距离缩到最短。',
          ],
          effects: { lust: 8, obedience: 3, affection: 5 },
          expChanges: { slave: { 'V经验': 2, '性交经验': 1 } },
        },
      ],
      '_default': [
        {
          story: [
            '{helper}按照命令接近，{slave}的呼吸明显乱了，但还是配合了。',
            '「……放松身体，」{helper}低声提醒，「会更好受。」',
            '{slave}努力照做——深入的感觉还是让{ta}发出了一声低哑的叫声。',
            '{helper}停住，「怎么样？」',
            '「……没事，」{slave}闭着眼，「继续。」',
          ],
          effects: { lust: 9, obedience: 4, affection: 2 },
          expChanges: { slave: { 'V经验': 2, '性交经验': 1 } },
        },
      ],
    }},
    { affRange: [25, 55], branches: {
      '_default': [
        {
          story: [
            '{slave}已经摸清了{helper}的节奏，身体比最初配合得多。',
            '{helper}深入，{slave}轻轻叹了口气，内里收紧了一下，像是欢迎。',
            '「……你今天来得比较快。」{helper}轻声说。',
            '「……少废话。」{slave}低声回，但腰已经悄悄往{helper_ta}那边靠了靠。',
          ],
          effects: { lust: 11, obedience: 2, affection: 5 },
          expChanges: { slave: { 'V经验': 3, '性交经验': 1 } },
        },
      ],
    }},
    { affRange: [55, 200], branches: {
      '_default': [
        {
          story: [
            '{slave}在{helper}深入的瞬间，用双臂抱住了{helper_ta}，把{helper_ta}拉得更近。',
            '「……{helper}，」{ta}喘息着，「不要只是走形式。」',
            '{helper}低头，将额头抵在{tade}额头上，「我知道。」',
            '这场以命令开始的调教，在这一刻已经悄悄变成了别的什么。',
            '{slave}的眼角沁出一点水汽，把脸藏进{helper_tade}颈窝，喘息着。',
          ],
          effects: { lust: 14, obedience: 2, affection: 10 },
          expChanges: { slave: { 'V经验': 3, '性交经验': 2, '爱情经验': 2 } },
        },
      ],
    }},
  ]},

  '肛插入•助手命令': { stages: [
    { affRange: [0, 25], branches: {
      '_default': [
        {
          story: [
            '{master}的命令下来，{helper}轻声告知{slave}接下来会发生什么。',
            '{slave}的呼吸立刻急促了，但还是配合地调整了姿势。',
            '{helper}先充分抚弄，确认足够放松后，才缓缓开始。',
            '{slave}发出了一声压抑的呻吟，手指攥进了床铺。',
            '「……慢、慢一点。」{ta}低声请求。',
            '「好。」{helper}没有犹豫，放慢了。',
          ],
          effects: { lust: 8, obedience: 5, affection: 2 },
          expChanges: { slave: { 'A经验': 2 } },
        },
      ],
    }},
    { affRange: [25, 55], branches: {
      '_default': [
        {
          story: [
            '{slave}已经摸清了该如何配合才能减少不适，这次顺从地调整好了姿势。',
            '{helper}的动作依然谨慎，「……今天比上次更松。」',
            '「……不要说这种话。」{slave}嘟囔，但语气里已经没有了愤怒。',
            '{helper}深入，{slave}发出了一声较为顺畅的呻吟。',
          ],
          effects: { lust: 10, obedience: 3, affection: 4 },
          expChanges: { slave: { 'A经验': 2 } },
        },
      ],
    }},
    { affRange: [55, 200], branches: {
      '_default': [
        {
          story: [
            '{slave}靠着{helper}，将最私密的地方主动送向{helper_ta}，神情里有一丝复杂。',
            '{helper}缓缓深入，{slave}的手抓住了{helper_tade}手腕——不是要阻止，而是需要一个依靠。',
            '「……{helper}，」{ta}轻声呢喃，「……在。」',
            '「在。」{helper}低头，回答了这句没有尽头的话。',
          ],
          effects: { lust: 13, obedience: 2, affection: 9 },
          expChanges: { slave: { 'A经验': 3, '爱情经验': 1 } },
        },
      ],
    }},
  ]},

};
