import express from "express";
import { addDocumentApi, getCertificatesDocuments } from "../controller/apiController.js";
import checkAuth from "../middleware/authMiddleware.js";

const routerApi = express.Router();

// area privada enfocada en la notaria
routerApi.route("/upload-document").post(checkAuth, addDocumentApi);
routerApi.route("/get-certificates-documents").get(checkAuth, getCertificatesDocuments)

export default routerApi;