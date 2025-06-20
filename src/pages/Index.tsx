import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Users, BookOpen, ArrowRight, GraduationCap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);

      // Redirect based on role and status
      if (data.role === 'admin') {
        navigate('/admin');
      } else if (data.status === 'disetujui') {
        navigate('/dashboard');
      } else if (data.status === 'pending') {
        toast({
          title: "Akun Menunggu Verifikasi",
          description: "Akun Anda sedang menunggu persetujuan dari admin.",
          variant: "default"
        });
      } else if (data.status === 'ditolak') {
        toast({
          title: "Akun Ditolak",
          description: "Akun Anda telah ditolak. Silakan hubungi admin.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user && profile) {
    return null; // Will redirect based on role
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  SMK Elektro
                </h1>
                <p className="text-sm text-gray-600">Sistem Manajemen Aset Bengkel</p>
              </div>
            </div>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth')}
                className="hover:bg-blue-50"
              >
                Masuk
              </Button>
              <Button 
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                Daftar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Sistem Informasi Manajemen Aset Bengkel
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Platform digital untuk mengelola inventaris alat bengkel elektro, 
              sistem peminjaman yang efisien, dan monitoring real-time untuk SMK Elektro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                onClick={() => navigate('/student-register')}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-lg px-8 py-3"
              >
                Daftar Siswa
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                onClick={() => navigate('/teacher-register')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-3"
              >
                Daftar Guru
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/student-auth')}
                className="text-lg px-8 py-3 hover:bg-blue-50"
              >
                Login Siswa
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/teacher-auth')}
                className="text-lg px-8 py-3 hover:bg-purple-50"
              >
                Login Guru
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-3 hover:bg-gray-50"
              >
                Login Admin
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Fitur Unggulan
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader>
                <div className="p-3 bg-blue-600 rounded-lg w-fit mb-4">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-blue-800">Manajemen Alat</CardTitle>
                <CardDescription>
                  Kelola inventaris alat bengkel secara digital dengan tracking real-time
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader>
                <div className="p-3 bg-green-600 rounded-lg w-fit mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-green-800">Sistem Peminjaman</CardTitle>
                <CardDescription>
                  Proses peminjaman dan pengembalian alat yang terstruktur dan terpantau
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader>
                <div className="p-3 bg-purple-600 rounded-lg w-fit mb-4">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-purple-800">Verifikasi Akun</CardTitle>
                <CardDescription>
                  Sistem verifikasi siswa dan guru yang aman dan terkontrol oleh admin
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardHeader>
                <div className="p-3 bg-orange-600 rounded-lg w-fit mb-4">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-orange-800">Multi Role</CardTitle>
                <CardDescription>
                  Akses terpisah untuk siswa, guru dan admin dengan fitur yang sesuai
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Wrench className="h-6 w-6" />
            <span className="text-lg font-semibold">SMK Elektro - Sistem Manajemen Aset</span>
          </div>
          <p className="text-blue-100">
            © 2024 SMK Elektro. Platform digital untuk manajemen bengkel yang efisien.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
