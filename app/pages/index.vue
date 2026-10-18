<script setup lang="ts">
import { cariler } from '~/utils/cariVeri'

const ara = ref('')
/** Arama Enter'a basılınca uygulanır; kutu boşaltılınca filtre kalkar. */
const aranan = ref('')
watch(ara, (v) => { if (!v.trim()) aranan.value = '' })
const tip = ref('')
const temsilci = ref('')
const statu = ref('')
const il = ref('')

const benzersiz = (fn: (c: typeof cariler[number]) => string) => [...new Set(cariler.map(fn))].sort((a, b) => a.localeCompare(b, 'tr'))
const temsilciler = benzersiz(c => c.temsilci)
const iller = benzersiz(c => c.sehir)
const cariTipi = (kod: string) => kod.startsWith('320.') ? 'Tedarikçi' : 'Müşteri'

const liste = computed(() => {
  const q = aranan.value.trim().toLocaleLowerCase('tr')
  return cariler.filter(c =>
    (!q || [c.kod, c.unvan, c.vergiNo, c.telefon, c.vergiDairesi, c.sehir, c.ilce, c.temsilci].some(x => x.toLocaleLowerCase('tr').includes(q)))
    && (!tip.value || cariTipi(c.kod) === tip.value)
    && (!temsilci.value || c.temsilci === temsilci.value)
    && (!statu.value || (statu.value === 'Statüsüz' ? !c.ticariStatu : c.ticariStatu === statu.value))
    && (!il.value || c.sehir === il.value),
  )
})

const tl = (n: number) => (n < 0 ? '-₺' : '₺') + Math.abs(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
</script>

<template>
  <div class="sayfa">
    <header class="ust">
      <div>
        <h1>Cari Kartlar</h1>
        <p>Cari listesi ve yeni cari kart açma.</p>
      </div>
      <div class="dugmeler">
        <button class="dugme">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>
          Yenile
        </button>
        <NuxtLink to="/cari/yeni" class="dugme birincil">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Yeni Cari Kart
        </NuxtLink>
      </div>
    </header>

    <section class="kart">
      <div class="filtre">
        <label class="alan">
          <span>Ara</span>
          <input v-model="ara" placeholder="Cari kod, ünvan, vergi no, telefon... (Enter ile ara)" @keydown.enter="aranan = ara">
        </label>
        <label class="alan kisa">
          <span>Tedarikçi / Müşteri</span>
          <select v-model="tip"><option value="">Tümü</option><option>Müşteri</option><option>Tedarikçi</option></select>
        </label>
        <label class="alan kisa">
          <span>Temsilci</span>
          <select v-model="temsilci"><option value="">Tümü</option><option v-for="t in temsilciler" :key="t">{{ t }}</option></select>
        </label>
        <label class="alan kisa">
          <span>Ticari Statü</span>
          <select v-model="statu"><option value="">Tümü</option><option>N</option><option>A</option><option>AB</option><option>Statüsüz</option></select>
        </label>
        <label class="alan kisa">
          <span>İl</span>
          <select v-model="il"><option value="">Tümü</option><option v-for="i in iller" :key="i">{{ i }}</option></select>
        </label>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 150px">Cari Kod</th>
            <th style="width: 340px">Ünvan</th>
            <th style="width: 260px">Vergi No / Daire</th>
            <th style="width: 150px">İl / İlçe</th>
            <th style="width: 190px">Temsilci</th>
            <th class="sag" style="width: 150px">Limit</th>
            <th class="sag" style="width: 170px">Bakiye</th>
            <th>Ticari Statü</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in liste" :key="c.kod" class="satir" @click="navigateTo(`/cari/${encodeURIComponent(c.kod)}`)">
            <td class="mono soluk">{{ c.kod }}</td>
            <td>
              <div class="unvan-satir">
                <span class="kes unvan">{{ c.unvan }}</span>
                <span v-if="c.kilitli" class="kilitli">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                  Kilitli
                </span>
              </div>
            </td>
            <td>
              <div class="mono vno">{{ c.vergiNo }}</div>
              <div class="alt kes daire">{{ c.vergiDairesi }}</div>
            </td>
            <td>
              <div>{{ c.sehir }}</div>
              <div class="alt">{{ c.ilce }}</div>
            </td>
            <td>
              <div>{{ c.temsilci }}</div>
              <div class="alt">{{ c.temsilciNo }}</div>
            </td>
            <td class="sag">{{ tl(c.limit) }}</td>
            <td class="sag">
              <div class="bakiye" :class="{ alacak: c.bakiye < 0, borc: c.bakiye > 0 }">{{ tl(c.bakiye) }}</div>
            </td>
            <td>
              <span v-if="c.ticariStatu" class="statu">{{ c.ticariStatu }}</span>
              <span v-else class="tire">—</span>
            </td>
          </tr>
          <tr v-if="!liste.length">
            <td colspan="8" class="bos">Kayıt bulunamadı.</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.sayfa { padding: 22px 18px 24px; }
.ust { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
h1 { margin: 0; font-size: 20px; font-weight: 600; }
.ust p { margin: 2px 0 0; color: var(--soluk); font-size: 13px; }
.dugmeler { display: flex; gap: 10px; }
.dugme {
  text-decoration: none; display: inline-flex; align-items: center; gap: 12px; height: 36px; padding: 0 22px;
  background: #ececee; border: 1px solid var(--cizgi); border-radius: 3px; font-weight: 500; cursor: pointer;
}
.dugme:hover { background: #e3e3e6; }
.dugme.birincil { background: var(--kirmizi); border-color: var(--kirmizi); color: #fff; }
.dugme.birincil:hover { background: #bf2024; }

.kart { background: var(--card); border: 1px solid var(--cizgi); border-radius: 4px; padding: 18px 18px 0; }
.filtre { display: flex; align-items: flex-end; gap: 18px; margin-bottom: 18px; }
.alan { display: flex; flex-direction: column; gap: 4px; width: 414px; }
.alan span { font-weight: 500; }
.alan.kisa { width: 190px; }
.alan select {
  height: 35px; padding: 0 10px; border: 1px solid var(--cizgi); border-radius: 3px; outline: none; appearance: none;
  background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 10px center;
}
.alan input { height: 35px; padding: 0 10px; background: #fff; border: 1px solid var(--cizgi); border-radius: 3px; outline: none; }
.alan input:focus { border-color: #b9b9c0; }

table { width: 100%; border-collapse: collapse; table-layout: fixed; }
thead th {
  background: #f3f3f5; height: 40px; padding: 0 13px; text-align: left;
  font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: #333;
}
tbody tr { border-bottom: 1px solid var(--cizgi); }
tbody tr:nth-child(even) { background: #fafafb; }
tbody tr:hover { background: #f1f1f3; }
.satir { cursor: pointer; }
td { height: 61px; padding: 0 13px; }
.mono { font-family: var(--mono); font-size: 13px; }
.soluk { color: #555; }
.kes { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.unvan-satir { display: flex; align-items: center; gap: 8px; }
.kilitli { flex: none; display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 10px; background: #fde4e7; color: #c0223f; border: 1px solid #f6c2ca; font-size: 11px; font-weight: 600; }
.unvan { max-width: 240px; font-size: 14.5px; font-weight: 500; }
.vno { font-size: 13px; }
.alt { color: var(--soluk); font-size: 12px; margin-top: 3px; text-transform: none; }
.daire { max-width: 230px; text-transform: uppercase; font-size: 11.5px; }
.sag { text-align: right; }
.bakiye { font-size: 14px; font-weight: 500; }
.bakiye.alacak { color: #1f7a3e; }
.bakiye.borc { color: #c0222b; }
.rozet { display: inline-flex; align-items: center; gap: 6px; padding: 3px 11px; border-radius: 14px; background: #e3f6ea; color: #1b7a47; border: 1px solid #bfe9cf; font-size: 11.5px; font-weight: 500; letter-spacing: .04em; }
.rozet b { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.rozet.pasif { background: #f0f0f2; color: #666; border-color: #e0e0e4; }
.statu { display: inline-grid; place-items: center; min-width: 26px; height: 24px; padding: 0 7px; border-radius: 12px; background: #eeeef2; color: #333; font-size: 12px; font-weight: 600; }
.tire { color: #999; }
.bos { text-align: center; color: var(--soluk); }
</style>
