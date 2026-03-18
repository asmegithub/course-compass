import { Globe, Award, Users, Clock, Download, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const WhyChooseUs = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Globe,
      title: t('home.whyLearn.features.multilingual.title'),
      description: t('home.whyLearn.features.multilingual.description'),
    },
    {
      icon: Award,
      title: t('home.whyLearn.features.certificates.title'),
      description: t('home.whyLearn.features.certificates.description'),
    },
    {
      icon: Users,
      title: t('home.whyLearn.features.instructors.title'),
      description: t('home.whyLearn.features.instructors.description'),
    },
    {
      icon: Clock,
      title: t('home.whyLearn.features.pace.title'),
      description: t('home.whyLearn.features.pace.description'),
    },
    {
      icon: Download,
      title: t('home.whyLearn.features.offline.title'),
      description: t('home.whyLearn.features.offline.description'),
    },
    {
      icon: Shield,
      title: t('home.whyLearn.features.guarantee.title'),
      description: t('home.whyLearn.features.guarantee.description'),
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t('home.whyLearn.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('home.whyLearn.subtitle')}
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
