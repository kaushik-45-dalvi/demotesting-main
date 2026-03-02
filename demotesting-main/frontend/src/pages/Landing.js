import { Link } from 'react-router-dom';
import { Calendar, Users, QrCode, MessageCircle, Star, ArrowRight } from 'lucide-react';
import Marquee from 'react-fast-marquee';
import { motion } from 'framer-motion';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden border-b-2 border-black">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1562589726-45a782b8982a?crop=entropy&cs=srgb&fm=jpg&q=85')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-accent/80 to-secondary/90"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-heading font-black text-5xl md:text-7xl text-white mb-6 tracking-tight" data-testid="hero-heading">
              EVENTFLOW
            </h1>
            <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto mb-8">
              Smart College Event Management System. Simplify events, enhance experiences, and connect your campus community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="btn-primary text-lg px-8 py-4"
                data-testid="hero-get-started-button"
              >
                Get Started <ArrowRight className="ml-2 inline w-5 h-5" />
              </Link>
              <Link
                to="/events"
                className="btn-secondary text-lg px-8 py-4"
                data-testid="hero-browse-events-button"
              >
                Browse Events
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marquee */}
      <div className="bg-black text-white py-4 border-b-2 border-black">
        <Marquee speed={50}>
          <span className="mx-8 font-heading font-bold text-xl">UPCOMING EVENTS</span>
          <span className="mx-8">•</span>
          <span className="mx-8 font-heading font-bold text-xl">REGISTER NOW</span>
          <span className="mx-8">•</span>
          <span className="mx-8 font-heading font-bold text-xl">JOIN THE COMMUNITY</span>
          <span className="mx-8">•</span>
        </Marquee>
      </div>

      {/* Features Section */}
      <section className="py-24 border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading font-bold text-3xl md:text-5xl text-center mb-16" data-testid="features-heading">
            Why EventFlow?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ y: -5 }}
              className="card-brutalist"
              data-testid="feature-card-events"
            >
              <Calendar className="w-12 h-12 mb-4 text-primary" />
              <h3 className="font-heading font-bold text-2xl mb-2">Event Management</h3>
              <p className="text-muted-foreground">
                Create, manage, and track events with ease. Real-time updates and capacity management.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="card-brutalist"
              data-testid="feature-card-qr"
            >
              <QrCode className="w-12 h-12 mb-4 text-secondary" />
              <h3 className="font-heading font-bold text-2xl mb-2">QR Attendance</h3>
              <p className="text-muted-foreground">
                Generate unique QR codes for registrants. Quick and easy attendance tracking.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="card-brutalist"
              data-testid="feature-card-volunteers"
            >
              <Users className="w-12 h-12 mb-4 text-accent" />
              <h3 className="font-heading font-bold text-2xl mb-2">Volunteer Management</h3>
              <p className="text-muted-foreground">
                Organize volunteers, assign roles, and manage responsibilities efficiently.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="card-brutalist"
              data-testid="feature-card-feedback"
            >
              <Star className="w-12 h-12 mb-4 text-primary" />
              <h3 className="font-heading font-bold text-2xl mb-2">Feedback System</h3>
              <p className="text-muted-foreground">
                Collect ratings and comments. Analyze feedback to improve future events.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="card-brutalist bg-secondary text-secondary-foreground"
              data-testid="feature-card-chatbot"
            >
              <MessageCircle className="w-12 h-12 mb-4" />
              <h3 className="font-heading font-bold text-2xl mb-2">🥇 AI Assistant</h3>
              <p className="opacity-90">
                Chat with our AI bot for instant answers about events, registration, and more!
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="card-brutalist"
            >
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-heading font-bold text-2xl mb-2">Analytics</h3>
              <p className="text-muted-foreground">
                Track registrations, attendance, and engagement with detailed analytics.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading font-bold text-3xl md:text-5xl mb-6">
            Ready to Streamline Your Events?
          </h2>
          <p className="text-base md:text-lg mb-8 opacity-90">
            Join hundreds of colleges using EventFlow to manage their events efficiently.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-8 py-4 text-lg font-bold bg-secondary text-secondary-foreground border-2 border-black shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-button transition-all"
            data-testid="cta-signup-button"
          >
            Sign Up Now <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-muted-foreground font-bold">
            © 2026 EventFlow. Built by Kaushik for college communities.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;