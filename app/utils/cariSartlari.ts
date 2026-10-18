import { reactive } from 'vue'

export interface IskontoSatiri { ad: string, oran: number }
export interface Sartlar {
  iskonto: { mod: 'yok' | 'tedarikci' | 'marka' | 'urun', tedarikci: IskontoSatiri[], marka: IskontoSatiri[], urun: IskontoSatiri[] }
  prim: { var: boolean, oran: number, hedef: number }
  nakliye: { tip: 'dahil' | 'haric' | 'baremli', baremler: { tutar: number, pay: number }[] }
}

export const tedarikciSecenekleri = ['LİDYA KOZMETİK LTD.ŞTİ.', 'AKDENİZ AMBALAJ SANAYİ VE TİCARET A.Ş.', 'PENSAN KALEM SAN. A.Ş.', 'UTKU OYUNCAK LTD.', 'ADEL KALEMCİLİK', 'FABER-CASTELL TÜRKİYE']
export const urunSecenekleri = [
  '741373 – Loris Oda Kokusu 24301 Lavanta & Misk 48', '741372 – Loris Oda Kokusu 24304 Kır Çiçeği 48', '1956 – Panfix Selefon Bant 4007000002 12*66 Mt',
  '426526 – Pensan Kidz Keçeli Kalem 99060 12 Renk', '552116 – Utku Puzzle Siyasi Harita Kutulu', '567462 – Disney Kalem Çantası Mickey',
  '812045 – Faber-Castell Kuru Boya 24 Renk', '833210 – Mikado Defter A4 Çizgili 96 Yaprak', '845501 – Hasbro Oyun Hamuru Play-Doh 4lü Set',
]
export const markaSecenekleri = ['Loris Parfüm', 'Panfix', 'Pensan Kalem', 'Utku Oyuncak', 'Disney (Adel Faber)', 'Faber-Castell', 'Mikado', 'Adel', 'Hasbro', 'Pelikan']

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 11)

function varsayilan(kod: string): Sartlar {
  const h = hash(kod)
  const satirlar = (liste: string[], k: number) => [0, 1, 2].slice(0, 1 + ((h >> k) % 2)).map(i => ({ ad: liste[(h + i * 3 + k) % liste.length]!, oran: 2 + ((h + i + k) % 9) }))
  const tip = (['dahil', 'haric', 'baremli'] as const)[h % 3]!
  return {
    iskonto: {
      mod: (['yok', 'tedarikci', 'marka', 'urun'] as const)[h % 4]!,
      tedarikci: satirlar(tedarikciSecenekleri, 1), marka: satirlar(markaSecenekleri, 2), urun: satirlar(urunSecenekleri, 3),
    },
    prim: { var: h % 2 === 0, oran: 1 + (h % 3), hedef: 1000000 * (1 + (h % 4)) },
    nakliye: { tip, baremler: tip === 'baremli' ? [{ tutar: 10000, pay: 100 }, { tutar: 25000, pay: 50 }, { tutar: 50000, pay: 0 }] : [] },
  }
}

const depo = reactive<Record<string, Sartlar>>({})

/** Kayıtlı şartlar (yoksa cari koddan türetilen örnek değerler). */
export function sartlariAl(kod: string): Sartlar {
  if (!depo[kod]) depo[kod] = varsayilan(kod)
  return depo[kod]!
}
export function sartlariKaydet(kod: string, s: Sartlar) {
  depo[kod] = JSON.parse(JSON.stringify(s))
}
