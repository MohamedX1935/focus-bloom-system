import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

export default function Auth() {
  const [status, setStatus] = useState("Connexion en cours...");

  useEffect(() => {
    const autoLogin = async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: "mohammedelalaoui532@gmail.com",
        password: "123",
      });
      if (error) {
        setStatus("Erreur de connexion : " + error.message);
      }
    };
    autoLogin();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 w-full max-w-sm text-center"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">Discipline</h1>
        <p className="text-sm text-muted-foreground">{status}</p>
      </motion.div>
    </div>
  );
}