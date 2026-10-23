import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  FileUp, 
  Navigation, 
  DollarSign, 
  Calculator, 
  Settings, 
  FileText,
  Building2,
  BarChart3,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  Shield,
  Key,
  LogOut,
  UserCheck
} from 'lucide-react';

import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { ImportarRomaneios } from './components/ImportarRomaneios';
import { Motoristas } from './components/Motoristas';
import { Viagens } from './components/Viagens';
import { AcertoMotoristas } from './components/AcertoMotoristas';
import { Financeiro } from './components/Financeiro';
import { Frota } from './components/Frota';
import { ClientesFornecedores } from './components/ClientesFornecedores';
import { Relatorios } from './components/Relatorios';
import { Usuarios } from './components/Usuarios';
import { Configuracoes } from './components/Configuracoes';
import { DB, MOCK_USERS } from './services/db';
import { User } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(DB.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('DASHBOARD');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const cfg = DB.getConfig();

  const navigationItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'FINANCEIRO', 'OPERACIONAL', 'GESTOR', 'MOTORISTA'] },
    { id: 'ROMANEIOS', label: 'Importar Romaneios', icon: FileUp, roles: ['ADMIN', 'OPERACIONAL', 'GESTOR'] },
    { id: 'VIAGENS', label: 'Viagens & Fretes', icon: Navigation, roles: ['ADMIN', 'FINANCEIRO', 'OPERACIONAL', 'GESTOR', 'MOTORISTA'] },
    { id: 'MOTORISTAS', label: 'Motoristas', icon: Users, roles: ['ADMIN', 'OPERACIONAL', 'GESTOR'] },
    { id: 'ACERTOS', label: 'Acerto de Fretes', icon: Calculator, roles: ['ADMIN', 'FINANCEIRO', 'GESTOR', 'MOTORISTA'] },
    { id: 'FINANCEIRO', label: 'Financeiro', icon: DollarSign, roles: ['ADMIN', 'FINANCEIRO', 'GESTOR'] },
    { id: 'FROTA', label: 'Frota de Veículos', icon: Truck, roles: ['ADMIN', 'OPERACIONAL', 'GESTOR'] },
    { id: 'CLIENTES', label: 'Clientes & Fornecedores', icon: Building2, roles: ['ADMIN', 'FINANCEIRO', 'OPERACIONAL'] },
    { id: 'RELATORIOS', label: 'Relatórios', icon: BarChart3, roles: ['ADMIN', 'FINANCEIRO', 'OPERACIONAL', 'GESTOR'] },
    { id: 'USUARIOS', label: 'Usuários & Permissões', icon: ShieldCheck, roles: ['ADMIN', 'FINANCEIRO', 'GESTOR'] },
    { id: 'CONFIG', label: 'Configurações', icon: Settings, roles: ['ADMIN'] },
  ];

  const handleLogout = () => {
    DB.logout();
    setCurrentUser(null);
    setUserDropdownOpen(false);
  };

  // Se não estiver logado, exibe a tela de login inicial
  if (!currentUser) {
    return <Login onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  // Verificar se o usuário atual tem permissão para a aba
  const itemAtual = navigationItems.find(i => i.id === activeTab);
  const temPermissao = itemAtual ? itemAtual.roles.includes(currentUser.role) : true;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Topbar Mobile */}
      <div className="md:hidden bg-[#0A192F] text-white p-4 flex justify-between items-center border-b border-slate-800 z-50">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-500 rounded-lg text-[#0A192F]">
            <Truck size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-base block leading-none">TransLog Pro</span>
            <span className="text-[10px] text-emerald-400 font-medium">Gestão Integrada</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLogout}
            title="Deslogar e trocar de conta"
            className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-bold flex items-center space-x-1 cursor-pointer"
          >
            <LogOut size={14} />
            <span className="text-[10px]">Sair</span>
          </button>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-200 cursor-pointer"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Sidebar Lateral Principal (Azul Marinho Corporativo #0A192F) */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#0A192F] text-slate-300 flex flex-col justify-between
        transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out shadow-lg md:shadow-none
      `}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Brand TransLog Pro */}
          <div className="p-5 border-b border-slate-800/90">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500 text-[#0A192F] rounded-xl shadow-xs">
                <Truck size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <h1 className="font-extrabold text-white text-lg tracking-tight leading-none">TransLog Pro</h1>
                <p className="text-[11px] text-emerald-400 font-semibold mt-1">Gestão de Transportadora</p>
              </div>
            </div>
          </div>

          {/* Menus com Scroll */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Módulos Operacionais
            </div>

            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const autorizado = item.roles.includes(currentUser.role);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer
                    ${isActive 
                      ? 'bg-blue-900/70 text-white border-l-4 border-emerald-400 font-bold pl-2.5 shadow-xs' 
                      : autorizado 
                        ? 'hover:bg-slate-800/70 text-slate-300 hover:text-white' 
                        : 'opacity-40 hover:opacity-70 text-slate-400'}
                  `}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon size={17} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>
                  {!autorizado && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      Restrito
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Rodapé do Menu com Usuário Ativo e Logout */}
          <div className="p-3.5 border-t border-slate-800/90 bg-[#071324] text-xs">
            <div className="flex items-center justify-between">
              <div className="truncate mr-2">
                <div className="font-bold text-white text-[11px] truncate">{currentUser.nome}</div>
                <div className="text-[10px] text-emerald-400 font-semibold">{currentUser.role}</div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    setActiveTab('USUARIOS');
                    setMobileMenuOpen(false);
                  }}
                  title="Trocar Perfil / Simular Sessão"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                >
                  <Key size={14} />
                </button>
                <button
                  onClick={handleLogout}
                  title="Deslogar e trocar de conta"
                  className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 cursor-pointer transition-colors"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo Central */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Top Header Desktop */}
        <header className="mb-6 hidden md:flex justify-between items-center bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400">TransLog Pro</span>
            <ChevronRight size={14} className="text-slate-300" />
            <h2 className="text-sm font-bold text-slate-800">
              {navigationItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-slate-600">{cfg.nomeFantasia}</span>
            </div>
            <div className="h-4 w-px bg-slate-200"></div>
            <span className="text-slate-400">Tarifa Base: <strong>R$ {cfg.valorFretePadrao.toFixed(2)}</strong></span>
            <div className="h-4 w-px bg-slate-200"></div>
            
            {/* Bloco de Usuário, Perfil e Deslogar (Target do Focus Mode) */}
            <div className="relative flex items-center space-x-2">
              <div 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-xl cursor-pointer transition-colors border border-slate-200/80"
                title="Opções do usuário"
              >
                <div className="w-5 h-5 rounded-md bg-blue-900 text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser.nome.charAt(0)}
                </div>
                <div className="flex items-center space-x-1.5 text-slate-700">
                  <Shield size={14} className="text-blue-700" />
                  <span className="font-bold">{currentUser.role}</span>
                </div>
                <ChevronRight size={13} className={`text-slate-400 transition-transform ${userDropdownOpen ? 'rotate-90' : ''}`} />
              </div>

              {/* Botão de Deslogar Direto */}
              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl transition-colors cursor-pointer flex items-center space-x-1 text-xs font-bold"
                title="Deslogar e logar com outra conta"
              >
                <LogOut size={14} className="text-rose-600" />
                <span>Sair</span>
              </button>

              {/* Dropdown de opções rápidas de sessão */}
              {userDropdownOpen && (
                <div className="absolute right-0 top-11 mt-1 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50">
                  <div className="px-2.5 py-2 border-b border-slate-100 mb-1.5">
                    <div className="font-bold text-slate-900 text-xs truncate">{currentUser.nome}</div>
                    <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
                    <div className="mt-1 inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-800">
                      Perfil: {currentUser.role}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setActiveTab('USUARIOS');
                    }}
                    className="w-full px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Key size={14} className="text-slate-400" />
                    <span>Ver Permissões e Perfis</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full px-2.5 py-2 text-left text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer mt-1"
                  >
                    <LogOut size={14} className="text-rose-600" />
                    <span>Deslogar / Trocar de Conta</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Verificação de Permissão de Acesso */}
        {!temPermissao ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-xs max-w-lg mx-auto my-12">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Acesso Restrito pelo Perfil</h3>
            <p className="text-xs text-slate-500 mt-2">
              Seu perfil de acesso atual (<strong>{currentUser.role}</strong>) não possui permissão para gerenciar este módulo.
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={() => setActiveTab('DASHBOARD')}
                className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Retornar ao Dashboard
              </button>
              <button
                onClick={() => setActiveTab('USUARIOS')}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Alternar Perfil
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'DASHBOARD' && <Dashboard onNavigate={(tab) => setActiveTab(tab)} />}
            {activeTab === 'ROMANEIOS' && <ImportarRomaneios onSuccessNavigate={() => setActiveTab('VIAGENS')} />}
            {activeTab === 'VIAGENS' && <Viagens />}
            {activeTab === 'MOTORISTAS' && <Motoristas />}
            {activeTab === 'ACERTOS' && <AcertoMotoristas />}
            {activeTab === 'FINANCEIRO' && <Financeiro />}
            {activeTab === 'FROTA' && <Frota />}
            {activeTab === 'CLIENTES' && <ClientesFornecedores />}
            {activeTab === 'RELATORIOS' && <Relatorios />}
            {activeTab === 'USUARIOS' && (
              <Usuarios 
                currentUser={currentUser} 
                onUserChanged={(u) => setCurrentUser(u)} 
                onLogout={handleLogout}
              />
            )}
            {activeTab === 'CONFIG' && <Configuracoes />}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
