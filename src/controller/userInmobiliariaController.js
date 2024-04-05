//modelos
import User from "../model/User.js";
import Pdf from "../model/Pdf.js";
//librerías
import mongoose from "mongoose";
import bcrypt from "bcrypt";
//funciones
import { authUser } from "../utils/authUser.js";
import { formatValue } from "../utils/converter.js";
import { saveDocumentPdf } from "../helpers/index.js";
import sendEmail from "../emails/sendEmail.js";

const userList = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // comprobar si existe el usuario
    const token = req.headers.authorization.split(" ")[1];
    await authUser(res, token);
    // búsqueda de los usuarios
    const users = await User.find({
      role: { $in: ["adminInmo", "ejecInmo"] },
    }).session(session);

    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: "Usuarios",
      data: users,
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

const getUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    // comprobar si existe el usuario
    const token = req.headers.authorization.split(" ")[1];
    await authUser(res, token);
    // búsqueda de los usuarios
    const result = await User.findById({ _id: id }).session(session);

    if (!result) {
      return res.status(400).json({
        status: "error",
        message: `Usuario no existe.`,
        data: {},
      });
    }
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Documento encontrado.`,
      data: result,
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

const userCreate = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const body = req.body;
    const token = req.headers.authorization.split(" ")[1];
    await authUser(res, token);
    const existUser = await User.findOne({ email: body.email });
    // comprobar si existe el usuario
    if (existUser) {
      const error = new Error("El usuario ya esta registrado");
      return res.status(403).json({
        status: "error",
        message: `${error.message}`,
        data: {},
      });
    }

    const user = new User(req.body);
    const userSave = await user.save();
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Creado con éxito.`,
      data: userSave,
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

const userEdit = async (req, res) => {
  // validar por rut del cliente si existe póliza para realizar conglomerado
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { password, role } = req.body;
    const token = req.headers.authorization.split(" ")[1];
    await authUser(res, token);
    let update = {};
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      update.password = hash;
    }
    if (role) {
      update.role = role;
    }
    const user = await User.findByIdAndUpdate(id, update, {
      new: true,
    }).session(session);
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: "Editado con éxito.",
      data: user,
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

const userDelete = async (req, res) => {
  // validar por rut del cliente si existe póliza para realizar conglomerado
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    await authUser(res, token);
    const deleted = await User.findByIdAndDelete(id).session(session);
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Eliminado con éxito.`,
      data: deleted,
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

const listDocumentGeneric = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const documents = await Pdf.find(
      {
        typeDocument: { $eq: "Genérico" },
      },
      { base64Document: 0 }
    ).session(session);
    // RESPUESTA DEL SERVIDOR
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Creado con éxito.`,
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
    const { id } = req.params;
    const documents = await Pdf.findById({ _id: id }).session(session);
    // RESPUESTA DEL SERVIDOR
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Creado con éxito.`,
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
    // comprobar si existe el usuario
    const {
      nameResponsible,
      rutResponsible,
      emailResponsible,
      nameClient,
      rutClient,
      emailClient,
      filenameDocument,
      base64Document,
      typeDocument,
    } = req.body;
    // función que formatea el nombre del documento
    const filename = formatValue(filenameDocument);
    //inserta el documento en la bd PDF
    const objectClient = {
      nameResponsible,
      rutResponsible,
      emailResponsible,
      nameClient,
      rutClient,
      emailClient,
    };
    const promesaDocument = await saveDocumentPdf(
      objectClient,
      "Pendiente Revisión",
      typeDocument,
      base64Document,
      filename,
      "interno"
    );
    // ENVIAR EMAIL DE CONFIRMACIÓN
    const datos = {
      subject: "Creación De Documento Genérico",
      name: nameResponsible,
      message: `Se ha subido el documento "${filename}" con éxito.`,
      to: [emailResponsible, emailClient]
    };
    await sendEmail(datos);
    // await sendEmailTest(datos);
    // RESPUESTA DEL SERVIDOR
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Creado con éxito.`,
      data: {
        _id: promesaDocument._id,
        nameResponsible: promesaDocument.nameResponsible,
        rutResponsible: promesaDocument.rutResponsible,
        emailResponsible: promesaDocument.emailResponsible,
        nameClient: promesaDocument.nameClient,
        rutClient: promesaDocument.rutClient,
        emailClient: promesaDocument.emailClient,
        state: promesaDocument.state,
        filenameDocument: promesaDocument.filenameDocument,
        typeDocument: promesaDocument.typeDocument,
        canal: promesaDocument.canal,
      },
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
    const { base64Document } = req.body;
    const { id } = req.params;
    // actualizar el estado del documento conglomerado
    const document = await Pdf.findOne({ _id: id }).session(session);

    if (document.typeDocument !== "Genérico") {
      return res.status(400).json({
        status: "error",
        message: `No se admiten documentos distintos a Documento Genérico.`,
        data: {},
      });
    }
    if (document.state === "Revisado") {
      return res.status(400).json({
        status: "error",
        message: `Documento Revisado.`,
        data: {},
      });
    }
    // actualizar el documento en el cliente y el documento
    const documentCertificate = {
      base64Document,
      state: "Revisado",
    };
    const updated = await Pdf.findOneAndUpdate(
      { _id: id },
      documentCertificate,
      {
        new: true,
      }
    ).session(session);
    // ENVIAR EMAIL DE CONFIRMACIÓN
    const datos = {
      subject: "Actualización De Documento Genérico",
      name: updated.nameResponsible,
      message: `Se ha actualizado el documento "${updated.filenameDocument}" con éxito.`,
      to: [updated.emailResponsible, updated.emailClient],
      base64Document: updated.base64Document,
      filenameDocument: updated.filenameDocument,
    };
    await sendEmail(datos);
    await session.commitTransaction();
    return res.status(200).json({
      status: "success",
      message: `Creado con éxito.`,
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
    const { id } = req.params;
    await Pdf.findByIdAndDelete({ _id: id }).session(session);
    // RESPUESTA DEL SERVIDOR
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
  userList,
  getUser,
  userCreate,
  userEdit,
  userDelete,
  listDocumentGeneric,
  addDocumentGeneric,
  editDocumentGeneric,
  deleteDocumentGeneric,
  getDocumentGeneric,
};
