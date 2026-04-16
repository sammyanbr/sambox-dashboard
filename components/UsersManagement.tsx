'use client';
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Shield, User, Trash2, Info, Key, Plus, Copy, CheckCircle2 } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  role: 'administrador' | 'gerente' | 'instalador' | 'afiliado';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

interface InviteCode {
  id: string;
  code: string;
  used: boolean;
  createdBy: string;
  createdAt: any;
  usedBy?: string;
  usedAt?: any;
}

interface UsersManagementProps {
  currentRole: string | null;
  currentUserEmail: string | undefined | null;
}

export default function UsersManagement({ currentRole, currentUserEmail }: UsersManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const isAdmin = currentRole === 'administrador' || currentUserEmail === 'sammyanbr@gmail.com' || currentUserEmail === 'zrpg01@gmail.com';
  const isGerente = currentRole === 'gerente' || isAdmin;

  useEffect(() => {
    const qUsers = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const usersData: UserProfile[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({ 
          id: doc.id, 
          ...data,
          status: data.status || 'pending'
        } as UserProfile);
      });
      setUsers(usersData);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError('Erro ao carregar usuários.');
      setLoading(false);
    });

    let unsubscribeCodes = () => {};
    if (isGerente) {
      const qCodes = query(collection(db, 'inviteCodes'), orderBy('createdAt', 'desc'));
      unsubscribeCodes = onSnapshot(qCodes, (snapshot) => {
        const codesData: InviteCode[] = [];
        snapshot.forEach((doc) => {
          codesData.push({ id: doc.id, ...doc.data() } as InviteCode);
        });
        setInviteCodes(codesData);
      });
    }

    return () => {
      unsubscribeUsers();
      unsubscribeCodes();
    };
  }, [isGerente]);

  const handleGenerateInviteCode = async () => {
    if (!isGerente) return;
    try {
      const randomString = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const newCode = `SBOX-${randomString}`;
      await addDoc(collection(db, 'inviteCodes'), {
        code: newCode,
        used: false,
        createdBy: currentUserEmail,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar código de convite.');
    }
  };

  const handleDeleteInviteCode = async (id: string) => {
    if (!isGerente) return;
    if (confirm('Tem certeza que deseja excluir este código de convite?')) {
      try {
        await deleteDoc(doc(db, 'inviteCodes', id));
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir código.');
      }
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isAdmin && newRole === 'administrador') {
      alert('Apenas administradores podem promover usuários a Administrador.');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar nível de acesso.');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    if (!isAdmin) {
      alert('Apenas administradores podem aprovar ou rejeitar usuários.');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status do usuário.');
    }
  };

  const handleDeleteUser = async (userToDelete: UserProfile) => {
    if (!isAdmin && userToDelete.role !== 'instalador' && userToDelete.role !== 'afiliado') {
      alert('Gerentes só podem excluir instaladores e afiliados.');
      return;
    }

    if (userToDelete.email === currentUserEmail) {
      alert('Você não pode excluir sua própria conta.');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o usuário ${userToDelete.email}? Ele perderá o acesso.`)) {
      try {
        await deleteDoc(doc(db, 'users', userToDelete.id));
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir usuário.');
      }
    }
  };

  if (loading) return <div className="p-6 text-white">Carregando usuários...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300/80">
          <p className="font-bold text-blue-400 mb-1">Gestão de Equipe</p>
          <p>
            {isAdmin 
              ? "Você tem controle total sobre os usuários do sistema. Novos usuários precisam ser aprovados." 
              : "Como Gerente, você pode gerenciar os instaladores da equipe."}
          </p>
        </div>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-white/5 text-xs uppercase font-black tracking-wider text-gray-400">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Nível de Acesso</th>
                <th className="px-6 py-4">Data de Cadastro</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => {
                const canEdit = isAdmin || (isGerente && (u.role === 'instalador' || u.role === 'afiliado'));
                const isSelf = u.email === currentUserEmail;

                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex flex-col">
                        <span>{u.email}</span>
                        {isSelf && <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Você</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isAdmin && !isSelf ? (
                        <select
                          value={u.status}
                          onChange={(e) => handleStatusChange(u.id, e.target.value)}
                          className={`bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 ${
                            u.status === 'approved' ? 'text-emerald-500' :
                            u.status === 'rejected' ? 'text-red-500' :
                            'text-yellow-500'
                          }`}
                        >
                          <option value="pending">Pendente</option>
                          <option value="approved">Aprovado</option>
                          <option value="rejected">Rejeitado</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          u.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                          u.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                          'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {u.status === 'approved' ? 'Aprovado' : u.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {canEdit && !isSelf ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                          {isAdmin && <option value="administrador">Administrador</option>}
                          <option value="gerente">Gerente</option>
                          <option value="instalador">Instalador</option>
                          <option value="afiliado">Afiliado</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          u.role === 'administrador' ? 'bg-purple-500/10 text-purple-500' :
                          u.role === 'gerente' ? 'bg-blue-500/10 text-blue-500' :
                          u.role === 'afiliado' ? 'bg-orange-500/10 text-orange-500' :
                          'bg-gray-500/10 text-gray-500'
                        }`}>
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString('pt-BR') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canEdit && !isSelf && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          title="Excluir Usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isGerente && (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden mt-8">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-widest uppercase italic">Códigos de Convite</h3>
                <p className="text-xs text-gray-500 font-medium">Gere códigos únicos para novos cadastros no sistema.</p>
              </div>
            </div>
            <button
              onClick={handleGenerateInviteCode}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:scale-105"
            >
              <Plus className="w-4 h-4" /> Novo Código
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-white/5 text-xs uppercase font-black tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Criado Em</th>
                  <th className="px-6 py-4">Uso (Email)</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {inviteCodes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">
                      Nenhum código gerado ainda.
                    </td>
                  </tr>
                ) : (
                  inviteCodes.map((codeDoc) => (
                    <tr key={codeDoc.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 font-mono text-purple-400 font-bold tracking-widest">
                        {codeDoc.code}
                      </td>
                      <td className="px-6 py-4">
                        {codeDoc.used ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20">
                            Usado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Disponível
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                         {codeDoc.createdAt?.toDate ? codeDoc.createdAt.toDate().toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {codeDoc.usedBy || '-'}
                      </td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        {!codeDoc.used && (
                           <button
                             onClick={() => copyToClipboard(codeDoc.code)}
                             className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                             title="Copiar Código"
                           >
                             {copiedCode === codeDoc.code ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                           </button>
                        )}
                        <button
                          onClick={() => handleDeleteInviteCode(codeDoc.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                          title="Excluir Código"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
