import { reactive } from 'vue'

export interface Cari {
  kod: string
  unvan: string
  vergiNo: string
  vergiDairesi: string
  telefon: string
  grup: string
  sektor: string
  sehir: string
  ilce: string
  temsilci: string
  temsilciNo: string
  limit: number
  bakiye: number
  durum: 'AKTİF' | 'PASİF'
  ticariStatu: '' | 'N' | 'A' | 'AB'
  kilitli: boolean
}

// Ünvan, vergi no, telefon ve temsilci adları kurgudur.
const s = (kod: string, unvan: string, vergiNo: string, vergiDairesi: string, telefon: string, grup: string, sektor: string, sehir: string, ilce: string, temsilci: string, temsilciNo: string, limit: number, bakiye: number, ticariStatu: Cari['ticariStatu'] = '', durum: Cari['durum'] = 'AKTİF'): Cari =>
  ({ kilitli: false, kod, unvan, vergiNo, vergiDairesi, telefon, grup, sektor, sehir, ilce, temsilci, temsilciNo, limit, bakiye, ticariStatu, durum })

/** Kilitli cari: `s` ile aynı alanlar. */
const kilit = (...a: Parameters<typeof s>): Cari => ({ ...s(...a), kilitli: true })

export const cariler: Cari[] = reactive([
  s('120.00.002847', 'KÜÇÜKYALI TOPTAN KIRTASİYE SAN. TİC. LTD. ŞTİ.', '3881765763', 'GÜNEŞLİ VERGİ DAİRESİ', '5322850081', 'TOPTAN', 'KIRTASİYE', 'İSTANBUL', 'BAĞCILAR', 'LEVENT ARSLAN', '961', 2000000, 715102.22, 'N'),
  s('120.34.05854', 'ARAS KIRTASİYE VE BÜRO AMBALAJ SAN. TİC. A.Ş.', '0730418619', 'GÜNEŞLİ VERGİ DAİRESİ MÜDÜRLÜĞÜ', '5064738245', 'TOPTAN', 'KIRTASİYE', 'İSTANBUL', 'BAĞCILAR', 'AHMET ERDEM', '730', 20000000, 5328365.38, 'A'),
  kilit('329.00.001371', 'MERVE TUNALI TURGUT', '11902222100', 'ETİMESGUT VERGİ DAİRESİ MÜD.', '5306901484', 'TANIMSIZ', 'TANIMSIZ', 'ANKARA', 'ETİMESGUT', '983', '983', 0, -58000.02),
  s('120.00.002528', 'EMİRHAN TEM VE GIDA LTD ŞTİ.', '3340393638', 'MARDİN VERGİ DAİRESİ', '5364525469', 'YEREL MARKET', 'GIDA', 'MARDİN', 'ARTUKLU', 'METİN ATAK', '2051', 2000000, 1018573.97, 'AB'),
  s('120.B4B.00161', 'TEDARİKYOLU TEKNOLOJİ SAN. VE TİC. A.Ş.', '8331074508', 'KOCASİNAN VERGİ DAİRESİ MÜD.', '5536293344', 'PERAKENDE', 'EDT', 'İSTANBUL', 'BAŞAKŞEHİR', 'T10_B2B Müşterisi', 'B2B', 0, 0),
  s('120.B4B.00160', 'EKİN HAYALOĞLU - TAHTAKALE TİCARET', '47560616364', 'ULUÇINAR VERGİ DAİRESİ MÜD.', '5071174141', 'PERAKENDE', 'ZÜCCACİYE / K.EV ALETLERİ', 'KOCAELİ', 'DARICA', 'T10_B2B Müşterisi', 'B2B', 0, 0),
  s('120.00.004379', 'ZEYNEP DURMAZ ÖZKAN', '6710605359', 'BAKIRKÖY VERGİ DAİRESİ', '5064738245', 'PERAKENDE', 'Ev Dışı Tüketim ve Ambalaj', 'İSTANBUL', 'BAKIRKÖY', 'LEVENT ARSLAN', '961', 0, 0),
  s('120.00.004378', 'MİNİK ADIMLAR KIRTASİYE KEMAL AYDIN', '39218213032', 'KAĞITHANE VERGİ DAİRESİ', '5306901484', 'PERAKENDE', 'KIRTASİYE', 'İSTANBUL', 'KAĞITHANE', 'AHMET ERDEM', '730', 0, 12450.00),
  s('120.00.004377', 'HASAN YILDIRIM', '15425607628', 'ESENYURT VERGİ DAİRESİ', '5536293344', 'TOPTAN', 'ZÜCCACİYE / K.EV ALETLERİ', 'İSTANBUL', 'ESENYURT', 'METİN ATAK', '2051', 150000, 38420.75, 'N'),
  kilit('120.00.004376', 'KIRMIZI ELMA HEDİYELİK EŞYA TARIK ŞENER', '19523395692', 'SELÇUKLU VERGİ DAİRESİ', '5071174141', 'PERAKENDE', 'KIRTASİYE', 'KONYA', 'SELÇUKLU', '983', '983', 1, 0),
  s('120.00.004375', 'BAŞAK TOPTAN KIRTASİYE A.Ş.', '0340933162', 'BEYAZIT VERGİ DAİRESİ', '5072021993', 'TOPTAN', 'KIRTASİYE', 'İSTANBUL', 'FATİH', 'LEVENT ARSLAN', '961', 750000, 241300.10, 'A'),
  s('320.00.001664', 'SELMA KARAKAYA', '8850463572', 'ANTALYA VERGİ DAİRESİ', '5322734674', 'IHRACAT', 'TANIMSIZ', 'ANTALYA', 'MURATPAŞA', '983', '983', 0, 0),
  s('320.00.001663', 'LİDYA KOZMETİK LTD.ŞTİ.', '7601148423', 'ÇAĞLAYAN VERGİ DAİRESİ', '5325143987', 'TOPTAN', 'TEDARİKÇİ', 'İSTANBUL', 'KAĞITHANE', 'AHMET ERDEM', '730', 0, -184200.00),
  kilit('120.00.004374', 'KONSEPT MAĞAZACILIK TİCARET LİMİTED ŞİRKETİ', '4571509635', 'İZMİR VERGİ DAİRESİ', '5469324990', 'PERAKENDE', 'KIRTASİYE', 'İZMİR', 'BORNOVA', 'METİN ATAK', '2051', 1500000, 903220.45, 'AB'),
  s('120.00.004373', 'BULUT TEKSTİL TUR İNŞ SAN. VE TİC. LTD.ŞTİ', '3870387908', 'MERTER VERGİ DAİRESİ', '2126594883', 'PERAKENDE', 'OYUNCAK', 'İSTANBUL', 'GÜNGÖREN', 'LEVENT ARSLAN', '961', 1, 0, 'N'),
  s('120.00.004372', 'GÜNEŞ GIDA TEMİZLİK TİCARET VE SAN.LTD.ŞTİ.', '2640609262', 'BURSA VERGİ DAİRESİ', '5436995640', 'PERAKENDE', 'KIRTASİYE', 'BURSA', 'NİLÜFER', 'AHMET ERDEM', '730', 1500000, 67890.00, 'A'),
  s('120.B4B.00115', 'DELTA GRUP LOJİSTİK DANIŞ. SAN. VE TİC. LTD. ŞTİ.', '3810988468', 'KOCASİNAN VERGİ DAİRESİ MÜD.', '5364525469', 'PERAKENDE', 'Ev Dışı Tüketim ve Ambalaj', 'İSTANBUL', 'BAŞAKŞEHİR', 'T10_B2B Müşterisi', 'B2B', 0, 0),
  s('120.00.004371', 'YILMAZ ATLAS OYUNCAK TİCARET', '5510934410', 'ANKARA VERGİ DAİRESİ', '5058120044', 'PERAKENDE', 'OYUNCAK', 'ANKARA', 'ÇANKAYA', '983', '983', 250000, 98410.30, 'N'),
  s('120.00.004370', 'ÇINAR KIRTASİYE BÜRO MALZEMELERİ', '1830672291', 'ADANA VERGİ DAİRESİ', '5416607722', 'TOPTAN', 'KIRTASİYE', 'ADANA', 'SEYHAN', 'METİN ATAK', '2051', 750000, 412005.00, 'AB'),
  s('335.01.34762', 'EMRE KAYAOĞLU (CARİ SATIŞ)', '73687092484', 'ŞİŞLİ VERGİ DAİRESİ', '5335951835', 'PERSONEL', 'CARİ PERSONEL', 'İSTANBUL', 'ŞİŞLİ', '983', '983', 0, 0, '', 'PASİF'),
]) as Cari[]
