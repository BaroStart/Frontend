import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';

export function MyPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-4">
      <h1 className="mb-6 text-lg font-semibold">마이페이지</h1>
      <Button variant="outline" className="w-full" onClick={handleLogout}>
        로그아웃
      </Button>
    </div>
  );
}
