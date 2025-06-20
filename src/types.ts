export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      alat: {
        Row: {
          id: string
          nama: string
          jumlah: number
          kondisi: string
          status_stok: string
          deskripsi: string | null
          gambar_url: string | null
          tanggal_ditambahkan: string
          updated_at: string
        }
        Insert: {
          id?: string
          nama: string
          jumlah: number
          kondisi?: string
          status_stok?: string
          deskripsi?: string | null
          gambar_url?: string | null
          tanggal_ditambahkan?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nama?: string
          jumlah?: number
          kondisi?: string
          status_stok?: string
          deskripsi?: string | null
          gambar_url?: string | null
          tanggal_ditambahkan?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          nama: string | null
          kelas: string | null
          role: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nama?: string | null
          kelas?: string | null
          role?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nama?: string | null
          kelas?: string | null
          role?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      peminjaman: {
        Row: {
          id: string
          user_id: string
          alat_id: string
          jumlah: number
          tanggal_pinjam: string
          tanggal_kembali: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          alat_id: string
          jumlah?: number
          tanggal_pinjam?: string
          tanggal_kembali?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          alat_id?: string
          jumlah?: number
          tanggal_pinjam?: string
          tanggal_kembali?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}