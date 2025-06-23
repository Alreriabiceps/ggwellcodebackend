import mongoose from 'mongoose';
import Provider from './models/Provider.js';

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/bataan-connect');
console.log('✅ Connected to MongoDB');

// Clear existing providers
await Provider.deleteMany({});
console.log('✅ Cleared existing providers');

// Add sample providers
const providers = [
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
  }
];

const result = await Provider.insertMany(providers);
console.log(`✅ Added ${result.length} providers to database`);

// Verify the data
const count = await Provider.countDocuments();
console.log(`✅ Total providers in database: ${count}`);

// Close connection
await mongoose.connection.close();
console.log('✅ Database connection closed');
process.exit(0); 