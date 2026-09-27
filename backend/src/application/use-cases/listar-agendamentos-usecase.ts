import { AgendamentoModel } from "../../infra/database/models/agendamento-model";

export async function listarAgendamentos(
  inicio?: Date,
  fim?: Date
) {
  const filtro: Record<string, unknown> = {};

  if (inicio || fim) {
    filtro.dataConsulta = {
      ...(inicio && { $gte: inicio }),
      ...(fim && { $lte: fim })
    };
  }

  return AgendamentoModel.find(filtro)
    .sort({ dataConsulta: 1 })
    .limit(100)
    .lean();
}