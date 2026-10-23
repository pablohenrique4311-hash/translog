import React, { useState, useMemo } from 'react';
import { DB } from '../services/db';
import { TransacaoFinanceira, CategoriaFinanceira, StatusFinanceiro } from '../types';
import { 
  DollarSign, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plus, 
  CheckCircle, 
  Search, 
  Filter, 
  Calendar, 
  ShieldAlert, 
  FileText,
  AlertCircle,
  XCircle,
  Building,
  Truck,
  Users
} from 'lucide-react';

export const Financeiro: React.FC = () => {
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>(DB.getFinanceiro());
  const motoristas = DB.getMotoristas();
  const veiculos = DB.getVeiculos();
  const clientes = DB.getClientes();
  const viagens = DB.getViagens();

  const [tab, setTab] = useState<'TODOS' | 'RECEITAS' | 'DESPESAS'>('TODOS');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [busca, setBusca] = useState('');
  const [modalNovo, setModalNovo] = useState(false);
  const [modalCancelar, setModalCancelar] = useState<TransacaoFinanceira | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [modalBaixa, setModalBaixa] = useState<TransacaoFinanceira | null>(null);
  const [dataPagamentoBaixa, setDataPagamentoBaixa] = useState(new Date().toISOString().substring(0, 10));
  const [valorPagoBaixa, setValorPagoBaixa] = useState<number>(0);

  // Form State
  const [tipo, setTipo] = useState<'RECEITA' | 'DESPESA'>('DESPESA');
  const [categoria, setCategoria] = useState<CategoriaFinanceira>('COMBUSTIVEL');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().substring(0, 10));
  const [motoristaId, setMotoristaId] = useState('');
  const [veiculoId, setVeiculoId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [fornecedorNome, setFornecedorNome] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const categorias: { id: CategoriaFinanceira; label: string }[] = [
    { id: 'FRETE_RECEBER', label: 'Frete a Receber' },
    { id: 'COMBUSTIVEL', label: 'Combustível (Diesel S10)' },
    { id: 'PEDAGIO', label: 'Vale Pedágio' },
    { id: 'MANUTENCAO', label: 'Manutenção Mecânica' },
    { id: 'PNEUS', label: 'Pneus e Recapagem' },
    { id: 'ALIMENTACAO', label: 'Alimentação / Diárias' },
    { id: 'SALARIOS_ADIANTAMENTOS', label: 'Salários e Adiantamentos' },
    { id: 'IMPOSTOS', label: 'Impostos e Taxas' },
    { id: 'OUTROS', label: 'Outras Despesas' },
  ];

  // Resumo Financeiro em Tempo Real
  const resumo = useMemo(() => {
    let receitasPagas = 0;
    let receitasAbertas = 0;
    let despesasPagas = 0;
    let despesasAbertas = 0;

    transacoes.forEach(t => {
      if (t.status === 'CANCELADO') return;

      if (t.tipo === 'RECEITA') {
        if (t.status === 'PAGO') receitasPagas += t.valorPago ?? t.valor;
        else receitasAbertas += t.valor;
      } else {
        if (t.status === 'PAGO') despesasPagas += t.valorPago ?? t.valor;
        else despesasAbertas += t.valor;
      }
    });

    const saldoRealizado = receitasPagas - despesasPagas;

    return {
      receitasPagas,
      receitasAbertas,
      despesasPagas,
      despesasAbertas,
      saldoRealizado
    };
  }, [transacoes]);

  const filtradas = transacoes.filter(t => {
    const matchTab = 
      tab === 'TODOS' ? true :
      tab === 'RECEITAS' ? t.tipo === 'RECEITA' : t.tipo === 'DESPESA';

    const matchStatus = filtroStatus === 'TODOS' ? true : t.status === filtroStatus;

    const matchBusca = 
      t.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      t.categoria.toLowerCase().includes(busca.toLowerCase()) ||
      (t.fornecedorNome && t.fornecedorNome.toLowerCase().includes(busca.toLowerCase()));

    return matchTab && matchStatus && matchBusca;
  });

  const handleSalvarLançamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || !valor) return;

    const nova: TransacaoFinanceira = {
      id: 'FIN-' + Date.now(),
      tipo,
      categoria,
      descricao: descricao.trim(),
      valor: parseFloat(valor),
      dataEmissao: new Date().toISOString().substring(0, 10),
      dataVencimento,
      status: 'PENDENTE',
      motoristaId: motoristaId || undefined,
      veiculoId: veiculoId || undefined,
      clienteId: clienteId || undefined,
      fornecedorNome: fornecedorNome.trim() || undefined,
      observacoes: observacoes.trim() || undefined
    };

    DB.saveFinanceiro(nova);
    setTransacoes([...DB.getFinanceiro()]);
    setModalNovo(false);
    setDescricao('');
    setValor('');
  };

  const handleAbrirBaixa = (t: TransacaoFinanceira) => {
    setModalBaixa(t);
    setDataPagamentoBaixa(new Date().toISOString().substring(0, 10));
    setValorPagoBaixa(t.valor);
  };

  const handleConfirmarBaixa = () => {
    if (!modalBaixa) return;
    modalBaixa.status = 'PAGO';
    modalBaixa.dataPagamento = dataPagamentoBaixa;
    modalBaixa.valorPago = Number(valorPagoBaixa) || modalBaixa.valor;
    DB.saveFinanceiro(modalBaixa);
    setTransacoes([...DB.getFinanceiro()]);
    setModalBaixa(null);
  };

  const handleConfirmarCancelamento = () => {
    if (!modalCancelar || !motivoCancelamento.trim()) return;
    DB.cancelarFinanceiro(modalCancelar.id, motivoCancelamento.trim());
    setTransacoes([...DB.getFinanceiro()]);
    setModalCancelar(null);
    setMotivoCancelamento('');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Módulo Financeiro, Contas e Fluxo de Caixa</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestão integrada de contas a pagar, fretes a receber, adiantamentos, conciliação e cancelamento auditável.
          </p>
        </div>

        <button
          onClick={() => {
            if (motoristas.length > 0) setMotoristaId(motoristas[0].id);
            if (veiculos.length > 0) setVeiculoId(veiculos[0].id);
            if (clientes.length > 0) setClienteId(clientes[0].id);
            setModalNovo(true);
          }}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Plus size={16} />
          <span>Novo Lançamento Financeiro</span>
        </button>
      </div>

      {/* Resumo de Caixa Real */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Receitas Efetivadas</span>
            <ArrowUpCircle size={20} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-3">
            R$ {resumo.receitasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            A receber em aberto: <strong className="text-slate-700">R$ {resumo.receitasAbertas.toFixed(2)}</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Despesas Realizadas</span>
            <ArrowDownCircle size={20} className="text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-3">
            R$ {resumo.despesasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            A pagar em aberto: <strong className="text-slate-700">R$ {resumo.despesasAbertas.toFixed(2)}</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo em Caixa Realizado</span>
            <DollarSign size={20} className="text-blue-700" />
          </div>
          <div className={`text-2xl font-extrabold mt-3 ${resumo.saldoRealizado >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            R$ {resumo.saldoRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Diferencial realizado de liquidação
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Lançamentos</span>
            <FileText size={20} className="text-slate-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-3">
            {transacoes.length} títulos
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Auditáveis e rastreáveis por regra LGPD
          </div>
        </div>
      </div>

      {/* Tabs e Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setTab('TODOS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === 'TODOS' ? 'bg-[#0A192F] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos os Títulos
          </button>
          <button
            onClick={() => setTab('RECEITAS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === 'RECEITAS' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Contas a Receber (Fretes)
          </button>
          <button
            onClick={() => setTab('DESPESAS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === 'DESPESAS' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Contas a Pagar (Despesas)
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 w-full sm:w-64">
            <Search size={14} className="text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar título, descrição..."
              className="w-full text-xs outline-none bg-transparent"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="TODOS">Todos Status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Pago</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Tabela Financeira */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Tipo</th>
                <th className="px-5 py-3.5">Categoria</th>
                <th className="px-5 py-3.5">Descrição</th>
                <th className="px-5 py-3.5">Vencimento</th>
                <th className="px-5 py-3.5">Valor Original</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtradas.map(t => {
                const mot = motoristas.find(m => m.id === t.motoristaId);
                const veic = veiculos.find(v => v.id === t.veiculoId);
                const cli = clientes.find(c => c.id === t.clienteId);

                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-xs whitespace-nowrap">
                      {t.tipo === 'RECEITA' ? (
                        <span className="flex items-center text-emerald-700">
                          <ArrowUpCircle size={15} className="mr-1.5" /> Receita
                        </span>
                      ) : (
                        <span className="flex items-center text-rose-700">
                          <ArrowDownCircle size={15} className="mr-1.5" /> Despesa
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] font-semibold text-slate-700">
                      {t.categoria.replace('_', ' ')}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-900">
                      <div className="font-bold">{t.descricao}</div>
                      {(mot || veic || cli || t.fornecedorNome) && (
                        <div className="text-[10px] text-slate-400 mt-0.5 flex flex-wrap gap-2">
                          {mot && <span>Condutor: {mot.nomeCompleto}</span>}
                          {veic && <span>Placa: {veic.placa}</span>}
                          {cli && <span>Cliente: {cli.razaoSocial}</span>}
                          {t.fornecedorNome && <span>Fornecedor: {t.fornecedorNome}</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                      {new Date(t.dataVencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 text-xs whitespace-nowrap">
                      R$ {t.valor.toFixed(2)}
                      {t.valorPago && t.valorPago !== t.valor && (
                        <div className="text-[10px] text-emerald-700">Pago: R$ {t.valorPago.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        t.status === 'PAGO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        t.status === 'PENDENTE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        t.status === 'CANCELADO' ? 'bg-slate-200 text-slate-600' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {t.status === 'PENDENTE' && (
                          <button
                            onClick={() => handleAbrirBaixa(t)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Dar Baixa
                          </button>
                        )}
                        {t.status !== 'CANCELADO' && (
                          <button
                            onClick={() => {
                              setModalCancelar(t);
                              setMotivoCancelamento('');
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Cancelar / Estornar com auditoria"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">
                    Nenhum lançamento financeiro localizado nos filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Baixa de Título */}
      {modalBaixa && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">Confirmar Baixa e Liquidação</h3>
            <p className="text-xs text-slate-500 mb-4">
              Título: <strong>{modalBaixa.descricao}</strong>
            </p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Data Efetiva do Pagamento / Recebimento</label>
                <input
                  type="date"
                  value={dataPagamentoBaixa}
                  onChange={e => setDataPagamentoBaixa(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Valor Efetivamente Liquidado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={valorPagoBaixa}
                  onChange={e => setValorPagoBaixa(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalBaixa(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarBaixa}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirmar Liquidação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancelamento com Auditoria Obrigatória (Requisito 16) */}
      {modalCancelar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-2 text-rose-600 mb-2">
              <ShieldAlert size={20} />
              <h3 className="text-base font-bold text-slate-900">Cancelamento / Estorno Auditado</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Por regra de qualidade contábil, registros financeiros não podem ser excluídos silenciosamente. É obrigatório registrar a justificativa na trilha de auditoria.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Motivo do Cancelamento *</label>
              <textarea
                rows={3}
                required
                value={motivoCancelamento}
                onChange={e => setMotivoCancelamento(e.target.value)}
                placeholder="Ex: Lançamento duplicado por engano ou nota cancelada pelo emissor..."
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalCancelar(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!motivoCancelamento.trim()}
                onClick={handleConfirmarCancelamento}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Efetuar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Lançamento Financeiro */}
      {modalNovo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">Novo Lançamento Financeiro</h3>
            <form onSubmit={handleSalvarLançamento} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Título</label>
                  <select
                    value={tipo}
                    onChange={e => setTipo(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="DESPESA">Contas a Pagar (Despesa)</option>
                    <option value="RECEITA">Contas a Receber (Receita)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria Contábil</label>
                  <select
                    value={categoria}
                    onChange={e => setCategoria(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição do Lançamento *</label>
                <input
                  type="text"
                  required
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="Ex: Abastecimento Diesel Posto Rodovia - 180 Litros"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={valor}
                    onChange={e => setValor(e.target.value)}
                    placeholder="0,00"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={dataVencimento}
                    onChange={e => setDataVencimento(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vincular Motorista (Opcional)</label>
                  <select
                    value={motoristaId}
                    onChange={e => setMotoristaId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="">Nenhum motorista</option>
                    {motoristas.map(m => (
                      <option key={m.id} value={m.id}>{m.nomeCompleto}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vincular Veículo (Opcional)</label>
                  <select
                    value={veiculoId}
                    onChange={e => setVeiculoId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="">Nenhum veículo</option>
                    {veiculos.map(v => (
                      <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fornecedor ou Posto</label>
                <input
                  type="text"
                  value={fornecedorNome}
                  onChange={e => setFornecedorNome(e.target.value)}
                  placeholder="Nome do posto, oficina ou fornecedor..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovo(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
