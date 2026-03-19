# Show Cue Flow

Manage your show cues seamlessly with this React + Vite + Supabase application.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun
- Supabase CLI (optional, for edge functions and migrations)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Copy `.env` and fill in your Supabase credentials.

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:8080`.

## Supabase Integration

This project uses Supabase for the backend, including:
- PostgreSQL Database
- Authentication
- Edge Functions

### Deploying Edge Functions

To deploy functions to your Supabase project:
```bash
supabase functions deploy <function-name>
```

### Applying Migrations

To apply database migrations:
```bash
supabase db push
```

## Technologies Used

- **Frontend**: React, Vite, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **State Management**: React Query
