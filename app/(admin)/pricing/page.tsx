import { PriceListManager } from "@/components/admin/PriceListManager";

export default function AdminPricingPage() {
  return (
    <div className="space-y-4 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">Price Lists</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage base prices and option adders by product series</p>
      </div>
      <PriceListManager />
    </div>
  );
}
