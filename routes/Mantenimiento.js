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
                            let inicio=`${finicio.getDate()}/${finicio.getMonth()+1}/${finicio.getUTCFullYear()} - ${finicio.getHours()}:${finicio.getMinutes()}`;
                            let fin=`${ffin.getDate()}/${ffin.getMonth()+1}/${ffin.getUTCFullYear()} - ${ffin.getHours()}:${ffin.getMinutes()}`;
                            let resultado={
                                idOrden: result[i].idOrden,
                                avisar:result[i].avisar,
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
          const sql="SELECT * FROM ordentrabajo"
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
                          accion:'<a class="btn btn-primary btn-sm" href="resolverOrden?idOrden='+fields[i].idOrden+'">Cerrar</a>'
        
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
            const sql = "UPDATE ordentrabajo SET estado=?, fecha_cierre=?, descripcion_cierre=?, tiempo=?, pendiente=?, observaciones_cierre=? WHERE idOrden=?"
    
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
                    res.redirect(`ordenesdia?mensaje=✅Se Actualizo orden Nro ${req.body.idOrden} Correctamente✅`);
                    
                }else{
                    //res.redirect(`ordenTrabajo?mensaje=❌No se pudo Actualizar orden Nro ${req.body.idOrden}❌`)
                    res.send(error);
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
    if (req.session.loggedin ) {
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
router.get('/eliminarItem',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Mantenimiento") {
        connectToDatabase((error, conexion) => {
          if (error) {
              return res.status(500).send('Error de conexión a la base de datos');
          }
            let id = req.query.id;
            let idOrden = req.query.idOrden;
            const sql = `DELETE FROM repuestos_usados WHERE id = ${id}`
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
router.get('/ordenesDia',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Mantenimiento") {
        connectToDatabase((error, conexion) => {
          if (error) {
              return res.status(500).send('Error de conexión a la base de datos');
          }
          
          conexion.release();
            res.render('./Mantenimiento/ordenDia')
          })
      } else {
        res.render('login',{
          mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
      }
})
router.get('/ordenDia',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Mantenimiento") {
        connectToDatabase((error, conexion) => {
          if (error) {
              return res.status(500).send('Error de conexión a la base de datos');
          }
            let fecha = req.query.fecha;
            const sql = `select * from ordentrabajo where fecha = "${fecha}"`;
            conexion.query(sql,(error,result)=>{
                conexion.release();
                if (!error) {
                    res.send(result);
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
router.get('/hsEjecutores',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Mantenimiento") {
        connectToDatabase((error, conexion) => {
          if (error) {
              return res.status(500).send('Error de conexión a la base de datos');
          }
            let fini = req.query.fini;
            let ffin = req.query.ffin;

            const sql = `SELECT legajo, nombre, SUM(calorias) AS calorias, SUM(altura) AS altura FROM ejecutoresMtto WHERE fecha <= "${ffin}" AND fecha >= "${fini}" GROUP BY legajo;`;
            conexion.query(sql,(error,result)=>{
                conexion.release();
                if (!error) {
                    res.send(result);
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
router.get('/reporteHs',(req,res)=>{
    res.render('./Mantenimiento/reportes/hs_ejecutores')
})

//CRUD Ordenes de mantenimiento
router.get('/mtto:?',(req,res)=>{
  //Renderizar index de Mantenimiento
  if (req.session.loggedin && req.session.rol=="Mantenimiento") {
    connectToDatabase((error, conexion) => {
      if (error) {
          logError('Error de conexión a la base de datos: ' + error.message);
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let sql1 = "SELECT * FROM sector";
      let sector = [];
      let mensaje = req.query.mensaje
      
      conexion.query(sql1,async (error,result,files)=>{
        conexion.release();
          if(!error){
             
              for(let i=0;i<result.length;i++){
                  sector.push(result[i])
              }
           
          }else{
            logError('Error al obtener sectores: ' + error.message);
          }
      
        await res.render("./users/mantenimiento/mtto",{sector:sector,
          nombre:`${req.session.apellido}, ${req.session.nombre}`,
        mensaje:mensaje});   
        
      })
      })
    
  }else{
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`})
  }
});
router.get('/ordenMtto',(req,res)=>{
  //Renderizar formulario de orden de trabajo
  if (req.session.loggedin && req.session.rol=="Mantenimiento") {
    connectToDatabase((error, conexion) => {
      if (error) {
          logError('Error de conexión a la base de datos: ' + error.message);
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let idSector = url.parse(req.url,true).query.id;
      let sector = url.parse(req.url,true).query.nombre;
      let sql2 = "SELECT * FROM equipo WHERE Sector=?";
      let equipo = [];
      conexion.query(sql2,[parseInt(idSector)],(error,result,files)=>{
        conexion.release();
          if(!error){
             
              for(let i=0;i<result.length;i++){
                  equipo.push(result[i])
              }
              res.render('./users/mantenimiento/agregar',{
                equipo:equipo,
                idSector:idSector,
                sector:sector,
                nombre:`${req.session.apellido}, ${req.session.nombre}`});
          }
    
      })
      })
    
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
  
});
router.get('/listarOrden:?',(req,res)=>{
  //listado de Ordenes y sumatoria de minutos
  if (req.session.loggedin && req.session.rol=="Mantenimiento") {
    connectToDatabase((error, conexion) => {
      if (error) {
          logError('Error de conexión a la base de datos: ' + error.message);      
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let idSector = req.query.id;
      let sector= req.query.nombre;
      let sql1 = "SELECT * FROM ordentrabajo WHERE sector=?";
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
              let fecha = `${f.getDate().toString().padStart(2,'0')}/${(f.getMonth()+1).toString().padStart(2,'0')}/${f.getUTCFullYear()}`;
              let finicio = new Date(result[i].horaInicio);
              let ffin = new Date(result[i].horaFin);

              let inicio = `${finicio.getDate().toString().padStart(2, '0')}/${(finicio.getMonth() + 1).toString().padStart(2, '0')}/${finicio.getUTCFullYear()} - ${finicio.getHours().toString().padStart(2, '0')}:${finicio.getMinutes().toString().padStart(2, '0')}`;

              let fin = `${ffin.getDate().toString().padStart(2, '0')}/${(ffin.getMonth() + 1).toString().padStart(2, '0')}/${ffin.getUTCFullYear()} - ${ffin.getHours().toString().padStart(2, '0')}:${ffin.getMinutes().toString().padStart(2, '0')}`;
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
                  tel:result[i].tel,
                  avisar:result[i].avisar
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
              res.render('./users/mantenimiento/listar',{
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
              logError('Error de conexion: ' + error.message);
              res.send("Error de conexion:"+error);
          }
      })
      })
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/editarOrden',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Mantenimiento") {
    connectToDatabase((error, conexion) => {
      if (error) {
          logError('Error de conexión a la base de datos: ' + error.message);
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let idOrden = url.parse(req.url,true).query.idOrden;
      let idSector = url.parse(req.url,true).query.idSector;
  
      let sql2 = "SELECT * FROM equipo WHERE Sector=?";
      let equipo = [];
      conexion.query(sql2,[parseInt(idSector)],(error,result,files)=>{
        conexion.release();
          if(!error){
              for(let i=0;i<result.length;i++){
                  equipo.push(result[i])
              }
          }
      })
  
      let sql = "SELECT * FROM `ordentrabajo` WHERE `idOrden`=?";
      conexion.query(sql,[parseInt(idOrden)],(error,result,file)=>{
        conexion.release();
          if(!error){
          let dia = (result[0].fecha.getUTCDate()<10?'0':'')+result[0].fecha.getUTCDate();
          let mes = ((result[0].fecha.getMonth()+1)<10?'0':'')+(result[0].fecha.getMonth()+1);
          let f = result[0].fecha.getUTCFullYear()+"-"+mes+"-"+dia;
          // hs inicio
          let diahi = (result[0].horaInicio.getUTCDate() < 10 ? '0' : '') + result[0].horaInicio.getUTCDate();
          let meshi = (result[0].horaInicio.getMonth() + 1 < 10 ? '0' : '') + (result[0].horaInicio.getMonth() + 1);
          let fhi = result[0].horaInicio.getUTCFullYear() + "-" + meshi + "-" + diahi + "T" + 
                    (result[0].horaInicio.getHours() < 10 ? '0' : '') + result[0].horaInicio.getHours() + ":" + 
                    (result[0].horaInicio.getMinutes() < 10 ? '0' : '') + result[0].horaInicio.getMinutes();

          // hs fin
          let diahf = (result[0].horaFin.getUTCDate() < 10 ? '0' : '') + result[0].horaFin.getUTCDate();
          let meshf = (result[0].horaFin.getMonth() + 1 < 10 ? '0' : '') + (result[0].horaFin.getMonth() + 1);
          let fhf = result[0].horaFin.getUTCFullYear() + "-" + meshf + "-" + diahf + "T" + 
          (result[0].horaFin.getHours() < 10 ? '0' : '') + result[0].horaFin.getHours() + ":" + 
          (result[0].horaFin.getMinutes() < 10 ? '0' : '') + result[0].horaFin.getMinutes();
          
          res.render('./users/mantenimiento/editar',{
              result:result,
              idSector:idSector,
              idOrden:idOrden,
              equipo:equipo,
              f:f,
              fhi:fhi,
              fhf:fhf});
          }
      })
      })
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.post('/ordenMtto',(req,res)=>{
  // Guardar Orden de Trabajo
  if (req.session.loggedin && req.session.rol=="Mantenimiento") {
    connectToDatabase((error, conexion) => {
      if (error) {
        logError('Error de conexión a la base de datos: ' + error.message);
        return res.status(500).send('Error de conexión a la base de datos');
      }
      let sql = "INSERT INTO `ordentrabajo`(`detecto`,`avisar`,`tel`, `sector`, `equipo`, `fecha`, `turno`, `paradaProceso`, `prioridad`, `tipoParada`, `horaInicio`, `horaFin`, `descripcion`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
      conexion.query(sql,[
      req.body.detecto,
      req.body.avisar,
      req.body.tel,
      req.body.sector,
      req.body.equipo,
      req.body.fecha,
      req.body.turno,
      req.body.paradaProceso,
      req.body.prioridad,
      req.body.tipoParada,
      req.body.horaInicio,
      req.body.horaFin ? req.body.horaFin : '0000-00-00 00:00',
      req.body.descripcion],(error,fields)=>{
        conexion.release();
        if(!error){
          res.redirect('mtto?mensaje=Se agrego exitosamente la OT');
        }else{
          res.redirect('mtto?mensaje=Error al intentar agregar OT');
      }})
      })
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.delete('/ordenMtto:?',(req,res)=>{
  //Eliminar orden de trabajo
  if (req.session.loggedin && req.session.rol=="Mantenimiento") {
    connectToDatabase((error, conexion) => {
      if (error) {
        logError('Error de conexión a la base de datos: ' + error.message);
        return res.status(500).send('Error de conexión a la base de datos');
      }
      let id = req.body.id;
    

      const sql = `DELETE FROM ordentrabajo WHERE idOrden = ${id}`
      conexion.query(sql,(error,filas)=>{
        conexion.release();
        res.redirect(`mtto?mensaje=Se elimino correctamente la OT Nro ${id}`)
      })
      })
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.put('/editarOrden',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Mantenimiento") {
    connectToDatabase((error, conexion) => {
      if (error) {
        logError('Error de conexión a la base de datos: ' + error.message);
        return res.status(500).send('Error de conexión a la base de datos');
      }
      let sqlupdate = "UPDATE `ordentrabajo` SET `detecto`=?,`avisar`=?, `equipo`=?,`fecha`=?,`turno`=?,`paradaProceso`=?,`prioridad`=?,`tipoParada`=?,`horaInicio`=?,`horaFin`=?,`descripcion`=? WHERE `idOrden`=?";
      let resultados = [
          req.body.detecto,
          req.body.avisar,
          req.body.equipo,
          req.body.fecha,
          req.body.turno,
          req.body.paradaProceso,
          req.body.prioridad,
          req.body.tipoParada,
          req.body.horaInicio,
          req.body.horaFin,
          req.body.descripcion,
          parseInt(req.body.idOrden),
          
      ];
      
      conexion.query(sqlupdate,resultados,(error,rows)=>{
        conexion.release();
          if(!error){
         
          res.redirect(`mtto?mensaje=Se modifico correctamente la Orden Nro ${req.body.idOrden}`)
          }else{
            res.redirect(`mtto?mensaje=Error al intentar modificar!`)
             
          }
        })
      })  
        
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/verOrden',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Mantenimiento") {
    connectToDatabase((error, conexion) => {
      if (error) {
        logError('Error de conexión a la base de datos: ' + error.message);
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
          res.render('./users/mantenimiento/verOrden',{
              result:result,
              f:f,
              hi:hi,
              hf:hf,
              fecha_cierre: fecha(result[0].fecha_cierre),
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

module.exports = router;