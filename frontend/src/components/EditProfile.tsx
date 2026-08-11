import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, MapPin, Camera, Trash2 } from 'lucide-react';

export interface ProfileData {
    fullName: string;
    email: string;
    title: string;
    phone: string;
    location: string;
    bio: string;
    age: string;
    gender: string;
    avatarUrl: string;
    lastUpdated: string;
}

interface EditProfileProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: ProfileData;
    onSave: (data: ProfileData) => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({
    isOpen,
    onClose,
    initialData,
    onSave
}) => {
    const [formData, setFormData] = useState<ProfileData>(initialData);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be under 2MB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData((prev) => ({ ...prev, avatarUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleAvatarDelete = (e: React.MouseEvent) => {
        e.stopPropagation(); // prevent opening file picker
        setFormData((prev) => ({ ...prev, avatarUrl: '' }));
    };

    const initials = formData.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'P';

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setFormData(initialData));
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    {/* Backdrop Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 backdrop-blur-[1px] bg-black/20 dark:bg-black/60"
                    />

                    {/* Modal Container */}
                    <div className="relative w-full max-w-4xl z-[101] my-auto pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300, mass: 0.8 }}
                            className="pointer-events-auto w-full rounded-[24px] shadow-[0_8px_10px_rgb(0,0,0,0.04)] border overflow-hidden 
                                     bg-[#F5F5F7] border-[#f0f0f0] 
                                     dark:bg-[#1C1C1E] dark:border-[#2C2C2E]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 md:px-8">
                                <h2 className="text-[18px] font-semibold text-[#010101] dark:text-white">Edit your profile</h2>
                                <button title='close' onClick={onClose} className="text-[#a0a0a0] hover:text-gray-400 transition-colors p-1">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex flex-col md:flex-row border-t-[1.6px] border-b-[1.6px] rounded-[18px] 
                                          border-[#EAE9F2] bg-white 
                                          dark:border-[#3A3A3C] dark:bg-[#2C2C2E]">

                                {/* Form Section */}
                                <div className="flex-1 p-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-[#706f6f] dark:text-[#A1A1A6]">Full name</label>
                                        <input title='fullname'
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-[14px] border-[1.5px] outline-none transition-all text-[15px] font-semibold
                                                     bg-white border-[#DFDDE6] text-[#131313] focus:border-black
                                                     dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-white dark:focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-[#706f6f] dark:text-[#A1A1A6]">Email</label>
                                        <input title='email'
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-[14px] border-[1.5px] outline-none font-semibold transition-all text-[15px]
                                                     bg-white border-[#DFDDE6] text-[#131313] focus:border-black
                                                     dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-white dark:focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-[14px] font-medium text-[#706f6f] dark:text-[#A1A1A6]">Phone</label>
                                            <input title='phone'
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+1 (555) 000-0000"
                                                className="w-full px-4 py-2.5 rounded-[14px] border-[1.5px] outline-none transition-all text-[15px] font-semibold
                                                         bg-white border-[#DFDDE6] text-[#131313] focus:border-black
                                                         dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-white dark:focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-[14px] font-medium text-[#706f6f] dark:text-[#A1A1A6]">Location</label>
                                            <input title='location'
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                placeholder="City, Country"
                                                className="w-full px-4 py-2.5 rounded-[14px] border-[1.5px] outline-none transition-all text-[15px] font-semibold
                                                         bg-white border-[#DFDDE6] text-[#131313] focus:border-black
                                                         dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-white dark:focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-[14px] font-medium text-[#706f6f] dark:text-[#A1A1A6]">Age</label>
                                            <input title='age'
                                                name="age"
                                                type="number"
                                                value={formData.age}
                                                onChange={handleChange}
                                                placeholder="25"
                                                className="w-full px-4 py-2.5 rounded-[14px] border-[1.5px] outline-none transition-all text-[15px] font-semibold
                                                         bg-white border-[#DFDDE6] text-[#131313] focus:border-black
                                                         dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-white dark:focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-[14px] font-medium text-[#706f6f] dark:text-[#A1A1A6]">Gender</label>
                                            <select title='gender'
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 rounded-[14px] border-[1.5px] appearance-none outline-none text-[15px] font-semibold
                                                         bg-white border-[#DFDDE6] text-[#131313] focus:border-black
                                                         dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-white dark:focus:border-blue-500"
                                            >
                                                <option>Prefer not to say</option>
                                                <option>Male</option>
                                                <option>Female</option>
                                                <option>Non-binary</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-[#706f6f] dark:text-[#A1A1A6]">Bio</label>
                                        <textarea
                                            title='bio'
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="Tell us a bit about yourself..."
                                            className="w-full px-4 py-2.5 rounded-[14px] border-[1.5px] outline-none transition-all text-[15px] font-semibold resize-none
                                                     bg-white border-[#DFDDE6] text-[#131313] focus:border-black
                                                     dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-white dark:focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="w-full h-[1.6px] md:h-auto md:w-[1.6px] border-t md:border-t-0 md:border-l border-dashed border-[#E9E8EB] dark:border-[#48484A]" />

                                {/* Preview Section */}
                                <div className="flex-1 p-8 px-6 flex flex-col items-center justify-center">
                                    <span className="text-[14px] font-medium mb-4 text-[#706f6f] dark:text-[#A1A1A6]">Preview</span>
                                    <div className="relative mb-4 group/avatar cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={handleAvatarChange}
                                            className="hidden"
                                        />
                                        {formData.avatarUrl && !formData.avatarUrl.includes('watermelon') ? (
                                            <img
                                                src={formData.avatarUrl}
                                                alt="Avatar"
                                                className="w-32 h-32 rounded-full object-cover shadow-sm ring-1 ring-[#f0f0f0] dark:ring-[#48484A] group-hover/avatar:brightness-75 transition-all"
                                            />
                                        ) : (
                                            <div className="w-32 h-32 rounded-full bg-[#F7F7F8] border border-[#EAEAEC] flex items-center justify-center font-serif text-4xl text-[#111111] shadow-sm group-hover/avatar:bg-[#EAEAEC] transition-all">
                                                {initials}
                                            </div>
                                        )}
                                        <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity bg-black/30">
                                            <Camera size={24} className="text-white" />
                                        </div>
                                        {formData.avatarUrl && !formData.avatarUrl.includes('watermelon') ? (
                                            <div className="absolute bottom-0 right-0 flex items-center gap-1">
                                                <button 
                                                    type="button" 
                                                    title='Delete photo' 
                                                    onClick={handleAvatarDelete}
                                                    className="p-2 rounded-full shadow-md border 
                                                             bg-white border-[#f0f0f0] text-red-500
                                                             dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-red-400
                                                             hover:bg-red-50 transition-colors z-10"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button type="button" title='Change photo' className="p-2 rounded-full shadow-md border 
                                                                             bg-white border-[#f0f0f0] text-[#707070]/70
                                                                             dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-gray-300
                                                                             hover:bg-[#f0f0f0] transition-colors z-10">
                                                    <Pencil size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button type="button" title='Add photo' className="absolute bottom-0 right-0 p-2 rounded-full shadow-md border 
                                                                         bg-white border-[#f0f0f0] text-[#707070]/70
                                                                         dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-gray-300
                                                                         hover:bg-[#f0f0f0] transition-colors z-10">
                                                <Pencil size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <h3 className="text-[18px] font-bold text-[#101010] dark:text-white text-center">{formData.fullName}</h3>
                                    <p className="text-[14px] mb-4 text-[#777678] dark:text-[#A1A1A6] text-center">{formData.title}</p>
                                    {formData.location && (
                                        <div className="flex items-center gap-2 px-3 shadow-sm py-1 rounded-full text-[12px] font-medium 
                                                     bg-[#F7F7F9] text-[#101010]/60 
                                                     dark:bg-[#3A3A3C] dark:text-[#A1A1A6]">
                                            <MapPin size={12} className="text-[#777678] dark:text-[#A1A1A6]" />
                                            <span>{formData.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-5 md:px-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 bg-[#F5F5F7] dark:bg-[#1C1C1E]">
                                <span className="text-[13px] text-[#767578]">
                                    Last updated: <span className="font-medium">{formData.lastUpdated}</span>
                                </span>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 sm:flex-none px-5 py-2 rounded-full text-[14px] border-[1.6px] font-bold transition-colors
                                                 bg-[#f3f4f6] border-[#E2E2E6] text-[#0F0F0F]
                                                 dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => onSave(formData)}
                                        className="flex-1 sm:flex-none px-5 py-2 rounded-full text-[13px] font-bold transition-colors shadow-lg shadow-black/10
                                                 bg-[#0F0F0F] text-white hover:bg-[#222]
                                                 dark:bg-white dark:text-black dark:hover:bg-[#E5E5E7]"
                                    >
                                        Save changes
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};
