import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, Heart, Eye, Share2, Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import * as LearnService from "@/services/LearnService";

export const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<LearnService.Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArticle(id);
    }
  }, [id]);

  const fetchArticle = async (articleId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await LearnService.getArticleById(articleId);
      if (response.success) {
        setArticle(response.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load article");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!article) return;
    try {
      await LearnService.likeArticle(article.id);
      setArticle({ ...article, like_count: article.like_count + 1 });
      setLiked(true);
    } catch (err) {
      console.error("Failed to like article:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Article Not Found</h2>
        <p className="text-muted-foreground mb-6">{error || "The article you're looking for doesn't exist."}</p>
        <Button onClick={() => navigate("/learn")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Learn
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 lg:p-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/learn")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Learn
        </Button>

        {/* Article Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                {article.is_featured && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                    Featured
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {article.category}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {article.language}
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                {article.title}
              </h1>

              <p className="text-lg text-muted-foreground mb-6">
                {article.excerpt}
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-6 border-b">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {article.author_name || "Unknown Author"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(article.created_at)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {article.read_time_minutes || 5} min read
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {article.view_count?.toLocaleString() || 0} views
                </div>
              </div>
            </div>

            {/* Article Body */}
            <div className="prose prose-lg max-w-none mb-8">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {article.content}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-6 border-t">
              <Button
                variant={liked ? "default" : "outline"}
                onClick={handleLike}
                disabled={liked}
                className="gap-2"
              >
                <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                {liked ? "Liked" : "Like"} ({article.like_count})
              </Button>
              <Button variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </Card>

          {/* Related Articles Section (Optional - can be implemented later) */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Related Articles</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
