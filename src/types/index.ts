export type UserRole = 'ADMIN' | 'FINANCEIRO' | 'OPERACIONAL' | 'GESTOR' | 'MOTORISTA';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  motoristaId?: string; // Se o perfil for MOTORISTA
  avatar?: string;
}

export type CategoriaCNH = 'B' | 'C' | 'D' | 'E';
export type TipoVinculo = 'AGREGADO' | 'CLT' | 'TERCEIRO' | 'AUTONOMO';
export type TipoChavePix = 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';

export interface Motorista {
  id: string;
  nomeCompleto: string;
  cpf: string;
  telefone: string;
  endereco: string;
  cnh: string;
  categoriaCnh: CategoriaCNH;
  validadeCnh: string;
  tipoVinculo: TipoVinculo;
  tipoChavePix: TipoChavePix;
  chavePix: string;
  banco: string;
  agencia: string;
  conta: string;
  contatoEmergencia: string;
  telefoneEmergencia: string;
  documentoAnexoNome?: string;
  ativo: boolean;
  dataCadastro: string;
  observacoes?: string;
}

export type TipoVeiculo = 'TRUCK' | 'TOCO' | 'CARRETA' | 'UTILITARIO';
export type TipoProprietario = 'PROPRIO' | 'TERCEIRO' | 'AGREGADO';

export interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  tipo: TipoVeiculo;
  proprietario: TipoProprietario;
  motoristaPadraoId?: string;
  quilometragemAtual: number;
  vencimentoSeguro: string;
  vencimentoCrlv: string;
  proximaManutencaoKm: number;
  ativo: boolean;
  observacoes?: string;
}

export type StatusViagem = 
  | 'PLANEJADA' 
  | 'LIBERADA' 
  | 'EM_ANDAMENTO' 
  | 'CONCLUIDA' 
  | 'EM_CONFERENCIA' 
  | 'CANCELADA' 
  | 'PAGA';

export type StatusRomaneio = 'PENDENTE' | 'CONFIRMADO' | 'DUPLICADO' | 'REJEITADO';

export interface Romaneio {
  id: string;
  numeroRomaneio: string;
  dataEmissao: string;
  motoristaIdentificado?: string;
  cpfIdentificado?: string;
  motoristaId?: string;
  placaIdentificada?: string;
  veiculoId?: string;
  origem: string;
  destino: string;
  pesoCargaKg: number;
  valorNotaCarga: number;
  nomeArquivoOriginal: string;
  textoExtraido: string;
  dataImportacao: string;
  statusProcessamento: StatusRomaneio;
  viagemId?: string;
  observacoes?: string;
}

export interface Viagem {
  id: string;
  codigoViagem: string;
  romaneioId: string;
  numeroRomaneio: string;
  motoristaId: string;
  motoristaNome: string;
  veiculoId: string;
  veiculoPlaca: string;
  clienteId: string;
  clienteNome: string;
  origem: string;
  destino: string;
  dataSaida: string;
  dataChegadaPrevista: string;
  dataFinalizacao?: string;
  valorFreteBruto: number; // Padrão R$ 230,00 ou configurado por cliente/rota
  pedagioIncluso: number;
  adicionais: number;
  descontos: number;
  status: StatusViagem;
  acertoId?: string;
  observacoes?: string;
}

export type CategoriaFinanceira = 
  | 'FRETE_RECEBER' 
  | 'COMBUSTIVEL' 
  | 'PEDAGIO' 
  | 'MANUTENCAO' 
  | 'PNEUS' 
  | 'ALIMENTACAO' 
  | 'IMPOSTOS' 
  | 'SALARIOS_ADIANTAMENTOS' 
  | 'OUTROS';

export type StatusFinanceiro = 'PENDENTE' | 'VENCIDO' | 'APROVADO' | 'PARCIAL' | 'PAGO' | 'CANCELADO';

export interface TransacaoFinanceira {
  id: string;
  tipo: 'RECEITA' | 'DESPESA';
  categoria: CategoriaFinanceira;
  descricao: string;
  valor: number;
  dataEmissao: string;
  dataVencimento: string;
  dataPagamento?: string;
  status: StatusFinanceiro;
  motoristaId?: string;
  veiculoId?: string;
  viagemId?: string;
  clienteId?: string;
  fornecedorNome?: string;
  comprovanteNome?: string;
  valorPago?: number;
  observacoes?: string;
}

export interface AcertoMotorista {
  id: string;
  codigoAcerto: string;
  motoristaId: string;
  motoristaNome: string;
  periodoInicio: string;
  periodoFim: string;
  totalViagens: number;
  valorTotalFretes: number;
  totalAdiantamentos: number;
  totalDespesasReembolsaveis: number;
  totalDescontos: number;
  saldoLiquidoPagar: number;
  status: 'ABERTO' | 'APROVADO' | 'PAGO';
  dataAprovacao?: string;
  dataPagamento?: string;
  comprovantePix?: string;
  viagensIds: string[];
}

export interface Cliente {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpjCpf: string;
  telefone: string;
  email: string;
  cidade: string;
  estado: string;
  tarifaPadrao: number; // Tarifa customizada ou padrão R$ 230,00
  ativo: boolean;
}

export interface Fornecedor {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpjCpf: string;
  telefone: string;
  categoria: 'POSTO' | 'OFICINA' | 'AUTOPECAS' | 'SEGUROS' | 'OUTROS';
  cidade: string;
  estado: string;
}

export interface ConfiguracaoEmpresa {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  telefone: string;
  email: string;
  enderecoCompleto: string;
  valorFretePadrao: number; // Inicial R$ 230,00
  chavePixEmpresa: string;
  bancoEmpresa: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  usuarioNome: string;
  usuarioRole: UserRole;
  modulo: string;
  acao: string;
  detalhes: string;
}
