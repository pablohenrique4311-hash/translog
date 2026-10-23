import React, { useState } from 'react';
import { RomaneioParser, ExtractedRomaneio } from '../services/romaneioParser';
import { DB } from '../services/db';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  ShieldAlert, 
  Clock, 
  ArrowRight, 
  FileCheck, 
  Sparkles,
  Info
} from 'lucide-react';
import { Romaneio, Viagem } from '../types';

interface ImportarRomaneiosProps {
  onSuccessNavigate?: () => void;
}

export const ImportarRomaneios: React.FC<ImportarRomaneiosProps> = ({ onSuccessNavigate }) => {
  const motoristas = DB.getMotoristas();
  const veiculos = DB.getVeiculos();
  const clientes = DB.getClientes();
  const cfg = DB.getConfig();
  const historicoRomaneios = DB.getRomaneios();

  const [loading, setLoading] = useState(false);
  const [extractedDocs, setExtractedDocs] = useState<ExtractedRomaneio[]>([]);
  const [activeDocIndex, setActiveDocIndex] = useState<number>(0);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Form de conferência interativa do documento ativo
  const [numeroRomaneio, setNumeroRomaneio] = useState('');
  const [dataEmissao, setDataEmissao] = useState('');
  const [motoristaId, setMotoristaId] = useState('');
  const [veiculoId, setVeiculoId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [valorFrete, setValorFrete] = useState<number>(cfg.valorFretePadrao); // R$ 230,00 padrão
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [pesoKg, setPesoKg] = useState<number>(0);
  const [valorCarga, setValorCarga] = useState<number>(0);

  const carregarDocParaConferencia = (doc: ExtractedRomaneio) => {
    setNumeroRomaneio(doc.numeroRomaneio);
    setDataEmissao(doc.dataEmissao);
    setOrigem(doc.origem);
    setDestino(doc.destino);
    setPesoKg(doc.pesoKg);
    setValorCarga(doc.valorCarga);

    // Associação inteligente com motorista
    const mEncontrado = motoristas.find(m => 
      (doc.cpf && m.cpf.replace(/\D/g, '') === doc.cpf.replace(/\D/g, '')) ||
      (doc.motoristaNome && m.nomeCompleto.toLowerCase().includes(doc.motoristaNome.toLowerCase()))
    );
    if (mEncontrado) {
      setMotoristaId(mEncontrado.id);
    } else if (motoristas.length > 0) {
      setMotoristaId(motoristas[0].id);
    }

    // Associação inteligente com veículo pela placa
    const vEncontrado = veiculos.find(v => 
      doc.placa && v.placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === doc.placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    );
    if (vEncontrado) {
      setVeiculoId(vEncontrado.id);
    } else if (veiculos.length > 0) {
      setVeiculoId(veiculos[0].id);
    }

    // Cliente padrão e tarifa do cliente
    if (clientes.length > 0) {
      setClienteId(clientes[0].id);
      setValorFrete(clientes[0].tarifaPadrao || cfg.valorFretePadrao);
    } else {
      setValorFrete(cfg.valorFretePadrao);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setLoading(true);
    setMensagemErro(null);
    setMensagemSucesso(null);

    const parsedList: ExtractedRomaneio[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const parsed = await RomaneioParser.parsePdfFile(file);
        parsedList.push(parsed);
      } catch (e) {
        console.error('Erro no parser do arquivo:', file.name, e);
      }
    }

    setLoading(false);
    if (parsedList.length > 0) {
      setExtractedDocs(parsedList);
      setActiveDocIndex(0);
      carregarDocParaConferencia(parsedList[0]);
    } else {
      setMensagemErro('Não foi possível processar os arquivos selecionados. Tente novamente.');
    }
  };

  // Carregador de Amostra para testes imediatos sem precisar de arquivo PDF
  const handleCarregarExemploTeste = () => {
    const hoje = new Date().toISOString().substring(0, 10);
    const mockTexto = `
      TRANSLOG EXPRESS LOGISTICA LTDA
      DOCUMENTO AUXILIAR DE TRANSPORTE E ROMANEIO DE CARGA
      NUMERO DO ROMANEIO: ROM-2026-${Math.floor(1000 + Math.random() * 9000)}
      DATA DE EMISSAO: ${hoje}
      MOTORISTA RESPONSAVEL: Carlos Eduardo Oliveira Silva
      CPF CONDUTOR: 234.567.890-11
      VEICULO TRACIONADOR: BRA2E19 (VOLVO FH 540)
      ORIGEM: CD Central Distribuição Jundiaí/SP
      DESTINO: Centro Logístico Campinas/SP
      PESO BRUTO DA CARGA: 14.500 KG
      VALOR TOTAL DECLARADO DAS MERCADORIAS: R$ 98.400,00
      MERCADORIA: Alimentos não perecíveis e embalagens industriais
    `;

    const parsed = RomaneioParser.parseRawText(mockTexto, 'romaneio_digital_demonstracao.pdf', 45000);
    setExtractedDocs([parsed]);
    setActiveDocIndex(0);
    carregarDocParaConferencia(parsed);
    setMensagemErro(null);
  };

  const handleConfirmarEGravar = () => {
    if (!numeroRomaneio.trim()) {
      setMensagemErro('O número do romaneio é obrigatório.');
      return;
    }

    if (!motoristaId) {
      setMensagemErro('Selecione ou vincule o motorista responsável.');
      return;
    }

    if (!veiculoId) {
      setMensagemErro('Selecione a placa do veículo.');
      return;
    }

    if (!clienteId) {
      setMensagemErro('Selecione o cliente tomador do serviço.');
      return;
    }

    // 1. Verificação Estrita de Duplicidade
    const docAtivo = extractedDocs[activeDocIndex];
    const romaneioId = 'ROM-' + Date.now();
    const viagemId = 'VG-' + Math.floor(1000 + Math.random() * 9000);

    const m = motoristas.find(item => item.id === motoristaId);
    const v = veiculos.find(item => item.id === veiculoId);
    const c = clientes.find(item => item.id === clienteId);

    const novoRomaneio: Romaneio = {
      id: romaneioId,
      numeroRomaneio: numeroRomaneio.trim(),
      dataEmissao: dataEmissao || new Date().toISOString().substring(0, 10),
      motoristaIdentificado: m?.nomeCompleto,
      cpfIdentificado: m?.cpf,
      motoristaId: m?.id,
      placaIdentificada: v?.placa,
      veiculoId: v?.id,
      origem: origem || 'Origem não informada',
      destino: destino || 'Destino não informado',
      pesoCargaKg: Number(pesoKg) || 0,
      valorNotaCarga: Number(valorCarga) || 0,
      nomeArquivoOriginal: docAtivo?.nomeArquivo || 'documento_romaneio.pdf',
      textoExtraido: docAtivo?.textoBruto || '',
      dataImportacao: new Date().toISOString(),
      statusProcessamento: 'CONFIRMADO',
      viagemId: viagemId
    };

    // Tentar salvar romaneio no banco (rejeita se duplicado)
    const resRomaneio = DB.saveRomaneio(novoRomaneio);
    if (!resRomaneio.success) {
      setMensagemErro(resRomaneio.message);
      return;
    }

    // 2. Criar a viagem correspondente
    const novaViagem: Viagem = {
      id: viagemId,
      codigoViagem: 'VG-' + Math.floor(1000 + Math.random() * 9000),
      romaneioId: romaneioId,
      numeroRomaneio: novoRomaneio.numeroRomaneio,
      motoristaId: m!.id,
      motoristaNome: m!.nomeCompleto,
      veiculoId: v!.id,
      veiculoPlaca: v!.placa,
      clienteId: c!.id,
      clienteNome: c!.razaoSocial,
      origem: novoRomaneio.origem,
      destino: novoRomaneio.destino,
      dataSaida: novoRomaneio.dataEmissao,
      dataChegadaPrevista: novoRomaneio.dataEmissao,
      valorFreteBruto: Number(valorFrete),
      pedagioIncluso: 0,
      adicionais: 0,
      descontos: 0,
      status: 'CONCLUIDA'
    };

    const resViagem = DB.saveViagem(novaViagem);
    if (!resViagem.success) {
      setMensagemErro(resViagem.message);
      return;
    }

    // 3. Gerar título a receber no financeiro (Faturamento da transportadora junto ao cliente)
    DB.saveFinanceiro({
      id: 'FIN-REC-' + Date.now(),
      tipo: 'RECEITA',
      categoria: 'FRETE_RECEBER',
      descricao: `Faturamento Frete Romaneio ${novoRomaneio.numeroRomaneio} - ${c!.nomeFantasia || c!.razaoSocial}`,
      valor: Number(valorFrete),
      dataEmissao: novoRomaneio.dataEmissao,
      dataVencimento: new Date(Date.now() + 15 * 86400000).toISOString().substring(0, 10),
      status: 'PENDENTE',
      clienteId: c!.id,
      viagemId: viagemId
    });

    setMensagemSucesso(`Romaneio nº ${numeroRomaneio} homologado com sucesso! Viagem ${novaViagem.codigoViagem} criada e título gerado no financeiro.`);

    // Remover da fila de documentos pendentes
    const remaining = extractedDocs.filter((_, idx) => idx !== activeDocIndex);
    setExtractedDocs(remaining);
    if (remaining.length > 0) {
      setActiveDocIndex(0);
      carregarDocParaConferencia(remaining[0]);
    }
  };

  const docAtivo = extractedDocs[activeDocIndex];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Importação Automática e OCR de Romaneios</h2>
          <p className="text-sm text-slate-500 mt-1">
            Extração inteligente de PDFs com validação obrigatória contra romaneios em duplicidade.
          </p>
        </div>

        <button
          onClick={handleCarregarExemploTeste}
          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <Sparkles size={16} className="text-emerald-600" />
          <span>Carregar Romaneio Amostra (Teste Rápido)</span>
        </button>
      </div>

      {mensagemErro && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3 text-sm shadow-xs">
          <ShieldAlert size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Aviso de Bloqueio ou Inconsistência:</strong>
            <p className="mt-0.5">{mensagemErro}</p>
          </div>
        </div>
      )}

      {mensagemSucesso && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start space-x-3 text-sm shadow-xs">
          <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Operação Concluída com Sucesso:</strong>
            <p className="mt-0.5">{mensagemSucesso}</p>
          </div>
        </div>
      )}

      {/* Caixa de Upload de Arquivos */}
      {extractedDocs.length === 0 && (
        <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 transition-all text-center">
          <input
            type="file"
            id="pdf-upload"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
            disabled={loading}
          />
          <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center mb-4 shadow-xs">
              <Upload size={32} />
            </div>
            <span className="text-base font-bold text-slate-800">Clique para selecionar romaneios em PDF</span>
            <span className="text-xs text-slate-400 mt-1 max-w-md">
              Suporta múltiplos arquivos. Leitura automática de motorista, CPF, placa, rotas e pesos.
            </span>
            <span className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-950 transition-colors">
              Navegar nos arquivos do computador ou celular
            </span>
          </label>

          {loading && (
            <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-blue-700 font-semibold animate-pulse">
              <Clock size={18} />
              <span>Processando e decodificando estrutura dos documentos...</span>
            </div>
          )}
        </div>
      )}

      {/* Tela de Conferência Prévia Obrigatória (Requisito 3) */}
      {extractedDocs.length > 0 && docAtivo && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <FileCheck className="text-emerald-400" size={20} />
                <h3 className="font-bold text-base">Tela de Conferência e Validação Prévia</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Arquivo: <span className="text-slate-200 font-mono">{docAtivo.nomeArquivo}</span> ({extractedDocs.length} na fila)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                docAtivo.confianca === 'ALTA' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300'
              }`}>
                Confiança OCR: {docAtivo.confianca}
              </span>
              <button
                onClick={() => setExtractedDocs([])}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
                title="Descartar"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Avisos de OCR / Campos Ausentes */}
          {docAtivo.avisos.length > 0 && (
            <div className="p-4 bg-amber-50/70 border-b border-amber-200/60 text-xs text-amber-800 space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-amber-900">
                <AlertTriangle size={15} />
                <span>Diagnósticos do Leitor de Romaneio:</span>
              </div>
              {docAtivo.avisos.map((aviso, idx) => (
                <div key={idx} className="pl-5 text-amber-700">• {aviso}</div>
              ))}
            </div>
          )}

          {/* Formulário de Conferência */}
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nº do Romaneio / Conhecimento *</label>
                <input
                  type="text"
                  value={numeroRomaneio}
                  onChange={e => setNumeroRomaneio(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data de Emissão do Documento *</label>
                <input
                  type="date"
                  value={dataEmissao}
                  onChange={e => setDataEmissao(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Valor do Frete (R$) * [Base R$ 230]</label>
                <input
                  type="number"
                  step="0.01"
                  value={valorFrete}
                  onChange={e => setValorFrete(parseFloat(e.target.value) || 0)}
                  className="w-full bg-emerald-50/40 focus:bg-white border border-emerald-300 rounded-xl px-3 py-2 text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motorista Vinculado *</label>
                <select
                  value={motoristaId}
                  onChange={e => setMotoristaId(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="">Selecione o motorista...</option>
                  {motoristas.map(m => (
                    <option key={m.id} value={m.id}>{m.nomeCompleto} - CPF: {m.cpf} ({m.tipoVinculo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Veículo / Placa Tracionadora *</label>
                <select
                  value={veiculoId}
                  onChange={e => setVeiculoId(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="">Selecione a placa...</option>
                  {veiculos.map(v => (
                    <option key={v.id} value={v.id}>{v.placa} • {v.modelo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cliente / Embarcador *</label>
                <select
                  value={clienteId}
                  onChange={e => {
                    setClienteId(e.target.value);
                    const cli = clientes.find(c => c.id === e.target.value);
                    if (cli && cli.tarifaPadrao) {
                      setValorFrete(cli.tarifaPadrao);
                    }
                  }}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="">Selecione o cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.razaoSocial} (Tarifa: R$ {c.tarifaPadrao.toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Origem do Carregamento</label>
                <input
                  type="text"
                  value={origem}
                  onChange={e => setOrigem(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destino de Entrega</label>
                <input
                  type="text"
                  value={destino}
                  onChange={e => setDestino(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Peso da Carga (KG)</label>
                <input
                  type="number"
                  value={pesoKg}
                  onChange={e => setPesoKg(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Texto Bruto Extraído para Auditoria Visual */}
            <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Extrato Bruto OCR (Conferência de Integridade)
              </span>
              <p className="text-xs font-mono text-slate-600 line-clamp-3 bg-white p-2.5 rounded border border-slate-200/80">
                {docAtivo.textoBruto || 'Texto legível não encontrado em streams digitais.'}
              </p>
            </div>

            {/* Ações */}
            <div className="mt-6 flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setExtractedDocs([])}
                className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar Conferência
              </button>

              <button
                type="button"
                onClick={handleConfirmarEGravar}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <CheckCircle size={18} />
                <span>Validar Dados e Registrar Viagem</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Histórico de Romaneios Importados */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Histórico de Romaneios Importados</h3>
            <p className="text-xs text-slate-500 mt-0.5">Rastreabilidade completa de arquivos originais e viagens atreladas</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {historicoRomaneios.length} registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Nº Romaneio</th>
                <th className="px-5 py-3.5">Emissão</th>
                <th className="px-5 py-3.5">Motorista</th>
                <th className="px-5 py-3.5">Placa</th>
                <th className="px-5 py-3.5">Origem / Destino</th>
                <th className="px-5 py-3.5">Peso Carga</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historicoRomaneios.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                    {r.numeroRomaneio}
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    {new Date(r.dataEmissao).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {r.motoristaIdentificado || '-'}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs">
                    {r.placaIdentificada ? (
                      <span className="px-2 py-0.5 bg-slate-100 rounded font-bold text-slate-800">
                        {r.placaIdentificada}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                    {r.origem} → {r.destino}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">
                    {r.pesoCargaKg ? `${r.pesoCargaKg.toLocaleString('pt-BR')} kg` : '-'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {r.statusProcessamento}
                    </span>
                  </td>
                </tr>
              ))}
              {historicoRomaneios.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">
                    Nenhum romaneio importado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
