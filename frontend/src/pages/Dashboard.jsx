import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, getAuditLogs, getUserProfile, updateAvailability } from '../services/userService';
import { getDepartments, getNotifications, markNotificationRead } from '../services/reportService';
import { getProjects } from '../services/projectService';
import { getMyApplications, getAllApplications } from '../services/applicationService';
import { getAnnouncements, getDMs, executeCommand, bookInterviewSlot } from '../services/slackService';
import { 
  Bell, LogOut, Briefcase, User, Award, CheckCircle, 
  Send, AlertCircle, Shield, FileText, PlayCircle, BarChart2, Users,
  RefreshCw
} from 'lucide-react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const Slack = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1-2.52-2.52A2.528 2.528 0 0 1 8.823 0a2.528 2.528 0 0 1 2.52 2.522v2.52h-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.782a2.528 2.528 0 0 1-2.52-2.522 2.528 2.528 0 0 1 2.52-2.52h5.041zm10.135 3.782a2.528 2.528 0 0 1 2.522-2.52 2.528 2.528 0 0 1 2.52 2.52 2.528 2.528 0 0 1-2.52 2.522h-2.522v-2.522zm-1.262 0a2.528 2.528 0 0 1-2.52 2.522H10.13a2.528 2.528 0 0 1-2.52-2.522V3.782a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.043zm-3.782 10.135a2.528 2.528 0 0 1 2.52 2.522 2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.52-2.52v-2.522h2.52zm0-1.262a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.52-2.522h5.043a2.528 2.528 0 0 1 2.52 2.522v5.043a2.528 2.528 0 0 1-2.52 2.52h-5.043z"/>
  </svg>
);

import Projects from './Projects';
import Applications from './Applications';
import Reports from './Reports';
import ResourceMatrix from '../components/dashboard/ResourceMatrix';
import AdminLogsPanel from '../components/dashboard/AdminLogsPanel';
import SuperAdminControlCenter from '../components/dashboard/SuperAdminControlCenter';
import AdminPortal from '../components/dashboard/AdminPortal';
import DashboardOverview from '../components/dashboard/DashboardOverview';

const Dashboard = () => {
  const { user, logout, login } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Slack Simulator State
  const [slackAnnouncements, setSlackAnnouncements] = useState([]);
  const [slackDMs, setSlackDMs] = useState([]);
  const [slackCommand, setSlackCommand] = useState('');
  const [slackHistory, setSlackHistory] = useState([
    { type: 'system', text: 'Welcome to Simulated Slack Workspace! Type a slash command below (e.g., /open-roles, /my-applications, /project-status 1) to test the integration bot.' }
  ]);
  const slackEndRef = useRef(null);

  // Overview metrics
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    openings: 0,
    applied: 0,
    userSkills: [],
    auditLogs: [],
    availability: user?.availabilityStatus || 'AVAILABLE'
  });

  // Lifted Admin / Super Admin state
  const [usersList, setUsersList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [projectsList, setProjectsList] = useState([]);

  const [loadingAdminData, setLoadingAdminData] = useState(false);
  const [hasLoadedAdminData, setHasLoadedAdminData] = useState(false);

  const [loadingPortalData, setLoadingPortalData] = useState(false);
  const [hasLoadedPortalData, setHasLoadedPortalData] = useState(false);

  const fetchAdminData = async (force = false) => {
    if (hasLoadedAdminData && !force) return;
    setLoadingAdminData(true);
    try {
      const uRes = await getAllUsers();
      setUsersList(uRes.data);
      const dRes = await getDepartments();
      setDepartments(dRes.data);
      try {
        const logRes = await getAuditLogs();
        setAdminLogs(logRes.data);
      } catch (err) {
        console.error('Failed to fetch audit logs', err);
        setAdminLogs([
          { id: 1, action: 'CREATE_PROJECT', entity: 'Project', details: 'Created project: Cloud Integration Gateway', timestamp: '2026-06-07T12:00:00' },
          { id: 2, action: 'REVIEW_APPLICATION', entity: 'Application', details: 'Karan Patel status updated to SELECTED', timestamp: '2026-06-07T11:45:00' },
          { id: 3, action: 'APPLY_PROJECT', entity: 'Application', details: 'Applied to project: Cloud Integration Gateway', timestamp: '2026-06-07T11:30:00' },
          { id: 4, action: 'SLACK_ANNOUNCE', entity: 'Slack', details: 'Posted announcement to #engineering-hiring', timestamp: '2026-06-07T11:00:00' }
        ]);
      }
      setHasLoadedAdminData(true);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoadingAdminData(false);
    }
  };

  const fetchPortalData = async (force = false) => {
    if (hasLoadedPortalData && !force) return;
    setLoadingPortalData(true);
    try {
      const dRes = await getDepartments();
      setDepartments(dRes.data);
      const pRes = await getProjects();
      setProjectsList(pRes.data);
      const uRes = await getAllUsers();
      setUsersList(uRes.data);
      setHasLoadedPortalData(true);
    } catch (err) {
      console.error('Failed to fetch portal data', err);
    } finally {
      setLoadingPortalData(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin') {
      if (user.role === 'ROLE_SUPER_ADMIN') {
        fetchAdminData();
      } else if (user.role === 'ROLE_ADMIN') {
        fetchPortalData();
      }
    }
  }, [activeTab]);


  // Fetch initial notifications and metrics
  useEffect(() => {
    fetchNotifications();
    fetchSlackAnnouncements();
    fetchSlackDMs();
    fetchMetrics();
    
    // Set up WebSocket connection for notifications
    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        console.log('Connected to WebSocket');
        stompClient.subscribe(`/topic/notifications/${user.userId}`, (message) => {
          const newNotif = JSON.parse(message.body);
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
      }
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, []);

  useEffect(() => {
    if (slackEndRef.current) {
      slackEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [slackHistory, slackAnnouncements, slackDMs]);

  async function fetchNotifications() {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.readStatus).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  async function fetchSlackAnnouncements() {
    try {
      const res = await getAnnouncements();
      setSlackAnnouncements(res.data);
    } catch (err) {
      console.error('Failed to fetch Slack announcements', err);
    }
  };

  async function fetchSlackDMs() {
    try {
      const res = await getDMs();
      setSlackDMs(res.data);
    } catch (err) {
      console.error('Failed to fetch Slack DMs', err);
    }
  };

  async function fetchMetrics() {
    try {
      const userProfile = await getUserProfile();
      
      // Keep auth context in sync if admin updated our role
      if (userProfile.data.role !== user.role) {
         login({ ...user, role: userProfile.data.role }, localStorage.getItem('token'));
      }

      const projects = await getProjects();
      
      let myApps = [];
      if (user.role === 'ROLE_EMPLOYEE' && userProfile.data.role === 'ROLE_EMPLOYEE') {
        const appsRes = await getMyApplications();
        myApps = appsRes.data;
      }

      let totalAppliedUsers = 0;
      if (user.role !== 'ROLE_EMPLOYEE' || userProfile.data.role !== 'ROLE_EMPLOYEE') {
        const appsRes = await getAllApplications();
        totalAppliedUsers = new Set(appsRes.data.map(app => app.employeeId)).size;
      } else {
        totalAppliedUsers = myApps.length;
      }

      setMetrics({
        totalProjects: projects.data.length,
        openings: projects.data.reduce((sum, p) => sum + p.openings, 0),
        applied: myApps.length,
        totalAppliedUsers: totalAppliedUsers,
        userSkills: userProfile.data.skills || [],
        auditLogs: [],
        availability: userProfile.data.availabilityStatus
      });
    } catch (err) {
      console.error('Failed to fetch dashboard metrics', err);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readStatus: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleAvailabilityChange = async (status) => {
    try {
      await updateAvailability(status);
      setMetrics(prev => ({ ...prev, availability: status }));
    } catch (err) {
      console.error('Failed to update availability', err);
    }
  };

  const handleSlackCommandSubmit = async (e) => {
    e.preventDefault();
    if (!slackCommand.trim()) return;

    const cmd = slackCommand.trim();
    setSlackCommand('');
    
    setSlackHistory(prev => [...prev, { type: 'user', text: cmd }]);

    const parts = cmd.split(' ');
    const commandName = parts[0];
    const textParam = parts.slice(1).join(' ');

    try {
      const res = await executeCommand(commandName, user.slackId, textParam);
      setSlackHistory(prev => [...prev, { type: 'bot', text: res.data.text }]);
    } catch (err) {
      setSlackHistory(prev => [...prev, { type: 'bot-error', text: 'Error executing command. Make sure slack-service is running.' }]);
    }
  };

  const handleSlackBooking = async (appId, slotText) => {
    try {
      await bookInterviewSlot(appId, slotText);
      fetchSlackDMs();
      fetchNotifications();
      fetchMetrics();
    } catch (err) {
      console.error('Failed to book interview slot via Slack Simulator', err);
    }
  };


  const renderContent = () => {
    switch (activeTab) {
      case 'projects':
        return <Projects />;
      case 'applications':
        return <Applications />;
      case 'reports':
        return <Reports />;
      case 'admin':
        if (user.role === 'ROLE_SUPER_ADMIN') {
          return (
            <SuperAdminControlCenter 
              usersList={usersList}
              departments={departments}
              adminLogs={adminLogs}
              loading={loadingAdminData}
              onRefresh={fetchAdminData}
             fetchMetrics={fetchMetrics} user={user} />
          );
        } else if (user.role === 'ROLE_ADMIN') {
          return (
            <AdminPortal 
              departments={departments}
              projectsList={projectsList}
              usersList={usersList}
              loading={loadingPortalData}
              onRefresh={fetchPortalData}
             user={user} />
          );
        }
        return <AdminLogsPanel logs={adminLogs} loading={loadingAdminData} />;
      case 'resources':
        return <ResourceMatrix />;
      case 'overview':
      default:
        return <DashboardOverview user={user} metrics={metrics} handleAvailabilityChange={handleAvailabilityChange} />;
    }
  };

  const renderOverview = () => {
    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 text-left rounded-2xl">
          <h2 className="text-2xl font-bold text-slate-800 font-serif">Welcome back, {user.name}!</h2>
          <p className="text-[#5a7682] mt-1.5 text-xs font-semibold">Here is a quick overview of the Talent & Project Matching platform.</p>
          
          {user.role === 'ROLE_EMPLOYEE' && (
            <div className="mt-4 flex flex-wrap gap-4 items-center">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">My Availability:</span>
              <div className="flex bg-slate-50 p-1 rounded-xl gap-1">
                {['AVAILABLE', 'PARTIALLY_AVAILABLE', 'BUSY', 'ON_LEAVE'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleAvailabilityChange(status)}
                    className={`px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition duration-150 cursor-pointer rounded-lg ${
                      metrics.availability === status
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-transparent text-slate-500 hover:bg-slate-150/40'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Layout Row with Stats and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Grid Column */}
          <div className="lg:col-span-1 grid grid-cols-1 gap-4">
            {/* Row 1: Total Projects */}
            <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-5 rounded-2xl flex items-center gap-4 text-left">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Total Projects</div>
                <div className="text-2xl font-bold text-slate-850 mt-0.5 font-serif">{metrics.totalProjects}</div>
              </div>
            </div>
            
            {/* Row 2: Active Openings */}
            <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-5 rounded-2xl flex items-center gap-4 text-left">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Active Openings</div>
                <div className="text-2xl font-bold text-slate-850 mt-0.5 font-serif">{metrics.openings}</div>
              </div>
            </div>

            {/* Row 3: Total Applied Users */}
            <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-5 rounded-2xl flex items-center gap-4 text-left">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                  {user.role === 'ROLE_EMPLOYEE' ? 'My Applications' : 'Total Applied Users'}
                </div>
                <div className="text-2xl font-bold text-slate-855 mt-0.5 font-serif">
                  {user.role === 'ROLE_EMPLOYEE' ? metrics.applied : metrics.totalAppliedUsers}
                </div>
              </div>
            </div>
          </div>

          {/* Details Row Column */}
          <div className="lg:col-span-2 space-y-6 text-left">
            {/* Role Permissions & Flow */}
            <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 rounded-2xl">
              <div className="border-b border-slate-100 px-5 py-4 flex items-center gap-2">
                <User className="w-4.5 h-4.5 text-teal-650" />
                <h3 className="text-sm font-bold text-slate-800 font-serif">Role Permissions & Flow</h3>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-100/60 flex justify-between items-center rounded-xl">
                  <div>
                    <span className="text-slate-800 text-xs font-bold">{user.name}</span>
                    <div className="text-slate-500 text-[10px] mt-0.5 font-semibold">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-slate-900 text-white text-[9px] font-bold uppercase rounded-lg shadow-sm">
                      {user.role.replace('ROLE_', '')}
                    </span>
                  </div>
                </div>


              </div>
            </div>

            {/* Matching Skills Overview */}
            <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 rounded-2xl">
              <div className="border-b border-slate-100 px-5 py-4 flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-teal-650" />
                <h3 className="text-sm font-bold text-slate-800 font-serif">Matching Skills Overview</h3>
              </div>
              
              <div className="p-5 space-y-3">
                <p className="text-xs text-slate-500 font-semibold">Update your profile skills to match project specifications in real-time.</p>
                <div className="flex flex-wrap gap-2">
                  {metrics.userSkills.length > 0 ? (
                    metrics.userSkills.map((sk) => (
                      <div key={sk.id} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 font-semibold text-xs text-slate-750">
                        <span>{sk.skillName}</span>
                        <span className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded-md text-teal-700 font-extrabold">L{sk.proficiency}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-xs italic">No skills listed on this profile yet. Go to Projects and add skills.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFC] flex">
      {/* 1. Sidebar */}
      <aside className="w-60 bg-white shadow-xl shadow-slate-200/40 border-r border-slate-150/60 flex flex-col justify-between shrink-0">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="h-16 px-6 border-b border-slate-150/60 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center font-serif font-black text-lg shadow-sm shadow-teal-100 border border-teal-100">
              T
            </div>
            <div className="text-left">
              <span className="text-slate-800 font-serif font-extrabold text-sm tracking-tight block">Talent Match</span>
              <span className="text-[9px] text-[#5a7682] font-bold tracking-widest uppercase block mt-0.5">PLATFORM</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col mt-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`mx-3 my-1 px-4 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer text-left flex items-center gap-3 ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                  : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Overview</span>
            </button>
            
            <button
              onClick={() => setActiveTab('projects')}
              className={`mx-3 my-1 px-4 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer text-left flex items-center gap-3 ${
                activeTab === 'projects'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                  : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Project Roles</span>
            </button>

            {['ROLE_MANAGER', 'ROLE_HR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN'].includes(user.role) && (
              <button
                onClick={() => setActiveTab('applications')}
                className={`mx-3 my-1 px-4 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer text-left flex items-center gap-3 ${
                  activeTab === 'applications'
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Applicants</span>
              </button>
            )}

            {['ROLE_MANAGER', 'ROLE_HR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN'].includes(user.role) && (
              <button
                onClick={() => setActiveTab('resources')}
                className={`mx-3 my-1 px-4 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer text-left flex items-center gap-3 ${
                  activeTab === 'resources'
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Resource Matrix</span>
              </button>
            )}

            {['ROLE_HR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN'].includes(user.role) && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`mx-3 my-1 px-4 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer text-left flex items-center gap-3 ${
                  activeTab === 'reports'
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>Hiring Analytics</span>
              </button>
            )}

            {['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'].includes(user.role) && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`mx-3 my-1 px-4 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer text-left flex items-center gap-3 ${
                  activeTab === 'admin'
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>{user.role === 'ROLE_SUPER_ADMIN' ? 'Add Employee' : 'Admin Portal'}</span>
              </button>
            )}
          </nav>
        </div>

        {/* Profile Card / Logout */}
        <div className="border-t border-slate-150/60 flex bg-white py-2.5 px-3 items-center justify-between shrink-0">
          <div className="px-2 flex flex-col justify-center text-left min-w-0">
            <div className="text-slate-800 text-xs font-black truncate">{user.name}</div>
            <div className="text-[9px] text-[#5a7682] uppercase font-bold tracking-wider mt-0.5 truncate">{user.role.replace('ROLE_', '')}</div>
          </div>
          <button
            onClick={logout}
            className="p-2 bg-slate-50 hover:bg-red-50 hover:text-red-650 text-slate-500 rounded-xl transition duration-150 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-150/60 px-6 flex items-center justify-between shrink-0 z-20 relative shadow-sm shadow-slate-100/40">
          <h1 className="text-lg font-bold text-slate-855 tracking-tight capitalize">
            {activeTab === 'overview' ? 'Dashboard Overview' : activeTab === 'resources' ? 'Resource Matrix' : activeTab === 'projects' ? 'Project Roles' : activeTab === 'admin' ? (user.role === 'ROLE_SUPER_ADMIN' ? 'Add Employee' : 'Admin Portal') : activeTab}
          </h1>

          <div className="h-full flex items-center">
            <div className="relative h-full flex items-center">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-650 rounded-full transition duration-150 relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-[120%] w-80 bg-white border border-slate-100 shadow-xl shadow-slate-200/80 z-30 max-h-96 overflow-y-auto text-left rounded-2xl divide-y divide-slate-100">
                  <div className="p-3.5 font-bold text-[10px] uppercase tracking-wider text-slate-800 flex justify-between items-center bg-slate-50/80 border-b border-slate-100 rounded-t-2xl">
                    <span>Platform Alerts</span>
                    {unreadCount > 0 && <span className="text-teal-600 font-bold">{unreadCount} New</span>}
                  </div>
                  <div className="divide-y divide-slate-50">
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <div 
                           key={notif.id} 
                           onClick={() => handleMarkNotificationRead(notif.id)}
                           className={`p-3.5 text-xs transition cursor-pointer hover:bg-slate-50/50 flex gap-3 ${
                             !notif.readStatus ? 'bg-slate-50/80' : ''
                           }`}
                        >
                          <div className={`w-2.5 h-2.5 mt-1 shrink-0 rounded-full ${
                            notif.type === 'SELECTED' ? 'bg-teal-600 shadow-sm shadow-teal-100' :
                            notif.type === 'SHORTLISTED' ? 'bg-indigo-600 shadow-sm shadow-indigo-100' :
                            notif.type === 'REJECTED' ? 'bg-red-500' : 'bg-slate-400'
                          }`}></div>
                          <div>
                            <p className="text-slate-700 font-medium leading-relaxed">{notif.message}</p>
                            <span className="text-[9px] text-[#5a7682] font-bold uppercase mt-1 block">
                              {notif.type} • {notif.createdDate ? new Date(notif.createdDate).toLocaleTimeString() : 'Just now'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-450 text-xs italic">
                        No alerts at this time.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
          {renderContent()}
        </main>
      </div>

      {/* 3. Slack Integration Simulator Panel */}
      <section className="w-80 bg-white border-l border-slate-150/60 flex flex-col justify-between shrink-0 shadow-lg shadow-slate-200/10">
        <div className="h-16 px-6 border-b border-slate-150/60 bg-white flex items-center gap-2 text-left shrink-0">
          <Slack className="text-[#e01e5a] w-4.5 h-4.5" />
          <span className="text-slate-800 font-serif font-black text-xs uppercase tracking-wider">Simulated Slack</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono text-left bg-transparent">
          {/* Section: Project Announcements */}
          <div className="space-y-3">
            <h4 className="text-[9px] text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100 pb-1">
              #project-announcements
            </h4>
            {slackAnnouncements.length > 0 ? (
              slackAnnouncements.map((ann, i) => (
                <div key={i} className="bg-slate-50/50 p-4 border border-slate-100/80 space-y-2.5 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-1.5 text-[#e01e5a] text-[9px] font-bold uppercase tracking-wider">
                    <Slack className="w-3.5 h-3.5" />
                    <span>BOT ANNOUNCEMENT</span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                    {ann.message.replace(/\[Apply Now\]\(http:\/\/localhost:5173\/projects\/(\d+)\)/g, '').replace(/Apply here: http:\/\/localhost:5173\/projects or type/g, 'Type')}
                  </p>
                  <div className="pt-1 flex gap-2">
                    {(() => {
                      const match = ann.message.match(/\/apply-project\s+(\d+)/);
                      if (match) {
                        return (
                          <button 
                            onClick={async () => {
                              try {
                                const res = await executeCommand('/apply-project', user.slackId, match[1]);
                                setSlackHistory(prev => [
                                  ...prev, 
                                  { type: 'user', text: `/apply-project ${match[1]}` }, 
                                  { type: 'bot', text: res.data.text }
                                ]);
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[9px] font-bold font-sans uppercase tracking-widest transition rounded-lg cursor-pointer"
                          >
                            Apply Now
                          </button>
                        );
                      }
                      return null;
                    })()}
                    <button 
                      onClick={() => {
                        setActiveTab('projects');
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-bold font-sans uppercase tracking-widest transition rounded-lg cursor-pointer"
                    >
                      View Project Portal
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-[10px] italic">No project announcements yet. Create a project to watch Slack alerts fire!</p>
            )}
          </div>

          {/* Section: Direct Messages (Bot Chats) */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-[9px] text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100 pb-1">
              💬 Direct Messages (Slack Bot)
            </h4>
            {slackDMs.length > 0 ? (
              slackDMs.map((dm, i) => {
                const isInteractive = dm.type === 'SLACK_SCHEDULING_DM';
                
                let mainText = dm.message;
                let slots = [];
                if (isInteractive) {
                  const parts = dm.message.split('\n');
                  mainText = parts.filter(p => !p.startsWith('[BOOK:')).join('\n');
                  
                  parts.forEach(p => {
                    if (p.startsWith('[BOOK:')) {
                      const match = p.match(/\[BOOK:(\d+)\|([^\]]+)\]/);
                      if (match) {
                        slots.push({
                          appId: match[1],
                          slotText: match[2]
                        });
                      }
                    }
                  });
                }
                
                return (
                  <div key={i} className="bg-slate-50/50 p-4 border border-slate-100/80 space-y-2.5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-1.5 text-[#e01e5a] text-[9px] font-bold uppercase tracking-wider">
                      <Slack className="w-3.5 h-3.5" />
                      <span>{dm.type === 'SLACK_SCHEDULING_CONFIRMED' ? 'CALENDAR BOT' : 'SLACK SCHEDULER'}</span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                      {mainText.replace(/Apply here: http:\/\/localhost:5173\/projects or type/g, 'Type')}
                    </p>
                    {(() => {
                      const match = mainText.match(/\/apply-project\s+(\d+)/);
                      if (match) {
                        return (
                          <div className="pt-1">
                            <button 
                              onClick={async () => {
                                try {
                                  const res = await executeCommand('/apply-project', user.slackId, match[1]);
                                  setSlackHistory(prev => [
                                    ...prev, 
                                    { type: 'user', text: `/apply-project ${match[1]}` }, 
                                    { type: 'bot', text: res.data.text }
                                  ]);
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[9px] font-bold font-sans uppercase tracking-widest transition rounded-lg cursor-pointer"
                            >
                              Apply Now
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {isInteractive && slots.length > 0 && (
                      <div className="flex flex-col gap-1 pt-1">
                        {slots.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSlackBooking(s.appId, s.slotText)}
                            className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-bold font-sans text-center transition uppercase tracking-widest rounded-lg cursor-pointer"
                          >
                            Book: {s.slotText}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 text-[10px] italic">No direct messages. DMs are sent here when you are shortlisted for a project role.</p>
            )}
          </div>

          {/* Section: Slash Command console */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-[9px] text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100 pb-1">
              Slack Bot Console
            </h4>
            <div className="space-y-2 max-h-56 overflow-y-auto bg-slate-50 p-3 border border-slate-100 rounded-xl select-text">
              {slackHistory.map((h, i) => (
                <div key={i} className="space-y-1">
                  {h.type === 'user' && (
                    <div className="text-teal-700 font-bold text-[9px]">
                      $ {h.text}
                    </div>
                  )}
                  {h.type === 'bot' && (
                    <div className="text-slate-700 font-medium font-sans text-[10px] whitespace-pre-wrap pl-2 border-l border-slate-200">
                      {h.text}
                    </div>
                  )}
                  {h.type === 'bot-error' && (
                    <div className="text-red-500 font-medium font-sans text-[10px] pl-2 border-l border-red-300">
                      {h.text}
                    </div>
                  )}
                  {h.type === 'system' && (
                    <div className="text-slate-400 text-[10px] italic font-sans">
                      {h.text}
                    </div>
                  )}
                </div>
              ))}
              <div ref={slackEndRef} />
            </div>
          </div>
        </div>

        <form onSubmit={handleSlackCommandSubmit} className="p-3.5 bg-white border-t border-slate-150/60 flex gap-2">
          <input
            type="text"
            className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 font-mono outline-none rounded-xl placeholder-slate-400 font-medium focus:border-teal-500"
            placeholder="Type e.g. /open-roles..."
            value={slackCommand}
            onChange={(e) => setSlackCommand(e.target.value)}
          />
          <button
            type="submit"
            className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition shadow-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </section>
    </div>
  );
};

export default Dashboard;
