import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Sprout, ClipboardList, Droplets, ArrowRight, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const AgronomyPlanner = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<any>(null);

    const [formData, setFormData] = useState({
        crop_type: "wheat",
        seeding_date: new Date().toISOString().split('T')[0],
        soil_type: "loamy",
        target_yield: "4.0",
        farm_area_acres: "2.5"
    });

    const generatePlan = async () => {
        setLoading(true);
        try {
            // Use the backend API URL directly
            const url = 'http://localhost:8000/iot/planner/generate';

            console.log('[AgronomyPlanner] Generating plan with data:', formData);
            console.log('[AgronomyPlanner] API URL:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    target_yield: parseFloat(formData.target_yield),
                    farm_area_acres: parseFloat(formData.farm_area_acres)
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[AgronomyPlanner] API Error:', response.status, errorText);
                throw new Error(`Failed to generate plan: ${response.status}`);
            }

            const data = await response.json();
            console.log('[AgronomyPlanner] Plan generated successfully:', data);
            setPlan(data.plan);
            toast({
                title: "Plan Generated",
                description: `Season plan for ${formData.crop_type} created successfully.`
            });
        } catch (error) {
            console.error('[AgronomyPlanner] Error:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Could not generate agronomic plan.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="rounded-2xl shadow-lg border-border/50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-900/10 border-b border-border/40">
                <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                    <ClipboardList className="w-5 h-5" />
                    Agronomic Season Planner
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* INPUT SECTION */}
                    <div className="space-y-6 lg:col-span-1 border-r border-border/40 pr-0 lg:pr-6 relative z-50">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Sprout className="w-4 h-4 text-primary" />
                                Farm Profile
                            </h3>

                            <div className="space-y-2">
                                <Label>Crop Type</Label>
                                <Select
                                    value={formData.crop_type}
                                    onValueChange={(v) => setFormData({ ...formData, crop_type: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="z-[100]">
                                        <SelectItem value="wheat">Wheat</SelectItem>
                                        <SelectItem value="corn">Corn (Maize)</SelectItem>
                                        <SelectItem value="rice">Rice (Paddy)</SelectItem>
                                        <SelectItem value="tomato">Tomato</SelectItem>
                                        <SelectItem value="potato">Potato</SelectItem>
                                        <SelectItem value="cotton">Cotton</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Seeding Date</Label>
                                <Input
                                    type="date"
                                    value={formData.seeding_date}
                                    onChange={(e) => setFormData({ ...formData, seeding_date: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Soil Type</Label>
                                <Select
                                    value={formData.soil_type}
                                    onValueChange={(v) => setFormData({ ...formData, soil_type: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="z-[100]">
                                        <SelectItem value="loamy">Loamy (Balanced)</SelectItem>
                                        <SelectItem value="sandy">Sandy (Fast Draining)</SelectItem>
                                        <SelectItem value="clay">Clay (High Retention)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Yield (Tons/Ha)</Label>
                                    <Input
                                        type="number" step="0.1"
                                        value={formData.target_yield}
                                        onChange={(e) => setFormData({ ...formData, target_yield: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Area (Acres)</Label>
                                    <Input
                                        type="number" step="0.1"
                                        value={formData.farm_area_acres}
                                        onChange={(e) => setFormData({ ...formData, farm_area_acres: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={generatePlan}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={loading}
                            >
                                {loading ? "Generating Plan..." : "Generate Season Plan"}
                            </Button>
                        </div>
                    </div>

                    {/* OUTPUT SECTION */}
                    <div className="lg:col-span-2 space-y-6 relative z-10">
                        {!plan ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-10 border-2 border-dashed rounded-xl bg-muted/20">
                                <Calendar className="w-12 h-12 mb-4 opacity-50" />
                                <p>Configure your farm profile to generate a master plan</p>
                            </div>
                        ) : (
                            <Tabs defaultValue="timeline" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6">
                                    <TabsTrigger value="timeline">Timeline & Phases</TabsTrigger>
                                    <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
                                </TabsList>

                                <TabsContent value="timeline" className="space-y-6">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-none shadow-sm">
                                            <CardContent className="p-4 flex flex-col items-center text-center">
                                                <div className="text-sm text-muted-foreground mb-1">Season Duration</div>
                                                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{plan.total_days} Days</div>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-purple-50/50 dark:bg-purple-900/10 border-none shadow-sm">
                                            <CardContent className="p-4 flex flex-col items-center text-center">
                                                <div className="text-sm text-muted-foreground mb-1">Nutrient Load</div>
                                                <div className="text-base font-semibold text-purple-700 dark:text-purple-400">
                                                    N: {plan.total_nutrients_kg.N}kg • P: {plan.total_nutrients_kg.P}kg
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-none shadow-sm">
                                            <CardContent className="p-4 flex flex-col items-center text-center">
                                                <div className="text-sm text-muted-foreground mb-1">Harvest Est.</div>
                                                <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                                                    {(parseFloat(formData.target_yield) * (parseFloat(formData.farm_area_acres) / 2.47)).toFixed(1)} Tons
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Phases Gantt */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Growth Phases</h4>
                                        <div className="space-y-3">
                                            {plan.phases.map((phase: any, idx: number) => (
                                                <div key={idx} className="relative">
                                                    <div className="flex items-center justify-between text-sm mb-1 px-1">
                                                        <span className="font-medium">{phase.phase_name}</span>
                                                        <span className="text-muted-foreground text-xs">{phase.days} days</span>
                                                    </div>
                                                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${['bg-emerald-400', 'bg-green-500', 'bg-lime-500', 'bg-amber-500'][idx % 4]}`}
                                                            style={{ width: '100%' }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
                                                        <span>{phase.start_date}</span>
                                                        <span>{phase.end_date}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Chat / Advisory Panel */}
                                    {plan.advisories && plan.advisories.length > 0 && (
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
                                            <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 flex items-center gap-2 mb-2">
                                                <Bot className="w-4 h-4" />
                                                Agronomist Notes
                                            </h4>
                                            <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                                                {plan.advisories.map((note: string, i: number) => (
                                                    <li key={i}>{note}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="schedule">
                                    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                                        <div className="space-y-4">
                                            {plan.weekly_plan.map((week: any) => (
                                                <div key={week.week} className="flex gap-4 p-4 rounded-lg bg-card border hover:border-primary/50 transition-colors">
                                                    <div className="flex-none w-16 text-center border-r pr-4 flex flex-col justify-center">
                                                        <span className="text-xs text-muted-foreground">WEEK</span>
                                                        <span className="text-2xl font-bold">{week.week}</span>
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold text-primary">{week.phase}</span>
                                                            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                                                <Droplets className="w-3 h-3" />
                                                                {week.water_mm}mm
                                                            </div>
                                                        </div>
                                                        {week.fertilizer && (
                                                            <div className="text-sm bg-muted/50 p-2 rounded border border-border/50">
                                                                <span className="font-medium mr-2">💊 Feed:</span>
                                                                {week.fertilizer}
                                                            </div>
                                                        )}
                                                        <div className="text-sm text-muted-foreground flex items-start gap-2">
                                                            <ArrowRight className="w-4 h-4 mt-0.5 flex-none" />
                                                            {week.task}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
