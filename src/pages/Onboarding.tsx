import { useNavigate } from "react-router-dom";
import OnboardingFlow, { OnboardingData } from "@/components/OnboardingFlow";

export default function Onboarding() {
  const navigate = useNavigate();

  const handleComplete = (data: OnboardingData) => {
    localStorage.setItem("cue-onboarding-habits", JSON.stringify(data.habits));
    localStorage.setItem("cue-onboarding-search-time", String(data.searchTime));
    localStorage.setItem("cue-onboarding-friend-suggestions", String(data.friendSuggestions));
    localStorage.setItem("cue-onboarding-services", JSON.stringify(data.selectedServices));
    localStorage.setItem("cue-onboarding-guessed-spend", String(data.guessedSpend));
    localStorage.setItem("cue-onboarding-real-cost", String(data.realCost));
    localStorage.setItem("cue-onboarding-genres", JSON.stringify(data.genres));
    localStorage.setItem("cue-onboarding-seen-shows", JSON.stringify(data.seenShows));
    localStorage.setItem("cue-onboarding-want-to-watch", JSON.stringify(data.wantToWatch));
    localStorage.setItem("cue-onboarding-done", "true");
    navigate("/auth");
  };

  return <OnboardingFlow onComplete={handleComplete} />;
}
