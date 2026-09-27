import { Request, Response } from "express";
import { criarAgendamento } from "../use-cases/criar-agendamento-usecase";
import { listarAgendamentos } from "../use-cases/listar-agendamentos-usecase";
import { reagendarAgendamento } from "../use-cases/reagendar-agendamento-usecase";
import { editarAgendamento } from "../use-cases/editar-agendamento-usecase";
import { atualizarStatus } from "../use-cases/atualizar-status-usecase";
import { StatusAgendamento } from "../../domain/entity/agendamento";
import { enviarLembrete } from "../use-cases/enviar-lembrete-usecase";
import { listarPendentesConfirmacao } from "../use-cases/listar-pendentes-confirmacao-usecase";

export async function listarPendentesConfirmacaoController(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const agendamentos = await listarPendentesConfirmacao();
    res.json(agendamentos);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      erro: "Erro ao listar consultas pendentes de confirmação."
    });
  }
}

export async function enviarLembreteController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const resultado = await enviarLembrete(
      req.params.id as string
    );

    res.json(resultado);
  } catch (erro) {
    res.status(400).json({
      erro: erro instanceof Error
        ? erro.message
        : "Erro ao registrar lembrete."
    });
  }
}

export async function reagendarAgendamentoController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { dataConsulta } = req.body;

    if (
      typeof dataConsulta !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(dataConsulta)
    ) {
      res.status(400).json({
        erro: "Informe uma data ISO com fuso horário."
      });
      return;
    }

    const resultado = await reagendarAgendamento(
      req.params.id as string,
      new Date(dataConsulta)
    );

    res.json(resultado);
  } catch (erro) {
    res.status(400).json({
      erro: erro instanceof Error
        ? erro.message
        : "Erro ao reagendar consulta."
    });
  }
}

export async function editarAgendamentoController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { pacienteNome, pacienteTelefone } = req.body;

    if (
      pacienteNome === undefined &&
      pacienteTelefone === undefined
    ) {
      res.status(400).json({
        erro: "Informe pelo menos um campo para alteração."
      });
      return;
    }

    const resultado = await editarAgendamento(
      req.params.id as string,
      { pacienteNome, pacienteTelefone }
    );

    res.json(resultado);
  } catch (erro) {
    res.status(400).json({
      erro: erro instanceof Error
        ? erro.message
        : "Erro ao editar agendamento."
    });
  }
}

export async function atualizarStatusController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statusPermitidos: StatusAgendamento[] = [
      "agendada",
      "confirmada",
      "realizada",
      "falta",
      "cancelada_paciente",
      "cancelada_clinica"
    ];

    if (!statusPermitidos.includes(status)) {
      res.status(400).json({
        erro: "Status inválido."
      });
      return;
    }

    const resultado = await atualizarStatus(
      id as string,
      status
    );

    res.json(resultado);
  } catch (erro) {
    res.status(400).json({
      erro: erro instanceof Error
        ? erro.message
        : "Erro ao atualizar status."
    });
  }
}

export async function criarAgendamentoController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      pacienteId,
      pacienteNome,
      pacienteTelefone,
      medicoId,
      dataConsulta,
      tipoAtendimento
    } = req.body;

    if (
      typeof dataConsulta !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(dataConsulta)
    ) {
      res.status(400).json({
        erro: "Informe a data com fuso horário, por exemplo: 2026-10-05T10:00:00-03:00."
      });
      return;
    }

    const agendamento = await criarAgendamento({
      pacienteId,
      pacienteNome,
      pacienteTelefone,
      medicoId,
      dataConsulta: new Date(dataConsulta),
      tipoAtendimento
    });

    res.status(201).json(agendamento);
  } catch (erro) {
    res.status(400).json({
      erro: erro instanceof Error
        ? erro.message
        : "Erro ao criar agendamento."
    });
  }
}

export async function listarAgendamentosController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { inicio, fim } = req.query;

    function converterData(valor: unknown): Date | undefined {
      if (valor === undefined) return undefined;

      if (typeof valor !== "string") {
        throw new Error("Parâmetro de data inválido.");
      }

      const data = new Date(valor);

      if (Number.isNaN(data.getTime())) {
        throw new Error("Data inválida.");
      }

      return data;
    }

    const dataInicio = converterData(inicio);
    const dataFim = converterData(fim);

    if (dataInicio && dataFim && dataInicio > dataFim) {
      throw new Error("A data inicial deve ser anterior à final.");
    }

    const agendamentos = await listarAgendamentos(
      dataInicio,
      dataFim
    );

    res.json(agendamentos);
  } catch (erro) {
    res.status(400).json({
      erro: erro instanceof Error
        ? erro.message
        : "Erro ao listar agendamentos."
    });
  }
}