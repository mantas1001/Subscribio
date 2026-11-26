import { Link } from 'react-router-dom';

// Temporary placeholder so every route already works. Delete once all real pages exist.
export default function ComingSoon({
  title,
  owner,
  back,
}: {
  title: string;
  owner: string;
  back?: string;
}) {
  return (
    <div className="flex flex-col gap-4 px-gutter pt-6">
      {back && (
        <Link to={back} className="text-small text-brand-ink underline-offset-2 hover:underline">
          ‹ Back
        </Link>
      )}
      <h1 className="text-title font-semibold">{title}</h1>
      <p className="text-body text-muted">This screen is being built ({owner}).</p>
    </div>
  );
}
