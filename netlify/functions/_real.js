// Реальные открытые данные: Open-Meteo Air Quality + Forecast (без ключа). OpenAQ v3 требует ключ — не используется.
const CITIES=[["astana","Астана",51.169,71.449],["karaganda","Караганда",49.806,73.085],["temirtau","Темиртау",50.054,72.964],["ustkam","Усть-Каменогорск",49.948,82.628],["pavlodar","Павлодар",52.287,76.967],["ekibastuz","Экибастуз",51.723,75.323]];
// ПДК РК (мкг/м³): м.р. — максимальная разовая, с.с. — среднесуточная
const PDK={pm2_5:{n:"PM2.5",mr:160,ss:35},pm10:{n:"PM10",mr:300,ss:60},nitrogen_dioxide:{n:"NO₂",mr:200,ss:40},sulphur_dioxide:{n:"SO₂",mr:500,ss:50},carbon_monoxide:{n:"CO",mr:5000,ss:3000}};
const K=Object.keys(PDK);let cache=null,at=0;
const SRC="Open-Meteo Air Quality (CAMS) + Open-Meteo Forecast";
async function get(u){const c=new AbortController(),t=setTimeout(()=>c.abort(),12000);try{const r=await fetch(u,{signal:c.signal});if(!r.ok)throw new Error("HTTP "+r.status);return await r.json()}finally{clearTimeout(t)}}
const col=x=>x<.5?"green":x<.8?"yellow":x<=1?"orange":"red";
async function load(){if(cache&&Date.now()-at<6e5)return cache;
 const la=CITIES.map(c=>c[2]).join(","),lo=CITIES.map(c=>c[3]).join(","),tz="&timezone=Asia%2FAlmaty";
 const [aq,wx]=await Promise.allSettled([get(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${la}&longitude=${lo}&current=${K.join(",")}&hourly=${K.join(",")}&past_days=1&forecast_days=3${tz}`),
  get(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=wind_speed_10m,wind_direction_10m,temperature_2m&hourly=wind_speed_10m,wind_direction_10m,temperature_2m&wind_speed_unit=ms&forecast_days=3${tz}`)]);
 const A=aq.status==="fulfilled"?[].concat(aq.value):null,W=wx.status==="fulfilled"?[].concat(wx.value):null;
 if(!A&&cache)return {...cache,stale:true};
 const cities=CITIES.map(([id,name,lat,lon],i)=>{const a=A&&A[i],w=W&&W[i];const vals={};let worst=0;
  if(a){const now=a.current.time,idx=a.hourly.time.indexOf(now);K.forEach(k=>{const h=a.hourly[k],from=Math.max(0,idx-23),arr=h.slice(from,idx+1).filter(v=>v!=null),avg=arr.length?arr.reduce((s,v)=>s+v,0)/arr.length:null,cur=a.current[k];
   const r=Math.max(cur!=null?cur/PDK[k].mr:0,avg!=null?avg/PDK[k].ss:0);worst=Math.max(worst,r);vals[k]={name:PDK[k].n,cur,avg24:avg==null?null:+avg.toFixed(1),pdkMr:PDK[k].mr,pdkSs:PDK[k].ss,ratio:+r.toFixed(2),status:col(r)}});}
  let hourly=[];if(a){const i0=a.hourly.time.indexOf(a.current.time);for(let j=Math.max(0,i0);j<Math.min(a.hourly.time.length,i0+48);j++){const t=a.hourly.time[j],wi=w?w.hourly.time.indexOf(t):-1;hourly.push({t,pm2_5:a.hourly.pm2_5[j],pm10:a.hourly.pm10[j],no2:a.hourly.nitrogen_dioxide[j],so2:a.hourly.sulphur_dioxide[j],wind:wi>=0?w.hourly.wind_speed_10m[wi]:null,dir:wi>=0?w.hourly.wind_direction_10m[wi]:null})}}
  return {id,name,lat,lon,time:a?a.current.time:null,values:vals,status:a?col(worst):"grey",worst:+worst.toFixed(2),
   wind:w?{speed:w.current.wind_speed_10m,dir:w.current.wind_direction_10m,temp:w.current.temperature_2m}:null,hourly};});
 const r={source:SRC,sourceUrls:["https://open-meteo.com/en/docs/air-quality-api","https://open-meteo.com/en/docs"],fetchedAt:new Date().toISOString(),
  errors:[aq.status==="rejected"?"air-quality: "+aq.reason.message:null,wx.status==="rejected"?"forecast: "+wx.reason.message:null].filter(Boolean),
  openaq:"пропущено: OpenAQ v3 требует API-ключ",pdk:PDK,note:"Модельные данные CAMS по сетке ~11 км для города, не замеры конкретного завода.",cities};
 if(A){cache=r;at=Date.now();}return r;}
const deg=d=>["С","СВ","В","ЮВ","Ю","ЮЗ","З","СЗ"][Math.round(d/45)%8];
async function answer(q,city){const R=await load();q=(q||"").toLowerCase();const c=R.cities.find(x=>x.id===city)||R.cities.find(x=>q.includes(x.name.toLowerCase().slice(0,5)))||null;const L=[];
 const line=x=>`${x.name}: `+Object.values(x.values).map(v=>`${v.name} ${v.cur} мкг/м³ (${Math.round(v.ratio*100)}% ПДК)`).join(", ")+(x.wind?`; ветер ${x.wind.speed} м/с, ${deg(x.wind.dir)} (${x.wind.dir}°)`:"");
 if(/прогноз|завтра|48/.test(q)){const t=c||R.cities[0];const pk=t.hourly.reduce((m,h)=>h.pm2_5>m.pm2_5?h:m,t.hourly[0]||{pm2_5:0});L.push(`${t.name}, прогноз Open-Meteo на 48 ч: пик PM2.5 ${pk.pm2_5} мкг/м³ в ${pk.t?.slice(11)} ${pk.t?.slice(8,10)}.${pk.t?.slice(5,7)}, ветер ${pk.wind} м/с.`);}
 else if(c)L.push(line(c));
 else{const s=R.cities.slice().sort((a,b)=>b.worst-a.worst);L.push("Сейчас по открытым данным (худшее отношение к ПДК сверху):");s.forEach(x=>L.push("• "+line(x)));}
 L.push(R.note);return {intent:"real",answer:L.join("\n"),plant:"реальные открытые данные",demo:`Реальные открытые данные · источник: ${R.source} · ${R.cities[0].time||""} (Asia/Almaty)`,mode:"real"};}
module.exports={load,answer};
