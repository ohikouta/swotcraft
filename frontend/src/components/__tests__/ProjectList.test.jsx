import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProjectList from '../ProjectList';

describe('ProjectList', () => {
  it('空リストのときは専用メッセージを表示する', () => {
    render(
      <MemoryRouter>
        <ProjectList projects={[]} />
      </MemoryRouter>
    );
    expect(screen.getByText('プロジェクトはまだありません。')).toBeInTheDocument();
  });

  it('年度ごとにグループ化してプロジェクト名をリンクとして描画する', () => {
    const projects = [
      { id: 1, name: 'Alpha', start_date: '2025-04-01' },
      { id: 2, name: 'Beta', start_date: '2025-08-01' },
      { id: 3, name: 'Gamma', start_date: '2026-01-15' },
    ];

    render(
      <MemoryRouter>
        <ProjectList projects={projects} />
      </MemoryRouter>
    );

    // 年度見出し
    expect(screen.getByRole('heading', { level: 2, name: '2025' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '2026' })).toBeInTheDocument();

    // プロジェクト名がリンクとして表示される
    const alphaLink = screen.getByRole('link', { name: 'Alpha' });
    expect(alphaLink).toHaveAttribute('href', '/projects/1');

    const gammaLink = screen.getByRole('link', { name: 'Gamma' });
    expect(gammaLink).toHaveAttribute('href', '/projects/3');
  });
});
