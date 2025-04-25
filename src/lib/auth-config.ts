import { supabase } from "./supabase";

interface UserWithRole {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string;
}

// Utility function to create a Supabase client with admin privileges
export const getAdminSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing environment variables for admin Supabase client');
  }
  
  return supabase;
};

// Fetch user profile information based on user ID
export const getUserProfile = async (userId: string): Promise<UserWithRole | null> => {
  try {
    // Get profile data to determine specific role details
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId);

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return null;
    }

    // Get user data to access metadata
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      console.error("Error fetching user data:", userError);
      return null;
    }
    
    // Get user metadata from auth
    const userRole = userData.user.user_metadata?.role || 'guest';

    // Get name from corresponding profile (donor, receiver, etc.)
    let userName = '';
    
    if (profileData && profileData.length > 0) {
      const profile = profileData[0];
      const profileType = profile.profile_type;
      const profileId = profile.profile_id;
      
      if (profileType === 'donor') {
        const { data: donorData } = await supabase
          .from('donor')
          .select('donor_name')
          .eq('donor_id', profileId)
          .single();
        
        if (donorData) {
          userName = donorData.donor_name;
        }
      } else if (profileType === 'receiver') {
        const { data: receiverData } = await supabase
          .from('receiver')
          .select('receiver_name')
          .eq('receiver_id', profileId)
          .single();
        
        if (receiverData) {
          userName = receiverData.receiver_name;
        }
      } else if (profileType === 'hospital') {
        const { data: hospitalData } = await supabase
          .from('hospital')
          .select('h_name')
          .eq('h_id', profileId)
          .single();
        
        if (hospitalData) {
          userName = hospitalData.h_name;
        }
      }
    }

    return {
      id: userData.user.id,
      email: userData.user.email,
      name: userName || userData.user.email?.split('@')[0],
      role: userRole,
    };
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return null;
  }
}; 