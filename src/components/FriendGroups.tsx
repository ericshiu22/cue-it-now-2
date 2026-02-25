import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Plus, X, Check, Pencil, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Profile {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface FriendGroup {
  id: string;
  name: string;
  color: string;
  memberIds: string[];
}

const GROUP_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6",
];

const displayName = (p: Profile) => p.username || p.email || "Unknown";
const displayInitial = (p: Profile) => (p.username || p.email || "?")[0].toUpperCase();

interface FriendGroupsProps {
  userId: string;
  friends: { profile: Profile }[];
  onFilterChange: (groupId: string | null) => void;
  activeGroupFilter: string | null;
}

const FriendGroups = ({ userId, friends, onFilterChange, activeGroupFilter }: FriendGroupsProps) => {
  const { toast } = useToast();
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FriendGroup | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupColor, setGroupColor] = useState(GROUP_COLORS[0]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const fetchGroups = async () => {
    const { data: groupsData } = await supabase
      .from("friend_groups")
      .select("id, name, color")
      .eq("user_id", userId);

    if (!groupsData) { setLoading(false); return; }

    const { data: membersData } = await supabase
      .from("friend_group_members")
      .select("group_id, friend_user_id")
      .in("group_id", groupsData.map((g) => g.id));

    const mapped: FriendGroup[] = groupsData.map((g) => ({
      ...g,
      memberIds: (membersData || []).filter((m) => m.group_id === g.id).map((m) => m.friend_user_id),
    }));

    setGroups(mapped);
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, [userId]);

  const openCreate = () => {
    setEditingGroup(null);
    setGroupName("");
    setGroupColor(GROUP_COLORS[0]);
    setSelectedMembers([]);
    setDialogOpen(true);
  };

  const openEdit = (group: FriendGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupColor(group.color);
    setSelectedMembers(group.memberIds);
    setDialogOpen(true);
  };

  const toggleMember = (uid: string) => {
    setSelectedMembers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSave = async () => {
    if (!groupName.trim()) return;

    if (editingGroup) {
      // Update group
      await supabase
        .from("friend_groups")
        .update({ name: groupName.trim(), color: groupColor })
        .eq("id", editingGroup.id);

      // Sync members: delete all, re-insert
      await supabase.from("friend_group_members").delete().eq("group_id", editingGroup.id);
      if (selectedMembers.length > 0) {
        await supabase.from("friend_group_members").insert(
          selectedMembers.map((uid) => ({ group_id: editingGroup.id, friend_user_id: uid }))
        );
      }
      toast({ title: "Group updated" });
    } else {
      // Create group
      const { data: newGroup } = await supabase
        .from("friend_groups")
        .insert({ user_id: userId, name: groupName.trim(), color: groupColor })
        .select("id")
        .single();

      if (newGroup && selectedMembers.length > 0) {
        await supabase.from("friend_group_members").insert(
          selectedMembers.map((uid) => ({ group_id: newGroup.id, friend_user_id: uid }))
        );
      }
      toast({ title: "Group created" });
    }

    setDialogOpen(false);
    fetchGroups();
  };

  const handleDelete = async (groupId: string) => {
    await supabase.from("friend_groups").delete().eq("id", groupId);
    if (activeGroupFilter === groupId) onFilterChange(null);
    toast({ title: "Group deleted" });
    fetchGroups();
  };

  if (loading) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Groups</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* "All" chip */}
        <button
          onClick={() => onFilterChange(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeGroupFilter === null
              ? "bg-primary text-primary-foreground shadow-md"
              : "glass text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-3 w-3" /> All
        </button>

        {/* Group chips */}
        {groups.map((group) => (
          <div key={group.id} className="flex items-center gap-0">
            <button
              onClick={() => onFilterChange(activeGroupFilter === group.id ? null : group.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg text-xs font-medium transition-all ${
                activeGroupFilter === group.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
              {group.name}
              <span className="text-[10px] opacity-60">({group.memberIds.length})</span>
            </button>
            <button
              onClick={() => openEdit(group)}
              className={`px-1.5 py-1.5 rounded-r-lg text-xs transition-all ${
                activeGroupFilter === group.id
                  ? "bg-primary text-primary-foreground"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
              title="Edit group"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Create button */}
        <button
          onClick={openCreate}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg glass text-muted-foreground hover:text-foreground text-xs font-medium transition-all hover:border-primary/50"
        >
          <Plus className="h-3 w-3" /> New Group
        </button>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingGroup ? "Edit Group" : "Create Group"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingGroup ? "Update your group label and members." : "Name your group and add friends to it."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Group Name</label>
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Movie Buddies, Family"
                className="w-full px-3 py-2 glass rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30 text-sm"
                autoFocus
              />
            </div>

            {/* Color */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Color</label>
              <div className="flex gap-2">
                {GROUP_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setGroupColor(c)}
                    className={`h-7 w-7 rounded-full transition-all ${
                      groupColor === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-card scale-110" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Members */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Friends ({selectedMembers.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1 glass rounded-lg p-2">
                {friends.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">No friends to add yet.</p>
                ) : (
                  friends.map((f) => {
                    const selected = selectedMembers.includes(f.profile.user_id);
                    return (
                      <button
                        key={f.profile.user_id}
                        onClick={() => toggleMember(f.profile.user_id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all text-sm ${
                          selected
                            ? "bg-primary/15 text-foreground"
                            : "hover:bg-secondary/50 text-muted-foreground"
                        }`}
                      >
                        <div className="h-7 w-7 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                          {displayInitial(f.profile)}
                        </div>
                        <span className="flex-1 truncate">{displayName(f.profile)}</span>
                        {selected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={!groupName.trim()}
                className="flex-1 py-2 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {editingGroup ? "Save Changes" : "Create Group"}
              </button>
              {editingGroup && (
                <button
                  onClick={() => { handleDelete(editingGroup.id); setDialogOpen(false); }}
                  className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete group"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FriendGroups;
