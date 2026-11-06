import { WAC_RACES } from '../../wac-races-data.js';
import { WAC_RUNNERS } from '../../wac-runners-data.js';

const runnerById = new Map(WAC_RUNNERS.map(([id,name])=>[id,{id,name}]));

const json = (data, status=200) => new Response(JSON.stringify(data), {status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
async function sharedData(db) {
  const [responses,personalRaces] = await Promise.all([
    db.prepare('SELECT rr.race_id, rr.runner_id, rr.status, r.name AS runner_name FROM race_responses rr JOIN runners r ON r.id=rr.runner_id').all(),
    db.prepare('SELECT id, runner_id, name, date, location, url FROM personal_races ORDER BY date').all()
  ]);
  return {responses:responses.results,personalRaces:personalRaces.results};
}
async function verifyTurnstile(token, secret, request) {
  if (!secret || !token) return false;
  const form = new FormData(); form.set('secret',secret); form.set('response',token);
  const ip=request.headers.get('CF-Connecting-IP'); if (ip) form.set('remoteip',ip);
  const result=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:form});
  const data=await result.json();
  const hostname=new URL(request.url).hostname;
  return data.success === true && hostname === 'djhdev.co.uk' && data.hostname === hostname;
}
export async function onRequestGet({request,env}) {
  try {
    const url=new URL(request.url), query=(url.searchParams.get('q')||'').trim().toLowerCase(), runnerId=Number(url.searchParams.get('runnerId'));
    let runners=[], more=false;
    if(Number.isInteger(runnerId)&&runnerId>0) {
      const match=runnerById.get(runnerId); if(match) runners=[match];
    } else if(query.length>=2) {
      const matches=WAC_RUNNERS.filter(([id,name])=>`${name} ${id}`.toLowerCase().includes(query));
      runners=matches.slice(0,50).map(([id,name])=>({id,name})); more=matches.length>50;
    }
    const data=await sharedData(env.WAC_DB);
    return json({...data,runners,more,clubRaces:WAC_RACES});
  }
  catch { return json({error:'Race data is unavailable.'},503); }
}
export async function onRequestPost({request,env}) {
  try {
    const body=await request.json();
    if (!await verifyTurnstile(body.token,env.TURNSTILE_SECRET_KEY,request)) return json({error:'Spam check failed. Please retry.'},403);
    const runnerId=Number(body.runnerId);
    const runner=runnerById.get(runnerId);
    if (!Number.isInteger(runnerId) || !runner) return json({error:'Choose a runner profile from the list.'},400);
    await env.WAC_DB.prepare('INSERT OR IGNORE INTO runners (id,name) VALUES (?,?)').bind(runnerId,runner.name).run();
    if (body.action==='response') {
      const clubRace=WAC_RACES.some(race=>race.id===body.raceId&&race.date>=new Date().toISOString().slice(0,10));
      const personalRace=clubRace?null:await env.WAC_DB.prepare('SELECT id FROM personal_races WHERE id=? AND date>=?').bind(body.raceId,new Date().toISOString().slice(0,10)).first();
      const validRace=clubRace||Boolean(personalRace);
      if (!validRace || !['yes','maybe','cant','clear'].includes(body.status)) return json({error:'That race response is not valid.'},400);
      if (body.status==='clear') await env.WAC_DB.prepare('DELETE FROM race_responses WHERE race_id=? AND runner_id=?').bind(body.raceId,runnerId).run();
      else await env.WAC_DB.prepare('INSERT INTO race_responses (race_id,runner_id,status,updated_at) VALUES (?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(race_id,runner_id) DO UPDATE SET status=excluded.status, updated_at=CURRENT_TIMESTAMP').bind(body.raceId,runnerId,body.status).run();
    } else if (body.action==='personal-race') {
      const name=String(body.name||'').trim(), date=String(body.date||''), location=String(body.location||'').trim().slice(0,80), url=String(body.url||'').trim().slice(0,300);
      if (!name || name.length>80 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date<new Date().toISOString().slice(0,10) || (url && !/^https:\/\//i.test(url))) return json({error:'Enter a valid race name, future date and secure link.'},400);
      const count=await env.WAC_DB.prepare('SELECT COUNT(*) AS n FROM personal_races WHERE runner_id=?').bind(runnerId).first();
      if (count.n>=20) return json({error:'Each profile can add up to 20 personal races.'},429);
      await env.WAC_DB.prepare('INSERT INTO personal_races (id,runner_id,name,date,location,url) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),runnerId,name,date,location, url||null).run();
    } else return json({error:'Unknown update type.'},400);
    return json(await sharedData(env.WAC_DB));
  } catch { return json({error:'Could not save this update.'},500); }
}
