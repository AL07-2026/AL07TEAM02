import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('클릭 이벤트를 전달한다', () => {
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>확인</Button>);
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(handleClick).toHaveBeenCalledOnce();
  });
});
