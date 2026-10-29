'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc,
  writeBatch 
} from 'firebase/firestore';

export interface Unit {
  id: string;
  name: string;
  blockId: string;
  floor?: number;
  tenant: string;
  phone: string;
  status: 'paid' | 'debt' | 'vacant';
  balance: number;
}

const defaultBlocks = [
  { key: 'block_a', name: '🏢 A Blok (Dükkanlar)' },
  { key: 'block_b', name: '🏙️ B Blok (Konut - 14 Kat)' },
  { key: 'block_c', name: '🏙️ C Blok (Konut - 14 Kat)' }
];

const fallbackUnits: Unit[] = (() => {
  const list: Unit[] = [];
  for (let i = 1; i <= 8; i++) {
    list.push({
      id: `A_${i}`,
      blockId: 'block_a',
      name: `Dükkan ${i}`,
      tenant: i % 2 === 0 ? `İşletme Sakini ${i}` : 'Boş Dükkan',
      phone: '0530 000 00 00',
      status: i % 3 === 0 ? 'debt' : 'paid',
      balance: i % 3 === 0 ? 3500 : 0
    });
  }
  ['block_b', 'block_c'].forEach((blockKey) => {
    const blockPrefix = blockKey === 'block_b' ? 'B' : 'C';
    for (let i = 1; i <= 28; i++) {
      list.push({
        id: `${blockPrefix}_${i}`,
        blockId: blockKey,
        name: `Daire ${i}`,
        floor: Math.ceil(i / 2),
        tenant: `Sakin ${blockPrefix}-${i}`,
        phone: '0535 000 00 00',
        status: i % 4 === 0 ? 'debt' : 'paid',
        balance: i % 4 === 0 ? 1500 : 0
      });
    }
  });
  return list;
})();

export default function SiteLayout() {
  const [selectedBlock, setSelectedBlock] = useState<string>('block_a');
  const [activeTab, setActiveTab] = useState<'units' | 'accounting' | 'reports'>('units');
  const [units, setUnits] = useState<Unit[]>(fallbackUnits);
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const [duesAmount, setDuesAmount] = useState<number>(1500);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    const syncWithFirebase = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "units"));
        if (!querySnapshot.empty) {
          const fetchedUnits: Unit[] = [];
          querySnapshot.forEach((docSnap) => {
            fetchedUnits.push(docSnap.data() as Unit);
          });
          setUnits(fetchedUnits);
        } else {
          for (const u of fallbackUnits) {
            await setDoc(doc(db, "units", u.id), u);
          }
        }
      } catch (err) {
        console.error("Arka plan senkronizasyon hatası:", err);
      }
    };

    syncWithFirebase();
  }, []);

  const handlePayment = async (unitId: string) => {
    const updatedUnits = units.map((u) => 
      u.id === unitId ? { ...u, status: 'paid' as const, balance: 0 } : u
    );
    
    setUnits(updatedUnits);
    localStorage.setItem("site_units_cache", JSON.stringify(updatedUnits));
    setActiveUnit(null);

    try {
      const unitRef = doc(db, "units", unitId);
      await updateDoc(unitRef, {
        status: 'paid',
        balance: 0
      });
    } catch (err) {
      console.error("Arka plan ödeme güncelleme Firebase hatası:", err);
    }
  };

  const handleBulkBilling = async () => {
    if (!window.confirm(`${defaultBlocks.find(b => b.key === selectedBlock)?.name} için tüm birimlere ${duesAmount} ₺ aidat borcu yansıtılsın mı?`)) {
      return;
    }

    const updatedUnits = units.map((unit) => {
      if (unit.blockId === selectedBlock) {
        return { 
          ...unit, 
          balance: unit.balance + Number(duesAmount), 
          status: 'debt' as const 
        };
      }
      return unit;
    });

    setUnits(updatedUnits);
    localStorage.setItem("site_units_cache", JSON.stringify(updatedUnits));
    alert("✅ Seçilen bloktaki tüm dairelere aidat borcu başarıyla yansıtıldı!");

    try {
      const batch = writeBatch(db);
      units.forEach((unit) => {
        if (unit.blockId === selectedBlock) {
          const newBalance = unit.balance + Number(duesAmount);
          const unitRef = doc(db, "units", unit.id);
          batch.update(unitRef, {
            balance: newBalance,
            status: 'debt'
          });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error("Arka plan toplu borçlandırma Firebase hatası:", err);
    }
  };

  const currentUnits = units.filter((u) => u.blockId === selectedBlock);
  const totalDebtCount = currentUnits.filter(u => u.status === 'debt').length;
  const totalBlockBalance = currentUnits.reduce((acc, u) => acc + u.balance, 0);

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
   {/* 🚀 MCF SITE YÖNETİM SİSTEMİ HEADER (LOGOLU) */}
      <header style={{ 
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
        color: '#ffffff', 
        padding: '12px 32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* LOGO GÖRSELİ */}
          <div style={{
            backgroundColor: '#0f172a',
            padding: '6px 12px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            <img 
              src="/mcf-logo.png" 
              alt="MCF Logo" 
              style={{ 
                height: '42px', 
                objectFit: 'contain' 
              }} 
            />
          </div>

          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, letterSpacing: '0.5px' }}>
              MCF Site Yönetim Sistemi
            </h1>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Technology & Software Solutions</span>
          </div>
        </div>

        {/* MENÜ BUTONLARI */}
        <nav style={{ display: 'flex', gap: '8px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '12px' }}>
          <button
            onClick={() => setActiveTab('units')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.2s',
              backgroundColor: activeTab === 'units' ? '#2563eb' : 'transparent',
              color: activeTab === 'units' ? '#ffffff' : '#cbd5e1'
            }}
          >
            🧩 Blok ve Daireler
          </button>
          <button
            onClick={() => setActiveTab('accounting')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.2s',
              backgroundColor: activeTab === 'accounting' ? '#2563eb' : 'transparent',
              color: activeTab === 'accounting' ? '#ffffff' : '#cbd5e1'
            }}
          >
            💰 Gelir / Gider (Kasa)
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.2s',
              backgroundColor: activeTab === 'reports' ? '#2563eb' : 'transparent',
              color: activeTab === 'reports' ? '#ffffff' : '#cbd5e1'
            }}
          >
            📊 Raporlar
          </button>
        </nav>
      </header>

      {/* ANA İÇERİK ALANI */}
      <main style={{ padding: '28px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {activeTab === 'units' && (
          <>
            {/* BLOK SEÇİM SEKMELERİ */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {defaultBlocks.map((block) => (
                <button
                  key={block.key}
                  onClick={() => setSelectedBlock(block.key)}
                  style={{
                    padding: '12px 22px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '15px',
                    boxShadow: selectedBlock === block.key ? '0 4px 12px rgba(37,99,235,0.2)' : 'none',
                    backgroundColor: selectedBlock === block.key ? '#2563eb' : '#ffffff',
                    color: selectedBlock === block.key ? '#ffffff' : '#475569',
                    transition: 'all 0.2s'
                  }}
                >
                  {block.name}
                </button>
              ))}
            </div>

            {/* İSTATİSTİK VE TOPLU İŞLEM BARI */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)', 
              padding: '20px 24px', 
              borderRadius: '16px', 
              marginBottom: '24px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              flexWrap: 'wrap', 
              gap: '20px' 
            }}>
              <div style={{ display: 'flex', gap: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚠️</div>
                  <div>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, display: 'block' }}>Borçlu Daire</span>
                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>{totalDebtCount} Adet</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>💳</div>
                  <div>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, display: 'block' }}>Toplam Alacak</span>
                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>{totalBlockBalance.toLocaleString()} ₺</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>Aidat:</span>
                <input
                  type="number"
                  value={duesAmount}
                  onChange={(e) => setDuesAmount(Number(e.target.value))}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '90px', fontWeight: 'bold' }}
                />
                <button
                  onClick={handleBulkBilling}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(220,38,38,0.3)'
                  }}
                >
                  ⚡ Toplu Aidat Yansıt
                </button>
              </div>
            </div>

            {/* DAİRE/DÜKKAN LİSTESİ */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
              {selectedBlock === 'block_a' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {currentUnits.map((unit) => (
                    <div
                      key={unit.id}
                      onClick={() => setActiveUnit(unit)}
                      style={{
                        padding: '18px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        border: unit.status === 'debt' ? '1px solid #fca5a5' : '1px solid #6ee7b7',
                        backgroundColor: unit.status === 'debt' ? '#fff5f5' : '#f0fdf4',
                        transition: 'transform 0.15s, boxShadow 0.15s'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>{unit.name}</div>
                      <div style={{ fontSize: '13px', marginTop: '4px', color: '#64748b' }}>{unit.tenant}</div>
                      <div style={{ fontSize: '13px', marginTop: '10px', fontWeight: 'bold', color: unit.status === 'debt' ? '#dc2626' : '#16a34a' }}>
                        {unit.status === 'debt' ? `⚠️ Borç: ${unit.balance.toLocaleString()} ₺` : '✅ Ödendi'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(selectedBlock === 'block_b' || selectedBlock === 'block_c') && (
                <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '12px', maxHeight: '600px', overflowY: 'auto', paddingRight: '6px' }}>
                  {Array.from({ length: 14 }, (_, floorIdx) => {
                    const floorNum = floorIdx + 1;
                    const floorUnits = currentUnits.filter((u) => u.floor === floorNum);

                    return (
                      <div key={floorNum} style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                        <div style={{ width: '60px', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                          Kat {floorNum}
                        </div>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                          {floorUnits.map((unit) => (
                            <div
                              key={unit.id}
                              onClick={() => setActiveUnit(unit)}
                              style={{
                                backgroundColor: '#ffffff',
                                padding: '14px 18px',
                                borderRadius: '10px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '15px' }}>{unit.name}</span>
                                <span style={{ fontSize: '13px', display: 'block', color: '#64748b', marginTop: '2px' }}>{unit.tenant}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {unit.status === 'debt' && <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc2626' }}>{unit.balance} ₺</span>}
                                <span
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: unit.status === 'debt' ? '#ef4444' : unit.status === 'vacant' ? '#eab308' : '#10b981'
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'accounting' && (
          <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <h2 style={{ color: '#1e293b' }}>💰 Gelir & Gider (Kasa) Modülü</h2>
            <p style={{ color: '#64748b' }}>Yarın buradan devam edeceğiz. Harcamaları ve kasa hareketlerini buraya bağlayacağız!</p>
          </div>
        )}

        {activeTab === 'reports' && (
          <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <h2 style={{ color: '#1e293b' }}>📊 Raporlama Modülü</h2>
            <p style={{ color: '#64748b' }}>Borçlu listesi dökümü ve PDF ekstre modülü yarın eklenecektir.</p>
          </div>
        )}

      </main>

      {/* TAHSİLAT MODAL */}
      {activeUnit && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '28px', borderRadius: '16px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#0f172a' }}>{activeUnit.name} Detayı</h3>
            <p style={{ margin: '8px 0', color: '#334155' }}><strong>Sakin / Kiracı:</strong> {activeUnit.tenant}</p>
            <p style={{ margin: '8px 0', color: '#334155' }}><strong>İletişim:</strong> {activeUnit.phone}</p>
            <p style={{ margin: '8px 0', color: '#334155' }}><strong>Durum:</strong> {activeUnit.status === 'debt' ? '⚠️ Borçlu' : activeUnit.status === 'vacant' ? '🟡 Boş Daire' : '✅ Ödendi'}</p>
            <p style={{ margin: '12px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: activeUnit.balance > 0 ? '#dc2626' : '#16a34a' }}>
              <strong>Mevcut Bakiye:</strong> {activeUnit.balance.toLocaleString()} ₺
            </p>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveUnit(null)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600 }}>
                Kapat
              </button>
              {activeUnit.status === 'debt' && (
                <button
                  onClick={() => handlePayment(activeUnit.id)}
                  style={{ padding: '10px 18px', borderRadius: '8px', backgroundColor: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}
                >
                  Tahsil Et (Ödendi İşaretle)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}