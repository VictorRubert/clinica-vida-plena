import { config } from "dotenv";
import mongoose from "mongoose";
import { conectarMongo } from "./infra/database/mongo-connection";
import {
  importarMedicos,
  importarAgendamentos
} from "./application/use-cases/importar-dados-usecase";

config();

async function executar() {
  try {
    await conectarMongo();

    const medicos = await importarMedicos();
    const agendamentos = await importarAgendamentos();

    console.log("Relatório dos médicos:", medicos);
    console.log("Relatório dos agendamentos:", agendamentos);
  } catch (erro) {
    console.error("Falha na importação:", erro);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

executar();