import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';

const DEPARTMENTS = [
  'Computer Engineering (CSE)',
  'CSE (Cyber Security)',
  'Information Technology (IT)',
  'Electronics & Communication Engineering (ECE)',
  'Electronics Instrumentation & Control Engineering (EIC)',
  'Electrical Engineering (EE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Master of Computer Applications (MCA)',
  'Master of Business Administration (MBA)',
];

export default function EditProfileModal({ isOpen, onClose, currentProfile, onProfileUpdated, onNotification }) {
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    department: 'Computer Science & Engineering',
    semester: 7,
    enrollmentYear: 2023,
    interests: [],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentProfile) {
      setFormData({
        fullName: currentProfile.name || currentProfile.full_name || '',
        studentId: currentProfile.studentId || currentProfile.student_id || '',
        department: currentProfile.department || 'Computer Science & Engineering',
        semester: currentProfile.semester || 7,
        enrollmentYear: currentProfile.enrollment_year || 2023,
        interests: currentProfile.interests || [],
      });
    }
  }, [currentProfile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        full_name: formData.fullName,
        student_id: formData.studentId,
        department: formData.department,
        semester: Number(formData.semester),
        enrollment_year: Number(formData.enrollmentYear),
        interests: formData.interests,
      };

      const updated = await apiService.updateStudentProfile(payload);
      if (onProfileUpdated) {
        onProfileUpdated({
          name: updated.full_name || formData.fullName,
          email: updated.email,
          department: updated.department,
          studentId: updated.student_id,
          semester: updated.semester,
          enrollment_year: updated.enrollment_year,
          interests: updated.interests,
        });
      }
      if (onNotification) {
        onNotification('Academic profile updated successfully!');
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update profile. Please verify your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-600 via-indigo-600 to-teal-700 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-teal-200">badge</span>
            <div>
              <h2 className="text-lg font-bold">Student Profile Details</h2>
              <p className="text-xs text-teal-100">Official institutional record details verified with BTU</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-teal-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Full Name</span>
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">lock</span> Official Record
                </span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                readOnly
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-slate-50 cursor-not-allowed font-medium select-none"
                placeholder="Registered full name"
                title="Student name is locked to official college registration records"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Student ID / Roll No.</span>
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">lock</span> Official Record
                </span>
              </label>
              <input
                type="text"
                value={formData.studentId}
                readOnly
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-slate-50 cursor-not-allowed font-medium select-none"
                placeholder="e.g. 22ECA081"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Department / Branch</span>
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">lock</span> Locked
                </span>
              </label>
              <select
                value={formData.department}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-slate-50 cursor-not-allowed font-medium select-none"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Current Semester</span>
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">lock</span> Locked
                </span>
              </label>
              <select
                value={formData.semester}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-slate-50 cursor-not-allowed font-medium select-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-teal-600 text-lg shrink-0 mt-0.5">verified_user</span>
            <p className="leading-relaxed">
              Student details are synchronized with the Engineering College Ajmer & BTU Student Information System. To request a change in your registered records, contact the IT Helpdesk ECA.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">check</span>
                  Confirm & Sync
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
