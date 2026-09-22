'use client';

import React, { JSX } from 'react';
import { NextImage as ContentSdkImage, RichText, Text, useSitecore } from '@sitecore-content-sdk/nextjs';
import { CompatibleLink } from 'components/content-sdk/CompatibleLink';
import {
  Carousel as CarouselRoot,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from 'components/ui/carousel';
import { getConsumerMode } from 'lib/consumer/consumer-mode';
import { CarouselProps, CarouselSlide } from './carousel.props';

const CarouselSlideContent = ({ fields }: CarouselSlide): JSX.Element => {
  const { Title, Description, Image, Link } = fields;

  return (
    <div className="flex h-full flex-col gap-3">
      {Image?.value?.src && (
        <ContentSdkImage field={Image} className="aspect-video w-full rounded-md object-cover" />
      )}
      {Title?.value && <Text tag="h3" field={Title} className="text-lg font-semibold" />}
      {Description?.value && (
        <RichText tag="div" field={Description} className="text-sm text-gray-600" />
      )}
      {Link?.value?.href && (
        <CompatibleLink
          field={Link}
          className="text-sm font-medium underline underline-offset-4"
        />
      )}
    </div>
  );
};

// Flattened, non-interactive representation: every slide is stacked in document
// order instead of behind the carousel's prev/next navigation, so an agent
// reading the raw HTML sees all content without needing to interact with it.
const CarouselAgent = ({ slides }: { slides: CarouselSlide[] }): JSX.Element => (
  <div className="flex flex-col gap-8">
    {slides.map((slide) => (
      <CarouselSlideContent key={slide.id} {...slide} />
    ))}
  </div>
);

export const Default = ({ params, fields }: CarouselProps): JSX.Element => {
  const { page } = useSitecore();
  const { styles, RenderingIdentifier: id } = params;
  const slides = fields?.items;
  const componentClasses = `component carousel ${styles || ''}`.trim();

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
          <CarouselAgent slides={slides} />
        </div>
      </div>
    );
  }

  return (
    <div className={componentClasses} id={id}>
      {/* px reserves room for the shadcn prev/next buttons, which sit outside the carousel bounds */}
      <div className="component-content px-10 sm:px-14">
        <CarouselRoot opts={{ align: 'start', loop: true }} className="w-full">
          <CarouselContent>
            {slides.map((slide) => (
              <CarouselItem key={slide.id} className="basis-full">
                <CarouselSlideContent {...slide} />
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

