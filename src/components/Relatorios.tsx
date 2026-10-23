import React, { useState, useMemo } from 'react';
import { DB } from '../services/db';
import { 
  BarChart3, 
  Download, 
  Filter, 
  Printer, 
  Calendar, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const Relatorios: React.FC = () => {
  const motoristas = DB.getMotoristas();
  const veiculos = DB.getVeiculos();
  const clientes = DB.getClientes();
  const viagens = DB.getViagens();
  const transacoes = DB.getFinanceiro();
  const romaneios = DB.getRomaneios();
  const cfg = DB.getConfig();

  const [dataInicio, setDataInicio] = useState(new Date(Date.now() - 30 * 86400000).toISOString().substring(0, 10));
  const [dataFim, setDataFim] = useState(new Date().toISOString().substring(0, 10));
  const [motoristaFiltro, setMotoristaFiltro] = useState('TODOS');
  const [veiculoFiltro, setVeiculoFiltro] = useState('TODOS');
  const [clienteFiltro, setClienteFiltro] = useState('TODOS');
  const [tipoRelatorio, setTipoRelatorio] = useState<'OPERACIONAL' | 'FINANCEIRO' | 'MOTORISTAS' | 'VEICULOS'>('OPERACIONAL');

  // Filtragem
  const viagensFiltradas = useMemo(() => {
    return viagens.filter(v => {
      const matchData = v.dataSaida >= dataInicio && v.dataSaida <= dataFim;
      const matchMot = motoristaFiltro === 'TODOS' || v.motoristaId === motoristaFiltro;
      const matchVeic = veiculoFiltro === 'TODOS' || v.veiculoId === veiculoFiltro;
      const matchCli = clienteFiltro === 'TODOS' || v.clienteId === clienteFiltro;
      return matchData && matchMot && matchVeic && matchCli;
    });
  }, [viagens, dataInicio, dataFim, motoristaFiltro, veiculoFiltro, clienteFiltro]);

  const transacoesFiltradas = useMemo(() => {
    return transacoes.filter(t => {
      const matchData = t.dataEmissao >= dataInicio && t.dataEmissao <= dataFim;
      const matchMot = motoristaFiltro === 'TODOS' || t.motoristaId === motoristaFiltro;
      const matchVeic = veiculoFiltro === 'TODOS' || t.veiculoId === veiculoFiltro;
      return matchData && matchMot && matchVeic && t.status !== 'CANCELADO';
    });
  }, [transacoes, dataInicio, dataFim, motoristaFiltro, veiculoFiltro]);

  // Totais consolidados
  const totalFretesBrutos = viagensFiltradas.reduce((acc, cur) => acc + cur.valorFreteBruto, 0);
  const totalReceitas = transacoesFiltradas.filter(t => t.tipo === 'RECEITA').reduce((acc, cur) => acc + cur.valor, 0);
  const totalDespesas = transacoesFiltradas.filter(t => t.tipo === 'DESPESA').reduce((acc, cur) => acc + cur.valor, 0);
  const saldoOperacional = totalReceitas - totalDespesas;

  const handleExportarCsv = () => {
    let headers: string[] = [];
    let rows: any[] = [];

    if (tipoRelatorio === 'OPERACIONAL') {
      headers = ['CodigoViagem', 'Romaneio', 'Data', 'Motorista', 'Placa', 'Cliente', 'Origem', 'Destino', 'ValorFrete', 'Status'];
      rows = viagensFiltradas.map(v => [
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
    } else {
      headers = ['ID', 'Tipo', 'Categoria', 'Descricao', 'DataEmissao', 'DataVencimento', 'Valor', 'Status'];
      rows = transacoesFiltradas.map(t => [
        t.id,
        t.tipo,
        t.categoria,
        `"${t.descricao}"`,
        t.dataEmissao,
        t.dataVencimento,
        t.valor.toFixed(2),
        t.status
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_translog_${tipoRelatorio.toLowerCase()}_${dataInicio}_a_${dataFim}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGerarPdf = () => {
    const doc = new jsPDF();

    // Cabeçalho
    doc.setFillColor(10, 25, 47);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 30, 210, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(cfg.nomeFantasia.toUpperCase(), 14, 14);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`RELATÓRIO GERENCIAL • ${tipoRelatorio} • Período: ${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}`, 14, 22);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`RESUMO GERAL CONSOLIDADO:`, 14, 40);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Viagens Apuradas: ${viagensFiltradas.length} | Faturamento Bruto de Fretes: R$ ${totalFretesBrutos.toFixed(2)}`, 14, 46);
    doc.text(`Receitas Financeiras: R$ ${totalReceitas.toFixed(2)} | Despesas Operacionais: R$ ${totalDespesas.toFixed(2)} | Saldo Operacional: R$ ${saldoOperacional.toFixed(2)}`, 14, 52);

    const tableData = viagensFiltradas.map(v => [
      v.codigoViagem,
      v.numeroRomaneio,
      new Date(v.dataSaida).toLocaleDateString('pt-BR'),
      v.motoristaNome,
      v.veiculoPlaca,
      `R$ ${v.valorFreteBruto.toFixed(2)}`,
      v.status
    ]);

    autoTable(doc, {
      startY: 58,
      head: [['Viagem', 'Romaneio', 'Data', 'Motorista', 'Placa', 'Frete Bruto', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5 }
    });

    doc.save(`Relatorio_${tipoRelatorio}_${dataInicio}_a_${dataFim}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Central de Relatórios Analíticos</h2>
          <p className="text-sm text-slate-500 mt-1">
            Geração de relatórios consolidados por período, motorista, cliente, frota e exportação em CSV e PDF.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportarCsv}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download size={15} />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handleGerarPdf}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Printer size={15} />
            <span>Emitir Relatório em PDF</span>
          </button>
        </div>
      </div>

      {/* Painel de Filtros Avançados */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Tipo de Relatório</label>
            <select
              value={tipoRelatorio}
              onChange={e => setTipoRelatorio(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
            >
              <option value="OPERACIONAL">Operacional de Viagens</option>
              <option value="FINANCEIRO">Fluxo de Caixa e Títulos</option>
              <option value="MOTORISTAS">Produtividade de Motoristas</option>
              <option value="VEICULOS">Rentabilidade por Veículo</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Motorista</label>
            <select
              value={motoristaFiltro}
              onChange={e => setMotoristaFiltro(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
            >
              <option value="TODOS">Todos os Motoristas</option>
              {motoristas.map(m => (
                <option key={m.id} value={m.id}>{m.nomeCompleto}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Veículo / Placa</label>
            <select
              value={veiculoFiltro}
              onChange={e => setVeiculoFiltro(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
            >
              <option value="TODOS">Todos os Veículos</option>
              {veiculos.map(v => (
                <option key={v.id} value={v.id}>{v.placa}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumo Rápido dos Filtros Ativos */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 block font-medium">Viagens no Filtro</span>
            <strong className="text-slate-900 text-sm">{viagensFiltradas.length}</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 block font-medium">Faturamento Fretes Brutos</span>
            <strong className="text-slate-900 text-sm">R$ {totalFretesBrutos.toFixed(2)}</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 block font-medium">Despesas no Período</span>
            <strong className="text-rose-700 text-sm">R$ {totalDespesas.toFixed(2)}</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 block font-medium">Resultado Operacional</span>
            <strong className={`text-sm font-bold ${saldoOperacional >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              R$ {saldoOperacional.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      {/* Tabela de Resultados do Relatório */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-800">Registros Analíticos Apurados ({viagensFiltradas.length})</span>
          <span className="text-slate-500 font-mono">Período: {new Date(dataInicio).toLocaleDateString('pt-BR')} até {new Date(dataFim).toLocaleDateString('pt-BR')}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-[11px] text-slate-500 font-bold uppercase">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Romaneio</th>
                <th className="p-3">Data Saída</th>
                <th className="p-3">Motorista</th>
                <th className="p-3">Placa</th>
                <th className="p-3">Cliente</th>
                <th className="p-3 text-right">Frete Bruto</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {viagensFiltradas.map(v => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900 font-mono">{v.codigoViagem}</td>
                  <td className="p-3 font-mono">{v.numeroRomaneio}</td>
                  <td className="p-3">{new Date(v.dataSaida).toLocaleDateString('pt-BR')}</td>
                  <td className="p-3 font-medium text-slate-800">{v.motoristaNome}</td>
                  <td className="p-3 font-mono font-bold">{v.veiculoPlaca}</td>
                  <td className="p-3 truncate max-w-xs">{v.clienteNome}</td>
                  <td className="p-3 text-right font-bold text-slate-900">R$ {v.valorFreteBruto.toFixed(2)}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
              {viagensFiltradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Nenhum registro encontrado para os filtros selecionados.
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
