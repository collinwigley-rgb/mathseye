declare const __BUILD__: string;
declare const __BUILD_AT__: string;
interface Window {
  mathseyeFeedback?: { open: (ctx: Record<string, unknown>) => void; list: () => unknown[]; text: () => string; clear: () => void; flush: () => Promise<number>; unsent: () => number; configured: () => boolean };
  mathseyeSync?: { touch: () => void; sync: () => Promise<{ ok: boolean; changed: boolean }>; reset: (section: 'facts' | 'study' | 'hw') => Promise<unknown>; players: () => Promise<{ key: string; name: string; updatedAt: number }[]>; status: () => { at: number; ok: boolean | null }; norm: (n: string) => string };
  mathseyeSongs?: { load: () => Promise<unknown>; card: (host: HTMLElement, o: { get: () => string[] | undefined; set: (order: string[]) => void }) => void; stored: () => string[] | undefined; store: (order: string[]) => void };
  mathseyeDev?: { is: () => boolean; set: (actions: { label: string; fn: () => void }[]) => void };
}
