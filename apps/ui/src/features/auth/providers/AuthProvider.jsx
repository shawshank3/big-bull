import { createContext, useContext } from 'react';
import { useSelector } from 'react-redux';
import { useGetMeQuery } from '../api/authApi';
import { selectAuthState } from '../store/authSelectors';

export const AuthContext = createContext({
  isAuthenticated: false,
  isLoading: true,
  user: null,
});

export const AuthProvider = ({ children }) => {
  useGetMeQuery();
  const { isAuthenticated, isLoading, user } = useSelector(selectAuthState);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
export default AuthProvider;
