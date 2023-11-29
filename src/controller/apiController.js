import Client from "../model/Clients.js";
import documentPDF from "../model/Pdf.js";
import { saveDocumentPdf } from "../helpers/index.js";
import { formatValue } from "../utils/converter.js";

const addDocumentApi = async (req, res) => {
  try {
    if(req.user.role !== "API"){
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
    
    if(req.user.role !== "API"){
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
      })
      await Client.create(objectClient);
      return res.status(200).json({
        status: "success",
        message: `Documento agregado correctamente.`,
        data: {
          filename: objectClient.documents[0].filename,
          typeDocument: objectClient.documents[0].typeDocument
        },
      });
    }
    // insertar en la bd Colección Clients
  if(client.documents.length){
  const isDuplicate = client.documents.some((doc) => doc.filename === filename);

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
      filename: document.filename,
      typeDocument: document.typeDocument
    }
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
    if(req.user.role !== "API"){
      return res.status(400).json({
        status: "error",
        message: `No tiene permisos para realizar esta acción.`,
        data: {},
      });
    }
    const documents = await documentPDF.find({ state: "Certificado" });
  
    return res.status(200).json({
      status: "success",
      message: `Documentos Certificados.`,
      data: {
        documents
      },
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  }
}

export { addDocumentApi, getCertificatesDocuments };
