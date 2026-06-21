require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logger = require('./logger');

const User = require('../models/User');
const Service = require('../models/Service');
const Testimonial = require('../models/Testimonial');
const Team = require('../models/Team');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  logger.info('MongoDB connected for seeding');
};

// ─── Seed Data ────────────────────────────────────────────────────────────────

const users = [
  {
    name: process.env.ADMIN_NAME || 'Super Admin',
    email: process.env.ADMIN_EMAIL || 'admin@ladlibridalstudio.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    role: 'super_admin',
  },
  {
    name: 'Priya Manager',
    email: 'manager@ladlibridalstudio.com',
    password: 'Manager@123456',
    role: 'manager',
  },
  {
    name: 'Sunita Staff',
    email: 'staff@ladlibridalstudio.com',
    password: 'Staff@123456',
    role: 'staff',
  },
];

const services = [
  {
    title: 'Bridal Makeup',
    description: 'Transform into the most radiant bride on your special day. Our expert artists use premium products for a flawless, long-lasting look tailored to your features and style.',
    category: 'Bridal',
    price: 15000,
    duration: 180,
    active: true,
  },
  {
    title: 'Pre-Bridal Package',
    description: 'A comprehensive beauty regime to prepare you for your big day. Includes facial, cleanup, waxing, threading, and hair spa spread over multiple sessions.',
    category: 'Bridal',
    price: 8000,
    duration: 240,
    active: true,
  },
  {
    title: 'Party Makeup',
    description: 'Glamorous makeup looks for weddings, parties, and special occasions. Choose from natural, dramatic, or smokey styles.',
    category: 'Makeup',
    price: 3000,
    duration: 60,
    active: true,
  },
  {
    title: 'Hair Styling',
    description: 'Expert hair styling for all occasions. From elegant updos to soft curls, our stylists craft the perfect look for your event.',
    category: 'Hair',
    price: 1500,
    duration: 60,
    active: true,
  },
  {
    title: 'Facial & Skin Treatment',
    description: 'Advanced facials using premium products to nourish, brighten, and rejuvenate your skin for a natural glow.',
    category: 'Skin',
    price: 2000,
    duration: 75,
    active: true,
  },
  {
    title: 'Mehndi Application',
    description: 'Traditional and contemporary henna designs for brides and bridesmaids. Intricate patterns crafted with fresh, natural henna.',
    category: 'Mehndi',
    price: 5000,
    duration: 180,
    active: true,
  },
  {
    title: 'Engagement Makeup',
    description: 'Look picture-perfect for your engagement ceremony with a soft, romantic makeup look that photographs beautifully.',
    category: 'Bridal',
    price: 5000,
    duration: 90,
    active: true,
  },
  {
    title: 'Hair Spa & Treatment',
    description: 'Deep conditioning hair treatment to restore shine, strength, and health to your locks. Includes scalp massage.',
    category: 'Hair',
    price: 1200,
    duration: 60,
    active: true,
  },
];

const testimonials = [
  {
    customerName: 'Anjali Sharma',
    review: 'Ladli Bridal Studio made my wedding day absolutely perfect! The makeup was flawless and lasted all day. Highly recommend!',
    rating: 5,
    approved: true,
  },
  {
    customerName: 'Preethi Nair',
    review: 'I had the pre-bridal package done and my skin was glowing on my wedding day. The team is so professional and caring.',
    rating: 5,
    approved: true,
  },
  {
    customerName: 'Riya Patel',
    review: 'Amazing experience! The hair styling was gorgeous and exactly what I had envisioned. Will definitely come back!',
    rating: 5,
    approved: true,
  },
  {
    customerName: 'Meera Desai',
    review: 'The mehndi design was breathtaking. So many guests complimented it! Ladli is the best bridal studio in the city.',
    rating: 5,
    approved: true,
  },
];

const team = [
  {
    name: 'Ladli Sharma',
    designation: 'Master Bridal Artist & Founder',
    bio: 'With over 15 years of experience in luxury bridal makeup, Ladli has transformed thousands of brides. Trained in Mumbai and internationally certified, she brings international trends to every look.',
    experience: 15,
  },
  {
    name: 'Kavita Mehta',
    designation: 'Senior Hair Stylist',
    bio: 'Kavita is a maestro of hair artistry with 8 years of experience creating stunning bridal hairstyles. Her signature updos and braids are truly mesmerizing.',
    experience: 8,
  },
  {
    name: 'Sunita Rao',
    designation: 'Skin & Beauty Specialist',
    bio: 'A certified aesthetician with 6 years of expertise in skin treatments and pre-bridal care. Sunita ensures every bride has naturally glowing, healthy skin.',
    experience: 6,
  },
];

// ─── Import & Destroy ─────────────────────────────────────────────────────────

const importData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Service.deleteMany({});
    await Testimonial.deleteMany({});
    await Team.deleteMany({});

    // Hash passwords and insert users
    const hashedUsers = await Promise.all(
      users.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, parseInt(process.env.BCRYPT_ROUNDS) || 12),
      }))
    );
    await User.insertMany(hashedUsers);
    logger.info(`✅ ${hashedUsers.length} users seeded`);

    await Service.insertMany(services);
    logger.info(`✅ ${services.length} services seeded`);

    await Testimonial.insertMany(testimonials);
    logger.info(`✅ ${testimonials.length} testimonials seeded`);

    await Team.insertMany(team);
    logger.info(`✅ ${team.length} team members seeded`);

    logger.info('🌱 Database seeded successfully!');
    logger.info(`\n📋 Admin Credentials:\n   Email: ${users[0].email}\n   Password: ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await User.deleteMany({});
    await Service.deleteMany({});
    await Testimonial.deleteMany({});
    await Team.deleteMany({});
    logger.info('💥 All data destroyed');
    process.exit(0);
  } catch (error) {
    logger.error(`Destroy failed: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '--destroy') {
  destroyData();
} else {
  importData();
}
