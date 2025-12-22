/**
 * Tour Configuration
 * Central configuration for all onboarding tours in the application
 */

import { TourStep } from '../context/TourContext';

// i18n-ready content structure
export const tourContent = {
    en: {
        welcome: {
            title: "Welcome to SmartFarm! 🌾",
            content: "I'm your farming assistant, and I'll guide you through the key features of your smart agriculture dashboard."
        },
        dashboard: {
            title: "Your Dashboard",
            content: "This is your command center. Here you can monitor everything happening on your farm in real-time."
        },
        soilMoisture: {
            title: "Soil Moisture Monitor",
            content: "This shows your current soil moisture levels. The AI analyzes this data to optimize your irrigation schedule automatically."
        },
        weatherCard: {
            title: "Weather Insights",
            content: "Stay ahead of the weather! This card shows forecasts and helps you plan your farming activities accordingly."
        },
        controlCenter: {
            title: "Control Center",
            content: "Take control! From here you can manually trigger irrigation, adjust settings, and manage your farm operations."
        },
        actionLog: {
            title: "Activity Log",
            content: "Every action is recorded on the blockchain for transparency. View your complete farming history here."
        },
        sidebar: {
            title: "Navigation",
            content: "Use this sidebar to explore different sections: your farm details, weather, AI recommendations, marketplace, and more!"
        },
        complete: {
            title: "You're All Set! 🎉",
            content: "You've completed the tour! Feel free to explore and start optimizing your farm. I'm always here if you need help."
        },
        // Farm Tour Content
        farmWelcome: {
            title: "Welcome to My Farm! 🚜",
            content: "This is your farm management hub. Here you can view and edit all your farm details, track soil health, and manage your agricultural data."
        },
        farmOverview: {
            title: "Farm Overview",
            content: "This card shows your farm's basic information including name and location. Click 'Edit Details' to update your farm information anytime."
        },
        farmLocation: {
            title: "Location Details",
            content: "Your farm's geographic information helps us provide accurate weather forecasts and region-specific recommendations for your crops."
        },
        farmSpecs: {
            title: "Farm Specifications",
            content: "Track your farm's size, soil type, and current crop. This data helps our AI make better irrigation and fertilization recommendations."
        },
        farmIrrigation: {
            title: "Irrigation Setup",
            content: "Configure your water source, irrigation type, and growing season. This ensures optimal water management for your specific setup."
        },
        farmSoilAnalytics: {
            title: "Soil Analytics Dashboard",
            content: "Real-time soil data from your sensors! Monitor moisture, temperature, pH levels, and NPK nutrients to keep your soil in perfect condition."
        },
        farmSoilHealth: {
            title: "Soil Health Score",
            content: "Your overall soil health indicator. This score is calculated from all your sensor readings and helps you understand your soil's condition at a glance."
        },
        farmComplete: {
            title: "Farm Tour Complete! 🌱",
            content: "You now know how to manage your farm details. Keep your information updated for the best AI-powered recommendations!"
        },
        // Weather Tour Content
        weatherWelcome: {
            title: "Weather Forecast ☀️",
            content: "Stay ahead of the weather! This page shows real-time weather data specifically for your farm location to help you plan your farming activities."
        },
        weatherCurrent: {
            title: "Current Conditions",
            content: "Live weather data including temperature, humidity, wind speed, UV index, and visibility. Perfect for making immediate farming decisions."
        },
        weatherHourly: {
            title: "Hourly Forecast",
            content: "See how the weather will change throughout the day. Great for planning time-sensitive activities like spraying or harvesting."
        },
        weather7Day: {
            title: "7-Day Outlook",
            content: "Plan your week with confidence! See upcoming temperature highs and lows, conditions, and rain probability for the next 7 days."
        },
        weatherInsights: {
            title: "Farming Insights 🌾",
            content: "AI-powered recommendations based on weather patterns. Get actionable advice on irrigation, fertilizer application, and crop protection."
        },
        weatherComplete: {
            title: "Weather Tour Complete! 🌤️",
            content: "You're now ready to use weather data to optimize your farming decisions. Check back daily for updated forecasts!"
        },
        // Recommendations Tour Content
        recoWelcome: {
            title: "AI Recommendations 🤖",
            content: "Your personal AI farming assistant! Get smart, data-driven recommendations to optimize irrigation, fertilization, and pest control."
        },
        recoAnalyze: {
            title: "Run AI Analysis",
            content: "Click this button to trigger a new analysis. The AI evaluates your soil data, weather conditions, and crop status to generate fresh recommendations."
        },
        recoStats: {
            title: "Quick Stats",
            content: "Track your recommendation status at a glance. See pending actions, applied suggestions, and the average confidence level of AI predictions."
        },
        recoIntegration: {
            title: "ML Model Integration",
            content: "This section shows API endpoints for integrating your custom machine learning models. Connect your trained models for personalized predictions."
        },
        recoList: {
            title: "Active Recommendations",
            content: "Your actionable insights! Each card shows the recommendation type, priority, suggested action, and AI confidence score. Mark them as applied when done."
        },
        recoComplete: {
            title: "Recommendations Tour Complete! 🎯",
            content: "You're ready to leverage AI for smarter farming decisions. Run regular analyses and apply recommendations for optimal results!"
        },
        // Marketplace Tour Content
        marketWelcome: {
            title: "Farmer's Marketplace 🛒",
            content: "Your one-stop shop for agricultural supplies and a platform to sell your produce directly to other farmers!"
        },
        marketTabs: {
            title: "Buy or Sell",
            content: "Switch between buyer and seller mode. Buy high-quality seeds, fertilizers, and equipment, or sell your farm's produce."
        },
        marketSearch: {
            title: "Search Products",
            content: "Find exactly what you need. Search for seeds, fertilizers, pesticides, equipment, or fresh produce from verified sellers."
        },
        marketCategories: {
            title: "Browse Categories",
            content: "Filter products by category to quickly find what you're looking for. From seeds to irrigation equipment, it's all here."
        },
        marketProducts: {
            title: "Product Listings",
            content: "Browse verified products with ratings, reviews, and location info. Look for the 'Organic' badge and check seller ratings before buying."
        },
        marketSellListings: {
            title: "Your Listings",
            content: "Manage your sell listings here. Add new products, edit prices, and track your active listings all in one place."
        },
        marketComplete: {
            title: "Marketplace Tour Complete! 🎉",
            content: "You're ready to trade! Buy quality supplies at competitive prices and sell your produce to a wider market."
        },
        // Learn Tour Content
        learnWelcome: {
            title: "Learning Hub 📚",
            content: "Your free educational resource! Access courses, articles, and videos to improve your farming knowledge and skills."
        },
        learnStats: {
            title: "Learning Resources",
            content: "We offer over 50 free courses, 200+ articles, and 100+ video tutorials. Join 10,000+ farmers who are learning and growing!"
        },
        learnSearch: {
            title: "Find What You Need",
            content: "Search for specific topics like irrigation, pest control, soil health, or any farming technique you want to learn about."
        },
        learnCategories: {
            title: "Browse by Topic",
            content: "Filter content by category. From crop management to IoT equipment, find resources tailored to your interests."
        },
        learnTabs: {
            title: "Content Types",
            content: "Switch between Courses (structured lessons), Articles (quick reads), and Videos (visual guides) based on how you prefer to learn."
        },
        learnContent: {
            title: "Course Library",
            content: "Browse our courses with ratings, duration, and difficulty levels. Many are available in Hindi, Marathi, and English!"
        },
        learnComplete: {
            title: "Learning Tour Complete! 🎓",
            content: "Start your learning journey today! Whether 5 minutes or 5 hours, there's something for every farmer here."
        },
        // Community Tour Content
        communityWelcome: {
            title: "Farmer Community 👥",
            content: "Connect with thousands of farmers across the country! Share experiences, ask questions, and learn from experts."
        },
        communityCreatePost: {
            title: "Share Your Story",
            content: "Click here to create a new post. Share your farming success, ask for help, or give tips to fellow farmers."
        },
        communitySearch: {
            title: "Find Discussions",
            content: "Search for specific topics, farmers, or hashtags. Find answers to questions others have already asked."
        },
        communityTabs: {
            title: "Browse Content",
            content: "Switch between Feed (all posts), Questions (get help), and Experts (follow verified agricultural specialists)."
        },
        communityPosts: {
            title: "Community Feed",
            content: "See what farmers are sharing! Like, comment, and share posts. Look for the award icon to spot verified experts."
        },
        communityTrending: {
            title: "Trending Topics",
            content: "See what's popular right now. Click on hashtags to explore discussions on specific topics like #OrganicFarming."
        },
        communityStats: {
            title: "Community Activity",
            content: "Our community is active and helpful! Over 89% of questions get answered. Join the conversation!"
        },
        communityComplete: {
            title: "Community Tour Complete! 🤝",
            content: "You're now part of our farming family! Start by creating your first post or asking a question."
        },
        // Notifications Tour Content
        notifWelcome: {
            title: "Notifications Center 🔔",
            content: "Stay on top of everything! Get real-time alerts about weather changes, soil conditions, pest risks, and system updates."
        },
        notifActions: {
            title: "Quick Actions",
            content: "Mark all notifications as read or clear them all at once. Keep your inbox organized!"
        },
        notifFilters: {
            title: "Filter Notifications",
            content: "Toggle between viewing all notifications or just unread ones. Stay focused on what needs attention."
        },
        notifList: {
            title: "Your Alerts",
            content: "Each notification shows type (color-coded), priority indicator, time, and message. Click to mark as read or delete."
        },
        notifSettings: {
            title: "Notification Preferences",
            content: "Customize which alerts you receive. Configure notifications for weather, irrigation, pests, and more."
        },
        notifComplete: {
            title: "Notifications Tour Complete! ✅",
            content: "You'll never miss an important alert! Check here regularly for updates about your farm."
        }
    },
    hi: {
        welcome: {
            title: "स्मार्टफार्म में आपका स्वागत है! 🌾",
            content: "नमस्ते! मैं आपका खेती सहायक हूं। आइए मैं आपको इस डैशबोर्ड की सभी सुविधाओं के बारे में बताता हूं।"
        },
        dashboard: {
            title: "आपका होम पेज",
            content: "यह आपका मुख्य पेज है। यहां आप अपने खेत की सारी जानकारी एक नज़र में देख सकते हैं।"
        },
        soilMoisture: {
            title: "मिट्टी में नमी",
            content: "यहां आपकी मिट्टी में कितना पानी है वो दिखता है। AI इसको देखकर आपको पानी देने का सही समय बताएगा।"
        },
        weatherCard: {
            title: "मौसम का हाल",
            content: "यहां आज और आने वाले दिनों का मौसम दिखता है। इससे आप खेती का काम प्लान कर सकते हैं।"
        },
        controlCenter: {
            title: "कंट्रोल सेंटर",
            content: "यहां से आप पानी की मोटर चालू कर सकते हैं और खेत की सेटिंग्स बदल सकते हैं।"
        },
        actionLog: {
            title: "गतिविधि रिकॉर्ड",
            content: "आपके खेत में जो भी काम होता है उसका पूरा रिकॉर्ड यहां सुरक्षित रहता है।"
        },
        sidebar: {
            title: "मेन्यू",
            content: "इस मेन्यू से आप अलग-अलग पेज पर जा सकते हैं - खेत, मौसम, सुझाव, बाज़ार, और बहुत कुछ!"
        },
        complete: {
            title: "बधाई हो! 🎉",
            content: "आपने टूर पूरा कर लिया! अब आप आराम से अपना खेत मैनेज कर सकते हैं। मदद चाहिए तो मैं हमेशा यहां हूं।"
        },
        // Farm Tour
        farmWelcome: {
            title: "मेरा खेत 🚜",
            content: "यहां आपके खेत की पूरी जानकारी है। खेत का नाम, साइज़, मिट्टी का प्रकार - सब कुछ!"
        },
        farmOverview: {
            title: "खेत की जानकारी",
            content: "यहां आपके खेत का नाम और लोकेशन दिखता है। 'Edit Details' पर क्लिक करके बदल सकते हैं।"
        },
        farmLocation: {
            title: "खेत का पता",
            content: "आपके खेत की लोकेशन से हम सही मौसम और आपके इलाके के हिसाब से सलाह दे पाते हैं।"
        },
        farmSpecs: {
            title: "खेत का साइज़ और फसल",
            content: "खेत कितना बड़ा है, मिट्टी कैसी है, कौन सी फसल लगी है - ये सब AI को बेहतर सुझाव देने में मदद करता है।"
        },
        farmIrrigation: {
            title: "पानी की व्यवस्था",
            content: "पानी कहां से आता है और सिंचाई कैसे होती है - ये जानकारी सही पानी प्रबंधन के लिए ज़रूरी है।"
        },
        farmSoilAnalytics: {
            title: "मिट्टी की रिपोर्ट",
            content: "सेंसर से मिला डेटा! मिट्टी में नमी, तापमान, pH, और NPK की ताज़ा जानकारी।"
        },
        farmSoilHealth: {
            title: "मिट्टी की सेहत",
            content: "आपकी मिट्टी कितनी स्वस्थ है, एक नंबर में। ये स्कोर सभी सेंसर रीडिंग से बनता है।"
        },
        farmComplete: {
            title: "खेत का टूर पूरा! 🌱",
            content: "अब आप जानते हैं कि अपने खेत की जानकारी कैसे देखें और अपडेट करें!"
        },
        // Weather Tour
        weatherWelcome: {
            title: "मौसम ☀️",
            content: "यहां आपके खेत के लिए मौसम की पूरी जानकारी मिलती है। खेती का काम प्लान करने में बहुत काम आएगी!"
        },
        weatherCurrent: {
            title: "अभी का मौसम",
            content: "तापमान, हवा में नमी, हवा की रफ़्तार - सब लाइव दिखता है। आज के काम के फैसले लेने में मदद मिलेगी।"
        },
        weatherHourly: {
            title: "घंटे के हिसाब से",
            content: "दिन भर मौसम कैसे बदलेगा देखें। स्प्रे करना हो या कटाई - सही टाइम चुनें।"
        },
        weather7Day: {
            title: "7 दिन का मौसम",
            content: "आने वाले हफ्ते का मौसम। बारिश कब होगी, गर्मी कितनी होगी - सब पता चलेगा।"
        },
        weatherInsights: {
            title: "खेती के सुझाव 🌾",
            content: "मौसम के हिसाब से AI आपको बताएगा - कब पानी दें, कब खाद डालें, कब स्प्रे करें।"
        },
        weatherComplete: {
            title: "मौसम टूर पूरा! 🌤️",
            content: "अब आप मौसम की जानकारी का सही इस्तेमाल कर सकते हैं। रोज़ चेक करें!"
        },
        // Recommendations Tour
        recoWelcome: {
            title: "AI सुझाव 🤖",
            content: "आपका निजी AI सहायक! मिट्टी और मौसम के डेटा से स्मार्ट सलाह मिलेगी।"
        },
        recoAnalyze: {
            title: "विश्लेषण करें",
            content: "इस बटन पर क्लिक करें। AI आपके सेंसर डेटा को देखकर ताज़ा सुझाव देगा।"
        },
        recoStats: {
            title: "संक्षिप्त जानकारी",
            content: "कितने सुझाव लागू किए, कितने बाकी हैं - एक नज़र में देखें।"
        },
        recoIntegration: {
            title: "ML मॉडल",
            content: "यहां से आप अपने खुद के AI मॉडल भी जोड़ सकते हैं।"
        },
        recoList: {
            title: "सुझावों की लिस्ट",
            content: "हर सुझाव में लिखा है क्या करना है और AI को कितना भरोसा है। काम हो जाए तो 'Applied' लगाएं।"
        },
        recoComplete: {
            title: "सुझाव टूर पूरा! 🎯",
            content: "अब AI की मदद से स्मार्ट फैसले लें। हफ्ते में 2-3 बार ज़रूर चेक करें!"
        },
        // Marketplace Tour
        marketWelcome: {
            title: "किसान बाज़ार 🛒",
            content: "यहां खेती का सामान खरीदें या अपनी फसल बेचें - सीधे दूसरे किसानों से!"
        },
        marketTabs: {
            title: "खरीदें या बेचें",
            content: "Buy टैब से सामान खरीदें, Sell टैब से अपनी फसल बेचने की लिस्टिंग करें।"
        },
        marketSearch: {
            title: "खोजें",
            content: "बीज, खाद, दवाई, मशीन - जो चाहिए उसका नाम लिखकर खोजें।"
        },
        marketCategories: {
            title: "कैटेगरी",
            content: "कैटेगरी से फ़िल्टर करें - बीज, खाद, कीटनाशक, उपकरण, और भी बहुत कुछ।"
        },
        marketProducts: {
            title: "प्रोडक्ट लिस्ट",
            content: "सभी प्रोडक्ट की रेटिंग और रिव्यू देखें। 'Organic' बैज और सेलर की रेटिंग ज़रूर चेक करें।"
        },
        marketSellListings: {
            title: "आपकी लिस्टिंग",
            content: "जो आप बेच रहे हैं वो यहां दिखेगा। नया प्रोडक्ट जोड़ें या पुराने में बदलाव करें।"
        },
        marketComplete: {
            title: "बाज़ार टूर पूरा! 🎉",
            content: "अब आप सीधे खरीद-बिक्री कर सकते हैं। अच्छा सामान सही दाम पर मिलेगा!"
        },
        // Learn Tour
        learnWelcome: {
            title: "सीखने का केंद्र 📚",
            content: "मुफ़्त में खेती सीखें! कोर्स, आर्टिकल, और वीडियो - सब कुछ यहां है।"
        },
        learnStats: {
            title: "सीखने के साधन",
            content: "50+ कोर्स, 200+ आर्टिकल, और 100+ वीडियो। 10,000+ किसान पहले से सीख रहे हैं!"
        },
        learnSearch: {
            title: "खोजें",
            content: "जो सीखना है वो लिखें - पानी देना, कीट नियंत्रण, मिट्टी की सेहत, कुछ भी।"
        },
        learnCategories: {
            title: "विषय चुनें",
            content: "कैटेगरी से फ़िल्टर करें। फसल प्रबंधन से लेकर IoT उपकरण तक - सब मिलेगा।"
        },
        learnTabs: {
            title: "कंटेंट के प्रकार",
            content: "Courses (कोर्स), Articles (लेख), या Videos (वीडियो) - जैसे सीखना पसंद हो वैसे सीखें।"
        },
        learnContent: {
            title: "कोर्स लाइब्रेरी",
            content: "रेटिंग, समय, और कठिनाई देखें। हिंदी, मराठी, और English में उपलब्ध!"
        },
        learnComplete: {
            title: "सीखना टूर पूरा! 🎓",
            content: "आज से सीखना शुरू करें! 5 मिनट हो या 5 घंटे - हर किसान के लिए कुछ न कुछ है।"
        },
        // Community Tour
        communityWelcome: {
            title: "किसान समुदाय 👥",
            content: "पूरे देश के किसानों से जुड़ें! अनुभव बांटें, सवाल पूछें, और एक्सपर्ट्स से सीखें।"
        },
        communityCreatePost: {
            title: "पोस्ट करें",
            content: "अपनी बात शेयर करें। खेती की सफलता, समस्या, या टिप्स - जो मन हो लिखें।"
        },
        communitySearch: {
            title: "खोजें",
            content: "कोई खास टॉपिक या किसान खोजें। दूसरों के सवाल-जवाब भी देखें।"
        },
        communityTabs: {
            title: "देखें",
            content: "Feed (सभी पोस्ट), Questions (सहायता लें), Experts (विशेषज्ञों को फॉलो करें)।"
        },
        communityPosts: {
            title: "पोस्ट देखें",
            content: "किसान क्या शेयर कर रहे हैं देखें। Like करें, comment करें, शेयर करें।"
        },
        communityTrending: {
            title: "ट्रेंडिंग टॉपिक",
            content: "अभी क्या चल रहा है देखें। #JaivikKheti जैसे हैशटैग पर क्लिक करके और देखें।"
        },
        communityStats: {
            title: "समुदाय की गतिविधि",
            content: "89% सवालों का जवाब मिलता है! बातचीत में शामिल हों।"
        },
        communityComplete: {
            title: "समुदाय टूर पूरा! 🤝",
            content: "अब आप हमारे किसान परिवार का हिस्सा हैं! पहला पोस्ट या सवाल डालकर शुरुआत करें।"
        },
        // Notifications Tour
        notifWelcome: {
            title: "सूचनाएं 🔔",
            content: "सभी अलर्ट यहां मिलेंगे! मौसम में बदलाव, मिट्टी की स्थिति, कीट का खतरा - सब कुछ।"
        },
        notifActions: {
            title: "जल्दी के बटन",
            content: "सभी पढ़ी हुई मार्क करें या सब साफ़ करें। इनबॉक्स साफ रखें।"
        },
        notifFilters: {
            title: "फ़िल्टर करें",
            content: "सभी या सिर्फ़ अनपढ़ी सूचनाएं देखें। जो ज़रूरी है उस पर ध्यान दें।"
        },
        notifList: {
            title: "आपकी सूचनाएं",
            content: "हर सूचना में प्रकार, समय, और संदेश दिखता है। क्लिक करके पढ़ी मार्क करें या डिलीट करें।"
        },
        notifSettings: {
            title: "सेटिंग्स",
            content: "कौन सी सूचनाएं चाहिए, कौन सी नहीं - यहां से सेट करें।"
        },
        notifComplete: {
            title: "सूचनाएं टूर पूरा! ✅",
            content: "अब कोई ज़रूरी अलर्ट नहीं छूटेगा! रोज़ ज़रूर चेक करें।"
        }
    }
};

// Get current language (default to English)
const getCurrentLanguage = (): 'en' | 'hi' => {
    try {
        const lang = localStorage.getItem('smartfarm_preferred_language') as 'en' | 'hi';
        return lang === 'hi' ? 'hi' : 'en';
    } catch {
        return 'en';
    }
};

// Get content for current language
export const getContent = (key: keyof typeof tourContent.en) => {
    const lang = getCurrentLanguage();
    return tourContent[lang][key];
};

/**
 * Main Dashboard Tour Steps
 */
export const mainTourSteps: TourStep[] = [
    {
        target: '[data-tour-id="dashboard-header"]',
        title: getContent('welcome').title,
        content: getContent('welcome').content,
        placement: 'bottom-start',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="soil-moisture"]',
        title: getContent('soilMoisture').title,
        content: getContent('soilMoisture').content,
        placement: 'right-start',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="weather-card"]',
        title: getContent('weatherCard').title,
        content: getContent('weatherCard').content,
        placement: 'top-end',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="control-center"]',
        title: getContent('controlCenter').title,
        content: getContent('controlCenter').content,
        placement: 'left-start',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="action-log"]',
        title: getContent('actionLog').title,
        content: getContent('actionLog').content,
        placement: 'left-end',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="sidebar-nav"]',
        title: getContent('sidebar').title,
        content: getContent('sidebar').content,
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="dashboard-header"]',
        title: getContent('complete').title,
        content: getContent('complete').content,
        placement: 'center',
        disableBeacon: true,
    },
];

/**
 * Farm Page Tour Steps
 */
export const farmTourSteps: TourStep[] = [
    {
        target: '[data-tour-id="farm-header"]',
        title: getContent('farmWelcome').title,
        content: getContent('farmWelcome').content,
        placement: 'bottom-start',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="farm-overview"]',
        title: getContent('farmOverview').title,
        content: getContent('farmOverview').content,
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="farm-location"]',
        title: getContent('farmLocation').title,
        content: getContent('farmLocation').content,
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="farm-specs"]',
        title: getContent('farmSpecs').title,
        content: getContent('farmSpecs').content,
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="farm-irrigation"]',
        title: getContent('farmIrrigation').title,
        content: getContent('farmIrrigation').content,
        placement: 'left',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="farm-soil-analytics"]',
        title: getContent('farmSoilAnalytics').title,
        content: getContent('farmSoilAnalytics').content,
        placement: 'top',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="farm-soil-health"]',
        title: getContent('farmSoilHealth').title,
        content: getContent('farmSoilHealth').content,
        placement: 'top',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="farm-header"]',
        title: getContent('farmComplete').title,
        content: getContent('farmComplete').content,
        placement: 'bottom-start',
        disableBeacon: true,
    },
];

/**
 * Weather Page Tour Steps
 */
export const weatherTourSteps: TourStep[] = [
    {
        target: '[data-tour-id="weather-header"]',
        title: getContent('weatherWelcome').title,
        content: getContent('weatherWelcome').content,
        placement: 'bottom-start',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="weather-current"]',
        title: getContent('weatherCurrent').title,
        content: getContent('weatherCurrent').content,
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="weather-hourly"]',
        title: getContent('weatherHourly').title,
        content: getContent('weatherHourly').content,
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="weather-7day"]',
        title: getContent('weather7Day').title,
        content: getContent('weather7Day').content,
        placement: 'top',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="weather-insights"]',
        title: getContent('weatherInsights').title,
        content: getContent('weatherInsights').content,
        placement: 'top',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="weather-header"]',
        title: getContent('weatherComplete').title,
        content: getContent('weatherComplete').content,
        placement: 'bottom-start',
        disableBeacon: true,
    },
];

/**
 * AI Recommendations Page Tour Steps
 */
export const recommendationsTourSteps: TourStep[] = [
    {
        target: '[data-tour-id="reco-header"]',
        title: getContent('recoWelcome').title,
        content: getContent('recoWelcome').content,
        placement: 'bottom-start',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="reco-ai-brain"]',
        title: "AI-Powered Analysis 🧠",
        content: "Our intelligent system uses machine learning to analyze your farm data and provide personalized recommendations for better crop yields.",
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="reco-stats"]',
        title: getContent('recoStats').title,
        content: getContent('recoStats').content,
        placement: 'top',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="reco-analyze-btn"]',
        title: getContent('recoComplete').title,
        content: "Click this button to get AI-powered recommendations based on your sensor data. You're all set to start optimizing your farm! 🚀",
        placement: 'top',
        disableBeacon: true,
    },
];

/**
 * Marketplace Page Tour Steps
 */
export const marketplaceTourSteps: TourStep[] = [
    {
        target: '[data-tour-id="market-header"]',
        title: getContent('marketWelcome').title,
        content: getContent('marketWelcome').content,
        placement: 'bottom-start',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="market-tabs"]',
        title: getContent('marketTabs').title,
        content: getContent('marketTabs').content,
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="market-search"]',
        title: getContent('marketSearch').title,
        content: getContent('marketSearch').content,
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="market-categories"]',
        title: getContent('marketCategories').title,
        content: getContent('marketCategories').content,
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="market-products"]',
        title: getContent('marketProducts').title,
        content: getContent('marketProducts').content,
        placement: 'top',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="market-header"]',
        title: getContent('marketComplete').title,
        content: getContent('marketComplete').content,
        placement: 'bottom-start',
        disableBeacon: true,
    },
];

/**
 * Learn Page Tour Steps
 */
export const learnTourSteps: TourStep[] = [
    {
        target: '[data-tour-id="learn-header"]',
        title: getContent('learnWelcome').title,
        content: getContent('learnWelcome').content,
        placement: 'bottom-start',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="learn-stats"]',
        title: getContent('learnStats').title,
        content: getContent('learnStats').content,
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="learn-search"]',
        title: getContent('learnSearch').title,
        content: getContent('learnSearch').content,
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="learn-categories"]',
        title: getContent('learnCategories').title,
        content: getContent('learnCategories').content,
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="learn-tabs"]',
        title: getContent('learnTabs').title,
        content: getContent('learnTabs').content,
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="learn-content"]',
        title: getContent('learnContent').title,
        content: getContent('learnContent').content,
        placement: 'top',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="learn-header"]',
        title: getContent('learnComplete').title,
        content: getContent('learnComplete').content,
        placement: 'bottom-start',
        disableBeacon: true,
    },
];

/**
 * Community Page Tour Steps
 */
export const communityTourSteps: TourStep[] = [
    {
        target: '[data-tour-id="community-header"]',
        title: getContent('communityWelcome').title,
        content: getContent('communityWelcome').content,
        placement: 'bottom-start',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="community-create-post"]',
        title: getContent('communityCreatePost').title,
        content: getContent('communityCreatePost').content,
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="community-search"]',
        title: getContent('communitySearch').title,
        content: getContent('communitySearch').content,
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="community-tabs"]',
        title: getContent('communityTabs').title,
        content: getContent('communityTabs').content,
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="community-posts"]',
        title: getContent('communityPosts').title,
        content: getContent('communityPosts').content,
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="community-trending"]',
        title: getContent('communityTrending').title,
        content: getContent('communityTrending').content,
        placement: 'left',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="community-stats"]',
        title: getContent('communityStats').title,
        content: getContent('communityStats').content,
        placement: 'left',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="community-header"]',
        title: getContent('communityComplete').title,
        content: getContent('communityComplete').content,
        placement: 'bottom-start',
        disableBeacon: true,
    },
];

/**
 * Notifications Page Tour Steps
 */
export const notificationsTourSteps: TourStep[] = [
    {
        target: '[data-tour-id="notif-header"]',
        title: getContent('notifWelcome').title,
        content: getContent('notifWelcome').content,
        placement: 'bottom-start',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="notif-actions"]',
        title: getContent('notifActions').title,
        content: getContent('notifActions').content,
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="notif-filters"]',
        title: getContent('notifFilters').title,
        content: getContent('notifFilters').content,
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="notif-list"]',
        title: getContent('notifList').title,
        content: getContent('notifList').content,
        placement: 'left',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="notif-settings"]',
        title: getContent('notifSettings').title,
        content: getContent('notifSettings').content,
        placement: 'top',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="notif-header"]',
        title: getContent('notifComplete').title,
        content: getContent('notifComplete').content,
        placement: 'bottom-start',
        disableBeacon: true,
    },
];

/**
 * Tour Configurations
 */
export interface TourConfig {
    id: string;
    name: string;
    description: string;
    steps: TourStep[];
    autoStart?: boolean;
}

export const tours: Record<string, TourConfig> = {
    'main-tour': {
        id: 'main-tour',
        name: 'Dashboard Tour',
        description: 'Learn about the main dashboard features',
        steps: mainTourSteps,
        autoStart: true,
    },
    'farm-tour': {
        id: 'farm-tour',
        name: 'My Farm Tour',
        description: 'Learn about farm management and soil analytics',
        steps: farmTourSteps,
        autoStart: true,
    },
    'weather-tour': {
        id: 'weather-tour',
        name: 'Weather Tour',
        description: 'Learn about weather forecasts and farming insights',
        steps: weatherTourSteps,
        autoStart: true,
    },
    'recommendations-tour': {
        id: 'recommendations-tour',
        name: 'AI Recommendations Tour',
        description: 'Learn about AI-powered farming recommendations',
        steps: recommendationsTourSteps,
        autoStart: true,
    },
    'marketplace-tour': {
        id: 'marketplace-tour',
        name: 'Marketplace Tour',
        description: 'Learn about buying supplies and selling produce',
        steps: marketplaceTourSteps,
        autoStart: true,
    },
    'learn-tour': {
        id: 'learn-tour',
        name: 'Learning Hub Tour',
        description: 'Learn about free courses, articles, and videos',
        steps: learnTourSteps,
        autoStart: true,
    },
    'community-tour': {
        id: 'community-tour',
        name: 'Community Tour',
        description: 'Learn about connecting with fellow farmers',
        steps: communityTourSteps,
        autoStart: true,
    },
    'notifications-tour': {
        id: 'notifications-tour',
        name: 'Notifications Tour',
        description: 'Learn about alerts and notifications',
        steps: notificationsTourSteps,
        autoStart: true,
    },
};

/**
 * Get tour configuration by ID - dynamically builds steps with current language
 */
export const getTourConfig = (tourId: string): TourConfig | undefined => {
    // Build steps dynamically to get current language
    const buildMainTourSteps = (): TourStep[] => [
        {
            target: '[data-tour-id="dashboard-header"]',
            title: getContent('welcome').title,
            content: getContent('welcome').content,
            placement: 'bottom-start',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="soil-moisture"]',
            title: getContent('soilMoisture').title,
            content: getContent('soilMoisture').content,
            placement: 'right-start',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="weather-card"]',
            title: getContent('weatherCard').title,
            content: getContent('weatherCard').content,
            placement: 'top-end',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="control-center"]',
            title: getContent('controlCenter').title,
            content: getContent('controlCenter').content,
            placement: 'left-start',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="action-log"]',
            title: getContent('actionLog').title,
            content: getContent('actionLog').content,
            placement: 'left-end',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="sidebar-nav"]',
            title: getContent('sidebar').title,
            content: getContent('sidebar').content,
            placement: 'right',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="dashboard-header"]',
            title: getContent('complete').title,
            content: getContent('complete').content,
            placement: 'center',
            disableBeacon: true,
        },
    ];

    const buildFarmTourSteps = (): TourStep[] => [
        {
            target: '[data-tour-id="farm-header"]',
            title: getContent('farmWelcome').title,
            content: getContent('farmWelcome').content,
            placement: 'bottom-start',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="farm-overview"]',
            title: getContent('farmOverview').title,
            content: getContent('farmOverview').content,
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="farm-location"]',
            title: getContent('farmLocation').title,
            content: getContent('farmLocation').content,
            placement: 'right',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="farm-specs"]',
            title: getContent('farmSpecs').title,
            content: getContent('farmSpecs').content,
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="farm-irrigation"]',
            title: getContent('farmIrrigation').title,
            content: getContent('farmIrrigation').content,
            placement: 'left',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="farm-soil-analytics"]',
            title: getContent('farmSoilAnalytics').title,
            content: getContent('farmSoilAnalytics').content,
            placement: 'top',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="farm-soil-health"]',
            title: getContent('farmSoilHealth').title,
            content: getContent('farmSoilHealth').content,
            placement: 'top',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="farm-header"]',
            title: getContent('farmComplete').title,
            content: getContent('farmComplete').content,
            placement: 'bottom-start',
            disableBeacon: true,
        },
    ];

    const buildWeatherTourSteps = (): TourStep[] => [
        {
            target: '[data-tour-id="weather-header"]',
            title: getContent('weatherWelcome').title,
            content: getContent('weatherWelcome').content,
            placement: 'bottom-start',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="weather-current"]',
            title: getContent('weatherCurrent').title,
            content: getContent('weatherCurrent').content,
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="weather-hourly"]',
            title: getContent('weatherHourly').title,
            content: getContent('weatherHourly').content,
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="weather-7day"]',
            title: getContent('weather7Day').title,
            content: getContent('weather7Day').content,
            placement: 'top',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="weather-insights"]',
            title: getContent('weatherInsights').title,
            content: getContent('weatherInsights').content,
            placement: 'top',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="weather-header"]',
            title: getContent('weatherComplete').title,
            content: getContent('weatherComplete').content,
            placement: 'bottom-start',
            disableBeacon: true,
        },
    ];

    const buildRecommendationsTourSteps = (): TourStep[] => [
        {
            target: '[data-tour-id="reco-header"]',
            title: getContent('recoWelcome').title,
            content: getContent('recoWelcome').content,
            placement: 'bottom-start',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="reco-ai-brain"]',
            title: getCurrentLanguage() === 'hi' ? "AI विश्लेषण 🧠" : "AI-Powered Analysis 🧠",
            content: getCurrentLanguage() === 'hi'
                ? "हमारा AI सिस्टम आपके खेत के डेटा का विश्लेषण करके बेहतर फसल के लिए सुझाव देता है।"
                : "Our intelligent system uses machine learning to analyze your farm data and provide personalized recommendations for better crop yields.",
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="reco-stats"]',
            title: getContent('recoStats').title,
            content: getContent('recoStats').content,
            placement: 'top',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="reco-analyze-btn"]',
            title: getContent('recoComplete').title,
            content: getCurrentLanguage() === 'hi'
                ? "इस बटन पर क्लिक करके AI से सुझाव पाएं। अब आप अपने खेत को और बेहतर बना सकते हैं! 🚀"
                : "Click this button to get AI-powered recommendations based on your sensor data. You're all set to start optimizing your farm! 🚀",
            placement: 'top',
            disableBeacon: true,
        },
    ];

    const buildMarketplaceTourSteps = (): TourStep[] => [
        {
            target: '[data-tour-id="market-header"]',
            title: getContent('marketWelcome').title,
            content: getContent('marketWelcome').content,
            placement: 'bottom-start',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="market-tabs"]',
            title: getContent('marketTabs').title,
            content: getContent('marketTabs').content,
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="market-search"]',
            title: getContent('marketSearch').title,
            content: getContent('marketSearch').content,
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="market-categories"]',
            title: getContent('marketCategories').title,
            content: getContent('marketCategories').content,
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="market-products"]',
            title: getContent('marketProducts').title,
            content: getContent('marketProducts').content,
            placement: 'top',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="market-header"]',
            title: getContent('marketComplete').title,
            content: getContent('marketComplete').content,
            placement: 'bottom-start',
            disableBeacon: true,
        },
    ];

    const buildLearnTourSteps = (): TourStep[] => [
        {
            target: '[data-tour-id="learn-header"]',
            title: getContent('learnWelcome').title,
            content: getContent('learnWelcome').content,
            placement: 'bottom-start',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="learn-stats"]',
            title: getContent('learnStats').title,
            content: getContent('learnStats').content,
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="learn-search"]',
            title: getContent('learnSearch').title,
            content: getContent('learnSearch').content,
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="learn-categories"]',
            title: getContent('learnCategories').title,
            content: getContent('learnCategories').content,
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="learn-tabs"]',
            title: getContent('learnTabs').title,
            content: getContent('learnTabs').content,
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="learn-content"]',
            title: getContent('learnContent').title,
            content: getContent('learnContent').content,
            placement: 'top',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="learn-header"]',
            title: getContent('learnComplete').title,
            content: getContent('learnComplete').content,
            placement: 'bottom-start',
            disableBeacon: true,
        },
    ];

    const buildCommunityTourSteps = (): TourStep[] => [
        {
            target: '[data-tour-id="community-header"]',
            title: getContent('communityWelcome').title,
            content: getContent('communityWelcome').content,
            placement: 'bottom-start',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="community-create-post"]',
            title: getContent('communityCreatePost').title,
            content: getContent('communityCreatePost').content,
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="community-search"]',
            title: getContent('communitySearch').title,
            content: getContent('communitySearch').content,
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="community-tabs"]',
            title: getContent('communityTabs').title,
            content: getContent('communityTabs').content,
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="community-posts"]',
            title: getContent('communityPosts').title,
            content: getContent('communityPosts').content,
            placement: 'right',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="community-trending"]',
            title: getContent('communityTrending').title,
            content: getContent('communityTrending').content,
            placement: 'left',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="community-stats"]',
            title: getContent('communityStats').title,
            content: getContent('communityStats').content,
            placement: 'left',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="community-header"]',
            title: getContent('communityComplete').title,
            content: getContent('communityComplete').content,
            placement: 'bottom-start',
            disableBeacon: true,
        },
    ];

    const buildNotificationsTourSteps = (): TourStep[] => [
        {
            target: '[data-tour-id="notif-header"]',
            title: getContent('notifWelcome').title,
            content: getContent('notifWelcome').content,
            placement: 'bottom-start',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="notif-actions"]',
            title: getContent('notifActions').title,
            content: getContent('notifActions').content,
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="notif-filters"]',
            title: getContent('notifFilters').title,
            content: getContent('notifFilters').content,
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="notif-list"]',
            title: getContent('notifList').title,
            content: getContent('notifList').content,
            placement: 'left',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="notif-settings"]',
            title: getContent('notifSettings').title,
            content: getContent('notifSettings').content,
            placement: 'top',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="notif-header"]',
            title: getContent('notifComplete').title,
            content: getContent('notifComplete').content,
            placement: 'bottom-start',
            disableBeacon: true,
        },
    ];

    const tourBuilders: Record<string, () => TourConfig> = {
        'main-tour': () => ({
            id: 'main-tour',
            name: getCurrentLanguage() === 'hi' ? 'डैशबोर्ड टूर' : 'Dashboard Tour',
            description: 'Learn about the main dashboard features',
            steps: buildMainTourSteps(),
            autoStart: true,
        }),
        'farm-tour': () => ({
            id: 'farm-tour',
            name: getCurrentLanguage() === 'hi' ? 'मेरा खेत टूर' : 'My Farm Tour',
            description: 'Learn about farm management and soil analytics',
            steps: buildFarmTourSteps(),
            autoStart: true,
        }),
        'weather-tour': () => ({
            id: 'weather-tour',
            name: getCurrentLanguage() === 'hi' ? 'मौसम टूर' : 'Weather Tour',
            description: 'Learn about weather forecasts and farming insights',
            steps: buildWeatherTourSteps(),
            autoStart: true,
        }),
        'recommendations-tour': () => ({
            id: 'recommendations-tour',
            name: getCurrentLanguage() === 'hi' ? 'AI सुझाव टूर' : 'AI Recommendations Tour',
            description: 'Learn about AI-powered farming recommendations',
            steps: buildRecommendationsTourSteps(),
            autoStart: true,
        }),
        'marketplace-tour': () => ({
            id: 'marketplace-tour',
            name: getCurrentLanguage() === 'hi' ? 'बाज़ार टूर' : 'Marketplace Tour',
            description: 'Learn about buying supplies and selling produce',
            steps: buildMarketplaceTourSteps(),
            autoStart: true,
        }),
        'learn-tour': () => ({
            id: 'learn-tour',
            name: getCurrentLanguage() === 'hi' ? 'सीखने का टूर' : 'Learning Hub Tour',
            description: 'Learn about free courses, articles, and videos',
            steps: buildLearnTourSteps(),
            autoStart: true,
        }),
        'community-tour': () => ({
            id: 'community-tour',
            name: getCurrentLanguage() === 'hi' ? 'समुदाय टूर' : 'Community Tour',
            description: 'Learn about connecting with fellow farmers',
            steps: buildCommunityTourSteps(),
            autoStart: true,
        }),
        'notifications-tour': () => ({
            id: 'notifications-tour',
            name: getCurrentLanguage() === 'hi' ? 'सूचनाएं टूर' : 'Notifications Tour',
            description: 'Learn about alerts and notifications',
            steps: buildNotificationsTourSteps(),
            autoStart: true,
        }),
    };

    const builder = tourBuilders[tourId];
    return builder ? builder() : undefined;
};
