import Pdf from "../model/Pdf.js";
import { rgb } from "pdf-lib";
import { arrayBufferToBase64, formatDateToDDMMYYYY } from "../utils/converter.js";

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
    const page = pages[pages.length - 1]
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
    const base64Sign = arrayBufferToBase64(pdfBytes);
    return base64Sign;
  }
  if (numPage === "template") {
    pages.drawImage(signImg, {
      x: userInfo.sign.position.x,
      y: userInfo.sign.position.y,
      width: signImgDims.width / 2,
      height: signImgDims.height / 2,
    });
    pages.drawText(user.name, {
      x: userInfo.sign.namePosition.x,
      y: userInfo.sign.namePosition.y,
      size: 11,
      font: await base64Document.embedFont("Helvetica"),
      color: rgb(0, 0, 0),
    });
    // firma representante legal
    pages.drawText(user.name, {
      x: userInfo.sign.repPosition.x,
      y: userInfo.sign.repPosition.y,
      size: 11,
      font: await base64Document.embedFont("Helvetica"),
      color: rgb(0, 0, 0),
    });
    pages.drawText(user.rut, {
      x: userInfo.sign.rutPosition.x,
      y: userInfo.sign.rutPosition.y,
      size: 11,
      font: await base64Document.embedFont("Helvetica"),
      color: rgb(0, 0, 0),
    });
    const pdfBytes = await base64Document.save();
    const base64Sign = arrayBufferToBase64(pdfBytes);
    return base64Sign;
  }
};
export const updateDocumentPdf = async (state, base64Sign, id) => {
  // actualiza el documento PDF
  const document = {
    state,
    base64Document: base64Sign,
  };
  return await Pdf.findByIdAndUpdate({ _id: id }, document, { new: true });
};

export const saveDocumentPdf = async (documento,state,typeDocument, base64Document, filename, canal) => {
    const documentPdfTemplate = new Pdf({
        nameResponsible: documento.nameResponsible,
        rutResponsible: documento.rutResponsible,
        emailResponsible: documento.emailResponsible,
        nameClient: documento.nameClient,
        rutClient: documento.rutClient,
        emailClient: documento.emailClient,
        state: state,
        typeDocument: typeDocument,
        filenameDocument: filename,
        base64Document,
        canal: canal ? canal : null
      })
  return await documentPdfTemplate.save();
};
