'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

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

export default function SakinPanelPage() {
  const [currentSiteName, setCurrentSiteName] = useState('Bulvar City');
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Seçim State'leri
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedUnitNumber, setSelectedUnitNumber] = useState('');
  
  // Bildirim / Dekont Gönderme State'leri
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // URL'den site adını alma ve birimleri anlık dinleme
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const siteParam = urlParams.get('site');
    if (siteParam) {
      setCurrentSiteName(siteParam);
    }

    const unsubscribeUnits = onSnapshot(collection(db, 'units'), (snapshot) => {
      const fetchedUnits: Unit[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Unit[];

      setUnits(fetchedUnits);
      setLoading(false);

      // Eğer seçili blok yoksa ve birimler geldiyse ilk bloğu varsayılan seç
      const blocks = Array.from(new Set(fetchedUnits.map(u => u.block))).sort();
      if (blocks.length > 0 && (!selectedBlock || !blocks.includes(selectedBlock))) {
        setSelectedBlock(blocks[0]);
      }
    });

    return () => unsubscribeUnits();
  }, []);

  // Veritabanındaki aktif birimlerden benzersiz blok listesini dinamik al
  const availableBlocks = Array.from(new Set(units.map(u => u.block))).sort();

  // Seçilen bloğa ait daire / birim listesi
  const unitsInSelectedBlock = units
    .filter(u => u.block === selectedBlock)
    .sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber));

  // Seçilen dairenin bilgileri
  const currentUnit = units.find(u => u.block === selectedBlock && Number(u.unitNumber) === Number(selectedUnitNumber));

  // Dekont / Bildirim Gönderme
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlock || !selectedUnitNumber) return alert('Lütfen blok ve daire seçiniz.');
    if (!complaintTitle || !complaintDesc) return alert('Lütfen başlık ve açıklama giriniz.');

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'complaints'), {
        unitInfo: `${selectedBlock} Blok No: ${selectedUnitNumber}`,
        title: complaintTitle,
        description: complaintDesc,
        status: 'pending',
        date: new Date().toLocaleDateString('tr-TR'),
        createdAt: serverTimestamp()
      });

      setComplaintTitle('');
      setComplaintDesc('');
      setSuccessMessage('Bildiriminiz / Dekontunuz yönetime başarıyla iletildi!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error(err);
      alert('Gönderilirken hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontWeight: 'bold' }}>Yükleniyor...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', fontFamily: 'Inter, system-ui, sans-serif', color: '#ffffff', padding: '24px' }}>
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Üst Başlık */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', backgroundColor: '#111827', padding: '20px 24px', borderRadius: '16px', border: '1px solid #1f2937' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b', margin: '0 0 4px 0' }}>{currentSiteName} Sakin Portalı</h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Borç sorgulama ve ödeme bildirim ekranı</p>
          </div>
          <a href="/" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none', fontWeight: 'bold' }}>← Ana Sayfa</a>
        </div>

        {/* Daire Seçim Kartı */}
        <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '24px', border: '1px solid #1f2937', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', margin: '0 0 16px 0' }}>🏢 Dairenizi Seçin</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>Blok Seçin</label>
              <select 
                value={selectedBlock} 
                onChange={(e) => {
                  setSelectedBlock(e.target.value);
                  setSelectedUnitNumber('');
                }}
                style={{ width: '100%', padding: '14px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '10px', color: '#fff', fontWeight: 'bold' }}
              >
                {availableBlocks.length === 0 ? (
                  <option value="">Aktif blok bulunamadı</option>
                ) : (
                  availableBlocks.map(blk => (
                    <option key={blk} value={blk}>{blk} Blok</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>Daire / No Seçin</label>
              <select 
                value={selectedUnitNumber} 
                onChange={(e) => setSelectedUnitNumber(e.target.value)}
                style={{ width: '100%', padding: '14px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '10px', color: '#fff', fontWeight: 'bold' }}
              >
                <option value="">Daire Seçiniz</option>
                {unitsInSelectedBlock.map(u => (
                  <option key={u.id} value={u.unitNumber}>No: {u.unitNumber} ({u.residentName})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Borç Durumu Göstergesi */}
        {currentUnit && (
          <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '24px', border: '1px solid', borderColor: currentUnit.status === 'unpaid' ? '#ef4444' : '#10b981', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>{currentUnit.block} Blok - No: {currentUnit.unitNumber}</span>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: '4px 0 0 0' }}>{currentUnit.residentName}</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>Güncel Borç / Aidat</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: currentUnit.status === 'unpaid' ? '#ef4444' : '#10b981' }}>
                  {currentUnit.status === 'unpaid' ? `${currentUnit.debt.toLocaleString('tr-TR')} ₺` : '0 ₺ (Borç Yok)'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ödeme Bildirimi / Dekont Gönderme Formu */}
        {currentUnit && (
          <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '24px', border: '1px solid #1f2937' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#f59e0b', margin: '0 0 6px 0' }}>📨 Ödeme Bildirimi & Dekont Gönder</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0' }}>Havale/EFT yaptıysanız dekont bilgisini buradan yönetime bildirebilirsiniz.</p>

            {successMessage && (
              <div style={{ backgroundColor: '#065f46', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}>
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmitComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input 
                type="text" 
                placeholder="Bildirim Başlığı (Örn: Kasım Ayı Aidat Ödemesi)" 
                value={complaintTitle} 
                onChange={(e) => setComplaintTitle(e.target.value)} 
                style={{ width: '100%', padding: '14px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '10px', color: '#fff', fontWeight: 'bold' }} 
              />
              <textarea 
                placeholder="Açıklama / Dekont Referans Numarası" 
                rows={4} 
                value={complaintDesc} 
                onChange={(e) => setComplaintDesc(e.target.value)} 
                style={{ width: '100%', padding: '14px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '10px', color: '#fff', fontWeight: 'bold', resize: 'vertical' }} 
              />
              <button 
                type="submit" 
                disabled={submitting} 
                style={{ backgroundColor: '#f59e0b', color: '#111827', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}
              >
                {submitting ? 'Gönderiliyor...' : 'Bildirimi Yönetime Gönder'}
              </button>
            </form>
          </div>
        )}

      </div>

    </div>
  );
}