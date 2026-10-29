'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

interface Tenant {
  id: string;
  siteName: string;
  adminName: string;
  phone: string;
  sitePassword: string;
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
  const [sitePassword, setSitePassword] = useState('');
  const [packageType, setPackageType] = useState<'trial' | 'basic' | 'pro'>('pro');
  const [expireDate, setExpireDate] = useState('Süresiz');

  // Düzenleme Modu
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    const auth = sessionStorage.getItem('mcf_super_logged');
    if (auth === 'true') {
      setIsSuperLoggedIn(true);
    }
  }, []);

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

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName || !adminName || !sitePassword) {
      return alert('Lütfen site adı, yönetici adı ve site erişim şifresini doldurunuz.');
    }

    try {
      await addDoc(collection(db, 'tenants'), {
        siteName,
        adminName,
        phone: phone || '-',
        sitePassword,
        packageType,
        expireDate: expireDate || 'Süresiz',
        createdAt: serverTimestamp()
      });
      setSiteName('');
      setAdminName('');
      setPhone('');
      setSitePassword('');
      alert('Yeni site ve şifresi başarıyla kaydedildi!');
    } catch (err) {
      console.error(err);
      alert('Eklenirken hata oluştu.');
    }
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    try {
      await updateDoc(doc(db, 'tenants', editingTenant.id), {
        siteName: editingTenant.siteName,
        adminName: editingTenant.adminName,
        phone: editingTenant.phone,
        sitePassword: editingTenant.sitePassword,
        packageType: editingTenant.packageType,
        expireDate: editingTenant.expireDate
      });
      setEditingTenant(null);
      alert('Site bilgileri güncellendi!');
    } catch (err) {
      console.error(err);
      alert('Güncellenirken hata oluştu.');
    }
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
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#f59e0b' }}>MCF Technology</h1>
            <p style={{ fontSize: '12px', margin: '2px 0 0 0', color: '#94a3b8' }}>Site Takip Yönetim Sistemi - Süperadmin Paneli</p>
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
          <form onSubmit={handleAddTenant} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Site Adı (Örn: Bulvar City)" value={siteName} onChange={(e) => setSiteName(e.target.value)} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff', flex: 2, minWidth: '180px', outline: 'none' }} />
            <input type="text" placeholder="Yönetici Adı" value={adminName} onChange={(e) => setAdminName(e.target.value)} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff', flex: 1, minWidth: '130px', outline: 'none' }} />
            <input type="text" placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff', flex: 1, minWidth: '130px', outline: 'none' }} />
            <input type="text" placeholder="Site Giriş Şifresi" value={sitePassword} onChange={(e) => setSitePassword(e.target.value)} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #f59e0b', color: '#fff', flex: 1, minWidth: '130px', outline: 'none', fontWeight: 'bold' }} />
            <select value={packageType} onChange={(e) => setPackageType(e.target.value as any)} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff', fontWeight: 'bold', outline: 'none' }}>
              <option value="trial">🚀 Trial</option>
              <option value="basic">📦 Basic (1000₺)</option>
              <option value="pro">💎 Pro (2000₺)</option>
            </select>
            <input type="text" placeholder="Bitiş Tarihi" value={expireDate} onChange={(e) => setExpireDate(e.target.value)} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#fff', flex: 1, minWidth: '120px', outline: 'none' }} />
            <button type="submit" style={{ backgroundColor: '#f59e0b', color: '#111827', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Kaydet</button>
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
                    <th style={{ padding: '12px' }}>Site Adı</th>
                    <th style={{ padding: '12px' }}>Yönetici</th>
                    <th style={{ padding: '12px' }}>Telefon</th>
                    <th style={{ padding: '12px' }}>Şifre</th>
                    <th style={{ padding: '12px' }}>Paket Türü</th>
                    <th style={{ padding: '12px' }}>Bitiş Tarihi</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Siteye Git</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '12px', fontWeight: '800', color: '#ffffff' }}>{t.siteName}</td>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#cbd5e1' }}>{t.adminName}</td>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>{t.phone}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#f59e0b' }}>{t.sitePassword || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <select 
                          value={t.packageType} 
                          onChange={async (e) => {
                            try { await updateDoc(doc(db, 'tenants', t.id), { packageType: e.target.value }); } catch(err){console.error(err);}
                          }}
                          style={{
                            padding: '6px 10px', borderRadius: '8px', border: '1px solid #374151', fontWeight: 'bold',
                            backgroundColor: t.packageType === 'pro' ? '#0369a1' : t.packageType === 'basic' ? '#b45309' : '#374151',
                            color: '#ffffff'
                          }}
                        >
                          <option value="trial">🚀 Trial</option>
                          <option value="basic">📦 Basic</option>
                          <option value="pro">💎 Pro</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#94a3b8' }}>{t.expireDate}</td>
                      
                      {/* SİTEYE GİT BUTONU */}
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <a 
                          href={`/yonetim?site=${encodeURIComponent(t.siteName)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ 
                            backgroundColor: '#0284c7', 
                            color: '#fff', 
                            textDecoration: 'none', 
                            padding: '6px 12px', 
                            borderRadius: '8px', 
                            fontWeight: '700', 
                            fontSize: '12px', 
                            display: 'inline-block',
                            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                          }}
                        >
                          🔗 Siteye Git
                        </a>
                      </td>

                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => setEditingTenant(t)} style={{ backgroundColor: '#374151', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                            ✏️ Düzenle
                          </button>
                          <button onClick={() => handleDeleteTenant(t.id)} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                            🗑️ Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* DÜZENLEME MODALI */}
      {editingTenant && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '20px', padding: '30px', maxWidth: '450px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#f59e0b', fontSize: '18px', fontWeight: '800' }}>✏️ Site Bilgilerini Düzenle</h3>
            
            <form onSubmit={handleUpdateTenant} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Site Adı</label>
                <input type="text" value={editingTenant.siteName} onChange={(e) => setEditingTenant({...editingTenant, siteName: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Yönetici Adı</label>
                <input type="text" value={editingTenant.adminName} onChange={(e) => setEditingTenant({...editingTenant, adminName: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Telefon</label>
                <input type="text" value={editingTenant.phone} onChange={(e) => setEditingTenant({...editingTenant, phone: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Site Erişim Şifresi</label>
                <input type="text" value={editingTenant.sitePassword || ''} onChange={(e) => setEditingTenant({...editingTenant, sitePassword: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: '#0b0f19', border: '1px solid #f59e0b', borderRadius: '8px', color: '#fff', outline: 'none', fontWeight: 'bold', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Bitiş Tarihi</label>
                <input type="text" value={editingTenant.expireDate} onChange={(e) => setEditingTenant({...e, expireDate: e.target.value} as any)} style={{ width: '100%', padding: '10px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingTenant(null)} style={{ flex: 1, padding: '12px', background: '#374151', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>İptal</button>
                <button type="submit" style={{ flex: 1, padding: '12px', background: '#f59e0b', color: '#111827', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800' }}>Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}