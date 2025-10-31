import { motion } from "framer-motion";
import { Users, UserCog, CheckCircle, ArrowRight, Star, Calendar, Users2, BarChart2, DollarSign, Settings, MessageSquare, MapPin, Shield, Zap, Award, TrendingUp, Clock, Heart, Share2, Bell, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LearnMore = () => {
  const [activeTab, setActiveTab] = useState<'community' | 'host'>('community');
  const navigate = useNavigate();

  const communityFeatures = [
    { icon: <Users2 className="h-6 w-6" />, title: "Build Your Community", description: "Create and grow your own community around shared interests and passions." },
    { icon: <Calendar className="h-6 w-6" />, title: "Organize Events", description: "Plan and host events, meetups, and gatherings for your community members." },
    { icon: <BarChart2 className="h-6 w-6" />, title: "Track Growth", description: "Monitor your community's growth and engagement with detailed analytics." },
    { icon: <DollarSign className="h-6 w-6" />, title: "Earn Revenue", description: "Generate income through ticket sales, memberships, and sponsorships." },
    { icon: <Settings className="h-6 w-6" />, title: "Manage Members", description: "Easily manage your community members and their access levels." },
    { icon: <MessageSquare className="h-6 w-6" />, title: "Engage Members", description: "Foster engagement through discussions, polls, and direct messaging." },
  ];

  const hostFeatures = [
    { icon: <MapPin className="h-6 w-6" />, title: "List Your Space", description: "Showcase your venue or space to potential event organizers." },
    { icon: <Shield className="h-6 w-6" />, title: "Safe & Secure", description: "Verified bookings and secure payments for peace of mind." },
    { icon: <Zap className="h-6 w-6" />, title: "Quick Setup", description: "Get your space listed and ready for bookings in minutes." },
    { icon: <DollarSign className="h-6 w-6" />, title: "Maximize Earnings", description: "Set your own pricing and availability to maximize your revenue." },
    { icon: <Award className="h-6 w-6" />, title: "Build Reputation", description: "Earn reviews and build your reputation as a trusted host." },
    { icon: <TrendingUp className="h-6 w-6" />, title: "Grow Your Business", description: "Reach new customers and grow your business through our platform." },
  ];

  const communityBenefits = [
    { icon: <Clock className="h-5 w-5" />, text: "Flexible scheduling for your events" },
    { icon: <Heart className="h-5 w-5" />, text: "Passive income opportunities" },
    { icon: <Share2 className="h-5 w-5" />, text: "Marketing and promotion support" },
    { icon: <Bell className="h-5 w-5" />, text: "Real-time notifications" },
    { icon: <HelpCircle className="h-5 w-5" />, text: "24/7 dedicated support" },
  ];

  const hostBenefits = [
    { icon: <Clock className="h-5 w-5" />, text: "Set your own availability" },
    { icon: <DollarSign className="h-5 w-5" />, text: "Competitive pricing options" },
    { icon: <Shield className="h-5 w-5" />, text: "Secure payment processing" },
    { icon: <BarChart2 className="h-5 w-5" />, text: "Performance analytics" },
    { icon: <HelpCircle className="h-5 w-5" />, text: "Dedicated account manager" },
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-raspberry">
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-yellow-400 text-black rounded-2xl max-w-6xl mx-auto my-8 shadow-lg">
        <div className="container-padding max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Grow With Us</h1>
            <p className="text-xl mb-8 opacity-90">
              Whether you want to build a community or host events, we provide everything you need to succeed.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => setActiveTab('community')}
                variant={activeTab === 'community' ? 'secondary' : 'outline'}
                className="rounded-full px-6 py-6 text-lg font-medium transition-all duration-300"
              >
                <Users className="mr-2 h-5 w-5" />
                Community Leads
              </Button>
              <Button 
                onClick={() => setActiveTab('host')}
                variant={activeTab === 'host' ? 'secondary' : 'outline'}
                className="rounded-full px-6 py-6 text-lg font-medium transition-all duration-300"
              >
                <UserCog className="mr-2 h-5 w-5" />
                Event Hosts
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <motion.div 
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container-padding max-w-6xl mx-auto py-16 text-black bg-yellow-300 rounded-2xl shadow-lg"
      >
        {activeTab === 'community' ? (
          <div className="space-y-16">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Become a Community Lead</h2>
              <p className="text-lg text-muted-foreground">
                As a Community Lead, you'll have the tools and support to build and grow your own community. 
                Organize events, connect with like-minded individuals, and make a lasting impact.
              </p>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {communityFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-yellow-200 p-6 rounded-xl shadow-sm border border-yellow-300 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-full bg-raspberry/10 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="bg-yellow-100 p-8 rounded-2xl mt-12 border border-yellow-200"
            >
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="md:w-1/2">
                    <h3 className="text-2xl font-bold mb-4">Why Become a Community Lead?</h3>
                    <ul className="space-y-3">
                      {communityBenefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-raspberry mt-0.5">{benefit.icon}</span>
                          <span>{benefit.text}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      size="lg" 
                      className="mt-6"
                      onClick={() => navigate('/signup?type=community')}
                    >
                      Start Your Community <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="hidden md:block md:w-1/2">
                    <div className="bg-raspberry/10 p-8 rounded-xl aspect-square flex items-center justify-center">
                      <Users className="h-32 w-32 text-raspberry" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-16">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Become a Host</h2>
              <p className="text-lg text-muted-foreground">
                Whether you're an established venue or an independent host, our platform provides everything 
                you need to create and manage successful events.
              </p>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {hostFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-yellow-200 p-6 rounded-xl shadow-sm border border-yellow-300 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-full bg-raspberry/10 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="bg-yellow-100 p-8 rounded-2xl mt-12 border border-yellow-200"
            >
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                  <div className="md:w-1/2">
                    <h3 className="text-2xl font-bold mb-4">Why Become a Host?</h3>
                    <ul className="space-y-3">
                      {hostBenefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-blue-500 mt-0.5">{benefit.icon}</span>
                          <span>{benefit.text}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      size="lg" 
                      className="mt-6 bg-blue-600 hover:bg-blue-700"
                      onClick={() => navigate('/signup?type=host')}
                    >
                      Start Hosting <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="hidden md:block md:w-1/2">
                    <div className="bg-blue-100 p-8 rounded-xl aspect-square flex items-center justify-center">
                      <UserCog className="h-32 w-32 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* CTA Section */}
      <section className="py-16 bg-yellow-400 text-black rounded-2xl max-w-4xl mx-auto my-8 shadow-lg">
        <div className="container-padding max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of community builders and hosts who are creating amazing experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary" 
                className="bg-black text-yellow-400 hover:bg-gray-800"
                onClick={() => navigate('/contact')}
              >
                Contact Us
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-black border-black hover:bg-black/10"
                onClick={() => navigate('/signup')}
              >
                Sign Up Now
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LearnMore;
