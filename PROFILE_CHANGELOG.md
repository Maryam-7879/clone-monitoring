# Changelog — Profile Integration (Frontend-only)

- Updated: src/services/api.auth.ts
  - Added `changePassword(oldPassword, newPassword)`
  - Ensured AUTH_API points to `/survay/api/auth_api.php`
  - Kept `me()` behavior consistent with API envelope

- Updated: src/components/pages/Profile.tsx
  - Wired submit handler to call `changePassword`
  - Added redirect to `/login` after success
  - Error/success toasts hooked to real API responses

No backend files are included in this package, as requested.
