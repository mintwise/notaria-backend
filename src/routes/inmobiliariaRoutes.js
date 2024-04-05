import express from "express";
import {
  addDocument,
  signDocumentConglomerado,
  signDocumentTest,
} from "../controller/inmobiliariaController.js";
import {
  userCreate,
  userDelete,
  userEdit,
  userList,
  getUser,
  listDocumentGeneric,
  addDocumentGeneric,
  getDocumentGeneric,
  editDocumentGeneric,
  deleteDocumentGeneric,
} from "../controller/userInmobiliariaController.js";
import checkAuth from "../middleware/authMiddleware.js";

const routerInmobiliaria = express.Router();

// area privada enfocada en la notaria
routerInmobiliaria.route("/document").post(checkAuth, addDocument);
routerInmobiliaria
  .route("/signDocument/:id")
  .post(checkAuth, signDocumentConglomerado);
routerInmobiliaria.route("/signTest").post(checkAuth, signDocumentTest);

// user Inmobiliaria controller
routerInmobiliaria.route("/user/list").get(checkAuth, userList);
routerInmobiliaria.route("/user/:id").get(checkAuth, getUser);
routerInmobiliaria.route("/user/create").post(checkAuth, userCreate);
routerInmobiliaria.route("/user/edit/:id").put(checkAuth, userEdit);
routerInmobiliaria.route("/user/delete/:id").delete(checkAuth, userDelete);

// rutas documento genérico
routerInmobiliaria
  .route("/documentGeneric/list")
  .get(checkAuth, listDocumentGeneric);
routerInmobiliaria
  .route("/documentGeneric/create")
  .post(checkAuth, addDocumentGeneric);
routerInmobiliaria
  .route("/documentGeneric/:id")
  .get(checkAuth, getDocumentGeneric);
routerInmobiliaria
  .route("/documentGeneric/edit/:id")
  .put(checkAuth, editDocumentGeneric);
routerInmobiliaria
  .route("/documentGeneric/delete/:id")
  .delete(checkAuth, deleteDocumentGeneric);

export default routerInmobiliaria;
