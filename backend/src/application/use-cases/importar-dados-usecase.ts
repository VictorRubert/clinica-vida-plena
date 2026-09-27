import fs from "node:fs/promises";
import path from "node:path";
import { MedicoModel } from "../../infra/database/models/medico-model";
import { parse } from "csv-parse/sync";
import { normalizarData, normalizarStatus } from "./normalizar-agendamento";
import { validarHorario } from "./validar-horario";
import { AgendamentoModel } from "../../infra/database/models/agendamento-model";

export async function importarAgendamentos() {
  const agendamentosValidos: Record<string, unknown>[] = [];
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
    descartados: 0,
    motivos: {} as Record<string, number>,
    exemplos: [] as string[]
  };

  const registrarDescarte = (id: string, motivo: string) => {
    relatorio.descartados++;

    relatorio.motivos[motivo] =
      (relatorio.motivos[motivo] || 0) + 1;

    if (relatorio.exemplos.length < 15) {
      relatorio.exemplos.push(`${id}: ${motivo}`);
    }
  };

  const medicos = await MedicoModel.find().lean();

  const mapaMedicos = new Map(
    medicos.map(medico => [medico._id, medico])
  );

  const idsUtilizados = new Set<string>();
  const horariosMedicos = new Set<string>();
  const horariosPacientes = new Set<string>();

  for (const registro of registros) {
    const status = normalizarStatus(registro.status ?? "");
    const dataAgendamento = normalizarData(
      registro.data_agendamento
    );
    const dataConsulta = normalizarData(
      registro.data_consulta
    );

    if (!registro.id || !registro.paciente_id) {
      registrarDescarte(registro.id, "Identificação ausente");
      continue;
    }

    if (!status) {
      registrarDescarte(registro.id, "Status desconhecido");
      continue;
    }

    if (!dataAgendamento || !dataConsulta) {
      registrarDescarte(registro.id, "Data inválida");
      continue;
    }

    if (dataAgendamento > dataConsulta) {
      registrarDescarte(
        registro.id,
        "Agendamento posterior à consulta"
      );
      continue;
    }

    if (
      dataConsulta.getMinutes() % 30 !== 0 ||
      dataConsulta.getSeconds() !== 0
    ) {
      registrarDescarte(
        registro.id,
        "Consulta fora dos intervalos de 30 minutos"
      );
      continue;
    }

    const medico = mapaMedicos.get(registro.medico_id);

    if (!medico) {
    registrarDescarte(registro.id, "Médico inexistente");
    continue;
    }

    if (!validarHorario(dataConsulta, medico.grade)) {
    registrarDescarte(
        registro.id,
        "Consulta fora da grade do médico"
    );
    continue;
    }

    if (idsUtilizados.has(registro.id)) {
        registrarDescarte(registro.id, "ID duplicado");
        continue;
    }

    const horario = dataConsulta.getTime();

    const chaveMedico = `${registro.medico_id}:${horario}`;
    const chavePaciente = `${registro.paciente_id}:${horario}`;

    const ocupaHorario =
    status === "agendada" ||
    status === "confirmada" ||
    status === "realizada" ||
    status === "falta";

    if (ocupaHorario) {
    if (horariosMedicos.has(chaveMedico)) {
        registrarDescarte(
        registro.id,
        "Conflito de horário do médico"
        );
        continue;
    }

    if (horariosPacientes.has(chavePaciente)) {
        registrarDescarte(
        registro.id,
        "Conflito de horário do paciente"
        );
        continue;
    }
    }

    idsUtilizados.add(registro.id);

    if (ocupaHorario) {
    horariosMedicos.add(chaveMedico);
    horariosPacientes.add(chavePaciente);
    }

    agendamentosValidos.push({
        _id: registro.id,
        pacienteId: registro.paciente_id,
        pacienteNome: registro.paciente_nome,
        pacienteTelefone: registro.paciente_telefone,
        medicoId: registro.medico_id,
        dataAgendamento,
        dataConsulta,
        status,
        tipoAtendimento: registro.tipo_atendimento
    });

    relatorio.validos++;
  }

  if (agendamentosValidos.length > 0) {
    await AgendamentoModel.bulkWrite(
        agendamentosValidos.map(agendamento => ({
            updateOne: {
                filter: { _id: agendamento._id as string },
                update: { $setOnInsert: agendamento },
                upsert: true
            }
        }))
    );
  }

    console.log(
    `${agendamentosValidos.length} registros válidos processados.`
    );

  return relatorio;
}


export async function importarMedicos() {
  const caminho = path.resolve(
    process.cwd(),
    "../data/medicos.json"
  );

  const arquivo = await fs.readFile(caminho, "utf-8");
  const medicos = JSON.parse(arquivo);

  let importados = 0;

  for (const medico of medicos) {
    await MedicoModel.updateOne(
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
    
    importados++;
  }
  
  return {
    total: medicos.length,
    processados: importados
  };
}