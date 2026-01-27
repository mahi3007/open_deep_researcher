import { FloatingLines } from "react-bits";
import { useState } from "react";

export default function AppBackground({ children }) {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <div
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{ width: "100%", height: "100%" }}
        >
            <FloatingLines
                lineColor="rgba(139, 92, 246, 0.6)"   // violet
                backgroundColor="#020617"            // deep dark blue
                lineWidth={1}
                lineCount={25}
                speed={isHovering ? 0.6 : 0.4}
                interactive={true}
                bendRadius={isHovering ? 8.0 : 5.0}
                bendStrength={isHovering ? -0.8 : -0.5}
                mouseDamping={isHovering ? 0.02 : 0.05}
            >
                {children}
            </FloatingLines>
        </div>
    );
}
