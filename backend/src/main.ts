  import { config } from "dotenv";
  import cors from "cors";
  import express from "express";
  import { conectarMongo } from "./infra/database/mongo-connection";
  import { criarAgendamentoController, editarAgendamentoController, enviarLembreteController, listarAgendamentosController, listarPendentesConfirmacaoController, reagendarAgendamentoController } from "./application/controller/agendamento-controller";
  import { indicadoresController } from "./application/controller/indicador-controller";
  import { atualizarStatusController } from "./application/controller/agendamento-controller";
  import { MedicoModel } from "./infra/database/models/medico-model";

  config();

  const app = express();
  app.use(cors());
  app.use(express.json());

  const port = Number(process.env.PORT) || 3001;

app.use(express.json());

app.get("/health", (request, response) => {
  response.json({ status: "ok" });
});

//GET
app.get("/agendamentos", listarAgendamentosController);
app.get("/indicadores", indicadoresController);
app.get("/agendamentos/pendentes-confirmacao",listarPendentesConfirmacaoController);

//POST
app.post("/agendamentos", criarAgendamentoController);
app.post("/agendamentos", criarAgendamentoController);
app.post("/agendamentos/:id/lembrete",enviarLembreteController);

//PATCH
app.patch("/agendamentos/:id/status",atualizarStatusController);
app.patch("/agendamentos/:id/reagendar",reagendarAgendamentoController);
app.patch("/agendamentos/:id",editarAgendamentoController);

app.get("/medicos", async (_req, res) => {
  try {
    const medicos = await MedicoModel.find()
      .sort({ nome: 1 })
      .lean();

    res.json(medicos);
  } catch (erro) {
    console.error("Erro ao listar médicos:", erro);

    res.status(500).json({
      erro: "Erro interno ao listar médicos."
    });
  }
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