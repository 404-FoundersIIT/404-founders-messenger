'use client';

import React, { useState, useEffect } from 'react';
import { Chat, Profile, Message } from '@/types/database';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { userService } from '@/services/userService';
import { chatService } from '@/services/chatService';
import {
  X,
  Users,
  Shield,
  Bell,
  VolumeX,
  Star,
  Pin,
  FileText,
  UserPlus,
  Trash2,
  Ban,
  Flag,
  Share2,
  Camera,
  Check,
  MessageSquare,
} from 'lucide-react';

interface ChatDetailsProps {
  chat: Chat;
  currentUser: Profile;
  onClose: () => void;
  onAddMember?: (userId: string) => void;
  onRemoveMember?: (userId: string) => void;
  onPromoteAdmin?: (userId: string) => void;
  onUpdateGroupPhoto?: (file: File) => void;
  onMuteChat?: (muteUntil: string | null) => void;
  onBlockUser?: () => void;
  onReportChat?: () => void;
  onStartDirectChat?: (userId: string) => void;
}

export function ChatDetails({
  chat,
  currentUser,
  onClose,
  onAddMember,
  onRemoveMember,
  onPromoteAdmin,
  onUpdateGroupPhoto,
  onMuteChat,
  onBlockUser,
  onReportChat,
  onStartDirectChat,
}: ChatDetailsProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'members'>('info');
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  const isAdmin = chat.members?.some((m) => m.user_id === currentUser.id && m.role === 'admin');

  // Load available users to add to group
  useEffect(() => {
    if (showAddModal) {
      userService.getAllProfiles().then((profiles) => {
        const existingMemberIds = new Set(chat.members?.map((m) => m.user_id) || []);
        setAvailableUsers(profiles.filter((p) => !existingMemberIds.has(p.id)));
      });
    }
  }, [showAddModal, chat.members]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0] && onUpdateGroupPhoto) {
      onUpdateGroupPhoto(e.target.files[0]);
    }
  };

  const handleAddMemberClick = async (userId: string) => {
    if (!onAddMember) return;
    setAddingUserId(userId);
    try {
      await onAddMember(userId);
      setAvailableUsers((prev) => prev.filter((u) => u.id !== userId));
    } finally {
      setAddingUserId(null);
    }
  };

  return (
    <div className="w-80 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col select-none overflow-hidden animate-slide-left z-20">
      {/* Top Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {chat.is_group ? 'Group Info' : 'Contact Details'}
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Profile Header */}
      <div className="flex flex-col items-center p-5 border-b border-slate-100 dark:border-slate-800 text-center">
        <div className="relative group cursor-pointer mb-3">
          <Avatar name={chat.name || 'Chat'} src={chat.photo_url} size="xl" />
          {chat.is_group && isAdmin && onUpdateGroupPhoto && (
            <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Camera className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate max-w-full">
          {chat.name || 'Chat'}
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-full px-2">
          {chat.description || (chat.is_group ? 'No group description' : 'Available')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            activeTab === 'info'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Overview
        </button>
        {chat.is_group && (
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Members ({chat.members?.length || 0})
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
        {activeTab === 'info' && (
          <>
            {/* Quick Actions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span>Mute Notifications</span>
                </div>
                <button
                  type="button"
                  onClick={() => onMuteChat && onMuteChat(null)}
                  className="text-emerald-600 font-semibold"
                >
                  Manage
                </button>
              </div>

              {chat.is_group && (
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                    <Share2 className="w-4 h-4 text-slate-400" />
                    <span>Invite via Link</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const code = await chatService.getOrCreateGroupInviteLink(chat.id, currentUser.id);
                        navigator.clipboard.writeText(`${window.location.origin}/join/${code}`);
                        alert(`Group invite link copied to clipboard!\n${window.location.origin}/join/${code}`);
                      } catch {
                        alert('Failed to generate invite link');
                      }
                    }}
                    className="text-emerald-600 font-semibold"
                  >
                    Copy Link
                  </button>
                </div>
              )}
            </div>

            {/* Moderation Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {!chat.is_group && onBlockUser && (
                <button
                  type="button"
                  onClick={onBlockUser}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                >
                  <Ban className="w-4 h-4" /> Block Contact
                </button>
              )}

              {onReportChat && (
                <button
                  type="button"
                  onClick={onReportChat}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                >
                  <Flag className="w-4 h-4" /> Report {chat.is_group ? 'Group' : 'User'}
                </button>
              )}
            </div>
          </>
        )}

        {activeTab === 'members' && chat.is_group && (
          <div className="space-y-3">
            {/* Admin Add Participant Button */}
            {isAdmin && onAddMember && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="w-full flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1" /> Add Participants
              </Button>
            )}

            {/* Modal: Add Member from Directory */}
            {showAddModal && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Select Contact to Add
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {availableUsers.length === 0 ? (
                    <p className="text-center text-[11px] text-slate-400 py-3">
                      All registered contacts are already in this group.
                    </p>
                  ) : (
                    availableUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={u.full_name} src={u.avatar_url} size="xs" />
                          <span className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                            {u.full_name}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={addingUserId === u.id}
                          onClick={() => handleAddMemberClick(u.id)}
                          className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-semibold hover:bg-emerald-700 transition-colors"
                        >
                          {addingUserId === u.id ? 'Adding...' : 'Add'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Existing Members List */}
            <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
              {chat.members?.map((member) => (
                <div key={member.id} className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      name={member.profile?.full_name || 'Member'}
                      src={member.profile?.avatar_url}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {member.profile?.full_name || 'Member'}
                        {member.user_id === currentUser.id && (
                          <span className="text-[10px] text-slate-400 font-normal ml-1">(You)</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        @{member.profile?.username || 'user'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {member.role === 'admin' ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
                        Admin
                      </span>
                    ) : isAdmin ? (
                      <button
                        onClick={() => onPromoteAdmin && onPromoteAdmin(member.user_id)}
                        className="text-[10px] text-emerald-600 hover:underline"
                      >
                        Make admin
                      </button>
                    ) : null}

                    {/* 1-Click Direct Chat Button */}
                    {member.user_id !== currentUser.id && onStartDirectChat && (
                      <button
                        type="button"
                        onClick={() => {
                          onStartDirectChat(member.user_id);
                          onClose();
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                        title={`Message ${member.profile?.full_name || 'member'}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Remove Member Button: ONLY visible to Group Admins and cannot remove oneself */}
                    {isAdmin && member.user_id !== currentUser.id && onRemoveMember && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${member.profile?.full_name || 'this member'} from group?`)) {
                            onRemoveMember(member.user_id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 rounded"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
