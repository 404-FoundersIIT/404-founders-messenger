'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Profile } from '@/types/database';
import { userService } from '@/services/userService';
import { Check, Search, Users, ArrowRight, Camera } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onCreateGroup: (data: { name: string; description: string; photoFile?: File; memberIds: string[] }) => void;
}

export function CreateGroupModal({
  isOpen,
  onClose,
  currentUserId,
  onCreateGroup,
}: CreateGroupModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupPhoto, setGroupPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      userService.getAllProfiles().then((profiles) => {
        setAvailableUsers(profiles.filter((p) => p.id !== currentUserId));
      });
    }
  }, [isOpen, currentUserId]);

  const filteredUsers = availableUsers.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((uid) => uid !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setGroupPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleNext = () => {
    if (selectedUserIds.length === 0) {
      setError('Please select at least one contact for the group.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Group name is required.');
      return;
    }

    onCreateGroup({
      name: groupName.trim(),
      description: groupDescription.trim(),
      photoFile: groupPhoto || undefined,
      memberIds: selectedUserIds,
    });

    // Reset state
    setStep(1);
    setSelectedUserIds([]);
    setGroupName('');
    setGroupDescription('');
    setGroupPhoto(null);
    setPhotoPreview(null);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setStep(1);
        setError('');
        onClose();
      }}
      title={step === 1 ? 'Add Group Members' : 'New Group Details'}
      maxWidth="md"
    >
      {step === 1 ? (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Selected Badges */}
          {selectedUserIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl max-h-24 overflow-y-auto">
              {selectedUserIds.map((id) => {
                const user = availableUsers.find((u) => u.id === id);
                return (
                  <span
                    key={id}
                    onClick={() => toggleSelectUser(id)}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium cursor-pointer hover:bg-emerald-200 transition-colors"
                  >
                    <span>{user?.full_name || 'User'}</span>
                    <span className="text-emerald-600 font-bold">&times;</span>
                  </span>
                );
              })}
            </div>
          )}

          {/* User List */}
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">No contacts found</p>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleSelectUser(user.id)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {user.full_name}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">@{user.username}</p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleNext}
              className="flex items-center gap-1.5"
            >
              <span>Next ({selectedUserIds.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Group Photo Upload */}
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer">
              <Avatar name={groupName || 'Group'} src={photoPreview} size="xl" />
              <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Group Profile Picture
              </h4>
              <p className="text-[11px] text-slate-400">Add an icon or photo for this group chat.</p>
            </div>
          </div>

          <Input
            label="Group Subject / Name"
            type="text"
            placeholder="e.g. 404 Founders Core Team"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Group Description (Optional)
            </label>
            <textarea
              placeholder="What is this group about?"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="text-[11px] text-slate-500">
            <strong>{selectedUserIds.length}</strong> participants selected
          </div>

          <div className="pt-2 flex justify-between">
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Group Chat
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
