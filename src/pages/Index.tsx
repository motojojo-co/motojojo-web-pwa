import { useEffect, useState } from "react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import HeroSection from "@/components/home/HeroSection";
import CityStrip from "@/components/home/CityStrip";
import EventsSection from "@/components/home/EventsSection";
// import ArtistsSection from "@/components/home/ArtistsSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import PremiumPopup from "@/components/shared/PremiumPopup";
import EventTypesSection from "@/components/home/EventTypesSection";
import CityExperiencesSection from "@/components/home/CityExperiencesSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FaqSection from "@/components/home/FaqSection";
import MovingPartyBackground from "@/components/ui/MovingPartyBackground";
import { cities } from "@/data/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Index = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // City state lifted up
  const [selectedCity, setSelectedCity] = useState("Mumbai");
  const [showCityModal, setShowCityModal] = useState(false);

  // On mount, check localStorage for city
  useEffect(() => {
    const storedCity = localStorage.getItem("selectedCity");
    if (storedCity && cities.some(c => c.name === storedCity)) {
      setSelectedCity(storedCity);
      setShowCityModal(false);
    } else {
      const timer = setTimeout(() => {
        setShowCityModal(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // When city changes, store in localStorage
  useEffect(() => {
    if (selectedCity) {
      localStorage.setItem("selectedCity", selectedCity);
    }
  }, [selectedCity]);

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setShowCityModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-raspberry">
      <Navbar selectedCity={selectedCity} setSelectedCity={setSelectedCity} bgColor="#E91E63" />
      <main className="flex-grow pb-20 md:pb-0">
        <HeroSection />
        {/* <CityStrip selectedCity={selectedCity} setSelectedCity={setSelectedCity} /> */}
        <EventTypesSection />
        <CityExperiencesSection selectedCity={selectedCity} setSelectedCity={setSelectedCity} />
        <EventsSection />
        {/* <ArtistsSection /> */}
        <TestimonialsSection />
        <FaqSection />
      </main>
      <div className="bg-raspberry">
        <Footer />
      </div>
      {/* City Selection Modal */}
      <Dialog open={showCityModal}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Select Your City</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            {cities.map(city => (
              <Button
                key={city.id}
                onClick={() => handleCitySelect(city.name)}
                className="rounded-full px-6"
                variant={selectedCity === city.name ? "default" : "outline"}
              >
                {city.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
