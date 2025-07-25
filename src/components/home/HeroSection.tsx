import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getBanners } from "@/services/bannerService";
import { Skeleton } from "@/components/ui/skeleton";

const HeroSection = () => {
  const [activeBanner, setActiveBanner] = useState(0);
  
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: getBanners
  });
  
  useEffect(() => {
    if (banners.length === 0) return;
    
    // Auto-scroll through banners
    const interval = setInterval(() => {
      setActiveBanner((current) => (current + 1) % banners.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [banners.length]);
  
  // Loading state
  if (isLoading) {
    return (
      <section className="w-full h-[80vh] md:h-[90vh] relative overflow-hidden mt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/30 to-background/60" />
        <Skeleton className="w-full h-full" />
        <div className="container-padding relative z-10 h-full flex flex-col justify-center">
          <Skeleton className="h-16 w-96 mb-4" />
          <Skeleton className="h-8 w-80 mb-8" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
      </section>
    );
  }
  
  // No banners state
  if (banners.length === 0) {
    return (
      <section className="w-full h-[80vh] md:h-[90vh] relative overflow-hidden mt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/30 to-background/60" />
        <div className="container-padding relative z-10 h-full flex flex-col justify-center">
          <FadeIn delay={200}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 max-w-3xl text-white">
              <span className="text-white">Thoughtfully curated experiences in your city.</span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={300}>
            <p className="text-xl md:text-2xl text-yellow mb-8 max-w-2xl">
              Join an ever-growing community where we help you remove your everyday masks and be yourself.
            </p>
          </FadeIn>
          
          <FadeIn delay={400}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-violet hover:bg-violet-700 transition-colors">
                <Link to="/membership" className="flex items-center">
                  Become a Member
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    );
  }
  
  return (
    <section className="w-full h-[80vh] md:h-[90vh] relative overflow-hidden mt-16">
      {/* Banner Images with Fade Transition */}
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === activeBanner ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/30 to-background/60" />
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      
      {/* Content */}
      <div className="container-padding relative z-10 h-full flex flex-col justify-center">
                  <FadeIn delay={200}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 max-w-3xl text-white">
              <span className="text-white">Thoughtfully curated experiences in your city.</span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={300}>
            <p className="text-xl md:text-2xl text-yellow mb-8 max-w-2xl">
              Join an ever-growing community where we help you remove your everyday masks and be yourself.
            </p>
          </FadeIn>
        
        <FadeIn delay={400}>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-violet hover:bg-violet-700 transition-colors">
              <Link to="/membership" className="flex items-center">
               Become a Member 
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
 
          </div>
        </FadeIn>
        
        {/* Banner Navigation Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveBanner(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === activeBanner
                    ? "bg-violet w-6"
                    : "bg-muted-foreground/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
