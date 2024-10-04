import React from 'react';

interface HeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm }) => {
    return (
        <header className="bg-indigo-600 text-white p-4 shadow-lg">
            <div className="mx-auto flex justify-between items-center">
                <h1 className="text-3xl font-bold">Zero Kanban</h1>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search todos or tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 rounded-full text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-white transition duration-300 ease-in-out w-64"
                    />
                </div>
            </div>
        </header>
    );
};

export default Header;