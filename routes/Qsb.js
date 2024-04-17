var express = require('express');
const url = require('url');
var router = express.Router();
var conexion = require('../db/db');


function fecha(x){
  let f = new Date(x);
  let fecha = f.getDate()+"/"+f.getMonth()+"/"+f.getUTCFullYear();
  return fecha;
};
function fechaEdit(x){
  let dia = (x.getUTCDate()<10?'0':'')+x.getUTCDate();
  let mes = ((x.getMonth()+1)<10?'0':'')+(x.getMonth()+1);
  let f = x.getUTCFullYear()+"-"+mes+"-"+dia;
  return f;
}



//const nombre = `${req.session.apellido}, ${req.session.nombre}`
//MANTENIMIENTO
router.get('/',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Qsb") {
        res.render('./Qsb/index')
    
    } else {
      res.render('login',{
        mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
    }
});
router.get('/iny',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Qsb") {
      res.render('./Qsb/iny')
  
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})

module.exports = router;
