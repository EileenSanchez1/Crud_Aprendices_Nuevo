const validarAprendiz = (req, res, next) => {
    // Si es GET o DELETE no se requiere body
    if (req.method === 'GET' || req.method === 'DELETE') {
        return next();
    }

    // Comprobar que req.body exista y contenga datos
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ Error: "Debe enviar la información del aprendiz en formato JSON." });
    }

    const { Nombre, Correo } = req.body;

    // 1. Validar que el Nombre sea mayor a 3 caracteres
    if (!Nombre || Nombre.trim().length <= 3) {
        return res.status(400).json({ Error: "El nombre es obligatorio y debe tener más de 3 letras." });
    }

    // 2. Validar el formato del Correo con Expresión Regular
    const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!Correo || !regexCorreo.test(Correo)) {
        return res.status(400).json({ Error: "Debe ingresar un correo electrónico válido." });
    }

    next();
};

module.exports = { validarAprendiz };