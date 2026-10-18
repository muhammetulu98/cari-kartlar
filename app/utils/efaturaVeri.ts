export interface EFatura {
  evrak: string
  faturaNo: string
  ettn: string
  tip: 'E-FATURA' | 'E-ARŞİV'
  faturaTarihi: string
  olusturma: string
  gonderim: string
  tutar: number
  durum: 'GÖNDERİLDİ' | 'BEKLİYOR' | 'HATALI'
}

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 23)

/** Küçük, deterministik rastgele sayı üreteci (aynı cari her açılışta aynı faturaları görür). */
function uretec(kod: string, yon: string) {
  let t = hash(kod + yon)
  return () => { t = (t + 0x6D2B79F5) >>> 0; let x = t; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296 }
}

export function efaturaSayilari(kod: string, mukellef: boolean) {
  if (!mukellef) return { giden: 0, gelen: 0 }
  const h = hash(kod)
  return { giden: 6 + (h % 25), gelen: kod.startsWith('320.') ? 3 + (h % 8) : 0 }
}

const iso = (g: number) => new Date(Date.UTC(2026, 9, 2) - g * 86400000).toISOString().slice(0, 10)

export function efaturalar(kod: string, yon: 'giden' | 'gelen', mukellef: boolean): EFatura[] {
  const adet = efaturaSayilari(kod, mukellef)[yon]
  const r = uretec(kod, yon)
  const rastgele = (a: number, b: number) => Math.floor(a + r() * (b - a + 1))
  let gun = 0
  return Array.from({ length: adet }, () => {
    gun += rastgele(0, 9)
    const faturaTarihi = iso(gun)
    const gecikme = rastgele(0, 3)
    const olusturma = iso(Math.max(gun - gecikme, 0))
    const gonderim = iso(Math.max(gun - gecikme - rastgele(0, 2), 0))
    const arsiv = r() < 0.15
    const durum = r() < 0.06 ? 'HATALI' : r() < 0.1 ? 'BEKLİYOR' : 'GÖNDERİLDİ'
    const no = String(rastgele(1000, 21999))
    return {
      evrak: `${yon === 'giden' ? ['RZ225', 'RN226'][rastgele(0, 1)] : 'AF226'}-${no}`,
      faturaNo: `${['TE6', 'TE9', 'AB1'][rastgele(0, 2)]}2026${String(rastgele(1, 19999)).padStart(9, '0')}`,
      ettn: [8, 4, 4, 4, 12].map(n => Array.from({ length: n }, () => '0123456789abcdef'[rastgele(0, 15)]).join('')).join('-'),
      tip: arsiv ? 'E-ARŞİV' : 'E-FATURA',
      faturaTarihi, olusturma, gonderim: durum === 'BEKLİYOR' ? '' : gonderim,
      tutar: Math.round((rastgele(800, 450000) + r()) * 100) / 100,
      durum,
    }
  })
}
