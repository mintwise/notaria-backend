import { transporter } from "../config/nodemailer.js";

export const sendEmail = async (datos) => { 
    await transporter.sendMail({
        from: `Galilea Notaria <${datos.emailNotaria}>`,
        to: datos.emailResponsible,
        subject: `Galilea Notaria - ${datos.subject}`,
        html: `
        <h1>Estimad@ ${datos.name}</h1>
        <p>${datos.message}</p>
        `,
    });

}