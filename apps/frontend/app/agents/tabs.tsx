'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns"
import { getIncubating, getEnlightened, ClientAgent } from "@/lib/api/agent";
import { isSuccessResult } from "@/lib/api/result";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgentsTabs({ searchQuery, setSearchQuery }: { searchQuery: string, setSearchQuery: (query: string) => void }) {
  const [enlightened, setEnlightened] = useState<ClientAgent[]>([]);
  const [incubating, setIncubating] = useState<ClientAgent[]>([]);
  const [isLoadingEnlightened, setIsLoadingEnlightened] = useState(true);
  const [isLoadingIncubating, setIsLoadingIncubating] = useState(true);

  useEffect(() => {
    
    const fetchEnlightened = async () => {
      console.log('Starting to fetch enlightened agents...');
      setIsLoadingEnlightened(true);
      // Add a small delay to make loading state visible for testing
      await new Promise(resolve => setTimeout(resolve, 1000));
      const result = await getEnlightened();
      console.log('Enlightened result:', result);
      if (isSuccessResult(result)) {
        setEnlightened(result.data);
      }
      setIsLoadingEnlightened(false);
      console.log('Finished fetching enlightened agents');
    };
    const fetchIncubating = async () => {
      console.log('Starting to fetch incubating agents...');
      setIsLoadingIncubating(true);
      // Add a small delay to make loading state visible for testing
      await new Promise(resolve => setTimeout(resolve, 1000));
      const result = await getIncubating();
      console.log('Incubating result:', result);
      if (isSuccessResult(result)) {
        setIncubating(result.data);
      }
      setIsLoadingIncubating(false);
      console.log('Finished fetching incubating agents');
    };
    fetchIncubating();
    fetchEnlightened();
  }, []);

  useEffect(() => {
    console.log('Rendering with loading states:', { isLoadingEnlightened, isLoadingIncubating });
  }, [isLoadingEnlightened, isLoadingIncubating]);

  // Filter agents based on search query
  const filterAgents = (agents: ClientAgent[]) => {
    if (!searchQuery.trim()) return agents;

    return agents.filter(agent => 
      agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.ticker?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-gray-600 animate-pulse rounded-md"></div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 w-full bg-gray-600 animate-pulse rounded-md"></div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="rounded-2xl border-1 border-[#233447] bg-[#181C23] p-6 w-full">
        <div className="font-pixelcraft text-white text-2xl mb-4">AGENTS</div>
        <Tabs defaultValue="enlightened">
          <TabsList className="mb-6">
            <TabsTrigger value="enlightened" className="mr-4">Enlightened</TabsTrigger>
            <TabsTrigger value="incubating" className="mr-4">Incubating</TabsTrigger>
            <TabsTrigger value="myagents">My Agents</TabsTrigger>
          </TabsList>
          <TabsContent value="enlightened">
            {isLoadingEnlightened ? (
              <LoadingSkeleton />
            ) : (
              ( enlightened.length > 0 )
              ? <DataTable columns={columns} data={enlightened} paginationClassName="mt-8 flex justify-end" />
              : <div>
                  <h2 className="text-white font-alexandria">Unable to retrieve enlightened agents!</h2>
                </div>
            )}
          </TabsContent>
          <TabsContent value="incubating">
            {isLoadingIncubating ? (
              <LoadingSkeleton />
            ) : (
              ( incubating.length > 0 )
              ? <DataTable columns={columns} data={incubating} paginationClassName="mt-8 flex justify-end" />
              : <div>
                  <h2 className="text-white font-alexandria">Unable to retrieve incubating agents!</h2>
                </div>
            )}
          </TabsContent>
          <TabsContent value="myagents">
            {isLoadingIncubating ? (
              <LoadingSkeleton />
            ) : (
              ( incubating.length > 0 )
              ? <DataTable columns={columns} data={incubating} paginationClassName="mt-8 flex justify-end" />
              : <div>
                  <h2 className="text-white font-alexandria">You don't have any agents yet!</h2>
                </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}