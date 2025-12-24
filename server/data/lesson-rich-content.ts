// Rich Lesson Content Database
// This file contains detailed articles for all text-based lessons

export const LESSON_RICH_CONTENT: Record<string, any> = {
  // ============================================
  // ORGANIC FARMING CONTENT
  // ============================================
  
  'Soil Preparation & Composting': {
    introduction: `मिट्टी की तैयारी और कम्पोस्टिंग जैविक खेती की नींव है। स्वस्थ मिट्टी = स्वस्थ फसल = स्वस्थ आय।

Healthy soil is the foundation of successful organic farming. Just like a strong house needs a solid foundation, your crops need nutrient-rich soil to grow well.`,
    sections: [
      {
        title: '🌱 Why Soil Health Matters / मिट्टी का स्वास्थ्य क्यों जरूरी है',
        content: `Think of soil as a living thing - it contains millions of tiny organisms that help your crops grow.

**Benefits of healthy soil:**
• Holds water better - saves 30% irrigation water
• Provides natural nutrients to plants  
• Fights off diseases naturally
• Improves yield by 20-30% within 2-3 years

**Simple test:** Take a handful of your soil. Good soil should feel crumbly (भुरभुरी), not hard like stone.`,
        tips: [
          'Test your soil every 6 months at local KVK (₹50-100)',
          'Healthy soil smells like fresh earth after rain',
          'Add organic matter every season for best results'
        ]
      },
      {
        title: '🥬 How to Make Perfect Compost / खाद कैसे बनाएं',
        content: `Composting is FREE fertilizer from farm waste!

**The Golden Ratio: 3:1**
• 3 parts BROWN (सूखी पत्तियां, पुआल, सूखी घास)
• 1 part GREEN (ताजी घास, सब्जी के छिलके, गोबर)

**Timeline:**
• Summer: Ready in 6-8 weeks
• Winter: Takes 3-4 months
• Monsoon: 8-10 weeks (keep covered!)`,
        tips: [
          'Turn pile every 2 weeks with a fork',
          'Squeeze test: Only 2-3 drops of water should come',
          'Add cow urine to speed up decomposition',
          'Ready compost looks dark and smells like earth'
        ]
      },
      {
        title: '🔧 Step-by-Step Process / कदम-दर-कदम तरीका',
        content: `**Day 1: Setup**
1. Choose shady spot near water source
2. Dig pit: 4ft x 4ft x 3ft deep  
3. Base layer: 6 inches twigs/straw

**Week 1-2: Building**
4. Add 6" brown material (dry leaves)
5. Add 2" green material (fresh waste)
6. Sprinkle old compost or soil
7. Add thin layer of cow dung
8. Repeat layers until full

**Ongoing Care:**
9. Keep moist like squeezed sponge
10. Cover with banana leaves
11. Turn every 14 days

**Cost: ₹0 | Value: ₹500-800/quintal**`
      }
    ],
    commonMistakes: [
      'Pile too wet - add more dry materials',
      'Pile too dry - sprinkle water',
      'Bad smell - needs more turning',
      'Not decomposing - add cow dung activator'
    ],
    actionItems: [
      '📋 This week: Start a 4x4 feet compost pit',
      '🌿 Collect dry leaves and straw',
      '🥕 Save kitchen vegetable waste',
      '🧪 Get soil test done at local KVK'
    ],
    summary: `खाद बनाना आसान है: 3 भाग सूखा + 1 भाग हरा, नम रखें, 2 हफ्ते में पलटें।
Composting saves ₹5000-10000 per acre per year!`
  },

  'Organic Certification Process': {
    introduction: `जैविक प्रमाणपत्र से 20-50% अधिक कीमत मिलती है। PGS-India से शुरू करें।

Organic certification opens doors to premium prices - 20-50% more than regular produce.`,
    sections: [
      {
        title: '📜 Types of Certification / प्रमाणपत्र के प्रकार',
        content: `**1. PGS-India (Easier, Cheaper)**
• For local markets
• Cost: ₹0-500
• Time: 1 year
• Best for: Small farmers

**2. Third-Party (NPOP)**
• For export markets
• Cost: ₹15,000-50,000/year  
• Time: 2-3 years
• Best for: Large farms`,
        tips: [
          'Start with PGS - easier and cheaper',
          'Join a group of 5+ farmers',
          'Government gives 50% subsidy'
        ]
      },
      {
        title: '📋 PGS Steps / PGS के कदम',
        content: `**Step 1:** Form group of 5+ farmers
**Step 2:** Register on pgsindia-ncof.gov.in
**Step 3:** Follow organic for 1 year
**Step 4:** Peer inspection by other farmers
**Step 5:** Receive certificate

**Documents needed:**
• Farm map/sketch
• Input records
• Crop history
• Sales records`
      },
      {
        title: '💰 Benefits / फायदे',
        content: `**Price Premium:**
| Crop | Regular | Organic | Extra |
|------|---------|---------|-------|
| Wheat | ₹2000/q | ₹2800/q | +40% |
| Rice | ₹1800/q | ₹2500/q | +39% |
| Vegetables | ₹20/kg | ₹35/kg | +75% |

**Government Support:**
• PKVY: ₹50,000/ha over 3 years
• Free training
• Market linkage`
      }
    ],
    commonMistakes: [
      'Not maintaining records from day one',
      'Contamination from neighboring farms',
      'Using non-approved inputs'
    ],
    actionItems: [
      '📝 Start a farm diary today',
      '👥 Talk to 5 neighboring farmers',
      '🌐 Visit pgsindia-ncof.gov.in',
      '📞 Contact local KVK'
    ],
    summary: `PGS = Form group → Register → 1 year organic → Certified → Earn 20-50% more!`
  },

  // ============================================
  // IRRIGATION CONTENT
  // ============================================

  'Smart Irrigation Basics': {
    introduction: `पानी बचाएं, पैसा कमाएं! ड्रिप से 40-60% पानी बचत और 20-30% अधिक उपज।

Smart irrigation = Right water + Right time. Saves 40-60% water, increases yield 20-30%.`,
    sections: [
      {
        title: '💧 Irrigation Types / सिंचाई के प्रकार',
        content: `**1. Flood (Traditional)**
• Efficiency: 30-40%
• Water waste: HIGH
• Best for: Rice

**2. Drip (Recommended)**
• Efficiency: 90-95%
• Subsidy: 55-90%
• Cost: ₹25-50k/acre
• Best for: Vegetables, fruits

**3. Sprinkler**
• Efficiency: 70-80%
• Cost: ₹15-30k/acre
• Best for: Wheat, pulses`,
        tips: [
          'Government subsidy covers 55-90% of drip cost',
          'Drip pays back in 1-2 seasons',
          'Combine with mulching for best results'
        ]
      },
      {
        title: '⏰ When to Water / कब पानी दें',
        content: `**Best times:**
• Morning 6-8 AM (BEST)
• Evening 5-7 PM (Good)
• AVOID afternoon (evaporation)

**Soil Check:**
Push finger 2" into soil:
• Dry = Water needed
• Moist = Wait

**Critical Stages (Never miss!):**
• Germination
• Flowering  
• Fruit filling`,
        tips: [
          'Miss flowering irrigation = 30-40% yield loss',
          'Light, frequent > Heavy, rare',
          'Mulching reduces need by 25%'
        ]
      }
    ],
    commonMistakes: [
      'Watering at noon (50% lost)',
      'Over-watering (root rot)',
      'Not cleaning drip filters'
    ],
    actionItems: [
      '💧 Check soil before watering',
      '📞 Apply for drip subsidy',
      '📋 Make watering schedule',
      '🛠️ Clean filters weekly'
    ],
    summary: `ड्रिप = 50% पानी बचत + 25% अधिक उपज। सब्सिडी 55-90% उपलब्ध!`
  },

  'Water Scheduling Strategies': {
    introduction: `सही टाइमिंग से फसल की गुणवत्ता और मात्रा दोनों बढ़ती है।

Timing is as important as amount. Right scheduling improves both yield and quality.`,
    sections: [
      {
        title: '📊 Water Requirements / पानी की जरूरत',
        content: `**Per acre per season:**
| Crop | Water (mm) | Times |
|------|------------|-------|
| Wheat | 450-500 | 4-6 |
| Rice | 1200-1400 | Daily |
| Cotton | 700-800 | 6-8 |
| Tomato | 600-700 | 15-20 |

**Critical stages:**
• Germination: Essential
• Flowering: Most critical
• Grain filling: Important`,
        tips: [
          'Miss flowering = 30-40% loss',
          'Use weather apps for planning',
          'Mulch to reduce evaporation'
        ]
      },
      {
        title: '🌡️ Season-wise / मौसम के हिसाब से',
        content: `**Summer:**
• Every 3-4 days
• Morning/evening only
• Add 25% more water
• Use mulch

**Monsoon:**
• Check soil first
• Skip if rain expected
• Ensure drainage

**Winter:**
• Every 7-10 days
• Reduce 20%
• Watch for frost`
      },
      {
        title: '💡 Water Saving Tips / बचत के तरीके',
        content: `**1. Mulching**
Saves 25-30% water
Cost: ₹2000-5000/acre

**2. Rainwater Harvesting**
Build farm pond
Store monsoon water

**3. Deficit Irrigation**
Give 80% of need
Save 20%, lose only 5% yield

**Free Apps:**
• Meghdoot (IMD)
• Kisan Suvidha
• IFFCO Kisan`
      }
    ],
    commonMistakes: [
      'Same schedule all seasons',
      'Ignoring weather forecast',
      'Watering by schedule, not need'
    ],
    actionItems: [
      '📱 Download Meghdoot app',
      '📅 Create watering calendar',
      '🌾 Apply mulch this week',
      '💧 Install rain gauge'
    ],
    summary: `Right amount + Right time = Best results. Check weather, water morning/evening, never miss critical stages!`
  },

  // ============================================
  // PEST MANAGEMENT CONTENT  
  // ============================================

  'Identifying Common Farm Pests': {
    introduction: `अपने दुश्मन को पहचानें! पहचान = सफल नियंत्रण।

Know your enemy! Identification is the first step to successful pest control.`,
    sections: [
      {
        title: '🐛 Sucking Pests / रस चूसने वाले',
        content: `**1. Aphids (माहू)**
• Size: 1-3mm, green/black
• Damage: Yellow leaves
• Crops: All vegetables, cotton

**2. Whitefly (सफेद मक्खी)**
• Size: 1mm, white wings
• Damage: Yellow leaves, mold
• Crops: Cotton, tomato

**3. Thrips**
• Size: 1mm, brown
• Damage: Silver streaks
• Crops: Onion, chilli

**4. Jassids (हरा फुदका)**
• Size: 2-3mm, green
• Damage: Brown leaf edges
• Crops: Cotton, okra`,
        tips: [
          'Check leaf undersides',
          'Yellow sticky traps catch them',
          'Spray neem oil early'
        ]
      },
      {
        title: '🐛 Chewing Pests / काटने वाले',
        content: `**5. Bollworm (सूंडी)**
• Size: 3-4cm caterpillar
• Damage: Holes in fruits
• Crops: Cotton, tomato

**6. Stem Borer (तना छेदक)**
• Size: 2-3cm
• Damage: Dead hearts
• Crops: Rice, sugarcane

**7. Fruit Borer**
• Size: 2-4cm green
• Damage: Fruit holes
• Crops: Tomato, brinjal`,
        tips: [
          'Pheromone traps for bollworm',
          'Bird perches help',
          'Hand-pick in morning'
        ]
      },
      {
        title: '🔬 Early Warning / पहचान कैसे करें',
        content: `**Daily Check:**
□ 10 random plants
□ Leaf undersides
□ New growth tips
□ Flowers and fruits

**Action Threshold:**
| Pest | Spray when |
|------|------------|
| Aphids | 10+ per leaf |
| Whitefly | 5+ per leaf |
| Bollworm | 1 per plant |`
      }
    ],
    commonMistakes: [
      'Waiting too long',
      'Not checking under leaves',
      'Spraying without identification'
    ],
    actionItems: [
      '🔍 Scout field tomorrow morning',
      '📸 Photo any pests found',
      '📒 Start pest diary',
      '🪤 Install yellow sticky traps'
    ],
    summary: `रोज 10 पौधे जांचें, पत्तों के नीचे देखें। जल्दी पकड़ें = आसान नियंत्रण!`
  },

  'Biological Pest Control': {
    introduction: `प्रकृति में हर कीट का दुश्मन है। जैविक नियंत्रण सस्ता और सुरक्षित है।

Nature has a solution for every pest. Bio-control is cheaper and safer.`,
    sections: [
      {
        title: '🐞 Beneficial Insects / मित्र कीट',
        content: `**Ladybird Beetle**
• Eats: Aphids, whiteflies
• 1 ladybird = 50+ aphids/day
• Attract with: Marigold flowers

**Trichogramma Wasp**
• Parasitizes: Bollworm eggs
• Release: 50,000/acre
• Cost: ₹100-150/card
• Available: KVK`,
        tips: [
          'Don\'t spray chemicals - kills friends too',
          'Plant flowers on borders',
          'Release Trichogramma every 7 days'
        ]
      },
      {
        title: '🦠 Bio-Pesticides / जैव कीटनाशक',
        content: `**1. Neem Oil**
• Controls: 200+ pests
• Dose: 5ml/liter
• Safe for bees
• Cost: ₹300-400/L

**2. Beauveria bassiana**
• Controls: Whitefly, borers
• Dose: 5g/liter
• Works in 5-7 days

**3. Bt (Bacillus thuringiensis)**
• Controls: All caterpillars
• Dose: 1g/liter
• Spray evening`
      },
      {
        title: '🌿 DIY Sprays / घर पर बनाएं',
        content: `**Neem-Garlic Spray:**
• 1kg neem leaves
• 200g garlic
• 10L water
• Soak overnight, filter, spray

**Chilli Spray:**
• 500g chillies
• 10L water
• Boil, cool, spray
⚠️ Wear gloves!`
      }
    ],
    commonMistakes: [
      'Expecting instant results',
      'Mixing bio with chemicals',
      'Spraying in hot sun'
    ],
    actionItems: [
      '🌿 Make neem spray this week',
      '🐞 Don\'t kill ladybirds!',
      '📞 Ask KVK about Trichogramma',
      '🌻 Plant marigold on borders'
    ],
    summary: `नीम स्प्रे बनाएं, मित्र कीट बचाएं, ट्राइकोग्रामा का प्रयोग करें। सस्ता और सुरक्षित!`
  },

  'Safe Chemical Usage': {
    introduction: `कभी-कभी रासायनिक कीटनाशक जरूरी होते हैं। सुरक्षित उपयोग जानें।

Sometimes chemicals are necessary. Learn to use them safely and effectively.`,
    sections: [
      {
        title: '⚠️ Safety First / सुरक्षा पहले',
        content: `**PPE Required:**
• Long-sleeved shirt
• Full pants
• Rubber gloves
• Face mask (N95)
• Eye protection
• Rubber boots

**Do NOT spray when:**
• Windy (drift danger)
• Very hot (evaporates)
• Rain expected (washes off)
• Bees are active`,
        tips: [
          'Never eat/drink while spraying',
          'Wash hands immediately after',
          'Store chemicals locked away from food'
        ]
      },
      {
        title: '📋 Spray Guidelines / स्प्रे नियम',
        content: `**Best time:** Early morning or evening
**Direction:** With wind, not against
**Waiting period:** Don't harvest until safe

**Common Chemicals:**
| Chemical | For | Wait Days |
|----------|-----|-----------|
| Imidacloprid | Sucking pests | 14 |
| Chlorpyrifos | Borers | 21 |
| Mancozeb | Fungus | 7 |`
      }
    ],
    commonMistakes: [
      'No safety equipment',
      'Over-dosing (thinking more is better)',
      'Harvesting too soon',
      'Mixing incompatible chemicals'
    ],
    actionItems: [
      '🥽 Buy safety equipment',
      '📖 Read label before using',
      '📅 Note spray date',
      '⏰ Wait full period before harvest'
    ],
    summary: `Safety gear + Right dose + Right time = Effective and safe use. Always read the label!`
  },

  // ============================================
  // SOIL HEALTH CONTENT
  // ============================================

  'Understanding Soil pH': {
    introduction: `pH 6-7 = Happy crops! मिट्टी का pH फसल की सेहत का राज है।

Soil pH determines nutrient availability. Right pH means healthy crops.`,
    sections: [
      {
        title: '🧪 What is pH? / pH क्या है',
        content: `**The Scale:**
• 0-6: Acidic (sour like lemon)
• 7: Neutral (like water)
• 8-14: Alkaline (like soap)

**Ideal pH:**
| Crop | Best pH |
|------|---------|
| Rice | 5.5-6.5 |
| Wheat | 6.0-7.0 |
| Vegetables | 6.0-7.0 |
| Cotton | 6.5-7.5 |

**Why it matters:**
• Low pH = Iron toxicity
• High pH = Zinc deficiency
• Right pH = All nutrients available`,
        tips: [
          'Test before every season',
          'pH changes slowly - be patient',
          'Rain makes soil acidic over time'
        ]
      },
      {
        title: '📊 How to Test / कैसे जांचें',
        content: `**Method 1: Lab Test**
• Most accurate (₹50-100)
• Full nutrient report
• At KVK or university

**Method 2: pH Paper**
• Quick home test (₹200-500)
• Mix soil 1:2 with water
• Match paper color

**Sample Collection:**
1. 6 inches depth
2. 10 spots in field
3. Mix all together
4. Send 500g to lab`
      },
      {
        title: '⚗️ How to Correct / कैसे सुधारें',
        content: `**Low pH (Acidic):**
• Add lime: 2-4 quintal/acre
• Apply 1 month before sowing

**High pH (Alkaline):**
• Add gypsum: 3-5 quintal/acre
• Apply before monsoon

**Time for change:**
• Lime/Gypsum: 3-6 months
• Organic: 1-2 years`
      }
    ],
    commonMistakes: [
      'Never testing pH',
      'Adding lime without testing',
      'Expecting instant results'
    ],
    actionItems: [
      '🧪 Test pH this month',
      '📝 Record results',
      '🧮 Calculate correction needed',
      '📅 Plan before next season'
    ],
    summary: `pH 6-7 = Happy crops! Test every season, correct slowly with lime or gypsum.`
  },

  'Nutrient Management (NPK)': {
    introduction: `NPK = फसल का भोजन। सही संतुलन से उपज दोगुनी हो सकती है।

NPK is food for crops. Right balance can double your yield.`,
    sections: [
      {
        title: '🧬 Understanding NPK',
        content: `**N - Nitrogen**
• Role: Leaf growth, green color
• Deficiency: Yellow leaves
• Sources: Urea, DAP, compost

**P - Phosphorus**
• Role: Roots, flowering
• Deficiency: Purple leaves
• Sources: DAP, SSP

**K - Potassium**
• Role: Disease resistance
• Deficiency: Brown edges
• Sources: MOP, wood ash

**Balance:**
• Vegetables: 4:2:1
• Grains: 2:1:1
• Fruits: 1:1:2`,
        tips: [
          'Always base on soil test',
          'Split nitrogen into 2-3 doses',
          'Phosphorus only at sowing'
        ]
      },
      {
        title: '📋 Fertilizer Guide',
        content: `**Wheat (per acre):**
• Basal: 50kg DAP + 25kg MOP
• 21 days: 25kg Urea
• 45 days: 25kg Urea
• Cost: ~₹3000

**Rice (per acre):**
• Basal: 60kg DAP + 30kg MOP
• Tillering: 30kg Urea
• Panicle: 20kg Urea
• Cost: ~₹3500`
      },
      {
        title: '🌿 Organic Options',
        content: `**For Nitrogen:**
• Vermicompost: 2 ton = 20kg N
• FYM: 10 ton = 50kg N
• Green manure: 40-60kg N

**For Phosphorus:**
• Bone meal: 40% P
• PSB bacteria

**Cost Comparison:**
Chemical: ₹3000-5000/acre
Organic: ₹2000-4000/acre`
      }
    ],
    commonMistakes: [
      'Same fertilizer every year',
      'Too much nitrogen',
      'Skipping potash'
    ],
    actionItems: [
      '📊 Get soil NPK test',
      '📝 Make fertilizer plan',
      '🌱 Try vermicompost',
      '💰 Compare costs'
    ],
    summary: `N=पत्ते, P=जड़/फूल, K=गुणवत्ता। Always test first, balance organic + chemical is best!`
  },

  'Soil Testing Guide': {
    introduction: `मिट्टी परीक्षण = सही खाद = बेहतर उपज = कम खर्च।

Soil testing tells you exactly what your soil needs. No guessing!`,
    sections: [
      {
        title: '🔬 Why Test? / क्यों जांचें',
        content: `**Benefits:**
• Know exact nutrient levels
• Apply right amount of fertilizer
• Save 20-30% on fertilizer cost
• Better yield

**Test for:**
• pH level
• N, P, K levels
• Organic carbon
• Micronutrients (Zn, Fe, Mn)`,
        tips: [
          'Test every 6 months',
          'Test after harvesting',
          'Keep all reports for 5 years'
        ]
      },
      {
        title: '📋 Collection Steps',
        content: `**When:** After harvest, before sowing

**How:**
1. Clean your tools
2. Go to 10 random spots
3. Dig 6 inches deep
4. Take slice from side
5. Mix all samples
6. Fill 500g in clean bag
7. Label with date and location

**Don't sample from:**
• Near trees
• Manure heaps
• Waterlogged areas`
      },
      {
        title: '📍 Where to Test',
        content: `**Free/Subsidized:**
• KVK (Krishi Vigyan Kendra)
• Soil Testing Labs
• Agriculture University

**Cost:** ₹50-150

**Time:** Results in 7-15 days

**Online:**
• Apply on soilhealth.dac.gov.in
• Get Soil Health Card`
      }
    ],
    commonMistakes: [
      'Not cleaning tools (contamination)',
      'Taking from one spot only',
      'Not labeling samples'
    ],
    actionItems: [
      '🧪 Collect sample this week',
      '📍 Find nearest testing lab',
      '📝 Apply for Soil Health Card',
      '📊 Compare with last results'
    ],
    summary: `Test soil → Know needs → Apply right fertilizer → Save money + Better yield!`
  },

  'Green Manuring': {
    introduction: `हरी खाद = मुफ्त नाइट्रोजन + बेहतर मिट्टी। बुवाई के 45 दिन पहले बोएं।

Green manure adds free nitrogen and improves soil structure naturally.`,
    sections: [
      {
        title: '🌿 What is Green Manuring?',
        content: `Growing plants and plowing them back into soil.

**Benefits:**
• Adds 40-60 kg N/acre FREE
• Improves soil structure
• Increases water retention
• Controls weeds
• Adds organic matter

**Best Crops:**
| Crop | N Added | Days |
|------|---------|------|
| Dhaincha | 60-80 kg | 45-50 |
| Sun hemp | 50-60 kg | 45-50 |
| Cowpea | 40-50 kg | 40-45 |`,
        tips: [
          'Plow in at flowering stage',
          'Wait 2 weeks before main crop',
          'Best before rice or wheat'
        ]
      },
      {
        title: '📋 How to Do It',
        content: `**Step 1:** Choose crop
• Dhaincha for clay soil
• Sun hemp for sandy soil

**Step 2:** Sow seeds
• 15-20 kg/acre
• Broadcast after light irrigation
• No fertilizer needed

**Step 3:** Wait 45-50 days
• Let it grow to flowering

**Step 4:** Plow in
• Use rotavator or disc plow
• Incorporate fully into soil
• Irrigate to help decomposition

**Step 5:** Wait 10-15 days
• Then sow main crop`
      }
    ],
    commonMistakes: [
      'Plowing too late (becomes woody)',
      'Not waiting after plowing',
      'Too thick sowing'
    ],
    actionItems: [
      '🌱 Buy dhaincha seeds',
      '📅 Plan 60 days before main crop',
      '🚜 Ensure rotavator available',
      '💧 Plan irrigation after plowing'
    ],
    summary: `Dhaincha/Sun hemp → 45 days → Plow in → Wait 2 weeks → Save ₹3000+ on urea!`
  },

  // ============================================
  // FARM EQUIPMENT CONTENT
  // ============================================

  'Routine Maintenance Checklist': {
    introduction: `रोजाना 15 मिनट की देखभाल = महंगी मरम्मत से बचाव। "Prevention is better than cure!"

Daily maintenance keeps your tractor running for 15+ years. Skip it and face ₹50,000+ repairs!`,
    sections: [
      {
        title: '☀️ Daily Checks (Every Morning)',
        content: `**Before Starting (5 minutes):**
☐ Engine oil level (dipstick between marks)
☐ Coolant level (radiator full when cold)
☐ Fuel level (never run empty!)
☐ Tire pressure (front: 25 psi, rear: 14 psi)
☐ Battery terminals (tight, no corrosion)

**Walk Around (2 minutes):**
☐ Check for fluid leaks underneath
☐ Look at tire condition
☐ Check lights are working
☐ Ensure mirrors are clean`,
        tips: [
          'Check oil BEFORE starting engine',
          'Low coolant = overheating = ₹15000 repair',
          'Morning check takes only 7 minutes'
        ]
      },
      {
        title: '📅 Weekly Checks (Sunday)',
        content: `**Every Sunday (20 minutes):**
☐ Clean air filter (tap out dust)
☐ Check hydraulic oil level
☐ Inspect fan belt (no cracks)
☐ Grease all fittings (8-10 points)
☐ Check brake fluid level
☐ Wash tractor body

**Greasing Points:**
• Front wheel bearings
• Steering joints
• Clutch linkage
• Three-point hitch
• PTO shaft`,
        tips: [
          'Use grease gun at all nipples',
          'Clean air filter saves 10% fuel',
          'Loose belt = no charging = dead battery'
        ]
      },
      {
        title: '📆 Monthly Checks (1st of Month)',
        content: `**Every Month (1 hour):**
☐ Change engine oil if 100+ hours
☐ Check clutch free play (1-2 inches)
☐ Inspect steering play
☐ Check all lights and horn
☐ Test brakes
☐ Clean fuel filter

**Oil Change Schedule:**
| Type | When |
|------|------|
| Engine oil | Every 100 hours |
| Hydraulic | Every 500 hours |
| Gear oil | Every 1000 hours |`
      },
      {
        title: '🛠️ Seasonal Checks',
        content: `**Before Monsoon:**
• Check all seals
• Apply rust protection
• Ensure wipers work

**Before Winter:**
• Check battery charge
• Use right grade oil
• Keep fuel tank full

**Before Heavy Work:**
• Full service
• Check all implements
• Grease everything`
      }
    ],
    commonMistakes: [
      'Skipping daily oil check',
      'Running on low coolant',
      'Never greasing moving parts',
      'Ignoring small leaks'
    ],
    actionItems: [
      '📋 Print this checklist',
      '🛢️ Buy extra engine oil',
      '🔧 Get grease gun',
      '📅 Set weekly reminder'
    ],
    summary: `Daily: Oil, coolant, tires. Weekly: Air filter, grease. Monthly: Change oil. Save ₹50,000+ in repairs!`
  },

  'Troubleshooting Common Issues': {
    introduction: `90% की समस्याएं घर पर ठीक हो सकती हैं! जानें कैसे।

Most tractor problems have simple solutions. Learn to fix them yourself and save money!`,
    sections: [
      {
        title: '🚫 Engine Won\'t Start',
        content: `**Possible Causes & Fixes:**

**1. Dead Battery**
• Symptoms: Click sound, no cranking
• Check: Headlights dim or off
• Fix: Jump start or charge battery
• Cost: ₹0 (jump) or ₹4000-8000 (new battery)

**2. Fuel Problem**
• Symptoms: Cranks but no start
• Check: Is there fuel? Check fuel filter
• Fix: Bleed fuel system, clean filter
• Cost: ₹0-200

**3. Air in Fuel Line**
• Symptoms: Runs rough, then stops
• Fix: Bleed at injector pumps
• How: Open bleeder, pump primer until no bubbles`,
        tips: [
          'Always keep battery terminals clean',
          'Never let fuel tank go completely empty',
          'Carry spare fuel filter'
        ]
      },
      {
        title: '🌡️ Engine Overheating',
        content: `**Stop Immediately! This is Serious!**

**1. Low Coolant**
• Check: Radiator level
• Fix: Add coolant + water (50:50)
• Find and fix leak

**2. Clogged Radiator**
• Check: Debris in front
• Fix: Clean with water spray (engine off!)

**3. Broken Fan Belt**
• Check: Belt missing or loose
• Fix: Replace or tighten
• Cost: ₹200-500

**4. Stuck Thermostat**
• Check: Upper hose not hot
• Fix: Replace thermostat
• Cost: ₹300-600`,
        tips: [
          'NEVER open radiator when hot',
          'Keep spare fan belt in toolbox',
          'Clean radiator weekly in dusty fields'
        ]
      },
      {
        title: '⚙️ Hydraulic Problems',
        content: `**1. Lift Not Working**
• Check: Hydraulic oil level
• Check: Control lever position
• Fix: Add oil, check for leaks

**2. Slow Lifting**
• Cause: Low oil or worn pump
• Fix: Top up oil first
• If continues: Visit mechanic

**3. Jerky Movement**
• Cause: Air in system
• Fix: Bleed hydraulic system
• How: Operate lift 10-15 times fully`,
        tips: [
          'Check hydraulic level when lift is down',
          'Use only recommended hydraulic oil',
          'Oil leaks = money leaks!'
        ]
      },
      {
        title: '🔧 Quick Fixes Tool Kit',
        content: `**Always Carry:**
• Spare fan belt
• Spare fuel filter
• 1L engine oil
• Basic spanners (10-24mm)
• Screwdrivers
• Pliers
• Electrical tape
• Jump cables
• Tire pump
• Jack

**Cost: ~₹1500-2000**
**Savings: ₹1000s in emergency calls!**`
      }
    ],
    commonMistakes: [
      'Continuing to run when overheating',
      'Not checking oil before suspecting bigger problems',
      'Ignoring warning lights'
    ],
    actionItems: [
      '🧰 Make emergency tool kit',
      '📱 Save mechanic number',
      '📝 Learn to bleed fuel system',
      '🔋 Check battery monthly'
    ],
    summary: `Most problems = simple fixes. Check basics first: fuel, oil, battery. Carry spares. When in doubt, STOP!`
  },

  // ============================================
  // MARKET & BUSINESS CONTENT  
  // ============================================

  'Market Opportunities': {
    introduction: `जैविक उत्पाद = 20-100% अधिक कीमत! जानें कहाँ और कैसे बेचें।

Organic products fetch 20-100% premium prices. Learn where and how to sell!`,
    sections: [
      {
        title: '💰 Price Comparison / कीमतों की तुलना',
        content: `**Regular vs Organic Prices (2024):**

| Product | Regular | Organic | Premium |
|---------|---------|---------|---------|
| Rice | ₹30/kg | ₹60-80/kg | +100% |
| Wheat | ₹25/kg | ₹45-55/kg | +80% |
| Dal | ₹80/kg | ₹150/kg | +88% |
| Vegetables | ₹30/kg | ₹50-80/kg | +67% |
| Milk | ₹55/L | ₹80-100/L | +45% |
| Honey | ₹300/kg | ₹600+/kg | +100% |

**Why Higher Prices?**
• Health conscious consumers increasing
• Supply is limited
• Trust in quality
• Export opportunities`,
        tips: [
          'Start with high-value crops first',
          'Quality packaging doubles perceived value',
          'Build customer relationships'
        ]
      },
      {
        title: '🏪 Where to Sell / कहाँ बेचें',
        content: `**1. Direct to Consumer (Best Margins)**
• Weekly farmers markets
• Home delivery subscriptions
• WhatsApp groups
• Margin: 100% of price

**2. Organic Stores**
• Big Basket Organic
• Nature's Basket
• Local organic shops
• Margin: 60-70%

**3. Online Platforms**
• Amazon Fresh
• JioMart
• Your own website
• Margin: 50-70%

**4. Export (High Volume)**
• Through FPOs
• Export houses
• Margin: 40-50% but guaranteed volume`,
        tips: [
          'Direct selling = highest profit',
          'Build WhatsApp customer base',
          'Consistency is key for retailers'
        ]
      },
      {
        title: '📱 Digital Marketing',
        content: `**WhatsApp Business (FREE)**
• Create business profile
• Catalog of products
• Broadcast messages
• 100+ customers = good start

**Social Media (FREE)**
• Farm photos on Instagram
• Videos of farming process
• Customer testimonials
• Behind-the-scenes content

**Google My Business (FREE)**
• Appear in local searches
• Get reviews
• Show location

**Investment: ₹0
Returns: Unlimited customers!**`
      },
      {
        title: '📦 Packaging & Branding',
        content: `**Basic Packaging (₹2-5/unit)**
• Clean poly bags
• Stick-on labels
• Your farm name
• Contact number

**Better Packaging (₹5-15/unit)**
• Printed bags
• Logo design
• Certification marks
• Weight clearly marked

**Premium Packaging (₹15-30/unit)**
• Branded boxes
• Story of your farm
• QR code to videos
• Freshness guarantee`
      }
    ],
    commonMistakes: [
      'Selling at same price as regular',
      'Not building brand',
      'Ignoring packaging',
      'Not collecting customer contacts'
    ],
    actionItems: [
      '📱 Create WhatsApp Business account',
      '🏷️ Design simple label',
      '📸 Take farm photos',
      '🤝 Visit 5 organic stores this week'
    ],
    summary: `Direct selling + Good packaging + Digital presence = 2x income. Start with WhatsApp, grow from there!`
  }
};

export default LESSON_RICH_CONTENT;
