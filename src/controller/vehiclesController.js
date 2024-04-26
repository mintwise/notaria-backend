//modelos
import Pdf from "../model/Pdf.js";
//librerías
import mongoose from "mongoose";
//funciones
import { formatValue } from "../utils/converter.js";
import {
  generateValue,
  handleErrorResponse,
  saveDocumentPdf,
} from "../helpers/index.js";
import sendEmail from "../emails/sendEmail.js";
import { v4 } from "uuid";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";

const listDocumentGeneric = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const documents = await Pdf.find(
      {
        typeDocument: { $eq: "Genérico" },
      },
      {
        __v: 0,
        base64Document: 0,
      }
    ).session(session);
    // RESPUESTA DEL SERVIDOR
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Documentos Genéricos.`,
      data: documents,
    });
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

const getDocumentGeneric = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.query;
    const documents = await Pdf.findById(
      { _id: id },
      {
        __v: 0,
        base64Document: 0,
      }
    ).session(session);
    // RESPUESTA DEL SERVIDOR
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Documento encontrado con éxito`,
      data: documents,
    });
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

const addDocumentGeneric = async (req, res) => {
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
      typeDocument,
    } = req.query;
    const file = req.file;
    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    // función que formatea el nombre del documento
    const filename = generateValue(file.originalname);
    //inserta el documento en la bd PDF
    const usuario = {
      nameResponsible,
      rutResponsible,
      emailResponsible,
    };
    const cliente = {
      nameClient,
      rutClient,
      emailClient,
    };
    const idDocument = v4();
    const urlDocument = `${url}${idDocument}`;
    // agregar en s3
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: idDocument,
      Body: file.buffer,
      ContentType: "application/pdf",
    });
    await s3.send(command);
    const promesaDocument = await saveDocumentPdf(
      usuario,
      cliente,
      "Pendiente Revisión",
      typeDocument,
      null,
      urlDocument,
      idDocument,
      filename,
      "interno",
      session
    );
    // ENVIAR EMAIL DE CONFIRMACIÓN
    const datos = {
      subject: "Creación De Documento Genérico",
      name: nameResponsible,
      message: `Se ha subido el documento "${filename
        .trim()
        .replace(/\.pdf$/, "")}" con éxito.`,
      to: [emailResponsible, emailClient],
    };
    await sendEmail(datos);
    // await sendEmailTest(datos);
    // RESPUESTA DEL SERVIDOR
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Creado con éxito.`,
      data: promesaDocument,
    });
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

const editDocumentGeneric = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const file = req.file;
    const { id } = req.query;
    // actualizar el estado del documento conglomerado
    const document = await Pdf.findOne({ _id: id }).session(session);
    if (!document) {
      handleErrorResponse(res, 400, "Documento no existe.");
      return;
    }
    if (document.typeDocument !== "Genérico") {
      handleErrorResponse(
        res,
        400,
        "No se admiten documentos distintos a Genérico."
      );
      return;
    }
    if (document.state === "Revisado") {
      handleErrorResponse(res, 400, "Documento revisado.");
      return;
    }
    // actualizar el documento en s3 y BD
    const params2 = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: document.idDocument,
    };
    await s3.send(new DeleteObjectCommand(params2));
    const paramsNew2 = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Body: file.buffer,
      ContentType: "application/pdf",
      Key: document.idDocument,
    };
    await s3.send(new PutObjectCommand(paramsNew2));
    const updated = await Pdf.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          state: "Revisado",
        },
      },
      {
        new: true,
      }
    ).session(session);
    console.log(updated, "updated------------------------------------");
    // ENVIAR EMAIL DE CONFIRMACIÓN
    const base64Document = Buffer.from(file.buffer).toString("base64");
    const datos = {
      subject: "Actualización De Documento Genérico",
      name: updated.nameResponsible,
      message: `Se ha actualizado el documento "${updated.filenameDocument
        .trim()
        .replace(/\.pdf$/, "")}" con éxito.`,
      to: [updated.emailResponsible, updated.emailClient],
      base64Document,
      filenameDocument: updated.filenameDocument,
    };
    await sendEmail(datos);
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Actualizado con éxito.`,
      data: updated,
    });
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

const deleteDocumentGeneric = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.query;
    const response = await Pdf.findOneAndDelete({ _id: id }).session(session);
    if (!response) {
      handleErrorResponse(res, 400, "Documento no existe.");
      return;
    }
    // RESPUESTA DEL SERVIDOR
    // eliminar de s3
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: response.idDocument,
    });
    await s3.send(command);
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Documento eliminado con éxito.`,
      data: {},
    });
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

export {
  listDocumentGeneric,
  getDocumentGeneric,
  addDocumentGeneric,
  editDocumentGeneric,
  deleteDocumentGeneric,
};
