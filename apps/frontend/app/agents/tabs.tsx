'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns"
import { getIncubating, getEnlightened, ClientAgent } from "@/lib/api/agent";
import { isSuccessResult } from "@/lib/api/result";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsLoggedIn, useDynamicContext } from "@dynamic-labs/sdk-react-core";

export default function AgentsTabs({ searchQuery, setSearchQuery }: { searchQuery: string, setSearchQuery: (query: string) => void }) {
  const [enlightened, setEnlightened] = useState<ClientAgent[]>([]);
  const [incubating, setIncubating] = useState<ClientAgent[]>([]);
  const [isLoadingEnlightened, setIsLoadingEnlightened] = useState(true);
  const [isLoadingIncubating, setIsLoadingIncubating] = useState(true);
  const isLoggedIn = useIsLoggedIn();
  const { setShowAuthFlow } = useDynamicContext();

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
      <div className="rounded-2xl border-1 bg-panel p-6 w-full">
        <div className="text-white text-2xl mb-4">AGENTS</div>
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
                  <h2 className="text-white">Unable to retrieve enlightened agents!</h2>
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
                  <h2 className="text-white">Unable to retrieve incubating agents!</h2>
                </div>
            )}
          </TabsContent>
          <TabsContent value="myagents">
            {!isLoggedIn ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <h2 className="text-white text-xl font-alexandria">You need to be logged in to view your agents</h2>
                <button
                  onClick={() => setShowAuthFlow(true)}
                  className="group inline-flex items-center justify-center px-5 py-1.5 border-2 border-anakiwa rounded-2xl bg-[#111522] font-alexandria text-white text-base md:text-lg tracking-widest font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white hover:border-white hover:text-white"
                  style={{ letterSpacing: '0.08em' }}
                >
                  <span className="text-left">REGISTER</span>
                  <span className="ml-3 flex items-center justify-center w-8 h-8 bg-anakiwa rounded-lg transition-colors duration-200 group-hover:bg-white">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </span>
                </button>
              </div>
            ) : (
              isLoadingIncubating ? (
                <LoadingSkeleton />
              ) : (
                ( incubating.length > 0 )
                ? <DataTable columns={columns} data={incubating} paginationClassName="mt-8 flex justify-end" />
                : <div>
                    <h2 className="text-white">You don't have any agents yet!</h2>
                  </div>
              )
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}