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
              cincow:result[i].cincow,
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
router.get('/resolverAccidente',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Seguridad") {
    let id = req.query.idAccidente;
    let sql1 ="SELECT * FROM accidentes WHERE idAccidente = ?";
    
    conexion.query(sql1,[id],(error,result)=>{
        if(!error){
            let f = new Date(result[0].fecha);
            let fecha = f.getDate()+"/"+f.getMonth()+1+"/"+f.getUTCFullYear();
           let resultados={
               idAccidente:id,
               nombre:result[0].nombre,
               fecha:fecha,
               tipo:result[0].tipo,
               descripcion:result[0].que+" "+result[0].cuando+" "+result[0].donde+" "+result[0].quien+" "+result[0].cual+" "+result[0].como,
               observaciones:result[0].observaciones

           }
                res.render('Seguridad/resolverAccidente',{result:resultados})
            
        }
       
    })
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})
router.post('/resolverAccidente',(req,res)=>{
  const id = req.body.idAccidente;
  const sql = "UPDATE accidentes SET `estado`=?,`fecha_cierre`=?,`cuatrom`=?,`cincow`=?,`acciones`=?, `valoracion`=? WHERE `idAccidente`=?"
  const filecausa = req.files.filecausa;
  const fileraiz = req.files.fileraiz

  conexion.query(sql,[
    req.body.estado,
    req.body.fecha_cierre,
    `${filecausa.name}_${id}`,
    `${fileraiz.name}_${id}`,
    req.body.acciones,
    req.body.valoracion,
    id
  ],(error,rows)=>{
    if (!error) {
      filecausa.mv('./public/accidentes/'+id+'_'+filecausa.name);
      fileraiz.mv('./public/accidentes/'+id+'_'+fileraiz.name);
      res.render('Seguridad/resolverAccidente',{
        mensaje:`Se actualizaron correctamente los datos del siniestro Nro${id} `
      })
    }else{console.log(error)}
  })
})
module.exports = router;