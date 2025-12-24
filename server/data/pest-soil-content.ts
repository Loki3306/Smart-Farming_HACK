// Pest Control & Soil Health Course Content
import { LessonContent } from './lesson-content';

// ===========================================
// PEST CONTROL COURSE CONTENT
// ===========================================
export const PEST_CONTROL_CONTENT: LessonContent[] = [
  {
    title: 'Identifying Common Farm Pests',
    description: 'Learn to recognize the most common pests that damage crops in Indian farms.',
    content_type: 'video',
    // ICAR video on pest identification
    content_url: 'https://www.youtube.com/watch?v=Ym6OvP6Lj2g',
    duration: '10 min',
    is_preview: true,
  },
  {
    title: 'Biological Pest Control',
    description: 'Use natural predators and organic methods to control pests without chemicals.',
    content_type: 'text',
    duration: '18 min',
    is_preview: false,
    article: {
      introduction: 'Nature has its own pest control system. By understanding it, you can protect your crops without expensive chemicals that harm soil and health. This lesson teaches you proven biological methods used by successful organic farmers.',
      sections: [
        {
          title: '🐞 Beneficial Insects - Nature\'s Pest Killers',
          content: 'Some insects eat harmful pests. These are your farm\'s natural helpers:\n\n• LADYBUGS: One ladybug eats 50 aphids per day\n• LACEWINGS: Larvae eat aphids, mites, small caterpillars\n• DRAGONFLIES: Eat mosquitoes and small flies\n• SPIDERS: Catch many flying pests in webs\n\nNever kill these helpful insects!',
          tips: [
            'Plant marigold and sunflower to attract beneficial insects',
            'Avoid broad-spectrum pesticides that kill good insects too',
            'Create small water sources for dragonflies',
            'Leave some wild plants around field edges'
          ]
        },
        {
          title: '🌿 Neem - The Farmer\'s Best Friend',
          content: 'Neem is a powerful natural pesticide used in India for centuries.\n\nNEEM OIL SPRAY:\n• Mix 5ml neem oil + 1ml soap in 1 liter water\n• Spray early morning or evening\n• Effective against aphids, whiteflies, mealybugs\n• Safe for humans, animals, and beneficial insects',
          tips: [
            'Make fresh spray each time - neem loses power quickly',
            'Spray every 7-10 days for prevention',
            'Add garlic juice for extra pest-repelling power',
            'Neem cake in soil kills soil pests too'
          ]
        },
        {
          title: '🧄 Homemade Pest Sprays',
          content: 'GARLIC-CHILI SPRAY:\n1. Blend 10 garlic cloves + 10 green chilies\n2. Soak in 1 liter water overnight\n3. Strain and add 1 spoon soap\n4. Spray on plants - repels most insects\n\nBUTTERMILK SPRAY:\n• Mix 1 cup buttermilk in 5 liters water\n• Controls fungal diseases\n• Apply weekly',
        },
        {
          title: '🪤 Physical Pest Control',
          content: 'YELLOW STICKY TRAPS:\n• Buy or make with yellow plastic + oil\n• Attracts and traps whiteflies, aphids\n• Place 1 trap per 10 sq meters\n\nPHEROMONE TRAPS:\n• Attracts male moths\n• Breaks pest breeding cycle\n• Very effective for fruit borer',
          tips: [
            'Check traps weekly and replace when full',
            'Blue sticky traps catch thrips better',
            'Light traps work for night-flying moths',
            'Hand-pick large caterpillars and drop in soapy water'
          ]
        }
      ],
      commonMistakes: [
        'Killing all insects including beneficial ones',
        'Spraying neem in hot afternoon - it breaks down fast',
        'Using too much concentration - can burn leaves',
        'Expecting instant results - bio methods take 2-3 days',
        'Not repeating spray after rain washes it off'
      ],
      actionItems: [
        'Identify 3 beneficial insects on your farm this week',
        'Make neem oil spray and test on one plant first',
        'Install 5 yellow sticky traps in your field',
        'Plant marigold around your vegetable plot',
        'Stop using broad-spectrum chemical pesticides'
      ],
      summary: 'Biological pest control uses nature\'s own methods - beneficial insects, neem, garlic-chili spray, and traps. These methods are cheaper, safer, and sustainable. Start with neem spray and sticky traps, then build up beneficial insect population.'
    }
  },
  {
    title: 'Safe Chemical Usage',
    description: 'When you must use chemicals, learn to do it safely and effectively.',
    content_type: 'video',
    content_url: 'https://www.youtube.com/watch?v=KZvdKqQ3-3Y',
    duration: '12 min',
    is_preview: false,
  },
  {
    title: 'Quiz: Pest Management',
    description: 'Test your pest identification and control knowledge.',
    content_type: 'quiz',
    duration: '10 min',
    is_preview: false,
    quiz: {
      questions: [
        {
          question: 'How many aphids can a single ladybug eat per day?',
          options: ['5 aphids', '15 aphids', '50 aphids', '100 aphids'],
          correctIndex: 2,
          explanation: 'One ladybug can eat up to 50 aphids per day! This is why ladybugs are called "farmer\'s friends" - they provide free, natural pest control.'
        },
        {
          question: 'What is the correct neem oil concentration for pest spray?',
          options: ['5ml per liter water', '50ml per liter water', '100ml per liter water', '500ml per liter water'],
          correctIndex: 0,
          explanation: '5ml neem oil per liter of water is the correct concentration. Higher amounts can burn plant leaves. Add 1ml soap to help it mix with water.'
        },
        {
          question: 'When is the best time to spray neem oil?',
          options: ['Midday (12-2 PM)', 'Early morning or evening', 'Night time only', 'Anytime works'],
          correctIndex: 1,
          explanation: 'Spray neem oil early morning or evening. Midday sunlight breaks down neem quickly, reducing its effectiveness. Evening is slightly better as it stays on leaves longer.'
        },
        {
          question: 'What color sticky traps attract whiteflies best?',
          options: ['Red', 'Yellow', 'Green', 'White'],
          correctIndex: 1,
          explanation: 'Yellow sticky traps are most effective for whiteflies, aphids, and fungus gnats. These pests are naturally attracted to yellow color.'
        },
        {
          question: 'What should you add to garlic-chili spray to help it stick to leaves?',
          options: ['Sugar', 'Salt', 'Soap', 'Oil'],
          correctIndex: 2,
          explanation: 'Adding a small amount of soap helps the spray stick to leaves and spread evenly. Without soap, the spray beads up and rolls off.'
        },
        {
          question: 'Which plant attracts beneficial insects to your farm?',
          options: ['Wheat', 'Rice', 'Marigold', 'Sugarcane'],
          correctIndex: 2,
          explanation: 'Marigold flowers attract beneficial insects like ladybugs and lacewings while repelling many harmful pests. Plant them around vegetable plots.'
        }
      ]
    }
  }
];

// ===========================================
// SOIL HEALTH COURSE CONTENT
// ===========================================
export const SOIL_HEALTH_CONTENT: LessonContent[] = [
  {
    title: 'Understanding Soil Types',
    description: 'Learn about different soil types and what grows best in each.',
    content_type: 'video',
    content_url: 'https://www.youtube.com/watch?v=if9GaAVE_ko',
    duration: '8 min',
    is_preview: true,
  },
  {
    title: 'Soil Testing & pH Management',
    description: 'Know your soil\'s health and how to improve it for better crops.',
    content_type: 'text',
    duration: '15 min',
    is_preview: false,
    article: {
      introduction: 'Would you take medicine without knowing your illness? Similarly, adding fertilizers without knowing soil condition wastes money and can harm crops. Soil testing tells you exactly what your soil needs.',
      sections: [
        {
          title: '🧪 What is Soil Testing?',
          content: 'Soil testing checks:\n• pH (acidity/alkalinity) - affects nutrient availability\n• NPK levels (Nitrogen, Phosphorus, Potassium)\n• Organic carbon - indicates soil health\n• Micronutrients (Zinc, Iron, etc.)\n\nCost: ₹50-100 at government labs (free under Soil Health Card scheme)',
          tips: [
            'Get Soil Health Card from your state agriculture department',
            'Test soil every 6 months for intensive farming',
            'Test before and after monsoon for best results',
            'Keep old test reports to track improvement'
          ]
        },
        {
          title: '📊 Understanding pH Scale',
          content: 'pH tells if soil is acidic or alkaline:\n\npH < 6.0 = Acidic soil (add lime)\npH 6.0-7.0 = Slightly acidic (ideal for most crops)\npH 7.0 = Neutral (perfect)\npH 7.0-8.0 = Slightly alkaline (ok for many crops)\npH > 8.0 = Alkaline soil (add gypsum/sulfur)\n\nMost Indian soils are pH 6.5-8.5',
          tips: [
            'Rice, potato prefer slightly acidic (pH 5.5-6.5)',
            'Wheat, vegetables like neutral (pH 6.5-7.5)',
            'Very high or low pH locks nutrients in soil'
          ]
        },
        {
          title: '🥗 NPK - The Big Three Nutrients',
          content: 'N = Nitrogen: For leaf growth, green color\n• Deficiency: Yellow leaves, stunted growth\n• Sources: Urea, vermicompost, legume rotation\n\nP = Phosphorus: For roots and flowers\n• Deficiency: Purple leaves, poor flowering\n• Sources: DAP, bone meal, rock phosphate\n\nK = Potassium: For fruit quality, disease resistance\n• Deficiency: Brown leaf edges, weak stems\n• Sources: MOP, wood ash, banana stems',
        },
        {
          title: '🔧 How to Take Soil Sample',
          content: '1. Collect from 8-10 spots across your field\n2. Dig 6-8 inches deep (root zone)\n3. Avoid edges, near trees, manure piles\n4. Mix all samples together\n5. Take 500g of mixed soil in clean bag\n6. Label with your name, field location, crop\n7. Send to nearest soil testing lab',
        }
      ],
      commonMistakes: [
        'Taking sample from just one spot in the field',
        'Collecting from surface only (not 6-8 inches deep)',
        'Using fertilizer without knowing soil needs',
        'Ignoring micronutrients like zinc and boron',
        'Not adjusting pH before planting'
      ],
      actionItems: [
        'Collect soil sample from your field this week',
        'Visit nearest Soil Testing Lab or KVK',
        'Apply for Soil Health Card online or at agriculture office',
        'Learn to read your soil test report',
        'Plan fertilizer application based on test results'
      ],
      summary: 'Soil testing costs ₹50-100 but saves thousands in wrong fertilizers. Check pH, NPK, and organic carbon. Most crops prefer pH 6.5-7.5. Get your free Soil Health Card and test every 6 months for best results.'
    }
  },
  {
    title: 'Nutrient Management (NPK)',
    description: 'Balance nitrogen, phosphorus and potassium for healthy crops.',
    content_type: 'video',
    content_url: 'https://www.youtube.com/watch?v=H8ZKKLDdepM',
    duration: '11 min',
    is_preview: false,
  },
  {
    title: 'Green Manuring & Cover Crops',
    description: 'Improve soil naturally by growing and incorporating specific plants.',
    content_type: 'text',
    duration: '12 min',
    is_preview: false,
    article: {
      introduction: 'What if you could grow your own fertilizer? Green manuring does exactly that! By growing and plowing certain plants into soil, you add nutrients and organic matter naturally. This practice has been used in India for thousands of years.',
      sections: [
        {
          title: '🌱 What is Green Manuring?',
          content: 'Green manuring means growing specific crops and then plowing them into soil before your main crop. These plants add:\n• Nitrogen (especially legumes)\n• Organic matter\n• Improve soil structure\n• Suppress weeds\n\nBest green manure crops: Dhaincha, Sunhemp, Cowpea, Moong',
          tips: [
            'Dhaincha adds 80-100 kg nitrogen per hectare',
            'Plow in when plants are 45-50 days old',
            'Best done before monsoon or main crop season',
            'Costs less than ₹500/acre for seeds'
          ]
        },
        {
          title: '🌿 Best Green Manure Crops',
          content: 'DHAINCHA (Sesbania):\n• Ready in 45-50 days\n• Adds 80-100 kg N/hectare\n• Grows in waterlogged soil\n• Best before rice\n\nSUNHEMP (Crotalaria):\n• Ready in 45-60 days\n• Adds 60-80 kg N/hectare\n• Drought tolerant\n• Good before any crop\n\nCOWPEA/MOONG:\n• Harvest beans, plow stems\n• Dual benefit: food + green manure',
        },
        {
          title: '📅 When to Do Green Manuring',
          content: 'BEFORE RICE (Kharif):\n• Sow dhaincha in April-May\n• Plow in June before rice transplanting\n\nBEFORE WHEAT (Rabi):\n• Sow moong/cowpea in July\n• Harvest pods, plow stems in October\n\nSUMMER FALLOW:\n• Grow sunhemp in April-May\n• Plow in before monsoon',
        }
      ],
      commonMistakes: [
        'Letting green manure crop produce seeds (becomes weed)',
        'Plowing when plants are too old and woody',
        'Not watering green manure crop - poor growth',
        'Planting main crop immediately - wait 15 days after plowing'
      ],
      actionItems: [
        'Identify next fallow period in your crop calendar',
        'Buy 4-5 kg dhaincha or sunhemp seeds per acre',
        'Prepare land and sow before expected rain',
        'Mark calendar to plow in after 45-50 days',
        'Plant main crop 15 days after incorporating green manure'
      ],
      summary: 'Green manuring is like growing free fertilizer. Sow dhaincha or sunhemp, plow in after 45-50 days, and get 60-100 kg nitrogen per hectare naturally. It also improves soil structure and suppresses weeds.'
    }
  },
  {
    title: 'Quiz: Soil Health Expert',
    description: 'Prove your understanding of soil management.',
    content_type: 'quiz',
    duration: '10 min',
    is_preview: false,
    quiz: {
      questions: [
        {
          question: 'What is the ideal pH range for most vegetable crops?',
          options: ['4.0-5.0 (very acidic)', '6.5-7.5 (neutral)', '8.5-9.5 (alkaline)', 'pH doesn\'t matter'],
          correctIndex: 1,
          explanation: 'Most vegetables grow best in slightly acidic to neutral soil (pH 6.5-7.5). At this pH, nutrients are most available to plants.'
        },
        {
          question: 'What does "N" represent in NPK?',
          options: ['Nickel', 'Nitrogen', 'Sodium', 'Neon'],
          correctIndex: 1,
          explanation: 'N stands for Nitrogen, which is essential for leaf growth and green color. Nitrogen deficiency causes yellow leaves and stunted growth.'
        },
        {
          question: 'How deep should you collect soil sample from?',
          options: ['Surface only', '2-3 inches', '6-8 inches', '2 feet'],
          correctIndex: 2,
          explanation: 'Collect soil from 6-8 inches deep, which is the main root zone where plants absorb nutrients. Surface soil doesn\'t represent the root zone accurately.'
        },
        {
          question: 'How much nitrogen does dhaincha add per hectare?',
          options: ['10-20 kg', '40-50 kg', '80-100 kg', '200-300 kg'],
          correctIndex: 2,
          explanation: 'Dhaincha (Sesbania) adds 80-100 kg nitrogen per hectare when plowed in at 45-50 days. This is equivalent to about 200 kg urea!'
        },
        {
          question: 'When should you plow in green manure crop?',
          options: ['When it has seeds', 'At 45-50 days (before flowering)', 'After 6 months', 'Only in winter'],
          correctIndex: 1,
          explanation: 'Plow in green manure at 45-50 days, before flowering. After this, plants become woody and don\'t decompose well. Seeds can become weeds.'
        },
        {
          question: 'What causes brown edges on leaves?',
          options: ['Nitrogen deficiency', 'Phosphorus deficiency', 'Potassium deficiency', 'Too much water'],
          correctIndex: 2,
          explanation: 'Brown or burnt edges on leaves indicate potassium (K) deficiency. Potassium is important for fruit quality and disease resistance.'
        }
      ]
    }
  }
];
