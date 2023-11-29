import express from "express";
import { addDocument, signDocumentConglomerado, signDocumentTest } from "../controller/inmobiliariaController.js";
import  checkAuth  from "../middleware/authMiddleware.js";

const routerInmobiliaria = express.Router();

// area privada enfocada en la notaria
routerInmobiliaria.route("/document").post(checkAuth, addDocument);
routerInmobiliaria.route("/signDocument/:id").post(checkAuth, signDocumentConglomerado);
routerInmobiliaria.route("/signTest").post(checkAuth, signDocumentTest)
export default routerInmobiliaria;