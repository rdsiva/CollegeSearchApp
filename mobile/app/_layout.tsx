import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '@/context/SessionContext';
import { CompareProvider } from '@/context/CompareContext';
import { ChatProvider } from '@/context/ChatContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <CompareProvider>
          <ChatProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="college/[code]"
                options={{ title: 'College Detail', headerBackTitle: 'Back' }}
              />
              <Stack.Screen
                name="chat"
                options={{ presentation: 'modal', title: 'College Buddy', headerBackTitle: 'Close' }}
              />
            </Stack>
          </ChatProvider>
        </CompareProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
