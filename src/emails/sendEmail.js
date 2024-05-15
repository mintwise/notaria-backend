import pkg from "sib-api-v3-sdk";
const { ApiClient, SendSmtpEmail, TransactionalEmailsApi } = pkg;

const sendEmail = async (datos) => {
  // Configura las credenciales de la API
  const defaultClient = ApiClient.instance;
  const apiKey = defaultClient.authentications["api-key"];
  apiKey.apiKey = process.env.EMAIL_API_KEY;

  // Crea una instancia de la API de Sendinblue
  const apiInstance = new TransactionalEmailsApi();

  try {
    const correo = new SendSmtpEmail();
    correo.subject = `${datos.subject}`;
    correo.htmlContent = `
    <h2 style="color: #333; font-family: Arial, sans-serif;">Estimado/a ${datos.name},</h2>
    <p style="color: #555; font-family: Arial, sans-serif;">${datos.message}</p>
    <p style="color: #777; font-family: Arial, sans-serif;">Firma Notarial.</p>
    `;
    correo.sender = {
      name: "Firma Notarial",
      email: "firmanotarial@firmanotarial.cl",
    };
    correo.to = datos.to.map((destinatario) => ({ email: destinatario }));
    if (datos.base64Document) {
      correo.attachment = [
        {
          name: `${datos.filenameDocument}`,
          content: datos.base64Document,
        },
      ];
    }
    await apiInstance.sendTransacEmail(correo);
  } catch (error) {
    console.log(error);
  }
};

export default sendEmail;
