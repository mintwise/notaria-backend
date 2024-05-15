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
const addDocumentApi = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      // datos Vendedor
      vendedorEsComunidad,
      rutVendedor1,
      apellidoPaternoRazonVendedor1,
      apellidoMaternoVendedor1,
      nombresVendedor1,
      idTipoVendedor1,
      calleDomicilioVendedor1,
      numeroDomicilioVendedor1,
      infoAddDomicilioVendedor1,
      idComunaVendedor1,
      celularVendedor1,
      mailVendedor1,
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
      CompradorEsComunidad,
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
    } = req.body;
    const file = req.file;

    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
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
    console.log(token)

    //* SEGUNDO ENDPOINT
    // se inicia un formdata para enviar los datos
    const formData2 = new FormData();
    const DatosVendedor = {
      vendedorEsComunidad: parseInt(vendedorEsComunidad),
      rutVendedor1,
      apellidoPaternoRazonVendedor1,
      apellidoMaternoVendedor1,
      nombresVendedor1,
      idTipoVendedor1: parseInt(idTipoVendedor1),
      calleDomicilioVendedor1,
      numeroDomicilioVendedor1,
      infoAddDomicilioVendedor1,
      idComunaVendedor1: parseInt(idComunaVendedor1),
      celularVendedor1,
      mailVendedor1,
    };
    const DatosComprador = {
      rutComprador,
      apellidoPaternoRazonComprador,
      apellidoMaternoComprador,
      nombresComprador,
      idTipoComprador: parseInt(idTipoComprador),
      calleDomicilioComprador,
      numeroDomicilioComprador,
      infoAddDomicilioComprador,
      idComunaComprador: parseInt(idComunaComprador),
      celularComprador,
      mailComprador,
      CompradorEsComunidad: parseInt(CompradorEsComunidad),
    };
    const DatosContrato = {
      idNotarioRepertorio: parseInt(idNotarioRepertorio),
      numeroRepertorioVehiculo: parseInt(numeroRepertorioVehiculo),
      precioVentaVehiculo: parseInt(precioVentaVehiculo),
      avaluoFiscalVehiculo: parseInt(avaluoFiscalVehiculo),
      idTipoDocumento:  parseInt(idTipoDocumento),
      numeroDocumentoSTEV: parseInt(numeroDocumentoSTEV),
      idLugarSRCEI: parseInt(idLugarSRCEI),
      fechaRepertorio: new Date(fechaRepertorio).toISOString().slice(0, 10),
      fechaDocumento: new Date(fechaDocumento).toISOString().slice(0, 10),
      impuestoVehiculo: parseInt(impuestoVehiculo),
      CID,
    };
    const DatosVehículo = {
      idTipoVehiculo: parseInt(idTipoVehiculo),
      marcaVehiculo,
      anoVehiculo: parseInt(anoVehiculo),
      modeloVehiculo,
      colorVehiculo,
      numeroMotorVehiculo,
      numeroChasisVehiculo,
      numeroSerieVehiculo,
      numeroVinVehiculo,
      placaPatenteVehiculo
    };
    // se agregan los datos al form-data
    formData2.append("tokenVehiculos", token.tokenVehiculos);
    formData2.append("DatosVendedor", JSON.stringify(DatosVendedor));
    formData2.append("DatosComprador", JSON.stringify(DatosComprador));
    formData2.append("DatosContrato", JSON.stringify(DatosContrato));
    formData2.append("DatosVehículo", JSON.stringify(DatosVehículo));
    // llamada a la api
    const apiUrl2 = "https://www.notariosycbrs.cl/SrvcsRst/NyctRprtrs.php";
    const config2 = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };
    const responseApi2 = await axios.post(apiUrl2, formData2, config2)
    console.log(responseApi2, "response 2 data------------------------------------")
    console.log(typeof responseApi2.data, "response 2 data------------------------------------")


    //* TERCER ENDPOINT
    const apiUrl3 = "https://www.notariosycbrs.cl/SrvcsRst/CrgRchv.php";
    const formData3 = new FormData();
    formData3.append("tokenVehiculos", token.tokenVehiculos);
    //! ACA se debe adjuntar la respuesta del segundo endpoint pero como responseApi2.data es un String se debe confirmar
    formData3.append("idRepertorioVehiculo", 23456);
    //! --------------------------------------------------------------------------------------------------------------
    const blob = new Blob([file.buffer], { type: "application/pdf" });
    formData3.append("archivo", blob, file.originalname);
    const responseApi3 = await axios.post(apiUrl3, formData3, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    // console.log(responseApi3.data, "response 3 data------------------------------------");
    //* CUARTO ENDPOINT
    const apiUrl4 = "https://www.notariosycbrs.cl/SrvcsRst/CnsltStd.php";
    const formData4 = new FormData();
    formData4.append("tokenVehiculos", token.tokenVehiculos);
    formData4.append("idRepertorioVehiculo", 23456);
    const responseApi4 = await axios.post(apiUrl4, formData4, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    // console.log(responseApi4.data, "response 4 data------------------------------------");
    //* QUINTO ENDPOINT (nosotros)
    // ENVIAR EMAIL DE CONFIRMACIÓN
    // const datos = {
    //   subject: "Creación De Documento Genérico",
    //   name: "Notaria Camilla",
    //   message: `Se ha subido el documento "${file.originalname
    //     .trim()
    //     .replace(/\.pdf$/, "")}" con éxito.`,
    //   to: [mailVendedor1, mailComprador],
    // };
    // await sendEmail(datos);
    // RESPUESTA DEL SERVIDOR
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Creado con éxito.`,
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
// #region DOCUMENTOS GENÉRICOS
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
    // // ENVIAR EMAIL DE CONFIRMACIÓN
    // const datos = {
    //   subject: "Creación De Documento ${typeDocument}",
    //   name: nameResponsible,
    //   message: `Se ha subido el documento "${filename
    //     .trim()
    //     .replace(/\.pdf$/, "")}" con éxito.`,
    //   to: [emailResponsible, emailClient],
    // };
    // await sendEmail(datos);
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
  addDocumentApi,
};
