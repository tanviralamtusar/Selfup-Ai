import { Children, useEffect, useRef, useState, type ReactNode } from 'react'
import { Animated, Pressable, StyleSheet, Text, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from 'react-native'

import { colors, radius, space } from '@/ui/theme'

/**
 * Swipeable tabs: a tab header whose underline follows your finger, over
 * horizontally paged content. Swipe the content or tap a tab.
 */
export function SwipeTabs({
  tabs,
  index,
  onIndexChange,
  children,
}: {
  tabs: readonly { key: string; label: string }[]
  index: number
  onIndexChange: (i: number) => void
  children: ReactNode
}) {
  const pages = Children.toArray(children)
  const [width, setWidth] = useState(0)
  const [scrollX] = useState(() => new Animated.Value(0))
  const pager = useRef<ScrollView>(null)
  const n = tabs.length

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width)
    if (w !== width) setWidth(w)
  }

  // Keep the pager on the selected page (initial layout, taps, external changes).
  useEffect(() => {
    if (width > 0) pager.current?.scrollTo({ x: index * width, animated: true })
  }, [index, width])

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return
    const i = Math.round(e.nativeEvent.contentOffset.x / width)
    if (i !== index) onIndexChange(Math.max(0, Math.min(n - 1, i)))
  }

  const tabWidth = width / n
  const indicatorX =
    width > 0 && n > 1
      ? scrollX.interpolate({ inputRange: [0, width * (n - 1)], outputRange: [0, tabWidth * (n - 1)], extrapolate: 'clamp' })
      : 0

  return (
    <View onLayout={onLayout} style={{ gap: space.md }}>
      <View style={styles.header} accessibilityRole="tablist">
        {tabs.map((t, i) => {
          const selected = i === index
          return (
            <Pressable
              key={t.key}
              onPress={() => onIndexChange(i)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={styles.tab}>
              <Text style={[styles.tabText, selected && styles.tabTextOn]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {t.label}
              </Text>
            </Pressable>
          )
        })}
        {width > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[styles.indicator, { width: tabWidth - space.sm * 2, transform: [{ translateX: indicatorX }] }]}
          />
        )}
      </View>

      <Animated.ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={{ alignItems: 'flex-start' }}>
        {pages.map((page, i) => (
          <View key={tabs[i]?.key ?? i} style={{ width: width || undefined }}>
            {page}
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingBottom: 6 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: space.xs },
  tabText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  tabTextOn: { color: colors.text },
  indicator: { position: 'absolute', left: space.sm, bottom: 4, height: 3, borderRadius: radius.pill, backgroundColor: colors.primary },
})
