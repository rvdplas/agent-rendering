import { render, screen } from '@testing-library/react';

const useSitecoreMock = jest.fn();

// Local override of the global jest.setup.js mock so each test can control page.consumer.mode
jest.mock('@sitecore-content-sdk/nextjs', () => ({
  useSitecore: () => useSitecoreMock(),
  Text: ({ field, children, tag, ...props }: { field?: { value?: string }; children?: React.ReactNode; tag?: string }) => {
    const Tag = (tag || 'span') as React.ElementType;
    if (field?.value) {
      return <Tag {...props}>{field.value}</Tag>;
    }
    return <Tag {...props}>{children}</Tag>;
  },
  RichText: ({ field, ...props }: { field?: { value?: string } }) =>
    field?.value ? <div {...props} dangerouslySetInnerHTML={{ __html: field.value }} /> : <div {...props} />,
  NextImage: ({ field, ...props }: { field?: { value?: { src?: string; alt?: string } } }) =>
    field?.value?.src ? <img src={field.value.src} alt={field.value.alt || ''} {...props} /> : <img {...props} />,
  Link: ({ field, children, ...props }: { field?: { value?: { href?: string; text?: string } }; children?: React.ReactNode }) => {
    if (field?.value?.href) {
      return (
        <a href={field.value.href} {...props}>
          {children || field.value.text}
        </a>
      );
    }
    return <span {...props}>{field?.value?.text || ''}</span>;
  },
}));

import { Default as Carousel } from '../../../components/carousel/Carousel';
import { mockCarouselProps } from './Carousel.mockProps';

const pageWithConsumerMode = (mode: 'default' | 'agent') => ({
  mode: { isEditing: false },
  layout: { sitecore: { route: { fields: {} } } },
  consumer: { mode },
});

describe('Carousel Component consumer mode', () => {
  it('renders the interactive shadcn carousel region for default consumer mode', () => {
    useSitecoreMock.mockReturnValue({ page: pageWithConsumerMode('default') });
    render(<Carousel {...mockCarouselProps} />);

    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByText('Previous slide')).toBeInTheDocument();
  });

  it('renders a flattened, non-interactive list with no prev/next controls for agent consumer mode', () => {
    useSitecoreMock.mockReturnValue({ page: pageWithConsumerMode('agent') });
    render(<Carousel {...mockCarouselProps} />);

    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.queryByText('Previous slide')).not.toBeInTheDocument();
  });

  it('keeps the ul/li list structure and all slides in agent mode', () => {
    useSitecoreMock.mockReturnValue({ page: pageWithConsumerMode('agent') });
    render(<Carousel {...mockCarouselProps} />);

    const list = document.querySelector('ul');
    expect(list).toBeInTheDocument();
    expect(list?.querySelectorAll(':scope > li').length).toBe(3);
  });

  it('exposes the same slide links in agent mode as in default mode (information parity)', () => {
    useSitecoreMock.mockReturnValue({ page: pageWithConsumerMode('default') });
    const { unmount } = render(<Carousel {...mockCarouselProps} />);
    const defaultHrefs = Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href')).sort();
    unmount();

    useSitecoreMock.mockReturnValue({ page: pageWithConsumerMode('agent') });
    render(<Carousel {...mockCarouselProps} />);
    const agentHrefs = Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href')).sort();

    expect(agentHrefs).toEqual(defaultHrefs);
  });
});
