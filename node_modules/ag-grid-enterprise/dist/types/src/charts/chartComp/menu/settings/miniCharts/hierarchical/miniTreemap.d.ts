import type { AgChartsExports } from '../../../../../agChartsExports';
import type { MiniChartSelector, ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniChart } from '../miniChart';
export declare class MiniTreemapClass extends MiniChart {
    private readonly rects;
    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[], themeTemplate: ThemeTemplateParameters, isCustomTheme: boolean);
    updateColors(fills: string[], strokes: string[], themeTemplate?: ThemeTemplateParameters, isCustomTheme?: boolean): void;
}
export declare const MiniTreemap: MiniChartSelector;
