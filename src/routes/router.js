import express from "express";
import {
  getCLientsByRut,
  getPdf,
  getPdfs,
} from "../controller/pdfController.js";
import { autenticar, nuevoPassword, registrar } from "../controller/userController.js";
import checkAuth from "../middleware/checkAuth.js";

const router = express.Router();

// area publica
router.post('/',registrar);
router.post('/login', autenticar);
router.post('/reset-password', nuevoPassword)
// area publica documentos
router.route("/document/:id").get(getPdf);
router.get("/documents", getPdfs);
router.get("/clients/:rut", getCLientsByRut);

export default router;


