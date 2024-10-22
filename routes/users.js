var express = require('express');
const { start } = require('repl');
const url = require('url');
var router = express.Router();
var conexion = require('../db/db');
const fs = require('fs');
const { connectToDatabase } = require('../db/db');
const { nextTick } = require('process');
/* GET users listing. */
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
// Función para guardar los errores en un archivo de texto
function logError(message) {
  const timestamp = new Date().toISOString();
  const errorMessage = `${timestamp} - ${message}\n`;
  
  // Escribe el error en un archivo log.txt
  fs.appendFile('log.txt', errorMessage, (err) => {
      if (err) {
          console.error('No se pudo escribir en el archivo log:', err);
      }
  });
}


//const nombre = `${req.session.apellido}, ${req.session.nombre}`
//MANTENIMIENTO

router.get('/mtto:?',(req,res)=>{
  //Renderizar index de Mantenimiento
  if (req.session.loggedin && req.session.rol=="users") {
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
  if (req.session.loggedin && req.session.rol=="users") {
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
  if (req.session.loggedin && req.session.rol=="users") {
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
  if (req.session.loggedin && req.session.rol=="users") {
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
  if (req.session.loggedin && req.session.rol=="users") {
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
      req.body.horaFin,
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
  if (req.session.loggedin && req.session.rol=="users") {
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
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
        logError('Error de conexión a la base de datos: ' + error.message);
        return res.status(500).send('Error de conexión a la base de datos');
      }
      let sqlupdate = "UPDATE `ordentrabajo` SET `detecto`=?,`equipo`=?,`fecha`=?,`turno`=?,`paradaProceso`=?,`prioridad`=?,`tipoParada`=?,`horaInicio`=?,`horaFin`=?,`descripcion`=? WHERE `idOrden`=?";
      let resultados = [
          req.body.detecto,
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
  if (req.session.loggedin && req.session.rol=="users") {
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

//SYSO
router.get('/syso', (req,res)=>{
  //Renderizar index de Seguridad
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let sql1 = "SELECT * FROM sector";
      let sql2= "SELECT * FROM accidentes";
      let sql3= "SELECT * FROM actosinseguros";
      let sector = [];
      let accidentes=0;
      let actos=0;
  
       conexion.query(sql2,(error,result)=>{
        conexion.release();
          if(!error){
              for(let i=0;i<result.length;i++){
                  accidentes++
              }
              
          }
      })
      conexion.query(sql3,(error,result)=>{
        conexion.release();
          if(!error){
          for(let i=0;i<result.length;i++){
              actos++
          }
      }
      })
  
      
      conexion.query(sql1,(error,result,files)=>{
        conexion.release();
          if(!error){
              
              for(let i=0;i<result.length;i++){
                  sector.push(result[i])
              }
           
          }
      
      res.render("./users/syso/index",{
        sector:sector,
        accidentes:accidentes,
        actos:actos,
        nombre:`${req.session.apellido}, ${req.session.nombre}`,
        mensaje:req.query.mensaje})
        
      })
      })
    
  }else{
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
        // Accidentes
router.get('/accidente',(req,res)=>{
   if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let idSector = req.query.id;
      let sector = req.query.sector;
     
              res.render('./users/syso/agregarAccidente',{
                idSector:idSector,
                sector:sector,
                nombre:`${req.session.apellido}, ${req.session.nombre}`});
      })
    
   } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
   }
        
});
router.post('/accidente',async (req,res)=>{
if (req.session.loggedin && req.session.rol=="users") {
  connectToDatabase((error, conexion) => {
    if (error) {
        return res.status(500).send('Error de conexión a la base de datos');
    }
    let sql = "INSERT INTO `accidentes`( `nombre`, `fecha`, `tipo`, `que`, `cuando`, `donde`, `quien`, `cual`, `como`, `observaciones`, `sector`) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
     conexion.query(sql,[
      req.body.nombre,
      req.body.fecha,
      req.body.tipo,
      req.body.que,
      req.body.cuando,
      req.body.donde,
      req.body.quien,
      req.body.cual,
      req.body.como,
      req.body.observacion,
      req.body.sector],(error,row,file)=>{
        conexion.release();
      if(!error){
            let f = new Date(req.body.fecha);
            let fecha = f.getDate()+"/"+f.getMonth()+1+"/"+f.getUTCFullYear();
            let desc = req.body.que+" "+req.body.cuando+" "+req.body.donde+" "+req.body.quien+" "+req.body.cual+" "+req.body.como+".";
            
            res.redirect('syso');
        }
      
      else{
            console.log(error);
        }
    })
    })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
}
});
router.get('/listaAccidentes',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let sql = "SELECT * FROM accidentes WHERE 1";
      let mensaje = req.query.mensaje;
      conexion.query(sql,(error,result)=>{
        conexion.release();
          
          if(!error){
              let resultados=[];
          for(let i=0;i<result.length;i++){
              let f = new Date(result[i].fecha);
              let fecha = `${f.getDate()}/${f.getMonth()+1}/${f.getUTCFullYear()}`;
              
              let resultado={
                  idAccidente:result[i].idAccidente,
                  nombre:`${result[i].nombre}`,
                  fecha:fecha,
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
                  fecha_cierre:result[i].fecha_inicio,
                  cuatrom:result[i].cuatrom,
                  cincow:result[i].cincow,
                  acciones:result[i].acciones,
                  nombreSession: `${req.session.apellido}, ${req.session.nombre}`
  
              }
              resultados.push(resultado);
              
          }
              res.render('./users/syso/listadoAccidentes',{result:resultados,mensaje:mensaje});
          }else{
              console.log("Error de coneixion con la tabla accidentes");
          }
      })
      })
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/editarAccidente',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let idAccidente=req.query.idAccidente;
      let idSector=req.query.idSector;
      let mensaje = req.query.mensaje;
      const sql="select * FROM accidentes WHERE idAccidente=?"
      conexion.query(sql,[idAccidente],(error,result,files)=>{
        conexion.release();
          if(!error){
              let dia = (result[0].fecha.getUTCDate()<10?'0':'')+result[0].fecha.getUTCDate();
              let mes = ((result[0].fecha.getMonth()+1)<10?'0':'')+(result[0].fecha.getMonth()+1);
              let f = result[0].fecha.getUTCFullYear()+"-"+mes+"-"+dia;
              res.render('./users/syso/editarAccidente',{result:result,idAccidente:idAccidente,idSector:idSector,fecha:f,mensaje:mensaje});        
          }
  
      })
      })
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.put('/editarAccidente',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let sql = "UPDATE accidentes SET nombre=?,fecha=?,tipo=?,que=?, cuando=?, donde=?,quien=?, cual=?, como=?,observaciones=? WHERE idAccidente=?"
      conexion.query(sql,[
        req.body.nombre,
        req.body.fecha,
        req.body.tipo,
        req.body.que,
        req.body.cuando,
        req.body.donde,
        req.body.quien,
        req.body.cual,
        req.body.como,
        req.body.observacion,
        req.body.idAccidente],(error,rows)=>{
          conexion.release();
      if (!error) {
          res.redirect(`listaAccidentes?mensaje=Se Actualizo la informacion del accidente Nro ${req.body.idAccidente}`)
        }
  })
      })
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.delete('/eliminarAccidente',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let id = req.body.idAccidente;
    

      const sql = `DELETE FROM accidentes WHERE idAccidente = ${id}`
      conexion.query(sql,(error,filas)=>{
        conexion.release();
        res.redirect(`listaAccidentes?mensaje=Se elimino correctamente la OT Nro ${id}`)
      })
      })
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
        //Actos Inseguros
router.get('/actosInseguros',(req,res)=>{
  
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let idSector = req.query.id;
      let sector = req.query.sector;
     
              res.render('./users/syso/agregarActo',{
                idSector:idSector,
                sector:sector,
                nombre:`${req.session.apellido}, ${req.session.nombre}`});
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.post('/actosInseguros',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let sql = "INSERT INTO `actosinseguros`(`nombre`, `fecha`, `tipo`, `subTipo`, `descripcion`, `propuesta`, `accion`, `sector`) VALUES (?,?,?,?,?,?,?,?)";
      conexion.query(sql,[
        req.body.nombre,
        req.body.fecha,
        req.body.tipo,
        req.body.subtipo,
        req.body.descripcion,
        req.body.propuesta,
        req.body.accion,
        req.body.sector],(error,row,file)=>{
          conexion.release();
        
            if(!error){
              res.redirect(`syso?mensaje=Se agrego exitosamente el acto o condicion insegura en ${req.body.sector}`);
            }
            else{
              res.redirect(`syso?mensaje=No se pudo agregar el acto o condicion insegura en ${req.body.sector}`);
            }
        })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/listaActos',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      const sql = "SELECT * FROM `actosinseguros` WHERE 1";
      conexion.query(sql,(error,result,files)=>{
        conexion.release();
          if(!error){
              let resultados=[];
              for(let i=0;i<result.length;i++){
                  let f = new Date(result[i].fecha);
                  let fecha = `${f.getDate()}/${f.getMonth()+1}/${f.getUTCFullYear()}`;
                  let resultado={
                      idActoInseguro:result[i].idActoInseguro,
                      observador:result[i].nombre,
                      sector:result[i].sector,
                      fecha:fecha,
                      tipo:result[i].tipo,
                      subTipo:result[i].subTipo,
                      descripcion:result[i].descripcion,
                      propuesta:result[i].propuesta,
                      accion:result[i].accion,
                      estado:result[i].estado,
                      fecha_cierre:result[i].fecha_cierre,
                      accion_def:result[i].accion_def,
                      evidencia:result[i].evidencia
                  }
                  resultados.push(resultado)
              }
              res.render("./users/syso/listadoActos",{
                actosInseguros:resultados,
                nombre: `${req.session.apellido}, ${req.session.nombre}`,
                mensaje:req.query.mensaje});
          }else{
              console.log(error)
          }
      })
      })
   
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/editarActo',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      const sector= req.query.idSector;
      const idActo= req.query.idIncidente;
      const sql = "SELECT * FROM actosinseguros WHERE idActoInseguro=?"
      conexion.query(sql,[idActo],(error,results)=>{
        conexion.release();
          let f=fechaEdit(results[0].fecha);
          res.render('./users/syso/editarIncidente',{results:results,sector:sector,f:f,idActo:idActo})
      })
      })
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.put('/editarActo',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let sql="UPDATE actosinseguros SET nombre=?, fecha=?, tipo=?, subTipo=?, descripcion=?, propuesta=?, accion=? WHERE idActoInseguro=?"
      conexion.query(sql,[
        req.body.nombre,
        req.body.fecha,
        req.body.tipo,
        req.body.subtipo,
        req.body.descripcion,
        req.body.propuesta,
        req.body.accion,
        req.body.acto],(error,rows)=>{
          conexion.release();
              if (!error) {
                  res.redirect(`listaActos?mensaje=Se actualizaron los datos del incidente o condicion Nro ${req.body.acto} del sector ${req.body.sector}`)
              }else{
                res.redirect(`listaActos?mensaje=No fue posible actualizar:${error}`)
              }
          })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})
router.delete('/eliminarActo',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let id = req.body.idActoInseguro;
      const sql = `DELETE FROM actosinseguros WHERE idActoInseguro = ${id}`
      conexion.query(sql,(error,filas)=>{
        conexion.release();
        res.redirect(`listaActos?mensaje=Se elimino correctamente el acto o condicion insegura Nro ${id}`)
      })
      })
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})

// AUTONOMO
router.get('/autonomo',(req,res)=>{
  //Renderizar index de AM
  if (req.session.loggedin) {
    
    res.render('./users/autonomo/index',{
      nombre:`${req.session.apellido}, ${req.session.nombre}`,
      mensaje: req.query.mensaje
    })
  }else{
    res.render('login')
  }
});
router.get('/agregarTarjeta',(req,res)=>{
  if (req.session.loggedin) {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let sector = req.query.sector;
      let id= req.query.id
  
      let sql="SELECT * FROM equipo WHERE sector=?"
      conexion.query(sql,[id],(error,result)=>{
        conexion.release();
          if(!error){
              res.render('./users/autonomo/agregar',{
                result:result,
                id:id,
                sector:sector,
                nombre:`${req.session.apellido}, ${req.session.nombre}`});
          }else console.error("Error al recibir datos de Equipos");
      })
      })
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.post('/agregarTarjeta',(req,res)=>{
  if (req.session.loggedin) {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      const sql="INSERT INTO tarjetasAm (sector,fecha,tipo,detecto,equipo,prioridad,disposicion,descripcion) VALUES (?,?,?,?,?,?,?,?)";
    
      conexion.query(sql,[
        req.body.sector,
        req.body.fecha,
        req.body.tipo,
        req.body.detecto,
        req.body.equipo,
        req.body.prioridad,
        req.body.disposicion,
        req.body.descripcion],(error)=>{
          conexion.release();
          if (!error) {
              res.redirect(`autonomo?mensaje=✔Se Agrego correctamente la Tarjeta en el sector ${req.body.sector}✔`);
          }else{
              res.redirect(`autonomo?mensaje=🚫No Se Pudo Agregar la Tarjeta🚫`)
          }
      })

      })
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/listadoTarjetas',(req,res)=>{
  if (req.session.loggedin) {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let sector = req.query.sector;
      const sql = "select * from tarjetasAm where sector=? and tipo='Mantenimiento Autonomo'"
      const sql1 = "select * from tarjetasAm where sector=? and tipo='Mantenimiento Profesional'"
       let resultadosazul=[];
       let pendAzul=0;
       let cerradoAzul=0;
       let pendRojo=0;
       let cerradoRojo=0;
       let resultadosrojo=[];
       //listado azules por sector
      conexion.query(sql,[sector],(error,results)=>{
        conexion.release();
         if (!error) {
         
              for (let i = 0; i < results.length; i++) {
                  let f=fecha(results[i].fecha)
                  let fcierre = fecha(results[i].fecha_cierre);
                  if (results[i].estado == "Cerrado") {
                      cerradoAzul++;
                  }else pendAzul++;
                  resultado = {
                      id:results[i].id,
                      fecha:f,
                      sector:results[i].sector,
                      tipo:results[i].tipo,
                      detecto:results[i].detecto,
                      equipo:results[i].equipo,
                      prioridad:results[i].prioridad,
                      disposicion:results[i].disposicion,
                      descripcion:results[i].descripcion,
                      estado:results[i].estado,
                      fecha_cierre:fcierre,
                      ejecutor:results[i].ejecutor,
                      acciones:results[i].acciones,
                      duracion:results[i].duracion
                  }
  
              resultadosazul.push(resultado) 
              }
              
          } else console.log(error);
      })
      //listado Rojas por sector
      conexion.query(sql1,[sector],(error,results)=>{
        conexion.release();
          if (!error) {
              
          
               for (let i = 0; i < results.length; i++) {
                   let f=fecha(results[i].fecha);
                   let fcierre=fecha(results[i].fecha_cierre);
                   if (results[i].estado == "Cerrado") {
                      cerradoRojo++;
                  }else pendRojo++;
                   resultado = {
                       id:results[i].id,
                       fecha:f,
                       sector:results[i].sector,
                       tipo:results[i].tipo,
                       detecto:results[i].detecto,
                       equipo:results[i].equipo,
                       prioridad:results[i].prioridad,
                       disposicion:results[i].disposicion,
                       descripcion:results[i].descripcion,
                       estado:results[i].estado,
                       fecha_cierre:fcierre,
                       ejecutor:results[i].ejecutor,
                       acciones:results[i].acciones,
                       duracion:results[i].duracion
                   }
   
               resultadosrojo.push(resultado) 
               }
               res.render('./users/autonomo/listar',{
                   rojo:resultadosrojo,
                   azul:resultadosazul,
                   pendAzul:pendAzul,
                   cerradoAzul:cerradoAzul,
                   sector:sector,
                   pendRojo:pendRojo,
                   cerradoRojo:cerradoRojo,
                   nombre:`${req.session.apellido}, ${req.session.nombre}`});
           } else console.log(error);
       })
      })
    
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/editarTarjeta',(req,res)=>{
  if (req.session.loggedin) {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let id = req.query.id;
      let sector = req.query.sector;
      let sql = "select * from tarjetasAm where id=?"
      let equipos = [];
      conexion.query("select * from equipo where sectorDesc = ?",[sector],(error,resultados)=>{
         for (let i = 0; i < resultados.length; i++) {
              equipos.push(resultados[i]);    
          }
      });
      conexion.query(sql,[id],(error,results)=>{
        conexion.release();
          if (!error) {
              
              let f = fechaEdit(results[0].fecha);
              let fecha_cierre = fecha(results[0].fecha_cierre);
              res.render('./users/autonomo/editarTarjeta',{
                  results:results,
                  id:id,
                  fecha:f,
                  fecha_cierre:fecha_cierre,
                  sector:sector,
                  equipos:equipos,
                  })
          }
      })
      
      })
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.put('/editarTarjeta',(req,res)=>{
  if (req.session.loggedin) {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      const sql="UPDATE tarjetasAm SET sector=?, fecha=?, tipo=?, detecto=?, equipo=?, prioridad=?, disposicion=?, descripcion=? WHERE id=?"
    
      conexion.query(sql,[
        req.body.sector,
        req.body.fecha,
        req.body.tipo,
        req.body.detecto,
        req.body.equipo,
        req.body.prioridad,
        req.body.disposicion,
        req.body.descripcion,
        req.body.id],(error)=>{
          conexion.release();
          if (!error) {
              res.redirect(`autonomo?mensaje=✔Tarjeta Nro${req.body.id} Modificada Exitosamente✔`);
          }else{
            res.redirect(`autonomo?mensaje=🚫No se pudo modificar Tarjeta🚫`);
          }
      })
  
      })
    
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.delete('/eliminarTarjeta',(req,res)=>{
  if (req.session.loggedin) {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let id= req.body.id;
      const sql = "DELETE FROM tarjetasAm WHERE id=?"
        conexion.query(sql,[id],(error)=>{
          conexion.release();
          if (!error) {
            res.redirect(`autonomo?mensaje=✔Tarjeta Nro${req.body.id} Eliminada Exitosamente✔`);
        }else{
          res.redirect(`autonomo?mensaje=🚫No se pudo eliminar Tarjeta🚫`);
          
        }
        })
      })
    
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})

//DATOS PARA USAR CON FETCH
router.get('/items',(req,res)=>{
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
  
});
router.get('/sector',(req,res)=>{
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
  
});
router.get('/nomina',(req,res)=>{
  connectToDatabase((error, conexion) => {
    if (error) {
        return res.status(500).send('Error de conexión a la base de datos');
    }
    let sql1 = "SELECT * FROM nomina";
    conexion.query(sql1,(error,result,files)=>{
      conexion.release();
        if(!error){
           res.send(result);
        }else{
            alert("No se pudo obtener la nomina");
        }
    })
    })
  
});
router.get('/ordenes',(req,res)=>{
  if (req.session.loggedin) {
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
                      accion:'<a href="/resolverOrden?idOrden='+fields[i].idOrden+'">Cerrar</a>'
    
                  }
                  data.push(dato)
                  
              }
              
              res.send(data);
          }
          else res.send("Error:"+error)
      })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
  
});
router.get('/tarjetas',(req,res)=>{
  const sql="select * from tarjetasAm where 1"
  conexion.query(sql,(error,fields)=>{
    conexion.release();
      if (!error) {
          res.send(fields);
      }
  })
});

// MODULOS DE PRODUCCION

//INYECCION
function fechabd(x){
  let f = new Date(x);
  let mes= f.getMonth()+Number(1);
  let fecha = `${f.getUTCFullYear()}-${mes}-${f.getDate()};`
  return fecha;
}
router.get('/produccion',(req,res)=>{
  const sector = req.session.sector;
  res.render(`./users/produccion/${sector}/index`)
});
router.get('/produccion/inyeccion/moldes', function(req, res, next) {
  res.render('users/produccion/inyeccion/moldes');
});
router.get('/produccion/inyeccion/modelos', function(req, res, next) {
  res.render('users/produccion/inyeccion/modelos', { title: 'Express' });
});
router.get('/produccion/inyeccion/moldesEntreFecha',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users" && req.session.sector=="inyeccion") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let fini=req.query.fini;
      let ffin=req.query.ffin;
      let molde=req.query.molde;
    
      let sql = `CALL moldeEntreFecha('${fini}','${ffin}','${molde}')`
      conexion.query(sql,(err,result)=>{
        conexion.release();
        if (!err) {
          res.send(result[0]);
        }else{
          console.log(err);
        }
      })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/produccion/inyeccion/modeloEntreFecha',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users" && req.session.sector =="inyeccion") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let fini=req.query.fini;
      let ffin=req.query.ffin;
      let molde=req.query.molde;
    
      let sql = `CALL modeloEntreFecha('${fini}','${ffin}','${molde}')`
      conexion.query(sql,(err,result)=>{
        conexion.release();
        if (!err) {
          res.send(result[0]);
        }else{
          console.log(err);
        }
      })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/produccion/inyeccion/tornillos', async (req, res) => {
  if (req.session.loggedin && req.session.rol === "users" && req.session.sector==="inyeccion") {
    connectToDatabase(async (error, conexion) => {
      if (error) {
        return res.status(500).send('Error de conexión a la base de datos');
      }
      try {
        const sql1 = 'SELECT * FROM tornillosInyectoras';
        const result = await new Promise((resolve, reject) => {
          conexion.query(sql1, (err, result) => {
            if (err) {
              console.error(err);
              reject(err);
            } else {
              resolve(result);
            }
          });
        });

        const promises = result.map((e) => {
          return new Promise((resolve, reject) => {
            conexion.query(`CALL tornillosMaquina("${fechabd(e.ftornillo)}", "${e.gima}")`, (error, result1) => {
              conexion.release();              
              if (!error && result1[0][0].GIMA === e.gima) {
                let r = {
                  Gima: result1[0][0].GIMA,
                  Golpes: result1[0][0].golpes,
                  ftornillo: fecha(result1[0][0].ftornillo),
                  observaciones: result1[0][0].observaciones,
                };
                resolve(r);
              } else {
                console.error(error);
                resolve(null); // Resolver con null en caso de error para que no rompa Promise.all
              }
            });
          });
        });

        const resultsArray = await Promise.all(promises);
        const validResults = resultsArray.filter((result) => result !== null);

        res.render('users/produccion/inyeccion/tornillos', { resultados: validResults });
      } catch (error) {
        console.error(error);
        res.status(500).send('Error en la consulta');
      } finally {
        conexion.release(); // Asegúrate de liberar la conexión
      }
    });
  } else {
    res.render('login', {
      mensaje: `No está logeado o no tiene autorización para este sitio. Verifique sus credenciales`,
    });
  }
});
router.post('/produccion/inyeccion/editarTornillo',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let fecha=req.body.fecha;
      let observaciones = req.body.observaciones;
      let gima=req.body.gima;
      const sql = `UPDATE tornillosInyectoras SET ftornillo='${fecha}', observaciones='${observaciones}' WHERE gima='${gima}'` ;
      conexion.query(sql,(err,rows)=>{
        conexion.release();
        if (!err) {
          res.redirect('produccion/inyeccion/tornillos');
        }else{
          res.send("Error al tratar de realizar la actualizacion de los datos:"+err)
        }
      })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/produccion/inyeccion/contadores',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          logError('Error de conexión a la base de datos'+message);
          return res.status(500).send('Error de conexión a la base de datos');
      }
        let fecha = req.query.fecha;
        const sql = `SELECT 
                      id,
                      fecha,
                      turno,
                      supervisor,
                      gima,
                      Control_1,
                      Control_2,
                      Control_3,
                      Control_4,
                      (Golpes1+Golpes2+Golpes3+Golpes4) AS golpes,
                      (Scrap_isla1+Scrap_isla2+Scrap_isla3+Scrap_isla4) AS isla,
                      (Scrap_RX1+Scrap_RX2+Scrap_RX3+Scrap_RX4) AS rx,
                      (Cantidad_Ok1+Cantidad_Ok2+Cantidad_Ok3+Cantidad_Ok4) AS ok,
                      scrap,
                      obs
                    FROM contadoresInyeccion 
                    WHERE FECHA = '${fecha}'`
        conexion.query(sql,(error,result)=>{
          conexion.release();
          if(!error){
            res.send(result);
            
          }else{res.send(error)}
        })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})
//Registros de produccion Inyeccion

router.get('/produccion/inyeccion/rp21',(req,res)=>{
  if (req.session.loggedin && req.session.rol === "users" && req.session.sector==="inyeccion") {
    res.render('users/produccion/inyeccion/rp21',{nombre:`${req.session.apellido}, ${req.session.nombre}`})
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
  
})
router.get('/produccion/inyeccion/prod_dia', function(req, res, next) {
  if (req.session.loggedin && req.session.rol=="users" && req.session.sector=="inyeccion") {
    connectToDatabase((error, conexion) => {
      if (error) {

          return res.status(500).send('Error de conexión a la base de datos');
      }
        let fecha = req.query.fecha;
        const sql = `CALL prod_dia('${fecha}')`
        conexion.query(sql,(error,result)=>{
         
          conexion.release();
          if (!error) {
            res.send(result[0]);
          }else{
           
            res.send(error)
          }
        })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/produccion/inyeccion/prod_dia_maquina', function(req, res, next) {
  if (req.session.loggedin && req.session.rol=="users" && req.session.sector=="inyeccion") {
    connectToDatabase((error, conexion) => {
      if (error) {

          return res.status(500).send('Error de conexión a la base de datos');
      }
        let fecha = req.query.fecha;
        const sql = `CALL prod_dia_maquina('${fecha}')`
        conexion.query(sql,(error,result)=>{
         
          conexion.release();
          if (!error) {
            res.send(result[0]);
          }else{
           
            res.send(error)
          }
        })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/produccion/inyeccion/produccionDia', function(req, res, next) {
  if (req.session.loggedin && req.session.rol=="users" && req.session.sector =="inyeccion") {
    res.render('users/produccion/inyeccion/report_prod_dia');
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
 
});
router.get('/produccion/inyeccion/datosUp', (req,res)=>{
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          logError('Error de conexión a la base de datos'+error.message);
          return res.status(500).send('Error de conexión a la base de datos');
      }
        let sql = "SELECT * FROM datos_UP"
        conexion.query(sql,(error, result)=>{
          conexion.release();
          if (!error) {
            res.json(result)
          }else{
            logError('Error en consulta '+error.message);
            res.send(error)
          }
        })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})
router.get('/produccion/inyeccion/up',(req, res)=>{
  if (req.session.loggedin && req.session.rol=="users") {
    res.render('users/produccion/inyeccion/up_register')
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})
router.get('/produccion/inyeccion/tecnicoInyeccion',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          logError('Error de conexión a la base de datos ' +error.message)
          return res.status(500).send('Error de conexión a la base de datos');
      }
        let fini=req.query.fini;
        let ffin = req.query.ffin;
        let sql = `CALL tecnicoEntreFecha('${fini}','${ffin}')`;
        conexion.query(sql,(error,result)=>{
          conexion.release();
          if (!error) {
            res.send(result[0]);
          }else{
            res.send(error)
          }
        })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/produccion/inyeccion/supervisorInyeccion',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          logError('Error de conexión a la base de datos ' +error.message)
          return res.status(500).send('Error de conexión a la base de datos');
      }
        let fini=req.query.fini;
        let ffin = req.query.ffin;
        let sql = `CALL supervisorEntreFecha('${fini}','${ffin}')`;
        conexion.query(sql,(error,result)=>{
          conexion.release();
          if (!error) {
            res.send(result[0]);
          }else{
            res.send(error)
          }
        })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/produccion/inyeccion/operadorInyeccion',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          logError('Error de conexión a la base de datos ' +error.message)
          return res.status(500).send('Error de conexión a la base de datos');
      }
        let fini=req.query.fini;
        let ffin = req.query.ffin;
        let sql = `CALL operadorEntreFecha('${fini}','${ffin}')`;
        conexion.query(sql,(error,result)=>{
          conexion.release();
          if (!error) {
            res.send(result[0]);
          }else{
            res.send(error)
          }
        })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/produccion/inyeccion/tecnicos',(req,res)=>{
  res.render('users/produccion/inyeccion/tecnicosEntreFecha')
})
module.exports = router;
