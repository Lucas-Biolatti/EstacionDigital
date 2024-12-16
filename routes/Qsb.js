var express = require('express');
const url = require('url');
var router = express.Router();
//var conexion = require('../db/db');
const { connectToDatabase } = require('../db/db');
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

function fecha(x){
  let f = new Date(x);
  let fecha = f.getDate()+"/"+f.getMonth()+"/"+f.getUTCFullYear();
  return fecha;
};
function fechaEdit(x) {
  let fecha=new Date(x)
  let dia = (fecha.getDate() < 10 ? '0' : '') + fecha.getDate();
  let mes = ((fecha.getMonth() + 1) < 10 ? '0' : '') + (fecha.getMonth() + 1);
  let f = fecha.getFullYear() + "-" + mes + "-" + dia;
  return f;
}



//const nombre = `${req.session.apellido}, ${req.session.nombre}`
//MANTENIMIENTO
router.get('/',(req,res)=>{
    if (req.session.loggedin && req.session.rol=="Qsb") {
        res.render('./Qsb/index')
    
    } else {
      res.render('login',{
        mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
    }
});
router.get('/dashboard',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Qsb") {
     
    res.render('./Qsb/dashboard',{sector:req.query.sector})
  

} else {
  res.render('login',{
    mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
}
})
router.get('/datosMes',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Qsb") {
    let mes = req.query.mes;
    let year = req.query.year;
    const sql = `SELECT * FROM indicadores WHERE (MONTH(fecha) = ${mes} AND YEAR(fecha) = ${year}) OR sector = "Calidad" ORDER BY sector, fecha;`
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      conexion.query(sql,(error,result)=>{
        conexion.release();
        if (!error) {
          res.send(result);
        }else{
          res.send("ERROR......:"+error);
        }
      })
    });  
     
  

} else {
  res.render('login',{
    mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
}
})
//Sectores 
router.get('/iny',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Qsb") {
     
      res.render('./Qsb/iny',{sector:req.query.sector})
    
  
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/cc',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Qsb") {
     
      res.render('./Qsb/cc',{sector:req.query.sector})
    
  
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/mec',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Qsb") {
     
      res.render('./Qsb/mec',{sector:req.query.sector})
    
  
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/vent',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Qsb") {
     
      res.render('./Qsb/vent',{sector:req.query.sector})
    
  
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/pint',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Qsb") {
     
      res.render('./Qsb/pint',{sector:req.query.sector})
    
  
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/log',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Qsb") {
     
      res.render('./Qsb/log',{sector:req.query.sector})
    
  
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});


//Auxiliares
router.get('/datos',(req,res)=>{
  //Lleva los datos a los indicadores de cada area, trabaja con fetch
  if (req.session.loggedin && req.session.rol=="Qsb") {
    let sector = req.query.sector;
    let mes = req.query.mes;
    let year = req.query.year;

    const sql = `SELECT * FROM indicadores where sector="${sector}" AND MONTH(fecha)="${mes}" AND YEAR(fecha)="${year}" ORDER BY fecha`
    
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      conexion.query(sql,(error,result)=>{
        conexion.release();
        if (!error) {
          res.send(result);
        }else{
          res.send("ERROR......:"+error);
        }
      })
    });
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});
router.get('/datosSector',(req,res)=>{
  
  if (req.session.loggedin && req.session.rol=="Qsb") {
    connectToDatabase((error, conexion) => {
        if (error) {
            return res.status(500).send('Error de conexión a la base de datos');
        }

        const sql = "SELECT sector_resp,COUNT(id) AS cantidad FROM planAccionQsb WHERE estado != 'Completado' GROUP BY sector ORDER BY cantidad desc";
        conexion.query(sql, (error, results) => {
          conexion.release();
            if (!error) {
                res.send(results);
            } else {
                res.send(error);
            }
        });
    });
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})
router.get('/datosPlan', (req, res) => {
  if (req.session.loggedin && req.session.rol=="Qsb") {
    connectToDatabase((error, conexion) => {
        if (error) {
            return res.status(500).send('Error de conexión a la base de datos');
        }

        const sql = "SELECT * FROM planAccionQsb ORDER BY CASE WHEN estado = 'No iniciado' THEN 1 WHEN estado = 'En proceso' THEN 2 WHEN estado = 'Completado' THEN 3 END,fecha;";
        conexion.query(sql, (error, results) => {
          conexion.release();
            if (!error) {
                res.send(results);
            } else {
                res.send(error);
            }
        });
    });
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
});

router.post("/agregaraccion", upload.single('sc_laca'), (req, res) => {
  if (req.session.loggedin && req.session.rol == "Qsb") {
      connectToDatabase((error, conexion) => {
          if (error) {
              return res.status(500).send('Error de conexión a la base de datos');
          }

          let fecha = req.body.fecha;
          let sector = req.body.sector;
          let scrap = req.body.scrap ? parseFloat(req.body.scrap) : null;
          let accidentes = req.body.accidentes ? req.body.accidentes : null;
          let c_programa = req.body.c_programa ? parseFloat(req.body.c_programa) : null;
          let disponibilidad = req.body.disponibilidad ? parseFloat(req.body.disponibilidad) : null;
          let disp_molde = req.body.disp_molde ? parseFloat(req.body.disp_molde) : null;
          let observaciones = req.body.observaciones;
          let retrabajo = req.body.retrabajo ? parseFloat(req.body.retrabajo) : null;
          let ret_laca = req.body.ret_laca ? req.body.ret_laca : null;
          let sc_laca = req.file ? req.file.filename : null;  // El nombre del archivo se guarda
          let entregas = req.body.entregas ? parseFloat(req.body.entregas) : null;
          let hsReal = req.body.hsReal ? req.body.hsReal : null;
          let hs_rd = req.body.hs_rd ? req.body.hs_rd : null;
          let rds_real = req.body.rds_real ? req.body.rds_real : null;
          let path = req.body.path;

          const sql = `INSERT INTO indicadores (fecha,sector,accidentes,c_programa,retrabajo,scrap,disponibilidad,disp_molde,ret_laca,sc_laca,entregas,observaciones,hsReal,hs_rd,rds_real)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

          conexion.query(sql, [fecha, sector, accidentes, c_programa, retrabajo, scrap, disponibilidad, disp_molde, ret_laca, sc_laca, entregas, observaciones, hsReal, hs_rd, rds_real], (error, row) => {
              conexion.release();
              if (!error) {
                  res.redirect(`${path}?sector=${sector}`);
              } else {
                  res.send(error);
              }
          });
      });
  } else {
      res.render('login', {
          mensaje: `No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`
      });
  }
});
router.post('/actionplan',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Qsb") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
      let fecha = req.body.fecha;
      let sector = req.body.sector;
      let descripcion = req.body.descripcion;
      let accion = req.body.accion;
      let responsable = req.body.responsable;
      let sector_resp = req.body.sector_resp;
      let comentario = req.body.comentario;
      let fecha_tent = req.body.fecha_tent;
      let fecha_cierre = req.body.fecha_cierre ? req.body.fecha_cierre : null;
      let estado = req.body.estado;
      let sector1 = req.body.sector1;

      const sql = `INSERT INTO planAccionQsb (fecha,sector,descripcion,accion,responsable,sector_resp,comentario,fecha_tent,fecha_cierre,estado) VALUES ('${fecha}','${sector}','${descripcion}','${accion}','${responsable}','${sector_resp}','${comentario}','${fecha_tent}','${fecha_cierre}','${estado}');`
      conexion.query(sql,(error,rows)=>{
        conexion.release();  
        if (!error) {
          res.redirect(`/Qsb`)
          
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

router.post('/actplan',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Qsb") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
    let id = req.body.id;
    let fecha = req.body.fecha;
    let sector = req.body.sector;
    let descripcion = req.body.descripcion;
    let accion = req.body.accion;
    let responsable = req.body.responsable;
    let sector_resp = req.body.sector_resp;
    let comentario = req.body.comentario;
    let fecha_tent = req.body.fecha_tent;
    let fecha_cierre = req.body.fecha_cierre ? req.body.fecha_cierre : null;
    let estado = req.body.estado;
    let sector1 = req.body.sector1;
    const sql = `UPDATE planAccionQsb SET fecha="${fecha}",sector="${sector}",descripcion="${descripcion}" ,accion="${accion}" ,responsable="${responsable}" ,sector_resp="${sector_resp}" ,comentario="${comentario}" ,fecha_tent="${fecha_tent}" ,fecha_cierre="${fecha_cierre}" ,estado="${estado}"  WHERE id=${id};`
    conexion.query(sql,(error,row)=>{
      conexion.release();
      if (!error) {
        res.redirect(`/Qsb`)
      }else(res.send(error));
    })
  })
  } else {
    res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
  }
})
router.get('/editarIndicador',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Qsb") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
  let id = req.query.id;
  const sql = `SELECT * FROM indicadores WHERE id=${id};`;
  conexion.query(sql, (error,result)=>{
    conexion.release();
    if (!error) {
      let datos={
        'id':result[0].id,
        'fecha': fechaEdit(result[0].fecha),
        'sector': result[0].sector,
        'scrap': result[0].scrap,
        'accidentes': result[0].accidentes,
        'c_programa': result[0].c_programa,
        'disponibilidad': result[0].disponibilidad,
        'disp_molde': result[0].disp_molde,
        'observaciones': result[0].observaciones,
        'retrabajo': result[0].retrabajo,
        'ret_laca': result[0].ret_laca,
        'sc_laca': result[0].sc_laca,
        'entregas': result[0].entregas,
        'path': result[0].path,
        'hsReal':result[0].hsReal,
        'hs_rd':result[0].hs_rd,
        'rds_real':result[0].rds_real,
      }
      console.log(datos)
      res.render('./Qsb/editarIndicador',{result:datos, id:id})
      
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
router.post('/editarIndicador',(req,res)=>{
  if (req.session.loggedin && req.session.rol=="Qsb") {
    connectToDatabase((error, conexion) => {
      if (error) {
          return res.status(500).send('Error de conexión a la base de datos');
      }
  let id = req.body.id;
  let fecha=req.body.fecha;
  let sector=req.body.sector;
  let scrap=req.body.scrap;
  let accidentes=req.body.accidentes;
  let c_programa=req.body.c_programa;
  let disponibilidad=req.body.disponibilidad;
  let disp_molde=req.body.disp_molde;
  let observaciones=req.body.observaciones;
  let retrabajo=req.body.retrabajo;
  let ret_laca=req.body.ret_laca;
  let sc_laca=req.body.sc_laca;
  let entregas=req.body.entregas;
  let path=req.body.path;
  let hsReal = req.body.hsReal;
  let hs_rd = req.body.hs_rd;
  let rds_real = req.body.rds_real;
  const sql = `UPDATE indicadores SET fecha="${fecha}",sector="${sector}",accidentes=${accidentes},c_programa=${c_programa},retrabajo=${retrabajo},scrap=${scrap},disponibilidad=${disponibilidad},disp_molde=${disp_molde},ret_laca=${ret_laca},sc_laca=${sc_laca},entregas=${entregas},observaciones="${observaciones}",hsReal=${hsReal},hs_rd=${hs_rd},rds_real=${rds_real} WHERE id=${id};`
  conexion.query(sql,(error,row)=>{
    conexion.release();
    if (!error) {
      res.redirect(path);
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
