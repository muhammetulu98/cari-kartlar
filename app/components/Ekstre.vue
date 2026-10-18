<script setup lang="ts">
import { ekstreHareketleri, type EkstreHareket } from '~/utils/ekstreVeri'

const props = defineProps<{ kod: string, unvan: string, eposta: string, bakiye: number }>()

const { acilis, hareketler } = ekstreHareketleri(props.kod, props.bakiye)
const VARSAYILAN = { baslangic: '2026-01-01', bitis: '2026-12-31' }

const tip = ref('')
const baslangic = ref(VARSAYILAN.baslangic)
const bitis = ref(VARSAYILAN.bitis)
const acik = ref<Set<string>>(new Set())

const tipler = [...new Set(hareketler.map(h => h.tip))]
const tarihFiltresi = (iso: string) => (!baslangic.value || iso >= baslangic.value) && (!bitis.value || iso <= bitis.value)

/** Aralığın başındaki devir: aralıktan önceki hareketlerin son bakiyesi (hiç yoksa açılış bakiyesi). */
const devir = computed(() => {
  if (!baslangic.value) return null
  const onceki = hareketler.filter(h => h.tarih < baslangic.value)
  const tutar = onceki.length ? onceki[onceki.length - 1]!.bakiye : acilis
  return tutar === 0 ? null : tutar
})
const liste = computed(() => hareketler.filter(h =>
  tarihFiltresi(h.tarih) && (!tip.value || h.tip === tip.value),
))
const toplamBorc = computed(() => liste.value.reduce((a, h) => a + h.borc, 0) + (devir.value && devir.value > 0 ? devir.value : 0))
const toplamAlacak = computed(() => liste.value.reduce((a, h) => a + h.alacak, 0) + (devir.value && devir.value < 0 ? -devir.value : 0))

const aralik = computed(() => baslangic.value || bitis.value ? `${tarih(baslangic.value) || '…'} — ${tarih(bitis.value) || '…'}` : 'Tüm tarihler')
const tarih = (iso: string) => iso ? iso.split('-').reverse().join('.') : ''
const tl = (n: number) => (n < 0 ? '-₺' : '₺') + Math.abs(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const yuzde = (n: number) => n ? `%${n}` : '—'
const degistir = (id: string) => { const s = new Set(acik.value); s.has(id) ? s.delete(id) : s.add(id); acik.value = s }
const genislet = (h: EkstreHareket) => h.kalemler.length > 0 || h.detay.length > 0

function tumTarihler() { baslangic.value = ''; bitis.value = '' }
function sifirla() { tip.value = ''; baslangic.value = VARSAYILAN.baslangic; bitis.value = VARSAYILAN.bitis; acik.value = new Set() }

// ---- Excel (CSV) ----
const kacis = (v: string) => /[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
const ondalik = (n: number) => n ? n.toFixed(2).replace('.', ',') : ''
function excelIndir(detayli: boolean) {
  excelMenu.value = false
  const baslik = ['Tarih', 'Evrak', 'Belge', 'Tip', 'Açıklama', 'Vade', 'Borç', 'Alacak', 'Yürüyen Bakiye']
  const kalemBaslik = ['Stok Kodu', 'Stok Adı', 'Miktar', 'B.Fiyat', 'İsk 1', 'İsk 2', 'İsk 3', 'İsk 4', 'Net B.Fiyat', 'Net Tutar']
  const bos = kalemBaslik.map(() => '')
  const satirlar: string[][] = []
  const ekle = (temel: string[], kalem: string[] = bos) => satirlar.push(detayli ? [...temel, ...kalem] : temel)
  if (devir.value !== null) ekle([tarih(baslangic.value), '', '', 'Devir', 'Önceki dönemden devreden bakiye', tarih(baslangic.value), ondalik(Math.max(devir.value, 0)), ondalik(Math.max(-devir.value, 0)), ondalik(devir.value)])
  for (const h of liste.value) {
    ekle([tarih(h.tarih), h.evrak, h.belge, h.tip, h.aciklama, tarih(h.vade), ondalik(h.borc), ondalik(h.alacak), ondalik(h.bakiye)])
    if (detayli) {
      for (const k of h.kalemler) {
        ekle(['', h.evrak, '', 'Kalem', '', '', '', '', ''], [k.stokKodu, k.stokAdi, `${k.miktar} ${k.birim}`, ondalik(k.fiyat), ...k.isk.map(i => (i ? `%${i}` : '')), ondalik(k.netFiyat), ondalik(k.netTutar)])
      }
    }
  }
  ekle(['Toplam', '', '', '', '', '', ondalik(toplamBorc.value), ondalik(toplamAlacak.value), ''])
  const icerik = [detayli ? [...baslik, ...kalemBaslik] : baslik, ...satirlar].map(s => s.map(kacis).join(';')).join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + icerik], { type: 'text/csv;charset=utf-8' }))
  a.download = `ekstre${detayli ? '-detayli' : ''}-${props.kod}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
const excelMenu = ref(false)
function menuDisiTikla(e: MouseEvent) { if (!(e.target as HTMLElement).closest('.excel-kap')) excelMenu.value = false }
onMounted(() => document.addEventListener('click', menuDisiTikla))
onBeforeUnmount(() => document.removeEventListener('click', menuDisiTikla))

// ---- Mail ----
const mailAcik = ref(false)
const mailAdres = ref('')
const mailGonderildi = ref(false)
function mailAc() { mailAdres.value = props.eposta; mailGonderildi.value = false; mailAcik.value = true }
const mailGecerli = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailAdres.value.trim()))
function mailGonder() { if (mailGecerli.value) mailGonderildi.value = true }
</script>

<template>
  <div class="ekstre">
    <div class="filtre">
      <label class="alan"><span>Hareket Tipi</span>
        <select v-model="tip"><option value="">Tümü</option><option v-for="t in tipler" :key="t">{{ t }}</option></select></label>
      <label class="alan"><span>Başlangıç</span><input v-model="baslangic" type="date"></label>
      <label class="alan"><span>Bitiş</span><input v-model="bitis" type="date"></label>
      <button class="duz" @click="tumTarihler">Tüm Tarihler</button>
      <button class="duz" @click="sifirla">Sıfırla</button>
    </div>
    <div class="ozet">
      <span><b>{{ liste.length }}</b> hareket gösteriliyor <span class="soluk">/ Toplam {{ hareketler.length }}</span></span>
      <span class="soluk">Aralık: {{ aralik }}</span>
      <span class="bosluk" />
      <div class="excel-kap">
        <button class="islem" :disabled="!liste.length" :aria-expanded="excelMenu" @click="excelMenu = !excelMenu">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>Excel İndir
        </button>
        <div v-if="excelMenu" class="menu" role="menu">
          <button role="menuitem" @click="excelIndir(false)"><b>Cari Ekstre</b><small>Yalnızca cari hareketler</small></button>
          <button role="menuitem" @click="excelIndir(true)"><b>Detaylı Cari Ekstre</b><small>Her evrağın stok kalemleri satırın altında</small></button>
        </div>
      </div>
      <button class="islem" @click="mailAc">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>Ekstre Mail Gönder
      </button>
    </div>

    <table>
      <thead>
        <tr>
          <th class="ok" /><th>Tarih</th><th>Evrak</th><th>Belge</th><th>Tip</th><th>Açıklama</th><th>Vade</th>
          <th class="sag">Borç</th><th class="sag">Alacak</th><th class="sag">Yürüyen Bakiye</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="devir !== null" class="devir">
          <td class="ok" /><td>{{ tarih(baslangic) }}</td><td class="soluk">—</td><td class="soluk">—</td>
          <td><span class="tip">Devir</span></td><td>Önceki dönemden devreden bakiye</td><td>{{ tarih(baslangic) }}</td>
          <td class="sag">{{ devir > 0 ? tl(devir) : '—' }}</td><td class="sag">{{ devir < 0 ? tl(-devir) : '—' }}</td>
          <td class="sag bakiye" :class="{ borc: devir > 0, alacak: devir < 0 }">{{ tl(devir) }}</td>
        </tr>
        <template v-for="h in liste" :key="h.id">
          <tr :class="{ acik: acik.has(h.id) }" @click="genislet(h) && degistir(h.id)">
            <td class="ok">
              <svg class="ok-ikon" :class="{ don: acik.has(h.id) }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>
            </td>
            <td>{{ tarih(h.tarih) }}</td>
            <td>
              <div class="mono">{{ h.evrak }}</div>
              <div v-if="h.kalemler.length" class="alt">{{ h.kalemler.length }} kalem</div>
            </td>
            <td class="mono belge">
              <template v-if="h.belge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l5 5v13H6zM14 3v5h5M9 13h6M9 17h6"/></svg>{{ h.belge }}
              </template>
              <span v-else class="soluk">—</span>
            </td>
            <td><span class="tip">{{ h.tip }}</span></td>
            <td>
              <div>{{ h.aciklama }}</div>
              <div v-if="h.altAciklama" class="alt">{{ h.altAciklama }}</div>
            </td>
            <td>{{ tarih(h.vade) }}</td>
            <td class="sag">{{ h.borc ? tl(h.borc) : '—' }}</td>
            <td class="sag alacak-tutar">{{ h.alacak ? tl(h.alacak) : '—' }}</td>
            <td class="sag bakiye" :class="{ borc: h.bakiye > 0, alacak: h.bakiye < 0 }">{{ tl(h.bakiye) }}</td>
          </tr>
          <tr v-if="acik.has(h.id)" class="detay">
            <td />
            <td colspan="9">
              <table v-if="h.kalemler.length" class="kalem">
                <thead>
                  <tr><th>Stok Kodu</th><th>Stok Adı</th><th class="sag">Miktar</th><th class="sag">B.Fiyat</th><th class="sag">İsk 1</th><th class="sag">İsk 2</th><th class="sag">İsk 3</th><th class="sag">İsk 4</th><th class="sag">Net B.Fiyat</th><th class="sag">Net Tutar</th></tr>
                </thead>
                <tbody>
                  <tr v-for="(k, i) in h.kalemler" :key="i">
                    <td class="mono">{{ k.stokKodu }}</td><td>{{ k.stokAdi }}</td><td class="sag">{{ k.miktar }} {{ k.birim }}</td><td class="sag">{{ tl(k.fiyat) }}</td>
                    <td v-for="(s, j) in k.isk" :key="j" class="sag">{{ yuzde(s) }}</td>
                    <td class="sag">{{ tl(k.netFiyat) }}</td><td class="sag">{{ tl(k.netTutar) }}</td>
                  </tr>
                </tbody>
              </table>
              <dl class="bilgi">
                <div v-for="d in h.detay" :key="d.ad"><dt>{{ d.ad }}</dt><dd>{{ /^\d+\.\d{2}$/.test(d.deger) ? tl(Number(d.deger)) : d.deger }}</dd></div>
              </dl>
            </td>
          </tr>
        </template>
        <tr v-if="!liste.length && devir === null"><td colspan="10" class="bos">Seçilen kriterlere uygun hareket yok.</td></tr>
      </tbody>
      <tfoot v-if="liste.length || devir !== null">
        <tr><td colspan="7">Toplam</td><td class="sag">{{ tl(toplamBorc) }}</td><td class="sag">{{ tl(toplamAlacak) }}</td><td /></tr>
      </tfoot>
    </table>

    <div v-if="mailAcik" class="perde" @mousedown.self="mailAcik = false" @keydown.esc="mailAcik = false">
      <div class="pencere" role="dialog" aria-label="Ekstre mail gönder">
        <header><span>Ekstre Mail Gönder</span><button class="kapat" @click="mailAcik = false">×</button></header>
        <div class="govde">
          <template v-if="!mailGonderildi">
            <p class="soluk">{{ unvan }} ekstresi ({{ aralik }}, {{ liste.length }} hareket) e-posta ile gönderilir.</p>
            <label class="alan"><span>Alıcı e-posta</span><input v-model="mailAdres" type="email" placeholder="ornek@firma.com" @keydown.enter="mailGonder"></label>
          </template>
          <p v-else class="tamam">Ekstre {{ mailAdres }} adresine gönderildi. <span class="soluk">(Prototip: gerçek e-posta gönderilmez.)</span></p>
        </div>
        <footer>
          <button class="dugme" @click="mailAcik = false">{{ mailGonderildi ? 'Kapat' : 'Vazgeç' }}</button>
          <button v-if="!mailGonderildi" class="dugme birincil" :disabled="!mailGecerli" @click="mailGonder">Gönder</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ekstre { padding: 14px 16px 16px; }
.filtre { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
.alan { display: flex; flex-direction: column; gap: 4px; }
.alan span { color: var(--soluk); font-family: var(--mono); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; }
.alan select, .alan input { height: 35px; min-width: 190px; padding: 0 10px; border: 1px solid var(--cizgi); border-radius: 3px; background: #fff; font-size: 13.5px; outline: none; }
.alan select:focus, .alan input:focus { border-color: #8a8a92; }
input[type='checkbox'] { width: 15px; height: 15px; accent-color: #3d4a63; cursor: pointer; }
.duz { height: 35px; padding: 0 10px; border: 0; background: none; color: #444; font-size: 13.5px; cursor: pointer; }
.duz:hover { color: var(--kirmizi); }
.ozet { display: flex; align-items: center; gap: 18px; padding: 8px 0 12px; border-bottom: 1px solid var(--cizgi); margin-bottom: 12px; font-size: 12.5px; }
.bosluk { flex: 1; }
.soluk { color: var(--soluk); }
.excel-kap { position: relative; }
.menu { position: absolute; z-index: 30; right: 0; top: 38px; width: 300px; padding: 4px; background: #fff; border: 1px solid var(--cizgi); border-radius: 4px; box-shadow: 0 8px 24px rgba(0, 0, 0, .14); }
.menu button { display: block; width: 100%; padding: 8px 12px; border: 0; border-radius: 3px; background: none; text-align: left; cursor: pointer; }
.menu button:hover { background: #f3f3f5; }
.menu b { display: block; font-size: 13.5px; font-weight: 500; }
.menu small { display: block; margin-top: 2px; color: var(--soluk); font-size: 12px; }
.islem { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border: 1px solid var(--cizgi); border-radius: 3px; background: #ececee; font-size: 13px; font-weight: 500; cursor: pointer; }
.islem:hover:not(:disabled) { background: #e3e3e6; }
.islem:disabled { opacity: .45; cursor: not-allowed; }

table { width: 100%; border-collapse: collapse; border: 1px solid var(--cizgi); }
thead th { height: 38px; padding: 0 12px; background: #f3f3f5; text-align: left; font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: #333; }
tbody > tr { border-top: 1px solid var(--cizgi); cursor: default; }
tbody > tr:not(.detay):not(.devir) { cursor: pointer; }
tbody > tr:nth-child(even):not(.detay) { background: #fafafb; }
tbody > tr:hover:not(.detay) { background: #f1f1f3; }
tbody > tr.devir { background: #f7f7f9; }
td { padding: 8px 12px; font-size: 13.5px; vertical-align: middle; }
.ok { width: 34px; padding: 0 0 0 12px; }
.ok-ikon { color: #777; transition: transform .15s; vertical-align: middle; }
.ok-ikon.don { transform: rotate(90deg); }
.sag { text-align: right; }
.mono { font-family: var(--mono); font-size: 12.5px; }
.alt { margin-top: 2px; color: var(--soluk); font-size: 11.5px; }
.belge svg { margin-right: 4px; color: #777; vertical-align: -2px; }
.tip { display: inline-block; padding: 2px 8px; border-radius: 3px; background: #eeeef0; color: #444; border: 1px solid #e0e0e4; font-size: 11px; font-weight: 600; }
.alacak-tutar { color: #1f7a3e; }
.bakiye { font-weight: 500; }
.bakiye.borc { color: #c0222b; }
.bakiye.alacak { color: #1f7a3e; }
.bos { text-align: center; color: var(--soluk); height: 80px; }
tfoot td { height: 38px; padding: 0 12px; background: #f3f3f5; border-top: 1px solid var(--cizgi); font-weight: 600; font-size: 13.5px; }

.detay > td { padding: 0; background: #fafafb; }
.detay > td:last-child { padding: 10px 12px 14px 12px; }
.kalem { border: 1px solid var(--cizgi); background: #fff; }
.kalem th { height: 30px; font-size: 10.5px; padding: 0 10px; }
.kalem td { padding: 6px 10px; font-size: 13px; border-top: 1px solid var(--cizgi); }
.bilgi { display: flex; gap: 28px; margin: 10px 0 0; }
.bilgi dt { color: var(--soluk); font-size: 11.5px; }
.bilgi dd { margin: 2px 0 0; font-size: 13.5px; font-weight: 500; }

.perde { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; background: rgba(20, 24, 33, .45); padding: 20px; }
.pencere { width: 460px; max-width: 100%; background: #fff; border: 1px solid var(--cizgi); border-radius: 4px; box-shadow: 0 20px 60px rgba(0, 0, 0, .3); }
.pencere header { display: flex; justify-content: space-between; align-items: center; height: 36px; padding: 0 8px 0 16px; background: #f3f3f5; border-bottom: 1px solid var(--cizgi); font-family: var(--mono); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
.kapat { width: 24px; height: 24px; border: 0; background: none; font-size: 18px; cursor: pointer; color: #666; }
.govde { padding: 16px; }
.govde p { margin: 0 0 12px; font-size: 13px; }
.govde .alan input { width: 100%; }
.tamam { color: #1f7a3e; font-weight: 500; }
.pencere footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--cizgi); background: #fafafb; }
.dugme { height: 34px; padding: 0 18px; border: 1px solid var(--cizgi); border-radius: 3px; background: #ececee; font-weight: 500; cursor: pointer; }
.dugme.birincil { background: var(--kirmizi); border-color: var(--kirmizi); color: #fff; }
.dugme:disabled { opacity: .45; cursor: not-allowed; }
</style>
