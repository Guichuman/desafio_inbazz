export interface ReceberPedidoItemInput {
  sku: string;
  quantidade: number;
  precoUnitario: number;
}

export interface ReceberPedidoClienteInput {
  nome: string;
  email: string;
  zipcode?: string;
}

export interface ReceberPedidoInput {
  orderIdExterno: string;
  idempotencyKey: string;
  cliente: ReceberPedidoClienteInput;
  itens: ReceberPedidoItemInput[];
  moedaOriginal: string;
}
