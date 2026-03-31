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
import { Lock, User, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FcGoogle } from "react-icons/fc";
import { Skeleton } from "@/components/ui/skeleton";

const CommunityLeadLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, isSignedIn, isCommunityLead, isLoaded } = useAuth();

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    full_name: ""
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);

  // Redirect if already authenticated as community lead
  useEffect(() => {
    if (isLoaded && isSignedIn && isCommunityLead) {
      navigate("/communitylead/activity");
    }
  }, [isLoaded, isSignedIn, isCommunityLead, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password || !credentials.full_name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    setSignUpLoading(true);
    try {
      // Sign up with community lead role
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: { 
            full_name: credentials.full_name,
            role: 'community_lead'
          },
        },
      });

      if (error) throw error;

      // Update user role in database
      if (data.user) {
        await supabase
          .from('users')
          .update({ 
            role: 'community_lead',
            full_name: credentials.full_name,
            community_lead_username: credentials.email.split('@')[0], // Use email prefix as username
            community_lead_city: '', // Will be filled later
            community_lead_bio: '',
            community_lead_is_active: true,
            community_lead_is_verified: false
          })
          .eq('id', data.user.id);
      }

      toast({
        title: "Account Created Successfully",
        description: "Please check your email to verify your account.",
      });

      // Reset form
      setCredentials({ email: "", password: "", full_name: "" });
      setIsSignUp(false);
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        title: "Sign Up Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(credentials.email, credentials.password);
    setLoading(false);
    if (error) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials.",
        variant: "destructive"
      });
      return;
    }
    // Wait for isCommunityLead to update
    setTimeout(() => {
      if (isCommunityLead) {
        toast({
          title: "Login Successful",
          description: "Welcome to the Motojojo community lead dashboard.",
        });
        navigate("/communitylead/activity");
      } else {
        toast({
          title: "Access Denied",
          description: "You are not a community lead. Please sign up as a community lead first.",
          variant: "destructive"
        });
      }
    }, 500);
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/community-lead/auth-callback`
      }
    });
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
                    src="/media-logos/communitylead.png"
                    alt="Community Lead"
                    className="w-11/12 max-w-md h-auto mb-4"
                  />
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet shadow-sm">
                    <Mail className="h-4 w-4" />
                    Community Lead
                  </div>
                  <h1 className="mt-4 text-3xl font-bold text-violet">Lead your city’s community</h1>
                  <p className="mt-3 text-raspberry">
                    Create experiences, grow your local community, and track your impact.
                  </p>
                </div>
                <div className="mt-8 space-y-4">
                  <div className="flex items-start gap-3 rounded-2xl bg-white/90 p-4 border border-sandstorm-200">
                    <div className="h-10 w-10 rounded-xl bg-violet/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-violet" />
                    </div>
                    <div>
                      <p className="font-semibold text-violet">Create events</p>
                      <p className="text-sm text-raspberry">Publish gatherings and manage your audience.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-white/90 p-4 border border-sandstorm-200">
                    <div className="h-10 w-10 rounded-xl bg-raspberry/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-raspberry" />
                    </div>
                    <div>
                      <p className="font-semibold text-violet">Track revenue</p>
                      <p className="text-sm text-raspberry">See bookings, commissions, and performance.</p>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="border border-sandstorm-200 shadow-soft rounded-3xl bg-white/85 backdrop-blur-md">
                <CardHeader className="text-left">
                  <CardTitle className="text-2xl text-violet">
                    {isSignUp ? "Join as Community Lead" : "Community Lead Login"}
                  </CardTitle>
                  <CardDescription className="text-raspberry">
                    {isSignUp 
                      ? "Sign up to become a community lead and start creating events"
                      : "Sign in to access the Motojojo community lead dashboard"
                    }
                  </CardDescription>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="w-full border-2 border-sandstorm-300 bg-white text-violet hover:bg-sandstorm-100 hover:text-violet font-semibold transition-colors duration-150"
                    >
                      {isSignUp ? "Already have an account? Sign In" : "New to community leads? Sign Up"}
                    </Button>
                  </div>
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
                  <form onSubmit={isSignUp ? handleSignUp : handleSubmit} className="space-y-5">
                    {isSignUp && (
                      <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-violet">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-raspberry" />
                          <Input 
                            id="full_name" 
                            name="full_name"
                            type="text"
                            placeholder="Enter your full name"
                            className="pl-10 border-raspberry focus:border-violet focus:ring-violet/30 text-base py-3 text-black"
                            value={credentials.full_name}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-violet">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-raspberry" />
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
                    <Button type="submit" className="w-full bg-raspberry hover:bg-raspberry/90 text-white font-bold py-3 rounded-xl shadow transition-colors duration-150" disabled={loading || signUpLoading}>
                      {isSignUp 
                        ? (signUpLoading ? "Creating Account..." : "Sign Up as Community Lead")
                        : (loading ? "Signing In..." : "Sign In")
                      }
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-sm text-raspberry text-center">
                    {isSignUp 
                      ? "Anyone can become a community lead and start creating events."
                      : "Sign in to access your community lead dashboard."
                    }
                  </p>
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

export default CommunityLeadLogin;
