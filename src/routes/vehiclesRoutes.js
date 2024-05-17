import express from "express";
import multer from "multer";
import {
  listDocumentPromesa,
  addDocumentPromesa,
  getDocumentPromesa,
  editDocumentPromesa,
  deleteDocumentPromesa,
} from "../controller/vehiclesController.js";
import checkAuth from "../middleware/authMiddleware.js";

const routerVehicles = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
});
// rutas documento genérico
routerVehicles.route("/list").get(checkAuth, listDocumentPromesa);
routerVehicles
  .route("/create")
  .post(checkAuth, upload.single("file"), addDocumentPromesa);
routerVehicles.route("/").get(checkAuth, getDocumentPromesa);
routerVehicles
  .route("/edit")
  .put(checkAuth, upload.single("file"), editDocumentPromesa);
routerVehicles.route("/delete").delete(checkAuth, deleteDocumentPromesa);


export default routerVehicles;
