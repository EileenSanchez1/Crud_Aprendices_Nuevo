const registroMiddleware = (req, res, next) => {
    const fecha = new Date().toISOString();
    const tiempoMilisegundos = Date.now();

    console.log(`[Historial Peticiones] ${fecha} , ${req.method}, ${req.url} ${req.ip}`);

    res.on('finish', () => {
        const duracion = Date.now() - tiempoMilisegundos;
        console.log(fecha, 'respuesta' ,res.statusCode, duracion + 'ms');
    });

    next();
};

module.exports = registroMiddleware;