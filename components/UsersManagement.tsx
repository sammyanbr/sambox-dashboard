'use client';
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Shield, User, Trash2, Info } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  role: 'administrador' | 'gerente' | 'instalador';
  createdAt: any;
}

interface UsersManagementProps {
  currentRole: string | null;
  currentUserEmail: string | undefined | null;
}

export default function UsersManagement({ currentRole, currentUserEmail }: UsersManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = currentRole === 'administrador' || currentUserEmail === 'sammyanbr@gmail.com' || currentUserEmail === 'zrpg01@gmail.com';
  const isGerente = currentRole === 'gerente' || isAdmin;

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: UserProfile[] = [];
      snapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(usersData);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError('Erro ao carregar usuários.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    // Gerente cannot promote to admin
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

  const handleDeleteUser = async (userToDelete: UserProfile) => {
    // Gerente can only delete installers
    if (!isAdmin && userToDelete.role !== 'instalador') {
      alert('Gerentes só podem excluir instaladores.');
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
              ? "Você tem controle total sobre os usuários do sistema." 
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
                <th className="px-6 py-4">Nível de Acesso</th>
                <th className="px-6 py-4">Data de Cadastro</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => {
                const canEdit = isAdmin || (isGerente && u.role === 'instalador');
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
                      {canEdit && !isSelf ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                          {isAdmin && <option value="administrador">Administrador</option>}
                          <option value="gerente">Gerente</option>
                          <option value="instalador">Instalador</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          u.role === 'administrador' ? 'bg-purple-500/10 text-purple-500' :
                          u.role === 'gerente' ? 'bg-blue-500/10 text-blue-500' :
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
    </div>
  );
}
