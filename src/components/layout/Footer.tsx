import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Facebook, Twitter, Linkedin, Youtube, Instagram } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();
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
              <span className="font-display text-xl font-bold">{t('common.brand')}</span>
            </Link>
            <p className="text-sm text-primary-foreground/70 mb-4">
              {t('home.footerTagline')}
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
            <h4 className="font-display font-semibold mb-4">{t('common.explore')}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/courses" className="hover:text-accent transition-colors">{t('common.allCourses')}</Link></li>
              <li><Link to="/categories" className="hover:text-accent transition-colors">{t('common.categories')}</Link></li>
              <li><Link to="/instructors" className="hover:text-accent transition-colors">{t('common.instructors')}</Link></li>
              <li><Link to="/certificates" className="hover:text-accent transition-colors">{t('common.certificates')}</Link></li>
            </ul>
          </div>

          {/* For Students */}
          <div>
            <h4 className="font-display font-semibold mb-4">{t('common.forStudents')}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/dashboard" className="hover:text-accent transition-colors">{t('common.myLearning')}</Link></li>
              <li><Link to="/help" className="hover:text-accent transition-colors">{t('common.helpCenter')}</Link></li>
              <li><Link to="/referrals" className="hover:text-accent transition-colors">{t('common.referAndEarn')}</Link></li>
              <li><Link to="/mobile-app" className="hover:text-accent transition-colors">{t('common.mobileApp')}</Link></li>
            </ul>
          </div>

          {/* For Instructors */}
          <div>
            <h4 className="font-display font-semibold mb-4">{t('common.teach')}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/dashboard/become-instructor" className="hover:text-accent transition-colors">{t('common.becomeInstructor')}</Link></li>
              <li><Link to="/dashboard/instructor-help" className="hover:text-accent transition-colors">{t('common.instructorResources')}</Link></li>
              <li><Link to="/dashboard/instructor-community" className="hover:text-accent transition-colors">{t('common.community')}</Link></li>
              <li><Link to="/dashboard/instructor-guidelines" className="hover:text-accent transition-colors">{t('common.guidelines')}</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold mb-4">{t('common.company')}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/about" className="hover:text-accent transition-colors">{t('common.aboutUs')}</Link></li>
              <li><Link to="/careers" className="hover:text-accent transition-colors">{t('common.careers')}</Link></li>
              <li><Link to="/blog" className="hover:text-accent transition-colors">{t('common.blog')}</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">{t('common.contact')}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} {t('common.brand')}. {t('common.allRightsReserved')}
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-primary-foreground/60">
            <Link to="/privacy" className="hover:text-accent transition-colors">{t('common.privacyPolicy')}</Link>
            <Link to="/terms" className="hover:text-accent transition-colors">{t('common.termsOfService')}</Link>
            <Link to="/cookies" className="hover:text-accent transition-colors">{t('common.cookiePolicy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
