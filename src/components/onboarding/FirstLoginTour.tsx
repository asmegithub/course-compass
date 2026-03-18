import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

type TourStep = {
  title: string;
  body: string;
  /** CSS selector for the element to highlight/anchor. */
  target?: string;
};

const TOUR_VERSION = 'v1';

const isStudentRole = (role?: string | null) => role === 'STUDENT' || role === 'ROLE_STUDENT';
const isInstructorRole = (role?: string | null) => role === 'INSTRUCTOR' || role === 'ROLE_INSTRUCTOR';
const isAdminRole = (role?: string | null) => role === 'ADMIN' || role === 'ROLE_ADMIN';

const buildSteps = (role?: string | null): TourStep[] => {
  if (isAdminRole(role)) {
    return [
      { title: 'Welcome, Admin', body: 'This is your admin dashboard. From here you can monitor activity and manage the platform.' },
      { title: 'Payments & receipts', body: 'Review manual payment receipts and approve/reject enrollments from Admin → Payments.', target: '[data-tour="nav:/admin/payments"]' },
      { title: 'Instructor payouts', body: 'Approve instructor withdrawal requests and upload payout receipts from Admin → Payouts.', target: '[data-tour="nav:/admin/payouts"]' },
      { title: 'System settings', body: 'Configure platform settings, payment accounts, payout methods, and featured courses from Admin → System Settings.', target: '[data-tour="nav:/admin/settings"]' },
    ];
  }
  if (isInstructorRole(role)) {
    return [
      { title: 'Welcome, Instructor', body: 'Let’s do a quick tour of your instructor tools.' },
      { title: 'Create & manage courses', body: 'Use Instructor → Create Course to build new content and manage existing courses.', target: '[data-tour="nav:/instructor/courses/new"]' },
      { title: 'Reviews', body: 'See feedback per course in Instructor → Reviews.', target: '[data-tour="nav:/instructor/reviews"]' },
      { title: 'Earnings & payouts', body: 'Track your balance in Instructor → Earnings and request withdrawals in Instructor → Payouts.', target: '[data-tour="nav:/instructor/earnings"]' },
      { title: 'Withdrawals', body: 'Request withdrawals and track status in Instructor → Payouts.', target: '[data-tour="nav:/instructor/payouts"]' },
    ];
  }
  // student (default)
  return [
    { title: 'Welcome!', body: 'Let’s do a quick tour so you know where everything is.' },
    { title: 'Explore courses', body: 'Click Back to Site to browse courses (and add to cart) any time.', target: '[data-tour="back-to-site"]' },
    { title: 'My learning', body: 'Your enrolled courses live here.', target: '[data-tour="nav:/dashboard/courses"]' },
    { title: 'Payments & receipts', body: 'Track payment history and manual receipts here.', target: '[data-tour="nav:/dashboard/payments"]' },
  ];
};

export const FirstLoginTour = () => {
  const { user, isLoggedIn } = useAuth();
  const steps = useMemo(() => buildSteps(user?.role ?? null), [user?.role]);

  const storageKey = useMemo(() => {
    if (!user?.id) return null;
    const role = user.role ?? 'UNKNOWN';
    return `tourSeen:${TOUR_VERSION}:${user.id}:${role}`;
  }, [user?.id, user?.role]);

  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [bubble, setBubble] = useState<{ top: number; left: number } | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !storageKey) return;
    try {
      const seen = window.localStorage.getItem(storageKey);
      if (!seen) {
        setIdx(0);
        setOpen(true);
      }
    } catch {
      // If storage is blocked, just don't show tour.
    }
  }, [isLoggedIn, storageKey]);

  const markSeen = () => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, new Date().toISOString());
    } catch {
      // ignore
    }
  };

  const close = () => {
    markSeen();
    setOpen(false);
  };

  const step = steps[idx] ?? steps[0];
  const isLast = idx >= steps.length - 1;

  const compute = () => {
    const selector = step?.target;
    const el = selector ? (document.querySelector(selector) as HTMLElement | null) : null;

    if (el) {
      try {
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      } catch {
        // ignore
      }
    }

    const r = el ? el.getBoundingClientRect() : null;
    setRect(r);

    // Position bubble near target if possible, else center.
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const bubbleEl = bubbleRef.current;
    const bubbleW = bubbleEl?.offsetWidth ?? 420;
    const bubbleH = bubbleEl?.offsetHeight ?? 220;

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    if (!r) {
      setBubble({
        left: clamp((viewportW - bubbleW) / 2, 16, Math.max(16, viewportW - bubbleW - 16)),
        top: clamp((viewportH - bubbleH) / 2, 16, Math.max(16, viewportH - bubbleH - 16)),
      });
      return;
    }

    const pad = 14;
    const candidates = [
      // right
      { left: r.right + pad, top: r.top + r.height / 2 - bubbleH / 2 },
      // left
      { left: r.left - pad - bubbleW, top: r.top + r.height / 2 - bubbleH / 2 },
      // bottom
      { left: r.left + r.width / 2 - bubbleW / 2, top: r.bottom + pad },
      // top
      { left: r.left + r.width / 2 - bubbleW / 2, top: r.top - pad - bubbleH },
    ];

    const inBounds = (p: { left: number; top: number }) =>
      p.left >= 8 &&
      p.top >= 8 &&
      p.left + bubbleW <= viewportW - 8 &&
      p.top + bubbleH <= viewportH - 8;

    const chosen = candidates.find(inBounds) ?? candidates[0];
    setBubble({
      left: clamp(chosen.left, 16, Math.max(16, viewportW - bubbleW - 16)),
      top: clamp(chosen.top, 16, Math.max(16, viewportH - bubbleH - 16)),
    });
  };

  useEffect(() => {
    if (!open) return;
    // Compute twice: once now, once after layout.
    compute();
    const t = window.setTimeout(() => compute(), 50);

    const onResize = () => compute();
    const onScroll = () => compute();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idx, step?.target]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000]">
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-foreground/60" onClick={close} />

      {/* Spotlight highlight */}
      {rect && (
        <div
          className="absolute rounded-lg ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] pointer-events-none"
          style={{
            left: Math.max(8, rect.left - 6),
            top: Math.max(8, rect.top - 6),
            width: Math.min(window.innerWidth - 16, rect.width + 12),
            height: Math.min(window.innerHeight - 16, rect.height + 12),
          }}
        />
      )}

      {/* Bubble */}
      <div
        ref={(n) => {
          bubbleRef.current = n;
        }}
        className="absolute w-[min(420px,calc(100vw-32px))] rounded-xl border bg-card text-card-foreground shadow-2xl"
        style={{
          left: bubble?.left ?? 16,
          top: bubble?.top ?? 16,
        }}
      >
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{step?.title ?? 'Welcome'}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step?.body ?? ''}</p>
            </div>
            <button
              type="button"
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground shrink-0"
              onClick={close}
            >
              Skip
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Step {Math.min(idx + 1, steps.length)} of {steps.length}
            </span>
            <span>{step?.target ? 'Highlighting page element' : 'General tip'}</span>
          </div>
        </div>

        <div className="border-t p-3 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
            Back
          </Button>
          <Button
            variant="accent"
            onClick={() => {
              if (isLast) close();
              else setIdx((i) => Math.min(steps.length - 1, i + 1));
            }}
          >
            {isLast ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

