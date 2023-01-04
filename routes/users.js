var express = require('express');
const url = require('url');
var router = express.Router();
var conexion = require('../db/db')
/* GET users listing. */
function fecha(x){
  let f = new Date(x);
  let fecha = f.getDate()+"/"+f.getMonth()+"/"+f.getUTCFullYear();
  return fecha;
}
//MANTENIMIENTO
router.get('/mtto:?',(req,res)=>{
  //lISTAR SECTORES Y REDIRIGIR
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
      console.log(mensaje) 
    })
  }else{
    res.render('login')
  }
})
router.get('/ordenMtto',(req,res)=>{
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
  
})
router.get('/listarOrden:?',(req,res)=>{
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
            console.log("Error de conexion");
        }
    })
  } else {
    res.render('login')
  }
})
router.post('/ordenMtto',(req,res)=>{
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
})
router.delete('/ordenMtto:?',(req,res)=>{
  if (req.session.loggedin) {
    let id = req.body.id;
    let idSector = req.body.idSector;

    const sql = `DELETE FROM ordentrabajo WHERE idOrden = ${id}`
    conexion.query(sql,(error,filas)=>{
      res.redirect(`mtto?mensaje=Se elimino correctamente la OT Nro ${id}`)
    })
  } else {
    res.render('login')
  }
})


//SYSO
router.get('/syso', (req,res)=>{
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
})

// AUTONOMO
router.get('/autonomo',(req,res)=>{
  if (req.session.loggedin) {
    res.render('./users/autonomo/index',{
      nombre:`${req.session.apellido}, ${req.session.nombre}`,
    })
  }else{
    res.render('login')
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
})
router.get('/sector',(req,res)=>{
  let sql1 = "SELECT * FROM sector";
  conexion.query(sql1,(error,result,files)=>{
      if(!error){
         res.send(result);
      }else{
          alert("No se pudo obtener los sectores");
      }
  })
})
router.get('/nomina',(req,res)=>{
  let sql1 = "SELECT * FROM nomina";
  conexion.query(sql1,(error,result,files)=>{
      if(!error){
         res.send(result);
      }else{
          alert("No se pudo obtener la nomina");
      }
  })
})

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
      else console.log("Error al conectar con BD OT")
  })
})
router.get('/tarjetas',(req,res)=>{
  const sql="select * from tarjetasAm where 1"
  conexion.query(sql,(error,fields)=>{
      if (!error) {
          res.send(fields);
      }
  })
})
module.exports = router;
