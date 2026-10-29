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
  status: 'active' | 'passive';
}

export default function SuperAdminPage() {
  const [isSuperLoggedIn, setIsSuperLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Yeni İşletme Ekleme Formu
  const [siteName, setSiteName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [phone, setPhone] = useState('');
  const [packageType, setPackageType] = useState<'trial' | 'basic' | 'pro'>('trial');
  const [expireDate, setExpireDate] = useState('');

  // Oturum Kalıcılığı Kontrolü
  useEffect(() => {
    const auth = sessionStorage.getItem('mcf_super_logged');
    if (auth === 'true') {
      setIsSuperLoggedIn(true);
    }
  }, []);

  // Firestore'dan İşletmeleri Çekme
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tenants'), (snapshot) => {
      let fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tenant[];
      setTenants(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (!isSuperLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '20px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>👑</div>
          <h2 style={{ color: '#312e81', fontSize: '20px', fontWeight: '800', margin: '0 0 10px 0' }}>MCF Süperadmin Paneli</h2>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 20px 0' }}>SaaS Lisans ve Paket Yönetim Merkezi</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (password === 'asdf') { // Süperadmin şifresi
              setIsSuperLoggedIn(true);
              sessionStorage.setItem('mcf_super_logged', 'true');
            } else {
              alert('Hatalı Süperadmin Şifresi!');
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="password"
              placeholder="Süperadmin Şifresi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #c7d2fe', fontSize: '16px', outline: 'none', textAlign: 'center' }}
            />
            <button type="submit" style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>
              Sisteme Giriş Yap
            </button>
            <a href="/" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', marginTop: '5px' }}>← Ana Sayfaya Dön</a>
          </form>
        </div>
      </div>
    );
  }

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName || !adminName) return alert('Lütfen işletme ve yönetici adı giriniz.');

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
      alert('Yeni işletme başarıyla eklendi!');
    } catch (err) {
      console.error(err);
      alert('İşletme eklenirken hata oluştu.');
    }
  };

  const handlePackageChange = async (id: string, newPackage: 'trial' | 'basic' | 'pro') => {
    try {
      await updateDoc(doc(db, 'tenants', id), { packageType: newPackage });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTenant = async (id: string) => {
    if (!confirm('Bu işletmeyi tamamen silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'tenants', id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', color: '#1e293b' }}>
      
      {/* HEADER */}
      <header style={{ background: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)', color: '#ffffff', padding: '18px 24px', boxShadow: '0 4px 20px rgba(49, 46, 129, 0.25)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>👑</span>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>MCF SaaS <span style={{ color: '#818cf8' }}>Süperadmin Paneli</span></h1>
              <p style={{ fontSize: '12px', margin: '2px 0 0 0', opacity: 0.8 }}>İşletme ve Paket Lisans Yönetim Merkezi</p>
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
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#312e81', fontWeight: '800' }}>➕ Yeni İşletme / Site Ekle</h3>
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
            <button type="submit" style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Ekle</button>
          </form>
        </div>

        {/* İŞLETMELER LİSTESİ */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#312e81', fontWeight: '800' }}>🏢 Kayıtlı İşletmeler ve Paket Durumları ({tenants.length})</h3>
          
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Yükleniyor...</p>
          ) : tenants.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Henüz kayıtlı işletme bulunmuyor.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px' }}>İşletme / Site Adı</th>
                    <th style={{ padding: '12px' }}>Yönetici</th>
                    <th style={{ padding: '12px' }}>Telefon</th>
                    <th style={{ padding: '12px' }}>Aktif Paket</th>
                    <th style={{ padding: '12px' }}>Bitiş Tarihi</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: '800', color: '#1e1b4b' }}>{t.siteName}</td>
                      <td style={{ padding: '12px', fontWeight: '600' }}>{t.adminName}</td>
                      <td style={{ padding: '12px', color: '#475569' }}>{t.phone}</td>
                      <td style={{ padding: '12px' }}>
                        <select 
                          value={t.packageType} 
                          onChange={(e) => handlePackageChange(t.id, e.target.value as any)}
                          style={{
                            padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold',
                            backgroundColor: t.packageType === 'pro' ? '#e0e7ff' : t.packageType === 'basic' ? '#fef3c7' : '#f1f5f9',
                            color: t.packageType === 'pro' ? '#3730a3' : t.packageType === 'basic' ? '#92400e' : '#475569'
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
                          🗑️ Sil
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