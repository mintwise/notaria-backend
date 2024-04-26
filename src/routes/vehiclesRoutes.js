import express from "express";
import multer from 'multer';
import {
  listDocumentGeneric,
  addDocumentGeneric,
  getDocumentGeneric,
  editDocumentGeneric,
  deleteDocumentGeneric,
} from "../controller/vehiclesController.js";
import checkAuth from "../middleware/authMiddleware.js";

const routerVehicles = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
});

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

export default routerVehicles;