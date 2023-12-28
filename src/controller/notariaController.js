import documentPDF from "../model/Pdf.js";
import Client from "../model/Clients.js";
import {
  arrayBufferToBase64,
  formatDate,
  formatValue,
} from "../utils/converter.js";
import { saveDocumentPdf } from "../helpers/index.js";
import { PDFDocument, rgb } from "pdf-lib";
import DocumentTemplate from "../model/DocumentTemplate.js";
import mongoose from "mongoose";

const addDocument = async (req, res) => {
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
    const client = await Client.findOne({ rutClient }).session(session);
    const documentPdf = await documentPDF
      .findOne({ rutClient })
      .session(session);
    if (req.user.role === "API") {
      return res.status(400).json({
        status: "error",
        message: `No tiene permisos para realizar esta acción.`,
        data: {},
      });
    }
    if (client) {
      if (typeDocument === "Poliza") {
        return res.status(400).json({
          status: "error",
          message: `No puede agregar una poliza en esta sección.`,
          data: {},
        });
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

    if (!client) {
      const result = await saveDocumentPdf(
        req.body,
        state(typeDocument),
        typeDocument,
        base64Document,
        filename,
        "interno"
      );
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
          result,
        },
      });
    }
    // insertar en la bd Coleccion Clients
    if (client.documents.length >= 0) {
      // verificar si el cliente ya tiene un documento con el mismo tipo de documento
      const documentContract = client.documents.some(
        (document) => document.typeDocument === "Contrato"
      );
      if (documentContract) {
        return res.status(400).json({
          status: "error",
          message: `El cliente ya tiene un Contrato.`,
          data: {},
        });
      }
      const result = await saveDocumentPdf(
        req.body,
        state(typeDocument),
        typeDocument,
        base64Document,
        filename,
        "interno"
      );
      const document = {
        _id: result._id,
        filename,
        typeDocument,
      };
      await Client.findOneAndUpdate(
        { rutClient },
        { $push: { documents: document } }
      ).session(session);
      await session.commitTransaction();
      return res.status(200).json({
        status: "success",
        message: `Documento agregado correctamente.`,
        data: {
          result,
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

const generarConglomeradoTemplate = async (req, res) => {
  // generar el documento del conglomerado firmado con el template firmado
  // id conglomerado,
  const session = await mongoose.startSession();
  session.startTransaction();
  const { id } = req.params;

  try {
    const documentoFirma = await documentPDF
      .findOne({ _id: id })
      .session(session);
    const documentoPlantilla = await DocumentTemplate.findById({
      _id: "654aeb3c674c514b13ade18d",
    }).session(session);
    if (req.user.role === "API") {
      return res.status(400).json({
        status: "error",
        message: `No tiene permisos para realizar esta acción.`,
        data: {},
      });
    }
    if (!documentoFirma && !documentoPlantilla) {
      return res.status(400).json({
        status: "error",
        message: `Documento no existe.`,
        data: {},
      });
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
      const [donorPage] = await conglomeradoPDF.copyPages(documentTemplate, [
        pageIndex,
      ]);
      conglomeradoPDF.addPage(donorPage);
    }

    const pdfBytes = await conglomeradoPDF.save();
    const base64conglomerado = arrayBufferToBase64(pdfBytes);
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Documento generado correctamente.`,
      data: {
        base64conglomerado,
      },
    });
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

const changeStateConglomerado = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // base64 del documento en el body
    const { id } = req.params;
    const { base64 } = req.body;
    // actualizar el estado del documento conglomerado
    const document = await documentPDF.findOne({ _id: id }).session(session);
    if (req.user.role === "API") {
      return res.status(400).json({
        status: "error",
        message: `No tiene permisos para realizar esta acción.`,
        data: {},
      });
    }
    if (!document) {
      return res.status(500).json({
        status: "error",
        message: `Registro no existe.`,
        data: {},
      });
    }
    if (document.state === "Certificado") {
      return res.status(500).json({
        status: "error",
        message: `Documento ya esta certificado.`,
        data: {},
      });
    }
    if (document.state === "Pendiente Firma") {
      return res.status(400).json({
        status: "error",
        message: `Documento no esta firmado.`,
        data: {},
      });
    }
    if (!document.state !== "Pendiente Certificación") {
      // actualizar el estado de el documento solo
      // Obtener la última página
      const documentC = await PDFDocument.load(Buffer.from(base64, "base64"));

      const pages = documentC.getPages();
      const lastPage = pages[pages.length - 1];

      // Agregar la firma en la última página
      const date = formatDate();
      lastPage.drawText(date, {
        x: 115,
        y: 553,
        size: 12,
        font: await documentC.embedFont("Helvetica"),
        color: rgb(0, 0, 0),
      });
      // Guardar el documento
      const pdfBytes = await documentC.save();
      const base64Document = Buffer.from(pdfBytes).toString("base64");
      const documentCertificate = {
        base64Document,
        state: "Certificado",
      };
      await documentPDF.findOneAndUpdate({ _id: id }, documentCertificate, {
        new: true,
      });
      await session.commitTransaction();
      // actualizar el documento del cliente
      return res.status(200).json({
        status: "success",
        message: `Documento Certificado.`,
        data: {
          documentCertificate,
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
  }finally {
    session.endSession();
  }
};
export { addDocument, generarConglomeradoTemplate, changeStateConglomerado };
