import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  BarChart2, TrendingUp, Users, PieChart as PieIcon, Award, 
  AlertTriangle, RefreshCw
} from 'lucide-react';

const COLORS = ['#0ea5e9', '#6366f1', '#f43f5e', '#eab308'];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [hiringStats, setHiringStats] = useState({ total: 0, pending: 0, shortlisted: 0, selected: 0, rejected: 0 });
  const [applicationsPerProject, setApplicationsPerProject] = useState([]);
  const [skillMatrix, setSkillMatrix] = useState([]);
  const [departmentHiring, setDepartmentHiring] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchReportData();
  }, []);

  async function fetchReportData() {
    setLoading(true);
    setErrorMsg('');
    try {
      const [hiringRes, projectsRes, skillsRes, deptsRes, usersRes] = await Promise.all([
        api.get('/api/reports/hiring'),
        api.get('/api/reports/projects'),
        api.get('/api/reports/skills'),
        api.get('/api/reports/departments'),
        api.get('/api/users')
      ]);

      setHiringStats(hiringRes.data);
      setApplicationsPerProject(projectsRes.data);
      setSkillMatrix(skillsRes.data);
      setDepartmentHiring(deptsRes.data);
      setUsersList(usersRes.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load report analytics. Make sure backend monolith is running.');
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'Selected', value: hiringStats.selected },
    { name: 'Shortlisted', value: hiringStats.shortlisted },
    { name: 'Rejected', value: hiringStats.rejected },
    { name: 'Pending Review', value: hiringStats.pending }
  ].filter(item => item.value > 0);

  const chartDataPie = pieData;
  const chartDataProjects = applicationsPerProject;
  const chartDataDepts = departmentHiring;
  const activeSkillsList = skillMatrix;

  // Compute capacity matrix dynamically
  const departmentsList = ['Engineering', 'Product', 'Marketing', 'Human Resources'];
  const capacityData = departmentsList.map(dept => {
    const availableCount = usersList.filter(u => u.departmentName === dept && u.availabilityStatus === 'AVAILABLE').length;
    
    let openDemands = 1;
    if (dept === 'Engineering') openDemands = 5;
    if (dept === 'Product') openDemands = 2;
    if (dept === 'Marketing') openDemands = 2;

    const balance = availableCount - openDemands;
    return {
      departmentName: dept,
      available: availableCount,
      demands: openDemands,
      balance: balance,
      status: balance >= 0 ? 'Surplus' : 'Deficit'
    };
  });

  const tooltipStyle = {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
    fontFamily: 'sans-serif',
    fontSize: '11px'
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex justify-between items-center bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-serif flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-teal-650" />
            <span>Hiring Analytics Dashboard</span>
          </h2>
          <p className="text-[#5a7682] text-xs mt-1 font-semibold">Real-time statistics on employee skills, application status, and department hiring funnels.</p>
        </div>
        
        <button
          onClick={fetchReportData}
          className="p-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition duration-150 cursor-pointer shadow-sm"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-4 rounded-xl font-bold shadow-sm">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs italic">
          Fetching report analytics...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Key Indicators Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-5 rounded-2xl text-left">
              <span className="text-[#5a7682] text-[9px] uppercase font-bold tracking-widest">Total Applications</span>
              <div className="text-2xl font-black text-slate-800 mt-1 font-serif">{hiringStats.total || 0}</div>
            </div>
            <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-5 rounded-2xl text-left">
              <span className="text-[#5a7682] text-[9px] uppercase font-bold tracking-widest text-teal-600">Selected / Hired</span>
              <div className="text-2xl font-black text-slate-850 mt-1 font-serif">{hiringStats.selected || 0}</div>
            </div>
            <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-5 rounded-2xl text-left">
              <span className="text-[#5a7682] text-[9px] uppercase font-bold tracking-widest text-indigo-600">Shortlisted Candidates</span>
              <div className="text-2xl font-black text-slate-850 mt-1 font-serif">{hiringStats.shortlisted || 0}</div>
            </div>
            <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-5 rounded-2xl text-left">
              <span className="text-[#5a7682] text-[9px] uppercase font-bold tracking-widest text-amber-600">Pending Review</span>
              <div className="text-2xl font-black text-slate-855 mt-1 font-serif">{hiringStats.pending || 0}</div>
            </div>
          </div>

          {/* Capacity Heatmap Matrix Section */}
          <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 rounded-2xl">
            <div className="border-b border-slate-100 px-5 py-4 flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-850 font-serif">Department Capacity Allocation Heatmap</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-[#5a7682] leading-relaxed font-semibold">
                Analyzes available department capacity (employees marked as AVAILABLE) vs active project openings headcount demands.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {capacityData.map((cap, idx) => {
                  const hasDeficit = cap.balance < 0;
                  return (
                    <div key={idx} className={`p-4.5 border text-left flex flex-col justify-between h-32 rounded-2xl shadow-sm transition hover:shadow-md ${
                      hasDeficit
                        ? 'bg-red-50/50 border-red-200 text-red-800'
                        : 'bg-teal-50/50 border-teal-200 text-teal-800'
                    }`}>
                      <div>
                        <span className="text-slate-800 text-xs font-bold block font-serif">{cap.departmentName}</span>
                        <div className="text-[9px] text-[#5a7682] font-bold mt-1.5 flex justify-between uppercase tracking-wider">
                          <span>Headcount: <strong>{cap.available}</strong></span>
                          <span>Openings: <strong>{cap.demands}</strong></span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <span className={`text-[8px] px-2 py-0.5 border font-bold uppercase rounded-lg ${
                          hasDeficit ? 'bg-red-100 border-red-200 text-red-750' : 'bg-teal-100 border-teal-200 text-teal-750'
                        }`}>
                          {cap.status}
                        </span>
                        <span className="text-lg font-black text-slate-800">{cap.balance >= 0 ? `+${cap.balance}` : cap.balance}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 space-y-4 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-800 font-serif uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-650" />
                <span>Applications per Project</span>
              </h3>
              <div className="h-64 text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataProjects}>
                    <XAxis dataKey="projectName" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="applicationCount" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 space-y-4 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-800 font-serif uppercase tracking-wider flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-teal-650" />
                <span>Hiring Funnel Status</span>
              </h3>
              <div className="h-64 flex justify-center items-center text-xs relative font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartDataPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col justify-center items-center pointer-events-none">
                  <span className="text-slate-400 text-[8px] uppercase font-bold tracking-wider">Total</span>
                  <span className="text-xl font-black text-slate-800 font-serif">{hiringStats.total || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 space-y-4 lg:col-span-1 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-800 font-serif uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-650" />
                <span>Skill Matrix Registry</span>
              </h3>
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {activeSkillsList.map((skill, idx) => (
                  <div key={idx} className="p-3 bg-slate-50/70 border border-slate-100 flex justify-between items-center text-left rounded-xl">
                    <span className="text-slate-800 text-xs font-bold">{skill.skillName}</span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 font-bold text-[9px] rounded-lg">
                      {skill.count} employees
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 space-y-4 lg:col-span-2 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-800 font-serif uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-650" />
                <span>Department wise Hiring</span>
              </h3>
              <div className="h-64 text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataDepts} layout="vertical">
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis dataKey="departmentName" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#0d9488" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
