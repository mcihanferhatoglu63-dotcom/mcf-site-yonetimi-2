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
  debt: number;
  status: 'paid' | 'unpaid';
}

export default function SakinPortalPage() {
  const [block, setBlock] = useState('B');
  const [unitNumber, setUnitNumber] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Şikayet / Bildirim Formu
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'units'), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Unit[];
      setUnits(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber) return alert('Lütfen daire/dükkan numaranızı giriniz.');

    const found = units.find(u => u.block === block && Number(u.unitNumber) === Number(unitNumber));
    if (found) {
      setCurrentUnit(found);
      setIsLoggedIn(true);
    } else {
      alert('Girilen bilgilere ait birim bulunamadı. Lütfen yöneticiye başvurun.');
    }
  };

  const handleSendComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !currentUnit) return alert('Lütfen başlık ve açıklama giriniz.');

    setSubmitting(true);
    try {
      const unitInfo = currentUnit.block === 'A' ? `Dükkan ${currentUnit.unitNumber}` : `${currentUnit.block} Blok No: ${currentUnit.unitNumber}`;
      await addDoc(collection(db, 'complaints'), {
        unitInfo,
        title,
        description,
        status: 'pending',
        date: new Date().toLocaleDateString('tr-TR'),
        createdAt: serverTimestamp()
      });
      setTitle('');
      setDescription('');
      alert('Bildiriminiz / Talebiniz yönetime başarıyla iletildi!');
    } catch (err) {
      console.error(err);
      alert('Gönderilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  // ACİL USTALAR LİSTESİ
  const emergencyContacts = [
    { name: 'Ahmet Usta (Elektrikçi)', phone: '05321112233', icon: '⚡' },
    { name: 'Mehmet Tesisat (Su & Sıhhi Tesisat)', phone: '05334445566', icon: '🔧' },
    { name: 'Çilingir Servisi', phone: '05357778899', icon: '🔑' },
    { name: 'Site Güvenlik / Danışma', phone: '03245554433', icon: '🛡️' },
    { name: 'Site Yönetim Ofisi', phone: '03243332211', icon: '🏢' }
  ];

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: '20px', color: '#fff' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '40px', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', textAlign: 'center' }}>
          <h2 style={{ color: '#f59e0b', fontSize: '22px', fontWeight: '800', margin: '0 0 8px 0' }}>Sakin Portali Girişi</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 24px 0' }}>Aidat durumunuzu görmek ve yönetime bildirim iletmek için giriş yapın.</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Blok Seçimi</label>
              <select value={block} onChange={(e) => setBlock(e.target.value)} style={{ width: '100%', padding: '12px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '10px', color: '#fff', outline: 'none', fontWeight: 'bold' }}>
                <option value="A">A Blok (Dükkanlar)</option>
                <option value="B">B Blok</option>
                <option value="C">C Blok</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Daire / Dükkan Numarası</label>
              <input type="number" placeholder="Örn: 12" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} style={{ width: '100%', padding: '12px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '10px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" style={{ backgroundColor: '#f59e0b', color: '#111827', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '15px', marginTop: '6px' }}>
              Portale Giriş Yap
            </button>
            <a href="/" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none', textAlign: 'center', marginTop: '4px' }}>← Ana Sayfaya Dön</a>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', fontFamily: 'Inter, system-ui, sans-serif', color: '#ffffff', paddingBottom: '40px' }}>
      
      {/* HEADER */}
      <header style={{ backgroundColor: '#111827', borderBottom: '1px solid #1f2937', padding: '18px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#f59e0b' }}>Sakin Portali</h1>
            <p style={{ fontSize: '12px', margin: '2px 0 0 0', color: '#94a3b8' }}>{currentUnit?.block} Blok - No: {currentUnit?.unitNumber} ({currentUnit?.residentName})</p>
          </div>
          <button onClick={() => setIsLoggedIn(false)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
            Çıkış Yap
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '24px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* BORÇ DURUM KARTI */}
        <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '24px', border: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#94a3b8' }}>Güncel Aidat / Borç Durumunuz</h3>
            <div style={{ fontSize: '28px', fontWeight: '800', color: currentUnit?.status === 'unpaid' ? '#ef4444' : '#10b981' }}>
              {currentUnit?.status === 'unpaid' ? `${currentUnit.debt.toLocaleString('tr-TR')} ₺ Borcunuz Var` : '✅ Borcunuz Bulunmuyor (Ödendi)'}
            </div>
          </div>
          <div style={{ padding: '12px 20px', borderRadius: '10px', backgroundColor: currentUnit?.status === 'unpaid' ? '#fee2e2' : '#d1fae5', color: currentUnit?.status === 'unpaid' ? '#dc2626' : '#059669', fontWeight: '800', fontSize: '14px' }}>
            {currentUnit?.status === 'unpaid' ? 'Ödeme Bekleniyor' : 'Hesap Temiz'}
          </div>
        </div>

        {/* BİLDİRİM / ŞİKAYET GÖNDERME */}
        <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '24px', border: '1px solid #1f2937' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#f59e0b', fontWeight: '800' }}>✉️ Yönetime Bildirim / Dekont Gönder</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0' }}>Yaptığınız aidat ödemesinin dekontunu veya siteyle ilgili taleplerinizi buraya yazabilirsiniz.</p>

          <form onSubmit={handleSendComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input type="text" placeholder="Konu / Başlık (Örn: Kasım Ayı Aidat Dekont Bildirimi)" value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff', outline: 'none' }} />
            <textarea placeholder="Açıklamanızı buraya yazınız..." rows={4} value={description} onChange={(e) => setDescription(e.target.value)} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff', outline: 'none', resize: 'vertical' }} />
            <button type="submit" disabled={submitting} style={{ backgroundColor: '#f59e0b', color: '#111827', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', alignSelf: 'flex-start' }}>
              {submitting ? 'Gönderiliyor...' : 'Yönetime Gönder'}
            </button>
          </form>
        </div>

        {/* ACİL USTALAR VE REHBER */}
        <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '24px', border: '1px solid #1f2937' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f59e0b', fontWeight: '800' }}>🔧 Acil Ustalar & Site Rehberi</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {emergencyContacts.map((c, index) => (
              <div key={index} style={{ backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{c.icon}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{c.name}</div>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>{c.phone}</div>
                  </div>
                </div>
                <a href={`tel:${c.phone}`} style={{ backgroundColor: '#0284c7', color: '#fff', textDecoration: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                  📞 Ara
                </a>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}