const d=require("./_data");exports.handler=async(ev)=>{const {p,w,l}=await d.ctx(ev);return d.json(await d.forecast(p,w,l));};
