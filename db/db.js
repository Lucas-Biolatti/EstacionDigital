/*const mysql = require('mysql2');
const conexion = mysql.createConnection({
    host:'172.16.4.199',
    user:'lbiolatti',
    password:'diego2015',
    database:'EstacionDigital'
})

conexion.connect((error)=>{
    if(error){
        console.error("Error de base de datos:"+error);
        return
    }
    console.log("Conectado a la BD");
})
module.exports = conexion
*/
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: '172.16.4.199',
    user: 'lbiolatti',
    password: 'diego2015',
    database: 'EstacionDigital',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const connectToDatabase = (callback) => {
    pool.getConnection((error, connection) => {
        if (error) {
            console.error("Error al obtener la conexión de la base de datos: " + error);
            return callback(error);
        }
        callback(null, connection);
    });
};

module.exports = { connectToDatabase };