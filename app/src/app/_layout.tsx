import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ColorValue, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Type } from '@/constants/theme';

/** Solid icon when selected, outline when not — cheap, legible state. */
type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName, outline: IconName) {
  return ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Ionicons name={focused ? name : outline} size={24} color={color} />
  );
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: Colors.bg },
          tabBarStyle: styles.bar,
          tabBarLabelStyle: styles.label,
          tabBarItemStyle: styles.item,
          tabBarActiveTintColor: Colors.accent,
          tabBarInactiveTintColor: Colors.inkMuted,
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
  bar: {
    backgroundColor: Colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
    paddingTop: 10,
  },
  item: { paddingVertical: 2 },
  label: { ...Type.small, fontSize: 11.5, marginTop: 2 },
});
