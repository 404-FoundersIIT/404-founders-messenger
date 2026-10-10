'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareLocation: (location: { latitude: number; longitude: number; address?: string }) => void;
}

export function LocationModal({ isOpen, onClose, onShareLocation }: LocationModalProps) {
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setAddress('Current Live Location');
      },
      (err) => {
        setLoading(false);
        setError(`Unable to retrieve location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    if (coords) {
      onShareLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: address || 'Shared Location',
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Location" maxWidth="md">
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Share your precise location with friends using OpenStreetMap.
        </p>

        {!coords ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-full text-emerald-600 mb-3">
              <MapPin className="w-8 h-8" />
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={handleGetCurrentLocation}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching GPS...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" /> Use Current Location
                </>
              )}
            </Button>
            {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {/* OpenStreetMap Iframe Preview */}
            <div className="w-full h-48 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              <iframe
                title="Location Preview"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.longitude - 0.01}%2C${coords.latitude - 0.01}%2C${coords.longitude + 0.01}%2C${coords.latitude + 0.01}&layer=mapnik&marker=${coords.latitude}%2C${coords.longitude}`}
              />
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Coordinates: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {coords && (
            <Button type="button" variant="primary" onClick={handleConfirm}>
              Send Location
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
