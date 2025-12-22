import React, { useState } from "react";
import {
  GraduationCap,
  Play,
  BookOpen,
  FileText,
  Video,
  Clock,
  Star,
  ChevronRight,
  Search,
  Filter,
  Download,
  ExternalLink,
  Leaf,
  Droplets,
  Bug,
  Sun,
  Tractor,
  Sprout,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  lessons: number;
  rating: number;
  enrolled: number;
  thumbnail: string;
  level: "beginner" | "intermediate" | "advanced";
  language: string;
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  author: string;
  date: Date;
}

interface Video {
  id: string;
  title: string;
  duration: string;
  views: number;
  thumbnail: string;
}

export const Learn: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"courses" | "articles" | "videos">("courses");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "crop-management", name: "Crop Management", icon: Leaf },
    { id: "irrigation", name: "Irrigation", icon: Droplets },
    { id: "pest-control", name: "Pest Control", icon: Bug },
    { id: "soil-health", name: "Soil Health", icon: Sprout },
    { id: "equipment", name: "Equipment", icon: Tractor },
    { id: "weather", name: "Weather & Climate", icon: Sun },
  ];

  const courses: Course[] = [
    {
      id: "1",
      title: "Modern Irrigation Techniques",
      description: "Learn about drip irrigation, sprinkler systems, and water conservation methods for efficient farming.",
      category: "irrigation",
      duration: "4 hours",
      lessons: 12,
      rating: 4.8,
      enrolled: 2340,
      thumbnail: "💧",
      level: "beginner",
      language: "Hindi, English",
    },
    {
      id: "2",
      title: "Organic Pest Management",
      description: "Natural and sustainable methods to protect your crops from pests without harmful chemicals.",
      category: "pest-control",
      duration: "3 hours",
      lessons: 8,
      rating: 4.6,
      enrolled: 1890,
      thumbnail: "🐛",
      level: "intermediate",
      language: "Hindi",
    },
    {
      id: "3",
      title: "Soil Testing & Analysis",
      description: "Understanding soil health, pH levels, nutrient content, and how to improve soil quality.",
      category: "soil-health",
      duration: "2.5 hours",
      lessons: 6,
      rating: 4.7,
      enrolled: 3120,
      thumbnail: "🌱",
      level: "beginner",
      language: "Hindi, Marathi",
    },
    {
      id: "4",
      title: "Smart Farming with IoT",
      description: "Introduction to sensors, automation, and data-driven farming decisions.",
      category: "equipment",
      duration: "5 hours",
      lessons: 15,
      rating: 4.9,
      enrolled: 1560,
      thumbnail: "📡",
      level: "advanced",
      language: "English",
    },
  ];

  const articles: Article[] = [
    {
      id: "1",
      title: "5 Signs Your Crop Needs More Water",
      excerpt: "Learn to identify early warning signs of water stress in your crops before it's too late.",
      category: "irrigation",
      readTime: "5 min",
      author: "Dr. Sharma",
      date: new Date(Date.now() - 86400000 * 2),
    },
    {
      id: "2",
      title: "Best Crops for Rabi Season 2024",
      excerpt: "Expert recommendations on which crops to plant this winter for maximum profit.",
      category: "crop-management",
      readTime: "8 min",
      author: "Kisan Help Desk",
      date: new Date(Date.now() - 86400000 * 5),
    },
    {
      id: "3",
      title: "Government Subsidies for Farmers",
      excerpt: "Complete guide to PM-Kisan, crop insurance, and other schemes available for farmers.",
      category: "general",
      readTime: "10 min",
      author: "Agri Ministry",
      date: new Date(Date.now() - 86400000 * 7),
    },
    {
      id: "4",
      title: "How to Increase Crop Yield by 30%",
      excerpt: "Proven techniques from successful farmers to boost your harvest.",
      category: "crop-management",
      readTime: "7 min",
      author: "Farm Expert",
      date: new Date(Date.now() - 86400000 * 10),
    },
  ];

  const videos = [
    { id: "1", title: "Setting Up Drip Irrigation - Step by Step", duration: "15:30", views: 45000, thumbnail: "💧" },
    { id: "2", title: "Identifying Common Crop Diseases", duration: "12:45", views: 32000, thumbnail: "🔍" },
    { id: "3", title: "Using Soil Testing Kit at Home", duration: "8:20", views: 28000, thumbnail: "🧪" },
    { id: "4", title: "Tractor Maintenance Guide", duration: "20:15", views: 19000, thumbnail: "🚜" },
  ];

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-700";
      case "intermediate":
        return "bg-yellow-100 text-yellow-700";
      case "advanced":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div data-tour-id="learn-header">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-primary" />
          Learning Hub
        </h1>
        <p className="text-muted-foreground mt-1">
          Free courses, articles, and videos to improve your farming skills
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-tour-id="learn-stats">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">50+</p>
          <p className="text-sm text-muted-foreground">Free Courses</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">200+</p>
          <p className="text-sm text-muted-foreground">Articles</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">100+</p>
          <p className="text-sm text-muted-foreground">Video Tutorials</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">10k+</p>
          <p className="text-sm text-muted-foreground">Farmers Learning</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative" data-tour-id="learn-search">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search for courses, articles, videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2" data-tour-id="learn-categories">
        {categories.map((cat) => (
          <Button key={cat.id} variant="outline" size="sm" className="whitespace-nowrap gap-2">
            <cat.icon className="w-4 h-4" />
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border" data-tour-id="learn-tabs">
        <button
          onClick={() => setActiveTab("courses")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === "courses"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <BookOpen className="w-4 h-4 inline-block mr-2" />
          Courses
        </button>
        <button
          onClick={() => setActiveTab("articles")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === "articles"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <FileText className="w-4 h-4 inline-block mr-2" />
          Articles
        </button>
        <button
          onClick={() => setActiveTab("videos")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === "videos"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Video className="w-4 h-4 inline-block mr-2" />
          Videos
        </button>
      </div>

      {/* Content */}
      {activeTab === "courses" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-tour-id="learn-content">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">{course.thumbnail}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelBadge(course.level)}`}>
                          {course.level}
                        </span>
                        <span className="text-xs text-muted-foreground">{course.language}</span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {course.lessons} lessons
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{course.rating}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === "articles" && (
        <div className="space-y-4">
          {articles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">{article.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{article.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{article.author}</span>
                      <span>•</span>
                      <span>{article.readTime} read</span>
                      <span>•</span>
                      <span>{Math.floor((Date.now() - article.date.getTime()) / 86400000)} days ago</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === "videos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 aspect-video flex items-center justify-center">
                  <span className="text-6xl">{video.thumbnail}</span>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-8 h-8 text-primary ml-1" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1">{video.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(video.views / 1000).toFixed(1)}k views
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
