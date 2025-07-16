'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Upload } from "lucide-react";
import AgentBuilder from "./index";
import { Character, ModelProviderName } from "@/lib/schemas/character";

interface Step1Data {
  logoImage: File | null;
  agentName: string;
  tokenTicker: string;
}

interface Step2Data {
  character: Character | string;
  env: Array<{ key: string; value: string }>;
  isNewToken: boolean;
  tokenName: string;
  ticker: string;
}

interface Step3Data {
  coinType: string;
  initialPurchaseAmount: string;
}

interface AgentCreationData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
}

const coinTypes = ["SEI", "USDC", "USDT", "ETH", "BTC"];

export default function MultiStepAgentBuilder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AgentCreationData>({
    step1: {
      logoImage: null,
      agentName: "",
      tokenTicker: "",
    },
    step2: {
      character: JSON.stringify({
        name: "",
        clients: [],
        modelProvider: ModelProviderName.OPENAI,
        plugins: [],
        bio: [],
        lore: [],
        messageExamples: [],
        postExamples: [],
        adjectives: [],
        topics: [],
        style: {
          all: [],
          chat: [],
          post: [],
        },
      }, null, 4),
      env: [{ key: "", value: "" }],
      isNewToken: true,
      tokenName: "",
      ticker: "",
    },
    step3: {
      coinType: "SEI",
      initialPurchaseAmount: "",
    },
  });

  const updateFormData = (step: keyof AgentCreationData, data: Partial<AgentCreationData[keyof AgentCreationData]>) => {
    setFormData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...data }
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      if (currentStep === 1) {
        // Update step 2 character with agent name from step 1
        const characterObj = typeof formData.step2.character === 'string' 
          ? JSON.parse(formData.step2.character) 
          : formData.step2.character;
        
        characterObj.name = formData.step1.agentName;
        
        updateFormData("step2", {
          character: JSON.stringify(characterObj, null, 4),
          tokenName: formData.step1.agentName,
          ticker: formData.step1.tokenTicker,
        });
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      updateFormData("step1", { logoImage: file });
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStep2DataUpdate = (data: any) => {
    // This will be called from the AgentBuilder component
    // Parse character back to object if it's a string
    const processedData = {
      ...data,
      character: typeof data.character === 'string' 
        ? JSON.parse(data.character) 
        : data.character
    };
    updateFormData("step2", processedData);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              step <= currentStep
                ? "bg-anakiwa text-white"
                : "bg-gray-300 text-gray-600"
            )}
          >
          </div>
          {step < 4 && (
            <div
              className={cn(
                "w-16 h-1 mx-2",
                step < currentStep ? "bg-anakiwa" : "bg-gray-300"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="logo" className="text-foreground font-medium">
            Agent Logo
          </Label>
          <div className="mt-2 space-y-4">
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-foreground"
            />
            
            {/* Logo Preview */}
            {logoPreview && (
              <div className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-background">
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Agent Logo Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-anakiwa"
                  />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-anakiwa rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Logo Preview</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.step1.logoImage?.name}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="agentName" className="text-foreground font-medium">
            Agent Name
          </Label>
          <Input
            id="agentName"
            value={formData.step1.agentName}
            onChange={(e) => updateFormData("step1", { agentName: e.target.value })}
            placeholder="Enter agent name"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="tokenTicker" className="text-foreground font-medium">
            Token Ticker
          </Label>
          <Input
            id="tokenTicker"
            value={formData.step1.tokenTicker}
            onChange={(e) => updateFormData("step1", { tokenTicker: e.target.value })}
            placeholder="e.g., AGENT"
            className="mt-2"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={!formData.step1.agentName || !formData.step1.tokenTicker}
          className={cn(
            "px-5 py-2 border-2 border-anakiwa rounded-xl",
            "text-foreground dark:text-foreground text-base font-bold",
            "transition-all duration-200 focus:outline-none focus:ring-2",
            "focus:ring-anakiwa hover:border-anakiwa hover:bg-anakiwa",
            "bg-panel hover:text-white dark:hover:border-white",
            "dark:hover:text-white shadow-lg hover:shadow-xl transform",
          )}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <AgentBuilder />
      
      <div className="flex justify-between">
        <Button
          onClick={handlePrevious}
          variant="outline"
          className="text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={handleNext}
          className={cn(
            "px-5 py-2 border-2 border-anakiwa rounded-xl",
            "text-foreground dark:text-foreground text-base font-bold",
            "transition-all duration-200 focus:outline-none focus:ring-2",
            "focus:ring-anakiwa hover:border-anakiwa hover:bg-anakiwa",
            "bg-panel hover:text-white dark:hover:border-white",
            "dark:hover:text-white shadow-lg hover:shadow-xl transform",
          )}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="coinType" className="text-foreground font-medium">
            Coin Type
          </Label>
          <select
            id="coinType"
            value={formData.step3.coinType}
            onChange={(e) => updateFormData("step3", { coinType: e.target.value })}
            className={cn(
              "w-full rounded-xl border border-gray-300 dark:border-gray-600",
              "flex h-10 bg-background dark:bg-background px-4 py-2 transition-all duration-200",
              "text-foreground text-base font-medium",
              "focus:outline-none focus:ring-2 focus:ring-anakiwa focus:border-anakiwa",
              "hover:border-anakiwa hover:shadow-sm",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "mt-2 appearance-none cursor-pointer",
              "bg-[url('data:image/svg+xml;charset=US-ASCII,<svg width=\"12\" height=\"8\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M1.41.59 6 5.17 10.59.59 12 2 6 8 0 2z\" fill=\"%236B7280\"/></svg>')] bg-no-repeat bg-right-3"
            )}
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")",
              backgroundPosition: "right 0.5rem center",
              backgroundSize: "1.5em 1.5em",
              backgroundRepeat: "no-repeat"
            }}
          >
            {coinTypes.map((coin) => (
              <option 
                key={coin} 
                value={coin}
                className="bg-panel text-foreground py-2 px-3 hover:bg-anakiwa hover:text-white"
              >
                {coin}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="initialAmount" className="text-foreground font-medium">
            Initial Purchase Amount
          </Label>
          <Input
            id="initialAmount"
            type="number"
            value={formData.step3.initialPurchaseAmount}
            onChange={(e) => updateFormData("step3", { initialPurchaseAmount: e.target.value })}
            placeholder="Enter amount"
            className="mt-2"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          onClick={handlePrevious}
          variant="outline"
          className="text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={!formData.step3.initialPurchaseAmount}
          className={cn(
            "px-5 py-2 border-2 border-anakiwa rounded-xl",
            "text-foreground dark:text-foreground text-base font-bold",
            "transition-all duration-200 focus:outline-none focus:ring-2",
            "focus:ring-anakiwa hover:border-anakiwa hover:bg-anakiwa",
            "bg-panel hover:text-white dark:hover:border-white",
            "dark:hover:text-white shadow-lg hover:shadow-xl transform",
          )}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

    const renderStep4 = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-panel p-6 space-y-6">
        <h3 className="text-xl font-semibold text-foreground">Preview & Publish Agent</h3>
        
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground border-b pb-2">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400">Agent Name:</span>
              <span className="ml-2 text-foreground font-medium">{formData.step1.agentName}</span>
            </div>
            <div>
              <span className="text-gray-400">Token Ticker:</span>
              <span className="ml-2 text-foreground font-medium">{formData.step1.tokenTicker}</span>
            </div>
            {logoPreview && (
              <div className="md:col-span-2">
                <span className="text-gray-400">Token Logo:</span>
                <div className="flex items-center space-x-3 mt-2">
                  <img
                    src={logoPreview}
                    alt="Token Logo"
                    className="w-12 h-12 rounded-full object-cover border-2 border-anakiwa"
                  />
                  <div>
                    <span className="text-foreground font-medium">{formData.step1.logoImage?.name}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ready for deployment</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Token Details */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground border-b pb-2">Token Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400">Token Name:</span>
              <span className="ml-2 text-foreground font-medium">{formData.step1.agentName}</span>
            </div>
            <div>
              <span className="text-gray-400">Token Symbol:</span>
              <span className="ml-2 text-foreground font-medium">{formData.step1.tokenTicker}</span>
            </div>
            <div>
              <span className="text-gray-400">Token Type:</span>
              <span className="ml-2 text-foreground font-medium">New Token</span>
            </div>
            <div>
              <span className="text-gray-400">Initial Supply:</span>
              <span className="ml-2 text-foreground font-medium">1,000,000 {formData.step1.tokenTicker}</span>
            </div>
          </div>
        </div>

        {/* Pool Configuration */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground border-b pb-2">Pool Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400">Coin Type:</span>
              <span className="ml-2 text-foreground font-medium">{formData.step3.coinType}</span>
            </div>
            <div>
              <span className="text-gray-400">Initial Purchase Amount:</span>
              <span className="ml-2 text-foreground font-medium">{formData.step3.initialPurchaseAmount} {formData.step3.coinType}</span>
            </div>
            <div>
              <span className="text-gray-400">Pool Type:</span>
              <span className="ml-2 text-foreground font-medium">Automated Market Maker (AMM)</span>
            </div>
            <div>
              <span className="text-gray-400">Initial Liquidity:</span>
              <span className="ml-2 text-foreground font-medium">50% of total supply</span>
            </div>
          </div>
        </div>

        {/* Agent Details */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground border-b pb-2">Agent Configuration</h4>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <pre className="text-sm text-foreground overflow-auto whitespace-pre-wrap">
              {(() => {
                try {
                  if (typeof formData.step2.character === 'string') {
                    // Parse and re-stringify to ensure proper formatting
                    const parsed = JSON.parse(formData.step2.character);
                    return JSON.stringify(parsed, null, 2);
                  } else {
                    return JSON.stringify(formData.step2.character, null, 2);
                  }
                } catch (error) {
                  return typeof formData.step2.character === 'string' 
                    ? formData.step2.character 
                    : JSON.stringify(formData.step2.character, null, 2);
                }
              })()}
            </pre>
          </div>
        </div>


      </div>

      <div className="flex justify-between">
        <Button
          onClick={() => setCurrentStep(3)}
          variant="outline"
          className="text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Pool Config
        </Button>
        <Button
          onClick={() => {
            // Handle agent creation and token launch here
            console.log("Creating agent and launching token with data:", formData);
            // You can integrate with the existing agent creation and token launch logic here
            // For now, just show a success message
            alert("Agent published and token launched successfully!");
          }}
          className={cn(
            "px-8 py-3 border-2 border-anakiwa rounded-xl",
            "text-foreground dark:text-foreground text-lg font-bold",
            "transition-all duration-200 focus:outline-none focus:ring-2",
            "focus:ring-anakiwa hover:border-anakiwa hover:bg-anakiwa",
            "bg-panel hover:text-white dark:hover:border-white",
            "dark:hover:text-white shadow-lg hover:shadow-xl transform",
          )}
        >
          🚀 Publish Agent & Launch Token
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl">
      {renderStepIndicator()}
      
      <div className="rounded-2xl border bg-panel p-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>
    </div>
  );
} 