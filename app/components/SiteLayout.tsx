'use client';

import React, { useState } from 'react';

// Varsayılan Blok Yapısı
const defaultBlocks = [
  { key: 'A', name: 'A Blok (Dükkanlar)', type: 'shop', count: 8 },
  { key: 'B', name: 'B Blok (Konut - 14 Kat)', type: 'residential', count: 56 },
  { key: 'C', name: 'C Blok (Konut - 14 Kat)', type: 'residential', count: 56 },
];

export default function SiteLayout() {
  const [activeTab, setActiveTab] = useState<'units' | 'accounting' | 'reports'>('units');
  const [selectedBlock, setSelectedBlock] = useState('A');
  const [dueAmount, setDueAmount] = useState('1500');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f9', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* ÜST HEADER / MASAÜSTÜ & MOBİL UYUMLU */}
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
              onError={(e) => {
                // Yedek gösterim (logo yüklenemezse kırılmasın)
                (e.target as HTMLElement).style.display = 'none';
              }}
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

          {/* ANA MENÜ SEKMELERİ (MOBİLDE TAM GENİŞLİK / ESMESİ İÇİN) */}
          <nav style={{ 
            display: 'flex', 
            gap: '8px', 
            width: '100%', 
            maxWidth: '100%',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}>
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
                transition: 'all 0.2s'
              }}
            >
              🧩 Blok ve Daireler
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
                transition: 'all 0.2s'
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
                transition: 'all 0.2s'
              }}
            >
              📊 Raporlar
            </button>
          </nav>
        </div>
      </header>

      {/* ANA İÇERİK ALANI */}
      <main style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {activeTab === 'units' && (
          <>
            {/* BLOK SEÇİM SEKMELERİ */}
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              marginBottom: '20px', 
              overflowX: 'auto',
              paddingBottom: '4px' 
            }}>
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
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    whiteSpace: 'nowrap',
                    flex: '1 1 auto',
                    textAlign: 'center'
                  }}
                >
                  🏢 {block.name}
                </button>
              ))}
            </div>

            {/* FİNANSAL ÖZET & AİDAT YANSITMA KARTI (MOBİL UYUMLU) */}
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
              {/* İSTATİSTİKLER */}
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
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#9a3412' }}>2 Adet</div>
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
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e40af' }}>7.000 ₺</div>
                  </div>
                </div>
              </div>

              {/* AİDAT GİRİŞİ */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                width: '100%', 
                maxWidth: '400px',
                flexWrap: 'wrap'
              }}>
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
                    outline: 'none',
                    minWidth: '80px'
                  }}
                />
                <button
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
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ⚡ Toplu Aidat Yansıt
                </button>
              </div>
            </div>

            {/* DÜKKAN / DARE KARTLARI GRID YAPISI (MOBİLDE DÜZGÜN SIRALANMA) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '16px'
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                const isDebtor = num === 3 || num === 6;
                return (
                  <div
                    key={num}
                    style={{
                      backgroundColor: isDebtor ? '#fef2f2' : '#f0fdf4',
                      border: '1px solid',
                      borderColor: isDebtor ? '#fecaca' : '#bbf7d0',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      transition: 'transform 0.15s ease-in-out',
                      cursor: 'pointer'
                    }}
                  >
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#1f2937', fontWeight: 'bold' }}>
                      Dükkan {num}
                    </h3>
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6b7280' }}>
                      {isDebtor ? 'İşletme Sakini ' + num : 'Boş Dükkan'}
                    </p>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: isDebtor ? '#dc2626' : '#16a34a'
                    }}>
                      {isDebtor ? '⚠️ Borç: 3.500 ₺' : '✅ Ödendi'}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'accounting' && (
          <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', textAlign: 'center' }}>
            <h2>💰 Gelir / Gider (Kasa) Yönetimi</h2>
            <p style={{ color: '#6b7280' }}>Kasa modülü mobilde kullanıma hazır düzenlendi.</p>
          </div>
        )}

        {activeTab === 'reports' && (
          <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', textAlign: 'center' }}>
            <h2>📊 Raporlama Paneli</h2>
            <p style={{ color: '#6b7280' }}>Excel ve PDF rapor alma araçları aktif.</p>
          </div>
        )}

      </main>
    </div>
  );
}