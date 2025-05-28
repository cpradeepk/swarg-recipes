
"use client";

import type { Recipe, RecipeStep, Ingredient } from "@/types";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Clock, Play, Pause, RotateCcw, Thermometer, ListChecks, ChevronLeft, ChevronRight, AlertTriangle, Volume2, VolumeX } from "lucide-react";
import { translateRecipeStep } from "@/ai/flows/translate-recipe-step"; // Genkit flow for translation

interface InteractiveCookViewProps {
  recipe: Recipe;
}

const formatTime = (totalSeconds: number | null | undefined): string => {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) return "00:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export default function InteractiveCookView({ recipe }: InteractiveCookViewProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepTimerActive, setStepTimerActive] = useState(false);
  const [stepTimeLeft, setStepTimeLeft] = useState<number | null>(null);
  const [isAlarming, setIsAlarming] = useState(false);
  
  const [userName, setUserName] = useState("Guest");
  const [voiceLangValue, setVoiceLangValue] = useState("en"); // 'en', 'hi', 'kn'
  const [speechLangCode, setSpeechLangCode] = useState("en-US"); // 'en-US', 'hi-IN', 'kn-IN'
  const [translateLangName, setTranslateLangName] = useState("English"); // 'English', 'Hindi', 'Kannada'

  const [currentSpokenText, setCurrentSpokenText] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const currentStep: RecipeStep | undefined = recipe.steps[currentStepIndex];

  useEffect(() => {
    // Retrieve user preferences from localStorage on mount
    const storedUserName = localStorage.getItem("cookingUserName");
    const storedVoiceLang = localStorage.getItem("cookingVoiceLang");
    const storedSpeechLangCode = localStorage.getItem("cookingSpeechLangCode");
    const storedTranslateLangName = localStorage.getItem("cookingTranslateLangName");

    if (storedUserName) setUserName(storedUserName);
    if (storedVoiceLang) setVoiceLangValue(storedVoiceLang);
    if (storedSpeechLangCode) setSpeechLangCode(storedSpeechLangCode);
    if (storedTranslateLangName) setTranslateLangName(storedTranslateLangName);
    
    // Log recipe preparation start (placeholder)
    console.log(`Recipe cooking started by: ${storedUserName || 'Guest'}, Recipe: ${recipe.name}, Language: ${storedTranslateLangName || 'English'}`);


    audioRef.current = new Audio('/alarm.mp3');
    audioRef.current.loop = false;

    return () => { // Cleanup
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
      }
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [recipe.name]);

  const stopAlarm = useCallback(() => {
    setIsAlarming(false);
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Effect for handling translation and setting text to be spoken
  useEffect(() => {
    if (!currentStep) return;
    if (isMuted) { // If muted, don't process speech
        setCurrentSpokenText(null); 
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        return;
    }

    let isMounted = true;
    const processSpeech = async () => {
      if (voiceLangValue === "en" || translateLangName === "English") {
        if (isMounted) setCurrentSpokenText(currentStep.instruction);
      } else {
        try {
          const translationOutput = await translateRecipeStep({
            step: currentStep.instruction,
            language: translateLangName,
          });
          if (isMounted) setCurrentSpokenText(translationOutput.translatedStep);
        } catch (error) {
          console.error("Error translating step:", error);
          if (isMounted) setCurrentSpokenText(currentStep.instruction); // Fallback to original on error
        }
      }
    };
    processSpeech();
    return () => { isMounted = false; }
  }, [currentStep, voiceLangValue, translateLangName, isMuted]);


  // Effect for speaking the text
  useEffect(() => {
    if (currentSpokenText && !isMuted) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      utteranceRef.current = new SpeechSynthesisUtterance(currentSpokenText);
      utteranceRef.current.lang = speechLangCode;
      
      // Wait for voices to be loaded
      const voices = window.speechSynthesis.getVoices();
      const targetVoice = voices.find(voice => voice.lang === speechLangCode);
      if (targetVoice) {
        utteranceRef.current.voice = targetVoice;
      } else if (voices.length > 0) {
        // Fallback to a default voice if specific language voice not found, or first available
        const fallbackVoice = voices.find(voice => voice.lang.startsWith(speechLangCode.substring(0,2))) || voices[0];
        if(fallbackVoice) utteranceRef.current.voice = fallbackVoice;
      }


      utteranceRef.current.onstart = () => setIsSpeaking(true);
      utteranceRef.current.onend = () => {
        setIsSpeaking(false);
        setCurrentSpokenText(null); // Clear after speaking to prevent re-speaking on other state changes
      };
      utteranceRef.current.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        setIsSpeaking(false);
        setCurrentSpokenText(null);
      };
      
      // Small delay to ensure cancel has taken effect if called rapidly
      setTimeout(() => {
          if(utteranceRef.current && utteranceRef.current.text === currentSpokenText) { // Check if text is still the one we want to speak
            window.speechSynthesis.speak(utteranceRef.current);
          }
      }, 100);

    } else if (isMuted && window.speechSynthesis.speaking) {
         window.speechSynthesis.cancel();
    }
  }, [currentSpokenText, speechLangCode, isMuted]);


  // Initialize or reset timer when step changes
  useEffect(() => {
    stopAlarm();
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    // setCurrentSpokenText(null); // This will be handled by the translation/speech effect

    if (currentStep?.timerInSeconds && currentStep.timerInSeconds > 0) {
      setStepTimeLeft(currentStep.timerInSeconds);
      setStepTimerActive(false);
    } else {
      setStepTimeLeft(null);
      setStepTimerActive(false);
    }
  }, [currentStepIndex, currentStep?.timerInSeconds, stopAlarm]);

  // Timer countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (stepTimerActive && stepTimeLeft !== null && stepTimeLeft > 0) {
      interval = setInterval(() => {
        setStepTimeLeft((prevTime) => (prevTime !== null ? prevTime - 1 : null));
      }, 1000);
    } else if (stepTimerActive && stepTimeLeft === 0) {
      setStepTimerActive(false);
      setIsAlarming(true);
      if (!isMuted && audioRef.current) {
         audioRef.current.play().catch(e => console.error("Error playing alarm sound:", e));
         if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
         alarmIntervalRef.current = setInterval(() => {
            if (audioRef.current && !isMuted) {
                audioRef.current.play().catch(e => console.error("Error playing alarm sound:", e));
            }
         }, 10000);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stepTimerActive, stepTimeLeft, isMuted]);

  const handleNextStep = useCallback(() => {
    stopAlarm();
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    if (currentStepIndex < recipe.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  }, [currentStepIndex, recipe.steps.length, stopAlarm]);

  const handlePreviousStep = useCallback(() => {
    stopAlarm();
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex, stopAlarm]);

  const toggleTimer = useCallback(() => {
    if (stepTimeLeft === 0) return;
    if (isAlarming) stopAlarm();
    setStepTimerActive(!stepTimerActive);
  }, [stepTimerActive, stepTimeLeft, isAlarming, stopAlarm]);

  const resetTimer = useCallback(() => {
    stopAlarm();
    if (currentStep?.timerInSeconds) {
      setStepTimeLeft(currentStep.timerInSeconds);
      setStepTimerActive(false);
    }
  }, [currentStep?.timerInSeconds, stopAlarm]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && window.speechSynthesis.speaking) { // If unmuting and was speaking, cancel
        window.speechSynthesis.cancel();
    }
    if (isAlarming && audioRef.current) { // If alarm was sounding
        if (!isMuted) audioRef.current.pause(); // if unmuting (meaning it was muted), pause alarm
        // else if it was unmuted and now muting, alarm will stop naturally in timer effect
    }
  };

  const progressPercentage = ((currentStepIndex + 1) / recipe.steps.length) * 100;

  const getLinkedIngredients = (): Ingredient[] => {
    if (!currentStep || !currentStep.ingredientIds || !recipe.ingredients) return [];
    // Ensure recipe.ingredients and ingredientIds are defined.
    // The ingredientIds on currentStep come from the DB which are the actual ingredient IDs.
    return recipe.ingredients.filter(ing => currentStep.ingredientIds?.includes(ing.id));
  };
  const linkedIngredients = getLinkedIngredients();

  if (!currentStep) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6" /> Error: Recipe Step Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            There was an issue loading the current cooking step. Please try navigating back or reloading the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-bold text-primary text-center flex-grow">{recipe.name}</CardTitle>
            <Button onClick={toggleMute} variant="ghost" size="icon" className="ml-auto">
                {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
            </Button>
        </div>
        <CardDescription className="text-center">
          Step {currentStep.stepNumber} of {recipe.steps.length} (Chef: {userName})
        </CardDescription>
        <Progress value={progressPercentage} className="w-full mt-2 h-3" />
      </CardHeader>

      <CardContent className="space-y-6">
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
                <ul className="list-disc list-inside space-y-1 pl-2">
                    {linkedIngredients.map(ing => (
                        <li key={ing.id} className="text-sm">
                            {ing.quantity} {ing.unit} {ing.name}
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
                {stepTimerActive ? "Pause" : (stepTimeLeft === currentStep.timerInSeconds ? "Start Timer" : "Resume")}
              </Button>
              <Button onClick={resetTimer} variant="outline" size="lg">
                <RotateCcw className="mr-2" /> Reset
              </Button>
            </div>
            {isAlarming && <p className="text-center text-destructive font-medium mt-2">Timer finished!</p>}
          </div>
        )}

        <Separator />

        <div className="flex justify-between items-center">
          <Button onClick={handlePreviousStep} disabled={currentStepIndex === 0} variant="outline" size="lg">
            <ChevronLeft className="mr-2" /> Previous Step
          </Button>
          {/* "Read Aloud" button is removed as speech is automatic */}
          <Button onClick={handleNextStep} disabled={currentStepIndex === recipe.steps.length - 1} size="lg">
            Next Step <ChevronRight className="ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
