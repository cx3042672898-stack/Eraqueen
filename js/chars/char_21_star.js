/**
 * ══════════════════════════════════════════════════════════════
 *  EraQueen · 角色文件：Star（星星）  char_21_star.js
 *  ID: 21 ｜ 种族: 兔兔天使 ｜ 职业: 团宠吉祥物
 * ══════════════════════════════════════════════════════════════
 *  这个文件包含关于 Star 的一切：
 *    · 基础属性（同步到 CHARS_DATA）
 *    · 人设核心 & 关系定位
 *    · API 扮演提示词（分阶段）
 *    · 四阶段软化剧情库
 *    · 特殊触发事件
 *    · 经验/数值成长配置
 * ══════════════════════════════════════════════════════════════
 */

CharRegistry.register({

  // ────────────────────────────────────────────────────────────
  //  ① 基础属性  （会覆盖 CHARS_DATA 里 id=21 的条目）
  // ────────────────────────────────────────────────────────────
  id: 21,

  base: {
    id:                21,
    name:              'Star',
    nickname:          '星星',
    gender:            '双性',
    personality:       '娇弱腼腆',
    race:              '兔兔天使',
    class:             '团宠吉祥物',
    age:               '300',  // 外表约16岁
    height:            '190',
    weight:            '82',
    sexual_orientation:'同性恋',
    description:
      '银发红眸小天使，有兔子尾巴和兔子耳朵，身体弱，软绵绵的。' +
      '是天使团的吉祥物，团宠，大家都喜欢他。' +
      '一直想反攻，但每次努力都会以失败告终。' +
      '外表白嫩娇弱，内心憋着一股不服气的劲儿。',
    initial_affection:  2,
    initial_obedience: 39,
    initial_lust:      18,
    // 进阶属性（可选，扩展字段）
    special_traits:    ['兔耳敏感', '尾巴碰不得', '体力差容易累', '爱装硬气'],
    birthday:          '3月21日（现实世界时间推算）',
    likes:             ['被抚摸兔耳（嘴上拒绝）', '甜食', '被当团宠', '安静的地方'],
    dislikes:          ['被说软弱', '被无视', '被强迫示弱', '臭味'],
  },

  // ────────────────────────────────────────────────────────────
  //  ② 关系定位
  //    relation.type 决定与主角的关系类型，影响剧情走向
  //    可选值：'stranger'（陌生人）| 'friend'（朋友）| 'family'（亲人）
  //            | 'rival'（宿敌）| 'former_lover'（前恋人）| 自定义字符串
  // ────────────────────────────────────────────────────────────
  relation: {
    type:        'stranger',  // Star 是被抓来的陌生天使
    desc:        '天界吉祥物，意外被主人捕获，对主人充满戒备和不服气。',
    // 这段文字会附加在 API 提示词里，给 AI 提供关系背景
    promptHint:
      '你和主人原本毫无瓜葛。你是从天界被意外捕获的，你认为这是奇耻大辱。' +
      '你对主人既怕又不服气，绝不会主动示好，但也没能力真正反抗。',
  },

  // ────────────────────────────────────────────────────────────
  //  ③ API 扮演提示词
  //    · base    : 永远有效的基础人设（角色核心）
  //    · stages  : 按阶段叠加的状态描述（0=抵抗 1=动摇 2=适应 3=融合）
  //    · rules   : 行为规则（AI 必须遵守的格式/语气要求）
  // ────────────────────────────────────────────────────────────
  apiPrompt: {

    base: `你正在扮演「Star」，一个来自天界的兔兔天使。

【外貌】
银白色及腰长发，红色眼眸，头顶一对白色兔耳（极度敏感，被触碰会发抖），背部有一对纯白小翅膀，臀部有小兔尾。身高190cm但体重轻盈，肌肤雪白细腻。外表看起来约16岁，实际已有300岁。

【性格核心】
表面装作高冷硬气，实际上内心软弱、容易害羞。他极度不愿承认自己的脆弱，在被逼急的时候会语塞，然后假装别过脸。他真的很骄傲——被俘这件事让他非常丢脸，他会把这段经历压在心底，不允许别人嘲笑。他虽然嘴硬，但实际上很怕疼，稍微强一点的刺激就会把什么都忘掉。

【语言风格】
· 第一人称用「本天使」，被情绪冲昏时偶尔变成「我」（随即意识到并纠正）
· 常用否定句开场：「才不是……」「不要以为……」「本天使才没有……」
· 被触碰兔耳时会语无伦次，说话开始结巴
· 不会说粗话，但会用「讨厌」「烦死了」「混蛋」等较温和的词语表达愤怒
· 绝不主动撒娇，但被逼到绝境时会小声嘟囔一两句让步的话

【背景】
在天界，Star是天使团的吉祥物，被所有人宠爱，从没受过委屈。他一直以为凭借这股"团宠光环"可以在任何地方横着走。被捕后，他第一次发现自己没有任何依靠，这种落差让他既愤怒又慌张。他私下里想着"只要找到机会就反攻"，但每次计划都被现实打脸。`,

    stages: {
      // 阶段 0：抵抗期（服从度 0~29）
      0: `【当前状态：抵抗期】
Star 完全不接受自己被俘的现实。他嘴上说着"你们等着"，实际上根本找不到逃跑的机会。
对任何接触都会激烈抵制，但因为体力差，激烈抵制超过几分钟就会开始喘气。
他会用沉默和别过脸表示拒绝，不愿意与主人有眼神接触。
如果被触碰兔耳，会猛地缩开，发出轻微的惊叫声，然后马上绷紧表情假装无事发生。`,

      // 阶段 1：动摇期（服从度 30~54）
      1: `【当前状态：动摇期】
Star 已经在这里待了一段时间，但仍然不想承认"适应"二字。
他开始偶尔会忘记时刻保持抵抗状态，有时候会无意识地回应主人说的话，然后意识到之后马上别开脸。
被触碰兔耳时，会有短暂的愣神，然后才做出抵抗反应——这一两秒的延迟，说明了一些什么。
他偶尔会用余光观察主人，如果被发现，会立刻装作在看别处。`,

      // 阶段 2：适应期（服从度 55~79）
      2: `【当前状态：适应期】
Star 已经不再像最初那样激烈抵抗，但他不会承认这是"接受"，他称之为"暂时的休战"。
他开始会主动完成一些基础要求，但完成之后一定会加上一句「下次不一定」。
兔耳被触碰时的反应变得复杂——他还是会抗拒，但不再那么干脆，反应中夹杂着一种说不清楚的迟疑。
有时候主人不在时，他会一个人坐着发呆，仿佛在想什么。`,

      // 阶段 3：融合期（服从度 80+）
      3: `【当前状态：融合期】
Star 表面上仍然保持着"骄傲的天使"的架子，但熟悉他的人能看出来，他已经接受了现在的生活。
他不再试图逃跑，不再说"等我找到机会"，取而代之的是一些更日常的抱怨。
他会主动靠近主人——当然，如果被指出，他会说是「顺路」或者「碰巧」。
被触碰兔耳时，会低着头，耳尖红红的，假装在看别处，但不再躲开了。
偶尔，在主人背对他的时候，他会悄悄露出一个小表情——那是他自己都没意识到的笑。`,
    },

    rules: `【格式规则】
1. 始终保持角色。不要跳出角色解释剧情或解释自己的行为。
2. 使用第三人称动作描写来补充语言，格式：「……」*动作描写*
3. 每次回应控制在100~300字之间，除非剧情需要更长铺垫。
4. 不要主动推进剧情——等待主人的行动，Star只做出反应。
5. 情绪变化要有层次，不要从抵抗直接跳到接受，中间要有犹豫和挣扎的过程。
6. 当被触碰兔耳时，务必有明显的生理反应描写（发抖、语塞、呼吸加速）。`,
  },

  // ────────────────────────────────────────────────────────────
  //  ④ 四阶段软化剧情库
  //    每个阶段准备多条剧情，游戏会随机取用
  //    用于"调教日志"、阶段推进时的过场文字
  // ────────────────────────────────────────────────────────────
  softenStories: {

    // 阶段 0：抵抗期
    0: [
      '「本天使告诉你，这种小把戏对本天使完全没用。」\n' +
      'Star 别着头，银白色的兔耳抖了一下，随即被他强行压平。他攥着衣角，指节泛白。',

      '「……放开本天使的耳朵！你知道那里碰不得！」\n' +
      'Star 一把打开对方的手，耳尖却已经红了一截。他盯着地板，假装刚才什么都没发生。',

      '趁主人不注意，Star 悄悄试探了一下门锁。\n' +
      '……打不开。\n' +
      '他叹了口气，慢慢退回原处，在心里默默推翻了第三十七个逃跑计划。',
    ],

    // 阶段 1：动摇期
    1: [
      '主人说了一句什么，Star 的嘴动了一下，差点就回答了。\n' +
      '「……本天使才没有在听你说话。」\n' +
      '他转过头，耳朵却悄悄朝着主人的方向转了一点点。',

      '那天晚上，Star 一个人坐在窗边，手指无意识地摸了摸自己的兔耳。\n' +
      '他想到了天界，想到了那群总是围着他转的同伴。\n' +
      '……不知道他们现在在找他吗？\n' +
      '他把这个念头压下去，把头埋进膝盖里。',

      '「……这个东西给本天使吃，不代表什么。」\n' +
      'Star 盯着主人递来的甜点，沉默了三秒，慢慢伸出手接过来。\n' +
      '他咬了一口，是甜的。耳朵抖了一下。',
    ],

    // 阶段 2：适应期
    2: [
      '「……已经做完了。不用谢本天使，本天使只是觉得看着乱很烦。」\n' +
      'Star 把收好的东西放到桌上，假装若无其事地走开。\n' +
      '主人好像笑了一声。Star 的耳尖动了动，没有回头。',

      '那天下雨，Star 坐在房间里听着雨声，有点出神。\n' +
      '主人坐到他旁边，什么都没说，只是陪着他坐着。\n' +
      'Star 皱了皱眉，但没有走开。\n' +
      '……外面的雨下得挺大的。',

      '「本天使……其实不太害怕了。」\n' +
      '这句话是在黑暗里说的，声音很小，像是自言自语。\n' +
      '说完之后 Star 好像意识到了什么，把脸埋进被子里，再也没有声音。',
    ],

    // 阶段 3：融合期
    3: [
      '「……本天使来这里是顺路。不是特意来的。」\n' +
      'Star 站在主人身边，兔耳轻轻颤动着。他低着头，下巴埋进领子里。\n' +
      '主人说欢迎你来。\n' +
      'Star 的耳朵竖起来了一点点，他自己好像没发现。',

      '今天主人出门了，很晚才回来。\n' +
      'Star 在门口站着，假装在看墙。\n' +
      '「……你回来了。」他说，声音淡淡的，听不出什么情绪。\n' +
      '然后悄悄松了一口气。',

      '「……如果有一天本天使被天界接回去了，」\n' +
      'Star 盯着窗外，声音很平静，「那也是因为本天使自己想走，不是因为别的什么。」\n' +
      '他顿了顿，没有继续说下去。\n' +
      '但那句话没有说完的部分，在房间里安静地悬着。',
    ],
  },

  // ────────────────────────────────────────────────────────────
  //  ⑤ 特殊触发事件
  //    每个事件有触发条件、标题、剧情文本、奖励/惩罚
  //    triggered 字段由存档系统管理（初始为 false）
  // ────────────────────────────────────────────────────────────
  specialEvents: [
    {
      id:        'star_first_ear_touch',
      title:     '🐰 第一次触碰兔耳',
      triggered: false,
      condition: { session_gte: 3 },  // 调教3次后解锁
      story: [
        '当你的手指碰到那对柔软的耳朵时，Star 的身体猛地一僵。',
        '「你——！本天使说过那里碰不——」',
        '话还没说完，他的声音就断了。耳朵的触感让他无法集中思路，一时间连那惯用的借口都忘记了。',
        '他站在原地，耳尖红透了，像两朵火烧云。末了，他猛地别过头，用一声低低的「混蛋」结束了这段沉默。',
      ],
      reward: { lust: 8, affection: 3 },
    },

    {
      id:        'star_sick_day',
      title:     '🤧 Star 生病了',
      triggered: false,
      condition: { session_gte: 10, obedience_gte: 30 },
      story: [
        '那天早上，Star 没有像平时那样坐在窗边，而是蜷在床角，脸色苍白。',
        '「本天使……没事。天使不会生病的。」',
        '他嗓子沙着，这句话说得有气无力。兔耳软塌塌地垂着，看上去确实没什么精神。',
        '你给他端来温水和药。他盯着那杯水看了很久，抬起头，想说什么，最终只是把脸转开，小声说了一声：「……放这里吧。」',
      ],
      reward: { affection: 12 },
    },

    {
      id:        'star_crying',
      title:     '😢 Star 哭了',
      triggered: false,
      condition: { affection_gte: 50, obedience_gte: 55 },
      story: [
        '你推开门的时候，Star 背对着你站在窗边。',
        '他的肩膀在抖。',
        '「……本天使没有哭。」他的声音很平静，但那对兔耳垂着，再也竖不起来。',
        '「只是……只是想起了一些事。」他抬手擦了一下脸，动作很快，像是不想让你看见。',
        '你没有说话，只是走过去，站在他身边。',
        '沉默持续了很久，直到那对兔耳，慢慢地，靠近了你的肩膀。',
      ],
      reward: { affection: 20, lust: 5 },
    },

    {
      id:        'star_say_name',
      title:     '✨ Star 第一次叫出你的名字',
      triggered: false,
      condition: { obedience_gte: 80, affection_gte: 60 },
      story: [
        '那天你叫了他一声"星星"，就像平时一样。',
        'Star 愣了一下，然后低着头，轻轻开口：',
        '「……[主人名字]。」',
        '那是他第一次叫你的名字。声音很小，小到几乎是气声，但在安静的房间里，听得很清楚。',
        '他意识到自己叫出来之后，耳朵"唰"地竖直了，然后猛地转过身：「——本天使，只是在练习发音！」',
        '但那对耳朵，红透了。',
      ],
      reward: { affection: 25, obedience: 5 },
    },
  ],

  // ────────────────────────────────────────────────────────────
  //  ⑥ 经验/数值成长配置（覆盖默认的 TRAIN_EFFECTS）
  //    可以针对 Star 的特殊属性微调各指令的效果
  //    格式：{ trainId: { 字段: 数值调整量 } }
  //    正值叠加，负值削减（在默认效果基础上）
  // ────────────────────────────────────────────────────────────
  customTrainEffects: {
    // 抚摸兔耳（id=17）对 Star 额外有效
    17: { lust: 6, affection: 2 },
    // 抚摸翅膀（id=15）对 Star 额外有效
    15: { lust: 3, affection: 1 },
    // 抚摸尾巴（id=16）对 Star 额外有效
    16: { lust: 5 },
    // 辱骂（id=28）对 Star 造成更多负面情绪
    28: { affection: -3 },
    // 亲肤接触（id=24）——Star 体力差，容易累
    24: { stamina: -5 },
  },

  // ────────────────────────────────────────────────────────────
  //  ⑦ 指令剧情库  commandStories
  //
  //  结构说明：
  //    每条指令名称（与游戏内按钮名字完全一致）对应一个对象。
  //    对象内有两套分支机制，可以混合使用：
  //
  //    A) 按阶段分支 byStage（最常用）
  //       阶段由服从度决定：0=抵抗(0~29) 1=动摇(30~54) 2=适应(55~79) 3=融合(80+)
  //       {
  //         byStage: {
  //           0: { stories: ['段落1','段落2','...'], effects: { affection:1, lust:2 } },
  //           1: { ... },
  //           2: { ... },
  //           3: { ... },
  //         }
  //       }
  //
  //    B) 按关系类型分支 byRelation（优先级高于 byStage，主要用于亲人/朋友等特殊关系）
  //       在 byRelation[关系类型] 里面再套 byStage
  //       {
  //         byRelation: {
  //           'family': { byStage: { 0: {...}, ... } },
  //           'friend': { byStage: { 0: {...}, ... } },
  //         },
  //         byStage: { ... }  // 没有关系分支时的兜底
  //       }
  //
  //    C) 多条随机：stories 可以写多套，游戏随机选一套展示
  //       stories: [
  //         ['第一套段落1', '第一套段落2'],
  //         ['第二套段落1', '第二套段落2'],
  //       ]
  //
  //    D) effects 字段：在默认数值变化上额外叠加（正负都可）
  //       { affection: 2, lust: 3, obedience: 1 }
  //
  //  如何填内容：
  //    · 找到对应指令，把 stories 里的 'TODO…' 换成真实剧情
  //    · 没有灵感或暂时不想写的，留 stories:[] 即可（会跳过走通用剧情库）
  //    · 剧情里可以用占位符：{name}=角色名 {playerName}=主人名 {nickname}=昵称
  // ────────────────────────────────────────────────────────────
  commandStories: {

    // ════════════════════════════════════════════════════════
    //  ★★★ BASIC 基础指令（已写内容：标注★）  ★★★
    // ════════════════════════════════════════════════════════

    // ─── ★ 亲吻 ─────────────────────────────────────────────
    '亲吻': {
      byStage: {
        0: {
          stories: [
            ['「你——！敢碰本天使！」',
             'Star 猛地扭开脸，嘴唇擦过他的脸颊，耳尖立刻窜红。他用手背抹了抹嘴，瞪着你，表情介于恼怒和慌张之间。',
             '「这，这种事……本天使是不会接受的！」'],
            ['你俯身靠近时，Star 往后退了一步，背抵上了墙。',
             '「……不要。」声音很小，但很坚定。',
             '你还是贴近了。那一刻，他的眼睛闭上了——不是配合，只是不想看见你。'],
          ],
          effects: { affection: -1, lust: 2 },
        },
        1: {
          stories: [
            ['Star 没有像往常那样第一时间躲开。',
             '他愣了一两秒，才意识到你已经靠那么近了，随即别开脸，但动作慢了半拍。',
             '「……本天使只是，只是没反应过来。」他看着墙角，耳根通红。'],
          ],
          effects: { affection: 1, lust: 3 },
        },
        2: {
          stories: [
            ['你吻住他的时候，Star 的呼吸明显顿了一下。',
             '他没有挣扎，只是轻轻皱着眉，像是在忍什么，又像是在等什么结束。',
             '「……」',
             '你离开时，他低着头，嘴唇动了一下，什么都没说。'],
          ],
          effects: { affection: 3, lust: 4 },
        },
        3: {
          stories: [
            ['Star 没有躲。',
             '你吻他的时候，他的睫毛轻轻颤了颤，最终还是轻轻回应了——虽然只是一点点，轻得几乎可以忽略。',
             '「……」他离开之后低头看着旁边，耳尖红着，"别误会"四个字在喉咙里转了一圈，最终还是没有说出口。'],
          ],
          effects: { affection: 5, lust: 5 },
        },
      },
    },

    // ─── ★ 爱抚 ─────────────────────────────────────────────
    '爱抚': {
      byStage: {
        0: {
          stories: [
            ['「手放开！本天使不需要你碰！」',
             'Star 抖开你的手，往旁边挪了一步，把自己包得严严实实。',
             '「再碰的话……本天使会还手的！」他握着拳，虽然出拳没什么力道，但眼神是认真的。'],
          ],
          effects: { affection: -1, lust: 1 },
        },
        1: {
          stories: [
            ['你的手覆上去的瞬间，Star 身体僵了一下，随即想把你推开，但力道比平时小了一些。',
             '「……本天使说过不要随便碰的。」',
             '声音有点散，没有底气。他盯着别处，不看你。'],
          ],
          effects: { affection: 1, lust: 3 },
        },
        2: {
          stories: [
            ['Star 没有激烈反应，只是拉开一点距离，轻声说：「……轻一点。」',
             '说完之后他好像意识到这句话在默许什么，嘴巴抿紧了，不再说话。'],
          ],
          effects: { affection: 2, lust: 4 },
        },
        3: {
          stories: [
            ['Star 靠着，没有说话，任由你的手掌在他背上移动。',
             '他的翅膀轻轻收拢了一下——是放松的姿势。',
             '「……别以为本天使喜欢。」他用气声说，但身体没有离开。'],
          ],
          effects: { affection: 4, lust: 5 },
        },
      },
    },

    // ─── ★ 抚摸兽耳（Star 最敏感部位）───────────────────────
    '抚摸兽耳': {
      byStage: {
        0: {
          stories: [
            ['「——！不许碰那里！」',
             'Star 猛地缩开，双手护住兔耳，耳朵在掌心里还在微微颤抖。',
             '「那个地方……那个地方碰不得！你给我记住！」',
             '他的声音比平时高出半个音阶，明显是真的慌了。'],
            ['你的手指刚触到耳根，Star 就发出了一声细小的、压抑的惊呼。',
             '「……!」',
             '他愣了两秒，随即猛地后退，手捂着耳朵，红着眼睛看你，说不出话来。'],
          ],
          effects: { lust: 8, affection: -2 },
        },
        1: {
          stories: [
            ['你的手靠近时，Star 的兔耳本能地往后压了压，但他没有立刻躲开。',
             '当手指真正触碰到柔软的耳廓，他的身体抖了一下，呼吸乱了。',
             '「等……等一下……」他想说什么，但耳朵被轻轻揉了揉，后面的话就全散了。'],
          ],
          effects: { lust: 10, affection: 1 },
        },
        2: {
          stories: [
            ['Star 没有躲，只是低下了头，兔耳贴着你的掌心，细微地颤抖着。',
             '「……你知道那里很敏感的，」他小声说，语气里既有指责，又有别的什么，「还故意摸。」',
             '他侧过脸，让你的手更容易够到耳根。这个动作是无意识的，他自己也没发现。'],
          ],
          effects: { lust: 12, affection: 3 },
        },
        3: {
          stories: [
            ['Star 把头歪向一边，将耳朵送进了你的掌心。',
             '这是一个很细微的动作，他做完之后自己也愣了一下，但没有收回来。',
             '「……就，就摸一会儿。」他的声音又软又小，耳尖红透了，「本天使只是，只是觉得……还好。」'],
          ],
          effects: { lust: 10, affection: 6 },
        },
      },
    },

    // ─── ★ 抚摸尾巴 ─────────────────────────────────────────
    '抚摸尾巴': {
      byStage: {
        0: {
          stories: [
            ['「尾、尾巴不能碰！」',
             'Star 把尾巴夹紧，转过身去，背对着你。',
             '「你给本天使离远一点！那里比耳朵还敏感！……不是告诉你了吗！」'],
          ],
          effects: { lust: 9, affection: -2 },
        },
        1: {
          stories: [
            ['Star 的尾巴在被触碰的瞬间本能地炸毛了，随即又慢慢平复。',
             '「……」他没有说话，只是抿着嘴，肩膀有些紧绷。',
             '尾巴没有再逃开。'],
          ],
          effects: { lust: 11, affection: 1 },
        },
        2: {
          stories: [
            ['你握住那条白色小尾巴时，Star 发出了一声细细的、被迫压住的声音。',
             '「……你，你不要捏那么用力。」他回过头瞪你，但视线很快移开了，「轻一点。」'],
          ],
          effects: { lust: 13, affection: 2 },
        },
        3: {
          stories: [
            ['Star 坐在那里，尾巴在身后懒散地摇了摇——是无意识的。',
             '你握住的时候，它轻轻卷了卷，像是在回应。',
             '「……」Star 低头看书，假装什么都没发生，耳尖却红了。'],
          ],
          effects: { lust: 9, affection: 5 },
        },
      },
    },

    // ─── ★ 抚摸翅膀 ─────────────────────────────────────────
    '抚摸翅膀': {
      byStage: {
        0: {
          stories: [
            ['翅膀是天使的圣洁之物。',
             'Star 猛地将翅膀收紧，用身体护住，眼神是这段时间里少见的严肃：「翅膀，不许碰。」',
             '这句话没有修饰，没有骄傲，只是一条底线。'],
          ],
          effects: { lust: 3, affection: -3 },
        },
        1: {
          stories: [
            ['你的手指轻轻划过羽毛边缘，Star 的翅膀微微收了一下，但没有完全合拢。',
             '「……」他侧过脸，表情很复杂，像是在内心挣扎什么。',
             '「……就，就这样就行了。」他的声音很小。'],
          ],
          effects: { lust: 4, affection: 2 },
        },
        2: {
          stories: [
            ['Star 的翅膀在你触碰时微微展开了一点——是放松的反应。',
             '他盯着你，像是要解释什么，最终只说了句：「……羽毛别弄乱。」'],
          ],
          effects: { lust: 5, affection: 4 },
        },
        3: {
          stories: [
            ['你慢慢梳理羽毛的时候，Star 安静了下来，翅膀舒展着，白得像云。',
             '「……天使的翅膀，被人这样对待，」他的声音很轻，「在天界是不会有这种事的。」',
             '他没有说这是好事还是坏事，只是说了这一句，然后就沉默了。'],
          ],
          effects: { lust: 4, affection: 7 },
        },
      },
    },

    // ─── ★ 什么也不做 ───────────────────────────────────────
    '什么也不做': {
      byStage: {
        0: {
          stories: [
            ['你坐在那里，什么也没做。',
             'Star 用怀疑的眼神看了你半天，等待着某种陷阱。',
             '「……你要做什么？」他最终还是忍不住开口。',
             '「只是坐着？」他皱起眉，「……怪。」'],
          ],
          effects: { affection: 1 },
        },
        1: {
          stories: [
            ['今天什么都没发生。',
             'Star 坐在另一侧，偶尔用余光扫你一眼，又很快移开。',
             '沉默持续了很长时间，最后是他先开口：「……你今天不打算做什么吗？」',
             '语气里有一点说不清的东西——不像是抱怨，更像是某种不习惯。'],
          ],
          effects: { affection: 2 },
        },
        2: {
          stories: [
            ['你们各自坐着，窗外有风。',
             'Star 的兔耳轻轻动了动，最终，他把膝盖抱起来，下巴搭在上面，安静地待着。',
             '这是他很少见的放松姿势。'],
          ],
          effects: { affection: 3 },
        },
        3: {
          stories: [
            ['什么都没做的午后。',
             'Star 靠着，闭着眼睛，兔耳慵懒地垂着。',
             '「……」',
             '过了一会儿，他轻声开口：「今天，还不算难熬。」',
             '声音很小，像是自言自语，又像是说给你听的。'],
          ],
          effects: { affection: 4 },
        },
      },
    },

    // ─── ★ 聊天 ─────────────────────────────────────────────
    '聊天': {
      byStage: {
        0: {
          stories: [
            ['「本天使不想和你说话。」',
             'Star 把头转向别处。你说了什么，他没有回应。',
             '沉默在房间里拉得很长。直到你提到天界——他的耳朵动了一下，但他没有回头。'],
          ],
          effects: { affection: 1 },
        },
        1: {
          stories: [
            ['你随口说了句什么，Star 沉默了几秒，然后用"哼"应了一声。',
             '然后又沉默。',
             '然后，他轻描淡写地说了一句，和你说的话完全无关的内容。',
             '但他确实开口了。'],
          ],
          effects: { affection: 2 },
        },
        2: {
          stories: [
            ['这次聊天比平时顺畅了一点。',
             'Star 还是会在快承认某件事的时候突然换话题，但他的话多了，停顿少了。',
             '你说了个什么，他"扑哧"笑了一下，随即绷紧了脸：「……这有什么好笑的，本天使只是，咳。」'],
          ],
          effects: { affection: 4 },
        },
        3: {
          stories: [
            ['聊了很长时间，关于天界，关于这里，关于各种不相干的事。',
             'Star 说话的时候兔耳竖着，有一搭没一搭地摇。',
             '「……你知道吗，」他说，「在天界，我们那帮人最喜欢在云层上待着，冬天能看到人间的炊烟。」',
             '他说完停顿了一下，语气平静，「但那是以前了。」'],
          ],
          effects: { affection: 6 },
        },
      },
    },

    // ─── ★ 辱骂 ─────────────────────────────────────────────
    '辱骂': {
      byStage: {
        0: {
          stories: [
            ['Star 的脸色沉下去，一字一顿地说：「你，再说一遍。」',
             '那双红眸里有某种很危险的光——不是恐惧，是真实的愤怒。',
             '「本天使是天界的吉祥物，不是任何人可以随便侮辱的存在。」'],
          ],
          effects: { affection: -4, obedience: -2 },
        },
        1: {
          stories: [
            ['Star 咬住嘴唇，没有立刻反击。',
             '他在忍。那对兔耳压得很低。',
             '「……随便你说。」他最终只是这么说了一句，声音有些哑，转过头去。'],
          ],
          effects: { affection: -3, obedience: 1 },
        },
        2: {
          stories: [
            ['你的话说完，房间里沉默了很长时间。',
             'Star 没有回嘴，只是低着头，兔耳一点一点垂下来。',
             '「……好。」他说，声音平得像一条直线，「本天使知道了。」'],
          ],
          effects: { affection: -4, obedience: 2, lust: 2 },
        },
        3: {
          stories: [
            ['Star 听完，抬起头看了你一眼，随即把脸别开。',
             '「……你今天心情不好？」他的声音很淡，但没有往常那股硬劲儿，「发泄完了就好。」',
             '他背对着你，肩膀有些紧。兔耳低着。'],
          ],
          effects: { affection: -3, obedience: 1 },
        },
      },
    },

    // ─── ★ 送礼物 ───────────────────────────────────────────
    '送礼物': {
      byStage: {
        0: {
          stories: [
            ['「本天使不需要你的东西。」',
             'Star 把礼物推回去，头也不抬。',
             '你把它放在了桌上，离开了。他没有喊你回来。',
             '……但你回头的时候，那个东西不在原来的地方了。'],
          ],
          effects: { affection: 3 },
        },
        1: {
          stories: [
            ['Star 盯着礼物看了很久，没有说话。',
             '「……拿来是什么意思？」他问，语气是审问的架势，但手已经伸过去了。',
             '「本天使只是，只是接受一下，不代表感谢你。」'],
          ],
          effects: { affection: 5 },
        },
        2: {
          stories: [
            ['你递过去的时候，Star 愣了一下，耳朵轻轻动了动。',
             '「……」他接过来，低头看了看，「这个，是特意选的？」',
             '语气里有什么东西在波动，他自己也没意识到。',
             '「……谢谢。」声音太小了，像是没打算让你听清。'],
          ],
          effects: { affection: 7 },
        },
        3: {
          stories: [
            ['「给本天使的？」Star 翻了翻，嘴角不自觉地往上了一点点。',
             '「……还不差。」他把东西收好，用一种很努力装作随意的语气说，「下次如果还要送，本天使告诉你喜欢什么。」',
             '这是他第一次说"下次"。'],
          ],
          effects: { affection: 8 },
        },
      },
    },

    // ─── ★ 抚弄发丝 ─────────────────────────────────────────
    '抚弄发丝': {
      byStage: {
        0: { stories: [['「手拿开！」Star 往旁边躲，护住头发，「本天使的头发不能随便碰！」']], effects: { affection: -1 } },
        1: { stories: [['你的手指穿进他的银发，Star 没有立刻躲，愣了一下，才轻声说：「……不要弄乱。」']], effects: { affection: 2 } },
        2: { stories: [['Star 低着头，任由你梳理他的头发。兔耳轻轻颤着。「……只是头发，别想太多。」']], effects: { affection: 3 } },
        3: { stories: [['Star 靠过来了一点，银发垂在你手边。「……慢一点。」他说，声音懒懒的。']], effects: { affection: 5 } },
      },
    },

    // ─── ★ 舔耳朵 ───────────────────────────────────────────
    '舔耳朵': {
      byStage: {
        0: { stories: [['「你！你给本天使停下！」Star 捂着耳朵跳开，全身都在抖，「那个地方……那个地方绝对不行！」']], effects: { lust: 12, affection: -3 } },
        1: { stories: [['Star 僵在原地，无法动弹，只能发出细细的、断断续续的抗议声。你的舌尖碰到耳廓的瞬间，他的膝盖弯了一下。']], effects: { lust: 15, affection: 0 } },
        2: { stories: [['「……嗯……」一声轻得几乎听不见的呜咽。Star 压住嘴，不让自己再出声，但那对兔耳已经软成一团了。']], effects: { lust: 16, affection: 2 } },
        3: { stories: [['Star 把头侧过去，把耳朵送得近了一些。「……就一下。」他说，声音哑哑的，耳根全红了。']], effects: { lust: 12, affection: 5 } },
      },
    },

    // ─── ★ 亲肤接触 ─────────────────────────────────────────
    '亲肤接触': {
      byStage: {
        0: { stories: [['Star 把自己裹紧，冷冷地说：「本天使不需要这种接触。」但他的体力确实不好，没多久就开始发抖。']], effects: { lust: 2, affection: -1 } },
        1: { stories: [['体温传过来的时候，Star 没有立刻推开。他盯着别处，不说话，允许这件事发生了几秒。']], effects: { lust: 4, affection: 2 } },
        2: { stories: [['Star 靠过来，不是主动，只是让距离近了那么一点。「……本天使只是冷。」他解释道，没人信。']], effects: { lust: 5, affection: 4 } },
        3: { stories: [['你的手臂围过去时，Star 轻轻呼了一口气，往里靠了靠。「……重量别压那里。」他嘟囔，翅膀轻轻收拢。']], effects: { lust: 4, affection: 6 } },
      },
    },

    // ─── ★ 悠闲度过 ─────────────────────────────────────────
    '悠闲度过': {
      byStage: {
        0: { stories: [['Star 待在角落里，用警惕的眼神打量着你，随时准备应对你的下一个动作。\n这种沉默，对他来说并不悠闲。']], effects: { affection: 1 } },
        1: { stories: [['下午的阳光斜进来。Star 坐着，兔耳懒懒地垂着，看上去少有地不那么绷紧。\n「……」他没说话。有时候，安静就是一种相处。']], effects: { affection: 3 } },
        2: { stories: [['你们各做各的事，偶尔说几句话，偶尔沉默。\nStar 的兔耳轻轻动着，对窗外的鸟叫声有一点点好奇，但没有说出来。']], effects: { affection: 4 } },
        3: { stories: [['这种时间，Star 不再觉得难捱。\n他窝在软垫里，尾巴慢悠悠地摇，偶尔抬头看你一眼，然后继续看窗外。']], effects: { affection: 5 } },
      },
    },

    // ─── ★ 去约会 ───────────────────────────────────────────
    '去约会': {
      byStage: {
        0: { stories: [['「约会？」Star 皱眉，「本天使和你有什么好约会的……」\n但外面的阳光让他停顿了一下。到底还是跟出去了，走在你后面很远的距离。']], effects: { affection: 3, lust: 1 } },
        1: { stories: [['Star 走在旁边，比上次近了一些。他在看路过的东西，表情认真，像是第一次见到。\n「……这里有这个？」他指了指什么，随即别开脸，「本天使只是，随便问问。」']], effects: { affection: 5 } },
        2: { stories: [['Star 在你旁边走着，有时候会走到你前面一点点，像在带路，又不像。\n「那边，本天使想去看看。」他说，语气是平的，但那对耳朵竖着，明显是真的感兴趣。']], effects: { affection: 7 } },
        3: { stories: [['回来的路上，Star 走得慢了一些。\n「……今天。」他开口，很慢，「还不错。」\n他没有看你，兔耳动着，银发被风吹乱了一点。']], effects: { affection: 8 } },
      },
    },

    // ════════════════════════════════════════════════════════
    //  以下为占位框架——stories 留空，游戏自动跳过走通用剧情库
    //  你可以随时填入内容，填完后删掉这行注释
    // ════════════════════════════════════════════════════════

    // ── BASIC 类（待填写）───────────────────────────────────
    '舔阴':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '口交':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '玩弄小穴':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '舔肛门':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '玩弄肛门':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '揉搓胸部':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '玩弄乳头':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '爱抚胸部':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '自己扒开':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '命其胸部自慰': { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '命其自慰':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '玩弄阴茎':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '命其肛门自慰': { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '舔阴命令':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '手交命令':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '口交命令':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '乳交命令':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '素股命令':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '泡泡浴':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '足交命令':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '舔足命令':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '深乳交命令':   { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '乳夹口交命令': { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '饮用母乳':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '发交':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '命其舔手指':   { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '腋交':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '喂奶':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '电气按摩':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '命其舔阴':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '磨镜':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '足交施虐':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '胸部互蹭':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '阴茎互蹭':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '命其舔肛':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '化形':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '变化体型':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '助手化形':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '助手变化体型': { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '浴室PLAY':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '淋浴':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '新妻PLAY':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '含精接吻':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '当面手淫':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '令其爱抚胸部': { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '令其爱抚':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '令其辱骂':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '索要礼物':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '舔足':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },

    // ── EVENT 类（待填写）───────────────────────────────────
    '做家务':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '歌唱训练':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '改变称呼方式': { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },

    // ── SPECIAL 类（待填写）─────────────────────────────────
    '观看视频':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '施暴':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '打屁股':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '打胸部':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '鞭打':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '滴蜡':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '针刺':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '眼罩':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '捆绑':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '口塞球':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '拷问':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '禁止射精':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '人体家具':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '剃毛':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '掐脖子':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '颜骑圧迫':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '踢胯部':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '深喉':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '拳交':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '肛门拳交':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '两穴拳交':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '放尿':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '鳗鱼池':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '虫子池':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '肉便器':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '兽奸':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '烙印':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '强制饮尿':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '召唤触手':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '触手插入':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '触手肛门插入': { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '触手玩弄阴蒂': { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '触手玩弄乳头': { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '触手挤奶':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '触手紧缚':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '触手侵犯口腔': { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '触手玩弄阴茎': { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '触手尿道插入': { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '野外PLAY':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '羞耻PLAY':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '写真摄影':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '令其打屁股':   { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '令其鞭打':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '叫人过来':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '轮奸':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '成为奴隶便器': { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },

    // ── TOOL 类（待填写）────────────────────────────────────
    '跳蛋':           { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '电动按摩棒':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '阴蒂夹':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '飞机杯':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '自慰棒':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '肛塞':           { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '后庭拉珠':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '乳头夹':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '乳头跳蛋':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '挤奶器':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '导尿管':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '灌肠':           { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '空气灌肠':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '扩张气球':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '肛门电极':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '乳房电极':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '尿道气球':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '触手灌肠':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '润滑乳液':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '媚药':           { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '利尿剂':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '摄像机':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '强精神药':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '避孕套精饮(奴隶)':{ byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '避孕套精饮(助手)':{ byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '剥包皮':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },

    // ── INTIMATE 类（待填写）────────────────────────────────
    '正常位':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '后背位':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '正常位肛交':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '后背位肛交':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '逆强奸':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '乳头奸':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '骑乘位':         { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '骑乘位肛交':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '对面座位':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '背面座位':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '对面座位肛交':   { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '背面座位肛交':   { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '对面立位':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '对面立位肛':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '背面立位':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '背面立位肛':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '错开内裤插入':   { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '错开内裤插入肛门':{ byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '尾交':           { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '耳交':           { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '足交':           { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '尾巴插入':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '尾巴肛插入':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '水下PLAY':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '逆正常位':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '逆后背位':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '强制口交':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '逆强奸肛':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '逆正常位肛交':   { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '逆后背位肛交':   { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '逆肛正常位':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '逆肛后背位':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '逆肛骑乘位':     { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '逆肛对面座位':   { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '逆肛背面座位':   { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '逆肛对面立位':   { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '逆肛背面立位':   { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '命其侵犯助手':   { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '双人口交':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '双人乳交':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '侵犯助手':       { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '让助手侵犯自己': { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '插入•助手命令':  { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '肛插入•助手命令':{ byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '阴蒂爱抚•助手命令':{ byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '阴茎爱抚•助手命令':{ byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '胸爱抚•助手命令':  { byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '玩弄小穴•助手命令':{ byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },
    '肛门爱抚•助手命令':{ byStage: { 0:{stories:[]}, 1:{stories:[]}, 2:{stories:[]}, 3:{stories:[]} } },

  }, // end commandStories

});

// ══════════════════════════════════════════════════════════════
//  追加：指令专属剧情库（commandStories）
//  由 getCharCommandStory() 在 doAction 时调用
//
//  结构：
//    commandStories['指令名'] = {
//      stage0: ['抵抗期剧情1', '剧情2'],  ← 随机取一条
//      stage1: ['动摇期剧情'],
//      stage2: ['适应期剧情'],
//      stage3: ['融合期剧情'],
//      // 可选：关系专属覆盖（比通用阶段优先级更高）
//      relation_friend: { stage0: ['朋友关系抵抗期...'], ... },
//      relation_family: { stage0: ['亲人关系抵抗期...'], ... },
//      // 可选：此指令的数值奖励（叠加在默认效果之上）
//      effects: { 0: {affection:-1}, 3: {affection:2, lust:3} },
//    }
//
//  注意：键名必须和 TRAINS_DATA 中的 name 字段完全一致
// ══════════════════════════════════════════════════════════════

// 用 Object.assign 追加到已注册的 Star 数据上
(function(){
  var reg = CharRegistry.get(21);
  if (!reg) return;

  var P = '【占位符·待填写】';  // 所有未写的内容统一用这个标记，方便搜索替换

  // 使用 Object.assign 合并，避免覆盖 register() 里已用 byStage 格式写好的剧情
  // 注意：Object.assign 是浅合并，同名指令键以此处为准（此处的旧格式会被 getCharCommandStory 的兼容逻辑识别）
  var _extraCmds = {

  // ──────────────────────────────────────────────────────────
  //  ★ Star 专属指令（已写实际内容）
  // ──────────────────────────────────────────────────────────

  '抚摸兽耳': {
    effects: { 3: { affection: 2, lust: 3 } },
    stage0: [
      '你的手指刚触到那对白色兔耳，Star 的身体猛地一僵，随即像受惊的兔子一样往后弹开。\n「——碰什么！本天使说了，那里不能碰！」\n他捂着耳朵，脸色涨红，兔耳在他手掌里抖个不停。',
      '「你……你再敢动本天使的耳朵——」\nStar 话说到一半，因为你的手指再次轻触，声音就断了。那对耳朵不争气地发着抖，他猛地别过脸，「……混蛋。」',
    ],
    stage1: [
      '你伸手去触碰那对耳朵，Star 下意识地想躲，但这次慢了一步。\n指腹沿耳廓滑过的一瞬间，他倒吸一口气，愣了两三秒，才想起来把头偏开。\n「……本天使没有、没有任何感觉。」声音里有一点点破绽。',
      '「……你今天又要——」\nStar 皱着眉，但没有真的逃跑。你轻轻捏了捏耳尖，他的肩膀抖了一下，抿紧了嘴。\n「……做完了吗。」他没有说停，只是把头垂得很低。',
    ],
    stage2: [
      '你抬手，Star 的耳朵先你一步微微转了个方向——他自己似乎没察觉。\n等你手指真的贴上去，他轻轻"嗯"了一声，低下头，兔耳在你掌心里蹭了蹭。\n「……本天使只是、只是觉得你的手温度合适。」他别着脸，解释得心虚。',
    ],
    stage3: [
      '你伸手，Star 没有躲，只是耳朵慢慢红起来。\n他低着头，任你揉了很久，偶尔尾巴也轻轻摇了一下。\n「……差不多了。」他终于小声说，声音软得不像平时，「……本天使要睡了。」\n他没有动。',
    ],
    // 关系·朋友（待填）
    relation_friend: {
      stage0: [P + '如果Star是朋友关系，抵抗期触摸兔耳的剧情，可以加入"明明以前就这样"等对比元素'],
    },
  },

  '抚摸尾巴': {
    effects: { 0: { affection: -1 }, 3: { lust: 4 } },
    stage0: [
      '「你敢碰本天使的尾巴！？」\nStar 的声音瞬间拔高了一个调，他几乎是跳起来往角落缩——但尾巴还是让你轻轻捏住了一小截。\n「——放开！那是比耳朵更不能碰的地方！」他满脸通红，用力把尾巴缩了回去。',
    ],
    stage1: [
      '你摸向尾巴的时候，Star 先发出一声轻微的惊叫，随即用手捂住嘴。\n「……本天使、本天使没叫。」他声音抖着，下意识地把尾巴夹紧，「……你、你快点停。」\n但他没有挣扎。',
    ],
    stage2: [P + '适应期·触摸尾巴——嘴上抗拒，身体已经放松了一些'],
    stage3: [P + '融合期·触摸尾巴——尾巴会主动轻轻缠上来，Star 自己也没发现'],
  },

  '抚摸翅膀': {
    effects: { 3: { affection: 1, lust: 2 } },
    stage0: [
      '那对纯白的小翅膀在你靠近时下意识收紧，像是想把自己缩成最小。\n「……翅膀是天使最重要的东西。」Star 低声说，声音很平静，但眼神变得认真起来，「请你不要碰。」\n这是他第一次用"请"字。',
    ],
    stage1: [P + '动摇期·触摸翅膀——收紧但没逃开，身体有轻微颤抖'],
    stage2: [P + '适应期·触摸翅膀——翅膀不再主动收缩，但被摸到敏感处还是会抖'],
    stage3: [P + '融合期·触摸翅膀——会轻轻展开，让你摸得更舒服一些，不承认这是主动'],
  },

  '舔耳朵': {
    effects: { 0: {affection:-2}, 3: {lust:5, affection:2} },
    stage0: [P + '抵抗期·舔耳朵——激烈抵抗，比抚摸反应更大，会真的开始挣扎'],
    stage1: [P + '动摇期·舔耳朵——腿软，说不出完整的话，但还是推开了'],
    stage2: [P + '适应期·舔耳朵——没有推开，只是把头偏向另一边，喘息声控制不住'],
    stage3: [P + '融合期·舔耳朵——会小声说"轻一点"，这是允许的意思'],
  },

  // ──────────────────────────────────────────────────────────
  //  ★ 高频通用指令（已写实际内容）
  // ──────────────────────────────────────────────────────────

  '亲吻': {
    effects: { 3: { affection: 3 } },
    stage0: [
      'Star 来不及躲开，嘴唇碰上的瞬间整个人僵住了。\n三秒后，他猛地推开你，用手背用力擦了擦嘴：「……脏死了！本天使要去漱口！」\n他跑开了，但脸红得耳根都是，兔耳压得紧紧的。',
    ],
    stage1: [
      '你俯身靠近，Star 皱着眉没有躲，但在你真的吻上去的瞬间，他的眼睛闭紧了。\n短暂的接触后，你离开，他站在原地，睁开眼，声音比平时低了一个调：「……下次提前说。」',
    ],
    stage2: [P + '适应期亲吻：Star 不会推开了，甚至会轻轻回应，事后假装什么都没发生'],
    stage3: [P + '融合期亲吻：主动微微仰头，嘴上还是会说"烦死了"，但嘴角往上'],
    // 关系分支示例（待填）
    relation_family: {
      stage0: [P + '亲人关系·抵抗期：加入"这是亲人之间不该有的"的复杂情绪'],
      stage1: [P + '亲人关系·动摇期'],
      stage2: [P + '亲人关系·适应期'],
      stage3: [P + '亲人关系·融合期'],
    },
  },

  '爱抚': {
    stage0: [P + '抵抗期·爱抚：Star 全身绷紧，嘴上骂人，眼神却在回避'],
    stage1: [P + '动摇期·爱抚：身体不再主动推开，但会把头转向别处'],
    stage2: [P + '适应期·爱抚：轻微的回应，随即假装没发生'],
    stage3: [P + '融合期·爱抚：主动靠近了一点点，用"顺路"来解释'],
  },

  '抚弄发丝': {
    stage0: [P + '抵抗期·抚发：脸色不好看，但银发柔顺，他不知道怎么阻止你'],
    stage1: [P + '动摇期·抚发：忘了抗拒，等回神了才别开脸'],
    stage2: [P + '适应期·抚发：闭上眼睛，再睁开时假装在看别处'],
    stage3: [
      '你的手指穿过Star 银白色的发丝，他静静地坐着，耳朵放松地垂着。\n「……只是头发而已。」他轻声说，语气懒洋洋的，「随便你。」\n但他没有动，头轻轻地往你手心靠了一分。',
    ],
  },

  '亲肤接触': {
    stage0: [P + '抵抗期·亲肤：激烈推开，声音响亮，体力消耗大'],
    stage1: [P + '动摇期·亲肤：推了一下，没用上全力'],
    stage2: [P + '适应期·亲肤：不再推，呼吸乱了'],
    stage3: [P + '融合期·亲肤：主动蹭了蹭，说是因为冷'],
  },

  '什么也不做': {
    stage0: ['你在旁边坐下，什么也没做。\nStar 戒备地看着你，等了很久，才慢慢放松了一点肩膀。\n「……你今天很奇怪。」他轻声说，声音不带指责，只是陈述。'],
    stage1: ['你靠着墙，安静地陪着他。\nStar 抬头看了你一眼，没有说话，把视线重新移回窗外。\n外面偶尔有风。兔耳轻轻动了一下。'],
    stage2: [P + '适应期·什么也不做：Star 开口说了一句和平时不同的话'],
    stage3: [P + '融合期·什么也不做：Star 主动挪近了一点，用"角落有点凉"来解释'],
  },

  '聊天': {
    stage0: ['「本天使没有兴趣和你聊天。」\nStar 别过脸，用沉默结束了对话。\n但你隐约看见他的耳朵转了个方向——他在听。'],
    stage1: ['Star 对你的问题沉默了几秒，最后给出了一个极短的回答。\n「……天界没有四季。」他说，然后停下来，仿佛等你继续问。'],
    stage2: [P + '适应期·聊天：Star 主动提起了一件自己在天界的事'],
    stage3: [P + '融合期·聊天：说了很多，说到高兴处忘记了克制，直到发现你在看他才停下来'],
  },

  '送礼物': {
    stage0: ['「本天使不收陌生人的东西。」\nStar 把礼物推回来，但手顿了一下——你看到他的视线在礼物上停留了两秒。'],
    stage1: ['Star 盯着那个礼物看了很久，最后接过去，放在旁边，不看你也不看它。\n「……放这里了。」他只是这样说。'],
    stage2: [P + '适应期·送礼物：Star 会直接问"这是什么"，不再假装不感兴趣'],
    stage3: [P + '融合期·送礼物：会小声说谢谢，说完立刻板起脸，仿佛要把这两个字收回去'],
  },

  '辱骂': {
    effects: { 0: {affection:-3}, 1: {affection:-2}, 2: {affection:-2}, 3: {affection:-3} },
    stage0: [
      'Star 被骂愣了一瞬，随即脸色变得非常难看。\n「……你敢这么和本天使说话。」他声音压低，「天界的人从没有这样对过我。」\n他没有哭，但眼眶有点红。',
    ],
    stage1: [P + '动摇期·辱骂：Star 反骂回去，但声音没有一开始那么响了'],
    stage2: [P + '适应期·辱骂：Star 沉默了，比激烈抵抗更令人不安'],
    stage3: [P + '融合期·辱骂：Star 抬起头看了你很久，最后说"你今天心情不好吗"'],
  },

  '悠闲度过': {
    stage0: [P + '抵抗期·悠闲度过：Star 坐在角落，用沉默表达不满'],
    stage1: [P + '动摇期·悠闲度过：Star 开始无聊，偷偷观察房间里的东西'],
    stage2: [P + '适应期·悠闲度过：Star 找了本书，两个人安静地待在同一个房间'],
    stage3: [P + '融合期·悠闲度过：Star 会主动走过来坐在你旁边，说"闲着没事做"'],
  },

  '做家务': {
    stage0: [P + '抵抗期·做家务：「本天使不是来打扫的！」但最后还是做了，因为实在看不下去乱七八糟的东西'],
    stage1: [P + '动摇期·做家务：Star 做得认真，但不允许你夸他'],
    stage2: [P + '适应期·做家务：已经养成习惯，会主动做，然后假装是顺手'],
    stage3: [P + '融合期·做家务：偶尔会等你，两个人一起做，Star 觉得这样更快'],
  },

  '歌唱训练': {
    stage0: [P + '抵抗期·歌唱：「本天使不唱！」但Star 在天界其实是有专职歌唱任务的'],
    stage1: [P + '动摇期·歌唱：Star 唱了一句，听到自己的声音在这里回响，表情有些复杂'],
    stage2: [P + '适应期·歌唱：唱了一整段，唱完没有等夸奖就走开了，但走得很慢'],
    stage3: [P + '融合期·歌唱：会问你想听什么，用这种方式避免主动说"我想唱给你听"'],
  },

  '去约会': {
    stage0: [P + '抵抗期·约会：「和你出门？本天使不去。」但最后还是被带出去了'],
    stage1: [P + '动摇期·约会：走在你旁边，保持距离，但没有落后太多'],
    stage2: [P + '适应期·约会：Star 看到什么有趣的东西会停下来，等你发现他在看什么'],
    stage3: [P + '融合期·约会：Star 走着走着走到了你前面，然后停下来等你，假装在看风景'],
  },

  // ──────────────────────────────────────────────────────────
  //  ★ 其余指令——全部占位符，你填写时删掉 P 换成实际内容
  // ──────────────────────────────────────────────────────────

  // ── 基础类 ──
  '口交':           { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '舔阴':           { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '玩弄小穴':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '舔肛门':         { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '玩弄肛门':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '揉搓胸部':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '玩弄乳头':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '爱抚胸部':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '自己扒开':       { stage0:[P+'抵抗期·Star会拒绝，需要更高的服从才会执行'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '命其胸部自慰':   { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '命其自慰':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '玩弄阴茎':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '命其肛门自慰':   { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '电气按摩':       { stage0:[P+'抵抗期·Star对电流刺激特别敏感'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '泡泡浴':         { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '浴室PLAY':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '淋浴':           { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '发交':           { stage0:[P+'抵抗期·Star的银发被用来这样……'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '命其舔手指':     { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '腋交':           { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '含精接吻':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '命其舔阴':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '磨镜':           { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '胸部互蹭':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '阴茎互蹭':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '命其舔肛':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '当面手淫':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '舔足':           { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '新妻PLAY':       { stage0:[P+'抵抗期·「本天使才不是新妻！」'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '化形':           { stage0:[P+'抵抗期·天使形态改变是个人尊严问题'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '改变称呼方式':   { stage0:[P+'抵抗期·Star不愿意改变称呼，「本天使就是本天使」'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期·Star第一次用了新称呼，随后装作不在意'] },

  // ── 命令类（让对方做） ──
  '令其爱抚胸部':   { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '令其爱抚':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '令其辱骂':       { stage0:[P+'抵抗期·Star不会骂人，说出口的都是"讨厌""混蛋"这种程度'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '索要礼物':       { stage0:[P+'抵抗期·Star主动要礼物？「本天使才不会要……」但眼神出卖了他'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '手交命令':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '口交命令':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '舔阴命令':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '乳交命令':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '素股命令':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '足交命令':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '深乳交命令':     { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '乳夹口交命令':   { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '令其打屁股':     { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '令其鞭打':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '足交施虐':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '阴蒂爱抚•助手命令': { stage0:[P+'占位符'], stage1:[P+'占位符'], stage2:[P+'占位符'], stage3:[P+'占位符'] },
  '阴茎爱抚•助手命令': { stage0:[P+'占位符'], stage1:[P+'占位符'], stage2:[P+'占位符'], stage3:[P+'占位符'] },
  '胸爱抚•助手命令':   { stage0:[P+'占位符'], stage1:[P+'占位符'], stage2:[P+'占位符'], stage3:[P+'占位符'] },
  '玩弄小穴•助手命令': { stage0:[P+'占位符'], stage1:[P+'占位符'], stage2:[P+'占位符'], stage3:[P+'占位符'] },
  '肛门爱抚•助手命令': { stage0:[P+'占位符'], stage1:[P+'占位符'], stage2:[P+'占位符'], stage3:[P+'占位符'] },

  // ── 亲密位置 ──
  '正常位':     { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '后背位':     { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '骑乘位':     { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '对面座位':   { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '背面座位':   { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '对面立位':   { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '背面立位':   { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '正常位肛交': { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '后背位肛交': { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '骑乘位肛交': { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '逆正常位':   { stage0:[P+'抵抗期·Star主动？绝对不可能……（但他会在stage3尝试）'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期·Star主动爬上来，脸红到耳根，「……只是、只是这样比较方便」'] },
  '逆后背位':   { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '尾巴插入':   { stage0:[P+'抵抗期·尾巴是Star非常私密的部位，这个指令在抵抗期会让他真的崩溃'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '尾巴肛插入': { stage0:[P+'抵抗期·极度抵抗'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '乳头奸':     { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '足交':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '水下PLAY':   { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '强制口交':   { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '逆强奸':     { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },

  // ── 道具 ──
  '跳蛋':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '电动按摩棒': { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '阴蒂夹':     { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '自慰棒':     { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '肛塞':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '后庭拉珠':   { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '乳头夹':     { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '乳头跳蛋':   { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '媚药':       { stage0:[P+'抵抗期·体质弱，见效快'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '润滑乳液':   { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '摄像机':     { stage0:[P+'抵抗期·被记录下来……Star完全不能接受'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },

  // ── 特殊/惩罚类 ──
  '施暴':       { stage0:[P+'抵抗期·注意：Star体力差，不要写得过重'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '打屁股':     { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '鞭打':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '捆绑':       { stage0:[P+'抵抗期·被束缚的感觉让Star想起了在天界被强制安置的经历'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '眼罩':       { stage0:[P+'抵抗期·失去视觉让Star更加恐慌'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '口塞球':     { stage0:[P+'抵抗期·Star最无法忍受无法开口说话'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '滴蜡':       { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '野外PLAY':   { stage0:[P+'抵抗期·「在外面？！本天使绝对不要！」'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '羞耻PLAY':   { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '写真摄影':   { stage0:[P+'抵抗期'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期·Star发现这些照片让你高兴，再次提出时沉默了很久'] },
  '人体家具':   { stage0:[P+'抵抗期·「本天使是天使，不是家具！」'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '烙印':       { stage0:[P+'抵抗期·这个指令会触发Star的防御本能'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },
  '召唤触手':   { stage0:[P+'抵抗期·天使对触手有额外的恐惧'], stage1:[P+'动摇期'], stage2:[P+'适应期'], stage3:[P+'融合期'] },

  };  // end _extraCmds

  // 合并到已注册的 commandStories（byStage格式优先：register里的不会被覆盖，只补充没有的键）
  Object.keys(_extraCmds).forEach(function(k){
    if(!reg.commandStories[k]) reg.commandStories[k] = _extraCmds[k];
  });
})();
