'use client';

import { useState, useEffect } from 'react';

interface SellerContact {
    name: string;
    phone: string;
}

interface SellerInfoProps {
    contacts: SellerContact[];
    onContactsChange: (contacts: SellerContact[]) => void;
}

export default function SellerInfo({ contacts, onContactsChange }: SellerInfoProps) {
    const [localContacts, setLocalContacts] = useState<SellerContact[]>(contacts);

    useEffect(() => {
        setLocalContacts(contacts);
    }, [contacts]);

    const updateContact = (index: number, field: 'name' | 'phone', value: string) => {
        const updated = [...localContacts];
        updated[index] = { ...updated[index], [field]: value };
        setLocalContacts(updated);
        onContactsChange(updated);
    };

    const addContact = () => {
        if (localContacts.length < 7) {
            const updated = [...localContacts, { name: '', phone: '' }];
            setLocalContacts(updated);
            onContactsChange(updated);
        }
    };

    const removeContact = (index: number) => {
        const updated = localContacts.filter((_, i) => i !== index);
        setLocalContacts(updated);
        onContactsChange(updated);
    };

    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    };

    return (
        <div className="glass-card p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Seller Contacts</h3>
                        <p className="text-sm text-slate-400">{localContacts.length} of 7 contacts</p>
                    </div>
                </div>

                {localContacts.length < 7 && (
                    <button
                        onClick={addContact}
                        className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Contact List */}
            <div className="space-y-3">
                {localContacts.map((contact, index) => (
                    <div key={index} className="flex gap-2 items-start animate-fade-in">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                value={contact.name}
                                onChange={(e) => updateContact(index, 'name', e.target.value)}
                                placeholder={`Contact ${index + 1}`}
                                className="input-field text-sm py-2"
                            />
                            <input
                                type="tel"
                                value={contact.phone}
                                onChange={(e) => updateContact(index, 'phone', formatPhone(e.target.value))}
                                placeholder="(XXX) XXX-XXXX"
                                className="input-field text-sm py-2"
                            />
                        </div>
                        <button
                            onClick={() => removeContact(index)}
                            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors group"
                        >
                            <svg className="w-4 h-4 text-slate-500 group-hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}

                {localContacts.length === 0 && (
                    <button
                        onClick={addContact}
                        className="w-full p-4 rounded-xl border-2 border-dashed border-slate-600 hover:border-slate-500 transition-colors text-slate-400 hover:text-slate-300"
                    >
                        + Add first contact
                    </button>
                )}
            </div>
        </div>
    );
}
