const d=require("./_data");exports.handler=async(ev)=>{const {p,M}=await d.ctx(ev);return d.json({plant:p.id,met:M,grid:d.grid(p,M),stacks:d.stackStatus(p,M),method:d.METHOD});};
