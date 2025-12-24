// Rich Lesson Content for Smart Farming Platform
// Each lesson has detailed articles, real YouTube videos, and quiz questions

export interface LessonContent {
  title: string;
  description: string;
  content_type: 'video' | 'text' | 'quiz';
  content_url?: string;
  duration: string;
  is_preview: boolean;
  // Rich content for text lessons
  article?: {
    introduction: string;
    sections: {
      title: string;
      content: string;
      tips?: string[];
    }[];
    commonMistakes: string[];
    actionItems: string[];
    summary: string;
  };
  // Quiz questions for quiz lessons
  quiz?: {
    questions: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[];
  };
}

// ===========================================
// ORGANIC FARMING COURSE CONTENT
// ===========================================
export const ORGANIC_FARMING_CONTENT: LessonContent[] = [
  {
    title: 'Principles of Organic Farming',
    description: 'Learn the core concepts of sustainable agriculture and why organic farming benefits your land.',
    content_type: 'video',
    // Real Indian agriculture video - ICAR official
    content_url: 'https://www.youtube.com/watch?v=sHDkpRrZKSI',
    duration: '12 min',
    is_preview: true,
  },
  {
    title: 'Soil Preparation & Composting',
    description: 'Master the art of preparing healthy soil using natural composting methods.',
    content_type: 'text',
    duration: '15 min',
    is_preview: false,
    article: {
      introduction: 'Healthy soil is the foundation of successful organic farming. Just like a strong house needs a solid foundation, your crops need nutrient-rich soil to grow well. In this lesson, you will learn how to prepare your soil naturally without using chemical fertilizers.',
      sections: [
        {
          title: '🌱 Why Soil Health Matters for Your Farm',
          content: 'Think of soil as a living thing - it contains millions of tiny organisms that help your crops grow. When soil is healthy, it holds water better, provides nutrients to plants, and fights off diseases naturally. Farmers who focus on soil health often see 20-30% better yields within 2-3 years.',
          tips: [
            'Test your soil every 6 months to know what it needs',
            'Healthy soil should feel crumbly, not hard like stone',
            'Dark brown or black soil usually means good organic matter'
          ]
        },
        {
          title: '🥬 How to Make Perfect Compost',
          content: 'Composting is nature\'s way of recycling. You can turn farm waste, kitchen scraps, and animal manure into rich fertilizer for free! The key is balancing "green" materials (fresh grass, vegetable waste) with "brown" materials (dry leaves, straw).',
          tips: [
            'Mix 3 parts brown materials with 1 part green materials',
            'Turn your compost pile every 2 weeks for faster results',
            'Good compost smells like earth, not rotten eggs',
            'Compost is ready when it looks dark and crumbly (about 2-3 months)'
          ]
        },
        {
          title: '🔧 Step-by-Step Composting Process',
          content: '1. Choose a shady spot near water source\n2. Create a base layer with twigs and straw (6 inches)\n3. Add green materials like fresh grass and vegetable scraps\n4. Add brown materials like dry leaves and straw\n5. Sprinkle some old compost or soil between layers\n6. Keep it moist like a squeezed sponge\n7. Cover with a tarp or banana leaves\n8. Turn every 2 weeks until ready',
        },
        {
          title: '💡 Smart Composting Tips',
          content: 'Use the "squeeze test" to check moisture - when you squeeze a handful of compost, only a few drops of water should come out. Too wet? Add more dry materials. Too dry? Sprinkle some water. In summer, your compost will be ready faster (6-8 weeks). In winter, it may take 3-4 months.',
          tips: [
            'Never add meat, fish, or oily foods - they attract pests',
            'Cow dung is excellent for speeding up composting',
            'Add neem leaves to keep insects away'
          ]
        }
      ],
      commonMistakes: [
        'Making compost too wet - it becomes smelly and slow',
        'Not turning the pile - the center won\'t decompose properly',
        'Adding diseased plants - this spreads disease to your crops',
        'Using compost before it\'s ready - it can harm young plants',
        'Placing compost pit in direct sunlight - it dries out too fast'
      ],
      actionItems: [
        'Start a small compost pit (3x3 feet) this week',
        'Collect dry leaves and straw for brown materials',
        'Save vegetable waste from kitchen for green materials',
        'Get a soil testing kit from your local agricultural office'
      ],
      summary: 'Good soil preparation starts with composting. Mix green and brown materials, keep moist, turn regularly, and in 2-3 months you\'ll have free, natural fertilizer. Healthy soil means healthy crops and better income for your family.'
    }
  },
  {
    title: 'Natural Pest Management',
    description: 'Protect your crops from pests without harmful chemicals using traditional and modern techniques.',
    content_type: 'video',
    // Real video on organic pest control
    content_url: 'https://www.youtube.com/watch?v=J3aX5c5n8ro',
    duration: '10 min',
    is_preview: false,
  },
  {
    title: 'Organic Certification Process',
    description: 'Learn how to get your farm certified organic and access premium markets.',
    content_type: 'text',
    duration: '12 min',
    is_preview: false,
    article: {
      introduction: 'Organic certification can help you sell your produce at 20-50% higher prices. While the process takes time, it is worth the effort. This lesson explains exactly what you need to do to get certified in India.',
      sections: [
        {
          title: '📜 What is Organic Certification?',
          content: 'Organic certification is an official document that proves your farm follows organic practices. It is like a guarantee to buyers that your produce is chemical-free. In India, you can get certified through PGS (Participatory Guarantee System) for local markets or through agencies like APEDA for export.',
        },
        {
          title: '📋 Requirements for Certification',
          content: 'To get certified, you must:\n• Not use chemical fertilizers or pesticides for 2-3 years\n• Keep records of all farming activities\n• Have buffer zones between organic and non-organic fields\n• Use only approved organic inputs\n• Allow inspectors to visit your farm',
          tips: [
            'Start maintaining records from day one',
            'Take photos of your farm and practices',
            'Join a farmer group for easier PGS certification'
          ]
        },
        {
          title: '🏷️ PGS-India Certification (Easier Option)',
          content: 'PGS is perfect for selling in local mandis and markets. It costs less and is done by farmer groups.\n\nSteps:\n1. Form a group of 5+ farmers\n2. Register on pgsindia-ncof.gov.in\n3. Follow organic practices for 1 year\n4. Get peer inspection from other farmers\n5. Receive PGS-Green certificate',
        },
        {
          title: '💰 Benefits of Certification',
          content: 'Certified organic farmers typically earn:\n• 20-50% premium on produce prices\n• Access to export markets\n• Government subsidies under PKVY scheme\n• Better long-term soil health\n• Growing demand as consumers want safe food',
        }
      ],
      commonMistakes: [
        'Not maintaining proper records from the beginning',
        'Contamination from neighboring non-organic farms',
        'Using non-approved inputs thinking they are organic',
        'Expecting certification immediately - it takes 2-3 years',
        'Not separating organic and non-organic produce during storage'
      ],
      actionItems: [
        'Start a farm diary and record everything you do',
        'Talk to your neighboring farmers about forming a PGS group',
        'Visit pgsindia-ncof.gov.in to understand the process',
        'Contact your local Krishi Vigyan Kendra for guidance'
      ],
      summary: 'Organic certification takes 2-3 years but opens doors to premium prices. Start with PGS certification by forming a farmer group. Keep records, follow organic practices, and you\'ll soon have an official certificate to prove your produce quality.'
    }
  },
  {
    title: 'Quiz: Organic Farming Fundamentals',
    description: 'Test your understanding of organic farming concepts.',
    content_type: 'quiz',
    duration: '10 min',
    is_preview: false,
    quiz: {
      questions: [
        {
          question: 'What is the ideal ratio of brown to green materials in a compost pile?',
          options: ['1:1 (equal parts)', '3:1 (3 brown, 1 green)', '1:3 (1 brown, 3 green)', '5:1 (5 brown, 1 green)'],
          correctIndex: 1,
          explanation: 'The ideal ratio is 3 parts brown (dry leaves, straw) to 1 part green (fresh grass, vegetable waste). This balance provides the right carbon-to-nitrogen ratio for proper decomposition.'
        },
        {
          question: 'How long does it typically take for compost to be ready in summer?',
          options: ['1-2 weeks', '6-8 weeks', '6 months', '1 year'],
          correctIndex: 1,
          explanation: 'In warm summer conditions, compost can be ready in 6-8 weeks with proper turning and moisture. In winter, it takes longer (3-4 months).'
        },
        {
          question: 'How often should you test your soil for organic farming?',
          options: ['Every week', 'Every month', 'Every 6 months', 'Only once when starting'],
          correctIndex: 2,
          explanation: 'Testing soil every 6 months helps you track soil health changes and adjust your composting and farming practices accordingly.'
        },
        {
          question: 'What does the "squeeze test" check in composting?',
          options: ['Nutrient content', 'Moisture level', 'Temperature', 'Pest presence'],
          correctIndex: 1,
          explanation: 'The squeeze test checks moisture level. When you squeeze compost, only a few drops of water should come out - not too wet, not too dry.'
        },
        {
          question: 'How long must you follow organic practices before getting PGS certification?',
          options: ['1 month', '6 months', '1 year', '3 years'],
          correctIndex: 2,
          explanation: 'For PGS-India certification, you need to follow organic practices for at least 1 year. For export certification, it can be 2-3 years.'
        },
        {
          question: 'What should you NEVER add to your compost pile?',
          options: ['Dry leaves', 'Vegetable scraps', 'Meat and fish', 'Cow dung'],
          correctIndex: 2,
          explanation: 'Never add meat, fish, or oily foods to compost. They attract pests, create bad smells, and can spread diseases.'
        }
      ]
    }
  }
];
