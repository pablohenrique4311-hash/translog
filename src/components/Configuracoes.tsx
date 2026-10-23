import React, { useState } from 'react';
import { DB } from '../services/db';
import { ConfiguracaoEmpresa } from '../types';
import { 
  Save, 
  RefreshCw, 
  Trash2, 
  ShieldAlert, 
  Building2, 
  DollarSign, 
  FileCheck, 
  CheckCircle,
  Database,
  Info
} from 'lucide-react';

export const Configuracoes: React.FC = () => {
  const [config, setConfig] = useState<ConfiguracaoEmpresa>(DB.getConfig());
  const [salvo, setSalvo] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    DB.saveConfig(config);
    setSalvo(true);
    setMensagem('Parâmetros operacionais e tarifa padrão atualizados com sucesso!');
    setTimeout(() => {
      setSalvo(false);
      setMensagem(null);
    }, 4000);
  };

  const handleRestaurarDemo = () => {
    if (confirm('Deseja recarregar a base com dados de demonstração homologados? Viagens, motoristas e romaneios de teste serão restabelecidos.')) {
      DB.resetToDemo();
      window.location.reload();
    }
  };

  const handleLimparBase = () => {
    if (confirm('ATENÇÃO: Deseja apagar todos os registros (motoristas, veículos, viagens e financeiro) para iniciar a operação do zero? Esta ação é irreversível.')) {
      DB.clearAllData();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Configurações Gerais da Transportadora</h2>
          <p className="text-sm text-slate-500 mt-1">
            Dados cadastrais e fiscais da empresa, tarifa base de fretes e manutenção da base de dados.
          </p>
        </div>
      </div>

      {mensagem && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{mensagem}</span>
        </div>
      )}

      {/* Formulário Principal */}
      <form onSubmit={handleSalvar} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Building2 size={16} className="text-blue-800" />
          <span>Dados Fiscais e Cadastrais do Emissor</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Razão Social *</label>
            <input
              type="text"
              required
              value={config.razaoSocial}
              onChange={e => setConfig({ ...config, razaoSocial: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nome Fantasia / Marca *</label>
            <input
              type="text"
              required
              value={config.nomeFantasia}
              onChange={e => setConfig({ ...config, nomeFantasia: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ *</label>
            <input
              type="text"
              required
              value={config.cnpj}
              onChange={e => setConfig({ ...config, cnpj: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Inscrição Estadual (IE)</label>
            <input
              type="text"
              value={config.inscricaoEstadual}
              onChange={e => setConfig({ ...config, inscricaoEstadual: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Telefone Principal</label>
            <input
              type="text"
              value={config.telefone}
              onChange={e => setConfig({ ...config, telefone: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Operacional</label>
            <input
              type="email"
              value={config.email}
              onChange={e => setConfig({ ...config, email: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Endereço Completo do Pátio Principal</label>
            <input
              type="text"
              value={config.enderecoCompleto}
              onChange={e => setConfig({ ...config, enderecoCompleto: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
            />
          </div>
        </div>

        {/* Regras de Frete e Faturamento */}
        <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2 border-b border-slate-100 pb-3 pt-4">
          <DollarSign size={16} className="text-emerald-700" />
          <span>Regras de Cálculo e Tarifa Base de Frete</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tarifa Padrão Inicial por Viagem (R$) * [Requisito 4]
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={config.valorFretePadrao}
              onChange={e => setConfig({ ...config, valorFretePadrao: parseFloat(e.target.value) || 0 })}
              className="w-full border border-emerald-300 bg-emerald-50/50 rounded-xl px-3 py-2.5 text-sm font-extrabold text-emerald-900 focus:ring-2 focus:ring-emerald-600 outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Valor padrão inicial de R$ 230,00 aplicado a novos romaneios e viagens sem contrato exclusivo.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Chave PIX da Transportadora</label>
            <input
              type="text"
              value={config.chavePixEmpresa}
              onChange={e => setConfig({ ...config, chavePixEmpresa: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Exibida nos demonstrativos e faturas para recebimento de fretes.
            </span>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Conta Bancária Oficial da Empresa</label>
            <input
              type="text"
              value={config.bancoEmpresa}
              onChange={e => setConfig({ ...config, bancoEmpresa: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Save size={16} />
            <span>Gravar Parâmetros e Configurações</span>
          </button>
        </div>
      </form>

      {/* Gerenciamento da Base de Dados e Testes */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
          <Database size={16} className="text-slate-700" />
          <span>Gestão da Base de Dados e Homologação</span>
        </h3>
        <p className="text-xs text-slate-500">
          Utilize as ações abaixo para restaurar amostras homologadas para testes e auditoria ou zerar o banco para operação em ambiente de produção real.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleRestaurarDemo}
            className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <RefreshCw size={15} />
            <span>Recarregar Dados de Demonstração</span>
          </button>

          <button
            type="button"
            onClick={handleLimparBase}
            className="px-4 py-2.5 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
            <span>Limpar Banco de Dados (Zerar para Produção)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
