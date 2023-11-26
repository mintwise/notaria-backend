import express from "express";
import {
  getCLientsByRut,
  getPdf,
  getPdfs,
  getDocumentsCertificate
} from "../controller/pdfController.js";
import { autenticar, nuevoPassword, registrar } from "../controller/userController.js";
import checkAuth from "../middleware/authMiddleware.js";
const router = express.Router();
// area publica
router.post('/registrar',registrar);
router.post('/login', autenticar);
router.post('/reset-password/:id', nuevoPassword)
// area publica documentos
router.route("/document/:id").get(getPdf);
router.get("/documents",checkAuth, getPdfs);
router.get("/clients/:rut", getCLientsByRut);

// testing route por auth
router.get("/documents-by-state", checkAuth, getDocumentsCertificate);

export default router;


