'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Eğer hata verirse '@/firebase' olarak değiştir
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

interface Tenant {
  id: string;
  siteName: string;
  adminName: string;
  phone: string;
  packageType: 'trial' | 'basic' | 'pro';
  expireDate: string;
  status: 'active' | 'passive';
}

export default function SuperAdminPage() {
  const [isSuperLoggedIn, setIsSuperLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State'leri
  const [siteName, setSiteName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [phone, setPhone] = useState('');
  const [packageType, setPackageType] = useState<'trial' | 'basic' | 'pro'>('trial');
  const [expireDate, setExpireDate] = useState('');

  // Güvenli Oturum Kontrolü (SSR Hatalarını Önler)
  useEffect(() => {
    const auth = sessionStorage.getItem('mcf_super_logged');
    if (auth === 'true') {
      setIsSuperLoggedIn(true);
    }
    setIsAuthChecked(true);
  }, []);

  // Firestore Veri Çekme
  useEffect(() => {
    if (!isSuperLoggedIn) return;
    const unsubscribe = onSnapshot(collection(db, 'tenants'), (snapshot) => {
      let fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tenant[];
      setTenants(fetched);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Hatasi:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isSuperLoggedIn]);

  if (!isAuthChecked) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>Süperadmin Yükleniyor...</div>;
  }

  // GİRİŞ EKRANI
  if (!isSuperLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '20px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>👑</div>
          <h2 style={{ color: '#0f172a', fontSize: '22px', fontWeight: '800', margin: '0 0 8px 0' }}>MCF SaaS Süperadmin</h2>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 24px 0' }}>Tüm İşletmelerin Lisans ve Paket Yönetimi</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (password === '1923') {
              setIsSuperLoggedIn(true);
              sessionStorage.setItem('mcf_super_logged', 'true');
            } else {
              alert('Hatalı Süperadmin Şifresi! (Bypass Şifresi: 1923)');
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
              Giriş Yap
            </button>
            <a href="/" style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none', marginTop: '6px' }}>← Ana Sayfaya Dön</a>
          </form>
        </div>
      </div>
    );
  }

  // İŞLETME EKLEME
  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName || !adminName) return alert('Lütfen işletme/site adı ve yönetici bilgisi giriniz.');

    try {
      await addDoc(collection(db, 'tenants'), {
        siteName,
        adminName,
        phone: phone || '-',
        packageType,
        expireDate: expireDate || 'Süresiz',
        status: 'active',
        createdAt: serverTimestamp()
      });
      setSiteName('');
      setAdminName('');
      setPhone('');
      setExpireDate('');
      alert('Yeni işletme SaaS sistemine tanımlandı!');
    } catch (err) {
      console.error(err);
      alert('Ekleme sırasında hata oluştu.');
    }
  };

  const handlePackageChange = async (id: string, newPackage: 'trial' | 'basic' | 'pro') => {
    try {
      await updateDoc(doc(db, 'tenants', id), { packageType: newPackage });
    } catch (err) { console.error(err); }
  };

  const handleDeleteTenant = async (id: string) => {
    if (!confirm('Bu işletmeyi SaaS sisteminden silmek istediğinize emin misiniz?')) return;
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
              <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>MCF SaaS <span style={{ color: '#38bdf8' }}>Süperadmin Paneli</span></h1>
              <p style={{ fontSize: '12px', margin: '2px 0 0 0', opacity: 0.8 }}>Kafe POS Benzeri Lisans ve Müşteri Yönetim Merkezi</p>
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
        
        {/* İŞLETME EKLEME FORMU */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800' }}>➕ Yeni Müşteri / Site Tanımla</h3>
          <form onSubmit={handleAddTenant} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Site / İşletme Adı" value={siteName} onChange={(e) => setSiteName(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', flex: 2, minWidth: '200px' }} />
            <input type="text" placeholder="Yönetici Adı" value={adminName} onChange={(e) => setAdminName(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', flex: 1, minWidth: '150px' }} />
            <input type="text" placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', flex: 1, minWidth: '140px' }} />
            <select value={packageType} onChange={(e) => setPackageType(e.target.value as any)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontWeight: 'bold' }}>
              <option value="trial">🚀 Trial (Deneme)</option>
              <option value="basic">📦 Basic (Temel)</option>
              <option value="pro">💎 Pro (Profesyonel)</option>
            </select>
            <input type="text" placeholder="Bitiş Tarihi (Örn: 30.12.2026)" value={expireDate} onChange={(e) => setExpireDate(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', flex: 1, minWidth: '150px' }} />
            <button type="submit" style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Ekle</button>
          </form>
        </div>

        {/* LİSTE */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>🏢 Sistemdeki Müşteriler ({tenants.length})</h3>
          
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Yükleniyor...</p>
          ) : tenants.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Henüz eklenmiş bir müşteri bulunmuyor.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px' }}>İşletme / Site</th>
                    <th style={{ padding: '12px' }}>Yönetici</th>
                    <th style={{ padding: '12px' }}>Telefon</th>
                    <th style={{ padding: '12px' }}>Abonelik Paket Türü</th>
                    <th style={{ padding: '12px' }}>Bitiş Tarihi</th>
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
                          <option value="basic">📦 Basic</option>
                          <option value="pro">💎 Pro</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#475569' }}>{t.expireDate}</td>
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