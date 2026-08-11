'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/BackButton';
import { EditProfile, ProfileData } from '@/components/EditProfile';

export default function ProfilePage() {
  const router = useRouter();
  const [role, setRole] = useState('Developer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  
  // New user details
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // New modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Today');

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    const storedEmail = localStorage.getItem('email');
    const storedName = localStorage.getItem('name');
    const storedAge = localStorage.getItem('age');
    const storedGender = localStorage.getItem('gender');
    
    // Load new details
    const storedLocation = localStorage.getItem('location');
    const storedPhone = localStorage.getItem('phone');
    const storedTitle = localStorage.getItem('title');
    const storedBio = localStorage.getItem('bio');
    const storedAvatarUrl = localStorage.getItem('avatarUrl');
    const storedLastUpdated = localStorage.getItem('lastUpdated');
    
    if (!storedRole) {
      router.push('/login');
    } else {
      setRole(storedRole);
      if (storedEmail) setEmail(storedEmail);
      if (storedName) setName(storedName);
      if (storedAge) setAge(storedAge);
      if (storedGender) setGender(storedGender);
      
      if (storedLocation) setLocation(storedLocation);
      if (storedPhone) setPhone(storedPhone);
      if (storedTitle) setTitle(storedTitle);
      if (storedBio) setBio(storedBio);
      if (storedAvatarUrl) setAvatarUrl(storedAvatarUrl);
      if (storedLastUpdated) setLastUpdated(storedLastUpdated);
    }
  }, [router]);

  const handleSaveModal = (data: ProfileData) => {
    setName(data.fullName);
    setEmail(data.email);
    setTitle(data.title);
    setPhone(data.phone);
    setLocation(data.location);
    setBio(data.bio);
    setAge(data.age);
    setGender(data.gender);
    setAvatarUrl(data.avatarUrl);
    
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setLastUpdated(now);
    
    localStorage.setItem('name', data.fullName);
    localStorage.setItem('email', data.email);
    localStorage.setItem('title', data.title);
    localStorage.setItem('phone', data.phone);
    localStorage.setItem('location', data.location);
    localStorage.setItem('bio', data.bio);
    localStorage.setItem('age', data.age);
    localStorage.setItem('gender', data.gender);
    localStorage.setItem('avatarUrl', data.avatarUrl);
    localStorage.setItem('lastUpdated', now);
    
    setIsEditModalOpen(false);
  };

  const initialProfileData: ProfileData = {
    fullName: name || 'Your Name',
    email: email || 'your.email@example.com',
    title: title || '',
    phone: phone || '',
    location: location || '',
    bio: bio || '',
    age: age || '',
    gender: gender || 'Prefer not to say',
    avatarUrl: avatarUrl || '',
    lastUpdated: lastUpdated
  };

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center p-6 bg-[#FAFAFA] relative overflow-hidden">
      {/* Very subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      
      <div className="w-full max-w-4xl relative z-10 my-10">
        <BackButton label="Back to Dashboard" href="/dashboard" className="mb-4" />
        <div className="bg-[#FFFFFF] border border-[#EAEAEC] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.06)] rounded-[24px] p-10 md:p-14 overflow-hidden relative">
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 pb-10 border-b border-[#F0F0F0]">
            <div className="w-28 h-28 rounded-full bg-[#F7F7F8] border border-[#EAEAEC] text-[#111111] flex items-center justify-center font-serif text-4xl shadow-sm shrink-0 overflow-hidden relative group">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="relative z-10">{name ? name.charAt(0).toUpperCase() : 'P'}</span>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left pt-2">
              <h1 className="text-4xl font-serif text-[#111111] tracking-tight mb-2">{name || 'Your Profile'}</h1>
              <p className="text-[#666666] font-light tracking-wide text-lg mb-4">{title ? `${title} · ${email}` : email || 'Manage your account settings'}</p>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#F7F7F8] border border-[#EAEAEC] rounded-full">
                <span className="text-[12px] text-[#444444] font-medium uppercase tracking-[0.15em]">{role}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 relative z-10">
            {/* Row 1 */}
            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-[0.2em]">Full Name</label>
              <div className="w-full px-0 py-3 border-b-2 border-[#EAEAEC] bg-transparent text-[#111111] text-[15px] font-medium min-h-[50px]">
                {name || '—'}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-[0.2em]">Email Address</label>
              <div className="w-full px-0 py-3 border-b-2 border-[#EAEAEC] bg-transparent text-[#111111] text-[15px] font-medium min-h-[50px]">
                {email || '—'}
              </div>
            </div>

            {/* Row 2 */}
            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-[0.2em]">Job Title</label>
              <div className="w-full px-0 py-3 border-b-2 border-[#EAEAEC] bg-transparent text-[#111111] text-[15px] font-medium min-h-[50px]">
                {title || '—'}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-[0.2em]">System Role</label>
              <div className="w-full px-0 py-3 border-b-2 border-[#EAEAEC] bg-transparent text-[#111111] text-[15px] font-medium min-h-[50px]">
                {role}
              </div>
            </div>
            
            {/* Row 3: Personal Details */}
            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-[0.2em]">Phone</label>
              <div className="w-full px-0 py-3 border-b-2 border-[#EAEAEC] bg-transparent text-[#111111] text-[15px] font-medium min-h-[50px]">
                {phone || '—'}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-[0.2em]">Location</label>
              <div className="w-full px-0 py-3 border-b-2 border-[#EAEAEC] bg-transparent text-[#111111] text-[15px] font-medium min-h-[50px]">
                {location || '—'}
              </div>
            </div>

            {/* Row 4 */}
            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-[0.2em]">Age</label>
              <div className="w-full px-0 py-3 border-b-2 border-[#EAEAEC] bg-transparent text-[#111111] text-[15px] font-medium min-h-[50px]">
                {age || '—'}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-[0.2em]">Gender</label>
              <div className="w-full px-0 py-3 border-b-2 border-[#EAEAEC] bg-transparent text-[#111111] text-[15px] font-medium min-h-[50px]">
                {gender || '—'}
              </div>
            </div>

            {/* Row 5: Bio (full width) */}
            <div className="space-y-3 md:col-span-2">
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-[0.2em]">Bio</label>
              <div className="w-full px-0 py-3 border-b-2 border-[#EAEAEC] bg-transparent text-[#111111] text-[15px] font-medium min-h-[50px]">
                {bio || '—'}
              </div>
            </div>
          </div>
          
          <div className="mt-14 flex flex-col sm:flex-row justify-end gap-4 relative z-10">
            <button onClick={() => setIsEditModalOpen(true)} className="px-10 py-4 rounded-[12px] bg-[#111111] text-white hover:bg-[#333333] transition-all duration-300 text-[13px] font-medium tracking-wide shadow-lg uppercase">
              Edit Details
            </button>
          </div>
        </div>
      </div>
      
      <EditProfile 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={initialProfileData}
        onSave={handleSaveModal}
      />
    </div>
  );
}
