import { AgendamentoModel } from "../../infra/database/models/agendamento-model";

type EditarAgendamentoInput = {
  pacienteNome?: string;
  pacienteTelefone?: string;
};

export async function editarAgendamento(
  id: string,
  dados: EditarAgendamentoInput
) {
  const agendamento = await AgendamentoModel.findById(id);

  if (!agendamento) {
    throw new Error("Agendamento não encontrado.");
  }

  if (!["agendada", "confirmada"].includes(agendamento.status)) {
    throw new Error("Não é possível editar uma consulta finalizada.");
  }

  if (dados.pacienteNome !== undefined) {
    if (
      typeof dados.pacienteNome !== "string" ||
      !dados.pacienteNome.trim()
    ) {
      throw new Error("Nome do paciente inválido.");
    }

    agendamento.pacienteNome = dados.pacienteNome.trim();
  }

  if (dados.pacienteTelefone !== undefined) {
    if (
      typeof dados.pacienteTelefone !== "string" ||
      !dados.pacienteTelefone.trim()
    ) {
      throw new Error("Telefone do paciente inválido.");
    }

    agendamento.pacienteTelefone = dados.pacienteTelefone.trim();
  }

  await agendamento.save();

  return agendamento;
}