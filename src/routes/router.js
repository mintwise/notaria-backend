import express from "express";
import {
  getCLientsByRut,
  getPdf,
  getPdfs,
  deleteDocument
} from "../controller/pdfController.js";
import { autenticar, nuevoPassword, registrar } from "../controller/userController.js";
import checkAuth from "../middleware/authMiddleware.js";
const router = express.Router();
// area publica
router.post('/registrar',registrar);
router.post('/login', autenticar);
router.post('/reset-password/:id', nuevoPassword)

router.route("/document/:id").get(checkAuth, getPdf);
router.get("/documents",checkAuth, getPdfs);
router.get("/get-clients-by-rut", checkAuth, getCLientsByRut)
router.delete("/document/:id", checkAuth, deleteDocument);

export default router;


