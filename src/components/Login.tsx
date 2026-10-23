import React, { useState } from 'react';
import { DB, MOCK_USERS } from '../services/db';
import { User, UserRole } from '../types';
import { 
  Truck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  Shield,
  HelpCircle
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [modalRecuperacao, setModalRecuperacao] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [msgRecuperacao, setMsgRecuperacao] = useState<string | null>(null);

  const cfg = DB.getConfig();

  const handleLoginManual = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!email.trim() || !senha.trim()) {
      setErro('Informe o e-mail (ou usuário) e a senha de acesso.');
      return;
    }

    setCarregando(true);

    // Simulação de validação
    setTimeout(() => {
      // Procura usuário cadastrado ou mapeia por email/role
      const userEncontrado = MOCK_USERS.find(u => 
        u.email.toLowerCase() === email.trim().toLowerCase() ||
        u.nome.toLowerCase().includes(email.trim().toLowerCase())
      );

      if (userEncontrado) {
        DB.login(userEncontrado);
        setCarregando(false);
        onLoginSuccess(userEncontrado);
      } else {
        // Se digitou qualquer outro e-mail válido, cria ou autentica como Operador
        const novoUser: User = {
          id: 'usr-' + Date.now(),
          nome: email.split('@')[0],
          email: email.trim(),
          role: 'ADMIN' // Por padrão dá acesso para teste livre
        };
        DB.login(novoUser);
        setCarregando(false);
        onLoginSuccess(novoUser);
      }
    }, 400);
  };

  const handleLoginRapido = (u: User) => {
    setCarregando(true);
    setErro(null);
    setTimeout(() => {
      DB.login(u);
      setCarregando(false);
      onLoginSuccess(u);
    }, 250);
  };

  const handleEnviarRecuperacao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRecuperacao.trim()) return;
    setMsgRecuperacao(`Link de recuperação enviado com sucesso para ${emailRecuperacao}. Verifique sua caixa de entrada.`);
    setTimeout(() => {
      setModalRecuperacao(false);
      setMsgRecuperacao(null);
      setEmailRecuperacao('');
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-[#071324] flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Background Decorativo Geométrico */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600 blur-3xl"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-emerald-600 blur-3xl"></div>
      </div>

      {/* Header Superior */}
      <header className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500 text-[#0A192F] rounded-2xl shadow-md">
            <Truck size={24} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-white text-xl tracking-tight block leading-none">TransLog Pro</span>
            <span className="text-xs text-emerald-400 font-medium">Gestão Integrada de Transportes</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Ambiente Seguro • TLS 256-bit</span>
        </div>
      </header>

      {/* Card Central de Login */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Topo do Card */}
          <div className="bg-[#0A192F] p-8 text-white text-center border-b border-slate-800">
            <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl mb-3 border border-emerald-500/20">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Acesso ao Sistema</h1>
            <p className="text-xs text-slate-400 mt-1">
              {cfg.nomeFantasia} • Pátio Operacional
            </p>
          </div>

          <div className="p-8">
            {erro && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={handleLoginManual} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  E-mail ou Usuário
                </label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ex: roberto@translogpro.com.br"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-700 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Senha de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => setModalRecuperacao(true)}
                    className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-700 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lembrar}
                    onChange={e => setLembrar(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-900 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span>Lembrar meu acesso</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full mt-2 py-3 bg-[#0A192F] hover:bg-[#1E3A8A] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-60"
              >
                <span>{carregando ? 'Validando Credenciais...' : 'Entrar no TransLog Pro'}</span>
                {!carregando && <ArrowRight size={16} className="text-emerald-400" />}
              </button>
            </form>

            {/* Divisor */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Ou entre com 1 clique (Acesso de Teste)
              </span>
            </div>

            {/* Acesso Rápido por Perfil / Role */}
            <div className="space-y-2">
              <span className="text-[11px] text-slate-500 font-medium block text-center mb-2">
                Selecione o perfil desejado para demonstrar os módulos:
              </span>

              <div className="grid grid-cols-1 gap-1.5">
                {MOCK_USERS.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleLoginRapido(u)}
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 border border-slate-200 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="truncate mr-2">
                      <div className="text-xs font-bold text-slate-800 truncate">{u.nome}</div>
                      <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'FINANCEIRO' ? 'bg-blue-100 text-blue-800' :
                      u.role === 'OPERACIONAL' ? 'bg-amber-100 text-amber-800' :
                      u.role === 'GESTOR' ? 'bg-sky-100 text-sky-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rodapé do Card */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400 flex items-center justify-center space-x-1.5">
            <Shield size={12} className="text-emerald-600" />
            <span>TransLog Pro • Em conformidade com a LGPD</span>
          </div>
        </div>
      </div>

      {/* Footer Geral */}
      <footer className="relative z-10 p-6 text-center text-xs text-slate-500 border-t border-slate-900/60 max-w-7xl mx-auto w-full">
        <div>{cfg.razaoSocial} • CNPJ: {cfg.cnpj}</div>
        <div className="text-[11px] text-slate-600 mt-1">
          Suporte e Operações: {cfg.telefone} • {cfg.email}
        </div>
      </footer>

      {/* Modal Esqueci a Senha */}
      {modalRecuperacao && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Recuperação de Senha</h3>
            <p className="text-xs text-slate-500 mb-4">
              Informe o seu e-mail cadastrado para receber as instruções seguras de redefinição de acesso.
            </p>

            {msgRecuperacao ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>{msgRecuperacao}</span>
              </div>
            ) : (
              <form onSubmit={handleEnviarRecuperacao} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Seu E-mail Corporativo</label>
                  <input
                    type="email"
                    required
                    value={emailRecuperacao}
                    onChange={e => setEmailRecuperacao(e.target.value)}
                    placeholder="nome@translogpro.com.br"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalRecuperacao(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Enviar Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
