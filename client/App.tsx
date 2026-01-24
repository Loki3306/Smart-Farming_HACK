import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AnimatePresence } from "framer-motion";
import { AuthContextProvider } from "./context/AuthContext";
import { FarmContextProvider } from "./context/FarmContext";
import { TourContextProvider } from "./context/TourContext";
import { LanguageProvider } from "./context/LanguageContext";
import { SettingsProvider } from "./context/SettingsContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";

// Eager load critical auth pages for instant display
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Home } from "./pages/Home";
import NotFound from "./pages/NotFound";

// Lazy load heavy components to reduce initial bundle size
const Landing = lazy(() => import("./pages/Landing").then(m => ({ default: m.Landing })));
const Disease = lazy(() => import("./pages/Disease"));
const AuditTrail = lazy(() => import("./pages/AuditTrail").then(m => ({ default: m.AuditTrail })));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const FarmOnboarding = lazy(() => import("./pages/FarmOnboarding").then(m => ({ default: m.FarmOnboarding })));
const Farm = lazy(() => import("./pages/Farm").then(m => ({ default: m.Farm })));
const Weather = lazy(() => import("./pages/Weather").then(m => ({ default: m.Weather })));
const Recommendations = lazy(() => import("./pages/Recommendations").then(m => ({ default: m.Recommendations })));
const Marketplace = lazy(() => import("./pages/Marketplace").then(m => ({ default: m.Marketplace })));
const Learn = lazy(() => import("./pages/Learn").then(m => ({ default: m.Learn })));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail").then(m => ({ default: m.ArticleDetail })));
const CourseDetail = lazy(() => import("./pages/CourseDetail").then(m => ({ default: m.CourseDetail })));
const CoursePlayer = lazy(() => import("./pages/CoursePlayer").then(m => ({ default: m.CoursePlayer })));
const QuizPlayer = lazy(() => import("./pages/QuizPlayer"));
const Community = lazy(() => import("./pages/Community").then(m => ({ default: m.Community })));
const Notifications = lazy(() => import("./pages/Notifications").then(m => ({ default: m.Notifications })));
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));
const Messages = lazy(() => import("./pages/Messages"));
const FAQ = lazy(() => import("./pages/FAQ").then(m => ({ default: m.FAQ })));
const Regimes = lazy(() => import("./pages/Regimes").then(m => ({ default: m.default })));
const FarmMapping = lazy(() => import("./pages/FarmMappingPage").then(m => ({ default: m.default })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          {/* Landing Page */}
          <Route path="/" element={<Landing />} />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Onboarding Route (authenticated only, before dashboard) */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <FarmOnboarding />
            </ProtectedRoute>
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Home />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/farm"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Farm />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/farm-mapping"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <FarmMapping />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/weather"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Weather />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/recommendations"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Recommendations />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/regimes"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Regimes />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/regime/:regimeId"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Regimes />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/disease"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Disease />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/marketplace"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Marketplace />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/learn"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Learn />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/learn/articles/:id"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <ArticleDetail />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/learn/courses/:courseId"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <CourseDetail />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/learn/courses/:courseId/lesson/:lessonId"
          element={
            <ProtectedRoute requireOnboarding>
              <CoursePlayer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/learn/quiz/:quizId"
          element={
            <ProtectedRoute requireOnboarding>
              <QuizPlayer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/community"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Community />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Messages />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Notifications />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit-trail"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <AuditTrail />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/faq"
          element={
            <ProtectedRoute requireOnboarding>
              <DashboardLayout>
                <FAQ />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthContextProvider>
          <SettingsProvider>
            <FarmContextProvider>
              <TourContextProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AnimatedRoutes />
                </BrowserRouter>
              </TourContextProvider>
            </FarmContextProvider>
          </SettingsProvider>
        </AuthContextProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
