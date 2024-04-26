import express from "express";
import multer from "multer";
import {
  addDocument,
  signDocumentConglomerado,
} from "../controller/inmobiliariaController.js";
import {
  userCreate,
  userDelete,
  userEdit,
  userList,
  getUser,
} from "../controller/userInmobiliariaController.js";
import checkAuth from "../middleware/authMiddleware.js";

const routerInmobiliaria = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
});

// area privada enfocada en la inmobiliaria (notaria)
routerInmobiliaria
  .route("/document")
  .post(checkAuth, upload.single("file"), addDocument);

routerInmobiliaria
  .route("/signDocument")
  .post(checkAuth, upload.single("file"), signDocumentConglomerado);

// user Inmobiliaria controller
routerInmobiliaria.route("/user/list").get(checkAuth, userList);
routerInmobiliaria.route("/user/:id").get(checkAuth, getUser);
routerInmobiliaria.route("/user/create").post(checkAuth, userCreate);
routerInmobiliaria.route("/user/edit/:id").put(checkAuth, userEdit);
routerInmobiliaria.route("/user/delete/:id").delete(checkAuth, userDelete);

export default routerInmobiliaria;
