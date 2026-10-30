'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, writeBatch, addDoc, deleteDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

interface Unit {
  id: string;
  block: string;
  unitNumber: number;
  residentName: string;
  phone: string;
  isTenant: boolean;
  landlordName: string;
  debt: number;
  status: 'paid' | 'unpaid';
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  category: string;
  date: string;
}

interface Complaint {
  id: string;
  unitInfo: string;
  title: string;
  description: string;
  status: 'pending' | 'resolved';
  date: string;
}

export default function YonetimPanelPage() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [currentSiteName, setCurrentSiteName] = useState('Bulvar City');

  const [activeTab, setActiveTab] = useState<'units' | 'directory' | 'accounting' | 'reports' | 'complaints' | 'settings'>('units');
  const [selectedBlock, setSelectedBlock] = useState('A');
  const [dueAmount, setDueAmount] = useState('2000');
  
  const [units, setUnits] = useState<Unit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const [lastAppliedDue, setLastAppliedDue] = useState<number | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [warningModalUnit, setWarningModalUnit] = useState<Unit | null>(null);

  const [currentPackage, setCurrentPackage] = useState<'trial' | 'basic' | 'pro'>('trial');

  // Site Yapılandırma State'leri
  const [configBlocks, setConfigBlocks] = useState('A, B, C');
  const [unitsPerBlockInput, setUnitsPerBlockInput] = useState('10');
  const [configDefaultDue, setConfigDefaultDue] = useState('2000');

  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Aidat Tahsilatı');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const siteParam = urlParams.get('site');
    if (siteParam) {
      setCurrentSiteName(siteParam);
      // Eğer gelen site Demo-Site ise doğrudan admin oturumunu otomatik aç
      if (siteParam === 'Demo-Site') {
        setIsAdminLoggedIn(true);
        sessionStorage.setItem('mcf_admin_logged', 'true');
      }
    }

    const sessionAuth = sessionStorage.getItem('mcf_admin_logged');
    if (sessionAuth === 'true') {
      setIsAdminLoggedIn(true);
    }

    const savedDemoPkg = sessionStorage.getItem('mcf_site_package');
    if (savedDemoPkg === 'trial' || savedDemoPkg === 'pro') {
      setCurrentPackage(savedDemoPkg as any);
    }

    const unsubscribeTenants = onSnapshot(collection(db, 'tenants'), (snapshot) => {
      const matchedTenant = snapshot.docs.find(doc => doc.data().siteName === (siteParam || 'Demo-Site'));
      if (matchedTenant) {
        const tenantData = matchedTenant.data();
        if (tenantData.packageType) {
          setCurrentPackage(tenantData.packageType);
        }
      }
    });

    setIsAuthChecked(true);

    return () => unsubscribeTenants();
  }, []);

  useEffect(() => {
    const unsubscribeUnits = onSnapshot(collection(db, 'units'), (snapshot) => {
      let fetchedUnits: Unit[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Unit[];

      setUnits(fetchedUnits);
      setLoading(false);
    });

    const unsubscribeTx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[]);
    });

    const unsubscribeComplaints = onSnapshot(collection(db, 'complaints'), (snapshot) => {
      setComplaints(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Complaint[]);
    });

    return () => {
      unsubscribeUnits();
      unsubscribeTx();
      unsubscribeComplaints();
    };
  }, []);

  if (!isAuthChecked) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontWeight: 'bold' }}>Yükleniyor...</div>;
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) return alert('Lütfen şifre giriniz.');

    if (currentSiteName === 'Demo-Site') {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('mcf_admin_logged', 'true');
      return;
    }

    try {
      const q = query(collection(db, 'tenants'), where('siteName', '==', currentSiteName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const siteData = querySnapshot.docs[0].data();
        if (siteData.sitePassword === adminPassword) {
          setIsAdminLoggedIn(true);
          sessionStorage.setItem('mcf_admin_logged', 'true');
        } else {
          alert('Hatalı site şifresi!');
        }
      } else {
        if (adminPassword === '1453') {
          setIsAdminLoggedIn(true);
          sessionStorage.setItem('mcf_admin_logged', 'true');
        } else {
          alert('Site bulunamadı veya şifre hatalı!');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Giriş yapılırken hata oluştu.');
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0b0f19 0%, #111827 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '20px' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '40px', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', textAlign: 'center' }}>
          
          <h2 style={{ color: '#ffffff', fontSize: '20px', fontWeight: '800', margin: '0 0 6px 0' }}>{currentSiteName}</h2>
          <p style={{ color: '#f59e0b', fontSize: '13px', fontWeight: '700', margin: '0 0 20px 0' }}>Yönetim Ekranı Girişi</p>
          
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="password"
              placeholder="Site Erişim Şifresi"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff', fontSize: '15px', outline: 'none', textAlign: 'center', fontWeight: 'bold' }}
            />
            <button type="submit" style={{ backgroundColor: '#f59e0b', color: '#111827', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>
              Giriş Yap
            </button>
            <a href="/" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none', marginTop: '6px' }}>← Ana Sayfaya Dön</a>
          </form>
        </div>
      </div>
    );
  }

  const availableBlocks = Array.from(new Set(units.map(u => u.block))).sort();
  const currentActiveBlock = availableBlocks.includes(selectedBlock) ? selectedBlock : (availableBlocks[0] || 'A');

  const filteredUnits = units.filter(u => u.block === currentActiveBlock).sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber));
  const sortedAllUnits = [...units].sort((a, b) => a.block === b.block ? Number(a.unitNumber) - Number(b.unitNumber) : a.block.localeCompare(b.block));

  const totalDebtors = units.filter(u => u.status === 'unpaid').length;
  const totalReceivables = units.reduce((sum, u) => sum + (u.debt || 0), 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;
  const pendingComplaintsCount = complaints.filter(c => c.status === 'pending').length;

  const togglePaymentStatus = async (unit: Unit) => {
    try {
      const unitRef = doc(db, 'units', unit.id);
      await updateDoc(unitRef, {
        status: unit.status === 'paid' ? 'unpaid' : 'paid',
        debt: unit.status === 'paid' ? (Number(dueAmount) || 2000) : 0
      });
    } catch (err) { console.error(err); }
  };

  const handleBulkApplyDue = async () => {
    const amount = Number(dueAmount);
    if (!amount || amount <= 0) return alert('Geçerli bir aidat tutarı giriniz.');
    if (!confirm(`${amount} ₺ aidat tüm bloklara yansıtılsın mı?`)) return;

    try {
      const batch = writeBatch(db);
      units.forEach((unit) => {
        batch.update(doc(db, 'units', unit.id), { debt: (unit.debt || 0) + amount, status: 'unpaid' });
      });
      await batch.commit();
      setLastAppliedDue(amount);
      alert('Aidatlar başarıyla yansıtıldı!');
    } catch (err) { console.error(err); }
  };

  const handleUndoLastBulkDue = async () => {
    if (!lastAppliedDue) return;
    if (!confirm(`Son yansıtılan ${lastAppliedDue} ₺ aidat geri alınsın mı?`)) return;

    try {
      const batch = writeBatch(db);
      units.forEach((unit) => {
        const newDebt = Math.max(0, (unit.debt || 0) - lastAppliedDue);
        batch.update(doc(db, 'units', unit.id), { debt: newDebt, status: newDebt === 0 ? 'paid' : 'unpaid' });
      });
      await batch.commit();
      setLastAppliedDue(null);
      alert('Geri alma işlemi başarılı!');
    } catch (err) { console.error(err); }
  };

  const handleDeleteBlock = async (blockName: string) => {
    if (!confirm(`Dikkat! ${blockName} bloğu ve bu bloğa ait tüm daireler kalıcı olarak silinecek. Emin misiniz?`)) return;
    try {
      const batch = writeBatch(db);
      units.filter(u => u.block === blockName).forEach(u => {
        batch.delete(doc(db, 'units', u.id));
      });
      await batch.commit();
      alert(`${blockName} bloğu başarıyla silindi!`);
      if (selectedBlock === blockName) {
        const remaining = availableBlocks.filter(b => b !== blockName);
        setSelectedBlock(remaining[0] || 'A');
      }
    } catch (err) {
      console.error(err);
      alert('Blok silinirken hata oluştu.');
    }
  };

  const handleGenerateCustomUnits = async (e: React.FormEvent) => {
    e.preventDefault();
    const blocksArray = configBlocks.split(',').map(b => b.trim()).filter(b => b.length > 0);
    const countPerBlock = Number(unitsPerBlockInput);
    const defaultDue = Number(configDefaultDue);

    if (blocksArray.length === 0) return alert('Lütfen en az bir blok giriniz.');
    if (!countPerBlock || countPerBlock <= 0) return alert('Lütfen geçerli bir daire sayısı giriniz.');

    if (!confirm(`Dikkat! Mevcut tüm eski bloklar ve daireler tamamen silinecek. Yalnızca (${blocksArray.join(', ')}) blokları ve her birinde ${countPerBlock} daire oluşturulacak. Emin misiniz?`)) return;

    try {
      const querySnapshot = await getDocs(collection(db, 'units'));
      const deleteBatch = writeBatch(db);
      querySnapshot.docs.forEach((document) => {
        deleteBatch.delete(document.ref);
      });
      await deleteBatch.commit();

      const createBatch = writeBatch(db);
      blocksArray.forEach(block => {
        for (let i = 1; i <= countPerBlock; i++) {
          const docId = `${block}_${i}`;
          createBatch.set(doc(db, 'units', docId), {
            block: block,
            unitNumber: i,
            residentName: `${block} Blok Sakini ${i}`,
            phone: '053200000' + (i < 10 ? '0' + i : i),
            isTenant: false,
            landlordName: '',
            debt: 0,
            status: 'paid'
          });
        }
      });
      await createBatch.commit();

      setDueAmount(configDefaultDue);
      setSelectedBlock(blocksArray[0]);

      alert('Eski bloklar temizlendi ve yeni site yapılandırması başarıyla oluşturuldu!');
      setActiveTab('units');
    } catch (err) {
      console.error(err);
      alert('Yapılandırma kaydedilirken hata oluştu.');
    }
  };

  const handleSaveUnitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;
    try {
      await updateDoc(doc(db, 'units', editingUnit.id), {
        residentName: editingUnit.residentName,
        phone: editingUnit.phone || '',
        isTenant: editingUnit.isTenant,
        landlordName: editingUnit.isTenant ? editingUnit.landlordName : ''
      });
      setEditingUnit(null);
      alert('Bilgiler güncellendi!');
    } catch (err) { console.error(err); }
  };

  const openWhatsApp = (phone: string, name: string, debt: number) => {
    if (!phone) return alert('Telefon numarası kayıtlı değil.');
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Sayın ${name}, ${currentSiteName} Yönetimi bilgilendirmesi: Güncel borç/aidat tutarınız ${debt.toLocaleString('tr-TR')} ₺'dir.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const getOfficialWarningText = (unit: Unit) => {
    const unitTitle = `${unit.block} Blok No: ${unit.unitNumber}`;
    return `Sayın ${unit.residentName || 'Sakin'}, (${unitTitle})
Bu ay itibariyle toplam ${unit.debt.toLocaleString('tr-TR')} ₺ aidat/borç bakiyeniz bulunmaktadır. 
Ödememeniz halinde yasal takibat başlatılacaktır.
${currentSiteName} Yönetimi`;
  };

  const printOfficialWarning = (unit: Unit) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>İhtar</title></head><body style="font-family:Arial;padding:40px;"><h2>${currentSiteName.toUpperCase()} YÖNETİMİ</h2><p>${getOfficialWarningText(unit)}</p><script>window.print();</script></body></html>`);
    w.document.close();
  };

  const exportUnitsToExcel = () => {
    let htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>table{border-collapse:collapse;width:100%;font-family:Arial;}th{background:#0b0f19;color:#fff;padding:12px;border:1px solid #000;}td{padding:8px;border:1px solid #ccc;}</style></head><body><table><thead><tr><th>Blok</th><th>No</th><th>Sakin</th><th>Telefon</th><th>Durum</th><th>Borç</th></tr></thead><tbody>`;
    sortedAllUnits.forEach(u => {
      htmlContent += `<tr><td>${u.block}</td><td>${u.unitNumber}</td><td>${u.residentName}</td><td>${u.phone}</td><td>${u.status}</td><td>${u.debt} ₺</td></tr>`;
    });
    htmlContent += `</tbody></table></body></html>`;
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${currentSiteName}_Sakinler.xls`;
    link.click();
  };

  const exportTransactionsToExcel = () => {
    let htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>table{border-collapse:collapse;width:100%;font-family:Arial;}th{background:#0b0f19;color:#fff;padding:12px;border:1px solid #000;}td{padding:8px;border:1px solid #ccc;}</style></head><body><table><thead><tr><th>Tarih</th><th>Tür</th><th>Kategori</th><th>Açıklama</th><th>Tutar</th></tr></thead><tbody>`;
    transactions.forEach(t => {
      htmlContent += `<tr><td>${t.date}</td><td>${t.type}</td><td>${t.category}</td><td>${t.title}</td><td>${t.amount} ₺</td></tr>`;
    });
    htmlContent += `</tbody></table></body></html>`;
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${currentSiteName}_Kasa.xls`;
    link.click();
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle || !txAmount) return alert('Açıklama ve tutar giriniz.');
    try {
      await addDoc(collection(db, 'transactions'), {
        type: txType, title: txTitle, amount: Number(txAmount), category: txCategory,
        date: new Date().toLocaleDateString('tr-TR'), createdAt: serverTimestamp()
      });
      setTxTitle(''); setTxAmount('');
    } catch (err) { console.error(err); }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    try { await deleteDoc(doc(db, 'transactions', id)); } catch (err) { console.error(err); }
  };

  const isFeatureRestricted = (tab: string) => {
    if (currentPackage === 'basic' && (tab === 'accounting' || tab === 'reports' || tab === 'complaints')) {
      return true;
    }
    return false;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', fontFamily: 'Inter, system-ui, sans-serif', color: '#ffffff' }}>
      
      <header style={{ backgroundColor: '#111827', borderBottom: '1px solid #1f2937', padding: '16px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentSiteName} Yönetim Ekranı
              <span style={{ fontSize: '10px', backgroundColor: currentPackage === 'pro' ? '#0369a1' : currentPackage === 'basic' ? '#b45309' : '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', fontWeight: '900' }}>
                {currentPackage === 'pro' ? 'Pro Paket' : currentPackage === 'basic' ? 'Basic Paket' : '14 Gün Trial (Demo)'}
              </span>
            </h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0', fontWeight: '500' }}>Yetkili Yönetici Oturumu</p>
          </div>

          <nav style={{ display: 'flex', gap: '6px', background: '#0b0f19', padding: '5px', borderRadius: '12px', border: '1px solid #374151', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => setActiveTab('units')} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: activeTab === 'units' ? '#f59e0b' : 'transparent', color: activeTab === 'units' ? '#111827' : '#94a3b8' }}>
              🏢 Bloklar
            </button>
            <button onClick={() => setActiveTab('directory')} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: activeTab === 'directory' ? '#f59e0b' : 'transparent', color: activeTab === 'directory' ? '#111827' : '#94a3b8' }}>
              📖 Rehber
            </button>
            <button onClick={() => setActiveTab('accounting')} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: activeTab === 'accounting' ? '#f59e0b' : 'transparent', color: activeTab === 'accounting' ? '#111827' : '#94a3b8' }}>
              💰 Kasa {currentPackage === 'basic' && '🔒'}
            </button>
            <button onClick={() => setActiveTab('reports')} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: activeTab === 'reports' ? '#f59e0b' : 'transparent', color: activeTab === 'reports' ? '#111827' : '#94a3b8' }}>
              📊 Raporlar {currentPackage === 'basic' && '🔒'}
            </button>
            <button onClick={() => setActiveTab('complaints')} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: activeTab === 'complaints' ? '#f59e0b' : 'transparent', color: activeTab === 'complaints' ? '#111827' : '#94a3b8', position: 'relative' }}>
              ✉️ Bildirimler {currentPackage === 'basic' && '🔒'}
              {pendingComplaintsCount > 0 && currentPackage !== 'basic' && (
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#dc2626', color: '#ffffff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {pendingComplaintsCount}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab('settings')} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: activeTab === 'settings' ? '#f59e0b' : 'transparent', color: activeTab === 'settings' ? '#111827' : '#94a3b8' }}>
              ⚙️ Site Ayarları
            </button>

            <button 
              onClick={() => {
                sessionStorage.removeItem('mcf_admin_logged');
                setIsAdminLoggedIn(false);
              }} 
              style={{ padding: '10px 14px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '13px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            >
              🚪 Çıkış
            </button>
          </nav>
        </div>
      </header>

      <main style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
        
        {isFeatureRestricted(activeTab) ? (
          <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', border: '2px dashed #f59e0b', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
            <h2 style={{ color: '#ffffff', fontSize: '22px', fontWeight: '800', margin: '0 0 10px 0' }}>Pro / Trial Paket Özelliği</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '500px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
              Şu anda Basic paketi kullanıyorsunuz. Kasa, Raporlar ve Bildirimler yalnızca Pro ve Trial (Demo) paketlere özeldir.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'units' && (
              <>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px', alignItems: 'center' }}>
                  {availableBlocks.map((blk) => (
                    <div key={blk} style={{ display: 'flex', alignItems: 'center', backgroundColor: currentActiveBlock === blk ? '#f59e0b' : '#111827', border: '1px solid', borderColor: currentActiveBlock === blk ? '#f59e0b' : '#374151', borderRadius: '12px', overflow: 'hidden' }}>
                      <button onClick={() => setSelectedBlock(blk)} style={{ padding: '14px 20px', border: 'none', backgroundColor: 'transparent', color: currentActiveBlock === blk ? '#111827' : '#ffffff', fontWeight: '700', cursor: 'pointer' }}>
                        {blk} Blok
                      </button>
                      <button onClick={() => handleDeleteBlock(blk)} title={`${blk} Bloğunu Sil`} style={{ padding: '14px 12px', border: 'none', backgroundColor: 'transparent', color: currentActiveBlock === blk ? '#111827' : '#ef4444', fontWeight: 'bold', cursor: 'pointer', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '24px', marginBottom: '28px', border: '1px solid #1f2937', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ background: '#dc2626', color: '#fff', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚠️</div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>Borçlu Birim</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>{totalDebtors} Adet</div>
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ background: '#f59e0b', color: '#111827', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>💳</div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>Toplam Alacak</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>{totalReceivables.toLocaleString('tr-TR')} ₺</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8' }}>Aidat:</span>
                    <input type="number" value={dueAmount} onChange={(e) => setDueAmount(e.target.value)} style={{ width: '100px', padding: '12px', borderRadius: '10px', border: '1px solid #374151', fontWeight: 'bold', background: '#0b0f19', color: '#fff' }} />
                    <button onClick={handleBulkApplyDue} style={{ backgroundColor: '#f59e0b', color: '#111827', padding: '12px 16px', borderRadius: '10px', border: 'none', fontWeight: '800', cursor: 'pointer' }}>⚡ Toplu Yansıt</button>
                    {lastAppliedDue && <button onClick={handleUndoLastBulkDue} style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '10px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>↩️ Geri Al</button>}
                  </div>
                </div>

                {loading ? <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Yükleniyor...</div> : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
                    {filteredUnits.map((unit) => {
                      const isDebtor = unit.status === 'unpaid';
                      return (
                        <div key={unit.id} style={{ backgroundColor: '#111827', border: '1px solid', borderColor: isDebtor ? '#ef4444' : '#10b981', borderRadius: '16px', padding: '18px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', backgroundColor: isDebtor ? '#dc2626' : '#10b981' }} />
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {unit.block} Blok - No: {unit.unitNumber}
                                {isDebtor && <button onClick={() => setWarningModalUnit(unit)} title="İhtar Görüntüle" style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px' }}>⚠️</button>}
                              </h3>
                              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: unit.isTenant ? '#374151' : '#065f46', color: '#fff', fontWeight: '700' }}>
                                {unit.isTenant ? 'Kiracı' : 'Mülk Sahibi'}
                              </span>
                            </div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#cbd5e1', fontWeight: '600' }}>👤 {unit.residentName || 'İsim Yok'}</p>
                            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#94a3b8' }}>📞 {unit.phone || 'Tel Yok'}</p>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1f2937', paddingTop: '10px' }}>
                            <div 
                              onClick={() => togglePaymentStatus(unit)} 
                              style={{ 
                                cursor: 'pointer', 
                                padding: '8px 12px', 
                                borderRadius: '10px', 
                                fontSize: '15px', 
                                fontWeight: '800', 
                                backgroundColor: isDebtor ? '#fee2e2' : '#d1fae5', 
                                color: isDebtor ? '#dc2626' : '#059669',
                                flex: 1,
                                textAlign: 'center'
                              }}
                            >
                              {isDebtor ? `⚠️ ${unit.debt.toLocaleString('tr-TR')} ₺` : '✅ Ödendi'}
                            </div>
                            <button onClick={() => setEditingUnit(unit)} style={{ backgroundColor: '#374151', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', marginLeft: '8px', fontWeight: 'bold' }}>✏️</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === 'directory' && (
              <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '24px', border: '1px solid #1f2937' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b', margin: '0 0 16px 0' }}>📖 Sakinler Rehberi</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #1f2937', color: '#94a3b8' }}>
                      <th style={{ padding: '12px' }}>Blok / No</th>
                      <th style={{ padding: '12px' }}>Sakin Adı</th>
                      <th style={{ padding: '12px' }}>Telefon</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>İletişim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAllUnits.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #1f2937' }}>
                        <td style={{ padding: '12px', fontWeight: '800', color: '#ffffff' }}>{u.block} Blok - No: {u.unitNumber}</td>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#cbd5e1' }}>{u.residentName}</td>
                        <td style={{ padding: '12px', color: '#94a3b8' }}>{u.phone || 'Yok'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {u.phone && <button onClick={() => openWhatsApp(u.phone, u.residentName, u.debt)} style={{ backgroundColor: '#22c55e', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>💬 WhatsApp Gönder</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'accounting' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                  <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '16px', borderLeft: '6px solid #10b981', border: '1px solid #1f2937' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '700' }}>Toplam Gelir</div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#10b981', marginTop: '8px' }}>{totalIncome.toLocaleString('tr-TR')} ₺</div>
                  </div>
                  <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '16px', borderLeft: '6px solid #dc2626', border: '1px solid #1f2937' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '700' }}>Toplam Gider</div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#dc2626', marginTop: '8px' }}>{totalExpense.toLocaleString('tr-TR')} ₺</div>
                  </div>
                  <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '16px', borderLeft: '6px solid #f59e0b', border: '1px solid #1f2937' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '700' }}>Net Bakiye</div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#f59e0b', marginTop: '8px' }}>{netBalance.toLocaleString('tr-TR')} ₺</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '16px', marginBottom: '28px', border: '1px solid #1f2937' }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#f59e0b' }}>➕ Yeni Kasa İşlemi Ekle</h3>
                  <form onSubmit={handleAddTransaction} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <select value={txType} onChange={(e) => setTxType(e.target.value as 'income' | 'expense')} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff' }}>
                      <option value="income">Gelir Ekle</option>
                      <option value="expense">Gider Ekle</option>
                    </select>
                    <input type="text" placeholder="Açıklama" value={txTitle} onChange={(e) => setTxTitle(e.target.value)} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff', flex: 2 }} />
                    <input type="number" placeholder="Tutar (₺)" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff', flex: 1 }} />
                    <button type="submit" style={{ backgroundColor: '#f59e0b', color: '#111827', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Kaydet</button>
                  </form>
                </div>

                <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '16px', border: '1px solid #1f2937' }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#f59e0b' }}>📋 Kasa Geçmişi</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #1f2937', color: '#94a3b8', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>Tarih</th>
                        <th style={{ padding: '10px' }}>Tür</th>
                        <th style={{ padding: '10px' }}>Açıklama</th>
                        <th style={{ padding: '10px' }}>Tutar</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #1f2937' }}>
                          <td style={{ padding: '10px', color: '#94a3b8' }}>{t.date}</td>
                          <td style={{ padding: '10px', color: t.type === 'income' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{t.type === 'income' ? 'Gelir' : 'Gider'}</td>
                          <td style={{ padding: '10px', color: '#fff' }}>{t.title}</td>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#fff' }}>{Number(t.amount).toLocaleString('tr-TR')} ₺</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <button onClick={() => handleDeleteTransaction(t.id)} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Sil</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div style={{ backgroundColor: '#111827', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '1px solid #1f2937' }}>
                <h2 style={{ color: '#f59e0b', marginBottom: '20px' }}>📊 Raporlar ve Excel Aktarım Merkezi</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <button onClick={exportUnitsToExcel} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '16px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>📥 Sakinler Durumunu Excel&apos;e Aktar</button>
                  <button onClick={exportTransactionsToExcel} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '16px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>📥 Kasa Raporunu Excel&apos;e Aktar</button>
                </div>
              </div>
            )}

            {activeTab === 'complaints' && (
              <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '24px', border: '1px solid #1f2937' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b', margin: '0 0 6px 0' }}>📬 Sakinlerden Gelen Ödeme Bildirimleri & Şikayetler</h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0' }}>Sakinlerin portal üzerinden gönderdiği aidat dekont bildirimleri burada listelenir.</p>

                {complaints.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Henüz gelen yeni bir bildirim yok.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {complaints.map((c) => (
                      <div key={c.id} style={{
                        backgroundColor: '#0b0f19',
                        border: '1px solid #374151',
                        borderRadius: '12px', padding: '18px', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap'
                      }}>
                        <div style={{ flex: 1, minWidth: '280px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', backgroundColor: '#374151', color: '#fff', padding: '2px 8px', borderRadius: '6px' }}>
                              {c.unitInfo}
                            </span>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{c.date}</span>
                            <span style={{
                              fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px',
                              backgroundColor: c.status === 'resolved' ? '#065f46' : '#991b1b',
                              color: '#fff'
                            }}>
                              {c.status === 'resolved' ? '✅ Çözüldü' : '🔔 Bekliyor'}
                            </span>
                          </div>
                          <h4 style={{ margin: '6px 0', fontSize: '16px', color: '#fff', fontWeight: '800' }}>{c.title}</h4>
                          <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{c.description}</p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {c.status !== 'resolved' && (
                            <button
                              onClick={async () => {
                                try { await updateDoc(doc(db, 'complaints', c.id), { status: 'resolved' }); } catch (err) { console.error(err); }
                              }}
                              style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                            >
                              ✅ Okundu İşaretle
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (!confirm('Silmek istediğinize emin misiniz?')) return;
                              try { await deleteDoc(doc(db, 'complaints', c.id)); } catch (err) { console.error(err); }
                            }}
                            style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                          >
                            🗑️ Sil
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '30px', border: '1px solid #1f2937', maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b', margin: '0 0 8px 0' }}>⚙️ Site Blok ve Daire Yapılandırması</h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 24px 0' }}>
                  Bu butona bastığınızda eski tüm bloklar tamamen temizlenir ve sadece buraya yazdığınız bloklar sıfırdan oluşturulur.
                </p>

                <form onSubmit={handleGenerateCustomUnits} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>
                      Blok İsimleri (Virgülle ayırarak yazınız, örn: A)
                    </label>
                    <input 
                      type="text" 
                      value={configBlocks} 
                      onChange={(e) => setConfigBlocks(e.target.value)} 
                      placeholder="Örn: A" 
                      style={{ width: '100%', padding: '14px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: 'bold' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>
                      Her Bloktaki Daire / Birim Sayısı
                    </label>
                    <input 
                      type="number" 
                      value={unitsPerBlockInput} 
                      onChange={(e) => setUnitsPerBlockInput(e.target.value)} 
                      placeholder="Örn: 20" 
                      style={{ width: '100%', padding: '14px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: 'bold' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>
                      Varsayılan Aylık Aidat Tutarı (₺)
                    </label>
                    <input 
                      type="number" 
                      value={configDefaultDue} 
                      onChange={(e) => setConfigDefaultDue(e.target.value)} 
                      placeholder="Örn: 2000" 
                      style={{ width: '100%', padding: '14px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: 'bold' }} 
                    />
                  </div>

                  <button type="submit" style={{ backgroundColor: '#f59e0b', color: '#111827', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', marginTop: '10px' }}>
                    🔄 Eski Blokları Sil ve Sıfırdan Oluştur
                  </button>
                </form>
              </div>
            )}
          </>
        )}

      </main>

      {editingUnit && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#f59e0b' }}>Daire Düzenle</h3>
            <form onSubmit={handleSaveUnitDetails} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" value={editingUnit.residentName} onChange={(e) => setEditingUnit({ ...editingUnit, residentName: e.target.value })} style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff' }} />
              <input type="text" placeholder="Telefon" value={editingUnit.phone || ''} onChange={(e) => setEditingUnit({ ...editingUnit, phone: e.target.value })} style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff' }} />
              <select value={editingUnit.isTenant ? 'tenant' : 'owner'} onChange={(e) => setEditingUnit({ ...editingUnit, isTenant: e.target.value === 'tenant' })} style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff' }}>
                <option value="owner">Mülk Sahibi</option>
                <option value="tenant">Kiracı</option>
              </select>
              {editingUnit.isTenant && <input type="text" placeholder="Ev Sahibi Adı" value={editingUnit.landlordName || ''} onChange={(e) => setEditingUnit({ ...editingUnit, landlordName: e.target.value })} style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff' }} />}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setEditingUnit(null)} style={{ flex: 1, padding: '10px', background: '#374151', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#f59e0b', color: '#111827', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {warningModalUnit && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#111827', border: '2px solid #dc2626', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ color: '#ef4444', margin: '0 0 10px 0' }}>📜 Resmi İhtar Metni</h3>
            <div style={{ background: '#0b0f19', border: '1px solid #374151', padding: '14px', borderRadius: '8px', color: '#f87171', whiteSpace: 'pre-wrap', fontSize: '14px', marginBottom: '16px' }}>{getOfficialWarningText(warningModalUnit)}</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setWarningModalUnit(null)} style={{ flex: 1, padding: '10px', background: '#374151', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Kapat</button>
              <button onClick={() => { printOfficialWarning(warningModalUnit); setWarningModalUnit(null); }} style={{ flex: 1, padding: '10px', background: '#4b5563', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🖨️ Yazdır</button>
              <button onClick={() => { openWhatsApp(warningModalUnit.phone, warningModalUnit.residentName, warningModalUnit.debt); setWarningModalUnit(null); }} style={{ flex: 2, padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>💬 WhatsApp ile Gönder</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}