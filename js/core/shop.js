// ============================================================
// js/core/shop.js
// 商店系统：NPC、道具展示、购买逻辑
// ============================================================

let _shopCat = 'standard'; // 当前商店分类

// ── 打开商店 ──────────────────────────────────────────────
function openShop() {
  _shopCat = 'standard';
  renderShopCatBtns();
  renderShopItems();
  // NPC 随机欢迎语
  const npc = document.getElementById('shop-npc-say');
  if (npc) npc.textContent = pick(SHOP_NPC_GREET);
  updateShopMoney();
  openOv('ov-shop');
}

function updateShopMoney() {
  const el = document.getElementById('shop-money');
  if (el) el.textContent = fmtMoney(State.money);
}

// ── 切换商品分类 ──────────────────────────────────────────
function shopSetCat(cat, btn) {
  _shopCat = cat;
  document.querySelectorAll('.shop-cat-btn').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  renderShopItems();
}

function renderShopCatBtns() {
  document.querySelectorAll('.shop-cat-btn').forEach(b =>
    b.classList.toggle('on', b.dataset.cat === _shopCat));
}

// ── 渲染商品列表 ──────────────────────────────────────────
function renderShopItems() {
  const list = document.getElementById('shop-item-list');
  if (!list) return;

  const items = ITEMS_DATA.filter(it => it.category === _shopCat);

  list.innerHTML = items.map(it => {
    const owned   = getItemCount(it.id);
    const canBuy  = State.money >= it.price;
    const isOwned = it.category === 'standard' && owned > 0;

    return `
      <div class="shop-item ${isOwned ? 'owned' : ''}">
        <div class="shop-item-header">
          <div class="shop-item-name">${esc(it.name)}</div>
          <div class="shop-item-price">${fmtMoney(it.price)}</div>
        </div>
        <div class="shop-item-desc">${esc(it.desc)}</div>
        ${it.category === 'consumable'
          ? `<div class="shop-item-stock">库存：${owned} 件</div>`
          : ''}
        <div style="display:flex;gap:7px;margin-top:9px;align-items:center">
          <button class="btn btn-sm ${isOwned ? 'btn-ghost' : canBuy ? 'btn-p' : 'btn-ghost'}"
            onclick="buyItem(${typeof it.id==='string'?`'${it.id}'`:it.id})"
            ${isOwned ? 'disabled' : ''}>
            ${isOwned ? '✓ 已拥有' : '购买'}
          </button>
          <button class="btn btn-sm btn-ghost" onclick="shopPreview(${typeof it.id==='string'?`'${it.id}'`:it.id})">详情</button>
        </div>
      </div>`;
  }).join('');

  if (!items.length) {
    list.innerHTML = `<div class="empty"><div class="empty-ico">🔒</div><p>暂无可用商品</p></div>`;
  }
}

// 获取随机 NPC 店员评价
function getRandomNpcSay(item) {
    if (Array.isArray(item.npcSay) && item.npcSay.length > 0) {
        return item.npcSay[Math.floor(Math.random() * item.npcSay.length)];
    }
    if (typeof item.npcSay === 'string') {
        return item.npcSay;
    }
    return "欢迎光临……本店的商品，保证能让您的生活变得更加多姿多彩哦。";
}


// ── 购买道具 ──────────────────────────────────────────────
function buyItem(itemId) {
  const item = ITEMS_DATA.find(it => it.id === itemId);
  if (!item) return;

  // 金币检查
  if (State.money < item.price) {
    const msg = pick(SHOP_NPC_BROKE);
    setNpcSay(msg);
    toast('金币不足！', 'err');
    return;
  }

  // 通常道具：已有则不能重复买
  if (item.category === 'standard' && getItemCount(itemId) > 0) {
    toast('已经拥有这件道具了', '');
    return;
  }

  // 消耗品/特殊道具：上限99
  if (item.category !== 'standard' && getItemCount(itemId) >= 99) {
    toast('数量已达上限', '');
    return;
  }

  // 扣钱，加入库存
  State.money -= item.price;
  State.inventory[itemId] = (State.inventory[itemId] || 0) + 1;
  if(typeof _logMoney==='function') _logMoney('购买·'+item.name, -item.price);

  // NPC 购买评价 → 随机抽取一条（重点修复）
  const npcLine = getRandomNpcSay(item);
  setNpcSay(npcLine);

  toast(`购买成功：${item.name}`, 'ok');

  // 特殊道具：立即触发效果弹窗
  if (item.id === 80) {
    setTimeout(() => openGenderChangeModal(), 400);
  }
  
  // 体力/精力药水：立即生效
  if (item.id === 'stamina_up_potion') {
    setTimeout(function(){
      if(typeof _playerProfile!=='undefined'){
        _playerProfile.staminaMax=(_playerProfile.staminaMax||2000)+200;
        _playerProfile.stamina=Math.min(_playerProfile.staminaMax,(_playerProfile.stamina||0)+200);
        localStorage.setItem('era_profile',JSON.stringify(_playerProfile));
        if(typeof renderPlayerCard==='function')renderPlayerCard();
        toast('体力上限提升200！当前上限：'+_playerProfile.staminaMax,'ok');
      }
      // 消耗掉
      if((State.inventory['stamina_up_potion']||0)>0){State.inventory['stamina_up_potion']--;if(State.inventory['stamina_up_potion']<=0)delete State.inventory['stamina_up_potion'];}
    },300);
  }
  if (item.id === 'stamina_down_potion') {
    setTimeout(function(){
      if(typeof _playerProfile!=='undefined'){
        var newMax=Math.max(200,(_playerProfile.staminaMax||2000)-200);
        _playerProfile.staminaMax=newMax;
        _playerProfile.stamina=Math.min(newMax,_playerProfile.stamina||0);
        localStorage.setItem('era_profile',JSON.stringify(_playerProfile));
        if(typeof renderPlayerCard==='function')renderPlayerCard();
        toast('体力上限降低200……当前上限：'+newMax,'ok');
      }
      if((State.inventory['stamina_down_potion']||0)>0){State.inventory['stamina_down_potion']--;if(State.inventory['stamina_down_potion']<=0)delete State.inventory['stamina_down_potion'];}
    },300);
  }
  if (item.id === 'energy_up_potion') {
    setTimeout(function(){
      if(typeof _playerProfile!=='undefined'){
        _playerProfile.energyMax=(_playerProfile.energyMax||2000)+200;
        _playerProfile.energy=Math.min(_playerProfile.energyMax,(_playerProfile.energy||0)+200);
        localStorage.setItem('era_profile',JSON.stringify(_playerProfile));
        toast('精力上限提升200！当前上限：'+_playerProfile.energyMax,'ok');
      }
      if((State.inventory['energy_up_potion']||0)>0){State.inventory['energy_up_potion']--;if(State.inventory['energy_up_potion']<=0)delete State.inventory['energy_up_potion'];}
    },300);
  }
  if (item.id === 'energy_down_potion') {
    setTimeout(function(){
      if(typeof _playerProfile!=='undefined'){
        var newMax=Math.max(200,(_playerProfile.energyMax||2000)-200);
        _playerProfile.energyMax=newMax;
        _playerProfile.energy=Math.min(newMax,_playerProfile.energy||0);
        localStorage.setItem('era_profile',JSON.stringify(_playerProfile));
        toast('精力上限降低200……当前上限：'+newMax,'ok');
      }
      if((State.inventory['energy_down_potion']||0)>0){State.inventory['energy_down_potion']--;if(State.inventory['energy_down_potion']<=0)delete State.inventory['energy_down_potion'];}
    },300);
  }

  checkAch && checkAch();
  checkTitles && checkTitles();
  updateShopMoney();
  renderShopItems();

  const moneyEl = document.getElementById('p-money');
  if (moneyEl) moneyEl.textContent = fmtMoney(State.money);
}



// ── 性转换的药：使用弹窗 ─────────────────────────────────
function openGenderChangeModal() {
  try {
    const profile = JSON.parse(localStorage.getItem('era_profile') || '{}');
    const current = profile.gender || '未设定';
    const next    = current === '女' ? '男' : '女';
    openCustomConfirm(
      '性转换的药 💊',
      `<div style="text-align:center;padding:8px 0">
        <div style="font-size:2rem;margin-bottom:8px">⚧️</div>
        <div style="font-size:.9rem;color:var(--txt2);margin-bottom:12px">这是一颗会彻底改变的药……</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;font-size:1rem">
          <div style="background:var(--card2);border-radius:8px;padding:8px 16px"><span style="color:var(--muted);font-size:.75rem">当前</span><br><b>${esc(current)}</b></div>
          <div style="color:var(--acc);font-size:1.4rem">→</div>
          <div style="background:var(--card2);border-radius:8px;padding:8px 16px;border:2px solid var(--acc)"><span style="color:var(--muted);font-size:.75rem">变为</span><br><b style="color:var(--acc)">${esc(next)}</b></div>
        </div>
        <div style="margin-top:12px;font-size:.75rem;color:#f06">⚠️ 效果永久，无法复原</div>
      </div>`,
      '✅ 确认使用',
      function() {
        profile.gender = next;
        localStorage.setItem('era_profile', JSON.stringify(profile));
        if (typeof _playerProfile !== 'undefined') _playerProfile.gender = next;
        State.playerGender = next;
        if ((State.inventory[80] || 0) > 0) {
          State.inventory[80]--;
          if (State.inventory[80] <= 0) delete State.inventory[80];
        }
        State.playerGenderChanged = true;
        saveMiniState && saveMiniState();
        const gEl = document.getElementById('pc-gender');
        if (gEl) gEl.textContent = '性别：' + next;
        toast(`性别已变为：${next} ✨`, 'ok');
        checkTitles && checkTitles();
      }
    );
  } catch(e) { console.error(e); }
}

function setNpcSay(text) {
  const el = document.getElementById('shop-npc-say');
  if (el) el.textContent = text;
}

// ── 道具详情预览 ──────────────────────────────────────────
function shopPreview(itemId) {
  const item = ITEMS_DATA.find(it => it.id === itemId);
  if (!item) return;

  const ttl  = document.getElementById('item-preview-title');
  const body = document.getElementById('item-preview-body');
  if (ttl)  ttl.textContent = item.name;
  if (body) body.innerHTML = `
    <div style="margin-bottom:10px">
      <div style="font-size:.75rem;color:var(--muted);margin-bottom:3px">
        ${item.category === 'standard' ? '通常道具' : item.category === 'consumable' ? '消耗道具' : '特殊道具'}
        · ${fmtMoney(item.price)}
      </div>
      <div style="font-size:.85rem;color:var(--txt);line-height:1.7;margin-bottom:12px">
        ${esc(item.desc)}
      </div>
    </div>
    <div style="background:var(--card2);border-radius:10px;padding:11px 13px; border-left:3px solid var(--acc3)">
      <div style="font-size:.72rem;color:var(--acc3);font-weight:600;margin-bottom:4px">
        🛒 店员说：
      </div>
      <div style="font-size:.82rem;color:var(--txt);font-style:italic;line-height:1.7">
        ${esc(getRandomNpcSay(item))}
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn btn-ghost btn-full" onclick="closeOv('ov-item-preview')">关闭</button>
      <button class="btn btn-p btn-full" onclick="closeOv('ov-item-preview');buyItem(${typeof item.id==='string'?"'"+item.id+"'":item.id})">立即购买</button>
    </div>`;

  openOv('ov-item-preview');
}

// ── 背包 ───────────────────────────────────────────────
function openBag() {
  const list = document.getElementById('bag-list');
  if (!list) return;

  const owned = Object.entries(State.inventory)
    .filter(([, cnt]) => cnt > 0)
    .map(([id, cnt]) => ({ item: ITEMS_DATA.find(it => String(it.id) === String(id) || it.id === parseInt(id)), cnt }))
    .filter(e => e.item);

  if (!owned.length) {
    list.innerHTML = `<div class="empty"><div class="empty-ico">🎒</div><p>背包空空如也……去商店逛逛吧。</p></div>`;
  } else {
    const cats = [
      { key: 'standard',   label: '通常道具' },
      { key: 'consumable', label: '消耗道具' },
      { key: 'special',    label: '特殊道具' },
    ];
    list.innerHTML = cats.map(cat => {
      const items = owned.filter(e => e.item.category === cat.key);
      if (!items.length) return '';
      return `
        <div class="s-ttl" style="margin-top:\( {cat.key==='standard'?'0':'14px'}"> \){cat.label}</div>
        ${items.map(({ item, cnt }) => `
          <div class="bag-item" onclick="openItemUseFromBag(${item.id})" style="cursor:pointer">
            <div style="font-size:1.4rem;margin-right:8px">${getItemIcon&&getItemIcon(item)||'📦'}</div>
            <div style="flex:1;min-width:0">
              <div class="bag-item-name">${esc(item.name)}</div>
              <div class="bag-item-desc">${esc(item.desc.slice(0,38))}…</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              ${item.category !== 'standard'
                ? `<div class="bag-item-cnt">× ${cnt}</div>`
                : '<div class="bag-item-cnt" style="color:var(--sg)">已拥有</div>'}
              <div style="font-size:.65rem;color:var(--acc);margin-top:2px">点击使用</div>
            </div>
          </div>`).join('')}`;
    }).join('');
  }

  openOv('ov-bag');
}

// ── 背包道具使用入口（供 openBag 的卡片调用）────────────
function openItemUseFromBag(itemId) {
  // 先关背包弹窗
  closeOv('ov-bag');
  setTimeout(function() {
    if (typeof openItemUse === 'function') {
      openItemUse(itemId);
    } else {
      toast('道具使用系统未加载', 'err');
    }
  }, 120);
}

// ── 道具图标 ──────────────────────────────────────────────
function getItemIcon(item) {
  const iconMap = {
    0:'🥚',1:'🔋',2:'🔧',3:'✈️',4:'🕯️',5:'🔴',6:'📿',7:'💨',
    8:'🎈',9:'🚿',10:'🔌',11:'🥛',12:'🎪',13:'🏹',14:'📌',
    15:'👁️',16:'🪢',17:'🔇',18:'🎬',19:'📷',20:'🛗',21:'🪞',
    22:'📿',23:'👗',24:'⚡',25:'🐙',26:'🎀',27:'🔬',28:'🌟',29:'⛓️',
    30:'🎮',35:'🎧',36:'💍',40:'🧴',41:'💊',42:'💉',43:'📼',44:'🎞️',
    45:'🩺',46:'🕯️',47:'💉',50:'🧦',51:'🕸️',
    60:'🌊',71:'💎',72:'💎',73:'🍼',75:'🌸',76:'⬇️',77:'💊',
    78:'💧',79:'💊',80:'✨',81:'👼',82:'😈',83:'📖',84:'📖',
    91:'💉',92:'🛡️',93:'💉',94:'💊',
    'stamina_up_potion':'💪','stamina_down_potion':'😵',
    'energy_up_potion':'🧠','energy_down_potion':'😶‍🌫️',
    'date_voucher':'💌',
  };
  return iconMap[item.id] || (item.category==='consumable'?'💊':item.category==='special'?'✨':'📦');
}
