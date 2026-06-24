import { PageDescription, PageTitle } from '@/shared/ui/typography';

export const PageHeader = ({ title, description, actions }) => {
  return (
    <div className="page-header flex flex-wrap items-start justify-between gap-4 relative z-10">
      <div className="min-w-0">
        <PageTitle>{title}</PageTitle>
        {description ? <PageDescription>{description}</PageDescription> : null}
      </div>
      {actions ? <div className="ml-auto shrink-0">{actions}</div> : null}
    </div>
  );
};

export default PageHeader;
