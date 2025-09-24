# MyPlantScan - Authentication Setup

This app now includes a production-ready authentication system using Supabase. Follow these steps to set it up:

## 🚀 Quick Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new account
2. Create a new project
3. Wait for the project to be set up (usually takes 1-2 minutes)

### 2. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the **Project URL** and **anon public** key

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Set Up Database Tables

1. In your Supabase dashboard, go to the **SQL Editor**
2. Run the following SQL to create the profiles table:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for secure access
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5. Configure Authentication Settings (Optional)

In your Supabase dashboard, go to **Authentication** > **Settings**:

- **Site URL**: Set to your app's URL (for web) or custom scheme (for mobile)
- **Email Templates**: Customize signup/reset password emails
- **Providers**: Enable additional auth providers if needed (Google, Apple, etc.)

## 🔐 Authentication Features

The app now includes:

- ✅ **Sign Up** - Create new accounts with email/password
- ✅ **Sign In** - Login with existing accounts
- ✅ **Password Reset** - Reset forgotten passwords via email
- ✅ **Profile Management** - Update user profile information
- ✅ **Sign Out** - Secure logout with data cleanup
- ✅ **Session Management** - Automatic token refresh and persistence
- ✅ **Security** - Row Level Security (RLS) policies
- ✅ **Cross-Platform** - Works on iOS, Android, and Web

## 📱 How It Works

1. **More Tab**: Users can sign in/up from the More screen
2. **Profile Card**: Authenticated users see their profile at the top
3. **Data Sync**: User data is automatically synced across devices
4. **Security**: All data is protected with proper authentication
5. **Offline Support**: App works offline, syncs when online

## 🛠 Development

The authentication system is built with:

- **Supabase Auth**: Production-ready authentication service
- **React Context**: Efficient state management with `@nkzw/create-context-hook`
- **TypeScript**: Full type safety throughout
- **React Query**: Caching and synchronization
- **Expo**: Cross-platform compatibility

## 🔧 Customization

You can customize the authentication flow by:

1. **Styling**: Modify colors and design in the auth components
2. **Fields**: Add/remove profile fields in the database and forms
3. **Providers**: Enable social login (Google, Apple, GitHub, etc.)
4. **Email Templates**: Customize signup and reset emails in Supabase
5. **Policies**: Adjust database security policies as needed

## 🚨 Security Notes

- Environment variables are properly configured for security
- Row Level Security (RLS) is enabled on all tables
- User data is isolated and protected
- Passwords are handled securely by Supabase
- Sessions are automatically managed and refreshed

## 📞 Support

If you need help setting up authentication:

1. Check the Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
2. Review the `.env.example` file for configuration details
3. Ensure your database tables are created correctly
4. Verify your environment variables are set properly

The authentication system is production-ready and follows security best practices!