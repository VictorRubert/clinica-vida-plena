import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { MedicoModel } from "../../infra/database/models/medico-model";
import { AgendamentoModel } from "../../infra/database/models/agendamento-model";
import {normalizarData,normalizarStatus,normalizarTipoAtendimento} from "./normalizar-agendamento";
import { validarHorario } from "./validar-horario";

export async function importarAgendamentos() {
  const caminho = path.resolve(
    process.cwd(),
    "../data/agendamentos.csv"
  );

  const arquivo = await fs.readFile(caminho, "utf-8");

  const registros = parse(arquivo, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true
  }) as Record<string, string>[];

  const relatorio = {
    total: registros.length,
    validos: 0,
    inseridos: 0,
    jaExistentes: 0,
    descartados: 0,
    corrigidos: 0,
    correcoes: {} as Record<string, number>,
    motivos: {} as Record<string, number>,
    exemplos: [] as string[]
  };

  function registrarDescarte(id: string, motivo: string) {
    relatorio.descartados++;

    relatorio.motivos[motivo] =
      (relatorio.motivos[motivo] ?? 0) + 1;

    if (relatorio.exemplos.length < 15) {
      relatorio.exemplos.push(`${id || "Sem ID"}: ${motivo}`);
    }
  }

  function registrarCorrecao(motivo: string) {
    relatorio.corrigidos++;

    relatorio.correcoes[motivo] =
      (relatorio.correcoes[motivo] ?? 0) + 1;
  }

  const medicos = await MedicoModel.find().lean();

  const mapaMedicos = new Map(
    medicos.map((medico) => [medico._id, medico])
  );

  const idsUtilizados = new Set<string>();
  const horariosMedicos = new Set<string>();
  const horariosPacientes = new Set<string>();

  const agendamentosValidos: {
    _id: string;
    pacienteId: string;
    pacienteNome: string;
    pacienteTelefone: string;
    medicoId: string;
    dataAgendamento: Date;
    dataConsulta: Date;
    status:
      | "agendada"
      | "confirmada"
      | "realizada"
      | "falta"
      | "cancelada_paciente"
      | "cancelada_clinica";
    tipoAtendimento: "convenio" | "particular";
  }[] = [];

  for (const registro of registros) {
    const id = registro.id?.trim() ?? "";
    const pacienteId = registro.paciente_id?.trim() ?? "";
    const medicoId = registro.medico_id?.trim() ?? "";

    if (!id || !pacienteId) {
      registrarDescarte(id, "Identificação ausente");
      continue;
    }

    if (idsUtilizados.has(id)) {
      registrarDescarte(id, "ID duplicado");
      continue;
    }

    const statusOriginal = registro.status ?? "";
    const status = normalizarStatus(statusOriginal);

    if (!status) {
      registrarDescarte(id, "Status desconhecido");
      continue;
    }

    const tipoOriginal = registro.tipo_atendimento ?? "";

    const tipoAtendimento =
      normalizarTipoAtendimento(tipoOriginal);

    if (!tipoAtendimento) {
      registrarDescarte(
        id,
        "Tipo de atendimento desconhecido"
      );
      continue;
    }

    const dataAgendamento = normalizarData(
      registro.data_agendamento ?? ""
    );

    const dataConsulta = normalizarData(
      registro.data_consulta ?? ""
    );

    if (!dataAgendamento || !dataConsulta) {
      registrarDescarte(id, "Data inválida");
      continue;
    }

    if (dataAgendamento > dataConsulta) {
      registrarDescarte(
        id,
        "Agendamento posterior à consulta"
      );
      continue;
    }

    if (
      dataConsulta.getMinutes() % 30 !== 0 ||
      dataConsulta.getSeconds() !== 0
    ) {
      registrarDescarte(
        id,
        "Consulta fora dos intervalos de 30 minutos"
      );
      continue;
    }

    const medico = mapaMedicos.get(medicoId);

    if (!medico) {
      registrarDescarte(id, "Médico inexistente");
      continue;
    }

    if (!validarHorario(dataConsulta, medico.grade)) {
      registrarDescarte(
        id,
        "Consulta fora da grade do médico"
      );
      continue;
    }

    const horario = dataConsulta.getTime();

    const chaveMedico = `${medicoId}:${horario}`;
    const chavePaciente = `${pacienteId}:${horario}`;

    const ocupaHorario = [
      "agendada",
      "confirmada",
      "realizada",
      "falta"
    ].includes(status);

    if (ocupaHorario) {
      if (horariosMedicos.has(chaveMedico)) {
        registrarDescarte(
          id,
          "Conflito de horário do médico"
        );
        continue;
      }

      if (horariosPacientes.has(chavePaciente)) {
        registrarDescarte(
          id,
          "Conflito de horário do paciente"
        );
        continue;
      }
    }

    idsUtilizados.add(id);

    if (ocupaHorario) {
      horariosMedicos.add(chaveMedico);
      horariosPacientes.add(chavePaciente);
    }

    agendamentosValidos.push({
      _id: id,
      pacienteId,
      pacienteNome: registro.paciente_nome?.trim() ?? "",
      pacienteTelefone:
        registro.paciente_telefone?.trim() ?? "",
      medicoId,
      dataAgendamento,
      dataConsulta,
      status,
      tipoAtendimento
    });

    relatorio.validos++;

    const statusLimpo = statusOriginal
      .trim()
      .toLowerCase();

    if (statusLimpo !== status) {
      registrarCorrecao("Status normalizado");
    }

    const tipoLimpo = tipoOriginal
      .trim()
      .toLowerCase();

    if (tipoLimpo !== tipoAtendimento) {
      registrarCorrecao(
        "Tipo de atendimento normalizado"
      );
    }
  }

  if (agendamentosValidos.length > 0) {
    const resultado = await AgendamentoModel.bulkWrite(
      agendamentosValidos.map((agendamento) => ({
        updateOne: {
          filter: { _id: agendamento._id },
          update: {
            $setOnInsert: agendamento
          },
          upsert: true
        }
      }))
    );

    relatorio.inseridos = resultado.upsertedCount;

    relatorio.jaExistentes =
      agendamentosValidos.length - resultado.upsertedCount;
  }

  console.log(
    `${relatorio.validos} registros válidos processados.`
  );

  console.log(
    `${relatorio.inseridos} novos registros inseridos.`
  );

  console.log(
    `${relatorio.jaExistentes} registros já existentes.`
  );

  console.log(
    `${relatorio.descartados} registros descartados.`
  );

  return relatorio;
}

export async function importarMedicos() {
  const caminho = path.resolve(
    process.cwd(),
    "../data/medicos.json"
  );

  const arquivo = await fs.readFile(caminho, "utf-8");

  const medicos = JSON.parse(arquivo) as {
    id: string;
    nome: string;
    especialidade: string;
    grade: {
      dia: string;
      inicio: string;
      fim: string;
    }[];
  }[];

  let processados = 0;
  let inseridos = 0;
  let atualizados = 0;

  for (const medico of medicos) {
    const resultado = await MedicoModel.updateOne(
      { _id: medico.id },
      {
        $set: {
          nome: medico.nome,
          especialidade: medico.especialidade,
          grade: medico.grade
        }
      },
      { upsert: true }
    );

    processados++;

    if (resultado.upsertedCount > 0) {
      inseridos++;
    } else {
      atualizados++;
    }
  }

  return {
    total: medicos.length,
    processados,
    inseridos,
    atualizados
  };
}
