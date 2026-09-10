const express = require('express');
const registroMiddleware = require("./middleware/registroMiddleware");
const manejadorErrores = require("./middleware/manejadorErrores");
const autenticarToken = require("./middleware/autenticar");
const jwtoken = require('jsonwebtoken');
const { validarAprendiz } = require('./validaciones/validar.js');
const sistemaArchivo = require('fs');
const ruta = require('path');
const multer = require('multer');

require('dotenv/config');

const app = express();
const port = process.env.PUERTO || 5000;

// Parsers para el body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Registrador de peticiones HTTP
app.use(registroMiddleware);

// Configuración de Multer para archivos
const almacenamiento = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'misimagenes/');
    },
    filename: (req, file, cb) => {
        const extension = ruta.extname(file.originalname);
        cb(null, `${Date.now()}${extension}`);
    }
});

const cargar = multer({ storage: almacenamiento });

// Servir la carpeta de imágenes de forma pública
app.use('/misimagenes', express.static(ruta.join(__dirname, 'misimagenes')));

// Middleware de validación
app.use(validarAprendiz);

const rutaArchivoJson = ruta.join(__dirname, 'listaDatos.json');

// --- RUTAS DE LA API ---

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

// Endpoint para crear un aprendiz
app.post("/api/aprendices", cargar.single("imagen"), (req, res) => {
    const datosAprendiz = req.body;

    datosAprendiz.avatar = req.file ? `/misimagenes/${req.file.filename}` : "sin imagen";

    sistemaArchivo.readFile(rutaArchivoJson, "utf-8", (error, datos) => {
        if (error) {
            return res.status(500).json({ Error: "Error al leer el archivo, conexion bd" });
        }
        try {
            const listaAprendices = JSON.parse(datos);

            const ultimoDni = listaAprendices.reduce((max, aprendiz) => {
                const id = Number(aprendiz.dni);
                return (!isNaN(id) && id > max) ? id : max;
            }, 0);

            const nuevoAprendiz = {
                dni: ultimoDni + 1,
                ...datosAprendiz
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

// Ruta de prueba para simular un error
app.get("/error", (req, res, next) => {
    next(new Error("Error Provocado"));
});

//ruta protegida
app.get("/protegida", autenticarToken, (req, res) => {
    res.json({mensaje: "Esta es una ruta protegida"})
});

// Endpoint de inicio de sesion
app.post("/inicio", (req, res) => {
    const { usuario, clave } = req.body;

    const usuarioid = {
        "usuario":"eileen",
        "clave":"eileen123"
    }

    if (usuario !== usuarioid.usuario || clave !== usuarioid.clave) {
        res.json({
            mensaje: "Usuario y/o clave incorrecto",
        });
    }

    const token = jwtoken.sing(
        {user: usuario},
        process.env.JWT_SECRET,
        {expiresIn:"1h"}
    )
    res.json({token})
});

//use errores
app.use(manejadorErrores);

// Servidor
app.listen(port, () => {
    console.log(`SERVER: http://localhost:${port}`);
});