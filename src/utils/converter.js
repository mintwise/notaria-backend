import zlib from "zlib";

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

export const compressDocument = async (base64Document) => {
  return new Promise((resolve, reject) => {
    const pdfBuffer = Buffer.from(base64Document, 'base64');
    zlib.deflate(pdfBuffer, (err, compressedBuffer) => {
      if (err) {
        console.error('Error al comprimir el PDF:', err);
        reject(err);
      } else {
        const compressedBase64PDF = compressedBuffer.toString('base64');
        resolve(compressedBase64PDF);
      }
    });
  });
};
