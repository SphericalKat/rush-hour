import "../global.css";

import { PortalHost } from "@rn-primitives/portal";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { Suspense, useEffect, useMemo } from "react";
import { ActivityIndicator, Appearance, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useTheme } from "../src/hooks/useTheme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const { colors, scheme } = useTheme();

  // Tell iOS the app-level color scheme so native components
  // (e.g. the iOS 26 floating tab bar) respect the user's in-app choice.
  useEffect(() => {
    Appearance.setColorScheme(scheme);
  }, [scheme]);

  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.separator,
        primary: colors.primary,
      },
    };
  }, [colors, scheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Suspense fallback={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>}>
          <SQLiteProvider
            databaseName="timetable.db"
            assetSource={{ assetId: require('../assets/timetable.db'), forceOverwrite: true }}
            useSuspense
          >
            <BottomSheetModalProvider>
              <StatusBar style="auto" />
              <ThemeProvider value={navTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="train/[number]"
                  options={{
                    headerBackTitle: "Back",
                    headerTitle: "",
                    headerTransparent: true,
                    presentation: "card",
                  }}
                />
              </Stack>
              </ThemeProvider>
              <PortalHost />
            </BottomSheetModalProvider>
          </SQLiteProvider>
        </Suspense>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
