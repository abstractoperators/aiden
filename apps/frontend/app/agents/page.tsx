'use client'

import { useState } from "react";
import AgentsTabs from "./tabs";

export default function AgentsDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  return (
      <div className="w-full max-w-5xl flex flex-col items-center mt-8 p-10">
        {/* Search Field */}
        {/* <div className="w-full max-w-5xl mb-8">
          <div className="flex items-center border bg-panel rounded-xl w-full px-2 py-1.5">
            <input
              type="text"
              placeholder="Search Agents"
              className="flex-1 bg-transparent outline-none text-white placeholder:text-gray-400
               placeholder:text-lg pl-2 pr-2"
            />
            <button className="flex items-center justify-center w-10 h-10 bg-[#1B202F] border rounded-lg ml-2">
              <svg className="w-5 h-5 text-gray-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
          </div>
        </div> */}
        {/* Table Container with Tabs */}
        <div className="rounded-2xl border shadow-lg p-0 mt-2 w-full max-w-5xl mb-8">
          <AgentsTabs searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>
      </div>
  )
}