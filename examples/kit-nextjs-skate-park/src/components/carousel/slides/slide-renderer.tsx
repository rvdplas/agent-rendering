import { JSX } from 'react';
import { CarouselSlide, SkateboardSlide } from '../carousel.props';
import { DefaultSlideContent } from './DefaultSlideContent';
import { HeadingTag } from './SlideFigure';
import { SkateboardSlideContent } from './SkateboardSlideContent';

type Slide = CarouselSlide | SkateboardSlide;

interface SlideRendererEntry<T extends Slide> {
  test: (slide: Slide) => slide is T;
  render: (slide: T, headingLevel: HeadingTag) => JSX.Element;
}

// Registry of slide renderers, most specific first; add a new entry here (and its own
// SlideXContent.tsx) to support another template, e.g. Skatepark, without touching Carousel.tsx.
const slideRenderers: SlideRendererEntry<Slide>[] = [
  {
    test: (slide): slide is SkateboardSlide => 'Price' in slide.fields,
    render: (slide, headingLevel) => (
      <SkateboardSlideContent slide={slide as SkateboardSlide} headingLevel={headingLevel} />
    ),
  },
];

// Factory: resolves the renderer for a slide instance, falling back to the generic template.
export const renderSlide = (slide: Slide, headingLevel: HeadingTag): JSX.Element => {
  const entry = slideRenderers.find(({ test }) => test(slide));
  return entry ? entry.render(slide, headingLevel) : (
    <DefaultSlideContent slide={slide} headingLevel={headingLevel} />
  );
};
