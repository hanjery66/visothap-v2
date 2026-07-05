import { auth } from "../lib/auth";

async function main() {
  console.log("🚀 Starting database seeding...");

  try {
    console.log("Creating default administrator account...");
    const res = await auth.api.signUpEmail({
      body: {
        name: "Administrator",
        email: "admin@visothap.net",
        password: "password123", // Default secure credential
        username: "admin",
      },
    });

    console.log("✅ Seed completed successfully!");
    console.log("Admin details:", {
      id: res.user.id,
      name: res.user.name,
      email: res.user.email,
      username: res.user.username,
    });
  } catch (error: any) {
    if (error.message?.includes("already exist") || error.code?.includes("unique")) {
      console.log("ℹ️ Admin user 'admin' already exists. Skipping creation.");
    } else {
      console.error("❌ Seeding failed with error:", error);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Unhandled seed error:", err);
  process.exit(1);
});
