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
import { userQueries } from '@/lib/firebase/db';
import { storage, functions } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
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
      description: 'Track sleep, recovery, and readiness',
      comingSoon: true
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

  useEffect(() => {
    if (!open || !user) return;

    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const profile = await userQueries.getProfile(user.uid);
        
        if (profile?.nutritionSettings) {
          const settings = profile.nutritionSettings;
          setMacroTargets({
            calories: settings.targetCalories || 2000,
            protein: settings.targetProtein || 150,
            carbs: settings.targetCarbs || 250,
            fat: settings.targetFat || 65,
            fiber: settings.targetFiber || 25,
            sugar: settings.targetSugar || 50,
            sodium: settings.targetSodium || 2300,
            cholesterol: settings.targetCholesterol || 300,
            saturated_fat: settings.targetSaturatedFat || 20,
            water_ml: settings.targetWaterMl || 2000
          });

          if (settings.integrations) {
            setIntegrations(prev => prev.map(integration => ({
              ...integration,
              connected: settings.integrations?.[integration.id]?.connected || false
            })));
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [open, user]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const integrationsData = integrations.reduce((acc, integration) => ({
        ...acc,
        [integration.id]: { connected: integration.connected }
      }), {});

      await userQueries.updateProfile(user.uid, {
        nutritionSettings: {
          targetCalories: macroTargets.calories,
          targetProtein: macroTargets.protein,
          targetCarbs: macroTargets.carbs,
          targetFat: macroTargets.fat,
          targetFiber: macroTargets.fiber,
          targetSugar: macroTargets.sugar,
          targetSodium: macroTargets.sodium,
          targetCholesterol: macroTargets.cholesterol,
          targetSaturatedFat: macroTargets.saturated_fat,
          targetWaterMl: macroTargets.water_ml,
          integrations: integrationsData
        }
      });

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
      // Upload file to Firebase Storage
      const fileName = `nutrition-uploads/${user.uid}/${Date.now()}-${selectedFile.name}`;
      const storageRef = ref(storage, fileName);
      const uploadResult = await uploadBytes(storageRef, selectedFile);
      const fileUrl = await getDownloadURL(uploadResult.ref);

      // Call Firebase Function to process with Gemini
      const parseNutritionPlan = httpsCallable(functions, 'parseNutritionPlan');
      const result = await parseNutritionPlan({
        fileName: fileName,
        fileUrl: fileUrl,
        fileType: selectedFile.type
      });

      const data = result.data as any;

      // Update macro targets from parsed data
      if (data?.macros) {
        setMacroTargets(prev => ({
          ...prev,
          ...data.macros
        }));
      }

      toast({
        title: "Plan uploaded successfully",
        description: "Your nutrition plan has been analyzed and targets updated.",
      });
      
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Could not process your nutrition plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMacroChange = (macro: keyof MacroTargets, value: string) => {
    const numValue = parseInt(value) || 0;
    setMacroTargets(prev => ({
      ...prev,
      [macro]: numValue
    }));
  };

  const toggleIntegration = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, connected: !integration.connected }
        : integration
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Nutrition Settings
          </DialogTitle>
          <DialogDescription>
            Customize your nutrition targets and connect health tracking apps
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="targets" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="targets">Macro Targets</TabsTrigger>
              <TabsTrigger value="upload">Upload Plan</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] mt-4">
              <TabsContent value="targets" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories">Daily Calories</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={macroTargets.calories}
                      onChange={(e) => handleMacroChange('calories', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      value={macroTargets.protein}
                      onChange={(e) => handleMacroChange('protein', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carbs">Carbohydrates (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      value={macroTargets.carbs}
                      onChange={(e) => handleMacroChange('carbs', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fat">Fat (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      value={macroTargets.fat}
                      onChange={(e) => handleMacroChange('fat', e.target.value)}
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
                      onChange={(e) => handleMacroChange('fiber', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sugar">Sugar (g)</Label>
                    <Input
                      id="sugar"
                      type="number"
                      value={macroTargets.sugar}
                      onChange={(e) => handleMacroChange('sugar', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sodium">Sodium (mg)</Label>
                    <Input
                      id="sodium"
                      type="number"
                      value={macroTargets.sodium}
                      onChange={(e) => handleMacroChange('sodium', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="water">Water (ml)</Label>
                    <Input
                      id="water"
                      type="number"
                      value={macroTargets.water_ml}
                      onChange={(e) => handleMacroChange('water_ml', e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileUp className="h-5 w-5" />
                      Upload Nutrition Plan
                    </CardTitle>
                    <CardDescription>
                      Upload your nutrition plan from a coach or nutritionist
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="file-upload"
                      />
                      <Label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <FileUp className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-xs text-gray-500">
                          PDF, DOC, TXT, or image files
                        </span>
                      </Label>
                    </div>

                    {selectedFile && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">{selectedFile.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <Button
                      onClick={handleFileUpload}
                      disabled={!selectedFile || isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Target className="mr-2 h-4 w-4" />
                          Analyze and Set Targets
                        </>
                      )}
                    </Button>

                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <Info className="h-4 w-4 mt-0.5" />
                      <p>
                        Our AI will analyze your plan and automatically set your macro targets
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integrations" className="space-y-4">
                {integrations.map((integration) => (
                  <Card key={integration.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {integration.icon}
                          <div>
                            <CardTitle className="text-base">
                              {integration.name}
                              {integration.comingSoon && (
                                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  Coming Soon
                                </span>
                              )}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {integration.description}
                            </CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={integration.connected}
                          onCheckedChange={() => toggleIntegration(integration.id)}
                          disabled={integration.comingSoon}
                        />
                      </div>
                    </CardHeader>
                    {integration.connected && (
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Check className="h-4 w-4" />
                          Connected
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}