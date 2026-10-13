import { useId } from 'react';

/** SVG-safe unique prefix so gradient ids never collide between fridge instances. */
export function useUid(prefix = 'cb') {
  return prefix + useId().replace(/[^a-zA-Z0-9]/g, '');
}
