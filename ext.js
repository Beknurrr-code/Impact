// IMPACT v6: ИИ-помощник, Сравнение, Прогноз 48 ч, Календарь, Инциденты
(function(){const $=id=>document.getElementById(id),pidNow=()=>($('plant')&&$('plant').value)||localStorage.impactPlant||'astana-tec2',pname=()=>{const s=$('plant');return s&&s.selectedOptions[0]?s.selectedOptions[0].text:''};
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LS=(k,v)=>v===undefined?JSON.parse(localStorage[k]||'[]'):(localStorage[k]=JSON.stringify(v));
// --- помощник
const CH=['Почему превышение?','Какой источник?','Что делать при НМУ?','Подготовь отчёт','Советы по снижению','Состояние датчиков','Прогноз'];
function ask(n,q){const log=$('clog'+n);log.insertAdjacentHTML('beforeend','<div class="msg u">'+esc(q)+'</div>');const m=document.createElement('div');m.className='msg a';m.textContent='Считаю по данным площадки…';log.appendChild(m);log.scrollTop=1e6;
 fetch('api/assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({q,plant:pidNow(),mode:localStorage.impactMode||'real',city:localStorage.impactCity})}).then(r=>r.json()).then(j=>{m.innerHTML=esc(j.answer)+(j.plant?'<small>'+esc(j.plant)+'</small>':'');log.scrollTop=1e6}).catch(()=>m.textContent='API недоступен')}
const CHR=['Где хуже всего?','Темиртау сейчас','Прогноз Павлодар','Ветер в Астане','Что с SO₂?'];
function setChips(){const real=(localStorage.impactMode||'real')==='real';[1,2].forEach(n=>{$('chips'+n).innerHTML=(real?CHR:CH).map(c=>'<button type="button">'+c+'</button>').join('');$('cq'+n).placeholder=real?'Например: где сейчас хуже всего?':'Например: почему превышение на СЗЗ?'})}
setChips();new MutationObserver(setChips).observe(document.body,{attributes:true,attributeFilter:['class']});
[1,2].forEach(n=>{$('chips'+n).onclick=e=>{if(e.target.tagName==='BUTTON')ask(n,e.target.textContent)};
 $('cform'+n).onsubmit=e=>{e.preventDefault();const i=$('cq'+n);if(i.value.trim()){ask(n,i.value.trim());i.value=''}}});
$('fab').onclick=()=>$('chatpop').classList.toggle('on');$('cpx').onclick=()=>$('chatpop').classList.remove('on');
// --- сравнение
let CMP=null;const COL={red:'#D9483B',yellow:'#C9A227',green:'#3FAE6A'},SN={red:'выше ПДК',yellow:'80–100% ПДК',green:'в норме'};
function loadCmp(){const pid=pidNow();fetch('api/compare?plant='+pid).then(r=>r.json()).then(j=>{CMP=j;$('cmpnote').textContent=j.note;
 $('cmp').innerHTML=j.rows.map((r,ri)=>{const mx=Math.max(r.fact,r.norm,r.bench)*1.1,b=(v,c)=>'<div class="b"><span style="width:'+(100*v/mx).toFixed(1)+'%;background:'+c+'"></span><em>'+v+'</em></div>';
  return '<div class="cmpr"><div><b style="font-size:18px">'+r.name+'</b><div class="muted small">'+r.unit+'</div><div style="margin:6px 0"><span class="st2 '+r.status+'">'+SN[r.status]+'</span></div><div class="small">к ПДК: <b style="color:'+COL[r.status]+'">'+(r.devNorm>0?'+':'')+r.devNorm+'%</b><br>к бенчмарку: <b>'+(r.gapBench>0?'+':'')+r.gapBench+'%</b></div></div>'+
  '<div class="bars">'+b(r.fact,'var(--acc)')+b(r.norm,'#D9483B')+b(r.bench,'#3FAE6A')+'<div class="muted small">Бенчмарк: '+esc(r.benchSrc)+'</div></div>'+
  '<div>'+r.tips.map((t,ti)=>'<div class="tip"><span>'+esc(t.tip)+' · <b>−'+t.reduction+'</b><span class="demo">'+t.label+'</span></span><button class="btn" data-r="'+ri+'" data-t="'+ti+'">Принять</button></div>').join('')+'</div></div>'}).join('')})}
$('cmp').onclick=e=>{const b=e.target.closest('button[data-t]');if(!b||!CMP)return;const r=CMP.rows[b.dataset.r],t=r.tips[b.dataset.t],L=LS('impactMeasures');
 L.unshift({ts:new Date().toLocaleString('ru'),plant:CMP.plant,pol:r.name,tip:t.tip,red:t.reduction,status:'Принята'});LS('impactMeasures',L);b.textContent='✓ Принято';b.disabled=true;rMeas()};
function rMeas(){const L=LS('impactMeasures');$('measures').innerHTML=L.map(m=>'<div class="row"><span><b>'+esc(m.pol)+'</b> · '+esc(m.tip)+' (−'+esc(m.red)+')<br><span class="muted small">'+esc(m.plant)+' · '+esc(m.ts)+'</span></span><span>'+esc(m.status)+'</span></div>').join('')||'<span class="muted">Пока нет принятых мер — нажмите «Принять» у совета.</span>'}
// --- прогноз 48 ч
let FC=null;function loadFc(){fetch('api/forecast?plant='+pidNow()).then(r=>r.json()).then(j=>{FC=j;drawFc()})}
function hours(){if(!FC)return[];const d=FC.days,base=(d[0]&&d[0].pm25)||20,out=[];for(let h=0;h<48;h++){const day=d[Math.min(2,Math.floor(h/24))]||d[0],w=Math.max(2,day.wind*(0.7+0.3*Math.sin((h%24-14)/24*2*Math.PI)));
 const night=(h%24<7||h%24>20)?1.35:1,v=Math.max(0,Math.min(100,(9/w)*night*(day.tmax<-10?1.2:1)*base/55*60));out.push({h,v:+v.toFixed(0),w:+w.toFixed(1)})}return out}
function drawFc(){const c=$('fc48');if(!c||!c.clientWidth||!FC)return;const H=hours(),cs=getComputedStyle(document.documentElement),fg=cs.getPropertyValue('--fg'),x=c.getContext('2d'),W=c.width=c.clientWidth*2,Hh=c.height=480;
 x.clearRect(0,0,W,Hh);const bw=W/48;H.forEach(o=>{x.fillStyle=o.v>=66?'#D9483B':o.v>=40?'#E6C34A':'#3FAE6A';const bh=o.v/100*(Hh-60);x.fillRect(o.h*bw+2,Hh-30-bh,bw-4,bh)});
 x.fillStyle=fg;x.globalAlpha=.6;x.font='22px Inter';const now=new Date();for(let h=0;h<48;h+=6){const t=new Date(now.getTime()+h*36e5);x.fillText(t.getHours()+':00',h*bw+2,Hh-4)}x.fillText('индекс риска 0–100',8,26);x.globalAlpha=1;
 const win=[];let cur=null;H.forEach(o=>{if(o.v>=40){if(!cur)cur={s:o.h,e:o.h,m:o.v};cur.e=o.h;cur.m=Math.max(cur.m,o.v)}else if(cur){win.push(cur);cur=null}});if(cur)win.push(cur);
 const f=h=>new Date(now.getTime()+h*36e5).toLocaleString('ru',{weekday:'short',hour:'2-digit',minute:'2-digit'});
 $('fcwin').innerHTML=win.map(w=>'<div class="row"><span><b>'+f(w.s)+' – '+f(w.e+1)+'</b> · пик индекса '+w.m+' — '+(w.m>=66?'перенести продувки, снизить нагрузку, предупредить смену':'усилить контроль на датчиках СЗЗ')+'</span><span class="st2 '+(w.m>=66?'red':'yellow')+'">'+(w.m>=66?'высокий':'повышенный')+'</span></div>').join('')||'<span class="muted">Опасных окон в ближайшие 48 ч нет.</span>'}
// --- календарь
function rCal(){const now=new Date(),y=now.getFullYear(),D=(m,d)=>new Date(y,m,d),nx=(dt)=>dt<new Date(now.toDateString())?new Date(dt.getFullYear()+1,dt.getMonth(),dt.getDate()):dt;
 const items=[[D(now.getMonth(),now.getDate()+3),'Поверка датчиков PM (2 шт.)','Метрологическая служба'],[D(now.getMonth(),now.getDate()+12),'Поверка газоанализаторов SO₂/NO₂ на трубах №1–2','Метрологическая служба'],
  [D(9,25),'Ежеквартальный отчёт ПЭК (производственный экологический контроль)','Департамент экологии'],[D(now.getMonth(),now.getDate()-2),'Передача данных АСМ за неделю','Национальная система мониторинга'],
  [D(11,1),'Плата за эмиссии — квартальная декларация','Налоговый орган'],[D(0,15),'План мероприятий по охране окружающей среды — отчёт за год','Департамент экологии'],[D(2,1),'Годовой отчёт ПЭК','Департамент экологии'],[D(now.getMonth()+1,10),'Поверка метеостанции площадки','Метрологическая служба']];
 const done=LS('impactCalDone');$('cal').innerHTML=items.map(([dt,w,to],i)=>{const k=w.slice(0,40),isD=done.includes(k),left=Math.round((dt-new Date(now.toDateString()))/864e5),st=isD?'green':left<0?'red':left<=7?'yellow':'green',lbl=isD?'Сдано':left<0?'Просрочено':left<=7?'Скоро':'В плане';
  return '<tr><td>'+dt.toLocaleDateString('ru')+'</td><td>'+esc(w)+'</td><td class="muted">'+to+'</td><td>'+(isD?'—':left<0?Math.abs(left)+' дн. назад':left+' дн.')+'</td><td><span class="st2 '+st+'">'+lbl+'</span> '+(isD?'':'<button class="btn" data-k="'+esc(k)+'">Сдано</button>')+'</td></tr>'}).join('')}
$('cal').onclick=e=>{const b=e.target.closest('button[data-k]');if(!b)return;const d=LS('impactCalDone');d.push(b.dataset.k);LS('impactCalDone',d);rCal()};
// --- инциденты
function rInc(){const L=LS('impactIncidents');$('inc').innerHTML=L.map((x,i)=>'<tr><td>'+esc(x.ts)+'</td><td class="muted">'+esc(x.plant)+'</td><td>'+esc(x.what)+(x.src?' · <b>'+esc(x.src)+'</b>':'')+'</td><td>'+esc(x.who)+'</td><td><span class="st2 '+(x.closed?'green':'red')+'">'+(x.closed?'Закрыт':'Открыт')+'</span></td><td>'+(x.closed?esc(x.closed):'—')+'</td><td>'+(x.closed?'':'<button class="btn" data-i="'+i+'">Закрыть</button>')+'</td></tr>').join('')||'<tr><td colspan="7" class="muted">Инцидентов нет</td></tr>'}
$('incf').onsubmit=e=>{e.preventDefault();const L=LS('impactIncidents');L.unshift({ts:new Date().toLocaleString('ru'),plant:pname(),what:$('i_what').value,src:$('i_src').value,who:$('i_who').value,closed:null});LS('impactIncidents',L);e.target.reset();rInc()};
$('inc').onclick=e=>{const b=e.target.closest('button[data-i]');if(!b)return;e.stopPropagation();const L=LS('impactIncidents');L[b.dataset.i].closed=new Date().toLocaleString('ru');LS('impactIncidents',L);rInc()};
if(!localStorage.impactIncidents)LS('impactIncidents',[{ts:new Date(Date.now()-864e5).toLocaleString('ru'),plant:'ТЭЦ №2, Астана',what:'Залипание показаний датчика',src:'AST-05',who:'Инженер КИПиА',closed:new Date(Date.now()-3e7).toLocaleString('ru')},{ts:new Date(Date.now()-36e5).toLocaleString('ru'),plant:'Металлургический комбинат, Темиртау',what:'Превышение PM2.5 на границе СЗЗ',src:'TEM-02 · Труба №4',who:'Эколог смены',closed:null}]);
// --- маршрутизация
function onRoute(){const r=(location.hash||'#overview').slice(1);document.body.className=document.body.className.replace(/\br-\S+/g,'').trim()+' r-'+r;
 if(r==='compare')loadCmp();if(r==='forecast')(FC?setTimeout(drawFc,60):loadFc());if(r==='calendar')rCal();if(r==='incidents')rInc()}
addEventListener('hashchange',onRoute);addEventListener('resize',(window.IMPACT_deb||(f=>f))(drawFc));$('plant')&&$('plant').addEventListener('change',()=>{FC=null;CMP=null;onRoute()});
new MutationObserver(drawFc).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
rMeas();rInc();rCal();onRoute();})();
