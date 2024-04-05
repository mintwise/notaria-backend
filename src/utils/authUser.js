import User from "../model/User.js";
import jwt from "jsonwebtoken";

export const authUser = async (res, token) => {
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById({ _id: decodedToken.id });
  return user;
};
