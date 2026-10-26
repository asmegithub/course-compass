import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  FileText,
  ShieldCheck,
  CreditCard,
  BookOpen,
  Users,
  AlertTriangle,
  Lock,
  RefreshCw,
  Mail,
  ChevronRight,
  Scale,
  Gavel,
  Globe,
  EyeOff,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Section data
───────────────────────────────────────────── */
const sections = [
  {
    id: "acceptance",
    icon: FileText,
    title: "Acceptance of Terms",
    content: [
      {
        heading: "Agreement to Terms",
        body: `By accessing or using Course Compass ("Platform", "we", "us", or "our"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not access or use our services.`,
      },
      {
        heading: "Eligibility",
        body: `You must be at least 13 years of age to use our Platform. By using Course Compass, you represent and warrant that you meet the eligibility requirements and have the legal capacity to enter into these Terms. Users under 18 must have parental or guardian consent.`,
      },
      {
        heading: "Changes to Terms",
        body: `We reserve the right to modify these Terms at any time. We will notify you of significant changes via email or prominent notice on the Platform. Your continued use after changes constitutes acceptance of the updated Terms.`,
      },
    ],
  },
  {
    id: "accounts",
    icon: Users,
    title: "User Accounts",
    content: [
      {
        heading: "Account Registration",
        body: `To access certain features, you must create an account. You agree to provide accurate, current, and complete information, and to keep your account information up to date. Each person may only maintain one account.`,
      },
      {
        heading: "Account Security",
        body: `You are responsible for safeguarding your password and for all activities that occur under your account. Notify us immediately of any unauthorized use. We are not liable for any loss arising from unauthorized use of your credentials.`,
      },
      {
        heading: "Account Termination",
        body: `We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or harm other users. You may close your account at any time by contacting our support team.`,
      },
    ],
  },
  {
    id: "courses",
    icon: BookOpen,
    title: "Course Content & Enrollment",
    content: [
      {
        heading: "Course Access",
        body: `Upon purchase or enrollment, you receive a limited, non-exclusive, non-transferable license to access and view course content for personal, non-commercial educational purposes only. This license does not include the right to share, reproduce, or distribute content.`,
      },
      {
        heading: "Content Accuracy",
        body: `While we strive to ensure accuracy, course content reflects the instructor's knowledge at the time of creation. We do not guarantee that content is error-free, up-to-date, or suitable for any particular purpose. Always verify critical information with authoritative sources.`,
      },
      {
        heading: "Instructor Content",
        body: `Instructors are independent creators responsible for their own content. Course Compass reviews content for basic quality standards but does not endorse or guarantee the accuracy of instructor materials. Instructors must comply with our Content Guidelines.`,
      },
      {
        heading: "Certificates",
        body: `Certificates of completion are issued upon meeting course requirements. These certificates are for personal achievement purposes and do not constitute academic credit or professional certification unless explicitly stated.`,
      },
    ],
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "Payments & Refunds",
    content: [
      {
        heading: "Pricing",
        body: `Course prices are displayed in Ethiopian Birr (ETB) or other currencies as applicable. Prices may change at any time. We are not responsible for pricing errors, and reserve the right to cancel orders placed at incorrect prices.`,
      },
      {
        heading: "Payment Processing",
        body: `Payments are processed securely through Chapa payment gateway. By making a payment, you authorize us to charge your selected payment method. You are responsible for all applicable taxes and fees.`,
      },
      {
        heading: "Refund Policy",
        body: `We offer a 30-day refund policy for courses that do not meet advertised standards. Refund requests must be submitted within 30 days of purchase and may be denied if you have completed more than 50% of the course or if abuse of the refund policy is detected.`,
      },
      {
        heading: "Subscriptions & Auto-renewal",
        body: `If you subscribe to any recurring plan, it will auto-renew at the end of each billing period unless cancelled. You may cancel at any time; cancellation takes effect at the end of the current billing cycle.`,
      },
    ],
  },
  {
    id: "conduct",
    icon: ShieldCheck,
    title: "User Conduct",
    content: [
      {
        heading: "Prohibited Activities",
        body: `You agree not to: (a) share or distribute course content without permission; (b) use automated tools to scrape or download content; (c) create multiple accounts to abuse free trials or promotions; (d) post harmful, offensive, or misleading content; (e) attempt to hack, disrupt, or damage the Platform; (f) impersonate other users or staff.`,
      },
      {
        heading: "Community Standards",
        body: `Our Platform fosters respectful learning. You must not engage in harassment, discrimination, hate speech, or any conduct that degrades the experience of others. Violations may result in immediate account suspension.`,
      },
      {
        heading: "Instructor Conduct",
        body: `Instructors must ensure their content is original, accurate, and complies with applicable laws. Instructors may not promote competing platforms within course content, collect student data beyond what is permitted, or engage in deceptive marketing.`,
      },
    ],
  },
  {
    id: "privacy",
    icon: Lock,
    title: "Privacy & Data",
    content: [
      {
        heading: "Data Collection",
        body: `We collect information you provide during registration, enrollment, and use of the Platform, including name, email, payment details, and learning activity. Please review our Privacy Policy for full details on data practices.`,
      },
      {
        heading: "Data Use",
        body: `We use your data to provide and improve our services, process transactions, send communications, personalize your experience, and comply with legal obligations. We do not sell your personal data to third parties.`,
      },
      {
        heading: "Cookies",
        body: `We use cookies and similar technologies to enhance functionality, analyze usage, and deliver personalized content. By using the Platform, you consent to our use of cookies as described in our Cookie Policy.`,
      },
    ],
  },
  {
    id: "ip",
    icon: EyeOff,
    title: "Intellectual Property",
    content: [
      {
        heading: "Platform Ownership",
        body: `All Platform content, features, and functionality — including software, text, graphics, logos, and UI — are owned by Course Compass or its licensors and are protected by Ethiopian and international intellectual property laws.`,
      },
      {
        heading: "User-Generated Content",
        body: `By submitting reviews, comments, or other content, you grant Course Compass a worldwide, royalty-free, perpetual license to use, display, and distribute that content in connection with the Platform. You retain ownership of your content.`,
      },
      {
        heading: "DMCA / Copyright Infringement",
        body: `We respect intellectual property rights. If you believe content on our Platform infringes your copyright, please contact us at legal@coursecompass.et with details of the alleged infringement.`,
      },
    ],
  },
  {
    id: "liability",
    icon: AlertTriangle,
    title: "Disclaimers & Liability",
    content: [
      {
        heading: "Disclaimer of Warranties",
        body: `The Platform is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, express or implied. We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses or other harmful components.`,
      },
      {
        heading: "Limitation of Liability",
        body: `To the fullest extent permitted by law, Course Compass shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, goodwill, or other intangible losses, resulting from your use of (or inability to use) the Platform.`,
      },
      {
        heading: "Indemnification",
        body: `You agree to indemnify, defend, and hold harmless Course Compass and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses arising from your use of the Platform or violation of these Terms.`,
      },
    ],
  },
  {
    id: "governing",
    icon: Gavel,
    title: "Governing Law",
    content: [
      {
        heading: "Applicable Law",
        body: `These Terms are governed by the laws of the Federal Democratic Republic of Ethiopia, without regard to conflict-of-law principles. Any disputes shall be subject to the exclusive jurisdiction of the courts of Addis Ababa, Ethiopia.`,
      },
      {
        heading: "Dispute Resolution",
        body: `Before initiating legal proceedings, you agree to attempt to resolve disputes informally by contacting us. If informal resolution fails after 30 days, disputes may be submitted to binding arbitration under Ethiopian law.`,
      },
      {
        heading: "Severability",
        body: `If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect. The invalid provision will be modified to the minimum extent necessary to make it enforceable.`,
      },
    ],
  },
  {
    id: "contact",
    icon: Mail,
    title: "Contact Us",
    content: [
      {
        heading: "Get in Touch",
        body: `If you have questions about these Terms, please contact us using the details below. We aim to respond within 2 business days.`,
      },
    ],
    contactDetails: [
      { label: "Legal", value: "legal@coursecompass.et" },
      { label: "Support", value: "support@coursecompass.et" },
      { label: "Address", value: "Addis Ababa, Ethiopia" },
    ],
  },
];

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
const TermsAndConditions = () => {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  /* Scroll-spy + progress bar */
  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0);

      const offsets = sections.map((s) => ({
        id: s.id,
        top: sectionRefs.current[s.id]?.getBoundingClientRect().top ?? Infinity,
      }));
      const visible = offsets.filter((o) => o.top <= 140).sort((a, b) => b.top - a.top);
      if (visible.length > 0) setActiveSection(visible[0].id);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const effectiveDate = new Date("2025-01-01").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Reading progress bar */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 z-50 h-[3px] transition-all duration-150"
        style={{
          width: `${scrollProgress}%`,
          background: "linear-gradient(90deg, hsl(205 75% 36%), hsl(42 78% 48%))",
        }}
      />

      {/* ── Hero ──────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: "hsl(42 78% 48%)" }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-10"
          style={{ background: "hsl(205 75% 36%)" }}
        />

        <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border"
            style={{
              background: "hsl(42 78% 48% / 0.15)",
              borderColor: "hsl(42 78% 48% / 0.35)",
              color: "hsl(42 85% 68%)",
            }}
          >
            <Scale className="w-3.5 h-3.5" />
            Legal Document
          </div>

          <h1
            className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight"
            style={{ color: "hsl(38 30% 92%)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Terms &amp; Conditions
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-8" style={{ color: "hsl(34 15% 68%)" }}>
            Please read these terms carefully before using Course Compass. By
            accessing our platform you agree to be bound by these conditions.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            {[
              { icon: Globe, label: `Effective: ${effectiveDate}` },
              { icon: RefreshCw, label: "Last updated: October 26, 2026" },
              { icon: ShieldCheck, label: "PDPA Compliant" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border"
                style={{
                  background: "hsl(20 18% 11% / 0.5)",
                  borderColor: "hsl(20 15% 25%)",
                  color: "hsl(34 15% 65%)",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Body ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-12 flex gap-8">

        {/* Sticky sidebar TOC */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div
            className="sticky top-24 rounded-2xl p-4 border"
            style={{
              background: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4 px-2"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Table of Contents
            </p>
            <nav className="space-y-0.5">
              {sections.map((s) => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    id={`toc-${s.id}`}
                    onClick={() => scrollTo(s.id)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-sm font-medium transition-all duration-200"
                    style={{
                      background: isActive
                        ? "linear-gradient(90deg, hsl(205 75% 36% / 0.15), hsl(42 78% 48% / 0.10))"
                        : "transparent",
                      color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                      borderLeft: isActive
                        ? "2px solid hsl(42 78% 48%)"
                        : "2px solid transparent",
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{s.title}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </nav>

            <div
              className="mt-6 p-3 rounded-xl border text-center"
              style={{
                background: "hsl(42 78% 48% / 0.08)",
                borderColor: "hsl(42 78% 48% / 0.25)",
              }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: "hsl(var(--foreground))" }}>
                Have questions?
              </p>
              <a
                href="mailto:legal@coursecompass.et"
                className="text-xs underline underline-offset-2"
                style={{ color: "hsl(var(--primary))" }}
              >
                legal@coursecompass.et
              </a>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-10">

          {/* Intro callout */}
          <div
            className="flex gap-4 p-5 rounded-2xl border"
            style={{
              background: "hsl(205 75% 36% / 0.07)",
              borderColor: "hsl(205 75% 36% / 0.25)",
            }}
          >
            <ShieldCheck
              className="w-6 h-6 mt-0.5 shrink-0"
              style={{ color: "hsl(var(--primary))" }}
            />
            <div>
              <p className="font-semibold text-sm mb-1" style={{ color: "hsl(var(--foreground))" }}>
                Your rights matter
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                These Terms outline your rights and responsibilities when using
                Course Compass. We encourage you to read every section. If you
                have concerns, reach out before accepting.
              </p>
            </div>
          </div>

          {/* Sections */}
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <article
                key={section.id}
                id={section.id}
                ref={(el) => { sectionRefs.current[section.id] = el; }}
                className="rounded-2xl border overflow-hidden transition-shadow duration-300 hover:shadow-lg"
                style={{
                  background: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {/* Section header */}
                <div
                  className="flex items-center gap-4 px-6 py-5 border-b"
                  style={{
                    background: "linear-gradient(90deg, hsl(var(--muted) / 0.6), transparent)",
                    borderColor: "hsl(var(--border))",
                  }}
                >
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                    style={{
                      background: "linear-gradient(135deg, hsl(205 75% 36%), hsl(42 78% 48%))",
                    }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-0.5"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      Section {String(idx + 1).padStart(2, "0")}
                    </p>
                    <h2
                      className="text-lg font-bold"
                      style={{
                        color: "hsl(var(--foreground))",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {section.title}
                    </h2>
                  </div>
                </div>

                {/* Section body */}
                <div className="px-6 py-6 space-y-6">
                  {section.content.map((item) => (
                    <div key={item.heading}>
                      <h3
                        className="text-sm font-bold mb-2 flex items-center gap-2"
                        style={{ color: "hsl(var(--primary))" }}
                      >
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: "hsl(42 78% 48%)" }}
                        />
                        {item.heading}
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "hsl(var(--foreground) / 0.8)" }}
                      >
                        {item.body}
                      </p>
                    </div>
                  ))}

                  {/* Contact cards */}
                  {"contactDetails" in section && section.contactDetails && (
                    <div className="grid sm:grid-cols-3 gap-4 mt-4">
                      {section.contactDetails.map(({ label, value }: { label: string; value: string }) => (
                        <div
                          key={label}
                          className="rounded-xl p-4 border text-center"
                          style={{
                            background: "hsl(var(--muted) / 0.5)",
                            borderColor: "hsl(var(--border))",
                          }}
                        >
                          <p
                            className="text-xs font-semibold uppercase tracking-wide mb-1"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            {label}
                          </p>
                          <p className="text-sm font-medium break-words" style={{ color: "hsl(var(--foreground))" }}>
                            {value.includes("@") ? (
                              <a
                                href={`mailto:${value}`}
                                className="underline underline-offset-2"
                                style={{ color: "hsl(var(--primary))" }}
                              >
                                {value}
                              </a>
                            ) : (
                              value
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          {/* Bottom acceptance CTA */}
          <div
            className="rounded-2xl p-8 border text-center"
            style={{
              background: "linear-gradient(135deg, hsl(205 75% 36% / 0.08), hsl(42 78% 48% / 0.06))",
              borderColor: "hsl(42 78% 48% / 0.3)",
            }}
          >
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
              style={{
                background: "linear-gradient(135deg, hsl(205 75% 36%), hsl(42 78% 48%))",
              }}
            >
              <Scale className="w-7 h-7 text-white" />
            </div>
            <h2
              className="text-xl font-bold mb-2"
              style={{
                color: "hsl(var(--foreground))",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              By using Course Compass, you agree to these Terms
            </h2>
            <p
              className="text-sm mb-6 max-w-lg mx-auto"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              These Terms constitute the entire agreement between you and Course
              Compass regarding your use of our Platform. Last updated October 26, 2026.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/courses"
                id="terms-browse-courses"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, hsl(205 75% 36%), hsl(42 78% 48%))",
                }}
              >
                <BookOpen className="w-4 h-4" />
                Browse Courses
              </Link>
              <a
                href="mailto:legal@coursecompass.et"
                id="terms-contact-legal"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm border transition-colors"
                style={{
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                  background: "hsl(var(--card))",
                }}
              >
                <Mail className="w-4 h-4" />
                Ask a Question
              </a>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default TermsAndConditions;
