
import React from 'react';

interface BaseProps {
    label?: string;
    className?: string;
}

interface InputProps extends BaseProps, React.InputHTMLAttributes<HTMLInputElement> {}
interface TextAreaProps extends BaseProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
interface SelectProps extends BaseProps, React.SelectHTMLAttributes<HTMLSelectElement> {
    options: { value: string; label: string }[];
}

const baseInputClass = "w-full mt-1 p-1.5 text-sm bg-gray-900 border border-gray-600 rounded-md focus:ring-1 focus:ring-cyan-500 outline-none transition-colors placeholder-gray-600";
const labelClass = "text-xs font-semibold text-gray-400 block";

export const StyledInput: React.FC<InputProps> = ({ label, className = "", ...props }) => (
    <div className={className}>
        {label && <label className={labelClass}>{label}</label>}
        <input className={baseInputClass} {...props} />
    </div>
);

export const StyledTextArea: React.FC<TextAreaProps> = ({ label, className = "", ...props }) => (
    <div className={className}>
        {label && <label className={labelClass}>{label}</label>}
        <textarea className={`${baseInputClass} resize-y`} {...props} />
    </div>
);

export const StyledSelect: React.FC<SelectProps> = ({ label, options, className = "", ...props }) => (
    <div className={className}>
        {label && <label className={labelClass}>{label}</label>}
        <select className={baseInputClass} {...props}>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

export const StyledRange: React.FC<InputProps> = ({ label, className = "", ...props }) => (
    <div className={className}>
        {label && <label className={labelClass}>{label}</label>}
        <input 
            type="range" 
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-1"
            {...props} 
        />
    </div>
);
