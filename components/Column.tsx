
'use client';
import { useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import CardItem from './CardItem';
import AddCardForm from './forms/AddCardForm';

export type Card = { id: string; content: string; order: number; column_id: string };
export type Column = { id: string; title: string; order: number; cards: Card[] };

type Props = {
  column: Column;
  canEdit: boolean;
  onAddCard: (content: string) => Promise<void>;
  onEditCard: (cardId: string, content: string) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
};

export default function ColumnView({ column, canEdit, onAddCard, onEditCard, onDeleteCard }: Props) {
  const { setNodeRef, isOver } = useDroppable({ 
    id: column.id,
    disabled: !canEdit
  });
  const sortableItems = useMemo(() => column.cards.map((card) => card.id), [column.cards]);

  return (
    <div className="flex min-h-full min-w-[320px] flex-1 basis-0 flex-col rounded-3xl border border-[var(--surface-border)] bg-[var(--panel)] backdrop-blur-md shadow-[0px_18px_40px_-30px_rgba(15,23,42,0.55)] transition">
      <div className="flex items-center justify-between border-b border-[var(--surface-border)] px-6 py-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-[var(--text)]">{column.title}</h3>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
            {column.cards.length} {column.cards.length === 1 ? 'item' : 'itens'}
          </span>
        </div>
        {canEdit && <AddCardForm onAdd={onAddCard} />}
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 transition ${
          isOver ? 'bg-[var(--accent-soft)]/40' : ''
        }`}
      >
        {canEdit ? (
          <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
            {column.cards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                canEdit={canEdit}
                onEdit={onEditCard}
                onDelete={onDeleteCard}
              />
            ))}
          </SortableContext>
        ) : (
          column.cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              canEdit={canEdit}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
            />
          ))
        )}
        <div className="h-2" />
      </div>
    </div>
  );
}
