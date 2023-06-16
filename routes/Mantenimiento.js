var express = require('express');
var router = express.Router();
var conexion = require('../db/db')
const url = require('url');
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

router.get('/ordenTrabajo',(req,res)=>{
  if (req.session.loggedin  && req.session.rol=="Mantenimiento") {
    let sql1 = "SELECT * FROM sector";
                let sector = [];

                conexion.query(sql1,(error,result,files)=>{
                    if(!error){
                    
                        for(let i=0;i<result.length;i++){
                            sector.push(result[i])
                        }
                    }
                    res.render("./Mantenimiento/ordenes",{sector:sector,nombre:`${req.session.apellido}, ${req.session.nombre}`});    
                })


  }else {
      res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
    }
  
})
router.get('/ordenXSector',(req,res)=>{
  let idSector = url.parse(req.url,true).query.id;
    let sector= url.parse(req.url,true).query.nombre;
    let sql1 = "SELECT * FROM ordentrabajo WHERE sector=? AND not estado='cerrado'";
    let sql2 = "SELECT * FROM ordentrabajo WHERE NOT estado='cerrado'";
    
    
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

module.exports = router;