import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { Organization, InsertOrganization, OrganizationMember } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type OrganizationContextType = {
  organizations: Organization[];
  currentOrganization: Organization | null;
  isLoading: boolean;
  error: Error | null;
  setCurrentOrganizationId: (id: number) => void;
  createOrganizationMutation: UseMutationResult<Organization, Error, Omit<InsertOrganization, "createdBy">>;
  updateOrganizationMutation: UseMutationResult<Organization, Error, { id: number, data: Partial<InsertOrganization> }>;
  deleteOrganizationMutation: UseMutationResult<void, Error, number>;
  leaveOrganizationMutation: UseMutationResult<void, Error, number>;
  inviteMemberMutation: UseMutationResult<void, Error, { organizationId: number, email: string, role: "admin" | "member" }>;
  removeMemberMutation: UseMutationResult<void, Error, { organizationId: number, userId: number }>;
  organizationMembers: OrganizationMember[];
  isLoadingMembers: boolean;
  errorMembers: Error | null;
};

export const OrganizationContext = createContext<OrganizationContextType | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentOrganizationId, setCurrentOrganizationId] = useState<number | null>(null);

  // Load user's organizations
  const {
    data: organizations = [],
    error,
    isLoading,
  } = useQuery<Organization[], Error>({
    queryKey: ["/api/organizations"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Set default organization if needed
  const currentOrganization = organizations.find(org => org.id === currentOrganizationId) || organizations[0] || null;
  
  // Whenever organizations data changes, update current org if needed
  useEffect(() => {
    if (organizations.length > 0 && !currentOrganizationId && !isLoading) {
      setCurrentOrganizationId(organizations[0].id);
    }
  }, [organizations, currentOrganizationId, isLoading]);

  // Load organization members for current organization
  const {
    data: organizationMembers = [],
    error: errorMembers,
    isLoading: isLoadingMembers,
  } = useQuery<OrganizationMember[], Error>({
    queryKey: ["/api/organizations/members"],
    queryFn: () => {
      if (!currentOrganizationId) return Promise.resolve([]);
      return fetch(`/api/organizations/members?organizationId=${currentOrganizationId}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch members');
          return res.json();
        });
    },
    enabled: !!currentOrganizationId,
  });

  // Create organization mutation
  const createOrganizationMutation = useMutation({
    mutationFn: async (orgData: Omit<InsertOrganization, "createdBy">) => {
      const res = await apiRequest("POST", "/api/organizations", orgData);
      return await res.json();
    },
    onSuccess: (organization: Organization) => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({
        title: "Organization created",
        description: `${organization.name} has been created successfully.`,
      });
      setCurrentOrganizationId(organization.id);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create organization",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update organization mutation
  const updateOrganizationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<InsertOrganization> }) => {
      const res = await apiRequest("PATCH", `/api/organizations/${id}`, data);
      return await res.json();
    },
    onSuccess: (organization: Organization) => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({
        title: "Organization updated",
        description: `${organization.name} has been updated successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update organization",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete organization mutation
  const deleteOrganizationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/organizations/${id}`);
    },
    onSuccess: (_, deletedOrgId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({
        title: "Organization deleted",
        description: "The organization has been deleted successfully.",
      });
      
      // If we're deleting the current organization, we need to select a new one
      if (currentOrganizationId === deletedOrgId) {
        const remainingOrgs = organizations.filter(org => org.id !== deletedOrgId);
        if (remainingOrgs.length > 0) {
          setCurrentOrganizationId(remainingOrgs[0].id);
        } else {
          setCurrentOrganizationId(null);
          // Redirect to onboarding if no organizations left
          window.location.href = "/onboarding";
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete organization",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async ({ organizationId, email, role }: { organizationId: number, email: string, role: "admin" | "member" }) => {
      await apiRequest("POST", `/api/organizations/${organizationId}/invite`, { email, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations/members"] });
      toast({
        title: "Invitation sent",
        description: "The user has been invited to the organization.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to invite member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ organizationId, userId }: { organizationId: number, userId: number }) => {
      await apiRequest("DELETE", `/api/organizations/${organizationId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations/members"] });
      toast({
        title: "Member removed",
        description: "The member has been removed from the organization.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Leave organization mutation
  const leaveOrganizationMutation = useMutation({
    mutationFn: async (orgId: number) => {
      await apiRequest("POST", `/api/organizations/${orgId}/leave`);
    },
    onSuccess: (_, leftOrgId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({
        title: "Organization left",
        description: "You have left the organization successfully.",
      });

      // If we're leaving the current organization, we need to select a new one
      if (currentOrganizationId === leftOrgId) {
        const remainingOrgs = organizations.filter(org => org.id !== leftOrgId);
        if (remainingOrgs.length > 0) {
          setCurrentOrganizationId(remainingOrgs[0].id);
        } else {
          setCurrentOrganizationId(null);
          // Redirect to onboarding if no organizations left
          window.location.href = "/onboarding";
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to leave organization",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        isLoading,
        error,
        setCurrentOrganizationId,
        createOrganizationMutation,
        updateOrganizationMutation,
        deleteOrganizationMutation,
        leaveOrganizationMutation,
        inviteMemberMutation,
        removeMemberMutation,
        organizationMembers,
        isLoadingMembers,
        errorMembers,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizations() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganizations must be used within an OrganizationProvider");
  }
  return context;
}