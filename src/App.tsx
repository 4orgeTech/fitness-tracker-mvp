import { useState } from 'react';
import { DataProvider } from '@/context/DataContext';
import { Sidebar, MobileNav } from '@/components/Navigation';
import { DashboardPage } from '@/pages/DashboardPage';
import { WeightPage } from '@/pages/WeightPage';
import { WorkoutsPage } from '@/pages/WorkoutsPage';
import { NutritionPage } from '@/pages/NutritionPage';
import { SettingsPage } from '@/pages/SettingsPage';
import type { Page } from '@/types/app';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPage} />;
      case 'weight':
        return <WeightPage />;
      case 'workouts':
        return <WorkoutsPage />;
      case 'nutrition':
        return <NutritionPage />;
      case 'settings':
        return <SettingsPage />;
    }
  };

  return (
    <DataProvider>
      <div className="min-h-screen bg-[#F7FEE7]">
        <Sidebar current={currentPage} onNavigate={setCurrentPage} />
        <MobileNav current={currentPage} onNavigate={setCurrentPage} />
        <main className="md:ml-60 pb-20 md:pb-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {renderPage()}
          </div>
        </main>
      </div>
    </DataProvider>
  );
}

export default App;
