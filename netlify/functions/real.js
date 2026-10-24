const R=require("./_real"),REG=require("./registries.json");
exports.handler=async()=>{try{const r=await R.load();return {statusCode:200,headers:{"content-type":"application/json; charset=utf-8","cache-control":"public, max-age=300"},body:JSON.stringify({...r,registries:REG})}}
catch(e){return {statusCode:200,headers:{"content-type":"application/json; charset=utf-8"},body:JSON.stringify({error:"Источник временно недоступен: "+e.message,cities:[],registries:REG})}}};
