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
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-16 pb-20 md:pb-16">
        <div className="container-padding max-w-md w-full">
          <FadeIn>
            <Card className="border-none shadow-soft">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  {isSignUp ? "Join as Community Lead" : "Community Lead Login"}
                </CardTitle>
                <CardDescription>
                  {isSignUp 
                    ? "Sign up to become a community lead and start creating events"
                    : "Sign in to access the Motojojo community lead dashboard"
                  }
                </CardDescription>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full"
                  >
                    {isSignUp ? "Already have an account? Sign In" : "New to community leads? Sign Up"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white text-black hover:bg-gray-50 mb-6"
                  disabled={googleLoading}
                >
                  <FcGoogle className="w-5 h-5" />
                  {googleLoading ? 'Redirecting...' : 'Continue with Google'}
                </Button>
                <div className="w-full flex items-center gap-2 mb-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-black">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <form onSubmit={isSignUp ? handleSignUp : handleSubmit} className="space-y-6">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-black">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-black" />
                        <Input 
                          id="full_name" 
                          name="full_name"
                          type="text"
                          placeholder="Enter your full name"
                          className="pl-10 text-black"
                          value={credentials.full_name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-black">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-black" />
                      <Input 
                        id="email" 
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10 text-black"
                        value={credentials.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-black">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-black" />
                      <Input 
                        id="password" 
                        name="password"
                        type="password" 
                        placeholder="Enter your password"
                        className="pl-10 text-black"
                        value={credentials.password}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full text-black" disabled={loading || signUpLoading}>
                    {isSignUp 
                      ? (signUpLoading ? "Creating Account..." : "Sign Up as Community Lead")
                      : (loading ? "Signing In..." : "Sign In")
                    }
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-black">
                  {isSignUp 
                    ? "Anyone can become a community lead and start creating events."
                    : "Sign in to access your community lead dashboard."
                  }
                </p>
              </CardFooter>
            </Card>
          </FadeIn>
        </div>
      </main>
      <Footer />
      <div className="mt-8 flex flex-col items-center">
        <Link to="/response">
          <Button className="bg-violet text-black font-bold px-6 py-3 rounded-lg shadow-md hover:bg-violet-700 transition-colors">
            Responses
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CommunityLeadLogin;
