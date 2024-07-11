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

const createConnection = () => {
    return mysql.createConnection({
        host: '172.16.4.199',
        user: 'lbiolatti',
        password: 'diego2015',
        database: 'EstacionDigital'
    });
};

let connection;

const connectToDatabase = (callback) => {
    if (!connection || connection.state === 'disconnected') {
        connection = createConnection();
        connection.connect((error) => {
            if (error) {
                console.error("Error de base de datos: " + error);
                return callback(error);
            }
            console.log("Conectado a la BD");
            callback(null, connection);
        });
    } else {
        callback(null, connection);
    }
};

module.exports = { connectToDatabase, connection };