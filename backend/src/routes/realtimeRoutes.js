const router = require("express").Router();
const realtime = require("../services/realtime");

router.get("/stream", (req,res)=>{
  res.setHeader("Content-Type","text/event-stream");
  res.setHeader("Cache-Control","no-cache");
  res.setHeader("Connection","keep-alive");

  realtime.addCliente(res);

  const interval = setInterval(()=>{
    res.write(":\n\n"); // keep alive
  },20000);

  req.on("close",()=>{
    clearInterval(interval);
    realtime.removeCliente(res);
  });
});

module.exports = router;