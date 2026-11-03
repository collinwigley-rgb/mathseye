import type { Trick, CardTemplate } from './types';

const modules = import.meta.glob('../content/tricks/*.json', { eager: true, import: 'default' });

export const TRICKS: Trick[] = (Object.values(modules) as Trick[]).sort((a, b) => a.unlockOrder - b.unlockOrder);

export const TEMPLATES: Record<string, { trick: Trick; template: CardTemplate }> = {};
for (const trick of TRICKS) for (const template of trick.templates) TEMPLATES[template.id] = { trick, template };
