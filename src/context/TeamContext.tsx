import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  permissions: {
    [key: string]: boolean;
  };
  avatar?: string;
  createdAt: Date;
}

interface TeamContextType {
  members: TeamMember[];
  loading: boolean;
  error: string | null;
  addMember: (member: Omit<TeamMember, 'id' | 'createdAt'>) => Promise<void>;
  updateMember: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  currentUserPermissions: (section: string) => boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from API
      try {
        const response = await api.get('/team');
        if (response.data) {
          setMembers(response.data);
          return;
        }
      } catch (err) {
        console.log('API fetch failed, using local data');
      }
      
      // Fallback to localStorage
      const savedMembers = localStorage.getItem('teamMembers');
      if (savedMembers) {
        setMembers(JSON.parse(savedMembers));
      } else {
        // Default admin user
        const defaultAdmin: TeamMember = {
          id: '1',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          permissions: {
            dashboard: true,
            goals: true,
            tasks: true,
            notes: true,
            proposals: true,
            reminders: true,
            pomodoro: true,
            scripts: true,
            email: true,
            'cold-email': true,
            analytics: true,
            settings: true,
            help: true
          },
          createdAt: new Date()
        };
        setMembers([defaultAdmin]);
        localStorage.setItem('teamMembers', JSON.stringify([defaultAdmin]));
      }
    } catch (err) {
      setError('Failed to load team members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (member: Omit<TeamMember, 'id' | 'createdAt'>) => {
    try {
      // Try API first
      try {
        const response = await api.post('/team', member);
        if (response.data) {
          setMembers(prev => [...prev, response.data]);
          return;
        }
      } catch (err) {
        console.log('API add failed, using local data');
      }
      
      // Fallback to localStorage
      const newMember: TeamMember = {
        ...member,
        id: Date.now().toString(),
        createdAt: new Date()
      };
      
      const updatedMembers = [...members, newMember];
      setMembers(updatedMembers);
      localStorage.setItem('teamMembers', JSON.stringify(updatedMembers));
    } catch (err) {
      setError('Failed to add team member');
      throw err;
    }
  };

  const updateMember = async (id: string, updates: Partial<TeamMember>) => {
    try {
      // Try API first
      try {
        const response = await api.put(`/team/${id}`, updates);
        if (response.data) {
          setMembers(prev => prev.map(m => m.id === id ? { ...m, ...response.data } : m));
          return;
        }
      } catch (err) {
        console.log('API update failed, using local data');
      }
      
      // Fallback to localStorage
      const updatedMembers = members.map(member => 
        member.id === id ? { ...member, ...updates } : member
      );
      
      setMembers(updatedMembers);
      localStorage.setItem('teamMembers', JSON.stringify(updatedMembers));
    } catch (err) {
      setError('Failed to update team member');
      throw err;
    }
  };

  const removeMember = async (id: string) => {
    try {
      // Try API first
      try {
        await api.delete(`/team/${id}`);
        setMembers(prev => prev.filter(m => m.id !== id));
        return;
      } catch (err) {
        console.log('API delete failed, using local data');
      }
      
      // Fallback to localStorage
      const updatedMembers = members.filter(member => member.id !== id);
      setMembers(updatedMembers);
      localStorage.setItem('teamMembers', JSON.stringify(updatedMembers));
    } catch (err) {
      setError('Failed to remove team member');
      throw err;
    }
  };

  const currentUserPermissions = (section: string): boolean => {
    // For now, assume the first member is the current user
    // In a real app, you'd check against the authenticated user
    if (members.length === 0) return true;
    const currentUser = members[0];
    return currentUser.permissions[section] || false;
  };

  return (
    <TeamContext.Provider value={{ 
      members, 
      loading, 
      error, 
      addMember, 
      updateMember, 
      removeMember,
      currentUserPermissions
    }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = (): TeamContextType => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};