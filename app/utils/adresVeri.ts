// Prototip için sınırlı il / ilçe / semt / mahalle / posta kodu ağacı.
type Mahalleler = Record<string, string>
type Semtler = Record<string, Mahalleler>
type Ilceler = Record<string, Semtler>

export const adresAgaci: Record<string, Ilceler> = {
  'İSTANBUL': {
    'BAĞCILAR': { 'GÜNEŞLİ': { 'EVREN MAH.': '34212', 'FEVZİ ÇAKMAK MAH.': '34212' }, 'KIRAZLI': { 'KIRAZLI MAH.': '34188' } },
    'ESENYURT': { 'ESENYURT': { 'AKÇABURGAZ MAH.': '34510', 'SAADETDERE MAH.': '34510' } },
    'KADIKÖY': { 'GÖZTEPE': { 'MERDİVENKÖY MAH.': '34732', '19 MAYIS MAH.': '34736' } },
    'BAŞAKŞEHİR': { 'KAYAŞEHİR': { 'KAYABAŞI MAH.': '34494' } },
  },
  'ANKARA': {
    'ÇANKAYA': { 'KIZILAY': { 'KIZILAY MAH.': '06420', 'MESNEVİ MAH.': '06680' } },
    'ETİMESGUT': { 'ELVANKENT': { 'ELVANKENT MAH.': '06790' } },
  },
  'İZMİR': {
    'BORNOVA': { 'ERZENE': { 'ERZENE MAH.': '35040', 'KAZIMDİRİK MAH.': '35100' } },
    'KONAK': { 'ALSANCAK': { 'ALSANCAK MAH.': '35220' } },
  },
  'BURSA': { 'NİLÜFER': { 'ÖZLÜCE': { 'ÖZLÜCE MAH.': '16120', 'BEŞEVLER MAH.': '16140' } } },
  'KOCAELİ': { 'DARICA': { 'BAYRAMOĞLU': { 'BAYRAMOĞLU MAH.': '41700' } } },
}

export const bolgeler = ['Avrupa Yakası', 'Anadolu Yakası', 'İç Anadolu', 'Marmara', 'Ege', 'Akdeniz', 'Güneydoğu']
export const gruplar = ['TOPTAN', 'PERAKENDE', 'ZİNCİR', 'YEREL MARKET', 'IHRACAT', 'PERSONEL', 'Eletronik Ticaret']
export const sektorler = ['KIRTASİYE', 'OYUNCAK', 'GIDA', 'EDT', 'ZÜCCACİYE / K.EV ALETLERİ', 'Ev Dışı Tüketim ve Ambalaj', 'TEDARİKÇİ']
export const vergiDaireleri = [
  'GÜNEŞLİ VERGİ DAİRESİ', 'BAKIRKÖY VERGİ DAİRESİ', 'KAĞITHANE VERGİ DAİRESİ', 'ESENYURT VERGİ DAİRESİ', 'KOCASİNAN VERGİ DAİRESİ MÜD.',
  'ETİMESGUT VERGİ DAİRESİ MÜD.', 'MARDİN VERGİ DAİRESİ', 'ANKARA VERGİ DAİRESİ', 'İZMİR VERGİ DAİRESİ', 'BURSA VERGİ DAİRESİ',
  'ULUÇINAR VERGİ DAİRESİ MÜD.', 'ADANA VERGİ DAİRESİ', 'ANTALYA VERGİ DAİRESİ', 'KADIKÖY VERGİ DAİRESİ', 'BEYAZIT VERGİ DAİRESİ',
]
