const d=require("./_data");exports.handler=async(ev)=>{const {p,M,l}=await d.ctx(ev);return d.json({plant:p,met:M,sensors:l.map(({parts,...s})=>s)});};
