import { PageDescription, PageTitle } from '@/shared/ui/typography';

export const PageHeader = ({ title, description, actions }) => {
  return (
    <div className="page-header flex flex-wrap items-start justify-between gap-4">
      <div>
        <PageTitle>{title}</PageTitle>
        {description ? <PageDescription>{description}</PageDescription> : null}
      </div>
      {actions ?? null}
    </div>
  );
};

export default PageHeader;
