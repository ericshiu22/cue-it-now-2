import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Eye, EyeOff, Plus, Trash2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SERVICE_LIST, getService } from "@/lib/streaming-services";

interface ServiceCredential {
  id: string;
  service_name: string;
  username: string | null;
  password: string | null;
  notes: string | null;
}

const PasswordManager = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<ServiceCredential[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("service_credentials")
        .select("*")
        .order("created_at", { ascending: true }) as any;
      if (data) setCredentials(data);
    };
    fetch();
  }, [user]);

  const addCredential = async () => {
    if (!user || !newService) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("service_credentials")
      .insert({
        user_id: user.id,
        service_name: newService,
        username: newUsername || null,
        password: newPassword || null,
        notes: newNotes || null,
      })
      .select()
      .single() as any;
    setSaving(false);
    if (error) {
      if (error.code === "23505") toast.error("Credentials for this service already exist.");
      else toast.error("Failed to save credentials.");
      return;
    }
    setCredentials((prev) => [...prev, data]);
    setNewService("");
    setNewUsername("");
    setNewPassword("");
    setNewNotes("");
    setShowAddForm(false);
    toast.success("Credentials saved.");
  };

  const removeCredential = async (id: string) => {
    const { error } = await supabase.from("service_credentials").delete().eq("id", id) as any;
    if (error) {
      toast.error("Failed to remove credentials.");
      return;
    }
    setCredentials((prev) => prev.filter((c) => c.id !== id));
    toast.success("Credentials removed.");
  };

  const togglePassword = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy.");
    }
  };

  const availableServices = SERVICE_LIST.filter(
    (s) => !credentials.some((c) => c.service_name.toLowerCase() === s.id.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass rounded-2xl p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <KeyRound className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Password Manager</h2>
          <span className="text-[11px] text-muted-foreground">
            {credentials.length} saved
          </span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="h-7 w-7 rounded-md bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors"
        >
          <Plus
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showAddForm ? "rotate-45" : ""}`}
          />
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-2">
              <select
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                className="w-full rounded-md bg-background border border-border px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select a service…</option>
                {availableServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.logo} {s.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Email / Username"
                className="w-full rounded-md bg-background border border-border px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-md bg-background border border-border px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="w-full rounded-md bg-background border border-border px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={addCredential}
                disabled={!newService || saving}
                className="w-full px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save Credentials"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {credentials.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          No saved logins yet. Tap + to add.
        </p>
      ) : (
        <div className="max-h-[400px] overflow-y-auto divide-y divide-border/30">
          {credentials.map((cred, i) => {
            const svc = getService(cred.service_name);
            const isVisible = visiblePasswords.has(cred.id);
            return (
              <motion.div
                key={cred.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 px-3 py-3 hover:bg-secondary/40 transition-colors rounded-lg"
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-secondary/60 shrink-0 mt-0.5">
                  <span className="text-base">{svc?.logo || "🔑"}</span>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs font-semibold text-foreground">
                    {svc?.name || cred.service_name}
                  </p>
                  {cred.username && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground truncate">
                        {cred.username}
                      </span>
                      <button
                        onClick={() => copyToClipboard(cred.username!, `user-${cred.id}`)}
                        className="shrink-0 h-5 w-5 rounded flex items-center justify-center hover:bg-secondary/60 transition-colors"
                        title="Copy username"
                      >
                        {copiedId === `user-${cred.id}` ? (
                          <Check className="h-3 w-3 text-primary" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  )}
                  {cred.password && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {isVisible ? cred.password : "••••••••"}
                      </span>
                      <button
                        onClick={() => togglePassword(cred.id)}
                        className="shrink-0 h-5 w-5 rounded flex items-center justify-center hover:bg-secondary/60 transition-colors"
                        title={isVisible ? "Hide" : "Show"}
                      >
                        {isVisible ? (
                          <EyeOff className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Eye className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(cred.password!, `pass-${cred.id}`)}
                        className="shrink-0 h-5 w-5 rounded flex items-center justify-center hover:bg-secondary/60 transition-colors"
                        title="Copy password"
                      >
                        {copiedId === `pass-${cred.id}` ? (
                          <Check className="h-3 w-3 text-primary" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  )}
                  {cred.notes && (
                    <p className="text-[10px] text-muted-foreground/70 truncate">
                      {cred.notes}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeCredential(cred.id)}
                  className="shrink-0 h-7 w-7 rounded-md hover:bg-destructive/10 flex items-center justify-center transition-colors mt-0.5"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default PasswordManager;
