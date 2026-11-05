import { WAC_RACES } from './wac-races-data.js';

const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const profileKey = 'wac-runner-profile-v1';
const dateLabel = date => new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
const state = { runners:[], responses:[], personal:[], selected:'', search:'' };
const message = text => { $('#actionMessage').textContent = text; };

async function load() {
  const response = await fetch('/api/wac-data');
  if (!response.ok) throw new Error('Could not load shared race data.');
  Object.assign(state, await response.json());
  state.selected = localStorage.getItem(profileKey) || '';
  populateRunners();
  render();
}
function populateRunners() {
  const select = $('#memberSelect');
  const matching = state.runners.filter(r => `${r.name} ${r.id}`.toLowerCase().includes(state.search.toLowerCase()));
  select.innerHTML = `<option value="">Select your profile</option>` + matching.map(r => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('');
  select.value = matching.some(r => String(r.id) === state.selected) ? state.selected : '';
}
function eventList() {
  const all = [...WAC_RACES, ...state.personal.map(e => ({...e, type:'personal', series:'Personal race'}))];
  return all.filter(e => e.date >= new Date().toISOString().slice(0,10)).sort((a,b) => a.date.localeCompare(b.date));
}
function render() {
  const events = eventList();
  $('#raceCount').textContent = `${events.length} fixtures · sorted by date`;
  $('#raceList').innerHTML = events.length ? events.map(event => {
    const current = state.responses.find(r => String(r.runner_id) === state.selected && r.race_id === event.id)?.status || '';
    const groups = [['yes','Definitely'],['maybe','Maybe'],['cant',"Can't"]].map(([status,label]) => {
      const names = state.responses.filter(r => r.race_id === event.id && r.status === status).map(r => r.runner_name);
      return `<div class="response-group response-${status}"><b>${label} <span>${names.length}</span></b><p>${names.length ? names.map(escapeHtml).join(', ') : '<span class="no-responses">No one yet</span>'}</p></div>`;
    }).join('');
    const link = event.url ? `<a href="${escapeHtml(event.url)}" target="_blank" rel="noopener">Race details ↗</a>` : '';
    return `<article class="race-card"><div class="date-block"><b>${new Date(`${event.date}T12:00:00`).getDate()}</b><span>${new Date(`${event.date}T12:00:00`).toLocaleDateString('en-GB',{month:'short',year:'2-digit'})}</span></div><div class="race-info"><span class="race-series">${escapeHtml(event.type==='personal'?'YOUR RACE':event.series)}</span><h3>${escapeHtml(event.name)}</h3><p>${escapeHtml(dateLabel(event.date))}${event.time?` · ${escapeHtml(event.time)}`:''} · ${escapeHtml(event.location||'Location TBC')}</p>${link}</div><div class="race-actions" role="group" aria-label="Your plan for ${escapeHtml(event.name)}">${[['yes','Definitely'],['maybe','Maybe'],['cant',"Can't"]].map(([v,l])=>`<button type="button" class="status-button" data-status="${v}" data-event="${escapeHtml(event.id)}" aria-pressed="${current===v}">${l}</button>`).join('')}</div><section class="race-responses" aria-label="Member responses for ${escapeHtml(event.name)}"><h4>Who's planning to go?</h4><div class="response-groups">${groups}</div></section></article>`;
  }).join('') : '<div class="empty-races">No upcoming races right now. Add one below.</div>';
  document.querySelectorAll('.status-button').forEach(button => button.addEventListener('click', () => {
    const selected = state.responses.find(r=>String(r.runner_id)===state.selected&&r.race_id===button.dataset.event)?.status;
    submit({action:'response', raceId:button.dataset.event, status:selected===button.dataset.status?'clear':button.dataset.status});
  }));
}
async function submit(payload) {
  if (!state.selected) { message('Choose your runner profile first.'); $('#memberSelect').focus(); return false; }
  if (!window.WAC_TURNSTILE_SITE_KEY) { message('Spam protection is being configured. Please try again shortly.'); return false; }
  if (!window.turnstile) { message('Spam protection is loading. Please try again in a moment.'); return false; }
  try {
    const token = await new Promise((resolve,reject) => {
      const container = $('#turnstile-widget'); container.innerHTML='';
      const id = window.turnstile.render(container, {sitekey:window.WAC_TURNSTILE_SITE_KEY,execution:'execute',callback:resolve,'error-callback':()=>reject(new Error('Spam check failed.')), 'expired-callback':()=>reject(new Error('Spam check expired.'))});
      window.turnstile.execute(id);
      setTimeout(()=>reject(new Error('Spam check timed out.')),15000);
    });
    const response = await fetch('/api/wac-data', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...payload,runnerId:state.selected,token})});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not save your update.');
    state.responses = result.responses; state.personal = result.personalRaces;
    message('Saved and shared with the club.'); render(); return true;
  } catch (error) { message(error.message); return false; }
}
$('#memberSelect').addEventListener('change', e => { state.selected=e.target.value; localStorage.setItem(profileKey,state.selected); render(); });
$('#runnerSearch').addEventListener('input', e => { state.search=e.target.value; populateRunners(); });
$('#raceForm').addEventListener('submit', e => {
  e.preventDefault(); const form=e.currentTarget, data = new FormData(form);
  submit({action:'personal-race',name:String(data.get('name')).trim(),date:data.get('date'),location:String(data.get('location')).trim(),url:String(data.get('url')).trim()}).then(saved=>{if(saved) form.reset();});
});
load().catch(error => { message(error.message); $('#raceList').innerHTML='<div class="empty-races">Race data is temporarily unavailable.</div>'; });
