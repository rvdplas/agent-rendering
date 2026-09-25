import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Default as Carousel } from '../../../components/carousel/Carousel';
import {
  mockCarouselProps,
  mockCarouselPropsEmpty,
  mockCarouselPropsCustomHeading,
  mockCarouselPropsSkateboard,
} from './Carousel.mockProps';

const getCarouselDiv = () => document.querySelector('.carousel');

describe('Carousel Component should', () => {
  it('render without crashing', () => {
    render(<Carousel {...mockCarouselProps} />);
    expect(getCarouselDiv()).toBeInTheDocument();
  });

  it('render an empty hint when there are no slides', () => {
    render(<Carousel {...mockCarouselPropsEmpty} />);
    expect(screen.getByText('Carousel')).toHaveClass('is-empty-hint');
  });

  it('render slides inside a ul/li list structure', () => {
    render(<Carousel {...mockCarouselProps} />);
    const list = document.querySelector('ul');
    expect(list).toBeInTheDocument();
    expect(list?.querySelectorAll(':scope > li').length).toBe(3);
  });

  it('pair each slide image with its caption using figure/figcaption', () => {
    render(<Carousel {...mockCarouselProps} />);
    const figure = document.querySelector('figure');
    expect(figure).toBeInTheDocument();
    expect(figure?.querySelector('img')).toBeInTheDocument();
    expect(figure?.querySelector('figcaption')).toBeInTheDocument();
    expect(figure?.querySelector('figcaption')).toHaveTextContent('Slide 1 Title');
  });

  it('default the slide title to an h3 when no HeadingLevel param is set', () => {
    render(<Carousel {...mockCarouselProps} />);
    expect(screen.getByText('Slide 1 Title').tagName).toBe('H3');
  });

  it('use the HeadingLevel param for the slide title tag', () => {
    render(<Carousel {...mockCarouselPropsCustomHeading} />);
    expect(screen.getByText('Slide 1 Title').tagName).toBe('H2');
  });

  it('give the carousel region an accessible name', () => {
    render(<Carousel {...mockCarouselPropsCustomHeading} />);
    expect(screen.getByRole('region', { name: 'Featured skate parks' })).toBeInTheDocument();
  });

  it('fall back to a default accessible name when AriaLabel is not set', () => {
    render(<Carousel {...mockCarouselProps} />);
    expect(screen.getByRole('region', { name: 'Carousel' })).toBeInTheDocument();
  });

  it('render a Skateboard slide Price as a machine-readable <data> element', () => {
    render(<Carousel {...mockCarouselPropsSkateboard} />);
    const data = document.querySelector('data');
    expect(data).toBeInTheDocument();
    expect(data).toHaveAttribute('value', '$149.99');
    expect(data).toHaveTextContent('$149.99');
  });
});
