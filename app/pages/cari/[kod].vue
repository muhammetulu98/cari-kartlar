<script setup lang="ts">
import { cariDetayi } from '~/utils/cariDetay'

const route = useRoute()
const d = computed(() => cariDetayi(String(route.params.kod)))
const aktif = ref('genel')

const tl = (n: number) => (n < 0 ? '-₺' : '₺') + Math.abs(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const limitDuzenleniyor = ref(false)
const limitMetin = ref('')
const limitGirdisi = ref<HTMLInputElement>()
const limitGuncellendi = ref(false)
let limitZamani: ReturnType<typeof setTimeout>

function limitAc() {
  if (!d.value) return
  limitMetin.value = d.value.cari.limit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false })
  limitDuzenleniyor.value = true
  nextTick(() => limitGirdisi.value?.select())
}
/** "2.000.000,50", "2000000,5" ve "2000000.5" biçimlerini kabul eder. */
function limitCoz(metin: string) {
  const m = metin.trim().replace(/[₺\s]/g, '')
  const n = m.includes(',') ? m.replace(/\./g, '').replace(',', '.') : /^\d+\.\d{1,2}$/.test(m) ? m : m.replace(/\./g, '')
  return Number(n)
}
function limitKaydet() {
  if (!limitDuzenleniyor.value || !d.value) return
  const n = limitCoz(limitMetin.value)
  limitDuzenleniyor.value = false
  if (!Number.isFinite(n) || n < 0 || n === d.value.cari.limit) return
  d.value.cari.limit = Math.round(n * 100) / 100
  limitGuncellendi.value = true
  clearTimeout(limitZamani)
  limitZamani = setTimeout(() => (limitGuncellendi.value = false), 3000)
}

/** Açık limit: kredi limitinden toplam risk (borçlu bakiye + bekleyen sipariş + bekleyen irsaliye) düşülür. */
const acikLimit = computed(() => d.value ? Math.max(d.value.cari.limit - d.value.finans.toplamRisk, 0) : 0)
const riskFoyu = ref(false)
const bugun = new Date().toLocaleDateString('tr-TR')
const limitAsimi = computed(() => d.value && d.value.cari.limit > 0 ? Math.max(d.value.finans.toplamRisk - d.value.cari.limit, 0) : 0)
const netSatis = (ciro: number) => ciro / 1.2

const sekmeler = computed(() => {
  const s = d.value?.sayilar
  return [
    { id: 'genel', ad: 'Genel Bilgi' },
    { id: 'adres', ad: 'Adresler', sayi: s?.adresler },
    { id: 'ekstre', ad: 'Ekstre', sayi: s?.ekstre },
    { id: 'yas', ad: 'Yaşlandırma' },
    { id: 'efatura', ad: 'e-Fatura', sayi: s?.efatura },
    { id: 'finansal', ad: 'Finansal Özet' },
  ]
})
const sekmeAdi = computed(() => sekmeler.value.find(s => s.id === aktif.value)?.ad)
</script>

<template>
  <div v-if="!d" class="sayfa bos-sayfa">
    <p>Cari bulunamadı: {{ route.params.kod }}</p>
    <NuxtLink to="/" class="dugme">← Liste</NuxtLink>
  </div>

  <div v-else class="sayfa">
    <header class="ust">
      <div class="sol">
        <NuxtLink to="/" class="dugme">← Liste</NuxtLink>
        <div class="baslik">
        <h1>{{ d.cari.unvan }}</h1>
        <p>{{ d.cari.kod }} <span class="nokta">•</span> {{ d.cari.sehir }} / {{ d.cari.ilce }}</p>
        </div>
      </div>
      <div class="dugmeler">
        <span v-if="d.cari.kilitli" class="kilitli">Kilitli</span>
      </div>
    </header>

    <section class="ozet">
      <div class="kutu">
        <span class="et">Bakiye</span>
        <div class="deger" :class="{ alacak: d.cari.bakiye < 0, borc: d.cari.bakiye > 0 }">{{ tl(d.cari.bakiye) }}<small>Döviz: {{ d.doviz }}</small></div>
      </div>
      <div class="kutu duzenlenebilir" :class="{ aktif: limitDuzenleniyor }" :title="limitDuzenleniyor ? '' : 'Limiti güncellemek için tıklayın'" @click="!limitDuzenleniyor && limitAc()">
        <span class="et">Kredi Limiti
          <svg v-if="!limitDuzenleniyor" class="kalem-ikon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </span>
        <div v-if="!limitDuzenleniyor" class="deger">{{ tl(d.cari.limit) }}</div>
        <div v-else class="limit-giris">
          <span>₺</span>
          <input ref="limitGirdisi" v-model="limitMetin" inputmode="decimal" @keydown.enter.prevent="limitKaydet" @keydown.esc="limitDuzenleniyor = false" @blur="limitKaydet">
        </div>
        <span v-if="limitDuzenleniyor" class="alt">Enter ile kaydet, Esc ile vazgeç</span>
        <span v-else-if="limitGuncellendi" class="alt tamam">Limit güncellendi</span>
        <span v-else-if="d.cari.limit === 0" class="alt">Limit tanımlı değil</span>
      </div>
      <div class="kutu">
        <span class="et">Açık Limit</span>
        <div class="deger" :class="{ alacak: d.cari.limit > 0 && acikLimit > 0, borc: d.cari.limit > 0 && acikLimit === 0 }">{{ tl(acikLimit) }}</div>
        <span v-if="d.cari.limit === 0" class="alt">Limit tanımlı değil</span>
      </div>
    </section>

    <section class="panel">
      <nav class="sekmeler" role="tablist">
        <button v-for="s in sekmeler" :key="s.id" role="tab" class="sekme" :class="{ on: aktif === s.id }" @click="aktif = s.id">
          {{ s.ad }}<span v-if="s.sayi !== undefined" class="sayi">({{ s.sayi }})</span>
        </button>
      </nav>

      <div v-if="aktif === 'genel'" class="kolonlar">
        <div class="kolon">
          <h3>Kart Bilgileri <button class="kalem" title="Düzenle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button></h3>
          <dl>
            <div><dt>Cari Kod</dt><dd class="mono">{{ d.cari.kod }}</dd></div>
            <div class="cift"><dt>Ünvan</dt><dd>{{ d.cari.unvan }}</dd><dt class="ikinci">Ünvan 2</dt><dd class="ikinci">{{ d.unvan2 }}</dd></div>
            <div><dt>Vergi Dairesi</dt><dd>{{ d.cari.vergiDairesi }} <span class="soluk">({{ d.vergiDairesiKodu }})</span></dd></div>
            <div><dt>Vergi No</dt><dd class="mono">{{ d.cari.vergiNo }}</dd></div>
            <div><dt>Hareket</dt><dd>{{ d.hareket }}</dd></div>
            <div><dt>Grup</dt><dd>{{ d.cari.grup }}</dd></div>
            <div><dt>Bölge</dt><dd>{{ d.bolge }}</dd></div>
            <div><dt>Sektör</dt><dd>{{ d.cari.sektor }}</dd></div>
            <div><dt>Açılış</dt><dd>{{ d.acilis }}</dd></div>
            <div><dt>Son Güncel</dt><dd>{{ d.sonGuncel }} <span class="soluk">• {{ d.sonGuncelleyen }}</span></dd></div>
            <div><dt>e-Fatura</dt><dd>{{ d.eFatura.mukellef ? 'Mükellef' : 'Mükellef değil' }} <span v-if="d.eFatura.mukellef" class="soluk">• {{ d.eFatura.tarih }}'den itibaren</span></dd></div>
          </dl>
        </div>

        <div class="kolon">
          <h3>İletişim &amp; Temsilci <button class="kalem" title="Düzenle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button></h3>
          <dl>
            <div><dt>Temsilci</dt><dd>{{ d.cari.temsilci }} <span class="soluk">({{ d.cari.temsilciNo }})</span></dd></div>
            <div><dt>Telefon</dt><dd>{{ d.telefon || '—' }}</dd></div>
            <div><dt>Cep</dt><dd class="mono">{{ d.cep }}</dd></div>
            <div><dt>E-Posta</dt><dd class="link">{{ d.eposta }}</dd></div>
            <div><dt>Şehir</dt><dd>{{ d.cari.sehir }} / {{ d.cari.ilce }}</dd></div>
          </dl>

          <h3 class="alt-baslik"><span>Yetkililer <span class="sayi">({{ d.yetkililer.length }})</span></span> <button class="kalem" title="Düzenle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button></h3>
          <ul class="yetkililer">
            <li v-for="y in d.yetkililer" :key="y.ad">
              <div class="y-ust"><b>{{ y.ad }}</b><span class="soluk">{{ y.gorev }}</span></div>
              <div class="y-alt"><span class="mono">{{ y.telefon }}</span><span class="link">{{ y.eposta }}</span></div>
            </li>
          </ul>
        </div>

        <div class="kolon">
          <h3>Ticari Koşullar <button class="kalem" title="Düzenle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button></h3>
          <dl>
            <div><dt>Satış İsk.</dt><dd>{{ d.satisIsk }}</dd></div>
            <div><dt>Ödeme Planı</dt><dd>{{ d.odemePlani }}</dd></div>
            <div><dt>Ödeme Cinsi</dt><dd>{{ d.odemeCinsi }}</dd></div>
            <div><dt>Ödeme Şekli</dt><dd>{{ d.odemeSekli }}</dd></div>
            <div><dt>Ticari Statü</dt><dd>{{ d.cari.ticariStatu || '—' }}</dd></div>
          </dl>

          <h3 class="alt-baslik">İstihbarat Bilgisi</h3>
          <p class="istihbarat">{{ d.istihbarat }}</p>
        </div>
      </div>

      <div v-else-if="aktif === 'finansal'" class="kolonlar">
        <div class="kolon">
          <h3>Risk Durumu <span class="etiket">TRY bazında</span></h3>
          <dl>
            <div><dt>Toplam Risk</dt><dd><button class="risk-bagi" title="Cari risk föyünü aç" @click="riskFoyu = true">{{ tl(d.finans.toplamRisk) }}</button></dd></div>
            <div><dt>Açık Limit</dt><dd class="tutar">{{ tl(acikLimit) }}</dd></div>
            <div><dt>Bakiye Gün Sayısı</dt><dd>{{ d.finans.bakiyeGun }} gün</dd></div>
          </dl>
        </div>
        <div class="kolon">
          <h3>Bekleyen Hareketler</h3>
          <dl>
            <div><dt>Bekleyen Sipariş</dt><dd><span class="tutar">{{ tl(d.finans.bekleyenSiparis) }}</span> <a class="rapor">Rapor →</a></dd></div>
            <div><dt>Bekleyen İrsaliye</dt><dd><span class="tutar">{{ tl(d.finans.bekleyenIrsaliye) }}</span> <a class="rapor">Rapor →</a></dd></div>
          </dl>
        </div>
        <div class="kolon">
          <h3>Ciro</h3>
          <dl>
            <div><dt>2026 Ciro</dt><dd><span class="tutar">{{ tl(d.finans.ciro2026) }}</span><small class="alt2">KDV hariç {{ tl(netSatis(d.finans.ciro2026)) }} • iadeler düşülmüş net satış</small></dd></div>
            <div><dt>2025 Ciro</dt><dd><span class="tutar">{{ tl(d.finans.ciro2025) }}</span><small class="alt2">KDV hariç {{ tl(netSatis(d.finans.ciro2025)) }} • iadeler düşülmüş net satış</small></dd></div>
          </dl>
        </div>
      </div>

      <div v-else class="yer-tutucu">
        <b>{{ sekmeAdi }}</b>
        <p>Bu sekme prototipte henüz doldurulmadı.</p>
      </div>
    </section>

    <div v-if="riskFoyu" class="perde" @mousedown.self="riskFoyu = false" @keydown.esc="riskFoyu = false">
      <div class="foy" role="dialog" aria-label="Cari risk föyü" tabindex="-1">
        <header class="foy-ust">
          <span>Cari Risk Föyü</span>
          <button class="kalem" title="Kapat" @click="riskFoyu = false"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
        </header>
        <div class="foy-cari">
          <b>{{ d.cari.unvan }}</b>
          <span class="soluk">{{ d.cari.kod }} • {{ d.doviz }} • {{ bugun }}</span>
        </div>
        <table class="foy-tablo">
          <thead><tr><th>Kalem</th><th>Açıklama</th><th class="sag">Tutar</th></tr></thead>
          <tbody>
            <tr><td>Cari Bakiye</td><td class="soluk">{{ d.cari.bakiye > 0 ? 'Borçlu bakiye' : d.cari.bakiye < 0 ? 'Alacaklı bakiye (riske dahil değil)' : 'Bakiye yok' }}</td><td class="sag">{{ tl(Math.max(d.cari.bakiye, 0)) }}</td></tr>
            <tr><td>Portföydeki Çekler</td><td class="soluk">Tahsile verilmemiş müşteri çekleri</td><td class="sag">{{ tl(d.finans.portfoyCek) }}</td></tr>
            <tr><td>Portföydeki Senetler</td><td class="soluk">Vadesi gelmemiş müşteri senetleri</td><td class="sag">{{ tl(d.finans.portfoySenet) }}</td></tr>
            <tr><td>Bekleyen Sipariş</td><td class="soluk">{{ d.finans.siparisAdet }} sipariş, sevk edilmemiş</td><td class="sag">{{ tl(d.finans.bekleyenSiparis) }}</td></tr>
            <tr><td>Bekleyen İrsaliye</td><td class="soluk">{{ d.finans.irsaliyeAdet }} irsaliye, faturalanmamış</td><td class="sag">{{ tl(d.finans.bekleyenIrsaliye) }}</td></tr>
            <tr class="toplam"><td colspan="2">Toplam Risk</td><td class="sag">{{ tl(d.finans.toplamRisk) }}</td></tr>
            <tr><td colspan="2">Kredi Limiti</td><td class="sag">{{ tl(d.cari.limit) }}</td></tr>
            <tr class="toplam"><td colspan="2">Açık Limit</td><td class="sag" :class="{ yesil: acikLimit > 0 }">{{ tl(acikLimit) }}</td></tr>
            <tr v-if="limitAsimi > 0" class="asim"><td colspan="2">Limit Aşımı</td><td class="sag">{{ tl(limitAsimi) }}</td></tr>
          </tbody>
        </table>
        <footer class="foy-alt">
          <button class="dugme" @click="riskFoyu = false">Kapat</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sayfa { padding: 22px 18px 28px; }
.bos-sayfa { text-align: center; padding-top: 80px; color: var(--soluk); }
.ust { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
h1 { margin: 0; font-size: 20px; font-weight: 600; }
.baslik p { margin: 2px 0 0; color: var(--soluk); font-size: 13px; }
.nokta { margin: 0 4px; }
.sol { display: flex; align-items: center; gap: 14px; min-width: 0; }
.dugmeler { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
.dugme {
  display: inline-flex; align-items: center; height: 36px; padding: 0 18px; text-decoration: none; color: inherit;
  background: #ececee; border: 1px solid var(--cizgi); border-radius: 3px; font-weight: 500; cursor: pointer;
}
.dugme:hover { background: #e3e3e6; }
.kilitli { padding: 2px 8px; border-radius: 3px; background: #fde4e7; color: #c0223f; border: 1px solid #f6c2ca; font-size: 11px; font-weight: 600; }

.ozet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px; }
.kutu { background: var(--card); border: 1px solid var(--cizgi); border-radius: 4px; padding: 12px 16px 14px; min-height: 84px; }
.duzenlenebilir { cursor: pointer; }
.duzenlenebilir:hover { border-color: #b9b9c0; background: #fcfcfd; }
.duzenlenebilir.aktif { cursor: default; background: #fff; border-color: #3d4a63; }
.kalem-ikon { margin-left: 4px; color: #8a8a92; vertical-align: -1px; }
.limit-giris { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 22px; font-weight: 600; }
.limit-giris input { width: 100%; min-width: 0; height: 32px; padding: 0 8px; border: 1px solid #3d4a63; border-radius: 3px; outline: none; background: #fff; font: inherit; }
.alt.tamam { color: #1f7a3e; }
.et { color: #555; font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; }
.deger { margin-top: 8px; font-size: 22px; font-weight: 600; }
.deger small { margin-left: 6px; color: var(--soluk); font-size: 12px; font-weight: 400; }
.deger.alacak { color: #1f7a3e; }
.deger.borc { color: #c0222b; }
.alt { display: block; margin-top: 5px; color: var(--soluk); font-size: 12px; }

.panel { background: var(--card); border: 1px solid var(--cizgi); border-radius: 4px; overflow: hidden; }
.sekmeler { display: flex; gap: 0; padding: 0 8px; background: #f3f3f5; border-bottom: 1px solid var(--cizgi); overflow-x: auto; }
.sekme { padding: 11px 14px 10px; border: 0; border-bottom: 2px solid transparent; background: none; color: #555; font-size: 13.5px; white-space: nowrap; cursor: pointer; }
.sekme:hover { color: var(--yazi); background: #ebebee; }
.sekme.on { color: var(--yazi); font-weight: 600; border-bottom-color: var(--kirmizi); background: #fff; }
.sayi { margin-left: 4px; color: var(--soluk); font-weight: 400; }

.kolonlar { display: grid; grid-template-columns: repeat(3, 1fr); }
.kolon { padding: 0 0 18px; }
.kolon + .kolon { border-left: 1px solid var(--cizgi); }
h3 {
  display: flex; justify-content: space-between; align-items: center; margin: 0; height: 36px; padding: 0 12px 0 16px;
  background: #f3f3f5; border-bottom: 1px solid var(--cizgi);
  font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: #333;
}
.alt-baslik { margin-top: 18px; border-top: 1px solid var(--cizgi); }
.kalem { display: grid; place-items: center; width: 24px; height: 24px; border: 1px solid transparent; border-radius: 3px; background: none; color: #666; cursor: pointer; }
.kalem:hover { background: #fff; border-color: var(--cizgi); color: var(--yazi); }
.kalem svg { stroke-width: 1.8; }
dl { margin: 0; }
dl > div { display: grid; grid-template-columns: 130px 1fr; gap: 12px; align-items: center; min-height: 34px; padding: 4px 16px; border-bottom: 1px solid var(--cizgi); }
dl > div:nth-child(even) { background: #fafafb; }
dl > div.cift { grid-template-columns: 130px 1fr auto 56px; }
.ikinci { padding-left: 14px; border-left: 1px solid var(--cizgi); }
dt { color: var(--soluk); font-size: 12.5px; }
dd { margin: 0; font-size: 13.5px; word-break: break-word; }
.istihbarat { margin: 0; padding: 10px 16px; border-bottom: 1px solid var(--cizgi); font-size: 13.5px; line-height: 1.55; }
.yetkililer { margin: 0; padding: 0; list-style: none; }
.yetkililer li { padding: 8px 16px; border-bottom: 1px solid var(--cizgi); }
.yetkililer li:nth-child(even) { background: #fafafb; }
.y-ust { display: flex; align-items: baseline; gap: 10px; font-size: 13.5px; }
.y-ust b { font-weight: 500; }
.y-alt { display: flex; gap: 18px; margin-top: 2px; font-size: 12.5px; }
.mono { font-family: var(--mono); font-size: 12.5px; }
.soluk { color: #8a8a92; }
.link { color: #2f4a8a; }
.alt2 { display: block; margin-top: 2px; color: var(--soluk); font-size: 11px; }
.rozet { display: inline-block; padding: 1px 7px; border-radius: 3px; font-size: 11px; }
.rozet.gri { background: #eeeef0; color: #444; border: 1px solid #e0e0e4; font-weight: 500; }
.etiket { padding: 1px 7px; border: 1px solid var(--cizgi); border-radius: 3px; background: #fff; color: #555; font-family: 'Figtree', sans-serif; font-size: 11px; letter-spacing: 0; text-transform: none; }
.tutar { font-weight: 600; }
.rapor { margin-left: 10px; color: #2f4a8a; font-size: 12px; text-decoration: none; cursor: pointer; }
.rapor:hover { text-decoration: underline; }
.risk-bagi { padding: 0; border: 0; border-bottom: 1px dashed #8a8a92; background: none; font: inherit; font-weight: 600; color: var(--yazi); cursor: pointer; }
.risk-bagi:hover { color: var(--kirmizi); border-bottom-color: var(--kirmizi); }
.perde { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; background: rgba(20, 24, 33, .45); padding: 20px; }
.foy { width: 640px; max-width: 100%; background: #fff; border: 1px solid var(--cizgi); border-radius: 4px; box-shadow: 0 20px 60px rgba(0, 0, 0, .3); outline: none; }
.foy-ust { display: flex; justify-content: space-between; align-items: center; height: 36px; padding: 0 10px 0 16px; background: #f3f3f5; border-bottom: 1px solid var(--cizgi); font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; }
.foy-cari { display: flex; flex-direction: column; gap: 2px; padding: 12px 16px; border-bottom: 1px solid var(--cizgi); font-size: 14px; }
.foy-cari .soluk { font-size: 12px; }
.foy-tablo { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.foy-tablo th { height: 32px; padding: 0 16px; background: #fafafb; border-bottom: 1px solid var(--cizgi); text-align: left; font-family: var(--mono); font-size: 10.5px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: #555; }
.foy-tablo th.sag { text-align: right; }
.foy-tablo td { height: 34px; padding: 0 16px; border-bottom: 1px solid var(--cizgi); }
.foy-tablo td.sag { text-align: right; font-variant-numeric: tabular-nums; }
.foy-tablo td.yesil { color: #1f7a3e; }
.foy-tablo tr.toplam td { background: #f3f3f5; font-weight: 600; }
.foy-tablo tr.asim td { color: #c0222b; font-weight: 600; }
.foy-alt { display: flex; justify-content: flex-end; padding: 12px 16px; }
.yer-tutucu { padding: 60px 20px; text-align: center; color: var(--soluk); }
.yer-tutucu b { display: block; margin-bottom: 4px; color: var(--yazi); font-size: 16px; }
.yer-tutucu p { margin: 0; }
@media (max-width: 1100px) { .ozet { grid-template-columns: repeat(2, 1fr); } .kolonlar { grid-template-columns: 1fr; } .kolon + .kolon { border-left: 0; border-top: 1px solid var(--cizgi); } }
</style>
