"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import DrcSidebar from "../../../components/DrcSidebar";
import DrcHeader from "../../../components/DrcHeader";
import CvpStatusBadge from "../../../components/CvpStatusBadge";
import LevelProgress, { InlineLevel, LevelUpAnimation } from "../../../components/LevelProgress";
import {
  ArrowLeft,
  Send,
  Link as LinkIcon,
  Plus,
  Trash2,
  Users,
  Box,
  Layers,
  Settings,
  Shield,
  Sparkles,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
} from "lucide-react";

export default function AssetDetail() {
  const { uuid } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddXpModal, setShowAddXpModal] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const queryClient = useQueryClient();

  // Fetch asset data
  const { data: asset, isLoading, error } = useQuery({
    queryKey: ["asset", uuid],
    queryFn: async () => {
      const response = await fetch(`/api/assets/${uuid}`);
      if (!response.ok) throw new Error("Failed to fetch asset");
      return response.json();
    },
    enabled: !!uuid,
  });

  // Fetch CVP status (mocked for now)
  const { data: cvpStatus } = useQuery({
    queryKey: ["cvp-status", uuid],
    queryFn: async () => {
      // This would call the actual CVP API
      return {
        isProtected: true,
        currentEpoch: 42,
        lastMutationAt: Date.now() - 3600000,
        proofSystem: "translation_validation",
        recentThreats: [],
      };
    },
    enabled: !!uuid,
  });

  // Add XP mutation
  const addXpMutation = useMutation({
    mutationFn: async ({ amount, reason }) => {
      const response = await fetch(`/api/assets/${uuid}/xp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reason }),
      });
      if (!response.ok) throw new Error("Failed to add XP");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["asset", uuid] });
      if (data.leveledUp) {
        setNewLevel(data.newLevel);
        setShowLevelUp(true);
      }
      setShowAddXpModal(false);
    },
  });

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async ({ to, memo }) => {
      const response = await fetch(`/api/assets/${uuid}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, memo }),
      });
      if (!response.ok) throw new Error("Failed to transfer");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", uuid] });
      setShowTransferModal(false);
    },
  });

  // Set soulbound mutation
  const setSoulboundMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/assets/${uuid}/soulbound`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to set soulbound");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", uuid] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F3F3F3] dark:bg-[#0A0A0A]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F3F3F3] dark:bg-[#0A0A0A]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Asset Not Found</h2>
          <p className="text-black/60 dark:text-white/60">The requested asset could not be found.</p>
          <a href="/explorer" className="mt-4 inline-block text-purple-500 hover:underline">
            Back to Explorer
          </a>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Box },
    { id: "resources", label: "Resources", icon: Layers },
    { id: "equipment", label: "Equipment", icon: Settings },
    { id: "delegations", label: "Delegations", icon: Users },
    { id: "security", label: "Security", icon: Shield },
  ];

  const primaryImage = asset.resources?.find(r => r.resource_type === "Image")?.uri;

  return (
    <div className="flex h-screen bg-[#F3F3F3] dark:bg-[#0A0A0A]">
      {/* Level Up Animation */}
      <LevelUpAnimation
        show={showLevelUp}
        newLevel={newLevel}
        onComplete={() => setShowLevelUp(false)}
      />

      {/* Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300`}>
        <DrcSidebar onClose={() => setSidebarOpen(false)} activePage="Explorer" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <DrcHeader onMenuClick={() => setSidebarOpen(true)} title="Asset Details" />

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Back Button */}
          <a
            href="/explorer"
            className="inline-flex items-center gap-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Explorer</span>
          </a>

          {/* Asset Header */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Image */}
              <div className="w-full lg:w-64 h-64 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center overflow-hidden">
                {primaryImage ? (
                  <img src={primaryImage} alt={asset.name} className="w-full h-full object-cover" />
                ) : (
                  <Box className="w-16 h-16 text-purple-500/50" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold text-black dark:text-white">{asset.name}</h1>
                      {asset.is_soulbound && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Lock size={10} />
                          Soulbound
                        </span>
                      )}
                    </div>
                    <p className="text-black/60 dark:text-white/60 mb-4">{asset.description || "No description"}</p>

                    {/* UUID */}
                    <div className="flex items-center gap-2 text-sm text-black/40 dark:text-white/40">
                      <code className="px-2 py-1 bg-[#F9FAFB] dark:bg-[#262626] rounded font-mono text-xs">
                        {uuid?.slice(0, 16)}...{uuid?.slice(-8)}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(uuid)}
                        className="p-1 hover:bg-[#F9FAFB] dark:hover:bg-[#262626] rounded"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  {/* CVP Badge */}
                  <CvpStatusBadge status={cvpStatus} compact />
                </div>

                {/* Level Progress */}
                <LevelProgress xp={asset.xp || 0} showDetails />

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {!asset.is_soulbound && (
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <Send size={16} />
                      Transfer
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddXpModal(true)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Sparkles size={16} />
                    Add XP
                  </button>
                  {!asset.is_soulbound && (
                    <button
                      onClick={() => {
                        if (confirm("Make this NFT soulbound? This action is irreversible.")) {
                          setSoulboundMutation.mutate();
                        }
                      }}
                      className="px-4 py-2 rounded-lg border border-[#E6E6E6] dark:border-[#333333] text-black dark:text-white text-sm font-semibold hover:bg-[#F9FAFB] dark:hover:bg-[#262626] transition-colors flex items-center gap-2"
                    >
                      <Lock size={16} />
                      Make Soulbound
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white"
                    : "bg-white dark:bg-[#1E1E1E] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white border border-[#E6E6E6] dark:border-[#333333]"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
            {activeTab === "overview" && (
              <OverviewTab asset={asset} />
            )}
            {activeTab === "resources" && (
              <ResourcesTab resources={asset.resources} nftId={uuid} />
            )}
            {activeTab === "equipment" && (
              <EquipmentTab slots={asset.equipment_slots} childrenCount={asset.children_count} nftId={uuid} />
            )}
            {activeTab === "delegations" && (
              <DelegationsTab delegations={asset.delegations} nftId={uuid} />
            )}
            {activeTab === "security" && (
              <SecurityTab cvpStatus={cvpStatus} nftId={uuid} />
            )}
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <TransferModal
          onClose={() => setShowTransferModal(false)}
          onTransfer={(to, memo) => transferMutation.mutate({ to, memo })}
          loading={transferMutation.isPending}
        />
      )}

      {/* Add XP Modal */}
      {showAddXpModal && (
        <AddXpModal
          onClose={() => setShowAddXpModal(false)}
          onAddXp={(amount, reason) => addXpMutation.mutate({ amount, reason })}
          loading={addXpMutation.isPending}
        />
      )}
    </div>
  );
}

// Tab Components

function OverviewTab({ asset }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-black dark:text-white">Asset Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoRow label="Owner" value={asset.owner_account} copyable />
        <InfoRow label="Creator" value={asset.creator_account} copyable />
        <InfoRow label="Class ID" value={asset.class_id} />
        <InfoRow label="Created" value={new Date(asset.created_at).toLocaleDateString()} />
        <InfoRow label="Total XP" value={`${(asset.xp || 0).toLocaleString()} XP`} />
        <InfoRow label="Status" value={asset.is_soulbound ? "Soulbound" : "Transferable"} />
      </div>

      {/* Custom State */}
      {asset.custom_state && Object.keys(asset.custom_state).length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-black dark:text-white mb-3">Custom State</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {asset.custom_state.map((state) => (
              <div key={state.state_key} className="p-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626]">
                <div className="text-xs text-black/40 dark:text-white/40">{state.state_key}</div>
                <div className="text-sm font-medium text-black dark:text-white">{state.state_value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResourcesTab({ resources, nftId }) {
  if (!resources || resources.length === 0) {
    return (
      <div className="text-center py-8 text-black/40 dark:text-white/40">
        <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No resources attached</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-black dark:text-white">Attached Resources ({resources.length})</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((resource) => (
          <div key={resource.id} className="p-4 rounded-lg border border-[#E6E6E6] dark:border-[#333333]">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                {resource.resource_type}
              </span>
              <span className="text-xs text-black/40 dark:text-white/40">Priority: {resource.priority}</span>
            </div>
            <a
              href={resource.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-500 hover:underline flex items-center gap-1 truncate"
            >
              {resource.uri}
              <ExternalLink size={12} />
            </a>
            {resource.context_tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {resource.context_tags.map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 rounded text-xs bg-[#F9FAFB] dark:bg-[#262626] text-black/60 dark:text-white/60">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EquipmentTab({ slots, childrenCount, nftId }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Equipment Slots</h3>
        {!slots || slots.length === 0 ? (
          <div className="text-center py-8 text-black/40 dark:text-white/40">
            <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No equipment slots defined</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {slots.map((slot) => (
              <div
                key={slot.slot_name}
                className={`p-4 rounded-lg border-2 border-dashed ${
                  slot.equipped_child_uuid
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-[#E6E6E6] dark:border-[#333333]"
                }`}
              >
                <div className="text-sm font-semibold text-black dark:text-white">{slot.slot_name}</div>
                {slot.required_trait && (
                  <div className="text-xs text-black/40 dark:text-white/40 mt-1">Requires: {slot.required_trait}</div>
                )}
                {slot.equipped_child_uuid ? (
                  <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                    Equipped
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-black/40 dark:text-white/40">Empty</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Nested Children</h3>
        <p className="text-black/60 dark:text-white/60">
          {childrenCount || 0} NFT(s) nested inside this asset
        </p>
      </div>
    </div>
  );
}

function DelegationsTab({ delegations, nftId }) {
  if (!delegations || delegations.length === 0) {
    return (
      <div className="text-center py-8 text-black/40 dark:text-white/40">
        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No active delegations</p>
        <button className="mt-4 px-4 py-2 rounded-lg border border-purple-500 text-purple-500 text-sm font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20">
          Create Delegation
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-black dark:text-white">Active Delegations</h3>
      {/* Delegation list would go here */}
    </div>
  );
}

function SecurityTab({ cvpStatus, nftId }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-black dark:text-white">CVP Security</h3>
      
      <CvpStatusBadge status={cvpStatus} />

      <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
        <h4 className="font-semibold text-black dark:text-white mb-2">What is CVP?</h4>
        <p className="text-sm text-black/60 dark:text-white/60">
          Consensus-Verified Polymorphism (CVP) automatically mutates your NFT's bytecode 
          each epoch while cryptographically proving semantic equivalence. This creates a 
          "moving target" that makes static analysis attacks virtually impossible.
        </p>
        <ul className="mt-3 text-sm text-black/60 dark:text-white/60 space-y-1">
          <li className="flex items-center gap-2">
            <Shield className="text-green-500" size={14} />
            12 attack detection patterns active
          </li>
          <li className="flex items-center gap-2">
            <Shield className="text-green-500" size={14} />
            Automatic emergency mutations on threats
          </li>
          <li className="flex items-center gap-2">
            <Shield className="text-green-500" size={14} />
            ZK proofs verify all transformations
          </li>
        </ul>
      </div>
    </div>
  );
}

// Helper Components

function InfoRow({ label, value, copyable }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626]">
      <span className="text-sm text-black/60 dark:text-white/60">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-black dark:text-white truncate max-w-32">
          {value}
        </span>
        {copyable && (
          <button
            onClick={() => navigator.clipboard.writeText(value)}
            className="p-1 hover:bg-white dark:hover:bg-[#333333] rounded"
          >
            <Copy size={12} className="text-black/40 dark:text-white/40" />
          </button>
        )}
      </div>
    </div>
  );
}

function TransferModal({ onClose, onTransfer, loading }) {
  const [to, setTo] = useState("");
  const [memo, setMemo] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-black dark:text-white mb-4">Transfer NFT</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Recipient Address *
            </label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] text-black dark:text-white"
              placeholder="0x..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Memo (optional)
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] text-black dark:text-white"
              placeholder="Add a note..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-[#E6E6E6] dark:border-[#333333] text-black dark:text-white font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => onTransfer(to, memo)}
            disabled={!to || loading}
            className="flex-1 px-4 py-3 rounded-lg bg-purple-600 text-white font-semibold disabled:opacity-50"
          >
            {loading ? "Transferring..." : "Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddXpModal({ onClose, onAddXp, loading }) {
  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-black dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="text-amber-500" />
          Add Experience
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              XP Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              min={1}
              className="w-full px-4 py-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] text-black dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Reason (optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] text-black dark:text-white"
              placeholder="Quest completed, achievement, etc."
            />
          </div>

          {/* Quick buttons */}
          <div className="flex gap-2">
            {[50, 100, 250, 500, 1000].map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  amount === val
                    ? "bg-amber-500 text-white"
                    : "bg-[#F9FAFB] dark:bg-[#262626] text-black dark:text-white"
                }`}
              >
                +{val}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-[#E6E6E6] dark:border-[#333333] text-black dark:text-white font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => onAddXp(amount, reason)}
            disabled={amount <= 0 || loading}
            className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold disabled:opacity-50"
          >
            {loading ? "Adding..." : `Add ${amount} XP`}
          </button>
        </div>
      </div>
    </div>
  );
}
