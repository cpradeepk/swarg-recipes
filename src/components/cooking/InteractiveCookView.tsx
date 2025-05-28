
"use client";

import type { Recipe, RecipeStep, Ingredient } from "@/types";
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Clock, Play, Pause, RotateCcw, Thermometer, ListChecks, Mic, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";

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

  const currentStep: RecipeStep | undefined = recipe.steps[currentStepIndex];

  // Initialize or reset timer when step changes
  useEffect(() => {
    if (currentStep?.timerInSeconds && currentStep.timerInSeconds > 0) {
      setStepTimeLeft(currentStep.timerInSeconds);
      setStepTimerActive(false);
    } else {
      setStepTimeLeft(null);
      setStepTimerActive(false);
    }
  }, [currentStepIndex, currentStep?.timerInSeconds]);

  // Timer countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (stepTimerActive && stepTimeLeft !== null && stepTimeLeft > 0) {
      interval = setInterval(() => {
        setStepTimeLeft((prevTime) => (prevTime !== null ? prevTime - 1 : null));
      }, 1000);
    } else if (stepTimerActive && stepTimeLeft === 0) {
      setStepTimerActive(false);
      // Optionally: play a sound or show a notification
      alert(`Timer for "${currentStep?.instruction.substring(0,30)}..." has finished!`);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stepTimerActive, stepTimeLeft, currentStep?.instruction]);

  const handleNextStep = useCallback(() => {
    if (currentStepIndex < recipe.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  }, [currentStepIndex, recipe.steps.length]);

  const handlePreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  const toggleTimer = useCallback(() => {
    if (stepTimeLeft === 0) return; // Don't start if already finished
    setStepTimerActive(!stepTimerActive);
  }, [stepTimerActive, stepTimeLeft]);

  const resetTimer = useCallback(() => {
    if (currentStep?.timerInSeconds) {
      setStepTimeLeft(currentStep.timerInSeconds);
      setStepTimerActive(false);
    }
  }, [currentStep?.timerInSeconds]);

  const progressPercentage = ((currentStepIndex + 1) / recipe.steps.length) * 100;

  const getLinkedIngredients = (): Ingredient[] => {
    if (!currentStep || !currentStep.ingredientIds || !recipe.ingredients) return [];
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
        <CardTitle className="text-3xl font-bold text-primary text-center">{recipe.name}</CardTitle>
        <CardDescription className="text-center">
          Step {currentStep.stepNumber} of {recipe.steps.length}
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
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-center text-4xl font-mono font-bold text-accent">
              <Clock className="mr-3 h-10 w-10" />
              <span>{formatTime(stepTimeLeft)}</span>
            </div>
            <div className="flex justify-center gap-3">
              <Button onClick={toggleTimer} variant={stepTimerActive ? "outline" : "default"} size="lg" disabled={stepTimeLeft === 0}>
                {stepTimerActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                {stepTimerActive ? "Pause" : (stepTimeLeft === currentStep.timerInSeconds ? "Start Timer" : "Resume")}
              </Button>
              <Button onClick={resetTimer} variant="outline" size="lg">
                <RotateCcw className="mr-2" /> Reset
              </Button>
            </div>
          </div>
        )}

        <Separator />

        <div className="flex justify-between items-center">
          <Button onClick={handlePreviousStep} disabled={currentStepIndex === 0} variant="outline" size="lg">
            <ChevronLeft className="mr-2" /> Previous Step
          </Button>
          <Button onClick={() => alert("Voice instructions coming soon!")} variant="ghost" className="text-primary hover:text-primary/80">
            <Mic className="mr-2" /> Read Aloud
          </Button>
          <Button onClick={handleNextStep} disabled={currentStepIndex === recipe.steps.length - 1} size="lg">
            Next Step <ChevronRight className="ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
