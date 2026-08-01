import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { FullDemo } from '@site/src/components/Demo/examples';

const NPM = 'https://www.npmjs.com/package/@jugaaadi/folder-tree';
const GITHUB = 'https://github.com/MateenKhan/folder-tree';

const FEATURES: Array<[string, string]> = [
  ['No handler, no control', "A capability you don't wire up doesn't render its affordance. No dead eye icons, no inert drag handles, nothing that invites a click and does nothing."],
  ['Never mutates your tree', 'nodes is yours. The component reads and calls back. moveNodes is a helper you may ignore if your state lives in a store or on a server.'],
  ['Search that auto-expands', 'Matches are revealed wherever they are. Nodes can carry keywords — searchable text that never renders. Clear the box and it collapses back.'],
  ['Real keyboard support', 'role="tree" with the interactions that implies: arrows, Home/End, Enter, Space, F2 to rename, Shift for ranges, Ctrl to toggle.'],
  ['Virtualised past 200 rows', 'Big trees stay responsive without you configuring anything. The threshold is a prop if your rows are unusual.'],
  ['Zero dependencies', 'No runtime deps. React 17+. One CSS file to override or ignore. Pure helpers exported and unit-tested.'],
];

export default function Home() {
  return (
    <Layout
      title="A tree view that doesn't own your data"
      description="A dark-first, dependency-free React tree view with drag-and-drop reordering, search that auto-expands, multi/range select and full keyboard navigation."
    >
      <header className="hero-banner">
        <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 3rem)', marginBottom: '0.5rem' }}>folder-tree</h1>
        <p style={{ fontSize: '1.05rem', color: '#94a3b8', maxWidth: 640, margin: '0 auto' }}>
          A dark-first React tree view. Drag, search, multi-select, keyboard — and nothing renders
          a control you haven't wired up.
        </p>

        {/* The real component. Drag a row. */}
        <div className="hero-demo demo-card">
          <div className="demo-stage">
            <BrowserOnly fallback={<div style={{ height: 300 }} />}>
              {() => <FullDemo />}
            </BrowserOnly>
            <div className="demo-hint">
              Drag a row. Ctrl-click for multi-select. Type in the search box.
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            marginTop: '2rem',
            flexWrap: 'wrap',
          }}
        >
          <Link className="button button--primary button--lg" to="/docs/intro">
            Get started
          </Link>
          <Link className="button button--secondary button--lg" href={GITHUB}>
            GitHub
          </Link>
          <Link className="button button--secondary button--lg" href={NPM}>
            npm
          </Link>
        </div>

        <p style={{ marginTop: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
          <code>npm install @jugaaadi/folder-tree</code>
        </p>
      </header>

      <main className="container margin-vert--xl">
        <div className="row">
          {FEATURES.map(([title, body]) => (
            <div className="col col--4 margin-bottom--lg" key={title}>
              <h3>{title}</h3>
              <p style={{ color: 'var(--ifm-color-emphasis-700)' }}>{body}</p>
            </div>
          ))}
        </div>

        <hr />

        <div className="margin-top--lg">
          <h2>Callbacks are intent, not action</h2>
          <p style={{ maxWidth: 720 }}>
            <code>onDelete</code> fires with the ids the user asked to remove. Nothing has been
            removed. Whether anything is destroyed — and whether it can be undone — is your code's
            decision, not this component's. The same is true of every other callback: it reports
            what was asked for and leaves your data alone.
          </p>
          <p style={{ color: 'var(--ifm-color-emphasis-700)', fontSize: '0.9rem' }}>
            Provided as is, without warranty. If deletions are destructive on your side, confirm
            them and back them up.
          </p>
        </div>
      </main>
    </Layout>
  );
}
