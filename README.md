# Noxarianet Store — Android App

Aplikasi Android resmi Noxarianet Store. Dibangun dengan Expo + React Native +
TypeScript, memakai Expo Router dan React Native Paper (Material 3, light theme).

## Cakupan v1

- Login, daftar akun, verifikasi email, dan lupa password.
- Beranda, katalog prepaid, pencarian, dan filter kategori.
- Detail produk multi-server, validasi ID akun, checkout saldo atau QRIS.
- Halaman pembayaran QRIS dengan countdown dan polling status otomatis.
- Katalog tagihan (postpaid), cek tagihan, dan pembayaran tagihan dengan saldo.
- Riwayat pesanan, detail pesanan, dan pembatalan pesanan `PENDING`.
- Saldo, top up QRIS, dan riwayat mutasi saldo.
- Edit profil, ubah password, dan bantuan via WhatsApp.

Belum termasuk: tiket in-app, push notification, mode tamu, panel admin, dan
kebutuhan Play Store.

## Alur tagihan (postpaid)

Produk tagihan tidak punya nominal tetap. Urutannya:

1. Katalog → tab **Tagihan** → pilih produk (mis. PLN, PDAM, BPJS).
2. Detail produk → pilih jenis tagihan (biller) → **Cek tagihan**.
3. Masukkan nomor pelanggan / ID meter → server melakukan inquiry ke vendor
   dan membuat quote sementara berumur 10 menit.
4. Bayar quote memakai saldo Noxarianet. Nominal tidak bisa diubah manual.

Butuh dua endpoint: `POST /mobile/bills/inquiry` (quote) dan
`POST /mobile/orders` dengan `{ "type": "bill", "inquiry_id": ... }`.

## Menjalankan

Prasyarat: Node.js 20+ dan npm.

```bash
npm install
cp .env.example .env   # PowerShell: Copy-Item .env.example .env
npm start
```

Perintah lain:

```bash
npm run android     # buka di emulator/device Android
npm run lint        # ESLint (expo lint)
npm run typecheck   # tsc --noEmit
npx expo-doctor     # cek konfigurasi & dependency
```

## Environment

`EXPO_PUBLIC_API_BASE_URL` wajib berisi base URL API **termasuk** `/api`.
Contoh staging:

```dotenv
EXPO_PUBLIC_API_BASE_URL=https://staging.noxarianet.web.id/api
```

Opsional:

```dotenv
EXPO_PUBLIC_UPDATE_URL=https://example.com/download
EXPO_PUBLIC_SUPPORT_URL=https://wa.me/628xxxxxxxxxx
```

`EXPO_PUBLIC_UPDATE_URL` dipakai tombol di layar force-update.
`EXPO_PUBLIC_SUPPORT_URL` hanya fallback jika backend belum mengisi
`whatsapp_cs`.

## Build APK internal (EAS)

Profil `preview` menghasilkan APK internal dengan API production
(`https://www.noxarianet.web.id/api`). Profil `production` menghasilkan AAB
dengan API yang sama.

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

Build pertama akan meminta pembuatan keystore Android. Simpan kredensial
tersebut; keystore yang hilang tidak bisa dipulihkan.

> Gunakan domain `www`. Apex `https://noxarianet.web.id` tidak melayani
> `/api` (404), jadi build yang menunjuk ke sana tidak akan bisa memanggil
> backend.

## Struktur

```
src/
  app/          route Expo Router (auth, tabs, checkout, pembayaran, topup, ...)
  api/          fetch wrapper + kontrak mobile API
  auth/         AuthProvider, session restore, logout global 401
  components/   UI atomik (ui/, product/, order/, wallet/, system/)
  hooks/        query hooks dan timer
  lib/          format, validasi, storage, idempotency, helper produk
  query/        konfigurasi TanStack Query
  theme/        token DESIGN.md + theme Paper MD3
```

Kontrak API: `../docs/mobile-api.md`. Token web tidak bisa dipakai; login app
memakai `/mobile/auth/login` agar token memiliki claim `client: android`.

## Catatan

- Tidak ada akses langsung ke Supabase dari aplikasi.
- Token disimpan di `expo-secure-store`; data non-sensitif di AsyncStorage.
- QR yang ditampilkan adalah gambar dari `qr_link`/`pg_qr_link` backend, bukan
  dibuat di perangkat.
- Jika staging membalas `502`, backend staging sedang tidak tersedia; cek
  deployment sebelum menguji alur transaksi.
