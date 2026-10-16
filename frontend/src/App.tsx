import { RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { router } from './router';

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
