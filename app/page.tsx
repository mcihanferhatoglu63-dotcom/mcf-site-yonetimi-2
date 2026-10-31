"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";

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
  const [selectedSite, setSelectedSite] = useState("");

  // Süper Admin Modalı için State'ler
  const [showSuperModal, setShowSuperModal] = useState(false);
  const [superPassword, setSuperPassword] = useState("");

  // Paketler & IBAN Modalı
  const [showPackagesModal, setShowPackagesModal] = useState(false);

  // Firestore'dan kayıtlı siteleri anlık çek
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tenants"), (snapshot) => {
      const fetchedTenants = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tenant[];
      setTenants(fetchedTenants);
      setLoadingTenants(false);
    });

    return () => unsubscribe();
  }, []);

  // Listeden bir siteye tıklandığında
  const handleSiteClick = (tenant: Tenant) => {
    setSelectedSite(tenant.siteName);
    setShowPortalModal(true);
  };

  // Yönetim Paneline Yönlendir
  const goToManagement = () => {
    router.push(`/yonetim?site=${encodeURIComponent(selectedSite)}`);
  };

  // Sakin Portalına Yönlendir
  const goToResident = () => {
    router.push(`/sakin?site=${encodeURIComponent(selectedSite)}`);
  };

  // Süper Admin Giriş Doğrulama
  const handleSuperLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (superPassword === "1923") {
      sessionStorage.setItem("mcf_super_logged", "true");
      router.push("/superadmin");
    } else {
      alert("Hatalı Süper Admin Şifresi!");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0b0f19",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, system-ui, sans-serif",
        position: "relative",
        padding: "20px",
        color: "#ffffff",
      }}
    >
      {/* SAĞ ÜST KÖŞE BUTONLARI */}
      <div
        style={{
          position: "absolute",
          top: "24px",
          right: "24px",
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          onClick={() => setShowPackagesModal(true)}
          style={{
            backgroundColor: "#10b981",
            color: "#ffffff",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
          }}
        >
          💎 Paketler & IBAN
        </button>

        <button
          onClick={() => setShowSuperModal(true)}
          style={{
            backgroundColor: "#0284c7",
            color: "#ffffff",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
          }}
        >
          Süper Admin Paneli
        </button>
      </div>

      {/* Ana Ekran Logo Entegrasyonu */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <img
          src="/mcf-logo.png"
          alt="MCF Technology & Software Solutions"
          style={{
            maxWidth: "280px",
            width: "100%",
            height: "auto",
            filter: "drop-shadow(0 8px 24px rgba(245, 158, 11, 0.25))",
            borderRadius: "12px",
          }}
        />
      </div>

      {/* ANA BAŞLIK */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "800",
            color: "#f59e0b",
            margin: "0 0 8px 0",
            letterSpacing: "-0.5px",
          }}
        >
          MCF Teknoloji & Site Yönetim Sistemi
        </h1>
        <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
          Lütfen giriş yapmak istediğiniz siteyi seçiniz
        </p>
      </div>

      {/* KAYITLI SİTELER LİSTESİ (KUTU) */}
      <div
        style={{
          backgroundColor: "#111827",
          border: "1px solid #1f2937",
          borderRadius: "16px",
          padding: "28px",
          width: "100%",
          maxWidth: "440px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
          textAlign: "center",
          maxHeight: "320px",
          overflowY: "auto",
        }}
      >
        <h3
          style={{
            fontSize: "14px",
            color: "#94a3b8",
            margin: "0 0 16px 0",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          🏢 Kayıtlı Siteler / İşletmeler
        </h3>

        {loadingTenants ? (
          <p style={{ color: "#94a3b8", fontSize: "14px", padding: "20px 0" }}>
            Siteler yükleniyor...
          </p>
        ) : tenants.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "14px", padding: "20px 0" }}>
            Henüz kayıtlı site bulunmuyor.
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {tenants.map((tenant) => {
              const isDemo = tenant.siteName === "Demo-Site";
              return (
                <button
                  key={tenant.id}
                  onClick={() => handleSiteClick(tenant)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    backgroundColor: isDemo
                      ? "rgba(16, 185, 129, 0.15)"
                      : "#0b0f19",
                    border: isDemo ? "1px solid #10b981" : "1px solid #374151",
                    borderRadius: "10px",
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <span>
                    {isDemo ? "✨" : "🏢"} {tenant.siteName}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: isDemo ? "#10b981" : "#f59e0b",
                      background: "#1f2937",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      textTransform: "uppercase",
                    }}
                  >
                    {tenant.packageType || "Pro"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 🌟 ABONELİK PAKETLERİ & IBAN MODALI */}
      {showPackagesModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#111827",
              border: "1px solid #1f2937",
              borderRadius: "20px",
              padding: "30px",
              maxWidth: "750px",
              width: "100%",
              boxShadow: "0 25px 50px rgba(0,0,0,0.8)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Üst Başlık ve Kapatma Butonu */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
                borderBottom: "1px solid #1f2937",
                paddingBottom: "14px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "20px",
                    color: "#f59e0b",
                    fontWeight: "800",
                  }}
                >
                  Abonelik Paketleri & Banka Bilgileri
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#94a3b8",
                  }}
                >
                  Paket detayları, modül limitleri ve IBAN bilgileri aşağıdadır.
                </p>
              </div>
              <button
                onClick={() => setShowPackagesModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "20px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* 3'LÜ KART YERLEŞİMİ (TRIAL - BASIC - PRO) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              {/* 1. Trial Sürüm */}
              <div
                style={{
                  backgroundColor: "#0b0f19",
                  border: "1px solid #374151",
                  borderRadius: "14px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "16px",
                      color: "#fff",
                      fontWeight: "800",
                    }}
                  >
                    Trial Sürüm
                  </h3>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#94a3b8",
                      fontWeight: "700",
                    }}
                  >
                    Deneme Paketi
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "13px",
                    color: "#cbd5e1",
                    borderTop: "1px solid #1f2937",
                    paddingTop: "12px",
                  }}
                >
                  <span>✓ Bloklar</span>
                  <span>✓ Rehber</span>
                  <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                    ✕ Site Düzenlemesi Yok
                  </span>
                  <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                    ✕ Online Bildirim Kapalı
                  </span>
                </div>
              </div>

              {/* 2. Basic Paket */}
              <div
                style={{
                  backgroundColor: "#0b0f19",
                  border: "1px solid #b45309",
                  borderRadius: "14px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "16px",
                      color: "#fff",
                      fontWeight: "800",
                    }}
                  >
                    Basic Paket
                  </h3>
                  <span
                    style={{
                      fontSize: "16px",
                      color: "#f59e0b",
                      fontWeight: "800",
                    }}
                  >
                    1.000~TL / ay
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "13px",
                    color: "#cbd5e1",
                    borderTop: "1px solid #1f2937",
                    paddingTop: "12px",
                  }}
                >
                  <span>✓ Bloklar</span>
                  <span>✓ Rehber</span>
                  <span>✓ Site Düzenlemesi</span>
                  <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                    ✕ Online Bildirim Kapalı
                  </span>
                </div>
              </div>

              {/* 3. Pro Paket (Vurgulu Çerçeve) */}
              <div
                style={{
                  backgroundColor: "#0b0f19",
                  border: "1px solid #f59e0b",
                  borderRadius: "14px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  boxShadow: "0 4px 20px rgba(245, 158, 11, 0.15)",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "16px",
                      color: "#f59e0b",
                      fontWeight: "800",
                    }}
                  >
                    Pro Paket
                  </h3>
                  <span
                    style={{
                      fontSize: "16px",
                      color: "#f59e0b",
                      fontWeight: "800",
                    }}
                  >
                    2.000~TL / ay
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "13px",
                    color: "#cbd5e1",
                    borderTop: "1px solid #1f2937",
                    paddingTop: "12px",
                  }}
                >
                  <span>✓ Bloklar</span>
                  <span>✓ Rehber</span>
                  <span>✓ Site Düzenlemesi</span>
                  <span>✓ Kasa Hesaplama</span>
                  <span>✓ Raporlar</span>
                  <span style={{ color: "#10b981", fontWeight: "bold" }}>
                    ✅ Hepsi Açık (Online Bildirim Dahil)
                  </span>
                </div>
              </div>
            </div>

            {/* BANKA HESAP (IBAN) BİLGİLERİ KUTUSU */}
            <div
              style={{
                backgroundColor: "#0b0f19",
                border: "1px solid #1f2937",
                borderRadius: "14px",
                padding: "20px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  color: "#f59e0b",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                BANKA HESAP (IBAN) BİLGİLERİ
              </span>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#ffffff",
                  letterSpacing: "1px",
                  marginBottom: "6px",
                }}
              >
                TR11 0004 904482759750 06
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                  fontWeight: "600",
                }}
              >
                Alıcı: Mehmet Cihan Ferhatoğlu
              </div>
            </div>

            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                onClick={() => setShowPackagesModal(false)}
                style={{
                  backgroundColor: "#374151",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PORTAL SEÇİM MODALI */}
      {showPortalModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#111827",
              border: "1px solid #374151",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "400px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                margin: "0 0 6px 0",
                fontSize: "20px",
                color: "#f59e0b",
                fontWeight: "800",
              }}
            >
              {selectedSite}
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#94a3b8",
                margin: "0 0 24px 0",
              }}
            >
              Lütfen bağlanmak istediğiniz portali seçiniz.
            </p>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <button
                onClick={goToManagement}
                style={{
                  backgroundColor: "#f59e0b",
                  color: "#111827",
                  border: "none",
                  padding: "14px",
                  borderRadius: "10px",
                  fontWeight: "800",
                  fontSize: "15px",
                  cursor: "pointer",
                }}
              >
                🏢 Yönetim Girişi
              </button>
              <button
                onClick={goToResident}
                style={{
                  backgroundColor: "#0284c7",
                  color: "#ffffff",
                  border: "none",
                  padding: "14px",
                  borderRadius: "10px",
                  fontWeight: "800",
                  fontSize: "15px",
                  cursor: "pointer",
                }}
              >
                🏠 Sakin Girişi (Şifresiz)
              </button>
              <button
                onClick={() => setShowPortalModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "13px",
                  cursor: "pointer",
                  marginTop: "8px",
                }}
              >
                İptal / Geri Dön
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SÜPER ADMIN ŞİFRE MODALI */}
      {showSuperModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#111827",
              border: "1px solid #374151",
              borderRadius: "16px",
              padding: "30px",
              maxWidth: "380px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "18px",
                color: "#f59e0b",
                fontWeight: "800",
              }}
            >
              MCF Teknoloji Süper Admin
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                margin: "0 0 20px 0",
              }}
            >
              Yönetici şifrenizi giriniz.
            </p>

            <form
              onSubmit={handleSuperLogin}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <input
                type="password"
                placeholder="Şifrenizi giriniz..."
                value={superPassword}
                onChange={(e) => setSuperPassword(e.target.value)}
                style={{
                  padding: "12px",
                  backgroundColor: "#0b0f19",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "15px",
                  textAlign: "center",
                  outline: "none",
                  fontWeight: "bold",
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: "#0284c7",
                  color: "#fff",
                  border: "none",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Sisteme Bağlan
              </button>
              <button
                type="button"
                onClick={() => setShowSuperModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "13px",
                  cursor: "pointer",
                  marginTop: "4px",
                }}
              >
                İptal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}