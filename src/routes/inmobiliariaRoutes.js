import express from "express";
import { addDocument, signDocumentConglomerado, signDocumentTest } from "../controller/inmobiliariaController.js";

const routerInmobiliaria = express.Router();

// area privada enfocada en la notaria
routerInmobiliaria.route("/document").post(addDocument);
routerInmobiliaria.route("/signDocument/:id").post(signDocumentConglomerado);
routerInmobiliaria.route("/signTest").post(signDocumentTest)
export default routerInmobiliaria;