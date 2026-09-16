import { currentUser } from "@/lib/auth";
import TradingPlatform from "./TradingPlatform";

export default function TradePage() {
  const user = currentUser();
  if (!user) return null;
  return <TradingPlatform accountId={user.id} />;
}
