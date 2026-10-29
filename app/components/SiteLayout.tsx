'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, writeBatch, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

interface Unit {
  id: string; // Örn: B_12
  block: string;
  unitNumber: number;
  residentName: string;
  phone: string;
  isTenant: boolean; // true: Kiracı, false: Mülk Sahibi / Ev Sahibi
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

export default function SiteLayout() {
  const [activeTab, setActiveTab] = useState<'units' | 'directory' | 'accounting' | 'reports'>('units');
  const [selectedBlock, setSelectedBlock] = useState('A');
  const [dueAmount, setDueAmount] = useState('1500');
  const [units, setUnits] = useState<Unit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Düzenleme Modalı
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Kasa Formu
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Aidat Tahsilatı');

  // Firestore Verilerini Çekme
  useEffect(() => {
    const unsubscribeUnits = onSnapshot(collection(db, 'units'), async (snapshot) => {
      let fetchedUnits: Unit[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Unit[];

      if (fetchedUnits.length === 0) {
        const batch = writeBatch(db);
        
        // A Blok (8 Dükkan)
        for (let i = 1; i <= 8; i++) {
          const docRef = doc(db, 'units', `A_${i}`);
          batch.set(docRef, {
            block: 'A',
            unitNumber: i,
            residentName: `Dükkan İşletmecisi ${i}`,
            phone: '0532000000' + (i < 10 ? '0' + i : i),
            isTenant: false,
            landlordName: '',
            debt: 0,
            status: 'paid'
          });
        }

        // B Blok (28 Daire)
        for (let i = 1; i <= 28; i++) {
          const docRef = doc(db, 'units', `B_${i}`);
          batch.set(docRef, {
            block: 'B',
            unitNumber: i,
            residentName: `B Blok Sakin ${i}`,
            phone: '053311100' + (i < 10 ? '0' + i : i),
            isTenant: false,
            landlordName: '',
            debt: 0,
            status: 'paid'
          });
        }

        // C Blok (28 Daire)
        for (let i = 1; i <= 28; i++) {
          const docRef = doc(db, 'units', `C_${i}`);
          batch.set(docRef, {
            block: 'C',
            unitNumber: i,
            residentName: `C Blok Sakin ${i}`,
            phone: '053522200' + (i < 10 ? '0' + i : i),
            isTenant: false,
            landlordName: '',
            debt: 0,
            status: 'paid'
          });
        }

        await batch.commit();
      } else {
        setUnits(fetchedUnits);
        setLoading(false);
      }
    });

    const unsubscribeTx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const fetchedTx: Transaction[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(fetchedTx);
    });

    return () => {
      unsubscribeUnits();
      unsubscribeTx();
    };
  }, []);

  // RAKAMSAL SIRALAMA (1, 2, 3 ... 28 şeklinde küçükten büyüğe)
  const filteredUnits = units
    .filter(u => u.block === selectedBlock)
    .sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber));

  // Rehber İçin Tüm Birimleri Rakamsal Sıralama (Blok ve Daire No'ya Göre)
  const sortedAllUnits = [...units].sort((a, b) => {
    if (a.block === b.block) {
      return Number(a.unitNumber) - Number(b.unitNumber);
    }
    return a.block.localeCompare(b.block);
  });

  const totalDebtors = units.filter(u => u.status === 'unpaid').length;
  const totalReceivables = units.reduce((sum, u) => sum + (u.debt || 0), 0);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;

  // Ödeme Durumu Değiştir
  const togglePaymentStatus = async (unit: Unit) => {
    try {
      const unitRef = doc(db, 'units', unit.id);
      if (unit.status === 'paid') {
        await updateDoc(unitRef, { status: 'unpaid', debt: Number(dueAmount) || 1500 });
      } else {
        await updateDoc(unitRef, { status: 'paid', debt: 0 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toplu Aidat Yansıt
  const handleBulkApplyDue = async () => {
    if (!confirm(`${dueAmount} ₺ aidat tüm bloklardaki birimlere yansıtılsın mı?`)) return;
    try {
      const batch = writeBatch(db);
      units.forEach((unit) => {
        const unitRef = doc(db, 'units', unit.id);
        batch.update(unitRef, { debt: (unit.debt || 0) + Number(dueAmount), status: 'unpaid' });
      });
      await batch.commit();
      alert('Aidatlar başarıyla yansıtıldı!');
    } catch (err) {
      console.error(err);
    }
  };

  // Sakin Bilgilerini Kaydet
  const handleSaveUnitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;

    try {
      const unitRef = doc(db, 'units', editingUnit.id);
      await updateDoc(unitRef, {
        residentName: editingUnit.residentName,
        phone: editingUnit.phone || '',
        isTenant: editingUnit.isTenant,
        landlordName: editingUnit.isTenant ? editingUnit.landlordName : ''
      });
      setEditingUnit(null);
      alert('Sakin bilgileri güncellendi!');
    } catch (err) {
      console.error(err);
      alert('Hata oluştu.');
    }
  };

  // WhatsApp Mesajı Gönderme
  const openWhatsApp = (phone: string, name: string, debt: number) => {
    if (!phone) {
      alert('Bu sakine ait telefon numarası kayıtlı değil.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Sayın ${name}, MCF Site Yönetim Sistemi'nden bilgilendirme: Güncel borç/aidat tutarınız ${debt.toLocaleString('tr-TR')} ₺'dir. Bilgilerinize sunarız.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  // Kasa İşlemi Ekle
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle || !txAmount) return alert('Lütfen açıklama ve tutar giriniz.');
    try {
      await addDoc(collection(db, 'transactions'), {
        type: txType,
        title: txTitle,
        amount: Number(txAmount),
        category: txCategory,
        date: new Date().toLocaleDateString('tr-TR'),
        createdAt: serverTimestamp()
      });
      setTxTitle('');
      setTxAmount('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (err) {
      console.error(err);
    }
  };

  // Etiket Yardımcısı (A Blok için Mülk Sahibi, Diğerleri için Ev Sahibi)
  const getOwnerLabel = (block: string) => {
    return block === 'A' ? 'Mülk Sahibi' : 'Ev Sahibi';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', fontFamily: 'Inter, system-ui, sans-serif', color: '#e2e8f0' }}>
      
      {/* HEADER */}
      <header style={{
        background: 'linear-gradient(135deg, #0b132b 0%, #1c2541 100%)',
        color: '#ffffff',
        padding: '18px 24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        borderBottom: '3px solid #eab308'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img 
              src="/mcf-logo.png" 
              alt="MCF Logo" 
              style={{ height: '46px', width: 'auto', objectFit: 'contain', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.1)', padding: '6px', border: '1px solid #eab308' }} 
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                MCF <span style={{ color: '#eab308' }}>Site Yönetim Sistemi</span>
              </h1>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0', fontWeight: '500' }}>Uzay Mavisi Profesyonel Tesis Yönetimi</p>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: '6px', background: '#0b132b', padding: '5px', borderRadius: '12px', border: '1px solid #334155', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('units')}
              style={{
                padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                backgroundColor: activeTab === 'units' ? '#eab308' : 'transparent',
                color: activeTab === 'units' ? '#000000' : '#94a3b8'
              }}
            >
              🏢 Blok ve Daireler
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              style={{
                padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                backgroundColor: activeTab === 'directory' ? '#eab308' : 'transparent',
                color: activeTab === 'directory' ? '#000000' : '#94a3b8'
              }}
            >
              📖 Sakinler Rehberi
            </button>
            <button
              onClick={() => setActiveTab('accounting')}
              style={{
                padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                backgroundColor: activeTab === 'accounting' ? '#eab308' : 'transparent',
                color: activeTab === 'accounting' ? '#000000' : '#94a3b8'
              }}
            >
              💰 Kasa
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              style={{
                padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                backgroundColor: activeTab === 'reports' ? '#eab308' : 'transparent',
                color: activeTab === 'reports' ? '#000000' : '#94a3b8'
              }}
            >
              📊 Raporlar
            </button>
          </nav>
        </div>
      </header>

      {/* İÇERİK */}
      <main style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* 1. BLOK VE DAİRELER */}
        {activeTab === 'units' && (
          <>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[
                { key: 'A', name: 'A Blok (8 Dükkan)' },
                { key: 'B', name: 'B Blok (14 Kat - 28 Daire)' },
                { key: 'C', name: 'C Blok (14 Kat - 28 Daire)' },
              ].map((block) => (
                <button
                  key={block.key}
                  onClick={() => setSelectedBlock(block.key)}
                  style={{
                    padding: '14px 24px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: selectedBlock === block.key ? '#eab308' : '#1e293b',
                    backgroundColor: selectedBlock === block.key ? '#1c2541' : '#111827',
                    color: selectedBlock === block.key ? '#facc15' : '#94a3b8',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flex: '1 1 auto',
                    textAlign: 'center'
                  }}
                >
                  {block.name}
                </button>
              ))}
            </div>

            {/* ÖZET VE TOPLU AİDAT */}
            <div style={{
              backgroundColor: '#111827',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              border: '1px solid #1e293b',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%', maxWidth: '520px' }}>
                <div style={{ flex: '1 1 200px', backgroundColor: '#1c2541', border: '1px solid #334155', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ background: '#eab308', color: '#000', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>⚠️</div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#fde047', fontWeight: '700' }}>Borçlu Birim</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#fef08a', marginTop: '2px' }}>{totalDebtors} Adet</div>
                  </div>
                </div>

                <div style={{ flex: '1 1 200px', backgroundColor: '#1c2541', border: '1px solid #334155', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ background: '#334155', color: '#fff', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>💳</div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>Toplam Alacak</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', marginTop: '2px' }}>{totalReceivables.toLocaleString('tr-TR')} ₺</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '420px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#cbd5e1' }}>Aidat Tutarı:</span>
                <input
                  type="number"
                  value={dueAmount}
                  onChange={(e) => setDueAmount(e.target.value)}
                  style={{ flex: '1 1 110px', padding: '12px 14px', borderRadius: '10px', border: '1px solid #334155', fontSize: '15px', fontWeight: 'bold', outline: 'none', background: '#0b132b', color: '#ffffff' }}
                />
                <button
                  onClick={handleBulkApplyDue}
                  style={{ flex: '2 1 180px', backgroundColor: '#eab308', color: '#000000', padding: '12px 18px', borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                >
                  ⚡ Toplu Aidat Yansıt
                </button>
              </div>
            </div>

            {/* KARTLAR (RAKAMSAL SIRALANMIŞ) */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Yükleniyor...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
                {filteredUnits.map((unit) => {
                  const isDebtor = unit.status === 'unpaid';
                  const ownerText = getOwnerLabel(unit.block);
                  return (
                    <div
                      key={unit.id}
                      style={{
                        backgroundColor: '#111827',
                        border: '1px solid',
                        borderColor: isDebtor ? '#78350f' : '#14532d',
                        borderRadius: '16px',
                        padding: '18px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', backgroundColor: isDebtor ? '#eab308' : '#22c55e' }} />
                      
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff', fontWeight: '800' }}>
                            {selectedBlock === 'A' ? `Dükkan ${unit.unitNumber}` : `${selectedBlock} Blok - No: ${unit.unitNumber}`}
                          </h3>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: unit.isTenant ? '#312e81' : '#064e3b', color: unit.isTenant ? '#c7d2fe' : '#a7f3d0', fontWeight: '700' }}>
                            {unit.isTenant ? 'Kiracı' : ownerText}
                          </span>
                        </div>

                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#e2e8f0', fontWeight: '600' }}>
                          👤 {unit.residentName || 'İsim Yok'}
                        </p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#94a3b8' }}>
                          📞 {unit.phone || 'Tel Girilmemiş'}
                        </p>
                        {unit.isTenant && unit.landlordName && (
                          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                            🏠 {ownerText}: {unit.landlordName}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '10px', gap: '8px' }}>
                        <div
                          onClick={() => togglePaymentStatus(unit)}
                          style={{
                            cursor: 'pointer',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            backgroundColor: isDebtor ? '#1e1b0b' : '#052e16',
                            color: isDebtor ? '#facc15' : '#4ade80'
                          }}
                        >
                          {isDebtor ? `⚠️ ${unit.debt.toLocaleString('tr-TR')} ₺` : '✅ Ödendi'}
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {unit.phone && (
                            <button
                              onClick={() => openWhatsApp(unit.phone, unit.residentName, unit.debt)}
                              title="WhatsApp Mesaj Gönder"
                              style={{ backgroundColor: '#065f46', color: '#6ee7b7', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                            >
                              💬 WA
                            </button>
                          )}
                          <button
                            onClick={() => setEditingUnit(unit)}
                            style={{ backgroundColor: '#1c2541', color: '#60a5fa', border: '1px solid #334155', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                          >
                            ✏️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* 2. SAKİNLER REHBERİ SEKMESİ */}
        {activeTab === 'directory' && (
          <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.5)', border: '1px solid #1e293b' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', margin: '0 0 16px 0' }}>📖 Tüm Bina Sakinleri Telefon Rehberi</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #1e293b', color: '#94a3b8' }}>
                    <th style={{ padding: '12px' }}>Blok / No</th>
                    <th style={{ padding: '12px' }}>Sakin Adı</th>
                    <th style={{ padding: '12px' }}>Durum</th>
                    <th style={{ padding: '12px' }}>Telefon Numarası</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Hızlı İletişim</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAllUnits.map((u) => {
                    const ownerText = getOwnerLabel(u.block);
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '14px 12px', fontWeight: '800', color: '#eab308' }}>
                          {u.block === 'A' ? `A Blok - Dükkan ${u.unitNumber}` : `${u.block} Blok - No: ${u.unitNumber}`}
                        </td>
                        <td style={{ padding: '14px 12px', fontWeight: '600', color: '#ffffff' }}>{u.residentName}</td>
                        <td style={{ padding: '14px 12px', color: '#94a3b8' }}>
                          {u.isTenant ? `Kiracı (${ownerText}: ${u.landlordName || '-'})` : ownerText}
                        </td>
                        <td style={{ padding: '14px 12px', color: '#cbd5e1', fontWeight: '600' }}>{u.phone || 'Kayıt Yok'}</td>
                        <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                          {u.phone ? (
                            <button
                              onClick={() => openWhatsApp(u.phone, u.residentName, u.debt)}
                              style={{ backgroundColor: '#065f46', color: '#6ee7b7', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                            >
                              💬 WhatsApp Mesaj Gönder
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Tel Yok</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. KASA */}
        {activeTab === 'accounting' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '16px', border: '1px solid #1e293b', borderLeft: '6px solid #22c55e' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '700' }}>Toplam Gelir</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#4ade80', marginTop: '8px' }}>{totalIncome.toLocaleString('tr-TR')} ₺</div>
              </div>
              <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '16px', border: '1px solid #1e293b', borderLeft: '6px solid #eab308' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '700' }}>Toplam Gider</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#facc15', marginTop: '8px' }}>{totalExpense.toLocaleString('tr-TR')} ₺</div>
              </div>
              <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '16px', border: '1px solid #1e293b', borderLeft: '6px solid #3b82f6' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '700' }}>Net Kasa Bakiyesi</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: netBalance >= 0 ? '#60a5fa' : '#f87171', marginTop: '8px' }}>{netBalance.toLocaleString('tr-TR')} ₺</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#111827', padding: '28px', borderRadius: '16px', marginBottom: '28px', border: '1px solid #1e293b' }}>
              <h3 style={{ margin: '0 0 18px 0', fontSize: '16px', color: '#ffffff', fontWeight: '800' }}>➕ Yeni Kasa İşlemi Ekle</h3>
              <form onSubmit={handleAddTransaction} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}
                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155', fontSize: '14px', flex: '1 1 150px', fontWeight: '700', background: '#0b132b', color: '#ffffff' }}
                >
                  <option value="income">🟢 Gelir Ekle</option>
                  <option value="expense">🔴 Gider Ekle</option>
                </select>

                <input
                  type="text"
                  placeholder="Açıklama (Örn: Asansör Bakımı)"
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155', fontSize: '14px', flex: '2 1 260px', background: '#0b132b', color: '#ffffff' }}
                />

                <input
                  type="number"
                  placeholder="Tutar (₺)"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155', fontSize: '14px', flex: '1 1 130px', background: '#0b132b', color: '#ffffff' }}
                />

                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155', fontSize: '14px', flex: '1 1 170px', background: '#0b132b', color: '#ffffff', fontWeight: '500' }}
                >
                  <option value="Aidat Tahsilatı">Aidat Tahsilatı</option>
                  <option value="Ortak Gelir">Ortak Gelir</option>
                  <option value="Elektrik/Su">Elektrik / Su</option>
                  <option value="Temizlik">Temizlik</option>
                  <option value="Bakım Onarım">Bakım & Onarım</option>
                  <option value="Diğer">Diğer</option>
                </select>

                <button
                  type="submit"
                  style={{ backgroundColor: '#eab308', color: '#000000', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', flex: '1 1 150px' }}
                >
                  Kaydet
                </button>
              </form>
            </div>

            <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '24px', border: '1px solid #1e293b' }}>
              <h3 style={{ margin: '0 0 18px 0', fontSize: '16px', color: '#ffffff', fontWeight: '800' }}>📋 Kasa Hareketleri Geçmişi</h3>
              {transactions.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px' }}>Henüz kayıt yok.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #1e293b', color: '#94a3b8' }}>
                        <th style={{ padding: '12px' }}>Tarih</th>
                        <th style={{ padding: '12px' }}>Tür</th>
                        <th style={{ padding: '12px' }}>Kategori</th>
                        <th style={{ padding: '12px' }}>Açıklama</th>
                        <th style={{ padding: '12px' }}>Tutar</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '14px 12px', color: '#94a3b8' }}>{t.date || 'Bugün'}</td>
                          <td style={{ padding: '14px 12px', fontWeight: '700', color: t.type === 'income' ? '#4ade80' : '#facc15' }}>
                            {t.type === 'income' ? '🟢 Gelir' : '🔴 Gider'}
                          </td>
                          <td style={{ padding: '14px 12px', color: '#cbd5e1' }}>{t.category}</td>
                          <td style={{ padding: '14px 12px', color: '#ffffff', fontWeight: '600' }}>{t.title}</td>
                          <td style={{ padding: '14px 12px', fontWeight: '800', color: t.type === 'income' ? '#4ade80' : '#facc15' }}>
                            {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString('tr-TR')} ₺
                          </td>
                          <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteTransaction(t.id)}
                              style={{ backgroundColor: '#422006', color: '#facc15', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. RAPORLAR */}
        {activeTab === 'reports' && (
          <div style={{ backgroundColor: '#111827', padding: '60px', borderRadius: '16px', textAlign: 'center', border: '1px solid #1e293b' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', margin: '0 0 8px 0' }}>📊 Raporlama Paneli</h2>
            <p style={{ color: '#94a3b8', margin: 0 }}>Sonraki adımda Excel ve PDF rapor indirme araçlarını buraya ekleyeceğiz.</p>
          </div>
        )}

      </main>

      {/* DÜZENLEME MODALI */}
      {editingUnit && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#ffffff', fontWeight: '800' }}>
              🏢 {editingUnit.block === 'A' ? `A Blok - Dükkan ${editingUnit.unitNumber}` : `${editingUnit.block} Blok - No: ${editingUnit.unitNumber}`} Düzenle
            </h3>
            
            <form onSubmit={handleSaveUnitDetails} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>Sakin / İşletmeci Adı Soyadı:</label>
                <input
                  type="text"
                  value={editingUnit.residentName}
                  onChange={(e) => setEditingUnit({ ...editingUnit, residentName: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#0b132b', color: '#ffffff', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>Telefon Numarası (WhatsApp):</label>
                <input
                  type="text"
                  placeholder="0532..."
                  value={editingUnit.phone || ''}
                  onChange={(e) => setEditingUnit({ ...editingUnit, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#0b132b', color: '#ffffff', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>Mülkiyet Durumu:</label>
                <select
                  value={editingUnit.isTenant ? 'tenant' : 'owner'}
                  onChange={(e) => setEditingUnit({ ...editingUnit, isTenant: e.target.value === 'tenant' })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#0b132b', color: '#ffffff', fontSize: '14px', fontWeight: '700' }}
                >
                  <option value="owner">🏠 {getOwnerLabel(editingUnit.block)} (Oturuyor / İşletiyor)</option>
                  <option value="tenant">🔑 Kiracı</option>
                </select>
              </div>

              {editingUnit.isTenant && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>
                    {getOwnerLabel(editingUnit.block)} Adı Soyadı:
                  </label>
                  <input
                    type="text"
                    value={editingUnit.landlordName || ''}
                    onChange={(e) => setEditingUnit({ ...editingUnit, landlordName: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#0b132b', color: '#ffffff', fontSize: '14px' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  style={{ flex: 1, backgroundColor: '#334155', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, backgroundColor: '#eab308', color: '#000000', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}