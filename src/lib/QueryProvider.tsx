import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

// Creamos una instancia del cliente con configuraciones optimizadas para el manejo de datos grandes
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configuraciones optimizadas para el manejo de datos grandes
      staleTime: 1000 * 60 * 5, // 5 minutos antes de considerar los datos obsoletos
      gcTime: 1000 * 60 * 30, // Mantener en caché por 30 minutos (reemplaza cacheTime en v5)
      refetchOnWindowFocus: false, // No recargar al enfocar la ventana
      retry: 1, // Solo intentar una vez más si falla
    },
  },
});

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
} 