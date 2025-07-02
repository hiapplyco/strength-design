import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings, 
  Target, 
  FileUp, 
  Heart, 
  Activity,
  Watch,
  Smartphone,
  Loader2,
  Check,
  X,
  Info
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface NutritionSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
  saturated_fat: number;
  water_ml: number;
}

interface Integration {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  description: string;
  comingSoon?: boolean;
}

export function NutritionSettingsDialog({ open, onOpenChange }: NutritionSettingsDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [macroTargets, setMacroTargets] = useState<MacroTargets>({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    fiber: 25,
    sugar: 50,
    sodium: 2300,
    cholesterol: 300,
    saturated_fat: 20,
    water_ml: 2000
  });

  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'apple_health',
      name: 'Apple Health',
      icon: <Heart className="h-5 w-5" />,
      connected: false,
      description: 'Sync workouts, nutrition, and health metrics'
    },
    {
      id: 'google_fit',
      name: 'Google Fit',
      icon: <Activity className="h-5 w-5" />,
      connected: false,
      description: 'Import activity and fitness data'
    },
    {
      id: 'oura',
      name: 'Oura Ring',
      icon: <Watch className="h-5 w-5" />,
      connected: false,
      description: 'Track sleep, HRV, and recovery metrics'
    },
    {
      id: 'fitbit',
      name: 'Fitbit',
      icon: <Activity className="h-5 w-5" />,
      connected: false,
      description: 'Sync activity, heart rate, and sleep data'
    },
    {
      id: 'strava',
      name: 'Strava',
      icon: <Activity className="h-5 w-5" />,
      connected: false,
      description: 'Import cycling and running activities'
    },
    {
      id: 'myfitnesspal',
      name: 'MyFitnessPal',
      icon: <Smartphone className="h-5 w-5" />,
      connected: false,
      description: 'Import food logs and recipes',
      comingSoon: true
    }
  ]);

  // Load existing settings on mount
  useEffect(() => {
    if (open && user) {
      loadSettings();
    }
  }, [open, user]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('nutrition_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data && !error) {
        setMacroTargets({
          calories: data.target_calories || 2000,
          protein: data.target_protein || 150,
          carbs: data.target_carbs || 250,
          fat: data.target_fat || 65,
          fiber: data.target_fiber || 25,
          sugar: data.target_sugar || 50,
          sodium: data.target_sodium || 2300,
          cholesterol: data.target_cholesterol || 300,
          saturated_fat: data.target_saturated_fat || 20,
          water_ml: data.target_water_ml || 2000
        });

        if (data.integrations) {
          setIntegrations(prev => prev.map(integration => ({
            ...integration,
            connected: data.integrations[integration.id]?.connected || false
          })));
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const integrationsData = integrations.reduce((acc, integration) => ({
        ...acc,
        [integration.id]: { connected: integration.connected }
      }), {});

      const { error } = await supabase
        .from('nutrition_settings')
        .upsert({
          user_id: user?.id,
          target_calories: macroTargets.calories,
          target_protein: macroTargets.protein,
          target_carbs: macroTargets.carbs,
          target_fat: macroTargets.fat,
          target_fiber: macroTargets.fiber,
          target_sugar: macroTargets.sugar,
          target_sodium: macroTargets.sodium,
          target_cholesterol: macroTargets.cholesterol,
          target_saturated_fat: macroTargets.saturated_fat,
          target_water_ml: macroTargets.water_ml,
          integrations: integrationsData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your nutrition settings have been updated successfully.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error saving settings",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileName = `${user.id}/nutrition-plans/${Date.now()}-${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('nutrition-uploads')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Call edge function to process with Gemini
      const { data, error } = await supabase.functions.invoke('parse-nutrition-plan', {
        body: {
          fileName: fileName,
          fileType: selectedFile.type
        }
      });

      if (error) throw error;

      // Update macro targets from parsed data
      if (data?.macros) {
        setMacroTargets(prev => ({
          ...prev,
          ...data.macros
        }));
      }

      toast({
        title: "File processed successfully",
        description: "Your nutrition plan has been analyzed and targets updated.",
      });

      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error processing file",
        description: "Please try again with a different file.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleIntegrationToggle = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    
    if (integration?.comingSoon) {
      toast({
        title: "Coming Soon",
        description: `${integration.name} integration will be available soon!`,
      });
      return;
    }

    setIntegrations(prev => prev.map(i => 
      i.id === integrationId ? { ...i, connected: !i.connected } : i
    ));

    // Here you would implement actual OAuth flows for each service
    if (!integrations.find(i => i.id === integrationId)?.connected) {
      toast({
        title: "Integration setup",
        description: "OAuth connection flow would start here in production.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Nutrition Settings
          </DialogTitle>
          <DialogDescription>
            Configure your daily macro targets, upload meal plans, and connect health apps.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="macros" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="macros">
              <Target className="h-4 w-4 mr-2" />
              Macro Targets
            </TabsTrigger>
            <TabsTrigger value="upload">
              <FileUp className="h-4 w-4 mr-2" />
              Upload Plan
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Heart className="h-4 w-4 mr-2" />
              Integrations
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="macros" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Targets</CardTitle>
                  <CardDescription>
                    Set your daily nutritional goals based on your fitness objectives.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="calories">Calories</Label>
                      <Input
                        id="calories"
                        type="number"
                        value={macroTargets.calories}
                        onChange={(e) => setMacroTargets(prev => ({ 
                          ...prev, 
                          calories: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="protein">Protein (g)</Label>
                      <Input
                        id="protein"
                        type="number"
                        value={macroTargets.protein}
                        onChange={(e) => setMacroTargets(prev => ({ 
                          ...prev, 
                          protein: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carbs">Carbohydrates (g)</Label>
                      <Input
                        id="carbs"
                        type="number"
                        value={macroTargets.carbs}
                        onChange={(e) => setMacroTargets(prev => ({ 
                          ...prev, 
                          carbs: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fat">Fat (g)</Label>
                      <Input
                        id="fat"
                        type="number"
                        value={macroTargets.fat}
                        onChange={(e) => setMacroTargets(prev => ({ 
                          ...prev, 
                          fat: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fiber">Fiber (g)</Label>
                      <Input
                        id="fiber"
                        type="number"
                        value={macroTargets.fiber}
                        onChange={(e) => setMacroTargets(prev => ({ 
                          ...prev, 
                          fiber: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sugar">Sugar (g)</Label>
                      <Input
                        id="sugar"
                        type="number"
                        value={macroTargets.sugar}
                        onChange={(e) => setMacroTargets(prev => ({ 
                          ...prev, 
                          sugar: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sodium">Sodium (mg)</Label>
                      <Input
                        id="sodium"
                        type="number"
                        value={macroTargets.sodium}
                        onChange={(e) => setMacroTargets(prev => ({ 
                          ...prev, 
                          sodium: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="water">Water (ml)</Label>
                      <Input
                        id="water"
                        type="number"
                        value={macroTargets.water_ml}
                        onChange={(e) => setMacroTargets(prev => ({ 
                          ...prev, 
                          water_ml: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Nutrition Plan</CardTitle>
                  <CardDescription>
                    Upload a meal plan document (PDF, Word, images) to automatically extract and set your macro targets.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      id="nutrition-plan-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <label 
                      htmlFor="nutrition-plan-upload"
                      className="cursor-pointer"
                    >
                      <FileUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, Word docs, images, or text files
                      </p>
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm truncate">{selectedFile.name}</span>
                      <Button
                        size="sm"
                        onClick={handleFileUpload}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Process File'
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Our AI will analyze your uploaded meal plan and automatically extract macro targets, 
                      meal timing, and nutritional recommendations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Health App Integrations</CardTitle>
                  <CardDescription>
                    Connect your favorite health and fitness apps to sync data automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {integrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {integration.icon}
                        </div>
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {integration.name}
                            {integration.comingSoon && (
                              <span className="text-xs bg-muted px-2 py-1 rounded">
                                Coming Soon
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {integration.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={integration.connected}
                        onCheckedChange={() => handleIntegrationToggle(integration.id)}
                        disabled={integration.comingSoon}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}