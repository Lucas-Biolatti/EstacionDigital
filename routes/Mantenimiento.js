var express = require('express');
var router = express.Router();
const url = require('url');
const { connectToDatabase } = require('../db/db');

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
router.get('/items',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Mantenimiento") {
        connectToDatabase((error, conexion) => {
          if (error) {
              return res.status(500).send('Error de conexión a la base de datos');
          }
          const sql = "SELECT * FROM items WHERE 1"
          conexion.query(sql,(error,result)=>{
            conexion.release();
              if(!error){
                  res.send(result);
                }
            })
          })
      } else {
        res.render('login',{
          mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
      }

  
});

router.get('/sector',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Mantenimiento") {
        connectToDatabase((error, conexion) => {
          if (error) {
              return res.status(500).send('Error de conexión a la base de datos');
          }
            
            let sql1 = "SELECT * FROM sector";
            conexion.query(sql1,(error,result,files)=>{
                conexion.release();
                if(!error){
                    res.send(result);
                }else{
                    alert("No se pudo obtener los sectores");
                }
            })
          })
      } else {
        res.render('login',{
          mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
      }
});

router.get('/ordenTrabajo',(req,res)=>{
  if (req.session.loggedin  && req.session.rol=="Mantenimiento") {

    connectToDatabase((error, conexion) => {
        if (error) {
            return res.status(500).send('Error de conexión a la base de datos');
        }
            let sql1 = "SELECT * FROM sector";
            let sector = [];

            conexion.query(sql1,(error,result,files)=>{
                conexion.release();
                if(!error){
                
                    for(let i=0;i<result.length;i++){
                        sector.push(result[i])
                    }
                }
                res.render("./Mantenimiento/ordenes",{sector:sector,nombre:`${req.session.apellido}, ${req.session.nombre}`});    
            })
        })
  }else {
      res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
    }
});
router.get('/ordenXSector',(req,res)=>{
    if (req.session.loggedin  && req.session.rol=="Mantenimiento") {
        connectToDatabase((error, conexion) => {
            if (error) {
                return res.status(500).send('Error de conexión a la base de datos');
            }
            let idSector = url.parse(req.url,true).query.id;
            let sector= url.parse(req.url,true).query.nombre;
            let mensaje=req.query.mensaje;
            let sql1 = "SELECT * FROM ordentrabajo WHERE sector=?";
            let sql2 = "SELECT * FROM ordentrabajo WHERE NOT estado='cerrado'";
            
            
            conexion.query(sql1,[sector],(error,result,files)=>{
                conexion.release();
                if(!error){
                    let tiempoTotal=0
                    let resultados=[];
                    let abiertas=0
                    let cerradas=0
                    let enProceso=0
                        for(let i=0;i<result.length;i++){
                            let f = new Date(result[i].fecha);
                            let fecha = `${f.getDate()}/${f.getMonth()+1}/${f.getUTCFullYear()}`;
                            let finicio  = new Date(result[i].horaInicio);
                            let ffin  = new Date(result[i].horaFin);
                            let inicio=finicio.getDate()+"/"+finicio.getMonth()+"/"+finicio.getUTCFullYear()+" - "+finicio.getHours()+":"+finicio.getMinutes();
                            let fin=ffin.getDate()+"/"+ffin.getMonth()+"/"+ffin.getUTCFullYear()+" - "+ffin.getHours()+":"+ffin.getMinutes();
                            let resultado={
                                idOrden: result[i].idOrden,
                                detecto: result[i].detecto,
                                equipo: result[i].equipo,
                                fecha: fecha,
                                turno: result[i].turno,
                                paradaProceso: result[i].paradaProceso,
                                prioridad: result[i].prioridad,
                                tipo: result[i].tipoParada,
                                horaInicio: inicio,
                                horaFin: fin,
                                descripcion:  result[i].descripcion,
                                tiempoTotal:(ffin-finicio)/1000/60,
                                estado:result[i].estado,
                                sector:result[0].sector
                            }
                            if(result[i].estado=="Pendiente"){
                                abiertas++;
                            }if(result[i].estado=="Cerrado"){
                                cerradas++;
                            }if(result[i].estado=="En Proceso"){
                                enProceso++;
                            }
                            tiempoTotal+=(ffin-finicio)/1000/60;
                            resultados.push(resultado);
                        }
                    res.render('./Mantenimiento/ordenXSector',{
                        orden:resultados,
                        idSector:parseInt(idSector),
                        tt:tiempoTotal,
                        abiertas:abiertas,
                        cerradas:cerradas,
                        enProceso:enProceso,   
                        sector:sector,
                        nombre:`${req.session.apellido}, ${req.session.nombre}`
                    });
                 }
                else{
                    console.log("Error de conexion");
                }
            })
            })
    
    
    }else {
        res.render('login',{
        mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
      }
})
router.get('/ordenes',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Mantenimiento") {
        connectToDatabase((error, conexion) => {
          if (error) {
              return res.status(500).send('Error de conexión a la base de datos');
          }
          const sql="SELECT * FROM ordentrabajo WHERE NOT estado='cerrado'"
          conexion.query(sql,(error,fields)=>{
            conexion.release();
              if(!error){ 
                  let data=[];
                  for (let i = 0; i < fields.length; i++) {
                      let dato = {
                          idOrden:fields[i].idOrden,
                          sector:fields[i].sector,
                          avisar:fields[i].avisar,
                          equipo:fields[i].equipo,
                          fecha:fecha(fields[i].fecha),
                          turno:fields[i].turno,
                          descripcion:fields[i].descripcion,
                          estado:fields[i].estado,
                          accion:'<a href="resolverOrden?idOrden='+fields[i].idOrden+'">Cerrar</a>'
        
                      }
                      data.push(dato)
                      
                  }
                  
                  res.send(data);
              }
              else console.log("Error al conectar con BD OT")
          })
          })
      } else {
        res.render('login',{
          mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
      }

  
})
router.get('/resolverOrden',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Mantenimiento") {

        connectToDatabase((error, conexion) => {
            if (error) {
                return res.status(500).send('Error de conexión a la base de datos');
            }
            let idOrden = url.parse(req.url,true).query.idOrden;
            const sqlorden = "SELECT * FROM ordentrabajo WHERE idOrden = ?"
            conexion.query(sqlorden,[idOrden],(error,result)=>{
                conexion.release();
            if(!error && result.length>0){
                let dia = (result[0].fecha.getUTCDate()<10?'0':'')+result[0].fecha.getUTCDate();
                let mes = ((result[0].fecha.getMonth()+1)<10?'0':'')+(result[0].fecha.getMonth()+1);
                let f = dia+"/"+mes+"/"+result[0].fecha.getUTCFullYear();
                let hi= result[0].horaInicio.getHours()+":"+result[0].horaInicio.getMinutes();
                let hf= result[0].horaFin.getHours()+":"+result[0].horaFin.getMinutes();
                let total=(result[0].horaFin-result[0].horaInicio)/1000/60;
                res.render('./Mantenimiento/resolverOrden',{
                    result:result,
                    f:f,
                    hi:hi,
                    hf:hf,
                    total:total,
                    idOrden:idOrden,
                    Nombre: `${req.session.apellido}, ${req.session.nombre}`});
            }else{res.send(`<h1>No se encontraron resultados</h1>`)};
        })
            })
        
    
    } else {
      res.render('login',{
        mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
    }
    
})
router.post('/resolverOrden',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Mantenimiento") {
        connectToDatabase((error, conexion) => {
            if (error) {
                return res.status(500).send('Error de conexión a la base de datos');
            }
            const sql = "UPDATE ordentrabajo SET estado=?, fecha_cierre=?, descripcion_cierre=?, tiempo=?, c1=?, cantidad1=?, c2=?, cantidad2=?, c3=?, cantidad3=?, pendiente=?, observaciones_cierre=?, ejecutor1=?, ejecutor2=?, ejecutor3=? WHERE idOrden=?"
    
            conexion.query(sql,[
                req.body.estado,
                req.body.fecha,
                req.body.descripcion,
                parseInt(req.body.tiempo),
                req.body.c1,
                parseInt(req.body.cantidad1),
                req.body.c2,
                parseInt(req.body.cantidad2),
                req.body.c3,
                parseInt(req.body.cantidad3),
                req.body.pendiente,
                req.body.observaciones,
                req.body.ejecutor1,
                req.body.ejecutor2,
                req.body.ejecutor3,
                parseInt(req.body.idOrden)],(error)=>{
                    conexion.release();
                if(!error){
                    res.redirect(`ordenTrabajo?mensaje=✅Se Actualizo orden Nro ${req.body.idOrden} Correctamente✅`);
                    
                }else{
                    res.redirect(`ordenTrabajo?mensaje=❌No se pudo Actualizar orden Nro ${req.body.idOrden}❌`)
                 }
            })
            })
    } else {
      res.render('login',{
        mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
    }
})

module.exports = router;