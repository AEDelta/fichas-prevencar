
import React, { useState } from 'react';
import { ViewState } from '../types';
import { KeyRound, Check, Shield, AlertTriangle, Mail, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { sendPasswordResetEmail, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../firebase';

interface ForgotPasswordProps {
  changeView: (view: ViewState) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ changeView }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setStep(2);
    } catch (error: any) {
      console.error('sendPasswordResetEmail error:', error);
      const code = error?.code || '';
      const friendly = code === 'auth/user-not-found'
        ? 'E-mail não cadastrado no sistema.'
        : code === 'auth/invalid-email'
        ? 'E-mail inválido. Verifique o formato.'
        : 'Erro ao enviar código. Verifique sua conexão e o e-mail.';
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não correspondem.');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (!code.trim()) {
      setError('Informe o código recebido no e-mail.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, code, newPassword);
      setStep(3);
    } catch (error: any) {
      console.error('confirmPasswordReset error:', error);
      const code = error?.code || '';
      const errorMsg = code === 'auth/invalid-action-code'
        ? 'Código inválido ou expirado. Solicite um novo.'
        : code === 'auth/weak-password'
        ? 'A senha é muito fraca. Escolha uma senha com 6+ caracteres.'
        : error.message || 'Erro ao redefinir senha.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4 relative overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 border-t-8 border-brand-mauve animate-fade-in relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-brand-mauve p-4 rounded-2xl mb-4 shadow-lg shadow-pink-100">
             <KeyRound className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Nova Senha</h2>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendEmail} className="space-y-6">
            <p className="text-gray-500 text-center text-sm">Informe seu e-mail para receber um código de reset.</p>
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-2"><AlertTriangle size={16}/> {error}</div>}
            <Input label="E-mail Corporativo" type="email" placeholder="nome@prevencar.com.br" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <div className="space-y-2">
              <Button type="submit" className="w-full h-14 font-black" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Código'}
              </Button>
              <Button type="button" variant="outline" className="w-full h-14" onClick={() => changeView(ViewState.LOGIN)}>Voltar</Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 text-sm font-semibold flex items-center gap-2">
                <Mail size={16} /> Código enviado para: <strong>{email}</strong>
              </p>
            </div>
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-2"><AlertTriangle size={16}/> {error}</div>}
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Lock size={16} /> Código de Reset
              </label>
              <input
                type="text"
                placeholder="Cole o código do e-mail aqui"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-mauve focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Verifique sua caixa de entrada (e spam) e copie o código recebido.</p>
            </div>

            <Input
              label="Nova Senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              label="Confirmar Senha"
              type="password"
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="space-y-2">
              <Button type="submit" className="w-full h-14 font-black" disabled={loading}>
                {loading ? 'Atualizando...' : 'Redefinir Senha'}
              </Button>
              <Button type="button" variant="outline" className="w-full h-14" onClick={() => { setStep(1); setCode(''); setNewPassword(''); setConfirmPassword(''); setError(''); }}>
                Voltar
              </Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="text-center space-y-8">
            <div className="bg-green-50 p-8 rounded-3xl border border-green-100 flex flex-col items-center">
                <Check size={64} className="text-green-600 mb-4 animate-bounce"/>
              <p className="font-black text-xl text-green-800">Senha Redefinida!</p>
              <p className="text-sm text-green-600 mt-2">Sua senha foi atualizada com sucesso. Faça login com a nova senha.</p>
            </div>
            <Button className="w-full h-14 font-black" onClick={() => changeView(ViewState.LOGIN)}>Ir para Login</Button>
          </div>
        )}
      </div>
    </div>
  );
};
