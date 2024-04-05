import { transporter } from "../config/nodemailer.js"

// export const sendEmail =  (datos) => { 
//      resend.emails.send({
//         from: "FIRMANOTARIAL@notariacamilla.cl",
//         to: datos.emailResponsible,
//         subject: `Galilea Notaria - ${datos.subject}`,
//         html: `
//         <html>
//         <head>
//             <style>
//                 body {
//                     font-family: Arial, sans-serif;
//                     background-color: #f4f4f4;
//                     color: #333;
//                     padding: 20px;
//                 }
//                 .container {
//                     max-width: 600px;
//                     margin: 0 auto;
//                     padding: 20px;
//                     background-color: #fff;
//                     border-radius: 5px;
//                     box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
//                 }
//                 h2 {
//                     font-size: 22px;
//                     text-align: center;
//                     color: #007bff;
//                 }
//                 p {
//                     margin-bottom: 15px;
//                     text-align: center;
//                     font-size: 18px;
//                 }
//             </style>
//         </head>
//         <body>
//             <div class="container">
//                 <h2>Estimado/a ${datos.name}</h2>
//                 <p>${datos.message}</p>
//             </div>
//         </body>
//         </html>
//         `,
//     });
// }

export const sendEmailTest = async (datos) => { 
    await transporter.sendMail({
        from: "FIRMANOTARIAL@notariacamilla.cl",
        to: datos.emailResponsible,
        subject: `${datos.subject}`,
        html: `
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    color: #333;
                    padding: 20px;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 5px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                h2 {
                    font-size: 22px;
                    text-align: center;
                    color: #007bff;
                }
                p {
                    margin-bottom: 15px;
                    text-align: center;
                    font-size: 18px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Estimado/a ${datos.name}</h2>
                <p>${datos.message}</p>
            </div>
        </body>
        </html>
        `,
    });
}
