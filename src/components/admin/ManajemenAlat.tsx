
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, Edit, Trash2 } from "lucide-react";

interface ManajemenAlatProps {
  onStatsUpdate: () => void;
}

const ManajemenAlat = ({ onStatsUpdate }: ManajemenAlatProps) => {
  const { toast } = useToast();
  const [alat, setAlat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    jumlah: "",
    kondisi: "baru",
    status_stok: "aman",
    deskripsi: ""
  });

  useEffect(() => {
    fetchAlat();
  }, []);

  const fetchAlat = async () => {
    try {
      const { data, error } = await supabase
        .from('alat')
        .select('*')
        .order('nama');

      if (error) throw error;
      setAlat(data || []);
    } catch (error) {
      console.error('Error fetching alat:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nama: "",
      jumlah: "",
      kondisi: "baru",
      status_stok: "aman",
      deskripsi: ""
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const alatData = {
        nama: formData.nama,
        jumlah: parseInt(formData.jumlah),
        kondisi: formData.kondisi,
        status_stok: formData.status_stok,
        deskripsi: formData.deskripsi
      };

      if (editingId) {
        const { error } = await supabase
          .from('alat')
          .update(alatData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: "Alat Diperbarui",
          description: "Data alat berhasil diperbarui.",
        });
      } else {
        const { error } = await supabase
          .from('alat')
          .insert(alatData);

        if (error) throw error;

        toast({
          title: "Alat Ditambahkan",
          description: "Alat baru berhasil ditambahkan ke inventaris.",
        });
      }

      fetchAlat();
      onStatsUpdate();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: any) => {
    setFormData({
      nama: item.nama,
      jumlah: item.jumlah.toString(),
      kondisi: item.kondisi,
      status_stok: item.status_stok,
      deskripsi: item.deskripsi || ""
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus alat ini?')) return;

    try {
      const { error } = await supabase
        .from('alat')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Alat Dihapus",
        description: "Alat berhasil dihapus dari inventaris.",
      });

      fetchAlat();
      onStatsUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    }
  };

  const getStokBadge = (status: string, jumlah: number) => {
    const statusConfig = {
      aman: { variant: "default" as const, label: "Tersedia" },
      hampir_habis: { variant: "secondary" as const, label: "Terbatas" },
      kosong: { variant: "destructive" as const, label: "Kosong" },
      pending_pengadaan: { variant: "outline" as const, label: "Pengadaan" }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? (
      <Badge variant={config.variant}>{config.label} ({jumlah})</Badge>
    ) : null;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Manajemen Alat & Barang
            </CardTitle>
            <CardDescription>
              Kelola inventaris alat dan barang bengkel
            </CardDescription>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Alat
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Form */}
        {showForm && (
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingId ? "Edit Alat" : "Tambah Alat Baru"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama Alat</Label>
                    <Input
                      id="nama"
                      value={formData.nama}
                      onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jumlah">Jumlah Stok</Label>
                    <Input
                      id="jumlah"
                      type="number"
                      min="0"
                      value={formData.jumlah}
                      onChange={(e) => setFormData(prev => ({ ...prev, jumlah: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kondisi">Kondisi</Label>
                    <Select 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, kondisi: value }))}
                      value={formData.kondisi}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        <SelectItem value="baru">Baru</SelectItem>
                        <SelectItem value="bekas">Bekas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status_stok">Status Stok</Label>
                    <Select 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status_stok: value }))}
                      value={formData.status_stok}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        <SelectItem value="aman">Aman</SelectItem>
                        <SelectItem value="hampir_habis">Hampir Habis</SelectItem>
                        <SelectItem value="kosong">Kosong</SelectItem>
                        <SelectItem value="pending_pengadaan">Pending Pengadaan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Textarea
                    id="deskripsi"
                    value={formData.deskripsi}
                    onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                    placeholder="Deskripsi tambahan tentang alat..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingId ? "Update" : "Tambah"} Alat
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* List Alat */}
        <div className="space-y-4">
          {alat.map((item) => (
            <Card key={item.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">{item.nama}</h4>
                      {getStokBadge(item.status_stok, item.jumlah)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><strong>Kondisi:</strong> {item.kondisi}</p>
                      {item.deskripsi && (
                        <p><strong>Deskripsi:</strong> {item.deskripsi}</p>
                      )}
                      <p><strong>Ditambahkan:</strong> {new Date(item.tanggal_ditambahkan).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {alat.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Belum ada alat yang terdaftar dalam inventaris
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
};

export default ManajemenAlat;
