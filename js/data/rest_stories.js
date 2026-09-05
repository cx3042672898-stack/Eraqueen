// js/data/rest_stories.js  ──  休息剧情数据
// ══════════════════════════════════════════════════════════════
// 本文件包含两类休息剧情：
//
//   ①  REST_STORIES          独处休息剧情（无奴隶陪伴）
//       格式：{ id, title, story:[], effects:{stamina,energy} }
//       由原 work_events.js 拆分移入，供 doRest()/doRestFromHome() 使用。
//
//   ②  COMPANION_REST_STORIES  陪伴休息剧情（需要 State.currentChar）
//       格式：{ id, title, affectionGain, condition(charA,charB), dynamicStory(charA,charB) }
//       由本文件末尾的 window.load 补丁注入 doRest()，
//       在有调教对象时以 50% 概率优先触发。
//
// ══════════════════════════════════════════════════════════════
// 📖  陪伴剧情写作规范
//   · {A} 用法：直接用 charA.name 替换，不写字面量 {A}
//   · 性格检测：_restHasTrait(char, '高傲')  字符串模糊匹配 personality
//   · 路线检测：_restIsOnRoute(char, 'love') 检查 affection>=85 或 tag '恋慕'
//   · 第二奴隶：通过 _restGetSecondSlave(charA.id) 获取，可能为 null
//   · 好感增减：affectionGain 字段（正整数），由 _doCompanionRest 统一处理
// ══════════════════════════════════════════════════════════════


// ── 1. 独处休息剧情 ───────────────────────────────────────────
const REST_STORIES = [
  {
    id: 'rest_1',
    title: '难得的午睡',
    story: [
      '难得有一段没有任何安排的时间，窗外的阳光温温的，没有让人不舒服。',
      '在椅子上坐下，闭上眼睛，原本只是想休息一会儿……',
      '醒来时，光线已经偏移了两三个时辰。',
      '有什么梦，但记不清了，只剩下一点轻盈的余韵，像是去了某个地方，又回来了。',
      '体力恢复了不少，头脑也清醒了许多。今天余下的时间，可以做些别的事情了。',
    ],
    effects: { stamina: 30, energy: 25 },
  },
  {
    id: 'rest_2',
    title: '窗边的傍晚',
    story: [
      '决定今天什么都不做。',
      '搬了把椅子到窗边，看着外面的天色一点点从亮变暗。',
      '鸟叫声渐渐稀少，炊烟开始在各处升起，远处传来孩子回家的声音。',
      '这种平凡的喧嚣，有时候比沉默更让人感到安稳。',
      '等到星星出来，才从窗边站起身，重新回到了正常的节奏里。',
    ],
    effects: { stamina: 25, energy: 30 },
  },
  {
    id: 'rest_3',
    title: '浴后的清醒',
    story: [
      '烧了一桶热水，好好地泡了一个澡。',
      '热气蒸腾，皮肤被泡得发红，脑子里乱七八糟的思绪也渐渐沉淀下去。',
      '水渐渐凉了，还是不想起来。',
      '最终还是出来了，换上干净的衣物，浑身上下都是一种说不清楚的轻盈。',
      '今天不必做什么，就这样就够了。',
    ],
    effects: { stamina: 28, energy: 28 },
  },
  {
    id: 'rest_4',
    title: '意外的失眠',
    story: [
      '躺下去，睡不着。',
      '翻了个身，还是睡不着。天花板上有一道裂缝，不知道什么时候出现的。',
      '脑子里反复浮现出一些碎片，不成体系，却赶也赶不走。',
      '最终还是迷迷糊糊地睡着了，只是不知道究竟睡了多久。',
      '醒来感觉也不算太糟，总比没睡要强一点。',
    ],
    effects: { stamina: 15, energy: 18 },
  },
];


// ══════════════════════════════════════════════════════════════
// ── 2. 陪伴休息辅助函数 ───────────────────────────────────────
// ══════════════════════════════════════════════════════════════

/**
 * 检查奴隶是否具有某个性格特质（模糊匹配 personality 字段）
 * 例：_restHasTrait(char, '高傲') → true / false
 */
function _restHasTrait(char, trait) {
  if (!char || !trait) return false;
  var p = String(char.personality || '');
  if (p.indexOf(trait) >= 0) return true;
  // 同时检查 special_traits 数组（如果存在于 char 对象中）
  if (Array.isArray(char.special_traits)) {
    for (var i = 0; i < char.special_traits.length; i++) {
      if (String(char.special_traits[i]).indexOf(trait) >= 0) return true;
    }
  }
  // 从 CHARS_DATA 中查找 special_traits
  if (typeof CHARS_DATA !== 'undefined' && char.id != null) {
    var base = null;
    for (var j = 0; j < CHARS_DATA.length; j++) {
      if (String(CHARS_DATA[j].id) === String(char.id)) { base = CHARS_DATA[j]; break; }
    }
    if (base && Array.isArray(base.special_traits)) {
      for (var k = 0; k < base.special_traits.length; k++) {
        if (String(base.special_traits[k]).indexOf(trait) >= 0) return true;
      }
    }
  }
  return false;
}

/**
 * 检查奴隶是否已激活某条路线
 * routeId: 'love'(恋慕) | 'domination'(服从) | 'lust'(淫乱) | 'yandere'(病娇) | 'dark'(蚀心)
 */
function _restIsOnRoute(char, routeId) {
  if (!char) return false;
  var tagMap = { love: '恋慕', domination: '服从', lust: '淫乱', yandere: '病娇', dark: '蚀心' };
  var tag = tagMap[routeId] || '';
  // 已完成路线
  if (Array.isArray(char.completedRoutes) && char.completedRoutes.indexOf(routeId) >= 0) return true;
  // 已有路线标签
  if (tag && Array.isArray(char.tags) && char.tags.indexOf(tag) >= 0) return true;
  // 数值阈值（未正式完成但满足条件）
  var aff = char.affection || 0, obd = char.obedience || 0, lust = char.lust || 0;
  switch (routeId) {
    case 'love':       return aff >= 85;
    case 'domination': return obd >= 90;
    case 'lust':       return lust >= 90;
    case 'yandere':    return aff >= 85 && obd >= 85;
    case 'dark':       return aff <= -10 && obd >= 65;
  }
  return false;
}

/**
 * 寻找另一位满足条件的奴隶（用于修罗场剧情）
 * 条件：已获得 & 好感度>=60 或拥有"恋慕"标签
 * 返回该奴隶的 save.char 对象，或 null
 */
function _restGetSecondSlave(currentCharId) {
  if (typeof CHARS_DATA === 'undefined' || typeof loadSave !== 'function') return null;
  var candidates = [];
  for (var i = 0; i < CHARS_DATA.length; i++) {
    var c = CHARS_DATA[i];
    if (String(c.id) === String(currentCharId)) continue;
    var sv = loadSave(c.id);
    if (!sv || !sv.char) continue;
    var sc = sv.char;
    var hasLoveTag = Array.isArray(sc.tags) && sc.tags.indexOf('恋慕') >= 0;
    if (hasLoveTag || (sc.affection || 0) >= 60) {
      candidates.push(sc);
    }
  }
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * 为奴隶增加好感度并写入存档
 */
function _restGainAffection(charId, amount) {
  if (!charId || !amount || typeof loadSave !== 'function') return;
  var sv = loadSave(charId);
  if (!sv || !sv.char) return;
  var clampFn = typeof clamp === 'function' ? clamp : function(v) { return Math.max(0, Math.min(100, v)); };
  sv.char.affection = clampFn((sv.char.affection || 0) + amount);
  try { localStorage.setItem('era_sv_' + charId, JSON.stringify(sv)); } catch(e) {}
  // 同步内存中的 currentChar
  if (typeof State !== 'undefined' && State.currentChar &&
      String(State.currentChar.id) === String(charId)) {
    State.currentChar.affection = sv.char.affection;
  }
}

/**
 * 执行陪伴休息剧情的完整流程（恢复体力/精力、推进天数、展示弹窗）
 * 与 doRest() 机制相同，额外处理动态剧情文本与好感增益
 */
function _doCompanionRest(cs, charA, charB) {
  // 1. 生成动态剧情文本
  var storyArr;
  try { storyArr = cs.dynamicStory(charA, charB); } catch(e) { storyArr = ['……（剧情生成出错）']; }

  var effHtml = '';

  // 2. 恢复奴隶体力与精力（上限的一半）
  if (charA) {
    var maxSta = typeof getMaxStamina === 'function' ? getMaxStamina(charA) : 1500;
    var maxEne = typeof getMaxEnergy  === 'function' ? getMaxEnergy(charA)  : 1500;
    var slaveStaGain = Math.floor(maxSta * 0.5);
    var slaveEneGain = Math.floor(maxEne * 0.5);
    charA.stamina = Math.min(maxSta, (charA.stamina || 0) + slaveStaGain);
    charA.energy  = Math.min(maxEne, (charA.energy  || 0) + slaveEneGain);
    effHtml += '<span class="eff-item eff-pos" style="margin-right:8px;display:inline-block;font-size:0.85rem;">💪 奴隶体力 +' + slaveStaGain + '</span>';
    effHtml += '<span class="eff-item eff-pos" style="margin-right:8px;display:inline-block;font-size:0.85rem;">🔋 奴隶精力 +' + slaveEneGain + '</span>';
    if (typeof writeSave === 'function') writeSave();
    if (typeof setStat === 'function') {
      setStat('stamina', charA.stamina);
      setStat('energy',  charA.energy);
    }
  }

  // 3. 推进天数
  State.day = (State.day || 1) + 1;

  // 4. 恢复主人体力与精力
  if (typeof _playerProfile !== 'undefined') {
    var maxPSta = _playerProfile.staminaMax || 2000;
    var maxPEne = _playerProfile.energyMax  || 3000;
    var pStaGain = Math.floor(maxPSta * 0.5);
    var pEneGain = Math.floor(maxPEne * 0.5);
    _playerProfile.stamina = Math.min(maxPSta, (_playerProfile.stamina || 0) + pStaGain);
    _playerProfile.energy  = Math.min(maxPEne, (_playerProfile.energy  || 0) + pEneGain);
    try { localStorage.setItem('era_profile', JSON.stringify(_playerProfile)); } catch(e) {}
    effHtml += '<span class="eff-item eff-pos" style="display:inline-block;font-size:0.85rem;">👑 主人体力 +' + pStaGain + '</span> ';
    effHtml += '<span class="eff-item eff-pos" style="display:inline-block;font-size:0.85rem;">👑 主人精力 +' + pEneGain + '</span>';
  }

  // 5. 更新顶部栏
  var sub = document.getElementById('hdr-sub');
  if (sub && charA) {
    sub.textContent = '第 ' + State.day + ' 天 · 训练 ' + (charA.total_training_count || 0) + ' 次';
  }

  // 6. 好感度增益
  if (cs.affectionGain && charA) {
    _restGainAffection(charA.id, cs.affectionGain);
    effHtml += '<span class="eff-item eff-pos" style="display:inline-block;font-size:0.85rem;margin-left:8px;">💕 好感度 +' + cs.affectionGain + '</span>';
  }

  // 7. 写入日志
  var dateStr = typeof getDateStr === 'function' ? getDateStr() : ('第' + State.day + '天');
  if (typeof pushStoryLog === 'function') {
    pushStoryLog('rest', { title: cs.title, date: dateStr, story: storyArr });
  }

  if (typeof renderPlayerCard === 'function') renderPlayerCard();

  // 8. 组装带结算框的展示剧情
  var displayStory = storyArr.slice();
  if (effHtml) {
    displayStory.push(
      '<div style="margin-top:15px;padding:12px;background:rgba(115,209,139,0.1);border-left:4px solid #73d18b;border-radius:6px;">' +
        '<div style="font-size:0.85rem;color:var(--txt);font-weight:bold;margin-bottom:6px;">🌙 休息效果结算：</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + effHtml + '</div>' +
      '</div>'
    );
  }

  // 9. 打开剧情弹窗
  if (typeof openStoryModal === 'function') {
    openStoryModal({ title: '💕 休息 · ' + cs.title, story: displayStory }, '陪伴休息', {});
  }
  // 新天卡片（排队在剧情弹窗之后弹出）
  if (typeof showNewDayCard === 'function') showNewDayCard(State.day, 350);
}


// ══════════════════════════════════════════════════════════════
// ── 3. 陪伴休息剧情库 ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
// condition(charA, charB) : 返回 true 则允许触发
// dynamicStory(charA, charB) : 返回 string[] 剧情段落数组
// affectionGain : 触发后对 charA 增加的好感度

const COMPANION_REST_STORIES = [

  // ─────────────────────────────────────────────────────────
  // 【DAILY_LIFE_144】  爱人的陪伴·小憩
  //   场景一：膝枕与摇篮曲      (默认)
  //   场景二：同床共枕           (默认)
  //   场景三：沙发上的依偎       (默认)
  //   场景四：高傲/傲娇的照顾    (需要 高傲 或 傲娇 性格)
  //   场景五：反转的守护者       (默认；场景四条件不满足时也会跳到这里)
  // ─────────────────────────────────────────────────────────
  {
    id: 'companion_rest_144',
    title: '爱人的陪伴·小憩',
    affectionGain: 5,
    condition: function(charA) { return !!charA; },
    dynamicStory: function(charA /*, charB */) {
      var n  = charA.name || '奴隶';
      var mn = (typeof _playerProfile !== 'undefined' && _playerProfile && _playerProfile.name)
               ? _playerProfile.name : '主人';

      var intro = [
        '今天并不打算进行调教，身体也有些乏了，正准备在房间里小憩片刻。',
        '正在这时，' + n + '造访了房间，似乎是想和我一起度过这段悠闲的时光……'
      ];

      var roll = Math.floor(Math.random() * 5);

      // 场景四须检测性格
      if (roll === 3 && !(_restHasTrait(charA, '高傲') || _restHasTrait(charA, '傲娇'))) {
        roll = 4; // 跳到场景五
      }

      var scene;
      switch (roll) {

        // ── 场景一：膝枕与摇篮曲 ──────────────────────────────
        case 0: {
          // 若有歌唱天赋且50%概率，触发摇篮曲变体
          var hasSong = _restHasTrait(charA, '歌唱') || _restHasTrait(charA, '音乐');
          if (hasSong && Math.random() < 0.5) {
            scene = [
              n + '的眼睛亮了一下，随即有些羞涩地拍了拍自己的大腿。',
              '「那个……如果不嫌弃的话，请用我的膝枕吧。」',
              '难得' + n + '主动提出，这份心意让人无法拒绝。顺从地躺下，将头靠在了他那柔软而富有弹性的膝盖上。',
              '……比预想的还要舒服得多。鼻间萦绕着' + n + '身上淡淡的馨香，耳边是他平稳的呼吸声，内心渐渐平静了下来。',
              '充当膝枕的' + n + '也一脸恬淡安定的神情，手指无意识地、轻柔地穿梭在我的发间，带来了令人昏昏欲睡的舒适感。',
              n + '用极轻、极柔和的嗓音，哼唱起一首舒缓的摇篮曲。那歌声仿佛带着某种魔力，将整个房间都笼罩在了一片温暖而宁静的氛围中。',
              '眼皮越来越重，意识也逐渐模糊，最终彻底沉入了梦乡。',
              '……数小时后，在' + n + '温柔的呼唤声中醒来，只觉得浑身的疲惫都一扫而空。',
            ];
          } else {
            scene = [
              n + '的眼睛亮了一下，随即有些羞涩地拍了拍自己的大腿。',
              '「那个……如果不嫌弃的话，请用我的膝枕吧。」',
              '难得' + n + '主动提出，这份心意让人无法拒绝。顺从地躺下，将头靠在了他那柔软而富有弹性的膝盖上。',
              '……比预想的还要舒服得多。鼻间萦绕着' + n + '身上淡淡的馨香，内心渐渐平静了下来。',
              '充当膝枕的' + n + '一脸恬淡，手指轻柔地穿梭在我的发间，带来了令人昏昏欲睡的舒适感。',
              '这份安心感太过舒适，不知不觉中，迷迷糊糊地睡着了。',
              '等再次睁开眼睛时，发现' + n + '也歪着头睡了过去，长长的睫毛在脸颊上投下一小片阴影。',
              '看着他毫无防备的睡颜，心中泛起一阵柔软。小心翼翼地将头从他的膝盖上移开，轻轻地将他抱起，安置在了柔软的床上。',
            ];
          }
          break;
        }

        // ── 场景二：同床共枕 ────────────────────────────────
        case 1: {
          var isChildish = _restHasTrait(charA, '小恶魔') || _restHasTrait(charA, '幼稚') ||
                           _restHasTrait(charA, '调皮');
          if (isChildish && Math.random() < 0.5) {
            // 梦话变体（小恶魔/幼稚）
            scene = [
              n + '听说要小睡，立刻表示想一起睡，还喊着"请稍等一会儿"跑了出去。',
              '几分钟后，他抱着一床蓬松棉被和自己最喜欢的枕头回来了，像一只准备筑巢的小动物。',
              '两人一起躺下，盖上同一床被子。身边多了一个温暖的身体，一时半会儿倒没了睡意，只好闭目养神。',
              '不一会儿，' + n + '就发出了均匀的呼吸声。突然，他在梦中喃喃呓语起来。',
              '「' + mn + '……最喜欢了……嘿嘿……」那软糯带着傻气的梦话，和平日里判若两人。',
              '这副可爱的模样，让人忍不住伸出手臂，将这个小家伙紧紧地搂在怀里。',
              '感觉到怀抱的温暖，' + n + '满足地蹭了蹭，睡得更沉了。看着他安详的睡颜，睡意也渐渐涌了上来……',
            ];
          } else {
            // 八爪鱼变体
            scene = [
              n + '听说要小睡，立刻表示想一起睡，还喊着"请稍等"跑了出去。',
              '几分钟后，他抱着棉被和枕头回来，像一只准备筑巢的小动物。',
              '两人一起躺下，盖上同一床被子。' + n + '的体温透过薄薄的睡衣传递过来，非常舒服。',
              '感受着这份温暖，意识渐渐模糊。突然，睡得迷迷糊糊的' + n + '无意识地翻了个身，像只八爪鱼一样紧紧地抱住了我。',
              '虽然被抱住后动弹不得，但意外地有一种奇妙的安宁感。',
              '鼻间萦绕着' + n + '身上独特的、干净清爽的味道，眼皮越来越沉重，最终慢慢地闭上了双眼……',
            ];
          }
          break;
        }

        // ── 场景三：沙发上的依偎 ────────────────────────────
        case 2: {
          scene = [
            '本来只是打算在沙发上靠一会儿，' + n + '却端着一杯温牛奶走了进来。',
            '「喝一点热的东西，会更容易放松。」他轻声说道，然后在我身边坐下，并没有离开的意思。',
            '两人都没有说话，只是静静地靠在一起，听着窗外偶尔传来的风声。',
            '房间里的气氛安逸得让人犯困。不知不觉间，头就靠在了' + n + '的肩膀上。',
            '他的身体微微一僵，随即放松下来，还小心地调整了一下姿势，让我能靠得更舒服一些。',
            '意识的最后，是感觉到一床轻柔的毯子被轻轻地盖在了我们两人身上……',
          ];
          break;
        }

        // ── 场景四：高傲/傲娇的照顾 ───────────────────────
        case 3: {
          scene = [
            n + '轻哼了一声，脸上带着一丝不情愿。',
            '「真是拿你没办法……连照顾自己都不会吗？」他嘴上这么说着，却主动走到床边，为我铺好了枕头。',
            '「喂，过来躺下。」那命令般的语气，此刻听起来却毫无威慑力，反而透着一股笨拙的关心。',
            '顺从地躺下后，' + n + '又拿来一床毯子，有些粗鲁地盖在我身上。',
            '「……我、我可不是特意为你做的！只是看你这副样子很碍眼罢了！」他红着脸，撇过头去，不敢看我。',
            '他搬了张椅子坐在床边，拿起一本书，假装在看，但视线却时不时地偷偷瞟向我这边。',
            '在这份口是心非的守护下，安心地闭上了眼睛。',
          ];
          break;
        }

        // ── 场景五：反转的守护者（默认 & 场景四兜底） ────────
        default: {
          scene = [
            n + '走进来的时候，脸色有些苍白，眼下带着淡淡的青色，看起来非常疲惫。',
            '「怎么了？看起来很累的样子。」',
            '「没什么……只是昨晚没睡好……」' + n + '摇了摇头，却还是强打起精神，想在我身边待着。',
            '看着他这副逞强的样子，不由得叹了口气。',
            '拉过他的手，将他按坐在床上。「今天换我来照顾你，你好好睡一觉。」',
            n + '愣住了，有些不知所措地看着我。',
            '为他盖好被子，然后搬了张椅子坐在床边，就像平日里他守护我那样。',
            '「睡吧，我在这里。」',
            '他的眼中泛起一丝水光，最终安心地闭上了眼睛，很快就沉沉睡去。',
            '看着' + n + '恬静的睡颜，我没有丝毫睡意，只是静静地守护着这份难得的安宁。',
          ];
          break;
        }
      }

      return intro.concat(scene).concat([ n + '的好感度 ＋5']);
    }
  },


  // ─────────────────────────────────────────────────────────
  // 【DAILY_LIFE_145】  爱人的陪伴·放松时刻
  //   场景一：甜蜜的修罗场      (需要另一位有好感的奴隶 charB)
  //   场景二：害羞的靠近         (需要 害羞 或 胆怯 性格)
  //   场景三：淘气的打扰者       (需要 小恶魔/幼稚/调皮 性格)
  //   场景四：共享的爱好         (默认)
  //   场景五：无言的依偎         (默认兜底)
  //
  //   条件级联：若高序号场景条件不满足，自动落到下一个场景。
  //   最终结局文字根据随机时间段变化（午饭前 / 晚饭前）。
  // ─────────────────────────────────────────────────────────
  {
    id: 'companion_rest_145',
    title: '爱人的陪伴·放松时刻',
    affectionGain: 5,
    condition: function(charA) { return !!charA; },
    dynamicStory: function(charA, charB) {
      var n  = charA.name || '奴隶';
      var mn = (typeof _playerProfile !== 'undefined' && _playerProfile && _playerProfile.name)
               ? _playerProfile.name : '主人';

      var intro = ['正在房间的沙发上放松时，' + n + '突然走了进来。'];

      // 级联场景选择（0-4随机，然后按条件向下降级）
      var roll = Math.floor(Math.random() * 5);

      // 场景1检测：需要 charB（另一位有好感/恋慕标签的奴隶）
      if (roll === 0 && !charB) roll = 1;

      // 场景2检测：需要 害羞 或 胆怯 性格
      if (roll === 1 && !(_restHasTrait(charA, '害羞') || _restHasTrait(charA, '胆怯'))) roll = 2;

      // 场景3检测：需要 小恶魔/幼稚/调皮 性格
      if (roll === 2 && !(_restHasTrait(charA, '小恶魔') || _restHasTrait(charA, '幼稚') ||
                           _restHasTrait(charA, '调皮'))) roll = 3;

      // 场景4、5 无条件限制
      var scene;
      switch (roll) {

        // ── 场景一：甜蜜的修罗场 ────────────────────────────
        case 0: {
          var bn = charB ? (charB.name || '另一位奴隶') : '';
          scene = [
            n + '自然而然地在我身边坐下，将头轻轻靠在了我的左肩上。',
            '正享受着这份宁静，房间的门又被敲响了，' + bn + '端着一盘刚切好的水果走了进来。',
            '「' + mn + '，我准备了一些点心……」' + bn + '的声音在看到依偎在我身上的' + n + '时，戛然而止。',
            '空气中瞬间弥漫开一股微妙的、带着甜香的火药味。',
            bn + '微笑着，若无其事地在我右边坐下，用牙签叉起一块最甜的蜜瓜递到我的唇边：「啊，请用。」',
            '靠在我左肩的' + n + '不甘示弱地抬起头，拿起我放在桌上的书翻到我正在看的那一页，柔声问道：「您刚才看到这里了吧？需要我为您读出来吗？」',
            '一时间，被夹在了中间，左边是温柔的陪读请求，右边是香甜的水果投喂。',
            '看着他们俩用最温和的表情进行着无声的较量，心中既有些好笑，又感到一丝甜蜜的困扰。',
            '最后，只好无奈地叹了口气，伸出双臂，将左边的' + n + '和右边的' + bn + '一同揽入怀中。',
            '「好了，都安分一点。」',
            '怀里的两个身体都僵了一下，随即放松下来，乖巧地依偎着。这场小小的战争，最终以意想不到的和平方式结束了。',
          ];
          break;
        }

        // ── 场景二：害羞的靠近 ──────────────────────────────
        case 1: {
          scene = [
            n + '站在门口，双手紧张地绞着衣角，一副欲言又止的模样。',
            '询问有什么事，' + n + '的脸颊泛起红晕，吞吞吐吐地也说不出个所以然来。',
            '看着他那副想靠近又不敢的样子，心中不禁觉得有些可爱。',
            '于是，拍了拍身边的空位，温和地说道：「过来坐吧。」',
            '这句话仿佛给了他莫大的勇气，' + n + '小心翼翼地走过来，在我身边坐下，身体还有些僵硬。',
            '伸手将他轻轻拉入怀中，能感觉到怀里的身体猛地一颤，随即渐渐放松下来，将头羞涩地埋在了我的胸前。',
            '房间里很安静，只能听到彼此平稳的呼吸和心跳声。这份宁静，对他来说，或许就是最大的幸福了。',
          ];
          break;
        }

        // ── 场景三：淘气的打扰者 ────────────────────────────
        case 2: {
          scene = [
            '正靠在沙发上闭目养神，突然感觉有一缕发丝轻轻搔着脸颊。',
            '睁开眼，便看到' + n + '正趴在沙发背上，探着头，用一双亮晶晶的眼睛好奇地打量着我。',
            '「' + mn + '～一个人待着多无聊呀，陪我玩嘛～」他用撒娇的、甜腻的语气说道。',
            '还没等我回答，他就像只灵活的小猫一样翻过沙发，直接扑进了我的怀里，咯咯地笑着。',
            '原本宁静的放松时间，瞬间被这个小家伙搅得一团乱。',
            '他在我怀里蹭来蹭去，一会儿捏捏我的脸，一会儿又去玩我的头发，精力旺盛得让人头疼。',
            '虽然有些无奈，但看着他那发自内心的灿烂笑容，所有的疲惫似乎也都烟消云散了。',
            '只好放弃了小憩的打算，陪着这个淘气鬼玩闹起来。',
          ];
          break;
        }

        // ── 场景四：共享的爱好 ──────────────────────────────
        case 3: {
          scene = [
            n + '走进来时，手里捧着一本厚厚的画册。',
            '「' + mn + '，您看，这是我今天在书房找到的。」他在我身边坐下，将画册摊开在我的膝上。',
            '那是一本关于遥远国度的风景画册，画风细腻而优美。',
            n + '的手指在画页上轻轻划过，为我讲述着每一幅画背后的故事和传说，眼中闪烁着向往的光芒。',
            '没有说话，只是静静地听着，偶尔侧过头，看到的却是' + n + '比画中风景还要动人的侧脸。',
            '时间仿佛在这一刻放慢了脚步，窗外的阳光正好，身边的人也正好。',
            '我们一页一页地翻看着，仿佛真的进行了一场跨越千山万水的旅行。',
          ];
          break;
        }

        // ── 场景五：无言的依偎（默认兜底） ─────────────────
        default: {
          scene = [
            n + '什么也没说，只是自然而然地在我身边坐下。',
            '熟练地拿起我的手，与他自己的十指相扣，然后将头轻轻靠在我的肩膀上，满足地眯起了眼睛，像一只找到了最舒适角落的猫咪。',
            '房间里很安静，只有窗帘被微风吹动的沙沙声。',
            '不需要任何言语，这份温暖的重量和交握的手心，已经传递了所有想说的话。',
            '也放松下来，将头靠在他的头上，享受着这份无需言语的默契与安宁。',
          ];
          break;
        }
      }

      // 结尾：随机选择午饭前/晚饭前时间段
      var ending = Math.random() < 0.5
        ? '午饭前的这段时光，就这样在' + n + '的陪伴下，温馨地度过了。'
        : '晚饭前的这段时光，就这样在' + n + '的陪伴下，温馨地度过了。';

      return intro.concat(scene).concat([ending, '——　' + n + '的好感度 ＋5']);
    }
  },

]; // end COMPANION_REST_STORIES


// ══════════════════════════════════════════════════════════════
// ── 4. doRest() 补丁（在所有脚本加载完毕后注入）─────────────
// ══════════════════════════════════════════════════════════════
// 原 doRest() 在 index.html 的内联 <script> 中定义；
// 本补丁在 window.load 触发时（原函数已就绪）进行劫持：
//   · 若有 State.currentChar 且满足条件 → 50% 概率触发陪伴剧情
//   · 否则正常调用原 doRest()
// ══════════════════════════════════════════════════════════════
window.addEventListener('load', function () {
  var _origDoRest = typeof doRest === 'function' ? doRest : null;

  window.doRest = function () {
    // 尝试触发陪伴休息剧情
    if (typeof State !== 'undefined' && State.currentChar &&
        typeof COMPANION_REST_STORIES !== 'undefined' && COMPANION_REST_STORIES.length &&
        Math.random() < 0.5) {

      var charA = State.currentChar;
      // 为修罗场剧情预先寻找第二位奴隶
      var charB = typeof _restGetSecondSlave === 'function'
                  ? _restGetSecondSlave(charA.id) : null;

      // 筛选满足条件的陪伴剧情
      var eligible = COMPANION_REST_STORIES.filter(function (s) {
        return !s.condition || s.condition(charA, charB);
      });

      if (eligible.length) {
        var cs = eligible[Math.floor(Math.random() * eligible.length)];
        _doCompanionRest(cs, charA, charB);
        return; // 已处理，不走原 doRest
      }
    }

    // 回退：调用原 doRest（独处休息剧情）
    if (typeof _origDoRest === 'function') _origDoRest();
  };
});
