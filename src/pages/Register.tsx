
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Wrench, ArrowLeft } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nama_lengkap: "",
    umur: "",
    kelas: "",
    jurusan: "",
    nis: ""
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
      // Sign up user
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nama_lengkap: formData.nama_lengkap
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Update profile with additional data
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            nama_lengkap: formData.nama_lengkap,
            umur: parseInt(formData.umur),
            kelas: formData.kelas,
            jurusan: formData.jurusan,
            nis: formData.nis,
            role: 'umum',
            status: 'pending'
          })
          .eq('id', data.user.id);

        if (updateError) throw updateError;

        toast({
          title: "Pendaftaran Berhasil!",
          description: "Akun Anda telah dibuat dan menunggu verifikasi admin.",
        });

        navigate('/');
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
              <div className="p-3 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg">
                <Wrench className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Daftar Siswa
            </CardTitle>
            <CardDescription>
              Daftarkan akun untuk mengakses sistem peminjaman alat bengkel
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
                  className="focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="umur">Umur</Label>
                  <Input
                    id="umur"
                    type="number"
                    value={formData.umur}
                    onChange={(e) => handleChange('umur', e.target.value)}
                    required
                    className="focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kelas">Kelas</Label>
                  <Input
                    id="kelas"
                    type="text"
                    placeholder="XI, XII"
                    value={formData.kelas}
                    onChange={(e) => handleChange('kelas', e.target.value)}
                    required
                    className="focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jurusan">Jurusan</Label>
                <Select onValueChange={(value) => handleChange('jurusan', value)} required>
                  <SelectTrigger className="focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue placeholder="Pilih jurusan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sistem Pembangkit">Sistem Pembangkit</SelectItem>
                    <SelectItem value="Audio Video">Audio Video</SelectItem>
                    <SelectItem value="Elektronika Industri">Elektronika Industri</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nis">NIS</Label>
                <Input
                  id="nis"
                  type="text"
                  value={formData.nis}
                  onChange={(e) => handleChange('nis', e.target.value)}
                  required
                  className="focus:ring-blue-500 focus:border-blue-500"
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
                  className="focus:ring-blue-500 focus:border-blue-500"
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
                  className="focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Daftar"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Sudah punya akun?{" "}
                <button
                  onClick={() => navigate('/auth')}
                  className="text-blue-600 hover:underline font-medium"
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

export default Register;
