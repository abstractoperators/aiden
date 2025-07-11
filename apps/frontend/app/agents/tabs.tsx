'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns"
import { getIncubating, getEnlightened, ClientAgent } from "@/lib/api/agent";
import { isSuccessResult } from "@/lib/api/result";
import { useEffect, useState } from "react";
import { useIsLoggedIn, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgentsTabs({
//   searchQuery,
//   setSearchQuery,
// }: {
//   searchQuery: string,
//   setSearchQuery: (query: string) => void,
}) {
  const [enlightened, setEnlightened] = useState<ClientAgent[]>([]);
  const [incubating, setIncubating] = useState<ClientAgent[]>([]);
  const [isLoadingEnlightened, setIsLoadingEnlightened] = useState(true);
  const [isLoadingIncubating, setIsLoadingIncubating] = useState(true);
  const isLoggedIn = useIsLoggedIn();
  const { setShowAuthFlow } = useDynamicContext();

  useEffect(() => {
    
    const fetchEnlightened = async () => {
      console.log('Starting to fetch enlightened agents...');
      // Add a small delay to make loading state visible for testing
      await new Promise(resolve => setTimeout(resolve, 1000));
      const result = await getEnlightened();
      console.log('Enlightened result:', result);
      if (isSuccessResult(result)) {
        setEnlightened(result.data);
      }
      setIsLoadingEnlightened(false);
    };
    const fetchIncubating = async () => {
      console.log('Starting to fetch incubating agents...');
      // Add a small delay to make loading state visible for testing
      await new Promise(resolve => setTimeout(resolve, 1000));
      const result = await getIncubating();
      console.log('Incubating result:', result);
      if (isSuccessResult(result)) {
        setIncubating(result.data);
      }
      setIsLoadingIncubating(false);
    };
    fetchIncubating();
    fetchEnlightened();
  }, []);

  // // Filter agents based on search query
  // const filterAgents = (agents: ClientAgent[]) => {
  //   if (!searchQuery.trim()) return agents;

  //   return agents.filter(agent => 
  //     agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     agent.ticker?.toLowerCase().includes(searchQuery.toLowerCase())
  //   );
  // };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-48 bg-gray-600 rounded-md" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-12 w-full bg-gray-600 rounded-md"
          />
        ))}
      </div>
    </div>
  )

  return (
    <div className="rounded-2xl border-1 bg-panel p-6 w-full">
      <div className="text-foreground text-2xl mb-4">AGENTS</div>
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
            ? <DataTable columns={columns} data={enlightened} />
            : <h2 className="text-foreground text-center  text-xl font-alexandria">Unable to retrieve enlightened agents!</h2>
          )}
        </TabsContent>
        <TabsContent value="incubating">
          {isLoadingIncubating ? (
            <LoadingSkeleton />
          ) : (
            ( incubating.length > 0 )
            ? <DataTable columns={columns} data={incubating} />
            : <h2 className="text-foreground text-center text-xl font-alexandria">Unable to retrieve incubating agents!</h2>
          )}
        </TabsContent>
        <TabsContent value="myagents">
          {!isLoggedIn ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <h2 className="text-foreground text-xl font-alexandria">You need to be logged in to view your agents</h2>
              <Button
                onClick={() => setShowAuthFlow(true)}
                className="group inline-flex items-center justify-center px-5 py-6 border-2 border-anakiwa rounded-2xl bg-panel text-foreground dark:text-panel-foreground font-alexandria text-base md:text-lg tracking-widest font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-anakiwa hover:border-anakiwa hover:bg-anakiwa hover:text-white dark:hover:border-white dark:hover:text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ letterSpacing: '0.08em' }}
              >
                <span className="text-left">REGISTER</span>
                <span className="ml-3 flex items-center justify-center w-8 h-8 bg-anakiwa rounded-lg transition-colors duration-200 group-hover:bg-white group-hover:text-anakiwa">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </span>
              </Button>
            </div>
          ) : (
            isLoadingIncubating ? (
              <LoadingSkeleton />
            ) : (
              ( incubating.length > 0 )
              ? <DataTable columns={columns} data={incubating} />
              : <h2 className="text-foreground">You don&apos;t have any agents yet!</h2>
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}