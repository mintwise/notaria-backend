import express from "express";
import {
  getCLientsByRut,
  getPdf,
  getPdfs,
  deleteDocument,
  getPdfsFilter,
  getDocumentsRutFilter,
  // testingEndpoint,
} from "../controller/pdfController.js";
import {
  autenticar,
  nuevoPassword,
  registrar,
} from "../controller/userController.js";
import checkAuth from "../middleware/authMiddleware.js";
const router = express.Router();
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage,
// });
// area publica
router.post("/registrar", registrar);
router.post("/login", autenticar);
router.post("/reset-password/:id", nuevoPassword);

router.route("/document/:id").get(checkAuth, getPdf);
router.route("/documents-by-rut-or-name").get(checkAuth, getPdfsFilter);
router.route("/list-document-contrato").get(checkAuth, getDocumentsRutFilter);
router.get("/documents", checkAuth, getPdfs);
router.get("/get-clients-by-rut", checkAuth, getCLientsByRut);
router.delete("/document/:id", checkAuth, deleteDocument);

// router.post("/document-test", upload.single("file"), testingEndpoint);


export default router;
