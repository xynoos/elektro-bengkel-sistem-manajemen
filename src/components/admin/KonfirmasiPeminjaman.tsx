
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, FileText, Package } from "lucide-react";

interface KonfirmasiPeminjamanProps {
  onStatsUpdate: () => void;
}

const KonfirmasiPeminjaman = ({ onStatsUpdate }: KonfirmasiPeminjamanProps) => {
  const { toast } = useToast();
  const [peminjaman, setPeminjaman] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPeminjaman();
  }, []);

  const fetchPeminjaman = async () => {
    try {
      const { data, error } = await supabase
        .from('peminjaman')
        .select(`
          *,
          profiles:user_id (nama_lengkap, kelas, jurusan, role),
          alat:alat_id (nama, jumlah)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched peminjaman:', data);
      setPeminjaman(data || []);
    } catch (error) {
      console.error('Error fetching peminjaman:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id: string, status: 'disetujui' | 'ditolak') => {
    try {
      const updateData: any = { status };
      
      if (status === 'disetujui') {
        updateData.tanggal_kembali = null;
        updateData.dikembalikan = false;
      }

      const { error } = await supabase
        .from('peminjaman')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // If approved, update stock
      if (status === 'disetujui') {
        const peminjamanItem = peminjaman.find(p => p.id === id);
        if (peminjamanItem && peminjamanItem.alat) {
          const { error: stockError } = await supabase
            .from('alat')
            .update({ 
              jumlah: Math.max(0, peminjamanItem.alat.jumlah - peminjamanItem.jumlah)
            })
            .eq('id', peminjamanItem.alat_id);

          if (stockError) {
            console.error('Error updating stock:', stockError);
            throw stockError;
          }
        }
      }

      toast({
        title: status === 'disetujui' ? "Peminjaman Disetujui" : "Peminjaman Ditolak",
        description: `Pengajuan peminjaman telah ${status === 'disetujui' ? 'disetujui' : 'ditolak'}.`,
      });

      fetchPeminjaman();
      onStatsUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    }
  };

  const handleReturn = async (id: string) => {
    try {
      const { error } = await supabase
        .from('peminjaman')
        .update({ 
          status: 'selesai',
          dikembalikan: true,
          tanggal_kembali: new Date().toISOString().split('T')[0]
        })
        .eq('id', id);

      if (error) throw error;

      // Return stock
      const peminjamanItem = peminjaman.find(p => p.id === id);
      if (peminjamanItem && peminjamanItem.alat) {
        const { data: currentAlat } = await supabase
          .from('alat')
          .select('jumlah')
          .eq('id', peminjamanItem.alat_id)
          .single();

        if (currentAlat) {
          const { error: stockError } = await supabase
            .from('alat')
            .update({ 
              jumlah: currentAlat.jumlah + peminjamanItem.jumlah
            })
            .eq('id', peminjamanItem.alat_id);

          if (stockError) throw stockError;
        }
      }

      toast({
        title: "Pengembalian Dikonfirmasi",
        description: "Alat telah dikembalikan dan stok diperbarui.",
      });

      fetchPeminjaman();
      onStatsUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Menunggu", icon: Clock },
      disetujui: { variant: "default" as const, label: "Disetujui", icon: Check },
      ditolak: { variant: "destructive" as const, label: "Ditolak", icon: X },
      selesai: { variant: "outline" as const, label: "Selesai", icon: Package }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Konfirmasi Peminjaman
        </CardTitle>
        <CardDescription>
          Kelola pengajuan peminjaman alat dari siswa dan guru
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {peminjaman.map((item) => (
            <Card key={item.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">{item.alat?.nama || 'Alat tidak ditemukan'}</h4>
                      {getStatusBadge(item.status)}
                      <Badge variant="outline" className="text-xs">
                        {item.profiles?.role === 'siswa' ? 'Siswa' : 'Guru'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="space-y-1">
                        <p><strong>Peminjam:</strong> {item.profiles?.nama_lengkap || 'Nama tidak tersedia'}</p>
                        {item.profiles?.role === 'siswa' && (
                          <p><strong>Kelas:</strong> {item.profiles?.kelas} - {item.profiles?.jurusan}</p>
                        )}
                        <p><strong>Jumlah:</strong> {item.jumlah}</p>
                        {item.keperluan && (
                          <p><strong>Keperluan:</strong> {item.keperluan}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p><strong>Tanggal Pinjam:</strong> {new Date(item.tanggal_pinjam).toLocaleDateString('id-ID')}</p>
                        {item.tanggal_kembali_rencana && (
                          <p><strong>Rencana Kembali:</strong> {new Date(item.tanggal_kembali_rencana).toLocaleDateString('id-ID')}</p>
                        )}
                        {item.tanggal_kembali && (
                          <p><strong>Tanggal Kembali:</strong> {new Date(item.tanggal_kembali).toLocaleDateString('id-ID')}</p>
                        )}
                        <p><strong>Dibuat:</strong> {new Date(item.created_at).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {item.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApproval(item.id, 'disetujui')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleApproval(item.id, 'ditolak')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Tolak
                        </Button>
                      </>
                    )}
                    
                    {item.status === 'disetujui' && !item.dikembalikan && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReturn(item.id)}
                      >
                        <Package className="h-4 w-4 mr-1" />
                        Konfirmasi Kembali
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {peminjaman.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Belum ada pengajuan peminjaman
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
};

export default KonfirmasiPeminjaman;
