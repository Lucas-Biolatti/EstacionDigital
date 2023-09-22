var express = require('express');
var router = express.Router();
var conexion = require('../db/db')
var session = require('express-session')

router.use((req,res,next)=>{
    if (req.session.loggedin && req.session.rol=="Admin") {
        next()
    
    } else {
      res.render('login',{
        mensaje:`No esta logeado o no tiene autorizacion para este sitio. Verifique sus credenciales`});
    }
})

router.get('/usuarios',(req,res)=>{
    res.render('./Admin/usuarios')
})

module.exports = router;