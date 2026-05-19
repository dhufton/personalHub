import Link from "next/link";

export function ButtonLink({
  href,
  children,
  variant = "primary"
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link className={`btn${variant === "secondary" ? " secondary" : ""}`} href={href}>
      {children}
    </Link>
  );
}

export function Panel({
  title,
  description,
  action,
  children
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </article>
  );
}

export function ScreenHeader({
  title,
  copy,
  actions
}: {
  title: string;
  copy: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="app-header">
      <div>
        <h1 className="screen-title">{title}</h1>
        <p className="screen-copy">{copy}</p>
      </div>
      {actions ? <div className="toolbar">{actions}</div> : null}
    </section>
  );
}
