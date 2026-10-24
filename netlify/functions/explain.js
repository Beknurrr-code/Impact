// Цифры считает код; ИИ (LLM) пишет только резюме по этим цифрам; эколог утверждает.
const d=require("./_data");
exports.handler=async(ev)=>{const {p,w,M,l}=await d.ctx(ev),e=d.epicentres(p,l,M),a=d.anomalies(l),h=d.health(l),f=await d.forecast(p,w,l);const bad=h.filter(x=>x.status!=="Online");
 const numbers={plant:p.name,meanPm25:a.meanPm25,aqi:d.aqi(a.meanPm25),exceedances:e.length,topSource:e[0]?e[0].likelySource:null,topConfidence:e[0]?e[0].confidence:null,stability:M.cls,
  sensorsTotal:h.length,sensorsOnline:h.length-bad.length,completenessAvg:+(h.reduce((s,x)=>s+x.completeness,0)/h.length).toFixed(1),nmuRisk:f.riskIndicator.level,officialNmu:f.official.warnings.length};
 const pp=[`${p.name}: средний PM2.5 по исправным датчикам СЗЗ — ${numbers.meanPm25} мкг/м³ (AQI ${numbers.aqi}). Полнота данных — ${numbers.completenessAvg}%.`];
 pp.push(e[0]?`Превышений на границе СЗЗ: ${e.length}. ${e[0].id} (${e[0].sensors[0]}, ${e[0].maxPm25} мкг/м³): ${e[0].comment}.`:"Превышений на границе СЗЗ нет.");
 pp.push(`Здоровье данных: ${bad.map(x=>x.id+" — "+x.status).join("; ")||"все онлайн"}. Пропуски помечены, оценки по соседям в цифры отчёта не входят.`);
 pp.push(`Режим НМУ: официальных предупреждений Казгидромета ${numbers.officialNmu}; индикатор погодного риска — ${numbers.nmuRisk} (не официальный прогноз).`);
 return d.json({numbers,text:pp.join(" "),paragraphs:pp,method:"Цифры посчитаны кодом (гауссова модель). ИИ пишет только резюме. Отчёт действителен после утверждения экологом.",status:"черновик — ожидает утверждения экологом"});};
