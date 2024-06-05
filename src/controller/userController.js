import generarJWT from "../helpers/generarJWT.js";
import User from "../model/User.js";

const registrar = async (req, res) => {
  const { email } = req.body;
  const existUser = await User.findOne({ email });
  // comprobar si existe el usuario
  if (existUser) {
    const error = new Error("El usuario ya esta registrado");
    return res.status(403).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  }
  try {
    // guardar nuevo usuario
    const user = new User(req.body);
    const userSave = await user.save();
    res.status(200).json({
      status: "success",
      message: `Usuario creado correctamente.`,
      data: {
        user: userSave,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  }
};

const autenticar = async (req, res) => {
  const { email, password } = req.body;
  // comprobar si existe el usuario
  const usuario = await User.findOne({ email });

  if (!usuario) {
    const error = new Error("usuario no existe");
    return res.status(403).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  }
  // Autenticar el usuario
  // Revisar el password
  if (await usuario.comprobarPassword(password)) {
    const { name, rut, role, email, _id, password } = usuario;
    const base64Password = Buffer.from(password, "utf-8").toString("base64");
    return res.status(200).json({
      status: "success",
      message: `Usuario autenticado correctamente.`,
      data: {
        _id,
        name,
        rut,
        role,
        email,
        password: base64Password,
        token: generarJWT(usuario._id),
        inmobiliariaName: usuario.inmobiliariaName,
        "v-m": usuario["v-m"] ? usuario["v-m"] : null,
      },
    });
  } else {
    const error = new Error("Contraseña incorrecta");
    return res.status(403).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  }
};

const nuevoPassword = async (req, res) => {
  const {id}= req.params;
  const { passwordActual, passwordNuevo } = req.body;

  const user = await User.findById({_id: id });
  if (!user) {
    const error = new Error("usuario no existe");
    return res.status(403).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  }
  // Cambiar la contraseña y guardarla en la base de datos
  if(await user.comprobarPassword(passwordActual)){

    user.password = passwordNuevo;
    await user.save();
    return res.status(200).json({
      status: "success",
      message: `Contraseña actualizada correctamente.`,
      data: {},
    });
  }else{
    const error = new Error("El Password Actual es incorrecto");
    return res.status(403).json({
      status: "error",
      message: `${error.message}`,
      data: {},
    });
  }
};

export { registrar, autenticar, nuevoPassword };
