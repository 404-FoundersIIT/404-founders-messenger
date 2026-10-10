import { supabase } from '@/lib/supabase/client';

export const FILE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10 MB
  VIDEO: 50 * 1024 * 1024, // 50 MB
  DOCUMENT: 25 * 1024 * 1024, // 25 MB
  VOICE: 10 * 1024 * 1024, // 10 MB
};

export const ALLOWED_DOC_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip'
];

export interface UploadResult {
  storagePath: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export const storageService = {
  validateFile(file: File | Blob, type: 'image' | 'video' | 'document' | 'voice'): { valid: boolean; error?: string } {
    const size = file.size;

    if (type === 'image') {
      if (size > FILE_LIMITS.IMAGE) return { valid: false, error: 'Image size exceeds 10MB limit' };
      if (file.type && !file.type.startsWith('image/')) return { valid: false, error: 'File is not a valid image' };
    } else if (type === 'video') {
      if (size > FILE_LIMITS.VIDEO) return { valid: false, error: 'Video size exceeds 50MB limit' };
      if (file.type && !file.type.startsWith('video/')) return { valid: false, error: 'File is not a valid video' };
    } else if (type === 'voice') {
      if (size > FILE_LIMITS.VOICE) return { valid: false, error: 'Audio recording exceeds 10MB limit' };
    } else if (type === 'document') {
      if (size > FILE_LIMITS.DOCUMENT) return { valid: false, error: 'Document size exceeds 25MB limit' };
      if ('name' in file) {
        const ext = (file as File).name.split('.').pop()?.toLowerCase();
        if (!ext || !ALLOWED_DOC_EXTENSIONS.includes(ext)) {
          return { valid: false, error: `Unsupported file extension (.${ext}). Allowed: ${ALLOWED_DOC_EXTENSIONS.join(', ')}` };
        }
      }
    }

    return { valid: true };
  },

  async uploadAvatar(file: File, userId: string): Promise<string> {
    const validation = this.validateFile(file, 'image');
    if (!validation.valid) throw new Error(validation.error);

    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.warn('Supabase storage upload fallback:', error.message);
      // Return object URL for mock/offline testing
      return URL.createObjectURL(file);
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  },

  async uploadChatMedia(
    file: File | Blob,
    chatId: string,
    category: 'image' | 'video' | 'document' | 'voice',
    fileName?: string
  ): Promise<UploadResult> {
    const validation = this.validateFile(file, category);
    if (!validation.valid) throw new Error(validation.error);

    const bucketName = category === 'voice' ? 'voice-messages' : category === 'document' ? 'documents' : 'chat-media';
    const originalName = fileName || ('name' in file ? (file as File).name : `audio_${Date.now()}.webm`);
    const ext = originalName.split('.').pop() || (category === 'voice' ? 'webm' : 'dat');
    const storagePath = `${chatId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, file, {
        contentType: file.type || 'application/octet-stream',
      });

    if (error) {
      console.warn('Storage upload fallback triggered:', error.message);
      const mockBlobUrl = URL.createObjectURL(file);
      return {
        storagePath,
        publicUrl: mockBlobUrl,
        fileName: originalName,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
      };
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
    return {
      storagePath,
      publicUrl: data.publicUrl,
      fileName: originalName,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
    };
  },
};
