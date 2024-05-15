// Importar modelos
import DocumentPDF from "../model/Pdf.js";
import Client from "../model/Clients.js";
import DocumentTemplate from "../model/DocumentTemplate.js";
// importar funciones de utilidades
import {
  arrayBufferToBase64,
  compressPdf,
  formatDate,
} from "../utils/converter.js";
import {
  generateValue,
  saveDocumentPdf,
  handleErrorResponse
} from "../helpers/index.js";
// importación de librerías
import mongoose from "mongoose";
import { PDFDocument, rgb } from "pdf-lib";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";
import { v4 } from "uuid";

const addDocument = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { nameClient, rutClient, emailClient, typeDocument } = req.query;
    const file = req.file;
    // esto mientras no se usa

    // variables utilizadas mas adelante para el proceso del documento en s3
    let url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    const client = await Client.findOne({ rutClient }).session(session);
    // Check for API role
    if (req.user.role === "API") {
      handleErrorResponse(
        res,
        400,
        "No tiene permisos para realizar esta acción."
      );
      return;
    }
    // Check if client exists and typeDocument is "Poliza"
    if (client && typeDocument === "Poliza") {
      handleErrorResponse(
        res,
        400,
        "No puede agregar una poliza en esta sección."
      );
      return;
    }
    // insertar en la bd Coleccion DocumentPDF
    const filename = generateValue(file.originalname);
    const state = (typeDocument) => {
      if (typeDocument === "Contrato") {
        return "Pendiente Poliza";
      }
      if (typeDocument === "Conglomerado") {
        return "Certificado";
      }
    };
    // comprimir el pdf
    const newFile = await compressPdf(Buffer.from(file.buffer).toString("base64"), filename);
    // insertar documento en s3 para obtener el link
    const idDocument = v4();
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Body: newFile,
      ContentType: "application/pdf",
      Key: idDocument,
    };
    const command = new PutObjectCommand(params);
    if (!client) {
      await s3.send(command);
      const urlDocument = `${url}${idDocument}`;
      const result = await saveDocumentPdf(
        req.user,
        req.query,
        state(typeDocument),
        typeDocument,
        null,
        urlDocument,
        idDocument,
        filename,
        "interno",
        session
      );
      let documents = [];
       documents.push({
        _id: result._id,
        filename,
        typeDocument,
      });
      await Client.create({
        nameResponsible: req.user.name,
        rutResponsible: req.user.rut,
        emailResponsible: req.user.email,
        nameClient,
        rutClient,
        emailClient,
        documents,
      });
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
        handleErrorResponse(res, 400, "El cliente ya tiene un contrato.");
        return;
      }
      await s3.send(command);
      const urlDocument = `${url}${idDocument}`;
      const result = await saveDocumentPdf(
        req.user,
        req.query,
        state(typeDocument),
        typeDocument,
        null,
        urlDocument,
        idDocument,
        filename,
        "interno",
        session
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
    const documentoFirma = await DocumentPDF.findOne({ _id: id }).session(
      session
    );
    const documentoPlantilla = await DocumentTemplate.findById({
      _id: "654aeb3c674c514b13ade18d",
    }).session(session);
    if (req.user.role === "API") {
      handleErrorResponse(
        res,
        400,
        "No tiene permisos para realizar esta acción."
      );
      return;
    }
    if (!documentoFirma && !documentoPlantilla) {
      handleErrorResponse(res, 400, "Documento no existe.");
      return;
    }
    const conglomeradoPDF = await PDFDocument.create();
    // obtener el documento desde aws s3 a traves de idDocument
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: documentoFirma.idDocument,
    });
    const { Body } = await s3.send(command);
    const buffer = await Body.transformToByteArray();
    const base64 = Buffer.from(buffer).toString("base64");
    const documentSign = await PDFDocument.load(Buffer.from(base64, "base64"));
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
    const file = req.file;
    // variables utilizadas mas adelante para el proceso del documento en s3
    let url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    //  // obtener el documento desde aws s3 a traves de idDocument
    //! obtener el documento de s3 y convertir el documento a base64
    //  const command = new GetObjectCommand({
    //   Bucket: process.env.AWS_BUCKET_NAME,
    //   Key: documentoFirma.idDocument
    // })
    // const { Body } = await s3.send(command)
    // const buffer = await Body.transformToByteArray();
    // const base64 = Buffer.from(buffer).toString("base64");
    //!aquí termina la obtención del documento
    // actualizar el estado del documento conglomerado
    const base64 = Buffer.from(file.buffer).toString("base64");
    const document = await DocumentPDF.findOne({ _id: id }).session(session);
    if (req.user.role === "API") {
      handleErrorResponse(
        res,
        400,
        "No tiene permisos para realizar esta acción."
      );
      return;
    }
    if (!document) {
      handleErrorResponse(res, 500, "Registro no existe.");
      return;
    }
    if (document.state === "Certificado") {
      handleErrorResponse(res, 500, "Documento ya esta certificado.");
      return;
    }
    if (document.state === "Pendiente Firma") {
      handleErrorResponse(res, 400, "Documento no esta firmado.");
      return;
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
      // Guardar el documento en un buffer
      const pdfBytes = await documentC.save();
      //* actualizar el documento en aws s3
      //? primero borramos el existente con el idDocument
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: document.idDocument,
      };
      await s3.send(new DeleteObjectCommand(params));
      //? Ahora subiremos el nuevo documento
      const paramsNew = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Body: pdfBytes,
        ContentType: "application/pdf",
        Key: document.idDocument,
      };
      await s3.send(new PutObjectCommand(paramsNew));
      // actualizar el documento en la bd
      const urlDocument = `${url}${document.idDocument}`;
      const response = await DocumentPDF.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            state: "Certificado",
            urlDocument,
          },
        },
        {
          new: true,
        }
      ).session(session);
      await session.commitTransaction();
      // actualizar el documento del cliente
      return res.status(200).json({
        status: "success",
        message: `Documento Certificado.`,
        data: {
          response,
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

export { addDocument, generarConglomeradoTemplate, changeStateConglomerado };
