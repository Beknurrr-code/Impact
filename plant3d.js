// Процедурная 3D-модель площадки (fill-extrusion) + дым three.js
const SC={green:'#3FAE6A',yellow:'#E6C34A',orange:'#E8833A',red:'#D9483B'};
const TINT={green:['#A9B8A6','#97A894'],yellow:['#C2BB9C','#B0A98A'],orange:['#C4A892','#B39680'],red:['#C49A92','#B38780']};
function ll(P,dx,dy){return [P.lon+dx/(111320*Math.cos(P.lat*Math.PI/180)),P.lat+dy/110540]}
const rect=(P,x,y,w,h)=>[[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2],[-w/2,-h/2]].map(([u,v])=>ll(P,x+u,y+v))];
const circ=(P,x,y,r,n=28)=>{const p=[];for(let i=0;i<=n;i++){const t=i/n*2*Math.PI;p.push(ll(P,x+r*Math.cos(t),y+r*Math.sin(t)))}return [p]};
function plantFeatures(P,stacks,pst){
 const F=[],add=(g,p)=>F.push({type:'Feature',geometry:{type:'Polygon',coordinates:g},properties:p}),T=TINT[pst]||TINT.green,st=pst==='red'?'превышение':pst==='orange'?'повышено':pst==='yellow'?'внимание':'норма';
 for(let i=0;i<P.halls;i++)add(rect(P,-P.halls*7+i*14,20,14,60),{name:'Главный корпус',h:i%2?32:26,b:0,c:T[i%2],st});
 add(rect(P,P.halls*7+45,20,90,60),{name:'Машинный зал',h:22,b:0,c:T[0],st});add(rect(P,P.halls*7+45,20,70,36),{name:'Машинный зал',h:28,b:22,c:T[1],st});
 for(let i=0;i<6;i++)add(rect(P,-40+i*20,-70,20,40),{name:'Цех подготовки сырья',h:i%2?14:11,b:0,c:'#8C7F72',st});
 add(rect(P,P.halls*7+140,-40,40,30),{name:'Административный корпус',h:30,b:0,c:'#C9C3B6',st:'—'});
 for(let k=0;k<P.towers;k++){const x=-P.halls*7-80,y=60+k*80;[34,30,26,24,25,28].forEach((r,j)=>add(circ(P,x,y,r),{name:'Градирня №'+(k+1),h:(j+1)*12,b:j*12,c:j%2?'#D6D3CB':'#CBC7BE',st:'пар',hgt:72}))}
 for(let k=0;k<P.tanks;k++)add(circ(P,P.halls*7+110+(k%2)*30,90+Math.floor(k/2)*30,11),{name:'Резервуар №'+(k+1),h:14,b:0,c:'#E3E0D8',st:'—'});
 stacks.forEach(s=>{const c=SC[s.status]||'#B9B6AE',lab=s.id+' · макс. у земли '+s.maxGroundUg+' мкг/м³',p={name:s.id,h:s.h-14,b:0,c,st:lab,hgt:s.h};const r=Math.max(3.5,s.d*.7);
  add(circ(P,s.dx,s.dy,r),p);add(circ(P,s.dx,s.dy,r*.95),{...p,b:s.h-14,h:s.h-9,c:'#D9483B'});add(circ(P,s.dx,s.dy,r*.9),{...p,b:s.h-9,h:s.h-5,c:'#F4F2EE'});add(circ(P,s.dx,s.dy,r*.85),{...p,b:s.h-5,h:s.h,c:'#D9483B'})});
 return {type:'FeatureCollection',features:F};
}
function smokeLayer(P,stacks,getWind){
 let renderer,scene,camera,pts,map,data,N=Math.max(1,stacks.length)*(innerWidth<800?70:150);
 const mc=maplibregl.MercatorCoordinate.fromLngLat([P.lon,P.lat],0),sc=mc.meterInMercatorCoordinateUnits();
 const PC={green:'#A0A0A0',yellow:'#C8B070',orange:'#E8833A',red:'#D9483B'};
 return {id:'smoke',type:'custom',renderingMode:'3d',
  onAdd(m,gl){map=m;camera=new THREE.Camera();scene=new THREE.Scene();const pos=new Float32Array(N*3),col=new Float32Array(N*3);data=[];
   for(let i=0;i<N;i++){const s=stacks[i%stacks.length];data.push({s,age:Math.random(),j:[Math.random()-.5,Math.random()-.5]});const c=new THREE.Color(PC[s.status]||'#A0A0A0');col.set([c.r,c.g,c.b],i*3)}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
   pts=new THREE.Points(g,new THREE.PointsMaterial({size:10,vertexColors:true,transparent:true,opacity:.45,depthWrite:false}));scene.add(pts);
   renderer=new THREE.WebGLRenderer({canvas:m.getCanvas(),context:gl,antialias:false});renderer.autoClear=false},
  render(gl,matrix){const w=getWind(),to=(w.dir+180)*Math.PI/180,v=Math.max(w.speed,3)/3.6,a=pts.geometry.attributes.position.array;
   for(let i=0;i<N;i++){const d=data[i];if(!window.IMPACT_RM)d.age+=.004+(i%7)*.0003;if(d.age>1)d.age=0;const t=d.age*70,sp=2+t*1.1;
    a[i*3]=d.s.dx+Math.sin(to)*v*t+d.j[0]*sp;a[i*3+1]=d.s.h+t*1.4+Math.sin(t*.3+i)*2;a[i*3+2]=-(d.s.dy+Math.cos(to)*v*t+d.j[1]*sp)}
   pts.geometry.attributes.position.needsUpdate=true;
   const l=new THREE.Matrix4().makeTranslation(mc.x,mc.y,mc.z).scale(new THREE.Vector3(sc,-sc,sc)).multiply(new THREE.Matrix4().makeRotationX(Math.PI/2));
   camera.projectionMatrix=new THREE.Matrix4().fromArray(matrix).multiply(l);renderer.resetState();renderer.render(scene,camera);if(!window.IMPACT_RM&&window.__smokeLive!==false&&!document.hidden)map.triggerRepaint()}};
}
