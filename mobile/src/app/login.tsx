import * as Linking from 'expo-linking'
import { useState } from 'react'
import { Text, View } from 'react-native'

import { API_URL, isConfigured } from '@/lib/env'
import { supabase } from '@/lib/supabase'
import { Body, Button, Card, H1, Input, Muted, Screen } from '@/ui/primitives'
import { colors, space } from '@/ui/theme'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = async () => {
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (err) setError(err.message)
    setBusy(false)
  }

  return (
    <Screen>
      <View style={{ gap: space.xs, marginTop: space.xl }}>
        <H1>SelfUp</H1>
        <Muted>Sign in with your SelfUp account. Everything works offline after the first sync.</Muted>
      </View>

      {!isConfigured && (
        <Card>
          <Body style={{ color: colors.danger }}>
            App isn’t configured. Set EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY and EXPO_PUBLIC_API_URL in mobile/.env (see .env.example) and rebuild.
          </Body>
        </Card>
      )}

      <Card>
        <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
        <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" onSubmitEditing={signIn} />
        {error && <Text style={{ color: colors.danger }} accessibilityLiveRegion="polite">{error}</Text>}
        <Button label="Sign in" onPress={signIn} loading={busy} disabled={!email || !password} />
      </Card>

      <Muted style={{ textAlign: 'center' }}>
        New here? Create your account and finish onboarding on the website first.
      </Muted>
      {API_URL ? <Button label="Open SelfUp website" variant="ghost" onPress={() => Linking.openURL(`${API_URL}/signup`)} /> : null}
    </Screen>
  )
}
