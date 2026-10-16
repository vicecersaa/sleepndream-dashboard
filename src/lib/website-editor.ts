import type { Field } from './website';

export const sectionHelp: Record<string, string> = {
  Home: 'Atur posisi bagian halaman beranda. Matikan bagian yang belum ingin ditampilkan.',
  Hero: 'Bagian pertama yang dilihat pengunjung: video pembuka, judul besar, dan tombol utama.',
  OurSignature: 'Ubah judul bagian dan kartu koleksi kasur yang tampil di beranda.',
  FeaturedCategory: 'Atur tulisan di bagian produk unggulan. Pilih produknya lewat tanda bintang di menu Produk.',
  AccessoriesCarousel: 'Kelola gambar, nama, deskripsi, dan tujuan klik untuk setiap aksesori.',
  StoreGallery: 'Atur video Dr. Spine, foto toko, alamat, dan tautan Google Maps.',
  NewsletterBenefits: 'Jelaskan keunggulan layanan Sleep n Dream kepada pengunjung.',
  VideoSection: 'Kelola kartu informasi Dr. Spine dan tautan artikelnya.',
  Sleep n DreamSocials: 'Ganti gambar dan tautan kartu Instagram di beranda.',
  AboutUs: 'Edit gambar pembuka dan cerita pada halaman Tentang Sleep n Dream.',
  Navbar: 'Atur logo, pengumuman, dan menu di bagian atas website.',
  Footer: 'Atur kontak, jam layanan, dan tautan di bagian paling bawah website.',
  SocialFloat: 'Ubah nomor tujuan WhatsApp. Gunakan format https://wa.me/628… tanpa tanda + atau spasi.',
  ProductCatalog: 'Atur tampilan halaman koleksi. Foto, harga, dan stok produk dikelola di menu Produk.',
  Site: 'Atur judul tab browser dan deskripsi website untuk mesin pencari.',
};

const names: Record<string, string[]> = {
  Hero: ['Video pembuka','Teks kecil di atas judul','Judul utama — bagian 1','Judul utama — bagian 2','Judul utama — bagian 3','Judul utama — bagian 4','Deskripsi pembuka','Teks tombol utama'],
  OurSignature: ['Judul bagian','Deskripsi bagian','Tujuan klik judul','Teks tombol','Tujuan tombol'],
  FeaturedCategory: ['Judul bagian','Deskripsi bagian','Tujuan tombol','Teks tombol'],
  AccessoriesCarousel: ['Judul bagian','Deskripsi bagian','Tujuan tombol','Teks tombol utama','Teks tombol pada kartu'],
  StoreGallery: ['Gambar sampul video','Teks kecil di atas judul','Judul — baris 1','Judul — baris 2','Deskripsi Dr. Spine','Tujuan tombol Dr. Spine','Teks tombol Dr. Spine','Teks kecil galeri','Judul galeri','Teks tombol galeri'],
  NewsletterBenefits: ['Teks kecil di atas judul','Judul bagian'],
  VideoSection: ['Teks kecil di atas judul','Judul bagian','Deskripsi bagian','Tujuan tombol','Teks tombol'],
  Sleep n DreamSocials: ['Judul bagian','Deskripsi bagian'],
  AboutUs: ['Gambar pembuka','Teks kecil pembuka','Judul — bagian 1','Judul — bagian 2','Judul — bagian 3','Judul filosofi','Pernyataan — bagian 1','Pernyataan — bagian 2','Pernyataan — bagian 3','Tujuan tombol','Teks tombol'],
  ProductCatalog: ['Gambar pembuka katalog','Teks kecil pembuka','Judul — bagian 1','Judul — bagian 2','Judul — bagian 3','Label jumlah hasil','Label urutan produk','Pilihan urutan unggulan','Pilihan urutan harga','Teks koleksi lainnya','Label jumlah tampil','Penghubung jumlah produk','Label produk'],
};
const special: Record<string,string> = {
  'Home.sections':'Urutan bagian beranda', 'Home.banners':'Banner cerita dan promosi',
  'Hero.ctaHref':'Tujuan tombol utama', 'SocialFloat.links':'Tujuan tombol kontak',
  'Footer.phoneLabel':'Nomor telepon yang ditampilkan', 'Footer.newsletterHref':'Tujuan tombol newsletter',
  'Navbar.src17':'Logo pada latar gelap', 'Navbar.src19':'Logo pada latar terang',
  'Navbar.alt18':'Deskripsi logo pertama', 'Navbar.alt20':'Deskripsi logo kedua',
  'Footer.href4':'Tautan telepon', 'Footer.href5':'Tautan email',
};
const extra: Record<string, Record<number,string>> = {
  Footer: {2:'Judul layanan pelanggan',3:'Hari dan jam layanan',6:'Teks tombol email',7:'Judul newsletter',8:'Deskripsi newsletter — baris 1',9:'Deskripsi newsletter — baris 2',10:'Teks tombol berlangganan',11:'Judul media sosial',12:'Tautan media sosial pertama',13:'Tautan media sosial kedua',14:'Tautan media sosial ketiga',15:'Tautan media sosial keempat',16:'Keterangan wilayah pengiriman',17:'Nama pada hak cipta',18:'Keterangan hak cipta'},
  Navbar: {1:'Judul menu halaman',2:'Tujuan menu Beranda',3:'Nama menu Beranda',4:'Tujuan menu Tentang Kami',5:'Nama menu Tentang Kami',6:'Tujuan menu Koleksi',7:'Nama menu Koleksi',8:'Judul menu belanja',9:'Teks tombol kembali',11:'Label akun',12:'Label pencarian',13:'Teks pengantar pencarian',14:'Pengumuman pertama',15:'Pengumuman kedua',16:'Tujuan klik logo',21:'Keterangan pengiriman pertama',22:'Keterangan pengiriman kedua',28:'Deskripsi foto menu',29:'Tujuan tautan tambahan pertama',30:'Tujuan tautan tambahan kedua',31:'Teks tombol jelajahi'},
  ProductDetail: {1:'Judul informasi produk',2:'Deskripsi umum — paragraf 1',3:'Deskripsi umum — paragraf 2',4:'Judul panduan ukuran',5:'Isi panduan ukuran',6:'Judul petunjuk perawatan',7:'Isi petunjuk perawatan',8:'Judul pengiriman & pengembalian',9:'Isi pengiriman & pengembalian',10:'Label tampilan warna',11:'Label ukuran',12:'Label konfigurasi',15:'Teks tombol tambah keranjang',16:'Teks tombol checkout',17:'Teks kecil produk pelengkap',18:'Judul produk pelengkap',19:'Deskripsi produk pelengkap',20:'Label ukuran pelengkap',21:'Label warna pelengkap',22:'Nama warna pertama',23:'Nama warna kedua',24:'Nama warna ketiga',25:'Teks tombol tambah pilihan',26:'Teks tombol lanjut menjelajah',27:'Judul rekomendasi produk'},
};

export function fieldLabel(field: Field): string {
  if (special[field.key]) return special[field.key];
  const index = Number(field.key.match(/(?:text|src|poster|href|alt)(\d+)$/)?.[1]);
  if (extra[field.group]?.[index]) return extra[field.group][index];
  if (index && names[field.group]?.[index-1]) return names[field.group][index-1];
  if (field.kind === 'structured') return field.label.replace('section', 'bagian').replace('accessories', 'aksesori');
  if (field.kind === 'href') return `Tujuan tautan ${index || ''}`;
  if (field.kind === 'src' || field.kind === 'poster') return `Gambar / media ${index || ''}`;
  if (field.kind === 'alt') return 'Deskripsi gambar';
  return `Teks: ${field.label}`;
}
