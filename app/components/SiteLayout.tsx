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
  { key: 'A', name: 'A Blok (Dükkanlar)' },
  { key: 'B', name: 'B Blok (Konut - 14 Kat)' },
  { key: 'C', name: 'C Blok (Konut - 14 Kat)' },
];

export default function SiteLayout() {
  const [activeTab, setActiveTab] = useState<'units' | 'accounting' | 'reports'>('units');
  const [selectedBlock, setSelectedBlock] = useState('A');
  const [dueAmount, setDueAmount] = useState('1500');
  const [units, setUnits] = useState<Unit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Aidat Tahsilatı');

  useEffect(() => {
    const unsubscribeUnits = onSnapshot(collection(db, 'units'), (snapshot) => {
      const fetchedUnits: Unit[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Unit[];
      setUnits(fetchedUnits);
      setLoading(false);
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

  const filteredUnits = units.filter(u => u.block === selectedBlock);
  const totalDebtors = units.filter(u => u.status === 'unpaid').length;
  const totalReceivables = units.reduce((sum, u) => sum + (u.debt || 0), 0);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;

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

  const handleBulkApplyDue = async () => {
    if (!confirm(`${dueAmount} ₺ aidat tüm dairelere yansıtılsın mı?`)) return;
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

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle || !txAmount) return alert('Lütfen başlık ve tutar giriniz.');
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', color: '#1e293b' }}>
      
      {/* ÜST KURUMSAL HEADER */}
      <header style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        padding: '18px 24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img 
              src="/mcf-logo.png" 
              alt="MCF Logo" 
              style={{ height: '46px', width: 'auto', objectFit: 'contain', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', padding: '6px' }} 
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>MCF Site Yönetim Sistemi</h1>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0', fontWeight: '500' }}>Profesyonel Bina ve Tesis Yönetimi</p>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setActiveTab('units')}
              style={{
                padding: '10px 18px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: activeTab === 'units' ? '#3b82f6' : 'transparent',
                color: activeTab === 'units' ? '#ffffff' : '#94a3b8',
                boxShadow: activeTab === 'units' ? '0 2px 10px rgba(59, 130, 246, 0.4)' : 'none'
              }}
            >
              🏢 Blok ve Daireler
            </button>
            <button
              onClick={() => setActiveTab('accounting')}
              style={{
                padding: '10px 18px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: activeTab === 'accounting' ? '#3b82f6' : 'transparent',
                color: activeTab === 'accounting' ? '#ffffff' : '#94a3b8',
                boxShadow: activeTab === 'accounting' ? '0 2px 10px rgba(59, 130, 246, 0.4)' : 'none'
              }}
            >
              💰 Gelir / Gider (Kasa)
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              style={{
                padding: '10px 18px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: activeTab === 'reports' ? '#3b82f6' : 'transparent',
                color: activeTab === 'reports' ? '#ffffff' : '#94a3b8',
                boxShadow: activeTab === 'reports' ? '0 2px 10px rgba(59, 130, 246, 0.4)' : 'none'
              }}
            >
              📊 Raporlar
            </button>
          </nav>
        </div>
      </header>

      {/* İÇERİK KISMI */}
      <main style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
        
        {activeTab === 'units' && (
          <>
            {/* BLOK SEÇİMİ */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
              {defaultBlocks.map((block) => (
                <button
                  key={block.key}
                  onClick={() => setSelectedBlock(block.key)}
                  style={{
                    padding: '14px 24px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: selectedBlock === block.key ? '#3b82f6' : '#e2e8f0',
                    backgroundColor: selectedBlock === block.key ? '#eff6ff' : '#ffffff',
                    color: selectedBlock === block.key ? '#1d4ed8' : '#64748b',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: selectedBlock === block.key ? '0 4px 12px rgba(59, 130, 246, 0.1)' : '0 2px 4px rgba(0,0,0,0.02)',
                    whiteSpace: 'nowrap',
                    flex: '1 1 auto',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  {block.name}
                </button>
              ))}
            </div>

            {/* ÖZET VE AİDAT KARTI */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              border: '1px solid #f1f5f9',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%', maxWidth: '520px' }}>
                <div style={{ flex: '1 1 200px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ background: '#f59e0b', color: '#fff', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>⚠️</div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '700' }}>Borçlu Daire</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#92400e', marginTop: '2px' }}>{totalDebtors} Adet</div>
                  </div>
                </div>

                <div style={{ flex: '1 1 200px', backgroundColor: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ background: '#3b82f6', color: '#fff', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>💳</div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: '700' }}>Toplam Alacak</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e40af', marginTop: '2px' }}>{totalReceivables.toLocaleString('tr-TR')} ₺</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '420px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Aidat Tutarı:</span>
                <input
                  type="number"
                  value={dueAmount}
                  onChange={(e) => setDueAmount(e.target.value)}
                  style={{ flex: '1 1 110px', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: 'bold', outline: 'none', background: '#f8fafc' }}
                />
                <button
                  onClick={handleBulkApplyDue}
                  style={{ flex: '2 1 180px', backgroundColor: '#ef4444', color: '#ffffff', padding: '12px 18px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)', transition: 'all 0.2s' }}
                >
                  ⚡ Toplu Aidat Yansıt
                </button>
              </div>
            </div>

            {/* DAİRE KARTLARI GRID */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontWeight: '600' }}>Veriler Yükleniyor...</div>
            ) : filteredUnits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                Bu blokta henüz daire eklenmemiş.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '18px' }}>
                {filteredUnits.map((unit) => {
                  const isDebtor = unit.status === 'unpaid';
                  return (
                    <div
                      key={unit.id}
                      onClick={() => togglePaymentStatus(unit)}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid',
                        borderColor: isDebtor ? '#fecaca' : '#bbf7d0',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', backgroundColor: isDebtor ? '#ef4444' : '#22c55e' }} />
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800' }}>
                        {selectedBlock} Blok - No: {unit.unitNumber}
                      </h3>
                      <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                        {unit.residentName || 'Sakin Belirtilmemiş'}
                      </p>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        backgroundColor: isDebtor ? '#fef2f2' : '#f0fdf4',
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

        {activeTab === 'accounting' && (
          <div>
            {/* KASA ÖZETLERİ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', borderLeft: '6px solid #22c55e' }}>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>Toplam Gelir</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#16a34a', marginTop: '8px' }}>{totalIncome.toLocaleString('tr-TR')} ₺</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', borderLeft: '6px solid #ef4444' }}>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>Toplam Gider</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#ef4444', marginTop: '8px' }}>{totalExpense.toLocaleString('tr-TR')} ₺</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', borderLeft: '6px solid #3b82f6' }}>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>Net Kasa Bakiyesi</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: netBalance >= 0 ? '#3b82f6' : '#ef4444', marginTop: '8px' }}>{netBalance.toLocaleString('tr-TR')} ₺</div>
              </div>
            </div>

            {/* İŞLEM EKLEME FORMU */}
            <div style={{ backgroundColor: '#ffffff', padding: '28px', borderRadius: '16px', marginBottom: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: '0 0 18px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800' }}>➕ Yeni Kasa İşlemi Ekle</h3>
              <form onSubmit={handleAddTransaction} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}
                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', flex: '1 1 150px', fontWeight: '700', background: '#f8fafc' }}
                >
                  <option value="income">🟢 Gelir Ekle</option>
                  <option value="expense">🔴 Gider Ekle</option>
                </select>

                <input
                  type="text"
                  placeholder="Açıklama (Örn: Elektrik Faturası)"
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', flex: '2 1 260px', background: '#f8fafc' }}
                />

                <input
                  type="number"
                  placeholder="Tutar (₺)"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', flex: '1 1 130px', background: '#f8fafc' }}
                />

                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', flex: '1 1 170px', background: '#f8fafc', fontWeight: '500' }}
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
                  style={{ backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', flex: '1 1 150px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}
                >
                  Kaydet
                </button>
              </form>
            </div>

            {/* TABLO */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: '0 0 18px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800' }}>📋 Kasa Hareketleri Geçmişi</h3>
              {transactions.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '30px', fontWeight: '500' }}>Henüz kayıtlı bir kasa hareketi bulunmuyor.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
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
                        <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '14px 12px', color: '#64748b', fontWeight: '500' }}>{t.date || 'Bugün'}</td>
                          <td style={{ padding: '14px 12px', fontWeight: '700', color: t.type === 'income' ? '#16a34a' : '#ef4444' }}>
                            {t.type === 'income' ? '🟢 Gelir' : '🔴 Gider'}
                          </td>
                          <td style={{ padding: '14px 12px', color: '#475569', fontWeight: '500' }}>{t.category}</td>
                          <td style={{ padding: '14px 12px', color: '#0f172a', fontWeight: '600' }}>{t.title}</td>
                          <td style={{ padding: '14px 12px', fontWeight: '800', color: t.type === 'income' ? '#16a34a' : '#ef4444' }}>
                            {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString('tr-TR')} ₺
                          </td>
                          <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteTransaction(t.id)}
                              style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
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

        {activeTab === 'reports' && (
          <div style={{ backgroundColor: '#ffffff', padding: '60px', borderRadius: '16px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>📊 Raporlama Paneli</h2>
            <p style={{ color: '#64748b', margin: 0, fontWeight: '500' }}>Sonraki adımda Excel ve PDF rapor indirme araçlarını buraya ekleyeceğiz.</p>
          </div>
        )}

      </main>
    </div>
  );
}