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

import { Default as Navigation } from '../../../components/navigation/Navigation';
import { mockNavigationProps } from './Navigation.mockProps';

const pageWithConsumerMode = (mode: 'default' | 'agent') => ({
  mode: { isEditing: false },
  layout: { sitecore: { route: { fields: {} } } },
  consumer: { mode },
});

describe('Navigation Component consumer mode', () => {
  it('renders the interactive checkbox/hamburger markup for default consumer mode', () => {
    useSitecoreMock.mockReturnValue({ page: pageWithConsumerMode('default') });
    render(<Navigation {...mockNavigationProps} />);

    expect(document.querySelector('input[type="checkbox"].menu-mobile-navigate')).toBeInTheDocument();
    expect(document.querySelector('.menu-humburger')).toBeInTheDocument();
  });

  it('renders a flattened, always-expanded nav with no interactive wrapper for agent consumer mode', () => {
    useSitecoreMock.mockReturnValue({ page: pageWithConsumerMode('agent') });
    render(<Navigation {...mockNavigationProps} />);

    expect(document.querySelector('input[type="checkbox"].menu-mobile-navigate')).not.toBeInTheDocument();
    expect(document.querySelector('.menu-humburger')).not.toBeInTheDocument();
  });

  it('exposes the same links in agent mode as in default mode (information parity)', () => {
    useSitecoreMock.mockReturnValue({ page: pageWithConsumerMode('default') });
    const { unmount } = render(<Navigation {...mockNavigationProps} />);
    const defaultHrefs = Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href')).sort();
    unmount();

    useSitecoreMock.mockReturnValue({ page: pageWithConsumerMode('agent') });
    render(<Navigation {...mockNavigationProps} />);
    const agentHrefs = Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href')).sort();

    expect(agentHrefs).toEqual(defaultHrefs);
  });

  it('renders nested children (Team, History) directly in agent mode without needing interaction', () => {
    useSitecoreMock.mockReturnValue({ page: pageWithConsumerMode('agent') });
    render(<Navigation {...mockNavigationProps} />);

    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });
});
