const d=require("./_data");
async function statusOf(p){const {w,M,l}=await d.ctx({queryStringParameters:{plant:p.id}});const e=d.epicentres(p,l,M),bad=new Set(d.broken(l).map(b=>b.id)),ok=l.filter(s=>!bad.has(s.id));
 const mx=Math.max(...ok.map(s=>Math.max(s.pm25,s.model))),f=await d.forecast(p,w,l),nmu=f.riskIndicator.level==="высокий";
 const status=e.length?"red":(mx>=0.8*d.LIMIT||nmu)?"yellow":"green";
 return {id:p.id,name:p.name,city:p.city,lat:p.lat,lon:p.lon,exceedances:e.length,attributed:e.filter(x=>x.confidence>0).length,maxPm25:+mx.toFixed(1),nmuRisk:f.riskIndicator.level,status,stability:M.cls,wind:M.dir,
  rule:"красный — превышение на датчике СЗЗ; жёлтый — значение 80–100% норматива или высокий риск НМУ; зелёный — иначе"};}
exports.handler=async()=>d.json({plants:await Promise.all(d.PLANTS.map(statusOf)),note:"Координаты площадок приблизительные, названия обобщённые"});
