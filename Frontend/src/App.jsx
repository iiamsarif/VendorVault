import React from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardShell from './components/DashboardShell';

import HomePage from './pages/HomePage';
import CategoriesPage from './pages/CategoriesPage';
import VendorDirectoryPage from './pages/VendorDirectoryPage';
import VendorProfilePage from './pages/VendorProfilePage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

import AdminLogin from './Admin/AdminLogin';
import AdminDashboard from './Admin/AdminDashboard';
import VendorApprovalPage from './Admin/VendorApprovalPage';
import CategoryManagement from './Admin/CategoryManagement';
import IndustryCategoryManagement from './Admin/IndustryCategoryManagement';
import ListingModeration from './Admin/ListingModeration';
import SubscriptionManagement from './Admin/SubscriptionManagement';
import RequirementManagement from './Admin/RequirementManagement';
import AnalyticsOverview from './Admin/AnalyticsOverview';
import FeaturedVendorManagement from './Admin/FeaturedVendorManagement';
import PlatformStatistics from './Admin/PlatformStatistics';

import VendorRegistration from './Vendor/VendorRegistration';
import VendorDashboard from './Vendor/VendorDashboard';
import EditProfile from './Vendor/EditProfile';
import AddServices from './Vendor/AddServices';
import UploadAssets from './Vendor/UploadAssets';
import ListingManagement from './Vendor/ListingManagement';
import ViewInquiries from './Vendor/ViewInquiries';
import TrackProfileViews from './Vendor/TrackProfileViews';
import SubscriptionUpgrade from './Vendor/SubscriptionUpgrade';
import RespondRequirements from './Vendor/RespondRequirements';
import LeadTracking from './Vendor/LeadTracking';

import IndustryDashboard from './User/IndustryDashboard';
import PostRequirement from './User/PostRequirement';
import ViewVendorDirectory from './User/ViewVendorDirectory';
import ShortlistVendors from './User/ShortlistVendors';
import SendInquiry from './User/SendInquiry';
import ViewResponses from './User/ViewResponses';
import UserRequirementsPage from './User/UserRequirementsPage';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', end: true, icon: 'fa-solid fa-table-cells-large' },
  { to: '/admin/vendors/approval', label: 'Vendor Approval', icon: 'fa-solid fa-user-check' },
  { to: '/admin/categories', label: 'Categories', icon: 'fa-solid fa-layer-group', badge: 'UI' },
  { to: '/admin/industry-categories', label: 'Industry Categories', icon: 'fa-solid fa-sitemap' },
  { to: '/admin/listings', label: 'Listing Moderation', icon: 'fa-solid fa-list' },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: 'fa-solid fa-credit-card' },
  { to: '/admin/requirements', label: 'Requirements', icon: 'fa-solid fa-file-circle-plus' },
  { to: '/admin/analytics', label: 'Analytics', icon: 'fa-solid fa-chart-line' },
  { to: '/admin/featured', label: 'Featured Vendors', icon: 'fa-solid fa-star' },
  { to: '/admin/platform-stats', label: 'Platform Statistics', icon: 'fa-solid fa-chart-pie' }
];

const vendorLinks = [
  { to: '/vendor/dashboard', label: 'Dashboard', end: true, icon: 'fa fa-home' },
  { to: '/vendor/dashboard/edit-profile', label: 'Edit Profile', icon: 'fa fa-user-pen' },
  { to: '/vendor/dashboard/add-services', label: 'Add Services', icon: 'fa fa-list-check', badge: '12' },
  { to: '/vendor/dashboard/upload-assets', label: 'Upload Assets', icon: 'fa fa-upload' },
  { to: '/vendor/dashboard/listings', label: 'Listings', icon: 'fa fa-layer-group' },
  { to: '/vendor/dashboard/inquiries', label: 'View Inquiries', icon: 'fa fa-envelope', badge: '08', badgeClass: 'yellow' },
  { to: '/vendor/dashboard/profile-views', label: 'Profile Views', icon: 'fa fa-eye' },
  { to: '/vendor/dashboard/subscription', label: 'Subscription', icon: 'fa fa-crown', badge: '02', badgeClass: 'orange' },
  { to: '/vendor/dashboard/respond-requirements', label: 'Respond Requirements', icon: 'fa fa-reply' },
  { to: '/vendor/dashboard/leads', label: 'Lead Tracking', icon: 'fa fa-chart-bar' }
];

const userLinks = [
  { to: '/user/dashboard', label: 'Dashboard', end: true },
  { to: '/requirements', label: 'My Requirements' },
  { to: '/user/dashboard/post-requirement', label: 'Post Requirement' },
  { to: '/user/dashboard/vendors', label: 'Vendor Directory' },
  { to: '/user/dashboard/shortlist', label: 'Shortlist Vendors' },
  { to: '/user/dashboard/send-inquiry', label: 'Send Inquiry' },
  { to: '/user/dashboard/responses', label: 'View Responses' }
];

function AdminLayout() {
  return (
    <ProtectedRoute role="admin">
      <DashboardShell role="admin" title="Admin Panel" links={adminLinks}>
        <Outlet />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function VendorLayout() {
  return (
    <ProtectedRoute role="vendor">
      <DashboardShell role="vendor" title="Vendor Panel" links={vendorLinks}>
        <Outlet />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function UserLayout() {
  return (
    <ProtectedRoute role="user">
      <DashboardShell role="user" title="Industry Panel" links={userLinks}>
        <Outlet />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/splash" element={<Navigate to="/" replace />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/vendors" element={<VendorDirectoryPage />} />
          <Route path="/vendors/:vendorId" element={<VendorProfilePage />} />
          <Route
            path="/pricing"
            element={(
              <ProtectedRoute role="vendor">
                <Navigate to="/vendor/dashboard/subscription" replace />
              </ProtectedRoute>
            )}
          />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route
            path="/requirements"
            element={(
              <ProtectedRoute role="user">
                <UserRequirementsPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/inquiries"
            element={(
              <ProtectedRoute role="user">
                <ViewResponses />
              </ProtectedRoute>
            )}
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="vendors/approval" element={<VendorApprovalPage />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="industry-categories" element={<IndustryCategoryManagement />} />
            <Route path="listings" element={<ListingModeration />} />
            <Route path="subscriptions" element={<SubscriptionManagement />} />
            <Route path="requirements" element={<RequirementManagement />} />
            <Route path="analytics" element={<AnalyticsOverview />} />
            <Route path="featured" element={<FeaturedVendorManagement />} />
            <Route path="platform-stats" element={<PlatformStatistics />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route path="/vendor/login" element={<Navigate to="/login" replace />} />
          <Route path="/vendor/register" element={<VendorRegistration />} />
          <Route path="/vendor/dashboard" element={<VendorLayout />}>
            <Route index element={<VendorDashboard />} />
            <Route path="edit-profile" element={<EditProfile />} />
            <Route path="add-services" element={<AddServices />} />
            <Route path="upload-assets" element={<UploadAssets />} />
            <Route path="listings" element={<ListingManagement />} />
            <Route path="inquiries" element={<ViewInquiries />} />
            <Route path="profile-views" element={<TrackProfileViews />} />
            <Route path="subscription" element={<SubscriptionUpgrade />} />
            <Route path="respond-requirements" element={<RespondRequirements />} />
            <Route path="leads" element={<LeadTracking />} />
          </Route>

          <Route path="/user/login" element={<Navigate to="/login" replace />} />
          <Route path="/user/register" element={<Navigate to="/register" replace />} />
          <Route path="/user/dashboard" element={<UserLayout />}>
            <Route index element={<IndustryDashboard />} />
            <Route path="post-requirement" element={<PostRequirement />} />
            <Route path="vendors" element={<ViewVendorDirectory />} />
            <Route path="shortlist" element={<ShortlistVendors />} />
            <Route path="send-inquiry" element={<SendInquiry />} />
            <Route path="responses" element={<Navigate to="/requirements" replace />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
