-- SQL Schema & RLS Policies for CARE-PBI Sukabumi
-- Jalankan di SQL Editor dashboard Supabase Anda

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Buat Tabel Patients (Jika belum ada)
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    desil TEXT NOT NULL DEFAULT '1',
    nama_ruangan TEXT NOT NULL DEFAULT 'IGD',
    no_spr TEXT,
    tanggal_spr DATE NOT NULL DEFAULT CURRENT_DATE,
    nama TEXT NOT NULL,
    nik TEXT,
    no_kk TEXT NOT NULL,
    status_dalam_kk TEXT NOT NULL DEFAULT 'Sudah Masuk KK',
    alamat TEXT NOT NULL DEFAULT '',
    tanggal_lahir DATE,
    no_hp TEXT,
    cara_bayar TEXT NOT NULL DEFAULT 'KTP/KK',
    jenis_pasien TEXT DEFAULT 'IGD',
    status_pengajuan TEXT DEFAULT 'Menunggu Verifikasi',
    penyebab_penolakan TEXT,
    status_warning TEXT DEFAULT 'aman',
    doc_spr BOOLEAN DEFAULT FALSE,
    doc_ktp BOOLEAN DEFAULT FALSE,
    doc_kk BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tambahkan kolom jika tabel sudah pernah dibuat sebelumnya (Backward Compatibility)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS desil TEXT DEFAULT '1';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS nama_ruangan TEXT DEFAULT 'IGD';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS status_dalam_kk TEXT DEFAULT 'Sudah Masuk KK';
ALTER TABLE public.patients ALTER COLUMN tanggal_lahir DROP NOT NULL;
ALTER TABLE public.patients ALTER COLUMN nik DROP NOT NULL;

-- 4. Enable Row Level Security (RLS) & Kebijakan Akses Penuh
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all" ON public.patients;
DROP POLICY IF EXISTS "Allow public read" ON public.patients;
DROP POLICY IF EXISTS "Allow public insert" ON public.patients;
DROP POLICY IF EXISTS "Allow public update" ON public.patients;
DROP POLICY IF EXISTS "Allow public delete" ON public.patients;

CREATE POLICY "Allow public all" ON public.patients FOR ALL USING (true) WITH CHECK (true);

-- 5. Tabel Lampiran Dokumen Pasien (Opsional)
CREATE TABLE IF NOT EXISTS public.patient_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    jenis_dokumen TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public doc all" ON public.patient_documents;
CREATE POLICY "Allow public doc all" ON public.patient_documents FOR ALL USING (true) WITH CHECK (true);
