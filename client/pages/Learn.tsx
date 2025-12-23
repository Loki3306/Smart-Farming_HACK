import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Play,
  BookOpen,
  FileText,
  Video,
  Clock,
  Star,
  Search,
  Leaf,
  Droplets,
  Bug,
  Sun,
  Tractor,
  Sprout,
  Loader2,
  AlertCircle,
  Heart,
  Eye,
  Trophy,
  Flame,
  BookMarked,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import * as LearnService from "@/services/LearnService";

export const Learn: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"courses" | "articles" | "videos">("courses");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Courses state
  const [courses, setCourses] = useState<LearnService.Course[]>([]);
  const [coursesPage, setCoursesPage] = useState(1);
  const [coursesHasMore, setCoursesHasMore] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Articles state
  const [articles, setArticles] = useState<LearnService.Article[]>([]);
  const [articlesPage, setArticlesPage] = useState(1);
  const [articlesHasMore, setArticlesHasMore] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(false);

  // Videos state
  const [videos, setVideos] = useState<LearnService.Video[]>([]);
  const [videosPage, setVideosPage] = useState(1);
  const [videosHasMore, setVideosHasMore] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);

  // Stats state
  const [stats, setStats] = useState<LearnService.LearningStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const categories = [
    { id: "crop-management", name: "Crop Management", icon: Leaf },
    { id: "irrigation", name: "Irrigation", icon: Droplets },
    { id: "pest-control", name: "Pest Control", icon: Bug },
    { id: "soil-health", name: "Soil Health", icon: Sprout },
    { id: "equipment", name: "Equipment", icon: Tractor },
    { id: "weather", name: "Weather & Climate", icon: Sun },
  ];

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await LearnService.getLearningStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Fetch courses
  const fetchCourses = useCallback(async (page: number, reset: boolean = false) => {
    if (coursesLoading) return;
    setCoursesLoading(true);
    setError(null);

    try {
      const response = await LearnService.getCourses(page, 20, {
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
      });

      if (response.success) {
        setCourses((prev) => (reset ? response.data : [...prev, ...response.data]));
        setCoursesHasMore(page < response.pagination.total_pages);
        setCoursesPage(page);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load courses");
    } finally {
      setCoursesLoading(false);
    }
  }, [coursesLoading, selectedCategory, searchQuery]);

  // Fetch articles
  const fetchArticles = useCallback(async (page: number, reset: boolean = false) => {
    if (articlesLoading) return;
    setArticlesLoading(true);
    setError(null);

    try {
      const response = await LearnService.getArticles(page, 20, {
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
      });

      if (response.success) {
        setArticles((prev) => (reset ? response.data : [...prev, ...response.data]));
        setArticlesHasMore(page < response.pagination.total_pages);
        setArticlesPage(page);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load articles");
    } finally {
      setArticlesLoading(false);
    }
  }, [articlesLoading, selectedCategory, searchQuery]);

  // Fetch videos
  const fetchVideos = useCallback(async (page: number, reset: boolean = false) => {
    if (videosLoading) return;
    setVideosLoading(true);
    setError(null);

    try {
      const response = await LearnService.getVideos(page, 20, {
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
      });

      if (response.success) {
        setVideos((prev) => (reset ? response.data : [...prev, ...response.data]));
        setVideosHasMore(page < response.pagination.total_pages);
        setVideosPage(page);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load videos");
    } finally {
      setVideosLoading(false);
    }
  }, [videosLoading, selectedCategory, searchQuery]);

  // Initial fetch based on active tab
  useEffect(() => {
    if (activeTab === "courses" && courses.length === 0) {
      fetchCourses(1, true);
    } else if (activeTab === "articles" && articles.length === 0) {
      fetchArticles(1, true);
    } else if (activeTab === "videos" && videos.length === 0) {
      fetchVideos(1, true);
    }
  }, [activeTab]);

  // Re-fetch when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "courses") {
        fetchCourses(1, true);
      } else if (activeTab === "articles") {
        fetchArticles(1, true);
      } else if (activeTab === "videos") {
        fetchVideos(1, true);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  // Infinite scroll observer with debouncing
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    let timeoutId: NodeJS.Timeout;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Debounce to prevent rapid-fire requests
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            if (activeTab === "courses" && coursesHasMore && !coursesLoading) {
              fetchCourses(coursesPage + 1, false);
            } else if (activeTab === "articles" && articlesHasMore && !articlesLoading) {
              fetchArticles(articlesPage + 1, false);
            } else if (activeTab === "videos" && videosHasMore && !videosLoading) {
              fetchVideos(videosPage + 1, false);
            }
          }, 500); // Wait 500ms before triggering next page load
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [activeTab, coursesHasMore, articlesHasMore, videosHasMore, coursesPage, articlesPage, videosPage, coursesLoading, articlesLoading, videosLoading]);

  // Like handlers
  const handleLikeArticle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await LearnService.likeArticle(id);
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, like_count: a.like_count + 1 } : a))
      );
    } catch (err) {
      console.error("Failed to like article:", err);
    }
  };

  const handleLikeVideo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await LearnService.likeVideo(id);
      setVideos((prev) =>
        prev.map((v) => (v.id === id ? { ...v, like_count: v.like_count + 1 } : v))
      );
    } catch (err) {
      console.error("Failed to like video:", err);
    }
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const isLoading = 
    (activeTab === "courses" && coursesLoading) ||
    (activeTab === "articles" && articlesLoading) ||
    (activeTab === "videos" && videosLoading);

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
          <div className="flex items-center justify-center mb-2">
            <BookMarked className="w-5 h-5 text-primary" />
          </div>
          {statsLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            <>
              <p className="text-3xl font-bold text-primary">{stats?.totalCoursesEnrolled || 0}</p>
              <p className="text-sm text-muted-foreground">Courses Enrolled</p>
            </>
          )}
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          {statsLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            <>
              <p className="text-3xl font-bold text-primary">{stats?.totalCoursesCompleted || 0}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </>
          )}
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          {statsLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            <>
              <p className="text-3xl font-bold text-primary">{stats?.totalLearningHours || 0}h</p>
              <p className="text-sm text-muted-foreground">Learning Hours</p>
            </>
          )}
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          {statsLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            <>
              <p className="text-3xl font-bold text-primary">{stats?.currentStreak || 0}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </>
          )}
        </Card>
      </div>

      {/* Search */}
      <div className="relative" data-tour-id="learn-search">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder={`Search for ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-12 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2" data-tour-id="learn-categories">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          className="whitespace-nowrap"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            size="sm"
            className="whitespace-nowrap gap-2"
            onClick={() => setSelectedCategory(cat.id)}
          >
            <cat.icon className="w-4 h-4" />
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border" data-tour-id="learn-tabs">
        <button
          onClick={() => setActiveTab("courses")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "courses"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="w-4 h-4 inline-block mr-2" />
          Courses
        </button>
        <button
          onClick={() => setActiveTab("articles")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "articles"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-4 h-4 inline-block mr-2" />
          Articles
        </button>
        <button
          onClick={() => setActiveTab("videos")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "videos"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Video className="w-4 h-4 inline-block mr-2" />
          Videos
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null);
              if (activeTab === "courses") fetchCourses(1, true);
              else if (activeTab === "articles") fetchArticles(1, true);
              else fetchVideos(1, true);
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Content */}
      {activeTab === "courses" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-tour-id="learn-content">
          {courses.length === 0 && !coursesLoading && (
            <div className="col-span-2 text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No courses found</p>
            </div>
          )}
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/learn/courses/${course.id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">{course.thumbnail_emoji || "📚"}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelBadge(course.level)}`}>
                          {course.level}
                        </span>
                        <span className="text-xs text-muted-foreground">{course.language}</span>
                        {course.price === 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            Free
                          </span>
                        )}
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
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {course.enrolled_count.toLocaleString()} enrolled
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{course.rating}</span>
                      </div>
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
          {articles.length === 0 && !articlesLoading && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No articles found</p>
            </div>
          )}
          {articles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card 
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/learn/articles/${article.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {article.is_featured && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                          Featured
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {article.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{article.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{article.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{article.author_name || "Unknown"}</span>
                      <span>•</span>
                      <span>{article.read_time_minutes || 5} min read</span>
                      <span>•</span>
                      <span>{formatDate(article.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 ml-4">
                    <button
                      onClick={(e) => handleLikeArticle(article.id, e)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Heart className="w-5 h-5 text-muted-foreground hover:text-red-500" />
                    </button>
                    <span className="text-xs text-muted-foreground">{article.like_count}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === "videos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videos.length === 0 && !videosLoading && (
            <div className="col-span-2 text-center py-12">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No videos found</p>
            </div>
          )}
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => video.video_url && window.open(video.video_url, '_blank')}
              >
                <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 aspect-video flex items-center justify-center">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl">{video.thumbnail_emoji || "🎬"}</span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-8 h-8 text-primary ml-1" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {video.duration_seconds
                      ? LearnService.formatDuration(video.duration_seconds)
                      : "0:00"}
                  </span>
                  {video.is_featured && (
                    <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                      Featured
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{video.title}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {video.view_count.toLocaleString()} views
                    </p>
                    <button
                      onClick={(e) => handleLikeVideo(video.id, e)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      {video.like_count}
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Load More Trigger (Infinite Scroll) */}
      <div ref={loadMoreRef} className="h-4" />

      {/* End of Content Message */}
      {((activeTab === "courses" && !coursesHasMore && courses.length > 0) ||
        (activeTab === "articles" && !articlesHasMore && articles.length > 0) ||
        (activeTab === "videos" && !videosHasMore && videos.length > 0)) && (
        <p className="text-center text-muted-foreground py-4">
          You've reached the end! 🎉
        </p>
      )}
    </div>
  );
};
