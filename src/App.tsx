import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { useApiErrorStore } from '@/stores/useApiErrorStore';
import { AppRoutes } from '@/routes';

function App() {
  const hasError = useApiErrorStore((s) => !!s.error);

  return (
    <>
      <ApiErrorBanner />
      <div className={hasError ? 'pt-12' : undefined}>
        <AppRoutes />
      </div>
    </>
  );
}

export default App;
