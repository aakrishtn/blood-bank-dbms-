import { supabase } from './supabase';

// Sign up a new user
export async function signUp(email: string, password: string, userRole: string) {
  try {
    // Create the user without waiting for email confirmation
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: userRole
        }
      }
    });
    
    if (error) throw error;
    
    // Try to immediately sign in the user (this may or may not work depending on Supabase config)
    try {
      await supabase.auth.signInWithPassword({
        email,
        password
      });
    } catch (signInError) {
      // Ignore sign-in errors, we'll handle login separately
      console.error('Note: Auto sign-in failed, user will need to login manually:', signInError);
    }
    
    return data;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

// Sign in an existing user
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

// Sign out the current user
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Get the current logged in user
export async function getCurrentUser() {
  try {
    // First check if we have an active session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return null;
    }
    
    // If no active session, return null early - no need to make another API call
    if (!sessionData.session) {
      return null;
    }
    
    // Now get the user data since we have a valid session
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Unexpected error in getCurrentUser:', error);
    return null;
  }
}

// Associate a user with a profile (donor, receiver, staff, etc.)
export async function linkUserToProfile(userId: string, profileId: string, profileType: string) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        profile_id: profileId,
        profile_type: profileType
      });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error linking user to profile:', error);
    throw error;
  }
}

// Reset password
export async function resetPassword(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}

// Update user password
export async function updatePassword(password: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
} 