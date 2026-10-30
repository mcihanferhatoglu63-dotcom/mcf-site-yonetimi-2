'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface Tenant {
  id: string;
  siteName: string;
  packageType?: string;
  sitePassword?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  
  // Seçim Modalı (Yönetim mi, Sakin mi?)
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState('');

  // Gerçek Siteler için Yönetim Şifre Doğrulama Modalı
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [targetSiteForPassword, setTargetSiteForPassword5] = useState<{name: string, pass: string} | null>(null);

  // Süper Admin Modalı için State'ler
  const [showSuperModal, setShowSuperModal] = useState(false);
  const [superPassword, setSuperPassword] = useState('');

  // Firestore'dan kayıtlı siteleri anlık çek
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tenants'), (snapshot) => {
      const fetchedTenants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tenant[];
      setTenants(fetchedTenants);
      setLoadingTenants(false);
    });

    return () => unsubscribe();
  }, []);

  // Listeden bir siteye tıklandığında
  const handleSiteClick = (tenant: Tenant) => {
    setSelectedSite(tenant.siteName);
    
    // Eğer tıklanan site "Demo-Site" ise şifresiz olarak direkt portal seçimine git
    if (tenant.siteName === 'Demo-Site') {
      sessionStorage.setItem('mcf_site_package', 'pro');
      setShowPortalModal(true);
    } else {
      // Normal siteler için portal seçimine yönlendir
      setShowPortalModal(true);
    }
  };

  // Tek Tıkla Demo Site Girişi
  const handleDemoClick = () => {
    sessionStorage.setItem('mcf_site_package', 'pro');
    setSelectedSite('Demo-Site');
    setShowPortalModal(true);
  };

  // Yönetim Paneline Yönlendir (Demo ise şifresiz, diğerlerinde şifre kontrolü ile)
  const goToManagement = () => {
    if (selectedSite === 'Demo-Site') {
      sessionStorage.setItem('mcf_admin_logged', 'true');
      router.push(`/yonetim?site=${encodeURIComponent(selectedSite)}`);
    } else {
      // Normal site ise yönetim paneline yönlendir (Yönetim paneli kendi içinde şifre isteyecek)
      router.push(`/yonetim?site=${encodeURIComponent(selectedSite)}`);
    }
  };

  // Sakin Portalına Yönlendir (Hepsi şifresiz, daire no ile)
  const goToResident = () => {
    router.push(`/sakin?site=${encodeURIComponent(selectedSite)}`);
  };

  // Süper Admin Giriş Doğrulama
  const handleSuperLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (superPassword === '1923') {
      sessionStorage.setItem('mcf_super_logged', 'true');
      router.push('/superadmin');
    } else {
      alert('Hatalı Süper Admin Şifresi!');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0b0f19', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontFamily: 'Inter, system-ui, sans-serif', 
      position: 'relative', 
      padding: '20px',
      color: '#ffffff'
    }}>
      
      {/* SAĞ ÜST KÖŞE SÜPER ADMIN BUTONU */}
      <button 
        onClick={() => setShowSuperModal(true)}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          backgroundColor: '#0284c7',
          color: '#ffffff',
          border: 'none',
          padding: '10px 18px',
          borderRadius: '8px',
          fontWeight: '700',
          fontSize: '13px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
          transition: 'background 0.2s'
        }}
      >
        Süper Admin Paneli
      </button>

      {/* ANA BAŞLIK */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '800', 
          color: '#f59e0b', 
          margin: '0 0 8px 0',
          letterSpacing: '-0.5px'
        }}>
          MCF Teknoloji & Site Yönetim Sistemi
        </h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
          Lütfen giriş yapmak istediğiniz siteyi seçiniz
        </p>
      </div>

      {/* KAYITLI SİTELER LİSTESİ (KUTU) */}
      <div style={{ 
        backgroundColor: '#111827', 
        border: '1px solid #1f2937', 
        borderRadius: '16px', 
        padding: '28px', 
        width: '100%', 
        maxWidth: '440px', 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
        maxHeight: '320px',
        overflowY: 'auto'
      }}>
        
        <h3 style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 16px 0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          🏢 Kayıtlı Siteler / İşletmeler
        </h3>

        {loadingTenants ? (
          <p style={{ color: '#94a3b8', fontSize: '14px', padding: '20px 0' }}>Siteler yükleniyor...</p>
        ) : tenants.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '14px', padding: '20px 0' }}>Henüz kayıtlı site bulunmuyor.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => handleSiteClick(tenant)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  backgroundColor: '#0b0f19',
                  border: '1px solid #374151',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <span>🏢 {tenant.siteName}</span>
                <span style={{ fontSize: '12px', color: '#f59e0b', background: '#1f2937', padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                  {tenant.packageType || 'Pro'}
                </span>
              </button>
            ))}
          </div>
        )}

      </div>

      {/* TEK TIKLA DEMO SİTE BUTONU */}
      <div style={{ marginTop: '20px', width: '100%', maxWidth: '440px' }}>
        <button 
          onClick={handleDemoClick}
          style={{ 
            width: '100%', 
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', 
            color: '#ffffff', 
            border: 'none', 
            padding: '14px', 
            borderRadius: '12px', 
            fontWeight: '800', 
            fontSize: '15px', 
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
          }}
        >
          ✨ Tek Tıkla Demo Site İle İncele (14 Gün Pro)
        </button>
      </div>

      {/* PORTAL SEÇİM MODALI (SAKİN GİRİŞİ VEYA YÖNETİM GİRİŞİ) */}
      {showPortalModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#f59e0b', fontWeight: '800' }}>{selectedSite}</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 24px 0' }}>Lütfen bağlanmak istediğiniz portali seçiniz.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={goToManagement}
                style={{ backgroundColor: '#f59e0b', color: '#111827', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}
              >
                🏢 Yönetim Girişi {selectedSite === 'Demo-Site' ? '(Şifresiz)' : ''}
              </button>
              <button 
                onClick={goToResident}
                style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}
              >
                🏠 Sakin Girişi (Şifresiz)
              </button>
              <button 
                onClick={() => setShowPortalModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', marginTop: '8px' }}
              >
                İptal / Geri Dön
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SÜPER ADMIN ŞİFRE MODALI */}
      {showSuperModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '16px', padding: '30px', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#f59e0b', fontWeight: '800' }}>MCF Teknoloji Süper Admin</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 20px 0' }}>Yönetici şifrenizi giriniz.</p>

            <form onSubmit={handleSuperLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="password"
                placeholder="Şifrenizi giriniz..."
                value={superPassword}
                onChange={(e) => setSuperPassword(e.target.value)}
                style={{ padding: '12px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '15px', textAlign: 'center', outline: 'none', fontWeight: 'bold' }}
              />
              <button type="submit" style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>
                Sisteme Bağlan
              </button>
              <button type="button" onClick={() => setShowSuperModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}>
                İptal
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}