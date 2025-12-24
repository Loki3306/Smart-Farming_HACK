import React, { useState } from "react";
import {
  Users,
  MessageCircle,
  ThumbsUp,
  Share2,
  Search,
  Plus,
  TrendingUp,
  Award,
  MapPin,
  Calendar,
  MessageSquare,
  Eye,
  Heart,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface Post {
  id: string;
  author: {
    name: string;
    location: string;
    avatar: string;
    isExpert: boolean;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: Date;
  tags: string[];
}

interface FarmerProfile {
  id: string;
  name: string;
  location: string;
  crops: string[];
  followers: number;
  posts: number;
  avatar: string;
  isVerified: boolean;
}

export const Community: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"feed" | "questions" | "experts">("feed");
  const [searchQuery, setSearchQuery] = useState("");

  const posts: Post[] = [
    {
      id: "1",
      author: {
        name: "Ramesh Patil",
        location: "Nashik, Maharashtra",
        avatar: "👨‍🌾",
        isExpert: false,
      },
      content: "Just harvested my first batch of organic tomatoes this season! Drip irrigation made a huge difference in yield. Thanks to everyone who helped with advice. 🍅",
      image: "🍅",
      likes: 156,
      comments: 23,
      shares: 8,
      timestamp: new Date(Date.now() - 3600000 * 2),
      tags: ["tomatoes", "organic", "harvest"],
    },
    {
      id: "2",
      author: {
        name: "Dr. Suresh Kumar",
        location: "ICAR, Delhi",
        avatar: "👨‍🔬",
        isExpert: true,
      },
      content: "Tip of the day: Apply neem oil spray early morning or evening to prevent aphid infestation. Avoid spraying during peak sun hours as it may cause leaf burn. #PestControl",
      likes: 342,
      comments: 45,
      shares: 89,
      timestamp: new Date(Date.now() - 3600000 * 5),
      tags: ["pest-control", "neem", "tips"],
    },
    {
      id: "3",
      author: {
        name: "Sunita Devi",
        location: "Ludhiana, Punjab",
        avatar: "👩‍🌾",
        isExpert: false,
      },
      content: "Question: My wheat crop leaves are turning yellow. Soil pH is 7.2. What could be the issue? Any suggestions would be helpful. 🌾",
      likes: 45,
      comments: 67,
      shares: 12,
      timestamp: new Date(Date.now() - 3600000 * 8),
      tags: ["wheat", "help", "yellow-leaves"],
    },
  ];

  const experts: FarmerProfile[] = [
    {
      id: "1",
      name: "Dr. Anil Sharma",
      location: "Agricultural University, Pune",
      crops: ["Rice", "Wheat", "Cotton"],
      followers: 15420,
      posts: 234,
      avatar: "👨‍🔬",
      isVerified: true,
    },
    {
      id: "2",
      name: "Kisan Mitra",
      location: "Jaipur, Rajasthan",
      crops: ["Organic Farming", "Permaculture"],
      followers: 8930,
      posts: 156,
      avatar: "🧑‍🌾",
      isVerified: true,
    },
    {
      id: "3",
      name: "Priya Agricultural Services",
      location: "Bangalore, Karnataka",
      crops: ["Horticulture", "Floriculture"],
      followers: 12340,
      posts: 189,
      avatar: "🌸",
      isVerified: true,
    },
  ];

  const trendingTopics = [
    { tag: "#RabiSeason2024", posts: 1234 },
    { tag: "#OrganicFarming", posts: 987 },
    { tag: "#DroughtTips", posts: 756 },
    { tag: "#CropInsurance", posts: 543 },
    { tag: "#SoilHealth", posts: 432 },
  ];

  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4" data-tour-id="community-header">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Farmer Community
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect with fellow farmers, ask questions, share knowledge
          </p>
        </div>
        <Button className="gap-2" data-tour-id="community-create-post">
          <Plus className="w-4 h-4" />
          Create Post
        </Button>
      </div>

      {/* Search */}
      <div className="relative" data-tour-id="community-search">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search posts, topics, farmers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-border" data-tour-id="community-tabs">
            <button
              onClick={() => setActiveTab("feed")}
              className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === "feed"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Feed
            </button>
            <button
              onClick={() => setActiveTab("questions")}
              className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === "questions"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Questions
            </button>
            <button
              onClick={() => setActiveTab("experts")}
              className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === "experts"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Experts
            </button>
          </div>

          {/* Posts */}
          {(activeTab === "feed" || activeTab === "questions") && (
            <div className="space-y-4" data-tour-id="community-posts">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="p-6">
                    {/* Author */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="text-3xl">{post.author.avatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{post.author.name}</span>
                          {post.author.isExpert && (
                            <Award className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {post.author.location}
                          <span>•</span>
                          {formatTimeAgo(post.timestamp)}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-foreground mb-4">{post.content}</p>

                    {/* Image */}
                    {post.image && (
                      <div className="mb-4 text-8xl text-center py-8 bg-muted rounded-lg">
                        {post.image}
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-6 pt-4 border-t">
                      <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <Heart className="w-5 h-5" />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <MessageSquare className="w-5 h-5" />
                        <span>{post.comments}</span>
                      </button>
                      <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <Share2 className="w-5 h-5" />
                        <span>{post.shares}</span>
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Experts */}
          {activeTab === "experts" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {experts.map((expert, index) => (
                <motion.div
                  key={expert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{expert.avatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{expert.name}</span>
                          {expert.isVerified && (
                            <Award className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{expert.location}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {expert.crops.map((crop) => (
                            <span
                              key={crop}
                              className="text-xs px-2 py-0.5 bg-muted rounded-full"
                            >
                              {crop}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span>{expert.followers.toLocaleString()} followers</span>
                          <span>{expert.posts} posts</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      Follow
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending */}
          <Card className="p-6" data-tour-id="community-trending">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              Trending Topics
            </h3>
            <div className="space-y-3">
              {trendingTopics.map((topic, index) => (
                <div
                  key={topic.tag}
                  className="flex items-center justify-between hover:bg-muted p-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div>
                    <span className="text-sm text-muted-foreground">#{index + 1}</span>
                    <span className="ml-2 font-medium text-primary">{topic.tag}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{topic.posts} posts</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Community Stats */}
          <Card className="p-6" data-tour-id="community-stats">
            <h3 className="font-semibold text-foreground mb-4">Community Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Farmers</span>
                <span className="font-semibold">15,420</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Posts Today</span>
                <span className="font-semibold">342</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Questions Answered</span>
                <span className="font-semibold">89%</span>
              </div>
            </div>
          </Card>

          {/* Ask Expert CTA */}
          <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-white">
            <h3 className="font-semibold mb-2">Need Expert Help?</h3>
            <p className="text-sm opacity-90 mb-4">
              Get personalized advice from agricultural experts
            </p>
            <Button variant="secondary" className="w-full">
              Ask an Expert
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
