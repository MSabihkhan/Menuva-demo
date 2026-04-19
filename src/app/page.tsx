'use client';

import { AppProvider, useApp } from '@/context/AppContext';
import { BackButton } from '@/components/primitives';
import { 
  WelcomeScreen, 
  MenuScreen, 
  DetailScreen, 
  Viewer3DScreen, 
  OrderScreen, 
  WaitingScreen,
  PaymentScreen 
} from '@/components/screens';

function App() {
  const { screen, showPayment, goBack, setScreen } = useApp();

  const handleBack = () => {
    if (showPayment) {
      setScreen('order');
    } else {
      goBack();
    }
  };

  const showBack = screen !== 'welcome' && screen !== 'waiting';
  const showHome = screen === 'waiting';

  return (
    <>
      {screen === 'welcome' && <WelcomeScreen />}
      {screen === 'menu' && <MenuScreen />}
      {screen === 'detail' && <DetailScreen />}
      {screen === 'viewer3d' && <Viewer3DScreen />}
      {screen === 'order' && <OrderScreen />}
      {screen === 'waiting' && <WaitingScreen />}
      {showPayment && <PaymentScreen />}
      
      {showBack && <BackButton onClick={handleBack} />}
    </>
  );
}

export default function HomePage() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}