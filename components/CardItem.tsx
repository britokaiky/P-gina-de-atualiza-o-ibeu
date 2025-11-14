
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import type { Card } from './Column';

type Props = {
  card: Card;
  canEdit?: boolean;
  onEdit: (cardId: string, content: string) => Promise<void>;
  onDelete: (cardId: string) => Promise<void>;
};

export default function CardItem({ card, canEdit = true, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [value, setValue] = useState(card.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: !canEdit
  });

  const style = useMemo<CSSProperties>(() => {
    return {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 50 : menuOpen || isEditing ? 40 : undefined,
      opacity: isDragging ? 0.85 : 1
    };
  }, [transform, transition, isDragging, menuOpen, isEditing]);

  useEffect(() => {
    setValue(card.content);
  }, [card.content]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSave() {
    if (!value.trim() || value === card.content) {
      setIsEditing(false);
      setValue(card.content);
      return;
    }
    try {
      setIsSubmitting(true);
      await onEdit(card.id, value.trim());
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    try {
      setIsSubmitting(true);
      await onDelete(card.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative rounded-2xl border border-[var(--surface-border)] bg-[var(--card)] p-4 text-sm shadow-[var(--card-shadow)] transition ${
          canEdit 
            ? 'cursor-grab hover:-translate-y-0.5 hover:shadow-lg active:cursor-grabbing' 
            : 'cursor-default opacity-90'
        }`}
        {...(canEdit ? { ...attributes, ...listeners } : {})}
      >
      {!isEditing && canEdit && (
        <button
          type="button"
          aria-label="Opções"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((open) => !open);
          }}
          onPointerDown={(event) => event.stopPropagation()}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-[var(--muted)] transition hover:border-[var(--surface-border)] hover:bg-[var(--accent-soft)]"
        >
          <span className="sr-only">Opções</span>
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm3.5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm3.5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z" />
          </svg>
        </button>
      )}

      {menuOpen && !isEditing && (
        <div
          ref={menuRef}
          className="absolute right-3 top-12 z-50 w-44 rounded-2xl border border-[var(--surface-border)] bg-white/95 p-2 shadow-[0px_24px_40px_-22px_rgba(15,23,42,0.45)] backdrop-blur-md"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--text)] transition hover:bg-[var(--accent-soft)]"
            onClick={() => {
              setMenuOpen(false);
              setIsEditing(true);
            }}
          >
            Editar
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
            onClick={() => {
              setMenuOpen(false);
              setShowDeleteConfirm(true);
            }}
            disabled={isSubmitting}
          >
            Excluir
          </button>
        </div>
      )}

        <p className="pr-9 text-base leading-relaxed text-[var(--text)]">{card.content}</p>
      </div>
      {mounted &&
        isEditing &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 backdrop-blur-sm px-4"
            onClick={() => {
              setIsEditing(false);
              setValue(card.content);
            }}
          >
            <div
              className="relative flex w-full max-w-xl flex-col gap-5 rounded-3xl border border-white/40 bg-white/95 p-6 shadow-[0px_28px_60px_-35px_rgba(15,23,42,0.65)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[var(--text)]">Editar demanda</h2>
                <p className="text-sm text-[var(--muted)]">
                  Ajuste o texto da demanda. Mantenha a descrição objetiva para facilitar o acompanhamento.
                </p>
              </div>
              <textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                rows={5}
                className="w-full resize-none rounded-2xl border border-white/40 bg-white/90 p-4 text-sm leading-relaxed text-[var(--text)] shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setValue(card.content);
                  }}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button size="sm" className="px-5" onClick={() => void handleSave()} disabled={isSubmitting}>
                  Salvar
                </Button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setValue(card.content);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-[var(--muted)] transition hover:bg-white/60"
              >
                <span className="sr-only">Fechar modal de edição</span>
                ×
              </button>
            </div>
          </div>,
          document.body
        )}
      {mounted &&
        showDeleteConfirm &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm px-4"
            onClick={() => !isSubmitting && setShowDeleteConfirm(false)}
          >
            <div
              className="relative flex w-full max-w-md flex-col gap-5 rounded-3xl border border-white/40 bg-white/95 p-6 shadow-[0px_28px_60px_-35px_rgba(15,23,42,0.65)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[var(--text)]">Confirmar exclusão</h2>
                <p className="text-sm text-[var(--muted)]">
                  Deseja excluir esta demanda? Essa ação não pode ser desfeita.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={() => void handleDelete()}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Excluindo...' : 'Excluir'}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
