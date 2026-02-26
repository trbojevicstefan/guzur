import React, { lazy, Suspense, useEffect, useState } from 'react'
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from 'react-router-dom'
import env from '@/config/env.config'
import { NotificationProvider } from '@/context/NotificationContext'
import { UserProvider } from '@/context/UserContext'
import { RecaptchaProvider } from '@/context/RecaptchaContext'
import { PayPalProvider } from '@/context/PayPalContext'
import { init as initGA } from '@/utils/ga4'
import ScrollToTop from '@/components/ScrollToTop'
import NProgressIndicator from '@/components/NProgressIndicator'

if (env.GOOGLE_ANALYTICS_ENABLED) {
  initGA()
}

const Header = lazy(() => import('@/components/Header'))
const SignIn = lazy(() => import('@/pages/SignIn'))
const SignUp = lazy(() => import('@/pages/SignUp'))
const RoleSignUp = lazy(() => import('@/pages/RoleSignUp'))
const Activate = lazy(() => import('@/pages/Activate'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const Home = lazy(() => import('@/pages/Home'))
const Search = lazy(() => import('@/pages/Search'))
const Property = lazy(() => import('@/pages/Property'))
const Checkout = lazy(() => import('@/pages/Checkout'))
const CheckoutSession = lazy(() => import('@/pages/CheckoutSession'))
const Bookings = lazy(() => import('@/pages/Bookings'))
const Booking = lazy(() => import('@/pages/Booking'))
const Settings = lazy(() => import('@/pages/Settings'))
const Notifications = lazy(() => import('@/pages/Notifications'))
const ToS = lazy(() => import('@/pages/ToS'))
const About = lazy(() => import('@/pages/About'))
const ChangePassword = lazy(() => import('@/pages/ChangePassword'))
const Contact = lazy(() => import('@/pages/Contact'))
const Concierge = lazy(() => import('@/pages/Concierge'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const BrokerDashboard = lazy(() => import('@/pages/dashboards/BrokerDashboard'))
const DeveloperDashboard = lazy(() => import('@/pages/dashboards/DeveloperDashboard'))
const OwnerDashboard = lazy(() => import('@/pages/dashboards/OwnerDashboard'))
const MyListings = lazy(() => import('@/pages/dashboards/MyListings'))
const CreateListing = lazy(() => import('@/pages/dashboards/CreateListing'))
const UpdateListing = lazy(() => import('@/pages/dashboards/UpdateListing'))
const CreateDevelopment = lazy(() => import('@/pages/dashboards/CreateDevelopment'))
const Organization = lazy(() => import('@/pages/dashboards/Organization'))
const NoMatch = lazy(() => import('@/pages/NoMatch'))
const Agencies = lazy(() => import('@/pages/Agencies'))
const Brokerages = lazy(() => import('@/pages/Brokerages'))
const Brokerage = lazy(() => import('@/pages/Brokerage'))
const Locations = lazy(() => import('@/pages/Locations'))
const Projects = lazy(() => import('@/pages/Projects'))
const Project = lazy(() => import('@/pages/Project'))
const Developer = lazy(() => import('@/pages/Developer'))
const DeveloperOrganizations = lazy(() => import('@/pages/DeveloperOrganizations'))
const DeveloperOrg = lazy(() => import('@/pages/DeveloperOrg'))
const ProjectBrowse = lazy(() => import('@/pages/ProjectBrowse'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const CookiePolicy = lazy(() => import('@/pages/CookiePolicy'))
const Messages = lazy(() => import('@/pages/Messages'))
const Rfq = lazy(() => import('@/pages/Rfq'))

const AppLayout = () => {
  const location = useLocation()
  const [refreshKey, setRefreshKey] = useState(0) // refreshKey to check user and notifications when navigating between routes

  useEffect(() => {
    setRefreshKey((prev) => prev + 1)
  }, [location.pathname])

  return (
    <UserProvider refreshKey={refreshKey}>
      <NotificationProvider refreshKey={refreshKey}>
        <RecaptchaProvider>
          <PayPalProvider>
            <ScrollToTop />
            <div className="app">
              <Suspense fallback={<NProgressIndicator />}>
                <Header />
                <Outlet />
              </Suspense>
            </div>
          </PayPalProvider>
        </RecaptchaProvider>
      </NotificationProvider>
    </UserProvider>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: '/sign-in', element: <SignIn /> },
      { path: '/sign-up', element: <SignUp /> },
      { path: '/sign-up/role', element: <RoleSignUp /> },
      { path: '/sign-up/role/:role', element: <RoleSignUp /> },
      { path: '/activate', element: <Activate /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
      { path: '/search', element: <Search /> },
      { path: '/property', element: <Property /> },
      { path: '/property/:id', element: <Property /> },
      { path: '/checkout', element: <Checkout /> },
      { path: '/checkout-session/:sessionId', element: <CheckoutSession /> },
      { path: '/bookings', element: <Bookings /> },
      { path: '/booking', element: <Booking /> },
      { path: '/settings', element: <Settings /> },
      { path: '/notifications', element: <Notifications /> },
      { path: '/onboarding', element: <Onboarding /> },
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/dashboard/broker', element: <BrokerDashboard /> },
      { path: '/dashboard/developer', element: <DeveloperDashboard /> },
      { path: '/dashboard/owner', element: <OwnerDashboard /> },
      { path: '/dashboard/listings', element: <MyListings /> },
      { path: '/dashboard/listings/new', element: <CreateListing /> },
      { path: '/dashboard/listings/:id', element: <UpdateListing /> },
      { path: '/dashboard/developments/new', element: <CreateDevelopment /> },
      { path: '/dashboard/organization', element: <Organization /> },
      { path: '/change-password', element: <ChangePassword /> },
      { path: '/about', element: <About /> },
      { path: '/tos', element: <ToS /> },
      { path: '/contact', element: <Contact /> },
      { path: '/concierge', element: <Concierge /> },
      { path: '/rfq', element: <Rfq /> },
      { path: '/agencies', element: <Agencies /> },
      { path: '/brokers', element: <Brokerages /> },
      { path: '/brokers/:slug', element: <Brokerage /> },
      { path: '/destinations', element: <Locations /> },
      { path: '/projects', element: <Projects /> },
      { path: '/projects/browse', element: <ProjectBrowse /> },
      { path: '/projects/:id', element: <Project /> },
      { path: '/developers/:id', element: <Developer /> },
      { path: '/developers', element: <DeveloperOrganizations /> },
      { path: '/developers/org/:slug', element: <DeveloperOrg /> },
      { path: '/privacy', element: <Privacy /> },
      { path: '/cookie-policy', element: <CookiePolicy /> },
      { path: '/messages', element: <Messages /> },
      { path: '*', element: <NoMatch /> }
    ]
  }
])

const App = () => <RouterProvider router={router} />

export default App
