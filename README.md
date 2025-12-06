# Our Family Tree Application

A comprehensive family tree application with shared photo galleries, calendars, timelines, family stories, and internal messaging system.

## Features

- **Family Tree**: Create and manage multiple family sides with members
- **Family Gallery**: Upload and share family photos with captions
- **Family Calendar**: Track important family events and milestones
- **Family Timeline**: Document family history with year-based entries
- **Family Book**: Write and share family stories and memories
- **Internal Mailbox**: Send private messages to family members (@username@family.local)
- **Authentication**: Secure user registration and login
- **Row Level Security**: All data protected with RLS policies

## Setup Instructions

### Environment Variables

Create a `.env` file:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Local Development

```bash
npm install
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

## Deployment to Render

1. Push to GitHub
2. Create a Web Service on Render.com
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables for Supabase
6. Deploy!

## Technology Stack

- React 19 + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Vite
- Express.js
