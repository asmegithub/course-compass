import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Users, BookOpen, Award, Globe } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden gradient-hero text-primary-foreground">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl" />
      </div>

      <div className="container relative py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 rounded-full text-sm">
              <Globe className="h-4 w-4 text-accent" />
              <span>Learn in your language • English • አማርኛ • Oromoo • ግዕዝ</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Unlock Your Potential with{' '}
              <span className="text-accent">Quality Education</span>
            </h1>

            <p className="text-lg text-primary-foreground/80 max-w-xl">
              Join thousands of learners across Africa. Master in-demand skills with expert-led courses, 
              earn certificates, and transform your career.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button variant="hero" asChild>
                <Link to="/courses">
                  Explore Courses
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Play className="h-5 w-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                  <span className="font-display text-2xl font-bold">50K+</span>
                </div>
                <p className="text-sm text-primary-foreground/60">Active Learners</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <BookOpen className="h-5 w-5 text-accent" />
                  <span className="font-display text-2xl font-bold">500+</span>
                </div>
                <p className="text-sm text-primary-foreground/60">Courses</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Award className="h-5 w-5 text-accent" />
                  <span className="font-display text-2xl font-bold">10K+</span>
                </div>
                <p className="text-sm text-primary-foreground/60">Certificates Issued</p>
              </div>
            </div>
          </div>

          {/* Image / Illustration */}
          <div className="relative hidden lg:block animate-fade-in">
            <div className="relative z-10">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=500&fit=crop"
                alt="Students learning together"
                className="rounded-2xl shadow-2xl"
              />
              
              {/* Floating Cards */}
              <div className="absolute -left-8 top-1/4 bg-card text-card-foreground p-4 rounded-xl shadow-lg animate-float">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Certificate Earned</p>
                    <p className="font-semibold">Web Development</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 bottom-1/4 bg-card text-card-foreground p-4 rounded-xl shadow-lg animate-float" style={{ animationDelay: '2s' }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Play className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Continue Learning</p>
                    <p className="font-semibold">Python Basics</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -z-10 top-10 -right-10 w-full h-full bg-accent/20 rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
