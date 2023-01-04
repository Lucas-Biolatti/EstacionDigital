const mysql = require('mysql2');
const conexion = mysql.createConnection({
    host:'172.16.4.199',
    user:'lbiolatti',
    password:'diego2015',
    database:'EstacionDigital'
})

conexion.connect((error)=>{
    if(error){
        console.error("Error:"+error);
        return
    }
    console.log("Conectado a la BD");
})
module.exports = conexion