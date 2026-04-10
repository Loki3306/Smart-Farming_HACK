import { config } from "dotenv";
// import removed

config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) // auto-commented: supabase removed

// ============================================
// RICH CONTENT FOR ALL LESSONS
// ============================================

const LESSON_CONTENT: Record<string, any> = {
  // ORGANIC FARMING
  "Soil Preparation & Composting": {
    introduction: `मिट्टी की तैयारी और कम्पोस्टिंग जैविक खेती की नींव है। स्वस्थ मिट्टी = स्वस्थ फसल = स्वस्थ आय।

Healthy soil is the foundation of successful organic farming. Just like a strong house needs a solid foundation, your crops need nutrient-rich soil to grow well. In this lesson, you will learn how to prepare your soil naturally without using chemical fertilizers.`,
    sections: [
      {
        title:
          "🌱 Why Soil Health Matters / मिट्टी का स्वास्थ्य क्यों जरूरी है",
        content: `Think of soil as a living thing - it contains millions of tiny organisms (जीवाणु) that help your crops grow.

**Benefits of healthy soil:**
• Holds water better - saves 30% irrigation water
• Provides natural nutrients to plants
• Fights off diseases naturally
• Improves yield by 20-30% within 2-3 years

**Simple test:** Take a handful of your soil. Good soil should feel crumbly (भुरभुरी), not hard like stone. Dark brown or black color means good organic matter.`,
        tips: [
          "Test your soil every 6 months at local KVK (₹50-100)",
          "Healthy soil smells like fresh earth after rain",
          "Add organic matter every season for best results",
        ],
      },
      {
        title: "🥬 How to Make Perfect Compost / खाद कैसे बनाएं",
        content: `Composting is FREE fertilizer from farm waste! You can turn crop residue, kitchen scraps, and animal manure into rich fertilizer.

**The Golden Ratio: 3:1**
• 3 parts BROWN (सूखी पत्तियां, पुआल, सूखी घास)
• 1 part GREEN (ताजी घास, सब्जी के छिलके, गोबर)

**Timeline:**
• Summer: Ready in 6-8 weeks
• Winter: Takes 3-4 months
• Monsoon: 8-10 weeks (keep covered!)`,
        tips: [
          "Turn pile every 2 weeks with a fork or spade",
          "Squeeze test: Only 2-3 drops of water should come out",
          "Add cow urine (गोमूत्र) to speed up decomposition",
          "Ready compost looks dark and smells like earth",
        ],
      },
      {
        title: "🔧 Step-by-Step Process / कदम-दर-कदम तरीका",
        content: `**Day 1: Setup**
1. Choose shady spot near water source
2. Dig pit: 4ft x 4ft x 3ft deep
3. Base layer: 6 inches twigs/straw for drainage

**Week 1-2: Building**
4. Add 6" brown material (dry leaves)
5. Add 2" green material (fresh waste)
6. Sprinkle handful of old compost or soil
7. Add thin layer of cow dung
8. Repeat layers until pit is full

**Ongoing Care:**
9. Keep moist like squeezed sponge
10. Cover with banana leaves or tarp
11. Turn every 14 days
12. Ready when dark, crumbly, earthy smell

**Cost: ₹0 (just your time!)
Value: Worth ₹500-800 per quintal**`,
      },
      {
        title: "⚠️ Common Mistakes to Avoid / इन गलतियों से बचें",
        content: `**❌ DON'T do these:**
• Adding meat/fish/oily food (attracts rats)
• Making it too wet (becomes smelly)
• Not turning (center won't decompose)
• Adding diseased plants (spreads to crops)
• Using before ready (burns young plants)

**✅ DO these instead:**
• Balance wet and dry materials
• Turn regularly for oxygen
• Keep covered from rain
• Be patient - good compost takes time`,
      },
    ],
    commonMistakes: [
      "Pile too wet - add more dry materials",
      "Pile too dry - sprinkle water",
      "Bad smell - needs more turning and brown materials",
      "Not decomposing - add cow dung or urine activator",
    ],
    actionItems: [
      "📋 This week: Start a 4x4 feet compost pit",
      "🌿 Collect dry leaves and straw (brown materials)",
      "🥕 Save kitchen vegetable waste (green materials)",
      "🧪 Get soil test done at local KVK",
    ],
    summary: `खाद बनाना आसान है: 3 भाग सूखा + 1 भाग हरा, नम रखें, 2 हफ्ते में पलटें, 2-3 महीने में तैयार।

Composting is simple: Mix 3 parts brown + 1 part green, keep moist, turn every 2 weeks, ready in 2-3 months. This FREE fertilizer can save you ₹5000-10000 per acre per year!`,
  },

  "Organic Certification Process": {
    introduction: `जैविक प्रमाणपत्र से आपकी उपज 20-50% अधिक कीमत पर बिकती है। PGS-India से शुरू करें - यह आसान और सस्ता है।

Organic certification opens doors to premium prices. A certified organic farmer typically earns 20-50% more. This lesson explains exactly what you need to do.`,
    sections: [
      {
        title: "📜 What is Organic Certification? / प्रमाणपत्र क्या है?",
        content: `Organic certification is an official guarantee that your produce is chemical-free.

**Types available in India:**
1. **PGS-India (Participatory Guarantee System)**
   - For local markets
   - Costs: ₹0-500
   - Time: 1 year
   - Best for: Small farmers selling locally

2. **Third-Party Certification (NPOP)**
   - For export & big retailers
   - Costs: ₹15,000-50,000/year
   - Time: 2-3 years
   - Best for: Large farms, exporters`,
        tips: [
          "Start with PGS - it's easier and cheaper",
          "Join a farmer group (5+ farmers) for PGS",
          "Government gives 50% subsidy under PKVY scheme",
        ],
      },
      {
        title: "📋 PGS Certification Steps / PGS के कदम",
        content: `**Step 1: Form a Group**
• Gather 5+ farmers in your area
• Choose a group leader
• Register on pgsindia-ncof.gov.in

**Step 2: Documentation**
• Farm map/sketch
• Input records (seeds, manure used)
• Crop history
• Sales records

**Step 3: Conversion Period (1 year)**
• Follow organic practices strictly
• No chemical fertilizers or pesticides
• Maintain buffer zones

**Step 4: Peer Inspection**
• Other farmer group members visit your farm
• Check your records and practices
• Verify organic methods

**Step 5: Certification**
• Receive PGS-Green or PGS-Organic certificate
• Valid for 1 year, renewable`,
        tips: [
          "Take photos of your farm and practices",
          "Keep all receipts for organic inputs",
          "Attend local training programs",
        ],
      },
      {
        title: "💰 Financial Benefits / आर्थिक लाभ",
        content: `**Price Premium:**
| Crop | Regular Price | Organic Price | Extra Earning |
|------|---------------|---------------|---------------|
| Wheat | ₹2000/q | ₹2800/q | +40% |
| Rice | ₹1800/q | ₹2500/q | +39% |
| Vegetables | ₹20/kg | ₹35/kg | +75% |
| Pulses | ₹5000/q | ₹7500/q | +50% |

**Government Support:**
• PKVY scheme: ₹50,000/ha over 3 years
• Free training and inputs
• Market linkage support

**Market Access:**
• Organic mandis in major cities
• Direct to consumer (higher margins)
• Export opportunities`,
      },
    ],
    commonMistakes: [
      "Not maintaining records from day one",
      "Contamination from neighboring farms",
      "Using non-approved inputs",
      "Expecting instant certification",
    ],
    actionItems: [
      "📝 Start a farm diary today",
      "👥 Talk to 4-5 neighboring farmers about forming a group",
      "🌐 Visit pgsindia-ncof.gov.in",
      "📞 Contact local KVK for guidance",
    ],
    summary: `PGS certification: Form group → Register online → Follow organic for 1 year → Get certified → Earn 20-50% more!`,
  },

  // IRRIGATION
  "Smart Irrigation Basics": {
    introduction: `पानी बचाएं, पैसा कमाएं! ड्रिप सिंचाई से 40-60% पानी की बचत होती है और उपज 20-30% बढ़ती है।

Water is precious and expensive. Smart irrigation means giving the right amount of water at the right time. This can save 40-60% water and increase yield by 20-30%.`,
    sections: [
      {
        title: "💧 Types of Irrigation Systems / सिंचाई के प्रकार",
        content: `**1. Flood Irrigation (Traditional)**
• Efficiency: 30-40%
• Water waste: HIGH
• Labor: HIGH
• Cost: LOW
• Best for: Rice paddies

**2. Drip Irrigation (Recommended)**
• Efficiency: 90-95%
• Water waste: VERY LOW
• Labor: LOW (automated)
• Cost: ₹25,000-50,000/acre
• Best for: Vegetables, fruits, cotton

**3. Sprinkler Irrigation**
• Efficiency: 70-80%
• Water waste: MEDIUM
• Labor: LOW
• Cost: ₹15,000-30,000/acre
• Best for: Wheat, pulses, groundnut`,
        tips: [
          "Government subsidy: 55-90% on drip/sprinkler",
          "Drip pays back investment in 1-2 seasons",
          "Combine with mulching for best results",
        ],
      },
      {
        title: "🎯 Drip Irrigation Setup / ड्रिप कैसे लगाएं",
        content: `**Components needed:**
1. Water tank/source
2. Filter (₹2000-5000)
3. Main pipe (PVC 63mm)
4. Sub-main pipes (32mm)
5. Lateral pipes (16mm with drippers)
6. End caps and connectors

**Installation Steps:**
1. Plan layout based on crop spacing
2. Install filter near water source
3. Lay main line along field length
4. Connect sub-mains perpendicular
5. Attach lateral pipes along crop rows
6. Insert drippers at plant positions
7. Flush system before first use

**Maintenance:**
• Clean filters weekly
• Check for clogged drippers
• Flush lines monthly`,
      },
      {
        title: "⏰ When to Water / कब पानी दें",
        content: `**Best times:**
• Early morning (6-8 AM) - BEST
• Evening (5-7 PM) - Good
• Avoid: Afternoon (water evaporates fast)

**How to check if crop needs water:**
1. **Finger test:** Push finger 2 inches into soil. If dry, water needed.
2. **Plant signs:** Leaves wilting in morning = urgent water need
3. **Soil color:** Light colored = dry, Dark = moist

**Crop-wise water needs (liters/plant/day):**
| Crop | Summer | Winter |
|------|--------|--------|
| Tomato | 2-3L | 1-1.5L |
| Brinjal | 2-2.5L | 1-1.5L |
| Chilli | 1.5-2L | 0.8-1L |
| Cotton | 3-4L | 1.5-2L |`,
      },
    ],
    commonMistakes: [
      "Watering at noon (50% evaporation loss)",
      "Over-watering (causes root rot)",
      "Irregular watering (stresses plants)",
      "Not cleaning filters (clogs drippers)",
    ],
    actionItems: [
      "💧 Check soil moisture before watering",
      "📞 Contact agriculture office for drip subsidy",
      "📋 Make a watering schedule for your crops",
      "🛠️ If using drip, clean filters this week",
    ],
    summary: `ड्रिप सिंचाई = 50% पानी बचत + 25% अधिक उपज + कम मेहनत। सरकारी सब्सिडी 55-90% उपलब्ध।

Drip irrigation saves 50% water, increases yield 25%, reduces labor. Government subsidy covers 55-90% cost. Apply at your local agriculture office!`,
  },

  "Water Scheduling Strategies": {
    introduction: `सही समय पर सही मात्रा में पानी देना एक कला है। इस पाठ में जानें कैसे पानी की टाइमिंग से फसल की गुणवत्ता और मात्रा दोनों बढ़ती है।

Timing your irrigation is as important as the amount. This lesson covers scientific scheduling that can improve both yield and quality.`,
    sections: [
      {
        title: "📊 Crop Water Requirements / फसलों की पानी की जरूरत",
        content: `**Water needed per acre per season:**

| Crop | Water (mm) | Irrigations |
|------|------------|-------------|
| Wheat | 450-500 | 4-6 |
| Rice | 1200-1400 | Continuous |
| Cotton | 700-800 | 6-8 |
| Tomato | 600-700 | 15-20 |
| Onion | 550-650 | 12-15 |
| Sugarcane | 1800-2000 | 25-30 |

**Critical stages (never miss watering):**
• Germination
• Flowering
• Fruit/grain filling`,
        tips: [
          "Miss flowering irrigation = 30-40% yield loss",
          "Light, frequent watering better than heavy, rare",
          "Mulching reduces water need by 25%",
        ],
      },
      {
        title: "🌡️ Weather-Based Scheduling / मौसम के हिसाब से",
        content: `**Summer (March-June):**
• Water every 3-4 days
• Best time: 6 AM or 6 PM
• Add mulch to reduce evaporation
• Increase quantity by 25%

**Monsoon (July-September):**
• Check soil before watering
• Skip if rain expected in 24 hours
• Ensure good drainage
• Watch for waterlogging

**Winter (October-February):**
• Water every 7-10 days
• Can water at any time
• Reduce quantity by 20%
• Watch for frost damage

**Use free weather apps:**
• Meghdoot (India Meteorological Dept)
• Kisan Suvidha
• IFFCO Kisan`,
      },
      {
        title: "💡 Water-Saving Techniques / पानी बचाने के तरीके",
        content: `**1. Mulching (पलवार)**
• Cover soil with straw/plastic
• Saves 25-30% water
• Controls weeds too
• Cost: ₹2000-5000/acre

**2. Rainwater Harvesting**
• Build farm pond
• Store monsoon water
• Use in dry season
• Government subsidy available

**3. Deficit Irrigation**
• Give 80% of full water need
• Plants adapt and use water efficiently
• Works best for cotton, wheat
• Save 20% water, lose only 5% yield

**4. Night Irrigation**
• Less evaporation
• Better absorption
• Works well with drip`,
      },
    ],
    commonMistakes: [
      "Same schedule for all seasons",
      "Ignoring weather forecast",
      "Watering on schedule, not on need",
      "Not adjusting for crop growth stage",
    ],
    actionItems: [
      "📱 Download Meghdoot app for weather",
      "📅 Create crop-specific watering calendar",
      "🌾 Apply mulch to reduce water need",
      "💧 Install rain gauge to track rainfall",
    ],
    summary: `Smart scheduling = Right amount + Right time + Right method. Check weather daily, water in morning/evening, never miss critical stages. Save water, save money!`,
  },

  // PEST MANAGEMENT
  "Identifying Common Farm Pests": {
    introduction: `अपने दुश्मन को पहचानें! भारत में 200+ कीट फसलों को नुकसान पहुंचाते हैं। इस पाठ में सबसे आम 15 कीटों की पहचान करना सीखें।

Know your enemy! India has 200+ crop pests. This lesson teaches you to identify the 15 most common ones and early warning signs.`,
    sections: [
      {
        title: "🐛 Sucking Pests / रस चूसने वाले कीट",
        content: `**1. Aphids (माहू/चेपा)**
• Size: 1-3mm, green/black
• Damage: Yellow leaves, sticky honeydew
• Found on: All vegetables, cotton, wheat
• Season: Winter, early summer

**2. Whitefly (सफेद मक्खी)**
• Size: 1mm, white wings
• Damage: Yellow leaves, sooty mold
• Found on: Cotton, tomato, brinjal
• Season: Year-round, peak in monsoon

**3. Thrips (थ्रिप्स)**
• Size: 1mm, slender, brown
• Damage: Silver streaks on leaves
• Found on: Onion, chilli, cotton
• Season: Summer

**4. Jassids (हरा फुदका)**
• Size: 2-3mm, green, wedge-shaped
• Damage: Leaf edges turn yellow then brown
• Found on: Cotton, brinjal, okra
• Season: Monsoon`,
        tips: [
          "Check leaf undersides - pests hide there",
          "Yellow sticky traps catch whitefly and aphids",
          "Spray neem oil at first sign",
        ],
      },
      {
        title: "🐛 Chewing Pests / काटने वाले कीट",
        content: `**5. Bollworm (सूंडी/बॉलवर्म)**
• Size: 3-4cm caterpillar
• Damage: Holes in fruits, bolls
• Found on: Cotton, tomato, chickpea
• Season: Monsoon, post-monsoon

**6. Stem Borer (तना छेदक)**
• Size: 2-3cm caterpillar
• Damage: Dead hearts, broken stems
• Found on: Rice, sugarcane, maize
• Season: Monsoon

**7. Fruit Borer (फल छेदक)**
• Size: 2-4cm green caterpillar
• Damage: Holes in fruits
• Found on: Tomato, brinjal, okra
• Season: Year-round

**8. Cut Worm (कटवर्म)**
• Size: 4-5cm, grey-brown
• Damage: Cuts seedlings at soil level
• Found on: All crops
• Season: Night feeder, all seasons`,
        tips: [
          "Pheromone traps catch bollworm moths",
          "Bird perches attract pest-eating birds",
          "Hand-pick large caterpillars in morning",
        ],
      },
      {
        title: "🔬 Early Warning Signs / प्रारंभिक चेतावनी",
        content: `**Daily Scouting Checklist:**
□ Check 10 random plants
□ Look at leaf undersides
□ Examine new growth tips
□ Check flowers and fruits
□ Look for holes, spots, wilting

**When to take action:**
| Pest | Action Threshold |
|------|------------------|
| Aphids | 10+ per leaf |
| Whitefly | 5+ per leaf |
| Bollworm | 1 per plant |
| Thrips | Silver on 20% leaves |

**Record keeping:**
• Date, pest seen, plant affected
• Weather conditions
• Action taken
• Result after 7 days`,
      },
    ],
    commonMistakes: [
      "Waiting too long to identify pest",
      "Confusing pest damage with disease",
      "Not checking leaf undersides",
      "Spraying without identification",
    ],
    actionItems: [
      "🔍 Scout your field tomorrow morning",
      "📸 Take photos of any pests found",
      "📒 Start a pest observation diary",
      "🪤 Install yellow sticky traps",
    ],
    summary: `पहचान = सफल नियंत्रण। रोज सुबह 10 पौधे जांचें, पत्तों के नीचे देखें, रिकॉर्ड रखें। जल्दी पकड़ें = आसान नियंत्रण।

Identification = Successful control. Check 10 plants daily, look under leaves, keep records. Early detection = Easy control!`,
  },

  "Biological Pest Control": {
    introduction: `प्रकृति में हर कीट का दुश्मन है। जैविक नियंत्रण से रासायनिक खर्च बचाएं और पर्यावरण भी बचाएं।

Nature has a pest controller for every pest. Biological control saves chemical costs and protects the environment.`,
    sections: [
      {
        title: "🐞 Beneficial Insects / मित्र कीट",
        content: `**Ladybird Beetle (लेडीबर्ड)**
• Eats: Aphids, whiteflies, mealybugs
• 1 ladybird eats 50+ aphids/day
• Attract with: Marigold, dill flowers
• Buy: ₹500 per 100

**Lacewing (लेसविंग)**
• Eats: Aphids, thrips, small caterpillars
• 1 larva eats 200+ aphids in lifetime
• Attract with: Fennel, coriander flowers

**Trichogramma Wasp (ट्राइकोग्रामा)**
• Parasitizes: Bollworm, stem borer eggs
• Release: 50,000 per acre
• Cost: ₹100-150 per card
• Available at: KVK, agriculture university`,
        tips: [
          "Don't spray chemicals - kills beneficial insects too",
          "Plant flowers on field borders",
          "Release Trichogramma every 7 days during pest season",
        ],
      },
      {
        title: "🦠 Bio-Pesticides / जैव कीटनाशक",
        content: `**1. Neem Oil (नीम तेल)**
• Controls: 200+ pests
• Dose: 5ml per liter water
• Spray: Evening time
• Cost: ₹300-400/liter
• Safe for bees and humans

**2. Beauveria bassiana (ब्यूवेरिया)**
• Controls: Whitefly, aphids, borers
• Dose: 5g per liter
• Works in: 5-7 days
• Cost: ₹400-500/kg

**3. Bacillus thuringiensis (Bt)**
• Controls: All caterpillars
• Dose: 1g per liter
• Best time: Evening
• Cost: ₹500-700/kg

**4. NPV (Nuclear Polyhedrosis Virus)**
• Controls: Bollworm specifically
• Dose: 250 LE per acre
• Cost: ₹200-300
• Available: Agriculture dept`,
        tips: [
          "Bio-pesticides work slower but longer",
          "Spray in evening for best results",
          "Store in cool, dark place",
        ],
      },
      {
        title: "🌿 DIY Pest Sprays / घर पर बनाएं",
        content: `**Neem-Garlic Spray**
Ingredients:
• 1 kg neem leaves
• 200g garlic
• 10 liters water

Method:
1. Grind neem leaves + garlic
2. Soak overnight in water
3. Filter through cloth
4. Add 2ml liquid soap
5. Spray on plants

**Chilli-Tobacco Spray**
Ingredients:
• 500g green chillies
• 200g tobacco leaves
• 10 liters water

Method:
1. Grind chillies + tobacco
2. Boil in 2 liters water
3. Cool and add remaining water
4. Filter and spray
⚠️ Wear gloves, don't use on food crops

**Buttermilk Spray (for fungus)**
• 1 liter buttermilk in 10L water
• Controls: Powdery mildew
• Safe for all crops`,
      },
    ],
    commonMistakes: [
      "Expecting instant results (bio-control is slower)",
      "Mixing bio-pesticides with chemicals",
      "Spraying in hot afternoon sun",
      "Not repeating applications",
    ],
    actionItems: [
      "🌿 Make neem spray this week",
      "🐞 Don't kill ladybirds - they are friends!",
      "📞 Ask KVK about Trichogramma cards",
      "🌻 Plant marigold on field borders",
    ],
    summary: `जैविक नियंत्रण सस्ता और सुरक्षित है। नीम + लहसुन स्प्रे बनाएं, मित्र कीटों को बचाएं, ट्राइकोग्रामा का प्रयोग करें।

Bio-control is cheaper and safer. Make neem spray, protect beneficial insects, use Trichogramma. Nature will help you fight pests!`,
  },

  // SOIL HEALTH
  "Understanding Soil pH": {
    introduction: `मिट्टी का pH फसल की सेहत का राज है। pH 6-7 के बीच हो तो पोषक तत्व आसानी से मिलते हैं।

Soil pH is the secret to healthy crops. When pH is between 6-7, nutrients are easily available to plants.`,
    sections: [
      {
        title: "🧪 What is pH? / pH क्या है?",
        content: `pH measures how acidic or alkaline your soil is.

**The Scale:**
• 0-6: Acidic (अम्लीय) - sour like lemon
• 7: Neutral (उदासीन) - like pure water  
• 8-14: Alkaline (क्षारीय) - like soap

**Ideal pH for crops:**
| Crop | Best pH |
|------|---------|
| Rice | 5.5-6.5 |
| Wheat | 6.0-7.0 |
| Vegetables | 6.0-7.0 |
| Cotton | 6.5-7.5 |
| Sugarcane | 6.5-7.5 |
| Tea | 4.5-5.5 |

**Why it matters:**
• Low pH: Iron toxicity, phosphorus locked
• High pH: Iron, zinc deficiency
• Right pH: All nutrients available`,
        tips: [
          "Test pH before every season",
          "pH changes slowly - be patient with corrections",
          "Rain makes soil more acidic over time",
        ],
      },
      {
        title: "📊 How to Test pH / pH कैसे जांचें",
        content: `**Method 1: Soil Testing Lab**
• Most accurate (₹50-100)
• Get full nutrient report
• Available at KVK, agriculture university

**Method 2: pH Paper/Kit**
• Quick home test (₹200-500)
• Mix soil with water 1:2
• Dip pH paper, match color
• Accuracy: ±0.5

**Method 3: Digital pH Meter**
• Instant reading (₹500-2000)
• Reusable many times
• Needs calibration

**Collecting Sample:**
1. Take soil from 6 inches depth
2. Collect from 10 spots in field
3. Mix all samples together
4. Remove stones and roots
5. Test or send 500g to lab`,
        tips: [
          "Test in same season each year for comparison",
          "Test separately for different field sections",
          "Keep test reports for 5 years",
        ],
      },
      {
        title: "⚗️ How to Correct pH / pH कैसे सुधारें",
        content: `**If pH is LOW (Acidic) - Add:**
• Lime (calcium carbonate): 2-4 quintal/acre
• Dolomite: Also adds magnesium
• Wood ash: Light correction
• Apply 1 month before sowing

**If pH is HIGH (Alkaline) - Add:**
• Gypsum: 3-5 quintal/acre
• Sulfur: 15-25 kg/acre
• Organic matter: Compost, FYM
• Apply before monsoon

**Organic Methods:**
• Compost: Balances pH naturally
• Green manure: Slightly reduces pH
• Mulching: Stabilizes pH

**How long for change:**
• Lime/Gypsum: 3-6 months
• Organic matter: 1-2 years
• Best approach: Combine both`,
      },
    ],
    commonMistakes: [
      "Never testing pH at all",
      "Adding lime without testing (can over-correct)",
      "Expecting instant results",
      "Testing only once and forgetting",
    ],
    actionItems: [
      "🧪 Get soil pH tested this month",
      "📝 Record your pH results",
      "🧮 Calculate lime/gypsum needed",
      "📅 Plan correction before next season",
    ],
    summary: `pH 6-7 = Happy crops! Test every season, correct slowly with lime (low pH) or gypsum (high pH), add organic matter for long-term balance.`,
  },

  "Nutrient Management (NPK)": {
    introduction: `NPK - नाइट्रोजन, फॉस्फोरस, पोटाशियम - फसल के लिए भोजन है। सही मात्रा में देने से उपज दोगुनी हो सकती है।

NPK - Nitrogen, Phosphorus, Potassium - is food for your crops. Right balance can double your yield.`,
    sections: [
      {
        title: "🧬 Understanding NPK / NPK को समझें",
        content: `**N - Nitrogen (नाइट्रोजन)**
• Role: Leaf growth, green color
• Deficiency: Yellow leaves, stunted growth
• Excess: Too much leaf, less fruit
• Sources: Urea, DAP, compost, legumes

**P - Phosphorus (फॉस्फोरस)**
• Role: Root growth, flowering, fruiting
• Deficiency: Purple leaves, poor roots
• Excess: Blocks other nutrients
• Sources: DAP, SSP, bone meal

**K - Potassium (पोटाश)**
• Role: Disease resistance, fruit quality
• Deficiency: Brown leaf edges, weak stems
• Excess: Blocks calcium, magnesium
• Sources: MOP, SOP, wood ash

**The Balance:**
Vegetables: N:P:K = 4:2:1
Grains: N:P:K = 2:1:1
Fruits: N:P:K = 1:1:2`,
        tips: [
          "Always base fertilizer on soil test",
          "Split nitrogen into 2-3 doses",
          "Apply phosphorus at sowing only",
        ],
      },
      {
        title: "📋 Crop-Wise Fertilizer Guide / फसलवार खाद",
        content: `**Wheat (per acre):**
• Basal: 50kg DAP + 25kg MOP
• 21 days: 25kg Urea
• 45 days: 25kg Urea
• Total cost: ~₹3000

**Rice (per acre):**
• Basal: 60kg DAP + 30kg MOP
• Tillering: 30kg Urea
• Panicle: 20kg Urea
• Total cost: ~₹3500

**Cotton (per acre):**
• Basal: 50kg DAP + 50kg MOP
• 30 days: 30kg Urea
• 60 days: 30kg Urea
• Flowering: 25kg MOP
• Total cost: ~₹5000

**Tomato (per acre):**
• Basal: 100kg DAP + 50kg MOP
• 25 days: 30kg Urea
• 45 days: 30kg Urea + 25kg MOP
• Total cost: ~₹5500`,
        tips: [
          "Water field before applying urea",
          "Don't mix urea with DAP",
          "Apply potash 2-3 times for better quality",
        ],
      },
      {
        title: "🌿 Organic Alternatives / जैविक विकल्प",
        content: `**For Nitrogen:**
• Vermicompost: 2 ton/acre = 20kg N
• FYM: 10 ton/acre = 50kg N
• Azotobacter: Fixes 20-25kg N from air
• Green manure: 40-60kg N/acre

**For Phosphorus:**
• Bone meal: 40% P2O5
• Rock phosphate: 20-25% P2O5
• PSB bacteria: Makes locked P available

**For Potassium:**
• Wood ash: 5-8% K2O
• Banana stem: Rich in potassium
• Seaweed extract: K + micronutrients

**Cost Comparison (per acre):**
| | Chemical | Organic |
|-|----------|---------|
| Cost | ₹3000-5000 | ₹2000-4000 |
| Long-term | Degrades soil | Improves soil |
| Yield (Y1) | Higher | Similar |
| Yield (Y3) | Same | Higher |`,
      },
    ],
    commonMistakes: [
      "Applying same fertilizer every year without testing",
      "Too much nitrogen (lush leaves, no fruit)",
      "Skipping potash (affects quality)",
      "Broadcasting urea on dry soil (nitrogen loss)",
    ],
    actionItems: [
      "📊 Get soil tested for NPK levels",
      "📝 Make fertilizer schedule for your crop",
      "🌱 Try vermicompost on one plot",
      "💰 Calculate cost: chemical vs organic",
    ],
    summary: `N=पत्ते, P=जड़/फूल, K=गुणवत्ता। मिट्टी परीक्षण के बाद ही खाद दें। जैविक खाद + रासायनिक का संतुलन सबसे अच्छा।

N=Leaves, P=Root/Flower, K=Quality. Always fertilize based on soil test. Balance of organic + chemical is best long-term approach.`,
  },
};

// ============================================
// MAIN FUNCTION
// ============================================

async function seedLessonContent() {
  console.log("🌾 Seeding rich lesson content...\n");

  let updated = 0;
  let skipped = 0;

  for (const [lessonTitle, content] of Object.entries(LESSON_CONTENT)) {
    // Find lesson by title
    const { data: lesson, error } = await supabase
      .from("course_lessons")
      .select("id, title")
      .ilike("title", `%${lessonTitle}%`)
      .limit(1)
      .single();

    if (error || !lesson) {
      console.log(`⏭️  Skipped: "${lessonTitle}" (not found)`);
      skipped++;
      continue;
    }

    // Update with content_data (try to add column if needed)
    const { error: updateError } = await supabase
      .from("course_lessons")
      .update({
        content_data: content,
        description: content.introduction?.substring(0, 200) + "...",
      })
      .eq("id", lesson.id);

    if (updateError) {
      if (updateError.message.includes("content_data")) {
        console.log(
          "❌ Column content_data does not exist. Please add it first.",
        );
        console.log(
          "Run this SQL in Supabase: ALTER TABLE course_lessons ADD COLUMN content_data JSONB;",
        );
        return;
      }
      console.log(`❌ Error updating "${lessonTitle}": ${updateError.message}`);
    } else {
      console.log(`✅ Updated: "${lesson.title}"`);
      updated++;
    }
  }

  console.log(`\n📊 Summary: ${updated} updated, ${skipped} skipped`);
}

seedLessonContent().catch(console.error);
