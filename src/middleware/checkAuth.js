import User from "../model/User.js";

async function checkAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res.status(401).json({ message: "Acceso no autorizado" });
  }
  // Extraer las credenciales de Basic Auth de la cadena codificada en Base64
  const encodedCredentials = authHeader.substring(6);
  const decodedCredentials = Buffer.from(encodedCredentials, "base64").toString(
    "utf-8"
  );
  const [email, password] = decodedCredentials.split(":");
  const normalPassword = Buffer.from(password, "base64").toString("utf-8");
  try {
    // Realiza la autenticación verificando el nombre de usuario y la contraseña
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Nombre de usuario incorrecto" });
    }
    if (!(user.password === normalPassword)) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }
    // El usuario está autenticado
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
}

export default checkAuth;
