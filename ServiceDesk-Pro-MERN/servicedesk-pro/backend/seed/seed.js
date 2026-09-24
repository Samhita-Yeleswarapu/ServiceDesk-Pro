/**
 * Seed script — populates the database with meaningful demo/test data:
 * departments, categories, SLA policies, users (all 5 roles), vendors,
 * assets, knowledge base articles, and sample tickets.
 *
 * Run with: npm run seed   (from /backend)
 */
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Department = require("../models/Department");
const Category = require("../models/Category");
const SLA = require("../models/SLA");
const Vendor = require("../models/Vendor");
const Asset = require("../models/Asset");
const KnowledgeArticle = require("../models/KnowledgeArticle");
const Ticket = require("../models/Ticket");
const { classifyTicket } = require("../utils/aiService");

const run = async () => {
  await connectDB();

  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany(),
    Department.deleteMany(),
    Category.deleteMany(),
    SLA.deleteMany(),
    Vendor.deleteMany(),
    Asset.deleteMany(),
    KnowledgeArticle.deleteMany(),
    Ticket.deleteMany(),
  ]);

  console.log("Creating departments...");
const departments = await Department.insertMany([
  { name: "IT Operations", description: "Core infrastructure and support" },
  { name: "Human Resources", description: "HR department" },
  { name: "Finance", description: "Finance & accounting" },
  { name: "Sales", description: "Sales and business development" },
  { name: "Engineering", description: "Product engineering" },
  { name: "Marketing", description: "Brand, growth and communications" },
  { name: "Customer Support", description: "Frontline customer service team" },
]);
const [itDept, hrDept, financeDept, salesDept, engDept] = departments;
  console.log("Creating categories...");
  const categories = await Category.insertMany([
    { name: "Hardware", defaultPriority: "Medium", color: "#f97316" },
    { name: "Software", defaultPriority: "Medium", color: "#8b5cf6" },
    { name: "Network", defaultPriority: "High", color: "#06b6d4" },
    { name: "Account & Access", defaultPriority: "Medium", color: "#10b981" },
    { name: "Email & Communication", defaultPriority: "Medium", color: "#3b82f6" },
    { name: "Security", defaultPriority: "Critical", color: "#ef4444" },
    { name: "Infrastructure", defaultPriority: "Critical", color: "#dc2626" },
    { name: "Asset Request", defaultPriority: "Low", color: "#eab308" },
  ]);

  console.log("Creating SLA policies...");
  const slas = await SLA.insertMany([
    { name: "Critical Priority SLA", priority: "Critical", responseTimeHours: 1, resolutionTimeHours: 4, escalateTo: "admin" },
    { name: "High Priority SLA", priority: "High", responseTimeHours: 2, resolutionTimeHours: 8, escalateTo: "it_manager" },
    { name: "Medium Priority SLA", priority: "Medium", responseTimeHours: 4, resolutionTimeHours: 24, escalateTo: "it_manager" },
    { name: "Low Priority SLA", priority: "Low", responseTimeHours: 8, resolutionTimeHours: 72, escalateTo: "it_manager" },
  ]);

  console.log("Creating users...");
  const users = await User.create([
    { name: "Alan Roberts", email: "admin@servicedesk.com", password: "Admin@123", role: "admin", department: itDept._id, avatarColor: "#6366f1" },
    { name: "Meera Kapoor", email: "manager@servicedesk.com", password: "Manager@123", role: "it_manager", department: itDept._id, avatarColor: "#0ea5e9" },
    { name: "Ravi Sharma", email: "tech1@servicedesk.com", password: "Tech@123", role: "technician", department: itDept._id, avatarColor: "#10b981" },
    { name: "Priya Nair", email: "tech2@servicedesk.com", password: "Tech@123", role: "technician", department: itDept._id, avatarColor: "#f59e0b" },
    { name: "Karan Mehta", email: "assets@servicedesk.com", password: "Asset@123", role: "asset_manager", department: itDept._id, avatarColor: "#ec4899" },
    { name: "Sarah Johnson", email: "employee@servicedesk.com", password: "Employee@123", role: "employee", department: hrDept._id, avatarColor: "#8b5cf6" },
    { name: "David Lee", email: "david.lee@servicedesk.com", password: "Employee@123", role: "employee", department: financeDept._id, avatarColor: "#14b8a6" },
    { name: "Ananya Iyer", email: "ananya.iyer@servicedesk.com", password: "Employee@123", role: "employee", department: salesDept._id, avatarColor: "#f43f5e" },
    { name: "Tom Wilson", email: "tom.wilson@servicedesk.com", password: "Employee@123", role: "employee", department: engDept._id, avatarColor: "#0891b2" },
  ]);
  const [admin, manager, tech1, tech2, assetMgr, emp1, emp2, emp3, emp4] = users;

  console.log("Creating vendors...");
  const vendors = await Vendor.insertMany([
    { name: "Dell Technologies", contactPerson: "Rakesh Gupta", email: "sales@dell-partner.com", phone: "+91-9876543210" },
    { name: "HP Inc.", contactPerson: "Anjali Verma", email: "support@hp-partner.com", phone: "+91-9876500000" },
    { name: "Microsoft Licensing", contactPerson: "John Carter", email: "licensing@ms-partner.com", phone: "+1-800-555-0199" },
    { name: "Cisco Systems", contactPerson: "Neha Joshi", email: "network@cisco-partner.com", phone: "+91-9988776655" },
  ]);
  const [dell, hp, msVendor, cisco] = vendors;

  console.log("Creating assets...");
  const assets = await Asset.insertMany([
    { assetTag: "AST-1001", name: "Dell Latitude 5420", type: "Laptop", serialNumber: "DL5420-001", vendor: dell._id, purchaseDate: new Date("2023-05-10"), warrantyExpiry: new Date("2026-05-10"), cost: 75000, status: "Assigned", assignedTo: emp1._id, department: hrDept._id, location: "HQ - 3rd Floor" },
    { assetTag: "AST-1002", name: "HP EliteBook 840", type: "Laptop", serialNumber: "HPEB840-002", vendor: hp._id, purchaseDate: new Date("2022-11-20"), warrantyExpiry: new Date("2025-11-20"), cost: 68000, status: "Assigned", assignedTo: emp2._id, department: financeDept._id, location: "HQ - 2nd Floor" },
    { assetTag: "AST-1003", name: "Dell 27\" Monitor", type: "Monitor", serialNumber: "DLM27-003", vendor: dell._id, purchaseDate: new Date("2023-01-15"), warrantyExpiry: new Date("2026-01-15"), cost: 15000, status: "In Stock", location: "IT Storeroom" },
    { assetTag: "AST-1004", name: "Cisco Catalyst Switch", type: "Networking", serialNumber: "CSC-004", vendor: cisco._id, purchaseDate: new Date("2021-08-01"), warrantyExpiry: new Date("2024-08-01"), cost: 120000, status: "In Stock", location: "Server Room" },
    { assetTag: "AST-1005", name: "Microsoft Office 365 License", type: "Software License", vendor: msVendor._id, purchaseDate: new Date("2024-01-01"), warrantyExpiry: new Date("2025-01-01"), cost: 5000, status: "Assigned", assignedTo: emp3._id, department: salesDept._id },
    { assetTag: "AST-1006", name: "HP LaserJet Printer", type: "Printer", serialNumber: "HPLJ-006", vendor: hp._id, purchaseDate: new Date("2022-03-10"), warrantyExpiry: new Date("2025-03-10"), cost: 22000, status: "Under Repair", location: "HQ - 1st Floor", notes: "Paper jam issue reported" },
    { assetTag: "AST-1007", name: "Dell Latitude 5420 (spare)", type: "Laptop", serialNumber: "DL5420-007", vendor: dell._id, purchaseDate: new Date("2023-06-01"), warrantyExpiry: new Date("2026-06-01"), cost: 75000, status: "In Stock", location: "IT Storeroom" },
    { assetTag: "AST-1008", name: "iPhone 13 (Corporate)", type: "Mobile", serialNumber: "IP13-008", purchaseDate: new Date("2023-09-01"), warrantyExpiry: new Date("2025-09-01"), cost: 65000, status: "Assigned", assignedTo: emp4._id, department: engDept._id },
  ]);

  console.log("Creating knowledge base articles...");
  const kbCat = (name) => categories.find((c) => c.name === name)._id;
  const articles = await KnowledgeArticle.insertMany([
    {
      title: "How to Reset Your Account Password",
      summary: "Step-by-step guide to reset a forgotten or expired password via self-service portal.",
      content: "1. Go to the login page and click 'Forgot Password'.\n2. Enter your registered email address.\n3. Check your inbox for a reset link (valid for 30 minutes).\n4. Choose a new password following the complexity policy (min 8 chars, 1 number, 1 symbol).\n5. Log in with your new password. If you don't receive the email, check spam or contact IT.",
      category: kbCat("Account & Access"),
      tags: ["password", "login", "reset", "account", "locked out"],
      author: manager._id,
      views: 245,
      helpfulCount: 58,
    },
    {
      title: "Troubleshooting Wi-Fi Connectivity Issues",
      summary: "Common fixes for slow or dropped Wi-Fi connections on office laptops.",
      content: "1. Toggle Wi-Fi off and on from the network settings.\n2. Forget the network and reconnect using the corporate SSID.\n3. Run 'ipconfig /release' and 'ipconfig /renew' (Windows) to refresh your IP.\n4. Restart your machine's network adapter via Device Manager.\n5. If issue persists on multiple devices in the same area, it may be an access point outage — log a Network ticket.",
      category: kbCat("Network"),
      tags: ["wifi", "network", "connectivity", "internet", "vpn"],
      author: tech1._id,
      views: 189,
      helpfulCount: 44,
    },
    {
      title: "Fixing Outlook Email Sync Problems",
      summary: "Resolve issues where Outlook is not sending or receiving emails.",
      content: "1. Check your internet connection first.\n2. Go to Send/Receive tab and click 'Update Folder'.\n3. Verify account settings under File > Account Settings.\n4. Clear the Outlook cache: close Outlook, delete the .ost file, reopen to resync.\n5. If using mobile, remove and re-add the corporate account under Mail settings.",
      category: kbCat("Email & Communication"),
      tags: ["email", "outlook", "sync", "mailbox"],
      author: tech2._id,
      views: 156,
      helpfulCount: 37,
    },
    {
      title: "Installing Approved Software via Self-Service Portal",
      summary: "How to request and install pre-approved software packages.",
      content: "1. Open the Company Portal app on your machine.\n2. Browse or search for the required application.\n3. Click Install — most approved software installs silently without admin rights.\n4. For unlisted software, raise a Software ticket with business justification for manager approval.\n5. Licensed software will be tracked automatically against your asset profile.",
      category: kbCat("Software"),
      tags: ["software", "install", "application", "license"],
      author: manager._id,
      views: 132,
      helpfulCount: 29,
    },
    {
      title: "Identifying and Reporting Phishing Emails",
      summary: "How to recognize suspicious emails and report them safely.",
      content: "1. Check the sender's email address carefully for misspellings or odd domains.\n2. Hover over links (don't click) to preview the destination URL.\n3. Be cautious of urgent requests for credentials, payments, or gift cards.\n4. Use the 'Report Phishing' button in Outlook, or forward to security@company.com.\n5. Do not reply, click links, or download attachments from suspicious emails. Delete after reporting.",
      category: kbCat("Security"),
      tags: ["security", "phishing", "malware", "suspicious", "virus"],
      author: admin._id,
      views: 210,
      helpfulCount: 61,
    },
    {
      title: "Laptop Battery Not Charging — Troubleshooting Steps",
      summary: "Diagnose and fix charging issues on corporate laptops.",
      content: "1. Verify the charger and cable are firmly connected at both ends.\n2. Try a different power outlet to rule out socket issues.\n3. Check for a swollen or damaged battery — do not continue using if visibly damaged.\n4. Update chipset/battery drivers from the vendor's support site.\n5. If the issue persists, log a Hardware ticket for a replacement charger or battery diagnostic.",
      category: kbCat("Hardware"),
      tags: ["laptop", "battery", "charger", "hardware"],
      author: tech1._id,
      views: 98,
      helpfulCount: 21,
    },
    {
      title: "Requesting a New Laptop or Equipment",
      summary: "Process for requesting new hardware or software licenses.",
      content: "1. Raise a ticket under the 'Asset Request' category with business justification.\n2. Your manager approves the request in the workflow.\n3. Asset Manager checks inventory for available stock.\n4. If unavailable, a procurement request is raised with the approved vendor.\n5. Once received, the asset is tagged, configured, and assigned to you with a handover checklist.",
      category: kbCat("Asset Request"),
      tags: ["asset", "laptop request", "new equipment", "procurement"],
      author: assetMgr._id,
      views: 87,
      helpfulCount: 19,
    },
  ]);

  console.log("Creating sample tickets with AI classification...");
  const ticketSeeds = [
    { subject: "Cannot log in — password not working", description: "I forgot my password and the reset link isn't arriving in my inbox. This is urgent, I can't access anything.", requester: emp1._id },
    { subject: "Office Wi-Fi keeps disconnecting", description: "My laptop keeps dropping the office wifi connection every few minutes since this morning, very frustrating during calls.", requester: emp2._id },
    { subject: "Laptop screen flickering", description: "My Dell laptop screen has started flickering randomly, especially when on battery power.", requester: emp3._id },
    { subject: "Need Photoshop installed", description: "I need Adobe Photoshop installed for the new marketing campaign, please install as soon as possible.", requester: emp4._id },
    { subject: "Production server is down", description: "The production database server appears to be down, critical outage affecting all customers, need immediate help asap!", requester: emp1._id },
    { subject: "Suspicious email received", description: "I received a suspicious phishing-looking email asking me to reset my banking password, not sure if it's safe.", requester: emp2._id },
    { subject: "Requesting a new laptop", description: "My current laptop is very old and slow, requesting a new laptop for better performance at work.", requester: emp3._id },
    { subject: "Printer not printing documents", description: "The printer on the 1st floor is not printing, shows paper jam error even after clearing paper.", requester: emp4._id },
  ];

  const now = new Date();
  function addHours(date, hours) {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
  }

  const assignees = [tech1._id, tech2._id, null];
  let i = 0;
  for (const seed of ticketSeeds) {
    const ai = await classifyTicket(seed.subject, seed.description);
    const priority = ai.suggestedPriority;
    const sla = slas.find((s) => s.priority === priority);
    const assignedTo = assignees[i % assignees.length];
    const statusPool = ["Open", "In Progress", "Resolved", "Closed"];
    const status = assignedTo ? statusPool[i % statusPool.length] : "Open";

    const ticket = new Ticket({
      subject: seed.subject,
      description: seed.description,
      requester: seed.requester,
      assignedTo,
      priority,
      status,
      department: itDept._id,
      aiSuggestedCategory: ai.suggestedCategoryName,
      aiSuggestedPriority: ai.suggestedPriority,
      aiProbableIssue: ai.probableIssue,
      aiConfidence: ai.confidence,
      sla: sla ? sla._id : undefined,
      responseDueAt: sla ? addHours(now, sla.responseTimeHours) : undefined,
      resolutionDueAt: sla ? addHours(now, sla.resolutionTimeHours) : undefined,
      history: [{ action: "Created", by: seed.requester, note: "Ticket created", date: now }],
    });

    if (status === "Resolved" || status === "Closed") {
      ticket.firstRespondedAt = now;
      ticket.resolvedAt = now;
      if (status === "Closed") ticket.closedAt = now;
    }

    await ticket.save();
    i++;
  }

  console.log("\n✅ Seed complete!\n");
  console.log("Demo login credentials:");
  console.log("-------------------------------------------------");
  console.log("Admin:          admin@servicedesk.com      / Admin@123");
  console.log("IT Manager:     manager@servicedesk.com    / Manager@123");
  console.log("Technician 1:   tech1@servicedesk.com      / Tech@123");
  console.log("Technician 2:   tech2@servicedesk.com      / Tech@123");
  console.log("Asset Manager:  assets@servicedesk.com     / Asset@123");
  console.log("Employee:       employee@servicedesk.com   / Employee@123");
  console.log("-------------------------------------------------\n");

  process.exit(0);
};

run().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
