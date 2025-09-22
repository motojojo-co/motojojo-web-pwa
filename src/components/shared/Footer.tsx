
import { Link } from "react-router-dom";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  ArrowUp,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-raspberry text-white">
      {/* Large MOTOJOJO Text */}
      <div className="pt-16 pb-8">
        <div className="container-padding">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-raspberry-700 leading-none mb-8">
            MOTOJOJO
          </h1>
        </div>
      </div>

      {/* Footer Content */}
      <div className="bg-raspberry pb-8">
        <div className="container-padding">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* General Information */}
            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                GENERAL INFORMATION
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/contact" className="text-raspberry-100 hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-raspberry-100 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-raspberry-100 hover:text-white transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <a href="/" className="text-raspberry-100 hover:text-white transition-colors">
                    Website
                  </a>
                </li>
                <li>
                  <Link to="/about" className="text-raspberry-100 hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Corporate Information */}
            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                CORPORATE INFORMATION
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="/" className="text-raspberry-100 hover:text-white transition-colors">
                    Corporate Website
                  </a>
                </li>
                <li>
                  <Link to="/careers" className="text-raspberry-100 hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <a href="/" className="text-raspberry-100 hover:text-white transition-colors">
                    Marketing Code
                  </a>
                </li>
              </ul>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                ADDITIONAL INFORMATION
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/help" className="text-raspberry-100 hover:text-white transition-colors">
                    Help & Support
                  </Link>
                </li>
                <li>
                  <Link to="/events" className="text-raspberry-100 hover:text-white transition-colors">
                    Events
                  </Link>
                </li>
                <li>
                  <Link to="/membership" className="text-raspberry-100 hover:text-white transition-colors">
                    Membership
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Right side with Global Website and Social */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-raspberry-100" />
                <a href="/" className="text-sm text-raspberry-100 hover:text-white transition-colors">
                  Global Website
                </a>
              </div>
              <a href="/" className="text-sm text-raspberry-100 hover:text-white transition-colors">
                Cookie Settings
              </a>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a href="https://facebook.com" className="text-raspberry-100 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" className="text-raspberry-100 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" className="text-raspberry-100 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://youtube.com" className="text-raspberry-100 hover:text-white transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full border-raspberry-300 text-raspberry-100 hover:text-white hover:border-white"
                onClick={scrollToTop}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-4 border-t border-raspberry-300">
            <p className="text-xs text-raspberry-200 text-center">
              © 2025 Motojojo. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
