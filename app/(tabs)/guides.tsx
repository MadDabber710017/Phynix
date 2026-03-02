import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

const C = Colors.dark;

type Section = "guides" | "learn";

interface GuideStep {
  title: string;
  description: string;
  tips: string[];
  scaleNote?: string;
  warnings?: string[];
}

interface Guide {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  steps: GuideStep[];
}

const GUIDES: Guide[] = [
  {
    id: "germination",
    title: "Germination",
    subtitle: "Popping seeds — any scale",
    icon: "ellipse-outline",
    color: "#66bb6a",
    duration: "3–7 days",
    difficulty: "Beginner",
    steps: [
      {
        title: "Paper Towel Method",
        description: "The easiest method. Moisten (not soaking wet) paper towels, place seeds between them on a plate, and cover to retain moisture. Works for 1 seed or 1,000 — just use more plates or trays.",
        tips: [
          "Temperature: 70–85°F (21–29°C)",
          "Check every 12 hours",
          "Sprout in 24–120 hours for most seeds",
          "Tap root must be at least 5mm before transplanting",
          "For large scale: use seedling trays with dome lids",
        ],
        scaleNote: "1–10 plants: a plate works fine. 50+ plants: get seedling trays or hotel pans. 100+ plants: commercial germination chambers or heat mats in trays.",
        warnings: ["Don't let paper towels dry out", "Never use chlorinated tap water directly — let it sit 24hrs or use filtered"],
      },
      {
        title: "Direct Media Germination",
        description: "Place seed directly into your chosen medium (soil, rockwool cube, rapid rooter, peat pellet). Make a small 5–10mm deep hole, drop seed in pointed end down, cover lightly. This minimizes transplant shock.",
        tips: [
          "Seed depth: 5–10mm (about half an inch)",
          "Keep medium moist but not waterlogged",
          "Seedling emerges in 3–7 days",
          "Humidity dome speeds up germination",
          "Rockwool/rapid rooters ideal for hydro grows",
        ],
        scaleNote: "Best for any scale. 1 plant: solo cup. 100 plants: germinate in seed trays first. Commercial: use propagation machines.",
      },
      {
        title: "Water Soak Method",
        description: "Drop seeds in a glass of room-temperature, pH-adjusted water (6.0–6.5). Seeds that float can be gently tapped down. After 24–48 hours in darkness, look for a white tap root emerging.",
        tips: [
          "Soak no longer than 24–32 hours — too long causes seed rot",
          "Transfer to paper towel or media after root shows",
          "Best for seeds with hard shells — scoring the shell speeds things up",
          "Water temp should be room temp, not cold",
        ],
        scaleNote: "Works great at any scale. Use multiple glasses or bins for bulk seed soaking.",
      },
    ],
  },
  {
    id: "seedling",
    title: "Seedling Stage",
    subtitle: "First 1–3 weeks of life",
    icon: "leaf-outline",
    color: "#81c784",
    duration: "1–3 weeks",
    difficulty: "Beginner",
    steps: [
      {
        title: "Light for Seedlings",
        description: "Seedlings need gentle light. They're fragile and intense light can bleach or stress them. CFL, T5 fluorescent, or LEDs at low power (dimmed or raised high) are ideal. 18–20 hours of light per day works great for all photoperiod seedlings.",
        tips: [
          "Intensity target: 200–400 PPFD",
          "CFL/T5: Keep 2–4 inches above seedlings",
          "LED: Keep 24–36 inches away (or dim to 25–50%)",
          "HPS: Not ideal for seedlings — too intense and hot",
          "Autoflowers also run 18–20/hr for their full life",
        ],
        scaleNote: "1–4 plants: a single T5 or small LED is perfect. 50+ seedlings: full T5 racks or CMH at distance. Commercial: propagation rooms with controlled PPFD.",
      },
      {
        title: "Watering Seedlings Correctly",
        description: "Less is more. Seedling roots are tiny and can't absorb much water. Overwatering is the #1 seedling killer. Water in a circle around the seedling (not directly on it) to push roots outward.",
        tips: [
          "Use a spray bottle or gentle watering can for small plants",
          "Let top ½ inch of soil dry before watering again",
          "pH water to 6.0–6.5 (soil) or 5.5–6.0 (hydro/coco)",
          "No nutrients needed for 10–14 days in quality soil",
          "Coco: Needs light CalMag from day 1",
        ],
        scaleNote: "1–5 plants: hand-water carefully. 20+ plants: small garden sprayer. 100+ plants: drip irrigation even at seedling stage saves time and keeps watering consistent.",
        warnings: ["Root rot develops fast in overwatered seedlings", "Symptoms: drooping despite wet soil, slow growth"],
      },
      {
        title: "Temperature, Humidity & Airflow",
        description: "Seedlings thrive in warm, humid conditions. Use a humidity dome if possible to keep RH high while the plant establishes roots. Introduce gentle airflow — a soft fan on a low setting helps strengthen the stem.",
        tips: [
          "Temperature: 68–77°F (20–25°C)",
          "Humidity: 65–75% RH",
          "Introduce gentle fan after first week",
          "Remove humidity dome for a few hours each day to prevent mold",
          "Gradually reduce humidity to 55–65% by end of seedling stage",
        ],
        scaleNote: "1–5 plants: use a plastic dome or DIY humidity tent. Large scale: propagation rooms or greenhouse with humidity and temperature controllers are essential.",
      },
    ],
  },
  {
    id: "vegetative",
    title: "Vegetative Stage",
    subtitle: "Building structure and size",
    icon: "flower-outline",
    color: "#42a5f5",
    duration: "3–16 weeks",
    difficulty: "Intermediate",
    steps: [
      {
        title: "Light Schedule & Intensity",
        description: "Photoperiod plants need 18 hours of light and 6 hours of dark during veg. This can be 18/6, 20/4, or even 24/0 (though 18/6 allows plant recovery time and saves electricity). Autoflowers run on the same schedule as their entire life.",
        tips: [
          "18/6 is the standard and most energy efficient",
          "PPFD target: 400–600 early veg, 600–900 late veg",
          "HPS 400–1000w, LED full spectrum, or CMH all work great",
          "VPD in veg: 0.8–1.2 kPa for optimal transpiration",
          "Train plants by week 3–4 of veg for best structure",
        ],
        scaleNote: "1–2 plants: a 250–400w HPS or a 200w LED is plenty. 4–9 plants (3x3 to 4x4 tent): 600–800w LED or 600w HPS. Large commercial: calculate 30–50w actual LED draw per sq ft of canopy.",
      },
      {
        title: "Feeding & Nutrients",
        description: "Veg plants are nitrogen hungry. Use a nutrient formula with higher N (nitrogen) than P or K. ALWAYS start at 25–50% of the manufacturer's recommended dose and increase gradually only if plants look healthy.",
        tips: [
          "Feed every other watering: feed, water, feed, water",
          "Dark green, waxy leaves = healthy nitrogen levels",
          "Pale/yellowing lower leaves = nitrogen deficiency",
          "Dark green curling leaves/claw = nitrogen excess",
          "Add CalMag if using LED lights, coco, or RO water",
          "EC/PPM target: 700–1000 PPM (late veg)",
        ],
        scaleNote: "Home growers: premixed nutrient lines work great (General Hydroponics, Fox Farm, Advanced Nutrients). Commercial: mixing tanks and dosing systems for precise and cost-effective feeding.",
      },
      {
        title: "Training for Yield",
        description: "Veg is the only time to shape your plant's structure. The goal is to expose as many bud sites to direct light as possible. Any plant count can benefit from training — even a single plant in a tent.",
        tips: [
          "LST (Low Stress Training): Bend and tie stems — beginner friendly, works great for 1–100 plants",
          "Topping: Remove main tip at node 3–5 to create 2 main colas",
          "FIMing: Cut 75% of tip — creates 4 tops, less stressful",
          "SCROG: Net/screen over canopy — excellent for 1–4 plants in a tent",
          "SOG (Sea of Green): Many small plants, no training — great for commercial scale",
        ],
        scaleNote: "1–4 plants: LST + topping or SCROG. 5–20 plants: SOG or mainlining for uniformity. 100+ plants: SOG with no topping is most time-efficient for commercial production.",
      },
      {
        title: "Transplanting",
        description: "Plants need to be moved to larger containers as they grow. Root bound plants slow their growth significantly. The right time to transplant is when roots just start circling the bottom of the pot.",
        tips: [
          "Solo cup → 1 gallon → 3–5 gallon → final pot",
          "Final pot size guide: 1 gallon per foot of expected height",
          "Water before transplanting to help root ball hold together",
          "Add mycorrhizal fungi to new pot for faster root colonization",
          "Transplant in late afternoon or during lights-off to reduce stress",
        ],
        scaleNote: "Home growers: 2–5 gallon fabric pots are great. 4–7 gallon for large photoperiods. Commercial: smart pots, fabric containers or filled trays — skip transplanting with direct germination into final media for speed.",
      },
    ],
  },
  {
    id: "flowering",
    title: "Flowering Stage",
    subtitle: "Growing your buds to their potential",
    icon: "star-outline",
    color: "#ab47bc",
    duration: "7–12 weeks",
    difficulty: "Intermediate",
    steps: [
      {
        title: "Triggering & Managing Flower",
        description: "Switch photoperiod plants to 12/12 light schedule to begin flowering. The DARK period must be 100% uninterrupted — even a brief light leak can stress plants into hermaphroditism. Autoflowers flower on their own timeline (usually 3–5 weeks after germination).",
        tips: [
          "Flip to 12/12 when plant is at 50% of desired final height (plants double in flower)",
          "Check ALL light leaks before switching — use a flashlight in the dark",
          "Week 1–3: Pre-flower stretch — plants can double or triple in height",
          "Reduce nitrogen, increase phosphorus and potassium at the flip",
          "Install CO2 at flip if your other factors are dialed in",
        ],
        scaleNote: "1-plant growers: timing is flexible, flip when ready. Commercial: staggered flip cycles keep harvest flowing year-round (perpetual harvest). Autoflowers skip flip management entirely — great for beginners.",
        warnings: ["NEVER interrupt the 12-hour dark period", "Even a phone screen or a digital clock can cause stress"],
      },
      {
        title: "Nutrient Schedule for Flower",
        description: "Flower requires a different nutrition profile than veg. Shift from high-nitrogen veg nutrients to phosphorus and potassium-heavy bloom boosters. A typical flower feeding schedule progresses through phases.",
        tips: [
          "Weeks 1–2 (transition): Mild bloom, still some N",
          "Weeks 3–5 (early bloom): Increase P/K bloom boosters, reduce N to near zero",
          "Weeks 5–7 (peak bloom): Maximum P/K feeding, terpene/resin enhancers",
          "Weeks 7–9 (ripening): Taper nutrients, start monitoring trichomes",
          "Week 9+ (flush): Plain pH'd water only",
          "Always monitor EC/PPM and runoff to avoid salt buildup",
        ],
        scaleNote: "Home: premixed bloom nutrients are fine. Commercial: nutrient injection systems for precise automated feeding at scale. Cost of mixing your own from base salts is much lower at high volume.",
      },
      {
        title: "Environmental Control",
        description: "Flower demands tighter environmental control than veg. Failing to manage humidity and temperature in late flower leads to bud rot, reduced potency, and poor taste.",
        tips: [
          "Temp: 70–80°F lights on, 60–70°F lights off",
          "Early flower humidity: 45–55% RH",
          "Late flower humidity (week 5+): 35–45% RH",
          "Strong airflow between and through buds — no dead air pockets",
          "VPD target: 1.2–1.6 kPa",
          "Dehumidifiers are essential in late flower — especially for dense indica buds",
        ],
        scaleNote: "1–4 plants: a portable dehumidifier + oscillating fan is usually enough. 10+ plants: dedicated HVAC, inline fans with humidity controllers. Large commercial: full climate control systems (HVAC, CO2, dehumidification, VPD management).",
      },
      {
        title: "Week-by-Week Flower Guide",
        description: "A practical week-by-week breakdown to help you know what to expect at every point of the flowering stage.",
        tips: [
          "Week 1–2: White hairs appear, pre-flower stretching, thin buds forming",
          "Week 3–4: Buds stacking, stretch ending, strong smell begins",
          "Week 5–6: Buds fattening fast, trichomes forming, heavy feeding",
          "Week 7–8: Buds dense and frosted, pistils turning orange/red, reduce nutrients",
          "Week 9–10: Trichomes turning cloudy/amber, flush begins, daily trichome checks",
          "Week 10–12: Harvest window — depends on strain and desired effect",
        ],
      },
    ],
  },
  {
    id: "harvest",
    title: "Harvesting",
    subtitle: "Timing and executing your harvest",
    icon: "cut-outline",
    color: "#ffa726",
    duration: "1–7 days process",
    difficulty: "Intermediate",
    steps: [
      {
        title: "Trichome Reading — The Real Harvest Indicator",
        description: "Trichomes are your most accurate harvest indicator. Use a 30–100x jeweler's loupe or digital microscope. Don't rely on breeders' timelines — they're estimates only. Check trichomes on the buds themselves, not the sugar leaves (which amber faster).",
        tips: [
          "Clear trichomes = too early, plant still building THC",
          "Cloudy/milky trichomes = peak THC, uplifting/energetic effect",
          "Amber trichomes = THC converting to CBN, body/sedative effect",
          "Most growers target: 70% cloudy + 20–30% amber for balanced effect",
          "Check multiple buds on the plant — top colas ripen first",
          "Photograph trichomes daily in final 2 weeks to track change",
        ],
        scaleNote: "Any scale: trichome monitoring is the only real harvest indicator. Commercial growers use microscopes on samples from multiple plants.",
      },
      {
        title: "Pre-Harvest Flush",
        description: "Flushing clears residual nutrient salts from the medium before harvest, improving taste and smoothness. Use plain pH-adjusted water for the final 1–2 weeks. Your plants will use stored nutrients and begin yellowing — this is completely normal.",
        tips: [
          "Soil: Flush 10–14 days before harvest",
          "Coco: Flush 5–7 days before harvest",
          "DWC/Hydro: Switch to plain water 3–5 days before harvest",
          "Plant yellowing during flush = using stored nutrients (desired)",
          "Some growers skip flushing — especially in hydro. Research both sides",
        ],
        scaleNote: "Home growers: pour 3x pot volume of plain water through the soil for a good flush. Commercial: automated flush systems or simply switch to plain water in reservoirs/dripper systems.",
      },
      {
        title: "Harvesting Process",
        description: "Cut the entire plant at the base, or harvest branch by branch. Branch-by-branch (selective harvest) lets lower buds ripen 1–2 extra weeks while you take the top colas. Harvest in the morning before lights turn on for maximum terpene levels.",
        tips: [
          "Harvest in morning before lights on (terpenes are highest)",
          "Use sharp, clean scissors/pruning shears — disinfect between plants",
          "Remove large fan leaves before hanging to aid airflow during drying",
          "Keep buds away from direct light after cutting",
          "Weigh fresh harvest weight — dry weight will be 70–80% less",
        ],
        scaleNote: "1–3 plants: whole plant or branch harvest by hand. 10+ plants: have trimming helpers ready. Commercial: harvest machines, buckers, and trimmers dramatically increase throughput.",
      },
    ],
  },
  {
    id: "drying-curing",
    title: "Drying & Curing",
    subtitle: "The step that makes or breaks quality",
    icon: "archive-outline",
    color: "#ef5350",
    duration: "2–8 weeks",
    difficulty: "Advanced",
    steps: [
      {
        title: "Drying Correctly",
        description: "Hang whole branches upside down in a cool, dark room with gentle airflow. NEVER dry fast — slow drying at low temperature preserves terpenes and creates a much smoother product. Most drying takes 7–14 days depending on bud density and environment.",
        tips: [
          "Ideal conditions: 60–65°F, 55–62% RH",
          "Keep room dark — UV light degrades cannabinoids",
          "Gentle airflow around (not directly on) buds",
          "Ready when small stems snap cleanly, not bend",
          "Dry trimming (after drying) preserves more trichomes than wet trim",
        ],
        scaleNote: "1–4 plants: hang in a closet or small tent. 10+ plants: a dedicated drying room is essential — invest in a temperature and humidity controller. Commercial: drying rooms with HVAC and racks are standard.",
        warnings: ["Fast drying creates harsh, hay-smelling product", "Never use a food dehydrator — it destroys terpenes with heat"],
      },
      {
        title: "Trimming",
        description: "Trim away sugar leaves and remaining stems after drying. Wet trim (before drying) or dry trim (after drying) both produce quality results — dry trimming is easier and more trichome-friendly.",
        tips: [
          "Use sharp trimming scissors (Chikamasa or Fiskars recommended)",
          "Work over a pollen catcher tray to collect kief",
          "Save all trim for hash, rosin, or edibles",
          "Wear gloves to prevent contamination",
          "Take breaks — trimming causes repetitive strain injuries",
        ],
        scaleNote: "1 plant: 2–4 hours of hand trimming. 5 plants: full day. 10+ plants: consider a trimming machine (Twister, Tom's Tumbler). Commercial: automated trimming machines are essential for speed.",
      },
      {
        title: "Curing in Jars",
        description: "Place trimmed, dry buds loosely in clean glass mason jars (fill 75% full). Open jars daily for the first 2 weeks to 'burp' out moisture and fresh CO2. This critical step breaks down chlorophyll and develops complex flavors.",
        tips: [
          "Burp jars 2x daily for weeks 1–2",
          "Burp once daily for weeks 3–4",
          "Weekly after 1 month",
          "Add Boveda 62% humidity packs for precise humidity control",
          "If buds feel wet when you open jar: leave open longer",
          "If buds feel crispy: add a small Boveda and seal",
        ],
        scaleNote: "Home growers: quart mason jars work perfectly. 10+ ounces: use gallon jars or food-grade 5-gallon buckets with humidity control. Commercial: large climate-controlled curing rooms or vacuum-sealed industrial cure.",
      },
      {
        title: "How Long to Cure",
        description: "The longer you cure, the better the final product. Minimum 2 weeks for smokeable quality. 4–8 weeks for premium quality. Some strains benefit from months of curing.",
        tips: [
          "2 weeks minimum: decent but rough around the edges",
          "4–6 weeks: smooth, good flavor, most effects present",
          "2–3 months: exceptional smoothness and complexity",
          "6+ months: some strains develop incredible complexity and potency",
          "Properly cured cannabis stores for 1–2 years without quality loss",
          "Store in cool, dark location — not the fridge (too much humidity fluctuation)",
        ],
      },
    ],
  },
  {
    id: "growing-methods",
    title: "Growing Methods",
    subtitle: "Soil, hydro, coco, DWC — which is right for you?",
    icon: "layers-outline",
    color: "#42a5f5",
    duration: "Your entire grow",
    difficulty: "Beginner",
    steps: [
      {
        title: "Soil Growing",
        description: "The most beginner-friendly and forgiving growing medium. Soil acts as a buffer for pH fluctuations and nutrition mistakes. Organic soil can feed plants with little to no added nutrients.",
        tips: [
          "Best premixed soils: Fox Farm Ocean Forest, Roots Organics, Canna Terra",
          "pH range: 6.0–7.0 (sweet spot: 6.2–6.8)",
          "Water when top 1–2 inches are dry",
          "Quality soil can feed plants for 4–6 weeks with no nutrients",
          "Colder medium = slower growth and nutrient absorption",
        ],
        scaleNote: "Perfect for: 1–20 plants, beginners, organic growers, living soil/no-till. Less ideal for: large commercial due to labor of soil management and slower growth vs hydro.",
      },
      {
        title: "Coco Coir",
        description: "Coconut husk fibers that act like hydro but feel like soil. Faster growth than soil, better oxygen to roots, but requires more feeding attention. No natural nutrients — you control everything.",
        tips: [
          "Rinse and buffer coco before use (pre-charged coco saves time)",
          "pH range: 5.5–6.5 (target: 5.8–6.2)",
          "Feed every watering — coco has no natural nutrients",
          "Always add CalMag — coco binds calcium",
          "Water/feed to 20% runoff to avoid salt buildup",
          "Feed 1–3x per day in large pots (excellent for automation)",
        ],
        scaleNote: "Great for: any scale from 1 plant to commercial. Faster than soil, cheaper than full hydro. Excellent for automation — drip systems work perfectly with coco.",
      },
      {
        title: "DWC Hydroponics",
        description: "Plants grow with roots suspended in oxygenated nutrient solution. No medium to manage. Fastest growth of any method — plants fed directly 24/7. More technical but incredibly rewarding.",
        tips: [
          "Keep reservoir temperature at 65–68°F to prevent root rot",
          "Air pumps must run 24/7 — never let roots dry out",
          "pH range: 5.5–6.2 (check and adjust daily)",
          "Change reservoir water every 1–2 weeks",
          "Net pots with hydroton clay pebbles work great",
          "Use beneficial bacteria (Hydroguard) to protect roots",
        ],
        scaleNote: "DWC: perfect for 1–4 plant home growers wanting maximum yield per plant. RDWC (Recirculating DWC): scales to commercial with multiple connected buckets. Ebb & Flow or NFT systems better for commercial scale.",
      },
      {
        title: "Autoflower vs Photoperiod",
        description: "One of the biggest decisions you'll make. Autoflowers flower based on age regardless of light schedule. Photoperiods flower based on light cycle (12/12). Each has real advantages depending on your situation.",
        tips: [
          "Autoflowers: 60–90 days seed to harvest, no light cycle management",
          "Photoperiods: Larger yields, cloneable, flexible veg time",
          "Autos: Perfect for beginners, small spaces, outdoor grows with variable light",
          "Photos: Better for serious growers wanting to control yield and timing",
          "Autos cannot be cloned effectively — buy fresh seeds each grow",
          "Photos need a perpetual setup for year-round commercial harvest",
        ],
        scaleNote: "Beginner with 1–4 plants: autoflowers for simplicity. Serious hobby grower: photos for control and larger yields. Commercial: photos with staggered 12/12 flips for perpetual year-round harvest.",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    subtitle: "When something goes wrong",
    icon: "build-outline",
    color: "#ffa726",
    duration: "As needed",
    difficulty: "Beginner",
    steps: [
      {
        title: "Reading the Signs",
        description: "Your plants communicate through their leaves. Learning to read those signs quickly prevents small problems from becoming disasters. Always check pH first before diagnosing deficiencies — pH lockout mimics almost every deficiency.",
        tips: [
          "Check pH first — it's the cause of 80% of nutrient problems",
          "Yellow lower leaves starting at the bottom = Nitrogen deficiency",
          "Yellow spots/blotches on middle leaves = Calcium or Magnesium",
          "Brown crispy leaf tips = Nutrient burn or Potassium deficiency",
          "Dark green curling leaves ('claw') = Nitrogen excess or overwatering",
          "Pale new growth only = Iron/Zinc deficiency (pH-related)",
        ],
      },
      {
        title: "The FLUSH Solution",
        description: "When you're unsure what's wrong or have salt buildup, a flush with plain pH'd water resets your medium and removes accumulated salts. It's often the fastest fix for soil grows.",
        tips: [
          "Use 3x the pot volume in pH-corrected plain water",
          "Collect runoff and check EC — high EC = salt buildup",
          "After flush, resume feeding at 50% strength to avoid shock",
          "Works best in soil and coco",
          "DWC/hydro: complete reservoir change with fresh nutrients",
        ],
        warnings: ["Don't flush if you're in late flower — nutrients are needed for bud development until final 2 weeks"],
      },
      {
        title: "Pest & Disease Quick Guide",
        description: "Prevention is far easier than treatment. Maintain clean growing environments, proper airflow, and stable temperature/humidity to prevent 90% of pest and disease issues.",
        tips: [
          "Spider mites: Tiny dots on leaves, webbing underneath — treat with neem oil or spinosad",
          "Fungus gnats: Small flies, larvae damage roots — let soil dry more between waterings",
          "Thrips: Silver streaks on leaves — treat with spinosad or diatomaceous earth",
          "Powdery mildew: White powder on leaves — improve airflow, treat with potassium bicarbonate",
          "Bud rot: Gray mold inside dense buds — remove immediately, reduce humidity to <45%",
          "Root rot: Brown slimy roots, drooping — add Hydroguard, improve oxygenation",
        ],
        warnings: ["Bud rot spreads extremely fast in late flower — inspect dense colas daily in high humidity"],
      },
    ],
  },
];

interface LearnItem {
  id: string;
  name: string;
  summary: string;
  icon: string;
  color: string;
  detail: string;
  tips?: string[];
  warning?: string;
}

type LearnCategory = "problems" | "nutrients" | "techniques" | "environment" | "glossary";

const LEARN_CATEGORIES: { key: LearnCategory; label: string; icon: string }[] = [
  { key: "problems", label: "Problems", icon: "bug-outline" },
  { key: "nutrients", label: "Nutrients", icon: "flask-outline" },
  { key: "techniques", label: "Techniques", icon: "construct-outline" },
  { key: "environment", label: "Environment", icon: "thermometer-outline" },
  { key: "glossary", label: "Glossary", icon: "book-outline" },
];

const LEARN_CONTENT: Record<LearnCategory, LearnItem[]> = {
  problems: [
    {
      id: "n-deficiency",
      name: "Nitrogen Deficiency",
      summary: "Yellowing of lower/older leaves, working upward",
      icon: "warning-outline",
      color: "#ffa726",
      detail: "Nitrogen (N) deficiency is the most common cannabis deficiency. Lower, older leaves turn pale yellow, then completely yellow before falling off. Yellowing progresses from bottom up.\n\nCauses: Insufficient N in nutrients, pH lockout (most common cause), overwatering reducing nutrient uptake, depleted soil.",
      tips: [
        "CHECK pH FIRST — this solves 80% of N deficiency cases",
        "Increase nitrogen-rich nutrients (high-N veg formula)",
        "Soil pH: 6.0–7.0 | Hydro/coco: 5.5–6.5",
        "Foliar spray with diluted nitrogen for fast relief",
        "In late flower (week 7+): yellowing is NORMAL — plant using stored N",
      ],
      warning: "Normal in late flowering — don't over-correct during the last 2 weeks of flower!",
    },
    {
      id: "calmag",
      name: "Calcium/Magnesium Deficiency",
      summary: "Brown spots, interveinal yellowing, curling",
      icon: "warning-outline",
      color: "#66bb6a",
      detail: "CalMag deficiency is extremely common especially with LED lights, coco coir, or RO/filtered water. Calcium deficiency: brown spots with irregular edges on leaves. Magnesium shows as interveinal yellowing (leaf yellows but veins stay green).",
      tips: [
        "Add CalMag supplement to every feeding if using LED, coco, or RO water",
        "Standard dose: 1–5ml/gallon",
        "Epsom salt (MgSO4) works as emergency Mg fix: 1 tsp/gallon",
        "Test your tap water — hard water often has sufficient Ca/Mg naturally",
        "pH must be correct for Ca/Mg to be absorbed",
      ],
    },
    {
      id: "overwater",
      name: "Overwatering",
      summary: "Drooping, clawing leaves despite wet soil",
      icon: "water-outline",
      color: "#42a5f5",
      detail: "Overwatering is the #1 beginner mistake. It deprives roots of oxygen causing root rot and stunted growth. Leaves droop but feel thick and 'full' (unlike underwatering where leaves are thin and wilted).",
      tips: [
        "Lift the pot — learn the difference between wet weight and dry weight",
        "Only water when top 1–2 inches of soil is dry",
        "Never water on a fixed schedule — plants have different needs daily",
        "Fabric pots dramatically help prevent overwatering",
        "Seedlings and clones are most vulnerable",
      ],
      warning: "Root rot from chronic overwatering can kill a plant within days",
    },
    {
      id: "nute-burn",
      name: "Nutrient Burn",
      summary: "Brown/crispy leaf tips, working inward",
      icon: "flame-outline",
      color: "#ef5350",
      detail: "Nutrient burn is caused by excessive nutrient concentration. Shows as brown, crispy tips that look scorched. Distinguished from K deficiency by the green, healthy middle of the leaf with burned tips only.\n\nCauses: Following full manufacturer dose (often too high for cannabis), overfeeding, salt buildup in medium.",
      tips: [
        "Always start at 25–50% of recommended nutrient dose",
        "Flush medium with plain pH'd water if severe",
        "Reduce nutrient concentration and monitor EC/PPM",
        "Burned tips won't recover — watch that damage doesn't spread",
        "EC targets: Seedling 0.2–0.7 | Veg 0.6–2.0 | Flower 1.0–3.0",
      ],
    },
    {
      id: "bud-rot",
      name: "Bud Rot (Botrytis)",
      summary: "Gray mold inside dense buds in late flower",
      icon: "skull-outline",
      color: "#78909c",
      detail: "Botrytis is a devastating fungal disease that attacks dense buds in high humidity. It starts inside the bud where airflow can't reach and spreads outward. By the time you see gray/brown mushy spots on the outside, the infection may be advanced.",
      tips: [
        "Keep humidity BELOW 45% in late flower",
        "Maximize airflow — oscillating fans + strong extraction",
        "Remove infected buds IMMEDIATELY with clean scissors",
        "Preventive: potassium bicarbonate or diluted hydrogen peroxide spray",
        "If severe, consider early harvest of affected portions",
      ],
      warning: "Bud rot spreads extremely fast. Inspect daily in late flower. Remove all infected material immediately.",
    },
    {
      id: "spidermites",
      name: "Spider Mites",
      summary: "Tiny yellow dots on leaves, webbing underneath",
      icon: "bug-outline",
      color: "#8d6e63",
      detail: "Spider mites are tiny (1mm) arachnids that feed on plant cells. Yellow/white dots on top of leaves and fine webbing underneath. They thrive in hot, dry conditions and reproduce extremely rapidly.",
      tips: [
        "Inspect leaf undersides regularly with a loupe",
        "Increase humidity above 50% — mites hate moisture",
        "Neem oil, spinosad, or insecticidal soap (rotate to prevent resistance)",
        "Predatory mites (Phytoseiulus persimilis) for biological control",
        "Quarantine and treat all affected plants immediately",
      ],
      warning: "Spray during lights-off to prevent light burn on wet leaves",
    },
  ],
  nutrients: [
    {
      id: "npk",
      name: "NPK — The Big 3",
      summary: "Nitrogen, Phosphorus, Potassium — the foundation",
      icon: "flask",
      color: "#4caf50",
      detail: "The three primary macronutrients:\n\nNitrogen (N): Vegetative growth, chlorophyll, protein. High N in veg, reduce in flower.\n\nPhosphorus (P): Roots, energy transfer, bud production. Essential in flowering — ramp up at flip.\n\nPotassium (K): Water regulation, cell walls, overall health. High K throughout flower.",
      tips: [
        "Veg ratio: High N, lower P/K — look for 3-1-2 style ratios",
        "Early flower: Reduce N, increase P/K",
        "Late flower: Very low N, high P/K — taper nutrients before flush",
        "Never trust manufacturer doses blindly — start lower",
        "Runoff EC/PPM tells you what's in your medium",
      ],
    },
    {
      id: "ph",
      name: "pH — The #1 Factor",
      summary: "Controls all nutrient availability",
      icon: "options-outline",
      color: "#ffa726",
      detail: "pH controls which nutrients are available to plant roots. Even if nutrients are present, wrong pH locks them out completely — causing deficiency symptoms despite proper feeding.\n\nSoil: 6.0–7.0 (ideal: 6.2–6.8)\nCoco: 5.5–6.5 (ideal: 5.8–6.2)\nDWC/Hydro: 5.5–6.2 (ideal: 5.5–6.0)",
      tips: [
        "Test pH every single watering",
        "Digital pH meters are more accurate than pH drops",
        "Calibrate pH meter weekly with calibration solution",
        "pH-Up: Potassium hydroxide | pH-Down: Phosphoric acid",
        "Vary pH slightly between waterings within the range for full nutrient availability",
      ],
    },
    {
      id: "ec-ppm",
      name: "EC & PPM",
      summary: "Measuring how strong your nutrient solution is",
      icon: "analytics-outline",
      color: "#66bb6a",
      detail: "EC (Electrical Conductivity) and PPM (Parts Per Million) measure dissolved nutrient concentration. Too high = nutrient burn. Too low = deficiencies.\n\nGeneral PPM targets (500 scale):\nSeedlings: 100–350 PPM\nEarly veg: 300–700 PPM\nLate veg: 700–1000 PPM\nFlower: 1000–1600 PPM\nFlush: <150 PPM",
      tips: [
        "Measure EC/PPM before AND after mixing nutrients",
        "Compare input vs runoff PPM — high runoff = salt buildup",
        "500 scale (US) vs 700 scale (EU) — know which your meter uses",
        "Start lower and work up — can always add more",
        "High runoff EC: flush immediately",
      ],
    },
    {
      id: "calmag-info",
      name: "Calcium & Magnesium",
      summary: "Secondary macros — often deficient",
      icon: "flask",
      color: "#42a5f5",
      detail: "CalMag is needed in significant amounts. Common deficiency with:\n• LED lights (no radiant heat)\n• Coco coir (binds Ca/Mg)\n• RO/filtered water (stripped of minerals)\n• Fast-growing strains\n\nMagnesium is the central atom of chlorophyll — without it, plants cannot photosynthesize.",
      tips: [
        "Always add CalMag when using LED, coco, or RO water",
        "Standard dose: 1–5ml/gallon as preventative",
        "Epsom salt emergency fix: 1 tsp/gallon",
        "Hard tap water often has enough Ca/Mg naturally",
        "Correct pH must be maintained for Ca/Mg absorption",
      ],
    },
  ],
  techniques: [
    {
      id: "lst",
      name: "LST — Low Stress Training",
      summary: "Bend and tie stems for multiple colas",
      icon: "git-network-outline",
      color: "#4caf50",
      detail: "Low Stress Training involves bending stems down and tying them to expose lower bud sites to direct light. Creates a flat, wide canopy with multiple main colas instead of one dominant top.\n\nBest for: Any scale. Beginner-friendly — no cutting required.",
      tips: [
        "Start when plant has 4–6 nodes",
        "Bend main stem sideways, tie to edge of pot with soft plant ties",
        "As new growth reaches upward, bend and tie again",
        "Creates a flat canopy with many equal cola sites",
        "Combine with topping for maximum results",
      ],
    },
    {
      id: "topping",
      name: "Topping",
      summary: "Remove main tip to create 2 main colas",
      icon: "cut-outline",
      color: "#ffa726",
      detail: "Remove the very tip (apical meristem) of the main stem. Plant responds by growing two new main branches, effectively doubling main colas. Multiple toppings = 4, 8, or more colas.\n\nTop at nodes 3–5 for first top. Wait 1–2 weeks recovery before topping again.",
      tips: [
        "Cut above the 3rd–5th node",
        "Use clean, sharp scissors to minimize stress",
        "Recovery time: 1–2 weeks before explosive regrowth",
        "Topping twice: 4 main colas | Three times: 8 colas",
        "Don't top in the last 2 weeks of veg — no time to recover",
      ],
      warning: "Never top after switching to 12/12 — it severely stresses the plant",
    },
    {
      id: "scrog",
      name: "SCROG",
      summary: "Screen of Green — flat canopy, maximum light efficiency",
      icon: "grid-outline",
      color: "#42a5f5",
      detail: "Place a screen (2–4 inch square mesh) 8–16 inches above plants and weave branches through as they grow. Creates a flat canopy where every bud site gets equal light. Excellent for 1–4 plants in a tent.\n\nFill screen to 60–70% before switching to flower.",
      tips: [
        "Screen mesh: 2–4 inch squares",
        "Screen height: 8–16 inches above the medium",
        "Weave new growth through squares as it grows",
        "Fill 60–70% of screen before flipping to flower",
        "Remove lower growth (larf) to focus energy on screened colas",
      ],
    },
    {
      id: "defoliation",
      name: "Defoliation",
      summary: "Strategic leaf removal for airflow and light",
      icon: "leaf-outline",
      color: "#ef5350",
      detail: "Strategically remove fan leaves to improve airflow to lower bud sites and increase light penetration. Done at specific times during the grow — NOT randomly throughout.",
      tips: [
        "Only remove fan leaves that are blocking light to bud sites",
        "Best times: Start of flower (week 1–2) and week 5 of flower",
        "Never remove more than 20–30% of leaves at one time",
        "Autoflowers: Very light or no defoliation — they can't recover easily",
        "Allow 5–7 days recovery between defoliation sessions",
      ],
      warning: "Over-defoliation stresses plants and can significantly reduce yields",
    },
    {
      id: "sog",
      name: "SOG — Sea of Green",
      summary: "Many small plants, no training, fast harvests",
      icon: "apps-outline",
      color: "#66bb6a",
      detail: "Sea of Green involves growing many small plants with minimal training. Plants are flipped to flower early and kept short. More harvests per year, excellent for commercial production.\n\nKey: pack plants tightly (1–4 plants per sq ft), flip to flower after 2–3 weeks veg.",
      tips: [
        "1–4 plants per square foot depending on strain",
        "Flip to flower after 2–3 weeks veg",
        "No training needed — just grow them small and pack them",
        "Best with clones for genetic consistency",
        "Higher plant count = faster turnover = more harvests per year",
      ],
    },
  ],
  environment: [
    {
      id: "vpd",
      name: "VPD",
      summary: "Vapor Pressure Deficit — the ultimate environment metric",
      icon: "water-outline",
      color: "#42a5f5",
      detail: "VPD combines temperature and humidity into one metric that tells you exactly how much the plant is transpiring. Correct VPD = optimal growth and nutrient uptake.\n\nTargets:\nSeedling: 0.4–0.8 kPa\nVegetative: 0.8–1.2 kPa\nEarly flower: 1.0–1.5 kPa\nLate flower: 1.4–2.0 kPa",
      tips: [
        "Use a VPD chart to find the correct temp/RH combinations",
        "High VPD = fast transpiration = can dry out quickly",
        "Low VPD = slow transpiration = slower growth, mold risk",
        "Leaf temperature is 2–3°F lower than air temp — factor this in",
        "VPD controllers automate temperature and humidity together",
      ],
    },
    {
      id: "lighting",
      name: "Lighting Types Explained",
      summary: "LED, HPS, CMH — which should you use?",
      icon: "sunny-outline",
      color: "#ffa726",
      detail: "LED: Most efficient, lowest heat, full spectrum. Best value for most growers. Requires CalMag. Higher upfront cost.\n\nHPS: Proven, cheap to buy, excellent for flower, high heat output, higher electricity cost.\n\nCMH/LEC: Full spectrum + UV, great color rendering, more efficient than HPS, moderate heat.\n\nCFL/T5: Only suitable for seedlings and clones.",
      tips: [
        "LED: 30–50 watts actual draw per sq ft for flowering",
        "HPS: 50 watts per sq ft rule of thumb",
        "PPFD is the best way to measure light intensity (μmol/m²/s)",
        "Flower PPFD target: 600–1000 (no CO2), 1000–1500 (with CO2)",
        "LED distance matters — always follow manufacturer specifications",
      ],
    },
    {
      id: "airflow",
      name: "Airflow & Ventilation",
      summary: "Non-negotiable for healthy plants",
      icon: "cloud-outline",
      color: "#66bb6a",
      detail: "Proper airflow prevents mold, strengthens stems, manages temperature/humidity, and replenishes CO2. Aim to exchange the air in your grow space every 1–3 minutes.\n\nUse oscillating fans for gentle leaf movement. Inline fans with carbon filters for extraction.",
      tips: [
        "Air exchange rate: every 1–3 minutes for grow space volume",
        "Oscillating fans keep air moving — no dead zones",
        "Carbon filter + inline fan for smell control",
        "Under-canopy airflow prevents bud rot in late flower",
        "Negative pressure: slightly more air pulled out than pushed in",
      ],
    },
    {
      id: "co2",
      name: "CO2 Supplementation",
      summary: "20–30% yield boost — but only when dialed in",
      icon: "cloud-upload-outline",
      color: "#ab47bc",
      detail: "CO2 supplementation increases photosynthesis and yield significantly — but ONLY works if lighting and other factors are already optimized. At ambient 400 PPM, raising to 1000–1500 PPM dramatically increases growth.\n\nNOT worth adding in a poorly-controlled environment.",
      tips: [
        "Only beneficial with strong lighting (>600 PPFD) and optimized environment",
        "CO2 levels: 1000–1500 PPM for growth boost",
        "Temperature can run higher (85–90°F) with elevated CO2",
        "Sealed grow rooms work best for CO2 supplementation",
        "CO2 generators or tanks are the two main options",
      ],
      warning: "CO2 above 2000 PPM is dangerous to humans. Never enter a CO2-supplemented room while gassing",
    },
  ],
  glossary: [
    {
      id: "autoflower",
      name: "Autoflower",
      summary: "Flowers based on age, not light cycle",
      icon: "time-outline",
      color: "#ffa726",
      detail: "Autoflowering cannabis plants flower automatically based on age (2–4 weeks after germination) regardless of light schedule. Descended from Cannabis ruderalis.\n\nPros: Fast (60–90 days), no light schedule management, great for beginners, smaller footprint.\nCons: Cannot clone effectively, smaller yields than photos, less training flexibility.",
      tips: [
        "Run 18/6 or 20/4 light schedule throughout entire grow",
        "Don't top autos — use light LST only if training",
        "Start in final pot — autos hate transplanting",
        "Autoflowers are ideal for beginners and outdoor grows",
      ],
    },
    {
      id: "trichomes",
      name: "Trichomes",
      summary: "Crystal glands containing THC, CBD, and terpenes",
      icon: "sparkles-outline",
      color: "#ab47bc",
      detail: "Trichomes are the tiny, crystal-like glandular structures covering cannabis buds and leaves. They contain cannabinoids (THC, CBD) and terpenes. Trichome color is the most accurate harvest indicator.\n\nClear = immature | Cloudy = peak THC | Amber = converting to CBN",
      tips: [
        "Use 30–100x jeweler's loupe or digital microscope",
        "Check trichomes on buds, not leaves (leaves amber faster)",
        "Clear: too early | Cloudy: peak THC | Amber: sedative",
        "Target: 70% cloudy + 30% amber for balanced effect",
        "Check multiple buds — top colas ripen before lower ones",
      ],
    },
    {
      id: "terpenes",
      name: "Terpenes",
      summary: "Aromatic compounds that shape flavor and effect",
      icon: "flower-outline",
      color: "#66bb6a",
      detail: "Terpenes are aromatic organic compounds that give each strain its unique smell and flavor. They also modulate the effects of cannabinoids (entourage effect).\n\nMyrcene: Earthy/sedating | Limonene: Citrus/uplifting | Caryophyllene: Spicy/anti-inflammatory | Pinene: Pine/alertness | Linalool: Floral/calming",
      tips: [
        "Harvest in the morning before lights-on for peak terpene content",
        "Slow, cool drying preserves terpenes",
        "Long curing develops terpene complexity",
        "High heat destroys terpenes — vaporize below 385°F",
        "Smell is the best real-time indicator of terpene richness",
      ],
    },
    {
      id: "ppfd",
      name: "PPFD & DLI",
      summary: "Measuring actual light intensity for cannabis",
      icon: "sunny-outline",
      color: "#ffa726",
      detail: "PPFD (Photosynthetic Photon Flux Density) measures light intensity in μmol/m²/s. It's the most accurate way to measure how much usable light your plants receive.\n\nDLI (Daily Light Integral) = PPFD × hours × 0.0036. Measures total light received per day.\n\nSeedlings: 200–400 PPFD | Veg: 400–600 PPFD | Flower: 600–1000 PPFD",
      tips: [
        "A quantum PAR meter gives you exact PPFD at canopy level",
        "Different areas of your canopy receive different PPFD — measure multiple spots",
        "Higher PPFD with CO2 supplementation allows 1000–1500 PPFD",
        "DLI target for cannabis: 20–40 mol/m²/d",
        "Too high PPFD without CO2 causes light stress/bleaching",
      ],
    },
    {
      id: "cloning",
      name: "Cloning",
      summary: "Creating identical copies from cuttings",
      icon: "copy-outline",
      color: "#4caf50",
      detail: "Cloning takes a cutting from a mother plant and roots it to create a genetic copy. Preserves your best phenotypes and skips germination/seedling stages.\n\nBasic process: 4–6 inch branch cutting → remove lower leaves → rooting hormone → rooting medium → high humidity dome → roots develop in 7–21 days.",
      tips: [
        "Only clone from plants in vegetative stage — never flower",
        "45° angle cut with clean, sharp blade",
        "Immediately place in water or rooting hormone",
        "High humidity dome is essential (70–80% RH)",
        "Bottom heat 72–77°F speeds up rooting",
        "Never clone autoflowers — it defeats the purpose",
      ],
    },
  ],
};

const DIFFICULTY_COLORS = {
  Beginner: "#66bb6a",
  Intermediate: "#ffa726",
  Advanced: "#ef5350",
};

function GuideModal({ guide, onClose }: { guide: Guide; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={[mStyles.container, { backgroundColor: C.background }]}>
        <View style={[mStyles.header, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={onClose} style={mStyles.closeBtn}>
            <Ionicons name="close" size={24} color={C.textSecondary} />
          </Pressable>
          <View style={mStyles.headerInfo}>
            <View style={[mStyles.iconCircle, { backgroundColor: guide.color + "22" }]}>
              <Ionicons name={guide.icon as any} size={24} color={guide.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={mStyles.guideTitle}>{guide.title}</Text>
              <Text style={mStyles.guideSubtitle}>{guide.subtitle}</Text>
            </View>
          </View>
          <View style={mStyles.metaRow}>
            <View style={[mStyles.badge, { backgroundColor: DIFFICULTY_COLORS[guide.difficulty] + "22" }]}>
              <Text style={[mStyles.badgeText, { color: DIFFICULTY_COLORS[guide.difficulty] }]}>{guide.difficulty}</Text>
            </View>
            <View style={[mStyles.badge, { backgroundColor: C.backgroundTertiary }]}>
              <Ionicons name="time-outline" size={12} color={C.textMuted} />
              <Text style={mStyles.badgeText}>{guide.duration}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[mStyles.content, { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {guide.steps.map((step, index) => (
            <Pressable
              key={index}
              style={mStyles.stepCard}
              onPress={() => setExpandedStep(expandedStep === index ? null : index)}
            >
              <View style={mStyles.stepHeader}>
                <View style={mStyles.stepNumber}>
                  <Text style={mStyles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={mStyles.stepTitle}>{step.title}</Text>
                <Ionicons name={expandedStep === index ? "chevron-up" : "chevron-down"} size={18} color={C.textMuted} />
              </View>

              {expandedStep === index && (
                <View style={mStyles.stepContent}>
                  <Text style={mStyles.stepDescription}>{step.description}</Text>

                  <View style={mStyles.tipsContainer}>
                    <View style={mStyles.tipsHeader}>
                      <Ionicons name="checkmark-circle" size={16} color={C.tint} />
                      <Text style={mStyles.tipsLabel}>Tips & Info</Text>
                    </View>
                    {step.tips.map((tip, i) => (
                      <View key={i} style={mStyles.tipItem}>
                        <View style={mStyles.tipBullet} />
                        <Text style={mStyles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>

                  {step.scaleNote && (
                    <View style={mStyles.scaleBox}>
                      <View style={mStyles.tipsHeader}>
                        <Ionicons name="resize-outline" size={16} color="#42a5f5" />
                        <Text style={[mStyles.tipsLabel, { color: "#42a5f5" }]}>Any Scale</Text>
                      </View>
                      <Text style={mStyles.scaleText}>{step.scaleNote}</Text>
                    </View>
                  )}

                  {step.warnings && step.warnings.length > 0 && (
                    <View style={mStyles.warningsContainer}>
                      <View style={mStyles.tipsHeader}>
                        <Ionicons name="warning" size={16} color={C.accent} />
                        <Text style={[mStyles.tipsLabel, { color: C.accent }]}>Watch Out</Text>
                      </View>
                      {step.warnings.map((w, i) => (
                        <View key={i} style={mStyles.tipItem}>
                          <View style={[mStyles.tipBullet, { backgroundColor: C.accent }]} />
                          <Text style={[mStyles.tipText, { color: C.textSecondary }]}>{w}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function LearnDetailModal({ item, onClose }: { item: LearnItem; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={[lStyles.container, { backgroundColor: C.background }]}>
        <View style={[lStyles.header, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={onClose} style={lStyles.closeBtn}>
            <Ionicons name="close" size={24} color={C.textSecondary} />
          </Pressable>
          <View style={lStyles.headerContent}>
            <View style={[lStyles.iconWrap, { backgroundColor: item.color + "22" }]}>
              <Ionicons name={item.icon as any} size={28} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={lStyles.name}>{item.name}</Text>
              <Text style={lStyles.summary}>{item.summary}</Text>
            </View>
          </View>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[lStyles.content, { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={lStyles.detail}>{item.detail}</Text>
          {item.tips && item.tips.length > 0 && (
            <View style={lStyles.tipsBox}>
              <View style={lStyles.tipsHeader}>
                <Ionicons name="checkmark-circle" size={16} color={C.tint} />
                <Text style={lStyles.tipsTitle}>Key Tips</Text>
              </View>
              {item.tips.map((tip, i) => (
                <View key={i} style={lStyles.tipRow}>
                  <View style={lStyles.tipDot} />
                  <Text style={lStyles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
          {item.warning && (
            <View style={lStyles.warningBox}>
              <Ionicons name="warning" size={18} color={C.warning} />
              <Text style={lStyles.warningText}>{item.warning}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function GuidesScreen() {
  const insets = useSafeAreaInsets();
  const [section, setSection] = useState<Section>("guides");
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [learnCategory, setLearnCategory] = useState<LearnCategory>("problems");
  const [selectedLearnItem, setSelectedLearnItem] = useState<LearnItem | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 118 : 100 }}
      >
        <LinearGradient
          colors={["#0d2410", "#0a130b"]}
          style={[styles.header, { paddingTop: topPad + 20 }]}
        >
          <Text style={styles.headerTitle}>Guides & Encyclopedia</Text>
          <Text style={styles.headerSubtitle}>For 1 plant or 1,000 — scaled to your setup</Text>

          <View style={styles.segmentRow}>
            <Pressable
              style={[styles.segment, section === "guides" && styles.segmentActive]}
              onPress={() => setSection("guides")}
            >
              <Ionicons name="book" size={15} color={section === "guides" ? "#fff" : C.textMuted} />
              <Text style={[styles.segmentText, section === "guides" && styles.segmentTextActive]}>Grow Guides</Text>
            </Pressable>
            <Pressable
              style={[styles.segment, section === "learn" && styles.segmentActive]}
              onPress={() => setSection("learn")}
            >
              <Ionicons name="library" size={15} color={section === "learn" ? "#fff" : C.textMuted} />
              <Text style={[styles.segmentText, section === "learn" && styles.segmentTextActive]}>Encyclopedia</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {section === "guides" && (
          <View style={styles.content}>
            {GUIDES.map((guide) => (
              <Pressable
                key={guide.id}
                style={({ pressed }) => [styles.guideCard, pressed && styles.guideCardPressed]}
                onPress={() => setSelectedGuide(guide)}
              >
                <View style={[styles.guideIconWrap, { backgroundColor: guide.color + "18" }]}>
                  <Ionicons name={guide.icon as any} size={28} color={guide.color} />
                </View>
                <View style={styles.guideInfo}>
                  <View style={styles.guideTitleRow}>
                    <Text style={styles.guideTitle}>{guide.title}</Text>
                    <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLORS[guide.difficulty] + "22" }]}>
                      <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[guide.difficulty] }]}>{guide.difficulty}</Text>
                    </View>
                  </View>
                  <Text style={styles.guideSubtitle}>{guide.subtitle}</Text>
                  <View style={styles.guideMeta}>
                    <Ionicons name="time-outline" size={13} color={C.textMuted} />
                    <Text style={styles.guideMetaText}>{guide.duration}</Text>
                    <Text style={styles.guideSep}>·</Text>
                    <Text style={styles.guideMetaText}>{guide.steps.length} sections</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
              </Pressable>
            ))}
          </View>
        )}

        {section === "learn" && (
          <View style={styles.content}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {LEARN_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.key}
                  style={[styles.catChip, learnCategory === cat.key && styles.catChipActive]}
                  onPress={() => setLearnCategory(cat.key)}
                >
                  <Ionicons name={cat.icon as any} size={14} color={learnCategory === cat.key ? "#fff" : C.textMuted} />
                  <Text style={[styles.catLabel, learnCategory === cat.key && styles.catLabelActive]}>{cat.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {LEARN_CONTENT[learnCategory].map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [styles.guideCard, pressed && { opacity: 0.8 }]}
                onPress={() => setSelectedLearnItem(item)}
              >
                <View style={[styles.guideIconWrap, { backgroundColor: item.color + "18" }]}>
                  <Ionicons name={item.icon as any} size={28} color={item.color} />
                </View>
                <View style={styles.guideInfo}>
                  <Text style={styles.guideTitle}>{item.name}</Text>
                  <Text style={styles.guideSubtitle}>{item.summary}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {selectedGuide && <GuideModal guide={selectedGuide} onClose={() => setSelectedGuide(null)} />}
      {selectedLearnItem && <LearnDetailModal item={selectedLearnItem} onClose={() => setSelectedLearnItem(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 28, color: C.text },
  headerSubtitle: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 4, marginBottom: 16 },
  segmentRow: {
    flexDirection: "row",
    backgroundColor: C.backgroundTertiary,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentActive: { backgroundColor: C.tint },
  segmentText: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: C.textMuted },
  segmentTextActive: { color: "#fff" },
  content: { padding: 16, gap: 10 },
  catScroll: { marginBottom: 12 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginRight: 8,
  },
  catChipActive: { backgroundColor: C.tint, borderColor: C.tint },
  catLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textMuted },
  catLabelActive: { color: "#fff" },
  guideCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  guideCardPressed: { opacity: 0.75 },
  guideIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  guideInfo: { flex: 1 },
  guideTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  guideTitle: { fontFamily: "Nunito_700Bold", fontSize: 15, color: C.text, flex: 1 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  diffText: { fontFamily: "Nunito_600SemiBold", fontSize: 10 },
  guideSubtitle: { fontFamily: "Nunito_400Regular", fontSize: 12, color: C.textSecondary, marginBottom: 4 },
  guideMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  guideMetaText: { fontFamily: "Nunito_400Regular", fontSize: 11, color: C.textMuted },
  guideSep: { color: C.textMuted, fontSize: 11 },
});

const mStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  closeBtn: { alignSelf: "flex-end", padding: 4, marginBottom: 12 },
  headerInfo: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
  iconCircle: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  guideTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 20, color: C.text },
  guideSubtitle: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: "row", gap: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textMuted },
  content: { padding: 16, gap: 10 },
  stepCard: { backgroundColor: C.card, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.tint, alignItems: "center", justifyContent: "center" },
  stepNumberText: { fontFamily: "Nunito_700Bold", fontSize: 14, color: "#fff" },
  stepTitle: { flex: 1, fontFamily: "Nunito_700Bold", fontSize: 14, color: C.text },
  stepContent: { padding: 14, paddingTop: 0, gap: 12 },
  stepDescription: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textSecondary, lineHeight: 21 },
  tipsContainer: { backgroundColor: C.backgroundTertiary, borderRadius: 10, padding: 12, gap: 8 },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  tipsLabel: { fontFamily: "Nunito_700Bold", fontSize: 13, color: C.tint },
  tipItem: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  tipBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.tint, marginTop: 7, flexShrink: 0 },
  tipText: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.text, flex: 1, lineHeight: 19 },
  scaleBox: { backgroundColor: "#42a5f5" + "11", borderRadius: 10, padding: 12, gap: 8, borderWidth: 1, borderColor: "#42a5f5" + "33" },
  scaleText: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary, lineHeight: 19 },
  warningsContainer: { backgroundColor: C.accent + "11", borderRadius: 10, padding: 12, gap: 8, borderWidth: 1, borderColor: C.accent + "33" },
});

const lStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  closeBtn: { alignSelf: "flex-end", marginBottom: 12 },
  headerContent: { flexDirection: "row", gap: 14, alignItems: "center" },
  iconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: "Nunito_800ExtraBold", fontSize: 20, color: C.text },
  summary: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 2 },
  content: { padding: 16, gap: 14 },
  detail: { fontFamily: "Nunito_400Regular", fontSize: 15, color: C.textSecondary, lineHeight: 24, backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
  tipsBox: { backgroundColor: C.backgroundTertiary, borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, borderColor: C.cardBorder },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  tipsTitle: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.tint },
  tipRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.tint, marginTop: 8, flexShrink: 0 },
  tipText: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.text, flex: 1, lineHeight: 20 },
  warningBox: { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: C.warning + "18", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.warning + "44" },
  warningText: { fontFamily: "Nunito_600SemiBold", fontSize: 14, color: C.warning, flex: 1, lineHeight: 20 },
});
