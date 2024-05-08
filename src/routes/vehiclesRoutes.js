import express from "express";
import multer from 'multer';
import {
  listDocumentGeneric,
  addDocumentGeneric,
  getDocumentGeneric,
  editDocumentGeneric,
  deleteDocumentGeneric,
  addDocumentApi,
} from "../controller/vehiclesController.js";
import checkAuth from "../middleware/authMiddleware.js";

const routerVehicles = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
});
// rutas para documentos motorizados
routerVehicles.route("/add").post(checkAuth, upload.single('file'), addDocumentApi);
// rutas documento genérico
routerVehicles
  .route("/list")
  .get(checkAuth, listDocumentGeneric);
routerVehicles
  .route("/create")
  .post(checkAuth, upload.single('file'), addDocumentGeneric);
routerVehicles
  .route("/")
  .get(checkAuth, getDocumentGeneric);
routerVehicles
  .route("/edit")
  .put(checkAuth, upload.single('file'), editDocumentGeneric);
routerVehicles
  .route("/delete")
  .delete(checkAuth, deleteDocumentGeneric);


//API TESTING
routerVehicles
.route("/add-document-api")
.post(checkAuth, upload.single('file'), addDocumentApi);

export default routerVehicles;