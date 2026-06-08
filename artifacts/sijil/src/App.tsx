import { useState, useEffect } from "react";
import Splash from "./pages/Splash";
import Welcome from "./pages/Welcome";
import Home from "./pages/Home";
import Activation from "./pages/Activation";

type Screen = "splash" | "welcome" | "home" | "activation";

const TRIAL_DAYS = 7;

function getTrialStatus(): "active" | "expired" | "activated" {
  const activated = localStorage.getItem("sijil_activated");
  if (activated === "true") return "activated";

  const trialStart = localStorage.getItem("sijil_trial_start");
  if (!trialStart) return "active";

  const daysPassed = (Date.now() - parseInt(trialStart, 10)) / (1000 * 60 * 60 * 24);
  return daysPassed <= TRIAL_DAYS ? "active" : "expired";
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");

  useEffect(() => {
    const timer = setTimeout(() => {
      const shopName = localStorage.getItem("sijil_shop_name");

      if (!shopName) {
        setScreen("welcome");
        return;
      }

      const status = getTrialStatus();
      if (status === "expired") {
        setScreen("activation");
      } else {
        setScreen("home");
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  const handleWelcomeDone = () => {
    if (!localStorage.getItem("sijil_trial_start")) {
      localStorage.setItem("sijil_trial_start", String(Date.now()));
    }
    const status = getTrialStatus();
    if (status === "expired") {
      setScreen("activation");
    } else {
      setScreen("home");
    }
  };

  const handleActivated = () => {
    setScreen("home");
  };

  if (screen === "splash") return <Splash />;
  if (screen === "welcome") return <Welcome onDone={handleWelcomeDone} />;
  if (screen === "activation") return <Activation onActivated={handleActivated} />;
  return <Home />;
}
