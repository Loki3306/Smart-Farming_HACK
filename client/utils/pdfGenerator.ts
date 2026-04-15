/**
 * PDF Generator for Shopping List Reports
 * Generates downloadable PDF reports for fertilizer recommendations
 */

interface ProductRecommendation {
  product_name: string;
  manufacturer: string;
  npk_ratio: string;
  quantity: number;
  quantity_text: string;
  price_per_unit: number;
  total_cost: number;
  target_nutrient: string;
}

interface SoilData {
  N: number;
  P: number;
  K: number;
  pH?: number;
}

interface NutrientGaps {
  N: number;
  P: number;
  K: number;
}

interface ReportData {
  farmerName?: string;
  farmSize: number;
  cropType: string;
  soilData: SoilData;
  nutrientGaps: NutrientGaps;
  products: ProductRecommendation[];
  totalCost: number;
  yieldImprovement: number;
  generatedAt: Date;
}

/**
 * Generate and download PDF shopping list
 */
export async function generateShoppingListPDF(
  report: ReportData,
): Promise<void> {
  try {
    // For now, generate a simple text-based version
    // TODO: Replace with jsPDF for proper PDF generation

    const content = generatePDFContent(report);

    // Create blob and download
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `soil-report-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("[PDF] Report downloaded successfully");
  } catch (error) {
    console.error("[PDF] Error generating report:", error);
    throw error;
  }
}

/**
 * Generate formatted report content
 */
function generatePDFContent(report: ReportData): string {
  const {
    farmerName,
    farmSize,
    cropType,
    soilData,
    nutrientGaps,
    products,
    totalCost,
    yieldImprovement,
    generatedAt,
  } = report;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getNutrientStatus = (gap: number) => {
    if (gap === 0) return "[OPTIMAL]";
    if (gap < 20) return "[LOW]";
    return "[VERY LOW]";
  };

  return `
═══════════════════════════════════════════════════════════════
                  SMART FARMING SOIL REPORT
═══════════════════════════════════════════════════════════════

${farmerName ? `Farmer: ${farmerName}` : "Farm Report"}
Farm Size: ${farmSize} hectares
Crop: ${cropType.toUpperCase()}
Date: ${formatDate(generatedAt)}

───────────────────────────────────────────────────────────────
CURRENT SOIL STATUS (Sensor Data)
───────────────────────────────────────────────────────────────

• Nitrogen (N):     ${soilData.N} kg/ha  ${getNutrientStatus(nutrientGaps.N)}
• Phosphorus (P):   ${soilData.P} kg/ha  ${getNutrientStatus(nutrientGaps.P)}
• Potassium (K):    ${soilData.K} kg/ha  ${getNutrientStatus(nutrientGaps.K)}
${soilData.pH ? `• pH Level:         ${soilData.pH.toFixed(1)}       ${soilData.pH >= 6.0 && soilData.pH <= 7.5 ? "[OPTIMAL]" : "[NEEDS ADJUSTMENT]"}` : ""}

───────────────────────────────────────────────────────────────
RECOMMENDED ACTIONS
───────────────────────────────────────────────────────────────

${nutrientGaps.N > 0 ? `1. Add Nitrogen:   ${nutrientGaps.N} kg/ha (Total: ${(nutrientGaps.N * farmSize).toFixed(1)} kg for ${farmSize} ha)` : ""}
${nutrientGaps.P > 0 ? `2. Add Phosphorus: ${nutrientGaps.P} kg/ha (Total: ${(nutrientGaps.P * farmSize).toFixed(1)} kg for ${farmSize} ha)` : ""}
${nutrientGaps.K > 0 ? `3. Add Potassium:  ${nutrientGaps.K} kg/ha (Total: ${(nutrientGaps.K * farmSize).toFixed(1)} kg for ${farmSize} ha)` : ""}

───────────────────────────────────────────────────────────────
SHOPPING LIST
───────────────────────────────────────────────────────────────

${products
  .map(
    (product, index) => `
${index + 1}. □ ${product.product_name}
   Manufacturer: ${product.manufacturer}
   NPK Ratio: ${product.npk_ratio}
   Quantity: ${product.quantity_text}
   Price: ₹${product.price_per_unit.toFixed(2)} per ${product.quantity_text.includes("bag") ? "bag" : "bottle"}
   Total: ₹${product.total_cost.toFixed(2)}
   For: ${product.target_nutrient}
`,
  )
  .join("\n")}

───────────────────────────────────────────────────────────────
TOTAL COST: ₹${totalCost.toFixed(2)}
Expected Yield Improvement: +${yieldImprovement}%
Estimated ROI: ₹${(totalCost * (yieldImprovement / 10)).toFixed(2)} - ₹${(totalCost * (yieldImprovement / 5)).toFixed(2)}
───────────────────────────────────────────────────────────────

WHERE TO BUY
───────────────────────────────────────────────────────────────

Nearest Dealers:
   • Check our marketplace for verified dealers
   • Use "Find Dealers" button in the app
   • Contact local Kisan Seva Kendra

───────────────────────────────────────────────────────────────
IMPORTANT NOTES
───────────────────────────────────────────────────────────────

• Apply fertilizers as per recommended schedule
• Conduct soil test every season for best results
• Prices are subject to change - verify before purchase
• Store fertilizers in cool, dry place
• Follow safety guidelines during application

───────────────────────────────────────────────────────────────
Generated by Smart Farming AI - Empowering Farmers
Visit our marketplace for online purchase options
───────────────────────────────────────────────────────────────
`.trim();
}

/**
 * Generate PDF using jsPDF (for future implementation)
 * Uncomment when jsPDF is installed
 */
/*
import { jsPDF } from 'jspdf';

export async function generateShoppingListPDF(report: ReportData): Promise<void> {
  const pdf = new jsPDF();
  
  // Header
  pdf.setFontSize(18);
  pdf.text('Smart Farming Soil Report', 20, 20);
  
  // Farm Details
  pdf.setFontSize(12);
  pdf.text(\`Crop: \${report.cropType}\`, 20, 35);
  pdf.text(\`Farm Size: \${report.farmSize} hectares\`, 20, 42);
  pdf.text(\`Date: \${report.generatedAt.toLocaleDateString()}\`, 20, 49);
  
  // Soil Status
  pdf.setFontSize(14);
  pdf.text('Current Soil Status', 20, 65);
  pdf.setFontSize(11);
  pdf.text(\`Nitrogen: \${report.soilData.N} kg/ha\`, 30, 75);
  pdf.text(\`Phosphorus: \${report.soilData.P} kg/ha\`, 30, 82);
  pdf.text(\`Potassium: \${report.soilData.K} kg/ha\`, 30, 89);
  
  // Shopping List
  pdf.setFontSize(14);
  pdf.text('Shopping List', 20, 110);
  
  let yPos = 120;
  report.products.forEach((product, i) => {
    pdf.setFontSize(11);
    pdf.text(\`\${i + 1}. \${product.product_name}\`, 30, yPos);
    pdf.text(\`   \${product.quantity_text} @ ₹\${product.price_per_unit}\`, 35, yPos + 7);
    pdf.text(\`   Total: ₹\${product.total_cost}\`, 35, yPos + 14);
    yPos += 25;
  });
  
  // Total
  pdf.setFontSize(14);
  pdf.text(\`TOTAL COST: ₹\${report.totalCost.toFixed(2)}\`, 20, yPos + 10);
  
  // Expected Yield
  pdf.setFontSize(12);
  pdf.text(\`Expected Yield Improvement: +\${report.yieldImprovement}%\`, 20, yPos + 25);
  
  // Save
  pdf.save(\`soil-report-\${Date.now()}.pdf\`);
}
*/
