import { useState } from "react";
import { motion } from "framer-motion";
import { Key } from "lucide-react";

interface ApiKeyPromptProps {
  onSubmit: (key: string) => void;
}

const ApiKeyPrompt = ({ onSubmit }: ApiKeyPromptProps) => {
  const [key, setKey] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 max-w-md mx-auto text-center space-y-4"
    >
      <Key className="h-8 w-8 text-primary mx-auto" />
      <h3 className="text-lg font-semibold text-foreground">Enter TMDB API Key</h3>
      <p className="text-sm text-muted-foreground">
        Get a free key at{" "}
        <a
          href="https://www.themoviedb.org/settings/api"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          themoviedb.org
        </a>
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (key.trim()) onSubmit(key.trim());
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          placeholder="Your API key..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="flex-1 bg-secondary rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button
          type="submit"
          disabled={!key.trim()}
          className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40"
        >
          Save
        </button>
      </form>
    </motion.div>
  );
};

export default ApiKeyPrompt;
