const STYLE='https://tiles.openfreemap.org/styles/dark';
const C=[[50,'#6FCF6A'],[100,'#C9F05C'],[150,'#F2C14E'],[200,'#E8833A'],[300,'#D9483B'],[999,'#8E3B8C']];
const aqiColor=a=>C.find(c=>a<=c[0])[1];
const J=u=>fetch(u).then(r=>r.json());
function arrowPts(lat,lon,deg,len){const to=(deg+180)*Math.PI/180;return [[lon,lat],[lon+Math.sin(to)*len/0.63,lat+Math.cos(to)*len]];}
async function loadAll(){const [s,e,b,f,a]=await Promise.all(['sensors','epicentres','broken','forecast','anomalies'].map(x=>J('api/'+x)));return {s,e,b,f,a};}
function circle(lon,lat,rkm,n=48){const p=[];for(let i=0;i<=n;i++){const t=i/n*2*Math.PI;p.push([lon+rkm/111/0.63*Math.cos(t),lat+rkm/111*Math.sin(t)]);}return p;}
function addLayers(map,D){
 const bad=new Set(D.b.broken.map(x=>x.id));
 const fc=f=>({type:'FeatureCollection',features:f});
 map.addSource('sensors',{type:'geojson',data:fc(D.s.sensors.map(s=>({type:'Feature',geometry:{type:'Point',coordinates:[s.lon,s.lat]},properties:{id:s.id,pm:s.pm25,aqi:s.aqi,col:bad.has(s.id)?'#8A8A86':aqiColor(s.aqi),bad:bad.has(s.id)}})))});
 map.addLayer({id:'heat',type:'heatmap',source:'sensors',filter:['!',['get','bad']],paint:{'heatmap-weight':['interpolate',['linear'],['get','pm'],0,0,80,1],'heatmap-radius':60,'heatmap-opacity':.45,
  'heatmap-color':['interpolate',['linear'],['heatmap-density'],0,'rgba(0,0,0,0)',.3,'#6FCF6A',.6,'#F2C14E',.9,'#D9483B']}});
 map.addSource('epi',{type:'geojson',data:fc(D.e.epicentres.map(e=>({type:'Feature',geometry:{type:'Polygon',coordinates:[circle(e.lon,e.lat,1.2+e.sensors.length*.4)]},properties:e})))});
 map.addLayer({id:'epi-f',type:'fill',source:'epi',paint:{'fill-color':'#D9483B','fill-opacity':.12}});
 map.addLayer({id:'epi-l',type:'line',source:'epi',paint:{'line-color':'#D9483B','line-width':1.5,'line-dasharray':[2,2]}});
 const w=D.f.wind.dir;
 map.addSource('wind',{type:'geojson',data:fc(D.e.epicentres.map(e=>({type:'Feature',geometry:{type:'LineString',coordinates:arrowPts(e.lat,e.lon,w,.035)}})).concat(
  [0,1,2,3,4,5,6,7,8].map(i=>({type:'Feature',geometry:{type:'LineString',coordinates:arrowPts(51.09+Math.floor(i/3)*.06,71.34+(i%3)*.09,w,.018)},properties:{g:1}}))))});
 map.addLayer({id:'wind',type:'line',source:'wind',paint:{'line-color':'#2F6BFF','line-width':['case',['has','g'],1.2,2.5],'line-opacity':['case',['has','g'],.5,.95]}});
 map.addSource('windhead',{type:'geojson',data:fc(D.e.epicentres.map(e=>({type:'Feature',geometry:{type:'Point',coordinates:arrowPts(e.lat,e.lon,w,.035)[1]}})))});
 map.addLayer({id:'windhead',type:'circle',source:'windhead',paint:{'circle-radius':4,'circle-color':'#2F6BFF'}});
 map.addLayer({id:'pts',type:'circle',source:'sensors',paint:{'circle-radius':['interpolate',['linear'],['zoom'],9,4,13,8],'circle-color':['get','col'],'circle-stroke-color':'#18191B','circle-stroke-width':1.5}});
 map.addLayer({id:'broken',type:'circle',source:'sensors',filter:['get','bad'],paint:{'circle-radius':11,'circle-color':'rgba(0,0,0,0)','circle-stroke-color':'#ECEAE4','circle-stroke-width':1.5}});
 map.addLayer({id:'broken-t',type:'symbol',source:'sensors',filter:['get','bad'],layout:{'text-field':'!','text-size':12,'text-offset':[0,-1.6],'text-font':['Noto Sans Bold']},paint:{'text-color':'#ECEAE4'}});
 return D;
}
function miniMap(id,o={}){const el=document.getElementById(id);if(!el)return;
 const m=new maplibregl.Map({container:id,style:STYLE,center:[71.43,51.15],zoom:o.zoom||10.6,pitch:o.pitch||0,interactive:!!o.interactive,attributionControl:{compact:true},cooperativeGestures:!!o.interactive});
 m.on('load',async()=>{addLayers(m,await loadAll());});return m;}
