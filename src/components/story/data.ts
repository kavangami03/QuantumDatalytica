export const businessNodes = [
  { label: "CUSTOMERS", x: 18, y: 20 },
  { label: "OPERATIONS", x: 77, y: 18 },
  { label: "REVENUE", x: 90, y: 51 },
  { label: "MARKETING", x: 76, y: 82 },
  { label: "FINANCE", x: 22, y: 84 },
  { label: "INVENTORY", x: 7, y: 52 },
];

export const industries = {
  Hospitality: {
    nodes: ["Bookings", "Demand", "Rooms", "Pricing", "Guest feedback", "Revenue"],
    result: "Better visibility. Better revenue decisions.",
  },
  Healthcare: {
    nodes: ["Patient information", "Appointments", "Operations", "Communication", "Records"],
    result: "Clearer operational insight.",
  },
  Retail: {
    nodes: ["Customers", "Sales", "Products", "Inventory", "Locations"],
    result: "Know what is selling, where, and when.",
  },
  "Financial Services": {
    nodes: ["Customers", "Performance", "Risk", "Operations", "Service"],
    result: "See change sooner. Respond with confidence.",
  },
  Manufacturing: {
    nodes: ["Production", "Inventory", "Supply", "Orders", "Operations"],
    result: "See where your operation needs attention.",
  },
} as const;
