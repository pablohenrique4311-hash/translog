import React, { useState } from 'react';
import { DB } from '../services/db';
import { Motorista, CategoriaCNH, TipoVinculo, TipoChavePix } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  Calendar, 
  Truck, 
  FileText, 
  DollarSign,
  Shield,
  Edit2,
  Clock
} from 'lucide-react';

export const Motoristas: React.FC = () => {
  const [motoristas, setMotoristas] = useState<Motorista[]>(DB.getMotoristas());
  const viagens = DB.getViagens();
  const transacoes = DB.getFinanceiro();
  const romaneios = DB.getRomaneios();

  const [busca, setBusca] = useState('');
  const [filtroVinculo, setFiltroVinculo] = useState<string>('TODOS');
  const [mostrarBancarios, setMostrarBancarios] = useState(false);
  const [modalNovo, setModalNovo] = useState(false);
  const [motoristaDetalhe, setMotoristaDetalhe] = useState<Motorista | null>(null);
  const [abaDetalhe, setAbaDetalhe] = useState<'CADASTRO' | 'VIAGENS' | 'ROMANEIOS' | 'FINANCEIRO'>('CADASTRO');
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cnh, setCnh] = useState('');
  const [categoriaCnh, setCategoriaCnh] = useState<CategoriaCNH>('E');
  const [validadeCnh, setValidadeCnh] = useState('');
  const [tipoVinculo, setTipoVinculo] = useState<TipoVinculo>('AGREGADO');
  const [tipoChavePix, setTipoChavePix] = useState<TipoChavePix>('CPF');
  const [chavePix, setChavePix] = useState('');
  const [banco, setBanco] = useState('');
  const [agencia, setAgencia] = useState('');
  const [conta, setConta] = useState('');
  const [contatoEmergencia, setContatoEmergencia] = useState('');
  const [telefoneEmergencia, setTelefoneEmergencia] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const filtrados = motoristas.filter(m => {
    const matchBusca = 
      m.nomeCompleto.toLowerCase().includes(busca.toLowerCase()) ||
      m.cpf.includes(busca) ||
      m.cnh.includes(busca) ||
      m.telefone.includes(busca);

    const matchVinculo = filtroVinculo === 'TODOS' || m.tipoVinculo === filtroVinculo;
    return matchBusca && matchVinculo;
  });

  const handleAbrirEdicao = (m: Motorista) => {
    setEditId(m.id);
    setNome(m.nomeCompleto);
    setCpf(m.cpf);
    setTelefone(m.telefone);
    setEndereco(m.endereco);
    setCnh(m.cnh);
    setCategoriaCnh(m.categoriaCnh);
    setValidadeCnh(m.validadeCnh);
    setTipoVinculo(m.tipoVinculo);
    setTipoChavePix(m.tipoChavePix);
    setChavePix(m.chavePix);
    setBanco(m.banco);
    setAgencia(m.agencia);
    setConta(m.conta);
    setContatoEmergencia(m.contatoEmergencia);
    setTelefoneEmergencia(m.telefoneEmergencia);
    setObservacoes(m.observacoes || '');
    setMensagemErro(null);
    setModalNovo(true);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);

    if (!nome.trim() || !cpf.trim() || !cnh.trim() || !validadeCnh) {
      setMensagemErro('Preencha os campos obrigatórios (Nome, CPF, CNH e Validade).');
      return;
    }

    const novoMotorista: Motorista = {
      id: editId || 'mot-' + Date.now(),
      nomeCompleto: nome.trim(),
      cpf: cpf.trim(),
      telefone: telefone.trim(),
      endereco: endereco.trim() || 'Endereço não cadastrado',
      cnh: cnh.trim(),
      categoriaCnh,
      validadeCnh,
      tipoVinculo,
      tipoChavePix,
      chavePix: chavePix.trim(),
      banco: banco.trim() || 'Não informado',
      agencia: agencia.trim() || '-',
      conta: conta.trim() || '-',
      contatoEmergencia: contatoEmergencia.trim(),
      telefoneEmergencia: telefoneEmergencia.trim(),
      ativo: editId ? (motoristas.find(m => m.id === editId)?.ativo ?? true) : true,
      dataCadastro: editId ? (motoristas.find(m => m.id === editId)?.dataCadastro ?? new Date().toISOString().substring(0, 10)) : new Date().toISOString().substring(0, 10),
      observacoes: observacoes.trim()
    };

    const res = DB.saveMotorista(novoMotorista);
    if (!res.success) {
      setMensagemErro(res.message);
      return;
    }

    setMotoristas([...DB.getMotoristas()]);
    setMensagemSucesso(`Motorista ${novoMotorista.nomeCompleto} salvo com sucesso!`);
    setModalNovo(false);
    resetForm();
  };

  const resetForm = () => {
    setEditId(null);
    setNome('');
    setCpf('');
    setTelefone('');
    setEndereco('');
    setCnh('');
    setCategoriaCnh('E');
    setValidadeCnh('');
    setChavePix('');
    setBanco('');
    setAgencia('');
    setConta('');
    setContatoEmergencia('');
    setTelefoneEmergencia('');
    setObservacoes('');
  };

  const handleToggleAtivo = (id: string) => {
    DB.toggleMotoristaAtivo(id);
    setMotoristas([...DB.getMotoristas()]);
    if (motoristaDetalhe && motoristaDetalhe.id === id) {
      const atualizado = DB.getMotoristas().find(m => m.id === id);
      if (atualizado) setMotoristaDetalhe({ ...atualizado });
    }
  };

  // Verifica se a CNH está próxima de vencer (< 45 dias) ou vencida
  const getStatusCnh = (dataValidade: string) => {
    if (!dataValidade) return { label: 'Indeterminada', cor: 'text-slate-500 bg-slate-100' };
    const hoje = new Date().getTime();
    const venc = new Date(dataValidade).getTime();
    const diffDias = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      return { label: `Vencida (${Math.abs(diffDias)}d atrás)`, cor: 'text-rose-700 bg-rose-100 border-rose-200' };
    }
    if (diffDias <= 45) {
      return { label: `Vence em ${diffDias} dias`, cor: 'text-amber-800 bg-amber-100 border-amber-200' };
    }
    return { label: 'Em dia', cor: 'text-emerald-700 bg-emerald-100 border-emerald-200' };
  };

  // Históricos vinculados para o motorista selecionado
  const viagensDoMotorista = motoristaDetalhe ? viagens.filter(v => v.motoristaId === motoristaDetalhe.id) : [];
  const romaneiosDoMotorista = motoristaDetalhe ? romaneios.filter(r => r.motoristaId === motoristaDetalhe.id) : [];
  const lancamentosDoMotorista = motoristaDetalhe ? transacoes.filter(t => t.motoristaId === motoristaDetalhe.id) : [];

  return (
    <div className="space-y-6">
      {/* Banner Principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gestão Cadastral e Financeira de Motoristas</h2>
          <p className="text-sm text-slate-500 mt-1">
            Controle de CNH, categorias, dados de liquidação bancária/PIX, histórico de viagens e adiantamentos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setMostrarBancarios(!mostrarBancarios)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Conformidade LGPD: mascara chaves PIX e contas bancárias na listagem"
          >
            {mostrarBancarios ? <EyeOff size={15} /> : <Eye size={15} />}
            <span>{mostrarBancarios ? 'Ocultar Bancários (LGPD)' : 'Exibir Bancários'}</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setModalNovo(true);
            }}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={16} />
            <span>Cadastrar Motorista</span>
          </button>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex items-center bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 w-full sm:w-80">
          <Search size={16} className="text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, CPF, CNH ou fone..."
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Vínculo:</span>
          <select
            value={filtroVinculo}
            onChange={e => setFiltroVinculo(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="TODOS">Todos os Vínculos</option>
            <option value="AGREGADO">Agregado</option>
            <option value="CLT">CLT (Próprio)</option>
            <option value="TERCEIRO">Terceiro</option>
            <option value="AUTONOMO">Autônomo</option>
          </select>
        </div>
      </div>

      {/* Grid de Cards de Motoristas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map(m => {
          const statusCnh = getStatusCnh(m.validadeCnh);
          const viagensTotais = viagens.filter(v => v.motoristaId === m.id).length;

          return (
            <div key={m.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{m.nomeCompleto}</h3>
                    <span className="text-xs font-mono text-slate-500">CPF: {m.cpf}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    m.ativo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {m.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="mt-3.5 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tipo de Vínculo:</span>
                    <span className="font-bold text-slate-800">{m.tipoVinculo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CNH:</span>
                    <span className="font-bold text-slate-800">{m.cnh} (Cat. {m.categoriaCnh})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Validade CNH:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusCnh.cor}`}>
                      {new Date(m.validadeCnh).toLocaleDateString('pt-BR')} • {statusCnh.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Telefone:</span>
                    <span className="font-semibold text-slate-800">{m.telefone}</span>
                  </div>

                  {/* Dados de Liquidação e PIX */}
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between text-[11px] font-bold text-blue-900 mb-1">
                      <span>Dados Bancários & PIX:</span>
                      <Shield size={12} className="text-blue-600" />
                    </div>
                    {mostrarBancarios ? (
                      <div className="space-y-0.5 text-[11px] text-slate-700">
                        <div>{m.banco} • Ag: {m.agencia} / CC: {m.conta}</div>
                        <div className="font-mono text-emerald-800 font-bold">PIX ({m.tipoChavePix}): {m.chavePix || 'Não informada'}</div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">
                        •••••••• • Chave PIX Oculta (Clique em "Exibir Bancários")
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Ações do Card */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  {viagensTotais} viagem(ns) no sistema
                </span>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleAbrirEdicao(m)}
                    className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Editar Cadastro"
                  >
                    <Edit2 size={15} />
                  </button>

                  <button
                    onClick={() => {
                      setMotoristaDetalhe(m);
                      setAbaDetalhe('CADASTRO');
                    }}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Ver Ficha
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Ficha Completa do Motorista */}
      {motoristaDetalhe && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-slate-900">{motoristaDetalhe.nomeCompleto}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    motoristaDetalhe.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {motoristaDetalhe.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  CPF: {motoristaDetalhe.cpf} • CNH: {motoristaDetalhe.cnh} (Cat. {motoristaDetalhe.categoriaCnh}) • Vínculo: {motoristaDetalhe.tipoVinculo}
                </p>
              </div>

              <button onClick={() => setMotoristaDetalhe(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                ✕
              </button>
            </div>

            {/* Abas da Ficha */}
            <div className="flex space-x-2 border-b border-slate-200 mt-4 pb-2">
              <button
                onClick={() => setAbaDetalhe('CADASTRO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  abaDetalhe === 'CADASTRO' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Dados Cadastrais
              </button>
              <button
                onClick={() => setAbaDetalhe('VIAGENS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  abaDetalhe === 'VIAGENS' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Viagens ({viagensDoMotorista.length})
              </button>
              <button
                onClick={() => setAbaDetalhe('ROMANEIOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  abaDetalhe === 'ROMANEIOS' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Romaneios ({romaneiosDoMotorista.length})
              </button>
              <button
                onClick={() => setAbaDetalhe('FINANCEIRO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  abaDetalhe === 'FINANCEIRO' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Adiantamentos & Vales ({lancamentosDoMotorista.length})
              </button>
            </div>

            {/* Conteúdo da Aba */}
            <div className="mt-4">
              {abaDetalhe === 'CADASTRO' && (
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-slate-500 font-semibold block">Telefone / WhatsApp:</span>
                      <span className="font-bold text-slate-900">{motoristaDetalhe.telefone}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Endereço Residencial:</span>
                      <span className="font-bold text-slate-900">{motoristaDetalhe.endereco}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Validade da CNH:</span>
                      <span className="font-bold text-slate-900">{new Date(motoristaDetalhe.validadeCnh).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Contato de Emergência:</span>
                      <span className="font-bold text-slate-900">{motoristaDetalhe.contatoEmergencia || 'Não cadastrado'} ({motoristaDetalhe.telefoneEmergencia || '-'})</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wider block">Dados Financeiros para Liquidação Pix/Doc</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500">Banco:</span> <strong>{motoristaDetalhe.banco}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Agência / Conta:</span> <strong>{motoristaDetalhe.agencia} / {motoristaDetalhe.conta}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">Chave PIX ({motoristaDetalhe.tipoChavePix}):</span>
                        <strong className="ml-2 font-mono text-emerald-700">{motoristaDetalhe.chavePix}</strong>
                      </div>
                    </div>
                  </div>

                  {motoristaDetalhe.observacoes && (
                    <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-amber-900">
                      <span className="font-bold block mb-0.5">Observações Operacionais:</span>
                      <span>{motoristaDetalhe.observacoes}</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-between items-center">
                    <button
                      onClick={() => handleToggleAtivo(motoristaDetalhe.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        motoristaDetalhe.ativo ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {motoristaDetalhe.ativo ? 'Inativar Motorista' : 'Reativar Motorista'}
                    </button>
                  </div>
                </div>
              )}

              {abaDetalhe === 'VIAGENS' && (
                <div className="space-y-2">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-2">Viagem</th>
                        <th className="p-2">Romaneio</th>
                        <th className="p-2">Data</th>
                        <th className="p-2">Veículo</th>
                        <th className="p-2">Frete</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viagensDoMotorista.map(v => (
                        <tr key={v.id}>
                          <td className="p-2 font-bold text-slate-900">{v.codigoViagem}</td>
                          <td className="p-2 font-mono">{v.numeroRomaneio}</td>
                          <td className="p-2">{new Date(v.dataSaida).toLocaleDateString('pt-BR')}</td>
                          <td className="p-2 font-mono font-bold">{v.veiculoPlaca}</td>
                          <td className="p-2 font-bold text-slate-900">R$ {v.valorFreteBruto.toFixed(2)}</td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                              {v.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {viagensDoMotorista.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400">
                            Nenhuma viagem realizada por este motorista.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {abaDetalhe === 'ROMANEIOS' && (
                <div className="space-y-2">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-2">Romaneio</th>
                        <th className="p-2">Emissão</th>
                        <th className="p-2">Origem / Destino</th>
                        <th className="p-2">Peso</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {romaneiosDoMotorista.map(r => (
                        <tr key={r.id}>
                          <td className="p-2 font-mono font-bold text-slate-900">{r.numeroRomaneio}</td>
                          <td className="p-2">{new Date(r.dataEmissao).toLocaleDateString('pt-BR')}</td>
                          <td className="p-2">{r.origem} → {r.destino}</td>
                          <td className="p-2 font-bold">{r.pesoCargaKg} kg</td>
                          <td className="p-2">{r.statusProcessamento}</td>
                        </tr>
                      ))}
                      {romaneiosDoMotorista.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">
                            Nenhum romaneio vinculado a este motorista.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {abaDetalhe === 'FINANCEIRO' && (
                <div className="space-y-2">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-2">Descrição</th>
                        <th className="p-2">Data</th>
                        <th className="p-2">Valor</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lancamentosDoMotorista.map(t => (
                        <tr key={t.id}>
                          <td className="p-2 font-semibold text-slate-800">{t.descricao}</td>
                          <td className="p-2">{new Date(t.dataEmissao).toLocaleDateString('pt-BR')}</td>
                          <td className="p-2 font-bold text-rose-700">R$ {t.valor.toFixed(2)}</td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {lancamentosDoMotorista.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400">
                            Nenhum adiantamento ou lançamento financeiro registrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setMotoristaDetalhe(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro/Edição de Motorista */}
      {modalNovo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editId ? 'Editar Cadastro de Motorista' : 'Cadastrar Novo Motorista'}
              </h3>
              <button onClick={() => setModalNovo(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                ✕
              </button>
            </div>

            {mensagemErro && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {mensagemErro}
              </div>
            )}

            <form onSubmit={handleSalvar} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Ex: Carlos Eduardo da Silva"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CPF *</label>
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={e => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={telefone}
                    onChange={e => setTelefone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Vínculo Contratual</label>
                  <select
                    value={tipoVinculo}
                    onChange={e => setTipoVinculo(e.target.value as TipoVinculo)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="AGREGADO">Agregado</option>
                    <option value="CLT">CLT (Próprio)</option>
                    <option value="TERCEIRO">Terceiro</option>
                    <option value="AUTONOMO">Autônomo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Número da CNH *</label>
                  <input
                    type="text"
                    required
                    value={cnh}
                    onChange={e => setCnh(e.target.value)}
                    placeholder="Número do registro"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria CNH</label>
                  <select
                    value={categoriaCnh}
                    onChange={e => setCategoriaCnh(e.target.value as CategoriaCNH)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="E">Categoria E (Carretas / Articulados)</option>
                    <option value="D">Categoria D (Ônibus / Trucks)</option>
                    <option value="C">Categoria C (Caminhões Toco)</option>
                    <option value="B">Categoria B (Utilitários)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Validade da CNH *</label>
                  <input
                    type="date"
                    required
                    value={validadeCnh}
                    onChange={e => setValidadeCnh(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Endereço Residencial</label>
                  <input
                    type="text"
                    value={endereco}
                    onChange={e => setEndereco(e.target.value)}
                    placeholder="Rua, número, cidade/UF"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Chave PIX</label>
                  <select
                    value={tipoChavePix}
                    onChange={e => setTipoChavePix(e.target.value as TipoChavePix)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="CPF">CPF</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="TELEFONE">Telefone</option>
                    <option value="ALEATORIA">Chave Aleatória (EVP)</option>
                    <option value="CNPJ">CNPJ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chave PIX</label>
                  <input
                    type="text"
                    value={chavePix}
                    onChange={e => setChavePix(e.target.value)}
                    placeholder="Chave para transferências"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Banco</label>
                  <input
                    type="text"
                    value={banco}
                    onChange={e => setBanco(e.target.value)}
                    placeholder="Ex: Itaú (341)"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Agência / Conta Corrente</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={agencia}
                      onChange={e => setAgencia(e.target.value)}
                      placeholder="Agência"
                      className="w-1/2 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      value={conta}
                      onChange={e => setConta(e.target.value)}
                      placeholder="Conta"
                      className="w-1/2 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contato de Emergência</label>
                  <input
                    type="text"
                    value={contatoEmergencia}
                    onChange={e => setContatoEmergencia(e.target.value)}
                    placeholder="Nome do contato (ex: Esposa/Parente)"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone de Emergência</label>
                  <input
                    type="text"
                    value={telefoneEmergencia}
                    onChange={e => setTelefoneEmergencia(e.target.value)}
                    placeholder="(11) 99999-0000"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações Operacionais</label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais sobre o motorista, restrições ou rotas preferenciais..."
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
                  {editId ? 'Salvar Alterações' : 'Cadastrar Motorista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
