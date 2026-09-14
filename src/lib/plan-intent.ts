const KEY='orderly_plan_intent';
const valid=(id:unknown):id is string=>typeof id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
function cookie(value:string,maxAge:number){const shared=location.hostname==='orderlyshops.com'||location.hostname.endsWith('.orderlyshops.com');document.cookie=`${KEY}=${value};Path=/;Max-Age=${maxAge};SameSite=Lax${shared?';Domain=orderlyshops.com;Secure':''}`}
export function savePlanIntent(id:string){if(!valid(id))return;try{localStorage.setItem(KEY,JSON.stringify({id,savedAt:Date.now(),cycle:'monthly'}));cookie(id,604800)}catch{}}
export function readPlanIntent():string|null{try{const p=JSON.parse(localStorage.getItem(KEY)||'null');if(valid(p?.id)&&p.savedAt&&Date.now()-p.savedAt<604800000)return p.id;const c=document.cookie.split('; ').find(x=>x.startsWith(KEY+'='))?.slice(KEY.length+1);return valid(c)?c:null}catch{return null}}
export function clearPlanIntent(){try{localStorage.removeItem(KEY);cookie('',0)}catch{}}
