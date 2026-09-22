// Shared mock page object for all component tests
// This eliminates code duplication across test files

import type { Page } from 'lib/component-props';

export const mockPage = {
  layout: {
    sitecore: {
      context: {
        pageEditing: false,
        language: 'en',
      },
      route: {
        fields: {},
      },
    },
  },
  mode: {
    isEditing: false,
    isPreview: false,
  },
  locale: 'en',
  consumer: {
    mode: 'default',
  },
} as unknown as Page;
