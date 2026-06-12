import React from 'react';
import { Briefcase, CheckCircle, User, Award } from 'lucide-react';

const DashboardOverview = ({ user, metrics, handleAvailabilityChange }) => {
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

export default DashboardOverview;
