// Сравнение: факт (демо) vs ПДК vs бенчмарк (лучшее среди 7 демо-площадок и лучший собственный день)
const d=require("./_data");
const POLS=[{k:"pm25",n:"PM2.5",u:"мкг/м³",norm:35},{k:"pm10",n:"PM10",u:"мкг/м³",norm:60},{k:"so2",n:"SO₂",u:"мкг/м³",norm:50},{k:"no2",n:"NO₂",u:"мкг/м³",norm:40},{k:"co",n:"CO",u:"мкг/м³",norm:3000}];
// условные коэффициенты к PM2.5 по типу площадки (демо)
const F={tec:{pm25:1,pm10:1.9,so2:1.5,no2:1.05,co:60},steel:{pm25:1,pm10:2.2,so2:1.1,no2:0.8,co:110},gres:{pm25:1,pm10:2.0,so2:1.9,no2:1.2,co:55},al:{pm25:1,pm10:1.7,so2:0.9,no2:0.6,co:70},zinc:{pm25:1,pm10:1.6,so2:2.1,no2:0.55,co:50}};
const typ=id=>/steel/.test(id)?"steel":/gres/.test(id)?"gres":/-al/.test(id)?"al":/zinc/.test(id)?"zinc":"tec";
const TIPS={pm25:[["Электрофильтры / замена на рукавные фильтры","до 60%"],["Ремонт и уплотнение газоходов, контроль подсосов","10–15%"]],
 pm10:[["Пылеподавление (орошение) складов угля и шлака","30–50%"],["Укрытие конвейеров и узлов пересыпки","20–30%"]],
 so2:[["Сероочистка (мокрая известняковая / полусухая)","70–90%"],["Переход на малосернистый уголь","20–40%"]],
 no2:[["Малотоксичные горелки (low-NOx), ступенчатое сжигание","30–50%"],["СНКВ — впрыск карбамида/аммиака","40–60%"]],
 co:[["Режимная наладка горения, контроль избытка воздуха","20–40%"],["Автоматика регулирования горения","10–25%"]]};
function okSensors(l){const bad=new Set(d.broken(l).map(b=>b.id));return l.filter(s=>!bad.has(s.id));}
function dayMeans(l){const ok=okSensors(l),out=[];for(let k=0;k<3;k++){out.push(+Math.max(...ok.map(x=>x.series.slice(k*24,k*24+24).reduce((a,b)=>a+b,0)/24)).toFixed(1));}return out;}
async function plantVals(p){const {l}=await d.ctx({queryStringParameters:{plant:p.id}});const dm=dayMeans(l),f=F[typ(p.id)];
 const v={},best={};POLS.forEach(o=>{v[o.k]=+(dm[2]*f[o.k]).toFixed(1);best[o.k]=+(Math.min(...dm)*f[o.k]).toFixed(1)});return {p,v,best,dm,l};}
async function compare(pid){const all=await Promise.all(d.PLANTS.map(plantVals)),me=all.find(x=>x.p.id===pid)||all[0];
 const rows=POLS.map(o=>{const fact=me.v[o.k],peer=all.reduce((a,x)=>x.v[o.k]<a.v?{v:x.v[o.k],n:x.p.name}:a,{v:1e9,n:""});
  const bench=Math.min(peer.v,me.best[o.k]),dev=Math.round(100*(fact-o.norm)/o.norm),gap=Math.round(100*(fact-bench)/Math.max(bench,.1));
  const status=fact>o.norm?"red":fact>0.8*o.norm?"yellow":"green";
  return {key:o.k,name:o.n,unit:o.u,fact,norm:o.norm,bench:+bench.toFixed(1),benchSrc:peer.v<=me.best[o.k]?"лучшая площадка: "+peer.n:"лучший собственный день площадки",devNorm:dev,gapBench:gap,status,
   tips:TIPS[o.k].map(([t,r])=>({tip:t,reduction:r,label:"оценка"}))};});
 return {plant:me.p.name,id:me.p.id,rows,note:"Факт — максимальное среднесуточное значение (последние 24 ч, демо) среди исправных датчиков СЗЗ; ПДК — среднесуточная; прочие вещества — условный пересчёт от PM2.5 по типу площадки (демо).",me};}
module.exports={compare,POLS};
