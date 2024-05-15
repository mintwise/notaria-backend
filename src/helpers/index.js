import Pdf from "../model/Pdf.js";
import { rgb } from "pdf-lib";
import { arrayBufferToBase64 } from "../utils/converter.js";
import _ from "lodash";

export const signDocument = async (
  pages,
  signImg,
  signImgDims,
  userInfo,
  base64Document,
  user,
  numPage
) => {
  // firma del contrato
  if (numPage === "contrato") {
    const page = pages[pages.length - 1];
    page.drawImage(signImg, {
      x: userInfo.sign.position.x,
      y: userInfo.sign.position.y,
      width: signImgDims.width / 2,
      height: signImgDims.height / 2,
    });
    page.drawText(user.name, {
      x: userInfo.sign.namePosition.x,
      y: userInfo.sign.namePosition.y,
      size: 11,
      font: await base64Document.embedFont("Helvetica"),
      color: rgb(0, 0, 0),
    });
    // firma representante legal
    page.drawText(user.name, {
      x: userInfo.sign.repPosition.x,
      y: userInfo.sign.repPosition.y,
      size: 11,
      font: await base64Document.embedFont("Helvetica"),
      color: rgb(0, 0, 0),
    });
    page.drawText(user.rut, {
      x: userInfo.sign.rutPosition.x,
      y: userInfo.sign.rutPosition.y,
      size: 11,
      font: await base64Document.embedFont("Helvetica"),
      color: rgb(0, 0, 0),
    });
    const pdfBytes = await base64Document.save();
    return pdfBytes;
  }
};
export const updateDocumentPdf = async (state, id, session) => {
  return await Pdf.findByIdAndUpdate(
    { _id: id },
    {
      state,
    },
    { new: true }
  ).session(session);
};

export const saveDocumentPdf = async (
  user,
  client,
  state,
  typeDocument,
  base64Document,
  url,
  idDocument,
  filename,
  canal,
  session
) => {
  const documentPdfTemplate = new Pdf({
    nameResponsible: user.name,
    rutResponsible: user.rut,
    emailResponsible: user.email,
    nameClient: client.nameClient,
    rutClient: client.rutClient,
    emailClient: client.emailClient,
    state: state,
    typeDocument: typeDocument,
    filenameDocument: filename,
    base64Document,
    url,
    idDocument,
    canal: canal ? canal : null,
  });
  await documentPdfTemplate.save({ session });
  return documentPdfTemplate;
};
// generar valor para usar en base de datos.
export const generateValue = (value) => {
  return _.deburr(`${value}`.trimEnd().trimStart().replace(/ /g, "_"));
};
// generar RUT sin guion ni puntos para guardar en bd
export const generateRutValue = (value) => {
  return value.replace(/[^0-9a-zA-Z]/g, "");
};

export const handleErrorResponse = (res, status, message) => {
  return res.status(status).json({
    status: "error",
    message: message,
    data: {},
  });
};
