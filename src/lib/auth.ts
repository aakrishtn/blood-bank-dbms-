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
    console.log(`Attempting to link user ${userId} to ${profileType} profile ${profileId}`);
    
    // First check if the user exists in the users table
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();
      
    if (userCheckError) {
      const errorDetail = userCheckError.message || userCheckError.code || JSON.stringify(userCheckError);
      if (userCheckError.code !== 'PGRST116') { // Not just a "no rows" error
        console.error("Error checking user existence:", errorDetail);
      } else {
        console.log("User not found in users table, will create it");
      }
    }
    
    // Create the user in the users table if it doesn't exist
    if (!existingUser) {
      console.log("Creating user in users table first");
      
      // Get user data from auth to get the email
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        const errorDetail = userError.message || userError.code || JSON.stringify(userError);
        console.error("Error getting user data from auth:", errorDetail);
        throw new Error(`Failed to get user data: ${errorDetail}`);
      }
      
      if (!userData || !userData.user) {
        throw new Error("No authenticated user found");
      }
      
      // Create the user in the users table
      const { error: userInsertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userData.user.email || 'unknown@example.com',
          password_hash: '', // We don't have access to password hash
          user_role: profileType
        });
        
      if (userInsertError) {
        const errorDetail = userInsertError.message || userInsertError.code || JSON.stringify(userInsertError);
        
        // If it's a unique violation, it means the user was inserted concurrently by another request
        if (userInsertError.code === '23505') { // Unique violation
          console.log("User already exists (concurrent insert), continuing with profile creation");
        } else {
          console.error("Error creating user in users table:", errorDetail);
          throw new Error(`Failed to create user: ${errorDetail}`);
        }
      } else {
        console.log("Successfully created user in users table");
      }
    } else {
      console.log("User already exists in users table:", existingUser.email);
    }
    
    // Now check if user profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (checkError) {
      // Check for empty error object
      if (Object.keys(checkError).length === 0) {
        console.error("Error checking existing profile: Empty error object. This might be a 404 Not Found.");
      } else if (checkError.code === 'PGRST116') { 
        // PGRST116 means no rows returned - this is expected
        console.log("No existing profile found, will create new one");
      } else {
        const errorDetail = checkError.message || checkError.code || JSON.stringify(checkError);
        console.error("Error checking existing profile:", errorDetail);
      }
    }
    
    if (existingProfile) {
      console.log("User already has a profile, updating it:", existingProfile);
      // Update existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          profile_id: profileId,
          profile_type: profileType
        })
        .eq('user_id', userId);
        
      if (error) {
        const errorDetail = error.message || error.code || JSON.stringify(error);
        console.error("Error updating user profile:", errorDetail);
        throw new Error(`Failed to update profile: ${errorDetail}`);
      }
      
      console.log("Successfully updated user profile");
      return data;
    } else {
      // Create new profile
      console.log("Creating new user profile");
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          profile_id: profileId,
          profile_type: profileType
        });
        
      if (error) {
        const errorDetail = error.message || error.code || JSON.stringify(error);
        console.error("Error creating user profile:", errorDetail);
        throw new Error(`Failed to create profile: ${errorDetail}`);
      }
      
      console.log("Successfully created user profile");
      return data;
    }
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : (typeof error === 'object' && error !== null)
        ? JSON.stringify(error)
        : String(error);
        
    console.error('Error in linkUserToProfile:', errorMessage);
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