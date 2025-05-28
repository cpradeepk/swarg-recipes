
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Languages, PlayCircle, VolumeX } from "lucide-react";

interface RecipeStartCookingFormProps {
  recipeId: string;
}

const languageOptions = [
  { value: "none", label: "🔇 No Sound (Text Only)", speechLang: "", translateLang: "" },
  { value: "en", label: "🇬🇧 English", speechLang: "en-US", translateLang: "English" },
  { value: "hi", label: "🇮🇳 हिंदी (Hindi)", speechLang: "hi-IN", translateLang: "Hindi" },
  { value: "kn", label: "🇮🇳 ಕನ್ನಡ (Kannada)", speechLang: "kn-IN", translateLang: "Kannada" },
];

export default function RecipeStartCookingForm({ recipeId }: RecipeStartCookingFormProps) {
  const [userName, setUserName] = useState("");
  const [voiceLang, setVoiceLang] = useState("none"); // Default to "No Sound"
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      // Basic validation, could add toast here
      alert("Please enter your name.");
      return;
    }

    const selectedLanguageDetails = languageOptions.find(lang => lang.value === voiceLang);

    localStorage.setItem("cookingUserName", userName.trim());
    localStorage.setItem("cookingVoiceLang", voiceLang);
    localStorage.setItem("cookingSpeechLangCode", selectedLanguageDetails?.speechLang || "");
    localStorage.setItem("cookingTranslateLangName", selectedLanguageDetails?.translateLang || "");

    router.push(`/recipes/${recipeId}/cook`);
  };

  return (
    <Card className="bg-secondary/30 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
          <PlayCircle size={24} /> Ready to Cook?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
          <Button type="submit" size="lg" className="w-full md:w-auto text-lg py-6">
            Start Cooking
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

