# Unimplemented Features – Priority List

All features that are **not yet implemented** or **only partially implemented** (e.g. mock data, no API wiring), ordered by priority.

---

## Priority levels

- **P0 – Critical**: Core LMS value; blocks main user flows.
- **P1 – High**: Important for trust, revenue, or engagement; do soon.
- **P2 – Medium**: Improves experience; implement after P0/P1.
- **P3 – Low**: Nice-to-have; backlog.

---

## P0 – Critical

| # | Feature | Where | What's missing |
|---|--------|--------|----------------|
| 1 | **Paid checkout flow** | Frontend + Backend | Frontend: no checkout page; no “Pay with Telebirr/Chapa” then create Payment + Enrollment. Backend: payment creation/init and optional gateway webhook may need verification. |
| 2 | **Course player / Learn view** | Frontend | No route or page to take a course (e.g. `/courses/:slug/learn` or `/learn/:enrollmentId`). Students can’t watch lessons in sequence. |
| 3 | **Lesson progress tracking** | Frontend + Backend | Frontend doesn’t call LessonProgress/VideoProgress APIs. No “mark complete” or “resume from last position”. Enrollment progress not updated from actual viewing. |
| 4 | **Sections & lessons by course** | Backend (or Frontend) | `getCourseSections()` and `getLessons()` fetch all; frontend filters in memory. Backend should support `courseId` (or course slug) so only that course’s curriculum is returned. |

---

## P1 – High

| # | Feature | Where | What's missing |
|---|--------|--------|----------------|
| 5 | **Student payment history** | Frontend | Link to `/dashboard/payments` exists but there is no page or route. Need a page that lists the student’s payments (backend may already expose this). |
| 6 | **Admin payments (real data)** | Frontend | Admin Payments page uses hardcoded `transactions`. Wire to backend Payment/PaymentTransaction API (list, filters, status). |
| 7 | **Instructor students (real data)** | Frontend | Instructor Students page uses mock list. Wire to enrollments (or backend endpoint) filtered by instructor’s courses. |
| 8 | **Quiz taking (student)** | Frontend + Backend | No “Take quiz” UI. Backend has QuizAttempt/QuizAnswer; frontend needs: load quiz + questions + options, submit attempt + answers, show score/feedback. |
| 9 | **Wishlist (API)** | Frontend | Wishlist button on course detail only toggles local state. Add/remove/list Wishlist via backend API and persist. |
| 10 | **Notifications (real count & list)** | Frontend | Navbar shows hardcoded “3”. Use real notification API for count and list; mark-as-read if supported. |
| 11 | **Student certificates page** | Frontend | Link to `/dashboard/certificates` but no dedicated page. List certificates from existing API and show/download. |

---

## P2 – Medium

| # | Feature | Where | What's missing |
|---|--------|--------|----------------|
| 12 | **Referrals page** | Frontend | Footer “Refer & Earn” links to `/referrals`; no route or page. Implement referral code display, share link, and optionally referral stats (backend has Referral/ReferralReward). |
| 13 | **Wishlist page** | Frontend | Nav/sidebar link to `/dashboard/wishlist`; no route or page. List wishlisted courses (after Wishlist API is wired). |
| 14 | **Video progress (resume)** | Frontend + Backend | Backend has VideoProgress (lastWatchedPosition, etc.). Frontend course player should save/load position and optionally send heartbeat updates. |
| 15 | **Admin email logs (real data)** | Frontend | Admin Email Logs uses mock data. Wire to backend EmailLog API. |
| 16 | **Categories on home** | Frontend | `CategoriesSection` on Index is commented out. Re-enable and wire to categories API. |
| 17 | **Cart (optional)** | Frontend | Navbar shows cart icon with hardcoded “2”. Either remove or implement a simple cart (e.g. for multiple courses) and tie to checkout. |
| 18 | **Course filters by courseId** | Backend | Ensure sections, lessons, outcomes, requirements, discussions support `courseId` (or equivalent) in list endpoints to avoid loading full DB. |

---

## P3 – Low

| # | Feature | Where | What's missing |
|---|--------|--------|----------------|
| 19 | **Bookmarks (lesson)** | Frontend + Backend | Backend has Bookmark (user, course, lesson, timestamp, note). No UI to add/list/bookmark within a lesson. |
| 20 | **Lesson notes** | Frontend + Backend | Backend has LessonNote. No UI for taking notes at a timestamp in a lesson. |
| 21 | **Search history** | Frontend | Backend has SearchHistory. No “recent searches” or “save search” in UI. |
| 22 | **Referral rewards & payouts** | Backend + Admin | ReferralReward and payout logic; admin view for referral stats and payouts. |
| 23 | **Download (offline)** | Frontend + Backend | Backend has Download. No “Download for offline” in course player. |
| 24 | **Certificate template admin** | Admin | CertificateTemplate CRUD and choosing template when issuing certificates. |
| 25 | **Role/Permission (RBAC)** | Backend (+ Admin) | If moving from `User.role` string to full RBAC: Role, Permission, RolePermission and admin UI. |
| 26 | **Language switcher persistence** | Frontend | UI exists; persist choice and use localized fields (e.g. titleAm, descriptionAm) where available. |
| 27 | **OAuth (e.g. Google) end-to-end** | Frontend + Backend | Backend has OAuth2LoginSuccessHandler; confirm frontend OAuth callback and `applyOAuthTokens` are fully wired. |

---

## Summary by priority

| Priority | Count | Focus |
|----------|--------|--------|
| **P0** | 4 | Checkout, course player, progress, curriculum by course |
| **P1** | 7 | Payment history, admin payments, instructor students, quiz taking, wishlist API, notifications, certificates page |
| **P2** | 7 | Referrals page, wishlist page, video resume, admin email logs, categories on home, cart, backend courseId filters |
| **P3** | 9 | Bookmarks, notes, search history, referral rewards, download, cert templates, RBAC, language, OAuth |

---

## Suggested implementation order (by priority then dependency)

1. **P0.4** – Sections/lessons by course (unblocks course player).
2. **P0.2** – Course player / Learn view (route + page, list sections/lessons).
3. **P0.3** – Lesson (and optionally video) progress tracking.
4. **P0.1** – Paid checkout flow (payment creation → enrollment with paymentId).
5. **P1.5** – Wishlist API + toggle on course detail.
6. **P1.7** – Student certificates page.
7. **P1.1** – Student payment history page.
8. **P1.6** – Notifications (real count + list).
9. **P1.4** – Quiz taking (student).
10. **P1.2** – Admin payments (real data).
11. **P1.3** – Instructor students (real data).
12. Then P2 and P3 as capacity allows.
