// Modelos
import Client from "../model/Clients.js";
import documentPDF from "../model/Pdf.js";
import User from "../model/User.js";
// Helpers
import {
  generateValue,
  handleErrorResponse,
  saveDocumentPdf,
} from "../helpers/index.js";
import generarJWT from "../helpers/generarJWT.js";
// Librerías
import jwt from "jsonwebtoken";
import { PDFDocument } from "pdf-lib";
import mongoose from "mongoose";
import axios from "axios";
import { v4 } from "uuid";
import s3 from "../config/s3.js";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { compressPdf } from "../utils/converter.js";

//#region CONGLOMERADOS
const addDocumentApi = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const {
      nameResponsible,
      rutResponsible,
      emailResponsible,
      nameClient,
      rutClient,
      emailClient,
      filenameDocument,
      base64Document,
      typeDocument,
    } = req.body;
    //TODO devolver a base64 en el request body
    let url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    const filename = generateValue(filenameDocument);
    const client = await Client.findOne({ rutClient });
    if (req.user.role !== "API") {
      handleErrorResponse(
        res,
        400,
        "No tiene permisos para realizar esta acción."
      );
      return;
    }
    if (typeDocument !== "Conglomerado") {
      handleErrorResponse(
        res,
        400,
        `No puede agregar documentos de tipo ${typeDocument} en esta sección.`
      );
      return;
    }

    if (client?.documents?.length) {
      const isDuplicate = client.documents.some(
        (doc) => doc.filename === filename
      );
      if (isDuplicate) {
        handleErrorResponse(
          res,
          400,
          `Ya existe un documento con el nombre ${filename}.`
        );
        return;
      }
    }
    const newFile = await compressPdf(base64Document, filename);

    // subir documento en amazon
    const idDocument = v4();
    const urlDocument = `${url}${idDocument}`;
    // Insertar en s3
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: idDocument,
      Body: newFile,
      ContentType: "application/pdf",
    });
    await s3.send(command);
    const usuario = {
      name: nameResponsible,
      rut: rutResponsible,
      email: emailResponsible,
    };
    const cliente = {
      nameClient,
      rutClient,
      emailClient,
    };
    const newBase64 = Buffer.from(newFile).toString("base64");
    const result = await saveDocumentPdf(
      usuario,
      cliente,
      "Pendiente Firma",
      typeDocument,
      newBase64,
      urlDocument,
      idDocument,
      filename,
      "externo",
      session
    );
    if (!client) {
      let documents = [];
      documents.push({
        _id: result._id,
        filename,
        typeDocument,
      });
      const objectClient = new Client({
        nameResponsible,
        rutResponsible,
        emailResponsible,
        nameClient,
        rutClient,
        emailClient,
        documents,
      });
      await Client.create(objectClient);
      await session.commitTransaction();
      return res.status(200).json({
        status: "success",
        message: `Documento agregado correctamente.`,
        data: {
          id: objectClient.documents[0]._id,
          filename: objectClient.documents[0].filename,
          typeDocument: objectClient.documents[0].typeDocument,
        },
      });
    }
    // insertar en la bd Colección Clients
    if (client.documents.length) {
      const document = {
        _id: result._id,
        filename,
        typeDocument,
      };
      await Client.findOneAndUpdate(
        { rutClient },
        { $push: { documents: document } }
      );

      await session.commitTransaction();
      return res.status(200).json({
        status: "success",
        message: `Documento agregado correctamente.`,
        data: {
          id: document._id,
          filename: document.filename,
          typeDocument: document.typeDocument,
        },
      });
    }
  } catch (error) {
    session.abortTransaction();
    return res.status(500).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  } finally {
    session.endSession();
  }
};

//#region FEA DOCUMENT
const addDocumentFeaApi = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      nameResponsible,
      rutResponsible,
      emailResponsible,
      nameClient,
      rutClient,
      emailClient,
      filenameDocument,
      base64Document,
      typeDocument,
    } = req.body;
    //TODO devolver de nuevo a base64
    let url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

    if (req.user.role !== "API") {
      handleErrorResponse(
        res,
        400,
        "No tiene permisos para realizar esta acción."
      );
      return;
    }
    if (typeDocument !== "Documento FEA") {
      handleErrorResponse(
        res,
        400,
        `No puede agregar documentos de tipo ${typeDocument} en esta sección.`
      );
      return;
    }
    const filename = generateValue(filenameDocument);
    const client = await Client.findOne({ rutClient });
    const usuario = {
      name: nameResponsible,
      rut: rutResponsible,
      email: emailResponsible,
    };
    const cliente = {
      nameClient,
      rutClient,
      emailClient,
    };
    if (client) {
      const isDuplicate = client?.documents.some(
        (doc) => doc.filename === filename
      );
  
      if (isDuplicate) {
        handleErrorResponse(
          res,
          400,
          `Ya existe un documento con el nombre ${filename}.`
        );
        return;
      }
    }
    const newFile = await compressPdf(base64Document, filename);
    //? subir documento en amazon
    const idDocument = v4();
    const urlDocument = `${url}${idDocument}`;
    //? Insertar en s3
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: idDocument,
      Body: newFile,
      ContentType: "application/pdf",
    });
    await s3.send(command);
    const newBase64 = Buffer.from(newFile).toString("base64");
    const result = await saveDocumentPdf(
      usuario,
      cliente,
      "Pendiente Revisión",
      typeDocument,
      newBase64,
      urlDocument,
      idDocument,
      filename,
      "externo",
      session
    );
    const documentLoad = await PDFDocument.load(newBase64);
    // Obtener el número de páginas
    const pages = documentLoad.getPages();
    if (!client) {
      let documents = [];
      documents.push({
        _id: result._id,
        filename,
        typeDocument,
      });
      const objectClient = new Client({
        nameResponsible,
        rutResponsible,
        emailResponsible,
        nameClient,
        rutClient,
        emailClient,
        documents,
      });
      await Client.create(objectClient);
      await session.commitTransaction();
      return res.status(200).json({
        status: "success",
        message: `Documento agregado correctamente.`,
        data: {
          id: objectClient.documents[0]._id,
          filename: objectClient.documents[0].filename,
          typeDocument: objectClient.documents[0].typeDocument,
          pages: pages.length,
        },
      });
    } else {
      const document = {
        _id: result._id,
        filename,
        typeDocument,
      };
      await Client.findOneAndUpdate(
        { rutClient },
        { $push: { documents: document } }
      );
      await session.commitTransaction();
      return res.status(200).json({
        status: "success",
        message: `Documento agregado correctamente.`,
        data: {
          id: document._id,
          filename: document.filename,
          typeDocument: document.typeDocument,
          pages: pages.length,
        },
      });
    }
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    return res.status(400).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  } finally {
    session.endSession();
  }
};
//#region UPDATE FEA
const changeStateDocumentFeaApi = async (req, res) => {
  let errorMessage;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.query;
    const file = req.file;
    // actualizar el estado del documento conglomerado
    const document = await documentPDF.findOne({ _id: id }).session(session);
    if (document.typeDocument !== "Documento FEA") {
      handleErrorResponse(
        res,
        400,
        `No puede cambiar el estado de un documento de tipo ${document.typeDocument}.`
      );
      return;
    }
    if (document.state === "Revisado") {
      handleErrorResponse(res, 400, `documento revisado.`);
      return;
    }
    // actualizar el documento en el cliente y el documento
    //* actualizar el documento en aws s3
    //? primero borramos el existente con el idDocument
    const params2 = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: document.idDocument,
    };
    await s3.send(new DeleteObjectCommand(params2));
    //? Ahora subiremos el nuevo documento
    const paramsNew2 = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Body: file.buffer,
      ContentType: "application/pdf",
      Key: document.idDocument,
    };
    await s3.send(new PutObjectCommand(paramsNew2));
    await documentPDF
      .findOneAndUpdate(
        { _id: id },
        { state: "Revisado" },
        {
          new: true,
        }
      )
      .session(session);
    // Configurar Axios con la URL base de la API
    const apiUrl = "https://galileaapp.bubbleapps.io/api/1.1/wf/whnotario/";
    const config = {
      headers: {
        Authorization: `Bearer ${process.env.TOKEN_API_GALILEA}`,
        "Content-Type": "application/json",
      },
    };
    // cargar documento pdf en la librería para obtener las paginas
    const documentLoad = await PDFDocument.load(
      Buffer.from(file.buffer).toString("base64")
    );
    const base64Document = Buffer.from(file.buffer).toString("base64");
    const pages = documentLoad.getPages();
    const bodyAxios = {
      id,
      base64Document,
      nroPagDoc: parseInt(pages.length),
    };
    axios
      .post(apiUrl, bodyAxios, config)
      .then((response) => {
      })
      .catch((error) => {
        console.error("Error al comunicarse con la API:", error);
        errorMessage = "Error al comunicarse con la API externa.";
        if (error.response) {
          errorMessage += ` Código de estado: ${error.response.status}`;
        } else if (error.request) {
          errorMessage += " No se recibió respuesta del servidor.";
        } else {
          errorMessage += ` Mensaje de error: ${error.message}`;
        }
      })
      .finally(() => {
        // Esta sección no se ejecutará si se ha retornado anteriormente
        session.endSession();
      });
    await session.commitTransaction();
    // actualizar el documento del cliente
    return res.status(200).json({
      status: "success",
      message: `Documento revisado con éxito.`,
      data: {},
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(400).json({
      status: "error",
      message: {
        error: error ? error.message : "",
        errorMessage: errorMessage ? errorMessage : "",
      },
      data: {},
    });
  } finally {
    session.endSession();
  }
};

const getCertificatesDocuments = async (req, res) => {
  try {
    if (req.user.role !== "API") {
      handleErrorResponse(
        res,
        400,
        "No tiene permisos para realizar esta acción."
      );
      return;
    }
    const { id } = req.query;
    const document = await documentPDF.findById({ _id: id }).lean();
    // Convertir la cadena base64 en un buffer
    // obtener el documento de aws s3
    //* realiza la operación de conglomerado
    const commandGet = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: document.idDocument,
    });
    const { Body } = await s3.send(commandGet);
    const buffer = await Body.transformToByteArray();
    const base64Contrato = Buffer.from(buffer).toString("base64");
    const documentLoad = await PDFDocument.load(
      Buffer.from(base64Contrato, "base64")
    );
    // Obtener el número de páginas
    const pages = documentLoad.getPages();
    if (!document) {
      return res.status(400).json({
        status: "error",
        message: `No existe el documento.`,
        data: {},
      });
    }
    const { createdAt, updatedAt, __v, idDocument, url, ...documentResponse } =
      document;
    //TODO MOSTRAR EL DOCUMENTO EN BASE64
    return res.status(200).json({
      status: "200",
      message: `Documentos Certificados.`,
      data: {
        pages: pages.length,
        documentResponse,
      },
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  }
};

const getToken = async (req, res) => {
  const { email, password } = req.body;
  // comprobar si existe el usuario
  const usuario = await User.findOne({ email });

  if (!usuario) {
    const error = new Error("usuario no existe");
    return res.status(403).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  }
  // Autenticar el usuario
  // Revisar el password
  if (await usuario.comprobarPassword(password)) {
    return res.status(200).json({
      status: "success",
      message: `Usuario autenticado correctamente.`,
      data: {
        token: generarJWT(usuario._id),
        duración: "1 dia",
      },
    });
  } else {
    const error = new Error("Contraseña incorrecta");
    return res.status(403).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  }
};
const validateToken = async (req, res) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password -token");
      if (!user) {
        throw new Error("Usuario no encontrado");
      }
      req.user = decoded;
      return res.status(200).json({
        status: "success",
        message: "Token válido.",
        data: {},
      });
    } else {
      return res
        .status(401)
        .json({ msg: "No se proporcionó un token de autenticación" });
    }
  } catch (error) {
    return res.status(403).json({ msg: "Token no válido" });
  }
};

export {
  addDocumentApi,
  addDocumentFeaApi,
  changeStateDocumentFeaApi,
  getCertificatesDocuments,
  getToken,
  validateToken,
};
