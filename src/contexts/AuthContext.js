import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile and organization
  const fetchUserData = useCallback(async (userId) => {
    try {
      // Fetch profile with organization_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        // Profile doesn't exist yet (will be created by trigger)
        console.log('Profile not found, waiting for trigger...');
        return;
      }

      setProfile(profileData);

      // Fetch organization if user has one
      if (profileData?.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.organization_id)
          .single();

        if (!orgError && orgData) {
          setOrganization(orgData);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  // Refresh organization data
  const refreshOrganization = useCallback(async () => {
    if (profile?.organization_id) {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single();

      if (!orgError && orgData) {
        setOrganization(orgData);
      }
    }
  }, [profile?.organization_id]);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  }, [user?.id, fetchUserData]);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchUserData(currentUser.id);
      }
      
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        // Small delay to allow trigger to create profile/org
        setTimeout(() => {
          fetchUserData(currentUser.id);
        }, 500);
      } else {
        setProfile(null);
        setOrganization(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchUserData]);

  const signUp = (email, password) => {
    return supabase.auth.signUp({ email, password });
  };

  const signIn = (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    try {
      // Zuerst den User-State lokal zurücksetzen
      setUser(null);
      setProfile(null);
      setOrganization(null);
      
      // Dann Supabase Logout durchführen
      const { error } = await supabase.auth.signOut();
      
      // LocalStorage aufräumen
      localStorage.removeItem('documentsCount');
      
      if (error) {
        console.error('SignOut error:', error);
      }
      
      return { error };
    } catch (error) {
      console.error('SignOut exception:', error);
      return { error };
    }
  };

  const value = {
    user,
    profile,
    organization,
    organizationId: profile?.organization_id || null,
    signUp,
    signIn,
    signOut,
    loading,
    refreshOrganization,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
