import { ComponentProps } from 'lib/component-props';
import { Field, ImageField, LinkField } from '@sitecore-content-sdk/nextjs';

// Base template fields shared by Carousel Slide and any template that inherits from it (e.g. Skateboard).
export interface CarouselItemFields {
  Title: Field<string>;
  Description: Field<string>;
  Image: ImageField;
  Link?: LinkField;
}

export interface CarouselSlide {
  id: string;
  name: string;
  displayName: string;
  fields: CarouselItemFields;
}

// Skateboard template: inherits Carousel Slide's base fields and adds Price.
export interface SkateboardItemFields extends CarouselItemFields {
  // Resolves as a number when the Sitecore template field is of type Number, not Single-Line Text.
  Price: Field<string | number>;
}

export interface SkateboardSlide extends CarouselSlide {
  fields: SkateboardItemFields;
}

export interface CarouselProps extends ComponentProps {
  params: ComponentProps['params'] & {
    // Slide title tag; defaults to 'h3' to preserve prior behavior when unset.
    HeadingLevel?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    // Accessible name for the carousel region; defaults to 'Carousel' when unset.
    AriaLabel?: string;
  };
  fields?: {
    items: (CarouselSlide | SkateboardSlide)[];
  };
}
