import React, { useEffect, useState } from 'react';

interface AlertProps {
    message: string;
    type: 'success' | 'error';
    duration?: number;
}

const Alert: React.FC<AlertProps> = ({ message, type, duration = 3000 }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    if (!isVisible) return null;

    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

    return (
        <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-md shadow-md transition-opacity duration-300`}>
            {message}
        </div>
    );
};

export default Alert;