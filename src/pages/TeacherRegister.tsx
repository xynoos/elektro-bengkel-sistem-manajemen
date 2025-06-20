
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Wrench, ArrowLeft, Users } from "lucide-react";

const TeacherRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nama_lengkap: "",
    mata_pelajaran: "",
    nip: ""
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nama_lengkap: formData.nama_lengkap,
            role: 'guru'
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            nama_lengkap: formData.nama_lengkap,
            mata_pelajaran: formData.mata_pelajaran,
            nip: formData.nip,
            role: 'guru',
            status: 'pending'
          })
          .eq('id', data.user.id);

        if (updateError) throw updateError;

        toast({
          title: "Pendaftaran Berhasil!",
          description: "Akun guru Anda telah dibuat dan menunggu verifikasi admin.",
        });

        navigate('/pending-account');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan saat mendaftar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 hover:bg-blue-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Beranda
        </Button>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Daftar Guru
            </CardTitle>
            <CardDescription>
              Daftarkan akun guru untuk mengakses sistem peminjaman alat bengkel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
                <Input
                  id="nama_lengkap"
                  type="text"
                  value={formData.nama_lengkap}
                  onChange={(e) => handleChange('nama_lengkap', e.target.value)}
                  required
                  className="focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mata_pelajaran">Mata Pelajaran</Label>
                <Select onValueChange={(value) => handleChange('mata_pelajaran', value)} required>
                  <SelectTrigger className="focus:ring-purple-500 focus:border-purple-500">
                    <SelectValue placeholder="Pilih mata pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Teknik Instalasi Listrik">Teknik Instalasi Listrik</SelectItem>
                    <SelectItem value="Sistem Pembangkit">Sistem Pembangkit</SelectItem>
                    <SelectItem value="Audio Video">Audio Video</SelectItem>
                    <SelectItem value="Elektronika Industri">Elektronika Industri</SelectItem>
                    <SelectItem value="Pemrograman">Pemrograman</SelectItem>
                    <SelectItem value="Matematika">Matematika</SelectItem>
                    <SelectItem value="Fisika">Fisika</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nip">NIP</Label>
                <Input
                  id="nip"
                  type="text"
                  value={formData.nip}
                  onChange={(e) => handleChange('nip', e.target.value)}
                  required
                  className="focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  className="focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                  className="focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Daftar"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Sudah punya akun?{" "}
                <button
                  onClick={() => navigate('/teacher-auth')}
                  className="text-purple-600 hover:underline font-medium"
                >
                  Login di sini
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherRegister;
