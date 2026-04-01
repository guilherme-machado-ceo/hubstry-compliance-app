'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes/dist/types'

export function ThemeProvider(props: ThemeProviderProps): React.ReactElement {
  return <NextThemesProvider {...props} />
}
