import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Try to autoplay the video when component mounts
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const playPromise = video.play();
      
      // Handle autoplay restrictions
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Autoplay prevented:", error);
          // Show play button or handle the error
        });
      }
    }
  }, []);

  return (
    <section className="w-full h-screen min-h-[600px] relative overflow-hidden">
      {/* Video Container with Aspect Ratio */}
      <div className="absolute inset-0 w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2"
          style={{
            minWidth: '100%',
            minHeight: '100%',
            width: 'auto',
            height: 'auto',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            objectFit: 'cover'
          }}
          poster="/placeholder-video.jpg"
        >
          <source src="/homeanimation.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/30 to-background/70" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          <FadeIn delay={200}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 text-white leading-tight">
              Thoughtfully curated experiences in your city.
            </h1>
          </FadeIn>
          
          <FadeIn delay={300}>
            <p className="text-xl sm:text-2xl text-yellow mb-8 max-w-2xl leading-relaxed">
              Join an ever-growing community where we help you remove your everyday masks and be yourself.
            </p>
          </FadeIn>
          
          <FadeIn delay={400}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-violet hover:bg-violet-700 transition-colors text-lg px-8 py-6">
                <Link to="/membership" className="flex items-center">
                  Become a Member
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
