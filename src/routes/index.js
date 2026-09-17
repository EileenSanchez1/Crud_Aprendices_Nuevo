const {Router} = require("express")
const pruebaRouter = require("./pruebaRouter")
const autenticarRoute = require("./autenticarRoute")

const enrutador = Router()

enrutador.use("/rutaPrueba", pruebaRouter)
enrutador.use("/autenticar", autenticarRoute)

module.exports = enrutador
