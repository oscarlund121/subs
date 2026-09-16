import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ColorValue, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  LeagueSpartan_400Regular,
  LeagueSpartan_500Medium,
} from '@expo-google-fonts/league-spartan';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden (fast refresh) — nothing to do.
});

/** Bar height before the device's bottom safe-area inset is added. */
const BAR_HEIGHT = 68;

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * The kit marks the active tab with a filled green chip behind a dark icon,
 * rather than by tinting the icon itself.
 */
function tabIcon(name: IconName, outline: IconName) {
  return ({ focused }: { color: ColorValue; focused: boolean }) => (
    <View style={[styles.chip, focused && styles.chipActive]}>
      <Ionicons
        name={focused ? name : outline}
        size={22}
        color={focused ? Colors.onAccent : Colors.inkSecondary}
      />
    </View>
  );
}

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded, fontError] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    LeagueSpartan_400Regular,
    LeagueSpartan_500Medium,
  });

  useEffect(() => {
    // Hide on error too, otherwise a missing font file leaves a dead splash.
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: Colors.bg },
          tabBarStyle: [
            styles.bar,
            // Sit on the bottom edge, lifted clear of the home indicator.
            {
              height: BAR_HEIGHT + insets.bottom,
              paddingBottom: insets.bottom,
            },
          ],
          tabBarItemStyle: styles.item,
          // The chip carries the state, so the label would only repeat it.
          tabBarShowLabel: false,
          tabBarBackground: () => null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: tabIcon('home', 'home-outline'),
          }}
        />
        <Tabs.Screen
          name="subscriptions"
          options={{
            title: 'Subs',
            tabBarIcon: tabIcon('albums', 'albums-outline'),
          }}
        />
        <Tabs.Screen
          name="inbox"
          options={{
            title: 'Inbox',
            tabBarIcon: tabIcon('mail', 'mail-outline'),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  /**
   * Anchored to the bottom edge with only its top corners rounded — a bar
   * inset on all four sides leaves a gap that scrolling content shows through.
   */
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 0,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    backgroundColor: Colors.fill,
    borderTopWidth: 0,
    ...Shadow.nav,
  },
  item: { height: BAR_HEIGHT },
  chip: {
    width: 52,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: Colors.accent },
});
