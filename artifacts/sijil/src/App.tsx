import { useState, useEffect } from "react";
import Splash from "./pages/Splash";
import Welcome from "./pages/Welcome";
import Home from "./pages/Home";
import Activation from "./pages/Activation";
import { ensureDeviceId } from "./utils/activation";

type Screen = "splash" | "welcome" | "home" | "activation";

const TRIAL_MINUTES = 5;

function getAccessStatus(): "active" | "expired" | "activated" {
  const expiresAt = localStorage.getItem("sijil_expires_at");
  if (expiresAt) {
    return Date.now() < parseInt(expiresAt, 10) ? "activated" : "expired";
  }
  if (localStorage.getItem("sijil_activated") === "true") return "activated";

  const trialStart = localStorage.getItem("sijil_trial_start");
  if (!trialStart) return "active";

  const minutesPassed = (Date.now() - parseInt(trialStart, 10)) / (1000 * 60);
  return minutesPassed <= TRIAL_MINUTES ? "active" : "expired";
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

  const handleWelcomeDone = () => {
    setScreen(getAccessStatus() === "expired" ? "activation" : "home");
  };

  const handleActivated = () => {
    setScreen("home");
  };

  if (screen === "splash") return <Splash />;
  if (screen === "welcome") return <Welcome onDone={handleWelcomeDone} />;
  if (screen === "activation") return <Activation onActivated={handleActivated} />;
  return <Home />;
}
