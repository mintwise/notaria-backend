// librerías
import { PDFDocument } from "pdf-lib";
import mongoose from "mongoose";
import { v4 } from "uuid";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";
// funciones de utilidad
import { arrayBufferToBase64, compressPdf } from "../utils/converter.js";
import {
  saveDocumentPdf,
  updateDocumentPdf,
  signDocument,
  handleErrorResponse,
  generateValue,
} from "../helpers/index.js";
//modelos
import Client from "../model/Clients.js";
import Pdf from "../model/Pdf.js";
import User from "../model/User.js";
import DocumentTemplate from "../model/DocumentTemplate.js";
import InmobiliariaUser from "../model/InmobiliariaUser.js";

const addDocument = async (req, res) => {
  // validar por rut del cliente si existe póliza para realizar conglomerado
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { rutClient, typeDocument } = req.query;
    const file = req.file;
    const client = await Client.findOne({ rutClient }).session(session);
    const contrato = await Pdf.findOne({
      rutClient,
      typeDocument: "Contrato",
    }).session(session);
    const poliza = await Pdf.findOne({
      rutClient,
      typeDocument: "Poliza",
    }).session(session);
    let url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    if (!client) {
      handleErrorResponse(res, 400, "No existe cliente.");
      return;
    }
    if (!contrato) {
      handleErrorResponse(res, 400, "No existe contrato.");
      return;
    }
    if (poliza) {
      handleErrorResponse(res, 400, "La póliza ya fue ingresada.");
      return;
    }
    if (req.user.role === "API") {
      handleErrorResponse(
        res,
        400,
        "No tiene permisos para realizar esta acción."
      );
      return;
    }
        // función que formatea el nombre del documento
        const filename = generateValue(file.originalname);
    // compresión del pdf
    const newFile = await compressPdf(Buffer.from(file.buffer).toString('base64'), filename);
    const idDocument = v4();
    const urlDocument = `${url}${idDocument}`;
    // Insertar en s3
    const commandUploadPoliza = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: idDocument,
      Body: newFile,
      ContentType: "application/pdf",
    });
    await s3.send(commandUploadPoliza);
    //inserta la póliza en la bd PDF
    const polizaDocument = await saveDocumentPdf(
      req.user,
      client,
      "Conglomerado Creado",
      typeDocument,
      null,
      urlDocument,
      idDocument,
      filename,
      "interno",
      session
    );
    // Cambia el estado del contrato a conglomerado
    contrato.state = "Conglomerado Creado";
    await contrato.save({ new: true }, { session });
    // guardar el documento en clients con la data que ya tiene
    const polizaDocumentClient = {
      _id: polizaDocument._id,
      filename,
      typeDocument,
    };
    await Client.updateOne(
      { rutClient },
      { $push: { documents: polizaDocumentClient } }
    ).session(session);
    //* realiza la operación de conglomerado
    // obtener el documento desde aws s3 a traves de idDocument
    const commandGet = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: contrato.idDocument,
    });
    const { Body } = await s3.send(commandGet);
    const buffer = await Body.transformToByteArray();
    const base64Contrato = Buffer.from(buffer).toString("base64");
    const contratoPDF = await PDFDocument.load(
      Buffer.from(base64Contrato, "base64")
    );
    const base64Poliza = Buffer.from(newFile).toString("base64");
    const polizaPDF = await PDFDocument.load(
      Buffer.from(base64Poliza, "base64")
    );
    //   se crea el pdf nuevo
    const conglomeradoPDF = await PDFDocument.create();
    // Copiar todas las páginas del primer documento si tiene una o más
    const pageIndices1 = contratoPDF.getPageIndices();
    for (const pageIndex of pageIndices1) {
      const [donorPage] = await conglomeradoPDF.copyPages(contratoPDF, [
        pageIndex,
      ]);
      conglomeradoPDF.addPage(donorPage);
    }
    // Copiar todas las páginas del segundo documento si tiene una o más
    const pageIndices2 = polizaPDF.getPageIndices();
    for (const pageIndex of pageIndices2) {
      const [donorPage] = await conglomeradoPDF.copyPages(polizaPDF, [
        pageIndex,
      ]);
      conglomeradoPDF.addPage(donorPage);
    }
    const pdfBytes = await conglomeradoPDF.save();
    const base64conglomerado = arrayBufferToBase64(pdfBytes);
    const newFile2 = await compressPdf(base64conglomerado, "conglomerado");
    //insertar en aws s3
    const idDocumentConglomerado = v4();
    const commandUpload = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: idDocumentConglomerado,
      Body: newFile2,
      ContentType: "application/pdf",
    });
    await s3.send(commandUpload);
    // insertar conglomerado en la bd
    const documentConglomerado = await saveDocumentPdf(
      req.user,
      client,
      "Pendiente Firma",
      "Conglomerado",
      null,
      `${url}${idDocumentConglomerado}`,
      idDocumentConglomerado,
      generateValue(
        `${file.originalname.split(".")[0]} - ${contrato.filenameDocument}`
      ),
      "interno",
      session
    );
    // agregamos el documento conglomerado al cliente
    const documentConglomeradoClient = {
      _id: documentConglomerado._id,
      filename: documentConglomerado.filenameDocument,
      typeDocument: "Conglomerado",
    };
    await Client.updateOne(
      { rutClient },
      { $push: { documents: documentConglomeradoClient } }
    ).session(session);
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Creado con éxito.`,
      data: documentConglomerado,
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
const signDocumentConglomerado = async (req, res) => {
  const file = req.file;
  const { id } = req.query;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findOne({ email: req.user.email })
      .lean()
      .session(session);
    const conglomeradoDoc = await Pdf.findById({ _id: id })
      .lean()
      .session(session);
    if (req.user.role === "API") {
      handleErrorResponse(
        res,
        400,
        "No tiene permisos para realizar esta acción."
      );
      return;
    }
    if (!user) {
      handleErrorResponse(res, 400, "Usuario no existe.");
      return;
    }
    if (!conglomeradoDoc) {
      handleErrorResponse(res, 400, "Documento no existe.");
      return;
    }
    // objetos con la información de las firmas de los usuarios
    const signatureInfo = {
      1: {
        sign: {
          position: { x: 60, y: 610 },
          namePosition: { x: 145, y: 640 },
          rutPosition: { x: 320, y: 640 },
          repPosition: { x: 225, y: 598 },
        },
      },
      2: {
        sign: {
          position: { x: 60, y: 450 },
          namePosition: { x: 145, y: 490 },
          rutPosition: { x: 320, y: 490 },
          repPosition: { x: 225, y: 448 },
        },
      },
    };
    const userInmobiliaria = await InmobiliariaUser.findOne({
      name: user.name.toString(),
    })
      .lean()
      .session(session);
    if (!userInmobiliaria) {
      handleErrorResponse(res, 400, "Usuario Inmobiliaria no existe.");
      return;
    }
    // //* extraer los datos
    // obtener datos del conglomerado para buscar en s3
    const commandGet = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: conglomeradoDoc.idDocument,
    });
    const { Body } = await s3.send(commandGet);
    const buffer = await Body.transformToByteArray();
    const base64Conglomerado = Buffer.from(buffer).toString("base64");
    //* DOCUMENTO CONGLOMERADO QUE VA A SER FIRMADO
    const documentConglomerado = await PDFDocument.load(base64Conglomerado);
    // extraer el estado del documento
    const state = conglomeradoDoc.state;
    switch (state) {
      case "Pendiente Firma":
        if (userInmobiliaria.role === 1) {
          const imageSignOne = await documentConglomerado.embedPng(
            Buffer.from(file.buffer).toString("base64")
          );
          const signOneDims = imageSignOne.scale(0.1);
          // Agregamos el template al documento actual
          const templateFirmas = await DocumentTemplate.findById({
            _id: "657a364d9684fafba671a490",
          }).session(session);
          const base64TemplateFirma = await PDFDocument.load(
            Buffer.from(templateFirmas.base64Document, "base64")
          );
          const [templatePage] = await documentConglomerado.copyPages(
            base64TemplateFirma,
            [0]
          );
          documentConglomerado.addPage(templatePage);
          // obtener las paginas del documento
          const pages = documentConglomerado.getPages();
          //* firma de la pagina 8
          const base64SignOne = await signDocument(
            pages,
            imageSignOne,
            signOneDims,
            signatureInfo[1],
            documentConglomerado,
            req.user,
            "contrato"
          );
          // // guardar en pdf en la bd y el cliente
          // //* actualizar el documento en aws s3
          // //? primero borramos el existente con el idDocument
          const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: conglomeradoDoc.idDocument,
          };
          await s3.send(new DeleteObjectCommand(params));
          // //? Ahora subiremos el nuevo documento
          const paramsNew = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Body: base64SignOne,
            ContentType: "application/pdf",

            Key: conglomeradoDoc.idDocument,
          };
          await s3.send(new PutObjectCommand(paramsNew));
          // // actualizar el documento en la bd
          await updateDocumentPdf("Pendiente Firma 2", id, session);
          await session.commitTransaction();
          return res.status(200).json({
            status: "success",
            message: `Firma 1 Realizada con éxito.`,
            data: {},
          });
        }
        if (userInmobiliaria.role === 2) {
          // firmo el segundo
          // pendiente firma 1
          const imageSignTwo = await documentConglomerado.embedPng(
            Buffer.from(file.buffer).toString("base64")
          );
          const signTwoDims = imageSignTwo.scale(0.1);
          // Agregamos el template al documento actual
          const templateFirmas = await DocumentTemplate.findById({
            _id: "657a364d9684fafba671a490",
          }).session(session);
          const base64TemplateFirma = await PDFDocument.load(
            Buffer.from(templateFirmas.base64Document, "base64")
          );
          const [templatePage] = await documentConglomerado.copyPages(
            base64TemplateFirma,
            [0]
          );
          documentConglomerado.addPage(templatePage);
          // obtener las paginas del documento
          const pages = documentConglomerado.getPages();
          const base64SignTwo = await signDocument(
            pages,
            imageSignTwo,
            signTwoDims,
            signatureInfo[2],
            documentConglomerado,
            req.user,
            "contrato"
          );
          // guardar en pdf en la bd y el cliente
          //* actualizar el documento en aws s3
          //? primero borramos el existente con el idDocument
          const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: conglomeradoDoc.idDocument,
          };
          await s3.send(new DeleteObjectCommand(params));
          //? Ahora subiremos el nuevo documento
          const paramsNew = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Body: base64SignTwo,
            ContentType: "application/pdf",
            Key: conglomeradoDoc.idDocument,
          };
          await s3.send(new PutObjectCommand(paramsNew));
          // actualizar el documento en la bd
          await updateDocumentPdf("Pendiente Firma 1", id, session);
          await session.commitTransaction();
          return res.status(200).json({
            status: "success",
            message: `Firma 2 Realizada con éxito.`,
            data: {},
          });
        }
        break;
      case "Pendiente Firma 1":
        const imageSignOne = await documentConglomerado.embedPng(file.buffer);
        const signOneDims = imageSignOne.scale(0.1);
        // obtener las paginas del documento
        const pages = documentConglomerado.getPages();
        //* firma de la pagina 8
        const base64SignOne = await signDocument(
          pages,
          imageSignOne,
          signOneDims,
          signatureInfo[1],
          documentConglomerado,
          req.user,
          "contrato"
        );
        // guardar en pdf en la bd y el cliente
        //* actualizar el documento en aws s3
        //? primero borramos el existente con el idDocument
        const params1 = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: conglomeradoDoc.idDocument,
        };
        await s3.send(new DeleteObjectCommand(params1));
        //? Ahora subiremos el nuevo documento
        const paramsNew1 = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Body: base64SignOne,
          ContentType: "application/pdf",
          Key: conglomeradoDoc.idDocument,
        };
        await s3.send(new PutObjectCommand(paramsNew1));
        // actualizar el documento en la bd
        await updateDocumentPdf("Pendiente Certificación", id, session);
        await session.commitTransaction();
        return res.status(200).json({
          status: "success",
          message: `Firma 1 Realizada con éxito.`,
          data: {},
        });
        break;
      case "Pendiente Firma 2":
        // firmar documento con firma 1
        const imageSignTwo = await documentConglomerado.embedPng(
          Buffer.from(file.buffer, "base64")
        );
        const signTwoDims = imageSignTwo.scale(0.1);
        const pages2 = documentConglomerado.getPages();
        const base64SignTwo = await signDocument(
          pages2,
          imageSignTwo,
          signTwoDims,
          signatureInfo[2],
          documentConglomerado,
          req.user,
          "contrato"
        );
        // guardar en pdf en la bd y el cliente
        //* actualizar el documento en aws s3
        //? primero borramos el existente con el idDocument
        const params2 = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: conglomeradoDoc.idDocument,
        };
        await s3.send(new DeleteObjectCommand(params2));
        //? Ahora subiremos el nuevo documento
        const paramsNew2 = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Body: base64SignTwo,
          ContentType: "application/pdf",
          Key: conglomeradoDoc.idDocument,
        };
        await s3.send(new PutObjectCommand(paramsNew2));
        // actualizar el documento en la bd
        await updateDocumentPdf("Pendiente Certificación", id, session);
        await session.commitTransaction();
        return res.status(200).json({
          status: "success",
          message: `Firma 2 Realizada con éxito.`,
          data: {},
        });
        break;
    }
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  } finally {
    await session.endSession();
  }
};
export { addDocument, signDocumentConglomerado };
