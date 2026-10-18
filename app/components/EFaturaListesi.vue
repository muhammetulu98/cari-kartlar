<script setup lang="ts">
import { efaturalar, efaturaSayilari } from '~/utils/efaturaVeri'

const props = defineProps<{ kod: string, unvan: string, mukellef: boolean }>()

const yon = ref<'giden' | 'gelen'>('giden')
const sayilar = computed(() => efaturaSayilari(props.kod, props.mukellef))
const tum = computed(() => efaturalar(props.kod, yon.value, props.mukellef))

const ara = ref('')
const baslangic = ref('')
const bitis = ref('')
const secili = ref<Set<string>>(new Set())

watch([() => props.kod, yon], () => { secili.value = new Set(); ara.value = ''; baslangic.value = ''; bitis.value = '' })

const liste = computed(() => {
  const q = ara.value.trim().toLocaleLowerCase('tr')
  return tum.value.filter(f =>
    (!q || [f.evrak, f.faturaNo, f.ettn].some(x => x.toLocaleLowerCase('tr').includes(q)))
    && (!baslangic.value || f.faturaTarihi >= baslangic.value)
    && (!bitis.value || f.faturaTarihi <= bitis.value),
  )
})

const hepsiSecili = computed(() => liste.value.length > 0 && liste.value.every(f => secili.value.has(f.faturaNo)))
function hepsiniDegistir() {
  secili.value = hepsiSecili.value ? new Set() : new Set(liste.value.map(f => f.faturaNo))
}
function degistir(no: string) {
  const s = new Set(secili.value)
  s.has(no) ? s.delete(no) : s.add(no)
  secili.value = s
}

const seciliFaturalar = computed(() => tum.value.filter(f => secili.value.has(f.faturaNo)))
const BASLIKLAR = ['Evrak', 'Fatura No', 'ETTN', 'Tip', 'Fatura Tarihi', 'Oluşturma', 'Gönderim', 'Tutar', 'Durum']
const ondalik = (n: number) => n.toFixed(2).replace('.', ',')
const aktarimSatirlari = () => {
  const satir = seciliFaturalar.value.map(f => [f.evrak, f.faturaNo, f.ettn, f.tip, tarih(f.faturaTarihi), tarih(f.olusturma), tarih(f.gonderim), ondalik(f.tutar), f.durum])
  satir.push(['Toplam', '', '', '', '', '', '', ondalik(seciliFaturalar.value.reduce((a, f) => a + f.tutar, 0)), ''])
  return satir
}
const dosyaAdi = () => `e-fatura-${yon.value}-${props.kod}-${new Date().toISOString().slice(0, 10)}`
const kacis = (v: string) => /[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v

/** Türkçe Excel çift tıkla doğru açsın diye noktalı virgül ayracı ve UTF-8 BOM kullanılır. */
function excelIndir() {
  const icerik = [BASLIKLAR, ...aktarimSatirlari()].map(s => s.map(kacis).join(';')).join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + icerik], { type: 'text/csv;charset=utf-8' }))
  a.download = `${dosyaAdi()}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
/** Tarayıcının yazdırma penceresi açılır; hedef olarak "PDF olarak kaydet" seçilir. */
function pdfIndir() {
  const w = window.open('', '_blank')
  if (!w) return
  const sag = new Set([7])
  const hucre = (v: string, i: number, tag = 'td') => `<${tag}${sag.has(i) ? ' style="text-align:right"' : ''}>${v.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</${tag}>`
  const satirlar = aktarimSatirlari().map(s => `<tr>${s.map((v, i) => hucre(v, i)).join('')}</tr>`).join('')
  w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${dosyaAdi()}</title><style>
    body{font:11px Arial,sans-serif;margin:16px} h1{font-size:14px;margin:0 0 2px} p{margin:0 0 10px;color:#555}
    table{border-collapse:collapse;width:100%} th,td{border:1px solid #bbb;padding:3px 6px;text-align:left} th{background:#eee}
    tr:last-child td{font-weight:bold;background:#f3f3f3}</style></head><body>
    <h1>e-Fatura (${yon.value === 'giden' ? 'Giden' : 'Gelen'}) — ${props.unvan}</h1><p>${props.kod} · ${new Date().toLocaleDateString('tr-TR')} · ${seciliFaturalar.value.length} fatura</p>
    <table><thead><tr>${BASLIKLAR.map((b, i) => hucre(b, i, 'th')).join('')}</tr></thead><tbody>${satirlar}</tbody></table></body></html>`)
  w.document.close()
  w.focus()
  w.print()
}

const tarih = (iso: string) => iso ? iso.split('-').reverse().join('.') : '—'
const tl = (n: number) => '₺' + n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
</script>

<template>
  <div class="efatura">
    <div class="ust">
      <div class="segment" role="tablist">
        <button :class="{ on: yon === 'giden' }" @click="yon = 'giden'">Giden <span>({{ sayilar.giden }})</span></button>
        <button :class="{ on: yon === 'gelen' }" @click="yon = 'gelen'">Gelen <span>({{ sayilar.gelen }})</span></button>
      </div>
    </div>

    <div class="filtre">
      <input v-model="ara" class="alan ara" placeholder="Evrak / fatura no / ETTN">
      <input v-model="baslangic" type="date" class="alan" title="Fatura tarihi (başlangıç)">
      <span class="tire">—</span>
      <input v-model="bitis" type="date" class="alan" title="Fatura tarihi (bitiş)">
      <template v-if="secili.size">
        <button class="islem" @click="excelIndir"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>Excel indir</button>
        <button class="islem" @click="pdfIndir"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>PDF indir</button>
      </template>
      <span class="sayac">
        <template v-if="secili.size"><b>{{ secili.size }}</b> seçili • </template>{{ liste.length }} / {{ tum.length }} kayıt
      </span>
    </div>

    <table>
      <thead>
        <tr>
          <th class="onay"><input type="checkbox" :checked="hepsiSecili" :disabled="!liste.length" @change="hepsiniDegistir"></th>
          <th>Evrak</th>
          <th>Fatura No</th>
          <th>Tip</th>
          <th>Fatura Tarihi</th>
          <th>Oluşturma</th>
          <th>Gönderim</th>
          <th class="sag">Tutar</th>
          <th>Durum</th>
          <th class="sag">İşlem</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="f in liste" :key="f.faturaNo" :class="{ secili: secili.has(f.faturaNo) }">
          <td class="onay"><input type="checkbox" :checked="secili.has(f.faturaNo)" @change="degistir(f.faturaNo)"></td>
          <td class="mono">{{ f.evrak }}</td>
          <td class="mono no">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l5 5v13H6zM14 3v5h5M9 13h6M9 17h6"/></svg>
            {{ f.faturaNo }}
          </td>
          <td>{{ f.tip }}</td>
          <td>{{ tarih(f.faturaTarihi) }}</td>
          <td>{{ tarih(f.olusturma) }}</td>
          <td>{{ tarih(f.gonderim) }}</td>
          <td class="sag tutar">{{ tl(f.tutar) }}</td>
          <td><span class="rozet">{{ f.durum }}</span></td>
          <td class="sag"><button class="detay">Detay</button></td>
        </tr>
        <tr v-if="!liste.length">
          <td colspan="10" class="bos">{{ tum.length ? 'Seçilen kriterlere uygun fatura yok.' : (mukellef ? 'Bu yönde e-fatura bulunmuyor.' : 'Cari e-fatura mükellefi değil.') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.efatura { padding: 14px 16px 16px; }
.ust { margin-bottom: 12px; }
.segment { display: inline-flex; padding: 2px; border: 1px solid var(--cizgi); border-radius: 3px; background: #f3f3f5; }
.segment button { height: 30px; padding: 0 16px; border: 1px solid transparent; border-radius: 2px; background: none; color: #555; font-size: 13.5px; cursor: pointer; }
.segment button span { color: var(--soluk); }
.segment button:hover { color: var(--yazi); }
.segment button.on { background: #fff; border-color: var(--cizgi); color: var(--yazi); font-weight: 600; }

.filtre { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.alan { height: 35px; padding: 0 10px; border: 1px solid var(--cizgi); border-radius: 3px; background: #fff; font-size: 13.5px; outline: none; }
.alan:focus { border-color: #8a8a92; }
.alan.ara { width: 260px; }
.tire { color: var(--soluk); }
.islem { display: inline-flex; align-items: center; gap: 6px; height: 35px; padding: 0 14px; border: 1px solid var(--cizgi); border-radius: 3px; background: #ececee; font-size: 13px; font-weight: 500; cursor: pointer; }
.islem:hover { background: #e3e3e6; }
.sayac { margin-left: auto; color: var(--soluk); font-size: 12.5px; }
.sayac b { color: var(--yazi); }

table { width: 100%; border-collapse: collapse; border: 1px solid var(--cizgi); }
thead th { height: 38px; padding: 0 12px; background: #f3f3f5; text-align: left; font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: #333; }
tbody tr { border-top: 1px solid var(--cizgi); }
tbody tr:nth-child(even) { background: #fafafb; }
tbody tr:hover { background: #f1f1f3; }
tbody tr.secili { background: #fdf3f3; }
td { height: 46px; padding: 0 12px; font-size: 13.5px; }
.onay { width: 40px; padding-right: 0; }
input[type='checkbox'] { width: 15px; height: 15px; accent-color: #3d4a63; cursor: pointer; }
.sag { text-align: right; }
.mono { font-family: var(--mono); font-size: 12.5px; }
.no svg { margin-right: 4px; color: #777; vertical-align: -2px; }
.tutar { font-weight: 500; }
.rozet { display: inline-block; padding: 2px 8px; border-radius: 3px; background: #eeeef0; color: #444; border: 1px solid #e0e0e4; font-size: 11px; font-weight: 600; letter-spacing: .04em; }
.detay { height: 28px; padding: 0 14px; border: 1px solid var(--cizgi); border-radius: 3px; background: #ececee; font-size: 12.5px; font-weight: 500; cursor: pointer; }
.detay:hover { background: #e3e3e6; }
.bos { text-align: center; color: var(--soluk); height: 80px; }
</style>
