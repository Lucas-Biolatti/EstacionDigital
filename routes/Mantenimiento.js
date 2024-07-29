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
router.get('/nomina',(req,res)=>{
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let legajo = req.query.legajo;
      let sql1 = `SELECT nombre FROM nomina WHERE	leg="${legajo}"`;
      conexion.query(sql1,(error,result,files)=>{
        conexion.release();
          if(!error){
             res.send(result[0]);
             console.log(result[0])
          }else{
              alert("No se pudo obtener la nomina");
          }
      })
      })
});
router.get('/items',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Mantenimiento") {
        connectToDatabase((error, conexion) => {
          if (error) {
              return res.status(500).send('Error de conexión a la base de datos');
          }
          let codigo = req.query.codigo;
          const sql = `SELECT Descripcion FROM items WHERE	item="${codigo}"`;
          conexion.query(sql,(error,result)=>{
            conexion.release();
              if(!error){
                
                  res.send(result[0]);
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

                let f2;

                if (result[0].fecha_cierre) {
                    let dia2 = (result[0].fecha_cierre.getUTCDate() < 10 ? '0' : '') + result[0].fecha_cierre.getUTCDate();
                    let mes2 = ((result[0].fecha_cierre.getMonth() + 1) < 10 ? '0' : '') + (result[0].fecha_cierre.getMonth() + 1);
                    f2 = `${result[0].fecha_cierre.getUTCFullYear()}-${mes2}-${dia2}`;
                } else {
                    // Manejar el caso cuando fecha_cierre es null, por ejemplo, asignar una fecha predeterminada o dejar f2 como undefined
                    f2 = 'Fecha no disponible'; // O cualquier otro valor que desees asignar
                }
                
                res.render('./Mantenimiento/resolverOrden',{
                    result:result,
                    f:f,
                    f2:f2,
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
            const sql = "UPDATE ordentrabajo SET estado=?, fecha_cierre=?, descripcion_cierre=?, tiempo=?, pendiente=?, observaciones_cierre=?, WHERE idOrden=?"
    
            conexion.query(sql,[
                req.body.estado,
                req.body.fecha,
                req.body.descripcion,
                parseInt(req.body.tiempo),
                req.body.pendiente,
                req.body.observaciones,
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
//Manejo de nomina de ejecutores
router.post('/agregarEjecutor',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Mantenimiento") {
        connectToDatabase((error, conexion) => {
          if (error) {
              return res.status(500).send('Error de conexión a la base de datos');
          }
            let idOrden = req.body.idOrden;
            let sector = req.body.sector;
            let fecha = req.body.fecha;
            let legajo = req.body.legajo;
            let nombre = req.body.nombre;
            let calorias = req.body.calorias;
            let altura = req.body.altura;

            let sql =`INSERT INTO ejecutoresMtto(idOrden,fecha,sector,nombre,legajo,calorias,altura) VALUES(${idOrden},"${fecha}","${sector}","${nombre}","${legajo}",${calorias},${altura});`
            conexion.query(sql,(error)=>{
                conexion.release();
                if (!error) {
                    res.redirect(`resolverOrden?idOrden=${idOrden}`);
                }else{
                    res.send(error)
                }
            })
          })
      } else {
        res.render('login',{
          mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
      }
})
router.get('/nominaOrden',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Mantenimiento") {
        connectToDatabase((error, conexion) => {
          if (error) {
              return res.status(500).send('Error de conexión a la base de datos');
          }
            let idOrden = req.query.idOrden;
            const sql = `SELECT * FROM ejecutoresMtto where idOrden = "${idOrden}"`
            conexion.query(sql,(error,result)=>{
                conexion.release();
                if (!error) {
                    res.send(result)
                }else{
                    res.send(error)
                }
            })
          })
      } else {
        res.render('login',{
          mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
      }
})
router.get('/editarEjecutor',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Mantenimiento") {
        connectToDatabase((error, conexion) => {
          if (error) {
              return res.status(500).send('Error de conexión a la base de datos');
          }
            let id = req.query.id
            let sql = `select * from ejecutoresMtto where id=${id}`;
            conexion.query(sql,(error,result)=>{
                conexion.release();
                if (!error) {
                    let fecha = fechaEdit(result[0].fecha)
                    res.render('./Mantenimiento/editarEjecutor',{fecha:fecha,result:result})
                }
            })
          })
      } else {
        res.render('login',{
          mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
      }
})
router.get('/eliminarEjecutor',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Mantenimiento") {
        connectToDatabase((error, conexion) => {
          if (error) {
              return res.status(500).send('Error de conexión a la base de datos');
          }
            let id = req.query.id;
            let idOrden = req.query.idOrden;
            const sql = `DELETE FROM ejecutoresMtto WHERE id = ${id}`
            conexion.query(sql,(error)=>{
                conexion.release();
                if (!error) {
                    res.redirect(`resolverOrden?idOrden=${idOrden}`);
                }else{
                    res.send(error);
                }
            })
          })
      } else {
        res.render('login',{
          mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
      }
})
//Manejo de items por orden
router.post('/agregarCodigo',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Mantenimiento") {
        connectToDatabase((error, conexion) => {
          if (error) {
              return res.status(500).send('Error de conexión a la base de datos');
          }
            let idOrden = req.body.idOrden;
            let fecha = req.body.fecha;
            let codigo = req.body.codigo;
            let descripcion = req.body.descripcion_repuesto;
            let cantidad = req.body.cantidad;
            const sql = `INSERT INTO repuestos_usados (idOrden,fecha,codigo,descripcion,cantidad) VALUES(${idOrden},"${fecha}","${codigo}","${descripcion}",${cantidad});`
            conexion.query(sql,(error)=>{
                conexion.release();
                if (!error) {
                    res.redirect(`resolverOrden?idOrden=${idOrden}`);
                }else{
                    res.send(error)
                }
            })
          })
      } else {
        res.render('login',{
          mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
      }
})
router.get('/itemsOrden',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Mantenimiento") {
        connectToDatabase((error, conexion) => {
          if (error) {
              return res.status(500).send('Error de conexión a la base de datos');
          }
            let idOrden = req.query.idOrden;
            const sql = `SELECT * FROM repuestos_usados where idOrden = "${idOrden}"`
            conexion.query(sql,(error,result)=>{
                conexion.release();
                if (!error) {
                    res.send(result)
                }else{
                    res.send(error)
                }
            })
          })
      } else {
        res.render('login',{
          mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
      }
})


module.exports = router;