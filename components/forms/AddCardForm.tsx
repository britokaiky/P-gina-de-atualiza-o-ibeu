
'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';

type Props = {
  onAdd: (content: string) => Promise<void>;
};

export default function AddCardForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleAdd() {
    if (!content.trim()) return;
    try {
      setIsSubmitting(true);
      await onAdd(content.trim());
      setContent('');
      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--surface-border)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--muted)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)]"
      >
        <span className="text-lg leading-none">+</span>
        Novo item
      </button>
      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-4"
            onClick={() => {
              setOpen(false);
              setContent('');
            }}
          >
            <div
              className="relative flex w-full max-w-md flex-col gap-5 rounded-3xl border border-white/40 bg-white/95 p-6 shadow-[0px_28px_60px_-35px_rgba(15,23,42,0.65)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[var(--text)]">Adicionar novo item</h2>
                <p className="text-sm text-[var(--muted)]">
                  Descreva rapidamente o que precisa ser feito. Você poderá editar depois.
                </p>
              </div>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={4}
                placeholder="Ex.: Criar apresentação do status do projeto..."
                className="w-full resize-none rounded-2xl border border-white/40 bg-white/90 p-4 text-sm leading-relaxed text-[var(--text)] shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setOpen(false);
                    setContent('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button size="sm" className="px-5" onClick={handleAdd} disabled={isSubmitting}>
                  Adicionar
                </Button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setContent('');
                }}
                className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-[var(--muted)] transition hover:bg-white/60"
              >
                <span className="sr-only">Fechar</span>
                ×
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
