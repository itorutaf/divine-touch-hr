import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react";

export default function PasswordReset() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending reset email
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-50">
      <div className="w-full max-w-[420px] px-4">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-xl bg-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-600/20">
            <span className="text-white font-bold text-xl">CB</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">CareBase</h1>
        </div>

        <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">
              {sent ? "Check your email" : "Reset your password"}
            </CardTitle>
            <CardDescription>
              {sent
                ? `We sent a reset link to ${email}`
                : "Enter your email and we'll send you a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-sm text-slate-500">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setSent(false); setEmail(""); }}
                >
                  Try another email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@agency.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-9"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </form>
            )}

            <div className="mt-4 text-center">
              <button
                onClick={() => setLocation("/login")}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
