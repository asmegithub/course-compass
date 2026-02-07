import { Globe, Award, Users, Clock, Download, Shield } from 'lucide-react';

const features = [
  {
    icon: Globe,
    title: 'Multilingual Content',
    description: 'Learn in English, Amharic, Oromo, or Geez. Education in your native language.',
  },
  {
    icon: Award,
    title: 'Verified Certificates',
    description: 'Earn industry-recognized certificates to boost your career and credibility.',
  },
  {
    icon: Users,
    title: 'Expert Instructors',
    description: 'Learn from verified professionals with real-world experience.',
  },
  {
    icon: Clock,
    title: 'Learn at Your Pace',
    description: 'Lifetime access to courses. Study whenever and wherever you want.',
  },
  {
    icon: Download,
    title: 'Offline Access',
    description: 'Download lessons and learn without internet. Perfect for on-the-go.',
  },
  {
    icon: Shield,
    title: 'Money-Back Guarantee',
    description: '30-day refund policy. Not satisfied? Get your money back, no questions.',
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Why Learn with LearnHub?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're committed to making quality education accessible to everyone across Africa
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-6 bg-card rounded-xl border border-border hover:border-accent/50 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold text-card-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
