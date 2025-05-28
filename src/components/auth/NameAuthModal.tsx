"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Languages, ShieldAlert, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NameAuthModalProps {
  isOpen: boolean;
  onAuthenticated: () => void;
}

const languageOptions = [
  { value: "none", label: "🔇 No Sound (Text Only)", speechLang: "", translateLang: "" },
  { value: "en", label: "🇬🇧 English", speechLang: "en-US", translateLang: "English" },
  { value: "hi", label: "🇮🇳 हिंदी (Hindi)", speechLang: "hi-IN", translateLang: "Hindi" },
  { value: "kn", label: "🇮🇳 ಕನ್ನಡ (Kannada)", speechLang: "kn-IN", translateLang: "Kannada" },
];

const ALLOWED_NAMES = ["Shobha", "Pavan", "Kiran", "Swetha", "Raushan"];

export default function NameAuthModal({ isOpen, onAuthenticated }: NameAuthModalProps) {
  const [userName, setUserName] = useState("");
  const [voiceLang, setVoiceLang] = useState("none"); // Default to "No Sound"
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!userName.trim()) {
      setError("Please enter your name.");
      return;
    }

    const normalizedUserName = userName.trim();
    const isAllowed = ALLOWED_NAMES.some(
      (allowedName) => allowedName.toLowerCase() === normalizedUserName.toLowerCase()
    );

    if (isAllowed) {
      const selectedLanguageDetails = languageOptions.find(lang => lang.value === voiceLang);

      localStorage.setItem("cookingUserName", normalizedUserName);
      localStorage.setItem("cookingVoiceLang", voiceLang);
      localStorage.setItem("cookingSpeechLangCode", selectedLanguageDetails?.speechLang || "");
      localStorage.setItem("cookingTranslateLangName", selectedLanguageDetails?.translateLang || "");
      localStorage.setItem("swargRecipeUserAuthenticated", "true");
      
      toast({
        title: "Welcome!",
        description: `Hello ${normalizedUserName}, you can now access Swarg Recipes.`,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      onAuthenticated();
    } else {
      setError("Access denied. Please enter a valid name.");
      toast({
        title: "Authentication Failed",
        description: "The name entered is not authorized for access.",
        variant: "destructive",
        icon: <ShieldAlert className="h-5 w-5 text-destructive" />,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { /* Modal should not be dismissible by user interaction */ }}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center">
            <User className="mr-2 h-6 w-6" /> Welcome to Swarg Recipes
          </DialogTitle>
          <DialogDescription>
            Please enter your name and preferred language to continue.
            Access is restricted.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="userName" className="flex items-center gap-1.5">
              <User size={16} /> Your Name
            </Label>
            <Input
              id="userName"
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              className={error ? "border-destructive ring-destructive" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="voiceLang" className="flex items-center gap-1.5">
              <Languages size={16} /> Voice Instruction Language
            </Label>
            <Select value={voiceLang} onValueChange={setVoiceLang}>
              <SelectTrigger id="voiceLang">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm font-medium text-destructive flex items-center gap-1"><ShieldAlert size={14} /> {error}</p>}
          <DialogFooter>
            <Button type="submit" className="w-full">
              Verify Access
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
