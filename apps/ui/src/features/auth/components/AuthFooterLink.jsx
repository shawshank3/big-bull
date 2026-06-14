import { Link as RouterLink } from 'react-router-dom';

export const AuthFooterLink = ({ prompt, linkText, to }) => {
  return (
    <p className="text-center text-sm text-muted">
      {prompt}{' '}
      <RouterLink to={to} className="font-bold text-primary hover:underline">
        {linkText}
      </RouterLink>
    </p>
  );
};

export default AuthFooterLink;
