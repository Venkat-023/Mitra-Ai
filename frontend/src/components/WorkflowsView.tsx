import React, { useState } from 'react';
import { 
  FileCheck, Calendar, Award, PhoneCall, CheckCircle2, ArrowRight,
  Building, Clock
} from 'lucide-react';

interface WorkflowProps {
  onStartChatQuery: (query: string) => void;
}

export const WorkflowsView: React.FC<WorkflowProps> = ({ onStartChatQuery }) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<'bonafide' | 'calendar' | 'scholarship' | 'contacts'>('bonafide');

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 overflow-y-auto">
      
      {/* Title & Introduction */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          RVITM Procedural Campus Services
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Step-by-step guidance derived directly from approved institutional circulars.
        </p>
      </div>

      {/* Workflow Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <button
          onClick={() => setSelectedWorkflow('bonafide')}
          className={`p-4 rounded-xl text-left border transition-all ${
            selectedWorkflow === 'bonafide'
              ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-900/20'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileCheck className={`w-6 h-6 mb-2 ${selectedWorkflow === 'bonafide' ? 'text-blue-400' : 'text-slate-400'}`} />
          <div className="font-semibold text-sm">Bonafide Certificate</div>
          <div className="text-xs text-slate-400 mt-1">Application procedure</div>
        </button>

        <button
          onClick={() => setSelectedWorkflow('calendar')}
          className={`p-4 rounded-xl text-left border transition-all ${
            selectedWorkflow === 'calendar'
              ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-900/20'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Calendar className={`w-6 h-6 mb-2 ${selectedWorkflow === 'calendar' ? 'text-blue-400' : 'text-slate-400'}`} />
          <div className="font-semibold text-sm">Exam & CIE Dates</div>
          <div className="text-xs text-slate-400 mt-1">Academic calendar 2026</div>
        </button>

        <button
          onClick={() => setSelectedWorkflow('scholarship')}
          className={`p-4 rounded-xl text-left border transition-all ${
            selectedWorkflow === 'scholarship'
              ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-900/20'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Award className={`w-6 h-6 mb-2 ${selectedWorkflow === 'scholarship' ? 'text-blue-400' : 'text-slate-400'}`} />
          <div className="font-semibold text-sm">Scholarships & SSP</div>
          <div className="text-xs text-slate-400 mt-1">State & central schemes</div>
        </button>

        <button
          onClick={() => setSelectedWorkflow('contacts')}
          className={`p-4 rounded-xl text-left border transition-all ${
            selectedWorkflow === 'contacts'
              ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-900/20'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <PhoneCall className={`w-6 h-6 mb-2 ${selectedWorkflow === 'contacts' ? 'text-blue-400' : 'text-slate-400'}`} />
          <div className="font-semibold text-sm">Campus Directory</div>
          <div className="text-xs text-slate-400 mt-1">HoDs & Administration</div>
        </button>
      </div>

      {/* Active Workflow Content */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl animate-fade-in">
        
        {/* WORKFLOW 1: BONAFIDE CERTIFICATE */}
        {selectedWorkflow === 'bonafide' && (
          <div className="space-y-6">
            <div className="border-b border-slate-700 pb-4">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Procedural Guide • Academic Affairs
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                How to Apply for an Official Bonafide / Study Certificate
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                Issued for bank education loans, passport applications, scholarship portals (SSP/NSP), and bus passes.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Mandatory Application Checklist
                </h4>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                    <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                    <div>
                      <div className="text-sm font-semibold text-white">Download or Collect Application Form</div>
                      <p className="text-xs text-slate-400 mt-0.5">Collect from Counter No. 2 (Administrative Block, Ground Floor) between 10:00 AM and 1:00 PM, or download via student ERP.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                    <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">2</span>
                    <div>
                      <div className="text-sm font-semibold text-white">Attach Required Enclosures</div>
                      <p className="text-xs text-slate-400 mt-0.5">Attach photocopy of your Student Smart ID Card and latest semester fee receipt.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                    <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">3</span>
                    <div>
                      <div className="text-sm font-semibold text-white">Proctor & HoD Recommendation</div>
                      <p className="text-xs text-slate-400 mt-0.5">Get the form countersigned by your Faculty Proctor and Head of Department.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                    <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">4</span>
                    <div>
                      <div className="text-sm font-semibold text-white">Submission & Collection</div>
                      <p className="text-xs text-slate-400 mt-0.5">Submit at Counter 2. Turnaround time is 2-3 working days. Collect between 2:30 PM and 4:30 PM with college ID.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Quick Details */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Office Details</h4>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>Counter No. 2, Admin Block</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>10:00 AM – 1:00 PM (Submission)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <PhoneCall className="w-4 h-4 text-slate-400" />
                    <span>+91-80-6815-5600 (Ext. 202)</span>
                  </div>
                </div>

                <button
                  onClick={() => onStartChatQuery("How do I apply for a Bonafide Certificate at RVITM?")}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  Ask Mitra AI for Detailed Bonafide Help
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WORKFLOW 2: ACADEMIC CALENDAR & EXAM SCHEDULE */}
        {selectedWorkflow === 'calendar' && (
          <div className="space-y-6">
            <div className="border-b border-slate-700 pb-4">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                VTU Regulations • Academic Year 2026-27
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Semester Timeline, CIE Tests & SEE Examination Schedule
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-3">
                <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Key Semester Milestones
                </h4>
                <ul className="text-xs space-y-2 text-slate-300">
                  <li className="flex justify-between py-1 border-b border-slate-800">
                    <span>Commencement of Classes</span>
                    <strong className="text-white">Sept 1, 2026</strong>
                  </li>
                  <li className="flex justify-between py-1 border-b border-slate-800">
                    <span>Continuous Internal Eval (CIE-1)</span>
                    <strong className="text-amber-300">Oct 12 – Oct 15, 2026</strong>
                  </li>
                  <li className="flex justify-between py-1 border-b border-slate-800">
                    <span>Continuous Internal Eval (CIE-2)</span>
                    <strong className="text-amber-300">Nov 23 – Nov 26, 2026</strong>
                  </li>
                  <li className="flex justify-between py-1 border-b border-slate-800">
                    <span>Last Working Day of Semester</span>
                    <strong className="text-white">Dec 24, 2026</strong>
                  </li>
                  <li className="flex justify-between py-1 border-b border-slate-800">
                    <span>Semester End Exams (SEE Theory)</span>
                    <strong className="text-emerald-400">Jan 18 – Feb 6, 2027</strong>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-3">
                <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  VTU Passing & Attendance Thresholds
                </h4>
                <ul className="text-xs space-y-2.5 text-slate-300">
                  <li>
                    <strong>Mandatory Attendance: </strong>
                    <span className="text-amber-300">85% minimum</span> aggregate in each course (VTU Clause 8.1).
                  </li>
                  <li>
                    <strong>Medical Condonation: </strong>
                    Up to 10% (75% to 84%) allowed by Principal on genuine medical certificate within 3 days.
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
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              Ask Mitra AI about Exam Dates
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* WORKFLOW 3: SCHOLARSHIPS */}
        {selectedWorkflow === 'scholarship' && (
          <div className="space-y-6">
            <div className="border-b border-slate-700 pb-4">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Student Welfare • Financial Assistance
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                State (SSP) & National (NSP) Scholarship Assistance
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700 space-y-2 text-xs text-slate-300">
                <h4 className="text-sm font-semibold text-white">Karnataka SSP Post-Matric</h4>
                <p>Eligible for SC/ST, Cat-1, 2A/2B/3A/3B, and minority students domiciled in Karnataka.</p>
                <div className="pt-2 font-medium text-amber-300">
                  ⚠️ Bank account must be Aadhaar seeded via NPCI mapping.
                </div>
                <div className="text-slate-400">Desk Officer: Smt. Anitha K., Room 104</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700 space-y-2 text-xs text-slate-300">
                <h4 className="text-sm font-semibold text-white">AICTE Pragati & Central NSP</h4>
                <p>AICTE Pragati scholarship provides Rs. 50,000 per year for admitted female students.</p>
                <div className="text-slate-400">Family annual income must be below Rs. 8 Lakhs.</div>
                <div className="text-slate-400">Submit physical prints to college coordinator within 7 days.</div>
              </div>
            </div>

            <button
              onClick={() => onStartChatQuery("What is the SSP scholarship application process and deadline?")}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              Ask Mitra AI for Scholarship Guidelines
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* WORKFLOW 4: DEPARTMENT CONTACTS */}
        {selectedWorkflow === 'contacts' && (
          <div className="space-y-6">
            <div className="border-b border-slate-700 pb-4">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Directory & Administrative Chambers
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Department Heads & Key Administrative Contacts
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700 space-y-1">
                <div className="font-semibold text-white text-sm">Principal's Office</div>
                <div className="text-slate-300">Dr. Malini M.</div>
                <div className="text-slate-400">Admin Block, Ground Floor</div>
                <div className="text-blue-400">principal@rvitm.edu.in</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700 space-y-1">
                <div className="font-semibold text-white text-sm">CSE Department (HoD)</div>
                <div className="text-slate-300">Dr. Latha Parthiban</div>
                <div className="text-slate-400">Academic Block A, Room A-301</div>
                <div className="text-blue-400">hod.cse@rvitm.edu.in</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700 space-y-1">
                <div className="font-semibold text-white text-sm">ISE Department (HoD)</div>
                <div className="text-slate-300">Dr. B. Sudarshan</div>
                <div className="text-slate-400">Academic Block A, Room A-401</div>
                <div className="text-blue-400">hod.ise@rvitm.edu.in</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700 space-y-1">
                <div className="font-semibold text-white text-sm">ECE Department (HoD)</div>
                <div className="text-slate-300">Dr. Girish V.</div>
                <div className="text-slate-400">Academic Block B, Room B-201</div>
                <div className="text-blue-400">hod.ece@rvitm.edu.in</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700 space-y-1">
                <div className="font-semibold text-white text-sm">Training & Placement (TPO)</div>
                <div className="text-slate-300">Prof. Anand Murthy</div>
                <div className="text-slate-400">Placement Auditorium Block</div>
                <div className="text-blue-400">placements@rvitm.edu.in</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700 space-y-1">
                <div className="font-semibold text-white text-sm">Anti-Ragging Squad Head</div>
                <div className="text-slate-300">Dr. Prashanth Kumar</div>
                <div className="text-slate-400">Helpline: 1800-180-5522</div>
                <div className="text-rose-400 font-semibold">Toll-free 24x7</div>
              </div>
            </div>

            <button
              onClick={() => onStartChatQuery("Who is the HoD of CSE and where is the department office?")}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
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
