import { useEffect } from 'react';
import { X } from 'lucide-react';

interface LightboxProps {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}

export function Lightbox({ src, alt, caption, onClose }: LightboxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </button>
      <div className="max-h-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} className="max-h-[80vh] w-auto rounded-xl shadow-2xl" />
        {caption && (
          <p className="mt-3 text-center text-sm text-white/80">{caption}</p>
        )}
      </div>
    </div>
  );
}
