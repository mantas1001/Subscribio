import type { ReactNode } from 'react';
import Badge from '../../components/ui/Badge';
import BottomNav from '../../components/ui/BottomNav';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import ErrorMessage from '../../components/ui/ErrorMessage';
import Input from '../../components/ui/Input';
import ListRow from '../../components/ui/ListRow';
import Toast from '../../components/ui/Toast';
import TopBar from '../../components/ui/TopBar';

// Role C: /design-system. Shows type scale, colours, spacing, radius,
// and every shared component with its states. Tokens come from tailwind.config;
// no raw colour values are used here.

const typeScale = [
  ['text-eyebrow', 'Eyebrow'],
  ['text-caption', 'Caption'],
  ['text-small', 'Small'],
  ['text-body', 'Body'],
  ['text-base', 'Base'],
  ['text-section', 'Section'],
  ['text-title', 'Title'],
] as const;

const colours = [
  ['canvas', 'bg-canvas', 'App background'],
  ['surface', 'bg-surface', 'Cards, header, tab bar'],
  ['line', 'bg-line', 'Borders, dividers'],
  ['brand', 'bg-brand', 'Primary buttons, active tab'],
  ['brand-ink', 'bg-brand-ink', 'Headings, main text'],
  ['brand-soft', 'bg-brand-soft', 'Note background, avatar'],
  ['brand-accent', 'bg-brand-accent', 'Logo dot, decoration only'],
  ['brand-accent-text', 'bg-brand-accent-text', 'Eyebrow text'],
  ['brand-on-dark', 'bg-brand-on-dark', 'Secondary text on brand'],
  ['muted', 'bg-muted', 'Secondary text'],
  ['warn-bg', 'bg-warn-bg', 'Pending background'],
  ['warn-line', 'bg-warn-line', 'Pending border'],
  ['warn-ink', 'bg-warn-ink', 'Pending text'],
  ['danger', 'bg-danger', 'Decline, cancel, errors'],
  ['danger-line', 'bg-danger-line', 'Danger outline'],
] as const;

const spacing = [
  ['p-gutter', '20px', 'Page padding'],
  ['h-header', '52px', 'Top bar height'],
  ['h-tabbar', '58px', 'Bottom nav height'],
  ['gap-3 / p-3', '12px', 'Common spacing'],
  ['gap-4 / p-4', '16px', 'Common spacing'],
  ['max-w-app', '440px', 'App column width'],
] as const;

const radius = [
  ['rounded-sm', '8px'],
  ['rounded-md', '10px'],
  ['rounded-lg', '12px'],
  ['rounded-xl', '14px'],
  ['rounded-full', '9999px'],
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby={`ds-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <h2 id={`ds-${title.replace(/\s+/g, '-').toLowerCase()}`} className="text-section font-semibold text-brand-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="flex flex-col gap-8 pb-24">
      <TopBar title="Design system" backLabel="Back" />
      <div className="flex flex-col gap-8 px-gutter pt-4">
        <header className="flex flex-col gap-1">
          <p className="text-eyebrow font-medium uppercase text-brand-accent-text">Role C</p>
          <h1 className="text-title font-semibold text-brand-ink">Subscribio design system</h1>
          <p className="text-body text-muted">
            Tokens from tailwind.config; shared components in src/components/ui. Example data only.
          </p>
          <p className="mt-2">
            <Badge tone="warn">Example data</Badge>
          </p>
        </header>

        <Section title="Type scale">
          <Card className="flex flex-col gap-3">
            {typeScale.map(([cls, label]) => (
              <div key={cls} className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-b-0 last:pb-0">
                <span className={`${cls} text-brand-ink`}>{label}</span>
                <code className="text-caption text-muted">{cls}</code>
              </div>
            ))}
          </Card>
        </Section>

        <Section title="Colours">
          <div className="grid grid-cols-1 gap-2">
            {colours.map(([name, cls, use]) => (
              <Card key={name} className="flex items-center gap-3 p-3">
                <span aria-hidden="true" className={`size-9 shrink-0 rounded-md border border-line ${cls}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-small font-medium text-brand-ink">{name}</span>
                  <span className="block text-caption text-muted">{use}</span>
                </span>
                <code className="text-caption text-muted">{cls}</code>
              </Card>
            ))}
          </div>
          <p className="text-small text-muted">
            Contrast is at least 4.5:1 for text. Colour is never the only carrier of meaning; pair
            with labels, icons or text. Focus is always visible.
          </p>
        </Section>

        <Section title="Spacing">
          <Card className="flex flex-col gap-2">
            {spacing.map(([name, value, use]) => (
              <div key={name} className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-b-0 last:pb-0">
                <code className="text-small text-brand-ink">{name}</code>
                <span className="text-caption text-muted">{value}</span>
                <span className="text-caption text-muted">{use}</span>
              </div>
            ))}
          </Card>
        </Section>

        <Section title="Radius">
          <Card className="flex flex-wrap gap-3">
            {radius.map(([name, value]) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <span aria-hidden="true" className={`size-12 border border-line bg-canvas ${name}`} />
                <code className="text-caption text-muted">{name}</code>
                <span className="text-caption text-muted">{value}</span>
              </div>
            ))}
          </Card>
        </Section>

        <Section title="Button">
          <div className="flex flex-col gap-3">
            <p className="text-small text-muted">Variants: primary, secondary, danger. States: default, pressed, disabled, error, focus.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" aria-pressed="true">Pressed</Button>
              <Button variant="secondary" aria-pressed="true">Pressed</Button>
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="secondary" disabled>Disabled</Button>
              <Button variant="danger" disabled>Disabled</Button>
              <Button variant="primary" aria-invalid="true">Error</Button>
              <Button variant="secondary" aria-invalid="true">Error</Button>
            </div>
            <p className="text-caption text-muted">Tab to a button to see the visible focus ring. Pressed uses aria-pressed; error uses aria-invalid.</p>
          </div>
        </Section>

        <Section title="Card">
          <Card>Default card. Rounded, bordered, padded surface.</Card>
          <Card className="border-brand">Card with a custom class.</Card>
        </Section>

        <Section title="ListRow">
          <ul className="overflow-hidden rounded-xl border border-line bg-surface">
            <ListRow chevron leading={<span aria-hidden="true" className="flex size-10 items-center justify-center rounded-md border border-line bg-brand-soft text-base font-semibold text-brand">A</span>}>
              <span className="block text-base font-medium text-brand-ink">Ahrefs</span>
              <span className="block text-caption text-muted">Marketing · renews Nov 21</span>
            </ListRow>
            <ListRow trailing={<span className="text-base font-medium text-brand-ink">€99</span>}>
              <span className="text-base font-medium text-brand-ink">Active</span>
            </ListRow>
            <ListRow chevron={false}>Row without chevron</ListRow>
          </ul>
          <p className="text-caption text-muted">Optional chevron signals tappability; trailing/leading slots supported.</p>
        </Section>

        <Section title="Input">
          <div className="flex flex-col gap-4">
            <Input label="Name" name="demo-name" placeholder="e.g. Sam Rivera" />
            <Input label="Email" name="demo-email" type="email" defaultValue="sam@example.com" />
            <Input label="Email" name="demo-email-error" type="email" defaultValue="drew.cooper@example.com" error="Someone on your team already uses this email. Use a different email address." />
            <Input label="Disabled" name="demo-disabled" defaultValue="Can't edit" disabled />
            <Input label="Required" name="demo-required" required />
            <p className="text-caption text-muted">Labels always rendered; error text linked with aria-describedby; visible focus; invalid styling.</p>
          </div>
        </Section>

        <Section title="Badge">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge tone="brand">Brand</Badge>
            <Badge tone="warn">Pending</Badge>
            <Badge tone="danger">Cancelled</Badge>
            <Badge tone="success">Active</Badge>
          </div>
        </Section>

        <Section title="TopBar">
          <Card className="p-0">
            <TopBar title="Without back" />
          </Card>
          <Card className="p-0">
            <TopBar title="With back" onBack={() => {}} backLabel="Back" trailing={<Badge>Example data</Badge>} />
          </Card>
        </Section>

        <Section title="BottomNav">
          <p className="text-small text-muted">Shared bottom tab bar component (app shell uses its own).</p>
          <BottomNav
            ariaLabel="Demo main"
            items={[
              { label: 'Overview', href: '#/', active: true },
              { label: 'Employees', href: '#/employees' },
              { label: 'Requests', href: '#/requests', count: 1 },
            ]}
          />
          <div className="h-tabbar" />
        </Section>

        <Section title="EmptyState">
          <EmptyState
            title="No employees yet"
            description="Add your first team member."
            action={<Button variant="secondary">Add employee</Button>}
          />
        </Section>

        <Section title="ErrorMessage">
          <ErrorMessage title="Couldn’t add employee" message="Someone on your team already uses this email. Use a different email address." />
          <ErrorMessage title="Something went wrong" message="Try again. Your data hasn't been changed." />
        </Section>

        <Section title="Toast">
          <div className="flex flex-col gap-2">
            <Toast title="Employee added" message="Sam Rivera has been added." variant="success" />
            <Toast message="Saved." variant="default" />
            <Toast title="Couldn’t add employee" message="Duplicate email." variant="error" />
            <Toast message="With dismiss" onDismiss={() => {}} />
          </div>
        </Section>
      </div>
    </div>
  );
}
