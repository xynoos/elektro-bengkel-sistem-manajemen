
-- Update the profiles table to handle teacher and student data properly
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new columns for teacher data if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mata_pelajaran TEXT,
ADD COLUMN IF NOT EXISTS nip TEXT,
ADD COLUMN IF NOT EXISTS alasan_penolakan TEXT;

-- Create a more flexible role constraint that includes guru and siswa
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'siswa', 'guru', 'umum'));

-- Update the handle_new_user function to handle the new roles properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    nama_lengkap, 
    role, 
    status,
    tanggal_daftar
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'umum'),
    'pending',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nama_lengkap = EXCLUDED.nama_lengkap,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    tanggal_daftar = EXCLUDED.tanggal_daftar;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;
