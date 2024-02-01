import express from "express";
import { addDocumentApi, addDocumentFeaApi, changeStateDocumentFeaApi, getCertificatesDocuments, getToken, validateToken} from "../controller/apiController.js";
import checkAuth from "../middleware/authMiddleware.js";

const routerApi = express.Router();

// area privada enfocada en la notaria
routerApi.route("/upload-document").post(checkAuth, addDocumentApi);
routerApi.route("/upload-document-fea").post(checkAuth, addDocumentFeaApi);
routerApi.route("/update-document-fea").post(checkAuth, changeStateDocumentFeaApi);
routerApi.route("/get-certificate-document").get(checkAuth, getCertificatesDocuments)
routerApi.route("/token").post(getToken)
routerApi.route("/validate-token").get(validateToken)

export default routerApi;