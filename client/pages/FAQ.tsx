import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sprout,
  MessageCircle,
  ArrowRight,
  Info,
  Sparkles,
  BookOpen,
  TrendingUp,
  Users,
  MapPin,
  ShoppingCart,
  Bell,
  Settings,
  PlayCircle,
  Languages,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface FAQItem {
  id: string;
  question: string;
  questionHi: string;
  answer: string;
  answerHi: string;
  category: string;
  icon?: React.ReactNode;
}

export const FAQ: React.FC = () => {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [language, setLanguage] = useState<"en" | "hi">("en");

  const categories = [
    { id: "all", name: language === "hi" ? "सभी सवाल" : "All Questions", icon: <HelpCircle className="w-4 h-4" /> },
    { id: "getting-started", name: language === "hi" ? "शुरुआत" : "Getting Started", icon: <PlayCircle className="w-4 h-4" /> },
    { id: "features", name: language === "hi" ? "फीचर" : "Features", icon: <Sparkles className="w-4 h-4" /> },
    { id: "ai", name: language === "hi" ? "AI और सुझाव" : "AI & Recommendations", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "learning", name: language === "hi" ? "सीखना" : "Learning Hub", icon: <BookOpen className="w-4 h-4" /> },
    { id: "community", name: language === "hi" ? "समुदाय" : "Community", icon: <Users className="w-4 h-4" /> },
    { id: "technical", name: language === "hi" ? "तकनीकी" : "Technical", icon: <Settings className="w-4 h-4" /> },
  ];

  const faqs: FAQItem[] = [
    // Getting Started
    {
      id: "what-is-smart-farming",
      question: "What is Smart Farming Platform?",
      questionHi: "स्मार्ट फार्मिंग प्लेटफॉर्म क्या है?",
      answer: "Smart Farming Platform is an AI-powered agricultural management system designed specifically for Indian farmers. It combines IoT sensors, real-time weather data, machine learning models, and community features to help you make data-driven decisions for better crop yields and sustainable farming practices. Our platform provides personalized recommendations for irrigation, fertilization, pest control, and crop management.",
      answerHi: "स्मार्ट फार्मिंग प्लेटफॉर्म एक AI-संचालित कृषि प्रबंधन प्रणाली है जो विशेष रूप से भारतीय किसानों के लिए डिज़ाइन की गई है। यह IoT सेंसर, रियल-टाइम मौसम डेटा, मशीन लर्निंग मॉडल और सामुदायिक सुविधाओं को जोड़ती है ताकि आप बेहतर फसल उपज और टिकाऊ खेती के लिए डेटा-संचालित निर्णय ले सकें। हमारा प्लेटफॉर्म सिंचाई, उर्वरक, कीट नियंत्रण और फसल प्रबंधन के लिए व्यक्तिगत सिफारिशें प्रदान करता है।",
      category: "getting-started",
      icon: <Sprout className="w-5 h-5 text-emerald-500" />,
    },
    {
      id: "how-to-get-started",
      question: "How do I get started with the platform?",
      questionHi: "मैं प्लेटफॉर्म के साथ कैसे शुरुआत करूं?",
      answer: "Getting started is easy! 1) Sign up with your phone number 2) Complete the farm onboarding by entering your farm details (location, size, soil type, crops) 3) Take the interactive tour guide to learn about all features 4) Connect your IoT sensors (optional) or enter manual readings 5) Start receiving AI-powered recommendations. The platform is available in English, Hindi, and Marathi.",
      answerHi: "शुरुआत करना आसान है! 1) अपने फोन नंबर से साइन अप करें 2) अपने खेत का विवरण (स्थान, आकार, मिट्टी का प्रकार, फसलें) दर्ज करके फार्म ऑनबोर्डिंग पूरा करें 3) सभी फीचर सीखने के लिए इंटरैक्टिव टूर गाइड लें 4) अपने IoT सेंसर कनेक्ट करें (वैकल्पिक) या मैनुअल रीडिंग दर्ज करें 5) AI-संचालित सिफारिशें प्राप्त करना शुरू करें। प्लेटफॉर्म अंग्रेजी, हिंदी और मराठी में उपलब्ध है।",
      category: "getting-started",
    },
    {
      id: "tour-guide",
      question: "How does the Tour Guide work?",
      questionHi: "टूर गाइड कैसे काम करता है?",
      answer: "Our interactive tour guide walks you through every feature of the platform step-by-step. You can choose your preferred language (English or Hindi) when starting the tour. The guide includes voice narration and highlights each section as it explains. You can skip, go back, or restart the tour anytime from the help menu. Each page has its own dedicated tour to help you understand specific features.",
      answerHi: "हमारा इंटरैक्टिव टूर गाइड आपको प्लेटफॉर्म की हर फीचर के माध्यम से स्टेप-बाई-स्टेप मार्गदर्शन करता है। टूर शुरू करते समय आप अपनी पसंदीदा भाषा (अंग्रेजी या हिंदी) चुन सकते हैं। गाइड में वॉयस नैरेशन शामिल है और प्रत्येक सेक्शन को हाइलाइट करता है। आप हेल्प मेनू से कभी भी टूर को स्किप, वापस जा सकते हैं या रीस्टार्ट कर सकते हैं। विशिष्ट फीचर को समझने में मदद के लिए प्रत्येक पेज का अपना समर्पित टूर है।",
      category: "getting-started",
    },
    {
      id: "supported-languages",
      question: "What languages are supported?",
      questionHi: "कौन सी भाषाएं समर्थित हैं?",
      answer: "The platform currently supports English, Hindi, and Marathi. You can change your language preference anytime from the settings. All tours, recommendations, and learning content are available in your selected language. We're working on adding more regional languages based on user demand.",
      answerHi: "प्लेटफॉर्म वर्तमान में अंग्रेजी, हिंदी और मराठी का समर्थन करता है। आप सेटिंग्स से कभी भी अपनी भाषा प्राथमिकता बदल सकते हैं। सभी टूर, सिफारिशें और सीखने की सामग्री आपकी चयनित भाषा में उपलब्ध हैं। हम उपयोगकर्ता की मांग के आधार पर अधिक क्षेत्रीय भाषाएं जोड़ने पर काम कर रहे हैं।",
      category: "getting-started",
    },

    // Features Overview
    {
      id: "main-features",
      question: "What are the main features of the platform?",
      questionHi: "प्लेटफॉर्म की मुख्य विशेषताएं क्या हैं?",
      answer: "Our platform offers: 1) Real-time soil monitoring with IoT sensors 2) Hyperlocal weather forecasts 3) AI-powered recommendations for irrigation, fertilization, and pest control 4) Learning Hub with free courses, articles, and videos 5) Community forum to connect with fellow farmers 6) Marketplace for buying supplies and selling produce 7) Activity tracking on blockchain 8) Multi-language support 9) SMS/call notifications for critical alerts.",
      answerHi: "हमारा प्लेटफॉर्म प्रदान करता है: 1) IoT सेंसर के साथ रियल-टाइम मिट्टी निगरानी 2) हाइपरलोकल मौसम पूर्वानुमान 3) सिंचाई, उर्वरक और कीट नियंत्रण के लिए AI-संचालित सिफारिशें 4) मुफ्त कोर्स, लेख और वीडियो के साथ लर्निंग हब 5) साथी किसानों से जुड़ने के लिए कम्युनिटी फोरम 6) आपूर्ति खरीदने और उत्पाद बेचने के लिए मार्केटप्लेस 7) ब्लॉकचेन पर गतिविधि ट्रैकिंग 8) बहु-भाषा समर्थन 9) महत्वपूर्ण अलर्ट के लिए SMS/कॉल सूचनाएं।",
      category: "features",
      icon: <Sparkles className="w-5 h-5 text-blue-500" />,
    },
    {
      id: "dashboard-features",
      question: "What can I see on my dashboard?",
      questionHi: "मैं अपने डैशबोर्ड पर क्या देख सकता हूं?",
      answer: "Your dashboard provides a real-time overview of your farm: soil moisture levels with visual graphs, current weather conditions, upcoming weather forecasts, control center for manual operations, activity log showing all your actions recorded on blockchain, and quick access to AI recommendations. Everything is designed for quick decision-making.",
      answerHi: "आपका डैशबोर्ड आपके खेत का रियल-टाइम अवलोकन प्रदान करता है: विजुअल ग्राफ के साथ मिट्टी की नमी का स्तर, वर्तमान मौसम की स्थिति, आगामी मौसम पूर्वानुमान, मैनुअल ऑपरेशन के लिए कंट्रोल सेंटर, ब्लॉकचेन पर दर्ज सभी कार्यों को दिखाने वाला एक्टिविटी लॉग, और AI सिफारिशों तक त्वरित पहुंच। सब कुछ त्वरित निर्णय लेने के लिए डिज़ाइन किया गया है।",
      category: "features",
    },
    {
      id: "farm-management",
      question: "How do I manage my farm details?",
      questionHi: "मैं अपने खेत का विवरण कैसे प्रबंधित करूं?",
      answer: "Navigate to the 'My Farm' page where you can view and edit all farm information including farm name, location (state, city), farm size, soil type, irrigation method, and major crops. You'll also see detailed soil analytics with pH levels, NPK values, and overall soil health score. Keep this information updated for more accurate AI recommendations.",
      answerHi: "'मेरा खेत' पेज पर नेविगेट करें जहां आप खेत का नाम, स्थान (राज्य, शहर), खेत का आकार, मिट्टी का प्रकार, सिंचाई विधि और प्रमुख फसलों सहित सभी खेत की जानकारी देख और संपादित कर सकते हैं। आपको pH स्तर, NPK मान और समग्र मिट्टी स्वास्थ्य स्कोर के साथ विस्तृत मिट्टी विश्लेषण भी दिखाई देगा। अधिक सटीक AI सिफारिशों के लिए इस जानकारी को अपडेट रखें।",
      category: "features",
    },
    {
      id: "weather-features",
      question: "What weather information is available?",
      questionHi: "कौन सी मौसम जानकारी उपलब्ध है?",
      answer: "We provide hyperlocal weather data specific to your farm location: current conditions (temperature, humidity, wind speed, UV index, visibility), hourly forecast for the next 24 hours, 7-day outlook with temperature trends and rain probability, and AI-powered farming insights based on weather patterns (best times for irrigation, fertilizer application, and crop protection).",
      answerHi: "हम आपके खेत के स्थान के लिए हाइपरलोकल मौसम डेटा प्रदान करते हैं: वर्तमान स्थितियां (तापमान, आर्द्रता, हवा की गति, UV इंडेक्स, दृश्यता), अगले 24 घंटों के लिए प्रति घंटा पूर्वानुमान, तापमान रुझान और बारिश की संभावना के साथ 7-दिन का दृष्टिकोण, और मौसम पैटर्न के आधार पर AI-संचालित खेती अंतर्दृष्टि (सिंचाई, उर्वरक अनुप्रयोग और फसल सुरक्षा के लिए सर्वोत्तम समय)।",
      category: "features",
    },

    // AI & Recommendations
    {
      id: "ai-recommendations",
      question: "How do AI recommendations work?",
      questionHi: "AI सिफारिशें कैसे काम करती हैं?",
      answer: "Our AI analyzes multiple data points: your soil sensor readings (moisture, temperature, NPK levels), current and forecasted weather conditions, your crop types and growth stages, historical data, and agronomic best practices. It then generates personalized recommendations for irrigation timing and duration, fertilizer types and application rates, pest and disease prevention, and optimal farming activities. All recommendations are tailored specifically for Indian agriculture.",
      answerHi: "हमारा AI कई डेटा पॉइंट्स का विश्लेषण करता है: आपके मिट्टी सेंसर रीडिंग (नमी, तापमान, NPK स्तर), वर्तमान और पूर्वानुमानित मौसम स्थितियां, आपकी फसल प्रकार और वृद्धि चरण, ऐतिहासिक डेटा, और कृषि सर्वोत्तम प्रथाएं। फिर यह सिंचाई समय और अवधि, उर्वरक प्रकार और अनुप्रयोग दरों, कीट और बीमारी रोकथाम, और इष्टतम खेती गतिविधियों के लिए व्यक्तिगत सिफारिशें उत्पन्न करता है। सभी सिफारिशें विशेष रूप से भारतीय कृषि के लिए तैयार की गई हैं।",
      category: "ai",
      icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
    },
    {
      id: "recommendation-accuracy",
      question: "How accurate are the AI recommendations?",
      questionHi: "AI सिफारिशें कितनी सटीक हैं?",
      answer: "Our AI models are trained on verified agricultural datasets specific to Indian farming conditions. The recommendations achieve 95%+ accuracy when sensor data is available. For best results, ensure your farm details are up-to-date, connect IoT sensors for real-time data, follow recommendations consistently, and provide feedback on results. The AI learns and improves over time based on outcomes.",
      answerHi: "हमारे AI मॉडल भारतीय खेती की स्थितियों के लिए विशिष्ट सत्यापित कृषि डेटासेट पर प्रशिक्षित हैं। जब सेंसर डेटा उपलब्ध होता है तो सिफारिशें 95%+ सटीकता प्राप्त करती हैं। सर्वोत्तम परिणामों के लिए, सुनिश्चित करें कि आपके खेत का विवरण अप-टू-डेट है, रियल-टाइम डेटा के लिए IoT सेंसर कनेक्ट करें, सिफारिशों का लगातार पालन करें, और परिणामों पर फीडबैक प्रदान करें। AI परिणामों के आधार पर समय के साथ सीखता है और सुधार होता है।",
      category: "ai",
    },
    {
      id: "manual-vs-sensors",
      question: "Do I need sensors or can I enter data manually?",
      questionHi: "क्या मुझे सेंसर की आवश्यकता है या मैं मैन्युअल रूप से डेटा दर्ज कर सकता हूं?",
      answer: "You can use the platform both ways! With IoT sensors: automatic data collection, real-time monitoring, more accurate AI predictions, and instant alerts. Without sensors: manual data entry (soil conditions, observations), weather-based recommendations, and learning resources still available. We recommend sensors for optimal experience, but the platform is fully functional without them.",
      answerHi: "आप प्लेटफॉर्म दोनों तरीकों से उपयोग कर सकते हैं! IoT सेंसर के साथ: स्वचालित डेटा संग्रह, रियल-टाइम निगरानी, अधिक सटीक AI पूर्वानुमान, और तत्काल अलर्ट। सेंसर के बिना: मैनुअल डेटा प्रविष्टि (मिट्टी की स्थिति, अवलोकन), मौसम-आधारित सिफारिशें, और सीखने के संसाधन अभी भी उपलब्ध हैं। हम इष्टतम अनुभव के लिए सेंसर की सिफारिश करते हैं, लेकिन प्लेटफॉर्म उनके बिना पूरी तरह कार्यात्मक है।",
      category: "ai",
    },

    // Learning Hub
    {
      id: "learning-hub",
      question: "What is the Learning Hub?",
      questionHi: "लर्निंग हब क्या है?",
      answer: "The Learning Hub is your free educational resource center with 50+ courses on topics like crop management, pest control, organic farming, IoT in agriculture, 200+ articles with quick farming tips and seasonal guides, 100+ video tutorials in multiple languages, and content organized by difficulty level (beginner, intermediate, advanced). All content is created by agricultural experts and available in your preferred language.",
      answerHi: "लर्निंग हब आपका मुफ्त शैक्षिक संसाधन केंद्र है जिसमें फसल प्रबंधन, कीट नियंत्रण, जैविक खेती, कृषि में IoT जैसे विषयों पर 50+ पाठ्यक्रम हैं, त्वरित खेती टिप्स और मौसमी मार्गदर्शिकाओं के साथ 200+ लेख, कई भाषाओं में 100+ वीडियो ट्यूटोरियल, और कठिनाई स्तर (शुरुआती, मध्यवर्ती, उन्नत) द्वारा संगठित सामग्री। सभी सामग्री कृषि विशेषज्ञों द्वारा बनाई गई है और आपकी पसंदीदा भाषा में उपलब्ध है।",
      category: "learning",
      icon: <BookOpen className="w-5 h-5 text-orange-500" />,
    },
    {
      id: "courses-certificates",
      question: "Are courses free? Do I get certificates?",
      questionHi: "क्या पाठ्यक्रम मुफ्त हैं? क्या मुझे प्रमाणपत्र मिलेंगे?",
      answer: "Yes! All courses, articles, and videos are completely free for all users. We believe in democratizing agricultural education. Certificates of completion are available for finished courses. You can download and share them. Many courses include quizzes to test your understanding, and you can track your learning progress from your profile.",
      answerHi: "हां! सभी पाठ्यक्रम, लेख और वीडियो सभी उपयोगकर्ताओं के लिए पूरी तरह से मुफ्त हैं। हम कृषि शिक्षा के लोकतंत्रीकरण में विश्वास करते हैं। पूर्ण पाठ्यक्रमों के लिए पूर्णता प्रमाणपत्र उपलब्ध हैं। आप उन्हें डाउनलोड और साझा कर सकते हैं। कई पाठ्यक्रमों में आपकी समझ का परीक्षण करने के लिए प्रश्नोत्तरी शामिल हैं, और आप अपनी प्रोफ़ाइल से अपनी सीखने की प्रगति को ट्रैक कर सकते हैं।",
      category: "learning",
    },

    // Community
    {
      id: "community-features",
      question: "How does the Community feature work?",
      questionHi: "कम्युनिटी फीचर कैसे काम करता है?",
      answer: "Our farmer community connects thousands of farmers across India. You can share your farming experiences and success stories, ask questions and get expert answers (89% response rate), follow verified agricultural specialists, browse by topics using hashtags, like, comment, and share posts, and search for specific farming topics. It's like a social network built specifically for farmers.",
      answerHi: "हमारा किसान समुदाय पूरे भारत में हजारों किसानों को जोड़ता है। आप अपने खेती के अनुभव और सफलता की कहानियां साझा कर सकते हैं, सवाल पूछ सकते हैं और विशेषज्ञ उत्तर प्राप्त कर सकते हैं (89% प्रतिक्रिया दर), सत्यापित कृषि विशेषज्ञों को फॉलो कर सकते हैं, हैशटैग का उपयोग करके विषयों के अनुसार ब्राउज़ कर सकते हैं, पोस्ट को लाइक, कमेंट और शेयर कर सकते हैं, और विशिष्ट खेती विषयों की खोज कर सकते हैं। यह विशेष रूप से किसानों के लिए बनाया गया एक सोशल नेटवर्क की तरह है।",
      category: "community",
      icon: <Users className="w-5 h-5 text-green-500" />,
    },
    {
      id: "verified-experts",
      question: "Who are verified experts in the community?",
      questionHi: "समुदाय में सत्यापित विशेषज्ञ कौन हैं?",
      answer: "Verified experts are agricultural specialists, agronomists, government agricultural officers, experienced farmers with proven track records, and agricultural researchers. They're marked with a special badge and their advice is highlighted. You can follow them to get their latest posts and recommendations in your feed.",
      answerHi: "सत्यापित विशेषज्ञ कृषि विशेषज्ञ, कृषि विज्ञानी, सरकारी कृषि अधिकारी, सिद्ध ट्रैक रिकॉर्ड वाले अनुभवी किसान, और कृषि शोधकर्ता हैं। उन्हें एक विशेष बैज के साथ चिह्नित किया गया है और उनकी सलाह को हाइलाइट किया गया है। आप अपनी फीड में उनकी नवीनतम पोस्ट और सिफारिशें प्राप्त करने के लिए उन्हें फॉलो कर सकते हैं।",
      category: "community",
    },

    // Marketplace
    {
      id: "marketplace",
      question: "What can I buy and sell on the Marketplace?",
      questionHi: "मैं मार्केटप्लेस पर क्या खरीद और बेच सकता हूं?",
      answer: "Buy: Seeds and saplings, fertilizers and pesticides, farming equipment and tools, irrigation supplies, IoT sensors and smart devices. Sell: Your harvested crops, surplus produce, organic products, by-products (like organic compost). All transactions are secure, and you can compare prices from multiple sellers.",
      answerHi: "खरीदें: बीज और पौधे, उर्वरक और कीटनाशक, खेती के उपकरण और औजार, सिंचाई आपूर्ति, IoT सेंसर और स्मार्ट उपकरण। बेचें: आपकी कटी हुई फसलें, अधिशेष उपज, जैविक उत्पाद, उप-उत्पाद (जैसे जैविक खाद)। सभी लेनदेन सुरक्षित हैं, और आप कई विक्रेताओं से कीमतों की तुलना कर सकते हैं।",
      category: "features",
      icon: <ShoppingCart className="w-5 h-5 text-indigo-500" />,
    },

    // Technical - Add questionHi and answerHi as fallback (English text for now)
    {
      id: "blockchain",
      question: "What is blockchain activity tracking?",
      questionHi: "ब्लॉकचेन गतिविधि ट्रैकिंग क्या है?",
      answer: "Every action you take on the platform (irrigation, fertilization, pesticide application, harvesting) is recorded on a blockchain - a secure, tamper-proof digital ledger. This creates a transparent farming history, helps with organic certification, provides traceability for buyers, and enables better farm management analysis. You can view your complete audit trail anytime.",
      answerHi: "प्लेटफॉर्म पर आपकी हर कार्रवाई (सिंचाई, उर्वरक, कीटनाशक अनुप्रयोग, कटाई) एक ब्लॉकचेन पर दर्ज की जाती है - एक सुरक्षित, छेड़छाड़-प्रूफ डिजिटल लेजर। यह एक पारदर्शी खेती इतिहास बनाता है, जैविक प्रमाणन में मदद करता है, खरीदारों के लिए ट्रेसेबिलिटी प्रदान करता है, और बेहतर खेत प्रबंधन विश्लेषण को सक्षम बनाता है। आप कभी भी अपना पूर्ण ऑडिट ट्रेल देख सकते हैं।",
      category: "technical",
      icon: <Info className="w-5 h-5 text-cyan-500" />,
    },
    {
      id: "notifications",
      question: "How do notifications work?",
      questionHi: "सूचनाएं कैसे काम करती हैं?",
      answer: "You'll receive notifications for critical weather alerts (rain, extreme temperatures, storms), time-sensitive farming activities, low soil moisture or nutrient levels, new AI recommendations, community responses to your posts, and marketplace updates. Notifications are available in-app, via SMS, and phone calls for emergencies. You can customize notification preferences in settings.",
      answerHi: "आपको महत्वपूर्ण मौसम अलर्ट (बारिश, चरम तापमान, तूफान), समय-संवेदनशील खेती गतिविधियों, कम मिट्टी की नमी या पोषक तत्व स्तर, नई AI सिफारिशों, आपकी पोस्ट पर समुदाय प्रतिक्रियाओं, और मार्केटप्लेस अपडेट के लिए सूचनाएं मिलेंगी। सूचनाएं ऐप में, SMS के माध्यम से, और आपातकाल के लिए फोन कॉल के माध्यम से उपलब्ध हैं। आप सेटिंग्स में सूचना प्राथमिकताओं को अनुकूलित कर सकते हैं।",
      category: "technical",
    },
    {
      id: "data-privacy",
      question: "Is my farm data secure and private?",
      questionHi: "क्या मेरा खेत डेटा सुरक्षित और निजी है?",
      answer: "Absolutely! Your data security is our top priority. All data is encrypted in transit and at rest, you control what you share publicly vs privately, farm location is never publicly exposed without permission, and we never sell your data to third parties. You can export or delete your data anytime from settings.",
      answerHi: "बिल्कुल! आपका डेटा सुरक्षा हमारी सर्वोच्च प्राथमिकता है। सभी डेटा ट्रांज़िट और स्थिर अवस्था में एन्क्रिप्ट किया गया है, आप नियंत्रित करते हैं कि आप क्या सार्वजनिक बनाम निजी रूप से साझा करते हैं, अनुमति के बिना खेत का स्थान कभी भी सार्वजनिक रूप से उजागर नहीं होता है, और हम कभी भी तीसरे पक्ष को आपका डेटा नहीं बेचते हैं। आप किसी भी समय सेटिंग्स से अपना डेटा निर्यात या हटा सकते हैं।",
      category: "technical",
    },
    {
      id: "offline-access",
      question: "Can I use the platform offline?",
      questionHi: "क्या मैं ऑफ़लाइन प्लेटफॉर्म का उपयोग कर सकता हूं?",
      answer: "Limited offline functionality is available. You can view previously loaded recommendations, access downloaded learning content, and enter manual data that syncs when you're back online. For full features including real-time weather, AI recommendations, and community, an internet connection is required. We're working on expanding offline capabilities.",
      answerHi: "सीमित ऑफ़लाइन कार्यक्षमता उपलब्ध है। आप पहले लोड की गई सिफारिशें देख सकते हैं, डाउनलोड की गई सीखने की सामग्री तक पहुंच सकते हैं, और मैनुअल डेटा दर्ज कर सकते हैं जो ऑनलाइन होने पर सिंक होता है। रियल-टाइम मौसम, AI सिफारिशें और समुदाय सहित पूर्ण सुविधाओं के लिए, इंटरनेट कनेक्शन की आवश्यकता है। हम ऑफ़लाइन क्षमताओं का विस्तार करने पर काम कर रहे हैं।",
      category: "technical",
    },
    {
      id: "mobile-app",
      question: "Is there a mobile app?",
      questionHi: "क्या कोई मोबाइल ऐप है?",
      answer: "Currently, the platform is web-based and fully responsive on mobile browsers. A dedicated mobile app for Android and iOS is in development and coming soon! The web version works seamlessly on smartphones and tablets, so you can access all features on the go.",
      answerHi: "वर्तमान में, प्लेटफॉर्म वेब-आधारित है और मोबाइल ब्राउज़र पर पूरी तरह से उत्तरदायी है। Android और iOS के लिए एक समर्पित मोबाइल ऐप विकास में है और जल्द ही आ रहा है! वेब संस्करण स्मार्टफोन और टैबलेट पर सहजता से काम करता है, इसलिए आप चलते-फिरते सभी सुविधाओं तक पहुंच सकते हैं।",
      category: "technical",
    },
    {
      id: "cost",
      question: "How much does the platform cost?",
      questionHi: "प्लेटफॉर्म की लागत कितनी है?",
      answer: "Basic features including weather forecasts, learning hub, and community access are completely FREE forever. Premium features (IoT sensors, advanced AI models, priority support) have affordable subscription plans starting from ₹99/month. Many government schemes provide subsidies for digital farming tools - check with your local agricultural office.",
      answerHi: "मौसम पूर्वानुमान, लर्निंग हब और समुदाय पहुंच सहित बुनियादी सुविधाएं हमेशा के लिए पूरी तरह से मुफ़्त हैं। प्रीमियम सुविधाओं (IoT सेंसर, उन्नत AI मॉडल, प्राथमिकता समर्थन) में ₹99/माह से शुरू होने वाली किफायती सदस्यता योजनाएं हैं। कई सरकारी योजनाएं डिजिटल खेती उपकरणों के लिए सब्सिडी प्रदान करती हैं - अपने स्थानीय कृषि कार्यालय से जांचें।",
      category: "technical",
    },
  ];

  const filteredFaqs = selectedCategory === "all" 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {language === "hi" ? "सामान्य प्रश्न" : "Common Questions"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === "hi" 
                  ? "हमारे प्लेटफॉर्म के बारे में अक्सर पूछे जाने वाले प्रश्नों के उत्तर खोजें"
                  : "Find answers to frequently asked questions about our platform"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === "hi" ? "en" : "hi")}
            className="flex items-center gap-2"
          >
            <Languages className="w-4 h-4" />
            {language === "hi" ? "English" : "हिंदी"}
          </Button>
        </div>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="gap-2"
              >
                {category.icon}
                {category.name}
              </Button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* FAQ List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-3"
      >
        {filteredFaqs.map((faq, index) => (
          <motion.div
            key={faq.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card
              className={`overflow-hidden transition-all duration-200 ${
                openId === faq.id ? "ring-2 ring-primary" : ""
              }`}
            >
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full p-4 flex items-start gap-3 text-left hover:bg-accent/50 transition-colors"
              >
                {faq.icon && (
                  <div className="flex-shrink-0 mt-1">{faq.icon}</div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">
                    {language === "hi" && faq.questionHi ? faq.questionHi : faq.question}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {categories.find(c => c.id === faq.category)?.name}
                  </Badge>
                </div>
                <div className="flex-shrink-0">
                  {openId === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {openId === faq.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-border"
                >
                  <div className="p-4 bg-accent/20">
                    <p className="text-muted-foreground leading-relaxed">
                      {language === "hi" && faq.answerHi ? faq.answerHi : faq.answer}
                    </p>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Community CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-foreground mb-2">
                {language === "hi" 
                  ? "फसलों या खेती तकनीकों के बारे में सवाल हैं?" 
                  : "Have Questions About Crops or Farming Techniques?"}
              </h3>
              <p className="text-muted-foreground">
                {language === "hi"
                  ? "किसानों के हमारे जीवंत समुदाय में शामिल हों! सवाल पूछें, अनुभव साझा करें, और हजारों साथी किसानों और सत्यापित कृषि विशेषज्ञों से सीखें। अपनी फसल-विशिष्ट प्रश्नों, मौसमी खेती युक्तियों और क्षेत्र-विशिष्ट सलाह के उत्तर प्राप्त करें।"
                  : "Join our vibrant community of farmers! Ask questions, share experiences, and learn from thousands of fellow farmers and verified agricultural experts. Get answers to your crop-specific queries, seasonal farming tips, and region-specific advice."}
              </p>
            </div>
            <Button
              onClick={() => navigate("/community")}
              size="lg"
              className="gap-2 flex-shrink-0"
            >
              <Users className="w-5 h-5" />
              {language === "hi" ? "समुदाय में जाएं" : "Go to Community"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">
            {language === "hi" ? "त्वरित पहुंच" : "Quick Access"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="justify-start gap-3 h-auto py-3"
              onClick={() => navigate("/learn")}
            >
              <BookOpen className="w-5 h-5 text-orange-500" />
              <div className="text-left">
                <div className="font-medium">
                  {language === "hi" ? "लर्निंग हब" : "Learning Hub"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {language === "hi" ? "मुफ्त पाठ्यक्रम और लेख" : "Free courses & articles"}
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-3 h-auto py-3"
              onClick={() => navigate("/recommendations")}
            >
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div className="text-left">
                <div className="font-medium">
                  {language === "hi" ? "AI सिफारिशें" : "AI Recommendations"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {language === "hi" ? "स्मार्ट खेती सलाह प्राप्त करें" : "Get smart farming advice"}
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-3 h-auto py-3"
              onClick={() => navigate("/settings")}
            >
              <Settings className="w-5 h-5 text-gray-500" />
              <div className="text-left">
                <div className="font-medium">
                  {language === "hi" ? "सेटिंग्स" : "Settings"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {language === "hi" ? "अपने अनुभव को अनुकूलित करें" : "Customize your experience"}
                </div>
              </div>
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default FAQ;
