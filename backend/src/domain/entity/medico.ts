export type DiaSemana =
  | "segunda"
  | "terca"
  | "quarta"
  | "quinta"
  | "sexta";

export type GradeHorario = {
  dia: DiaSemana;
  inicio: string;
  fim: string;
};

export class Medico {
  constructor(
    public id: string,
    public nome: string,
    public especialidade: string,
    public grade: GradeHorario[]
  ) {}
}