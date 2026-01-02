import { useState, useRef } from 'react';
import { Send, Camera, Mic } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import clsx from 'clsx';

interface ChatInputProps {
  onSend: (message: string) => void;
  onImageUpload: (file: File) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onImageUpload, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguageStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
      e.target.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 md:gap-3 p-4">
      {/* Photo upload button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex-shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-full bg-earth-100 flex items-center justify-center
                   text-earth-600 hover:bg-earth-200 active:scale-95 transition-all"
        aria-label={t.ai.uploadPhoto}
      >
        <Camera className="w-5 h-5 md:w-6 md:h-6" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Input field */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.ai.inputPlaceholder}
          disabled={disabled}
          className="w-full h-11 md:h-12 px-4 pr-10 rounded-full bg-earth-100 
                     text-earth-900 placeholder:text-earth-400
                     focus:outline-none focus:ring-2 focus:ring-primary-500
                     disabled:opacity-50 text-base"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 
                     hover:text-primary-500 transition-colors"
          aria-label="Voice input"
        >
          <Mic className="w-5 h-5" />
        </button>
      </div>

      {/* Send button */}
      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className={clsx(
          'flex-shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center',
          'transition-all active:scale-95',
          message.trim() && !disabled
            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-600'
            : 'bg-earth-200 text-earth-400'
        )}
        aria-label="Send"
      >
        <Send className="w-5 h-5 md:w-6 md:h-6" />
      </button>
    </form>
  );
}
