import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import Splash from "./pages/Splash";
import Welcome from "./pages/Welcome";
import Home from "./pages/Home";
import Activation from "./pages/Activation";
import { ensureDeviceId } from "./utils/activation";
import { trackScreen } from "./utils/analytics";

type Screen = "splash" | "welcome" | "home" | "activation";

const TRIAL_DAYS = 7;

function getAccessStatus(): "active" | "expired" | "activated" {
  const expiresAt = localStorage.getItem("sijil_expires_at");
  if (expiresAt) {
    return Date.now() < parseInt(expiresAt, 10) ? "activated" : "expired";
  }
  if (localStorage.getItem("sijil_activated") === "true") return "activated";

  const trialStart = localStorage.getItem("sijil_trial_start");
  if (!trialStart) return "active";

  const daysPassed = (Date.now() - parseInt(trialStart, 10)) / (1000 * 60 * 60 * 24);
  return daysPassed <= TRIAL_DAYS ? "active" : "expired";
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");

  useEffect(() => {
    ensureDeviceId();
    if (!localStorage.getItem("sijil_trial_start")) {
      localStorage.setItem("sijil_trial_start", String(Date.now()));
    }

    const timer = setTimeout(() => {
      const shopName = localStorage.getItem("sijil_shop_name");
      if (!shopName) {
        setScreen("welcome");
        return;
      }
      setScreen(getAccessStatus() === "expired" ? "activation" : "home");
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setScreen((cur) =>
        cur === "home" && getAccessStatus() === "expired" ? "activation" : cur
      );
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    trackScreen(screen);
  }, [screen]);

  const handleWelcomeDone = () => {
    setScreen(getAccessStatus() === "expired" ? "activation" : "home");
  };

  const handleActivated = () => {
    setScreen("home");
  };

  if (screen === "splash") return (
    <>
      <Splash />
      <Analytics />
    </>
  );
  if (screen === "welcome") return (
    <>
      <Welcome onDone={handleWelcomeDone} />
      <Analytics />
    </>
  );
  if (screen === "activation") return (
    <>
      <Activation onActivated={handleActivated} />
      <Analytics />
    </>
  );
  return (
    <>
      <Home />
      <Analytics />
    </>
  );
}
