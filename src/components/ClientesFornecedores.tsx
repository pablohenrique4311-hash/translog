import React, { useState } from 'react';
import { DB } from '../services/db';
import { Cliente, Fornecedor } from '../types';
import { 
  Building2, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  CheckCircle,
  Truck,
  FileText
} from 'lucide-react';

export const ClientesFornecedores: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>(DB.getClientes());
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(DB.getFornecedores());
  const viagens = DB.getViagens();
  const financeiro = DB.getFinanceiro();
  const cfg = DB.getConfig();

  const [tab, setTab] = useState<'CLIENTES' | 'FORNECEDORES'>('CLIENTES');
  const [busca, setBusca] = useState('');
  const [modalCliente, setModalCliente] = useState(false);
  const [modalFornecedor, setModalFornecedor] = useState(false);

  // Form Cliente
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [tarifaPadrao, setTarifaPadrao] = useState<number>(cfg.valorFretePadrao);

  // Form Fornecedor
  const [fornRazao, setFornRazao] = useState('');
  const [fornFantasia, setFornFantasia] = useState('');
  const [fornCnpj, setFornCnpj] = useState('');
  const [fornTelefone, setFornTelefone] = useState('');
  const [fornCategoria, setFornCategoria] = useState<'POSTO' | 'OFICINA' | 'AUTOPECAS' | 'SEGUROS' | 'OUTROS'>('POSTO');

  const clientesFiltrados = clientes.filter(c => 
    c.razaoSocial.toLowerCase().includes(busca.toLowerCase()) ||
    c.cnpjCpf.includes(busca) ||
    c.nomeFantasia.toLowerCase().includes(busca.toLowerCase())
  );

  const fornecedoresFiltrados = fornecedores.filter(f => 
    f.razaoSocial.toLowerCase().includes(busca.toLowerCase()) ||
    f.cnpjCpf.includes(busca)
  );

  const handleSalvarCliente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!razaoSocial.trim() || !cnpjCpf.trim()) return;

    const novo: Cliente = {
      id: 'cli-' + Date.now(),
      razaoSocial: razaoSocial.trim(),
      nomeFantasia: nomeFantasia.trim() || razaoSocial.trim(),
      cnpjCpf: cnpjCpf.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      cidade: cidade.trim(),
      estado: estado.trim(),
      tarifaPadrao: Number(tarifaPadrao) || cfg.valorFretePadrao,
      ativo: true
    };

    DB.saveCliente(novo);
    setClientes([...DB.getClientes()]);
    setModalCliente(false);
    setRazaoSocial('');
    setCnpjCpf('');
  };

  const handleSalvarFornecedor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornRazao.trim()) return;

    const novo: Fornecedor = {
      id: 'forn-' + Date.now(),
      razaoSocial: fornRazao.trim(),
      nomeFantasia: fornFantasia.trim() || fornRazao.trim(),
      cnpjCpf: fornCnpj.trim(),
      telefone: fornTelefone.trim(),
      categoria: fornCategoria,
      cidade: 'Jundiaí',
      estado: 'SP'
    };

    DB.saveFornecedor(novo);
    setFornecedores([...DB.getFornecedores()]);
    setModalFornecedor(false);
    setFornRazao('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Clientes Embarcadores e Fornecedores Homologados</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestão comercial de contratos, tabelas de fretes por cliente e cadastro de postos e oficinas.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {tab === 'CLIENTES' ? (
            <button
              onClick={() => setModalCliente(true)}
              className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus size={16} />
              <span>Novo Cliente</span>
            </button>
          ) : (
            <button
              onClick={() => setModalFornecedor(true)}
              className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus size={16} />
              <span>Novo Fornecedor</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setTab('CLIENTES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'CLIENTES' ? 'bg-[#0A192F] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Clientes Embarcadores ({clientes.length})
        </button>
        <button
          onClick={() => setTab('FORNECEDORES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'FORNECEDORES' ? 'bg-[#0A192F] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Fornecedores & Postos ({fornecedores.length})
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs max-w-md flex items-center">
        <Search size={16} className="text-slate-400 mr-2 flex-shrink-0" />
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
          className="w-full text-xs outline-none bg-transparent"
        />
      </div>

      {/* Listagem de Clientes */}
      {tab === 'CLIENTES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientesFiltrados.map(c => {
            const viagensDoCliente = viagens.filter(v => v.clienteId === c.id);
            const totalFaturado = viagensDoCliente.reduce((acc, cur) => acc + cur.valorFreteBruto, 0);

            return (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{c.nomeFantasia || c.razaoSocial}</h3>
                      <span className="text-[11px] text-slate-500 font-mono block">CNPJ: {c.cnpjCpf}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Ativo
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center text-slate-600">
                      <MapPin size={13} className="text-slate-400 mr-1.5 flex-shrink-0" />
                      <span>{c.cidade} - {c.estado}</span>
                    </div>
                    {c.telefone && (
                      <div className="flex items-center text-slate-600">
                        <Phone size={13} className="text-slate-400 mr-1.5 flex-shrink-0" />
                        <span>{c.telefone}</span>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center text-slate-600">
                        <Mail size={13} className="text-slate-400 mr-1.5 flex-shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}

                    <div className="mt-2.5 p-2.5 rounded-xl bg-blue-50/50 border border-blue-200/60 flex justify-between items-center">
                      <span className="text-[11px] font-bold text-blue-900">Tarifa Contratada:</span>
                      <strong className="text-sm font-bold text-blue-950">R$ {c.tarifaPadrao.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{viagensDoCliente.length} frete(s)</span>
                  <span className="font-bold text-slate-900">Total: R$ {totalFaturado.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Listagem de Fornecedores */}
      {tab === 'FORNECEDORES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fornecedoresFiltrados.map(f => (
            <div key={f.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{f.nomeFantasia || f.razaoSocial}</h3>
                  <span className="text-[11px] text-slate-500 font-mono block">CNPJ: {f.cnpjCpf}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                  {f.categoria}
                </span>
              </div>

              <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-center text-slate-600">
                  <MapPin size={13} className="text-slate-400 mr-1.5 flex-shrink-0" />
                  <span>{f.cidade} - {f.estado}</span>
                </div>
                {f.telefone && (
                  <div className="flex items-center text-slate-600">
                    <Phone size={13} className="text-slate-400 mr-1.5 flex-shrink-0" />
                    <span>{f.telefone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Cliente */}
      {modalCliente && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Cadastrar Novo Cliente Embarcador</h3>
            <form onSubmit={handleSalvarCliente} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Razão Social *</label>
                <input
                  type="text"
                  required
                  value={razaoSocial}
                  onChange={e => setRazaoSocial(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={nomeFantasia}
                  onChange={e => setNomeFantasia(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ / CPF *</label>
                  <input
                    type="text"
                    required
                    value={cnpjCpf}
                    onChange={e => setCnpjCpf(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tarifa de Frete (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tarifaPadrao}
                    onChange={e => setTarifaPadrao(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={e => setTelefone(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Operacional</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={e => setCidade(e.target.value)}
                    placeholder="Jundiaí"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UF</label>
                  <input
                    type="text"
                    value={estado}
                    onChange={e => setEstado(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCliente(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Fornecedor */}
      {modalFornecedor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Cadastrar Novo Fornecedor</h3>
            <form onSubmit={handleSalvarFornecedor} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Razão Social *</label>
                <input
                  type="text"
                  required
                  value={fornRazao}
                  onChange={e => setFornRazao(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={fornFantasia}
                  onChange={e => setFornFantasia(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={fornCnpj}
                    onChange={e => setFornCnpj(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={fornCategoria}
                    onChange={e => setFornCategoria(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="POSTO">Posto de Combustível</option>
                    <option value="OFICINA">Oficina Mecânica</option>
                    <option value="AUTOPECAS">Auto Peças / Pneus</option>
                    <option value="SEGUROS">Seguradora / Gerenciadora</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalFornecedor(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
