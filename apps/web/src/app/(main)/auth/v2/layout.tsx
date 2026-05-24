"use client";
import type { ReactNode } from "react";

import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { Command } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { APP_CONFIG } from "@/config/app-config";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="relative grid h-dvh w-screen justify-center overflow-hidden p-2 lg:grid-cols-2">
        <div className="relative z-10 order-2 hidden h-full overflow-hidden rounded-3xl lg:flex">
          <div className="absolute inset-0">
            <ShaderGradientCanvas style={{ width: "100%", height: "100%" }} pointerEvents="none" pixelDensity={1}>
              <ShaderGradient
                animate="on"
                type="sphere"
                wireframe={false}
                shader="defaults"
                uTime={0}
                uSpeed={0.3}
                uStrength={0.3}
                uDensity={0.8}
                uFrequency={5.5}
                uAmplitude={3.2}
                positionX={-0.1}
                positionY={0}
                positionZ={0}
                rotationX={0}
                rotationY={130}
                rotationZ={70}
                color1="#73bfc4"
                color2="#ff810a"
                color3="#8da0ce"
                reflection={0.4}
                cAzimuthAngle={270}
                cPolarAngle={180}
                cDistance={0.5}
                cameraZoom={15.1}
                lightType="env"
                brightness={0.8}
                envPreset="city"
                grain="on"
                toggleAxis={false}
                zoomOut={false}
                hoverState=""
                enableTransition={false}
              />
            </ShaderGradientCanvas>
          </div>
          <div className="absolute top-10 space-y-1 px-10 text-white">
            <Command className="size-10" />
            <h1 className="font-medium text-2xl">{APP_CONFIG.name}</h1>
            <p className="text-sm">Design. Build. Launch. Repeat.</p>
          </div>

          <div className="absolute bottom-10 flex w-full justify-between px-10">
            <div className="flex-1 space-y-1 text-white">
              <h2 className="font-medium">Ready to launch?</h2>
              <p className="text-sm">Clone the repo, install dependencies, and your dashboard is live in minutes.</p>
            </div>
            <Separator orientation="vertical" className="mx-3 h-auto! bg-white/30" />
            <div className="flex-1 space-y-1 text-white">
              <h2 className="font-medium">Need help?</h2>
              <p className="text-sm">
                Check out the docs or open an issue on GitHub, community support is just a click away.
              </p>
            </div>
          </div>
        </div>
        <div className="relative z-10 order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
