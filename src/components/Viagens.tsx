import React, { useState } from 'react';
import { DB } from '../services/db';
import { PdfGenerator } from '../services/pdfGenerator';
import { Viagem, StatusViagem } from '../types';
import { 
  Truck, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  ChevronDown
} from 'lucide-react';

export const Viagens: React.FC = () => {
  const [viagens, setViagens] = useState<Viagem[]>(DB.getViagens());
  const motoristas = DB.getMotoristas();
  const veiculos = DB.getVeiculos();
  const clientes = DB.getClientes();
  const cfg = DB.getConfig();

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [modalNovaViagem, setModalNovaViagem] = useState(false);
  const [detalheViagem, setDetalheViagem] = useState<Viagem | null>(null);

  // Form State para lançamento manual
  const [formMotoristaId, setFormMotoristaId] = useState('');
  const [formVeiculoId, setFormVeiculoId] = useState('');
  const [formClienteId, setFormClienteId] = useState('');
  const [formNumRomaneio, setFormNumRomaneio] = useState('');
  const [formValorFrete, setFormValorFrete] = useState<number>(cfg.valorFretePadrao);
  const [formOrigem, setFormOrigem] = useState('');
  const [formDestino, setFormDestino] = useState('');
  const [formDataSaida, setFormDataSaida] = useState(new Date().toISOString().substring(0, 10));
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  const statusList: StatusViagem[] = [
    'PLANEJADA',
    'LIBERADA',
    'EM_ANDAMENTO',
    'CONCLUIDA',
    'EM_CONFERENCIA',
    'PAGA',
    'CANCELADA'
  ];

  const filtradas = viagens.filter(v => {
    const matchBusca = 
      v.codigoViagem.toLowerCase().includes(busca.toLowerCase()) ||
      v.numeroRomaneio.toLowerCase().includes(busca.toLowerCase()) ||
      v.motoristaNome.toLowerCase().includes(busca.toLowerCase()) ||
      v.veiculoPlaca.toLowerCase().includes(busca.toLowerCase()) ||
      v.clienteNome.toLowerCase().includes(busca.toLowerCase());

    const matchStatus = filtroStatus === 'TODOS' || v.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const handleAtualizarStatus = (viagem: Viagem, novoStatus: StatusViagem) => {
    viagem.status = novoStatus;
    if (novoStatus === 'CONCLUIDA' && !viagem.dataFinalizacao) {
      viagem.dataFinalizacao = new Date().toISOString().substring(0, 10);
    }
    const res = DB.saveViagem(viagem);
    if (res.success) {
      setViagens([...DB.getViagens()]);
      if (detalheViagem && detalheViagem.id === viagem.id) {
        setDetalheViagem({ ...viagem });
      }
    }
  };

  const handleSalvarNovaViagem = (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);

    if (!formMotoristaId || !formVeiculoId || !formClienteId || !formNumRomaneio.trim()) {
      setMensagemErro('Preencha todos os campos obrigatórios.');
      return;
    }

    const mot = motoristas.find(m => m.id === formMotoristaId)!;
    const veic = veiculos.find(v => v.id === formVeiculoId)!;
    const cli = clientes.find(c => c.id === formClienteId)!;

    const nova: Viagem = {
      id: 'VG-' + Date.now(),
      codigoViagem: 'VG-' + Math.floor(1000 + Math.random() * 9000),
      romaneioId: 'MANUAL-' + Date.now(),
      numeroRomaneio: formNumRomaneio.trim(),
      motoristaId: mot.id,
      motoristaNome: mot.nomeCompleto,
      veiculoId: veic.id,
      veiculoPlaca: veic.placa,
      clienteId: cli.id,
      clienteNome: cli.razaoSocial,
      origem: formOrigem || 'Pátio Central Jundiaí/SP',
      destino: formDestino || 'Destino do Cliente',
      dataSaida: formDataSaida,
      dataChegadaPrevista: formDataSaida,
      valorFreteBruto: Number(formValorFrete),
      pedagioIncluso: 0,
      adicionais: 0,
      descontos: 0,
      status: 'PLANEJADA'
    };

    const res = DB.saveViagem(nova);
    if (!res.success) {
      setMensagemErro(res.message);
      return;
    }

    // Gerar faturamento previsto a receber
    DB.saveFinanceiro({
      id: 'FIN-' + Date.now(),
      tipo: 'RECEITA',
      categoria: 'FRETE_RECEBER',
      descricao: `Frete Viagem ${nova.codigoViagem} (Romaneio: ${nova.numeroRomaneio})`,
      valor: Number(formValorFrete),
      dataEmissao: formDataSaida,
      dataVencimento: new Date(Date.now() + 15 * 86400000).toISOString().substring(0, 10),
      status: 'PENDENTE',
      clienteId: cli.id,
      viagemId: nova.id
    });

    setViagens([...DB.getViagens()]);
    setModalNovaViagem(false);
    setFormNumRomaneio('');
  };

  const handleExportarCsv = () => {
    const headers = ['Codigo', 'Romaneio', 'DataSaida', 'Motorista', 'Placa', 'Cliente', 'Origem', 'Destino', 'ValorFrete', 'Status'];
    const rows = filtradas.map(v => [
      v.codigoViagem,
      v.numeroRomaneio,
      v.dataSaida,
      `"${v.motoristaNome}"`,
      v.veiculoPlaca,
      `"${v.clienteNome}"`,
      `"${v.origem}"`,
      `"${v.destino}"`,
      v.valorFreteBruto.toFixed(2),
      v.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `viagens_translog_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImprimirOrdem = (v: Viagem) => {
    const mot = motoristas.find(m => m.id === v.motoristaId);
    const veic = veiculos.find(ve => ve.id === v.veiculoId);
    PdfGenerator.gerarOrdemViagem(v, cfg, mot, veic);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gestão Operacional de Viagens e Fretes</h2>
          <p className="text-sm text-slate-500 mt-1">
            Controle de tarifas, status de entrega, conciliação de romaneios e emissão de ordens de viagem.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportarCsv}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download size={15} />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => {
              if (motoristas.length > 0) setFormMotoristaId(motoristas[0].id);
              if (veiculos.length > 0) setFormVeiculoId(veiculos[0].id);
              if (clientes.length > 0) {
                setFormClienteId(clientes[0].id);
                setFormValorFrete(clientes[0].tarifaPadrao || cfg.valorFretePadrao);
              }
              setModalNovaViagem(true);
            }}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={16} />
            <span>Lançar Viagem Manual</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex items-center bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 w-full md:w-80">
          <Search size={16} className="text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por código, placa, motorista ou romaneio..."
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filtrar Status:</span>
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="TODOS">Todos os Status ({viagens.length})</option>
            {statusList.map(st => (
              <option key={st} value={st}>{st.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Viagens */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Cód. Viagem</th>
                <th className="px-5 py-3.5">Romaneio</th>
                <th className="px-5 py-3.5">Data Saída</th>
                <th className="px-5 py-3.5">Motorista</th>
                <th className="px-5 py-3.5">Veículo</th>
                <th className="px-5 py-3.5">Cliente Embarcador</th>
                <th className="px-5 py-3.5">Frete Bruto</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtradas.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900 font-mono text-xs">
                    {v.codigoViagem}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                    {v.numeroRomaneio}
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    {new Date(v.dataSaida).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {v.motoristaNome}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 bg-slate-100 rounded font-mono font-bold text-xs text-slate-800">
                      {v.veiculoPlaca}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-700 max-w-xs truncate">
                    {v.clienteNome}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">
                    R$ {v.valorFreteBruto.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={v.status}
                      onChange={e => handleAtualizarStatus(v, e.target.value as StatusViagem)}
                      className={`text-[11px] font-bold rounded-lg px-2 py-1 border outline-none cursor-pointer ${
                        v.status === 'CONCLUIDA' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        v.status === 'EM_ANDAMENTO' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        v.status === 'PAGA' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                        v.status === 'EM_CONFERENCIA' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        v.status === 'CANCELADA' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {statusList.map(st => (
                        <option key={st} value={st}>{st.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => handleImprimirOrdem(v)}
                        title="Imprimir Ordem de Carregamento PDF"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => setDetalheViagem(v)}
                        title="Ver Detalhes da Viagem"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-slate-400 text-sm">
                    Nenhuma viagem corresponde aos critérios pesquisados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lançar Viagem Manual */}
      {modalNovaViagem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Cadastrar Nova Viagem Manual</h3>
              <button onClick={() => setModalNovaViagem(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                ✕
              </button>
            </div>

            {mensagemErro && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {mensagemErro}
              </div>
            )}

            <form onSubmit={handleSalvarNovaViagem} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nº do Romaneio *</label>
                  <input
                    type="text"
                    required
                    value={formNumRomaneio}
                    onChange={e => setFormNumRomaneio(e.target.value)}
                    placeholder="Ex: ROM-2026-9041"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data de Saída *</label>
                  <input
                    type="date"
                    required
                    value={formDataSaida}
                    onChange={e => setFormDataSaida(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Motorista *</label>
                  <select
                    value={formMotoristaId}
                    onChange={e => setFormMotoristaId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    {motoristas.map(m => (
                      <option key={m.id} value={m.id}>{m.nomeCompleto} ({m.tipoVinculo})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Veículo / Placa *</label>
                  <select
                    value={formVeiculoId}
                    onChange={e => setFormVeiculoId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    {veiculos.map(v => (
                      <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cliente *</label>
                  <select
                    value={formClienteId}
                    onChange={e => {
                      setFormClienteId(e.target.value);
                      const c = clientes.find(item => item.id === e.target.value);
                      if (c && c.tarifaPadrao) setFormValorFrete(c.tarifaPadrao);
                    }}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.razaoSocial}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valor do Frete (R$) * [Base R$ 230]</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formValorFrete}
                    onChange={e => setFormValorFrete(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Origem</label>
                  <input
                    type="text"
                    value={formOrigem}
                    onChange={e => setFormOrigem(e.target.value)}
                    placeholder="Pátio Jundiaí/SP"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destino</label>
                  <input
                    type="text"
                    value={formDestino}
                    onChange={e => setFormDestino(e.target.value)}
                    placeholder="Filial Campinas/SP"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovaViagem(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Gravar Viagem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes da Viagem */}
      {detalheViagem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Ficha da Viagem {detalheViagem.codigoViagem}</h3>
                <span className="text-xs text-slate-400">Romaneio: {detalheViagem.numeroRomaneio}</span>
              </div>
              <button onClick={() => setDetalheViagem(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Motorista:</span>
                <span className="font-bold text-slate-900">{detalheViagem.motoristaNome}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Placa / Veículo:</span>
                <span className="font-mono font-bold text-slate-900">{detalheViagem.veiculoPlaca}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Cliente Tomador:</span>
                <span className="font-bold text-slate-900">{detalheViagem.clienteNome}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Origem:</span>
                <span>{detalheViagem.origem}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Destino:</span>
                <span>{detalheViagem.destino}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Valor do Frete Bruto:</span>
                <span className="font-bold text-emerald-700 text-sm">R$ {detalheViagem.valorFreteBruto.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Status Atual:</span>
                <span className="font-bold text-blue-900">{detalheViagem.status}</span>
              </div>
              {detalheViagem.acertoId && (
                <div className="p-2.5 bg-purple-50 rounded-xl text-purple-900 font-semibold">
                  ✓ Viagem liquidada no Acerto de Motorista: {detalheViagem.acertoId}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => handleImprimirOrdem(detalheViagem)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
              >
                <FileText size={15} />
                <span>Emitir PDF Oficial</span>
              </button>
              <button
                onClick={() => setDetalheViagem(null)}
                className="px-5 py-2 bg-[#0A192F] hover:bg-[#1E3A8A] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
