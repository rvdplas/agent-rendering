import { CarouselProps } from '../../../components/carousel/carousel.props';

const buildSlide = (index: number) => ({
  id: `slide-${index}`,
  name: `Slide ${index}`,
  displayName: `Slide ${index}`,
  fields: {
    Title: { value: `Slide ${index} Title` },
    Description: { value: `<p>Slide ${index} description</p>` },
    Image: { value: { src: `/slide-${index}.jpg`, alt: `Slide ${index}` } },
    Link: { value: { href: `/slide-${index}`, text: `Learn more about slide ${index}` } },
  },
});

export const mockCarouselProps: CarouselProps = {
  rendering: { componentName: 'Carousel' } as CarouselProps['rendering'],
  params: {
    styles: 'carousel-styles',
    RenderingIdentifier: 'carousel-test-id',
  },
  page: {} as CarouselProps['page'],
  fields: {
    items: [buildSlide(1), buildSlide(2), buildSlide(3)],
  },
};

export const mockCarouselPropsEmpty: CarouselProps = {
  ...mockCarouselProps,
  fields: { items: [] },
};

export const mockCarouselPropsCustomHeading: CarouselProps = {
  ...mockCarouselProps,
  params: {
    ...mockCarouselProps.params,
    HeadingLevel: 'h2',
    AriaLabel: 'Featured skate parks',
  },
};

const buildSkateboardSlide = (index: number) => ({
  ...buildSlide(index),
  fields: {
    ...buildSlide(index).fields,
    Price: { value: '$149.99' },
  },
});

export const mockCarouselPropsSkateboard: CarouselProps = {
  ...mockCarouselProps,
  fields: {
    items: [buildSkateboardSlide(1)],
  },
};
