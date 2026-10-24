// ИИ-помощник: отвечает ТОЛЬКО по данным кабинета (демо). Без ключа LLM — правило-ориентированный ответчик по интентам.
const d=require("./_data"),c=require("./_cmp");
const TAG="По данным кабинета.";
function intent(q){q=(q||"").toLowerCase();
 if(/нму|неблагоприят|метеоусл/.test(q))return"nmu";if(/источник|откуда|труб|дует|виноват/.test(q))return"source";
 if(/отч[её]т|резюме|руковод/.test(q))return"report";if(/совет|улучш|снизить|меры|фильтр|как уменьш/.test(q))return"tips";
 if(/датчик|сбой|offline|полнот|здоров/.test(q))return"sensors";if(/почему|превыш|выше нормы|красн/.test(q))return"why";
 if(/прогноз|завтра|48/.test(q))return"forecast";return"summary";}
async function answer(pid,q){const {p,w,M,l}=await d.ctx({queryStringParameters:{plant:pid}});const E=d.epicentres(p,l,M),H=d.health(l),bad=H.filter(h=>h.status!=="Online"),f=await d.forecast(p,w,l),st=d.stackStatus(p,M).sort((a,b)=>b.maxGroundUg-a.maxGroundUg),cmp=await c.compare(p.id);
 const it=intent(q),L=[],wind=`ветер ${M.u.toFixed(1)} м/с с ${Math.round(M.dir)}°, класс устойчивости ${M.cls}`;
 const top=E[0],srcName=top&&top.candidates[0]?top.candidates[0].name.split(" · ")[1]:st[0].id;
 if(it==="why"){if(!E.length)L.push(`На границе СЗЗ ${p.name} превышений PM2.5 (>${d.LIMIT} мкг/м³) сейчас нет. Максимум даёт ${st[0].id} — ${st[0].maxGroundUg} мкг/м³ у земли по модели.`);
  else{L.push(`Превышений на границе СЗЗ: ${E.length}.`);E.slice(0,3).forEach(e=>L.push(`• ${e.sensors[0]}: ${e.maxPm25} мкг/м³ (модель ${e.modelPm25}). Вклад: ${e.candidates.map(x=>x.name.split(" · ")[1]+" "+x.share+"%").join(", ")}; уверенность ${e.confidence}%.`));
   L.push(`Причина по модели: ${wind} — факел сносит на сектор ${top.sector}. ${/[A-C]/.test(M.cls)?'При неустойчивых классах A–C факел быстро опускается к земле рядом с СЗЗ.':'При устойчивых классах E–F рассеяние слабое, примесь копится у земли.'}`);}}
 else if(it==="source"){if(top)L.push(`Наиболее вероятный источник — ${srcName} (${top.candidates[0].share}% вклада на датчике ${top.sensors[0]}, уверенность ${top.confidence}%). ${wind}.`);
  L.push("Трубы площадки: "+st.map(s=>`${s.id} (h=${s.h} м, Q=${s.Q} г/с)`).join("; ")+".");}
 else if(it==="nmu"){L.push(`Официальных предупреждений НМУ (Казгидромет): ${f.official.warnings.length}. Индикатор погодного риска: ${f.riskIndicator.level} (не официальный прогноз).`);
  L.push(`При НМУ: в первую очередь снизить нагрузку на ${srcName} (${top?'наибольший вклад на датчике '+top.sensors[0]+' — '+top.candidates[0].share+'%':'наибольший расчётный вклад у земли'}).`);f.checklist.forEach(x=>L.push("• "+x));
  L.push(`Усилить контроль на датчиках ${(top?top.sensors:[l[0].id]).join(", ")} и записать меры в журнал (раздел «Режим НМУ»).`);}
 else if(it==="report"){const a=d.anomalies(l);L.push(`Черновик отчёта — ${p.name}, ${new Date().toLocaleDateString("ru-RU")}:`);
  L.push(`1) Средний PM2.5 по исправным датчикам СЗЗ: ${a.meanPm25} мкг/м³. 2) Превышений: ${E.length}${top?` (макс. ${top.maxPm25} мкг/м³ на ${top.sensors[0]}, источник — ${srcName})`:""}. 3) Датчики: ${H.length-bad.length}/${H.length} онлайн; сбои: ${bad.map(b=>b.id+" "+b.status).join(", ")||"нет"}. 4) НМУ: риск ${f.riskIndicator.level}.`);
  L.push("Отчёт действителен после утверждения экологом. Полная версия — раздел «Отчёты», кнопка «Экспорт в PDF».");}
 else if(it==="tips"){const bad2=cmp.rows.filter(r=>r.status!=="green").sort((a,b)=>b.devNorm-a.devNorm);const list=bad2.length?bad2:cmp.rows.slice().sort((a,b)=>b.gapBench-a.gapBench).slice(0,2);
  L.push(bad2.length?"Вещества выше 80% ПДК — начинать с них:":"Всё в пределах ПДК; разрыв с бенчмарком больше всего у:");
  list.forEach(r=>L.push(`• ${r.name}: ${r.fact} ${r.unit} (ПДК ${r.norm}, ${r.devNorm>0?"+":""}${r.devNorm}%; бенчмарк ${r.bench}). Мера: ${r.tips[0].tip} — снижение ${r.tips[0].reduction} (гипотеза, демо).`));
  L.push(`Приоритетная труба для мер: ${srcName}.`);}
 else if(it==="sensors"){L.push(`Онлайн ${H.length-bad.length} из ${H.length} датчиков.`);bad.forEach(b=>L.push(`• ${b.id}: ${b.status} — ${b.note}.`));L.push("Данные сбойных датчиков в цифры отчёта не входят. Запланируйте поверку в «Календаре отчётности».");}
 else if(it==="forecast"){f.days.forEach(x=>L.push(`• ${x.date}: ветер до ${x.wind} км/ч, PM2.5 ≈ ${x.pm25} мкг/м³, риск ${x.risk} — ${x.advice}.`));}
 else{L.push(`${p.name}: превышений ${E.length}, датчиков онлайн ${H.length-bad.length}/${H.length}, риск НМУ ${f.riskIndicator.level}, ${wind}. Главная труба по вкладу — ${srcName}.`);L.push("Спросите: «почему превышение», «какой источник», «что делать при НМУ», «подготовь отчёт», «советы».");}
 return {intent:it,answer:L.join("\n"),plant:p.name,mode:"rule-based",demo:TAG};}
exports.handler=async(ev)=>{let q="",pid,mode,city;try{const b=ev.body?JSON.parse(ev.body):{};q=b.q||"";pid=b.plant;mode=b.mode;city=b.city}catch(e){}
 const qs=ev.queryStringParameters||{};q=q||qs.q||"";pid=pid||qs.plant;mode=mode||qs.mode;if(mode==="real"){try{return d.json(await require("./_real").answer(q,city||qs.city))}catch(e){return d.json({answer:"Реальные данные временно недоступны: "+e.message,demo:"Реальные открытые данные",plant:""})}}const r=await answer(pid,q);return d.json(r);};
