export interface ClienteProps {
  nome: string;
  email: string;
  zipcode?: string;
}

export class Cliente {
  readonly nome: string;
  readonly email: string;
  readonly zipcode?: string;

  constructor(props: ClienteProps) {
    this.nome = props.nome;
    this.email = props.email;
    this.zipcode = props.zipcode;
  }
}
