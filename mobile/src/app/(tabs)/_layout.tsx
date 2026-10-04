import Ionicons from '@expo/vector-icons/Ionicons'
import { Tabs } from 'expo-router'
import type { ColorValue } from 'react-native'

import { colors } from '@/ui/theme'

type IconName = keyof typeof Ionicons.glyphMap

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={icon} color={color} size={size} />,
})

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="index" options={tab('Dashboard', 'grid-outline')} />
      <Tabs.Screen name="money" options={tab('Money', 'wallet-outline')} />
      <Tabs.Screen name="time" options={tab('Time', 'timer-outline')} />
      <Tabs.Screen name="analysis" options={tab('Analysis', 'stats-chart-outline')} />
    </Tabs>
  )
}
