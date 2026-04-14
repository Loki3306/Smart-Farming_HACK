import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Droplets,
  Thermometer,
  Zap,
  Leaf,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";

interface SoilAnalyticsProps {
  moisture: number;
  temperature: number;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ec: number;
  humidity?: number;
}

export const SoilAnalyticsCard: React.FC<SoilAnalyticsProps> = ({
  moisture,
  temperature,
  ph,
  nitrogen,
  phosphorus,
  potassium,
  ec,
  humidity,
}) => {
  // NPK Data for bar chart
  const npkData = [
    { name: "Nitrogen (N)", value: nitrogen, ideal: 150, color: "#16a34a" },
    {
      name: "Phosphorus (P)",
      value: phosphorus,
      ideal: 150,
      color: "#eab308",
    },
    { name: "Potassium (K)", value: potassium, ideal: 150, color: "#3b82f6" },
  ];

  // Soil health radar data
  const radarData = [
    {
      metric: "Moisture",
      value: Math.min((moisture / 100) * 100, 100),
      fullMark: 100,
    },
    {
      metric: "Temperature",
      value: Math.min((temperature / 35) * 100, 100),
      fullMark: 100,
    },
    {
      metric: "pH Balance",
      value: ph >= 5.8 && ph <= 7.5 ? 100 : Math.max(0, 50 - Math.abs(ph - 6.5) * 20),
      fullMark: 100,
    },
    {
      metric: "Nitrogen",
      value: Math.min((nitrogen / 150) * 100, 100),
      fullMark: 100,
    },
    {
      metric: "Phosphorus",
      value: Math.min((phosphorus / 150) * 100, 100),
      fullMark: 100,
    },
    {
      metric: "Potassium",
      value: Math.min((potassium / 150) * 100, 100),
      fullMark: 100,
    },
  ];

  // Soil health score
  const healthScore = useMemo(() => {
    let score = 0;
    let count = 0;

    // Moisture: optimal 40-60%
    if (moisture >= 40 && moisture <= 60) score += 100;
    else if (moisture >= 30 && moisture <= 70) score += 70;
    else score += 30;
    count++;

    // Temperature: optimal 20-30°C
    if (temperature >= 20 && temperature <= 30) score += 100;
    else if (temperature >= 15 && temperature <= 35) score += 70;
    else score += 30;
    count++;

    // pH: optimal 6.0-7.5
    if (ph >= 6.0 && ph <= 7.5) score += 100;
    else if (ph >= 5.5 && ph <= 8.0) score += 70;
    else score += 30;
    count++;

    // NPK balance
    const npkAverage = (nitrogen + phosphorus + potassium) / 3;
    if (npkAverage >= 120) score += 100;
    else if (npkAverage >= 80) score += 70;
    else score += 40;
    count++;

    return Math.round(score / count);
  }, [moisture, temperature, ph, nitrogen, phosphorus, potassium]);

  // Get health status
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { status: "Excellent", color: "bg-primary/20 text-primary border-primary/30" };
    if (score >= 60) return { status: "Good", color: "bg-blue-500/20 text-blue-500 border-blue-500/30" };
    if (score >= 40) return { status: "Fair", color: "bg-amber-500/20 text-amber-500 border-amber-500/30" };
    return { status: "Poor", color: "bg-destructive/20 text-destructive border-destructive/30" };
  };

  const healthStatus = getHealthStatus(healthScore);

  // Detect issues
  const issues = useMemo(() => {
    const problems: Array<{ icon: React.ReactNode; message: string; severity: "warning" | "error" }> = [];

    if ((ph as number) < 5.8 || (ph as number) > 7.5) {
      problems.push({
        icon: <AlertCircle className="w-4 h-4" />,
        message: ph < 5.8 ? "Overly acidic soil - limit nutrient availability" : "Overly alkaline soil - may lock phosphorus",
        severity: "warning",
      });
    }

    if (nitrogen < 80) {
      problems.push({
        icon: <AlertCircle className="w-4 h-4" />,
        message: "Nitrogen levels below optimal - consider fertilization",
        severity: "warning",
      });
    }

    if (moisture < 30) {
      problems.push({
        icon: <AlertCircle className="w-4 h-4" />,
        message: "Soil too dry - increase irrigation frequency",
        severity: "error",
      });
    }

    if (ec > 2.0) {
      problems.push({
        icon: <AlertCircle className="w-4 h-4" />,
        message: "High soil salinity - apply proper leaching techniques",
        severity: "warning",
      });
    }

    return problems;
  }, [ph, nitrogen, moisture, ec]);

  return (
    <div className="space-y-6">
      {/* Health Score Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="p-6 bg-card border-border">
          <div className="flex items-start justify-between">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Soil Health Index</h3>
                  <p className="text-sm text-muted-foreground">Real-time analysis of your farm conditions</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">Overall Health</span>
                    <span className="text-xl font-bold text-primary">{healthScore}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(Math.max(healthScore, 0), 100)}%` } as React.CSSProperties}
                    />
                  </div>
                </div>

                <Badge className={`${healthStatus.color} border`} variant="outline">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {healthStatus.status}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Critical Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Moisture */}
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between mb-3">
              <Droplets className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Moisture</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{moisture}%</p>
            <p className="text-xs flex items-center gap-1 mt-2">
              {moisture >= 40 && moisture <= 60 ? (
                <><CheckCircle className="w-3 h-3 text-primary" /> <span className="text-muted-foreground">Optimal</span></>
              ) : (
                <><AlertCircle className="w-3 h-3 text-destructive" /> <span className="text-destructive">Adjust needed</span></>
              )}
            </p>
          </Card>

          {/* Temperature */}
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between mb-3">
              <Thermometer className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Temperature</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{temperature}°C</p>
            <p className="text-xs flex items-center gap-1 mt-2">
              {temperature >= 20 && temperature <= 30 ? (
                <><CheckCircle className="w-3 h-3 text-primary" /> <span className="text-muted-foreground">Optimal</span></>
              ) : (
                <><AlertCircle className="w-3 h-3 text-destructive" /> <span className="text-destructive">Adjust needed</span></>
              )}
            </p>
          </Card>

          {/* pH */}
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between mb-3">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">pH Balance</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{ph.toFixed(1)}</p>
            <p className="text-xs flex items-center gap-1 mt-2">
              {ph >= 6.0 && ph <= 7.5 ? (
                <><CheckCircle className="w-3 h-3 text-primary" /> <span className="text-muted-foreground">Optimal</span></>
              ) : (
                <><AlertCircle className="w-3 h-3 text-destructive" /> <span className="text-destructive">Adjust needed</span></>
              )}
            </p>
          </Card>

          {/* EC (Salinity) */}
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">EC</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{ec.toFixed(2)}</p>
            <p className="text-xs flex items-center gap-1 mt-2">
              {ec <= 1.5 ? (
                <><CheckCircle className="w-3 h-3 text-primary" /> <span className="text-muted-foreground">Good</span></>
              ) : (
                <><AlertCircle className="w-3 h-3 text-destructive" /> <span className="text-destructive">High</span></>
              )}
            </p>
          </Card>
        </div>
      </motion.div>

      {/* NPK Bar & Radar Grid to put them side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* NPK Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="p-6 h-full flex flex-col justify-between">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-primary" />
              Nutrient Analysis (NPK)
            </h3>
            <div className="flex-1 w-full min-h-[250px]">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={npkData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))">
                    {npkData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center pb-2">All values in ppm (parts per million)</p>
          </Card>
        </motion.div>

        {/* Soil Health Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Comprehensive Soil Profile
            </h3>
            <div className="flex-1 w-full min-h-[250px]">
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
                  <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
                  <Radar
                    name="Health Score"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-transparent mt-4 pb-2">Spacing</p>
          </Card>
        </motion.div>
      </div>

      {/* Issues & Alerts */}
      {issues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Observations & Recommendations
            </h3>
            <div className="space-y-3">
              {issues.map((issue, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg flex items-start gap-3 border ${
                    issue.severity === "error" ? "bg-destructive/10 border-destructive/20" : "bg-muted border-border"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 mt-0.5 ${issue.severity === "error" ? "text-destructive" : "text-primary"}`}
                  >
                    {issue.icon}
                  </div>
                  <p className={`text-sm ${issue.severity === "error" ? "text-destructive" : "text-foreground"}`}>
                    {issue.message}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
