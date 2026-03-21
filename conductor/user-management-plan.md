# Plan: Implement User Management Feature

This plan outlines the steps to create a user management page, accessible only by users with the `super_admin` role. The feature will include a reusable form for creating and editing users, and all data operations will be handled via `@angular/fire`.

## 1. Data Seeding (Manual First Step)

- Before the application is deployed, the Firestore `users` collection must be manually seeded with the first `super_admin` user.
- **Collection:** `users`
- **Document ID:** The `uid` obtained after creating the user in Firebase Authentication.
- **Data:**
  ```json
  {
    "uid": "FIREBASE_AUTH_UID",
    "email": "admin@admin.com",
    "displayName": "Super Admin",
    "role": "super_admin",
    "assignedZoneIds": [],
    "isActive": true,
    "createdAt": "SERVER_TIMESTAMP",
    "updatedAt": "SERVER_TIMESTAMP"
  }
  ```

## 2. Core Services & Guards

### a. `AuthService` (`src/app/core/auth/auth.service.ts`)
- A service to manage the application's authentication state.
- It will expose an observable `currentUser$` that emits the currently logged-in user's data from Firestore, including their role.
- It will include `login()` and `logout()` methods that interact with Firebase Authentication.

### b. `UsersService` (`src/app/features/users/services/users.service.ts`)
- A dedicated service for all user-related Firestore operations.
- **Methods:**
  - `getUsers()`: Fetches all users from the `users` collection.
  - `addUser(userData)`: Creates a new user in Firebase Authentication and adds their corresponding document to the `users` collection in Firestore. This will be wrapped in a Cloud Function for security.
  - `updateUser(userId, userData)`: Updates a user document in Firestore.

### c. Role Guard (`src/app/core/auth/role.guard.ts`)
- An Angular route guard to protect routes based on user roles.
- It will check the `currentUser$` from `AuthService`.
- It will be configured to allow access only if the user's role matches the one specified in the route data (e.g., `super_admin`).

## 3. Reusable User Form Component

- **Location:** `src/app/features/users/user-form/user-form.component.ts`
- This will be a standalone, `OnPush` component.
- It will use Angular's Reactive Forms and PrimeNG form components (`p-input-text`, `p-password`, `p-dropdown`).
- **Inputs:** `user` (for editing an existing user)
- **Outputs:** `save` (emits the form data)
- **Fields:**
  - `displayName`: `string`
  - `email`: `string`
  - `phone`: `string`
  - `password`: `string` (only for new users)
  - `role`: `UserRole` (dropdown)
  - `assignedZoneIds`: `string[]` (multi-select dropdown)

## 4. Users Management Page

- **Location:** `src/app/features/users/users-list/users-list.component.ts`
- This page will display a list of all users in a PrimeNG `p-table`.
- It will include a button to open a `p-dialog` containing the `UserFormComponent` for adding a new user.
- Each row in the table will have an "Edit" button that opens the same dialog to edit an existing user.

## 5. Routing

- The `app.routes.ts` file will be updated to include the new `/users` route.
- This route will be protected by the `RoleGuard`, configured to only allow access for `super_admin`.

```typescript
// src/app/app.routes.ts
// ... (inside the shell component's children)
{
  path: 'users',
  loadComponent: () => import('./features/users/users-list/users-list.component').then(m => m.UsersListComponent),
  canActivate: [() => inject(RoleGuard).canActivate(['super_admin'])],
},
```

## 6. Translations

- New keys will be added to `public/assets/i18n/ar.json` and `public/assets/i18n/en.json` for all labels, placeholders, and messages related to the user management feature, following the `translateFeatureAction` camelCase convention.
- **Example Keys:** `translateUserAdd`, `translateUserEdit`, `translateUserName`, `translateUserRole`, `translateUserPhone`.

## 7. UI/UX Updates

- The main sidebar navigation in `SidebarComponent` will be updated. The "Users" link will be conditionally rendered using `@if` based on the current user's role from `AuthService`.
  ```typescript
  // src/app/layout/sidebar/sidebar.component.ts
  // This will require passing the user role signal to the sidebar
  @if (userRole() === 'super_admin') {
    <a routerLink="/users" class="nav-item">...</a>
  }
  ```

This plan ensures a secure, scalable, and maintainable implementation of the user management feature, adhering to the project's existing architecture and standards.
