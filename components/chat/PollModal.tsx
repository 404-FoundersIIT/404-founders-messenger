'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2 } from 'lucide-react';

interface PollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePoll: (pollData: { question: string; options: string[]; isMultipleChoice: boolean }) => void;
}

export function PollModal({ isOpen, onClose, onCreatePoll }: PollModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [error, setError] = useState('');

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const handleOptionChange = (idx: number, value: string) => {
    const updated = [...options];
    updated[idx] = value;
    setOptions(updated);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Question is required');
      return;
    }

    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (validOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }

    onCreatePoll({
      question: question.trim(),
      options: validOptions,
      isMultipleChoice,
    });

    setQuestion('');
    setOptions(['', '']);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a Poll" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Poll Question"
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            setError('');
          }}
          autoFocus
        />

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Options
          </label>
          {options.map((option, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                placeholder={`Option ${idx + 1}`}
                value={option}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(idx)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {options.length < 8 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              className="w-full mt-1"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Option
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
          <div>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Multiple Answers
            </div>
            <div className="text-xs text-slate-400">Allow people to select more than one option</div>
          </div>
          <input
            type="checkbox"
            checked={isMultipleChoice}
            onChange={(e) => setIsMultipleChoice(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create Poll
          </Button>
        </div>
      </form>
    </Modal>
  );
}
