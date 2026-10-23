import React, { useState, useMemo } from 'react';
import { DB } from '../services/db';
import { PdfGenerator } from '../services/pdfGenerator';
import { AcertoMotorista, Viagem, TransacaoFinanceira } from '../types';
import { 
  Calculator, 
  FileText, 
  CheckCircle, 
  Download, 
  ShieldCheck, 
  AlertCircle, 
  DollarSign, 
  Clock, 
  Check, 
  Printer,
  ChevronRight
} from 'lucide-react';

export const AcertoMotoristas: React.FC = () => {
  const motoristas = DB.getMotoristas();
  const viagens = DB.getViagens();
  const transacoes = DB.getFinanceiro();
  const acertos = DB.getAcertos();
  const cfg = DB.getConfig();

  const [selectedMotoristaId, setSelectedMotoristaId] = useState<string>(motoristas[0]?.id || '');
  const [dataInicio, setDataInicio] = useState(new Date(Date.now() - 30 * 86400000).toISOString().substring(0, 10));
  const [dataFim, setDataFim] = useState(new Date().toISOString().substring(0, 10));
  const [despesasReembolso, setDespesasReembolso] = useState<number>(0);
  const [outrosDescontos, setOutrosDescontos] = useState<number>(0);
  const [motivoDesconto, setMotivoDesconto] = useState<string>('');
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  const motoristaAtual = motoristas.find(m => m.id === selectedMotoristaId);

  // 1. Viagens Concluídas no período que AINDA NÃO FORAM LIQUIDADAS (sem acertoId e status CONCLUIDA)
  const viagensElegiveis = useMemo(() => {
    return viagens.filter(v => 
      v.motoristaId === selectedMotoristaId &&
      v.status === 'CONCLUIDA' &&
      v.dataSaida >= dataInicio &&
      v.dataSaida <= dataFim &&
      !v.acertoId
    );
  }, [viagens, selectedMotoristaId, dataInicio, dataFim]);

  // 2. Adiantamentos e Vales pagos ao motorista no período que AINDA NÃO FORAM DEDUZIDOS
  const adiantamentosVales = useMemo(() => {
    return transacoes.filter(t => 
      t.motoristaId === selectedMotoristaId &&
      t.categoria === 'SALARIOS_ADIANTAMENTOS' &&
      t.tipo === 'DESPESA' &&
      t.status === 'PAGO' &&
      t.dataEmissao >= dataInicio &&
      t.dataEmissao <= dataFim &&
      !t.observacoes?.includes('DEDUZIDO_EM_ACERTO')
    );
  }, [transacoes, selectedMotoristaId, dataInicio, dataFim]);

  // Cálculos transparentes e auditáveis (sem simulações arbitrárias)
  const totalFretesBrutos = viagensElegiveis.reduce((acc, cur) => acc + cur.valorFreteBruto, 0);
  const totalAdiantamentos = adiantamentosVales.reduce((acc, cur) => acc + (cur.valorPago ?? cur.valor), 0);
  const totalReembolsos = Number(despesasReembolso) || 0;
  const totalDescontosAdicionais = Number(outrosDescontos) || 0;

  const saldoLiquidoPagar = totalFretesBrutos + totalReembolsos - totalAdiantamentos - totalDescontosAdicionais;

  const handleEfetivarAcerto = () => {
    setErroMsg(null);
    setSucessoMsg(null);

    if (!motoristaAtual) {
      setErroMsg('Selecione um motorista válido.');
      return;
    }

    if (viagensElegiveis.length === 0) {
      setErroMsg('Não existem viagens concluídas pendentes de liquidação para este motorista no período selecionado.');
      return;
    }

    const codigoAcerto = 'ACT-' + Math.floor(1000 + Math.random() * 9000);
    const acertoId = 'ACR-' + Date.now();

    const novoAcerto: AcertoMotorista = {
      id: acertoId,
      codigoAcerto,
      motoristaId: motoristaAtual.id,
      motoristaNome: motoristaAtual.nomeCompleto,
      periodoInicio: dataInicio,
      periodoFim: dataFim,
      totalViagens: viagensElegiveis.length,
      valorTotalFretes: totalFretesBrutos,
      totalAdiantamentos,
      totalDespesasReembolsaveis: totalReembolsos,
      totalDescontos: totalDescontosAdicionais,
      saldoLiquidoPagar,
      status: 'PAGO',
      dataAprovacao: new Date().toISOString(),
      dataPagamento: new Date().toISOString(),
      viagensIds: viagensElegiveis.map(v => v.id)
    };

    // 1. Atualizar cada viagem elegível para PAGA com vínculo ao acerto (evita duplicidade de pagamento)
    viagensElegiveis.forEach(v => {
      v.status = 'PAGA';
      v.acertoId = acertoId;
      DB.saveViagem(v);
    });

    // 2. Marcar adiantamentos como deduzidos neste acerto para nunca descontar duas vezes (Requisito 7)
    adiantamentosVales.forEach(a => {
      a.observacoes = (a.observacoes ? a.observacoes + ' | ' : '') + `DEDUZIDO_EM_ACERTO_${codigoAcerto}`;
      DB.saveFinanceiro(a);
    });

    // 3. Registrar o lançamento de saída correspondente no Financeiro (Contas a Pagar / Pago)
    if (saldoLiquidoPagar > 0) {
      DB.saveFinanceiro({
        id: 'FIN-' + Date.now(),
        tipo: 'DESPESA',
        categoria: 'SALARIOS_ADIANTAMENTOS',
        descricao: `Liquidação Acerto ${codigoAcerto} - Motorista ${motoristaAtual.nomeCompleto}`,
        valor: saldoLiquidoPagar,
        dataEmissao: new Date().toISOString().substring(0, 10),
        dataVencimento: new Date().toISOString().substring(0, 10),
        dataPagamento: new Date().toISOString().substring(0, 10),
        valorPago: saldoLiquidoPagar,
        status: 'PAGO',
        motoristaId: motoristaAtual.id,
        observacoes: `Chave PIX: ${motoristaAtual.chavePix || 'Não informada'}`
      });
    }

    // 4. Gravar Acerto no Banco
    DB.saveAcerto(novoAcerto);

    // 5. Gerar e baixar demonstrativo em PDF
    PdfGenerator.gerarDemonstrativoAcerto(novoAcerto, viagensElegiveis, motoristaAtual, cfg);

    setSucessoMsg(`Acerto ${codigoAcerto} aprovado e liquidado! Demonstrativo oficial em PDF emitido.`);
    setDespesasReembolso(0);
    setOutrosDescontos(0);
  };

  const handleReimprimirAcerto = (ac: AcertoMotorista) => {
    const mot = motoristas.find(m => m.id === ac.motoristaId);
    if (!mot) return;
    const viagensDoAcerto = viagens.filter(v => ac.viagensIds.includes(v.id));
    PdfGenerator.gerarDemonstrativoAcerto(ac, viagensDoAcerto, mot, cfg);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Módulo de Acertos de Motoristas e Fechamentos</h2>
          <p className="text-sm text-slate-500 mt-1">
            Apuração exata de viagens, dedução sem duplicidade de vales/adiantamentos e emissão de demonstrativos em PDF.
          </p>
        </div>

        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>Memória de Cálculo Auditável</span>
        </span>
      </div>

      {erroMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
          <span>{erroMsg}</span>
        </div>
      )}

      {sucessoMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{sucessoMsg}</span>
        </div>
      )}

      {/* Filtros e Seleção do Motorista para Apuração */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-3">Parâmetros de Apuração do Fechamento</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Selecione o Motorista *</label>
            <select
              value={selectedMotoristaId}
              onChange={e => setSelectedMotoristaId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
            >
              {motoristas.map(m => (
                <option key={m.id} value={m.id}>{m.nomeCompleto} - CPF: {m.cpf} ({m.tipoVinculo})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Período - Data Início *</label>
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Período - Data Fim *</label>
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Painel de Cálculo e Totalização */}
      {motoristaAtual && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Memória de Cálculo de Fechamento • {motoristaAtual.nomeCompleto}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Chave PIX: <strong className="text-slate-700 font-mono">{motoristaAtual.chavePix || 'Não cadastrada'}</strong> • {motoristaAtual.banco} (Ag: {motoristaAtual.agencia} / CC: {motoristaAtual.conta})
              </p>
            </div>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
              {viagensElegiveis.length} viagem(ns) apurada(s)
            </span>
          </div>

          {/* Cards do Balanço */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 block">
                (+) Fretes Brutos Realizados
              </span>
              <div className="text-2xl font-extrabold text-blue-950 mt-1">
                R$ {totalFretesBrutos.toFixed(2)}
              </div>
              <span className="text-[11px] text-blue-700 mt-1 block font-medium">
                {viagensElegiveis.length} frete(s) elegível(is)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
                (-) Adiantamentos & Vales
              </span>
              <div className="text-2xl font-extrabold text-amber-950 mt-1">
                - R$ {totalAdiantamentos.toFixed(2)}
              </div>
              <span className="text-[11px] text-amber-700 mt-1 block font-medium">
                {adiantamentosVales.length} adiantamento(s) pago(s)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                (±) Ajustes & Reembolsos
              </span>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Reembolsos (+):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={despesasReembolso}
                    onChange={e => setDespesasReembolso(parseFloat(e.target.value) || 0)}
                    className="w-20 text-right bg-white border rounded px-1.5 py-0.5 font-bold"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Descontos (-):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={outrosDescontos}
                    onChange={e => setOutrosDescontos(parseFloat(e.target.value) || 0)}
                    className="w-20 text-right bg-white border rounded px-1.5 py-0.5 font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block">
                (=) SALDO LÍQUIDO A PAGAR
              </span>
              <div className="text-2xl font-extrabold text-emerald-800 mt-1">
                R$ {saldoLiquidoPagar.toFixed(2)}
              </div>
              <span className="text-[11px] text-emerald-700 mt-1 block font-medium">
                Quitação imediata via PIX / Banco
              </span>
            </div>
          </div>

          {/* Tabela de Viagens Concluídas Inclusas no Acerto */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between">
              <span>Viagens Concluídas Pendentes de Acerto ({viagensElegiveis.length})</span>
              <span>Subtotal: R$ {totalFretesBrutos.toFixed(2)}</span>
            </div>

            <div className="overflow-x-auto max-h-60">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100/70 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-2.5">Código</th>
                    <th className="p-2.5">Romaneio</th>
                    <th className="p-2.5">Data Saída</th>
                    <th className="p-2.5">Placa</th>
                    <th className="p-2.5">Trajeto</th>
                    <th className="p-2.5 text-right">Frete Bruto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viagensElegiveis.map(v => (
                    <tr key={v.id}>
                      <td className="p-2.5 font-bold text-slate-800 font-mono">{v.codigoViagem}</td>
                      <td className="p-2.5 font-mono">{v.numeroRomaneio}</td>
                      <td className="p-2.5">{new Date(v.dataSaida).toLocaleDateString('pt-BR')}</td>
                      <td className="p-2.5 font-mono font-bold">{v.veiculoPlaca}</td>
                      <td className="p-2.5">{v.origem} → {v.destino}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">R$ {v.valorFreteBruto.toFixed(2)}</td>
                    </tr>
                  ))}
                  {viagensElegiveis.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        Nenhuma viagem concluída pendente de acerto para este motorista no período informado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botão de Finalização com Confirmação e Impressão */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              A liquidação atualizará o status das viagens para PAGA e registrará a saída financeira.
            </span>

            <button
              disabled={viagensElegiveis.length === 0}
              onClick={handleEfetivarAcerto}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <ShieldCheck size={18} />
              <span>Aprovar, Liquidar e Gerar PDF do Acerto</span>
            </button>
          </div>
        </div>
      )}

      {/* Histórico dos Acertos Fechados */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Histórico de Acertos Concluídos</h3>
            <p className="text-xs text-slate-500 mt-0.5">Demonstrativos liquidados e disponíveis para reimpressão</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {acertos.length} fechamentos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Cód. Acerto</th>
                <th className="px-5 py-3">Motorista</th>
                <th className="px-5 py-3">Período</th>
                <th className="px-5 py-3">Viagens</th>
                <th className="px-5 py-3">Fretes Brutos</th>
                <th className="px-5 py-3">(-) Vales</th>
                <th className="px-5 py-3">(=) Saldo Pago</th>
                <th className="px-5 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {acertos.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3 font-bold font-mono text-slate-900">{a.codigoAcerto}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{a.motoristaNome}</td>
                  <td className="px-5 py-3">
                    {new Date(a.periodoInicio).toLocaleDateString('pt-BR')} até {new Date(a.periodoFim).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3 font-bold">{a.totalViagens}</td>
                  <td className="px-5 py-3 font-bold text-slate-900">R$ {a.valorTotalFretes.toFixed(2)}</td>
                  <td className="px-5 py-3 text-rose-600 font-semibold">- R$ {a.totalAdiantamentos.toFixed(2)}</td>
                  <td className="px-5 py-3 font-bold text-emerald-700 text-sm">R$ {a.saldoLiquidoPagar.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleReimprimirAcerto(a)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center space-x-1 ml-auto cursor-pointer"
                      title="Reimprimir Demonstrativo em PDF"
                    >
                      <Printer size={13} />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
              {acertos.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    Nenhum acerto concluído ainda.
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
