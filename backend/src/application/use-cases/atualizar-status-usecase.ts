import {Agendamento,StatusAgendamento} from "../../domain/entity/agendamento";

import { AgendamentoModel } from "../../infra/database/models/agendamento-model";

export async function atualizarStatus(
  id: string,
  novoStatus: StatusAgendamento
) {
  const registro = await AgendamentoModel.findById(id);

  if (!registro) {
    throw new Error("Agendamento não encontrado.");
  }

  const agendamento = new Agendamento(
    registro._id ?? id,
    registro.pacienteId,
    registro.medicoId,
    registro.dataAgendamento,
    registro.dataConsulta,
    registro.status,
    registro.tipoAtendimento ?? ""
  );

  agendamento.alterarStatus(novoStatus);

  registro.status = agendamento.status;

  await registro.save();

  return registro;
}