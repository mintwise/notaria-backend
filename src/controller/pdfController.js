import mongoose from "mongoose";
import Client from "../model/Clients.js";
import documentPDF from "../model/Pdf.js";

const getPdf = async (req, res) => {
  const session = mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    if (req.user.role === "API") {
      return res.status(400).json({
        status: "error",
        message: `No tiene permisos para realizar esta acción.`,
        data: {},
      });
    }
    const result = await documentPDF.findById({ _id: id }).session(session);

    if (!result) {
      return res.status(400).json({
        status: "error",
        message: `Documento no existe.`,
        data: {},
      });
    }
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Documento encontrado.`,
      data: {
        document: result,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  } finally {
    session.endSession();
  }
};

const getPdfs = async (req, res) => {
  const session = mongoose.startSession();
  session.startTransaction();
  try {
    if (req.user.role === "API") {
      return res.status(400).json({
        status: "error",
        message: `No tiene permisos para realizar esta acción.`,
        data: {},
      });
    }
    const result = await documentPDF.find().session(session);
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Documentos`,
      data: {
        documents: result,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  } finally {
    session.endSession();
  }
};

const getCLientsByRut = async (req, res) => {
  const session = mongoose.startSession();
  session.startTransaction();
  try {
    if (req.user.role === "API") {
      return res.status(400).json({
        status: "error",
        message: `No tiene permisos para realizar esta acción.`,
        data: {},
      });
    }
    const { rut } = req.query;
    const clients = await Client.findOne({ rutClient: rut }).session(session);
    const types = {
      Contrato: false,
      Poliza: false,
      Conglomerado: false,
    };
    if (!clients) {
      return res.status(400).json({
        status: "error",
        message: `Cliente no existe.`,
        data: {},
      });
    }
    {
      if (!clients.documents) {
        return res.status(400).json({
          status: "error",
          message: `Cliente no tiene documentos.`,
          data: {},
        });
      } else {
        clients.documents.forEach((document) => {
          if (document.typeDocument === "Contrato") {
            types.Contrato = true;
          }
          if (document.typeDocument === "Poliza") {
            types.Poliza = true;
          }
          if (document.typeDocument === "Conglomerado") {
            types.Conglomerado = true;
          }
        });
      }
    }
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Cliente encontrado.`,
      data: {
        types,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  } finally {
    session.endSession();
  }
};

const getDocumentsCertificate = async (req, res) => {
  const session = mongoose.startSession();
  session.startTransaction();
  try {
    const { state } = req.query;
    if (req.user.role === "API") {
      return res.status(400).json({
        status: "error",
        message: `No tiene permisos para realizar esta acción.`,
        data: {},
      });
    }
    const documents = await documentPDF.find({ state: state }).session(session);
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Documentos Encontrados.`,
      data: {
        documents,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  } finally {
    session.endSession();
  }
};

const deleteDocument = async (req, res) => {
  const { id } = req.params;
  const session = mongoose.startSession();
  session.startTransaction();
  try {
    if (req.user.role === "API") {
      return res.status(400).json({
        status: "error",
        message: `No tiene permisos para realizar esta acción.`,
        data: {},
      });
    }
    const document = await documentPDF
      .findByIdAndDelete({ _id: id })
      .session(session);
    const objectId = new mongoose.Types.ObjectId(id);
    await Client.updateMany({}, { $pull: { documents: { _id: objectId } } });

    if (!document) {
      return res.status(400).json({
        status: "error",
        message: `Documento no existe.`,
        data: {},
      });
    }
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Documento eliminado.`,
      data: {},
    });
  } catch (error) {
    await session.abortTransaction();
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
  getPdf,
  getPdfs,
  getCLientsByRut,
  getDocumentsCertificate,
  deleteDocument,
};
