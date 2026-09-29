"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import DrcSidebar from "../../components/DrcSidebar";
import DrcHeader from "../../components/DrcHeader";
import { Plus, X, Image, Box, Music, Check } from "lucide-react";

export default function CreateAsset() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    creator_account: "0xCreator",
    owner_account: "0xCreator",
    class_id: 1,
    resources: [],
    equipment_slots: [],
    custom_state: {},
  });

  const [newResource, setNewResource] = useState({
    resource_type: "Image",
    uri: "",
    priority: 10,
    context_tags: [],
  });

  const [newSlot, setNewSlot] = useState({
    slot_name: "",
    required_trait: "",
  });

  const [newState, setNewState] = useState({ key: "", value: "" });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const uuid =
        "0x" +
        Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join("");
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, uuid }),
      });
      if (!response.ok) throw new Error("Failed to create asset");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      if (typeof window !== "undefined") window.location.href = "/explorer";
    },
  });

  const addResource = () => {
    if (newResource.uri) {
      setFormData({
        ...formData,
        resources: [...formData.resources, { ...newResource }],
      });
      setNewResource({
        resource_type: "Image",
        uri: "",
        priority: 10,
        context_tags: [],
      });
    }
  };

  const addSlot = () => {
    if (newSlot.slot_name) {
      setFormData({
        ...formData,
        equipment_slots: [...formData.equipment_slots, { ...newSlot }],
      });
      setNewSlot({ slot_name: "", required_trait: "" });
    }
  };

  const addState = () => {
    if (newState.key && newState.value) {
      setFormData({
        ...formData,
        custom_state: {
          ...formData.custom_state,
          [newState.key]: newState.value,
        },
      });
      setNewState({ key: "", value: "" });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const steps = [
    { num: 1, label: "Basic Info" },
    { num: 2, label: "Resources" },
    { num: 3, label: "Equipment" },
    { num: 4, label: "State" },
  ];

  return (
    <div className="flex h-screen bg-[#F3F3F3] dark:bg-[#0A0A0A]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <DrcSidebar
          onClose={() => setSidebarOpen(false)}
          activePage="Create Asset"
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <DrcHeader
          onMenuClick={() => setSidebarOpen(true)}
          title="Create Asset"
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                {steps.map((step, index) => (
                  <div key={step.num} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep >= step.num ? "bg-purple-600 text-white" : "bg-[#F9FAFB] dark:bg-[#262626] text-black/40 dark:text-white/40"}`}
                      >
                        {currentStep > step.num ? (
                          <Check size={20} />
                        ) : (
                          step.num
                        )}
                      </div>
                      <span className="text-xs mt-2 font-inter text-black/60 dark:text-white/60">
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 ${currentStep > step.num ? "bg-purple-600" : "bg-[#E6E6E6] dark:bg-[#333333]"}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-black dark:text-white font-sora mb-6">
                      Basic Information
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-2 font-inter">
                        Asset Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] text-black dark:text-white font-inter focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                        placeholder="Cyber Samurai #001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-2 font-inter">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] text-black dark:text-white font-inter focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                        placeholder="A legendary warrior from the digital realm..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-2 font-inter">
                        Class ID
                      </label>
                      <input
                        type="number"
                        value={formData.class_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            class_id: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] text-black dark:text-white font-inter focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-black dark:text-white font-sora mb-6">
                      Multi-Resource Setup
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-black dark:text-white mb-2 font-inter">
                          Resource Type
                        </label>
                        <select
                          value={newResource.resource_type}
                          onChange={(e) =>
                            setNewResource({
                              ...newResource,
                              resource_type: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] text-black dark:text-white font-inter focus:border-purple-500 focus:outline-none"
                        >
                          <option value="Image">Image</option>
                          <option value="3D_Model">3D Model</option>
                          <option value="VR_Model">VR Model</option>
                          <option value="Sound">Sound</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black dark:text-white mb-2 font-inter">
                          Priority
                        </label>
                        <input
                          type="number"
                          value={newResource.priority}
                          onChange={(e) =>
                            setNewResource({
                              ...newResource,
                              priority: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-4 py-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] text-black dark:text-white font-inter focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-2 font-inter">
                        URI
                      </label>
                      <input
                        type="text"
                        value={newResource.uri}
                        onChange={(e) =>
                          setNewResource({
                            ...newResource,
                            uri: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] text-black dark:text-white font-inter focus:border-purple-500 focus:outline-none"
                        placeholder="https://... or ipfs://..."
                      />
                    </div>

                    <button
                      type="button"
                      onClick={addResource}
                      className="w-full py-3 px-4 rounded-lg border-2 border-dashed border-purple-400 dark:border-purple-600 text-purple-600 dark:text-purple-400 font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-150 font-inter flex items-center justify-center gap-2"
                    >
                      <Plus size={20} />
                      Add Resource
                    </button>

                    {formData.resources.length > 0 && (
                      <div className="space-y-2 mt-4">
                        {formData.resources.map((res, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-[#F9FAFB] dark:bg-[#262626] rounded-lg"
                          >
                            <span className="font-inter text-sm text-black dark:text-white">
                              {res.resource_type} - Priority {res.priority}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  resources: formData.resources.filter(
                                    (_, i) => i !== idx,
                                  ),
                                })
                              }
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-black dark:text-white font-sora mb-6">
                      Equipment Slots
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-black dark:text-white mb-2 font-inter">
                          Slot Name
                        </label>
                        <input
                          type="text"
                          value={newSlot.slot_name}
                          onChange={(e) =>
                            setNewSlot({
                              ...newSlot,
                              slot_name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] text-black dark:text-white font-inter focus:border-purple-500 focus:outline-none"
                          placeholder="RightHand, LeftHand, etc."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black dark:text-white mb-2 font-inter">
                          Required Trait
                        </label>
                        <input
                          type="text"
                          value={newSlot.required_trait}
                          onChange={(e) =>
                            setNewSlot({
                              ...newSlot,
                              required_trait: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] text-black dark:text-white font-inter focus:border-purple-500 focus:outline-none"
                          placeholder="WEAPON_CLASS, SHIELD_CLASS, etc."
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={addSlot}
                      className="w-full py-3 px-4 rounded-lg border-2 border-dashed border-purple-400 dark:border-purple-600 text-purple-600 dark:text-purple-400 font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-150 font-inter flex items-center justify-center gap-2"
                    >
                      <Plus size={20} />
                      Add Equipment Slot
                    </button>

                    {formData.equipment_slots.length > 0 && (
                      <div className="space-y-2 mt-4">
                        {formData.equipment_slots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-[#F9FAFB] dark:bg-[#262626] rounded-lg"
                          >
                            <span className="font-inter text-sm text-black dark:text-white">
                              {slot.slot_name}{" "}
                              {slot.required_trait &&
                                `(${slot.required_trait})`}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  equipment_slots:
                                    formData.equipment_slots.filter(
                                      (_, i) => i !== idx,
                                    ),
                                })
                              }
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-black dark:text-white font-sora mb-6">
                      Custom State
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-black dark:text-white mb-2 font-inter">
                          State Key
                        </label>
                        <input
                          type="text"
                          value={newState.key}
                          onChange={(e) =>
                            setNewState({ ...newState, key: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] text-black dark:text-white font-inter focus:border-purple-500 focus:outline-none"
                          placeholder="faction, element, etc."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black dark:text-white mb-2 font-inter">
                          State Value
                        </label>
                        <input
                          type="text"
                          value={newState.value}
                          onChange={(e) =>
                            setNewState({ ...newState, value: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] text-black dark:text-white font-inter focus:border-purple-500 focus:outline-none"
                          placeholder="Neon Ronin, fire, etc."
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={addState}
                      className="w-full py-3 px-4 rounded-lg border-2 border-dashed border-purple-400 dark:border-purple-600 text-purple-600 dark:text-purple-400 font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-150 font-inter flex items-center justify-center gap-2"
                    >
                      <Plus size={20} />
                      Add Custom State
                    </button>

                    {Object.keys(formData.custom_state).length > 0 && (
                      <div className="space-y-2 mt-4">
                        {Object.entries(formData.custom_state).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between p-3 bg-[#F9FAFB] dark:bg-[#262626] rounded-lg"
                            >
                              <span className="font-inter text-sm text-black dark:text-white">
                                {key}: {value}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newCustomState = {
                                    ...formData.custom_state,
                                  };
                                  delete newCustomState[key];
                                  setFormData({
                                    ...formData,
                                    custom_state: newCustomState,
                                  });
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E6E6E6] dark:border-[#333333]">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="px-6 py-3 rounded-lg border border-[#E6E6E6] dark:border-[#333333] text-black dark:text-white font-semibold hover:bg-[#F9FAFB] dark:hover:bg-[#262626] transition-all duration-150 font-inter"
                    >
                      Previous
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all duration-150 font-inter"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="px-6 py-3 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 text-white font-semibold hover:shadow-lg transition-all duration-150 font-inter disabled:opacity-50"
                    >
                      {createMutation.isPending
                        ? "Creating..."
                        : "Create Asset"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
