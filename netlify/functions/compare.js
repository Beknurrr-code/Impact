const c=require("./_cmp"),d=require("./_data");
exports.handler=async(ev)=>{const r=await c.compare(ev.queryStringParameters&&ev.queryStringParameters.plant);delete r.me;return d.json(r);};
