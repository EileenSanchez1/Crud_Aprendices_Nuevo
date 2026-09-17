const {Router} = require("express")

const enrutador = Router()

enrutador.get("/", (req,res)=>{
    res.json({mensaje: "ruta de prueba 3407184"})
})

module.exports = enrutador
