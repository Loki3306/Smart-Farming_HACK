import { DemoResponse } from "@shared/api";
import { useEffect, useState } from "react";
import Orb from "@/components/Orb";

export default function Index() {
  const [exampleFromServer, setExampleFromServer] = useState("");
  // Fetch users on component mount
  useEffect(() => {
    fetchDemo();
  }, []);

  // Example of how to fetch data from the server (if needed)
  const fetchDemo = async () => {
    try {
      const response = await fetch("/api/demo");
      const data = (await response.json()) as DemoResponse;
      setExampleFromServer(data.message);
    } catch (error) {
      console.error("Error fetching hello:", error);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Orb Background */}
      <div className="absolute inset-0 w-full h-full">
        <Orb
          hoverIntensity={0.5}
          rotateOnHover={true}
          hue={0}
          forceHoverState={false}
          backgroundColor="#000000"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* TODO: FUSION_GENERATION_APP_PLACEHOLDER replace everything here with the actual app! */}
        <h1 className="text-2xl font-semibold text-white flex items-center justify-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-white"
            viewBox="0 0 50 50"
          >
            <circle
              className="opacity-30"
              cx="25"
              cy="25"
              r="20"
              stroke="currentColor"
              strokeWidth="5"
              fill="none"
            />
            <circle
              className="text-white"
              cx="25"
              cy="25"
              r="20"
              stroke="currentColor"
              strokeWidth="5"
              fill="none"
              strokeDasharray="100"
              strokeDashoffset="75"
            />
          </svg>
          Generating your app...
        </h1>
        <p className="mt-4 text-gray-200 max-w-md">
          Watch the chat on the left for updates that might need your attention
          to finish generating
        </p>
        <p className="mt-4 hidden max-w-md text-white">{exampleFromServer}</p>
      </div>
    </div>
  );
}
