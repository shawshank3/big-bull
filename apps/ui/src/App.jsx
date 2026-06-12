import { RouterProvider } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { router } from './routes';
import { useGetMeQuery } from './api/authApi';
import { setUser, clearUser } from './store/slices/authSlice';

/**
 * App root.
 * useGetMeQuery fires on mount and keeps auth state in sync with the server.
 * The HTTP-Only cookie is sent automatically — no localStorage involved.
 * RTK Query handles caching, deduplication, and re-fetching natively.
 */
function App() {
  const dispatch = useDispatch();

  useGetMeQuery(undefined, {
    // On successful response, push the user into Redux
    selectFromResult: ({ data, isSuccess, isError }) => {
      if (isSuccess) dispatch(data ? setUser(data) : clearUser());
      if (isError) dispatch(clearUser());
      return {};
    },
  });

  return <RouterProvider router={router} />;
}

export default App;
