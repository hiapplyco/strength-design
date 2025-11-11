import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
import { db, storage, functions } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { debounce } from 'lodash';

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

// Custom hook for nutrition settings
function useNutritionSettings(userId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['nutrition-settings', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');

      const docRef = doc(db, 'nutrition_settings', userId);
      const docSnap = await getDoc(docRef);

      return docSnap.exists() ? docSnap.data() : null;
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in newer React Query)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Memoized input component to prevent re-renders
const MacroInput = memo(({ 
  id, 
  label, 
  value, 
  onChange 
}: { 
  id: string; 
  label: string; 
  value: number; 
  onChange: (value: number) => void;
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value) || 0);
  }, [onChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={handleChange}
      />
    </div>
  );
});

MacroInput.displayName = 'MacroInput';

export const NutritionSettingsDialogOptimized = memo(({ 
  open, 
  onOpenChange 
}: NutritionSettingsDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Default macro targets
  const defaultMacros = useMemo(() => ({
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
  }), []);

  const [macroTargets, setMacroTargets] = useState<MacroTargets>(defaultMacros);

  // Default integrations
  const defaultIntegrations = useMemo(() => [
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
  ], []);

  const [integrations, setIntegrations] = useState<Integration[]>(defaultIntegrations);

  // Use React Query for fetching settings
  const { data: settings, isLoading } = useNutritionSettings(user?.uid, open);

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setMacroTargets({
        calories: settings.target_calories || defaultMacros.calories,
        protein: settings.target_protein || defaultMacros.protein,
        carbs: settings.target_carbs || defaultMacros.carbs,
        fat: settings.target_fat || defaultMacros.fat,
        fiber: settings.target_fiber || defaultMacros.fiber,
        sugar: settings.target_sugar || defaultMacros.sugar,
        sodium: settings.target_sodium || defaultMacros.sodium,
        cholesterol: settings.target_cholesterol || defaultMacros.cholesterol,
        saturated_fat: settings.target_saturated_fat || defaultMacros.saturated_fat,
        water_ml: settings.target_water_ml || defaultMacros.water_ml
      });

      if (settings.integrations) {
        setIntegrations(prev => prev.map(integration => ({
          ...integration,
          connected: settings.integrations?.[integration.id]?.connected || false
        })));
      }
    }
  }, [settings, defaultMacros]);

  // Mutation for saving settings
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user?.uid) throw new Error('User not authenticated');

      const docRef = doc(db, 'nutrition_settings', user.uid);
      await setDoc(docRef, {
        ...data,
        updated_at: Timestamp.now()
      }, { merge: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-settings', user?.uid] });
      toast({
        title: "Settings saved",
        description: "Your nutrition settings have been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast({
        title: "Error saving settings",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Debounced save function to prevent rapid updates
  const debouncedSave = useMemo(
    () => debounce((data: any) => {
      saveMutation.mutate(data);
    }, 1000),
    [saveMutation]
  );

  const handleSave = useCallback(() => {
    const integrationsData = integrations.reduce((acc, integration) => ({
      ...acc,
      [integration.id]: { connected: integration.connected }
    }), {});

    saveMutation.mutate({
      user_id: user?.uid,
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
      integrations: integrationsData
    });
  }, [user?.uid, macroTargets, integrations, saveMutation]);

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('User required');

      const fileName = `${user.uid}/nutrition-plans/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `nutrition-uploads/${fileName}`);
      await uploadBytes(storageRef, file);

      const parseNutritionPlan = httpsCallable(functions, 'parseNutritionPlan');
      const result = await parseNutritionPlan({
        fileName: fileName,
        fileType: file.type
      });

      return result.data;
    },
    onSuccess: (data) => {
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
    },
    onError: (error) => {
      console.error('Error uploading file:', error);
      toast({
        title: "Error processing file",
        description: "Please try again with a different file.",
        variant: "destructive"
      });
    }
  });

  const handleFileUpload = useCallback(() => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  }, [selectedFile, uploadMutation]);

  const handleIntegrationToggle = useCallback((integrationId: string) => {
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

    if (!integrations.find(i => i.id === integrationId)?.connected) {
      toast({
        title: "Integration setup",
        description: "OAuth connection flow would start here in production.",
      });
    }
  }, [integrations]);

  // Memoized callbacks for macro updates
  const updateMacro = useCallback((key: keyof MacroTargets, value: number) => {
    setMacroTargets(prev => ({ ...prev, [key]: value }));
  }, []);

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
                    <MacroInput
                      id="calories"
                      label="Calories"
                      value={macroTargets.calories}
                      onChange={(value) => updateMacro('calories', value)}
                    />
                    <MacroInput
                      id="protein"
                      label="Protein (g)"
                      value={macroTargets.protein}
                      onChange={(value) => updateMacro('protein', value)}
                    />
                    <MacroInput
                      id="carbs"
                      label="Carbohydrates (g)"
                      value={macroTargets.carbs}
                      onChange={(value) => updateMacro('carbs', value)}
                    />
                    <MacroInput
                      id="fat"
                      label="Fat (g)"
                      value={macroTargets.fat}
                      onChange={(value) => updateMacro('fat', value)}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <MacroInput
                      id="fiber"
                      label="Fiber (g)"
                      value={macroTargets.fiber}
                      onChange={(value) => updateMacro('fiber', value)}
                    />
                    <MacroInput
                      id="sugar"
                      label="Sugar (g)"
                      value={macroTargets.sugar}
                      onChange={(value) => updateMacro('sugar', value)}
                    />
                    <MacroInput
                      id="sodium"
                      label="Sodium (mg)"
                      value={macroTargets.sodium}
                      onChange={(value) => updateMacro('sodium', value)}
                    />
                    <MacroInput
                      id="water"
                      label="Water (ml)"
                      value={macroTargets.water_ml}
                      onChange={(value) => updateMacro('water_ml', value)}
                    />
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
                        disabled={uploadMutation.isLoading}
                      >
                        {uploadMutation.isLoading ? (
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
          <Button onClick={handleSave} disabled={saveMutation.isLoading}>
            {saveMutation.isLoading ? (
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
});

NutritionSettingsDialogOptimized.displayName = 'NutritionSettingsDialogOptimized';