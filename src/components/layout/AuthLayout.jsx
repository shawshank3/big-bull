export const AuthLayout = ({ children }) => {
  return (
    <div className="auth-shell">
      <div className="auth-panel">{children}</div>
    </div>
  );
};

export default AuthLayout;
