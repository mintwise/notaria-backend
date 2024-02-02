import Client from "../model/Clients.js";
import documentPDF from "../model/Pdf.js";
import { saveDocumentPdf } from "../helpers/index.js";
import { formatValue } from "../utils/converter.js";
import User from "../model/User.js";
import generarJWT from "../helpers/generarJWT.js";
import jwt from "jsonwebtoken";
import { PDFDocument } from "pdf-lib";
import mongoose from "mongoose";
import axios from "axios";

const addDocumentApi = async (req, res) => {
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

    if (req.user.role !== "API") {
      return res.status(400).json({
        status: "error",
        message: `No tiene permisos para realizar esta acción.`,
        data: {},
      });
    }
    if (typeDocument !== "Conglomerado") {
      return res.status(400).json({
        status: "error",
        message: `No puede agregar documentos de tipo ${typeDocument} en esta sección.`,
        data: {},
      });
    }

    const filename = formatValue(filenameDocument);
    const client = await Client.findOne({ rutClient });
    const result = await saveDocumentPdf(
      req.body,
      "Pendiente Firma",
      typeDocument,
      base64Document,
      filename,
      "externo"
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
      const isDuplicate = client.documents.some(
        (doc) => doc.filename === filename
      );

      if (isDuplicate) {
        return res.status(400).json({
          status: "error",
          message: `Ya existe un documento con el nombre ${filename}.`,
          data: {},
        });
      }

      const document = {
        _id: result._id,
        filename,
        typeDocument,
      };
      await Client.findOneAndUpdate(
        { rutClient },
        { $push: { documents: document } }
      );
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
    return res.status(400).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  }
};

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

    if (req.user.role !== "API") {
      return res.status(400).json({
        status: "error",
        message: `No tiene permisos para realizar esta acción.`,
        data: {},
      });
    }
    if (typeDocument !== "Documento FEA") {
      return res.status(400).json({
        status: "error",
        message: `No puede agregar documentos de tipo ${typeDocument} en esta sección.`,
        data: {},
      });
    }

    const filename = formatValue(filenameDocument);
    const client = await Client.findOne({ rutClient });
    const result = await saveDocumentPdf(
      req.body,
      "Pendiente Revisión",
      typeDocument,
      base64Document,
      filename,
      "externo"
    );

    const documentLoad = await PDFDocument.load(
      Buffer.from(base64Document, "base64")
    );
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
          pages: pages.length
        },
      });
    }
    // insertar en la bd Colección Clients
    if (client.documents.length) {
      const isDuplicate = client.documents.some(
        (doc) => doc.filename === filename
      );

      if (isDuplicate) {
        return res.status(400).json({
          status: "error",
          message: `Ya existe un documento con el nombre ${filename}.`,
          data: {},
        });
      }

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
          pages: pages.length
        },
      });
    }
  } catch (error) {
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

const changeStateDocumentFeaApi = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { base64Document } = req.body;
    const { id } = req.query;
    let errorMessage;
    if (req.user.role !== "AdminNotaria") {
      return res.status(400).json({
        status: "error",
        message: `No tiene permisos para realizar esta acción.`,
        data: {},
      });
    }
    // actualizar el estado del documento conglomerado
    const document = await documentPDF.findOne({ _id: id }).session(session);

    if (document.typeDocument !== "Documento FEA") {
      return res.status(400).json({
        status: "error",
        message: `No se admiten documentos distintos a Documento FEA.`,
        data: {},
      });
    }
    if (document.state === "Revisado") {
      return res.status(400).json({
        status: "error",
        message: `Documento Revisado.`,
        data: {},
      });
    }
    // cargar documento pdf en la librería para obtener las paginas
    const documentLoad = await PDFDocument.load(
      Buffer.from(document.base64Document, "base64")
    );
    const pages = documentLoad.getPages();

    // actualizar el documento en el cliente y el documento
    const documentCertificate = {
      base64Document,
      state: "Revisado",
    };
    await documentPDF.findOneAndUpdate({ _id: id }, documentCertificate, {
      new: true,
    });
    // Configurar Axios con la URL base de la API
    const apiUrl = "https://galileaapp.bubbleapps.io/version-test/api/1.1/wf/whnotario"
    const config = {
      headers: {
        'Authorization': `Bearer ${process.env.TOKEN_API_GALILEA}`,  
        'Content-Type': 'application/json'
      }
    };
    const bodyAxios = {
      id,
      base64Document,
      nroPagDoc: parseInt(pages.length)
    };
    axios.post(apiUrl, bodyAxios, config)
    .then(response => {
      console.log('Respuesta de la API:', response.data);
    })
    .catch(error =>{

    console.error('Error al comunicarse con la API:', error);
    errorMessage = 'Error al comunicarse con la API externa.';
    if (error.response) {
      errorMessage += ` Código de estado: ${error.response.status}`;
    } else if (error.request) {
      errorMessage += ' No se recibió respuesta del servidor.';
    } else {
      errorMessage += ` Mensaje de error: ${error.message}`;
    }
    })
    .finally(() => {
      // Esta sección no se ejecutará si se ha retornado anteriormente
      session.endSession();
    })
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
      message: error ? error.message : errorMessage,
      data: {},
    });
  } finally {
    session.endSession();
  }
};

const getCertificatesDocuments = async (req, res) => {
  try {
    if (req.user.role !== "API") {
      return res.status(400).json({
        status: "error",
        message: `No tiene permisos para realizar esta acción.`,
        data: {},
      });
    }
    const { id } = req.query;
    const document = await documentPDF.findById({ _id: id });
    // Convertir la cadena base64 en un buffer
    const documentLoad = await PDFDocument.load(
      Buffer.from(document.base64Document, "base64")
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
    return res.status(200).json({
      status: "200",
      message: `Documentos Certificados.`,
      data: {
        pages: pages.length,
        document,
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
