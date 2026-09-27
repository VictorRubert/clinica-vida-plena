import { AgendamentoModel } from "../../infra/database/models/agendamento-model";

export async function listarPendentesConfirmacao() {
  const agora = new Date();

  const limite = new Date(agora);
  limite.setDate(limite.getDate() + 7);

  return AgendamentoModel.find({
    status: "agendada",
    dataConsulta: {
      $gt: agora,
      $lte: limite
    }
  })
    .sort({ dataConsulta: 1 })
    .lean();
}