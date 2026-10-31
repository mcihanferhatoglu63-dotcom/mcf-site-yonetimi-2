'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

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
  residentPassword?: string;
}

interface Handyman {
  id: string;
  title: string;
  name: string;
  phone: string;
  category: string;
}

interface Complaint {
  id: string;
  unitInfo: string;
  title: string;
  description: string;
  status: 'pending' | 'resolved';
  date: string;
}

export default function SakinPanelPage() {
  const [currentSiteName, setCurrentSiteName] = useState('Bulvar City');
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'handymen' | 'my-complaints'>('dashboard');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedUnitNumber, setSelectedUnitNumber] = useState('');
  const [residentPasswordInput, setResidentPasswordInput] = useState('');
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);

  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);

  const [handymen, setHandymen] = useState<Handyman[]>([
    { id: '1', title: 'Su Tesisatçısı', name: 'Mehmet Usta', phone: '05321112233', category: 'Tesisat' },
    { id: '2', title: 'Elektrik Arıza', name: 'Ahmet Usta', phone: '05334445566', category: 'Elektrik' },
    { id: '3', title: 'Çilingir / Kapı', name: 'Hasan Usta', phone: '05357778899', category: 'Güvenlik' },
    { id: '4', title: 'Asansör Bakım', name: '7/24 Asansör Servis', phone: '05360001122', category: 'Teknik' }
  ]);

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

      const blocks = Array.from(new Set(fetchedUnits.map(u => u.block))).sort();
      if (blocks.length > 0 && (!selectedBlock || !blocks.includes(selectedBlock))) {
        setSelectedBlock(blocks[0]);
      }
    });

    return () => unsubscribeUnits();
  }, []);

  useEffect(() => {
    const currentUnit = units.find(u => u.id === activeUnitId);
    if (!currentUnit) {
      setMyComplaints([]);
      return;
    }

    const unitIdentifier = `${currentUnit.block} Blok No: ${currentUnit.unitNumber}`;
    const unsubscribeComplaints = onSnapshot(collection(db, 'complaints'), (snapshot) => {
      const all: Complaint[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Complaint[];
      const filtered = all.filter(c => c.unitInfo === unitIdentifier);
      setMyComplaints(filtered);
    });

    return () => unsubscribeComplaints();
  }, [activeUnitId, units]);

  const availableBlocks = Array.from(new Set(units.map(u => u.block))).sort();
  const unitsInSelectedBlock = units
    .filter(u => u.block === selectedBlock)
    .sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber));

  const handleResidentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlock || !selectedUnitNumber) return alert('Lütfen blok ve daire seçiniz.');

    const targetUnit = units.find(u => u.block === selectedBlock && Number(u.unitNumber) === Number(selectedUnitNumber));
    if (!targetUnit) return alert('Daire bulunamadı.');

    if (currentSiteName === 'Demo-Site') {
      setIsLoggedIn(true);
      setActiveUnitId(targetUnit.id);
      return;
    }

    if (!residentPasswordInput) return alert('Lütfen daire şifrenizi giriniz.');
    const correctPassword = targetUnit.residentPassword || '1234';

    if (residentPasswordInput === correctPassword) {
      setIsLoggedIn(true);
      setActiveUnitId(targetUnit.id);
    } else {
      alert('Hatalı daire şifresi! (Varsayılan şifre: 1234)');
    }
  };

  const currentUnit = units.find(u => u.id === activeUnitId);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveUnitId(null);
    setResidentPasswordInput('');
    sessionStorage.removeItem('mcf_admin_logged');
    window.location.href = '/';
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) return alert('Şifre en az 4 haneli olmalıdır.');
    if (!activeUnitId) return;

    try {
      await updateDoc(doc(db, 'units', activeUnitId), {
        residentPassword: newPassword
      });
      setNewPassword('');
      setShowPasswordChangeModal(false);
      alert('Şifreniz başarıyla güncellendi!');
    } catch (err) {
      console.error(err);
      alert('Şifre güncellenirken hata oluştu.');
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUnit) return;
    if (!complaintTitle || !complaintDesc) return alert('Lütfen başlık ve açıklama giriniz.');

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'complaints'), {
        unitInfo: `${currentUnit.block} Blok No: ${currentUnit.unitNumber}`,
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

  // GİRİŞ EKRANI (TEMİZLENMİŞ VE LOGO EKLENMİŞ)
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', fontFamily: 'Inter, system-ui, sans-serif', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '40px', borderRadius: '20px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', textAlign: 'center' }}>
          
          {/* YETERLİ BÜYÜKLÜKTE ORTALANMIŞ LOGO */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
            <img 
              src="/logo.png" 
              alt="MCF Logo" 
              style={{ maxWidth: '200px', width: '100%', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(245, 158, 11, 0.2))' }} 
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ color: '#f59e0b', fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>{currentSiteName} Sakin Portalı</h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
              {currentSiteName === 'Demo-Site' ? 'Demo Giriş (Şifresiz)' : 'Güvenli Daire Giriş Ekranı'}
            </p>
          </div>

          <form onSubmit={handleResidentLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
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
                {availableBlocks.map(blk => (
                  <option key={blk} value={blk}>{blk} Blok</option>
                ))}
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

            {currentSiteName !== 'Demo-Site' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>Daire Şifresi</label>
                <input 
                  type="password" 
                  placeholder="Şifrenizi giriniz (İlk şifre: 1234)" 
                  value={residentPasswordInput}
                  onChange={(e) => setResidentPasswordInput(e.target.value)}
                  style={{ width: '100%', padding: '14px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '10px', color: '#fff', fontWeight: 'bold', outline: 'none' }}
                />
              </div>
            )}

            <button type="submit" style={{ backgroundColor: '#f59e0b', color: '#111827', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '15px', marginTop: '6px' }}>
              {currentSiteName === 'Demo-Site' ? 'Demo Giriş Yap' : 'Güvenli Giriş Yap'}
            </button>

            <a href="/" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none', textAlign: 'center', marginTop: '10px', fontWeight: 'bold' }}>← Ana Sayfaya Dön</a>
          </form>
        </div>
      </div>
    );
  }

  // GİRİŞ YAPILMIŞ PANEL
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', fontFamily: 'Inter, system-ui, sans-serif', color: '#ffffff', padding: '24px' }}>
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* ÜST BAŞLIK & LOGO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: '#111827', padding: '16px 24px', borderRadius: '16px', border: '1px solid #1f2937', flexWrap: 'wrap', gap: '14px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img 
              src="/logo.png" 
              alt="MCF Logo" 
              style={{ height: '44px', width: 'auto', objectFit: 'contain' }} 
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', lineHeight: '1.2' }}>{currentSiteName} Sakin Portalı</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#f59e0b' }}>{currentUnit?.block} Blok - No: {currentUnit?.unitNumber} ({currentUnit?.residentName})</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              onClick={() => setActiveTab('dashboard')} 
              style={{ backgroundColor: activeTab === 'dashboard' ? '#f59e0b' : '#374151', color: activeTab === 'dashboard' ? '#111827' : '#fff', border: 'none', padding: '10px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
            >
              🏠 Portal
            </button>
            <button 
              onClick={() => setActiveTab('my-complaints')} 
              style={{ backgroundColor: activeTab === 'my-complaints' ? '#f59e0b' : '#374151', color: activeTab === 'my-complaints' ? '#111827' : '#fff', border: 'none', padding: '10px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', position: 'relative' }}
            >
              📋 Bildirimlerim ({myComplaints.length})
            </button>
            <button 
              onClick={() => setActiveTab('handymen')} 
              style={{ backgroundColor: activeTab === 'handymen' ? '#f59e0b' : '#374151', color: activeTab === 'handymen' ? '#111827' : '#fff', border: 'none', padding: '10px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
            >
              📞 Ustalar
            </button>
            {currentSiteName !== 'Demo-Site' && (
              <button onClick={() => setShowPasswordChangeModal(true)} style={{ backgroundColor: '#374151', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                🔑 Şifre
              </button>
            )}
            <button onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
              🚪 Çıkış
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <>
            {currentUnit && (
              <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '24px', border: '1px solid', borderColor: currentUnit.status === 'unpaid' ? '#ef4444' : '#10b981', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>Kişisel Daire Bilgisi</span>
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
                    placeholder="Bildirim Başlığı (Örn: Aidat Ödemesi)" 
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
          </>
        )}

        {activeTab === 'my-complaints' && (
          <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '24px', border: '1px solid #1f2937' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b', margin: '0 0 6px 0' }}>📋 Gönderdiğim Bildirimler & Akıbeti</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0' }}>Yönetime ilettiğiniz dekont ve bildirimlerin onay durumunu buradan takip edebilirsiniz.</p>

            {myComplaints.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Henüz gönderilmiş bir bildiriminiz bulunmuyor.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {myComplaints.map((c) => (
                  <div key={c.id} style={{
                    backgroundColor: '#0b0f19',
                    border: '1px solid #374151',
                    borderRadius: '12px', padding: '18px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{c.date}</span>
                        <span style={{
                          fontSize: '11px', fontWeight: '700', padding: '2px 10px', borderRadius: '6px',
                          backgroundColor: c.status === 'resolved' ? '#065f46' : '#991b1b',
                          color: '#fff'
                        }}>
                          {c.status === 'resolved' ? '✅ Yönetici Onayladı (Çözüldü)' : '🔔 Yönetim İncelemesinde (Bekliyor)'}
                        </span>
                      </div>
                      <h4 style={{ margin: '6px 0', fontSize: '16px', color: '#fff', fontWeight: '800' }}>{c.title}</h4>
                      <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{c.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'handymen' && (
          <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '24px', border: '1px solid #1f2937' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b', margin: '0 0 6px 0' }}>📞 Acil Usta & Servis Rehberi</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0' }}>Site sakinlerinin acil ihtiyaç duyabileceği teknik servis ve ustaların iletişim listesi.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {handymen.map((h) => (
                <div key={h.id} style={{ backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', backgroundColor: '#374151', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>{h.category}</span>
                    <h4 style={{ margin: '10px 0 4px 0', fontSize: '16px', color: '#fff', fontWeight: '800' }}>{h.title}</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', fontWeight: '600' }}>👤 {h.name}</p>
                  </div>
                  <a 
                    href={`tel:${h.phone}`} 
                    style={{ backgroundColor: '#10b981', color: '#fff', textAlign: 'center', padding: '10px', borderRadius: '8px', textDecoration: 'none', fontWeight: '800', fontSize: '14px', display: 'block' }}
                  >
                    📞 {h.phone} Ara
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {showPasswordChangeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#f59e0b' }}>🔑 Daire Şifresini Değiştir</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>Yeni daire şifrenizi belirleyin.</p>
            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="password" 
                placeholder="Yeni Şifre (En az 4 hane)" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff', fontWeight: 'bold' }} 
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowPasswordChangeModal(false)} style={{ flex: 1, padding: '10px', background: '#374151', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#f59e0b', color: '#111827', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Güncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}