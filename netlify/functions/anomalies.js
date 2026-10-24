const d=require("./_data");exports.handler=async(ev)=>{const {l}=await d.ctx(ev);return d.json(d.anomalies(l));};
