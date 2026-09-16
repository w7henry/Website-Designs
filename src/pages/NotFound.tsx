import { ButtonLink } from '../components/ui/primitives';

export function NotFound() {
  return (
    <div className="flex min-h-[58vh] items-center justify-center px-8">
      <div className="max-w-[520px] text-center">
        <p className="mono-label">Error 404</p>
        <h1 className="mt-16 font-lyon-display text-[36px] leading-[1.05] text-cloud sm:text-heading-lg">
          This page is not part of your workspace.
        </h1>
        <p className="mt-16 text-body-sm leading-relaxed text-ash">
          The link may be old, or the page moved. Everything you had is still where you left it.
        </p>
        <div className="mt-24 flex flex-wrap items-center justify-center gap-10">
          <ButtonLink to="/dashboard" tone="primary" trailingArrow>
            Back to overview
          </ButtonLink>
          <ButtonLink to="/transactions" tone="ghost">
            Search transactions
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
