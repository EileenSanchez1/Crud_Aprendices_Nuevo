const express = require('express');
const app = express();
require('dotenv/config');
const port = process.env.PUERTO || 5000;

// Librerías para archivos y rutas
const sistemaArchivo = require('fs');
const ruta = require('path');
const multer = require('multer');

// Configurar almacenamiento de imágenes con Multer
const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'misimagenes/');
  },
  filename: (req, file, cb) => {
    // Asigna un nombre único usando la fecha + extensión original
    const extension = ruta.extname(file.originalname);
    cb(null, `${Date.now()}${extension}`);
  }
});

const cargar = multer({ storage: almacenamiento });

// Servir la carpeta de imágenes de forma pública
app.use('/misimagenes', express.static(ruta.join(__dirname, 'misimagenes')));

// Body-parser para interpretar JSON
app.use(express.json());

// Importar la validación e integrarla
const { validarAprendiz } = require('./validaciones/validar.js');
app.use(validarAprendiz);

const rutaArchivoJson = ruta.join(__dirname, 'listaDatos.json');

// Ruta Raíz
app.get('/', (req, res) => {
    res.send('API RESTFUL - CRUD Aprendices');
});

// Endpoint para listar todos los aprendices
app.get('/api/aprendices', (req, res) => {
    sistemaArchivo.readFile(rutaArchivoJson, "utf-8", (error, datos) => {
        if (error) {
            return res.status(500).json({ Error: "Error al leer el archivo, conexion bd" });
        }
        try {
            const listaAprendices = JSON.parse(datos);
            res.json(listaAprendices);
        } catch (errorParse) {
            res.status(500).json({ Error: "Error al procesar el archivo JSON" });
        }
    });
});

// Endpoint para buscar un aprendiz por DNI
app.get('/api/aprendices/:dni', (req, res) => {
    const dni = parseInt(req.params.dni);

    sistemaArchivo.readFile(rutaArchivoJson, "utf-8", (error, datos) => {
        if (error) {
            return res.status(500).json({ Error: "Error al leer el archivo, conexion bd" });
        }
        try {
            const listaAprendices = JSON.parse(datos);
            const aprendizEncontrado = listaAprendices.find(aprendiz => aprendiz.dni === dni);

            if (!aprendizEncontrado) {
                return res.status(404).json({ Mensaje: "Aprendiz no encontrado" });
            }

            res.json(aprendizEncontrado);
        } catch (errorParse) {
            res.status(500).json({ Error: "Error al procesar el archivo JSON" });
        }
    });
});

// Endpoint para crear un aprendiz con foto opcional (Multer) y DNI autoincremental
app.post("/api/aprendices", cargar.single("imagen"), (req, res) => {
    const datoAprendiz = req.body;

    // Asignar ruta de imagen o valor por defecto
    datosAprendiz.avatar = req.file ? `/misimagenes/${req.file.filename}` : "sin imagen";

    sistemaArchivo.readFile(rutaArchivoJson, "utf-8", (error, datos) => {
        if (error) {
            return res.status(500).json({ Error: "Error al leer el archivo, conexion bd" });
        }
        try {
            const listaAprendices = JSON.parse(datos);

            // DNI autoincremental
            const ultimoDni = listaAprendices.reduce((max, aprendiz) => {
                const id = Number(aprendiz.dni);
                return (!isNaN(id) && id > max) ? id : max;
            }, 0);

            const nuevoAprendiz = {
                dni: ultimoDni + 1,
                ...datoAprendiz,
                avatar
            };

            listaAprendices.push(nuevoAprendiz);

            sistemaArchivo.writeFile(rutaArchivoJson, JSON.stringify(listaAprendices, null, 2), (error) => {
                if (error) {
                    return res.status(500).json({ Error: "No se puede registrar el aprendiz." });
                }
                res.status(201).json(nuevoAprendiz);
            });
        } catch (errorParse) {
            res.status(500).json({ Error: "Error al procesar el archivo JSON" });
        }
    });
});

// Endpoint para editar un aprendiz
app.put("/api/aprendices/:dni", cargar.single("imagen"), (req, res) => {
    const dni = parseInt(req.params.dni);
    const datosAprendiz = req.body;

    datosAprendiz.avatar = req.file ? `/misimagenes/${req.file.filename}` : "sin imagen";

    sistemaArchivo.readFile(rutaArchivoJson, "utf-8", (error, datos) => {
        if (error) {
            return res.status(500).json({ Error: "Error al leer el archivo, conexion bd" });
        }
        try {
            let listaAprendices = JSON.parse(datos);

            listaAprendices = listaAprendices.map(aprendiz => {
                if (aprendiz.dni === dni) {
                    const avatar = req.file ? `/misimagenes/${req.file.filename}` : aprendiz.avatar;
                    return { ...aprendiz, ...datosAprendiz, avatar, dni };
                }
                return aprendiz;
            });

            sistemaArchivo.writeFile(rutaArchivoJson, JSON.stringify(listaAprendices, null, 2), (error) => {
                if (error) {
                    return res.status(500).json({ Error: "No se puede editar el aprendiz." });
                }
                res.json({ Mensaje: "Aprendiz modificado con éxito", datosAprendiz });
            });
        } catch (errorParse) {
            res.status(500).json({ Error: "Error al procesar el archivo JSON" });
        }
    });
});

// Endpoint para eliminar un aprendiz por DNI
app.delete("/api/aprendices/:dni", (req, res) => {
    const dni = parseInt(req.params.dni);

    sistemaArchivo.readFile(rutaArchivoJson, "utf-8", (error, datos) => {
        if (error) {
            return res.status(500).json({ Error: "Error al leer el archivo, conexion bd" });
        }
        try {
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
        } catch (errorParse) {
            res.status(500).json({ Error: "Error al procesar el archivo JSON" });
        }
    });
});

// Modo de escucha del servidor
app.listen(port, () => {
    console.log(`SERVER: http://localhost:${port}`);
});