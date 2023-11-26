import jwt from "jsonwebtoken";
import User from "../model/User.js";

const checkAuth = async (req, res, next) => {
    let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
        token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password -token');
        return next();
    } catch (error) {
        const e = new Error("Token no valido");
        return res.status(403).json({ msg: e.message });
    }
  }{
        res.status(401).json({ msg: "No se proporciono un token de autenticación" });
    }
};

export default checkAuth;

