var express = require('express');
const { start } = require('repl');
const url = require('url');
var router = express.Router();
var conexion = require('../db/db')
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
//const nombre = `${req.session.apellido}, ${req.session.nombre}`
//MANTENIMIENTO
router.get('/mtto:?',(req,res)=>{
  //Renderizar index de Mantenimiento
  if (req.session.loggedin) {
    let sql1 = "SELECT * FROM sector";
    let sector = [];
    let mensaje = req.query.mensaje
    
    conexion.query(sql1,async (error,result,files)=>{
        if(!error){
           
            for(let i=0;i<result.length;i++){
                sector.push(result[i])
            }
         
        }
    
      await res.render("./users/mantenimiento/mtto",{sector:sector,
        nombre:`${req.session.apellido}, ${req.session.nombre}`,
      mensaje:mensaje});   
      
    })
  }else{
    res.render('login')
  }
});
router.get('/ordenMtto',(req,res)=>{
  //Renderizar formulario de orden de trabajo
  if (req.session.loggedin) {
    let idSector = url.parse(req.url,true).query.id;
    let sector = url.parse(req.url,true).query.nombre;
    let sql2 = "SELECT * FROM equipo WHERE Sector=?";
    let equipo = [];
    conexion.query(sql2,[parseInt(idSector)],(error,result,files)=>{
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
    
  } else {
    res.render('login');
  }
  
});
router.get('/listarOrden:?',(req,res)=>{
  //listado de Ordenes y sumatoria de minutos
  if (req.session.loggedin) {
    let idSector = req.query.id;
    let sector= req.query.nombre;
    let sql1 = "SELECT * FROM ordentrabajo WHERE sector=?";
    conexion.query(sql1,[sector],(error,result,files)=>{
        if(!error){
            let tiempoTotal=0
            let resultados=[];
            let abiertas=0
            let cerradas=0
            let enProceso=0
            for(let i=0;i<result.length;i++){
            let f = new Date(result[i].fecha);
            let fecha = f.getDate()+"/"+f.getMonth()+1+"/"+f.getUTCFullYear();
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
            res.send("Error de conexion:"+error);
        }
    })
  } else {
    res.render('login')
  }
});
router.get('/editarOrden',(req,res)=>{
  if (req.session.loggedin) {
    let idOrden = url.parse(req.url,true).query.idOrden;
    let idSector = url.parse(req.url,true).query.idSector;

    let sql2 = "SELECT * FROM equipo WHERE Sector=?";
    let equipo = [];
    conexion.query(sql2,[parseInt(idSector)],(error,result,files)=>{
        if(!error){
            for(let i=0;i<result.length;i++){
                equipo.push(result[i])
            }
        }
    })

    let sql = "SELECT * FROM `ordentrabajo` WHERE `idOrden`=?";
    conexion.query(sql,[parseInt(idOrden)],(error,result,file)=>{
        if(!error){
        let dia = (result[0].fecha.getUTCDate()<10?'0':'')+result[0].fecha.getUTCDate();
        let mes = ((result[0].fecha.getMonth()+1)<10?'0':'')+(result[0].fecha.getMonth()+1);
        let f = result[0].fecha.getUTCFullYear()+"-"+mes+"-"+dia;
        //hs inicio
        let diahi = (result[0].horaInicio.getUTCDate()<10?'0':'')+result[0].horaInicio.getUTCDate();
        let meshi = ((result[0].horaInicio.getMonth()+1)<10?'0':'')+(result[0].horaInicio.getMonth()+1);
        let fhi = result[0].horaInicio.getUTCFullYear()+"-"+meshi+"-"+diahi+"T"+result[0].horaInicio.getHours()+":"+((result[0].horaInicio.getMinutes()<10?'0':'')+result[0].horaInicio.getMinutes());
        
        //hs fin
        let diahf = (result[0].horaFin.getUTCDate()<10?'0':'')+result[0].horaFin.getUTCDate();
        let meshf = ((result[0].horaFin.getMonth()+1)<10?'0':'')+(result[0].horaFin.getMonth()+1);
        let fhf = result[0].horaFin.getUTCFullYear()+"-"+meshf+"-"+diahf+"T"+result[0].horaFin.getHours()+":"+((result[0].horaFin.getMinutes()<10?'0':'')+result[0].horaFin.getMinutes());
        
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
  } else {
    res.render('login')
  }
});
router.post('/ordenMtto',(req,res)=>{
  // Guardar Orden de Trabajo
  if (req.session.loggedin) {
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
      if(!error){
        res.redirect('mtto?mensaje=Se agrego exitosamente la OT');
      }else{
        res.redirect('mtto?mensaje=Error al intentar agregar OT');
    }})
  } else {
    res.render('login');
  }
});
router.delete('/ordenMtto:?',(req,res)=>{
  //Eliminar orden de trabajo
  if (req.session.loggedin) {
    let id = req.body.id;
    

    const sql = `DELETE FROM ordentrabajo WHERE idOrden = ${id}`
    conexion.query(sql,(error,filas)=>{
      res.redirect(`mtto?mensaje=Se elimino correctamente la OT Nro ${id}`)
    })
  } else {
    res.render('login')
  }
});
router.put('/editarOrden',(req,res)=>{
  if (req.session.loggedin) {
        
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
            if(!error){
           
            res.redirect(`mtto?mensaje=Se modifico correctamente la Orden Nro ${req.body.idOrden}`)
            }else{
              res.redirect(`mtto?mensaje=Error al intentar modificar!`)
               
            }
          })
  } else {
    res.render('login')
  }
});

//SYSO
router.get('/syso', (req,res)=>{
  //Renderizar index de Seguridad
  if (req.session.loggedin) {
    let sql1 = "SELECT * FROM sector";
    let sql2= "SELECT * FROM accidentes";
    let sql3= "SELECT * FROM actosinseguros";
    let sector = [];
    let accidentes=0;
    let actos=0;

     conexion.query(sql2,(error,result)=>{
        if(!error){
            for(let i=0;i<result.length;i++){
                accidentes++
            }
            
        }
    })
    conexion.query(sql3,(error,result)=>{
        if(!error){
        for(let i=0;i<result.length;i++){
            actos++
        }
    }
    })

    
    conexion.query(sql1,(error,result,files)=>{
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
  }else{
    res.render('login')
  }
});
        // Accidentes
router.get('/accidente',(req,res)=>{
   if (req.session.loggedin) {
    let idSector = req.query.id;
    let sector = req.query.sector;
   
            res.render('./users/syso/agregarAccidente',{
              idSector:idSector,
              sector:sector,
              nombre:`${req.session.apellido}, ${req.session.nombre}`});
   } else {
    res.render('login');
   }
        
});
router.post('/accidente',async (req,res)=>{
if (req.session.loggedin) {
    let sql = "INSERT INTO `accidentes`( `nombre`, `fecha`, `tipo`, `que`, `cuando`, `donde`, `quien`, `cual`, `como`, `observaciones`, `sector`) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
    await  conexion.query(sql,[
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
        
    
} else {
  res.render('login');
}
});
router.get('/listaAccidentes',(req,res)=>{
  if (req.session.loggedin) {
    let sql = "SELECT * FROM accidentes WHERE 1";
    let mensaje = req.query.mensaje;
    conexion.query(sql,(error,result)=>{
        
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
  } else {
    res.render('login')
  }
});
router.get('/editarAccidente',(req,res)=>{
  if (req.session.loggedin) {
    let idAccidente=req.query.idAccidente;
    let idSector=req.query.idSector;
    let mensaje = req.query.mensaje;
    const sql="select * FROM accidentes WHERE idAccidente=?"
    conexion.query(sql,[idAccidente],(error,result,files)=>{
        if(!error){
            let dia = (result[0].fecha.getUTCDate()<10?'0':'')+result[0].fecha.getUTCDate();
            let mes = ((result[0].fecha.getMonth()+1)<10?'0':'')+(result[0].fecha.getMonth()+1);
            let f = result[0].fecha.getUTCFullYear()+"-"+mes+"-"+dia;
            res.render('./users/syso/editarAccidente',{result:result,idAccidente:idAccidente,idSector:idSector,fecha:f,mensaje:mensaje});        
        }

    })
  } else {
    res.render('login')
  }
});
router.put('/editarAccidente',(req,res)=>{
  
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
        if (!error) {
            res.redirect(`listaAccidentes?mensaje=Se Actualizo la informacion del accidente Nro ${req.body.idAccidente}`)
            
        }
    })
   
});
router.delete('/eliminarAccidente',(req,res)=>{
  if (req.session.loggedin) {
    let id = req.body.idAccidente;
    

    const sql = `DELETE FROM accidentes WHERE idAccidente = ${id}`
    conexion.query(sql,(error,filas)=>{
      res.redirect(`listaAccidentes?mensaje=Se elimino correctamente la OT Nro ${id}`)
    })
  } else {
    res.render('login')
  }
});
        //Actos Inseguros
router.get('/actosInseguros',(req,res)=>{
  if (req.session.loggedin) {
    let idSector = req.query.id;
    let sector = req.query.sector;
   
            res.render('./users/syso/agregarActo',{
              idSector:idSector,
              sector:sector,
              nombre:`${req.session.apellido}, ${req.session.nombre}`});
        
  } else {
    res.render('login')
  }
});
router.post('/actosInseguros',(req,res)=>{
  if (req.session.loggedin) {
    
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
      
          if(!error){
            res.redirect(`syso?mensaje=Se agrego exitosamente el acto o condicion insegura en ${req.body.sector}`);
          }
          else{
            res.redirect(`syso?mensaje=No se pudo agregar el acto o condicion insegura en ${req.body.sector}`);
          }
      })
        
    
  } else {
    res.render('login');
  }
});
router.get('/listaActos',(req,res)=>{
  if (req.session.loggedin) {
    const sql = "SELECT * FROM `actosinseguros` WHERE 1";
    conexion.query(sql,(error,result,files)=>{
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
  } else {
    res.render('login')
  }
});
router.get('/editarActo',(req,res)=>{
  if (req.session.loggedin) {
    const sector= req.query.idSector;
    const idActo= req.query.idIncidente;
    const sql = "SELECT * FROM actosinseguros WHERE idActoInseguro=?"
    conexion.query(sql,[idActo],(error,results)=>{
        let f=fechaEdit(results[0].fecha);
        res.render('./users/syso/editarIncidente',{results:results,sector:sector,f:f,idActo:idActo})
    })
  } else {
    res.render('login')
  }
});
router.put('/editarActo',(req,res)=>{
  if (req.session.loggedin) {
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
          if (!error) {
              res.redirect(`listaActos?mensaje=Se actualizaron los datos del incidente o condicion Nro ${req.body.acto} del sector ${req.body.sector}`)
          }else{
            res.redirect(`listaActos?mensaje=No fue posible actualizar:${error}`)
          }
      })
        
    
  } else {
    res.render('login')
  }
})
router.delete('/eliminarActo',(req,res)=>{
  if (req.session.loggedin) {
    let id = req.body.idActoInseguro;
    const sql = `DELETE FROM actosinseguros WHERE idActoInseguro = ${id}`
    conexion.query(sql,(error,filas)=>{
      res.redirect(`listaActos?mensaje=Se elimino correctamente el acto o condicion insegura Nro ${id}`)
    })
  } else {
    res.render('login')
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
    let sector = req.query.sector;
    let id= req.query.id

    let sql="SELECT * FROM equipo WHERE sector=?"
    conexion.query(sql,[id],(error,result)=>{
        if(!error){
            res.render('./users/autonomo/agregar',{
              result:result,
              id:id,
              sector:sector,
              nombre:`${req.session.apellido}, ${req.session.nombre}`});
        }else console.error("Error al recibir datos de Equipos");
    })
  } else {
    res.render('login');
  }
});
router.post('/agregarTarjeta',(req,res)=>{
  if (req.session.loggedin) {
    
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
                if (!error) {
                    res.redirect(`autonomo?mensaje=✔Se Agrego correctamente la Tarjeta en el sector ${req.body.sector}✔`);
                }else{
                    res.redirect(`autonomo?mensaje=🚫No Se Pudo Agregar la Tarjeta🚫`)
                }
            })
   
  } else {
    res.render('login')
  }
});
router.get('/listadoTarjetas',(req,res)=>{
  if (req.session.loggedin) {
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
    
  } else {
    res.render('login');
  }
})
router.get('/editarTarjeta',(req,res)=>{
  if (req.session.loggedin) {
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
    
  } else {
    res.render('login');
  }
})

//DATOS PARA USAR CON FETCH
router.get('/items',(req,res)=>{
  const sql = "SELECT * FROM items WHERE 1"
  conexion.query(sql,(error,result)=>{
      if(!error){
          res.send(result);
          
      }
      
  })
});
router.get('/sector',(req,res)=>{
  let sql1 = "SELECT * FROM sector";
  conexion.query(sql1,(error,result,files)=>{
      if(!error){
         res.send(result);
      }else{
          alert("No se pudo obtener los sectores");
      }
  })
});
router.get('/nomina',(req,res)=>{
  let sql1 = "SELECT * FROM nomina";
  conexion.query(sql1,(error,result,files)=>{
      if(!error){
         res.send(result);
      }else{
          alert("No se pudo obtener la nomina");
      }
  })
});

router.get('/ordenes',(req,res)=>{
  const sql="SELECT * FROM ordentrabajo WHERE NOT estado='cerrado'"
  conexion.query(sql,(error,fields)=>{
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
});
router.get('/tarjetas',(req,res)=>{
  const sql="select * from tarjetasAm where 1"
  conexion.query(sql,(error,fields)=>{
      if (!error) {
          res.send(fields);
      }
  })
});
router.get('/enviarWS',(req,res)=>{
  res.render('./vistasmtto/enviarWathsapp')
});
module.exports = router;
