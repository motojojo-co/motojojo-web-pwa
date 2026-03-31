import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { supabase } from "@/integrations/supabase/client";
import { FcGoogle } from "react-icons/fc";
import { User } from "lucide-react";
import MovingPartyBackground from "@/components/ui/MovingPartyBackground";

const SignInSignUp = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Get redirect param from URL
  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect");

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    if (authMode === 'signIn') {
      const { error } = await signIn(form.email, form.password);
      if (error) setFormError(error.message);
      else navigate(redirect || '/');
    } else {
      if (!form.full_name.trim()) {
        setFormError('Full name is required');
        setLoading(false);
        return;
      }
      const { error } = await signUp(form.email, form.password, form.full_name);
      if (error) setFormError(error.message);
      else navigate(redirect || '/');
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setFormError(null);
    // Build the redirectTo URL for Supabase OAuth
    let redirectTo = window.location.origin;
    if (redirect) {
      // Ensure redirect starts with a slash
      redirectTo += redirect.startsWith('/') ? redirect : `/${redirect}`;
    }
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: { redirectTo }
    });
    if (error) setFormError(error.message);
    setGoogleLoading(false);
  };

  const handleGuestLogin = () => {
    // For guest login, we'll redirect directly to the booking page
    // The booking page will handle guest users without authentication
    if (redirect) {
      navigate(redirect);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-raspberry relative overflow-y-auto">
      <MovingPartyBackground />
      <Navbar />
      <main className="flex-grow py-10 md:py-14 z-10">
        <div className="container-padding max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            <div className="rounded-3xl border border-sandstorm-200 bg-white/80 backdrop-blur-md p-8 flex flex-col justify-between shadow-soft">
              <div>
                <img src="/user1.png" alt="Motojojo" className="w-11/12 max-w-md h-auto mb-4" />
                <h1 className="text-3xl font-bold text-violet">Welcome to Motojojo</h1>
                <p className="mt-3 text-raspberry">
                  {authMode === 'signIn'
                    ? 'Sign in to discover and book unique experiences.'
                    : 'Create your Motojojo account and join the community!'}
                </p>
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3 rounded-2xl bg-white/90 p-4 border border-sandstorm-200">
                  <div className="h-10 w-10 rounded-xl bg-violet/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-violet" />
                  </div>
                  <div>
                    <p className="font-semibold text-violet">Find your people</p>
                    <p className="text-sm text-raspberry">Discover communities and experiences in your city.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-white/90 p-4 border border-sandstorm-200">
                  <div className="h-10 w-10 rounded-xl bg-raspberry/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-raspberry" />
                  </div>
                  <div>
                    <p className="font-semibold text-violet">Book with ease</p>
                    <p className="text-sm text-raspberry">Manage tickets, bookings, and updates in one place.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 rounded-3xl shadow-soft p-6 md:p-10 flex flex-col items-center border border-sandstorm-200 backdrop-blur-md">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2 text-violet drop-shadow text-center">
                {authMode === 'signIn' ? 'Sign In' : 'Create Account'}
              </h2>
              <p className="mb-4 md:mb-6 text-center text-raspberry font-medium text-base md:text-lg">
                {authMode === 'signIn' ? 'Welcome back! Let’s get you in.' : 'Join the community and start exploring.'}
              </p>
          
          {/* Google Authentication Button */}
          <Button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-2 border border-sandstorm-300 bg-white text-raspberry hover:bg-sandstorm-100 hover:text-violet font-semibold mb-4 transition-colors duration-150 text-base md:text-lg py-3"
            disabled={googleLoading}
          >
            <FcGoogle className="w-5 h-5" />
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </Button>

          {/* Guest Login Button */}
          <Button
            type="button"
            onClick={handleGuestLogin}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-2 border-violet bg-transparent text-violet hover:bg-violet hover:text-white font-semibold mb-4 transition-colors duration-150 text-base md:text-lg py-3"
          >
            <User className="w-5 h-5" />
            Continue as Guest
          </Button>

          {/* Role-specific Login Shortcuts */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/host/login")}
              className="w-full border-2 border-sandstorm-300 bg-white text-violet hover:bg-sandstorm-100 hover:text-violet font-semibold transition-colors duration-150 text-sm md:text-base py-2.5"
            >
              Host Login
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/community-lead/login")}
              className="w-full border-2 border-sandstorm-300 bg-white text-violet hover:bg-sandstorm-100 hover:text-violet font-semibold transition-colors duration-150 text-sm md:text-base py-2.5"
            >
              Community Lead Login
            </Button>
          </div>

          <div className="w-full flex items-center gap-2 mb-4">
            <div className="flex-1 h-px bg-sandstorm-200" />
            <span className="text-xs text-sandstorm-600">or</span>
            <div className="flex-1 h-px bg-sandstorm-200" />
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-4 w-full">
            <div>
              <label className="block text-sm font-semibold mb-1 text-violet" htmlFor="email">Email</label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoFocus
                className="border-raspberry focus:border-violet focus:ring-violet/30 text-base py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-violet" htmlFor="password">Password</label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                className="border-raspberry focus:border-violet focus:ring-violet/30 text-base py-3"
              />
            </div>
            {authMode === 'signUp' && (
              <div>
                <label className="block text-sm font-semibold mb-1 text-violet" htmlFor="full_name">Full Name</label>
                <Input
                  id="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  required
                  className="border-raspberry focus:border-violet focus:ring-violet/30 text-base py-3"
                />
              </div>
            )}
            {formError && <div className="text-red-600 text-sm font-semibold">{formError}</div>}
            <Button type="submit" className="w-full bg-raspberry hover:bg-raspberry/90 text-white font-bold py-3 rounded-xl shadow transition-colors duration-150 text-base md:text-lg" disabled={loading}>
              {loading ? (authMode === 'signIn' ? 'Signing In...' : 'Signing Up...') : (authMode === 'signIn' ? 'Sign In' : 'Sign Up')}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {authMode === 'signIn' ? (
              <>Don't have an account? <button className="text-violet underline font-semibold hover:text-raspberry transition-colors" onClick={() => { setAuthMode('signUp'); setFormError(null); }}>Sign Up</button></>
            ) : (
              <>Already have an account? <button className="text-violet underline font-semibold hover:text-raspberry transition-colors" onClick={() => { setAuthMode('signIn'); setFormError(null); }}>Sign In</button></>
            )}
          </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignInSignUp; 
