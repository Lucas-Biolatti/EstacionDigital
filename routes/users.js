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
                sector:sector
               
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
      nombre:`${req.session.apellido}, ${req.session.nombre}`});    
    })
  }else{
    res.render('login')
  }
});
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
            //("mailto:horquera@polimetalruedas.com.ar?subject=Nuevo Accidente"+"-"+req.body.sector+"&body=Nombre del observador: "+req.body.nombre+"%0A"+"Fecha: "+req.body.fecha+"%0A"+"Tipo: "+req.body.tipo+"%0A"+"Descripcion: "+desc+"%0A"+"Observaciones: "+req.body.observacion+"%0A"+"%0A"+"Saludos Cordiales.")
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

// AUTONOMO
router.get('/autonomo',(req,res)=>{
  //Renderizar index de AM
  if (req.session.loggedin) {
    res.render('./users/autonomo/index',{
      nombre:`${req.session.apellido}, ${req.session.nombre}`,
    })
  }else{
    res.render('login')
  }
});

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
