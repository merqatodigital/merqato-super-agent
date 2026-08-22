import type { CatalogDiff, CatalogChange, CatalogSnapshot, CatalogModel } from "../types";

/** Compact snapshot used to detect day-to-day catalog drift. */
export function toSnapshot(models: CatalogModel[]): CatalogSnapshot {
  return {
    fetchedAt: Date.now(),
    models: models
      .filter((m) => m.source === "openrouter")
      .map((m) => ({
        id: m.id,
        name: m.name,
        promptPerM: m.promptPerM,
        completionPerM: m.completionPerM,
        free: m.free,
      })),
  };
}

const pct = (from: number, to: number) => (from === 0 ? 100 : ((to - from) / from) * 100);

/**
 * Compares the freshly fetched catalog against the previous snapshot.
 * This is what proves the list is current: additions, removals, and
 * — critically — models that flipped between free and paid.
 */
export function diffCatalog(prev: CatalogSnapshot | null, next: CatalogSnapshot): CatalogDiff {
  const changes: CatalogChange[] = [];

  if (!prev) {
    return {
      at: next.fetchedAt,
      prevCount: 0,
      nextCount: next.models.length,
      baseline: true,
      changes,
    };
  }

  const prevMap = new Map(prev.models.map((m) => [m.id, m]));
  const nextMap = new Map(next.models.map((m) => [m.id, m]));

  for (const model of next.models) {
    const before = prevMap.get(model.id);
    if (!before) {
      changes.push({
        id: model.id,
        name: model.name,
        kind: "added",
        detail: model.free ? "New — free" : "New — paid",
      });
      continue;
    }
    if (before.free && !model.free) {
      changes.push({
        id: model.id,
        name: model.name,
        kind: "became_paid",
        detail: "Free tier withdrawn — now billed",
      });
      continue;
    }
    if (!before.free && model.free) {
      changes.push({ id: model.id, name: model.name, kind: "became_free", detail: "Now free" });
      continue;
    }
    if (!model.free && before.promptPerM > 0) {
      const delta = pct(before.promptPerM, model.promptPerM);
      if (Math.abs(delta) >= 1) {
        changes.push({
          id: model.id,
          name: model.name,
          kind: delta > 0 ? "price_up" : "price_down",
          detail: `Input price ${delta > 0 ? "+" : ""}${delta.toFixed(0)}%`,
        });
      }
    }
  }

  for (const model of prev.models) {
    if (!nextMap.has(model.id)) {
      changes.push({
        id: model.id,
        name: model.name,
        kind: "removed",
        detail: model.free ? "Delisted — was free" : "Delisted",
      });
    }
  }

  const order: Record<CatalogChange["kind"], number> = {
    became_paid: 0,
    removed: 1,
    became_free: 2,
    added: 3,
    price_up: 4,
    price_down: 5,
  };
  changes.sort((a, b) => order[a.kind] - order[b.kind] || a.name.localeCompare(b.name));

  return {
    at: next.fetchedAt,
    prevCount: prev.models.length,
    nextCount: next.models.length,
    baseline: false,
    changes,
  };
}

export const CHANGE_LABEL: Record<CatalogChange["kind"], { text: string; tone: "ok" | "warn" | "danger" | "info" }> = {
  added: { text: "ADDED", tone: "ok" },
  removed: { text: "REMOVED", tone: "danger" },
  became_free: { text: "NOW FREE", tone: "ok" },
  became_paid: { text: "NO LONGER FREE", tone: "danger" },
  price_up: { text: "PRICE UP", tone: "warn" },
  price_down: { text: "PRICE DOWN", tone: "info" },
};

export function isStale(lastSyncedAt: number | null, intervalHours: number): boolean {
  if (!lastSyncedAt) return true;
  return Date.now() - lastSyncedAt >= intervalHours * 3600_000;
}
