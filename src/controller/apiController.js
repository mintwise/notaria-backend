import Client from "../model/Clients.js";
import documentPDF from "../model/Pdf.js";
import { saveDocumentPdf } from "../helpers/index.js";
import { formatValue } from "../utils/converter.js";
import User from "../model/User.js";
import generarJWT from "../helpers/generarJWT.js";
import jwt from "jsonwebtoken";

const addDocumentApi = async (req, res) => {
  try {
    if (req.user.role !== "API") {
      return res.status(400).json({
        status: "error",
        message: `No tiene permisos para realizar esta acción.`,
        data: {},
      });
    }
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

    return res.status(200).json({
      status: "200",
      message: `Documentos Certificados.`,
      data: {
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

export { addDocumentApi, getCertificatesDocuments, getToken, validateToken };
