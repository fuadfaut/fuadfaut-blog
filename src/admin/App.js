import React from 'react'
import ReactDOM from 'react-dom'
import { TinaAdmin, TinaProvider } from 'tinacms'
import { TinaCloudScheme } from '@tinacms/datalayer'
import { GitProvider } from 'react-tinacms-git'

// Import your Tina config
import tinaConfig from '../../tina/config'

// Create a GitProvider component for local development
const App = () => {
  return (
    <TinaProvider
      clientId={tinaConfig.clientId}
      branch={tinaConfig.branch}
      isLocalClient={typeof window !== 'undefined' && window.location.hostname === 'localhost'}
      data={{
        get: (relativePath) => {
          // This is a simplified data fetching implementation
          // In a real setup, this would connect to your data layer
          return fetch(`/___tina/data/${relativePath}`)
            .then(res => res.json())
            .catch(() => ({}))
        },
        put: (relativePath, data) => {
          // This is a simplified data saving implementation
          // In a real setup, this would connect to your data layer
          return fetch(`/___tina/data/${relativePath}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
        }
      }}
    >
      <GitProvider
        onLogin={() => {
          // Handle login if needed
        }}
        onLogout={() => {
          // Handle logout if needed
        }}
        user={null} // Will be populated when authenticated
      >
        <TinaAdmin
          schema={tinaConfig.schema}
          // Add other necessary props based on your configuration
        />
      </GitProvider>
    </TinaProvider>
 )
}

// Initialize the app
export const initTinaCMS = () => {
  if (typeof window !== 'undefined') {
    // Only run in browser environment
    const rootElement = document.getElementById('tina-admin')
    if (rootElement) {
      ReactDOM.render(<App />, rootElement)
    }
  }
}

// Export the App component as default for direct usage
export default App