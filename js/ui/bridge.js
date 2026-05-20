// ============================================================
// js/ui/bridge.js
// eraQueenA+ 统一集成桥梁 (Master Integration Bridge)
//
// 替代之前的 enhance.js + emotion_bridge.js
// 所有 monkey-patch 在一个文件中、一次执行、顺序明确
//
// 功能清单：
//   §1 浮动数值反馈 (showFloatNum / showFloatNums)
//   §2 属性条脉冲效果 (patch setStat)
//   §3 按钮光标追踪发光
//   §4 触控涟漪效果
//   §5 角色初始化钩子 (patch selectChar → initPersonality + initEmotion)
//   §6 行动执行钩子 (patch doAction → personality + emotion + 浮字 + 事件链)
//   §7 渲染钩子 (patch renderPlay → 人格标签 + 情绪标签)
//   §8 详情弹窗注入 (MutationObserver → 人格面板 + 情绪面板)
//   §9 台词增强 (getEnhancedDialogue)
//   §10 关系阶段通知
//
// 加载顺序：必须在所有其他JS之后加载（最后一个<script>）
// 依赖：state.js, game.js (必需)
// 可选依赖：personality.js, emotion.js (有则启用对应功能)
// ============================================================

(function masterBridge() {
  'use strict';

  // ── 能力检测 ──────────────────────────────────────────────
  const HAS_PERSONALITY = typeof initPersonality === 'function';
  const HAS_EMOTION     = typeof updateEmotion === 'function';
  const REDUCED_MOTION  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  console.log(`[bridge] Personality: ${HAS_PERSONALITY ? '✓' : '✗'}, Emotion: ${HAS_EMOTION ? '✓' : '✗'}`);


  // ════════════════════════════════════════════════════════════
  // §1 浮动数值反馈
  // ════════════════════════════════════════════════════════════

  const _floatContainer = (() => {
    let c = document.getElementById('float-num-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'float-num-container';
      c.className = 'float-num-container';
      document.body.appendChild(c);
    }
    return c;
  })();

  const _LABELS = {
    trust:'信任', fear:'恐惧', dependency:'依赖', shame:'羞耻',
    pride:'自尊', love:'爱情', sanity:'理智', broken:'崩坏',
    stamina:'体力', energy:'精力', lust:'欲望',
    obedience:'服从', affection:'好感', money:'金币',
    nervous:'不安', jealousy:'嫉妒', possessive:'占有',
    vulnerable:'脆弱', obedient:'顺从', rebellious:'反叛',
    attached:'依恋', unstable:'不稳定',
  };
  const _ICONS = {
    trust:'🤝', fear:'😰', dependency:'🫂', shame:'😳',
    pride:'👑', love:'💗', sanity:'🧠', broken:'💔',
    stamina:'💪', energy:'⚡', lust:'🔥',
    obedience:'👁', affection:'❤', money:'💰',
    nervous:'😟', jealousy:'💢', possessive:'🔒',
    vulnerable:'🥀', obedient:'🐾', rebellious:'🔥',
    attached:'💫', unstable:'⚡',
  };

  window.showFloatNum = function(text, type, x, y) {
    // 已禁用浮动数值弹幕
    return;
  };

  window.showFloatNums = function(changes, anchor) {
    // 已禁用浮动数值弹幕
    return;
  };


  // ════════════════════════════════════════════════════════════
  // §2 属性条脉冲 (patch setStat)
  // ════════════════════════════════════════════════════════════

  if (typeof setStat === 'function') {
    const _origSetStat = setStat;
    window.setStat = function(name, val) {
      const numEl = document.getElementById(`sv-${name}`);
      const barEl = document.getElementById(`sb-${name}`);
      const oldVal = numEl ? parseInt(numEl.textContent) : null;
      _origSetStat(name, val);
      const newVal = Math.round(val);
      if (oldVal !== null && oldVal !== newVal) {
        if (barEl) {
          barEl.classList.remove('pulse');
          void barEl.offsetWidth;
          barEl.classList.add('pulse');
          setTimeout(() => barEl.classList.remove('pulse'), 500);
        }
        if (numEl) {
          numEl.classList.remove('changed');
          void numEl.offsetWidth;
          numEl.classList.add('changed');
          setTimeout(() => numEl.classList.remove('changed'), 500);
        }
      }
    };
  }


  // ════════════════════════════════════════════════════════════
  // §3 按钮光标追踪发光
  // ════════════════════════════════════════════════════════════

  document.addEventListener('pointermove', (e) => {
    const btn = e.target.closest('.act-btn');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', ((e.clientX-r.left)/r.width*100).toFixed(0)+'%');
    btn.style.setProperty('--my', ((e.clientY-r.top)/r.height*100).toFixed(0)+'%');
  }, { passive: true });


  // ════════════════════════════════════════════════════════════
  // §4 触控涟漪
  // ════════════════════════════════════════════════════════════

  document.addEventListener('click', (e) => {
    const t = e.target.closest('.act-btn, .func-btn, .card-tap, .cc');
    if (!t) return;
    const ripple = document.createElement('span');
    const r = t.getBoundingClientRect();
    const sz = Math.max(r.width, r.height) * 1.4;
    Object.assign(ripple.style, {
      position:'absolute', width:sz+'px', height:sz+'px',
      left:(e.clientX-r.left-sz/2)+'px', top:(e.clientY-r.top-sz/2)+'px',
      borderRadius:'50%', background:'var(--glow-acc)',
      transform:'scale(0)', opacity:'.4', pointerEvents:'none', zIndex:'1',
    });
    const orig = getComputedStyle(t).position;
    if (orig === 'static') t.style.position = 'relative';
    t.appendChild(ripple);
    requestAnimationFrame(() => {
      ripple.style.transition = 'transform .4s ease, opacity .4s ease';
      ripple.style.transform = 'scale(1)'; ripple.style.opacity = '0';
    });
    setTimeout(() => { ripple.remove(); if (orig==='static') t.style.position=''; }, 450);
  }, { passive: true });


  // ════════════════════════════════════════════════════════════
  // §5 selectChar钩子 — 初始化人格 + 情绪
  // ════════════════════════════════════════════════════════════

  if (typeof selectChar === 'function') {
    const _origSelectChar = selectChar;
    window.selectChar = function(id) {
      _origSelectChar(id);
      const c = State.currentChar;
      if (!c) return;

      // 初始化人格
      if (HAS_PERSONALITY) {
        if (!c.persona) {
          State.currentChar = initPersonality(c);
        } else {
          State.currentChar = ensurePersonality(c);
        }
      }
      // 初始化情绪
      if (HAS_EMOTION) {
        State.currentChar = ensureEmotion(State.currentChar);
      }
    };
  }

  // 兼容旧存档的定期检查
  let _lastCharId = null;
  setInterval(() => {
    const c = State?.currentChar;
    if (c && c.id !== _lastCharId) {
      _lastCharId = c.id;
      if (HAS_PERSONALITY && !c.persona) State.currentChar = initPersonality(c);
      if (HAS_PERSONALITY) State.currentChar = ensurePersonality(State.currentChar);
      if (HAS_EMOTION) State.currentChar = ensureEmotion(State.currentChar);
    }
  }, 1000);


  // ════════════════════════════════════════════════════════════
  // §6 doAction钩子 — 一次性patch，统一执行全部系统
  // ════════════════════════════════════════════════════════════

  if (typeof doAction === 'function') {
    const _origDoAction = doAction;

    window.doAction = async function(name, cat) {
      const c = State?.currentChar;

      // ── 记录变化前状态 ──
      const before = c ? {
        stamina: c.stamina, energy: c.energy, lust: c.lust,
        obedience: c.obedience, affection: c.affection,
      } : null;
      const personaBefore = (c && c.persona) ? { ...c.persona } : null;
      const emotionBefore = {};
      if (c && c.emotionState) {
        ['nervous','jealousy','possessive','vulnerable','obedient','rebellious','attached','unstable']
          .forEach(k => emotionBefore[k] = c.emotionState[k] ?? 0);
      }

      // ── 执行原始doAction ──
      await _origDoAction(name, cat);

      // ── doAction完成后的增强处理 ──
      const after = State?.currentChar;
      if (!before || !after) return;

      try {
        // ── A. 计算基础属性变化 ──
        const baseChanges = {};
        ['stamina','energy','lust','obedience','affection'].forEach(k => {
          const diff = Math.round(after[k]) - Math.round(before[k]);
          if (diff !== 0) baseChanges[k] = diff;
        });

        // ── B. 人格系统 ──
        let _personaResult = null;
        if (HAS_PERSONALITY && after.persona) {
          _personaResult = applyPersonalityEffect(name, cat);
          if (_personaResult.newPersona) {
            State.currentChar.persona = _personaResult.newPersona;
          }
          // 人格变化 → 附加到最后一条act记录
          if (_personaResult.changes && Object.keys(_personaResult.changes).length) {
            const pText = formatPersonalityChanges(_personaResult.changes);
            if (pText && State.gameLog && State.gameLog.length) {
              var lastLog = State.gameLog[State.gameLog.length - 1];
              if (lastLog.type === 'act') {
                lastLog.personaChanges = (lastLog.personaChanges ? lastLog.personaChanges + '\n' : '') + '⟡ ' + pText;
              }
            }
            // 路线提示
            if (_personaResult.route) {
              const r = _personaResult.route;
              const p = State.currentChar.persona;
              if (!p._lastRoute || p._lastRoute !== r.id || p._lastStage !== r.stage) {
                if (typeof toast === 'function') toast(`${r.icon} ${r.name}：${r.stage}`, 'ai');
                p._lastRoute = r.id;
                p._lastStage = r.stage;
              }
            }
          }
        }

        // ── C. 情绪系统 ──
        let _emotionResult = null;
        if (HAS_EMOTION && after.emotionState) {
          _emotionResult = updateEmotion(name, cat);
          // 情绪变化日志（只记录较大变化）
          if (_emotionResult.emotionChanges) {
            const sigChanges = {};
            Object.entries(_emotionResult.emotionChanges).forEach(([k,v]) => {
              if (Math.abs(v) >= 3) sigChanges[k] = v;
            });
            if (Object.keys(sigChanges).length && typeof formatEmotionChanges === 'function') {
              const eText = formatEmotionChanges(sigChanges);
              if (eText && State.gameLog && State.gameLog.length) {
                var lastLog2 = State.gameLog[State.gameLog.length - 1];
                if (lastLog2.type === 'act') {
                  lastLog2.personaChanges = (lastLog2.personaChanges ? lastLog2.personaChanges + '\n' : '') + '⟡ ' + eText;
                }
              }
            }
          }
          // 关系阶段变化
          if (_emotionResult.stageChanged && typeof getRelationStage === 'function') {
            const stage = getRelationStage(after);
            _showStageChangeBanner(stage);
            if (typeof toast === 'function') toast(`${stage.icon} 关系阶段：${stage.name}`, 'ai');
          }
          // 事件链触发
          if (_emotionResult.chainEvents?.length) {
            _emotionResult.chainEvents.forEach(ce => {
              if (ce.event?.effects) _applyChainEffects(ce.event.effects, after);
              if (ce.event?.story && typeof openStoryModal === 'function') {
                setTimeout(() => {
                  openStoryModal(
                    { title: ce.event.title || '关系事件', story: ce.event.story, cat: 'event' },
                    ce.event.title || '事件', {}
                  );
                }, 800);
              }
            });
          }
        }

        // ── D. 浮字显示 ──
        const allChanges = { ...baseChanges };
        // 人格属性
        if (personaBefore && after.persona) {
          ['trust','fear','dependency','shame','pride','love','sanity','broken'].forEach(k => {
            const diff = Math.round(after.persona[k]) - Math.round(personaBefore[k] ?? 50);
            if (diff !== 0) allChanges[k] = diff;
          });
        }
        if (Object.keys(allChanges).length) {
          const anchor = document.querySelector('.play-hdr');
          showFloatNums(allChanges, anchor);
        }
        // 第二波浮字（延迟600ms）：情绪（只显示较大变化）
        if (after.emotionState) {
          const emoChanges = {};
          ['nervous','jealousy','possessive','vulnerable','obedient','rebellious','attached','unstable'].forEach(k => {
            const diff = (after.emotionState[k] ?? 0) - (emotionBefore[k] ?? 0);
            if (Math.abs(diff) >= 4) emoChanges[k] = diff;
          });
          if (Object.keys(emoChanges).length) {
            setTimeout(() => {
              const anchor = document.querySelector('.play-hdr');
              showFloatNums(emoChanges, anchor);
            }, 600);
          }
        }

        // ── E. 更新标签显示 ──
        _renderAllTags();

      } catch (e) {
        console.error('[bridge] Post-action error:', e);
      }
    };
  }


  // ════════════════════════════════════════════════════════════
  // §7 renderPlay钩子 — 人格+情绪标签
  // ════════════════════════════════════════════════════════════

  if (typeof renderPlay === 'function') {
    const _origRenderPlay = renderPlay;
    window.renderPlay = function(...args) {
      _origRenderPlay.apply(this, args);
      _renderAllTags();
    };
  }

  function _renderAllTags() {
    const c = State?.currentChar;
    if (!c) return;

    // 人格和情绪标签已从训练页面移除，在角色详情中显示

    // 关系阶段（保留在训练页面profile中）
    const stageEl = document.getElementById('p-relation-stage');
    if (stageEl && HAS_EMOTION && typeof getRelationStage === 'function') {
      const stage = getRelationStage(c);
      stageEl.innerHTML = `<span style="font-size:.68rem;padding:2px 8px;background:rgba(255,255,255,.2);border-radius:10px;color:#fff">${stage.icon} ${stage.name}</span>`;
    }
  }


  // ════════════════════════════════════════════════════════════
  // §8 详情弹窗注入
  // ════════════════════════════════════════════════════════════

  const detOv = document.getElementById('ov-det');
  if (detOv) {
    new MutationObserver((mutations) => {
      mutations.forEach(m => {
        if (m.target.id === 'ov-det' && m.target.classList.contains('on')) {
          _injectDetailPanels();
        }
      });
    }).observe(detOv, { attributes: true, attributeFilter: ['class'] });
  }

  function _injectDetailPanels() {
    const c = State?.currentChar;
    if (!c) return;

    // 人格面板
    const personaEl = document.getElementById('det-persona');
    if (personaEl && c.persona && HAS_PERSONALITY && typeof renderPersonalityPanel === 'function') {
      personaEl.innerHTML = renderPersonalityPanel(c.persona);
    }

    // 路线进度
    const routeEl = document.getElementById('det-routes');
    if (routeEl && c.persona && HAS_PERSONALITY && typeof getAllRouteProgress === 'function') {
      const routes = getAllRouteProgress(c.persona);
      routeEl.innerHTML = '<div class="route-progress">' + routes.map(r => `
        <div class="route-row">
          <span class="route-row-icon">${r.icon}</span>
          <span class="route-row-name">${r.name}</span>
          <div class="route-dots">
            ${Array.from({length:r.maxStages},(_,i)=>
              `<span class="route-dot ${i<=r.stageIdx?(r.active?'active':'on'):''}"></span>`
            ).join('')}
          </div>
          <span class="route-row-stage">${r.stageName}</span>
        </div>`).join('') + '</div>';
    }

    // 情绪面板
    const emotionEl = document.getElementById('det-emotion');
    if (emotionEl && HAS_EMOTION && typeof renderEmotionPanel === 'function') {
      emotionEl.innerHTML = renderEmotionPanel(c);
    }

    // 关系阶段进度
    const relEl = document.getElementById('det-relation');
    if (relEl && HAS_EMOTION) {
      const stage = c.emotionState?.relationStage ?? 0;
      const names = ['陌生','信任','依赖','扭曲依赖','病态占有'];
      relEl.innerHTML = `
        <div class="relation-progress">
          ${names.map((_,i) => `<div class="relation-dot ${i<stage?'reached':''} ${i===stage?'current':''}"></div>`).join('')}
        </div>
        <div class="relation-labels">
          ${names.map((n,i) => `<span class="${i===stage?'current-stage':''}">${n}</span>`).join('')}
        </div>`;
    }
  }


  // ════════════════════════════════════════════════════════════
  // §9 台词增强
  // ════════════════════════════════════════════════════════════

  window.getEnhancedDialogue = function(actionName, category) {
    const c = State?.currentChar;
    if (!c) return null;
    // 1. 情绪台词（最动态，优先级最高）
    if (HAS_EMOTION && typeof getEmotionDialogue === 'function') {
      const d = getEmotionDialogue(actionName, category);
      if (d) return d;
    }
    // 2. 人格台词
    if (HAS_PERSONALITY && c.persona && typeof getPersonalityDialogue === 'function') {
      const d = getPersonalityDialogue(c.persona, actionName, category);
      if (d) return d;
    }
    return null;
  };


  // ════════════════════════════════════════════════════════════
  // §10 关系阶段变化通知
  // ════════════════════════════════════════════════════════════

  function _showStageChangeBanner(stage) {
    document.querySelectorAll('.stage-change-banner').forEach(el => el.remove());
    const banner = document.createElement('div');
    banner.className = 'stage-change-banner';
    banner.innerHTML = `
      <span class="stage-icon">${stage.icon}</span>
      <div class="stage-title">关系变化：${stage.name}</div>
      <div class="stage-desc">${stage.desc}</div>`;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 4500);
  }

  function _applyChainEffects(effects, c) {
    if (effects.persona && c.persona) {
      Object.entries(effects.persona).forEach(([k,v]) => {
        if (c.persona[k] !== undefined) c.persona[k] = Math.max(0, Math.min(100, c.persona[k]+v));
      });
    }
    if (effects.emotion && c.emotionState) {
      Object.entries(effects.emotion).forEach(([k,v]) => {
        if (c.emotionState[k] !== undefined) c.emotionState[k] = Math.max(0, Math.min(100, c.emotionState[k]+v));
      });
    }
  }


  // ════════════════════════════════════════════════════════════
  // §11 页面标题渐变控制
  // ════════════════════════════════════════════════════════════

  const titleEl = document.getElementById('hdr-h1');
  if (titleEl) {
    new MutationObserver(() => {
      const isHome = State?.currentNav === 'home';
      titleEl.classList.toggle('plain-title', !isHome);
    }).observe(titleEl, { childList:true, characterData:true, subtree:true });
  }


  console.log('[bridge] Master integration bridge loaded ✓');
})();
