import express from "express";
import { addDocument, changeStateConglomerado, generarConglomeradoTemplate } from "../controller/notariaController.js";

const routerNotaria = express.Router();

// area privada enfocada en la notaria
routerNotaria.route("/document").post(addDocument);
routerNotaria.route("/conglomeradoTemplate/:id").post(generarConglomeradoTemplate);
routerNotaria.route("/certificate/:id").post(changeStateConglomerado)


export default routerNotaria;
