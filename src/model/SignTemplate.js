import mongoose from "mongoose";

const SignTemplate = new mongoose.Schema({
    idDocument: "String",
    base64Document: "String",
})

export default mongoose.model("SignTemplate", SignTemplate, "SignTemplate");