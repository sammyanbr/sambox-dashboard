'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Download, 
  Plus, 
  Calendar,
  Activity,
  Megaphone,
  Smartphone,
  Users,
  MessageCircle,
  Clock,
  UserCheck,
  Trash2,
  LogOut,
  Edit2,
  Check,
  Key,
  User,
  Info,
  Shield,
  Copy,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight,
  Video,
  Play,
  X,
  Percent,
  Gamepad2,
  Menu,
  Home
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../lib/firebase';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where,
  or,
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import UsersManagement from './UsersManagement';
import RichTextEditor from './RichTextEditor';
import 'react-quill-new/dist/quill.snow.css';

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  createdBy: string;
  createdAt: any;
}

export default function Dashboard() {
  const { user, role, displayName, photoURL, refreshProfile } = useAuth();
  const isAdmin = role === 'administrador' || user?.email === 'sammyanbr@gmail.com' || user?.email === 'zrpg01@gmail.com';
  const isGerente = role === 'gerente' || isAdmin;
  const isAfiliado = role === 'afiliado';
  const [activeMainTab, setActiveMainTab] = useState<'home' | 'financeiro' | 'instalacoes' | 'keys' | 'others' | 'usuarios' | 'videos' | 'perfil' | 'postar_aviso'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeMainTab');
      if (saved) return saved as any;
    }
    return 'home';
  });
  const [activeSubTab, setActiveSubTab] = useState<'novo' | 'historico' | 'zap' | 'vendas' | 'galeria' | 'afiliados' | 'denuvo' | 'cupons_steam' | 'cupons_sambox'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeSubTab');
      if (saved) return saved as any;
    }
    return 'novo';
  });

  React.useEffect(() => {
    localStorage.setItem('activeMainTab', activeMainTab);
  }, [activeMainTab]);

  React.useEffect(() => {
    localStorage.setItem('activeSubTab', activeSubTab);
  }, [activeSubTab]);

  React.useEffect(() => {
    if (isAfiliado) {
      if (['financeiro', 'instalacoes', 'usuarios', 'videos'].includes(activeMainTab)) {
        setActiveMainTab('home');
      }
      if (activeMainTab === 'others' && ['zap', 'vendas', 'denuvo', 'cupons_steam', 'cupons_sambox'].includes(activeSubTab)) {
        setActiveSubTab('afiliados');
      }
    }
  }, [isAfiliado, activeMainTab, activeSubTab]);

  const [isOthersDropdownOpen, setIsOthersDropdownOpen] = useState(false);
  const [isSteamDropdownOpen, setIsSteamDropdownOpen] = useState(false);
  const [isSamboxDropdownOpen, setIsSamboxDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Perfil State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPhotoURL, setNewPhotoURL] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // Home / Mural State
  const [noticias, setNoticias] = useState<any[]>([]);
  const [novaNoticia, setNovaNoticia] = useState({ titulo: '', conteudo: '' });
  const [editingNoticiaId, setEditingNoticiaId] = useState<string | null>(null);
  const [noticiaToDelete, setNoticiaToDelete] = useState<string | null>(null);
  const [isSubmittingNoticia, setIsSubmittingNoticia] = useState(false);
  const [noticiasCurrentPage, setNoticiasCurrentPage] = useState(1);
  const noticiasPerPage = 3;

  React.useEffect(() => {
    const q = query(collection(db, 'noticias'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNoticias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => {
      console.error('Error fetching noticias:', error);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateNoticia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaNoticia.titulo || !novaNoticia.conteudo || !user) return;
    setIsSubmittingNoticia(true);
    try {
      if (editingNoticiaId) {
        await updateDoc(doc(db, 'noticias', editingNoticiaId), {
          titulo: novaNoticia.titulo,
          conteudo: novaNoticia.conteudo,
          updatedAt: new Date().toISOString(),
          updatedBy: user.uid,
          authorPhotoURL: photoURL || ''
        });
        setEditingNoticiaId(null);
      } else {
        await addDoc(collection(db, 'noticias'), {
          titulo: novaNoticia.titulo,
          conteudo: novaNoticia.conteudo,
          author: displayName || user.email,
          authorId: user.uid,
          authorPhotoURL: photoURL || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      setNovaNoticia({ titulo: '', conteudo: '' });
      setActiveMainTab('home');
      window.scrollTo(0, 0);
      setProfileMessage({ text: "Notícia salva com sucesso!", type: 'success' });
      setTimeout(() => setProfileMessage({ text: '', type: 'success' }), 3000);
    } catch (err) {
      console.error("Erro ao salvar noticia:", err);
      alert("Erro ao salvar notícia.");
    } finally {
      setIsSubmittingNoticia(false);
    }
  };

  const startEditingNoticia = (noticia: any) => {
    setEditingNoticiaId(noticia.id);
    setNovaNoticia({ titulo: noticia.titulo, conteudo: noticia.conteudo });
    setActiveMainTab('postar_aviso');
    window.scrollTo(0, 0);
  };

  const cancelEditingNoticia = () => {
    setEditingNoticiaId(null);
    setNovaNoticia({ titulo: '', conteudo: '' });
    setActiveMainTab('home');
  };

  const handleDeleteNoticia = (id: string) => {
    setNoticiaToDelete(id);
  };

  const confirmDeleteNoticia = async () => {
    if (!noticiaToDelete) return;
    try {
      await deleteDoc(doc(db, 'noticias', noticiaToDelete));
      setNoticiaToDelete(null);
    } catch (err) {
      console.error("Erro ao deletar noticia:", err);
      alert("Erro ao excluir notícia.");
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    setProfileMessage({ type: '', text: '' });
    try {
      const updates: any = {};
      if (newDisplayName.trim()) updates.displayName = newDisplayName.trim();
      if (newPhotoURL.trim()) updates.photoURL = newPhotoURL.trim();
      
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'users', user.uid), updates);
        await refreshProfile();
        setIsEditingProfile(false);
        setProfileMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      } else {
        setProfileMessage({ type: 'error', text: 'Nenhuma alteração para salvar.' });
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setProfileMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setProfileMessage({ type: '', text: '' });
    try {
      await sendPasswordResetEmail(auth, user.email);
      setProfileMessage({ type: 'success', text: 'Email de redefinição enviado! Verifique sua caixa de entrada.' });
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/quota-exceeded') {
        setProfileMessage({ type: 'error', text: 'Limite de envio atingido no Firebase. Tente novamente mais tarde.' });
      } else {
        setProfileMessage({ type: 'error', text: 'Erro ao enviar email de redefinição de senha.' });
      }
    }
  };

  // Financeiro State
  const [despesasFixas, setDespesasFixas] = useState<{id: string, valor: number, descricao: string}[]>([]);
  const [isEditingDespesas, setIsEditingDespesas] = useState(false);
  const [novaDespesa, setNovaDespesa] = useState({ valor: '', descricao: '' });

  const totalDespesasFixas = despesasFixas.reduce((acc, curr) => acc + curr.valor, 0);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [isFetchingTransactions, setIsFetchingTransactions] = useState(false);

  // KeyAuth State
  const [keyAuthSellerKey, setKeyAuthSellerKey] = useState('b01f1b891124badd9be270a3db589cf6');
  const [isSavingSellerKey, setIsSavingSellerKey] = useState(false);

  // Fetch Despesas Fixas and Settings
  React.useEffect(() => {
    // Fetch Settings (KeyAuth Seller Key) for all users so they can generate keys
    const settingsRef = doc(db, 'settings', 'keyauth');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().keyAuthSellerKey) {
        setKeyAuthSellerKey(docSnap.data().keyAuthSellerKey);
      }
    }, (error) => {
      console.error('Error fetching settings:', error);
    });

    let unsubscribeDespesas = () => {};
    
    // Fetch Despesas Fixas only for gerentes
    if (isGerente) {
      const qDespesas = query(collection(db, 'despesasFixas'), orderBy('updatedAt', 'desc'));
      unsubscribeDespesas = onSnapshot(qDespesas, (snapshot) => {
        const despesas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as {id: string, valor: number, descricao: string}[];
        setDespesasFixas(despesas);
      }, (error) => {
        console.error('Error fetching despesasFixas:', error);
      });
    }

    return () => {
      unsubscribeDespesas();
      unsubscribeSettings();
    };
  }, [isGerente]);

  const handleSaveSellerKey = async () => {
    setIsSavingSellerKey(true);
    try {
      await setDoc(doc(db, 'settings', 'keyauth'), { keyAuthSellerKey }, { merge: true });
      alert('Seller Key salva com sucesso!');
    } catch (error) {
      console.error('Error saving seller key:', error);
      alert('Erro ao salvar Seller Key.');
    } finally {
      setIsSavingSellerKey(false);
    }
  };

  const handleAddDespesaFixa = async () => {
    if (novaDespesa.descricao && novaDespesa.valor) {
      try {
        await addDoc(collection(db, 'despesasFixas'), {
          descricao: novaDespesa.descricao,
          valor: Number(novaDespesa.valor),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: user?.uid || 'unknown'
        });
        setNovaDespesa({ valor: '', descricao: '' });
      } catch (error) {
        console.error('Error adding despesa fixa:', error);
        alert('Erro ao adicionar despesa fixa.');
      }
    }
  };

  const handleDeleteDespesaFixa = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'despesasFixas', id));
    } catch (error) {
      console.error('Error deleting despesa fixa:', error);
      alert('Erro ao deletar despesa fixa.');
    }
  };
  const [keyAuthExpiry, setKeyAuthExpiry] = useState('30');
  const [keyAuthLevel, setKeyAuthLevel] = useState('1');
  const [keyAuthAmount, setKeyAuthAmount] = useState('1');
  const [keyAuthNote, setKeyAuthNote] = useState('');
  const [keyAuthMask, setKeyAuthMask] = useState('SAMBOX-******');
  const [generatedKeys, setGeneratedKeys] = useState<{key: string, note: string, date: string}[]>([]);

  const parseNote = (note: string) => {
    if (!note) return { actualNote: '-', creator: '-' };
    const parts = note.split(' | Por: ');
    if (parts.length > 1) {
      return { actualNote: parts[0] || '-', creator: parts[1] };
    }
    if (note.startsWith('Por: ')) {
      return { actualNote: '-', creator: note.replace('Por: ', '') };
    }
    return { actualNote: note, creator: '-' };
  };

  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [keyAuthError, setKeyAuthError] = useState('');
  const [isFetchingKeys, setIsFetchingKeys] = useState(false);
  const [keyToDeleteAuth, setKeyToDeleteAuth] = useState<string | null>(null);
  const [isDeletingKey, setIsDeletingKey] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<VideoTutorial | null>(null);
  const [keySearchQuery, setKeySearchQuery] = useState('');
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [keyCurrentPage, setKeyCurrentPage] = useState(1);
  const keysPerPage = 15;

  const [editingLink, setEditingLink] = useState<{id: string, type: 'sambox' | 'steam' | 'afiliado', data: any} | null>(null);

  const parseCouponDetail = (cupom: string) => {
    if (cupom.includes(':')) {
      const parts = cupom.split(':');
      return { code: parts[0].trim(), value: parts[1].trim() };
    }
    return { code: cupom.trim(), value: '' };
  };

  const startEditingLink = (item: any, type: 'sambox' | 'steam' | 'afiliado') => {
    setEditingLink({ id: item.id, type, data: item });
    
    if (type === 'sambox') {
      setSamboxLinkFormData({
        nome: item.nome,
        valor: item.valor,
        link: item.link
      });
    } else if (type === 'steam') {
      setSteamLinkFormData({
        nome: item.nome,
        valor: item.valor,
        link: item.link
      });
    } else if (type === 'afiliado') {
      // Map existing cupons to new structured format if they are strings
      const structuredCupons = (item.cupons || []).map((c: any) => {
        if (typeof c === 'string') {
          const details = parseCouponDetail(c);
          return { codigo: details.code, valor: details.value };
        }
        return c;
      });

      if (structuredCupons.length === 0) structuredCupons.push({ codigo: '', valor: '' });

      setAfiliadoFormData({
        titulo: item.titulo,
        valorCupom: item.valorCupom,
        cupons: structuredCupons
      });
    }
  };

  const cancelEditing = () => {
    setEditingLink(null);
    setSamboxLinkFormData({ nome: '', valor: '', link: '' });
    setSteamLinkFormData({ nome: '', valor: '', link: '' });
    setAfiliadoFormData({ titulo: '', valorCupom: '', cupons: [{ codigo: '', valor: '' }] });
  };
  
  const startEditingCupom = (item: CupomItem, type: 'sambox' | 'steam') => {
    setEditingCupom({ id: item.id, type, data: item });
    
    // Map existing cupons to new structured format if they are strings (legacy support)
    const structuredCupons = (item.cupons || []).map((c: any) => {
      if (typeof c === 'string') {
        const details = parseCouponDetail(c);
        return { codigo: details.code, valor: details.value };
      }
      return c;
    });

    if (structuredCupons.length === 0) structuredCupons.push({ codigo: '', valor: '' });

    if (type === 'sambox') {
      setSamboxCupomFormData({
        nome: item.nome,
        cupons: structuredCupons
      });
    } else {
      setSteamCupomFormData({
        nome: item.nome,
        cupons: structuredCupons
      });
    }
  };

  const cancelEditingCupom = () => {
    setEditingCupom(null);
    setSamboxCupomFormData({ nome: '', cupons: [{ codigo: '', valor: '' }] });
    setSteamCupomFormData({ nome: '', cupons: [{ codigo: '', valor: '' }] });
  };

  const addCouponToForm = (type: 'afiliado' | 'samboxCupom' | 'steamCupom') => {
    if (type === 'afiliado') {
      setAfiliadoFormData(prev => ({ ...prev, cupons: [...prev.cupons, { codigo: '', valor: '' }] }));
    } else if (type === 'samboxCupom') {
      setSamboxCupomFormData(prev => ({ ...prev, cupons: [...prev.cupons, { codigo: '', valor: '' }] }));
    } else if (type === 'steamCupom') {
      setSteamCupomFormData(prev => ({ ...prev, cupons: [...prev.cupons, { codigo: '', valor: '' }] }));
    }
  };

  const removeCouponFromForm = (type: 'afiliado' | 'samboxCupom' | 'steamCupom', index: number) => {
    if (type === 'afiliado') {
      setAfiliadoFormData(prev => ({ ...prev, cupons: prev.cupons.filter((_, i) => i !== index) }));
    } else if (type === 'samboxCupom') {
      setSamboxCupomFormData(prev => ({ ...prev, cupons: prev.cupons.filter((_, i) => i !== index) }));
    } else if (type === 'steamCupom') {
      setSteamCupomFormData(prev => ({ ...prev, cupons: prev.cupons.filter((_, i) => i !== index) }));
    }
  };

  const handleCouponChange = (type: 'afiliado' | 'samboxCupom' | 'steamCupom', index: number, field: 'codigo' | 'valor', value: string) => {
    if (type === 'afiliado') {
      const newCupons = [...afiliadoFormData.cupons];
      newCupons[index] = { ...newCupons[index], [field]: value };
      setAfiliadoFormData(prev => ({ ...prev, cupons: newCupons }));
    } else if (type === 'samboxCupom') {
      const newCupons = [...samboxCupomFormData.cupons];
      newCupons[index] = { ...newCupons[index], [field]: value };
      setSamboxCupomFormData(prev => ({ ...prev, cupons: newCupons }));
    } else if (type === 'steamCupom') {
      const newCupons = [...steamCupomFormData.cupons];
      newCupons[index] = { ...newCupons[index], [field]: value };
      setSteamCupomFormData(prev => ({ ...prev, cupons: newCupons }));
    }
  };

  const generateKeyAuthKey = async () => {
    if (!keyAuthSellerKey) {
      setKeyAuthError('Por favor, insira sua Seller Key do KeyAuth.');
      return;
    }

    setIsGeneratingKey(true);
    setKeyAuthError('');
    
    try {
      const creatorName = user?.displayName || user?.email?.split('@')[0] || 'Desconhecido';
      const finalNote = keyAuthNote ? `${keyAuthNote} | Por: ${creatorName}` : `Por: ${creatorName}`;

      // KeyAuth Seller API URL
      const url = `https://keyauth.win/api/seller/?sellerkey=${keyAuthSellerKey}&type=add&expiry=${keyAuthExpiry}&mask=${keyAuthMask}&level=${keyAuthLevel}&amount=${keyAuthAmount}&note=${encodeURIComponent(finalNote)}&format=json`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        const newKeys = Array.isArray(data.keys) ? data.keys : [data.key];
        const now = new Date().toISOString();
        const keyObjects = newKeys.map((k: string) => ({
          key: k,
          note: finalNote,
          date: now,
          createdBy: user?.email || 'N/A'
        }));
        
        // Push locally to UI immediately
        setGeneratedKeys(prev => [...keyObjects, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setKeyAuthNote(''); // Clear note after success
        
        // Enviar para o Firestore para persistência (Historico)
        for (const k of keyObjects) {
          try {
            await addDoc(collection(db, 'keyAuthHistory'), k);
          } catch(err) {
            console.error("Erro salvando key no histórico interno:", err);
          }
        }
      } else {
        setKeyAuthError(data.message || 'Erro ao gerar key no KeyAuth.');
      }
    } catch (err) {
      setKeyAuthError('Erro de conexão com o KeyAuth. Verifique sua Seller Key.');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const fetchKeyAuthKeys = useCallback(async () => {
    // Nós escutamos as Keys do Firestore diretamente para não perder dado após F5 (limitação e demora da API externa)
    setIsFetchingKeys(true);
    try {
      const q = query(collection(db, 'keyAuthHistory'), orderBy('date', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const historyKeys = snapshot.docs.map(doc => ({
           id: doc.id,
           key: doc.data().key,
           note: doc.data().note,
           date: doc.data().date
        })) as {id?: string, key: string, note: string, date: string}[];
        
        setGeneratedKeys(historyKeys);
        setIsFetchingKeys(false);
      }, (error) => {
        console.error('Error fetching keyAuthHistory:', error);
        setIsFetchingKeys(false);
      });
      return unsubscribe;
    } catch (err) {
      console.error(err);
      setIsFetchingKeys(false);
    }
  }, []);

  React.useEffect(() => {
    let unsubscribe: any;
    if (activeMainTab === 'keys') {
      fetchKeyAuthKeys().then(unsub => { unsubscribe = unsub; });
    }
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [activeMainTab, fetchKeyAuthKeys]);

  const deleteKeyAuthKey = async (keyToDelete: string) => {
    setIsDeletingKey(true);
    setKeyAuthError('');
    
    try {
      const url = `https://keyauth.win/api/seller/?sellerkey=${keyAuthSellerKey}&type=del&key=${keyToDelete}&format=json`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        // Find if we have a matching ID in our generatedKeys history to delete from Firestore
        const found = generatedKeys.find(k => (k as any).key === keyToDelete);
        setGeneratedKeys(prev => prev.filter(k => k.key !== keyToDelete));
        setKeyToDeleteAuth(null);
        
        if (found && (found as any).id) {
           try {
             await deleteDoc(doc(db, 'keyAuthHistory', (found as any).id));
           } catch(e) {
             console.error('Error deleting keyAuthHistory doc', e);
           }
        }
      } else {
        setKeyAuthError(data.message || 'Erro ao deletar key no KeyAuth.');
      }
    } catch (err) {
      setKeyAuthError('Erro de conexão ao tentar deletar a key.');
    } finally {
      setIsDeletingKey(false);
    }
  };

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vendas: '',
    pix: '',
    ads_facebook: '',
    ads_google: '',
    ads_tiktok: '',
    instalacoes: '',
    extras: '',
    descricao_extra: ''
  });

  // Instalacoes State
  const [installations, setInstallations] = useState<any[]>([]);
  const [isFetchingInstallations, setIsFetchingInstallations] = useState(false);
  const [instFormData, setInstFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    instalador: ''
  });

  // Videos State
  const [videos, setVideos] = useState<VideoTutorial[]>([]);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoFormData, setVideoFormData] = useState({
    title: '',
    description: '',
    url: '',
    thumbnailUrl: ''
  });

  // Fetch Videos
  React.useEffect(() => {
    const q = query(collection(db, 'videos'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const videoList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VideoTutorial[];
      setVideos(videoList);
    }, (error) => {
      console.error("Error fetching videos:", error);
    });

    return () => unsubscribe();
  }, []);

  // Fetch Installations
  React.useEffect(() => {
    if (!user?.email) return;
    
    setIsFetchingInstallations(true);
    
    // If not gerente/admin, filter by createdBy or instalador to comply with security rules
    let q;
    if (isGerente) {
      q = query(collection(db, 'installations'), orderBy('createdAt', 'desc'));
    } else {
      q = query(
        collection(db, 'installations'), 
        or(
          where('createdBy', '==', user.email),
          where('instalador', '==', displayName || user.email.split('@')[0])
        )
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let instList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort manually to avoid requiring composite indexes in Firestore
      if (!isGerente) {
        instList = instList.sort((a: any, b: any) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
      }

      setInstallations(instList);
      setIsFetchingInstallations(false);
    }, (error) => {
      console.error("Error fetching installations:", error);
      setIsFetchingInstallations(false);
    });

    return () => unsubscribe();
  }, [user?.email, isGerente, displayName]);

  // Fetch Transactions
  React.useEffect(() => {
    if (!isGerente) return;
    
    setIsFetchingTransactions(true);
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(transList);
      setIsFetchingTransactions(false);
    }, (error) => {
      console.error("Error fetching transactions:", error);
      setIsFetchingTransactions(false);
    });

    return () => unsubscribe();
  }, [isGerente]);

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFormData.title || !videoFormData.url) return;

    setIsVideoLoading(true);
    try {
      // Simple YouTube thumbnail extractor if it's a youtube link
      let thumbUrl = videoFormData.thumbnailUrl;
      if (!thumbUrl) {
        if (videoFormData.url.includes('youtube.com/watch?v=')) {
          const videoId = videoFormData.url.split('v=')[1]?.split('&')[0];
          if (videoId) thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        } else if (videoFormData.url.includes('youtu.be/')) {
          const videoId = videoFormData.url.split('youtu.be/')[1]?.split('?')[0];
          if (videoId) thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        } else if (videoFormData.url.includes('youtube.com/shorts/')) {
          const videoId = videoFormData.url.split('shorts/')[1]?.split('?')[0];
          if (videoId) thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
      }

      await addDoc(collection(db, 'videos'), {
        ...videoFormData,
        thumbnailUrl: thumbUrl || 'https://picsum.photos/seed/video/800/450',
        createdBy: user?.email || 'Sistema',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || 'unknown'
      });

      setVideoFormData({
        title: '',
        description: '',
        url: '',
        thumbnailUrl: ''
      });
      setActiveSubTab('galeria');
    } catch (error) {
      console.error("Error adding video:", error);
      alert("Erro ao adicionar vídeo. Verifique suas permissões.");
    } finally {
      setIsVideoLoading(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes('youtube.com/shorts/')) {
      const videoId = url.split('shorts/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return url;
  };

  const handleDeleteVideo = async (videoId: string) => {
    setIsVideoLoading(true);
    try {
      await deleteDoc(doc(db, 'videos', videoId));
      setVideoToDelete(null);
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Erro ao excluir vídeo.");
    } finally {
      setIsVideoLoading(false);
    }
  };

  // Filters State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterInstalador, setFilterInstalador] = useState('');

  const [selectedExtra, setSelectedExtra] = useState<string | null>(null);

  // WhatsApp Link Generator State
  const [zapPhone, setZapPhone] = useState('');
  const [zapMessage, setZapMessage] = useState('');
  const [generatedZapLink, setGeneratedZapLink] = useState('');

  interface CouponDetail {
    codigo: string;
    valor: string;
  }

  interface CupomItem {
    id: string;
    nome: string;
    cupons: { codigo: string; valor: string }[];
    createdAt?: string;
    createdBy?: string;
  }

  // Sambox Links State
  interface QuickLink {
    id: string;
    nome: string;
    valor: string;
    link: string;
    cupons: (string | CouponDetail)[];
  }
  interface AfiliadoOferta {
    id: string;
    titulo: string;
    valorCupom: string;
    cupons: (string | CouponDetail)[];
  }
  interface DenuvoAccount {
    id: string;
    nome: string;
    email: string;
    createdAt: string;
    createdBy: string;
  }
  interface DenuvoPrint {
    id: string;
    gameName: string;
    imageUrl: string; 
    createdAt: string;
    createdBy: string;
  }
  interface DenuvoHistory {
    id: string;
    accountId: string;
    accountName: string;
    gameName: string;
    createdByDisplayName: string;
    createdAt: string;
    createdBy: string;
  }
  const [afiliadoOfertas, setAfiliadoOfertas] = useState<AfiliadoOferta[]>([]);
  const [afiliadoFormData, setAfiliadoFormData] = useState({
    titulo: '',
    valorCupom: '',
    cupons: [{ codigo: '', valor: '' }]
  });

  const [samboxLinks, setSamboxLinks] = useState<QuickLink[]>([]);
  const [samboxLinkFormData, setSamboxLinkFormData] = useState({
    nome: '',
    valor: '',
    link: ''
  });

  const [samboxCuponsList, setSamboxCuponsList] = useState<CupomItem[]>([]);
  const [samboxCupomFormData, setSamboxCupomFormData] = useState({
    nome: '',
    cupons: [{ codigo: '', valor: '' }]
  });

  // Steam Links State
  const [steamLinks, setSteamLinks] = useState<QuickLink[]>([]);
  const [steamLinkFormData, setSteamLinkFormData] = useState({
    nome: '',
    valor: '',
    link: ''
  });

  const [steamCuponsList, setSteamCuponsList] = useState<CupomItem[]>([]);
  const [steamCupomFormData, setSteamCupomFormData] = useState({
    nome: '',
    cupons: [{ codigo: '', valor: '' }]
  });

  const [editingCupom, setEditingCupom] = useState<{ id: string, type: 'sambox' | 'steam', data: any } | null>(null);
  const [cupomToDelete, setCupomToDelete] = useState<{ id: string, type: 'sambox' | 'steam' } | null>(null);

  // Denuvo Links State -> Updated to new structures
  const [denuvoAccounts, setDenuvoAccounts] = useState<DenuvoAccount[]>([]);
  const [denuvoPrints, setDenuvoPrints] = useState<DenuvoPrint[]>([]);
  const [denuvoHistoryList, setDenuvoHistoryList] = useState<DenuvoHistory[]>([]);

  const [denuvoAccountFormData, setDenuvoAccountFormData] = useState({ nome: '', email: '' });
  const [denuvoPrintFormData, setDenuvoPrintFormData] = useState({ gameName: '', imageUrl: '' });
  const [denuvoHistoryFormData, setDenuvoHistoryFormData] = useState({ gameName: '', accountId: '' });

  const [denuvoTabMode, setDenuvoTabMode] = useState<'contas' | 'prints'>('contas');
  const [isUploadingPrint, setIsUploadingPrint] = useState(false);

  // Fetch Links
  React.useEffect(() => {
    const qSambox = query(collection(db, 'samboxLinks'), orderBy('updatedAt', 'desc'));
    const unsubscribeSambox = onSnapshot(qSambox, (snapshot) => {
      const links = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuickLink[];
      setSamboxLinks(links);
    }, (error) => {
      console.error('Error fetching samboxLinks:', error);
      alert('Error fetching samboxLinks: ' + error.message);
    });

    const qSamboxCupons = query(collection(db, 'samboxCupons'), orderBy('updatedAt', 'desc'));
    const unsubscribeSamboxCupons = onSnapshot(qSamboxCupons, (snapshot) => {
      const cupons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CupomItem[];
      setSamboxCuponsList(cupons);
    }, (error) => {
      console.error('Error fetching samboxCupons:', error);
    });

    const qSteam = query(collection(db, 'steamLinks'), orderBy('updatedAt', 'desc'));
    const unsubscribeSteam = onSnapshot(qSteam, (snapshot) => {
      const links = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuickLink[];
      setSteamLinks(links);
    }, (error) => {
      console.error('Error fetching steamLinks:', error);
      alert('Error fetching steamLinks: ' + error.message);
    });

    const qSteamCupons = query(collection(db, 'steamCupons'), orderBy('updatedAt', 'desc'));
    const unsubscribeSteamCupons = onSnapshot(qSteamCupons, (snapshot) => {
      const cupons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CupomItem[];
      setSteamCuponsList(cupons);
    }, (error) => {
      console.error('Error fetching steamCupons:', error);
    });

    const qDenuvoAcc = query(collection(db, 'denuvoAccounts'), orderBy('updatedAt', 'desc'));
    const unsubscribeDenuvoAcc = onSnapshot(qDenuvoAcc, (snapshot) => {
      const accounts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DenuvoAccount[];
      setDenuvoAccounts(accounts);
    }, (error) => {
      console.error('Error fetching denuvoAccounts:', error);
    });

    const qDenuvoPr = query(collection(db, 'denuvoPrints'), orderBy('gameName', 'asc'));
    const unsubscribeDenuvoPr = onSnapshot(qDenuvoPr, (snapshot) => {
      const prints = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DenuvoPrint[];
      setDenuvoPrints(prints);
    }, (error) => {
      console.error('Error fetching denuvoPrints:', error);
    });

    const qDenuvoHis = query(collection(db, 'denuvoHistory'), orderBy('updatedAt', 'desc'));
    const unsubscribeDenuvoHis = onSnapshot(qDenuvoHis, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DenuvoHistory[];
      setDenuvoHistoryList(history);
    }, (error) => {
      console.error('Error fetching denuvoHistory:', error);
    });

    const qAfiliado = query(collection(db, 'afiliadoOfertas'), orderBy('updatedAt', 'desc'));
    const unsubscribeAfiliado = onSnapshot(qAfiliado, (snapshot) => {
      const ofertas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AfiliadoOferta[];
      setAfiliadoOfertas(ofertas);
    }, (error) => {
      console.error('Error fetching afiliadoOfertas:', error);
      alert('Error fetching afiliadoOfertas: ' + error.message);
    });

    return () => {
      unsubscribeSambox();
      unsubscribeSamboxCupons();
      unsubscribeSteam();
      unsubscribeSteamCupons();
      unsubscribeDenuvoAcc();
      unsubscribeDenuvoPr();
      unsubscribeDenuvoHis();
      unsubscribeAfiliado();
    };
  }, []);

  const handleSamboxLinkInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSamboxLinkFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAfiliadoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAfiliadoFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAfiliadoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cuponsArray = afiliadoFormData.cupons
      .filter(c => c.codigo.trim().length > 0);

    const data = {
      titulo: afiliadoFormData.titulo,
      valorCupom: afiliadoFormData.valorCupom,
      cupons: cuponsArray,
      createdAt: (editingLink?.type === 'afiliado' && editingLink.data.createdAt) ? editingLink.data.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: (editingLink?.type === 'afiliado' && editingLink.data.createdBy) ? editingLink.data.createdBy : (user?.email || 'unknown'),
      updatedBy: user?.uid || 'unknown'
    };
    
    try {
      if (editingLink?.type === 'afiliado') {
        await updateDoc(doc(db, 'afiliadoOfertas', editingLink.id), data);
        setEditingLink(null);
      } else {
        await addDoc(collection(db, 'afiliadoOfertas'), data);
      }
      setAfiliadoFormData({ titulo: '', valorCupom: '', cupons: [{ codigo: '', valor: '' }] });
    } catch (error) {
      console.error('Error handling afiliado oferta:', error);
      alert('Erro ao processar oferta de afiliado.');
    }
  };

  const handleSamboxLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      nome: samboxLinkFormData.nome,
      valor: samboxLinkFormData.valor,
      link: samboxLinkFormData.link,
      createdAt: (editingLink?.type === 'sambox' && editingLink.data.createdAt) ? editingLink.data.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: (editingLink?.type === 'sambox' && editingLink.data.createdBy) ? editingLink.data.createdBy : (user?.email || 'unknown'),
      updatedBy: user?.uid || 'unknown'
    };
    
    try {
      if (editingLink?.type === 'sambox') {
        await updateDoc(doc(db, 'samboxLinks', editingLink.id), data);
        setEditingLink(null);
      } else {
        await addDoc(collection(db, 'samboxLinks'), data);
      }
      setSamboxLinkFormData({ nome: '', valor: '', link: '' });
    } catch (error) {
      console.error('Error handling sambox link:', error);
      alert('Erro ao processar link.');
    }
  };

  const handleSteamLinkInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSteamLinkFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSteamLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      nome: steamLinkFormData.nome,
      valor: steamLinkFormData.valor,
      link: steamLinkFormData.link,
      createdAt: (editingLink?.type === 'steam' && editingLink.data.createdAt) ? editingLink.data.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: (editingLink?.type === 'steam' && editingLink.data.createdBy) ? editingLink.data.createdBy : (user?.email || 'unknown'),
      updatedBy: user?.uid || 'unknown'
    };
    
    try {
      if (editingLink?.type === 'steam') {
        await updateDoc(doc(db, 'steamLinks', editingLink.id), data);
        setEditingLink(null);
      } else {
        await addDoc(collection(db, 'steamLinks'), data);
      }
      setSteamLinkFormData({ nome: '', valor: '', link: '' });
    } catch (error) {
      console.error('Error handling steam link:', error);
      alert('Erro ao processar link.');
    }
  };

  const handleSamboxCupomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cuponsArray = samboxCupomFormData.cupons.filter(c => c.codigo.trim().length > 0);

    const data = {
      nome: samboxCupomFormData.nome,
      cupons: cuponsArray,
      createdAt: (editingCupom?.type === 'sambox' && editingCupom.data.createdAt) ? editingCupom.data.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: (editingCupom?.type === 'sambox' && editingCupom.data.createdBy) ? editingCupom.data.createdBy : (user?.email || 'unknown'),
      updatedBy: user?.uid || 'unknown'
    };
    
    try {
      if (editingCupom?.type === 'sambox') {
        await updateDoc(doc(db, 'samboxCupons', editingCupom.id), data);
        setEditingCupom(null);
      } else {
        await addDoc(collection(db, 'samboxCupons'), data);
      }
      setSamboxCupomFormData({ nome: '', cupons: [{ codigo: '', valor: '' }] });
    } catch (error) {
      console.error('Error handling sambox cupom:', error);
      alert('Erro ao processar cupom.');
    }
  };

  const handleSteamCupomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cuponsArray = steamCupomFormData.cupons.filter(c => c.codigo.trim().length > 0);

    const data = {
      nome: steamCupomFormData.nome,
      cupons: cuponsArray,
      createdAt: (editingCupom?.type === 'steam' && editingCupom.data.createdAt) ? editingCupom.data.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: (editingCupom?.type === 'steam' && editingCupom.data.createdBy) ? editingCupom.data.createdBy : (user?.email || 'unknown'),
      updatedBy: user?.uid || 'unknown'
    };
    
    try {
      if (editingCupom?.type === 'steam') {
        await updateDoc(doc(db, 'steamCupons', editingCupom.id), data);
        setEditingCupom(null);
      } else {
        await addDoc(collection(db, 'steamCupons'), data);
      }
      setSteamCupomFormData({ nome: '', cupons: [{ codigo: '', valor: '' }] });
    } catch (error) {
      console.error('Error handling steam cupom:', error);
      alert('Erro ao processar cupom.');
    }
  };

  const handleDenuvoAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!denuvoAccountFormData.nome || !denuvoAccountFormData.email) return;

    try {
      await addDoc(collection(db, 'denuvoAccounts'), {
        nome: denuvoAccountFormData.nome,
        email: denuvoAccountFormData.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || 'unknown',
        createdBy: user?.email || 'unknown'
      });
      setDenuvoAccountFormData({ nome: '', email: '' });
    } catch (error) {
      console.error('Error adding denuvo account:', error);
      alert('Erro ao cadastrar conta Denuvo.');
    }
  };

  const handleDenuvoPrintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!denuvoPrintFormData.gameName || !denuvoPrintFormData.imageUrl) return;

    try {
      setIsUploadingPrint(true);
      await addDoc(collection(db, 'denuvoPrints'), {
        gameName: denuvoPrintFormData.gameName,
        imageUrl: denuvoPrintFormData.imageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || 'unknown',
        createdBy: user?.email || 'unknown'
      });
      setDenuvoPrintFormData({ gameName: '', imageUrl: '' });
    } catch (error) {
      console.error('Error adding denuvo print:', error);
      alert('Erro ao cadastrar print.');
    } finally {
      setIsUploadingPrint(false);
    }
  };

  const handleDenuvoHistorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!denuvoHistoryFormData.accountId || !denuvoHistoryFormData.gameName) return;

    const account = denuvoAccounts.find(a => a.id === denuvoHistoryFormData.accountId);
    if (!account) return;

    try {
      await addDoc(collection(db, 'denuvoHistory'), {
        accountId: account.id,
        accountName: account.nome,
        gameName: denuvoHistoryFormData.gameName,
        createdByDisplayName: displayName || user?.email?.split('@')[0] || 'Unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || 'unknown',
        createdBy: user?.email || 'unknown'
      });
      setDenuvoHistoryFormData({ gameName: '', accountId: '' });
    } catch (error) {
      console.error('Error adding denuvo history:', error);
      alert('Erro ao registrar histórico.');
    }
  };

  const handlePrintImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // 60% quality jpeg to keep it small
        setDenuvoPrintFormData(prev => ({ ...prev, imageUrl: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Delete Link State
  const [linkToDelete, setLinkToDelete] = useState<{id: string, type: 'sambox' | 'steam' | 'afiliado' | 'denuvo'} | null>(null);
  
  // Transaction Edit/Delete State
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    try {
      await deleteDoc(doc(db, 'transactions', transactionToDelete));
      setTransactionToDelete(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Erro ao deletar registro financeiro.');
    }
  };

  const handleEditTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    
    const updatedTransaction = {
      date: editingTransaction.date,
      vendas: Number(editingTransaction.vendas) || 0,
      pix: Number(editingTransaction.pix) || 0,
      ads_facebook: Number(editingTransaction.ads_facebook) || 0,
      ads_google: Number(editingTransaction.ads_google) || 0,
      ads_tiktok: Number(editingTransaction.ads_tiktok) || 0,
      extras: Number(editingTransaction.extras) || 0,
      descricao_extra: editingTransaction.descricao_extra,
    };
    
    try {
      await updateDoc(doc(db, 'transactions', editingTransaction.id), updatedTransaction);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Erro ao atualizar registro financeiro.');
    }
  };

  const confirmDeleteCupom = async () => {
    if (!cupomToDelete) return;
    
    try {
      let collectionName = '';
      if (cupomToDelete.type === 'sambox') collectionName = 'samboxCupons';
      else if (cupomToDelete.type === 'steam') collectionName = 'steamCupons';

      await deleteDoc(doc(db, collectionName, cupomToDelete.id));
      setCupomToDelete(null);
    } catch (error) {
      console.error('Error deleting cupom:', error);
      alert('Erro ao deletar cupom.');
    }
  };

  const confirmDeleteLink = async () => {
    if (!linkToDelete) return;
    
    try {
      let collectionName = '';
      if (linkToDelete.type === 'sambox') collectionName = 'samboxLinks';
      else if (linkToDelete.type === 'steam') collectionName = 'steamLinks';
      else if (linkToDelete.type === 'afiliado') collectionName = 'afiliadoOfertas';
      else if (linkToDelete.type === 'denuvo') collectionName = 'denuvoLinks';

      await deleteDoc(doc(db, collectionName, linkToDelete.id));
      setLinkToDelete(null);
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Erro ao deletar link.');
    }
  };

  const generateZapLink = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = zapPhone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(zapMessage);
    const link = `https://api.whatsapp.com/send?phone=${cleanPhone}${encodedMessage ? `&text=${encodedMessage}` : ''}`;
    setGeneratedZapLink(link);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copiado para a área de transferência!');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInstInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInstFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTransaction = {
      date: formData.date,
      vendas: Number(formData.vendas) || 0,
      pix: Number(formData.pix) || 0,
      ads_facebook: Number(formData.ads_facebook) || 0,
      ads_google: Number(formData.ads_google) || 0,
      ads_tiktok: Number(formData.ads_tiktok) || 0,
      extras: Number(formData.extras) || 0,
      descricao_extra: formData.descricao_extra,
      createdBy: user?.email || 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: user?.uid || 'unknown'
    };
    
    try {
      await addDoc(collection(db, 'transactions'), newTransaction);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        vendas: '',
        pix: '',
        ads_facebook: '',
        ads_google: '',
        ads_tiktok: '',
        instalacoes: '',
        extras: '',
        descricao_extra: ''
      });
      setActiveSubTab('historico');
      alert('Registro financeiro salvo com sucesso!');
    } catch (err) {
      console.error("Error adding transaction:", err);
      alert('Erro ao salvar registro financeiro.');
    }
  };

  const handleInstSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const instaladorName = role === 'instalador' ? (user?.email?.split('@')[0] || '') : instFormData.instalador;

    const newInstallation = {
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      updatedBy: user?.uid || 'unknown',
      nome: instFormData.nome,
      email: instFormData.email,
      telefone: instFormData.telefone,
      instalador: instaladorName,
      createdBy: user?.email || 'unknown'
    };
    
    try {
      await addDoc(collection(db, 'installations'), newInstallation);
      
      setInstFormData({
        nome: '',
        email: '',
        telefone: '',
        instalador: ''
      });
      setActiveSubTab('historico');
      alert('Instalação registrada com sucesso!');
    } catch (err) {
      console.error("Error adding installation:", err);
      alert('Erro ao registrar instalação.');
    }
  };

  const handleDeleteInstallation = async (id: string) => {
    if (!isGerente) return;
    if (confirm('Tem certeza que deseja excluir este registro de instalação?')) {
      try {
        await deleteDoc(doc(db, 'installations', id));
      } catch (err) {
        console.error("Error deleting installation:", err);
        alert('Erro ao excluir instalação.');
      }
    }
  };

  const filteredInstallations = installations.filter(inst => {
    if (!inst.createdAt) return false;
    const instDate = typeof inst.createdAt === 'string' ? inst.createdAt.split('T')[0] : new Date(inst.createdAt.seconds * 1000).toISOString().split('T')[0];
    const matchesStartDate = filterStartDate ? instDate >= filterStartDate : true;
    const matchesEndDate = filterEndDate ? instDate <= filterEndDate : true;
    const matchesInstalador = filterInstalador ? inst.instalador.toLowerCase().includes(filterInstalador.toLowerCase()) : true;
    
    return matchesStartDate && matchesEndDate && matchesInstalador;
  });

  const filteredKeys = generatedKeys.filter(k => 
    k.key.toLowerCase().includes(keySearchQuery.toLowerCase()) || 
    (k.note && k.note.toLowerCase().includes(keySearchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredKeys.length / keysPerPage);
  const paginatedKeys = filteredKeys.slice((keyCurrentPage - 1) * keysPerPage, keyCurrentPage * keysPerPage);

  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://api.whatsapp.com/send?phone=${cleanPhone}`;
  };

  // Calculations
  const INSTALLATION_COST = 30;
  
  const getInstallationsForDate = (dateStr: string) => {
    return installations.filter(inst => {
      if (!inst.createdAt) return false;
      const instDate = typeof inst.createdAt === 'string' ? inst.createdAt.split('T')[0] : new Date(inst.createdAt.seconds * 1000).toISOString().split('T')[0];
      return instDate === dateStr;
    }).length;
  };

  const calculateLucro = (t: any) => {
    const fbAds = (t.ads_facebook || 0) * 1.12;
    const googleAds = t.ads_google || 0;
    const tiktokAds = t.ads_tiktok || 0;
    const totalAds = fbAds + googleAds + tiktokAds + (t.publicidade || 0);
    const instalacoesCount = getInstallationsForDate(t.date);
    return (t.vendas + (t.pix || 0)) - totalAds - t.extras - (instalacoesCount * INSTALLATION_COST);
  };
  
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7);
  const currentYear = today.substring(0, 4);

  const lucroDiario = transactions
    .filter(t => t.date === today)
    .reduce((acc, t) => acc + calculateLucro(t), 0);

  const lucroMensal = transactions
    .filter(t => t.date.startsWith(currentMonth))
    .reduce((acc, t) => acc + calculateLucro(t), 0);

  const lucroAnual = transactions
    .filter(t => t.date.startsWith(currentYear))
    .reduce((acc, t) => acc + calculateLucro(t), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-blue-600/30">
      {/* Header - Mobile Optimized */}
      <header className="bg-[#000d1a] border-b border-blue-500/30 sticky top-0 z-50 shadow-2xl font-display">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-2 md:h-20 gap-3 md:gap-4">
            <div className="flex items-center justify-between w-full md:w-auto">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center shrink-0 overflow-hidden">
                  <Image src="/samboxlogo.fw.png" alt="Sambox Logo" width={80} height={80} className="w-full h-full object-contain" priority />
                </div>
              </div>
              
              {/* Hamburger Button for Mobile */}
              <div className="flex items-center gap-3 md:hidden">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 -mr-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* Desktop Navigation Items */}
            <nav className="hidden md:flex items-center gap-1 bg-[#0a0a0a] border border-white/10 p-1.5 rounded-2xl shadow-xl">
              <button 
                onClick={() => { setActiveMainTab('home'); setIsOthersDropdownOpen(false); setIsSteamDropdownOpen(false); setIsSamboxDropdownOpen(false); }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${activeMainTab === 'home' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Home className="w-4 h-4" /> Home
              </button>
              
              {!isAfiliado && (
                <button 
                  onClick={() => { setActiveMainTab('instalacoes'); setActiveSubTab('novo'); setIsOthersDropdownOpen(false); setIsSteamDropdownOpen(false); setIsSamboxDropdownOpen(false); }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${activeMainTab === 'instalacoes' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Download className="w-4 h-4" /> Instalações
                </button>
              )}
              
              {!isAfiliado && (
                <div className="relative">
                  <button 
                    onClick={() => { setIsSamboxDropdownOpen(!isSamboxDropdownOpen); setIsSteamDropdownOpen(false); setIsOthersDropdownOpen(false); }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${activeMainTab === 'others' && (activeSubTab === 'zap' || activeSubTab === 'cupons_sambox') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <MessageCircle className="w-4 h-4" /> Sambox <Plus className={`w-3 h-3 transition-transform ${isSamboxDropdownOpen ? 'rotate-45' : ''}`} />
                  </button>

                  {isSamboxDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                      <button 
                        onClick={() => { setActiveMainTab('others'); setActiveSubTab('zap'); setIsSamboxDropdownOpen(false); }}
                        className="w-full px-5 py-3.5 text-left text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-3"
                      >
                        <DollarSign className="w-4 h-4" /> Ofertas
                      </button>
                      <button 
                        onClick={() => { setActiveMainTab('others'); setActiveSubTab('cupons_sambox'); setIsSamboxDropdownOpen(false); }}
                        className="w-full px-5 py-3.5 text-left text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-3 border-t border-white/5"
                      >
                        <Percent className="w-4 h-4" /> Cupons
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="relative">
                <button 
                  onClick={() => { setIsSteamDropdownOpen(!isSteamDropdownOpen); setIsOthersDropdownOpen(false); setIsSamboxDropdownOpen(false); }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${activeMainTab === 'keys' || (activeMainTab === 'others' && (activeSubTab === 'denuvo' || activeSubTab === 'vendas' || activeSubTab === 'cupons_steam')) ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Key className="w-4 h-4" /> Steam <Plus className={`w-3 h-3 transition-transform ${isSteamDropdownOpen ? 'rotate-45' : ''}`} />
                </button>

                {isSteamDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                      onClick={() => { setActiveMainTab('keys'); setActiveSubTab('novo'); setIsSteamDropdownOpen(false); }}
                      className="w-full px-5 py-3.5 text-left text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-3"
                    >
                      <Key className="w-4 h-4" /> Keys Steam
                    </button>
                    {!isAfiliado && (
                      <button 
                        onClick={() => { setActiveMainTab('others'); setActiveSubTab('vendas'); setIsSteamDropdownOpen(false); }}
                        className="w-full px-5 py-3.5 text-left text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-3 border-t border-white/5"
                      >
                        <DollarSign className="w-4 h-4" /> Ofertas
                      </button>
                    )}
                    {!isAfiliado && (
                      <button 
                        onClick={() => { setActiveMainTab('others'); setActiveSubTab('cupons_steam'); setIsSteamDropdownOpen(false); }}
                        className="w-full px-5 py-3.5 text-left text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-3 border-t border-white/5"
                      >
                        <Percent className="w-4 h-4" /> Cupons
                      </button>
                    )}
                    {!isAfiliado && (
                      <button 
                        onClick={() => { setActiveMainTab('others'); setActiveSubTab('denuvo'); setIsSteamDropdownOpen(false); }}
                        className="w-full px-5 py-3.5 text-left text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-3 border-t border-white/5"
                      >
                        <Gamepad2 className="w-4 h-4" /> Denuvo
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {!isAfiliado && (
                <button 
                  onClick={() => { setActiveMainTab('videos'); setActiveSubTab('galeria'); setIsOthersDropdownOpen(false); setIsSteamDropdownOpen(false); setIsSamboxDropdownOpen(false); }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${activeMainTab === 'videos' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Video className="w-4 h-4" /> Vídeos
                </button>
              )}
              
              <button 
                onClick={() => { setActiveMainTab('others'); setActiveSubTab('afiliados'); setIsOthersDropdownOpen(false); setIsSteamDropdownOpen(false); setIsSamboxDropdownOpen(false); }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${activeMainTab === 'others' && activeSubTab === 'afiliados' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Percent className="w-4 h-4" /> Afiliados
              </button>
            </nav>

            {/* Desktop User Info */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-blue-400 font-black uppercase tracking-widest mb-0.5">{role || 'Usuário'}</p>
                <p className="text-base font-black text-white leading-tight uppercase truncate max-w-[200px]">{displayName || user?.email?.split('@')[0] || 'Sammy'}</p>
              </div>
              <button 
                onClick={() => { setActiveMainTab('perfil'); window.scrollTo(0, 0); }}
                className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center hover:bg-blue-500/20 transition-all hover:scale-110 active:scale-95 group overflow-hidden"
                title="Minha Conta"
              >
                {photoURL ? (
                  <img src={photoURL} alt="User" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-blue-500 group-hover:text-blue-400 transition-colors" />
                )}
              </button>
              <button 
                onClick={() => signOut(auth)}
                className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center hover:bg-red-500/20 transition-all hover:scale-110 active:scale-95 group"
                title="Sair"
              >
                <LogOut className="w-5 h-5 text-red-500 group-hover:text-red-400 transition-colors ml-1" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Sidebar / Drawer Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-64 bg-[#0a0a0a] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-white font-black italic">MENU</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-white p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <button 
                  onClick={() => { setActiveMainTab('home'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors ${activeMainTab === 'home' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4" /> Home
                  </div>
                </button>
                
                {!isAfiliado && (
                  <button 
                    onClick={() => { setActiveMainTab('instalacoes'); setActiveSubTab('novo'); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors ${activeMainTab === 'instalacoes' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="w-4 h-4" /> Instalações
                    </div>
                  </button>
                )}

                <div className="pt-4 border-t border-white/10 mt-4">
                  <span className="px-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 block">Sambox</span>
                  
                  {!isAfiliado && (
                    <>
                      <button 
                        onClick={() => { setActiveMainTab('others'); setActiveSubTab('zap'); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors ${(activeMainTab === 'others' && activeSubTab === 'zap') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-3">
                          <MessageCircle className="w-4 h-4" /> Ofertas
                        </div>
                      </button>
                      <button 
                        onClick={() => { setActiveMainTab('others'); setActiveSubTab('cupons_sambox'); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors ${(activeMainTab === 'others' && activeSubTab === 'cupons_sambox') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Percent className="w-4 h-4" /> Cupons
                        </div>
                      </button>
                    </>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10 mt-4">
                  <span className="px-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 block">Steam</span>
                  
                  <button 
                    onClick={() => { setActiveMainTab('keys'); setActiveSubTab('novo'); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors ${activeMainTab === 'keys' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Key className="w-4 h-4" /> Keys Steam
                    </div>
                  </button>
                  
                  {!isAfiliado && (
                    <>
                      <button 
                        onClick={() => { setActiveMainTab('others'); setActiveSubTab('vendas'); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors ${(activeMainTab === 'others' && activeSubTab === 'vendas') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-4 h-4" /> Ofertas
                        </div>
                      </button>
                      <button 
                        onClick={() => { setActiveMainTab('others'); setActiveSubTab('cupons_steam'); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors ${(activeMainTab === 'others' && activeSubTab === 'cupons_steam') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Percent className="w-4 h-4" /> Cupons
                        </div>
                      </button>
                    </>
                  )}

                  {!isAfiliado && (
                    <button 
                      onClick={() => { setActiveMainTab('others'); setActiveSubTab('denuvo'); setIsMobileMenuOpen(false); }}
                      className={`w-full text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors ${(activeMainTab === 'others' && activeSubTab === 'denuvo') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Gamepad2 className="w-4 h-4" /> Denuvo
                      </div>
                    </button>
                  )}
                </div>

                {!isAfiliado && (
                  <button 
                    onClick={() => { setActiveMainTab('videos'); setActiveSubTab('galeria'); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors ${activeMainTab === 'videos' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Video className="w-4 h-4" /> Vídeos
                    </div>
                  </button>
                )}

                <div className="pt-4 border-t border-white/10 mt-4">
                  <button 
                    onClick={() => { setActiveMainTab('others'); setActiveSubTab('afiliados'); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors ${(activeMainTab === 'others' && activeSubTab === 'afiliados') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Percent className="w-4 h-4" /> Afiliados
                    </div>
                  </button>
                </div>

              </div>
              
              <div className="p-4 border-t border-white/10 flex flex-col gap-2">
                {isGerente && (
                  <>
                    <span className="px-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 mb-1 block">Administração</span>
                    <button 
                      onClick={() => { setActiveMainTab('postar_aviso'); setIsMobileMenuOpen(false); window.scrollTo(0, 0); }}
                      className={`w-full text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors ${activeMainTab === 'postar_aviso' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Megaphone className="w-4 h-4" /> Postar Aviso
                      </div>
                    </button>
                  </>
                )}
                <button 
                  onClick={() => { setActiveMainTab('perfil'); setIsMobileMenuOpen(false); window.scrollTo(0, 0); }}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors ${activeMainTab === 'perfil' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4" /> Minha Conta
                  </div>
                </button>
                <button 
                  onClick={() => signOut(auth)}
                  className="w-full text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-4 h-4" /> Sair
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 font-display">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tight">
              {activeMainTab === 'home' ? 'Mural de Notícias' : activeMainTab === 'postar_aviso' ? 'Publicar Aviso' : activeMainTab === 'financeiro' ? 'Gestão Financeira' : activeMainTab === 'instalacoes' ? 'Instalações Sambox' : activeMainTab === 'keys' ? 'Keys Steam' : activeMainTab === 'usuarios' ? 'Gerenciar Usuários' : activeMainTab === 'videos' ? 'Vídeos Tutoriais' : activeMainTab === 'perfil' ? 'Minha Conta' : (activeMainTab === 'others' && activeSubTab === 'denuvo' ? 'Denuvo' : activeMainTab === 'others' && activeSubTab === 'vendas' ? 'Ofertas Steam' : activeMainTab === 'others' && activeSubTab === 'zap' ? 'Ofertas Sambox' : activeMainTab === 'others' && activeSubTab === 'cupons_steam' ? 'Cupons Steam' : activeMainTab === 'others' && activeSubTab === 'cupons_sambox' ? 'Cupons Sambox' : 'Afiliados')}
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              {activeMainTab === 'home' ? 'Fique por dentro das últimas atualizações e avisos.' : activeMainTab === 'postar_aviso' ? 'Crie uma nova publicação para o feed de avisos do painel.' : activeMainTab === 'financeiro' ? 'Controle de entradas e saídas em tempo real.' : activeMainTab === 'instalacoes' ? 'Registro e acompanhamento de novas instalações.' : activeMainTab === 'keys' ? 'Gerenciamento de chaves de ativação.' : activeMainTab === 'usuarios' ? 'Controle de acessos e permissões do sistema' : activeMainTab === 'videos' ? 'Galeria de tutoriais e treinamentos da equipe.' : activeMainTab === 'perfil' ? 'Gerencie seu perfil e configurações.' : (activeMainTab === 'others' && activeSubTab === 'denuvo' ? 'Gerenciamento de Denuvo.' : activeMainTab === 'others' && activeSubTab === 'vendas' ? 'Ofertas e vendas para Steam.' : activeMainTab === 'others' && activeSubTab === 'zap' ? 'Ofertas e disparos Sambox.' : activeMainTab === 'others' && activeSubTab === 'cupons_steam' ? 'Gerenciamento de cupons de desconto Steam.' : activeMainTab === 'others' && activeSubTab === 'cupons_sambox' ? 'Gerenciamento de cupons de desconto Sambox.' : 'Recursos para afiliados.')}
            </p>
          </div>
          
          {/* Sub-menu Tabs */}
          {activeMainTab !== 'usuarios' && activeMainTab !== 'home' && activeMainTab !== 'perfil' && activeMainTab !== 'postar_aviso' && (
            <div className="flex bg-[#111111] p-1 rounded-xl border border-white/10 w-fit">
            {activeMainTab === 'videos' ? (
              <>
                <button 
                  onClick={() => setActiveSubTab('galeria')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${activeSubTab === 'galeria' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Galeria
                </button>
                {isGerente && (
                  <button 
                    onClick={() => setActiveSubTab('novo')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${activeSubTab === 'novo' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                  >
                    Novo Vídeo
                  </button>
                )}
              </>
            ) : activeMainTab !== 'others' ? (
              <>
                <button 
                  onClick={() => setActiveSubTab('novo')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${activeSubTab === 'novo' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  {activeMainTab === 'instalacoes' ? 'Nova Instalação' : activeMainTab === 'keys' ? 'Gerar Key' : 'Novo Registro'}
                </button>
                <button 
                  onClick={() => setActiveSubTab('historico')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${activeSubTab === 'historico' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Histórico
                </button>
              </>
            ) : (
              <>
                {!isAfiliado && (activeSubTab === 'zap' || activeSubTab === 'cupons_sambox') && (
                  <>
                    <button 
                      onClick={() => setActiveSubTab('zap')}
                      className={`px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${activeSubTab === 'zap' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      Ofertas Sambox
                    </button>
                    <button 
                      onClick={() => setActiveSubTab('cupons_sambox')}
                      className={`px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${activeSubTab === 'cupons_sambox' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      Cupons Sambox
                    </button>
                  </>
                )}
                {!isAfiliado && (activeSubTab === 'vendas' || activeSubTab === 'cupons_steam' || activeSubTab === 'denuvo') && (
                  <>
                    <button 
                      onClick={() => setActiveSubTab('vendas')}
                      className={`px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${activeSubTab === 'vendas' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      Ofertas Steam
                    </button>
                    <button 
                      onClick={() => setActiveSubTab('cupons_steam')}
                      className={`px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${activeSubTab === 'cupons_steam' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      Cupons Steam
                    </button>
                    <button 
                      onClick={() => setActiveSubTab('denuvo')}
                      className={`px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${activeSubTab === 'denuvo' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      Denuvo
                    </button>
                  </>
                )}
                {activeSubTab === 'afiliados' && (
                  <button 
                    onClick={() => setActiveSubTab('afiliados')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${activeSubTab === 'afiliados' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                  >
                    Afiliados
                  </button>
                )}
              </>
            )}
          </div>
          )}
        </div>

        {activeMainTab === 'postar_aviso' && isGerente && (
          <div className="bg-[#111111] p-6 rounded-2xl border border-white/10 shadow-2xl mb-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-500" />
                {editingNoticiaId ? 'Editar Aviso' : 'Publicar Novo Aviso'}
              </h2>
              {editingNoticiaId && (
                <button 
                  onClick={cancelEditingNoticia}
                  className="text-xs font-bold text-red-500 uppercase hover:text-red-400 transition-colors"
                >
                  Cancelar Edição
                </button>
              )}
            </div>
            <form onSubmit={handleCreateNoticia} className="space-y-4">
              <input 
                type="text" 
                placeholder="Título do aviso..."
                value={novaNoticia.titulo}
                onChange={(e) => setNovaNoticia({...novaNoticia, titulo: e.target.value})}
                className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-600 transition-all font-bold"
                required
              />
              <div className="bg-[#080808] rounded-xl border border-white/10">
                <RichTextEditor 
                  value={novaNoticia.conteudo}
                  onChange={(value) => setNovaNoticia({...novaNoticia, conteudo: value})}
                  placeholder="Escreva o conteúdo do post (permitido HTML, Listas, Imagens)..."
                />
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  disabled={isSubmittingNoticia}
                  className={`px-6 py-2.5 ${editingNoticiaId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-600/20`}
                >
                  {isSubmittingNoticia ? 'Salvando...' : editingNoticiaId ? 'Salvar Alterações' : 'Publicar Aviso'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeMainTab === 'home' && (
          <div className="space-y-6 max-w-4xl mx-auto">

            <div className="flex flex-col gap-6">
              {noticias.length > 0 ? noticias.slice((noticiasCurrentPage - 1) * noticiasPerPage, noticiasCurrentPage * noticiasPerPage).map(noticia => (
                <div key={noticia.id} className="w-full min-w-0 bg-[#0a0a0a] rounded-2xl border border-white/5 shadow-xl hover:border-blue-500/20 transition-colors flex flex-col overflow-hidden relative group">
                  <div className="p-6 md:p-8 flex-1 flex flex-col relative z-10 min-w-0">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-lg md:text-xl font-bold text-white leading-tight break-words">{noticia.titulo}</h3>
                      {isGerente && (
                        <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button 
                            onClick={() => startEditingNoticia(noticia)}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                            title="Editar Notícia"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteNoticia(noticia.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Deletar Notícia"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="ql-snow">
                      <div 
                        className={`w-full text-white text-xs md:text-sm mb-6 flex-1 ql-editor prose prose-invert max-w-none whitespace-pre-wrap
                          prose-p:leading-relaxed prose-p:my-2 prose-p:break-words
                          prose-headings:font-bold prose-headings:text-white prose-headings:mt-6 prose-headings:mb-3 prose-headings:tracking-tight
                          prose-ul:list-disc prose-ul:ml-8 prose-ul:my-8
                          prose-ol:list-decimal prose-ol:ml-8 prose-ol:my-8
                          prose-li:my-3 prose-li:marker:text-blue-500 prose-li:pl-2
                          prose-a:text-blue-400 prose-a:font-black prose-a:no-underline hover:prose-a:underline
                          prose-img:rounded-3xl prose-img:shadow-2xl prose-img:my-10 prose-img:border prose-img:border-white/10
                          prose-strong:text-white prose-strong:font-black prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-6 prose-blockquote:italic`} 
                        dangerouslySetInnerHTML={{ __html: noticia.conteudo }} 
                      />
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center overflow-hidden">
                          {noticia.authorPhotoURL ? (
                            <img src={noticia.authorPhotoURL} alt="Author" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-white font-black uppercase tracking-widest leading-none">{noticia.author}</span>
                          <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest mt-1">
                            {noticia.updatedAt !== noticia.createdAt ? 'Atualizado' : 'Autor da Publicação'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                        {new Date(noticia.updatedAt || noticia.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent pointer-events-none" />
                </div>
              )) : (
                <div className="col-span-full py-12 text-center border border-white/5 bg-[#111111] rounded-2xl">
                  <Megaphone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 font-medium">Nenhum aviso no momento.</p>
                </div>
              )}
            </div>
            
            {/* Pagination Controls for Noticias */}
            {noticias.length > noticiasPerPage && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setNoticiasCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={noticiasCurrentPage === 1}
                  className="p-2 rounded-lg bg-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.ceil(noticias.length / noticiasPerPage) }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setNoticiasCurrentPage(idx + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${noticiasCurrentPage === idx + 1 ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setNoticiasCurrentPage(prev => Math.min(prev + 1, Math.ceil(noticias.length / noticiasPerPage)))}
                  disabled={noticiasCurrentPage === Math.ceil(noticias.length / noticiasPerPage)}
                  className="p-2 rounded-lg bg-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeMainTab === 'financeiro' && isAdmin && (
          <>
            {/* Resumo Cards - Horizontal Scroll on Mobile */}
            <div className="flex overflow-x-auto pb-4 md:pb-0 md:grid md:grid-cols-3 gap-4 md:gap-6 mb-8 no-scrollbar snap-x">
              {/* Lucro Diário */}
              <div className="min-w-[280px] md:min-w-0 bg-[#111111] rounded-2xl p-6 border border-white/10 snap-center relative overflow-hidden shadow-xl">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Lucro do Dia</p>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">{formatCurrency(lucroDiario)}</h3>
                <div className="flex items-center text-xs uppercase tracking-widest font-black text-emerald-500">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Hoje
                </div>
              </div>

              {/* Lucro Mensal */}
              <div className="min-w-[280px] md:min-w-0 bg-[#111111] rounded-2xl p-6 border border-white/10 snap-center relative overflow-hidden shadow-xl">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Lucro Mensal</p>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">{formatCurrency(lucroMensal - totalDespesasFixas)}</h3>
                
                <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 uppercase tracking-wider font-bold">Operacional</span>
                    <span className="text-emerald-500 font-black">{formatCurrency(lucroMensal)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 uppercase tracking-wider font-bold flex items-center gap-1">
                      Despesas Fixas
                      <button onClick={() => setIsEditingDespesas(!isEditingDespesas)} className="text-blue-500 hover:text-blue-400 transition-colors">
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </span>
                    <span className="text-red-500 font-black">-{formatCurrency(totalDespesasFixas)}</span>
                  </div>

                  {isEditingDespesas && (
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      {despesasFixas.map(d => (
                        <div key={d.id} className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-400 truncate max-w-[100px]">{d.descricao}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-red-400">-{formatCurrency(d.valor)}</span>
                            <button onClick={() => handleDeleteDespesaFixa(d.id)} className="text-red-500 hover:text-red-400">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 mt-2">
                        <input 
                          type="text" 
                          placeholder="Descrição"
                          value={novaDespesa.descricao} 
                          onChange={e => setNovaDespesa({...novaDespesa, descricao: e.target.value})}
                          className="flex-1 min-w-0 bg-black border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 text-[10px]"
                        />
                        <input 
                          type="number" 
                          placeholder="R$"
                          value={novaDespesa.valor} 
                          onChange={e => setNovaDespesa({...novaDespesa, valor: e.target.value})}
                          className="w-16 bg-black border border-white/10 rounded px-2 py-1 text-right text-white focus:outline-none focus:border-blue-500 text-[10px]"
                        />
                        <button 
                          onClick={handleAddDespesaFixa} 
                          className="text-green-500 hover:text-green-400 bg-green-500/10 p-1 rounded transition-colors shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lucro Anual */}
              <div className="min-w-[280px] md:min-w-0 bg-[#111111] rounded-2xl p-6 border border-white/10 snap-center relative overflow-hidden shadow-xl">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Lucro Anual</p>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">{formatCurrency(lucroAnual)}</h3>
                <div className="text-xs uppercase tracking-widest font-black text-gray-600">
                  Ano Atual
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:gap-8">
              {/* Formulário de Registro */}
              {activeSubTab === 'novo' && (
                <div className="max-w-2xl mx-auto w-full">
                  <div className="bg-[#111111] rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                      Novo Registro Financeiro
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Data do Registro</label>
                          <input 
                            type="date" 
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Vendas Diretas (R$)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            name="vendas"
                            value={formData.vendas}
                            onChange={handleInputChange}
                            placeholder="0.00"
                            className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-black text-blue-400 uppercase tracking-widest mb-2 ml-1">Recebimento PIX (R$)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            name="pix"
                            value={formData.pix}
                            onChange={handleInputChange}
                            placeholder="0.00"
                            className="w-full bg-[#080808] border border-blue-500/30 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                          />
                        </div>
                      </div>

                      <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Gastos com Anúncios</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Facebook Ads (R$)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              name="ads_facebook"
                              value={formData.ads_facebook}
                              onChange={handleInputChange}
                              placeholder="0.00"
                              className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-600 transition-all"
                            />
                            <p className="text-[9px] text-gray-500 mt-1.5 ml-1 font-medium">+12% de taxa será aplicado</p>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Google Ads (R$)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              name="ads_google"
                              value={formData.ads_google}
                              onChange={handleInputChange}
                              placeholder="0.00"
                              className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-600 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">TikTok Ads (R$)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              name="ads_tiktok"
                              value={formData.ads_tiktok}
                              onChange={handleInputChange}
                              placeholder="0.00"
                              className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-600 transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Instalações (Automático)</label>
                          <div className="w-full bg-[#080808]/50 border border-white/5 rounded-xl px-4 py-4 text-base text-gray-500 flex justify-between items-center">
                            <span>{getInstallationsForDate(formData.date)} registradas</span>
                            <span className="text-rose-500 font-bold">-{formatCurrency(getInstallationsForDate(formData.date) * INSTALLATION_COST)}</span>
                          </div>
                          <p className="text-[10px] text-gray-600 mt-1 ml-1 uppercase font-bold">Vinculado ao módulo de instalações</p>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Gastos Extras (R$)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            name="extras"
                            value={formData.extras}
                            onChange={handleInputChange}
                            placeholder="0.00"
                            className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Descrição Detalhada (Extras)</label>
                        <textarea 
                          name="descricao_extra"
                          value={formData.descricao_extra}
                          onChange={handleInputChange}
                          placeholder="Descreva o que foi gasto nos extras..."
                          rows={3}
                          className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all resize-none"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-[0.2em] rounded-xl px-4 py-5 mt-4 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] active:scale-[0.98]"
                      >
                        SALVAR REGISTRO
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Histórico de Transações */}
              {activeSubTab === 'historico' && (
                <div className="w-full">
                  <div className="bg-[#111111] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                    <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                      <h2 className="text-base font-bold text-white">Histórico de Movimentações</h2>
                      <div className="flex items-center gap-4">
                        <button className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-[0.15em]">
                          Exportar PDF
                        </button>
                      </div>
                    </div>
                    
                    {/* Mobile View: List of Cards */}
                    <div className="md:hidden divide-y divide-white/10">
                      {isFetchingTransactions ? (
                        <div className="p-12 text-center flex flex-col items-center gap-3">
                          <Activity className="w-8 h-8 text-blue-500 animate-spin" />
                          <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Carregando transações...</span>
                        </div>
                      ) : transactions.length > 0 ? (
                        transactions.map((t) => {
                          const lucro = calculateLucro(t);
                          const instalacoesCount = getInstallationsForDate(t.date);
                          return (
                            <div key={t.id} className="p-6 space-y-5">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                  {new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                </span>
                                <span className={`text-lg font-black ${lucro >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {formatCurrency(lucro)}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                                <div className="text-gray-500 uppercase font-black tracking-tighter">Vendas: <span className="text-white block mt-1">{formatCurrency(t.vendas)}</span></div>
                                <div className="text-blue-400 uppercase font-black tracking-tighter">Pix: <span className="text-white block mt-1">{formatCurrency(t.pix || 0)}</span></div>
                                <div className="text-gray-500 uppercase font-black tracking-tighter">Ads: <span className="text-white block mt-1">{formatCurrency((t.ads_facebook || 0) * 1.12 + (t.ads_google || 0) + (t.ads_tiktok || 0) + (t.publicidade || 0))}</span></div>
                                <div className="text-rose-400 uppercase font-black tracking-tighter">Instal: <span className="text-white block mt-1">-{formatCurrency(instalacoesCount * INSTALLATION_COST)}</span></div>
                                <div className="text-gray-500 uppercase font-black tracking-tighter">Extras: <span className="text-white block mt-1">{formatCurrency(t.extras)}</span></div>
                              </div>
                              {t.descricao_extra && (
                                <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-300/80 leading-relaxed">
                                  <span className="font-black uppercase block mb-1">Observação:</span> {t.descricao_extra}
                                </div>
                              )}
                              <div className="flex gap-2 justify-end mt-4">
                                <button
                                  onClick={() => setEditingTransaction(t)}
                                  className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                                  title="Editar Registro"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setTransactionToDelete(t.id)}
                                  className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                  title="Apagar Registro"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-12 text-center text-gray-600 text-sm font-medium italic">
                          Nenhum registro financeiro encontrado.
                        </div>
                      )}
                    </div>

                    {/* Desktop View: Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white/[0.03] text-gray-400 text-xs font-black uppercase tracking-[0.2em]">
                            <th className="px-6 py-6">Data</th>
                            <th className="px-6 py-6">Vendas</th>
                            <th className="px-6 py-6 text-blue-400">Pix</th>
                            <th className="px-6 py-6">Ads</th>
                            <th className="px-6 py-6 text-rose-400">Instal (Déb)</th>
                            <th className="px-6 py-6">Extras</th>
                            <th className="px-6 py-6 text-right">Lucro</th>
                            <th className="px-6 py-6 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {isFetchingTransactions ? (
                            <tr>
                              <td colSpan={8} className="px-6 py-16 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <Activity className="w-8 h-8 text-blue-500 animate-spin" />
                                  <span className="text-xs font-black text-blue-500 uppercase tracking-widest animate-pulse">Carregando transações...</span>
                                </div>
                              </td>
                            </tr>
                          ) : transactions.length > 0 ? (
                            transactions.map((t) => {
                              const lucro = calculateLucro(t);
                              const instalacoesCount = getInstallationsForDate(t.date);
                              return (
                                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                                  <td className="px-6 py-6 text-sm text-gray-400 font-medium">
                                    {new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                  </td>
                                  <td className="px-6 py-6 text-sm text-emerald-500 font-black">
                                    {formatCurrency(t.vendas)}
                                  </td>
                                  <td className="px-6 py-6 text-sm text-blue-400 font-black">
                                    {formatCurrency(t.pix || 0)}
                                  </td>
                                  <td className="px-6 py-6 text-sm text-rose-500 font-medium">
                                    <div className="flex flex-col">
                                      <span>{formatCurrency((t.ads_facebook || 0) * 1.12 + (t.ads_google || 0) + (t.ads_tiktok || 0) + (t.publicidade || 0))}</span>
                                      {((t.ads_facebook || 0) > 0 || (t.ads_google || 0) > 0 || (t.ads_tiktok || 0) > 0) && (
                                        <span className="text-[10px] text-gray-600 uppercase mt-1">
                                          {t.ads_facebook ? `FB: ${formatCurrency(t.ads_facebook * 1.12)} ` : ''}
                                          {t.ads_google ? `GG: ${formatCurrency(t.ads_google)} ` : ''}
                                          {t.ads_tiktok ? `TK: ${formatCurrency(t.ads_tiktok)}` : ''}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-6 text-sm text-rose-400 font-black">
                                    <div className="flex flex-col">
                                      <span>-{formatCurrency(instalacoesCount * INSTALLATION_COST)}</span>
                                      <span className="text-[10px] text-gray-600 uppercase">({instalacoesCount} un)</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-6 text-sm text-rose-500 font-medium">
                                    <div className="flex flex-col">
                                      <span className="font-bold">{formatCurrency(t.extras)}</span>
                                      {t.descricao_extra && (
                                        <button 
                                          onClick={() => setSelectedExtra(t.descricao_extra)}
                                          className="text-xs text-blue-500 hover:text-blue-400 font-black uppercase tracking-tighter mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          ( Ver Detalhes )
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td className={`px-6 py-6 text-sm font-black text-right ${lucro >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {formatCurrency(lucro)}
                                  </td>
                                  <td className="px-6 py-6 text-right">
                                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => setEditingTransaction(t)}
                                        className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                                        title="Editar Registro"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => setTransactionToDelete(t.id)}
                                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                        title="Apagar Registro"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={8} className="px-6 py-12 text-center text-gray-600 text-sm font-medium italic">
                                Nenhum registro financeiro encontrado.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {transactions.length === 0 && (
                      <div className="px-6 py-16 text-center text-gray-600 text-sm font-medium">
                        Nenhum registro financeiro encontrado.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeMainTab === 'instalacoes' && !isAfiliado && (
          <div className="grid grid-cols-1 gap-6 md:gap-8">
            {/* Resumo Instalações */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-2">
              <div className="bg-[#111111] rounded-2xl p-6 border border-white/10 shadow-xl">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Instalações</p>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <Smartphone className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">{filteredInstallations.length}</h3>
                <div className="text-xs uppercase tracking-widest font-black text-gray-600">Acumulado</div>
              </div>
              <div className="bg-[#111111] rounded-2xl p-6 border border-white/10 shadow-xl">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Instaladores</p>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">
                  {new Set(filteredInstallations.map(i => i.instalador)).size}
                </h3>
                <div className="text-xs uppercase tracking-widest font-black text-gray-600">Equipe Ativa</div>
              </div>
              <div className="bg-[#111111] rounded-2xl p-6 border border-white/10 shadow-xl">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Hoje</p>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">
                  {filteredInstallations.filter(i => {
                    if (!i.createdAt) return false;
                    const dateStr = typeof i.createdAt === 'string' ? i.createdAt : new Date(i.createdAt.seconds * 1000).toISOString();
                    return dateStr.startsWith(today);
                  }).length}
                </h3>
                <div className="text-xs uppercase tracking-widest font-black text-emerald-500">Novas</div>
              </div>
            </div>

            {activeSubTab === 'novo' && (
              <div className="max-w-2xl mx-auto w-full">
                <div className="bg-[#111111] rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl">
                  <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                    Nova Instalação Sambox
                  </h2>
                  
                  <form onSubmit={handleInstSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Nome do Cliente</label>
                        <input 
                          type="text" 
                          name="nome"
                          value={instFormData.nome}
                          onChange={handleInstInputChange}
                          placeholder="Ex: João Silva"
                          required
                          className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Email de Cadastro</label>
                        <input 
                          type="email" 
                          name="email"
                          value={instFormData.email}
                          onChange={handleInstInputChange}
                          placeholder="cliente@email.com"
                          required
                          className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-black text-blue-400 uppercase tracking-widest mb-2 ml-1">Telefone (WhatsApp)</label>
                        <input 
                          type="tel" 
                          name="telefone"
                          value={instFormData.telefone}
                          onChange={handleInstInputChange}
                          placeholder="5511999999999"
                          required
                          className="w-full bg-[#080808] border border-blue-500/30 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Instalador Responsável</label>
                        <input 
                          type="text" 
                          name="instalador"
                          value={!isGerente ? (user?.email?.split('@')[0] || '') : instFormData.instalador}
                          onChange={handleInstInputChange}
                          placeholder="Nome do Instalador"
                          required
                          readOnly={!isGerente}
                          className={`w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all ${!isGerente ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-[0.2em] rounded-xl px-4 py-5 mt-4 transition-all shadow-[0_0_30_rgba(37,99,235,0.3)] active:scale-[0.98]"
                    >
                      REGISTRAR INSTALAÇÃO
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeSubTab === 'historico' && (
              <div className="w-full">
                {/* Filtros de Instalações */}
                <div className="bg-[#111111] rounded-2xl p-5 border border-white/10 mb-6 flex flex-wrap gap-4 items-end shadow-xl">
                  <div className="w-full sm:w-40">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Data Inicial</label>
                    <input 
                      type="date" 
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                  <div className="w-full sm:w-40">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Data Final</label>
                    <input 
                      type="date" 
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                  {isAdmin && (
                    <div className="w-full md:flex-1">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Filtrar por Instalador</label>
                      <input 
                        type="text" 
                        value={filterInstalador}
                        onChange={(e) => setFilterInstalador(e.target.value)}
                        placeholder="Nome do Instalador..."
                        className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-600 transition-all"
                      />
                    </div>
                  )}
                  {(filterStartDate || filterEndDate || filterInstalador) && (
                    <button 
                      onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setFilterInstalador(''); }}
                      className="px-4 py-3 text-[10px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest transition-all"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>

                <div className="bg-[#111111] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                  <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                    <h2 className="text-base font-bold text-white">Histórico de Instalações</h2>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      {filteredInstallations.length} {filteredInstallations.length === 1 ? 'resultado' : 'resultados'}
                    </div>
                  </div>
                  
                  {/* Mobile View */}
                  <div className="md:hidden divide-y divide-white/10">
                    {filteredInstallations.map((inst) => (
                      <div key={inst.id} className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-black text-white uppercase">{inst.nome}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                              {typeof inst.createdAt === 'string' ? new Date(inst.createdAt).toLocaleString('pt-BR') : new Date(inst.createdAt.seconds * 1000).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <a 
                              href={getWhatsAppLink(inst.telefone)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"
                            >
                              <MessageCircle className="w-5 h-5" />
                            </a>
                            {isGerente && (
                              <button 
                                onClick={() => handleDeleteInstallation(inst.id)}
                                className="p-2 rounded-lg bg-red-500/10 text-red-500"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <div className="text-gray-500 font-bold uppercase tracking-tighter">Email: <span className="text-gray-300 lowercase">{inst.email}</span></div>
                          <div className="text-gray-500 font-bold uppercase tracking-tighter">Instalador: <span className="text-blue-400">{inst.instalador}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/[0.03] text-gray-400 text-xs font-black uppercase tracking-[0.2em]">
                          <th className="px-6 py-6">Data/Hora</th>
                          <th className="px-6 py-6">Cliente</th>
                          <th className="px-6 py-6">Email</th>
                          <th className="px-6 py-6">Telefone</th>
                          <th className="px-6 py-6">Instalador</th>
                          <th className="px-6 py-6 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {filteredInstallations.map((inst) => (
                          <tr key={inst.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-6 text-sm text-gray-400 font-medium">
                              {typeof inst.createdAt === 'string' ? new Date(inst.createdAt).toLocaleString('pt-BR') : new Date(inst.createdAt.seconds * 1000).toLocaleString('pt-BR')}
                            </td>
                            <td className="px-6 py-6 text-sm text-white font-black uppercase tracking-tight">
                              {inst.nome}
                            </td>
                            <td className="px-6 py-6 text-sm text-gray-400">
                              {inst.email}
                            </td>
                            <td className="px-6 py-6 text-sm text-gray-300 font-medium">
                              {inst.telefone}
                            </td>
                            <td className="px-6 py-6 text-sm text-blue-400 font-black uppercase">
                              {inst.instalador}
                            </td>
                            <td className="px-6 py-6 text-right flex items-center justify-end gap-2">
                              <a 
                                href={getWhatsAppLink(inst.telefone)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all text-[10px] font-black uppercase tracking-widest"
                              >
                                <MessageCircle className="w-4 h-4" />
                                WhatsApp
                              </a>
                              {isGerente && (
                                <button 
                                  onClick={() => handleDeleteInstallation(inst.id)}
                                  className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                                  title="Excluir Registro"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {filteredInstallations.length === 0 && (
                    <div className="px-6 py-16 text-center text-gray-600 text-sm font-medium">
                      Nenhuma instalação encontrada com os filtros selecionados.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeMainTab === 'keys' && (
          <div className="max-w-4xl mx-auto w-full space-y-8">
            {activeSubTab === 'novo' ? (
              <div className="bg-[#111111] rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                      <Shield className="w-6 h-6 text-blue-500" />
                      Gerar Licença KeyAuth
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Gere licenças diretamente pelo painel Sambox.</p>
                  </div>
                  <a 
                    href="https://keyauth.cc/dashboard/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors bg-blue-500/5 px-4 py-2 rounded-lg border border-blue-500/20"
                  >
                    Painel KeyAuth <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Configurações */}
                  <div className="space-y-6">
                    {isGerente && (
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Seller Key (KeyAuth)</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Key className="h-4 w-4 text-gray-500" />
                            </div>
                            <input 
                              type="password" 
                              placeholder="Insira sua Seller Key"
                              value={keyAuthSellerKey}
                              onChange={e => setKeyAuthSellerKey(e.target.value)}
                              className="block w-full pl-11 pr-4 py-3 bg-black border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm"
                            />
                          </div>
                          <button
                            onClick={handleSaveSellerKey}
                            disabled={isSavingSellerKey}
                            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                          >
                            {isSavingSellerKey ? 'Salvando...' : 'Salvar'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Validade (Dias)</label>
                        <select 
                          value={keyAuthExpiry}
                          onChange={e => setKeyAuthExpiry(e.target.value)}
                          className="block w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all text-sm appearance-none"
                        >
                          <option value="1">1 Dia</option>
                          <option value="7">7 Dias</option>
                          <option value="30">30 Dias</option>
                          <option value="90">90 Dias</option>
                          <option value="365">1 Ano</option>
                          <option value="99999">Vitalício</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nível (Level)</label>
                        <input 
                          type="number" 
                          value={keyAuthLevel}
                          onChange={e => setKeyAuthLevel(e.target.value)}
                          className="block w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all text-sm text-center"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Prefixo / Máscara (License Mask)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Key className="h-4 w-4 text-gray-500" />
                        </div>
                        <input 
                          type="text" 
                          placeholder="SAMBOX-******"
                          value={keyAuthMask}
                          onChange={e => setKeyAuthMask(e.target.value)}
                          className="block w-full pl-11 pr-4 py-3 bg-black border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">License Note (Email do Cliente)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <MessageCircle className="h-4 w-4 text-gray-500" />
                        </div>
                        <input 
                          type="email" 
                          placeholder="exemplo@email.com"
                          value={keyAuthNote}
                          onChange={e => setKeyAuthNote(e.target.value)}
                          className="block w-full pl-11 pr-4 py-3 bg-black border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={generateKeyAuthKey}
                      disabled={isGeneratingKey}
                      className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${isGeneratingKey ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'}`}
                    >
                      {isGeneratingKey ? (
                        <>Gerando...</>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" /> Gerar Nova Key
                        </>
                      )}
                    </button>

                    {keyAuthError && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
                        {keyAuthError}
                      </div>
                    )}
                  </div>

                  {/* Keys Geradas Recentemente */}
                  <div className="flex flex-col h-full">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Keys Geradas Recentemente</label>
                    <div className="flex-1 bg-black/50 border border-white/5 rounded-2xl p-4 overflow-y-auto max-h-[350px] no-scrollbar">
                      {generatedKeys.length > 0 ? (
                        <div className="space-y-3">
                          {generatedKeys.slice(0, 5).map((k, idx) => (
                            <div key={idx} className="bg-[#1a1a1a] p-3 rounded-xl border border-white/5 group animate-in fade-in slide-in-from-right-4 duration-300">
                              <div className="flex items-center justify-between mb-1">
                                <code className="text-blue-400 font-mono text-xs font-bold">{k.key}</code>
                                <button 
                                  onClick={() => copyToClipboard(k.key)}
                                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                  title="Copiar Key"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <p className="text-[10px] text-gray-500 truncate font-medium">{parseNote(k.note).actualNote}</p>
                                {parseNote(k.note).creator !== '-' && (
                                  <p className="text-[9px] text-blue-500/80 truncate font-bold uppercase tracking-wider">
                                    Gerado por: {parseNote(k.note).creator}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                          {generatedKeys.length > 5 && (
                            <button 
                              onClick={() => setActiveSubTab('historico')}
                              className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors"
                            >
                              Ver todas no histórico
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                          <Key className="w-8 h-8 text-gray-800 mb-2" />
                          <p className="text-xs text-gray-600 font-medium italic">Nenhuma key gerada nesta sessão.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#111111] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                      <Clock className="w-6 h-6 text-blue-500" />
                      Histórico de Keys
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Visualize e gerencie as licenças geradas.</p>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                      onClick={fetchKeyAuthKeys}
                      disabled={isFetchingKeys}
                      className={`p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all ${isFetchingKeys ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Sincronizar com KeyAuth"
                    >
                      <Activity className={`w-4 h-4 ${isFetchingKeys ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="relative w-full md:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        type="text"
                        placeholder="Buscar por key ou email..."
                        value={keySearchQuery}
                        onChange={(e) => {
                          setKeySearchQuery(e.target.value);
                          setKeyCurrentPage(1);
                        }}
                        className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-600 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02] text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/5">
                        <th className="px-6 py-4">Data</th>
                        <th className="px-6 py-4">Key</th>
                        <th className="px-6 py-4">Nota (Email)</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {isFetchingKeys ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <Activity className="w-8 h-8 text-blue-500 animate-spin" />
                              <span className="text-xs font-black text-blue-500 uppercase tracking-widest animate-pulse">Sincronizando com KeyAuth...</span>
                            </div>
                          </td>
                        </tr>
                      ) : paginatedKeys.length > 0 ? (
                        paginatedKeys.map((k, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4 text-[10px] text-gray-500 font-medium">
                              {new Date(k.date).toLocaleString('pt-BR')}
                            </td>
                            <td className="px-6 py-4">
                              <code className="text-blue-400 font-mono text-xs font-bold">{k.key}</code>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-400 font-medium truncate max-w-[200px]">
                              <div className="flex flex-col gap-1">
                                <span>{parseNote(k.note).actualNote}</span>
                                {parseNote(k.note).creator !== '-' && (
                                  <span className="text-[9px] text-blue-500/80 font-bold uppercase tracking-wider">
                                    Gerado por: {parseNote(k.note).creator}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button 
                                onClick={() => copyToClipboard(k.key)}
                                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                title="Copiar Key"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              {isGerente && (
                                <button 
                                  onClick={() => setKeyToDeleteAuth(k.key)}
                                  className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                                  title="Deletar Key"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-gray-600 text-sm font-medium italic">
                            Nenhuma key encontrada.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-white/5">
                  {isFetchingKeys ? (
                    <div className="p-12 text-center flex flex-col items-center gap-3">
                      <Activity className="w-8 h-8 text-blue-500 animate-spin" />
                      <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Sincronizando...</span>
                    </div>
                  ) : paginatedKeys.length > 0 ? (
                    paginatedKeys.map((k, idx) => (
                      <div key={idx} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                            {new Date(k.date).toLocaleString('pt-BR')}
                          </span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => copyToClipboard(k.key)}
                              className="p-2 rounded-lg bg-white/5 text-gray-400"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {isGerente && (
                              <button 
                                onClick={() => setKeyToDeleteAuth(k.key)}
                                className="p-2 rounded-lg bg-red-500/10 text-red-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Key</p>
                          <code className="text-blue-400 font-mono text-sm font-bold block bg-black/30 p-2 rounded-lg border border-white/5">{k.key}</code>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Nota (Email)</p>
                          <div className="flex flex-col gap-1">
                            <p className="text-xs text-gray-400 font-medium">{parseNote(k.note).actualNote}</p>
                            {parseNote(k.note).creator !== '-' && (
                              <p className="text-[9px] text-blue-500/80 font-bold uppercase tracking-wider">
                                Gerado por: {parseNote(k.note).creator}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-12 text-center text-gray-600 text-sm font-medium italic">
                      Nenhuma key encontrada.
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="p-4 md:p-6 border-t border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-500 font-medium">
                      Mostrando <span className="text-white font-bold">{paginatedKeys.length}</span> de <span className="text-white font-bold">{filteredKeys.length}</span> keys
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setKeyCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={keyCurrentPage === 1}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <div className="flex items-center gap-1 overflow-x-auto max-w-[150px] sm:max-w-none no-scrollbar">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setKeyCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 ${
                              keyCurrentPage === page 
                                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
                                : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button 
                        onClick={() => setKeyCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={keyCurrentPage === totalPages}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {keyAuthError && (
                  <div className="p-4 bg-red-500/10 border-t border-red-500/20 text-red-500 text-xs font-bold text-center">
                    {keyAuthError}
                  </div>
                )}
              </div>
            )}

            {/* Modal de Confirmação de Deleção */}
            {keyToDeleteAuth && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">Deletar Key?</h3>
                      <p className="text-xs text-gray-500 font-medium">Esta ação é permanente no KeyAuth.</p>
                    </div>
                  </div>
                  
                  <div className="bg-black/50 rounded-xl p-3 border border-white/5 mb-6">
                    <code className="text-blue-400 font-mono text-sm font-bold block text-center">{keyToDeleteAuth}</code>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setKeyToDeleteAuth(null)}
                      className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => deleteKeyAuthKey(keyToDeleteAuth)}
                      disabled={isDeletingKey}
                      className="flex-1 py-3 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                    >
                      {isDeletingKey ? 'Deletando...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-6 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">Como funciona?</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Esta ferramenta utiliza a API de Vendedor do KeyAuth para gerenciar licenças. 
                  As keys geradas seguem a máscara <code className="text-blue-400/80">SAMBOX-******</code>.
                  Ao deletar uma key aqui, ela também será removida do banco de dados do KeyAuth permanentemente.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'others' && (
          <div className="max-w-2xl mx-auto w-full">
            {activeSubTab === 'zap' && (
              <div className="bg-[#111111] rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl flex flex-col gap-12">
                
                {/* Sambox Links Manager */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                    Links de Venda Rápidos - Ofertas Sambox
                  </h2>
                  
                  {/* List of Links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {samboxLinks.map((item) => (
                      <div key={item.id} className="bg-[#080808] border border-white/5 rounded-xl p-5 flex flex-col gap-3 hover:border-blue-500/30 transition-all group">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{item.nome}</h4>
                            <p className="text-blue-500 font-black text-lg mt-1">{formatCurrency(Number(item.valor))}</p>
                          </div>
                          <div className="flex gap-2">
                            {isGerente && (
                              <>
                                <button
                                  onClick={() => startEditingLink(item, 'sambox')}
                                  className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                                  title="Editar Link"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setLinkToDelete({ id: item.id, type: 'sambox' })}
                                  className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                  title="Apagar Link"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <div className="p-2 rounded-lg bg-blue-600/10 text-blue-500">
                              <DollarSign className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-col gap-2">
                          <button 
                            onClick={() => copyToClipboard(item.link)}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Copiar Link
                          </button>
                        </div>
                      </div>
                    ))}
                    {samboxLinks.length === 0 && (
                      <div className="col-span-full text-center py-8 text-gray-500 text-sm font-medium">
                        Nenhum link cadastrado ainda.
                      </div>
                    )}
                  </div>

                  {/* Registration Form */}
                  {isGerente && (
                    <div className="border-t border-white/10 pt-8" id="sambox-form">
                      <div className="flex justify-between items-center mb-5">
                        <h3 className="text-base font-bold text-white uppercase tracking-widest">
                          {editingLink?.type === 'sambox' ? 'Editar Link' : 'Cadastrar Novo Link'}
                        </h3>
                        {editingLink?.type === 'sambox' && (
                          <button 
                            onClick={cancelEditing}
                            className="text-xs text-red-500 font-black uppercase tracking-widest hover:text-red-400 transition-colors"
                          >
                            Cancelar Edição
                          </button>
                        )}
                      </div>
                      <form onSubmit={handleSamboxLinkSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Nome do Link</label>
                            <input 
                              type="text" 
                              name="nome"
                              value={samboxLinkFormData.nome}
                              onChange={handleSamboxLinkInputChange}
                              placeholder="Ex: Plano Mensal"
                              required
                              className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Valor (R$)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              name="valor"
                              value={samboxLinkFormData.valor}
                              onChange={handleSamboxLinkInputChange}
                              placeholder="0.00"
                              required
                              className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">URL do Link</label>
                            <input 
                              type="url" 
                              name="link"
                              value={samboxLinkFormData.link}
                              onChange={handleSamboxLinkInputChange}
                              placeholder="https://..."
                              required
                              className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                            />
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className={`w-full ${editingLink?.type === 'sambox' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'bg-blue-600 hover:bg-blue-700 shadow-[0_0_30_px_rgba(37,99,235,0.3)]'} text-white font-black text-sm uppercase tracking-[0.2em] rounded-xl px-4 py-5 mt-4 transition-all active:scale-[0.98]`}
                        >
                          {editingLink?.type === 'sambox' ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR LINK'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 pt-8">
                  <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                    Gerador de Links WhatsApp
                  </h2>
                  
                  <form onSubmit={generateZapLink} className="space-y-5">
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Número do Telefone (com DDD)</label>
                      <input 
                        type="text" 
                        value={zapPhone}
                        onChange={(e) => setZapPhone(e.target.value)}
                        placeholder="Ex: 11999999999"
                        required
                        className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Mensagem Opcional</label>
                      <textarea 
                        value={zapMessage}
                        onChange={(e) => setZapMessage(e.target.value)}
                        placeholder="Olá, gostaria de saber mais sobre..."
                        rows={3}
                        className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-[0.2em] rounded-xl px-4 py-5 mt-4 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] active:scale-[0.98]"
                    >
                      GERAR LINK
                    </button>
                  </form>

                  {generatedZapLink && (
                    <div className="mt-8 p-6 bg-blue-600/10 border border-blue-500/20 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                      <label className="block text-xs font-black text-blue-400 uppercase tracking-widest mb-3">Link Gerado com Sucesso:</label>
                      <div className="flex flex-col gap-4">
                        <div className="bg-black/40 border border-white/5 p-4 rounded-xl break-all text-sm text-gray-300 font-mono">
                          {generatedZapLink}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => copyToClipboard(generatedZapLink)}
                            className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase rounded-xl transition-all"
                          >
                            <Download className="w-4 h-4" /> Copiar Link
                          </button>
                          <a 
                            href={generatedZapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase rounded-xl transition-all"
                          >
                            <MessageCircle className="w-4 h-4" /> Abrir no Zap
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSubTab === 'vendas' && (
              <div className="bg-[#111111] rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                  Links de Venda Rápidos - Ofertas Steam
                </h2>
                
                {/* List of Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  {steamLinks.map((item) => (
                    <div key={item.id} className="bg-[#080808] border border-white/5 rounded-xl p-5 flex flex-col gap-3 hover:border-blue-500/30 transition-all group">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-tight">{item.nome}</h4>
                          <p className="text-blue-500 font-black text-lg mt-1">{formatCurrency(Number(item.valor))}</p>
                        </div>
                        <div className="flex gap-2">
                          {isGerente && (
                            <>
                              <button
                                onClick={() => startEditingLink(item, 'steam')}
                                className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                                title="Editar Link"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setLinkToDelete({ id: item.id, type: 'steam' })}
                                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                title="Apagar Link"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <div className="p-2 rounded-lg bg-blue-600/10 text-blue-500">
                            <DollarSign className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-col gap-2">
                        <button 
                          onClick={() => copyToClipboard(item.link)}
                          className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Copiar Link
                        </button>
                      </div>
                    </div>
                  ))}
                  {steamLinks.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500 text-sm font-medium">
                      Nenhum link cadastrado ainda.
                    </div>
                  )}
                </div>

                {/* Registration Form */}
                {isGerente && (
                  <div className="border-t border-white/10 pt-8">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-base font-bold text-white uppercase tracking-widest">
                        {editingLink?.type === 'steam' ? 'Editar Link' : 'Cadastrar Novo Link'}
                      </h3>
                      {editingLink?.type === 'steam' && (
                        <button 
                          onClick={cancelEditing}
                          className="text-xs text-red-500 font-black uppercase tracking-widest hover:text-red-400 transition-colors"
                        >
                          Cancelar Edição
                        </button>
                      )}
                    </div>
                    <form onSubmit={handleSteamLinkSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Nome do Link</label>
                          <input 
                            type="text" 
                            name="nome"
                            value={steamLinkFormData.nome}
                            onChange={handleSteamLinkInputChange}
                            placeholder="Ex: Steam Key - Jogo X"
                            required
                            className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Valor (R$)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            name="valor"
                            value={steamLinkFormData.valor}
                            onChange={handleSteamLinkInputChange}
                            placeholder="0.00"
                            required
                            className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">URL do Link</label>
                          <input 
                            type="url" 
                            name="link"
                            value={steamLinkFormData.link}
                            onChange={handleSteamLinkInputChange}
                            placeholder="https://..."
                            required
                            className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className={`w-full ${editingLink?.type === 'steam' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'bg-blue-600 hover:bg-blue-700 shadow-[0_0_30px_rgba(37,99,235,0.3)]'} text-white font-black text-sm uppercase tracking-[0.2em] rounded-xl px-4 py-5 mt-4 transition-all active:scale-[0.98]`}
                      >
                        {editingLink?.type === 'steam' ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR LINK'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {activeSubTab === 'cupons_sambox' && (
              <div className="bg-[#111111] rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl flex flex-col gap-12">
                <div>
                  <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                    Gerenciamento de Cupons - Sambox
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {samboxCuponsList.map((cupom) => (
                      <div key={cupom.id} className="bg-[#080808] border border-white/5 rounded-xl p-5 flex flex-col gap-3 hover:border-emerald-500/30 transition-all group">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{cupom.nome}</h4>
                          </div>
                          <div className="flex gap-2">
                            {isGerente && (
                              <>
                                <button
                                  onClick={() => startEditingCupom(cupom, 'sambox')}
                                  className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setCupomToDelete({ id: cupom.id, type: 'sambox' })}
                                  className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                  title="Apagar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <div className="p-2 rounded-lg bg-emerald-600/10 text-emerald-500">
                              <Percent className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-col gap-2">
                          {cupom.cupons && cupom.cupons.map((c, cIdx) => (
                            <div key={cIdx} className="w-full py-2.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase rounded-lg flex items-center justify-between px-4">
                              <div className="flex flex-col">
                                <span className="text-white/90">Cupom: <span className="text-emerald-400">{c.codigo}</span></span>
                                {c.valor && <span className="text-[10px] text-emerald-500/70">Valor: {c.valor}</span>}
                              </div>
                              <button 
                                onClick={() => copyToClipboard(c.codigo)}
                                className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1.5 rounded-md cursor-pointer font-black text-[9px] uppercase tracking-widest"
                                title="Copiar Cupom"
                              >
                                <Copy className="w-3 h-3" /> COPIAR CÓDIGO
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {samboxCuponsList.length === 0 && (
                      <div className="col-span-full text-center py-8 text-gray-500 text-sm font-medium">
                        Nenhuma oferta de cupons cadastrada ainda para Sambox.
                      </div>
                    )}
                  </div>

                  {isGerente && (
                    <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl w-full max-w-xl">
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-500" />
                        {editingCupom?.type === 'sambox' ? 'Editar Oferta de Cupons' : 'Nova Oferta de Cupons - Sambox'}
                      </h4>
                      <form onSubmit={handleSamboxCupomSubmit} className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">NOME DE REFERÊNCIA</label>
                          <input 
                            type="text" 
                            name="nome"
                            value={samboxCupomFormData.nome}
                            onChange={(e) => setSamboxCupomFormData(prev => ({ ...prev, nome: e.target.value }))}
                            placeholder="Ex: Mega Promoção"
                            required
                            className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-600 transition-all font-medium"
                          />
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4 ml-1 flex justify-between items-center">
                            <span>Cupons e Valores</span>
                            <button 
                              type="button" 
                              onClick={() => addCouponToForm('samboxCupom')}
                              className="text-[10px] bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-all font-black flex items-center gap-1.5"
                            >
                              <Plus className="w-3 h-3" /> Adicionar outro cupom
                            </button>
                          </label>
                          <div className="space-y-3">
                            {samboxCupomFormData.cupons.map((c, index) => (
                              <div key={index} className="flex gap-3 items-end group">
                                <div className="flex-[2]">
                                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">CÓDIGO DO CUPOM</label>
                                  <input 
                                    type="text" 
                                    value={c.codigo}
                                    onChange={(e) => handleCouponChange('samboxCupom', index, 'codigo', e.target.value)}
                                    placeholder="Ex: SAMBOX50"
                                    className="w-full bg-[#080808] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-600 transition-all"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">VALOR DO DESCONTO</label>
                                  <input 
                                    type="text" 
                                    value={c.valor}
                                    onChange={(e) => handleCouponChange('samboxCupom', index, 'valor', e.target.value)}
                                    placeholder="Ex: R$ 20,00"
                                    className="w-full bg-[#080808] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-600 transition-all"
                                  />
                                </div>
                                {samboxCupomFormData.cupons.length > 1 && (
                                  <button 
                                    type="button"
                                    onClick={() => removeCouponFromForm('samboxCupom', index)}
                                    className="p-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all mb-0.5"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className={`w-full ${editingCupom?.type === 'sambox' ? 'bg-blue-600 hover:bg-blue-700 shadow-[0_0_30px_rgba(37,99,235,0.3)]' : 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_30_px_rgba(16,185,129,0.3)]'} text-white font-black text-sm uppercase tracking-[0.2em] rounded-xl px-4 py-5 mt-4 transition-all active:scale-[0.98]`}
                        >
                          {editingCupom?.type === 'sambox' ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR OFERTA'}
                        </button>
                        {editingCupom?.type === 'sambox' && (
                          <button 
                            type="button"
                            onClick={cancelEditingCupom}
                            className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold text-xs uppercase tracking-widest rounded-xl px-4 py-4 mt-2 transition-all"
                          >
                            CANCELAR EDIÇÃO
                          </button>
                        )}
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSubTab === 'cupons_steam' && (
              <div className="bg-[#111111] rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl flex flex-col gap-12">
                <div>
                  <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                    Gerenciamento de Cupons - Steam
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {steamCuponsList.map((cupom) => (
                      <div key={cupom.id} className="bg-[#080808] border border-white/5 rounded-xl p-5 flex flex-col gap-3 hover:border-emerald-500/30 transition-all group">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{cupom.nome}</h4>
                          </div>
                          <div className="flex gap-2">
                            {isGerente && (
                              <>
                                <button
                                  onClick={() => startEditingCupom(cupom, 'steam')}
                                  className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setCupomToDelete({ id: cupom.id, type: 'steam' })}
                                  className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                  title="Apagar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <div className="p-2 rounded-lg bg-emerald-600/10 text-emerald-500">
                              <Percent className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-col gap-2">
                          {cupom.cupons && cupom.cupons.map((c, cIdx) => (
                            <div key={cIdx} className="w-full py-2.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase rounded-lg flex items-center justify-between px-4">
                              <div className="flex flex-col">
                                <span className="text-white/90">Cupom: <span className="text-emerald-400">{c.codigo}</span></span>
                                {c.valor && <span className="text-[10px] text-emerald-500/70">Valor: {c.valor}</span>}
                              </div>
                              <button 
                                onClick={() => copyToClipboard(c.codigo)}
                                className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1.5 rounded-md cursor-pointer font-black text-[9px] uppercase tracking-widest"
                                title="Copiar Cupom"
                              >
                                <Copy className="w-3 h-3" /> COPIAR CÓDIGO
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {steamCuponsList.length === 0 && (
                      <div className="col-span-full text-center py-8 text-gray-500 text-sm font-medium">
                        Nenhuma oferta de cupons cadastrada ainda para Steam.
                      </div>
                    )}
                  </div>

                  {isGerente && (
                    <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl w-full max-w-xl">
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-500" />
                        {editingCupom?.type === 'steam' ? 'Editar Oferta de Cupons' : 'Nova Oferta de Cupons - Steam'}
                      </h4>
                      <form onSubmit={handleSteamCupomSubmit} className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">NOME DE REFERÊNCIA</label>
                          <input 
                            type="text" 
                            name="nome"
                            value={steamCupomFormData.nome}
                            onChange={(e) => setSteamCupomFormData(prev => ({ ...prev, nome: e.target.value }))}
                            placeholder="Ex: Primavera Steam"
                            required
                            className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-600 transition-all font-medium"
                          />
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4 ml-1 flex justify-between items-center">
                            <span>Cupons e Valores</span>
                            <button 
                              type="button" 
                              onClick={() => addCouponToForm('steamCupom')}
                              className="text-[10px] bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-all font-black flex items-center gap-1.5"
                            >
                              <Plus className="w-3 h-3" /> Adicionar outro cupom
                            </button>
                          </label>
                          <div className="space-y-3">
                            {steamCupomFormData.cupons.map((c, index) => (
                              <div key={index} className="flex gap-3 items-end group">
                                <div className="flex-[2]">
                                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">CÓDIGO DO CUPOM</label>
                                  <input 
                                    type="text" 
                                    value={c.codigo}
                                    onChange={(e) => handleCouponChange('steamCupom', index, 'codigo', e.target.value)}
                                    placeholder="Ex: STEAM50"
                                    className="w-full bg-[#080808] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-600 transition-all"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">VALOR DO DESCONTO</label>
                                  <input 
                                    type="text" 
                                    value={c.valor}
                                    onChange={(e) => handleCouponChange('steamCupom', index, 'valor', e.target.value)}
                                    placeholder="Ex: R$ 20,00"
                                    className="w-full bg-[#080808] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-600 transition-all"
                                  />
                                </div>
                                {steamCupomFormData.cupons.length > 1 && (
                                  <button 
                                    type="button"
                                    onClick={() => removeCouponFromForm('steamCupom', index)}
                                    className="p-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all mb-0.5"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className={`w-full ${editingCupom?.type === 'steam' ? 'bg-blue-600 hover:bg-blue-700 shadow-[0_0_30px_rgba(37,99,235,0.3)]' : 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_30_px_rgba(16,185,129,0.3)]'} text-white font-black text-sm uppercase tracking-[0.2em] rounded-xl px-4 py-5 mt-4 transition-all active:scale-[0.98]`}
                        >
                          {editingCupom?.type === 'steam' ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR OFERTA'}
                        </button>
                        {editingCupom?.type === 'steam' && (
                          <button 
                            type="button"
                            onClick={cancelEditingCupom}
                            className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold text-xs uppercase tracking-widest rounded-xl px-4 py-4 mt-2 transition-all"
                          >
                            CANCELAR EDIÇÃO
                          </button>
                        )}
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSubTab === 'denuvo' && (
              <div className="bg-[#111111] rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl flex flex-col gap-8">
                <div>
                  <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                    Denuvo Management
                  </h2>
                  
                  <div className="flex gap-4 mb-8">
                    <button onClick={() => setDenuvoTabMode('contas')} className={`px-4 py-2 font-black uppercase text-xs rounded-lg transition-colors ${denuvoTabMode === 'contas' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>Contas e Histórico</button>
                    <button onClick={() => setDenuvoTabMode('prints')} className={`px-4 py-2 font-black uppercase text-xs rounded-lg transition-colors ${denuvoTabMode === 'prints' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>Prints</button>
                  </div>

                  {denuvoTabMode === 'contas' && (
                    <div className="flex flex-col gap-10">
                      {/* Contas List & Usage Form */}
                      <div>
                        <h3 className="text-base font-bold text-white mb-4 uppercase tracking-widest">Contas de E-mail</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {denuvoAccounts.map((acc) => (
                            <div key={acc.id} className="bg-[#080808] border border-white/5 rounded-xl p-5 flex flex-col gap-4 relative">
                              <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">{acc.nome}</h4>
                                <p className="text-gray-400 text-sm">{acc.email}</p>
                              </div>
                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleDenuvoHistorySubmit(e);
                                }}
                                className="flex gap-2"
                              >
                                <input 
                                  type="text" 
                                  placeholder="Nome do Jogo" 
                                  required
                                  value={denuvoHistoryFormData.accountId === acc.id ? denuvoHistoryFormData.gameName : ''}
                                  onChange={(e) => setDenuvoHistoryFormData({ accountId: acc.id, gameName: e.target.value })}
                                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600"
                                />
                                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-black uppercase whitespace-nowrap">Usar</button>
                              </form>
                            </div>
                          ))}
                          {denuvoAccounts.length === 0 && (
                            <div className="col-span-full text-center py-4 text-gray-500 text-sm font-medium">Nenhuma conta cadastrada.</div>
                          )}
                        </div>
                      </div>

                      {/* Histórico */}
                      <div>
                        <h3 className="text-base font-bold text-white mb-4 uppercase tracking-widest">Histórico de Uso</h3>
                        <div className="bg-[#080808] rounded-xl border border-white/5 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                              <thead className="bg-white/5">
                                <tr>
                                  <th className="p-4 text-xs font-black text-gray-400 uppercase">Conta</th>
                                  <th className="p-4 text-xs font-black text-gray-400 uppercase">Jogo</th>
                                  <th className="p-4 text-xs font-black text-gray-400 uppercase">Usuário</th>
                                  <th className="p-4 text-xs font-black text-gray-400 uppercase">Data</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 text-sm cursor-default">
                                {denuvoHistoryList.map(item => (
                                  <tr key={item.id} className="hover:bg-white/5 transition-colors text-gray-300">
                                    <td className="p-4">{item.accountName}</td>
                                    <td className="p-4">{item.gameName}</td>
                                    <td className="p-4">{item.createdByDisplayName}</td>
                                    <td className="p-4">{new Date(item.createdAt).toLocaleString('pt-BR')}</td>
                                  </tr>
                                ))}
                                {denuvoHistoryList.length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="p-4 text-center text-gray-500">Nenhum histórico encontrado.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Cadastrar Conta Form */}
                      {isGerente && (
                        <div className="border-t border-white/10 pt-6">
                           <h3 className="text-base font-bold text-white mb-4 uppercase tracking-widest">Cadastrar Nova Conta</h3>
                           <form onSubmit={handleDenuvoAccountSubmit} className="flex flex-col md:flex-row gap-4">
                             <input type="text" placeholder="Nome da Conta (ex: Conta 1)" value={denuvoAccountFormData.nome} onChange={e => setDenuvoAccountFormData(p => ({...p, nome: e.target.value}))} required className="flex-1 bg-[#080808] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-600" />
                             <input type="email" placeholder="Email" value={denuvoAccountFormData.email} onChange={e => setDenuvoAccountFormData(p => ({...p, email: e.target.value}))} required className="flex-1 bg-[#080808] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-600" />
                             <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase px-8 py-3 rounded-xl transition-all">Adicionar</button>
                           </form>
                        </div>
                      )}
                    </div>
                  )}

                  {denuvoTabMode === 'prints' && (
                    <div className="flex flex-col gap-10">
                      <div>
                        <h3 className="text-base font-bold text-white mb-4 uppercase tracking-widest">Galeria de Prints</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {denuvoPrints.map(print => (
                            <div key={print.id} className="bg-[#080808] border border-white/5 rounded-xl overflow-hidden flex flex-col group">
                              <div className="h-40 bg-[#111] overflow-hidden relative">
                                <Image src={print.imageUrl} alt={print.gameName} fill referrerPolicy="no-referrer" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                              </div>
                              <div className="p-4 flex items-center justify-between">
                                <h4 className="text-sm font-black text-white uppercase tracking-tight">{print.gameName}</h4>
                                <a href={print.imageUrl} download={`${print.gameName}-print.jpg`} className="p-2 bg-blue-600/10 text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white transition-colors" title="Baixar Print">
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          ))}
                          {denuvoPrints.length === 0 && (
                            <div className="col-span-full text-center py-8 text-gray-500 text-sm font-medium">Nenhum print cadastrado.</div>
                          )}
                        </div>
                      </div>

                      {/* Cadastrar Print */}
                      <div className="border-t border-white/10 pt-6">
                        <h3 className="text-base font-bold text-white mb-4 uppercase tracking-widest">Enviar Print</h3>
                        <form onSubmit={handleDenuvoPrintSubmit} className="flex flex-col gap-4">
                          <input type="text" placeholder="Nome do Jogo" required value={denuvoPrintFormData.gameName} onChange={e => setDenuvoPrintFormData(p => ({...p, gameName: e.target.value}))} className="w-full md:w-1/2 bg-[#080808] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-600" />
                          <div className="flex items-center gap-4">
                            <label className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl cursor-pointer transition-colors text-sm font-black uppercase flex items-center gap-2">
                              <span>Escolher Imagem</span>
                              <input type="file" accept="image/*" onChange={handlePrintImageChange} className="hidden" />
                            </label>
                            {denuvoPrintFormData.imageUrl && <span className="text-emerald-500 text-xs font-bold uppercase">✓ Imagem carregada</span>}
                          </div>
                          <button type="submit" disabled={isUploadingPrint || !denuvoPrintFormData.gameName || !denuvoPrintFormData.imageUrl} className="w-full md:w-1/2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm uppercase px-8 py-3 rounded-xl transition-all">
                            {isUploadingPrint ? 'Enviando...' : 'Cadastrar Print'}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSubTab === 'afiliados' && (
              <div className="bg-[#111111] rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl flex flex-col gap-12">
                <div>
                  <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                    Cupons para Afiliados
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {afiliadoOfertas.length > 0 ? (
                      afiliadoOfertas.map((item) => (
                        <div key={item.id} className="bg-[#080808] border border-white/5 rounded-xl p-5 flex flex-col gap-3 hover:border-blue-500/30 transition-all group">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-black text-white uppercase tracking-tight">{item.titulo}</h4>
                              <p className="text-blue-500 font-black text-lg mt-1">{item.valorCupom}</p>
                            </div>
                            <div className="flex gap-2">
                              {isGerente && (
                                <>
                                  <button
                                    onClick={() => startEditingLink(item, 'afiliado')}
                                    className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                                    title="Editar Oferta"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setLinkToDelete({ id: item.id, type: 'afiliado' })}
                                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                    title="Apagar Oferta"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 flex flex-col gap-2">
                            {item.cupons.map((cupom: any, cIdx) => {
                              const codigo = typeof cupom === 'string' ? parseCouponDetail(cupom).code : cupom.codigo;
                              const valor = typeof cupom === 'string' ? parseCouponDetail(cupom).value : cupom.valor;
                              return (
                                <div key={cIdx} className="w-full py-2.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase rounded-lg flex items-center justify-between px-4">
                                  <div className="flex flex-col">
                                    <span className="text-white/90">Cupom: <span className="text-emerald-400">{codigo}</span></span>
                                    {valor && <span className="text-[10px] text-emerald-500/70">Valor: {valor}</span>}
                                  </div>
                                  <button 
                                    onClick={() => copyToClipboard(codigo)}
                                    className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1.5 rounded-md font-black text-[9px] uppercase tracking-widest"
                                    title="Copiar Cupom"
                                  >
                                    <Copy className="w-3 h-3" /> COPIAR CÓDIGO
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-gray-500 text-sm font-medium italic">
                        Nenhum cupom disponível no momento.
                      </div>
                    )}
                  </div>
                </div>

                {/* Registration Form */}
                {isGerente && (
                  <div className="border-t border-white/10 pt-8" id="afiliado-form">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-base font-bold text-white uppercase tracking-widest">
                        {editingLink?.type === 'afiliado' ? 'Editar Oferta para Afiliados' : 'Cadastrar Nova Oferta para Afiliados'}
                      </h3>
                      {editingLink?.type === 'afiliado' && (
                        <button 
                          onClick={cancelEditing}
                          className="text-xs text-red-500 font-black uppercase tracking-widest hover:text-red-400 transition-colors"
                        >
                          Cancelar Edição
                        </button>
                      )}
                    </div>
                    <form onSubmit={handleAfiliadoSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Título da Oferta</label>
                          <input 
                            type="text" 
                            name="titulo"
                            value={afiliadoFormData.titulo}
                            onChange={handleAfiliadoInputChange}
                            placeholder="Ex: Sambox 1 Mês"
                            required
                            className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Valor do Cupom</label>
                          <input 
                            type="text" 
                            name="valorCupom"
                            value={afiliadoFormData.valorCupom}
                            onChange={handleAfiliadoInputChange}
                            placeholder="Ex: R$ 10,00 ou 10%"
                            required
                            className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4 ml-1 flex justify-between items-center">
                            <span>Cupons e Valores</span>
                            <button 
                              type="button" 
                              onClick={() => addCouponToForm('afiliado')}
                              className="text-[10px] bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-all font-black"
                            >
                              + Adicionar Cupom
                            </button>
                          </label>
                          <div className="space-y-3">
                            {afiliadoFormData.cupons.map((c, index) => (
                              <div key={index} className="flex gap-3 items-end group">
                                <div className="flex-[2]">
                                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">Código</label>
                                  <input 
                                    type="text" 
                                    value={c.codigo}
                                    onChange={(e) => handleCouponChange('afiliado', index, 'codigo', e.target.value)}
                                    placeholder="Código"
                                    className="w-full bg-[#080808] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-600 transition-all"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">Valor</label>
                                  <input 
                                    type="text" 
                                    value={c.valor}
                                    onChange={(e) => handleCouponChange('afiliado', index, 'valor', e.target.value)}
                                    placeholder="Ex: R$ 20,00"
                                    className="w-full bg-[#080808] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-600 transition-all"
                                  />
                                </div>
                                {afiliadoFormData.cupons.length > 1 && (
                                  <button 
                                    type="button"
                                    onClick={() => removeCouponFromForm('afiliado', index)}
                                    className="p-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all mb-0.5"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className={`w-full ${editingLink?.type === 'afiliado' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'bg-blue-600 hover:bg-blue-700 shadow-[0_0_30px_rgba(37,99,235,0.3)]'} text-white font-black text-sm uppercase tracking-[0.2em] rounded-xl px-4 py-5 mt-4 transition-all active:scale-[0.98]`}
                      >
                        {editingLink?.type === 'afiliado' ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR OFERTA'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeMainTab === 'videos' && (
          <div className="space-y-6">
            {activeSubTab === 'galeria' && (
              <>
                {/* Barra de Busca de Vídeos */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Buscar por título ou descrição..."
                    value={videoSearchQuery}
                    onChange={(e) => setVideoSearchQuery(e.target.value)}
                    className="w-full bg-[#111111] border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-sm text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-gray-600 shadow-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.filter(v => 
                    v.title.toLowerCase().includes(videoSearchQuery.toLowerCase()) || 
                    v.description.toLowerCase().includes(videoSearchQuery.toLowerCase())
                  ).length > 0 ? (
                    videos
                      .filter(v => 
                        v.title.toLowerCase().includes(videoSearchQuery.toLowerCase()) || 
                        v.description.toLowerCase().includes(videoSearchQuery.toLowerCase())
                      )
                      .map((video) => (
                        <div key={video.id} className="bg-[#111111] rounded-2xl border border-white/10 overflow-hidden group hover:border-blue-500/50 transition-all shadow-xl flex flex-col">
                      <div className="relative aspect-video overflow-hidden bg-black">
                        <Image 
                          src={video.thumbnailUrl} 
                          alt={video.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button 
                            onClick={() => setPlayingVideo(video)}
                            className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-2xl scale-90 group-hover:scale-100 transition-all duration-300 opacity-0 group-hover:opacity-100"
                          >
                            <Play className="w-6 h-6 fill-current" />
                          </button>
                        </div>
                        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-md rounded text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                          Tutorial
                        </div>
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="text-base font-black text-white uppercase tracking-tight leading-tight line-clamp-2">{video.title}</h3>
                          {isGerente && (
                            <button 
                              onClick={() => setVideoToDelete(video.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors shrink-0"
                              title="Excluir Vídeo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-medium line-clamp-3 mb-4 flex-1">
                          {video.description || 'Sem descrição disponível.'}
                        </p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center text-[10px] font-bold text-blue-500 uppercase">
                              {video.createdBy.charAt(0)}
                            </div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate max-w-[80px]">
                              {video.createdBy.split('@')[0]}
                            </span>
                          </div>
                          <button 
                            onClick={() => setPlayingVideo(video)}
                            className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors"
                          >
                            Assistir <Play className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full bg-[#111111] rounded-2xl border border-white/10 p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-600 mx-auto mb-4">
                      <Video className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
                      {videoSearchQuery ? 'Nenhum resultado encontrado' : 'Nenhum vídeo encontrado'}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto">
                      {videoSearchQuery 
                        ? `Não encontramos vídeos para "${videoSearchQuery}". Tente outros termos.`
                        : 'Ainda não há tutoriais cadastrados na galeria.'}
                    </p>
                    {isGerente && !videoSearchQuery && (
                      <button 
                        onClick={() => setActiveSubTab('novo')}
                        className="mt-6 px-6 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                      >
                        Cadastrar Primeiro Vídeo
                      </button>
                    )}
                    {videoSearchQuery && (
                      <button 
                        onClick={() => setVideoSearchQuery('')}
                        className="mt-6 px-6 py-3 bg-white/5 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                      >
                        Limpar Busca
                      </button>
                    )}
                  </div>
                )}
              </div>
              </>
            )}

            {activeSubTab === 'novo' && isGerente && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-[#111111] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                  <div className="p-6 md:p-8 border-b border-white/5 bg-white/[0.01]">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                      <Plus className="w-6 h-6 text-blue-500" />
                      Cadastrar Tutorial
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Adicione um novo vídeo para a equipe.</p>
                  </div>
                  
                  <form onSubmit={handleVideoSubmit} className="p-6 md:p-8 space-y-6">
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Título do Vídeo</label>
                      <input 
                        type="text" 
                        value={videoFormData.title}
                        onChange={(e) => setVideoFormData({...videoFormData, title: e.target.value})}
                        placeholder="Ex: Como configurar o Sambox Steam"
                        required
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Link do Vídeo (YouTube ou outro)</label>
                      <input 
                        type="url" 
                        value={videoFormData.url}
                        onChange={(e) => setVideoFormData({...videoFormData, url: e.target.value})}
                        placeholder="https://www.youtube.com/watch?v=..."
                        required
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                      />
                      <p className="text-[10px] text-gray-600 mt-2 ml-1 font-medium italic">* Links do YouTube geram a capa automaticamente.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Link da Thumbnail (Opcional)</label>
                      <input 
                        type="url" 
                        value={videoFormData.thumbnailUrl}
                        onChange={(e) => setVideoFormData({...videoFormData, thumbnailUrl: e.target.value})}
                        placeholder="https://.../imagem.jpg"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Descrição</label>
                      <textarea 
                        value={videoFormData.description}
                        onChange={(e) => setVideoFormData({...videoFormData, description: e.target.value})}
                        placeholder="Descreva brevemente o que é ensinado neste vídeo..."
                        rows={4}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all resize-none"
                      />
                    </div>

                    <div className="pt-4 flex gap-4">
                      <button 
                        type="button"
                        onClick={() => setActiveSubTab('galeria')}
                        className="flex-1 py-4 rounded-xl bg-white/5 text-gray-400 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        disabled={isVideoLoading}
                        className="flex-1 py-4 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                      >
                        {isVideoLoading ? 'Salvando...' : 'Cadastrar Vídeo'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeMainTab === 'perfil' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-[#111111] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-8 text-center bg-gradient-to-b from-blue-600/10 to-transparent">
                <div className="w-24 h-24 rounded-full bg-blue-600/20 border-2 border-blue-500/30 flex items-center justify-center mx-auto mb-4 shadow-2xl overflow-hidden relative group">
                  {photoURL ? (
                    <Image src={photoURL || ''} alt="Perfil" fill referrerPolicy="no-referrer" className="object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-blue-500" />
                  )}
                  <div 
                    onClick={() => { setNewDisplayName(displayName || ''); setNewPhotoURL(photoURL || ''); setIsEditingProfile(true); }}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <Edit2 className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">{displayName || user?.email?.split('@')[0]}</h2>
                <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mt-2 ${
                  isAdmin ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 
                  isGerente ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 
                  'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                }`}>
                  {isAdmin ? 'Administrador Master' : isGerente ? 'Gerente de Equipe' : 'Instalador Autorizado'}
                </span>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Configurações de Perfil</label>
                    {isEditingProfile ? (
                      <div className="flex flex-col gap-3">
                        <input 
                          type="text"
                          value={newDisplayName}
                          onChange={(e) => setNewDisplayName(e.target.value)}
                          placeholder="Seu nome de exibição..."
                          className="w-full bg-black/50 border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                        />
                        <input 
                          type="url"
                          value={newPhotoURL}
                          onChange={(e) => setNewPhotoURL(e.target.value)}
                          placeholder="URL da sua foto (ex: https://imgur.com/...)"
                          className="w-full bg-black/50 border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                        />
                        <div className="flex gap-2 justify-end mt-2">
                          <button 
                            onClick={handleUpdateProfile}
                            disabled={isSavingProfile}
                            className="px-6 py-3 bg-blue-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                          >
                            Salvar Alterações
                          </button>
                          <button 
                            onClick={() => setIsEditingProfile(false)}
                            className="px-6 py-3 bg-white/5 text-gray-400 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-black/50 border border-white/5 rounded-xl px-4 py-4">
                        <span className="text-sm text-gray-300 font-medium">{displayName || 'Não definido'}</span>
                        <button 
                          onClick={() => { setNewDisplayName(displayName || ''); setIsEditingProfile(true); }}
                          className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Email de Acesso</label>
                    <div className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-4 text-sm text-gray-400 font-medium">
                      {user?.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Nível de Autoridade</label>
                    <div className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-4 text-sm text-gray-400 font-medium">
                      {isAdmin ? 'Acesso Total ao Sistema' : isGerente ? 'Acesso Administrativo (Exceto Financeiro)' : 'Acesso Operacional'}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" /> Segurança da Conta
                  </h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6">
                    Sua conta está protegida pela camada de segurança do Firebase. Se desejar alterar sua senha, cliqe no botão abaixo para receber um link de redefinição no seu email.
                  </p>
                  
                  {profileMessage.text && (
                    <div className={`mb-6 p-4 rounded-xl text-xs font-bold text-center animate-in fade-in zoom-in-95 ${
                      profileMessage.type === 'success' 
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/10 border border-red-500/20 text-red-500'
                    }`}>
                      {profileMessage.text}
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleResetPassword}
                      className="w-full py-4 rounded-xl bg-blue-500/10 text-blue-500 text-xs font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Key className="w-4 h-4" /> Alterar Senha
                    </button>
                    <button 
                      onClick={() => signOut(auth)}
                      className="w-full py-4 rounded-xl bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Encerrar Sessão
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 flex gap-4 items-start">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-300/60 leading-relaxed">
                <p className="font-bold text-blue-400 mb-1">Dica de Segurança</p>
                Nunca compartilhe sua conta com outros instaladores. Cada membro da equipe deve ter seu próprio acesso para garantir a rastreabilidade das instalações e keys geradas.
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'usuarios' && isGerente && (
          <UsersManagement currentRole={role} currentUserEmail={user?.email} />
        )}
      </main>

      {/* Modal para Descrição de Extras */}
      {selectedExtra !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Detalhes do Extra</h3>
              <button 
                onClick={() => setSelectedExtra(null)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-300 leading-relaxed">
                {selectedExtra || "Nenhuma descrição informada."}
              </p>
            </div>
            <div className="p-4 bg-white/[0.02] border-t border-white/5">
              <button 
                onClick={() => setSelectedExtra(null)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all"
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Transação */}
      {editingTransaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                  <Edit2 className="w-6 h-6 text-blue-500" />
                  Editar Registro Financeiro
                </h3>
                <button 
                  onClick={() => setEditingTransaction(null)}
                  className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleEditTransactionSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Data</label>
                    <input 
                      type="date" 
                      value={editingTransaction.date}
                      onChange={e => setEditingTransaction({...editingTransaction, date: e.target.value})}
                      className="block w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all text-sm"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Vendas (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={editingTransaction.vendas}
                      onChange={e => setEditingTransaction({...editingTransaction, vendas: e.target.value})}
                      className="block w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black text-blue-400 uppercase tracking-widest ml-1">Pix (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={editingTransaction.pix}
                      onChange={e => setEditingTransaction({...editingTransaction, pix: e.target.value})}
                      className="block w-full px-4 py-3 bg-black border border-blue-500/30 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Ads Facebook (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={editingTransaction.ads_facebook}
                      onChange={e => setEditingTransaction({...editingTransaction, ads_facebook: e.target.value})}
                      className="block w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Ads Google (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={editingTransaction.ads_google}
                      onChange={e => setEditingTransaction({...editingTransaction, ads_google: e.target.value})}
                      className="block w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Ads TikTok (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={editingTransaction.ads_tiktok}
                      onChange={e => setEditingTransaction({...editingTransaction, ads_tiktok: e.target.value})}
                      className="block w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Extras (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={editingTransaction.extras}
                      onChange={e => setEditingTransaction({...editingTransaction, extras: e.target.value})}
                      className="block w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Descrição do Extra</label>
                  <textarea 
                    value={editingTransaction.descricao_extra}
                    onChange={e => setEditingTransaction({...editingTransaction, descricao_extra: e.target.value})}
                    rows={3}
                    className="block w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button 
                    type="button"
                    onClick={() => setEditingTransaction(null)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Transação */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Apagar Registro?</h3>
              <p className="text-sm text-gray-400 mb-6">
                Esta ação não pode ser desfeita. O registro financeiro será removido permanentemente.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setTransactionToDelete(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={confirmDeleteTransaction}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-500/20"
                >
                  APAGAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Notícia */}
      {noticiaToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Apagar Notícia?</h3>
              <p className="text-sm text-gray-400 mb-6">
                Tem certeza que deseja apagar esta notícia do mural? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setNoticiaToDelete(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDeleteNoticia}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                >
                  Apagar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Link */}
      {linkToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Apagar Link?</h3>
              <p className="text-sm text-gray-400 mb-6">
                Tem certeza que deseja apagar este link? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setLinkToDelete(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDeleteLink}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                >
                  Apagar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Cupom */}
      {cupomToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Apagar Cupom?</h3>
              <p className="text-sm text-gray-400 mb-6">
                Tem certeza que deseja apagar este cupom? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setCupomToDelete(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDeleteCupom}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                >
                  Apagar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 bg-[#0a0a0a] py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-500 font-medium">
            &copy; {new Date().getFullYear()} Sambox Dashboard. Todos os direitos reservados.
          </div>
          
          {isGerente && (
            <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-widest hidden md:inline-block">Administração</span>
              <button 
                onClick={() => { setActiveMainTab('postar_aviso'); window.scrollTo(0, 0); }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 ${activeMainTab === 'postar_aviso' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
              >
                <Megaphone className="w-4 h-4" /> Postar
              </button>
              {isAdmin && (
                <button 
                  onClick={() => { setActiveMainTab('financeiro'); window.scrollTo(0, 0); }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 ${activeMainTab === 'financeiro' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                >
                  <DollarSign className="w-4 h-4" /> Financeiro
                </button>
              )}
              <button 
                onClick={() => { setActiveMainTab('usuarios'); window.scrollTo(0, 0); }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 ${activeMainTab === 'usuarios' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
              >
                <UserCheck className="w-4 h-4" /> Gerenciar Usuários
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
            <button 
              onClick={() => { setActiveMainTab('perfil'); window.scrollTo(0, 0); }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 ${activeMainTab === 'perfil' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
            >
              <User className="w-4 h-4" /> Minha Conta
            </button>
          </div>
        </div>
      </footer>

      {/* Modal de Confirmação de Exclusão de Vídeo */}
      {videoToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Excluir Vídeo?</h3>
                <p className="text-xs text-gray-500 font-medium">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setVideoToDelete(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDeleteVideo(videoToDelete)}
                disabled={isVideoLoading}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isVideoLoading ? 'Excluindo...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Player de Vídeo */}
      {playingVideo && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-full">
            <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600/10 text-blue-500">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight leading-tight line-clamp-1">{playingVideo.title}</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tutorial por {playingVideo.createdBy.split('@')[0]}</p>
                </div>
              </div>
              <button 
                onClick={() => setPlayingVideo(null)}
                className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <div className="relative aspect-video bg-black flex-1">
              {playingVideo.url.includes('youtube.com') || playingVideo.url.includes('youtu.be') ? (
                <iframe 
                  src={getEmbedUrl(playingVideo.url)}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <Video className="w-16 h-16 text-gray-800 mb-4" />
                  <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">Link Externo Detectado</h4>
                  <p className="text-sm text-gray-500 font-medium max-w-md mb-6">
                    Este vídeo não pode ser reproduzido diretamente aqui por questões de segurança ou formato. Clique no botão abaixo para assistir na fonte original.
                  </p>
                  <a 
                    href={playingVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-4 bg-blue-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                  >
                    Abrir Link Original <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {playingVideo.description && (
              <div className="p-6 md:p-8 bg-white/[0.01] border-t border-white/5 overflow-y-auto">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Sobre este tutorial</h4>
                <p className="text-sm text-gray-300 font-medium leading-relaxed">
                  {playingVideo.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
