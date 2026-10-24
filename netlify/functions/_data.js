// IMPACT демо-модель: несколько реальных площадок РК (координаты приблизительные), синтетические датчики на границе СЗЗ,
// гауссова модель рассеяния (Pasquill–Gifford, Briggs plume rise). ДЕМО: параметры выбросов условные.
const DEMO="Демо-данные: синтетические датчики и условные параметры выбросов; координаты площадок приблизительные. Демо-модель, не официальный расчёт.";
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
// stacks: dx,dy (м от центра), h высота, d диаметр устья, vs скорость газов м/с, Ts K, Q г/с PM
const PLANTS=[
 {id:"astana-tec2",tgt:55,name:"ТЭЦ №2, Астана",city:"Астана",lat:51.1869,lon:71.5124,szz:1000,halls:10,towers:2,tanks:4,stacks:[[-60,90,180,7,18,420,95],[10,95,150,6,16,410,70],[75,85,120,5,14,400,40]]},
 {id:"astana-tec1",tgt:12,name:"ТЭЦ №1, Астана",city:"Астана",lat:51.2022,lon:71.4318,szz:800,halls:6,towers:0,tanks:3,stacks:[[-30,60,120,5,14,410,45],[40,60,100,4.5,12,400,30]]},
 {id:"karaganda-tec",tgt:31,name:"ТЭЦ, Караганда",city:"Караганда",lat:49.916,lon:73.2375,szz:1000,halls:8,towers:3,tanks:2,stacks:[[-40,80,180,7,18,420,90],[50,80,180,7,18,420,85]]},
 {id:"temirtau-steel",tgt:70,name:"Металлургический комбинат, Темиртау",city:"Темиртау",lat:50.0590,lon:73.0300,szz:2000,halls:14,towers:2,tanks:6,stacks:[[-200,120,150,8,15,450,160],[-80,130,120,6,14,430,120],[60,120,100,5,12,420,90],[180,110,80,4,10,400,60]]},
 {id:"ekibastuz-gres",tgt:10,name:"ГРЭС, Экибастуз",city:"Экибастуз",lat:51.8917,lon:75.39,szz:1500,halls:12,towers:0,tanks:3,stacks:[[-80,100,330,12,22,430,260],[80,100,300,11,20,430,220]]},
 {id:"pavlodar-al",tgt:30,name:"Алюминиевый завод, Павлодар",city:"Павлодар",lat:52.2547,lon:77.0517,szz:1000,halls:12,towers:0,tanks:5,stacks:[[-90,90,120,5,14,410,70],[0,95,120,5,14,410,65],[90,90,100,4,12,400,40]]},
 {id:"ukg-zinc",tgt:32,name:"Цинковый завод, Усть-Каменогорск",city:"Усть-Каменогорск",lat:49.9777,lon:82.6149,szz:1000,halls:9,towers:1,tanks:4,stacks:[[-60,90,140,6,15,440,80],[50,90,120,5,13,430,55]]}];
const getPlant=id=>PLANTS.find(p=>p.id===id)||PLANTS[0];
const QM={};const stacksOf=p=>p.stacks.map(([dx,dy,h,d,vs,Ts,Q],i)=>({id:"Труба №"+(i+1),dx,dy,h,d,vs,Ts,Q:+(Q*(QM[p.id]??1)).toFixed(1)}));
const CLASSES={A:[.22,.20,"a"],B:[.16,.12,"a"],C:[.11,.08,"c"],D:[.08,.06,"d"],E:[.06,.03,"e"],F:[.04,.016,"e"]};
function stability(u,cloud,isDay){ // Pasquill (упрощённая таблица Тернера)
 if(isDay){const strong=cloud<40,mod=cloud<75;if(u<2)return strong?"A":mod?"A":"B";if(u<3)return strong?"A":mod?"B":"C";if(u<5)return strong?"B":mod?"B":"C";if(u<6)return strong?"C":mod?"C":"D";return strong?"C":"D";}
 if(cloud>=50){return u<3?"E":"D";}return u<3?"F":u<5?"E":"D";}
function sigmas(x,cl){const [a,b,t]=CLASSES[cl];const sy=a*x/Math.sqrt(1+1e-4*x);
 const sz=t==="a"?b*x:t==="c"?b*x/Math.sqrt(1+2e-4*x):t==="d"?b*x/Math.sqrt(1+1.5e-3*x):b*x/(1+3e-4*x);return [sy,sz];}
function briggs(s,u,Ta,x){const g=9.81,F=g*s.vs*(s.d/2)**2*(s.Ts-Ta)/s.Ts;const xf=F<55?49*F**0.625:119*F**0.4;const xx=Math.min(x,xf);return 1.6*Math.cbrt(F)*xx**(2/3)/u;}
function conc(p,met,e,n){ // мкг/м³ на уровне земли в точке (e,n) м от центра площадки
 const u=Math.max(met.u,1),to=(met.dir+180)*Math.PI/180,ux=Math.sin(to),uy=Math.cos(to);const parts=[];
 for(const s of stacksOf(p)){const rx=e-s.dx,ry=n-s.dy,x=rx*ux+ry*uy,y=-rx*uy+ry*ux;if(x<=1){parts.push(0);continue}
  const [sy,sz]=sigmas(x,met.cls),H=s.h+briggs(s,u,met.Ta,x);
  parts.push(8e6*s.Q/(Math.PI*u*sy*sz)*Math.exp(-y*y/(2*sy*sy))*Math.exp(-H*H/(2*sz*sz)));}
 return parts;}
const m2ll=(p,e,n)=>[+(p.lon+e/(111320*Math.cos(p.lat*Math.PI/180))).toFixed(6),+(p.lat+n/110540).toFixed(6)];
async function weather(p=PLANTS[0]){
 try{const ctl=new AbortController();setTimeout(()=>ctl.abort(),4000);
  const u=`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_direction_10m_dominant&current=wind_speed_10m,wind_direction_10m,cloud_cover,is_day,temperature_2m&timezone=Asia%2FAlmaty&forecast_days=3`;
  const j=await (await fetch(u,{signal:ctl.signal})).json();
  return {live:true,current:{speed:j.current.wind_speed_10m,dir:j.current.wind_direction_10m,cloud:j.current.cloud_cover,isDay:!!j.current.is_day,temp:j.current.temperature_2m},
   days:j.daily.time.map((t,i)=>({date:t,tmax:j.daily.temperature_2m_max[i],tmin:j.daily.temperature_2m_min[i],wind:j.daily.wind_speed_10m_max[i],dir:j.daily.wind_direction_10m_dominant[i]}))};
 }catch(e){const d=new Date();return {live:false,current:{speed:10,dir:200,cloud:60,isDay:true,temp:-5},days:[0,1,2].map(i=>({date:new Date(d.getTime()+i*864e5).toISOString().slice(0,10),tmax:-5,tmin:-14,wind:[3,8,14][i],dir:200}))};}}
function met(w){const u=w.current.speed/3.6;return {u:Math.max(u,1),dir:w.current.dir,cls:stability(u,w.current.cloud??50,w.current.isDay??true),Ta:273.15+(w.current.temp??0),cloud:w.current.cloud,isDay:w.current.isDay};}
const BG=12;
function sensors(p,M){const r=rng(p.id.length*977+p.lat*100|0),list=[],N=12,H=72,raw=[];
 for(let i=0;i<N;i++){const a=i/N*2*Math.PI+0.2,R=p.szz*(1+r()*0.25),e=R*Math.sin(a),n=R*Math.cos(a);raw.push({e,n,parts:conc(p,M,e,n)});}
 // демо-калибровка выбросов: масштаб Q так, чтобы максимум модели на СЗЗ ≈ целевому значению площадки
 const mxm=Math.max(...raw.filter((x,i)=>![2,4,7,9].includes(i)).map(x=>x.parts.reduce((a,b)=>a+b,0)))||1,k=(p.tgt-BG-3)/mxm;QM[p.id]=k;
 raw.forEach((x,i)=>{x.parts=x.parts.map(v=>v*k);const model=x.parts.reduce((a,b)=>a+b,0),bg=BG+r()*3,{e,n,parts}=x;const series=[];
  for(let h=0;h<H;h++){const daily=1+0.3*Math.sin((h%24-7)/24*2*Math.PI);series.push(+(Math.max(0,(bg+model*(h>=H-6?1:daily*(0.4+r()*0.8)))*(h>=H-1?1:(0.85+r()*0.3)))).toFixed(1));}
  const id=p.id.slice(0,3).toUpperCase()+"-"+String(i+1).padStart(2,"0");
  if(i===4)series.fill(series[50],48); if(i===9)series.fill(0,60); if(i===7){series[66]=480;series[69]=510;}
  const [lon,lat]=m2ll(p,e,n);list.push({id,name:"Датчик СЗЗ "+id,lat,lon,e:Math.round(e),n:Math.round(n),pm25:series[H-1],model:+(bg+model).toFixed(1),parts,series,aqi:aqi(series[H-1])});});
 return list;}
function aqi(pm){const t=[[0,12,0,50],[12.1,35.4,51,100],[35.5,55.4,101,150],[55.5,150.4,151,200],[150.5,250.4,201,300],[250.5,500,301,500]];for(const[a,b,c,d]of t) if(pm<=b) return Math.round((d-c)/(b-a)*(pm-a)+c); return 500;}
const MISSING_IDX=2;
function health(list){return list.map((s,i)=>{const t=s.series.slice(-12);let status="Online",note="данные в норме",miss=0;
 if(t.every(v=>v===0)){status="Offline";note="нет данных последние 12 ч";miss=12}
 else if(new Set(t).size===1){status="Flatline";note="значение не меняется (залипание)"}
 else if(t.some((v,k)=>k>0&&v>t[k-1]*4&&v>200)){status="Spike";note="нереалистичный скачок"}
 else if(i===MISSING_IDX){status="Missing";miss=12;note="пропуск 12 ч (часы 30–41); оценка по соседям только пунктиром, в отчёт не входит"}
 return {id:s.id,lat:s.lat,lon:s.lon,status,note,completeness:+(100*(72-miss)/72).toFixed(1),gap:i===MISSING_IDX?[30,41]:null};});}
function broken(list){return health(list).filter(h=>h.status!=="Online").map(h=>({...h,type:h.status+" — "+h.note}));}
function anomalies(list){const bad=new Set(broken(list).map(b=>b.id)),ok=list.filter(s=>!bad.has(s.id)),vals=ok.map(s=>s.pm25),mean=vals.reduce((a,b)=>a+b,0)/vals.length;
 const sd=Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/vals.length)||1,out=[];
 for(const s of ok){const z=(s.pm25-mean)/sd;if(z>1.5)out.push({id:s.id,lat:s.lat,lon:s.lon,pm25:s.pm25,z:+z.toFixed(2),note:"PM2.5 значительно выше среднего по сети"});}
 return {meanPm25:+mean.toFixed(1),anomalies:out};}
const SECT=['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ'];const LIMIT=35;
function epicentres(p,list,M){const bad=new Set(broken(list).map(b=>b.id)),st=stacksOf(p);
 return list.filter(s=>!bad.has(s.id)&&s.pm25>LIMIT).map((s,i)=>{const tot=s.parts.reduce((a,b)=>a+b,0);
  const cand=st.map((k,j)=>({name:p.name+" · "+k.id,share:tot>0?Math.round(100*s.parts[j]/tot):0,modelUg:+s.parts[j].toFixed(1)})).filter(c=>c.share>0).sort((a,b)=>b.share-a.share);
  if(cand.length){const diff=100-cand.reduce((a,c)=>a+c.share,0);cand[0].share+=diff;}
  const fit=tot>0?Math.max(0,1-Math.abs((BG+tot)-s.pm25)/s.pm25):0,conf=Math.round(100*fit);
  return {id:"E"+(i+1),lat:s.lat,lon:s.lon,maxPm25:s.pm25,aqi:s.aqi,sensors:[s.id],modelPm25:+(BG+tot).toFixed(1),direction:Math.round(M.dir),sector:SECT[Math.round(M.dir/45)%8],
   stability:M.cls,candidates:cand.map(c=>({...c,confidence:c.share})),likelySource:cand[0]&&conf>15?cand[0].name:"источник вне модели (фон/другие)",confidence:cand[0]&&conf>15?conf:0,shareTop:cand[0]?cand[0].share:0,
   comment:cand[0]?`Ветер с ${SECT[Math.round(M.dir/45)%8]} (${Math.round(M.dir)}°), класс устойчивости ${M.cls}. Вклад: ${cand.map(c=>c.name.split(" · ")[1]+" "+c.share+"%").join(", ")}. Совпадение модели с измерением ${conf}%`:"Модель не даёт вклада труб площадки в этой точке"};}).sort((a,b)=>b.maxPm25-a.maxPm25);}
function grid(p,M){const out=[],R=Math.max(4000,p.szz*3),n=36;for(let i=0;i<=n;i++)for(let j=0;j<=n;j++){const e=-R+2*R*i/n,nn=-R+2*R*j/n,c=conc(p,M,e,nn).reduce((a,b)=>a+b,0);if(c>1)out.push({ll:m2ll(p,e,nn),c:+c.toFixed(1)});}return out;}
function stackStatus(p,M){return stacksOf(p).map((s,j)=>{let mx=0;const R=Math.max(4000,p.szz*3);for(let i=0;i<=24;i++)for(let k=0;k<=24;k++){const v=conc(p,M,-R+2*R*i/24,-R+2*R*k/24)[j]*(QM[p.id]??1);if(v>mx)mx=v}
 return {...s,maxGroundUg:+mx.toFixed(1),status:mx>LIMIT?"red":mx>LIMIT*.6?"orange":mx>LIMIT*.3?"yellow":"green"};});}
async function ctx(ev){const p=getPlant(ev&&ev.queryStringParameters&&ev.queryStringParameters.plant),w=await weather(p),M=met(w),l=sensors(p,M);return {p,w,M,l};}
async function forecast(p,w,l){const mean=anomalies(l).meanPm25;
 const days=w.days.map(d=>{const f=Math.max(0.4,Math.min(2.2,9/Math.max(d.wind,2)));const pm=+(mean*f*(d.tmax<-10?1.2:1)).toFixed(1);
  return {...d,pm25:pm,aqi:aqi(pm),risk:pm>55?"высокий":pm>35?"повышенный":"низкий",advice:pm>55?"Снизить нагрузку на источники выбросов, предупредить персонал":pm>35?"Усилить контроль выбросов":"Штатный режим"};});
 const level=days.some(d=>d.risk==="высокий")?"высокий":days.some(d=>d.risk==="повышенный")?"повышенный":"низкий";
 return {official:{source:"Казгидромет",url:"https://www.kazhydromet.kz",warnings:[],note:"Официальных предупреждений НМУ сейчас нет (в MVP подтягиваются из бюллетеней Казгидромета)"},
  riskIndicator:{level,label:"не официальный прогноз",basis:"ветер и температура Open-Meteo"},
  checklist:["Перевести печи на пониженную нагрузку","Перенести продувки и ремонт с выбросами","Усилить контроль на границе СЗЗ","Предупредить смену и диспетчера","Записать меры в журнал"],
  source:w.live?"Open-Meteo (живые данные погоды)":"резервный прогноз (Open-Meteo недоступен)",wind:w.current,days,note:"PM2.5 — модельная оценка на демо-данных"};}
const METHOD={formula:"C(x,y,0) = Q / (π·u·σy·σz) · exp(−y²/2σy²) · exp(−H²/2σz²);  H = h + Δh,  Δh = 1.6·F^(1/3)·x^(2/3)/u (Briggs),  F = g·vs·r²·(Ts−Ta)/Ts",
 sigma:"σy, σz — Briggs (сельская местность) по классу устойчивости Паскуилла A–F; класс из скорости ветра, облачности и дня/ночи (Open-Meteo)",
 attribution:"Вклад трубы = C_i / ΣC_i в точке датчика (сумма 100%). Уверенность = 1 − |модель+фон − измерение| / измерение",note:"Демо-модель: параметры выбросов условные, фон 12–18 мкг/м³"};
const json=(b)=>({statusCode:200,headers:{"content-type":"application/json; charset=utf-8","access-control-allow-origin":"*"},body:JSON.stringify({demo:DEMO,...b})});
module.exports={QM,LIMIT,PLANTS,getPlant,stacksOf,ctx,sensors,health,broken,anomalies,epicentres,grid,stackStatus,forecast,weather,met,aqi,METHOD,json};
