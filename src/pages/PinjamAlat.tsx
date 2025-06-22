
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, Send, Plus, Minus } from "lucide-react";

interface SelectedItem {
  alat_id: string;
  jumlah: number;
  nama: string;
  stok_tersedia: number;
}

const PinjamAlat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [alat, setAlat] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [formData, setFormData] = useState({
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
        .order('kategori', { ascending: true })
        .order('nama', { ascending: true });

      if (error) throw error;
      setAlat(data || []);
    } catch (error) {
      console.error('Error fetching alat:', error);
    }
  };

  const handleItemSelect = (item: any, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, {
        alat_id: item.id,
        jumlah: 1,
        nama: item.nama,
        stok_tersedia: item.jumlah
      }]);
    } else {
      setSelectedItems(prev => prev.filter(selected => selected.alat_id !== item.id));
    }
  };

  const updateItemQuantity = (alat_id: string, newQuantity: number) => {
    setSelectedItems(prev => prev.map(item => 
      item.alat_id === alat_id 
        ? { ...item, jumlah: Math.max(1, Math.min(newQuantity, item.stok_tersedia)) }
        : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Pilih minimal satu alat untuk dipinjam",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Create individual peminjaman records for each selected item
      for (const item of selectedItems) {
        const { error: peminjamanError } = await supabase
          .from('peminjaman')
          .insert({
            user_id: user.id,
            alat_id: item.alat_id,
            jumlah: item.jumlah,
            keperluan: formData.keperluan,
            tanggal_pinjam: today,
            tanggal_kembali_rencana: formData.tanggal_kembali_rencana,
            status: 'pending'
          });

        if (peminjamanError) throw peminjamanError;

        // Reduce stock when peminjaman is created (will be restored if rejected)
        const { error: stockError } = await supabase
          .from('alat')
          .update({ 
            jumlah: Math.max(0, (alat.find(a => a.id === item.alat_id)?.jumlah || 0) - item.jumlah)
          })
          .eq('id', item.alat_id);

        if (stockError) throw stockError;
      }

      toast({
        title: "Pengajuan Berhasil!",
        description: `${selectedItems.length} alat berhasil diajukan untuk peminjaman dan menunggu persetujuan admin.`,
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

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getCategoryBadge = (kategori: string) => {
    const colors = {
      'alat': 'bg-blue-100 text-blue-800',
      'bahan': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[kategori as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {kategori || 'Tidak dikategorikan'}
      </span>
    );
  };

  // Group alat by category
  const groupedAlat: Record<string, any[]> = alat.reduce((acc, item) => {
    const kategori = item.kategori || 'Tidak dikategorikan';
    if (!acc[kategori]) {
      acc[kategori] = [];
    }
    acc[kategori].push(item);
    return acc;
  }, {} as Record<string, any[]>);

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

        <div className="max-w-4xl mx-auto">
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
                Pilih alat yang ingin dipinjam dan isi form di bawah
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Available Tools Selection */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Pilih Alat & Bahan</Label>
                  <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                    {Object.entries(groupedAlat).map(([kategori, items]) => (
                      <div key={kategori} className="mb-6">
                        <h4 className="font-semibold text-sm text-gray-700 border-b pb-2 mb-3">
                          {kategori.toUpperCase()}
                        </h4>
                        <div className="grid gap-3">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                              <Checkbox
                                id={item.id}
                                checked={selectedItems.some(selected => selected.alat_id === item.id)}
                                onCheckedChange={(checked) => handleItemSelect(item, checked as boolean)}
                              />
                              <div className="flex items-center gap-3 flex-1">
                                {item.gambar_url && (
                                  <img 
                                    src={item.gambar_url} 
                                    alt={item.nama}
                                    className="w-12 h-12 object-cover rounded-md"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className="flex-1">
                                  <h5 className="font-medium">{item.nama}</h5>
                                  <p className="text-sm text-gray-600">Stok: {item.jumlah} • {item.kondisi}</p>
                                  <div className="mt-1">
                                    {getCategoryBadge(item.kategori)}
                                  </div>
                                  {item.deskripsi && (
                                    <p className="text-xs text-gray-500 mt-1">{item.deskripsi}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Items */}
                {selectedItems.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Alat yang Dipilih ({selectedItems.length})</Label>
                    <div className="space-y-3 border rounded-lg p-4 bg-blue-50">
                      {selectedItems.map((item) => (
                        <div key={item.alat_id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div>
                            <h5 className="font-medium">{item.nama}</h5>
                            <p className="text-sm text-gray-600">Stok tersedia: {item.stok_tersedia}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(item.alat_id, item.jumlah - 1)}
                              disabled={item.jumlah <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="px-3 py-1 bg-gray-100 rounded text-sm font-medium min-w-12 text-center">
                              {item.jumlah}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(item.alat_id, item.jumlah + 1)}
                              disabled={item.jumlah >= item.stok_tersedia}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="tanggal_kembali_rencana">Tanggal Rencana Pengembalian</Label>
                  <Input
                    id="tanggal_kembali_rencana"
                    type="date"
                    min={getMinDate()}
                    value={formData.tanggal_kembali_rencana}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggal_kembali_rencana: e.target.value }))}
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
                  disabled={loading || selectedItems.length === 0}
                >
                  {loading ? (
                    "Mengirim..."
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Ajukan Peminjaman ({selectedItems.length} item)
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
