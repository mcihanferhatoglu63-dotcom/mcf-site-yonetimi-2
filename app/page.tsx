'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [showSuperModal, setShowSuperModal] = useState(false);
  const [superPassword, setSuperPassword] = useState('');

  const handleSuperLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (superPassword === '1923') {
      sessionStorage.setItem('mcf_super_logged', 'true');
      router.push('/superadmin');
    } else {
      alert('Hatalı Süperadmin Şifresi!');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '20px', color: '#fff' }}>
      
      {/* KART */}
      <div style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '24px', maxWidth: '450px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid #334155', textAlign: 'center' }}>
        
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>🏢</div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 10px 0', color: '#f8fafc' }}>MCF Tesis Yönetim Sistemi</h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 30px 0', lineHeight: '1.5' }}>
          Yüzlerce siteyi ve apartmanı tek merkezden yönetin. SaaS abonelik ve paket yönetim sistemi.
        </p>

        {/* GİRİŞ BUTONLARI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button 
            onClick={() => router.push('/yonetim')}
            style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}
          >
            🏢 Site Yönetici Paneli
          </button>

          <button 
            onClick={() => router.push('/sakin')}
            style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)' }}
          >
            🏠 Sakin Giriş Portalı
          </button>

          {/* SÜPERADMIN BUTONU (İSTEDİĞİN ÖZEL BUTON) */}
          <button 
            onClick={() => setShowSuperModal(true)}
            style={{ backgroundColor: '#eab308', color: '#422006', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}
          >
            👑 Süperadmin Paneli (SaaS)
          </button>
        </div>

      </div>

      {/* SÜPERADMIN ŞİFRE MODALI */}
      {showSuperModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '30px', maxWidth: '400px', width: '100%', color: '#0f172a', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: '800' }}>👑 Süperadmin Girişi</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>Merkezi yönetim için şifrenizi giriniz.</p>

            <form onSubmit={handleSuperLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="password"
                placeholder="Şifre (1923)"
                value={superPassword}
                onChange={(e) => setSuperPassword(e.target.value)}
                style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '16px', textAlign: 'center', fontWeight: 'bold' }}
              />
              <button type="submit" style={{ backgroundColor: '#eab308', color: '#422006', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>
                Giriş Yap
              </button>
              <button type="button" onClick={() => setShowSuperModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}>
                İptal
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}