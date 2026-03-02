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

type Category = "problems" | "nutrients" | "techniques" | "environment" | "glossary";

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

const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: "problems", label: "Problems", icon: "bug-outline" },
  { key: "nutrients", label: "Nutrients", icon: "flask-outline" },
  { key: "techniques", label: "Techniques", icon: "construct-outline" },
  { key: "environment", label: "Environment", icon: "thermometer-outline" },
  { key: "glossary", label: "Glossary", icon: "book-outline" },
];

const CONTENT: Record<Category, LearnItem[]> = {
  problems: [
    {
      id: "n-deficiency",
      name: "Nitrogen Deficiency",
      summary: "Yellowing of lower/older leaves",
      icon: "warning-outline",
      color: "#ffa726",
      detail: "Nitrogen (N) deficiency is the most common cannabis deficiency. It shows up first on lower, older leaves which turn pale yellow, then completely yellow before falling off. The yellowing progresses from the bottom up.\n\nCauses: Insufficient N in nutrients, incorrect pH locking out N (soil: 6.0–7.0, coco/hydro: 5.5–6.5), overwatering reducing nutrient uptake, root problems.",
      tips: [
        "Increase nitrogen-rich nutrients (high N veg formula)",
        "Check and correct pH first — it's the most common cause",
        "Some yellowing in late flower is normal — the plant is using stored N",
        "Foliar spray with diluted nutrients for fast relief",
      ],
      warning: "Normal in late flowering — don't over-correct!",
    },
    {
      id: "p-deficiency",
      name: "Phosphorus Deficiency",
      summary: "Dark green/purple leaves, slow growth",
      icon: "warning-outline",
      color: "#ab47bc",
      detail: "Phosphorus deficiency causes dark green leaves that develop a reddish or purplish tint, especially on the undersides of leaves and stems. Growth slows significantly. Leaves may cup downward and show brown spots.\n\nCommon in cool growing environments (roots struggle to absorb P below 60°F) and in incorrect pH (P available at 6.0–7.0 soil).",
      tips: [
        "Raise root zone temperature above 65°F",
        "Correct pH to 6.0–7.0 (soil) or 5.5–6.5 (hydro)",
        "Add bloom nutrients high in phosphorus",
        "Flush media and re-feed if salt buildup is suspected",
      ],
    },
    {
      id: "k-deficiency",
      name: "Potassium Deficiency",
      summary: "Brown/burnt leaf edges and tips",
      icon: "warning-outline",
      color: "#ef5350",
      detail: "Potassium (K) deficiency appears as brown or 'burnt' edges on leaves, especially older fan leaves. Tips and margins look crispy. Can look like nutrient burn but usually starts on older leaves and lacks the green healthy center.\n\nCauses: Low K in medium, incorrect pH, or excess sodium/chloride competing with K uptake.",
      tips: [
        "Add a potassium supplement (e.g., Potassium silicate, Cha Ching)",
        "Flush and re-feed if using soil",
        "Ensure pH is in the optimal range",
        "Often worsens under heat or humidity stress",
      ],
    },
    {
      id: "calmag",
      name: "Calcium/Magnesium Deficiency",
      summary: "Brown spots, curling, interveinal yellowing",
      icon: "warning-outline",
      color: "#66bb6a",
      detail: "CalMag deficiency is extremely common, especially with LED lighting, coco coir, or RO water. Calcium deficiency appears as brown spots on leaves with irregular edges, sometimes progressing to holes. Magnesium shows as interveinal yellowing (leaf turns yellow but veins stay green).",
      tips: [
        "Add CalMag supplement to every feeding",
        "LED growers should always use CalMag — LEDs don't radiate heat that helps Ca/Mg absorption",
        "Coco coir growers need extra CalMag — coco holds onto Ca/Mg",
        "Use at 1–5ml/gallon as preventative measure",
      ],
    },
    {
      id: "overwater",
      name: "Overwatering",
      summary: "Drooping, clawing, slow growth",
      icon: "water-outline",
      color: "#42a5f5",
      detail: "Overwatering is the #1 mistake beginners make. It deprives roots of oxygen, leading to root rot and stunted growth. Symptoms: leaves drooping while looking thick and 'full' (not wilting from underwatering, which looks thin and curled), slow growth, soil constantly wet, possible yellowing.\n\nThe plant will NOT recover quickly from overwatering — prevention is key.",
      tips: [
        "Water only when top 1–2 inches of soil is dry",
        "Lift the pot — learn the difference between wet/dry weight",
        "Never water on a schedule — only when the plant needs it",
        "Ensure pots have adequate drainage holes",
        "Use fabric pots for automatic aeration of roots",
      ],
      warning: "Root rot from overwatering can kill a plant in days",
    },
    {
      id: "nute-burn",
      name: "Nutrient Burn",
      summary: "Brown/yellow leaf tips",
      icon: "flame-outline",
      color: "#ef5350",
      detail: "Nutrient burn (nute burn) is caused by too-high nutrient concentrations in the growing medium. It shows as brown, crispy leaf tips that look scorched. May progress inward on the leaf. Most common when following full manufacturer dose recommendations (which are often too high).",
      tips: [
        "Always start at 25–50% of recommended nutrient dose",
        "Flush the medium with plain pH'd water",
        "Reduce nutrient concentration significantly",
        "Monitor EC/PPM — keep within stage-appropriate ranges",
        "Burned tips won't recover — watch that it doesn't spread",
      ],
    },
    {
      id: "bud-rot",
      name: "Bud Rot (Botrytis)",
      summary: "Gray mold inside dense buds",
      icon: "skull-outline",
      color: "#78909c",
      detail: "Botrytis (bud rot) is a devastating fungal disease that attacks dense buds in high humidity conditions. It starts inside the bud where airflow can't reach and spreads outward. By the time you see gray/brown mushy spots, the infection is often already advanced.\n\nHigh risk: Late flower with humidity above 50%, dense buds, poor airflow.",
      tips: [
        "Keep humidity BELOW 45% in late flower",
        "Maximize airflow — oscillating fans and good extraction",
        "Remove infected buds IMMEDIATELY and sterilize scissors",
        "Preventive sprays: potassium bicarbonate, diluted hydrogen peroxide",
        "If severe, consider early harvest of affected portions",
      ],
      warning: "Bud rot spreads extremely fast. Quarantine and remove immediately!",
    },
    {
      id: "spidermites",
      name: "Spider Mites",
      summary: "Tiny dots on leaves, webbing underneath",
      icon: "bug-outline",
      color: "#8d6e63",
      detail: "Spider mites are tiny (1mm) arachnids that feed on plant cells. They appear as tiny yellow/white dots on top of leaves. Check underneath leaves with a loupe — you'll see the mites and fine webbing. Thrive in hot, dry conditions. Explosive populations if not caught early.",
      tips: [
        "Inspect undersides of leaves regularly",
        "Increase humidity above 50% — mites hate moisture",
        "Spray with neem oil, spinosad, or insecticidal soap",
        "Predatory mites (Phytoseiulus persimilis) for biological control",
        "Quarantine infested plants immediately",
      ],
      warning: "Spray during lights-off to prevent light burn on wet leaves",
    },
  ],
  nutrients: [
    {
      id: "npk",
      name: "NPK — The Big 3",
      summary: "Nitrogen, Phosphorus, Potassium",
      icon: "flask",
      color: "#4caf50",
      detail: "The three macronutrients are the foundation of plant nutrition:\n\nNitrogen (N): Essential for vegetative growth, chlorophyll production, and protein synthesis. Plants are hungry for N during veg. Reduce in flower.\n\nPhosphorus (P): Critical for root development, energy transfer, and bud production. Ramp up during flowering.\n\nPotassium (K): Regulates water uptake, strengthens cell walls, and is vital for overall plant health and flower development.",
      tips: [
        "Veg: High N, medium P/K ratio (e.g., 3-1-2)",
        "Early flower: Reduce N, increase P/K (e.g., 1-3-2)",
        "Late flower: Very low N, high P/K + flush",
        "Watch EC/PPM to avoid over-feeding",
      ],
    },
    {
      id: "calmag-info",
      name: "Calcium & Magnesium",
      summary: "Secondary macros — often deficient",
      icon: "flask",
      color: "#42a5f5",
      detail: "Calcium (Ca) and Magnesium (Mg) are secondary macronutrients critical for healthy cannabis. CalMag deficiency is very common with:\n- LED lights (no radiant heat aiding uptake)\n- Coco coir (naturally binds Ca/Mg)\n- RO/distilled water (stripped of minerals)\n- Fast-growing strains\n\nMagnesium is the center atom of chlorophyll — without it, plants can't photosynthesize.",
      tips: [
        "Add CalMag to every feeding if using LED, coco, or RO water",
        "Standard dose: 1–5ml/gallon depending on other nutrients",
        "Epsom salt (MgSO4) is a cheap Mg supplement: 1 tsp/gallon",
        "Test your tap water — hard water often has enough Ca/Mg naturally",
      ],
    },
    {
      id: "micronutrients",
      name: "Micronutrients",
      summary: "Iron, Zinc, Manganese, Copper & more",
      icon: "flask",
      color: "#ab47bc",
      detail: "Micronutrients are needed in tiny amounts but are essential for plant health. Quality nutrient products include them, but deficiencies can occur from:\n- pH lockout (most common)\n- Cheap/incomplete nutrient lines\n- Heavily leached or depleted soils\n\nIron deficiency: Interveinal yellowing on NEW growth\nZinc deficiency: Twisted, deformed new growth\nManganese: Yellowing between veins of new leaves",
      tips: [
        "Correct pH fixes most micro deficiencies — pH lockout is the usual culprit",
        "Use a complete nutrient line with micronutrient package",
        "Humic/fulvic acid improves micronutrient absorption",
        "Molasses adds trace minerals and beneficial microbes (soil only)",
      ],
    },
    {
      id: "ph",
      name: "pH — The #1 Factor",
      summary: "Controls all nutrient availability",
      icon: "options-outline",
      color: "#ffa726",
      detail: "pH is the single most important factor in cannabis nutrient management. Even if nutrients are present in the medium, incorrect pH can completely lock them out — making them unavailable to the plant.\n\nOptimal pH ranges:\n- Soil: 6.0–7.0 (sweet spot: 6.2–6.8)\n- Coco Coir: 5.5–6.5 (sweet spot: 5.8–6.2)\n- DWC/Hydro: 5.5–6.5 (sweet spot: 5.5–6.0)\n\nSlightly vary pH between waterings within the range to allow uptake of all nutrients.",
      tips: [
        "Test pH every time you water/feed",
        "Digital pH meters are more accurate than drops — calibrate weekly",
        "pH-Up: Potassium hydroxide | pH-Down: Phosphoric acid",
        "Flush if pH has been off — re-establish correct pH",
        "Varying pH slightly (6.2, 6.5, 6.8, back to 6.2) improves nutrient availability",
      ],
    },
    {
      id: "ec-ppm",
      name: "EC & PPM — Feeding Strength",
      summary: "Measuring nutrient concentration",
      icon: "analytics-outline",
      color: "#66bb6a",
      detail: "EC (Electrical Conductivity) and PPM (Parts Per Million) measure the concentration of dissolved nutrients in your water. Too high = nutrient burn. Too low = deficiencies.\n\nGeneral ranges (500 scale):\n- Plain water/RO: 0–150 PPM (0–0.3 EC)\n- Seedlings: 100–350 PPM (0.2–0.7 EC)\n- Early veg: 300–700 PPM (0.6–1.4 EC)\n- Late veg: 700–1000 PPM (1.4–2.0 EC)\n- Flower: 1000–1600 PPM (2.0–3.2 EC)\n- Flush: 0–150 PPM",
      tips: [
        "Always measure EC/PPM before and after feeding",
        "If runoff PPM is much higher than input — flush!",
        "Some meters use 500 scale (US), others 700 scale (EU) — know which you have",
        "Start low and increase gradually — you can always add but can't remove",
      ],
    },
  ],
  techniques: [
    {
      id: "lst",
      name: "LST — Low Stress Training",
      summary: "Bend and tie stems for more colas",
      icon: "git-network-outline",
      color: "#4caf50",
      detail: "Low Stress Training (LST) involves bending and tying down stems to create a more horizontal, flat canopy. This exposes lower bud sites to direct light and promotes the growth of multiple main colas instead of one dominant top.\n\nBest done during early-to-mid vegetative stage when stems are still flexible. Very beginner-friendly — no cutting required.",
      tips: [
        "Start when plant has 4–6 nodes",
        "Bend main stem sideways, tie to edge of pot with soft ties",
        "As new growth reaches up, bend and tie again",
        "Creates a flat, wide canopy with many cola sites",
        "Can be combined with topping for maximum results",
      ],
    },
    {
      id: "topping",
      name: "Topping",
      summary: "Remove main tip to create 2 main colas",
      icon: "cut-outline",
      color: "#ffa726",
      detail: "Topping involves removing the very tip (apical meristem) of the main stem. The plant responds by growing two new main branches from the nodes below, effectively doubling the number of main colas. Multiple toppings can create 4, 8, or more main colas.\n\nBest done at nodes 3–5 for the first top. Wait until plant recovers before topping again (1–2 weeks).",
      tips: [
        "Top above the 3rd–5th node for best results",
        "Cut with clean, sharp scissors to minimize stress",
        "Plants take 1–2 weeks to recover before explosive growth",
        "Topping twice creates 4 main colas; three times = 8 colas",
        "Don't top in the last 2 weeks of veg — no time to recover",
      ],
      warning: "Don't top after switching to flower — it will severely stress the plant",
    },
    {
      id: "fim",
      name: "FIMing",
      summary: "Create 4 tops from one cut (beginner-friendly)",
      icon: "cut-outline",
      color: "#ab47bc",
      detail: "FIM (F*** I Missed) is a topping variation where you cut only about 75% of the new growth tip instead of removing it entirely. This often results in 4 new tops growing from a single cut — more efficient than traditional topping.\n\nLess stressful than topping and results in faster recovery. The odd name comes from the accidental discovery of the technique.",
      tips: [
        "Cut off 75% of the newest growth tip — leave 25% behind",
        "You may get 4 new tops instead of 2 from topping",
        "Less precise than topping — results vary",
        "Plants recover faster than from topping",
        "Great for growers new to training",
      ],
    },
    {
      id: "scrog",
      name: "SCROG — Screen of Green",
      summary: "Horizontal screen for even canopy",
      icon: "grid-outline",
      color: "#42a5f5",
      detail: "SCROG involves placing a screen (usually 2–4 inch squares) above your plants and weaving branches through it as they grow. This creates a perfectly flat canopy where every bud site receives equal light. Extremely efficient use of lighting.\n\nSet up the screen 8–16 inches above the pots. Fill the screen to 60–70% before switching to flower.",
      tips: [
        "Screen height: 8–16 inches above canopy",
        "Weave new growth through screen squares as it grows",
        "Fill screen to 60–70% before flipping to flower",
        "After flipping, plants will grow another 50–100% (stretch)",
        "Flush bottom growth (larf) to focus energy on screened colas",
      ],
    },
    {
      id: "defoliation",
      name: "Defoliation",
      summary: "Strategic leaf removal for airflow and light",
      icon: "leaf-outline",
      color: "#ef5350",
      detail: "Defoliation means strategically removing fan leaves to increase airflow to lower bud sites and improve light penetration. Done aggressively in veg (Schwazzing) or moderately during flower.\n\nControversial technique — less is more. Removing too many leaves stresses the plant and reduces photosynthesis.",
      tips: [
        "Remove only fan leaves blocking bud sites",
        "Best time: Beginning of flower (week 1–2) and week 5",
        "Never remove more than 20–30% of leaves at once",
        "Autoflowers: Very light defoliation only — they can't recover as easily",
        "Always allow recovery time between defoliation sessions",
      ],
      warning: "Over-defoliation can stunt growth and reduce yields",
    },
    {
      id: "mainlining",
      name: "Manifolding/Mainlining",
      summary: "Create a symmetrical multi-cola structure",
      icon: "git-branch-outline",
      color: "#66bb6a",
      detail: "Mainlining creates a symmetrical plant structure by topping at node 3, then removing all growth below to create exactly 2 main colas. These are then topped again to create 4 perfectly even colas, then 8. Every cola receives exactly equal nutrient flow and light.\n\nProduces extremely consistent, uniform harvests. Requires planning and patience.",
      tips: [
        "Top at node 3 (keep only the 3rd internode)",
        "Remove all growth below the 3rd node",
        "Bend and tie 2 resulting branches horizontally",
        "Top again when branches have 3 nodes for 4 colas",
        "Requires longer veg time but maximizes yield efficiency",
      ],
    },
  ],
  environment: [
    {
      id: "vpd",
      name: "VPD — Vapor Pressure Deficit",
      summary: "The relationship between temp and humidity",
      icon: "water-outline",
      color: "#42a5f5",
      detail: "VPD (Vapor Pressure Deficit) is the most advanced way to think about grow room humidity. It describes the difference between the amount of moisture in the air and the maximum amount it could hold. Correct VPD maximizes transpiration and nutrient uptake.\n\nTarget VPD ranges:\n- Seedling: 0.4–0.8 kPa\n- Vegetative: 0.8–1.2 kPa\n- Early flower: 1.0–1.5 kPa\n- Late flower: 1.4–2.0 kPa\n\nVPD is more accurate than just using humidity alone — it accounts for both temp and RH together.",
      tips: [
        "Use a VPD chart to find optimal temp/RH combinations",
        "High VPD = plant transpires fast = can dry out quickly",
        "Low VPD = slow transpiration = slower growth, mold risk",
        "Most plants in late flower benefit from lower RH (30–40%)",
        "Leaf temperature is slightly lower than air temp — factor this in",
      ],
    },
    {
      id: "lighting",
      name: "Lighting Types",
      summary: "HPS, LED, CMH, CFL — pros and cons",
      icon: "sunny-outline",
      color: "#ffa726",
      detail: "Choosing the right light is one of the most important grow room decisions:\n\nLED (Light Emitting Diode): Most energy efficient, low heat, full spectrum. Best for most modern growers. Higher upfront cost. Requires CalMag supplementation.\n\nHPS (High Pressure Sodium): Proven results, cheap to buy, great for flower. High heat output, higher electricity cost. The traditional gold standard.\n\nCMH/LEC (Ceramic Metal Halide): Full spectrum including UV, excellent color rendering, moderate heat. More efficient than HPS. Great all-around light.\n\nCFL/T5: Only suitable for seedlings and clones. Not enough intensity for veg or flower.",
      tips: [
        "LED: 30–50 watts actual draw per sq ft for flower",
        "HPS: 50 watts per sq ft is the rule of thumb",
        "Light distance matters — always follow manufacturer guidelines",
        "PPFD (μmol/m²/s) is the best way to measure light intensity",
        "Flower target PPFD: 600–1000 (intermediate), 1000–1500 (with CO2)",
      ],
    },
    {
      id: "airflow",
      name: "Airflow & Ventilation",
      summary: "Critical for healthy plants and mold prevention",
      icon: "cloud-outline",
      color: "#66bb6a",
      detail: "Proper airflow is non-negotiable for successful cannabis cultivation. It strengthens stems, prevents mold and pest infestations, manages temperature and humidity, and replenishes CO2.\n\nAim to exchange the air in your grow space every 1–3 minutes. Use oscillating fans for gentle leaf movement and inline fans/carbon filters for extraction.",
      tips: [
        "Air exchange rate: change air every 1–3 minutes",
        "Oscillating fans keep air moving around plants — no hot/cold spots",
        "Carbon filter + inline fan eliminates smell",
        "Under-canopy airflow prevents bud rot in late flower",
        "Negative pressure: extraction should be slightly stronger than intake",
      ],
    },
    {
      id: "co2",
      name: "CO2 Supplementation",
      summary: "Boost yields by 20–30% with added CO2",
      icon: "cloud-upload-outline",
      color: "#ab47bc",
      detail: "Plants use CO2 for photosynthesis. Ambient CO2 levels are ~400 PPM. Raising CO2 to 1000–1500 PPM significantly increases growth rates and yields — but ONLY if all other factors (light, nutrients, temperature) are already optimized.\n\nCO2 is only worth adding if you have strong lighting (>600 PPFD) and perfect environmental control. It has no benefit in a poorly dialed-in grow.",
      tips: [
        "CO2 only works when lights are on — plants don't photosynthesize in the dark",
        "Sealed grow rooms work best for CO2 supplementation",
        "CO2 levels: 1000–1500 PPM for growth boost, up to 1800 PPM with high light",
        "Temperature can be slightly higher (85–90°F) with elevated CO2",
        "CO2 generators (propane/natural gas) or tanks are the two main options",
      ],
      warning: "CO2 above 2000 PPM is dangerous to humans. Never enter while gassing is active.",
    },
  ],
  glossary: [
    {
      id: "autoflower",
      name: "Autoflower",
      summary: "Flowers based on age, not light cycle",
      icon: "time-outline",
      color: "#ffa726",
      detail: "Autoflowering cannabis plants flower automatically based on age (typically 2–4 weeks after germination) regardless of the light schedule. They descend from Cannabis ruderalis and are ideal for beginners and quick harvests.\n\nPros: Fast (60–90 days seed to harvest), discreet size, no light schedule management, can run 18–20 hours light all cycle.\n\nCons: Cannot be cloned, smaller yields than photos, less training options.",
      tips: [
        "Run 18/6 or 20/4 light schedule throughout the entire grow",
        "Don't top — they can't recover in time. Light LST only",
        "Start in final pot — they don't like transplanting",
        "90% of growers do well with a single pot from seed to harvest",
      ],
    },
    {
      id: "photoperiod",
      name: "Photoperiod",
      summary: "Requires 12/12 light to flower",
      icon: "sunny-outline",
      color: "#4caf50",
      detail: "Photoperiod (or 'photo') plants require a change in light cycle to 12 hours light / 12 hours dark to begin flowering. They stay in vegetative growth as long as you keep them on 18/6 or longer.\n\nPros: More training flexibility, higher yields, clonable, scalable to any size.\n\nCons: Requires timer management, dark period must be uninterrupted, takes longer.",
      tips: [
        "Flip to 12/12 when plant is 50% of desired final height",
        "Plants typically double in size during the stretch (first 2–3 weeks of flower)",
        "Keep the 12 hours of dark completely uninterrupted",
        "Males show sex in the first 1–2 weeks of flower — remove immediately",
      ],
    },
    {
      id: "trichomes",
      name: "Trichomes",
      summary: "Crystal glands containing THC, CBD and terpenes",
      icon: "sparkles-outline",
      color: "#ab47bc",
      detail: "Trichomes are the tiny crystal-like glandular structures covering cannabis buds and leaves. They contain cannabinoids (THC, CBD, CBG) and terpenes. They're the key to harvest timing and quality.\n\nTypes:\n- Capitate-stalked: Largest, most abundant in cannabinoids — the ones you see\n- Capitate-sessile: Smaller, on leaves\n- Bulbous: Tiny, scattered\n\nTrichome color indicates harvest readiness and expected effect.",
      tips: [
        "Clear: Still developing — too early to harvest",
        "Cloudy/milky: Peak THC — uplifting, cerebral effect",
        "Amber: THC converting to CBN — relaxing, sedative effect",
        "Use a 30–100x jeweler's loupe or digital microscope",
        "Target: 70% cloudy + 30% amber for balanced effect",
      ],
    },
    {
      id: "terpenes",
      name: "Terpenes",
      summary: "Aromatic compounds that shape flavor and effect",
      icon: "flower-outline",
      color: "#66bb6a",
      detail: "Terpenes are aromatic organic compounds produced by the cannabis plant (and many other plants). They give each strain its unique smell and flavor. They also interact with cannabinoids to modulate the effects — this is called the 'entourage effect.'\n\nCommon terpenes:\n- Myrcene: Earthy, musky — sedating, most common in cannabis\n- Limonene: Citrus — uplifting, anti-anxiety\n- Caryophyllene: Spicy, pepper — anti-inflammatory\n- Pinene: Pine — alertness, memory retention\n- Linalool: Floral, lavender — calming, anti-anxiety\n- Terpinolene: Fresh, floral — uplifting",
      tips: [
        "Harvest in morning before lights on for peak terpene content",
        "Slow drying at low temps preserves terpenes",
        "Long curing further develops terpene complexity",
        "High heat destroys terpenes — don't vaporize at high temps",
        "Smell is the best real-time indicator of terpene richness",
      ],
    },
    {
      id: "flushing",
      name: "Flushing",
      summary: "Clearing nutrient buildup before harvest",
      icon: "water",
      color: "#42a5f5",
      detail: "Flushing means running large quantities of plain, pH-corrected water through your growing medium to remove residual nutrient salts. The goal is to remove built-up salts before harvest to improve the taste and smoothness of the final product.\n\nThis is a controversial topic — some growers swear by it, others (particularly hydro growers) argue it's unnecessary or even counterproductive. In soil, most agree a 1–2 week flush is beneficial.",
      tips: [
        "Soil: Flush 1–2 weeks before harvest with 3x pot volume of water",
        "Coco: Flush 5–7 days before harvest",
        "DWC/Hydro: Flush with plain water 3–5 days before harvest",
        "Leaves will yellow during flush — this is normal and desired",
        "Final product should taste clean and not harsh",
      ],
    },
    {
      id: "cloning",
      name: "Cloning",
      summary: "Creating genetic copies from cuttings",
      icon: "copy-outline",
      color: "#4caf50",
      detail: "Cloning is the process of taking a cutting from a mother plant and rooting it to create an exact genetic copy. This preserves your best phenotypes indefinitely and skips the seedling/germination stage.\n\nBasic process: Cut 4–6 inch branch, remove lower leaves, dip in rooting hormone, place in rooting medium (rockwool, rapid rooter, water). Keep in high humidity (70–80%) and indirect light until roots develop (7–21 days).",
      tips: [
        "Take clones from mother plants in veg — never from flowering plants",
        "Cut at 45° angle with very sharp, clean blade",
        "Immediately place stem in water or rooting hormone",
        "High humidity dome is essential — clones lose moisture through leaves",
        "Bottom heat (72–77°F) speeds up rooting",
      ],
    },
  ],
};

function DetailModal({ item, onClose }: { item: LearnItem; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={[dStyles.container, { backgroundColor: C.background }]}>
        <View style={[dStyles.header, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={onClose} style={dStyles.closeBtn}>
            <Ionicons name="close" size={24} color={C.textSecondary} />
          </Pressable>
          <View style={dStyles.headerContent}>
            <View style={[dStyles.iconWrap, { backgroundColor: item.color + "22" }]}>
              <Ionicons name={item.icon as any} size={28} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={dStyles.name}>{item.name}</Text>
              <Text style={dStyles.summary}>{item.summary}</Text>
            </View>
          </View>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[dStyles.content, { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={dStyles.detail}>{item.detail}</Text>

          {item.tips && item.tips.length > 0 && (
            <View style={dStyles.tipsBox}>
              <View style={dStyles.tipsHeader}>
                <Ionicons name="checkmark-circle" size={16} color={C.tint} />
                <Text style={dStyles.tipsTitle}>Key Tips</Text>
              </View>
              {item.tips.map((tip, i) => (
                <View key={i} style={dStyles.tipRow}>
                  <View style={dStyles.tipDot} />
                  <Text style={dStyles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {item.warning && (
            <View style={dStyles.warningBox}>
              <Ionicons name="warning" size={18} color={C.warning} />
              <Text style={dStyles.warningText}>{item.warning}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<Category>("problems");
  const [selected, setSelected] = useState<LearnItem | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const items = CONTENT[category];

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
          <Text style={styles.headerTitle}>Encyclopedia</Text>
          <Text style={styles.headerSub}>Everything a grower needs to know</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.key}
                style={[styles.catChip, category === cat.key && styles.catChipActive]}
                onPress={() => setCategory(cat.key)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={15}
                  color={category === cat.key ? "#fff" : C.textMuted}
                />
                <Text style={[styles.catLabel, category === cat.key && styles.catLabelActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </LinearGradient>

        <View style={styles.content}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
              onPress={() => setSelected(item)}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.color + "18" }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardSummary}>{item.summary}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 30, color: C.text },
  headerSub: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textSecondary, marginTop: 4, marginBottom: 16 },
  catScroll: { marginHorizontal: -4 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.backgroundTertiary,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginHorizontal: 4,
  },
  catChipActive: { backgroundColor: C.tint, borderColor: C.tint },
  catLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: C.textMuted },
  catLabelActive: { color: "#fff" },
  content: { padding: 16, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  iconWrap: { width: 48, height: 48, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: "Nunito_700Bold", fontSize: 15, color: C.text },
  cardSummary: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 2 },
});

const dStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  closeBtn: { alignSelf: "flex-end", marginBottom: 12 },
  headerContent: { flexDirection: "row", gap: 14, alignItems: "center" },
  iconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: "Nunito_800ExtraBold", fontSize: 20, color: C.text },
  summary: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 2 },
  content: { padding: 16, gap: 16 },
  detail: {
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    color: C.textSecondary,
    lineHeight: 24,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  tipsBox: {
    backgroundColor: C.backgroundTertiary,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  tipsTitle: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.tint },
  tipRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.tint, marginTop: 8, flexShrink: 0 },
  tipText: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.text, flex: 1, lineHeight: 20 },
  warningBox: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: C.warning + "18",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.warning + "44",
  },
  warningText: { fontFamily: "Nunito_600SemiBold", fontSize: 14, color: C.warning, flex: 1, lineHeight: 20 },
});
