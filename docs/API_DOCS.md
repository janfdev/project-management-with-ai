
# Dokumentasi API Management Project APP

## Base URL
`http://localhost:3000/api`

## Autentikasi
Autentikasi menggunakan session cookies melalui Better Auth.
- Gunakan halaman `/auth/login` untuk masuk dengan Google (atau Super Admin).
- Session disimpan dalam cookie `ba_session`.

Untuk pengujian API di Postman setelah login di browser:
1. Salin nilai cookie `ba_token` atau `ba_session`.
2. Tambahkan ke Postman Headers/Cookies jika diperlukan (Alur session browser standar).

---

## Daftar Endpoint

### 1. Proyek (Projects)

#### Ambil Semua Proyek
- **URL**: `/projects`
- **Method**: `GET`
- **Response**:
```json
[
    {
        "id": "uuid",
        "name": "Proyek Alpha",
        "status": "active",
        ...
    }
]
```

#### Buat Proyek Baru (Hanya Manager/HR)
- **URL**: `/projects`
- **Method**: `POST`
- **Body**:
```json
{
    "name": "Nama Proyek Baru",
    "description": "Deskripsi proyek",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
}
```

---

### 2. Tugas (Tasks)

#### Ambil Daftar Tugas
- **URL**: `/tasks`
- **Method**: `GET`
- **Params**:
  - `projectId` (opsional): Filter berdasarkan ID proyek.
- **Catatan**: Karyawan (Employee) hanya akan melihat tugas mereka sendiri jika tidak ada filter proyek yang diterapkan.

#### Buat Tugas (Otomatis Menjalankan AI Breakdown)
- **URL**: `/tasks`
- **Method**: `POST`
- **Body**:
```json
{
    "title": "Judul Tugas",
    "description": "Deskripsi detail tugas. AI akan membaca ini untuk memecah sub-tugas.",
    "projectId": "uuid-proyek",
    "assigneeId": "user-id", // Opsional
    "dueDate": "2024-02-01"
}
```
- **Response** (Termasuk hasil analisis AI):
```json
{
    "id": "task-uuid",
    "title": "Judul Tugas",
    "aiBreakdown": {
        "subtasks": [
            {"title": "Subtugas 1", "estimatedHours": 2},
            {"title": "Subtugas 2", "estimatedHours": 3}
        ],
        "riskAnalysis": "Analisis risiko dari AI...",
        "estimatedTotalHours": 5
    },
    ...
}
```

#### Kirim Bukti Kerja (Evidence)
- **URL**: `/tasks/:id/evidence`
- **Method**: `POST`
- **Body**:
```json
{
    "fileUrl": "https://res.cloudinary.com/...", // Dapatkan URL ini dari API Upload
    "publicId": "cloudinary-id",
    "fileType": "image/png",
    "description": "Catatan singkat tentang bukti kerja ini"
}
```
- **Efek**: Status tugas mungkin otomatis berubah menjadi `review`.

---

### 3. Upload File (Helper)

#### Upload File ke Cloudinary
- **URL**: `/upload`
- **Method**: `POST`
- **Body**: `FormData`
  - `file`: (File Binary/Gambar/Dokumen)
  - `folder`: "evidence" (opsional)
- **Response**:
```json
{
    "success": true,
    "data": {
        "secure_url": "https://res.cloudinary.com/..."
    }
}
```

---

### 4. Manajemen User (HR Only)

#### Lihat User Pending
- **URL**: `/users`
- **Method**: `GET`
- **Akses**: Hanya HR

#### Approve User
- **URL**: `/users/:id`
- **Method**: `PATCH`
- **Body**:
```json
{
    "status": "active",
    "role": "employee" // atau "pm", "hr"
}
```

---

### 5. Analytics & Intelligence (Core Brain)

#### Lihat Dashboard Analytics (HR/PM)
- **URL**: `/analytics`
- **Method**: `GET`
- **Kegunaan**: Melihat workload real-time, completion rate, dan siapa yang overwhelmed.
- **Response**:
```json
{
    "overview": {
        "totalTasks": 150,
        "completedTasks": 120,
        "completionRate": "80.0"
    },
    "workload": [
        {
            "userId": "u1",
            "name": "Budi",
            "activeTaskCount": 8, // Sedang mengerjakan 8 hal sekaligus
            "status": "Overloaded"
        }
    ]
}
```

#### Trigger AI Risk Scan (Manual)
- **URL**: `/ai/scan-risks`
- **Method**: `POST`
- **Akses**: PM/HR Only.
- **Kegunaan**: Memaksa AI membaca ulang semua tugas aktif. Jika ada deadline mepet tapi status masih `todo`, AI akan menandainya sebagai `High Risk`.
- **Response**:
```json
{
    "success": true,
    "scanned": 15, // Jumlah task yang dicek
    "risksFound": 3, // Jumlah task berisiko ditemukan
    "details": [
        { "taskId": "...", "riskLevel": "high", "reason": "Deadline besok status masih todo" }
    ]
}
```

#### Analisis Kualitas Pekerjaan (AI)
- **URL**: `/ai/analyze-quality`
- **Method**: `POST`
- **Akses**: PM/HR Only.
- **Kegunaan**: Menilai kualitas submission task berdasarkan deskripsi, bukti file, dan ketepatan waktu.
- **Body**:
```json
{
    "taskId": "uuid-task"
}
```
- **Response**:
```json
{
    "success": true,
    "data": {
        "score": 85,
        "analysis": "Pekerjaan sesuai spesifikasi. Bukti gambar jelas. Tepat waktu."
    }
}
```

---

### 6. Update Tugas (Edit)

#### Update Task Status/Detail
- **URL**: `/tasks/:id`
- **Method**: `PATCH`
- **Body**:
```json
{
    "status": "in_progress", // Karyawan bisa update ini
    "dueDate": "2024-03-01" // Hanya PM yang bisa update ini
}
```
