export abstract class DomainError extends Error {
  abstract readonly codigo: string;
  abstract readonly httpStatus: number;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
