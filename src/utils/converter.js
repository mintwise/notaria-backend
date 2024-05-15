import axios from "axios";
import FormData from "form-data";
import { Readable } from "stream";

export const formatValue = (value) => {
  // Elimina caracteres especiales y acentos
  const nombreLimpio = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s.-]/g, "")
    .trim();

  // Reemplaza espacios en blanco y otros caracteres especiales por guiones bajos
  const nombreFormateado = nombreLimpio.replace(/\s+/g, "_").toLowerCase();

  return nombreFormateado;
};

// Función para formatear la fecha como "DD-MM-YYYY"
export const formatDateToDDMMYYYY = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

export const arrayBufferToBase64 = (arrayBuffer) => {
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = "";
  uint8Array.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};


export const formatDate = () => {
  const date = new Date();
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const month = months[date.getMonth()];

  return `El ${day} de ${month} del ${year}, a las ${hours}:${minutes}:${seconds} Horas.`;
};

export const compressPdf = async (base64, filenameDocument) => { 
  if (base64) {
    const fileBuffer = Buffer.from(base64, "base64");

    // Convierte el buffer en un stream
    const fileStream = new Readable();
    fileStream.push(fileBuffer);
    fileStream.push(null);
    
    // Crea una nueva instancia de FormData y añade el stream del PDF y los parámetros a ella
    var data = new FormData();
    data.append("file", fileStream, {
      filename: "file.pdf",
      contentType: "application/pdf",
    });
      // Calcula el tamaño del archivo en MB
      const fileSizeInMB = fileBuffer.length / (1024 * 1024);
  
      // Establece el nivel de compresión basado en el tamaño del archivo
      if (fileSizeInMB >= 5) {
        data.append("compression_level", "high");
      } else if(fileSizeInMB >= 2 && fileSizeInMB < 5) {
        data.append("compression_level", "medium");
      } else {
        data.append("compression_level", "low");
      }
      data.append("output", "comprimido_pdf");
  
      var config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "https://api.pdfrest.com/compressed-pdf",
        headers: {
          "Api-Key": "d727e6b8-4c98-4163-9dbf-2713290504bc",
          ...data.getHeaders(),
        },
        data: data,
      };
      const response = await axios(config);
      //? procedemos a descargar el documento optimizado
      const urlOptimized = response.data.outputUrl;
      const responseOptimized = await axios.get(urlOptimized, {
        responseType: "arraybuffer",
      });
    return responseOptimized?.data;
     }
}
