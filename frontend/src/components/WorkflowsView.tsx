import React, { useState } from 'react';
import { 
  FileCheck, Calendar, Award, PhoneCall, CheckCircle2, ArrowRight,
  Building, Clock, Sparkles, Search, CheckSquare, Square
} from 'lucide-react';

interface WorkflowProps {
  onStartChatQuery: (query: string) => void;
}

export const WorkflowsView: React.FC<WorkflowProps> = ({ onStartChatQuery }) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<'bonafide' | 'calendar' | 'scholarship' | 'contacts'>('bonafide');
  
  // Interactive Checklist State for Bonafide & Scholarship
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({
    'step-1': true,
    'step-2': false,
    'step-3': false,
    'step-4': false
  });

  // Directory Search Filter State
  const [contactSearch, setContactSearch] = useState<string>('');

  const toggleStep = (id: string) => {
    setCompletedSteps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 4) * 100);

  const CONTACTS_DATA = [
    { title: "Principal's Office", name: "Dr. Malini M.", location: "Admin Block, Ground Floor", email: "principal@rvitm.edu.in", dept: "admin" },
    { title: "CSE Department (HoD)", name: "Dr. Latha Parthiban", location: "Academic Block A, Room A-301", email: "hod.cse@rvitm.edu.in", dept: "cse" },
    { title: "ISE Department (HoD)", name: "Dr. B. Sudarshan", location: "Academic Block A, Room A-401", email: "hod.ise@rvitm.edu.in", dept: "ise" },
    { title: "ECE Department (HoD)", name: "Dr. Girish V.", location: "Academic Block B, Room B-201", email: "hod.ece@rvitm.edu.in", dept: "ece" },
    { title: "Training & Placement (TPO)", name: "Prof. Anand Murthy", location: "Placement Auditorium Block", email: "placements@rvitm.edu.in", dept: "placement" },
    { title: "Anti-Ragging Squad Head", name: "Dr. Prashanth Kumar", location: "Helpline: 1800-180-5522", email: "Toll-free 24x7 Emergency", dept: "welfare" }
  ];

  const filteredContacts = CONTACTS_DATA.filter(c => 
    c.title.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.dept.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto">
      
      {/* Title & Introduction */}
      <div className="mb-6 sm:mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shimmer-badge text-indigo-700 border border-indigo-200/60 mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Interactive Campus Guides & Procedures
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          RVITM Procedural Campus Services
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
          Interactive student workflows grounded in official administrative policies & VTU guidelines.
        </p>
      </div>

      {/* Interactive Workflow Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 sm:mb-8">
        <button
          onClick={() => setSelectedWorkflow('bonafide')}
          className={`p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between ${
            selectedWorkflow === 'bonafide'
              ? 'bg-white border-2 border-indigo-500 shadow-md shadow-indigo-500/10 scale-[1.02]'
              : 'motion-card hover:border-indigo-300'
          }`}
        >
          <FileCheck className={`w-6 h-6 mb-2 ${selectedWorkflow === 'bonafide' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <div>
            <div className={`font-bold text-sm ${selectedWorkflow === 'bonafide' ? 'text-indigo-950' : 'text-slate-800'}`}>Bonafide Certificate</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Interactive application checklist</div>
          </div>
        </button>

        <button
          onClick={() => setSelectedWorkflow('calendar')}
          className={`p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between ${
            selectedWorkflow === 'calendar'
              ? 'bg-white border-2 border-indigo-500 shadow-md shadow-indigo-500/10 scale-[1.02]'
              : 'motion-card hover:border-indigo-300'
          }`}
        >
          <Calendar className={`w-6 h-6 mb-2 ${selectedWorkflow === 'calendar' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <div>
            <div className={`font-bold text-sm ${selectedWorkflow === 'calendar' ? 'text-indigo-950' : 'text-slate-800'}`}>Exam & CIE Timeline</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Academic milestones 2026-27</div>
          </div>
        </button>

        <button
          onClick={() => setSelectedWorkflow('scholarship')}
          className={`p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between ${
            selectedWorkflow === 'scholarship'
              ? 'bg-white border-2 border-indigo-500 shadow-md shadow-indigo-500/10 scale-[1.02]'
              : 'motion-card hover:border-indigo-300'
          }`}
        >
          <Award className={`w-6 h-6 mb-2 ${selectedWorkflow === 'scholarship' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <div>
            <div className={`font-bold text-sm ${selectedWorkflow === 'scholarship' ? 'text-indigo-950' : 'text-slate-800'}`}>Scholarships & SSP</div>
            <div className="text-[11px] text-slate-500 mt-0.5">₹50,000/yr & State schemes</div>
          </div>
        </button>

        <button
          onClick={() => setSelectedWorkflow('contacts')}
          className={`p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between ${
            selectedWorkflow === 'contacts'
              ? 'bg-white border-2 border-indigo-500 shadow-md shadow-indigo-500/10 scale-[1.02]'
              : 'motion-card hover:border-indigo-300'
          }`}
        >
          <PhoneCall className={`w-6 h-6 mb-2 ${selectedWorkflow === 'contacts' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <div>
            <div className={`font-bold text-sm ${selectedWorkflow === 'contacts' ? 'text-indigo-950' : 'text-slate-800'}`}>Campus Directory</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Instant search & cabins</div>
          </div>
        </button>
      </div>

      {/* Active Workflow Content Card */}
      <div className="motion-card rounded-3xl p-6 sm:p-8 shadow-md animate-fade-in">
        
        {/* WORKFLOW 1: BONAFIDE CERTIFICATE (WITH LIVE CHECKLIST) */}
        {selectedWorkflow === 'bonafide' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/50">
                  Procedural Guide • Academic Affairs
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  Official Bonafide / Study Certificate Application Pipeline
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Issued for bank education loans, passport verification, scholarship portals (SSP/NSP), and bus passes.
                </p>
              </div>

              {/* Live Checklist Progress Badge */}
              <div className="bg-indigo-50/80 border border-indigo-200/70 rounded-2xl p-3 shrink-0 flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-bold text-indigo-950">{completedCount} of 4 Completed</div>
                  <div className="text-[10px] text-indigo-700 font-semibold">{progressPercent}% Ready to submit</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white border border-indigo-200 flex items-center justify-center font-bold text-xs text-indigo-700 shadow-2xs">
                  {progressPercent}%
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Interactive Application Steps</span>
                  <span className="text-indigo-600 normal-case font-semibold">Click checkmark as you complete each</span>
                </div>

                <div className="space-y-3">
                  {/* Step 1 */}
                  <div 
                    onClick={() => toggleStep('step-1')}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                      completedSteps['step-1'] 
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                        : 'bg-white/80 border-slate-200/80 hover:border-indigo-300'
                    }`}
                  >
                    <button className="mt-0.5 text-indigo-600">
                      {completedSteps['step-1'] ? <CheckSquare className="w-5 h-5 text-emerald-600" /> : <Square className="w-5 h-5 text-slate-400" />}
                    </button>
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>1. Collect or Download Application Form</span>
                        {completedSteps['step-1'] && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Done</span>}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">Collect from Counter No. 2 (Administrative Block, Ground Floor) between 10:00 AM and 1:00 PM, or download via student ERP.</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div 
                    onClick={() => toggleStep('step-2')}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                      completedSteps['step-2'] 
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                        : 'bg-white/80 border-slate-200/80 hover:border-indigo-300'
                    }`}
                  >
                    <button className="mt-0.5 text-indigo-600">
                      {completedSteps['step-2'] ? <CheckSquare className="w-5 h-5 text-emerald-600" /> : <Square className="w-5 h-5 text-slate-400" />}
                    </button>
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>2. Attach Photocopy of Smart ID & Fee Receipt</span>
                        {completedSteps['step-2'] && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Attached</span>}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">Self-attest photocopy of your Student Smart ID Card and latest semester fee payment receipt.</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div 
                    onClick={() => toggleStep('step-3')}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                      completedSteps['step-3'] 
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                        : 'bg-white/80 border-slate-200/80 hover:border-indigo-300'
                    }`}
                  >
                    <button className="mt-0.5 text-indigo-600">
                      {completedSteps['step-3'] ? <CheckSquare className="w-5 h-5 text-emerald-600" /> : <Square className="w-5 h-5 text-slate-400" />}
                    </button>
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>3. Obtain Proctor & HoD Recommendation</span>
                        {completedSteps['step-3'] && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Signed</span>}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">Get the form countersigned by your designated Faculty Proctor and Head of Department.</p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div 
                    onClick={() => toggleStep('step-4')}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                      completedSteps['step-4'] 
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                        : 'bg-white/80 border-slate-200/80 hover:border-indigo-300'
                    }`}
                  >
                    <button className="mt-0.5 text-indigo-600">
                      {completedSteps['step-4'] ? <CheckSquare className="w-5 h-5 text-emerald-600" /> : <Square className="w-5 h-5 text-slate-400" />}
                    </button>
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>4. Submission at Counter 2 & Certificate Collection</span>
                        {completedSteps['step-4'] && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Submitted</span>}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">Submit at Counter 2. Turnaround time is 2-3 working days. Collect between 2:30 PM and 4:30 PM with college ID.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Quick Details */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Administrative Chamber</h4>
                  
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                    <Building className="w-4 h-4 text-indigo-600" />
                    <span>Counter No. 2, Admin Block</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>10:00 AM – 1:00 PM (Submission)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                    <PhoneCall className="w-4 h-4 text-indigo-600" />
                    <span>+91-80-6815-5600 (Ext. 202)</span>
                  </div>
                </div>

                <button
                  onClick={() => onStartChatQuery("How do I apply for a Bonafide Certificate at RVITM?")}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20"
                >
                  Ask Mitra to Guide Application
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WORKFLOW 2: ACADEMIC CALENDAR & EXAM TIMELINE */}
        {selectedWorkflow === 'calendar' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/50">
                VTU Regulations • Academic Year 2026-27
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2">
                Semester Timeline, CIE Tests & SEE Examination Schedule
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/70 border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Key Semester Milestones
                </h4>
                <ul className="text-xs space-y-2 text-slate-700">
                  <li className="flex justify-between py-1.5 border-b border-slate-100">
                    <span>Commencement of Classes</span>
                    <strong className="text-slate-900">Sept 1, 2026</strong>
                  </li>
                  <li className="flex justify-between py-1.5 border-b border-slate-100">
                    <span>Continuous Internal Eval (CIE-1)</span>
                    <strong className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Oct 12 – Oct 15, 2026</strong>
                  </li>
                  <li className="flex justify-between py-1.5 border-b border-slate-100">
                    <span>Continuous Internal Eval (CIE-2)</span>
                    <strong className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Nov 23 – Nov 26, 2026</strong>
                  </li>
                  <li className="flex justify-between py-1.5 border-b border-slate-100">
                    <span>Last Working Day of Semester</span>
                    <strong className="text-slate-900">Dec 24, 2026</strong>
                  </li>
                  <li className="flex justify-between py-1.5 border-b border-slate-100">
                    <span>Semester End Exams (SEE Theory)</span>
                    <strong className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Jan 18 – Feb 6, 2027</strong>
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-white/70 border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  VTU Passing & Attendance Thresholds
                </h4>
                <ul className="text-xs space-y-2.5 text-slate-700">
                  <li>
                    <strong>Mandatory Attendance: </strong>
                    <span className="text-indigo-800 font-bold">85% minimum</span> aggregate in each course (VTU Clause 8.1).
                  </li>
                  <li>
                    <strong>Medical Condonation: </strong>
                    Up to 10% (75% to 84%) allowed by Principal on genuine medical certificate submitted within 3 days.
                  </li>
                  <li>
                    <strong>CIE Qualifying Marks: </strong>
                    Minimum 40% (20 out of 50 marks) in CIE to qualify for SEE.
                  </li>
                  <li>
                    <strong>SEE Minimum Passing Marks: </strong>
                    Minimum 35% in SEE exam and 40% overall aggregate.
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => onStartChatQuery("When are the CIE and SEE exams scheduled?")}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              Ask Mitra AI about Exam Dates
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* WORKFLOW 3: SCHOLARSHIPS */}
        {selectedWorkflow === 'scholarship' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/50">
                Student Welfare • Financial Assistance
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2">
                State (SSP) & National (NSP) Scholarship Assistance
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/70 border border-slate-200 space-y-2 text-xs text-slate-700">
                <h4 className="text-sm font-bold text-slate-900">Karnataka SSP Post-Matric</h4>
                <p>Eligible for SC/ST, Cat-1, 2A/2B/3A/3B, and minority students domiciled in Karnataka.</p>
                <div className="pt-2 font-semibold text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  ⚠️ Bank account must be Aadhaar seeded via NPCI mapping.
                </div>
                <div className="text-slate-500 pt-1">Desk Officer: Smt. Anitha K., Room 104 (Admin Block)</div>
              </div>

              <div className="p-5 rounded-2xl bg-white/70 border border-slate-200 space-y-2 text-xs text-slate-700">
                <h4 className="text-sm font-bold text-slate-900">AICTE Pragati & Central NSP</h4>
                <p>AICTE Pragati scholarship provides ₹50,000 per year for admitted female engineering students.</p>
                <div className="text-slate-500">Family annual income must be below ₹8 Lakhs per annum.</div>
                <div className="text-slate-500">Submit physical prints to college coordinator within 7 days of online submission.</div>
              </div>
            </div>

            <button
              onClick={() => onStartChatQuery("What is the SSP scholarship application process and deadline?")}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              Ask Mitra AI for Scholarship Guidelines
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* WORKFLOW 4: DEPARTMENT CONTACTS WITH INSTANT SEARCH */}
        {selectedWorkflow === 'contacts' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/50">
                  Directory & Administrative Chambers
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  Department Heads & Key Administrative Contacts
                </h3>
              </div>

              {/* Instant Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Filter by name, CSE, ISE..."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl pl-8 pr-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              {filteredContacts.map((c, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/70 border border-slate-200 space-y-1 hover:border-indigo-300 transition-colors shadow-2xs">
                  <div className="font-bold text-slate-900 text-sm">{c.title}</div>
                  <div className="text-slate-700 font-semibold">{c.name}</div>
                  <div className="text-slate-500">{c.location}</div>
                  <div className="text-indigo-700 font-mono text-[11px] pt-1">{c.email}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onStartChatQuery("Who is the HoD of CSE and where is the department office?")}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              Ask Mitra AI for Contact Numbers
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>

    </div>
  );
};


