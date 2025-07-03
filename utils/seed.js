import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';

import User from '../models/User.js';
import Provider from '../models/Provider.js';
import JobRequest from '../models/JobRequest.js';

dotenv.config();

const connectDatabase = async () => {
  try {
    await connectDB();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Provider.deleteMany({});
    await JobRequest.deleteMany({});
    console.log('✅ Database cleared');
  } catch (error) {
    console.error('❌ Database clearing failed:', error);
    throw error;
  }
};

// 👥 SAMPLE USERS DATA
const seedUsers = async () => {
  const usersData = [
    {
      name: "Admin User",
      email: "admin@bataanconnect.com",
      password: await bcrypt.hash("admin123", 10),
      role: "admin",
      phone: "+639991234567",
      municipality: "Balanga",
      isVerified: true
    },
    {
      name: "Maria Santos",
      email: "maria.santos@email.com",
      password: await bcrypt.hash("user123", 10),
      role: "client",
      phone: "+639992345678",
      municipality: "Balanga",
      isVerified: true
    }
  ];

  const users = await User.insertMany(usersData);
  console.log('✅ Users seeded');
  return users;
};

// 🏢 REALISTIC BATAAN PROVIDERS DATA
const seedProviders = async () => {
  const providersData = [
    // PLUMBING SPECIALISTS
    {
      businessName: "Bataan Plumbing Masters",
      ownerName: "Mario Santos",
      email: "mario@bataanplumbing.com",
      phone: "+639171234567",
      municipality: "Balanga",
      barangay: "Poblacion",
      address: "123 Rizal Street, Poblacion, Balanga, Bataan",
      category: "Plumbing",
      services: ["Faucet Repair", "Pipe Installation", "Water Heater Repair", "Drain Cleaning", "Toilet Repair"],
      specialties: ["Kitchen Plumbing", "Bathroom Renovation", "Water System Installation"],
      yearsExperience: 15,
      rating: 4.8,
      reviewCount: 127,
      completionRate: 98,
      responseTime: "30 minutes",
      workingHours: "7:00 AM - 6:00 PM",
      priceRange: { min: 300, max: 5000 },
      badges: {
        verified: true,
        featured: true,
        topRated: true,
        fastResponse: true
      },
      portfolio: [
        {
          title: "Kitchen Faucet Installation",
          description: "Installed premium kitchen faucet with water filter system",
          images: ["kitchen-faucet-1.jpg"],
          completedDate: new Date("2024-01-15"),
          cost: 2500
        }
      ],
      certifications: ["Licensed Plumber", "TESDA Certified"],
      insurance: true,
      warranty: "1 year parts, 6 months labor",
      languages: ["Filipino", "English"],
      isActive: true,
      isVerified: true,
      verifiedAt: new Date(),
      totalJobs: 127,
      completedJobs: 124,
      averageResponseTime: 30
    },

    {
      businessName: "Hermosa Pipe Solutions",
      ownerName: "Juan dela Cruz",
      email: "juan@hermosapipe.com",
      phone: "+639182345678",
      municipality: "Hermosa",
      barangay: "Sandoval",
      address: "456 MacArthur Highway, Sandoval, Hermosa, Bataan",
      category: "Plumbing",
      services: ["Emergency Plumbing", "Pipe Repair", "Faucet Installation", "Water Leak Detection"],
      specialties: ["Emergency Repairs", "Leak Detection", "Pipe Replacement"],
      yearsExperience: 8,
      rating: 4.6,
      reviewCount: 89,
      completionRate: 95,
      responseTime: "45 minutes",
      workingHours: "24/7 Emergency Service",
      priceRange: { min: 500, max: 8000 },
      badges: {
        verified: true,
        emergency: true,
        fastResponse: true
      },
      certifications: ["Licensed Plumber"],
      insurance: true,
      warranty: "6 months",
      languages: ["Filipino", "English"],
      isActive: true,
      isVerified: true,
      verifiedAt: new Date(),
      totalJobs: 89,
      completedJobs: 85,
      averageResponseTime: 45
    },

    // ELECTRICAL SPECIALISTS
    {
      businessName: "Bataan Electrical Works",
      ownerName: "Roberto Reyes",
      email: "roberto@bataanelectrical.com",
      phone: "+639193456789",
      municipality: "Mariveles",
      barangay: "Poblacion",
      address: "789 National Road, Poblacion, Mariveles, Bataan",
      category: "Electrical",
      services: ["Wiring Installation", "Electrical Repair", "Circuit Breaker Repair", "Outlet Installation", "Lighting Installation"],
      specialties: ["Residential Wiring", "Commercial Electrical", "Solar Panel Installation"],
      yearsExperience: 20,
      rating: 4.9,
      reviewCount: 156,
      completionRate: 99,
      responseTime: "1 hour",
      workingHours: "8:00 AM - 5:00 PM",
      priceRange: { min: 800, max: 15000 },
      badges: {
        verified: true,
        featured: true,
        topRated: true,
        expert: true
      },
      portfolio: [
        {
          title: "Complete House Rewiring",
          description: "Full electrical system upgrade for 2-story house",
          images: ["electrical-1.jpg"],
          completedDate: new Date("2024-02-10"),
          cost: 45000
        }
      ],
      certifications: ["Licensed Electrician", "TESDA Certified", "Solar Installation Certified"],
      insurance: true,
      warranty: "2 years",
      languages: ["Filipino", "English"],
      isActive: true,
      isVerified: true,
      verifiedAt: new Date(),
      totalJobs: 156,
      completedJobs: 155,
      averageResponseTime: 60
    },

    // CONSTRUCTION & RENOVATION
    {
      businessName: "Orion Construction Services",
      ownerName: "Michael Gonzalez",
      email: "michael@orionconstruction.com",
      phone: "+639204567890",
      municipality: "Orion",
      barangay: "Villa Angeles",
      address: "321 Sunset Boulevard, Villa Angeles, Orion, Bataan",
      category: "Construction",
      services: ["House Construction", "Renovation", "Roofing", "Painting", "Concrete Work"],
      specialties: ["Residential Construction", "Kitchen Renovation", "Bathroom Renovation"],
      yearsExperience: 12,
      rating: 4.7,
      reviewCount: 98,
      completionRate: 96,
      responseTime: "2 hours",
      workingHours: "7:00 AM - 5:00 PM",
      priceRange: { min: 5000, max: 500000 },
      badges: {
        verified: true,
        featured: true,
        licensed: true
      },
      portfolio: [
        {
          title: "Modern Kitchen Renovation",
          description: "Complete kitchen makeover with modern appliances",
          images: ["kitchen-reno-1.jpg"],
          completedDate: new Date("2024-01-20"),
          cost: 150000
        }
      ],
      certifications: ["Licensed Contractor", "PCAB Licensed"],
      insurance: true,
      warranty: "5 years structural, 1 year finishing",
      languages: ["Filipino", "English"],
      isActive: true,
      isVerified: true,
      verifiedAt: new Date(),
      totalJobs: 98,
      completedJobs: 94,
      averageResponseTime: 120
    },

    // APPLIANCE REPAIR
    {
      businessName: "Dinalupihan Appliance Repair",
      ownerName: "Carlos Mendoza",
      email: "carlos@dinalupihanrepair.com",
      phone: "+639215678901",
      municipality: "Dinalupihan",
      barangay: "San Ramon",
      address: "654 Jose Rizal Street, San Ramon, Dinalupihan, Bataan",
      category: "Appliance Repair",
      services: ["Aircon Repair", "Refrigerator Repair", "Washing Machine Repair", "TV Repair", "Microwave Repair"],
      specialties: ["Air Conditioning", "Home Appliances", "Electronics Repair"],
      yearsExperience: 10,
      rating: 4.5,
      reviewCount: 73,
      completionRate: 94,
      responseTime: "1.5 hours",
      workingHours: "8:00 AM - 6:00 PM",
      priceRange: { min: 800, max: 12000 },
      badges: {
        verified: true,
        specialist: true
      },
      certifications: ["Appliance Repair Certified", "TESDA Certified"],
      insurance: false,
      warranty: "3 months parts and labor",
      languages: ["Filipino", "English"],
      isActive: true,
      isVerified: true,
      verifiedAt: new Date(),
      totalJobs: 73,
      completedJobs: 69,
      averageResponseTime: 90
    },

    // CLEANING SERVICES
    {
      businessName: "Bagac Premium Cleaning",
      ownerName: "Maria Villanueva",
      email: "maria@bagaccleaning.com",
      phone: "+639226789012",
      municipality: "Bagac",
      barangay: "Bagumbayan",
      address: "987 Coastal Road, Bagumbayan, Bagac, Bataan",
      category: "Cleaning",
      services: ["House Cleaning", "Deep Cleaning", "Post-Construction Cleaning", "Office Cleaning", "Window Cleaning"],
      specialties: ["Residential Cleaning", "Move-in/Move-out Cleaning", "Regular Maintenance"],
      yearsExperience: 6,
      rating: 4.4,
      reviewCount: 52,
      completionRate: 97,
      responseTime: "2 hours",
      workingHours: "8:00 AM - 5:00 PM",
      priceRange: { min: 1500, max: 8000 },
      badges: {
        verified: true,
        eco_friendly: true
      },
      certifications: ["Cleaning Professional Certified"],
      insurance: true,
      warranty: "Satisfaction guarantee",
      languages: ["Filipino", "English"],
      isActive: true,
      isVerified: true,
      verifiedAt: new Date(),
      totalJobs: 52,
      completedJobs: 50,
      averageResponseTime: 120
    },

    // CARPENTRY & FURNITURE
    {
      businessName: "Samal Woodworks",
      ownerName: "Antonio Cruz",
      email: "antonio@samalwood.com",
      phone: "+639237890123",
      municipality: "Samal",
      barangay: "East Poblacion",
      address: "147 Mahogany Street, East Poblacion, Samal, Bataan",
      category: "Carpentry",
      services: ["Custom Furniture", "Cabinet Making", "Door Installation", "Window Repair", "Wood Flooring"],
      specialties: ["Custom Cabinets", "Hardwood Furniture", "Interior Woodwork"],
      yearsExperience: 18,
      rating: 4.8,
      reviewCount: 91,
      completionRate: 98,
      responseTime: "4 hours",
      workingHours: "7:00 AM - 4:00 PM",
      priceRange: { min: 3000, max: 80000 },
      badges: {
        verified: true,
        artisan: true,
        topRated: true
      },
      portfolio: [
        {
          title: "Custom Kitchen Cabinets",
          description: "Handcrafted solid wood kitchen cabinet set",
          images: ["cabinet-1.jpg"],
          completedDate: new Date("2024-01-30"),
          cost: 65000
        }
      ],
      certifications: ["Master Carpenter", "TESDA Certified"],
      insurance: true,
      warranty: "2 years craftsmanship",
      languages: ["Filipino", "English", "Kapampangan"],
      isActive: true,
      isVerified: true,
      verifiedAt: new Date(),
      totalJobs: 91,
      completedJobs: 89,
      averageResponseTime: 240
    },

    // LANDSCAPING & GARDENING
    {
      businessName: "Abucay Garden Solutions",
      ownerName: "Rosa Fernandez",
      email: "rosa@abucaygarden.com",
      phone: "+639248901234",
      municipality: "Abucay",
      barangay: "Mabatang",
      address: "258 Garden Lane, Mabatang, Abucay, Bataan",
      category: "Landscaping",
      services: ["Garden Design", "Lawn Maintenance", "Tree Trimming", "Plant Installation", "Irrigation System"],
      specialties: ["Tropical Gardens", "Sustainable Landscaping", "Garden Maintenance"],
      yearsExperience: 8,
      rating: 4.6,
      reviewCount: 67,
      completionRate: 95,
      responseTime: "3 hours",
      workingHours: "6:00 AM - 4:00 PM",
      priceRange: { min: 2000, max: 25000 },
      badges: {
        verified: true,
        eco_friendly: true
      },
      certifications: ["Landscape Design Certified", "Horticulture Certified"],
      insurance: false,
      warranty: "1 year plant guarantee",
      languages: ["Filipino", "English"],
      isActive: true,
      isVerified: true,
      verifiedAt: new Date(),
      totalJobs: 67,
      completedJobs: 64,
      averageResponseTime: 180
    }
  ];

  const providers = await Provider.insertMany(providersData);
  console.log('✅ Providers seeded');
  return providers;
};

// 💼 SAMPLE JOBS DATA
const seedJobs = async (users, providers) => {
  const jobsData = [
    {
      title: "Kitchen Faucet Repair",
      description: "My kitchen faucet is leaking and needs immediate repair",
      category: "Plumbing",
      budget: { min: 500, max: 2000 },
      urgency: "high",
      location: {
        municipality: "Balanga",
        barangay: "Poblacion",
        address: "123 Sample Street"
      },
      status: "completed",
      completedAt: new Date('2024-01-15'),
      client: users[1]._id, // Maria Santos
      assignedProvider: providers[0]._id // Bataan Plumbing Masters
    },
    {
      title: "House Painting",
      description: "Need exterior house painting for 2-story house",
      category: "Construction",
      budget: { min: 15000, max: 30000 },
      urgency: "medium",
      location: {
        municipality: "Hermosa",
        barangay: "Sandoval",
        address: "456 Sample Avenue"
      },
      status: "active",
      client: users[1]._id, // Maria Santos
      createdAt: new Date(Date.now() - (24 * 60 * 60 * 1000)) // Yesterday
    }
  ];

  const jobs = await JobRequest.insertMany(jobsData);
  console.log('✅ Jobs seeded');
  return jobs;
};

// 🚀 MAIN SEEDING FUNCTION
const seedDatabase = async () => {
  try {
    console.log(`
    ============================================================
    🌱 REKOMENDITO DATABASE SEEDING STARTED
    ============================================================
    `);

    // Connect to database
    await connectDatabase();
    await clearDatabase();

    // Seed in order (users first, then providers, then jobs)
    const users = await seedUsers();
    const providers = await seedProviders();
    const jobs = await seedJobs(users, providers);

    console.log(`
    ============================================================
    ✅ DATABASE SEEDING COMPLETED SUCCESSFULLY
    ============================================================
    📊 Summary:
    - ${users.length} Users created
    - ${providers.length} Providers created  
    - ${jobs.length} Jobs created
    
    🎯 Ready for AI-powered matching!
    ============================================================
    `);

    process.exit(0);
  } catch (error) {
    console.error(`
    ============================================================
    ❌ DATABASE SEEDING FAILED
    ============================================================
    Error: ${error.message}
    ============================================================
    `);
    process.exit(1);
  }
};

// Run seeding if called directly
if (process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}

export default seedDatabase; 