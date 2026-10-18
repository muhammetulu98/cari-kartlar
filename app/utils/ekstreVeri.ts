export interface EkstreKalem {
  stokKodu: string
  stokAdi: string
  miktar: number
  birim: string
  fiyat: number
  isk: [number, number, number, number]
  netFiyat: number
  netTutar: number
}
export interface EkstreHareket {
  id: string
  tarih: string
  evrak: string
  belge: string
  tip: 'Satış Fat.' | 'Alış Fat.' | 'İade Fat.' | 'Tahsilat' | 'Ödeme'
  aciklama: string
  altAciklama: string
  vade: string
  borc: number
  alacak: number
  kalemler: EkstreKalem[]
  detay: { ad: string, deger: string }[]
  bakiye: number
}

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 29)
const yuvarla = (n: number) => Math.round(n * 100) / 100

export const ekstreAdedi = (kod: string) => 20 + (hash(kod) % 35)

const URUNLER: [string, string, string][] = [
  ['741373', 'Loris Oda Kokusu 24301 Lavanta & Misk 48', 'Adet'], ['1956', 'Panfix Selefon Bant 4007000002 12*66 Mt', 'Düzine'],
  ['426526', 'Pensan Kidz Keçeli Kalem 99060 12 Renk', 'Paket'], ['552116', 'Utku Puzzle Siyasi Harita Kutulu', 'Koli'],
  ['567462', 'Disney Kalem Çantası 101000027600 Mickey', 'Adet'], ['812045', 'Faber-Castell Kuru Boya 24 Renk Karton Kutu', 'Paket'],
  ['833210', 'Mikado Defter A4 Çizgili 96 Yaprak Spiralli', 'Adet'], ['845501', 'Hasbro Oyun Hamuru Play-Doh 4lü Set', 'Adet'],
  ['860001', 'Pelikan Dolma Kalem Twist Mavi', 'Adet'], ['2031', 'Adel Pastel Boya 12 Renk Tahta Kutu', 'Paket'],
]

/**
 * Cari ekstresi: kurgu hareketler. Açılış bakiyesi, son yürüyen bakiye carinin güncel bakiyesine eşit olacak şekilde seçilir.
 */
export function ekstreHareketleri(kod: string, guncelBakiye: number): { acilis: number, hareketler: EkstreHareket[] } {
  const adet = ekstreAdedi(kod)
  const tedarikci = kod.startsWith('320.')
  let t = hash(kod)
  const r = () => { t = (t + 0x6D2B79F5) >>> 0; let x = t; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296 }
  const rastgele = (a: number, b: number) => Math.floor(a + r() * (b - a + 1))
  const iso = (g: number) => new Date(Date.UTC(2025, 2, 1) + g * 86400000).toISOString().slice(0, 10)
  const gunSonu = 590 // 2026-10-15 civarı

  const gunler = Array.from({ length: adet }, () => rastgele(0, gunSonu)).sort((a, b) => a - b)
  const taslak = gunler.map((g, i): EkstreHareket => {
    const tarih = iso(g)
    const fatura = r() < 0.62
    if (fatura) {
      const kalemSayisi = rastgele(1, 6)
      const kalemler: EkstreKalem[] = Array.from({ length: kalemSayisi }, () => {
        const [stokKodu, stokAdi, birim] = URUNLER[rastgele(0, URUNLER.length - 1)]!
        const miktar = rastgele(2, 60)
        const fiyat = yuvarla(rastgele(1800, 32000) / 100)
        const isk: [number, number, number, number] = [r() < 0.5 ? rastgele(5, 25) : 0, r() < 0.3 ? rastgele(2, 10) : 0, 0, 0]
        const netFiyat = yuvarla(fiyat * isk.reduce((a, i) => a * (1 - i / 100), 1))
        return { stokKodu, stokAdi, miktar, birim, fiyat, isk, netFiyat, netTutar: yuvarla(netFiyat * miktar) }
      })
      const netToplam = kalemler.reduce((a, k) => a + k.netTutar, 0)
      const tutar = yuvarla(netToplam * 1.2)
      const iade = r() < 0.07
      const toptan = r() < 0.5
      const vadeGun = toptan ? 30 * rastgele(0, 2) : 0
      const seri = tedarikci ? 'AF226' : toptan ? 'RN226' : 'RZ225'
      return {
        id: `h${i}`, tarih,
        evrak: `${seri}-${rastgele(1000, 24999)}`,
        belge: `${['TE6', 'TE9'][rastgele(0, 1)]}2026${String(rastgele(1, 19999)).padStart(9, '0')}`,
        tip: tedarikci ? 'Alış Fat.' : iade ? 'İade Fat.' : 'Satış Fat.',
        aciklama: toptan ? `${rastgele(1, 12)} KL/ Toplama No:${rastgele(10000, 49999)}` : 'Perakende fatura',
        altAciklama: toptan ? 'Toptan fatura' : '',
        vade: new Date(new Date(tarih).getTime() + vadeGun * 86400000).toISOString().slice(0, 10),
        borc: tedarikci || iade ? 0 : tutar, alacak: tedarikci || iade ? tutar : 0,
        kalemler, detay: [{ ad: 'KDV Hariç', deger: netToplam.toFixed(2) }, { ad: 'KDV (%20)', deger: (tutar - netToplam).toFixed(2) }, { ad: 'Genel Toplam', deger: tutar.toFixed(2) }],
        bakiye: 0,
      }
    }
    const tutar = yuvarla(rastgele(1500, 28000) + r())
    const yontem = ['Müşt. kredi kartı', 'Havale / EFT', 'Çek', 'Nakit', 'Senet'][rastgele(0, 4)]!
    return {
      id: `h${i}`, tarih, evrak: `Q-${rastgele(100000, 129999)}`, belge: '', tip: tedarikci ? 'Ödeme' : 'Tahsilat', aciklama: yontem, altAciklama: '',
      vade: new Date(new Date(tarih).getTime() + rastgele(0, 40) * 86400000).toISOString().slice(0, 10),
      borc: tedarikci ? tutar : 0, alacak: tedarikci ? 0 : tutar, kalemler: [],
      detay: [{ ad: 'Ödeme Yöntemi', deger: yontem }, { ad: 'Referans', deger: `Q-${rastgele(100000, 129999)}` }],
      bakiye: 0,
    }
  })

  // Son bakiye carinin güncel bakiyesine eşitlensin: farkı açılış bakiyesine yaz
  const net = taslak.reduce((a, h) => a + h.borc - h.alacak, 0)
  const acilis = yuvarla(guncelBakiye - net)
  let b = acilis
  for (const h of taslak) { b = yuvarla(b + h.borc - h.alacak); h.bakiye = b }

  return { acilis, hareketler: taslak }
}
