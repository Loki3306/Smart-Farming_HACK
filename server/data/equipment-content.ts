// Farm Equipment & Technology Course Content
import { LessonContent } from './lesson-content';

// ===========================================
// FARM EQUIPMENT COURSE CONTENT
// ===========================================
export const EQUIPMENT_CONTENT: LessonContent[] = [
  {
    title: 'Tractor Basics & Safety',
    description: 'Essential tractor operation and safety practices every farmer must know.',
    content_type: 'video',
    content_url: 'https://www.youtube.com/watch?v=qBQy0kVfYEs',
    duration: '12 min',
    is_preview: true,
  },
  {
    title: 'Tractor Maintenance Guide',
    description: 'Keep your tractor running smoothly with regular maintenance.',
    content_type: 'text',
    duration: '15 min',
    is_preview: false,
    article: {
      introduction: 'Your tractor is a big investment - typically ₹4-8 lakhs. Proper maintenance can make it last 15-20 years instead of 8-10 years. Learn simple maintenance tasks that save thousands in repair costs.',
      sections: [
        {
          title: '🛢️ Daily Checks (5 minutes)',
          content: 'Before starting tractor every day, check:\n\n1. ENGINE OIL: Check dipstick - oil should be between marks\n2. COOLANT: Check in radiator - top up if low\n3. DIESEL: Never run tank completely empty (damages pump)\n4. TIRES: Look for cuts, check pressure by eye\n5. BATTERY: Check terminal connections are tight\n6. LEAKS: Look under tractor for oil/water spots',
          tips: [
            'Start tractor and let it warm up 2-3 minutes',
            'Listen for unusual sounds - grinding, knocking',
            'Check all lights and horn work',
            'Never skip daily checks - they prevent big breakdowns'
          ]
        },
        {
          title: '📅 Weekly Maintenance',
          content: 'Every week or 50 hours of use:\n\n1. CLEAN AIR FILTER: Tap to remove dust, blow with compressed air\n2. CHECK BELTS: Look for cracks or looseness\n3. GREASE POINTS: Apply grease to all nipples (steering, linkage)\n4. CLUTCH PEDAL: Check free play (25-30mm)\n5. BRAKE PEDAL: Check free play and balance\n6. HYDRAULIC OIL: Check level in sight glass',
          tips: [
            'Keep a maintenance log book',
            'Clean tractor with water spray - dirt damages paint',
            'Check wheel nuts are tight',
            'Inspect implements attachment points'
          ]
        },
        {
          title: '📆 Oil Change Schedule',
          content: 'ENGINE OIL CHANGE:\n• First change: 50 hours (new tractor)\n• Regular: Every 200-250 hours\n• Use grade recommended in manual (usually 15W-40)\n\nHYDRAULIC OIL:\n• Change every 800-1000 hours\n• Use proper hydraulic oil (not engine oil)\n\nGEAR OIL:\n• Check every 500 hours\n• Change every 1500-2000 hours',
          tips: [
            'Buy oil in bulk (20L cans) - cheaper',
            'Always dispose old oil properly - don\'t dump on ground',
            'Change filter with every oil change',
            'Warm up engine before draining oil'
          ]
        },
        {
          title: '⚠️ Common Problems & Solutions',
          content: 'TRACTOR WON\'T START:\n• Check diesel level and fuel filter\n• Check battery charge\n• Bleed air from fuel system\n\nOVERHEATING:\n• Clean radiator fins with brush\n• Check coolant level\n• Check fan belt tension\n\nLOW POWER:\n• Clean/replace air filter\n• Check for blocked fuel filter\n• Check injector timing',
        }
      ],
      commonMistakes: [
        'Running engine on empty - damages fuel pump',
        'Using wrong oil grade - damages engine',
        'Ignoring small leaks - they become big problems',
        'Overloading tractor - damages transmission',
        'Not warming up before heavy work'
      ],
      actionItems: [
        'Create daily checklist and post near tractor',
        'Buy grease gun and engine oil for regular maintenance',
        'Start maintenance log book today',
        'Find trusted local mechanic for yearly service',
        'Download your tractor model\'s manual (PDF)'
      ],
      summary: 'Daily 5-minute checks prevent 90% of breakdowns. Change engine oil every 200-250 hours, keep air filter clean, and grease moving parts weekly. A well-maintained tractor lasts twice as long and has better resale value.'
    }
  },
  {
    title: 'Modern Sprayer Equipment',
    description: 'From manual to power sprayers - choose and use the right sprayer.',
    content_type: 'video',
    content_url: 'https://www.youtube.com/watch?v=YIVh6V2E3SQ',
    duration: '10 min',
    is_preview: false,
  },
  {
    title: 'Harvesting Equipment',
    description: 'Manual vs mechanical harvesting - making the right choice.',
    content_type: 'text',
    duration: '12 min',
    is_preview: false,
    article: {
      introduction: 'Harvesting is the most labor-intensive part of farming. With rising wages and labor shortage, knowing about harvesting equipment helps you decide when to invest or rent machines.',
      sections: [
        {
          title: '🌾 Types of Harvesters',
          content: 'MANUAL HARVESTING:\n• Sickle for small farms\n• Labor cost: ₹400-500/day\n• Suitable for <2 acres\n\nREAPER (cuts and lays):\n• Attaches to power tiller\n• Cost: ₹50,000-80,000\n• Covers 1 acre in 2-3 hours\n\nCOMBINE HARVESTER:\n• Cuts, threshes, cleans in one pass\n• Rental: ₹1,500-2,500/acre\n• Best for wheat and rice',
          tips: [
            'Rent combine for small farms - cheaper than buying',
            'Book combine early in season - high demand',
            'Combine works best at right moisture (14-18%)',
            'Check grain sample before operator leaves'
          ]
        },
        {
          title: '💡 When to Rent vs Buy',
          content: 'RENT COMBINE IF:\n• Less than 20 acres\n• Grow only wheat/rice\n• Good rental availability in area\n\nBUY REAPER IF:\n• 5-15 acres\n• Multiple crops\n• Labor shortage in village\n\nBUY COMBINE IF:\n• More than 30-40 acres\n• Can offer custom hiring to neighbors\n• Have storage and maintenance ability',
        },
        {
          title: '📊 Cost Comparison (for 10 acres wheat)',
          content: 'MANUAL HARVESTING:\n• 5 laborers × 3 days × ₹500 = ₹7,500\n• Plus thresher rental: ₹2,000\n• Total: ₹9,500\n\nCOMBINE HARVESTER:\n• ₹1,800 × 10 acres = ₹18,000\n• But saves 4-5 days time\n• Less grain loss (2% vs 5% manual)\n\nFor small farms, manual may be cheaper but slower.',
        }
      ],
      commonMistakes: [
        'Harvesting when grain moisture is too high (storage problems)',
        'Booking combine too late - long wait or crop damage',
        'Not checking combine settings for your crop variety',
        'Not collecting straw - it has value for fodder/composting'
      ],
      actionItems: [
        'Find 3 combine harvester operators in your area',
        'Save their phone numbers for booking',
        'Calculate your per-acre harvesting cost',
        'Consider forming group with neighbors for better rates',
        'Learn to check grain moisture before harvesting'
      ],
      summary: 'For most Indian farmers with <20 acres, renting combine harvester is more economical than buying. Book early, harvest at right moisture (14-18%), and check grain sample before paying. Combines reduce grain loss from 5% to 2%.'
    }
  },
  {
    title: 'Subsidy Schemes for Equipment',
    description: 'Government subsidies can cover 25-50% of equipment cost.',
    content_type: 'text',
    duration: '10 min',
    is_preview: false,
    article: {
      introduction: 'Did you know you can get 25-50% subsidy on farm equipment? Government schemes help farmers afford modern equipment. Learn about major schemes and how to apply.',
      sections: [
        {
          title: '🏛️ Major Subsidy Schemes',
          content: 'SMAM (Sub-Mission on Agricultural Mechanization):\n• 40-50% subsidy for small/marginal farmers\n• 25-40% for other farmers\n• Covers tractors, tillers, threshers, sprayers\n\nRKVY (Rashtriya Krishi Vikas Yojana):\n• State-specific schemes\n• Often 50% subsidy on select equipment\n\nCHC (Custom Hiring Centers):\n• Group subsidy for equipment sharing\n• Up to 40% on CHC setup',
        },
        {
          title: '📝 How to Apply',
          content: 'STEP 1: Register on DBT Agriculture Portal\n• agri-dbt.gov.in (central)\n• Or state agriculture portal\n\nSTEP 2: Upload documents\n• Aadhaar card\n• Bank passbook\n• Land records (Khasra/Khatauni)\n• Passport photo\n\nSTEP 3: Select scheme and equipment\n\nSTEP 4: Get approval, buy from empaneled dealer\n\nSTEP 5: Upload invoice, get subsidy in bank',
          tips: [
            'Apply early in financial year - funds get exhausted',
            'Keep all original documents ready',
            'Buy only from government-empaneled dealers',
            'Subsidy comes to bank account in 30-60 days'
          ]
        },
        {
          title: '✅ Eligibility Criteria',
          content: 'GENERAL REQUIREMENTS:\n• Must have land in your name (or lease agreement)\n• Bank account linked to Aadhaar\n• Only one subsidy per equipment type in 5 years\n\nPRIORITY GIVEN TO:\n• Small and marginal farmers (<2 hectares)\n• SC/ST farmers (extra 10% subsidy)\n• Women farmers\n• FPO members',
        }
      ],
      commonMistakes: [
        'Buying equipment before getting approval - no subsidy',
        'Buying from non-empaneled dealer',
        'Not keeping original invoice and warranty card',
        'Applying with incomplete documents',
        'Missing the application deadline'
      ],
      actionItems: [
        'Register on your state agriculture portal today',
        'Collect all required documents',
        'Visit local agriculture office for current schemes',
        'Identify equipment you need most',
        'Apply at least 2-3 months before purchase'
      ],
      summary: 'Government subsidies cover 25-50% of farm equipment cost. Register on DBT portal, upload documents, get approval, then buy from empaneled dealers. Small farmers and SC/ST get higher subsidies. Apply early as funds are limited.'
    }
  },
  {
    title: 'Quiz: Equipment Master',
    description: 'Test your farm equipment knowledge.',
    content_type: 'quiz',
    duration: '8 min',
    is_preview: false,
    quiz: {
      questions: [
        {
          question: 'How often should you change tractor engine oil?',
          options: ['Every 50 hours', 'Every 200-250 hours', 'Every 1000 hours', 'Once a year'],
          correctIndex: 1,
          explanation: 'Change engine oil every 200-250 hours for optimal engine life. First change on new tractor should be at 50 hours to remove metal particles from break-in.'
        },
        {
          question: 'What daily check is most important before starting tractor?',
          options: ['Paint condition', 'Engine oil level', 'Horn sound', 'Seat cover'],
          correctIndex: 1,
          explanation: 'Checking engine oil level daily is crucial. Running with low oil for even a few hours can cause serious engine damage costing lakhs to repair.'
        },
        {
          question: 'At what grain moisture level should combine harvesting be done?',
          options: ['5-10%', '14-18%', '25-30%', 'Any moisture works'],
          correctIndex: 1,
          explanation: 'Harvest at 14-18% moisture for best results. Too wet causes storage problems and combine blockage. Too dry causes grain shattering losses.'
        },
        {
          question: 'What subsidy percentage do small farmers get under SMAM?',
          options: ['10-15%', '25-30%', '40-50%', '75-80%'],
          correctIndex: 2,
          explanation: 'Small and marginal farmers get 40-50% subsidy under SMAM (Sub-Mission on Agricultural Mechanization). Other farmers get 25-40%.'
        },
        {
          question: 'What is the FIRST step to get equipment subsidy?',
          options: ['Buy equipment first', 'Register on DBT portal', 'Contact dealer', 'Take bank loan'],
          correctIndex: 1,
          explanation: 'FIRST register on DBT Agriculture portal, then apply for scheme. If you buy equipment before getting approval, you will NOT get subsidy.'
        },
        {
          question: 'How much grain loss can combine harvester reduce compared to manual?',
          options: ['No difference', 'From 5% to 2%', 'From 20% to 10%', 'From 50% to 25%'],
          correctIndex: 1,
          explanation: 'Combine harvesters reduce grain loss from about 5% (manual) to about 2%. This saving can offset the higher cost for large farms.'
        }
      ]
    }
  }
];

// ===========================================
// SMART FARMING / TECHNOLOGY COURSE CONTENT
// ===========================================
export const SMART_FARMING_CONTENT: LessonContent[] = [
  {
    title: 'Introduction to Smart Farming',
    description: 'How technology is changing farming - overview for Indian farmers.',
    content_type: 'video',
    content_url: 'https://www.youtube.com/watch?v=VzXQ0xUZ6L0',
    duration: '10 min',
    is_preview: true,
  },
  {
    title: 'Weather Apps & Forecasting',
    description: 'Use smartphone apps to plan farming activities better.',
    content_type: 'text',
    duration: '12 min',
    is_preview: false,
    article: {
      introduction: 'Your smartphone can predict weather better than traditional methods. Accurate weather forecasts help you plan sowing, spraying, irrigation, and harvesting. This lesson shows you the best free apps for Indian farmers.',
      sections: [
        {
          title: '📱 Best Weather Apps for Farmers',
          content: 'MEGHDOOT (IMD Official App):\n• Free, in Hindi/regional languages\n• District-level 5-day forecast\n• Crop-specific advisories\n• Download: Google Play Store\n\nKISAN SUVIDHA:\n• Integrated farming app\n• Weather + market prices + tips\n• Available in 12 languages\n\nDAMINI (Lightning Alert):\n• Real-time lightning warnings\n• Life-saving during monsoon\n• Alerts for your location',
          tips: [
            'Check weather every morning before farm work',
            'Enable notifications for rain alerts',
            'Compare 2-3 apps for accuracy',
            'Share forecasts in farmer WhatsApp groups'
          ]
        },
        {
          title: '🌧️ Using Weather for Farm Decisions',
          content: 'BEFORE SOWING:\n• Check 7-day forecast for monsoon arrival\n• Sow 2-3 days before expected rain\n\nSPRAYING PESTICIDES:\n• No rain expected for 24-48 hours\n• Low wind speed (<10 km/h)\n• Morning (6-9 AM) is best time\n\nHARVESTING:\n• Plan for 3-4 clear days\n• Check humidity for grain drying',
        },
        {
          title: '🔔 Setting Up Weather Alerts',
          content: 'IMPORTANT ALERTS TO ENABLE:\n• Heavy rain warning (>50mm)\n• Hailstorm alert\n• Lightning warning\n• Extreme temperature\n• High wind speed\n\nIn Meghdoot and similar apps, go to Settings → Notifications → Enable all relevant alerts',
          tips: [
            'Add your exact village location for accuracy',
            'Check both IMD (Meghdoot) and private apps',
            'Weather changes - check multiple times per day',
            'Prepare for extremes: store equipment, cover crops'
          ]
        }
      ],
      commonMistakes: [
        'Checking weather once and forgetting to recheck',
        'Not downloading district-specific apps',
        'Ignoring weather alerts and notifications',
        'Relying only on traditional prediction methods',
        'Not having backup plan for weather changes'
      ],
      actionItems: [
        'Download Meghdoot app from Play Store now',
        'Set your village/district location accurately',
        'Enable all weather alert notifications',
        'Check weather forecast every morning this week',
        'Share useful weather info with neighbor farmers'
      ],
      summary: 'Free apps like Meghdoot give accurate 5-day forecasts. Check weather daily for sowing, spraying, and harvesting decisions. Enable alerts for rain, hail, and lightning. Even basic smartphones can access these life-saving features.'
    }
  },
  {
    title: 'Soil Sensors & IoT Basics',
    description: 'Simple sensors that measure soil moisture, temperature, and nutrients.',
    content_type: 'video',
    content_url: 'https://www.youtube.com/watch?v=GBvJiDGHuMo',
    duration: '11 min',
    is_preview: false,
  },
  {
    title: 'Quiz: Smart Farming Starter',
    description: 'Check your technology knowledge for farming.',
    content_type: 'quiz',
    duration: '8 min',
    is_preview: false,
    quiz: {
      questions: [
        {
          question: 'Which app is the official IMD weather app for farmers?',
          options: ['Weather.com', 'Meghdoot', 'AccuWeather', 'Facebook'],
          correctIndex: 1,
          explanation: 'Meghdoot is the official India Meteorological Department (IMD) app providing free, accurate weather forecasts specifically designed for Indian farmers.'
        },
        {
          question: 'What weather condition is best for spraying pesticides?',
          options: ['Heavy rain expected', 'Strong winds', 'No rain for 24-48 hours, low wind', 'Afternoon heat'],
          correctIndex: 2,
          explanation: 'Spray when no rain is expected for 24-48 hours and wind speed is low (<10 km/h). Rain washes off spray, wind causes drift.'
        },
        {
          question: 'What does DAMINI app warn about?',
          options: ['Market prices', 'Lightning strikes', 'Crop diseases', 'Government schemes'],
          correctIndex: 1,
          explanation: 'DAMINI is IMD\'s lightning alert app that gives real-time warnings about lightning in your area. Very important during monsoon to stay safe.'
        },
        {
          question: 'When is the best time to sow before rain?',
          options: ['During heavy rain', '2-3 days before expected rain', 'Immediately after rain', 'Rain doesn\'t matter'],
          correctIndex: 1,
          explanation: 'Sow 2-3 days before expected rain. Seeds get moisture for germination, and soil is workable. Sowing during rain makes field muddy and difficult to work.'
        },
        {
          question: 'How many clear days should you check forecast for before harvesting?',
          options: ['1 day', '2-3 days', '3-4 days', '7 days'],
          correctIndex: 2,
          explanation: 'Check for 3-4 clear days before harvesting. You need time to cut, dry, and store the grain. Unexpected rain can damage harvested crop.'
        }
      ]
    }
  }
];
