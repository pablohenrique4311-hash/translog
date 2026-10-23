import { 
  Motorista, 
  Veiculo, 
  Viagem, 
  Romaneio, 
  TransacaoFinanceira, 
  AcertoMotorista, 
  Cliente, 
  Fornecedor,
  ConfiguracaoEmpresa, 
  AuditLog, 
  User 
} from '../types';

const STORAGE_KEYS = {
  MOTORISTAS: 'translog_motoristas_v1',
  VEICULOS: 'translog_veiculos_v1',
  ROMANEIOS: 'translog_romaneios_v1',
  VIAGENS: 'translog_viagens_v1',
  FINANCEIRO: 'translog_financeiro_v1',
  ACERTOS: 'translog_acertos_v1',
  CLIENTES: 'translog_clientes_v1',
  FORNECEDORES: 'translog_fornecedores_v1',
  CONFIG: 'translog_config_v1',
  AUDIT: 'translog_audit_v1',
  CURRENT_USER: 'translog_current_user_v1',
};

const DEFAULT_CONFIG: ConfiguracaoEmpresa = {
  razaoSocial: 'TransLog Pro Logística e Transportes Rodoviários Ltda',
  nomeFantasia: 'TransLog Pro Express',
  cnpj: '18.492.381/0001-44',
  inscricaoEstadual: '109.876.543.210',
  telefone: '(11) 4589-9200',
  email: 'operacoes@translogpro.com.br',
  enderecoCompleto: 'Rodovia Anhanguera, KM 62 - Pátio Logístico, Jundiaí - SP, CEP 13214-000',
  valorFretePadrao: 230.00,
  chavePixEmpresa: '18.492.381/0001-44',
  bancoEmpresa: 'Banco Santander (033) - Ag: 3340 / CC: 13009240-5',
};

export const MOCK_USERS: User[] = [
  { id: 'usr-admin', nome: 'Roberto Albuquerque (Diretor)', email: 'roberto@translogpro.com.br', role: 'ADMIN' },
  { id: 'usr-fin', nome: 'Cláudia Silveira (Financeiro)', email: 'claudia.financeiro@translogpro.com.br', role: 'FINANCEIRO' },
  { id: 'usr-op', nome: 'Eduardo Guimarães (Operacional)', email: 'eduardo.op@translogpro.com.br', role: 'OPERACIONAL' },
  { id: 'usr-gest', nome: 'Juliana Barros (Gestão de Frota)', email: 'juliana.frota@translogpro.com.br', role: 'GESTOR' },
  { id: 'usr-mot-1', nome: 'Carlos Eduardo Oliveira (Motorista)', email: 'carlos.mot@translogpro.com.br', role: 'MOTORISTA', motoristaId: 'mot-1' },
];

export const DB = {
  // Usuário Atual & Autenticação
  isAuthenticated(): boolean {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER) !== null;
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  setCurrentUser(u: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(u));
    this.logAction(u.nome, u.role, 'Segurança', 'Login / Troca de Perfil', `Sessão ativa alterada para perfil ${u.role}`);
  },

  login(u: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(u));
    this.logAction(u.nome, u.role, 'Segurança', 'Login Efetuado', `Acesso autenticado com perfil ${u.role} (${u.email})`);
  },

  logout(): void {
    const current = this.getCurrentUser();
    if (current) {
      this.logAction(current.nome, current.role, 'Segurança', 'Logout Efetuado', `Usuário desconectou do sistema.`);
    }
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getActiveActor(): { nome: string; role: any } {
    const u = this.getCurrentUser();
    if (u) return { nome: u.nome, role: u.role };
    return { nome: 'Sistema TransLog', role: 'ADMIN' };
  },

  // Configuração
  getConfig(): ConfiguracaoEmpresa {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
      return DEFAULT_CONFIG;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  saveConfig(cfg: ConfiguracaoEmpresa): void {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(cfg));
    const user = this.getActiveActor();
    this.logAction(user.nome, user.role, 'Configurações', 'Atualização', `Tarifa base atualizada para R$ ${cfg.valorFretePadrao.toFixed(2)}`);
  },

  // Auditoria (LGPD e Compliance)
  logAction(usuarioNome: string, usuarioRole: any, modulo: string, acao: string, detalhes: string) {
    const logs: AuditLog[] = this.getAuditLogs();
    const newLog: AuditLog = {
      id: 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      usuarioNome,
      usuarioRole,
      modulo,
      acao,
      detalhes,
    };
    logs.unshift(newLog);
    if (logs.length > 800) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(logs));
  },

  getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return raw ? JSON.parse(raw) : [];
  },

  // Motoristas
  getMotoristas(): Motorista[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MOTORISTAS);
    if (!raw) {
      this.seedInitialIfEmpty();
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.MOTORISTAS) || '[]');
    }
    return JSON.parse(raw);
  },

  saveMotorista(m: Motorista): { success: boolean; message: string } {
    const list = this.getMotoristas();
    // Validar CPF único
    const cleanCpf = m.cpf.replace(/\D/g, '');
    const cpfDup = list.some(item => item.id !== m.id && item.cpf.replace(/\D/g, '') === cleanCpf);
    if (cpfDup) {
      return { success: false, message: `CPF ${m.cpf} já cadastrado para outro motorista.` };
    }

    const idx = list.findIndex(item => item.id === m.id);
    if (idx >= 0) {
      list[idx] = m;
    } else {
      list.push(m);
    }
    localStorage.setItem(STORAGE_KEYS.MOTORISTAS, JSON.stringify(list));
    const u = this.getActiveActor();
    this.logAction(u.nome, u.role, 'Motoristas', idx >= 0 ? 'Edição' : 'Novo Cadastro', `Motorista ${m.nomeCompleto} (${m.tipoVinculo}) gravado.`);
    return { success: true, message: 'Motorista salvo com sucesso.' };
  },

  toggleMotoristaAtivo(id: string): void {
    const list = this.getMotoristas();
    const m = list.find(item => item.id === id);
    if (m) {
      m.ativo = !m.ativo;
      localStorage.setItem(STORAGE_KEYS.MOTORISTAS, JSON.stringify(list));
      const u = this.getActiveActor();
      this.logAction(u.nome, u.role, 'Motoristas', 'Alteração de Status', `Motorista ${m.nomeCompleto} ${m.ativo ? 'reativado' : 'inativado'}.`);
    }
  },

  // Veículos
  getVeiculos(): Veiculo[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VEICULOS);
    if (!raw) {
      this.seedInitialIfEmpty();
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.VEICULOS) || '[]');
    }
    return JSON.parse(raw);
  },

  saveVeiculo(v: Veiculo): { success: boolean; message: string } {
    const list = this.getVeiculos();
    const normPlaca = v.placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const placaDup = list.some(item => item.id !== v.id && item.placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normPlaca);
    if (placaDup) {
      return { success: false, message: `A placa ${v.placa} já está cadastrada na frota.` };
    }
    const idx = list.findIndex(item => item.id === v.id);
    if (idx >= 0) list[idx] = v;
    else list.push(v);
    localStorage.setItem(STORAGE_KEYS.VEICULOS, JSON.stringify(list));
    const u = this.getActiveActor();
    this.logAction(u.nome, u.role, 'Frota', idx >= 0 ? 'Edição' : 'Novo Veículo', `Veículo placa ${v.placa} (${v.modelo}) salvo.`);
    return { success: true, message: 'Veículo salvo com sucesso.' };
  },

  // Romaneios (com proteção estrita contra duplicidade)
  getRomaneios(): Romaneio[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ROMANEIOS);
    if (!raw) {
      this.seedInitialIfEmpty();
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ROMANEIOS) || '[]');
    }
    return JSON.parse(raw);
  },

  saveRomaneio(r: Romaneio): { success: boolean; message: string } {
    const list = this.getRomaneios();
    const cleanNum = r.numeroRomaneio.trim().toUpperCase();
    
    // Verificar duplicidade
    const existe = list.find(item => item.id !== r.id && item.numeroRomaneio.trim().toUpperCase() === cleanNum);
    if (existe) {
      return { 
        success: false, 
        message: `Romaneio duplicado: o documento nº "${r.numeroRomaneio}" já foi importado anteriormente em ${new Date(existe.dataImportacao).toLocaleDateString('pt-BR')}. Operação bloqueada para evitar frete em duplicidade.` 
      };
    }

    const idx = list.findIndex(item => item.id === r.id);
    if (idx >= 0) list[idx] = r;
    else list.push(r);
    localStorage.setItem(STORAGE_KEYS.ROMANEIOS, JSON.stringify(list));
    const u = this.getActiveActor();
    this.logAction(u.nome, u.role, 'Romaneios', 'Registro', `Romaneio nº ${r.numeroRomaneio} processado e gravado.`);
    return { success: true, message: 'Romaneio registrado com sucesso.' };
  },

  // Viagens
  getViagens(): Viagem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VIAGENS);
    if (!raw) {
      this.seedInitialIfEmpty();
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.VIAGENS) || '[]');
    }
    return JSON.parse(raw);
  },

  saveViagem(v: Viagem): { success: boolean; message: string } {
    const list = this.getViagens();
    
    // Bloquear criação em duplicidade de viagem com o mesmo romaneio ativo
    if (v.romaneioId) {
      const viagemDup = list.some(item => 
        item.id !== v.id && 
        item.romaneioId === v.romaneioId && 
        item.status !== 'CANCELADA'
      );
      if (viagemDup) {
        return { 
          success: false, 
          message: 'Já existe uma viagem ativa vinculada a este romaneio. Não é permitida duplicidade de frete.' 
        };
      }
    }

    const idx = list.findIndex(item => item.id === v.id);
    if (idx >= 0) list[idx] = v;
    else list.push(v);
    localStorage.setItem(STORAGE_KEYS.VIAGENS, JSON.stringify(list));
    const u = this.getActiveActor();
    this.logAction(u.nome, u.role, 'Viagens', idx >= 0 ? 'Atualização de Status' : 'Nova Viagem', `Viagem ${v.codigoViagem} (Romaneio: ${v.numeroRomaneio}, R$ ${v.valorFreteBruto.toFixed(2)}) atualizada para ${v.status}.`);
    return { success: true, message: 'Viagem gravada com sucesso.' };
  },

  // Clientes
  getClientes(): Cliente[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTES);
    if (!raw) {
      this.seedInitialIfEmpty();
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES) || '[]');
    }
    return JSON.parse(raw);
  },

  saveCliente(c: Cliente): void {
    const list = this.getClientes();
    const idx = list.findIndex(item => item.id === c.id);
    if (idx >= 0) list[idx] = c;
    else list.push(c);
    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(list));
    const u = this.getActiveActor();
    this.logAction(u.nome, u.role, 'Comercial', 'Clientes', `Cliente ${c.razaoSocial} atualizado.`);
  },

  // Fornecedores
  getFornecedores(): Fornecedor[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FORNECEDORES);
    if (!raw) {
      this.seedInitialIfEmpty();
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.FORNECEDORES) || '[]');
    }
    return JSON.parse(raw);
  },

  saveFornecedor(f: Fornecedor): void {
    const list = this.getFornecedores();
    const idx = list.findIndex(item => item.id === f.id);
    if (idx >= 0) list[idx] = f;
    else list.push(f);
    localStorage.setItem(STORAGE_KEYS.FORNECEDORES, JSON.stringify(list));
  },

  // Financeiro
  getFinanceiro(): TransacaoFinanceira[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FINANCEIRO);
    if (!raw) {
      this.seedInitialIfEmpty();
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.FINANCEIRO) || '[]');
    }
    return JSON.parse(raw);
  },

  saveFinanceiro(t: TransacaoFinanceira): void {
    const list = this.getFinanceiro();
    const idx = list.findIndex(item => item.id === t.id);
    if (idx >= 0) list[idx] = t;
    else list.push(t);
    localStorage.setItem(STORAGE_KEYS.FINANCEIRO, JSON.stringify(list));
    const u = this.getActiveActor();
    this.logAction(u.nome, u.role, 'Financeiro', idx >= 0 ? 'Edição Lançamento' : 'Novo Lançamento', `${t.tipo} - ${t.descricao} (R$ ${t.valor.toFixed(2)}) gravado com status ${t.status}.`);
  },

  cancelarFinanceiro(id: string, motivo: string): { success: boolean; message: string } {
    const list = this.getFinanceiro();
    const t = list.find(item => item.id === id);
    if (!t) return { success: false, message: 'Lançamento não encontrado.' };
    
    // Regra de qualidade 16: não permitir exclusão silenciosa de registros financeiros. Usar cancelamento ou estorno auditável.
    t.status = 'CANCELADO';
    t.observacoes = (t.observacoes ? t.observacoes + ' | ' : '') + `Cancelado: ${motivo}`;
    localStorage.setItem(STORAGE_KEYS.FINANCEIRO, JSON.stringify(list));
    const u = this.getActiveActor();
    this.logAction(u.nome, u.role, 'Financeiro', 'Cancelamento / Estorno', `Lançamento ${t.descricao} (R$ ${t.valor.toFixed(2)}) cancelado. Motivo: ${motivo}`);
    return { success: true, message: 'Lançamento cancelado e auditado com sucesso.' };
  },

  // Acertos de Motoristas
  getAcertos(): AcertoMotorista[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACERTOS);
    return raw ? JSON.parse(raw) : [];
  },

  saveAcerto(a: AcertoMotorista): void {
    const list = this.getAcertos();
    const idx = list.findIndex(item => item.id === a.id);
    if (idx >= 0) list[idx] = a;
    else list.push(a);
    localStorage.setItem(STORAGE_KEYS.ACERTOS, JSON.stringify(list));
    const u = this.getActiveActor();
    this.logAction(u.nome, u.role, 'Acerto Motoristas', 'Fechamento de Acerto', `Acerto ${a.codigoAcerto} fechado para ${a.motoristaNome}. Saldo Líquido: R$ ${a.saldoLiquidoPagar.toFixed(2)}.`);
  },

  // Inicialização com dados de demonstração identificados
  seedInitialIfEmpty(): void {
    const hoje = new Date().toISOString().substring(0, 10);
    const cfg = this.getConfig();

    const motoristasIniciais: Motorista[] = [
      {
        id: 'mot-1',
        nomeCompleto: 'Carlos Eduardo Oliveira Silva',
        cpf: '234.567.890-11',
        telefone: '(11) 99871-2244',
        endereco: 'Rua das Palmeiras, 412 - Jundiaí/SP',
        cnh: '04899218201',
        categoriaCnh: 'E',
        validadeCnh: '2027-04-18',
        tipoVinculo: 'AGREGADO',
        tipoChavePix: 'CPF',
        chavePix: '23456789011',
        banco: 'Banco do Brasil (001)',
        agencia: '1240-5',
        conta: '45890-1',
        contatoEmergencia: 'Mariana Silva (Esposa)',
        telefoneEmergencia: '(11) 98822-1133',
        documentoAnexoNome: 'cnh_carlos_eduardo_digital.pdf',
        ativo: true,
        dataCadastro: '2024-01-15',
        observacoes: 'Motorista experiente em rotas de longa distância e carretas bitrem.'
      },
      {
        id: 'mot-2',
        nomeCompleto: 'Marcos Roberto Santos',
        cpf: '345.678.901-22',
        telefone: '(19) 98112-9900',
        endereco: 'Av. Brasil, 1500 - Americana/SP',
        cnh: '03214587900',
        categoriaCnh: 'D',
        validadeCnh: '2026-11-20',
        tipoVinculo: 'CLT',
        tipoChavePix: 'EMAIL',
        chavePix: 'marcos.santos@gmail.com',
        banco: 'Bradesco (237)',
        agencia: '0450',
        conta: '98401-2',
        contatoEmergencia: 'Joana Santos (Irmã)',
        telefoneEmergencia: '(19) 97100-3322',
        documentoAnexoNome: 'cnh_marcos_roberto.pdf',
        ativo: true,
        dataCadastro: '2024-02-01',
        observacoes: 'Atua principalmente no trecho Campinas - Grande SP.'
      },
      {
        id: 'mot-3',
        nomeCompleto: 'Antônio Ferreira Costa',
        cpf: '456.789.012-33',
        telefone: '(11) 97334-1188',
        endereco: 'Rua das Flores, 98 - Cajamar/SP',
        cnh: '01988456102',
        categoriaCnh: 'E',
        validadeCnh: '2025-02-10', // Próxima ao vencimento para testar alerta!
        tipoVinculo: 'TERCEIRO',
        tipoChavePix: 'TELEFONE',
        chavePix: '+5511973341188',
        banco: 'Caixa Econômica (104)',
        agencia: '0210',
        conta: '10928-8',
        contatoEmergencia: 'Sandra Costa (Filha)',
        telefoneEmergencia: '(11) 97221-0099',
        ativo: true,
        dataCadastro: '2024-03-10',
        observacoes: 'Atenção: Renovação de CNH em andamento.'
      }
    ];

    const veiculosIniciais: Veiculo[] = [
      {
        id: 'veic-1',
        placa: 'BRA2E19',
        modelo: 'Volvo FH 540 Globetrotter 6x4',
        marca: 'Volvo',
        ano: 2023,
        tipo: 'CARRETA',
        proprietario: 'PROPRIO',
        motoristaPadraoId: 'mot-1',
        quilometragemAtual: 142800,
        vencimentoSeguro: '2027-02-28',
        vencimentoCrlv: '2026-11-30',
        proximaManutencaoKm: 150000,
        ativo: true,
        observacoes: 'Revisão periódica preventiva em concessionária autorizada.'
      },
      {
        id: 'veic-2',
        placa: 'RKO8A44',
        modelo: 'Scania R 450 Highline 6x2',
        marca: 'Scania',
        ano: 2022,
        tipo: 'TRUCK',
        proprietario: 'PROPRIO',
        motoristaPadraoId: 'mot-2',
        quilometragemAtual: 218500,
        vencimentoSeguro: '2026-09-15',
        vencimentoCrlv: '2026-10-31',
        proximaManutencaoKm: 220000,
        ativo: true,
        observacoes: 'Kit telemetria e rastreador homologado instalados.'
      },
      {
        id: 'veic-3',
        placa: 'FXT4J90',
        modelo: 'Mercedes-Benz Actros 2651',
        marca: 'Mercedes-Benz',
        ano: 2021,
        tipo: 'CARRETA',
        proprietario: 'AGREGADO',
        motoristaPadraoId: 'mot-3',
        quilometragemAtual: 310000,
        vencimentoSeguro: '2026-08-10',
        vencimentoCrlv: '2026-10-31',
        proximaManutencaoKm: 315000,
        ativo: true,
        observacoes: 'Cavalo mecânico próprio do agregado Antônio.'
      }
    ];

    const clientesIniciais: Cliente[] = [
      {
        id: 'cli-1',
        razaoSocial: 'Atacadista Distribuidor Central do Brasil S/A',
        nomeFantasia: 'Atacadão Central Log',
        cnpjCpf: '12.345.678/0001-90',
        telefone: '(11) 3300-4000',
        email: 'logistica.central@atacadista.com.br',
        cidade: 'Jundiaí',
        estado: 'SP',
        tarifaPadrao: 230.00, // Tarifa padrão conforme requisito R$ 230
        ativo: true
      },
      {
        id: 'cli-2',
        razaoSocial: 'Indústria Química e Farmacêutica Paulista Ltda',
        nomeFantasia: 'Pharma Paulista',
        cnpjCpf: '45.678.901/0001-23',
        telefone: '(19) 3880-9900',
        email: 'expedicao@pharmapaulista.com.br',
        cidade: 'Campinas',
        estado: 'SP',
        tarifaPadrao: 285.00, // Tarifa customizada
        ativo: true
      },
      {
        id: 'cli-3',
        razaoSocial: 'Rede Varejista Multimarcas Brasil Ltda',
        nomeFantasia: 'MegaVarejo',
        cnpjCpf: '67.890.123/0001-45',
        telefone: '(11) 2200-8800',
        email: 'recebimento@megavarejo.com.br',
        cidade: 'São Paulo',
        estado: 'SP',
        tarifaPadrao: 250.00,
        ativo: true
      }
    ];

    const fornecedoresIniciais: Fornecedor[] = [
      {
        id: 'forn-1',
        razaoSocial: 'Posto Petrobras Rodovia dos Bandeirantes Ltda',
        nomeFantasia: 'Posto Bandeirantes Diesel',
        cnpjCpf: '33.444.555/0001-66',
        telefone: '(11) 4580-1200',
        categoria: 'POSTO',
        cidade: 'Itupeva',
        estado: 'SP'
      },
      {
        id: 'forn-2',
        razaoSocial: 'Auto Peças e Molas Anhanguera Ltda',
        nomeFantasia: 'Centro Automotivo Anhanguera',
        cnpjCpf: '77.888.999/0001-11',
        telefone: '(11) 4587-3300',
        categoria: 'OFICINA',
        cidade: 'Jundiaí',
        estado: 'SP'
      }
    ];

    const romaneiosIniciais: Romaneio[] = [
      {
        id: 'rom-8921',
        numeroRomaneio: 'ROM-2026-8921',
        dataEmissao: hoje,
        motoristaIdentificado: 'Carlos Eduardo Oliveira Silva',
        cpfIdentificado: '234.567.890-11',
        motoristaId: 'mot-1',
        placaIdentificada: 'BRA2E19',
        veiculoId: 'veic-1',
        origem: 'CD Jundiaí - SP (Anhanguera KM 62)',
        destino: 'Filial Campinas - SP (Rod. Dom Pedro)',
        pesoCargaKg: 14850,
        valorNotaCarga: 112450.00,
        nomeArquivoOriginal: 'romaneio_carga_8921_digital.pdf',
        textoExtraido: 'DOCUMENTO DE EXPEDIÇÃO E TRANSPORTE Nº 8921 | DATA: ' + hoje + ' | TRANSPORTADOR: Carlos Eduardo Oliveira Silva | CPF: 234.567.890-11 | PLACA: BRA2E19 | PESO: 14.850 KG | VALOR DA CARGA: R$ 112.450,00 | ORIGEM: CD Jundiaí/SP | DESTINO: Filial Campinas/SP',
        dataImportacao: new Date().toISOString(),
        statusProcessamento: 'CONFIRMADO',
        viagemId: 'viag-201'
      },
      {
        id: 'rom-8922',
        numeroRomaneio: 'ROM-2026-8922',
        dataEmissao: hoje,
        motoristaIdentificado: 'Marcos Roberto Santos',
        cpfIdentificado: '345.678.901-22',
        motoristaId: 'mot-2',
        placaIdentificada: 'RKO8A44',
        veiculoId: 'veic-2',
        origem: 'Pharma Paulista - Campinas/SP',
        destino: 'Centro Logístico Cajamar/SP',
        pesoCargaKg: 8900,
        valorNotaCarga: 248900.00,
        nomeArquivoOriginal: 'romaneio_carga_8922.pdf',
        textoExtraido: 'ROMANEIO FISCAL Nº 8922 | EMISSÃO: ' + hoje + ' | CONDUTOR: Marcos Roberto Santos | VEÍCULO: RKO8A44 | PESO: 8.900 KG | VALOR MERCADORIA: R$ 248.900,00',
        dataImportacao: new Date().toISOString(),
        statusProcessamento: 'CONFIRMADO',
        viagemId: 'viag-202'
      }
    ];

    const viagensIniciais: Viagem[] = [
      {
        id: 'viag-201',
        codigoViagem: 'VG-2026-001',
        romaneioId: 'rom-8921',
        numeroRomaneio: 'ROM-2026-8921',
        motoristaId: 'mot-1',
        motoristaNome: 'Carlos Eduardo Oliveira Silva',
        veiculoId: 'veic-1',
        veiculoPlaca: 'BRA2E19',
        clienteId: 'cli-1',
        clienteNome: 'Atacadista Distribuidor Central do Brasil S/A',
        origem: 'CD Jundiaí - SP (Anhanguera KM 62)',
        destino: 'Filial Campinas - SP (Rod. Dom Pedro)',
        dataSaida: hoje,
        dataChegadaPrevista: hoje,
        valorFreteBruto: cfg.valorFretePadrao, // R$ 230,00
        pedagioIncluso: 34.60,
        adicionais: 0,
        descontos: 0,
        status: 'CONCLUIDA'
      },
      {
        id: 'viag-202',
        codigoViagem: 'VG-2026-002',
        romaneioId: 'rom-8922',
        numeroRomaneio: 'ROM-2026-8922',
        motoristaId: 'mot-2',
        motoristaNome: 'Marcos Roberto Santos',
        veiculoId: 'veic-2',
        veiculoPlaca: 'RKO8A44',
        clienteId: 'cli-2',
        clienteNome: 'Indústria Química e Farmacêutica Paulista Ltda',
        origem: 'Pharma Paulista - Campinas/SP',
        destino: 'Centro Logístico Cajamar/SP',
        dataSaida: hoje,
        dataChegadaPrevista: hoje,
        valorFreteBruto: 285.00, // Tarifa contratual do cliente 2
        pedagioIncluso: 28.90,
        adicionais: 0,
        descontos: 0,
        status: 'EM_ANDAMENTO'
      }
    ];

    const financeiroInicial: TransacaoFinanceira[] = [
      {
        id: 'fin-rec-1',
        tipo: 'RECEITA',
        categoria: 'FRETE_RECEBER',
        descricao: 'Faturamento de Frete - Romaneio ROM-2026-8921 (Atacadão Central)',
        valor: 230.00,
        dataEmissao: hoje,
        dataVencimento: new Date(Date.now() + 15 * 86400000).toISOString().substring(0, 10),
        status: 'PENDENTE',
        clienteId: 'cli-1',
        viagemId: 'viag-201'
      },
      {
        id: 'fin-rec-2',
        tipo: 'RECEITA',
        categoria: 'FRETE_RECEBER',
        descricao: 'Faturamento de Frete - Romaneio ROM-2026-8922 (Pharma Paulista)',
        valor: 285.00,
        dataEmissao: hoje,
        dataVencimento: new Date(Date.now() + 20 * 86400000).toISOString().substring(0, 10),
        status: 'PENDENTE',
        clienteId: 'cli-2',
        viagemId: 'viag-202'
      },
      {
        id: 'fin-desp-1',
        tipo: 'DESPESA',
        categoria: 'COMBUSTIVEL',
        descricao: 'Diesel S10 Posto Bandeirantes (250 Litros) - Placa BRA2E19',
        valor: 1480.00,
        dataEmissao: hoje,
        dataVencimento: hoje,
        dataPagamento: hoje,
        valorPago: 1480.00,
        status: 'PAGO',
        veiculoId: 'veic-1',
        fornecedorNome: 'Posto Petrobras Bandeirantes',
        comprovanteNome: 'nfce_combustivel_4492.pdf'
      },
      {
        id: 'fin-desp-2',
        tipo: 'DESPESA',
        categoria: 'PEDAGIO',
        descricao: 'Vale Pedágio Eletrônico Sem Parar - Trecho Jundiaí/Campinas',
        valor: 34.60,
        dataEmissao: hoje,
        dataVencimento: hoje,
        dataPagamento: hoje,
        valorPago: 34.60,
        status: 'PAGO',
        veiculoId: 'veic-1',
        viagemId: 'viag-201'
      },
      {
        id: 'fin-desp-3',
        tipo: 'DESPESA',
        categoria: 'SALARIOS_ADIANTAMENTOS',
        descricao: 'Adiantamento de viagem (Vale Despesas) - Carlos Eduardo',
        valor: 50.00,
        dataEmissao: hoje,
        dataVencimento: hoje,
        dataPagamento: hoje,
        valorPago: 50.00,
        status: 'PAGO',
        motoristaId: 'mot-1',
        observacoes: 'Adiantamento concedido via Pix para alimentação na rota.'
      }
    ];

    localStorage.setItem(STORAGE_KEYS.MOTORISTAS, JSON.stringify(motoristasIniciais));
    localStorage.setItem(STORAGE_KEYS.VEICULOS, JSON.stringify(veiculosIniciais));
    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientesIniciais));
    localStorage.setItem(STORAGE_KEYS.FORNECEDORES, JSON.stringify(fornecedoresIniciais));
    localStorage.setItem(STORAGE_KEYS.ROMANEIOS, JSON.stringify(romaneiosIniciais));
    localStorage.setItem(STORAGE_KEYS.VIAGENS, JSON.stringify(viagensIniciais));
    localStorage.setItem(STORAGE_KEYS.FINANCEIRO, JSON.stringify(financeiroInicial));
    
    this.logAction(
      'Sistema TransLog Pro', 
      'ADMIN', 
      'Inicialização', 
      'Seed Automático', 
      'Base operacional inicial carregada com regras de negócio, motoristas e romaneios demonstrativos.'
    );
  },

  resetToDemo(): void {
    localStorage.removeItem(STORAGE_KEYS.MOTORISTAS);
    localStorage.removeItem(STORAGE_KEYS.VEICULOS);
    localStorage.removeItem(STORAGE_KEYS.CLIENTES);
    localStorage.removeItem(STORAGE_KEYS.FORNECEDORES);
    localStorage.removeItem(STORAGE_KEYS.ROMANEIOS);
    localStorage.removeItem(STORAGE_KEYS.VIAGENS);
    localStorage.removeItem(STORAGE_KEYS.FINANCEIRO);
    localStorage.removeItem(STORAGE_KEYS.ACERTOS);
    this.seedInitialIfEmpty();
  },

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.MOTORISTAS);
    localStorage.removeItem(STORAGE_KEYS.VEICULOS);
    localStorage.removeItem(STORAGE_KEYS.CLIENTES);
    localStorage.removeItem(STORAGE_KEYS.FORNECEDORES);
    localStorage.removeItem(STORAGE_KEYS.ROMANEIOS);
    localStorage.removeItem(STORAGE_KEYS.VIAGENS);
    localStorage.removeItem(STORAGE_KEYS.FINANCEIRO);
    localStorage.removeItem(STORAGE_KEYS.ACERTOS);
    localStorage.setItem(STORAGE_KEYS.MOTORISTAS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.VEICULOS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.FORNECEDORES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ROMANEIOS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.VIAGENS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.FINANCEIRO, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ACERTOS, JSON.stringify([]));
  }
};
