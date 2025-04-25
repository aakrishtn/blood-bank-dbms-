export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          user_id: string;
          profile_id: string;
          profile_type: string;
        };
        Insert: {
          user_id: string;
          profile_id: string;
          profile_type: string;
        };
        Update: {
          user_id?: string;
          profile_id?: string;
          profile_type?: string;
        };
      };
      donor: {
        Row: {
          donor_id: string;
          donor_name: string;
          donor_age: number;
          donor_bgrp: string;
          donor_sex: string;
          donor_phno?: string;
          city_id?: string;
          staff_id?: string;
        };
        Insert: {
          donor_id: string;
          donor_name: string;
          donor_age: number;
          donor_bgrp: string;
          donor_sex: string;
          donor_phno?: string;
          city_id?: string;
          staff_id?: string;
        };
        Update: {
          donor_id?: string;
          donor_name?: string;
          donor_age?: number;
          donor_bgrp?: string;
          donor_sex?: string;
          donor_phno?: string;
          city_id?: string;
          staff_id?: string;
        };
      };
      receiver: {
        Row: {
          receiver_id: string;
          receiver_name: string;
          r_age: number;
          r_bgrp: string;
          r_sex: string;
          r_reg_date: string;
          r_phno?: string;
          staff_id?: string;
          city_id?: string;
          m_id?: string;
        };
        Insert: {
          receiver_id: string;
          receiver_name: string;
          r_age: number;
          r_bgrp: string;
          r_sex: string;
          r_reg_date: string;
          r_phno?: string;
          staff_id?: string;
          city_id?: string;
          m_id?: string;
        };
        Update: {
          receiver_id?: string;
          receiver_name?: string;
          r_age?: number;
          r_bgrp?: string;
          r_sex?: string;
          r_reg_date?: string;
          r_phno?: string;
          staff_id?: string;
          city_id?: string;
          m_id?: string;
        };
      };
      hospital: {
        Row: {
          h_id: string;
          h_name: string;
          h_bgrprequired?: string;
          h_bgrpreceived?: string;
          city_id?: string;
          m_id?: string;
        };
        Insert: {
          h_id: string;
          h_name: string;
          h_bgrprequired?: string;
          h_bgrpreceived?: string;
          city_id?: string;
          m_id?: string;
        };
        Update: {
          h_id?: string;
          h_name?: string;
          h_bgrprequired?: string;
          h_bgrpreceived?: string;
          city_id?: string;
          m_id?: string;
        };
      };
      appointments: {
        Row: {
          appointment_id: string;
          donor_id: string;
          receiver_id: string;
          appointment_date: string;
          status: string;
          blood_center_id: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          appointment_id?: string;
          donor_id: string;
          receiver_id: string;
          appointment_date: string;
          status?: string;
          blood_center_id: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          appointment_id?: string;
          donor_id?: string;
          receiver_id?: string;
          appointment_date?: string;
          status?: string;
          blood_center_id?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      blood_sample: {
        Row: {
          sample_id: string;
          blood_grp: string;
          status: string;
          m_id?: string;
          doc_id?: string;
        };
        Insert: {
          sample_id: string;
          blood_grp: string;
          status: string;
          m_id?: string;
          doc_id?: string;
        };
        Update: {
          sample_id?: string;
          blood_grp?: string;
          status?: string;
          m_id?: string;
          doc_id?: string;
        };
      };
      city: {
        Row: {
          city_id: string;
          city_name: string;
        };
        Insert: {
          city_id: string;
          city_name: string;
        };
        Update: {
          city_id?: string;
          city_name?: string;
        };
      };
      blood_center: {
        Row: {
          center_id: string;
          center_name: string;
          address?: string;
          city_id?: string;
          coordinates?: { x: number; y: number }; // POINT type represented as {x,y} or {lng,lat}
          phone?: string;
          operating_hours?: string;
          available_services?: string[];
          api_source?: string;
          last_updated?: string;
        };
        Insert: {
          center_id: string;
          center_name: string;
          address?: string;
          city_id?: string;
          coordinates?: { x: number; y: number }; // POINT type represented as {x,y} or {lng,lat}
          phone?: string;
          operating_hours?: string;
          available_services?: string[];
          api_source?: string;
          last_updated?: string;
        };
        Update: {
          center_id?: string;
          center_name?: string;
          address?: string;
          city_id?: string;
          coordinates?: { x: number; y: number }; // POINT type represented as {x,y} or {lng,lat}
          phone?: string;
          operating_hours?: string;
          available_services?: string[];
          api_source?: string;
          last_updated?: string;
        };
      };
    };
  };
} 