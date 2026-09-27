import { AgendamentoModel } from "../../infra/database/models/agendamento-model";

export async function enviarLembrete(id: string) {
  const agendamento = await AgendamentoModel.findById(id);

  if (!agendamento) {
    throw new Error("Agendamento não encontrado.");
  }

  if (agendamento.status !== "agendada") {
    throw new Error(
      "Somente consultas ainda não confirmadas podem receber lembretes."
    );
  }

  const agora = new Date();

  if (agendamento.dataConsulta <= agora) {
    throw new Error("Não é possível enviar lembretes para consultas passadas.");
  }

  if (agendamento.lembreteEnviadoEm) {
    const horasDesdeUltimoEnvio =
      (agora.getTime() -
        agendamento.lembreteEnviadoEm.getTime()) /
      (1000 * 60 * 60);

    if (horasDesdeUltimoEnvio < 24) {
      throw new Error(
        "Um lembrete já foi registrado para esta consulta nas últimas 24 horas."
      );
    }
  }

  agendamento.lembreteEnviadoEm = agora;
  agendamento.quantidadeLembretes =
    (agendamento.quantidadeLembretes ?? 0) + 1;

  await agendamento.save();

  return {
    mensagem: "Envio simulado de lembrete registrado com sucesso.",
    agendamentoId: agendamento._id,
    pacienteNome: agendamento.pacienteNome,
    pacienteTelefone: agendamento.pacienteTelefone,
    dataConsulta: agendamento.dataConsulta,
    lembreteEnviadoEm: agendamento.lembreteEnviadoEm,
    quantidadeLembretes: agendamento.quantidadeLembretes
  };
}