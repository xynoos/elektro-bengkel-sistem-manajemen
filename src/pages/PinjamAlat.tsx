
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, Send } from "lucide-react";

const PinjamAlat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [alat, setAlat] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    alat_id: "",
    jumlah: "",
    keperluan: ""
  });

  useEffect(() => {
    checkAuth();
    fetchAlat();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'umum' || profile?.status !== 'disetujui') {
      navigate('/');
      return;
    }

    setUser(session.user);
  };

  const fetchAlat = async () => {
    try {
      const { data, error } = await supabase
        .from('alat')
        .select('*')
        .gt('jumlah', 0)
        .in('status_stok', ['aman', 'hampir_habis'])
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
      const selectedAlat = alat.find(a => a.id === formData.alat_id);
      if (!selectedAlat) throw new Error('Alat tidak ditemukan');

      if (parseInt(formData.jumlah) > selectedAlat.jumlah) {
        throw new Error('Jumlah peminjaman melebihi stok yang tersedia');
      }

      const { error } = await supabase
        .from('peminjaman')
        .insert({
          user_id: user.id,
          alat_id: formData.alat_id,
          jumlah: parseInt(formData.jumlah),
          keperluan: formData.keperluan,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Pengajuan Berhasil!",
        description: "Pengajuan peminjaman Anda telah dikirim dan menunggu persetujuan admin.",
      });

      navigate('/dashboard');
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

  const selectedAlat = alat.find(a => a.id === formData.alat_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6 hover:bg-blue-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg">
                  <Package className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Pengajuan Peminjaman Alat
              </CardTitle>
              <CardDescription>
                Isi form di bawah untuk mengajukan peminjaman alat bengkel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="alat_id">Pilih Alat</Label>
                  <Select 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, alat_id: value }))} 
                    required
                  >
                    <SelectTrigger className="focus:ring-blue-500 focus:border-blue-500">
                      <SelectValue placeholder="Pilih alat yang ingin dipinjam" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      {alat.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.nama} (Stok: {item.jumlah})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAlat && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Informasi Alat</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>Nama: {selectedAlat.nama}</p>
                      <p>Stok Tersedia: {selectedAlat.jumlah}</p>
                      <p>Kondisi: {selectedAlat.kondisi}</p>
                      {selectedAlat.deskripsi && (
                        <p>Deskripsi: {selectedAlat.deskripsi}</p>
                      )}
                    </div>
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
                    onChange={(e) => setFormData(prev => ({ ...prev, jumlah: e.target.value }))}
                    required
                    className="focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keperluan">Keperluan/Tujuan Peminjaman</Label>
                  <Textarea
                    id="keperluan"
                    placeholder="Jelaskan untuk apa alat ini akan digunakan..."
                    value={formData.keperluan}
                    onChange={(e) => setFormData(prev => ({ ...prev, keperluan: e.target.value }))}
                    required
                    className="focus:ring-blue-500 focus:border-blue-500 min-h-20"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-lg py-3"
                  disabled={loading}
                >
                  {loading ? (
                    "Mengirim..."
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Ajukan Peminjaman
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PinjamAlat;
