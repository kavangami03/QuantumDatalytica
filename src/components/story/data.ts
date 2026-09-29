export const industries = {
  Hospitality: {
    nodes: ["Bookings", "Demand", "Rooms", "Pricing", "Guest reviews", "Revenue"],
    result: "See what’s driving every property’s revenue.",
  },
  Healthcare: {
    nodes: ["Appointments", "Patients", "Staff", "Services", "Feedback", "Operations"],
    result: "Every location’s operations, one clear view.",
  },
  Retail: {
    nodes: ["Customers", "Products", "Inventory", "Stores", "Promotions", "Sales"],
    result: "Connect what customers buy with every store.",
  },
  "Financial Services": {
    nodes: ["Clients", "Accounts", "Branches", "Services", "Risk", "Performance"],
    result: "Clear understanding across every branch.",
  },
  Manufacturing: {
    nodes: ["Demand", "Production", "Inventory", "Suppliers", "Quality", "Delivery"],
    result: "See how each part shapes the whole.",
  },
} as const;
