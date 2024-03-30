import User from "../model/User.js";
import mongoose from "mongoose";
import { authUser } from "../utils/authUser.js";
import bcrypt from "bcrypt";

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
    console.log(deleted);
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

export { userList, userCreate, userEdit, userDelete };
