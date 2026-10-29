'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [siteCode, setSiteCode] = useState('');
  const [sitePassword, setSitePassword] = useState('');
  
  // Süper Admin Modalı için State'ler
  const [showSuperModal, setShowSuperModal] = useState(false);
  const [superPassword, setSuperPassword] = useState('');

  // İşletme / Site Girişi
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteCode) {
      alert('Lütfen site/işletme kodu giriniz.');
      return;
    }
    router.push(`/yonetim?site=${encodeURIComponent(siteCode)}`);
  };

  // Tek Tıkla Demo Site Giriş (14 Günlük Süre ve Pro Özellikler Aktif)
  const handleDemoLogin = () => {
    sessionStorage.setItem('mcf_site_package', 'pro');
    sessionStorage.setItem('mcf_admin_logged', 'true');
    router.push('/yonetim?site=Demo-Site');
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
          Site sakini ve yönetim portali giriş ekranı
        </p>
      </div>

      {/* GİRİŞ KARTI */}
      <div style={{ 
        backgroundColor: '#111827', 
        border: '1px solid #1f2937', 
        borderRadius: '16px', 
        padding: '36px', 
        width: '100%', 
        maxWidth: '440px', 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        textAlign: 'center'
      }}>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>
              Site / İşletme Kodu
            </label>
            <input 
              type="text" 
              placeholder="Örn: bulvar-city" 
              value={siteCode}
              onChange={(e) => setSiteCode(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                backgroundColor: '#0b0f19', 
                border: '1px solid #374151', 
                borderRadius: '10px', 
                color: '#fff', 
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }} 
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>
              Erişim Şifresi
            </label>
            <input 
              type="password" 
              placeholder="Şifrenizi giriniz..." 
              value={sitePassword}
              onChange={(e) => setSitePassword(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                backgroundColor: '#0b0f19', 
                border: '1px solid #374151', 
                borderRadius: '10px', 
                color: '#fff', 
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }} 
            />
          </div>

          <button 
            type="submit"
            style={{ 
              backgroundColor: '#f59e0b', 
              color: '#111827', 
              border: 'none', 
              padding: '14px', 
              borderRadius: '10px', 
              fontWeight: '800', 
              fontSize: '15px', 
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
              marginTop: '4px'
            }}
          >
            Panele Giriş Yap
          </button>

        </form>

      </div>

      {/* TEK TIKLA DEMO SİTE BUTONU (14 GÜN & PRO ÖZELLİKLER) */}
      <div style={{ marginTop: '24px', width: '100%', maxWidth: '440px' }}>
        <button 
          onClick={handleDemoLogin}
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
          Tek Tıkla Demo Site İle İncele (14 Gün Pro)
        </button>
      </div>

      {/* SÜPER ADMIN ŞİFRE MODALI */}
      {showSuperModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '16px', padding: '30px', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#f59e0b', fontWeight: '800' }}>MCF Teknoloji Süper Admin</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 20px 0' }}>Süper admin şifrenizi (1923) giriniz.</p>

            <form onSubmit={handleSuperLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="password"
                placeholder="Şifre (1923)"
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