import { Users, Search, Share2, Clock } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

const HABIT_OPTIONS = [
  { id: "friends", label: "Friend suggestions", icon: Users },
  { id: "search", label: "Search engines", icon: Search },
  { id: "social", label: "Social media", icon: Share2 },
];

interface Props {
  habits: string[];
  searchTime: number;
  friendSuggestions: boolean;
  onToggleHabit: (id: string) => void;
  onSearchTimeChange: (v: number) => void;
  onFriendSuggestionsChange: (v: boolean) => void;
}

export default function StepHabit({
  habits,
  searchTime,
  friendSuggestions,
  onToggleHabit,
  onSearchTimeChange,
  onFriendSuggestionsChange,
}: Props) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          How do you <span className="text-gradient">find shows</span>?
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {HABIT_OPTIONS.map((opt) => {
            const active = habits.includes(opt.id);
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => onToggleHabit(opt.id)}
                className={`glass rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200 ${
                  active
                    ? "ring-2 ring-primary glow"
                    : "hover:ring-1 hover:ring-border"
                }`}
              >
                <Icon
                  className={`h-7 w-7 ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-xs font-medium text-center leading-tight ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            How much time do you waste searching per night?
          </p>
        </div>
        <Slider
          value={[searchTime]}
          onValueChange={([v]) => onSearchTimeChange(v)}
          min={0}
          max={60}
          step={5}
          className="w-full"
        />
        <p className="text-center text-lg font-semibold text-foreground">
          {searchTime}{" "}
          <span className="text-sm text-muted-foreground font-normal">min</span>
        </p>
      </div>

      <div className="glass rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Friend suggestions</p>
          <p className="text-xs text-muted-foreground">
            Do you like getting suggestions from friends?
          </p>
        </div>
        <Switch
          checked={friendSuggestions}
          onCheckedChange={onFriendSuggestionsChange}
        />
      </div>
    </div>
  );
}
