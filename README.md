# Blood Bank Management System

A comprehensive blood bank management system built with Next.js, Supabase, and shadcn/ui.

## Features

- User authentication (donors, receivers, hospitals)
- Donor registration and management
- Receiver registration and blood requests
- Blood sample inventory management
- Blood compatibility matching
- Modern UI with shadcn/ui components

## Database Schema

The system follows a relational model with the following main entities:

- Donor
- Receiver
- Hospital
- Blood Sample
- City
- Staff
- Manager
- Doctor

The database includes triggers, stored procedures, and RLS (Row Level Security) policies for data integrity and security.

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (based on Radix UI)
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Custom auth with Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd blood_bank_management_system
```

2. Install dependencies:

```bash
npm install
```

3. Create a Supabase project and set up the database:

   - Create a new project in Supabase
   - Run the SQL commands from `supabase/schema.sql` in the SQL Editor

4. Set up environment variables:

   - Copy `.env.local.example` to `.env.local`
   - Update the Supabase URL and anon key in `.env.local`

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Operations

The system implements various database operations:

- **Triggers**: For validating blood groups
- **Stored Procedures**: For matching compatible donors with receivers
- **RLS Policies**: For controlling access to data based on user roles
- **Indexes**: For optimizing queries on frequently accessed fields

## Project Structure

```
blood_bank_management_system/
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js app routes
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── login/          # Authentication pages
│   │   ├── donor/          # Donor-specific pages
│   │   ├── receiver/       # Receiver-specific pages
│   │   └── hospital/       # Hospital-specific pages
│   ├── components/         # React components
│   │   └── ui/             # UI components from shadcn/ui
│   └── lib/                # Utility functions
│       ├── auth.ts         # Authentication functions
│       ├── database.ts     # Database API functions
│       ├── supabase.ts     # Supabase client
│       └── utils.ts        # Helper functions
└── supabase/
    └── schema.sql          # Database schema
```

## Limitations

- The blood tracking system is simplified for demonstration purposes
- Limited reporting capabilities
- Simplified hospital integration
