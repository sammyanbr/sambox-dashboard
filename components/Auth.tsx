'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, limit } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Activity, Mail, Lock, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Captcha State
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaInput, setCaptchaInput] = useState('');

  // Fallback master code if needed
  const MASTER_CODE = 'SAMBOX2024';

  const generateCaptcha = useCallback(() => {
    setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
    setCaptchaInput('');
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha, isLogin]);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Por favor, preencha o campo de email para redefinir a senha.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setMessage('');
      await sendPasswordResetEmail(auth, email);
      setMessage('Email de redefinição de senha enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/quota-exceeded') {
        setError('Limite diário de envio de emails do Firebase excedido. Tente novamente mais tarde.');
      } else {
        setError('Erro ao enviar email de redefinição. Verifique se o email está correto.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (parseInt(captchaInput) !== (captchaNum1 + captchaNum2)) {
      setError('Verificação de segurança falhou (Soma incorreta). Tente novamente.');
      generateCaptcha();
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        let codeDocRef = null;
        
        if (accessCode !== MASTER_CODE) {
          // Check Firestore for a valid one-time invite code
          const codesRef = collection(db, 'inviteCodes');
          const q = query(codesRef, where('code', '==', accessCode), where('used', '==', false), limit(1));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            setError('Código de convite inválido ou já utilizado.');
            generateCaptcha();
            setLoading(false);
            return;
          }
          
          codeDocRef = querySnapshot.docs[0].ref;
        }

        // Proceed to create user
        await createUserWithEmailAndPassword(auth, email, password);
        
        // Mark code as used if a valid document was found
        if (codeDocRef) {
           await updateDoc(codeDocRef, {
             used: true,
             usedBy: email,
             usedAt: serverTimestamp()
           });
        }
      }
    } catch (err: any) {
      console.error(err);
      generateCaptcha(); // Refresh captcha on failure
      const errorMessage = err.message || '';
      const errorCode = err.code || '';
      
      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorMessage.includes('auth/invalid-credential') || errorMessage.includes('auth/user-not-found') || errorMessage.includes('auth/wrong-password')) {
        // Se tentar logar e a conta não existir, avisa para criar
        setError('Conta não encontrada ou senha incorreta. Tente redefinir a senha ou criar a conta.');
      } else if (errorCode === 'auth/email-already-in-use' || errorMessage.includes('auth/email-already-in-use')) {
        setError('Este email já está em uso. Tente fazer login.');
      } else if (errorCode === 'auth/weak-password' || errorMessage.includes('auth/weak-password')) {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError(errorMessage ? `Erro: ${errorMessage}` : 'Ocorreu um erro. Verifique as credenciais ou sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000d1a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden">
            <img src="/samboxlogo.fw.png" alt="Sambox Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-white tracking-tight uppercase italic">
          Sambox <span className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">Dashboard</span>
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400 font-medium">
          {isLogin ? 'Entre na sua conta para continuar' : 'Crie sua conta para acessar o sistema'}
        </p>
        <p className="mt-2 text-center text-xs text-blue-400/80 font-medium bg-blue-500/10 py-1.5 px-3 rounded-lg inline-block w-full">
          Credenciais de administrador preenchidas por padrão.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#0a0a0a] py-8 px-4 shadow-2xl border border-white/10 sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-400 font-medium">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-sm text-green-400 font-medium">{message}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 bg-[#111111] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors sm:text-sm"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
                  Senha
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 bg-[#111111] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Código de Acesso
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    required={!isLogin}
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-[#111111] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors sm:text-sm uppercase"
                    placeholder="CÓDIGO DE CONVITE"
                  />
                </div>
                <p className="mt-2 text-[10px] text-gray-500 ml-1">
                  Necessário um código válido para criar a conta.
                </p>
              </div>
            )}

            <div className="bg-[#111111] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Verificação de Segurança
              </label>
              <div className="flex items-center gap-3">
                <div className="bg-[#0a0a0a] px-4 py-3 rounded-lg border border-white/5 text-white font-bold tracking-widest shrink-0">
                  {captchaNum1} + {captchaNum2} =
                </div>
                <input
                  type="number"
                  required
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className="block w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors sm:text-sm text-center"
                  placeholder="?"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] text-sm font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Cadastrar'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#0a0a0a] text-gray-500 font-medium">
                  {isLogin ? 'Novo por aqui?' : 'Já tem uma conta?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="w-full flex justify-center py-4 px-4 border border-white/10 rounded-xl text-sm font-black uppercase tracking-widest text-gray-300 bg-white/5 hover:bg-white/10 focus:outline-none transition-all"
              >
                {isLogin ? 'Criar uma conta' : 'Fazer login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
