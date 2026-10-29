"use client";

import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

interface Unit {
  id: string;
  block: string;
  unitNumber: number;
  residentName: string;
  phone: string;
  debt: number;
  status: "paid" | "unpaid";
}

interface Complaint {
  id: string;
  unitInfo: string;
  title: string;
  description: string;
  status: "pending" | "resolved";
  date: string;
}

export default function SakinPortalPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Giriş State'leri
  const [phoneInput, setPhoneInput] = useState("");
  const [smsCodeInput, setSmsCodeInput] = useState("");
  const [step, setStep] = useState<"phone" | "sms" | "dashboard">("phone");
  const [loggedInUnit, setLoggedInUnit] = useState<Unit | null>(null);

  // Şikayet Formu
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  // Ödeme Bildirim Modalı State'leri
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentNoticeSent, setPaymentNoticeSent] = useState(false);

  const masters = [
    {
      name: "Ahmet Usta",
      service: "Elektrikçi",
      phone: "05321112233",
      icon: "⚡",
      desc: "Sigorta, avize, priz ve genel elektrik arızaları.",
    },
    {
      name: "Mehmet Usta",
      service: "Su Tesisatçısı",
      phone: "05332223344",
      icon: "🚰",
      desc: "Musluk değişimi, tıkanıklık açma, su kaçağı tespiti.",
    },
    {
      name: "Klima Servisi (Serkan)",
      service: "Klimacı",
      phone: "05353334455",
      icon: "❄️",
      desc: "Klima bakım, montaj, gaz dolumu ve arıza onarımı.",
    },
    {
      name: "Temizlik Ekibi (Fatma Hanım)",
      service: "Temizlikçi",
      phone: "05364445566",
      icon: "🧹",
      desc: "Ev temizliği, merdiven ve detaylı iç temizlik hizmeti.",
    },
    {
      name: "Mobilya Montaj (Caner Usta)",
      service: "Mobilyacı",
      phone: "05375556677",
      icon: "🪑",
      desc: "Dolap kurulumu, ray dolap tamiri ve mobilya montajı.",
    },
    {
      name: "Boya & Badana (Ali Usta)",
      service: "Boyacı",
      phone: "05386667788",
      icon: "🎨",
      desc: "İç cephe boyama, alçı sıva ve duvar kağıdı uygulamaları.",
    },
  ];

  useEffect(() => {
    const unsubUnits = onSnapshot(collection(db, "units"), (snapshot) => {
      setUnits(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Unit[],
      );
      setLoading(false);
    });

    const unsubComp = onSnapshot(collection(db, "complaints"), (snapshot) => {
      setComplaints(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Complaint[],
      );
    });

    return () => {
      unsubUnits();
      unsubComp();
    };
  }, []);

  // Telefon Doğrulama
  const handleVerifyPhone = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneInput.replace(/\D/g, "");
    const found = units.find(
      (u) => u.phone && u.phone.replace(/\D/g, "") === cleanPhone,
    );

    if (!found) {
      alert(
        "Bu telefon numarasına ait kayıtlı daire bulunamadı! Lütfen yöneticinizle görüşün.",
      );
      return;
    }

    setLoggedInUnit(found);
    setStep("sms");
  };
  useEffect(() => {
    const savedUnitId = sessionStorage.getItem("mcf_sakin_unit_id");
    if (savedUnitId && units.length > 0) {
      const foundUnit = units.find((u) => u.id === savedUnitId);
      if (foundUnit) {
        setLoggedInUnit(foundUnit);
        setStep("dashboard");
      }
    }
  }, [units]);
  // SMS Kod Doğrulama (1234 sabit test kodu veya otomatik yönlendirme)
  const handleVerifySms = (e: React.FormEvent) => {
    e.preventDefault();
    if (smsCodeInput === "1234" && loggedInUnit) {
      setStep("dashboard");
      sessionStorage.setItem("mcf_sakin_unit_id", loggedInUnit.id); // Sakin oturumunu hafızaya al
    } else {
      alert("Hatalı kod! (Test için 1234 giriniz)");
    }
  };
  // Sayfa yenilendiğinde sakin oturumunu kontrol et

  // Yönetime Ödeme Bildirimi Gönderme
  const handleSendPaymentNotice = async () => {
    if (!loggedInUnit) return;
    const unitLabel =
      loggedInUnit.block === "A"
        ? `A Blok Dükkan ${loggedInUnit.unitNumber}`
        : `${loggedInUnit.block} Blok No: ${loggedInUnit.unitNumber}`;

    try {
      await addDoc(collection(db, "complaints"), {
        unitInfo: unitLabel,
        title: "💳 Ödeme Yapıldı / Dekont Bildirimi",
        description: `${loggedInUnit.residentName} (${unitLabel}) tarafından ${loggedInUnit.debt.toLocaleString("tr-TR")} ₺ tutarındaki aidat borcu için banka ödemesi gerçekleştirildi ve bildirim yapıldı.`,
        status: "pending",
        date: new Date().toLocaleDateString("tr-TR"),
        createdAt: serverTimestamp(),
      });
      setPaymentNoticeSent(true);
      alert(
        "Ödeme bildiriminiz yönetime başarıyla iletildi! Yönetici onayından sonra borcunuz düşürülecektir.",
      );
      setShowPaymentModal(false);
    } catch (err) {
      console.error(err);
      alert("Bildirim gönderilirken bir hata oluştu.");
    }
  };

  const handleAddComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc || !loggedInUnit)
      return alert("Lütfen başlık ve açıklama yazınız.");

    const unitLabel =
      loggedInUnit.block === "A"
        ? `A Blok Dükkan ${loggedInUnit.unitNumber}`
        : `${loggedInUnit.block} Blok No: ${loggedInUnit.unitNumber}`;

    try {
      await addDoc(collection(db, "complaints"), {
        unitInfo: unitLabel,
        title,
        description: desc,
        status: "pending",
        date: new Date().toLocaleDateString("tr-TR"),
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setDesc("");
      alert("Şikayet veya talebiniz yönetime iletildi!");
    } catch (err) {
      console.error(err);
    }
  };

  // --- 1. TELEFON GİRİŞ EKRANI ---
  if (step === "phone") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
          padding: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "40px",
            borderRadius: "20px",
            maxWidth: "420px",
            width: "100%",
            boxShadow: "0 15px 30px rgba(0,0,0,0.2)",
            textAlign: "center",
          }}
        >
          {/* MCF LOGO */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "15px",
            }}
          >
            <img
              src="/mcf-logo.png"
              alt="MCF Logo"
              style={{
                height: "54px",
                width: "auto",
                objectFit: "contain",
                background: "#ecfdf5",
                padding: "8px",
                borderRadius: "10px",
                border: "1px solid #10b981",
              }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>

          <h2
            style={{
              color: "#064e3b",
              fontSize: "22px",
              fontWeight: "800",
              margin: "0 0 8px 0",
            }}
          >
            Sakin Giriş Portalı
          </h2>
          <p
            style={{ color: "#4b5563", fontSize: "13px", margin: "0 0 24px 0" }}
          >
            Sisteme kayıtlı telefon numaranızı girerek giriş yapın.
          </p>

          <form
            onSubmit={handleVerifyPhone}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <input
              type="text"
              placeholder="Örn: 0532 000 00 00"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              style={{
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                fontSize: "16px",
                outline: "none",
                textAlign: "center",
                fontWeight: "bold",
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: "#059669",
                color: "#fff",
                border: "none",
                padding: "14px",
                borderRadius: "10px",
                fontWeight: "800",
                cursor: "pointer",
                fontSize: "15px",
              }}
            >
              Devam Et / Kod Gönder
            </button>
            <a
              href="/"
              style={{
                fontSize: "13px",
                color: "#6b7280",
                textDecoration: "none",
                marginTop: "10px",
              }}
            >
              ← Ana Sayfaya Dön
            </a>
          </form>
        </div>
      </div>
    );
  }

  // --- 2. SMS / DOĞRULAMA EKRANI ---
  if (step === "sms") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
          padding: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "40px",
            borderRadius: "20px",
            maxWidth: "420px",
            width: "100%",
            boxShadow: "0 15px 30px rgba(0,0,0,0.2)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "15px",
            }}
          >
            <img
              src="/mcf-logo.png"
              alt="MCF Logo"
              style={{
                height: "54px",
                width: "auto",
                objectFit: "contain",
                background: "#ecfdf5",
                padding: "8px",
                borderRadius: "10px",
                border: "1px solid #10b981",
              }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>

          <h2
            style={{
              color: "#064e3b",
              fontSize: "22px",
              fontWeight: "800",
              margin: "0 0 8px 0",
            }}
          >
            Güvenlik Doğrulaması
          </h2>
          <p
            style={{ color: "#4b5563", fontSize: "13px", margin: "0 0 20px 0" }}
          >
            Operatör gecikmelerini önlemek ve test kolaylığı için doğrulama
            kodunuz:
            <br />
            <strong
              style={{
                color: "#059669",
                fontSize: "16px",
                background: "#dcfce7",
                padding: "4px 10px",
                borderRadius: "6px",
                display: "inline-block",
                marginTop: "6px",
              }}
            >
              1234
            </strong>
          </p>

          <form
            onSubmit={handleVerifySms}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <input
              type="text"
              maxLength={4}
              placeholder="1 2 3 4"
              value={smsCodeInput}
              onChange={(e) => setSmsCodeInput(e.target.value)}
              style={{
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                fontSize: "22px",
                outline: "none",
                textAlign: "center",
                letterSpacing: "8px",
                fontWeight: "bold",
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: "#059669",
                color: "#fff",
                border: "none",
                padding: "14px",
                borderRadius: "10px",
                fontWeight: "800",
                cursor: "pointer",
                fontSize: "15px",
              }}
            >
              Doğrula ve Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => setStep("phone")}
              style={{
                background: "none",
                border: "none",
                color: "#6b7280",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              ← Telefon Numarasını Değiştir
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- 3. SAKİN PORTALI ANA EKRANI ---
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#ecfdf5",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#065f46",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
          color: "#fff",
          padding: "18px 24px",
          boxShadow: "0 4px 20px rgba(5, 150, 105, 0.2)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <img
              src="/mcf-logo.png"
              alt="MCF Logo"
              style={{
                height: "46px",
                width: "auto",
                objectFit: "contain",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.15)",
                padding: "6px",
                border: "1px solid #34d399",
              }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: "800", margin: 0 }}>
                MCF <span style={{ color: "#d1fae5" }}>Site Sakin Portalı</span>
              </h1>
              <p
                style={{ fontSize: "12px", margin: "2px 0 0 0", opacity: 0.9 }}
              >
                Hoş geldiniz, {loggedInUnit?.residentName}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sessionStorage.removeItem("mcf_sakin_unit_id");
              setLoggedInUnit(null);
              setStep("phone");
            }}
            style={{
              backgroundColor: "#ffffff",
              color: "#047857",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "bold",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Çıkış Yap
          </button>
        </div>
      </header>

      <main
        style={{ maxWidth: "1200px", margin: "24px auto", padding: "0 20px" }}
      >
        {/* DAİRE BİLGİSİ VE BORCUMU ÖDE BUTONU */}
        {loggedInUnit && (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
              border: "1px solid #a7f3d0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#166534",
                  fontWeight: "700",
                }}
              >
                Kayıtlı Biriminiz
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "800",
                  color: "#14532d",
                  marginTop: "4px",
                }}
              >
                {loggedInUnit.block} Blok - No: {loggedInUnit.unitNumber} (
                {loggedInUnit.residentName})
              </div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color:
                    loggedInUnit.status === "unpaid" ? "#dc2626" : "#059669",
                }}
              >
                {loggedInUnit.status === "unpaid"
                  ? `⚠️ Güncel Borç: ${loggedInUnit.debt.toLocaleString("tr-TR")} ₺`
                  : "✅ Borcunuz Bulunmuyor"}
              </div>
            </div>

            {/* BORCUMU ÖDE / BİLDİR BUTONU */}
            {loggedInUnit.status === "unpaid" && (
              <button
                onClick={() => setShowPaymentModal(true)}
                style={{
                  backgroundColor: "#059669",
                  color: "#ffffff",
                  border: "none",
                  padding: "14px 24px",
                  borderRadius: "12px",
                  fontWeight: "800",
                  fontSize: "15px",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                💳 Borcumu Öde / Dekont Bildir
              </button>
            )}
          </div>
        )}

        {/* ŞİKAYET VE TALEP */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid #a7f3d0",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "16px",
                color: "#064e3b",
                fontWeight: "800",
              }}
            >
              ✍️ Yönetime Şikayet / Talep İlet
            </h3>
            <form
              onSubmit={handleAddComplaint}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <input
                type="text"
                placeholder="Konu (Örn: Aydınlatma Arızası)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                }}
              />
              <textarea
                placeholder="Şikayet veya talebinizi detaylı yazınız..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: "#059669",
                  color: "#fff",
                  border: "none",
                  padding: "12px",
                  borderRadius: "10px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Gönder
              </button>
            </form>
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid #a7f3d0",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "16px",
                color: "#064e3b",
                fontWeight: "800",
              }}
            >
              📢 İlettiğiniz Talepler
            </h3>
            {complaints.length === 0 ? (
              <p style={{ color: "#6b7280", fontSize: "13px" }}>
                Henüz kayıtlı talep yok.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  maxHeight: "250px",
                  overflowY: "auto",
                }}
              >
                {complaints.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      backgroundColor: "#f9fafb",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: "#4b5563",
                      }}
                    >
                      <span>{c.unitInfo}</span>
                      <span
                        style={{
                          color:
                            c.status === "resolved" ? "#059669" : "#d97706",
                        }}
                      >
                        {c.status === "resolved"
                          ? "✅ Çözüldü"
                          : "⏳ İnceleniyor"}
                      </span>
                    </div>
                    <div
                      style={{
                        fontWeight: "700",
                        fontSize: "14px",
                        color: "#1f2937",
                        margin: "4px 0",
                      }}
                    >
                      {c.title}
                    </div>
                    <div style={{ fontSize: "13px", color: "#4b5563" }}>
                      {c.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* USTA REHBERİ */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid #a7f3d0",
            marginBottom: "40px",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "#064e3b",
              margin: "0 0 6px 0",
            }}
          >
            🛠️ Site Anlaşmalı Usta Rehberi
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
              marginTop: "16px",
            }}
          >
            {masters.map((m, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "14px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "24px",
                        background: "#dcfce7",
                        padding: "8px",
                        borderRadius: "10px",
                      }}
                    >
                      {m.icon}
                    </span>
                    <div>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: "800",
                          color: "#14532d",
                        }}
                      >
                        {m.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#059669",
                          background: "#d1fae5",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          display: "inline-block",
                          marginTop: "2px",
                        }}
                      >
                        {m.service}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: "13px", color: "#4b5563", margin: 0 }}>
                    {m.desc}
                  </p>
                </div>
                <div
                  style={{
                    borderTop: "1px solid #bbf7d0",
                    paddingTop: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      color: "#166534",
                    }}
                  >
                    📞 {m.phone}
                  </span>
                  <button
                    onClick={() =>
                      window.open(
                        `https://wa.me/${m.phone.replace(/\D/g, "")}?text=Merhaba%20${m.name},%20site%20sakiniyim.`,
                        "_blank",
                      )
                    }
                    style={{
                      backgroundColor: "#22c55e",
                      color: "#fff",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    💬 WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ÖDEME / DEKONT BİLDİRİM MODALI */}
      {showPaymentModal && loggedInUnit && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "30px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{
                margin: "0 0 10px 0",
                fontSize: "20px",
                color: "#064e3b",
                fontWeight: "800",
              }}
            >
              💳 Borç Ödeme ve Havale Bilgileri
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#4b5563",
                margin: "0 0 20px 0",
                lineHeight: "1.5",
              }}
            >
              Aşağıdaki site banka hesabımıza ödemenizi yaptıktan sonra{" "}
              <strong>"Ödemeyi Yaptım / Bildir"</strong> butonuna
              basabilirsiniz. Yönetici kontrol edip onaylayacaktır.
            </p>

            <div
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
                fontSize: "14px",
                color: "#14532d",
                lineHeight: "1.6",
              }}
            >
              <div>
                <strong>Banka:</strong> Ziraat Bankası - MCF Tesis Yönetimi
              </div>
              <div>
                <strong>IBAN:</strong> TR12 0001 0000 5555 1234 5678 90
              </div>
              <div>
                <strong>Ödenecek Tutar:</strong>{" "}
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#059669",
                  }}
                >
                  {loggedInUnit.debt.toLocaleString("tr-TR")} ₺
                </span>
              </div>
              <div
                style={{ marginTop: "6px", fontSize: "12px", color: "#166534" }}
              >
                <strong>Açıklama:</strong> {loggedInUnit.block} Blok No:{" "}
                {loggedInUnit.unitNumber} Aidat Ödemesi
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSendPaymentNotice}
                style={{
                  flex: 2,
                  backgroundColor: "#059669",
                  color: "#ffffff",
                  border: "none",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                ✅ Ödemeyi Yaptım / Yönetime Bildir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
