import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export const AuthCard = ({ title = 'BigBull', description, children }) => (
  <Card>
    <CardHeader className="text-center">
      <CardTitle className="text-3xl text-primary">{title}</CardTitle>
      {description ? <CardDescription>{description}</CardDescription> : null}
    </CardHeader>
    <CardContent className="space-y-6">{children}</CardContent>
  </Card>
);

export default AuthCard;
