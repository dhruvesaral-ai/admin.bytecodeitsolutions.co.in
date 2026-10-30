export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type FieldDefinition = {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
  example?: string | number | boolean | Record<string, unknown> | unknown[] | null;
};

export type ResponseDefinition = {
  status: number;
  description: string;
  exampleJson: string;
};

export type ApiEndpoint = {
  id: string;
  category: string;
  method: HttpMethod;
  path: string;
  title: string;
  description: string;
  headers?: Record<string, string>;
  queryParams?: FieldDefinition[];
  requestBody?: {
    contentType?: string;
    description?: string;
    fields: FieldDefinition[];
    exampleJson?: string;
  };
  responses: ResponseDefinition[];
};

export type ApiCategory = {
  id: string;
  name: string;
  description: string;
};

export const API_CATEGORIES: ApiCategory[] = [
  { id: "users", name: "Users & Auth", description: "System user accounts and access credentials" },
  { id: "roles", name: "Roles & RBAC", description: "Authorization roles and permission management" },
  { id: "profiles", name: "Profiles", description: "Student & user personal details and avatars" },
  { id: "addresses", name: "Addresses", description: "Postal addresses linked to user profiles" },
  { id: "courses", name: "Courses", description: "Curriculum courses, pricing, and technology tags" },
  { id: "course-modules", name: "Course Modules", description: "Syllabus modules associated with courses" },
  { id: "course-categories", name: "Course Categories", description: "Category taxonomy for course offerings" },
  { id: "batches", name: "Batches", description: "Academic batches for scheduled student cohorts" },
  { id: "registrations", name: "Registrations", description: "Student course & batch registrations" },
  { id: "enrollments", name: "Enrollments", description: "Confirmed student enrollments & numbers" },
  { id: "payments", name: "Payments", description: "Fee transactions, UPI proofs, and verifications" },
  { id: "leads", name: "Leads & CRM", description: "Prospective student inquiries, call logs, and remarks" },
  { id: "carousals", name: "Carousals", description: "Website hero and banner carousal containers" },
  { id: "carousel-slides", name: "Carousel Slides", description: "Individual slides, background images, and CTAs" },
  { id: "pages", name: "CMS Pages", description: "Dynamic page builder contents by route name with visit counters" },
  { id: "page-clicks", name: "Page Clicks", description: "Click counters for individual CTA fields on a page" },
  { id: "projects", name: "Projects", description: "Portfolio projects with short and long descriptions and cover images" },
  { id: "testimonials", name: "Testimonials", description: "Student and client reviews with company branding" },
  { id: "success-stories", name: "Success Stories", description: "Student video testimonies and showcase stories" },
  { id: "settings", name: "Settings", description: "Company branding, contact numbers, and registered address" },
  { id: "uploads", name: "File Uploads", description: "Media image, PDF document, and video upload handlers" },
];

export const API_ENDPOINTS: ApiEndpoint[] = [
  // ================= AUTH (MSG91 & SESSIONS) =================
  {
    id: "auth-send-otp",
    category: "users",
    method: "POST",
    path: "/api/auth/send-otp",
    title: "Send OTP via MSG91",
    description: "Sends an OTP via MSG91 SMS API. Supports template parameters, custom OTP, expiry, and phone normalization.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "mobile", type: "string", required: true, description: "Recipient mobile phone number (with or without country code)", example: "9876543210" },
        { name: "callingFrom", type: "string", required: false, description: "Origin client portal (e.g. 'admin'). When set to 'admin', only pre-registered staff (non-student) can request OTP.", example: "admin" },
        { name: "template_id", type: "string", required: false, description: "Override MSG91 template ID (defaults to ENV template ID)" },
        { name: "otp_expiry", type: "number", required: false, description: "OTP validity duration in minutes (default: 15)", example: 15 },
        { name: "otp_length", type: "number", required: false, description: "Number of digits (4 to 9, default: 4)", example: 4 },
        { name: "params", type: "object", required: false, description: "Key-value dictionary for template variables (e.g. Param1, Param2)", example: { Param1: "value1" } },
      ],
      exampleJson: JSON.stringify({
        mobile: "9876543210",
        callingFrom: "admin",
        params: { Param1: "value1" },
      }, null, 2),
    },
    responses: [
      {
        status: 200,
        description: "OTP sent successfully",
        exampleJson: JSON.stringify({ success: true, message: "OTP sent successfully", type: "success", mobile: "919876543210" }, null, 2),
      },
      {
        status: 400,
        description: "Invalid input or MSG91 error",
        exampleJson: JSON.stringify({ error: "Invalid mobile number format" }, null, 2),
      },
    ],
  },
  {
    id: "auth-verify-otp",
    category: "users",
    method: "POST",
    path: "/api/auth/verify-otp",
    title: "Verify OTP & Issue Session",
    description: "Verifies the entered OTP with MSG91. On success, creates/finds the user, records the AuthSession, and issues short-lived JWT (15m) and refresh token (30d).",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "mobile", type: "string", required: true, description: "Recipient mobile phone number", example: "9876543210" },
        { name: "otp", type: "string", required: true, description: "OTP code entered by user", example: "1234" },
      ],
      exampleJson: JSON.stringify({ mobile: "9876543210", otp: "1234" }, null, 2),
    },
    responses: [
      {
        status: 200,
        description: "OTP verified, returns tokens and sets auth cookies",
        exampleJson: JSON.stringify({
          success: true,
          message: "OTP verified successfully",
          accessToken: "eyJhbGciOiJIUzI1NiIs...",
          refreshToken: "eyJhbGciOiJIUzI1NiIs...",
          user: { id: "usr_abc123", username: "919876543210", status: "active", role: null, profile: null },
        }, null, 2),
      },
      {
        status: 400,
        description: "Incorrect or expired OTP",
        exampleJson: JSON.stringify({ error: "OTP not match" }, null, 2),
      },
    ],
  },
  {
    id: "auth-resend-otp",
    category: "users",
    method: "POST",
    path: "/api/auth/resend-otp",
    title: "Resend / Retry OTP",
    description: "Retries delivering the OTP via SMS ('text') or voice call ('voice') using MSG91 retry API.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "mobile", type: "string", required: true, description: "Recipient mobile phone number", example: "9876543210" },
        { name: "retrytype", type: "string", required: false, default: "text", description: "'text' for SMS retry or 'voice' for voice call", example: "text" },
      ],
      exampleJson: JSON.stringify({ mobile: "9876543210", retrytype: "text" }, null, 2),
    },
    responses: [
      {
        status: 200,
        description: "Retry triggered successfully",
        exampleJson: JSON.stringify({ success: true, message: "retry send successfully", type: "success", retrytype: "text", mobile: "919876543210" }, null, 2),
      },
    ],
  },
  {
    id: "auth-refresh",
    category: "users",
    method: "POST",
    path: "/api/auth/refresh",
    title: "Refresh Access Token",
    description: "When the short-lived access token expires, validates the user's active session in the database with the refresh token and issues a brand new access token.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "refreshToken", type: "string", required: false, description: "Refresh token (can alternatively be sent in x-refresh-token header or cookie)", example: "eyJhbGciOiJIUzI1NiIs..." },
        { name: "rotateRefreshToken", type: "boolean", required: false, default: "false", description: "Whether to rotate the refresh token as well" },
      ],
      exampleJson: JSON.stringify({ refreshToken: "eyJhbGciOiJIUzI1NiIs..." }, null, 2),
    },
    responses: [
      {
        status: 200,
        description: "New access token issued successfully",
        exampleJson: JSON.stringify({
          success: true,
          message: "New access token issued successfully",
          accessToken: "eyJhbGciOiJIUzI1NiIs...",
          refreshToken: "eyJhbGciOiJIUzI1NiIs...",
          user: { id: "usr_abc123", username: "919876543210", status: "active" },
        }, null, 2),
      },
      {
        status: 401,
        description: "Session expired or revoked",
        exampleJson: JSON.stringify({ error: "Session not found or has been revoked" }, null, 2),
      },
    ],
  },
  {
    id: "auth-session",
    category: "users",
    method: "GET",
    path: "/api/auth/session",
    title: "Get Current Session & User",
    description: "Validates current request authentication. If short-lived JWT is expired, automatically checks database session and returns refreshed token.",
    responses: [
      {
        status: 200,
        description: "Session validated",
        exampleJson: JSON.stringify({
          success: true,
          user: { id: "usr_abc123", username: "919876543210", status: "active" },
          refreshed: false,
        }, null, 2),
      },
    ],
  },
  {
    id: "auth-logout",
    category: "users",
    method: "POST",
    path: "/api/auth/logout",
    title: "Logout User Session",
    description: "Revokes the active AuthSession from database and clears HTTP-only authentication cookies.",
    responses: [
      {
        status: 200,
        description: "Logged out successfully",
        exampleJson: JSON.stringify({ success: true, message: "Logged out successfully" }, null, 2),
      },
    ],
  },
  // ================= USERS =================
  {
    id: "users-list",
    category: "users",
    method: "GET",
    path: "/api/users",
    title: "List Users",
    description: "Fetch a list of registered users with optional filters by username, role, or status.",
    queryParams: [
      { name: "username", type: "string", required: false, description: "Filter by exact or partial username / phone" },
      { name: "roleId", type: "string", required: false, description: "Filter by attached Role ID" },
      { name: "status", type: "string", required: false, description: "active | inactive" },
    ],
    responses: [
      {
        status: 200,
        description: "List of user accounts retrieved successfully",
        exampleJson: JSON.stringify({
          data: [
            {
              id: "usr_cm101abc",
              username: "9876543210",
              status: "active",
              roleId: "role_student123",
              createdAt: "2026-10-25T12:00:00.000Z",
              updatedAt: "2026-10-25T12:00:00.000Z",
              role: { id: "role_student123", name: "Student", slug: "student" },
              profile: { id: "prof_456", name: "Aarav Sharma", email: "aarav@example.com" },
            },
          ],
        }, null, 2),
      },
    ],
  },
  {
    id: "users-create",
    category: "users",
    method: "POST",
    path: "/api/users",
    title: "Create User",
    description: "Register a new user account with unique username/phone credentials and an optional role.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "username", type: "string", required: true, description: "10-digit mobile number, saved in backend with 91 prefix", example: "9876543210" },
        { name: "roleId", type: "string | null", required: false, description: "ID of the Role to assign", example: "cmvntewju000810vw8vabpoym" },
        { name: "status", type: "string", required: false, default: "active", description: "'active' or 'inactive'", example: "active" },
      ],
      exampleJson: JSON.stringify({
        username: "9876543210",
        roleId: "cmvntewju000810vw8vabpoym",
        status: "active",
      }, null, 2),
    },
    responses: [
      {
        status: 201,
        description: "User account created successfully",
        exampleJson: JSON.stringify({
          data: {
            id: "usr_cmvntgetn000910vwq7a0bjca",
            username: "919876543210",
            status: "active",
            roleId: "cmvntewju000810vw8vabpoym",
            createdAt: "2026-10-25T12:40:59.147Z",
            updatedAt: "2026-10-25T12:40:59.147Z",
          },
        }, null, 2),
      },
      {
        status: 409,
        description: "Conflict: A user with this username already exists",
        exampleJson: JSON.stringify({ error: "A user with this username already exists" }, null, 2),
      },
    ],
  },
  {
    id: "users-get-id",
    category: "users",
    method: "GET",
    path: "/api/users/[id]",
    title: "Get User By ID",
    description: "Retrieve a single user's detailed information including role and linked profile.",
    responses: [
      {
        status: 200,
        description: "User details",
        exampleJson: JSON.stringify({
          data: {
            id: "usr_123",
            username: "919876543210",
            status: "active",
            roleId: "role_student",
            role: { id: "role_student", name: "Student", slug: "student" },
            profile: { id: "prof_123", name: "Aarav Sharma", email: "aarav@example.com" },
          },
        }, null, 2),
      },
      {
        status: 404,
        description: "User not found",
        exampleJson: JSON.stringify({ error: "User not found" }, null, 2),
      },
    ],
  },
  {
    id: "users-patch-id",
    category: "users",
    method: "PATCH",
    path: "/api/users/[id]",
    title: "Update User",
    description: "Update a user's username, role assignment, or active status.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "username", type: "string", required: false, description: "New unique username or phone number" },
        { name: "roleId", type: "string | null", required: false, description: "Role ID to connect, or null to disconnect" },
        { name: "status", type: "string", required: false, description: "'active' | 'inactive'" },
      ],
      exampleJson: JSON.stringify({ status: "active", roleId: "role_student123" }, null, 2),
    },
    responses: [
      {
        status: 200,
        description: "User updated successfully",
        exampleJson: JSON.stringify({
          data: { id: "usr_123", username: "919876543210", status: "active", roleId: "role_student123" },
        }, null, 2),
      },
      { status: 404, description: "User not found", exampleJson: JSON.stringify({ error: "User not found" }, null, 2) },
      { status: 409, description: "Username already in use", exampleJson: JSON.stringify({ error: "A user with this username already exists" }, null, 2) },
    ],
  },
  {
    id: "users-delete-id",
    category: "users",
    method: "DELETE",
    path: "/api/users/[id]",
    title: "Delete User",
    description: "Remove a user account. Cascades deletion to profile, addresses, and registrations.",
    responses: [
      { status: 200, description: "Deleted successfully", exampleJson: JSON.stringify({ data: { id: "usr_123" } }, null, 2) },
      { status: 404, description: "User not found", exampleJson: JSON.stringify({ error: "User not found" }, null, 2) },
    ],
  },

  // ================= ROLES =================
  {
    id: "roles-list",
    category: "roles",
    method: "GET",
    path: "/api/roles",
    title: "List Roles",
    description: "Retrieve all permission roles with total associated user counts.",
    responses: [
      {
        status: 200,
        description: "List of roles",
        exampleJson: JSON.stringify({
          data: [
            { id: "cmvntewju000810vw8vabpoym", name: "Student", slug: "student", _count: { users: 14 } },
            { id: "cmvnte_admin", name: "Administrator", slug: "admin", _count: { users: 2 } },
          ],
        }, null, 2),
      },
    ],
  },
  {
    id: "roles-create",
    category: "roles",
    method: "POST",
    path: "/api/roles",
    title: "Create Role",
    description: "Create a new role with a human-readable name and unique slug.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "name", type: "string", required: true, description: "Role display name (e.g. Student, Instructor, Admin)", example: "Instructor" },
        { name: "slug", type: "string", required: true, description: "Unique URL/identifier slug (e.g. instructor)", example: "instructor" },
      ],
      exampleJson: JSON.stringify({ name: "Instructor", slug: "instructor" }, null, 2),
    },
    responses: [
      {
        status: 201,
        description: "Role created",
        exampleJson: JSON.stringify({ data: { id: "cmv_inst_123", name: "Instructor", slug: "instructor" } }, null, 2),
      },
      { status: 409, description: "Conflict: Slug already taken", exampleJson: JSON.stringify({ error: "A role with this slug already exists" }, null, 2) },
    ],
  },
  {
    id: "roles-get-id",
    category: "roles",
    method: "GET",
    path: "/api/roles/[id]",
    title: "Get Role By ID",
    description: "Get detailed information about a role.",
    responses: [
      { status: 200, description: "Role found", exampleJson: JSON.stringify({ data: { id: "role_123", name: "Student", slug: "student" } }, null, 2) },
      { status: 404, description: "Role not found", exampleJson: JSON.stringify({ error: "Role not found" }, null, 2) },
    ],
  },
  {
    id: "roles-patch-id",
    category: "roles",
    method: "PATCH",
    path: "/api/roles/[id]",
    title: "Update Role",
    description: "Modify an existing role's name or slug.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "name", type: "string", required: false, description: "New display name" },
        { name: "slug", type: "string", required: false, description: "New unique slug" },
      ],
      exampleJson: JSON.stringify({ name: "Senior Student", slug: "senior-student" }, null, 2),
    },
    responses: [
      { status: 200, description: "Role updated", exampleJson: JSON.stringify({ data: { id: "role_123", name: "Senior Student", slug: "senior-student" } }, null, 2) },
    ],
  },
  {
    id: "roles-delete-id",
    category: "roles",
    method: "DELETE",
    path: "/api/roles/[id]",
    title: "Delete Role",
    description: "Remove a role. Users assigned to this role will have their role cleared.",
    responses: [
      { status: 200, description: "Role deleted", exampleJson: JSON.stringify({ data: { id: "role_123" } }, null, 2) },
    ],
  },

  // ================= PROFILES =================
  {
    id: "profiles-list",
    category: "profiles",
    method: "GET",
    path: "/api/profiles",
    title: "List Profiles",
    description: "Fetch student/user profiles with linked user credentials and addresses.",
    queryParams: [
      { name: "userId", type: "string", required: false, description: "Filter by 1:1 linked User ID" },
      { name: "email", type: "string", required: false, description: "Filter by student email" },
      { name: "status", type: "string", required: false, description: "active | inactive" },
    ],
    responses: [
      {
        status: 200,
        description: "List of profiles",
        exampleJson: JSON.stringify({
          data: [
            {
              id: "cmvnth5ak000a10vwuf3c3jom",
              userId: "cmvntgetn000910vwq7a0bjca",
              name: "Aarav Sharma",
              email: "aarav@example.com",
              status: "active",
              profileImgUrl: null,
              user: { id: "cmvntgetn000910vwq7a0bjca", username: "919876543210" },
              addresses: [{ id: "addr_1", city: "Kota", state: "Rajasthan" }],
            },
          ],
        }, null, 2),
      },
    ],
  },
  {
    id: "profiles-create",
    category: "profiles",
    method: "POST",
    path: "/api/profiles",
    title: "Create or Upsert Profile",
    description: "Idempotent profile creation. If a profile already exists for the given userId, updates it in-place without relation conflicts.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "userId", type: "string", required: true, description: "Target User ID (required 1:1 relation)", example: "cmvntgetn000910vwq7a0bjca" },
        { name: "name", type: "string", required: true, description: "Student's full name", example: "Aarav Sharma" },
        { name: "email", type: "string", required: true, description: "Valid email address", example: "aarav@example.com" },
        { name: "status", type: "string", required: false, default: "active", description: "'active' | 'inactive'", example: "active" },
        { name: "profileImgUrl", type: "string | null", required: false, description: "Public URL to avatar/photo", example: "https://example.com/avatar.jpg" },
      ],
      exampleJson: JSON.stringify({
        userId: "cmvntgetn000910vwq7a0bjca",
        name: "Aarav Sharma",
        email: "aarav@example.com",
        status: "active",
      }, null, 2),
    },
    responses: [
      {
        status: 201,
        description: "Profile created or upserted cleanly",
        exampleJson: JSON.stringify({
          data: {
            id: "cmvnth5ak000a10vwuf3c3jom",
            userId: "cmvntgetn000910vwq7a0bjca",
            name: "Aarav Sharma",
            email: "aarav@example.com",
            status: "active",
            profileImgUrl: null,
          },
        }, null, 2),
      },
      { status: 400, description: "Invalid email, missing name, or user does not exist", exampleJson: JSON.stringify({ error: "userId does not match an existing user" }, null, 2) },
    ],
  },
  {
    id: "profiles-get-id",
    category: "profiles",
    method: "GET",
    path: "/api/profiles/[id]",
    title: "Get Profile By ID",
    description: "Retrieve complete profile information with registrations, enrollments, payments, and addresses.",
    responses: [
      {
        status: 200,
        description: "Complete profile retrieved",
        exampleJson: JSON.stringify({
          data: {
            id: "prof_123",
            name: "Aarav Sharma",
            email: "aarav@example.com",
            user: { username: "919876543210" },
            registrations: [{ id: "reg_1", registrationNo: "REG_BATCH_2026_A_AARAV_SHARMA" }],
            enrollments: [],
            payments: [{ id: "pay_1", rupees: 500, isVerified: true }],
            addresses: [{ addressLine: "Bansal Tower", city: "Kota", pincode: "324005" }],
          },
        }, null, 2),
      },
    ],
  },
  {
    id: "profiles-patch-id",
    category: "profiles",
    method: "PATCH",
    path: "/api/profiles/[id]",
    title: "Update Profile",
    description: "Modify profile name, email, avatar image, or active status.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "name", type: "string", required: false, description: "Full name" },
        { name: "email", type: "string", required: false, description: "Valid email address" },
        { name: "status", type: "string", required: false, description: "'active' | 'inactive'" },
        { name: "profileImgUrl", type: "string | null", required: false, description: "Photo URL" },
      ],
      exampleJson: JSON.stringify({ name: "Aarav K. Sharma", email: "aarav.k@example.com" }, null, 2),
    },
    responses: [
      { status: 200, description: "Profile updated", exampleJson: JSON.stringify({ data: { id: "prof_123", name: "Aarav K. Sharma" } }, null, 2) },
    ],
  },
  {
    id: "profiles-delete-id",
    category: "profiles",
    method: "DELETE",
    path: "/api/profiles/[id]",
    title: "Delete Profile",
    description: "Delete profile and cascade delete addresses and registrations.",
    responses: [
      { status: 200, description: "Profile deleted", exampleJson: JSON.stringify({ data: { id: "prof_123" } }, null, 2) },
    ],
  },

  // ================= ADDRESSES =================
  {
    id: "addresses-list",
    category: "addresses",
    method: "GET",
    path: "/api/addresses",
    title: "List Addresses",
    description: "List student addresses with optional filtering by profile ID.",
    queryParams: [
      { name: "profileId", type: "string", required: false, description: "Filter by linked Profile ID" },
    ],
    responses: [
      {
        status: 200,
        description: "List of addresses",
        exampleJson: JSON.stringify({
          data: [
            {
              id: "addr_123",
              profileId: "prof_123",
              addressLine: "Bansal Tower, Road No 1",
              city: "Kota",
              state: "Rajasthan",
              pincode: "324005",
              country: "India",
            },
          ],
        }, null, 2),
      },
    ],
  },
  {
    id: "addresses-create",
    category: "addresses",
    method: "POST",
    path: "/api/addresses",
    title: "Create Address",
    description: "Add a postal address attached to a student profile.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "profileId", type: "string", required: true, description: "ID of the Profile", example: "cmvnth5ak000a10vwuf3c3jom" },
        { name: "addressLine", type: "string", required: true, description: "Street / House / Landmark address", example: "Bansal Tower, Road No 1" },
        { name: "city", type: "string", required: true, description: "City name", example: "Kota" },
        { name: "state", type: "string", required: true, description: "State / Province name", example: "Rajasthan" },
        { name: "pincode", type: "string", required: true, description: "Postal ZIP / PIN code", example: "324005" },
        { name: "country", type: "string", required: true, default: "India", description: "Country name", example: "India" },
      ],
      exampleJson: JSON.stringify({
        profileId: "cmvnth5ak000a10vwuf3c3jom",
        addressLine: "Bansal Tower, Road No 1",
        city: "Kota",
        state: "Rajasthan",
        pincode: "324005",
        country: "India",
      }, null, 2),
    },
    responses: [
      {
        status: 201,
        description: "Address created",
        exampleJson: JSON.stringify({
          data: { id: "addr_1", profileId: "prof_1", addressLine: "Bansal Tower", city: "Kota", state: "Rajasthan", pincode: "324005", country: "India" },
        }, null, 2),
      },
    ],
  },
  {
    id: "addresses-patch-id",
    category: "addresses",
    method: "PATCH",
    path: "/api/addresses/[id]",
    title: "Update Address",
    description: "Update postal street, city, state, or PIN code.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "addressLine", type: "string", required: false, description: "Updated street line" },
        { name: "city", type: "string", required: false, description: "Updated city" },
        { name: "state", type: "string", required: false, description: "Updated state" },
        { name: "pincode", type: "string", required: false, description: "Updated pincode" },
        { name: "country", type: "string", required: false, description: "Updated country" },
      ],
      exampleJson: JSON.stringify({ city: "Jaipur", pincode: "302001" }, null, 2),
    },
    responses: [
      { status: 200, description: "Address updated", exampleJson: JSON.stringify({ data: { id: "addr_1", city: "Jaipur" } }, null, 2) },
    ],
  },
  {
    id: "addresses-delete-id",
    category: "addresses",
    method: "DELETE",
    path: "/api/addresses/[id]",
    title: "Delete Address",
    description: "Delete an address record.",
    responses: [
      { status: 200, description: "Deleted", exampleJson: JSON.stringify({ data: { id: "addr_1" } }, null, 2) },
    ],
  },

  // ================= COURSES =================
  {
    id: "courses-list",
    category: "courses",
    method: "GET",
    path: "/api/courses",
    title: "List Courses",
    description: "Retrieve full course catalog with pricing, category, rating, and enrollment stats.",
    queryParams: [
      { name: "status", type: "string", required: false, description: "active | inactive" },
      { name: "categorieId", type: "string", required: false, description: "Course category ID" },
      { name: "inSale", type: "string", required: false, description: "true | false (filter discount sale items)" },
    ],
    responses: [
      {
        status: 200,
        description: "Course list",
        exampleJson: JSON.stringify({
          data: [
            {
              id: "cmvntcwnu000110vw26pp8vqq",
              name: "Full Stack Web Development",
              originalPrice: 45000,
              discountedPrice: 29999,
              rating: 4.8,
              duration: "6 Months",
              status: "active",
              isInSale: true,
              isPlacementGurranted: true,
              technologyTags: ["React", "Next.js", "Node.js", "PostgreSQL"],
              courseImgUrl: "/uploads/course-banner.jpg",
              portraitImgUrl: "/uploads/course-portrait.jpg",
              courseCategorie: { id: "cat_1", name: "Web Development" },
              modules: [{ id: "mod_1", title: "HTML & CSS Mastery" }],
            },
          ],
        }, null, 2),
      },
    ],
  },
  {
    id: "courses-create",
    category: "courses",
    method: "POST",
    path: "/api/courses",
    title: "Create Course",
    description: "Add a new course curriculum with pricing, syllabus, and module relations.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "name", type: "string", required: true, description: "Course title", example: "Full Stack Web Development" },
        { name: "courseCategorieId", type: "string | null", required: false, description: "Category ID to link", example: "cat_123" },
        { name: "originalPrice", type: "number | string", required: false, description: "Regular course fee in INR", example: 45000 },
        { name: "discountedPrice", type: "number | string", required: false, description: "Offer/Sale price in INR", example: 29999 },
        { name: "duration", type: "string", required: false, description: "Course length (e.g. 6 Months, 12 Weeks)", example: "6 Months" },
        { name: "rating", type: "number", required: false, description: "Average rating (1.0 to 5.0)", example: 4.8 },
        { name: "status", type: "string", required: false, default: "active", description: "'active' | 'inactive'", example: "active" },
        { name: "isPlacementGurranted", type: "boolean", required: false, default: "false", description: "Placement guarantee badge", example: true },
        { name: "isInSale", type: "boolean", required: false, default: "false", description: "Highlight on offer banners", example: true },
        { name: "courseImgUrl", type: "string | null", required: false, description: "Thumbnail image URL", example: "/uploads/course-banner.jpg" },
        { name: "portraitImgUrl", type: "string | null", required: false, description: "Portrait (vertical) image URL for card layouts", example: "/uploads/course-portrait.jpg" },
        { name: "syllabus", type: "string | null", required: false, description: "Syllabus PDF URL or markdown summary", example: "/uploads/syllabus.pdf" },
        { name: "shortDescription", type: "string | null", required: false, description: "Summary card description" },
        { name: "longDescription", type: "string | null", required: false, description: "Full curriculum description" },
        { name: "technologyTags", type: "string[]", required: false, description: "Array of tech stack names", example: ["React", "TypeScript", "Prisma"] },
        { name: "moduleIds", type: "string[]", required: false, description: "Array of CourseModule IDs to attach", example: ["mod_1", "mod_2"] },
      ],
      exampleJson: JSON.stringify({
        name: "Full Stack Web Development",
        courseCategorieId: "cat_123",
        originalPrice: 45000,
        discountedPrice: 29999,
        duration: "6 Months",
        technologyTags: ["React", "Node.js", "PostgreSQL"],
      }, null, 2),
    },
    responses: [
      {
        status: 201,
        description: "Course created successfully",
        exampleJson: JSON.stringify({ data: { id: "crs_123", name: "Full Stack Web Development", status: "active" } }, null, 2),
      },
    ],
  },
  {
    id: "courses-get-id",
    category: "courses",
    method: "GET",
    path: "/api/courses/[id]",
    title: "Get Course By ID",
    description: "Fetch single course details with attached modules, categories, and counts.",
    responses: [
      { status: 200, description: "Course found", exampleJson: JSON.stringify({ data: { id: "crs_1", name: "Full Stack Web Dev" } }, null, 2) },
      { status: 404, description: "Course not found", exampleJson: JSON.stringify({ error: "Course not found" }, null, 2) },
    ],
  },
  {
    id: "courses-patch-id",
    category: "courses",
    method: "PATCH",
    path: "/api/courses/[id]",
    title: "Update Course",
    description: "Update pricing, modules, tech tags, or status.",
    responses: [
      { status: 200, description: "Course updated", exampleJson: JSON.stringify({ data: { id: "crs_1", discountedPrice: 24999 } }, null, 2) },
    ],
  },
  {
    id: "courses-delete-id",
    category: "courses",
    method: "DELETE",
    path: "/api/courses/[id]",
    title: "Delete Course",
    description: "Delete course. Blocked if active student registrations or enrollments exist.",
    responses: [
      { status: 200, description: "Course deleted", exampleJson: JSON.stringify({ data: { id: "crs_1" } }, null, 2) },
    ],
  },
  {
    id: "courses-import",
    category: "courses",
    method: "POST",
    path: "/api/courses/import",
    title: "Bulk Import Courses",
    description: "Import multiple courses in a single batch request.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "courses", type: "CourseCreateInput[]", required: true, description: "Array of course definition objects" },
      ],
      exampleJson: JSON.stringify({ courses: [{ name: "Course A", originalPrice: 10000 }, { name: "Course B", originalPrice: 20000 }] }, null, 2),
    },
    responses: [
      { status: 201, description: "Courses imported", exampleJson: JSON.stringify({ data: { importedCount: 2 } }, null, 2) },
    ],
  },

  // ================= COURSE MODULES =================
  {
    id: "modules-list",
    category: "course-modules",
    method: "GET",
    path: "/api/course-modules",
    title: "List Course Modules",
    description: "Retrieve syllabus modules with optional filtering by course ID.",
    queryParams: [
      { name: "courseId", type: "string", required: false, description: "Filter modules connected to a specific course" },
    ],
    responses: [
      {
        status: 200,
        description: "List of modules",
        exampleJson: JSON.stringify({ data: [{ id: "mod_1", title: "React Fundamentals", description: "JSX, Hooks & State" }] }, null, 2),
      },
    ],
  },
  {
    id: "modules-create",
    category: "course-modules",
    method: "POST",
    path: "/api/course-modules",
    title: "Create Course Module",
    description: "Add a syllabus module that can be linked across multiple courses (Many-to-Many).",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "title", type: "string", required: true, description: "Module title", example: "Database Design with PostgreSQL" },
        { name: "description", type: "string | null", required: false, description: "Detailed module topics", example: "Schema design, Prisma ORM, migrations, indexing" },
        { name: "courseIds", type: "string[]", required: false, description: "Course IDs to immediately attach", example: ["crs_1", "crs_2"] },
      ],
      exampleJson: JSON.stringify({ title: "Database Design with PostgreSQL", description: "Schema design & Prisma" }, null, 2),
    },
    responses: [
      { status: 201, description: "Module created", exampleJson: JSON.stringify({ data: { id: "mod_123", title: "Database Design" } }, null, 2) },
    ],
  },
  {
    id: "modules-patch-id",
    category: "course-modules",
    method: "PATCH",
    path: "/api/course-modules/[id]",
    title: "Update Module",
    description: "Update module title or description.",
    responses: [
      { status: 200, description: "Updated", exampleJson: JSON.stringify({ data: { id: "mod_123", title: "Updated Title" } }, null, 2) },
    ],
  },
  {
    id: "modules-delete-id",
    category: "course-modules",
    method: "DELETE",
    path: "/api/course-modules/[id]",
    title: "Delete Module",
    description: "Delete module.",
    responses: [
      { status: 200, description: "Deleted", exampleJson: JSON.stringify({ data: { id: "mod_123" } }, null, 2) },
    ],
  },

  // ================= BATCHES =================
  {
    id: "batches-list",
    category: "batches",
    method: "GET",
    path: "/api/batches",
    title: "List Batches",
    description: "List student cohorts with counts of registered students, enrollments, and scheduled classes.",
    responses: [
      {
        status: 200,
        description: "List of batches",
        exampleJson: JSON.stringify({
          data: [
            {
              id: "cmvntd1r7000610vw1fzyxq6g",
              name: "Batch 2026-A",
              createdAt: "2026-10-25T12:00:00.000Z",
              _count: { registrations: 8, enrollments: 6, classes: 12 },
            },
          ],
        }, null, 2),
      },
    ],
  },
  {
    id: "batches-create",
    category: "batches",
    method: "POST",
    path: "/api/batches",
    title: "Create Batch",
    description: "Create a cohort batch for student grouping and class scheduling.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "name", type: "string", required: true, description: "Batch name (e.g. Batch 2026-A, Weekend Cohort)", example: "Batch 2026-B" },
      ],
      exampleJson: JSON.stringify({ name: "Batch 2026-B" }, null, 2),
    },
    responses: [
      { status: 201, description: "Batch created", exampleJson: JSON.stringify({ data: { id: "batch_456", name: "Batch 2026-B" } }, null, 2) },
    ],
  },
  {
    id: "batches-patch-id",
    category: "batches",
    method: "PATCH",
    path: "/api/batches/[id]",
    title: "Update Batch",
    description: "Rename a batch.",
    responses: [
      { status: 200, description: "Updated", exampleJson: JSON.stringify({ data: { id: "batch_456", name: "Batch 2026-B Updated" } }, null, 2) },
    ],
  },
  {
    id: "batches-delete-id",
    category: "batches",
    method: "DELETE",
    path: "/api/batches/[id]",
    title: "Delete Batch",
    description: "Delete a batch. Connected registrations will have their batch cleared (SetNull).",
    responses: [
      { status: 200, description: "Deleted", exampleJson: JSON.stringify({ data: { id: "batch_456" } }, null, 2) },
    ],
  },

  // ================= REGISTRATIONS =================
  {
    id: "registrations-list",
    category: "registrations",
    method: "GET",
    path: "/api/registrations",
    title: "List Registrations",
    description: "Retrieve registered student records with course, batch, profile, and payment history.",
    queryParams: [
      { name: "profileId", type: "string", required: false, description: "Filter by Student Profile ID" },
      { name: "courseId", type: "string", required: false, description: "Filter by Course ID" },
      { name: "batchId", type: "string", required: false, description: "Filter by Batch ID" },
      { name: "registrationNo", type: "string", required: false, description: "Filter by unique registration number" },
    ],
    responses: [
      {
        status: 200,
        description: "List of registrations",
        exampleJson: JSON.stringify({
          data: [
            {
              id: "cmvnu20u30004y8vwsz9b717s",
              registrationNo: "REG_BATCH_2026_A_AARAV_SHARMA",
              courseId: "crs_1",
              batchId: "batch_1",
              profileId: "prof_1",
              course: { id: "crs_1", name: "Full Stack Web Development" },
              batch: { id: "batch_1", name: "Batch 2026-A" },
              profile: { id: "prof_1", name: "Aarav Sharma", email: "aarav@example.com" },
              payments: [{ id: "pay_1", rupees: 500, isVerified: true }],
            },
          ],
        }, null, 2),
      },
    ],
  },
  {
    id: "registrations-create",
    category: "registrations",
    method: "POST",
    path: "/api/registrations",
    title: "Create or Re-link Registration",
    description: "Register a student for a course & batch. If the registration number exists, re-links it to the current profile and returns 200 without duplicate failure.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "courseId", type: "string", required: true, description: "ID of selected Course", example: "cmvntcwnu000110vw26pp8vqq" },
        { name: "profileId", type: "string", required: true, description: "ID of Student Profile", example: "cmvnth5ak000a10vwuf3c3jom" },
        { name: "registrationNo", type: "string", required: false, description: "Formula format: REG_BATCH_NAME_PROFILENAME (auto-generated if omitted)", example: "REG_BATCH_2026_A_AARAV_SHARMA" },
        { name: "batchId", type: "string | null", required: false, description: "ID of assigned Batch", example: "cmvntd1r7000610vw1fzyxq6g" },
      ],
      exampleJson: JSON.stringify({
        courseId: "cmvntcwnu000110vw26pp8vqq",
        batchId: "cmvntd1r7000610vw1fzyxq6g",
        profileId: "cmvnth5ak000a10vwuf3c3jom",
        registrationNo: "REG_BATCH_2026_A_AARAV_SHARMA",
      }, null, 2),
    },
    responses: [
      {
        status: 201,
        description: "Registration created successfully",
        exampleJson: JSON.stringify({
          data: {
            id: "reg_123",
            registrationNo: "REG_BATCH_2026_A_AARAV_SHARMA",
            courseId: "cmvntcwnu000110vw26pp8vqq",
            batchId: "cmvntd1r7000610vw1fzyxq6g",
            profileId: "cmvnth5ak000a10vwuf3c3jom",
          },
        }, null, 2),
      },
      {
        status: 200,
        description: "Existing registration re-linked and returned cleanly",
        exampleJson: JSON.stringify({ data: { id: "reg_123", registrationNo: "REG_BATCH_2026_A_AARAV_SHARMA" } }, null, 2),
      },
    ],
  },
  {
    id: "registrations-get-id",
    category: "registrations",
    method: "GET",
    path: "/api/registrations/[id]",
    title: "Get Registration By ID",
    description: "Get registration details with payments, course, batch, and enrollment status.",
    responses: [
      { status: 200, description: "Found", exampleJson: JSON.stringify({ data: { id: "reg_123", registrationNo: "REG_..." } }, null, 2) },
    ],
  },
  {
    id: "registrations-patch-id",
    category: "registrations",
    method: "PATCH",
    path: "/api/registrations/[id]",
    title: "Update Registration",
    description: "Modify course, batch assignment, or registration number.",
    responses: [
      { status: 200, description: "Updated", exampleJson: JSON.stringify({ data: { id: "reg_123", batchId: "new_batch" } }, null, 2) },
    ],
  },
  {
    id: "registrations-delete-id",
    category: "registrations",
    method: "DELETE",
    path: "/api/registrations/[id]",
    title: "Delete Registration",
    description: "Delete a registration record.",
    responses: [
      { status: 200, description: "Deleted", exampleJson: JSON.stringify({ data: { id: "reg_123" } }, null, 2) },
    ],
  },

  // ================= ENROLLMENTS =================
  {
    id: "enrollments-list",
    category: "enrollments",
    method: "GET",
    path: "/api/enrollments",
    title: "List Enrollments",
    description: "Retrieve formal student enrollments with unique enrollment numbers.",
    queryParams: [
      { name: "profileId", type: "string", required: false, description: "Filter by profile" },
      { name: "courseId", type: "string", required: false, description: "Filter by course" },
      { name: "batchId", type: "string", required: false, description: "Filter by batch" },
      { name: "enrollmentNo", type: "string", required: false, description: "Filter by unique enrollment number" },
    ],
    responses: [
      {
        status: 200,
        description: "List of enrollments",
        exampleJson: JSON.stringify({ data: [{ id: "enr_1", enrollmentNo: "ENR-2026-001", courseId: "crs_1" }] }, null, 2),
      },
    ],
  },
  {
    id: "enrollments-create",
    category: "enrollments",
    method: "POST",
    path: "/api/enrollments",
    title: "Create Enrollment",
    description: "Formally enroll a student from an existing registration record (1:1 relation).",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "registrationId", type: "string", required: true, description: "Registration ID to convert to Enrollment", example: "reg_123" },
        { name: "courseId", type: "string", required: true, description: "Course ID", example: "crs_1" },
        { name: "profileId", type: "string", required: true, description: "Student Profile ID", example: "prof_1" },
        { name: "enrollmentNo", type: "string", required: false, description: "Custom enrollment number (auto-generated if omitted)", example: "ENR-2026-0042" },
        { name: "batchId", type: "string | null", required: false, description: "Assigned Batch ID", example: "batch_1" },
      ],
      exampleJson: JSON.stringify({
        registrationId: "reg_123",
        courseId: "crs_1",
        profileId: "prof_1",
        enrollmentNo: "ENR-2026-0042",
      }, null, 2),
    },
    responses: [
      { status: 201, description: "Enrolled", exampleJson: JSON.stringify({ data: { id: "enr_1", enrollmentNo: "ENR-2026-0042" } }, null, 2) },
      { status: 409, description: "Registration already has an enrollment", exampleJson: JSON.stringify({ error: "An enrollment for this registration already exists" }, null, 2) },
    ],
  },

  // ================= PAYMENTS =================
  {
    id: "payments-list",
    category: "payments",
    method: "GET",
    path: "/api/payments",
    title: "List Payments",
    description: "Query fee receipts and transaction records.",
    queryParams: [
      { name: "profileId", type: "string", required: false, description: "Filter by student Profile ID" },
      { name: "registrationId", type: "string", required: false, description: "Filter by Registration ID" },
      { name: "enrollmentId", type: "string", required: false, description: "Filter by Enrollment ID" },
      { name: "isVerified", type: "string", required: false, description: "true | false" },
    ],
    responses: [
      {
        status: 200,
        description: "List of payments",
        exampleJson: JSON.stringify({
          data: [
            {
              id: "pay_123",
              profileId: "prof_1",
              registrationId: "reg_1",
              rupees: 500,
              paymentMethod: "upi",
              paymentProof: "UTR: 987654321012",
              isVerified: true,
              createdAt: "2026-10-25T13:00:00.000Z",
            },
          ],
        }, null, 2),
      },
    ],
  },
  {
    id: "payments-create",
    category: "payments",
    method: "POST",
    path: "/api/payments",
    title: "Record Payment",
    description: "Log a student payment linked to their profile, registration, or enrollment.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "profileId", type: "string", required: true, description: "Student Profile ID", example: "cmvnth5ak000a10vwuf3c3jom" },
        { name: "rupees", type: "number | string", required: true, description: "Amount received in INR (>= 0)", example: 5000 },
        { name: "paymentMethod", type: "string", required: true, description: "upi | cash | bank_transfer | card | cheque | other", example: "upi" },
        { name: "registrationId", type: "string | null", required: false, description: "Linked Registration ID", example: "reg_123" },
        { name: "enrollmentId", type: "string | null", required: false, description: "Linked Enrollment ID", example: null },
        { name: "paymentProof", type: "string | null", required: false, description: "UTR / Transaction reference ID / receipt screenshot URL", example: "UTR: 324109847291" },
        { name: "isVerified", type: "boolean", required: false, default: "false", description: "Verification status", example: true },
      ],
      exampleJson: JSON.stringify({
        profileId: "cmvnth5ak000a10vwuf3c3jom",
        registrationId: "reg_123",
        rupees: 5000,
        paymentMethod: "upi",
        paymentProof: "UTR: 324109847291",
        isVerified: true,
      }, null, 2),
    },
    responses: [
      {
        status: 201,
        description: "Payment recorded successfully",
        exampleJson: JSON.stringify({
          data: {
            id: "pay_789",
            profileId: "cmvnth5ak000a10vwuf3c3jom",
            registrationId: "reg_123",
            rupees: 5000,
            paymentMethod: "upi",
            isVerified: true,
          },
        }, null, 2),
      },
    ],
  },
  {
    id: "payments-patch-id",
    category: "payments",
    method: "PATCH",
    path: "/api/payments/[id]",
    title: "Update Payment",
    description: "Update payment amount, verification flag, or transaction reference proof.",
    responses: [
      { status: 200, description: "Updated", exampleJson: JSON.stringify({ data: { id: "pay_789", isVerified: true } }, null, 2) },
    ],
  },
  {
    id: "payments-delete-id",
    category: "payments",
    method: "DELETE",
    path: "/api/payments/[id]",
    title: "Delete Payment",
    description: "Delete payment record.",
    responses: [
      { status: 200, description: "Deleted", exampleJson: JSON.stringify({ data: { id: "pay_789" } }, null, 2) },
    ],
  },

  // ================= LEADS & CRM =================
  {
    id: "leads-list",
    category: "leads",
    method: "GET",
    path: "/api/leads",
    title: "List Leads",
    description: "Retrieve prospect leads with status, source, course interest, and remarks.",
    queryParams: [
      { name: "status", type: "string", required: false, description: "hot | medium | cold | converted" },
      { name: "courseId", type: "string", required: false, description: "Filter by interested course" },
      { name: "search", type: "string", required: false, description: "Search by lead name, phone, or message" },
    ],
    responses: [
      {
        status: 200,
        description: "List of leads",
        exampleJson: JSON.stringify({
          data: [
            {
              id: "cmvntcwp3000210vwbh8knylo",
              firstName: "Aarav",
              lastName: "Sharma",
              username: "919876543210",
              status: "converted",
              generatedSource: "online",
              course: { id: "crs_1", name: "Full Stack Web Development" },
              remarks: [{ id: "rem_1", remark: "Lead converted to student. Registration No: REG_..." }],
            },
          ],
        }, null, 2),
      },
    ],
  },
  {
    id: "leads-create",
    category: "leads",
    method: "POST",
    path: "/api/leads",
    title: "Create Lead",
    description: "Capture a prospective student inquiry.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "firstName", type: "string", required: true, description: "Lead first name", example: "Aarav" },
        { name: "username", type: "string", required: true, description: "10-digit lead phone number, saved in backend with 91 prefix", example: "9876543210" },
        { name: "lastName", type: "string | null", required: false, description: "Lead last name", example: "Sharma" },
        { name: "courseId", type: "string | null", required: false, description: "Interested course ID", example: "crs_1" },
        { name: "status", type: "string", required: false, default: "hot", description: "hot | medium | cold | converted", example: "hot" },
        { name: "generatedSource", type: "string", required: false, default: "online", description: "online | offline", example: "online" },
        { name: "utmSource", type: "string | null", required: false, description: "Campaign source (google, facebook, direct)", example: "instagram_ad" },
        { name: "message", type: "string | null", required: false, description: "User inquiry message" },
        { name: "hasBeenCalled", type: "boolean", required: false, default: "false", description: "Whether telecaller contacted the lead" },
        { name: "nextCallDate", type: "string (ISO Date) | null", required: false, description: "Scheduled follow-up date" },
      ],
      exampleJson: JSON.stringify({
        firstName: "Aarav",
        lastName: "Sharma",
        username: "9876543210",
        courseId: "crs_1",
        status: "hot",
        generatedSource: "online",
      }, null, 2),
    },
    responses: [
      { status: 201, description: "Lead created", exampleJson: JSON.stringify({ data: { id: "lead_123", firstName: "Aarav" } }, null, 2) },
    ],
  },
  {
    id: "leads-patch-id",
    category: "leads",
    method: "PATCH",
    path: "/api/leads/[id]",
    title: "Update Lead",
    description: "Update lead status (hot/converted), follow-up date, or contact history.",
    responses: [
      { status: 200, description: "Updated", exampleJson: JSON.stringify({ data: { id: "lead_123", status: "converted" } }, null, 2) },
    ],
  },
  {
    id: "leads-remarks-post",
    category: "leads",
    method: "POST",
    path: "/api/leads/[id]/remarks",
    title: "Add Lead Remark",
    description: "Append a dated audit remark / call note to a lead.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "remark", type: "string", required: true, description: "Notes about call or conversion event", example: "Called client. Interested in batch starting Nov 1." },
      ],
      exampleJson: JSON.stringify({ remark: "Called client. Interested in batch starting Nov 1." }, null, 2),
    },
    responses: [
      { status: 201, description: "Remark added", exampleJson: JSON.stringify({ data: { id: "rem_1", remark: "..." } }, null, 2) },
    ],
  },

  // ================= CAROUSALS & SLIDES =================
  {
    id: "carousals-list",
    category: "carousals",
    method: "GET",
    path: "/api/carousals",
    title: "List Carousals",
    description: "List all carousel containers by placement position.",
    queryParams: [
      { name: "position", type: "string", required: false, description: "homepage | offer_banner | development | programs | training" },
    ],
    responses: [
      { status: 200, description: "List of carousals", exampleJson: JSON.stringify({ data: [{ id: "car_1", position: "homepage" }] }, null, 2) },
    ],
  },
  {
    id: "carousals-create",
    category: "carousals",
    method: "POST",
    path: "/api/carousals",
    title: "Create Carousal",
    description: "Create a carousel section at a specific website position.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "position", type: "string", required: true, description: "homepage | offer_banner | development | programs | training", example: "homepage" },
      ],
      exampleJson: JSON.stringify({ position: "homepage" }, null, 2),
    },
    responses: [
      { status: 201, description: "Created", exampleJson: JSON.stringify({ data: { id: "car_1", position: "homepage" } }, null, 2) },
    ],
  },
  {
    id: "slides-create",
    category: "carousel-slides",
    method: "POST",
    path: "/api/carousel-slides",
    title: "Create Carousel Slide",
    description: "Add a banner slide with title, background image, and CTA links.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "title", type: "string", required: true, description: "Slide heading", example: "Master Full Stack Development" },
        { name: "bgImgUrl", type: "string", required: true, description: "Background banner image URL", example: "/uploads/hero-banner.jpg" },
        { name: "order", type: "number", required: true, description: "Display sort sequence (1, 2, 3...)", example: 1 },
        { name: "carousalId", type: "string | null", required: false, description: "Parent Carousal ID", example: "car_1" },
        { name: "description", type: "string | null", required: false, description: "Subheading / paragraph text" },
        { name: "btnHrefLink", type: "string | null", required: false, description: "CTA button target URL", example: "/courses" },
        { name: "imgUrl", type: "string | null", required: false, description: "Floating foreground graphic URL" },
        { name: "bannerHrefLink", type: "string | null", required: false, description: "Full slide clickable URL" },
        { name: "textContainerAlign", type: "string | null", required: false, description: "'left' | 'center' | 'right'", example: "left" },
      ],
      exampleJson: JSON.stringify({
        title: "Master Full Stack Development",
        bgImgUrl: "/uploads/hero-banner.jpg",
        order: 1,
        carousalId: "car_1",
        btnHrefLink: "/courses",
      }, null, 2),
    },
    responses: [
      { status: 201, description: "Slide created", exampleJson: JSON.stringify({ data: { id: "slide_1", title: "Master Full Stack" } }, null, 2) },
    ],
  },

  // ================= CMS PAGES =================
  {
    id: "pages-list",
    category: "pages",
    method: "GET",
    path: "/api/pages",
    title: "List CMS Pages",
    description: "Retrieve all CMS pages with their cumulative visit counter. Pass routeName to fetch a single page by route.",
    queryParams: [
      { name: "routeName", type: "string", required: false, description: "Fetch one page by normalized route slug (e.g. 'about-us')", example: "about-us" },
    ],
    responses: [
      { status: 200, description: "List of pages", exampleJson: JSON.stringify({ data: [{ id: "pg_1", routeName: "about-us", heading: "About Bytecode", subheading: "Who we are", visits: 1240 }] }, null, 2) },
      { status: 404, description: "Route filter matched no page", exampleJson: JSON.stringify({ error: "Page with route \"about-us\" not found" }, null, 2) },
    ],
  },
  {
    id: "pages-create",
    category: "pages",
    method: "POST",
    path: "/api/pages",
    title: "Create CMS Page",
    description: "Store page meta for a specific URL route. New pages start at 0 visits unless visits is provided.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "routeName", type: "string", required: true, description: "Target frontend path; normalized to lowercase slug (e.g. '/About Us/' -> 'about-us')", example: "about-us" },
        { name: "heading", type: "string", required: true, description: "Page heading", example: "About Bytecode" },
        { name: "subheading", type: "string", required: true, description: "Page subheading", example: "Who we are" },
        { name: "visits", type: "number", required: false, default: "0", description: "Initial visit count (non-negative integer)", example: 0 },
      ],
      exampleJson: JSON.stringify({ routeName: "about-us", heading: "About Bytecode", subheading: "Who we are" }, null, 2),
    },
    responses: [
      { status: 201, description: "Page created", exampleJson: JSON.stringify({ data: { id: "pg_1", routeName: "about-us", heading: "About Bytecode", subheading: "Who we are", visits: 0 } }, null, 2) },
      { status: 400, description: "Validation error", exampleJson: JSON.stringify({ error: "heading must be a non-empty string" }, null, 2) },
      { status: 409, description: "Route name already used by another page", exampleJson: JSON.stringify({ error: "A page with this route name already exists" }, null, 2) },
    ],
  },
  {
    id: "pages-by-route",
    category: "pages",
    method: "GET",
    path: "/api/pages/by-route/[routeName]",
    title: "Get Page By Route",
    description: "Fetch a single CMS page (including its visits counter) using the route slug (e.g. /api/pages/by-route/about-us).",
    responses: [
      { status: 200, description: "Page found", exampleJson: JSON.stringify({ data: { id: "pg_1", routeName: "about-us", heading: "About Bytecode", subheading: "Who we are", visits: 1240 } }, null, 2) },
      { status: 404, description: "Page not found", exampleJson: JSON.stringify({ error: "Page not found" }, null, 2) },
    ],
  },
  {
    id: "pages-update",
    category: "pages",
    method: "PATCH",
    path: "/api/pages/[id]",
    title: "Update CMS Page",
    description: "Partially update a page, including its visits counter. Send visits to set the new total (use POST on the same resource from a tracker for increments).",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "routeName", type: "string", required: false, description: "New route slug (normalized, must stay unique)", example: "about" },
        { name: "heading", type: "string", required: false, description: "Page heading", example: "About Bytecode" },
        { name: "subheading", type: "string", required: false, description: "Page subheading", example: "Who we are" },
        { name: "visits", type: "number", required: false, description: "New visit count (non-negative integer)", example: 1300 },
      ],
      exampleJson: JSON.stringify({ visits: 1300 }, null, 2),
    },
    responses: [
      { status: 200, description: "Updated", exampleJson: JSON.stringify({ data: { id: "pg_1", routeName: "about-us", visits: 1300 } }, null, 2) },
      { status: 400, description: "Validation error", exampleJson: JSON.stringify({ error: "visits must be a non-negative integer" }, null, 2) },
      { status: 404, description: "Page not found", exampleJson: JSON.stringify({ error: "Page not found" }, null, 2) },
      { status: 409, description: "Route name already used by another page", exampleJson: JSON.stringify({ error: "A page with this route name already exists" }, null, 2) },
    ],
  },
  {
    id: "pages-delete",
    category: "pages",
    method: "DELETE",
    path: "/api/pages/[id]",
    title: "Delete CMS Page",
    description: "Delete a page. Its click counters are deleted along with it.",
    responses: [
      { status: 200, description: "Deleted", exampleJson: JSON.stringify({ data: { id: "pg_1" } }, null, 2) },
      { status: 404, description: "Page not found", exampleJson: JSON.stringify({ error: "Page not found" }, null, 2) },
    ],
  },

  // ================= PAGE CLICKS =================
  {
    id: "page-clicks-list",
    category: "page-clicks",
    method: "GET",
    path: "/api/page-clicks",
    title: "List Page Clicks",
    description: "Retrieve click counters, optionally filtered by page or tracked field name.",
    queryParams: [
      { name: "pageId", type: "string", required: false, description: "Filter by owning page ID", example: "pg_1" },
      { name: "fieldName", type: "string", required: false, description: "Filter by tracked CTA field name", example: "enrollNow" },
    ],
    responses: [
      {
        status: 200,
        description: "List of page clicks",
        exampleJson: JSON.stringify({
          data: [
            {
              id: "pcl_1",
              pageId: "pg_1",
              fieldName: "enrollNow",
              clicks: 87,
              page: { id: "pg_1", routeName: "courses", heading: "Courses", visits: 1240 },
              createdAt: "2026-10-27T12:00:00.000Z",
              updatedAt: "2026-10-27T12:00:00.000Z",
            },
          ],
        }, null, 2),
      },
    ],
  },
  {
    id: "page-clicks-create",
    category: "page-clicks",
    method: "POST",
    path: "/api/page-clicks",
    title: "Create Page Clicks",
    description: "Track a clickable field on a page. One counter per field name per page.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "pageId", type: "string", required: true, description: "ID of the page this click counter belongs to", example: "pg_1" },
        { name: "fieldName", type: "string", required: true, description: "Tracked field/CTA identifier", example: "enrollNow" },
        { name: "clicks", type: "number", required: false, default: "0", description: "Initial click count (non-negative integer)", example: 0 },
      ],
      exampleJson: JSON.stringify({ pageId: "pg_1", fieldName: "enrollNow", clicks: 0 }, null, 2),
    },
    responses: [
      { status: 201, description: "Created", exampleJson: JSON.stringify({ data: { id: "pcl_1", pageId: "pg_1", fieldName: "enrollNow", clicks: 0 } }, null, 2) },
      { status: 400, description: "Validation error", exampleJson: JSON.stringify({ error: "fieldName must be a non-empty string" }, null, 2) },
      { status: 404, description: "Page not found", exampleJson: JSON.stringify({ error: "Page not found" }, null, 2) },
      { status: 409, description: "Counter already exists for this field on the page", exampleJson: JSON.stringify({ error: "Page clicks already exist for this field on the page" }, null, 2) },
    ],
  },
  {
    id: "page-clicks-get",
    category: "page-clicks",
    method: "GET",
    path: "/api/page-clicks/[id]",
    title: "Get Page Clicks By ID",
    description: "Fetch a single click record together with its page.",
    responses: [
      { status: 200, description: "Click record found", exampleJson: JSON.stringify({ data: { id: "pcl_1", pageId: "pg_1", fieldName: "enrollNow", clicks: 87, page: { id: "pg_1", routeName: "courses", visits: 1240 } } }, null, 2) },
      { status: 404, description: "Page clicks not found", exampleJson: JSON.stringify({ error: "Page clicks not found" }, null, 2) },
    ],
  },
  {
    id: "page-clicks-update",
    category: "page-clicks",
    method: "PATCH",
    path: "/api/page-clicks/[id]",
    title: "Update Page Clicks",
    description: "Partially update a click counter. Send clicks to set the new total.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "pageId", type: "string", required: false, description: "Move the counter to another page", example: "pg_2" },
        { name: "fieldName", type: "string", required: false, description: "Tracked field/CTA identifier", example: "applyNow" },
        { name: "clicks", type: "number", required: false, description: "New click count (non-negative integer)", example: 92 },
      ],
      exampleJson: JSON.stringify({ clicks: 92 }, null, 2),
    },
    responses: [
      { status: 200, description: "Updated", exampleJson: JSON.stringify({ data: { id: "pcl_1", pageId: "pg_1", fieldName: "enrollNow", clicks: 92 } }, null, 2) },
      { status: 400, description: "Validation error", exampleJson: JSON.stringify({ error: "At least one of pageId, fieldName, or clicks is required" }, null, 2) },
      { status: 404, description: "Page clicks or page not found", exampleJson: JSON.stringify({ error: "Page clicks or page not found" }, null, 2) },
      { status: 409, description: "Another counter already uses this field on the page", exampleJson: JSON.stringify({ error: "Page clicks already exist for this field on the page" }, null, 2) },
    ],
  },
  {
    id: "page-clicks-delete",
    category: "page-clicks",
    method: "DELETE",
    path: "/api/page-clicks/[id]",
    title: "Delete Page Clicks",
    description: "Remove a click counter record.",
    responses: [
      { status: 200, description: "Deleted", exampleJson: JSON.stringify({ data: { id: "pcl_1" } }, null, 2) },
      { status: 404, description: "Page clicks not found", exampleJson: JSON.stringify({ error: "Page clicks not found" }, null, 2) },
    ],
  },

  // ================= PROJECTS =================
  {
    id: "projects-list",
    category: "projects",
    method: "GET",
    path: "/api/projects",
    title: "List Projects",
    description: "Retrieve all projects, newest first.",
    responses: [
      {
        status: 200,
        description: "List of projects",
        exampleJson: JSON.stringify({
          data: [
            {
              id: "prj_1",
              name: "Bytecode Admin Panel",
              shortDescription: "Internal CMS for the website",
              longDescription: "Next.js and Prisma admin panel that manages courses, leads, and portfolio content.",
              imgUrl: "/uploads/projects/admin-panel.png",
              videoUrl: "/uploads/videos/project-demo.mp4",
              createdAt: "2026-10-27T12:00:00.000Z",
              updatedAt: "2026-10-27T12:00:00.000Z",
            },
          ],
        }, null, 2),
      },
    ],
  },
  {
    id: "projects-create",
    category: "projects",
    method: "POST",
    path: "/api/projects",
    title: "Create Project",
    description: "Add a project to the portfolio. Only name is required.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "name", type: "string", required: true, description: "Project name", example: "Bytecode Admin Panel" },
        { name: "shortDescription", type: "string | null", required: false, description: "One-line summary used in cards" },
        { name: "longDescription", type: "string | null", required: false, description: "Full description used on the project page" },
        { name: "imgUrl", type: "string | null", required: false, description: "Cover image URL", example: "/uploads/projects/admin-panel.png" },
        { name: "videoUrl", type: "string | null", required: false, description: "Demo video URL from /api/upload/video", example: "/uploads/videos/project-demo.mp4" },
      ],
      exampleJson: JSON.stringify({
        name: "Bytecode Admin Panel",
        shortDescription: "Internal CMS for the website",
        longDescription: "Next.js and Prisma admin panel that manages courses, leads, and portfolio content.",
        imgUrl: "/uploads/projects/admin-panel.png",
        videoUrl: "/uploads/videos/project-demo.mp4",
      }, null, 2),
    },
    responses: [
      { status: 201, description: "Project created", exampleJson: JSON.stringify({ data: { id: "prj_1", name: "Bytecode Admin Panel", imgUrl: "/uploads/projects/admin-panel.png", videoUrl: "/uploads/videos/project-demo.mp4" } }, null, 2) },
      { status: 400, description: "Validation error", exampleJson: JSON.stringify({ error: "name must be a non-empty string" }, null, 2) },
    ],
  },
  {
    id: "projects-get",
    category: "projects",
    method: "GET",
    path: "/api/projects/[id]",
    title: "Get Project By ID",
    description: "Fetch a single project.",
    responses: [
      { status: 200, description: "Project found", exampleJson: JSON.stringify({ data: { id: "prj_1", name: "Bytecode Admin Panel", shortDescription: "Internal CMS for the website" } }, null, 2) },
      { status: 404, description: "Project not found", exampleJson: JSON.stringify({ error: "Project not found" }, null, 2) },
    ],
  },
  {
    id: "projects-update",
    category: "projects",
    method: "PATCH",
    path: "/api/projects/[id]",
    title: "Update Project",
    description: "Partially update a project. Send null to clear an optional field.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "name", type: "string", required: false, description: "Project name", example: "Bytecode Website" },
        { name: "shortDescription", type: "string | null", required: false, description: "One-line summary used in cards" },
        { name: "longDescription", type: "string | null", required: false, description: "Full description used on the project page" },
        { name: "imgUrl", type: "string | null", required: false, description: "Cover image URL", example: "/uploads/projects/website.png" },
        { name: "videoUrl", type: "string | null", required: false, description: "Demo video URL from /api/upload/video", example: "/uploads/videos/website-demo.mp4" },
      ],
      exampleJson: JSON.stringify({ name: "Bytecode Website", imgUrl: "/uploads/projects/website.png", videoUrl: "/uploads/videos/website-demo.mp4" }, null, 2),
    },
    responses: [
      { status: 200, description: "Updated", exampleJson: JSON.stringify({ data: { id: "prj_1", name: "Bytecode Website" } }, null, 2) },
      { status: 400, description: "Validation error", exampleJson: JSON.stringify({ error: "At least one of name, shortDescription, longDescription, imgUrl, or videoUrl is required" }, null, 2) },
      { status: 404, description: "Project not found", exampleJson: JSON.stringify({ error: "Project not found" }, null, 2) },
    ],
  },
  {
    id: "projects-delete",
    category: "projects",
    method: "DELETE",
    path: "/api/projects/[id]",
    title: "Delete Project",
    description: "Remove a project from the portfolio.",
    responses: [
      { status: 200, description: "Deleted", exampleJson: JSON.stringify({ data: { id: "prj_1" } }, null, 2) },
      { status: 404, description: "Project not found", exampleJson: JSON.stringify({ error: "Project not found" }, null, 2) },
    ],
  },

  // ================= TESTIMONIALS & SUCCESS STORIES =================
  {
    id: "testimonials-create",
    category: "testimonials",
    method: "POST",
    path: "/api/testimonials",
    title: "Create Testimonial",
    description: "Publish a student or alumni review.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "name", type: "string", required: true, description: "Reviewer full name", example: "Rohit Verma" },
        { name: "companyName", type: "string | null", required: false, description: "Placed company name", example: "TCS / Infosys" },
        { name: "profileImg", type: "string | null", required: false, description: "Photo URL", example: "/uploads/rohit.jpg" },
      ],
      exampleJson: JSON.stringify({ name: "Rohit Verma", companyName: "TCS", profileImg: "/uploads/rohit.jpg" }, null, 2),
    },
    responses: [
      { status: 201, description: "Created", exampleJson: JSON.stringify({ data: { id: "test_1", name: "Rohit Verma" } }, null, 2) },
    ],
  },
  {
    id: "success-stories-create",
    category: "success-stories",
    method: "POST",
    path: "/api/success-stories",
    title: "Create Success Story",
    description: "Add YouTube/Vimeo video IDs for success story carousels.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "videoIds", type: "string[]", required: true, description: "Array of video identifiers", example: ["dQw4w9WgXcQ", "abc123xyz"] },
      ],
      exampleJson: JSON.stringify({ videoIds: ["dQw4w9WgXcQ"] }, null, 2),
    },
    responses: [
      { status: 201, description: "Created", exampleJson: JSON.stringify({ data: { id: "story_1", videoIds: ["dQw4w9WgXcQ"] } }, null, 2) },
    ],
  },

  // ================= SETTINGS =================
  {
    id: "settings-list",
    category: "settings",
    method: "GET",
    path: "/api/settings",
    title: "List Settings",
    description: "Retrieve all site setting records.",
    responses: [
      {
        status: 200,
        description: "List of settings",
        exampleJson: JSON.stringify({
          data: [
            {
              id: "set_cm101abc",
              companyLightThemedLogoUrl: "/uploads/images/logo-light.webp",
              companyDarkThemedLogoUrl: "/uploads/images/logo-dark.webp",
              companyName: "Bytecode IT Solutions",
              companyAddress: "2nd Floor, MG Road, Indore, Madhya Pradesh 452001",
              companyWhatsappNumber: "+919876543210",
              companyPrimaryContactNumber: "+919876543211",
              companySecondaryContactNumber: "+919876543212",
              createdAt: "2026-10-27T12:00:00.000Z",
              updatedAt: "2026-10-27T12:00:00.000Z",
            },
          ],
        }, null, 2),
      },
    ],
  },
  {
    id: "settings-create",
    category: "settings",
    method: "POST",
    path: "/api/settings",
    title: "Create Settings",
    description: "Create a site setting record with light and dark themed company logos, free-text address, and contact numbers.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "companyName", type: "string | null", required: false, description: "Registered company name", example: "Bytecode IT Solutions" },
        { name: "companyLightThemedLogoUrl", type: "string | null", required: false, description: "Hosted logo URL used on light backgrounds, from /api/upload/image", example: "/uploads/images/logo-light.webp" },
        { name: "companyDarkThemedLogoUrl", type: "string | null", required: false, description: "Hosted logo URL used on dark backgrounds, from /api/upload/image", example: "/uploads/images/logo-dark.webp" },
        { name: "companyAddress", type: "string | null", required: false, description: "Company address as free text", example: "2nd Floor, MG Road, Indore, MP 452001" },
        { name: "companyWhatsappNumber", type: "string | null", required: false, description: "WhatsApp contact number", example: "+919876543210" },
        { name: "companyPrimaryContactNumber", type: "string | null", required: false, description: "Primary phone number", example: "+919876543211" },
        { name: "companySecondaryContactNumber", type: "string | null", required: false, description: "Secondary phone number", example: "+919876543212" },
      ],
      exampleJson: JSON.stringify({
        companyName: "Bytecode IT Solutions",
        companyLightThemedLogoUrl: "/uploads/images/logo-light.webp",
        companyDarkThemedLogoUrl: "/uploads/images/logo-dark.webp",
        companyAddress: "2nd Floor, MG Road, Indore, MP 452001",
        companyWhatsappNumber: "+919876543210",
        companyPrimaryContactNumber: "+919876543211",
      }, null, 2),
    },
    responses: [
      { status: 201, description: "Created", exampleJson: JSON.stringify({ data: { id: "set_1", companyName: "Bytecode IT Solutions" } }, null, 2) },
    ],
  },
  {
    id: "settings-get",
    category: "settings",
    method: "GET",
    path: "/api/settings/[id]",
    title: "Get Setting By ID",
    description: "Fetch a single setting record.",
    responses: [
      { status: 200, description: "Setting found", exampleJson: JSON.stringify({ data: { id: "set_1", companyName: "Bytecode IT Solutions", companyAddress: "2nd Floor, MG Road, Indore" } }, null, 2) },
      { status: 404, description: "Setting not found", exampleJson: JSON.stringify({ error: "Setting not found" }, null, 2) },
    ],
  },
  {
    id: "settings-update",
    category: "settings",
    method: "PATCH",
    path: "/api/settings/[id]",
    title: "Update Setting",
    description: "Partially update a setting record. Send companyAddress as null to clear the stored address, or a logo URL as null to remove it.",
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "companyName", type: "string | null", required: false, description: "Registered company name", example: "Bytecode IT Solutions" },
        { name: "companyLightThemedLogoUrl", type: "string | null", required: false, description: "Hosted logo URL for light backgrounds (null clears it)", example: "/uploads/images/logo-light.webp" },
        { name: "companyDarkThemedLogoUrl", type: "string | null", required: false, description: "Hosted logo URL for dark backgrounds (null clears it)", example: "/uploads/images/logo-dark.webp" },
        { name: "companyAddress", type: "string | null", required: false, description: "Company address as free text", example: "2nd Floor, MG Road, Indore, MP 452001" },
        { name: "companyWhatsappNumber", type: "string | null", required: false, description: "WhatsApp contact number", example: "+919876543210" },
        { name: "companyPrimaryContactNumber", type: "string | null", required: false, description: "Primary phone number", example: "+919876543211" },
        { name: "companySecondaryContactNumber", type: "string | null", required: false, description: "Secondary phone number", example: "+919876543212" },
      ],
      exampleJson: JSON.stringify({ companyName: "Bytecode IT Solutions Pvt. Ltd." }, null, 2),
    },
    responses: [
      { status: 200, description: "Updated", exampleJson: JSON.stringify({ data: { id: "set_1", companyName: "Bytecode IT Solutions Pvt. Ltd." } }, null, 2) },
      { status: 400, description: "Validation error", exampleJson: JSON.stringify({ error: "At least one setting field is required to update" }, null, 2) },
      { status: 404, description: "Setting not found", exampleJson: JSON.stringify({ error: "Setting not found" }, null, 2) },
    ],
  },
  {
    id: "settings-delete",
    category: "settings",
    method: "DELETE",
    path: "/api/settings/[id]",
    title: "Delete Setting",
    description: "Permanently remove a setting record.",
    responses: [
      { status: 200, description: "Deleted", exampleJson: JSON.stringify({ data: { id: "set_1" } }, null, 2) },
      { status: 404, description: "Setting not found", exampleJson: JSON.stringify({ error: "Setting not found" }, null, 2) },
    ],
  },

  // ================= UPLOADS =================
  {
    id: "upload-image",
    category: "uploads",
    method: "POST",
    path: "/api/upload/image",
    title: "Upload Image",
    description: "Upload an image asset (PNG, JPG, WEBP, SVG) via multipart/form-data. Returns the hosted public asset URL.",
    headers: {
      "Content-Type": "multipart/form-data",
    },
    requestBody: {
      contentType: "multipart/form-data",
      description: "Send file using key 'file' in FormData",
      fields: [
        { name: "file", type: "File (binary)", required: true, description: "Image file to upload", example: "image.png" },
      ],
    },
    responses: [
      {
        status: 201,
        description: "Image uploaded successfully",
        exampleJson: JSON.stringify({ data: { url: "/uploads/image-17929482.webp", originalName: "banner.png" } }, null, 2),
      },
      { status: 400, description: "Missing file or unsupported mime type", exampleJson: JSON.stringify({ error: "No file uploaded or file is not an image" }, null, 2) },
    ],
  },
  {
    id: "upload-pdf",
    category: "uploads",
    method: "POST",
    path: "/api/upload/pdf",
    title: "Upload PDF",
    description: "Upload a syllabus or certificate document via multipart/form-data.",
    headers: {
      "Content-Type": "multipart/form-data",
    },
    requestBody: {
      contentType: "multipart/form-data",
      fields: [
        { name: "file", type: "File (binary)", required: true, description: "PDF document to upload", example: "syllabus.pdf" },
      ],
    },
    responses: [
      {
        status: 201,
        description: "PDF uploaded successfully",
        exampleJson: JSON.stringify({ data: { url: "/uploads/syllabus-17929482.pdf", originalName: "Full_Syllabus.pdf" } }, null, 2),
      },
      { status: 400, description: "Missing file or invalid format", exampleJson: JSON.stringify({ error: "File must be a valid PDF document" }, null, 2) },
    ],
  },
  {
    id: "upload-video",
    category: "uploads",
    method: "POST",
    path: "/api/upload/video",
    title: "Upload Video",
    description:
      "Upload a project demo or promo video (MP4 or WebM, max 100 MB) via multipart/form-data. Returns the hosted public asset URL, e.g. for a project's videoUrl.",
    headers: {
      "Content-Type": "multipart/form-data",
    },
    requestBody: {
      contentType: "multipart/form-data",
      description: "Send file using key 'file' in FormData",
      fields: [
        { name: "file", type: "File (binary)", required: true, description: "MP4 or WebM video to upload", example: "project-demo.mp4" },
      ],
    },
    responses: [
      {
        status: 201,
        description: "Video uploaded successfully",
        exampleJson: JSON.stringify({ data: { url: "/uploads/videos/17929482-project-demo.mp4" } }, null, 2),
      },
      { status: 400, description: "Missing file, wrong format, or larger than 100 MB", exampleJson: JSON.stringify({ error: "Only MP4 and WebM video files are allowed" }, null, 2) },
    ],
  },
  {
    id: "get-projects",
    category: "projects",
    method: "GET",
    path: "/api/projects",
    title: "List All Projects",
    description: "Retrieve all showcase and portfolio projects ordered by creation date descending.",
    responses: [
      {
        status: 200,
        description: "List of projects",
        exampleJson: JSON.stringify(
          {
            data: [
              {
                id: "cuid1234567890",
                name: "Bytecode LMS",
                shortDescription: "Enterprise training and learning portal",
                longDescription: "A comprehensive platform with course catalogs, student enrollments, and video lessons.",
                imgUrl: "/uploads/images/lms-cover.webp",
                videoUrl: "/uploads/videos/lms-demo.mp4",
                createdAt: "2026-10-27T10:00:00.000Z",
                updatedAt: "2026-10-27T10:00:00.000Z",
              },
            ],
          },
          null,
          2
        ),
      },
    ],
  },
  {
    id: "create-project",
    category: "projects",
    method: "POST",
    path: "/api/projects",
    title: "Create Project",
    description: "Create a new project with name, descriptions, cover image, and showcase video.",
    headers: { "Content-Type": "application/json" },
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "name", type: "string", required: true, description: "Project title or name", example: "Bytecode LMS" },
        { name: "shortDescription", type: "string | null", required: false, description: "Short summary or tagline", example: "Enterprise training and learning portal" },
        { name: "longDescription", type: "string | null", required: false, description: "Full project story or technical summary", example: "A comprehensive platform with course catalogs..." },
        { name: "imgUrl", type: "string | null", required: false, description: "URL to cover or preview image", example: "/uploads/images/lms-cover.webp" },
        { name: "videoUrl", type: "string | null", required: false, description: "URL to demo or walkthrough video", example: "/uploads/videos/lms-demo.mp4" },
      ],
      exampleJson: JSON.stringify(
        {
          name: "Bytecode LMS",
          shortDescription: "Enterprise training and learning portal",
          longDescription: "A comprehensive platform built with Next.js and Prisma.",
          imgUrl: "/uploads/images/lms-cover.webp",
          videoUrl: "/uploads/videos/lms-demo.mp4",
        },
        null,
        2
      ),
    },
    responses: [
      {
        status: 201,
        description: "Project created successfully",
        exampleJson: JSON.stringify(
          {
            data: {
              id: "cuid1234567890",
              name: "Bytecode LMS",
              shortDescription: "Enterprise training and learning portal",
              longDescription: "A comprehensive platform built with Next.js and Prisma.",
              imgUrl: "/uploads/images/lms-cover.webp",
              videoUrl: "/uploads/videos/lms-demo.mp4",
              createdAt: "2026-10-27T10:00:00.000Z",
              updatedAt: "2026-10-27T10:00:00.000Z",
            },
          },
          null,
          2
        ),
      },
      { status: 400, description: "Validation error", exampleJson: JSON.stringify({ error: "name must be a non-empty string" }, null, 2) },
    ],
  },
  {
    id: "get-project-by-id",
    category: "projects",
    method: "GET",
    path: "/api/projects/:id",
    title: "Get Project by ID",
    description: "Fetch a single project record by its unique ID.",
    responses: [
      {
        status: 200,
        description: "Project details",
        exampleJson: JSON.stringify(
          {
            data: {
              id: "cuid1234567890",
              name: "Bytecode LMS",
              shortDescription: "Enterprise training and learning portal",
              longDescription: "A comprehensive platform built with Next.js and Prisma.",
              imgUrl: "/uploads/images/lms-cover.webp",
              videoUrl: "/uploads/videos/lms-demo.mp4",
              createdAt: "2026-10-27T10:00:00.000Z",
              updatedAt: "2026-10-27T10:00:00.000Z",
            },
          },
          null,
          2
        ),
      },
      { status: 404, description: "Project not found", exampleJson: JSON.stringify({ error: "Project not found" }, null, 2) },
    ],
  },
  {
    id: "update-project",
    category: "projects",
    method: "PATCH",
    path: "/api/projects/:id",
    title: "Update Project",
    description: "Update any field of an existing project by ID.",
    headers: { "Content-Type": "application/json" },
    requestBody: {
      contentType: "application/json",
      fields: [
        { name: "name", type: "string", required: false, description: "New project title", example: "Bytecode LMS 2.0" },
        { name: "shortDescription", type: "string | null", required: false, description: "Updated summary", example: "Next-gen education suite" },
        { name: "longDescription", type: "string | null", required: false, description: "Updated description" },
        { name: "imgUrl", type: "string | null", required: false, description: "Updated image URL" },
        { name: "videoUrl", type: "string | null", required: false, description: "Updated video URL" },
      ],
      exampleJson: JSON.stringify({ name: "Bytecode LMS 2.0" }, null, 2),
    },
    responses: [
      {
        status: 200,
        description: "Project updated",
        exampleJson: JSON.stringify(
          {
            data: {
              id: "cuid1234567890",
              name: "Bytecode LMS 2.0",
              shortDescription: "Next-gen education suite",
              longDescription: "A comprehensive platform built with Next.js and Prisma.",
              imgUrl: "/uploads/images/lms-cover.webp",
              videoUrl: "/uploads/videos/lms-demo.mp4",
              createdAt: "2026-10-27T10:00:00.000Z",
              updatedAt: "2026-10-27T10:05:00.000Z",
            },
          },
          null,
          2
        ),
      },
      { status: 404, description: "Project not found", exampleJson: JSON.stringify({ error: "Project not found" }, null, 2) },
    ],
  },
  {
    id: "delete-project",
    category: "projects",
    method: "DELETE",
    path: "/api/projects/:id",
    title: "Delete Project",
    description: "Permanently delete a project record by ID.",
    responses: [
      {
        status: 200,
        description: "Project deleted",
        exampleJson: JSON.stringify({ data: { id: "cuid1234567890" } }, null, 2),
      },
      { status: 404, description: "Project not found", exampleJson: JSON.stringify({ error: "Project not found" }, null, 2) },
    ],
  },
];
