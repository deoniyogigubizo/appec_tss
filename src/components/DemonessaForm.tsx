'use client';

import React, { useState } from 'react';
import { 
  User, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Building,
  Award,
  Send
} from 'lucide-react';

interface FormData {
  fullname: string;
  email: string;
  examinationCode: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  previousSchool: string;
  admittedSchool: string;
  admittedTrade: string;
  level: string;
  program: string;
  result: {
    marks: {
      biology: string;
      math: string;
      kinyarwanda: string;
      chemistry: string;
      history: string;
      geography: string;
      english: string;
      entrepreneurship: string;
      physics: string;
    };
  };
}

interface DemonessaFormProps {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  compact?: boolean;
}

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User, description: 'Basic details' },
  { id: 2, title: 'Student Details', icon: GraduationCap, description: 'Background' },
  { id: 3, title: 'Academic', icon: BookOpen, description: 'Trade & Level' },
  { id: 4, title: 'Marks', icon: ClipboardList, description: 'Subject scores' },
  { id: 5, title: 'Review', icon: CheckCircle, description: 'Submit' },
];

export default function DemonessaForm({ onSuccess, onError, compact = false }: DemonessaFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullname: '',
    email: '',
    examinationCode: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    previousSchool: '',
    admittedSchool: '',
    admittedTrade: '',
    level: '',
    program: '',
    result: {
      marks: {
        biology: '',
        math: '',
        kinyarwanda: '',
        chemistry: '',
        history: '',
        geography: '',
        english: '',
        entrepreneurship: '',
        physics: '',
      },
    },
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitData, setSubmitData] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Handle nested mark fields
    if (name.startsWith('mark_')) {
      const subject = name.replace('mark_', '');
      // Validate: only allow 0-100
      let markValue = value;
      if (value !== '' && !isNaN(Number(value))) {
        const numValue = Number(value);
        if (numValue > 100) markValue = '100';
        if (numValue < 0) markValue = '0';
      }
      setFormData({
        ...formData,
        result: {
          ...formData.result,
          marks: {
            ...formData.result.marks,
            [subject]: markValue,
          },
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullname.trim()) newErrors.fullname = 'Full name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
      if (!formData.examinationCode.trim()) newErrors.examinationCode = 'Examination code is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    }

    if (step === 2) {
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.nationality.trim()) newErrors.nationality = 'Nationality is required';
      if (!formData.previousSchool.trim()) newErrors.previousSchool = 'Previous school is required';
    }

    if (step === 3) {
      if (!formData.admittedTrade) newErrors.admittedTrade = 'Trade is required';
      if (!formData.level) newErrors.level = 'Level is required';
    }

    if (step === 4) {
      const subjects = ['biology', 'math', 'kinyarwanda', 'chemistry', 'history', 'geography', 'english', 'entrepreneurship', 'physics'];
      for (const subject of subjects) {
        const markValue = formData.result.marks[subject as keyof typeof formData.result.marks];
        if (!markValue || markValue === '') {
          newErrors[`mark_${subject}`] = `${subject} mark is required`;
        } else if (Number(markValue) < 0 || Number(markValue) > 100) {
          newErrors[`mark_${subject}`] = `${subject} mark must be between 0 and 100`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation - ensure all marks are 0-100
    const subjects = ['biology', 'math', 'kinyarwanda', 'chemistry', 'history', 'geography', 'english', 'entrepreneurship', 'physics'];
    const convertedMarks: Record<string, number> = {};
    
    for (const subject of subjects) {
      const markValue = formData.result.marks[subject as keyof typeof formData.result.marks];
      if (!markValue || markValue === '') {
        setError(`Please enter ${subject} mark`);
        setCurrentStep(4);
        return;
      }
      const numValue = Number(markValue);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        setError(`${subject} mark must be between 0 and 100`);
        setCurrentStep(4);
        return;
      }
      convertedMarks[subject] = numValue;
    }
    
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Prepare submission data with numeric marks
      const submissionData = {
        ...formData,
        result: {
          marks: convertedMarks
        }
      };

      console.log('Submitting demonessa form data:', submissionData);

      const response = await fetch('/api/demonessa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();
      console.log('API Response:', result);

      if (result.success) {
        setMessage('Record created successfully!');
        setSubmitData(result.data);
        setCurrentStep(5);
        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        const errorMsg = result.error || 'Failed to create record';
        setError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred';
      setError(errorMsg);
      console.error('Error:', err);
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const marks = formData.result.marks;
    const subjectMarks = [
      Number(marks.biology) || 0,
      Number(marks.math) || 0,
      Number(marks.kinyarwanda) || 0,
      Number(marks.chemistry) || 0,
      Number(marks.history) || 0,
      Number(marks.geography) || 0,
      Number(marks.english) || 0,
      Number(marks.entrepreneurship) || 0,
      Number(marks.physics) || 0,
    ];
    const total = subjectMarks.reduce((a, b) => a + b, 0);
    const filledCount = subjectMarks.filter(m => m > 0).length;
    const average = filledCount > 0 ? total / filledCount : 0;
    const percentage = (total / 900) * 100;
    const status = percentage >= 50 ? 'PASS' : 'FAIL';

    return { total, average, percentage: percentage.toFixed(2), status };
  };

  const stats = calculateStats();

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-gradient-to-r from-blue-600 to-purple-600 -z-10 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          
          return (
            <div key={step.id} className="flex flex-col items-center">
              <div 
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
                  ${isActive ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white scale-110' : ''}
                  ${isCompleted ? 'bg-green-500 text-white' : 'bg-white text-gray-400 border-2 border-gray-200'}
                `}
              >
                {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`mt-2 text-xs font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderInput = (
    name: string,
    label: string,
    type: string = 'text',
    placeholder: string = '',
    options?: { value: string; label: string }[],
    icon?: React.ReactNode
  ) => (
    <div className="relative">
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        {options ? (
          <select
            name={name}
            value={formData[name as keyof FormData] as string}
            onChange={handleChange}
            className={`
              w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 appearance-none
              bg-white text-gray-800
              ${errors[name] ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'}
              ${icon ? 'pl-11' : ''}
            `}
          >
            <option value="">{placeholder || `Select ${label}`}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            value={formData[name as keyof FormData] as string}
            onChange={handleChange}
            placeholder={placeholder}
            className={`
              w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
              bg-white text-gray-800 placeholder-gray-400
              ${errors[name] ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'}
              ${icon ? 'pl-11' : ''}
            `}
          />
        )}
      </div>
      {errors[name] && (
        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
          <span className="w-1 h-1 bg-red-500 rounded-full"></span>
          {errors[name]}
        </p>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
              <p className="text-gray-500 mt-1">Enter your basic details to get started</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderInput('fullname', 'Full Name', 'text', 'Enter your full name', undefined, <User className="w-5 h-5" />)}
              {renderInput('email', 'Email Address', 'email', 'your.email@example.com', undefined, <Mail className="w-5 h-5" />)}
              {renderInput('examinationCode', 'Examination Code', 'text', 'e.g., EXAM2026001', undefined, <Award className="w-5 h-5" />)}
              {renderInput('phone', 'Phone Number', 'tel', '+250 7XX XXX XXX', undefined, <Phone className="w-5 h-5" />)}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Student Details</h2>
              <p className="text-gray-500 mt-1">Tell us about your background</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderInput('address', 'Address', 'text', 'Your current address', undefined, <MapPin className="w-5 h-5" />)}
              {renderInput('dateOfBirth', 'Date of Birth', 'date', '', undefined, <Calendar className="w-5 h-5" />)}
              {renderInput('gender', 'Gender', '', 'Select gender', [
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ])}
              {renderInput('nationality', 'Nationality', 'text', 'Your nationality', undefined, <Globe className="w-5 h-5" />)}
              {renderInput('previousSchool', 'Previous School', 'text', 'Last attended school', undefined, <Building className="w-5 h-5" />)}
              {renderInput('admittedSchool', 'Admitted School', 'text', 'School name (optional)')}
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Academic Information</h2>
              <p className="text-gray-500 mt-1">Select your trade and level</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderInput('admittedTrade', 'Trade / Department', '', 'Select trade', [
                { value: 'SWD', label: 'Software Development (SWD)' },
                { value: 'ACC', label: 'Accounting (ACC)' },
                { value: 'BDC', label: 'Business Development (BDC)' },
                { value: 'CSA', label: 'Computer Systems & Architecture (CSA)' },
              ])}
              {renderInput('level', 'Level', '', 'Select level', [
                { value: 'L3', label: 'Level 3' },
                { value: 'L4', label: 'Level 4' },
                { value: 'L5', label: 'Level 5' },
              ])}
              {renderInput('program', 'Program (Optional)', 'text', 'Specific program name')}
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Subject Marks</h2>
              <p className="text-gray-500 mt-1">Enter your marks for each subject (out of 100)</p>
            </div>
            
            {/* Stats Preview */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Total</p>
                  <p className="text-xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Average</p>
                  <p className="text-xl font-bold text-purple-600">{stats.average.toFixed(1)}</p>
                </div>
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Percentage</p>
                  <p className="text-xl font-bold text-indigo-600">{stats.percentage}%</p>
                </div>
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <p className={`text-xl font-bold ${stats.status === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.status}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'biology', label: 'Biology' },
                { key: 'math', label: 'Mathematics' },
                { key: 'kinyarwanda', label: 'Kinyarwanda' },
                { key: 'chemistry', label: 'Chemistry' },
                { key: 'history', label: 'History' },
                { key: 'geography', label: 'Geography' },
                { key: 'english', label: 'English' },
                { key: 'entrepreneurship', label: 'Entrepreneurship' },
                { key: 'physics', label: 'Physics' },
              ].map((subject) => (
                <div key={subject.key} className="bg-white rounded-xl p-4 border-2 border-gray-100 hover:border-blue-300 transition-all">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {subject.label}
                  </label>
                  <input
                    type="number"
                    name={`mark_${subject.key}`}
                    min="0"
                    max="100"
                    value={formData.result.marks[subject.key as keyof typeof formData.result.marks]}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-center text-lg font-semibold text-gray-800"
                    placeholder="0-100"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Review & Submit</h2>
              <p className="text-gray-500 mt-1">Please review your information before submitting</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                {error}
              </div>
            )}

            {message && submitData ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">Submitted Successfully!</h3>
                <p className="text-gray-600 mb-6">Your record has been saved to the database.</p>
                <div className="bg-gray-50 rounded-xl p-4 text-left max-h-60 overflow-y-auto">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(submitData, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Personal Info Review */}
                <div className="bg-white rounded-xl p-5 border-2 border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Name:</span> <span className="font-medium">{formData.fullname}</span></div>
                    <div><span className="text-gray-500">Email:</span> <span className="font-medium">{formData.email}</span></div>
                    <div><span className="text-gray-500">Exam Code:</span> <span className="font-medium">{formData.examinationCode}</span></div>
                    <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{formData.phone}</span></div>
                  </div>
                </div>

                {/* Student Details Review */}
                <div className="bg-white rounded-xl p-5 border-2 border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-purple-600" /> Student Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Address:</span> <span className="font-medium">{formData.address}</span></div>
                    <div><span className="text-gray-500">DOB:</span> <span className="font-medium">{formData.dateOfBirth}</span></div>
                    <div><span className="text-gray-500">Gender:</span> <span className="font-medium capitalize">{formData.gender}</span></div>
                    <div><span className="text-gray-500">Nationality:</span> <span className="font-medium">{formData.nationality}</span></div>
                    <div><span className="text-gray-500">Previous School:</span> <span className="font-medium">{formData.previousSchool}</span></div>
                    {formData.admittedSchool && <div><span className="text-gray-500">Admitted School:</span> <span className="font-medium">{formData.admittedSchool}</span></div>}
                  </div>
                </div>

                {/* Academic Review */}
                <div className="bg-white rounded-xl p-5 border-2 border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" /> Academic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Trade:</span> <span className="font-medium">{formData.admittedTrade}</span></div>
                    <div><span className="text-gray-500">Level:</span> <span className="font-medium">{formData.level}</span></div>
                    {formData.program && <div><span className="text-gray-500">Program:</span> <span className="font-medium">{formData.program}</span></div>}
                  </div>
                </div>

                {/* Marks Review */}
                <div className="bg-white rounded-xl p-5 border-2 border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-green-600" /> Subject Marks
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                    {Object.entries(formData.result.marks).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 rounded-lg p-2 text-center">
                        <span className="text-gray-500 capitalize text-xs">{key}</span>
                        <p className="font-bold text-gray-800">{value || '0'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                    <div className="text-center"><span className="text-gray-500 text-xs">Total</span><p className="font-bold text-blue-600">{stats.total}</p></div>
                    <div className="text-center"><span className="text-gray-500 text-xs">Average</span><p className="font-bold text-purple-600">{stats.average.toFixed(1)}</p></div>
                    <div className="text-center"><span className="text-gray-500 text-xs">%</span><p className="font-bold text-indigo-600">{stats.percentage}%</p></div>
                    <div className="text-center"><span className="text-gray-500 text-xs">Status</span><p className={`font-bold ${stats.status === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>{stats.status}</p></div>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit & Save to Database
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  if (compact) {
    return <>{renderStepContent()}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-6 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-3">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Demonessa System
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Student Registration & Marks Entry</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Step Indicator */}
          <div className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 p-4 sm:p-6 border-b border-gray-100">
            {renderStepIndicator()}
          </div>

          {/* Form Content */}
          <div className="p-4 sm:p-8">
            <form onSubmit={handleSubmit}>
              {renderStepContent()}

              {/* Navigation Buttons */}
              {currentStep < 5 && (
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className={`
                      flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200
                      ${currentStep === 1 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}
                    `}
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                  </button>
                  
                  {currentStep === 4 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Review
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Next Step
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Success - Show reset button */}
              {currentStep === 5 && message && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      setFormData({
                        fullname: '',
                        email: '',
                        examinationCode: '',
                        phone: '',
                        address: '',
                        dateOfBirth: '',
                        gender: '',
                        nationality: '',
                        previousSchool: '',
                        admittedSchool: '',
                        admittedTrade: '',
                        level: '',
                        program: '',
                        result: {
                          marks: {
                            biology: '',
                            math: '',
                            kinyarwanda: '',
                            chemistry: '',
                            history: '',
                            geography: '',
                            english: '',
                            entrepreneurship: '',
                            physics: '',
                          },
                        },
                      });
                      setSubmitData(null);
                      setMessage('');
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                  >
                    Submit Another Record
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-6">
          APPEC TSS • Advanced Professional Technical & Science School
        </p>
      </div>
    </div>
  );
}
