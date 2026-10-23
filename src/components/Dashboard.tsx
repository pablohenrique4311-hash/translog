import React, { useMemo } from 'react';
import { DB } from '../services/db';
import { 
  TrendingUp, 
  Truck, 
  Users, 
  Calendar, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ChevronRight,
  FileText
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const motoristas = DB.getMotoristas();
  const veiculos = DB.getVeiculos();
  const viagens = DB.getViagens();
  const transacoes = DB.getFinanceiro();
  const cfg = DB.getConfig();

  // Cálculos 100% reais sem números estáticos
  const metrics = useMemo(() => {
    const hojeStr = new Date().toISOString().substring(0, 10);
    const mesAtualPrefix = new Date().toISOString().substring(0, 7);

    // Viagens
    const viagensHoje = viagens.filter(v => v.dataSaida === hojeStr && v.status !== 'CANCELADA');
    const viagensMes = viagens.filter(v => v.dataSaida.startsWith(mesAtualPrefix) && v.status !== 'CANCELADA');
    const viagensConcluidas = viagens.filter(v => (v.status === 'CONCLUIDA' || v.status === 'PAGA') && v.dataSaida.startsWith(mesAtualPrefix));
    const viagensEmAndamento = viagens.filter(v => v.status === 'EM_ANDAMENTO');

    // Motoristas e Frota
    const motoristasAtivos = motoristas.filter(m => m.ativo).length;
    const veiculosAtivos = veiculos.filter(v => v.ativo).length;

    // Alertas de Documentos/Manutenção
    const dataLimiteAlerta = new Date(Date.now() + 45 * 86400000).toISOString().substring(0, 10);
    const cnhsVencendo = motoristas.filter(m => m.validadeCnh && m.validadeCnh <= dataLimiteAlerta);
    const crlvVencendo = veiculos.filter(v => v.vencimentoCrlv && v.vencimentoCrlv <= dataLimiteAlerta);

    // Financeiro real
    let totalReceitasMes = 0;
    let totalDespesasMes = 0;
    let contasReceberAbertas = 0;
    let contasPagarAbertas = 0;

    transacoes.forEach(t => {
      if (t.status === 'CANCELADO') return;

      if (t.tipo === 'RECEITA') {
        if (t.dataEmissao.startsWith(mesAtualPrefix)) {
          totalReceitasMes += t.status === 'PAGO' ? (t.valorPago ?? t.valor) : t.valor;
        }
        if (t.status === 'PENDENTE' || t.status === 'VENCIDO') {
          contasReceberAbertas += t.valor;
        }
      } else if (t.tipo === 'DESPESA') {
        if (t.dataEmissao.startsWith(mesAtualPrefix)) {
          totalDespesasMes += t.status === 'PAGO' ? (t.valorPago ?? t.valor) : t.valor;
        }
        if (t.status === 'PENDENTE' || t.status === 'VENCIDO') {
          contasPagarAbertas += t.valor;
        }
      }
    });

    const resultadoOperacional = totalReceitasMes - totalDespesasMes;

    // Distribuição de despesas por categoria
    const despesasPorCat: { [key: string]: number } = {};
    transacoes.filter(t => t.tipo === 'DESPESA' && t.status !== 'CANCELADO').forEach(t => {
      despesasPorCat[t.categoria] = (despesasPorCat[t.categoria] || 0) + t.valor;
    });

    return {
      viagensHoje: viagensHoje.length,
      viagensMes: viagensMes.length,
      viagensConcluidas: viagensConcluidas.length,
      viagensEmAndamento: viagensEmAndamento.length,
      motoristasAtivos,
      veiculosAtivos,
      alertasDocs: cnhsVencendo.length + crlvVencendo.length,
      cnhsVencendo,
      crlvVencendo,
      totalReceitasMes,
      totalDespesasMes,
      contasReceberAbertas,
      contasPagarAbertas,
      resultadoOperacional,
      despesasPorCat
    };
  }, [motoristas, veiculos, viagens, transacoes]);

  const maxFinanceiro = Math.max(metrics.totalReceitasMes, metrics.totalDespesasMes, 1);
  const percentReceita = Math.min(100, Math.round((metrics.totalReceitasMes / maxFinanceiro) * 100));
  const percentDespesa = Math.min(100, Math.round((metrics.totalDespesasMes / maxFinanceiro) * 100));

  return (
    <div className="space-y-6">
      {/* Banner de Boas-vindas e Status Operacional */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Operação em Tempo Real
            </span>
            <span className="text-xs text-slate-400">• Base Jundiaí & Filiais</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0A192F] mt-2">Painel de Controle Operacional e Financeiro</h1>
          <p className="text-sm text-slate-500 mt-1">
            Consolidado em tempo real com base nos romaneios, viagens, despesas e acertos de motoristas.
          </p>
        </div>

        <div className="mt-4 lg:mt-0 flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('ROMANEIOS')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
          >
            <FileText size={16} />
            <span>Importar Romaneio PDF</span>
          </button>
          <button
            onClick={() => onNavigate('ACERTOS')}
            className="px-4 py-2.5 bg-[#0A192F] hover:bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
          >
            <DollarSign size={16} />
            <span>Novo Acerto de Frete</span>
          </button>
        </div>
      </div>

      {/* Alertas Ativos se houver CNH ou Documento próximo do vencimento */}
      {metrics.alertasDocs > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Atenção Operacional: Documentos Próximos do Vencimento</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {metrics.cnhsVencendo.length > 0 && `${metrics.cnhsVencendo.length} CNH(s) de motoristas a vencer. `}
                {metrics.crlvVencendo.length > 0 && `${metrics.crlvVencendo.length} CRLV / Seguro de veículos com renovação pendente.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate(metrics.cnhsVencendo.length > 0 ? 'MOTORISTAS' : 'FROTA')}
            className="text-xs font-bold text-amber-900 bg-amber-200/60 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 self-start md:self-auto cursor-pointer"
          >
            <span>Verificar Documentos</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Grid de KPIs Operacionais e Financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Viagens */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Viagens no Mês</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <Truck size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-slate-900">{metrics.viagensMes}</div>
            <div className="text-xs font-medium text-slate-500">
              Hoje: <span className="text-blue-700 font-bold">{metrics.viagensHoje}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Concluídas: <strong className="text-slate-700">{metrics.viagensConcluidas}</strong></span>
            <span>Em trânsito: <strong className="text-emerald-600">{metrics.viagensEmAndamento}</strong></span>
          </div>
        </div>

        {/* KPI 2: Motoristas e Frota */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Motoristas Ativos</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-slate-900">{metrics.motoristasAtivos}</div>
            <div className="text-xs font-medium text-slate-500">
              Frota: <span className="text-emerald-700 font-bold">{metrics.veiculosAtivos} veículos</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tarifa padrão:</span>
            <strong className="text-emerald-600 font-bold">R$ {cfg.valorFretePadrao.toFixed(2)}/viagem</strong>
          </div>
        </div>

        {/* KPI 3: Contas a Receber vs Pagar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Contas a Receber</span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900">
              R$ {metrics.contasReceberAbertas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>A pagar em aberto:</span>
            <span className="font-semibold text-rose-600">
              R$ {metrics.contasPagarAbertas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* KPI 4: Resultado Operacional */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Resultado Operacional (Mês)</span>
            <div className={`p-2.5 rounded-xl ${metrics.resultadoOperacional >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-2xl font-extrabold ${metrics.resultadoOperacional >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              R$ {metrics.resultadoOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Receitas: R$ {metrics.totalReceitasMes.toFixed(0)}</span>
            <span>Despesas: R$ {metrics.totalDespesasMes.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Gráficos e Comparativos Reais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Comparativo Receitas x Despesas no Mês */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Balanço Financeiro Mensal (Real)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Valores apurados através dos lançamentos e fretes faturados</p>
            </div>
            <span className="text-xs font-semibold text-slate-400 mt-2 sm:mt-0">Mês Vigente</span>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <div className="flex justify-between items-center text-sm font-semibold mb-2">
                <span className="flex items-center text-emerald-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>
                  Fretes e Receitas Efetivadas
                </span>
                <span className="text-slate-900 font-bold">
                  R$ {metrics.totalReceitasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${percentReceita}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-sm font-semibold mb-2">
                <span className="flex items-center text-rose-700">
                  <span className="w-3 h-3 rounded-full bg-rose-500 mr-2"></span>
                  Custos e Despesas Totais
                </span>
                <span className="text-slate-900 font-bold">
                  R$ {metrics.totalDespesasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                  style={{ width: `${percentDespesa}%` }}
                />
              </div>
            </div>

            {/* Resumo de Margem Operacional */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 font-medium">Margem Operacional Líquida</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {metrics.totalReceitasMes > 0 
                    ? `${((metrics.resultadoOperacional / metrics.totalReceitasMes) * 100).toFixed(1)}%` 
                    : '0.0%'}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Ticket Médio por Frete</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  R$ {metrics.viagensMes > 0 
                    ? (metrics.totalReceitasMes / metrics.viagensMes).toFixed(2) 
                    : cfg.valorFretePadrao.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Saldo em Caixa Efetivo</span>
                <div className="text-lg font-bold text-emerald-600 mt-0.5">
                  R$ {metrics.resultadoOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Composição de Despesas Operacionais */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Custos por Categoria</h2>
            <p className="text-xs text-slate-500 mt-0.5">Distribuição das despesas operacionais</p>

            <div className="mt-5 space-y-3.5">
              {Object.entries(metrics.despesasPorCat).length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Nenhuma despesa registrada ainda no sistema.
                </div>
              ) : (
                Object.entries(metrics.despesasPorCat).map(([cat, val]) => {
                  const percent = metrics.totalDespesasMes > 0 ? (val / metrics.totalDespesasMes) * 100 : 0;
                  const catLabel = cat.replace('_', ' ');
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700 capitalize">{catLabel.toLowerCase()}</span>
                        <span className="font-bold text-slate-900">R$ {val.toFixed(2)} ({percent.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full" 
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('FINANCEIRO')}
            className="mt-6 w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span>Ver Extrato Financeiro Completo</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Viagens Recentes na Operação */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Últimas Viagens e Fretes Registrados</h2>
            <p className="text-xs text-slate-500">Monitoramento de status e liberação de fretes</p>
          </div>
          <button
            onClick={() => onNavigate('VIAGENS')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
          >
            <span>Gerenciar todas as viagens</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Código / Romaneio</th>
                <th className="px-5 py-3.5">Data Saída</th>
                <th className="px-5 py-3.5">Motorista</th>
                <th className="px-5 py-3.5">Veículo</th>
                <th className="px-5 py-3.5">Trajeto</th>
                <th className="px-5 py-3.5">Valor Frete</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {viagens.slice(0, 6).map(v => (
                <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">{v.codigoViagem}</div>
                    <div className="text-xs font-mono text-slate-400">{v.numeroRomaneio}</div>
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    {new Date(v.dataSaida).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {v.motoristaNome}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 bg-slate-100 font-mono font-bold text-xs text-slate-800 rounded">
                      {v.veiculoPlaca}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                    {v.origem} → {v.destino}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">
                    R$ {v.valorFreteBruto.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      v.status === 'CONCLUIDA' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      v.status === 'EM_ANDAMENTO' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      v.status === 'PAGA' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      v.status === 'PLANEJADA' ? 'bg-slate-100 text-slate-700' :
                      v.status === 'EM_CONFERENCIA' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-rose-50 text-rose-700'
                    }`}>
                      {v.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {viagens.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">
                    Nenhuma viagem registrada ainda. Importe romaneios ou cadastre viagens no menu Viagens.
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
