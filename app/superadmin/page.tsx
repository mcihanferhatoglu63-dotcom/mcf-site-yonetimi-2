'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

interface Tenant {
  id: string;
  siteName: string;
  adminName: string;
  phone: string;
  packageType: 'trial' | 'basic' | 'pro';
  expireDate: string;
  createdAt?: any;
}

export default function SuperAdminPage() {
  const [isSuperLoggedIn, setIsSuperLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Yeni Site Ekleme Form State'leri
  const [siteName, setSiteName] = useState('Bulvar City');
  const [adminName, setAdminName] = useState('');
  const [phone, setPhone] = useState('');
  const [packageType, setPackageType] = useState<'trial' | 'basic' | 'pro'>('pro');
  const [expireDate, setExpireDate] = useState('Süresiz');

  useEffect(() => {
    const auth = sessionStorage.getItem('mcf_super_logged');
    if (auth === 'true') {
      setIsSuperLoggedIn(true);
    }
  }, []);

  // Firestore'dan Tüm Siteleri Çek
  useEffect(() => {
    if (!isSuperLoggedIn) return;
    const unsubscribe = onSnapshot(collection(db, 'tenants'), (snapshot) => {
      let fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tenant[];
      setTenants(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isSuperLoggedIn]);

  // GİRİŞ EKRANI
  if (!isSuperLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0b0f19 0%, #111827 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '20px' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '40px', borderRadius: '20px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', textAlign: 'center' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
            <img 
              src="/mcf-logo.png" 
              alt="MCF Logo" 
              style={{ height: '56px', width: 'auto', objectFit: 'contain', background: '#0b0f19', padding: '8px', borderRadius: '12px', border: '1px solid #374151' }} 
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>

          <h2 style={{ color: '#ffffff', fontSize: '20px', fontWeight: '800', margin: '0 0 6px 0' }}>MCF Technology</h2>
          <p style={{ color: '#f59e0b', fontSize: '13px', fontWeight: '700', margin: '0 0 20px 0' }}>Site Takip Yönetim Sistemi (Süperadmin)</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (password === '1923') {
              setIsSuperLoggedIn(true);
              sessionStorage.setItem('mcf_super_logged', 'true');
            } else {
              alert('Hatalı Süperadmin Şifresi!');
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="password"
              placeholder="Süperadmin Şifresi (1923)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff', fontSize: '15px', outline: 'none', textAlign: 'center', fontWeight: 'bold' }}
            />
            <button type="submit" style={{ backgroundColor: '#f59e0b', color: '#111827', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>
              Sisteme Giriş Yap
            </button>
            <a href="/" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none', marginTop: '6px' }}>← Ana Sayfaya Dön</a>
          </form>
        </div>
      </div>
    );
  }

  // YENİ SİTE EKLEME
  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName || !adminName) return alert('Lütfen site adı ve yönetici bilgilerini giriniz.');

    try {
      await addDoc(collection(db, 'tenants'), {
        siteName,
        adminName,
        phone: phone || '-',
        packageType,
        expireDate: expireDate || 'Süresiz',
        createdAt: serverTimestamp()
      });
      setSiteName('');
      setAdminName('');
      setPhone('');
      alert('Yeni site başarıyla eklendi!');
    } catch (err) {
      console.error(err);
      alert('Eklenirken hata oluştu.');
    }
  };

  const handlePackageChange = async (id: string, newPkg: 'trial' | 'basic' | 'pro') => {
    try {
      await updateDoc(doc(db, 'tenants', id), { packageType: newPkg });
    } catch (err) { console.error(err); }
  };

  const handleDeleteTenant = async (id: string) => {
    if (!confirm('Bu siteyi sistemden silmek istediğinize emin misiniz?')) return;
    try { await deleteDoc(doc(db, 'tenants', id)); } catch (err) { console.error(err); }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', fontFamily: 'Inter, system-ui, sans-serif', color: '#ffffff' }}>
      
      {/* HEADER */}
      <header style={{ backgroundColor: '#111827', borderBottom: '1px solid #1f2937', padding: '18px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img 
              src="/mcf-logo.png" 
              alt="MCF Logo" 
              style={{ height: '42px', width: 'auto', objectFit: 'contain', background: '#0b0f19', padding: '6px', borderRadius: '8px', border: '1px solid #374151' }} 
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#f59e0b' }}>MCF Technology</h1>
              <p style={{ fontSize: '12px', margin: '2px 0 0 0', color: '#94a3b8' }}>Site Takip Yönetim Sistemi - Süperadmin Paneli</p>
            </div>
          </div>
          <button 
            onClick={() => {
              sessionStorage.removeItem('mcf_super_logged');
              setIsSuperLoggedIn(false);
            }} 
            style={{ backgroundColor: '#ef4444', color: '#ffffff', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
          >
            Çıkış Yap
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '24px auto', padding: '0 20px' }}>
        
        {/* YENİ SİTE EKLEME FORMU */}
        <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '24px', marginBottom: '28px', border: '1px solid #1f2937', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#f59e0b', fontWeight: '800' }}>➕ Yeni Site / Apartman Ekle</h3>
          <form onSubmit={handleAddTenant} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Site Adı (Örn: Bulvar City)" value={siteName} onChange={(e) => setSiteName(e.target.value)} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff', flex: 2, minWidth: '200px', outline: 'none' }} />
            <input type="text" placeholder="Yönetici Adı" value={adminName} onChange={(e) => setAdminName(e.target.value)} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff', flex: 1, minWidth: '150px', outline: 'none' }} />
            <input type="text" placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff', flex: 1, minWidth: '140px', outline: 'none' }} />
            <select value={packageType} onChange={(e) => setPackageType(e.target.value as any)} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff', fontWeight: 'bold', outline: 'none' }}>
              <option value="trial">🚀 Trial (14 Gün)</option>
              <option value="basic">📦 Basic (1000₺/Ay)</option>
              <option value="pro">💎 Pro (2000₺/Ay)</option>
            </select>
            <input type="text" placeholder="Bitiş Tarihi" value={expireDate} onChange={(e) => setExpireDate(e.target.value)} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff', flex: 1, minWidth: '140px', outline: 'none' }} />
            <button type="submit" style={{ backgroundColor: '#f59e0b', color: '#111827', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Siteyi Kaydet</button>
          </form>
        </div>

        {/* SİTELER LİSTESİ */}
        <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '24px', border: '1px solid #1f2937', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f59e0b', fontWeight: '800' }}>🏢 Sistemdeki Kayıtlı Siteler ({tenants.length})</h3>
          
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Yükleniyor...</p>
          ) : tenants.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Henüz kayıtlı bir site bulunmuyor.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #1f2937', color: '#94a3b8' }}>
                    <th style={{ padding: '12px' }}>Site / Apartman Adı</th>
                    <th style={{ padding: '12px' }}>Yönetici</th>
                    <th style={{ padding: '12px' }}>Telefon</th>
                    <th style={{ padding: '12px' }}>Paket Türü</th>
                    <th style={{ padding: '12px' }}>Bitiş Tarihi</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Yönetim Paneli</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '12px', fontWeight: '800', color: '#ffffff' }}>{t.siteName}</td>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#cbd5e1' }}>{t.adminName}</td>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>{t.phone}</td>
                      <td style={{ padding: '12px' }}>
                        <select 
                          value={t.packageType} 
                          onChange={(e) => handlePackageChange(t.id, e.target.value as any)}
                          style={{
                            padding: '6px 10px', borderRadius: '8px', border: '1px solid #374151', fontWeight: 'bold',
                            backgroundColor: t.packageType === 'pro' ? '#0369a1' : t.packageType === 'basic' ? '#b45309' : '#374151',
                            color: '#ffffff'
                          }}
                        >
                          <option value="trial">🚀 Trial</option>
                          <option value="basic">📦 Basic (1000₺)</option>
                          <option value="pro">💎 Pro (2000₺)</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#94a3b8' }}>{t.expireDate}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <a 
                          href={`/yonetim?siteId=${t.id}`}
                          style={{ backgroundColor: '#0284c7', color: '#fff', textDecoration: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', display: 'inline-block' }}
                        >
                          🔗 Panele Git
                        </a>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => handleDeleteTenant(t.id)} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
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

      </main>
    </div>
  );
}