(() => {
  const config = window.BOROUGH_RUN_CONFIG;
  const $ = id => document.getElementById(id);
  const currency = value => config.currency + Math.max(0, Math.floor(value)).toLocaleString('en-GB');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const storageKey = 'djhdev-borough-run-v3';
  const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let state;

  function createRun() {
    return {day:0,locationIndex:0,nextLocation:0,available:[],costs:{},cash:config.startingCash,inventory:{},history:[],prices:{},trend:{},event:null,log:[],ended:false};
  }
  function save() { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch (_) {} }
  function note(message) {
    const line = {day:Math.min(state.day+1,config.days),text:message};
    state.log.unshift(line); state.log = state.log.slice(0,6);
  }
  function addDay(locationIndex) {
    state.day++;
    state.locationIndex = Number.isInteger(locationIndex) ? locationIndex : Math.floor(Math.random()*config.locations.length);
    const location = config.locations[state.locationIndex];
    state.nextLocation = (state.locationIndex+1+Math.floor(Math.random()*(config.locations.length-1)))%config.locations.length;
    state.available = config.goods.map(good=>good.id).sort(()=>Math.random()-.5).slice(0,5+Math.floor(Math.random()*3));
    state.event = Math.random() < .34 ? config.events[Math.floor(Math.random()*config.events.length)] : null;
    if (state.event) state.available = [...new Set([...state.available,...state.event.goods])];
    state.prices = {}; state.trend = {};
    config.goods.forEach(good => {
      const previous = state.history.length ? state.history[state.history.length-1][good.id] || good.base : null;
      let price = previous === null ? good.min + Math.random()*(good.max-good.min) : previous + (Math.random()-.5)*(good.max-good.min)*good.volatility;
      if (!good.locations.includes(location.name)) price = Math.round(price*(.82+Math.random()*.2));
      if (state.event && state.event.goods.includes(good.id)) price = (previous===null?good.base:previous)*state.event.multiplier;
      price=Math.round(Math.max(good.min*.5,Math.min(good.max*1.5,price)));
      state.prices[good.id] = price;
      state.trend[good.id] = previous === null ? 0 : Math.round((price/previous-1)*100);
    });
    state.history.push({...state.prices});
    if (state.event) note(config.dialogue.event.replace('{name}', state.event.title));
    save(); render();
  }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && saved.day >= 1 && saved.day <= config.days && saved.log && saved.inventory && saved.history) { saved.costs ||= {}; saved.nextLocation ??= (saved.locationIndex+1)%config.locations.length; return saved; }
    } catch (_) {}
    const fresh = createRun(); state = fresh; addDay();
  }
  function stockCount() { return Object.values(state.inventory).reduce((sum, qty) => sum + Math.max(0, qty), 0); }
  function inventoryValue() { return config.goods.reduce((sum, good) => sum + (state.inventory[good.id]||0)*(state.prices[good.id]||0),0); }
  function netWorth() { return state.cash + inventoryValue(); }
  function localAvailability(good, location) { return state.available.includes(good.id); }
  function marketHTML(good, location) {
    const price = state.prices[good.id], owned = state.inventory[good.id]||0, trend=state.trend[good.id]||0;
    const available = localAvailability(good, location);
    const delta = trend > 5 ? `<span class="up">↗ ${trend}%</span>` : trend < -5 ? `<span class="down">↘ ${Math.abs(trend)}%</span>` : '<span>→ steady</span>';
    const qty = clamp(Math.floor(Number($(`qty-${good.id}`)?.value)||1),1,config.capacity);
    const canBuy = available && qty*price <= state.cash && qty + stockCount() <= config.capacity && !state.ended;
    const canSell = owned > 0 && !state.ended;
    return `<article class="good-row" style="--good:${good.color||({violet:'#c299f5',blue:'#7cb9ff',amber:'#f1c978',green:'#94d786',coral:'#ff9a83',pink:'#f28cce',lime:'#c7f36b',orange:'#f5a36e',cyan:'#79d9d4'}[good.tone]||'#c7f36b')}"><div class="good-name"><span class="good-glyph">${escapeHTML(good.glyph)}</span><div><strong>${escapeHTML(good.name)}</strong><small>${available?`STOCK HERE · ${owned} ${escapeHTML(good.unit)} OWNED`:`NOT STOCKED HERE · ${owned} OWNED`}</small></div></div><div class="price">${currency(price)}<small>${delta}</small></div><div class="quantity"><button type="button" data-step="-1" data-id="${good.id}" aria-label="Decrease quantity for ${escapeHTML(good.name)}">−</button><input id="qty-${good.id}" type="number" min="1" max="${config.capacity}" value="1" aria-label="Quantity of ${escapeHTML(good.name)}" ${state.ended?'disabled':''}><button type="button" data-step="1" data-id="${good.id}" aria-label="Increase quantity for ${escapeHTML(good.name)}">+</button></div><div class="trade-actions"><button type="button" data-action="buy" data-id="${good.id}" ${canBuy?'':'disabled'}>BUY</button><button class="sell" type="button" data-action="sell" data-id="${good.id}" ${canSell?'':'disabled'}>SELL</button></div></article>`;
  }
  function render() {
    const location = config.locations[state.locationIndex] || config.locations[0];
    const finalDay = state.ended;
    $('dayStat').textContent = `${Math.min(state.day,config.days)} / ${config.days}`;
    $('placeStat').textContent = location.name;
    $('cashStat').textContent = currency(state.cash);
    $('worthStat').textContent = currency(netWorth());
    $('capacityStat').textContent = `${stockCount()} / ${config.capacity}`;
    $('capacityBar').style.width = `${Math.min(100,stockCount()/config.capacity*100)}%`;
    $('marketTitle').textContent = `${location.name} Market`;
    $('dayChip').textContent = `DAY ${String(state.day).padStart(2,'0')}`;
    $('locationIndex').textContent = String(state.day).padStart(2,'0');
    $('nextPlace').textContent = finalDay ? 'End of the route' : state.day >= config.days ? 'Run complete' : config.locations[state.nextLocation]?.name || config.locations[0].name;
    const choices=$('locationChoices');
    choices.innerHTML=config.locations.map((item,index)=>`<button class="location-choice ${index===state.locationIndex?'current':''} ${index===state.nextLocation?'selected':''}" type="button" data-location="${index}" ${index===state.locationIndex||finalDay||state.day>=config.days?'disabled':''}><span>${escapeHTML(item.name)}</span><small>${index===state.locationIndex?'CURRENT LOCATION':escapeHTML(item.district)}</small></button>`).join('');
    choices.querySelectorAll('[data-location]').forEach(button=>button.addEventListener('click',()=>{state.nextLocation=Number(button.dataset.location);render();}));
    $('travelNote').textContent = finalDay ? `You’ve finished the route with ${currency(netWorth())} to your name.` : state.day >= config.days ? 'Sell any remaining stock, then finish your run.' : 'Pick any borough. You can revisit a market, but its stock and prices will change.';
    $('travelButton').disabled = finalDay;
    $('travelButton').innerHTML = finalDay ? 'Route complete <span>✓</span>' : state.day >= config.days ? 'Finish 30-day run <span>✓</span>' : `Travel to ${escapeHTML(config.locations[state.nextLocation]?.name || 'borough')} <span>→</span>`;
    $('travelHint').textContent = finalDay ? 'Start a new run to play again.' : state.day >= config.days ? 'Finish when you’re happy with your final tally.' : 'Moving on ends today’s market and its prices.';
    $('contactAvatar').textContent = location.avatar;
    $('contactName').textContent = location.contact;
    $('dialogue').textContent = location.lines[(state.day-1)%location.lines.length];
    const event = $('eventBanner');
    if (state.event) { event.classList.add('show'); $('eventText').textContent = `${state.event.title} — ${state.event.text}`; } else event.classList.remove('show');
    const visibleGoods=config.goods.filter(good=>localAvailability(good,location)||(state.inventory[good.id]||0)>0);
    $('marketList').innerHTML = finalDay ? `<div class="game-over"><p class="eyebrow">THE 30-DAY ROUTE IS COMPLETE</p><h2>Run complete</h2><p>${state.cash < netWorth() ? 'Your remaining stock is valued at today’s prices.' : 'You made it to the final borough with cash in hand.'}</p><div class="final-score"><small>FINAL NET WORTH</small>${currency(netWorth())}</div></div>` : visibleGoods.map(good=>marketHTML(good,location)).join('');
    $('marketList').querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{const input=$(`qty-${button.dataset.id}`);input.value=clamp((Number(input.value)||1)+Number(button.dataset.step),1,config.capacity);updateButtons();}));
    $('marketList').querySelectorAll('input[type=number]').forEach(input=>input.addEventListener('input',updateButtons));
    $('marketList').querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>trade(button.dataset.id,button.dataset.action)));
    $('marketList').querySelectorAll('.good-row').forEach(row=>{
      const id=row.querySelector('[data-id]').dataset.id;
      const owned=state.inventory[id]||0;
      if(owned){const average=state.costs[id]||0, pnl=owned*(state.prices[id]-average), info=document.createElement('small');info.className='cost-info';info.textContent=`AVG PAID ${currency(average)} · ${pnl>=0?'+':''}${currency(Math.abs(pnl))} ${pnl>=0?'UP':'DOWN'}`;info.classList.add(pnl>=0?'profit':'loss');row.querySelector('.good-name>div').append(info);}
      [['buymax','BUY MAX'],['sellall','SELL ALL']].forEach(([action,label])=>{const button=document.createElement('button');button.type='button';button.className='bulk '+(action==='sellall'?'sell':'');button.dataset.action=action;button.dataset.id=id;button.textContent=label;row.querySelector('.trade-actions').append(button);button.addEventListener('click',()=>trade(id,action));});
    });
    $('runLog').innerHTML = state.log.length ? state.log.map(item=>`<div class="log-line"><time>D${String(item.day).padStart(2,'0')}</time><span>${escapeHTML(item.text)}</span></div>`).join('') : '<span class="log-empty">Your deals and market news will show up here.</span>';
    $('endNote').textContent = finalDay ? 'Thanks for taking the route.' : 'Make it to day 30 and see where you stand.';
    document.body.classList.toggle('is-final',finalDay);
    save();
  }
  function updateButtons() {
    const location=config.locations[state.locationIndex];
    config.goods.forEach(good=>{
      const row=$(`qty-${good.id}`)?.closest('.good-row'); if (!row) return;
      const qty=clamp(Math.floor(Number($(`qty-${good.id}`).value)||1),1,config.capacity), price=state.prices[good.id], owned=state.inventory[good.id]||0;
      row.querySelector('[data-action=buy]').disabled=state.ended||!localAvailability(good,location)||qty*price>state.cash||qty+stockCount()>config.capacity;
      row.querySelector('[data-action=sell]').disabled=state.ended||owned<1;
      row.querySelector('[data-action=buymax]').disabled=state.ended||!localAvailability(good,location)||stockCount()>=config.capacity||state.cash<price;
      row.querySelector('[data-action=sellall]').disabled=state.ended||owned<1;
    });
  }
  let toastTimer;
  function toast(message) { const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200); }
  function trade(id, action) {
    const good=config.goods.find(item=>item.id===id), price=state.prices[id];
    const qty=action==='buymax'?Math.min(config.capacity-stockCount(),Math.floor(state.cash/price)):action==='sellall'?(state.inventory[id]||0):clamp(Math.floor(Number($(`qty-${id}`).value)||1),1,config.capacity);
    if(action==='buy'||action==='buymax') {
      if(qty<1||qty*price>state.cash||stockCount()+qty>config.capacity||!localAvailability(good,config.locations[state.locationIndex]))return;
      state.cash-=qty*price;
      const oldQty=state.inventory[id]||0, oldCost=state.costs[id]||0;
      state.inventory[id]=oldQty+qty;state.costs[id]=(oldQty*oldCost+qty*price)/(oldQty+qty);
      const text=config.dialogue.buy.replace('{qty}',qty).replace('{item}',good.name);note(text);toast(`${text} ${config.currency}${(qty*price).toLocaleString('en-GB')} spent.`);
    } else {
      const sold=Math.min(qty,state.inventory[id]||0);if(!sold)return;
      state.cash+=sold*price;state.inventory[id]-=sold;if(!state.inventory[id]){delete state.inventory[id];delete state.costs[id];}
      const text=config.dialogue.sell.replace('{qty}',sold).replace('{item}',good.name).replace('{total}',(sold*price).toLocaleString('en-GB'));note(text);toast(text);
    }
    render();
  }
  $('travelButton').addEventListener('click',()=>{if(state.day<config.days)addDay(state.nextLocation);else if(!state.ended){state.ended=true;note(`Route complete · final worth ${currency(netWorth())}.`);render();}});
  $('newGame').addEventListener('click',()=>{state=createRun();addDay();toast('A fresh 30-day route begins.');});
  load();render();
})();
