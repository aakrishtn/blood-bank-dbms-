# Blood Bank Management System

A comprehensive blood bank management system built with Next.js, TypeScript, and Supabase. This application allows donors to register, make appointments, and receivers to request blood donations, all within a secure and user-friendly interface.

## Features

- User authentication and role-based access control
- Donor registration and management
- Blood receiver management
- Appointment scheduling
- Inventory tracking
- Hospital and blood center integration
- Dashboard with real-time updates

## Tech Stack

- **Frontend**: Next.js 15.3, React 19, TailwindCSS
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **UI Components**: Custom components + Radix UI
- **Styling**: TailwindCSS, shadcn/ui inspired components

## Database Schema

The application uses a relational database with the following main tables:

- Users - Authentication and user roles
- Donors - Blood donor profiles
- Receivers - Blood request profiles
- Hospitals - Medical facilities information
- Appointments - Donation appointments
- Blood Samples - Inventory tracking
- Cities - Location data for donors and facilities

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn
- A Supabase account

### Setting up Supabase

1. Create a new project in Supabase
2. Get your API credentials from the Supabase dashboard
3. Create a `.env.local` file in the project root with the following:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Database Setup

1. Create a `.env` file in the project root with your Supabase credentials (same as above)
2. Run the database setup script:

```bash
# Install dotenv package (if not already installed)
npm install dotenv

# Run the database setup script
node setup-db.mjs
```

Alternatively, you can manually run the SQL statements in the `schema.sql` file using the Supabase SQL editor.

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

### Development

```bash
# Start the development server
npm run dev

# Build for production
npm run build

# Start the production server
npm start
```

## Project Structure

```
blood_bank_management_system/
├── public/            # Static assets
├── src/
│   ├── app/           # Next.js app router
│   │   ├── api/       # API routes
│   │   ├── donor/     # Donor pages
│   │   ├── receiver/  # Receiver pages
│   │   └── ...        # Other routes
│   ├── components/    # Reusable UI components
│   │   └── ui/        # UI component library
│   ├── lib/           # Utility functions
│   └── types/         # TypeScript type definitions
├── schema.sql         # Database schema
├── setup-db.mjs       # Database setup script
├── .env.local         # Environment variables (create this)
└── ...                # Config files
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
