import documentPDF from "../model/Pdf.js";
import Client from "../model/Clients.js";
import { arrayBufferToBase64, formatValue } from "../utils/converter.js";
import { saveDocumentPdf } from "../helpers/index.js";
import SignTemplate from "../model/SignTemplate.js";
import { PDFDocument, error } from "pdf-lib";

const addDocument = async (req, res) => {
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
    //! validar por rut del cliente si existe documento tipo Contrato o conglomerado
    const client = await Client.findOne({ rutClient });
    if (client) {
      const isDocumentExists = client.documents.some(
        (document) => document.typeDocument === typeDocument
      );

      if (isDocumentExists) {
        return res
          .status(400)
          .json({ message: `Ya tiene ${typeDocument} en el sistema.` });
      }
      if (typeDocument === "Poliza") {
        return res
          .status(400)
          .json({ message: `No se puede agregar pólizas en esta sección.` });
      }
      if(client.rutClient === rutClient && typeDocument === "Contrato"){
        return res
          .status(400)
          .json({ message: `Ya tiene un contrato en el sistema.` });
      }
      if(client.rutClient === rutClient && typeDocument === "Conglomerado"){
        return res
          .status(400)
          .json({ message: `Ya tiene un conglomerado en el sistema.` });
      }
    }
    // insertar en la bd Coleccion DocumentPDF
    const filename = formatValue(filenameDocument);
    const state = (typeDocument) => {
      if (typeDocument === "Contrato") {
        return "Pendiente Poliza";
      }
      if (typeDocument === "Conglomerado") {
        return "Certificado";
      }
    };

    const result = await saveDocumentPdf(
      req.body,
      state(typeDocument),
      typeDocument,
      base64Document,
      filename
    );
    // insertar en la bd Coleccion Clients
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
    await objectClient.save();
    return res
      .status(201)
      .json({ message: "Documento agregado correctamente." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generarConglomeradoTemplate = async (req, res) => {
  // generar el documento del conglomerado firmado con el template firmado
  // id conglomerado,
  const { id } = req.params;
  try {
    const documentoFirma = await documentPDF.findOne({ _id: id });
    const documentoPlantilla = await SignTemplate.findOne({idDocument: id})
    if(!documentoFirma && !documentoPlantilla){
      return res.status(404).json({ message: "Registro no existe" });
    }
    const conglomeradoPDF = await PDFDocument.create();

    const documentSign = await PDFDocument.load(
      Buffer.from(documentoFirma.base64Document, "base64")
    );
    const documentTemplate = await PDFDocument.load(
      Buffer.from(documentoPlantilla.base64Document, "base64")
    );
    //   se crea el pdf nuevo
    // Copiar todas las páginas del primer documento si tiene una o más
    const pageIndices1 = documentSign.getPageIndices();
    for (const pageIndex of pageIndices1) {
      const [donorPage] = await conglomeradoPDF.copyPages(documentSign, [
        pageIndex,
      ]);
      conglomeradoPDF.addPage(donorPage);
    }
    // Copiar todas las páginas del segundo documento si tiene una o más
    const pageIndices2 = documentTemplate.getPageIndices();
    for (const pageIndex of pageIndices2) {
      const [donorPage] = await conglomeradoPDF.copyPages(documentTemplate, [pageIndex]);
      conglomeradoPDF.addPage(donorPage);
    }
    const pdfBytes = await conglomeradoPDF.save();
    const base64conglomerado = arrayBufferToBase64(pdfBytes);
    return  res.json(base64conglomerado);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const changeStateConglomerado = async (req,res) => {
  // base64 del documento en el body
  const { id } = req.params;
  // actualizar el estado del documento conglomerado
  try {
    const document = await documentPDF.findOne({ _id: id });
  if (!document) {
    return res.status(404).json({ message: "Registro no existe" });
  }
  if(document.state === "Certificado"){
    return res.status(400).json({ message: "Documento ya esta certificado" });
  }
  if(document.state === "Pendiente Firma"){
    return res.status(400).json({ message: "Documento no esta firmado" });
  }
  if(document.state === "Pendiente Certificación"){
    await documentPDF.findOneAndUpdate({ _id: id }, { state: "Certificado" }, { new: true });
    return res.status(200).json({ message: "Documento certificado" });
  }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
export { addDocument, generarConglomeradoTemplate, changeStateConglomerado };
