import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useOrganizations } from "@/hooks/use-organizations";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Filter, Search } from "lucide-react";
import PrayerCard from "@/components/prayer-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getQueryFn } from "@/lib/queryClient";

export default function PrayerRequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { currentOrganization } = useOrganizations();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Redirect if no current organization
  useEffect(() => {
    if (!currentOrganization) {
      navigate("/");
    }
  }, [currentOrganization, navigate]);

  // Fetch all user's prayer requests for the current organization
  const { data: prayerRequests = [], isLoading: isLoadingRequests } = useQuery<any[]>({
    queryKey: ["/api/requests/user/all", currentOrganization?.id],
    queryFn: getQueryFn({ 
      params: { organizationId: currentOrganization?.id },
    }),
    enabled: !!currentOrganization?.id,
  });

  // Filter prayer requests based on search term and status filter
  const filteredRequests = prayerRequests.filter(request => {
    const matchesSearch = searchTerm === "" || 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      request.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <Header />
      
      <main className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/profile")}
              className="mr-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">My Prayer Requests</h1>
          </div>
          
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search prayer requests..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select 
                    value={statusFilter} 
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="answered">Answered</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Prayer Requests List */}
          <div className="space-y-4">
            {isLoadingRequests ? (
              <>
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </>
            ) : filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <PrayerCard
                  key={request.id}
                  request={request}
                  onClick={() => navigate(`/requests/${request.id}`)}
                />
              ))
            ) : (
              <div className="text-center py-12 bg-muted rounded-lg">
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "No prayer requests match your search."
                    : "You haven't created any prayer requests yet."}
                </p>
                <Button onClick={() => navigate("/")}>
                  Create a Prayer Request
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <MobileNav active="profile" />
    </div>
  );
}