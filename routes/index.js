var express = require('express');
var router = express.Router();
//var conexion = require('../db/db')
const { connectToDatabase } = require('../db/db');
var session = require('express-session')

/* GET home page. */
router.get('/login', function(req, res, next) {
	if(req.session.loggedin){
		res.send("Usted ya esta Logueado")
	}else{
		res.render('login');
	}
  
});
/*function requireAuth(req, res, next) {
    if (!req.session.loggedin) {
        req.session.returnTo = req.originalUrl; // Guarda la URL actual
        req.flash('error', 'Por favor, inicia sesión para acceder.');
        return res.redirect('/login');
    }
    next();
}

// Aplica el middleware requireAuth a las rutas que requieren autenticación
router.get('/ruta-protegida', requireAuth, (req, res) => {
    res.send('Esta es una ruta protegida.');
});
*/
router.post('/auth', function(request, response) {
    // Capturar los campos de entrada
    let username = request.body.username;
    let password = request.body.password;

    // Asegurarse de que los campos de entrada existan y no estén vacíos
    if (username && password) {
        // Conectar a la base de datos y refrescar la conexión si es necesario
        connectToDatabase((error, conexion) => {
            if (error) {
                return response.status(500).send('Error de conexión a la base de datos');
            }

            // Ejecutar la consulta SQL que seleccionará la cuenta de la base de datos según el nombre de usuario y la contraseña especificados
            const sql = 'SELECT * FROM user WHERE name = ? AND password = ?';
            const params = [username, password];

            conexion.query(sql, params, (error, results) => {
                conexion.release();
                // Si hay un problema con la consulta, mostrar el error
                if (error) {
                    console.error("Error en la consulta a la base de datos: " + error);
                    return response.status(500).send('Error en la consulta a la base de datos');
                }

                // Si la cuenta existe
                if (results.length > 0) {
                    // Autenticar al usuario
                    request.session.loggedin = true;
                    request.session.username = username;
                    request.session.rol = results[0].rol;
                    request.session.nombre = results[0].nombre;
                    request.session.apellido = results[0].apellido;

                    // Redirigir a la página de inicio
					//const returnTo = request.session.returnTo || '/';
					//delete request.session.returnTo;
					//response.redirect(returnTo);
                    response.redirect('/');
                } else {
                    response.render('login', { mensaje: 'Usuario o contraseña incorrecta' });
                }
                response.end();
                
            });
           
        });
    } else {
        response.send('Por favor ingrese nombre de usuario y contraseña');
        response.end();
        
    }
});


router.get('/', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
		// Output username
		
		response.render('./'+request.session.rol+'/index',{nombre:`${request.session.apellido}, ${request.session.nombre}`});
		
		}
					else {
					// Not logged in
					response.render('login');
						}
					response.end();
});

router.get('/logout',async (req,res)=>{
	await req.session.destroy();
	await res.redirect('/login');
	
})
module.exports = router;
