//modelos
import Pdf from "../model/Pdf.js";
//librerías
import mongoose from "mongoose";
//funciones
import {
  generateValue,
  handleErrorResponse,
  saveDocumentPdf,
} from "../helpers/index.js";
import sendEmail from "../emails/sendEmail.js";
import { v4 } from "uuid";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";
import axios from "axios";
//#region API ICONO
const addDocumentPromesa = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      nameResponsible,
      rutResponsible,
      emailResponsible,
      rutClient,
      typeDocument,
    } = req.query;
    const {
      // datos Vendedor
      vendedoresComunidad,
      rutVendedor,
      apellidoPaternoRazonVendedor,
      apellidoMaternoVendedor,
      nombresVendedor,
      idTipoVendedor,
      calleDomicilioVendedor,
      numeroDomicilioVendedor,
      infoAddDomicilioVendedor,
      idComunaVendedor,
      celularVendedor,
      mailVendedor,
      // Comprador
      rutComprador,
      apellidoPaternoRazonComprador,
      apellidoMaternoComprador,
      nombresComprador,
      idTipoComprador,
      calleDomicilioComprador,
      numeroDomicilioComprador,
      infoAddDomicilioComprador,
      idComunaComprador,
      celularComprador,
      mailComprador,
      compradoresComunidad,
      // Contrato
      idNotarioRepertorio,
      numeroRepertorioVehiculo,
      precioVentaVehiculo,
      avaluoFiscalVehiculo,
      idTipoDocumento,
      numeroDocumentoSTEV,
      idLugarSRCEI,
      fechaRepertorio,
      fechaDocumento,
      impuestoVehiculo,
      CID,
      //Vehículo
      idTipoVehiculo,
      marcaVehiculo,
      anoVehiculo,
      modeloVehiculo,
      colorVehiculo,
      numeroMotorVehiculo,
      numeroChasisVehiculo,
      numeroSerieVehiculo,
      numeroVinVehiculo,
      placaPatenteVehiculo,
      // Emails
      emails,
    } = req.body;
    const file = req.file;
    //* PRIMER ENDPOINT
    //obtener username y password
    const formData = {
      usuarioVehiculos: process.env.API_USERNAME,
      passUsuarioVehiculos: process.env.API_PASSWORD,
    };
    // llamada a la api
    const apiUrl =
      "https://www.notariosycbrs.cl/SrvcsRst/RstSrvcsXVhclsLgN.php";
    const responseToken = await axios.post(apiUrl, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // console.log(responseToken.data, "response 1 data------------------------------------")
    //obtener token
    const token = responseToken.data.find(
      (element) => "tokenVehiculos" in element
    );

    //* SEGUNDO ENDPOINT
    // se inicia un formdata para enviar los datos
    const formData2 = new FormData();
    // se agregan los datos al form-data
    formData2.append("tokenVehiculos", token.tokenVehiculos);
    formData2.append("vendedoresComunidad", parseInt(vendedoresComunidad));
    formData2.append("rutVendedor1", rutVendedor);
    formData2.append(
      "apellidoPaternoRazonVendedor1",
      apellidoPaternoRazonVendedor
    );
    formData2.append("apellidoMaternoVendedor1", apellidoMaternoVendedor);
    formData2.append("nombresVendedor1", nombresVendedor);
    formData2.append("idTipoVendedor1", parseInt(idTipoVendedor));
    formData2.append("calleDomicilioVendedor1", calleDomicilioVendedor);
    formData2.append("numeroDomicilioVendedor1", numeroDomicilioVendedor);
    formData2.append("infoAddDomicilioVendedor1", infoAddDomicilioVendedor);
    formData2.append("idComunaVendedor1", parseInt(idComunaVendedor));
    formData2.append("celularVendedor1", celularVendedor);
    formData2.append("mailVendedor1", mailVendedor);
    formData2.append("rutComprador1", rutComprador);
    formData2.append(
      "apellidoPaternoRazonComprador1",
      apellidoPaternoRazonComprador
    );
    formData2.append("apellidoMaternoComprador1", apellidoMaternoComprador);
    formData2.append("nombresComprador1", nombresComprador);
    formData2.append("idTipoComprador1", parseInt(idTipoComprador));
    formData2.append("calleDomicilioComprador1", calleDomicilioComprador);
    formData2.append("numeroDomicilioComprador1", numeroDomicilioComprador);
    formData2.append("infoAddDomicilioComprador1", infoAddDomicilioComprador);
    formData2.append("idComunaComprador1", parseInt(idComunaComprador));
    formData2.append("celularComprador1", celularComprador);
    formData2.append("mailComprador1", mailComprador);
    formData2.append("compradoresComunidad", parseInt(compradoresComunidad));
    formData2.append("idNotarioRepertorio", parseInt(idNotarioRepertorio));
    formData2.append(
      "numeroRepertorioVehiculo",
      parseInt(numeroRepertorioVehiculo)
    );
    formData2.append("precioVentaVehiculo", parseInt(precioVentaVehiculo));
    formData2.append("avaluoFiscalVehiculo", parseInt(avaluoFiscalVehiculo));
    formData2.append("idTipoDocumento", parseInt(idTipoDocumento));
    formData2.append("numeroDocumentoSTEV", parseInt(numeroDocumentoSTEV));
    formData2.append("idLugarSRCEI", parseInt(idLugarSRCEI));
    formData2.append(
      "fechaRepertorio",
      new Date(fechaRepertorio).toISOString().slice(0, 10)
    );
    formData2.append(
      "fechaDocumento",
      new Date(fechaDocumento).toISOString().slice(0, 10)
    );
    formData2.append("impuestoVehiculo", parseInt(impuestoVehiculo));
    formData2.append("CID", CID);
    formData2.append("idTipoVehiculo", parseInt(idTipoVehiculo));
    formData2.append("marcaVehiculo", marcaVehiculo);
    formData2.append("anoVehiculo", parseInt(anoVehiculo));
    formData2.append("modeloVehiculo", modeloVehiculo);
    formData2.append("colorVehiculo", colorVehiculo);
    formData2.append("numeroMotorVehiculo", numeroMotorVehiculo);
    formData2.append("numeroChasisVehiculo", numeroChasisVehiculo);
    formData2.append("numeroSerieVehiculo", numeroSerieVehiculo);
    formData2.append("numeroVinVehiculo", numeroVinVehiculo);
    formData2.append("placaPatenteVehiculo", placaPatenteVehiculo);
    // llamada a la api
    const apiUrl2 = "https://www.notariosycbrs.cl/SrvcsRst/NyctRprtrs.php";
    const config2 = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };
    const responseApi2 = await axios.post(apiUrl2, formData2, config2);

    //* TERCER ENDPOINT
    const apiUrl3 = "https://www.notariosycbrs.cl/SrvcsRst/CrgRchv.php";
    const formData3 = new FormData();
    formData3.append("tokenVehiculos", token.tokenVehiculos);
    formData3.append(
      "idRepertorioVehiculo",
      responseApi2.data[1].numeroIdRepertorio
    );
    const blob = new Blob([file.buffer], { type: "application/pdf" });
    formData3.append("archivo", blob, file.originalname);
    await axios.post(apiUrl3, formData3, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    //* CUARTO ENDPOINT
    const apiUrl4 = "https://www.notariosycbrs.cl/SrvcsRst/CnsltStd.php";
    const formData4 = new FormData();
    formData4.append("tokenVehiculos", token.tokenVehiculos);
    formData4.append(
      "idRepertorioVehiculo",
      responseApi2.data[1].numeroIdRepertorio
    );
    const responseApi4 = await axios.post(apiUrl4, formData4, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    //* QUINTO ENDPOINT (nosotros)
    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    // función que formatea el nombre del documento
    const filename = generateValue(file.originalname);
    //inserta el documento en la bd PDF
    const usuario = {
      name: nameResponsible,
      rut: rutResponsible,
      email: emailResponsible,
    };
    //TODO: confirmar esta data 
    const cliente = {
      nameClient: nombresComprador,
      rutClient,
      emailClient: mailComprador,
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
    const statusApi = responseApi4.data.find((element) => "estado" in element);
    let statusToBd = statusApi ? statusApi.estado : "No Iniciado";
    await saveDocumentPdf(
      usuario,
      cliente,
      statusToBd,
      typeDocument,
      null,
      urlDocument,
      idDocument,
      filename,
      "interno",
      session
    );
    // ENVIAR EMAIL DE CONFIRMACIÓN
    const base64Document = Buffer.from(file.buffer).toString("base64");
    if (emails) {
      emails.push(
        mailVendedor,
        mailComprador,
        "firmanotarial@notariacamilla.cl"
      );
      const datos = {
        subject: `Creación De Documento ${typeDocument}`,
        message: `Se ha subido el documento "${filename
          .trim()
          .replace(/\.pdf$/, "")}" con éxito.`,
        to: emails,
        base64Document,
        filenameDocument: filename
      };
      await sendEmail(datos);
    } else {
      const datos = {
        subject: `Creación De Documento ${typeDocument}`,
        message: `Se ha subido el documento "${filename
          .trim()
          .replace(/\.pdf$/, "")}" con éxito.`,
        to: [mailVendedor, mailComprador, "firmanotarial@notariacamilla.cl"],
        base64Document,
        filenameDocument: filename
      };
      await sendEmail(datos);
    }
    // RESPUESTA DEL SERVIDOR
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Documento creado con éxito.`,
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
// #region DOCUMENTOS PROMESA
const listDocumentPromesa = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const documents = await Pdf.find(
      {
        typeDocument: { $eq: "Promesa" },
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

const getDocumentPromesa = async (req, res) => {
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

const editDocumentPromesa = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const file = req.file;
    const { id } = req.query;
    const { emails } = req.body;
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
    let updated = await Pdf.findOneAndUpdate(
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
    // ENVIAR EMAIL DE CONFIRMACIÓN
    let base64Document = Buffer.from(file.buffer).toString("base64");
    if (emails) {
      emails.push(updated.emailResponsible, updated.emailClient);
      const datos = {
        subject: "Actualización De Documento Genérico",
        message: `Se ha actualizado el documento "${updated.filenameDocument
          .trim()
          .replace(/\.pdf$/, "")}" con éxito.`,
        to: emails,
        base64Document,
        filenameDocument: updated.filenameDocument,
      };
      await sendEmail(datos);
    } else {
      const datos = {
        subject: "Actualización De Documento Genérico",
        message: `Se ha actualizado el documento "${updated.filenameDocument
          .trim()
          .replace(/\.pdf$/, "")}" con éxito.`,
        to: [updated.emailResponsible, updated.emailClient],
        base64Document,
        filenameDocument: updated.filenameDocument,
      };
      await sendEmail(datos);
    }
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

const deleteDocumentPromesa = async (req, res) => {
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
  listDocumentPromesa,
  getDocumentPromesa,
  addDocumentPromesa,
  editDocumentPromesa,
  deleteDocumentPromesa,
};
