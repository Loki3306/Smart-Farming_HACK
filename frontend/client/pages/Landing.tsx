import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  Droplets,
  Cpu,
  Leaf,
  Shield,
  TrendingUp,
  Gauge,
  Zap,
  CheckCircle2,
  ArrowRight,
  Cloud,
  Thermometer,
  Sprout,
  BarChart3,
  Lock,
  Play,
  Waves,
  FlaskConical,
  CloudRain,
  Hand,
  Eye,
  Brain,
  Settings,
  FileCheck,
  Smartphone,
  Bot,
  BookOpen,
  ClipboardList,
  Store,
  GraduationCap,
  Activity,
  Layers,
  Timer,
  Link2,
  Target,
  Users,
  MapPin,
  IndianRupee,
  Menu,
  X,
  Sun,
  Wheat,
  Tractor,
  TreeDeciduous,
  ChevronUp,
  Mail,
  Phone,
  MapPinned,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ShoppingBag,
  Check,
} from "lucide-react";

// ============================================
// SCROLL-ANIMATED SECTION WRAPPER
// ============================================
const ScrollSection = ({
  children,
  className = "",
  delay = 0,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className={`${className} ${id ? "scroll-mt-24" : ""}`}
    >
      {children}
    </motion.section>
  );
};

// ============================================
// ANIMATED CARD COMPONENT
// ============================================
const AnimatedCard = ({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={
        isInView
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 40, scale: 0.95 }
      }
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ============================================
// FLOATING AGRICULTURE ICONS (Decorative)
// ============================================
const FloatingIcons = () => {
  const icons = [
    { Icon: Leaf, delay: 0, x: "5%", y: "15%" },
    { Icon: Droplets, delay: 0.5, x: "90%", y: "25%" },
    { Icon: Wheat, delay: 1, x: "8%", y: "60%" },
    { Icon: Sun, delay: 1.5, x: "85%", y: "70%" },
    { Icon: Cloud, delay: 2, x: "15%", y: "85%" },
    { Icon: Sprout, delay: 2.5, x: "92%", y: "45%" },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {icons.map(({ Icon, delay, x, y }, index) => (
        <motion.div
          key={index}
          className="absolute text-primary/10"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.5, duration: 0.8 }}
        >
          <motion.div
            animate={{
              y: [0, -15, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4 + index,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Icon className="w-12 h-12 md:w-16 md:h-16" />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
};

// ============================================
// STICKY FARM CYCLE INDICATOR (Fixed on screen)
// ============================================
const StickyFarmCycle = ({ onComplete }: { onComplete: () => void }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const { scrollYProgress } = useScroll();

  // Subscribe to scroll progress changes - complete at ~75% (CTA section)
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      // Map scroll to 0-100%, completing at 75% scroll (when CTA is visible)
      const adjustedPercent = Math.min(100, (v / 0.75) * 100);
      const phase = Math.min(4, Math.floor(adjustedPercent / 20));
      setCurrentPhase(phase);
      setScrollPercent(adjustedPercent);
      
      // Trigger completion at CTA section
      if (adjustedPercent >= 100 && !isCompleted) {
        setIsCompleted(true);
        setShowCompletionAnimation(true);
        onComplete();
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress, isCompleted, onComplete]);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const phases = [
    { icon: Sprout, label: "Sowing", color: "bg-amber-500" },
    { icon: Droplets, label: "Irrigation", color: "bg-blue-500" },
    { icon: FlaskConical, label: "Fertilizing", color: "bg-purple-500" },
    { icon: Sun, label: "Growing", color: "bg-green-500" },
    { icon: Wheat, label: "Harvesting", color: "bg-orange-500" },
  ];

  const handleClick = () => {
    navigate("/signup");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed right-4 top-24 z-40 hidden lg:block cursor-pointer"
          onClick={handleClick}
        >
          <AnimatePresence mode="wait">
            {!showCompletionAnimation ? (
              // Normal progress view
              <motion.div
                key="progress"
                className="bg-card/95 backdrop-blur-lg border border-border rounded-2xl shadow-xl p-3"
                initial={{ scale: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                {/* Circular progress ring with icons */}
                <div className="relative w-14 h-14">
                  {/* Background ring */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="4"
                    />
                    {/* Progress ring */}
                    <motion.circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${scrollPercent * 1.508} 150.8`}
                      style={{ transition: "stroke-dasharray 0.15s ease" }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Current phase icon in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {(() => {
                      const CurrentIcon = phases[currentPhase].icon;
                      return (
                        <motion.div
                          key={currentPhase}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className={`w-8 h-8 rounded-full ${phases[currentPhase].color} flex items-center justify-center`}
                        >
                          <CurrentIcon className="w-4 h-4 text-white" />
                        </motion.div>
                      );
                    })()}
                  </div>
                </div>

                {/* Phase dots */}
                <div className="flex justify-center gap-1 mt-2">
                  {phases.map((phase, index) => (
                    <motion.div
                      key={phase.label}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        currentPhase >= index ? phase.color : "bg-muted"
                      }`}
                      animate={currentPhase === index ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.5, repeat: currentPhase === index ? Infinity : 0 }}
                    />
                  ))}
                </div>

                {/* Current stage name */}
                <motion.p
                  key={phases[currentPhase].label}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] font-medium text-muted-foreground text-center mt-1.5"
                >
                  {phases[currentPhase].label}
                </motion.p>
              </motion.div>
            ) : (
              // Completion celebration view
              <motion.div
                key="completed"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-primary/80 to-emerald-600/80 backdrop-blur-xl rounded-3xl shadow-2xl p-5 text-white border border-white/20"
              >
                {/* Circular completion display */}
                <div className="flex flex-col items-center">
                  {/* All icons in a circle around checkmark */}
                  <div className="relative" style={{ width: 140, height: 140 }}>
                    {/* Outer circle ring for visual guidance */}
                    <div className="absolute inset-3 rounded-full border-2 border-white/30" />
                    
                    {phases.map((phase, index) => {
                      const PhaseIcon = phase.icon;
                      // 5 items, 72 degrees apart, starting from top (-90 degrees)
                      const angleDeg = index * 72 - 90;
                      const angleRad = angleDeg * (Math.PI / 180);
                      const radius = 50; // Distance from center to icon center
                      
                      return (
                        <motion.div
                          key={phase.label}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.1, type: "spring" }}
                          className={`absolute w-9 h-9 rounded-full ${phase.color} flex items-center justify-center shadow-lg border-2 border-white/30`}
                          style={{ 
                            left: "50%",
                            top: "50%",
                            marginLeft: radius * Math.cos(angleRad) - 18,
                            marginTop: radius * Math.sin(angleRad) - 18,
                          }}
                        >
                          <PhaseIcon className="w-4 h-4 text-white" />
                        </motion.div>
                      );
                    })}
                    
                    {/* Center checkmark */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-xl">
                        <Check className="w-8 h-8 text-primary" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Completion progress bar */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="mt-4 h-1.5 w-full bg-white/30 rounded-full overflow-hidden origin-left"
                  >
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      className="h-full w-full bg-white rounded-full origin-left"
                    />
                  </motion.div>

                  {/* Message */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-3 text-center"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/90">
                      Journey Complete
                    </p>
                    <p className="text-[10px] text-white/70 mt-1">
                      Grow Sustainable 🌱
                    </p>
                  </motion.div>

                  {/* Click hint */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="mt-2 flex items-center justify-center gap-1 text-[10px] text-white/60"
                  >
                    <span>Click to start</span>
                    <ArrowRight className="w-3 h-3" />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================
// NAVBAR COMPONENT
// ============================================
const Navbar = ({
  isAuthenticated,
  onLogin,
  onSignup,
  onDashboard,
  onMarketplace,
}: {
  isAuthenticated: boolean;
  onLogin: () => void;
  onSignup: () => void;
  onDashboard: () => void;
  onMarketplace: () => void;
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "#home", requiresAuth: false },
    { label: "How It Works", href: "#how-it-works", requiresAuth: false },
    { label: "Marketplace", href: "/marketplace", requiresAuth: true, isRoute: true },
  ];

  const handleNavClick = (link: typeof navLinks[0]) => {
    if (link.requiresAuth && !isAuthenticated) {
      onLogin();
      return;
    }
    if (link.isRoute) {
      onMarketplace();
    } else {
      const element = document.querySelector(link.href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/90 backdrop-blur-lg border-b border-border shadow-sm py-1"
            : "bg-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className={`flex items-center justify-between transition-all duration-300 ${
            isScrolled ? "h-10 md:h-11" : "h-16 md:h-20"
          }`}>
            {/* Logo */}
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <div className={`rounded-xl bg-primary flex items-center justify-center transition-all duration-300 ${
                isScrolled ? "w-7 h-7 rounded-lg" : "w-10 h-10"
              }`}>
                <Leaf className={`text-primary-foreground transition-all duration-300 ${
                  isScrolled ? "w-4 h-4" : "w-6 h-6"
                }`} />
              </div>
              <span className={`font-bold text-foreground hidden sm:block transition-all duration-300 ${
                isScrolled ? "text-base" : "text-xl"
              }`}>
                Krushi Mitra
              </span>
            </motion.div>

            {/* Desktop Nav Links */}
            <div className={`hidden md:flex items-center transition-all duration-300 ${
              isScrolled ? "gap-6" : "gap-8"
            }`}>
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link)}
                  className={`text-muted-foreground hover:text-foreground transition-all font-medium flex items-center gap-1 ${
                    isScrolled ? "text-xs" : "text-sm"
                  }`}
                >
                  {link.label}
                  {link.requiresAuth && !isAuthenticated && (
                    <Lock className="w-3 h-3 opacity-50" />
                  )}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className={`hidden md:flex items-center transition-all duration-300 ${
              isScrolled ? "gap-2" : "gap-3"
            }`}>
              {isAuthenticated ? (
                <Button onClick={onDashboard} className={`rounded-full transition-all duration-300 ${
                  isScrolled ? "h-7 text-xs px-3" : ""
                }`}>
                  Dashboard
                  <ArrowRight className={`ml-1 transition-all duration-300 ${isScrolled ? "w-3 h-3" : "w-4 h-4"}`} />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={onLogin} className={`rounded-full transition-all duration-300 ${
                    isScrolled ? "h-7 text-xs px-3" : ""
                  }`}>
                    Login
                  </Button>
                  <Button onClick={onSignup} className={`rounded-full transition-all duration-300 ${
                    isScrolled ? "h-7 text-xs px-3" : ""
                  }`}>
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 bg-background/95 backdrop-blur-lg border-b border-border md:hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link)}
                  className="flex items-center gap-2 w-full text-left text-foreground hover:text-primary transition-colors py-2 text-lg"
                >
                  {link.label}
                  {link.requiresAuth && !isAuthenticated && (
                    <Lock className="w-4 h-4 opacity-50" />
                  )}
                </button>
              ))}
              <div className="pt-4 border-t border-border space-y-3">
                {isAuthenticated ? (
                  <Button onClick={onDashboard} className="w-full rounded-full">
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={onLogin} className="w-full rounded-full">
                      Login
                    </Button>
                    <Button onClick={onSignup} className="w-full rounded-full">
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ============================================
// SCROLL TO TOP BUTTON
// ============================================
const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronUp className="w-6 h-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// ============================================
// MAIN LANDING PAGE COMPONENT
// ============================================
export const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, skipLoginAsDemo } = useAuth();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const handleTryDemo = () => {
    skipLoginAsDemo();
    navigate("/dashboard");
  };

  const handleSignup = () => {
    navigate("/signup");
  };

  const handleViewDashboard = () => {
    navigate("/dashboard");
  };

  // ============================================
  // DATA: PROBLEMS
  // ============================================
  const problems = [
    {
      icon: Waves,
      title: "Water Wastage",
      description:
        "Indian farms lose 60% of irrigation water to inefficient practices. Traditional flood irrigation depletes groundwater rapidly.",
      stat: "60%",
      statLabel: "water wasted",
    },
    {
      icon: FlaskConical,
      title: "Fertilizer Misuse",
      description:
        "Overuse of fertilizers damages soil health and increases costs. Farmers apply without soil data, leading to 40% excess usage.",
      stat: "40%",
      statLabel: "excess fertilizer",
    },
    {
      icon: CloudRain,
      title: "Climate Uncertainty",
      description:
        "Unpredictable monsoons and extreme weather events make traditional farming calendars unreliable across Kharif and Rabi seasons.",
      stat: "₹1.5L Cr",
      statLabel: "annual crop loss",
    },
    {
      icon: Hand,
      title: "Manual Decisions",
      description:
        "Farmers rely on intuition rather than data. Without real-time soil and weather insights, irrigation timing is often wrong.",
      stat: "75%",
      statLabel: "suboptimal timing",
    },
  ];

  // ============================================
  // DATA: SOLUTION STEPS
  // ============================================
  const solutionSteps = [
    {
      icon: Eye,
      title: "Sense",
      description:
        "IoT sensors continuously monitor soil moisture, temperature, and humidity across your fields in real-time.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Brain,
      title: "Decide",
      description:
        "AI analyzes sensor data with weather forecasts and crop-specific needs to determine optimal irrigation timing.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Settings,
      title: "Act",
      description:
        "Autonomous irrigation systems activate precisely when needed, delivering exact water amounts to each zone.",
      color: "from-emerald-500 to-green-500",
    },
    {
      icon: FileCheck,
      title: "Verify",
      description:
        "Every action is recorded on blockchain, creating an immutable audit trail for transparency and compliance.",
      color: "from-amber-500 to-orange-500",
    },
  ];

  // ============================================
  // DATA: HOW IT WORKS
  // ============================================
  const systemFlow = [
    {
      icon: Gauge,
      title: "Smart Sensors",
      description:
        "Soil moisture, temperature, and humidity sensors deployed across fields in Nashik, Warangal, and Coimbatore.",
    },
    {
      icon: Cpu,
      title: "AI Decision Engine",
      description:
        "Machine learning models trained on Indian crop patterns—Rice, Cotton, Sugarcane, Soybean, Onion.",
    },
    {
      icon: Zap,
      title: "Autonomous Actions",
      description:
        "Smart valves and pumps respond automatically. Manual override always available via mobile app.",
    },
    {
      icon: Shield,
      title: "Secure Marketplace",
      description:
        "Blockchain-verified transactions for seeds, fertilizers, and equipment purchases.",
    },
  ];

  // ============================================
  // DATA: FEATURES
  // ============================================
  const features = [
    {
      icon: Smartphone,
      title: "Live Monitoring",
      description:
        "Real-time dashboard showing soil moisture (%), temperature (°C), and field health across all zones.",
    },
    {
      icon: Bot,
      title: "Autonomous Mode",
      description:
        "Set it and forget it. System handles irrigation 24/7 based on crop needs and weather conditions.",
    },
    {
      icon: BookOpen,
      title: "Topography Analysis",
      description:
        "We study your land's terrain, soil type, and climate to recommend optimal crop & irrigation strategies.",
    },
    {
      icon: Lock,
      title: "Secure Transactions",
      description:
        "Blockchain-verified marketplace trades. Every purchase transparent and tamper-proof.",
    },
    {
      icon: ClipboardList,
      title: "Farmer Dashboard",
      description:
        "Simple, Hindi-friendly interface. View water usage, cost savings, and yield projections.",
    },
    {
      icon: Store,
      title: "Krushi Marketplace",
      description:
        "Buy seeds, fertilizers, and equipment. Access smart courses to learn modern farming techniques.",
    },
  ];

  // ============================================
  // DATA: SYSTEM CAPABILITIES (What we can do)
  // ============================================
  const capabilities = [
    {
      icon: Activity,
      value: "4",
      label: "Soil Parameters",
      description: "Moisture, temperature, humidity & rainfall monitoring",
    },
    {
      icon: Sprout,
      value: "15+",
      label: "Indian Crops",
      description: "Pre-configured for Rice, Cotton, Sugarcane, Onion & more",
    },
    {
      icon: Timer,
      value: "5 min",
      label: "Data Refresh",
      description: "Real-time sensor readings every 5 minutes",
    },
    {
      icon: Link2,
      value: "100%",
      label: "Secure Trades",
      description: "All marketplace transactions verified on blockchain",
    },
  ];

  // ============================================
  // DATA: TECH SPECS (Real technical facts)
  // ============================================
  const techSpecs = [
    { label: "Sensor Accuracy", value: "±2% moisture precision" },
    { label: "Decision Latency", value: "<30 seconds AI response" },
    { label: "Smart Analysis", value: "Topography-based solutions" },
    { label: "Languages", value: "English & Hindi ready" },
  ];

  // ============================================
  // DATA: VISION GOALS (Honest targets)
  // ============================================
  const visionGoals = [
    {
      icon: Target,
      title: "Targeting 40% Water Reduction",
      description: "Through precision irrigation and AI-driven scheduling",
    },
    {
      icon: Users,
      title: "Built for Smallholder Farmers",
      description: "Affordable, simple, and designed for 1-10 acre farms",
    },
    {
      icon: MapPin,
      title: "Pilot-Ready for Maharashtra",
      description: "Initial deployment planned for Nashik region farms",
    },
    {
      icon: IndianRupee,
      title: "Aiming for ₹25K/acre Savings",
      description: "Combined water, fertilizer & labor cost reduction target",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      {/* Navbar */}
      <Navbar
        isAuthenticated={isAuthenticated}
        onLogin={() => navigate("/login")}
        onSignup={handleSignup}
        onDashboard={handleViewDashboard}
        onMarketplace={() => navigate("/marketplace")}
      />

      {/* Scroll to Top Button */}
      <ScrollToTopButton />

      {/* Sticky Farm Cycle Indicator */}
      <StickyFarmCycle onComplete={() => {}} />

      {/* Floating Agriculture Icons */}
      <FloatingIcons />

      {/* ============================================
          SECTION 1: HERO — "THE VISION"
          ============================================ */}
      <motion.section
        id="home"
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-20 overflow-hidden scroll-mt-20"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-background to-green-50" />

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8"
              >
                <Leaf className="w-4 h-4" />
                <span>Krushi Mitra System for Indian Farmers</span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
              >
                Precision Irrigation for{" "}
                <span className="text-primary">Bharat's Farms</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10"
              >
                AI-powered autonomous irrigation that saves water, reduces costs,
                and increases yields—built specifically for Indian crops, seasons,
                and conditions.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4"
              >
                {isAuthenticated ? (
                  <Button
                    size="lg"
                    onClick={handleViewDashboard}
                    className="rounded-full px-8 py-6 text-lg gap-2"
                  >
                    View Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={handleSignup}
                    className="rounded-full px-8 py-6 text-lg gap-2"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="rounded-full px-8 py-6 text-lg"
                >
                  Login
                </Button>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-muted-foreground text-sm"
              >
                <div className="flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  <span>Weather Integrated</span>
                </div>
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5" />
                  <span>IoT Sensors</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span>Blockchain Verified</span>
                </div>
              </motion.div>
            </div>

            {/* Right side - Demo Video */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative lg:px-8"
            >
              {/* Floating animated icons around video - hidden on mobile */}
              <motion.div
                animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="hidden lg:flex absolute -top-8 -left-4 w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg items-center justify-center z-10"
              >
                <Wheat className="w-7 h-7 text-white" />
              </motion.div>

              <motion.div
                animate={{ y: [0, 12, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                className="hidden lg:flex absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg items-center justify-center z-10"
              >
                <Droplets className="w-6 h-6 text-white" />
              </motion.div>

              <motion.div
                animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="hidden lg:flex absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg items-center justify-center z-10"
              >
                <Tractor className="w-6 h-6 text-white" />
              </motion.div>

              <motion.div
                animate={{ y: [0, 15, 0], rotate: [0, 8, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="hidden lg:flex absolute -bottom-8 -right-4 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg items-center justify-center z-10"
              >
                <TreeDeciduous className="w-7 h-7 text-white" />
              </motion.div>

              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="hidden lg:flex absolute top-1/2 -translate-y-1/2 -left-2 w-11 h-11 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full shadow-lg items-center justify-center z-10"
              >
                <Sun className="w-5 h-5 text-white" />
              </motion.div>

              <motion.div
                animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                className="hidden lg:flex absolute top-1/2 -translate-y-1/2 -right-2 w-11 h-11 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full shadow-lg items-center justify-center z-10"
              >
                <Sprout className="w-5 h-5 text-white" />
              </motion.div>

              {/* Video container with enhanced borders */}
              <div className="relative bg-gradient-to-br from-primary/5 to-emerald-500/5 p-1 rounded-3xl">
                <div className="relative bg-card rounded-3xl overflow-hidden shadow-2xl border-2 border-primary/20 aspect-video">
                  {/* Actual Video */}
                  <video 
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%230f766e'/%3E%3Cstop offset='100%25' stop-color='%2310b981'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='450' fill='url(%23g)'/%3E%3Cg opacity='0.8'%3E%3Ctext x='400' y='200' text-anchor='middle' fill='white' font-size='60' font-weight='bold' font-family='system-ui'%3EKrushi Mitra%3C/text%3E%3Ctext x='400' y='260' text-anchor='middle' fill='white' font-size='24' font-family='system-ui'%3ESmart Farming Demo%3C/text%3E%3Ccircle cx='400' cy='300' r='30' fill='white' opacity='0.9'/%3E%3Cpolygon points='390,285 390,315 415,300' fill='%230f766e'/%3E%3C/g%3E%3C/svg%3E"
                  >
                    <source src="/assets/The_Self-Running_Farm.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Decorative corner elements - inside video */}
                  <div className="absolute top-4 left-4 w-10 h-10 border-l-4 border-t-4 border-white/50 rounded-tl-xl pointer-events-none" />
                  <div className="absolute top-4 right-4 w-10 h-10 border-r-4 border-t-4 border-white/50 rounded-tr-xl pointer-events-none" />
                  <div className="absolute bottom-4 left-4 w-10 h-10 border-l-4 border-b-4 border-white/50 rounded-bl-xl pointer-events-none" />
                  <div className="absolute bottom-4 right-4 w-10 h-10 border-r-4 border-b-4 border-white/50 rounded-br-xl pointer-events-none" />
                </div>
              </div>
            </motion.div>
          </div>

        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2"
          >
            <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ============================================
          SECTION 2: THE PROBLEM (SCROLL-REVEAL)
          ============================================ */}
      <ScrollSection className="py-24 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-primary font-medium text-sm uppercase tracking-wider"
            >
              The Challenge
            </motion.span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-4 mb-6">
              Why Indian Farms Need Smart Irrigation
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Traditional irrigation methods are failing our farmers.
              Here's what's at stake.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {problems.map((problem, index) => (
              <AnimatedCard
                key={problem.title}
                delay={index * 0.1}
                className="group"
              >
                <div className="bg-card border border-border rounded-3xl p-8 h-full hover:shadow-xl transition-all duration-300 hover:border-primary/20">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-destructive/10 text-destructive">
                      <problem.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-foreground">
                          {problem.title}
                        </h3>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-destructive">
                            {problem.stat}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {problem.statLabel}
                          </p>
                        </div>
                      </div>
                      <p className="text-muted-foreground">{problem.description}</p>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* ============================================
          SECTION 3: THE SOLUTION (STICKY SECTION)
          ============================================ */}
      <ScrollSection className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Our Approach
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-4 mb-6">
              Sense → Decide → Act → Verify
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete autonomous loop that transforms how irrigation works.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {solutionSteps.map((step, index) => (
              <AnimatedCard key={step.title} delay={index * 0.15}>
                <div className="relative bg-card border border-border rounded-3xl p-6 h-full text-center hover:shadow-xl transition-all duration-300">
                  {/* Step number */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>

                  <div
                    className={`w-16 h-16 mx-auto mt-4 mb-4 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center`}
                  >
                    <step.icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>

                  {/* Connector arrow (except last) */}
                  {index < solutionSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-muted-foreground/30">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  )}
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* ============================================
          SECTION 4: HOW IT WORKS (SYSTEM FLOW)
          ============================================ */}
      <ScrollSection id="how-it-works" className="py-24 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              System Architecture
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-4 mb-6">
              How the System Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              End-to-end automation from field sensors to secure marketplace.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {systemFlow.map((item, index) => (
              <AnimatedCard key={item.title} delay={index * 0.1}>
                <div className="flex gap-6 p-6 bg-card border border-border rounded-3xl hover:shadow-lg transition-all duration-300">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* ============================================
          SECTION 5: FEATURES (PROGRESSIVE REVEAL)
          ============================================ */}
      <ScrollSection id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Capabilities
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-4 mb-6">
              Built for Indian Agriculture
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Every feature designed with the Indian farmer in mind.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <AnimatedCard key={feature.title} delay={index * 0.1}>
                <div className="bg-card border border-border rounded-3xl p-6 h-full hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* ============================================
          SECTION 6: SYSTEM CAPABILITIES & TECH SPECS
          ============================================ */}
      <ScrollSection className="py-24 px-4 bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="max-w-6xl mx-auto">
          {/* Part 1: System Capabilities */}
          <div className="text-center mb-16">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              System Capabilities
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-4 mb-6">
              What Our System Can Do
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Real technical capabilities built into the platform.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-20">
            {capabilities.map((cap, index) => (
              <AnimatedCard key={cap.label} delay={index * 0.1}>
                <div className="bg-card border border-border rounded-3xl p-6 text-center hover:shadow-xl transition-all duration-300">
                  <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <cap.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-4xl font-bold text-primary mb-1">
                    {cap.value}
                  </div>
                  <div className="text-lg font-semibold text-foreground mb-2">
                    {cap.label}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {cap.description}
                  </p>
                </div>
              </AnimatedCard>
            ))}
          </div>

          {/* Part 2: Tech Specs Bar */}
          <AnimatedCard delay={0.2}>
            <div className="bg-card border border-border rounded-3xl p-8 mb-20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {techSpecs.map((spec, index) => (
                  <div key={spec.label} className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-foreground mb-1">
                      {spec.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {spec.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedCard>

          {/* Part 3: Our Vision */}
          <div id="vision" className="text-center mb-12 scroll-mt-24">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Our Vision
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-4 mb-6">
              What We're Building Towards
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Honest goals we're working to achieve.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {visionGoals.map((goal, index) => (
              <AnimatedCard key={goal.title} delay={index * 0.1}>
                <div className="flex gap-4 p-6 bg-card border border-border rounded-3xl hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <goal.icon className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {goal.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {goal.description}
                    </p>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* ============================================
          SECTION 7: CTA SECTION
          ============================================ */}
      <ScrollSection className="py-24 px-4">
        <div className="max-w-5xl mx-auto lg:mr-[180px]">
          <div className="relative rounded-[2.5rem] overflow-hidden">
            {/* Background with gradient and pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-600 to-green-700" />
            
            {/* Animated decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                className="absolute -top-20 -right-20 w-80 h-80 border border-white/10 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-32 -left-32 w-96 h-96 border border-white/10 rounded-full"
              />
              <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
              
              {/* Floating agriculture icons */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-12 right-20 text-white/10"
              >
                <Wheat className="w-16 h-16" />
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute bottom-16 left-16 text-white/10"
              >
                <Droplets className="w-12 h-12" />
              </motion.div>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity }}
                className="absolute top-1/2 left-8 text-white/10"
              >
                <Leaf className="w-10 h-10" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="relative z-10 px-8 py-16 md:px-16 md:py-20">
              <div className="text-center max-w-2xl mx-auto">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium mb-6"
                >
                  <Sprout className="w-4 h-4" />
                  <span>Start Your Smart Farming Journey</span>
                </motion.div>

                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  Ready to Transform{" "}
                  <span className="text-emerald-200">Your Farm?</span>
                </h2>
                <p className="text-white/80 text-lg md:text-xl mb-10">
                  Join thousands of Indian farmers embracing precision agriculture.
                  Save water, reduce costs, and grow sustainably.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                  {isAuthenticated ? (
                    <Button
                      size="lg"
                      onClick={handleViewDashboard}
                      className="rounded-full px-10 py-7 text-lg gap-2 bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all"
                    >
                      Go to Dashboard
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        onClick={handleSignup}
                        className="rounded-full px-10 py-7 text-lg gap-2 bg-white text-emerald-700 font-semibold hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all border-0"
                      >
                        Get Started Free
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={handleTryDemo}
                        className="rounded-full px-10 py-7 text-lg gap-2 bg-white/20 border-2 border-white text-white font-semibold hover:bg-white hover:text-emerald-700 backdrop-blur-sm transition-all"
                      >
                        <Play className="w-5 h-5" />
                        Watch Demo
                      </Button>
                    </>
                  )}
                </div>

                {/* Trust indicators with better styling */}
                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
                  {[
                    { icon: CheckCircle2, text: "No credit card required" },
                    { icon: Shield, text: "Secure & Private" },
                    { icon: Smartphone, text: "Works on any device" },
                  ].map((item, index) => (
                    <motion.div
                      key={item.text}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2 text-white/70 text-sm"
                    >
                      <item.icon className="w-4 h-4 text-emerald-300" />
                      <span>{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="bg-foreground/[0.03] border-t border-border">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">
                  Krushi Mitra
                </span>
              </div>
              <p className="text-muted-foreground text-sm mb-6">
                Precision irrigation for Bharat's farms. Empowering Indian farmers with AI-driven smart agriculture solutions.
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-3">
                {[
                  { icon: Facebook, href: "#" },
                  { icon: Twitter, href: "#" },
                  { icon: Instagram, href: "#" },
                  { icon: Linkedin, href: "#" },
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
              <ul className="space-y-3">
                {[
                  { label: "Home", href: "#home" },
                  { label: "How It Works", href: "#how-it-works" },
                  { label: "Features", href: "#features" },
                  { label: "Marketplace", href: "/marketplace" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-3">
                {[
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Cookie Policy", href: "/cookies" },
                  { label: "Refund Policy", href: "/refund" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Contact Us</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <MapPinned className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Nashik, Maharashtra, India</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <a href="mailto:hello@krushimitra.in" className="hover:text-primary transition-colors">
                    hello@krushimitra.in
                  </a>
                </li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <a href="tel:+919876543210" className="hover:text-primary transition-colors">
                    +91 98765 43210
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-muted-foreground text-sm text-center md:text-left">
                © {new Date().getFullYear()} Krushi Mitra. All rights reserved. Made with 🇮🇳 in India.
              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
                <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
                <a href="/support" className="hover:text-primary transition-colors">Support</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
