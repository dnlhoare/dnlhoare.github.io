import { WAC_RACES } from './wac-races-data.js';

const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const profileKey = 'wac-runner-profile-v1';
const dateLabel = date => new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
const state = { runners:[], selectedRunner:null, responses:[], personal:[], selected:'', search:'' };
const queued = new Map(), draining = new Set(), confirmed = new Map(), saveStates = new Map();
let searchSequence = 0, searchTimer;
let turnstileWidgetId;
const message = text => { $('#actionMessage').textContent = text; };
const responseKey = (runnerId,raceId) => `${runnerId}:${raceId}`;

async function load() {
  const response = await fetch('/api/wac-data');
  if (!response.ok) throw new Error('Could not load shared race data.');
  const data = await response.json();
  state.responses=data.responses; state.personal=data.personalRaces;
  for (const item of state.responses) confirmed.set(responseKey(item.runner_id,item.race_id),item.status);
  state.selected = localStorage.getItem(profileKey) || '';
  populateRunners(); render();
  if (state.selected) await findRunner(state.selected);
}
function populateRunners() {
  const select=$('#memberSelect'), profiles=[...state.runners];
  if (state.selectedRunner && !profiles.some(r=>String(r.id)===String(state.selectedRunner.id))) profiles.unshift(state.selectedRunner);
  select.innerHTML=`<option value="">Select your profile</option>`+profiles.map(r=>`<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('');
  select.value=profiles.some(r=>String(r.id)===state.selected)?state.selected:'';
}
async function findRunner(id) {
  const response=await fetch(`/api/wac-data?runnerId=${encodeURIComponent(id)}`);
  if (!response.ok) return;
  const data=await response.json();
  state.selectedRunner=data.runners[0]||null;
  populateRunners();
}
async function searchRunners(query,sequence) {
  if (query.length<2) { state.runners=[]; populateRunners(); $('#runnerSearchStatus').textContent=query?'Type at least 2 characters to search.':'Start typing a name to find your profile.'; return; }
  $('#runnerSearchStatus').textContent='Searching club profiles…';
  try {
    const response=await fetch(`/api/wac-data?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error();
    const data=await response.json();
    if (sequence!==searchSequence) return;
    state.runners=data.runners; populateRunners();
    $('#runnerSearchStatus').textContent=data.runners.length?`${data.runners.length} matches${data.more?' · refine your search':''}`:'No matching profiles.';
  } catch { if(sequence===searchSequence) $('#runnerSearchStatus').textContent='Runner search is unavailable right now.'; }
}
function eventList() {
  const all=[...WAC_RACES,...state.personal.map(e=>({...e,type:'personal',series:'Personal race'}))];
  return all.filter(e=>e.date>=new Date().toISOString().slice(0,10)).sort((a,b)=>a.date.localeCompare(b.date));
}
function currentStatus(runnerId,raceId) { return state.responses.find(r=>String(r.runner_id)===String(runnerId)&&r.race_id===raceId)?.status||''; }
function setLocalResponse(runnerId,runnerName,raceId,status) {
  state.responses=state.responses.filter(r=>!(String(r.runner_id)===String(runnerId)&&r.race_id===raceId));
  if(status!=='clear') state.responses.push({runner_id:Number(runnerId),runner_name:runnerName,race_id:raceId,status});
}
function render() {
  const events=eventList();
  $('#raceCount').textContent=`${events.length} fixtures · sorted by date`;
  $('#raceList').innerHTML=events.length?events.map(event=>{
    const current=currentStatus(state.selected,event.id), key=responseKey(state.selected,event.id), saving=saveStates.get(key)||'';
    const groups=[['yes','Definitely'],['maybe','Maybe'],['cant',"Can't"]].map(([status,label])=>{
      const names=state.responses.filter(r=>r.race_id===event.id&&r.status===status).map(r=>r.runner_name);
      return `<div class="response-group response-${status}"><b>${label} <span>${names.length}</span></b><p>${names.length?names.map(escapeHtml).join(', '):'<span class="no-responses">No one yet</span>'}</p></div>`;
    }).join('');
    const link=event.url?`<a href="${escapeHtml(event.url)}" target="_blank" rel="noopener">Race details ↗</a>`:'';
    const saveLabel=saving==='saving'?'Saving…':saving==='saved'?'Saved':saving==='error'?'Not saved · retry':'';
    return `<article class="race-card"><div class="date-block"><b>${new Date(`${event.date}T12:00:00`).getDate()}</b><span>${new Date(`${event.date}T12:00:00`).toLocaleDateString('en-GB',{month:'short',year:'2-digit'})}</span></div><div class="race-info"><span class="race-series">${escapeHtml(event.type==='personal'?'YOUR RACE':event.series)}</span><h3>${escapeHtml(event.name)}</h3><p>${escapeHtml(dateLabel(event.date))}${event.time?` · ${escapeHtml(event.time)}`:''} · ${escapeHtml(event.location||'Location TBC')}</p>${link}</div><div class="race-actions" role="group" aria-label="Your plan for ${escapeHtml(event.name)}">${[['yes','Definitely'],['maybe','Maybe'],['cant',"Can't"]].map(([v,l])=>`<button type="button" class="status-button" data-status="${v}" data-event="${escapeHtml(event.id)}" aria-pressed="${current===v}" ${!state.selected||!state.selectedRunner?'disabled':''}>${l}</button>`).join('')}<span class="save-state ${saving}" aria-live="polite">${saveLabel}</span></div><section class="race-responses" aria-label="Member responses for ${escapeHtml(event.name)}"><h4>Who's planning to go?</h4><div class="response-groups">${groups}</div></section></article>`;
  }).join(''):'<div class="empty-races">No upcoming races right now. Add one below.</div>';
  document.querySelectorAll('.status-button').forEach(button=>button.addEventListener('click',()=>changeResponse(button.dataset.event,button.dataset.status)));
}
function changeResponse(raceId,clickedStatus) {
  if(!state.selected||!state.selectedRunner){message('Choose your runner profile first.');$('#memberSelect').focus();return;}
  const runnerId=state.selected, runnerName=state.selectedRunner?.name||$('#memberSelect').selectedOptions[0]?.textContent||'';
  const key=responseKey(runnerId,raceId), oldStatus=currentStatus(runnerId,raceId), desired=oldStatus===clickedStatus?'clear':clickedStatus;
  if(!confirmed.has(key)) confirmed.set(key,oldStatus||null);
  setLocalResponse(runnerId,runnerName,raceId,desired);
  queued.set(key,{runnerId,raceId,status:desired,runnerName});
  saveStates.set(key,'saving'); message(''); render();
  drainQueue(key);
}
async function drainQueue(key) {
  if(draining.has(key)) return;
  draining.add(key);
  while(queued.has(key)) {
    const update=queued.get(key); queued.delete(key);
    const saved=await sendUpdate({action:'response',raceId:update.raceId,status:update.status,runnerId:update.runnerId});
    if(saved) {
      confirmed.set(key,update.status==='clear'?null:update.status);
      if(queued.has(key)) continue;
      saveStates.set(key,'saved'); render();
      setTimeout(()=>{if(!queued.has(key)&&saveStates.get(key)==='saved'){saveStates.delete(key);render();}},1800);
    } else if(queued.has(key)) {
      // A newer tap arrived while this request was running; save the newest choice next.
      continue;
    } else {
      const previous=confirmed.get(key);
      setLocalResponse(update.runnerId,update.runnerName,update.raceId,previous||'clear');
      saveStates.set(key,'error'); message('Could not save that choice. Your previous saved choice was restored.'); render();
      setTimeout(()=>{if(saveStates.get(key)==='error'){saveStates.delete(key);render();}},4000);
    }
  }
  draining.delete(key);
}
async function sendUpdate(payload) {
  if(!window.WAC_TURNSTILE_SITE_KEY){message('Spam protection is not configured.');return false;}
  if(!window.turnstile){message('Spam protection is loading. Please try again in a moment.');return false;}
  try {
    const token=await new Promise((resolve,reject)=>{
      const container=$('#turnstile-widget');
      if(turnstileWidgetId!==undefined) window.turnstile.remove(turnstileWidgetId);
      container.innerHTML=''; let timer;
      const id=window.turnstile.render(container,{sitekey:window.WAC_TURNSTILE_SITE_KEY,execution:'execute',callback:value=>{clearTimeout(timer);resolve(value);},'error-callback':()=>reject(new Error('Spam check failed.')),'expired-callback':()=>reject(new Error('Spam check expired.'))});
      turnstileWidgetId=id;
      timer=setTimeout(()=>reject(new Error('Spam check timed out.')),15000);
      window.turnstile.execute(id);
    });
    const response=await fetch('/api/wac-data',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...payload,token})});
    const result=await response.json();
    if(!response.ok) throw new Error(result.error||'Could not save your update.');
    state.responses=result.responses; state.personal=result.personalRaces;
    return true;
  } catch(error) { message(error.message); return false; }
}
async function addPersonalRace(form) {
  if(!state.selected||!state.selectedRunner){message('Choose your runner profile first.');$('#memberSelect').focus();return;}
  const data=new FormData(form);
  const saved=await sendUpdate({action:'personal-race',name:String(data.get('name')).trim(),date:data.get('date'),location:String(data.get('location')).trim(),url:String(data.get('url')).trim(),runnerId:state.selected});
  if(saved){form.reset();message('Race added and shared with the club.');render();}
}
$('#memberSelect').addEventListener('change',async e=>{
  state.selected=e.target.value; localStorage.setItem(profileKey,state.selected);
  state.selectedRunner=state.runners.find(r=>String(r.id)===state.selected)||state.selectedRunner;
  if(state.selected&&!state.selectedRunner) await findRunner(state.selected);
  render();
});
$('#runnerSearch').addEventListener('input',e=>{
  state.search=e.target.value.trim(); searchSequence++;
  clearTimeout(searchTimer); searchTimer=setTimeout(()=>searchRunners(state.search,searchSequence),180);
});
$('#raceForm').addEventListener('submit',e=>{e.preventDefault();addPersonalRace(e.currentTarget);});
load().catch(error=>{message(error.message);$('#raceList').innerHTML='<div class="empty-races">Race data is temporarily unavailable.</div>';});
