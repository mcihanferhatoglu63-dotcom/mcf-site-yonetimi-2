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
  const [siteName, setSiteName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [phone, setPhone] = useState('');
  const [packageType, setPackageType] = useState<'trial' | 'basic' | 'pro'>('trial');
  const [expireDate, setExpireDate] = useState('');

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
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '20px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>👑</div>
          <h2 style={{ color: '#0f172a', fontSize: '22px', fontWeight: '800', margin: '0 0 8px 0' }}>MCF SaaS Süperadmin</h2>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 24px 0' }}>Yüzlerce Siteyi ve Aboneyi Yönetin</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (password === '1923') {
              setIsSuperLoggedIn(true);
              sessionStorage.setItem('mcf_super_logged', 'true');
            } else {
              alert('Hatalı Şifre! (Bypass: 1923)');
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="password"
              placeholder="Süperadmin Şifresi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '16px', outline: 'none', textAlign: 'center', fontWeight: 'bold' }}
            />
            <button type="submit" style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>
              Ana Panele Giriş Yap
            </button>
            <a href="/" style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none', marginTop: '6px' }}>← Ana Sayfaya Dön</a>
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
        expireDate: expireDate || '30 Gün Sonra',
        createdAt: serverTimestamp()
      });
      setSiteName('');
      setAdminName('');
      setPhone('');
      setExpireDate('');
      alert('Yeni site SaaS sistemine başarıyla eklendi!');
    } catch (err) {
      console.error(err);
      alert('Site eklenirken hata oluştu.');
    }
  };

  const handlePackageChange = async (id: string, newPkg: 'trial' | 'basic' | 'pro') => {
    try {
      await updateDoc(doc(db, 'tenants', id), { packageType: newPkg });
    } catch (err) { console.error(err); }
  };

  const handleDeleteTenant = async (id: string) => {
    if (!confirm('Bu siteyi sistemden tamamen silmek istediğinize emin misiniz?')) return;
    try { await deleteDoc(doc(db, 'tenants', id)); } catch (err) { console.error(err); }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', color: '#0f172a' }}>
      
      {/* HEADER */}
      <header style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', padding: '18px 24px', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.3)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '26px' }}>👑</span>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>MCF SaaS <span style={{ color: '#38bdf8' }}>Merkezi Süperadmin Paneli</span></h1>
              <p style={{ fontSize: '12px', margin: '2px 0 0 0', opacity: 0.8 }}>Tüm Sitelerin ve Abonelik Paketlerinin Yönetim Merkezi</p>
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
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800' }}>➕ Sisteme Yeni Site / Apartman Ekle</h3>
          <form onSubmit={handleAddTenant} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Site Adı (Örn: Güneş Sitesi)" value={siteName} onChange={(e) => setSiteName(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', flex: 2, minWidth: '200px' }} />
            <input type="text" placeholder="Site Yöneticisi" value={adminName} onChange={(e) => setAdminName(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', flex: 1, minWidth: '150px' }} />
            <input type="text" placeholder="Yönetici Telefonu" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', flex: 1, minWidth: '140px' }} />
            <select value={packageType} onChange={(e) => setPackageType(e.target.value as any)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontWeight: 'bold' }}>
              <option value="trial">🚀 Trial (14 Gün)</option>
              <option value="basic">📦 Basic (1.000 ₺/Ay)</option>
              <option value="pro">💎 Pro (2.000 ₺/Ay)</option>
            </select>
            <input type="text" placeholder="Bitiş Tarihi" value={expireDate} onChange={(e) => setExpireDate(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', flex: 1, minWidth: '140px' }} />
            <button type="submit" style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Siteyi Kaydet</button>
          </form>
        </div>

        {/* SİTELER LİSTESİ */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>🏢 Kayıtlı Tüm Siteler ve Abonelikler ({tenants.length})</h3>
          
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Yükleniyor...</p>
          ) : tenants.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Henüz kayıtlı bir site bulunmuyor. Yukarıdan yeni site ekleyebilirsiniz.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px' }}>Site / Apartman Adı</th>
                    <th style={{ padding: '12px' }}>Yönetici</th>
                    <th style={{ padding: '12px' }}>Telefon</th>
                    <th style={{ padding: '12px' }}>Abonelik Paketi</th>
                    <th style={{ padding: '12px' }}>Bitiş Tarihi</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Yönetim Paneline Git</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: '800', color: '#0f172a' }}>{t.siteName}</td>
                      <td style={{ padding: '12px', fontWeight: '600' }}>{t.adminName}</td>
                      <td style={{ padding: '12px', color: '#475569' }}>{t.phone}</td>
                      <td style={{ padding: '12px' }}>
                        <select 
                          value={t.packageType} 
                          onChange={(e) => handlePackageChange(t.id, e.target.value as any)}
                          style={{
                            padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold',
                            backgroundColor: t.packageType === 'pro' ? '#e0f2fe' : t.packageType === 'basic' ? '#fef3c7' : '#f1f5f9',
                            color: t.packageType === 'pro' ? '#0369a1' : t.packageType === 'basic' ? '#92400e' : '#475569'
                          }}
                        >
                          <option value="trial">🚀 Trial</option>
                          <option value="basic">📦 Basic (1000₺)</option>
                          <option value="pro">💎 Pro (2000₺)</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#475569' }}>{t.expireDate}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <a 
                          href={`/yonetim?siteId=${t.id}`}
                          style={{ backgroundColor: '#0284c7', color: '#fff', textDecoration: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', display: 'inline-block' }}
                        >
                          🔗 Panele Gir
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