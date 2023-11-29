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
  if (numPage === 6) {
    const page = pages[userInfo.signPage7.page];
    page.drawImage(signImg, {
      x: userInfo.signPage7.position.x,
      y: userInfo.signPage7.position.y,
      width: signImgDims.width / 2,
      height: signImgDims.height / 2,
    });
    const pdfBytes = await base64Document.save();
    const base64Sign = arrayBufferToBase64(pdfBytes);
    return base64Sign;
  }
  if (numPage === 15) {
    pages.drawImage(signImg, {
      x: userInfo.signPage15.position.x,
      y: userInfo.signPage15.position.y,
      width: signImgDims.width / 2,
      height: signImgDims.height / 2,
    });
    pages.drawText(user.name, {
      x: userInfo.signPage15.namePosition.x,
      y: userInfo.signPage15.namePosition.y,
      size: 11,
      font: await base64Document.embedFont("Helvetica"),
      color: rgb(0, 0, 0),
    });
    // firma representante legal
    pages.drawText(user.name, {
      x: userInfo.signPage15.repPosition.x,
      y: userInfo.signPage15.repPosition.y,
      size: 11,
      font: await base64Document.embedFont("Helvetica"),
      color: rgb(0, 0, 0),
    });
    pages.drawText(user.rut, {
      x: userInfo.signPage15.rutPosition.x,
      y: userInfo.signPage15.rutPosition.y,
      size: 11,
      font: await base64Document.embedFont("Helvetica"),
      color: rgb(0, 0, 0),
    });
    const actualDate = new Date();
    const formatDate = formatDateToDDMMYYYY(actualDate);
    pages.drawText(formatDate, {
      x: 113,
      y: 239,
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
