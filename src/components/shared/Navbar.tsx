import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, User, Menu, X, Ticket, Home, Calendar, Heart, History, LogOut, Lock, Sparkles, Zap, Video, ChevronDown, LayoutGrid } from "lucide-react";
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
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const { isSignedIn, signOut } = useAuth();
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
    setIsMegaOpen(false);
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

  const megaSections = [
    {
      title: "Explore",
      items: [
        { label: "Experiences", description: "Discover upcoming experiences", path: "/events", icon: Calendar },
        { label: "Past Experiences", description: "See highlights from earlier events", path: "/previousevents", icon: History },
        { label: "Gallery", description: "Stories, videos, and memories", path: "/gallery", icon: Video },
      ],
    },
    {
      title: "Community",
      items: [
        { label: "Invite Only", description: "Members-only gatherings", path: "/inviteonly?tag=inviteonly", icon: Lock },
        { label: "Premium", description: "Upgrade for exclusive perks", path: "/pricing", icon: Heart },
        { label: "Home", description: "Back to main page", path: "/", icon: Home },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Profile", description: "Manage your profile", path: "/profile", icon: User, auth: true },
        { label: "My Bookings", description: "Tickets and reservations", path: "/profile?tab=bookings", icon: Ticket, auth: true },
      ],
    },
  ];

  return (
    <>

      {/* Top Header - Modern Glassmorphism Design */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 navbar-slide-in relative ${
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

          {/* Desktop Nav Items - Mega Menu Style */}
          <div className="hidden md:flex items-center gap-4 min-w-0 flex-1 justify-end">
            {/* Enhanced Search Bar with Glassmorphism */}
            <form className="relative w-72 min-w-0 group" onSubmit={handleSearch}>
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

            {!isSignedIn && (
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
                className="min-w-0 truncate bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Sign In
              </Button>
            )}

            {/* Mega Menu Trigger */}
            <div
              className="relative"
              onMouseEnter={() => setIsMegaOpen(true)}
              onMouseLeave={() => setIsMegaOpen(false)}
            >
              <Button
                variant="ghost"
                className="flex items-center gap-2 min-w-0 truncate bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg"
                onClick={() => setIsMegaOpen((prev) => !prev)}
              >
                <LayoutGrid className="h-4 w-4 text-white" />
                <span className="truncate text-white">Menu</span>
                <ChevronDown className={`h-4 w-4 text-white transition-transform duration-300 ${isMegaOpen ? "rotate-180" : ""}`} />
              </Button>

              {isMegaOpen && (
                <div className="absolute right-0 top-[110%] w-[760px] max-w-[90vw] rounded-3xl border border-white/20 bg-gradient-to-br from-raspberry/95 via-violet/95 to-sandstorm/95 backdrop-blur-2xl shadow-2xl p-6">
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-8 grid grid-cols-3 gap-5">
                      {megaSections.map((section) => (
                        <div key={section.title} className="space-y-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-white/70">
                            {section.title}
                          </div>
                          <div className="space-y-2">
                            {section.items.map((item) => {
                              const Icon = item.icon;
                              const isLocked = item.auth && !isSignedIn;
                              return (
                                <button
                                  key={item.label}
                                  type="button"
                                  onClick={() =>
                                    item.auth
                                      ? handleAuthenticatedNavigation(item.path)
                                      : navigate(item.path)
                                  }
                                  className="w-full text-left rounded-2xl border border-white/10 bg-white/10 hover:bg-white/20 transition-all duration-300 px-3 py-2.5 group"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                                      <Icon className="h-4 w-4 text-white" />
                                    </span>
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-white truncate">
                                        {item.label}
                                      </div>
                                      <div className="text-xs text-white/70 truncate">
                                        {isLocked ? "Sign in required" : item.description}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="col-span-4 space-y-4">
                      <div className="rounded-2xl p-4 bg-gradient-to-br from-sandstorm/90 to-raspberry/90 text-black shadow-xl">
                        <div className="flex items-center gap-2 text-black/80 text-xs uppercase tracking-[0.2em]">
                          <Sparkles className="h-4 w-4" />
                          Featured
                        </div>
                        <div className="mt-3 text-lg font-semibold">Premium Pass</div>
                        <div className="mt-1 text-sm text-black/80">
                          Priority access, curated drops, member-only pricing.
                        </div>
                        <Button
                          className="mt-4 w-full bg-black/90 text-white hover:bg-black transition-all duration-300"
                          onClick={() => navigate("/pricing")}
                        >
                          Upgrade Now
                        </Button>
                      </div>

                      <div className="rounded-2xl p-4 bg-white/10 border border-white/20">
                        {!isSignedIn ? (
                          <div className="space-y-3">
                            <div className="text-sm text-white/80">Ready to join the crew?</div>
                            <Button
                              variant="outline"
                              onClick={() => navigate("/auth")}
                              className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white hover:text-sandstorm transition-all duration-300"
                            >
                              Sign In
                            </Button>
                            <Button
                              onClick={() => navigate("/auth")}
                              className="w-full bg-gradient-to-r from-sandstorm to-raspberry hover:from-raspberry hover:to-violet text-black font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
                            >
                              Create Account
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="text-sm text-white/80">Welcome back.</div>
                            <Button
                              variant="ghost"
                              onClick={() => handleAuthenticatedNavigation("/profile")}
                              className="w-full justify-start bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300"
                            >
                              <User className="h-4 w-4 mr-2" />
                              Profile
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => handleAuthenticatedNavigation("/profile?tab=bookings")}
                              className="w-full justify-start bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300 relative"
                            >
                              <Ticket className="h-4 w-4 mr-2" />
                              My Bookings
                              {totalItems > 0 && (
                                <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-raspberry to-violet text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                                  {totalItems}
                                </Badge>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={handleSignOut}
                              className="w-full justify-start bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-red-400 transition-all duration-300"
                            >
                              <LogOut className="h-4 w-4 mr-2" />
                              Sign Out
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Enhanced Mobile Search and Menu */}
          <div className="md:hidden flex items-center space-x-2">
            {!isSignedIn && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/auth")}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white hover:text-sandstorm transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <User className="h-5 w-5" />
              </Button>
            )}
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

        {/* Enhanced Mobile Mega Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-xl border-t border-white/20 shadow-2xl animate-slide-down">
            <div className="max-h-[85vh] overflow-y-auto p-6">
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

                {/* Mobile Mega Menu Sections */}
                <div className="space-y-6">
                  {megaSections.map((section) => (
                    <div key={section.title} className="space-y-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/70">
                        {section.title}
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          const isLocked = item.auth && !isSignedIn;
                          return (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() =>
                                item.auth
                                  ? handleAuthenticatedNavigation(item.path)
                                  : navigate(item.path)
                              }
                              className="w-full text-left rounded-2xl border border-white/10 bg-white/10 hover:bg-white/20 transition-all duration-300 px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <span className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                  <Icon className="h-4 w-4 text-white" />
                                </span>
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-white truncate">
                                    {item.label}
                                  </div>
                                  <div className="text-xs text-white/70 truncate">
                                    {isLocked ? "Sign in required" : item.description}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
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
