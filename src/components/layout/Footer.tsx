import { Link } from 'react-router-dom';
import { GraduationCap, Facebook, Twitter, Linkedin, Youtube, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <GraduationCap className="h-6 w-6 text-accent-foreground" />
              </div>
              <span className="font-display text-xl font-bold">LearnHub</span>
            </Link>
            <p className="text-sm text-primary-foreground/70 mb-4">
              Empowering Africa through quality education. Learn skills that matter, in your language.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-display font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/courses" className="hover:text-accent transition-colors">All Courses</Link></li>
              <li><Link to="/categories" className="hover:text-accent transition-colors">Categories</Link></li>
              <li><Link to="/instructors" className="hover:text-accent transition-colors">Instructors</Link></li>
              <li><Link to="/certificates" className="hover:text-accent transition-colors">Certificates</Link></li>
            </ul>
          </div>

          {/* For Students */}
          <div>
            <h4 className="font-display font-semibold mb-4">For Students</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/dashboard" className="hover:text-accent transition-colors">My Learning</Link></li>
              <li><Link to="/help" className="hover:text-accent transition-colors">Help Center</Link></li>
              <li><Link to="/referrals" className="hover:text-accent transition-colors">Refer & Earn</Link></li>
              <li><Link to="/mobile-app" className="hover:text-accent transition-colors">Mobile App</Link></li>
            </ul>
          </div>

          {/* For Instructors */}
          <div>
            <h4 className="font-display font-semibold mb-4">Teach</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/become-instructor" className="hover:text-accent transition-colors">Become an Instructor</Link></li>
              <li><Link to="/instructor-help" className="hover:text-accent transition-colors">Instructor Resources</Link></li>
              <li><Link to="/instructor-community" className="hover:text-accent transition-colors">Community</Link></li>
              <li><Link to="/instructor-guidelines" className="hover:text-accent transition-colors">Guidelines</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-accent transition-colors">Careers</Link></li>
              <li><Link to="/blog" className="hover:text-accent transition-colors">Blog</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} LearnHub. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-primary-foreground/60">
            <Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-accent transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="hover:text-accent transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
