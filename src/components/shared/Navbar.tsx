import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, User, Menu, X, ShoppingCart, Ticket, Home, Calendar, Heart, Settings, MessageSquare, History, LogOut, Lock, Bell, Sparkles, Zap, Video } from "lucide-react";
import { cities } from "@/data/mockData";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useCartStore } from "@/store/cart-store";

type NavbarProps = {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  bgColor?: string; // Optional background color override
  logoSrc?: string; // Optional logo override
};

const Navbar = ({ selectedCity, setSelectedCity, bgColor, logoSrc }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn, isAdmin, signIn, signUp, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const totalItems = useCartStore(state => state.getTotalItems());
  const [searchValue, setSearchValue] = useState("");



  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Remove the problematic event handler that was preventing navigation
  // The bottom navigation should work without interference from third-party scripts

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Handle navigation with authentication check
  const handleAuthenticatedNavigation = (path: string) => {
    if (!isSignedIn) {
      navigate("/auth");
    } else {
      navigate(path);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = searchValue.trim().toLowerCase();
    const cityMatch = cities.find(city => city.name.toLowerCase() === keyword);
    if (cityMatch) {
      navigate(`/events?city=${encodeURIComponent(cityMatch.name)}`);
    } else if (keyword) {
      navigate(`/events?search=${encodeURIComponent(searchValue)}`);
    }
    setSearchValue("");
  };

  return (
    <>

      {/* Top Header - Modern Glassmorphism Design */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 navbar-slide-in ${
          isScrolled 
            ? 'bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-2xl py-3 navbar-pulse-glow' 
            : 'bg-gradient-to-r from-raspberry/20 via-sandstorm/20 to-violet/20 backdrop-blur-md border-b border-white/10 py-4 navbar-floating'
        }`}
        style={bgColor ? { 
          backgroundColor: bgColor, 
          backdropFilter: 'blur(20px)',
          ...(isScrolled ? { 
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.1)' 
          } : {}), 
          paddingTop: isScrolled ? '0.75rem' : '1rem', 
          paddingBottom: isScrolled ? '0.75rem' : '1.5rem' 
        } : {}}
      >
        {/* Responsive container with max width and horizontal centering */}
        <div className="w-full max-w-screen-2xl mx-auto flex items-center justify-between px-2 md:px-6 lg:px-8">
          {/* Logo - Enhanced with animations and glow effects */}
          <Link to="/" className="flex items-center flex-shrink-0 m-0 p-0 min-w-0 group relative">
            <div className="relative">
              <img 
                src={logoSrc || "/motojojo.png"} 
                alt="Logo" 
                className="h-16 w-16 md:h-24 md:w-24 lg:h-28 lg:w-28 max-w-none m-0 p-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:drop-shadow-2xl" 
              />
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-raspberry/30 via-sandstorm/30 to-violet/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 scale-150"></div>
              {/* Sparkle effect */}
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-sandstorm opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse" />
            </div>
          </Link>

          {/* Desktop Nav Items - wrap and space items, allow shrinking */}
          <div className="hidden md:flex flex-wrap items-center gap-3 min-w-0 flex-1 justify-end">
            {/* Enhanced Search Bar with Glassmorphism */}
            <form className="relative w-64 min-w-0 group" onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4 transition-all duration-300 group-focus-within:text-sandstorm group-focus-within:scale-110" />
                <Input
                  placeholder="Search experiences, artists, venues..."
                  className="pl-12 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl focus-visible:ring-2 focus-visible:ring-sandstorm/50 focus-visible:border-sandstorm/50 hover:bg-white/15 hover:border-white/30 transition-all duration-300 min-w-0 truncate text-white placeholder:text-white/60 shadow-lg"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                />
                {/* Floating effect on focus */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-raspberry/20 via-sandstorm/20 to-violet/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
              </div>
            </form>

            {/* Enhanced City Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-2 min-w-0 truncate bg-gradient-to-r from-sandstorm to-raspberry hover:from-raspberry hover:to-violet text-black font-semibold px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20 navbar-button-hover">
                  <MapPin className="h-4 w-4 text-black" />
                  <span className="truncate max-w-[7rem] text-black">{selectedCity}</span>
                  <Zap className="h-3 w-3 text-black opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 max-w-xs bg-gradient-to-br from-raspberry to-sandstorm backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
                {cities.map((city) => (
                  <DropdownMenuItem 
                    key={city.id}
                    onClick={() => setSelectedCity(city.name)}
                    className="hover:bg-white/20 transition-all duration-200 rounded-xl mx-1 my-1 text-white"
                  >
                    <MapPin className="h-4 w-4 mr-2 text-white" />
                    <span className="truncate max-w-[8rem] text-white font-medium">{city.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Premium Button */}
                 {/*        <Button className="min-w-0 truncate text-mapcream bg-transparent hover:bg-transparent" onClick={() => navigate("/membership")}>Membership</Button> */}

            {/* Enhanced Experiences Navigation */}
            <Button variant="ghost" asChild className="min-w-0 truncate bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg">
              <Link to="/events" className="flex items-center text-white">
                <Calendar className="h-4 w-4 mr-2 text-white group-hover:text-sandstorm transition-colors duration-300" />
                <span className="truncate text-white">Experiences</span>
              </Link>
            </Button>

            <Button variant="ghost" asChild className="min-w-0 truncate bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg">
              <Link to="/previousevents" className="flex items-center text-white">
                <History className="h-4 w-4 mr-2 text-white group-hover:text-sandstorm transition-colors duration-300" />
                <span className="truncate text-white">Past Experiences</span>
              </Link>
            </Button>

            <Button variant="ghost" asChild className="min-w-0 truncate bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg">
              <Link to="/gallery" className="flex items-center text-white">
                <Video className="h-4 w-4 mr-2 text-white group-hover:text-sandstorm transition-colors duration-300" />
                <span className="truncate text-white">Gallery</span>
              </Link>
            </Button>

            {/* Enhanced Auth Buttons */}
            {!isSignedIn ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/auth')} 
                  className="min-w-0 truncate bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/auth')} 
                  className="min-w-0 truncate bg-gradient-to-r from-sandstorm to-raspberry hover:from-raspberry hover:to-violet text-black font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20 navbar-button-hover"
                >
                  Sign Up
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => handleAuthenticatedNavigation("/profile")}
                  className="flex items-center gap-2 min-w-0 truncate bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <User className="h-4 w-4 text-white" />
                  <span className="truncate text-white">Profile</span>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => handleAuthenticatedNavigation("/profile?tab=bookings")}
                  className="flex items-center gap-2 min-w-0 truncate bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg relative"
                >
                  <Ticket className="h-4 w-4 text-white" />
                  <span className="truncate text-white">My Bookings</span>
                  {totalItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-raspberry to-violet text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleSignOut} 
                  className="min-w-0 truncate bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-red-400 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <LogOut className="h-4 w-4 mr-2 text-white" />
                  <span className="truncate text-white">Sign Out</span>
                </Button>
              </>
            )}
          </div>
          
          {/* Enhanced Mobile Search and Menu */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Search Button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Mobile Menu Trigger */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Enhanced Mobile Search and Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-xl border-t border-white/20 shadow-2xl animate-slide-down">
            <div className="max-h-[80vh] overflow-y-auto p-6">
              <div className="flex flex-col space-y-4">
                {/* Enhanced Mobile Search Bar */}
                <form className="relative group" onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4 transition-all duration-300 group-focus-within:text-sandstorm group-focus-within:scale-110" />
                    <Input
                      placeholder="Search experiences, artists, venues..."
                      className="pl-12 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl focus-visible:ring-2 focus-visible:ring-sandstorm/50 focus-visible:border-sandstorm/50 hover:bg-white/15 hover:border-white/30 transition-all duration-300 text-white placeholder:text-white/60 shadow-lg"
                      value={searchValue}
                      onChange={e => setSearchValue(e.target.value)}
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-raspberry/20 via-sandstorm/20 to-violet/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
                  </div>
                </form>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="flex items-center justify-between w-full bg-gradient-to-r from-sandstorm to-raspberry hover:from-raspberry hover:to-violet text-black font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-black" />
                        {selectedCity}
                      </div>
                      <Zap className="h-3 w-3 text-black opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-full bg-gradient-to-br from-raspberry to-sandstorm backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
                    {cities.map((city) => (
                      <DropdownMenuItem 
                        key={city.id}
                        onClick={() => setSelectedCity(city.name)}
                        className="hover:bg-white/20 transition-all duration-200 rounded-xl mx-1 my-1 text-white"
                      >
                        <MapPin className="h-4 w-4 mr-2 text-white" />
                        <span className="text-white font-medium">{city.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Navigation Menu - No Duplicates */}
                <div className="space-y-3">
                  <Button variant="ghost" className="w-full justify-start bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg" onClick={() => navigate("/")}>
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>

                  <Button variant="ghost" className="w-full justify-start bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg" onClick={() => navigate("/events")}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Experiences
                  </Button>

                  <Button variant="ghost" className="w-full justify-start bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg" onClick={() => navigate("/previousevents")}>
                    <History className="h-4 w-4 mr-2" />
                    Past Experiences
                  </Button>

                  <Button variant="ghost" className="w-full justify-start bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg" onClick={() => navigate("/gallery")}>
                    <Video className="h-4 w-4 mr-2" />
                    Gallery
                  </Button>

                  <Button variant="ghost" className="w-full justify-start bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg" onClick={() => navigate("/inviteonly?tag=inviteonly")}>
                    <Lock className="h-4 w-4 mr-2" />
                    Invite Only
                  </Button>

                  <Button className="w-full justify-start bg-gradient-to-r from-sandstorm to-raspberry hover:from-raspberry hover:to-violet text-black font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20" onClick={() => navigate("/membership")}>
                    <Heart className="h-4 w-4 mr-2" />
                    Membership
                  </Button>

                  {isSignedIn && (
                    <>
                      <Button variant="ghost" className="w-full justify-start bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg relative" onClick={() => handleAuthenticatedNavigation("/profile?tab=bookings")}>
                        <Ticket className="h-4 w-4 mr-2" />
                        My Bookings
                        {totalItems > 0 && (
                          <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-raspberry to-violet text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                            {totalItems}
                          </Badge>
                        )}
                      </Button>

                      <Button variant="ghost" className="w-full justify-start bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg" onClick={() => handleAuthenticatedNavigation("/profile")}>
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Button>
                    </>
                  )}
                </div>

                {/* Authentication Section */}
                <div className="border-t border-white/20 pt-4 mt-4">
                  {!isSignedIn ? (
                    <div className="space-y-3">
                      <Button variant="outline" onClick={() => navigate('/auth')} className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg">
                        Sign In
                      </Button>
                      <Button onClick={() => navigate('/auth')} className="w-full bg-gradient-to-r from-sandstorm to-raspberry hover:from-raspberry hover:to-violet text-black font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20">
                        Sign Up
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" className="w-full justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-red-400 transition-all duration-300 hover:scale-105 shadow-lg" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>


    </>
  );
};

export default Navbar;
