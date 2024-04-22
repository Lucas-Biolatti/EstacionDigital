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
     
      res.render('./Qsb/iny',{sector:req.query.sector})
    
  
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})
router.get('/datos',(req,res)=>{

  const sql=`SELECT * FROM indicadores WHERE MONTH(fecha)=${req.query.mes} AND YEAR(fecha)=${req.query.year} AND sector ="${req.query.sector}" ORDER BY fecha`
  conexion.query(sql,(error,results)=>{
    if(!error){
      res.send(results)
    }else{
      res.send(error)
    }
  })
});

router.post("/agregaraccion",(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Qsb") {
    let fecha = req.body.fecha;
    let sector = req.body.sector;
    let scrap = req.body.scrap
    let accidentes = req.body.accidentes;
    let c_programa = req.body.c_programa;
    let disponibilidad = req.body.disponibilidad;
    let disp_molde = req.body.disp_molde;
    let observaciones = req.body.observaciones;
    const sql = `INSERT INTO indicadores (fecha,sector, accidentes, c_programa,scrap,disponibilidad,disp_molde, observaciones)VALUES (${fecha},"${sector}", ${accidentes}, ${c_programa},${scrap},${disponibilidad},${disp_molde}, "${observaciones}");`
    conexion.query(sql,(error,row)=>{
      if (!error) {
        res.redirect(`/Qsb/iny?sector=Inyeccion/`)
      }else{
        res.send(error)
      }
    })
   

} else {
  res.render('login',{
    mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
}
})

module.exports = router;
