import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

import User from '../models/User.js';
import Provider from '../models/Provider.js';
import JobRequest from '../models/JobRequest.js';
import Highlight from '../models/Highlight.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bataan-connect');
    console.log('MongoDB connected for seeding...');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Provider.deleteMany({});
    await JobRequest.deleteMany({});
    await Highlight.deleteMany({});
    console.log('✅ Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
};

const seedUsers = async () => {
  const users = [
    {
      name: 'Juan Santos',
      email: 'admin@bataanconnect.com',
      password: await bcrypt.hash('admin123', 12),
      role: 'admin',
      phone: '+639171234567',
      location: {
        barangay: 'Central',
        municipality: 'Balanga',
        coordinates: { latitude: 14.6757, longitude: 120.5360 }
      },
      isVerified: true,
      isActive: true
    },
    {
      name: 'Maria Cruz',
      email: 'maria@example.com',
      password: await bcrypt.hash('password123', 12),
      role: 'client',
      phone: '+639171234568',
      location: {
        barangay: 'Poblacion',
        municipality: 'Balanga',
        coordinates: { latitude: 14.6800, longitude: 120.5400 }
      },
      isVerified: true,
      isActive: true
    },
    {
      name: 'Jose Ramos',
      email: 'jose@example.com',
      password: await bcrypt.hash('password123', 12),
      role: 'provider',
      phone: '+639171234569',
      location: {
        barangay: 'Central',
        municipality: 'Balanga',
        coordinates: { latitude: 14.6757, longitude: 120.5360 }
      },
      isVerified: true,
      isActive: true
    },
    {
      name: 'Ana Mendoza',
      email: 'ana@example.com',
      password: await bcrypt.hash('password123', 12),
      role: 'provider',
      phone: '+639171234570',
      location: {
        barangay: 'Sibacan',
        municipality: 'Balanga',
        coordinates: { latitude: 14.6900, longitude: 120.5500 }
      },
      isVerified: true,
      isActive: true
    },
    {
      name: 'Pedro Garcia',
      email: 'pedro@example.com',
      password: await bcrypt.hash('password123', 12),
      role: 'provider',
      phone: '+639171234571',
      location: {
        barangay: 'Townsite',
        municipality: 'Mariveles',
        coordinates: { latitude: 14.4400, longitude: 120.4900 }
      },
      isVerified: true,
      isActive: true
    }
  ];

  const createdUsers = await User.insertMany(users);
  console.log('✅ Users seeded');
  return createdUsers;
};

const seedProviders = async (users) => {
  const providerUsers = users.filter(user => user.role === 'provider');
  
  const providers = [
    {
      user: providerUsers[0]._id,
      businessName: 'RJ Construction & Electrical Services',
      businessDescription: 'Professional construction and electrical services in Bataan. Specializing in house wiring, lighting installation, and small construction projects. Licensed electrician with 8 years experience.',
      services: [
        {
          name: 'House Wiring',
          category: 'Electrical',
          description: 'Complete house electrical wiring services',
          priceRange: { min: 15000, max: 50000, unit: 'per_project' }
        },
        {
          name: 'Construction Work',
          category: 'Construction',
          description: 'Small to medium construction projects',
          priceRange: { min: 500, max: 1000, unit: 'per_day' }
        }
      ],
      specialties: ['House Wiring', 'Lighting Installation', 'Circuit Breaker Installation'],
      experience: { years: 8, description: 'Licensed electrician with extensive residential experience' },
      location: {
        barangay: 'Central',
        municipality: 'Balanga',
        address: '123 Central St., Balanga, Bataan',
        coordinates: { latitude: 14.6757, longitude: 120.5360 }
      },
      contact: {
        phone: '+639171234569',
        email: 'jose@example.com'
      },
      badges: [
        { type: 'verified', earnedDate: new Date(), description: 'Verified by Bataan Connect' },
        { type: 'experienced', earnedDate: new Date(), description: '5+ years experience' }
      ],
      ratings: { average: 4.8, count: 15, breakdown: { five: 12, four: 3, three: 0, two: 0, one: 0 } },
      verification: { isVerified: true, verifiedAt: new Date() },
      isActive: true
    },
    {
      user: providerUsers[1]._id,
      businessName: 'Ana\'s Cleaning Services',
      businessDescription: 'Reliable house cleaning and maintenance services. Deep cleaning, regular maintenance, and post-construction cleanup. Trusted by families in Balanga for 5 years.',
      services: [
        {
          name: 'House Cleaning',
          category: 'Cleaning',
          description: 'Regular house cleaning services',
          priceRange: { min: 300, max: 800, unit: 'per_day' }
        },
        {
          name: 'Deep Cleaning',
          category: 'Cleaning',
          description: 'Thorough deep cleaning service',
          priceRange: { min: 1500, max: 3000, unit: 'per_project' }
        }
      ],
      specialties: ['Deep Cleaning', 'Regular Maintenance', 'Post-Construction Cleanup'],
      experience: { years: 5, description: 'Professional cleaner serving Balanga families' },
      location: {
        barangay: 'Sibacan',
        municipality: 'Balanga',
        address: '456 Sibacan St., Balanga, Bataan',
        coordinates: { latitude: 14.6900, longitude: 120.5500 }
      },
      contact: {
        phone: '+639171234570',
        email: 'ana@example.com'
      },
      badges: [
        { type: 'verified', earnedDate: new Date(), description: 'Verified by Bataan Connect' },
        { type: 'quick_response', earnedDate: new Date(), description: 'Fast response time' }
      ],
      ratings: { average: 4.9, count: 22, breakdown: { five: 20, four: 2, three: 0, two: 0, one: 0 } },
      verification: { isVerified: true, verifiedAt: new Date() },
      isActive: true
    },
    {
      user: providerUsers[2]._id,
      businessName: 'Pedro\'s Plumbing Works',
      businessDescription: 'Expert plumbing services in Mariveles and surrounding areas. Pipe installation, leak repairs, and bathroom renovations. Available for emergency calls 24/7.',
      services: [
        {
          name: 'Pipe Installation',
          category: 'Plumbing',
          description: 'New pipe installation and replacement',
          priceRange: { min: 200, max: 500, unit: 'per_hour' }
        },
        {
          name: 'Leak Repair',
          category: 'Plumbing',
          description: 'Quick leak detection and repair',
          priceRange: { min: 500, max: 2000, unit: 'per_project' }
        }
      ],
      specialties: ['Pipe Installation', 'Leak Repair', 'Bathroom Renovation', 'Emergency Service'],
      experience: { years: 12, description: 'Master plumber with emergency service availability' },
      location: {
        barangay: 'Townsite',
        municipality: 'Mariveles',
        address: '789 Townsite Ave., Mariveles, Bataan',
        coordinates: { latitude: 14.4400, longitude: 120.4900 }
      },
      contact: {
        phone: '+639171234571',
        email: 'pedro@example.com'
      },
      badges: [
        { type: 'verified', earnedDate: new Date(), description: 'Verified by Bataan Connect' },
        { type: 'emergency_service', earnedDate: new Date(), description: '24/7 emergency service' },
        { type: 'experienced', earnedDate: new Date(), description: '10+ years experience' }
      ],
      ratings: { average: 4.7, count: 18, breakdown: { five: 14, four: 3, three: 1, two: 0, one: 0 } },
      verification: { isVerified: true, verifiedAt: new Date() },
      isActive: true
    }
  ];

  const createdProviders = await Provider.insertMany(providers);
  console.log('✅ Providers seeded');
  return createdProviders;
};

const seedJobs = async (users) => {
  const clientUser = users.find(user => user.role === 'client');
  
  const jobs = [
    {
      client: clientUser._id,
      title: 'House Electrical Wiring Installation',
      description: 'Need complete electrical wiring for new 2-bedroom house. Includes outlets, switches, lighting fixtures, and circuit breaker installation. House is 60 sqm.',
      category: 'Electrical',
      urgency: 'medium',
      timeline: {
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
        flexible: true
      },
      budget: { min: 25000, max: 45000, currency: 'PHP', negotiable: true },
      location: {
        address: 'New House, Subdivision Area',
        barangay: 'Poblacion',
        municipality: 'Balanga',
        coordinates: { latitude: 14.6800, longitude: 120.5400 }
      },
      requirements: {
        skillsNeeded: ['Electrical Installation', 'Circuit Design', 'Safety Compliance'],
        experience: 'experienced',
        insurance: true
      },
      status: 'active',
      isActive: true
    },
    {
      client: clientUser._id,
      title: 'Weekly House Cleaning Service',
      description: 'Looking for reliable weekly house cleaning service for 3-bedroom house. Includes dusting, mopping, bathroom cleaning, and general maintenance.',
      category: 'Cleaning',
      urgency: 'low',
      timeline: {
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        flexible: true
      },
      budget: { min: 1200, max: 2000, currency: 'PHP', negotiable: true },
      location: {
        address: 'Residential Area',
        barangay: 'Central',
        municipality: 'Balanga',
        coordinates: { latitude: 14.6757, longitude: 120.5360 }
      },
      requirements: {
        skillsNeeded: ['House Cleaning', 'Reliability'],
        experience: 'intermediate'
      },
      status: 'active',
      isActive: true
    }
  ];

  const createdJobs = await JobRequest.insertMany(jobs);
  console.log('✅ Jobs seeded');
  return createdJobs;
};

const seedHighlights = async (providers, users) => {
  const adminUser = users.find(user => user.role === 'admin');
  const now = new Date();
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const highlights = [
    {
      provider: providers[0]._id,
      title: 'Featured Electrician: RJ Construction',
      description: 'Highly rated electrical contractor serving Balanga with 8+ years experience. Specializes in residential wiring and safety compliance.',
      type: 'featured_provider',
      featuredImage: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800',
      content: {
        story: 'Jose Ramos has been serving the Balanga community with reliable electrical services for over 8 years.',
        achievements: ['Licensed Electrician', '50+ Projects Completed', '4.8 Star Rating'],
        metrics: {
          projectsCompleted: 52,
          clientsSatisfied: 48,
          yearsExperience: 8,
          responseTime: 'Within 2 hours'
        }
      },
      badge: { text: 'Top Rated', color: 'blue' },
      period: {
        startDate: now,
        endDate: oneWeekLater
      },
      priority: 5,
      status: 'active',
      createdBy: adminUser._id,
      isFeatured: true,
      isActive: true
    },
    {
      provider: providers[1]._id,
      title: 'Community Choice: Ana\'s Cleaning',
      description: 'Trusted house cleaning service with perfect 4.9-star rating. Known for attention to detail and reliable service.',
      type: 'community_choice',
      featuredImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      content: {
        story: 'Ana Mendoza has built a reputation for excellent cleaning services in the Balanga area.',
        achievements: ['4.9 Star Rating', '22 Happy Clients', 'Verified Provider'],
        metrics: {
          projectsCompleted: 35,
          clientsSatisfied: 22,
          yearsExperience: 5,
          responseTime: 'Same day'
        }
      },
      badge: { text: 'Community Favorite', color: 'green' },
      period: {
        startDate: now,
        endDate: oneWeekLater
      },
      priority: 4,
      status: 'active',
      createdBy: adminUser._id,
      isActive: true
    }
  ];

  const createdHighlights = await Highlight.insertMany(highlights);
  console.log('✅ Highlights seeded');
  return createdHighlights;
};

const runSeeder = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    await clearDatabase();
    
    const users = await seedUsers();
    const providers = await seedProviders(users);
    const jobs = await seedJobs(users);
    const highlights = await seedHighlights(providers, users);
    
    console.log(`
    ============================================================
    🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!
    ============================================================
    
    📊 Summary:
    - Users: ${users.length} (1 admin, 1 client, 3 providers)
    - Providers: ${providers.length}
    - Jobs: ${jobs.length}
    - Highlights: ${highlights.length}
    
    🔑 Test Accounts:
    Admin: admin@bataanconnect.com / admin123
    Client: maria@example.com / password123
    Provider 1: jose@example.com / password123
    Provider 2: ana@example.com / password123
    Provider 3: pedro@example.com / password123
    
    ✅ Ready to test the platform!
    ============================================================
    `);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeder if called directly
if (process.argv[1].endsWith('seed.js')) {
  runSeeder();
}

export default runSeeder; 