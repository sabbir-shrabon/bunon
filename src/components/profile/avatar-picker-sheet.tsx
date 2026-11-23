/**
 * 1. Purpose: Bottom sheet for changing or removing the user profile avatar picture.
 * 2. Spec Ref: Sheet 81 Avatar picture sheet in Stitch UI Design Guide Category G.
 * 3. Called By: EditProfileView.
 * 4. Calls: BottomSheet and Supabase client storage.
 */

'use client';

import { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { createClient } from '@/lib/db/client';

type AvatarPickerSheetProps = {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  onSelectAvatar: (url: string | null) => void;
};

export function AvatarPickerSheet({
  isOpen,
  userId,
  onClose,
  onSelectAvatar,
}: Readonly<AvatarPickerSheetProps>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be under 5 MB');
      return;
    }

    setUploading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${userId}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('bunon-proofs')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('bunon-proofs')
        .getPublicUrl(path);

      onSelectAvatar(urlData.publicUrl);
      onClose();
    } catch {
      setErrorMsg('Could not upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Profile photo">
      <div className="space-y-4 pt-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {errorMsg && (
          <p className="text-xs text-red-500 text-center">{errorMsg}</p>
        )}

        <div className="space-y-2.5">
          <PrimaryButton
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <span className="flex items-center justify-center gap-2">
              <Camera size={16} />
              <span>{uploading ? 'Uploading...' : 'Upload photo'}</span>
            </span>
          </PrimaryButton>

          <button
            type="button"
            onClick={() => {
              onSelectAvatar(null);
              onClose();
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-hairline bg-card text-xs font-medium text-ink hover:bg-secondary-surface transition-colors cursor-pointer"
          >
            <Trash2 size={15} className="text-muted" />
            <span>Remove photo and use initials</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full text-center text-xs text-muted hover:text-ink pt-1 cursor-pointer transition-colors"
        >
          Cancel
        </button>
      </div>
    </BottomSheet>
  );
}
