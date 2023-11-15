import express from "express";
import "dotenv/config.js";
import "./src/config/enviroment.js";
import connectDB from "./src/config/db.js";
import cors from "cors";
// rutas para acceder a los controladores
import pdfRoutes from "./src/routes/router.js";
import routerNotaria from "./src/routes/notariaRoutes.js";
import routerInmobiliaria from "./src/routes/inmobiliariaRoutes.js";
import morgan from "morgan";

const app = express();
// Connect a la BD
connectDB();
// MIDDLEWARES 
app.use(
  cors({
    origin: "*",
  })
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT} 🚀🚀🚀`));
