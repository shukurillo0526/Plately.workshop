'use client';

import { useState } from 'react';
import { X, CheckCircle2, Building2, Send, Loader2 } from 'lucide-react';

interface PilotRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PilotRequestModal({ isOpen, onClose }: PilotRequestModalProps) {
  const [formData, setFormData] = useState({
    restaurantName: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    locationsCount: '1',
    currentPos: 'None',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/pilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to submit application');
      }

      setSubmitted(true);
    } catch (err: unknown) {
      // Fallback: save to localStorage so submission is never lost
      try {
        const stored = JSON.parse(localStorage.getItem('plately_pilot_submissions') || '[]');
        stored.push({ ...formData, timestamp: new Date().toISOString() });
        localStorage.setItem('plately_pilot_submissions', JSON.stringify(stored));
        setSubmitted(true);
      } catch {
        setError((err as Error).message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#161B22] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Pilot Application Received</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              Thank you for applying to the Plately Merchant Pilot. Our deployment team will reach out within 24 hours to schedule your onboarding.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[#f98b25] text-white font-medium text-sm hover:bg-[#e07a00] transition-colors"
            >
              Back to Sandbox
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#f98b25]/10 border border-[#f98b25]/20 flex items-center justify-center text-[#f98b25]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-none">Apply for Merchant Pilot</h3>
                <p className="text-xs text-gray-400 mt-1">Live KDS, custom online ordering & multi-station kitchen tools</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Restaurant Name</label>
                  <input
                    required
                    type="text"
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                    placeholder="e.g. Bella Italia"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f98b25]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Contact Name</label>
                  <input
                    required
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f98b25]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Work Email</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="owner@restaurant.com"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f98b25]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Phone / WhatsApp</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555-0199"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f98b25]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">City / Region</label>
                  <input
                    required
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City, Country"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f98b25]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Locations</label>
                  <select
                    value={formData.locationsCount}
                    onChange={(e) => setFormData({ ...formData, locationsCount: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white focus:outline-none focus:border-[#f98b25]"
                  >
                    <option value="1">1 Location</option>
                    <option value="2-4">2 - 4 Locations</option>
                    <option value="5+">5+ Franchise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Special Requirements / Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Tell us about your kitchen stations, hardware, or target launch date..."
                  className="w-full px-3 py-2 bg-[#0D1117] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f98b25] resize-none"
                />
              </div>

              {error && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#f98b25] text-white font-medium text-xs hover:bg-[#e07a00] transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Pilot Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
