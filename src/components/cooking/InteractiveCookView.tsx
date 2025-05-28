
"use client";

import type { Recipe, RecipeStep, Ingredient, RecipePreparationLogFeedback } from "@/types";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Play, Pause, RotateCcw, Thermometer, ListChecks, ChevronLeft, ChevronRight, AlertTriangle, Volume2, VolumeX, Camera, Edit3, CheckSquare, Info } from "lucide-react";
import { translateRecipeStep } from "@/ai/flows/translate-recipe-step"; 
import { startRecipeLogAction, endRecipeLogAction } from "@/lib/actions/recipeLogActions";
import { useToast } from "@/hooks/use-toast";

interface InteractiveCookViewProps {
  recipe: Recipe;
}

const formatTime = (totalSeconds: number | null | undefined): string => {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) return "00:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const FEEDBACK_STEP_ID = "feedback-step";

export default function InteractiveCookView({ recipe }: InteractiveCookViewProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepTimerActive, setStepTimerActive] = useState(false);
  const [stepTimeLeft, setStepTimeLeft] = useState<number | null>(null);
  const [isAlarming, setIsAlarming] = useState(false);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Guest");
  const [voiceLangValue, setVoiceLangValue] = useState("none"); 
  const [speechLangCode, setSpeechLangCode] = useState(""); 
  const [translateLangName, setTranslateLangName] = useState(""); 

  const [currentSpokenText, setCurrentSpokenText] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(true); 

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [currentLogId, setCurrentLogId] = useState<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const { toast } = useToast();

  // State for feedback form
  const [feedbackPhotoUrl, setFeedbackPhotoUrl] = useState("");
  const [feedbackProductWeight, setFeedbackProductWeight] = useState("");
  const [feedbackNumPreps, setFeedbackNumPreps] = useState<number | undefined>(undefined);
  const [feedbackIsWasted, setFeedbackIsWasted] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const totalRecipeSteps = recipe.steps.length;
  const isFeedbackStep = currentStepIndex === totalRecipeSteps;

  const currentStep: RecipeStep | undefined = isFeedbackStep ? 
    { 
      id: FEEDBACK_STEP_ID, 
      stepNumber: totalRecipeSteps + 1, 
      instruction: "Provide feedback and photo of your dish.",
      // No timer, temp, ingredients for feedback step by default
    } : 
    recipe.steps[currentStepIndex];


  useEffect(() => {
    const storedUserId = localStorage.getItem("cookingUserId");
    const storedUserName = localStorage.getItem("cookingUserName");
    const storedVoiceLang = localStorage.getItem("cookingVoiceLang");
    const storedSpeechLangCode = localStorage.getItem("cookingSpeechLangCode");
    const storedTranslateLangName = localStorage.getItem("cookingTranslateLangName");

    if (storedUserId) setUserId(storedUserId);
    if (storedUserName) setUserName(storedUserName);
    if (storedVoiceLang) {
      setVoiceLangValue(storedVoiceLang);
      setIsMuted(storedVoiceLang === "none");
    }
    if (storedSpeechLangCode) setSpeechLangCode(storedSpeechLangCode);
    if (storedTranslateLangName) setTranslateLangName(storedTranslateLangName);
    
    startTimeRef.current = new Date();

    if (storedUserId && recipe.id && startTimeRef.current) {
      startRecipeLogAction(
        storedUserId,
        storedUserName || "Guest",
        recipe.id,
        startTimeRef.current,
        storedVoiceLang || "none"
      ).then(result => {
        if (result.success && result.logId) {
          setCurrentLogId(result.logId);
          console.log(`Recipe cooking log started: ${result.logId}, User: ${storedUserName || 'Guest'}, Recipe: ${recipe.name}`);
        } else {
          console.error("Failed to start recipe log:", result.error);
          toast({ title: "Logging Error", description: "Could not start recipe log.", variant: "destructive"});
        }
      });
    }


    audioRef.current = new Audio('/alarm.mp3'); 
    audioRef.current.loop = false;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
      }
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [recipe.id, recipe.name, toast]);

  const stopAlarm = useCallback(() => {
    setIsAlarming(false);
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const getLinkedIngredients = useCallback((): Ingredient[] => {
    if (!currentStep || isFeedbackStep || !currentStep.ingredientIds || !recipe.ingredients) return [];
    return recipe.ingredients.filter(ing => currentStep.ingredientIds?.includes(ing.id));
  }, [currentStep, recipe.ingredients, isFeedbackStep]);


  useEffect(() => {
    if (!currentStep || isMuted || voiceLangValue === "none" || isFeedbackStep) {
      setCurrentSpokenText(null);
      if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
      return;
    }

    let isMounted = true;
    const processSpeech = async () => {
      const linkedIngredients = getLinkedIngredients();
      let ingredientsText = "";
      if (linkedIngredients.length > 0) {
        const ingredientNames = linkedIngredients.map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`).join(", ");
        ingredientsText = `For this step, you will need: ${ingredientNames}. `;
      }
      
      const fullInstruction = ingredientsText + currentStep.instruction;

      if (voiceLangValue === "en" || !translateLangName) {
        if (isMounted) setCurrentSpokenText(fullInstruction);
      } else {
        try {
          const translationOutput = await translateRecipeStep({ step: fullInstruction, language: translateLangName });
          if (isMounted) setCurrentSpokenText(translationOutput.translatedStep);
        } catch (error) {
          console.error("Error translating step:", error);
          if (isMounted) setCurrentSpokenText(fullInstruction); 
        }
      }
    };
    processSpeech();
    return () => { isMounted = false; }
  }, [currentStep, voiceLangValue, translateLangName, isMuted, getLinkedIngredients, isFeedbackStep]);


  useEffect(() => {
    if (currentSpokenText && !isMuted && speechLangCode && voiceLangValue !== "none") {
      if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
      
      utteranceRef.current = new SpeechSynthesisUtterance(currentSpokenText);
      utteranceRef.current.lang = speechLangCode;
      
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const targetVoice = voices.find(voice => voice.lang === speechLangCode) || voices.find(voice => voice.lang.startsWith(speechLangCode.substring(0,2))) || voices[0];
        if(targetVoice) utteranceRef.current.voice = targetVoice;
      } else {
         console.warn("Speech synthesis voices not loaded yet.");
      }

      utteranceRef.current.onstart = () => setIsSpeaking(true);
      utteranceRef.current.onend = () => { setIsSpeaking(false); setCurrentSpokenText(null); };
      utteranceRef.current.onerror = (event) => { console.error("Speech error:", event.error); setIsSpeaking(false); setCurrentSpokenText(null);};
      
      setTimeout(() => {
          if(utteranceRef.current?.text === currentSpokenText && !isMuted && window.speechSynthesis) {
            window.speechSynthesis.speak(utteranceRef.current);
          }
      }, 100);

    } else if (window.speechSynthesis?.speaking) {
         window.speechSynthesis.cancel();
    }
  }, [currentSpokenText, speechLangCode, isMuted, voiceLangValue]);


  useEffect(() => {
    stopAlarm();
    if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
    setIsSpeaking(false);

    if (currentStep?.timerInSeconds && currentStep.timerInSeconds > 0 && !isFeedbackStep) {
      setStepTimeLeft(currentStep.timerInSeconds);
      setStepTimerActive(false);
    } else {
      setStepTimeLeft(null);
      setStepTimerActive(false);
    }
  }, [currentStepIndex, currentStep?.timerInSeconds, stopAlarm, isFeedbackStep]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (stepTimerActive && stepTimeLeft !== null && stepTimeLeft > 0) {
      interval = setInterval(() => setStepTimeLeft((prevTime) => (prevTime !== null ? prevTime - 1 : null)), 1000);
    } else if (stepTimerActive && stepTimeLeft === 0) {
      setStepTimerActive(false);
      setIsAlarming(true);
      if (!isMuted && audioRef.current && voiceLangValue !== "none") {
         audioRef.current.play().catch(e => console.error("Error playing alarm:", e));
         if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
         alarmIntervalRef.current = setInterval(() => {
            if (audioRef.current && !isMuted && voiceLangValue !== "none") audioRef.current.play().catch(e => console.error("Error playing alarm (interval):", e));
         }, 10000); 
      }
    }
    return () => { if (interval) clearInterval(interval); };
  }, [stepTimerActive, stepTimeLeft, isMuted, voiceLangValue]);

  const handleNextStep = useCallback(() => {
    stopAlarm();
    if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
    if (currentStepIndex < totalRecipeSteps) { // Allows going to feedback step
      setCurrentStepIndex(currentStepIndex + 1);
    }
  }, [currentStepIndex, totalRecipeSteps, stopAlarm]);

  const handlePreviousStep = useCallback(() => {
    stopAlarm();
    if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex, stopAlarm]);

  const toggleTimer = useCallback(() => {
    if (stepTimeLeft === 0 && !isAlarming) return; 
    if (isAlarming) stopAlarm(); 
    else setStepTimerActive(!stepTimerActive); 
  }, [stepTimerActive, stepTimeLeft, isAlarming, stopAlarm]);

  const resetTimer = useCallback(() => {
    stopAlarm();
    if (currentStep?.timerInSeconds && !isFeedbackStep) {
      setStepTimeLeft(currentStep.timerInSeconds);
      setStepTimerActive(false);
    }
  }, [currentStep?.timerInSeconds, stopAlarm, isFeedbackStep]);

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (newMutedState && window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
  };

  const handleFeedbackSubmit = async () => {
    if (!currentLogId || !startTimeRef.current) {
        toast({ title: "Error", description: "Log ID not found. Cannot submit feedback.", variant: "destructive" });
        return;
    }
    setIsSubmittingFeedback(true);
    const endTime = new Date();
    const durationSeconds = Math.round((endTime.getTime() - startTimeRef.current.getTime()) / 1000);
    
    const feedbackData: RecipePreparationLogFeedback = {
        photoUrl: feedbackPhotoUrl || undefined,
        productWeight: feedbackProductWeight || undefined,
        numPreps: feedbackNumPreps,
        isWasted: feedbackIsWasted,
    };

    const result = await endRecipeLogAction(currentLogId, endTime, durationSeconds, true, feedbackData);
    if (result.success) {
        toast({ title: "Feedback Submitted!", description: "Thank you for your feedback." });
        // Optionally navigate away or show a completion message
        // For now, just disable the form
    } else {
        toast({ title: "Error", description: result.error || "Failed to submit feedback.", variant: "destructive" });
    }
    setIsSubmittingFeedback(false);
  };

  const progressPercentage = isFeedbackStep ? 100 : ((currentStepIndex + 1) / (totalRecipeSteps +1)) * 100;
  const linkedIngredients = getLinkedIngredients();

  if (!currentStep) {
    return (
      <Card className="shadow-xl"><CardHeader><CardTitle className="text-2xl font-bold text-destructive flex items-center"><AlertTriangle className="mr-2 h-6 w-6" /> Error: Step Not Found</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Issue loading step.</p></CardContent></Card>
    );
  }

  return (
    <Card className="shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-bold text-primary text-center flex-grow">{recipe.name}</CardTitle>
            {voiceLangValue !== "none" && (
                 <Button onClick={toggleMute} variant="ghost" size="icon" className="ml-auto">
                    {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                    <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
                </Button>
            )}
        </div>
        <CardDescription className="text-center">
          {isFeedbackStep ? "Recipe Complete - Feedback" : `Step ${currentStep.stepNumber} of ${totalRecipeSteps}`} (Chef: {userName})
        </CardDescription>
        <Progress value={progressPercentage} className="w-full mt-2 h-3" />
      </CardHeader>

      <CardContent className="space-y-6">
        {isFeedbackStep ? (
            <div className="p-4 border rounded-lg space-y-4 bg-muted">
                <h3 className="text-xl font-semibold text-primary mb-2 flex items-center"><Edit3 className="mr-2 h-5 w-5" />Feedback Time!</h3>
                <p className="text-sm text-muted-foreground">Your input helps us improve. Please share details about your cooking experience.</p>
                
                <div className="space-y-2">
                    <Label htmlFor="feedbackPhotoUrl" className="flex items-center gap-1.5"><Camera size={16}/> Photo URL of Finished Dish</Label>
                    <Input id="feedbackPhotoUrl" placeholder="https://example.com/my_dish.jpg" value={feedbackPhotoUrl} onChange={e => setFeedbackPhotoUrl(e.target.value)} disabled={isSubmittingFeedback} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="feedbackProductWeight">Weight/Quantity Produced</Label>
                        <Input id="feedbackProductWeight" placeholder="e.g., 500g or 4 pieces" value={feedbackProductWeight} onChange={e => setFeedbackProductWeight(e.target.value)} disabled={isSubmittingFeedback} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="feedbackNumPreps">Number of Servings Prepared</Label>
                        <Input id="feedbackNumPreps" type="number" placeholder="e.g., 4" value={feedbackNumPreps ?? ''} onChange={e => setFeedbackNumPreps(e.target.value === '' ? undefined : Number(e.target.value))} disabled={isSubmittingFeedback} />
                    </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="feedbackIsWasted" checked={feedbackIsWasted} onCheckedChange={c => setFeedbackIsWasted(c === true)} disabled={isSubmittingFeedback} />
                    <Label htmlFor="feedbackIsWasted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        The recipe didn't turn out well (product wasted).
                    </Label>
                </div>
                 <Button onClick={handleFeedbackSubmit} disabled={isSubmittingFeedback || !currentLogId} className="w-full">
                    {isSubmittingFeedback ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckSquare className="mr-2 h-4 w-4" />}
                    Finish & Submit Feedback
                </Button>
            </div>
        ) : (
        <>
            <div className="p-4 bg-muted rounded-lg min-h-[100px]">
            <h3 className="text-xl font-semibold text-foreground mb-2">Instruction:</h3>
            <p className="text-lg whitespace-pre-line">{currentStep.instruction}</p>
            </div>

            {currentStep.temperature && (
            <div className="flex items-center text-md p-3 bg-secondary/30 rounded-lg">
                <Thermometer className="mr-2 h-5 w-5 text-accent" />
                <span className="font-medium">Temperature:</span>
                <span className="ml-1.5">{currentStep.temperature}</span>
            </div>
            )}
            
            {linkedIngredients.length > 0 && (
                <div className="p-4 border rounded-lg bg-secondary/20">
                    <h4 className="text-lg font-semibold text-primary mb-2 flex items-center">
                        <ListChecks className="mr-2 h-5 w-5" /> Ingredients for this step:
                    </h4>
                    <ul className="list-disc list-inside space-y-2 pl-2">
                        {linkedIngredients.map(ing => (
                            <li key={ing.id} className="text-sm flex items-center gap-2">
                                {ing.imageUrl && (
                                    <Image src={ing.imageUrl} alt={ing.name} width={40} height={40} className="rounded-md object-cover" data-ai-hint={ing.aiHint || ing.name.split(" ").slice(0,2).join(" ")} />
                                )}
                                <span>{ing.quantity} {ing.unit} {ing.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {currentStep.timerInSeconds && currentStep.timerInSeconds > 0 && (
            <div className={`p-4 border rounded-lg space-y-3 ${isAlarming ? 'border-destructive ring-2 ring-destructive shadow-lg' : ''}`}>
                <div className="flex items-center justify-center text-4xl font-mono font-bold text-accent">
                <Clock className="mr-3 h-10 w-10" />
                <span>{formatTime(stepTimeLeft)}</span>
                </div>
                <div className="flex justify-center gap-3">
                <Button onClick={toggleTimer} variant={stepTimerActive ? "outline" : "default"} size="lg" disabled={stepTimeLeft === 0 && !isAlarming}>
                    {stepTimerActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                    {stepTimerActive ? "Pause" : (isAlarming ? "Stop Alarm" : (stepTimeLeft === currentStep.timerInSeconds ? "Start Timer" : "Resume"))}
                </Button>
                <Button onClick={resetTimer} variant="outline" size="lg" disabled={isAlarming && stepTimeLeft === 0}>
                    <RotateCcw className="mr-2" /> Reset
                </Button>
                </div>
                {isAlarming && <p className="text-center text-destructive font-medium mt-2">Timer finished!</p>}
            </div>
            )}
        </>
        )}


        <Separator />

        <div className="flex justify-between items-center">
          <Button onClick={handlePreviousStep} disabled={currentStepIndex === 0} variant="outline" size="lg">
            <ChevronLeft className="mr-2" /> Previous
          </Button>
          {!isFeedbackStep && (
            <Button onClick={handleNextStep} disabled={currentStepIndex >= totalRecipeSteps} size="lg">
                {currentStepIndex === totalRecipeSteps -1 ? "Go to Feedback" : "Next Step"} <ChevronRight className="ml-2" />
            </Button>
          )}
        </div>
        {isFeedbackStep && (
            <p className="text-xs text-center text-muted-foreground">
                <Info size={12} className="inline mr-1"/>
                Submitting feedback marks the recipe preparation as complete.
            </p>
        )}
      </CardContent>
    </Card>
  );
}
