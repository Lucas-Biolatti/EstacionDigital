
const mysql = require('mysql2');

/*const pool = mysql.createPool({
    host: '172.16.4.199',
    user: 'lbiolatti',
    password: 'diego2015',
    database: 'EstacionDigital',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000, // Tiempo máximo para establecer conexión
    acquireTimeout: 30000, // Tiempo máximo para obtener una conexión del pool
    keepAliveInitialDelay: 10000, // Mantén viva la conexión
});*/
const pool = mysql.createPool({
    host: '172.16.41.49',
    user: 'lbiolatti',
    password: 'diego2015',
    database: 'EstacionDigital',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000, // Tiempo máximo para establecer conexión
    acquireTimeout: 30000, // Tiempo máximo para obtener una conexión del pool
    keepAliveInitialDelay: 10000, // Mantén viva la conexión
});
pool.on('error', (err) => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        console.error('Se perdió la conexión con la base de datos. Reintentando...', err);
    } else {
        console.error('Error inesperado en la base de datos:', err);
    }
});
setInterval(() => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error al mantener la conexión activa:', err);
        } else {
            connection.ping((pingErr) => {
                if (pingErr) {
                    console.error('Error al hacer ping a la base de datos:', pingErr);
                }
                connection.release();
            });
        }
    });
}, 300000); 
const connectToDatabase = (callback) => {
    pool.getConnection((error, connection) => {
        if (error) {
            console.error("Error al obtener la conexión de la base de datos: ", error);
            if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNRESET') {
                setTimeout(() => connectToDatabase(callback), 2000); // Reintenta la conexión después de 2 segundos
            } else {
                callback(error); // Devuelve el error si no es recuperable
            }
        } else {
            callback(null, connection);
        }
    });
};

module.exports = { connectToDatabase };