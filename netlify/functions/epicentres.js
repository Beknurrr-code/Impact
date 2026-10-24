const d=require("./_data");exports.handler=async(ev)=>{const {p,w,M,l}=await d.ctx(ev);return d.json({plant:p.id,wind:w.current,met:M,method:d.METHOD,epicentres:d.epicentres(p,l,M)});};
