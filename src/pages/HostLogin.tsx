import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FcGoogle } from "react-icons/fc";
import { Skeleton } from "@/components/ui/skeleton";

const HostLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, isSignedIn, isHost, isLoaded } = useAuth();

  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect if already authenticated as host
  useEffect(() => {
    if (isLoaded && isSignedIn && isHost) {
      navigate("/host/dashboard");
    }
  }, [isLoaded, isSignedIn, isHost, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(credentials.email, credentials.password);
    setLoading(false);
    if (error) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or not invited as host.",
        variant: "destructive"
      });
      return;
    }
    // Wait for isHost to update
    setTimeout(() => {
      if (isHost) {
        toast({
          title: "Login Successful",
          description: "Welcome to the Motojojo host dashboard.",
        });
        navigate("/host/dashboard");
      } else {
        toast({
          title: "Access Denied",
          description: "You are not a host. Please use a host invite.",
          variant: "destructive"
        });
      }
    }, 500);
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      toast({
        title: "Google Auth Failed",
        description: error.message,
        variant: "destructive"
      });
    }
    setGoogleLoading(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Skeleton className="h-8 w-3/4 mb-6" />
          <Skeleton className="h-32 w-full mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-raspberry relative overflow-y-auto">
      <Navbar />
      <main className="flex-grow py-12 md:py-16 pb-20 md:pb-16 z-10">
        <div className="container-padding max-w-5xl mx-auto">
          <FadeIn>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              <div className="rounded-3xl border border-sandstorm-200 bg-white/80 backdrop-blur-md p-8 flex flex-col justify-between shadow-soft">
                <div>
                  <img
                    src="/media-logos/host.png"
                    alt="Host"
                    className="w-11/12 max-w-md h-auto mb-4"
                  />
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet shadow-sm">
                    <Calendar className="h-4 w-4" />
                    Host Console
                  </div>
                  <h1 className="mt-4 text-3xl font-bold text-violet">Welcome back, Host</h1>
                  <p className="mt-3 text-raspberry">
                    Manage your experiences, track attendance, and keep everything running smoothly.
                  </p>
                </div>
                <div className="mt-8 space-y-4">
                  <div className="flex items-start gap-3 rounded-2xl bg-white/90 p-4 border border-sandstorm-200">
                    <div className="h-10 w-10 rounded-xl bg-violet/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-violet" />
                    </div>
                    <div>
                      <p className="font-semibold text-violet">Run your events</p>
                      <p className="text-sm text-raspberry">See upcoming schedules and quick stats at a glance.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-white/90 p-4 border border-sandstorm-200">
                    <div className="h-10 w-10 rounded-xl bg-raspberry/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-raspberry" />
                    </div>
                    <div>
                      <p className="font-semibold text-violet">Track attendance</p>
                      <p className="text-sm text-raspberry">Mark attendance quickly and keep records clean.</p>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="border border-sandstorm-200 shadow-soft rounded-3xl bg-white/85 backdrop-blur-md">
                <CardHeader className="text-left">
                  <CardTitle className="text-2xl text-violet">Host Login</CardTitle>
                  <CardDescription className="text-raspberry">
                    Sign in to access the Motojojo host dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    onClick={handleGoogleAuth}
                    className="w-full flex items-center justify-center gap-2 border border-sandstorm-300 bg-white text-raspberry hover:bg-sandstorm-100 hover:text-violet mb-6"
                    disabled={googleLoading}
                  >
                    <FcGoogle className="w-5 h-5" />
                    {googleLoading ? 'Redirecting...' : 'Continue with Google'}
                  </Button>
                  <div className="w-full flex items-center gap-2 mb-4">
                    <div className="flex-1 h-px bg-sandstorm-200" />
                    <span className="text-xs text-sandstorm-600">or</span>
                    <div className="flex-1 h-px bg-sandstorm-200" />
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-violet">Email</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-raspberry" />
                        <Input 
                          id="email" 
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10 border-raspberry focus:border-violet focus:ring-violet/30 text-base py-3 text-black"
                          value={credentials.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-violet">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-raspberry" />
                        <Input 
                          id="password" 
                          name="password"
                          type="password" 
                          placeholder="Enter your password"
                          className="pl-10 border-raspberry focus:border-violet focus:ring-violet/30 text-base py-3 text-black"
                          value={credentials.password}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-raspberry hover:bg-raspberry/90 text-white font-bold py-3 rounded-xl shadow transition-colors duration-150" disabled={loading}>
                      {loading ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <p className="text-sm text-raspberry text-center">
                    Only invited hosts can sign in here.
                  </p>
                  <div className="flex justify-center">
                    <Link to="/">
                      <Button variant="outline" size="sm">
                        Back to Home
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </FadeIn>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HostLogin; 
