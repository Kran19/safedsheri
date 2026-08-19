import { getMaintenanceMode } from './actions/maintenance';
import LandingPageClient from './LandingPageClient';
import { MaintenanceScreen } from './components/MaintenanceScreen';

export default async function Page() {
  const isMaintenance = await getMaintenanceMode();

  if (isMaintenance) {
    return <MaintenanceScreen />;
  }

  return <LandingPageClient />;
}
