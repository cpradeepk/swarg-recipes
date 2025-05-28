
"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Languages, ShieldAlert, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { findOrCreateUserByNameAction } from "@/lib/actions/authActions"; // Import the new action

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
  const [userNameInput, setUserNameInput] = useState("");
  const [voiceLang, setVoiceLang] = useState("none"); 
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsVerifying(true);

    if (!userNameInput.trim()) {
      setError("Please enter your name.");
      setIsVerifying(false);
      return;
    }

    const normalizedUserName = userNameInput.trim();
    const isAllowed = ALLOWED_NAMES.some(
      (allowedName) => allowedName.toLowerCase() === normalizedUserName.toLowerCase()
    );

    if (isAllowed) {
      try {
        const result = await findOrCreateUserByNameAction(normalizedUserName);
        if (result.success && result.userId && result.userName) {
          const selectedLanguageDetails = languageOptions.find(lang => lang.value === voiceLang);

          localStorage.setItem("cookingUserId", result.userId); // Store DB User ID
          localStorage.setItem("cookingUserName", result.userName);
          localStorage.setItem("cookingVoiceLang", voiceLang);
          localStorage.setItem("cookingSpeechLangCode", selectedLanguageDetails?.speechLang || "");
          localStorage.setItem("cookingTranslateLangName", selectedLanguageDetails?.translateLang || "");
          localStorage.setItem("swargRecipeUserAuthenticated", "true");
          
          toast({
            title: "Welcome!",
            description: `Hello ${result.userName}, you can now access Swarg Recipes.`,
            icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          });
          onAuthenticated();
        } else {
          setError(result.error || "Could not verify your access. Please try again.");
          toast({
            title: "Authentication Failed",
            description: result.error || "Failed to setup user. Please try again.",
            variant: "destructive",
            icon: <ShieldAlert className="h-5 w-5 text-destructive" />,
          });
        }
      } catch (e) {
        setError("An unexpected error occurred. Please try again.");
        toast({
            title: "Error",
            description: "An unexpected error occurred during verification.",
            variant: "destructive",
        });
      }
    } else {
      setError("Access denied. Please enter a valid name.");
      toast({
        title: "Authentication Failed",
        description: "The name entered is not authorized for access.",
        variant: "destructive",
        icon: <ShieldAlert className="h-5 w-5 text-destructive" />,
      });
    }
    setIsVerifying(false);
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
              value={userNameInput}
              onChange={(e) => setUserNameInput(e.target.value)}
              required
              className={error ? "border-destructive ring-destructive" : ""}
              disabled={isVerifying}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="voiceLang" className="flex items-center gap-1.5">
              <Languages size={16} /> Voice Instruction Language
            </Label>
            <Select value={voiceLang} onValueChange={setVoiceLang} disabled={isVerifying}>
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
            <Button type="submit" className="w-full" disabled={isVerifying}>
              {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify Access"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
