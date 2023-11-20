// librerías
import { PDFDocument } from "pdf-lib";
// funciones de utilidad
import {
  arrayBufferToBase64,
  formatValue
} from "../utils/converter.js";
import {
  saveDocumentPdf,
  updateDocumentPdf,
  signDocument,
} from "../helpers/index.js";
//modelos
import Client from "../model/Clients.js";
import Pdf from "../model/Pdf.js";
import User from "../model/User.js";
import DocumentTemplate from "../model/DocumentTemplate.js";
import SignTemplate from "../model/SignTemplate.js";

const addDocument = async (req, res) => {
  // validar por rut del cliente si existe póliza para realizar conglomerado
  try {
    const { rutClient, filenameDocument, typeDocument, base64Document } =
      req.body;
    const client = await Client.findOne({ rutClient });
    const contrato = await Pdf.findOne({ rutClient, typeDocument: "Contrato" });
    const poliza = await Pdf.findOne({ rutClient, typeDocument: "Poliza" });
    if (!client) {
      res.status(400).json({
          status: "error",
          message: "No existe cliente.",
          data: {}
      });
      return;
  }
  if (!contrato) {
      res.status(400).json({
          status: "error",
          message: "No existe contrato.",
          data: {}
      });
      return;
  }
  if (poliza) {
      res.status(400).json({
          status: "error",
          message: "La poliza ya fue ingresada.",
          data: {}
      });
      return;
  }
    // función que formatea el nombre del documento
    const filename = formatValue(filenameDocument);
    //inserta la póliza en la bd PDF

    const polizaDocument = await saveDocumentPdf(
      client,
      "Conglomerado Creado",
      typeDocument,
      base64Document,
      filename
    );
    // Cambia el estado del contrato a conglomerado
    contrato.state = "Conglomerado Creado";
    await contrato.save({ new: true });
    // guardar el documento en clients con la data que ya tiene
    const polizaDocumentClient = {
      _id: polizaDocument._id,
      filename,
      typeDocument,
    };
    await Client.updateOne(
      { rutClient },
      { $push: { documents: polizaDocumentClient } }
    );
    //* realiza la operación de conglomerado
    // extraemos la información de los Pdfs
    const contratoPDF = await PDFDocument.load(
      Buffer.from(contrato.base64Document, "base64")
    );
    const polizaPDF = await PDFDocument.load(
      Buffer.from(base64Document, "base64")
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
    // insertar conglomerado en la bd

    const documentConglomerado = await saveDocumentPdf(
      client,
      "Pendiente Firma",
      "Conglomerado",
      base64conglomerado,
      `${contrato.filenameDocument} - ${filename}`
    );
    // agregamos el documento conglomerado al cliente
    const documentConglomeradoClient = {
      _id: documentConglomerado._id,
      filename: `${contrato.filenameDocument} - ${filename}`,
      typeDocument: "Conglomerado",
    };
    await Client.updateOne(
      { rutClient },
      { $push: { documents: documentConglomeradoClient } }
    );
    return res.status(200).json({
      "status": "success",
      "message": `Creado con éxito.`,
      "data": documentConglomerado
  });
  } catch (error) {
    return res.status(500).json({
      "status": "error",
      "message": `${error.message}`,
      "data": {}
  });
  }
};
const signDocumentConglomerado = async (req, res) => {
  const { signOne, email } = req.body;

  const { id } = req.params;
  const user = await User.findOne({ email });
  const conglomeradoDoc = await Pdf.findById({ _id: id });
  if (!user) {
    return res.status(400).json({
      "status": "error",
      "message": `Usuario no existe.`,
      "data": {}
  });
  }
  if (!conglomeradoDoc) {
    return res.status(400).json({
      "status": "error",
      "message": `Documento no existe.`,
      "data": {}
  });
  }
  const signatureInfo = {
    Alvaro: {
      signPage7: {
        page: 6,
        position: { x: 100, y: 520 },
      },
      signPage15: {
        page: 0,
        position: { x: 60, y: 610 },
        namePosition: { x: 145, y: 640 },
        rutPosition: { x: 320, y: 640 },
        repPosition: { x: 225, y: 598 },
      },
    },
    Javier: {
      signPage7: {
        page: 6,
        position: { x: 280, y: 520 },
      },
      signPage15: {
        page: 0,
        position: { x: 60, y: 450 },
        namePosition: { x: 145, y: 490 },
        rutPosition: { x: 320, y: 490 },
        repPosition: { x: 225, y: 448 },
      },
    },
  };
  const nameWithoutLastName = user.name.split(" ")[0];
  const userInfo = signatureInfo[nameWithoutLastName];
  //* extraer los datos
  const documentConglomerado = await PDFDocument.load(
    Buffer.from(conglomeradoDoc.base64Document, "base64")
  );
  const pages = documentConglomerado.getPages();
  const state = conglomeradoDoc.state;
  switch (state) {
    case "Pendiente Firma":
      if (nameWithoutLastName==='Alvaro') {
        const imageSignOne = await documentConglomerado.embedPng(signOne);
        const signOneDims = imageSignOne.scale(0.1);
        //* firma de la pagina 8
        const base64SignOne = await signDocument(
          pages,
          imageSignOne,
          signOneDims,
          userInfo,
          documentConglomerado,
          user,
          6
        );
        // guardar en pdf en la bd y el cliente
        const result = await updateDocumentPdf(
          "Pendiente Firma 2",
          base64SignOne,
          id,
          conglomeradoDoc
        );
        //* Buscamos el template en la bd y lo creamos
        const template = await DocumentTemplate.findOne({
          typeDocument: "Template",
        });
        if(!template){
          return res.status(400).json({
            "status": "error",
            "message": `No existe el template.`,
            "data": {}
        });
        }
        const base64Template = await PDFDocument.load(
          Buffer.from(template.base64Document, "base64")
        ); // lo firmamos
        const [page] = base64Template.getPages();

        const imageSign1 = await base64Template.embedPng(signOne);
        const imageSign1Dims = imageSign1.scale(0.1);
        const base64TemplateSignOne = await signDocument(
          page,
          imageSign1,
          imageSign1Dims,
          userInfo,
          base64Template,
          user,
          15
        );
        // y lo guardo en la bd en otra colección asociado
        const signTemplate = new SignTemplate({
          idDocument: result._id,
          base64Document: base64TemplateSignOne,
        });
        await signTemplate.save();
        return res.status(200).json({
          "status": "success",
          "message": `Firma 1 Realizada con éxito.`,
          "data": {
            signTemplate
          }
      });
      }
      if (nameWithoutLastName==='Javier' ) {
        // firmo el segundo
        // creamos el template en la bd por primera vez
        // pendiente firma 1
        const imageSignTwo = await documentConglomerado.embedPng(
          signOne
        );
        const signTwoDims = imageSignTwo.scale(0.1);
        //* firma de la pagina 8
        const base64SignTwo = await signDocument(
          pages,
          imageSignTwo,
          signTwoDims,
          userInfo,
          documentConglomerado,
          user,
          6
        );
        // guardar en pdf en la bd y el cliente
        const result = await updateDocumentPdf(
          "Pendiente Firma 1",
          base64SignTwo,
          id,
          conglomeradoDoc
        );
        // creamos el template en la bd por primera vez
        // firmo template con la firma 1
        // y lo guardo en la bd en otra colección asociado
        //* Buscamos el template en la bd y lo creamos
        const template = await DocumentTemplate.findOne({
          typeDocument: "Template",
        });
        if(!template){
          return res.status(400).json({
            "status": "error",
            "message": `No existe el template.`,
            "data": {}
        });
        }
        const base64Template = await PDFDocument.load(
          Buffer.from(template.base64Document, "base64")
        ); // lo firmamos
        const [page] = base64Template.getPages();
        const imageSign2 = await base64Template.embedPng(signOne);
        const imageSign2Dims = imageSign2.scale(0.1);
        const base64TemplateSignOne = await signDocument(
          page,
          imageSign2,
          imageSign2Dims,
          userInfo,
          base64Template,
          user,
          15
        );
        // y lo guardo en la bd en otra colección asociado
        const signTemplate = new SignTemplate({
          idDocument: result._id,
          base64Document: base64TemplateSignOne,
        });
        await signTemplate.save();
        return res.status(200).json({
          "status": "success",
          "message": `Firma 2 Realizada con éxito.`,
          "data": {
            signTemplate
          }
      });
      }
      break;
    case "Pendiente Firma 1":
      try {
        // firmar documento con firma 1
        const imageSignOne = await documentConglomerado.embedPng(
          Buffer.from(signOne, "base64")
        );
        const signOneDims = imageSignOne.scale(0.1);
        //* firma de la pagina 8
        const base64SignOne = await signDocument(
          pages,
          imageSignOne,
          signOneDims,
          userInfo,
          documentConglomerado,
          user,
          6
        );
        // guardar en pdf en la bd y el cliente
        await updateDocumentPdf(
          "Pendiente Certificación",
          base64SignOne,
          id,
          conglomeradoDoc
        );
        // buscar el template con la firma 2 (id de mongo)
        const signTemplate = await SignTemplate.findOne({ idDocument: id });
        if(!signTemplate){
          return res.status(400).json({
            "status": "error",
            "message": `No existe el template.`,
            "data": {}
        });
        }
        const templateWithSignTwo = await PDFDocument.load(
          Buffer.from(signTemplate.base64Document, "base64")
        );

        const [page] = templateWithSignTwo.getPages();
        const imageSign1 = await templateWithSignTwo.embedPng(signOne);
        const imageSign1Dims = imageSign1.scale(0.1);
        // firmar el template con la firma 1
        const base64Template = await signDocument(
          page,
          imageSign1,
          imageSign1Dims,
          userInfo,
          templateWithSignTwo,
          user,
          15
        );
        // actualizar en la bd con la colección signTemplate
        await SignTemplate.updateOne(
          { _id: signTemplate.id },
          { base64Document: base64Template }
        );
        return res.status(200).json({
          "status": "success",
          "message": `Firma 1 Realizada con éxito.`,
          "data": {}
      });
      } catch (error) {
        return res.status(500).json({
          "status": "error",
          "message": `${error.message}`,
          "data": {}
      });
      }
      break;
    case "Pendiente Firma 2":
      try {
        // firmar documento con firma 1
        const imageSignTwo = await documentConglomerado.embedPng(
          Buffer.from(signOne, "base64")
        );
        const signTwoDims = imageSignTwo.scale(0.1);
        //* firma de la pagina 8
        const base64SignTwo = await signDocument(
          pages,
          imageSignTwo,
          signTwoDims,
          userInfo,
          documentConglomerado,
          user,
          6
        );
        // guardar en pdf en la bd y el cliente
        await updateDocumentPdf(
          "Pendiente Certificación",
          base64SignTwo,
          id,
          conglomeradoDoc
        );
        // buscar el template con la firma 2 (id de mongo)
        const signTemplate2 = await SignTemplate.findOne({ idDocument: id });
        if(!signTemplate2){
          return res.status(400).json({
            "status": "error",
            "message": `No existe el template.`,
            "data": {}
        });
        }
        const templateWithSignOne = await PDFDocument.load(
          Buffer.from(signTemplate2.base64Document, "base64")
        );
        const imageSign2 = await templateWithSignOne.embedPng(signOne);
        const imageSign2Dims = imageSign2.scale(0.1);
        const [page] = templateWithSignOne.getPages();
        // firmar el template con la firma 1
        const base64Template2 = await signDocument(
          page,
          imageSign2,
          imageSign2Dims,
          userInfo,
          templateWithSignOne,
          user,
          15
        );
        // actualizar en la bd con la colección signTemplate
        await SignTemplate.updateOne(
          { idDocument: id },
          { base64Document: base64Template2 }
        );
        return res.status(200).json({
          "status": "success",
          "message": `Firma 2 Realizada con éxito.`,
          "data": {
            base64signTwo: base64Template2
          }
      });
      } catch (error) {
        return res.status(500).json({
          "status": "error",
          "message": `${error.message}`,
          "data": {}
      });
      }
      break;
  }
};
const signDocumentTest = async (req, res) => {
  try {
    // Cargar la plantilla de documento
    const { image } = req.body;
    const template = await DocumentTemplate.findOne({
      typeDocument: "Template",
    });
    const templateBuffer = Buffer.from(template.base64Document, "base64");
    const pdfDoc = await PDFDocument.load(templateBuffer);
    const [page] = pdfDoc.getPages();

    // Cargar la imagen de la firma
    const imageBuffer = Buffer.from(image, "base64");
    const pngImage = await pdfDoc.embedPng(imageBuffer);
    const pngDims = pngImage.scale(0.1);
    // Agregar la imagen a la página del documento
    const { width, height } = page.getSize();
    page.drawImage(pngImage, {
      x: 100, // Ajusta la posición X según tus necesidades
      y: 400, // Ajusta la posición Y según tus necesidades
      width: pngDims.width / 2, // Ajusta el tamaño de la imagen
      height: pngDims.height / 2, // Ajusta el tamaño de la imagen
    });

    // Guardar el documento firmado
    const modifiedPdfBytes = await pdfDoc.save();
    const base64ModifiedPdf = arrayBufferToBase64(modifiedPdfBytes)
    return res.status(200).json(base64ModifiedPdf);
  } catch (error) {
    return res.status(500).json({
      "status": "error",
      "message": `${error.message}`,
      "data": {}
  });
  }
};
export { addDocument, signDocumentConglomerado, signDocumentTest };
