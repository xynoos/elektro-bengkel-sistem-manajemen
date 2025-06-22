
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Package, Clock, CheckCircle, XCircle, Users, Plus } from "lucide-react";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [alat, setAlat] = useState<any[]>([]);
  const [peminjaman, setPeminjaman] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/teacher-auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'guru' || profile?.status !== 'disetujui') {
      navigate('/');
      return;
    }

    setUser(session.user);
    setProfile(profile);
  };

  const fetchData = async () => {
    try {
      // Fetch available tools
      const { data: alatData, error: alatError } = await supabase
        .from('alat')
        .select('*')
        .order('kategori', { ascending: true })
        .order('nama', { ascending: true });

      if (alatError) throw alatError;
      setAlat(alatData || []);

      // Fetch user's borrowing history
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: peminjamanData, error: peminjamanError } = await supabase
          .from('peminjaman')
          .select(`
            *,
            alat:alat_id (nama, kategori)
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (peminjamanError) throw peminjamanError;
        setPeminjaman(peminjamanData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Menunggu", icon: Clock },
      disetujui: { variant: "default" as const, label: "Disetujui", icon: CheckCircle },
      ditolak: { variant: "destructive" as const, label: "Ditolak", icon: XCircle },
      selesai: { variant: "outline" as const, label: "Selesai", icon: CheckCircle }
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

  const getStokBadge = (jumlah: number, status_stok: string) => {
    if (jumlah === 0) {
      return <Badge variant="destructive">Kosong</Badge>;
    } else if (status_stok === 'hampir_habis') {
      return <Badge variant="secondary">Terbatas</Badge>;
    } else {
      return <Badge variant="default">Tersedia</Badge>;
    }
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

  // Group tools by category with proper typing
  const groupedAlat: Record<string, any[]> = alat.reduce((acc, item) => {
    const kategori = item.kategori || 'Tidak dikategorikan';
    if (!acc[kategori]) {
      acc[kategori] = [];
    }
    acc[kategori].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Dashboard Guru
                </h1>
                <p className="text-sm text-gray-600">Selamat datang, {profile?.nama_lengkap}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => navigate('/pinjam-alat')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Pinjam Alat
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Available Tools */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Alat & Bahan Tersedia
              </CardTitle>
              <CardDescription>
                Daftar alat dan bahan yang tersedia di bengkel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(groupedAlat).map(([kategori, items]) => (
                  <div key={kategori} className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-700 border-b pb-1">
                      {kategori.toUpperCase()}
                    </h4>
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {item.gambar_url && (
                              <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                                <img 
                                  src={item.gambar_url} 
                                  alt={item.nama}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.log('Image failed to load:', item.gambar_url);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                  onLoad={() => console.log('Image loaded successfully:', item.gambar_url)}
                                />
                              </div>
                            )}
                            <div>
                              <h4 className="font-medium">{item.nama}</h4>
                              <p className="text-sm text-gray-600">Stok: {item.jumlah} • {item.kondisi}</p>
                              <div className="mt-1">
                                {getCategoryBadge(item.kategori)}
                              </div>
                            </div>
                          </div>
                          {item.deskripsi && (
                            <p className="text-xs text-gray-500 mt-1">{item.deskripsi}</p>
                          )}
                        </div>
                        {getStokBadge(item.jumlah, item.status_stok)}
                      </div>
                    ))}
                  </div>
                ))}
                {alat.length === 0 && (
                  <p className="text-center text-gray-500 py-8">Belum ada alat yang tersedia</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Borrowing History */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Riwayat Peminjaman
              </CardTitle>
              <CardDescription>
                Status peminjaman alat Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {peminjaman.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{item.alat?.nama}</h4>
                        {item.alat?.kategori && (
                          <div className="mt-1">
                            {getCategoryBadge(item.alat.kategori)}
                          </div>
                        )}
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Jumlah: {item.jumlah}</p>
                      {item.keperluan && <p>Keperluan: {item.keperluan}</p>}
                      <p>Tanggal Pinjam: {new Date(item.tanggal_pinjam).toLocaleDateString('id-ID')}</p>
                      <p>Rencana Kembali: {new Date(item.tanggal_kembali_rencana).toLocaleDateString('id-ID')}</p>
                      {item.keterangan && <p>Keterangan: {item.keterangan}</p>}
                    </div>
                  </div>
                ))}
                {peminjaman.length === 0 && (
                  <p className="text-center text-gray-500 py-8">Belum ada riwayat peminjaman</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
