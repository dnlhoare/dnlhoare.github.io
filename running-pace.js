(() => {
  const distances = [100,200,400,800,1000,1500,1609.344,3000,5000,10000,15000,21097.5,30000,42195];
  const names = ['100 m','200 m','400 m','800 m','1 km','1500 m','1 mile','3 km','5 km','10 km','15 km','Half marathon','30 km','Marathon'];
  const $ = id => document.getElementById(id);
  const inputIds = ['raceDistance','hours','minutes','seconds','baseAge','baseWeight','ageChange','weightChange'];
  const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
  const formatTime = seconds => { if (!Number.isFinite(seconds)||seconds<=0) return '—'; let n=Math.round(seconds), h=Math.floor(n/3600), m=Math.floor(n%3600/60), s=n%60; return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`; };
  const pace = (sec, metres) => formatTime(sec*1000/metres);
  const vdotFor = (distance,timeSec) => { const t=timeSec/60, v=distance/t; const cost=-4.6+0.182258*v+0.000104*v*v; const fraction=0.8+0.1894393*Math.exp(-0.012778*t)+0.2989558*Math.exp(-0.1932605*t); return cost/fraction; };
  function scenarioTime(targetDistance, fitness) { let lo=3*60, hi=12*60*60; for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(vdotFor(targetDistance,mid)>fitness)lo=mid;else hi=mid;}return (lo+hi)/2; }
  function renderChart(times) {
    const svg=$('paceChart'), w=900,h=250,left=48,right=12,top=14,bottom=20; const vals=times.map(x=>x.time);const min=Math.min(...vals),max=Math.max(...vals); const y0=Math.floor(min/60/10)*10*60,y1=Math.ceil(max/60/10)*10*60;
    const x=i=>left+i*(w-left-right)/(times.length-1), y=v=>top+(y1-v)*(h-top-bottom)/(y1-y0||1);
    let html=''; for(let i=0;i<5;i++){const val=y0+(y1-y0)*i/4, yy=y(val);html+=`<line class="chart-grid" x1="${left}" x2="${w-right}" y1="${yy}" y2="${yy}"/><text class="chart-text" x="${left-8}" y="${yy+4}" text-anchor="end">${Math.round(val/60)}m</text>`;}
    const pts=times.map((p,i)=>`${x(i)},${y(p.time)}`).join(' ');html+=`<polyline class="chart-line" points="${pts}"/>`; times.forEach((p,i)=>{html+=`<circle class="chart-point" cx="${x(i)}" cy="${y(p.time)}" r="3"><title>${p.name}: ${formatTime(p.time)}</title></circle>`;});svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.innerHTML=html;
    $('chartTicks').innerHTML=times.map(p=>`<span>${p.name}</span>`).filter((_,i)=>[0,3,6,8,9,11,13].includes(i)).join('');
  }
  function update(){
    const distance=Number($('raceDistance').value); const h=clamp(Number($('hours').value)||0,0,99),m=clamp(Number($('minutes').value)||0,0,59),s=clamp(Number($('seconds').value)||0,0,59); const t=h*3600+m*60+s;
    const baseAge=clamp(Number($("baseAge").value)||35,16,100),baseWeight=clamp(Number($("baseWeight").value)||70,30,250); const scenarioAge=clamp(baseAge+Number($("ageChange").value),16,100),scenarioWeight=clamp(baseWeight+Number($("weightChange").value),30,250); $("ageOut").textContent=scenarioAge+" years"; $("weightOut").textContent=scenarioWeight+" kg";
    if(t<=0){$('vdotValue').textContent='—';$('effortPace').textContent='—';$('distanceRows').innerHTML='';return;}
    const predicted=distances.map((d,i)=>({distance:d,name:names[i],time:t*Math.pow(d/distance,1.06)}));
    $('effortPace').textContent=pace(t,distance); const vdot=vdotFor(distance,t); const valid=distance>=1500;
    $('vdotValue').textContent=valid?vdot.toFixed(1):'N/A'; $('vdotNotice').textContent=valid?'VDOT is inferred from race performance. It is not a laboratory measurement of VO₂max.':'This effort is shorter than 1500 m. A VDOT estimate is omitted because sprint performance is not well represented by the model.';
    $('distanceRows').innerHTML=predicted.map((p,i)=>`<tr><td>${p.name}</td><td>${formatTime(p.time)}</td><td>${pace(p.time,p.distance)}</td><td>${i<3?'Very rough sprint equivalency':i===13?'Preparation dependent':'Riegel power law'}</td></tr>`).join(''); renderChart(predicted);
    if(valid){const multiplier=Math.pow(0.995,Math.max(0,scenarioAge-30)-Math.max(0,baseAge-30))*baseWeight/scenarioWeight;const projected=vdot*multiplier;$("scenarioVdot").textContent=projected.toFixed(1);$("scenario5k").textContent=formatTime(scenarioTime(5000,projected));$("scenarioMarathon").textContent=formatTime(scenarioTime(42195,projected));} else {$("scenarioVdot").textContent="—";$("scenario5k").textContent="—";$("scenarioMarathon").textContent="—";}
  }
  inputIds.forEach(id=>$(id).addEventListener('input',update));inputIds.forEach(id=>$(id).addEventListener('change',update));update();
})();
