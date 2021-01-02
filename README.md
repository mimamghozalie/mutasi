# mutasi
Untuk saat ini mutasi rekening yang dibuat hanya bisa melakukan scrapping data dari Bank BRI (Untuk bank lain bisa dikembangkan sendiri)

Required:
- NPM
- NodeJS
- tesseract-ocr
- Jika anda menggunakan Linux anda bisa melihat package yang diperlukan untuk menjalankan script ini pada file AptFile.

Cara menjalankan script ini:
- buka console atau command prompt
- git clone https://github.com/anasamu/mutasi.git
- masuk ke direktori mutasi
- npm install (tunggu sampai proses selesai)
- node app.js

Anda dapat melakukan konfigurasi file sebelum menjalankan program ini. untuk file konfigurasi berada pada folder /config/AppSettings.js
- ProductionMode: true,
- port: 4550,
- encryption_key: 'BHjew65ftvbgKJb32pZxanYjknHKBKHnkjw',
- expired_time_token: 500, // menit
- expired_time_cache: 5, // menit

anda dapat merubah konfigurasi untuk veriable diatas.

Silahkan akses lewat browser untuk url server yang telah dijalankan.

URL Untuk Pembuatan token mutasi
- http://localhost:4550/api/bri/token

Dalam pembuatan token mutasi menggunakan method POST dengan field berikut
* username (userID internet banking BRI)
* password (password internet banking BRI)

Untuk hasil yang ditampilkan berupa format json yang berisikan informasi key dan token.
Untuk key dan token ini nantinya akan dimasukkan dalam header untuk mendapatkan mutasi rekening.

URL untuk mendapatkan mutasi rekening
- http://localhost:4550/api/bri/mutasi

Untuk mendapatkan informasi mutasi rekening dari url diatas menggunakan method POST dengan field berikut:
* account_number (nomor rekening)
* data (format dd/mm/yyyy)

Opsional field
- type (debet or kredit)
- amount (jumlah yang ingin dicari)

Sebelum mengirimkan field pastikan sudah menambahkan header key dan token yang didapatkan sebelumnya.

Untuk hasil yang ditampilkan berupa json format dengan informasi mutasi rekening.

Kemungkingan script ini masih terdapat bugs dan masih dapat dikembangkan lebih lanjut.
