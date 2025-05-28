
"use client";

import type { Recipe, RecipeStep, Ingredient } from "@/types";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
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
  const [voiceLangValue, setVoiceLangValue] = useState("none"); // Default to none
  const [speechLangCode, setSpeechLangCode] = useState(""); 
  const [translateLangName, setTranslateLangName] = useState(""); 

  const [currentSpokenText, setCurrentSpokenText] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default to muted if "No Sound" is chosen

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const currentStep: RecipeStep | undefined = recipe.steps[currentStepIndex];

  useEffect(() => {
    const storedUserName = localStorage.getItem("cookingUserName");
    const storedVoiceLang = localStorage.getItem("cookingVoiceLang");
    const storedSpeechLangCode = localStorage.getItem("cookingSpeechLangCode");
    const storedTranslateLangName = localStorage.getItem("cookingTranslateLangName");

    if (storedUserName) setUserName(storedUserName);
    if (storedVoiceLang) {
      setVoiceLangValue(storedVoiceLang);
      if (storedVoiceLang === "none") {
        setIsMuted(true);
      } else {
        setIsMuted(false);
      }
    }
    if (storedSpeechLangCode) setSpeechLangCode(storedSpeechLangCode);
    if (storedTranslateLangName) setTranslateLangName(storedTranslateLangName);
    
    console.log(`Recipe cooking started by: ${storedUserName || 'Guest'}, Recipe: ${recipe.name}, Language: ${storedVoiceLang || 'none'}`);

    audioRef.current = new Audio('/alarm.mp3'); // Ensure alarm.mp3 is in /public
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

  const getLinkedIngredients = useCallback((): Ingredient[] => {
    if (!currentStep || !currentStep.ingredientIds || !recipe.ingredients) return [];
    return recipe.ingredients.filter(ing => currentStep.ingredientIds?.includes(ing.id));
  }, [currentStep, recipe.ingredients]);


  useEffect(() => {
    if (!currentStep || isMuted || voiceLangValue === "none") {
      setCurrentSpokenText(null);
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    let isMounted = true;
    const processSpeech = async () => {
      const linkedIngredients = getLinkedIngredients();
      let ingredientsText = "";
      if (linkedIngredients.length > 0) {
        const ingredientNames = linkedIngredients.map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`).join(", ");
        // This prefix will also be translated if the target language is not English.
        // For more natural sounding translations, you might need a more sophisticated i18n setup for these fixed phrases.
        ingredientsText = `For this step, you will need: ${ingredientNames}. `;
      }
      
      const fullInstruction = ingredientsText + currentStep.instruction;

      if (voiceLangValue === "en" || !translateLangName) {
        if (isMounted) setCurrentSpokenText(fullInstruction);
      } else {
        try {
          const translationOutput = await translateRecipeStep({
            step: fullInstruction,
            language: translateLangName,
          });
          if (isMounted) setCurrentSpokenText(translationOutput.translatedStep);
        } catch (error) {
          console.error("Error translating step:", error);
          if (isMounted) setCurrentSpokenText(fullInstruction); 
        }
      }
    };
    processSpeech();
    return () => { isMounted = false; }
  }, [currentStep, voiceLangValue, translateLangName, isMuted, getLinkedIngredients]);


  useEffect(() => {
    if (currentSpokenText && !isMuted && speechLangCode && voiceLangValue !== "none") {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      utteranceRef.current = new SpeechSynthesisUtterance(currentSpokenText);
      utteranceRef.current.lang = speechLangCode;
      
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) { // Voices might not be loaded immediately
        const targetVoice = voices.find(voice => voice.lang === speechLangCode);
        if (targetVoice) {
          utteranceRef.current.voice = targetVoice;
        } else {
          const fallbackVoice = voices.find(voice => voice.lang.startsWith(speechLangCode.substring(0,2))) || voices[0];
          if(fallbackVoice) utteranceRef.current.voice = fallbackVoice;
        }
      } else {
         // Handle case where voices are not yet loaded - speech might use default system voice
         console.warn("Speech synthesis voices not loaded yet. Speech may use default system voice.");
      }


      utteranceRef.current.onstart = () => setIsSpeaking(true);
      utteranceRef.current.onend = () => {
        setIsSpeaking(false);
        setCurrentSpokenText(null); 
      };
      utteranceRef.current.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        setIsSpeaking(false);
        setCurrentSpokenText(null);
      };
      
      setTimeout(() => {
          if(utteranceRef.current && utteranceRef.current.text === currentSpokenText && !isMuted && window.speechSynthesis) {
            window.speechSynthesis.speak(utteranceRef.current);
          }
      }, 100);

    } else if (window.speechSynthesis && window.speechSynthesis.speaking) {
         window.speechSynthesis.cancel();
    }
  }, [currentSpokenText, speechLangCode, isMuted, voiceLangValue]);


  useEffect(() => {
    stopAlarm();
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    if (currentStep?.timerInSeconds && currentStep.timerInSeconds > 0) {
      setStepTimeLeft(currentStep.timerInSeconds);
      setStepTimerActive(false);
    } else {
      setStepTimeLeft(null);
      setStepTimerActive(false);
    }
  }, [currentStepIndex, currentStep?.timerInSeconds, stopAlarm]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (stepTimerActive && stepTimeLeft !== null && stepTimeLeft > 0) {
      interval = setInterval(() => {
        setStepTimeLeft((prevTime) => (prevTime !== null ? prevTime - 1 : null));
      }, 1000);
    } else if (stepTimerActive && stepTimeLeft === 0) {
      setStepTimerActive(false);
      setIsAlarming(true);
      if (!isMuted && audioRef.current && voiceLangValue !== "none") {
         audioRef.current.play().catch(e => console.error("Error playing alarm sound:", e));
         if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
         alarmIntervalRef.current = setInterval(() => {
            if (audioRef.current && !isMuted && voiceLangValue !== "none") {
                audioRef.current.play().catch(e => console.error("Error playing alarm sound (interval):", e));
            }
         }, 10000); // Repeat every 10 seconds
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stepTimerActive, stepTimeLeft, isMuted, voiceLangValue]);

  const handleNextStep = useCallback(() => {
    stopAlarm();
    if (window.speechSynthesis && window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    if (currentStepIndex < recipe.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  }, [currentStepIndex, recipe.steps.length, stopAlarm]);

  const handlePreviousStep = useCallback(() => {
    stopAlarm();
    if (window.speechSynthesis && window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex, stopAlarm]);

  const toggleTimer = useCallback(() => {
    if (stepTimeLeft === 0 && !isAlarming) return; // Don't start if timer already finished and not alarming
    if (isAlarming) stopAlarm(); // If alarm is on, pressing button stops it.
    else setStepTimerActive(!stepTimerActive); // Otherwise, toggle timer.
  }, [stepTimerActive, stepTimeLeft, isAlarming, stopAlarm]);

  const resetTimer = useCallback(() => {
    stopAlarm();
    if (currentStep?.timerInSeconds) {
      setStepTimeLeft(currentStep.timerInSeconds);
      setStepTimerActive(false);
    }
  }, [currentStep?.timerInSeconds, stopAlarm]);

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (newMutedState && window.speechSynthesis && window.speechSynthesis.speaking) { 
        window.speechSynthesis.cancel();
    }
    // If alarm was sounding and we are muting, it will stop in the timer effect.
    // If unmuting and alarm was supposed to be on, it might restart in timer effect.
    // This assumes changing voiceLangValue to "none" in form would also set isMuted.
    // For direct toggle, we'll update localStorage to persist mute state if "none" wasn't selected.
    if (voiceLangValue !== "none") {
        // Here you might want to save this mute preference to localStorage if it's a manual toggle
        // and not tied to the "No Sound" language option. For now, it's session-based.
    }
  };

  const progressPercentage = ((currentStepIndex + 1) / recipe.steps.length) * 100;
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
            {voiceLangValue !== "none" && ( // Only show mute toggle if a voice language is selected
                 <Button onClick={toggleMute} variant="ghost" size="icon" className="ml-auto">
                    {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                    <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
                </Button>
            )}
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
                <ul className="list-disc list-inside space-y-2 pl-2">
                    {linkedIngredients.map(ing => (
                        <li key={ing.id} className="text-sm flex items-center gap-2">
                            {ing.imageUrl && (
                                <Image
                                    src={ing.imageUrl}
                                    alt={ing.name}
                                    width={40}
                                    height={40}
                                    className="rounded-md object-cover"
                                    data-ai-hint={ing.aiHint || ing.name.split(" ").slice(0,2).join(" ")}
                                />
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
                {stepTimerActive ? "Pause" : (stepTimeLeft === currentStep.timerInSeconds ? "Start Timer" : (isAlarming ? "Stop Alarm" : "Resume"))}
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
          <Button onClick={handleNextStep} disabled={currentStepIndex === recipe.steps.length - 1} size="lg">
            Next Step <ChevronRight className="ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
