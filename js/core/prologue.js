// ============================================================
// js/core/prologue.js
// 序章剧情系统 & 结局系统 v1.0
//
// 功能：
//   - 首次开局：全屏序章弹窗（含自然取名步骤）
//   - 金币达到50万：自动判定结局并触发结局弹窗
//   - 隐藏结局（神明大人）：任意奴隶三项属性均 ≥ 90 时解锁
//   - 序章/结局均存入剧情记录，可重读
//   - 首页"新的猎物"按钮：确认后清档重来，重新触发序章
// ============================================================

;(function(global) {
  'use strict';

  // ─────────────────────────────────────────────────────────
  // 序章文本
  // {N} = 玩家名字  「」= 对话  __NAME__ = 取名步骤标记
  // ─────────────────────────────────────────────────────────
  var PROLOGUE_LINES = [
    '………………',
    '…………',
    '……',
    '手机的铃声响彻大脑',
    '这个声音记得是闹钟来着',
    '__NAME__',
    '{N}睁开睡意朦胧的眼睛',
    '正要顺手把闹钟关掉，才发现是有人打电话过来',
    '手忙脚乱接了电话，耳边传来熟悉的声音，原来如此，{N}回忆起来，对方是高中时代的友人',
    '闲着也是闲着，正好也觉得有些怀念，索性见上一面吧',
    '毕竟自那件事发生后，就再也没联系过了',
    '记得他好像在那次事故中丧生……不，应该是下落不明。怎么回事，记忆变得好暧昧',
    '……',
    '「我这边也是发生了各种各样的事呢」',
    '询问他那次事故以后的经历，只得到这样一句答复',
    '相貌没什么变化，但这家伙的谈吐气质都完全不同了，听说已经是一家大企业的社长了',
    '想到这里，{N}心虚地盯着自己寒酸的打扮',
    '「最近有时间吗？我这儿正好有一项工作需要你帮忙」',
    '「我认为它非常适合你，请问你意下如何呢？」',
    '虽然很尴尬，但是也只能坦白自己是个无业游民，没有拒绝的理由，不过好歹也有在努力找工作啦',
    '「规则很简单，把拍卖会上买来的奴隶调教成型就行了」',
    '「挣钱的手段我不会过问，把奴隶卖掉也好，充作劳动力也好，总而言之只要能挣到钱就行」',
    '这个人……一本正经地说着什么胡话啊',
    '在{N}震惊的注视下，他浑不在意似的微笑着抿了一口茶',
    '「目标金额暂定为50万，超过这个金额的收入都归你所有，喜欢的奴隶也尽可领走」',
    '「汇款方式可以直接一次付清，也可以在组织的任何一个附属机构购物抵消」',
    '「买些昂贵的商品回去既能自己享受又可以抵消项款，不是一举两得么？」',
    '「合同期限是50日，我会预支给你初期的生活费——这几天的生活费由我负责，剩下的就靠你自己想办法了，可以吧？」',
    '「毕竟我也是很忙的」',
    '实在是荒谬至极，{N}倍感困惑',
    '不过说实话，调教什么的，的确很吸引人……',
    '「怎样，考虑得如何？反正你也很闲不是吗？」',
    '虽然对他的话抱有怀疑，但{N}现在急需一个工作，毕竟下个月的水电费都快交不起了',
    '何况，也受够了日复一日无聊透顶的日常了……',
    '「很好，那我们尽快开始吧」',
    '在{N}点头的同时，后颈忽然遭受一记重创，意识被黑暗淹没……',
    '……',
    '醒来时已身处一个昏暗场所，{N}发现自己正趴在一张桌子上',
    '「醒了？」',
    '到底是怎么回事，这么想着抬起头来，看到了不远处的友人',
    '「以后这里就是你工作的地方了，好好加油干吧」',
    '说罢他走了出去，寂静包围了整个房间',
    '「对了，有什么事随时可来找我商量」',
    '"哐啷"一声，门关上了',
    '{N}看向四周，角落的监视器闪烁着光芒',
    '竟然变成了这样的展开……{N}为自己轻率的判断而后悔',
    '然而与此同时，内心深处某种禁忌的欲望漩涡也正逐渐膨胀……'
  ];

  // ─────────────────────────────────────────────────────────
  // 结局数据
  // {N}=玩家名  {S}=主要奴隶名
  // story_pre + choices(含各分支story) 或 直接 story
  // ─────────────────────────────────────────────────────────
  var ENDINGS = {

    no1: {
      title: 'Ending No.1 · 普通结局',
      icon: '🔗',
      conditionDesc: '无特定属性要求',
      story: [
        '………………','…………','……',
        '表达要缴纳金额的意愿后，那个人很快造访了宅邸',
        '「难得还为你准备了各种各样的东西」',
        '以遗憾的口吻说出这句话的友人在拿到钱时露出了满意的笑容',
        '「依照约定，以后你可以随心所欲地享用这间房屋和这些奴隶」',
        '语毕，他抬腿走向屋外',
        '「……要是又觉得无聊了，可以来找我谈谈，我会继续协助你的」',
        '……？',
        '还没搞明白怎么一回事，他的身影就消失在门后了',
        '但{N}并不为此在意，对{N}来说，更为烦恼的是要用何种手段来满足自己无穷无尽的欲望……',
        '',
        '　——— Ending No.1 ✦ 普通结局 ———'
      ]
    },

    no2: {
      title: 'Ending No.2 · 恋慕结局',
      icon: '💍',
      conditionDesc: '奴隶好感度远超欲望，以爱相许',
      story: [
        '………………','…………','……',
        '缴纳完金额回到房屋，{S}迎上来一把抱住了{N}',
        '两人保持着相拥的姿势一起坐到床上',
        '{N}收回拥在对方背上的手臂，抓起{S}的左手，把准备好的戒指戴在了这只手的无名指上',
        '看着这枚造型简单却精致美丽的戒指，{S}的脸上浮现出一瞬的惊讶',
        '但很快就理解了其中的含义，再次抱住{N}表明自己愿意接受的心情',
        '{S}的脸上浮现出幸福的笑容，眼眶微微湿润',
        '两人的唇逐渐重叠，像是要以此作为答复，{S}的舌头热情地缠绕上来',
        '甜蜜地亲吻了一阵，{S}倒向床铺，并把{N}也拉了过去',
        '躺在床上自己脱掉衣服后，{S}翻了个身骑上了{N}的身体……',
        '',
        '　——— Ending No.2 ✦ 恋慕结局 ———'
      ]
    },

    no3: {
      title: 'Ending No.3 · 淫乱结局',
      icon: '🔥',
      conditionDesc: '奴隶欲望值极高，迷失于快感',
      story: [
        '………………','…………','……',
        '缴纳完金额回到房屋，发现{S}正在床上沉迷于自慰',
        '对方坦陈展示着自己一丝不挂的姿态，并朝{N}这边抛来了诱惑勾人的视线',
        '同时还迅速地掏出了一个比迄今为止用过的都要粗上一圈的自慰棒',
        '{S}眼神陶醉地注视着这粗大的事物，四肢着地，翘高屁股，仿佛迫不及待',
        '"噗嗤"一声，溢满粘液的穴口轻松地吞入了柱身，{S}发出苦闷的呻吟，一边难耐地扭动起身体',
        '娇媚而妖艳的喘息，追随快感此起彼伏的动作，眼前这具躯壳染上了魅惑的色泽',
        '{S}痴痴望着{N}，眼中写满了渴求',
        '',
        '　——— Ending No.3 ✦ 淫乱结局 ———'
      ]
    },

    no4: {
      title: 'Ending No.4 · 服从结局',
      icon: '⛓️',
      conditionDesc: '奴隶服从度极高，奉主人为信仰',
      story: [
        '………………','…………','……',
        '缴纳完金额回到房屋，{S}恭敬地出来迎接{N}',
        '{N}坐到椅子上，{S}侍立在侧',
        '看着顺从的{S}，{N}招呼对方过来，把刚买来的项圈套在了{S}的脖子上',
        '{S}抚摸着刻上了自己名字的项圈，不禁露出了笑容',
        '在被{N}摩挲脸颊的时候，如同打开了什么开关，{S}向{N}吐露出效忠之言',
        '随即在{N}的视线移动到下方后，{S}乖觉地用手撩起衣服的下摆，暴露出股间的风光',
        '眼神朝上仰视着，舌尖在{N}的性器上滑动的{S}，就宛如向神祗奉献一切的虔诚信徒',
        '奖励似的摸了摸{S}的头，后者的笑容加深了，见到那样笑容的{N}也不由勾起了嘴角……',
        '',
        '　——— Ending No.4 ✦ 服从结局 ———'
      ]
    },

    no5: {
      title: 'Ending No.5 · 后宫结局',
      icon: '👑',
      conditionDesc: '拥有三位以上奴隶，众星拱月',
      story: [
        '………………','…………','……',
        '缴纳完金额回到了宅邸',
        '自此{N}享受起住在这里的生活',
        '当初还想着最后到底会变成什么样呢，现在已然非常习惯这里的日子了',
        '毕竟，这里有着无论何时都会陪伴在自己身边，无比地仰慕着自己，任何命令都会听从的人们在',
        '即便{N}不下指示，奴隶们也会用手和嘴来侍奉{N}',
        '他们积极地向{N}索求，对给予他们的快感敏感地给出了反馈',
        '那么，接下来该抱谁呢？',
        '从排队等待侍奉{N}的奴隶中发现了{S}的身影',
        '对方那双淫靡濡湿的眸子仰视着这边，被这样的对方所吸引——',
        '{N}慢慢地接近了{S}……',
        '',
        '　——— Ending No.5 ✦ 后宫结局 ———'
      ]
    },

    hidden_remix: {
      title: 'Ending No.0 · 完美结局（魔改版）',
      icon: '✨',
      conditionDesc: '隐藏结局：某位奴隶三项属性均达90以上',
      story_pre: [
        '………………','…………','……',
        '一直以来，{N}都抱有一个疑问',
        '在无法言说的不安的持续折磨下，{N}扪心自问',
        '究竟为何会感到空虚呢？',
        '明明与喜爱的奴隶们一起生活着，被对自己怀抱爱恋、依赖、畏惧等各色情感的人重重环绕着',
        '不应不满，因为一切都如自己所愿',
        '……',
        '所有的一切',
        '都如自己所愿',
        '进入房间的友人还是老样子，一如既往',
        '刚说有事要联络他，他就立马赶了过来',
        '把脑海里的疑惑向他诉说后，友人沉吟了片刻方才开口',
        '「也对啊，与其口头描述，不如让你亲眼看看比较好呢」',
        '他取出一条手帕，两手各执一头展开，手帕底端触及桌面，阻断了视线',
        '「什么都行，请想象一下这块手帕的背面有着什么样的事物吧，尽量具体一点哦」',
        '会不会是跳蛋什么的呢……{N}没来由地想到',
        '不一会儿，听到有东西落下的声音',
        '「你的脑海里浮现出的是粉红色的跳蛋呢」',
        '他这么说着揭开手帕，桌上果然摆放着和想象中一样的粉色跳蛋',
        '「没有机关，也不是我的秘技，这是属于你的能力」',
        '「我们所处的这个空间，这整个世界的全部，都是自你的想象而生」',
        '「也即是说，这个世界是你创造出来的」',
        '……开玩笑吧，怎么可能',
        '心中升起的想法被不假思索宣之于口',
        '「没错，这不可能，除非，你就是神」',
        '看来，向{N}传达这一点正是他今天的目的',
        '再三确认他不是在开玩笑，{N}陷入了沉思',
        '「……还记得以前的那次事故吗？」',
        '是在说和他一起出门时遭遇的事故吗？',
        '{N}点了点头，又摇了摇头',
        '记忆很暧昧，细节一点都想不起来了',
        '「这样吗……不必勉强」',
        '他的目光变得温柔，语气也轻和起来',
        '「我本该于那场事故中丧命，是你无数次将时光倒流」',
        '「你的记忆因此模糊，我却每一次都走向死亡的结局」',
        '随着友人的话语，记忆如潮水涌上心头',
        '——因为有趣而停留在某名少年身边，待回过神来早已舍不得离开',
        '「在重启了不知多少次世界后，你终于明白了，只要还在那个世界，就不存在我存活的未来」',
        '「那么解决的办法就只有一个，就是再创造一个新的世界——没有发生过那次事故的世界」',
        '悲伤，疲惫，绝望，庆幸，欣喜……数不清的情感冲击着头颅',
        '「这一回你成功了，纵使代价是你暂时变成了普通人，还失去了几乎所有关于旧世界的记忆」',
        '「而得以延续生命的我，这些年来不断做着你在旧世界拯救我的梦」',
        '「可我总是想不起你的名字和住址，以至于没法找到你」',
        '但是，最终还是见面了，不是吗？',
        '「某一天我突然意识到，只要回到旧世界发生事故的地点，一定能想起些什么」',
        '「我回去了，抱着事故是否会再次发生的忐忑，所幸并未如我所想」',
        '「当晚我又做了一个梦，梦里你的面容和名字都清晰起来，于是，我打了一个电话」',
        '正是那个电话，让{N}站在了这里',
        '事到如今，终于明白持续至今的空虚感是源于何处',
        '「欢迎回来，{N}」',
        '他迈动脚步，张开双手朝{N}走来',
        '「我的……神明大人」',
        '话音落尽，面前的人跪伏在{N}的脚下',
        '「您终于归位了」',
        '有什么从对方体内进入自己身体里，一瞬间浑身充满了力量',
        '双手发出令人目眩的白光，至高无上的神权回到了{N}手中',
        '曾因重置世界损失的神力流到了他的身上，如今又通过这样的方式还给了自己',
        '两人之间，还真是充斥了纠缠不清的命运',
        '阖上双目，内心满怀感慨',
        '记忆里的那名少年，已成长为一个十分可靠的家伙了',
        '新的世界里没有生老病死，只有不断重复的平稳日常',
        '这一次，死亡再也不能把两人分开',
        '与此同时，{N}还明白了一件事——',
        '当初为什么要陪伴在这样一名普通的人类身边呢',
        '隐瞒了身份，抛下好不容易调教好的一串奴隶，只为了到他身边去',
        '那个答案正是……',
        '……'
      ],
      choices: [
        {
          label: '说出口',
          story: [
            '今天留下来吧',
            '听到{N}这样说，他难得呆住了',
            '所以说，今天留下来吧',
            '怕他没听清楚，又重复了一次',
            '「真是个任性的神明大人」',
            '露出无奈的笑容，他亲吻了{N}的手指',
            '「已经拥有那么多奴隶了，却还是不够吗？」',
            '{N}让他站起身来，与自己视线平齐',
            '随即搂过他的肩，印上那张吐不出好听的话的嘴唇',
            '当然是因为，你和他们不一样……',
            '………………','…………','……',
            '「对您来说，这种级别的kiss是否过于清纯了呢」',
            '事不关己般，他摸着嘴唇吃吃笑着',
            '这算什么，真让人不爽',
            '「这可是我的初吻啊，神明大人不为此负责吗？」',
            '好像是看出{N}在生气，他歪了歪头以示妥协',
            '——啊，必须负责，不止要负责，还要……',
            '抓住他的手，赌气似的将其拖往房间',
            '「喂喂，别急嘛」',
            '不会停的，说什么都不会停下脚步的',
            '……',
            '两人的故事，从现在才要正式开始',
            '',
            '　——— Ending No.0 ✦ 完美结局 · 只属于他的神明大人 ———'
          ]
        },
        {
          label: '把答案藏在心底',
          story: [
            '……这样就行了，神应平等地爱世人，而非偏颇于某一个',
            '稍微留一点缺憾，才让现在的一切显得更为珍贵',
            '「为何要那样看着我？我的神明大人」',
            '他不解地执起{N}的手，印下亲吻',
            '「您这样会让我误会您对我有意思的……啊…！」',
            '把他拉起来纳入怀抱，带往了自己的房间',
            '就算隐瞒心意，也不代表会轻易放过眼前这个人……',
            '',
            '　——— Ending No.0 ✦ 完美结局 · 只属于他的神明大人 ———'
          ]
        }
      ]
    },

    hidden_original: {
      title: 'Ending No.0 · TRUE结局（原版）',
      icon: '🌟',
      conditionDesc: '隐藏结局：某位奴隶三项属性均达90以上',
      story_pre: [
        '………………','…………','……',
        '不知从什么时候开始，{N}一直抱着怀疑',
        '总是被说不出口的不安感折磨着，最后只能扪心自问',
        '到底，还有什么不满的地方？',
        '被喜欢的奴隶、以及对自己怀抱着爱情、依赖、恐惧、种种感情的人包围着',
        '还有什么不满足的，这一切不都已经是如愿以偿了吗？',
        '……',
        '一切的一切',
        '就如同预料般地进行着',
        '连走进屋子里的友人也是一如既往的样子',
        '打电话给他的时候，一下子就被接通，而他本人也马上就过来了',
        '{N}将脑子里翻来复去的疑问提出来跟他商量',
        '「这样啊，比起用讲的不如直接让你亲眼看看好了？」',
        '他拿起一条手帕，用手固定住两角，让手帕摊开在桌子上',
        '「这样就好，你来想象一下有什么东西被覆盖在这手帕之下呢？」',
        '听完这句话，{N}便想象着有个跳蛋在这底下',
        '过了一会儿，仿佛有什么掉落的声音传出',
        '「你脑子里想象的，是个跳蛋吧？」',
        '说完，他将手帕翻开，底下露出来的，果然是如同{N}脑海中一模一样的跳蛋',
        '「这可不是什么魔术，而是以你自己本身的力量造成的」',
        '「总而言之，我们现在所处的空间、这个世界全体都是因为你的想象存在的」',
        '「也就是说这个世界是你创造出来的」',
        '……太荒谬了，太不现实了',
        '{N}情不自禁地就说出了在脑海当中浮现的话',
        '「没错，这种事在现实中是不可能发生的」',
        '显然这就是他想告诉{N}的事实',
        '「……还记得发生的事故吗？」',
        '说到事故的话，就是指那次事故吧，一起出门的时候遇到了意外……',
        '……想不起来了',
        '除了发生事故以外，后面完全不知道发生了什么',
        '「这样啊……这也是理所当然的」',
        '「你自从那次意外之后，一直都是昏睡状态」',
        '「这个你所建筑的精神世界，大概就像是场梦境一样」',
        '寂静的气氛蔓延在两人周围',
        '「到当前为止，我原是想用对精神负担较少的手段来唤醒你，但是现在情况有变」',
        '「不巧的是，学者们对你的精神世界产生了兴趣，并想更进一步地进行研究」',
        '听到这里，愤怒与痛苦不停在{N}的心中交杂',
        '「所以，在与你的精神对话中，我用一场游戏引发你的欲望和刺激来维持意识的活性化」',
        '「虽然手段是有点危险，但的确对你的意识生成了效果，还差一点，就只差一步了」',
        '「之前组织什么的，都是骗人的……但是，已经没有必要再对你说谎了」',
        '「最后的手段是，你自身要有"想要回去"、"必须回去"这样强烈的意念」',
        '「现在还没有人发现你的意识已经活性化了——错过了这次机会你就再也醒不过来了」',
        '说到这里他闭上了眼睛，不发一语，宛如陷入了后悔的情绪当中',
        '「事情的来龙去脉就是这样，之后就看你自己的选择。即使想要留在这个世界，也是无所谓的哦」',
        '「但是呢」',
        '他好像不舍得离开一样，看着{N}',
        '「我还是想要再见到你」',
        '之后，他连道别的话也没说就离开了这里',
        '……',
        '他的话被{N}反复地思考琢磨，盘旋在脑海中的疑问终于豁然开朗',
        '但是，到底要怎么做才好？',
        '{N}就这样一个人待着，闭上眼睛专心致意地思考着',
        '到底是要回到当初一个人的时候，还是留下来跟他们一起生活？',
        '对于真实的世界……',
        '……'
      ],
      choices: [
        {
          label: '想要回去',
          story: [
            '想要回去！',
            '在内心深处呐喊着',
            '想要回去！！',
            '这份思念从内心深处满溢出来，满溢的思念自然而然地变成了声音',
            '想要回去！！！',
            '那一瞬间，视野歪曲',
            '分不清楚是眼前的景色扭曲了，还是自己的视野扭曲了',
            '所有的颜色、形状和距离全部都疯狂地像被卷入了漩涡',
            '但是，随着降落的感觉全部消失了……',
            '………………','…………','……',
            '身体好沉',
            '全身就像是被重物辗压过的感觉',
            '头痛、不快感、全身都感到不舒服，但是这种不适竟是莫名地觉得怀念',
            '想张开眼睛，但是又因为刺眼的光线而眯了起来',
            '棉被的触感、药物的味道、电子的声音、种种的感觉进入到脑海',
            '将眼睛完全张开之后——',
            '眼前正是那张不算是久违，却意外令人想念的容颜',
            '依然用那一如既往的语气打着招呼',
            '「早安啊」',
            '早安——',
            '{N}用微弱的声音回答了',
            '……',
            '',
            '　——— Ending No.0 ✦ TRUE结局 ———'
          ]
        },
        {
          label: '……留在这里',
          story: [
            '闭上眼睛，心中强烈地想象着手中物品的形象',
            '手里感受到重量后张开了眼睛，果然想象的东西出现在手中',
            '留下来吧',
            '想要什么都可以得到',
            '到底有什么好犹豫的，这里有数之不清的奴隶可以调教',
            '膨胀的欲望可以通过随心所欲的调教尽情地发挥',
            '感觉这个世界是最适合自己不过了……',
            '',
            '　——— Never End ✦ 留在这个世界 ———'
          ]
        }
      ]
    }
  };

  // ─────────────────────────────────────────────────────────
  // 辅助函数
  // ─────────────────────────────────────────────────────────

  function _getPlayerName() {
    try {
      if (typeof _playerProfile !== 'undefined' && _playerProfile.name) return _playerProfile.name;
      var p = JSON.parse(localStorage.getItem('era_profile') || '{}');
      return p.name || '主人';
    } catch(e) { return '主人'; }
  }

  function _getAllSavedChars() {
    var chars = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.startsWith('era_sv_')) {
          var sv = JSON.parse(localStorage.getItem(k) || 'null');
          if (sv && sv.char) chars.push(sv.char);
        }
      }
    } catch(e) {}
    return chars;
  }

  function _getFavoriteChar() {
    var chars = _getAllSavedChars();
    if (!chars.length) return null;
    return chars.reduce(function(best, c) {
      return (c.total_training_count || 0) >= (best.total_training_count || 0) ? c : best;
    }, chars[0]);
  }

  function _replaceVars(text, playerName, slaveName) {
    return (text || '').replace(/\{N\}/g, playerName || '主人').replace(/\{S\}/g, slaveName || '奴隶');
  }

  function _esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function _isDialogue(line) {
    return line && (line.indexOf('「') >= 0 || line.indexOf('"') >= 0);
  }

  function _isEllipsis(line) {
    return line && /^[…\.\s]+$/.test(line);
  }

  function _lineClass(line) {
    if (_isEllipsis(line)) return 'prol-line ellipsis';
    if (_isDialogue(line)) return 'prol-line dialogue';
    return 'prol-line';
  }

  // ─────────────────────────────────────────────────────────
  // PrologueSystem
  // ─────────────────────────────────────────────────────────
  var PS = {
    _pStep: 0,          // 当前序章行索引
    _pName: '',         // 正在输入的名字（未确认）
    _endingId: null,    // 当前结局ID
    _endingLines: [],   // 结局展示行数组（含分支展开后的）
    _endingIdx: 0,      // 当前结局行索引
    _showingChoice: false,
    _hiddenVersion: null, // 'remix' | 'original'
    LINES_PER_TICK: 3,  // 每次点击展示行数

    // ── 初始化 ──────────────────────────────────────────────
    init: function() {
      // 注入 CSS
      PS._injectCSS();
      // 注入序章/结局/日志 HTML
      PS._injectHTML();
      // 检测是否首次进入
      if (!localStorage.getItem('era_prologue_done')) {
        setTimeout(PS.showPrologue, 300);
      }
      // 更新剧情记录计数
      PS.updateCount();
      // Patch writeSave 以检测结局触发
      PS._patchWriteSave();
      // Patch navTo 以在切换到首页时刷新纳金按钮状态
      PS._patchNavTo();
      // 初始化时检查纳金按钮状态
      setTimeout(PS._showNadingSection, 400);
    },

    // ── 序章 ────────────────────────────────────────────────
    showPrologue: function() {
      PS._pStep = 0;
      var ov = document.getElementById('ov-prologue');
      if (!ov) return;
      var area = document.getElementById('prol-text-area');
      area.innerHTML = '';
      // 隐藏旧的继续按钮、取消点击推进
      var btn = document.getElementById('prol-continue');
      if (btn) btn.style.display = 'none';
      var wrap = document.getElementById('prol-wrap');
      if (wrap) wrap.onclick = null;
      ov.style.display = 'flex';

      var pName = _getPlayerName();
      var delay = 0;
      var STEP = 0.08; // 每行淡入间隔（秒）
      var nameIdx = PROLOGUE_LINES.indexOf('__NAME__');

      // 渲染 __NAME__ 之前的所有行
      for (var i = 0; i < nameIdx; i++) {
        var line = PROLOGUE_LINES[i];
        if (!line || !line.trim()) { delay += STEP * 0.5; continue; }
        var el = PS._makeLineDom(_replaceVars(line, pName, ''), _lineClass(line));
        el.style.animationDelay = delay + 's';
        area.appendChild(el);
        delay += STEP;
      }

      // 取名框（内联，接在文字后面）
      var nameBox = document.createElement('div');
      nameBox.id = 'prol-name-inline';
      nameBox.className = 'prol-name-box';
      nameBox.style.cssText = 'opacity:0;animation:prol-in .5s ease ' + (delay + STEP * 2) + 's forwards;margin-top:24px;';
      nameBox.innerHTML =
        '<div class="prol-sys-label">── SYSTEM ──</div>' +
        '<div class="prol-sys-prompt">迷迷糊糊中，你想起了一件事……<br>你的名字，是什么来着？</div>' +
        '<input class="prol-name-input" id="prol-name-field" type="text" placeholder="请输入主人的名字" maxlength="8" ' +
        'onkeydown="if(event.key===\'Enter\')PrologueSystem.confirmName()">' +
        '<button class="prol-name-confirm" onclick="PrologueSystem.confirmName()">确认</button>';
      area.appendChild(nameBox);

      // 后续段落容器（确认名字后填充）
      var post = document.createElement('div');
      post.id = 'prol-post-name';
      area.appendChild(post);
    },

    // 旧方法保留为空壳（不再使用）
    prologueNext: function() {},
    _prologueAdvance: function() {},
    _makeLineDom: function(text, cls) {
      var el = document.createElement('p');
      el.className = cls || 'prol-line';
      el.textContent = text;
      el.style.animationDelay = '0s';
      return el;
    },

    confirmName: function() {
      var inp = document.getElementById('prol-name-field');
      var name = (inp ? inp.value.trim() : '').slice(0, 8) || '主人';
      // 保存名字
      try {
        var profile = JSON.parse(localStorage.getItem('era_profile') || '{}');
        profile.name = name;
        if (!profile.avatar) profile.avatar = '👑';
        if (!profile.gender) profile.gender = '男';
        if (profile.stamina == null) profile.stamina = 2000;
        if (profile.staminaMax == null) profile.staminaMax = 2000;
        localStorage.setItem('era_profile', JSON.stringify(profile));
        if (typeof _playerProfile !== 'undefined') _playerProfile.name = name;
        if (typeof renderPlayerCard === 'function') renderPlayerCard();
      } catch(e) {}

      // 禁用取名框
      var nameBox = document.getElementById('prol-name-inline');
      if (nameBox) {
        nameBox.querySelector('input').disabled = true;
        nameBox.querySelector('button').disabled = true;
        nameBox.style.opacity = '0.5';
      }

      var post = document.getElementById('prol-post-name');
      if (!post) return;

      var delay = 0;
      var STEP = 0.08;
      var nameIdx = PROLOGUE_LINES.indexOf('__NAME__');
      var remainLines = PROLOGUE_LINES.slice(nameIdx + 1);

      // 确认提示行
      var confirmEl = PS._makeLineDom('……' + name + '，好的，就这么决定了。', 'prol-line dialogue');
      confirmEl.style.cssText += 'opacity:0;animation:prol-in .5s ease 0s forwards;margin-top:16px;';
      post.appendChild(confirmEl);
      delay += STEP * 3;

      // 渲染剩余所有行
      remainLines.forEach(function(line) {
        if (!line || !line.trim()) { delay += STEP * 0.5; return; }
        var el = PS._makeLineDom(_replaceVars(line, name, ''), _lineClass(line));
        el.style.animationDelay = delay + 's';
        post.appendChild(el);
        delay += STEP;
      });

      // ── 居中"开始游戏"按钮，出现在最末 ──
      var totalDelay = delay + STEP * 4;
      var startWrap = document.createElement('div');
      startWrap.style.cssText = 'text-align:center;margin-top:56px;padding-bottom:40px;' +
        'opacity:0;animation:prol-in .7s ease ' + totalDelay + 's forwards;';
      startWrap.innerHTML =
        '<div style="font-size:.65rem;letter-spacing:5px;color:var(--muted);margin-bottom:20px">— END OF PROLOGUE —</div>' +
        '<button onclick="PrologueSystem._enterGame()" style="' +
        'padding:14px 48px;font-size:1rem;font-weight:600;cursor:pointer;' +
        'background:color-mix(in srgb,var(--acc) 80%,var(--card));' +
        'border:1px solid color-mix(in srgb,var(--acc) 60%,transparent);' +
        'border-radius:28px;color:var(--txt);letter-spacing:2px;' +
        'box-shadow:0 4px 20px color-mix(in srgb,var(--acc) 25%,transparent);' +
        'transition:all .2s;">🎮 开始游戏</button>';
      post.appendChild(startWrap);

      // 标记完成 & 写入记录
      PS._completePrologue();


      // 滚回剩余剧情开头
setTimeout(function() {
  var ov = document.getElementById('ov-prologue');
  var post = document.getElementById('prol-post-name');
  if (ov && post) {
    var rect = post.getBoundingClientRect();
    ov.scrollTop = ov.scrollTop + rect.top - 60;
  }
}, 300);

      
    },

    _completePrologue: function() {
      localStorage.setItem('era_prologue_done', '1');
      PS._savePrologueToLog();
      PS.updateCount();
    },

    _enterGame: function() {
      var ov = document.getElementById('ov-prologue');
      if (!ov) return;
      ov.style.opacity = '0';
      ov.style.transition = 'opacity 0.8s';
      setTimeout(function() {
        ov.style.display = 'none';
        ov.style.opacity = '';
        ov.style.transition = '';
        if (typeof toast === 'function') toast('序章已解锁，可在「序章与结局」中重读', 'ok');
      }, 800);
    },

    _savePrologueToLog: function() {
      var pName = _getPlayerName();
      var lines = PROLOGUE_LINES
        .filter(function(l) { return l !== '__NAME__'; })
        .map(function(l) { return _replaceVars(l, pName, ''); });
      if (typeof pushStoryLog === 'function') {
        pushStoryLog('prologue', {
          title: '序章 · 那一通改变命运的电话',
          date: typeof getDateStr === 'function' ? getDateStr() : '第1天',
          char: pName,
          story: lines
        });
      }
    },

    // ── 结局系统 ─────────────────────────────────────────────

    checkEndingTrigger: function() {
      // 已纳金或已触发结局则跳过
      if (localStorage.getItem('era_ending_triggered')) return;
      // 已经通知过，只更新按钮显示
      if (localStorage.getItem('era_nading_ready')) {
        PS._showNadingSection();
        return;
      }
      var money = (typeof State !== 'undefined') ? (State.money || 0) : 0;
      if (money < 500000) return;
      // 条件满足：设置标记，显示按钮和弹窗提示（不自动进入结局）
      localStorage.setItem('era_nading_ready', '1');
      PS._showNadingSection();
      setTimeout(PS._showNadingNotification, 800);
    },

    // 显示纳金条件满足的弹窗提示
    _showNadingNotification: function() {
      if (typeof openCustomConfirm === 'function') {
        openCustomConfirm(
          '💰 目标金额已达成',
          '<div style="font-size:.88rem;color:var(--txt2);line-height:2.1">' +
          '您积累的财富已满足委托人的约定金额。<br>' +
          '调教生涯即将迎来尾声……<br><br>' +
          '<span style="color:var(--acc);font-weight:600">✦ 纳金选项已出现在首页</span><br>' +
          '<span style="color:var(--muted);font-size:.75rem">请自行选择时机，主动点击「纳金」按钮，<br>方可正式向委托人缴纳款项、开启结局。</span>' +
          '</div>',
          '✓ 我知道了',
          function() {} // 仅确认，无操作
        );
      } else {
        if (typeof toast === 'function') {
          toast('💰 目标金额已达成！首页已出现「纳金」选项，请主动选择时机进行纳金。', 'ok');
        }
      }
    },

    // 更新首页纳金区域的显示/隐藏
    _showNadingSection: function() {
      var sec = document.getElementById('nading-section');
      if (!sec) return;
      var ready = !!localStorage.getItem('era_nading_ready');
      var done  = !!localStorage.getItem('era_ending_triggered');
      sec.style.display = (ready && !done) ? '' : 'none';
    },

    // 玩家主动点击纳金按钮
    startNading: function() {
      if (localStorage.getItem('era_ending_triggered')) {
        if (typeof toast === 'function') toast('结局已完成，可在「序章与结局」中重读', '');
        return;
      }
      if (typeof openCustomConfirm === 'function') {
        openCustomConfirm(
          '💰 确认纳金',
          '<div style="font-size:.88rem;color:var(--txt2);line-height:2">' +
          '您即将向委托人缴纳约定金额，<br>' +
          '此次调教生涯即将正式落幕……<br><br>' +
          '<span style="color:var(--acc);font-size:.85rem">确定要进行纳金，开启结局吗？</span>' +
          '</div>',
          '💰 确认纳金',
          function() {
            localStorage.setItem('era_ending_triggered', '1');
            PS._showNadingSection(); // 隐藏纳金按钮
            setTimeout(PS._startEndingSequence, 500);
          }
        );
      } else {
        if (confirm('确认向委托人纳金，开启结局？')) {
          localStorage.setItem('era_ending_triggered', '1');
          PS._showNadingSection();
          PS._startEndingSequence();
        }
      }
    },

    _startEndingSequence: function() {
      // 是否满足隐藏结局条件
      var chars = _getAllSavedChars();
      var hiddenUnlocked = chars.some(function(c) {
        return (c.affection || 0) >= 90 && (c.obedience || 0) >= 90 && (c.lust || 0) >= 90;
      });
      if (hiddenUnlocked) {
        PS._showEndingTypeChoice();
      } else {
        var endingId = PS._selectEnding(chars);
        PS.triggerEnding(endingId);
      }
    },

    _showEndingTypeChoice: function() {
      // 弹出一个临时选择：普通结局 or 隐藏结局
      if (typeof openCustomConfirm === 'function') {
        openCustomConfirm(
          '🏆 目标金额已达成',
          '<div style="font-size:.88rem;color:var(--txt2);line-height:2">' +
          '探索即将告一段落，而你的故事……<br>' +
          '某位奴隶似乎对你已产生了非比寻常的感情。<br><br>' +
          '<span style="color:var(--acc)">✨ 隐藏结局已解锁</span><br>' +
          '请选择你想看的结局类型：</div>',
          '🌟 隐藏结局 · 神明大人',
          function() { PS._showHiddenVersionChoice(); }
        );
        // 在 confirm 旁边追加"普通结局"按钮（hack：在 openCustomConfirm 之后注入）
        setTimeout(function() {
          var btns = document.querySelectorAll('.confirm-btn-area button, .custom-confirm button, [id*="confirm"] button');
          // 尝试在弹窗底部追加按钮
          var footer = document.querySelector('.cc-footer, .custom-confirm-footer, #custom-confirm-btns');
          if (!footer) {
            // fallback: 直接问隐藏或普通
            PS._showHiddenVersionChoice();
          }
        }, 100);
      } else {
        // 没有 openCustomConfirm，直接显示选版本
        PS._showHiddenVersionChoice();
      }
    },

    _showHiddenVersionChoice: function() {
      var ov = document.getElementById('ov-ending-choice');
      if (!ov) return;
      ov.style.display = 'flex';
    },

    chooseHiddenVersion: function(version) {
      // version: 'remix' | 'original'
      PS._hiddenVersion = version;
      var ov = document.getElementById('ov-ending-choice');
      if (ov) ov.style.display = 'none';
      var id = version === 'remix' ? 'hidden_remix' : 'hidden_original';
      PS.triggerEnding(id);
    },

    choosePlainEnding: function() {
      var ov = document.getElementById('ov-ending-choice');
      if (ov) ov.style.display = 'none';
      var chars = _getAllSavedChars();
      var id = PS._selectEnding(chars);
      PS.triggerEnding(id);
    },

    _selectEnding: function(chars) {
      if (!chars || !chars.length) return 'no1';
      var count = chars.length;
      // No.5 后宫: ≥ 3 人
      if (count >= 3) return 'no5';
      // No.1 淫乱多人: ≥ 2 人且有欲望 ≥ 80
      if (count >= 2 && chars.some(function(c){ return (c.lust || 0) >= 80; })) return 'no1';
      // 单人分支
      var c = chars.reduce(function(best, x) {
        return (x.total_training_count || 0) >= (best.total_training_count || 0) ? x : best;
      }, chars[0]);
      if ((c.obedience || 0) >= 80 && (c.obedience || 0) > (c.lust || 0)) return 'no4';
      if ((c.lust || 0) >= 80) return 'no3';
      if ((c.affection || 0) >= 70) return 'no2';
      return 'no1';
    },

    triggerEnding: function(endingId) {
      var ending = ENDINGS[endingId];
      if (!ending) return;
      PS._endingId = endingId;
      PS._showingChoice = false;
      // 准备文本
      var pName = _getPlayerName();
      var slave = _getFavoriteChar();
      var sName = slave ? slave.name : '奴隶';
      var rawLines = ending.story || ending.story_pre || [];
      PS._endingLines = rawLines.map(function(l){ return _replaceVars(l, pName, sName); });
      PS._endingChoicesRaw = ending.choices || null;
      PS._endingIdx = 0;
      // 设置标题
      var titleEl = document.getElementById('ending-title');
      var subtitleEl = document.getElementById('ending-subtitle');
      var iconEl = document.getElementById('ending-icon');
      if (titleEl) titleEl.textContent = ending.title;
      if (subtitleEl) subtitleEl.textContent = ending.conditionDesc || '';
      if (iconEl) iconEl.textContent = ending.icon || '🏆';
      // 清空正文与选项区
      var area = document.getElementById('ending-text-area');
      if (area) area.innerHTML = '';
      var choiceArea = document.getElementById('ending-choices');
      if (choiceArea) { choiceArea.innerHTML = ''; choiceArea.style.display = 'none'; }
      // 隐藏继续/完成按钮，等内容渲染完再显示
      var contBtn = document.getElementById('ending-continue');
      var finBtn  = document.getElementById('ending-finish');
      if (contBtn) contBtn.style.display = 'none';
      if (finBtn)  finBtn.style.display  = 'none';
      // 显示弹窗
      var ov = document.getElementById('ov-ending');
      if (ov) { ov.style.display = 'flex'; ov.scrollTop = 0; }
      // 像序章一样：一次性将所有行加入 DOM，用 CSS animation-delay 依次淡入
      PS._endingAutoRender(PS._endingLines, PS._endingChoicesRaw, true);
      if (typeof toast === 'function') toast('🏆 结局解锁——请向下滑动阅读', 'ai');
    },

    // 自动渲染结局行（类序章淡入动画，可滑动阅读）
    // lines: 要渲染的行数组
    // choicesRaw: 渲染完后要展示的选项数组（null 则显示完成按钮）
    // clearArea: 是否清空正文区再渲染
    _endingAutoRender: function(lines, choicesRaw, clearArea) {
      var area = document.getElementById('ending-text-area');
      if (!area) return;
      if (clearArea) area.innerHTML = '';
      var delay = 0;
      var STEP  = 0.08; // 每行淡入间隔（秒），与序章相同
      lines.forEach(function(line) {
        if (!line || !line.trim()) { delay += STEP * 0.5; return; }
        var el = PS._makeLineDom(line, _lineClass(line));
        el.style.animationDelay = delay + 's';
        area.appendChild(el);
        delay += STEP;
      });
      var totalMs = Math.max((delay + 0.8) * 1000, 600);
      var ov = document.getElementById('ov-ending');
      // 渲染期间每隔 400ms 自动滚到底，让新出现的行可见
      var scrollTimer = setInterval(function() {
        if (ov) ov.scrollTop = ov.scrollHeight;
      }, 400);
      setTimeout(function() {
        clearInterval(scrollTimer);
        if (ov) ov.scrollTop = ov.scrollHeight;
        if (choicesRaw && choicesRaw.length) {
          PS._showEndingChoices(choicesRaw);
        } else {
          var finBtn = document.getElementById('ending-finish');
          if (finBtn) {
            finBtn.style.display = 'inline-block';
            finBtn.style.opacity = '0';
            finBtn.style.animation = 'prol-in .5s ease forwards';
          }
        }
      }, totalMs);
    },

    // 兼容旧调用（点击「继续」按钮时执行，新系统不再触发）
    endingNext: function() { /* 新系统已改为自动滚动，无需操作 */ },
    _endingAdvance: function() { /* 旧逻辑已被 _endingAutoRender 替代 */ },

    // 显示结局选项（带淡入动画）
    _showEndingChoices: function(choicesRaw) {
      PS._showingChoice = true;
      var raw  = choicesRaw || PS._endingChoicesRaw;
      var area = document.getElementById('ending-choices');
      if (!area || !raw) return;
      area.innerHTML = '';
      area.style.display = 'grid';
      area.style.opacity = '0';
      area.style.animation = 'prol-in .6s ease forwards';
      raw.forEach(function(ch, idx) {
        var btn = document.createElement('button');
        btn.className = 'prol-choice-btn';
        btn.textContent = ch.label;
        btn.onclick = function() { PS._pickEndingChoice(idx, raw); };
        area.appendChild(btn);
      });
      var ov = document.getElementById('ov-ending');
      if (ov) setTimeout(function(){ ov.scrollTop = ov.scrollHeight; }, 200);
    },

    // 玩家选择分支后，自动渲染分支剧情
    _pickEndingChoice: function(idx, choicesRaw) {
      var raw = choicesRaw || PS._endingChoicesRaw;
      var ch  = raw ? raw[idx] : null;
      if (!ch) return;
      PS._showingChoice  = false;
      PS._endingChoicesRaw = null;
      // 隐藏选项区
      var choiceArea = document.getElementById('ending-choices');
      if (choiceArea) { choiceArea.style.display = 'none'; choiceArea.style.animation = ''; }
      var pName = _getPlayerName();
      var slave = _getFavoriteChar();
      var sName = slave ? slave.name : '奴隶';
      // 在正文区追加选择提示行（立即显示）
      var area = document.getElementById('ending-text-area');
      if (area) {
        var selEl = PS._makeLineDom('▶ ' + ch.label, 'prol-line dialogue');
        selEl.style.animationDelay = '0s';
        area.appendChild(selEl);
      }
      // 自动渲染分支剧情（追加到现有内容后，不清空）
      var branchLines = (ch.story || []).map(function(l){ return _replaceVars(l, pName, sName); });
      // 给分支行一个起始延迟，避免和选择提示行重叠
      setTimeout(function() {
        PS._endingAutoRender(branchLines, null, false);
      }, 200);
    },

    endingFinish: function() {
      // 保存到剧情记录
      PS._saveEndingToLog();
      PS.updateCount();
      // 隐藏弹窗
      var ov = document.getElementById('ov-ending');
      if (ov) {
        ov.style.opacity = '0';
        ov.style.transition = 'opacity 0.8s';
        setTimeout(function() {
          ov.style.display = 'none';
          ov.style.opacity = '';
          ov.style.transition = '';
          if (typeof toast === 'function') toast('结局已解锁，可在「序章与结局」中重读', 'ok');
        }, 800);
      }
    },

    _saveEndingToLog: function() {
      var ending = ENDINGS[PS._endingId];
      if (!ending) return;
      var area = document.getElementById('ending-text-area');
      var lines = [];
      if (area) {
        area.querySelectorAll('p').forEach(function(p){ lines.push(p.textContent); });
      }
      if (typeof pushStoryLog === 'function') {
        pushStoryLog('ending', {
          title: ending.title,
          date: typeof getDateStr === 'function' ? getDateStr() : '完结',
          char: _getPlayerName(),
          story: lines.length ? lines : ['结局内容']
        });
      }
    },

    // ── 序章与结局 日志弹窗 ──────────────────────────────────

    openPrologueLogModal: function() {
      var body = document.getElementById('prol-log-body');
      if (!body) return;
      var pName = _getPlayerName();
      var logs = ((typeof State !== 'undefined') ? State.storyLog || [] : [])
        .filter(function(e){ return e.type === 'prologue' || e.type === 'ending'; });

      var html = '';
      // 改名按钮
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding:12px 14px;background:var(--card);border:1px solid var(--bdr2);border-radius:10px">' +
        '<div><div style="font-size:.82rem;font-weight:700;color:var(--txt)">当前主人名字</div>' +
        '<div style="font-size:1rem;color:var(--acc);margin-top:3px">' + _esc(pName) + '</div></div>' +
        '<button class="btn btn-sm" onclick="PrologueSystem.openRenameModal()" style="font-size:.75rem">✏️ 修改名字</button>' +
        '</div>';

      if (!logs.length) {
        html += '<div style="text-align:center;padding:40px 0;color:var(--muted)">' +
          '<div style="font-size:3rem;margin-bottom:12px">📜</div>' +
          '<div style="font-size:.85rem;line-height:1.8">序章和结局尚未解锁。<br>完成游戏相关目标后会在此显示。</div></div>';
      } else {
        logs.forEach(function(entry, i) {
          var icon = entry.type === 'prologue' ? '📖' : '🏆';
          var preview = (entry.story && entry.story[0]) ? entry.story[0].slice(0, 50) : '';
          html += '<div style="padding:12px 14px;background:var(--card);border:1px solid var(--bdr2);border-radius:10px;margin-bottom:8px;cursor:pointer" onclick="PrologueSystem.readLog(' + i + ')">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
            '<span style="font-size:1.2rem">' + icon + '</span>' +
            '<span style="font-weight:700;font-size:.85rem;color:var(--txt)">' + _esc(entry.title) + '</span>' +
            '<span style="margin-left:auto;font-size:.65rem;color:var(--muted)">' + _esc(entry.date || '') + '</span>' +
            '</div>' +
            '<div style="font-size:.75rem;color:var(--txt2);line-height:1.6;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' +
            _esc(preview) + (preview.length >= 50 ? '…' : '') + '</div>' +
            '</div>';
        });
      }

      body.innerHTML = html;
      var ov = document.getElementById('ov-prologue-log');
      if (ov) openOv('ov-prologue-log');
    },

    readLog: function(idx) {
      var logs = ((typeof State !== 'undefined') ? State.storyLog || [] : [])
        .filter(function(e){ return e.type === 'prologue' || e.type === 'ending'; });
      var entry = logs[idx];
      if (!entry) return;
      // 用现有 story modal 展示
      if (typeof openStoryModal === 'function') {
        closeOv('ov-prologue-log');
        setTimeout(function() {
          openStoryModal({ title: entry.title, story: entry.story || [], cat: 'basic' }, entry.type === 'prologue' ? '序章' : '结局', {});
        }, 150);
      }
    },

    openRenameModal: function() {
      closeOv('ov-prologue-log');
      setTimeout(function() {
        if (typeof openPrettyRename === 'function') openPrettyRename();
        else if (typeof openOv === 'function') openOv('ov-name');
      }, 150);
    },

    // ── 计数更新 ─────────────────────────────────────────────

    updateCount: function() {
      var logs = ((typeof State !== 'undefined') ? State.storyLog || [] : []);
      var cnt = logs.filter(function(e){ return e.type === 'prologue' || e.type === 'ending'; }).length;
      var el = document.getElementById('prologue-log-count');
      if (el) el.textContent = cnt > 0 ? cnt + ' 条记录' : '待解锁';
    },

    // ── 新的猎物 & 旧的奴隶 ────────────────────────────────

    startNewGame: function() {
      if (typeof openCustomConfirm === 'function') {
        openCustomConfirm(
          '🔑 新的猎物',
          '<div style="font-size:.85rem;color:var(--txt2);line-height:1.9">' +
          '确定要清空<strong>所有存档与进度</strong>，重新开始调教生涯吗？<br>' +
          '<span style="color:var(--muted);font-size:.75rem">（成就记录与界面设置将保留）</span>' +
          '</div>',
          '确定重新开始',
          function() { PS._doReset(); }
        );
      } else {
        if (confirm('确定要清空所有存档重新开始吗？')) PS._doReset();
      }
    },

    _doReset: function() {
      var keepKeys = ['era_theme', 'era_fontsize', 'era_fontstyle', 'era_perspective', 'era_ach', 'era_event_probs'];
      var toRemove = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k) continue;
        if (keepKeys.indexOf(k) >= 0) continue;
        if (k.startsWith('era_')) toRemove.push(k);
      }
      toRemove.forEach(function(k){ localStorage.removeItem(k); });
      // 重置 profile 名字
      try {
        var p = JSON.parse(localStorage.getItem('era_profile') || '{}');
        p.name = '主人';
        localStorage.setItem('era_profile', JSON.stringify(p));
        if (typeof _playerProfile !== 'undefined') _playerProfile.name = '主人';
      } catch(e) {}
      // 重置 State
      if (typeof State !== 'undefined') {
        State.money = 10000; State.day = 1;
        State.inventory = {}; State.gameLog = [];
        State.storyLog = []; State.currentChar = null;
      }
      // 刷新页面触发序章
      if (typeof toast === 'function') toast('存档已清空，序章即将开始……', 'ok');
      setTimeout(function() { location.reload(); }, 1200);
    },

    continueGame: function() {
      var lastId = localStorage.getItem('era_last_char');
      if (!lastId) {
        if (typeof toast === 'function') toast('暂无存档，请先选择奴隶开始调教', '');
        if (typeof navTo === 'function') navTo('chars');
        return;
      }
      var id = isNaN(lastId) ? lastId : Number(lastId);
      if (typeof selectChar === 'function') selectChar(id);
    },

    // ── Patch writeSave ───────────────────────────────────────

    _patchWriteSave: function() {
      if (typeof writeSave !== 'function') return;
      var orig = writeSave;
      window.writeSave = function() {
        var result = orig.apply(this, arguments);
        try { PS.checkEndingTrigger(); } catch(e) {}
        return result;
      };
    },

    // 监听 navTo，切换到首页时刷新纳金按钮显示
    _patchNavTo: function() {
      if (typeof navTo !== 'function' || navTo._nadingPatched) return;
      var orig = navTo;
      window.navTo = function(tab) {
        var result = orig.apply(this, arguments);
        if (tab === 'home') {
          try { setTimeout(PS._showNadingSection, 50); } catch(e) {}
        }
        return result;
      };
      window.navTo._nadingPatched = true;
    },

    // ── CSS 注入 ─────────────────────────────────────────────

    _injectCSS: function() {
      if (document.getElementById('prol-css')) return;
      var style = document.createElement('style');
      style.id = 'prol-css';
      style.textContent = [
        '#ov-prologue,#ov-ending{position:fixed;inset:0;z-index:9999;display:none;',
        'background:color-mix(in srgb,var(--bg) 92%,black);',
        'flex-direction:column;align-items:center;overflow-y:auto;',
        'scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--acc) 30%,transparent) transparent;}',

        '.prol-wrap{width:100%;max-width:860px;min-height:100vh;',
        'padding:64px 120px 120px;box-sizing:border-box;display:flex;flex-direction:column;}',
        '@media(max-width:700px){.prol-wrap{padding:40px 24px 100px;}}',

        '.prol-header{text-align:center;margin-bottom:48px;padding-bottom:28px;',
        'border-bottom:1px solid color-mix(in srgb,var(--acc) 18%,var(--bdr2,rgba(0,0,0,.1)));',
        'opacity:.65;}',
        '.prol-header-icon{font-size:1.3rem;letter-spacing:12px;}',
        '.prol-header-sub{font-size:.6rem;letter-spacing:8px;color:var(--txt2);margin-top:8px;}',

        '.prol-text-area{flex:1;min-height:200px;margin-bottom:20px;}',

        '.prol-line{font-size:1rem;line-height:2.3;color:var(--txt2);margin:0 0 0;',
        'opacity:0;animation:prol-in .45s ease forwards;}',
        '.prol-line.dialogue{color:var(--txt);font-weight:500;',
        'padding-left:1.2em;border-left:2px solid color-mix(in srgb,var(--acc) 35%,transparent);',
        'margin-left:-1.4em;padding-right:.2em;}',
        '.prol-line.ellipsis{letter-spacing:8px;color:var(--muted);font-size:.85rem;',
        'text-align:center;margin:8px 0;}',
        '@keyframes prol-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}',

        '.prol-name-box{background:color-mix(in srgb,var(--acc) 6%,var(--card));',
        'border:1px solid color-mix(in srgb,var(--acc) 35%,transparent);',
        'border-radius:12px;padding:18px 20px;margin:16px 0;}',
        '.prol-sys-label{font-size:.6rem;letter-spacing:4px;color:var(--acc);opacity:.7;margin-bottom:6px;}',
        '.prol-sys-prompt{font-size:.82rem;color:var(--txt2);line-height:1.9;margin-bottom:14px;}',
        '.prol-name-input{width:100%;background:var(--card2,var(--card));',
        'border:1px solid color-mix(in srgb,var(--acc) 40%,transparent);',
        'border-radius:8px;padding:10px 14px;',
        'font-size:1rem;color:var(--txt);box-sizing:border-box;outline:none;caret-color:var(--acc);}',
        '.prol-name-input::placeholder{color:var(--muted);}',
        '.prol-name-input:focus{border-color:var(--acc);}',
        '.prol-name-confirm{margin-top:10px;width:100%;padding:11px;',
        'background:color-mix(in srgb,var(--acc) 55%,transparent);',
        'border:1px solid color-mix(in srgb,var(--acc) 50%,transparent);',
        'border-radius:8px;color:var(--txt);font-size:.86rem;cursor:pointer;transition:background .2s;}',
        '.prol-name-confirm:hover{background:color-mix(in srgb,var(--acc) 75%,transparent);}',

        '.prol-continue{position:fixed;bottom:24px;right:24px;z-index:10001;padding:10px 26px;',
        'background:color-mix(in srgb,var(--acc) 30%,var(--card));',
        'border:1px solid color-mix(in srgb,var(--acc) 45%,transparent);',
        'border-radius:20px;color:var(--txt);font-size:.82rem;cursor:pointer;',
        'box-shadow:0 4px 16px color-mix(in srgb,var(--acc) 20%,transparent);transition:all .2s;}',
        '.prol-continue:hover{background:color-mix(in srgb,var(--acc) 55%,var(--card));}',

        '.prol-choices{display:grid;gap:10px;margin:16px 0;}',
        '.prol-choice-btn{padding:13px 18px;background:var(--card);',
        'border:1px solid color-mix(in srgb,var(--acc) 25%,transparent);border-radius:10px;',
        'color:var(--txt2);font-size:.86rem;cursor:pointer;text-align:left;transition:all .2s;}',
        '.prol-choice-btn:hover{background:color-mix(in srgb,var(--acc) 15%,var(--card));',
        'border-color:color-mix(in srgb,var(--acc) 50%,transparent);}',

        '.ending-icon{font-size:2.8rem;text-align:center;margin-bottom:8px;}',
        '.ending-title-main{text-align:center;font-size:1rem;color:var(--txt);',
        'font-weight:700;letter-spacing:2px;margin-bottom:4px;}',
        '.ending-subtitle{text-align:center;font-size:.62rem;color:var(--muted);',
        'letter-spacing:3px;margin-bottom:28px;}',

        '#ov-ending-choice{position:fixed;inset:0;z-index:10000;display:none;',
        'background:color-mix(in srgb,var(--bg) 95%,black);',
        'flex-direction:column;align-items:center;',
        'justify-content:center;padding:32px 24px;box-sizing:border-box;}',
        '.ec-title{font-size:1.1rem;color:var(--txt);font-weight:700;text-align:center;margin-bottom:8px;}',
        '.ec-sub{font-size:.75rem;color:var(--txt2);text-align:center;margin-bottom:32px;line-height:1.8;}',
        '.ec-btn{width:100%;max-width:340px;padding:16px;margin:7px 0;',
        'background:color-mix(in srgb,var(--acc) 12%,var(--card));',
        'border:1px solid color-mix(in srgb,var(--acc) 35%,transparent);',
        'border-radius:12px;color:var(--txt);font-size:.9rem;cursor:pointer;',
        'text-align:left;display:flex;align-items:center;gap:12px;transition:all .2s;}',
        '.ec-btn:hover{background:color-mix(in srgb,var(--acc) 28%,var(--card));}',
        '.ec-btn-icon{font-size:1.5rem;flex-shrink:0;}',
        '.ec-btn-text{flex:1;}',
        '.ec-btn-name{font-weight:700;margin-bottom:2px;}',
        '.ec-btn-desc{font-size:.72rem;color:var(--txt2);opacity:.7;}',

        '.btn-hunt{display:flex;align-items:center;justify-content:center;gap:8px;',
        'width:100%;padding:12px 10px;border-radius:10px;font-size:.84rem;',
        'cursor:pointer;transition:all .2s;box-sizing:border-box;}',
        '.btn-hunt-new{background:rgba(180,80,80,.12);border:1px solid rgba(200,100,100,.28);color:var(--txt);}',
        '.btn-hunt-new:hover{background:rgba(180,80,80,.25);}',
        '.btn-hunt-old{background:color-mix(in srgb,var(--acc) 8%,var(--card));',
        'border:1px solid color-mix(in srgb,var(--acc) 28%,transparent);color:var(--txt);}',
        '.btn-hunt-old:hover{background:color-mix(in srgb,var(--acc) 18%,var(--card));}',

        '#ov-prologue-log .sheet{max-height:88vh;overflow-y:auto;}',

        // ── 纳金横幅 ──
        '#nading-section{margin-bottom:14px;animation:prol-in .6s ease forwards;}',
        '.nading-banner{display:flex;align-items:center;gap:12px;padding:14px 16px;',
        'background:color-mix(in srgb,var(--acc) 10%,var(--card));',
        'border:1px solid color-mix(in srgb,var(--acc) 45%,transparent);',
        'border-radius:14px;',
        'box-shadow:0 2px 16px color-mix(in srgb,var(--acc) 18%,transparent);}',
        '.nading-icon{font-size:2rem;flex-shrink:0;}',
        '.nading-text{flex:1;min-width:0;}',
        '.nading-title{font-size:.9rem;font-weight:700;color:var(--acc);margin-bottom:2px;letter-spacing:1px;}',
        '.nading-desc{font-size:.72rem;color:var(--txt2);line-height:1.5;}',
        '.nading-btn{flex-shrink:0;padding:11px 20px;',
        'background:color-mix(in srgb,var(--acc) 65%,transparent);',
        'border:1px solid color-mix(in srgb,var(--acc) 80%,transparent);',
        'border-radius:22px;color:var(--txt);font-size:.84rem;font-weight:700;',
        'cursor:pointer;transition:all .2s;letter-spacing:1px;white-space:nowrap;}',
        '.nading-btn:hover{background:var(--acc);',
        'box-shadow:0 4px 16px color-mix(in srgb,var(--acc) 35%,transparent);}',

        // ── 结局选项增强 ──
        '#ending-choices.prol-choices{gap:12px;margin-top:28px;padding:0 0 8px;}',
        '.prol-choice-btn{padding:15px 20px;font-size:.88rem;border-radius:12px;}',
      ].join('');
      document.head.appendChild(style);
    },

    // ── HTML 注入 ─────────────────────────────────────────────

    _injectHTML: function() {
      if (document.getElementById('ov-prologue')) return;

      // ─ 注入纳金横幅到首页 ─
      var sHome = document.getElementById('s-home');
      if (sHome && !document.getElementById('nading-section')) {
        var nadingEl = document.createElement('div');
        nadingEl.id = 'nading-section';
        nadingEl.style.display = 'none';
        nadingEl.innerHTML =
          '<div class="nading-banner">' +
            '<div class="nading-icon">💰</div>' +
            '<div class="nading-text">' +
              '<div class="nading-title">目标金额已达成</div>' +
              '<div class="nading-desc">向委托人缴纳约定款项，正式开启结局</div>' +
            '</div>' +
            '<button class="nading-btn" onclick="PrologueSystem.startNading()">纳　金 ›</button>' +
          '</div>';
        // 插入到首页最顶部（玩家卡片之前）
        sHome.insertBefore(nadingEl, sHome.firstChild);
      }

      var div = document.createElement('div');
      div.innerHTML = [

        // ─ 序章弹窗 ─
        '<div id="ov-prologue">',
        '<div class="prol-wrap" id="prol-wrap" onclick="PrologueSystem.prologueNext()">',
        '<div class="prol-header">',
        '<div class="prol-header-icon">📜 · · · · · 📜</div>',
        '<div class="prol-header-sub">— PROLOGUE —</div>',
        '</div>',
        '<div class="prol-text-area" id="prol-text-area"></div>',
        '</div>',
        '</div>',

        // ─ 结局弹窗（可上下滑动阅读，选项自动出现） ─
        '<div id="ov-ending">',
        '<div class="prol-wrap" id="ending-wrap">',
        '<div class="ending-icon" id="ending-icon">🏆</div>',
        '<div class="ending-title-main" id="ending-title">结局</div>',
        '<div class="ending-subtitle" id="ending-subtitle"></div>',
        '<div class="prol-text-area" id="ending-text-area"></div>',
        '<div class="prol-choices" id="ending-choices" style="display:none"></div>',
        // 完成按钮：只有读完所有剧情/选完分支后才显示
        '<div style="display:flex;justify-content:center;margin-top:32px;padding-bottom:20px">',
        '<button class="prol-continue" id="ending-continue" style="display:none" onclick="PrologueSystem.endingNext()">继续 ›</button>',
        '<button class="prol-continue" id="ending-finish" style="display:none" onclick="PrologueSystem.endingFinish()">✦ 保存结局并关闭</button>',
        '</div>',
        '</div>',
        '</div>',

        // ─ 隐藏结局版本选择 ─
        '<div id="ov-ending-choice" style="display:none">',
        '<div class="ec-title">✨ 隐藏结局 · 神明大人</div>',
        '<div class="ec-sub">某位奴隶的羁绊已深入骨髓<br>两套结局，选择你想展开的命运</div>',
        '<button class="ec-btn" onclick="PrologueSystem.chooseHiddenVersion(\'remix\')">',
        '<span class="ec-btn-icon">✨</span><div class="ec-btn-text"><div class="ec-btn-name">魔改版</div><div class="ec-btn-desc">Ending No.0 · 完美结局 · 只属于他的神明大人</div></div>',
        '</button>',
        '<button class="ec-btn" onclick="PrologueSystem.chooseHiddenVersion(\'original\')">',
        '<span class="ec-btn-icon">🌟</span><div class="ec-btn-text"><div class="ec-btn-name">原版</div><div class="ec-btn-desc">Ending No.0 · TRUE结局 · 回到现实还是留在梦境</div></div>',
        '</button>',
        '<button class="ec-btn" onclick="PrologueSystem.choosePlainEnding()" style="margin-top:16px;border-style:dashed;opacity:.7">',
        '<span class="ec-btn-icon">🔗</span><div class="ec-btn-text"><div class="ec-btn-name">普通结局</div><div class="ec-btn-desc">根据调教数据自动判定结局类型</div></div>',
        '</button>',
        '</div>',

        // ─ 序章与结局 日志弹窗 ─
        '<div class="ov" id="ov-prologue-log">',
        '<div class="sheet">',
        '<div class="s-hdl"></div>',
        '<div class="s-hdr"><span class="s-ttl-modal">📜 序章与结局</span><button class="s-x" onclick="closeOv(\'ov-prologue-log\')">✕</button></div>',
        '<div class="s-body" id="prol-log-body"></div>',
        '</div>',
        '</div>',

      ].join('');
      document.body.appendChild(div);
    }

  };

  // 暴露到全局
  global.PrologueSystem = PS;

  // ── 自动初始化（在所有脚本加载后执行）──────────────────
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      try { PS.init(); } catch(e) { console.warn('[prologue]', e); }
    }, 300);
  });

})(window);
