'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type UserRole = 'administrador' | 'gerente' | 'instalador';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  displayName: string | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  displayName: null,
  loading: true,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (currentUser: User) => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const dbRole = data.role as UserRole;
        const dbDisplayName = data.displayName || currentUser.email?.split('@')[0] || '';
        const isMaster = currentUser.email === 'sammyanbr@gmail.com' || currentUser.email === 'zrpg01@gmail.com';
        
        setDisplayName(dbDisplayName);
        if (isMaster && dbRole !== 'administrador') {
          await setDoc(userDocRef, { role: 'administrador' }, { merge: true });
          setRole('administrador');
        } else {
          setRole(dbRole);
        }
      } else {
        const newRole: UserRole = (currentUser.email === 'sammyanbr@gmail.com' || currentUser.email === 'zrpg01@gmail.com') ? 'administrador' : 'instalador';
        const initialDisplayName = currentUser.email?.split('@')[0] || '';
        
        await setDoc(userDocRef, {
          email: currentUser.email,
          role: newRole,
          displayName: initialDisplayName,
          createdAt: serverTimestamp()
        });
        setRole(newRole);
        setDisplayName(initialDisplayName);
      }
    } catch (error) {
      console.error("Erro ao buscar/criar perfil do usuário:", error);
      setRole(null);
      setDisplayName(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setRole(null);
        setDisplayName(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, displayName, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
