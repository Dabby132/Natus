# NATUS — Digital Birth Registration System

NATUS is a front-end digital birth registration prototype designed to simplify the process of registering births, tracking applications, reviewing submitted records, and managing registration statuses through separate parent and administrator portals.

## Overview

NATUS provides a digital workflow for birth registration:

1. A parent creates an account.
2. The parent signs in to the Parent Portal.
3. The parent completes a birth registration form.
4. The application is assigned a unique registration number.
5. The application is saved with a `pending` status.
6. An administrator reviews the submitted application.
7. The administrator can approve or reject the application.
8. The application status is reflected on the dashboard, reports and tracking page.

The project is implemented as a front-end prototype using browser `localStorage` as a simulated database.

## Features

### Parent Portal

* Parent account registration
* Parent login
* Birth registration form
* Automatic registration/reference number generation
* Application status tracking
* Session-based access to protected pages

### Administrator Portal

* Administrator login
* Role-based access control
* Dashboard statistics
* Application search
* Application review
* Approve/reject functionality
* Application status visualization
* Registry reports

### Application Tracking

Users can search for an application using its registration number and view its current progress through stages such as:

* Submitted
* Under review
* Verified/Rejected
* Certificate issued

## Technology Stack

* HTML5
* CSS3
* JavaScript
* Browser LocalStorage
* Chart.js
* Font Awesome
* Google Fonts

## System Architecture

NATUS is a front-end-only prototype.

Instead of using a traditional backend database such as MySQL, PostgreSQL or MongoDB, the application uses browser `localStorage` as a small simulated data store.

The shared `app.js` file provides the main application logic and exposes:

* `Natus.db` — data storage and application management
* `Natus.auth` — signup, login, sessions and role protection
* `Natus.toast` — notification messages
* `Natus.nav` — dynamic navigation
* `Natus.fx` — animations, counters and clock

## Data Storage

The application uses three main LocalStorage keys:

```text
natus_users
natus_applications
natus_session
```

### `natus_users`

Stores registered users and their roles.

Example:

```text
{
  name: "Registry Admin",
  email: "admin@natus.gov",
  password: "admin123",
  role: "admin"
}
```

Parent accounts are automatically assigned the `parent` role.

### `natus_applications`

Stores birth registration records including:

* Registration number
* Parent email
* Child information
* Parent information
* Birth details
* Application status
* Submission date

### `natus_session`

Stores information about the currently logged-in user:

```text
{
  name,
  email,
  role
}
```

## Demo Administrator Account

For demonstration purposes:

```text
Email: admin@natus.gov
Password: admin123
```

> This is a prototype credential and is not suitable for a production system.

## Important Prototype Limitation

NATUS currently uses browser LocalStorage instead of a real backend.

This means:

* Data is stored locally in the user's browser.
* There is no real server-side database.
* Passwords are not hashed.
* Authentication is implemented for demonstration purposes.
* Data is not securely shared between different devices or browsers.

A production version would use a backend API, a real database, secure authentication, password hashing, authorization middleware and secure document generation/storage.

## Project Structure

```text
NATUS/
│
├── index.html
├── login.html
├── parentlog.html
├── admin-login.html
├── register.html
├── records.html
├── admindash.html
├── reports.html
│
├── css/
│   └── style.css
│
└── js/
    └── app.js
```

## Application Workflow

```text
Parent
   ↓
Create Account / Login
   ↓
Birth Registration Form
   ↓
Application Saved
   ↓
Pending
   ↓
Administrator Review
   ↓
 ┌───────────────┐
 ↓               ↓
Approved       Rejected
 ↓               ↓
Verified       Correction
 ↓
Certificate Stage
```

## Purpose

The purpose of NATUS is to demonstrate how a digital civil registration workflow can be represented through a web interface, including user authentication, role management, data storage, application processing, status tracking and administrative reporting.

## Future Improvements

A production-ready version could include:

* Real backend API
* MySQL/PostgreSQL database
* Secure authentication
* Password hashing
* JWT/session-based authentication
* File/document uploads
* Real PDF certificate generation
* Digital signatures
* Email/SMS notifications
* Audit logs
* Multi-user server-side access
* Secure cloud storage
* Database-backed analytics

© 2026 NATUS Civil Registration Authority
