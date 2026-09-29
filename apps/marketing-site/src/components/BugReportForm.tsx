'use client'

import { useState } from 'react'
import { X, Send, AlertCircle, CheckCircle } from 'lucide-react'

interface BugReportFormProps {
  isOpen: boolean
  onClose: () => void
  qorId?: string
}

export function BugReportForm({ isOpen, onClose, qorId }: BugReportFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    severity: 'medium',
    environment: '',
    contactEmail: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/sophia/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          qorId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit bug report')
      }

      setSubmitStatus('success')
      setTimeout(() => {
        onClose()
        setFormData({
          title: '',
          description: '',
          stepsToReproduce: '',
          expectedBehavior: '',
          actualBehavior: '',
          severity: 'medium',
          environment: '',
          contactEmail: '',
        })
        setSubmitStatus('idle')
      }, 2000)
    } catch (error) {
      console.error('Bug report submission error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg border-2 border-neon-cyan/30">
        <div className="p-6 border-b border-neon-cyan/20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-6 h-6 text-neon-cyan" />
            <h2 className="text-2xl font-orbitron font-bold text-white">Submit Bug Report</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-neon-cyan transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {submitStatus === 'success' && (
            <div className="bg-neon-green/20 border border-neon-green rounded-lg p-4 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-neon-green" />
              <span className="text-neon-green">Bug report submitted successfully!</span>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-500">Failed to submit bug report. Please try again.</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-blockchain-dark border border-neon-cyan/20 rounded-lg text-white focus:outline-none focus:border-neon-cyan"
              placeholder="Brief description of the bug"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-blockchain-dark border border-neon-cyan/20 rounded-lg text-white focus:outline-none focus:border-neon-cyan"
              placeholder="Detailed description of the bug"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Severity
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-4 py-2 bg-blockchain-dark border border-neon-cyan/20 rounded-lg text-white focus:outline-none focus:border-neon-cyan"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-4 py-2 bg-blockchain-dark border border-neon-cyan/20 rounded-lg text-white focus:outline-none focus:border-neon-cyan"
                placeholder="your@email.com (optional)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Steps to Reproduce
            </label>
            <textarea
              value={formData.stepsToReproduce}
              onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-blockchain-dark border border-neon-cyan/20 rounded-lg text-white focus:outline-none focus:border-neon-cyan"
              placeholder="1. Step one...&#10;2. Step two...&#10;3. Step three..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Expected Behavior
            </label>
            <textarea
              value={formData.expectedBehavior}
              onChange={(e) => setFormData({ ...formData, expectedBehavior: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-blockchain-dark border border-neon-cyan/20 rounded-lg text-white focus:outline-none focus:border-neon-cyan"
              placeholder="What should happen?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Actual Behavior
            </label>
            <textarea
              value={formData.actualBehavior}
              onChange={(e) => setFormData({ ...formData, actualBehavior: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-blockchain-dark border border-neon-cyan/20 rounded-lg text-white focus:outline-none focus:border-neon-cyan"
              placeholder="What actually happens?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Environment
            </label>
            <input
              type="text"
              value={formData.environment}
              onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
              className="w-full px-4 py-2 bg-blockchain-dark border border-neon-cyan/20 rounded-lg text-white focus:outline-none focus:border-neon-cyan"
              placeholder="e.g., Chrome 120, Windows 11, Node.js 20"
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-neon-cyan/20">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="neon-button inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
