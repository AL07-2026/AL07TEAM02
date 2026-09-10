import { render, waitFor } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LandingPage } from '@/app/App';

class IntersectionObserverMock implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly scrollMargin = '0px';
  readonly thresholds = [];

  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
}

describe('tracking landing routes', () => {
  const scrollIntoView = vi.fn();
  const originalScrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
    Element.prototype,
    'scrollIntoView',
  );

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    scrollIntoView.mockReset();
    if (originalScrollIntoViewDescriptor) {
      Object.defineProperty(Element.prototype, 'scrollIntoView', originalScrollIntoViewDescriptor);
    } else {
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
    }
  });

  it('keeps a valid tracking path and scrolls to the interest topics section', async () => {
    const router = createMemoryRouter([{ path: '*', Component: LandingPage }], {
      initialEntries: ['/t/01'],
    });

    render(<RouterProvider router={router} />);

    expect(router.state.location.pathname).toBe('/t/01');
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' }));
  });

  it('does not scroll unmatched tracking paths', async () => {
    const router = createMemoryRouter([{ path: '*', Component: LandingPage }], {
      initialEntries: ['/t/11'],
    });

    render(<RouterProvider router={router} />);

    await waitFor(() => expect(document.getElementById('interest-topics')).toBeInTheDocument());
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
