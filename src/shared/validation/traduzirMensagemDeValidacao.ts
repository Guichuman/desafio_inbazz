const PADRAO_CAMPO_NAO_PERMITIDO = /^property (.+) should not exist$/;

export const traduzirMensagemDeValidacao = (mensagem: string): string => {
  const campoNaoPermitido = PADRAO_CAMPO_NAO_PERMITIDO.exec(mensagem);
  if (campoNaoPermitido) {
    return `Campo '${campoNaoPermitido[1]}' não é permitido`;
  }

  return mensagem;
};
