// MongoDB initialization script for Docker
db = db.getSiblingDB('ladli_bridal_studio');

db.createUser({
  user: 'ladli_user',
  pwd: 'ladli_db_pass_2024',
  roles: [{ role: 'readWrite', db: 'ladli_bridal_studio' }],
});

db.createCollection('users');
db.createCollection('appointments');
db.createCollection('services');
db.createCollection('galleries');
db.createCollection('teams');
db.createCollection('testimonials');
db.createCollection('reviews');
db.createCollection('contactmessages');

print('✅ MongoDB initialized for Ladli Bridal Studio');
