<script setup lang="ts">
import { markaSecenekleri, sartlariAl, sartlariKaydet, tedarikciSecenekleri, urunSecenekleri, type IskontoSatiri, type Sartlar } from '~/utils/cariSartlari'

const props = defineProps<{ kod: string }>()

const kopya = (s: Sartlar): Sartlar => JSON.parse(JSON.stringify(s))
const taslak = ref<Sartlar>(kopya(sartlariAl(props.kod)))
watch(() => props.kod, (k) => { taslak.value = kopya(sartlariAl(k)) })

const degisti = computed(() => JSON.stringify(taslak.value) !== JSON.stringify(sartlariAl(props.kod)))
const kaydedildi = ref(false)
let zaman: ReturnType<typeof setTimeout>

function kaydet() {
  sartlariKaydet(props.kod, taslak.value)
  kaydedildi.value = true
  clearTimeout(zaman)
  zaman = setTimeout(() => (kaydedildi.value = false), 3000)
}
function vazgec() { taslak.value = kopya(sartlariAl(props.kod)) }

const bazlar = [
  { anahtar: 'tedarikci' as const, ad: 'Tedarikçi Bazlı', secenekler: tedarikciSecenekleri, bos: 'Henüz tedarikçi eklenmedi.' },
  { anahtar: 'marka' as const, ad: 'Marka Bazlı', secenekler: markaSecenekleri, bos: 'Henüz marka eklenmedi.' },
  { anahtar: 'urun' as const, ad: 'Ürün Bazlı', secenekler: urunSecenekleri, bos: 'Henüz ürün eklenmedi.' },
]
const aktifBaz = computed(() => bazlar.find(b => b.anahtar === taslak.value.iskonto.mod))

function satirEkle(liste: IskontoSatiri[], secenekler: string[]) {
  const kullanilan = new Set(liste.map(s => s.ad))
  liste.push({ ad: secenekler.find(s => !kullanilan.has(s)) ?? secenekler[0]!, oran: 0 })
}
function baremEkle() {
  const son = taslak.value.nakliye.baremler.at(-1)
  taslak.value.nakliye.baremler.push({ tutar: (son?.tutar ?? 0) + 10000, pay: Math.max((son?.pay ?? 100) - 50, 0) })
}
</script>

<template>
  <div class="sartlar">
    <div class="izgara">
      <section class="kart genis">
        <h4>İskonto</h4>
        <p class="aciklama">Cariye tedarikçi, marka veya ürün bazında iskonto tanımlanır. Bunlardan yalnızca biri kullanılabilir; seçili bazın dışındaki satırlar saklanır ama uygulanmaz.</p>
        <div class="segment" role="radiogroup">
          <button :class="{ on: taslak.iskonto.mod === 'yok' }" @click="taslak.iskonto.mod = 'yok'">Yok</button>
          <button v-for="b in bazlar" :key="b.anahtar" :class="{ on: taslak.iskonto.mod === b.anahtar }" @click="taslak.iskonto.mod = b.anahtar">{{ b.ad }}</button>
        </div>

        <p v-if="!aktifBaz" class="bos">Bu cari için iskonto tanımlı değil.</p>
        <div v-else class="satirlar">
          <div v-if="taslak.iskonto[aktifBaz.anahtar].length" class="satir iskonto-baslik"><span>{{ aktifBaz.ad.replace(' Bazlı', '') }}</span><span>İskonto (%)</span><span /></div>
          <p v-else class="bos">{{ aktifBaz.bos }}</p>
          <div v-for="(s, i) in taslak.iskonto[aktifBaz.anahtar]" :key="aktifBaz.anahtar + i" class="satir">
            <select v-model="s.ad">
              <option v-for="o in aktifBaz.secenekler" :key="o">{{ o }}</option>
            </select>
            <div class="oran"><input v-model.number="s.oran" type="number" min="0" max="100" step="0.01"><span>%</span></div>
            <button class="sil" title="Satırı sil" @click="taslak.iskonto[aktifBaz.anahtar].splice(i, 1)">×</button>
          </div>
          <button class="ekle" @click="satirEkle(taslak.iskonto[aktifBaz.anahtar], aktifBaz.secenekler)">+ {{ aktifBaz.ad.replace(' Bazlı', '') }} ekle</button>
        </div>
      </section>

      <section class="kart">
        <h4>Sene Sonu Primi</h4>
        <p class="aciklama">Hedef ciroya ulaşıldığında yıl sonunda cariye verilen prim.</p>
        <div class="segment">
          <button :class="{ on: !taslak.prim.var }" @click="taslak.prim.var = false">Yok</button>
          <button :class="{ on: taslak.prim.var }" @click="taslak.prim.var = true">Var</button>
        </div>
        <template v-if="taslak.prim.var">
          <div class="alan-satir">
            <label>Prim oranı (%)</label>
            <input v-model.number="taslak.prim.oran" type="number" min="0" max="100" step="0.01">
          </div>
          <div class="alan-satir">
            <label>Hedef ciro (₺)</label>
            <input v-model.number="taslak.prim.hedef" type="number" min="0" step="1000">
          </div>
        </template>
        <p v-else class="bos">Bu cari için sene sonu primi tanımlı değil.</p>
      </section>

      <section class="kart">
        <h4>Nakliye Şartı</h4>
        <p class="aciklama">Müşteriye sunulan nakliye seçeneği. Baremli seçilirse sipariş tutarına göre müşterinin ödeyeceği nakliye payı belirlenir.</p>
        <div class="segment">
          <button :class="{ on: taslak.nakliye.tip === 'dahil' }" @click="taslak.nakliye.tip = 'dahil'">Nakliye Dahil</button>
          <button :class="{ on: taslak.nakliye.tip === 'haric' }" @click="taslak.nakliye.tip = 'haric'">Nakliye Hariç</button>
          <button :class="{ on: taslak.nakliye.tip === 'baremli' }" @click="taslak.nakliye.tip = 'baremli'">Baremli</button>
        </div>
        <p v-if="taslak.nakliye.tip === 'dahil'" class="bos">Nakliye bedeli satıcıya aittir, müşteriden nakliye ücreti alınmaz.</p>
        <p v-else-if="taslak.nakliye.tip === 'haric'" class="bos">Nakliye bedelinin tamamı müşteriye aittir.</p>
        <div v-else class="satirlar">
          <div class="satir baslik-satir"><span>Sipariş tutarı (≥ ₺)</span><span>Müşteri nakliye payı (%)</span><span /></div>
          <div v-for="(b, i) in taslak.nakliye.baremler" :key="i" class="satir barem">
            <input v-model.number="b.tutar" type="number" min="0" step="1000">
            <div class="oran"><input v-model.number="b.pay" type="number" min="0" max="100" step="5"><span>%</span></div>
            <button class="sil" title="Satırı sil" @click="taslak.nakliye.baremler.splice(i, 1)">×</button>
          </div>
          <button class="ekle" @click="baremEkle">+ Barem ekle</button>
          <p class="not">Örnek: "≥ ₺25.000 → %50" tutarı 25.000 ₺ ve üzeri siparişlerde nakliyenin yarısını müşteri öder.</p>
        </div>
      </section>
    </div>

    <footer class="alt">
      <span v-if="kaydedildi" class="tamam">Satış şartları kaydedildi</span>
      <span v-else-if="degisti" class="soluk">Kaydedilmemiş değişiklikler var</span>
      <span class="bosluk" />
      <button class="dugme" :disabled="!degisti" @click="vazgec">Vazgeç</button>
      <button class="dugme birincil" :disabled="!degisti" @click="kaydet">Kaydet</button>
    </footer>
  </div>
</template>

<style scoped>
.sartlar { padding: 14px 16px 0; }
.izgara { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
.kart { border: 1px solid var(--cizgi); border-radius: 4px; background: #fff; padding: 12px 16px 16px; }
.kart.genis { grid-column: 1 / -1; }
h4 { margin: 0; font-size: 14px; font-weight: 600; }
.aciklama { margin: 4px 0 12px; color: var(--soluk); font-size: 12.5px; line-height: 1.5; }
.segment { display: inline-flex; padding: 2px; margin-bottom: 12px; border: 1px solid var(--cizgi); border-radius: 3px; background: #f3f3f5; }
.segment button { height: 30px; padding: 0 16px; border: 1px solid transparent; border-radius: 2px; background: none; color: #555; font-size: 13.5px; cursor: pointer; }
.segment button:hover { color: var(--yazi); }
.segment button.on { background: #fff; border-color: var(--cizgi); color: var(--yazi); font-weight: 600; }
.bos { margin: 0; color: var(--soluk); font-size: 13px; }
.alan-satir { display: grid; grid-template-columns: 150px 1fr; gap: 12px; align-items: center; margin-top: 8px; }
.alan-satir label { color: var(--soluk); font-size: 12.5px; }
input, select { height: 34px; padding: 0 10px; border: 1px solid var(--cizgi); border-radius: 3px; background: #fff; font-size: 13.5px; outline: none; }
input:focus, select:focus { border-color: #8a8a92; }
.alan-satir input, .alan-satir select { max-width: 260px; }
.satirlar { display: flex; flex-direction: column; gap: 8px; }
.satir { display: grid; grid-template-columns: minmax(0, 460px) 130px 30px; gap: 8px; align-items: center; }
.satir.barem, .satir.baslik-satir { grid-template-columns: 220px 220px 30px; }
.satir.baslik-satir, .satir.iskonto-baslik { color: var(--soluk); font-family: var(--mono); font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; }
.satir.barem input, .satir > select { width: 100%; }
.oran { display: flex; align-items: center; gap: 6px; }
.oran input { width: 100%; min-width: 0; }
.oran span { color: var(--soluk); }
.sil { width: 28px; height: 28px; border: 1px solid transparent; border-radius: 3px; background: none; color: #777; font-size: 18px; line-height: 1; cursor: pointer; }
.sil:hover { background: #fde4e7; color: #c0223f; }
.ekle { align-self: flex-start; padding: 4px 0; border: 0; background: none; color: #2f4a8a; font-size: 13px; cursor: pointer; }
.ekle:hover { text-decoration: underline; }
.not { margin: 2px 0 0; color: var(--soluk); font-size: 12px; }
.alt { display: flex; align-items: center; gap: 10px; margin: 14px -16px 0; padding: 12px 16px; border-top: 1px solid var(--cizgi); background: #f3f3f5; }
.bosluk { flex: 1; }
.soluk { color: var(--soluk); font-size: 12.5px; }
.tamam { color: #1f7a3e; font-size: 12.5px; font-weight: 500; }
.dugme { height: 34px; padding: 0 18px; border: 1px solid var(--cizgi); border-radius: 3px; background: #ececee; font-weight: 500; cursor: pointer; }
.dugme:hover:not(:disabled) { background: #e3e3e6; }
.dugme.birincil { background: var(--kirmizi); border-color: var(--kirmizi); color: #fff; }
.dugme.birincil:hover:not(:disabled) { background: #bf2024; }
.dugme:disabled { opacity: .45; cursor: not-allowed; }
@media (max-width: 1000px) { .izgara { grid-template-columns: 1fr; } .kart.genis { grid-column: auto; } }
</style>
