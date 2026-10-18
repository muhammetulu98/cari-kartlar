<script setup lang="ts">
import { cariler, type Cari } from '~/utils/cariVeri'
import { adresAgaci, bolgeler, gruplar, sektorler, vergiDaireleri } from '~/utils/adresVeri'

const sekme = ref<'hizli' | 'detayli'>('hizli')

const f = reactive({
  unvan: '', sahis: false, vergiNo: '', vergiDairesi: '',
  cep: '', eposta: '',
  bolge: '', grup: '', sektor: '',
  il: '', ilce: '', semt: '', mahalle: '', posta: '', cadde: '', sokak: '',
})
const dokunuldu = reactive<Record<string, boolean>>({})
const dokun = (k: string) => { dokunuldu[k] = true }

const ilceler = computed(() => Object.keys(adresAgaci[f.il] ?? {}))
const semtler = computed(() => Object.keys(adresAgaci[f.il]?.[f.ilce] ?? {}))
const mahalleler = computed(() => Object.keys(adresAgaci[f.il]?.[f.ilce]?.[f.semt] ?? {}))
const postaKodlari = computed(() => { const p = adresAgaci[f.il]?.[f.ilce]?.[f.semt]?.[f.mahalle]; return p ? [p] : [] })

// Üst seçim değişince alttakiler sıfırlanır
watch(() => f.il, () => { f.ilce = ''; f.semt = ''; f.mahalle = ''; f.posta = '' })
watch(() => f.ilce, () => { f.semt = ''; f.mahalle = ''; f.posta = '' })
watch(() => f.semt, () => { f.mahalle = ''; f.posta = '' })
watch(() => f.mahalle, () => { f.posta = postaKodlari.value[0] ?? '' })
watch(() => f.sahis, () => { f.vergiNo = '' })

const vergiUzunluk = computed(() => f.sahis ? 11 : 10)
const rakam = (s: string) => s.replace(/\D/g, '')

const hatalar = computed<Record<string, string>>(() => {
  const h: Record<string, string> = {}
  if (!f.unvan.trim()) h.unvan = 'Ünvan zorunlu'
  if (rakam(f.vergiNo).length !== vergiUzunluk.value) h.vergiNo = `${vergiUzunluk.value} haneli olmalı`
  if (!/^5\d{9}$/.test(rakam(f.cep))) h.cep = '5 ile başlayan 10 hane girin'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.eposta.trim())) h.eposta = 'Geçerli e-posta girin'
  for (const [k, ad] of [['bolge', 'Bölge'], ['grup', 'Grup'], ['sektor', 'Sektör'], ['il', 'İl'], ['ilce', 'İlçe'], ['semt', 'Semt'], ['mahalle', 'Mahalle'], ['posta', 'Posta kodu']] as const) {
    if (!f[k]) h[k] = `${ad} seçin`
  }
  return h
})
const gecerli = computed(() => Object.keys(hatalar.value).length === 0)
const hata = (k: string) => dokunuldu[k] ? hatalar.value[k] : ''

// Vergi dairesi: en az 2 karakter yazılınca öneri listesi
const vdAcik = ref(false)
const vdOneri = computed(() => {
  const q = f.vergiDairesi.trim().toLocaleLowerCase('tr')
  return q.length < 2 ? [] : vergiDaireleri.filter(v => v.toLocaleLowerCase('tr').includes(q)).slice(0, 8)
})
const vdSec = (v: string) => { f.vergiDairesi = v; vdAcik.value = false }

function sonrakiKod() {
  const sayilar = cariler.filter(c => c.kod.startsWith('120.00.')).map(c => Number(c.kod.split('.')[2]))
  return `120.00.${String(Math.max(...sayilar) + 1).padStart(6, '0')}`
}

function ac() {
  Object.keys(hatalar.value).forEach(dokun)
  ;['unvan', 'vergiNo', 'cep', 'eposta'].forEach(dokun)
  if (!gecerli.value) return
  const kod = sonrakiKod()
  const yeni: Cari = {
    kod, unvan: f.unvan.trim().toLocaleUpperCase('tr'), vergiNo: rakam(f.vergiNo), vergiDairesi: f.vergiDairesi.trim() || '—',
    telefon: rakam(f.cep), grup: f.grup, sektor: f.sektor, sehir: f.il, ilce: f.ilce,
    temsilci: 'MAĞAZA', temsilciNo: '—', limit: 1, bakiye: 0, durum: 'AKTİF', ticariStatu: '', kilitli: false,
  }
  cariler.unshift(yeni)
  navigateTo(`/cari/${encodeURIComponent(kod)}`)
}
</script>

<template>
  <div class="sayfa">
    <header class="ust">
      <div class="sol">
        <NuxtLink to="/" class="dugme">← Liste</NuxtLink>
        <div>
          <h1>Yeni Cari Kart</h1>
          <p>Kod 120.ERP serisinden otomatik verilir; kayıt Mikro senkron kuyruğuna girer.</p>
        </div>
      </div>
    </header>

    <section class="panel">
      <nav class="sekmeler" role="tablist">
        <button role="tab" class="sekme" :class="{ on: sekme === 'hizli' }" @click="sekme = 'hizli'">Hızlı</button>
        <button role="tab" class="sekme" :class="{ on: sekme === 'detayli' }" @click="sekme = 'detayli'">Detaylı</button>
        <span v-if="sekme === 'hizli'" class="ipucu">Kasa/showroom: az alanla aç, ticari koşulları sunucu varsayılanlarıyla doldur.</span>
      </nav>

      <div v-if="sekme === 'detayli'" class="yer-tutucu">
        <b>Detaylı kart</b>
        <p>Bu görünüm prototipte henüz doldurulmadı.</p>
      </div>

      <div v-else class="govde">
        <section class="bolum">
          <h3>Kimlik</h3>
          <div class="izgara iki-bir">
            <label class="alan" :class="{ hatali: hata('unvan') }">
              <span>Ünvan <em>*</em></span>
              <input v-model="f.unvan" placeholder="Cari hesap ünvanı" @blur="dokun('unvan')">
              <small v-if="hata('unvan')">{{ hata('unvan') }}</small>
            </label>
            <label class="onay"><input v-model="f.sahis" type="checkbox"> Şahıs firması (TC)</label>
          </div>
          <div class="izgara iki">
            <label class="alan" :class="{ hatali: hata('vergiNo') }">
              <span>{{ f.sahis ? 'TC No' : 'Vergi No' }} <em>*</em> <i>({{ vergiUzunluk }} hane)</i></span>
              <input v-model="f.vergiNo" class="mono" inputmode="numeric" :maxlength="vergiUzunluk" :placeholder="'0'.repeat(vergiUzunluk)" @blur="dokun('vergiNo')">
              <small v-if="hata('vergiNo')">{{ hata('vergiNo') }}</small>
            </label>
            <div class="alan vd">
              <span>Vergi Dairesi</span>
              <input v-model="f.vergiDairesi" placeholder="Vergi dairesi adı veya kodu (en az 2 karakter)..." @focus="vdAcik = true" @input="vdAcik = true" @blur="setTimeout(() => (vdAcik = false), 120)">
              <ul v-if="vdAcik && vdOneri.length" class="oneri">
                <li v-for="v in vdOneri" :key="v" @mousedown.prevent="vdSec(v)">{{ v }}</li>
              </ul>
            </div>
          </div>
        </section>

        <section class="bolum">
          <h3>İletişim</h3>
          <div class="izgara iki">
            <label class="alan" :class="{ hatali: hata('cep') }">
              <span>Yetkili Cep Tel <em>*</em> <i>(10 hane)</i></span>
              <input v-model="f.cep" class="mono" inputmode="numeric" maxlength="10" placeholder="5xxxxxxxxx" @blur="dokun('cep')">
              <small v-if="hata('cep')">{{ hata('cep') }}</small>
            </label>
            <label class="alan" :class="{ hatali: hata('eposta') }">
              <span>E-Posta <em>*</em></span>
              <input v-model="f.eposta" type="email" placeholder="ornek@firma.com" @blur="dokun('eposta')">
              <small v-if="hata('eposta')">{{ hata('eposta') }}</small>
            </label>
          </div>
        </section>

        <section class="bolum">
          <h3>Sınıflandırma</h3>
          <div class="izgara uc">
            <label class="alan" :class="{ hatali: hata('bolge') }">
              <span>Bölge <em>*</em></span>
              <select v-model="f.bolge" @blur="dokun('bolge')"><option value="" disabled>Bölge seçin</option><option v-for="b in bolgeler" :key="b">{{ b }}</option></select>
              <small v-if="hata('bolge')">{{ hata('bolge') }}</small>
            </label>
            <label class="alan" :class="{ hatali: hata('grup') }">
              <span>Grup <em>*</em></span>
              <select v-model="f.grup" @blur="dokun('grup')"><option value="" disabled>Grup seçin</option><option v-for="g in gruplar" :key="g">{{ g }}</option></select>
              <small v-if="hata('grup')">{{ hata('grup') }}</small>
            </label>
            <label class="alan" :class="{ hatali: hata('sektor') }">
              <span>Sektör <em>*</em></span>
              <select v-model="f.sektor" @blur="dokun('sektor')"><option value="" disabled>Sektör seçin</option><option v-for="s in sektorler" :key="s">{{ s }}</option></select>
              <small v-if="hata('sektor')">{{ hata('sektor') }}</small>
            </label>
          </div>
        </section>

        <section class="bolum">
          <h3>Adres</h3>
          <div class="izgara uc">
            <label class="alan" :class="{ hatali: hata('il') }">
              <span>İl <em>*</em></span>
              <select v-model="f.il" @blur="dokun('il')"><option value="" disabled>İl seçin</option><option v-for="i in Object.keys(adresAgaci)" :key="i">{{ i }}</option></select>
              <small v-if="hata('il')">{{ hata('il') }}</small>
            </label>
            <label class="alan" :class="{ hatali: hata('ilce') }">
              <span>İlçe <em>*</em></span>
              <select v-model="f.ilce" :disabled="!f.il" @blur="dokun('ilce')"><option value="" disabled>{{ f.il ? 'İlçe seçin' : 'Önce il' }}</option><option v-for="i in ilceler" :key="i">{{ i }}</option></select>
              <small v-if="hata('ilce')">{{ hata('ilce') }}</small>
            </label>
            <label class="alan" :class="{ hatali: hata('semt') }">
              <span>Semt <em>*</em></span>
              <select v-model="f.semt" :disabled="!f.ilce" @blur="dokun('semt')"><option value="" disabled>{{ f.ilce ? 'Semt seçin' : 'Önce ilçe' }}</option><option v-for="s in semtler" :key="s">{{ s }}</option></select>
              <small v-if="hata('semt')">{{ hata('semt') }}</small>
            </label>
            <label class="alan" :class="{ hatali: hata('mahalle') }">
              <span>Mahalle <em>*</em></span>
              <select v-model="f.mahalle" :disabled="!f.semt" @blur="dokun('mahalle')"><option value="" disabled>{{ f.semt ? 'Mahalle seçin' : 'Önce semt' }}</option><option v-for="m in mahalleler" :key="m">{{ m }}</option></select>
              <small v-if="hata('mahalle')">{{ hata('mahalle') }}</small>
            </label>
            <label class="alan" :class="{ hatali: hata('posta') }">
              <span>Posta Kodu <em>*</em></span>
              <select v-model="f.posta" :disabled="!f.mahalle" @blur="dokun('posta')"><option value="" disabled>{{ f.mahalle ? 'Posta kodu seçin' : 'Önce mahalle' }}</option><option v-for="p in postaKodlari" :key="p">{{ p }}</option></select>
              <small v-if="hata('posta')">{{ hata('posta') }}</small>
            </label>
            <label class="alan"><span>Cadde</span><input v-model="f.cadde" placeholder="Cadde"></label>
            <label class="alan"><span>Sokak</span><input v-model="f.sokak" placeholder="Sokak"></label>
          </div>
        </section>
      </div>

      <footer class="alt">
        <p>Temsilci <code>MAĞAZA</code>, iskonto <code>T1</code>, muhasebe kodu <code>120.01.01.001</code> ve <code>1 ₺</code> limit otomatik atanır.</p>
        <div class="dugmeler">
          <NuxtLink to="/" class="dugme">Vazgeç</NuxtLink>
          <button class="dugme birincil" :disabled="!gecerli || sekme === 'detayli'" @click="ac">Cariyi Aç</button>
        </div>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.sayfa { padding: 18px 18px 28px; }
.ust { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
.sol { display: flex; align-items: center; gap: 14px; }
h1 { margin: 0; font-size: 20px; font-weight: 600; }
.ust p { margin: 2px 0 0; color: var(--soluk); font-size: 13px; }
.dugme {
  display: inline-flex; align-items: center; height: 36px; padding: 0 18px; text-decoration: none; color: inherit;
  background: #ececee; border: 1px solid var(--cizgi); border-radius: 3px; font-weight: 500; cursor: pointer;
}
.dugme:hover { background: #e3e3e6; }
.dugme.birincil { background: var(--kirmizi); border-color: var(--kirmizi); color: #fff; }
.dugme.birincil:hover:not(:disabled) { background: #bf2024; }
.dugme:disabled { opacity: .45; cursor: not-allowed; }

.panel { background: var(--card); border: 1px solid var(--cizgi); border-radius: 4px; overflow: visible; }
.sekmeler { display: flex; align-items: center; gap: 0; padding: 0 8px; background: #f3f3f5; border-bottom: 1px solid var(--cizgi); border-radius: 4px 4px 0 0; }
.sekme { padding: 11px 16px 10px; border: 0; border-bottom: 2px solid transparent; background: none; color: #555; font-size: 14px; cursor: pointer; }
.sekme:hover { color: var(--yazi); background: #ebebee; }
.sekme.on { color: var(--yazi); font-weight: 600; border-bottom-color: var(--kirmizi); background: #fff; }
.ipucu { margin-left: auto; padding-right: 12px; color: var(--soluk); font-size: 12.5px; }

.govde { padding: 6px 28px 10px; }
.bolum { padding: 20px 0 22px; border-bottom: 1px solid #efeff2; }
.bolum:last-child { border-bottom: 0; }
h3 { margin: 0 0 12px; font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: #333; }
.izgara { display: grid; gap: 14px 20px; margin-bottom: 14px; align-items: start; }
.izgara:last-child { margin-bottom: 0; }
.iki { grid-template-columns: 1fr 1fr; }
.iki-bir { grid-template-columns: 1fr auto; align-items: end; }
.uc { grid-template-columns: repeat(3, 1fr); }

.alan { position: relative; display: flex; flex-direction: column; gap: 5px; }
.alan > span { color: #333; font-size: 13px; font-weight: 500; }
.alan em { color: var(--kirmizi); font-style: normal; }
.alan i { color: var(--soluk); font-style: normal; }
.alan input, .alan select {
  height: 35px; padding: 0 10px; background: #fff; border: 1px solid var(--cizgi); border-radius: 3px; outline: none; font-size: 14px;
}
.alan select { appearance: none; padding-right: 30px; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 11px center; }
.alan select:invalid, .alan select:has(option[value=""]:checked) { color: #8a8a92; }
.alan select:disabled { background-color: #f7f7f8; color: #aaa; cursor: not-allowed; }
.alan input::placeholder { color: #9a9aa3; }
.alan input:focus, .alan select:focus { border-color: #8a8a92; }
.alan.hatali input, .alan.hatali select { border-color: #e08088; }
.alan small { color: #c0222b; font-size: 12px; }
.mono { font-family: var(--mono); font-size: 13px; }
.onay { display: flex; align-items: center; gap: 8px; height: 35px; color: #444; font-size: 13.5px; cursor: pointer; }
.onay input { width: 16px; height: 16px; accent-color: #3d4a63; }

.oneri { position: absolute; z-index: 20; left: 0; right: 0; top: 62px; margin: 0; padding: 4px; list-style: none; background: #fff; border: 1px solid var(--cizgi); border-radius: 6px; box-shadow: 0 8px 24px rgba(0, 0, 0, .1); }
.oneri li { padding: 7px 10px; border-radius: 4px; font-size: 13px; cursor: pointer; }
.oneri li:hover { background: #f3f3f5; }

.alt { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 12px 28px; border-top: 1px solid var(--cizgi); background: #f3f3f5; border-radius: 0 0 4px 4px; }
.alt p { margin: 0; color: var(--soluk); font-size: 12.5px; }
.alt code { font-family: var(--mono); font-size: 12px; color: #333; }
.dugmeler { display: flex; gap: 10px; }
.yer-tutucu { padding: 60px 20px; text-align: center; color: var(--soluk); }
.yer-tutucu b { display: block; margin-bottom: 4px; color: var(--yazi); font-size: 16px; }
.yer-tutucu p { margin: 0; }
@media (max-width: 900px) { .iki, .uc, .iki-bir { grid-template-columns: 1fr; } .ipucu { display: none; } }
</style>
