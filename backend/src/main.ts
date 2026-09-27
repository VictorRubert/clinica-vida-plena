import { config } from "dotenv";
import express from "express";
import { conectarMongo } from "./infra/database/mongo-connection";

config();

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(express.json());

app.get("/health", (request, response) => {
  response.json({ status: "ok" });
});

async function iniciarServidor() {
  try {
    await conectarMongo();

    app.listen(port, () => {
      console.log(`Servidor iniciado na porta ${port}`);
    });
  } catch (erro) {
    console.error("Erro ao iniciar o servidor:", erro);
    process.exit(1);
  }
}

iniciarServidor();