# New Signup Forms Implementation

## Overview
Two new signup forms have been added to the Trofify application:
1. **Media/Creator** - For content creators, photographers, videographers, and sports media professionals
2. **Organization/Institute** - For sports organizations, educational institutions, training centers, and sports federations

## Database Tables Created

### 1. media_creators Table
**Purpose**: Stores profile information for media creators and content creators

**Columns**:
- `user_id` (UUID, Primary Key) - References users table
- `full_name` (VARCHAR) - Full name of the media creator
- `media_type` (VARCHAR) - Type of media work (Photography, Videography, Content Creation, etc.)
- `specialization` (VARCHAR) - Specific area of expertise
- `experience` (VARCHAR) - Experience level (Beginner, Intermediate, Advanced, etc.)
- `portfolio_url` (VARCHAR) - Link to portfolio website
- `social_media_handles` (TEXT) - Social media profiles
- `equipment` (VARCHAR) - Equipment and skills
- `location` (VARCHAR) - Geographic location
- `description` (TEXT) - About section
- `phone_number` (VARCHAR) - Contact phone number

### 2. organizations_institutes Table
**Purpose**: Stores profile information for sports organizations and educational institutions

**Columns**:
- `user_id` (UUID, Primary Key) - References users table
- `contact_name` (VARCHAR) - Primary contact person
- `organization_name` (VARCHAR) - Name of the organization
- `organization_type` (VARCHAR) - Type of organization (Sports Club, University, etc.)
- `website` (VARCHAR) - Organization website
- `phone_number` (VARCHAR) - Contact phone number
- `address` (VARCHAR) - Street address
- `city` (VARCHAR) - City
- `state` (VARCHAR) - State/Province
- `zip_code` (VARCHAR) - ZIP/Postal code
- `founded_year` (INTEGER) - Year organization was founded
- `mission_statement` (TEXT) - Organization's mission
- `programs_services` (TEXT) - Programs and services offered
- `target_audience` (VARCHAR) - Target audience
- `description` (TEXT) - About the organization

## Frontend Components Added

### 1. MediaCreatorSignupForm.tsx
**Location**: `src/components/auth/MediaCreatorSignupForm.tsx`

**Features**:
- Comprehensive form for media creators
- Dropdown selections for media type, specialization, and experience level
- Optional fields for portfolio URL, social media handles, and equipment
- Form validation and error handling
- Success/error toast notifications

**Form Fields**:
- Display Name
- Full Name
- Email
- Password/Confirm Password
- Media Type (dropdown)
- Specialization (dropdown)
- Experience Level (dropdown)
- Portfolio URL (optional)
- Social Media Handles (optional)
- Equipment/Skills (optional)
- Location
- Phone Number
- About You (optional)

### 2. OrganizationInstituteSignupForm.tsx
**Location**: `src/components/auth/OrganizationInstituteSignupForm.tsx`

**Features**:
- Comprehensive form for organizations and institutes
- Dropdown selections for organization type and target audience
- Year picker for founded year
- Address fields with city, state, ZIP code
- Form validation and error handling
- Success/error toast notifications

**Form Fields**:
- Display Name
- Contact Person Name
- Organization Name
- Email
- Password/Confirm Password
- Organization Type (dropdown)
- Founded Year (dropdown)
- Website (optional)
- Phone Number
- Address
- City
- State
- ZIP Code
- Target Audience (dropdown)
- Mission Statement (optional)
- Programs & Services (optional)
- About Your Organization (optional)

## Backend Integration

### Updated Files

#### 1. AuthSystem.tsx
- Added new user types: `"media_creator"` and `"organization_institute"`
- Imported new signup form components
- Updated `renderSignupForm()` function to handle new user types

#### 2. SignupCategorySelection.tsx
- Added two new category cards with appropriate icons and descriptions
- Added Camera icon for Media/Creator
- Added GraduationCap icon for Organization/Institute
- Updated color schemes for visual distinction

#### 3. backend/signup.js
- Added handling for `media_creator` user type
- Added handling for `organization_institute` user type
- Maps form data to appropriate database columns
- Maintains consistent error handling and response format

## User Experience

### Signup Flow
1. User clicks "Sign up" on the login page
2. User sees the category selection page with 7 options:
   - Athlete
   - Coach/Trainer
   - Sports Fan
   - Venue Owner
   - Sports Brand
   - **Media/Creator** (NEW)
   - **Organization/Institute** (NEW)
3. User selects their category
4. User fills out the appropriate form
5. Account is created and user is redirected to the main application

### Visual Design
- New categories have distinct color schemes:
  - Media/Creator: Pink gradient (`from-pink-500 to-pink-600`)
  - Organization/Institute: Indigo gradient (`from-indigo-500 to-indigo-600`)
- Icons are semantically appropriate:
  - Camera icon for media creators
  - Graduation cap for organizations/institutes

## Database Relationships
Both new tables have foreign key relationships to the `users` table:
- `media_creators.user_id` → `users.id`
- `organizations_institutes.user_id` → `users.id`

This ensures data integrity and allows for proper user authentication and profile management.

## Testing
The implementation has been tested for:
- TypeScript compilation (no errors)
- Database table creation (successful)
- Foreign key relationships (properly established)
- Form validation and submission flow

## Future Enhancements
Potential improvements that could be added:
1. Profile editing capabilities for the new user types
2. Specialized features for media creators (portfolio showcase, content management)
3. Organization-specific features (member management, event organization)
4. Advanced search and filtering by user type
5. Role-based permissions and access control

## Files Modified/Created
### New Files:
- `src/components/auth/MediaCreatorSignupForm.tsx`
- `src/components/auth/OrganizationInstituteSignupForm.tsx`
- `NEW_SIGNUP_FORMS_README.md`

### Modified Files:
- `src/components/AuthSystem.tsx`
- `src/components/auth/SignupCategorySelection.tsx`
- `backend/signup.js`

### Database:
- Created `media_creators` table
- Created `organizations_institutes` table 