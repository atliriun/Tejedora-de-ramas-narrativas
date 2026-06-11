
import React, { useState, useRef, useEffect } from 'react';

export const EditableProjectName: React.FC<{ name: string; onNameChange: (newName: string) => void; }> = ({ name, onNameChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentName, setCurrentName] = useState(name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCurrentName(name);
    }, [name]);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (currentName.trim()) {
            onNameChange(currentName.trim());
        } else {
            setCurrentName(name); // revert if empty
        }
        setIsEditing(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCurrentName(val);
        if (val.trim()) {
            onNameChange(val.trim());
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={currentName}
                onChange={handleChange}
                onBlur={handleSave}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        setIsEditing(false);
                    }
                    if (e.key === 'Escape') {
                        setCurrentName(name);
                        onNameChange(name);
                        setIsEditing(false);
                    }
                }}
                className="text-2xl font-bold bg-transparent border-b-2 border-cyan-500 text-cyan-400 outline-none w-full"
            />
        );
    }

    return (
        <h1
            onClick={() => setIsEditing(true)}
            className="text-2xl font-bold text-cyan-400 hover:bg-gray-700/50 rounded-md px-2 -mx-2 cursor-pointer transition-colors"
            title="Click to edit project name"
        >
            {name}
        </h1>
    );
};
