const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Razorpay = require('razorpay');
const { MongoClient, ObjectId } = require('mongodb');

dotenv.config();

const requiredEnv = ['MONGODB_URI', 'DB_NAME', 'JWT_SECRET', 'ADMIN_ID', 'ADMIN_PASSWORD', 'PORT'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  throw new Error(`Missing required env values: ${missingEnv.join(', ')}`);
}

const env = {
  MONGODB_URI: process.env.MONGODB_URI,
  DB_NAME: process.env.DB_NAME,
  JWT_SECRET: process.env.JWT_SECRET,
  ADMIN_ID: process.env.ADMIN_ID,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  PORT: Number(process.env.PORT) || 5000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
};

const COLLECTIONS = {
  USERS: 'users',
  VENDORS: 'vendors',
  INDUSTRIES: 'industries',
  VENDOR_CATEGORIES: 'vendorCategories',
  INDUSTRY_CATEGORIES: 'industryCategories',
  VENDOR_SERVICES: 'vendorServices',
  REQUIREMENTS: 'requirements',
  INQUIRIES: 'inquiries',
  PROFILE_VIEWS: 'profileViews',
  VENDOR_RATINGS: 'vendorRatings',
  SUBSCRIPTIONS: 'subscriptions',
  PAYMENTS: 'payments',
  ADMIN_LOGS: 'adminLogs',
  FEATURED_LISTINGS: 'featuredListings'
};

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

const vendorUploadFields = upload.fields([
  { name: 'companyLogo', maxCount: 1 },
  { name: 'galleryImages', maxCount: 5 },
  { name: 'documents', maxCount: 10 },
  { name: 'certificates', maxCount: 10 }
]);

function maybeHandleVendorUploads(req, res, next) {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }
  return vendorUploadFields(req, res, next);
}

function toUploadPath(file) {
  return `uploads/${file.filename}`;
}

function removeUploadFileByPath(filePath) {
  const normalized = sanitizeString(filePath).replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || !normalized.startsWith('uploads/')) {
    return;
  }

  const absolutePath = path.resolve(__dirname, normalized);
  const allowedRoot = path.resolve(uploadsDir);
  if (!absolutePath.startsWith(allowedRoot)) {
    return;
  }

  try {
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (error) {
    console.warn(`[UPLOAD] Failed to remove file ${absolutePath}: ${error.message}`);
  }
}

const client = new MongoClient(env.MONGODB_URI);
let db;

async function connectDB() {
  if (db) return db;
  await client.connect();
  db = client.db(env.DB_NAME);
  await initializeIndexes(db);
  return db;
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return db;
}

async function initializeIndexes(database) {
  const ensureEmailIndex = async (collection) => {
    try {
      await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    } catch (error) {
      if (error?.codeName === 'IndexKeySpecsConflict' || error?.codeName === 'IndexOptionsConflict') {
        console.warn(`[INDEX] Reusing existing email index on ${collection.collectionName}: ${error.codeName}`);
        return;
      }
      throw error;
    }
  };

  await Promise.all([
    database.collection(COLLECTIONS.VENDORS).createIndexes([
      { key: { category: 1 } },
      { key: { verified: 1 } },
      { key: { rating: -1 } },
      { key: { subscriptionPlan: 1 } },
      { key: { createdAt: -1 } }
    ]).catch((error) => {
      if (error.codeName === 'IndexOptionsConflict') {
        console.log('[INDEX] Vendor indexes already exist with different options, skipping...');
        return;
      }
      throw error;
    }),
    database.collection(COLLECTIONS.VENDORS).createIndex(
      { companyName: 'text', servicesOffered: 'text', industryType: 'text', cityState: 'text' },
      { name: 'vendor_text_search_index' }
    ).catch((error) => {
      if (error.codeName === 'IndexOptionsConflict') {
        console.log('[INDEX] Text search index conflict, trying to drop existing indexes...');
        // First try to drop the old location-based index
        return database.collection(COLLECTIONS.VENDORS).dropIndex('companyName_text_servicesOffered_text_location_text_industryType_text')
          .catch(() => {
            console.log('[INDEX] Old index not found, continuing...');
          })
          .then(() => {
            return database.collection(COLLECTIONS.VENDORS).createIndex(
              { companyName: 'text', servicesOffered: 'text', industryType: 'text', cityState: 'text' },
              { name: 'vendor_text_search_index' }
            );
          });
      }
      throw error;
    }),
    database.collection(COLLECTIONS.REQUIREMENTS).createIndexes([
      { key: { requirementCategory: 1 } },
      { key: { location: 1 } },
      { key: { createdAt: -1 } },
      { key: { projectDescription: 'text', industryName: 'text', location: 'text' } }
    ]),
    database.collection(COLLECTIONS.SUBSCRIPTIONS).createIndexes([{ key: { plan: 1 } }, { key: { createdAt: -1 } }]),
    database.collection(COLLECTIONS.VENDOR_SERVICES).createIndexes([{ key: { category: 1 } }, { key: { vendorId: 1 } }]),
    database.collection(COLLECTIONS.VENDOR_RATINGS).createIndexes([{ key: { vendorId: 1 } }, { key: { rating: -1 } }]),
    database.collection(COLLECTIONS.VENDOR_RATINGS).createIndexes([{ key: { vendorId: 1, userId: 1 }, unique: true }]),
    database.collection(COLLECTIONS.INQUIRIES).createIndexes([{ key: { vendorId: 1 } }, { key: { industryId: 1 } }, { key: { createdAt: -1 } }]),
    database.collection(COLLECTIONS.PROFILE_VIEWS).createIndexes([
      { key: { vendorId: 1, lastViewedAt: -1 } },
      { key: { vendorId: 1, viewerId: 1, viewerRole: 1 }, unique: true }
    ]),
    database.collection(COLLECTIONS.PAYMENTS).createIndexes([{ key: { vendorId: 1 } }, { key: { status: 1 } }, { key: { createdAt: -1 } }]),
    ensureEmailIndex(database.collection(COLLECTIONS.USERS)),
    ensureEmailIndex(database.collection(COLLECTIONS.INDUSTRIES)),
    ensureEmailIndex(database.collection(COLLECTIONS.VENDORS))
  ]);

  const categoryCollection = database.collection(COLLECTIONS.VENDOR_CATEGORIES);
  const existingCount = await categoryCollection.countDocuments();
  if (existingCount === 0) {
    await categoryCollection.insertOne({
      title: 'default-categories',
      categories: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const industryCategoryCollection = database.collection(COLLECTIONS.INDUSTRY_CATEGORIES);
  const industryCategoryCount = await industryCategoryCollection.countDocuments();
  if (industryCategoryCount === 0) {
    await industryCategoryCollection.insertOne({
      title: 'default-industry-categories',
      categories: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').toLowerCase());
}

function isValidPhone(phone) {
  return /^\+?[0-9]{10,15}$/.test(String(phone || '').replace(/\s|-/g, ''));
}

function sanitizeString(value) {
  return String(value || '').trim();
}

function hasSilverAccess(vendor = {}) {
  const paid = sanitizeString(vendor.paid || '');
  const plan = sanitizeString(vendor.subscriptionPlan || '');
  return paid === 'Silver' || plan === 'Verified Vendor' || plan === 'Premium Vendor';
}

async function enforceVendorSubscriptionExpiry(database, vendorId) {
  if (!vendorId) return null;

  const vendor = await database.collection(COLLECTIONS.VENDORS).findOne(
    { _id: new ObjectId(vendorId) },
    { projection: { subscriptionPlan: 1, paid: 1 } }
  );

  if (!vendor) return null;

  const now = new Date();
  const activeSubscription = await database.collection(COLLECTIONS.SUBSCRIPTIONS).findOne(
    {
      vendorId,
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    },
    { sort: { endDate: -1 } }
  );

  if (activeSubscription) {
    return vendor;
  }

  await database.collection(COLLECTIONS.SUBSCRIPTIONS).updateMany(
    { vendorId, status: 'active', endDate: { $lt: now } },
    {
      $set: {
        status: 'expired',
        updatedAt: new Date()
      }
    }
  );

  const isAlreadyFree = sanitizeString(vendor.subscriptionPlan) === 'Free Vendor Listing' && sanitizeString(vendor.paid || 'None') === 'None';
  if (!isAlreadyFree) {
    await database.collection(COLLECTIONS.VENDORS).updateOne(
      { _id: new ObjectId(vendorId) },
      {
        $set: {
          subscriptionPlan: 'Free Vendor Listing',
          planLabel: 'Visibility',
          premium: false,
          verified: false,
          paid: 'None',
          updatedAt: new Date()
        }
      }
    );
  }

  return {
    ...vendor,
    subscriptionPlan: 'Free Vendor Listing',
    paid: 'None'
  };
}

function getTokenFromHeader(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.replace('Bearer ', '').trim();
}

function requireAuth(allowedRoles = []) {
  return (req, res, next) => {
    try {
      const token = getTokenFromHeader(req);
      if (!token) {
        return res.status(401).json({ message: 'Authentication token missing.' });
      }

      const decoded = verifyToken(token);
      req.auth = decoded;

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'You are not authorized for this resource.' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
  };
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  if (status >= 500) {
    console.error('[SERVER ERROR]', err);
  }
  res.status(status).json({ message });
}

function getTokenKeyByRole(role) {
  if (role === 'admin') return 'adminToken';
  if (role === 'vendor') return 'vendorToken';
  return 'userToken';
}

async function register(req, res, next) {
  try {
    const database = getDB();
    const name = sanitizeString(req.body.name);
    const email = sanitizeString(req.body.email).toLowerCase();
    const password = String(req.body.password || '');

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const exists = await database.collection(COLLECTIONS.USERS).findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await database.collection(COLLECTIONS.USERS).insertOne({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      accountType: 'user',
      shortlistedVendors: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const token = signToken({
      id: result.insertedId.toString(),
      role: 'user',
      email
    });

    return res.status(201).json({
      message: 'User registered successfully.',
      token,
      tokenKey: getTokenKeyByRole('user'),
      user: {
        id: result.insertedId,
        name,
        email,
        role: 'user'
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const database = getDB();
    const email = sanitizeString(req.body.email).toLowerCase();
    const password = String(req.body.password || '');
    const role = sanitizeString(req.body.role || 'user');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    let account = null;
    let normalizedRole = role;
    const wrongCredsMessage = 'Wrong email or password.';

    if (role === 'vendor') {
      account = await database.collection(COLLECTIONS.VENDORS).findOne({ email });
      if (account && !account.approved) {
        return res.status(403).json({ message: 'Vendor account is pending admin approval.' });
      }
      if (account?._id) {
        await enforceVendorSubscriptionExpiry(database, account._id.toString());
        account = await database.collection(COLLECTIONS.VENDORS).findOne({ _id: account._id });
      }
    } else {
      account = await database.collection(COLLECTIONS.USERS).findOne({ email });
      if (!account) {
        const industryAccount = await database.collection(COLLECTIONS.INDUSTRIES).findOne({ email });
        if (industryAccount) {
          account = industryAccount;
          normalizedRole = 'user';
        }
      }
      normalizedRole = 'user';
    }

    if (!account) {
      return res.status(401).json({ message: wrongCredsMessage });
    }

    const validPassword = await bcrypt.compare(password, account.password || '');
    if (!validPassword) {
      return res.status(401).json({ message: wrongCredsMessage });
    }

    const token = signToken({
      id: account._id.toString(),
      role: normalizedRole,
      email: account.email
    });

    return res.status(200).json({
      message: 'Login successful.',
      token,
      tokenKey: getTokenKeyByRole(normalizedRole),
      role: normalizedRole,
      profile: {
        id: account._id,
        name: account.name || account.companyName || account.industryName,
        email: account.email
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res) {
  return res.status(200).json({
    message: 'Logout successful. Remove the role token from client storage.',
    role: req.body.role || 'unknown'
  });
}

function normalizeVendorPayload(body = {}) {
  const categoriesFromBody = Array.isArray(body.categories)
    ? body.categories.map((item) => sanitizeString(item)).filter(Boolean)
    : String(body.categories || '')
        .split(',')
        .map((item) => sanitizeString(item))
        .filter(Boolean);
  const primaryCategory = sanitizeString(body.category);
  const normalizedCategories = Array.from(new Set([...(categoriesFromBody || []), ...(primaryCategory ? [primaryCategory] : [])]));

  return {
    companyName: sanitizeString(body.companyName),
    contactPerson: sanitizeString(body.contactPerson),
    mobileNumber: sanitizeString(body.mobileNumber),
    whatsappNumber: sanitizeString(body.whatsappNumber),
    email: sanitizeString(body.email).toLowerCase(),
    officeAddress: sanitizeString(body.officeAddress),
    cityState: sanitizeString(body.cityState),
    category: primaryCategory,
    categories: normalizedCategories,
    servicesOffered: Array.isArray(body.servicesOffered)
      ? body.servicesOffered.map((s) => sanitizeString(s)).filter(Boolean)
      : String(body.servicesOffered || '')
          .split(',')
          .map((s) => sanitizeString(s))
          .filter(Boolean),
    yearsExperience: Number(body.yearsExperience) || 0,
    companyLogo: sanitizeString(body.companyLogo),
    galleryImages: Array.isArray(body.galleryImages) ? body.galleryImages : [],
    documents: Array.isArray(body.documents) ? body.documents : [],
    certificates: Array.isArray(body.certificates) ? body.certificates : [],
    industryType: sanitizeString(body.industryType),
    companyDescription: sanitizeString(body.companyDescription),
    industriesServed: Array.isArray(body.industriesServed) ? body.industriesServed : [],
    planBadge: sanitizeString(body.planBadge || 'Visibility'),
    city: sanitizeString(body.city),
    primaryServiceArea: Array.isArray(body.primaryServiceArea)
      ? body.primaryServiceArea.map((item) => sanitizeString(item)).filter(Boolean)
      : String(body.primaryServiceArea || '')
          .split(',')
          .map((item) => sanitizeString(item))
          .filter(Boolean),
    serviceTypes: Array.isArray(body.serviceTypes)
      ? body.serviceTypes.map((item) => sanitizeString(item)).filter(Boolean)
      : String(body.serviceTypes || '')
          .split(',')
          .map((item) => sanitizeString(item))
          .filter(Boolean),
    workerCount: sanitizeString(body.workerCount),
    specialization: sanitizeString(body.specialization),
    businessType: sanitizeString(body.businessType),
    gstRegistered: sanitizeString(body.gstRegistered),
    gstNumber: sanitizeString(body.gstNumber),
    pfRegistered: sanitizeString(body.pfRegistered),
    esicRegistered: sanitizeString(body.esicRegistered),
    labourLicense: sanitizeString(body.labourLicense),
    majorClients: sanitizeString(body.majorClients),
    annualRegistrationPlan: sanitizeString(body.annualRegistrationPlan),
    preferredPaymentMethod: sanitizeString(body.preferredPaymentMethod),
    declaration: sanitizeString(body.declaration)
  };
}

async function registerVendor(req, res, next) {
  try {
    const database = getDB();
    const payload = normalizeVendorPayload(req.body);
    const password = String(req.body.password || '');
    const uploadedLogo = req.files?.companyLogo?.[0];
    const uploadedDocuments = req.files?.documents || [];
    const uploadedCertificates = req.files?.certificates || [];

    if (uploadedLogo) {
      payload.companyLogo = toUploadPath(uploadedLogo);
    }
    if (uploadedDocuments.length) {
      payload.documents = uploadedDocuments.map(toUploadPath);
    }
    if (uploadedCertificates.length) {
      payload.certificates = uploadedCertificates.map(toUploadPath);
    }

    const requiredFields = [
      payload.companyName,
      payload.contactPerson,
      payload.mobileNumber,
      payload.email,
      payload.officeAddress,
      payload.cityState,
      payload.category
    ];

    if (requiredFields.some((field) => !field) || !password) {
      return res.status(400).json({ message: 'Please fill all required vendor fields.' });
    }

    if (!isValidEmail(payload.email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }
    if (!isValidPhone(payload.mobileNumber)) {
      return res.status(400).json({ message: 'Invalid mobile number.' });
    }

    const exists = await database.collection(COLLECTIONS.VENDORS).findOne({ email: payload.email });
    if (exists) {
      return res.status(409).json({ message: 'Vendor already registered with this email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await database.collection(COLLECTIONS.VENDORS).insertOne({
      ...payload,
      categories: payload.categories.length ? payload.categories.slice(0, 4) : [payload.category],
      password: hashedPassword,
      approved: false,
      verified: false,
      rating: 0,
      totalReviews: 0,
      subscriptionPlan: 'Free Vendor Listing',
      planLabel: 'Visibility',
      premium: false,
      featured: false,
      suspended: false,
      profileViews: 0,
      paid: 'None',
      profileCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await database.collection(COLLECTIONS.VENDOR_SERVICES).insertOne({
      vendorId: result.insertedId.toString(),
      services: payload.servicesOffered,
      category: payload.category,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return res.status(201).json({
      message: 'Vendor registered successfully. Waiting for admin approval.',
      vendorId: result.insertedId
    });
  } catch (error) {
    return next(error);
  }
}

async function updateVendorProfile(req, res, next) {
  try {
    const database = getDB();
    const vendorId = req.auth.id;
    const payload = normalizeVendorPayload(req.body);
    const existingVendor = await database.collection(COLLECTIONS.VENDORS).findOne({ _id: new ObjectId(vendorId) });
    const hasField = (field) => Object.prototype.hasOwnProperty.call(req.body, field);

    const updateSet = { updatedAt: new Date() };
    if (hasField('companyName')) updateSet.companyName = payload.companyName;
    if (hasField('contactPerson')) updateSet.contactPerson = payload.contactPerson;
    if (hasField('mobileNumber')) updateSet.mobileNumber = payload.mobileNumber;
    if (hasField('whatsappNumber')) updateSet.whatsappNumber = payload.whatsappNumber;
    if (hasField('email')) updateSet.email = payload.email;
    if (hasField('officeAddress')) updateSet.officeAddress = payload.officeAddress;
    if (hasField('cityState')) updateSet.cityState = payload.cityState;
    if (hasField('category')) updateSet.category = payload.category;
    if (hasField('categories')) {
      const normalized = payload.categories.slice(0, 4);
      updateSet.categories = normalized;
      if (!hasField('category') && normalized.length) {
        updateSet.category = normalized[0];
      }
    }
    if (hasField('industryType')) updateSet.industryType = payload.industryType;
    if (hasField('companyDescription')) updateSet.companyDescription = payload.companyDescription;
    if (hasField('industriesServed')) updateSet.industriesServed = payload.industriesServed;
    if (hasField('planBadge')) updateSet.planBadge = payload.planBadge;
    if (hasField('city')) updateSet.city = payload.city;
    if (hasField('primaryServiceArea')) updateSet.primaryServiceArea = payload.primaryServiceArea;
    if (hasField('serviceTypes')) updateSet.serviceTypes = payload.serviceTypes;
    if (hasField('workerCount')) updateSet.workerCount = payload.workerCount;
    if (hasField('specialization')) updateSet.specialization = payload.specialization;
    if (hasField('businessType')) updateSet.businessType = payload.businessType;
    if (hasField('gstRegistered')) updateSet.gstRegistered = payload.gstRegistered;
    if (hasField('gstNumber')) updateSet.gstNumber = payload.gstNumber;
    if (hasField('pfRegistered')) updateSet.pfRegistered = payload.pfRegistered;
    if (hasField('esicRegistered')) updateSet.esicRegistered = payload.esicRegistered;
    if (hasField('labourLicense')) updateSet.labourLicense = payload.labourLicense;
    if (hasField('majorClients')) updateSet.majorClients = payload.majorClients;
    if (hasField('annualRegistrationPlan')) updateSet.annualRegistrationPlan = payload.annualRegistrationPlan;
    if (hasField('preferredPaymentMethod')) updateSet.preferredPaymentMethod = payload.preferredPaymentMethod;
    if (hasField('declaration')) updateSet.declaration = payload.declaration;
    if (hasField('yearsExperience')) updateSet.yearsExperience = payload.yearsExperience;
    if (hasField('servicesOffered')) updateSet.servicesOffered = payload.servicesOffered;

    const uploadedLogo = req.files?.companyLogo?.[0];
    const uploadedGalleryImages = req.files?.galleryImages || [];
    const uploadedDocuments = req.files?.documents || [];
    const uploadedCertificates = req.files?.certificates || [];
    if (uploadedLogo) updateSet.companyLogo = toUploadPath(uploadedLogo);
    if (uploadedGalleryImages.length) {
      const invalidGalleryType = uploadedGalleryImages.find((file) => !String(file.mimetype || '').startsWith('image/'));
      if (invalidGalleryType) {
        return res.status(400).json({ message: 'Only image files are allowed for gallery uploads.' });
      }

      const isPaidPlan = ['Verified Vendor', 'Premium Vendor'].includes(existingVendor?.subscriptionPlan || '');
      const galleryLimit = isPaidPlan ? 5 : 2;
      const existingGallery = Array.isArray(existingVendor?.galleryImages) ? existingVendor.galleryImages : [];
      const mergedGallery = [...existingGallery, ...uploadedGalleryImages.map(toUploadPath)];

      if (mergedGallery.length > galleryLimit) {
        return res.status(400).json({ message: `Image upload limit reached. Your plan allows maximum ${galleryLimit} images.` });
      }

      updateSet.galleryImages = mergedGallery;
    }
    if (uploadedDocuments.length) updateSet.documents = uploadedDocuments.map(toUploadPath);
    if (uploadedCertificates.length) updateSet.certificates = uploadedCertificates.map(toUploadPath);

    const mergedDescription = Object.prototype.hasOwnProperty.call(updateSet, 'companyDescription')
      ? updateSet.companyDescription
      : existingVendor?.companyDescription || '';
    const mergedServices = Object.prototype.hasOwnProperty.call(updateSet, 'servicesOffered')
      ? updateSet.servicesOffered
      : existingVendor?.servicesOffered || [];
    updateSet.profileCompleted = Boolean(mergedDescription && mergedServices.length > 0);

    await database.collection(COLLECTIONS.VENDORS).updateOne({ _id: new ObjectId(vendorId) }, { $set: updateSet });

    const shouldUpdateVendorServices = hasField('servicesOffered') || hasField('category');
    if (shouldUpdateVendorServices) {
      await database.collection(COLLECTIONS.VENDOR_SERVICES).updateOne(
        { vendorId },
        {
          $set: {
            services: payload.servicesOffered,
            category: payload.category,
            updatedAt: new Date()
          },
          $setOnInsert: {
            vendorId,
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
    }

    return res.status(200).json({ message: 'Vendor profile updated successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function getVendorListings(req, res, next) {
  try {
    const database = getDB();
    const {
      category,
      industryType,
      verified,
      topRated,
      newVendors,
      premium,
      featured,
      search,
      minRating,
      reviewMin
    } = req.query;

    const match = { suspended: { $ne: true } };
    if (category) {
      match.$or = [
        { category },
        { categories: category }
      ];
    }
    if (industryType) match.industryType = { $regex: industryType, $options: 'i' };
    if (verified === 'true') match.verified = true;
    if (premium === 'true') match.subscriptionPlan = 'Premium Vendor';
    if (featured === 'true') match.featured = true;
    if (search) {
      const searchConditions = [
        { companyName: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { categories: { $elemMatch: { $regex: search, $options: 'i' } } },
        { servicesOffered: { $elemMatch: { $regex: search, $options: 'i' } } },
        { industryType: { $regex: search, $options: 'i' } },
        { cityState: { $regex: search, $options: 'i' } }
      ];
      if (match.$or) {
        match.$and = [{ $or: match.$or }, { $or: searchConditions }];
        delete match.$or;
      } else {
        match.$or = searchConditions;
      }
    }

    if (newVendors === 'true') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      match.createdAt = { $gte: cutoff };
    }

    const pipeline = [{ $match: match }];

    pipeline.push({
      $addFields: {
        planRank: {
          $switch: {
            branches: [
              { case: { $eq: ['$subscriptionPlan', 'Premium Vendor'] }, then: 3 },
              { case: { $eq: ['$subscriptionPlan', 'Verified Vendor'] }, then: 2 }
            ],
            default: 1
          }
        }
      }
    });

    if (topRated === 'true') {
      pipeline.push({ $match: { rating: { $gte: 4 } } });
    }

    const parsedMinRating = Number(minRating || reviewMin);
    if (Number.isFinite(parsedMinRating) && parsedMinRating > 0) {
      pipeline.push({ $match: { rating: { $gte: Math.min(5, Math.max(1, parsedMinRating)) } } });
    }

    pipeline.push({ $sort: { planRank: -1, verified: -1, rating: -1, createdAt: -1 } });
    pipeline.push({ $project: { password: 0 } });

    const listings = await database.collection(COLLECTIONS.VENDORS).aggregate(pipeline).toArray();
    return res.status(200).json(listings);
  } catch (error) {
    return next(error);
  }
}

async function updateVendorByAdmin(req, res, next) {
  try {
    const database = getDB();
    const vendorId = sanitizeString(req.body.vendorId);
    if (!ObjectId.isValid(vendorId)) {
      return res.status(400).json({ message: 'Invalid vendor id.' });
    }

    const payload = normalizeVendorPayload(req.body);
    const hasField = (field) => Object.prototype.hasOwnProperty.call(req.body, field);
    const updateSet = { updatedAt: new Date() };

    if (hasField('companyName')) updateSet.companyName = payload.companyName;
    if (hasField('contactPerson')) updateSet.contactPerson = payload.contactPerson;
    if (hasField('mobileNumber')) updateSet.mobileNumber = payload.mobileNumber;
    if (hasField('whatsappNumber')) updateSet.whatsappNumber = payload.whatsappNumber;
    if (hasField('email')) updateSet.email = payload.email;
    if (hasField('officeAddress')) updateSet.officeAddress = payload.officeAddress;
    if (hasField('cityState')) updateSet.cityState = payload.cityState;
    if (hasField('category')) updateSet.category = payload.category;
    if (hasField('industryType')) updateSet.industryType = payload.industryType;
    if (hasField('companyDescription')) updateSet.companyDescription = payload.companyDescription;
    if (hasField('industriesServed')) updateSet.industriesServed = payload.industriesServed;
    if (hasField('city')) updateSet.city = payload.city;
    if (hasField('primaryServiceArea')) updateSet.primaryServiceArea = payload.primaryServiceArea;
    if (hasField('serviceTypes')) updateSet.serviceTypes = payload.serviceTypes;
    if (hasField('workerCount')) updateSet.workerCount = payload.workerCount;
    if (hasField('specialization')) updateSet.specialization = payload.specialization;
    if (hasField('businessType')) updateSet.businessType = payload.businessType;
    if (hasField('gstRegistered')) updateSet.gstRegistered = payload.gstRegistered;
    if (hasField('gstNumber')) updateSet.gstNumber = payload.gstNumber;
    if (hasField('pfRegistered')) updateSet.pfRegistered = payload.pfRegistered;
    if (hasField('esicRegistered')) updateSet.esicRegistered = payload.esicRegistered;
    if (hasField('labourLicense')) updateSet.labourLicense = payload.labourLicense;
    if (hasField('majorClients')) updateSet.majorClients = payload.majorClients;
    if (hasField('annualRegistrationPlan')) updateSet.annualRegistrationPlan = payload.annualRegistrationPlan;
    if (hasField('preferredPaymentMethod')) updateSet.preferredPaymentMethod = payload.preferredPaymentMethod;
    if (hasField('declaration')) updateSet.declaration = payload.declaration;
    if (hasField('yearsExperience')) updateSet.yearsExperience = payload.yearsExperience;
    if (hasField('servicesOffered')) updateSet.servicesOffered = payload.servicesOffered;
    if (hasField('verified')) updateSet.verified = Boolean(req.body.verified);
    if (hasField('approved')) updateSet.approved = Boolean(req.body.approved);
    if (hasField('featured')) updateSet.featured = Boolean(req.body.featured);
    if (hasField('suspended')) updateSet.suspended = Boolean(req.body.suspended);

    await database.collection(COLLECTIONS.VENDORS).updateOne(
      { _id: new ObjectId(vendorId) },
      { $set: updateSet }
    );

    if (hasField('servicesOffered') || hasField('category')) {
      await database.collection(COLLECTIONS.VENDOR_SERVICES).updateOne(
        { vendorId },
        {
          $set: {
            vendorId,
            services: payload.servicesOffered,
            category: payload.category,
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
    }

    if (hasField('featured')) {
      await database.collection(COLLECTIONS.FEATURED_LISTINGS).updateOne(
        { vendorId },
        {
          $set: {
            vendorId,
            featured: Boolean(req.body.featured),
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
    }

    await database.collection(COLLECTIONS.ADMIN_LOGS).insertOne({
      action: 'admin_edit_vendor',
      vendorId,
      adminId: req.auth.id,
      createdAt: new Date()
    });

    return res.status(200).json({ message: 'Vendor updated successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function getVendorProfile(req, res, next) {
  try {
    const database = getDB();
    const id = sanitizeString(req.query.vendorId || req.auth?.id);
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid vendor id.' });
    }

    const vendor = await database.collection(COLLECTIONS.VENDORS).findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }

    if (vendor.suspended) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }

    const token = getTokenFromHeader(req);
    let viewerUserIdForRating = '';
    let viewer = null;
    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded?.id && decoded?.role && !(decoded.role === 'vendor' && decoded.id === id)) {
          if (decoded.role === 'vendor' && ObjectId.isValid(decoded.id)) {
            const viewerVendor = await database.collection(COLLECTIONS.VENDORS).findOne(
              { _id: new ObjectId(decoded.id) },
              { projection: { companyName: 1, email: 1, companyLogo: 1, location: 1 } }
            );
            if (viewerVendor) {
              viewer = {
                viewerId: decoded.id,
                viewerRole: 'vendor',
                viewerType: 'vendor',
                viewerName: viewerVendor.companyName || 'Vendor',
                viewerEmail: viewerVendor.email || '',
                viewerAvatar: viewerVendor.companyLogo || '',
                viewerLocation: viewerVendor.location || ''
              };
            }
          } else if (decoded.role === 'user' && ObjectId.isValid(decoded.id)) {
            viewerUserIdForRating = decoded.id;
            const viewerIndustry = await database.collection(COLLECTIONS.INDUSTRIES).findOne(
              { _id: new ObjectId(decoded.id) },
              { projection: { industryName: 1, contactName: 1, email: 1, location: 1 } }
            );
            if (viewerIndustry) {
              viewer = {
                viewerId: decoded.id,
                viewerRole: 'user',
                viewerType: 'industry',
                viewerName: viewerIndustry.industryName || viewerIndustry.contactName || 'Industry User',
                viewerEmail: viewerIndustry.email || '',
                viewerAvatar: '',
                viewerLocation: viewerIndustry.location || ''
              };
            } else {
              const viewerUser = await database.collection(COLLECTIONS.USERS).findOne(
                { _id: new ObjectId(decoded.id) },
                { projection: { name: 1, email: 1 } }
              );
              if (viewerUser) {
                viewer = {
                  viewerId: decoded.id,
                  viewerRole: 'user',
                  viewerType: 'user',
                  viewerName: viewerUser.name || 'User',
                  viewerEmail: viewerUser.email || '',
                  viewerAvatar: '',
                  viewerLocation: ''
                };
              }
            }
          }
        }
      } catch (error) {
        viewer = null;
      }
    }

    if (viewer) {
      await database.collection(COLLECTIONS.PROFILE_VIEWS).updateOne(
        { vendorId: id, viewerId: viewer.viewerId, viewerRole: viewer.viewerRole },
        {
          $set: {
            ...viewer,
            vendorId: id,
            lastViewedAt: new Date(),
            updatedAt: new Date()
          },
          $inc: { viewCount: 1 },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
    }

    await database.collection(COLLECTIONS.VENDORS).updateOne({ _id: vendor._id }, { $inc: { profileViews: 1 } });

    const ratings = await database
      .collection(COLLECTIONS.VENDOR_RATINGS)
      .find({ vendorId: vendor._id.toString() })
      .sort({ createdAt: -1 })
      .toArray();
    const myRatingDoc = viewerUserIdForRating
      ? await database.collection(COLLECTIONS.VENDOR_RATINGS).findOne(
          { vendorId: vendor._id.toString(), userId: viewerUserIdForRating },
          { projection: { rating: 1, updatedAt: 1 } }
        )
      : null;

    return res.status(200).json({
      ...vendor,
      ratings,
      myRating: Number(myRatingDoc?.rating || 0),
      myRatingUpdatedAt: myRatingDoc?.updatedAt || null
    });
  } catch (error) {
    return next(error);
  }
}

async function getVendorSelfProfile(req, res, next) {
  try {
    const database = getDB();
    const vendorId = req.auth.id;
    await enforceVendorSubscriptionExpiry(database, vendorId);

    const vendor = await database.collection(COLLECTIONS.VENDORS).findOne(
      { _id: new ObjectId(vendorId) },
      { projection: { password: 0 } }
    );

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }

    return res.status(200).json(vendor);
  } catch (error) {
    return next(error);
  }
}

async function getVendors(req, res, next) {
  try {
    const database = getDB();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const vendors = await database
      .collection(COLLECTIONS.VENDORS)
      .find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    const totalVendors = await database.collection(COLLECTIONS.VENDORS).countDocuments();
    const totalPages = Math.ceil(totalVendors / limit);

    return res.status(200).json({
      vendors,
      currentPage: page,
      totalPages,
      totalVendors
    });
  } catch (error) {
    return next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const database = getDB();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await database
      .collection(COLLECTIONS.USERS)
      .find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    const totalUsers = await database.collection(COLLECTIONS.USERS).countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      users,
      currentPage: page,
      totalPages,
      totalUsers
    });
  } catch (error) {
    return next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const database = getDB();
    const { userId, ...updateData } = req.body;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id.' });
    }

    const result = await database.collection(COLLECTIONS.USERS).updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({ message: 'User updated successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const database = getDB();
    const { userId } = req.params;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id.' });
    }

    const result = await database.collection(COLLECTIONS.USERS).deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function getVendorAnalytics(req, res, next) {
  try {
    const database = getDB();
    const vendorId = req.auth.id;
    await enforceVendorSubscriptionExpiry(database, vendorId);

    const vendor = await database.collection(COLLECTIONS.VENDORS).findOne({ _id: new ObjectId(vendorId) });
    const uniqueProfileViews = await database.collection(COLLECTIONS.PROFILE_VIEWS).countDocuments({ vendorId });
    const totalInquiries = await database.collection(COLLECTIONS.INQUIRIES).countDocuments({ vendorId });
    const openInquiries = await database.collection(COLLECTIONS.INQUIRIES).countDocuments({ vendorId, status: 'open' });

    const [responses] = await database
      .collection(COLLECTIONS.REQUIREMENTS)
      .aggregate([
        { $unwind: { path: '$responses', preserveNullAndEmptyArrays: true } },
        { $match: { 'responses.vendorId': vendorId } },
        { $count: 'total' }
      ])
      .toArray();

    console.log('Vendor Analytics Data for View Inquiries:', {
      subscriptionPlan: vendor?.subscriptionPlan,
      paid: vendor?.paid,
      verified: vendor?.verified,
      vendorId: req.auth.id
    });

    return res.status(200).json({
      profileViews: vendor?.profileViews || 0,
      uniqueProfileViews,
      totalInquiries,
      openInquiries,
      responses: responses?.total || 0,
      plan: vendor?.subscriptionPlan || 'Free Vendor Listing',
      verified: Boolean(vendor?.verified),
      rating: vendor?.rating || 0,
      companyName: vendor?.companyName || '',
      companyLogo: vendor?.companyLogo || '',
      paid: vendor?.paid || 'None',
      suspended: Boolean(vendor?.suspended)
    });
  } catch (error) {
    return next(error);
  }
}

async function getVendorProfileViews(req, res, next) {
  try {
    const database = getDB();
    const vendorId = req.auth.id;
    await enforceVendorSubscriptionExpiry(database, vendorId);
    const vendor = await database.collection(COLLECTIONS.VENDORS).findOne(
      { _id: new ObjectId(vendorId) },
      { projection: { subscriptionPlan: 1, paid: 1 } }
    );
    if (!hasSilverAccess(vendor || {})) {
      return res.status(403).json({ message: 'Upgrade to Silver plan to access Profile Views.' });
    }
    const search = sanitizeString(req.query.search);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(10, Math.max(1, Number(req.query.limit) || 10));

    const filter = { vendorId };
    if (search) {
      filter.$or = [
        { viewerName: { $regex: search, $options: 'i' } },
        { viewerEmail: { $regex: search, $options: 'i' } },
        { viewerType: { $regex: search, $options: 'i' } },
        { viewerLocation: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await database.collection(COLLECTIONS.PROFILE_VIEWS).countDocuments(filter);
    const items = await database
      .collection(COLLECTIONS.PROFILE_VIEWS)
      .find(filter)
      .sort({ lastViewedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return res.status(200).json({
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (error) {
    return next(error);
  }
}

async function getVendorProfileViewsGrowth(req, res, next) {
  try {
    const database = getDB();
    const vendorId = req.auth.id;
    await enforceVendorSubscriptionExpiry(database, vendorId);
    const vendor = await database.collection(COLLECTIONS.VENDORS).findOne(
      { _id: new ObjectId(vendorId) },
      { projection: { subscriptionPlan: 1, paid: 1 } }
    );
    if (!hasSilverAccess(vendor || {})) {
      return res.status(403).json({ message: 'Upgrade to Silver plan to access Profile Views growth.' });
    }
    const days = Math.min(30, Math.max(7, Number(req.query.days) || 14));

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const totalBeforeStart = await database.collection(COLLECTIONS.PROFILE_VIEWS).countDocuments({
      vendorId,
      createdAt: { $lt: start }
    });

    const grouped = await database
      .collection(COLLECTIONS.PROFILE_VIEWS)
      .aggregate([
        {
          $match: {
            vendorId,
            createdAt: { $gte: start }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
      .toArray();

    const groupedMap = new Map(grouped.map((item) => [item._id, Number(item.count || 0)]));
    const points = [];
    let running = totalBeforeStart;

    for (let index = 0; index < days; index += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const key = day.toISOString().slice(0, 10);
      const added = groupedMap.get(key) || 0;
      running += added;
      points.push({
        date: key,
        label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: running,
        added
      });
    }

    return res.status(200).json({ days, points });
  } catch (error) {
    return next(error);
  }
}

async function registerIndustry(req, res, next) {
  try {
    const database = getDB();
    const industryName = sanitizeString(req.body.industryName);
    const location = sanitizeString(req.body.location);
    const contactName = sanitizeString(req.body.contactName);
    const contactPhone = sanitizeString(req.body.contactPhone);
    const email = sanitizeString(req.body.email).toLowerCase();
    const password = String(req.body.password || '');

    if (!industryName || !location || !contactName || !contactPhone || !email || !password) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    if (!isValidPhone(contactPhone)) {
      return res.status(400).json({ message: 'Invalid phone number format.' });
    }

    const exists = await database.collection(COLLECTIONS.INDUSTRIES).findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'Industry account already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await database.collection(COLLECTIONS.INDUSTRIES).insertOne({
      industryName,
      location,
      contactName,
      contactPhone,
      email,
      password: hashedPassword,
      role: 'user',
      accountType: 'industry',
      shortlistedVendors: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const token = signToken({
      id: result.insertedId.toString(),
      role: 'user',
      email
    });

    return res.status(201).json({
      message: 'Industry registered successfully.',
      token,
      tokenKey: 'userToken',
      profile: {
        id: result.insertedId,
        industryName,
        email
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function postRequirement(req, res, next) {
  try {
    const database = getDB();
    const industryName = sanitizeString(req.body.industryName);
    const location = sanitizeString(req.body.location);
    const requirementCategory = sanitizeString(req.body.requirementCategory);
    const projectDescription = sanitizeString(req.body.projectDescription);
    const contactDetails = sanitizeString(req.body.contactDetails);
    const budgetRange = sanitizeString(req.body.budgetRange);
    const deadline = sanitizeString(req.body.deadline);

    if (!industryName || !location || !requirementCategory || !projectDescription || !contactDetails) {
      return res.status(400).json({ message: 'Please fill required requirement fields.' });
    }

    const result = await database.collection(COLLECTIONS.REQUIREMENTS).insertOne({
      industryId: req.auth.id,
      industryName,
      location,
      requirementCategory,
      projectDescription,
      contactDetails,
      budgetRange: budgetRange || null,
      deadline: deadline || null,
      responses: [],
      savedByVendors: [],
      likedByVendors: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return res.status(201).json({
      message: 'Requirement posted successfully.',
      requirementId: result.insertedId
    });
  } catch (error) {
    return next(error);
  }
}

async function getIndustryRequirements(req, res, next) {
  try {
    const database = getDB();
    const requirements = await database
      .collection(COLLECTIONS.REQUIREMENTS)
      .find({ industryId: req.auth.id })
      .sort({ createdAt: -1 })
      .toArray();
    return res.status(200).json(requirements);
  } catch (error) {
    return next(error);
  }
}

async function updateIndustryRequirement(req, res, next) {
  try {
    const database = getDB();
    const requirementId = sanitizeString(req.params.requirementId || req.body.requirementId);
    const industryName = sanitizeString(req.body.industryName);
    const location = sanitizeString(req.body.location);
    const requirementCategory = sanitizeString(req.body.requirementCategory);
    const projectDescription = sanitizeString(req.body.projectDescription);
    const contactDetails = sanitizeString(req.body.contactDetails);

    if (!ObjectId.isValid(requirementId)) {
      return res.status(400).json({ message: 'Invalid requirement id.' });
    }

    if (!industryName || !location || !requirementCategory || !projectDescription || !contactDetails) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }

    const result = await database.collection(COLLECTIONS.REQUIREMENTS).updateOne(
      { _id: new ObjectId(requirementId), industryId: req.auth.id },
      {
        $set: {
          industryName,
          location,
          requirementCategory,
          projectDescription,
          contactDetails,
          updatedAt: new Date()
        }
      }
    );

    if (!result.matchedCount) {
      return res.status(404).json({ message: 'Requirement not found or not owned by you.' });
    }

    return res.status(200).json({ message: 'Requirement updated successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function deleteIndustryRequirement(req, res, next) {
  try {
    const database = getDB();
    const requirementId = sanitizeString(req.params.requirementId || req.body.requirementId);

    if (!ObjectId.isValid(requirementId)) {
      return res.status(400).json({ message: 'Invalid requirement id.' });
    }

    const result = await database.collection(COLLECTIONS.REQUIREMENTS).deleteOne({
      _id: new ObjectId(requirementId),
      industryId: req.auth.id
    });

    if (!result.deletedCount) {
      return res.status(404).json({ message: 'Requirement not found or not owned by you.' });
    }

    return res.status(200).json({ message: 'Requirement deleted successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function getIndustryResponseFeed(req, res, next) {
  try {
    const database = getDB();
    const requirements = await database
      .collection(COLLECTIONS.REQUIREMENTS)
      .find({ industryId: req.auth.id }, { projection: { requirementCategory: 1, projectDescription: 1, responses: 1 } })
      .sort({ createdAt: -1 })
      .toArray();

    const responseRows = requirements.flatMap((requirement) =>
      (Array.isArray(requirement.responses) ? requirement.responses : []).map((response) => ({
        requirementId: requirement._id.toString(),
        requirementCategory: requirement.requirementCategory || '',
        projectDescription: requirement.projectDescription || '',
        vendorId: response.vendorId || '',
        message: response.message || '',
        quotation: response.quotation || '',
        respondedAt: response.createdAt || null
      }))
    );

    const vendorObjectIds = responseRows
      .map((item) => item.vendorId)
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const vendorRows = vendorObjectIds.length
      ? await database
          .collection(COLLECTIONS.VENDORS)
          .find(
            { _id: { $in: vendorObjectIds } },
            { projection: { companyName: 1, companyLogo: 1, verified: 1, mobileNumber: 1, whatsappNumber: 1 } }
          )
          .toArray()
      : [];

    const vendorMap = new Map(vendorRows.map((vendor) => [vendor._id.toString(), vendor]));
    const feed = responseRows
      .map((item) => ({
        ...item,
        vendorProfile: vendorMap.get(String(item.vendorId)) || null
      }))
      .sort((a, b) => new Date(b.respondedAt || 0) - new Date(a.respondedAt || 0));

    return res.status(200).json(feed);
  } catch (error) {
    return next(error);
  }
}

async function shortlistVendor(req, res, next) {
  try {
    const database = getDB();
    const industryId = req.auth.id;
    const vendorId = sanitizeString(req.body.vendorId);

    if (!ObjectId.isValid(vendorId)) {
      return res.status(400).json({ message: 'Invalid vendor id.' });
    }

    await database.collection(COLLECTIONS.INDUSTRIES).updateOne(
      { _id: new ObjectId(industryId) },
      {
        $addToSet: { shortlistedVendors: vendorId },
        $set: { updatedAt: new Date() }
      }
    );

    return res.status(200).json({ message: 'Vendor shortlisted successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function listRequirements(req, res, next) {
  try {
    const database = getDB();
    const { category, location, search } = req.query;

    const filter = {};
    if (category) filter.requirementCategory = category;
    if (location) filter.location = { $regex: location, $options: 'i' };

    if (search) {
      filter.$or = [
        { industryName: { $regex: search, $options: 'i' } },
        { requirementCategory: { $regex: search, $options: 'i' } },
        { projectDescription: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const requirements = await database.collection(COLLECTIONS.REQUIREMENTS).find(filter).sort({ createdAt: -1 }).toArray();
    return res.status(200).json(requirements);
  } catch (error) {
    return next(error);
  }
}

async function respondToRequirement(req, res, next) {
  try {
    const database = getDB();
    const requirementId = sanitizeString(req.body.requirementId);
    const message = sanitizeString(req.body.message);
    const quotation = sanitizeString(req.body.quotation);

    if (!ObjectId.isValid(requirementId) || !message) {
      return res.status(400).json({ message: 'Valid requirementId and message are required.' });
    }

    const requirementObjectId = new ObjectId(requirementId);
    const existing = await database.collection(COLLECTIONS.REQUIREMENTS).findOne(
      { _id: requirementObjectId, 'responses.vendorId': req.auth.id },
      { projection: { _id: 1 } }
    );

    if (existing) {
      await database.collection(COLLECTIONS.REQUIREMENTS).updateOne(
        { _id: requirementObjectId, 'responses.vendorId': req.auth.id },
        {
          $set: {
            'responses.$.message': message,
            'responses.$.quotation': quotation,
            'responses.$.updatedAt': new Date(),
            updatedAt: new Date()
          }
        }
      );
    } else {
      await database.collection(COLLECTIONS.REQUIREMENTS).updateOne(
        { _id: requirementObjectId },
        {
          $push: {
            responses: {
              vendorId: req.auth.id,
              message,
              quotation,
              createdAt: new Date()
            }
          },
          $set: { updatedAt: new Date() }
        }
      );
    }

    return res.status(200).json({ message: 'Response submitted successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function saveRequirement(req, res, next) {
  try {
    const database = getDB();
    const requirementId = sanitizeString(req.body.requirementId);

    if (!ObjectId.isValid(requirementId)) {
      return res.status(400).json({ message: 'Invalid requirement id.' });
    }

    await database.collection(COLLECTIONS.REQUIREMENTS).updateOne(
      { _id: new ObjectId(requirementId) },
      {
        $addToSet: { savedByVendors: req.auth.id },
        $set: { updatedAt: new Date() }
      }
    );

    return res.status(200).json({ message: 'Requirement saved successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function likeRequirement(req, res, next) {
  try {
    const database = getDB();
    const requirementId = sanitizeString(req.body.requirementId);
    const liked = Boolean(req.body.liked);
    const vendorId = req.auth.id;

    if (!ObjectId.isValid(requirementId)) {
      return res.status(400).json({ message: 'Invalid requirement id.' });
    }

    await database.collection(COLLECTIONS.REQUIREMENTS).updateOne(
      { _id: new ObjectId(requirementId) },
      liked
        ? {
            $addToSet: { likedByVendors: vendorId },
            $set: { updatedAt: new Date() }
          }
        : {
            $pull: { likedByVendors: vendorId },
            $set: { updatedAt: new Date() }
          }
    );

    const requirement = await database.collection(COLLECTIONS.REQUIREMENTS).findOne(
      { _id: new ObjectId(requirementId) },
      { projection: { likedByVendors: 1 } }
    );

    return res.status(200).json({
      message: liked ? 'Requirement liked.' : 'Like removed.',
      likes: Array.isArray(requirement?.likedByVendors) ? requirement.likedByVendors.length : 0
    });
  } catch (error) {
    return next(error);
  }
}

async function createInquiry(req, res, next) {
  try {
    const database = getDB();
    const vendorId = sanitizeString(req.body.vendorId);
    const message = sanitizeString(req.body.message);
    const contactName = sanitizeString(req.body.contactName);
    const contactEmail = sanitizeString(req.body.contactEmail);
    const contactPhone = sanitizeString(req.body.contactPhone);

    if (!ObjectId.isValid(vendorId) || !message || !contactName) {
      return res.status(400).json({ message: 'vendorId, contactName and message are required.' });
    }

    const inquiry = {
      vendorId,
      industryId: req.auth?.id || null,
      sourceRole: req.auth?.role || 'public',
      message,
      contactName,
      contactEmail,
      contactPhone,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await database.collection(COLLECTIONS.INQUIRIES).insertOne(inquiry);

    return res.status(201).json({
      message: 'Inquiry sent successfully.',
      inquiryId: result.insertedId
    });
  } catch (error) {
    return next(error);
  }
}

async function listInquiries(req, res, next) {
  try {
    const database = getDB();
    const role = req.auth.role;

    let filter = {};
    if (role === 'vendor') filter = { vendorId: req.auth.id };
    if (role === 'user') filter = { industryId: req.auth.id };

    const inquiries = await database.collection(COLLECTIONS.INQUIRIES).find(filter).sort({ createdAt: -1 }).toArray();

    if (role === 'user' && inquiries.length) {
      const vendorObjectIds = inquiries
        .map((item) => item.vendorId)
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));

      const vendorRows = vendorObjectIds.length
        ? await database
            .collection(COLLECTIONS.VENDORS)
            .find({ _id: { $in: vendorObjectIds } }, { projection: { companyName: 1, companyLogo: 1, verified: 1 } })
            .toArray()
        : [];

      const vendorMap = new Map(vendorRows.map((vendor) => [vendor._id.toString(), vendor]));
      const enriched = inquiries.map((item) => ({
        ...item,
        vendorProfile: vendorMap.get(String(item.vendorId)) || null
      }));
      return res.status(200).json(enriched);
    }

    return res.status(200).json(inquiries);
  } catch (error) {
    return next(error);
  }
}

async function replyToInquiry(req, res, next) {
  try {
    const database = getDB();
    const inquiryId = sanitizeString(req.body.inquiryId);
    const message = sanitizeString(req.body.message);
    const vendorId = req.auth.id;

    if (!ObjectId.isValid(inquiryId) || !message) {
      return res.status(400).json({ message: 'Valid inquiryId and message are required.' });
    }

    const result = await database.collection(COLLECTIONS.INQUIRIES).updateOne(
      { _id: new ObjectId(inquiryId), vendorId },
      {
        $set: {
          vendorReply: {
            vendorId,
            message,
            repliedAt: new Date()
          },
          status: 'responded',
          updatedAt: new Date()
        }
      }
    );

    if (!result.matchedCount) {
      return res.status(404).json({ message: 'Inquiry not found for this vendor.' });
    }

    return res.status(200).json({ message: 'Reply submitted successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function submitVendorRating(req, res, next) {
  try {
    const database = getDB();
    const vendorId = sanitizeString(req.body.vendorId);
    const userId = req.auth.id;
    const rating = Number(req.body.rating);

    if (!ObjectId.isValid(vendorId)) {
      return res.status(400).json({ message: 'Invalid vendor id.' });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const now = new Date();
    await database.collection(COLLECTIONS.VENDOR_RATINGS).updateOne(
      { vendorId, userId },
      {
        $set: {
          vendorId,
          userId,
          rating,
          updatedAt: now
        },
        $setOnInsert: { createdAt: now }
      },
      { upsert: true }
    );

    const allRatings = await database
      .collection(COLLECTIONS.VENDOR_RATINGS)
      .find({ vendorId }, { projection: { userId: 1, rating: 1, updatedAt: 1 } })
      .toArray();

    const totalReviews = allRatings.length;
    const averageRating = totalReviews
      ? Number((allRatings.reduce((sum, item) => sum + Number(item.rating || 0), 0) / totalReviews).toFixed(1))
      : 0;

    await database.collection(COLLECTIONS.VENDORS).updateOne(
      { _id: new ObjectId(vendorId) },
      {
        $set: {
          rating: averageRating,
          totalReviews,
          reviews: allRatings.map((item) => ({
            userId: item.userId,
            rating: Number(item.rating || 0),
            updatedAt: item.updatedAt || now
          })),
          updatedAt: now
        }
      }
    );

    return res.status(200).json({
      message: 'Rating saved successfully.',
      rating,
      totalReviews,
      averageRating
    });
  } catch (error) {
    return next(error);
  }
}

const PLAN_CONFIG = {
  'Free Vendor Listing': { amount: 0, label: 'Visibility' },
  'Verified Vendor': { amount: 999, label: 'Silver' },
  'Premium Vendor': { amount: 4999, label: 'Growth' }
};

async function applyVendorSubscription(database, vendorId, plan, paymentMeta = {}) {
  const planData = PLAN_CONFIG[plan];
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);

  await database.collection(COLLECTIONS.SUBSCRIPTIONS).insertOne({
    vendorId,
    plan,
    amount: planData.amount,
    label: planData.label,
    status: paymentMeta.status || 'active',
    paymentId: paymentMeta.paymentId || null,
    orderId: paymentMeta.orderId || null,
    startDate,
    endDate,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await database.collection(COLLECTIONS.VENDORS).updateOne(
    { _id: new ObjectId(vendorId) },
    {
      $set: {
        subscriptionPlan: plan,
        planLabel: planData.label,
        premium: plan === 'Premium Vendor',
        verified: plan === 'Verified Vendor' || plan === 'Premium Vendor',
        paid: plan === 'Verified Vendor' ? 'Silver' : plan === 'Premium Vendor' ? 'Gold' : 'None',
        updatedAt: new Date()
      }
    }
  );
}

async function upgradeSubscription(req, res, next) {
  try {
    const database = getDB();
    const vendorId = req.auth.id;
    const plan = sanitizeString(req.body.plan);

    if (!PLAN_CONFIG[plan]) {
      return res.status(400).json({ message: 'Invalid plan selected.' });
    }

    const planData = PLAN_CONFIG[plan];
    if (planData.amount > 0) {
      return res.status(400).json({ message: 'Paid plans require successful payment verification.' });
    }

    await applyVendorSubscription(database, vendorId, plan, { status: 'active' });

    return res.status(200).json({
      message: 'Subscription updated successfully.',
      plan,
      label: planData.label,
      amount: planData.amount
    });
  } catch (error) {
    return next(error);
  }
}

const razorpay =
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET
      })
    : null;

async function createOrder(req, res, next) {
  try {
    const database = getDB();
    const vendorId = req.auth.id;
    const plan = sanitizeString(req.body.plan);

    if (!PLAN_CONFIG[plan]) {
      return res.status(400).json({ message: 'Invalid plan selected.' });
    }

    if (!razorpay) {
      return res.status(500).json({
        message: 'Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.'
      });
    }

    const amount = PLAN_CONFIG[plan].amount;
    if (amount <= 0) {
      return res.status(400).json({ message: 'No payment required for free plan.' });
    }
    const receipt = `vv_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt,
      notes: { vendorId, plan }
    });

    await database.collection(COLLECTIONS.PAYMENTS).insertOne({
      vendorId,
      plan,
      amount,
      currency: 'INR',
      receipt,
      razorpayOrderId: order.id,
      status: 'created',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return res.status(201).json({
      message: 'Payment order created successfully.',
      order,
      keyId: env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    return next(error);
  }
}

async function verifyPayment(req, res, next) {
  try {
    const database = getDB();
    const vendorId = req.auth.id;
    const razorpayOrderId = sanitizeString(req.body.razorpay_order_id);
    const razorpayPaymentId = sanitizeString(req.body.razorpay_payment_id);
    const razorpaySignature = sanitizeString(req.body.razorpay_signature);
    const plan = sanitizeString(req.body.plan);

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !PLAN_CONFIG[plan]) {
      return res.status(400).json({ message: 'Missing payment verification fields.' });
    }

    if (!env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: 'Razorpay secret is not configured.' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment signature verification failed.' });
    }

    const paymentRecord = await database.collection(COLLECTIONS.PAYMENTS).findOne({ razorpayOrderId, vendorId, plan });
    if (!paymentRecord) {
      return res.status(404).json({ message: 'Payment order not found.' });
    }

    await database.collection(COLLECTIONS.PAYMENTS).updateOne(
      { _id: paymentRecord._id },
      {
        $set: {
          status: 'paid',
          razorpayPaymentId,
          razorpaySignature,
          updatedAt: new Date()
        }
      }
    );

    await applyVendorSubscription(database, vendorId, plan, {
      status: 'active',
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId
    });

    return res.status(200).json({
      message: 'Payment verified and subscription activated.',
      paid: plan === 'Verified Vendor' ? 'Silver' : plan === 'Premium Vendor' ? 'Gold' : 'None',
      plan
    });
  } catch (error) {
    return next(error);
  }
}

async function adminLogin(req, res, next) {
  try {
    const adminId = sanitizeString(req.body.adminId);
    const password = String(req.body.password || '');

    if (adminId !== env.ADMIN_ID || password !== env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid admin credentials.' });
    }

    const token = signToken({ id: env.ADMIN_ID, role: 'admin', email: env.ADMIN_ID });
    return res.status(200).json({
      message: 'Admin login successful.',
      token,
      tokenKey: 'adminToken',
      role: 'admin'
    });
  } catch (error) {
    return next(error);
  }
}

async function getPendingVendors(req, res, next) {
  try {
    const database = getDB();
    const vendors = await database.collection(COLLECTIONS.VENDORS).find({ approved: false }).sort({ createdAt: -1 }).toArray();
    return res.status(200).json(vendors);
  } catch (error) {
    return next(error);
  }
}

async function approveVendor(req, res, next) {
  try {
    const database = getDB();
    const vendorId = sanitizeString(req.body.vendorId);
    if (!ObjectId.isValid(vendorId)) {
      return res.status(400).json({ message: 'Invalid vendor id.' });
    }

    await database.collection(COLLECTIONS.VENDORS).updateOne(
      { _id: new ObjectId(vendorId) },
      {
        $set: {
          approved: true,
          approvedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    await database.collection(COLLECTIONS.ADMIN_LOGS).insertOne({
      action: 'approve_vendor',
      vendorId,
      adminId: req.auth.id,
      createdAt: new Date()
    });

    return res.status(200).json({ message: 'Vendor approved successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function rejectVendor(req, res, next) {
  try {
    const database = getDB();
    const vendorId = sanitizeString(req.body.vendorId);

    if (!ObjectId.isValid(vendorId)) {
      return res.status(400).json({ message: 'Invalid vendor id.' });
    }

    const vendorObjectId = new ObjectId(vendorId);
    const vendor = await database.collection(COLLECTIONS.VENDORS).findOne({ _id: vendorObjectId });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }

    removeUploadFileByPath(vendor.companyLogo);
    (vendor.documents || []).forEach(removeUploadFileByPath);
    (vendor.certificates || []).forEach(removeUploadFileByPath);

    await Promise.all([
      database.collection(COLLECTIONS.VENDORS).deleteOne({ _id: vendorObjectId }),
      database.collection(COLLECTIONS.VENDOR_SERVICES).deleteMany({ vendorId }),
      database.collection(COLLECTIONS.SUBSCRIPTIONS).deleteMany({ vendorId }),
      database.collection(COLLECTIONS.PAYMENTS).deleteMany({ vendorId }),
      database.collection(COLLECTIONS.INQUIRIES).deleteMany({ vendorId }),
      database.collection(COLLECTIONS.VENDOR_RATINGS).deleteMany({ vendorId }),
      database.collection(COLLECTIONS.FEATURED_LISTINGS).deleteMany({ vendorId })
    ]);

    await database.collection(COLLECTIONS.ADMIN_LOGS).insertOne({
      action: 'reject_vendor',
      vendorId,
      adminId: req.auth.id,
      createdAt: new Date()
    });

    return res.status(200).json({ message: 'Vendor rejected and deleted successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function verifyVendor(req, res, next) {
  try {
    const database = getDB();
    const vendorId = sanitizeString(req.body.vendorId);
    const verified = Boolean(req.body.verified);

    if (!ObjectId.isValid(vendorId)) {
      return res.status(400).json({ message: 'Invalid vendor id.' });
    }

    await database.collection(COLLECTIONS.VENDORS).updateOne(
      { _id: new ObjectId(vendorId) },
      {
        $set: {
          verified,
          updatedAt: new Date()
        }
      }
    );

    await database.collection(COLLECTIONS.ADMIN_LOGS).insertOne({
      action: verified ? 'verify_vendor' : 'unverify_vendor',
      vendorId,
      adminId: req.auth.id,
      createdAt: new Date()
    });

    return res.status(200).json({ message: `Vendor ${verified ? 'verified' : 'unverified'} successfully.` });
  } catch (error) {
    return next(error);
  }
}

async function manageCategories(req, res, next) {
  try {
    const database = getDB();
    console.log('=== MANAGE CATEGORIES API ===');
    console.log('Request method:', req.method);
    console.log('Request body:', req.body);
    
    if (req.method === 'GET') {
      console.log('Loading categories from database...');
      const record = await database.collection(COLLECTIONS.VENDOR_CATEGORIES).findOne({ title: 'default-categories' });
      console.log('Categories from database:', record);
      return res.status(200).json(record?.categories || []);
    }

    const categories = Array.isArray(req.body.categories) ? req.body.categories : [];
    console.log('Categories to save:', categories);
    
    if (!categories.length) {
      console.log('No categories provided');
      return res.status(400).json({ message: 'categories array is required.' });
    }

    console.log('Updating database...');
    const result = await database.collection(COLLECTIONS.VENDOR_CATEGORIES).updateOne(
      { title: 'default-categories' },
      {
        $set: {
          categories,
          updatedAt: new Date()
        },
        $setOnInsert: {
          title: 'default-categories',
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    console.log('Database update result:', result);

    // Verify the update
    const updatedRecord = await database.collection(COLLECTIONS.VENDOR_CATEGORIES).findOne({ title: 'default-categories' });
    console.log('Updated record verification:', updatedRecord);

    await database.collection(COLLECTIONS.ADMIN_LOGS).insertOne({
      action: 'update_categories',
      categoryCount: categories.length,
      adminId: req.auth.id,
      createdAt: new Date()
    });

    console.log('Categories updated successfully');
    return res.status(200).json({ message: 'Categories updated successfully.', categories });
  } catch (error) {
    console.log('Error in manageCategories:', error);
    return next(error);
  }
}

async function getVendorListingSettings(req, res, next) {
  try {
    const database = getDB();
    const vendorId = req.auth.id;
    await enforceVendorSubscriptionExpiry(database, vendorId);
    const vendor = await database.collection(COLLECTIONS.VENDORS).findOne(
      { _id: new ObjectId(vendorId) },
      { projection: { category: 1, categories: 1, subscriptionPlan: 1 } }
    );

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }
    if (!hasSilverAccess(vendor)) {
      return res.status(403).json({ message: 'Upgrade to Silver plan to manage Listings.' });
    }

    const record = await database.collection(COLLECTIONS.VENDOR_CATEGORIES).findOne({ title: 'default-categories' });
    const availableCategories = Array.isArray(record?.categories) ? record.categories : [];
    const selectedCategories = Array.from(
      new Set(
        (Array.isArray(vendor.categories) ? vendor.categories : [])
          .concat(vendor.category ? [vendor.category] : [])
          .map((item) => sanitizeString(item))
          .filter(Boolean)
      )
    ).slice(0, 4);
    const primaryCategory = selectedCategories.includes(vendor.category) ? vendor.category : selectedCategories[0] || '';

    return res.status(200).json({
      availableCategories,
      selectedCategories,
      primaryCategory,
      maxCategories: 4,
      plan: vendor.subscriptionPlan || 'Free Vendor Listing'
    });
  } catch (error) {
    return next(error);
  }
}

async function updateVendorListingSettings(req, res, next) {
  try {
    const database = getDB();
    const vendorId = req.auth.id;
    await enforceVendorSubscriptionExpiry(database, vendorId);
    const vendor = await database.collection(COLLECTIONS.VENDORS).findOne(
      { _id: new ObjectId(vendorId) },
      { projection: { subscriptionPlan: 1, paid: 1 } }
    );
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }
    if (!hasSilverAccess(vendor)) {
      return res.status(403).json({ message: 'Upgrade to Silver plan to manage Listings.' });
    }
    const maxCategories = 4;
    const incoming = Array.isArray(req.body.categories) ? req.body.categories : [];
    const selectedCategories = Array.from(new Set(incoming.map((item) => sanitizeString(item)).filter(Boolean)));

    if (!selectedCategories.length) {
      return res.status(400).json({ message: 'Select at least one category.' });
    }

    if (selectedCategories.length > maxCategories) {
      return res.status(400).json({ message: `You can select up to ${maxCategories} categories.` });
    }

    const record = await database.collection(COLLECTIONS.VENDOR_CATEGORIES).findOne({ title: 'default-categories' });
    const availableCategories = Array.isArray(record?.categories) ? record.categories : [];
    const validSet = new Set(availableCategories.map((item) => sanitizeString(item)));
    const invalid = selectedCategories.find((item) => !validSet.has(item));
    if (invalid) {
      return res.status(400).json({ message: `Invalid category selected: ${invalid}` });
    }

    const incomingPrimary = sanitizeString(req.body.primaryCategory);
    const primaryCategory = selectedCategories.includes(incomingPrimary) ? incomingPrimary : selectedCategories[0];

    await database.collection(COLLECTIONS.VENDORS).updateOne(
      { _id: new ObjectId(vendorId) },
      {
        $set: {
          categories: selectedCategories,
          category: primaryCategory,
          updatedAt: new Date()
        }
      }
    );

    await database.collection(COLLECTIONS.VENDOR_SERVICES).updateOne(
      { vendorId },
      {
        $set: {
          vendorId,
          category: primaryCategory,
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    return res.status(200).json({
      message: 'Listing categories updated successfully.',
      selectedCategories,
      primaryCategory
    });
  } catch (error) {
    return next(error);
  }
}

async function manageIndustryCategories(req, res, next) {
  try {
    const database = getDB();
    if (req.method === 'GET') {
      const record = await database.collection(COLLECTIONS.INDUSTRY_CATEGORIES).findOne({ title: 'default-industry-categories' });
      return res.status(200).json(record?.categories || []);
    }

    const categories = Array.isArray(req.body.categories) ? req.body.categories : [];
    if (!categories.length) {
      return res.status(400).json({ message: 'categories array is required.' });
    }

    await database.collection(COLLECTIONS.INDUSTRY_CATEGORIES).updateOne(
      { title: 'default-industry-categories' },
      {
        $set: {
          categories,
          updatedAt: new Date()
        },
        $setOnInsert: {
          title: 'default-industry-categories',
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    await database.collection(COLLECTIONS.ADMIN_LOGS).insertOne({
      action: 'update_industry_categories',
      categoryCount: categories.length,
      adminId: req.auth.id,
      createdAt: new Date()
    });

    return res.status(200).json({ message: 'Industry categories updated successfully.', categories });
  } catch (error) {
    return next(error);
  }
}

async function getVendorCategoriesPublic(req, res, next) {
  try {
    const database = getDB();
    const record = await database.collection(COLLECTIONS.VENDOR_CATEGORIES).findOne({ title: 'default-categories' });
    return res.status(200).json(record?.categories || []);
  } catch (error) {
    return next(error);
  }
}

async function getIndustryCategoriesPublic(req, res, next) {
  try {
    const database = getDB();
    const record = await database
      .collection(COLLECTIONS.INDUSTRY_CATEGORIES)
      .findOne({ title: 'default-industry-categories' });
    return res.status(200).json(record?.categories || []);
  } catch (error) {
    return next(error);
  }
}

async function getAdminRequirements(req, res, next) {
  try {
    const database = getDB();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const requirements = await database
      .collection(COLLECTIONS.REQUIREMENTS)
      .find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    const totalRequirements = await database.collection(COLLECTIONS.REQUIREMENTS).countDocuments();
    const totalPages = Math.ceil(totalRequirements / limit);

    return res.status(200).json({
      requirements,
      currentPage: page,
      totalPages,
      totalRequirements
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteAdminRequirement(req, res, next) {
  try {
    const database = getDB();
    const requirementId = req.params.requirementId;

    if (!ObjectId.isValid(requirementId)) {
      return res.status(400).json({ message: 'Invalid requirement id.' });
    }

    const result = await database.collection(COLLECTIONS.REQUIREMENTS).deleteOne({
      _id: new ObjectId(requirementId)
    });

    if (!result.deletedCount) {
      return res.status(404).json({ message: 'Requirement not found.' });
    }

    return res.status(200).json({ message: 'Requirement deleted successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function getAdminStats(req, res, next) {
  try {
    const database = getDB();

    const subscriptionStats = await database
      .collection(COLLECTIONS.VENDORS)
      .aggregate([
        {
          $group: {
            _id: '$subscriptionPlan',
            count: { $sum: 1 }
          }
        }
      ])
      .toArray();

    const [totals] = await database
      .collection(COLLECTIONS.VENDORS)
      .aggregate([
        {
          $group: {
            _id: null,
            totalVendors: { $sum: 1 },
            approvedVendors: { $sum: { $cond: ['$approved', 1, 0] } },
            verifiedVendors: { $sum: { $cond: ['$verified', 1, 0] } },
            premiumVendors: { $sum: { $cond: [{ $in: ['$subscriptionPlan', ['Premium Vendor', 'Verified Vendor']] }, 1, 0] } }
          }
        }
      ])
      .toArray();

    const [inquiryStats] = await database
      .collection(COLLECTIONS.INQUIRIES)
      .aggregate([
        {
          $group: {
            _id: null,
            totalInquiries: { $sum: 1 },
            openInquiries: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } }
          }
        }
      ])
      .toArray();

    const industryCount = await database.collection(COLLECTIONS.USERS).countDocuments();
    const requirementCount = await database.collection(COLLECTIONS.REQUIREMENTS).countDocuments();

    console.log('Vendor Analytics Response:', {
      vendors: totals || { totalVendors: 0, approvedVendors: 0, verifiedVendors: 0, premiumVendors: 0 },
      inquiries: inquiryStats || { totalInquiries: 0, openInquiries: 0 },
      subscriptions: subscriptionStats,
      requirements: requirementCount,
      industries: industryCount
    });

    return res.status(200).json({
      vendors: totals || { totalVendors: 0, approvedVendors: 0, verifiedVendors: 0, premiumVendors: 0 },
      inquiries: inquiryStats || { totalInquiries: 0, openInquiries: 0 },
      subscriptions: subscriptionStats,
      requirements: requirementCount,
      industries: industryCount
    });
  } catch (error) {
    return next(error);
  }
}

async function getAdminPaidVendors(req, res, next) {
  try {
    const database = getDB();
    const now = new Date();
    const paidPlans = ['Verified Vendor', 'Premium Vendor'];

    const activePaidSubscriptions = await database
      .collection(COLLECTIONS.SUBSCRIPTIONS)
      .find({
        status: 'active',
        plan: { $in: paidPlans },
        endDate: { $gte: now }
      })
      .sort({ endDate: -1, updatedAt: -1, createdAt: -1 })
      .toArray();

    const latestByVendor = new Map();
    for (const subscription of activePaidSubscriptions) {
      const vendorId = sanitizeString(subscription.vendorId);
      if (!vendorId || latestByVendor.has(vendorId)) continue;
      latestByVendor.set(vendorId, subscription);
    }

    const vendorIds = Array.from(latestByVendor.keys()).filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
    if (!vendorIds.length) {
      return res.status(200).json([]);
    }

    const vendors = await database
      .collection(COLLECTIONS.VENDORS)
      .find(
        { _id: { $in: vendorIds } },
        {
          projection: {
            companyName: 1,
            email: 1,
            mobileNumber: 1,
            category: 1,
            cityState: 1,
            location: 1,
            logo: 1,
            paid: 1,
            subscriptionPlan: 1,
            suspended: 1
          }
        }
      )
      .toArray();

    const rows = vendors
      .map((vendor) => {
        const vendorId = String(vendor._id);
        const sub = latestByVendor.get(vendorId);
        if (!sub) return null;
        return {
          _id: vendorId,
          companyName: vendor.companyName || 'Unnamed Vendor',
          email: vendor.email || '',
          mobileNumber: vendor.mobileNumber || '',
          category: vendor.category || '',
          location: vendor.cityState || '',
          logo: vendor.logo || '',
          paid: vendor.paid || 'None',
          subscriptionPlan: vendor.subscriptionPlan || 'Free Vendor Listing',
          suspended: Boolean(vendor.suspended),
          activePlan: sub.plan || vendor.subscriptionPlan || '',
          startDate: sub.startDate || null,
          endDate: sub.endDate || null
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.endDate || 0).getTime() - new Date(a.endDate || 0).getTime());

    return res.status(200).json(rows);
  } catch (error) {
    return next(error);
  }
}

async function setVendorSubscriptionTierByAdmin(req, res, next) {
  try {
    const database = getDB();
    const vendorId = sanitizeString(req.body.vendorId);
    const tier = sanitizeString(req.body.tier || 'Free');

    if (!ObjectId.isValid(vendorId)) {
      return res.status(400).json({ message: 'Invalid vendor id.' });
    }

    const tierPlanMap = {
      Free: 'Free Vendor Listing',
      Silver: 'Verified Vendor',
      Gold: 'Premium Vendor'
    };
    const plan = tierPlanMap[tier];
    if (!plan) {
      return res.status(400).json({ message: 'Invalid tier. Use Free, Silver, or Gold.' });
    }

    const vendorObjectId = new ObjectId(vendorId);
    const vendor = await database.collection(COLLECTIONS.VENDORS).findOne({ _id: vendorObjectId }, { projection: { _id: 1 } });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }

    await database.collection(COLLECTIONS.SUBSCRIPTIONS).updateMany(
      { vendorId, status: 'active' },
      {
        $set: {
          status: 'cancelled',
          cancelledBy: 'admin',
          cancelledAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    await applyVendorSubscription(database, vendorId, plan, {
      status: 'active',
      paymentId: null,
      orderId: null
    });

    return res.status(200).json({
      message: `Vendor subscription set to ${tier} instantly.`,
      vendorId,
      tier,
      plan
    });
  } catch (error) {
    return next(error);
  }
}

async function toggleFeaturedVendor(req, res, next) {
  try {
    const database = getDB();
    const vendorId = sanitizeString(req.body.vendorId);
    const featured = Boolean(req.body.featured);

    if (!ObjectId.isValid(vendorId)) {
      return res.status(400).json({ message: 'Invalid vendor id.' });
    }

    await database.collection(COLLECTIONS.VENDORS).updateOne(
      { _id: new ObjectId(vendorId) },
      {
        $set: {
          featured,
          updatedAt: new Date()
        }
      }
    );

    await database.collection(COLLECTIONS.FEATURED_LISTINGS).updateOne(
      { vendorId },
      {
        $set: {
          vendorId,
          featured,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    await database.collection(COLLECTIONS.ADMIN_LOGS).insertOne({
      action: featured ? 'feature_vendor' : 'unfeature_vendor',
      vendorId,
      adminId: req.auth.id,
      createdAt: new Date()
    });

    return res.status(200).json({ message: `Vendor ${featured ? 'featured' : 'unfeatured'} successfully.` });
  } catch (error) {
    return next(error);
  }
}

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    platform: 'VendorVault Gujarat',
    timestamp: new Date().toISOString()
  });
});

const authRoutes = express.Router();
authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/logout', logout);

const adminRoutes = express.Router();
adminRoutes.post('/login', adminLogin);
adminRoutes.get('/vendors/pending', requireAuth(['admin']), getPendingVendors);
adminRoutes.post('/vendors/approve', requireAuth(['admin']), approveVendor);
adminRoutes.post('/vendors/reject', requireAuth(['admin']), rejectVendor);
adminRoutes.post('/vendors/verify', requireAuth(['admin']), verifyVendor);
adminRoutes.post('/vendors/feature', requireAuth(['admin']), toggleFeaturedVendor);
adminRoutes.put('/vendors/update', requireAuth(['admin']), updateVendorByAdmin);
adminRoutes.get('/categories', requireAuth(['admin']), manageCategories);
adminRoutes.post('/categories', requireAuth(['admin']), manageCategories);
adminRoutes.get('/industry-categories', requireAuth(['admin']), manageIndustryCategories);
adminRoutes.post('/industry-categories', requireAuth(['admin']), manageIndustryCategories);
adminRoutes.get('/requirements', requireAuth(['admin']), getAdminRequirements);
adminRoutes.delete('/requirements/:requirementId', requireAuth(['admin']), deleteAdminRequirement);
adminRoutes.get('/stats', requireAuth(['admin']), getAdminStats);
adminRoutes.get('/vendors', requireAuth(['admin']), getVendors);
adminRoutes.get('/subscriptions/paid-vendors', requireAuth(['admin']), getAdminPaidVendors);
adminRoutes.post('/subscriptions/set-tier', requireAuth(['admin']), setVendorSubscriptionTierByAdmin);
adminRoutes.get('/users', requireAuth(['admin']), getUsers);
adminRoutes.put('/users/update', requireAuth(['admin']), updateUser);
adminRoutes.delete('/users/:userId', requireAuth(['admin']), deleteUser);

const vendorRoutes = express.Router();
vendorRoutes.post('/register', maybeHandleVendorUploads, registerVendor);
vendorRoutes.post('/login', (req, res, next) => {
  req.body.role = 'vendor';
  return login(req, res, next);
});
vendorRoutes.get('/categories', getVendorCategoriesPublic);
vendorRoutes.put('/update-profile', requireAuth(['vendor']), maybeHandleVendorUploads, updateVendorProfile);
vendorRoutes.get('/listings', getVendorListings);
vendorRoutes.get('/profile', getVendorProfile);
vendorRoutes.get('/me', requireAuth(['vendor']), getVendorSelfProfile);
vendorRoutes.get('/analytics', requireAuth(['vendor']), getVendorAnalytics);
vendorRoutes.get('/listing-categories', requireAuth(['vendor']), getVendorListingSettings);
vendorRoutes.put('/listing-categories', requireAuth(['vendor']), updateVendorListingSettings);
vendorRoutes.get('/profile-views', requireAuth(['vendor']), getVendorProfileViews);
vendorRoutes.get('/profile-views-growth', requireAuth(['vendor']), getVendorProfileViewsGrowth);
vendorRoutes.post('/rate', requireAuth(['user']), submitVendorRating);
vendorRoutes.post('/respond-requirement', requireAuth(['vendor']), respondToRequirement);
vendorRoutes.post('/save-requirement', requireAuth(['vendor']), saveRequirement);

const industryRoutes = express.Router();
industryRoutes.post('/register', registerIndustry);
industryRoutes.post('/login', (req, res, next) => {
  req.body.role = 'user';
  return login(req, res, next);
});
industryRoutes.post('/post-requirement', requireAuth(['user']), postRequirement);
industryRoutes.post('/shortlist-vendor', requireAuth(['user']), shortlistVendor);
industryRoutes.get('/my-requirements', requireAuth(['user']), getIndustryRequirements);
industryRoutes.put('/requirement/:requirementId', requireAuth(['user']), updateIndustryRequirement);
industryRoutes.delete('/requirement/:requirementId', requireAuth(['user']), deleteIndustryRequirement);
industryRoutes.get('/response-feed', requireAuth(['user']), getIndustryResponseFeed);

const requirementRoutes = express.Router();
requirementRoutes.get('/list', listRequirements);
requirementRoutes.get('/categories', getIndustryCategoriesPublic);
requirementRoutes.post('/like', requireAuth(['vendor']), likeRequirement);

const inquiryRoutes = express.Router();
inquiryRoutes.post('/create', requireAuth(['user', 'vendor']), createInquiry);
inquiryRoutes.get('/list', requireAuth(['user', 'vendor', 'admin']), listInquiries);
inquiryRoutes.post('/reply', requireAuth(['vendor']), replyToInquiry);

const subscriptionRoutes = express.Router();
subscriptionRoutes.post('/upgrade', requireAuth(['vendor']), upgradeSubscription);

const paymentRoutes = express.Router();
paymentRoutes.post('/create-order', requireAuth(['vendor']), createOrder);
paymentRoutes.post('/verify', requireAuth(['vendor']), verifyPayment);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/industry', industryRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);

app.use(errorHandler);

async function bootstrap() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`VendorVault Gujarat backend running on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await client.close();
  process.exit(0);
});
