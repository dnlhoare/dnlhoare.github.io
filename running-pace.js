(() => {
  const distances = [100,200,400,800,1000,1500,1609.344,3000,5000,10000,16093.44,15000,21097.5,30000,42195];
  const names = ['100 m','200 m','400 m','800 m','1 km','1500 m','1 mile','3 km','5 km','10 km','10 miles','15 km','Half marathon','30 km','Marathon'];
  const $ = id => document.getElementById(id);
  const inputIds = ['raceDistance','customDistance','customDistanceUnit','elevationGain','elevationUnit','hours','minutes','seconds','baseAge','baseWeight','ageChange','weightChange','scenarioDistance','scenarioCustomDistance','scenarioCustomUnit','scenarioElevation','scenarioElevationUnit'];
  const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
  const formatTime = seconds => { if (!Number.isFinite(seconds)||seconds<=0) return '—'; let n=Math.round(seconds), h=Math.floor(n/3600), m=Math.floor(n%3600/60), s=n%60; return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`; };
  const pace = (sec, metres) => formatTime(sec*1000/metres);
  const vdotFor = (distance,timeSec) => { const t=timeSec/60, v=distance/t; const cost=-4.6+0.182258*v+0.000104*v*v; const fraction=0.8+0.1894393*Math.exp(-0.012778*t)+0.2989558*Math.exp(-0.1932605*t); return cost/fraction; };
  const distanceMetres = (value,unit) => Number(value)*(unit==='miles'?1609.344:1000);
  const elevationMetres = (value,unit) => Number(value)*(unit==='ft'?0.3048:1);
  function minettiCost(grade){return 155.4*grade**5-30.4*grade**4-43.3*grade**3+46.3*grade**2+19.5*grade+3.6;}
  function elevationFactor(distance,gain){if(!gain||!distance)return 1;const grade=clamp((2*gain/distance),0,0.45);return (minettiCost(grade)+minettiCost(-grade))/(2*3.6);}
  function scenarioTime(targetDistance, fitness) { let lo=3*60, hi=12*60*60; for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(vdotFor(targetDistance,mid)>fitness)lo=mid;else hi=mid;}return (lo+hi)/2; }
  function renderChart(times) {
    const svg=$('paceChart'), w=900,h=250,left=48,right=12,top=14,bottom=20; const vals=times.map(x=>x.time);const min=Math.min(...vals),max=Math.max(...vals);const y0=Math.floor(min/60/10)*10*60,y1=Math.ceil(max/60/10)*10*60;
    const x=i=>left+i*(w-left-right)/(times.length-1),y=v=>top+(y1-v)*(h-top-bottom)/(y1-y0||1);let html='';
    for(let i=0;i<5;i++){const val=y0+(y1-y0)*i/4,yy=y(val);html+=`<line class="chart-grid" x1="${left}" x2="${w-right}" y1="${yy}" y2="${yy}"/><text class="chart-text" x="${left-8}" y="${yy+4}" text-anchor="end">${Math.round(val/60)}m</text>`;}
    const pts=times.map((p,i)=>`${x(i)},${y(p.time)}`).join(' ');html+=`<polyline class="chart-line" points="${pts}"/>`;times.forEach((p,i)=>{html+=`<circle class="chart-point" cx="${x(i)}" cy="${y(p.time)}" r="3"><title>${p.name}: ${formatTime(p.time)}</title></circle>`;});svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.innerHTML=html;
    $('chartTicks').innerHTML=times.map((p,i)=>({p,i})).filter(({i})=>[0,4,6,8,9,10,12,14].includes(i)).map(({p,i})=>`<span style="left:${x(i)/w*100}%">${p.name}</span>`).join('');
  }
  function update(){
    const customRace=$('raceDistance').value==='custom';$('customDistanceField').hidden=!customRace;
    const rawDistance=customRace?distanceMetres($('customDistance').value,$('customDistanceUnit').value):Number($('raceDistance').value),distance=rawDistance;
    const raceGain=elevationMetres($('elevationGain').value,$('elevationUnit').value);
    const h=clamp(Number($('hours').value)||0,0,99),m=clamp(Number($('minutes').value)||0,0,59),s=clamp(Number($('seconds').value)||0,0,59),t=h*3600+m*60+s;
    const baseAge=clamp(Number($('baseAge').value)||35,16,100),baseWeight=clamp(Number($('baseWeight').value)||70,30,250),scenarioAge=clamp(baseAge+Number($('ageChange').value),16,100),scenarioWeight=clamp(baseWeight+Number($('weightChange').value),30,250);
    $('ageOut').textContent=`${scenarioAge} years`;$('weightOut').textContent=`${scenarioWeight} kg`;
    const customTarget=$('scenarioDistance').value==='custom';$('customPredictionDistance').hidden=!customTarget;
    const validDistance=Number.isFinite(distance)&&distance>=100&&distance<=100000;
    if(!validDistance){$('vdotValue').textContent='—';$('effortPace').textContent='—';$('distanceRows').innerHTML='';$('scenarioVdot').textContent='—';$('scenarioTime').textContent='—';return;}
    if(t<=0){$('vdotValue').textContent='—';$('effortPace').textContent='—';$('distanceRows').innerHTML='';return;}
    const predicted=distances.map((d,i)=>({distance:d,name:names[i],time:t*Math.pow(d/distance,1.06)}));
    $('effortPace').textContent=pace(t,distance);const vdot=vdotFor(distance,t),valid=distance>=1500;
    $('vdotValue').textContent=valid?vdot.toFixed(1):'N/A';$('vdotNotice').textContent=`${valid?'Daniels–Gilbert VDOT is inferred from race performance, not measured VO₂max.':'VDOT is omitted for efforts shorter than 1500 m because sprint performance is not well represented.'}${raceGain?` Course gain entered: ${Math.round(raceGain)} m. The race effort and chart remain based on recorded distance and time; total gain alone is not enough for a reliable correction.`:''}`;
    $('distanceRows').innerHTML=predicted.map((p,i)=>`<tr><td>${p.name}</td><td>${formatTime(p.time)}</td><td>${pace(p.time,p.distance)}</td><td>${i<4?'Very rough sprint equivalency':i===14?'Preparation dependent':'Riegel flat-course equivalent'}</td></tr>`).join('');renderChart(predicted);
    const multiplier=Math.pow(0.995,Math.max(0,scenarioAge-30)-Math.max(0,baseAge-30))*baseWeight/scenarioWeight,projected=vdot*multiplier;
    $('scenarioVdot').textContent=valid?projected.toFixed(1):'—';
    const targetDistance=customTarget?distanceMetres($('scenarioCustomDistance').value,$('scenarioCustomUnit').value):Number($('scenarioDistance').value),targetGain=elevationMetres($('scenarioElevation').value,$('scenarioElevationUnit').value);
    if(valid&&targetDistance>=1500&&targetDistance<=100000){const flatTime=scenarioTime(targetDistance,projected),factor=elevationFactor(targetDistance,targetGain);$('scenarioTime').textContent=formatTime(flatTime*factor);}else $('scenarioTime').textContent='—';
  }
  inputIds.forEach(id=>$(id).addEventListener('input',update));inputIds.forEach(id=>$(id).addEventListener('change',update));update();
})();
