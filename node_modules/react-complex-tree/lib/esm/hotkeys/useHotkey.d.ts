import { KeyboardBindings } from '../types';
export declare const useHotkey: (combinationName: keyof KeyboardBindings, onHit: (e: KeyboardEvent) => void, active?: boolean, activatableWhileFocusingInput?: boolean) => void;
