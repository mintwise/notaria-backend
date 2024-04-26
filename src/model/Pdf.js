import mongoose from "mongoose";

const DocumentPDF = new mongoose.Schema(
  {
    nameResponsible: {
      type: String,
    },
    rutResponsible: {
      type: String,
    },
    emailResponsible: {
      type: String,
    },
    nameClient: {
      type: String,
    },
    rutClient: {
      type: String,
    },
    emailClient: {
      type: String,
    },
    state: {
      type: String,
      default: "Pendiente",
    },
    filenameDocument: {
      type: String,
    },
    base64Document: {
      type: String,
      default: null,
    },
    idDocument: {
      type: String,
      default: null,
    },
    url: {
      type: String,
      default: null,
    },
    typeDocument: {
      type: String,
    },
    canal: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Pdf = mongoose.model("DocumentPDF", DocumentPDF, "DocumentPDF");
export default Pdf;
