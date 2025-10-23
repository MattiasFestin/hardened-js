// Type exports
export type { FreezeOptions } from './freeze';
export type { RemoveReport } from './remove';

// Value exports
export { freezeDeep } from './freeze';
export { removeFromRoot } from './remove';
export { isObjectLike } from './object';
export { setupIgnoreConstructorHandler, removeIgnoreConstructorHandler, freezeBuiltin } from './targetHelpers';
export type { AnyObject, GlobalLike } from './types';
