import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
import { router } from '@/app/router';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
