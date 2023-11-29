import mongoose from "mongoose";

const documentPDF = new mongoose.Schema(
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
    },
    typeDocument: {
      type: String,
    },
    canal: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

const Pdf = mongoose.model("DocumentPDF", documentPDF, "DocumentPDF");
export default Pdf;
