import { cariler, type Cari } from '~/utils/cariVeri'
import { efaturaSayilari } from '~/utils/efaturaVeri'
import { ekstreAdedi } from '~/utils/ekstreVeri'

export interface CariDetay {
  cari: Cari
  unvan2: string
  vergiDairesiKodu: string
  baglanti: string
  hareket: string
  doviz: string
  bolge: string
  acilis: string
  sonGuncel: string
  sonGuncelleyen: string
  eFatura: { mukellef: boolean, tarih: string }
  cep: string
  telefon: string
  eposta: string
  gonderimOnayi: boolean
  kep: string
  mutabakat: string
  web: string
  muhHesabi: string
  satisIsk: string
  vadeFarki: string
  odemePlani: string
  odemeCinsi: string
  odemeSekli: string
  riskTakibi: boolean
  faturaAdresi: string
  sevkAdresi: string
  toplamBorc: number
  toplamAlacak: number
  borcHareket: number
  alacakHareket: number
  istihbarat: string
  finans: { portfoyCek: number, portfoySenet: number, siparisAdet: number, irsaliyeAdet: number, bekleyenSiparis: number, bekleyenIrsaliye: number, toplamRisk: number, ciro2026: number, ciro2025: number, bakiyeGun: number }
  yetkililer: { ad: string, gorev: string, telefon: string, eposta: string }[]
  onay: 'Onaylandı' | 'Onay Bekliyor'
  sayilar: { adresler: number, yetkililer: number, ekstre: number, efatura: number, kullanicilar: number }
}

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
const sec = <T>(liste: T[], h: number) => liste[h % liste.length]!
const ascii = (s: string) => s.toLocaleLowerCase('tr').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/[^a-z0-9]+/g, '')

const YETKILI_ADLARI = ['SERKAN BOZKURT', 'DERYA AKSOY', 'OKAN TEKİN', 'PINAR ÇELİK', 'VOLKAN ÖZDEN', 'GÖKHAN ŞAHİN']
const YETKILI_GOREVLERI = ['Satın Alma', 'Muhasebe', 'Genel Müdür', 'Mağaza Müdürü']

const BOLGELER: Record<string, string> = {
  'İSTANBUL': 'Avrupa Yakası', 'ANKARA': 'İç Anadolu', 'MARDİN': 'Güneydoğu', 'KOCAELİ': 'Marmara', 'KONYA': 'İç Anadolu',
  'İZMİR': 'Ege', 'BURSA': 'Marmara', 'ANTALYA': 'Akdeniz', 'ADANA': 'Akdeniz',
}

/** Prototip: ayrıntı alanları cari koddan türetilir (kurgu veri). */
export function cariDetayi(kod: string): CariDetay | null {
  const c = cariler.find(x => x.kod === kod)
  if (!c) return null
  const h = hash(c.kod)
  const alacakTaban = 120000 + (h % 480000)
  const toplamAlacak = c.bakiye < 0 ? alacakTaban + Math.abs(c.bakiye) : alacakTaban
  const toplamBorc = c.bakiye + toplamAlacak
  const ilk = ascii(c.unvan.split(' ').slice(0, 2).join(''))
  const tarih = (gun: number, ay: number, yil: number) => `${String(gun).padStart(2, '0')}.${String(ay).padStart(2, '0')}.${yil}`
  const bekleyenSiparis = c.limit > 1 ? 40000 + (h % 520000) : 0
  const bekleyenIrsaliye = h % 4 === 0 ? 15000 + (h % 90000) : 0
  const portfoyCek = h % 3 === 0 ? 20000 + (h % 150000) : 0
  const portfoySenet = h % 5 === 0 ? 10000 + (h % 80000) : 0
  const ciro2026 = 150000 + (h % 1800000)
  const yuvarla = (n: number) => Math.round(n * 100) / 100
  return {
    cari: c,
    unvan2: h % 3 === 0 ? 'Sn.' : '—',
    vergiDairesiKodu: String(34000 + (h % 999)).padStart(6, '0'),
    baglanti: c.sehir === 'İSTANBUL' || h % 4 ? 'YURTİÇİ' : 'YURTDIŞI',
    hareket: c.grup === 'TEDARİKÇİ' || c.kod.startsWith('320.') ? 'ALICI' : 'ALICI/SATICI',
    doviz: 'TRY',
    bolge: BOLGELER[c.sehir] ?? 'Diğer',
    acilis: tarih(1 + (h % 27), 1 + (h % 12), 2023 + (h % 3)),
    sonGuncel: tarih(10 + (h % 18), 10, 2026),
    sonGuncelleyen: String(900 + (h % 40)),
    eFatura: { mukellef: h % 5 !== 0, tarih: tarih(1 + (h % 27), 1 + (h % 12), 2022) },
    cep: c.telefon,
    telefon: c.telefon.startsWith('212') || c.telefon.startsWith('216') ? c.telefon : '',
    eposta: `${ilk}@${sec(['hotmail.com', 'gmail.com', 'outlook.com'], h)}`,
    gonderimOnayi: h % 3 === 0,
    kep: '',
    mutabakat: `${ilk}@${sec(['hotmail.com', 'gmail.com'], h)}`,
    web: '',
    muhHesabi: c.kod.startsWith('320.') ? '320.01.01.001' : '120.01.01.001',
    satisIsk: sec(['T1', 'T2', 'T3'], h),
    vadeFarki: '%0.0',
    odemePlani: sec(['PEŞİN', '30 GÜN', '60 GÜN', '90 GÜN'], h),
    odemeCinsi: sec(['NAKIT', 'ÇEK', 'HAVALE'], h),
    odemeSekli: sec(['PESIN', 'VADELİ'], h),
    riskTakibi: c.limit > 0,
    faturaAdresi: '#1',
    sevkAdresi: '#1',
    toplamBorc,
    toplamAlacak,
    borcHareket: 8 + (h % 30),
    alacakHareket: 4 + (h % 25),
    finans: {
      portfoyCek, portfoySenet, siparisAdet: bekleyenSiparis ? 1 + (h % 6) : 0, irsaliyeAdet: bekleyenIrsaliye ? 1 + (h % 3) : 0,
      bekleyenSiparis, bekleyenIrsaliye, toplamRisk: yuvarla(Math.max(c.bakiye, 0) + portfoyCek + portfoySenet + bekleyenSiparis + bekleyenIrsaliye),
      ciro2026, ciro2025: Math.round(ciro2026 * (0.05 + (h % 40) / 100)), bakiyeGun: c.bakiye > 0 ? 5 + (h % 60) : 0,
    },
    yetkililer: Array.from({ length: 1 + (h % 2) }, (_, i) => {
      const ad = sec(YETKILI_ADLARI, h + i * 7)
      return { ad, gorev: sec(YETKILI_GOREVLERI, h + i * 3), telefon: `53${String(10000000 + ((h * (i + 3)) % 89999999))}`, eposta: `${ascii(ad.split(' ')[0]!)}@${ilk}.com` }
    }),
    istihbarat: sec(['Sorun görülmedi.', 'Vadeli satışta teminat önerilir.', 'Son 12 ayda ödemeler zamanında.', 'Limit artışı için bilanço istendi.'], h),
    onay: 'Onaylandı',
    sayilar: { adresler: 1, yetkililer: 1 + (h % 2), ekstre: ekstreAdedi(c.kod), efatura: (() => { const e = efaturaSayilari(c.kod, h % 5 !== 0); return e.giden + e.gelen })(), kullanicilar: 0 },
  }
}
