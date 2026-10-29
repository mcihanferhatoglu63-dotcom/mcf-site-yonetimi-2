'use client';




import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, writeBatch, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';




interface Unit {
  id: string; // Örn: B_12
  block: string;
  unitNumber: number;
  residentName: string;
  phone: string;
  isTenant: boolean; // true: Kiracı, false: Mülk Sahibi / Ev Sahibi
  landlordName: string;
  debt: number;
  status: 'paid' | 'unpaid';
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  category: string;
  date: string;
}

export default function SiteLayout() {
// Yönetici Giriş State'i
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  // Eğer yönetici giriş yapmadıysa kilit ekranını göster
  if (!isAdminLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #4a1535 0%, #6b2d5c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '20px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 15px 30px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔐</div>
          <h2 style={{ color: '#4a1535', fontSize: '20px', fontWeight: '800', margin: '0 0 10px 0' }}>Yönetici Paneli Girişi</h2>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 20px 0' }}>Lütfen devam etmek için yönetici şifrenizi giriniz.</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (adminPassword === '1453') { // Buradaki şifreyi dilediğin gibi değiştirebilirsin abicim
              setIsAdminLoggedIn(true);
            } else {
              alert('Hatalı şifre! (İpucu: 1453)');
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="password"
              placeholder="Yönetici Şifresi"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #d8b8c5', fontSize: '16px', outline: 'none', textAlign: 'center' }}
            />
            <button type="submit" style={{ backgroundColor: '#6b2d5c', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>
              Giriş Yap
            </button>
            <a href="/" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', marginTop: '5px' }}>← Ana Sayfaya Dön</a>
          </form>
        </div>
      </div>
    );
  }


  const [activeTab, setActiveTab] = useState<'units' | 'directory' | 'accounting' | 'reports'>('units');
  const [selectedBlock, setSelectedBlock] = useState('A');
  const [dueAmount, setDueAmount] = useState('2000');
  const [units, setUnits] = useState<Unit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Son Yansıtılan Aidat Tutarı (Geri alma işlemi için)
  const [lastAppliedDue, setLastAppliedDue] = useState<number | null>(null);

  // Düzenleme Modalı
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Resmi Uyarı Modalı State'leri
  const [warningModalUnit, setWarningModalUnit] = useState<Unit | null>(null);

  // Kasa Formu
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Aidat Tahsilatı');

  // Firestore Verilerini Çekme
  useEffect(() => {
    const unsubscribeUnits = onSnapshot(collection(db, 'units'), async (snapshot) => {
      let fetchedUnits: Unit[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Unit[];

      if (fetchedUnits.length === 0) {
        const batch = writeBatch(db);
        
        // A Blok (8 Dükkan)
        for (let i = 1; i <= 8; i++) {
          const docRef = doc(db, 'units', `A_${i}`);
          batch.set(docRef, {
            block: 'A',
            unitNumber: i,
            residentName: `Dükkan İşletmecisi ${i}`,
            phone: '0532000000' + (i < 10 ? '0' + i : i),
            isTenant: false,
            landlordName: '',
            debt: 0,
            status: 'paid'
          });
        }

        // B Blok (28 Daire)
        for (let i = 1; i <= 28; i++) {
          const docRef = doc(db, 'units', `B_${i}`);
          batch.set(docRef, {
            block: 'B',
            unitNumber: i,
            residentName: `B Blok Sakin ${i}`,
            phone: '053311100' + (i < 10 ? '0' + i : i),
            isTenant: false,
            landlordName: '',
            debt: 0,
            status: 'paid'
          });
        }

        // C Blok (28 Daire)
        for (let i = 1; i <= 28; i++) {
          const docRef = doc(db, 'units', `C_${i}`);
          batch.set(docRef, {
            block: 'C',
            unitNumber: i,
            residentName: `C Blok Sakin ${i}`,
            phone: '053522200' + (i < 10 ? '0' + i : i),
            isTenant: false,
            landlordName: '',
            debt: 0,
            status: 'paid'
          });
        }

        await batch.commit();
      } else {
        setUnits(fetchedUnits);
        setLoading(false);
      }
    });

    const unsubscribeTx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const fetchedTx: Transaction[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(fetchedTx);
    });

    return () => {
      unsubscribeUnits();
      unsubscribeTx();
    };
  }, []);

  // RAKAMSAL SIRALAMA (1, 2, 3 ... 28)
  const filteredUnits = units
    .filter(u => u.block === selectedBlock)
    .sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber));

  const sortedAllUnits = [...units].sort((a, b) => {
    if (a.block === b.block) {
      return Number(a.unitNumber) - Number(b.unitNumber);
    }
    return a.block.localeCompare(b.block);
  });

  const totalDebtors = units.filter(u => u.status === 'unpaid').length;
  const totalReceivables = units.reduce((sum, u) => sum + (u.debt || 0), 0);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;

  // Ödeme Durumu Değiştir
  const togglePaymentStatus = async (unit: Unit) => {
    try {
      const unitRef = doc(db, 'units', unit.id);
      if (unit.status === 'paid') {
        await updateDoc(unitRef, { status: 'unpaid', debt: Number(dueAmount) || 2000 });
      } else {
        await updateDoc(unitRef, { status: 'paid', debt: 0 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toplu Aidat Yansıt
  const handleBulkApplyDue = async () => {
    const amount = Number(dueAmount);
    if (!amount || amount <= 0) return alert('Geçerli bir aidat tutarı giriniz.');
    if (!confirm(`${amount} ₺ aidat tüm bloklardaki birimlere yansıtılsın mı?`)) return;

    try {
      const batch = writeBatch(db);
      units.forEach((unit) => {
        const unitRef = doc(db, 'units', unit.id);
        batch.update(unitRef, { debt: (unit.debt || 0) + amount, status: 'unpaid' });
      });
      await batch.commit();
      setLastAppliedDue(amount);
      alert('Aidatlar başarıyla yansıtıldı!');
    } catch (err) {
      console.error(err);
      alert('Aidat yansıtılırken bir hata oluştu.');
    }
  };

  // Son İşlemi Geri Al (Undo)
  const handleUndoLastBulkDue = async () => {
    if (!lastAppliedDue) return;
    if (!confirm(`Son yansıtılan ${lastAppliedDue} ₺ aidat işlemi tüm birimlerden geri alınsın mı?`)) return;

    try {
      const batch = writeBatch(db);
      units.forEach((unit) => {
        const unitRef = doc(db, 'units', unit.id);
        const newDebt = Math.max(0, (unit.debt || 0) - lastAppliedDue);
        batch.update(unitRef, { 
          debt: newDebt, 
          status: newDebt === 0 ? 'paid' : 'unpaid' 
        });
      });
      await batch.commit();
      setLastAppliedDue(null);
      alert('Son toplu aidat yansıtma işlemi başarıyla geri alındı!');
    } catch (err) {
      console.error(err);
      alert('Geri alma işlemi sırasında hata oluştu.');
    }
  };

  // Sakin Bilgilerini Kaydet
  const handleSaveUnitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;

    try {
      const unitRef = doc(db, 'units', editingUnit.id);
      await updateDoc(unitRef, {
        residentName: editingUnit.residentName,
        phone: editingUnit.phone || '',
        isTenant: editingUnit.isTenant,
        landlordName: editingUnit.isTenant ? editingUnit.landlordName : ''
      });
      setEditingUnit(null);
      alert('Sakin bilgileri güncellendi!');
    } catch (err) {
      console.error(err);
      alert('Hata oluştu.');
    }
  };

  // WhatsApp Mesajı Gönderme (Genel)
  const openWhatsApp = (phone: string, name: string, debt: number) => {
    if (!phone) {
      alert('Bu sakine ait telefon numarası kayıtlı değil.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Sayın ${name}, MCF Site Yönetim Sistemi'nden bilgilendirme: Güncel borç/aidat tutarınız ${debt.toLocaleString('tr-TR')} ₺'dir. Bilgilerinize sunarız.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  // Resmi Borç Uyarı Metni Oluşturucu
  const getOfficialWarningText = (unit: Unit) => {
    const unitTitle = unit.block === 'A' ? `A Blok Dükkan ${unit.unitNumber}` : `${unit.block} Blok No: ${unit.unitNumber}`;
    return `Sayın ${unit.residentName || 'Sakin'}, (${unitTitle})
Bu ay itibariyle toplam ${unit.debt.toLocaleString('tr-TR')} ₺ aidat/borç bakiyeniz bulunmaktadır. 
Ödememeniz halinde Kat Mülkiyeti Kanunu (KMK) 20. ve 34. maddeleri gereğince yasal icra takibi ve hukuki işlemler başlatılacaktır. 
Bilgilerinize sunar, ödemenizi derhal gerçekleştirmenizi rica ederiz.
Site Yönetimi`;
  };

  // WhatsApp ile Resmi Uyarı Gönder
  const sendOfficialWhatsAppWarning = (unit: Unit) => {
    if (!unit.phone) {
      alert('Bu sakine ait telefon numarası kayıtlı değil.');
      return;
    }
    const cleanPhone = unit.phone.replace(/\D/g, '');
    const message = encodeURIComponent(getOfficialWarningText(unit));
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  // Resmi Uyarıyı Yazdır (Print)
  const printOfficialWarning = (unit: Unit) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Resmi Borç Bildirimi - ${unit.block} Blok No: ${unit.unitNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #000; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .content { font-size: 16px; line-height: 1.8; white-space: pre-wrap; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>MCF SİTE YÖNETİMİ</h2>
            <p>RESMİ BORÇ VE YASAL İHTAR BİLDİRİMİ</p>
          </div>
          <div class="content">${getOfficialWarningText(unit)}</div>
          <div class="footer">
            <div>Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
            <div>İmza / Kaşe</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // EXCEL RAPORUNU GENİŞ VE DÜZENLİ HTML TABLO OLARAK İNDİRME (.XLS FORMATI)
  // Bu yöntem Excel'de sütunların sıkışmasını engeller ve tam oturmasını sağlar.
  const exportUnitsToExcel = () => {
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th { background-color: #6b2d5c; color: #ffffff; font-weight: bold; text-align: center; padding: 12px; border: 1px solid #4a1535; font-size: 14px; }
          td { padding: 10px 14px; border: 1px solid #d8b8c5; text-align: left; font-size: 13px; vertical-align: middle; }
          .center { text-align: center; }
          .right { text-align: right; }
          .paid { color: #059669; font-weight: bold; background-color: #d1fae5; text-align: center; }
          .unpaid { color: #dc2626; font-weight: bold; background-color: #fee2e2; text-align: center; }
          .title { font-size: 18px; font-weight: bold; color: #4a1535; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="title">MCF Site Yönetimi - Bina Sakinleri ve Ödeme Durum Raporu</div>
        <table>
          <thead>
            <tr>
              <th style="width: 80px;">Blok</th>
              <th style="width: 100px;">Daire / No</th>
              <th style="width: 200px;">Sakin / İşletmeci Adı</th>
              <th style="width: 140px;">Telefon Numarası</th>
              <th style="width: 180px;">Mülkiyet Durumu</th>
              <th style="width: 200px;">Mülk / Ev Sahibi</th>
              <th style="width: 130px;">Borç / Bakiye (₺)</th>
              <th style="width: 130px;">Ödeme Durumu</th>
            </tr>
          </thead>
          <tbody>
    `;

    sortedAllUnits.forEach(u => {
      const ownerLabel = getOwnerLabel(u.block);
      const statusText = u.status === 'paid' ? 'Ödendi' : 'Borçlu';
      const statusClass = u.status === 'paid' ? 'paid' : 'unpaid';
      const tenantText = u.isTenant ? `Kiracı (${ownerLabel}: ${u.landlordName || '-'})` : ownerLabel;
      const landlordVal = u.isTenant ? (u.landlordName || '-') : (u.residentName || '-');

      htmlContent += `
        <tr>
          <td class="center"><b>${u.block} Blok</b></td>
          <td class="center">${u.unitNumber}</td>
          <td><b>${u.residentName || '-'}</b></td>
          <td class="center">${u.phone || '-'}</td>
          <td>${tenantText}</td>
          <td>${landlordVal}</td>
          <td class="right">${u.debt ? u.debt.toLocaleString('tr-TR') + ' ₺' : '0 ₺'}</td>
          <td class="${statusClass}">${statusText}</td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MCF_Site_Sakinleri_Raporu_${new Date().toLocaleDateString('tr-TR')}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Kasa Raporunu Geniş Tablo Olarak İndirme
  const exportTransactionsToExcel = () => {
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th { background-color: #6b2d5c; color: #ffffff; font-weight: bold; text-align: center; padding: 12px; border: 1px solid #4a1535; font-size: 14px; }
          td { padding: 10px 14px; border: 1px solid #d8b8c5; text-align: left; font-size: 13px; vertical-align: middle; }
          .center { text-align: center; }
          .right { text-align: right; }
          .income { color: #059669; font-weight: bold; }
          .expense { color: #dc2626; font-weight: bold; }
          .title { font-size: 18px; font-weight: bold; color: #4a1535; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="title">MCF Site Yönetimi - Kasa Gelir / Gider Raporu</div>
        <table>
          <thead>
            <tr>
              <th style="width: 120px;">Tarih</th>
              <th style="width: 130px;">İşlem Türü</th>
              <th style="width: 180px;">Kategori</th>
              <th style="width: 300px;">Açıklama / Başlık</th>
              <th style="width: 150px;">Tutar (₺)</th>
            </tr>
          </thead>
          <tbody>
    `;

    transactions.forEach(t => {
      const typeText = t.type === 'income' ? 'Gelir' : 'Gider';
      const typeClass = t.type === 'income' ? 'income' : 'expense';

      htmlContent += `
        <tr>
          <td class="center">${t.date || 'Bugün'}</td>
          <td class="center ${typeClass}">${typeText}</td>
          <td>${t.category}</td>
          <td><b>${t.title}</b></td>
          <td class="right ${typeClass}">${t.type === 'income' ? '+' : '-'}${Number(t.amount).toLocaleString('tr-TR')} ₺</td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MCF_Kasa_Raporu_${new Date().toLocaleDateString('tr-TR')}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Kasa İşlemi Ekle
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle || !txAmount) return alert('Lütfen açıklama ve tutar giriniz.');
    try {
      await addDoc(collection(db, 'transactions'), {
        type: txType,
        title: txTitle,
        amount: Number(txAmount),
        category: txCategory,
        date: new Date().toLocaleDateString('tr-TR'),
        createdAt: serverTimestamp()
      });
      setTxTitle('');
      setTxAmount('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (err) {
      console.error(err);
    }
  };

  const getOwnerLabel = (block: string) => {
    return block === 'A' ? 'Mülk Sahibi' : 'Ev Sahibi';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fcf8fa', fontFamily: 'Inter, system-ui, sans-serif', color: '#4a2833' }}>
      
      {/* HEADER */}
      <header style={{
        background: 'linear-gradient(135deg, #6b2d5c 0%, #4a1535 100%)',
        color: '#ffffff',
        padding: '18px 24px',
        boxShadow: '0 4px 20px rgba(74, 21, 53, 0.25)',
        borderBottom: '3px solid #d4a5b8'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img 
              src="/mcf-logo.png" 
              alt="MCF Logo" 
              style={{ height: '46px', width: 'auto', objectFit: 'contain', borderRadius: '8px', background: 'rgba(212, 165, 184, 0.2)', padding: '6px', border: '1px solid #d4a5b8' }} 
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                MCF <span style={{ color: '#f3d1df' }}>Site Yönetim Sistemi</span>
              </h1>
              <p style={{ fontSize: '12px', color: '#e8c5d3', margin: '2px 0 0 0', fontWeight: '500' }}>Mürdüm & Gül Kurusu Tesis Yönetimi</p>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: '6px', background: '#381028', padding: '5px', borderRadius: '12px', border: '1px solid #5c2345', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('units')}
              style={{
                padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                backgroundColor: activeTab === 'units' ? '#d4a5b8' : 'transparent',
                color: activeTab === 'units' ? '#381028' : '#f3d1df'
              }}
            >
              🏢 Blok ve Daireler
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              style={{
                padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                backgroundColor: activeTab === 'directory' ? '#d4a5b8' : 'transparent',
                color: activeTab === 'directory' ? '#381028' : '#f3d1df'
              }}
            >
              📖 Sakinler Rehberi
            </button>
            <button
              onClick={() => setActiveTab('accounting')}
              style={{
                padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                backgroundColor: activeTab === 'accounting' ? '#d4a5b8' : 'transparent',
                color: activeTab === 'accounting' ? '#381028' : '#f3d1df'
              }}
            >
              💰 Kasa
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              style={{
                padding: '10px 14px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                backgroundColor: activeTab === 'reports' ? '#d4a5b8' : 'transparent',
                color: activeTab === 'reports' ? '#381028' : '#f3d1df'
              }}
            >
              📊 Raporlar
            </button>
          </nav>
        </div>
      </header>

      {/* İÇERİK ALANI */}
      <main style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* 1. BLOK VE DAİRELER */}
        {activeTab === 'units' && (
          <>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[
                { key: 'A', name: 'A Blok (8 Dükkan)' },
                { key: 'B', name: 'B Blok (14 Kat - 28 Daire)' },
                { key: 'C', name: 'C Blok (14 Kat - 28 Daire)' },
              ].map((block) => (
                <button
                  key={block.key}
                  onClick={() => setSelectedBlock(block.key)}
                  style={{
                    padding: '14px 24px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: selectedBlock === block.key ? '#6b2d5c' : '#d8b8c5',
                    backgroundColor: selectedBlock === block.key ? '#6b2d5c' : '#ffffff',
                    color: selectedBlock === block.key ? '#ffffff' : '#6b2d5c',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flex: '1 1 auto',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                  }}
                >
                  {block.name}
                </button>
              ))}
            </div>

            {/* ÖZET VE TOPLU AİDAT KARTI */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '28px',
              boxShadow: '0 4px 20px rgba(107, 45, 92, 0.05)',
              border: '1px solid #ebd2dc',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%', maxWidth: '520px' }}>
                <div style={{ flex: '1 1 200px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ background: '#dc2626', color: '#fff', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>⚠️</div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: '700' }}>Borçlu Birim</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#7f1d1d', marginTop: '2px' }}>{totalDebtors} Adet</div>
                  </div>
                </div>

                <div style={{ flex: '1 1 200px', backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ background: '#ca8a04', color: '#fff', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>💳</div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#854d0e', fontWeight: '700' }}>Toplam Alacak</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#713f12', marginTop: '2px' }}>{totalReceivables.toLocaleString('tr-TR')} ₺</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '500px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#6b2d5c' }}>Aidat:</span>
                <input
                  type="number"
                  value={dueAmount}
                  onChange={(e) => setDueAmount(e.target.value)}
                  style={{ flex: '1 1 90px', padding: '12px 14px', borderRadius: '10px', border: '1px solid #fde047', fontSize: '15px', fontWeight: 'bold', outline: 'none', background: '#fefce8', color: '#713f12' }}
                />
                <button
                  onClick={handleBulkApplyDue}
                  style={{ flex: '2 1 160px', backgroundColor: '#ca8a04', color: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                >
                  ⚡ Toplu Yansıt
                </button>

                {lastAppliedDue && (
                  <button
                    onClick={handleUndoLastBulkDue}
                    title="Son eklenen aidatı siler/geri alır"
                    style={{ flex: '1 1 100%', marginTop: '6px', backgroundColor: '#dc2626', color: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)' }}
                  >
                    ↩️ Son Yansıtılan Aidatı Geri Al ({lastAppliedDue} ₺)
                  </button>
                )}
              </div>
            </div>

            {/* KARTLAR */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6b2d5c' }}>Yükleniyor...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
                {filteredUnits.map((unit) => {
                  const isDebtor = unit.status === 'unpaid';
                  const ownerText = getOwnerLabel(unit.block);
                  return (
                    <div
                      key={unit.id}
                      style={{
                        backgroundColor: '#fef9c3',
                        border: '1px solid',
                        borderColor: isDebtor ? '#ef4444' : '#10b981',
                        borderRadius: '16px',
                        padding: '18px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', backgroundColor: isDebtor ? '#dc2626' : '#10b981' }} />
                      
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <h3 style={{ margin: 0, fontSize: '16px', color: '#713f12', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {selectedBlock === 'A' ? `Dükkan ${unit.unitNumber}` : `${selectedBlock} Blok - No: ${unit.unitNumber}`}
                            
                            {isDebtor && (
                              <button
                                onClick={() => setWarningModalUnit(unit)}
                                title="Resmi Borç ve İhtar Uyarısı Görüntüle"
                                style={{
                                  backgroundColor: '#dc2626',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '22px',
                                  height: '22px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '13px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.4)'
                                }}
                              >
                                ⚠️
                              </button>
                            )}
                          </h3>

                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: unit.isTenant ? '#fef08a' : '#d1fae5', color: unit.isTenant ? '#854d0e' : '#065f46', fontWeight: '700' }}>
                            {unit.isTenant ? 'Kiracı' : ownerText}
                          </span>
                        </div>

                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#451a03', fontWeight: '600' }}>
                          👤 {unit.residentName || 'İsim Yok'}
                        </p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#78350f' }}>
                          📞 {unit.phone || 'Tel Girilmemiş'}
                        </p>
                        {unit.isTenant && unit.landlordName && (
                          <p style={{ margin: 0, fontSize: '12px', color: '#854d0e' }}>
                            🏠 {ownerText}: {unit.landlordName}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #fef08a', paddingTop: '10px', gap: '8px' }}>
                        <div
                          onClick={() => togglePaymentStatus(unit)}
                          style={{
                            cursor: 'pointer',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            backgroundColor: isDebtor ? '#fee2e2' : '#d1fae5',
                            color: isDebtor ? '#dc2626' : '#059669'
                          }}
                        >
                          {isDebtor ? `⚠️ ${unit.debt.toLocaleString('tr-TR')} ₺` : '✅ Ödendi'}
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {unit.phone && (
                            <button
                              onClick={() => openWhatsApp(unit.phone, unit.residentName, unit.debt)}
                              title="WhatsApp Mesaj Gönder"
                              style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(34, 197, 94, 0.3)' }}
                            >
                              💬
                            </button>
                          )}
                          
                          <button
                            onClick={() => setEditingUnit(unit)}
                            title="Bilgileri Düzenle"
                            style={{ backgroundColor: '#4a1535', color: '#f3d1df', border: '1px solid #6b2d5c', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(74, 21, 53, 0.2)' }}
                          >
                            ✏️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* 2. REHBER */}
        {activeTab === 'directory' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 16px rgba(107, 45, 92, 0.05)', border: '1px solid #ebd2dc' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#4a1535', margin: '0 0 16px 0' }}>📖 Tüm Bina Sakinleri Telefon Rehberi</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ebd2dc', color: '#6b2d5c' }}>
                    <th style={{ padding: '12px' }}>Blok / No</th>
                    <th style={{ padding: '12px' }}>Sakin Adı</th>
                    <th style={{ padding: '12px' }}>Durum</th>
                    <th style={{ padding: '12px' }}>Telefon Numarası</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Hızlı İletişim</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAllUnits.map((u) => {
                    const ownerText = getOwnerLabel(u.block);
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f9f0f4' }}>
                        <td style={{ padding: '14px 12px', fontWeight: '800', color: '#8c3b71' }}>
                          {u.block === 'A' ? `A Blok - Dükkan ${u.unitNumber}` : `${u.block} Blok - No: ${u.unitNumber}`}
                        </td>
                        <td style={{ padding: '14px 12px', fontWeight: '600', color: '#2d1521' }}>{u.residentName}</td>
                        <td style={{ padding: '14px 12px', color: '#6b2d5c' }}>
                          {u.isTenant ? `Kiracı (${ownerText}: ${u.landlordName || '-'})` : ownerText}
                        </td>
                        <td style={{ padding: '14px 12px', color: '#4a2833', fontWeight: '600' }}>{u.phone || 'Kayıt Yok'}</td>
                        <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                          {u.phone ? (
                            <button
                              onClick={() => openWhatsApp(u.phone, u.residentName, u.debt)}
                              style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              💬 WhatsApp Gönder
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#a08591' }}>Tel Yok</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. KASA */}
        {activeTab === 'accounting' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #ebd2dc', borderLeft: '6px solid #10b981', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '13px', color: '#6b2d5c', fontWeight: '700' }}>Toplam Gelir</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#059669', marginTop: '8px' }}>{totalIncome.toLocaleString('tr-TR')} ₺</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #ebd2dc', borderLeft: '6px solid #dc2626', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '13px', color: '#6b2d5c', fontWeight: '700' }}>Toplam Gider</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#dc2626', marginTop: '8px' }}>{totalExpense.toLocaleString('tr-TR')} ₺</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #ebd2dc', borderLeft: '6px solid #6b2d5c', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '13px', color: '#6b2d5c', fontWeight: '700' }}>Net Kasa Bakiyesi</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: netBalance >= 0 ? '#4a1535' : '#dc2626', marginTop: '8px' }}>{netBalance.toLocaleString('tr-TR')} ₺</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '28px', borderRadius: '16px', marginBottom: '28px', border: '1px solid #ebd2dc', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: '0 0 18px 0', fontSize: '16px', color: '#4a1535', fontWeight: '800' }}>➕ Yeni Kasa İşlemi Ekle</h3>
              <form onSubmit={handleAddTransaction} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}
                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #d8b8c5', fontSize: '14px', flex: '1 1 150px', fontWeight: '700', background: '#fcf8fa', color: '#4a1535' }}
                >
                  <option value="income">🟢 Gelir Ekle</option>
                  <option value="expense">🔴 Gider Ekle</option>
                </select>

                <input
                  type="text"
                  placeholder="Açıklama (Örn: Asansör Bakımı)"
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #d8b8c5', fontSize: '14px', flex: '2 1 260px', background: '#fcf8fa', color: '#4a1535' }}
                />

                <input
                  type="number"
                  placeholder="Tutar (₺)"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #d8b8c5', fontSize: '14px', flex: '1 1 130px', background: '#fcf8fa', color: '#4a1535' }}
                />

                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #d8b8c5', fontSize: '14px', flex: '1 1 170px', background: '#fcf8fa', color: '#4a1535', fontWeight: '500' }}
                >
                  <option value="Aidat Tahsilatı">Aidat Tahsilatı</option>
                  <option value="Ortak Gelir">Ortak Gelir</option>
                  <option value="Elektrik/Su">Elektrik / Su</option>
                  <option value="Temizlik">Temizlik</option>
                  <option value="Bakım Onarım">Bakım & Onarım</option>
                  <option value="Diğer">Diğer</option>
                </select>

                <button
                  type="submit"
                  style={{ backgroundColor: '#6b2d5c', color: '#f3d1df', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', flex: '1 1 150px' }}
                >
                  Kaydet
                </button>
              </form>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #ebd2dc', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: '0 0 18px 0', fontSize: '16px', color: '#4a1535', fontWeight: '800' }}>📋 Kasa Hareketleri Geçmişi</h3>
              {transactions.length === 0 ? (
                <p style={{ color: '#6b2d5c', textAlign: 'center', padding: '30px' }}>Henüz kayıt yok.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #ebd2dc', color: '#6b2d5c' }}>
                        <th style={{ padding: '12px' }}>Tarih</th>
                        <th style={{ padding: '12px' }}>Tür</th>
                        <th style={{ padding: '12px' }}>Kategori</th>
                        <th style={{ padding: '12px' }}>Açıklama</th>
                        <th style={{ padding: '12px' }}>Tutar</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #f9f0f4' }}>
                          <td style={{ padding: '14px 12px', color: '#6b2d5c' }}>{t.date || 'Bugün'}</td>
                          <td style={{ padding: '14px 12px', fontWeight: '700', color: t.type === 'income' ? '#059669' : '#dc2626' }}>
                            {t.type === 'income' ? '🟢 Gelir' : '🔴 Gider'}
                          </td>
                          <td style={{ padding: '14px 12px', color: '#593b45' }}>{t.category}</td>
                          <td style={{ padding: '14px 12px', color: '#4a1535', fontWeight: '600' }}>{t.title}</td>
                          <td style={{ padding: '14px 12px', fontWeight: '800', color: t.type === 'income' ? '#059669' : '#dc2626' }}>
                            {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString('tr-TR')} ₺
                          </td>
                          <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteTransaction(t.id)}
                              style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                            >
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
          </div>
        )}

        {/* 4. RAPORLAR (PROFESYONEL EXCEL MERKEZİ) */}
        {activeTab === 'reports' && (
          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '1px solid #ebd2dc', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#4a1535', margin: '0 0 10px 0' }}>📊 Profesyonel Raporlama ve Excel Aktarım Merkezi</h2>
            <p style={{ color: '#6b2d5c', margin: '0 0 30px 0', fontSize: '14px' }}>Sütun genişlikleri optimize edilmiş, başlıkları şık ve renkli biçimlendirilmiş Excel raporlarını buradan indirebilirsiniz.</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <button
                onClick={exportUnitsToExcel}
                style={{
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📥 Sakinler ve Ödeme Raporunu Excel&apos;e Aktar (Geniş Sütun)
              </button>

              <button
                onClick={exportTransactionsToExcel}
                style={{
                  backgroundColor: '#6b2d5c',
                  color: '#f3d1df',
                  border: 'none',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(107, 45, 92, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📥 Kasa Gelir/Gider Raporunu Excel&apos;e Aktar (Geniş Sütun)
              </button>
            </div>
          </div>
        )}

      </main>

      {/* DÜZENLEME MODALI */}
      {editingUnit && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #d8b8c5', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 10px 25px rgba(74, 21, 53, 0.15)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#4a1535', fontWeight: '800' }}>
              🏢 {editingUnit.block === 'A' ? `A Blok - Dükkan ${editingUnit.unitNumber}` : `${editingUnit.block} Blok - No: ${editingUnit.unitNumber}`} Düzenle
            </h3>
            
            <form onSubmit={handleSaveUnitDetails} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6b2d5c', marginBottom: '6px', fontWeight: '600' }}>Sakin / İşletmeci Adı Soyadı:</label>
                <input
                  type="text"
                  value={editingUnit.residentName}
                  onChange={(e) => setEditingUnit({ ...editingUnit, residentName: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d8b8c5', background: '#fcf8fa', color: '#4a1535', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6b2d5c', marginBottom: '6px', fontWeight: '600' }}>Telefon Numarası (WhatsApp):</label>
                <input
                  type="text"
                  placeholder="0532..."
                  value={editingUnit.phone || ''}
                  onChange={(e) => setEditingUnit({ ...editingUnit, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d8b8c5', background: '#fcf8fa', color: '#4a1535', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6b2d5c', marginBottom: '6px', fontWeight: '600' }}>Mülkiyet Durumu:</label>
                <select
                  value={editingUnit.isTenant ? 'tenant' : 'owner'}
                  onChange={(e) => setEditingUnit({ ...editingUnit, isTenant: e.target.value === 'tenant' })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d8b8c5', background: '#fcf8fa', color: '#4a1535', fontSize: '14px', fontWeight: '700' }}
                >
                  <option value="owner">🏠 {getOwnerLabel(editingUnit.block)} (Oturuyor / İşletiyor)</option>
                  <option value="tenant">🔑 Kiracı</option>
                </select>
              </div>

              {editingUnit.isTenant && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#6b2d5c', marginBottom: '6px', fontWeight: '600' }}>
                    {getOwnerLabel(editingUnit.block)} Adı Soyadı:
                  </label>
                  <input
                    type="text"
                    value={editingUnit.landlordName || ''}
                    onChange={(e) => setEditingUnit({ ...editingUnit, landlordName: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d8b8c5', background: '#fcf8fa', color: '#4a1535', fontSize: '14px' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  style={{ flex: 1, backgroundColor: '#f9f0f4', color: '#6b2d5c', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, backgroundColor: '#6b2d5c', color: '#f3d1df', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESMİ UYARI MODALI */}
      {warningModalUnit && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{ backgroundColor: '#ffffff', border: '2px solid #dc2626', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '520px', boxShadow: '0 15px 30px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#991b1b', fontWeight: '800' }}>
              📜 Resmi Borç ve İhtar Bildirimi
            </h3>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px 0' }}>
              Aşağıdaki yasal metin ilgili sakine WhatsApp üzerinden gönderilebilir veya resmi evrak olarak yazdırılabilir.
            </p>

            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '14px',
              color: '#7f1d1d',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              marginBottom: '20px',
              maxHeight: '220px',
              overflowY: 'auto',
              fontWeight: '500'
            }}>
              {getOfficialWarningText(warningModalUnit)}
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setWarningModalUnit(null)}
                style={{ flex: 1, backgroundColor: '#e5e7eb', color: '#374151', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                Kapat
              </button>
              
              <button
                type="button"
                onClick={() => {
                  printOfficialWarning(warningModalUnit);
                  setWarningModalUnit(null);
                }}
                style={{ flex: 1, backgroundColor: '#4b5563', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                🖨️ Yazdır (Resmi Belge)
              </button>

              <button
                type="button"
                onClick={() => {
                  sendOfficialWhatsAppWarning(warningModalUnit);
                  setWarningModalUnit(null);
                }}
                style={{ flex: 2, backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}
              >
                💬 WhatsApp ile Gönder
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}