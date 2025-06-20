
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package } from "lucide-react";

const PinjamAlatPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [alat, setAlat] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    alat_id: "",
    jumlah: 1,
    keperluan: "",
    tanggal_kembali_rencana: ""
  });

  useEffect(() => {
    checkAuth();
    fetchAlat();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/');
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!profileData || (profileData.role !== 'siswa' && profileData.role !== 'guru') || profileData.status !== 'disetujui') {
      navigate('/');
      return;
    }

    setProfile(profileData);
  };

  const fetchAlat = async () => {
    try {
      const { data, error } = await supabase
        .from('alat')
        .select('*')
        .gt('jumlah', 0)
        .order('nama');

      if (error) throw error;
      setAlat(data || []);
    } catch (error) {
      console.error('Error fetching alat:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('User not authenticated');

      // Get selected alat to check stock
      const selectedAlat = alat.find(item => item.id === formData.alat_id);
      if (!selectedAlat) throw new Error('Alat tidak ditemukan');
      if (selectedAlat.jumlah < formData.jumlah) {
        throw new Error('Jumlah yang diminta melebihi stok yang tersedia');
      }

      const { error } = await supabase
        .from('peminjaman')
        .insert({
          user_id: session.user.id,
          alat_id: formData.alat_id,
          jumlah: formData.jumlah,
          keperluan: formData.keperluan,
          tanggal_pinjam: new Date().toISOString().split('T')[0],
          tanggal_kembali_rencana: formData.tanggal_kembali_rencana,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Peminjaman Berhasil Diajukan!",
        description: "Pengajuan peminjaman Anda telah dikirim dan menunggu persetujuan admin.",
      });

      if (profile.role === 'siswa') {
        navigate('/student-dashboard');
      } else {
        navigate('/teacher-dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan saat mengajukan peminjaman",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectedAlat = alat.find(item => item.id === formData.alat_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => {
            if (profile?.role === 'siswa') {
              navigate('/student-dashboard');
            } else {
              navigate('/teacher-dashboard');
            }
          }}
          className="mb-6 hover:bg-blue-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Button>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Pinjam Alat
            </CardTitle>
            <CardDescription>
              Ajukan peminjaman alat bengkel SMK Elektro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alat_id">Pilih Alat</Label>
                <Select onValueChange={(value) => handleChange('alat_id', value)} required>
                  <SelectTrigger className="focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue placeholder="Pilih alat yang akan dipinjam" />
                  </SelectTrigger>
                  <SelectContent>
                    {alat.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.nama} (Stok: {item.jumlah})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAlat && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    {selectedAlat.gambar_url && (
                      <img 
                        src={selectedAlat.gambar_url} 
                        alt={selectedAlat.nama}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    )}
                    <div>
                      <h4 className="font-medium">{selectedAlat.nama}</h4>
                      <p className="text-sm text-gray-600">Stok tersedia: {selectedAlat.jumlah}</p>
                      <p className="text-sm text-gray-600">Kondisi: {selectedAlat.kondisi}</p>
                    </div>
                  </div>
                  {selectedAlat.deskripsi && (
                    <p className="text-sm text-gray-500">{selectedAlat.deskripsi}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="jumlah">Jumlah</Label>
                <Input
                  id="jumlah"
                  type="number"
                  min="1"
                  max={selectedAlat?.jumlah || 1}
                  value={formData.jumlah}
                  onChange={(e) => handleChange('jumlah', parseInt(e.target.value))}
                  required
                  className="focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tanggal_kembali_rencana">Rencana Tanggal Kembali</Label>
                <Input
                  id="tanggal_kembali_rencana"
                  type="date"
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  value={formData.tanggal_kembali_rencana}
                  onChange={(e) => handleChange('tanggal_kembali_rencana', e.target.value)}
                  required
                  className="focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keperluan">Keperluan</Label>
                <Textarea
                  id="keperluan"
                  placeholder="Jelaskan untuk apa alat ini akan digunakan..."
                  value={formData.keperluan}
                  onChange={(e) => handleChange('keperluan', e.target.value)}
                  required
                  className="focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                disabled={loading || !formData.alat_id}
              >
                {loading ? "Memproses..." : "Ajukan Peminjaman"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PinjamAlatPage;
