# Deployment Guide

## Security-First Deployment to Vercel

This guide ensures your expense tracker is deployed securely with proper authentication.

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready
3. Go to **Settings** → **API** and copy:
   - Project URL
   - anon/public key
   - service_role key (keep this secret!)

### 2. Set up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Copy and paste the entire content from `supabase-schema.sql`
3. Run the query to create tables and security policies

### 3. Configure Environment Variables

#### For Local Development:
Update `.env.local` with your actual Supabase values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXTAUTH_SECRET=generate_a_random_secret_string
NEXTAUTH_URL=http://localhost:3000
```

#### For Vercel Deployment:
1. In Vercel dashboard, go to your project settings
2. Go to **Environment Variables**
3. Add the same variables but update NEXTAUTH_URL to your production URL

### 4. Deploy to Vercel

#### Option A: GitHub Integration (Recommended)
1. Push your code to GitHub (ensure `.env.local` is in `.gitignore`)
2. Connect your GitHub repo to Vercel
3. Vercel will automatically deploy on every push to main branch

#### Option B: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 5. Security Checklist

✅ **Authentication Required**: All routes except `/login` require authentication
✅ **Row Level Security**: Database policies ensure users only see their own data  
✅ **Environment Variables**: Secrets are properly configured and not committed to git
✅ **HTTPS**: Vercel provides automatic HTTPS
✅ **Security Headers**: Added in `vercel.json`
✅ **No Data Exposure**: Public routes don't expose any user data

### 6. Test Your Deployment

1. Visit your Vercel URL
2. You should be redirected to `/login`
3. Create an account with your email
4. Check email for confirmation link
5. After confirming, you should be able to access the app
6. Try logging out and back in
7. Verify data is persisted across sessions

### 7. Data Migration

If you have existing CSV data:
1. Log into your deployed app
2. You'll see a "Migrate to Cloud Storage" option
3. Click it to transfer your local data to the secure database

### 8. Ongoing Security

- Regularly update dependencies
- Monitor Supabase logs for suspicious activity
- Consider enabling Supabase's built-in rate limiting
- Review user access periodically

### Important Notes

- **Never commit** `.env.local` or any file containing secrets
- **Always test** the authentication flow after deployment
- **Monitor usage** to stay within free tier limits
- **Backup strategy**: Supabase handles backups, but you can export data via the dashboard

### Troubleshooting

**Authentication not working?**
- Check environment variables are set correctly in Vercel
- Verify Supabase project URL and keys
- Check browser console for errors

**Database errors?**
- Ensure schema was created successfully in Supabase
- Check Row Level Security policies are enabled
- Verify user is authenticated

**Migration issues?**
- Check browser console for specific error messages
- Ensure user has proper permissions
- Try refreshing and logging in again