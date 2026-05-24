# Authentication Feature Implementation

This implementation plan details the addition of a production-ready, highly robust, and premium authentication system to the monorepo web app `apps/web` integrated with the NestJS API in `apps/api`.

It covers form validation (via React Hook Form + Zod), authentication state management (via Zustand), reusable custom hooks, robust error handling, and a seamless OTP verification user experience.

## User Review Required

> [!IMPORTANT]
> - **Register Form Fields**: I found that the NestJS backend `RegisterDto` strictly requires `displayName` (`@IsNotEmpty()`), but the current template `RegisterForm` only has `email` and `password`. I will modify `RegisterForm` to include a full name/display name input.
> - **OTP Verification UI**: Instead of routing users to a separate screen for OTP validation after registration, we will conditionally render a beautiful 6-digit OTP verification panel in the same card (using the `InputOTP` component already present in the design system). This creates an exceptionally premium, slick, single-page signup flow.
> - **Dashboard Logout integration**: The existing mock dashboard has an `AccountSwitcher` with a "Log out" button. I will connect this button to our real `useLogout` hook so that logging out actually invalidates the session and redirects the user to the login screen.
> - **Target v2 Templates**: We are explicitly integrating this logic directly with the existing templates inside `apps/web/src/app/(main)/auth/v2` (both `login` and `register` pages, as well as the premium v2 `layout.tsx` featuring the `ShaderGradientCanvas`), ensuring the stunning UI and experience is fully functional and production-ready.

## Proposed Changes

---

### Shared Types (`packages/shared-types`)

We need to add full typing for the authentication response tokens and the detailed profile payload (`MeResponseDto`) returned by the NestJS backend to keep our code type-safe.

#### [MODIFY] [index.ts](file:///Users/narak/Documents/narakcode/turbo-repo/life-panel/packages/shared-types/src/index.ts)
- Add definitions for `AuthTokensDto` matching the NestJS structures: `{ accessToken, refreshToken, expiresIn }`.
- Add definitions for `IdentityDto`, `ProfileDto`, `AccountMetadataDto`, and `MeResponseDto` matching the `/auth/me` NestJS profile output.
- Update `User` definition if needed to match the payload.

---

### API Client (`apps/web`)

We will improve the API client to handle validation errors from NestJS centrally and support all the necessary endpoints.

#### [MODIFY] [api-client.ts](file:///Users/narak/Documents/narakcode/turbo-repo/life-panel/apps/web/src/lib/api-client.ts)
- Improve error handling: parse NestJS JSON error payloads (such as custom error messages and arrays of class-validator schema errors) and throw descriptive, user-friendly errors.
- Correct the `authApi.getProfile` endpoint to map to the real backend endpoint `/auth/me` instead of `/auth/profile`.
- Add `verifyEmail(email, code)` and `resendVerification(email)` to the `authApi`.

---

### Authentication Store (`apps/web`)

We will create a global, client-side Zustand store to keep track of user session state.

#### [NEW] [auth-store.ts](file:///Users/narak/Documents/narakcode/turbo-repo/life-panel/apps/web/src/stores/auth/auth-store.ts)
- Set up `useAuthStore` with vanilla Zustand.
- Manage `user` (`MeResponseDto` profile payload or simplified user model), `token`, `isAuthenticated`, `isLoading`, and `error`.
- Export store actions: `setAuth(user, token)`, `clearAuth()`, `setLoading(loading)`, and `setError(error)`.

---

### Reusable Custom Hooks (`apps/web`)

We will create the four requested hooks to isolate authentication actions and state logic.

#### [NEW] [use-login.ts](file:///Users/narak/Documents/narakcode/turbo-repo/life-panel/apps/web/src/hooks/use-login.ts)
- Implement `useLogin` custom hook:
  - Submit email/password login request.
  - On success, persist `auth_token` and `refresh_token` in `localStorage` and client cookies.
  - Fetch profile using `/auth/me`, load it into the Zustand store, display a success toast, and redirect the user to `/dashboard/default`.
  - Handle loading spinner states and error mapping to the form.

#### [NEW] [use-logout.ts](file:///Users/narak/Documents/narakcode/turbo-repo/life-panel/apps/web/src/hooks/use-logout.ts)
- Implement `useLogout` custom hook:
  - Call the `/auth/logout` API.
  - Clean up client storage (`localStorage` tokens, cookies).
  - Clear the Zustand store and reset user state.
  - Redirect the user to `/auth/v2/login` (default login route).

#### [NEW] [use-current-user.ts](file:///Users/narak/Documents/narakcode/turbo-repo/life-panel/apps/web/src/hooks/use-current-user.ts)
- Implement `useCurrentUser` custom hook:
  - Expose `user`, `isAuthenticated`, and `isLoading`.
  - Support automatic session recovery: on initial load, if a token is present in `localStorage` but the store is empty, fetch the user profile dynamically and restore the session in the background.

#### [NEW] [use-auth.ts](file:///Users/narak/Documents/narakcode/turbo-repo/life-panel/apps/web/src/hooks/use-auth.ts)
- Implement `useAuth` hook as an aggregate wrapper exporting:
  - `user`, `isAuthenticated`, `isLoading`, `error`.
  - `login` and `logout` actions.
  - An `initializeSession` helper.

---

### Authentication UI Components (`apps/web`)

We will update the templates to connect them to our state and API.

#### [MODIFY] [login-form.tsx](file:///Users/narak/Documents/narakcode/turbo-repo/life-panel/apps/web/src/app/(main)/auth/_components/login-form.tsx)
- Connect the form to `useLogin` hook.
- Implement proper email & password validation patterns.
- Show dynamic spinner states on the "Login" button using the `Spinner` component (or an animate-spin SVG helper).
- Handle submit errors and trigger Sonner toasts.

#### [MODIFY] [register-form.tsx](file:///Users/narak/Documents/narakcode/turbo-repo/life-panel/apps/web/src/app/(main)/auth/_components/register-form.tsx)
- Add the `displayName` input field to match the backend.
- Connect the form to the registration API (`authApi.register`).
- Render the `InputOTP` component conditionally upon successful signup, locking in the registered email address and letting the user type their 6-digit OTP code directly to verify.
- Call `authApi.verifyEmail` when the OTP is submitted, display a success toast, and return the user to the login screen.

#### [MODIFY] [account-switcher.tsx](file:///Users/narak/Documents/narakcode/turbo-repo/life-panel/apps/web/src/app/(main)/dashboard/_components/sidebar/account-switcher.tsx)
- Call `useLogout` in the "Log out" dropdown menu item onClick handler.
- Connect user display to the authentic Zustand store user (`useCurrentUser`) instead of hardcoded mock active users.

---

### Authentication Layout and Bootstrap Wrapper (`apps/web`)

We will create a provider or boot component that automatically recovers sessions.

#### [NEW] [auth-provider.tsx](file:///Users/narak/Documents/narakcode/turbo-repo/life-panel/apps/web/src/components/auth-provider.tsx)
- Create an `AuthProvider` that wraps routes (specifically the dashboard) to recover user profiles on page reload and guard authenticated routes.

## Verification Plan

### Automated Tests
- Run `pnpm run check` in the monorepo root to verify that there are no lint or compilation errors across the workspace.
- Run `pnpm run build` inside `apps/web` to verify that Next.js static and dynamic optimization compiles successfully.

### Manual Verification
1. Open the signup page, enter details, submit, and confirm that the registration OTP prompt slides into view.
2. Verify invalid and valid email formats and required inputs.
3. Test incorrect OTP submission errors and correct OTP submission.
4. Test login page with incorrect details and verify toast errors.
5. Log in successfully, confirm transition to `/dashboard/default`, and check that the sidebar displays the user's name and avatar.
6. Click the log out button and verify that session tokens are deleted and the page redirects to login.
