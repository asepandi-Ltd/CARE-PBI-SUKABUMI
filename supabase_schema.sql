-- SQL Schema & RLS Policies for CARE-PBI Sukabumi

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Custom Types
CREATE TYPE user_role AS ENUM ('Super Admin', 'Admin Pendaftaran', 'Petugas Verifikator', 'Kepala Instalasi', 'Direktur');
CREATE TYPE cara_bayar AS ENUM ('KTP/KK', 'Tunai', 'BPJS PBI', 'BPJS Non Aktif');
CREATE TYPE jenis_pasien AS ENUM ('Rawat Inap', 'IGD');
CREATE TYPE status_pengajuan AS ENUM ('Draft', 'Menunggu Verifikasi', 'Disetujui', 'Ditolak');
CREATE TYPE jenis_dokumen AS ENUM ('spr', 'ktp', 'kk');

-- 3. Create Tables
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'Admin Pendaftaran',
    unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no_spr TEXT UNIQUE NOT NULL,
    tanggal_spr DATE NOT NULL,
    nama TEXT NOT NULL,
    nik TEXT UNIQUE NOT NULL,
    no_kk TEXT NOT NULL,
    alamat TEXT NOT NULL,
    tanggal_lahir DATE NOT NULL,
    no_hp TEXT,
    cara_bayar cara_bayar NOT NULL,
    jenis_pasien jenis_pasien NOT NULL,
    status_pengajuan status_pengajuan DEFAULT 'Draft',
    penyebab_penolakan TEXT,
    status_warning TEXT DEFAULT 'aman',
    doc_spr BOOLEAN DEFAULT FALSE,
    doc_ktp BOOLEAN DEFAULT FALSE,
    doc_kk BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.patient_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    jenis_dokumen jenis_dokumen NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.submission_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    status_lama status_pengajuan,
    status_baru status_pengajuan NOT NULL,
    catatan TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Set Up RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function: Get Current User Role
CREATE OR REPLACE FUNCTION get_user_role() RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can view their own profile and super admins can view all" 
ON public.profiles FOR SELECT USING (auth.uid() = id OR get_user_role() = 'Super Admin');

CREATE POLICY "Super Admins can manage all profiles" 
ON public.profiles FOR ALL USING (get_user_role() = 'Super Admin');

-- Patients Policies
CREATE POLICY "Super Admin has full CRUD on patients" 
ON public.patients FOR ALL USING (get_user_role() = 'Super Admin');

CREATE POLICY "Admin Pendaftaran can manage their own created patients" 
ON public.patients FOR ALL USING (get_user_role() = 'Admin Pendaftaran' AND created_by = auth.uid());

CREATE POLICY "Admin Pendaftaran can view all patients" 
ON public.patients FOR SELECT USING (get_user_role() = 'Admin Pendaftaran');

CREATE POLICY "Petugas Verifikator can update status" 
ON public.patients FOR UPDATE USING (get_user_role() = 'Petugas Verifikator');

CREATE POLICY "Petugas Verifikator can view all patients" 
ON public.patients FOR SELECT USING (get_user_role() = 'Petugas Verifikator');

CREATE POLICY "Kepala Instalasi and Direktur can view all patients" 
ON public.patients FOR SELECT USING (get_user_role() IN ('Kepala Instalasi', 'Direktur'));

-- Document Policies
CREATE POLICY "Super Admin full access to documents" 
ON public.patient_documents FOR ALL USING (get_user_role() = 'Super Admin');

CREATE POLICY "Admin Pendaftaran can insert and select documents" 
ON public.patient_documents FOR ALL USING (get_user_role() = 'Admin Pendaftaran');

CREATE POLICY "Verifikator, Kepala Instalasi, Direktur can select documents" 
ON public.patient_documents FOR SELECT USING (get_user_role() IN ('Petugas Verifikator', 'Kepala Instalasi', 'Direktur'));

-- Submission Logs Policies
CREATE POLICY "All authenticated users can view logs" 
ON public.submission_logs FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Verifikator and Admin Pendaftaran can insert logs" 
ON public.submission_logs FOR INSERT WITH CHECK (get_user_role() IN ('Petugas Verifikator', 'Admin Pendaftaran', 'Super Admin'));

-- Audit Logs Policies
CREATE POLICY "Super Admin and Direktur can view audit logs" 
ON public.audit_logs FOR SELECT USING (get_user_role() IN ('Super Admin', 'Direktur'));

CREATE POLICY "All authenticated users can insert audit logs" 
ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Setup Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('spr', 'spr', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('ktp', 'ktp', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('kk', 'kk', false);

-- Storage RLS
CREATE POLICY "Authenticated users can upload documents" 
ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view documents" 
ON storage.objects FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their documents" 
ON storage.objects FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their documents" 
ON storage.objects FOR DELETE USING (auth.role() = 'authenticated');
