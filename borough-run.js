(() => {
  const config = window.BOROUGH_RUN_CONFIG;
  const $ = id => document.getElementById(id);
  const currency = value => config.currency + Math.max(0, Math.floor(value)).toLocaleString('en-GB');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const storageKey = 'djhdev-borough-run-v3';
  const upgradePrice=50000;
  const bagCapacity=()=>state?.capacityUpgrade?200:config.capacity;
  const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const samplePrice = good => {
    const uniform=Math.random(), triangular=(Math.random()+Math.random())/2;
    return Math.round(good.min+(good.max-good.min)*(.65*uniform+.35*triangular));
  };
  let state;

  function createRun() {
    const priceHistory={};
    config.goods.forEach(good=>{priceHistory[good.id]=Array.from({length:24},()=>samplePrice(good));});
    return {day:0,locationIndex:0,nextLocation:0,lowOffers:[],available:[],costs:{},priceHistory,cash:config.startingCash,inventory:{},history:[],marketPrices:{},prices:{},trend:{},event:null,log:[],ended:false,capacityUpgrade:false,storageOffer:false};
  }
  function save() { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch (_) {} }
  function note(message) {
    const line = {day:Math.min(state.day+1,config.days),text:message};
    state.log.unshift(line); state.log = state.log.slice(0,6);
  }
  function addDay(locationIndex, travelling=false) {
    state.day++;
    state.locationIndex = Number.isInteger(locationIndex) ? locationIndex : Math.floor(Math.random()*config.locations.length);
    const location = config.locations[state.locationIndex];
    state.nextLocation = (state.locationIndex+1+Math.floor(Math.random()*(config.locations.length-1)))%config.locations.length;
    state.storageOffer=travelling&&!state.capacityUpgrade&&Math.random()<.2;
    state.available = config.goods.map(good=>good.id);
    state.event = Math.random() < (.1+location.volatilityScale*.13) ? config.events[Math.floor(Math.random()*config.events.length)] : null;
    if (state.event) state.available = [...new Set([...state.available,...state.event.goods])];
    const previousLowOffers=state.lowOffers||[];
    const lowCandidates=config.goods.map(good=>good.id).filter(id=>!previousLowOffers.includes(id)&&!state.event?.goods.includes(id)).sort(()=>Math.random()-.5);
    const lowOfferCount=1+(Math.random()<.7?1:0);
    state.lowOffers=lowCandidates.slice(0,lowOfferCount);
    const previousPrices=state.prices;
    state.prices = {}; state.trend = {};
    config.goods.forEach(good => {
      const previousVisible=previousPrices[good.id];
      const previous = state.marketPrices[good.id] || null;
      const middle=(good.min+good.max)/2, range=good.max-good.min;
      let basePrice;
      if(state.lowOffers.includes(good.id)) basePrice=good.min+range*(.18+Math.random()*.18*location.volatilityScale);
      else if(previous===null) basePrice=samplePrice(good);
      else if(previousLowOffers.includes(good.id)) basePrice=previous+(middle-previous)*(.68+Math.random()*.2)+(Math.random()-.5)*range*.12*location.volatilityScale;
      else basePrice=previous+(middle-previous)*.22+(Math.random()-.5)*range*good.volatility*.42*location.volatilityScale;
      basePrice=Math.round(Math.max(good.min,Math.min(good.max,basePrice)));
      state.marketPrices[good.id]=basePrice;
      let price = basePrice*(1+location.priceBias);
      const eventMove=state.event&&state.event.goods.includes(good.id);
      if (eventMove) price = basePrice*(1+location.priceBias)*state.event.multiplier;
      price=eventMove?Math.max(1,Math.round(price)):Math.round(Math.max(good.min,Math.min(good.max,price)));
      if(previousVisible!==undefined&&price===previousVisible){basePrice=basePrice>=good.max?Math.max(good.min,basePrice-1):Math.min(good.max,basePrice+1);state.marketPrices[good.id]=basePrice;price=Math.max(1,Math.round(basePrice*(1+location.priceBias)*(eventMove?state.event.multiplier:1)));}
      state.prices[good.id] = price;
      state.trend[good.id] = previousVisible === undefined ? 0 : Math.round((price/previousVisible-1)*100);
      state.priceHistory[good.id] ||= [];
      state.priceHistory[good.id].push(price);
      state.priceHistory[good.id]=state.priceHistory[good.id].slice(-40);
    });
    state.history.push({...state.prices});
    if (state.event) note(config.dialogue.event.replace('{name}', state.event.title));
    save(); render();
  }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && saved.day >= 1 && saved.day <= config.days && saved.log && saved.inventory && saved.history) {
        saved.costs ||= {}; saved.nextLocation ??= (saved.locationIndex+1)%config.locations.length; saved.priceHistory ||= {}; saved.marketPrices ||= {}; saved.lowOffers ||= [];
        config.goods.forEach(good=>{if(!saved.marketPrices[good.id]){const multiplier=saved.event?.goods?.includes(good.id)?saved.event.multiplier:1;saved.marketPrices[good.id]=Math.round((saved.prices?.[good.id]||good.base)/multiplier);}});
        config.goods.forEach(good=>{if(!saved.priceHistory[good.id]){saved.priceHistory[good.id]=Array.from({length:24},()=>samplePrice(good));saved.priceHistory[good.id].push(saved.prices?.[good.id]||good.base);}else if(saved.priceHistory[good.id].length<24){const gap=24-saved.priceHistory[good.id].length;saved.priceHistory[good.id]=Array.from({length:gap},()=>samplePrice(good)).concat(saved.priceHistory[good.id]);}saved.priceHistory[good.id]=saved.priceHistory[good.id].slice(-40);});
        state=saved; return saved;
      }
    } catch (_) {}
    const fresh = createRun(); state = fresh; addDay();
  }
  function stockCount() { return Object.values(state.inventory).reduce((sum, qty) => sum + Math.max(0, qty), 0); }
  function inventoryValue() { return config.goods.reduce((sum, good) => sum + (state.inventory[good.id]||0)*(state.prices[good.id]||0),0); }
  function netWorth() { return state.cash + inventoryValue(); }
  function localAvailability(good, location) { return true; }
  function marketHTML(good, location) {
    const price = state.prices[good.id], owned = state.inventory[good.id]||0, trend=state.trend[good.id]||0;
    const available = localAvailability(good, location);
    const delta = trend > 5 ? `<span class="up">↗ ${trend}%</span>` : trend < -5 ? `<span class="down">↘ ${Math.abs(trend)}%</span>` : '<span>→ steady</span>';
    const qty = clamp(Math.floor(Number($(`qty-${good.id}`)?.value)||1),1,bagCapacity());
    const canBuy = available && qty*price <= state.cash && qty + stockCount() <= bagCapacity() && !state.ended;
    const canSell = owned > 0 && !state.ended;
    return `<article class="good-row" style="--good:${good.color||({violet:'#c299f5',blue:'#7cb9ff',amber:'#f1c978',green:'#94d786',coral:'#ff9a83',pink:'#f28cce',lime:'#c7f36b',orange:'#f5a36e',cyan:'#79d9d4'}[good.tone]||'#c7f36b')}"><div class="good-name"><span class="good-glyph">${escapeHTML(good.glyph)}</span><div><strong>${escapeHTML(good.name)}</strong><small>${available?`STOCK HERE · ${owned} ${escapeHTML(good.unit)} OWNED`:`NOT STOCKED HERE · ${owned} OWNED`}</small></div></div><div class="price">${currency(price)}<small>${delta}</small></div><div class="quantity"><button type="button" data-step="-1" data-id="${good.id}" aria-label="Decrease quantity for ${escapeHTML(good.name)}">−</button><input id="qty-${good.id}" type="number" min="1" max="${config.capacity}" value="1" aria-label="Quantity of ${escapeHTML(good.name)}" ${state.ended?'disabled':''}><button type="button" data-step="1" data-id="${good.id}" aria-label="Increase quantity for ${escapeHTML(good.name)}">+</button></div><div class="trade-actions"><button type="button" data-action="buy" data-id="${good.id}" ${canBuy?'':'disabled'}>BUY</button><button class="sell" type="button" data-action="sell" data-id="${good.id}" ${canSell?'':'disabled'}>SELL</button></div></article>`;
  }
  let activeChart=null;
  function hidePriceChart(){if(activeChart){activeChart.remove();activeChart=null;}}
  function wirePriceCharts(){
    $('marketList').querySelectorAll('.price').forEach(priceEl=>{
      const row=priceEl.closest('.good-row'), id=row.querySelector('[data-id]').dataset.id, good=config.goods.find(item=>item.id===id);
      const values=state.priceHistory[id]||[], low=Math.min(...values), high=Math.max(...values), span=Math.max(1,high-low);
      const sparkPoints=values.map((value,index)=>`${2+index*46/Math.max(1,values.length-1)},${19-(value-low)/span*16}`).join(' ');
      const button=document.createElement('button');button.type='button';button.className='price price-trigger';button.innerHTML=priceEl.innerHTML;button.setAttribute('aria-label',`${good.name} current price. Show price history.`);priceEl.replaceWith(button);
      button.innerHTML=`<span class="price-value">${priceEl.innerHTML}</span><svg class="price-sparkline" viewBox="0 0 50 22" aria-hidden="true"><polyline points="${sparkPoints}"/></svg>`;
      button.addEventListener('click',event=>{
        event.stopPropagation();
        if(activeChart?.dataset.goodId===id){hidePriceChart();return;}
        hidePriceChart();
        const values=state.priceHistory[id]||[], low=Math.min(...values), high=Math.max(...values), average=values.reduce((sum,value)=>sum+value,0)/Math.max(1,values.length), span=Math.max(1,high-low);
        const points=values.map((value,index)=>`${8+index*(224/Math.max(1,values.length-1))},${82-(value-low)/span*64}`).join(' ');
        const averageY=82-(average-low)/span*64;
        const chart=document.createElement('div');chart.className='price-chart-popover';chart.dataset.goodId=id;chart.setAttribute('role','dialog');chart.setAttribute('aria-label',`${good.name} price history`);
        chart.innerHTML=`<div class="chart-heading"><strong>${escapeHTML(good.name)} · PRICE HISTORY</strong><button type="button" class="chart-close" aria-label="Close chart">×</button></div><div class="chart-stats"><span>LOW <b>${currency(low)}</b></span><span>AVG <b>${currency(average)}</b></span><span>HIGH <b>${currency(high)}</b></span></div><svg viewBox="0 0 240 100" role="img" aria-label="${escapeHTML(good.name)} prices over ${values.length} market visits"><line x1="8" y1="18" x2="232" y2="18"/><line x1="8" y1="50" x2="232" y2="50"/><line x1="8" y1="82" x2="232" y2="82"/><line class="average-line" x1="8" y1="${averageY}" x2="232" y2="${averageY}"/><polyline points="${points}"/><text x="8" y="12">${currency(high)}</text><text x="8" y="97">${currency(low)}</text></svg><small>${values.length} recorded prices · latest ${currency(state.prices[id])}</small>`;
        document.body.append(chart);activeChart=chart;
        const rect=button.getBoundingClientRect(), width=Math.min(300,window.innerWidth-16), height=222;
        chart.style.left=`${Math.max(8,Math.min(window.innerWidth-width-8,rect.left+rect.width/2-width/2))}px`;
        chart.style.top=`${Math.max(8,Math.min(window.innerHeight-height-8,rect.bottom+8))}px`;
        chart.addEventListener('click',e=>e.stopPropagation());chart.querySelector('.chart-close').addEventListener('click',hidePriceChart);
      });
    });
  }
  document.addEventListener('click',hidePriceChart);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')hidePriceChart();});
  function render() {
    const location = config.locations[state.locationIndex] || config.locations[0];
    const finalDay = state.ended;
    $('dayStat').textContent = `${Math.min(state.day,config.days)} / ${config.days}`;
    $('placeStat').textContent = location.name;
    $('cashStat').textContent = currency(state.cash);
    $('worthStat').textContent = currency(netWorth());
    $('capacityStat').textContent = `${stockCount()} / ${bagCapacity()}`;
    $('capacityBar').style.width = `${Math.min(100,stockCount()/bagCapacity()*100)}%`;
    $('marketTitle').textContent = `${location.name} Market`;
    $('dayChip').textContent = `DAY ${String(state.day).padStart(2,'0')}`;
    $('locationIndex').textContent = String(state.day).padStart(2,'0');
    $('nextPlace').textContent = finalDay ? 'End of the route' : state.day >= config.days ? 'Run complete' : config.locations[state.nextLocation]?.name || config.locations[0].name;
    const choices=$('locationChoices');
    choices.innerHTML=config.locations.map((item,index)=>{const bias=Math.round(item.priceBias*100),biasText=`${bias>0?'+':''}${bias}%`,volText=`${item.volatilityScale.toFixed(1)}×`;return `<button title="${escapeHTML(item.district)} · price bias ${biasText} · volatility ${volText}" aria-label="${escapeHTML(item.name)}: price bias ${biasText}, volatility multiplier ${volText}" class="location-choice ${index===state.locationIndex?'current':''} ${index===state.nextLocation?'selected':''}" type="button" data-location="${index}" ${index===state.locationIndex||finalDay||state.day>=config.days?'disabled':''}><span>${escapeHTML(item.name)}</span><small>${index===state.locationIndex?'HERE · ':''}${biasText} · ${volText}</small></button>`;}).join('');
    choices.querySelectorAll('[data-location]').forEach(button=>button.addEventListener('click',()=>{state.nextLocation=Number(button.dataset.location);render();}));
    $('travelNote').textContent = finalDay ? `You’ve finished the route with ${currency(netWorth())} to your name.` : state.day >= config.days ? 'Sell any remaining stock, then finish your run.' : 'Negative bias means cheaper prices; high volatility means bigger swings and more events.';
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
    $('marketList').querySelectorAll('input[type=number]').forEach(input=>input.max=bagCapacity());
    wirePriceCharts();
    $('marketList').querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{const input=$(`qty-${button.dataset.id}`);input.value=clamp((Number(input.value)||1)+Number(button.dataset.step),1,bagCapacity());updateButtons();}));
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
    $('buildVersion').textContent = `VERSION ${config.version}`;
    $('storageModal').hidden=!state.storageOffer;
    $('upgradeStorage').disabled=state.cash<upgradePrice;
    $('storageCash').textContent=currency(state.cash);
    document.body.classList.toggle('is-final',finalDay);
    save();
  }
  function updateButtons() {
    const location=config.locations[state.locationIndex];
    config.goods.forEach(good=>{
      const row=$(`qty-${good.id}`)?.closest('.good-row'); if (!row) return;
      const qty=clamp(Math.floor(Number($(`qty-${good.id}`).value)||1),1,bagCapacity()), price=state.prices[good.id], owned=state.inventory[good.id]||0;
      row.querySelector('[data-action=buy]').disabled=state.ended||!localAvailability(good,location)||qty*price>state.cash||qty+stockCount()>bagCapacity();
      row.querySelector('[data-action=sell]').disabled=state.ended||owned<1;
      row.querySelector('[data-action=buymax]').disabled=state.ended||!localAvailability(good,location)||stockCount()>=bagCapacity()||state.cash<price;
      row.querySelector('[data-action=sellall]').disabled=state.ended||owned<1;
    });
  }
  let toastTimer;
  function toast(message) { const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200); }
  function trade(id, action) {
    const good=config.goods.find(item=>item.id===id), price=state.prices[id];
    const qty=action==='buymax'?Math.min(bagCapacity()-stockCount(),Math.floor(state.cash/price)):action==='sellall'?(state.inventory[id]||0):clamp(Math.floor(Number($(`qty-${id}`).value)||1),1,bagCapacity());
    if(action==='buy'||action==='buymax') {
      if(qty<1||qty*price>state.cash||stockCount()+qty>bagCapacity()||!localAvailability(good,config.locations[state.locationIndex]))return;
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
  $('travelButton').addEventListener('click',()=>{if(state.day<config.days)addDay(state.nextLocation,true);else if(!state.ended){state.ended=true;note(`Route complete · final worth ${currency(netWorth())}.`);render();}});
  $('upgradeStorage').addEventListener('click',()=>{if(!state.storageOffer||state.cash<upgradePrice)return;state.cash-=upgradePrice;state.capacityUpgrade=true;state.storageOffer=false;note('Bought a bag upgrade · storage limit is now 200.');render();toast('Bag upgraded to 200 spaces.');});
  $('dismissStorage').addEventListener('click',()=>{state.storageOffer=false;render();});
  $('newGame').addEventListener('click',()=>{state=createRun();addDay();toast('A fresh 30-day route begins.');});
  load();render();
})();
