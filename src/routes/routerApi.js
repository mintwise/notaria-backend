import express from "express";
import { addDocumentApi, getCertificatesDocuments, getToken, validateToken} from "../controller/apiController.js";
import checkAuth from "../middleware/authMiddleware.js";

const routerApi = express.Router();

// area privada enfocada en la notaria
routerApi.route("/upload-document").post(checkAuth, addDocumentApi);
routerApi.route("/get-certificate-document").get(checkAuth, getCertificatesDocuments)
routerApi.route("/token").post(getToken)
routerApi.route("/validate-token").get(validateToken)

export default routerApi;