# BeteGubae (Course Compass)

A modern Learning Management System (LMS) dedicated to Ethiopian Orthodox Tewahdo Church education — featuring courses in Ge'ez, Qene, Aqwaqwam, Qidase, and traditional church literature.

## Features

- **Multilingual Support**: English, Amharic (አማርኛ), Afaan Oromoo, and Ge'ez (ግእዝ).
- **Role-based Dashboards**: Tailored views and controls for Students, Instructors, and Administrators.
- **Interactive Courses & Lessons**: Video and media lessons with offline caching and progress tracking.
- **Real-time Communication**: Direct messaging and chat between students and instructors.
- **E-Commerce & Approvals**: Course shopping cart, enrollment workflows, and administrative approvals.
- **Push Notifications & Reminders**: Web push notifications for approvals, assignments, and messages.

## Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **State & Data Fetching**: TanStack React Query
- **Routing**: React Router v6
- **Internationalization**: i18next

### Backend
- **Framework**: Spring Boot (Java) located in `LMS/`
- **Security**: JWT & Spring Security
- **Database**: PostgreSQL / H2 (configurable)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:8081)
npm run dev

# Build for production
npm run build

# Run type check
npx tsc --noEmit
```

### Backend Setup (LMS)

```bash
cd LMS

# Build and run with Maven
./mvnw spring-boot:run
```

## License

Private / Proprietary.
