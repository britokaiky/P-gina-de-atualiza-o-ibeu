
'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import ColumnView, { Column, Card } from './Column';
import { supabase } from '@/lib/supabaseClient';

async function fetchBoard(pageTag: string): Promise<Column[]> {
  const { data: cols, error: ce } = await supabase
    .from('columns')
    .select('*')
    .order('order', { ascending: true });
  if (ce) throw ce;
  const columns = (cols ?? []) as Column[];

  const { data: cards, error: ca } = await supabase
    .from('cards')
    .select('*')
    .eq('page_tag', pageTag)
    .order('order', { ascending: true });
  if (ca) throw ca;

  const byCol: Record<string, Card[]> = {};
  for (const card of cards ?? []) {
    (byCol[card.column_id] ??= []).push(card as Card);
  }

  return columns.map((column) => ({
    ...column,
    cards: (byCol[column.id] ?? []).sort((a, b) => a.order - b.order)
  }));
}

function cloneColumns(columns: Column[]) {
  return columns.map((column) => ({
    ...column,
    cards: column.cards.map((card) => ({ ...card }))
  }));
}

function findColumnIdByCardId(columns: Column[], cardId: string) {
  return columns.find((column) => column.cards.some((card) => card.id === cardId))?.id;
}

type BoardProps = {
  pageTag: string;
};

export default function Board({ pageTag }: BoardProps) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }
    })
  );

  const loadBoard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchBoard(pageTag);
      setColumns(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [pageTag]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const handleAddCard = useCallback(
    async (columnId: string, content: string) => {
      const nextOrder = columns.find((col) => col.id === columnId)?.cards.length ?? 0;
      const { data, error } = await supabase
        .from('cards')
        .insert({ content, column_id: columnId, order: nextOrder, page_tag: pageTag })
        .select()
        .single();
      if (error) throw error;

      setColumns((prev) =>
        prev.map((column) =>
          column.id === columnId
            ? { ...column, cards: [...column.cards, data as Card].sort((a, b) => a.order - b.order) }
            : column
        )
      );
    },
    [columns, pageTag]
  );

  const handleEditCard = useCallback(async (cardId: string, columnId: string, content: string) => {
    const { error } = await supabase.from('cards').update({ content }).eq('id', cardId);
    if (error) throw error;

    setColumns((prev) =>
      prev.map((column) =>
        column.id === columnId
          ? {
              ...column,
              cards: column.cards.map((card) => (card.id === cardId ? { ...card, content } : card))
            }
          : column
      )
    );
  }, []);

  const handleDeleteCard = useCallback(async (cardId: string, columnId: string) => {
    const { error } = await supabase.from('cards').delete().eq('id', cardId);
    if (error) throw error;

    setColumns((prev) =>
      prev.map((column) =>
        column.id === columnId
          ? {
              ...column,
              cards: column.cards
                .filter((card) => card.id !== cardId)
                .map((card, index) => ({ ...card, order: index }))
            }
          : column
      )
    );

    const column = columns.find((col) => col.id === columnId);
    if (column) {
      const remaining = column.cards.filter((card) => card.id !== cardId);
      await Promise.all(
        remaining.map((card, index) =>
          supabase.from('cards').update({ order: index }).eq('id', card.id)
        )
      );
    }
  }, [columns]);

  const persistCardPositions = useCallback(async (cards: Card[]) => {
    await Promise.all(
      cards.map((card) =>
        supabase
          .from('cards')
          .update({ column_id: card.column_id, order: card.order })
          .eq('id', card.id)
      )
    );
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      setColumns((prev) => {
        const activeColumnId = findColumnIdByCardId(prev, activeId);
        const overColumnId =
          prev.find((column) => column.id === overId)?.id ?? findColumnIdByCardId(prev, overId);

        if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) {
          return prev;
        }

        const next = cloneColumns(prev);
        const sourceColumn = next.find((column) => column.id === activeColumnId);
        const destinationColumn = next.find((column) => column.id === overColumnId);
        if (!sourceColumn || !destinationColumn) return prev;

        const activeIndex = sourceColumn.cards.findIndex((card) => card.id === activeId);
        const [movedCard] = sourceColumn.cards.splice(activeIndex, 1);
        movedCard.column_id = destinationColumn.id;

        const overIndex = destinationColumn.cards.findIndex((card) => card.id === overId);
        const insertIndex = overIndex >= 0 ? overIndex : destinationColumn.cards.length;

        destinationColumn.cards.splice(insertIndex, 0, movedCard);

        return next;
      });
    },
    []
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveCardId(null);
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      setColumns((prev) => {
        const activeColumnId = findColumnIdByCardId(prev, activeId);
        const overColumnId =
          prev.find((column) => column.id === overId)?.id ?? findColumnIdByCardId(prev, overId);

        if (!activeColumnId || !overColumnId) {
          return prev;
        }

        const next = cloneColumns(prev);
        const sourceColumnIndex = next.findIndex((column) => column.id === activeColumnId);
        const destinationColumnIndex = next.findIndex((column) => column.id === overColumnId);

        if (sourceColumnIndex === -1 || destinationColumnIndex === -1) {
          return prev;
        }

        const sourceColumn = next[sourceColumnIndex];
        const destinationColumn = next[destinationColumnIndex];
        const sourceIndex = sourceColumn.cards.findIndex((card) => card.id === activeId);

        if (sourceIndex === -1) {
          return prev;
        }

        if (sourceColumn.id === destinationColumn.id) {
          const destinationIndex = destinationColumn.cards.findIndex((card) => card.id === overId);
          const targetIndex =
            destinationIndex >= 0 ? destinationIndex : destinationColumn.cards.length - 1;
          sourceColumn.cards = arrayMove(sourceColumn.cards, sourceIndex, targetIndex);
          sourceColumn.cards = sourceColumn.cards.map((card, index) => ({
            ...card,
            order: index
          }));
          void persistCardPositions(sourceColumn.cards);
        } else {
          const [movedCard] = sourceColumn.cards.splice(sourceIndex, 1);
          const destinationIndex = destinationColumn.cards.findIndex((card) => card.id === overId);
          const insertIndex =
            destinationIndex >= 0 ? destinationIndex : destinationColumn.cards.length;
          movedCard.column_id = destinationColumn.id;
          destinationColumn.cards.splice(insertIndex, 0, movedCard);

          sourceColumn.cards = sourceColumn.cards.map((card, index) => ({
            ...card,
            order: index
          }));
          destinationColumn.cards = destinationColumn.cards.map((card, index) => ({
            ...card,
            order: index
          }));
          void persistCardPositions([...sourceColumn.cards, ...destinationColumn.cards]);
        }

        return next;
      });
    },
    [persistCardPositions]
  );

  const pendingColumns = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="flex min-h-full min-w-[320px] flex-1 basis-0 flex-col rounded-3xl border border-white/20 bg-white/60 backdrop-blur-md shadow-lg shadow-black/5"
        >
          <div className="mx-auto mt-6 h-4 w-1/2 rounded-full bg-slate-200/80" />
          <div className="mt-8 flex-1 space-y-4 px-6 pb-6">
            {Array.from({ length: 4 }).map((__, cardIndex) => (
              <div
                key={`card-skeleton-${cardIndex}`}
                className="h-20 rounded-2xl border border-white/30 bg-white/70"
              />
            ))}
          </div>
        </div>
      )),
    []
  );

  const activeCard = useMemo(() => {
    if (!activeCardId) return null;
    for (const column of columns) {
      const found = column.cards.find((card) => card.id === activeCardId);
      if (found) return found;
    }
    return null;
  }, [activeCardId, columns]);

  return (
    <div className="flex w-full flex-1">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex w-full flex-1 items-stretch gap-8 overflow-x-auto pb-6">
          {loading
            ? pendingColumns
            : columns.map((column) => (
                <ColumnView
                  key={column.id}
                  column={column}
                  onAddCard={(content) => handleAddCard(column.id, content)}
                  onEditCard={(cardId, content) => handleEditCard(cardId, column.id, content)}
                  onDeleteCard={(cardId) => handleDeleteCard(cardId, column.id)}
                />
              ))}
        </div>
        <DragOverlay>
          {activeCard ? (
            <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--card)] p-4 text-base leading-relaxed shadow-2xl">
              {activeCard.content}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
