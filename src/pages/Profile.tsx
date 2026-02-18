import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await (supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .single() as any);
      if (data) setUsername(data.username || "");
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  if (!user) { navigate("/auth"); return null; }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-foreground">
          <span className="text-gradient">Profile</span> Settings
        </h1>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Account info */}
            <section className="glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-brand">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Account</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              {username && (
                <p className="text-sm text-muted-foreground">Username: <span className="text-foreground font-medium">{username}</span></p>
              )}
            </section>

            {/* Link to Subscription Hub */}
            <section className="glass rounded-2xl p-6">
              <Link
                to="/subscriptions"
                className="flex items-center justify-between group"
              >
                <div>
                  <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">Subscription Hub</h2>
                  <p className="text-sm text-muted-foreground">Manage services, alerts, and view savings.</p>
                </div>
                <span className="text-primary text-sm font-semibold">Go →</span>
              </Link>
            </section>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Profile;
