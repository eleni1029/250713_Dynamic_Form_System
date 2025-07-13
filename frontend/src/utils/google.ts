// Google OAuth utilities
declare global {
  interface Window {
    google: any;
  }
}

export interface GoogleAuthResponse {
  credential: string;
  select_by: string;
}

export const initializeGoogleAuth = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window object not available'))
      return
    }

    const checkGoogle = () => {
      if (window.google) {
        resolve()
      } else {
        setTimeout(checkGoogle, 100)
      }
    }

    checkGoogle()
  })
}

export const renderGoogleSignInButton = (
  elementId: string,
  onSuccess: (response: GoogleAuthResponse) => void,
  onError?: (error: any) => void
): void => {
  if (!window.google) {
    console.error('Google Sign-In library not loaded')
    return
  }

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  if (!clientId || clientId === 'your-google-client-id-here') {
    console.error('Google Client ID not configured')
    if (onError) {
      onError(new Error('Google Client ID not configured'))
    }
    return
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: onSuccess,
    auto_select: false,
    cancel_on_tap_outside: true
  })

  window.google.accounts.id.renderButton(
    document.getElementById(elementId),
    {
      theme: 'outline',
      size: 'large',
      width: '100%',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left'
    }
  )
}

export const signInWithGoogleOneTap = (
  onSuccess: (response: GoogleAuthResponse) => void
): void => {
  if (!window.google) {
    console.error('Google Sign-In library not loaded')
    return
  }

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  if (!clientId || clientId === 'your-google-client-id-here') {
    console.error('Google Client ID not configured')
    return
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: onSuccess,
    auto_select: false
  })

  window.google.accounts.id.prompt()
}