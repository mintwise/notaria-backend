import mongoose from "mongoose";
import { MONGO_URI } from "./enviroment.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected`);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

export default connectDB;
