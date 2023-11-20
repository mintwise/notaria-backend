import Client from "../model/Clients.js";
import documentPDF from "../model/Pdf.js";

const getPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await documentPDF.findById({ _id: id });
    if (!result) {
      return res.status(400).json({
        "status": "error",
        "message": `Documento no existe.`,
        "data": {}
    });
    }
    return res.status(200).json({
      "status": "success",
      "message": `Documento encontrado.`,
      "data": {
        document: result
      }
  });
  } catch (error) {
    return res.status(500).json({
      "status": "error",
      "message": `${error.message}`,
      "data": {}
  });
  }
};

const getPdfs = async (req, res) => {
  try {
    const result = await documentPDF.find();
    return res.status(200).json({
      "status": "success",
      "message": `Documentos encontrados.`,
      "data": {
        documents: result
      }
  });
  } catch (error) {
    return res.status(500).json({
      "status": "error",
      "message": `${error.message}`,
      "data": {}
  });
  }
};

const getCLientsByRut = async (req, res) => {
  try {
    const { rut } = req.params;
    const clients = await Client.findOne({ rutClient: rut });
    const types = {
      "Contrato": false,
      "Poliza": false,
      "Conglomerado":  false
    }
    if (!clients) {
      return res.status(400).json({
        "status": "error",
        "message": `Cliente no existe.`,
        "data": {}
    });
    }{
      if(!clients.documents){
        return res.status(400).json({
          "status": "error",
          "message": `Cliente no tiene documentos.`,
          "data": {}
      });        
      }else{
        clients.documents.forEach((document)=>{
          if(document.typeDocument === "Contrato"){
            types.Contrato = true;
          }
          if(document.typeDocument === "Poliza"){
            types.Poliza = true;
          }
          if(document.typeDocument === "Conglomerado"){
            types.Conglomerado = true;
          }
        })
      }
    }
    return res.status(200).json({
      "status": "success",
      "message": `Cliente encontrado.`,
      "data": {
        types
      }
  });
  } catch (error) {
    return res.status(500).json({
      "status": "error",
      "message": `${error.message}`,
      "data": {}
  });
  }
}


export { getPdf, getPdfs, getCLientsByRut };
