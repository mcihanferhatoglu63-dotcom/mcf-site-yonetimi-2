'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, writeBatch, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

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

  const [activeTab, setActiveTab] = useState<'units' | 'directory' | 'accounting' | 'reports' | 'complaints'>('units');
  const [selectedBlock, setSelectedBlock] = useState('A');
  const [dueAmount, setDueAmount] = useState('2000');
  
  const [units, setUnits] = useState<Unit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const [lastAppliedDue, setLastAppliedDue] = useState<number | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [warningModalUnit, setWarningModalUnit] = useState<Unit | null>(null);

  // SAAS & SÜPERADMIN MODAL STATE'LERİ
  const [showSuperModal, setShowSuperModal] = useState(false);
  const [superPassword, setSuperPassword] = useState('');
  const [isSuperAuthorized, setIsSuperAuthorized] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<'trial' | 'basic' | 'pro'>('pro');

  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Aidat Tahsilatı');

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('mcf_admin_logged');
    if (sessionAuth === 'true') {
      setIsAdminLoggedIn(true);
    }
    const savedPkg = sessionStorage.getItem('mcf_site_package') as 'trial' | 'basic' | 'pro';
    if (savedPkg) setCurrentPackage(savedPkg);

    setIsAuthChecked(true);
  }, []);

  useEffect(() => {
    const unsubscribeUnits = onSnapshot(collection(db, 'units'), async (snapshot) => {
      let fetchedUnits: Unit[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Unit[];

      if (fetchedUnits.length === 0) {
        const batch = writeBatch(db);
        for (let i = 1; i <= 8; i++) {
          batch.set(doc(db, 'units', `A_${i}`), { block: 'A', unitNumber: i, residentName: `Dükkan İşletmecisi ${i}`, phone: '0532000000' + (i < 10 ? '0' + i : i), isTenant: false, landlordName: '', debt: 0, status: 'paid' });
        }
        for (let i = 1; i <= 28; i++) {
          batch.set(doc(db, 'units', `B_${i}`), { block: 'B', unitNumber: i, residentName: `B Blok Sakin ${i}`, phone: '053311100' + (i < 10 ? '0' + i : i), isTenant: false, landlordName: '', debt: 0, status: 'paid' });
        }
        for (let i = 1; i <= 28; i++) {
          batch.set(doc(db, 'units', `C_${i}`), { block: 'C', unitNumber: i, residentName: `C Blok Sakin ${i}`, phone: '053522200' + (i < 10 ? '0' + i : i), isTenant: false, landlordName: '', debt: 0, status: 'paid' });
        }
        await batch.commit();
      } else {
        setUnits(fetchedUnits);
        setLoading(false);
      }
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
    return <div style={{ minHeight: '100vh', backgroundColor: '#fcf8fa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b2d5c', fontWeight: 'bold' }}>Yükleniyor...</div>;
  }

  if (!isAdminLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #4a1535 0%, #6b2d5c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '20px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 15px 30px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
            <img 
              src="/mcf-logo.png" 
              alt="MCF Logo" 
              style={{ height: '54px', width: 'auto', objectFit: 'contain', background: '#fcf8fa', padding: '6px', borderRadius: '10px', border: '1px solid #d8b8c5' }} 
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>

          <h2 style={{ color: '#4a1535', fontSize: '20px', fontWeight: '800', margin: '0 0 10px 0' }}>Yönetici Paneli Girişi</h2>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 20px 0' }}>Devam etmek için yönetici şifrenizi giriniz.</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (adminPassword === '1453') {
              setIsAdminLoggedIn(true);
              sessionStorage.setItem('mcf_admin_logged', 'true');
            } else {
              alert('Hatalı şifre! (Varsayılan: 1453)');
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="password"
              placeholder="Yönetici Şifresi"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #d8b8c5', fontSize: '16px', outline: 'none', textAlign: 'center' }}
            />
            <button type="submit" style={{ backgroundColor: '#6b2d5c', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>
              Giriş Yap
            </button>
            <a href="/" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', marginTop: '5px' }}>← Ana Sayfaya Dön</a>
          </form>
        </div>
      </div>
    );
  }

  const filteredUnits = units.filter(u => u.block === selectedBlock).sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber));
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
    const message = encodeURIComponent(`Sayın ${name}, MCF Site Yönetimi bilgilendirmesi: Güncel borç/aidat tutarınız ${debt.toLocaleString('tr-TR')} ₺'dir.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const getOfficialWarningText = (unit: Unit) => {
    const unitTitle = unit.block === 'A' ? `A Blok Dükkan ${unit.unitNumber}` : `${unit.block} Blok No: ${unit.unitNumber}`;
    return `Sayın ${unit.residentName || 'Sakin'}, (${unitTitle})
Bu ay itibariyle toplam ${unit.debt.toLocaleString('tr-TR')} ₺ aidat/borç bakiyeniz bulunmaktadır. 
Ödememeniz halinde yasal takibat başlatılacaktır.
Site Yönetimi`;
  };

  const printOfficialWarning = (unit: Unit) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>İhtar</title></head><body style="font-family:Arial;padding:40px;"><h2>MCF SİTE YÖNETİMİ</h2><p>${getOfficialWarningText(unit)}</p><script>window.print();</script></body></html>`);
    w.document.close();
  };

  const exportUnitsToExcel = () => {
    let htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>table{border-collapse:collapse;width:100%;font-family:Arial;}th{background:#6b2d5c;color:#fff;padding:12px;border:1px solid #000;}td{padding:8px;border:1px solid #ccc;}</style></head><body><table><thead><tr><th>Blok</th><th>No</th><th>Sakin</th><th>Telefon</th><th>Durum</th><th>Borç</th></tr></thead><tbody>`;
    sortedAllUnits.forEach(u => {
      htmlContent += `<tr><td>${u.block}</td><td>${u.unitNumber}</td><td>${u.residentName}</td><td>${u.phone}</td><td>${u.status}</td><td>${u.debt} ₺</td></tr>`;
    });
    htmlContent += `</tbody></table></body></html>`;
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Sakinler_Raporu.xls`;
    link.click();
  };

  const exportTransactionsToExcel = () => {
    let htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>table{border-collapse:collapse;width:100%;font-family:Arial;}th{background:#6b2d5c;color:#fff;padding:12px;border:1px solid #000;}td{padding:8px;border:1px solid #ccc;}</style></head><body><table><thead><tr><th>Tarih</th><th>Tür</th><th>Kategori</th><th>Açıklama</th><th>Tutar</th></tr></thead><tbody>`;
    transactions.forEach(t => {
      htmlContent += `<tr><td>${t.date}</td><td>${t.type}</td><td>${t.category}</td><td>${t.title}</td><td>${t.amount} ₺</td></tr>`;
    });
    htmlContent += `</tbody></table></body></html>`;
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Kasa_Raporu.xls`;
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

  const getOwnerLabel = (block: string) => block === 'A' ? 'Mülk Sahibi' : 'Ev Sahibi';

  // SÜPERADMIN ŞİFRE ONAYLAMA
  const handleSuperAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (superPassword === '1923') {
      setIsSuperAuthorized(true);
      setSuperPassword('');
    } else {
      alert('Hatalı Süperadmin Şifresi!');
    }
  };

  const handleSelectPackage = (pkg: 'trial' | 'basic' | 'pro') => {
    setCurrentPackage(pkg);
    sessionStorage.setItem('mcf_site_package', pkg);
    alert(`Abonelik paketiniz "${pkg.toUpperCase()}" olarak güncellendi!`);
    setShowSuperModal(false);
    setIsSuperAuthorized(false);
  };

  // KISITLAMA KONTROLÜ (Basic pakette Kasa, Raporlar ve Bildirimler kapalı)
  const isFeatureRestricted = (tab: string) => {
    if (currentPackage === 'basic' && (tab === 'accounting' || tab === 'reports' || tab === 'complaints')) {
      return true;
    }
    return false;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fcf8fa', fontFamily: 'Inter, system-ui, sans-serif', color: '#4a2833' }}>
      
      {/* HEADER NAVBAR */}
      <header style={{ background: 'linear-gradient(135deg, #6b2d5c 0%, #4a1535 100%)', color: '#ffffff', padding: '16px 24px', boxShadow: '0 4px 20px rgba(74, 21, 53, 0.25)', borderBottom: '3px solid #d4a5b8' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img 
              src="/mcf-logo.png" 
              alt="MCF Logo" 
              style={{ height: '46px', width: 'auto', objectFit: 'contain', background: 'rgba(255, 255, 255, 0.15)', padding: '6px', borderRadius: '8px', border: '1px solid #d4a5b8' }} 
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                MCF Tesis Yönetimi 
                <span style={{ fontSize: '10px', backgroundColor: currentPackage === 'pro' ? '#22c55e' : currentPackage === 'basic' ? '#eab308' : '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', fontWeight: '900' }}>
                  {currentPackage === 'pro' ? 'Pro (2000₺/Ay)' : currentPackage === 'basic' ? 'Basic (1000₺/Ay)' : 'Trial (14 Gün)'}
                </span>
              </h1>
              <p style={{ fontSize: '12px', color: '#e8c5d3', margin: '2px 0 0 0', fontWeight: '500' }}>Yetkili Yönetici Oturumu</p>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: '6px', background: '#381028', padding: '5px', borderRadius: '12px', border: '1px solid #5c2345', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => setActiveTab('units')} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: activeTab === 'units' ? '#d4a5b8' : 'transparent', color: activeTab === 'units' ? '#381028' : '#f3d1df' }}>
              🏢 Bloklar
            </button>
            <button onClick={() => setActiveTab('directory')} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: activeTab === 'directory' ? '#d4a5b8' : 'transparent', color: activeTab === 'directory' ? '#381028' : '#f3d1df' }}>
              📖 Rehber
            </button>
            
            {/* KASA (PRO / TRIAL AÇIK, BASIC KİLİTLİ) */}
            <button onClick={() => setActiveTab('accounting')} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: activeTab === 'accounting' ? '#d4a5b8' : 'transparent', color: activeTab === 'accounting' ? '#381028' : '#f3d1df' }}>
              💰 Kasa {currentPackage === 'basic' && '🔒'}
            </button>

            {/* RAPORLAR (PRO / TRIAL AÇIK, BASIC KİLİTLİ) */}
            <button onClick={() => setActiveTab('reports')} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: activeTab === 'reports' ? '#d4a5b8' : 'transparent', color: activeTab === 'reports' ? '#381028' : '#f3d1df' }}>
              📊 Raporlar {currentPackage === 'basic' && '🔒'}
            </button>
            
            {/* BİLDİRİMLER (PRO / TRIAL AÇIK, BASIC KİLİTLİ) */}
            <button onClick={() => setActiveTab('complaints')} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: activeTab === 'complaints' ? '#d4a5b8' : 'transparent', color: activeTab === 'complaints' ? '#381028' : '#f3d1df', position: 'relative' }}>
              ✉️ Bildirimler {currentPackage === 'basic' && '🔒'}
              {pendingComplaintsCount > 0 && currentPackage !== 'basic' && (
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#dc2626', color: '#ffffff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {pendingComplaintsCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => setShowSuperModal(true)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '800', fontSize: '13px', cursor: 'pointer', backgroundColor: '#eab308', color: '#422006' }}
            >
              👑 Süperadmin
            </button>

            <button 
              onClick={() => {
                sessionStorage.removeItem('mcf_admin_logged');
                setIsAdminLoggedIn(false);
              }} 
              style={{ padding: '10px 14px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '13px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            >
              🚪 Çıkış
            </button>
          </nav>
        </div>
      </header>

      {/* İÇERİK ALANI */}
      <main style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* BASIC PAKET KISITLAMA UYARISI */}
        {isFeatureRestricted(activeTab) ? (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', border: '2px dashed #eab308', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
            <h2 style={{ color: '#4a1535', fontSize: '22px', fontWeight: '800', margin: '0 0 10px 0' }}>Pro Paket Özelliği</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', maxWidth: '500px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
              Şu anda <strong>Basic (1.000 ₺/Ay)</strong> paketini kullanıyorsunuz. Kasa yönetimi, Excel raporları ve sakin bildirimleri ekranları yalnızca <strong>Pro (2.000 ₺/Ay)</strong> paketine özeldir.
            </p>
            <button 
              onClick={() => setShowSuperModal(true)}
              style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}
            >
              💎 Pro Pakete Yükselt (2.000 ₺/Ay)
            </button>
          </div>
        ) : (
          <>
            {/* 1. BLOK VE DAİRELER */}
            {activeTab === 'units' && (
              <>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {[
                    { key: 'A', name: 'A Blok (8 Dükkan)' },
                    { key: 'B', name: 'B Blok (28 Daire)' },
                    { key: 'C', name: 'C Blok (28 Daire)' }
                  ].map((b) => (
                    <button key={b.key} onClick={() => setSelectedBlock(b.key)} style={{ padding: '14px 24px', borderRadius: '12px', border: '1px solid', borderColor: selectedBlock === b.key ? '#6b2d5c' : '#d8b8c5', backgroundColor: selectedBlock === b.key ? '#6b2d5c' : '#ffffff', color: selectedBlock === b.key ? '#ffffff' : '#6b2d5c', fontWeight: '700', cursor: 'pointer', flex: 1 }}>
                      {b.name}
                    </button>
                  ))}
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '28px', border: '1px solid #ebd2dc', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ background: '#dc2626', color: '#fff', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚠️</div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: '700' }}>Borçlu Birim</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#7f1d1d' }}>{totalDebtors} Adet</div>
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ background: '#ca8a04', color: '#fff', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>💳</div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#854d0e', fontWeight: '700' }}>Toplam Alacak</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#713f12' }}>{totalReceivables.toLocaleString('tr-TR')} ₺</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#6b2d5c' }}>Aidat:</span>
                    <input type="number" value={dueAmount} onChange={(e) => setDueAmount(e.target.value)} style={{ width: '100px', padding: '12px', borderRadius: '10px', border: '1px solid #fde047', fontWeight: 'bold', background: '#fefce8', color: '#713f12' }} />
                    <button onClick={handleBulkApplyDue} style={{ backgroundColor: '#ca8a04', color: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: 'none', fontWeight: '800', cursor: 'pointer' }}>⚡ Toplu Yansıt</button>
                    {lastAppliedDue && <button onClick={handleUndoLastBulkDue} style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '10px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>↩️ Geri Al</button>}
                  </div>
                </div>

                {loading ? <div style={{ textAlign: 'center', padding: '60px' }}>Yükleniyor...</div> : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
                    {filteredUnits.map((unit) => {
                      const isDebtor = unit.status === 'unpaid';
                      return (
                        <div key={unit.id} style={{ backgroundColor: '#fef9c3', border: '1px solid', borderColor: isDebtor ? '#ef4444' : '#10b981', borderRadius: '16px', padding: '18px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', backgroundColor: isDebtor ? '#dc2626' : '#10b981' }} />
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <h3 style={{ margin: 0, fontSize: '16px', color: '#713f12', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {selectedBlock === 'A' ? `Dükkan ${unit.unitNumber}` : `${selectedBlock} Blok - No: ${unit.unitNumber}`}
                                {isDebtor && <button onClick={() => setWarningModalUnit(unit)} title="İhtar Görüntüle" style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px' }}>⚠️</button>}
                              </h3>
                              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: unit.isTenant ? '#fef08a' : '#d1fae5', color: unit.isTenant ? '#854d0e' : '#065f46', fontWeight: '700' }}>
                                {unit.isTenant ? 'Kiracı' : getOwnerLabel(unit.block)}
                              </span>
                            </div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#451a03', fontWeight: '600' }}>👤 {unit.residentName || 'İsim Yok'}</p>
                            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#78350f' }}>📞 {unit.phone || 'Tel Yok'}</p>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #fef08a', paddingTop: '10px' }}>
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
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                flex: 1,
                                textAlign: 'center'
                              }}
                            >
                              {isDebtor ? `⚠️ ${unit.debt.toLocaleString('tr-TR')} ₺` : '✅ Ödendi'}
                            </div>
                            <button onClick={() => setEditingUnit(unit)} style={{ backgroundColor: '#4a1535', color: '#f3d1df', border: 'none', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', marginLeft: '8px', fontWeight: 'bold' }}>✏️</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* 2. REHBER */}
            {activeTab === 'directory' && (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #ebd2dc' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#4a1535', margin: '0 0 16px 0' }}>📖 Sakinler Rehberi</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ebd2dc', color: '#6b2d5c' }}>
                      <th style={{ padding: '12px' }}>Blok / No</th>
                      <th style={{ padding: '12px' }}>Sakin Adı</th>
                      <th style={{ padding: '12px' }}>Telefon</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>İletişim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAllUnits.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f9f0f4' }}>
                        <td style={{ padding: '12px', fontWeight: '800', color: '#8c3b71' }}>{u.block} Blok - No: {u.unitNumber}</td>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{u.residentName}</td>
                        <td style={{ padding: '12px' }}>{u.phone || 'Yok'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {u.phone && <button onClick={() => openWhatsApp(u.phone, u.residentName, u.debt)} style={{ backgroundColor: '#22c55e', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer' }}>💬 WhatsApp Gönder</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. KASA (SADECE PRO / TRIAL) */}
            {activeTab === 'accounting' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                  <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', borderLeft: '6px solid #10b981' }}>
                    <div style={{ fontSize: '13px', color: '#6b2d5c', fontWeight: '700' }}>Toplam Gelir</div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#059669', marginTop: '8px' }}>{totalIncome.toLocaleString('tr-TR')} ₺</div>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', borderLeft: '6px solid #dc2626' }}>
                    <div style={{ fontSize: '13px', color: '#6b2d5c', fontWeight: '700' }}>Toplam Gider</div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#dc2626', marginTop: '8px' }}>{totalExpense.toLocaleString('tr-TR')} ₺</div>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', borderLeft: '6px solid #6b2d5c' }}>
                    <div style={{ fontSize: '13px', color: '#6b2d5c', fontWeight: '700' }}>Net Bakiye</div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#4a1535', marginTop: '8px' }}>{netBalance.toLocaleString('tr-TR')} ₺</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', marginBottom: '28px', border: '1px solid #ebd2dc' }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#4a1535' }}>➕ Yeni Kasa İşlemi Ekle</h3>
                  <form onSubmit={handleAddTransaction} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <select value={txType} onChange={(e) => setTxType(e.target.value as 'income' | 'expense')} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #d8b8c5' }}>
                      <option value="income">Gelir Ekle</option>
                      <option value="expense">Gider Ekle</option>
                    </select>
                    <input type="text" placeholder="Açıklama" value={txTitle} onChange={(e) => setTxTitle(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #d8b8c5', flex: 2 }} />
                    <input type="number" placeholder="Tutar (₺)" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #d8b8c5', flex: 1 }} />
                    <button type="submit" style={{ backgroundColor: '#6b2d5c', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Kaydet</button>
                  </form>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #ebd2dc' }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#4a1535' }}>📋 Kasa Geçmişi</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #ebd2dc', color: '#6b2d5c', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>Tarih</th>
                        <th style={{ padding: '10px' }}>Tür</th>
                        <th style={{ padding: '10px' }}>Açıklama</th>
                        <th style={{ padding: '10px' }}>Tutar</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #f9f0f4' }}>
                          <td style={{ padding: '10px' }}>{t.date}</td>
                          <td style={{ padding: '10px', color: t.type === 'income' ? '#059669' : '#dc2626', fontWeight: 'bold' }}>{t.type === 'income' ? 'Gelir' : 'Gider'}</td>
                          <td style={{ padding: '10px' }}>{t.title}</td>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{Number(t.amount).toLocaleString('tr-TR')} ₺</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <button onClick={() => handleDeleteTransaction(t.id)} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Sil</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. RAPORLAR (SADECE PRO / TRIAL) */}
            {activeTab === 'reports' && (
              <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '1px solid #ebd2dc' }}>
                <h2 style={{ color: '#4a1535', marginBottom: '20px' }}>📊 Raporlar ve Excel Aktarım Merkezi</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <button onClick={exportUnitsToExcel} style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '16px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>📥 Sakinler Durumunu Excel&apos;e Aktar</button>
                  <button onClick={exportTransactionsToExcel} style={{ backgroundColor: '#6b2d5c', color: '#fff', border: 'none', padding: '16px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>📥 Kasa Raporunu Excel&apos;e Aktar</button>
                </div>
              </div>
            )}

            {/* 5. BİLDİRİMLER (SADECE PRO / TRIAL) */}
            {activeTab === 'complaints' && (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #ebd2dc' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#4a1535', margin: '0 0 6px 0' }}>📬 Sakinlerden Gelen Ödeme Bildirimleri & Şikayetler</h2>
                <p style={{ fontSize: '13px', color: '#6b2d5c', margin: '0 0 20px 0' }}>Sakinlerin portal üzerinden gönderdiği aidat dekont bildirimleri ve talepler burada listelenir.</p>

                {complaints.length === 0 ? (
                  <p style={{ color: '#6b2d5c', textAlign: 'center', padding: '40px' }}>Henüz gelen yeni bir bildirim yok.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {complaints.map((c) => (
                      <div key={c.id} style={{
                        backgroundColor: c.status === 'pending' ? '#fef2f2' : '#fcf8fa',
                        border: '1px solid', borderColor: c.status === 'pending' ? '#fecaca' : '#ebd2dc',
                        borderRadius: '12px', padding: '18px', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap'
                      }}>
                        <div style={{ flex: 1, minWidth: '280px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', backgroundColor: '#6b2d5c', color: '#f3d1df', padding: '2px 8px', borderRadius: '6px' }}>
                              {c.unitInfo}
                            </span>
                            <span style={{ fontSize: '12px', color: '#78350f' }}>{c.date}</span>
                            <span style={{
                              fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px',
                              backgroundColor: c.status === 'resolved' ? '#d1fae5' : '#fee2e2',
                              color: c.status === 'resolved' ? '#065f46' : '#991b1b'
                            }}>
                              {c.status === 'resolved' ? '✅ Okundu / Çözüldü' : '🔔 Yeni / Bekliyor'}
                            </span>
                          </div>
                          <h4 style={{ margin: '6px 0', fontSize: '16px', color: '#4a1535', fontWeight: '800' }}>{c.title}</h4>
                          <p style={{ margin: 0, fontSize: '14px', color: '#4a2833', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{c.description}</p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {c.status !== 'resolved' && (
                            <button
                              onClick={async () => {
                                try {
                                  await updateDoc(doc(db, 'complaints', c.id), { status: 'resolved' });
                                } catch (err) { console.error(err); }
                              }}
                              style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                            >
                              ✅ Okundu İşaretle
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (!confirm('Silmek istediğinize emin misiniz?')) return;
                              try {
                                await deleteDoc(doc(db, 'complaints', c.id));
                              } catch (err) { console.error(err); }
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
          </>
        )}

      </main>

      {/* SÜPERADMIN SAAS MODALI */}
      {showSuperModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '30px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', border: '2px solid #eab308' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#422006', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                👑 Süperadmin Paket Yönetimi
              </h3>
              <button onClick={() => { setShowSuperModal(false); setIsSuperAuthorized(false); }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>❌</button>
            </div>

            {!isSuperAuthorized ? (
              <form onSubmit={handleSuperAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Paket değiştirmek için Süperadmin şifrenizi (1923) giriniz:</p>
                <input
                  type="password"
                  placeholder="Şifre (1923)"
                  value={superPassword}
                  onChange={(e) => setSuperPassword(e.target.value)}
                  style={{ padding: '12px', borderRadius: '10px', border: '1px solid #d8b8c5', fontSize: '16px', textAlign: 'center', fontWeight: 'bold' }}
                />
                <button type="submit" style={{ backgroundColor: '#eab308', color: '#422006', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>
                  Yetkiyi Doğrula
                </button>
              </form>
            ) : (
              <div>
                <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px', fontWeight: '600' }}>
                  Bu site için aktif abonelik paketini seçiniz:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { id: 'trial', title: '🚀 Trial (14 Günlük Ücretsiz)', desc: 'Tüm özellikler açık (Deneme Sürümü).' },
                    { id: 'basic', title: '📦 Basic (1.000 ₺ / Ay)', desc: 'Sadece Daireler ve Rehber. Kasa ve Raporlar Kilitli.' },
                    { id: 'pro', title: '💎 Pro (2.000 ₺ / Ay)', desc: 'Tam Sürüm! Kasa, Raporlar, Bildirimler ve Tüm Özellikler.' }
                  ].map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => handleSelectPackage(p.id as any)}
                      style={{
                        padding: '14px', borderRadius: '12px', border: '2px solid',
                        borderColor: currentPackage === p.id ? '#eab308' : '#e5e7eb',
                        backgroundColor: currentPackage === p.id ? '#fefce8' : '#f9fafb',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px'
                      }}
                    >
                      <div style={{ fontWeight: '800', color: '#1f2937', fontSize: '15px' }}>{p.title}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{p.desc}</div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => { setShowSuperModal(false); setIsSuperAuthorized(false); }}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Kapat
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* DÜZENLEME MODALI */}
      {editingUnit && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#4a1535' }}>Daire Düzenle</h3>
            <form onSubmit={handleSaveUnitDetails} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" value={editingUnit.residentName} onChange={(e) => setEditingUnit({ ...editingUnit, residentName: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d8b8c5' }} />
              <input type="text" placeholder="Telefon" value={editingUnit.phone || ''} onChange={(e) => setEditingUnit({ ...editingUnit, phone: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d8b8c5' }} />
              <select value={editingUnit.isTenant ? 'tenant' : 'owner'} onChange={(e) => setEditingUnit({ ...editingUnit, isTenant: e.target.value === 'tenant' })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d8b8c5' }}>
                <option value="owner">Mülk Sahibi</option>
                <option value="tenant">Kiracı</option>
              </select>
              {editingUnit.isTenant && <input type="text" placeholder="Ev Sahibi Adı" value={editingUnit.landlordName || ''} onChange={(e) => setEditingUnit({ ...editingUnit, landlordName: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d8b8c5' }} />}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setEditingUnit(null)} style={{ flex: 1, padding: '10px', background: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#6b2d5c', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* İHTAR MODALI */}
      {warningModalUnit && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', border: '2px solid #dc2626', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ color: '#991b1b', margin: '0 0 10px 0' }}>📜 Resmi İhtar Metni</h3>
            <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '8px', color: '#7f1d1d', whiteSpace: 'pre-wrap', fontSize: '14px', marginBottom: '16px' }}>{getOfficialWarningText(warningModalUnit)}</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setWarningModalUnit(null)} style={{ flex: 1, padding: '10px', background: '#ddd', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Kapat</button>
              <button onClick={() => { printOfficialWarning(warningModalUnit); setWarningModalUnit(null); }} style={{ flex: 1, padding: '10px', background: '#4b5563', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🖨️ Yazdır</button>
              <button onClick={() => { openWhatsApp(warningModalUnit.phone, warningModalUnit.residentName, warningModalUnit.debt); setWarningModalUnit(null); }} style={{ flex: 2, padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>💬 WhatsApp ile Gönder</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}