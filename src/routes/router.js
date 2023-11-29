import express from "express";
import {
  getPdf,
  getPdfs,
} from "../controller/pdfController.js";
import { autenticar, nuevoPassword, registrar } from "../controller/userController.js";
import checkAuth from "../middleware/authMiddleware.js";
const router = express.Router();
// area publica
router.post('/registrar',registrar);
router.post('/login', autenticar);
router.post('/reset-password/:id', nuevoPassword)
// area publica documentos
router.route("/document/:id").get(checkAuth, getPdf);
router.get("/documents",checkAuth, getPdfs);

export default router;


