# Authentication Feature Implementation Checklist

- [x] 1. Define Authentication Types & DTOs in `@repo/shared-types`
- [x] 2. Update `api-client.ts` with centralized error handling & auth endpoint mappings
- [x] 3. Create Zustand store `auth-store.ts` for authentication state
- [x] 4. Create custom hooks: `useLogin`, `useLogout`, `useCurrentUser`, `useAuth`
- [x] 5. Implement root `AuthProvider` / session recovery boot component
- [x] 6. Integrate `LoginForm` with validation, spinner state, and hook logic
- [x] 7. Integrate `RegisterForm` with `displayName`, registration API, and inline sliding OTP `InputOTP` verification
- [x] 8. Connect the dashboard sidebar's "Log out" button and display current user profile
- [x] 9. Verify builds and correctness
