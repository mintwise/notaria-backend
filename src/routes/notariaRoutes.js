import express from "express";
import { addDocument, changeStateConglomerado, generarConglomeradoTemplate } from "../controller/notariaController.js";
import checkAuth from "../middleware/authMiddleware.js";
import multer from "multer";

const routerNotaria = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
});
// area privada enfocada en la notaria
routerNotaria.route("/document").post(checkAuth, upload.single("file"), addDocument);
routerNotaria.route("/conglomeradoTemplate/:id").post(checkAuth, generarConglomeradoTemplate);
routerNotaria.route("/certificate/:id").post(checkAuth, upload.single("file"), changeStateConglomerado)


export default routerNotaria;
