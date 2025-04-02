var express = require('express');
const { start } = require('repl');
const url = require('url');
var router = express.Router();
var conexion = require('../db/db');
const fs = require('fs');
const { connectToDatabase } = require('../db/db');
const { nextTick } = require('process');
/* GET users listing. */
function fecha(x){
  let f = new Date(x);
  let fecha = f.getDate()+"/"+f.getMonth()+"/"+f.getUTCFullYear();
  return fecha;
};
function fechaEdit(x){
  let dia = (x.getUTCDate()<10?'0':'')+x.getUTCDate();
  let mes = ((x.getMonth()+1)<10?'0':'')+(x.getMonth()+1);
  let f = x.getUTCFullYear()+"-"+mes+"-"+dia;
  return f;
}
// Función para guardar los errores en un archivo de texto
function logError(message) {
  const timestamp = new Date().toISOString();
  const errorMessage = `${timestamp} - ${message}\n`;
  
  // Escribe el error en un archivo log.txt
  fs.appendFile('log.txt', errorMessage, (err) => {
      if (err) {
          console.error('No se pudo escribir en el archivo log:', err);
      }
  });
}



module.exports = router;
