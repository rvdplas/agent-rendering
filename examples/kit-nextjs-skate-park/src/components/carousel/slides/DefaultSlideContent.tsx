import { JSX } from 'react';
import { CarouselSlide } from '../carousel.props';
import { HeadingTag, SlideFigure } from './SlideFigure';

// Renderer for the generic Carousel Slide template: no schema.org typing, just the base fields.
export const DefaultSlideContent = ({
  slide,
  headingLevel,
}: {
  slide: CarouselSlide;
  headingLevel: HeadingTag;
}): JSX.Element => <SlideFigure fields={slide.fields} headingLevel={headingLevel} />;
