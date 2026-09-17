const jwtoken = require('jsonwebtoken');
const ingresar = (usuario, clave)=>{

    const usuarioid = {
        "usuario":"eileen",
        "clave":"eileen123"
    }

    if (usuario !== usuarioid.usuario || clave !== usuarioid.clave) {
        res.json({
            mensaje: "Usuario y/o clave incorrecto",
        });
    }

    const token = jwtoken.sign(
        {user: usuario},
        process.env.JWT_SECRET,
        {expiresIn:"1h"}
    )
    res.json({token})
}


module.exports = ingresar