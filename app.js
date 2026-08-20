const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

//libreria para leer archivos
const sistemaArchivos = require('fs'); 
const ruta = require('path');

//generar una ruta para listaDatos.json
const rutaArchivojson = ruta.join(__dirname, 'listaDatos.json');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor inicializado correctamente');
});

//endpoint para obtener todos los aprendices
app.get('/api/aprendices', (req, res)=> {
    sistemaArchivos.readFile(rutaArchivojson, "utf-8", (error, data)=> { 
        if (error) {
            return res.status(500).json({Error: "Error al leer el archivo , conexion a la bd"}); 
        }
        const listaAprendices = JSON.parse(data); 
        res.json(listaAprendices);
    });
});

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});