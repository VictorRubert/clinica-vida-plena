export type StatusAgendamento =
  | "agendada"
  | "confirmada"
  | "realizada"
  | "falta"
  | "cancelada_paciente"
  | "cancelada_clinica";

export class Agendamento {
  constructor(
    public id: string,
    public pacienteId: string,
    public medicoId: string,
    public dataAgendamento: Date,
    public dataConsulta: Date,
    public status: StatusAgendamento,
    public tipoAtendimento: string
  ) {}

  alterarStatus(novoStatus: StatusAgendamento): void {
    const statusFinais: StatusAgendamento[] = [
      "realizada",
      "falta",
      "cancelada_paciente",
      "cancelada_clinica"
    ];

    if (statusFinais.includes(this.status)) {
      throw new Error("Este agendamento já foi finalizado.");
    }

    if (this.status === novoStatus) {
      throw new Error("O agendamento já possui este status.");
    }

    if (this.status === "confirmada" && novoStatus === "agendada") {
      throw new Error(
        "Uma consulta confirmada não pode voltar a ser agendada."
      );
    }

    const agora = new Date();

    if (novoStatus === "realizada" || novoStatus === "falta") {
      if (agora <= this.dataConsulta) {
        throw new Error("A consulta ainda não ocorreu.");
      }
    }

    if (
      novoStatus === "cancelada_paciente" ||
      novoStatus === "cancelada_clinica"
    ) {
      if (agora >= this.dataConsulta) {
        throw new Error(
          "Não é possível cancelar uma consulta após seu horário."
        );
      }
    }

    this.status = novoStatus;
  }
}