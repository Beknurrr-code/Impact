// Клиентская версия API: та же логика, что в netlify/functions, считается прямо в браузере.
const H={anomalies:require('../netlify/functions/anomalies'),assistant:require('../netlify/functions/assistant'),broken:require('../netlify/functions/broken'),compare:require('../netlify/functions/compare'),epicentres:require('../netlify/functions/epicentres'),explain:require('../netlify/functions/explain'),forecast:require('../netlify/functions/forecast'),grid:require('../netlify/functions/grid'),plants:require('../netlify/functions/plants'),real:require('../netlify/functions/real'),sensors:require('../netlify/functions/sensors')};
const nf=window.fetch.bind(window),onNetlify=/netlify\.app$/.test(location.hostname);
async function local(name,qs,body,method){const key='impactApi:'+name+':'+new URLSearchParams(qs);
 if(name==='real'){try{const c=JSON.parse(sessionStorage[key]||'null');if(c&&Date.now()-c.t<6e5)return new Response(c.b,{headers:{'content-type':'application/json'}})}catch(e){}}
 const r=await H[name].handler({httpMethod:method,queryStringParameters:qs,body,headers:{}});
 if(name==='real'&&(r.statusCode||200)===200)try{sessionStorage[key]=JSON.stringify({t:Date.now(),b:r.body})}catch(e){}
 return new Response(r.body,{status:r.statusCode||200,headers:{'content-type':'application/json'}})}
window.IMPACT_API=(name,qs={},body)=>local(name,qs,body,body?'POST':'GET').then(r=>r.json());
window.fetch=async(input,init={})=>{const u=new URL(typeof input==='string'?input:input.url,location.href),m=u.pathname.match(/\/api\/([a-z]+)$/);
 if(!m||!H[m[1]])return nf(input,init);
 if(onNetlify){try{const r=await nf(input,init);if(r.ok)return r}catch(e){}}
 return local(m[1],Object.fromEntries(u.searchParams),init.body,init.method||'GET')};
