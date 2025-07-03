# 🚀 Setup Guide - Aplikasi Propangkat

## Project Overview
Aplikasi Propangkat adalah sistem manajemen usulan kenaikan pangkat pegawai yang dibangun menggunakan:
- **Frontend**: Next.js 14 dengan TypeScript
- **UI Framework**: React dengan Tailwind CSS dan Radix UI
- **Database**: PostgreSQL dengan Prisma ORM
- **Authentication**: Iron Session
- **Package Manager**: pnpm

## Prerequisites
Pastikan sudah terinstall:
- ✅ Node.js (v18+)
- ✅ PostgreSQL
- ✅ pnpm

## 📋 Step-by-Step Setup

### 1. Install Dependencies
```bash
cd "c:\Users\KOU\Downloads\propangkatbckend (3)"
pnpm install
```

### 2. Environment Configuration
File `.env` sudah dibuat dengan konfigurasi default. Update DATABASE_URL sesuai kredensial PostgreSQL Anda:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/propangkat_db"
NEXTAUTH_SECRET="your-super-secret-key-here-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
SESSION_SECRET="your-iron-session-secret-key-here-32-chars-minimum"
APP_ENV="development"
APP_URL="http://localhost:3000"
UPLOAD_MAX_SIZE="10485760"
UPLOAD_ALLOWED_TYPES="application/pdf,image/jpeg,image/jpg,image/png"
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Reset database dan buat migrasi baru
npx prisma migrate reset --force

# Jalankan seed untuk data awal
npx tsx scripts/01-seed.ts
```

### 4. Start Development Server
```bash
pnpm dev
```

Aplikasi akan berjalan di: http://localhost:3000

## 👥 Default Users

Setelah seed, tersedia user default:

### Admin
- **NIP**: `000000000000000001`
- **Password**: `000000000000000001`
- **Email**: `admin@propangkat.dev`
- **Role**: ADMIN

### Sample Pegawai
- **NIP**: `198501012010011001`
- **Password**: `198501012010011001`
- **Email**: `ahmad.wijaya@propangkat.dev`
- **Role**: PEGAWAI
- **Nama**: Dr. Ahmad Wijaya, S.Pd
- **Unit Kerja**: SMA Negeri 1 Samarinda

### Operator (7 users untuk setiap wilayah)
- **Operator 1**: NIP `111111111111111111`, Password `111111111111111111`, Wilayah: BALIKPAPAN_PPU
- **Operator 2**: NIP `222222222222222222`, Password `222222222222222222`, Wilayah: KUTIM_BONTANG
- **Operator 3**: NIP `333333333333333333`, Password `333333333333333333`, Wilayah: KUKAR
- **Operator 4**: NIP `444444444444444444`, Password `444444444444444444`, Wilayah: KUBAR_MAHULU
- **Operator 5**: NIP `555555555555555555`, Password `555555555555555555`, Wilayah: PASER
- **Operator 6**: NIP `666666666666666666`, Password `666666666666666666`, Wilayah: BERAU
- **Operator 7**: NIP `777777777777777777`, Password `777777777777777777`, Wilayah: SAMARINDA

**⚠️ PENTING**: Semua user wajib mengganti password setelah login pertama!

## 🛠️ Available Scripts

```bash
# Development
pnpm dev                 # Start development server
pnpm build              # Build for production
pnpm start              # Start production server
pnpm lint               # Run ESLint

# Database Management
pnpm db:migrate         # Apply database migrations
pnpm db:generate        # Generate Prisma client
pnpm db:seed            # Run seed script
pnpm db:reset           # Reset database
pnpm db:studio          # Open Prisma Studio
pnpm setup              # Complete setup (generate + migrate + seed)
```

## 📁 Project Structure

```
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── admin/          # Admin dashboard
│   ├── operator/       # Operator dashboard
│   ├── pegawai/        # Pegawai dashboard
│   └── login/          # Authentication pages
├── components/         # Reusable React components
├── lib/               # Utility functions
├── prisma/            # Database schema and migrations
├── uploads/           # File uploads directory
└── scripts/           # Database seed scripts
```

## 🔐 Authentication Flow

1. **Login**: `/login` - Pilih role (Admin/Operator/Pegawai)
2. **Dashboard**: Redirect ke dashboard sesuai role
3. **Change Password**: Wajib ganti password di login pertama

## 📤 File Upload

- **Max Size**: 10MB per file
- **Allowed Types**: PDF, JPEG, JPG, PNG
- **Upload Directory**: `uploads/documents/`

## 🗄️ Database Schema

### Main Tables:
- **User**: Data pegawai, operator, dan admin
- **PromotionProposal**: Usulan kenaikan pangkat
- **DocumentRequirement**: Jenis dokumen yang diperlukan
- **ProposalDocument**: File dokumen yang diupload
- **ActivityLog**: Log aktivitas sistem

### Enums:
- **Role**: PEGAWAI, OPERATOR, ADMIN
- **StatusProposal**: DRAFT, DIAJUKAN, DIPROSES, dst.
- **StatusDokumen**: MENUNGGU_VERIFIKASI, DISETUJUI, dst.
- **Wilayah**: 7 wilayah di Kalimantan Timur

## 🔧 Development Tips

1. **Prisma Studio**: Gunakan `pnpm db:studio` untuk GUI database
2. **Hot Reload**: Perubahan code akan auto-reload di development
3. **Error Logs**: Check terminal untuk error details
4. **API Testing**: Gunakan `/api` routes untuk testing backend

## 🚨 Troubleshooting

### Database Connection Error
- Pastikan PostgreSQL berjalan
- Check DATABASE_URL di .env
- Pastikan database `propangkat_db` exist

### Port 3000 Sudah Digunakan
```bash
# Kill process di port 3000
npx kill-port 3000
```

### Prisma Client Error
```bash
# Regenerate Prisma client
npx prisma generate
```

## 📞 Support

Jika ada masalah dalam setup, periksa:
1. Log error di terminal
2. File .env configuration
3. Database connection
4. Node.js version compatibility

---

**✅ Setup Complete!** 
Aplikasi Propangkat sudah siap digunakan untuk development.
