var express = require('express');
var router = express.Router();
var conexion = require('../db/db')
var session = require('express-session')

/* GET home page. */
router.get('/login', function(req, res, next) {
	if(req.session.loggedin){
		res.send("Usted ya esta Logueado")
	}else{
		res.render('login');
	}
  
});

router.post('/auth', function(request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;
	// Ensure the input fields exists and are not empty
	if (username && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		conexion.query('SELECT * FROM user WHERE name = ? AND password = ?', [username, password], function(error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				request.session.loggedin = true;
				request.session.username = username;
				request.session.rol = results[0].rol;
				request.session.nombre = results[0].nombre;
				request.session.apellido = results[0].apellido;
				
				
				// Redirect to home page
				response.redirect('/');
			} else {
				response.render('login',{mensaje:'Usuario o contraseña incorrecta'});
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
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
