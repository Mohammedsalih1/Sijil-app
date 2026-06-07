import { useState, useEffect } from "react";
import Splash from "./pages/Splash";
import Welcome from "./pages/Welcome";
import Home from "./pages/Home";

type Screen = "splash" | "welcome" | "home";

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");

  useEffect(() => {
    const timer = setTimeout(() => {
      const shopName = localStorage.getItem("sijil_shop_name");
      if (shopName) {
        setScreen("home");
      } else {
        setScreen("welcome");
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  const handleWelcomeDone = () => {
    setScreen("home");
  };

  if (screen === "splash") return <Splash />;
  if (screen === "welcome") return <Welcome onDone={handleWelcomeDone} />;
  return <Home />;
}
