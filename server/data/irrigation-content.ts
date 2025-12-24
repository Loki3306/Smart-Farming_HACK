// Irrigation Course Content
import { LessonContent } from './lesson-content';

// ===========================================
// IRRIGATION COURSE CONTENT
// ===========================================
export const IRRIGATION_CONTENT: LessonContent[] = [
  {
    title: 'Smart Irrigation Basics',
    description: 'Understand how modern irrigation systems save water and increase crop yield.',
    content_type: 'video',
    // Real video on drip irrigation from Indian agriculture channel
    content_url: 'https://www.youtube.com/watch?v=E8mFP0_NRSA',
    duration: '11 min',
    is_preview: true,
  },
  {
    title: 'Drip vs Sprinkler Systems',
    description: 'Learn which irrigation system is best for your crops and land.',
    content_type: 'text',
    duration: '15 min',
    is_preview: false,
    article: {
      introduction: 'Choosing the right irrigation system can reduce your water bill by 40-60% while improving crop health. Let\'s understand the differences between drip and sprinkler systems so you can make the best choice for your farm.',
      sections: [
        {
          title: '💧 What is Drip Irrigation?',
          content: 'Drip irrigation delivers water slowly, drop by drop, directly to plant roots through small tubes. Think of it like giving each plant its own water bottle. This method is best for row crops like vegetables, fruits, and cotton.',
          tips: [
            'Water savings: 40-60% compared to flood irrigation',
            'Best for: Vegetables, fruits, sugarcane, cotton',
            'Initial cost is higher but saves money long-term',
            'Government subsidies available up to 55% under PM-KUSUM'
          ]
        },
        {
          title: '🌧️ What is Sprinkler Irrigation?',
          content: 'Sprinkler irrigation sprays water into the air like rain. It covers large areas and is good for crops that benefit from wet leaves like wheat, groundnut, and fodder crops. It\'s also great for uneven land.',
          tips: [
            'Water savings: 30-40% compared to flood irrigation',
            'Best for: Wheat, groundnut, pulses, fodder',
            'Works well on slopes and uneven land',
            'Easier to install than drip for large areas'
          ]
        },
        {
          title: '📊 Quick Comparison Table',
          content: 'DRIP IRRIGATION:\n• Water efficiency: 90-95%\n• Best for: Row crops, orchards\n• Fertilizer delivery: Yes (fertigation)\n• Weed control: Less weeds\n• Initial cost: Higher\n\nSPRINKLER IRRIGATION:\n• Water efficiency: 70-80%\n• Best for: Field crops, uneven land\n• Fertilizer delivery: Limited\n• Weed control: More weeds\n• Initial cost: Medium',
        },
        {
          title: '🤖 Smart Irrigation with Sensors',
          content: 'Modern farms use soil moisture sensors to know exactly when to water. The sensor checks if soil is dry or wet and tells you through your phone. This prevents both over-watering and under-watering.',
          tips: [
            'Soil moisture sensors cost ₹500-2000 each',
            'Place sensors at root depth of your crop',
            'Check sensor readings daily in summer',
            'Our app can automate irrigation based on sensor data'
          ]
        },
        {
          title: '💰 Government Subsidies Available',
          content: 'The Indian government provides 55-90% subsidy for micro-irrigation:\n\n• PM-KUSUM: Up to 90% subsidy for solar pumps\n• PMKSY: 55% subsidy for drip/sprinkler systems\n• Small farmers get higher subsidy rates\n\nApply through your local agriculture office or state agriculture website.',
        }
      ],
      commonMistakes: [
        'Installing drip on crops that need sprinkler (like wheat)',
        'Not cleaning filters regularly - blocks the drippers',
        'Using poor quality pipes that crack in sunlight',
        'Ignoring pressure requirements - too high damages pipes',
        'Not calculating water requirement before installation'
      ],
      actionItems: [
        'Calculate daily water need for your crop (liters per plant)',
        'Visit a nearby farm with drip/sprinkler to see working system',
        'Get quotation from 2-3 irrigation companies',
        'Apply for subsidy at agriculture office before purchase',
        'Install soil moisture sensor to know when crops need water'
      ],
      summary: 'Drip irrigation is best for vegetables and fruits, saving 40-60% water. Sprinkler works better for wheat and field crops on uneven land. Both have government subsidies up to 55-90%. Combine with soil sensors for smart, automated irrigation.'
    }
  },
  {
    title: 'Water Scheduling Strategies',
    description: 'Learn when and how much to water your crops for best results.',
    content_type: 'text',
    duration: '12 min',
    is_preview: false,
    article: {
      introduction: 'Watering at the right time is just as important as using the right system. Many farmers water too much or at the wrong time, wasting water and harming crops. This lesson teaches you the smart way to schedule irrigation.',
      sections: [
        {
          title: '⏰ Best Time to Water',
          content: 'The best time to irrigate is early morning (6-9 AM) or late evening (after 5 PM). During midday, 30-40% of water evaporates before reaching roots. Morning watering is best because:\n• Less evaporation\n• Plants use water all day\n• Leaves dry quickly, preventing disease',
          tips: [
            'NEVER water during 11 AM - 3 PM in summer',
            'Evening watering is second best option',
            'Wet leaves at night can cause fungal diseases'
          ]
        },
        {
          title: '📱 Using Weather Forecasts',
          content: 'Smart farmers check weather before irrigating. If rain is expected in 1-2 days, skip irrigation and save water. Our app shows 5-day weather forecast and alerts you before rain.',
          tips: [
            'Check weather forecast before every irrigation',
            'Light rain (< 5mm) may not be enough - still irrigate',
            'Heavy rain (> 20mm) means skip 2-3 days of irrigation',
            'Cloudy days need less water than sunny days'
          ]
        },
        {
          title: '🌡️ Adjusting for Crop Stage',
          content: 'Water needs change as crops grow:\n\nSEEDLING STAGE: Light, frequent watering (daily)\nVEGETATIVE STAGE: Medium water, every 2-3 days\nFLOWERING STAGE: Most critical - never let soil dry\nFRUITING/GRAIN FILLING: Regular water for good yield\nMATURITY: Reduce water gradually',
        },
        {
          title: '🔬 The Finger Test',
          content: 'No sensor? Use the finger test:\n1. Push your finger 2 inches into soil\n2. If soil feels dry - water immediately\n3. If soil feels moist - wait 1-2 days\n4. If soil sticks to finger (wet) - no watering needed\n\nThis simple test prevents both over and under watering.',
        }
      ],
      commonMistakes: [
        'Watering on a fixed schedule without checking soil',
        'Watering in the afternoon when evaporation is highest',
        'Giving too much water at once instead of smaller amounts',
        'Irrigating just before rain - wasting water',
        'Not adjusting water for cloudy vs sunny days'
      ],
      actionItems: [
        'Set phone reminder for morning irrigation (6-7 AM)',
        'Download a weather app and check before each irrigation',
        'Practice the finger test on your field today',
        'Note your crop\'s current growth stage in farm diary',
        'Calculate how many liters each plant needs per day'
      ],
      summary: 'Water early morning (6-9 AM) or evening to reduce evaporation. Always check weather forecast before irrigating. Use the finger test - if soil 2 inches deep is dry, it\'s time to water. Adjust water amount based on crop growth stage.'
    }
  },
  {
    title: 'Maintenance & Troubleshooting',
    description: 'Keep your irrigation system running smoothly with these maintenance tips.',
    content_type: 'video',
    // Real drip system maintenance video
    content_url: 'https://www.youtube.com/watch?v=DnIWdxGqpGQ',
    duration: '14 min',
    is_preview: false,
  },
  {
    title: 'Quiz: Irrigation Mastery',
    description: 'Test your knowledge of smart irrigation techniques.',
    content_type: 'quiz',
    duration: '10 min',
    is_preview: false,
    quiz: {
      questions: [
        {
          question: 'What is the best time to irrigate your crops?',
          options: ['12 PM - 2 PM (midday)', '6 AM - 9 AM (morning)', '1 PM - 4 PM (afternoon)', 'Anytime is fine'],
          correctIndex: 1,
          explanation: 'Early morning (6-9 AM) is the best time because evaporation is lowest and plants can use water throughout the day. Midday irrigation loses 30-40% water to evaporation.'
        },
        {
          question: 'How much water does drip irrigation save compared to flood irrigation?',
          options: ['10-20%', '20-30%', '40-60%', '80-90%'],
          correctIndex: 2,
          explanation: 'Drip irrigation saves 40-60% water compared to traditional flood irrigation by delivering water directly to plant roots, reducing evaporation and runoff.'
        },
        {
          question: 'If heavy rain (>20mm) is expected tomorrow, what should you do?',
          options: ['Irrigate extra today to store water', 'Skip irrigation for 2-3 days', 'Continue normal irrigation', 'Irrigate immediately after rain'],
          correctIndex: 1,
          explanation: 'Heavy rain (>20mm) provides enough moisture. Skip irrigation for 2-3 days to avoid waterlogging and save water. Check soil moisture before resuming.'
        },
        {
          question: 'During which crop stage is water MOST critical?',
          options: ['Seedling stage', 'Vegetative stage', 'Flowering stage', 'Maturity stage'],
          correctIndex: 2,
          explanation: 'Flowering stage is most critical for water. Stress during flowering causes flower drop and poor fruit/grain formation, directly reducing yield.'
        },
        {
          question: 'In the finger test, how deep should you check soil moisture?',
          options: ['Surface level', '2 inches deep', '6 inches deep', '12 inches deep'],
          correctIndex: 1,
          explanation: 'Check soil moisture 2 inches deep (about finger length). Surface can be dry while roots have enough water. This depth shows actual root zone moisture.'
        },
        {
          question: 'Which irrigation system is best for wheat crop?',
          options: ['Drip irrigation', 'Sprinkler irrigation', 'Flood irrigation only', 'No irrigation needed'],
          correctIndex: 1,
          explanation: 'Sprinkler irrigation is ideal for wheat because it covers large areas efficiently and wheat benefits from overhead watering. Drip is better for row crops like vegetables.'
        },
        {
          question: 'What is the water efficiency of drip irrigation?',
          options: ['50-60%', '70-80%', '90-95%', '100%'],
          correctIndex: 2,
          explanation: 'Drip irrigation has 90-95% water efficiency because water goes directly to roots with minimal evaporation or runoff. This is the highest among all irrigation methods.'
        }
      ]
    }
  }
];
