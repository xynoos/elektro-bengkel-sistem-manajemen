
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, Edit, Trash2, ImageOff } from "lucide-react";
import { Database } from "@/types";
import { PostgrestError } from "@supabase/supabase-js";
import { AspectRatio } from "@/components/ui/aspect-ratio";

type Alat = Database['public']['Tables']['alat']['Row'];

interface ManajemenAlatProps {
  onStatsUpdate: () => void;
}

const ManajemenAlat = ({ onStatsUpdate }: ManajemenAlatProps) => {
  const { toast } = useToast();
  const [alat, setAlat] = useState<Alat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    jumlah: "",
    kondisi: "baru",
    status_stok: "aman",
    deskripsi: "",
    gambar: null as File | null,
    gambar_url: ""
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
      toast({
        title: "Error",
        description: "Gagal mengambil data alat",
        variant: "destructive",
      });
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
      deskripsi: "",
      gambar: null,
      gambar_url: ""
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      
      // Validasi tipe file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipe file tidak didukung. Gunakan format JPG, PNG, GIF, atau WebP.');
      }

      // Validasi ukuran file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Ukuran file terlalu besar. Maksimal 5MB.');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-');
      const filePath = `${timestamp}-${fileName}`;

      console.log('Uploading file:', filePath);

      // Upload file ke bucket item-images
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('item-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);
      return filePath;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    
    const { data } = supabase.storage
      .from('item-images')
      .getPublicUrl(imagePath);
    
    return data?.publicUrl || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let gambar_url = formData.gambar_url;

      if (formData.gambar) {
        gambar_url = await handleImageUpload(formData.gambar);
      }

      const alatData = {
        nama: formData.nama,
        jumlah: parseInt(formData.jumlah),
        kondisi: formData.kondisi,
        status_stok: formData.status_stok,
        deskripsi: formData.deskripsi,
        gambar_url
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
          .insert([alatData]);

        if (error) throw error;

        toast({
          title: "Alat Ditambahkan",
          description: "Alat baru berhasil ditambahkan ke inventaris.",
        });
      }

      fetchAlat();
      onStatsUpdate();
      resetForm();
    } catch (error) {
      const pgError = error as PostgrestError;
      toast({
        title: "Error",
        description: pgError.message || "Terjadi kesalahan saat menambahkan alat",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: Alat) => {
    setFormData({
      nama: item.nama,
      jumlah: item.jumlah.toString(),
      kondisi: item.kondisi,
      status_stok: item.status_stok,
      deskripsi: item.deskripsi || "",
      gambar: null,
      gambar_url: item.gambar_url || ""
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
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
    } catch (error) {
      const pgError = error as PostgrestError;
      toast({
        title: "Error",
        description: pgError.message || "Terjadi kesalahan saat menghapus alat",
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manajemen Alat</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Alat
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Alat" : "Tambah Alat Baru"}</CardTitle>
            <CardDescription>
              {editingId ? "Perbarui informasi alat yang sudah ada." : "Tambahkan alat baru ke inventaris."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Alat</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jumlah">Jumlah</Label>
                  <Input
                    id="jumlah"
                    type="number"
                    min="0"
                    value={formData.jumlah}
                    onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kondisi">Kondisi</Label>
                  <Select
                    value={formData.kondisi}
                    onValueChange={(value) => setFormData({ ...formData, kondisi: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kondisi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baru">Baru</SelectItem>
                      <SelectItem value="bekas">Bekas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status_stok">Status Stok</Label>
                  <Select
                    value={formData.status_stok}
                    onValueChange={(value) => setFormData({ ...formData, status_stok: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
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
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gambar">Gambar Alat</Label>
                <Input
                  id="gambar"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({ ...formData, gambar: file });
                    }
                  }}
                />
                <p className="text-sm text-gray-500">
                  Format yang didukung: JPG, PNG, GIF, WebP. Maksimal 5MB.
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={resetForm}>
                  Batal
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "Mengupload..." : editingId ? "Simpan Perubahan" : "Tambah Alat"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <p>Memuat data alat...</p>
          </div>
        ) : alat.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p>Belum ada alat yang ditambahkan.</p>
          </div>
        ) : (
          alat.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Package className="mr-2 h-5 w-5" />
                    {item.nama}
                  </span>
                  {getStokBadge(item.status_stok, item.jumlah)}
                </CardTitle>
                <CardDescription>
                  Kondisi: {item.kondisi}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {item.deskripsi && (
                  <p className="text-sm text-gray-600">{item.deskripsi}</p>
                )}
                
                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                  <AspectRatio ratio={4/3} className="bg-gray-50">
                    {item.gambar_url ? (
                      <img
                        src={getImageUrl(item.gambar_url) || ''}
                        alt={item.nama}
                        className="h-full w-full object-cover transition-opacity duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-50">
                                <div class="rounded-full bg-gray-100 p-3">
                                  <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </div>
                                <span class="text-sm font-medium text-gray-600">Gambar tidak dapat dimuat</span>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-50">
                        <div className="rounded-full bg-gray-100 p-3">
                          <ImageOff className="h-6 w-6 text-gray-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">Belum ada gambar</span>
                      </div>
                    )}
                  </AspectRatio>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Alat</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus alat "{item.nama}"? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)}>
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ManajemenAlat;
