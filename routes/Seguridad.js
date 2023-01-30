var express = require('express');
var router = express.Router();
var conexion = require('../db/db')

router.get('/accidentes',(req,res)=>{
    if (req.session.loggedin  && req.session.rol=="Seguridad") {
      const sql = "SELECT * FROM accidentes ORDER BY idAccidente DESC"
      conexion.query(sql,(error,result)=>{
        if (!error) {
        
          req.render('Seguridad/accidentes',{
            result:result,
            nombre:`${req.session.apellido}, ${req.session.nombre}`
          })  
        }else{
          console.log(error)
        }
      })
        
    
    } else {
      res.render('login',{
      mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
    }
  })
module.exports = router;