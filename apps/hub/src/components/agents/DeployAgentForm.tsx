'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createAgent } from '@demiurge/agent-foundry';
import { deployAgent, estimateFee } from '@/lib/transaction-builder';

interface DeployAgentFormProps {
  onSuccess?: (agentDid: string) => void;
  onCancel?: () => void;
}

type AutonomyLevel = 'supervised' | 'bounded' | 'autonomous' | 'sovereign';
type LLMProvider = 'openai' | 'gemini' | 'anthropic' | 'ollama';

export function DeployAgentForm({ onSuccess, onCancel }: DeployAgentFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'config' | 'capabilities' | 'funding' | 'review'>('config');
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [agentDid, setAgentDid] = useState<string | null>(null);
  const [estimatedEnergy, setEstimatedEnergy] = useState(10);

  const [config, setConfig] = useState({
    name: '',
    mission: '',
    autonomyLevel: 'bounded' as AutonomyLevel,
    llmProvider: 'gemini' as LLMProvider,
    apiKey: '',
    capabilities: [] as string[],
    spendingLimit: '100',
  });

  const capabilityOptions = [
    { id: 'read', label: '📖 Read', description: 'Query blockchain data' },
    { id: 'analyze', label: '📊 Analyze', description: 'Analyze patterns and trends' },
    { id: 'trade', label: '💱 Trade', description: 'Execute trades (within limits)' },
    { id: 'transfer', label: '💸 Transfer', description: 'Transfer CGT tokens' },
    { id: 'bounty', label: '🎯 Bounties', description: 'Bid on and complete bounties' },
    { id: 'governance', label: '🏛️ Govern', description: 'Participate in governance' },
  ];

  const toggleCapability = (capId: string) => {
    setConfig({
      ...config,
      capabilities: config.capabilities.includes(capId)
        ? config.capabilities.filter(c => c !== capId)
        : [...config.capabilities, capId],
    });
  };

  const getAutonomyDescription = (level: AutonomyLevel): string => {
    switch (level) {
      case 'supervised': return 'Requires approval for all actions';
      case 'bounded': return 'Pre-approved actions + spending limit';
      case 'autonomous': return 'Full signing authority';
      case 'sovereign': return 'Can spawn sub-agents';
    }
  };

  const getAutonomyColor = (level: AutonomyLevel): string => {
    switch (level) {
      case 'supervised': return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
      case 'bounded': return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400';
      case 'autonomous': return 'border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan';
      case 'sovereign': return 'border-neon-purple/30 bg-neon-purple/10 text-neon-purple';
    }
  };

  const handleDeploy = async () => {
    if (!user) {
      setError('Not authenticated');
      return;
    }

    setDeploying(true);
    setError(null);
    setSuccess(false);

    try {
      // Estimate energy cost
      const fee = await estimateFee({ type: 'agentDeploy', config });
      setEstimatedEnergy(fee.energy);

      // Build agent configuration
      const agentConfig = {
        name: config.name,
        mission: config.mission,
        autonomy: config.autonomyLevel,
        capabilities: config.capabilities,
        spending_limit: config.spendingLimit,
        llm_provider: config.llmProvider,
        controller: user.qor_id,
      };

      // Build, sign, and submit deployment transaction
      const txHash = await deployAgent(user, agentConfig);
      
      // Generate agent DID from transaction hash
      const did = `did:demiurge:agent:${txHash.slice(2, 18)}`;
      setAgentDid(did);
      setSuccess(true);
      
      if (onSuccess) {
        onSuccess(did);
      }
    } catch (err: any) {
      setError(err.message || 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-grunge text-white mb-2">Deploy AI Agent</h2>
        <p className="text-sm text-gray-400">
          Create an autonomous agent as a first-class citizen on Demiurge
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {['Config', 'Capabilities', 'Funding', 'Review'].map((label, idx) => {
          const stepIds = ['config', 'capabilities', 'funding', 'review'];
          const currentIdx = stepIds.indexOf(step);
          const isActive = idx === currentIdx;
          const isCompleted = idx < currentIdx;
          
          return (
            <div key={label} className="flex-1 flex items-center">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  isActive ? 'border-neon-purple bg-neon-purple/20 text-neon-purple' :
                  isCompleted ? 'border-green-400 bg-green-400/20 text-green-400' :
                  'border-gray-600 text-gray-600'
                }`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {label}
                </span>
              </div>
              {idx < 3 && <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-400' : 'bg-gray-700'}`} />}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* Step 1: Configuration */}
        {step === 'config' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Agent Name *</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="MarketAnalyzer"
                className="w-full glass-panel p-3 rounded-lg border border-white/10 focus:border-neon-purple/50 outline-none text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Mission Statement *</label>
              <textarea
                value={config.mission}
                onChange={(e) => setConfig({ ...config, mission: e.target.value })}
                placeholder="You are a market analysis agent. Your goal is to monitor CGT prices and provide trading insights..."
                rows={4}
                className="w-full glass-panel p-3 rounded-lg border border-white/10 focus:border-neon-purple/50 outline-none text-white resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Autonomy Level *</label>
              <div className="grid grid-cols-2 gap-2">
                {(['supervised', 'bounded', 'autonomous', 'sovereign'] as AutonomyLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setConfig({ ...config, autonomyLevel: level })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      config.autonomyLevel === level
                        ? getAutonomyColor(level)
                        : 'border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold capitalize">{level}</div>
                    <div className="text-xs mt-1">{getAutonomyDescription(level)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">LLM Provider *</label>
              <select
                value={config.llmProvider}
                onChange={(e) => setConfig({ ...config, llmProvider: e.target.value as LLMProvider })}
                className="w-full glass-panel p-3 rounded-lg border border-white/10 focus:border-neon-purple/50 outline-none text-white bg-transparent"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI GPT-4</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="ollama">Ollama (Local)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">API Key</label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full glass-panel p-3 rounded-lg border border-white/10 focus:border-neon-purple/50 outline-none text-white font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                {config.llmProvider === 'ollama' ? 'Not required for Ollama' : 'Required for hosted LLMs'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep('capabilities')}
              disabled={!config.name || !config.mission}
              className="w-full bg-gradient-to-r from-neon-purple to-neon-purple/70 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
            >
              Next: Select Capabilities →
            </button>
          </div>
        )}

        {/* Step 2: Capabilities */}
        {step === 'capabilities' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Agent Capabilities</h3>
              <p className="text-sm text-gray-400 mb-4">
                Select what actions your agent can perform
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {capabilityOptions.map((cap) => {
                const isSelected = config.capabilities.includes(cap.id);
                return (
                  <button
                    key={cap.id}
                    type="button"
                    onClick={() => toggleCapability(cap.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-neon-purple/50 bg-neon-purple/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">{cap.label}</span>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'border-neon-purple bg-neon-purple' : 'border-gray-500'
                      }`}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{cap.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-400 text-sm">
                💡 You can revoke capabilities later. Start conservative and expand as needed.
              </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('config')}
                className="flex-1 glass-panel py-3 rounded-lg border border-white/10 hover:border-white/20 transition-all"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep('funding')}
                disabled={config.capabilities.length === 0}
                className="flex-1 bg-gradient-to-r from-neon-purple to-neon-purple/70 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
              >
                Next: Set Budget →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Funding */}
        {step === 'funding' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Agent Funding</h3>
              <p className="text-sm text-gray-400 mb-4">
                Set spending limits and initial funding for your agent
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Spending Limit (CGT per epoch)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={config.spendingLimit}
                  onChange={(e) => setConfig({ ...config, spendingLimit: e.target.value })}
                  className="flex-1"
                />
                <div className="w-24 glass-panel p-2 rounded text-center">
                  <span className="text-neon-cyan font-bold">{config.spendingLimit}</span>
                  <span className="text-xs text-gray-400 ml-1">CGT</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                1 epoch = ~24 hours. Agent can spend up to this amount per day.
              </p>
            </div>

            <div className="p-4 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <div className="text-sm font-medium text-neon-cyan mb-1">Safety Features</div>
                  <ul className="text-xs text-gray-300 space-y-1">
                    <li>• Spending limited to {config.spendingLimit} CGT per epoch</li>
                    <li>• You can stop the agent at any time</li>
                    <li>• All actions are logged on-chain</li>
                    <li>• Verifiable Compute Proofs ensure integrity</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('capabilities')}
                className="flex-1 glass-panel py-3 rounded-lg border border-white/10 hover:border-white/20 transition-all"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep('review')}
                className="flex-1 bg-gradient-to-r from-neon-purple to-neon-purple/70 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all"
              >
                Review & Deploy →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Review Agent Configuration</h3>
              <p className="text-sm text-gray-400 mb-4">
                Verify all details before deploying your agent
              </p>
            </div>

            {/* Agent Preview Card */}
            <div className="glass-panel p-6 rounded-xl border border-neon-purple/30">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 flex items-center justify-center text-3xl">
                  🤖
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="text-xs text-gray-400">Agent Name</div>
                    <div className="text-white font-bold text-lg">{config.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Mission</div>
                    <div className="text-sm text-gray-300">{config.mission}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-xs text-gray-400">Autonomy</div>
                      <div className={`text-sm font-medium capitalize ${config.autonomyLevel === 'supervised' ? 'text-blue-400' : config.autonomyLevel === 'bounded' ? 'text-yellow-400' : config.autonomyLevel === 'autonomous' ? 'text-neon-cyan' : 'text-neon-purple'}`}>
                        {config.autonomyLevel}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">LLM</div>
                      <div className="text-sm text-white capitalize">{config.llmProvider}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Limit</div>
                      <div className="text-sm text-neon-cyan">{config.spendingLimit} CGT/day</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-xs text-gray-400 mb-2">Capabilities</div>
                <div className="flex flex-wrap gap-2">
                  {config.capabilities.map((capId) => {
                    const cap = capabilityOptions.find(c => c.id === capId);
                    return cap ? (
                      <div key={capId} className="px-3 py-1 bg-neon-purple/10 border border-neon-purple/30 rounded-full text-xs text-neon-purple">
                        {cap.label}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            {/* Success */}
            {success && agentDid && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-medium mb-2">✅ Agent Deployed Successfully!</p>
                <p className="text-xs text-gray-300">Agent DID:</p>
                <p className="text-xs font-mono text-green-400 break-all">{agentDid}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Your agent is now registered on-chain and will begin operations shortly
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Energy Cost */}
            <div className="p-3 bg-neon-purple/10 border border-neon-purple/30 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Deployment Cost:</span>
                <span className="text-neon-purple font-bold">{estimatedEnergy} Energy (0 CGT fees)</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                💡 Agent will be funded with {config.spendingLimit} CGT from your wallet
              </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('funding')}
                className="flex-1 glass-panel py-3 rounded-lg border border-white/10 hover:border-white/20 transition-all"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 glass-panel py-3 rounded-lg border border-white/10 hover:border-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeploy}
                disabled={deploying}
                className="flex-1 bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
              >
                {deploying ? 'Deploying...' : '🚀 Deploy Agent'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
