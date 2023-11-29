import express from "express";
import { addDocument, changeStateConglomerado, generarConglomeradoTemplate } from "../controller/notariaController.js";
import checkAuth from "../middleware/authMiddleware.js";

const routerNotaria = express.Router();

// area privada enfocada en la notaria
routerNotaria.route("/document").post(checkAuth, addDocument);
routerNotaria.route("/conglomeradoTemplate/:id").post(checkAuth, generarConglomeradoTemplate);
routerNotaria.route("/certificate/:id").post(checkAuth, changeStateConglomerado)


export default routerNotaria;
