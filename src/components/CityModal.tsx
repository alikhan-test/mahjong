'use client';

import { useState } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSave: (city: string, country: string) => Promise<void>;
}

type Mode = 'choose' | 'detecting' | 'manual';

export default function CityModal({ onClose, onSave }: Props) {
  const [mode, setMode] = useState<Mode>('choose');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [geoError, setGeoError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  async function detect() {
    setMode('detecting');
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setMode('manual');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } },
          );
          const data = await res.json();
          const detectedCity = data.address?.city || data.address?.town || data.address?.village || '';
          const detectedCountry = data.address?.country || '';
          await handleSave(detectedCity, detectedCountry);
        } catch {
          setGeoError('Could not look up your location. Please enter it manually.');
          setMode('manual');
        }
      },
      () => {
        setGeoError('Location access was denied. Please enter your city below.');
        setMode('manual');
      },
      { timeout: 8000 },
    );
  }

  async function handleSave(cityVal: string, countryVal: string) {
    if (!cityVal.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 8000),
      );
      await Promise.race([onSave(cityVal.trim(), countryVal.trim()), timeout]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'timeout') {
        setSaveError('Save timed out — run the SQL migration in Supabase first.');
      } else if (msg.includes('column') || msg.includes('does not exist')) {
        setSaveError('Database not configured — run fix-leaderboard-rls.sql in Supabase SQL Editor.');
      } else {
        setSaveError(msg || 'Failed to save. Please try again.');
      }
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 shadow-2xl p-6 border border-stone-200 dark:border-stone-700">

        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <MapPin size={17} className="text-emerald-500" />
            <h2 className="font-bold text-stone-800 dark:text-stone-100">Where are you from?</h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">
          Your city appears next to your name on leaderboards.
        </p>

        {saveError && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
            {saveError}
          </div>
        )}

        {mode === 'choose' && (
          <div className="flex flex-col gap-2">
            <button
              onClick={detect}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow"
            >
              📍 Detect automatically
            </button>
            <button
              onClick={() => setMode('manual')}
              className="w-full py-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold text-sm transition-all"
            >
              ✏️ Enter manually
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {mode === 'detecting' && (
          <div className="flex items-center justify-center gap-2 py-6 text-stone-500 dark:text-stone-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Detecting your location…</span>
          </div>
        )}

        {mode === 'manual' && (
          <div className="flex flex-col gap-3">
            {geoError && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                {geoError}
              </p>
            )}
            <input
              type="text"
              placeholder="City (e.g. Almaty)"
              value={city}
              onChange={e => setCity(e.target.value)}
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="text"
              placeholder="Country (e.g. Kazakhstan)"
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold text-sm transition-all disabled:opacity-40"
              >
                Skip
              </button>
              <button
                onClick={() => handleSave(city, country)}
                disabled={!city.trim() || saving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
