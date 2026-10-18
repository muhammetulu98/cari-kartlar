# Cari Kartlar — Ekran Özellikleri

Frontend prototip (Nuxt 4, backend yok). Tüm veri bellektedir; sayfa yenilenince başlangıç haline döner. Ünvan, vergi no, telefon, temsilci ve diğer tüm değerler kurgudur. Çalıştırma: `npm run dev` → http://localhost:3479

Tasarım dili: açık tema, Figtree + JetBrains Mono, keskin köşeler (3–4 px), tablo başlığı gibi gri bantlı bölüm başlıkları, kırmızı birincil renk (`#d8262b`).

## Sayfalar

| Adres | Ekran |
|---|---|
| `/` | Cari Kartlar listesi |
| `/cari/[kod]` | Cari detay (ör. `/cari/120.00.002847`) |
| `/cari/yeni` | Yeni Cari Kart (Hızlı) |

---

## 1. Cari Kartlar listesi (`/`)

**Üst bölüm:** "Yenile" ve kırmızı "Yeni Cari Kart" düğmeleri. Yeni Cari Kart, `/cari/yeni` sayfasını açar. Yenile şimdilik işlev görmez.

**Arama:** Cari kod, ünvan, vergi no, telefon, vergi dairesi, il, ilçe ve temsilci alanlarında arar. Arama **Enter'a basılınca** uygulanır; kutu boşaltılınca filtre kalkar.

**Filtreler** (varsayılan hepsi "Tümü", seçer seçmez uygulanır):
- Tedarikçi / Müşteri (kodu `320.` ile başlayanlar tedarikçi, diğerleri müşteri)
- Temsilci
- Ticari Statü (N, A, AB, Statüsüz)
- İl

**Tablo kolonları:** Cari Kod, Ünvan, Vergi No / Daire, İl / İlçe, Temsilci (ad ve no), Limit, Bakiye, Ticari Statü.
- Bakiye renkli: **artı (borç) kırmızı, eksi (alacak) yeşil**, sıfır renksiz.
- Limit yoksa `₺0,00`; tutarlar `₺` ve Türkçe biçimde.
- Kilitli cariler ünvanın yanında kırmızı kilit simgeli **"Kilitli"** rozeti taşır.
- Uzun ünvanlar `…` ile kesilir.
- Satıra tıklamak cari detay sayfasını açar.

Kaldırılanlar (isteğe bağlı geri getirilebilir): "Yalnız ERP serisi" çipi, Durum, Senkron, Açılış, Cep Telefonu kolonları, ünvan altındaki Grup/Sektör satırı, bakiye altındaki çubuk.

---

## 2. Cari detay (`/cari/[kod]`)

**Üst bölüm:** Solda "← Liste" düğmesi, yanında ünvan ve altında `kod • İL / İLÇE`. Cari kilitliyse sağda "Kilitli" rozeti. (Ekstre, Erişim Kodu, Sipariş Oluştur, Düzenle düğmeleri ve Cari Onayı rozeti kaldırıldı.)

**Üç özet kutusu:**
- **Bakiye:** artı kırmızı, eksi yeşil, "Döviz: TRY" notu.
- **Kredi Limiti:** Kutuya **tıklanınca satır içinde düzenlenir**. Enter ile kaydeder, Esc ile vazgeçer, kutu dışına tıklamak da kaydeder. `2.500.000,50`, `2500000,5` ve `2500000.5` biçimleri kabul edilir; boş, harfli veya eksi değer reddedilir. Kayıttan sonra "Limit güncellendi" yazısı 3 sn görünür; liste ve Açık Limit da güncellenir. Limit yoksa "Limit tanımlı değil" notu çıkar.
- **Açık Limit:** Kredi limiti − toplam risk (negatife düşmez). Yeşil renkte.

**Sekmeler:** Genel Bilgi, Adresler (1), Ekstre, Yaşlandırma, e-Fatura, Finansal Özet. Genel Bilgi, Ekstre, e-Fatura ve Finansal Özet doludur; diğerlerinde "Bu sekme prototipte henüz doldurulmadı" yazar. (Yetkililer, Müşteri Ayarları, Kullanıcılar ve Satış Şartları sekmeleri kaldırıldı.)

### Genel Bilgi sekmesi (3 kolon)

**Kart Bilgileri:** Cari Kod, Ünvan ve **Ünvan 2 aynı satırda yan yana**, Vergi Dairesi (kodu ile), Vergi No, Hareket, Döviz, Grup, Bölge, Sektör, Açılış, Son Güncel (tarih • kullanıcı no), e-Fatura (Mükellef • tarihten itibaren, düz yazı).

**İletişim & Temsilci:** Temsilci (ad ve no), Telefon, Cep, E-Posta, Şehir (il / ilçe).
- **Yetkililer** bölümü bu kolonun altındadır (başlıkta sayı, her yetkili için ad, görev, telefon, e-posta). Sekme olarak yoktur.

**Ticari Koşullar:** Muh. Hesabı (altında hesap adı), Satış İsk., Ödeme Planı, Ödeme Cinsi, Ödeme Şekli, Risk Takibi, Ticari Statü.
- **İstihbarat Bilgisi** bölümü bu kolonun altındadır; tek bir serbest metin notu gösterir.

Her bölüm başlığının sağında küçük, kare **kalem simgesi** vardır (şimdilik tıklanınca bir şey yapmaz).

### Ekstre sekmesi

- **Filtreler:** Hareket Tipi (Tümü, Satış Fat., Tahsilat vb.), Başlangıç ve Bitiş tarihi (varsayılan 01.01.2026 – 31.12.2026), **Tüm Tarihler** (tarih aralığını boşaltır) ve **Sıfırla** (varsayılana döner).
- **Özet satırı:** "19 hareket gösteriliyor / Toplam 40" ve seçili tarih aralığı.
- **Tablo:** Tarih, Evrak, Belge (fatura no), Tip, Açıklama, Vade, Borç, Alacak, Yürüyen Bakiye. Yürüyen bakiyede artı kırmızı, eksi yeşil; alacak tutarları yeşil. Altta Toplam borç / alacak satırı.
- **Devir satırı:** Seçilen aralıktan önceki hareketlerin bakiyesi, aralığın ilk satırı olarak "Devir" etiketiyle görünür (bakiye sıfırsa gösterilmez).
- **Satır açma:** Fatura satırı tıklanınca kalem tablosu açılır (Stok Kodu, Stok Adı, Miktar, B.Fiyat, İsk 1–4, Net B.Fiyat, Net Tutar) ve altında KDV hariç / KDV / genel toplam. Tahsilat satırında ödeme yöntemi ve referans görünür. Borç tutarı KDV dahildir (net tutarların × 1,20'si).
- **Excel İndir:** Tıklayınca iki seçenekli menü açılır: **Cari Ekstre** (yalnızca cari hareketler) ve **Detaylı Cari Ekstre** (her fatura satırının altında stok kalemleri: stok kodu/adı, miktar, B.Fiyat, İsk 1–4, net fiyat ve net tutar). İkisi de ekrandaki hareketleri (devir ve toplam dahil) `.csv` olarak indirir.
- **Ekstre Mail Gönder:** Alıcı e-posta (carinin e-postasıyla dolu) girilen pencere açar; Gönder "gönderildi" bilgisi verir, gerçek e-posta gönderilmez.
- Son yürüyen bakiye, carinin güncel bakiyesine eşittir. Hareketler cari koddan türetilen örnek veridir (`app/utils/ekstreVeri.ts`); sekme başlığındaki sayı toplam hareket sayısıdır.

### e-Fatura sekmesi

- **Giden / Gelen** seçimi (yanlarında fatura sayısı). Gelen faturalar yalnızca tedarikçi carilerde (`320.` serisi) bulunur; e-fatura mükellefi olmayan carilerde liste boştur ("Cari e-fatura mükellefi değil").
- **Filtreler:** Evrak / fatura no / ETTN araması ve fatura tarihi aralığı (başlangıç – bitiş). Sağda "15 / 25 kayıt" sayacı, satır seçildiyse seçili sayısı.
- **Kolonlar:** onay kutusu (başlıkta tümünü seç), Evrak, Fatura No, Tip (E-FATURA / E-ARŞİV), Fatura Tarihi, Oluşturma, Gönderim, Tutar, Durum (GÖNDERİLDİ / BEKLİYOR / HATALI, hepsi nötr gri rozet), İşlem.
- **Satır seçilince** (onay kutuları) filtre çubuğunda **Excel indir** ve **PDF indir** düğmeleri çıkar. Excel indir seçili faturaları (altında toplam tutarla) `.csv` olarak indirir; PDF indir tarayıcının yazdırma penceresini açar, hedef olarak "PDF olarak kaydet" seçilir.
- "Detay" düğmesi şimdilik bir işlem yapmaz. Faturalar cari koddan türetilen örnek veridir (`app/utils/efaturaVeri.ts`); sekme başlığındaki sayı giden + gelen toplamıdır.

### Finansal Özet sekmesi (3 kolon)

- **Risk Durumu** ("TRY bazında"): Toplam Risk, Açık Limit, Bakiye Gün Sayısı.
- **Bekleyen Hareketler:** Bekleyen Sipariş ve Bekleyen İrsaliye, yanlarında "Rapor →" bağlantısı (şimdilik işlevsiz).
- **Ciro:** 2026 Ciro ve 2025 Ciro; altında "KDV hariç … • iadeler düşülmüş net satış" (ciro ÷ 1,20).

**Toplam Risk** = borçlu bakiye + portföydeki çekler + portföydeki senetler + bekleyen sipariş + bekleyen irsaliye. Alacaklı (eksi) bakiye riske dahil edilmez.

### Cari Risk Föyü (modal)

Finansal Özet'te **Toplam Risk** tutarına tıklayınca açılır (Mikro Fly'daki cari risk föyü mantığı).
- Başlık: ünvan, kod, döviz, tarih.
- Kalemler: Cari Bakiye, Portföydeki Çekler, Portföydeki Senetler, Bekleyen Sipariş (sipariş sayısı), Bekleyen İrsaliye (irsaliye sayısı); her birinin açıklaması ve tutarı.
- Toplam Risk, Kredi Limiti, Açık Limit satırları. Risk limiti aşarsa kırmızı **Limit Aşımı** satırı eklenir.
- Kapatma: Kapat düğmesi, ✕, modal dışına tıklamak veya Esc.

---

## 3. Yeni Cari Kart — Hızlı (`/cari/yeni`)

Üstte "← Liste", başlık ve açıklama ("Kod 120.ERP serisinden otomatik verilir; kayıt Mikro senkron kuyruğuna girer"). **Hızlı** ve **Detaylı** sekmeleri; Detaylı henüz boştur. Hızlı sekmesinde "Kasa/showroom: az alanla aç…" notu görünür.

**Bölümler ve alanlar** (\* zorunlu):
- **Kimlik:** Ünvan\*, Şahıs firması (TC) onay kutusu, Vergi No\* (10 hane; şahıs firmasında TC No 11 hane), Vergi Dairesi (en az 2 karakter yazınca öneri listesi).
- **İletişim:** Yetkili Cep Tel\* (5 ile başlayan 10 hane), E-Posta\*.
- **Sınıflandırma:** Bölge\*, Grup\*, Sektör\*.
- **Adres:** İl\* → İlçe\* → Semt\* → Mahalle\* → Posta Kodu\* (zincirleme, üst seçim değişince alttakiler sıfırlanır), Cadde, Sokak.

**Doğrulama:** Alandan çıkınca eksik veya hatalıysa altında kırmızı uyarı çıkar. Tüm zorunlu alanlar geçerli olmadan **Cariyi Aç** pasif kalır.

**Cariyi Aç:** Yeni cariyi bir sonraki `120.00.` koduyla açar, listenin en üstüne ekler ve detay sayfasına götürür. Otomatik atamalar: temsilci `MAĞAZA`, iskonto `T1`, muhasebe kodu `120.01.01.001`, limit `1 ₺` (altta yazılıdır). Vazgeç listeye döner.

---

## Prototip sınırları

- Adres verisi kısıtlıdır: İstanbul, Ankara, İzmir, Bursa ve Kocaeli'nin birkaç ilçesi.
- Detay sayfasındaki ek bilgiler (e-posta, ödeme planı, muhasebe hesabı, yetkililer, ciro, çek/senet, istihbarat notu vb.) cari koddan türetilir (`app/utils/cariDetay.ts`).
- Kalem simgeleri, "Rapor →" bağlantıları ve Yenile düğmesi şimdilik işlevsizdir.
- Kilitli carilerde limit değişikliği engellenmez.
- Veriler `app/utils/cariVeri.ts` ve `app/utils/adresVeri.ts` içindedir.
