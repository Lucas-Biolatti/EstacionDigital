var express = require('express');
const { start } = require('repl');
const url = require('url');
var router = express.Router();
var conexion = require('../db/db');
const fs = require('fs');
const { connectToDatabase } = require('../db/db');
const { nextTick } = require('process');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
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
router.post('/agregarTarjeta', upload.single('foto'), (req, res) => {
  if (req.session.loggedin) {
    connectToDatabase((error, conexion) => {
      if (error) {
        return res.status(500).send('Error de conexión a la base de datos');
      }

      const sql = "INSERT INTO tarjetasAm (sector, fecha, tipo, detecto, equipo, prioridad, disposicion, descripcion, foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

      conexion.query(sql, [
        req.body.sector,
        req.body.fecha,
        req.body.tipo,
        req.body.detecto,
        req.body.equipo,
        req.body.prioridad,
        req.body.disposicion,
        req.body.descripcion,
        req.file ? req.file.filename : null
      ], (error) => {
        conexion.release();
        if (!error) {
          res.redirect(`autonomo?mensaje=✔Se Agrego correctamente la Tarjeta en el sector ${req.body.sector}✔`);
        } else {
          res.redirect(`autonomo?mensaje=🚫No Se Pudo Agregar la Tarjeta🚫`);
        }
      });
    });
  } else {
    res.render('login', {
      mensaje: `No está logeado o no tiene autorización para este sitio. Verifique sus credenciales`
    });
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
});



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
  if (req.session.loggedin && req.session.rol=="users" || req.session.rol=="gerencia") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
        const sql="select * from tarjetasAm where 1"
  conexion.query(sql,(error,fields)=>{
    conexion.release();
      if (!error) {
          res.send(fields);
      }else{{
        console.log(error);
      }}
  })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
  
});
router.get('/montadores',(req,res)=>{
  connectToDatabase((error, conexion) => {
    if (error) {
        return res.status(500).send('Error de conexión a la base de datos');
    }
    const sql="select * from montadores where 1"
    conexion.query(sql,(error,fields)=>{
      conexion.release();
        if (!error) {
            res.send(fields);
        }else{
          res.send(error)
        }
    })

    })
  
});
router.get('/modelos',(req,res)=>{
  connectToDatabase((error, conexion) => {
    if (error) {
        return res.status(500).send('Error de conexión a la base de datos');
    }
    let sql1 = "SELECT * FROM modelos";
    conexion.query(sql1,(error,result,files)=>{
      conexion.release();
        if(!error){
           res.send(result);
        }else{
            alert("No se pudo obtener los modelos");
        }
    })
    })
  
});
router.get('/codigos_mecanizado',(req,res)=>{
  connectToDatabase((error, conexion) => {
    if (error) {
        return res.status(500).send('Error de conexión a la base de datos');
    }
    let sql1 = "SELECT * FROM codigoParada_mecanizado";
    conexion.query(sql1,(error,result,files)=>{
      conexion.release();
        if(!error){
           res.send(result);
        }else{
            alert("No se pudo obtener los codigos");
        }
    })
    })
  
});
router.get('/tablaDiaria_mec',(req,res)=>{
  connectToDatabase((error, conexion) => {
    if (error) {
        return res.status(500).send('Error de conexión a la base de datos');
    }
    let sql1 = `call tablaDiaria_mec("${req.query.fecha}")`;
    conexion.query(sql1,(error,result,files)=>{
      conexion.release();
        if(!error){
           res.send(result[0]);
        }else{
            alert("No se pudo obtener datos de la tabla:"+error);
        }
    })
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
  res.render(`./users/produccion/${sector}/index`,{nombre:`${req.session.apellido}, ${req.session.nombre}`})
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
                    FROM contadoresInyeccion_p 
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
router.get('/produccion/inyeccion/editrp21',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let maquina = req.query.maquina;
      let id = req.query.id;
      let ci = req.query.ci;
      
      //traer los valores del ultimo contador
      const sql = `SELECT id,contador_final4, Modelo4, Kit4, TMat4, TNI4, TNS4 FROM contadoresInyeccion_p WHERE GIMA = '${maquina}' ORDER BY FECHA DESC, ID DESC LIMIT 1 OFFSET 1;`;
      const sql2 = `SELECT * FROM contadoresInyeccion_p WHERE id=${id}`;

      conexion.query(sql2, (error, result1) => {
        if (error) {
          conexion.release();
          console.error(error);
          return res.status(500).send("Error en la consulta");
        }

        console.log(result1[0].contador_inicial1);
        
        if (result1[0].contador_inicial1 === null) {
          conexion.query(sql, (error, result2) => {
            conexion.release();
            if (error) {
              console.error(error);
              return res.status(500).send("Error en la consulta");
            }
            
            console.log(result2);
            res.render('users/produccion/inyeccion/editrp21', { result2:result2 });
          });
        } else {
          conexion.release();
          console.log(result1);
          res.render('users/produccion/inyeccion/editrp21', { result2: result1 });
        }
      });
      
      })
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
router.get('/avisos',(req,res)=>{
  if (req.session.loggedin) {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
        let sql = 'SELECT * FROM Avisos'
        conexion.query(sql,(error,result)=>{
          conexion.release();
          if (!error) {
            res.send(result);
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
router.post('/produccion/inyeccion/iniciar-turno', (req, res) => {
  if (req.session.loggedin && req.session.rol=="users") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      const { fecha, turno, supervisor, machines } = req.body;

      machines.forEach(async (machine) => {
        const { status, output } = machine;

    
        await conexion.query(   
           
          'INSERT INTO contadoresInyeccion_p (fecha, turno, supervisor, gima) VALUES (?, ?, ?, ?)',
          [fecha, turno, supervisor, machine],
          (error, results) => {
            conexion.release();
            if (error) {
              console.error('Error al insertar en la base de datos:', error);
              return res.status(500).json({ message: 'Error en la inserción de datos' });
            }
              
            
          }
        );
        
      });
    
      res.render('users/produccion/inyeccion/rp21',{nombre:`${req.session.apellido}, ${req.session.nombre}`,fecha:fecha})
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
  
});
router.get('/produccion/inyeccion/montaje',(req,res)=>{
  res.render('users/produccion/inyeccion/ordenMontaje')
})

//MECANIZADO
router.get('/produccion/mecanizado/regProd',(req,res)=>{
  if (req.session.loggedin && req.session.rol === "users" && req.session.sector==="mecanizado" ||req.session.rol=="gerencia") {
    res.render('users/produccion/mecanizado/regProd',{nombre:`${req.session.apellido}, ${req.session.nombre}`})
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
  
});
router.post('/produccion/mecanizado/iniciarTurno',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users" && req.session.sector=="mecanizado") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }

      let fecha = req.body.fecha;
      let turno = req.body.turno;
      let supervisor = req.body.supervisor;
      let operador = req.body.operador;
      let maquina = req.body.maquina;
      let modelo = req.body.modelo ? req.body.modelo : null;
      let kit = req.body.kit ? req.body.kit : null;
      let molde = req.body.molde ? req.body.molde : null;
      let tiempo_prog = req.body.tiempo_prog ? req.body.tiempo_prog : null;
      let programadas = req.body.programadas ? req.body.programadas : null;

      let aprobadas = req.body.aprobadas ? req.body.aprobadas : null;
      let op_int = req.body.op_int ? req.body.op_int : null;
      let scrap = req.body.scrap ? req.body.scrap : null
      const sql = `INSERT INTO regProd_mecanizado (fecha,turno,maquina,operador,supervisor,modelo1,kit1,molde,tiempo_prog,programadas,aprobadas,op_int,scrap) VALUES('${fecha}','${turno}','${maquina}','${operador}','${supervisor}','${modelo}','${kit}','${molde}',${tiempo_prog},${programadas},${aprobadas},${op_int},${scrap})`
      conexion.query(sql,(error)=>{
        conexion.release();
        if (!error) {
          res.render('users/produccion/mecanizado/regProd',{nombre:`${req.session.apellido}, ${req.session.nombre}`})
        } else{
          res.send(error)
        }
      }) 

      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})
router.get('/produccion/mecanizado/reg_prod_fecha',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users" && req.session.sector=="mecanizado" ||req.session.rol=="gerencia") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
        let fecha = req.query.fecha
        let sql = `call regProd_mec('${fecha}')`;
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
})
router.get('/produccion/mecanizado/editRegistro',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users" && req.session.sector=="mecanizado" ||req.session.rol=="gerencia") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
        let id = req.query.id;
        let sql = `select * from regProd_mecanizado where id=${id}`;
        conexion.query(sql,(error,result)=>{
          conexion.release();
          let f = fechaEdit(result[0].fecha);
          if (!error) {
            res.render('users/produccion/mecanizado/editRegistro',{nombre:`${req.session.apellido}, ${req.session.nombre}`,result:result,fecha:f})
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
router.post('/produccion/mecanizado/editRegistro',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users" && req.session.sector=="mecanizado") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
        //Variables
        let id = req.body.id;
let fecha = req.body.fecha;
let turno = req.body.turno;
let supervisor = req.body.supervisor;
let maquina = req.body.maquina;
let operador = req.body.operador;
let observaciones = req.body.observaciones ? req.body.observaciones : null;

// Página 2: Control 1
let modelo = req.body.modelo ? req.body.modelo : null;
let kit = req.body.kit ? req.body.kit : null;
let tiempo_prog = req.body.tiempo_prog ? req.body.tiempo_prog : 120;
let programadas = req.body.programadas ? req.body.programadas : 0;
let aprobadas = req.body.aprobadas ? req.body.aprobadas : 0;
let op_int = req.body.op_int ? req.body.op_int : 0;
let scrap = req.body.scrap ? req.body.scrap : 0;

// Página 3: Control 2
let modelo2 = req.body.modelo2 ? req.body.modelo2 : null;
let kit2 = req.body.kit2 ? req.body.kit2 : null;
let tiempo_prog2 = req.body.tiempo_prog2 ? req.body.tiempo_prog2 : 120;
let programadas2 = req.body.programadas2 ? req.body.programadas2 : 0;
let aprobadas2 = req.body.aprobadas2 ? req.body.aprobadas2 : 0;
let op_int2 = req.body.op_int2 ? req.body.op_int2 : 0;
let scrap2 = req.body.scrap2 ? req.body.scrap2 : 0;

// Página 4: Control 3
let modelo3 = req.body.modelo3 ? req.body.modelo3 : null;
let kit3 = req.body.kit3 ? req.body.kit3 : null;
let tiempo_prog3 = req.body.tiempo_prog3 ? req.body.tiempo_prog3 : 120;
let programadas3 = req.body.programadas3 ? req.body.programadas3 : 0;
let aprobadas3 = req.body.aprobadas3 ? req.body.aprobadas3 : 0;
let op_int3 = req.body.op_int3 ? req.body.op_int3 : 0;
let scrap3 = req.body.scrap3 ? req.body.scrap3 : 0;

// Página 5: Control 4
let modelo4 = req.body.modelo4 ? req.body.modelo4 : null;
let kit4 = req.body.kit4 ? req.body.kit4 : null;
let tiempo_prog4 = req.body.tiempo_prog4 ? req.body.tiempo_prog4 : 120;
let programadas4 = req.body.programadas4 ? req.body.programadas4 : 0;
let aprobadas4 = req.body.aprobadas4 ? req.body.aprobadas4 : 0;
let op_int4 = req.body.op_int4 ? req.body.op_int4 : 0;
let scrap4 = req.body.scrap4 ? req.body.scrap4 : 0;

//Moldes concatenados
let molde = req.body.molde ? req.body.molde : null;
let molde2 = req.body.molde2 ? req.body.molde2 : null;
let molde3 = req.body.molde3 ? req.body.molde3 : null;
let molde4 = req.body.molde4 ? req.body.molde4 : null;

const sql = ` UPDATE regProd_mecanizado SET fecha = ?,turno = ?,supervisor = ?,maquina = ?,operador = ?,observaciones = ?,modelo1 = ?,kit1 = ?,tiempo_prog = ?,programadas = ?,
    aprobadas = ?,op_int = ?,scrap = ?,modelo2 = ?,kit2 = ?,tiempo_prog2 = ?,programadas2 = ?,aprobadas2 = ?,op_int2 = ?,scrap2 = ?,modelo3 = ?,kit3 = ?,
    tiempo_prog3 = ?,programadas3 = ?,aprobadas3 = ?,op_int3 = ?,scrap3 = ?,modelo4 = ?,kit4 = ?,tiempo_prog4 = ?,programadas4 = ?,aprobadas4 = ?,op_int4 = ?,
    scrap4 = ?, molde = ?, molde2 = ?, molde3 = ?, molde4 = ? WHERE id = ?;`;
    const values = [
      fecha, turno, supervisor, maquina, operador, observaciones,
      modelo, kit, tiempo_prog, programadas, aprobadas, op_int, scrap,
      modelo2, kit2, tiempo_prog2, programadas2, aprobadas2, op_int2, scrap2,
      modelo3, kit3, tiempo_prog3, programadas3, aprobadas3, op_int3, scrap3,
      modelo4, kit4, tiempo_prog4, programadas4, aprobadas4, op_int4, scrap4, molde, molde2, molde3, molde4,
      id 
    ];
    conexion.query(sql,values,(error)=>{
      conexion.release();
      if (!error) {
        res.render('users/produccion/mecanizado/regProd',{nombre:`${req.session.apellido}, ${req.session.nombre}`,mensaje:`se actualizo correctamente el registro de la maquina ${maquina}`})
      } else{
        res.send(error)
      }
    })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})
router.get('/produccion/mecanizado/eliminarDato',(req,res)=>{
  
if (req.session.loggedin && req.session.rol=="users" && req.session.sector=="mecanizado") {
  connectToDatabase((error, conexion) => {
    if (error) {
        return res.status(500).send('Error de conexión a la base de datos');
    }
      let sql = `DELETE FROM regProd_mecanizado WHERE id=${req.query.id}`
      conexion.query(sql,(error)=>{
        conexion.release();
        res.render('users/produccion/mecanizado/regProd',{nombre:`${req.session.apellido}, ${req.session.nombre}`,mensaje:`se Elimino correctamente el registro N° ${req.query.id}`})
      })
    })
} else {
  res.render('login',{
    mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
}
})
router.post('/produccion/mecanizado/parada_mecanizado',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users" && req.session.sector=="mecanizado") {
    connectToDatabase((error, conexion) => {
      let fecha = req.body.fecha_p;
  let turno = req.body.turno_p;
  let maquina = req.body.maquina_p;
  let desde = req.body.desde;
  let hasta = req.body.hasta ?  req.body.hasta : null;
  let descripcion = req.body.descripcion;
  let tiempo = req.body.tiempo ? req.body.tiempo : 0; // Esto podría ser calculado si no se incluye en el formulario
  let idRegProd = req.body.id_regProd;
  let obs = req.body.obs ? req.body.obs : null;
  let subdesc = req.body.subdescripcion ? req.body.subdescripcion : null; 

  // Consulta SQL para insertar los datos
  const query = `
    INSERT INTO paradas_mecanizado (
      fecha, turno, maquina, desde, hasta, descripcion, tiempo, id_regProd, obs, subdescripcion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)
  `;

  // Ejecución de la consulta
  conexion.query(query, [fecha, turno, maquina, desde, hasta, descripcion, tiempo, idRegProd, obs,subdesc], (err, result) => {
    conexion.release();
    if (err) {
      res.send(err);
    }else{
      res.redirect(`/users/produccion/mecanizado/editRegistro?id=${idRegProd}`)
    }
    
  });

      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})
router.get('/produccion/mecanizado/paradaMaquina', (req, res) => {
  if (req.session.loggedin && req.session.rol === "users" && req.session.sector === "mecanizado" ||req.session.rol=="gerencia") {
    connectToDatabase((error, conexion) => {
      if (error) {
        return res.status(500).send('Error de conexión a la base de datos');
      }

      let idReg = req.query.idReg;

      // Validar si idReg está presente
      if (!idReg) {
        return res.status(400).send('Falta el parámetro idReg en la consulta');
      }

      let sql = `SELECT * FROM paradas_mecanizado WHERE id_regProd = ${conexion.escape(idReg)}`;

      conexion.query(sql, (error, results) => {
        conexion.release();
        if (error) {
          return res.status(500).send('Error en la consulta a la base de datos');
        }

        // Formatear resultados
        const formattedResults = results.map(row => {
          const tiempoCalculado = Math.floor((new Date(row.hasta) - new Date(row.desde)) / (1000 * 60)); // Tiempo en minutos
          return {
            id: row.id,
            id_regProd: row.id_regProd,
            fecha: new Date(row.fecha).toLocaleDateString('es-AR'), // Formatear la fecha
            maquina: row.maquina,
            desde: new Date(row.desde).toLocaleString('es-AR'), // Formatear la hora
            hasta: new Date(row.hasta).toLocaleString('es-AR'),
            turno: row.turno,
            obs: row.obs,
            tiempo: row.tiempo || tiempoCalculado, // Usar el tiempo calculado si está en 0
            descripcion: row.descripcion,
            subdescipcion:row.subdescripcion,
          };
        });

        res.json(formattedResults);
        console.log(formattedResults)
      });
    });
  } else {
    res.render('login', {
      mensaje: `No está logeado o no tiene autorización para este sitio. Verifique sus credenciales.`,
    });
  }
});
router.post('/produccion/mecanizado/editParada', (req, res) => {
  if (req.session.loggedin && req.session.rol === "users" && req.session.sector === "mecanizado") {
    connectToDatabase((error, conexion) => {
      if (error) {
        res.status(500).send("Error al conectar con la base de datos.");
        return;
      }

      const fecha = req.body.fecha_p || null;
      const turno = req.body.turno_p || null;
      const maquina = req.body.maquina_p || null;
      const desde = req.body.desde || null;
      const hasta = req.body.hasta || null;
      const descripcion = req.body.descripcion || null;
      const tiempo = req.body.tiempo || 0;
      const idRegProd = req.body.id_regProd || null; // Importante: Validar nulo explícitamente
      const obs = req.body.obs || null;
      const subdesc = req.body.subdescripcion || null;
      const id = req.body.id;

      const query = `
        UPDATE paradas_mecanizado 
        SET 
          fecha = ?,
          turno = ?,
          maquina = ?,
          desde = ?,
          hasta = ?,
          descripcion = ?,
          tiempo = ?,
          
          obs = ?,
          subdescripcion = ?
        WHERE 
          id = ?;
      `;

      const valores = [fecha, turno, maquina, desde, hasta, descripcion, tiempo, obs, subdesc, id];

     

      conexion.query(query, valores, (err, result) => {
        conexion.release();
        if (err) {
          console.error("Error al ejecutar la consulta:", err);
          res.status(500).send("Error en la consulta.");
        } else {
          res.redirect(`/users/produccion/mecanizado/editRegistro?id=${idRegProd[0]}`);
        }
      });
    });
  } else {
    res.render('login', {
      mensaje: "No está logeado o no tiene autorización para este sitio. Verifique sus credenciales."
    });
  }
});
router.get('/produccion/mecanizado/paradahs', (req, res) => {
  if (req.session.loggedin && req.session.rol === "users" && req.session.sector ==="mecanizado" ||req.session.rol=="gerencia") {
      connectToDatabase((error, conexion) => {
          if (error) {
              return res.status(500).send('Error de conexión a la base de datos');
          }
          
          let fecha = req.query.fecha
          let sql = `SELECT 
                      maquina,
                      turno,
                      descripcion,
                      subdescripcion,
                      SUM(tiempo) AS total_tiempo
                    FROM 
                      paradas_mecanizado
                    WHERE fecha='${fecha}'
                    GROUP BY 
                      maquina,turno,descripcion
                    ORDER BY 
                      maquina ASC,turno ASC`;
          conexion.query(sql,(error,result)=>{
            conexion.release();
            if (!error) {
              res.send(result)
            }else{
              res.send("Error al recuperar las paradas de maquina:" + error)
            }
          })
      });
  } else {
      res.render('login', {
          mensaje: `No está logeado o no tiene autorización para este sitio. Verifique sus credenciales.`,
      });
  }
});
router.get('/produccion/mecanizado/editParada',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users" && req.session.sector=="mecanizado") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
        let id = req.query.id
        let idRegProd = req.query.idRegProd;
        let sql = `SELECT * FROM paradas_mecanizado WHERE id=${id};`;
        conexion.query(sql,(error,result)=>{
          conexion.release();
          if (!error) {
              // hs inicio
          let diahi = (result[0].desde.getUTCDate() < 10 ? '0' : '') + result[0].desde.getUTCDate();
          let meshi = (result[0].desde.getMonth() + 1 < 10 ? '0' : '') + (result[0].desde.getMonth() + 1);
          let fhi = result[0].desde.getUTCFullYear() + "-" + meshi + "-" + diahi + "T" + 
                    (result[0].desde.getHours() < 10 ? '0' : '') + result[0].desde.getHours() + ":" + 
                    (result[0].desde.getMinutes() < 10 ? '0' : '') + result[0].desde.getMinutes();

          // hs fin
          let diahf = (result[0].hasta.getUTCDate() < 10 ? '0' : '') + result[0].hasta.getUTCDate();
          let meshf = (result[0].hasta.getMonth() + 1 < 10 ? '0' : '') + (result[0].hasta.getMonth() + 1);
          let fhf = result[0].hasta.getUTCFullYear() + "-" + meshf + "-" + diahf + "T" + 
          (result[0].hasta.getHours() < 10 ? '0' : '') + result[0].hasta.getHours() + ":" + 
          (result[0].hasta.getMinutes() < 10 ? '0' : '') + result[0].hasta.getMinutes();
              const formattedResults = result.map(row => {
              const tiempoCalculado = Math.floor((new Date(row.hasta) - new Date(row.desde)) / (1000 * 60)); // Tiempo en minutos
              return {
                id: row.id,
                id_regProd: row.id_regProd,
                fecha: fechaEdit(row.fecha), // Formatear la fecha
                maquina: row.maquina,
                
                desde: fhi, // Formatear la hora
                hasta: fhf,
                turno: row.turno,
                obs: row.obs,
                tiempo: row.tiempo || tiempoCalculado, // Usar el tiempo calculado si está en 0
                descripcion: row.descripcion,
                subdescipcion:row.subdescripcion,
              };
              console.log(formattedResults)
            });
            res.render('users/produccion/mecanizado/editParada',{result:formattedResults})
          }
        })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})
router.get('/produccion/mecanizado/eliminarParada',(req,res)=>{
  
  if (req.session.loggedin && req.session.rol=="users" && req.session.sector=="mecanizado") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
        let sql = `DELETE FROM paradas_mecanizado WHERE id=${req.query.id}`
        conexion.query(sql,(error)=>{
          conexion.release();
          res.redirect(`/users/produccion/mecanizado/editRegistro?id=${req.query.idReg}`)
        })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
  })
//Vista de Paradas
router.get('/produccion/mecanizado/paradas',function (req,res){
  if (req.session.loggedin && req.session.rol=="users" &&   req.session.sector==="mecanizado"||req.session.rol=="gerencia") {
    
      res.render('users/produccion/mecanizado/paradasmec')
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})
router.get('/produccion/mecanizado/paradas_mec',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users" &&   req.session.sector==="mecanizado"||req.session.rol=="gerencia") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
        let fini = req.query.fini;
        let ffin = req.query.ffin;
        const sql=`CALL mec_paradasEntreFecha('${fini}','${ffin}')`
        conexion.query(sql,(error,result)=>{
          conexion.release();
          if (!error) {
            res.send(result[0]);
          } else{
            res.send("Error en la consulta:" + error)
          }
        })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})
router.get('/produccion/mecanizado/paradas_desc',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users" &&   req.session.sector==="mecanizado"||req.session.rol=="gerencia") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
        let fini = req.query.fini;
        let ffin = req.query.ffin;
        const sql=`SELECT
            descripcion,
            SUM(tiempo) AS t
          FROM paradas_mecanizado
          WHERE fecha <= '${ffin}'
          AND fecha >= '${fini}'
          GROUP BY descripcion
          ORDER BY t desc`
        conexion.query(sql,(error,result)=>{
          conexion.release();
          if (!error) {
            res.send(result);
          } else{
            res.send("Error en la consulta:" + error)
          }
        })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})
router.get('/produccion/mecanizado/paradas_subdesc',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="users" &&   req.session.sector==="mecanizado"||req.session.rol=="gerencia") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
        let fini = req.query.fini;
        let ffin = req.query.ffin;
        const sql=`SELECT
            subdescripcion,
            SUM(tiempo) AS t
          FROM paradas_mecanizado
          WHERE fecha <= '${ffin}'
          AND fecha >= '${fini}'
          GROUP BY subdescripcion
          ORDER BY t desc
          LIMIT 10`
        conexion.query(sql,(error,result)=>{
          conexion.release();
          if (!error) {
            res.send(result);
          } else{
            res.send("Error en la consulta:" + error)
          }
        })
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})

//CCTT DEPOSITO
router.get('/produccion/cctt/deposito', (req, res) => {
  if (req.session.loggedin && req.session.rol=="users" || req.session.rol=="gerencia") {
    
    res.render('users/produccion/cctt/deposito')
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
 });
//estado de deposito
router.get('/produccion/cctt/pallets', (req, res) => {
  if (req.session.loggedin && req.session.rol=="users" || req.session.rol=="gerencia") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      conexion.query('SELECT * FROM pallets', (err, results) => {
        conexion.release();
        if (err) {
            res.status(500).json({ error: err });
            return;
        }
        res.json(results);
    });
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
 });
 // Agregar un pallet
router.post('/produccion/cctt/pallets', (req, res) => {
  
if (req.session.loggedin && req.session.rol=="users" || req.session.rol=="gerencia") {
  connectToDatabase((error, conexion) => {
    if (error) {
        return res.status(500).send('Error de conexión a la base de datos');
    }
    const { codigo_pieza, cantidad, fila, posicion, altura,pieza,kit } = req.body;
    conexion.query('INSERT INTO pallets (codigo_pieza, cantidad, fila, posicion, altura, pieza, kit) VALUES (?, ?, ?, ?, ?,?,?)', 
    [codigo_pieza, cantidad, fila, posicion, altura,pieza,kit], (err, result) => {
        conexion.release();
        if (err) {
            res.status(500).json({ error: err });
            return;
        }
        res.json({ id: result.insertId, message: 'Pallet agregado' });
    });
    })
} else {
  res.render('login',{
    mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
}
 
});
// Eliminar un pallet
router.delete('/produccion/cctt/pallets/:id', (req, res) => {
  if (req.session.loggedin && req.session.rol=="users" || req.session.rol=="gerencia") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      const { id } = req.params;
      conexion.query('DELETE FROM pallets WHERE id = ?', [id], (err, result) => {
        conexion.release();
          if (err) {
              res.status(500).json({ error: err });
              return;
          }
          res.json({ message: 'Pallet eliminado' });
      });
      })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
  
});

module.exports = router;
