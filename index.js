import express from "express";
import "dotenv/config.js";
import "./src/config/enviroment.js";
import connectDB from "./src/config/db.js";
import cors from "cors";
// rutas para acceder a los controladores
import pdfRoutes from "./src/routes/router.js";
import routerNotaria from "./src/routes/notariaRoutes.js";
import routerInmobiliaria from "./src/routes/inmobiliariaRoutes.js";
import routerApi from "./src/routes/routerApi.js";
import morgan from "morgan";

const app = express();
// Connect a la BD
connectDB();
// MIDDLEWARES 
const dominios = [process.env.FRONTEND_URL]
const corsOptions = {
  origin: function(origin,callback){
      // esto valida que los dominios permitidos sean los que estan en el array
      if (!origin || dominios.indexOf(origin) !== -1){
          // el origen del request esta permitido
          callback(null,true)
      }else{
          callback(new Error('Dominio no permitido por CORS'))
      }
  }
}
app.use(
  cors(corsOptions)
);
app.use(express.json({ limit: "50mb", extended: true }));
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);
app.use(morgan("dev"));
// routes
app.use("/", pdfRoutes);
app.use("/notaria", routerNotaria);
app.use("/inmobiliaria", routerInmobiliaria);
app.use("/api", routerApi);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT} 🚀🚀🚀`));
