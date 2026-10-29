'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, writeBatch, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

interface Unit {
  id: string;
  block: string;
  unitNumber: number;
  residentName: string;
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

const defaultBlocks = [
  { key: 'A', name: 'A Blok (Dükkanlar)', type: 'shop' },
  { key: 'B', name: 'B Blok (Konut - 14 Kat)', type: 'residential' },
  { key: 'C', name: 'C Blok (Konut - 14 Kat)', type: 'residential' },
];

export default function SiteLayout() {
  const [activeTab, setActiveTab] = useState<'units' | 'accounting' | 'reports'>('units');
  const [selectedBlock, setSelectedBlock] = useState('A');
  const [dueAmount, setDueAmount] = useState('1500');
  const [units, setUnits] = useState<Unit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Yeni İşlem Form State'leri (Kasa için)
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Aidat Tahsilatı');

  // Firestore'dan Daireleri Çekme
  useEffect(() => {
    const unsubscribeUnits = onSnapshot(collection(db, 'units'), (snapshot) => {
      const fetchedUnits: Unit[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Unit[];
      setUnits(fetchedUnits);
      setLoading(false);
    }, (error) => {
      console.error("Daireler çekilirken hata:", error);
      setLoading(false);
    });

    // Firestore'dan Kasa İşlemlerini Çekme
    const unsubscribeTx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const fetchedTx: Transaction[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(fetchedTx);
    }, (error) => {
      console.error("Kasa hareketleri çekilirken hata:", error);
    });

    return () => {
      unsubscribeUnits();
      unsubscribeTx();
    };
  }, []);

  const filteredUnits = units.filter(u => u.block === selectedBlock);
  const totalDebtors = units.filter(u => u.status === 'unpaid').length;
  const totalReceivables = units.reduce((sum, u) => sum + (u.debt || 0), 0);

  // Kasa Hesaplamaları
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netBalance = totalIncome - totalExpense;

  // Ödeme / Borç Durumunu Değiştirme
  const togglePaymentStatus = async (unit: Unit) => {
    try {
      const unitRef = doc(db, 'units', unit.id);
      if (unit.status === 'paid') {
        await updateDoc(unitRef, {
          status: 'unpaid',
          debt: Number(dueAmount) || 1500
        });
      } else {
        await updateDoc(unitRef, {
          status: 'paid',
          debt: 0
        });
      }
    } catch (err) {
      console.error("Ödeme güncellenirken hata:", err);
    }
  };

  // Toplu Aidat Yansıtma
  const handleBulkApplyDue = async () => {
    if (!confirm(`${dueAmount} ₺ aidat tüm dairelere yansıtılsın mı?`)) return;

    try {
      const batch = writeBatch(db);
      units.forEach((unit) => {
        const unitRef = doc(db, 'units', unit.id);
        const newDebt = (unit.debt || 0) + Number(dueAmount);
        batch.update(unitRef, {
          debt: newDebt,
          status: 'unpaid'
        });
      });
      await batch.commit();
      alert('Aidatlar tüm dairelere başarıyla yansıtıldı!');
    } catch (err) {
      console.error("Toplu aidat hatası:", err);
      alert('Aidat yansıtılırken bir hata oluştu.');
    }
  };

  // Yeni Gelir / Gider Ekleme
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle || !txAmount) {
      alert('Lütfen işlem başlığı ve tutar giriniz.');
      return;
    }

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
      alert('İşlem kasaya başarıyla eklendi!');
    } catch (err) {
      console.error("İşlem eklenirken hata:", err);
      alert('Kayıt sırasında bir hata oluştu.');
    }
  };

  // İşlem Silme
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (err) {
      console.error("İşlem silinirken hata:", err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f9', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER */}
      <header style={{
        backgroundColor: '#111827',
        color: '#ffffff',
        padding: '16px 20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* LOGO & BAŞLIK */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <img 
              src="/mcf-logo.png" 
              alt="MCF Logo" 
              style={{ 
                height: '42px', 
                width: 'auto', 
                objectFit: 'contain',
                borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '4px'
              }} 
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>
                MCF Site Yönetim Sistemi
              </h1>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                Technology & Software Solutions
              </p>
            </div>
          </div>

          {/* SEKMELER */}
          <nav style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '100%', overflowX: 'auto', paddingBottom: '4px' }}>
            <button
              onClick={() => setActiveTab('units')}
              style={{
                flex: '1 1 auto',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                backgroundColor: activeTab === 'units' ? '#2563eb' : '#1f2937',
                color: activeTab === 'units' ? '#ffffff' : '#9ca3af',
              }}
            >
              🧩 Blok and Daireler
            </button>
            <button
              onClick={() => setActiveTab('accounting')}
              style={{
                flex: '1 1 auto',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                backgroundColor: activeTab === 'accounting' ? '#2563eb' : '#1f2937',
                color: activeTab === 'accounting' ? '#ffffff' : '#9ca3af',
              }}
            >
              💰 Gelir / Gider (Kasa)
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              style={{
                flex: '1 1 auto',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                backgroundColor: activeTab === 'reports' ? '#2563eb' : '#1f2937',
                color: activeTab === 'reports' ? '#ffffff' : '#9ca3af',
              }}
            >
              📊 Raporlar
            </button>
          </nav>
        </div>
      </header>

      {/* İÇERİK ALANI */}
      <main style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* 1. SEKME: BLOK VE DAİRELER */}
        {activeTab === 'units' && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
              {defaultBlocks.map((block) => (
                <button
                  key={block.key}
                  onClick={() => setSelectedBlock(block.key)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: selectedBlock === block.key ? '#2563eb' : '#e5e7eb',
                    backgroundColor: selectedBlock === block.key ? '#2563eb' : '#ffffff',
                    color: selectedBlock === block.key ? '#ffffff' : '#374151',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flex: '1 1 auto',
                    textAlign: 'center'
                  }}
                >
                  🏢 {block.name}
                </button>
              ))}
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%', maxWidth: '500px' }}>
                <div style={{
                  flex: '1 1 180px',
                  backgroundColor: '#fff7ed',
                  border: '1px solid #ffedd5',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '24px' }}>⚠️</span>
                  <div>
                    <div style={{ fontSize: '12px', color: '#c2410c', fontWeight: '500' }}>Borçlu Daire</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#9a3412' }}>{totalDebtors} Adet</div>
                  </div>
                </div>

                <div style={{
                  flex: '1 1 180px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #dbeafe',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '24px' }}>💳</span>
                  <div>
                    <div style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: '500' }}>Toplam Alacak</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e40af' }}>
                      {totalReceivables.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '400px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563' }}>Aidat:</span>
                <input
                  type="number"
                  value={dueAmount}
                  onChange={(e) => setDueAmount(e.target.value)}
                  style={{
                    flex: '1 1 100px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleBulkApplyDue}
                  style={{
                    flex: '2 1 180px',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
                  }}
                >
                  ⚡ Toplu Aidat Yansıt
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Veriler Yükleniyor...</div>
            ) : filteredUnits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', backgroundColor: '#fff', borderRadius: '12px' }}>
                Bu blokta henüz daire/dükkan verisi eklenmemiş.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {filteredUnits.map((unit) => {
                  const isDebtor = unit.status === 'unpaid';
                  return (
                    <div
                      key={unit.id}
                      onClick={() => togglePaymentStatus(unit)}
                      style={{
                        backgroundColor: isDebtor ? '#fef2f2' : '#f0fdf4',
                        border: '1px solid',
                        borderColor: isDebtor ? '#fecaca' : '#bbf7d0',
                        borderRadius: '12px',
                        padding: '16px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#1f2937', fontWeight: 'bold' }}>
                        {selectedBlock} Blok - No: {unit.unitNumber}
                      </h3>
                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6b7280' }}>
                        {unit.residentName || 'Sakin Belirtilmemiş'}
                      </p>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: isDebtor ? '#dc2626' : '#16a34a'
                      }}>
                        {isDebtor ? `⚠️ Borç: ${unit.debt.toLocaleString('tr-TR')} ₺` : '✅ Ödendi'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* 2. SEKME: GELİR / GİDER (KASA) YÖNETİMİ */}
        {activeTab === 'accounting' && (
          <div>
            {/* KASA ÖZET KARTLARI */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', borderLeft: '5px solid #16a34a' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Toplam Gelir</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a', marginTop: '6px' }}>
                  {totalIncome.toLocaleString('tr-TR')} ₺
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', borderLeft: '5px solid #dc2626' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Toplam Gider</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', marginTop: '6px' }}>
                  {totalExpense.toLocaleString('tr-TR')} ₺
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', borderLeft: '5px solid #2563eb' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Net Kasa Bakiyesi</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: netBalance >= 0 ? '#2563eb' : '#dc2626', marginTop: '6px' }}>
                  {netBalance.toLocaleString('tr-TR')} ₺
                </div>
              </div>
            </div>

            {/* YENİ İŞLEM EKLEME FORMU */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '14px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1f2937' }}>➕ Yeni Kasa İşlemi Ekle</h3>
              <form onSubmit={handleAddTransaction} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', flex: '1 1 140px', fontWeight: '600' }}
                >
                  <option value="income">🟢 Gelir Ekle</option>
                  <option value="expense">🔴 Gider Ekle</option>
                </select>

                <input
                  type="text"
                  placeholder="İşlem Açıklaması (Örn: Elektrik Faturası)"
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', flex: '2 1 240px' }}
                />

                <input
                  type="number"
                  placeholder="Tutar (₺)"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', flex: '1 1 120px' }}
                />

                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', flex: '1 1 160px' }}
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
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    flex: '1 1 140px'
                  }}
                >
                  Kaydet
                </button>
              </form>
            </div>

            {/* İŞLEM GEÇMİŞİ TABLOSU */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1f2937' }}>📋 Kasa Hareketleri Geçmişi</h3>
              {transactions.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>Henüz kayıtlı bir kasa hareketi bulunmuyor.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#4b5563' }}>
                        <th style={{ padding: '10px' }}>Tarih</th>
                        <th style={{ padding: '10px' }}>Tür</th>
                        <th style={{ padding: '10px' }}>Kategori</th>
                        <th style={{ padding: '10px' }}>Açıklama</th>
                        <th style={{ padding: '10px' }}>Tutar</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px 10px', color: '#6b7280' }}>{t.date || 'Bugün'}</td>
                          <td style={{ padding: '12px 10px', fontWeight: '600', color: t.type === 'income' ? '#16a34a' : '#dc2626' }}>
                            {t.type === 'income' ? '🟢 Gelir' : '🔴 Gider'}
                          </td>
                          <td style={{ padding: '12px 10px', color: '#374151' }}>{t.category}</td>
                          <td style={{ padding: '12px 10px', color: '#1f2937', fontWeight: '500' }}>{t.title}</td>
                          <td style={{ padding: '12px 10px', fontWeight: 'bold', color: t.type === 'income' ? '#16a34a' : '#dc2626' }}>
                            {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString('tr-TR')} ₺
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteTransaction(t.id)}
                              style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
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

        {/* 3. SEKME: RAPORLAR */}
        {activeTab === 'reports' && (
          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
            <h2>📊 Raporlama Paneli</h2>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>Sonraki adımda Excel ve PDF rapor indirme araçlarını buraya ekleyeceğiz.</p>
          </div>
        )}

      </main>
    </div>
  );
}