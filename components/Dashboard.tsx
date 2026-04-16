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
  Gamepad2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import UsersManagement from './UsersManagement';

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
  const { user, role, displayName, refreshProfile } = useAuth();
  const isAdmin = role === 'administrador' || user?.email === 'sammyanbr@gmail.com' || user?.email === 'zrpg01@gmail.com';
  const isGerente = role === 'gerente' || isAdmin;
  const isAfiliado = role === 'afiliado';
  const [activeMainTab, setActiveMainTab] = useState<'financeiro' | 'instalacoes' | 'keys' | 'others' | 'usuarios' | 'videos' | 'perfil'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeMainTab');
      if (saved) return saved as any;
    }
    return 'perfil';
  });
  const [activeSubTab, setActiveSubTab] = useState<'novo' | 'historico' | 'zap' | 'vendas' | 'galeria' | 'afiliados' | 'denuvo'>(() => {
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
        setActiveMainTab('others');
        setActiveSubTab('afiliados');
      }
      if (activeMainTab === 'others' && ['zap', 'vendas'].includes(activeSubTab)) {
        setActiveSubTab('afiliados');
      }
    }
  }, [isAfiliado, activeMainTab, activeSubTab]);

  const [isOthersDropdownOpen, setIsOthersDropdownOpen] = useState(false);

  // Perfil State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleUpdateProfile = async () => {
    if (!user || !newDisplayName.trim()) return;
    setIsSavingProfile(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: newDisplayName.trim()
      });
      await refreshProfile();
      setIsEditingProfile(false);
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error("Error updating profile:", err);
      alert('Erro ao atualizar perfil.');
    } finally {
      setIsSavingProfile(false);
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
      const qDespesas = query(collection(db, 'despesasFixas'), orderBy('createdAt', 'desc'));
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
          createdAt: new Date().toISOString()
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
          date: now
        }));
        setGeneratedKeys(prev => [...keyObjects, ...prev]);
        setKeyAuthNote(''); // Clear note after success
        
        // Refresh full list to ensure sync
        setTimeout(fetchKeyAuthKeys, 1000);
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
    if (!keyAuthSellerKey) return;
    
    setIsFetchingKeys(true);
    try {
      const url = `https://keyauth.win/api/seller/?sellerkey=${keyAuthSellerKey}&type=fetchall&format=json`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.keys)) {
        // Map KeyAuth keys to our format
        const mappedKeys = data.keys.map((k: any) => ({
          key: k.key,
          note: k.note || '',
          date: k.gendate ? new Date(parseInt(k.gendate) * 1000).toISOString() : new Date().toISOString()
        })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setGeneratedKeys(mappedKeys);
      }
    } catch (err) {
      console.error("Erro ao buscar keys do KeyAuth:", err);
    } finally {
      setIsFetchingKeys(false);
    }
  }, [keyAuthSellerKey]);

  React.useEffect(() => {
    if (activeMainTab === 'keys') {
      fetchKeyAuthKeys();
    }
  }, [activeMainTab, fetchKeyAuthKeys]);

  const deleteKeyAuthKey = async (keyToDelete: string) => {
    setIsDeletingKey(true);
    setKeyAuthError('');
    
    try {
      const url = `https://keyauth.win/api/seller/?sellerkey=${keyAuthSellerKey}&type=del&key=${keyToDelete}&format=json`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setGeneratedKeys(prev => prev.filter(k => k.key !== keyToDelete));
        setKeyToDeleteAuth(null);
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
    const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
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
    
    // If not gerente/admin, filter by createdBy to comply with security rules
    let q;
    if (isGerente) {
      q = query(collection(db, 'installations'), orderBy('createdAt', 'desc'));
    } else {
      q = query(
        collection(db, 'installations'), 
        where('createdBy', '==', user.email),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const instList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInstallations(instList);
      setIsFetchingInstallations(false);
    }, (error) => {
      console.error("Error fetching installations:", error);
      setIsFetchingInstallations(false);
    });

    return () => unsubscribe();
  }, [user?.email, isGerente]);

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
          if (videoId) thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        } else if (videoFormData.url.includes('youtu.be/')) {
          const videoId = videoFormData.url.split('youtu.be/')[1]?.split('?')[0];
          if (videoId) thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        } else if (videoFormData.url.includes('youtube.com/shorts/')) {
          const videoId = videoFormData.url.split('shorts/')[1]?.split('?')[0];
          if (videoId) thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
      }

      await addDoc(collection(db, 'videos'), {
        ...videoFormData,
        thumbnailUrl: thumbUrl || 'https://picsum.photos/seed/video/800/450',
        createdBy: user?.email || 'Sistema',
        createdAt: serverTimestamp()
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

  // Sambox Links State
  interface QuickLink {
    id: string;
    nome: string;
    valor: string;
    link: string;
    cupons: string[];
  }
  interface AfiliadoOferta {
    id: string;
    titulo: string;
    valorCupom: string;
    cupons: string[];
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
    cupons: ''
  });

  const [samboxLinks, setSamboxLinks] = useState<QuickLink[]>([]);
  const [samboxLinkFormData, setSamboxLinkFormData] = useState({
    nome: '',
    valor: '',
    link: '',
    cupons: ''
  });

  // Steam Links State
  const [steamLinks, setSteamLinks] = useState<QuickLink[]>([]);
  const [steamLinkFormData, setSteamLinkFormData] = useState({
    nome: '',
    valor: '',
    link: '',
    cupons: ''
  });

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
    const qSambox = query(collection(db, 'samboxLinks'), orderBy('createdAt', 'desc'));
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

    const qSteam = query(collection(db, 'steamLinks'), orderBy('createdAt', 'desc'));
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

    const qDenuvoAcc = query(collection(db, 'denuvoAccounts'), orderBy('createdAt', 'desc'));
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

    const qDenuvoHis = query(collection(db, 'denuvoHistory'), orderBy('createdAt', 'desc'));
    const unsubscribeDenuvoHis = onSnapshot(qDenuvoHis, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DenuvoHistory[];
      setDenuvoHistoryList(history);
    }, (error) => {
      console.error('Error fetching denuvoHistory:', error);
    });

    const qAfiliado = query(collection(db, 'afiliadoOfertas'), orderBy('createdAt', 'desc'));
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
      unsubscribeSteam();
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
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const newOferta = {
      titulo: afiliadoFormData.titulo,
      valorCupom: afiliadoFormData.valorCupom,
      cupons: cuponsArray,
      createdAt: new Date().toISOString(),
      createdBy: user?.email || 'unknown'
    };
    
    try {
      await addDoc(collection(db, 'afiliadoOfertas'), newOferta);
      setAfiliadoFormData({ titulo: '', valorCupom: '', cupons: '' });
    } catch (error) {
      console.error('Error adding afiliado oferta:', error);
      alert('Erro ao adicionar oferta de afiliado.');
    }
  };

  const handleSamboxLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cuponsArray = samboxLinkFormData.cupons
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const newLink = {
      nome: samboxLinkFormData.nome,
      valor: samboxLinkFormData.valor,
      link: samboxLinkFormData.link,
      cupons: cuponsArray,
      createdAt: new Date().toISOString(),
      createdBy: user?.email || 'unknown'
    };
    
    try {
      await addDoc(collection(db, 'samboxLinks'), newLink);
      setSamboxLinkFormData({ nome: '', valor: '', link: '', cupons: '' });
    } catch (error) {
      console.error('Error adding sambox link:', error);
      alert('Erro ao adicionar link.');
    }
  };

  const handleSteamLinkInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSteamLinkFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSteamLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Split comma-separated coupons into an array
    const cuponsArray = steamLinkFormData.cupons
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const newLink = {
      nome: steamLinkFormData.nome,
      valor: steamLinkFormData.valor,
      link: steamLinkFormData.link,
      cupons: cuponsArray,
      createdAt: new Date().toISOString(),
      createdBy: user?.email || 'unknown'
    };
    
    try {
      await addDoc(collection(db, 'steamLinks'), newLink);
      setSteamLinkFormData({ nome: '', valor: '', link: '', cupons: '' });
    } catch (error) {
      console.error('Error adding steam link:', error);
      alert('Erro ao adicionar link.');
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
      createdAt: new Date().toISOString()
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
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                  <Image src="/samboxlogo.fw.png" alt="Sambox Logo" width={32} height={32} className="w-full h-full object-contain" />
                </div>
                <span className="text-base md:text-2xl font-black tracking-tighter text-white uppercase italic truncate">
                  Sambox <span className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">Dashboard</span>
                </span>
              </div>
              
              {/* Mobile User Info - Simplified */}
              <div className="flex md:hidden items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-[8px] text-blue-300/60 uppercase font-bold tracking-widest">{role || 'Usuário'}</p>
                  <p className="text-[10px] font-black text-white leading-none uppercase truncate max-w-[100px]">{displayName || user?.email?.split('@')[0] || 'Sammy'}</p>
                </div>
                <button 
                  onClick={() => { setActiveMainTab('perfil'); window.scrollTo(0, 0); }}
                  className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                  title="Minha Conta"
                >
                  <User className="w-3.5 h-3.5 text-blue-500" />
                </button>
                <button 
                  onClick={() => signOut(auth)}
                  className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            </div>

            {/* Navigation Items - Better spacing and scroll */}
            <nav className="flex flex-wrap items-center gap-1 md:gap-2 py-1 md:py-0">
              {!isAfiliado && (
                <button 
                  onClick={() => { setActiveMainTab('instalacoes'); setActiveSubTab('novo'); setIsOthersDropdownOpen(false); }}
                  className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-sm font-black uppercase tracking-[0.15em] md:tracking-[0.2em] whitespace-nowrap transition-all ${activeMainTab === 'instalacoes' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-300/40 hover:text-white'}`}
                >
                  Instalações
                </button>
              )}
              <button 
                onClick={() => { setActiveMainTab('keys'); setActiveSubTab('novo'); setIsOthersDropdownOpen(false); }}
                className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-sm font-black uppercase tracking-[0.15em] md:tracking-[0.2em] whitespace-nowrap transition-all ${activeMainTab === 'keys' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-300/40 hover:text-white'}`}
              >
                Keys Steam
              </button>
              {!isAfiliado && (
                <button 
                  onClick={() => { setActiveMainTab('videos'); setActiveSubTab('galeria'); setIsOthersDropdownOpen(false); }}
                  className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-sm font-black uppercase tracking-[0.15em] md:tracking-[0.2em] whitespace-nowrap transition-all ${activeMainTab === 'videos' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-300/40 hover:text-white'}`}
                >
                  Vídeos
                </button>
              )}
              
              <div className="relative">
                <button 
                  onClick={() => setIsOthersDropdownOpen(!isOthersDropdownOpen)}
                  className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-sm font-black uppercase tracking-[0.15em] md:tracking-[0.2em] whitespace-nowrap transition-all flex items-center gap-1 ${activeMainTab === 'others' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-300/40 hover:text-white'}`}
                >
                  Outros <Plus className={`w-3 h-3 transition-transform ${isOthersDropdownOpen ? 'rotate-45' : ''}`} />
                </button>

                {isOthersDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    {!isAfiliado && (
                      <>
                        <button 
                          onClick={() => { setActiveMainTab('others'); setActiveSubTab('zap'); setIsOthersDropdownOpen(false); }}
                          className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                        >
                          <MessageCircle className="w-3 h-3" /> Sambox
                        </button>
                        <button 
                          onClick={() => { setActiveMainTab('others'); setActiveSubTab('vendas'); setIsOthersDropdownOpen(false); }}
                          className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 border-t border-white/5"
                        >
                          <DollarSign className="w-3 h-3" /> Sambox Steam
                        </button>
                        <button 
                          onClick={() => { setActiveMainTab('others'); setActiveSubTab('denuvo'); setIsOthersDropdownOpen(false); }}
                          className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 border-t border-white/5"
                        >
                          <Gamepad2 className="w-3 h-3" /> Denuvo
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => { setActiveMainTab('others'); setActiveSubTab('afiliados'); setIsOthersDropdownOpen(false); }}
                      className={`w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 ${!isAfiliado ? 'border-t border-white/5' : ''}`}
                    >
                      <Percent className="w-3 h-3" /> Links Afiliados
                    </button>
                  </div>
                )}
              </div>
            </nav>

            {/* Desktop User Info */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-blue-300/60 uppercase font-bold tracking-widest">{role || 'Usuário'}</p>
                <p className="text-sm font-black text-white leading-none uppercase truncate max-w-[150px]">{displayName || user?.email?.split('@')[0] || 'Sammy'}</p>
              </div>
              <button 
                onClick={() => { setActiveMainTab('perfil'); window.scrollTo(0, 0); }}
                className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                title="Minha Conta"
              >
                <User className="w-4 h-4 text-blue-500" />
              </button>
              <button 
                onClick={() => signOut(auth)}
                className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4 text-red-500 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 font-display">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tight">
              {activeMainTab === 'financeiro' ? 'Gestão Financeira' : activeMainTab === 'instalacoes' ? 'Instalações Sambox' : activeMainTab === 'keys' ? 'Keys Steam' : activeMainTab === 'usuarios' ? 'Gerenciar Usuários' : activeMainTab === 'videos' ? 'Vídeos Tutoriais' : activeMainTab === 'perfil' ? 'Minha Conta' : 'Outros'}
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              {activeMainTab === 'financeiro' ? 'Controle de entradas e saídas em tempo real.' : activeMainTab === 'instalacoes' ? 'Registro e acompanhamento de novas instalações.' : activeMainTab === 'keys' ? 'Gerenciamento de chaves de ativação.' : activeMainTab === 'usuarios' ? 'Controle de acessos e permissões do sistema' : activeMainTab === 'videos' ? 'Galeria de tutoriais e treinamentos da equipe.' : activeMainTab === 'perfil' ? 'Gerencie seu perfil e configurações.' : 'Gerenciamento de links e ferramentas úteis.'}
            </p>
          </div>
          
          {/* Sub-menu Tabs */}
          {activeMainTab !== 'usuarios' && (
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
                {!isAfiliado && (
                  <>
                    <button 
                      onClick={() => setActiveSubTab('zap')}
                      className={`px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${activeSubTab === 'zap' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      Sambox
                    </button>
                    <button 
                      onClick={() => setActiveSubTab('vendas')}
                      className={`px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${activeSubTab === 'vendas' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      Sambox Steam
                    </button>
                    <button 
                      onClick={() => setActiveSubTab('denuvo')}
                      className={`px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${activeSubTab === 'denuvo' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      Denuvo
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setActiveSubTab('afiliados')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${activeSubTab === 'afiliados' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Links Afiliados
                </button>
              </>
            )}
          </div>
          )}
        </div>

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
                    Links de Venda Rápidos - Sambox
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
                              <button
                                onClick={() => setLinkToDelete({ id: item.id, type: 'sambox' })}
                                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                title="Apagar Link"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
                          {item.cupons && item.cupons.length > 0 && (
                            <div className="flex flex-col gap-2 mt-1">
                              {item.cupons.map((cupom, cIdx) => (
                                <div key={cIdx} className="w-full py-2.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase rounded-lg flex items-center justify-between px-4">
                                  <span>Cupom: {cupom}</span>
                                  <button 
                                    onClick={() => copyToClipboard(`Cupom: ${cupom}`)}
                                    className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-md"
                                    title="Copiar Cupom"
                                  >
                                    <Download className="w-3 h-3" /> Copiar
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
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
                    <div className="border-t border-white/10 pt-8">
                      <h3 className="text-base font-bold text-white mb-5 uppercase tracking-widest">Cadastrar Novo Link</h3>
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
                          <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Cupons (separados por vírgula)</label>
                            <input 
                              type="text" 
                              name="cupons"
                              value={samboxLinkFormData.cupons}
                              onChange={handleSamboxLinkInputChange}
                              placeholder="Ex: DESC10, PROMO20"
                              className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all uppercase"
                            />
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-[0.2em] rounded-xl px-4 py-5 mt-4 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] active:scale-[0.98]"
                        >
                          CADASTRAR LINK
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
                  Links de Venda Rápidos - Sambox Steam
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
                            <button
                              onClick={() => setLinkToDelete({ id: item.id, type: 'steam' })}
                              className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                              title="Apagar Link"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
                        {item.cupons && item.cupons.length > 0 && (
                          <div className="flex flex-col gap-2 mt-1">
                            {item.cupons.map((cupom, cIdx) => (
                              <div key={cIdx} className="w-full py-2.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase rounded-lg flex items-center justify-between px-4">
                                <span>Cupom: {cupom}</span>
                                <button 
                                  onClick={() => copyToClipboard(`Cupom: ${cupom}`)}
                                  className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-md"
                                  title="Copiar Cupom"
                                >
                                  <Download className="w-3 h-3" /> Copiar
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
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
                    <h3 className="text-base font-bold text-white mb-5 uppercase tracking-widest">Cadastrar Novo Link</h3>
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
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Cupons (separados por vírgula)</label>
                          <input 
                            type="text" 
                            name="cupons"
                            value={steamLinkFormData.cupons}
                            onChange={handleSteamLinkInputChange}
                            placeholder="Ex: DESC10, PROMO20"
                            className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all uppercase"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-[0.2em] rounded-xl px-4 py-5 mt-4 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] active:scale-[0.98]"
                      >
                        CADASTRAR LINK
                      </button>
                    </form>
                  </div>
                )}
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
                                <img src={print.imageUrl} alt={print.gameName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                            {isGerente && (
                              <button
                                onClick={() => setLinkToDelete({ id: item.id, type: 'afiliado' })}
                                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                title="Apagar Oferta"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="mt-2 flex flex-col gap-2">
                            {item.cupons.map((cupom, cIdx) => (
                              <div key={cIdx} className="w-full py-2.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase rounded-lg flex items-center justify-between px-4">
                                <span>Cupom: {cupom}</span>
                                <button 
                                  onClick={() => copyToClipboard(cupom)}
                                  className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-md"
                                  title="Copiar Cupom"
                                >
                                  <Copy className="w-3 h-3" /> Copiar
                                </button>
                              </div>
                            ))}
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
                  <div className="border-t border-white/10 pt-8">
                    <h3 className="text-base font-bold text-white mb-5 uppercase tracking-widest">Cadastrar Nova Oferta para Afiliados</h3>
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
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Nomes dos Cupons (separados por vírgula)</label>
                        <input 
                          type="text" 
                          name="cupons"
                          value={afiliadoFormData.cupons}
                          onChange={handleAfiliadoInputChange}
                          placeholder="Ex: PROMO10, SAMBOX10"
                          required
                          className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-blue-600 transition-all uppercase"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-[0.2em] rounded-xl px-4 py-5 mt-4 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] active:scale-[0.98]"
                      >
                        CADASTRAR OFERTA
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
                <div className="w-24 h-24 rounded-full bg-blue-600/20 border-2 border-blue-500/30 flex items-center justify-center mx-auto mb-4 shadow-2xl">
                  <User className="w-10 h-10 text-blue-500" />
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
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Nome de Exibição</label>
                    {isEditingProfile ? (
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={newDisplayName}
                          onChange={(e) => setNewDisplayName(e.target.value)}
                          placeholder="Seu nome..."
                          className="flex-1 bg-black/50 border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                        />
                        <button 
                          onClick={handleUpdateProfile}
                          disabled={isSavingProfile}
                          className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setIsEditingProfile(false)}
                          className="px-4 py-3 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                    Sua conta está protegida pela autenticação do Google. Para alterar sua senha ou informações de perfil, utilize as configurações da sua conta Google.
                  </p>
                  <button 
                    onClick={() => signOut(auth)}
                    className="w-full py-4 rounded-xl bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Encerrar Sessão
                  </button>
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

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 bg-[#0a0a0a] py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-500 font-medium">
            &copy; {new Date().getFullYear()} Sambox Dashboard. Todos os direitos reservados.
          </div>
          
          {isGerente && (
            <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-widest hidden md:inline-block">Administração</span>
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
