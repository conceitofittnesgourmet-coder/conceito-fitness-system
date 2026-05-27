module.exports =

(req,res,next) => {

  req.empresa =

    req.usuario.empresa;





  next();

};