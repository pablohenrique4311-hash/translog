import React, { useState } from 'react';
import { DB, MOCK_USERS } from '../services/db';
import { User, UserRole, AuditLog } from '../types';
import { 
  ShieldCheck, 
  Users, 
  Key, 
  FileText, 
  Lock, 
  Check, 
  X, 
  AlertCircle,
  Clock,
  History,
  LogOut
} from 'lucide-react';

interface UsuariosProps {
  currentUser: User;
  onUserChanged: (user: User) => void;
  onLogout?: () => void;
}

export const Usuarios: React.FC<UsuariosProps> = ({ currentUser, onUserChanged, onLogout }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(DB.getAuditLogs());
  const [filtroAudit, setFiltroAudit] = useState('');

  const handleTrocarUsuario = (u: User) => {
    DB.setCurrentUser(u);
    onUserChanged(u);
  };

  const matrizPermissoes = [
    { modulo: 'Dashboard & Indicadores', ADMIN: true, FINANCEIRO: true, OPERACIONAL: true, GESTOR: true, MOTORISTA: 'Apenas seus dados' },
    { modulo: 'Importar Romaneios & OCR', ADMIN: true, FINANCEIRO: false, OPERACIONAL: true, GESTOR: true, MOTORISTA: false },
    { modulo: 'Viagens & Fretes', ADMIN: true, FINANCEIRO: 'Visualizar', OPERACIONAL: true, GESTOR: true, MOTORISTA: 'Somente suas viagens' },
    { modulo: 'Acerto de Motoristas & Baixa', ADMIN: true, FINANCEIRO: true, OPERACIONAL: false, GESTOR: 'Visualizar', MOTORISTA: 'Somente seu recibo' },
    { modulo: 'Contas a Pagar & Receber', ADMIN: true, FINANCEIRO: true, OPERACIONAL: false, GESTOR: 'Visualizar', MOTORISTA: false },
    { modulo: 'Gestão de Frota & CRLV', ADMIN: true, FINANCEIRO: false, OPERACIONAL: true, GESTOR: true, MOTORISTA: false },
    { modulo: 'Configurações da Transportadora', ADMIN: true, FINANCEIRO: false, OPERACIONAL: false, GESTOR: false, MOTORISTA: false },
    { modulo: 'Auditoria & Logs (LGPD)', ADMIN: true, FINANCEIRO: 'Visualizar', OPERACIONAL: false, GESTOR: 'Visualizar', MOTORISTA: false }
  ];

  const logsFiltrados = auditLogs.filter(l => 
    l.usuarioNome.toLowerCase().includes(filtroAudit.toLowerCase()) ||
    l.modulo.toLowerCase().includes(filtroAudit.toLowerCase()) ||
    l.detalhes.toLowerCase().includes(filtroAudit.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              Controle de Acesso RBAC & LGPD
            </span>
            <span className="text-xs text-slate-400">• Sessão Autenticada</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Perfis de Acesso, Usuários e Auditoria</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gerenciamento de permissões por perfil (Admin, Financeiro, Operacional, Gestor e Motorista).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <span className="text-slate-400 block font-medium">Usuário Conectado:</span>
            <strong className="text-slate-900 font-bold">{currentUser.nome}</strong>
            <span className="ml-2 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
              {currentUser.role}
            </span>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Deslogar e voltar à tela inicial"
            >
              <LogOut size={15} />
              <span>Sair da Conta</span>
            </button>
          )}
        </div>
      </div>

      {/* Seletor Rápido de Sessão para Demonstração das Regras de Negócio */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center space-x-2">
          <Key size={16} className="text-blue-700" />
          <span>Simulação de Perfis de Usuário (Troca Rápida de Sessão)</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Alterne entre os usuários pré-configurados para auditar e testar a visualização restrita de cada papel.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MOCK_USERS.map(u => {
            const isSelected = currentUser.id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => handleTrocarUsuario(u)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' 
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{u.nome}</h4>
                    <span className="text-[11px] text-slate-500 block truncate">{u.email}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                    u.role === 'FINANCEIRO' ? 'bg-blue-100 text-blue-800' :
                    u.role === 'OPERACIONAL' ? 'bg-amber-100 text-amber-800' :
                    u.role === 'GESTOR' ? 'bg-sky-100 text-sky-800' :
                    'bg-slate-200 text-slate-800'
                  }`}>
                    {u.role}
                  </span>
                </div>

                {isSelected && (
                  <div className="mt-2 text-[10px] text-emerald-700 font-bold flex items-center space-x-1">
                    <Check size={12} />
                    <span>Perfil ativo no momento</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Matriz de Permissões */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Matriz de Acessos e Níveis de Autorização (RBAC)</h3>
          <p className="text-xs text-slate-500 mt-0.5">Definição formal das regras de segurança exigidas</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Módulo Funcional</th>
                <th className="px-5 py-3.5">Administrador</th>
                <th className="px-5 py-3.5">Financeiro</th>
                <th className="px-5 py-3.5">Operacional</th>
                <th className="px-5 py-3.5">Gestor</th>
                <th className="px-5 py-3.5">Motorista</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrizPermissoes.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3 font-bold text-slate-800">{p.modulo}</td>
                  <td className="px-5 py-3">
                    <span className="text-emerald-700 font-bold">Total</span>
                  </td>
                  <td className="px-5 py-3">
                    {p.FINANCEIRO === true ? <span className="text-emerald-700 font-bold">Total</span> :
                     p.FINANCEIRO === false ? <span className="text-rose-500 font-bold">Bloqueado</span> :
                     <span className="text-amber-700 font-medium">{p.FINANCEIRO}</span>}
                  </td>
                  <td className="px-5 py-3">
                    {p.OPERACIONAL === true ? <span className="text-emerald-700 font-bold">Total</span> :
                     p.OPERACIONAL === false ? <span className="text-rose-500 font-bold">Bloqueado</span> :
                     <span className="text-amber-700 font-medium">{p.OPERACIONAL}</span>}
                  </td>
                  <td className="px-5 py-3">
                    {p.GESTOR === true ? <span className="text-emerald-700 font-bold">Total</span> :
                     p.GESTOR === false ? <span className="text-rose-500 font-bold">Bloqueado</span> :
                     <span className="text-amber-700 font-medium">{p.GESTOR}</span>}
                  </td>
                  <td className="px-5 py-3">
                    {p.MOTORISTA === false ? <span className="text-rose-500 font-bold">Bloqueado</span> :
                     <span className="text-blue-700 font-medium">{p.MOTORISTA}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trilha de Auditoria (Audit Log) - Proteção LGPD e Registro de Eventos */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <History size={18} className="text-blue-800" />
              <h3 className="font-bold text-slate-900 text-sm">Trilha de Auditoria e Registro de Operações (LGPD)</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Logs auditáveis de todas as operações críticas e alterações no banco</p>
          </div>

          <input
            type="text"
            value={filtroAudit}
            onChange={e => setFiltroAudit(e.target.value)}
            placeholder="Filtrar por usuário, módulo..."
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none w-full sm:w-60"
          />
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] text-slate-500 font-bold uppercase sticky top-0">
              <tr>
                <th className="px-5 py-3">Horário / Data</th>
                <th className="px-5 py-3">Usuário</th>
                <th className="px-5 py-3">Módulo</th>
                <th className="px-5 py-3">Ação</th>
                <th className="px-5 py-3">Detalhes Auditados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logsFiltrados.slice(0, 30).map(l => (
                <tr key={l.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-2.5 text-slate-500 whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-5 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                    {l.usuarioNome}
                  </td>
                  <td className="px-5 py-2.5 text-blue-900 font-semibold whitespace-nowrap">
                    {l.modulo}
                  </td>
                  <td className="px-5 py-2.5 text-slate-800 font-bold whitespace-nowrap">
                    {l.acao}
                  </td>
                  <td className="px-5 py-2.5 text-slate-600 font-sans">
                    {l.detalhes}
                  </td>
                </tr>
              ))}
              {logsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    Nenhum registro de auditoria encontrado.
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
