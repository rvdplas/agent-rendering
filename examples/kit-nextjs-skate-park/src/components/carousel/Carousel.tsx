'use client';

import React, { JSX } from 'react';
import { useSitecore } from '@sitecore-content-sdk/nextjs';
import {
  Carousel as CarouselRoot,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from 'components/ui/carousel';
import { getConsumerMode } from 'lib/consumer/consumer-mode';
import { CarouselProps, CarouselSlide, SkateboardSlide } from './carousel.props';
import { renderSlide } from './slides/slide-renderer';

type HeadingTag = NonNullable<CarouselProps['params']['HeadingLevel']>;
type Slide = CarouselSlide | SkateboardSlide;

// Flattened, non-interactive representation: every slide is stacked in document
// order instead of behind the carousel's prev/next navigation, so an agent
// reading the raw HTML sees all content without needing to interact with it.
const CarouselAgent = ({
  slides,
  headingLevel,
}: {
  slides: Slide[];
  headingLevel: HeadingTag;
}): JSX.Element => (
  <ul className="flex flex-col gap-8">
    {slides.map((slide) => (
      <li key={slide.id}>{renderSlide(slide, headingLevel)}</li>
    ))}
  </ul>
);

export const Default = ({ params, fields }: CarouselProps): JSX.Element => {
  const { page } = useSitecore();
  const { styles, RenderingIdentifier: id, HeadingLevel, AriaLabel } = params;
  const slides = fields?.items;
  const componentClasses = `component carousel ${styles || ''}`.trim();
  const headingLevel = HeadingLevel || 'h3';
  const ariaLabel = AriaLabel || 'Carousel';

  if (!Array.isArray(slides) || slides.length === 0) {
    return (
      <div className={componentClasses} id={id}>
        <span className="is-empty-hint">Carousel</span>
      </div>
    );
  }

  if (getConsumerMode(page) === 'agent') {
    return (
      <div className={componentClasses} id={id}>
        <div className="component-content">
          <CarouselAgent slides={slides} headingLevel={headingLevel} />
        </div>
      </div>
    );
  }

  return (
    <div className={componentClasses} id={id}>
      {/* px reserves room for the shadcn prev/next buttons, which sit outside the carousel bounds */}
      <div className="component-content px-10 sm:px-14">
        <CarouselRoot opts={{ align: 'start', loop: true }} className="w-full" aria-label={ariaLabel}>
          <CarouselContent>
            {slides.map((slide) => (
              <CarouselItem key={slide.id} className="basis-full">
                {renderSlide(slide, headingLevel)}
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </CarouselRoot>
      </div>
    </div>
  );
};

