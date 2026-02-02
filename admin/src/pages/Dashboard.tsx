import React, { useEffect, useState } from 'react'
import { Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import { strings } from '@/lang/dashboard'
import { strings as commonStrings } from '@/lang/common'
import * as helper from '@/utils/helper'
import * as BookingService from '@/services/BookingService'
import * as PropertyService from '@/services/PropertyService'
import * as LeadService from '@/services/LeadService'
import * as DevelopmentService from '@/services/DevelopmentService'
import * as AgencyService from '@/services/AgencyService'
import * as UserService from '@/services/UserService'
import * as movininHelper from ':movinin-helper'

import '@/assets/css/dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const [bookingCount, setBookingCount] = useState(0)
  const [propertyCount, setPropertyCount] = useState(0)
  const [leadCount, setLeadCount] = useState(0)
  const [developmentCount, setDevelopmentCount] = useState(0)
  const [developerCount, setDeveloperCount] = useState(0)
  const [brokerCount, setBrokerCount] = useState(0)
  const [ownerCount, setOwnerCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true)
        const agencies = await AgencyService.getAllAgencies()
        const agencyIds = movininHelper.flattenAgencies(agencies)

        const bookingPayload: movininTypes.GetBookingsPayload = {
          agencies: agencyIds,
          statuses: helper.getBookingStatuses().map((status) => status.value),
        }
        const bookingData = await BookingService.getBookings(bookingPayload, 1, 1)
        const bookingTotal = Array.isArray(bookingData?.[0]?.pageInfo) && bookingData[0].pageInfo.length > 0
          ? bookingData[0].pageInfo[0].totalRecords
          : 0
        setBookingCount(bookingTotal)

        const propertyPayload: movininTypes.GetPropertiesPayload = {
          agencies: agencyIds,
          types: movininHelper.getAllPropertyTypes(),
          rentalTerms: movininHelper.getAllRentalTerms(),
        }
        const propertyData = await PropertyService.getProperties('', propertyPayload, 1, 1)
        const propertyTotal = Array.isArray(propertyData?.[0]?.pageInfo) && propertyData[0].pageInfo.length > 0
          ? propertyData[0].pageInfo[0].totalRecords
          : 0
        setPropertyCount(propertyTotal)

        const leadPayload: movininTypes.GetLeadsPayload = {
          statuses: helper.getLeadStatuses().map((status) => status.value),
        }
        const leadData = await LeadService.getLeads(leadPayload, 1, 1)
        const leadTotal = Array.isArray(leadData?.[0]?.pageInfo) && leadData[0].pageInfo.length > 0
          ? leadData[0].pageInfo[0].totalRecords
          : 0
        setLeadCount(leadTotal)

        const developmentData = await DevelopmentService.getDevelopments({}, '', 1, 1)
        const developmentTotal = Array.isArray(developmentData?.[0]?.pageInfo) && developmentData[0].pageInfo.length > 0
          ? developmentData[0].pageInfo[0].totalRecords
          : 0
        setDevelopmentCount(developmentTotal)

        const developerData = await UserService.getUsers(
          { user: '', types: [movininTypes.UserType.Developer] },
          '',
          1,
          1,
        )
        const developerTotal = Array.isArray(developerData?.[0]?.pageInfo) && developerData[0].pageInfo.length > 0
          ? developerData[0].pageInfo[0].totalRecords
          : 0
        setDeveloperCount(developerTotal)

        const brokerData = await UserService.getUsers(
          { user: '', types: [movininTypes.UserType.Broker] },
          '',
          1,
          1,
        )
        const brokerTotal = Array.isArray(brokerData?.[0]?.pageInfo) && brokerData[0].pageInfo.length > 0
          ? brokerData[0].pageInfo[0].totalRecords
          : 0
        setBrokerCount(brokerTotal)

        const ownerData = await UserService.getUsers(
          { user: '', types: [movininTypes.UserType.Owner] },
          '',
          1,
          1,
        )
        const ownerTotal = Array.isArray(ownerData?.[0]?.pageInfo) && ownerData[0].pageInfo.length > 0
          ? ownerData[0].pageInfo[0].totalRecords
          : 0
        setOwnerCount(ownerTotal)
      } catch (err) {
        helper.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
  }, [])

  return (
    <Layout strict>
      <div className="admin-dashboard">
        <h1>{strings.DASHBOARD}</h1>
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <div className="dashboard-card-title">{strings.BOOKINGS}</div>
            <div className="dashboard-card-value">{loading ? commonStrings.LOADING : bookingCount}</div>
            <Button size="small" variant="outlined" onClick={() => navigate('/bookings')}>{commonStrings.VIEW}</Button>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-card-title">{strings.PROPERTIES}</div>
            <div className="dashboard-card-value">{loading ? commonStrings.LOADING : propertyCount}</div>
            <Button size="small" variant="outlined" onClick={() => navigate('/properties')}>{commonStrings.VIEW}</Button>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-card-title">{strings.LEADS}</div>
            <div className="dashboard-card-value">{loading ? commonStrings.LOADING : leadCount}</div>
            <Button size="small" variant="outlined" onClick={() => navigate('/leads')}>{commonStrings.VIEW}</Button>
          </div>
          <div className="dashboard-card dashboard-card-split">
            <div className="dashboard-card-title">{strings.DEVELOPERS_PROJECTS}</div>
            <div className="dashboard-card-metrics">
              <div>
                <div className="dashboard-card-label">{strings.DEVELOPERS}</div>
                <div className="dashboard-card-value">{loading ? commonStrings.LOADING : developerCount}</div>
              </div>
              <div>
                <div className="dashboard-card-label">{strings.PROJECTS}</div>
                <div className="dashboard-card-value">{loading ? commonStrings.LOADING : developmentCount}</div>
              </div>
            </div>
            <div className="dashboard-card-actions">
              <Button size="small" variant="outlined" onClick={() => navigate('/developers')}>{strings.DEVELOPERS}</Button>
              <Button size="small" variant="outlined" onClick={() => navigate('/developments')}>{strings.PROJECTS}</Button>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-card-title">{strings.BROKERS}</div>
            <div className="dashboard-card-value">{loading ? commonStrings.LOADING : brokerCount}</div>
            <Button size="small" variant="outlined" onClick={() => navigate('/brokers')}>{commonStrings.VIEW}</Button>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-card-title">{strings.OWNERS}</div>
            <div className="dashboard-card-value">{loading ? commonStrings.LOADING : ownerCount}</div>
            <Button size="small" variant="outlined" onClick={() => navigate('/owners')}>{commonStrings.VIEW}</Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard
