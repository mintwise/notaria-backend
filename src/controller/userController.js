import User from "../model/User.js";

const registrar = async (req, res) => {
  const { email } = req.body;
  const existUser = await User.findOne({ email });
  // comprobar si existe el usuario
  if (existUser) {
    const error = new Error("El usuario ya esta registrado");
    return res.status(400).json({ msg: error.message });
  }
  try {
    // guardar nuevo usuario
    const user = new User(req.body);
    const userSave = await user.save();
    res.json(userSave);
  } catch (error) {
    console.log(error);
  }
};

const autenticar = async (req, res) => {
  const { email, password } = req.body;
  // comprobar si existe el usuario
  const usuario = await User.findOne({ email });

  if (!usuario) {
    const error = new Error("usuario no existe");
    return res.status(403).json({ msg: error.message });
  }
  // Autenticar el usuario
  // Revisar el password
  if (await usuario.comprobarPassword(password)) {
    const { name, rut, role, email, _id, password } = usuario;
    const base64Password = Buffer.from(password, "utf-8").toString("base64");
    console.log(base64Password);
    res.json({
      _id,
      name,
      rut,
      role,
      email,
      password: base64Password,
    });
  } else {
    const error = new Error("Contraseña incorrecta");
    return res.status(403).json({ msg: error.message });
  }
};

const nuevoPassword = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("usuario no existe");
    return res.status(403).json({ msg: error.message });
  }
  // Cambiar la contraseña y guardarla en la base de datos
  user.password = password;
  await user.save();
  res.status(200).json({ message: "Contraseña restablecida con éxito" });
};

export { registrar, autenticar, nuevoPassword };
