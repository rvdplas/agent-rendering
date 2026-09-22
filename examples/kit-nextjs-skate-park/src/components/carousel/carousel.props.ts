import { ComponentProps } from 'lib/component-props';
import { Field, ImageField, LinkField } from '@sitecore-content-sdk/nextjs';

export interface CarouselSlide {
  id: string;
  name: string;
  displayName: string;
  fields: {
    Title: Field<string>;
    Description: Field<string>;
    Image: ImageField;
    Link?: LinkField;
  };
}

export interface CarouselProps extends ComponentProps {
  fields?: {
    items: CarouselSlide[];
  };
}
