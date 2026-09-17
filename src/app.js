require("dotenv").config()
const express = require("express");

const enrutador = require("./routes")
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", enrutador);

app.get("/", (req, res) => {
    res.send("API rest");
});

module.exports = app;