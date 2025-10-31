import PageLayout from "@/components/layout/PageLayout";
import { motion } from "framer-motion";
import { Sparkles, Users, Calendar, MapPin, Heart, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: <Users className="h-8 w-8" />,
    title: "Join the Community",
    description: "Create an account and join a community of like-minded individuals.",
  },
  {
    icon: <Calendar className="h-8 w-8" />,
    title: "Discover Events",
    description: "Browse through a wide range of events in your city or online.",
  },
  {
    icon: <MapPin className="h-8 w-8" />,
    title: "Book Your Spot",
    description: "Reserve your spot with just a few clicks.",
  },
  {
    icon: <Heart className="h-8 w-8" />,
    title: "Enjoy the Experience",
    description: "Attend amazing events and create unforgettable memories.",
  },
  {
    icon: <CheckCircle className="h-8 w-8" />,
    title: "Become a Regular",
    description: "Get personalized recommendations and early access to new events.",
  },
];

export default function About() {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-raspberry/5 to-white">
        <div className="container-padding max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Motojojo</h1>
            <p className="text-xl text-muted-foreground mb-8">
              We're on a mission to connect people through amazing experiences and build vibrant communities.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container-padding max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform makes it easy to discover, book, and enjoy amazing experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-raspberry/10 flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-16 bg-muted/30">
        <div className="container-padding max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="w-16 h-1 bg-raspberry mx-auto mb-6"></div>
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground mb-8">
              At Motojojo, we believe in the power of shared experiences to bring people together. 
              Our platform connects event organizers with attendees, making it easy to discover and 
              book unique experiences that create lasting memories.
            </p>
            <Button size="lg">Join Our Community</Button>
          </motion.div>
        </div>
      </section>

      {/* Community & Hosts */}
      <section className="py-16 bg-white">
        <div className="container-padding max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold">For Community Builders</h2>
              <p className="text-muted-foreground">
                As a Community Lead, you'll have the tools and support to build and grow your own community. 
                Organize events, connect with like-minded individuals, and make a lasting impact.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Access to exclusive event management tools</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Monetization opportunities</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Community analytics and insights</span>
                </li>
              </ul>
              <Button variant="outline">Learn About Community Leadership</Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-muted/30 p-8 rounded-xl"
            >
              <div className="aspect-video bg-raspberry/10 rounded-lg flex items-center justify-center">
                <Users className="h-16 w-16 text-raspberry" />
              </div>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mt-20">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="order-2 md:order-1"
            >
              <div className="aspect-video bg-raspberry/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-16 w-16 text-raspberry" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6 order-1 md:order-2"
            >
              <h2 className="text-3xl font-bold">For Event Hosts</h2>
              <p className="text-muted-foreground">
                Whether you're an established venue or an independent host, our platform provides everything you need 
                to create and manage successful events.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Easy event creation and management</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Secure payment processing</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Marketing and promotion tools</span>
                </li>
              </ul>
              <Button variant="outline">Become a Host</Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-raspberry text-white">
        <div className="container-padding max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of event-goers and hosts in creating unforgettable experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-raspberry hover:bg-gray-100">
                Browse Events
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Create an Event
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}