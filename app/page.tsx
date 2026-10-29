'use client';

import React from 'react';

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4a1535 0%, #6b2d5c 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '20px',
      color: '#ffffff'
    }}>
      <div style={{
        maxWidth: '700px',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(212, 165, 184, 0.3)',
        borderRadius: '24px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>🏢</div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 10px 0', color: '#ffffff' }}>
          MCF <span style={{ color: '#f3d1df' }}>Site Yönetim Sistemi</span>
        </h1>
        <p style={{ fontSize: '15px', color: '#ebd2dc', margin: '0 0 35px 0', lineHeight: '1.6' }}>
          Mürdüm & Gül Kurusu Tesisleri Profesyonel Yönetim ve Sakin Portalı Platformuna Hoş Geldiniz. Lütfen devam etmek istediğiniz paneli seçin:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          
          {/* SAKİN PORTALI BUTONU */}
          <a
            href="/sakin"
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              padding: '24px',
              borderRadius: '16px',
              textDecoration: 'none',
              boxShadow: '0 8px 20px rgba(5, 150, 105, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid #34d399',
              transition: 'transform 0.2s'
            }}
          >
            <span style={{ fontSize: '32px' }}>🏠</span>
            <span style={{ fontSize: '18px', fontWeight: '800' }}>Sakin Portalı</span>
            <span style={{ fontSize: '12px', color: '#d1fae5', textAlign: 'center' }}>Borç sorgulama, şikayet iletme ve usta rehberi</span>
          </a>

          {/* YÖNETİM PANELİ BUTONU */}
          <a
            href="/yonetim"
            style={{
              backgroundColor: '#381028',
              color: '#ffffff',
              padding: '24px',
              borderRadius: '16px',
              textDecoration: 'none',
              boxShadow: '0 8px 20px rgba(56, 16, 40, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid #d4a5b8',
              transition: 'transform 0.2s'
            }}
          >
            <span style={{ fontSize: '32px' }}>🔐</span>
            <span style={{ fontSize: '18px', fontWeight: '800' }}>Yönetim Paneli</span>
            <span style={{ fontSize: '12px', color: '#ebd2dc', textAlign: 'center' }}>Aidat yansıtma, kasa, ihtar ve daire yönetimi</span>
          </a>

        </div>

        <div style={{ marginTop: '40px', fontSize: '12px', color: '#c4a4b5' }}>
          MCF Yazılım & Tesis Yönetim Çözümleri © 2026
        </div>
      </div>
    </div>
  );
}