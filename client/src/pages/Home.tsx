import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Users, ClipboardCheck, Shield, BarChart3 } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">CB</span>
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">CareBase</h1>
              <p className="text-xs text-slate-500">Home Care Operations Platform</p>
            </div>
          </div>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <a href={"/login"}>Sign In</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            Streamline Your Employee Onboarding
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            A comprehensive HR management system designed specifically for home care agencies. 
            Track candidates through every phase of onboarding with automated workflows and compliance tracking.
          </p>
          <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
            <a href={"/login"}>Get Started</a>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-slate-200 hover:border-emerald-300 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle className="text-lg">Employee Tracking</CardTitle>
              <CardDescription>
                Track all 76 data points from intake to active status with real-time pipeline visibility.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-200 hover:border-emerald-300 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <ClipboardCheck className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">8 Approval Gates</CardTitle>
              <CardDescription>
                Role-based approval workflows for HR, Compliance, Supervisors, and Admin teams.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-200 hover:border-emerald-300 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Compliance Ready</CardTitle>
              <CardDescription>
                Track clearances, I-9 verification, licenses, and maintain complete audit trails.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-200 hover:border-emerald-300 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle className="text-lg">Pipeline Analytics</CardTitle>
              <CardDescription>
                Visual dashboards showing onboarding progress, exceptions, and team performance.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Service Lines */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Supporting All Service Lines</h3>
          <p className="text-slate-600">Customized workflows for each program type</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 rounded-xl bg-white border border-slate-200">
            <div className="text-3xl font-bold text-emerald-600 mb-2">OLTL</div>
            <p className="text-slate-600 text-sm">Office of Long-Term Living</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-white border border-slate-200">
            <div className="text-3xl font-bold text-blue-600 mb-2">ODP</div>
            <p className="text-slate-600 text-sm">Office of Developmental Programs</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-white border border-slate-200">
            <div className="text-3xl font-bold text-purple-600 mb-2">Skilled</div>
            <p className="text-slate-600 text-sm">Licensed Professional Services</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} CareBase. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
