'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, addDoc, serverTimestamp } from 'firebase/firestore';

interface Unit {
  id: string;
  block: string;
  unitNumber: number;
  residentName: string;
  phone: string;
  debt: number;
  status: 'paid' | 'unpaid';
}

interface Complaint {
  id: string;
  unitInfo: string;
  title: string;
  description: string;
  status: 'pending' | 'resolved';
  date: string;
}

export default function SakinLoginPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Giriş Aşamaları State'leri
  const [phoneInput, setPhoneInput] = useState('');
  const [smsCodeInput, setSmsCodeInput] = useState('');
  const [step, setStep] = useState<'phone' | 'sms' | 'dashboard'>('phone');
  const [loggedInUnit, setLoggedInUnit] = useState<Unit | null>(null);

  // Şikayet Formu
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const masters = [
    { name: 'Ahmet Usta', service: 'Elektrikçi', phone: '05321112233', icon: '⚡', desc: 'Sigorta, avize, priz ve genel elektrik arızaları.' },
    { name: 'Mehmet Usta', service: 'Su Tesisatçısı', phone: '05332223344', icon: '🚰', desc: 'Musluk değişimi, tıkanıklık açma, su kaçağı tespiti.' },
    { name: 'Klima Servisi (Serkan)', service: 'Klimacı', phone: '05353334455', icon: '❄️', desc: 'Klima bakım, montaj, gaz dolumu ve arıza onarımı.' },
    { name: 'Temizlik Ekibi (Fatma Hanım)', service: 'Temizlikçi', phone: '05364445566', icon: '🧹', desc: 'Ev temizliği, merdiven ve detaylı iç temizlik hizmeti.' },
    { name: 'Mobilya Montaj (Caner Usta)', service: 'Mobilyacı', phone: '05375556677', icon: '🪑', desc: 'Dolap kurulumu, ray dolap tamiri ve mobilya montajı.' },
    { name: 'Boya & Badana (Ali Usta)', service: 'Boyacı', phone: '05386667788', icon: '🎨', desc: 'İç cephe boyama, alçı sıva ve duvar kağıdı uygulamaları.' },
  ];

  useEffect(() => {
    const unsubUnits = onSnapshot(collection(db, 'units'), (snapshot) => {
      setUnits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Unit[]);
      setLoading(false);
    });

    const unsubComp = onSnapshot(collection(db, 'complaints'), (snapshot) => {
      setComplaints(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Complaint[]);
    });

    return () => { unsubUnits(); unsubComp(); };
  }, []);

  // 1. Aşama: Telefon Numarası Kontrolü
  const handleVerifyPhone = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneInput.replace(/\D/g, '');
    const found = units.find(u => u.phone && u.phone.replace(/\D/g, '') === cleanPhone);

    if (!found) {
      alert('Bu telefon numarasına ait kayıtlı daire bulunamadı! Lütfen yöneticiye başvurun.');
      return;
    }

    setLoggedInUnit(found);
    setStep('sms'); // SMS kod ekranına geçiş
    alert('SMS Doğrulama Kodu simüle edildi: Sakinler için test kodu -> 1234');
  };

  // 2. Aşama: SMS Kod Doğrulama
  const handleVerifySms = (e: React.FormEvent) => {
    e.preventDefault();
    if (smsCodeInput === '1234') { // Test için sabit 1234 kodu
      setStep('dashboard');
    } else {
      alert('Hatalı SMS kodu! (Test için 1234 yazınız)');
    }
  };

  const handleAddComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc || !loggedInUnit) return alert('Lütfen başlık ve açıklama yazınız.');

    const unitLabel = loggedInUnit.block === 'A' ? `A Blok Dükkan ${loggedInUnit.unitNumber}` : `${loggedInUnit.block} Blok No: ${loggedInUnit.unitNumber}`;

    try {
      await addDoc(collection(db, 'complaints'), {
        unitInfo: unitLabel,
        title,
        description: desc,
        status: 'pending',
        date: new Date().toLocaleDateString('tr-TR'),
        createdAt: serverTimestamp()
      });
      setTitle('');
      setDesc('');
      alert('Şikayet veya talebiniz yönetime iletildi!');
    } catch (err) { console.error(err); }
  };

  // --- EKRAN 1: TELEFON GİRİŞ EKRANI ---
  if (step === 'phone') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '20px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '20px', maxWidth: '420px', width: '100%', boxShadow: '0 15px 30px rgba(0,0,0,0.2)', textAlign: 'center' }}>
          <div style={{ fontSize: '38px', marginBottom: '10px' }}>📱</div>
          <h2 style={{ color: '#064e3b', fontSize: '22px', fontWeight: '800', margin: '0 0 8px 0' }}>Sakin Giriş Portalı</h2>
          <p style={{ color: '#4b5563', fontSize: '13px', margin: '0 0 24px 0' }}>Sisteme kayıtlı telefon numaranızı girerek giriş yapın.</p>
          
          <form onSubmit={handleVerifyPhone} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="text"
              placeholder="Örn: 0532 000 00 00"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              style={{ padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '16px', outline: 'none', textAlign: 'center', fontWeight: 'bold' }}
            />
            <button type="submit" style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>
              SMS Kodu Gönder
            </button>
            <a href="/" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', marginTop: '10px' }}>← Ana Sayfaya Dön</a>
          </form>
        </div>
      </div>
    );
  }

  // --- EKRAN 2: SMS DOĞRULAMA KODU EKRANI ---
  if (step === 'sms') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '20px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '20px', maxWidth: '420px', width: '100%', boxShadow: '0 15px 30px rgba(0,0,0,0.2)', textAlign: 'center' }}>
          <div style={{ fontSize: '38px', marginBottom: '10px' }}>💬</div>
          <h2 style={{ color: '#064e3b', fontSize: '22px', fontWeight: '800', margin: '0 0 8px 0' }}>SMS Doğrulama</h2>
          <p style={{ color: '#4b5563', fontSize: '13px', margin: '0 0 24px 0' }}>Telefonunuza gönderilen 4 haneli kodu giriniz.<br/><strong style={{color:'#059669'}}>(Test Şifresi: 1234)</strong></p>
          
          <form onSubmit={handleVerifySms} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="text"
              maxLength={4}
              placeholder="1 2 3 4"
              value={smsCodeInput}
              onChange={(e) => setSmsCodeInput(e.target.value)}
              style={{ padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '22px', outline: 'none', textAlign: 'center', letterSpacing: '8px', fontWeight: 'bold' }}
            />
            <button type="submit" style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>
              Doğrula ve Giriş Yap
            </button>
            <button type="button" onClick={() => setStep('phone')} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer' }}>
              ← Telefon Numarasını Değiştir
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- EKRAN 3: SAKİN ANA PANELİ (Giriş Başarılı) ---
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ecfdf5', fontFamily: 'Inter, system-ui, sans-serif', color: '#065f46' }}>
      <header style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', padding: '20px 24px', boxShadow: '0 4px 20px rgba(5, 150, 105, 0.2)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>🏠 MCF Site Sakin Portalı</h1>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0', opacity: 0.9 }}>Hoş geldiniz, {loggedInUnit?.residentName}</p>
          </div>
          <button onClick={() => { setLoggedInUnit(null); setStep('phone'); }} style={{ backgroundColor: '#ffffff', color: '#047857', padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
            Çıkış Yap
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '24px auto', padding: '0 20px' }}>
        
        {/* DAİRE ÖZET KARTI */}
        {loggedInUnit && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid #a7f3d0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#064e3b', fontWeight: '800' }}>Daire Bilgileriniz ve Finansal Durum</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '12px', color: '#166534', fontWeight: '700' }}>Birim</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#14532d', marginTop: '4px' }}>{loggedInUnit.block} Blok - No: {loggedInUnit.unitNumber}</div>
              </div>
              <div style={{ backgroundColor: loggedInUnit.status === 'unpaid' ? '#fef2f2' : '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid ' + (loggedInUnit.status === 'unpaid' ? '#fecaca' : '#bbf7d0') }}>
                <div style={{ fontSize: '12px', color: loggedInUnit.status === 'unpaid' ? '#991b1b' : '#166534', fontWeight: '700' }}>Aidat / Borç Durumu</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: loggedInUnit.status === 'unpaid' ? '#7f1d1d' : '#14532d', marginTop: '4px' }}>
                  {loggedInUnit.status === 'unpaid' ? `⚠️ ${loggedInUnit.debt.toLocaleString('tr-TR')} ₺ Borcunuz Var` : '✅ Borcunuz Bulunmuyor'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ŞİKAYET VE TALEP */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #a7f3d0' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#064e3b', fontWeight: '800' }}>✍️ Yönetime Şikayet / Talep İlet</h3>
            <form onSubmit={handleAddComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input type="text" placeholder="Konu" value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px' }} />
              <textarea placeholder="Şikayet veya talebinizi detaylı yazınız..." value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', resize: 'vertical' }} />
              <button type="submit" style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Gönder</button>
            </form>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #a7f3d0' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#064e3b', fontWeight: '800' }}>📢 İlettiğiniz Talepler</h3>
            {complaints.length === 0 ? <p style={{ color: '#6b7280', fontSize: '13px' }}>Henüz kayıtlı talep yok.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                {complaints.map(c => (
                  <div key={c.id} style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>
                      <span>{c.unitInfo}</span>
                      <span style={{ color: c.status === 'resolved' ? '#059669' : '#d97706' }}>{c.status === 'resolved' ? '✅ Çözüldü' : '⏳ İnceleniyor'}</span>
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1f2937', margin: '4px 0' }}>{c.title}</div>
                    <div style={{ fontSize: '13px', color: '#4b5563' }}>{c.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* USTA REHBERİ */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #a7f3d0', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#064e3b', margin: '0 0 6px 0' }}>🛠️ Site Anlaşmalı Usta Rehberi</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
            {masters.map((m, idx) => (
              <div key={idx} style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px', background: '#dcfce7', padding: '8px', borderRadius: '10px' }}>{m.icon}</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#14532d' }}>{m.name}</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#059669', background: '#d1fae5', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '2px' }}>{m.service}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#4b5563', margin: 0 }}>{m.desc}</p>
                </div>
                <div style={{ borderTop: '1px solid #bbf7d0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534' }}>📞 {m.phone}</span>
                  <button onClick={() => window.open(`https://wa.me/${m.phone.replace(/\D/g, '')}?text=Merhaba%20${m.name},%20site%20sakiniyim.`, '_blank')} style={{ backgroundColor: '#22c55e', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                    💬 WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}