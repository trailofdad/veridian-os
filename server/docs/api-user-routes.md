# User Management API Routes

This document describes the API endpoints available in `server/src/api/user-routes.ts`.

## Base URL
All endpoints are prefixed with `/api`

---

## 👤 User Management Endpoints

### POST /users
Create a new user.

**Request Body:**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "passwordHash": "$2b$10$...",  // Pre-hashed password
  "fullName": "John Doe"          // optional
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "userId": 2
}
```

**Status Codes:** 201 (Created), 500 (Error)

**Note:** Password should be hashed on the client side before sending to this endpoint.

---

### GET /users/:id
Get user information by ID.

**Path Parameters:**
- `id`: User ID

**Response:**
```json
{
  "id": 1,
  "username": "Admin",
  "email": "admin@veridianos.ca",
  "password_hash": "$2b$10$...",
  "full_name": "Veridian Admin",
  "avatar_url": null,
  "is_active": true,
  "is_admin": true,
  "created_at": "2025-01-22T05:00:00Z",
  "updated_at": "2025-01-22T05:00:00Z",
  "last_login_at": null,
  "timezone": "UTC",
  "theme": "light",
  "language": "en"
}
```

**Status Codes:** 200 (OK), 404 (Not Found), 500 (Error)

---

### PUT /users/:id
Update user information.

**Path Parameters:**
- `id`: User ID

**Request Body:**
```json
{
  "username": "updateduser",      // optional
  "email": "new@example.com",     // optional
  "passwordHash": "$2b$10$...",   // optional
  "fullName": "Jane Doe",         // optional
  "isActive": true,               // optional
  "isAdmin": false                // optional
}
```

**Response:**
```json
{
  "message": "User updated successfully"
}
```

**Status Codes:** 200 (OK), 404 (Not Found), 500 (Error)

---

### DELETE /users/:id
Delete a user by ID.

**Path Parameters:**
- `id`: User ID

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

**Status Codes:** 200 (OK), 404 (Not Found), 500 (Error)

**Note:** This is a hard delete that will also cascade delete all user settings due to the foreign key constraint.

---

## ⚙️ User Settings Endpoints

### GET /users/:id/settings
Get all settings for a user.

**Path Parameters:**
- `id`: User ID

**Response:**
```json
{
  "theme": "dark",
  "language": "en",
  "notifications": "enabled",
  "custom_setting": "value"
}
```

**Status Codes:** 200 (OK), 500 (Error)

**Note:** Settings are returned as a flat key-value object for easy frontend consumption.

---

### PUT /users/:id/settings/:key
Create or update a specific user setting.

**Path Parameters:**
- `id`: User ID
- `key`: Setting key (e.g., "theme", "language", "notifications")

**Request Body:**
```json
{
  "value": "dark",
  "type": "string"  // optional, defaults to "string"
}
```

**Response:**
```json
{
  "message": "User setting updated successfully"
}
```

**Status Codes:** 200 (OK), 500 (Error)

**Supported Types:**
- `string` (default)
- `boolean`
- `number`
- `json`

**Example Usage:**
```bash
# Set theme to dark
PUT /api/users/1/settings/theme
Body: {"value": "dark"}

# Set notifications enabled
PUT /api/users/1/settings/notifications
Body: {"value": "true", "type": "boolean"}

# Set custom numeric setting
PUT /api/users/1/settings/refresh_interval
Body: {"value": "30000", "type": "number"}
```

---

### DELETE /users/:id/settings/:key
Delete a specific user setting.

**Path Parameters:**
- `id`: User ID
- `key`: Setting key to delete

**Response:**
```json
{
  "message": "User setting deleted successfully"
}
```

**Status Codes:** 200 (OK), 404 (Setting not found), 500 (Error)

---

## Default User

The system automatically creates a default admin user when the database is first initialized:

**Default Admin User:**
- **Username:** `Admin`
- **Email:** `admin@veridianos.ca`
- **Full Name:** `Veridian Admin`
- **Is Admin:** `true`
- **Is Active:** `true`
- **Default Settings:**
  - `theme`: `dark`

---

## Common User Settings

Here are some commonly used settings keys:

| Setting Key | Type | Description | Example Values |
|-------------|------|-------------|----------------|
| `theme` | string | UI theme preference | `"light"`, `"dark"`, `"auto"` |
| `language` | string | UI language | `"en"`, `"fr"`, `"es"` |
| `timezone` | string | User's timezone | `"UTC"`, `"America/New_York"` |
| `notifications` | boolean | Enable notifications | `true`, `false` |
| `refresh_interval` | number | Data refresh interval (ms) | `30000`, `60000` |
| `dashboard_layout` | json | Dashboard widget layout | `{"widgets": [...]}` |

---

## Error Response Format

All endpoints return errors in this format:
```json
{
  "message": "Error description",
  "error": "Detailed error message"  // optional
}
```

---

## Security Notes

- **Password Handling:** This API expects pre-hashed passwords. Implement proper password hashing on the client side or add middleware for password hashing.
- **Authentication:** Consider implementing authentication middleware to protect user management endpoints.
- **Authorization:** Implement role-based access control to prevent users from modifying other users' data.
- **Input Validation:** Add validation for email formats, username constraints, etc.

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    is_admin BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    timezone TEXT DEFAULT 'UTC',
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'en'
);
```

### User Settings Table
```sql
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type TEXT DEFAULT 'string',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, setting_key)
);
```
