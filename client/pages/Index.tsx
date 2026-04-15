import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Orb from "@/components/Orb";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect placeholder directly to standard app workflow.
    navigate("/dashboard", { replace: true });
  }, [navigate]);

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
        <h1 className="text-2xl font-semibold text-white flex items-center justify-center gap-3">
          <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 50 50">
             <circle className="opacity-30" cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="5" fill="none" />
             <circle className="text-white" cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="5" fill="none" strokeDasharray="100" strokeDashoffset="75" />
          </svg>
          Initializing Application...
        </h1>
      </div>
    </div>
  );
}
