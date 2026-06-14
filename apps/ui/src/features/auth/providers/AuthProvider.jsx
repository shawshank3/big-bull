import { createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetMeQuery } from '../api/authApi';
import { setUser, clearUser } from '../store/authSlice';

export const AuthContext = createContext({
  isAuthenticated: false,
  isLoading: true,
  user: null,
});

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, user } = useSelector((s) => s.auth);

  useGetMeQuery(undefined, {
    selectFromResult: ({ data, isSuccess, isError }) => {
      if (isSuccess) dispatch(data ? setUser(data) : clearUser());
      if (isError) dispatch(clearUser());
      return {};
    },
  });

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
export default AuthProvider;
