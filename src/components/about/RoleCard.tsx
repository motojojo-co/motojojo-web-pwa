import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface RoleCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}

export function RoleCard({ title, description, icon, onClick }: RoleCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer h-full flex flex-col"
    >
      <div className="w-12 h-12 rounded-full bg-raspberry/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 flex-grow">{description}</p>
      <div className="mt-4 text-raspberry font-medium flex items-center">
        Learn more
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 ml-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </motion.div>
  );
}
