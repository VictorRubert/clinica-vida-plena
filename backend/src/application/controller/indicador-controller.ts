import { Request, Response } from "express";
import { calcularIndicadores } from "../use-cases/calcular-indicadores-usecase";

export async function indicadoresController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { inicio, fim } = req.query;

    if (typeof inicio !== "string" || typeof fim !== "string") {
      res.status(400).json({
        erro: "Informe as datas de início e fim."
      });
      return;
    }

    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);

    if (
      Number.isNaN(dataInicio.getTime()) ||
      Number.isNaN(dataFim.getTime())
    ) {
      res.status(400).json({
        erro: "Formato de data inválido."
      });
      return;
    }

    if (dataInicio > dataFim) {
      res.status(400).json({
        erro: "A data inicial deve ser anterior à final."
      });
      return;
    }

    const indicadores = await calcularIndicadores(
      dataInicio,
      dataFim
    );

    res.json(indicadores);
  } catch (erro) {
    console.error("Erro ao calcular indicadores:", erro);

    res.status(500).json({
      erro: "Erro interno ao calcular indicadores."
    });
  }
}