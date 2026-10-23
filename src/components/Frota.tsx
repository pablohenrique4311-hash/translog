import React, { useState } from 'react';
import { DB } from '../services/db';
import { Veiculo, TipoVeiculo, TipoProprietario } from '../types';
import { 
  Truck, 
  Search, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  Wrench, 
  ShieldAlert, 
  Calendar, 
  Fuel, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  FileText
} from 'lucide-react';

export const Frota: React.FC = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>(DB.getVeiculos());
  const motoristas = DB.getMotoristas();
  const viagens = DB.getViagens();
  const financeiro = DB.getFinanceiro();

  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [modalNovo, setModalNovo] = useState(false);
  const [veiculoDetalhe, setVeiculoDetalhe] = useState<Veiculo | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Form State
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [marca, setMarca] = useState('');
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [tipo, setTipo] = useState<TipoVeiculo>('CARRETA');
  const [proprietario, setProprietario] = useState<TipoProprietario>('PROPRIO');
  const [motoristaPadraoId, setMotoristaPadraoId] = useState<string>('');
  const [kmAtual, setKmAtual] = useState<number>(0);
  const [vencimentoSeguro, setVencimentoSeguro] = useState('');
  const [vencimentoCrlv, setVencimentoCrlv] = useState('');
  const [proximaManutencaoKm, setProximaManutencaoKm] = useState<number>(0);
  const [observacoes, setObservacoes] = useState('');

  const filtrados = veiculos.filter(v => {
    const matchBusca = 
      v.placa.toLowerCase().includes(busca.toLowerCase()) ||
      v.modelo.toLowerCase().includes(busca.toLowerCase()) ||
      v.marca.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = filtroTipo === 'TODOS' || v.tipo === filtroTipo;
    return matchBusca && matchTipo;
  });

  const getAlertaDocumento = (dataVenc: string) => {
    if (!dataVenc) return null;
    const diffDias = Math.ceil((new Date(dataVenc).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diffDias < 0) return { tipo: 'ERRO', texto: `Vencido há ${Math.abs(diffDias)} dias` };
    if (diffDias <= 45) return { tipo: 'AVISO', texto: `Vence em ${diffDias} dias` };
    return null;
  };

  const getAlertaKmRevisao = (v: Veiculo) => {
    if (!v.proximaManutencaoKm) return null;
    const diffKm = v.proximaManutencaoKm - v.quilometragemAtual;
    if (diffKm <= 0) return { tipo: 'ERRO', texto: `Revisão ultrapassada em ${Math.abs(diffKm)} km` };
    if (diffKm <= 5000) return { tipo: 'AVISO', texto: `Próxima revisão em ${diffKm} km` };
    return null;
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);

    if (!placa.trim() || !modelo.trim()) {
      setMensagemErro('Placa e modelo são campos obrigatórios.');
      return;
    }

    const novoVeiculo: Veiculo = {
      id: 'veic-' + Date.now(),
      placa: placa.toUpperCase().trim(),
      modelo: modelo.trim(),
      marca: marca.trim() || 'Não informada',
      ano: Number(ano) || new Date().getFullYear(),
      tipo,
      proprietario,
      motoristaPadraoId: motoristaPadraoId || undefined,
      quilometragemAtual: Number(kmAtual) || 0,
      vencimentoSeguro: vencimentoSeguro || '',
      vencimentoCrlv: vencimentoCrlv || '',
      proximaManutencaoKm: Number(proximaManutencaoKm) || 0,
      ativo: true,
      observacoes: observacoes.trim()
    };

    const res = DB.saveVeiculo(novoVeiculo);
    if (!res.success) {
      setMensagemErro(res.message);
      return;
    }

    setVeiculos([...DB.getVeiculos()]);
    setMensagemSucesso(`Veículo ${novoVeiculo.placa} cadastrado com sucesso!`);
    setModalNovo(false);
    resetForm();
  };

  const resetForm = () => {
    setPlaca('');
    setModelo('');
    setMarca('');
    setAno(new Date().getFullYear());
    setKmAtual(0);
    setProximaManutencaoKm(0);
    setVencimentoCrlv('');
    setVencimentoSeguro('');
    setObservacoes('');
  };

  // Cálculo de custos e rentabilidade real por veículo
  const getEstatisticasVeiculo = (veiculoId: string) => {
    const viagensDoVeic = viagens.filter(v => v.veiculoId === veiculoId && v.status !== 'CANCELADA');
    const faturamentoBruto = viagensDoVeic.reduce((acc, cur) => acc + cur.valorFreteBruto, 0);

    const despesasDoVeic = financeiro.filter(t => t.veiculoId === veiculoId && t.status !== 'CANCELADO');
    const totalDespesas = despesasDoVeic.reduce((acc, cur) => acc + cur.valor, 0);
    const resultadoVeic = faturamentoBruto - totalDespesas;

    return {
      totalViagens: viagensDoVeic.length,
      faturamentoBruto,
      totalDespesas,
      resultadoVeic,
      despesas: despesasDoVeic
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gestão de Frota, Veículos e Alertas</h2>
          <p className="text-sm text-slate-500 mt-1">
            Controle de cavalos, carretas, tocos, quilometragem, CRLV, seguros e custo por placa.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            if (motoristas.length > 0) setMotoristaPadraoId(motoristas[0].id);
            setModalNovo(true);
          }}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Plus size={16} />
          <span>Cadastrar Veículo</span>
        </button>
      </div>

      {mensagemSucesso && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex items-center bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 w-full sm:w-80">
          <Search size={16} className="text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por placa, modelo ou marca..."
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Tipo:</span>
          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="TODOS">Todos os Veículos</option>
            <option value="CARRETA">Carreta / Articulado</option>
            <option value="TRUCK">Truck (3 eixos)</option>
            <option value="TOCO">Toco (2 eixos)</option>
            <option value="UTILITARIO">Utilitário / VUC</option>
          </select>
        </div>
      </div>

      {/* Grid de Veículos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map(v => {
          const stats = getEstatisticasVeiculo(v.id);
          const alertaCrlv = getAlertaDocumento(v.vencimentoCrlv);
          const alertaSeguro = getAlertaDocumento(v.vencimentoSeguro);
          const alertaKm = getAlertaKmRevisao(v);
          const motPadrao = motoristas.find(m => m.id === v.motoristaPadraoId);

          return (
            <div key={v.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-mono font-extrabold text-sm text-slate-900 border border-slate-200">
                      {v.placa}
                    </span>
                    <h3 className="font-bold text-slate-800 text-xs mt-2">{v.modelo}</h3>
                    <span className="text-[11px] text-slate-400">{v.marca} • Ano {v.ano}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    v.proprietario === 'PROPRIO' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {v.proprietario}
                  </span>
                </div>

                {/* Alertas */}
                {(alertaCrlv || alertaSeguro || alertaKm) && (
                  <div className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                    {alertaCrlv && (
                      <div className="flex items-center space-x-1.5 font-semibold">
                        <AlertTriangle size={13} className="text-amber-700 flex-shrink-0" />
                        <span>CRLV: {alertaCrlv.texto}</span>
                      </div>
                    )}
                    {alertaKm && (
                      <div className="flex items-center space-x-1.5 font-semibold">
                        <Wrench size={13} className="text-amber-700 flex-shrink-0" />
                        <span>{alertaKm.texto}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Motorista Vinculado:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">{motPadrao?.nomeCompleto || 'Livre / Rotativo'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quilometragem Atual:</span>
                    <span className="font-bold text-slate-900">{v.quilometragemAtual.toLocaleString('pt-BR')} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Próx. Manutenção:</span>
                    <span className="font-semibold text-slate-800">{v.proximaManutencaoKm ? `${v.proximaManutencaoKm.toLocaleString('pt-BR')} km` : 'Não definida'}</span>
                  </div>
                </div>

                {/* Resumo de Rentabilidade por Veículo (Requisito 8) */}
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Fretes Faturados</span>
                    <strong className="text-slate-900">R$ {stats.faturamentoBruto.toFixed(2)}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Resultado Operacional</span>
                    <strong className={`font-bold ${stats.resultadoVeic >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      R$ {stats.resultadoVeic.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">{stats.totalViagens} frete(s) efetuado(s)</span>
                <button
                  onClick={() => setVeiculoDetalhe(v)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Novo Veículo */}
      {modalNovo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Cadastrar Novo Veículo na Frota</h3>
              <button onClick={() => setModalNovo(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">✕</button>
            </div>

            {mensagemErro && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {mensagemErro}
              </div>
            )}

            <form onSubmit={handleSalvar} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Placa (Mercosul ou Padrão) *</label>
                  <input
                    type="text"
                    required
                    value={placa}
                    onChange={e => setPlaca(e.target.value)}
                    placeholder="BRA2E19 ou ABC1234"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Modelo do Veículo *</label>
                  <input
                    type="text"
                    required
                    value={modelo}
                    onChange={e => setModelo(e.target.value)}
                    placeholder="Ex: Volvo FH 540 Globetrotter"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Marca / Fabricante</label>
                  <input
                    type="text"
                    value={marca}
                    onChange={e => setMarca(e.target.value)}
                    placeholder="Volvo, Scania, Mercedes-Benz..."
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ano de Fabricação</label>
                  <input
                    type="number"
                    value={ano}
                    onChange={e => setAno(parseInt(e.target.value, 10) || 2024)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Veículo</label>
                  <select
                    value={tipo}
                    onChange={e => setTipo(e.target.value as TipoVeiculo)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="CARRETA">Carreta / Cavalo Mecânico</option>
                    <option value="TRUCK">Truck (3 eixos)</option>
                    <option value="TOCO">Toco (2 eixos)</option>
                    <option value="UTILITARIO">Utilitário / VUC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Propriedade do Veículo</label>
                  <select
                    value={proprietario}
                    onChange={e => setProprietario(e.target.value as TipoProprietario)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="PROPRIO">Próprio da Transportadora</option>
                    <option value="AGREGADO">Agregado</option>
                    <option value="TERCEIRO">Terceiro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Motorista Padrão Vinculado</label>
                  <select
                    value={motoristaPadraoId}
                    onChange={e => setMotoristaPadraoId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="">Livre / Sem vínculo fixo</option>
                    {motoristas.map(m => (
                      <option key={m.id} value={m.id}>{m.nomeCompleto}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quilometragem Atual (KM)</label>
                  <input
                    type="number"
                    value={kmAtual}
                    onChange={e => setKmAtual(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vencimento CRLV / Licenciamento</label>
                  <input
                    type="date"
                    value={vencimentoCrlv}
                    onChange={e => setVencimentoCrlv(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vencimento da Apólice de Seguro</label>
                  <input
                    type="date"
                    value={vencimentoSeguro}
                    onChange={e => setVencimentoSeguro(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Próxima Revisão / Manutenção (KM)</label>
                  <input
                    type="number"
                    value={proximaManutencaoKm}
                    onChange={e => setProximaManutencaoKm(parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 150000"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações da Frota</label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  placeholder="Informações sobre manutenções, pneus, tacógrafo ou restrições..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovo(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Salvar Veículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes do Veículo */}
      {veiculoDetalhe && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-base px-2 py-0.5 bg-slate-100 rounded text-slate-900 border">
                  {veiculoDetalhe.placa}
                </span>
                <span className="font-bold text-slate-700 text-sm">{veiculoDetalhe.modelo}</span>
              </div>
              <button onClick={() => setVeiculoDetalhe(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tipo / Categoria:</span>
                <span className="font-bold text-slate-800">{veiculoDetalhe.tipo} ({veiculoDetalhe.proprietario})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Quilometragem:</span>
                <span className="font-bold text-slate-900">{veiculoDetalhe.quilometragemAtual.toLocaleString('pt-BR')} km</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Vencimento CRLV:</span>
                <span className="font-semibold">{veiculoDetalhe.vencimentoCrlv ? new Date(veiculoDetalhe.vencimentoCrlv).toLocaleDateString('pt-BR') : 'Não cadastrado'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Vencimento Seguro:</span>
                <span className="font-semibold">{veiculoDetalhe.vencimentoSeguro ? new Date(veiculoDetalhe.vencimentoSeguro).toLocaleDateString('pt-BR') : 'Não cadastrado'}</span>
              </div>

              {veiculoDetalhe.observacoes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                  <span className="font-bold block text-slate-700 mb-0.5">Observações:</span>
                  <span>{veiculoDetalhe.observacoes}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setVeiculoDetalhe(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
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
