const express = require('express');
const app = express();
require('dotenv/config');
const port = process.env.PUERTO || 5000;

// Body-parser para interpretar JSON
app.use(express.json());

// Importar la validación e integrarla con app.use
const { validarAprendiz } = require('./validaciones/validar.js');
app.use(validarAprendiz);

// Librería para manejar archivos
const sistemaArchivo = require('fs');
const ruta = require('path');
const rutaArchivoJson = ruta.join(__dirname, 'listaDatos.json');

//Ruta Raiz
app.get('/', (req, res) => {
    res.send('API RESTFUL - CRUD Aprendices');
});

// Endpoint para listar todos los aprendices
app.get('/api/aprendices', (req, res) => {
    sistemaArchivo.readFile(rutaArchivoJson, "utf-8", (error, datos) => {
        if (error) {
            return res.status(500).json({ Error: "Error al leer el archivo, conexion bd" });
        }
        const listaAprendices = JSON.parse(datos);
        res.json(listaAprendices);
    });
});

// Endpoint para buscar/listar un aprendiz por DNI
app.get('/api/aprendices/:dni', (req, res) => {
    const dni = parseInt(req.params.dni);

    sistemaArchivo.readFile(rutaArchivoJson, "utf-8", (error, datos) => {
        if (error) {
            return res.status(500).json({ Error: "Error al leer el archivo, conexion bd" });
        }
        const listaAprendices = JSON.parse(datos);
        const aprendizEncontrado = listaAprendices.find(aprendiz => aprendiz.dni === dni);

        if (!aprendizEncontrado) {
            return res.status(404).json({ Mensaje: "Aprendiz no encontrado" });
        }

        res.json(aprendizEncontrado);
    });
});

// Endpoint para crear un aprendiz con DNI autoincremental
app.post("/api/aprendices", (req, res) => {
    const datoAprendiz = req.body;

    sistemaArchivo.readFile(rutaArchivoJson, "utf-8", (error, datos) => {
        if (error) {
            return res.status(500).json({ Error: "Error al leer el archivo, conexion bd" });
        }
        const listaAprendices = JSON.parse(datos);

        // DNI autoincremental
        const ultimoDni = listaAprendices.reduce((max, aprendiz) => {
            const id = Number(aprendiz.dni);
            return (!isNaN(id) && id > max) ? id : max;
        }, 0);

        const nuevoAprendiz = {
            dni: ultimoDni + 1,
            ...datoAprendiz
        };

        listaAprendices.push(nuevoAprendiz);

        sistemaArchivo.writeFile(rutaArchivoJson, JSON.stringify(listaAprendices, null, 2), (error) => {
            if (error) {
                return res.status(500).json({ Error: "No se puede registrar el aprendiz." });
            }
            res.status(201).json(nuevoAprendiz);
        });
    });
});

// Endpoint para editar un aprendiz
app.put("/api/aprendices/:dni", (req, res) => {
    const dni = parseInt(req.params.dni);
    const datosAprendiz = req.body;

    sistemaArchivo.readFile(rutaArchivoJson, "utf-8", (error, datos) => {
        if (error) {
            return res.status(500).json({ Error: "Error al leer el archivo, conexion bd" });
        }
        let listaAprendices = JSON.parse(datos);

        listaAprendices = listaAprendices.map(aprendiz => {
            return aprendiz.dni === dni ? { ...aprendiz, ...datosAprendiz, dni } : aprendiz;
        });

        sistemaArchivo.writeFile(rutaArchivoJson, JSON.stringify(listaAprendices, null, 2), (error) => {
            if (error) {
                return res.status(500).json({ Error: "No se puede editar el aprendiz." });
            }
            res.json(datosAprendiz);
        });
    });
});

// Endpoint para eliminar un aprendiz por DNI
app.delete("/api/aprendices/:dni", (req, res) => {
    const dni = parseInt(req.params.dni);

    sistemaArchivo.readFile(rutaArchivoJson, "utf-8", (error, datos) => {
        if (error) {
            return res.status(500).json({ Error: "Error al leer el archivo, conexion bd" });
        }
        let listaAprendices = JSON.parse(datos);

        const listaFiltrada = listaAprendices.filter(aprendiz => aprendiz.dni !== dni);

        if (listaAprendices.length === listaFiltrada.length) {
            return res.status(404).json({ Mensaje: "No se encontró el aprendiz con ese DNI" });
        }

        sistemaArchivo.writeFile(rutaArchivoJson, JSON.stringify(listaFiltrada, null, 2), (error) => {
            if (error) {
                return res.status(500).json({ Error: "No se pudo eliminar el aprendiz." });
            }
            res.json({ Mensaje: `Aprendiz con DNI ${dni} eliminado correctamente.` });
        });
    });
});

// Modo de escucha del servidor
app.listen(port, () => {
    console.log(`SERVER: http://localhost:${port}`);
});