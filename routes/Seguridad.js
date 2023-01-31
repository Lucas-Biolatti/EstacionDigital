var express = require('express');
var router = express.Router();
var conexion = require('../db/db')

function fecha(x){
  let f = new Date(x);
  let fecha = `${f.getDate()}/${f.getMonth()+1}/${f.getUTCFullYear()}`;
  return fecha;
};

function fechaEdit(x){
  let dia = (x.getUTCDate()<10?'0':'')+x.getUTCDate();
  let mes = ((x.getMonth()+1)<10?'0':'')+(x.getMonth()+1);
  let f = x.getUTCFullYear()+"-"+mes+"-"+dia;
  return f;
}

router.get('/accidentes',(req,res)=>{
    if (req.session.loggedin  && req.session.rol=="Seguridad") {
      const sql = "SELECT * FROM accidentes ORDER BY idAccidente DESC"
      conexion.query(sql,(error,result)=>{
        if (!error) {
          let resultados=[];
          for (let i = 0; i < result.length; i++) {
            let r = {
              idAccidente:result[i].idAccidente,
              nombre:result[i].nombre,
              fecha:fecha(result[i].fecha),
              tipo:result[i].tipo,
              que:result[i].que,
              cuando:result[i].cuando,
              donde:result[i].donde,
              quien:result[i].quien,
              cual:result[i].cual,
              como:result[i].como,
              observaciones:result[i].observaciones,
              sector:result[i].sector,
              estado:result[i].estado,
              fecha_cierre:result[i].fecha_cierre,
              cuatrom:result[i].cuatrom,
              cincow:result[i].concow,
              acciones:result[i].acciones
            }
            resultados.push(r)
            
          }
        
          res.render('Seguridad/accidentes',{
            result:resultados,
            nombre:`${req.session.apellido}, ${req.session.nombre}`
          })  
        }else{
          console.log(error)
        }
      })
        
    
    } else {
      res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
    }
  });

router.get('/incidentes',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Seguridad") {
    const sql = "SELECT * FROM actosinseguros"
    conexion.query(sql,(error,result)=>{
      if (!error) {
        let resultados=[];
        for (let i = 0; i < result.length; i++) {
          let r = {
            idActoInseguro:result[i].idActoInseguro,
            nombre:result[i].nombre,
            fecha:fecha(result[i].fecha),
            tipo:result[i].tipo,
            subTipo:result[i].subTipo,
            descripcion:result[i].descripcion,
            propuesta:result[i].propuesta,
            accion:result[i].accion,
            sector:result[i].sector,
            estado:result[i].estado,
            fecha_cierre:result[i].fecha_cierre,
            accion_def:result[i].accion_def,
            evidencia:result[i].evidencia
          }
          resultados.push(r);
          
        }
        res.render('Seguridad/incidentes',{
          result:resultados,
          nombre:`${req.session.apellido}, ${req.session.nombre}`
        })
      }
    })

  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})
module.exports = router;