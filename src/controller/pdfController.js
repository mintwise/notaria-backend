import Client from "../model/Clients.js";
import documentPDF from "../model/Pdf.js";

const getPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await documentPDF.findById({ _id: id });
    if (!result) {
      return res.status(404).json({ message: "Registro no existe" });
    }
    return res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPdfs = async (req, res) => {
  try {
    const result = await documentPDF.find();
    return res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      return res.status(404).json({ message: "Cliente no encontrado" });
    }{
      console.log(clients.documents)
      if(!clients.documents){
        return res.status(404).json({ message: "Cliente no tiene documentos" });
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
    return res.status(200).json({types});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


export { getPdf, getPdfs, getCLientsByRut };
