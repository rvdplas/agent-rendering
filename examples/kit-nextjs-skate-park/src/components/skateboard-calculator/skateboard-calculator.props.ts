import type { Quote, Selection } from 'lib/skateboard/catalog';
import type { ComponentProps } from 'lib/component-props';

export interface SkateboardCalculatorProps {
  initialSelection: Selection;
  initialQuote: Quote;
  agent?: boolean;
}

export type SkateboardCalculatorRenderingProps = ComponentProps;