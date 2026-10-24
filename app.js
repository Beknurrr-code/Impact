const $=id=>document.getElementById(id),J=u=>fetch(u).then(r=>r.json());
const STY={light:'https://tiles.openfreemap.org/styles/positron',dark:'https://tiles.openfreemap.org/styles/dark'};
const SCOL={green:'#3FAE6A',yellow:'#E6C34A',orange:'#E8833A',red:'#D9483B'},SNAME={green:'норма',yellow:'внимание',orange:'повышено',red:'превышение'};
const aqiColor=a=>a<=50?'#3FAE6A':a<=100?'#E6C34A':a<=150?'#E8833A':'#D9483B';
let theme=document.documentElement.dataset.theme,mode='2d',D=null,PL=[],pid=localStorage.impactPlant||'astana-tec2',flying=false,LOG=JSON.parse(localStorage.impactLog||'[]');
$('today').textContent=new Date().toLocaleDateString('ru',{day:'numeric',month:'short'});
(async()=>{const api=$('api'),t=performance.now();try{const r=await fetch('api/sensors');await r.json();api.textContent='● Данные · '+Math.round(performance.now()-t)+' мс';api.style.borderColor='#6FCF6A'}catch(e){api.textContent='● API недоступен';api.style.borderColor='#D9483B'}})();
// Карта создаётся лениво: только когда открыт раздел с ней в режиме «Пример завода»
const DPR=Math.min(devicePixelRatio||1,1.5),RMO=matchMedia('(prefers-reduced-motion: reduce)').matches;window.IMPACT_DPR=DPR;window.IMPACT_RM=RMO;
const deb=(f,ms=150)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}};window.IMPACT_deb=deb;
let _m=null;const _q=[];
const map=new Proxy({},{get(_,k){if(_m){const v=_m[k];return typeof v==='function'?v.bind(_m):v}
 if(k==='on'||k==='once'||k==='addControl')return(...a)=>{_q.push([k,a]);return map};if(k==='isStyleLoaded')return()=>false;if(k==='getBearing')return()=>0;return()=>undefined}});
function ensureMap(){if(_m)return;_m=new maplibregl.Map({container:'map',style:STY[theme],center:[73,51],zoom:5,pixelRatio:DPR,fadeDuration:0,attributionControl:{compact:true}});
 _m.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'bottom-right');_q.forEach(([k,a])=>_m[k](...a));_q.length=0;
 window.__smokeLive=false;new IntersectionObserver(e=>{window.__smokeLive=e[0].isIntersecting;if(window.__smokeLive)_m.triggerRepaint()}).observe($('mapbox'));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)_m.triggerRepaint()});
 if(D)rebuild();}
let threeP=null;function loadThree(){return threeP||(threeP=new Promise(r=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';s.onload=r;s.onerror=r;document.head.appendChild(s)}))}
async function load(id){const q='?plant='+id,[s,e,b,f,a,g]=await Promise.all(['sensors','epicentres','broken','forecast','anomalies','grid'].map(x=>J('api/'+x+q)));return {s,e,b,f,a,g,P:s.plant}}
const fc=f=>({type:'FeatureCollection',features:f}),pt=(lon,lat,p)=>({type:'Feature',geometry:{type:'Point',coordinates:[lon,lat]},properties:p});
function addAll(){
 const dk=theme==='dark';
 try{map.addLayer({id:'b3d',type:'fill-extrusion',source:'openmaptiles','source-layer':'building',minzoom:12,paint:{'fill-extrusion-color':dk?'#2A2C33':'#DCD6CE','fill-extrusion-height':['coalesce',['get','render_height'],10],'fill-extrusion-base':['coalesce',['get','render_min_height'],0],'fill-extrusion-opacity':.85}})}catch(e){}
 map.addSource('plants',{type:'geojson',data:fc(PL.map(p=>pt(p.lon,p.lat,{id:p.id,n:p.name,c:SCOL[p.status],s:SNAME[p.status]})))});
 map.addLayer({id:'plants',type:'circle',source:'plants',paint:{'circle-radius':['interpolate',['linear'],['zoom'],4,8,12,14],'circle-color':['get','c'],'circle-stroke-color':'#fff','circle-stroke-width':2}});
 map.addLayer({id:'plants-l',type:'symbol',source:'plants',maxzoom:13,layout:{'text-field':['get','n'],'text-size':12,'text-offset':[0,1.5],'text-font':['Noto Sans Regular']},paint:{'text-color':dk?'#fff':'#1A1A1A','text-halo-color':dk?'#0B0B0F':'#F5EFEB','text-halo-width':2}});
 if(!D)return;const P=D.P,bad=new Set(D.b.broken.map(x=>x.id));
 map.addSource('field',{type:'geojson',data:fc(D.g.grid.map(g=>pt(g.ll[0],g.ll[1],{c:g.c})))});
 map.addLayer({id:'field',type:'heatmap',source:'field',paint:{'heatmap-weight':['interpolate',['linear'],['get','c'],0,0,15,1],'heatmap-radius':['interpolate',['exponential',2],['zoom'],10,14,16,320],'heatmap-opacity':.85,'heatmap-intensity':1.4,
  'heatmap-color':['interpolate',['linear'],['heatmap-density'],0,'rgba(0,0,0,0)',.15,'#3FAE6A',.45,'#E6C34A',.7,'#E8833A',.9,'#D9483B']}},map.getLayer('b3d')?'b3d':undefined);
 map.addSource('sens',{type:'geojson',data:fc(D.s.sensors.map(s=>pt(s.lon,s.lat,{id:s.id,pm:s.pm25,mod:s.model,bad:bad.has(s.id),c:bad.has(s.id)?'#8A8A86':aqiColor(s.aqi)})))});
 map.addLayer({id:'pts',type:'circle',source:'sens',paint:{'circle-radius':7,'circle-color':['get','c'],'circle-stroke-color':'#fff','circle-stroke-width':2}});
 map.addLayer({id:'broken',type:'circle',source:'sens',filter:['get','bad'],paint:{'circle-radius':12,'circle-color':'rgba(0,0,0,0)','circle-stroke-color':'#8A8A86','circle-stroke-width':2}});
 map.addLayer({id:'src-lbl',type:'symbol',source:'sens',minzoom:13,layout:{'text-field':['concat',['get','id'],' · ',['to-string',['get','pm']]],'text-size':11,'text-offset':[0,1.4],'text-font':['Noto Sans Regular']},paint:{'text-color':dk?'#fff':'#1A1A1A','text-halo-color':dk?'#0B0B0F':'#F5EFEB','text-halo-width':2}});
 const pst=(PL.find(p=>p.id===pid)||{}).status||'green';
 map.addSource('plant',{type:'geojson',data:plantFeatures(P,D.g.stacks,pst)});
 map.addLayer({id:'plant',type:'fill-extrusion',source:'plant',paint:{'fill-extrusion-color':['get','c'],'fill-extrusion-height':['get','h'],'fill-extrusion-base':['get','b'],'fill-extrusion-opacity':1,'fill-extrusion-vertical-gradient':true}});
 if(window.THREE)map.addLayer(smokeLayer(P,D.g.stacks,()=>D.f.wind));
 map.setLight({anchor:'map',position:[1.4,210,35],intensity:dk?.35:.5});
 vis();
}
function vis(){const on3=mode==='3d';const set=(l,v)=>map.getLayer(l)&&map.setLayoutProperty(l,'visibility',v?'visible':'none');
 document.querySelectorAll('[data-l]').forEach(i=>i.dataset.l.split(',').forEach(l=>set(l,i.checked&&(l!=='smoke'&&l!=='b3d'||on3))));set('plant',on3||mode==='2d');}
const pop=new maplibregl.Popup({closeButton:false,closeOnClick:false});
map.on('mousemove','plant',e=>{const p=e.features[0].properties;pop.setLngLat(e.lngLat).setHTML('<b>'+p.name+'</b><br>Высота: '+(p.hgt||p.h)+' м<br>Статус: '+p.st).addTo(map)});map.on('mouseleave','plant',()=>pop.remove());
map.on('click','plants',e=>selectPlant(e.features[0].properties.id,true));
map.on('click','pts',e=>{const p=e.features[0].properties;new maplibregl.Popup().setLngLat(e.lngLat).setHTML('<b>'+p.id+'</b><br>Измерено: '+p.pm+' мкг/м³<br>Модель: '+p.mod+' мкг/м³'+(String(p.bad)==='true'?'<br>⚠ сбой данных':'')).addTo(map)});
map.on('style.load',()=>{addAll()});
function rebuild(){if(!map.isStyleLoaded())return;['smoke','plant','src-lbl','broken','pts','field','plants-l','plants','b3d'].forEach(l=>map.getLayer(l)&&map.removeLayer(l));['plant','sens','field','plants'].forEach(s=>map.getSource(s)&&map.removeSource(s));addAll()}
function camera(){const P=D&&D.P;if(mode==='all'||!P)map.flyTo({center:[75,50.8],zoom:5.2,pitch:0,bearing:0});else if(mode==='3d')map.flyTo({center:[P.lon,P.lat],zoom:15.6,pitch:60,bearing:-35,duration:2200});else map.flyTo({center:[P.lon,P.lat],zoom:13,pitch:0,bearing:0})}
function setMode(m){mode=m;if(m==='3d'&&!window.THREE)loadThree().then(rebuild);['bov','b2','b3'].forEach(b=>$(b).classList.toggle('on',(b==='bov'&&m==='all')||(b==='b2'&&m==='2d')||(b==='b3'&&m==='3d')));vis();camera()}
$('bov').onclick=()=>setMode('all');$('b2').onclick=()=>setMode('2d');$('b3').onclick=()=>setMode('3d');
document.querySelectorAll('[data-l]').forEach(i=>i.onchange=vis);
$('fly').onclick=()=>{if(mode!=='3d')setMode('3d');flying=!flying;$('fly').textContent=flying?'■ Стоп':'↻ Облёт';const st=()=>{if(!flying)return;if(document.hidden||!window.__smokeLive)return setTimeout(st,1000);map.rotateTo((map.getBearing()+40)%360,{duration:3000,easing:t=>t});setTimeout(st,2950)};setTimeout(st,2300)};
const tb=$('theme'),ic=()=>tb.textContent=theme==='dark'?'☀':'☾';ic();
tb.onclick=()=>{theme=theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;localStorage.impactTheme=theme;ic();map.setStyle(STY[theme],{diff:false});chart()};
function rl(){$('log').innerHTML=LOG.length?LOG.slice(-8).reverse().map(l=>'<div>'+l+'</div>').join(''):'пока пусто'}
const addLog=m=>{LOG.push(new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})+' — '+m);localStorage.impactLog=JSON.stringify(LOG);rl()};
async function selectPlant(id,fly){pid=id;localStorage.impactPlant=id;$('plant').value=id;D=await load(id);fill();rebuild();if(fly){if(mode==='all')mode='3d';setMode(mode)}}
function fill(){const H=D.b.health,on=H.filter(h=>h.status==='Online').length,P=D.P,E=D.e.epicentres;
 $('pname').textContent=P.name;$('avp').textContent=P.name;
 $('k0').textContent=on+' / '+H.length;$('k4').textContent=D.b.completenessAvg+'%';$('k1').textContent=D.a.meanPm25;$('k2').textContent=E.length;$('k5').textContent=E.filter(e=>e.confidence).length;$('k6').textContent=D.s.met.cls;
 const alerts=[...E.map(e=>({c:'#D9483B',t:'Превышение '+e.maxPm25+' мкг/м³ на '+e.sensors[0]+' · '+e.likelySource})),...D.b.broken.map(b=>({c:'#8A8A86',t:b.id+': '+b.status+' — '+b.note})),...D.a.anomalies.map(a=>({c:'#E8833A',t:'Аномалия '+a.id+' · z '+a.z}))];
 $('bellc').textContent=alerts.length;$('feed').innerHTML=alerts.map(a=>'<div><span class="dot" style="background:'+a.c+'"></span>'+a.t+'<div class="t">сейчас · '+P.name+'</div></div>').join('')||'<div class="muted">событий нет</div>';
 $('plist').innerHTML=PL.map(p=>'<tr data-id="'+p.id+'"><td><b>'+p.name+'</b></td><td>'+p.city+'</td><td><span class="dot" style="background:'+SCOL[p.status]+'"></span>'+SNAME[p.status]+'</td><td>'+p.stability+'</td><td>'+p.exceedances+'</td><td>→</td></tr>').join('');
 document.querySelectorAll('#plist tr').forEach(r=>r.onclick=()=>{selectPlant(r.dataset.id,true);location.hash='#map'});
 $('compl').textContent='полнота '+D.b.completenessAvg+'%';
 const sm=Object.fromEntries(D.s.sensors.map(s=>[s.id,s]));
 $('brk').innerHTML=[...H].sort((a,b)=>(a.status==='Online')-(b.status==='Online')).map(h=>'<tr><td><b>'+h.id+'</b></td><td><span class="st '+h.status+'">'+h.status+'</span></td><td>'+h.completeness+'%</td><td>'+sm[h.id].pm25+'</td><td class="muted">'+sm[h.id].model+'</td><td class="muted">'+h.note+'</td></tr>').join('');
 $('anoms').innerHTML=D.a.anomalies.map(a=>'<div class="row"><span><b>'+a.id+'</b> · '+a.note+'</span><span>z '+a.z+'</span></div>').join('')||'<span class="muted">нет</span>';
 $('epis').innerHTML=E.map(e=>'<div class="row"><span><b>'+e.id+' · '+e.sensors[0]+'</b> — измерено '+e.maxPm25+', модель '+e.modelPm25+' мкг/м³ · ветер с '+e.sector+' '+e.direction+'°, класс '+e.stability+'<br>'+e.candidates.map(c=>c.name.split(' · ')[1]+' <b>'+c.share+'%</b><span class="bar" style="width:'+c.share+'px"></span>').join(' &nbsp; ')+'</span><span>уверенность<br><b>'+e.confidence+'%</b></span></div>').join('')||'<span class="muted">Превышений на границе СЗЗ нет</span>';
 $('stk').innerHTML=D.g.stacks.map(s=>'<tr><td>'+s.id+'</td><td>'+s.h+' м</td><td>'+s.Q+'</td><td>'+s.maxGroundUg+' мкг/м³</td><td><span class="dot" style="background:'+SCOL[s.status]+'"></span>'+SNAME[s.status]+'</td></tr>').join('');
 const M=D.e.method,mt=D.s.met;$('how').innerHTML='<p><code>'+M.formula+'</code></p><p>'+M.sigma+'. Сейчас: ветер '+mt.u.toFixed(1)+' м/с с '+Math.round(mt.dir)+'°, облачность '+mt.cloud+'%, '+(mt.isDay?'день':'ночь')+' → класс <b>'+mt.cls+'</b>, Ta = '+mt.Ta.toFixed(1)+' K.</p><p>'+M.attribution+'.</p><p class="muted">'+M.note+'.</p>';
 $('nmuoff').innerHTML='<b>Официально (Казгидромет):</b> '+(D.f.official.warnings.length?D.f.official.warnings.join('; '):D.f.official.note);$('fsrc').textContent=D.f.source;
 $('days').innerHTML=D.f.days.map(d=>'<div class="day">'+new Date(d.date).toLocaleDateString('ru',{weekday:'short',day:'numeric'})+'<br>риск: <span class="risk">'+d.risk+'</span><br><span class="muted">'+d.wind+' км/ч · '+d.tmin+'…'+d.tmax+'°</span></div>').join('');
 $('chk').innerHTML='';D.f.checklist.forEach(c=>{const l=document.createElement('label');l.innerHTML='<input type="checkbox"> '+c;l.querySelector('input').onchange=e=>addLog((e.target.checked?'✓ ':'✗ ')+c+' · '+P.name);$('chk').appendChild(l)});rl();
 J('api/explain?plant='+pid).then(j=>{$('report').textContent='IMPACT · '+P.name+' · '+new Date().toLocaleString('ru')+'\n\n'+j.text+'\n\n'+j.method+'';$('rstat').textContent=j.status});
 chart();}
$('appr').onclick=()=>{$('rstat').innerHTML='<b style="color:var(--acc)">Утверждено экологом</b> · '+new Date().toLocaleString('ru');addLog('Отчёт утверждён · '+(D&&D.P.name))};
function chart(){if(!D)return;const c=$('chart');if(!c.clientWidth)return;const bad=new Set(D.b.broken.map(x=>x.id)),ok=D.s.sensors.filter(s=>!bad.has(s.id)),avg=[...Array(72)].map((_,h)=>ok.reduce((a,s)=>a+s.series[h],0)/ok.length);
 const cs=getComputedStyle(document.documentElement),fg=cs.getPropertyValue('--fg'),acc=cs.getPropertyValue('--acc'),x=c.getContext('2d'),W=c.width=c.clientWidth*2,Hh=c.height=440,mx=Math.max(...avg)*1.15;
 x.clearRect(0,0,W,Hh);x.globalAlpha=.15;x.strokeStyle=fg;for(let i=1;i<4;i++){x.beginPath();x.moveTo(0,Hh*i/4);x.lineTo(W,Hh*i/4);x.stroke()}x.globalAlpha=1;
 x.strokeStyle=fg;x.lineWidth=3;x.beginPath();avg.forEach((v,i)=>{const px=i/71*W,py=Hh-v/mx*Hh;i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();
 x.setLineDash([12,10]);x.strokeStyle=acc;x.beginPath();for(let i=30;i<=41;i++){const px=i/71*W,py=Hh-avg[i]*.9/mx*Hh;i>30?x.lineTo(px,py):x.moveTo(px,py)}x.stroke();x.setLineDash([]);
 x.fillStyle=fg;x.globalAlpha=.6;x.font='22px Inter';x.fillText(Math.round(mx)+' мкг/м³',8,28);x.fillText('−72 ч',8,Hh-10);x.fillText('сейчас',W-84,Hh-10);x.globalAlpha=1}
addEventListener('resize',deb(chart));
function route(){const r=(location.hash||'#overview').slice(1);document.querySelectorAll('.pg').forEach(p=>p.classList.toggle('on',p.id==='p-'+r));document.querySelectorAll('.sb a[data-r]').forEach(a=>a.classList.toggle('on',a.dataset.r===r));
 if(r!=='map'&&flying)$('fly').click();const slot=r==='map'?$('slot-map'):$('slot-ov');slot.appendChild($('mapbox'));if(DEMO_ON&&(r==='map'||r==='overview'))ensureMap();setTimeout(()=>{map.resize();chart()},50)}
let DEMO_ON=false;addEventListener('hashchange',route);route();
$('bell').onclick=()=>location.hash='#overview';
window.startDemo=()=>{if(DEMO_ON)return;DEMO_ON=true;route();(async()=>{PL=(await J('api/plants')).plants;$('plant').innerHTML=PL.map(p=>'<option value="'+p.id+'">'+p.name+'</option>').join('');$('plant').onchange=e=>selectPlant(e.target.value,true);
 if(!PL.find(p=>p.id===pid))pid=PL[0].id;await selectPlant(pid,false);setMode('2d')})();};
