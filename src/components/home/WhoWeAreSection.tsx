import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Users, Calendar, Star, MapPin, UserCheck, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const WhoWeAreSection = () => {
  const [activeTab, setActiveTab] = useState<'community' | 'host'>('community');
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-gradient-to-b from-raspberry/5 to-yellow-100">
      <div className="container-padding max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Who We Are</h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            We're building a community where creators and enthusiasts come together to create amazing experiences.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2 space-y-6">
            <div className="flex space-x-4 mb-6">
              <Button
                variant={activeTab === 'community' ? 'default' : 'outline'}
                onClick={() => setActiveTab('community')}
                className="flex-1"
              >
                <Users className="mr-2 h-4 w-4" /> Community Leads
              </Button>
              <Button
                variant={activeTab === 'host' ? 'default' : 'outline'}
                onClick={() => setActiveTab('host')}
                className="flex-1"
              >
                <UserCog className="mr-2 h-4 w-4" /> Hosts
              </Button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'community' ? (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-semibold">Become a Community Lead</h3>
                    <p className="text-muted-foreground">
                      Community Leads are the heart of our platform. They help build and nurture local communities around shared interests.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-raspberry mt-0.5 flex-shrink-0" />
                        <span>Build and manage your own community</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-raspberry mt-0.5 flex-shrink-0" />
                        <span>Organize and promote events</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Star className="h-5 w-5 text-raspberry mt-0.5 flex-shrink-0" />
                        <span>Earn rewards and recognition</span>
                      </li>
                    </ul>
                   <Button className="mt-4" onClick={() => navigate('/learnmore')}>
      Learn More
    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-semibold">Become a Host</h3>
                    <p className="text-muted-foreground">
                      Hosts create and manage amazing events, from small workshops to large gatherings.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-raspberry mt-0.5 flex-shrink-0" />
                        <span>List your venue or space</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <UserCheck className="h-5 w-5 text-raspberry mt-0.5 flex-shrink-0" />
                        <span>Manage attendees and bookings</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-raspberry mt-0.5 flex-shrink-0" />
                        <span>Create unique experiences</span>
                      </li>
                    </ul>
                    <Button className="mt-4" onClick={() => navigate('/learnmore')}>
                      Learn More
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="md:w-1/2 bg-raspberry rounded-xl overflow-hidden">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full flex items-center justify-center p-8"
            >
              {activeTab === 'community' ? (
                <div className="text-center text-white">
                  <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
                    <Users className="h-16 w-16 text-white" />
                  </div>
                  <h4 className="text-xl font-medium mb-2">Community Leads</h4>
                  <p>
                    Build and nurture communities around shared passions and interests.
                  </p>
                </div>
              ) : (
                <div className="text-center text-white">
                  <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
                    <UserCog className="h-16 w-16 text-white" />
                  </div>
                  <h4 className="text-xl font-medium mb-2">Event Hosts</h4>
                  <p>
                    Create and manage amazing events that people love.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhoWeAreSection;
