import User from "../model/User.js";
import jwt from "jsonwebtoken";

export const authUser = async (res, token) => {
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById({ _id: decodedToken.id });
    if (user.role !== "AdminNotaria") {
        return res.status(403).json({
          status: "error",
          message: "No tienes permisos para realizar esta acción",
          data: {},
        });
      }
  return user;
};
