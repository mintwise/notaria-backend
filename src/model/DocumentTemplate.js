import mongoose from "mongoose";

const DocumentTemplate = new mongoose.Schema({
    filename: "String",
    typeDocument: "String",
    base64Document: "String",
},{
    timestamps: false,
    versionKey: false
})

export default mongoose.model("DocumentTemplate", DocumentTemplate, "DocumentTemplate");
